## Smart Pointers: Beyond Single Ownership

> **What you'll learn:** When `Box`, `Rc`, `Arc`, `RefCell`, and `Mutex` are needed, and how they compare to Java's always-reference-based object model.
>
> **Difficulty:** 🔴 Advanced

Java developers are used to object references everywhere. Rust starts from direct ownership and only adds pointer-like wrappers when they are actually needed.

## Common Smart Pointers

| Type | Typical use |
|---|---|
| `Box<T>` | heap allocation with single ownership |
| `Rc<T>` | shared ownership in single-threaded code |
| `Arc<T>` | shared ownership across threads |
| `RefCell<T>` | checked interior mutability in single-threaded code |
| `Mutex<T>` | synchronized shared mutable access |

## The Key Difference from Java

In Java, shared references are the default. In Rust, shared ownership is a deliberate choice with a specific type.

## Guidance

- use plain values and references first
- add `Box` when recursive or heap-allocated layout is needed
- add `Rc` or `Arc` only when multiple owners are truly required
- pair `Arc` with `Mutex` only when shared mutable state is unavoidable

These types are powerful, but they are also signals that the ownership model has become more complex.
