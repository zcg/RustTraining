# Dimensional Analysis — Making the Compiler Check Your Units 🟢<br><span class="zh-inline">量纲分析：让编译器帮忙检查单位 🟢</span>

> **What you'll learn:** How newtype wrappers and the `uom` crate turn the compiler into a unit-checking engine, preventing the class of bug that destroyed a $328M spacecraft.<br><span class="zh-inline">**本章将学到什么：** 如何用 newtype 包装器和 `uom` crate，把编译器变成单位检查引擎，从而避免那种曾经毁掉一艘 3.28 亿美元航天器的错误。</span>
>
> **Cross-references:** [ch02](ch02-typed-command-interfaces-request-determi.md) (typed commands use these types), [ch07](ch07-validated-boundaries-parse-dont-validate.md) (validated boundaries), [ch10](ch10-putting-it-all-together-a-complete-diagn.md) (integration)<br><span class="zh-inline">**交叉阅读：** [ch02](ch02-typed-command-interfaces-request-determi.md) 里的类型化命令会用到这些类型；[ch07](ch07-validated-boundaries-parse-dont-validate.md) 讲已验证边界；[ch10](ch10-putting-it-all-together-a-complete-diagn.md) 讲整体集成。</span>

## The Mars Climate Orbiter<br><span class="zh-inline">火星气候探测器事故</span>

In 1999, NASA's Mars Climate Orbiter was lost because one team sent thrust data in **pound-force seconds** while the navigation team expected **newton-seconds**. The spacecraft entered the atmosphere at 57 km instead of 226 km and disintegrated. Cost: $327.6 million.<br><span class="zh-inline">1999 年，NASA 的火星气候探测器坠毁，原因是一个团队发送的推力数据单位是 **磅力秒**，而导航团队期待的却是 **牛顿秒**。探测器以 57 公里的高度切入大气层，而不是预期的 226 公里，最后直接解体。损失是 3.276 亿美元。</span>

The root cause: **both values were `double`**. The compiler couldn't distinguish them.<br><span class="zh-inline">根本原因很朴素，也很要命：**两边的值都是 `double`**。编译器根本分不出它们的单位差异。</span>

This same class of bug lurks in every hardware diagnostic that deals with physical quantities:<br><span class="zh-inline">只要硬件诊断里涉及物理量，这一类 bug 就一直潜伏着：</span>

```c
// C — all doubles, no unit checking
double read_temperature(int sensor_id);   // Celsius? Fahrenheit? Kelvin?
double read_voltage(int channel);          // Volts? Millivolts?
double read_fan_speed(int fan_id);         // RPM? Radians per second?

// Bug: comparing Celsius to Fahrenheit
if (read_temperature(0) > read_temperature(1)) { ... }  // units might differ!
```

## Newtypes for Physical Quantities<br><span class="zh-inline">给物理量包一层 Newtype</span>

The simplest correct-by-construction approach: **wrap each unit in its own type**.<br><span class="zh-inline">最简单、也是最“构造即正确”的办法，就是：**每种单位都包成自己的类型**。</span>

```rust,ignore
use std::fmt;

/// Temperature in degrees Celsius.
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Celsius(pub f64);

/// Temperature in degrees Fahrenheit.
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Fahrenheit(pub f64);

/// Voltage in volts.
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Volts(pub f64);

/// Voltage in millivolts.
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Millivolts(pub f64);

/// Fan speed in RPM.
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Rpm(pub f64);

// Conversions are explicit:
impl From<Celsius> for Fahrenheit {
    fn from(c: Celsius) -> Self {
        Fahrenheit(c.0 * 9.0 / 5.0 + 32.0)
    }
}

impl From<Fahrenheit> for Celsius {
    fn from(f: Fahrenheit) -> Self {
        Celsius((f.0 - 32.0) * 5.0 / 9.0)
    }
}

impl From<Volts> for Millivolts {
    fn from(v: Volts) -> Self {
        Millivolts(v.0 * 1000.0)
    }
}

impl From<Millivolts> for Volts {
    fn from(mv: Millivolts) -> Self {
        Volts(mv.0 / 1000.0)
    }
}

impl fmt::Display for Celsius {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:.1}°C", self.0)
    }
}

impl fmt::Display for Rpm {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:.0} RPM", self.0)
    }
}
```

