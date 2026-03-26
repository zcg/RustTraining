## Concurrency

> **What you'll learn:** How Rust concurrency compares to Java threads, executors, and synchronized shared state.
>
> **Difficulty:** 🔴 Advanced

Java gives teams mature concurrency tools. Rust brings a different advantage: the compiler participates more directly in preventing misuse.

## Core Mapping

| Java | Rust |
|---|---|
| `Thread` | `std::thread::spawn` |
| `ExecutorService` | async runtime or manual thread orchestration |
| synchronized mutable state | `Mutex<T>` |
| concurrent shared ownership | `Arc<T>` |
| queues and handoff | channels |

## Shared State

```rust
use std::sync::{Arc, Mutex};
use std::thread;

let counter = Arc::new(Mutex::new(0));
```

Rust makes the ownership and synchronization cost explicit in the type spelling.

## `Send` and `Sync`

These marker traits are part of what makes Rust concurrency feel stricter:

- `Send`: a value can move across threads
- `Sync`: references to a value can be shared across threads safely

Java developers rarely think at this level because the JVM and library conventions hide it.

## Advice

- prefer message passing when shared mutable state is not necessary
- when shared state is necessary, make the synchronization type explicit
- let the compiler teach where thread-safety assumptions break

Rust does not make concurrency easy by hiding the problem. It makes it safer by forcing the important parts into the type system.
