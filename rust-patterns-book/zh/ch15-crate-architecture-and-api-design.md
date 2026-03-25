# 14. Crate Architecture and API Design 🟡<br><span class="zh-inline"># 15. Crate 架构与 API 设计 🟡</span>

> **What you'll learn:**<br><span class="zh-inline">**本章将学到什么：**</span>
> - Module layout conventions and re-export strategies<br><span class="zh-inline">模块布局惯例与重新导出策略</span>
> - The public API design checklist for polished crates<br><span class="zh-inline">打磨公开 API 的一套检查清单</span>
> - Ergonomic parameter patterns: `impl Into`, `AsRef`, `Cow`<br><span class="zh-inline">更顺手的参数模式：`impl Into`、`AsRef`、`Cow`</span>
> - "Parse, don't validate" with `TryFrom` and validated types<br><span class="zh-inline">如何用 `TryFrom` 和已验证类型贯彻“解析，而不是事后校验”</span>
> - Feature flags, conditional compilation, and workspace organization<br><span class="zh-inline">特性开关、条件编译以及 workspace 组织方式</span>

## Module Layout Conventions<br><span class="zh-inline">模块布局惯例</span>

```text
my_crate/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── config.rs
│   ├── parser/
│   │   ├── mod.rs
│   │   ├── lexer.rs
│   │   └── ast.rs
│   ├── error.rs
│   └── utils.rs
├── tests/
├── benches/
└── examples/
```

```rust
// lib.rs — curate your public API with re-exports:
mod config;
mod error;
mod parser;
mod utils;

pub use config::Config;
pub use error::Error;
pub use parser::Parser;
```

The idea is simple: internal layout may be deep, but the public API should feel shallow and intentional. Users should import `my_crate::Config`, not spend their day spelunking through internal module trees.<br><span class="zh-inline">核心思路很简单：内部目录结构可以深，但公开 API 应该尽量浅、尽量有意图。调用方最好直接写 `my_crate::Config`，而不是天天钻内部模块树找类型。</span>

**Visibility modifiers**:<br><span class="zh-inline">**可见性修饰符：**</span>

| Modifier<br><span class="zh-inline">修饰符</span> | Visible To<br><span class="zh-inline">可见范围</span> |
|----------|-----------|
| `pub` | Everyone<br><span class="zh-inline">所有地方</span> |
| `pub(crate)` | This crate only<br><span class="zh-inline">当前 crate</span> |
| `pub(super)` | Parent module<br><span class="zh-inline">父模块</span> |
| `pub(in path)` | Specific ancestor module<br><span class="zh-inline">指定祖先模块</span> |
| (none) | Current module and children<br><span class="zh-inline">当前模块及其子模块</span> |

### Public API Design Checklist<br><span class="zh-inline">公开 API 设计清单</span>

1. **Accept references, return owned values when appropriate.**<br><span class="zh-inline">**能接引用就先接引用，适合返回拥有值时再返回拥有值。**</span>
2. **Prefer readable signatures.**<br><span class="zh-inline">**签名优先清晰，不要为了炫技把泛型写成天书。**</span>
3. **Return `Result` instead of panicking.**<br><span class="zh-inline">**优先返回 `Result`，别把错误处理替调用方做掉。**</span>
4. **Implement standard traits when they make sense.**<br><span class="zh-inline">**该实现的标准 trait 尽量实现。**</span>
5. **Make invalid states unrepresentable.**<br><span class="zh-inline">**尽量让非法状态根本无法表示。**</span>
6. **Use builders for complex configuration.**<br><span class="zh-inline">**复杂配置优先 builder。**</span>
7. **Seal traits you do not want downstream crates to implement.**<br><span class="zh-inline">**不希望外部实现的 trait，用 sealed pattern 收口。**</span>
8. **Mark important return values with `#[must_use]`.**<br><span class="zh-inline">**重要返回值可以加 `#[must_use]`，防止调用方顺手丢掉。**</span>

```rust
mod private {
    pub trait Sealed {}
}

pub trait DatabaseDriver: private::Sealed {
    fn connect(&self, url: &str) -> Connection;
}
```

`#[non_exhaustive]` is another valuable tool for public enums and structs, because it lets you add fields or variants later without immediately turning a minor feature release into a semver breakage.<br><span class="zh-inline">`#[non_exhaustive]` 也是公开枚举和结构体上很有价值的工具，因为它能让后续新增字段或变体时，不至于立刻把一次普通迭代升级成语义化版本灾难。</span>

