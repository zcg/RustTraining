# Protocol State Machines — Type-State for Real Hardware 🔴<br><span class="zh-inline">协议状态机：面向真实硬件的类型状态 🔴</span>

> **What you'll learn:** How type-state encoding makes protocol violations (wrong-order commands, use-after-close) into compile errors, applied to IPMI session lifecycles and PCIe link training.<br><span class="zh-inline">**本章将学到什么：** 类型状态编码怎样把协议违规行为，比如乱序命令、关闭后继续使用，直接变成编译错误，并把这个模式应用到 IPMI 会话生命周期和 PCIe 链路训练上。</span>
>
> **Cross-references:** [ch01](ch01-the-philosophy-why-types-beat-tests.md) (level 2 — state correctness), [ch04](ch04-capability-tokens-zero-cost-proof-of-aut.md) (tokens), [ch09](ch09-phantom-types-for-resource-tracking.md) (phantom types), [ch11](ch11-fourteen-tricks-from-the-trenches.md) (trick 4 — typestate builder, trick 8 — async type-state)<br><span class="zh-inline">**交叉阅读：** [ch01](ch01-the-philosophy-why-types-beat-tests.md) 讲第 2 层正确性，也就是状态正确性；[ch04](ch04-capability-tokens-zero-cost-proof-of-aut.md) 讲令牌；[ch09](ch09-phantom-types-for-resource-tracking.md) 讲 phantom types；[ch11](ch11-fourteen-tricks-from-the-trenches.md) 里有 typestate builder 和 async type-state 的实战技巧。</span>

## The Problem: Protocol Violations<br><span class="zh-inline">问题：协议违规</span>

Hardware protocols have **strict state machines**. An IPMI session has states: Unauthenticated → Authenticated → Active → Closed. PCIe link training goes through Detect → Polling → Configuration → L0. Sending a command in the wrong state corrupts the session or hangs the bus.<br><span class="zh-inline">硬件协议通常都有**严格的状态机**。比如 IPMI 会话会经历 Unauthenticated → Authenticated → Active → Closed。PCIe 链路训练会经历 Detect → Polling → Configuration → L0。如果在错误状态下发命令，轻则把会话搞脏，重则直接把总线卡死。</span>

**IPMI session state machine:**<br><span class="zh-inline">**IPMI 会话状态机：**</span>

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Authenticated : authenticate(user, pass)
    Authenticated --> Active : activate_session()
    Active --> Active : send_command(cmd)
    Active --> Closed : close()
    Closed --> [*]

    note right of Active : send_command() only exists here
    note right of Idle : send_command() → compile error
```

**PCIe Link Training State Machine (LTSSM):**<br><span class="zh-inline">**PCIe 链路训练状态机（LTSSM）：**</span>

```mermaid
stateDiagram-v2
    [*] --> Detect
    Detect --> Polling : receiver detected
    Polling --> Configuration : bit lock + symbol lock
    Configuration --> L0 : link number + lane assigned
    L0 --> L0 : send_tlp() / receive_tlp()
    L0 --> Recovery : error threshold
    Recovery --> L0 : retrained
    Recovery --> Detect : retraining failed

    note right of L0 : TLP transmit only in L0
```

In C/C++, state is tracked with an enum and runtime checks:<br><span class="zh-inline">在 C/C++ 里，状态通常只能靠枚举加运行时判断来维护：</span>

```c
typedef enum { IDLE, AUTHENTICATED, ACTIVE, CLOSED } session_state_t;

typedef struct {
    session_state_t state;
    uint32_t session_id;
    // ...
} ipmi_session_t;

int ipmi_send_command(ipmi_session_t *s, uint8_t cmd, uint8_t *data, int len) {
    if (s->state != ACTIVE) {        // runtime check — easy to forget
        return -EINVAL;
    }
    // ... send command ...
    return 0;
}
```

## Type-State Pattern<br><span class="zh-inline">Type-State 模式</span>

With type-state, each protocol state is a **distinct type**. Transitions are methods that consume one state and return another. The compiler prevents calling methods in the wrong state because **those methods don't exist on that type**.<br><span class="zh-inline">用了 type-state 以后，每个协议状态都会变成一个**独立的类型**。状态转换由方法表示，这些方法会消费旧状态并返回新状态。编译器之所以能阻止乱序调用，是因为**对应方法压根就不存在于错误状态的类型上**。</span>

```rust,ignore
use std::marker::PhantomData;

