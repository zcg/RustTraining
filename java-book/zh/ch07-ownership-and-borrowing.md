## Ownership and Borrowing<br><span class="zh-inline">所有权与借用</span>

> **What you'll learn:** The core Rust model that replaces GC-managed shared references with explicit ownership, borrowing, and moves.<br><span class="zh-inline">**本章将学习：** Rust 最核心的模型，也就是如何用显式的所有权、借用和 move，替代 GC 托管下那种共享引用世界。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

This chapter is the real dividing line between “Rust syntax” and “Rust thinking.”<br><span class="zh-inline">这一章才是真正把“Rust 语法”跟“Rust 思维”分开的分水岭。</span>

## Ownership in One Sentence<br><span class="zh-inline">一句话理解所有权</span>

Every value has an owner, and when that owner goes out of scope, the value is dropped.<br><span class="zh-inline">每个值都有一个 owner，当 owner 离开作用域时，这个值就会被释放。</span>

## Moves<br><span class="zh-inline">move</span>

```rust
let a = String::from("hello");
let b = a;
// a is no longer usable here
```

For Java developers, this is the first major shock. Assignment is not always “another reference to the same object.” Sometimes it is ownership transfer.<br><span class="zh-inline">对 Java 开发者来说，这通常是第一次大的冲击。赋值不再总是“多了一个指向同一对象的引用”，它有时真的是所有权转移。</span>

## Borrowing<br><span class="zh-inline">借用</span>

```rust
fn print_name(name: &str) {
    println!("{name}");
}
```

Borrowing lets code read a value without taking ownership.<br><span class="zh-inline">借用允许代码读取一个值，而不用把所有权拿走。</span>

## Mutable Borrowing<br><span class="zh-inline">可变借用</span>

```rust
fn append_world(text: &mut String) {
    text.push_str(" world");
}
```

Rust allows mutation through a borrowed path, but only under rules that prevent conflicting access.<br><span class="zh-inline">Rust 允许通过借用路径修改数据，但前提是必须遵守那套防止冲突访问的规则。</span>

## The Important Rule<br><span class="zh-inline">最关键的规则</span>

At a given moment, you may have:<br><span class="zh-inline">在同一时刻，只能二选一：</span>

- many immutable references<br><span class="zh-inline">很多个不可变引用。</span>
- or one mutable reference<br><span class="zh-inline">或者一个可变引用。</span>

That rule prevents a large class of race conditions and aliasing bugs.<br><span class="zh-inline">这条规则会拦掉大量竞争条件和别名相关 bug。</span>

## Why Java Developers Struggle Here<br><span class="zh-inline">为什么 Java 开发者常卡在这里</span>

Java normalizes free movement of references. Rust distinguishes very sharply between:<br><span class="zh-inline">Java 把“引用可以自由移动”这件事默认化了，而 Rust 会非常锋利地区分下面三件事：</span>

- owning a value<br><span class="zh-inline">拥有一个值。</span>
- borrowing it immutably<br><span class="zh-inline">不可变借用它。</span>
- borrowing it mutably<br><span class="zh-inline">可变借用它。</span>

Once that distinction becomes intuitive, the compiler stops feeling hostile.<br><span class="zh-inline">只要这三种关系开始变得直觉化，编译器就不会再显得像在找茬。</span>
