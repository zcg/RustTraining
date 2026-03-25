# Rust for C# Programmers: Complete Training Guide<br><span class="zh-inline">Rust 面向 C# 程序员：完整训练指南</span>

A comprehensive guide to learning Rust for developers with C# experience. This guide covers everything from basic syntax to advanced patterns, focusing on the conceptual shifts and practical differences between the two languages.<br><span class="zh-inline">这是一本面向 C# 开发者的 Rust 完整训练指南，内容从基础语法一直覆盖到高级模式，重点讲清两门语言在思维方式和工程实践上的关键差异。</span>

## Course Overview<br><span class="zh-inline">课程总览</span>

- **The case for Rust** — Why Rust matters for C# developers: performance, safety, and correctness<br><span class="zh-inline">**为什么要学 Rust**：对 C# 开发者来说，Rust 的价值主要体现在性能、安全性和正确性。</span>
- **Getting started** — Installation, tooling, and your first program<br><span class="zh-inline">**快速开始**：安装、工具链和第一个程序。</span>
- **Basic building blocks** — Types, variables, control flow<br><span class="zh-inline">**基础构件**：类型、变量和控制流。</span>
- **Data structures** — Arrays, tuples, structs, collections<br><span class="zh-inline">**数据结构**：数组、元组、结构体和集合。</span>
- **Pattern matching and enums** — Algebraic data types and exhaustive matching<br><span class="zh-inline">**模式匹配与枚举**：代数数据类型与穷尽匹配。</span>
- **Ownership and borrowing** — Rust's memory management model<br><span class="zh-inline">**所有权与借用**：Rust 的内存管理模型。</span>
- **Modules and crates** — Code organization and dependencies<br><span class="zh-inline">**模块与 crate**：代码组织方式与依赖管理。</span>
- **Error handling** — Result-based error propagation<br><span class="zh-inline">**错误处理**：基于 Result 的错误传播方式。</span>
- **Traits and generics** — Rust's type system<br><span class="zh-inline">**Trait 与泛型**：Rust 类型系统的核心能力。</span>
- **Closures and iterators** — Functional programming patterns<br><span class="zh-inline">**闭包与迭代器**：函数式编程常用模式。</span>
- **Concurrency** — Fearless concurrency with type-system guarantees, async/await deep dive<br><span class="zh-inline">**并发**：在类型系统保证下的 fearless concurrency，以及 async/await 深入解析。</span>
- **Unsafe Rust and FFI** — When and how to go beyond safe Rust<br><span class="zh-inline">**Unsafe Rust 与 FFI**：何时以及如何越过安全 Rust 的边界。</span>
- **Migration patterns** — Real-world C# to Rust patterns and incremental adoption<br><span class="zh-inline">**迁移模式**：真实世界里的 C# → Rust 转换模式和渐进式引入方式。</span>
- **Best practices** — Idiomatic Rust for C# developers<br><span class="zh-inline">**最佳实践**：适合 C# 开发者掌握的 Rust 惯用写法。</span>

---

# Self-Study Guide<br><span class="zh-inline">自学指南</span>

This material works both as an instructor-led course and for self-study. If you're working through it on your own, here's how to get the most out of it.<br><span class="zh-inline">这套材料既适合讲师带读，也适合个人自学。如果是自己推进，下面这套节奏最容易把效果吃满。</span>

**Pacing recommendations:**<br><span class="zh-inline">**学习节奏建议：**</span>

