## Package Management: Cargo vs Maven / Gradle<br><span class="zh-inline">包管理：Cargo 与 Maven / Gradle</span>

> **What you'll learn:** How Cargo maps to the build and dependency workflow Java developers know from Maven and Gradle.<br><span class="zh-inline">**本章将学习：** Cargo 和 Java 开发者熟悉的 Maven、Gradle 在构建与依赖管理上的对应关系。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 初级</span>

Cargo is both build tool and package manager. That is the first thing to internalize. In Java, build logic, dependency declarations, testing, packaging, and plugin behavior are often spread across Maven or Gradle configuration plus a pile of conventions. Cargo puts the common path behind one tool with a much smaller surface area.<br><span class="zh-inline">Cargo 同时承担构建工具和包管理器两个角色，这是最先要建立起来的认知。在 Java 世界里，构建逻辑、依赖声明、测试、打包和插件行为通常散落在 Maven 或 Gradle 配置以及一堆约定里。Cargo 则把常用路径压进了一个更小、更直接的工具表面。</span>

### Basic File Mapping<br><span class="zh-inline">基础文件映射</span>

| Java ecosystem<br><span class="zh-inline">Java 生态</span> | Rust ecosystem<br><span class="zh-inline">Rust 生态</span> |
|---|---|
| `pom.xml` or `build.gradle.kts` | `Cargo.toml` |
| local Maven cache<br><span class="zh-inline">本地 Maven 缓存</span> | Cargo registry cache<br><span class="zh-inline">Cargo 注册表缓存</span> |
| multi-module build<br><span class="zh-inline">多模块构建</span> | workspace |
| plugin goal or task<br><span class="zh-inline">插件目标或任务</span> | Cargo subcommand<br><span class="zh-inline">Cargo 子命令</span> |
| lock file from build tool<br><span class="zh-inline">构建工具生成的锁文件</span> | `Cargo.lock` |

### Declaring Dependencies<br><span class="zh-inline">声明依赖</span>

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

Cargo dependencies tend to be shorter because the registry is centralized and the package identifier is usually just the crate name.<br><span class="zh-inline">Cargo 的依赖声明通常更短，因为注册表相对集中，包标识一般也就是 crate 名字本身。</span>

### Common Commands<br><span class="zh-inline">常用命令对照</span>

| Activity<br><span class="zh-inline">活动</span> | Maven or Gradle | Cargo |
|---|---|---|
| create project<br><span class="zh-inline">创建项目</span> | archetype or init plugin | `cargo new app` |
| build<br><span class="zh-inline">构建</span> | `mvn package`, `gradle build` | `cargo build` |
| run tests<br><span class="zh-inline">运行测试</span> | `mvn test`, `gradle test` | `cargo test` |
| run app<br><span class="zh-inline">运行程序</span> | plugin task | `cargo run` |
| add dependency<br><span class="zh-inline">添加依赖</span> | edit build file | `cargo add crate_name` |
| inspect dependency tree<br><span class="zh-inline">查看依赖树</span> | `mvn dependency:tree`, `gradle dependencies` | `cargo tree` |

### Features vs Profiles and Optional Modules<br><span class="zh-inline">feature 与 profile、可选模块的差异</span>

Cargo features are compile-time switches attached to a crate.<br><span class="zh-inline">Cargo feature 是绑定在 crate 上的编译期开关。</span>

```toml
[features]
default = ["json"]
json = []
postgres = ["dep:sqlx"]

[dependencies]
sqlx = { version = "0.8", optional = true }
```

This is closer to optional modules plus conditional compilation than to a typical Maven profile. Features change the code that is compiled, not just the command that runs.<br><span class="zh-inline">它更接近“可选模块 + 条件编译”，而不是传统 Maven profile。feature 改变的是参与编译的代码，而不只是执行哪条命令。</span>

### Workspaces vs Multi-Module Builds<br><span class="zh-inline">workspace 与多模块构建</span>

```toml
[workspace]
members = ["api", "core", "cli"]
resolver = "2"
```

A Cargo workspace looks familiar to anyone who has worked in a multi-module Java repository. The difference is that the defaults are simpler: shared lock file, shared target directory, and consistent commands from the repository root.<br><span class="zh-inline">只要做过多模块 Java 仓库，这个结构就不会陌生。差别在于 Cargo 的默认行为更简单：共享锁文件、共享 target 目录，并且可以从仓库根目录统一执行命令。</span>

### Practical Advice for Java Developers<br><span class="zh-inline">给 Java 开发者的实际建议</span>

- Start by learning `cargo build`, `cargo test`, `cargo run`, `cargo fmt`, and `cargo clippy`.<br><span class="zh-inline">先把 `cargo build`、`cargo test`、`cargo run`、`cargo fmt`、`cargo clippy` 用熟。</span>
- Treat `Cargo.toml` as source code rather than XML ceremony.<br><span class="zh-inline">把 `Cargo.toml` 当成源代码的一部分，而不是额外的 XML 仪式。</span>
- Prefer a small number of well-understood crates instead of recreating the “plugin zoo” habit.<br><span class="zh-inline">优先使用少量真正理解清楚的 crate，别把“插件动物园”习惯带过来。</span>
- Read feature flags carefully before adding dependencies to production services.<br><span class="zh-inline">在生产服务里引入依赖前，先把 feature 开关看明白。</span>

After a few days, Cargo stops feeling exotic and starts feeling like the build tool Java developers always wanted to have.<br><span class="zh-inline">熟悉几天之后，Cargo 往往就不再显得陌生，反而会像是 Java 开发者一直想要但没真正拥有过的那种构建工具。</span>
