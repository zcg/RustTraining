# Async Rust: From Futures to Production<br><span class="zh-inline">Async Rust：从 Future 到生产环境</span>

## Speaker Intro<br><span class="zh-inline">讲者简介</span>

- Principal Firmware Architect in Microsoft SCHIE (Silicon and Cloud Hardware Infrastructure Engineering) team<br><span class="zh-inline">微软 SCHIE 团队首席固件架构师，SCHIE 即 Silicon and Cloud Hardware Infrastructure Engineering。</span>
- Industry veteran with expertise in security, systems programming (firmware, operating systems, hypervisors), CPU and platform architecture, and C++ systems<br><span class="zh-inline">长期从事安全、系统编程、固件、操作系统、虚拟机监控器、CPU 与平台架构，以及 C++ 系统开发。</span>
- Started programming in Rust in 2017 (@AWS EC2), and have been in love with the language ever since<br><span class="zh-inline">自 2017 年在 AWS EC2 开始使用 Rust，此后一直深度投入这门语言。</span>

---

A deep-dive guide to asynchronous programming in Rust. Unlike most async tutorials that start with `tokio::main` and hand-wave the internals, this guide builds understanding from first principles — the `Future` trait, polling, state machines — then progresses to real-world patterns, runtime selection, and production pitfalls.<br><span class="zh-inline">这是一本深入讲解 Rust 异步编程的训练指南。和许多从 `tokio::main` 起步、对底层一笔带过的教程不同，这本书从第一性原理讲起，先拆清 `Future` trait、轮询机制和状态机，再逐步推进到真实世界中的模式选择、运行时决策与生产环境问题。</span>

## Who This Is For<br><span class="zh-inline">适合哪些读者</span>

- Rust developers who can write synchronous Rust but find async confusing<br><span class="zh-inline">已经能够编写同步 Rust，但一碰 async 就开始发懵的 Rust 开发者。</span>
- Developers from C#, Go, Python, or JavaScript who know `async/await` but not Rust's model<br><span class="zh-inline">来自 C#、Go、Python 或 JavaScript 生态，熟悉 `async/await`，但不了解 Rust 异步模型的开发者。</span>
- Anyone who's been bitten by `Future is not Send`, `Pin<Box<dyn Future>>`, or "why does my program hang?"<br><span class="zh-inline">凡是被 `Future is not Send`、`Pin<Box<dyn Future>>`，或者“程序为什么挂住了”这类问题折腾过的人，都适合读这一套。</span>

## Prerequisites<br><span class="zh-inline">前置知识</span>

You should be comfortable with:<br><span class="zh-inline">开始阅读前，最好已经具备以下基础：</span>

- Ownership, borrowing, and lifetimes<br><span class="zh-inline">所有权、借用与生命周期。</span>
- Traits and generics (including `impl Trait`)<br><span class="zh-inline">Trait 与泛型，包括 `impl Trait`。</span>
- Using `Result<T, E>` and the `?` operator<br><span class="zh-inline">`Result<T, E>` 的使用方式，以及 `?` 运算符。</span>
- Basic multi-threading (`std::thread::spawn`, `Arc`, `Mutex`)<br><span class="zh-inline">基础多线程知识，例如 `std::thread::spawn`、`Arc`、`Mutex`。</span>

No prior async Rust experience is needed.<br><span class="zh-inline">不要求事先有 Rust 异步编程经验。</span>

## How to Use This Book<br><span class="zh-inline">如何使用本书</span>

**Read linearly the first time.** Parts I–III build on each other. Each chapter has:<br><span class="zh-inline">**第一次阅读建议按顺序来。** 第一到第三部分是逐层递进的，每一章都承担了后面章节的铺垫。</span>

| Symbol | Meaning |
|--------|---------|
| 🟢<br><span class="zh-inline">🟢</span> | Beginner — foundational concept<br><span class="zh-inline">初级：基础概念，偏入门。</span> |
| 🟡<br><span class="zh-inline">🟡</span> | Intermediate — requires earlier chapters<br><span class="zh-inline">中级：需要前面章节的基础。</span> |
| 🔴<br><span class="zh-inline">🔴</span> | Advanced — deep internals or production patterns<br><span class="zh-inline">高级：涉及底层机制或生产模式。</span> |