Now the compiler catches unit mismatches:<br><span class="zh-inline">这样一来，单位错配就会被编译器直接逮住：</span>

```rust,ignore
# #[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
# pub struct Celsius(pub f64);
# #[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
# pub struct Volts(pub f64);

fn check_thermal_limit(temp: Celsius, limit: Celsius) -> bool {
    temp > limit  // ✅ same units — compiles
}

// fn bad_comparison(temp: Celsius, voltage: Volts) -> bool {
//     temp > voltage  // ❌ ERROR: mismatched types — Celsius vs Volts
// }
```

**Zero runtime cost** — newtypes compile down to raw `f64` values. The wrapper is purely a type-level concept.<br><span class="zh-inline">**运行时零额外成本**。这些 newtype 最终还是会编译成原始的 `f64`，包装层的意义完全体现在类型级别。</span>

## Newtype Macro for Hardware Quantities<br><span class="zh-inline">给硬件量纲写一个 Newtype 宏</span>

Writing newtypes by hand gets repetitive. A macro eliminates the boilerplate:<br><span class="zh-inline">newtype 一旦多起来，手写就会很烦。这个时候可以上一个宏，把重复劳动抹平。</span>

```rust,ignore
/// Generate a newtype for a physical quantity.
macro_rules! quantity {
    ($Name:ident, $unit:expr) => {
        #[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
        pub struct $Name(pub f64);

        impl $Name {
            pub fn new(value: f64) -> Self { $Name(value) }
            pub fn value(self) -> f64 { self.0 }
        }

        impl std::fmt::Display for $Name {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "{:.2} {}", self.0, $unit)
            }
        }

        impl std::ops::Add for $Name {
            type Output = Self;
            fn add(self, rhs: Self) -> Self { $Name(self.0 + rhs.0) }
        }

        impl std::ops::Sub for $Name {
            type Output = Self;
            fn sub(self, rhs: Self) -> Self { $Name(self.0 - rhs.0) }
        }
    };
}

// Usage:
quantity!(Celsius, "°C");
quantity!(Fahrenheit, "°F");
quantity!(Volts, "V");
quantity!(Millivolts, "mV");
quantity!(Rpm, "RPM");
quantity!(Watts, "W");
quantity!(Amperes, "A");
quantity!(Pascals, "Pa");
quantity!(Hertz, "Hz");
quantity!(Bytes, "B");
```

Each line generates a complete type with Display, Add, Sub, and comparison operators. **All at zero runtime cost.**<br><span class="zh-inline">每一行都会生成一个完整类型，自带 Display、加减法和比较能力。**而且运行时成本仍然是零。**</span>

> **Physics caveat:** The macro generates `Add` for *all* quantities, including
> `Celsius`. Adding absolute temperatures (`25°C + 30°C = 55°C`) is not
> physically meaningful — you'd need a separate `TemperatureDelta` type for
> differences. The `uom` crate (shown later) handles this correctly. For
> simple sensor diagnostics where you only compare and display, you can omit
> `Add`/`Sub` from temperature types and keep them for quantities where
> addition makes sense (Watts, Volts, Bytes). If you need delta arithmetic,
> define a `CelsiusDelta(f64)` newtype with `impl Add&lt;CelsiusDelta&gt; for Celsius`.<br><span class="zh-inline">**物理学上的提醒：** 这个宏会给*所有*量都生成 `Add`，包括 `Celsius`。但绝对温度相加，比如 `25°C + 30°C = 55°C`，在物理意义上就不严谨了。更合理的做法是单独定义一个 `TemperatureDelta` 类型。后面会提到的 `uom` crate 能更正确地处理这类问题。如果当前场景只是简单读取传感器、比较阈值、做展示，那温度类型完全可以不实现 `Add`/`Sub`，只给瓦特、电压、字节数这类适合相加的量保留这些操作。如果确实需要做温差运算，可以定义 `CelsiusDelta(f64)`，再实现 `impl Add&lt;CelsiusDelta&gt; for Celsius`。</span>