// States — zero-sized marker types
pub struct Idle;
## Case Study: IPMI Session Lifecycle

pub struct Authenticated;
pub struct Active;
pub struct Closed;

/// IPMI session parameterised by its current state.
/// The state exists ONLY in the type system (PhantomData is zero-sized).
pub struct IpmiSession<State> {
    transport: String,     // e.g., "192.168.1.100"
    session_id: Option<u32>,
    _state: PhantomData<State>,
}

// Transition: Idle → Authenticated
impl IpmiSession<Idle> {
    pub fn new(host: &str) -> Self {
        IpmiSession {
            transport: host.to_string(),
            session_id: None,
            _state: PhantomData,
        }
    }

    pub fn authenticate(
        self,              // ← consumes Idle session
        user: &str,
        pass: &str,
    ) -> Result<IpmiSession<Authenticated>, String> {
        println!("Authenticating {user} on {}", self.transport);
        Ok(IpmiSession {
            transport: self.transport,
            session_id: Some(42),
            _state: PhantomData,
        })
    }
}

// Transition: Authenticated → Active
impl IpmiSession<Authenticated> {
    pub fn activate(self) -> Result<IpmiSession<Active>, String> {
        println!("Activating session {}", self.session_id.unwrap());
        Ok(IpmiSession {
            transport: self.transport,
            session_id: self.session_id,
            _state: PhantomData,
        })
    }
}

// Operations available ONLY in Active state
impl IpmiSession<Active> {
    pub fn send_command(&mut self, netfn: u8, cmd: u8, data: &[u8]) -> Vec<u8> {
        println!("Sending cmd 0x{cmd:02X} on session {}", self.session_id.unwrap());
        vec![0x00] // stub: completion code OK
    }

    pub fn close(self) -> IpmiSession<Closed> {
        println!("Closing session {}", self.session_id.unwrap());
        IpmiSession {
            transport: self.transport,
            session_id: None,
            _state: PhantomData,
        }
    }
}

fn ipmi_workflow() -> Result<(), String> {
    let session = IpmiSession::new("192.168.1.100");

    // session.send_command(0x04, 0x2D, &[]);
    //  ^^^^^^ ERROR: no method `send_command` on IpmiSession<Idle> ❌

    let session = session.authenticate("admin", "password")?;

    // session.send_command(0x04, 0x2D, &[]);
    //  ^^^^^^ ERROR: no method `send_command` on IpmiSession<Authenticated> ❌

    let mut session = session.activate()?;

    // ✅ NOW send_command exists:
    let response = session.send_command(0x04, 0x2D, &[1]);

    let _closed = session.close();

    // _closed.send_command(0x04, 0x2D, &[]);
    //  ^^^^^^ ERROR: no method `send_command` on IpmiSession<Closed> ❌

    Ok(())
}
```

**No runtime state checks anywhere.** The compiler enforces:<br><span class="zh-inline">**整个过程中没有任何运行时状态判断。** 编译器直接保证：</span>
- Authentication before activation<br><span class="zh-inline">必须先认证，再激活</span>
- Activation before sending commands<br><span class="zh-inline">必须先激活，再发命令</span>
- No commands after close<br><span class="zh-inline">关闭之后不能再发命令</span>

## PCIe Link Training State Machine<br><span class="zh-inline">PCIe 链路训练状态机</span>

PCIe link training is a multi-phase protocol defined in the PCIe specification. Type-state prevents sending data before the link is ready:<br><span class="zh-inline">PCIe 链路训练是 PCIe 规范里定义的一套多阶段协议。type-state 可以防止链路还没准备好就提前发数据。</span>

```rust,ignore
use std::marker::PhantomData;

// PCIe LTSSM states (simplified)
pub struct Detect;
pub struct Polling;
pub struct Configuration;
pub struct L0;         // fully operational
pub struct Recovery;

