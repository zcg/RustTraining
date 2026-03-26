# The Philosophy — Why Types Beat Tests 🟢<br><span class="zh-inline">核心思想：为什么类型比测试更强 🟢</span>

> **What you'll learn:** The three levels of compile-time correctness (value, state, protocol), how generic function signatures act as compiler-checked guarantees, and when correct-by-construction patterns are — and aren't — worth the investment.<br><span class="zh-inline">**本章将学到什么：** 编译期正确性的三个层次，也就是值、状态和协议；泛型函数签名如何变成编译器持续检查的保证；以及什么时候值得投入“构造即正确”模式，什么时候其实没必要。</span>
>
> **Cross-references:** [ch02](ch02-typed-command-interfaces-request-determi.md) (typed commands), [ch05](ch05-protocol-state-machines-type-state-for-r.md) (type-state), [ch13](ch13-reference-card.md) (reference card)<br><span class="zh-inline">**交叉引用：** [ch02](ch02-typed-command-interfaces-request-determi.md) 讲类型化命令，[ch05](ch05-protocol-state-machines-type-state-for-r.md) 讲 type-state，[ch13](ch13-reference-card.md) 是整本书的参考卡。</span>

## The Cost of Runtime Checking<br><span class="zh-inline">运行时检查的代价</span>

Consider a typical runtime guard in a diagnostics codebase:<br><span class="zh-inline">先看一段诊断系统里很常见的运行时防御代码：</span>

```rust,ignore
fn read_sensor(sensor_type: &str, raw: &[u8]) -> f64 {
    match sensor_type {
        "temperature" => raw[0] as i8 as f64,          // signed byte
        "fan_speed"   => u16::from_le_bytes([raw[0], raw[1]]) as f64,
        "voltage"     => u16::from_le_bytes([raw[0], raw[1]]) as f64 / 1000.0,
        _             => panic!("unknown sensor type: {sensor_type}"),
    }
}
```

This function has **four failure modes** the compiler cannot catch:<br><span class="zh-inline">这段函数里有 **四种失败方式** 是编译器根本抓不住的：</span>

1. Typo: `"temperture"` → panic at runtime<br><span class="zh-inline">1. 拼写错了，比如 `"temperture"`，结果就是运行时 panic。</span>
2. Wrong `raw` length: `fan_speed` with 1 byte → panic at runtime<br><span class="zh-inline">2. `raw` 长度不对，比如 `fan_speed` 只给了 1 个字节，照样是运行时 panic。</span>
3. Caller uses the returned `f64` as RPM when it's actually °C → logic bug, silent<br><span class="zh-inline">3. 调用者把返回的 `f64` 当 RPM 用，但实际上它代表的是摄氏度，这就是静默逻辑错误。</span>
4. New sensor type added but this `match` not updated → panic at runtime<br><span class="zh-inline">4. 新增了一个传感器类型，但这里的 `match` 没同步更新，还是运行时 panic。</span>

Every failure mode is discovered **after deployment**. Tests help, but they only cover the cases someone thought to write. The type system covers **all** cases, including ones nobody imagined.<br><span class="zh-inline">这些失败模式全都要等到 **部署之后** 才会暴露。测试确实有帮助，但测试只能覆盖“有人想到去写”的场景。类型系统则是把 **整类情况** 一次性封死，连没人提前想到的错误都能一起挡住。</span>

## Three Levels of Correctness<br><span class="zh-inline">正确性的三个层次</span>

### Level 1 — Value Correctness<br><span class="zh-inline">第一层：值正确性</span>

**Make invalid values unrepresentable.**<br><span class="zh-inline">**让非法值根本无法被表示出来。**</span>

```rust,ignore
// ❌ Any u16 can be a "port" — 0 is invalid but compiles
fn connect(port: u16) { /* ... */ }

// ✅ Only validated ports can exist
pub struct Port(u16);  // private field

impl TryFrom<u16> for Port {
    type Error = &'static str;
    fn try_from(v: u16) -> Result<Self, Self::Error> {
        if v > 0 { Ok(Port(v)) } else { Err("port must be > 0") }
    }
}

fn connect(port: Port) { /* ... */ }
// Port(0) can never be constructed — invariant holds everywhere
```

