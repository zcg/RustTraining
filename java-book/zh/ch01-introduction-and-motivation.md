## The Case for Rust for Java Developers<br><span class="zh-inline">为什么 Rust 值得 Java 开发者认真学一遍</span>

> **What you'll learn:** Where Rust fits for Java teams, which JVM pain points it addresses well, and what conceptual shifts matter most in the first week.<br><span class="zh-inline">**本章将学习：** Rust 适合落在 Java 团队的什么位置、它对 JVM 世界的哪些痛点特别有效，以及入门第一周最关键的思维切换。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 初级</span>

Java remains an excellent language for business systems, backend APIs, large teams, and mature tooling. Rust is attractive in a different slice of the problem space: when predictable latency, low memory overhead, native deployment, and stronger compile-time guarantees start to matter more than runtime convenience.<br><span class="zh-inline">Java 依然非常适合业务系统、后端 API、大团队协作以及成熟工具链环境。Rust 吸引人的地方在另一个问题区间：当稳定延迟、较低内存开销、原生部署，以及更强的编译期保证，比运行时便利性更重要时，Rust 的优势就会越来越明显。</span>

### Why Java Teams Look at Rust<br><span class="zh-inline">Java 团队为什么会看 Rust</span>

Three common triggers show up again and again:<br><span class="zh-inline">最常见的触发点通常有三类：</span>

1. A service is stable functionally, but memory pressure and GC behavior dominate performance tuning.<br><span class="zh-inline">业务逻辑已经稳定，但性能优化总被内存占用和 GC 行为卡住。</span>
2. A library needs to be embedded into many runtimes or shipped as a small native binary.<br><span class="zh-inline">一个库需要嵌入多个运行时，或者需要交付成小体积原生二进制。</span>
3. A component sits close to the operating system, networking stack, storage layer, or protocol boundary where bugs are expensive.<br><span class="zh-inline">某个模块离操作系统、网络栈、存储层或协议边界很近，出了问题代价特别高。</span>

### Performance Without the Runtime Tax<br><span class="zh-inline">少掉运行时税之后的性能空间</span>

```java
// Java: excellent ergonomics, but allocations and GC shape runtime behavior.
List<Integer> values = new ArrayList<>();
for (int i = 0; i < 1_000_000; i++) {
    values.add(i * 2);
}
```

```rust
// Rust: the same data structure is explicit and native.
let mut values = Vec::with_capacity(1_000_000);
for i in 0..1_000_000 {
    values.push(i * 2);
}
```

Rust does not magically make every program faster. The important difference is that there is no GC, no JVM startup cost, and no hidden object model tax in the background. That makes latency and memory use easier to reason about.<br><span class="zh-inline">Rust 不是魔法，换语言不等于所有程序都会自动提速。真正关键的区别在于：没有 GC、没有 JVM 启动负担、没有隐藏的对象模型开销。于是延迟和内存使用会更容易被分析，也更容易被控制。</span>

## Common Java Pain Points That Rust Addresses<br><span class="zh-inline">Rust 能明显缓解的 Java 常见痛点</span>

### Nulls Become `Option`<br><span class="zh-inline">空值问题会变成 `Option` 问题</span>

Java reduced null pain with better tooling, annotations, and `Optional`, but plain references can still be null and failures still happen at runtime.<br><span class="zh-inline">Java 这些年靠工具、注解和 `Optional` 已经把空值问题压下去不少，但普通引用依旧可能是 null，很多错误依旧在运行时才暴露。</span>

```java
String displayName(User user) {
    return user.getProfile().getDisplayName().toUpperCase();
}
```

```rust
fn display_name(user: &User) -> Option<String> {
    user.profile
        .as_ref()?
        .display_name
        .as_ref()
        .map(|name| name.to_uppercase())
}
```

In Rust, absence is represented in the type system, and callers must handle it explicitly.<br><span class="zh-inline">在 Rust 里，“值可能不存在”会直接体现在类型里，调用方必须显式处理。</span>

### Exceptions Become `Result`<br><span class="zh-inline">异常流会变成 `Result` 流</span>

```java
User loadUser(long id) throws IOException, SQLException {
    // multiple hidden control-flow exits
}
```

```rust
fn load_user(id: u64) -> Result<User, LoadUserError> {
    // all fallible paths are explicit in the signature
}
```

The gain is not just stylistic. Error flows are visible at API boundaries, which makes refactoring safer.<br><span class="zh-inline">这不只是写法偏好问题。错误路径一旦显式出现在 API 边界，重构时心里就会更有数。</span>

### Shared Mutable State Gets Much Harder to Abuse<br><span class="zh-inline">共享可变状态会更难被滥用</span>

Java can absolutely do correct concurrent programming, but the compiler will not stop accidental misuse of shared mutable data structures. Rust is stricter up front so that races and aliasing mistakes are caught earlier.<br><span class="zh-inline">Java 当然可以写出正确的并发程序，但编译器通常不会阻止误用共享可变数据。Rust 则更愿意在前面把规矩立死，让竞争条件和别名问题更早暴露出来。</span>

