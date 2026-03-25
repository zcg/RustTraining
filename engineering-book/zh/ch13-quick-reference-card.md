# Quick Reference Card<br><span class="zh-inline">速查卡片</span>

### Cheat Sheet: Commands at a Glance<br><span class="zh-inline">命令速查：一眼看全</span>

```bash
# ─── Build Scripts ───
# ─── 构建脚本 ───
cargo build                          # Compiles build.rs first, then crate
                                     # 先编译 build.rs，再编译当前 crate
cargo build -vv                      # Verbose — shows build.rs output
                                     # 详细模式，会把 build.rs 输出也打出来

# ─── Cross-Compilation ───
# ─── 交叉编译 ───
rustup target add x86_64-unknown-linux-musl
                                     # 添加 musl 目标
cargo build --release --target x86_64-unknown-linux-musl
                                     # 构建静态 Linux 发布版
cargo zigbuild --release --target x86_64-unknown-linux-gnu.2.17
                                     # 用 zig 工具链构建旧 glibc 兼容版本
cross build --release --target aarch64-unknown-linux-gnu
                                     # 借助 cross 构建 aarch64 Linux 目标

# ─── Benchmarking ───
# ─── 基准测试 ───
cargo bench                          # Run all benchmarks
                                     # 运行全部 benchmark
cargo bench -- parse                 # Run benchmarks matching "parse"
                                     # 只跑名字匹配 "parse" 的 benchmark
cargo flamegraph -- --args           # Generate flamegraph from binary
                                     # 为可执行文件生成火焰图
perf record -g ./target/release/bin  # Record perf data
                                     # 采集 perf 数据
perf report                          # View perf data interactively
                                     # 交互式查看 perf 结果

# ─── Coverage ───
# ─── 覆盖率 ───
cargo llvm-cov --html                # HTML report
                                     # 输出 HTML 覆盖率报告
cargo llvm-cov --lcov --output-path lcov.info
                                     # 生成 lcov 格式报告
cargo llvm-cov --workspace --fail-under-lines 80
                                     # 工作区覆盖率低于 80% 时失败
cargo tarpaulin --out Html           # Alternative tool
                                     # tarpaulin 的 HTML 报告模式

# ─── Safety Verification ───
# ─── 安全性验证 ───
cargo +nightly miri test             # Run tests under Miri
                                     # 在 Miri 下运行测试
MIRIFLAGS="-Zmiri-disable-isolation" cargo +nightly miri test
                                     # 关闭隔离限制后运行 Miri
valgrind --leak-check=full ./target/debug/binary
                                     # 用 Valgrind 做完整泄漏检查
RUSTFLAGS="-Zsanitizer=address" cargo +nightly test -Zbuild-std --target x86_64-unknown-linux-gnu
                                     # 开启 AddressSanitizer 运行测试

# ─── Audit & Supply Chain ───
# ─── 审计与供应链 ───
cargo audit                          # Known vulnerability scan
                                     # 扫描已知漏洞
cargo audit --deny warnings          # Fail CI on any advisory
                                     # 发现 advisory 就让 CI 失败
cargo deny check                     # License + advisory + ban + source checks
                                     # 检查许可证、公告、禁用项和源来源
cargo deny list                      # List all licenses in dep tree
                                     # 列出依赖树中的全部许可证
cargo vet                            # Supply chain trust verification
                                     # 做供应链信任校验
cargo outdated --workspace           # Find outdated dependencies
                                     # 找出过期依赖
cargo semver-checks                  # Detect breaking API changes
                                     # 检测破坏性 API 变化
cargo geiger                         # Count unsafe in dependency tree
                                     # 统计依赖树中的 unsafe 使用量

# ─── Binary Optimization ───
# ─── 二进制优化 ───
cargo bloat --release --crates       # Size contribution per crate
                                     # 查看各 crate 的体积贡献
cargo bloat --release -n 20          # 20 largest functions
                                     # 列出最大的 20 个函数
cargo +nightly udeps --workspace     # Find unused dependencies
                                     # 查找未使用依赖
cargo machete                        # Fast unused dep detection
                                     # 更快的未使用依赖扫描
cargo expand --lib module::name      # See macro expansions
                                     # 查看宏展开结果
cargo msrv find                      # Discover minimum Rust version
                                     # 探测最低 Rust 版本
cargo clippy --fix --workspace --allow-dirty  # Auto-fix lint warnings
                                             # 自动修复可处理的 lint 警告

# ─── Compile-Time Optimization ───
# ─── 编译时间优化 ───
export RUSTC_WRAPPER=sccache         # Shared compilation cache
                                     # 启用共享编译缓存
sccache --show-stats                 # Cache hit statistics
                                     # 查看缓存命中统计
cargo nextest run                    # Faster test runner
                                     # 使用更快的测试执行器
cargo nextest run --retries 2        # Retry flaky tests
                                     # 易抖测试自动重试两次

# ─── Platform Engineering ───
# ─── 平台工程 ───
cargo check --target thumbv7em-none-eabihf   # Verify no_std builds
                                             # 校验 no_std 目标能否通过检查
cargo build --target x86_64-pc-windows-gnu   # Cross-compile to Windows
                                             # 交叉编译到 Windows GNU 目标
cargo xwin build --target x86_64-pc-windows-msvc  # MSVC ABI cross-compile
                                                  # 交叉编译到 Windows MSVC ABI
cfg!(target_os = "linux")                    # Compile-time cfg (evaluates to bool)
                                             # 编译期 cfg 判断，结果是布尔值

# ─── Release ───
# ─── 发布 ───
cargo release patch --dry-run        # Preview release
                                     # 预览一次 patch 发布
cargo release patch --execute        # Bump, commit, tag, publish
                                     # 提升版本、提交、打 tag、发布
cargo dist plan                      # Preview distribution artifacts
                                     # 预览分发产物计划
```

