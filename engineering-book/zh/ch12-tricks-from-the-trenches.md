# Tricks from the Trenches 🟡<br><span class="zh-inline">一线实践技巧 🟡</span>

> **What you'll learn:**<br><span class="zh-inline">**本章将学到什么：**</span>
> - Battle-tested patterns that don't fit neatly into one chapter<br><span class="zh-inline">那些很实战、但又不适合单独塞进某一章的经验模式</span>
> - Common pitfalls and their fixes — from CI flake to binary bloat<br><span class="zh-inline">常见坑以及对应修法，从 CI 抖动到二进制膨胀都会覆盖</span>
> - Quick-win techniques you can apply to any Rust project today<br><span class="zh-inline">今天就能加到任意 Rust 项目里的高收益技巧</span>
>
> **Cross-references:** Every chapter in this book — these tricks cut across all topics<br><span class="zh-inline">**交叉引用：** 本书所有章节。这一章里的技巧基本横跨了整本书的主题。</span>

This chapter collects engineering patterns that come up repeatedly in production Rust codebases. Each trick is self-contained — read them in any order.<br><span class="zh-inline">这一章收集的是生产 Rust 代码库里反复出现的工程经验。每一条技巧都是独立的，阅读顺序随意，不用死磕线性顺序。</span>

---

### 1. The `deny(warnings)` Trap<br><span class="zh-inline">1. `deny(warnings)` 陷阱</span>

**Problem**: `#![deny(warnings)]` in source code breaks builds when Clippy adds new lints — your code that compiled yesterday fails today.<br><span class="zh-inline">**问题**：把 `#![deny(warnings)]` 直接写进源码后，只要 Clippy 新增了 lint，昨天还能编译的代码今天就可能直接挂掉。</span>

**Fix**: Use `CARGO_ENCODED_RUSTFLAGS` in CI instead of a source-level attribute:<br><span class="zh-inline">**修法**：把控制权放到 CI 里，用 `CARGO_ENCODED_RUSTFLAGS`，别把这玩意硬写死在源码层面。</span>

```yaml
# CI: treat warnings as errors without touching source
# CI：把 warning 当错误，但不改源码
env:
  CARGO_ENCODED_RUSTFLAGS: "-Dwarnings"
```

Or use `[workspace.lints]` for finer control:<br><span class="zh-inline">如果想要更细的控制，也可以用 `[workspace.lints]`：</span>

```toml
# Cargo.toml
[workspace.lints.rust]
unsafe_code = "deny"

[workspace.lints.clippy]
all = { level = "deny", priority = -1 }
pedantic = { level = "warn", priority = -1 }
```

> See [Compile-Time Tools, Workspace Lints](ch08-compile-time-and-developer-tools.md) for the full pattern.<br><span class="zh-inline">完整模式见 [编译期工具与工作区 Lint](ch08-compile-time-and-developer-tools.md)。</span>

---

### 2. Compile Once, Test Everywhere<br><span class="zh-inline">2. 编一次，到处测</span>

**Problem**: `cargo test` recompiles when switching between `--lib`, `--doc`, and `--test` because they use different profiles.<br><span class="zh-inline">**问题**：`cargo test` 在 `--lib`、`--doc`、`--test` 之间来回切时会重新编译，因为它们走的是不同 profile。</span>

**Fix**: Use `cargo nextest` for unit/integration tests and run doc-tests separately:<br><span class="zh-inline">**修法**：单元测试和集成测试交给 `cargo nextest`，文档测试单独跑。</span>

```bash
cargo nextest run --workspace        # Fast: parallel, cached
                                     # 快：并行执行，而且缓存利用更好
cargo test --workspace --doc         # Doc-tests (nextest can't run these)
                                     # 文档测试，nextest 目前跑不了这类
```

> See [Compile-Time Tools](ch08-compile-time-and-developer-tools.md) for `cargo-nextest` setup.<br><span class="zh-inline">`cargo-nextest` 的完整配置见 [编译期工具](ch08-compile-time-and-developer-tools.md)。</span>

---

### 3. Feature Flag Hygiene<br><span class="zh-inline">3. Feature Flag 卫生</span>

**Problem**: A library crate has `default = ["std"]` but nobody tests `--no-default-features`. One day an embedded user reports it doesn't compile.<br><span class="zh-inline">**问题**：库 crate 默认开了 `default = ["std"]`，但从来没人测过 `--no-default-features`。某天嵌入式用户一跑，发现根本编不过。</span>

**Fix**: Add `cargo-hack` to CI:<br><span class="zh-inline">**修法**：把 `cargo-hack` 放进 CI。</span>

