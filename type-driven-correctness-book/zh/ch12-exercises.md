# Exercises 🟡<br><span class="zh-inline">练习 🟡</span>

> **What you'll learn:** Hands-on practice applying correct-by-construction patterns to realistic hardware scenarios — NVMe admin commands, firmware update state machines, sensor pipelines, PCIe phantom types, multi-protocol health checks, and session-typed diagnostic protocols.<br><span class="zh-inline">**本章将学到什么：** 把 correct-by-construction 这一套模式真正落到手上，拿真实硬件场景练一遍：NVMe 管理命令、固件升级状态机、传感器处理流水线、PCIe phantom type、多协议健康检查，以及带会话类型的诊断协议。</span>
>
> **Cross-references:** [ch02](ch02-typed-command-interfaces-request-determi.md) (exercise 1), [ch05](ch05-protocol-state-machines-type-state-for-r.md) (exercise 2), [ch06](ch06-dimensional-analysis-making-the-compiler.md) (exercise 3), [ch09](ch09-phantom-types-for-resource-tracking.md) (exercise 4), [ch10](ch10-putting-it-all-together-a-complete-diagn.md) (exercise 5)<br><span class="zh-inline">**交叉阅读：** [ch02](ch02-typed-command-interfaces-request-determi.md) 对应练习 1，[ch05](ch05-protocol-state-machines-type-state-for-r.md) 对应练习 2，[ch06](ch06-dimensional-analysis-making-the-compiler.md) 对应练习 3，[ch09](ch09-phantom-types-for-resource-tracking.md) 对应练习 4，[ch10](ch10-putting-it-all-together-a-complete-diagn.md) 对应练习 5。</span>

## Practice Problems<br><span class="zh-inline">练习题</span>

### Exercise 1: NVMe Admin Command (Typed Commands)<br><span class="zh-inline">练习 1：NVMe 管理命令（类型化命令）</span>

Design a typed command interface for NVMe admin commands:<br><span class="zh-inline">为 NVMe 管理命令设计一套类型化命令接口：</span>

- `Identify` → `IdentifyResponse` (model number, serial, firmware rev)<br><span class="zh-inline">`Identify` → `IdentifyResponse`，包含型号、序列号、固件版本</span>
- `GetLogPage` → `SmartLog` (temperature, available spare, data units read)<br><span class="zh-inline">`GetLogPage` → `SmartLog`，包含温度、剩余可用空间百分比、读取的数据单元</span>
- `GetFeature` → feature-specific response<br><span class="zh-inline">`GetFeature` → 某个具体 feature 对应的响应类型</span>

Requirements:<br><span class="zh-inline">要求：</span>
1. The command type determines the response type<br><span class="zh-inline">命令类型要直接决定响应类型</span>
2. No runtime dispatch — static dispatch only<br><span class="zh-inline">不要运行时分发，只允许静态分发</span>
3. Add a `NamespaceId` newtype that prevents mixing namespace IDs with other `u32`s<br><span class="zh-inline">加一个 `NamespaceId` newtype，防止命名空间 ID 和其他 `u32` 混用</span>

**Hint:** Follow the `IpmiCmd` trait pattern from ch02, but use NVMe-specific constants.<br><span class="zh-inline">**提示：** 可以沿用 ch02 里的 `IpmiCmd` trait 模式，只是把常量和字段换成 NVMe 语义。</span>

<details>
<summary>Sample Solution (Exercise 1)<br><span class="zh-inline">参考答案（练习 1）</span></summary>

