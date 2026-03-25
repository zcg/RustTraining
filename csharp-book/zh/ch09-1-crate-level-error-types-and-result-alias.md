## Crate-Level Error Types and Result Aliases<br><span class="zh-inline">crate 级错误类型与 `Result` 别名</span>

> **What you'll learn:** The production pattern of defining a per-crate error enum with `thiserror`, creating a `Result<T>` type alias, and when to choose `thiserror` (libraries) vs `anyhow` (applications).<br><span class="zh-inline">**本章将学到什么：** 在生产代码里如何为每个 crate 定义统一错误枚举，如何配合 `thiserror` 和 `Result<T>` 别名减掉样板代码，以及 `thiserror` 和 `anyhow` 到底该怎么选。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 进阶</span>

A critical pattern for production Rust: define a per-crate error enum and a `Result` type alias to eliminate boilerplate.<br><span class="zh-inline">生产级 Rust 里有个特别重要的套路：给当前 crate 定义一个统一错误枚举，再配一个 `Result` 类型别名。这样错误处理会规整很多，也能少写一堆重复签名。</span>

### The Pattern<br><span class="zh-inline">基本模式</span>

```rust
// src/error.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Validation error: {message}")]
    Validation { message: String },

    #[error("Not found: {entity} with id {id}")]
    NotFound { entity: String, id: String },
}

/// Crate-wide Result alias — every function returns this
pub type Result<T> = std::result::Result<T, AppError>;
```

这个模式的重点，是把“项目里到底可能出哪些业务错误、依赖错误、边界错误”统一摆到一个中心位置。<br><span class="zh-inline">这样后面无论是数据库模块、HTTP 模块还是序列化模块，错误最终都会往同一套领域错误里收，不会每个地方各写各的口径。</span>

### Usage Throughout Your Crate<br><span class="zh-inline">在整个 crate 里统一使用</span>

```rust
use crate::error::{AppError, Result};

pub async fn get_user(id: Uuid) -> Result<User> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?;  // sqlx::Error → AppError::Database via #[from]

    user.ok_or_else(|| AppError::NotFound {
        entity: "User".into(),
        id: id.to_string(),
    })
}

pub async fn create_user(req: CreateUserRequest) -> Result<User> {
    if req.name.trim().is_empty() {
        return Err(AppError::Validation {
            message: "Name cannot be empty".into(),
        });
    }
    // ...
}
```

这里 `#[from]` 的价值非常大。它让 `?` 不只是“提前返回错误”，还顺手完成了“底层库错误自动映射到上层错误类型”这一步。<br><span class="zh-inline">也就是说，`sqlx::Error`、`reqwest::Error`、`serde_json::Error` 这种底层错误可以自然抬升成当前 crate 的公共错误模型，代码会干净很多。</span>

### C# Comparison<br><span class="zh-inline">和 C# 的对照</span>

```csharp
// C# equivalent pattern
public class AppException : Exception
{
    public string ErrorCode { get; }
    public AppException(string code, string message) : base(message)
    {
        ErrorCode = code;
    }
}

// But in C#, callers don't know what exceptions to expect!
// In Rust, the error type is in the function signature.
```

这就是 Rust 和 C# 错误模型一个非常显眼的差别。C# 里可以定义一堆异常类型，但调用方从函数签名里通常看不出具体会抛什么。<br><span class="zh-inline">Rust 则把错误类型老老实实写进签名里，谁调用，谁就得明确面对这件事。没有“先跑起来再说，出问题靠异常满天飞”那种模糊地带。</span>

### Why This Matters<br><span class="zh-inline">为什么这一套很重要</span>

- **`thiserror`** generates `Display` and `Error` impls automatically<br><span class="zh-inline">**`thiserror`** 会自动生成 `Display` 和 `Error` 实现。</span>
- **`#[from]`** enables the `?` operator to convert library errors automatically<br><span class="zh-inline">**`#[from]`** 让 `?` 可以自动完成底层错误到上层错误的转换。</span>
- The `Result<T>` alias means every function signature is clean: `fn foo() -> Result<Bar>`<br><span class="zh-inline">`Result<T>` 别名能让函数签名更干净，例如直接写成 `fn foo() -> Result<Bar>`。</span>
- **Unlike C# exceptions**, callers see all possible error variants in the type<br><span class="zh-inline">**和 C# 异常不同**，调用方能从类型里直接看到错误模型的边界。</span>

这种统一错误模型，带来的不只是“好看”。它会直接影响 API 可读性、模块边界、测试编写方式以及后续日志和监控上报的一致性。<br><span class="zh-inline">项目一旦变大，没有统一错误层，后面十有八九会变成一锅粥。</span>

