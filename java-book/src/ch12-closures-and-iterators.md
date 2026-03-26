## Closures and Iterators

> **What you'll learn:** How Rust closures compare to Java lambdas and how iterators relate to the Stream API.
>
> **Difficulty:** 🟡 Intermediate

Closures feel familiar to Java developers because lambdas are already common. The difference is in capture behavior and ownership.

## Closures

```rust
let factor = 2;
let multiply = |x: i32| x * factor;
```

Rust closures can capture by borrow or by move. That makes them more explicit in ownership-sensitive contexts such as threads and async tasks.

## `Fn`, `FnMut`, `FnOnce`

These traits describe how a closure interacts with captured state:

- `Fn`: immutable capture
- `FnMut`: mutable capture
- `FnOnce`: consumes captured values

This is a deeper model than Java lambdas usually expose.

## Iterators vs Streams

Both are lazy pipelines. Rust iterators tend to compose with less framework overhead and with stronger compile-time specialization.

```rust
let result: Vec<_> = values
    .iter()
    .filter(|x| **x > 10)
    .map(|x| x * 2)
    .collect();
```

## Advice

- closures are easy; closure capture semantics are the real lesson
- iterator chains are normal Rust, not niche functional style
- if ownership errors appear in iterator code, inspect whether the chain borrows or consumes values
