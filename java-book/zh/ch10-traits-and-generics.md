## Traits and Generics<br><span class="zh-inline">Trait 与泛型</span>

> **What you'll learn:** How Rust traits compare to Java interfaces and how Rust generics differ from erased JVM generics.<br><span class="zh-inline">**本章将学习：** Rust trait 如何对应 Java interface，以及 Rust 泛型和 JVM 擦除式泛型有什么根本区别。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Traits are the closest Rust concept to Java interfaces, but they sit inside a more powerful type system.<br><span class="zh-inline">trait 是 Rust 里最接近 Java interface 的概念，但它所在的类型系统更强，也更直接。</span>

## Traits vs Interfaces<br><span class="zh-inline">trait 与接口</span>

```rust
trait Render {
    fn render(&self) -> String;
}
```

Traits can define required behavior and default behavior, much like interfaces with default methods.<br><span class="zh-inline">trait 可以定义必须实现的行为，也可以带默认实现，这点和带 default method 的接口很像。</span>

## Generics<br><span class="zh-inline">泛型</span>

```rust
fn first<T>(items: &[T]) -> Option<&T> {
    items.first()
}
```

Rust generics are monomorphized in many cases, which means the compiler often generates concrete machine code per concrete type rather than relying on erased runtime dispatch.<br><span class="zh-inline">Rust 泛型在很多情况下会做单态化，也就是说编译器会针对具体类型生成具体机器码，而不是像 JVM 那样主要依赖擦除后的运行时分发。</span>

## Static vs Dynamic Dispatch<br><span class="zh-inline">静态分发与动态分发</span>

- generic trait bounds usually mean static dispatch<br><span class="zh-inline">泛型 trait bound 通常意味着静态分发。</span>
- `dyn Trait` means dynamic dispatch<br><span class="zh-inline">`dyn Trait` 则表示动态分发。</span>

This distinction is far more explicit than in typical Java code.<br><span class="zh-inline">这种区别在 Rust 里写得非常明白，比典型 Java 代码显式得多。</span>

## Why Java Developers Should Care<br><span class="zh-inline">Java 开发者为什么要在意这件事</span>

Java interfaces often coexist with inheritance, reflection, and proxies. Rust traits tend to stay closer to behavior and less tied to framework machinery.<br><span class="zh-inline">Java interface 经常和继承、反射、代理一起工作；Rust trait 则更接近纯行为抽象，也更少和框架魔法绑死。</span>

Traits and generics are where Rust starts feeling less like “Java without GC” and more like its own language with its own power.<br><span class="zh-inline">trait 和泛型这块，往往是 Rust 最开始不再像“去掉 GC 的 Java”，而真正显出自己语言气质的地方。</span>
