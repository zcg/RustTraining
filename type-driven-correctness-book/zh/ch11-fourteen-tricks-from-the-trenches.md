# Fourteen Tricks from the Trenches 🟡<br><span class="zh-inline">来自一线实战的十四个技巧 🟡</span>

> **What you'll learn:** Fourteen smaller correct-by-construction techniques — from sentinel elimination and sealed traits to session types, `Pin`, RAII, and `#[must_use]` — each eliminating a specific bug class for near-zero effort.<br><span class="zh-inline">**本章将学到什么：** 这里整理了十四个更小但很值钱的 correct-by-construction 技巧，从消灭哨兵值、sealed trait，一直到 session type、`Pin`、RAII 和 `#[must_use]`。每一个技巧都瞄准某一类具体 bug，而且引入成本都很低。</span>
>
> **Cross-references:** [ch02](ch02-typed-command-interfaces-request-determi.md) (sealed traits extend ch02), [ch05](ch05-protocol-state-machines-type-state-for-r.md) (typestate builder extends ch05), [ch07](ch07-validated-boundaries-parse-dont-validate.md) (FromStr extends ch07)<br><span class="zh-inline">**交叉阅读：** [ch02](ch02-typed-command-interfaces-request-determi.md) 里的 sealed trait 延伸用法，[ch05](ch05-protocol-state-machines-type-state-for-r.md) 里的 typestate builder，以及 [ch07](ch07-validated-boundaries-parse-dont-validate.md) 里的 `FromStr` 解析边界。</span>

## Fourteen Tricks from the Trenches<br><span class="zh-inline">十四个来自一线的技巧</span>

The eight core patterns from chapters 2 through 9 cover the big ideas. This chapter gathers fourteen smaller but repeatedly useful tricks that appear all over production Rust code. Each one removes a specific bug class for near-zero or very low cost.<br><span class="zh-inline">第 2 到第 9 章讲的是那几种核心模式。这一章收的则是十四个更小、却会在生产 Rust 代码里反复出现的技巧。它们没有那么“宏大”，但都非常实用，而且每个都能用很低的代价消掉一类具体 bug。</span>

### Trick 1 — Sentinel → `Option` at the Boundary<br><span class="zh-inline">技巧 1：在边界处把哨兵值变成 `Option`</span>

Hardware protocols里到处都是哨兵值：IPMI 用 `0xFF` 表示“传感器不存在”，PCI 用 `0xFFFF` 表示“没有设备”，SMBIOS 用 `0x00` 表示“未知”。如果把这些特殊值当普通整数一路带进业务代码，每个消费方都得记住那个魔法常量。只要漏掉一次比较，就会冒出一个凭空出现的 255 °C 读数，或者来一次离谱的 vendor ID 命中。<br><span class="zh-inline">这类问题的本质不是“值不对”，而是“语义没被编码进类型里”。</span>

**The rule:** Convert sentinels to `Option` at the very first parse boundary, and convert back to the sentinel only at the serialization boundary.<br><span class="zh-inline">**规则就是一句话：** 在第一次解析边界把哨兵值转成 `Option`，只有在最后序列化回协议格式时，才把 `None` 重新转回哨兵值。</span>

#### The anti-pattern (from `pcie_tree/src/lspci.rs`)<br><span class="zh-inline">反模式（来自 `pcie_tree/src/lspci.rs`）</span>

```rust,ignore
// Sentinel carried internally — every comparison must remember
let mut current_vendor_id: u16 = 0xFFFF;
let mut current_device_id: u16 = 0xFFFF;

// ... later, parsing fails silently ...
current_vendor_id = u16::from_str_radix(hex, 16)
    .unwrap_or(0xFFFF);  // sentinel hides the error
```

Every function that receives `current_vendor_id` now has to remember that `0xFFFF` is special. If someone forgets once, the bug slips through silently.<br><span class="zh-inline">这样一来，所有拿到 `current_vendor_id` 的函数都得记住 `0xFFFF` 不是普通值，而是“特殊空值”。只要有人忘一次，逻辑就会静悄悄跑歪。</span>

#### The correct pattern (from `nic_sel/src/events.rs`)<br><span class="zh-inline">正确模式（来自 `nic_sel/src/events.rs`）</span>

```rust,ignore
pub struct ThermalEvent {
    pub record_id: u16,
    pub temperature: Option<u8>,  // None if sensor reports 0xFF
}

impl ThermalEvent {
    pub fn from_raw(record_id: u16, raw_temp: u8) -> Self {
        ThermalEvent {
            record_id,
            temperature: if raw_temp != 0xFF {
                Some(raw_temp)
            } else {
                None
            },
        }
    }
}
```

Now every consumer is forced to handle the missing-value case because the type system exposes it explicitly.<br><span class="zh-inline">现在调用方必须显式处理缺失值，因为类型系统已经把“可能没有温度”这件事写在了类型上。</span>

```rust,ignore
// Safe — compiler ensures we handle missing temps
fn is_overtemp(temp: Option<u8>, threshold: u8) -> bool {
    temp.map_or(false, |t| t > threshold)
}

// Forgetting to handle None is a compile error:
// fn bad_check(temp: Option<u8>, threshold: u8) -> bool {
//     temp > threshold  // ERROR: can't compare Option<u8> with u8
// }
```

#### Real-world impact<br><span class="zh-inline">实际影响</span>

`inventory/src/events.rs` 里 GPU 热告警也用的是同一个思路：<br><span class="zh-inline">收到原始字节以后，先把 `0xFF` 折叠成 `None`，后面谁用谁老实处理空值。</span>

```rust,ignore
temperature: if data[1] != 0xFF {
    Some(data[1] as i8)
} else {
    None
},
```

The refactoring of `pcie_tree/src/lspci.rs` is straightforward: change `u16` to `Option<u16>`, replace `0xFFFF` with `None`, and let the compiler point out every place that still assumes the old encoding.<br><span class="zh-inline">把 `pcie_tree/src/lspci.rs` 改成这个模式其实不复杂：把 `u16` 换成 `Option<u16>`，把 `0xFFFF` 换成 `None`，剩下的事就交给编译器，它会把所有还在按旧语义写代码的地方一个个揪出来。</span>

| Before<br><span class="zh-inline">之前</span> | After<br><span class="zh-inline">之后</span> |
|--------|-------|
| `let mut vendor_id: u16 = 0xFFFF` | `let mut vendor_id: Option<u16> = None` |
| `.unwrap_or(0xFFFF)` | `.ok()` (already returns `Option`)<br><span class="zh-inline">`.ok()`，直接得到 `Option`</span> |
| `if vendor_id != 0xFFFF { ... }` | `if let Some(vid) = vendor_id { ... }` |
| Serialization: `vendor_id` | `vendor_id.unwrap_or(0xFFFF)` |

***

### Trick 2 — Sealed Traits<br><span class="zh-inline">技巧 2：Sealed Traits</span>

Chapter 2 里讲过 `IpmiCmd` 这种带关联类型的 trait，它能把每条命令和自己的响应类型绑死。但这里有个口子：如果任何外部代码都能实现 `IpmiCmd`，就总有人可能写出一个 `parse_response` 完全胡来的实现，整套类型安全就得建立在“所有实现者都很自觉”这种脆弱假设上。<br><span class="zh-inline">sealed trait 的作用，就是把这个口子焊死。</span>

