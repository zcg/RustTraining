## Error Handling

> **What you'll learn:** How `Result` changes API design, how Rust error propagation compares to Java exceptions, and when to use domain-specific error types.
>
> **Difficulty:** 🟡 Intermediate

Rust pushes errors into the type system. That changes design decisions much earlier than Java developers are used to.

## Exceptions vs `Result`

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

In Java, exceptions separate the main return type from the failure path. In Rust, success and failure sit next to each other in the function signature.

## The `?` Operator

```rust
fn load_config(path: &str) -> Result<String, std::io::Error> {
    let text = std::fs::read_to_string(path)?;
    Ok(text)
}
```

`?` is the standard way to propagate an error upward without writing repetitive `match` blocks everywhere.

## Domain Error Enums

```rust
#[derive(Debug, thiserror::Error)]
enum LoadUserError {
    #[error("database error: {0}")]
    Database(String),
    #[error("user {0} not found")]
    NotFound(u64),
}
```

For Java developers, this often replaces a hierarchy of custom exceptions with one explicit sum type.

## `Option` vs `Result`

Use `Option<T>` when absence is normal. Use `Result<T, E>` when failure carries explanation or needs handling.

## Practical Advice

- Avoid `unwrap()` in real application paths.
- Start with simple error enums before reaching for generalized error wrappers.
- Let library APIs be precise; let application entry points convert errors into user-facing output.

Rust error handling feels strict at first, but that strictness removes a huge amount of hidden control flow.