pub struct PcieLink<State> {
    slot: u32,
    width: u8,          // negotiated width (x1, x4, x8, x16)
    speed: u8,          // Gen1=1, Gen2=2, Gen3=3, Gen4=4, Gen5=5
    _state: PhantomData<State>,
}

impl PcieLink<Detect> {
    pub fn new(slot: u32) -> Self {
        PcieLink {
            slot, width: 0, speed: 0,
            _state: PhantomData,
        }
    }

    pub fn detect_receiver(self) -> Result<PcieLink<Polling>, String> {
        println!("Slot {}: receiver detected", self.slot);
        Ok(PcieLink {
            slot: self.slot, width: 0, speed: 0,
            _state: PhantomData,
        })
    }
}

impl PcieLink<Polling> {
    pub fn poll_compliance(self) -> Result<PcieLink<Configuration>, String> {
        println!("Slot {}: polling complete, entering configuration", self.slot);
        Ok(PcieLink {
            slot: self.slot, width: 0, speed: 0,
            _state: PhantomData,
        })
    }
}

impl PcieLink<Configuration> {
    pub fn negotiate(self, width: u8, speed: u8) -> Result<PcieLink<L0>, String> {
        println!("Slot {}: negotiated x{width} Gen{speed}", self.slot);
        Ok(PcieLink {
            slot: self.slot, width, speed,
            _state: PhantomData,
        })
    }
}

impl PcieLink<L0> {
    /// Send a TLP — only possible when the link is fully trained (L0).
    pub fn send_tlp(&mut self, tlp: &[u8]) -> Vec<u8> {
        println!("Slot {}: sending {} byte TLP", self.slot, tlp.len());
        vec![0x00] // stub
    }

    /// Enter recovery — returns to Recovery state.
    pub fn enter_recovery(self) -> PcieLink<Recovery> {
        PcieLink {
            slot: self.slot, width: self.width, speed: self.speed,
            _state: PhantomData,
        }
    }

    pub fn link_info(&self) -> String {
        format!("x{} Gen{}", self.width, self.speed)
    }
}

impl PcieLink<Recovery> {
    pub fn retrain(self, speed: u8) -> Result<PcieLink<L0>, String> {
        println!("Slot {}: retrained at Gen{speed}", self.slot);
        Ok(PcieLink {
            slot: self.slot, width: self.width, speed,
            _state: PhantomData,
        })
    }
}

fn pcie_workflow() -> Result<(), String> {
    let link = PcieLink::new(0);

    // link.send_tlp(&[0x01]);  // ❌ no method `send_tlp` on PcieLink<Detect>

    let link = link.detect_receiver()?;
    let link = link.poll_compliance()?;
    let mut link = link.negotiate(16, 5)?; // x16 Gen5

    // ✅ NOW we can send TLPs:
    let _resp = link.send_tlp(&[0x00, 0x01, 0x02]);
    println!("Link: {}", link.link_info());

    // Recovery and retrain:
    let recovery = link.enter_recovery();
    let mut link = recovery.retrain(4)?;  // downgrade to Gen4
    let _resp = link.send_tlp(&[0x03]);

    Ok(())
}
```

## Combining Type-State with Capability Tokens<br><span class="zh-inline">把 Type-State 和能力令牌组合起来</span>

Type-state and capability tokens compose naturally. A diagnostic that requires an active IPMI session AND admin privileges:<br><span class="zh-inline">type-state 和能力令牌可以很自然地拼到一起。比如某个诊断操作同时要求“IPMI 会话处于 Active 状态”以及“调用方拥有管理员权限”：</span>

```rust,ignore
# use std::marker::PhantomData;
# pub struct Active;
# pub struct AdminToken { _p: () }
# pub struct IpmiSession<S> { _s: PhantomData<S> }
# impl IpmiSession<Active> {
#     pub fn send_command(&mut self, _nf: u8, _cmd: u8, _d: &[u8]) -> Vec<u8> { vec![] }
# }