A sealed trait works by requiring a private supertrait that only the current crate can implement:<br><span class="zh-inline">sealed trait 的做法很简单：让公开 trait 依赖一个私有 supertrait，而这个私有 trait 只有当前 crate 才能实现。</span>

```rust,ignore
// — Private module: not exported from the crate —
mod private {
    pub trait Sealed {}
}

// — Public trait: requires Sealed, which outsiders can't implement —
pub trait IpmiCmd: private::Sealed {
    type Response;
    fn net_fn(&self) -> u8;
    fn cmd_byte(&self) -> u8;
    fn payload(&self) -> Vec<u8>;
    fn parse_response(&self, raw: &[u8]) -> io::Result<Self::Response>;
}
```

Inside your own crate, you opt specific types in explicitly:<br><span class="zh-inline">在自己 crate 内部，只给批准过的类型显式开口子。</span>

```rust,ignore
pub struct ReadTemp { pub sensor_id: u8 }
impl private::Sealed for ReadTemp {}

impl IpmiCmd for ReadTemp {
    type Response = Celsius;
    fn net_fn(&self) -> u8 { 0x04 }
    fn cmd_byte(&self) -> u8 { 0x2D }
    fn payload(&self) -> Vec<u8> { vec![self.sensor_id] }
    fn parse_response(&self, raw: &[u8]) -> io::Result<Celsius> {
        if raw.is_empty() { return Err(io::Error::new(io::ErrorKind::InvalidData, "empty")); }
        Ok(Celsius(raw[0] as f64))
    }
}
```

External code can still call the trait, but cannot implement it:<br><span class="zh-inline">外部代码仍然能调用这个 trait 的 API，但再也不能私自实现它。</span>

```rust,ignore
// In another crate:
struct EvilCmd;
// impl private::Sealed for EvilCmd {}  // ERROR: module `private` is private
// impl IpmiCmd for EvilCmd { ... }     // ERROR: `Sealed` is not satisfied
```

#### When to seal<br><span class="zh-inline">什么时候该封住</span>

| Seal when…<br><span class="zh-inline">适合封住</span> | Don't seal when…<br><span class="zh-inline">不适合封住</span> |
|-----------|-----------------|
| Safety depends on correct implementation<br><span class="zh-inline">安全性依赖实现是否正确</span> | Users should extend the system<br><span class="zh-inline">本来就希望用户扩展系统</span> |
| Associated types must satisfy invariants<br><span class="zh-inline">关联类型要满足一组不变量</span> | The trait is only a simple capability marker<br><span class="zh-inline">trait 只是个轻量 capability marker</span> |
| You own the canonical set of implementations<br><span class="zh-inline">实现集合应该由当前 crate 统一掌控</span> | Third-party plugins are a design goal<br><span class="zh-inline">第三方插件就是设计目标</span> |

#### Real-world candidates<br><span class="zh-inline">典型候选对象</span>

- `IpmiCmd` — incorrect parsing can corrupt typed responses<br><span class="zh-inline">`IpmiCmd`：解析错了会直接污染强类型响应</span>
- `DiagModule` — framework assumes `run()` returns valid records<br><span class="zh-inline">`DiagModule`：框架默认 `run()` 返回的是合法诊断记录</span>
- `SelEventFilter` — a broken filter may swallow critical SEL events<br><span class="zh-inline">`SelEventFilter`：实现写坏了可能把关键 SEL 事件吞掉</span>

***

### Trick 3 — `#[non_exhaustive]` for Evolving Enums<br><span class="zh-inline">技巧 3：给会演化的枚举加 `#[non_exhaustive]`</span>

`SkuVariant` 这类枚举很容易随着产品代次增长而扩张。今天也许只有五个变体，明天就会多出一个 `S4001`。如果外部代码把它写成完全穷举匹配，那么一加新变体，下游就会立刻编译失败。这个失败本身并不坏，问题在于：有时更希望外部调用方提前准备好兜底分支。<br><span class="zh-inline">`#[non_exhaustive]` 的意义，就是强制跨 crate 的消费者保留一个“未来可能新增”的后备分支。</span>

```rust,ignore
// In gpu_sel crate (the defining crate):
#[non_exhaustive]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SkuVariant {
    S1001,
    S2001,
    S2002,
    S2003,
    S3001,
    // When the next SKU ships, add it here.
    // External consumers already have a wildcard — zero breakage for them.
}

// Within gpu_sel itself — exhaustive match is allowed (no wildcard needed):
fn diag_path_internal(sku: SkuVariant) -> &'static str {
    match sku {
        SkuVariant::S1001 => "legacy_gen1",
        SkuVariant::S2001 => "gen2_accel_diag",
        SkuVariant::S2002 => "gen2_alt_diag",
        SkuVariant::S2003 => "gen2_alt_hf_diag",
        SkuVariant::S3001 => "gen3_accel_diag",
        // No wildcard needed inside the defining crate.
        // Adding S4001 here will cause a compile error at this match,
        // which is exactly what you want — it forces you to update it.
    }
}
```

```rust,ignore
// In the binary crate (a downstream crate that depends on inventory):
fn diag_path_external(sku: inventory::SkuVariant) -> &'static str {
    match sku {
        inventory::SkuVariant::S1001 => "legacy_gen1",
        inventory::SkuVariant::S2001 => "gen2_accel_diag",
        inventory::SkuVariant::S2002 => "gen2_alt_diag",
        inventory::SkuVariant::S2003 => "gen2_alt_hf_diag",
        inventory::SkuVariant::S3001 => "gen3_accel_diag",
        _ => "generic_diag",  // REQUIRED by #[non_exhaustive] for external crates
    }
}
```

Inside the defining crate, exhaustive matching is still allowed. Outside the crate, callers are forced to keep a wildcard arm for future growth.<br><span class="zh-inline">在定义这个枚举的 crate 内部，依然可以穷举匹配；但到了外部 crate，调用方就必须写 wildcard 分支，提前给未来扩展留口子。</span>

> **Workspace tip:** `#[non_exhaustive]` only helps across crate boundaries. If everything lives in one crate, it does nothing.<br><span class="zh-inline">**工作区里的一个提醒：** `#[non_exhaustive]` 只对跨 crate 边界生效。如果所有代码都塞在一个 crate 里，这个属性基本帮不上忙。</span>

#### Candidates<br><span class="zh-inline">适合的枚举</span>

| Enum<br><span class="zh-inline">枚举</span> | Module<br><span class="zh-inline">模块</span> | Why<br><span class="zh-inline">原因</span> |
|------|--------|-----|
| `SkuVariant` | `inventory`, `net_inventory` | New SKUs every generation<br><span class="zh-inline">每一代都可能加新 SKU</span> |
| `SensorType` | `protocol_lib` | IPMI spec reserves OEM ranges<br><span class="zh-inline">IPMI 规范本来就给 OEM 留了扩展空间</span> |
| `CompletionCode` | `protocol_lib` | Vendors add custom completion codes<br><span class="zh-inline">厂商经常自己加 completion code</span> |
| `Component` | `event_handler` | Hardware categories keep growing<br><span class="zh-inline">硬件类别会持续增加</span> |

