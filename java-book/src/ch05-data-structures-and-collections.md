## Data Structures and Collections

> **What you'll learn:** How Rust models data with tuples, arrays, slices, structs, and standard collections, and how those choices compare to Java classes and collection interfaces.
>
> **Difficulty:** 🟢 Beginner

Rust data modeling is lighter than Java's object-oriented default. There is less ceremony, but also less hidden behavior.

## Tuples

```rust
let pair = ("Ada", 42);
let (name, score) = pair;
```

Tuples are useful for temporary groupings. If the fields need names, move to a struct.

## Arrays and Slices

| Java | Rust |
|---|---|
| `int[]` | `[i32; N]` |
| array view or subrange | `&[i32]` |

An array in Rust has length as part of its type. A slice is the borrowed view over contiguous elements.

## Structs vs Classes

```rust
struct User {
    id: u64,
    name: String,
}
```

Rust structs hold data. Methods live separately in `impl` blocks. There is no hidden inheritance tree around them.

## Standard Collections

| Java | Rust |
|---|---|
| `List<T>` | `Vec<T>` |
| `Map<K, V>` | `HashMap<K, V>` |
| `Set<T>` | `HashSet<T>` |

Rust standard collections are concrete types rather than interface-first abstractions.

## Why This Matters

Java code often starts with interfaces and containers. Rust code often starts with concrete data structures and only introduces abstraction when the need becomes real.

## Advice

- use tuples for short-lived grouped values
- use structs for domain data
- use slices for read-only borrowed views into arrays or vectors
- begin with `Vec` and `HashMap`; optimize later if the workload demands it

Rust's data model is simple on purpose. That simplicity is one of the reasons ownership stays tractable.
