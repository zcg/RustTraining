# Putting It All Together — A Complete Diagnostic Platform 🟡<br><span class="zh-inline">全部整合：一个完整的诊断平台 🟡</span>

> **What you'll learn:** How all seven core patterns (ch02–ch09) compose into a single diagnostic workflow — authentication, sessions, typed commands, audit tokens, dimensional results, validated data, and phantom-typed registers — with zero total runtime overhead.<br><span class="zh-inline">**本章将学到什么：** 前面七种核心模式，也就是 ch02–ch09，怎样被组合成一条完整诊断工作流：认证、会话、类型化命令、审计令牌、量纲化结果、已验证数据，以及 phantom type 寄存器，而且总体运行时开销仍然为零。</span>
>
> **Cross-references:** Every core pattern chapter (ch02–ch09), [ch14](ch14-testing-type-level-guarantees.md) (testing these guarantees)<br><span class="zh-inline">**交叉阅读：** 前面所有核心模式章节（ch02–ch09），以及 [ch14](ch14-testing-type-level-guarantees.md) 里关于这些保证该怎么测试的内容。</span>

## Goal<br><span class="zh-inline">目标</span>

This chapter combines **seven patterns** from chapters 2–9 into a single, realistic diagnostic workflow. We'll build a server health check that:<br><span class="zh-inline">这一章会把第 2 到第 9 章的**七种模式**拼进一条真实的诊断工作流里。目标是做一个服务器健康检查，它需要：</span>

1. **Authenticates** (capability token — ch04)<br><span class="zh-inline">**完成认证**（capability token，第 4 章）</span>
2. **Opens an IPMI session** (type-state — ch05)<br><span class="zh-inline">**打开 IPMI 会话**（type-state，第 5 章）</span>
3. **Sends typed commands** (typed commands — ch02)<br><span class="zh-inline">**发送类型化命令**（typed commands，第 2 章）</span>
4. **Uses single-use tokens** for audit logging (single-use types — ch03)<br><span class="zh-inline">**用单次使用令牌**做审计日志（single-use types，第 3 章）</span>
5. **Returns dimensional results** (dimensional analysis — ch06)<br><span class="zh-inline">**返回带量纲的结果**（dimensional analysis，第 6 章）</span>
6. **Validates FRU data** (validated boundaries — ch07)<br><span class="zh-inline">**验证 FRU 数据**（validated boundaries，第 7 章）</span>
7. **Reads typed registers** (phantom types — ch09)<br><span class="zh-inline">**读取带类型的寄存器**（phantom types，第 9 章）</span>

