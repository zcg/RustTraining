## Error Handling<br><span class="zh-inline">错误处理</span>

> **What you'll learn:** How `Result` changes API design, how Rust error propagation compares to Java exceptions, and when to use domain-specific error types.<br><span class="zh-inline">**本章将学习：** `Result` 会怎样改变 API 设计、Rust 的错误传播和 Java 异常机制有什么根本区别，以及什么时候该用领域错误类型。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Rust pushes errors into the type system. That changes design decisions much earlier than Java developers are used to.<br><span class="zh-inline">Rust 会把错误直接推进类型系统里，这会比 Java 开发者习惯的时机更早地影响 API 设计。</span>

## Exceptions vs `Result`<br><span class="zh-inline">异常与 `Result`</span>

```java
User loadUser(long id) throws IOException {
    // caller must read documentation or signatures carefully
}
```

```rust
fn load_user(id: u64) -> Result<User, LoadUserError> {
    // the error type is part of the return value
}
```

In Java, exceptions separate the main return type from the failure path. In Rust, success and failure sit next to each other in the function signature.<br><span class="zh-inline">在 Java 里，异常把主返回值和失败路径拆开了；在 Rust 里，成功和失败会并排体现在函数签名里。</span>

## The `?` Operator<br><span class="zh-inline">`?` 运算符</span>

```rust
fn load_config(path: &str) -> Result<String, std::io::Error> {
    let text = std::fs::read_to_string(path)?;
    Ok(text)
}
```

`?` is the standard way to propagate an error upward without writing repetitive `match` blocks everywhere.<br><span class="zh-inline">`?` 是向上传播错误的标准写法，可以省掉一堆重复的 `match` 样板。</span>

## Domain Error Enums<br><span class="zh-inline">领域错误枚举</span>

```rust
#[derive(Debug, thiserror::Error)]
enum LoadUserError {
    #[error("database error: {0}")]
    Database(String),
    #[error("user {0} not found")]
    NotFound(u64),
}
```

For Java developers, this often replaces a hierarchy of custom exceptions with one explicit sum type.<br><span class="zh-inline">对 Java 开发者来说，这通常意味着：原来那种自定义异常层级，会被一个显式的错误和类型替掉。</span>

## `Option` vs `Result`<br><span class="zh-inline">`Option` 与 `Result`</span>

Use `Option<T>` when absence is normal. Use `Result<T, E>` when failure carries explanation or needs handling.<br><span class="zh-inline">“值不存在”本来就是正常情况时，用 `Option<T>`；失败需要解释、需要处理时，用 `Result<T, E>`。</span>

## Practical Advice<br><span class="zh-inline">实战建议</span>

- Avoid `unwrap()` in real application paths.<br><span class="zh-inline">真实应用路径里尽量别滥用 `unwrap()`。</span>
- Start with simple error enums before reaching for generalized error wrappers.<br><span class="zh-inline">先从简单错误枚举起步，再考虑通用错误包装。</span>
- Let library APIs be precise; let application entry points convert errors into user-facing output.<br><span class="zh-inline">库层 API 要尽量精确，应用入口再把错误翻译成用户能看懂的输出。</span>

Rust error handling feels strict at first, but that strictness removes a huge amount of hidden control flow.<br><span class="zh-inline">Rust 的错误处理一开始会显得严，但这种“严”会帮忙清掉大量隐藏控制流。</span>
