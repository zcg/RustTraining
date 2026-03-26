## Concurrency<br><span class="zh-inline">并发</span>

> **What you'll learn:** How Rust concurrency compares to Java threads, executors, and synchronized shared state.<br><span class="zh-inline">**本章将学习：** Rust 并发模型如何对应 Java 线程、执行器以及同步共享状态。</span>
>
> **Difficulty:** 🔴 Advanced<br><span class="zh-inline">**难度：** 🔴 高级</span>

Java gives teams mature concurrency tools. Rust brings a different advantage: the compiler participates more directly in preventing misuse.<br><span class="zh-inline">Java 已经给团队提供了非常成熟的并发工具，而 Rust 的优势则落在另一边：编译器会更直接地参与阻止误用。</span>

## Core Mapping<br><span class="zh-inline">核心映射</span>

| Java | Rust |
|---|---|
| `Thread` | `std::thread::spawn` |
| `ExecutorService` | async runtime or manual thread orchestration<br><span class="zh-inline">异步运行时或手工线程编排</span> |
| synchronized mutable state<br><span class="zh-inline">同步共享可变状态</span> | `Mutex<T>` |
| concurrent shared ownership<br><span class="zh-inline">并发共享所有权</span> | `Arc<T>` |
| queues and handoff<br><span class="zh-inline">队列与交接</span> | channels |

## Shared State<br><span class="zh-inline">共享状态</span>

```rust
use std::sync::{Arc, Mutex};
use std::thread;

let counter = Arc::new(Mutex::new(0));
```

Rust makes the ownership and synchronization cost explicit in the type spelling.<br><span class="zh-inline">Rust 会把所有权和同步成本直接写在类型上，不让它们偷偷躲起来。</span>

## `Send` and `Sync`<br><span class="zh-inline">`Send` 与 `Sync`</span>

These marker traits are part of what makes Rust concurrency feel stricter:<br><span class="zh-inline">Rust 并发之所以显得更严，`Send` 和 `Sync` 是关键原因之一：</span>

- `Send`: a value can move across threads<br><span class="zh-inline">值可以跨线程移动。</span>
- `Sync`: references to a value can be shared across threads safely<br><span class="zh-inline">值的引用可以安全地跨线程共享。</span>

Java developers rarely think at this level because the JVM and library conventions hide it.<br><span class="zh-inline">Java 开发者很少在这个层面思考问题，因为 JVM 和库约定通常把这层细节藏起来了。</span>

## Advice<br><span class="zh-inline">建议</span>

- prefer message passing when shared mutable state is not necessary<br><span class="zh-inline">只要能避免共享可变状态，就优先消息传递。</span>
- when shared state is necessary, make the synchronization type explicit<br><span class="zh-inline">共享状态躲不过去时，就把同步类型老老实实写出来。</span>
- let the compiler teach where thread-safety assumptions break<br><span class="zh-inline">让编译器来指出线程安全假设在哪些地方站不住。</span>

Rust does not make concurrency easy by hiding the problem. It makes it safer by forcing the important parts into the type system.<br><span class="zh-inline">Rust 不是靠把并发问题藏起来来显得简单，而是靠把关键约束推进类型系统里来变得更安全。</span>