```rust,ignore
use std::marker::PhantomData;
use std::io;
// ──── Pattern 1: Dimensional Types (ch06) ────

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Celsius(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Rpm(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Volts(pub f64);

// ──── Pattern 2: Typed Commands (ch02) ────

/// Same trait shape as ch02, using methods (not associated constants)
/// for consistency. Associated constants (`const NETFN: u8`) are an
/// equally valid alternative when the value is truly fixed per type.
pub trait IpmiCmd {
    type Response;
    fn net_fn(&self) -> u8;
    fn cmd_byte(&self) -> u8;
    fn payload(&self) -> Vec<u8>;
    fn parse_response(&self, raw: &[u8]) -> io::Result<Self::Response>;
}

pub struct ReadTemp { pub sensor_id: u8 }
impl IpmiCmd for ReadTemp {
    type Response = Celsius;   // ← dimensional type!
    fn net_fn(&self) -> u8 { 0x04 }
    fn cmd_byte(&self) -> u8 { 0x2D }
    fn payload(&self) -> Vec<u8> { vec![self.sensor_id] }
    fn parse_response(&self, raw: &[u8]) -> io::Result<Celsius> {
        if raw.is_empty() {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "empty"));
        }
        Ok(Celsius(raw[0] as f64))
    }
}

pub struct ReadFanSpeed { pub fan_id: u8 }
impl IpmiCmd for ReadFanSpeed {
    type Response = Rpm;
    fn net_fn(&self) -> u8 { 0x04 }
    fn cmd_byte(&self) -> u8 { 0x2D }
    fn payload(&self) -> Vec<u8> { vec![self.fan_id] }
    fn parse_response(&self, raw: &[u8]) -> io::Result<Rpm> {
        if raw.len() < 2 {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "need 2 bytes"));
        }
        Ok(Rpm(u16::from_le_bytes([raw[0], raw[1]]) as f64))
    }
}

// ──── Pattern 3: Capability Token (ch04) ────

pub struct AdminToken { _private: () }

pub fn authenticate(user: &str, pass: &str) -> Result<AdminToken, &'static str> {
    if user == "admin" && pass == "secret" {
        Ok(AdminToken { _private: () })
    } else {
        Err("authentication failed")
    }
}

// ──── Pattern 4: Type-State Session (ch05) ────

pub struct Idle;
pub struct Active;

pub struct Session<State> {
    host: String,
    _state: PhantomData<State>,
}

impl Session<Idle> {
    pub fn connect(host: &str) -> Self {
        Session { host: host.to_string(), _state: PhantomData }
    }

    pub fn activate(
        self,
        _admin: &AdminToken,  // ← requires capability token
    ) -> Result<Session<Active>, String> {
        println!("Session activated on {}", self.host);
        Ok(Session { host: self.host, _state: PhantomData })
    }
}

impl Session<Active> {
    /// Execute a typed command — only available on Active sessions.
    /// Returns io::Result to propagate transport errors (consistent with ch02).
    pub fn execute<C: IpmiCmd>(&mut self, cmd: &C) -> io::Result<C::Response> {
        let raw_response = self.raw_send(cmd.net_fn(), cmd.cmd_byte(), &cmd.payload())?;
        cmd.parse_response(&raw_response)
    }

    fn raw_send(&self, _nf: u8, _cmd: u8, _data: &[u8]) -> io::Result<Vec<u8>> {
        Ok(vec![42, 0x1E]) // stub: raw IPMI response
    }

    pub fn close(self) { println!("Session closed"); }
}

// ──── Pattern 5: Single-Use Audit Token (ch03) ────

/// Each diagnostic run gets a unique audit token.
/// Not Clone, not Copy — ensures each audit entry is unique.
pub struct AuditToken {
    run_id: u64,
}

impl AuditToken {
    pub fn issue(run_id: u64) -> Self {
        AuditToken { run_id }
    }

    /// Consume the token to write an audit log entry.
    pub fn log(self, message: &str) {
        println!("[AUDIT run_id={}] {}", self.run_id, message);
        // token is consumed — can't log the same run_id twice
    }
}

// ──── Pattern 6: Validated Boundary (ch07) ────
// Simplified from ch07's full ValidFru — only the fields needed for this
// composite example.  See ch07 for the complete TryFrom<RawFruData> version.

pub struct ValidFru {
    pub board_serial: String,
    pub product_name: String,
}

impl ValidFru {
    pub fn parse(raw: &[u8]) -> Result<Self, &'static str> {
        if raw.len() < 8 { return Err("FRU too short"); }
        if raw[0] != 0x01 { return Err("bad FRU version"); }
        Ok(ValidFru {
            board_serial: "SN12345".to_string(),  // stub
            product_name: "ServerX".to_string(),
        })
    }
}

// ──── Pattern 7: Phantom-Typed Registers (ch09) ────

pub struct Width16;
pub struct Reg<W> { offset: u16, _w: PhantomData<W> }

impl Reg<Width16> {
    pub fn read(&self) -> u16 { 0x8086 } // stub
}

pub struct PcieDev {
    pub vendor_id: Reg<Width16>,
    pub device_id: Reg<Width16>,
}

impl PcieDev {
    pub fn new() -> Self {
        PcieDev {
            vendor_id: Reg { offset: 0x00, _w: PhantomData },
            device_id: Reg { offset: 0x02, _w: PhantomData },
        }
    }
}

// ──── Composite Workflow ────

fn full_diagnostic() -> Result<(), String> {
    // 1. Authenticate → get capability token
    let admin = authenticate("admin", "secret")
        .map_err(|e| e.to_string())?;

    // 2. Connect and activate session (type-state: Idle → Active)
    let session = Session::connect("192.168.1.100");
    let mut session = session.activate(&admin)?;  // requires AdminToken

    // 3. Send typed commands (response type matches command)
    let temp: Celsius = session.execute(&ReadTemp { sensor_id: 0 })
        .map_err(|e| e.to_string())?;
    let fan: Rpm = session.execute(&ReadFanSpeed { fan_id: 1 })
        .map_err(|e| e.to_string())?;

    // Type mismatch would be caught:
    // let wrong: Volts = session.execute(&ReadTemp { sensor_id: 0 })?;
    //  ❌ ERROR: expected Celsius, found Volts

    // 4. Read phantom-typed PCIe registers
    let pcie = PcieDev::new();
    let vid: u16 = pcie.vendor_id.read();  // guaranteed u16

    // 5. Validate FRU data at the boundary
    let raw_fru = vec![0x01, 0x00, 0x00, 0x01, 0x01, 0x00, 0x00, 0xFD];
    let fru = ValidFru::parse(&raw_fru)
        .map_err(|e| e.to_string())?;

    // 6. Issue single-use audit token
    let audit = AuditToken::issue(1001);

    // 7. Generate report (all data is typed and validated)
    let report = format!(
        "Server: {} (SN: {}), VID: 0x{:04X}, CPU: {:?}, Fan: {:?}",
        fru.product_name, fru.board_serial, vid, temp, fan,
    );

    // 8. Consume audit token — can't log twice
    audit.log(&report);
    // audit.log("oops");  // ❌ use of moved value

    // 9. Close session (type-state: Active → dropped)
    session.close();

    Ok(())
}
```

### What the Compiler Proves<br><span class="zh-inline">编译器到底证明了什么</span>