**Hardware example:** `SensorId(u8)` — wraps a raw sensor number with validation that it's in the SDR range.<br><span class="zh-inline">**硬件领域里的例子：** `SensorId(u8)`，它会把原始传感器编号包起来，并确保这个编号已经验证过、确实落在 SDR 允许的范围内。</span>

### Level 2 — State Correctness<br><span class="zh-inline">第二层：状态正确性</span>

**Make invalid transitions unrepresentable.**<br><span class="zh-inline">**让非法状态迁移根本无法表示。**</span>

```rust,ignore
use std::marker::PhantomData;

struct Disconnected;
struct Connected;

struct Socket<State> {
    fd: i32,
    _state: PhantomData<State>,
}

impl Socket<Disconnected> {
    fn connect(self, addr: &str) -> Socket<Connected> {
        // ... connect logic ...
        Socket { fd: self.fd, _state: PhantomData }
    }
}

impl Socket<Connected> {
    fn send(&mut self, data: &[u8]) { /* ... */ }
    fn disconnect(self) -> Socket<Disconnected> {
        Socket { fd: self.fd, _state: PhantomData }
    }
}

// Socket<Disconnected> has no send() method — compile error if you try
```

**Hardware example:** GPIO pin modes — `Pin<Input>` has `read()` but not `write()`.<br><span class="zh-inline">**硬件领域里的例子：** GPIO 引脚模式。`Pin<Input>` 有 `read()`，但压根没有 `write()`，因此写错方向会在编译期直接爆掉。</span>

### Level 3 — Protocol Correctness<br><span class="zh-inline">第三层：协议正确性</span>

**Make invalid interactions unrepresentable.**<br><span class="zh-inline">**让非法交互本身无法表示。**</span>

```rust,ignore
use std::io;

trait IpmiCmd {
    type Response;
    fn parse_response(&self, raw: &[u8]) -> io::Result<Self::Response>;
}

// Simplified for illustration — see ch02 for the full trait with
// net_fn(), cmd_byte(), payload(), and parse_response().

struct ReadTemp { sensor_id: u8 }
impl IpmiCmd for ReadTemp {
    type Response = Celsius;
    fn parse_response(&self, raw: &[u8]) -> io::Result<Celsius> {
        Ok(Celsius(raw[0] as i8 as f64))
    }
}

# #[derive(Debug)] struct Celsius(f64);

fn execute<C: IpmiCmd>(cmd: &C, raw: &[u8]) -> io::Result<C::Response> {
    cmd.parse_response(raw)
}
// ReadTemp always returns Celsius — can't accidentally get Rpm
```

**Hardware example:** IPMI, Redfish, NVMe Admin commands — the request type determines the response type.<br><span class="zh-inline">**硬件领域里的例子：** IPMI、Redfish、NVMe Admin 这类命令协议，都是由请求类型直接决定响应类型。</span>

## Types as Compiler-Checked Guarantees<br><span class="zh-inline">类型：由编译器检查的保证</span>

When you write:<br><span class="zh-inline">当写下这样一个签名时：</span>

```rust,ignore
fn execute<C: IpmiCmd>(cmd: &C) -> io::Result<C::Response>
```

You're not just writing a function — you're stating a **guarantee**: "for any command type `C` that implements `IpmiCmd`, executing it produces exactly `C::Response`." The compiler **verifies** this guarantee every time it builds your code. If the types don't line up, the program won't compile.<br><span class="zh-inline">这已经不只是“写了个函数”，而是在声明一个 **保证**：对于任何实现了 `IpmiCmd` 的命令类型 `C`，执行它之后得到的结果一定就是 `C::Response`。编译器每次构建都会去**验证**这条保证；只要类型对不上，程序就无法通过编译。</span>

This is why Rust's type system is so powerful — it's not just catching mistakes, it's **enforcing correctness at compile time**.<br><span class="zh-inline">这也正是 Rust 类型系统强悍的原因：它做的已经不只是“帮忙抓错”，而是在**编译期强制执行正确性约束**。</span>

