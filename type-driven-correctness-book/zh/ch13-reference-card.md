# Reference Card<br><span class="zh-inline">参考卡片</span>

> **Quick-reference for all 14+ correct-by-construction patterns** with selection flowchart, pattern catalogue, composition rules, crate mapping, and Curry-Howard cheat sheet.<br><span class="zh-inline">**这是一张 14+ 种构造即正确模式的速查卡**，包括选择流程图、模式目录、组合规则、crate 映射，以及 Curry-Howard 速查表。</span>
>
> **Cross-references:** Every chapter — this is the lookup table for the entire book.<br><span class="zh-inline">**交叉阅读：** 全书所有章节。这个文件本身就是整本书的索引表和速查表。</span>

## Quick Reference: Correct-by-Construction Patterns<br><span class="zh-inline">速查：构造即正确模式</span>

### Pattern Selection Guide<br><span class="zh-inline">模式选择指南</span>

```text
Is the bug catastrophic if missed?
├── Yes → Can it be encoded in types?
│         ├── Yes → USE CORRECT-BY-CONSTRUCTION
│         └── No  → Runtime check + extensive testing
└── No  → Runtime check is fine

这个 bug 一旦漏掉，后果会不会很严重？
├── 会 → 能不能编码进类型系统？
│      ├── 能 → 用构造即正确
│      └── 不能 → 运行时检查 + 大量测试
└── 不会 → 运行时检查通常就够
```

### Pattern Catalogue<br><span class="zh-inline">模式目录</span>

