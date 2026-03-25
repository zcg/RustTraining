# Rust Patterns & Engineering How-Tos<br><span class="zh-inline">Rust 模式与工程技巧</span>

## Speaker Intro<br><span class="zh-inline">讲者简介</span>

- Principal Firmware Architect in Microsoft SCHIE (Silicon and Cloud Hardware Infrastructure Engineering) team<br><span class="zh-inline">微软 SCHIE 团队首席固件架构师，SCHIE 即 Silicon and Cloud Hardware Infrastructure Engineering。</span>
- Industry veteran with expertise in security, systems programming (firmware, operating systems, hypervisors), CPU and platform architecture, and C++ systems<br><span class="zh-inline">长期从事安全、系统编程、固件、操作系统、虚拟机监控器、CPU 与平台架构，以及 C++ 系统开发。</span>
- Started programming in Rust in 2017 (@AWS EC2), and have been in love with the language ever since<br><span class="zh-inline">自 2017 年在 AWS EC2 接触 Rust 以来，就一直深度投入这门语言。</span>

---

A practical guide to intermediate-and-above Rust patterns that arise in real codebases. This is not a language tutorial — it assumes you can write basic Rust and want to level up. Each chapter isolates one concept, explains when and why to use it, and provides compilable examples with inline exercises.<br><span class="zh-inline">这是一本面向真实代码库的 Rust 进阶模式指南。它不是语法入门教程，默认已经具备基础 Rust 编写能力，目标是继续往上走。每章聚焦一个概念，讲清楚何时该用、为什么要用，并配上可编译示例和内嵌练习。</span>

## Who This Is For<br><span class="zh-inline">适合哪些读者</span>

- Developers who have finished *The Rust Programming Language* but struggle with "how do I actually design this?"<br><span class="zh-inline">已经读完 *The Rust Programming Language*，但一落到实际设计就发懵的开发者。</span>
- C++/C# engineers translating production systems into Rust<br><span class="zh-inline">正在把生产系统从 C++ 或 C# 迁移到 Rust 的工程师。</span>
- Anyone who has hit a wall with generics, trait bounds, or lifetime errors and wants a systematic toolkit<br><span class="zh-inline">被泛型、trait bound 或生命周期错误卡过，想要一套系统方法论的人。</span>

## Prerequisites<br><span class="zh-inline">前置知识</span>

Before starting, you should be comfortable with:<br><span class="zh-inline">开始之前，最好已经掌握以下基础：</span>

- Ownership, borrowing, and lifetimes (basic level)<br><span class="zh-inline">所有权、借用与生命周期的基础概念。</span>
- Enums, pattern matching, and `Option`/`Result`<br><span class="zh-inline">枚举、模式匹配，以及 `Option` / `Result`。</span>
- Structs, methods, and basic traits (`Display`, `Debug`, `Clone`)<br><span class="zh-inline">结构体、方法，以及基础 trait，例如 `Display`、`Debug`、`Clone`。</span>
- Cargo basics: `cargo build`, `cargo test`, `cargo run`<br><span class="zh-inline">Cargo 基础命令：`cargo build`、`cargo test`、`cargo run`。</span>

## How to Use This Book<br><span class="zh-inline">如何使用本书</span>

### Difficulty Legend<br><span class="zh-inline">难度标记</span>

Each chapter is tagged with a difficulty level:<br><span class="zh-inline">每一章都会标上难度等级：</span>

| Symbol | Level | Meaning |
|--------|-------|---------|
| 🟢<br><span class="zh-inline">🟢</span> | Fundamentals<br><span class="zh-inline">基础</span> | Core concepts every Rust developer needs<br><span class="zh-inline">每个 Rust 开发者都该掌握的核心概念。</span> |
| 🟡<br><span class="zh-inline">🟡</span> | Intermediate<br><span class="zh-inline">进阶</span> | Patterns used in production codebases<br><span class="zh-inline">生产代码里经常用到的模式。</span> |
| 🔴<br><span class="zh-inline">🔴</span> | Advanced<br><span class="zh-inline">高级</span> | Deep language mechanics — revisit as needed<br><span class="zh-inline">更深入的语言机制，按需反复查阅。</span> |

### Pacing Guide<br><span class="zh-inline">学习节奏建议</span>

