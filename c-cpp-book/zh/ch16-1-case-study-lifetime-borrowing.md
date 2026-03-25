# Case Study 3: Framework communication → Lifetime borrowing<br><span class="zh-inline">案例三：框架通信改成生命周期借用</span>

> **What you'll learn:** How to convert C++ raw-pointer framework communication patterns to Rust's lifetime-based borrowing system, eliminating dangling pointer risks while maintaining zero-cost abstractions.<br><span class="zh-inline">**本章将学到什么：** 如何把 C++ 里依赖裸指针的框架通信模式，改造成 Rust 基于生命周期的借用模型，在保持零成本抽象的同时，把悬垂指针风险整批干掉。</span>

## The C++ Pattern: Raw Pointer to Framework<br><span class="zh-inline">C++ 里的老模式：模块里存一个指向框架的裸指针</span>

```cpp
// C++ original: Every diagnostic module stores a raw pointer to the framework
class DiagBase {
protected:
    DiagFramework* m_pFramework;  // Raw pointer — who owns this?
public:
    DiagBase(DiagFramework* fw) : m_pFramework(fw) {}
    
    void LogEvent(uint32_t code, const std::string& msg) {
        m_pFramework->GetEventLog()->Record(code, msg);  // Hope it's still alive!
    }
};
// Problem: m_pFramework is a raw pointer with no lifetime guarantee
// If framework is destroyed while modules still reference it → UB
```

这类写法在 C++ 大项目里真是太常见了。模块对象里塞一个 `Framework*`，用起来方便，写起来也快，但问题是所有权和生命周期完全靠人脑硬记。<br><span class="zh-inline">只要框架先析构、模块后访问，现场就直接进未定义行为，连个体面点的错误提示都未必给。</span>

## The Rust Solution: `DiagContext` with Lifetime Borrowing<br><span class="zh-inline">Rust 的解法：带生命周期借用的 `DiagContext`</span>

```rust
// Example: module.rs — Borrow, don't store

/// Context passed to diagnostic modules during execution.
/// The lifetime 'a guarantees the framework outlives the context.
pub struct DiagContext<'a> {
    pub der_log: &'a mut EventLogManager,
    pub config: &'a ModuleConfig,
    pub framework_opts: &'a HashMap<String, String>,
}

/// Modules receive context as a parameter — never store framework pointers
pub trait DiagModule {
    fn id(&self) -> &str;
    fn execute(&mut self, ctx: &mut DiagContext) -> DiagResult<()>;
    fn pre_execute(&mut self, _ctx: &mut DiagContext) -> DiagResult<()> {
        Ok(())
    }
    fn post_execute(&mut self, _ctx: &mut DiagContext) -> DiagResult<()> {
        Ok(())
    }
}
```

这里的思路特别关键：**别存指针，改成按调用传上下文。**<br><span class="zh-inline">模块不再长期持有 `Framework*`，而是在执行时临时借用一份 `DiagContext<'a>`。生命周期 `'a` 会明确告诉编译器，这份上下文活多久、里面借来的资源又活多久。</span>

### Key Insight<br><span class="zh-inline">关键理解</span>

- C++ modules **store** a pointer to the framework (danger: what if the framework is destroyed first?)<br><span class="zh-inline">C++ 模块是**存一根框架指针**，问题在于框架如果先没了，模块还握着这根指针就麻了。</span>
- Rust modules **receive** a context as a function parameter — the borrow checker guarantees the framework is alive during the call<br><span class="zh-inline">Rust 模块则是在函数参数里**接收一份上下文借用**，借用检查器会保证调用期间框架对象一定还活着。</span>
- No raw pointers, no lifetime ambiguity, no "hope it's still alive"<br><span class="zh-inline">没有裸指针，没有生命周期暧昧地带，也不用靠“希望它还活着”这种玄学维持系统运转。</span>

这一步改完之后，框架与模块之间的关系会清楚很多。以前是“大家都拿着同一个裸指针乱飞”，现在是“谁在什么时候借用了哪些资源”都有静态边界。<br><span class="zh-inline">这不仅安全，代码读起来也明显更干净。</span>

----

# Case Study 4: God object → Composable state<br><span class="zh-inline">案例四：上帝对象拆成可组合状态</span>

## The C++ Pattern: Monolithic Framework Class<br><span class="zh-inline">C++ 里的老问题：一个大到离谱的框架类</span>

