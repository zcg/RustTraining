# Rust Option and Result key takeaways<br><span class="zh-inline">Rust 里 `Option` 与 `Result` 的关键结论</span>

> **What you'll learn:** Idiomatic error handling patterns — safe alternatives to `unwrap()`, the `?` operator for propagation, custom error types, and when to use `anyhow` vs `thiserror` in production code.<br><span class="zh-inline">**本章将学到什么：** 惯用的错误处理模式，`unwrap()` 的安全替代方案，`?` 的错误传播方式，自定义错误类型的设计，以及生产代码里什么时候该用 `anyhow`、什么时候该用 `thiserror`。</span>

- `Option` and `Result` are an integral part of idiomatic Rust.<br><span class="zh-inline">`Option` 和 `Result` 是 Rust 惯用写法的核心组成部分。</span>
- **Safe alternatives to `unwrap()`**:<br><span class="zh-inline">**`unwrap()` 的安全替代方案：**</span>

```rust
// Option<T> safe alternatives
// Option<T> 的安全替代写法
let value = opt.unwrap_or(default);               // Provide fallback value
let value = opt.unwrap_or_else(|| compute());     // Lazy computation for fallback
let value = opt.unwrap_or_default();              // Use Default trait implementation
let value = opt.expect("descriptive message");    // Only when panic is acceptable

// Result<T, E> safe alternatives
// Result<T, E> 的安全替代写法
let value = result.unwrap_or(fallback);           // Ignore error, use fallback
let value = result.unwrap_or_else(|e| handle(e)); // Handle error, return fallback
let value = result.unwrap_or_default();           // Use Default trait
```

- **Pattern matching for explicit control**:<br><span class="zh-inline">**需要显式控制时，用模式匹配：**</span>

```rust
match some_option {
    Some(value) => println!("Got: {}", value),
    None => println!("No value found"),
}

match some_result {
    Ok(value) => process(value),
    Err(error) => log_error(error),
}
```

- **Use `?` operator for error propagation**: Short-circuit and bubble up errors.<br><span class="zh-inline">**用 `?` 传播错误**：遇到错误立刻短路，并把错误往上返回。</span>

```rust
fn process_file(path: &str) -> Result<String, std::io::Error> {
    let content = std::fs::read_to_string(path)?; // Automatically returns error
    Ok(content.to_uppercase())
}
```

- **Transformation methods**:<br><span class="zh-inline">**常见变换方法：**</span>
  - `map()`: Transform the success value `Ok(T)` -> `Ok(U)` or `Some(T)` -> `Some(U)`<br><span class="zh-inline">`map()`：变换成功值，把 `Ok(T)` 变成 `Ok(U)`，或者把 `Some(T)` 变成 `Some(U)`。</span>
  - `map_err()`: Transform the error type `Err(E)` -> `Err(F)`<br><span class="zh-inline">`map_err()`：变换错误类型，把 `Err(E)` 变成 `Err(F)`。</span>
  - `and_then()`: Chain operations that can fail<br><span class="zh-inline">`and_then()`：把一串可能失败的操作接起来。</span>
