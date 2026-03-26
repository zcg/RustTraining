## Closures and Iterators<br><span class="zh-inline">闭包与迭代器</span>

> **What you'll learn:** How Rust closures compare to Java lambdas and how iterators relate to the Stream API.<br><span class="zh-inline">**本章将学习：** Rust 闭包如何对应 Java lambda，以及迭代器如何对应 Stream API。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Closures feel familiar to Java developers because lambdas are already common. The difference is in capture behavior and ownership.<br><span class="zh-inline">闭包对 Java 开发者来说不算陌生，因为 lambda 早就很常见了。真正的差异主要落在捕获行为和所有权上。</span>

## Closures<br><span class="zh-inline">闭包</span>

```rust
let factor = 2;
let multiply = |x: i32| x * factor;
```

Rust closures can capture by borrow or by move. That makes them more explicit in ownership-sensitive contexts such as threads and async tasks.<br><span class="zh-inline">Rust 闭包既可以按借用捕获，也可以按 move 捕获，所以在线程、异步任务这类所有权敏感场景里会更明确。</span>

## `Fn`, `FnMut`, `FnOnce`<br><span class="zh-inline">`Fn`、`FnMut`、`FnOnce`</span>

These traits describe how a closure interacts with captured state:<br><span class="zh-inline">这三个 trait 描述的是闭包和捕获状态的关系：</span>

- `Fn`: immutable capture<br><span class="zh-inline">不可变捕获。</span>
- `FnMut`: mutable capture<br><span class="zh-inline">可变捕获。</span>
- `FnOnce`: consumes captured values<br><span class="zh-inline">消耗捕获值。</span>

This is a deeper model than Java lambdas usually expose.<br><span class="zh-inline">这一层模型比 Java lambda 平时显露出来的语义更深。</span>

## Iterators vs Streams<br><span class="zh-inline">迭代器与 Stream</span>

Both are lazy pipelines. Rust iterators tend to compose with less framework overhead and with stronger compile-time specialization.<br><span class="zh-inline">两者都是惰性流水线，不过 Rust 迭代器通常框架负担更小，编译期特化更强。</span>

```rust
let result: Vec<_> = values
    .iter()
    .filter(|x| **x > 10)
    .map(|x| x * 2)
    .collect();
```

## Advice<br><span class="zh-inline">建议</span>

- closures are easy; closure capture semantics are the real lesson<br><span class="zh-inline">闭包本身不难，真正要学的是捕获语义。</span>
- iterator chains are normal Rust, not niche functional style<br><span class="zh-inline">迭代器链是 Rust 日常写法，不是什么小众函数式花活。</span>
- if ownership errors appear in iterator code, inspect whether the chain borrows or consumes values<br><span class="zh-inline">迭代器代码里一旦冒出所有权报错，先查这条链到底是在借用还是在消耗值。</span>