```yaml
- name: Feature matrix
  run: |
    cargo hack check --each-feature --no-dev-deps
    cargo check --no-default-features
    cargo check --all-features
```

> See [`no_std` and Feature Verification](ch09-no-std-and-feature-verification.md) for the full pattern.<br><span class="zh-inline">完整模式见 [`no_std` 与 Feature 验证](ch09-no-std-and-feature-verification.md)。</span>

---

### 4. The Lock File Debate — Commit or Ignore?<br><span class="zh-inline">4. `Cargo.lock` 之争：提交还是忽略？</span>

**Rule of thumb:**<br><span class="zh-inline">**经验规则：**</span>

| Crate Type | Commit `Cargo.lock`? | Why |
|------------|---------------------|-----|
| Binary / application<br><span class="zh-inline">二进制 / 应用</span> | **Yes**<br><span class="zh-inline">**是**</span> | Reproducible builds<br><span class="zh-inline">保证可复现构建</span> |
| Library<br><span class="zh-inline">库</span> | **No** (`.gitignore`)<br><span class="zh-inline">**否**，放进 `.gitignore`</span> | Let downstream choose versions<br><span class="zh-inline">把版本选择权交给下游</span> |
| Workspace with both<br><span class="zh-inline">两者混合的 workspace</span> | **Yes**<br><span class="zh-inline">**是**</span> | Binary wins<br><span class="zh-inline">以二进制项目需求为准</span> |

Add a CI check to ensure the lock file stays up-to-date:<br><span class="zh-inline">还可以在 CI 里加一道检查，确保 lock 文件始终是新的：</span>

```yaml
- name: Check lock file
  run: cargo update --locked  # Fails if Cargo.lock is stale
```

---

### 5. Debug Builds with Optimized Dependencies<br><span class="zh-inline">5. 让 Debug 构建里的依赖也带优化</span>

**Problem**: Debug builds are painfully slow because dependencies (especially `serde`, `regex`) aren't optimized.<br><span class="zh-inline">**问题**：Debug 构建跑起来慢得要命，因为依赖，尤其是 `serde`、`regex` 这类库，在 dev profile 下没做优化。</span>

**Fix**: Optimize deps in dev profile while keeping your code unoptimized for fast recompilation:<br><span class="zh-inline">**修法**：在 dev profile 里只优化依赖，而自身代码依然保持低优化，兼顾运行速度和重编译速度。</span>

```toml
# Cargo.toml
[profile.dev.package."*"]
opt-level = 2  # Optimize all dependencies in dev mode
               # 在 dev 模式下优化全部依赖
```

This slows the first build slightly but makes runtime dramatically faster during development. Particularly impactful for database-backed services and parsers.<br><span class="zh-inline">这样会让第一次构建稍微慢一点，但开发阶段的运行速度通常会明显提升。对数据库服务和解析器这类项目尤其有感。</span>

> See [Release Profiles](ch07-release-profiles-and-binary-size.md) for per-crate profile overrides.<br><span class="zh-inline">按 crate 粒度覆盖 profile 的方式见 [发布配置与二进制体积](ch07-release-profiles-and-binary-size.md)。</span>

---

### 6. CI Cache Thrashing<br><span class="zh-inline">6. CI 缓存来回抖动</span>

**Problem**: `Swatinem/rust-cache@v2` saves a new cache on every PR, bloating storage and slowing restore times.<br><span class="zh-inline">**问题**：`Swatinem/rust-cache@v2` 如果每个 PR 都写一份新缓存，会让存储迅速膨胀，恢复速度也越来越慢。</span>

**Fix**: Only save cache from `main`, restore from anywhere:<br><span class="zh-inline">**修法**：只允许 `main` 分支回写缓存，其它分支只恢复不保存。</span>

```yaml
- uses: Swatinem/rust-cache@v2
  with:
    save-if: ${{ github.ref == 'refs/heads/main' }}
```

For workspaces with multiple binaries, add a `shared-key`:<br><span class="zh-inline">如果 workspace 里有多个二进制目标，再补一个 `shared-key`：</span>

```yaml
- uses: Swatinem/rust-cache@v2
  with:
    shared-key: "ci-${{ matrix.target }}"
    save-if: ${{ github.ref == 'refs/heads/main' }}
```

> See [CI/CD Pipeline](ch11-putting-it-all-together-a-production-cic.md) for the full workflow.<br><span class="zh-inline">完整工作流见 [CI/CD 流水线](ch11-putting-it-all-together-a-production-cic.md)。</span>

---

### 7. `RUSTFLAGS` vs `CARGO_ENCODED_RUSTFLAGS`<br><span class="zh-inline">7. `RUSTFLAGS` 和 `CARGO_ENCODED_RUSTFLAGS` 的区别</span>

