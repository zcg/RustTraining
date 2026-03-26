# Type-Driven Correctness in Rust<br><span class="zh-inline">Rust 中的类型驱动正确性</span>

## Speaker Intro<br><span class="zh-inline">讲者简介</span>

- Principal Firmware Architect in Microsoft SCHIE (Silicon and Cloud Hardware Infrastructure Engineering) team<br><span class="zh-inline">微软 SCHIE 团队首席固件架构师。</span>
- Industry veteran with expertise in security, systems programming (firmware, operating systems, hypervisors), CPU and platform architecture, and C++ systems<br><span class="zh-inline">长期从事安全、系统编程、固件、操作系统、虚拟机监控器、CPU 与平台架构，以及 C++ 系统开发。</span>
- Started programming in Rust in 2017 (@AWS EC2), and have been in love with the language ever since<br><span class="zh-inline">自 2017 年在 AWS EC2 开始使用 Rust，此后持续深耕这门语言。</span>

---

A practical guide to using Rust's type system to make entire classes of bugs **impossible to compile**. While the companion [Rust Patterns](../rust-patterns-book/) book covers the mechanics (traits, associated types, type-state), this guide shows how to **apply** those mechanics to real-world domains — hardware diagnostics, cryptography, protocol validation, and embedded systems.<br><span class="zh-inline">这是一本强调“如何把一整类错误变成**根本无法通过编译**”的实战指南。姊妹教材 [Rust Patterns](../rust-patterns-book/) 负责讲清 trait、关联类型、类型状态这些机制本身，而这本书要讲的是：如何把这些机制真正落到硬件诊断、密码学、协议验证和嵌入式系统这些真实领域里。</span>

Every pattern here follows one principle: **push invariants from runtime checks into the type system so the compiler enforces them.**<br><span class="zh-inline">这里所有模式都围绕同一个原则：**把原本依赖运行时检查的不变量，前移到类型系统里，让编译器来强制执行。**</span>

## How to Use This Book<br><span class="zh-inline">如何使用本书</span>

### Difficulty Legend<br><span class="zh-inline">难度说明</span>

| Symbol | Level | Audience |
|:------:|-------|----------|
| 🟢 | Introductory<br><span class="zh-inline">入门</span> | Comfortable with ownership + traits<br><span class="zh-inline">已经熟悉所有权与 trait。</span> |
| 🟡 | Intermediate<br><span class="zh-inline">中级</span> | Familiar with generics + associated types<br><span class="zh-inline">已经熟悉泛型与关联类型。</span> |
| 🔴 | Advanced<br><span class="zh-inline">高级</span> | Ready for type-state, phantom types, and session types<br><span class="zh-inline">已经准备好进入类型状态、幻类型与会话类型。</span> |

### Pacing Guide<br><span class="zh-inline">学习路径建议</span>

| Goal | Path | Time |
|------|------|------|
| **Quick overview**<br><span class="zh-inline">快速总览</span> | ch01, ch13 (reference card)<br><span class="zh-inline">第 1 章、第 13 章参考卡</span> | 30 min<br><span class="zh-inline">30 分钟</span> |
| **IPMI / BMC developer**<br><span class="zh-inline">IPMI / BMC 开发者</span> | ch02, ch05, ch07, ch10, ch17<br><span class="zh-inline">第 2、5、7、10、17 章</span> | 2.5 hrs<br><span class="zh-inline">2.5 小时</span> |
| **GPU / PCIe developer**<br><span class="zh-inline">GPU / PCIe 开发者</span> | ch02, ch06, ch09, ch10, ch15<br><span class="zh-inline">第 2、6、9、10、15 章</span> | 2.5 hrs<br><span class="zh-inline">2.5 小时</span> |
| **Redfish implementer**<br><span class="zh-inline">Redfish 实现者</span> | ch02, ch05, ch07, ch08, ch17, ch18<br><span class="zh-inline">第 2、5、7、8、17、18 章</span> | 3 hrs<br><span class="zh-inline">3 小时</span> |
| **Framework / infrastructure**<br><span class="zh-inline">框架 / 基础设施工程师</span> | ch04, ch08, ch11, ch14, ch18<br><span class="zh-inline">第 4、8、11、14、18 章</span> | 2.5 hrs<br><span class="zh-inline">2.5 小时</span> |
| **New to correct-by-construction**<br><span class="zh-inline">第一次接触 correct-by-construction</span> | ch01 → ch10 in order, then ch12 exercises<br><span class="zh-inline">先顺序读完第 1–10 章，再做第 12 章练习</span> | 4 hrs<br><span class="zh-inline">4 小时</span> |
| **Full deep dive**<br><span class="zh-inline">完整深入学习</span> | All chapters sequentially<br><span class="zh-inline">按顺序读完全书</span> | 7 hrs<br><span class="zh-inline">7 小时</span> |