| Chapters | Topic | Suggested Time | Checkpoint |
|----------|-------|----------------|------------|
| **Part I: Type-Level Patterns**<br><span class="zh-inline">**第一部分：类型层模式**</span> |  |  |  |
| 1. Generics 🟢<br><span class="zh-inline">1. 泛型 🟢</span> | Monomorphization, const generics, `const fn`<br><span class="zh-inline">单态化、const generics、`const fn`</span> | 1–2 hours<br><span class="zh-inline">1–2 小时</span> | Can explain when `dyn Trait` beats generics<br><span class="zh-inline">能够说明什么时候 `dyn Trait` 比泛型更合适。</span> |
| 2. Traits 🟡<br><span class="zh-inline">2. Trait 🟡</span> | Associated types, GATs, blanket impls, vtables<br><span class="zh-inline">关联类型、GAT、blanket impl、虚表</span> | 3–4 hours<br><span class="zh-inline">3–4 小时</span> | Can design a trait with associated types<br><span class="zh-inline">能够设计带关联类型的 trait。</span> |
| 3. Newtype & Type-State 🟡<br><span class="zh-inline">3. Newtype 与 Type-State 🟡</span> | Zero-cost safety, compile-time FSMs<br><span class="zh-inline">零成本安全、编译期有限状态机</span> | 2–3 hours<br><span class="zh-inline">2–3 小时</span> | Can build a type-state builder pattern<br><span class="zh-inline">能够写出 type-state builder 模式。</span> |
| 4. PhantomData 🔴<br><span class="zh-inline">4. PhantomData 🔴</span> | Lifetime branding, variance, drop check<br><span class="zh-inline">生命周期标记、变型、drop check</span> | 2–3 hours<br><span class="zh-inline">2–3 小时</span> | Can explain why `PhantomData<fn(T)>` differs from `PhantomData<T>`<br><span class="zh-inline">能够说明为什么 `PhantomData<fn(T)>` 和 `PhantomData<T>` 不一样。</span> |
| **Part II: Concurrency & Runtime**<br><span class="zh-inline">**第二部分：并发与运行时**</span> |  |  |  |
| 5. Channels 🟢<br><span class="zh-inline">5. Channel 🟢</span> | `mpsc`, crossbeam, `select!`, actors<br><span class="zh-inline">`mpsc`、crossbeam、`select!`、actor</span> | 1–2 hours<br><span class="zh-inline">1–2 小时</span> | Can implement a channel-based worker pool<br><span class="zh-inline">能够实现基于 channel 的 worker pool。</span> |
| 6. Concurrency 🟡<br><span class="zh-inline">6. 并发 🟡</span> | Threads, rayon, Mutex, RwLock, atomics<br><span class="zh-inline">线程、rayon、Mutex、RwLock、原子类型</span> | 2–3 hours<br><span class="zh-inline">2–3 小时</span> | Can pick the right sync primitive for a scenario<br><span class="zh-inline">能够为具体场景选对同步原语。</span> |
| 7. Closures 🟢<br><span class="zh-inline">7. 闭包 🟢</span> | `Fn`/`FnMut`/`FnOnce`, combinators<br><span class="zh-inline">`Fn` / `FnMut` / `FnOnce`、组合器</span> | 1–2 hours<br><span class="zh-inline">1–2 小时</span> | Can write a higher-order function that accepts closures<br><span class="zh-inline">能够写出接受闭包的高阶函数。</span> |
| 8. Smart Pointers 🟡<br><span class="zh-inline">8. 智能指针 🟡</span> | Box, Rc, Arc, RefCell, Cow, Pin<br><span class="zh-inline">Box、Rc、Arc、RefCell、Cow、Pin</span> | 2–3 hours<br><span class="zh-inline">2–3 小时</span> | Can explain when to use each smart pointer<br><span class="zh-inline">能够说明各种智能指针的适用时机。</span> |
| **Part III: Systems & Production**<br><span class="zh-inline">**第三部分：系统与生产实践**</span> |  |  |  |
| 9. Error Handling 🟢<br><span class="zh-inline">9. 错误处理 🟢</span> | thiserror, anyhow, `?` operator<br><span class="zh-inline">thiserror、anyhow、`?` 运算符</span> | 1–2 hours<br><span class="zh-inline">1–2 小时</span> | Can design an error type hierarchy<br><span class="zh-inline">能够设计错误类型层次结构。</span> |
| 10. Serialization 🟡<br><span class="zh-inline">10. 序列化 🟡</span> | serde, zero-copy, binary data<br><span class="zh-inline">serde、零拷贝、二进制数据</span> | 2–3 hours<br><span class="zh-inline">2–3 小时</span> | Can write a custom serde deserializer<br><span class="zh-inline">能够写出自定义 serde 反序列化器。</span> |
| 11. Unsafe 🔴<br><span class="zh-inline">11. Unsafe 🔴</span> | Superpowers, FFI, UB pitfalls, allocators<br><span class="zh-inline">五大超能力、FFI、UB 陷阱、分配器</span> | 2–3 hours<br><span class="zh-inline">2–3 小时</span> | Can wrap unsafe code in a sound safe API<br><span class="zh-inline">能够把 unsafe 代码包装成健全的安全 API。</span> |
| 12. Macros 🟡<br><span class="zh-inline">12. 宏 🟡</span> | `macro_rules!`, proc macros, `syn`/`quote`<br><span class="zh-inline">`macro_rules!`、过程宏、`syn` / `quote`</span> | 2–3 hours<br><span class="zh-inline">2–3 小时</span> | Can write a declarative macro with `tt` munching<br><span class="zh-inline">能够写出使用 `tt` munching 的声明式宏。</span> |
| 13. Testing 🟢<br><span class="zh-inline">13. 测试 🟢</span> | Unit/integration/doc tests, proptest, criterion<br><span class="zh-inline">单元测试、集成测试、文档测试、proptest、criterion</span> | 1–2 hours<br><span class="zh-inline">1–2 小时</span> | Can set up property-based tests<br><span class="zh-inline">能够搭建性质测试。</span> |
| 14. API Design 🟡<br><span class="zh-inline">14. API 设计 🟡</span> | Module layout, ergonomic APIs, feature flags<br><span class="zh-inline">模块布局、易用 API、feature flag</span> | 2–3 hours<br><span class="zh-inline">2–3 小时</span> | Can apply the "parse, don't validate" pattern<br><span class="zh-inline">能够应用“parse, don't validate”模式。</span> |
| 15. Async 🔴<br><span class="zh-inline">15. Async 🔴</span> | Futures, Tokio, common pitfalls<br><span class="zh-inline">Future、Tokio、常见陷阱</span> | 1–2 hours<br><span class="zh-inline">1–2 小时</span> | Can identify async anti-patterns<br><span class="zh-inline">能够识别 async 反模式。</span> |
| **Appendices**<br><span class="zh-inline">**附录**</span> |  |  |  |
| Reference Card<br><span class="zh-inline">参考卡片</span> | Quick-look trait bounds, lifetimes, patterns<br><span class="zh-inline">快速查阅 trait bound、生命周期与模式</span> | As needed<br><span class="zh-inline">按需查阅</span> | —<br><span class="zh-inline">—</span> |
| Capstone Project<br><span class="zh-inline">综合项目</span> | Type-safe task scheduler<br><span class="zh-inline">类型安全的任务调度器</span> | 4–6 hours<br><span class="zh-inline">4–6 小时</span> | Submit a working implementation<br><span class="zh-inline">完成一个可运行实现。</span> |