Each chapter includes:<br><span class="zh-inline">每一章通常都包含以下组成部分：</span>

- A **"What you'll learn"** block at the top<br><span class="zh-inline">开头的 **“What you'll learn”** 学习目标。</span>
- **Mermaid diagrams** for visual learners<br><span class="zh-inline">便于理解流程和结构的 **Mermaid 图示**。</span>
- An **inline exercise** with a hidden solution<br><span class="zh-inline">带隐藏答案的 **嵌入式练习**。</span>
- **Key Takeaways** summarizing the core ideas<br><span class="zh-inline">用于收束重点的 **Key Takeaways**。</span>
- **Cross-references** to related chapters<br><span class="zh-inline">指向相关章节的 **交叉引用**。</span>

## Pacing Guide<br><span class="zh-inline">学习节奏建议</span>

| Chapters | Topic | Suggested Time | Checkpoint |
|----------|-------|----------------|------------|
| 1–5<br><span class="zh-inline">1–5 章</span> | How Async Works<br><span class="zh-inline">Async 如何工作</span> | 6–8 hours<br><span class="zh-inline">6–8 小时</span> | You can explain `Future`, `Poll`, `Pin`, and why Rust has no built-in runtime<br><span class="zh-inline">能够解释 `Future`、`Poll`、`Pin`，以及为什么 Rust 没有内置运行时。</span> |
| 6–10<br><span class="zh-inline">6–10 章</span> | The Ecosystem<br><span class="zh-inline">生态体系</span> | 6–8 hours<br><span class="zh-inline">6–8 小时</span> | You can build futures by hand, choose a runtime, and use tokio's API<br><span class="zh-inline">能够手写 future、选择运行时，并熟练使用 tokio API。</span> |
| 11–13<br><span class="zh-inline">11–13 章</span> | Production Async<br><span class="zh-inline">生产环境中的 Async</span> | 6–8 hours<br><span class="zh-inline">6–8 小时</span> | You can write production-grade async code with streams, proper error handling, and graceful shutdown<br><span class="zh-inline">能够写出具备 stream、正确错误处理和优雅停机能力的生产级异步代码。</span> |
| Capstone<br><span class="zh-inline">综合项目</span> | Chat Server<br><span class="zh-inline">聊天服务器</span> | 4–6 hours<br><span class="zh-inline">4–6 小时</span> | You've built a real async application integrating all concepts<br><span class="zh-inline">已经完成一个整合全部概念的真实异步应用。</span> |

**Total estimated time: 22–30 hours**<br><span class="zh-inline">**预计总学习时间：22–30 小时。**</span>

## Working Through Exercises<br><span class="zh-inline">练习建议</span>

Every content chapter has an inline exercise. The capstone (Ch 16) integrates everything into a single project. For maximum learning:<br><span class="zh-inline">每个正文章节都带有嵌入式练习，第 16 章的综合项目则会把全部内容整合到一个完整项目中。为了把收益吃满，建议按下面的节奏来：</span>

1. **Try the exercise before expanding the solution** — struggling is where learning happens<br><span class="zh-inline">**先做题，再看答案。** 真正的理解通常发生在卡住和挣扎的时候。</span>
2. **Type the code, don't copy-paste** — muscle memory matters for Rust's syntax<br><span class="zh-inline">**手敲代码，不要复制粘贴。** Rust 语法特别依赖肌肉记忆。</span>
3. **Run every example** — `cargo new async-exercises` and test as you go<br><span class="zh-inline">**每个示例都跑一遍。** 可以单独建一个 `cargo new async-exercises` 工程，边学边验证。</span>

## Table of Contents<br><span class="zh-inline">目录总览</span>

### Part I: How Async Works<br><span class="zh-inline">第一部分：Async 如何工作</span>

