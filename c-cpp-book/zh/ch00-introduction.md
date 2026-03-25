# Rust Bootstrap Course for C/C++ Programmers<br><span class="zh-inline">Rust 面向 C/C++ 程序员入门训练营</span>

## Course Overview<br><span class="zh-inline">课程总览</span>

- Course overview<br><span class="zh-inline">课程内容概览</span>
    - The case for Rust (from both C and C++ perspectives)<br><span class="zh-inline">为什么要学 Rust，会分别从 C 和 C++ 两个视角展开</span>
    - Local installation<br><span class="zh-inline">本地安装与环境准备</span>
    - Types, functions, control flow, pattern matching<br><span class="zh-inline">类型、函数、控制流与模式匹配</span>
    - Modules, cargo<br><span class="zh-inline">模块系统与 cargo</span>
    - Traits, generics<br><span class="zh-inline">Trait 与泛型</span>
    - Collections, error handling<br><span class="zh-inline">集合类型与错误处理</span>
    - Closures, memory management, lifetimes, smart pointers<br><span class="zh-inline">闭包、内存管理、生命周期与智能指针</span>
    - Concurrency<br><span class="zh-inline">并发编程</span>
    - Unsafe Rust, including Foreign Function Interface (FFI)<br><span class="zh-inline">Unsafe Rust，包括外部函数接口 FFI</span>
    - `no_std` and embedded Rust essentials for firmware teams<br><span class="zh-inline">面向固件团队的 `no_std` 与嵌入式 Rust 基础</span>
    - Case studies: real-world C++ to Rust translation patterns<br><span class="zh-inline">案例分析：真实世界中的 C++ 到 Rust 迁移模式</span>
- We'll not cover `async` Rust in this course — see the companion [Async Rust Training](../async-book/) for a full treatment of futures, executors, `Pin`, tokio, and production async patterns<br><span class="zh-inline">本课程里不会展开 `async` Rust；如果要系统学习 futures、执行器、`Pin`、tokio 和生产环境里的异步模式，请查看配套的 [Async Rust Training](../async-book/)。</span>

---

# Self-Study Guide<br><span class="zh-inline">自学指南</span>

This material works both as an instructor-led course and for self-study. If you're working through it on your own, here's how to get the most out of it:<br><span class="zh-inline">这套材料既适合讲师授课，也适合个人自学。若是单独推进，按下面这套方式读，吸收效率会高很多。</span>

**Pacing recommendations:**<br><span class="zh-inline">**学习节奏建议：**</span>

| Chapters | Topic | Suggested Time | Checkpoint |
|----------|-------|---------------|------------|
| 1–4<br><span class="zh-inline">第 1–4 章</span> | Setup, types, control flow<br><span class="zh-inline">环境准备、类型与控制流</span> | 1 day<br><span class="zh-inline">1 天</span> | You can write a CLI temperature converter<br><span class="zh-inline">能够写出一个命令行温度转换器。</span> |
| 5–7<br><span class="zh-inline">第 5–7 章</span> | Data structures, ownership<br><span class="zh-inline">数据结构与所有权</span> | 1–2 days<br><span class="zh-inline">1–2 天</span> | You can explain *why* `let s2 = s1` invalidates `s1`<br><span class="zh-inline">能够说明 *为什么* `let s2 = s1` 会让 `s1` 失效。</span> |
| 8–9<br><span class="zh-inline">第 8–9 章</span> | Modules, error handling<br><span class="zh-inline">模块与错误处理</span> | 1 day<br><span class="zh-inline">1 天</span> | You can create a multi-file project that propagates errors with `?`<br><span class="zh-inline">能够写出一个多文件项目，并用 `?` 传播错误。</span> |
| 10–12<br><span class="zh-inline">第 10–12 章</span> | Traits, generics, closures<br><span class="zh-inline">Trait、泛型与闭包</span> | 1–2 days<br><span class="zh-inline">1–2 天</span> | You can write a generic function with trait bounds<br><span class="zh-inline">能够写出带 trait 约束的泛型函数。</span> |
| 13–14<br><span class="zh-inline">第 13–14 章</span> | Concurrency, unsafe/FFI<br><span class="zh-inline">并发与 unsafe/FFI</span> | 1 day<br><span class="zh-inline">1 天</span> | You can write a thread-safe counter with `Arc<Mutex<T>>`<br><span class="zh-inline">能够用 `Arc<Mutex<T>>` 写出线程安全计数器。</span> |
| 15–16<br><span class="zh-inline">第 15–16 章</span> | Deep dives<br><span class="zh-inline">专题深入</span> | At your own pace<br><span class="zh-inline">按个人节奏推进</span> | Reference material — read when relevant<br><span class="zh-inline">这部分更偏参考材料，遇到相关问题时回来看。</span> |
| 17–19<br><span class="zh-inline">第 17–19 章</span> | Best practices & reference<br><span class="zh-inline">最佳实践与参考资料</span> | At your own pace<br><span class="zh-inline">按个人节奏推进</span> | Consult as you write real code<br><span class="zh-inline">在编写真实项目代码时当手册反复查阅。</span> |