| # | Pattern<br><span class="zh-inline">模式</span> | Key Trait/Type<br><span class="zh-inline">关键 Trait/类型</span> | Prevents<br><span class="zh-inline">防止什么</span> | Runtime Cost<br><span class="zh-inline">运行时成本</span> | Chapter<br><span class="zh-inline">章节</span> |
|---|---------|---------------|----------|:------:|---------|
| 1 | Typed Commands<br><span class="zh-inline">类型化命令</span> | `trait IpmiCmd { type Response; }` | Wrong response type<br><span class="zh-inline">响应类型错误</span> | Zero<br><span class="zh-inline">零</span> | ch02 |
| 2 | Single-Use Types<br><span class="zh-inline">单次使用类型</span> | `struct Nonce` (not Clone/Copy) | Nonce/key reuse<br><span class="zh-inline">nonce/密钥复用</span> | Zero<br><span class="zh-inline">零</span> | ch03 |
| 3 | Capability Tokens<br><span class="zh-inline">能力令牌</span> | `struct AdminToken { _private: () }` | Unauthorised access<br><span class="zh-inline">未授权访问</span> | Zero<br><span class="zh-inline">零</span> | ch04 |
| 4 | Type-State<br><span class="zh-inline">类型状态</span> | `Session<Active>` | Protocol violations<br><span class="zh-inline">协议违规</span> | Zero<br><span class="zh-inline">零</span> | ch05 |
| 5 | Dimensional Types<br><span class="zh-inline">量纲类型</span> | `struct Celsius(f64)` | Unit confusion<br><span class="zh-inline">单位混淆</span> | Zero<br><span class="zh-inline">零</span> | ch06 |
| 6 | Validated Boundaries<br><span class="zh-inline">已验证边界</span> | `struct ValidFru` (via TryFrom) | Unvalidated data use<br><span class="zh-inline">未验证数据直接使用</span> | Parse once<br><span class="zh-inline">解析一次</span> | ch07 |
| 7 | Capability Mixins<br><span class="zh-inline">能力混入</span> | `trait FanDiagMixin: HasSpi + HasI2c` | Missing bus access<br><span class="zh-inline">缺失总线能力</span> | Zero<br><span class="zh-inline">零</span> | ch08 |
| 8 | Phantom Types<br><span class="zh-inline">Phantom 类型</span> | `Register<Width16>` | Width/direction mismatch<br><span class="zh-inline">宽度或方向错配</span> | Zero<br><span class="zh-inline">零</span> | ch09 |
| 9 | Sentinel → Option<br><span class="zh-inline">哨兵值转 Option</span> | `Option<u8>` (not `0xFF`) | Sentinel-as-value bugs<br><span class="zh-inline">把哨兵值当正常值用</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 10 | Sealed Traits<br><span class="zh-inline">封闭 trait</span> | `trait Cmd: private::Sealed` | Unsound external impls<br><span class="zh-inline">外部不安全实现</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 11 | Non-Exhaustive Enums<br><span class="zh-inline">非穷尽枚举</span> | `#[non_exhaustive] enum Sku` | Silent match fallthrough<br><span class="zh-inline">静默遗漏分支</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 12 | Typestate Builder<br><span class="zh-inline">类型状态 Builder</span> | `DerBuilder<Set, Missing>` | Incomplete construction<br><span class="zh-inline">构造不完整对象</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 13 | FromStr Validation<br><span class="zh-inline">FromStr 校验</span> | `impl FromStr for DiagLevel` | Unvalidated string input<br><span class="zh-inline">未验证字符串输入</span> | Parse once<br><span class="zh-inline">解析一次</span> | ch11 |
| 14 | Const-Generic Size<br><span class="zh-inline">常量泛型尺寸</span> | `RegisterBank<const N: usize>` | Buffer size mismatch<br><span class="zh-inline">缓冲区尺寸错配</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 15 | Safe `unsafe` Wrapper<br><span class="zh-inline">安全的 `unsafe` 包装器</span> | `MmioRegion::read_u32()` | Unchecked MMIO/FFI<br><span class="zh-inline">未约束的 MMIO/FFI</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 16 | Async Type-State<br><span class="zh-inline">异步类型状态</span> | `AsyncSession<Active>` | Async protocol violations<br><span class="zh-inline">异步协议违规</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 17 | Const Assertions<br><span class="zh-inline">常量断言</span> | `SdrSensorId<const N: u8>` | Invalid compile-time IDs<br><span class="zh-inline">非法编译期 ID</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 18 | Session Types<br><span class="zh-inline">会话类型</span> | `Chan<SendRequest>` | Out-of-order channel ops<br><span class="zh-inline">乱序通道操作</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 19 | Pin Self-Referential<br><span class="zh-inline">Pin 自引用结构</span> | `Pin<Box<StreamParser>>` | Dangling intra-struct pointer<br><span class="zh-inline">结构体内部悬垂指针</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 20 | RAII / Drop<br><span class="zh-inline">RAII / Drop</span> | `impl Drop for Session` | Resource leak on any exit path<br><span class="zh-inline">任意退出路径上的资源泄漏</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 21 | Error Type Hierarchy<br><span class="zh-inline">错误类型层级</span> | `#[derive(Error)] enum DiagError` | Silent error swallowing<br><span class="zh-inline">静默吞错</span> | Zero<br><span class="zh-inline">零</span> | ch11 |
| 22 | `#[must_use]` | `#[must_use] struct Token` | Silently dropped values<br><span class="zh-inline">值被悄悄丢掉</span> | Zero<br><span class="zh-inline">零</span> | ch11 |

### Composition Rules<br><span class="zh-inline">组合规则</span>

```text
Capability Token + Type-State = Authorised state transitions
Typed Command + Dimensional Type = Physically-typed responses
Validated Boundary + Phantom Type = Typed register access on validated config
Capability Mixin + Typed Command = Bus-aware typed operations
Single-Use Type + Type-State = Consume-on-transition protocols
Sealed Trait + Typed Command = Closed, sound command set
Sentinel → Option + Validated Boundary = Clean parse-once pipeline
Typestate Builder + Capability Token = Proof-of-complete construction
FromStr + #[non_exhaustive] = Evolvable, fail-fast enum parsing
Const-Generic Size + Validated Boundary = Sized, validated protocol buffers
Safe unsafe Wrapper + Phantom Type = Typed, safe MMIO access
Async Type-State + Capability Token = Authorised async transitions
Session Types + Typed Command = Fully-typed request-response channels
Pin + Type-State = Self-referential state machines that can't move
RAII (Drop) + Type-State = State-dependent cleanup guarantees
Error Hierarchy + Validated Boundary = Typed parse errors with exhaustive handling
#[must_use] + Single-Use Type = Hard-to-ignore, hard-to-reuse tokens

能力令牌 + 类型状态 = 带权限控制的状态迁移
类型化命令 + 量纲类型 = 带物理单位的响应
已验证边界 + Phantom 类型 = 在已验证配置上的类型化寄存器访问
能力混入 + 类型化命令 = 面向总线能力的类型化操作
单次使用类型 + 类型状态 = 迁移时消费的协议
Sealed Trait + 类型化命令 = 封闭且健全的命令集合
哨兵值转 Option + 已验证边界 = 干净的“解析一次”流水线
Typestate Builder + 能力令牌 = “构造完整”的证明
FromStr + #[non_exhaustive] = 可演进、失败即报的枚举解析
常量泛型尺寸 + 已验证边界 = 带尺寸保证的协议缓冲区
安全 `unsafe` 包装器 + Phantom 类型 = 类型化、可审计的 MMIO 访问
异步类型状态 + 能力令牌 = 带权限约束的异步状态迁移
会话类型 + 类型化命令 = 全类型化的请求响应通道
Pin + 类型状态 = 不能移动的自引用状态机
RAII（Drop）+ 类型状态 = 带状态约束的清理保证
错误类型层级 + 已验证边界 = 带类型信息的解析错误处理
#[must_use] + 单次使用类型 = 不容易忽略，也不容易复用的令牌
```