## When NOT to Use These Patterns<br><span class="zh-inline">什么时候反而不该用这些模式</span>

Correct-by-construction is not always the right choice:<br><span class="zh-inline">“构造即正确”并不是永远都该上：</span>

| Situation | Recommendation |
|-----------|---------------|
| Safety-critical boundary (power sequencing, crypto)<br><span class="zh-inline">安全关键边界，例如电源时序、密码学</span> | ✅ Always — a bug here melts hardware or leaks secrets<br><span class="zh-inline">✅ 基本都该用，出错了要么烧硬件，要么泄露机密。</span> |
| Cross-module public API<br><span class="zh-inline">跨模块的公共 API</span> | ✅ Usually — misuse should be a compile error<br><span class="zh-inline">✅ 通常都值得，误用最好在编译期直接炸掉。</span> |
| State machine with 3+ states<br><span class="zh-inline">有 3 个以上状态的状态机</span> | ✅ Usually — type-state prevents wrong transitions<br><span class="zh-inline">✅ 一般都值得，type-state 能有效阻止错误状态迁移。</span> |
| Internal helper within one 50-line function<br><span class="zh-inline">一个 50 行函数内部的小辅助逻辑</span> | ❌ Overkill — a simple `assert!` suffices<br><span class="zh-inline">❌ 过度设计，一个简单的 `assert!` 往往就够了。</span> |
| Prototyping / exploring unknown hardware<br><span class="zh-inline">原型探索阶段，或者还在摸未知硬件</span> | ❌ Raw types first — refine after behaviour is understood<br><span class="zh-inline">❌ 先用原始类型跑通，等行为搞清楚了再慢慢收紧。</span> |
| User-facing CLI parsing<br><span class="zh-inline">面向用户的 CLI 解析</span> | ⚠️ `clap` + `TryFrom` at the boundary, raw types inside is fine<br><span class="zh-inline">⚠️ 在边界用 `clap` + `TryFrom` 收紧即可，内部保持原始类型也完全没问题。</span> |

The key question: **"If this bug happens in production, how bad is it?"**<br><span class="zh-inline">真正该问的问题是：**“如果这个 bug 上了生产，后果到底有多严重？”**</span>

- Fan stops → GPU melts → **use types**<br><span class="zh-inline">风扇停转 → GPU 过热 → **该用类型系统收紧**。</span>
- Wrong DER record → customer gets bad data → **use types**<br><span class="zh-inline">DER 记录错误 → 客户拿到脏数据 → **该用类型系统收紧**。</span>
- Debug log message slightly wrong → **use `assert!`**<br><span class="zh-inline">调试日志多写错一句 → **一个 `assert!` 就够了**。</span>

## Key Takeaways<br><span class="zh-inline">本章要点</span>

1. **Three levels of correctness** — value (newtypes), state (type-state), protocol (associated types) — each eliminates a broader class of bugs.<br><span class="zh-inline">1. **正确性有三个层次**：值层（newtype）、状态层（type-state）、协议层（关联类型）。层次越往上，消灭的 bug 类别越宽。</span>
2. **Types as guarantees** — every generic function signature is a contract the compiler checks on each build.<br><span class="zh-inline">2. **类型就是保证**：每个泛型函数签名都像一份契约，而编译器会在每次构建时重新检查它。</span>
3. **The cost question** — "if this bug ships, how bad is it?" determines whether types or tests are the right tool.<br><span class="zh-inline">3. **成本判断问题**：一个 bug 如果真的流到生产，后果多严重，决定了该上类型系统还是该靠测试。</span>
4. **Types complement tests** — they eliminate entire *categories*; tests cover specific *values* and edge cases.<br><span class="zh-inline">4. **类型系统和测试是互补关系**：类型系统消灭整类错误，测试负责具体值和边界条件。</span>
5. **Know when to stop** — internal helpers and throwaway prototypes rarely need type-level enforcement.<br><span class="zh-inline">5. **知道什么时候收手**：内部小辅助函数和一次性原型，大多没必要上类型级约束。</span>

---
