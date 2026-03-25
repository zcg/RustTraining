# Rust Engineering Practices — Beyond `cargo build`<br><span class="zh-inline">Rust 工程实践：超越 `cargo build`</span>

## Speaker Intro<br><span class="zh-inline">讲者简介</span>

- Principal Firmware Architect in Microsoft SCHIE (Silicon and Cloud Hardware Infrastructure Engineering) team<br><span class="zh-inline">微软 SCHIE 团队首席固件架构师。</span>
- Industry veteran with expertise in security, systems programming (firmware, operating systems, hypervisors), CPU and platform architecture, and C++ systems<br><span class="zh-inline">长期从事安全、系统编程、固件、操作系统、虚拟机监控器、CPU 与平台架构，以及 C++ 系统开发。</span>
- Started programming in Rust in 2017 (@AWS EC2), and have been in love with the language ever since<br><span class="zh-inline">自 2017 年在 AWS EC2 开始使用 Rust，此后持续深耕这门语言。</span>

---

> A practical guide to the Rust toolchain features that most teams discover too late:
> build scripts, cross-compilation, benchmarking, code coverage, and safety verification
> with Miri and Valgrind. Each chapter uses concrete examples drawn from
> a real hardware-diagnostics codebase —
> a large multi-crate workspace — so every technique maps directly to production code.<br><span class="zh-inline">这是一本偏工程实践的指南，专门讲那些很多团队往往接触得太晚的 Rust 工具链能力：构建脚本、交叉编译、基准测试、代码覆盖率，以及借助 Miri 和 Valgrind 做安全验证。每一章都围绕一个真实的硬件诊断代码库展开，这个代码库是一个大型多 crate 工作区，因此里面的每个技巧都能直接映射到生产代码。</span>

## How to Use This Book<br><span class="zh-inline">如何使用本书</span>

This book is designed for **self-paced study or team workshops**. Each chapter is largely independent — read them in order or jump to the topic you need.<br><span class="zh-inline">这本书既适合个人自学，也适合团队工作坊。各章节之间大体独立，可以按顺序阅读，也可以直接跳到当前最需要的主题。</span>

### Difficulty Legend<br><span class="zh-inline">难度说明</span>

| Symbol | Level | Meaning |
|:------:|-------|---------|
| 🟢 | Starter<br><span class="zh-inline">入门</span> | Straightforward tools with clear patterns — useful on day one<br><span class="zh-inline">模式清晰、上手直接，第一天就能用起来。</span> |
| 🟡 | Intermediate<br><span class="zh-inline">中级</span> | Requires understanding of toolchain internals or platform concepts<br><span class="zh-inline">需要理解工具链内部机制或平台概念。</span> |
| 🔴 | Advanced<br><span class="zh-inline">高级</span> | Deep toolchain knowledge, nightly features, or multi-tool orchestration<br><span class="zh-inline">涉及深层工具链知识、nightly 特性或多工具协同。</span> |

### Pacing Guide<br><span class="zh-inline">学习节奏建议</span>

