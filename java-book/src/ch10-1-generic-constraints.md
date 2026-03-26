## Generic Constraints

> **What you'll learn:** How trait bounds and `where` clauses compare to Java generic bounds.
>
> **Difficulty:** 🟡 Intermediate

Java developers know bounds such as `<T extends Comparable<T>>`. Rust expresses similar ideas through trait bounds.

```rust
fn sort_and_print<T: Ord + std::fmt::Debug>(items: &mut [T]) {
    items.sort();
    println!("{items:?}");
}
```

The same bounds can be moved into a `where` clause for readability:

```rust
fn sort_and_print<T>(items: &mut [T])
where
    T: Ord + std::fmt::Debug,
{
    items.sort();
    println!("{items:?}");
}
```

## Key Difference from Java

Rust bounds are closely tied to behavior required by the compiler and standard library traits. They are not just nominal inheritance constraints.

## Advice

- use inline bounds for short signatures
- use `where` clauses when bounds become long
- think in capabilities, not class hierarchies