### Ergonomic Parameter Patterns — `impl Into`, `AsRef`, `Cow`<br><span class="zh-inline">更顺手的参数模式：`impl Into`、`AsRef`、`Cow`</span>

Good Rust APIs usually accept the most general form they can reasonably support, so callers do not have to keep writing `.to_string()`、`.as_ref()` and similar conversion noise everywhere.<br><span class="zh-inline">好的 Rust API 通常会尽量接受“足够泛化”的参数形式，这样调用方就不用在每个调用点重复写 `.to_string()`、`.as_ref()` 这种低信息量转换。</span>

#### `impl Into<T>` — Accept Anything Convertible<br><span class="zh-inline">`impl Into&lt;T&gt;`：接受任何能转成目标类型的值</span>

```rust
fn connect(host: impl Into<String>, port: u16) -> Connection {
    let host = host.into();
    // ...
}
```

Use this when the function will own the value internally.<br><span class="zh-inline">当函数内部最终要拿到这个值的所有权时，就很适合用它。</span>

#### `AsRef<T>` — Borrow Flexibly<br><span class="zh-inline">`AsRef&lt;T&gt;`：灵活借用</span>

```rust
use std::path::Path;

fn file_exists(path: impl AsRef<Path>) -> bool {
    path.as_ref().exists()
}
```

Use this when the function only needs a borrowed view and does not need to keep ownership.<br><span class="zh-inline">如果函数只是想借来看看，不打算长期拥有，那就更适合 `AsRef`。</span>

#### `Cow<T>` — Borrow If You Can, Own If You Must<br><span class="zh-inline">`Cow&lt;T&gt;`：能借就借，实在不行再拥有</span>

```rust
use std::borrow::Cow;

fn normalize_message(msg: &str) -> Cow<'_, str> {
    if msg.contains('\t') || msg.contains('\r') {
        Cow::Owned(msg.replace('\t', "    ").replace('\r', ""))
    } else {
        Cow::Borrowed(msg)
    }
}
```

This pattern is ideal when most callers stay on the cheap borrowed path, but a minority need a transformed owned result.<br><span class="zh-inline">这种模式最适合那种“多数调用都能走廉价借用路径，少数情况才需要真正分配新值”的接口。</span>

#### Quick Reference<br><span class="zh-inline">快速参考</span>

| Pattern<br><span class="zh-inline">模式</span> | Ownership<br><span class="zh-inline">所有权</span> | Allocation<br><span class="zh-inline">分配</span> | Use When<br><span class="zh-inline">适用场景</span> |
|---------|-----------|------------|-------------|
| `&str` | Borrowed<br><span class="zh-inline">借用</span> | Never | Simple read-only string params<br><span class="zh-inline">简单只读字符串参数</span> |
| `impl AsRef<str>` | Borrowed | Never | Accept `&str`、`String` etc.<br><span class="zh-inline">接受多种字符串形式</span> |
| `impl Into<String>` | Owned | On conversion | Need to store internally<br><span class="zh-inline">内部要保存所有权</span> |
| `Cow<'_, str>` | Either | Only when needed | Usually borrowed, occasionally rewritten<br><span class="zh-inline">大多借用，偶尔改写</span> |

### Case Study: Designing a Public Crate API — Before & After<br><span class="zh-inline">案例：公开 crate API 的前后对比</span>

**Before**:<br><span class="zh-inline">**改造前：**</span>

```rust
fn parse_config(path: &str, format: &str, strict: bool) -> Result<Config, String> {
    todo!()
}
```

**After**:<br><span class="zh-inline">**改造后：**</span>

```rust
pub enum Format {
    Json,
    Toml,
    Yaml,
}

pub enum Strictness {
    Strict,
    Lenient,
}

pub fn parse_config(
    path: &Path,
    format: Format,
    strictness: Strictness,
) -> Result<Config, ConfigError> {
    todo!()
}
```

The new version is more verbose on paper, but much stronger in meaning: invalid values are harder to pass, booleans stop pretending to be self-documenting, and errors become structured instead of collapsing into raw strings.<br><span class="zh-inline">新版本表面上更长，但语义强度高得多：非法值更难传进来，布尔参数也不再假装自己“天生就自解释”，错误信息也从原始字符串进化成了结构化类型。</span>