### Annotated Table of Contents<br><span class="zh-inline">带说明的目录</span>

| Ch | Title | Difficulty | Key Idea |
|----|-------|:----------:|----------|
| 1 | The Philosophy — Why Types Beat Tests<br><span class="zh-inline">理念：为什么类型胜过测试</span> | 🟢 | Three levels of correctness; types as compiler-checked guarantees<br><span class="zh-inline">正确性的三个层级，以及“类型就是编译器检查过的保证”这一视角。</span> |
| 2 | Typed Command Interfaces<br><span class="zh-inline">类型化命令接口</span> | 🟡 | Associated types bind request → response<br><span class="zh-inline">用关联类型把请求和响应绑定起来。</span> |
| 3 | Single-Use Types<br><span class="zh-inline">单次使用类型</span> | 🟡 | Move semantics as linear types for crypto<br><span class="zh-inline">把移动语义当作密码学里的线性类型来使用。</span> |
| 4 | Capability Tokens<br><span class="zh-inline">能力令牌</span> | 🟡 | Zero-sized proof-of-authority tokens<br><span class="zh-inline">零大小的授权证明令牌。</span> |
| 5 | Protocol State Machines<br><span class="zh-inline">协议状态机</span> | 🔴 | Type-state for IPMI sessions + PCIe LTSSM<br><span class="zh-inline">把类型状态应用到 IPMI 会话和 PCIe LTSSM。</span> |
| 6 | Dimensional Analysis<br><span class="zh-inline">量纲分析</span> | 🟢 | Newtype wrappers prevent unit mix-ups<br><span class="zh-inline">用 newtype 包装器防止单位混淆。</span> |
| 7 | Validated Boundaries<br><span class="zh-inline">已验证边界</span> | 🟡 | Parse once at the edge, carry proof in types<br><span class="zh-inline">在边界处解析一次，并把验证结果携带进类型里。</span> |
| 8 | Capability Mixins<br><span class="zh-inline">能力混入</span> | 🟡 | Ingredient traits + blanket impls<br><span class="zh-inline">用 ingredient trait 加 blanket impl 组合能力。</span> |
| 9 | Phantom Types<br><span class="zh-inline">幻类型</span> | 🟡 | PhantomData for register width, DMA direction<br><span class="zh-inline">用 PhantomData 表达寄存器宽度、DMA 方向等信息。</span> |
| 10 | Putting It All Together<br><span class="zh-inline">全部整合</span> | 🟡 | All 7 patterns in one diagnostic platform<br><span class="zh-inline">把 7 种模式整合进一个诊断平台。</span> |
| 11 | Fourteen Tricks from the Trenches<br><span class="zh-inline">一线实践中的十四个技巧</span> | 🟡 | Sentinel→Option, sealed traits, builders, etc.<br><span class="zh-inline">包括 Sentinel → Option、sealed trait、builder 等技巧。</span> |
| 12 | Exercises<br><span class="zh-inline">练习</span> | 🟡 | Six capstone problems with solutions<br><span class="zh-inline">六个带答案的综合题。</span> |
| 13 | Reference Card<br><span class="zh-inline">参考卡片</span> | — | Pattern catalogue + decision flowchart<br><span class="zh-inline">模式目录加决策流程图。</span> |
| 14 | Testing Type-Level Guarantees<br><span class="zh-inline">测试类型层保证</span> | 🟡 | trybuild, proptest, cargo-show-asm<br><span class="zh-inline">涵盖 trybuild、proptest 和 cargo-show-asm。</span> |
| 15 | Const Fn<br><span class="zh-inline">Const Fn</span> | 🟠 | Compile-time proofs for memory maps, registers, bitfields<br><span class="zh-inline">为内存映射、寄存器和位段提供编译期证明。</span> |
| 16 | Send & Sync<br><span class="zh-inline">Send 与 Sync</span> | 🟠 | Compile-time concurrency proofs<br><span class="zh-inline">提供编译期并发正确性证明。</span> |
| 17 | Redfish Client Walkthrough<br><span class="zh-inline">Redfish 客户端实战讲解</span> | 🟡 | Eight patterns composed into a type-safe Redfish client<br><span class="zh-inline">把八种模式组合进一个类型安全的 Redfish 客户端。</span> |
| 18 | Redfish Server Walkthrough<br><span class="zh-inline">Redfish 服务端实战讲解</span> | 🟡 | Builder type-state, source tokens, health rollup, mixins<br><span class="zh-inline">涵盖 builder 类型状态、source token、health rollup 和 mixin。</span> |

