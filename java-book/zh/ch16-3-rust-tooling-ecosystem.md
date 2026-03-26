## Rust Tooling for Java Developers<br><span class="zh-inline">面向 Java 开发者的 Rust 工具</span>

> **What you'll learn:** Which everyday Rust tools correspond to the workflow Java developers already know from IDEs, formatters, linters, test runners, release pipelines, and debugging setups.<br><span class="zh-inline">**本章将学习：** 日常 Rust 工具分别对应 Java 开发者熟悉的哪些 IDE、格式化、静态分析、测试、发布流水线和调试方式。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 初级</span>

Rust tooling feels smaller than the Java ecosystem, but the essentials are strong and unusually coherent. Many Java teams are used to stitching together Maven or Gradle, IDE plugins, code style plugins, test runners, and release helpers. Rust trims a lot of that surface area.<br><span class="zh-inline">Rust 工具体系看起来比 Java 生态小很多，但核心工具很硬，而且整体协同性非常强。很多 Java 团队习惯把 Maven 或 Gradle、IDE 插件、代码风格插件、测试插件、发布辅助工具拼成一套；Rust 在这方面会收得更紧，工具面更小。</span>

## Core Tool Mapping<br><span class="zh-inline">核心工具映射</span>

| Java workflow<br><span class="zh-inline">Java 工作流</span> | Rust tool |
|---|---|
| IDE language service<br><span class="zh-inline">IDE 语言服务</span> | `rust-analyzer` |
| formatter<br><span class="zh-inline">格式化器</span> | `rustfmt` |
| static analysis<br><span class="zh-inline">静态分析</span> | `clippy` |
| build and test command<br><span class="zh-inline">构建与测试命令</span> | `cargo` |
| documentation generation<br><span class="zh-inline">文档生成</span> | `cargo doc` |
| benchmark harness<br><span class="zh-inline">基准测试</span> | `criterion` |
| extended test runner<br><span class="zh-inline">增强测试执行器</span> | `cargo-nextest` |
| dependency or policy checks<br><span class="zh-inline">依赖与策略检查</span> | `cargo-deny`, `cargo-audit` |

## The Daily Loop<br><span class="zh-inline">日常循环</span>

```bash
cargo fmt
cargo clippy --all-targets --all-features
cargo test
cargo run
```

That loop replaces a surprising amount of Maven, Gradle, IDE, and plugin ceremony.<br><span class="zh-inline">就这么一套循环，往往就能替掉不少 Maven、Gradle、IDE 插件层面的繁琐动作。</span>

## IDE Experience<br><span class="zh-inline">IDE 体验</span>

Java developers usually compare everything to IntelliJ IDEA. The closest Rust equivalent is `rust-analyzer` integrated into an editor or IDE. It gives:<br><span class="zh-inline">Java 开发者通常会拿 IntelliJ IDEA 当标尺。Rust 里最接近的核心能力就是集成在编辑器或 IDE 里的 `rust-analyzer`，它可以提供：</span>

- type information<br><span class="zh-inline">类型信息。</span>
- go to definition<br><span class="zh-inline">跳转定义。</span>
- inline diagnostics<br><span class="zh-inline">内联诊断。</span>
- rename and refactor support<br><span class="zh-inline">重命名和基础重构支持。</span>
- inlay hints that make ownership and lifetimes easier to read<br><span class="zh-inline">能让所有权和生命周期更容易阅读的 inlay hint。</span>

For mixed Java and Rust teams, it is common to keep IntelliJ IDEA for JVM work and use RustRover or another `rust-analyzer`-backed editor for Rust-heavy code.<br><span class="zh-inline">对同时做 Java 和 Rust 的团队来说，常见做法是 JVM 侧继续用 IntelliJ IDEA，Rust 较多的仓库则配 RustRover 或其他基于 `rust-analyzer` 的编辑器。</span>

## `rustfmt`<br><span class="zh-inline">`rustfmt`</span>

Rust formatting culture is stricter than the average Java codebase. That usually helps teams move faster because formatting stops being a topic of debate.<br><span class="zh-inline">Rust 对格式化一致性的要求通常比平均 Java 代码库更强。这反而经常能让团队更快，因为格式问题基本不会再成为争论点。</span>

## `clippy`<br><span class="zh-inline">`clippy`</span>

`clippy` is the tool that makes many new Rust developers improve quickly. It catches:<br><span class="zh-inline">`clippy` 往往是新 Rust 开发者进步最快的工具之一，它能抓出很多典型问题：</span>