***

### Trick 4 — Typestate Builder<br><span class="zh-inline">技巧 4：Typestate Builder</span>

Chapter 5 用 typestate 约束过协议生命周期。其实 builder 也一样适合用这套思路。凡是那种“某几个字段必须先填完，最后才能 `build()` 或 `finish()`”的构造器，都可以拿 typestate 做成编译期约束。<br><span class="zh-inline">说白了，就是别让“半成品对象”溜出构造阶段。</span>

#### The problem with fluent builders<br><span class="zh-inline">流式 builder 的典型问题</span>

```rust,ignore
// Current fluent builder — finish() always available
pub struct DerBuilder {
    der: Der,
}

impl DerBuilder {
    pub fn new(marker: &str, fault_code: u32) -> Self { ... }
    pub fn mnemonic(mut self, m: &str) -> Self { ... }
    pub fn fault_class(mut self, fc: &str) -> Self { ... }
    pub fn finish(self) -> Der { self.der }  // ← always callable!
}
```

This style compiles, but it also happily allows incomplete values to escape:<br><span class="zh-inline">这种写法看上去很顺滑，但问题也很明显：`finish()` 任何时候都能调，所以半成品对象会直接漏出来。</span>

```rust,ignore
let bad = DerBuilder::new("CSI_ERR", 62691)
    .finish();  // oops — no mnemonic, no fault_class
```

#### Typestate builder: `finish()` requires both fields<br><span class="zh-inline">Typestate builder：只有字段都准备好以后才能 `finish()`</span>

```rust,ignore
pub struct Missing;
pub struct Set<T>(T);

pub struct DerBuilder<Mnemonic, FaultClass> {
    marker: String,
    fault_code: u32,
    mnemonic: Mnemonic,
    fault_class: FaultClass,
    description: Option<String>,
}

// Constructor: starts with both required fields Missing
impl DerBuilder<Missing, Missing> {
    pub fn new(marker: &str, fault_code: u32) -> Self {
        DerBuilder {
            marker: marker.to_string(),
            fault_code,
            mnemonic: Missing,
            fault_class: Missing,
            description: None,
        }
    }
}

// Set mnemonic (works regardless of fault_class's state)
impl<FC> DerBuilder<Missing, FC> {
    pub fn mnemonic(self, m: &str) -> DerBuilder<Set<String>, FC> {
        DerBuilder {
            marker: self.marker, fault_code: self.fault_code,
            mnemonic: Set(m.to_string()),
            fault_class: self.fault_class,
            description: self.description,
        }
    }
}

// Set fault_class (works regardless of mnemonic's state)
impl<MN> DerBuilder<MN, Missing> {
    pub fn fault_class(self, fc: &str) -> DerBuilder<MN, Set<String>> {
        DerBuilder {
            marker: self.marker, fault_code: self.fault_code,
            mnemonic: self.mnemonic,
            fault_class: Set(fc.to_string()),
            description: self.description,
        }
    }
}

// Optional fields — available in ANY state
impl<MN, FC> DerBuilder<MN, FC> {
    pub fn description(mut self, desc: &str) -> Self {
        self.description = Some(desc.to_string());
        self
    }
}

/// The fully-built DER record.
pub struct Der {
    pub marker: String,
    pub fault_code: u32,
    pub mnemonic: String,
    pub fault_class: String,
    pub description: Option<String>,
}

// finish() ONLY available when both required fields are Set
impl DerBuilder<Set<String>, Set<String>> {
    pub fn finish(self) -> Der {
        Der {
            marker: self.marker,
            fault_code: self.fault_code,
            mnemonic: self.mnemonic.0,
            fault_class: self.fault_class.0,
            description: self.description,
        }
    }
}
```

Now the missing-field bug becomes a compile error rather than a review comment or a runtime surprise.<br><span class="zh-inline">这样一来，漏字段不再是“靠人眼看出来”的问题，而是编译器直接报错。</span>

```rust,ignore
// ✅ Compiles — both required fields set (in any order)
let der = DerBuilder::new("CSI_ERR", 62691)
    .fault_class("GPU Module")   // order doesn't matter
    .mnemonic("ACCEL_CARD_ER691")
    .description("Thermal throttle")
    .finish();

// ❌ Compile error — finish() doesn't exist on DerBuilder<Set<String>, Missing>
let bad = DerBuilder::new("CSI_ERR", 62691)
    .mnemonic("ACCEL_CARD_ER691")
    .finish();  // ERROR: method `finish` not found
```

#### When to use typestate builders<br><span class="zh-inline">什么时候该上 typestate builder</span>

| Use when…<br><span class="zh-inline">适合用</span> | Don't bother when…<br><span class="zh-inline">不值得用</span> |
|-----------|-------------------|
| Omitting a field causes silent bugs<br><span class="zh-inline">漏字段会产生隐蔽 bug</span> | All fields have sensible defaults<br><span class="zh-inline">所有字段都有靠谱默认值</span> |
| The builder is part of a public API<br><span class="zh-inline">builder 属于公开 API</span> | It is only test scaffolding<br><span class="zh-inline">只是测试脚手架</span> |
| There are multiple required fields<br><span class="zh-inline">有多个必填字段</span> | Only one required field exists<br><span class="zh-inline">只有一个必填字段</span> |

***

### Trick 5 — `FromStr` as a Validation Boundary<br><span class="zh-inline">技巧 5：把 `FromStr` 当成字符串输入的验证边界</span>

Chapter 7 讲的是 `TryFrom<&[u8]>` 这种二进制边界。那字符串输入呢？配置文件、CLI 参数、JSON 字段、环境变量，这些地方最自然的边界其实就是 `FromStr`。<br><span class="zh-inline">一句话：字符串一进来就解析成强类型，别拖着裸 `&str` 到处跑。</span>

#### The problem<br><span class="zh-inline">问题</span>

```rust,ignore
// C++ / unvalidated Rust: silently falls through to a default
fn route_diag(level: &str) -> DiagMode {
    if level == "quick" { ... }
    else if level == "standard" { ... }
    else { QuickMode }  // typo in config?  ¯\_(ツ)_/¯
}
```

If the config contains `"extendedd"` with an extra `d`, that typo silently degrades to some default mode.<br><span class="zh-inline">如果配置里把 `extended` 拼成了 `extendedd`，这种代码不会报错，只会悄悄回落到默认模式，最后查半天都找不到锅在哪。</span>

#### The pattern (from `config_loader/src/diag.rs`)<br><span class="zh-inline">正确模式（来自 `config_loader/src/diag.rs`）</span>

```rust,ignore
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiagLevel {
    Quick,
    Standard,
    Extended,
    Stress,
}

impl FromStr for DiagLevel {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "quick"    | "1" => Ok(DiagLevel::Quick),
            "standard" | "2" => Ok(DiagLevel::Standard),
            "extended" | "3" => Ok(DiagLevel::Extended),
            "stress"   | "4" => Ok(DiagLevel::Stress),
            other => Err(format!("unknown diag level: '{other}'")),
        }
    }
}
```

Now mistakes are caught immediately at the parsing boundary.<br><span class="zh-inline">这样一来，拼错、填错、乱填的输入会在解析边界立刻炸出来，而不是混进后面几层逻辑里。</span>