### `thiserror` vs `anyhow`: When to Use Which<br><span class="zh-inline">`thiserror` 和 `anyhow` 到底怎么选</span>

Two crates dominate Rust error handling. Choosing between them is the first decision you'll make:<br><span class="zh-inline">Rust 错误处理里最常见的两套工具就是 `thiserror` 和 `anyhow`。很多项目一上来就得先做这个选择：</span>

| | `thiserror` | `anyhow` |
|---|---|---|
| **Purpose**<br><span class="zh-inline">用途</span> | Define structured error types for **libraries**<br><span class="zh-inline">给**库**定义结构化错误类型</span> | Quick error handling for **applications**<br><span class="zh-inline">给**应用**快速处理错误</span> |
| **Output**<br><span class="zh-inline">输出形态</span> | Custom enum you control<br><span class="zh-inline">自己定义、自己掌控的错误枚举</span> | Opaque `anyhow::Error` wrapper<br><span class="zh-inline">不透明的 `anyhow::Error` 包装器</span> |
| **Caller sees**<br><span class="zh-inline">调用方能看到什么</span> | All error variants in the type<br><span class="zh-inline">错误变体都体现在类型里</span> | Just `anyhow::Error` — opaque<br><span class="zh-inline">只看到 `anyhow::Error`，细节被包起来了</span> |
| **Best for**<br><span class="zh-inline">更适合</span> | Library crates, APIs, any code with consumers<br><span class="zh-inline">库 crate、API、会被别人调用的代码</span> | Binaries, scripts, prototypes, CLI tools<br><span class="zh-inline">二进制程序、脚本、原型、CLI 工具</span> |
| **Downcasting**<br><span class="zh-inline">向下还原</span> | `match` on variants directly<br><span class="zh-inline">直接 `match` 错误变体</span> | `error.downcast_ref::<MyError>()`<br><span class="zh-inline">需要手动 downcast</span> |

```rust
// thiserror — for LIBRARIES (callers need to match on error variants)
use thiserror::Error;

#[derive(Error, Debug)]
pub enum StorageError {
    #[error("File not found: {path}")]
    NotFound { path: String },

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error(transparent)]
    Io(#[from] std::io::Error),
}

pub fn read_config(path: &str) -> Result<String, StorageError> {
    std::fs::read_to_string(path).map_err(|e| match e.kind() {
        std::io::ErrorKind::NotFound => StorageError::NotFound { path: path.into() },
        std::io::ErrorKind::PermissionDenied => StorageError::PermissionDenied(path.into()),
        _ => StorageError::Io(e),
    })
}
```

```rust
// anyhow — for APPLICATIONS (just propagate errors, don't define types)
use anyhow::{Context, Result};

fn main() -> Result<()> {
    let config = std::fs::read_to_string("config.toml")
        .context("Failed to read config file")?;

    let port: u16 = config.parse()
        .context("Failed to parse port number")?;

    println!("Listening on port {port}");
    Ok(())
}
// anyhow::Result<T> = Result<T, anyhow::Error>
// .context() adds human-readable context to any error
```

```csharp
// C# comparison:
// thiserror ≈ defining custom exception classes with specific properties
// anyhow ≈ catching Exception and wrapping with message:
//   throw new InvalidOperationException("Failed to read config", ex);
```

**Guideline**: If your code is a **library** (other code calls it), use `thiserror`. If your code is an **application** (the final binary), use `anyhow`. Many projects use both — `thiserror` for the library crate's public API, `anyhow` in the `main()` binary.<br><span class="zh-inline">**经验建议：** 如果代码是**库**，也就是会被别的代码依赖调用，优先用 `thiserror`；如果代码是最终**应用程序**，尤其是 `main()` 侧，优先用 `anyhow`。很多真实项目会两者一起用：库层暴露结构化错误，应用层用 `anyhow` 汇总和补充上下文。</span>

### Error Recovery Patterns<br><span class="zh-inline">错误恢复模式</span>

C# developers are used to `try/catch` blocks that recover from specific exceptions. Rust uses combinators on `Result` for the same purpose:<br><span class="zh-inline">C# 开发者比较熟的是 `try/catch`。Rust 没有那套异常机制，常见替代写法是围着 `Result` 做组合和转换：</span>