### Anti-Patterns to Avoid<br><span class="zh-inline">该避开的反模式</span>

| Anti-Pattern<br><span class="zh-inline">反模式</span> | Why It's Wrong<br><span class="zh-inline">为什么不对</span> | Correct Alternative<br><span class="zh-inline">更合适的替代写法</span> |
|-------------|---------------|-------------------|
| `fn read_sensor() -> f64` | Unitless — could be °C, °F, or RPM<br><span class="zh-inline">没有单位信息，可能是 °C、°F，也可能是 RPM</span> | `fn read_sensor() -> Celsius` |
| `fn encrypt(nonce: &[u8; 12])` | Nonce can be reused (borrow)<br><span class="zh-inline">nonce 只是借用，完全可能被复用</span> | `fn encrypt(nonce: Nonce)` (move) |
| `fn admin_op(is_admin: bool)` | Caller can lie (`true`)<br><span class="zh-inline">调用方可以随便传 `true` 说自己是管理员</span> | `fn admin_op(_: &AdminToken)` |
| `fn send(session: &Session)` | No state guarantee<br><span class="zh-inline">完全没有状态保证</span> | `fn send(session: &Session<Active>)` |
| `fn process(data: &[u8])` | Not validated<br><span class="zh-inline">数据没有验证</span> | `fn process(data: &ValidFru)` |
| `Clone` on ephemeral keys | Defeats single-use guarantee<br><span class="zh-inline">会破坏单次使用保证</span> | Don't derive Clone |
| `let vendor_id: u16 = 0xFFFF` | Sentinel carried internally<br><span class="zh-inline">把哨兵值藏在正常类型里</span> | `let vendor_id: Option<u16> = None` |
| `fn route(level: &str)` with fallback | Typos silently default<br><span class="zh-inline">拼写错了也可能静默回退</span> | `let level: DiagLevel = s.parse()?` |
| `Builder::new().finish()` without fields | Incomplete object constructed<br><span class="zh-inline">字段没填全也能构造对象</span> | Typestate builder: `finish()` gated on `Set` |
| `let buf: Vec<u8>` for fixed-size HW buffer | Size only checked at runtime<br><span class="zh-inline">尺寸只能在运行时检查</span> | `RegisterBank<4096>` (const generic) |
| Raw `unsafe { ptr::read(...) }` scattered | UB risk, unauditable<br><span class="zh-inline">容易出 UB，也不好审计</span> | `MmioRegion::read_u32()` safe wrapper |
| `async fn transition(&mut self)` | Mutable borrows don't enforce state<br><span class="zh-inline">可变借用本身并不能证明状态迁移</span> | `async fn transition(self) -> NextState` |
| `fn cleanup()` called manually | Forgotten on early return / panic<br><span class="zh-inline">早返回或 panic 时很容易忘</span> | `impl Drop` — compiler inserts call |
| `fn op() -> Result<T, String>` | Opaque error, no variant matching<br><span class="zh-inline">错误信息不透明，也不能按变体细分处理</span> | `fn op() -> Result<T, DiagError>` enum |