| Part | Chapters | Est. Time | Key Outcome |
|------|----------|:---------:|-------------|
| **I — Build & Ship**<br><span class="zh-inline">第一部分：构建与交付</span> | ch01–02<br><span class="zh-inline">第 1–2 章</span> | 3–4 h<br><span class="zh-inline">3–4 小时</span> | Build metadata, cross-compilation, static binaries<br><span class="zh-inline">掌握构建元数据、交叉编译与静态二进制。</span> |
| **II — Measure & Verify**<br><span class="zh-inline">第二部分：度量与验证</span> | ch03–05<br><span class="zh-inline">第 3–5 章</span> | 4–5 h<br><span class="zh-inline">4–5 小时</span> | Statistical benchmarking, coverage gates, Miri/sanitizers<br><span class="zh-inline">掌握统计型基准测试、覆盖率门禁和 Miri / sanitizer 验证。</span> |
| **III — Harden & Optimize**<br><span class="zh-inline">第三部分：加固与优化</span> | ch06–10<br><span class="zh-inline">第 6–10 章</span> | 6–8 h<br><span class="zh-inline">6–8 小时</span> | Supply chain security, release profiles, compile-time tools, `no_std`, Windows<br><span class="zh-inline">掌握供应链安全、发布配置、编译期工具、`no_std` 和 Windows 相关工程问题。</span> |
| **IV — Integrate**<br><span class="zh-inline">第四部分：集成</span> | ch11–13<br><span class="zh-inline">第 11–13 章</span> | 3–4 h<br><span class="zh-inline">3–4 小时</span> | Production CI/CD pipeline, tricks, capstone exercise<br><span class="zh-inline">掌握生产级 CI/CD 流水线、实战技巧和综合练习。</span> |
| <span class="zh-inline">总计</span> |  | **16–21 h**<br><span class="zh-inline">16–21 小时</span> | **Full production engineering pipeline**<br><span class="zh-inline">建立完整的生产工程能力视角。</span> |

### Working Through Exercises<br><span class="zh-inline">练习建议</span>

Each chapter contains **🏋️ exercises** with difficulty indicators. Solutions are provided in expandable `<details>` blocks — try the exercise first, then check your work.<br><span class="zh-inline">每一章都带有按难度标记的 **🏋️ 练习**。答案放在可展开的 `<details>` 块里，建议先自己做，再对答案。</span>

- 🟢 exercises can often be done in 10–15 minutes<br><span class="zh-inline">🟢 难度的练习通常 10–15 分钟就能完成。</span>
- 🟡 exercises require 20–40 minutes and may involve running tools locally<br><span class="zh-inline">🟡 难度的练习一般需要 20–40 分钟，并且可能要在本地真正跑工具。</span>
- 🔴 exercises require significant setup and experimentation (1+ hour)<br><span class="zh-inline">🔴 难度的练习往往需要较多前置环境和实验时间，可能超过 1 小时。</span>

## Prerequisites<br><span class="zh-inline">前置知识</span>

