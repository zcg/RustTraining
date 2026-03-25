## Essential Rust Tooling for C# Developers<br><span class="zh-inline">C# 开发者需要掌握的 Rust 工具生态</span>

> **What you'll learn:** Rust's development tools mapped to their C# equivalents — Clippy (Roslyn analyzers), rustfmt (dotnet format), cargo doc (XML docs), cargo watch (dotnet watch), and VS Code extensions.<br><span class="zh-inline">**本章将学到什么：** 把 Rust 开发工具映射到熟悉的 C# 对应物上，包括 Clippy（类似 Roslyn analyzers）、rustfmt（类似 `dotnet format`）、cargo doc（类似 XML 文档生成）、cargo watch（类似 `dotnet watch`），以及 VS Code 扩展。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 入门</span>

### Tool Comparison<br><span class="zh-inline">工具对照表</span>

| C# Tool | Rust Equivalent | Install | Purpose |
|---------|----------------|---------|---------|
| Roslyn analyzers<br><span class="zh-inline">Roslyn 分析器</span> | **Clippy**<br><span class="zh-inline">**Clippy**</span> | `rustup component add clippy`<br><span class="zh-inline">`rustup component add clippy`</span> | Lint + style suggestions<br><span class="zh-inline">代码检查与风格建议</span> |
| `dotnet format`<br><span class="zh-inline">`dotnet format`</span> | **rustfmt**<br><span class="zh-inline">**rustfmt**</span> | `rustup component add rustfmt`<br><span class="zh-inline">`rustup component add rustfmt`</span> | Auto-formatting<br><span class="zh-inline">自动格式化</span> |
| XML doc comments<br><span class="zh-inline">XML 文档注释</span> | **`cargo doc`**<br><span class="zh-inline">**`cargo doc`**</span> | Built-in<br><span class="zh-inline">内置</span> | Generate HTML docs<br><span class="zh-inline">生成 HTML 文档</span> |
| OmniSharp / Roslyn<br><span class="zh-inline">OmniSharp / Roslyn</span> | **rust-analyzer**<br><span class="zh-inline">**rust-analyzer**</span> | VS Code extension<br><span class="zh-inline">VS Code 扩展</span> | IDE support<br><span class="zh-inline">IDE 支持</span> |
| `dotnet watch`<br><span class="zh-inline">`dotnet watch`</span> | **cargo-watch**<br><span class="zh-inline">**cargo-watch**</span> | `cargo install cargo-watch`<br><span class="zh-inline">`cargo install cargo-watch`</span> | Auto-rebuild on save<br><span class="zh-inline">保存后自动重建</span> |
| —<br><span class="zh-inline">—</span> | **cargo-expand**<br><span class="zh-inline">**cargo-expand**</span> | `cargo install cargo-expand`<br><span class="zh-inline">`cargo install cargo-expand`</span> | See macro expansion<br><span class="zh-inline">查看宏展开结果</span> |
| `dotnet audit`<br><span class="zh-inline">`dotnet audit`</span> | **cargo-audit**<br><span class="zh-inline">**cargo-audit**</span> | `cargo install cargo-audit`<br><span class="zh-inline">`cargo install cargo-audit`</span> | Security vulnerability scan<br><span class="zh-inline">扫描安全漏洞</span> |

### Clippy: Your Automated Code Reviewer<br><span class="zh-inline">Clippy：自动化代码审查员</span>

```bash
# Run Clippy on your project
# 在项目上运行 Clippy
cargo clippy

# Treat warnings as errors (CI/CD)
# 把警告当错误处理，适合 CI/CD
cargo clippy -- -D warnings

# Auto-fix suggestions
# 自动修复可处理建议
cargo clippy --fix
```

```rust
// Clippy catches hundreds of anti-patterns:
// Clippy 能揪出成百上千种反模式

// Before Clippy:
// Clippy 提示前：
if x == true { }           // warning: equality check with bool
let _ = vec.len() == 0;    // warning: use .is_empty() instead
for i in 0..vec.len() { }  // warning: use .iter().enumerate()

// After Clippy suggestions:
// 按 Clippy 建议修改后：
if x { }
let _ = vec.is_empty();
for (i, item) in vec.iter().enumerate() { }
```

### rustfmt: Consistent Formatting<br><span class="zh-inline">rustfmt：统一格式</span>

```bash
# Format all files
# 格式化所有文件
cargo fmt

# Check formatting without changing (CI/CD)
# 只检查格式，不改文件，适合 CI/CD
cargo fmt -- --check
```

```toml
# rustfmt.toml — customize formatting (like .editorconfig)
# rustfmt.toml：自定义格式规则，类似 .editorconfig
max_width = 100
tab_spaces = 4
use_field_init_shorthand = true
```

### cargo doc: Documentation Generation<br><span class="zh-inline">cargo doc：文档生成</span>

