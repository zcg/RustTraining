# Rust for Java Programmers<br><span class="zh-inline">Rust 面向 Java 程序员</span>

> **AI-driven guide**: Written with GPT-5.4 assistance for experienced Java developers who want to learn Rust with clear conceptual mapping and practical migration advice.<br><span class="zh-inline">**AI 驱动说明**：本书由 GPT-5.4 协助撰写，面向已经有 Java 经验、希望系统学习 Rust 的开发者。</span>

This book is a bridge text. It assumes comfort with Java, Maven or Gradle, the JVM, exceptions, interfaces, streams, and the usual enterprise toolkit. The goal is not to re-teach programming. The goal is to show which instincts transfer cleanly, which ones must change, and how to reach idiomatic Rust without dragging Java habits everywhere.<br><span class="zh-inline">这本书定位成桥接教材。默认已经熟悉 Java、Maven 或 Gradle、JVM、异常、接口、Stream，以及常见企业开发工具。重点不是重复教授编程基础，而是说明哪些经验可以平移，哪些习惯必须调整，以及怎样走到更符合 Rust 社区习惯的写法。</span>

## Who This Book Is For<br><span class="zh-inline">适合哪些读者</span>

- Developers who already write Java for backend services, tooling, data pipelines, or libraries<br><span class="zh-inline">已经用 Java 写后端服务、工具、数据处理程序或基础库的开发者。</span>
- Teams evaluating Rust for performance-sensitive or safety-sensitive components<br><span class="zh-inline">正在评估 Rust，用于性能敏感或安全敏感模块的团队。</span>
- Readers who want a chapter order that moves from syntax and ownership into async, FFI, and migration strategy<br><span class="zh-inline">希望按“语法与所有权 → async → FFI → 迁移策略”顺序系统推进的读者。</span>

## What You Will Learn<br><span class="zh-inline">这本书会覆盖什么</span>

- How Rust differs from Java in memory management, error handling, type modeling, and concurrency<br><span class="zh-inline">Rust 在内存管理、错误处理、类型建模和并发方面与 Java 的核心差异。</span>
- How to map Java concepts such as interfaces, records, streams, `Optional`, and `CompletableFuture` into Rust equivalents<br><span class="zh-inline">如何把接口、record、Stream、`Optional`、`CompletableFuture` 这些 Java 经验映射到 Rust 世界。</span>
- How to structure real Rust projects with Cargo, crates, modules, testing, and common ecosystem tools<br><span class="zh-inline">如何使用 Cargo、crate、模块、测试和常见生态工具来组织真实 Rust 项目。</span>
- How to migrate gradually instead of attempting a reckless full rewrite<br><span class="zh-inline">如何渐进式迁移，而不是头脑发热搞一次性重写。</span>

## Suggested Reading Order<br><span class="zh-inline">建议阅读顺序</span>

| Range<br><span class="zh-inline">范围</span> | Focus<br><span class="zh-inline">重点</span> | Outcome<br><span class="zh-inline">阶段结果</span> |
|---|---|---|
| Chapters 1-4<br><span class="zh-inline">第 1-4 章</span> | Motivation, setup, core syntax<br><span class="zh-inline">动机、环境、基础语法</span> | Can read and write small Rust programs<br><span class="zh-inline">能够读写小型 Rust 程序。</span> |
| Chapters 5-7<br><span class="zh-inline">第 5-7 章</span> | Data modeling and ownership<br><span class="zh-inline">数据建模与所有权</span> | Can explain moves, borrows, and `Option`<br><span class="zh-inline">能够讲清 move、borrow 和 `Option`。</span> |
| Chapters 8-10<br><span class="zh-inline">第 8-10 章</span> | Project structure, errors, traits<br><span class="zh-inline">工程结构、错误、trait</span> | Can organize multi-file crates and design APIs<br><span class="zh-inline">能够组织多文件 crate 并设计基础 API。</span> |
| Chapters 11-14<br><span class="zh-inline">第 11-14 章</span> | Conversions, iterators, async, FFI, testing<br><span class="zh-inline">转换、迭代器、async、FFI、测试</span> | Can build realistic services and tools<br><span class="zh-inline">能够开始写接近真实项目的工具和服务。</span> |
| Chapters 15-17<br><span class="zh-inline">第 15-17 章</span> | Migration, tooling, capstone<br><span class="zh-inline">迁移、工具链、综合项目</span> | Can plan a Java-to-Rust adoption path<br><span class="zh-inline">能够设计一条从 Java 过渡到 Rust 的采用方案。</span> |

## Companion Books In This Repository<br><span class="zh-inline">仓库里的配套教材</span>