/// Run a firmware update — requires:
/// 1. Active IPMI session (type-state)
/// 2. Admin privileges (capability token)
pub fn firmware_update(
    session: &mut IpmiSession<Active>,   // proves session is active
    _admin: &AdminToken,                 // proves caller is admin
    image: &[u8],
) -> Result<(), String> {
    // No runtime checks needed — the signature IS the check
    session.send_command(0x2C, 0x01, image);
    Ok(())
}
```

The caller must:<br><span class="zh-inline">调用方必须按下面顺序来：</span>
1. Create a session (`Idle`)<br><span class="zh-inline">创建会话，也就是 `Idle`</span>
2. Authenticate it (`Authenticated`)<br><span class="zh-inline">完成认证，变成 `Authenticated`</span>
3. Activate it (`Active`)<br><span class="zh-inline">激活它，变成 `Active`</span>
4. Obtain an `AdminToken`<br><span class="zh-inline">拿到一个 `AdminToken`</span>
5. Then and only then call `firmware_update()`<br><span class="zh-inline">然后才能调用 `firmware_update()`</span>

All enforced at compile time, zero runtime cost.<br><span class="zh-inline">这些约束全部发生在编译期，运行时成本依旧为零。</span>

## Beat 3: Firmware Update — Multi-Phase FSM with Composition<br><span class="zh-inline">第 3 幕：固件升级，多阶段 FSM 加组合约束</span>

A firmware update lifecycle has more states than a session and composition with both capability tokens AND single-use types (ch03). This is the most complex type-state example in the book — if you're comfortable with it, you've mastered the pattern.<br><span class="zh-inline">固件升级生命周期比普通会话复杂得多，而且它同时要和能力令牌、单次使用类型这两套模式一起配合。这是本书里最复杂的 type-state 例子之一。把这一段吃透，基本就算把这套模式真正拿下了。</span>

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Uploading : begin_upload(admin, image)
    Uploading --> Verifying : finish_upload()
    Uploading --> Idle : abort()
    Verifying --> Verified : verify_ok()
    Verifying --> Idle : verify_fail()
    Verified --> Applying : apply(single-use VerifiedImage token)
    Applying --> WaitingReboot : apply_complete()
    WaitingReboot --> [*] : reboot()

    note right of Verified : VerifiedImage token consumed by apply()
    note right of Uploading : abort() returns to Idle (safe)
```

```rust,ignore
use std::marker::PhantomData;

// ── States ──
pub struct Idle;
pub struct Uploading;
pub struct Verifying;
pub struct Verified;
pub struct Applying;
pub struct WaitingReboot;

// ── Single-use proof that image passed verification (ch03) ──
pub struct VerifiedImage {
    _private: (),
    pub digest: [u8; 32],
}

// ── Capability token: only admins can initiate (ch04) ──
pub struct FirmwareAdminToken { _private: () }

pub struct FwUpdate<S> {
    version: String,
    _state: PhantomData<S>,
}

impl FwUpdate<Idle> {
    pub fn new() -> Self {
        FwUpdate { version: String::new(), _state: PhantomData }
    }

    /// Begin upload — requires admin privilege.
    pub fn begin_upload(
        self,
        _admin: &FirmwareAdminToken,
        version: &str,
    ) -> FwUpdate<Uploading> {
        println!("Uploading firmware v{version}...");
        FwUpdate { version: version.to_string(), _state: PhantomData }
    }
}

impl FwUpdate<Uploading> {
    pub fn finish_upload(self) -> FwUpdate<Verifying> {
        println!("Upload complete, verifying v{}...", self.version);
        FwUpdate { version: self.version, _state: PhantomData }
    }

    /// Abort returns to Idle — safe at any point during upload.
    pub fn abort(self) -> FwUpdate<Idle> {
        println!("Upload aborted.");
        FwUpdate { version: String::new(), _state: PhantomData }
    }
}

impl FwUpdate<Verifying> {
    /// On success, produces a single-use VerifiedImage token.
    pub fn verify_ok(self, digest: [u8; 32]) -> (FwUpdate<Verified>, VerifiedImage) {
        println!("Verification passed for v{}", self.version);
        (
            FwUpdate { version: self.version, _state: PhantomData },
            VerifiedImage { _private: (), digest },
        )
    }

    pub fn verify_fail(self) -> FwUpdate<Idle> {
        println!("Verification failed — returning to idle.");
        FwUpdate { version: String::new(), _state: PhantomData }
    }
}

impl FwUpdate<Verified> {
    /// Apply CONSUMES the VerifiedImage token — can't apply twice.
    pub fn apply(self, proof: VerifiedImage) -> FwUpdate<Applying> {
        println!("Applying v{} (digest: {:02x?})", self.version, &proof.digest[..4]);
        // proof is moved — can't be reused
        FwUpdate { version: self.version, _state: PhantomData }
    }
}

impl FwUpdate<Applying> {
    pub fn apply_complete(self) -> FwUpdate<WaitingReboot> {
        println!("Apply complete — waiting for reboot.");
        FwUpdate { version: self.version, _state: PhantomData }
    }
}

impl FwUpdate<WaitingReboot> {
    pub fn reboot(self) {
        println!("Rebooting into v{}...", self.version);
    }
}

// ── Usage ──

fn firmware_workflow() {
    let fw = FwUpdate::new();

    // fw.finish_upload();  // ❌ no method `finish_upload` on FwUpdate<Idle>

    let admin = FirmwareAdminToken { _private: () }; // from auth system
    let fw = fw.begin_upload(&admin, "2.10.1");
    let fw = fw.finish_upload();

    let digest = [0xAB; 32]; // computed during verification
    let (fw, token) = fw.verify_ok(digest);

    let fw = fw.apply(token);
    // fw.apply(token);  // ❌ use of moved value: `token`

    let fw = fw.apply_complete();
    fw.reboot();
}
```