### Mapping to a Diagnostics Codebase<br><span class="zh-inline">映射到诊断代码库</span>

| Module<br><span class="zh-inline">模块</span> | Applicable Pattern(s)<br><span class="zh-inline">适用模式</span> |
|---------------------|----------------------|
| `protocol_lib` | Typed commands, type-state sessions<br><span class="zh-inline">类型化命令、类型状态会话</span> |
| `thermal_diag` | Capability mixins, dimensional types<br><span class="zh-inline">能力混入、量纲类型</span> |
| `accel_diag` | Validated boundaries, phantom registers<br><span class="zh-inline">已验证边界、phantom 寄存器</span> |
| `network_diag` | Type-state (link training), capability tokens<br><span class="zh-inline">类型状态（链路训练）、能力令牌</span> |
| `pci_topology` | Phantom types (register width), validated config, sentinel → Option<br><span class="zh-inline">phantom 类型（寄存器宽度）、已验证配置、哨兵值转 Option</span> |
| `event_handler` | Single-use audit tokens, capability tokens, FromStr (Component)<br><span class="zh-inline">单次使用审计令牌、能力令牌、FromStr（Component）</span> |
| `event_log` | Validated boundaries (SEL record parsing)<br><span class="zh-inline">已验证边界（SEL 记录解析）</span> |
| `compute_diag` | Dimensional types (temperature, frequency)<br><span class="zh-inline">量纲类型（温度、频率）</span> |
| `memory_diag` | Validated boundaries (SPD data), dimensional types<br><span class="zh-inline">已验证边界（SPD 数据）、量纲类型</span> |
| `switch_diag` | Type-state (port enumeration), phantom types<br><span class="zh-inline">类型状态（端口枚举）、phantom 类型</span> |
| `config_loader` | FromStr (DiagLevel, FaultStatus, DiagAction)<br><span class="zh-inline">FromStr（DiagLevel、FaultStatus、DiagAction）</span> |
| `log_analyzer` | Validated boundaries (CompiledPatterns)<br><span class="zh-inline">已验证边界（CompiledPatterns）</span> |
| `diag_framework` | Typestate builder (DerBuilder), session types (orchestrator↔worker)<br><span class="zh-inline">Typestate builder（DerBuilder）、会话类型（orchestrator↔worker）</span> |
| `topology_lib` | Const-generic register banks, safe MMIO wrappers<br><span class="zh-inline">常量泛型寄存器组、安全 MMIO 包装器</span> |

### Curry-Howard Cheat Sheet<br><span class="zh-inline">Curry-Howard 速查表</span>

| Logic Concept<br><span class="zh-inline">逻辑概念</span> | Rust Equivalent<br><span class="zh-inline">Rust 对应物</span> | Example<br><span class="zh-inline">例子</span> |
|--------------|----------------|---------|
| Proposition<br><span class="zh-inline">命题</span> | Type<br><span class="zh-inline">类型</span> | `AdminToken` |
| Proof<br><span class="zh-inline">证明</span> | Value of that type<br><span class="zh-inline">该类型的值</span> | `let tok = authenticate()?;` |
| Implication (A → B)<br><span class="zh-inline">蕴含（A → B）</span> | Function `fn(A) -> B` | `fn activate(AdminToken) -> Session<Active>` |
| Conjunction (A ∧ B)<br><span class="zh-inline">合取（A ∧ B）</span> | Tuple `(A, B)` or multi-param<br><span class="zh-inline">元组 `(A, B)` 或多参数</span> | `fn op(a: &AdminToken, b: &LinkTrained)` |
| Disjunction (A ∨ B)<br><span class="zh-inline">析取（A ∨ B）</span> | `enum { A(A), B(B) }` or `Result<A, B>`<br><span class="zh-inline">枚举或 `Result<A, B>`</span> | `Result<Session<Active>, Error>` |
| True<br><span class="zh-inline">真</span> | `()` (unit type) | Always constructible<br><span class="zh-inline">永远可构造</span> |
| False<br><span class="zh-inline">假</span> | `!` (never type) or `enum Void {}` | Can never be constructed<br><span class="zh-inline">永远不可构造</span> |

---