### Parse, Don't Validate — `TryFrom` and Validated Types<br><span class="zh-inline">解析，而不是事后校验：`TryFrom` 与已验证类型</span>

The principle is: parse raw input at the boundary into a type that can only exist when valid, then pass that validated type around everywhere else.<br><span class="zh-inline">这条原则的意思是：在边界处把原始输入解析成“只有合法时才能存在”的类型，之后在系统内部就一直传这个已验证类型，而不是到处拿裸值再反复校验。</span>

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(u16);

impl TryFrom<u16> for Port {
    type Error = PortError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value == 0 {
            Err(PortError::Zero)
        } else {
            Ok(Port(value))
        }
    }
}
```

Once a function accepts `Port` instead of `u16`, the compiler itself starts carrying part of the validation burden for you.<br><span class="zh-inline">一旦函数参数改成接 `Port` 而不是裸 `u16`，编译器就开始帮着承担一部分校验工作了。</span>

| Approach<br><span class="zh-inline">方式</span> | Data checked?<br><span class="zh-inline">是否检查数据</span> | Compiler enforces validity?<br><span class="zh-inline">编译器是否帮助保证合法性</span> | Re-validation needed?<br><span class="zh-inline">是否需要反复校验</span> |
|----------|:---:|:---:|:---:|
| Runtime checks | ✅ | ❌ | Often yes<br><span class="zh-inline">通常需要</span> |
| Validated newtype + `TryFrom` | ✅ | ✅ | No<br><span class="zh-inline">通常不需要</span> |

### Feature Flags and Conditional Compilation<br><span class="zh-inline">特性开关与条件编译</span>

```toml
[features]
default = ["json"]
json = ["dep:serde_json"]
xml = ["dep:quick-xml"]
full = ["json", "xml"]
```

```rust
#[cfg(feature = "json")]
pub fn to_json<T: serde::Serialize>(value: &T) -> String {
    serde_json::to_string(value).unwrap()
}
```

Feature flags are for shaping optional capability, not for randomly exploding your API surface. Keep defaults small, document them clearly, and use conditional compilation to make optional dependencies truly optional.<br><span class="zh-inline">特性开关的作用，是组织“可选能力”，而不是把 API 面摊得一地都是。默认特性尽量小，文档说明尽量清楚，条件编译则要真正把可选依赖隔离开。</span>

### Workspace Organization<br><span class="zh-inline">Workspace 组织</span>

```toml
[workspace]
members = [
    "core",
    "parser",
    "server",
    "client",
    "cli",
]
```

A workspace gives you one lockfile, shared dependency versions, shared build cache, and a cleaner separation between components.<br><span class="zh-inline">workspace 带来的好处很实在：统一的 lockfile、统一的依赖版本、共享构建缓存，以及更清晰的组件边界。</span>

### `.cargo/config.toml`: Project-Level Configuration<br><span class="zh-inline">`.cargo/config.toml`：项目级 Cargo 配置</span>

This file lets you put target defaults, custom runners, cargo aliases, build environment variables, and other project-level Cargo behavior in one place.<br><span class="zh-inline">这个文件可以统一放置默认 target、自定义 runner、cargo alias、构建环境变量等项目级配置。</span>

Common use cases include:
default targets, QEMU runners, alias commands, offline mode, and build-time environment variables.<br><span class="zh-inline">常见用途包括：默认目标平台、QEMU runner、命令别名、离线模式和构建期环境变量。</span>

### Compile-Time Environment Variables: `env!()` and `option_env!()`<br><span class="zh-inline">编译期环境变量：`env!()` 与 `option_env!()`</span>

Rust can bake environment variables into the binary at compile time, which is useful for versions, commit hashes, build timestamps, and similar metadata.<br><span class="zh-inline">Rust 可以在编译期把环境变量直接塞进二进制里，这对版本号、提交哈希、构建时间戳之类元信息特别有用。</span>

```rust
const VERSION: &str = env!("CARGO_PKG_VERSION");
const BUILD_SHA: Option<&str> = option_env!("GIT_SHA");
```

### `cfg_attr`: Conditional Attributes<br><span class="zh-inline">`cfg_attr`：条件属性</span>

`cfg_attr` applies an attribute only when a condition is true, which is often cleaner than conditionally including or excluding entire items.<br><span class="zh-inline">`cfg_attr` 可以在条件成立时才附加一个属性。很多时候，它比直接把整个条目用 `#[cfg]` 包起来更细腻、更干净。</span>

