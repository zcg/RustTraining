## Constructor Patterns

> **What you'll learn:** How Rust replaces Java constructors with associated functions, `Default`, and builders.
>
> **Difficulty:** 🟢 Beginner

Rust does not have constructors in the Java sense. Instead, types usually expose associated functions such as `new`.

## A Basic `new`

```rust
struct Config {
    host: String,
    port: u16,
}

impl Config {
    fn new(host: String, port: u16) -> Self {
        Self { host, port }
    }
}
```

This is explicit and boring, which is usually a good thing.

## `Default`

```rust
#[derive(Default)]
struct RetryPolicy {
    max_retries: u32,
}
```

`Default` is a natural fit for types that have sensible baseline values.

## Builder Pattern

Builders are useful when:

- there are many optional fields
- construction needs validation
- call sites should read like configuration

```rust
struct ClientBuilder {
    timeout_ms: u64,
}

impl ClientBuilder {
    fn new() -> Self {
        Self { timeout_ms: 1000 }
    }

    fn timeout_ms(mut self, timeout_ms: u64) -> Self {
        self.timeout_ms = timeout_ms;
        self
    }
}
```

## Guidance

- use `new` for ordinary construction
- use `Default` for sensible zero-argument initialization
- use builders when option count and readability demand them

Rust construction is less magical than Java frameworks, but the trade-off is simpler reasoning at call sites.
