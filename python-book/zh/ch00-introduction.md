# Rust for Python Programmers: Complete Training Guide<br><span class="zh-inline">Rust 面向 Python 程序员：完整训练指南</span>

A comprehensive guide to learning Rust for developers with Python experience. This guide
covers everything from basic syntax to advanced patterns, focusing on the conceptual shifts
required when moving from a dynamically-typed, garbage-collected language to a statically-typed
systems language with compile-time memory safety.<br><span class="zh-inline">这是一本面向 Python 开发者的 Rust 全面训练指南，内容从基础语法覆盖到高级模式，重点讲清从动态类型、垃圾回收语言迁移到静态类型、具备编译期内存安全保证的系统语言时，思维方式到底要怎么切换。</span>

## How to Use This Book<br><span class="zh-inline">如何使用本书</span>

**Self-study format**: Work through Part I (ch 1–6) first — these map closely to Python concepts you already know. Part II (ch 7–12) introduces Rust-specific ideas like ownership and traits. Part III (ch 13–16) covers advanced topics and migration.<br><span class="zh-inline">**自学建议**：先读第一部分，也就是第 1–6 章，这一段和 Python 已有经验贴得最近。第二部分，也就是第 7–12 章，会进入 Rust 自己那套核心概念，比如所有权和 trait。第三部分，也就是第 13–16 章，则开始处理进阶主题和迁移实践。</span>

**Pacing recommendations:**<br><span class="zh-inline">**学习节奏建议：**</span>

| Chapters | Topic | Suggested Time | Checkpoint |
|----------|-------|---------------|------------|
| 1–4<br><span class="zh-inline">第 1–4 章</span> | Setup, types, control flow<br><span class="zh-inline">环境准备、类型与控制流</span> | 1 day<br><span class="zh-inline">1 天</span> | You can write a CLI temperature converter in Rust<br><span class="zh-inline">能够用 Rust 写一个命令行温度转换器。</span> |
| 5–6<br><span class="zh-inline">第 5–6 章</span> | Data structures, enums, pattern matching<br><span class="zh-inline">数据结构、枚举与模式匹配</span> | 1–2 days<br><span class="zh-inline">1–2 天</span> | You can define an enum with data and `match` exhaustively on it<br><span class="zh-inline">能够定义携带数据的枚举，并用 `match` 做穷尽匹配。</span> |
| 7<br><span class="zh-inline">第 7 章</span> | Ownership and borrowing<br><span class="zh-inline">所有权与借用</span> | 1–2 days<br><span class="zh-inline">1–2 天</span> | You can explain *why* `let s2 = s1` invalidates `s1`<br><span class="zh-inline">能够讲清 *为什么* `let s2 = s1` 会让 `s1` 失效。</span> |
| 8–9<br><span class="zh-inline">第 8–9 章</span> | Modules, error handling<br><span class="zh-inline">模块与错误处理</span> | 1 day<br><span class="zh-inline">1 天</span> | You can create a multi-file project that propagates errors with `?`<br><span class="zh-inline">能够建立一个多文件项目，并用 `?` 传递错误。</span> |
| 10–12<br><span class="zh-inline">第 10–12 章</span> | Traits, generics, closures, iterators<br><span class="zh-inline">Trait、泛型、闭包与迭代器</span> | 1–2 days<br><span class="zh-inline">1–2 天</span> | You can translate a list comprehension to an iterator chain<br><span class="zh-inline">能够把列表推导式翻译成迭代器链。</span> |
| 13<br><span class="zh-inline">第 13 章</span> | Concurrency<br><span class="zh-inline">并发</span> | 1 day<br><span class="zh-inline">1 天</span> | You can write a thread-safe counter with `Arc<Mutex<T>>`<br><span class="zh-inline">能够用 `Arc<Mutex<T>>` 写出线程安全计数器。</span> |
| 14<br><span class="zh-inline">第 14 章</span> | Unsafe, PyO3, testing<br><span class="zh-inline">Unsafe、PyO3 与测试</span> | 1 day<br><span class="zh-inline">1 天</span> | You can call a Rust function from Python via PyO3<br><span class="zh-inline">能够通过 PyO3 从 Python 调用 Rust 函数。</span> |
| 15–16<br><span class="zh-inline">第 15–16 章</span> | Migration, best practices<br><span class="zh-inline">迁移与最佳实践</span> | At your own pace<br><span class="zh-inline">按个人节奏</span> | Reference material — consult as you write real code<br><span class="zh-inline">属于参考型内容，写真实项目时可以反复查阅。</span> |
| 17<br><span class="zh-inline">第 17 章</span> | Capstone project<br><span class="zh-inline">综合项目</span> | 2–3 days<br><span class="zh-inline">2–3 天</span> | Build a complete CLI app tying everything together<br><span class="zh-inline">完成一个把全部内容串起来的 CLI 应用。</span> |