```rust,ignore
use std::io;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct NamespaceId(pub u32);

#[derive(Debug, Clone, PartialEq)]
pub struct IdentifyResponse {
    pub model: String,
    pub serial: String,
    pub firmware_rev: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SmartLog {
    pub temperature_kelvin: u16,
    pub available_spare_pct: u8,
    pub data_units_read: u64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ArbitrationFeature {
    pub high_priority_weight: u8,
    pub medium_priority_weight: u8,
    pub low_priority_weight: u8,
}

/// The core pattern: associated type pins each command's response.
pub trait NvmeAdminCmd {
    type Response;
    fn opcode(&self) -> u8;
    fn nsid(&self) -> Option<NamespaceId>;
    fn parse_response(&self, raw: &[u8]) -> io::Result<Self::Response>;
}

pub struct Identify { pub nsid: NamespaceId }

impl NvmeAdminCmd for Identify {
    type Response = IdentifyResponse;
    fn opcode(&self) -> u8 { 0x06 }
    fn nsid(&self) -> Option<NamespaceId> { Some(self.nsid) }
    fn parse_response(&self, raw: &[u8]) -> io::Result<IdentifyResponse> {
        if raw.len() < 12 {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "too short"));
        }
        Ok(IdentifyResponse {
            model: String::from_utf8_lossy(&raw[0..4]).trim().to_string(),
            serial: String::from_utf8_lossy(&raw[4..8]).trim().to_string(),
            firmware_rev: String::from_utf8_lossy(&raw[8..12]).trim().to_string(),
        })
    }
}

pub struct GetLogPage { pub log_id: u8 }

impl NvmeAdminCmd for GetLogPage {
    type Response = SmartLog;
    fn opcode(&self) -> u8 { 0x02 }
    fn nsid(&self) -> Option<NamespaceId> { None }
    fn parse_response(&self, raw: &[u8]) -> io::Result<SmartLog> {
        if raw.len() < 11 {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "too short"));
        }
        Ok(SmartLog {
            temperature_kelvin: u16::from_le_bytes([raw[0], raw[1]]),
            available_spare_pct: raw[2],
            data_units_read: u64::from_le_bytes(raw[3..11].try_into().unwrap()),
        })
    }
}

pub struct GetFeature { pub feature_id: u8 }

impl NvmeAdminCmd for GetFeature {
    type Response = ArbitrationFeature;
    fn opcode(&self) -> u8 { 0x0A }
    fn nsid(&self) -> Option<NamespaceId> { None }
    fn parse_response(&self, raw: &[u8]) -> io::Result<ArbitrationFeature> {
        if raw.len() < 3 {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "too short"));
        }
        Ok(ArbitrationFeature {
            high_priority_weight: raw[0],
            medium_priority_weight: raw[1],
            low_priority_weight: raw[2],
        })
    }
}

/// Static dispatch — the compiler monomorphises per command type.
pub struct NvmeController;

impl NvmeController {
    pub fn execute<C: NvmeAdminCmd>(&self, cmd: &C) -> io::Result<C::Response> {
        // Build SQE from cmd.opcode()/cmd.nsid(),
        // submit to SQ, wait for CQ, then:
        let raw = self.submit_and_read(cmd.opcode())?;
        cmd.parse_response(&raw)
    }

    fn submit_and_read(&self, _opcode: u8) -> io::Result<Vec<u8>> {
        // Real implementation talks to /dev/nvme0
        Ok(vec![0; 512])
    }
}
```

**Key points:**<br><span class="zh-inline">**要点：**</span>
- `NamespaceId(u32)` prevents mixing namespace IDs with arbitrary `u32` values.<br><span class="zh-inline">`NamespaceId(u32)` 可以防止命名空间 ID 和普通 `u32` 混在一起乱传。</span>
- `NvmeAdminCmd::Response` is the "type index" — `execute()` returns exactly `C::Response`.<br><span class="zh-inline">`NvmeAdminCmd::Response` 就是这里的“类型索引”，所以 `execute()` 会精确返回 `C::Response`。</span>
- Fully static dispatch: no `Box<dyn …>`, no runtime downcasting.<br><span class="zh-inline">整个过程都是静态分发：没有 `Box&lt;dyn …&gt;`，也没有运行时 downcast。</span>

</details>

### Exercise 5: Multi-Protocol Health Check (Capability Mixins)<br><span class="zh-inline">练习 5：多协议健康检查（Capability Mixins）</span>

Create a health-check framework:<br><span class="zh-inline">实现一个健康检查框架：</span>

1. Define ingredient traits: `HasIpmi`, `HasRedfish`, `HasNvmeCli`, `HasGpio`<br><span class="zh-inline">先定义 ingredient trait：`HasIpmi`、`HasRedfish`、`HasNvmeCli`、`HasGpio`</span>
2. Create mixin traits<br><span class="zh-inline">再定义 mixin trait</span>
3. Build a `FullPlatformController` that implements all ingredient traits<br><span class="zh-inline">实现一个 `FullPlatformController`，让它具备所有 ingredient trait</span>
4. Build a `StorageOnlyController` that only implements `HasNvmeCli`<br><span class="zh-inline">实现一个 `StorageOnlyController`，只具备 `HasNvmeCli`</span>
5. Verify that `StorageOnlyController` gets `StorageHealthMixin` but NOT the others<br><span class="zh-inline">验证 `StorageOnlyController` 只会得到 `StorageHealthMixin`，而不会得到其他 mixin</span>

<details>
<summary>Sample Solution (Exercise 5)<br><span class="zh-inline">参考答案（练习 5）</span></summary>

