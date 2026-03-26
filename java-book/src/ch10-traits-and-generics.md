## Traits and Generics

> **What you'll learn:** How Rust traits compare to Java interfaces and how Rust generics differ from erased JVM generics.
>
> **Difficulty:** 🟡 Intermediate

Traits are the closest Rust concept to Java interfaces, but they sit inside a more powerful type system.

## Traits vs Interfaces

```rust
trait Render {
    fn render(&self) -> String;
}
```

Traits can define required behavior and default behavior, much like interfaces with default methods.

## Generics

```rust
fn first<T>(items: &[T]) -> Option<&T> {
    items.first()
}
```

Rust generics are monomorphized in many cases, which means the compiler often generates concrete machine code per concrete type rather than relying on erased runtime dispatch.

## Static vs Dynamic Dispatch

- generic trait bounds usually mean static dispatch
- `dyn Trait` means dynamic dispatch

This distinction is far more explicit than in typical Java code.

## Why Java Developers Should Care

Java interfaces often coexist with inheritance, reflection, and proxies. Rust traits tend to stay closer to behavior and less tied to framework machinery.

Traits and generics are where Rust starts feeling less like “Java without GC” and more like its own language with its own power.