**Total estimated time**: 30–45 hours for thorough study with exercises.<br><span class="zh-inline">**预计总学习时间**：如果把练习认真做完，大约需要 30–45 小时。</span>

### Working Through Exercises<br><span class="zh-inline">练习怎么做</span>

Every chapter ends with a hands-on exercise. For maximum learning:<br><span class="zh-inline">每章结尾都有动手练习。想把收益拉满，建议按下面这套方式来：</span>

1. **Try it yourself first** — spend at least 15 minutes before opening the solution<br><span class="zh-inline">**先自己做。** 至少先花 15 分钟思考，再去看答案。</span>
2. **Type the code** — don't copy-paste; typing builds muscle memory<br><span class="zh-inline">**亲手敲代码。** 别复制粘贴，手敲才能形成肌肉记忆。</span>
3. **Modify the solution** — add a feature, change a constraint, break something on purpose<br><span class="zh-inline">**改造答案。** 加功能、改约束、故意弄坏一部分，再自己修回来。</span>
4. **Check cross-references** — most exercises combine patterns from multiple chapters<br><span class="zh-inline">**顺着交叉引用看。** 多数练习都把几章里的模式揉到了一起。</span>

The capstone project (Appendix) ties together patterns from across the book into a single, production-quality system.<br><span class="zh-inline">附录里的综合项目会把整本书里的模式串到一个完整的、接近生产质量的系统里。</span>