```rust,ignore
// --- Ingredient traits ---
pub trait HasIpmi {
    fn ipmi_read_sensor(&self, id: u8) -> f64;
}
pub trait HasRedfish {
    fn redfish_get(&self, path: &str) -> String;
}
pub trait HasNvmeCli {
    fn nvme_smart_log(&self, dev: &str) -> SmartData;
}
pub trait HasGpio {
    fn gpio_read_alert(&self, pin: u8) -> bool;
}

pub struct SmartData {
    pub temperature_kelvin: u16,
    pub spare_pct: u8,
}

// --- Mixin traits with blanket impls ---
pub trait ThermalHealthMixin: HasIpmi + HasGpio {
    fn thermal_check(&self) -> ThermalStatus {
        let temp = self.ipmi_read_sensor(0x01);
        let alert = self.gpio_read_alert(12);
        ThermalStatus { temperature: temp, alert_active: alert }
    }
}
impl<T: HasIpmi + HasGpio> ThermalHealthMixin for T {}

pub trait StorageHealthMixin: HasNvmeCli {
    fn storage_check(&self) -> StorageStatus {
        let smart = self.nvme_smart_log("/dev/nvme0");
        StorageStatus {
            temperature_ok: smart.temperature_kelvin < 343, // 70 °C
            spare_ok: smart.spare_pct > 10,
        }
    }
}
impl<T: HasNvmeCli> StorageHealthMixin for T {}

pub trait BmcHealthMixin: HasIpmi + HasRedfish {
    fn bmc_health(&self) -> BmcStatus {
        let ipmi_temp = self.ipmi_read_sensor(0x01);
        let rf_temp = self.redfish_get("/Thermal/Temperatures/0");
        BmcStatus { ipmi_temp, redfish_temp: rf_temp, consistent: true }
    }
}
impl<T: HasIpmi + HasRedfish> BmcHealthMixin for T {}

pub struct ThermalStatus { pub temperature: f64, pub alert_active: bool }
pub struct StorageStatus { pub temperature_ok: bool, pub spare_ok: bool }
pub struct BmcStatus { pub ipmi_temp: f64, pub redfish_temp: String, pub consistent: bool }

// --- Full platform: all ingredients → all three mixins for free ---
pub struct FullPlatformController;

impl HasIpmi for FullPlatformController {
    fn ipmi_read_sensor(&self, _id: u8) -> f64 { 42.0 }
}
impl HasRedfish for FullPlatformController {
    fn redfish_get(&self, _path: &str) -> String { "42.0".into() }
}
impl HasNvmeCli for FullPlatformController {
    fn nvme_smart_log(&self, _dev: &str) -> SmartData {
        SmartData { temperature_kelvin: 310, spare_pct: 95 }
    }
}
impl HasGpio for FullPlatformController {
    fn gpio_read_alert(&self, _pin: u8) -> bool { false }
}

// --- Storage-only: only HasNvmeCli → only StorageHealthMixin ---
pub struct StorageOnlyController;

impl HasNvmeCli for StorageOnlyController {
    fn nvme_smart_log(&self, _dev: &str) -> SmartData {
        SmartData { temperature_kelvin: 315, spare_pct: 80 }
    }
}

// StorageOnlyController automatically gets storage_check().
// Calling thermal_check() or bmc_health() on it is a COMPILE ERROR.
```

**Key points:**<br><span class="zh-inline">**要点：**</span>
- Blanket `impl<T: HasIpmi + HasGpio> ThermalHealthMixin for T {}` means any qualifying type automatically gets the mixin.<br><span class="zh-inline">`impl&lt;T: HasIpmi + HasGpio&gt; ThermalHealthMixin for T {}` 这种 blanket impl 表示：只要类型满足条件，就自动拥有这个 mixin。</span>
- `StorageOnlyController` only implements `HasNvmeCli`, so the compiler grants it `StorageHealthMixin` but rejects `thermal_check()` and `bmc_health()`.<br><span class="zh-inline">`StorageOnlyController` 只实现了 `HasNvmeCli`，所以编译器只会给它 `StorageHealthMixin`，而 `thermal_check()`、`bmc_health()` 都会被直接拒绝。</span>
- Adding a new mixin is usually just one trait plus one blanket impl.<br><span class="zh-inline">以后要再扩一个新 mixin，通常只需要再补一个 trait 和一个 blanket impl。</span>

</details>

### Exercise 6: Session-Typed Diagnostic Protocol (Single-Use + Type-State)<br><span class="zh-inline">练习 6：带会话类型的诊断协议（Single-Use + Type-State）</span>

Design a diagnostic session with single-use test execution tokens:<br><span class="zh-inline">设计一个诊断会话系统，并配上单次使用的测试执行令牌：</span>

1. `DiagSession` starts in `Setup` state<br><span class="zh-inline">`DiagSession` 从 `Setup` 状态开始</span>
2. Transition to `Running` state and issue `N` execution tokens<br><span class="zh-inline">切到 `Running` 状态时，要一次发出 `N` 个执行令牌</span>
3. Each `TestToken` is consumed when the test runs<br><span class="zh-inline">每个 `TestToken` 在运行测试时都会被消费掉</span>
4. After all tokens are consumed, transition to `Complete` state<br><span class="zh-inline">所有令牌都消费完以后，才能进入 `Complete` 状态</span>
5. Generate a report only in `Complete` state<br><span class="zh-inline">报告只能在 `Complete` 状态生成</span>