### Decision Table: Which Tool When<br><span class="zh-inline">决策表：什么目标用什么工具</span>

| Goal | Tool | When to Use |
|------|------|-------------|
| Embed git hash / build info<br><span class="zh-inline">嵌入 git hash 或构建信息</span> | `build.rs`<br><span class="zh-inline">`build.rs`</span> | Binary needs traceability<br><span class="zh-inline">二进制产物需要可追踪性时</span> |
| Compile C code with Rust<br><span class="zh-inline">把 C 代码一起编进 Rust</span> | `cc` crate in `build.rs`<br><span class="zh-inline">`build.rs` 里的 `cc` crate</span> | FFI to small C libraries<br><span class="zh-inline">对接小型 C 库时</span> |
| Generate code from schemas<br><span class="zh-inline">从模式文件生成代码</span> | `prost-build` / `tonic-build`<br><span class="zh-inline">`prost-build` / `tonic-build`</span> | Protobuf, gRPC, FlatBuffers<br><span class="zh-inline">处理 Protobuf、gRPC、FlatBuffers 时</span> |
| Link system library<br><span class="zh-inline">链接系统库</span> | `pkg-config` in `build.rs`<br><span class="zh-inline">`build.rs` 中的 `pkg-config`</span> | OpenSSL, libpci, systemd<br><span class="zh-inline">例如 OpenSSL、libpci、systemd</span> |
| Static Linux binary<br><span class="zh-inline">静态 Linux 二进制</span> | `--target x86_64-unknown-linux-musl`<br><span class="zh-inline">`--target x86_64-unknown-linux-musl`</span> | Container/cloud deployment<br><span class="zh-inline">容器或云环境部署</span> |
| Target old glibc<br><span class="zh-inline">兼容旧版 glibc</span> | `cargo-zigbuild`<br><span class="zh-inline">`cargo-zigbuild`</span> | RHEL 7, CentOS 7 compatibility<br><span class="zh-inline">需要兼容 RHEL 7、CentOS 7 时</span> |
| ARM server binary<br><span class="zh-inline">ARM 服务器二进制</span> | `cross` or `cargo-zigbuild`<br><span class="zh-inline">`cross` 或 `cargo-zigbuild`</span> | Graviton/Ampere deployment<br><span class="zh-inline">面向 Graviton、Ampere 等部署</span> |
| Statistical benchmarks<br><span class="zh-inline">统计型基准测试</span> | Criterion.rs<br><span class="zh-inline">Criterion.rs</span> | Performance regression detection<br><span class="zh-inline">监测性能回退</span> |
| Quick perf check<br><span class="zh-inline">快速性能检查</span> | Divan<br><span class="zh-inline">Divan</span> | Development-time profiling<br><span class="zh-inline">开发阶段临时分析</span> |
| Find hot spots<br><span class="zh-inline">定位热点</span> | `cargo flamegraph` / `perf`<br><span class="zh-inline">`cargo flamegraph` / `perf`</span> | After benchmark identifies slow code<br><span class="zh-inline">benchmark 确认代码很慢之后</span> |
| Line/branch coverage<br><span class="zh-inline">行覆盖率与分支覆盖率</span> | `cargo-llvm-cov`<br><span class="zh-inline">`cargo-llvm-cov`</span> | CI coverage gates, gap analysis<br><span class="zh-inline">CI 覆盖率门槛与缺口分析</span> |
| Quick coverage check<br><span class="zh-inline">快速看覆盖率</span> | `cargo-tarpaulin`<br><span class="zh-inline">`cargo-tarpaulin`</span> | Local development<br><span class="zh-inline">本地开发阶段</span> |
| Rust UB detection<br><span class="zh-inline">检测 Rust UB</span> | Miri<br><span class="zh-inline">Miri</span> | Pure-Rust `unsafe` code<br><span class="zh-inline">纯 Rust 的 `unsafe` 代码</span> |
| C FFI memory safety<br><span class="zh-inline">C FFI 内存安全检查</span> | Valgrind memcheck<br><span class="zh-inline">Valgrind memcheck</span> | Mixed Rust/C codebases<br><span class="zh-inline">Rust/C 混合代码库</span> |
| Data race detection<br><span class="zh-inline">数据竞争检测</span> | TSan or Miri<br><span class="zh-inline">TSan 或 Miri</span> | Concurrent `unsafe` code<br><span class="zh-inline">并发 `unsafe` 代码</span> |
| Buffer overflow detection<br><span class="zh-inline">缓冲区溢出检测</span> | ASan<br><span class="zh-inline">ASan</span> | `unsafe` pointer arithmetic<br><span class="zh-inline">涉及 `unsafe` 指针运算</span> |
| Leak detection<br><span class="zh-inline">泄漏检测</span> | Valgrind or LSan<br><span class="zh-inline">Valgrind 或 LSan</span> | Long-running services<br><span class="zh-inline">长时间运行的服务</span> |
| Local CI equivalent<br><span class="zh-inline">本地模拟 CI</span> | `cargo-make`<br><span class="zh-inline">`cargo-make`</span> | Developer workflow automation<br><span class="zh-inline">开发流程自动化</span> |
| Pre-commit checks<br><span class="zh-inline">提交前检查</span> | `cargo-husky` or git hooks<br><span class="zh-inline">`cargo-husky` 或 git hook</span> | Catch issues before push<br><span class="zh-inline">在推送前拦住问题</span> |
| Automated releases<br><span class="zh-inline">自动化发布</span> | `cargo-release` + `cargo-dist`<br><span class="zh-inline">`cargo-release` + `cargo-dist`</span> | Version management + distribution<br><span class="zh-inline">版本管理与分发</span> |
| Dependency auditing<br><span class="zh-inline">依赖审计</span> | `cargo-audit` / `cargo-deny`<br><span class="zh-inline">`cargo-audit` / `cargo-deny`</span> | Supply chain security<br><span class="zh-inline">供应链安全</span> |
| License compliance<br><span class="zh-inline">许可证合规</span> | `cargo-deny` (licenses)<br><span class="zh-inline">`cargo-deny` 的 licenses 检查</span> | Commercial / enterprise projects<br><span class="zh-inline">商业或企业项目</span> |
| Supply chain trust<br><span class="zh-inline">供应链信任校验</span> | `cargo-vet`<br><span class="zh-inline">`cargo-vet`</span> | High-security environments<br><span class="zh-inline">高安全环境</span> |
| Find outdated deps<br><span class="zh-inline">查找过期依赖</span> | `cargo-outdated`<br><span class="zh-inline">`cargo-outdated`</span> | Scheduled maintenance<br><span class="zh-inline">周期性维护时</span> |
| Detect breaking changes<br><span class="zh-inline">检测破坏性变化</span> | `cargo-semver-checks`<br><span class="zh-inline">`cargo-semver-checks`</span> | Library crate publishing<br><span class="zh-inline">发布库型 crate 前</span> |
| Dependency tree analysis<br><span class="zh-inline">依赖树分析</span> | `cargo tree --duplicates`<br><span class="zh-inline">`cargo tree --duplicates`</span> | Dedup and trim dep graph<br><span class="zh-inline">去重并精简依赖图</span> |
| Binary size analysis<br><span class="zh-inline">二进制体积分析</span> | `cargo-bloat`<br><span class="zh-inline">`cargo-bloat`</span> | Size-constrained deployments<br><span class="zh-inline">体积敏感的部署环境</span> |
| Find unused deps<br><span class="zh-inline">查找未使用依赖</span> | `cargo-udeps` / `cargo-machete`<br><span class="zh-inline">`cargo-udeps` / `cargo-machete`</span> | Trim compile time and size<br><span class="zh-inline">缩短编译时间并减小体积</span> |
| LTO tuning<br><span class="zh-inline">LTO 调优</span> | `lto = true` or `"thin"`<br><span class="zh-inline">`lto = true` 或 `"thin"`</span> | Release binary optimization<br><span class="zh-inline">发布版二进制优化</span> |
| Size-optimized binary<br><span class="zh-inline">体积优先的二进制</span> | `opt-level = "z"` + `strip = true`<br><span class="zh-inline">`opt-level = "z"` + `strip = true`</span> | Embedded / WASM / containers<br><span class="zh-inline">嵌入式、WASM、容器场景</span> |
| Unsafe usage audit<br><span class="zh-inline">unsafe 使用审计</span> | `cargo-geiger`<br><span class="zh-inline">`cargo-geiger`</span> | Security policy enforcement<br><span class="zh-inline">执行安全策略</span> |
| Macro debugging<br><span class="zh-inline">宏调试</span> | `cargo-expand`<br><span class="zh-inline">`cargo-expand`</span> | Derive / macro_rules debugging<br><span class="zh-inline">调试 derive 或 `macro_rules!`</span> |
| Faster linking<br><span class="zh-inline">更快链接</span> | `mold` linker<br><span class="zh-inline">`mold` 链接器</span> | Developer inner loop<br><span class="zh-inline">提升日常迭代效率</span> |
| Compilation cache<br><span class="zh-inline">编译缓存</span> | `sccache`<br><span class="zh-inline">`sccache`</span> | CI and local build speed<br><span class="zh-inline">提升 CI 和本地构建速度</span> |
| Faster tests<br><span class="zh-inline">更快跑测试</span> | `cargo-nextest`<br><span class="zh-inline">`cargo-nextest`</span> | CI and local test speed<br><span class="zh-inline">提升 CI 与本地测试速度</span> |
| MSRV compliance<br><span class="zh-inline">MSRV 合规</span> | `cargo-msrv`<br><span class="zh-inline">`cargo-msrv`</span> | Library publishing<br><span class="zh-inline">发布库之前</span> |
| `no_std` library<br><span class="zh-inline">`no_std` 库</span> | `#![no_std]` + `default-features = false`<br><span class="zh-inline">`#![no_std]` + `default-features = false`</span> | Embedded, UEFI, WASM<br><span class="zh-inline">嵌入式、UEFI、WASM</span> |
| Windows cross-compile<br><span class="zh-inline">Windows 交叉编译</span> | `cargo-xwin` / MinGW<br><span class="zh-inline">`cargo-xwin` / MinGW</span> | Linux → Windows builds<br><span class="zh-inline">从 Linux 构建 Windows 产物</span> |
| Platform abstraction<br><span class="zh-inline">平台抽象</span> | `#[cfg]` + trait pattern<br><span class="zh-inline">`#[cfg]` + trait 模式</span> | Multi-OS codebases<br><span class="zh-inline">多操作系统代码库</span> |
| Windows API calls<br><span class="zh-inline">调用 Windows API</span> | `windows-sys` / `windows` crate<br><span class="zh-inline">`windows-sys` / `windows` crate</span> | Native Windows functionality<br><span class="zh-inline">原生 Windows 功能开发</span> |
| End-to-end timing<br><span class="zh-inline">端到端计时</span> | `hyperfine`<br><span class="zh-inline">`hyperfine`</span> | Whole-binary benchmarks, before/after comparison<br><span class="zh-inline">整程序基准测试与前后对比</span> |
| Property-based testing<br><span class="zh-inline">性质测试</span> | `proptest`<br><span class="zh-inline">`proptest`</span> | Edge case discovery, parser robustness<br><span class="zh-inline">发现边界条件问题，提升解析器健壮性</span> |
| Snapshot testing<br><span class="zh-inline">快照测试</span> | `insta`<br><span class="zh-inline">`insta`</span> | Large structured output verification<br><span class="zh-inline">验证大块结构化输出</span> |
| Coverage-guided fuzzing<br><span class="zh-inline">覆盖率引导模糊测试</span> | `cargo-fuzz`<br><span class="zh-inline">`cargo-fuzz`</span> | Crash discovery in parsers<br><span class="zh-inline">发现解析器崩溃问题</span> |
| Concurrency model checking<br><span class="zh-inline">并发模型检查</span> | `loom`<br><span class="zh-inline">`loom`</span> | Lock-free data structures, atomic ordering<br><span class="zh-inline">无锁数据结构与原子顺序验证</span> |
| Feature combination testing<br><span class="zh-inline">feature 组合测试</span> | `cargo-hack`<br><span class="zh-inline">`cargo-hack`</span> | Crates with multiple `#[cfg]` features<br><span class="zh-inline">feature 分支较多的 crate</span> |
| Fast UB checks (near-native)<br><span class="zh-inline">快速 UB 检查（接近原生速度）</span> | `cargo-careful`<br><span class="zh-inline">`cargo-careful`</span> | CI safety gate, lighter than Miri<br><span class="zh-inline">CI 安全门禁，成本比 Miri 更低</span> |
| Auto-rebuild on save<br><span class="zh-inline">保存即自动重建</span> | `cargo-watch`<br><span class="zh-inline">`cargo-watch`</span> | Developer inner loop, tight feedback<br><span class="zh-inline">适合日常高频反馈循环</span> |
| Workspace documentation<br><span class="zh-inline">工作区文档生成</span> | `cargo doc` + rustdoc<br><span class="zh-inline">`cargo doc` + rustdoc</span> | API discovery, onboarding, doc-link CI<br><span class="zh-inline">API 探索、入门引导、文档链接检查</span> |
| Reproducible builds<br><span class="zh-inline">可复现构建</span> | `--locked` + `SOURCE_DATE_EPOCH`<br><span class="zh-inline">`--locked` + `SOURCE_DATE_EPOCH`</span> | Release integrity verification<br><span class="zh-inline">验证发布产物完整性</span> |
| CI cache tuning<br><span class="zh-inline">CI 缓存调优</span> | `Swatinem/rust-cache@v2`<br><span class="zh-inline">`Swatinem/rust-cache@v2`</span> | Build time reduction (cold → cached)<br><span class="zh-inline">缩短 CI 构建时间</span> |
| Workspace lint policy<br><span class="zh-inline">工作区 lint 策略</span> | `[workspace.lints]` in Cargo.toml<br><span class="zh-inline">Cargo.toml 里的 `[workspace.lints]`</span> | Consistent Clippy/compiler lints across all crates<br><span class="zh-inline">统一全工作区的 Clippy 与编译器 lint</span> |
| Auto-fix lint warnings<br><span class="zh-inline">自动修复 lint 警告</span> | `cargo clippy --fix`<br><span class="zh-inline">`cargo clippy --fix`</span> | Automated cleanup of trivial issues<br><span class="zh-inline">清理简单、机械的警告</span> |