**Problem**: `RUSTFLAGS="-Dwarnings"` applies to *everything* — including build scripts and proc-macros. A warning in `serde_derive`'s build.rs fails your CI.<br><span class="zh-inline">**问题**：`RUSTFLAGS="-Dwarnings"` 会作用到 *所有东西*，包括构建脚本和过程宏。结果第三方依赖里一条 warning，就能把 CI 直接弄死。</span>

**Fix**: Use `CARGO_ENCODED_RUSTFLAGS` which only applies to the top-level crate:<br><span class="zh-inline">**修法**：改用 `CARGO_ENCODED_RUSTFLAGS`，它只会作用到顶层 crate。</span>

```bash
# BAD — breaks on third-party build script warnings
RUSTFLAGS="-Dwarnings" cargo build

# GOOD — only affects your crate
CARGO_ENCODED_RUSTFLAGS="-Dwarnings" cargo build

# ALSO GOOD — workspace lints (Cargo.toml)
[workspace.lints.rust]
warnings = "deny"
```

---

### 8. Reproducible Builds with `SOURCE_DATE_EPOCH`<br><span class="zh-inline">8. 用 `SOURCE_DATE_EPOCH` 做可复现构建</span>

**Problem**: Embedding `chrono::Utc::now()` in `build.rs` makes builds non-reproducible — every build produces a different binary hash.<br><span class="zh-inline">**问题**：如果在 `build.rs` 里直接塞 `chrono::Utc::now()`，每次构建产物都会带不同时间戳，二进制哈希自然也次次不同。</span>

**Fix**: Honor `SOURCE_DATE_EPOCH`:<br><span class="zh-inline">**修法**：优先尊重 `SOURCE_DATE_EPOCH`。</span>

```rust
// build.rs
let timestamp = std::env::var("SOURCE_DATE_EPOCH")
    .ok()
    .and_then(|s| s.parse::<i64>().ok())
    .unwrap_or_else(|| chrono::Utc::now().timestamp());
println!("cargo:rustc-env=BUILD_TIMESTAMP={timestamp}");
```

> See [Build Scripts](ch01-build-scripts-buildrs-in-depth.md) for the full build.rs patterns.<br><span class="zh-inline">更完整的 `build.rs` 模式见 [构建脚本](ch01-build-scripts-buildrs-in-depth.md)。</span>

---

### 9. The `cargo tree` Deduplication Workflow<br><span class="zh-inline">9. `cargo tree` 去重工作流</span>

**Problem**: `cargo tree --duplicates` shows 5 versions of `syn` and 3 of `tokio-util`. Compile time is painful.<br><span class="zh-inline">**问题**：`cargo tree --duplicates` 一看，`syn` 有 5 个版本，`tokio-util` 有 3 个版本，编译时间自然长得离谱。</span>

**Fix**: Systematic deduplication:<br><span class="zh-inline">**修法**：按步骤系统去重。</span>

```bash
# Step 1: Find duplicates
cargo tree --duplicates

# Step 2: Find who pulls the old version
cargo tree --invert --package syn@1.0.109

# Step 3: Update the culprit
cargo update -p serde_derive  # Might pull in syn 2.x

# Step 4: If no update available, pin in [patch]
# [patch.crates-io]
# old-crate = { git = "...", branch = "syn2-migration" }

# Step 5: Verify
cargo tree --duplicates  # Should be shorter
```

> See [Dependency Management](ch06-dependency-management-and-supply-chain-s.md) for `cargo-deny` and supply chain security.<br><span class="zh-inline">依赖治理和供应链安全可继续看 [依赖管理](ch06-dependency-management-and-supply-chain-s.md)。</span>

---

### 10. Pre-Push Smoke Test<br><span class="zh-inline">10. 推送前冒烟检查</span>

**Problem**: You push, CI takes 10 minutes, fails on a formatting issue.<br><span class="zh-inline">**问题**：代码一推，CI 跑了 10 分钟，最后只是死在格式检查上，纯属白折腾。</span>

**Fix**: Run the fast checks locally before push:<br><span class="zh-inline">**修法**：推送前先在本地跑一遍便宜的快速检查。</span>

```toml
# Makefile.toml (cargo-make)
[tasks.pre-push]
description = "Local smoke test before pushing"
script = '''
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace --lib
'''
```

```bash
cargo make pre-push  # < 30 seconds
git push
```

Or use a git pre-push hook:<br><span class="zh-inline">也可以直接上 git 的 pre-push hook：</span>

```bash
#!/bin/sh
# .git/hooks/pre-push
cargo fmt --all -- --check && cargo clippy --workspace -- -D warnings
```

