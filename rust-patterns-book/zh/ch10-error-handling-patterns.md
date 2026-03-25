# 9. Error Handling Patterns 🟢<br><span class="zh-inline">9. 错误处理模式 🟢</span>

> **What you'll learn:**<br><span class="zh-inline">**本章将学到什么：**</span>
> - When to use `thiserror` (libraries) vs `anyhow` (applications)<br><span class="zh-inline">什么时候该用 `thiserror`，什么时候该用 `anyhow`</span>
> - Error conversion chains with `#[from]` and `.context()` wrappers<br><span class="zh-inline">如何用 `#[from]` 和 `.context()` 组织错误转换链</span>
> - How the `?` operator desugars and works in `main()`<br><span class="zh-inline">`?` 运算符如何反语法糖，以及它在 `main()` 里怎么工作</span>
> - When to panic vs return errors, and `catch_unwind` for FFI boundaries<br><span class="zh-inline">什么时候该 panic，什么时候该返回错误，以及如何在 FFI 边界用 `catch_unwind` 兜底</span>

## thiserror vs anyhow — Library vs Application<br><span class="zh-inline">`thiserror` 与 `anyhow`：库和应用的分工</span>

Rust error handling centers on the `Result<T, E>` type. Two crates dominate:<br><span class="zh-inline">Rust 的错误处理基本都围绕 `Result<T, E>` 展开，而最常见的两套工具就是下面这两种：</span>

```rust,ignore
// --- thiserror: For LIBRARIES ---
// Generates Display, Error, and From impls via derive macros
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("connection failed: {0}")]
    ConnectionFailed(String),

    #[error("query error: {source}")]
    QueryError {
        #[source]
        source: sqlx::Error,
    },

    #[error("record not found: table={table} id={id}")]
    NotFound { table: String, id: u64 },

    #[error(transparent)] // Delegate Display to the inner error
    Io(#[from] std::io::Error), // Auto-generates From<io::Error>
}

// --- anyhow: For APPLICATIONS ---
// Dynamic error type — great for top-level code where you just want errors to propagate
use anyhow::{Context, Result, bail, ensure};

fn read_config(path: &str) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read config from {path}"))?;

    let config: Config = serde_json::from_str(&content)
        .context("failed to parse config JSON")?;

    ensure!(config.port > 0, "port must be positive, got {}", config.port);

    Ok(config)
}

fn main() -> Result<()> {
    let config = read_config("server.toml")?;

    if config.name.is_empty() {
        bail!("server name cannot be empty"); // Return Err immediately
    }

    Ok(())
}
```

**When to use which**:<br><span class="zh-inline">**到底什么时候用哪个：**</span>

| | `thiserror` | `anyhow` |
|---|---|---|
| **Use in**<br><span class="zh-inline">使用场景</span> | Libraries, shared crates<br><span class="zh-inline">库、共享 crate</span> | Applications, binaries<br><span class="zh-inline">应用、可执行程序</span> |
| **Error types**<br><span class="zh-inline">错误类型</span> | Concrete enums — callers can match<br><span class="zh-inline">具体枚举，调用者可以精确匹配</span> | `anyhow::Error` — opaque<br><span class="zh-inline">`anyhow::Error`，更偏黑盒</span> |
| **Effort**<br><span class="zh-inline">实现成本</span> | Define your error enum<br><span class="zh-inline">需要自己定义错误枚举</span> | Just use `Result<T>`<br><span class="zh-inline">直接用 `Result<T>` 就行</span> |
| **Downcasting**<br><span class="zh-inline">向下转型</span> | Not needed — pattern match<br><span class="zh-inline">通常不需要，直接模式匹配</span> | `error.downcast_ref::<MyError>()`<br><span class="zh-inline">通过 `downcast_ref` 做运行时判断</span> |

### Error Conversion Chains (#[from])<br><span class="zh-inline">错误转换链与 `#[from]`</span>