## Applied Example: Sensor Pipeline<br><span class="zh-inline">实际例子：传感器处理流水线</span>

A typical diagnostic reads raw ADC values, converts them to physical units, and compares against thresholds. With dimensional types, each step is type-checked:<br><span class="zh-inline">一个典型的诊断流程，通常会先读取原始 ADC 值，再把它转换成物理量，最后跟阈值做比较。只要把量纲类型引进来，这一整条流水线每一步都能接受类型检查。</span>

```rust,ignore
# macro_rules! quantity {
#     ($Name:ident, $unit:expr) => {
#         #[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
#         pub struct $Name(pub f64);
#         impl $Name {
#             pub fn new(value: f64) -> Self { $Name(value) }
#             pub fn value(self) -> f64 { self.0 }
#         }
#         impl std::fmt::Display for $Name {
#             fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
#                 write!(f, "{:.2} {}", self.0, $unit)
#             }
#         }
#     };
# }
# quantity!(Celsius, "°C");
# quantity!(Volts, "V");
# quantity!(Rpm, "RPM");

/// Raw ADC reading — not yet a physical quantity.
#[derive(Debug, Clone, Copy)]
pub struct AdcReading {
    pub channel: u8,
    pub raw: u16,   // 12-bit ADC value (0–4095)
}

/// Calibration coefficients for converting ADC → physical unit.
pub struct TemperatureCalibration {
    pub offset: f64,
    pub scale: f64,   // °C per ADC count
}

pub struct VoltageCalibration {
    pub reference_mv: f64,
    pub divider_ratio: f64,
}

impl TemperatureCalibration {
    /// Convert raw ADC → Celsius. The return type guarantees the output is Celsius.
    pub fn convert(&self, adc: AdcReading) -> Celsius {
        Celsius::new(adc.raw as f64 * self.scale + self.offset)
    }
}

impl VoltageCalibration {
    /// Convert raw ADC → Volts. The return type guarantees the output is Volts.
    pub fn convert(&self, adc: AdcReading) -> Volts {
        Volts::new(adc.raw as f64 * self.reference_mv / 4096.0 / self.divider_ratio / 1000.0)
    }
}

/// Threshold check — only compiles if units match.
pub struct Threshold<T: PartialOrd> {
    pub warning: T,
    pub critical: T,
}

#[derive(Debug, PartialEq)]
pub enum ThresholdResult {
    Normal,
    Warning,
    Critical,
}

impl<T: PartialOrd> Threshold<T> {
    pub fn check(&self, value: &T) -> ThresholdResult {
        if *value >= self.critical {
            ThresholdResult::Critical
        } else if *value >= self.warning {
            ThresholdResult::Warning
        } else {
            ThresholdResult::Normal
        }
    }
}

fn sensor_pipeline_example() {
    let temp_cal = TemperatureCalibration { offset: -50.0, scale: 0.0625 };
    let temp_threshold = Threshold {
        warning: Celsius::new(85.0),
        critical: Celsius::new(100.0),
    };

    let adc = AdcReading { channel: 0, raw: 2048 };
    let temp: Celsius = temp_cal.convert(adc);

    let result = temp_threshold.check(&temp);
    println!("Temperature: {temp}, Status: {result:?}");

    // This won't compile — can't check a Celsius reading against a Volts threshold:
    // let volt_threshold = Threshold {
    //     warning: Volts::new(11.4),
    //     critical: Volts::new(10.8),
    // };
    // volt_threshold.check(&temp);  // ❌ ERROR: expected &Volts, found &Celsius
}
```