```cpp
// C++ original: The framework is god object
class DiagFramework {
    // Health-monitor trap processing
    std::vector<AlertTriggerInfo> m_alertTriggers;
    std::vector<WarnTriggerInfo> m_warnTriggers;
    bool m_healthMonHasBootTimeError;
    uint32_t m_healthMonActionCounter;
    
    // GPU diagnostics
    std::map<uint32_t, GpuPcieInfo> m_gpuPcieMap;
    bool m_isRecoveryContext;
    bool m_healthcheckDetectedDevices;
    // ... 30+ more GPU-related fields
    
    // PCIe tree
    std::shared_ptr<CPcieTreeLinux> m_pPcieTree;
    
    // Event logging
    CEventLogMgr* m_pEventLogMgr;
    
    // ... several other methods
    void HandleGpuEvents();
    void HandleNicEvents();
    void RunGpuDiag();
    // Everything depends on everything
};
```

这种类一旦长成型，基本就是“上帝对象”了。什么都往里塞，什么方法都挂它身上，最后字段几十个起步，谁都不敢轻易动。<br><span class="zh-inline">最烦的是，很多本来彼此无关的状态会被硬挤进同一个壳里，导致修改一处就担心炸别处。</span>

## The Rust Solution: Composable State Structs<br><span class="zh-inline">Rust 的解法：拆成可组合状态结构体</span>

```rust
// Example: main.rs — State decomposed into focused structs

#[derive(Default)]
struct HealthMonitorState {
    alert_triggers: Vec<AlertTriggerInfo>,
    warn_triggers: Vec<WarnTriggerInfo>,
    health_monitor_action_counter: u32,
    health_monitor_has_boot_time_error: bool,
    // Only health-monitor-related fields
}

#[derive(Default)]
struct GpuDiagState {
    gpu_pcie_map: HashMap<u32, GpuPcieInfo>,
    is_recovery_context: bool,
    healthcheck_detected_devices: bool,
    // Only GPU-related fields
}

/// The framework composes these states rather than owning everything flat
struct DiagFramework {
    ctx: DiagContext,             // Execution context
    args: Args,                   // CLI arguments
    pcie_tree: Option<DeviceTree>,  // No shared_ptr needed
    event_log_mgr: EventLogManager,   // Owned, not raw pointer
    fc_manager: FcManager,        // Fault code management
    health: HealthMonitorState,   // Health-monitor state — its own struct
    gpu: GpuDiagState,           // GPU state — its own struct
}
```

这招的本质是把“大泥球”拆回几块语义明确的状态。健康监控的字段回到健康监控结构体，GPU 诊断的字段回到 GPU 状态结构体，框架本身只负责组合它们。<br><span class="zh-inline">一旦这样拆开，很多原来非得拿整个框架对象的函数，其实只需要拿 `&mut HealthMonitorState` 或 `&mut GpuDiagState` 就够了。</span>

### Key Insight<br><span class="zh-inline">关键理解</span>

- **Testability**: Each state struct can be unit-tested independently<br><span class="zh-inline">**可测试性**：每个状态结构体都可以单独做单元测试。</span>
- **Readability**: `self.health.alert_triggers` vs `m_alertTriggers` — clear ownership<br><span class="zh-inline">**可读性**：`self.health.alert_triggers` 这种写法比一堆平铺字段更能体现归属关系。</span>
- **Fearless refactoring**: Changing `GpuDiagState` can't accidentally affect health-monitor processing<br><span class="zh-inline">**重构更安心**：改 `GpuDiagState` 时，不容易顺手把健康监控逻辑带崩。</span>
- **No method soup**: Functions that only need health-monitor state take `&mut HealthMonitorState`, not the entire framework<br><span class="zh-inline">**方法不会乱炖**：只需要健康监控状态的函数，就只拿健康监控状态，不再把整个框架都拖进来。</span>

如果一个结构体已经 30 多个字段，八成真不是“这个对象很重要”，而是“这里其实挤了三四个对象，只是还没拆”。<br><span class="zh-inline">Rust 这种更强调所有权边界和局部借用的语言，会把这个问题逼得更早暴露出来，反而是好事。</span>

----

# Case Study 5: Trait objects — when they ARE right<br><span class="zh-inline">案例五：什么时候 trait object 才真用得对</span>

- Not everything should be an enum! The **diagnostic module plugin system** is a genuine use case for trait objects<br><span class="zh-inline">也不是所有东西都该往 `enum` 上套。**诊断模块插件系统** 就是 trait object 真正适合上场的场景。</span>
- Why? Because diagnostic modules are **open for extension** — new modules can be added without modifying the framework<br><span class="zh-inline">原因很简单：诊断模块集合是**开放扩展**的。以后可以继续加新模块，而不需要每次都去改框架核心。</span>