```rust,ignore
let level: DiagLevel = "extendedd".parse()?;
// Err("unknown diag level: 'extendedd'")
```

#### The three benefits<br><span class="zh-inline">三个直接收益</span>

1. **Fail-fast** — bad input dies at the boundary.<br><span class="zh-inline">**尽早失败**：坏输入当场拦住。</span>
2. **Aliases stay explicit** — every accepted string sits in one place.<br><span class="zh-inline">**别名映射集中可见**：接受哪些别名，全写在一个 `match` 里。</span>
3. **`.parse()` stays ergonomic** — callers get a neat one-liner.<br><span class="zh-inline">**调用形式很顺手**：调用方可以直接 `parse()`。</span>

#### Real codebase usage<br><span class="zh-inline">项目里的真实用法</span>

The codebase already contains several `FromStr` implementations:<br><span class="zh-inline">项目里已经有不少 `FromStr` 实现了，说明这不是理论玩法，而是现成实践。</span>

| Type<br><span class="zh-inline">类型</span> | Module<br><span class="zh-inline">模块</span> | Notable aliases<br><span class="zh-inline">典型别名</span> |
|------|--------|----------------|
| `DiagLevel` | `config_loader` | `"1"` = Quick, `"4"` = Stress |
| `Component` | `event_handler` | `"MEM"` / `"DIMM"` = Memory, `"SSD"` / `"NVME"` = Disk |
| `SkuVariant` | `net_inventory` | `"Accel-X1"` = S2001, `"Accel-M1"` = S2002, `"Accel-Z1"` = S3001 |
| `SkuVariant` | `inventory` | Same aliases in another module<br><span class="zh-inline">另一个模块里也做了相同映射</span> |
| `FaultStatus` | `config_loader` | Fault lifecycle states<br><span class="zh-inline">故障生命周期状态</span> |
| `DiagAction` | `config_loader` | Remediation action types<br><span class="zh-inline">修复动作类型</span> |
| `ActionType` | `config_loader` | Action categories<br><span class="zh-inline">动作类别</span> |
| `DiagMode` | `cluster_diag` | Multi-node test modes<br><span class="zh-inline">多节点测试模式</span> |

The contrast with `TryFrom` is mostly about input shape:<br><span class="zh-inline">它和 `TryFrom` 的区别，主要就在输入形态上。</span>

| | `TryFrom<&[u8]>` | `FromStr` |
|---|---|---|
| Input | Raw bytes (binary protocols)<br><span class="zh-inline">原始字节</span> | Strings (configs, CLI, JSON)<br><span class="zh-inline">字符串</span> |
| Typical source | IPMI, PCIe config space, FRU<br><span class="zh-inline">IPMI、PCIe 配置空间、FRU</span> | JSON fields, env vars, user input<br><span class="zh-inline">JSON 字段、环境变量、用户输入</span> |
| Both use | `Result`<br><span class="zh-inline">两者本质上都用 `Result` 强迫调用方处理非法输入</span> | `Result` |

***

### Trick 6 — Const Generics for Compile-Time Size Validation<br><span class="zh-inline">技巧 6：用 Const Generics 做编译期尺寸校验</span>

Whenever hardware buffers, register banks, or protocol frames have fixed sizes, const generics let the compiler carry those sizes in the type itself.<br><span class="zh-inline">只要是固定尺寸的硬件缓冲区、寄存器组、协议帧，const generics 就很适合，因为它能把“尺寸”直接塞进类型里。</span>

```rust,ignore
/// A fixed-size register bank. The size is part of the type.
/// `RegisterBank<256>` and `RegisterBank<4096>` are different types.
pub struct RegisterBank<const N: usize> {
    data: [u8; N],
}

impl<const N: usize> RegisterBank<N> {
    /// Read a register at the given offset.
    /// Compile-time: N is known, so the array size is fixed.
    /// Runtime: only the offset is checked.
    pub fn read(&self, offset: usize) -> Option<u8> {
        self.data.get(offset).copied()
    }
}

// PCIe conventional config space: 256 bytes
type PciConfigSpace = RegisterBank<256>;

// PCIe extended config space: 4096 bytes
type PcieExtConfigSpace = RegisterBank<4096>;

// These are different types — can't accidentally pass one for the other:
fn read_extended_cap(config: &PcieExtConfigSpace, offset: usize) -> Option<u8> {
    config.read(offset)
}
// read_extended_cap(&pci_config, 0x100);
//                   ^^^^^^^^^^^ expected RegisterBank<4096>, found RegisterBank<256> ❌
```

The key win is that `RegisterBank<256>` and `RegisterBank<4096>` are no longer the same thing. Once size becomes part of the type, mixing them up stops compiling.<br><span class="zh-inline">真正的好处在于：`RegisterBank<256>` 和 `RegisterBank<4096>` 已经不是“长得像”的两个值，而是完全不同的类型。尺寸一旦进了类型系统，传错对象就直接编不过。</span>

```rust,ignore
/// NVMe admin commands use 4096-byte buffers. Enforce at compile time.
pub struct NvmeBuffer<const N: usize> {
    data: Box<[u8; N]>,
}

impl<const N: usize> NvmeBuffer<N> {
    pub fn new() -> Self {
        // Runtime assertion: only 512 or 4096 allowed
        assert!(N == 4096 || N == 512, "NVMe buffers must be 512 or 4096 bytes");
        NvmeBuffer { data: Box::new([0u8; N]) }
    }
}
// NvmeBuffer::<1024>::new();  // panics at runtime with this form
// For true compile-time enforcement, see Trick 9 (const assertions).
```

> **When to use:** Fixed-size protocol buffers, DMA descriptors, hardware FIFO depths, or any size that is a hardware invariant rather than a runtime choice.<br><span class="zh-inline">**适用场景：** 固定尺寸协议缓冲区、DMA 描述符、硬件 FIFO 深度，或者任何“本来就是硬件常量”的尺寸。</span>

***

### Trick 7 — Safe Wrappers Around `unsafe`<br><span class="zh-inline">技巧 7：给 `unsafe` 套安全包装</span>

The current project may not use `unsafe` yet, but once MMIO, DMA, or FFI shows up, `unsafe` is unavoidable. The correct-by-construction move is simple: keep every `unsafe` block behind a safe wrapper so callers can't trigger UB by accident.<br><span class="zh-inline">当前项目也许还没有 `unsafe`，但一旦开始碰 MMIO、DMA 或 FFI，`unsafe` 迟早会出现。正确的做法不是幻想“永远不用”，而是把所有 `unsafe` 都收进安全包装层里，让调用方别直接接触未定义行为风险。</span>