## Prerequisites<br><span class="zh-inline">前置知识</span>

| Concept | Where to learn it |
|---------|-------------------|
| Ownership and borrowing<br><span class="zh-inline">所有权与借用</span> | [Rust Patterns](../rust-patterns-book/), ch01<br><span class="zh-inline">可参考 Rust Patterns 第 1 章。</span> |
| Traits and associated types<br><span class="zh-inline">Trait 与关联类型</span> | [Rust Patterns](../rust-patterns-book/), ch02<br><span class="zh-inline">可参考 Rust Patterns 第 2 章。</span> |
| Newtypes and type-state<br><span class="zh-inline">Newtype 与类型状态</span> | [Rust Patterns](../rust-patterns-book/), ch03<br><span class="zh-inline">可参考 Rust Patterns 第 3 章。</span> |
| PhantomData<br><span class="zh-inline">PhantomData</span> | [Rust Patterns](../rust-patterns-book/), ch04<br><span class="zh-inline">可参考 Rust Patterns 第 4 章。</span> |
| Generics and trait bounds<br><span class="zh-inline">泛型与 trait 约束</span> | [Rust Patterns](../rust-patterns-book/), ch01<br><span class="zh-inline">可参考 Rust Patterns 第 1 章。</span> |

## The Correct-by-Construction Spectrum<br><span class="zh-inline">Correct-by-Construction 光谱</span>

```text
← Less Safe                                                    More Safe →

Runtime checks      Unit tests        Property tests      Correct by Construction
─────────────       ──────────        ──────────────      ──────────────────────

if temp > 100 {     #[test]           proptest! {         struct Celsius(f64);
  panic!("too       fn test_temp() {    |t in 0..200| {   // Can't confuse with Rpm
  hot");              assert!(          assert!(...)       // at the type level
}                     check(42));     }
                    }                 }
                                                          Invalid program?
Invalid program?    Invalid program?  Invalid program?    Won't compile.
Crashes in prod.    Fails in CI.      Fails in CI         Never exists.
                                      (probabilistic).
```

This guide operates at the rightmost position — where bugs don't exist because the type system **cannot express them**.<br><span class="zh-inline">这本书关注的就是最右边那一端：错误之所以不存在，不是因为测出来了，而是因为类型系统**根本不允许它被表达出来**。</span>

---