```rust
use std::fs;

// Pattern 1: Recover with a fallback value
let config = fs::read_to_string("config.toml")
    .unwrap_or_else(|_| String::from("port = 8080"));  // default if missing

// Pattern 2: Recover from specific errors, propagate others
fn read_or_create(path: &str) -> Result<String, std::io::Error> {
    match fs::read_to_string(path) {
        Ok(content) => Ok(content),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            let default = String::from("# new file");
            fs::write(path, &default)?;
            Ok(default)
        }
        Err(e) => Err(e),  // propagate permission errors, etc.
    }
}

// Pattern 3: Add context before propagating
use anyhow::Context;

fn load_config() -> anyhow::Result<Config> {
    let text = fs::read_to_string("config.toml")
        .context("Failed to read config.toml")?;
    let config: Config = toml::from_str(&text)
        .context("Failed to parse config.toml")?;
    Ok(config)
}

// Pattern 4: Map errors to your domain type
fn parse_port(s: &str) -> Result<u16, AppError> {
    s.parse::<u16>()
        .map_err(|_| AppError::Validation {
            message: format!("Invalid port: {s}"),
        })
}
```

```csharp
// C# equivalents:
try { config = File.ReadAllText("config.toml"); }
catch (FileNotFoundException) { config = "port = 8080"; }  // Pattern 1

try { /* ... */ }
catch (FileNotFoundException) { /* create file */ }        // Pattern 2
catch { throw; }                                            // re-throw others
```

**When to recover vs propagate:**<br><span class="zh-inline">**什么时候恢复，什么时候继续上抛：**</span>

- **Recover** when the error has a sensible default or retry strategy<br><span class="zh-inline">有合理默认值或重试策略时，可以就地恢复。</span>
- **Propagate with `?`** when the *caller* should decide what to do<br><span class="zh-inline">如果该由调用方决定后续行为，就用 `?` 往上抛。</span>
- **Add context** (`.context()`) at module boundaries to build an error trail<br><span class="zh-inline">跨模块边界时最好补上 `.context()`，把错误链说明白。</span>

Rust 这套错误恢复方式乍看没有异常那么“潇洒”，但它的优点是路径透明。恢复逻辑、映射逻辑、补上下文的时机，全都明明白白写在代码里。<br><span class="zh-inline">项目越复杂，这种显式性越值钱。</span>

---

## Exercises<br><span class="zh-inline">练习</span>

<details>
<summary><strong>🏋️ Exercise: Design a Crate Error Type</strong> <span class="zh-inline">🏋️ 练习：设计一个 crate 错误类型</span></summary>

You're building a user registration service. Design the error type using `thiserror`:<br><span class="zh-inline">假设正在写一个用户注册服务，请用 `thiserror` 设计错误类型：</span>

1. Define `RegistrationError` with variants: `DuplicateEmail(String)`, `WeakPassword(String)`, `DatabaseError(#[from] sqlx::Error)`, `RateLimited { retry_after_secs: u64 }`<br><span class="zh-inline">1. 定义 `RegistrationError`，包含这些变体：`DuplicateEmail(String)`、`WeakPassword(String)`、`DatabaseError(#[from] sqlx::Error)`、`RateLimited { retry_after_secs: u64 }`。</span>
2. Create a `type Result<T> = std::result::Result<T, RegistrationError>;` alias<br><span class="zh-inline">2. 创建 `type Result<T> = std::result::Result<T, RegistrationError>;` 别名。</span>
3. Write a `register_user(email: &str, password: &str) -> Result<()>` that demonstrates `?` propagation and explicit error construction<br><span class="zh-inline">3. 写一个 `register_user(email: &str, password: &str) -> Result<()>`，同时演示 `?` 的自动传播和手工构造领域错误。</span>

<details>
<summary>🔑 Solution <span class="zh-inline">🔑 参考答案</span></summary>

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum RegistrationError {
    #[error("Email already registered: {0}")]
    DuplicateEmail(String),

    #[error("Password too weak: {0}")]
    WeakPassword(String),

    #[error("Database error")]
    Database(#[from] sqlx::Error),

    #[error("Rate limited — retry after {retry_after_secs}s")]
    RateLimited { retry_after_secs: u64 },
}

pub type Result<T> = std::result::Result<T, RegistrationError>;

pub fn register_user(email: &str, password: &str) -> Result<()> {
    if password.len() < 8 {
        return Err(RegistrationError::WeakPassword(
            "must be at least 8 characters".into(),
        ));
    }

    // This ? converts sqlx::Error → RegistrationError::Database automatically
    // db.check_email_unique(email).await?;

    // This is explicit construction for domain logic
    if email.contains("+spam") {
        return Err(RegistrationError::DuplicateEmail(email.to_string()));
    }

    Ok(())
}
```

**Key pattern**: `#[from]` enables `?` for library errors; explicit `Err(...)` for domain logic. The Result alias keeps every signature clean.<br><span class="zh-inline">**关键模式：** `#[from]` 负责接住底层库错误，让 `?` 顺畅工作；显式 `Err(...)` 则负责表达业务规则错误。`Result` 别名则能把每个函数签名压得更整齐。</span>

</details>
</details>

***