| Chapters | Topic | Suggested Time | Checkpoint |
|----------|-------|---------------|------------|
| 1–4<br><span class="zh-inline">第 1–4 章</span> | Setup, types, control flow<br><span class="zh-inline">环境准备、类型与控制流</span> | 1 day<br><span class="zh-inline">1 天</span> | You can write a CLI temperature converter in Rust<br><span class="zh-inline">能够用 Rust 写一个命令行温度转换器。</span> |
| 5–6<br><span class="zh-inline">第 5–6 章</span> | Data structures, enums, pattern matching<br><span class="zh-inline">数据结构、枚举与模式匹配</span> | 1–2 days<br><span class="zh-inline">1–2 天</span> | You can define an enum with data and `match` exhaustively on it<br><span class="zh-inline">能够定义带数据的枚举，并用 `match` 做穷尽匹配。</span> |
| 7<br><span class="zh-inline">第 7 章</span> | Ownership and borrowing<br><span class="zh-inline">所有权与借用</span> | 1–2 days<br><span class="zh-inline">1–2 天</span> | You can explain *why* `let s2 = s1` invalidates `s1`<br><span class="zh-inline">能够讲清 *为什么* `let s2 = s1` 会让 `s1` 失效。</span> |
| 8–9<br><span class="zh-inline">第 8–9 章</span> | Modules, error handling<br><span class="zh-inline">模块与错误处理</span> | 1 day<br><span class="zh-inline">1 天</span> | You can create a multi-file project that propagates errors with `?`<br><span class="zh-inline">能够建立一个多文件项目，并用 `?` 传播错误。</span> |
| 10–12<br><span class="zh-inline">第 10–12 章</span> | Traits, generics, closures, iterators<br><span class="zh-inline">Trait、泛型、闭包与迭代器</span> | 1–2 days<br><span class="zh-inline">1–2 天</span> | You can translate a LINQ chain to Rust iterators<br><span class="zh-inline">能够把一串 LINQ 操作翻译成 Rust 迭代器链。</span> |
| 13<br><span class="zh-inline">第 13 章</span> | Concurrency and async<br><span class="zh-inline">并发与 async</span> | 1 day<br><span class="zh-inline">1 天</span> | You can write a thread-safe counter with `Arc<Mutex<T>>`<br><span class="zh-inline">能够用 `Arc<Mutex<T>>` 写出线程安全计数器。</span> |
| 14<br><span class="zh-inline">第 14 章</span> | Unsafe Rust, FFI, testing<br><span class="zh-inline">Unsafe Rust、FFI 与测试</span> | 1 day<br><span class="zh-inline">1 天</span> | You can call a Rust function from C# via P/Invoke<br><span class="zh-inline">能够通过 P/Invoke 从 C# 调用 Rust 函数。</span> |
| 15–16<br><span class="zh-inline">第 15–16 章</span> | Migration, best practices, tooling<br><span class="zh-inline">迁移、最佳实践与工具链</span> | At your own pace<br><span class="zh-inline">按个人节奏</span> | Reference material — consult as you write real code<br><span class="zh-inline">属于参考型内容，写真实项目时反复查阅即可。</span> |
| 17<br><span class="zh-inline">第 17 章</span> | Capstone project<br><span class="zh-inline">综合项目</span> | 1–2 days<br><span class="zh-inline">1–2 天</span> | You have a working CLI tool that fetches weather data<br><span class="zh-inline">完成一个可以获取天气数据的 CLI 工具。</span> |

**How to use the exercises:**<br><span class="zh-inline">**练习怎么做：**</span>