**Advanced:** Use a const generic `N` to track how many tests remain at the type level.<br><span class="zh-inline">**进阶：** 用 const generic `N` 在类型层面追踪还剩多少个测试没跑。</span>

<details>
<summary>Sample Solution (Exercise 6)<br><span class="zh-inline">参考答案（练习 6）</span></summary>

```rust,ignore
// --- State types ---
pub struct Setup;
pub struct Running;
pub struct Complete;

/// Single-use test token. NOT Clone, NOT Copy — consumed on use.
pub struct TestToken {
    test_name: String,
}

#[derive(Debug)]
pub struct TestResult {
    pub test_name: String,
    pub passed: bool,
}

pub struct DiagSession<S> {
    name: String,
    results: Vec<TestResult>,
    _state: S,
}

impl DiagSession<Setup> {
    pub fn new(name: &str) -> Self {
        DiagSession {
            name: name.to_string(),
            results: Vec::new(),
            _state: Setup,
        }
    }

    /// Transition to Running — issues one token per test case.
    pub fn start(self, test_names: &[&str]) -> (DiagSession<Running>, Vec<TestToken>) {
        let tokens = test_names.iter()
            .map(|n| TestToken { test_name: n.to_string() })
            .collect();
        (
            DiagSession {
                name: self.name,
                results: Vec::new(),
                _state: Running,
            },
            tokens,
        )
    }
}

impl DiagSession<Running> {
    /// Consume a token to run one test. The move prevents double-running.
    pub fn run_test(mut self, token: TestToken) -> Self {
        let passed = true; // real code runs actual diagnostics here
        self.results.push(TestResult {
            test_name: token.test_name,
            passed,
        });
        self
    }

    /// Transition to Complete.
    ///
    /// **Note:** This solution does NOT enforce that all tokens have been
    /// consumed — `finish()` can be called with tokens still outstanding.
    /// The tokens will simply be dropped (they're not `#[must_use]`).
    /// For full compile-time enforcement, use the const-generic variant
    /// described in the "Advanced" note below, where `finish()` is only
    /// available on `DiagSession<Running, 0>`.
    pub fn finish(self) -> DiagSession<Complete> {
        DiagSession {
            name: self.name,
            results: self.results,
            _state: Complete,
        }
    }
}

impl DiagSession<Complete> {
    /// Report is ONLY available in Complete state.
    pub fn report(&self) -> String {
        let total = self.results.len();
        let passed = self.results.iter().filter(|r| r.passed).count();
        format!("{}: {}/{} passed", self.name, passed, total)
    }
}

