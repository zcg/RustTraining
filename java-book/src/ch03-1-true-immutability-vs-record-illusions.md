## True Immutability vs Record Illusions

> **What you'll learn:** Why Java records are useful but not deeply immutable by default, and how Rust's default immutability changes the design conversation.
>
> **Difficulty:** 🟡 Intermediate

Java records reduce boilerplate, but they do not automatically guarantee deep immutability.

## The Java Record Caveat

```java
record UserProfile(String name, List<String> tags) {}
```

The `tags` reference is final, but the list behind it can still mutate unless the code deliberately wraps or copies it.

## Rust's Default Position

```rust
struct UserProfile {
    name: String,
    tags: Vec<String>,
}
```

If the binding is immutable, mutation is blocked unless a mutable binding or a special interior mutability type is involved.

## What This Means in Practice

| Concern | Java record | Rust struct |
|---|---|---|
| shallow immutability | common | common |
| deep immutability | manual design choice | manual design choice |
| mutation signal | often hidden behind references | explicit through `mut` or interior mutability |

Rust does not magically make every data structure deeply immutable, but it makes mutation far easier to spot.

## Design Guidance

- treat Java records as concise carriers, not as proof of immutability
- in Rust, start immutable and add `mut` only where required
- if mutation must cross shared boundaries, make that choice obvious in the type design

The useful lesson is not “records are bad.” The useful lesson is that Rust defaults push teams toward more explicit state transitions.
