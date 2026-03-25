## Learning Path and Next Steps<br><span class="zh-inline">学习路线与下一步</span>

> **What you'll learn:** A structured roadmap covering weeks 1-2 through month 3+, recommended books and resources, common pitfalls for C# developers, and a practical comparison of `tracing` with `ILogger` and Serilog.<br><span class="zh-inline">**本章将学习：** 一条从第 1 到 2 周延伸到第 3 个月之后的学习路线、推荐书籍与资源、C# 开发者常见误区，以及 `tracing` 与 `ILogger`、Serilog 的实践对照。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 入门</span>

### Immediate Next Steps (Week 1-2)<br><span class="zh-inline">近期安排（第 1 到 2 周）</span>

1. **Set up your environment**<br><span class="zh-inline">**先把开发环境搭起来。**</span>
   - Install Rust via [rustup.rs](https://rustup.rs/)<br><span class="zh-inline">通过 [rustup.rs](https://rustup.rs/) 安装 Rust。</span>
   - Configure VS Code with the rust-analyzer extension<br><span class="zh-inline">在 VS Code 里配置 rust-analyzer 扩展。</span>
   - Create the first `cargo new hello_world` project<br><span class="zh-inline">创建第一个 `cargo new hello_world` 项目。</span>

2. **Master the basics**<br><span class="zh-inline">**把基础动作练熟。**</span>
   - Practice ownership through small exercises<br><span class="zh-inline">通过小练习熟悉所有权。</span>
   - Write functions with `&str`、`String`、`&mut` 这些不同参数形式<br><span class="zh-inline">多写几组分别接收 `&str`、`String`、`&mut` 的函数。</span>
   - Implement basic structs and methods<br><span class="zh-inline">实现基础结构体和方法。</span>

3. **Error handling practice**<br><span class="zh-inline">**开始练错误处理。**</span>
   - Convert C# `try-catch` code into `Result`-based Rust patterns<br><span class="zh-inline">把 C# 的 `try-catch` 代码改写成 Rust 的 `Result` 模式。</span>
   - Practice `?` and `match` repeatedly<br><span class="zh-inline">反复练习 `?` 运算符和 `match`。</span>
   - Implement custom error types<br><span class="zh-inline">动手写几个自定义错误类型。</span>

### Intermediate Goals (Month 1-2)<br><span class="zh-inline">中期目标（第 1 到 2 个月）</span>

1. **Collections and iterators**<br><span class="zh-inline">**集合与迭代器。**</span>
   - Master `Vec<T>`、`HashMap<K,V>`、`HashSet<T>`<br><span class="zh-inline">把 `Vec<T>`、`HashMap<K,V>`、`HashSet<T>` 用顺手。</span>
   - Learn `map`、`filter`、`collect`、`fold` 这些常用迭代器方法<br><span class="zh-inline">掌握 `map`、`filter`、`collect`、`fold` 这些核心迭代器方法。</span>
   - Compare `for` loops with iterator chains in real examples<br><span class="zh-inline">在真实例子里体会 `for` 循环和迭代器链的差异。</span>

2. **Traits and generics**<br><span class="zh-inline">**Trait 与泛型。**</span>
   - Implement common traits such as `Debug`、`Clone`、`PartialEq`<br><span class="zh-inline">实现或派生 `Debug`、`Clone`、`PartialEq` 这类常见 trait。</span>
   - Write generic functions and structs<br><span class="zh-inline">编写泛型函数和泛型结构体。</span>
   - Understand trait bounds and `where` clauses<br><span class="zh-inline">吃透 trait bound 和 `where` 子句。</span>

3. **Project structure**<br><span class="zh-inline">**项目结构。**</span>
   - Organize code into modules<br><span class="zh-inline">学会把代码拆进模块。</span>
   - Understand `pub` visibility<br><span class="zh-inline">理解 `pub` 可见性。</span>
   - Work with external crates from crates.io<br><span class="zh-inline">开始使用 crates.io 上的第三方 crate。</span>

### Advanced Topics (Month 3+)<br><span class="zh-inline">高级主题（第 3 个月之后）</span>

1. **Concurrency**<br><span class="zh-inline">**并发。**</span>
   - Learn `Send` and `Sync` thoroughly<br><span class="zh-inline">把 `Send` 和 `Sync` 真正弄明白。</span>
   - Use `std::thread` for basic parallelism<br><span class="zh-inline">用 `std::thread` 练基础并行。</span>
   - Explore async programming with `tokio`<br><span class="zh-inline">进一步研究基于 `tokio` 的异步编程。</span>

2. **Memory management**<br><span class="zh-inline">**内存管理。**</span>
   - Understand `Rc<T>` and `Arc<T>` for shared ownership<br><span class="zh-inline">理解 `Rc<T>` 和 `Arc<T>` 在共享所有权中的定位。</span>
   - Learn when `Box<T>` is appropriate for heap allocation<br><span class="zh-inline">掌握什么时候该用 `Box<T>` 做堆分配。</span>
   - Master lifetimes in more complex scenarios<br><span class="zh-inline">把生命周期推进到更复杂的场景里练熟。</span>

3. **Real-world projects**<br><span class="zh-inline">**真实项目。**</span>
   - Build a CLI tool with `clap`<br><span class="zh-inline">用 `clap` 做一个命令行工具。</span>
   - Create a web API with `axum` or `warp`<br><span class="zh-inline">用 `axum` 或 `warp` 写一个 Web API。</span>
   - Publish a reusable library to crates.io<br><span class="zh-inline">写一个库并发布到 crates.io。</span>

### Recommended Learning Resources<br><span class="zh-inline">推荐学习资源</span>

#### Books<br><span class="zh-inline">书籍</span>

- **"The Rust Programming Language"** — the official free book.<br><span class="zh-inline">**《The Rust Programming Language》**：官方免费教材，最适合作为主线参考。</span>
- **"Rust by Example"** — hands-on examples that are easy to follow.<br><span class="zh-inline">**《Rust by Example》**：例子驱动，适合边学边敲。</span>
- **"Programming Rust"** by Jim Blandy — deeper technical coverage.<br><span class="zh-inline">**《Programming Rust》**：技术深度更强，适合进阶阶段系统补课。</span>

#### Online Resources<br><span class="zh-inline">在线资源</span>

- [Rust Playground](https://play.rust-lang.org/) — quick experiments in the browser.<br><span class="zh-inline">[Rust Playground](https://play.rust-lang.org/)：浏览器里直接试代码。</span>
- [Rustlings](https://github.com/rust-lang/rustlings) — interactive exercises.<br><span class="zh-inline">[Rustlings](https://github.com/rust-lang/rustlings)：交互式练习集合。</span>
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) — practical examples.<br><span class="zh-inline">[Rust by Example](https://doc.rust-lang.org/rust-by-example/)：官方示例仓库式教程。</span>

#### Practice Projects<br><span class="zh-inline">练手项目</span>

1. **Command-line calculator** — practice enums and pattern matching.<br><span class="zh-inline">**命令行计算器**：练枚举和模式匹配。</span>
2. **File organizer** — work with filesystem APIs and error handling.<br><span class="zh-inline">**文件整理器**：练文件系统操作和错误处理。</span>
3. **JSON processor** — learn `serde` and data transformation.<br><span class="zh-inline">**JSON 处理工具**：练 `serde` 和数据转换。</span>
4. **HTTP server** — understand networking and async basics.<br><span class="zh-inline">**HTTP 服务器**：练网络编程和异步基础。</span>
5. **Database library** — explore traits, generics, and error modeling.<br><span class="zh-inline">**数据库访问库**：练 trait、泛型和错误建模。</span>

### Common Pitfalls for C# Developers<br><span class="zh-inline">C# 开发者常见误区</span>

#### Ownership Confusion<br><span class="zh-inline">对所有权概念发懵</span>

```rust
// DON'T: Trying to use moved values
fn wrong_way() {
    let s = String::from("hello");
    takes_ownership(s);
    // println!("{}", s); // ERROR: s was moved
}

// DO: Use references or clone when needed
fn right_way() {
    let s = String::from("hello");
    borrows_string(&s);
    println!("{}", s); // OK: s is still owned here
}

fn takes_ownership(s: String) { /* s is moved here */ }
fn borrows_string(s: &str) { /* s is borrowed here */ }
```

The key point is that C# developers are used to references moving freely in a GC world, while Rust makes a sharp distinction between borrowing and moving ownership. Once that boundary becomes clear, many diagnostics stop feeling mysterious.<br><span class="zh-inline">这里的关键在于：C# 开发者更熟悉 GC 体系下的引用传递，而 Rust 会把“借用”和“所有权转移”分得非常明确。只要把这条线看清，大量错误都会变得可以预期。</span>

#### Fighting the Borrow Checker<br><span class="zh-inline">总想和借用检查器对着干</span>

```rust
// DON'T: Multiple mutable references
fn wrong_borrowing() {
    let mut v = vec![1, 2, 3];
    let r1 = &mut v;
    // let r2 = &mut v; // ERROR: cannot borrow as mutable more than once
}

// DO: Limit scope of mutable borrows
fn right_borrowing() {
    let mut v = vec![1, 2, 3];
    {
        let r1 = &mut v;
        r1.push(4);
    } // r1 goes out of scope here

    let r2 = &mut v; // OK: no other mutable borrows exist
    r2.push(5);
}
```

Mutability in Rust is intentionally narrow in scope. Once the mutable borrow ends, the next one becomes valid. This explicit scoping is what keeps aliasing and mutation from colliding.<br><span class="zh-inline">Rust 对可变借用的作用域卡得很细。前一个可变借用结束后，后一个才会成立。正是这种显式边界，把“别名”和“修改”冲突拦在了编译期。</span>

#### Expecting Null Values<br><span class="zh-inline">下意识等着 `null` 出现</span>

```rust
// DON'T: Expecting null-like behavior
fn no_null_in_rust() {
    // let s: String = null; // NO null in Rust!
}

// DO: Use Option<T> explicitly
fn use_option_instead() {
    let maybe_string: Option<String> = None;

    match maybe_string {
        Some(s) => println!("Got string: {}", s),
        None => println!("No string available"),
    }
}
```

Rust chooses explicit absence over ambient `null`. That design removes a huge class of late crashes at the type level.<br><span class="zh-inline">Rust 选择用显式的“可能为空”表达，而不是让 `null` 到处游走。这个设计直接把一大类延迟到运行时的空值崩溃前移到了类型系统里。</span>

### Final Tips<br><span class="zh-inline">最后几条建议</span>

1. **Embrace the compiler** — compiler diagnostics are part of the learning process.<br><span class="zh-inline">**接受编译器。** 编译器提示本身就是学习材料。</span>
2. **Start small** — begin with simple programs and increase complexity gradually.<br><span class="zh-inline">**从小程序开始。** 先解决清楚简单问题，再一点点增加复杂度。</span>
3. **Read other people's code** — popular crates are excellent study material.<br><span class="zh-inline">**多读别人的代码。** 优秀 crate 的源码就是高质量教材。</span>
4. **Ask for help** — the Rust community is generally welcoming and practical.<br><span class="zh-inline">**遇到问题就查资料、看讨论。** Rust 社区整体上比较务实，也乐于解答具体问题。</span>
5. **Practice regularly** — concepts that feel awkward early on become natural through repetition.<br><span class="zh-inline">**规律练习。** 前期觉得拧巴的概念，通常都是练熟以后才顺。</span>

Rust has a learning curve, but the reward is substantial: memory safety, predictable performance, and concurrency without fear. The ownership system that initially feels restrictive often becomes the very thing that keeps large codebases reliable.<br><span class="zh-inline">Rust 的学习曲线确实存在，但回报也很扎实：内存安全、可预测性能，以及更可靠的并发模型。刚开始显得很“紧”的所有权系统，往往正是后期保持大型代码稳定的关键。</span>

---

**Congratulations!** This foundation is enough to start the transition from C# to Rust. From this point forward, steady practice through small projects, source reading, and careful attention to compiler diagnostics will deepen understanding step by step.<br><span class="zh-inline">**恭喜。** 这部分内容已经足够支撑从 C# 往 Rust 迁移的起步阶段。接下来只要持续做小项目、持续读源码、持续把错误信息看懂，理解就会稳步加深。</span>

<!-- ch16.2a: Structured Observability with tracing -->
## Structured Observability: `tracing` vs ILogger and Serilog<br><span class="zh-inline">结构化可观测性：`tracing` 与 `ILogger`、Serilog 的对照</span>

C# developers are used to structured logging through `ILogger`、Serilog、NLog 这类工具，日志消息里通常会带有类型化的键值字段。Rust 的 `log` crate 只能提供基础的分级日志，而 **`tracing`** 才是生产场景下更完整的结构化可观测性方案，它支持 span、异步上下文，以及分布式追踪。<br><span class="zh-inline">C# 开发者通常早就习惯了 `ILogger`、Serilog、NLog 这类结构化日志工具，日志记录里会天然带有键值字段。Rust 里的 `log` crate 只覆盖基础分级日志，真正适合生产环境的结构化可观测性方案通常是 **`tracing`**，因为它支持 span、异步上下文与分布式追踪。</span>

### Why `tracing` Over `log`<br><span class="zh-inline">为什么更推荐 `tracing` 而不是 `log`</span>

| Feature<br><span class="zh-inline">特性</span> | `log` crate | `tracing` crate | C# Equivalent<br><span class="zh-inline">C# 对应概念</span> |
|---------|------------|-----------------|----------------|
| Leveled messages<br><span class="zh-inline">分级日志</span> | ✅ `info!()`、`error!()` | ✅ `info!()`、`error!()` | `ILogger.LogInformation()` |
| Structured fields<br><span class="zh-inline">结构化字段</span> | ❌ String interpolation only<br><span class="zh-inline">基本只能拼字符串</span> | ✅ Typed key-value fields<br><span class="zh-inline">类型化键值字段</span> | Serilog `Log.Information("{User}", user)` |
| Spans (scoped context)<br><span class="zh-inline">Span 与作用域上下文</span> | ❌ | ✅ `#[instrument]`、`span!()` | `ILogger.BeginScope()` |
| Async-aware<br><span class="zh-inline">感知异步上下文</span> | ❌ Loses context across `.await`<br><span class="zh-inline">跨 `.await` 容易丢上下文</span> | ✅ Spans follow across `.await`<br><span class="zh-inline">Span 会跟着异步流程走</span> | `Activity` / `DiagnosticSource` |
| Distributed tracing<br><span class="zh-inline">分布式追踪</span> | ❌ | ✅ OpenTelemetry integration<br><span class="zh-inline">可接 OpenTelemetry</span> | `System.Diagnostics.Activity` |
| Multiple output formats<br><span class="zh-inline">多种输出格式</span> | Basic<br><span class="zh-inline">比较基础</span> | JSON、pretty、compact、OTLP | Serilog sinks |

### Getting Started<br><span class="zh-inline">起步依赖</span>

```toml
# Cargo.toml
[dependencies]
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
```

### Basic Usage: Structured Logging<br><span class="zh-inline">基础用法：结构化日志</span>

```csharp
// C# Serilog
Log.Information("Processing order {OrderId} for {Customer}, total {Total:C}",
    orderId, customer.Name, order.Total);
// Output: Processing order 12345 for Alice, total $99.95
// JSON:  {"OrderId": 12345, "Customer": "Alice", "Total": 99.95, ...}
```

```rust
use tracing::{info, warn, error, debug, instrument};

// Structured fields — typed, not string-interpolated
info!(order_id = 12345, customer = "Alice", total = 99.95,
      "Processing order");
// Output: INFO Processing order order_id=12345 customer="Alice" total=99.95
// JSON:  {"order_id": 12345, "customer": "Alice", "total": 99.95, ...}

// Dynamic values
let order_id = 12345;
info!(order_id, "Order received");  // field name = variable name shorthand

// Conditional fields
if let Some(promo) = promo_code {
    info!(order_id, promo_code = %promo, "Promo applied");
    //                        ^ % means use Display formatting
    //                        ? would use Debug formatting
}
```

The important shift is that fields are first-class structured data rather than formatted text fragments. That makes downstream search, filtering, and aggregation much stronger.<br><span class="zh-inline">这里最重要的变化在于：字段不再只是拼进日志字符串里的文字，而是独立存在的结构化数据。这样一来，后续检索、过滤、聚合都会更强。</span>

### Spans: The Killer Feature for Async Code<br><span class="zh-inline">Span：异步代码里最关键的能力</span>

Spans are scoped contexts that keep fields alive across function calls and `.await` points. It is similar in spirit to `ILogger.BeginScope()`，但它对异步场景更自然。<br><span class="zh-inline">Span 是带作用域的上下文，它能让字段跨函数调用和 `.await` 保持存在。这个概念和 `ILogger.BeginScope()` 很接近，但在异步场景里更自然。</span>

```csharp
// C# — Activity / BeginScope
using var activity = new Activity("ProcessOrder").Start();
activity.SetTag("order_id", orderId);

using (_logger.BeginScope(new Dictionary<string, object> { ["OrderId"] = orderId }))
{
    _logger.LogInformation("Starting processing");
    await ProcessPaymentAsync();
    _logger.LogInformation("Payment complete");  // OrderId still in scope
}
```

```rust
use tracing::{info, instrument, Instrument};

// #[instrument] automatically creates a span with function args as fields
#[instrument(skip(db), fields(customer_name))]
async fn process_order(order_id: u64, db: &Database) -> Result<(), AppError> {
    let order = db.get_order(order_id).await?;

    // Add a field to the current span dynamically
    tracing::Span::current().record("customer_name", &order.customer_name.as_str());

    info!("Starting processing");
    process_payment(&order).await?;        // span context preserved across .await!
    info!(items = order.items.len(), "Payment complete");
    Ok(())
}
// Every log message inside this function automatically includes:
//   order_id=12345 customer_name="Alice"
// Even in nested async calls!

// Manual span creation (like BeginScope)
async fn batch_process(orders: Vec<u64>, db: &Database) {
    for order_id in orders {
        let span = tracing::info_span!("process_order", order_id);

        // .instrument(span) attaches the span to the future
        process_order(order_id, db)
            .instrument(span)
            .await
            .unwrap_or_else(|e| error!("Failed: {e}"));
    }
}
```

Once spans are in place, logs stop being isolated lines and become connected traces of work. That is especially valuable in async services where execution jumps across `.await` boundaries.<br><span class="zh-inline">一旦把 span 用起来，日志就不再是孤零零的一行一行，而是可以串成完整工作过程的上下文轨迹。这在跨越多个 `.await` 的异步服务里尤其有价值。</span>

### Subscriber Configuration (Like Serilog Sinks)<br><span class="zh-inline">Subscriber 配置（相当于 Serilog 的 sink 配置）</span>

```rust
use tracing_subscriber::{fmt, EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

fn init_tracing() {
    // Development: human-readable, colored output
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "my_app=debug,tower_http=info".into()))
        .with(fmt::layer().pretty())  // Colored, indented spans
        .init();
}

fn init_tracing_production() {
    // Production: JSON output for log aggregation (like Serilog JSON sink)
    tracing_subscriber::registry()
        .with(EnvFilter::new("my_app=info"))
        .with(fmt::layer().json())  // Structured JSON
        .init();
    // Output: {"timestamp":"...","level":"INFO","fields":{"order_id":123},...}
}
```

```bash
# Control log levels via environment variable (like Serilog MinimumLevel)
RUST_LOG=my_app=debug,hyper=warn cargo run
RUST_LOG=trace cargo run  # everything
```

Development usually prefers readable pretty output, while production systems often prefer JSON for centralized collection. `EnvFilter` then acts much like runtime log-level configuration in other ecosystems.<br><span class="zh-inline">开发阶段通常更适合可读性高的 pretty 输出，生产环境则往往更偏向 JSON，方便集中采集。`EnvFilter` 的角色则很像其他生态里的运行时日志级别配置。</span>

### Serilog → tracing Migration Cheat Sheet<br><span class="zh-inline">Serilog → tracing 迁移速查</span>

| Serilog / ILogger | tracing | Notes<br><span class="zh-inline">说明</span> |
|-------------------|---------|-------|
| `Log.Information("{Key}", val)` | `info!(key = val, "message")` | Fields are typed, not interpolated<br><span class="zh-inline">字段是类型化数据，不只是字符串插值</span> |
| `Log.ForContext("Key", val)` | `span.record("key", val)` | Add fields to current span<br><span class="zh-inline">向当前 span 追加字段</span> |
| `using BeginScope(...)` | `#[instrument]` or `info_span!()` | Automatic with `#[instrument]`<br><span class="zh-inline">`#[instrument]` 可自动生成</span> |
| `.WriteTo.Console()` | `fmt::layer()` | Human-readable<br><span class="zh-inline">可读性高</span> |
| `.WriteTo.Seq()` / `.File()` | `fmt::layer().json()` + file redirect | Or use `tracing-appender`<br><span class="zh-inline">也可结合 `tracing-appender`</span> |
| `.Enrich.WithProperty()` | `span!(Level::INFO, "name", key = val)` | Span fields<br><span class="zh-inline">通过 span 字段补充上下文</span> |
| `LogEventLevel.Debug` | `tracing::Level::DEBUG` | Same concept<br><span class="zh-inline">概念一致</span> |
| `{@Object}` destructuring | `field = ?value` or `%value` | `?` uses `Debug`，`%` uses `Display`<br><span class="zh-inline">`?` 使用 `Debug`，`%` 使用 `Display`</span> |

### OpenTelemetry Integration<br><span class="zh-inline">OpenTelemetry 集成</span>

```toml
# For distributed tracing (like System.Diagnostics + OTLP exporter)
[dependencies]
tracing-opentelemetry = "0.22"
opentelemetry = "0.21"
opentelemetry-otlp = "0.14"
```

```rust
// Add OpenTelemetry layer alongside console output
use tracing_opentelemetry::OpenTelemetryLayer;

fn init_otel() {
    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(opentelemetry_otlp::new_exporter().tonic())
        .install_batch(opentelemetry_sdk::runtime::Tokio)
        .expect("Failed to create OTLP tracer");

    tracing_subscriber::registry()
        .with(OpenTelemetryLayer::new(tracer))  // Send spans to Jaeger/Tempo
        .with(fmt::layer())                      // Also print to console
        .init();
}
// Now #[instrument] spans automatically become distributed traces!
```

With this layer in place, spans from `tracing` can flow into Jaeger、Tempo、OpenTelemetry collectors 这类系统。对于需要跨服务排查问题的后端系统，这一步的价值非常高。<br><span class="zh-inline">接入这一层之后，`tracing` 里的 span 就能被送到 Jaeger、Tempo、OpenTelemetry Collector 等系统。对于需要跨服务定位问题的后端系统，这一步非常重要。</span>

***