- Chapters include hands-on exercises in collapsible `<details>` blocks with solutions<br><span class="zh-inline">每章都带有可折叠的 `<details>` 实战练习块，并附有参考答案。</span>
- **Always try the exercise before expanding the solution.** Struggling with the borrow checker is part of learning — the compiler's error messages are your teacher<br><span class="zh-inline">**一定先自己做，再展开答案。** 和借用检查器缠斗本来就是学习过程的一部分，编译器的报错就是老师。</span>
- If you're stuck for more than 15 minutes, expand the solution, study it, then close it and try again from scratch<br><span class="zh-inline">如果卡住超过 15 分钟，就先展开答案研究，再关掉答案从头重做一遍。</span>
- The [Rust Playground](https://play.rust-lang.org/) lets you run code without a local install<br><span class="zh-inline">[Rust Playground](https://play.rust-lang.org/) 可以在没有本地环境的情况下直接运行代码。</span>

**Difficulty indicators:**<br><span class="zh-inline">**难度标记：**</span>

- 🟢 **Beginner** — Direct translation from C# concepts<br><span class="zh-inline">🟢 **初级**：很多内容都能从 C# 经验直接迁移过来。</span>
- 🟡 **Intermediate** — Requires understanding ownership or traits<br><span class="zh-inline">🟡 **中级**：需要真正理解所有权或 trait。</span>
- 🔴 **Advanced** — Lifetimes, async internals, or unsafe code<br><span class="zh-inline">🔴 **高级**：涉及生命周期、async 内部机制或 unsafe 代码。</span>

**When you hit a wall:**<br><span class="zh-inline">**当读到卡住时：**</span>

- Read the compiler error message carefully — Rust's errors are exceptionally helpful<br><span class="zh-inline">仔细看编译器报错，Rust 的错误信息通常特别有帮助。</span>
- Re-read the relevant section; concepts like ownership (ch7) often click on the second pass<br><span class="zh-inline">回头重读相关章节，像所有权这种概念，很多时候第二遍才会真正开窍。</span>
- The [Rust standard library docs](https://doc.rust-lang.org/std/) are excellent — search for any type or method<br><span class="zh-inline">[Rust 标准库文档](https://doc.rust-lang.org/std/) 质量很高，类型和方法问题都值得直接去查。</span>
- For deeper async patterns, see the companion [Async Rust Training](../async-book/)<br><span class="zh-inline">如果想继续深挖 async，可以配合阅读姊妹教材 [Async Rust Training](../async-book/)。</span>

---

# Table of Contents<br><span class="zh-inline">目录总览</span>

## Part I — Foundations<br><span class="zh-inline">第一部分：基础</span>

### 1. Introduction and Motivation 🟢<br><span class="zh-inline">1. 引言与动机 🟢</span>
- [The Case for Rust for C# Developers](ch01-introduction-and-motivation.md#the-case-for-rust-for-c-developers)<br><span class="zh-inline">Rust 为什么值得 C# 开发者学习</span>
- [Common C# Pain Points That Rust Addresses](ch01-introduction-and-motivation.md#common-c-pain-points-that-rust-addresses)<br><span class="zh-inline">Rust 解决哪些 C# 常见痛点</span>
- [When to Choose Rust Over C#](ch01-introduction-and-motivation.md#when-to-choose-rust-over-c)<br><span class="zh-inline">什么时候该选 Rust，而不是 C#</span>
- [Language Philosophy Comparison](ch01-introduction-and-motivation.md#language-philosophy-comparison)<br><span class="zh-inline">语言哲学对比</span>
- [Quick Reference: Rust vs C#](ch01-introduction-and-motivation.md#quick-reference-rust-vs-c)<br><span class="zh-inline">Rust 与 C# 快速对照</span>

### 2. Getting Started 🟢<br><span class="zh-inline">2. 快速开始 🟢</span>
- [Installation and Setup](ch02-getting-started.md#installation-and-setup)<br><span class="zh-inline">安装与环境配置</span>
- [Your First Rust Program](ch02-getting-started.md#your-first-rust-program)<br><span class="zh-inline">第一个 Rust 程序</span>
- [Cargo vs NuGet/MSBuild](ch02-getting-started.md#cargo-vs-nugetmsbuild)<br><span class="zh-inline">Cargo 与 NuGet / MSBuild 对比</span>
- [Reading Input and CLI Arguments](ch02-getting-started.md#reading-input-and-cli-arguments)<br><span class="zh-inline">读取输入与命令行参数</span>
- [Essential Rust Keywords *(optional reference — consult as needed)*](ch02-1-essential-keywords-reference.md#essential-rust-keywords-for-c-developers)<br><span class="zh-inline">Rust 关键字速查表（可选参考）</span>

### 3. Built-in Types and Variables 🟢<br><span class="zh-inline">3. 内置类型与变量 🟢</span>
- [Variables and Mutability](ch03-built-in-types-and-variables.md#variables-and-mutability)<br><span class="zh-inline">变量与可变性</span>
- [Primitive Types Comparison](ch03-built-in-types-and-variables.md#primitive-types)<br><span class="zh-inline">基本类型对照</span>
- [String Types: String vs &str](ch03-built-in-types-and-variables.md#string-types-string-vs-str)<br><span class="zh-inline">字符串类型：String 与 &str</span>
- [Printing and String Formatting](ch03-built-in-types-and-variables.md#printing-and-string-formatting)<br><span class="zh-inline">打印与字符串格式化</span>
- [Type Casting and Conversions](ch03-built-in-types-and-variables.md#type-casting-and-conversions)<br><span class="zh-inline">类型转换</span>
- [True Immutability vs Record Illusions](ch03-1-true-immutability-vs-record-illusions.md#true-immutability-vs-record-illusions)<br><span class="zh-inline">真正的不可变性与 record 幻觉</span>

### 4. Control Flow 🟢<br><span class="zh-inline">4. 控制流 🟢</span>
- [Functions vs Methods](ch04-control-flow.md#functions-vs-methods)<br><span class="zh-inline">函数与方法</span>
- [Expression vs Statement (Important!)](ch04-control-flow.md#expression-vs-statement-important)<br><span class="zh-inline">表达式与语句的差异</span>
- [Conditional Statements](ch04-control-flow.md#conditional-statements)<br><span class="zh-inline">条件语句</span>
- [Loops and Iteration](ch04-control-flow.md#loops)<br><span class="zh-inline">循环与迭代</span>

### 5. Data Structures and Collections 🟢<br><span class="zh-inline">5. 数据结构与集合 🟢</span>
- [Tuples and Destructuring](ch05-data-structures-and-collections.md#tuples-and-destructuring)<br><span class="zh-inline">元组与解构</span>
- [Arrays and Slices](ch05-data-structures-and-collections.md#arrays-and-slices)<br><span class="zh-inline">数组与切片</span>
- [Structs vs Classes](ch05-data-structures-and-collections.md#structs-vs-classes)<br><span class="zh-inline">Struct 与 Class</span>
- [Constructor Patterns](ch05-1-constructor-patterns.md#constructor-patterns)<br><span class="zh-inline">构造器模式</span>
- [`Vec<T>` vs `List<T>`](ch05-2-collections-vec-hashmap-and-iterators.md#vect-vs-listt)<br><span class="zh-inline">`Vec<T>` 与 `List<T>`</span>
- [HashMap vs Dictionary](ch05-2-collections-vec-hashmap-and-iterators.md#hashmap-vs-dictionary)<br><span class="zh-inline">HashMap 与 Dictionary</span>

### 6. Enums and Pattern Matching 🟡<br><span class="zh-inline">6. 枚举与模式匹配 🟡</span>
- [Algebraic Data Types vs C# Unions](ch06-enums-and-pattern-matching.md#algebraic-data-types-vs-c-unions)<br><span class="zh-inline">代数数据类型与 C# 联合类型</span>
- [Exhaustive Pattern Matching](ch06-1-exhaustive-matching-and-null-safety.md#exhaustive-pattern-matching-compiler-guarantees-vs-runtime-errors)<br><span class="zh-inline">穷尽模式匹配</span>
- [`Option<T>` for Null Safety](ch06-1-exhaustive-matching-and-null-safety.md#null-safety-nullablet-vs-optiont)<br><span class="zh-inline">用 `Option<T>` 处理空安全</span>
- [Guards and Advanced Patterns](ch06-enums-and-pattern-matching.md#guards-and-advanced-patterns)<br><span class="zh-inline">guard 与进阶模式</span>

### 7. Ownership and Borrowing 🟡<br><span class="zh-inline">7. 所有权与借用 🟡</span>
- [Understanding Ownership](ch07-ownership-and-borrowing.md#understanding-ownership)<br><span class="zh-inline">理解所有权</span>
- [Move Semantics vs Reference Semantics](ch07-ownership-and-borrowing.md#move-semantics)<br><span class="zh-inline">移动语义与引用语义</span>
- [Borrowing and References](ch07-ownership-and-borrowing.md#borrowing-basics)<br><span class="zh-inline">借用与引用</span>
- [Memory Safety Deep Dive](ch07-1-memory-safety-deep-dive.md#references-vs-pointers)<br><span class="zh-inline">内存安全深入解析</span>
- [Lifetimes Deep Dive](ch07-2-lifetimes-deep-dive.md#lifetimes-telling-the-compiler-how-long-references-live) 🔴<br><span class="zh-inline">生命周期深入解析 🔴</span>
- [Smart Pointers, Drop, and Deref](ch07-3-smart-pointers-beyond-single-ownership.md#smart-pointers-when-single-ownership-isnt-enough) 🔴<br><span class="zh-inline">智能指针、Drop 与 Deref 🔴</span>

### 8. Crates and Modules 🟢<br><span class="zh-inline">8. crate 与模块 🟢</span>
- [Rust Modules vs C# Namespaces](ch08-crates-and-modules.md#rust-modules-vs-c-namespaces)<br><span class="zh-inline">Rust 模块与 C# 命名空间</span>
- [Crates vs .NET Assemblies](ch08-crates-and-modules.md#crates-vs-net-assemblies)<br><span class="zh-inline">crate 与 .NET 程序集</span>
- [Package Management: Cargo vs NuGet](ch08-1-package-management-cargo-vs-nuget.md#package-management-cargo-vs-nuget)<br><span class="zh-inline">包管理：Cargo 与 NuGet</span>

### 9. Error Handling 🟡<br><span class="zh-inline">9. 错误处理 🟡</span>
- [Exceptions vs `Result<T, E>`](ch09-error-handling.md#exceptions-vs-resultt-e)<br><span class="zh-inline">异常与 `Result<T, E>`</span>
- [The ? Operator](ch09-error-handling.md#the--operator-propagating-errors-concisely)<br><span class="zh-inline">`?` 运算符</span>
- [Custom Error Types](ch06-1-exhaustive-matching-and-null-safety.md#custom-error-types)<br><span class="zh-inline">自定义错误类型</span>
- [Crate-Level Error Types and Result Aliases](ch09-1-crate-level-error-types-and-result-alias.md#crate-level-error-types-and-result-aliases)<br><span class="zh-inline">crate 级错误类型与 Result 别名</span>
- [Error Recovery Patterns](ch09-1-crate-level-error-types-and-result-alias.md#error-recovery-patterns)<br><span class="zh-inline">错误恢复模式</span>

### 10. Traits and Generics 🟡<br><span class="zh-inline">10. Trait 与泛型 🟡</span>
- [Traits vs Interfaces](ch10-traits-and-generics.md#traits---rusts-interfaces)<br><span class="zh-inline">Trait 与接口</span>
- [Inheritance vs Composition](ch10-2-inheritance-vs-composition.md#inheritance-vs-composition)<br><span class="zh-inline">继承与组合</span>
- [Generic Constraints: where vs trait bounds](ch10-1-generic-constraints.md#generic-constraints-where-vs-trait-bounds)<br><span class="zh-inline">泛型约束：where 与 trait bound</span>
- [Common Standard Library Traits](ch10-traits-and-generics.md#common-standard-library-traits)<br><span class="zh-inline">标准库常见 Trait</span>

### 11. From and Into Traits 🟡<br><span class="zh-inline">11. From 与 Into Trait 🟡</span>
- [Type Conversions in Rust](ch11-from-and-into-traits.md#type-conversions-in-rust)<br><span class="zh-inline">Rust 中的类型转换</span>
- [Implementing From for Custom Types](ch11-from-and-into-traits.md#rust-from-and-into)<br><span class="zh-inline">为自定义类型实现 From</span>

### 12. Closures and Iterators 🟡<br><span class="zh-inline">12. 闭包与迭代器 🟡</span>
- [Rust Closures](ch12-closures-and-iterators.md#rust-closures)<br><span class="zh-inline">Rust 闭包</span>
- [LINQ vs Rust Iterators](ch12-closures-and-iterators.md#linq-vs-rust-iterators)<br><span class="zh-inline">LINQ 与 Rust 迭代器</span>
- [Macros Primer](ch12-1-macros-primer.md#macros-code-that-writes-code)<br><span class="zh-inline">宏入门</span>

---

## Part II — Concurrency & Systems<br><span class="zh-inline">第二部分：并发与系统</span>

### 13. Concurrency 🔴<br><span class="zh-inline">13. 并发 🔴</span>
- [Thread Safety: Convention vs Type System Guarantees](ch13-concurrency.md#thread-safety-convention-vs-type-system-guarantees)<br><span class="zh-inline">线程安全：约定式与类型系统保证式</span>
- [async/await: C# Task vs Rust Future](ch13-1-asyncawait-deep-dive.md#async-programming-c-task-vs-rust-future)<br><span class="zh-inline">async/await：C# Task 与 Rust Future</span>
- [Cancellation Patterns](ch13-1-asyncawait-deep-dive.md#cancellation-cancellationtoken-vs-drop--select)<br><span class="zh-inline">取消模式</span>
- [Pin and tokio::spawn](ch13-1-asyncawait-deep-dive.md#pin-why-rust-async-has-a-concept-c-doesnt)<br><span class="zh-inline">Pin 与 tokio::spawn</span>

### 14. Unsafe Rust, FFI, and Testing 🟡<br><span class="zh-inline">14. Unsafe Rust、FFI 与测试 🟡</span>
- [When and Why to Use Unsafe](ch14-unsafe-rust-and-ffi.md#when-you-need-unsafe)<br><span class="zh-inline">何时以及为何使用 Unsafe</span>
- [Interop with C# via FFI](ch14-unsafe-rust-and-ffi.md#interop-with-c-via-ffi)<br><span class="zh-inline">通过 FFI 与 C# 互操作</span>
- [Testing in Rust vs C#](ch14-1-testing.md#testing-in-rust-vs-c)<br><span class="zh-inline">Rust 与 C# 的测试方式对比</span>
- [Property Testing and Mocking](ch14-1-testing.md#property-testing-proving-correctness-at-scale)<br><span class="zh-inline">性质测试与 Mocking</span>

---

## Part III — Migration & Best Practices<br><span class="zh-inline">第三部分：迁移与最佳实践</span>

### 15. Migration Patterns and Case Studies 🟡<br><span class="zh-inline">15. 迁移模式与案例研究 🟡</span>
- [Common C# Patterns in Rust](ch15-migration-patterns-and-case-studies.md#common-c-patterns-in-rust)<br><span class="zh-inline">C# 常见模式在 Rust 中的改写</span>
- [Essential Crates for C# Developers](ch15-1-essential-crates-for-c-developers.md#essential-crates-for-c-developers)<br><span class="zh-inline">C# 开发者必备 crate</span>
- [Incremental Adoption Strategy](ch15-2-incremental-adoption-strategy.md#incremental-adoption-strategy)<br><span class="zh-inline">渐进式引入策略</span>

### 16. Best Practices and Reference 🟡<br><span class="zh-inline">16. 最佳实践与参考 🟡</span>
- [Idiomatic Rust for C# Developers](ch16-best-practices.md#best-practices-for-c-developers)<br><span class="zh-inline">适合 C# 开发者掌握的 Rust 惯用法</span>
- [Performance Comparison: Managed vs Native](ch16-1-performance-comparison-and-migration.md#performance-comparison-managed-vs-native)<br><span class="zh-inline">托管与原生性能对比</span>
- [Common Pitfalls and Solutions](ch16-2-learning-path-and-resources.md#common-pitfalls-for-c-developers)<br><span class="zh-inline">常见陷阱与解决方案</span>
- [Learning Path and Resources](ch16-2-learning-path-and-resources.md#learning-path-and-next-steps)<br><span class="zh-inline">学习路径与资源</span>
- [Rust Tooling Ecosystem](ch16-3-rust-tooling-ecosystem.md#essential-rust-tooling-for-c-developers)<br><span class="zh-inline">Rust 工具生态</span>

---

## Capstone<br><span class="zh-inline">综合项目</span>

### 17. Capstone Project 🟡<br><span class="zh-inline">17. 综合项目 🟡</span>
- [Build a CLI Weather Tool](ch17-capstone-project.md#capstone-project-build-a-cli-weather-tool) — combines structs, traits, error handling, async, modules, serde, and testing into a working application<br><span class="zh-inline">构建一个命令行天气工具，把结构体、trait、错误处理、async、模块、serde 和测试串成一个可运行应用。</span>

***
