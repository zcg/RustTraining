## Control Flow

> **What you'll learn:** How Rust control flow resembles Java in shape but differs in one crucial way: many constructs are expressions, not just statements.
>
> **Difficulty:** 🟢 Beginner

Java developers usually adapt to Rust control flow quickly. The biggest surprise is that Rust uses expressions much more aggressively.

## `if` as an Expression

```rust
let label = if score >= 90 { "great" } else { "ok" };
```

That is closer to a Java ternary expression than to a plain `if` statement.

## `match`

```rust
let text = match status {
    200 => "ok",
    404 => "missing",
    _ => "other",
};
```

`match` is central in Rust because it works with enums, options, results, and destructuring.

## Loops

| Java | Rust |
|---|---|
| `while (...)` | `while condition { ... }` |
| enhanced `for` | `for item in items { ... }` |
| `for (;;)` | `loop { ... }` |

`loop` is the dedicated infinite-loop construct.

## Early Exit

Rust has `return`, `break`, and `continue` as expected. It also lets `break` return a value from `loop`.

```rust
let result = loop {
    if ready() {
        break 42;
    }
};
```

## Pattern-Oriented Flow

```rust
if let Some(user) = maybe_user {
    println!("{}", user.name);
}
```

This is a very common replacement for “null check plus cast plus use” style logic.

## Advice

- remember that `if`, `match`, and even `loop` can produce values
- reach for `match` when branching on enums or structured data
- prefer readable control flow over clever one-liners

Rust control flow is not hard. The main adjustment is learning to think in expressions and patterns rather than in statements alone.
