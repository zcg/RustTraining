## Collections: `Vec`, `HashMap`, and Iterators

> **What you'll learn:** How the most common Rust collections compare to Java's `List`, `Map`, and stream-based traversal patterns.
>
> **Difficulty:** 🟢 Beginner

## `Vec<T>` vs `List<T>`

`Vec<T>` is the workhorse collection in Rust.

```rust
let mut numbers = vec![1, 2, 3];
numbers.push(4);
```

If Java developers are tempted to ask “what is the interface type here?”, the answer is usually “there isn't one yet, because the concrete vector is enough.”

## `HashMap<K, V>` vs `Map<K, V>`

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert("ada", 98);
scores.insert("grace", 100);
```

Lookups return `Option<&V>` rather than `null`.

## Iteration

```rust
for value in &numbers {
    println!("{value}");
}
```

Rust makes ownership visible during iteration:

- `iter()` borrows items
- `iter_mut()` mutably borrows items
- `into_iter()` consumes the collection

That third case is where many Java developers first feel the ownership model in collection code.

## Iterators vs Streams

| Java Stream | Rust iterator |
|---|---|
| lazy pipeline | lazy pipeline |
| terminal operation required | terminal operation required |
| often object-heavy | often zero-cost and monomorphized |

```rust
let doubled: Vec<_> = numbers
    .iter()
    .map(|n| n * 2)
    .collect();
```

## Advice

- start with `Vec` before searching for more abstract collection models
- use `Option`-aware lookups rather than assuming missing values are exceptional
- choose `iter`, `iter_mut`, or `into_iter` based on ownership intent

Once these three collection patterns click, a large amount of day-to-day Rust code becomes readable.