| Bug class<br><span class="zh-inline">Bug 类型</span> | How it's prevented<br><span class="zh-inline">如何防住</span> | Pattern<br><span class="zh-inline">对应模式</span> |
|-----------|-------------------|---------|
| Unauthenticated access<br><span class="zh-inline">未认证访问</span> | `activate()` requires `&AdminToken`<br><span class="zh-inline">`activate()` 需要 `&AdminToken`</span> | Capability token<br><span class="zh-inline">Capability token</span> |
| Command in wrong session state<br><span class="zh-inline">在错误会话状态里发命令</span> | `execute()` only exists on `Session<Active>`<br><span class="zh-inline">`execute()` 只存在于 `Session<Active>` 上</span> | Type-state<br><span class="zh-inline">Type-state</span> |
| Wrong response type<br><span class="zh-inline">响应类型写错</span> | `ReadTemp::Response = Celsius`, fixed by trait<br><span class="zh-inline">`ReadTemp::Response = Celsius`，由 trait 绑定死</span> | Typed commands<br><span class="zh-inline">Typed commands</span> |
| Unit confusion (°C vs RPM)<br><span class="zh-inline">单位混淆，比如 °C 和 RPM</span> | `Celsius` ≠ `Rpm` ≠ `Volts`<br><span class="zh-inline">`Celsius`、`Rpm`、`Volts` 互不相等</span> | Dimensional types<br><span class="zh-inline">量纲类型</span> |
| Register width mismatch<br><span class="zh-inline">寄存器宽度错配</span> | `Reg<Width16>` returns `u16`<br><span class="zh-inline">`Reg<Width16>` 返回的就是 `u16`</span> | Phantom types<br><span class="zh-inline">Phantom types</span> |
| Processing unvalidated data<br><span class="zh-inline">处理未经验证的数据</span> | Must call `ValidFru::parse()` first<br><span class="zh-inline">必须先调用 `ValidFru::parse()`</span> | Validated boundary<br><span class="zh-inline">Validated boundary</span> |
| Duplicate audit entries<br><span class="zh-inline">重复写审计日志</span> | `AuditToken` is consumed on log<br><span class="zh-inline">`AuditToken` 在写日志时会被消费掉</span> | Single-use type<br><span class="zh-inline">Single-use type</span> |
| Out-of-order power sequencing<br><span class="zh-inline">电源时序乱序</span> | Each step requires previous token<br><span class="zh-inline">每一步都要求前一步产出的 token</span> | Capability tokens (ch04)<br><span class="zh-inline">Capability token（第 4 章）</span> |

**Total runtime overhead of ALL these guarantees: zero.**<br><span class="zh-inline">**这些保证的总运行时开销仍然是零。**</span>

Every check happens at compile time. The generated assembly is identical to hand-written C code with no checks at all — but **C can have bugs, this can't**.<br><span class="zh-inline">所有检查都发生在编译期。最终生成的汇编，和手写、完全不加检查的 C 代码几乎一样，但区别在于：**C 代码可能有 bug，这套写法把整类 bug 直接做没了。**</span>

## Key Takeaways<br><span class="zh-inline">本章要点</span>

1. **Seven patterns compose seamlessly** — capability tokens, type-state, typed commands, single-use types, dimensional types, validated boundaries, and phantom types all work together.<br><span class="zh-inline">**七种模式可以无缝组合**：capability token、type-state、typed command、single-use type、量纲类型、validated boundary 和 phantom type 完全可以揉成一套工作流。</span>
2. **The compiler proves eight bug classes impossible** — see the "What the Compiler Proves" table above.<br><span class="zh-inline">**编译器能证明八类 bug 不可能发生**：上面的“编译器证明了什么”那张表，就是这套组合拳的清单。</span>
3. **Zero total runtime overhead** — the generated assembly is identical to unchecked C code.<br><span class="zh-inline">**总体运行时开销为零**：生成的汇编和不加检查的 C 代码基本一致。</span>
4. **Each pattern is independently useful** — you don't need all seven; adopt them incrementally.<br><span class="zh-inline">**每种模式本身都能独立成立**：不必一上来七种全用，可以逐步引入。</span>
5. **The integration chapter is a design template** — use it as a starting point for your own typed diagnostic workflows.<br><span class="zh-inline">**这一章本质上是一份设计模板**：完全可以把它当成自己的类型化诊断工作流起点。</span>
6. **From IPMI to Redfish at scale** — ch17 and ch18 apply these same seven patterns (plus capability mixins from ch08) to a full Redfish client and server. The IPMI workflow here is the foundation; the Redfish walkthroughs show how the composition scales to production systems with multiple data sources and schema-version constraints.<br><span class="zh-inline">**从 IPMI 到大规模 Redfish**：第 17 章和第 18 章会把这七种模式，再加上第 8 章的 capability mixin，一起用到完整的 Redfish 客户端和服务端里。这里的 IPMI 工作流只是地基，后面的 Redfish walkthrough 会展示这套组合怎样扩展到多数据源、带 schema 版本约束的生产系统。</span>

---