## Table of Contents<br><span class="zh-inline">目录总览</span>

### Part I: Type-Level Patterns<br><span class="zh-inline">第一部分：类型层模式</span>

**[1. Generics — The Full Picture](ch01-generics-the-full-picture.md)** 🟢<br><span class="zh-inline">**[1. 泛型全景图](ch01-generics-the-full-picture.md)** 🟢</span>
Monomorphization, code bloat trade-offs, generics vs enums vs trait objects, const generics, `const fn`.<br><span class="zh-inline">单态化、代码膨胀权衡、泛型与枚举及 trait object 的取舍、const generics、`const fn`。</span>

**[2. Traits In Depth](ch02-traits-in-depth.md)** 🟡<br><span class="zh-inline">**[2. Trait 深入解析](ch02-traits-in-depth.md)** 🟡</span>
Associated types, GATs, blanket impls, marker traits, vtables, HRTBs, extension traits, enum dispatch.<br><span class="zh-inline">关联类型、GAT、blanket impl、标记 trait、虚表、HRTB、扩展 trait、枚举分发。</span>

**[3. The Newtype and Type-State Patterns](ch03-the-newtype-and-type-state-patterns.md)** 🟡<br><span class="zh-inline">**[3. Newtype 与 Type-State 模式](ch03-the-newtype-and-type-state-patterns.md)** 🟡</span>
Zero-cost type safety, compile-time state machines, builder patterns, config traits.<br><span class="zh-inline">零成本类型安全、编译期状态机、builder 模式、配置 trait。</span>

**[4. PhantomData — Types That Carry No Data](ch04-phantomdata-types-that-carry-no-data.md)** 🔴<br><span class="zh-inline">**[4. PhantomData：不携带数据的类型](ch04-phantomdata-types-that-carry-no-data.md)** 🔴</span>
Lifetime branding, unit-of-measure pattern, drop check, variance.<br><span class="zh-inline">生命周期标记、物理量单位模式、drop check、变型。</span>

### Part II: Concurrency & Runtime<br><span class="zh-inline">第二部分：并发与运行时</span>

**[5. Channels and Message Passing](ch05-channels-and-message-passing.md)** 🟢<br><span class="zh-inline">**[5. Channel 与消息传递](ch05-channels-and-message-passing.md)** 🟢</span>
`std::sync::mpsc`, crossbeam, `select!`, backpressure, actor pattern.<br><span class="zh-inline">`std::sync::mpsc`、crossbeam、`select!`、背压、actor 模式。</span>

**[6. Concurrency vs Parallelism vs Threads](ch06-concurrency-vs-parallelism-vs-threads.md)** 🟡<br><span class="zh-inline">**[6. 并发、并行与线程](ch06-concurrency-vs-parallelism-vs-threads.md)** 🟡</span>
OS threads, scoped threads, rayon, Mutex/RwLock/Atomics, Condvar, OnceLock, lock-free patterns.<br><span class="zh-inline">操作系统线程、作用域线程、rayon、Mutex / RwLock / 原子类型、Condvar、OnceLock、无锁模式。</span>

**[7. Closures and Higher-Order Functions](ch07-closures-and-higher-order-functions.md)** 🟢<br><span class="zh-inline">**[7. 闭包与高阶函数](ch07-closures-and-higher-order-functions.md)** 🟢</span>
`Fn`/`FnMut`/`FnOnce`, closures as parameters/return values, combinators, higher-order APIs.<br><span class="zh-inline">`Fn` / `FnMut` / `FnOnce`、闭包作为参数和返回值、组合器、高阶 API。</span>

**[8. Smart Pointers and Interior Mutability](ch08-smart-pointers-and-interior-mutability.md)** 🟡<br><span class="zh-inline">**[8. 智能指针与内部可变性](ch08-smart-pointers-and-interior-mutability.md)** 🟡</span>
Box, Rc, Arc, Weak, Cell/RefCell, Cow, Pin, ManuallyDrop.<br><span class="zh-inline">Box、Rc、Arc、Weak、Cell / RefCell、Cow、Pin、ManuallyDrop。</span>

