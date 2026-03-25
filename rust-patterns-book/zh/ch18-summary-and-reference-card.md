## Quick Reference Card<br><span class="zh-inline">快速参考卡片</span>

### Pattern Decision Guide<br><span class="zh-inline">模式决策指南</span>

```text
Need type safety for primitives?              原始类型需要类型安全？
└── Newtype pattern (Ch3)                     └── 用 Newtype 模式（第 3 章）

Need compile-time state enforcement?          需要编译期状态约束？
└── Type-state pattern (Ch3)                  └── 用 Type-state 模式（第 3 章）

Need a "tag" with no runtime data?            需要一个运行时零开销的“标签”？
└── PhantomData (Ch4)                         └── 用 PhantomData（第 4 章）

Need to break Rc/Arc reference cycles?        需要打破 Rc/Arc 引用环？
└── Weak<T> / sync::Weak<T> (Ch8)             └── 用 Weak<T> / sync::Weak<T>（第 8 章）

Need to wait for a condition without busy-looping?
需要等待某个条件，但又不想忙等？
└── Condvar + Mutex (Ch6)                     └── 用 Condvar + Mutex（第 6 章）

Need to handle "one of N types"?              需要处理“多种类型中的一种”？
├── Known closed set → Enum                   ├── 已知且封闭的集合 → Enum
├── Open set, hot path → Generics             ├── 开放集合，且在热点路径上 → Generics
├── Open set, cold path → dyn Trait           ├── 开放集合，但在冷路径上 → dyn Trait
└── Completely unknown types → Any + TypeId (Ch2)
                                              └── 类型完全未知 → Any + TypeId（第 2 章）

Need shared state across threads?             需要跨线程共享状态？
├── Simple counter/flag → Atomics             ├── 简单计数器或标志位 → Atomics
├── Short critical section → Mutex            ├── 临界区很短 → Mutex
├── Read-heavy → RwLock                       ├── 读多写少 → RwLock
├── Lazy one-time init → OnceLock / LazyLock (Ch6)
│                                             ├── 惰性一次性初始化 → OnceLock / LazyLock（第 6 章）
└── Complex state → Actor + Channels          └── 状态复杂 → Actor + Channel

Need to parallelize computation?              需要把计算并行化？
├── Collection processing → rayon::par_iter   ├── 处理集合 → rayon::par_iter
├── Background task → thread::spawn           ├── 后台任务 → thread::spawn
└── Borrow local data → thread::scope         └── 需要借用局部数据 → thread::scope

Need async I/O or concurrent networking?      需要异步 I/O 或并发网络处理？
├── Basic → tokio + async/await (Ch15)        ├── 基础场景 → tokio + async/await（第 15 章）
└── Advanced (streams, middleware) → see Async Rust Training
                                              └── 进阶场景（stream、中间件）→ 继续看 Async Rust Training

Need error handling?                          需要错误处理？
├── Library → thiserror (#[derive(Error)])    ├── 库代码 → thiserror（`#[derive(Error)]`）
└── Application → anyhow (Result<T>)          └── 应用代码 → anyhow（`Result<T>`）

Need to prevent a value from being moved?     需要阻止某个值被移动？
└── Pin<T> (Ch8) — required for Futures, self-referential types
                                              └── 用 Pin<T>（第 8 章），Future 和自引用类型都要靠它
```

### Trait Bounds Cheat Sheet<br><span class="zh-inline">Trait Bound 速查表</span>

| Bound | Meaning |
|-------|---------|
| `T: Clone`<br><span class="zh-inline">`T: Clone`</span> | Can be duplicated<br><span class="zh-inline">可以复制出一个逻辑副本</span> |
| `T: Send`<br><span class="zh-inline">`T: Send`</span> | Can be moved to another thread<br><span class="zh-inline">可以安全移动到另一个线程</span> |
| `T: Sync`<br><span class="zh-inline">`T: Sync`</span> | `&T` can be shared between threads<br><span class="zh-inline">`&T` 可以在线程间共享</span> |
| `T: 'static`<br><span class="zh-inline">`T: 'static`</span> | Contains no non-static references<br><span class="zh-inline">不含非 `'static` 引用</span> |
| `T: Sized`<br><span class="zh-inline">`T: Sized`</span> | Size known at compile time (default)<br><span class="zh-inline">编译期已知大小，默认就是这个约束</span> |
| `T: ?Sized`<br><span class="zh-inline">`T: ?Sized`</span> | Size may not be known (`[T]`, `dyn Trait`)<br><span class="zh-inline">大小可能未知，例如 `[T]`、`dyn Trait`</span> |
| `T: Unpin`<br><span class="zh-inline">`T: Unpin`</span> | Safe to move after pinning<br><span class="zh-inline">即使被 pin 过，后续仍可安全移动</span> |
| `T: Default`<br><span class="zh-inline">`T: Default`</span> | Has a default value<br><span class="zh-inline">存在默认值</span> |
| `T: Into<U>`<br><span class="zh-inline">`T: Into<U>`</span> | Can be converted to `U`<br><span class="zh-inline">可以转换成 `U`</span> |
| `T: AsRef<U>`<br><span class="zh-inline">`T: AsRef<U>`</span> | Can be borrowed as `&U`<br><span class="zh-inline">可以借用为 `&U`</span> |
| `T: Deref<Target = U>`<br><span class="zh-inline">`T: Deref<Target = U>`</span> | Auto-derefs to `&U`<br><span class="zh-inline">会自动解引用为 `&U`</span> |
| `F: Fn(A) -> B`<br><span class="zh-inline">`F: Fn(A) -> B`</span> | Callable, borrows state immutably<br><span class="zh-inline">可调用，并以不可变方式借用环境状态</span> |
| `F: FnMut(A) -> B`<br><span class="zh-inline">`F: FnMut(A) -> B`</span> | Callable, may mutate state<br><span class="zh-inline">可调用，并且可能修改捕获状态</span> |
| `F: FnOnce(A) -> B`<br><span class="zh-inline">`F: FnOnce(A) -> B`</span> | Callable exactly once, may consume state<br><span class="zh-inline">只能调用一次，并且可能消费捕获状态</span> |

