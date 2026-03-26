## Essential Crates for Java Developers

> **What you'll learn:** Which Rust crates map most naturally to familiar Java engineering needs, how to choose them without rebuilding the entire Spring universe, and which combinations make sense for services, tools, and libraries.
>
> **Difficulty:** 🟡 Intermediate

There is no perfect one-to-one mapping between Rust crates and Java libraries. Rust ecosystems are usually smaller, more focused, and less framework-centered. The useful question is not “what is the exact Rust version of library X?” but “which crate category solves the same engineering problem with Rust-style composition?”

## Practical Mapping Table

| Java need | Typical Java choice | Common Rust choice |
|---|---|---|
| JSON serialization | Jackson, Gson | `serde`, `serde_json` |
| HTTP client | `HttpClient`, OkHttp | `reqwest` |
| async runtime | `CompletableFuture` plus executors | `tokio` |
| web framework | Spring MVC, Spring WebFlux, Javalin | `axum`, `actix-web`, `warp` |
| logging and observability | SLF4J, Logback, Micrometer | `tracing`, `tracing-subscriber`, `metrics` |
| configuration | Spring config, Typesafe config | `config`, `figment` |
| CLI parsing | picocli | `clap` |
| database access | JDBC, JPA, jOOQ | `sqlx`, `diesel`, `sea-orm` |
| gRPC | gRPC Java | `tonic` |
| testing helpers | JUnit ecosystem | built-in `#[test]`, `rstest`, `proptest` |

## Starter Sets by Project Type

### HTTP Service

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

That bundle feels familiar to Spring Boot developers: routing, middleware, JSON, runtime, and structured logs.

### CLI or Internal Tool

```toml
[dependencies]
anyhow = "1"
clap = { version = "4", features = ["derive"] }
serde = { version = "1", features = ["derive"] }
toml = "0.8"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["fmt", "env-filter"] }
```

That is often enough for the kind of command-line tools Java teams would previously build with picocli and a small utility stack.

## Selection Heuristics for Java Teams

- prefer crates with strong documentation, recent releases, and active issue triage
- choose libraries that compose well instead of frameworks that hide every decision
- read feature flags before enabling `full` everywhere, because compile-time surface area matters more in Rust
- prefer explicit types and thin abstractions before introducing dependency-injection-like indirection

## Common Migration Patterns

### From Spring Boot Thinking

Java teams often look for one dependency that supplies controllers, dependency injection, validation, config binding, metrics, and database access in a single package. Rust usually works better with a smaller kit:

- `axum` for routing and handlers
- `tower` or `tower-http` for middleware
- `serde` for JSON and config shapes
- `sqlx` for database access
- `tracing` for logs and spans

That stack is less magical than Spring Boot, but it is also easier to debug because each part stays visible.

### From JPA Thinking

Rust developers often start with `sqlx` because it keeps SQL explicit and checks queries more aggressively. Teams that want a more ORM-like experience can evaluate `diesel` or `sea-orm`, but the first migration usually goes smoother when the data layer stays close to SQL.

## Where Java Developers Commonly Overbuild

- recreating dependency injection containers before understanding ownership and constructor-based composition
- reaching for ORM-style abstraction before modeling the actual data flow
- assuming every cross-cutting concern needs a framework extension point
- building custom platform layers before learning the standard Cargo workflow

## Recommended First Wave

For most teams, these are the first crates worth mastering:

- `serde`
- `tokio`
- `axum` or `reqwest`, depending on whether the project is server-side or client-side
- `tracing`
- `thiserror` and `anyhow`
- `clap`

Once those are comfortable, the rest of the ecosystem becomes much easier to evaluate without importing Java habits that Rust does not benefit from.