```rust,ignore
/// MMIO-mapped register. The pointer is valid for the lifetime of the mapping.
/// All unsafe is contained in this module — callers use safe methods.
pub struct MmioRegion {
    base: *mut u8,
    len: usize,
}

impl MmioRegion {
    /// # Safety
    /// - `base` must be a valid pointer to an MMIO-mapped region
    /// - The region must remain mapped for the lifetime of this struct
    /// - No other code may alias this region
    pub unsafe fn new(base: *mut u8, len: usize) -> Self {
        MmioRegion { base, len }
    }

    /// Safe read — bounds checking prevents out-of-bounds MMIO access.
    pub fn read_u32(&self, offset: usize) -> Option<u32> {
        if offset + 4 > self.len { return None; }
        // SAFETY: offset is bounds-checked above, base is valid per new() contract
        Some(unsafe {
            core::ptr::read_volatile(self.base.add(offset) as *const u32)
        })
    }

    /// Safe write — bounds checking prevents out-of-bounds MMIO access.
    pub fn write_u32(&self, offset: usize, value: u32) -> bool {
        if offset + 4 > self.len { return false; }
        // SAFETY: offset is bounds-checked above, base is valid per new() contract
        unsafe {
            core::ptr::write_volatile(self.base.add(offset) as *mut u32, value);
        }
        true
    }
}
```

Combine that with phantom types to encode read-only vs read-write permissions at the type level:<br><span class="zh-inline">再往上叠一层 phantom type，还能把只读和可写权限继续编码进类型里。</span>

```rust,ignore
use std::marker::PhantomData;

pub struct ReadOnly;
pub struct ReadWrite;

pub struct TypedMmio<Perm> {
    region: MmioRegion,
    _perm: PhantomData<Perm>,
}

impl TypedMmio<ReadOnly> {
    pub fn read_u32(&self, offset: usize) -> Option<u32> {
        self.region.read_u32(offset)
    }
    // No write method — compile error if you try to write to a ReadOnly region
}

impl TypedMmio<ReadWrite> {
    pub fn read_u32(&self, offset: usize) -> Option<u32> {
        self.region.read_u32(offset)
    }
    pub fn write_u32(&self, offset: usize, value: u32) -> bool {
        self.region.write_u32(offset, value)
    }
}
```

> **Guidelines for `unsafe` wrappers:**<br><span class="zh-inline">**给 `unsafe` 包装层立的几条规矩：**</span>
>
> | Rule<br><span class="zh-inline">规则</span> | Why<br><span class="zh-inline">原因</span> |
> |------|-----|
> | One `unsafe fn new()` with documented invariants | Caller takes responsibility once<br><span class="zh-inline">调用方只在入口承担一次责任</span> |
> | All other methods are safe | Callers cannot trigger UB directly<br><span class="zh-inline">调用方不会直接踩进 UB</span> |
> | Add `# SAFETY:` comments on each `unsafe` block | Auditors can verify locally<br><span class="zh-inline">审查时能就地确认假设是否成立</span> |
> | Use `#[deny(unsafe_op_in_unsafe_fn)]` | Force explicit unsafe operations even inside unsafe fns<br><span class="zh-inline">即使在 `unsafe fn` 里也强迫把危险操作单独标明</span> |
> | Run tools like Miri when possible | Check memory-model assumptions<br><span class="zh-inline">验证内存模型假设</span> |

---

### Checkpoint: Tricks 1–7<br><span class="zh-inline">阶段检查：前 7 个技巧</span>

At this point, seven everyday tricks are already on the table:<br><span class="zh-inline">到这里为止，前七个技巧已经足够在日常代码里立刻开干了。</span>

| Trick<br><span class="zh-inline">技巧</span> | Bug class eliminated<br><span class="zh-inline">消灭的 bug 类型</span> | Effort to adopt<br><span class="zh-inline">引入成本</span> |
|:-----:|----------------------|:---------------:|
| 1 | Sentinel confusion<br><span class="zh-inline">哨兵值混淆</span> | Low<br><span class="zh-inline">低</span> |
| 2 | Unauthorized trait impls<br><span class="zh-inline">不受控 trait 实现</span> | Low<br><span class="zh-inline">低</span> |
| 3 | Broken consumers after enum growth<br><span class="zh-inline">枚举扩张后下游崩裂</span> | Low<br><span class="zh-inline">低</span> |
| 4 | Missing builder fields<br><span class="zh-inline">builder 漏字段</span> | Medium<br><span class="zh-inline">中</span> |
| 5 | Typos in string configs<br><span class="zh-inline">字符串配置拼写错误</span> | Low<br><span class="zh-inline">低</span> |
| 6 | Wrong buffer sizes<br><span class="zh-inline">缓冲区尺寸写错</span> | Low<br><span class="zh-inline">低</span> |
| 7 | Unsafe scattered everywhere<br><span class="zh-inline">`unsafe` 四处散落</span> | Medium<br><span class="zh-inline">中</span> |

Tricks 8–14 are more advanced: they involve async ownership, const evaluation, session types, `Pin`, and `Drop`. But the first seven are already high-value and low-friction enough to adopt immediately.<br><span class="zh-inline">后面的 8 到 14 个技巧会更偏进阶，涉及 async 所有权、const 求值、session type、`Pin` 和 `Drop`。不过前面这七个已经足够高价值，而且上手阻力很低，完全可以明天就开始在项目里用。</span>

***

### Trick 8 — Async Type-State Machines<br><span class="zh-inline">技巧 8：异步 Type-State 状态机</span>

当硬件驱动开始使用 `async`，比如异步 BMC 通信、异步 NVMe I/O，type-state 这套思路仍然成立；只是 `.await` 跨越点上的所有权更需要拿捏清楚。<br><span class="zh-inline">核心要点是：状态转换最好消耗旧状态，并在异步完成后返回新状态，这样生命周期和所有权都清清楚楚。</span>

```rust,ignore
use std::marker::PhantomData;

pub struct Idle;
pub struct Authenticating;
pub struct Active;

pub struct AsyncSession<S> {
    host: String,
    _state: PhantomData<S>,
}

impl AsyncSession<Idle> {
    pub fn new(host: &str) -> Self {
        AsyncSession { host: host.to_string(), _state: PhantomData }
    }

    /// Transition Idle → Authenticating → Active.
    /// The Session is consumed (moved into the future) across the .await.
    pub async fn authenticate(self, user: &str, pass: &str)
        -> Result<AsyncSession<Active>, String>
    {
        // Phase 1: send credentials (consumes Idle session)
        let pending: AsyncSession<Authenticating> = AsyncSession {
            host: self.host,
            _state: PhantomData,
        };

        // Simulate async BMC authentication
        // tokio::time::sleep(Duration::from_secs(1)).await;

        // Phase 2: return Active session
        Ok(AsyncSession {
            host: pending.host,
            _state: PhantomData,
        })
    }
}

impl AsyncSession<Active> {
    pub async fn send_command(&mut self, cmd: &[u8]) -> Vec<u8> {
        // async I/O here...
        vec![0x00]
    }
}

// Usage:
// let session = AsyncSession::new("192.168.1.100");
// let mut session = session.authenticate("admin", "pass").await?;
// let resp = session.send_command(&[0x04, 0x2D]).await;
```

异步版本里最容易犯的毛病，是一边想保留旧状态，一边又想跨 `.await` 借用它，最后把借用关系拧成死结。上面这类“按值消费、返回下一个状态”的写法，通常最省事。<br><span class="zh-inline">换句话说，异步 type-state 最怕“半借半移”，最稳妥的模式还是显式转移所有权。</span>

#### Async type-state 的几条规则<br><span class="zh-inline">Async type-state 的几条规则</span>