```rust
// Example: framework.rs — Vec<Box<dyn DiagModule>> is correct here
pub struct DiagFramework {
    modules: Vec<Box<dyn DiagModule>>,        // Runtime polymorphism
    pre_diag_modules: Vec<Box<dyn DiagModule>>,
    event_log_mgr: EventLogManager,
    // ...
}

impl DiagFramework {
    /// Register a diagnostic module — any type implementing DiagModule
    pub fn register_module(&mut self, module: Box<dyn DiagModule>) {
        info!("Registering module: {}", module.id());
        self.modules.push(module);
    }
}
```

这里用 `Box<dyn DiagModule>` 就很合理，因为模块集合不是封闭的，框架需要接受未来新增的实现类型。<br><span class="zh-inline">这类场景如果硬拗成 `enum`，反而会把系统写死，扩展一次就得改一次核心定义，纯属给自己找事。</span>

### When to Use Each Pattern<br><span class="zh-inline">到底什么时候用哪种模式</span>

| **Use Case**<br><span class="zh-inline">使用场景</span> | **Pattern**<br><span class="zh-inline">推荐模式</span> | **Why**<br><span class="zh-inline">原因</span> |
|-------------|-----------|--------|
| Fixed set of variants known at compile time<br><span class="zh-inline">编译期就知道的封闭变体集合</span> | `enum` + `match` | Exhaustive checking, no vtable<br><span class="zh-inline">可做穷尽检查，也没有 vtable 开销</span> |
| Hardware event types (Degrade, Fatal, Boot, ...)<br><span class="zh-inline">硬件事件类型</span> | `enum GpuEventKind` | All variants known, performance matters<br><span class="zh-inline">变体集合固定，而且性能敏感</span> |
| PCIe device types (GPU, NIC, Switch, ...)<br><span class="zh-inline">PCIe 设备类型</span> | `enum PcieDeviceKind` | Fixed set, each variant has different data<br><span class="zh-inline">集合固定，而且每个分支携带不同数据</span> |
| Plugin/module system (open for extension)<br><span class="zh-inline">插件 / 模块系统</span> | `Box<dyn Trait>` | New modules added without modifying framework<br><span class="zh-inline">新增模块时不用改框架核心</span> |
| Test mocking<br><span class="zh-inline">测试替身</span> | `Box<dyn Trait>` | Inject test doubles<br><span class="zh-inline">方便注入 mock 或 test double</span> |

这张表就是整套迁移经验里最值钱的判断尺子之一。别再机械地把 C++ 里的多态翻译成 Rust trait object，也别把所有问题都想当然塞进 `enum`。<br><span class="zh-inline">关键问题只有一个：**这个变体集合是封闭的，还是开放的？**</span>

### Exercise: Think Before You Translate<br><span class="zh-inline">练习：先判断，再翻译</span>

Given this C++ code:<br><span class="zh-inline">给定下面这段 C++ 代码：</span>

```cpp
class Shape { public: virtual double area() = 0; };
class Circle : public Shape { double r; double area() override { return 3.14*r*r; } };
class Rect : public Shape { double w, h; double area() override { return w*h; } };
std::vector<std::unique_ptr<Shape>> shapes;
```

**Question**: Should the Rust translation use `enum Shape` or `Vec<Box<dyn Shape>>`?<br><span class="zh-inline">**问题：** Rust 版本应该翻成 `enum Shape`，还是 `Vec<Box<dyn Shape>>`？</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

**Answer**: `enum Shape` — because the set of shapes is **closed** (known at compile time). You'd only use `Box<dyn Shape>` if users could add new shape types at runtime.<br><span class="zh-inline">**答案：** 用 `enum Shape`。因为图形种类集合是**封闭的**，编译期就知道。如果未来允许外部动态增加新图形类型，才更适合上 `Box<dyn Shape>`。</span>

```rust
// Correct Rust translation:
enum Shape {
    Circle { r: f64 },
    Rect { w: f64, h: f64 },
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle { r } => std::f64::consts::PI * r * r,
            Shape::Rect { w, h } => w * h,
        }
    }
}

fn main() {
    let shapes: Vec<Shape> = vec![
        Shape::Circle { r: 5.0 },
        Shape::Rect { w: 3.0, h: 4.0 },
    ];
    for shape in &shapes {
        println!("Area: {:.2}", shape.area());
    }
}
// Output:
// Area: 78.54
// Area: 12.00
```