**How to use the exercises:**<br><span class="zh-inline">**练习怎么做：**</span>

- Chapters include hands-on exercises in collapsible `<details>` blocks with solutions<br><span class="zh-inline">每章都配有可折叠 `<details>` 练习块，并附带答案。</span>
- **Always try the exercise before expanding the solution.** Struggling with the borrow checker is part of learning — the compiler's error messages are your teacher<br><span class="zh-inline">**一定要先自己做，再展开答案。** 和借用检查器缠斗本来就是学习过程的一部分，编译器报错本身就是老师。</span>
- If you're stuck for more than 15 minutes, expand the solution, study it, then close it and try again from scratch<br><span class="zh-inline">如果卡了超过 15 分钟，就先展开答案研究，再关掉答案，从头重做一遍。</span>
- The [Rust Playground](https://play.rust-lang.org/) lets you run code without a local install<br><span class="zh-inline">[Rust Playground](https://play.rust-lang.org/) 可以在不用本地安装环境的情况下直接运行代码。</span>

**Difficulty indicators:**<br><span class="zh-inline">**难度标记：**</span>

- 🟢 **Beginner** — Direct translation from Python concepts<br><span class="zh-inline">🟢 **初级**：几乎可以从 Python 经验直接迁移过来。</span>
- 🟡 **Intermediate** — Requires understanding ownership or traits<br><span class="zh-inline">🟡 **中级**：开始要求理解所有权或 trait。</span>
- 🔴 **Advanced** — Lifetimes, async internals, or unsafe code<br><span class="zh-inline">🔴 **高级**：涉及生命周期、async 内部机制或 unsafe 代码。</span>

**When you hit a wall:**<br><span class="zh-inline">**当读到卡壳时：**</span>

- Read the compiler error message carefully — Rust's errors are exceptionally helpful<br><span class="zh-inline">仔细看编译器报错，Rust 的错误信息通常非常有帮助。</span>
- Re-read the relevant section; concepts like ownership (ch7) often click on the second pass<br><span class="zh-inline">回头再读相关章节，像所有权这种概念，很多时候第二遍才会真正开窍。</span>
- The [Rust standard library docs](https://doc.rust-lang.org/std/) are excellent — search for any type or method<br><span class="zh-inline">[Rust 标准库文档](https://doc.rust-lang.org/std/) 质量很高，遇到类型或方法问题可以直接查。</span>
- For deeper async patterns, see the companion [Async Rust Training](../async-book/)<br><span class="zh-inline">如果想深入 async 模式，可以配合阅读姊妹教材 [Async Rust Training](../async-book/)。</span>

---

## Table of Contents<br><span class="zh-inline">目录总览</span>

### Part I — Foundations<br><span class="zh-inline">第一部分：基础</span>

#### 1. Introduction and Motivation 🟢<br><span class="zh-inline">1. 引言与动机 🟢</span>
- [The Case for Rust for Python Developers](ch01-introduction-and-motivation.md#the-case-for-rust-for-python-developers)<br><span class="zh-inline">Rust 为什么值得 Python 开发者学习</span>
- [Common Python Pain Points That Rust Addresses](ch01-introduction-and-motivation.md#common-python-pain-points-that-rust-addresses)<br><span class="zh-inline">Rust 能解决哪些 Python 常见痛点</span>
- [When to Choose Rust Over Python](ch01-introduction-and-motivation.md#when-to-choose-rust-over-python)<br><span class="zh-inline">什么时候该选 Rust，而不是 Python</span>

#### 2. Getting Started 🟢<br><span class="zh-inline">2. 快速开始 🟢</span>
- [Installation and Setup](ch02-getting-started.md#installation-and-setup)<br><span class="zh-inline">安装与环境配置</span>
- [Your First Rust Program](ch02-getting-started.md#your-first-rust-program)<br><span class="zh-inline">第一个 Rust 程序</span>
- [Cargo vs pip/Poetry](ch02-getting-started.md#cargo-vs-pippoetry)<br><span class="zh-inline">Cargo 与 pip / Poetry 的对比</span>

#### 3. Built-in Types and Variables 🟢<br><span class="zh-inline">3. 内置类型与变量 🟢</span>
- [Variables and Mutability](ch03-built-in-types-and-variables.md#variables-and-mutability)<br><span class="zh-inline">变量与可变性</span>
- [Primitive Types Comparison](ch03-built-in-types-and-variables.md#primitive-types-comparison)<br><span class="zh-inline">基本类型对照</span>
- [String Types: String vs &str](ch03-built-in-types-and-variables.md#string-types-string-vs-str)<br><span class="zh-inline">字符串类型：String 与 &str</span>

#### 4. Control Flow 🟢<br><span class="zh-inline">4. 控制流 🟢</span>
- [Conditional Statements](ch04-control-flow.md#conditional-statements)<br><span class="zh-inline">条件语句</span>
- [Loops and Iteration](ch04-control-flow.md#loops-and-iteration)<br><span class="zh-inline">循环与迭代</span>
- [Expression Blocks](ch04-control-flow.md#expression-blocks)<br><span class="zh-inline">表达式代码块</span>
- [Functions and Type Signatures](ch04-control-flow.md#functions-and-type-signatures)<br><span class="zh-inline">函数与类型签名</span>

#### 5. Data Structures and Collections 🟢<br><span class="zh-inline">5. 数据结构与集合 🟢</span>
- [Tuples, Arrays, Slices](ch05-data-structures-and-collections.md#tuples-and-destructuring)<br><span class="zh-inline">元组、数组与切片</span>
- [Structs vs Classes](ch05-data-structures-and-collections.md#structs-vs-classes)<br><span class="zh-inline">Struct 与 Class 的差异</span>
- [Vec vs list, HashMap vs dict](ch05-data-structures-and-collections.md#vec-vs-list)<br><span class="zh-inline">Vec 对比 list，HashMap 对比 dict</span>

#### 6. Enums and Pattern Matching 🟡<br><span class="zh-inline">6. 枚举与模式匹配 🟡</span>
- [Algebraic Data Types vs Union Types](ch06-enums-and-pattern-matching.md#algebraic-data-types-vs-union-types)<br><span class="zh-inline">代数数据类型与联合类型</span>
- [Exhaustive Pattern Matching](ch06-enums-and-pattern-matching.md#exhaustive-pattern-matching)<br><span class="zh-inline">穷尽模式匹配</span>
- [Option for None Safety](ch06-enums-and-pattern-matching.md#option-for-none-safety)<br><span class="zh-inline">用 Option 处理 None 安全</span>

### Part II — Core Concepts<br><span class="zh-inline">第二部分：核心概念</span>

#### 7. Ownership and Borrowing 🟡<br><span class="zh-inline">7. 所有权与借用 🟡</span>
- [Understanding Ownership](ch07-ownership-and-borrowing.md#understanding-ownership)<br><span class="zh-inline">理解所有权</span>
- [Move Semantics vs Reference Counting](ch07-ownership-and-borrowing.md#move-semantics-vs-reference-counting)<br><span class="zh-inline">移动语义与引用计数</span>
- [Borrowing and Lifetimes](ch07-ownership-and-borrowing.md#borrowing-and-lifetimes)<br><span class="zh-inline">借用与生命周期</span>
- [Smart Pointers](ch07-ownership-and-borrowing.md#smart-pointers)<br><span class="zh-inline">智能指针</span>

#### 8. Crates and Modules 🟢<br><span class="zh-inline">8. crate 与模块 🟢</span>
- [Rust Modules vs Python Packages](ch08-crates-and-modules.md#rust-modules-vs-python-packages)<br><span class="zh-inline">Rust 模块与 Python 包</span>
- [Crates vs PyPI Packages](ch08-crates-and-modules.md#crates-vs-pypi-packages)<br><span class="zh-inline">crate 与 PyPI 包</span>

#### 9. Error Handling 🟡<br><span class="zh-inline">9. 错误处理 🟡</span>
- [Exceptions vs Result](ch09-error-handling.md#exceptions-vs-result)<br><span class="zh-inline">异常与 Result 的差异</span>
- [The ? Operator](ch09-error-handling.md#the--operator)<br><span class="zh-inline">`?` 运算符</span>
- [Custom Error Types with thiserror](ch09-error-handling.md#custom-error-types-with-thiserror)<br><span class="zh-inline">用 thiserror 定义自定义错误类型</span>

#### 10. Traits and Generics 🟡<br><span class="zh-inline">10. Trait 与泛型 🟡</span>
- [Traits vs Duck Typing](ch10-traits-and-generics.md#traits-vs-duck-typing)<br><span class="zh-inline">Trait 与鸭子类型对比</span>
- [Protocols (PEP 544) vs Traits](ch10-traits-and-generics.md#protocols-pep-544-vs-traits)<br><span class="zh-inline">Protocol 与 Trait 对比</span>
- [Generic Constraints](ch10-traits-and-generics.md#generic-constraints)<br><span class="zh-inline">泛型约束</span>

#### 11. From and Into Traits 🟡<br><span class="zh-inline">11. From 与 Into Trait 🟡</span>
- [Type Conversions in Rust](ch11-from-and-into-traits.md#type-conversions-in-rust)<br><span class="zh-inline">Rust 中的类型转换</span>
- [From, Into, TryFrom](ch11-from-and-into-traits.md#rust-frominto)<br><span class="zh-inline">From、Into、TryFrom</span>
- [String Conversion Patterns](ch11-from-and-into-traits.md#string-conversions)<br><span class="zh-inline">字符串转换模式</span>

#### 12. Closures and Iterators 🟡<br><span class="zh-inline">12. 闭包与迭代器 🟡</span>
- [Closures vs Lambdas](ch12-closures-and-iterators.md#rust-closures-vs-python-lambdas)<br><span class="zh-inline">闭包与 lambda</span>
- [Iterators vs Generators](ch12-closures-and-iterators.md#iterators-vs-generators)<br><span class="zh-inline">迭代器与生成器</span>
- [Macros: Code That Writes Code](ch12-closures-and-iterators.md#why-macros-exist-in-rust)<br><span class="zh-inline">宏：生成代码的代码</span>

### Part III — Advanced Topics & Migration<br><span class="zh-inline">第三部分：进阶主题与迁移</span>

#### 13. Concurrency 🔴<br><span class="zh-inline">13. 并发 🔴</span>
- [No GIL: True Parallelism](ch13-concurrency.md#no-gil-true-parallelism)<br><span class="zh-inline">没有 GIL：真正的并行</span>
- [Thread Safety: Type System Guarantees](ch13-concurrency.md#thread-safety-type-system-guarantees)<br><span class="zh-inline">线程安全：类型系统保证</span>
- [async/await Comparison](ch13-concurrency.md#asyncawait-comparison)<br><span class="zh-inline">async/await 对比</span>

#### 14. Unsafe Rust, FFI, and Testing 🔴<br><span class="zh-inline">14. Unsafe Rust、FFI 与测试 🔴</span>
- [When and Why to Use Unsafe](ch14-unsafe-rust-and-ffi.md#when-and-why-to-use-unsafe)<br><span class="zh-inline">何时以及为何使用 Unsafe</span>
- [PyO3: Rust Extensions for Python](ch14-unsafe-rust-and-ffi.md#pyo3-rust-extensions-for-python)<br><span class="zh-inline">PyO3：面向 Python 的 Rust 扩展</span>
- [Unit Tests vs pytest](ch14-unsafe-rust-and-ffi.md#unit-tests-vs-pytest)<br><span class="zh-inline">单元测试与 pytest 对比</span>

#### 15. Migration Patterns 🟡<br><span class="zh-inline">15. 迁移模式 🟡</span>
- [Common Python Patterns in Rust](ch15-migration-patterns.md#common-python-patterns-in-rust)<br><span class="zh-inline">Python 常见模式在 Rust 中的写法</span>
- [Essential Crates for Python Developers](ch08-crates-and-modules.md#essential-crates-for-python-developers)<br><span class="zh-inline">Python 开发者必备 crate</span>
- [Incremental Adoption Strategy](ch15-migration-patterns.md#incremental-adoption-strategy)<br><span class="zh-inline">渐进式引入策略</span>

#### 16. Best Practices 🟡<br><span class="zh-inline">16. 最佳实践 🟡</span>
- [Idiomatic Rust for Python Developers](ch16-best-practices.md#idiomatic-rust-for-python-developers)<br><span class="zh-inline">Python 开发者该掌握的 Rust 惯用法</span>
- [Common Pitfalls and Solutions](ch16-best-practices.md#common-pitfalls-and-solutions)<br><span class="zh-inline">常见陷阱与解决方案</span>
- [Python→Rust Rosetta Stone](ch16-best-practices.md#rosetta-stone-python-to-rust)<br><span class="zh-inline">Python → Rust 对照手册</span>
- [Learning Path and Resources](ch16-best-practices.md#learning-path-and-resources)<br><span class="zh-inline">学习路径与资源</span>

---

### Part IV — Capstone<br><span class="zh-inline">第四部分：综合项目</span>

#### 17. Capstone Project: CLI Task Manager 🔴<br><span class="zh-inline">17. 综合项目：命令行任务管理器 🔴</span>
- [The Project: `rustdo`](ch17-capstone-project.md#the-project-rustdo)<br><span class="zh-inline">项目介绍：`rustdo`</span>
- [Data Model, Storage, Commands, Business Logic](ch17-capstone-project.md#step-1-define-the-data-model-ch-3-6-10-11)<br><span class="zh-inline">数据模型、存储、命令与业务逻辑</span>
- [Tests and Stretch Goals](ch17-capstone-project.md#step-7-tests-ch-14)<br><span class="zh-inline">测试与延伸目标</span>

***