| Rule<br><span class="zh-inline">规则</span> | Why<br><span class="zh-inline">原因</span> |
|------|-----|
| Transition methods take `self` by value<br><span class="zh-inline">状态迁移方法按值接收 `self`</span> | Ownership transfer works cleanly across `.await`<br><span class="zh-inline">跨 `.await` 的所有权转移更清晰</span> |
| Return previous state on recoverable failures when needed<br><span class="zh-inline">可恢复失败时按需把旧状态还回来</span> | Caller can retry instead of rebuilding everything<br><span class="zh-inline">调用方可以重试，而不是重建整个会话</span> |
| Keep one future owning one session<br><span class="zh-inline">一个 future 最好只拥有一个会话状态</span> | Avoid split-brain state across async tasks<br><span class="zh-inline">避免异步任务之间状态撕裂</span> |
| Add `Send + 'static` bounds before `tokio::spawn`<br><span class="zh-inline">要交给 `tokio::spawn` 前补上 `Send + 'static` 约束</span> | Spawned tasks may move across threads<br><span class="zh-inline">被调度的任务可能跨线程移动</span> |

> **Caveat:** If a failed authentication should let the caller retry with the same session, return something like `Result<AsyncSession&lt;Active&gt;, (Error, AsyncSession&lt;Idle&gt;)>`.<br><span class="zh-inline">**提醒：** 如果认证失败后还想保留原始会话继续重试，就把旧状态放进错误返回值里，例如 `Result&lt;AsyncSession&lt;Active&gt;, (Error, AsyncSession&lt;Idle&gt;)&gt;`。</span>

***

### Trick 9 — Refinement Types via Const Assertions<br><span class="zh-inline">技巧 9：用 Const 断言实现精化类型</span>

有些数值约束根本就是编译期常量，而不是运行时输入。对这种约束，最省心的办法是直接在 `const` 求值阶段把非法值卡死。<br><span class="zh-inline">它和前面的 const generics 很像，但目标更尖锐：不是“区分不同尺寸的类型”，而是“让非法常量根本过不了编译”。</span>

```rust,ignore
/// A sensor ID that must be in the IPMI SDR range (0x01..=0xFE).
/// The constraint is checked at compile time when `N` is const.
pub struct SdrSensorId<const N: u8>;

impl<const N: u8> SdrSensorId<N> {
    /// Compile-time validation: panics during compilation if N is out of range.
    pub const fn validate() {
        assert!(N >= 0x01, "Sensor ID must be >= 0x01");
        assert!(N <= 0xFE, "Sensor ID must be <= 0xFE (0xFF is reserved)");
    }

    pub const VALIDATED: () = Self::validate();

    pub const fn value() -> u8 { N }
}

// Usage:
fn read_sensor_const<const N: u8>() -> f64 {
    let _ = SdrSensorId::<N>::VALIDATED;  // compile-time check
    // read sensor N...
    42.0
}

// read_sensor_const::<0x20>();   // ✅ compiles — 0x20 is valid
// read_sensor_const::<0x00>();   // ❌ compile error — "Sensor ID must be >= 0x01"
// read_sensor_const::<0xFF>();   // ❌ compile error — 0xFF is reserved
```

```rust,ignore
pub struct BoundedFanId<const N: u8>;

impl<const N: u8> BoundedFanId<N> {
    pub const VALIDATED: () = assert!(N < 8, "Server has at most 8 fans (0..7)");

    pub const fn id() -> u8 {
        let _ = Self::VALIDATED;
        N
    }
}

// BoundedFanId::<3>::id();   // ✅
// BoundedFanId::<10>::id();  // ❌ compile error
```

这类技巧特别适合“板子上就 8 个风扇槽位”“传感器 ID 只能落在固定区间”这种硬件常识。与其把这些约束写进文档、再靠人记，不如让编译器守门。<br><span class="zh-inline">如果值来自运行时配置或用户输入，那还是应该回到 `TryFrom` / `FromStr`，因为 const 断言只适合编译期已知的常量。</span>

***

### Trick 10 — Session Types for Channel Communication<br><span class="zh-inline">技巧 10：用 Session Types 约束通道通信顺序</span>

两个组件通过通道对话时，比如诊断编排器和工作线程、控制平面和设备代理，问题往往不在“消息结构”本身，而在“先发什么、后收什么”。session type 的价值，就是把这个顺序协议也编码进类型里。<br><span class="zh-inline">这样就不会再出现“还没发请求就先等响应”这种低级错误。</span>

```rust,ignore
use std::marker::PhantomData;

// Protocol: Client sends Request, Server sends Response, then done.
pub struct SendRequest;
pub struct RecvResponse;
pub struct Done;

/// A typed channel endpoint. `S` is the current protocol state.
pub struct Chan<S> {
    // In real code: wraps a mpsc::Sender/Receiver pair
    _state: PhantomData<S>,
}

impl Chan<SendRequest> {
    /// Send a request — transitions to RecvResponse state.
    pub fn send(self, request: DiagRequest) -> Chan<RecvResponse> {
        // ... send on channel ...
        Chan { _state: PhantomData }
    }
}

impl Chan<RecvResponse> {
    /// Receive a response — transitions to Done state.
    pub fn recv(self) -> (DiagResponse, Chan<Done>) {
        // ... recv from channel ...
        (DiagResponse { passed: true }, Chan { _state: PhantomData })
    }
}

impl Chan<Done> {
    /// Closing the channel — only possible when the protocol is complete.
    pub fn close(self) { /* drop */ }
}

pub struct DiagRequest { pub test_name: String }
pub struct DiagResponse { pub passed: bool }

// The protocol MUST be followed in order:
fn orchestrator(chan: Chan<SendRequest>) {
    let chan = chan.send(DiagRequest { test_name: "gpu_stress".into() });
    let (response, chan) = chan.recv();
    chan.close();
    println!("Result: {}", if response.passed { "PASS" } else { "FAIL" });
}

// Can't recv before send:
// fn wrong_order(chan: Chan<SendRequest>) {
//     chan.recv();  // ❌ no method `recv` on Chan<SendRequest>
// }
```

这个模式很像把协议文档翻译成类型系统。原来靠 README 或注释描述“先 Request、再 Response、最后 Close”，现在编译器会真的检查这一点。<br><span class="zh-inline">协议越容易被写错，session type 的收益就越大。</span>

> **When to use:** Request-response channels, multi-step BMC command flows, worker orchestration, and other messaging paths where order is part of correctness.<br><span class="zh-inline">**适用场景：** 请求-响应通道、多步 BMC 命令流程、工作线程编排，以及任何“顺序本身就是正确性的一部分”的消息交互。</span>

***

### Trick 11 — `Pin` for Self-Referential State Machines<br><span class="zh-inline">技巧 11：用 `Pin` 保护自引用状态机</span>

有些状态机需要持有指向自身内部数据的引用，比如流式解析器里游标指向自己的缓冲区。普通 Rust 默认不允许这么玩，因为对象一旦移动，内部指针立刻悬空。<br><span class="zh-inline">`Pin` 的作用，就是给这种“绝对不能被搬家”的值上锁。</span>