- **Use in your own APIs**: Prefer `Result<T, E>` over exceptions or error codes.<br><span class="zh-inline">**写自己的 API 时**，优先返回 `Result<T, E>`，别把异常和错误码那套老习惯又拖回来。</span>
- **References**: [Option docs](https://doc.rust-lang.org/std/option/enum.Option.html) | [Result docs](https://doc.rust-lang.org/std/result/enum.Result.html)<br><span class="zh-inline">**参考资料：** [Option 文档](https://doc.rust-lang.org/std/option/enum.Option.html) | [Result 文档](https://doc.rust-lang.org/std/result/enum.Result.html)</span>

# Rust Common Pitfalls and Debugging Tips<br><span class="zh-inline">Rust 常见误区与排查提示</span>

- **Borrowing issues**: Most common beginner mistake.<br><span class="zh-inline">**借用问题**：这是新手最常踩的一类错误。</span>
  - `"cannot borrow as mutable"` -> Only one mutable reference allowed at a time<br><span class="zh-inline">`"cannot borrow as mutable"`：同一时间只允许存在一个可变引用。</span>
  - `"borrowed value does not live long enough"` -> Reference outlives the data it points to<br><span class="zh-inline">`"borrowed value does not live long enough"`：引用活得比它指向的数据还久。</span>
  - **Fix**: Use scopes `{}` to limit reference lifetimes, or clone data when needed.<br><span class="zh-inline">**处理方式：** 用 `{}` 缩短引用作用域，或者在确实有必要时复制数据。</span>
- **Missing trait implementations**: `"method not found"` errors.<br><span class="zh-inline">**缺少 trait 实现**：经常会炸出 `"method not found"` 这种报错。</span>
  - **Fix**: Add `#[derive(Debug, Clone, PartialEq)]` for common traits.<br><span class="zh-inline">**处理方式：** 常用 trait 可以先补上 `#[derive(Debug, Clone, PartialEq)]`。</span>
  - Use `cargo check` to get better error messages than `cargo run`.<br><span class="zh-inline">`cargo check` 给出的错误通常比 `cargo run` 更聚焦。</span>
- **Integer overflow in debug mode**: Rust panics on overflow.<br><span class="zh-inline">**调试模式下整数溢出**：Rust 遇到溢出会直接 panic。</span>
  - **Fix**: Use `wrapping_add()`, `saturating_add()`, or `checked_add()` for explicit behavior.<br><span class="zh-inline">**处理方式：** 用 `wrapping_add()`、`saturating_add()` 或 `checked_add()` 明确指定溢出语义。</span>
- **String vs `&str` confusion**: Different types for different use cases.<br><span class="zh-inline">**`String` 和 `&str` 容易搞混**：两者本来就是给不同场景准备的。</span>
  - Use `&str` for string slices (borrowed), `String` for owned strings.<br><span class="zh-inline">`&str` 适合借用的字符串切片，`String` 适合拥有所有权的字符串。</span>
  - **Fix**: Use `.to_string()` or `String::from()` to convert `&str` to `String`.<br><span class="zh-inline">**处理方式：** 用 `.to_string()` 或 `String::from()` 把 `&str` 转成 `String`。</span>
- **Fighting the borrow checker**: Stop trying to outsmart it.<br><span class="zh-inline">**跟借用检查器对着干**：这事十有八九干不过，别硬拧。</span>
  - **Fix**: Restructure code to work with ownership rules rather than against them.<br><span class="zh-inline">**处理方式：** 调整代码结构，让它顺着所有权规则走。</span>
  - Consider using `Rc<RefCell<T>>` for complex sharing scenarios, but use it sparingly.<br><span class="zh-inline">特别复杂的共享场景可以考虑 `Rc<RefCell<T>>`，但用多了代码就容易发黏。</span>

## Error Handling Examples: Good vs Bad<br><span class="zh-inline">错误处理示例：好写法与坏写法</span>

```rust
// [ERROR] BAD: Can panic unexpectedly
// [ERROR] 坏写法：随时可能猝不及防地 panic
fn bad_config_reader() -> String {
    let config = std::env::var("CONFIG_FILE").unwrap(); // Panic if not set!
    std::fs::read_to_string(config).unwrap()           // Panic if file missing!
}

// [OK] GOOD: Handles errors gracefully
// [OK] 好写法：对错误做了正常处理
fn good_config_reader() -> Result<String, ConfigError> {
    let config_path = std::env::var("CONFIG_FILE")
        .unwrap_or_else(|_| "default.conf".to_string()); // Fallback to default
    
    let content = std::fs::read_to_string(config_path)
        .map_err(ConfigError::FileRead)?;                // Convert and propagate error
    
    Ok(content)
}

// [OK] EVEN BETTER: With proper error types
// [OK] 更进一步：定义清楚的错误类型
use thiserror::Error;

#[derive(Error, Debug)]
enum ConfigError {
    #[error("Failed to read config file: {0}")]
    FileRead(#[from] std::io::Error),
    
    #[error("Invalid configuration: {message}")]
    Invalid { message: String },
}
```

Let's break down what's happening here. `ConfigError` has just **two variants** — one for I/O errors and one for validation errors. This is the right starting point for most modules:<br><span class="zh-inline">拆开看一下这里的意思。`ConfigError` 只有 **两个变体**，一个表示 I/O 错误，一个表示校验错误。对大多数模块来说，这样的起步规模就够用了。</span>

| `ConfigError` variant<br><span class="zh-inline">`ConfigError` 变体</span> | Holds<br><span class="zh-inline">保存内容</span> | Created by<br><span class="zh-inline">创建来源</span> |
|----------------------|-------|-----------|
| `FileRead(io::Error)` | The original I/O error<br><span class="zh-inline">原始 I/O 错误</span> | `#[from]` auto-converts via `?`<br><span class="zh-inline">通过 `#[from]` 配合 `?` 自动转换</span> |
| `Invalid { message }` | A human-readable explanation<br><span class="zh-inline">给人看的说明文本</span> | Your validation code<br><span class="zh-inline">业务校验逻辑自己构造</span> |

Now you can write functions that return `Result<T, ConfigError>`:<br><span class="zh-inline">这样后面的函数就可以统一返回 `Result<T, ConfigError>`：</span>

```rust
fn read_config(path: &str) -> Result<String, ConfigError> {
    let content = std::fs::read_to_string(path)?;  // io::Error → ConfigError::FileRead
    if content.is_empty() {
        return Err(ConfigError::Invalid {
            message: "config file is empty".to_string(),
        });
    }
    Ok(content)
}
```

> **🟢 Self-study checkpoint:** Before continuing, make sure you can answer:<br><span class="zh-inline">**🟢 自测检查点：** 继续往下之前，先确认下面两个问题能答上来：</span>
> 1. Why does `?` on the `read_to_string` call work? (Because `#[from]` generates `impl From<io::Error> for ConfigError`.)<br><span class="zh-inline">1. 为什么 `read_to_string` 后面的 `?` 能直接工作？因为 `#[from]` 会生成 `impl From<io::Error> for ConfigError`。</span>
> 2. What happens if you add a third variant `MissingKey(String)` — what code changes? (Usually just add the variant; existing code still compiles.)<br><span class="zh-inline">2. 如果再加一个 `MissingKey(String)` 变体，需要改什么？通常只要把变体加上，已有代码还是能继续编译。</span>

## Crate-Level Error Types and Result Aliases<br><span class="zh-inline">crate 级错误类型与 `Result` 别名</span>

As the project grows beyond a single file, multiple module-level errors usually need to be merged into a **crate-level error type**. This is the standard production pattern in Rust.<br><span class="zh-inline">项目一旦超过单文件玩具规模，就会出现多个模块各自报错的情况。这时通常要把它们并进一个 **crate 级错误类型** 里，这就是生产代码里最常见的写法。</span>

In real-world Rust projects, every crate or major module often defines its own `Error` enum and a `Result` type alias. This is idiomatic Rust, and in spirit it resembles defining a per-library exception hierarchy plus `using Result = std::expected<T, Error>` in modern C++.<br><span class="zh-inline">现实里的 Rust 项目通常会给每个 crate，或者至少每个重要模块，定义自己的 `Error` 枚举，再顺手配一个 `Result` 类型别名。这就是惯用法。类比到现代 C++，差不多就是给每个库准备一套异常层级，再写一个 `using Result = std::expected<T, Error>`。</span>

### The pattern<br><span class="zh-inline">基本模式</span>

```rust
// src/error.rs  (or at the top of lib.rs)
use thiserror::Error;

/// Every error this crate can produce.
#[derive(Error, Debug)]
pub enum Error {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),          // auto-converts via From

    #[error("JSON parse error: {0}")]
    Json(#[from] serde_json::Error),     // auto-converts via From

    #[error("Invalid sensor id: {0}")]
    InvalidSensor(u32),                  // domain-specific variant

    #[error("Timeout after {ms} ms")]
    Timeout { ms: u64 },
}

/// Crate-wide Result alias — saves typing throughout the crate.
pub type Result<T> = core::result::Result<T, Error>;
```

### How it simplifies every function<br><span class="zh-inline">它如何让每个函数都清爽很多</span>

Without the alias, every signature needs to repeat the full error type:<br><span class="zh-inline">没有别名时，每个函数签名都得重复一遍完整错误类型：</span>

```rust
// Verbose — error type repeated everywhere
fn read_sensor(id: u32) -> Result<f64, crate::Error> { ... }
fn parse_config(path: &str) -> Result<Config, crate::Error> { ... }
```

With the alias, the signatures become much cleaner:<br><span class="zh-inline">有了别名以后，签名立刻干净一大截：</span>

```rust
// Clean — just `Result<T>`
use crate::{Error, Result};

fn read_sensor(id: u32) -> Result<f64> {
    if id > 128 {
        return Err(Error::InvalidSensor(id));
    }
    let raw = std::fs::read_to_string(format!("/dev/sensor/{id}"))?; // io::Error → Error::Io
    let value: f64 = raw.trim().parse()
        .map_err(|_| Error::InvalidSensor(id))?;
    Ok(value)
}
```

The `#[from]` attribute on `Io` generates the following `impl` automatically:<br><span class="zh-inline">`Io` 变体上的 `#[from]` 会自动生成下面这样的 `impl`：</span>

```rust
// Auto-generated by thiserror's #[from]
impl From<std::io::Error> for Error {
    fn from(source: std::io::Error) -> Self {
        Error::Io(source)
    }
}
```

That is why `?` works. When the inner call returns `std::io::Error` but the outer function returns `Result<T>` using the alias, the compiler inserts `From::from()` and converts the error automatically.<br><span class="zh-inline">这就是 `?` 能工作的根本原因。内层返回 `std::io::Error`，外层函数返回的是别名 `Result<T>`，编译器会在中间自动插入 `From::from()` 完成转换。</span>

### Composing module-level errors<br><span class="zh-inline">把模块级错误拼成 crate 级错误</span>

Larger crates often define errors per module and compose them at the crate root:<br><span class="zh-inline">规模再大一点的 crate，通常会让每个模块先定义自己的错误，然后在 crate 根部统一汇总：</span>

```rust
// src/config/error.rs
#[derive(thiserror::Error, Debug)]
pub enum ConfigError {
    #[error("Missing key: {0}")]
    MissingKey(String),
    #[error("Invalid value for '{key}': {reason}")]
    InvalidValue { key: String, reason: String },
}

// src/error.rs  (crate-level)
#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error(transparent)]               // delegates Display to inner error
    Config(#[from] crate::config::ConfigError),

    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}
pub type Result<T> = core::result::Result<T, Error>;
```

Callers can still match on specific configuration errors:<br><span class="zh-inline">即便统一到了 crate 级错误，调用者依然可以继续匹配具体的配置错误：</span>

```rust
match result {
    Err(Error::Config(ConfigError::MissingKey(k))) => eprintln!("Add '{k}' to config"),
    Err(e) => eprintln!("Other error: {e}"),
    Ok(v) => use_value(v),
}
```

### C++ comparison<br><span class="zh-inline">和 C++ 的对照</span>

| Concept<br><span class="zh-inline">概念</span> | C++ | Rust |
|---------|-----|------|
| Error hierarchy<br><span class="zh-inline">错误层级</span> | `class AppError : public std::runtime_error` | `#[derive(thiserror::Error)] enum Error { ... }` |
| Return error<br><span class="zh-inline">返回错误</span> | `std::expected<T, Error>` or `throw` | `fn foo() -> Result<T>` |
| Convert error<br><span class="zh-inline">错误转换</span> | Manual `try/catch` + rethrow<br><span class="zh-inline">手写 `try/catch` 再重新抛出</span> | `#[from]` + `?` — zero boilerplate<br><span class="zh-inline">`#[from]` 配合 `?`，几乎不用样板代码</span> |
| Result alias<br><span class="zh-inline">`Result` 别名</span> | `template<class T> using Result = std::expected<T, Error>;` | `pub type Result<T> = core::result::Result<T, Error>;` |
| Error message<br><span class="zh-inline">错误消息</span> | Override `what()`<br><span class="zh-inline">重写 `what()`</span> | `#[error("...")]` — compiled into `Display` impl<br><span class="zh-inline">`#[error("...")]` 会生成 `Display` 实现</span> |

***