```rust,ignore
use thiserror::Error;

#[derive(Error, Debug)]
enum AppError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
}

// Now ? automatically converts:
fn fetch_and_parse(url: &str) -> Result<Config, AppError> {
    let body = reqwest::blocking::get(url)?.text()?;  // reqwest::Error → AppError::Http
    let config: Config = serde_json::from_str(&body)?; // serde_json::Error → AppError::Json
    Ok(config)
}
```

### Context and Error Wrapping<br><span class="zh-inline">上下文与错误包装</span>

Add human-readable context to errors without losing the original:<br><span class="zh-inline">在不丢原始错误的前提下，再补一层人类能看懂的上下文：</span>

```rust,ignore
use anyhow::{Context, Result};

fn process_file(path: &str) -> Result<Data> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read {path}"))?;

    let data = parse_content(&content)
        .with_context(|| format!("failed to parse {path}"))?;

    validate(&data)
        .context("validation failed")?;

    Ok(data)
}

// Error output:
// Error: validation failed
//
// Caused by:
//    0: failed to parse config.json
//    1: expected ',' at line 5 column 12
```

### The ? Operator in Depth<br><span class="zh-inline">深入理解 `?` 运算符</span>

`?` is syntactic sugar for a `match` + `From` conversion + early return:<br><span class="zh-inline">`?` 本质上是 `match` 加 `From` 转换，再加提前返回的语法糖：</span>

```rust
// This:
let value = operation()?;

// Desugars to:
let value = match operation() {
    Ok(v) => v,
    Err(e) => return Err(From::from(e)),
    //                  ^^^^^^^^^^^^^^
    //                  Automatic conversion via From trait
};
```

**`?` also works with `Option`** (in functions returning `Option`):<br><span class="zh-inline">**`?` 对 `Option` 也一样适用**，前提是所在函数本身也返回 `Option`：</span>

```rust
fn find_user_email(users: &[User], name: &str) -> Option<String> {
    let user = users.iter().find(|u| u.name == name)?; // Returns None if not found
    let email = user.email.as_ref()?; // Returns None if email is None
    Some(email.to_uppercase())
}
```

### Panics, catch_unwind, and When to Abort<br><span class="zh-inline">panic、`catch_unwind` 与何时该中止</span>

```rust
// Panics: for BUGS, not expected errors
fn get_element(data: &[i32], index: usize) -> &i32 {
    // If this panics, it's a programming error (bug).
    // Don't "handle" it — fix the caller.
    &data[index]
}

// catch_unwind: for boundaries (FFI, thread pools)
use std::panic;

let result = panic::catch_unwind(|| {
    // Run potentially panicking code safely
    risky_operation()
});

match result {
    Ok(value) => println!("Success: {value:?}"),
    Err(_) => eprintln!("Operation panicked — continuing safely"),
}

// When to use which:
// - Result<T, E> → expected failures (file not found, network timeout)
// - panic!()     → programming bugs (index out of bounds, invariant violated)
// - process::abort() → unrecoverable state (security violation, corrupt data)
```

> **C++ comparison**: `Result<T, E>` replaces exceptions for expected errors. `panic!()` is like `assert()` or `std::terminate()` — it's for bugs, not control flow. Rust's `?` operator makes error propagation as ergonomic as exceptions without the unpredictable control flow.<br><span class="zh-inline">**和 C++ 对比来看**：`Result<T, E>` 承担的是“预期错误”的角色，可以把它看成异常机制的显式替代；`panic!()` 更接近 `assert()` 或 `std::terminate()`，它是拿来表示 bug 的，不是正常控制流的一部分。Rust 的 `?` 则在保留可预测控制流的同时，把错误传播写得足够顺手。</span>