> See [CI/CD Pipeline](ch11-putting-it-all-together-a-production-cic.md) for `Makefile.toml` patterns.<br><span class="zh-inline">`Makefile.toml` 的完整模式见 [CI/CD 流水线](ch11-putting-it-all-together-a-production-cic.md)。</span>

---

### 🏋️ Exercises<br><span class="zh-inline">🏋️ 练习</span>

#### 🟢 Exercise 1: Apply Three Tricks<br><span class="zh-inline">🟢 练习 1：套用三条技巧</span>

Pick three tricks from this chapter and apply them to an existing Rust project. Which had the biggest impact?<br><span class="zh-inline">从这一章里挑三条技巧，应用到一个现有 Rust 项目里。哪一条带来的收益最大？</span>

<details>
<summary>Solution <span class="zh-inline">参考答案</span></summary>

Typical high-impact combination:<br><span class="zh-inline">比较常见的高收益组合是：</span>

1. **`[profile.dev.package."*"] opt-level = 2`** — Immediate improvement in dev-mode runtime (2-10× faster for parsing-heavy code)<br><span class="zh-inline">1. **`[profile.dev.package."*"] opt-level = 2`**：开发模式运行速度立刻提升，对解析密集型代码可能直接快 2-10 倍。</span>

2. **`CARGO_ENCODED_RUSTFLAGS`** — Eliminates false CI failures from third-party warnings<br><span class="zh-inline">2. **`CARGO_ENCODED_RUSTFLAGS`**：能消灭第三方 warning 引发的 CI 误杀。</span>

3. **`cargo-hack --each-feature`** — Usually finds at least one broken feature combination in any project with 3+ features<br><span class="zh-inline">3. **`cargo-hack --each-feature`**：只要 feature 稍微多一点，通常都能揪出至少一组早就坏掉的 feature 组合。</span>

```bash
# Apply trick 5:
echo '[profile.dev.package."*"]' >> Cargo.toml
echo 'opt-level = 2' >> Cargo.toml

# Apply trick 7 in CI:
# Replace RUSTFLAGS with CARGO_ENCODED_RUSTFLAGS

# Apply trick 3:
cargo install cargo-hack
cargo hack check --each-feature --no-dev-deps
```
</details>

#### 🟡 Exercise 2: Deduplicate Your Dependency Tree<br><span class="zh-inline">🟡 练习 2：给依赖树去重</span>

Run `cargo tree --duplicates` on a real project. Eliminate at least one duplicate. Measure compile-time before and after.<br><span class="zh-inline">在一个真实项目上运行 `cargo tree --duplicates`，至少消掉一个重复依赖，然后对比去重前后的编译时间。</span>

<details>
<summary>Solution <span class="zh-inline">参考答案</span></summary>

```bash
# Before
time cargo build --release 2>&1 | tail -1
cargo tree --duplicates | wc -l  # Count duplicate lines

# Find and fix one duplicate
cargo tree --duplicates
cargo tree --invert --package <duplicate-crate>@<old-version>
cargo update -p <parent-crate>

# After
time cargo build --release 2>&1 | tail -1
cargo tree --duplicates | wc -l  # Should be fewer

# Typical result: 5-15% compile time reduction per eliminated
# duplicate (especially for heavy crates like syn, tokio)
```
</details>

### Key Takeaways<br><span class="zh-inline">本章要点</span>

- Use `CARGO_ENCODED_RUSTFLAGS` instead of `RUSTFLAGS` to avoid breaking third-party build scripts<br><span class="zh-inline">优先使用 `CARGO_ENCODED_RUSTFLAGS`，别用 `RUSTFLAGS` 去误伤第三方构建脚本。</span>
- `[profile.dev.package."*"] opt-level = 2` is the single highest-impact dev experience trick<br><span class="zh-inline">`[profile.dev.package."*"] opt-level = 2` 往往是提升开发体验最猛的一招。</span>
- Cache tuning (`save-if` on main only) prevents CI cache bloat on active repositories<br><span class="zh-inline">缓存策略里只让 `main` 回写，可以有效防止活跃仓库的 CI 缓存膨胀。</span>
- `cargo tree --duplicates` + `cargo update` is a free compile-time win — do it monthly<br><span class="zh-inline">`cargo tree --duplicates` 配合 `cargo update`，基本属于白捡的编译时间收益，建议按月做一次。</span>
- Run fast checks locally with `cargo make pre-push` to avoid CI round-trip waste<br><span class="zh-inline">推送前先用 `cargo make pre-push` 跑本地快检，能省掉很多 CI 往返浪费。</span>

---