**How to use the exercises:**<br><span class="zh-inline">**练习怎么做：**</span>

- Every chapter has hands-on exercises marked with difficulty: 🟢 Starter, 🟡 Intermediate, 🔴 Challenge<br><span class="zh-inline">每章都带有动手练习，并按难度标成：🟢 入门、🟡 进阶、🔴 挑战。</span>
- **Always try the exercise before expanding the solution.** Struggling with the borrow checker is part of learning — the compiler's error messages are your teacher<br><span class="zh-inline">**一定先自己做，再展开答案。** 和借用检查器死磕本来就是学习过程，编译器报错就是老师。</span>
- If you're stuck for more than 15 minutes, expand the solution, study it, then close it and try again from scratch<br><span class="zh-inline">如果卡住超过 15 分钟，就先看答案研究思路，再合上答案从头重做一遍。</span>
- The [Rust Playground](https://play.rust-lang.org/) lets you run code without a local install<br><span class="zh-inline">[Rust Playground](https://play.rust-lang.org/) 可以在没有本地安装环境时直接运行代码。</span>

**When you hit a wall:**<br><span class="zh-inline">**如果学到一半撞墙了：**</span>

- Read the compiler error message carefully — Rust's errors are exceptionally helpful<br><span class="zh-inline">认真读编译器报错。Rust 的错误信息通常写得非常细，很多时候已经把方向点明了。</span>
- Re-read the relevant section; concepts like ownership (ch7) often click on the second pass<br><span class="zh-inline">把对应章节再读一遍；像所有权这种内容，很多人第二遍才真正开窍。</span>
- The [Rust standard library docs](https://doc.rust-lang.org/std/) are excellent — search for any type or method<br><span class="zh-inline">[Rust 标准库文档](https://doc.rust-lang.org/std/) 质量很高，类型和方法基本都能直接搜到。</span>
- For async patterns, see the companion [Async Rust Training](../async-book/)<br><span class="zh-inline">如果问题落到 async 模式上，继续看配套的 [Async Rust Training](../async-book/)。</span>

---

# Table of Contents<br><span class="zh-inline">目录总览</span>

## Part I — Foundations<br><span class="zh-inline">第一部分：基础知识</span>

### 1. Introduction and Motivation<br><span class="zh-inline">1. 引言与动机</span>
- [Speaker intro and general approach](ch01-introduction-and-motivation.md#speaker-intro-and-general-approach)<br><span class="zh-inline">讲者介绍与整体思路</span>
- [The case for Rust](ch01-introduction-and-motivation.md#the-case-for-rust)<br><span class="zh-inline">为什么选择 Rust</span>
- [How does Rust address these issues?](ch01-introduction-and-motivation.md#how-does-rust-address-these-issues)<br><span class="zh-inline">Rust 如何解决这些问题</span>
- [Other Rust USPs and features](ch01-introduction-and-motivation.md#other-rust-usps-and-features)<br><span class="zh-inline">Rust 其他独特卖点与特性</span>
- [Quick Reference: Rust vs C/C++](ch01-introduction-and-motivation.md#quick-reference-rust-vs-cc)<br><span class="zh-inline">速查：Rust 与 C/C++ 对比</span>
- [Why C Developers Need Rust](ch01-1-why-c-cpp-developers-need-rust.md#the-problems-shared-by-c-and-c)<br><span class="zh-inline">为什么 C 开发者需要 Rust</span>
  - [Common C vulnerabilities](ch01-1-why-c-cpp-developers-need-rust.md#the-problems-shared-by-c-and-c)<br><span class="zh-inline">C 语言中的常见漏洞</span>
  - [Illustration of C vulnerabilities](ch01-1-why-c-cpp-developers-need-rust.md#the-visualization-shared-problems)<br><span class="zh-inline">C 语言漏洞示例</span>
- [Why C++ Developers Need Rust](ch01-1-why-c-cpp-developers-need-rust.md#c-adds-more-problems-on-top)<br><span class="zh-inline">为什么 C++ 开发者需要 Rust</span>
  - [C++ challenges that Rust addresses](ch01-1-why-c-cpp-developers-need-rust.md#c-adds-more-problems-on-top)<br><span class="zh-inline">Rust 针对的 C++ 难题</span>
  - [C++ memory safety issues (even with modern C++)](ch01-1-why-c-cpp-developers-need-rust.md#dangling-references-and-lambda-captures)<br><span class="zh-inline">即便是现代 C++ 也仍然存在的内存安全问题</span>

### 2. Getting Started<br><span class="zh-inline">2. 快速开始</span>
- [Enough talk already: Show me some code](ch02-getting-started.md#enough-talk-already-show-me-some-code)<br><span class="zh-inline">少说废话，先上代码</span>
- [Rust Local installation](ch02-getting-started.md#rust-local-installation)<br><span class="zh-inline">Rust 本地安装</span>
- [Rust packages (crates)](ch02-getting-started.md#rust-packages-crates)<br><span class="zh-inline">Rust 包与 crate</span>
- [Example: cargo and crates](ch02-getting-started.md#example-cargo-and-crates)<br><span class="zh-inline">示例：cargo 与 crate</span>

### 3. Basic Types and Variables<br><span class="zh-inline">3. 基础类型与变量</span>
- [Built-in Rust types](ch03-built-in-types.md#built-in-rust-types)<br><span class="zh-inline">Rust 内建类型</span>
- [Rust type specification and assignment](ch03-built-in-types.md#rust-type-specification-and-assignment)<br><span class="zh-inline">Rust 类型标注与赋值</span>
- [Rust type specification and inference](ch03-built-in-types.md#rust-type-specification-and-inference)<br><span class="zh-inline">Rust 类型标注与类型推断</span>
- [Rust variables and mutability](ch03-built-in-types.md#rust-variables-and-mutability)<br><span class="zh-inline">Rust 变量与可变性</span>

### 4. Control Flow<br><span class="zh-inline">4. 控制流</span>
- [Rust if keyword](ch04-control-flow.md#rust-if-keyword)<br><span class="zh-inline">Rust 中的 if</span>
- [Rust loops using while and for](ch04-control-flow.md#rust-loops-using-while-and-for)<br><span class="zh-inline">使用 while 与 for 的循环</span>
- [Rust loops using loop](ch04-control-flow.md#rust-loops-using-loop)<br><span class="zh-inline">使用 loop 的循环</span>
- [Rust expression blocks](ch04-control-flow.md#rust-expression-blocks)<br><span class="zh-inline">Rust 表达式代码块</span>

### 5. Data Structures and Collections<br><span class="zh-inline">5. 数据结构与集合</span>
- [Rust array type](ch05-data-structures.md#rust-array-type)<br><span class="zh-inline">Rust 数组</span>
- [Rust tuples](ch05-data-structures.md#rust-tuples)<br><span class="zh-inline">Rust 元组</span>
- [Rust references](ch05-data-structures.md#rust-references)<br><span class="zh-inline">Rust 引用</span>
- [C++ References vs Rust References — Key Differences](ch05-data-structures.md#c-references-vs-rust-references--key-differences)<br><span class="zh-inline">C++ 引用与 Rust 引用的关键区别</span>
- [Rust slices](ch05-data-structures.md#rust-slices)<br><span class="zh-inline">Rust slice</span>
- [Rust constants and statics](ch05-data-structures.md#rust-constants-and-statics)<br><span class="zh-inline">Rust 常量与静态变量</span>
- [Rust strings: String vs &str](ch05-data-structures.md#rust-strings-string-vs-str)<br><span class="zh-inline">Rust 字符串：`String` 与 `&str`</span>
- [Rust structs](ch05-data-structures.md#rust-structs)<br><span class="zh-inline">Rust 结构体</span>
- [Rust Vec\<T\>](ch05-data-structures.md#rust-vec-type)<br><span class="zh-inline">Rust `Vec<T>`</span>
- [Rust HashMap](ch05-data-structures.md#rust-hashmap-type)<br><span class="zh-inline">Rust `HashMap`</span>
- [Exercise: Vec and HashMap](ch05-data-structures.md#exercise-vec-and-hashmap)<br><span class="zh-inline">练习：`Vec` 与 `HashMap`</span>

### 6. Pattern Matching and Enums<br><span class="zh-inline">6. 模式匹配与枚举</span>
- [Rust enum types](ch06-enums-and-pattern-matching.md#rust-enum-types)<br><span class="zh-inline">Rust 枚举类型</span>
- [Rust match statement](ch06-enums-and-pattern-matching.md#rust-match-statement)<br><span class="zh-inline">Rust `match` 语句</span>
- [Exercise: Implement add and subtract using match and enum](ch06-enums-and-pattern-matching.md#exercise-implement-add-and-subtract-using-match-and-enum)<br><span class="zh-inline">练习：用 `match` 与枚举实现加减法</span>

### 7. Ownership and Memory Management<br><span class="zh-inline">7. 所有权与内存管理</span>
- [Rust memory management](ch07-ownership-and-borrowing.md#rust-memory-management)<br><span class="zh-inline">Rust 内存管理</span>
- [Rust ownership, borrowing and lifetimes](ch07-ownership-and-borrowing.md#rust-ownership-borrowing-and-lifetimes)<br><span class="zh-inline">Rust 所有权、借用与生命周期</span>
- [Rust move semantics](ch07-ownership-and-borrowing.md#rust-move-semantics)<br><span class="zh-inline">Rust 移动语义</span>
- [Rust Clone](ch07-ownership-and-borrowing.md#rust-clone)<br><span class="zh-inline">Rust `Clone`</span>
- [Rust Copy trait](ch07-ownership-and-borrowing.md#rust-copy-trait)<br><span class="zh-inline">Rust `Copy` trait</span>
- [Rust Drop trait](ch07-ownership-and-borrowing.md#rust-drop-trait)<br><span class="zh-inline">Rust `Drop` trait</span>
- [Exercise: Move, Copy and Drop](ch07-ownership-and-borrowing.md#exercise-move-copy-and-drop)<br><span class="zh-inline">练习：Move、Copy 与 Drop</span>
- [Rust lifetime and borrowing](ch07-1-lifetimes-and-borrowing-deep-dive.md#rust-lifetime-and-borrowing)<br><span class="zh-inline">Rust 生命周期与借用</span>
- [Rust lifetime annotations](ch07-1-lifetimes-and-borrowing-deep-dive.md#rust-lifetime-annotations)<br><span class="zh-inline">Rust 生命周期标注</span>
- [Exercise: Slice storage with lifetimes](ch07-1-lifetimes-and-borrowing-deep-dive.md#exercise-slice-storage-with-lifetimes)<br><span class="zh-inline">练习：带生命周期的 slice 存储</span>
- [Lifetime Elision Rules Deep Dive](ch07-1-lifetimes-and-borrowing-deep-dive.md#lifetime-elision-rules-deep-dive)<br><span class="zh-inline">生命周期省略规则深入解析</span>
- [Rust Box\<T\>](ch07-2-smart-pointers-and-interior-mutability.md#rust-boxt)<br><span class="zh-inline">Rust `Box<T>`</span>
- [Interior Mutability: Cell\<T\> and RefCell\<T\>](ch07-2-smart-pointers-and-interior-mutability.md#interior-mutability-cellt-and-refcellt)<br><span class="zh-inline">内部可变性：`Cell<T>` 与 `RefCell<T>`</span>
- [Shared Ownership: Rc\<T\>](ch07-2-smart-pointers-and-interior-mutability.md#shared-ownership-rct)<br><span class="zh-inline">共享所有权：`Rc<T>`</span>
- [Exercise: Shared ownership and interior mutability](ch07-2-smart-pointers-and-interior-mutability.md#exercise-shared-ownership-and-interior-mutability)<br><span class="zh-inline">练习：共享所有权与内部可变性</span>

### 8. Modules and Crates<br><span class="zh-inline">8. 模块与 crate</span>
- [Rust crates and modules](ch08-crates-and-modules.md#rust-crates-and-modules)<br><span class="zh-inline">Rust crate 与模块</span>
- [Exercise: Modules and functions](ch08-crates-and-modules.md#exercise-modules-and-functions)<br><span class="zh-inline">练习：模块与函数</span>
- [Workspaces and crates (packages)](ch08-crates-and-modules.md#workspaces-and-crates-packages)<br><span class="zh-inline">Workspace 与 crate（package）</span>
- [Exercise: Using workspaces and package dependencies](ch08-crates-and-modules.md#exercise-using-workspaces-and-package-dependencies)<br><span class="zh-inline">练习：使用 workspace 与包依赖</span>
- [Using community crates from crates.io](ch08-crates-and-modules.md#using-community-crates-from-cratesio)<br><span class="zh-inline">使用 crates.io 社区 crate</span>
- [Crates dependencies and SemVer](ch08-crates-and-modules.md#crates-dependencies-and-semver)<br><span class="zh-inline">crate 依赖与语义化版本</span>
- [Exercise: Using the rand crate](ch08-crates-and-modules.md#exercise-using-the-rand-crate)<br><span class="zh-inline">练习：使用 `rand` crate</span>
- [Cargo.toml and Cargo.lock](ch08-crates-and-modules.md#cargotoml-and-cargolock)<br><span class="zh-inline">`Cargo.toml` 与 `Cargo.lock`</span>
- [Cargo test feature](ch08-crates-and-modules.md#cargo-test-feature)<br><span class="zh-inline">`cargo test` 功能</span>
- [Other Cargo features](ch08-crates-and-modules.md#other-cargo-features)<br><span class="zh-inline">其他 Cargo 功能</span>
- [Testing Patterns](ch08-1-testing-patterns.md)<br><span class="zh-inline">测试模式</span>

### 9. Error Handling<br><span class="zh-inline">9. 错误处理</span>
- [Connecting enums to Option and Result](ch09-error-handling.md#connecting-enums-to-option-and-result)<br><span class="zh-inline">把枚举与 `Option`、`Result` 联系起来</span>
- [Rust Option type](ch09-error-handling.md#rust-option-type)<br><span class="zh-inline">Rust `Option` 类型</span>
- [Rust Result type](ch09-error-handling.md#rust-result-type)<br><span class="zh-inline">Rust `Result` 类型</span>
- [Exercise: log() function implementation with Option](ch09-error-handling.md#exercise-log-function-implementation-with-option)<br><span class="zh-inline">练习：用 `Option` 实现 `log()` 函数</span>
- [Rust error handling](ch09-error-handling.md#rust-error-handling)<br><span class="zh-inline">Rust 错误处理</span>
- [Exercise: error handling](ch09-error-handling.md#exercise-error-handling)<br><span class="zh-inline">练习：错误处理</span>
- [Error Handling Best Practices](ch09-1-error-handling-best-practices.md)<br><span class="zh-inline">错误处理最佳实践</span>

### 10. Traits and Generics<br><span class="zh-inline">10. Trait 与泛型</span>
- [Rust traits](ch10-traits.md#rust-traits)<br><span class="zh-inline">Rust trait</span>
- [C++ Operator Overloading → Rust std::ops Traits](ch10-traits.md#c-operator-overloading--rust-stdops-traits)<br><span class="zh-inline">C++ 运算符重载与 Rust `std::ops` trait</span>
- [Exercise: Logger trait implementation](ch10-traits.md#exercise-logger-trait-implementation)<br><span class="zh-inline">练习：实现 `Logger` trait</span>
- [When to use enum vs dyn Trait](ch10-traits.md#when-to-use-enum-vs-dyn-trait)<br><span class="zh-inline">何时使用枚举，何时使用 `dyn Trait`</span>
- [Exercise: Think Before You Translate](ch10-traits.md#exercise-think-before-you-translate)<br><span class="zh-inline">练习：先思考，再翻译设计</span>
- [Rust generics](ch10-1-generics.md#rust-generics)<br><span class="zh-inline">Rust 泛型</span>
- [Exercise: Generics](ch10-1-generics.md#exercise-generics)<br><span class="zh-inline">练习：泛型</span>
- [Combining Rust traits and generics](ch10-1-generics.md#combining-rust-traits-and-generics)<br><span class="zh-inline">组合使用 Rust trait 与泛型</span>
- [Rust traits constraints in data types](ch10-1-generics.md#rust-traits-constraints-in-data-types)<br><span class="zh-inline">数据类型中的 Rust trait 约束</span>
- [Exercise: Trait constraints and generics](ch10-1-generics.md#exercise-traits-constraints-and-generics)<br><span class="zh-inline">练习：trait 约束与泛型</span>
- [Rust type state pattern and generics](ch10-1-generics.md#rust-type-state-pattern-and-generics)<br><span class="zh-inline">Rust 类型状态模式与泛型</span>
- [Rust builder pattern](ch10-1-generics.md#rust-builder-pattern)<br><span class="zh-inline">Rust Builder 模式</span>

### 11. Type System Advanced Features<br><span class="zh-inline">11. 类型系统高级特性</span>
- [Rust From and Into traits](ch11-from-and-into-traits.md#rust-from-and-into-traits)<br><span class="zh-inline">Rust `From` 与 `Into` trait</span>
- [Exercise: From and Into](ch11-from-and-into-traits.md#exercise-from-and-into)<br><span class="zh-inline">练习：`From` 与 `Into`</span>
- [Rust Default trait](ch11-from-and-into-traits.md#rust-default-trait)<br><span class="zh-inline">Rust `Default` trait</span>
- [Other Rust type conversions](ch11-from-and-into-traits.md#other-rust-type-conversions)<br><span class="zh-inline">Rust 的其他类型转换方式</span>

### 12. Functional Programming<br><span class="zh-inline">12. 函数式编程</span>
- [Rust closures](ch12-closures.md#rust-closures)<br><span class="zh-inline">Rust 闭包</span>
- [Exercise: Closures and capturing](ch12-closures.md#exercise-closures-and-capturing)<br><span class="zh-inline">练习：闭包与捕获</span>
- [Rust iterators](ch12-closures.md#rust-iterators)<br><span class="zh-inline">Rust 迭代器</span>
- [Exercise: Rust iterators](ch12-closures.md#exercise-rust-iterators)<br><span class="zh-inline">练习：Rust 迭代器</span>
- [Iterator Power Tools Reference](ch12-1-iterator-power-tools.md#iterator-power-tools-reference)<br><span class="zh-inline">迭代器高阶工具速查</span>

### 13. Concurrency<br><span class="zh-inline">13. 并发</span>
- [Rust concurrency](ch13-concurrency.md#rust-concurrency)<br><span class="zh-inline">Rust 并发</span>
- [Why Rust prevents data races: Send and Sync](ch13-concurrency.md#why-rust-prevents-data-races-send-and-sync)<br><span class="zh-inline">为什么 Rust 能阻止数据竞争：`Send` 与 `Sync`</span>
- [Exercise: Multi-threaded word count](ch13-concurrency.md#exercise-multi-threaded-word-count)<br><span class="zh-inline">练习：多线程词频统计</span>

### 14. Unsafe Rust and FFI<br><span class="zh-inline">14. Unsafe Rust 与 FFI</span>
- [Unsafe Rust](ch14-unsafe-rust-and-ffi.md#unsafe-rust)<br><span class="zh-inline">Unsafe Rust</span>
- [Simple FFI example](ch14-unsafe-rust-and-ffi.md#simple-ffi-example-rust-library-function-consumed-by-c)<br><span class="zh-inline">简单 FFI 示例</span>
- [Complex FFI example](ch14-unsafe-rust-and-ffi.md#complex-ffi-example)<br><span class="zh-inline">复杂 FFI 示例</span>
- [Ensuring correctness of unsafe code](ch14-unsafe-rust-and-ffi.md#ensuring-correctness-of-unsafe-code)<br><span class="zh-inline">如何保证 unsafe 代码的正确性</span>
- [Exercise: Writing a safe FFI wrapper](ch14-unsafe-rust-and-ffi.md#exercise-writing-a-safe-ffi-wrapper)<br><span class="zh-inline">练习：编写安全的 FFI 包装层</span>

## Part II — Deep Dives<br><span class="zh-inline">第二部分：专题深入</span>

### 15. no_std — Rust for Bare Metal<br><span class="zh-inline">15. `no_std`：面向裸机的 Rust</span>
- [What is no_std?](ch15-no_std-rust-without-the-standard-library.md#what-is-no_std)<br><span class="zh-inline">什么是 `no_std`</span>
- [When to use no_std vs std](ch15-no_std-rust-without-the-standard-library.md#when-to-use-no_std-vs-std)<br><span class="zh-inline">什么时候用 `no_std`，什么时候用 `std`</span>
- [Exercise: no_std ring buffer](ch15-no_std-rust-without-the-standard-library.md#exercise-no_std-ring-buffer)<br><span class="zh-inline">练习：`no_std` 环形缓冲区</span>
- [Embedded Deep Dive](ch15-1-embedded-deep-dive.md)<br><span class="zh-inline">嵌入式专题深入</span>

### 16. Case Studies: Real-World C++ to Rust Translation<br><span class="zh-inline">16. 案例研究：真实世界里的 C++ 到 Rust 迁移</span>
- [Case Study 1: Inheritance hierarchy → Enum dispatch](ch16-case-studies.md#case-study-1-inheritance-hierarchy--enum-dispatch)<br><span class="zh-inline">案例 1：继承层级到枚举分发</span>
- [Case Study 2: shared_ptr tree → Arena/index pattern](ch16-case-studies.md#case-study-2-shared_ptr-tree--arenaindex-pattern)<br><span class="zh-inline">案例 2：`shared_ptr` 树到 arena/index 模式</span>
- [Case Study 3: Framework communication → Lifetime borrowing](ch16-1-case-study-lifetime-borrowing.md#case-study-3-framework-communication--lifetime-borrowing)<br><span class="zh-inline">案例 3：框架通信到生命周期借用</span>
- [Case Study 4: God object → Composable state](ch16-1-case-study-lifetime-borrowing.md#case-study-4-god-object--composable-state)<br><span class="zh-inline">案例 4：上帝对象到可组合状态</span>
- [Case Study 5: Trait objects — when they ARE right](ch16-1-case-study-lifetime-borrowing.md#case-study-5-trait-objects--when-they-are-right)<br><span class="zh-inline">案例 5：什么时候 trait object 反而是正确选择</span>

## Part III — Best Practices & Reference<br><span class="zh-inline">第三部分：最佳实践与参考资料</span>

### 17. Best Practices<br><span class="zh-inline">17. 最佳实践</span>
- [Rust Best Practices Summary](ch17-best-practices.md#rust-best-practices-summary)<br><span class="zh-inline">Rust 最佳实践总结</span>
- [Avoiding excessive clone()](ch17-1-avoiding-excessive-clone.md#avoiding-excessive-clone)<br><span class="zh-inline">避免过度使用 `clone()`</span>
- [Avoiding unchecked indexing](ch17-2-avoiding-unchecked-indexing.md#avoiding-unchecked-indexing)<br><span class="zh-inline">避免未检查的索引访问</span>
- [Collapsing assignment pyramids](ch17-3-collapsing-assignment-pyramids.md#collapsing-assignment-pyramids)<br><span class="zh-inline">压平层层嵌套的赋值金字塔</span>
- [Capstone Exercise: Diagnostic Event Pipeline](ch17-3-collapsing-assignment-pyramids.md#capstone-exercise-diagnostic-event-pipeline)<br><span class="zh-inline">综合练习：诊断事件流水线</span>
- [Logging and Tracing Ecosystem](ch17-4-logging-and-tracing-ecosystem.md#logging-and-tracing-ecosystem)<br><span class="zh-inline">日志与追踪生态</span>

### 18. C++ → Rust Semantic Deep Dives<br><span class="zh-inline">18. C++ → Rust 语义深入对照</span>
- [Casting, Preprocessor, Modules, volatile, static, constexpr, SFINAE, and more](ch18-cpp-rust-semantic-deep-dives.md)<br><span class="zh-inline">类型转换、预处理器、模块、`volatile`、`static`、`constexpr`、SFINAE 等主题</span>

### 19. Rust Macros<br><span class="zh-inline">19. Rust 宏</span>
- [Declarative macros (`macro_rules!`)](ch19-macros.md#declarative-macros-with-macro_rules)<br><span class="zh-inline">声明式宏 `macro_rules!`</span>
- [Common standard library macros](ch19-macros.md#common-standard-library-macros)<br><span class="zh-inline">标准库中的常见宏</span>
- [Derive macros](ch19-macros.md#derive-macros)<br><span class="zh-inline">派生宏</span>
- [Attribute macros](ch19-macros.md#attribute-macros)<br><span class="zh-inline">属性宏</span>
- [Procedural macros](ch19-macros.md#procedural-macros-conceptual-overview)<br><span class="zh-inline">过程宏</span>
- [When to use what: macros vs functions vs generics](ch19-macros.md#when-to-use-what-macros-vs-functions-vs-generics)<br><span class="zh-inline">宏、函数与泛型分别适合什么场景</span>
- [Exercises](ch19-macros.md#exercises)<br><span class="zh-inline">练习</span>
