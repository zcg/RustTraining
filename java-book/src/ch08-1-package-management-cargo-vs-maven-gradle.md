## Package Management: Cargo vs Maven / Gradle

> **What you'll learn:** How Cargo maps to the build and dependency workflow Java developers know from Maven and Gradle.
>
> **Difficulty:** 🟢 Beginner

Cargo is both build tool and package manager. That is the first thing to internalize. In Java, build logic, dependency declarations, testing, packaging, and plugin behavior are often spread across Maven or Gradle configuration plus a pile of conventions. Cargo puts the common path behind one tool with a much smaller surface area.

### Basic File Mapping

| Java ecosystem | Rust ecosystem |
|---|---|
| `pom.xml` or `build.gradle.kts` | `Cargo.toml` |
| local Maven cache | Cargo registry cache |
| multi-module build | workspace |
| plugin goal or task | Cargo subcommand |
| lock file from build tool | `Cargo.lock` |

### Declaring Dependencies

```xml
<!-- Maven -->
<dependency>
  <groupId>com.fasterxml.jackson.core</groupId>
  <artifactId>jackson-databind</artifactId>
  <version>2.17.0</version>
</dependency>
```

```toml
# Cargo.toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
reqwest = { version = "0.12", features = ["json"] }
```

Cargo dependencies tend to be shorter because the registry is centralized and the package identifier is usually just the crate name.

### Common Commands

| Task | Maven or Gradle | Cargo |
|---|---|---|
| create project | archetype or init plugin | `cargo new app` |
| build | `mvn package`, `gradle build` | `cargo build` |
| run tests | `mvn test`, `gradle test` | `cargo test` |
| run app | plugin task | `cargo run` |
| add dependency | edit build file | `cargo add crate_name` |
| inspect dependency tree | `mvn dependency:tree`, `gradle dependencies` | `cargo tree` |

### Features vs Profiles and Optional Modules

Cargo features are compile-time switches attached to a crate.

```toml
[features]
default = ["json"]
json = []
postgres = ["dep:sqlx"]

[dependencies]
sqlx = { version = "0.8", optional = true }
```

This is closer to optional modules plus conditional compilation than to a typical Maven profile. Features change the code that is compiled, not just the command that runs.

### Workspaces vs Multi-Module Builds

```toml
[workspace]
members = ["api", "core", "cli"]
resolver = "2"
```

A Cargo workspace looks familiar to anyone who has worked in a multi-module Java repository. The difference is that the defaults are simpler: shared lock file, shared target directory, and consistent commands from the repository root.

### Practical Advice for Java Developers

- Start by learning `cargo build`, `cargo test`, `cargo run`, `cargo fmt`, and `cargo clippy`.
- Treat `Cargo.toml` as source code rather than XML ceremony.
- Prefer a small number of well-understood crates instead of recreating the “plugin zoo” habit.
- Read feature flags carefully before adding dependencies to production services.

After a few days, Cargo stops feeling exotic and starts feeling like the build tool Java developers always wanted to have.