| Concept | Where to learn it |
|---------|-------------------|
| Cargo workspace layout<br><span class="zh-inline">Cargo 工作区结构</span> | [Rust Book ch14.3](https://doc.rust-lang.org/book/ch14-03-cargo-workspaces.html) |
| Feature flags<br><span class="zh-inline">特性开关</span> | [Cargo Reference — Features](https://doc.rust-lang.org/cargo/reference/features.html) |
| `#[cfg(test)]` and basic testing<br><span class="zh-inline">`#[cfg(test)]` 与基础测试</span> | Rust Patterns ch12<br><span class="zh-inline">可参考 Rust Patterns 第 12 章。</span> |
| `unsafe` blocks and FFI basics<br><span class="zh-inline">`unsafe` 代码块与 FFI 基础</span> | Rust Patterns ch10<br><span class="zh-inline">可参考 Rust Patterns 第 10 章。</span> |

## Chapter Dependency Map<br><span class="zh-inline">章节依赖图</span>

```text
                 ┌──────────┐
                 │ ch00     │
                 │  Intro   │
                 └────┬─────┘
        ┌─────┬───┬──┴──┬──────┬──────┐
        ▼     ▼   ▼     ▼      ▼      ▼
      ch01  ch03 ch04  ch05   ch06   ch09
      Build Bench Cov  Miri   Deps   no_std
        │     │    │    │      │      │
        │     └────┴────┘      │      ▼
        │          │           │    ch10
        ▼          ▼           ▼   Windows
       ch02      ch07        ch07    │
       Cross    RelProf     RelProf  │
        │          │           │     │
        │          ▼           │     │
        │        ch08          │     │
        │      CompTime        │     │
        └──────────┴───────────┴─────┘
                   │
                   ▼
                 ch11
               CI/CD Pipeline
                   │
                   ▼
                ch12 ─── ch13
              Tricks    Quick Ref
```

**Read in any order**: ch01, ch03, ch04, ch05, ch06, ch09 are independent.<br><span class="zh-inline">**可以按任意顺序阅读的章节**：ch01、ch03、ch04、ch05、ch06、ch09，这几章相对独立。</span>
**Read after prerequisites**: ch02 (needs ch01), ch07–ch08 (benefit from ch03–ch06), ch10 (benefits from ch09).<br><span class="zh-inline">**建议有前置再读的章节**：ch02 依赖 ch01；ch07–ch08 读过 ch03–ch06 会更顺；ch10 最好建立在 ch09 基础上。</span>
**Read last**: ch11 (ties everything together), ch12 (tricks), ch13 (reference).<br><span class="zh-inline">**适合放到最后读的章节**：ch11 负责把前面全部串起来，ch12 是经验技巧，ch13 是查阅手册。</span>

## Annotated Table of Contents<br><span class="zh-inline">带说明的目录总览</span>

### Part I — Build & Ship<br><span class="zh-inline">第一部分：构建与交付</span>

| # | Chapter | Difficulty | Description |
|---|---------|:----------:|-------------|
| 1 | [Build Scripts — `build.rs` in Depth](ch01-build-scripts-buildrs-in-depth.md)<br><span class="zh-inline">构建脚本：深入理解 `build.rs`</span> | 🟢 | Compile-time constants, compiling C code, protobuf generation, system library linking, anti-patterns<br><span class="zh-inline">涵盖编译期常量、C 代码编译、protobuf 生成、系统库链接，以及常见反模式。</span> |
| 2 | [Cross-Compilation — One Source, Many Targets](ch02-cross-compilation-one-source-many-target.md)<br><span class="zh-inline">交叉编译：一套源码，多种目标</span> | 🟡 | Target triples, musl static binaries, ARM cross-compile, `cross` tool, `cargo-zigbuild`, GitHub Actions<br><span class="zh-inline">涵盖 target triple、musl 静态二进制、ARM 交叉编译、`cross`、`cargo-zigbuild` 与 GitHub Actions。</span> |

### Part II — Measure & Verify<br><span class="zh-inline">第二部分：度量与验证</span>

| # | Chapter | Difficulty | Description |
|---|---------|:----------:|-------------|
| 3 | [Benchmarking — Measuring What Matters](ch03-benchmarking-measuring-what-matters.md)<br><span class="zh-inline">基准测试：衡量真正重要的东西</span> | 🟡 | Criterion.rs, Divan, `perf` flamegraphs, PGO, continuous benchmarking in CI<br><span class="zh-inline">涵盖 Criterion.rs、Divan、`perf` 火焰图、PGO 与 CI 中的持续基准测试。</span> |
| 4 | [Code Coverage — Seeing What Tests Miss](ch04-code-coverage-seeing-what-tests-miss.md)<br><span class="zh-inline">代码覆盖率：看见测试遗漏的部分</span> | 🟢 | `cargo-llvm-cov`, `cargo-tarpaulin`, `grcov`, Codecov/Coveralls CI integration<br><span class="zh-inline">涵盖 `cargo-llvm-cov`、`cargo-tarpaulin`、`grcov`，以及与 Codecov / Coveralls 的集成。</span> |
| 5 | [Miri, Valgrind, and Sanitizers](ch05-miri-valgrind-and-sanitizers-verifying-u.md)<br><span class="zh-inline">Miri、Valgrind 与 Sanitizer</span> | 🔴 | MIR interpreter, Valgrind memcheck/Helgrind, ASan/MSan/TSan, cargo-fuzz, loom<br><span class="zh-inline">涵盖 MIR 解释器、Valgrind 的 memcheck / Helgrind、ASan / MSan / TSan，以及 cargo-fuzz 与 loom。</span> |

### Part III — Harden & Optimize<br><span class="zh-inline">第三部分：加固与优化</span>

| # | Chapter | Difficulty | Description |
|---|---------|:----------:|-------------|
| 6 | [Dependency Management and Supply Chain Security](ch06-dependency-management-and-supply-chain-s.md)<br><span class="zh-inline">依赖管理与供应链安全</span> | 🟢 | `cargo-audit`, `cargo-deny`, `cargo-vet`, `cargo-outdated`, `cargo-semver-checks`<br><span class="zh-inline">涵盖 `cargo-audit`、`cargo-deny`、`cargo-vet`、`cargo-outdated` 与 `cargo-semver-checks`。</span> |
| 7 | [Release Profiles and Binary Size](ch07-release-profiles-and-binary-size.md)<br><span class="zh-inline">发布配置与二进制体积</span> | 🟡 | Release profile anatomy, LTO trade-offs, `cargo-bloat`, `cargo-udeps`<br><span class="zh-inline">涵盖发布配置结构、LTO 取舍、`cargo-bloat` 与 `cargo-udeps`。</span> |
| 8 | [Compile-Time and Developer Tools](ch08-compile-time-and-developer-tools.md)<br><span class="zh-inline">编译期与开发者工具</span> | 🟡 | `sccache`, `mold`, `cargo-nextest`, `cargo-expand`, `cargo-geiger`, workspace lints, MSRV<br><span class="zh-inline">涵盖 `sccache`、`mold`、`cargo-nextest`、`cargo-expand`、`cargo-geiger`、工作区 lint 与 MSRV。</span> |
| 9 | [`no_std` and Feature Verification](ch09-no-std-and-feature-verification.md)<br><span class="zh-inline">`no_std` 与特性验证</span> | 🔴 | `cargo-hack`, `core`/`alloc`/`std` layers, custom panic handlers, testing `no_std` code<br><span class="zh-inline">涵盖 `cargo-hack`、`core` / `alloc` / `std` 分层、自定义 panic handler，以及 `no_std` 代码测试。</span> |
| 10 | [Windows and Conditional Compilation](ch10-windows-and-conditional-compilation.md)<br><span class="zh-inline">Windows 与条件编译</span> | 🟡 | `#[cfg]` patterns, `windows-sys`/`windows` crates, `cargo-xwin`, platform abstraction<br><span class="zh-inline">涵盖 `#[cfg]` 模式、`windows-sys` / `windows` crate、`cargo-xwin` 与平台抽象。</span> |

### Part IV — Integrate<br><span class="zh-inline">第四部分：集成</span>

| # | Chapter | Difficulty | Description |
|---|---------|:----------:|-------------|
| 11 | [Putting It All Together — A Production CI/CD Pipeline](ch11-putting-it-all-together-a-production-cic.md)<br><span class="zh-inline">全部整合：生产级 CI/CD 流水线</span> | 🟡 | GitHub Actions workflow, `cargo-make`, pre-commit hooks, `cargo-dist`, capstone<br><span class="zh-inline">涵盖 GitHub Actions 工作流、`cargo-make`、pre-commit hook、`cargo-dist` 与综合练习。</span> |
| 12 | [Tricks from the Trenches](ch12-tricks-from-the-trenches.md)<br><span class="zh-inline">一线实战技巧</span> | 🟡 | 10 battle-tested patterns: `deny(warnings)` trap, cache tuning, dep dedup, RUSTFLAGS, more<br><span class="zh-inline">收录 10 个经实战验证的模式，包括 `deny(warnings)` 陷阱、缓存调优、依赖去重、RUSTFLAGS 等。</span> |
| 13 | [Quick Reference Card](ch13-quick-reference-card.md)<br><span class="zh-inline">快速参考卡片</span> | — | Commands at a glance, 60+ decision table entries, further reading links<br><span class="zh-inline">整理常用命令、60 多条决策表项以及延伸阅读链接。</span> |