```bash
# Generate and open docs (including dependencies)
# 生成并打开文档，连依赖文档一起带上
cargo doc --open

# Run documentation tests
# 运行文档测试
cargo test --doc
```

```rust
/// Calculate the area of a circle.
/// 计算圆的面积。
///
/// # Arguments
/// # 参数
/// * `radius` - The radius of the circle (must be non-negative)
/// * `radius` - 圆的半径，必须是非负数
///
/// # Examples
/// # 示例
/// ```
/// let area = my_crate::circle_area(5.0);
/// assert!((area - 78.54).abs() < 0.01);
/// ```
///
/// # Panics
/// # Panic 情况
/// Panics if `radius` is negative.
/// 如果 `radius` 为负数，就会 panic。
pub fn circle_area(radius: f64) -> f64 {
    assert!(radius >= 0.0, "radius must be non-negative");
    std::f64::consts::PI * radius * radius
}
// The code in /// ``` blocks is compiled and run during `cargo test`!
// `/// ``` ` 代码块里的示例会在 `cargo test` 时被编译并执行。
```

### cargo watch: Auto-Rebuild<br><span class="zh-inline">cargo watch：自动重建</span>

```bash
# Rebuild on file changes (like dotnet watch)
# 文件变化时自动重建，类似 dotnet watch
cargo watch -x check          # Type-check only (fastest)
                              # 只做类型检查，速度最快
cargo watch -x test           # Run tests on save
                              # 保存时跑测试
cargo watch -x 'run -- args'  # Run program on save
                              # 保存时带参数运行程序
cargo watch -x clippy         # Lint on save
                              # 保存时顺手跑 Clippy
```

### cargo expand: See What Macros Generate<br><span class="zh-inline">cargo expand：看看宏到底生成了什么</span>

```bash
# See the expanded output of derive macros
# 查看 derive 宏展开后的结果
cargo expand --lib            # Expand lib.rs
                              # 展开 lib.rs
cargo expand module_name      # Expand specific module
                              # 展开指定模块
```

### Recommended VS Code Extensions<br><span class="zh-inline">推荐的 VS Code 扩展</span>

| Extension | Purpose |
|-----------|---------|
| **rust-analyzer**<br><span class="zh-inline">**rust-analyzer**</span> | Code completion, inline errors, refactoring<br><span class="zh-inline">代码补全、行内报错、重构支持</span> |
| **CodeLLDB**<br><span class="zh-inline">**CodeLLDB**</span> | Debugger (like Visual Studio debugger)<br><span class="zh-inline">调试器，体验上类似 Visual Studio 调试器</span> |
| **Even Better TOML**<br><span class="zh-inline">**Even Better TOML**</span> | Cargo.toml syntax highlighting<br><span class="zh-inline">给 Cargo.toml 提供语法高亮</span> |
| **crates**<br><span class="zh-inline">**crates**</span> | Show latest crate versions in Cargo.toml<br><span class="zh-inline">在 Cargo.toml 里显示最新 crate 版本</span> |
| **Error Lens**<br><span class="zh-inline">**Error Lens**</span> | Inline error/warning display<br><span class="zh-inline">直接在行内显示错误和警告</span> |

***

For deeper exploration of advanced topics mentioned in this guide, see the companion training documents:<br><span class="zh-inline">如果要继续深挖本章提到的高级主题，可以继续阅读下面这些配套训练材料：</span>

- **[Rust Patterns](../../rust-patterns-book/src/SUMMARY.md)** — Pin projections, custom allocators, arena patterns, lock-free data structures, and advanced unsafe patterns<br><span class="zh-inline">**[Rust Patterns](../../rust-patterns-book/src/SUMMARY.md)**：讲 Pin 投影、自定义分配器、arena 模式、无锁数据结构，以及更深入的 unsafe 模式。</span>
- **[Async Rust Training](../../async-book/src/SUMMARY.md)** — Deep dive into tokio, async cancellation safety, stream processing, and production async architectures<br><span class="zh-inline">**[Async Rust Training](../../async-book/src/SUMMARY.md)**：深入讲 tokio、异步取消安全、stream 处理和生产环境异步架构。</span>
- **[Rust Training for C++ Developers](../../c-cpp-book/src/SUMMARY.md)** — Useful if your team also has C++ experience; covers move semantics mapping, RAII differences, and template vs generics<br><span class="zh-inline">**[Rust Training for C++ Developers](../../c-cpp-book/src/SUMMARY.md)**：如果团队里也有 C++ 背景成员，这份材料会讲清 move 语义映射、RAII 差异，以及模板和泛型的关系。</span>
- **[Rust Training for C Developers](../../c-cpp-book/src/SUMMARY.md)** — Relevant for interop scenarios; covers FFI patterns, embedded Rust debugging, and `no_std` programming<br><span class="zh-inline">**[Rust Training for C Developers](../../c-cpp-book/src/SUMMARY.md)**：适合互操作场景，内容涵盖 FFI 模式、嵌入式 Rust 调试和 `no_std` 编程。</span>