```rust,ignore
use std::pin::Pin;
use std::marker::PhantomPinned;

/// A streaming parser that holds a reference into its own buffer.
/// Once pinned, it cannot be moved — the internal reference stays valid.
pub struct StreamParser {
    buffer: Vec<u8>,
    /// Points into `buffer`. Only valid while pinned.
    cursor: *const u8,
    _pin: PhantomPinned,  // opts out of Unpin — prevents accidental unpinning
}

impl StreamParser {
    pub fn new(data: Vec<u8>) -> Pin<Box<Self>> {
        let parser = StreamParser {
            buffer: data,
            cursor: std::ptr::null(),
            _pin: PhantomPinned,
        };
        let mut boxed = Box::pin(parser);

        // Set cursor to point into the pinned buffer
        let cursor = boxed.buffer.as_ptr();
        // SAFETY: we have exclusive access and the parser is pinned
        unsafe {
            let mut_ref = Pin::as_mut(&mut boxed);
            Pin::get_unchecked_mut(mut_ref).cursor = cursor;
        }

        boxed
    }

    /// Read the next byte — only callable through Pin<&mut Self>.
    pub fn next_byte(self: Pin<&mut Self>) -> Option<u8> {
        // The parser can't be moved, so cursor remains valid
        if self.cursor.is_null() { return None; }
        // ... advance cursor through buffer ...
        Some(42) // stub
    }
}

// Usage:
// let mut parser = StreamParser::new(vec![0x01, 0x02, 0x03]);
// let byte = parser.as_mut().next_byte();
```

`Pin` 的意义不是“让写法更玄学”，而是把“对象地址必须稳定”这条隐含约束正式写进 API。<br><span class="zh-inline">没有 `Pin`，这种自引用结构多半会退化成脆弱的 `unsafe` 手工约定；有了 `Pin`，编译器会持续守住“不能移动”这条规则。</span>

| Use `Pin` when…<br><span class="zh-inline">适合用 `Pin`</span> | Don't use `Pin` when…<br><span class="zh-inline">不必用 `Pin`</span> |
|-----------------|----------------------|
| State machine stores references into its own fields<br><span class="zh-inline">状态机内部持有指向自身字段的引用</span> | All fields are independently owned<br><span class="zh-inline">字段彼此独立拥有</span> |
| Async futures borrow across `.await`<br><span class="zh-inline">future 需要跨 `.await` 保留借用</span> | No self-referencing invariant exists<br><span class="zh-inline">根本没有自引用约束</span> |
| DMA descriptors or ring buffers must stay put<br><span class="zh-inline">DMA 描述符或环形缓冲区必须驻留在固定地址</span> | Index-based access is enough<br><span class="zh-inline">普通索引访问已经够用</span> |

***

### Trick 12 — RAII / `Drop` as a Correctness Guarantee<br><span class="zh-inline">技巧 12：把 RAII / `Drop` 当成正确性保证</span>

Rust 的 `Drop` 本质上就是一种 correct-by-construction 机制：清理代码会被编译器自动插入，所以“忘了释放资源”这件事本身会变得很难发生。<br><span class="zh-inline">对硬件会话、锁、映射、句柄这类资源来说，这招尤其好使。</span>

```rust,ignore
use std::io;

/// An IPMI session that MUST be closed when done.
/// The `Drop` impl guarantees cleanup even on panic or early `?` return.
pub struct IpmiSession {
    handle: u32,
}

impl IpmiSession {
    pub fn open(host: &str) -> io::Result<Self> {
        // ... negotiate IPMI session ...
        Ok(IpmiSession { handle: 42 })
    }

    pub fn send_raw(&self, _data: &[u8]) -> io::Result<Vec<u8>> {
        Ok(vec![0x00])
    }
}

impl Drop for IpmiSession {
    fn drop(&mut self) {
        // Close Session command: always runs, even on panic/early-return.
        // In C, forgetting CloseSession() leaks a BMC session slot.
        let _ = self.send_raw(&[0x06, 0x3C]);
        eprintln!("[RAII] session {} closed", self.handle);
    }
}
// Usage:
fn diagnose(host: &str) -> io::Result<()> {
    let session = IpmiSession::open(host)?;
    session.send_raw(&[0x04, 0x2D, 0x20])?;
    // No explicit close needed — Drop runs here automatically
    Ok(())
    // Even if send_raw returns Err(...), the session is still closed.
}
```

```text
C:     session = ipmi_open(host);
       ipmi_send(session, data);
       if (error) return -1;        // leaked session — forgot close()
       ipmi_close(session);

Rust:  let session = IpmiSession::open(host)?;
       session.send_raw(data)?;     // Drop runs on ? return
       // Drop always runs — leak is impossible
```

再进一步，还可以把 RAII 和 type-state 组合起来，做出“只有进入某个状态，才会触发某种特定清理动作”的结构。<br><span class="zh-inline">比如 GPU 时钟锁定后的句柄，在 `Drop` 里自动解锁，就非常适合拆成独立状态包装类型。</span>

```rust,ignore
use std::marker::PhantomData;

pub struct Open;
pub struct Locked;

pub struct GpuContext<S> {
    device_id: u32,
    _state: PhantomData<S>,
}

impl GpuContext<Open> {
    pub fn lock_clocks(self) -> LockedGpu {
        // ... lock GPU clocks for stable benchmarking ...
        LockedGpu { device_id: self.device_id }
    }
}

/// Separate type for the locked state — has its own Drop.
/// We can't do `impl Drop for GpuContext<Locked>` (E0366),
/// so we use a distinct wrapper that owns the locked resource.
pub struct LockedGpu {
    device_id: u32,
}

impl LockedGpu {
    pub fn run_benchmark(&self) -> f64 {
        // ... benchmark with locked clocks ...
        42.0
    }
}

impl Drop for LockedGpu {
    fn drop(&mut self) {
        // Unlock clocks on drop — only fires for the locked wrapper.
        eprintln!("[RAII] GPU {} clocks unlocked", self.device_id);
    }
}
```

| Approach<br><span class="zh-inline">做法</span> | Pros<br><span class="zh-inline">优点</span> | Cons<br><span class="zh-inline">代价</span> |
|----------|------|------|
| Separate wrapper type<br><span class="zh-inline">独立包装类型</span> | Clean and zero-cost<br><span class="zh-inline">干净，而且零运行时成本</span> | Extra type name<br><span class="zh-inline">多一个类型名</span> |
| Generic `Drop` + runtime check<br><span class="zh-inline">泛型 `Drop` 加运行时判断</span> | One generic container<br><span class="zh-inline">表面上还是一个通用容器</span> | Runtime cost and weaker guarantees<br><span class="zh-inline">有运行时开销，约束也更弱</span> |
| `enum` state in `Drop`<br><span class="zh-inline">在 `Drop` 里匹配 `enum` 状态</span> | Single wrapper type<br><span class="zh-inline">还是一个包装类型</span> | Runtime dispatch, less static precision<br><span class="zh-inline">需要运行时分发，静态精度更差</span> |

***

### Trick 13 — Error Type Hierarchies as Correctness<br><span class="zh-inline">技巧 13：把错误类型层级也纳入正确性设计</span>

错误类型设计得乱，调用方就只能拿一坨字符串瞎猜；错误类型设计得清楚，调用方才能被编译器逼着逐类处理。<br><span class="zh-inline">这也是一种 correct-by-construction：不是消灭错误，而是消灭“错误被随手吞掉”的机会。</span>

```toml
# Cargo.toml
[dependencies]
thiserror = "1"
# For application-level error handling (optional):
# anyhow = "1"
```

