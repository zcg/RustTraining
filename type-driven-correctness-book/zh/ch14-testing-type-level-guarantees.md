# Testing Type-Level Guarantees 🟡<br><span class="zh-inline">测试类型层面的保证 🟡</span>

> **What you'll learn:** How to test that invalid code really fails to compile with `trybuild`, how to fuzz validated boundaries with `proptest`, how to verify RAII invariants, and how to use `cargo-show-asm` to prove zero-cost abstractions.<br><span class="zh-inline">**本章将学到什么：** 如何用 `trybuild` 验证非法代码确实无法通过编译，如何用 `proptest` 模糊测试已校验边界，如何验证 RAII 不变量，以及如何借助 `cargo-show-asm` 证明抽象确实没有运行时成本。</span>
>
> **Cross-references:** [ch03](ch03-single-use-types-cryptographic-guarantee.md), [ch07](ch07-validated-boundaries-parse-dont-validate.md), and [ch05](ch05-protocol-state-machines-type-state-for-r.md).<br><span class="zh-inline">**交叉阅读：** [第 3 章](ch03-single-use-types-cryptographic-guarantee.md)、[第 7 章](ch07-validated-boundaries-parse-dont-validate.md) 和 [第 5 章](ch05-protocol-state-machines-type-state-for-r.md)。</span>

## Testing Type-Level Guarantees<br><span class="zh-inline">如何测试类型层面的保证</span>

Correct-by-construction patterns move many bugs from runtime to compile time. But that raises a very fair question: how is it tested that illegal code really fails to compile, and how is it checked that validated boundaries still stand up under randomized input? This chapter covers the testing tools that complement type-driven correctness.<br><span class="zh-inline">correct-by-construction 这套模式，会把大量 bug 从运行时提前挪到编译期。但随之而来的问题也很实际：怎么测试“非法代码确实编不过”？又怎么确认“校验边界在随机输入轰炸下依然站得住”？这一章讲的就是和类型驱动正确性配套的测试工具。</span>

### Compile-Fail Tests with `trybuild`<br><span class="zh-inline">用 `trybuild` 做编译失败测试</span>

