## Essential Crates for Java Developers<br><span class="zh-inline">Java 开发者常用的 Rust crate</span>

> **What you'll learn:** Which Rust crates map most naturally to familiar Java engineering needs, how to choose them without rebuilding the entire Spring universe, and which combinations make sense for services, tools, and libraries.<br><span class="zh-inline">**本章将学习：** 哪些 Rust crate 最适合映射 Java 开发里熟悉的工程需求，怎样在不重造整套 Spring 世界的前提下做选择，以及服务、工具、库项目分别适合什么组合。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

There is no perfect one-to-one mapping between Rust crates and Java libraries. Rust ecosystems are usually smaller, more focused, and less framework-centered. The useful question is not “what is the exact Rust version of library X?” but “which crate category solves the same engineering problem with Rust-style composition?”<br><span class="zh-inline">Rust crate 和 Java 库之间通常不存在完美的一比一映射。Rust 生态一般更小、更聚焦，也没那么强的框架中心化倾向。真正有用的问题不是“某个 Java 库在 Rust 里一模一样的替身是谁”，而是“哪类 crate 用更符合 Rust 习惯的组合方式解决同一种工程问题”。</span>

## Practical Mapping Table<br><span class="zh-inline">实用映射表</span>

| Java need<br><span class="zh-inline">Java 需求</span> | Typical Java choice | Common Rust choice |
|---|---|---|
| JSON serialization<br><span class="zh-inline">JSON 序列化</span> | Jackson, Gson | `serde`, `serde_json` |
| HTTP client<br><span class="zh-inline">HTTP 客户端</span> | `HttpClient`, OkHttp | `reqwest` |
| async runtime<br><span class="zh-inline">异步运行时</span> | `CompletableFuture` plus executors | `tokio` |
| web framework<br><span class="zh-inline">Web 框架</span> | Spring MVC, Spring WebFlux, Javalin | `axum`, `actix-web`, `warp` |
| logging and observability<br><span class="zh-inline">日志与可观测性</span> | SLF4J, Logback, Micrometer | `tracing`, `tracing-subscriber`, `metrics` |
| configuration<br><span class="zh-inline">配置</span> | Spring config, Typesafe config | `config`, `figment` |
| CLI parsing<br><span class="zh-inline">命令行解析</span> | picocli | `clap` |
| database access<br><span class="zh-inline">数据库访问</span> | JDBC, JPA, jOOQ | `sqlx`, `diesel`, `sea-orm` |
| gRPC<br><span class="zh-inline">gRPC</span> | gRPC Java | `tonic` |
| testing helpers<br><span class="zh-inline">测试辅助</span> | JUnit ecosystem | built-in `#[test]`, `rstest`, `proptest` |

## Starter Sets by Project Type<br><span class="zh-inline">按项目类型推荐的起步组合</span>

### HTTP Service<br><span class="zh-inline">HTTP 服务</span>

```toml
[dependencies]
axum = "0.8"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
tower = "0.5"
tower-http = { version = "0.6", features = ["trace", "cors"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["fmt", "env-filter"] }
```

That bundle feels familiar to Spring Boot developers: routing, middleware, JSON, runtime, and structured logs.<br><span class="zh-inline">这套组合对 Spring Boot 开发者来说会比较有熟悉感：路由、中间件、JSON、运行时、结构化日志，基本都齐了。</span>

### CLI or Internal Tool<br><span class="zh-inline">命令行工具或内部工具</span>

```toml
[dependencies]
anyhow = "1"
clap = { version = "4", features = ["derive"] }
serde = { version = "1", features = ["derive"] }
toml = "0.8"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["fmt", "env-filter"] }
```

That is often enough for the kind of command-line tools Java teams would previously build with picocli and a small utility stack.<br><span class="zh-inline">对很多原本会用 picocli 加一小堆工具库去写的 Java 命令行程序来说，这套已经很够用了。</span>

## Selection Heuristics for Java Teams<br><span class="zh-inline">Java 团队的 crate 选择原则</span>