```rust,ignore
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DiagError {
    #[error("IPMI communication failed: {0}")]
    Ipmi(#[from] IpmiError),

    #[error("sensor {sensor_id:#04x} reading out of range: {value}")]
    SensorRange { sensor_id: u8, value: f64 },

    #[error("GPU {gpu_id} not responding")]
    GpuTimeout { gpu_id: u32 },

    #[error("configuration invalid: {0}")]
    Config(String),
}

#[derive(Debug, Error)]
pub enum IpmiError {
    #[error("session authentication failed")]
    AuthFailed,

    #[error("command {net_fn:#04x}/{cmd:#04x} timed out")]
    Timeout { net_fn: u8, cmd: u8 },

    #[error("completion code {0:#04x}")]
    CompletionCode(u8),
}

// Callers MUST handle each variant — no silent swallowing:
fn run_thermal_check() -> Result<(), DiagError> {
    // If this returns IpmiError, it's automatically converted to DiagError::Ipmi
    // via the #[from] attribute.
    let temp = read_cpu_temp()?;
    if temp > 105.0 {
        return Err(DiagError::SensorRange {
            sensor_id: 0x20,
            value: temp,
        });
    }
    Ok(())
}

# fn read_cpu_temp() -> Result<f64, DiagError> { Ok(42.0) }
```

| Without structured errors<br><span class="zh-inline">没有结构化错误</span> | With `thiserror` enums<br><span class="zh-inline">使用 `thiserror` 枚举</span> |
|--------------------------|----------------------|
| `Result&lt;T, String&gt;`<br><span class="zh-inline">只剩一段字符串</span> | `Result&lt;T, DiagError&gt;`<br><span class="zh-inline">错误有明确语义</span> |
| Caller guesses what failed<br><span class="zh-inline">调用方靠猜</span> | Caller matches variants<br><span class="zh-inline">调用方按变体处理</span> |
| New failures hide in logs<br><span class="zh-inline">新错误容易被日志淹没</span> | New variants surface at compile time<br><span class="zh-inline">新增变体会把遗漏处理点揪出来</span> |

| Use `thiserror` when…<br><span class="zh-inline">适合 `thiserror`</span> | Use `anyhow` when…<br><span class="zh-inline">适合 `anyhow`</span> |
|-----------------------|-------------------|
| Writing a library crate<br><span class="zh-inline">写库或可复用模块</span> | Writing the final binary or CLI<br><span class="zh-inline">写最终二进制或 CLI</span> |
| Callers must branch on error kinds<br><span class="zh-inline">调用方需要按错误种类分支</span> | Callers mainly log and exit<br><span class="zh-inline">调用方主要记录后退出</span> |
| Error types belong to the public API<br><span class="zh-inline">错误类型属于公开接口的一部分</span> | Internal error aggregation is enough<br><span class="zh-inline">内部聚合错误已经足够</span> |

***

### Trick 14 — `#[must_use]` for Enforcing Consumption<br><span class="zh-inline">技巧 14：用 `#[must_use]` 强制消费关键返回值</span>

有些值一旦被丢弃，逻辑上几乎肯定是写错了。对这种值，`#[must_use]` 是一把又短又狠的刀。<br><span class="zh-inline">它不会阻止所有错误，但至少能把“返回值被顺手扔掉”这类失误提到编译警告层面。</span>

```rust,ignore
/// A calibration token that MUST be used — dropping it silently is a bug.
#[must_use = "calibration token must be passed to calibrate(), not dropped"]
pub struct CalibrationToken {
    _private: (),
}

/// A diagnostic result that MUST be checked — ignoring failures is a bug.
#[must_use = "diagnostic result must be inspected for failures"]
pub struct DiagResult {
    pub passed: bool,
    pub details: String,
}

/// Functions that return important values should be marked too:
#[must_use = "the authenticated session must be used or explicitly closed"]
pub fn authenticate(user: &str, pass: &str) -> Result<Session, AuthError> {
    // ...
#   unimplemented!()
}
#
# pub struct Session;
# pub struct AuthError;
```

```text
warning: unused `CalibrationToken` that must be used
  --> src/main.rs:5:5
   |
5  |     CalibrationToken { _private: () };
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = note: calibration token must be passed to calibrate(), not dropped
```

| Pattern<br><span class="zh-inline">模式</span> | What to annotate<br><span class="zh-inline">该标在哪</span> | Why<br><span class="zh-inline">原因</span> |
|---------|-----------------|-----|
| Single-use tokens<br><span class="zh-inline">一次性令牌</span> | `CalibrationToken`, `FusePayload` | Dropping them usually means a logic bug<br><span class="zh-inline">丢掉通常就是逻辑错误</span> |
| Capability tokens<br><span class="zh-inline">能力令牌</span> | `AdminToken` | Authentication succeeded but result ignored<br><span class="zh-inline">认证成功却没人接这个结果</span> |
| Type-state transitions<br><span class="zh-inline">状态迁移结果</span> | `authenticate()`, `activate()` return values | New state created but never used<br><span class="zh-inline">新状态生成了却没人继续使用</span> |
| Results and reports<br><span class="zh-inline">结果与报告</span> | `DiagResult`, `SensorReading` | Silent failure swallowing<br><span class="zh-inline">避免静默吞错</span> |
| RAII handles<br><span class="zh-inline">RAII 句柄</span> | `IpmiSession`, `LockedGpu` | Resource opened but never really used<br><span class="zh-inline">资源打开了却被随手丢掉</span> |

> **Rule of thumb:** If dropping a value without using it is almost always a bug, add `#[must_use]`.<br><span class="zh-inline">**经验规则：** 如果一个值“拿到了却不用”几乎总是 bug，就加 `#[must_use]`。</span>

## Key Takeaways<br><span class="zh-inline">本章要点</span>

1. **Sentinel → Option at the boundary** — convert magic values to `Option` on parse; the compiler forces callers to handle `None`.<br><span class="zh-inline">**边界处把哨兵值改成 `Option`**：魔法值在解析时就结束使命，调用方会被编译器逼着处理 `None`。</span>
2. **Sealed traits close the implementation loophole** — a private supertrait keeps the critical implementation set under the current crate's control.<br><span class="zh-inline">**sealed trait 能堵住实现口子**：靠私有 supertrait 把关键实现集合收归当前 crate 管控。</span>
3. **`#[non_exhaustive]` and `#[must_use]` are one-line, high-value annotations** — they are cheap but regularly prevent enum-evolution breakage and ignored-result mistakes.<br><span class="zh-inline">**`#[non_exhaustive]` 和 `#[must_use]` 是高性价比注解**：一行代码，经常能挡住未来枚举扩展和关键返回值被忽略的问题。</span>
4. **Typestate builders make required fields a compile-time concern** — `finish()` only appears when the required state is complete.<br><span class="zh-inline">**typestate builder 把必填字段问题提前到编译期**：只有状态完整时，`finish()` 才会出现。</span>
5. **Each trick removes one specific bug class** — adopt them incrementally; none of them requires rewriting the entire architecture.<br><span class="zh-inline">**每个技巧都瞄准一类具体 bug**：完全可以逐项引入，没有哪一条要求把现有架构全部推倒重来。</span>