The **entire pipeline** is statically type-checked:<br><span class="zh-inline">**整条流水线**都会接受静态类型检查：</span>
- ADC readings are raw counts (not units)<br><span class="zh-inline">ADC 读数只是原始计数值，还不是物理单位</span>
- Calibration produces typed quantities (Celsius, Volts)<br><span class="zh-inline">校准阶段会产出带类型的物理量，比如 `Celsius`、`Volts`</span>
- Thresholds are generic over the quantity type<br><span class="zh-inline">阈值结构按“量的类型”泛型化</span>
- Comparing Celsius against Volts is a **compile error**<br><span class="zh-inline">把摄氏度和电压放到一起比较，会直接变成**编译错误**</span>

## The uom Crate<br><span class="zh-inline">`uom` crate</span>

For production use, the [`uom`](https://crates.io/crates/uom) crate provides a comprehensive dimensional analysis system with hundreds of units, automatic conversion, and zero runtime overhead:<br><span class="zh-inline">如果是生产环境，[`uom`](https://crates.io/crates/uom) crate 会提供一整套更完整的量纲分析系统，支持成百上千种单位、自动换算，而且运行时开销同样是零。</span>

```rust,ignore
// Cargo.toml: uom = { version = "0.36", features = ["f64"] }
//
// use uom::si::f64::*;
// use uom::si::thermodynamic_temperature::degree_celsius;
// use uom::si::electric_potential::volt;
// use uom::si::power::watt;
//
// let temp = ThermodynamicTemperature::new::<degree_celsius>(85.0);
// let voltage = ElectricPotential::new::<volt>(12.0);
// let power = Power::new::<watt>(250.0);
//
// // temp + voltage;  // ❌ compile error — can't add temperature to voltage
// // power > temp;    // ❌ compile error — can't compare power to temperature
```

Use `uom` when you need automatic derived-unit support (e.g., Watts = Volts × Amperes). Use hand-rolled newtypes when you need only simple quantities without derived-unit arithmetic.<br><span class="zh-inline">如果需要自动推导复合单位，比如 `Watts = Volts × Amperes`，那就上 `uom`。如果只是处理一些简单量，不需要派生单位运算，手写 newtype 往往更轻更直接。</span>

### When to Use Dimensional Types<br><span class="zh-inline">什么时候适合用量纲类型</span>

| Scenario<br><span class="zh-inline">场景</span> | Recommendation<br><span class="zh-inline">建议</span> |
|----------|---------------|
| Sensor readings (temp, voltage, fan)<br><span class="zh-inline">传感器读数，比如温度、电压、风扇转速</span> | ✅ Always — prevents unit confusion<br><span class="zh-inline">✅ 建议总是使用，能有效防止单位混淆</span> |
| Threshold comparisons<br><span class="zh-inline">阈值比较</span> | ✅ Always — generic `Threshold<T>`<br><span class="zh-inline">✅ 建议总是使用，可以配合泛型 `Threshold&lt;T&gt;`</span> |
| Cross-subsystem data exchange<br><span class="zh-inline">跨子系统数据交换</span> | ✅ Always — enforce contracts at API boundaries<br><span class="zh-inline">✅ 建议总是使用，在 API 边界上把契约钉死</span> |
| Internal calculations (same unit throughout)<br><span class="zh-inline">内部计算，而且从头到尾都是同一单位</span> | ⚠️ Optional — less bug-prone<br><span class="zh-inline">⚠️ 可选，这类场景出错概率相对低一些</span> |
| String/display formatting<br><span class="zh-inline">字符串展示和格式化</span> | ❌ Use Display impl on the quantity type<br><span class="zh-inline">❌ 不需要单独搞，直接给量纲类型实现 Display 就行</span> |

## Sensor Pipeline Type Flow<br><span class="zh-inline">传感器流水线的类型流转</span>

```mermaid
flowchart LR
    RAW["raw: &[u8]<br/>原始字节"] -->|parse| C["Celsius(f64)"]
    RAW -->|parse| R["Rpm(u32)"]
    RAW -->|parse| V["Volts(f64)"]
    C -->|threshold check| TC["Threshold<Celsius>"]
    R -->|threshold check| TR["Threshold<Rpm>"]
    C -.->|"C + R"| ERR["❌ mismatched types<br/>类型不匹配"]
    style RAW fill:#e1f5fe,color:#000
    style C fill:#c8e6c9,color:#000
    style R fill:#fff3e0,color:#000
    style V fill:#e8eaf6,color:#000
    style TC fill:#c8e6c9,color:#000
    style TR fill:#fff3e0,color:#000
    style ERR fill:#ffcdd2,color:#000
```

## Exercise: Power Budget Calculator<br><span class="zh-inline">练习：功率预算计算器</span>

Create `Watts(f64)` and `Amperes(f64)` newtypes. Implement:<br><span class="zh-inline">创建 `Watts(f64)` 和 `Amperes(f64)` 两个 newtype，并完成下面这些功能：</span>
- `Watts::from_vi(volts: Volts, amps: Amperes) -> Watts` (P = V × I)<br><span class="zh-inline">实现 `Watts::from_vi(volts: Volts, amps: Amperes) -> Watts`，也就是 `P = V × I`</span>
- A `PowerBudget` that tracks total watts and rejects additions that exceed a configured limit.<br><span class="zh-inline">实现一个 `PowerBudget`，跟踪总瓦数，并在超出配置上限时拒绝继续累加</span>
- Attempting `Watts + Celsius` should be a compile error.<br><span class="zh-inline">尝试 `Watts + Celsius` 时，应该得到编译错误</span>

<details>
<summary>Solution<br><span class="zh-inline">参考答案</span></summary>

```rust,ignore
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Watts(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Amperes(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Volts(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Celsius(pub f64);

impl Watts {
    pub fn from_vi(volts: Volts, amps: Amperes) -> Self {
        Watts(volts.0 * amps.0)
    }
}

impl std::ops::Add for Watts {
    type Output = Watts;
    fn add(self, rhs: Watts) -> Watts {
        Watts(self.0 + rhs.0)
    }
}

pub struct PowerBudget {
    total: Watts,
    limit: Watts,
}

impl PowerBudget {
    pub fn new(limit: Watts) -> Self {
        PowerBudget { total: Watts(0.0), limit }
    }
    pub fn add(&mut self, w: Watts) -> Result<(), String> {
        let new_total = Watts(self.total.0 + w.0);
        if new_total > self.limit {
            return Err(format!("budget exceeded: {:?} > {:?}", new_total, self.limit));
        }
        self.total = new_total;
        Ok(())
    }
}

// ❌ Compile error: Watts + Celsius → "mismatched types"
// let bad = Watts(100.0) + Celsius(50.0);
```

</details>

## Key Takeaways<br><span class="zh-inline">本章要点</span>

1. **Newtypes prevent unit confusion at zero cost** — `Celsius` and `Rpm` are both `f64` inside, but the compiler treats them as different types.<br><span class="zh-inline">**newtype 能以零成本防止单位混淆**：`Celsius` 和 `Rpm` 内部虽然都是 `f64`，但编译器会把它们当成完全不同的类型。</span>
2. **The Mars Climate Orbiter bug is impossible** — passing `Pounds` where `Newtons` is expected is a compile error.<br><span class="zh-inline">**火星气候探测器那种错误会变得不可能**：该传 `Newtons` 的地方传了 `Pounds`，会直接在编译阶段报错。</span>
3. **`quantity!` macro reduces boilerplate** — stamp out Display, arithmetic, and threshold logic for each unit.<br><span class="zh-inline">**`quantity!` 宏可以大幅减少样板代码**：每种单位的 Display、算术操作和阈值逻辑都能批量生成。</span>
4. **`uom` crate handles derived units** — use it when you need `Watts = Volts × Amperes` automatically.<br><span class="zh-inline">**`uom` crate 适合处理派生单位**：如果需要自动推导 `Watts = Volts × Amperes` 这种关系，它会更省心。</span>
5. **Threshold is generic over the quantity** — `Threshold<Celsius>` can't accidentally compare to `Threshold<Rpm>`.<br><span class="zh-inline">**Threshold 可以按量纲类型泛型化**：`Threshold&lt;Celsius&gt;` 不可能误拿去和 `Threshold&lt;Rpm&gt;` 混着比较。</span>

---