</details>

----

# Translation metrics and lessons learned<br><span class="zh-inline">迁移指标与经验总结</span>

## What We Learned<br><span class="zh-inline">学到了什么</span>

1. **Default to enum dispatch** — In ~100K lines of C++, only ~25 uses of `Box<dyn Trait>` were genuinely needed (plugin systems, test mocks). The other ~900 virtual methods became enums with match<br><span class="zh-inline">1. **默认优先考虑 `enum` 分发**：在约 10 万行 C++ 里，真正有必要用 `Box<dyn Trait>` 的地方其实只有二十多处，主要是插件系统和测试替身。其余几百个虚函数场景，大多都能落回 `enum + match`。</span>
2. **Arena pattern eliminates reference cycles** — `shared_ptr` and `enable_shared_from_this` are symptoms of unclear ownership. Think about who **owns** the data first<br><span class="zh-inline">2. **arena 模式能消灭引用环**：`shared_ptr` 和 `enable_shared_from_this` 往往是所有权模型没理清的症状。先想清楚“到底谁拥有数据”，问题会简单很多。</span>
3. **Pass context, don't store pointers** — Lifetime-bounded `DiagContext<'a>` is safer and clearer than storing `Framework*` in every module<br><span class="zh-inline">3. **传上下文，别存指针**：带生命周期的 `DiagContext<'a>` 比每个模块里都存一根 `Framework*` 安全得多，也清楚得多。</span>
4. **Decompose god objects** — If a struct has 30+ fields, it's probably 3-4 structs wearing a trenchcoat<br><span class="zh-inline">4. **拆掉上帝对象**：一个结构体如果已经 30 多个字段，往往不是“它特别重要”，而是三四个对象披着一件风衣假装自己是一个。</span>
5. **The compiler is your pair programmer** — ~400 `dynamic_cast` calls meant ~400 potential runtime failures. Zero `dynamic_cast` equivalents in Rust means zero runtime type errors<br><span class="zh-inline">5. **把编译器当协作伙伴**：四百多个 `dynamic_cast` 本质上就是四百多个潜在运行时失败点。Rust 里把这类东西压到零，就意味着那类运行时类型错误也跟着归零。</span>

## The Hardest Parts<br><span class="zh-inline">最难啃的部分</span>

- **Lifetime annotations**: Getting borrows right takes time when you're used to raw pointers — but once it compiles, it's correct<br><span class="zh-inline">**生命周期标注**：如果原来习惯的是裸指针思维，一开始确实别扭。但一旦编译过了，正确性会强很多。</span>
- **Fighting the borrow checker**: Wanting `&mut self` in two places at once. Solution: decompose state into separate structs<br><span class="zh-inline">**和借用检查器硬碰硬**：最常见的问题是总想同时在两个地方拿 `&mut self`。真正的解法通常不是“绕过检查器”，而是把状态拆开。</span>
- **Resisting literal translation**: The temptation to write `Vec<Box<dyn Base>>` everywhere. Ask: "Is this set of variants closed?" → If yes, use enum<br><span class="zh-inline">**抵抗字面直译冲动**：最容易犯的错就是到处写 `Vec<Box<dyn Base>>`。先问一句：这个变体集合是封闭的吗？如果答案是“是”，那大概率该用 `enum`。</span>

## Recommendation for C++ Teams<br><span class="zh-inline">给 C++ 团队的建议</span>

1. Start with a small, self-contained module (not the god object)<br><span class="zh-inline">1. 先从小而自洽的模块开始，不要一上来就啃上帝对象。</span>
2. Translate data structures first, then behavior<br><span class="zh-inline">2. 先整理数据结构，再翻行为逻辑。</span>
3. Let the compiler guide you — its error messages are excellent<br><span class="zh-inline">3. 多让编译器带路，Rust 的报错信息通常相当有价值。</span>
4. Reach for `enum` before `dyn Trait`<br><span class="zh-inline">4. 在想到 `dyn Trait` 之前，先认真看看能不能用 `enum`。</span>
5. Use the [Rust playground](https://play.rust-lang.org/) to prototype patterns before integrating<br><span class="zh-inline">5. 复杂模式先在 [Rust Playground](https://play.rust-lang.org/) 里验证，再往主项目里接。</span>

这一章真正值钱的地方，不只是“怎么翻一段 C++”，而是学会迁移时的判断顺序。<br><span class="zh-inline">别急着把语法一比一替换，先把所有权、变体集合、状态边界和扩展方式想明白，后面整个系统都会顺很多。</span>

----