### Part III: Systems & Production<br><span class="zh-inline">第三部分：系统与生产实践</span>

**[9. Error Handling Patterns](ch09-error-handling-patterns.md)** 🟢<br><span class="zh-inline">**[9. 错误处理模式](ch09-error-handling-patterns.md)** 🟢</span>
thiserror vs anyhow, `#[from]`, `.context()`, `?` operator, panics.<br><span class="zh-inline">thiserror 与 anyhow、`#[from]`、`.context()`、`?` 运算符、panic。</span>

**[10. Serialization, Zero-Copy, and Binary Data](ch10-serialization-zero-copy-and-binary-data.md)** 🟡<br><span class="zh-inline">**[10. 序列化、零拷贝与二进制数据](ch10-serialization-zero-copy-and-binary-data.md)** 🟡</span>
serde fundamentals, enum representations, zero-copy deserialization, `repr(C)`, `bytes::Bytes`.<br><span class="zh-inline">serde 基础、枚举表示方式、零拷贝反序列化、`repr(C)`、`bytes::Bytes`。</span>

**[11. Unsafe Rust — Controlled Danger](ch11-unsafe-rust-controlled-danger.md)** 🔴<br><span class="zh-inline">**[11. Unsafe Rust：受控的危险](ch11-unsafe-rust-controlled-danger.md)** 🔴</span>
Five superpowers, sound abstractions, FFI, UB pitfalls, arena/slab allocators.<br><span class="zh-inline">五大超能力、健全抽象、FFI、UB 陷阱、arena / slab 分配器。</span>

**[12. Macros — Code That Writes Code](ch12-macros-code-that-writes-code.md)** 🟡<br><span class="zh-inline">**[12. 宏：会写代码的代码](ch12-macros-code-that-writes-code.md)** 🟡</span>
`macro_rules!`, when (not) to use macros, proc macros, derive macros, `syn`/`quote`.<br><span class="zh-inline">`macro_rules!`、何时该用宏、何时别用宏、过程宏、派生宏、`syn` / `quote`。</span>

**[13. Testing and Benchmarking Patterns](ch13-testing-and-benchmarking-patterns.md)** 🟢<br><span class="zh-inline">**[13. 测试与基准模式](ch13-testing-and-benchmarking-patterns.md)** 🟢</span>
Unit/integration/doc tests, proptest, criterion, mocking strategies.<br><span class="zh-inline">单元测试、集成测试、文档测试、proptest、criterion、mock 策略。</span>

**[14. Crate Architecture and API Design](ch14-crate-architecture-and-api-design.md)** 🟡<br><span class="zh-inline">**[14. Crate 架构与 API 设计](ch14-crate-architecture-and-api-design.md)** 🟡</span>
Module layout, API design checklist, ergonomic parameters, feature flags, workspaces.<br><span class="zh-inline">模块布局、API 设计清单、易用参数设计、feature flag、workspace。</span>

**[15. Async/Await Essentials](ch15-asyncawait-essentials.md)** 🔴<br><span class="zh-inline">**[15. Async/Await 核心要点](ch15-asyncawait-essentials.md)** 🔴</span>
Futures, Tokio quick-start, common pitfalls. (For deep async coverage, see our Async Rust Training.)<br><span class="zh-inline">Future、Tokio 快速上手、常见陷阱。若想系统深挖 async，请继续看配套的 Async Rust Training。</span>

### Appendices<br><span class="zh-inline">附录</span>

**[Summary and Reference Card](ch17-summary-and-reference-card.md)**<br><span class="zh-inline">**[总结与参考卡片](ch17-summary-and-reference-card.md)**</span>
Pattern decision guide, trait bounds cheat sheet, lifetime elision rules, further reading.<br><span class="zh-inline">模式选择指南、trait bound 速查、生命周期省略规则，以及延伸阅读。</span>

**[Capstone Project: Type-Safe Task Scheduler](ch18-capstone-project.md)**<br><span class="zh-inline">**[综合项目：类型安全任务调度器](ch18-capstone-project.md)**</span>
Integrate generics, traits, typestate, channels, error handling, and testing into a complete system.<br><span class="zh-inline">把泛型、trait、typestate、channel、错误处理与测试整合成一个完整系统。</span>

***