**What the three beats illustrate together:**<br><span class="zh-inline">**这三幕合起来说明了什么：**</span>

| Beat<br><span class="zh-inline">阶段</span> | Protocol<br><span class="zh-inline">协议</span> | States<br><span class="zh-inline">状态数</span> | Composition<br><span class="zh-inline">组合内容</span> |
|:----:|----------|:------:|-------------|
| 1 | IPMI session<br><span class="zh-inline">IPMI 会话</span> | 4 | Pure type-state<br><span class="zh-inline">纯 type-state</span> |
| 2 | PCIe LTSSM<br><span class="zh-inline">PCIe LTSSM</span> | 5 | Type-state + recovery branch<br><span class="zh-inline">type-state 加恢复分支</span> |
| 3 | Firmware update<br><span class="zh-inline">固件升级</span> | 6 | Type-state + capability tokens (ch04) + single-use proof (ch03)<br><span class="zh-inline">type-state + 能力令牌（第 4 章）+ 单次使用证明（第 3 章）</span> |

Each beat adds a layer of complexity. By beat 3, the compiler enforces state ordering, admin privilege, AND one-time application — three bug classes eliminated in a single FSM.<br><span class="zh-inline">每一幕都会多加一层复杂度。到第 3 幕时，编译器已经能同时保证状态顺序、管理员权限以及“只能应用一次”这三件事，等于一张 FSM 图直接干掉三类 bug。</span>

### When to Use Type-State<br><span class="zh-inline">什么时候值得上 Type-State</span>

| Protocol<br><span class="zh-inline">协议</span> | Type-State worthwhile?<br><span class="zh-inline">值不值得用 Type-State</span> |
|----------|:------:|
| IPMI session lifecycle<br><span class="zh-inline">IPMI 会话生命周期</span> | ✅ Yes — authenticate → activate → command → close<br><span class="zh-inline">✅ 值得，天然就是 authenticate → activate → command → close</span> |
| PCIe link training<br><span class="zh-inline">PCIe 链路训练</span> | ✅ Yes — detect → poll → configure → L0<br><span class="zh-inline">✅ 值得，就是 detect → poll → configure → L0</span> |
| TLS handshake<br><span class="zh-inline">TLS 握手</span> | ✅ Yes — ClientHello → ServerHello → Finished<br><span class="zh-inline">✅ 值得，状态序列非常明确</span> |
| USB enumeration<br><span class="zh-inline">USB 枚举</span> | ✅ Yes — Attached → Powered → Default → Addressed → Configured<br><span class="zh-inline">✅ 值得，阶段清晰而且顺序固定</span> |
| Simple request/response<br><span class="zh-inline">简单请求响应</span> | ⚠️ Probably not — only 2 states<br><span class="zh-inline">⚠️ 多半没必要，就两三个状态</span> |
| Fire-and-forget messages<br><span class="zh-inline">发完就走的消息</span> | ❌ No — no state to track<br><span class="zh-inline">❌ 没必要，本来就没什么状态可追踪</span> |