- [Rust for C/C++ Programmers](../c-cpp-book/)<br><span class="zh-inline">适合需要和 C/C++ 心智做对照的读者。</span>
- [Rust for C# Programmers](../csharp-book/)<br><span class="zh-inline">适合同时关心托管运行时与 .NET 生态对照的读者。</span>
- [Rust for Python Programmers](../python-book/)<br><span class="zh-inline">适合还要和脚本生态做横向比较的读者。</span>
- [Async Rust: From Futures to Production](../async-book/)<br><span class="zh-inline">适合继续深挖异步模型与生产实践。</span>
- [Rust Patterns](../rust-patterns-book/)<br><span class="zh-inline">适合进入高级模式与工程细节。</span>

## Table of Contents<br><span class="zh-inline">目录</span>

### Part I — Foundations<br><span class="zh-inline">第一部分：基础</span>

- [1. Introduction and Motivation](ch01-introduction-and-motivation.md)<br><span class="zh-inline">1. 引言与动机</span>
- [2. Getting Started](ch02-getting-started.md)<br><span class="zh-inline">2. 快速开始</span>
- [3. Built-in Types and Variables](ch03-built-in-types-and-variables.md)<br><span class="zh-inline">3. 内置类型与变量</span>
- [4. Control Flow](ch04-control-flow.md)<br><span class="zh-inline">4. 控制流</span>
- [5. Data Structures and Collections](ch05-data-structures-and-collections.md)<br><span class="zh-inline">5. 数据结构与集合</span>
- [6. Enums and Pattern Matching](ch06-enums-and-pattern-matching.md)<br><span class="zh-inline">6. 枚举与模式匹配</span>
- [7. Ownership and Borrowing](ch07-ownership-and-borrowing.md)<br><span class="zh-inline">7. 所有权与借用</span>
- [8. Crates and Modules](ch08-crates-and-modules.md)<br><span class="zh-inline">8. crate 与模块</span>
- [9. Error Handling](ch09-error-handling.md)<br><span class="zh-inline">9. 错误处理</span>
- [10. Traits and Generics](ch10-traits-and-generics.md)<br><span class="zh-inline">10. Trait 与泛型</span>
- [10.3 Object-Oriented Thinking in Rust](ch10-3-object-oriented-thinking-in-rust.md)<br><span class="zh-inline">10.3 Rust 中的面向对象思维</span>
- [11. From and Into Traits](ch11-from-and-into-traits.md)<br><span class="zh-inline">11. From 与 Into Trait</span>
- [12. Closures and Iterators](ch12-closures-and-iterators.md)<br><span class="zh-inline">12. 闭包与迭代器</span>

### Part II — Concurrency and Systems<br><span class="zh-inline">第二部分：并发与系统</span>

- [13. Concurrency](ch13-concurrency.md)<br><span class="zh-inline">13. 并发</span>
- [13.1 Async/Await Deep Dive](ch13-1-asyncawait-deep-dive.md)<br><span class="zh-inline">13.1 Async/Await 深入解析</span>
- [14. Unsafe Rust and FFI](ch14-unsafe-rust-and-ffi.md)<br><span class="zh-inline">14. Unsafe Rust 与 FFI</span>
- [14.1 Testing](ch14-1-testing.md)<br><span class="zh-inline">14.1 测试</span>

### Part III — Migration and Practice<br><span class="zh-inline">第三部分：迁移与实践</span>

- [15. Migration Patterns and Case Studies](ch15-migration-patterns-and-case-studies.md)<br><span class="zh-inline">15. 迁移模式与案例</span>
- [15.1 Essential Crates for Java Developers](ch15-1-essential-crates-for-java-developers.md)<br><span class="zh-inline">15.1 Java 开发者常用 crate</span>
- [15.2 Incremental Adoption Strategy](ch15-2-incremental-adoption-strategy.md)<br><span class="zh-inline">15.2 渐进式引入策略</span>
- [15.3 Spring and Spring Boot Migration](ch15-3-spring-and-spring-boot-migration.md)<br><span class="zh-inline">15.3 Spring 与 Spring Boot 迁移</span>
- [16. Best Practices and Reference](ch16-best-practices.md)<br><span class="zh-inline">16. 最佳实践与参考</span>
- [16.1 Performance Comparison and Migration](ch16-1-performance-comparison-and-migration.md)<br><span class="zh-inline">16.1 性能比较与迁移</span>
- [16.2 Learning Path and Resources](ch16-2-learning-path-and-resources.md)<br><span class="zh-inline">16.2 学习路径与资源</span>
- [16.3 Rust Tooling for Java Developers](ch16-3-rust-tooling-ecosystem.md)<br><span class="zh-inline">16.3 面向 Java 开发者的 Rust 工具</span>

### Capstone<br><span class="zh-inline">综合项目</span>

- [17. Capstone Project: Migrate a Spring Boot User Service](ch17-capstone-project.md)<br><span class="zh-inline">17. 综合项目：迁移一个 Spring Boot 用户服务</span>
