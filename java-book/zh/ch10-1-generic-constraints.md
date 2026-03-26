## Generic Constraints<br><span class="zh-inline">泛型约束</span>

> **What you'll learn:** How trait bounds and `where` clauses compare to Java generic bounds.<br><span class="zh-inline">**本章将学习：** trait bound 和 `where` 子句分别怎样对应 Java 的泛型约束。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Java developers know bounds such as `<T extends Comparable<T>>`. Rust expresses similar ideas through trait bounds.<br><span class="zh-inline">Java 开发者很熟悉 `<T extends Comparable<T>>` 这种写法。Rust 则通过 trait bound 表达类似意思。</span>

```rust
fn sort_and_print<T: Ord + std::fmt::Debug>(items: &mut [T]) {
    items.sort();
    println!("{items:?}");
}
```

The same bounds can be moved into a `where` clause for readability:<br><span class="zh-inline">如果约束太长，也可以挪进 `where` 子句提升可读性：</span>

```rust
fn sort_and_print<T>(items: &mut [T])
where
    T: Ord + std::fmt::Debug,
{
    items.sort();
    println!("{items:?}");
}
```

## Key Difference from Java<br><span class="zh-inline">和 Java 的关键差异</span>

Rust bounds are closely tied to behavior required by the compiler and standard library traits. They are not just nominal inheritance constraints.<br><span class="zh-inline">Rust 里的约束更紧密地绑定在行为能力上，通常是编译器和标准库 trait 真正需要的能力，而不只是名义上的继承关系。</span>

## Advice<br><span class="zh-inline">建议</span>

- use inline bounds for short signatures<br><span class="zh-inline">签名短时直接写内联约束。</span>
- use `where` clauses when bounds become long<br><span class="zh-inline">约束一长，就改用 `where`。</span>
- think in capabilities, not class hierarchies<br><span class="zh-inline">思考方式优先放在“能力”，不是类层级。</span>
