## Learning Path and Next Steps<br><span class="zh-inline">学习路径与下一步</span>

> **What you'll learn:** A structured Rust learning plan tailored for experienced Java developers, the concept pairs that matter most during migration, and a resource stack that supports moving from language study to real service work.<br><span class="zh-inline">**本章将学习：** 一套面向已有 Java 经验开发者的 Rust 学习路线，迁移过程中最重要的概念映射，以及从语言学习走向真实服务开发时该依赖的资源组合。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 入门</span>

The fastest way for a Java developer to learn Rust is to map familiar Java concepts to Rust concepts in the right order.<br><span class="zh-inline">Java 开发者学习 Rust 最快的方式，不是从零散知识点乱看，而是把熟悉的 Java 概念按正确顺序映射到 Rust 概念上。</span>

## The Six Concept Pairs That Matter Most<br><span class="zh-inline">最关键的六组概念映射</span>

| Java habit<br><span class="zh-inline">Java 习惯</span> | Rust replacement<br><span class="zh-inline">Rust 对应物</span> |
|---|---|
| `null` and `Optional<T>`<br><span class="zh-inline">`null` 与 `Optional<T>`</span> | `Option<T>` |
| exceptions<br><span class="zh-inline">异常</span> | `Result<T, E>` |
| mutable object references<br><span class="zh-inline">可变对象引用</span> | ownership and borrowing<br><span class="zh-inline">所有权与借用</span> |
| interfaces<br><span class="zh-inline">接口</span> | traits |
| class hierarchies<br><span class="zh-inline">类继承层级</span> | `struct` + `enum` + composition<br><span class="zh-inline">`struct`、`enum`、组合</span> |
| Spring container wiring<br><span class="zh-inline">Spring 容器装配</span> | explicit state and constructors<br><span class="zh-inline">显式状态与构造</span> |

If these six pairs feel natural, most later Rust topics become easier.<br><span class="zh-inline">如果这六组映射真的顺手了，后面大多数 Rust 主题都会轻松很多。</span>

## An 8-Week Plan<br><span class="zh-inline">一个 8 周学习计划</span>

### Weeks 1-2<br><span class="zh-inline">第 1 到 2 周</span>

- `String` vs `&str`<br><span class="zh-inline">搞清楚 `String` 和 `&str`。</span>
- move vs borrow<br><span class="zh-inline">搞清楚移动和借用。</span>
- `Option<T>` and `Result<T, E>`<br><span class="zh-inline">掌握 `Option<T>` 与 `Result<T, E>`。</span>

### Weeks 3-4<br><span class="zh-inline">第 3 到 4 周</span>

- `enum` and `match`<br><span class="zh-inline">重点学 `enum` 和 `match`。</span>
- traits as interface-like behavior<br><span class="zh-inline">把 trait 理解成接口式行为抽象。</span>
- `Vec`, `HashMap`, iterators<br><span class="zh-inline">掌握 `Vec`、`HashMap`、迭代器。</span>

### Weeks 5-6<br><span class="zh-inline">第 5 到 6 周</span>

- crate-level error enums<br><span class="zh-inline">crate 级错误枚举。</span>
- `thiserror` and `anyhow`<br><span class="zh-inline">`thiserror` 与 `anyhow` 的分工。</span>
- `tokio` and async basics<br><span class="zh-inline">`tokio` 和异步基础。</span>

### Weeks 7-8<br><span class="zh-inline">第 7 到 8 周</span>

- `axum` or `actix-web`<br><span class="zh-inline">`axum` 或 `actix-web`。</span>
- configuration, tracing, metrics<br><span class="zh-inline">配置、追踪、指标。</span>
- handler/service/repository boundaries<br><span class="zh-inline">handler、service、repository 的边界划分。</span>

## Suggested Project Ladder<br><span class="zh-inline">建议的项目阶梯</span>

1. log or CSV transformation tool<br><span class="zh-inline">日志或 CSV 转换工具。</span>
2. JSON validation job<br><span class="zh-inline">JSON 校验任务。</span>
3. external API client<br><span class="zh-inline">外部 API 客户端。</span>
4. small HTTP service<br><span class="zh-inline">一个小型 HTTP 服务。</span>
5. Spring Boot endpoint migration<br><span class="zh-inline">迁移一个 Spring Boot 接口。</span>

This ordering matters because jumping into async web services too early usually mixes framework confusion with ownership confusion.<br><span class="zh-inline">这个顺序非常重要，因为过早跳进异步 Web 服务，往往会把框架困惑和所有权困惑混成一锅粥。</span>

## Resource Stack<br><span class="zh-inline">资源组合</span>

- **The Rust Programming Language**<br><span class="zh-inline">官方 Rust 书，最核心。</span>
- **Rust by Example**<br><span class="zh-inline">适合快速看小例子。</span>
- **Rustlings**<br><span class="zh-inline">适合形成基本手感。</span>
- `serde` docs<br><span class="zh-inline">做 JSON 和数据模型时非常重要。</span>
- `tokio` tutorial<br><span class="zh-inline">理解异步运行时的最好起点之一。</span>
- `axum` guide<br><span class="zh-inline">做 Web 服务时非常贴近实战。</span>

## Common Traps<br><span class="zh-inline">常见陷阱</span>

### Trap 1: Treating the Borrow Checker as the Enemy<br><span class="zh-inline">误区一：把借用检查器当成敌人</span>

The borrow checker is exposing aliasing and mutation truth, not randomly blocking progress.<br><span class="zh-inline">借用检查器是在揭示别名与可变性的真实约束，不是在随机刁难人。</span>

### Trap 2: Recreating Inheritance Everywhere<br><span class="zh-inline">误区二：到处重建继承体系</span>

If a closed set of cases is modeled with traits only, an `enum` is often missing.<br><span class="zh-inline">如果一个封闭变体集合全靠 trait 去建模，那往往说明 `enum` 该出现却没出现。</span>

### Trap 3: Learning Async Before Ownership<br><span class="zh-inline">误区三：还没懂所有权就急着学异步</span>

Async Rust is much easier after ownership, moves, and `Result` already feel normal.<br><span class="zh-inline">只有当所有权、移动、`Result` 这些基础已经顺手了，Async Rust 才会真正容易起来。</span>

## Ready-for-Real-Work Milestone<br><span class="zh-inline">进入真实迁移工作的里程碑</span>

- can model domain states with `enum`<br><span class="zh-inline">能用 `enum` 建模领域状态。</span>
- can explain ownership and borrowing clearly<br><span class="zh-inline">能把所有权和借用讲明白。</span>
- can define crate-level error types<br><span class="zh-inline">能设计 crate 级错误类型。</span>
- can build a small HTTP service with shared state<br><span class="zh-inline">能写带共享状态的小型 HTTP 服务。</span>
- can compare a Spring Boot endpoint with its Rust equivalent<br><span class="zh-inline">能把一个 Spring Boot 接口和它的 Rust 对应物讲清差异。</span>