## When to Choose Rust Over Java<br><span class="zh-inline">什么时候更该选 Rust 而不是 Java</span>

Rust is often a strong fit for:<br><span class="zh-inline">这些场景往往更适合 Rust：</span>

- network proxies and gateways with tight latency budgets<br><span class="zh-inline">对延迟预算非常敏感的网络代理和网关。</span>
- command-line tools and local developer utilities<br><span class="zh-inline">命令行工具和本地开发辅助程序。</span>
- storage engines, parsers, protocol implementations, and agents<br><span class="zh-inline">存储引擎、解析器、协议实现、agent 之类的基础组件。</span>
- libraries that need to be called from Java, Python, Node.js, or C#<br><span class="zh-inline">需要被 Java、Python、Node.js、C# 等多种语言调用的底层库。</span>
- edge, embedded, and container-heavy deployments where binary size matters<br><span class="zh-inline">边缘、嵌入式或容器密集环境里，对二进制体积和资源占用有要求的场景。</span>

Java is often still the better fit for:<br><span class="zh-inline">这些场景往往还是 Java 更顺手：</span>

- mainstream enterprise CRUD systems<br><span class="zh-inline">主流企业 CRUD 系统。</span>
- large teams already optimized around Spring, Jakarta EE, or the JVM ecosystem<br><span class="zh-inline">已经深度围绕 Spring、Jakarta EE 或 JVM 生态组织起来的大团队。</span>
- products where rapid iteration and operational familiarity matter more than native efficiency<br><span class="zh-inline">产品节奏更看重快速迭代和运维熟悉度，而不是原生效率。</span>

## Language Philosophy Comparison<br><span class="zh-inline">语言哲学对照</span>

| Topic<br><span class="zh-inline">主题</span> | Java | Rust |
|---|---|---|
| Memory<br><span class="zh-inline">内存</span> | GC-managed heap<br><span class="zh-inline">GC 管理的堆</span> | Ownership and borrowing<br><span class="zh-inline">所有权与借用</span> |
| Nullability<br><span class="zh-inline">空值</span> | Convention, annotations, `Optional`<br><span class="zh-inline">约定、注解、`Optional`</span> | `Option<T>` in the type system<br><span class="zh-inline">`Option<T>` 进入类型系统</span> |
| Errors<br><span class="zh-inline">错误</span> | Exceptions<br><span class="zh-inline">异常</span> | `Result<T, E>` |
| Inheritance<br><span class="zh-inline">复用方式</span> | Classes and interfaces<br><span class="zh-inline">类与接口</span> | Traits and composition<br><span class="zh-inline">trait 与组合</span> |
| Concurrency<br><span class="zh-inline">并发</span> | Threads, executors, futures<br><span class="zh-inline">线程、执行器、future</span> | Threads, async runtimes, `Send` and `Sync`<br><span class="zh-inline">线程、异步运行时、`Send` 与 `Sync`</span> |
| Deployment<br><span class="zh-inline">部署</span> | JVM process or native image<br><span class="zh-inline">JVM 进程或 native image</span> | Native binary by default<br><span class="zh-inline">默认原生二进制</span> |

The core mental shift is this: Java asks the runtime to keep the system safe and live. Rust asks the type system to prove more invariants before the program is allowed to run.<br><span class="zh-inline">最关键的思维切换是这一句：Java 倾向于把“安全和存活”交给运行时兜底，Rust 则倾向于在程序运行前先让类型系统证明更多约束。</span>

## Quick Reference: Rust vs Java<br><span class="zh-inline">Rust 与 Java 快速对照</span>

| Java concept<br><span class="zh-inline">Java 概念</span> | Rust concept<br><span class="zh-inline">Rust 对应物</span> |
|---|---|
| `interface` | `trait` |
| `record` | `struct` plus trait impls<br><span class="zh-inline">`struct` 加上一组 trait 实现</span> |
| `Optional<T>` | `Option<T>` |
| checked and unchecked exceptions<br><span class="zh-inline">受检与非受检异常</span> | `Result<T, E>` |
| `Stream<T>` | iterator adapters<br><span class="zh-inline">迭代器适配器链</span> |
| `CompletableFuture<T>` | `Future<Output = T>` |
| Maven or Gradle module<br><span class="zh-inline">Maven 或 Gradle 模块</span> | crate |
| package visibility<br><span class="zh-inline">包级可见性</span> | `pub`, `pub(crate)`, module privacy<br><span class="zh-inline">`pub`、`pub(crate)` 与模块私有性</span> |

The rest of the book expands each row of this table until the mapping stops feeling abstract.<br><span class="zh-inline">后面的章节就是把这张对照表一行一行拆开讲，直到这些映射关系不再停留在纸面上。</span>