// Usage:
// let session = DiagSession::new("GPU stress");
// let (mut session, tokens) = session.start(&["vram", "compute", "thermal"]);
// for token in tokens {
//     session = session.run_test(token);
// }
// let session = session.finish();
// println!("{}", session.report());  // "GPU stress: 3/3 passed"
//
// // These would NOT compile:
// // session.run_test(used_token);  →  ERROR: use of moved value
// // running_session.report();      →  ERROR: no method `report` on DiagSession<Running>
```

**Key points:**<br><span class="zh-inline">**要点：**</span>
- `TestToken` is not `Clone` or `Copy`, so consuming it makes double-running a compile error.<br><span class="zh-inline">`TestToken` 既不是 `Clone` 也不是 `Copy`，所以一旦消费，重复运行同一个测试就会变成编译错误。</span>
- `report()` only exists on `DiagSession<Complete>`.<br><span class="zh-inline">`report()` 只存在于 `DiagSession&lt;Complete&gt;` 上。</span>
- The advanced const-generic variant can enforce that all tokens are consumed before finish.<br><span class="zh-inline">进阶版如果引入 const generics，还可以在类型层面强制要求：所有令牌消费完之后才能 `finish`。</span>

</details>

## Key Takeaways<br><span class="zh-inline">本章要点</span>

1. **Practice with realistic protocols** — NVMe, firmware update, sensor pipelines, PCIe are all real-world targets for these patterns.<br><span class="zh-inline">**用真实协议来练手**：NVMe、固件升级、传感器流水线、PCIe 都是这些模式真正会落地的地方。</span>
2. **Each exercise maps to a core chapter** — use the cross-references to review the pattern before attempting.<br><span class="zh-inline">**每道题都对应前面的核心章节**：动手前可以先顺着交叉引用回去复习对应模式。</span>
3. **Solutions use expandable details** — try each exercise before revealing the solution.<br><span class="zh-inline">**答案都放在可展开区域里**：最好先自己做一遍，再展开看。</span>
4. **Compose patterns in exercise 5** — multi-protocol health checks combine typed commands, dimensional types, and validated boundaries.<br><span class="zh-inline">**练习 5 开始进入模式组合**：多协议健康检查会把 typed commands、量纲类型、validated boundaries 一起用起来。</span>
5. **Session types are the frontier** — they extend type-state from local APIs to distributed or protocol-oriented systems.<br><span class="zh-inline">**会话类型是更前沿的一步**：它把 type-state 从本地 API 扩展到了分布式系统和协议系统里。</span>

---

### Exercise 3: Sensor Reading Pipeline (Dimensional Analysis)<br><span class="zh-inline">练习 3：传感器读数流水线（量纲分析）</span>

Build a complete sensor pipeline:<br><span class="zh-inline">构建一条完整的传感器处理流水线：</span>

1. Define newtypes: `RawAdc`, `Celsius`, `Fahrenheit`, `Volts`, `Millivolts`, `Watts`<br><span class="zh-inline">定义这些 newtype：`RawAdc`、`Celsius`、`Fahrenheit`、`Volts`、`Millivolts`、`Watts`</span>
2. Implement `From<Celsius> for Fahrenheit` and vice versa<br><span class="zh-inline">实现 `From<Celsius> for Fahrenheit`，以及反向转换</span>
3. Create `impl Mul<Volts, Output=Watts> for Amperes`<br><span class="zh-inline">实现 `impl Mul<Volts, Output=Watts> for Amperes`，把 P = V × I 编进类型系统</span>
4. Build a `Threshold<T>` generic checker<br><span class="zh-inline">写一个泛型阈值检查器 `Threshold<T>`</span>
5. Write a pipeline: ADC → calibration → threshold check → result<br><span class="zh-inline">写出一条流水线：ADC → 校准 → 阈值检查 → 结果</span>

The compiler should reject: comparing `Celsius` to `Volts`, adding `Watts` to `Rpm`, passing `Millivolts` where `Volts` is expected.<br><span class="zh-inline">编译器应当拒绝这些错误操作：拿 `Celsius` 和 `Volts` 比较、把 `Watts` 和 `Rpm` 相加、或者把 `Millivolts` 塞给一个本来要 `Volts` 的接口。</span>

<details>
<summary>Sample Solution (Exercise 3)<br><span class="zh-inline">参考答案（练习 3）</span></summary>

```rust,ignore
use std::ops::{Add, Sub, Mul};

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct RawAdc(pub u16);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Celsius(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Fahrenheit(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Volts(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Millivolts(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Amperes(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Watts(pub f64);

// --- Safe conversions ---
impl From<Celsius> for Fahrenheit {
    fn from(c: Celsius) -> Self { Fahrenheit(c.0 * 9.0 / 5.0 + 32.0) }
}
impl From<Fahrenheit> for Celsius {
    fn from(f: Fahrenheit) -> Self { Celsius((f.0 - 32.0) * 5.0 / 9.0) }
}
impl From<Millivolts> for Volts {
    fn from(mv: Millivolts) -> Self { Volts(mv.0 / 1000.0) }
}
impl From<Volts> for Millivolts {
    fn from(v: Volts) -> Self { Millivolts(v.0 * 1000.0) }
}

// --- Arithmetic on same-unit types ---
// NOTE: Adding absolute temperatures (25°C + 30°C) is physically
// questionable — see ch06's discussion of ΔT newtypes for a more
// rigorous approach.  Here we keep it simple for the exercise.
impl Add for Celsius {
    type Output = Celsius;
    fn add(self, rhs: Self) -> Celsius { Celsius(self.0 + rhs.0) }
}
impl Sub for Celsius {
    type Output = Celsius;
    fn sub(self, rhs: Self) -> Celsius { Celsius(self.0 - rhs.0) }
}

// P = V × I  (cross-unit multiplication)
impl Mul<Amperes> for Volts {
    type Output = Watts;
    fn mul(self, rhs: Amperes) -> Watts { Watts(self.0 * rhs.0) }
}

// --- Generic threshold checker ---
// Exercise 3 extends ch06's Threshold with a generic ThresholdResult<T>
// that carries the triggering reading — an evolution of ch06's simpler
// ThresholdResult { Normal, Warning, Critical } enum.
pub enum ThresholdResult<T> {
    Normal(T),
    Warning(T),
    Critical(T),
}

pub struct Threshold<T> {
    pub warning: T,
    pub critical: T,
}

// Generic impl — works for any unit type that supports PartialOrd.
impl<T: PartialOrd + Copy> Threshold<T> {
    pub fn check(&self, reading: T) -> ThresholdResult<T> {
        if reading >= self.critical {
            ThresholdResult::Critical(reading)
        } else if reading >= self.warning {
            ThresholdResult::Warning(reading)
        } else {
            ThresholdResult::Normal(reading)
        }
    }
}
// Now `Threshold<Rpm>`, `Threshold<Volts>`, etc. all work automatically.

// --- Pipeline: ADC → calibration → threshold → result ---
pub struct CalibrationParams {
    pub scale: f64,  // ADC counts per °C
    pub offset: f64, // °C at ADC 0
}

pub fn calibrate(raw: RawAdc, params: &CalibrationParams) -> Celsius {
    Celsius(raw.0 as f64 / params.scale + params.offset)
}

pub fn sensor_pipeline(
    raw: RawAdc,
    params: &CalibrationParams,
    threshold: &Threshold<Celsius>,
) -> ThresholdResult<Celsius> {
    let temp = calibrate(raw, params);
    threshold.check(temp)
}

// Compile-time safety — these would NOT compile:
// let _ = Celsius(25.0) + Volts(12.0);   // ERROR: mismatched types
// let _: Millivolts = Volts(1.0);         // ERROR: no implicit coercion
// let _ = Watts(100.0) + Rpm(3000);       // ERROR: mismatched types
```

**Key points:**<br><span class="zh-inline">**要点：**</span>
- Each physical unit is a distinct type — no accidental mixing.<br><span class="zh-inline">每个物理单位都是独立类型，所以不会不小心混着用。</span>
- `Mul<Amperes> for Volts` yields `Watts`, encoding P = V × I in the type system.<br><span class="zh-inline">`Mul<Amperes> for Volts` 会产出 `Watts`，等于把 P = V × I 直接写进了类型系统。</span>
- Explicit `From` conversions for related units.<br><span class="zh-inline">相关单位之间的转换都通过显式 `From` 完成。</span>
- `Threshold<Celsius>` only accepts `Celsius`.<br><span class="zh-inline">`Threshold<Celsius>` 只会接受 `Celsius`，没法误拿 RPM 去阈值判断。</span>

</details>

### Exercise 4: PCIe Capability Walk (Phantom Types + Validated Boundary)<br><span class="zh-inline">练习 4：PCIe Capability 遍历（Phantom Types + 已验证边界）</span>

Model the PCIe capability linked list:<br><span class="zh-inline">为 PCIe capability 链表建模：</span>

1. `RawCapability` — unvalidated bytes from config space<br><span class="zh-inline">`RawCapability`：来自配置空间、尚未验证的原始字节</span>
2. `ValidCapability` — parsed and validated (via TryFrom)<br><span class="zh-inline">`ValidCapability`：通过 `TryFrom` 解析并验证后的能力项</span>
3. Each capability type has its own phantom-typed register layout<br><span class="zh-inline">每一种 capability 类型都要有自己对应的 phantom type 寄存器布局</span>
4. Walking the list returns an iterator of `ValidCapability` values<br><span class="zh-inline">遍历这条链表时，要返回 `ValidCapability` 值的迭代器</span>

**Hint:** Combine validated boundaries (ch07) with phantom types (ch09).<br><span class="zh-inline">**提示：** 把已验证边界（ch07）和 phantom types（ch09）揉在一起用。</span>

<details>
<summary>Sample Solution (Exercise 4)<br><span class="zh-inline">参考答案（练习 4）</span></summary>

```rust,ignore
use std::marker::PhantomData;

// --- Phantom markers for capability types ---
pub struct Msi;
pub struct MsiX;
pub struct PciExpress;
pub struct PowerMgmt;

// PCI capability IDs from the spec
const CAP_ID_PM:   u8 = 0x01;
const CAP_ID_MSI:  u8 = 0x05;
const CAP_ID_PCIE: u8 = 0x10;
const CAP_ID_MSIX: u8 = 0x11;

/// Unvalidated bytes — may be garbage.
#[derive(Debug)]
pub struct RawCapability {
    pub id: u8,
    pub next_ptr: u8,
    pub data: Vec<u8>,
}

/// Validated and type-tagged capability.
#[derive(Debug)]
pub struct ValidCapability<Kind> {
    id: u8,
    next_ptr: u8,
    data: Vec<u8>,
    _kind: PhantomData<Kind>,
}

// --- TryFrom: parse-don't-validate boundary ---
impl TryFrom<RawCapability> for ValidCapability<PowerMgmt> {
    type Error = &'static str;
    fn try_from(raw: RawCapability) -> Result<Self, Self::Error> {
        if raw.id != CAP_ID_PM { return Err("not a PM capability"); }
        if raw.data.len() < 2 { return Err("PM data too short"); }
        Ok(ValidCapability {
            id: raw.id, next_ptr: raw.next_ptr,
            data: raw.data, _kind: PhantomData,
        })
    }
}

impl TryFrom<RawCapability> for ValidCapability<Msi> {
    type Error = &'static str;
    fn try_from(raw: RawCapability) -> Result<Self, Self::Error> {
        if raw.id != CAP_ID_MSI { return Err("not an MSI capability"); }
        if raw.data.len() < 6 { return Err("MSI data too short"); }
        Ok(ValidCapability {
            id: raw.id, next_ptr: raw.next_ptr,
            data: raw.data, _kind: PhantomData,
        })
    }
}

// (Similar TryFrom impls for MsiX, PciExpress — omitted for brevity)

// --- Type-safe accessors: only available on the correct capability ---
impl ValidCapability<PowerMgmt> {
    pub fn pm_control(&self) -> u16 {
        u16::from_le_bytes([self.data[0], self.data[1]])
    }
}

impl ValidCapability<Msi> {
    pub fn message_control(&self) -> u16 {
        u16::from_le_bytes([self.data[0], self.data[1]])
    }
    pub fn vectors_requested(&self) -> u32 {
        1 << ((self.message_control() >> 1) & 0x07)
    }
}

impl ValidCapability<MsiX> {
    pub fn table_size(&self) -> u16 {
        (u16::from_le_bytes([self.data[0], self.data[1]]) & 0x07FF) + 1
    }
}

// --- Capability walker: iterates the linked list ---
pub struct CapabilityWalker<'a> {
    config_space: &'a [u8],
    next_ptr: u8,
}

impl<'a> CapabilityWalker<'a> {
    pub fn new(config_space: &'a [u8]) -> Self {
        // Capability pointer lives at offset 0x34 in PCI config space
        let first_ptr = if config_space.len() > 0x34 {
            config_space[0x34]
        } else { 0 };
        CapabilityWalker { config_space, next_ptr: first_ptr }
    }
}

impl<'a> Iterator for CapabilityWalker<'a> {
    type Item = RawCapability;
    fn next(&mut self) -> Option<RawCapability> {
        if self.next_ptr == 0 { return None; }
        let off = self.next_ptr as usize;
        if off + 2 > self.config_space.len() { return None; }
        let id = self.config_space[off];
        let next = self.config_space[off + 1];
        let end = if next > 0 { next as usize } else {
            (off + 16).min(self.config_space.len())
        };
        let data = self.config_space[off + 2..end].to_vec();
        self.next_ptr = next;
        Some(RawCapability { id, next_ptr: next, data })
    }
}

// Usage:
// for raw_cap in CapabilityWalker::new(&config_space) {
//     if let Ok(pm) = ValidCapability::<PowerMgmt>::try_from(raw_cap) {
//         println!("PM control: 0x{:04X}", pm.pm_control());
//     }
// }
```

**Key points:**<br><span class="zh-inline">**要点：**</span>
- `RawCapability` → `ValidCapability<Kind>` is the parse-don't-validate boundary.<br><span class="zh-inline">`RawCapability` 到 `ValidCapability&lt;Kind&gt;` 这一跳，就是 parse-don't-validate 边界。</span>
- `pm_control()` only exists on `ValidCapability<PowerMgmt>`.<br><span class="zh-inline">`pm_control()` 只存在于 `ValidCapability&lt;PowerMgmt&gt;` 上。</span>
- The walker yields raw capabilities; callers validate the ones they care about.<br><span class="zh-inline">遍历器吐出的是原始 capability，而调用方只需要把自己关心的那些再验证成强类型即可。</span>

</details>

### Exercise 2: Firmware Update State Machine (Type-State)<br><span class="zh-inline">练习 2：固件升级状态机（Type-State）</span>

Model a BMC firmware update lifecycle:<br><span class="zh-inline">为 BMC 固件升级生命周期建立一个模型：</span>

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Uploading : begin_upload() / 开始上传
    Uploading --> Uploading : send_chunk(data) / 发送分块
    Uploading --> Verifying : finish_upload() / 完成上传
    Uploading --> Idle : abort() / 中止
    Verifying --> Applying : verify() + VerifiedImage token / 校验成功加令牌
    Verifying --> Idle : verify() fail or abort() / 校验失败或中止
    Applying --> Rebooting : apply(token) / 应用固件
    Rebooting --> Complete : reboot_complete() / 重启完成
    Complete --> [*]
```

Requirements:<br><span class="zh-inline">要求：</span>
1. Each state is a distinct type<br><span class="zh-inline">每个状态都必须是不同的类型</span>
2. Upload can only begin from Idle<br><span class="zh-inline">上传只能从 Idle 开始</span>
3. Verification requires upload to be complete<br><span class="zh-inline">校验必须在上传完成之后才能做</span>
4. Apply can only happen after successful verification — take a `VerifiedImage` proof token<br><span class="zh-inline">应用固件只能发生在校验成功之后，而且必须拿到一个 `VerifiedImage` 证明令牌</span>
5. Reboot is the only option after applying<br><span class="zh-inline">一旦进入 Applying，后面唯一允许的动作就是重启</span>
6. Add an `abort()` method available in Uploading and Verifying<br><span class="zh-inline">给 Uploading 和 Verifying 加上 `abort()`，但 Applying 里不要有，已经太晚了</span>

**Hint:** Combine type-state (ch05) with capability tokens (ch04).<br><span class="zh-inline">**提示：** 把 type-state（ch05）和 capability token（ch04）一起用。</span>

<details>
<summary>Sample Solution (Exercise 2)<br><span class="zh-inline">参考答案（练习 2）</span></summary>

```rust,ignore
// --- State types ---
// Design choice: here we store state inline (`_state: S`) rather than using
// `PhantomData<S>` (ch05's approach). This lets states carry data —
// e.g., `Uploading { bytes_sent: usize }` tracks progress. Use `PhantomData`
// when states are pure markers (zero-sized); use inline storage when
// states carry meaningful runtime data.
pub struct Idle;
pub struct Uploading { bytes_sent: usize }  // not ZST — carries progress data
pub struct Verifying;
pub struct Applying;
pub struct Rebooting;
pub struct Complete;

/// Proof token: only constructed inside verify().
pub struct VerifiedImage { _private: () }

pub struct FwUpdate<S> {
    bmc_addr: String,
    _state: S,
}

impl FwUpdate<Idle> {
    pub fn new(bmc_addr: &str) -> Self {
        FwUpdate { bmc_addr: bmc_addr.to_string(), _state: Idle }
    }
    pub fn begin_upload(self) -> FwUpdate<Uploading> {
        FwUpdate { bmc_addr: self.bmc_addr, _state: Uploading { bytes_sent: 0 } }
    }
}

impl FwUpdate<Uploading> {
    pub fn send_chunk(mut self, chunk: &[u8]) -> Self {
        self._state.bytes_sent += chunk.len();
        self
    }
    pub fn finish_upload(self) -> FwUpdate<Verifying> {
        FwUpdate { bmc_addr: self.bmc_addr, _state: Verifying }
    }
    /// Abort available during upload — returns to Idle.
    pub fn abort(self) -> FwUpdate<Idle> {
        FwUpdate { bmc_addr: self.bmc_addr, _state: Idle }
    }
}

impl FwUpdate<Verifying> {
    /// On success, returns the next state AND a VerifiedImage proof token.
    pub fn verify(self) -> Result<(FwUpdate<Applying>, VerifiedImage), FwUpdate<Idle>> {
        // Real: check CRC, signature, compatibility
        let token = VerifiedImage { _private: () };
        Ok((
            FwUpdate { bmc_addr: self.bmc_addr, _state: Applying },
            token,
        ))
    }
    /// Abort available during verification.
    pub fn abort(self) -> FwUpdate<Idle> {
        FwUpdate { bmc_addr: self.bmc_addr, _state: Idle }
    }
}

impl FwUpdate<Applying> {
    /// Consumes the VerifiedImage proof — can't apply without verification.
    /// Note: NO abort() method here — once flashing starts, it's too dangerous.
    pub fn apply(self, _proof: VerifiedImage) -> FwUpdate<Rebooting> {
        FwUpdate { bmc_addr: self.bmc_addr, _state: Rebooting }
    }
}

impl FwUpdate<Rebooting> {
    pub fn wait_for_reboot(self) -> FwUpdate<Complete> {
        FwUpdate { bmc_addr: self.bmc_addr, _state: Complete }
    }
}

impl FwUpdate<Complete> {
    pub fn version(&self) -> &str { "2.1.0" }
}

// Usage:
// let fw = FwUpdate::new("192.168.1.100")
//     .begin_upload()
//     .send_chunk(b"image_data")
//     .finish_upload();
// let (fw, proof) = fw.verify().map_err(|_| "verify failed")?;
// let fw = fw.apply(proof).wait_for_reboot();
// println!("New version: {}", fw.version());
```

**Key points:**<br><span class="zh-inline">**要点：**</span>
- `abort()` exists only on `FwUpdate<Uploading>` and `FwUpdate<Verifying>`.<br><span class="zh-inline">`abort()` 只存在于 `FwUpdate&lt;Uploading&gt;` 和 `FwUpdate&lt;Verifying&gt;` 上。</span>
- `VerifiedImage` has a private field, so only `verify()` can create one.<br><span class="zh-inline">`VerifiedImage` 内部字段是私有的，所以只有 `verify()` 能造出这个证明令牌。</span>
- `apply()` consumes the proof token — you can't skip verification.<br><span class="zh-inline">`apply()` 会消费证明令牌，所以根本没法跳过校验这一步。</span>

</details>