## Exercise: USB Device Enumeration Type-State<br><span class="zh-inline">练习：USB 设备枚举的 Type-State 建模</span>

Model a USB device that must go through: `Attached` → `Powered` → `Default` → `Addressed` → `Configured`. Each transition should consume the previous state and produce the next. `send_data()` should only be available in `Configured`.<br><span class="zh-inline">给一个 USB 设备建模，要求它必须依次经过：`Attached` → `Powered` → `Default` → `Addressed` → `Configured`。每一次状态转换都要消费前一个状态并产出下一个状态，而 `send_data()` 只能在 `Configured` 状态存在。</span>

<details>
<summary>Solution<br><span class="zh-inline">参考答案</span></summary>

```rust,ignore
use std::marker::PhantomData;

pub struct Attached;
pub struct Powered;
pub struct Default;
pub struct Addressed;
pub struct Configured;

pub struct UsbDevice<State> {
    address: u8,
    _state: PhantomData<State>,
}

impl UsbDevice<Attached> {
    pub fn new() -> Self {
        UsbDevice { address: 0, _state: PhantomData }
    }
    pub fn power_on(self) -> UsbDevice<Powered> {
        UsbDevice { address: self.address, _state: PhantomData }
    }
}

impl UsbDevice<Powered> {
    pub fn reset(self) -> UsbDevice<Default> {
        UsbDevice { address: self.address, _state: PhantomData }
    }
}

impl UsbDevice<Default> {
    pub fn set_address(self, addr: u8) -> UsbDevice<Addressed> {
        UsbDevice { address: addr, _state: PhantomData }
    }
}

impl UsbDevice<Addressed> {
    pub fn configure(self) -> UsbDevice<Configured> {
        UsbDevice { address: self.address, _state: PhantomData }
    }
}

impl UsbDevice<Configured> {
    pub fn send_data(&self, _data: &[u8]) {
        // Only available in Configured state
    }
}
```

</details>

## Key Takeaways<br><span class="zh-inline">本章要点</span>

1. **Type-state makes wrong-order calls impossible** — methods only exist on the state where they're valid.<br><span class="zh-inline">**Type-state 会让乱序调用变得不可能**：方法只存在于它合法的那个状态上。</span>
2. **Each transition consumes `self`** — you can't hold onto an old state after transitioning.<br><span class="zh-inline">**每次转换都会消费 `self`**：状态一旦切过去，就没法继续拿着旧状态乱用。</span>
3. **Combine with capability tokens** — `firmware_update()` requires *both* `Session<Active>` and `AdminToken`.<br><span class="zh-inline">**可以和能力令牌组合**：像 `firmware_update()` 这种操作，可以同时要求 `Session&lt;Active&gt;` 和 `AdminToken`。</span>
4. **Three beats, increasing complexity** — IPMI (pure FSM), PCIe LTSSM (recovery branches), and firmware update (FSM + tokens + single-use proofs) show the pattern scales from simple to richly composed.<br><span class="zh-inline">**三幕结构，复杂度逐层上升**：IPMI 是纯 FSM，PCIe LTSSM 多了恢复分支，固件升级则把 FSM、令牌和单次使用证明全揉在一起，说明这套模式能从简单场景一路扩展到复杂组合场景。</span>
5. **Don't over-apply** — two-state request/response protocols are simpler without type-state.<br><span class="zh-inline">**别乱上强度**：只有两个状态的请求响应协议，很多时候不用 type-state 反而更清爽。</span>
6. **The pattern extends to full Redfish workflows** — ch17 applies type-state to Redfish session lifecycles, and ch18 uses builder type-state for response construction.<br><span class="zh-inline">**这套模式还能继续扩展到完整 Redfish 工作流**：第 17 章会把 type-state 用到 Redfish 会话生命周期上，第 18 章则会把 builder type-state 用到响应构造上。</span>

---