> **Key Takeaways — Error Handling**<br><span class="zh-inline">**本章要点：错误处理**</span>
> - Libraries: `thiserror` for structured error enums; applications: `anyhow` for ergonomic propagation<br><span class="zh-inline">库里优先用 `thiserror` 组织结构化错误枚举；应用里更适合用 `anyhow` 做顺手的错误传播。</span>
> - `#[from]` auto-generates `From` impls; `.context()` adds human-readable wrappers<br><span class="zh-inline">`#[from]` 会自动生成 `From` 实现，而 `.context()` 负责补充人类可读的上下文。</span>
> - `?` desugars to `From::from()` + early return; works in `main()` returning `Result`<br><span class="zh-inline">`?` 会展开成 `From::from()` 加提前返回，而且在返回 `Result` 的 `main()` 里一样能用。</span>

> **See also:** [Ch 15 — API Design](ch15-crate-architecture-and-api-design.md) for "parse, don't validate" patterns. [Ch 11 — Serialization](ch11-serialization-zero-copy-and-binary-data.md) for serde error handling.<br><span class="zh-inline">**继续阅读：** [第 15 章：API 设计](ch15-crate-architecture-and-api-design.md) 会讲“parse, don't validate”；[第 11 章：序列化](ch11-serialization-zero-copy-and-binary-data.md) 会讲 serde 相关的错误处理。</span>

```mermaid
flowchart LR
    A["std::io::Error"] -->|"#[from]"| B["AppError::Io"]
    C["serde_json::Error"] -->|"#[from]"| D["AppError::Json"]
    E["Custom validation"] -->|"manual"| F["AppError::Validation"]

    B --> G["? operator"]
    D --> G
    F --> G
    G --> H["Result&lt;T, AppError&gt;"]

    style A fill:#e8f4f8,stroke:#2980b9,color:#000
    style C fill:#e8f4f8,stroke:#2980b9,color:#000
    style E fill:#e8f4f8,stroke:#2980b9,color:#000
    style B fill:#fdebd0,stroke:#e67e22,color:#000
    style D fill:#fdebd0,stroke:#e67e22,color:#000
    style F fill:#fdebd0,stroke:#e67e22,color:#000
    style G fill:#fef9e7,stroke:#f1c40f,color:#000
    style H fill:#d4efdf,stroke:#27ae60,color:#000
```

---

### Exercise: Error Hierarchy with thiserror ★★ (~30 min)<br><span class="zh-inline">练习：用 `thiserror` 设计错误层级 ★★（约 30 分钟）</span>

Design an error type hierarchy for a file-processing application that can fail during I/O, parsing (JSON and CSV), and validation. Use `thiserror` and demonstrate `?` propagation.<br><span class="zh-inline">为一个文件处理应用设计一套错误类型层级。这个应用可能在 I/O、解析（JSON 和 CSV）以及校验阶段失败。要求使用 `thiserror`，并演示 `?` 的错误传播。</span>

<details>
<summary>🔑 Solution <span class="zh-inline">🔑 参考答案</span></summary>

```rust,ignore
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON parse error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("CSV error at line {line}: {message}")]
    Csv { line: usize, message: String },

    #[error("validation error: {field} — {reason}")]
    Validation { field: String, reason: String },
}

fn read_file(path: &str) -> Result<String, AppError> {
    Ok(std::fs::read_to_string(path)?) // io::Error → AppError::Io via #[from]
}

fn parse_json(content: &str) -> Result<serde_json::Value, AppError> {
    Ok(serde_json::from_str(content)?) // serde_json::Error → AppError::Json
}

fn validate_name(value: &serde_json::Value) -> Result<String, AppError> {
    let name = value.get("name")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::Validation {
            field: "name".into(),
            reason: "must be a non-null string".into(),
        })?;

    if name.is_empty() {
        return Err(AppError::Validation {
            field: "name".into(),
            reason: "must not be empty".into(),
        });
    }

    Ok(name.to_string())
}

fn process_file(path: &str) -> Result<String, AppError> {
    let content = read_file(path)?;
    let json = parse_json(&content)?;
    let name = validate_name(&json)?;
    Ok(name)
}

fn main() {
    match process_file("config.json") {
        Ok(name) => println!("Name: {name}"),
        Err(e) => eprintln!("Error: {e}"),
    }
}
```

</details>

***