- prefer crates with strong documentation, recent releases, and active issue triage<br><span class="zh-inline">优先挑文档扎实、版本更新正常、问题处理活跃的 crate。</span>
- choose libraries that compose well instead of frameworks that hide every decision<br><span class="zh-inline">优先选能自由组合的库，而不是把所有决定都包起来的大框架。</span>
- read feature flags before enabling `full` everywhere, because compile-time surface area matters more in Rust<br><span class="zh-inline">别一上来就全开 `full`，Rust 的编译面和依赖面比 Java 更值得细抠。</span>
- prefer explicit types and thin abstractions before introducing dependency-injection-like indirection<br><span class="zh-inline">先接受显式类型和薄抽象，再考虑类似依赖注入那种间接层。</span>

## Common Migration Patterns<br><span class="zh-inline">常见迁移思路</span>

### From Spring Boot Thinking<br><span class="zh-inline">从 Spring Boot 思维迁过来</span>

Java teams often look for one dependency that supplies controllers, dependency injection, validation, config binding, metrics, and database access in a single package. Rust usually works better with a smaller kit:<br><span class="zh-inline">Java 团队常常会下意识寻找一个依赖，最好把控制器、依赖注入、校验、配置绑定、指标、数据库访问全包了。Rust 往往更适合一套小而清楚的组合：</span>

- `axum` for routing and handlers<br><span class="zh-inline">`axum` 负责路由和处理函数。</span>
- `tower` or `tower-http` for middleware<br><span class="zh-inline">`tower` 或 `tower-http` 负责中间件。</span>
- `serde` for JSON and config shapes<br><span class="zh-inline">`serde` 负责 JSON 和配置结构。</span>
- `sqlx` for database access<br><span class="zh-inline">`sqlx` 负责数据库访问。</span>
- `tracing` for logs and spans<br><span class="zh-inline">`tracing` 负责日志和 span。</span>

That stack is less magical than Spring Boot, but it is also easier to debug because each part stays visible.<br><span class="zh-inline">这套东西没有 Spring Boot 那么“全自动”，但调试起来反而更清楚，因为每一层都摆在明面上。</span>

### From JPA Thinking<br><span class="zh-inline">从 JPA 思维迁过来</span>

Rust developers often start with `sqlx` because it keeps SQL explicit and checks queries more aggressively. Teams that want a more ORM-like experience can evaluate `diesel` or `sea-orm`, but the first migration usually goes smoother when the data layer stays close to SQL.<br><span class="zh-inline">Rust 开发里，很多人一开始会先选 `sqlx`，因为它让 SQL 保持显式，而且对查询的检查更直接。想要更 ORM 一点的体验，也可以评估 `diesel` 或 `sea-orm`；不过第一轮迁移通常还是让数据层贴近 SQL 会更顺。</span>

## Where Java Developers Commonly Overbuild<br><span class="zh-inline">Java 开发者最容易搭过头的地方</span>

- recreating dependency injection containers before understanding ownership and constructor-based composition<br><span class="zh-inline">还没理解所有权和基于构造参数的组合，就急着重建依赖注入容器。</span>
- reaching for ORM-style abstraction before modeling the actual data flow<br><span class="zh-inline">还没把真实数据流建清楚，就先上 ORM 式大抽象。</span>
- assuming every cross-cutting concern needs a framework extension point<br><span class="zh-inline">总觉得每个横切问题都必须挂在框架扩展点上。</span>
- building custom platform layers before learning the standard Cargo workflow<br><span class="zh-inline">Cargo 的标准工作方式还没熟，就先自建平台层和包装层。</span>

## Recommended First Wave<br><span class="zh-inline">建议优先掌握的第一批 crate</span>

For most teams, these are the first crates worth mastering:<br><span class="zh-inline">对大多数团队来说，先把下面这些用顺最值：</span>

- `serde`
- `tokio`
- `axum` or `reqwest`, depending on whether the project is server-side or client-side<br><span class="zh-inline">`axum` 或 `reqwest`，取决于项目偏服务端还是客户端。</span>
- `tracing`
- `thiserror` and `anyhow`<br><span class="zh-inline">`thiserror` 和 `anyhow`。</span>
- `clap`

Once those are comfortable, the rest of the ecosystem becomes much easier to evaluate without importing Java habits that Rust does not benefit from.<br><span class="zh-inline">这些掌握之后，再去看更大的生态就容易多了，也更不容易把对 Rust 没好处的 Java 习惯一并带过来。</span>