[`trybuild`](https://crates.io/crates/trybuild) allows tests to assert that certain code **must not compile**. This is especially important for type-level invariants: if someone accidentally adds `Clone` to a single-use `Nonce`, a compile-fail test can catch the regression immediately.<br><span class="zh-inline">[`trybuild`](https://crates.io/crates/trybuild) 允许测试直接断言：某段代码 **就不该编译成功**。这对类型级不变量特别重要。比如有人手一抖，给一次性的 `Nonce` 补了个 `Clone`，compile-fail 测试立刻就能把回归抓出来。</span>

**Setup:**<br><span class="zh-inline">**先加依赖：**</span>

```toml
# Cargo.toml
[dev-dependencies]
trybuild = "1"
```

**Test file (`tests/compile_fail.rs`):**<br><span class="zh-inline">**测试入口文件 `tests/compile_fail.rs`：**</span>

```rust,ignore
#[test]
fn type_safety_tests() {
    let t = trybuild::TestCases::new();
    t.compile_fail("tests/ui/*.rs");
}
```

**Test case: Nonce reuse must not compile:**<br><span class="zh-inline">**测试用例：`Nonce` 重复使用必须编译失败：**</span>

```rust,ignore
// tests/ui/nonce_reuse.rs
use my_crate::Nonce;

fn main() {
    let nonce = Nonce::new();
    encrypt(nonce);
    encrypt(nonce); // should fail: use of moved value
}

fn encrypt(_n: Nonce) {}
```

**Expected error (`tests/ui/nonce_reuse.stderr`):**<br><span class="zh-inline">**预期错误输出：**</span>

```text
error[E0382]: use of moved value: `nonce`
 --> tests/ui/nonce_reuse.rs:6:13
  |
4 |     let nonce = Nonce::new();
  |         ----- move occurs because `nonce` has type `Nonce`, which does not implement the `Copy` trait
5 |     encrypt(nonce);
  |             ----- value moved here
6 |     encrypt(nonce); // should fail: use of moved value
  |             ^^^^^ value used here after move
```

**More compile-fail test cases per chapter:**<br><span class="zh-inline">**按章节还能继续补这些 compile-fail 用例：**</span>

| Pattern (Chapter)<br><span class="zh-inline">模式（章节）</span> | Test assertion<br><span class="zh-inline">要验证的断言</span> | File<br><span class="zh-inline">文件</span> |
|-------------------|---------------|------|
| Single-Use Nonce (ch03)<br><span class="zh-inline">一次性 Nonce</span> | Can't use nonce twice<br><span class="zh-inline">Nonce 不能使用两次</span> | `nonce_reuse.rs` |
| Capability Token (ch04)<br><span class="zh-inline">能力令牌</span> | Can't call `admin_op()` without token<br><span class="zh-inline">没有令牌就不能调用 `admin_op()`</span> | `missing_token.rs` |
| Type-State (ch05)<br><span class="zh-inline">类型状态</span> | Can't `send_command()` on `Session<Idle>`<br><span class="zh-inline">`Session<Idle>` 上不能 `send_command()`</span> | `wrong_state.rs` |
| Dimensional (ch06)<br><span class="zh-inline">量纲类型</span> | Can't add `Celsius + Rpm`<br><span class="zh-inline">不能把 `Celsius` 和 `Rpm` 相加</span> | `unit_mismatch.rs` |
| Sealed Trait (Trick 2)<br><span class="zh-inline">密封 trait</span> | External crate can't impl sealed trait<br><span class="zh-inline">外部 crate 不能实现 sealed trait</span> | `unseal_attempt.rs` |
| Non-Exhaustive (Trick 3)<br><span class="zh-inline">非穷尽匹配</span> | External match without wildcard fails<br><span class="zh-inline">外部匹配缺少通配分支会失败</span> | `missing_wildcard.rs` |

**CI integration:**<br><span class="zh-inline">**CI 里这样接：**</span>

```yaml
# .github/workflows/ci.yml
- name: Run compile-fail tests
  run: cargo test --test compile_fail
```

### Property-Based Testing of Validated Boundaries<br><span class="zh-inline">对已校验边界做性质测试</span>

Validated boundaries from chapter 7 parse once, validate once, and reject invalid data at the edge. The obvious next question is: how to gain confidence that validation catches a broad range of malformed inputs? Property-based testing with [`proptest`](https://crates.io/crates/proptest) answers that by generating large numbers of randomized cases.<br><span class="zh-inline">第 7 章里的 validated boundary 会在边界处完成一次解析、一次校验，把非法数据挡在外面。接下来的问题就是：怎么证明这套校验不是只会处理那几个手写样例？[`proptest`](https://crates.io/crates/proptest) 这种性质测试工具会自动生成大量随机输入，专门狠狠干这类边界。</span>

```toml
# Cargo.toml
[dev-dependencies]
proptest = "1"
```

```rust,ignore
use proptest::prelude::*;

proptest! {
    #[test]
    fn valid_fru_never_panics(data in proptest::collection::vec(any::<u8>(), 0..1024)) {
        if let Ok(fru) = ValidFru::try_from(RawFruData(data)) {
            let _ = fru.format_version();
            let _ = fru.board_area();
            let _ = fru.product_area();
        }
    }

    #[test]
    fn fru_round_trip(data in valid_fru_strategy()) {
        let raw = RawFruData(data.clone());
        let fru = ValidFru::try_from(raw).unwrap();
        let version = fru.format_version();
        let reparsed = ValidFru::try_from(RawFruData(data)).unwrap();
        prop_assert_eq!(version, reparsed.format_version());
    }
}

fn valid_fru_strategy() -> impl Strategy<Value = Vec<u8>> {
    let header = vec![0x01, 0x00, 0x01, 0x02, 0x00, 0x00, 0x00];
    proptest::collection::vec(any::<u8>(), 64..256)
        .prop_map(move |body| {
            let mut fru = header.clone();
            let sum: u8 = fru.iter().fold(0u8, |a, &b| a.wrapping_add(b));
            fru.push(0u8.wrapping_sub(sum));
            fru.extend_from_slice(&body);
            fru
        })
}
```

**The testing pyramid for correct-by-construction code:**<br><span class="zh-inline">**面向 correct-by-construction 代码的测试金字塔：**</span>

```text
┌───────────────────────────────────┐
│    Compile-Fail Tests (trybuild)  │ <- Invalid code must not compile
├───────────────────────────────────┤
│  Property Tests (proptest/quickcheck) │ <- Valid inputs never panic
├───────────────────────────────────┤
│    Unit Tests (#[test])           │ <- Specific inputs match expectations
├───────────────────────────────────┤
│    Type System (patterns ch02–13) │ <- Whole bug classes are impossible
└───────────────────────────────────┘
```

```text
┌───────────────────────────────────┐
│ Compile-Fail Tests（trybuild）     │ <- 非法代码必须编不过
├───────────────────────────────────┤
│ Property Tests（proptest 等）      │ <- 合法输入绝不能把代码炸崩
├───────────────────────────────────┤
│ Unit Tests（#[test]）             │ <- 具体输入得到预期输出
├───────────────────────────────────┤
│ Type System（第 2–13 章模式）      │ <- 整类 bug 根本写不出来
└───────────────────────────────────┘
```

### RAII Verification<br><span class="zh-inline">验证 RAII 是否真的生效</span>

RAII promises cleanup when scope exits. To test that promise, write tests that observe `Drop` 真的被触发。<br><span class="zh-inline">RAII 承诺的是：一旦离开作用域，清理逻辑就会执行。要验证这个承诺，就得写测试亲眼看见 `Drop` 确实被触发。</span>

```rust,ignore
use std::sync::atomic::{AtomicBool, Ordering};

static DROPPED: AtomicBool = AtomicBool::new(false);

struct TestSession;
impl Drop for TestSession {
    fn drop(&mut self) {
        DROPPED.store(true, Ordering::SeqCst);
    }
}

#[test]
fn session_drops_on_early_return() {
    DROPPED.store(false, Ordering::SeqCst);
    let result: Result<(), &str> = (|| {
        let _session = TestSession;
        Err("simulated failure")?;
        Ok(())
    })();
    assert!(result.is_err());
    assert!(DROPPED.load(Ordering::SeqCst));
}

#[test]
fn session_drops_on_panic() {
    DROPPED.store(false, Ordering::SeqCst);
    let result = std::panic::catch_unwind(|| {
        let _session = TestSession;
        panic!("simulated panic");
    });
    assert!(result.is_err());
    assert!(DROPPED.load(Ordering::SeqCst));
}
```

### Applying to Your Codebase<br><span class="zh-inline">怎么应用到自己的代码库里</span>

Here is a prioritized plan for adding type-level tests across a workspace:<br><span class="zh-inline">下面是一份按优先级排好的工作区测试加固清单：</span>

| Crate | Test type<br><span class="zh-inline">测试类型</span> | What to test<br><span class="zh-inline">测试内容</span> |
|-------|-----------|-------------|
| `protocol_lib` | Compile-fail | `Session<Idle>` can't `send_command()`<br><span class="zh-inline">`Session<Idle>` 不能发命令</span> |
| `protocol_lib` | Property | Any bytes either validate or return `Err`, but never panic<br><span class="zh-inline">任意字节流要么验证成功，要么返回 `Err`，绝不能 panic</span> |
| `thermal_diag` | Compile-fail | Can't construct `FanReading` without `HasSpi` mixin<br><span class="zh-inline">没有 `HasSpi` mixin 就不能构造 `FanReading`</span> |
| `accel_diag` | Property | Random sensor bytes are either accepted or rejected safely<br><span class="zh-inline">随机 GPU 传感器字节流必须要么通过、要么被安全拒绝</span> |
| `config_loader` | Property | Random strings never make `FromStr` for `DiagLevel` panic<br><span class="zh-inline">随机字符串绝不能让 `DiagLevel` 的 `FromStr` panic</span> |
| `pci_topology` | Compile-fail | `Register<Width16>` cannot be used where `Width32` is required<br><span class="zh-inline">`Register<Width16>` 不能冒充 `Width32`</span> |
| `event_handler` | Compile-fail | Audit token cannot be cloned<br><span class="zh-inline">审计令牌不能被克隆</span> |
| `diag_framework` | Compile-fail | `DerBuilder<Missing, _>` cannot call `finish()`<br><span class="zh-inline">`DerBuilder<Missing, _>` 不能调用 `finish()`</span> |

### Zero-Cost Abstraction: Proof by Assembly<br><span class="zh-inline">零成本抽象：用汇编来证明</span>

A common concern is whether newtypes, phantom types, or ZST markers add runtime overhead. The answer is no, and the cleanest proof is to inspect generated assembly.<br><span class="zh-inline">一个常见担心是：newtype、phantom type、零大小标记类型会不会引入额外运行时成本？答案是否定的，而最直接的证明方式就是看生成的汇编。</span>

**Setup:**<br><span class="zh-inline">**先装工具：**</span>

```bash
cargo install cargo-show-asm
```

**Example: Newtype vs raw `u32`:**<br><span class="zh-inline">**例子：newtype 和裸 `u32` 对比：**</span>

```rust,ignore
#[derive(Clone, Copy)]
pub struct Rpm(pub u32);

#[derive(Clone, Copy)]
pub struct Celsius(pub f64);

#[inline(never)]
pub fn add_rpm(a: Rpm, b: Rpm) -> Rpm {
    Rpm(a.0 + b.0)
}

#[inline(never)]
pub fn add_raw(a: u32, b: u32) -> u32 {
    a + b
}
```

**Run:**<br><span class="zh-inline">**执行命令：**</span>

```bash
cargo asm my_crate::add_rpm
cargo asm my_crate::add_raw
```

**Result — identical assembly:**<br><span class="zh-inline">**结果：汇编完全一致：**</span>

```asm
; add_rpm (newtype)           ; add_raw (raw u32)
my_crate::add_rpm:            my_crate::add_raw:
  lea eax, [rdi + rsi]         lea eax, [rdi + rsi]
  ret                          ret
```

The wrapper type disappears entirely during compilation. The same is true for `PhantomData<S>`、ZST token and other type-level markers used throughout this guide.<br><span class="zh-inline">包装类型会在编译阶段被彻底抹平。`PhantomData<S>`、零大小令牌，以及本书里反复出现的其他类型层标记，本质上也都一样。</span>

**Verify with your own code:**<br><span class="zh-inline">**也可以拿自己的代码直接验证：**</span>

```bash
cargo asm --lib ipmi_lib::session::execute
cargo asm --lib --rust ipmi_lib::session::IpmiSession
```

> **Key takeaway:** Every pattern in this guide is designed to have **zero runtime cost**. The type system carries the proof burden, and compilation erases the markers.<br><span class="zh-inline">**关键结论：** 本书里的这些模式，本质目标都是 **零运行时成本**。证明责任由类型系统承担，而这些标记会在编译阶段被消掉。</span>

## Key Takeaways<br><span class="zh-inline">本章要点</span>

1. **`trybuild` lets tests assert that invalid code must fail to compile.**<br><span class="zh-inline">1. **`trybuild` 可以让测试直接断言非法代码必须编不过。**</span>
2. **`proptest` stresses validation boundaries with large numbers of random inputs.**<br><span class="zh-inline">2. **`proptest` 能用大量随机输入狠狠干校验边界。**</span>
3. **RAII verification confirms `Drop` really runs on early return and panic paths.**<br><span class="zh-inline">3. **RAII 验证可以确认 `Drop` 在提前返回和 panic 路径上都照样执行。**</span>
4. **`cargo-show-asm` is the cleanest proof that phantom types, ZSTs, and newtypes are zero-cost.**<br><span class="zh-inline">4. **`cargo-show-asm` 是证明 phantom type、ZST 和 newtype 零成本的最直接方法。**</span>
5. **Every “impossible state” in the design should ideally have a matching compile-fail test.**<br><span class="zh-inline">5. **设计里每个“本不可能发生的状态”，最好都配一个对应的 compile-fail 测试。**</span>

---

*End of Type-Driven Correctness in Rust*<br><span class="zh-inline">《Rust 中的类型驱动正确性》完</span>
