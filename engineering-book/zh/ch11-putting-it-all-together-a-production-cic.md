# Putting It All Together — A Production CI/CD Pipeline 🟡<br><span class="zh-inline">全部整合：生产级 CI/CD 流水线 🟡</span>

> **What you'll learn:**<br><span class="zh-inline">**本章将学到什么：**</span>
> - Structuring a multi-stage GitHub Actions CI workflow (check → test → coverage → security → cross → release)<br><span class="zh-inline">如何组织多阶段 GitHub Actions CI 流程：check → test → coverage → security → cross → release</span>
> - Caching strategies with `rust-cache` and `save-if` tuning<br><span class="zh-inline">如何用 `rust-cache` 和 `save-if` 做缓存调优</span>
> - Running Miri and sanitizers on a nightly schedule<br><span class="zh-inline">如何通过 nightly 定时任务运行 Miri 和 sanitizer</span>
> - Task automation with `Makefile.toml` and pre-commit hooks<br><span class="zh-inline">如何用 `Makefile.toml` 和 pre-commit hook 自动化任务</span>
> - Automated releases with `cargo-dist`<br><span class="zh-inline">如何用 `cargo-dist` 自动产出发布包</span>
>
> **Cross-references:** [Build Scripts](ch01-build-scripts-buildrs-in-depth.md) · [Cross-Compilation](ch02-cross-compilation-one-source-many-target.md) · [Benchmarking](ch03-benchmarking-measuring-what-matters.md) · [Coverage](ch04-code-coverage-seeing-what-tests-miss.md) · [Miri/Sanitizers](ch05-miri-valgrind-and-sanitizers-verifying-u.md) · [Dependencies](ch06-dependency-management-and-supply-chain-s.md) · [Release Profiles](ch07-release-profiles-and-binary-size.md) · [Compile-Time Tools](ch08-compile-time-and-developer-tools.md) · [`no_std`](ch09-no-std-and-feature-verification.md) · [Windows](ch10-windows-and-conditional-compilation.md)<br><span class="zh-inline">**交叉阅读：** 这一章基本把前面 1 到 10 章的内容全串起来了：构建脚本、交叉编译、benchmark、覆盖率、Miri 与 sanitizer、依赖治理、发布配置、编译期工具、`no_std` 和 Windows 支持，都会在这里汇总成一条完整流水线。</span>

Individual tools are useful. A pipeline that orchestrates them automatically on every push is transformative. This chapter assembles the tools from chapters 1–10 into a cohesive CI/CD workflow.<br><span class="zh-inline">单个工具当然有用，但真正产生质变的是：每次推送都能自动把这些工具串起来跑一遍的流水线。本章就是把前面 1 到 10 章的工具整合成一套完整的 CI/CD 体系。</span>

### The Complete GitHub Actions Workflow<br><span class="zh-inline">完整的 GitHub Actions 工作流</span>

A single workflow file that runs all verification stages in parallel:<br><span class="zh-inline">下面是一份单文件工作流，它会把各个验证阶段拆开并行跑。</span>

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  CARGO_TERM_COLOR: always
  CARGO_ENCODED_RUSTFLAGS: "-Dwarnings"  # Treat warnings as errors (top-level crate only)
  # NOTE: Unlike RUSTFLAGS, CARGO_ENCODED_RUSTFLAGS does not affect build scripts
  # or proc-macros, which avoids false failures from third-party warnings.
  # Use RUSTFLAGS="-Dwarnings" instead if you want to enforce on build scripts too.