### Lifetime Elision Rules<br><span class="zh-inline">生命周期省略规则</span>

The compiler inserts lifetimes automatically in three cases (so you don't have to):<br><span class="zh-inline">编译器会在三种场景里自动补生命周期，所以很多时候不用手写：</span>

```rust
// Rule 1: Each reference parameter gets its own lifetime
// 规则 1：每个引用参数各自拥有独立生命周期
// fn foo(x: &str, y: &str)  →  fn foo<'a, 'b>(x: &'a str, y: &'b str)

// Rule 2: If there's exactly ONE input lifetime, it's used for all outputs
// 规则 2：如果只有一个输入生命周期，输出就沿用它
// fn foo(x: &str) -> &str   →  fn foo<'a>(x: &'a str) -> &'a str

// Rule 3: If one parameter is &self or &mut self, its lifetime is used
// 规则 3：如果某个参数是 &self 或 &mut self，就沿用它的生命周期
// fn foo(&self, x: &str) -> &str  →  fn foo<'a>(&'a self, x: &str) -> &'a str
```

**When you MUST write explicit lifetimes**:<br><span class="zh-inline">**以下情况必须显式写生命周期：**</span>

- Multiple input references and a reference output (compiler can't guess which input)<br><span class="zh-inline">有多个输入引用，同时返回引用，编译器没法猜输出究竟绑定哪个输入。</span>
- Struct fields that hold references: `struct Ref<'a> { data: &'a str }`<br><span class="zh-inline">结构体字段里持有引用，例如 `struct Ref<'a> { data: &'a str }`。</span>
- `'static` bounds when you need data without borrowed references<br><span class="zh-inline">需要无借用引用的数据时，使用 `'static` 约束。</span>

### Common Derive Traits<br><span class="zh-inline">常见的 Derive Trait</span>

```rust
#[derive(
    Debug,          // {:?} formatting
                    // {:?} 调试格式化
    Clone,          // .clone()
                    // .clone()
    Copy,           // Implicit copy (only for simple types)
                    // 隐式拷贝，只适合简单类型
    PartialEq, Eq,  // == comparison
                    // == 比较
    PartialOrd, Ord, // < > comparison + sorting
                     // < > 比较与排序
    Hash,           // HashMap/HashSet key
                    // 作为 HashMap / HashSet 键
    Default,        // Type::default()
                    // Type::default()
)]
struct MyType { /* ... */ }
```

### Module Visibility Quick Reference<br><span class="zh-inline">模块可见性速查</span>

```text
pub           → visible everywhere
pub           → 处处可见
pub(crate)    → visible within the crate
pub(crate)    → 仅在当前 crate 内可见
pub(super)    → visible to parent module
pub(super)    → 仅父模块可见
pub(in path)  → visible within a specific path
pub(in path)  → 仅指定路径内可见
(nothing)     → private to current module + children
（不写）       → 当前模块私有，子模块也能访问
```

### Further Reading<br><span class="zh-inline">延伸阅读</span>

| Resource | Why |
|----------|-----|
| [Rust Design Patterns](https://rust-unofficial.github.io/patterns/)<br><span class="zh-inline">Rust Design Patterns</span> | Catalog of idiomatic patterns and anti-patterns<br><span class="zh-inline">收录大量符合 Rust 惯例的模式与反模式</span> |
| [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)<br><span class="zh-inline">Rust API Guidelines</span> | Official checklist for polished public APIs<br><span class="zh-inline">打磨公开 API 的官方检查清单</span> |
| [Rust Atomics and Locks](https://marabos.nl/atomics/)<br><span class="zh-inline">Rust Atomics and Locks</span> | Mara Bos's deep dive into concurrency primitives<br><span class="zh-inline">Mara Bos 对并发原语的深入解析</span> |
| [The Rustonomicon](https://doc.rust-lang.org/nomicon/)<br><span class="zh-inline">The Rustonomicon</span> | Official guide to unsafe Rust and dark corners<br><span class="zh-inline">官方 unsafe Rust 深水区指南</span> |
| [Error Handling in Rust](https://blog.burntsushi.net/rust-error-handling/)<br><span class="zh-inline">Error Handling in Rust</span> | Andrew Gallant's comprehensive guide<br><span class="zh-inline">Andrew Gallant 的系统性错误处理文章</span> |
| [Jon Gjengset — Crust of Rust series](https://www.youtube.com/playlist?list=PLqbS7AVVErFiWDOAVrPt7aYmnuuOLYvOa)<br><span class="zh-inline">Jon Gjengset 的 Crust of Rust 系列</span> | Deep dives into iterators, lifetimes, channels, etc.<br><span class="zh-inline">深入讲解迭代器、生命周期、channel 等主题</span> |
| [Effective Rust](https://www.lurklurk.org/effective-rust/)<br><span class="zh-inline">Effective Rust</span> | 35 specific ways to improve your Rust code<br><span class="zh-inline">35 条具体建议，帮助持续改进 Rust 代码</span> |

***

*End of Rust Patterns & Engineering How-Tos*<br><span class="zh-inline">*Rust Patterns & Engineering How-Tos 结束。*</span>