### Further Reading<br><span class="zh-inline">延伸阅读</span>

| Topic | Resource |
|-------|----------|
| Cargo build scripts<br><span class="zh-inline">Cargo 构建脚本</span> | [Cargo Book — Build Scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html)<br><span class="zh-inline">Cargo Book：Build Scripts</span> |
| Cross-compilation<br><span class="zh-inline">交叉编译</span> | [Rust Cross-Compilation](https://rust-lang.github.io/rustup/cross-compilation.html)<br><span class="zh-inline">Rust 交叉编译文档</span> |
| `cross` tool<br><span class="zh-inline">`cross` 工具</span> | [cross-rs/cross](https://github.com/cross-rs/cross)<br><span class="zh-inline">cross-rs/cross 项目</span> |
| `cargo-zigbuild`<br><span class="zh-inline">`cargo-zigbuild`</span> | [cargo-zigbuild docs](https://github.com/rust-cross/cargo-zigbuild)<br><span class="zh-inline">cargo-zigbuild 文档</span> |
| Criterion.rs<br><span class="zh-inline">Criterion.rs</span> | [Criterion User Guide](https://bheisler.github.io/criterion.rs/book/)<br><span class="zh-inline">Criterion 使用指南</span> |
| Divan<br><span class="zh-inline">Divan</span> | [Divan docs](https://github.com/nvzqz/divan)<br><span class="zh-inline">Divan 文档</span> |
| `cargo-llvm-cov`<br><span class="zh-inline">`cargo-llvm-cov`</span> | [cargo-llvm-cov](https://github.com/taiki-e/cargo-llvm-cov)<br><span class="zh-inline">cargo-llvm-cov 项目</span> |
| `cargo-tarpaulin`<br><span class="zh-inline">`cargo-tarpaulin`</span> | [tarpaulin docs](https://github.com/xd009642/tarpaulin)<br><span class="zh-inline">tarpaulin 文档</span> |
| Miri<br><span class="zh-inline">Miri</span> | [Miri GitHub](https://github.com/rust-lang/miri)<br><span class="zh-inline">Miri GitHub 项目</span> |
| Sanitizers in Rust<br><span class="zh-inline">Rust 中的 Sanitizer</span> | [rustc Sanitizer docs](https://doc.rust-lang.org/nightly/unstable-book/compiler-flags/sanitizer.html)<br><span class="zh-inline">rustc Sanitizer 文档</span> |
| `cargo-make`<br><span class="zh-inline">`cargo-make`</span> | [cargo-make book](https://sagiegurari.github.io/cargo-make/)<br><span class="zh-inline">cargo-make 手册</span> |
| `cargo-release`<br><span class="zh-inline">`cargo-release`</span> | [cargo-release docs](https://github.com/crate-ci/cargo-release)<br><span class="zh-inline">cargo-release 文档</span> |
| `cargo-dist`<br><span class="zh-inline">`cargo-dist`</span> | [cargo-dist docs](https://axodotdev.github.io/cargo-dist/book/)<br><span class="zh-inline">cargo-dist 文档</span> |
| Profile-guided optimization<br><span class="zh-inline">配置文件引导优化</span> | [Rust PGO guide](https://doc.rust-lang.org/rustc/profile-guided-optimization.html)<br><span class="zh-inline">Rust PGO 指南</span> |
| Flamegraphs<br><span class="zh-inline">火焰图</span> | [cargo-flamegraph](https://github.com/flamegraph-rs/flamegraph)<br><span class="zh-inline">cargo-flamegraph 项目</span> |
| `cargo-deny`<br><span class="zh-inline">`cargo-deny`</span> | [cargo-deny docs](https://embarkstudios.github.io/cargo-deny/)<br><span class="zh-inline">cargo-deny 文档</span> |
| `cargo-vet`<br><span class="zh-inline">`cargo-vet`</span> | [cargo-vet docs](https://mozilla.github.io/cargo-vet/)<br><span class="zh-inline">cargo-vet 文档</span> |
| `cargo-audit`<br><span class="zh-inline">`cargo-audit`</span> | [cargo-audit](https://github.com/rustsec/rustsec/tree/main/cargo-audit)<br><span class="zh-inline">cargo-audit 项目</span> |
| `cargo-bloat`<br><span class="zh-inline">`cargo-bloat`</span> | [cargo-bloat](https://github.com/RazrFalcon/cargo-bloat)<br><span class="zh-inline">cargo-bloat 项目</span> |
| `cargo-udeps`<br><span class="zh-inline">`cargo-udeps`</span> | [cargo-udeps](https://github.com/est31/cargo-udeps)<br><span class="zh-inline">cargo-udeps 项目</span> |
| `cargo-geiger`<br><span class="zh-inline">`cargo-geiger`</span> | [cargo-geiger](https://github.com/geiger-rs/cargo-geiger)<br><span class="zh-inline">cargo-geiger 项目</span> |
| `cargo-semver-checks`<br><span class="zh-inline">`cargo-semver-checks`</span> | [cargo-semver-checks](https://github.com/obi1kenobi/cargo-semver-checks)<br><span class="zh-inline">cargo-semver-checks 项目</span> |
| `cargo-nextest`<br><span class="zh-inline">`cargo-nextest`</span> | [nextest docs](https://nexte.st/)<br><span class="zh-inline">nextest 文档</span> |
| `sccache`<br><span class="zh-inline">`sccache`</span> | [sccache](https://github.com/mozilla/sccache)<br><span class="zh-inline">sccache 项目</span> |
| `mold` linker<br><span class="zh-inline">`mold` 链接器</span> | [mold](https://github.com/rui314/mold)<br><span class="zh-inline">mold 项目</span> |
| `cargo-msrv`<br><span class="zh-inline">`cargo-msrv`</span> | [cargo-msrv](https://github.com/foresterre/cargo-msrv)<br><span class="zh-inline">cargo-msrv 项目</span> |
| LTO<br><span class="zh-inline">LTO</span> | [rustc Codegen Options](https://doc.rust-lang.org/rustc/codegen-options/index.html)<br><span class="zh-inline">rustc 代码生成选项文档</span> |
| Cargo Profiles<br><span class="zh-inline">Cargo Profile</span> | [Cargo Book — Profiles](https://doc.rust-lang.org/cargo/reference/profiles.html)<br><span class="zh-inline">Cargo Book：Profiles</span> |
| `no_std`<br><span class="zh-inline">`no_std`</span> | [Rust Embedded Book](https://docs.rust-embedded.org/book/)<br><span class="zh-inline">Rust Embedded Book</span> |
| `windows-sys` crate<br><span class="zh-inline">`windows-sys` crate</span> | [windows-rs](https://github.com/microsoft/windows-rs)<br><span class="zh-inline">windows-rs 项目</span> |
| `cargo-xwin`<br><span class="zh-inline">`cargo-xwin`</span> | [cargo-xwin docs](https://github.com/rust-cross/cargo-xwin)<br><span class="zh-inline">cargo-xwin 文档</span> |
| `cargo-hack`<br><span class="zh-inline">`cargo-hack`</span> | [cargo-hack](https://github.com/taiki-e/cargo-hack)<br><span class="zh-inline">cargo-hack 项目</span> |
| `cargo-careful`<br><span class="zh-inline">`cargo-careful`</span> | [cargo-careful](https://github.com/RalfJung/cargo-careful)<br><span class="zh-inline">cargo-careful 项目</span> |
| `cargo-watch`<br><span class="zh-inline">`cargo-watch`</span> | [cargo-watch](https://github.com/watchexec/cargo-watch)<br><span class="zh-inline">cargo-watch 项目</span> |
| Rust CI cache<br><span class="zh-inline">Rust CI 缓存</span> | [Swatinem/rust-cache](https://github.com/Swatinem/rust-cache)<br><span class="zh-inline">Swatinem/rust-cache 项目</span> |
| Rustdoc book<br><span class="zh-inline">Rustdoc 手册</span> | [Rustdoc Book](https://doc.rust-lang.org/rustdoc/)<br><span class="zh-inline">Rustdoc Book</span> |
| Conditional compilation<br><span class="zh-inline">条件编译</span> | [Rust Reference — cfg](https://doc.rust-lang.org/reference/conditional-compilation.html)<br><span class="zh-inline">Rust Reference：cfg</span> |
| Embedded Rust<br><span class="zh-inline">嵌入式 Rust</span> | [Awesome Embedded Rust](https://github.com/rust-embedded/awesome-embedded-rust)<br><span class="zh-inline">Awesome Embedded Rust</span> |
| `hyperfine`<br><span class="zh-inline">`hyperfine`</span> | [hyperfine](https://github.com/sharkdp/hyperfine)<br><span class="zh-inline">hyperfine 项目</span> |
| `proptest`<br><span class="zh-inline">`proptest`</span> | [proptest](https://github.com/proptest-rs/proptest)<br><span class="zh-inline">proptest 项目</span> |
| `insta`<br><span class="zh-inline">`insta`</span> | [insta snapshot testing](https://insta.rs/)<br><span class="zh-inline">insta 快照测试</span> |
| `cargo-fuzz`<br><span class="zh-inline">`cargo-fuzz`</span> | [cargo-fuzz](https://github.com/rust-fuzz/cargo-fuzz)<br><span class="zh-inline">cargo-fuzz 项目</span> |
| `loom`<br><span class="zh-inline">`loom`</span> | [loom concurrency testing](https://github.com/tokio-rs/loom)<br><span class="zh-inline">loom 并发测试</span> |

---

*Generated as a companion reference — a companion to Rust Patterns and Type-Driven Correctness.*<br><span class="zh-inline">*这张卡片作为配套参考资料生成，可与 Rust Patterns 和 Type-Driven Correctness 两本书配合查阅。*</span>

*Version 1.3 — Added cargo-hack, cargo-careful, cargo-watch, cargo doc, reproducible builds, CI caching strategies, capstone exercise, and chapter dependency diagram for completeness.*<br><span class="zh-inline">*版本 1.3：补充了 cargo-hack、cargo-careful、cargo-watch、cargo doc、可复现构建、CI 缓存策略、综合练习与章节依赖图，使内容更完整。*</span>