- [1. Why Async is Different in Rust](ch01-why-async-is-different-in-rust.md) 🟢 — The fundamental difference: Rust has no built-in runtime<br><span class="zh-inline">[1. 为什么 Rust 中的 Async 与众不同](ch01-why-async-is-different-in-rust.md) 🟢 —— 核心差异是：Rust 没有内置运行时。</span>
- [2. The Future Trait](ch02-the-future-trait.md) 🟡 — `poll()`, `Waker`, and the contract that makes it all work<br><span class="zh-inline">[2. Future Trait](ch02-the-future-trait.md) 🟡 —— 讲清 `poll()`、`Waker` 以及整套机制依赖的契约。</span>
- [3. How Poll Works](ch03-how-poll-works.md) 🟡 — The polling state machine and a minimal executor<br><span class="zh-inline">[3. Poll 如何工作](ch03-how-poll-works.md) 🟡 —— 轮询状态机和一个最小执行器。</span>
- [4. Pin and Unpin](ch04-pin-and-unpin.md) 🔴 — Why self-referential structs need pinning<br><span class="zh-inline">[4. Pin 与 Unpin](ch04-pin-and-unpin.md) 🔴 —— 为什么自引用结构体需要 pinning。</span>
- [5. The State Machine Reveal](ch05-the-state-machine-reveal.md) 🟢 — What the compiler actually generates from `async fn`<br><span class="zh-inline">[5. 状态机真相](ch05-the-state-machine-reveal.md) 🟢 —— 编译器到底从 `async fn` 生成了什么。</span>

### Part II: The Ecosystem<br><span class="zh-inline">第二部分：生态体系</span>

- [6. Building Futures by Hand](ch06-building-futures-by-hand.md) 🟡 — TimerFuture, Join, Select from scratch<br><span class="zh-inline">[6. 手写 Future](ch06-building-futures-by-hand.md) 🟡 —— 从零实现 TimerFuture、Join、Select。</span>
- [7. Executors and Runtimes](ch07-executors-and-runtimes.md) 🟡 — tokio, smol, async-std, embassy — how to choose<br><span class="zh-inline">[7. 执行器与运行时](ch07-executors-and-runtimes.md) 🟡 —— tokio、smol、async-std、embassy 该怎么选。</span>
- [8. Tokio Deep Dive](ch08-tokio-deep-dive.md) 🟡 — Runtime flavors, spawn, channels, sync primitives<br><span class="zh-inline">[8. Tokio 深入解析](ch08-tokio-deep-dive.md) 🟡 —— 运行时类型、spawn、channel 与同步原语。</span>
- [9. When Tokio Isn't the Right Fit](ch09-when-tokio-isnt-the-right-fit.md) 🟡 — LocalSet, FuturesUnordered, runtime-agnostic design<br><span class="zh-inline">[9. Tokio 不合适的场景](ch09-when-tokio-isnt-the-right-fit.md) 🟡 —— LocalSet、FuturesUnordered 与运行时无关设计。</span>
- [10. Async Traits](ch10-async-traits.md) 🟡 — RPITIT, dyn dispatch, trait_variant, async closures<br><span class="zh-inline">[10. Async Trait](ch10-async-traits.md) 🟡 —— RPITIT、dyn 分发、trait_variant 与 async 闭包。</span>

### Part III: Production Async<br><span class="zh-inline">第三部分：生产环境中的 Async</span>

- [11. Streams and AsyncIterator](ch11-streams-and-asynciterator.md) 🟡 — Async iteration, AsyncRead/Write, stream combinators<br><span class="zh-inline">[11. Stream 与 AsyncIterator](ch11-streams-and-asynciterator.md) 🟡 —— 异步迭代、AsyncRead/Write 与 stream 组合器。</span>
- [12. Common Pitfalls](ch12-common-pitfalls.md) 🔴 — 9 production bugs and how to avoid them<br><span class="zh-inline">[12. 常见陷阱](ch12-common-pitfalls.md) 🔴 —— 9 类生产事故及其规避方法。</span>
- [13. Production Patterns](ch13-production-patterns.md) 🔴 — Graceful shutdown, backpressure, Tower middleware<br><span class="zh-inline">[13. 生产模式](ch13-production-patterns.md) 🔴 —— 优雅停机、背压与 Tower 中间件。</span>

### Appendices<br><span class="zh-inline">附录</span>

- [Summary and Reference Card](ch15-summary-and-reference-card.md) — Quick-lookup tables and decision trees<br><span class="zh-inline">[总结与参考卡片](ch15-summary-and-reference-card.md) —— 便于快速查阅的表格和决策树。</span>
- [Capstone Project: Async Chat Server](ch16-capstone-project.md) — Build a complete async application<br><span class="zh-inline">[综合项目：Async 聊天服务器](ch16-capstone-project.md) —— 构建一个完整的异步应用。</span>

***