jobs:
  # ─── Stage 1: Fast feedback (< 2 min) ───
  check:
    name: Check + Clippy + Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt

      - uses: Swatinem/rust-cache@v2  # Cache dependencies

      - name: Check compilation
        run: cargo check --workspace --all-targets --all-features

      - name: Check Cargo.lock
        run: cargo fetch --locked

      - name: Check doc
        run: RUSTDOCFLAGS='-Dwarnings' cargo doc --workspace --all-features --no-deps

      - name: Clippy lints
        run: cargo clippy --workspace --all-targets --all-features -- -D warnings

      - name: Formatting
        run: cargo fmt --all -- --check

  # ─── Stage 2: Tests (< 5 min) ───
  test:
    name: Test (${{ matrix.os }})
    needs: check
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2

      - name: Run tests
        run: cargo test --workspace

      - name: Run doc tests
        run: cargo test --workspace --doc

  # ─── Stage 3: Cross-compilation (< 10 min) ───
  cross:
    name: Cross (${{ matrix.target }})
    needs: check
    strategy:
      matrix:
        include:
          - target: x86_64-unknown-linux-musl
            os: ubuntu-latest
          - target: aarch64-unknown-linux-gnu
            os: ubuntu-latest
            use_cross: true
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install musl-tools
        if: contains(matrix.target, 'musl')
        run: sudo apt-get install -y musl-tools

      - name: Install cross
        if: matrix.use_cross
        uses: taiki-e/install-action@cross

      - name: Build (native)
        if: "!matrix.use_cross"
        run: cargo build --release --target ${{ matrix.target }}

      - name: Build (cross)
        if: matrix.use_cross
        run: cross build --release --target ${{ matrix.target }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: binary-${{ matrix.target }}
          path: target/${{ matrix.target }}/release/diag_tool

  # ─── Stage 4: Coverage (< 10 min) ───
  coverage:
    name: Code Coverage
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: llvm-tools-preview
      - uses: taiki-e/install-action@cargo-llvm-cov

      - name: Generate coverage
        run: cargo llvm-cov --workspace --lcov --output-path lcov.info

      - name: Enforce minimum coverage
        run: cargo llvm-cov --workspace --fail-under-lines 75

      - name: Upload to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: lcov.info
          token: ${{ secrets.CODECOV_TOKEN }}

  # ─── Stage 5: Safety verification (< 15 min) ───
  miri:
    name: Miri
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@nightly
        with:
          components: miri

      - name: Run Miri
        run: cargo miri test --workspace
        env:
          MIRIFLAGS: "-Zmiri-backtrace=full"

  # ─── Stage 6: Benchmarks (PR only, < 10 min) ───
  bench:
    name: Benchmarks
    if: github.event_name == 'pull_request'
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable

      - name: Run benchmarks
        run: cargo bench -- --output-format bencher | tee bench.txt

      - name: Compare with baseline
        uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'cargo'
          output-file-path: bench.txt
          github-token: ${{ secrets.GITHUB_TOKEN }}
          alert-threshold: '115%'
          comment-on-alert: true
```

**Pipeline execution flow:**<br><span class="zh-inline">**流水线执行结构：**</span>

```text
                    ┌─────────┐
                    │  check  │  ← clippy + fmt + cargo check (2 min)
                    └────┬────┘
           ┌─────────┬──┴──┬──────────┬──────────┐
           ▼         ▼     ▼          ▼          ▼
       ┌──────┐  ┌──────┐ ┌────────┐ ┌──────┐ ┌──────┐
       │ test │  │cross │ │coverage│ │ miri │ │bench │
       │ (2×) │  │ (2×) │ │        │ │      │ │(PR)  │
       └──────┘  └──────┘ └────────┘ └──────┘ └──────┘
         3 min    8 min     8 min     12 min    5 min
                                                        
Total wall-clock: ~14 min (parallel after check gate)
```

The total wall-clock time is around 14 minutes because everything after `check` runs in parallel.<br><span class="zh-inline">整条流水线的总墙钟时间大约是 14 分钟，原因很简单：`check` 之后的阶段都在并行执行。</span>

### CI Caching Strategies<br><span class="zh-inline">CI 缓存策略</span>

[`Swatinem/rust-cache@v2`](https://github.com/Swatinem/rust-cache) is the standard Rust CI cache action. It caches `~/.cargo` and `target/` between runs, but large workspaces need tuning:<br><span class="zh-inline">[`Swatinem/rust-cache@v2`](https://github.com/Swatinem/rust-cache) 基本就是 Rust CI 缓存的标准动作。它会缓存 `~/.cargo` 和 `target/`，不过工程一大，参数就得认真调。</span>

```yaml
# Basic (what we use above)
- uses: Swatinem/rust-cache@v2

# Tuned for a large workspace:
- uses: Swatinem/rust-cache@v2
  with:
    # Separate caches per job — prevents test artifacts bloating build cache
    prefix-key: "v1-rust"
    key: ${{ matrix.os }}-${{ matrix.target || 'default' }}
    # Only save cache on main branch (PRs read but don't write)
    save-if: ${{ github.ref == 'refs/heads/main' }}
    # Cache Cargo registry + git checkouts + target dir
    cache-targets: true
    cache-all-crates: true
```

**Cache invalidation gotchas:**<br><span class="zh-inline">**缓存失效与污染的常见坑：**</span>

| Problem<br><span class="zh-inline">问题</span> | Fix<br><span class="zh-inline">处理方式</span> |
|---------|-----|
| Cache grows unbounded (&gt;5 GB)<br><span class="zh-inline">缓存越滚越大，超过 5 GB</span> | Set `prefix-key: "v2-rust"` to force fresh cache<br><span class="zh-inline">升级 `prefix-key`，强制切新缓存。</span> |
| Different features pollute cache<br><span class="zh-inline">不同 feature 共用缓存，互相污染</span> | Use `key: ${{ hashFiles('**/Cargo.lock') }}`<br><span class="zh-inline">把 key 跟锁文件绑定。</span> |
| PR cache overwrites main<br><span class="zh-inline">PR 把主分支缓存覆盖了</span> | Set `save-if: ${{ github.ref == 'refs/heads/main' }}`<br><span class="zh-inline">只允许主分支写缓存。</span> |
| Cross-compilation targets bloat<br><span class="zh-inline">交叉编译目标把缓存撑胖</span> | Use separate `key` per target triple<br><span class="zh-inline">按 target triple 拆 key。</span> |

**Sharing cache between jobs:**<br><span class="zh-inline">**多任务之间怎么共享缓存：**</span>

The `check` job saves the cache; downstream jobs such as `test`、`cross`、`coverage` read it. With `save-if` limited to `main`, PRs can consume cache without writing stale results back.<br><span class="zh-inline">`check` 任务负责把缓存写出来，下游的 `test`、`cross`、`coverage` 直接读它。再配合 `save-if` 只让 `main` 写缓存，就能避免 PR 跑出来一堆过时内容把缓存污染回去。</span>

> **Measured impact on large workspace**: Cold build ~4 min → cached build ~45 sec. The cache action alone can save a huge chunk of CI wall-clock time.<br><span class="zh-inline">**在大型 workspace 里的实际收益** 往往很夸张：冷构建约 4 分钟，热缓存后可能缩到 45 秒左右。光缓存这一项，就足够给整条流水线省下一大截时间。</span>

### Makefile.toml with cargo-make<br><span class="zh-inline">用 `cargo-make` 管理 `Makefile.toml`</span>

[`cargo-make`](https://sagiegurari.github.io/cargo-make/) provides a portable task runner that works across platforms, unlike传统 `make`：<br><span class="zh-inline">[`cargo-make`](https://sagiegurari.github.io/cargo-make/) 提供的是一个跨平台任务运行器，不像传统 `make` 那么依赖系统环境。</span>

```bash
# Install
cargo install cargo-make
```

```toml
# Makefile.toml — at workspace root

[config]
default_to_workspace = false

# ─── Developer workflows ───

[tasks.dev]
description = "Full local verification (same checks as CI)"
dependencies = ["check", "test", "clippy", "fmt-check"]

[tasks.check]
command = "cargo"
args = ["check", "--workspace", "--all-targets"]

[tasks.test]
command = "cargo"
args = ["test", "--workspace"]

[tasks.clippy]
command = "cargo"
args = ["clippy", "--workspace", "--all-targets", "--", "-D", "warnings"]

[tasks.fmt]
command = "cargo"
args = ["fmt", "--all"]

[tasks.fmt-check]
command = "cargo"
args = ["fmt", "--all", "--", "--check"]

# ─── Coverage ───

[tasks.coverage]
description = "Generate HTML coverage report"
install_crate = "cargo-llvm-cov"
command = "cargo"
args = ["llvm-cov", "--workspace", "--html", "--open"]

[tasks.coverage-ci]
description = "Generate LCOV for CI upload"
install_crate = "cargo-llvm-cov"
command = "cargo"
args = ["llvm-cov", "--workspace", "--lcov", "--output-path", "lcov.info"]

# ─── Benchmarks ───

[tasks.bench]
description = "Run all benchmarks"
command = "cargo"
args = ["bench"]

# ─── Cross-compilation ───

[tasks.build-musl]
description = "Build static binary (musl)"
command = "cargo"
args = ["build", "--release", "--target", "x86_64-unknown-linux-musl"]

[tasks.build-arm]
description = "Build for aarch64 (requires cross)"
command = "cross"
args = ["build", "--release", "--target", "aarch64-unknown-linux-gnu"]

[tasks.build-all]
description = "Build for all deployment targets"
dependencies = ["build-musl", "build-arm"]

# ─── Safety verification ───

[tasks.miri]
description = "Run Miri on all tests"
toolchain = "nightly"
command = "cargo"
args = ["miri", "test", "--workspace"]

[tasks.audit]
description = "Check for known vulnerabilities"
install_crate = "cargo-audit"
command = "cargo"
args = ["audit"]

# ─── Release ───

[tasks.release-dry]
description = "Preview what cargo-release would do"
install_crate = "cargo-release"
command = "cargo"
args = ["release", "--workspace", "--dry-run"]
```

**Usage:**<br><span class="zh-inline">**常见用法：**</span>

```bash
# Equivalent of CI pipeline, locally
cargo make dev

# Generate and view coverage
cargo make coverage

# Build for all targets
cargo make build-all

# Run safety checks
cargo make miri

# Check for vulnerabilities
cargo make audit
```

### Pre-Commit Hooks: Custom Scripts and `cargo-husky`<br><span class="zh-inline">Pre-commit hook：自定义脚本与 `cargo-husky`</span>

Catch issues *before* they reach CI. The simplest and most transparent approach is a custom git hook:<br><span class="zh-inline">很多问题完全可以在推到 CI 之前就拦下来。最简单、也最透明的方式，就是自己写一个 git hook。</span>

```bash
#!/bin/sh
# .githooks/pre-commit

set -e

echo "=== Pre-commit checks ==="

# Fast checks first
echo "→ cargo fmt --check"
cargo fmt --all -- --check

echo "→ cargo check"
cargo check --workspace --all-targets

echo "→ cargo clippy"
cargo clippy --workspace --all-targets -- -D warnings

echo "→ cargo test (lib only, fast)"
cargo test --workspace --lib

echo "=== All checks passed ==="
```

```bash
# Install the hook
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

**Alternative: `cargo-husky`** (auto-installs hooks via build script):<br><span class="zh-inline">**替代方案：`cargo-husky`**，它会通过构建脚本自动装 hook。</span>

> ⚠️ **Note**: `cargo-husky` has not been updated since 2022. It still works but is effectively unmaintained. Consider the custom hook approach above for new projects.<br><span class="zh-inline">⚠️ **注意**：`cargo-husky` 从 2022 年之后就几乎没怎么更新了，虽然还能用，但已经接近无人维护。新项目更建议走上面的自定义 hook 路线。</span>

```bash
cargo install cargo-husky
```

```toml
# Cargo.toml — add to dev-dependencies of root crate
[dev-dependencies]
cargo-husky = { version = "1", default-features = false, features = [
    "precommit-hook",
    "run-cargo-check",
    "run-cargo-clippy",
    "run-cargo-fmt",
    "run-cargo-test",
] }
```

### Release Workflow: `cargo-release` and `cargo-dist`<br><span class="zh-inline">发布流程：`cargo-release` 与 `cargo-dist`</span>

**`cargo-release`** — automates version bumping, tagging, and publishing:<br><span class="zh-inline">**`cargo-release`** 负责自动版本提升、打 tag 和发布。</span>

```bash
# Install
cargo install cargo-release
```

```toml
# release.toml — at workspace root
[workspace]
consolidate-commits = true
pre-release-commit-message = "chore: release {{version}}"
tag-message = "v{{version}}"
tag-name = "v{{version}}"

# Don't publish internal crates
[[package]]
name = "core_lib"
release = false

[[package]]
name = "diag_framework"
release = false

# Only publish the main binary
[[package]]
name = "diag_tool"
release = true
```

```bash
# Preview release
cargo release patch --dry-run

# Execute release (bumps version, commits, tags, optionally publishes)
cargo release patch --execute
# 0.1.0 → 0.1.1

cargo release minor --execute
# 0.1.1 → 0.2.0
```

**`cargo-dist`** — generates downloadable release binaries for GitHub Releases:<br><span class="zh-inline">**`cargo-dist`** 负责给 GitHub Releases 生成可下载的发布产物。</span>

```bash
# Install
cargo install cargo-dist

# Initialize (creates CI workflow + metadata)
cargo dist init

# Preview what would be built
cargo dist plan

# Generate the release (usually done by CI on tag push)
cargo dist build
```

```toml
# Cargo.toml additions from `cargo dist init`
[workspace.metadata.dist]
cargo-dist-version = "0.28.0"
ci = "github"
targets = [
    "x86_64-unknown-linux-gnu",
    "x86_64-unknown-linux-musl",
    "aarch64-unknown-linux-gnu",
    "x86_64-pc-windows-msvc",
]
install-path = "CARGO_HOME"
```

This generates a GitHub Actions workflow that, on tag push:<br><span class="zh-inline">它会生成一条在 tag push 时自动触发的工作流，通常会做这些事：</span>

1. Builds the binary for all target platforms<br><span class="zh-inline">1. 为所有目标平台构建二进制。</span>
2. Creates a GitHub Release with downloadable `.tar.gz` / `.zip` archives<br><span class="zh-inline">2. 创建 GitHub Release，并附上可下载的 `.tar.gz` 或 `.zip` 包。</span>
3. Generates shell/PowerShell installer scripts<br><span class="zh-inline">3. 生成 shell 与 PowerShell 安装脚本。</span>
4. Publishes to crates.io (if configured)<br><span class="zh-inline">4. 如果配置了，还能顺手发布到 crates.io。</span>

### Try It Yourself — Capstone Exercise<br><span class="zh-inline">动手试一试：综合练习</span>

This exercise ties together every chapter. You will build a complete engineering pipeline for a fresh Rust workspace:<br><span class="zh-inline">这个练习会把整本书前面的内容全串起来。目标是给一个全新的 Rust workspace 搭一条完整工程流水线。</span>

1. **Create a new workspace** with two crates: a library (`core_lib`) and a binary (`cli`). Add a `build.rs` that embeds the git hash and build timestamp using `SOURCE_DATE_EPOCH`.<br><span class="zh-inline">1. **新建 workspace**，包含一个库 `core_lib` 和一个二进制 `cli`。补一个 `build.rs`，用 `SOURCE_DATE_EPOCH` 把 git hash 和构建时间嵌进产物。</span>

2. **Set up cross-compilation** for `x86_64-unknown-linux-musl` and `aarch64-unknown-linux-gnu`. Verify both targets build with `cargo zigbuild` or `cross`.<br><span class="zh-inline">2. **配置交叉编译**，支持 `x86_64-unknown-linux-musl` 与 `aarch64-unknown-linux-gnu`，并用 `cargo zigbuild` 或 `cross` 验证两边都能编过。</span>

3. **Add a benchmark** using Criterion or Divan for a function in `core_lib`. Run it locally and record a baseline.<br><span class="zh-inline">3. **补一个 benchmark**，给 `core_lib` 里的函数用 Criterion 或 Divan 做基准测试，并记录基线结果。</span>

4. **Measure code coverage** with `cargo llvm-cov`. Set a minimum threshold of 80% and verify it passes.<br><span class="zh-inline">4. **测代码覆盖率**，用 `cargo llvm-cov`，把阈值设成 80%，确认它能通过。</span>

5. **Run `cargo +nightly careful test` and `cargo miri test`**. Add a test that exercises `unsafe` code if present.<br><span class="zh-inline">5. **运行 `cargo +nightly careful test` 和 `cargo miri test`**。如果代码里有 `unsafe`，补一个覆盖它的测试。</span>

6. **Configure `cargo-deny`** with a `deny.toml` that bans `openssl` and enforces MIT/Apache-2.0 licensing.<br><span class="zh-inline">6. **配置 `cargo-deny`**，准备一个 `deny.toml`，禁止 `openssl`，并强制只接受 MIT/Apache-2.0 许可。</span>

7. **Optimize the release profile** with `lto = "thin"`、`strip = true`、`codegen-units = 1`. Measure binary size before and after with `cargo bloat`.<br><span class="zh-inline">7. **优化 release profile**，加入 `lto = "thin"`、`strip = true`、`codegen-units = 1`，然后用 `cargo bloat` 对比前后体积。</span>

8. **Add `cargo hack --each-feature`** verification. Create a feature flag for an optional dependency and ensure it compiles alone.<br><span class="zh-inline">8. **加入 `cargo hack --each-feature`** 验证。给一个可选依赖做 feature flag，确认它单独打开时也能编过。</span>

9. **Write the GitHub Actions workflow** with all 6 stages. Add `Swatinem/rust-cache@v2` with `save-if` tuning.<br><span class="zh-inline">9. **写完整的 GitHub Actions 工作流**，把前面提到的 6 个阶段都接进去，再配上 `Swatinem/rust-cache@v2` 和 `save-if` 调优。</span>

**Success criteria**: Push to GitHub → all CI stages green → `cargo dist plan` shows your release targets. At that point, the workspace already has a real production-grade pipeline.<br><span class="zh-inline">**完成标准**：推到 GitHub 之后，所有 CI 阶段都变绿，`cargo dist plan` 也能列出发布目标。做到这里，就已经是一条像模像样的生产级 Rust 工程流水线了。</span>

### CI Pipeline Architecture<br><span class="zh-inline">CI 流水线架构图</span>

```mermaid
flowchart LR
    subgraph "Stage 1 — Fast Feedback < 2 min"
        CHECK["cargo check\ncargo clippy\ncargo fmt"]
    end
    
    subgraph "Stage 2 — Tests < 5 min"
        TEST["cargo nextest\ncargo test --doc"]
    end
    
    subgraph "Stage 3 — Coverage"
        COV["cargo llvm-cov\nfail-under 80%"]
    end
    
    subgraph "Stage 4 — Security"
        SEC["cargo audit\ncargo deny check"]
    end
    
    subgraph "Stage 5 — Cross-Build"
        CROSS["musl static\naarch64 + x86_64"]
    end
    
    subgraph "Stage 6 — Release (tag only)"
        REL["cargo dist\nGitHub Release"]
    end
    
    CHECK --> TEST --> COV --> SEC --> CROSS --> REL
    
    style CHECK fill:#91e5a3,color:#000
    style TEST fill:#91e5a3,color:#000
    style COV fill:#e3f2fd,color:#000
    style SEC fill:#ffd43b,color:#000
    style CROSS fill:#e3f2fd,color:#000
    style REL fill:#b39ddb,color:#000
```

### Key Takeaways<br><span class="zh-inline">本章要点</span>

- Structure CI as parallel stages: fast checks first, expensive jobs behind gates<br><span class="zh-inline">CI 最好拆成并行阶段：先放快速检查，再把更重的任务挂在后面。</span>
- `Swatinem/rust-cache@v2` with `save-if: ${{ github.ref == 'refs/heads/main' }}` prevents PR cache thrashing<br><span class="zh-inline">`Swatinem/rust-cache@v2` 配上 `save-if` 限制主分支写缓存，能减少 PR 把缓存搅乱。</span>
- Run Miri and heavier sanitizers on a nightly `schedule:` trigger, not on every push<br><span class="zh-inline">Miri 和更重的 sanitizer 更适合放到 nightly 定时任务里，不适合每次推送都跑。</span>
- `Makefile.toml` (`cargo make`) bundles multi-tool workflows into a single command for local dev<br><span class="zh-inline">`Makefile.toml` 配合 `cargo make`，可以把本地一长串工具命令收成一个入口。</span>
- `cargo-dist` automates cross-platform release builds — stop writing platform matrix YAML by hand<br><span class="zh-inline">`cargo-dist` 可以自动化跨平台发布构建，很多手写矩阵 YAML 的苦活都能省掉。</span>

---