```rust
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
#[derive(Debug, Clone)]
pub struct DiagResult {
    pub fc: u32,
    pub passed: bool,
    pub message: String,
}
```

### `cargo deny` and `cargo audit`: Supply-Chain Security<br><span class="zh-inline">`cargo deny` 与 `cargo audit`：供应链安全</span>

These tools help catch known CVEs, license issues, banned crates, duplicate versions, and risky dependency sources before they become production problems.<br><span class="zh-inline">这两个工具能在问题进生产前，提前把已知漏洞、许可证问题、被禁用 crate、重复版本和危险依赖源这类坑揪出来。</span>

### Doc Tests: Tests Inside Documentation<br><span class="zh-inline">文档测试：写在文档里的测试</span>

Rust doc comments can contain runnable examples. That means documentation is not just prose; it can be continuously verified as executable truth.<br><span class="zh-inline">Rust 的文档注释里可以直接塞可运行示例，这意味着文档不只是说明文字，它还能持续被验证成“真能跑的事实”。</span>

### Benchmarking with Criterion<br><span class="zh-inline">用 Criterion 做基准测试</span>

Public crate APIs often deserve dedicated benchmarks in `benches/`, especially parsers, serializers, validators, and protocol boundaries.<br><span class="zh-inline">公开 crate 的核心 API 往往值得单独放进 `benches/` 里做基准，尤其是解析器、序列化器、校验器和协议边界这些热点部分。</span>

> **Key Takeaways — Architecture & API Design**<br><span class="zh-inline">**本章要点 — 架构与 API 设计**</span>
> - Accept the most general input type you can reasonably support, and return the most specific meaningful type.<br><span class="zh-inline">参数尽量接受“合理范围内最泛”的输入类型，返回值尽量给出“语义最明确”的类型。</span>
> - Parse once at the boundary, then carry validated types throughout the system.<br><span class="zh-inline">在边界处解析一次，之后在系统内部一直传已验证类型。</span>
> - Use `#[non_exhaustive]`、`#[must_use]` and sealed traits deliberately to stabilize public APIs.<br><span class="zh-inline">合理使用 `#[non_exhaustive]`、`#[must_use]` 和 sealed trait，可以显著提升公开 API 的稳定性。</span>
> - Features, workspaces, and Cargo configuration are part of crate architecture, not just build trivia.<br><span class="zh-inline">feature、workspace 和 Cargo 配置本身就是 crate 架构的一部分，不只是构建细节。</span>

> **See also:** [Ch 9 — Error Handling](ch09-error-handling-patterns.md) and [Ch 13 — Testing](ch13-testing-and-benchmarking-patterns.md).<br><span class="zh-inline">**延伸阅读：** 相关主题还可以接着看 [第 9 章：错误处理](ch09-error-handling-patterns.md) 和 [第 13 章：测试](ch13-testing-and-benchmarking-patterns.md)。</span>

---

### Exercise: Crate API Refactoring ★★ (~30 min)<br><span class="zh-inline">练习：重构 Crate API ★★（约 30 分钟）</span>

Refactor the following stringly-typed API into one that uses `TryFrom`、newtypes, and the builder pattern:<br><span class="zh-inline">把下面这个字符串味特别重的 API 重构成使用 `TryFrom`、newtype 和 builder 模式的版本：</span>

```rust,ignore
fn create_server(host: &str, port: &str, max_conn: &str) -> Server { ... }
```

Design a `ServerConfig` with validated `Host`、`Port` and `MaxConnections` types that reject invalid values at parse time.<br><span class="zh-inline">设计一个 `ServerConfig`，并为 `Host`、`Port` 和 `MaxConnections` 定义已验证类型，在解析阶段就把非法值拦下来。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
#[derive(Debug, Clone)]
struct Host(String);

impl TryFrom<&str> for Host {
    type Error = String;
    fn try_from(s: &str) -> Result<Self, String> {
        if s.is_empty() { return Err("host cannot be empty".into()); }
        if s.contains(' ') { return Err("host cannot contain spaces".into()); }
        Ok(Host(s.to_string()))
    }
}

#[derive(Debug, Clone, Copy)]
struct Port(u16);

impl TryFrom<u16> for Port {
    type Error = String;
    fn try_from(p: u16) -> Result<Self, String> {
        if p == 0 { return Err("port must be >= 1".into()); }
        Ok(Port(p))
    }
}
```

</details>

***