- needless clones<br><span class="zh-inline">没必要的 clone。</span>
- awkward iterator usage<br><span class="zh-inline">别扭的迭代器写法。</span>
- manual patterns that already have standard helpers<br><span class="zh-inline">明明标准库已经有助手函数，却还在手搓。</span>
- suspicious API design choices<br><span class="zh-inline">可疑的 API 设计。</span>
- common ownership mistakes that still compile but read poorly<br><span class="zh-inline">虽然能编译，但读起来很别扭的典型所有权写法。</span>

## `cargo doc`<br><span class="zh-inline">`cargo doc`</span>

`cargo doc` generates local HTML documentation from code comments and public items. It is especially useful in library-heavy codebases where type-driven design matters.<br><span class="zh-inline">`cargo doc` 会根据代码注释和公共项生成本地 HTML 文档。对库很多、而且比较依赖类型设计的代码库来说，这玩意非常实用。</span>

## Testing and Debugging<br><span class="zh-inline">测试与调试</span>

Java developers often expect JUnit, Mockito, IDE test runners, and rich debugger integration. In Rust:<br><span class="zh-inline">Java 开发者通常已经习惯了 JUnit、Mockito、IDE 测试运行器以及比较成熟的调试器集成。到了 Rust 这边，常见工具会变成：</span>

- `cargo test` is the default test entry point<br><span class="zh-inline">`cargo test` 是默认测试入口。</span>
- `cargo-nextest` is useful when test suites become large<br><span class="zh-inline">测试规模变大之后，`cargo-nextest` 会更舒服。</span>
- `insta` helps with snapshot-style assertions<br><span class="zh-inline">`insta` 适合做快照式断言。</span>
- `tokio-console` helps inspect async behavior in Tokio applications<br><span class="zh-inline">`tokio-console` 适合观察 Tokio 异步程序的运行状态。</span>

The debugging story is simpler than Java's JVM tooling, but the compiler catches much more before the debugger even becomes necessary.<br><span class="zh-inline">调试生态肯定没有 JVM 那么厚，但 Rust 编译器会在调试器登场之前先替人挡掉更多问题。</span>

## Release and CI Tooling<br><span class="zh-inline">发布与 CI 工具</span>

For Java teams, this is the rough translation:<br><span class="zh-inline">如果用 Java 团队熟悉的方式去理解，大致可以这样对照：</span>

| Java habit<br><span class="zh-inline">Java 习惯</span> | Rust equivalent |
|---|---|
| `mvn verify` or `gradle check` in CI<br><span class="zh-inline">CI 里跑 `mvn verify` 或 `gradle check`</span> | `cargo fmt --check`, `cargo clippy`, `cargo test` |
| dependency policy plugins<br><span class="zh-inline">依赖策略插件</span> | `cargo-deny`, `cargo-audit` |
| generated API docs in pipeline<br><span class="zh-inline">流水线生成 API 文档</span> | `cargo doc` |
| multi-module release automation<br><span class="zh-inline">多模块发布自动化</span> | workspace-aware `cargo` commands, optionally `cargo-dist` |

Many teams also use `cross` when building for multiple targets from one CI environment.<br><span class="zh-inline">如果需要从同一套 CI 环境构建多个目标平台，很多团队也会加上 `cross`。</span>

## Advice<br><span class="zh-inline">建议</span>

- Put `cargo fmt`, `cargo clippy`, and `cargo test` in CI early.<br><span class="zh-inline">尽早把 `cargo fmt`、`cargo clippy` 和 `cargo test` 放进 CI。</span>
- Treat compiler diagnostics as part of the design process rather than as late feedback.<br><span class="zh-inline">把编译器诊断当成设计过程的一部分，而不是项目后期的补救反馈。</span>
- Keep the toolchain simple instead of layering custom wrappers too soon.<br><span class="zh-inline">工具链先保持简洁，别太早在外面再套一堆自定义包装层。</span>
- Standardize one workspace command set before inventing organization-specific build conventions.<br><span class="zh-inline">先把团队统一的 workspace 命令集定清楚，再谈组织内部那套额外构建规范。</span>

The pleasant surprise for many Java developers is that Rust tooling often feels more coherent because the ecosystem grew around Cargo and the compiler rather than around many competing build traditions.<br><span class="zh-inline">很多 Java 开发者最后会有个挺舒服的感受：Rust 工具链往往更整齐，因为整个生态是围绕 Cargo 和编译器长出来的，而不是围绕多套彼此竞争的构建传统拼出来的。</span>
