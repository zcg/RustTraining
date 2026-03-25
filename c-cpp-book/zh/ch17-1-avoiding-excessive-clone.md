## Avoiding excessive `clone()`<br><span class="zh-inline">避免过度使用 `clone()`</span>

> **What you'll learn:** Why `.clone()` is often a smell in Rust, how to reshape ownership so extra copies disappear, and which patterns usually indicate that the ownership design still has issues.<br><span class="zh-inline">**本章将学到什么：** 为什么 `.clone()` 在 Rust 里经常像一种异味信号，怎样通过调整所有权设计把多余复制消掉，以及哪些常见写法通常意味着结构还没理顺。</span>

- Coming from C++, `.clone()` can feel like a comfortable default: “just copy it and move on.” In Rust that instinct often hides the real problem and burns performance for no good reason.<br><span class="zh-inline">从 C++ 过来，很容易把 `.clone()` 当成顺手的保险动作，心想“先复制一份再说”。但在 Rust 里，这种习惯经常只是把真正的所有权问题盖住，顺手还把性能也一起糟蹋了。</span>
- **Rule of thumb:** if cloning is only there to make the borrow checker shut up, the design probably needs to be adjusted.<br><span class="zh-inline">**经验法则：** 如果写 `clone()` 只是为了让借用检查器别再报错，多半说明结构还得重新整理。</span>

### When `clone()` is wrong<br><span class="zh-inline">什么时候 `clone()` 用错了</span>

```rust
// BAD: Cloning a String just to pass it to a function that only reads it
fn log_message(msg: String) {  // Takes ownership unnecessarily
    println!("[LOG] {}", msg);
}
let message = String::from("GPU test passed");
log_message(message.clone());  // Wasteful: allocates a whole new String
log_message(message);           // Original consumed — clone was pointless
```

```rust
// GOOD: Accept a borrow — zero allocation
fn log_message(msg: &str) {    // Borrows, doesn't own
    println!("[LOG] {}", msg);
}
let message = String::from("GPU test passed");
log_message(&message);          // No clone, no allocation
log_message(&message);          // Can call again — message not consumed
```

上面这类情况最典型。函数明明只读，却把参数写成拥有型，于是调用方被逼着复制一份再传。<br><span class="zh-inline">这不是借用检查器在刁难人，而是接口签名写得太重了。</span>

### Real example: returning `&str` instead of cloning<br><span class="zh-inline">真实例子：返回 `&str`，而不是盲目复制</span>

```rust
// Example: healthcheck.rs — returns a borrowed view, zero allocation
pub fn serial_or_unknown(&self) -> &str {
    self.serial.as_deref().unwrap_or(UNKNOWN_VALUE)
}

pub fn model_or_unknown(&self) -> &str {
    self.model.as_deref().unwrap_or(UNKNOWN_VALUE)
}
```

The C++ equivalent would usually return `const std::string&` or `std::string_view`. The difference is that Rust checks the lifetime relationship for real, so the returned `&str` cannot outlive `self`.<br><span class="zh-inline">对应到 C++，大概会写成 `const std::string&` 或 `std::string_view`。但 Rust 这里更狠，生命周期关系是编译器真检查的，不是靠人脑硬记。</span>

### Real example: static string slices — no heap allocation at all<br><span class="zh-inline">真实例子：静态字符串切片，连堆分配都没有</span>

```rust
// Example: healthcheck.rs — compile-time string tables
const HBM_SCREEN_RECIPES: &[&str] = &[
    "hbm_ds_ntd", "hbm_ds_ntd_gfx", "hbm_dt_ntd", "hbm_dt_ntd_gfx",
    "hbm_burnin_8h", "hbm_burnin_24h",
];
```

在 C++ 里，这类东西常被写成 `std::vector<std::string>`，运行时第一次用时再去分配。Rust 的 `&'static [&'static str]` 则直接躺在只读内存里，运行时零额外成本。<br><span class="zh-inline">该是常量表，就老老实实做常量表，别每次启动都重新搭一遍。</span>

### When `clone()` IS appropriate<br><span class="zh-inline">什么时候 `clone()` 反而是合理的</span>

| **Situation** | **Why clone is OK** | **Example** |
|--------------|--------------------|-----------|
| `Arc::clone()` for threading | Only bumps the ref count; it does not copy the payload<br><span class="zh-inline">只是增加引用计数，不会复制底层数据</span> | `let flag = stop_flag.clone();` |
| Moving data into a spawned thread | The new thread needs its own owned handle<br><span class="zh-inline">新线程必须拥有自己能带走的那份数据</span> | `let ctx = ctx.clone(); thread::spawn(move \|\| { ... })` |
| Returning owned data from `&self` | You cannot move a field out through a shared borrow<br><span class="zh-inline">拿着 `&self` 时，本来就不能把字段直接搬出去</span> | `self.name.clone()` |
| Small `Copy` data behind references | `.copied()` often expresses intent better than `.clone()`<br><span class="zh-inline">对于小型 `Copy` 类型，`.copied()` 往往更直接</span> | `opt.get(0).copied()` |

### Real example: `Arc::clone()` for thread sharing<br><span class="zh-inline">真实例子：线程共享里的 `Arc::clone()`</span>

```rust
// Example: workload.rs — Arc::clone is cheap (ref count bump)
let stop_flag = Arc::new(AtomicBool::new(false));
let stop_flag_clone = stop_flag.clone();   // ~1 ns, no data copied
let ctx_clone = ctx.clone();               // Clone context for move into thread

let sensor_handle = thread::spawn(move || {
    // ...uses stop_flag_clone and ctx_clone
});
```

这种 `clone()` 和复制一整块字符串、向量根本不是一回事。<br><span class="zh-inline">前者更像“多拿一个把手”，后者才是真把内容再造一份。</span>

### Checklist: Should I clone?<br><span class="zh-inline">动手 `clone()` 之前先过一遍这张清单</span>

1. **Can the API accept `&str` / `&T` instead of `String` / `T`?**<br><span class="zh-inline">接口能不能改成借用？能借用就先别复制。</span>
2. **Can the control flow be reorganized to avoid needing two owners at once?**<br><span class="zh-inline">作用域、调用顺序、变量生命周期能不能重新安排？</span>
3. **Is it `Arc::clone()` or `Rc::clone()`?**<br><span class="zh-inline">如果只是共享所有权的句柄复制，这通常问题不大。</span>
4. **Am I moving something into a thread or closure that must outlive the current scope?**<br><span class="zh-inline">如果确实要把值带进线程或闭包里，那复制可能就是必要成本。</span>
5. **Is this happening inside a hot loop?**<br><span class="zh-inline">如果在热点循环里疯狂 clone，那就该警觉了，必要时考虑借用或 `Cow<T>`。</span>

----

## `Cow<'a, T>`: Clone-on-Write<br><span class="zh-inline">`Cow<'a, T>`：能借就借，必须改时再复制</span>

`Cow` 全名是 Clone-on-Write。它是一个枚举，可以装“借来的值”或者“自己拥有的值”。这特别适合那种“大多数时候只需要透传，少数时候才要改动”的逻辑。<br><span class="zh-inline">换句话说，只有真的要改，才付出分配代价。</span>

### Why `Cow` exists<br><span class="zh-inline">为什么会有 `Cow`</span>

```rust
// Without Cow — you must choose: always borrow OR always clone
fn normalize(s: &str) -> String {          // Always allocates!
    if s.contains(' ') {
        s.replace(' ', "_")               // New String (allocation needed)
    } else {
        s.to_string()                     // Unnecessary allocation!
    }
}

// With Cow — borrow when unchanged, allocate only when modified
use std::borrow::Cow;

fn normalize(s: &str) -> Cow<'_, str> {
    if s.contains(' ') {
        Cow::Owned(s.replace(' ', "_"))    // Allocates (must modify)
    } else {
        Cow::Borrowed(s)                   // Zero allocation (passthrough)
    }
}
```

第一种写法里，不管输入有没有空格，都会产生一个新的 `String`。第二种写法里，只有真正发生替换时才分配。<br><span class="zh-inline">这就是 `Cow` 存在的全部意义：把“多数情况下不用复制”的场景抠出来。</span>

### How `Cow` works<br><span class="zh-inline">`Cow` 的工作方式</span>

```rust
use std::borrow::Cow;

// Cow<'a, str> is essentially:
// enum Cow<'a, str> {
//     Borrowed(&'a str),     // Zero-cost reference
//     Owned(String),          // Heap-allocated owned value
// }

fn greet(name: &str) -> Cow<'_, str> {
    if name.is_empty() {
        Cow::Borrowed("stranger")         // Static string — no allocation
    } else if name.starts_with(' ') {
        Cow::Owned(name.trim().to_string()) // Modified — allocation needed
    } else {
        Cow::Borrowed(name)               // Passthrough — no allocation
    }
}

fn main() {
    let g1 = greet("Alice");     // Cow::Borrowed("Alice")
    let g2 = greet("");          // Cow::Borrowed("stranger")
    let g3 = greet(" Bob ");     // Cow::Owned("Bob")
    
    // Cow<str> implements Deref<Target = str>, so you can use it as &str:
    println!("Hello, {g1}!");    // Works — Cow auto-derefs to &str
    println!("Hello, {g2}!");
    println!("Hello, {g3}!");
}
```

### Real-world use case: config value normalization<br><span class="zh-inline">真实用途：配置值标准化</span>

```rust
use std::borrow::Cow;

/// Normalize a SKU name: trim whitespace, lowercase.
/// Returns Cow::Borrowed if already normalized (zero allocation).
fn normalize_sku(sku: &str) -> Cow<'_, str> {
    let trimmed = sku.trim();
    if trimmed == sku && sku.chars().all(|c| c.is_lowercase() || !c.is_alphabetic()) {
        Cow::Borrowed(sku)   // Already normalized — no allocation
    } else {
        Cow::Owned(trimmed.to_lowercase())  // Needs modification — allocate
    }
}

fn main() {
    let s1 = normalize_sku("server-x1");   // Borrowed — zero alloc
    let s2 = normalize_sku("  Server-X1 "); // Owned — must allocate
    println!("{s1}, {s2}"); // "server-x1, server-x1"
}
```

### When to use `Cow`<br><span class="zh-inline">什么时候考虑 `Cow`</span>

| **Situation** | **Use `Cow`?** |
|--------------|---------------|
| Function returns input unchanged most of the time | ✅ Yes — avoid unnecessary copies<br><span class="zh-inline">多数情况原样返回时，非常适合</span> |
| Normalizing or lightly rewriting strings | ✅ Yes — often only some inputs need allocation<br><span class="zh-inline">像 trim、lowercase、replace 这类处理很常见</span> |
| Every code path allocates anyway | ❌ No — just return `String`<br><span class="zh-inline">如果分支怎么走都要分配，那 `Cow` 就纯属绕路</span> |
| Pure passthrough with no modification | ❌ No — just return `&str`<br><span class="zh-inline">只借不改时，老老实实返回借用就行</span> |
| Long-term storage inside a struct | ❌ Usually no — prefer owned `String`<br><span class="zh-inline">结构体长期保存数据时，通常还是拥有型更省事</span> |

> **C++ comparison:** `Cow<str>` 有点像“函数有时返回 `std::string_view`，有时返回 `std::string`”，但 Rust 把这层包装做成了一个统一可解引用的类型，用起来更顺。<br><span class="zh-inline">它的价值不在概念新鲜，而在于把“按需复制”变成了标准工具。</span>

----

## `Weak<T>`: Breaking Reference Cycles<br><span class="zh-inline">`Weak<T>`：打破引用环</span>

`Weak<T>` 是 Rust 里对应 C++ `std::weak_ptr<T>` 的东西。它指向 `Rc<T>` 或 `Arc<T>` 管理的对象，但本身不拥有对象，因此不会阻止对象被释放。<br><span class="zh-inline">如果底层值已经被释放，`upgrade()` 就会返回 `None`。</span>

### Why `Weak` exists<br><span class="zh-inline">为什么需要 `Weak`</span>

`Rc<T>` 和 `Arc<T>` 一旦形成环，就会出现“谁都等着对方先归零”的局面，最后谁也释放不了。`Weak<T>` 的职责就是把环里某些边变成“观察关系”，而不是“拥有关系”。<br><span class="zh-inline">树、图、观察者模式里这种情况尤其常见。</span>

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: String,
    parent: RefCell<Weak<Node>>,      // Weak — doesn't prevent parent from dropping
    children: RefCell<Vec<Rc<Node>>>,  // Strong — parent owns children
}

impl Node {
    fn new(value: &str) -> Rc<Node> {
        Rc::new(Node {
            value: value.to_string(),
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(Vec::new()),
        })
    }

    fn add_child(parent: &Rc<Node>, child: &Rc<Node>) {
        // Child gets a weak reference to parent (no cycle)
        *child.parent.borrow_mut() = Rc::downgrade(parent);
        // Parent gets a strong reference to child
        parent.children.borrow_mut().push(Rc::clone(child));
    }
}

fn main() {
    let root = Node::new("root");
    let child = Node::new("child");
    Node::add_child(&root, &child);

    // Access parent from child via upgrade()
    if let Some(parent) = child.parent.borrow().upgrade() {
        println!("Child's parent: {}", parent.value); // "root"
    }
    
    println!("Root strong count: {}", Rc::strong_count(&root));  // 1
    println!("Root weak count: {}", Rc::weak_count(&root));      // 1
}
```

### C++ comparison<br><span class="zh-inline">和 C++ 的对照</span>

```cpp
// C++ — weak_ptr to break shared_ptr cycle
struct Node {
    std::string value;
    std::weak_ptr<Node> parent;                  // Weak — no ownership
    std::vector<std::shared_ptr<Node>> children;  // Strong — owns children

    static auto create(const std::string& v) {
        return std::make_shared<Node>(Node{v, {}, {}});
    }
};

auto root = Node::create("root");
auto child = Node::create("child");
child->parent = root;          // weak_ptr assignment
root->children.push_back(child);

if (auto p = child->parent.lock()) {   // lock() → shared_ptr or null
    std::cout << "Parent: " << p->value << std::endl;
}
```

| C++ | Rust | Notes |
|-----|------|-------|
| `shared_ptr<T>` | `Rc<T>` single-thread, `Arc<T>` multi-thread | Shared ownership<br><span class="zh-inline">共享所有权</span> |
| `weak_ptr<T>` | `Weak<T>` via `Rc::downgrade()` / `Arc::downgrade()` | Non-owning back-reference<br><span class="zh-inline">不拥有对象的回指</span> |
| `weak_ptr::lock()` | `Weak::upgrade()` | Returns `None` if already dropped<br><span class="zh-inline">对象没了就返回 `None`</span> |
| `shared_ptr::use_count()` | `Rc::strong_count()` | Same idea<br><span class="zh-inline">语义基本一致</span> |

### When to use `Weak`<br><span class="zh-inline">什么时候该上 `Weak`</span>

| **Situation** | **Pattern** |
|--------------|-----------|
| Parent/child trees | Parent keeps `Rc<Child>`，child keeps `Weak<Parent>`<br><span class="zh-inline">父强子弱，别反过来</span> |
| Observer/event systems | Event source stores `Weak<Observer>`<br><span class="zh-inline">观察者可以自己消失，不会被事件源强行拖住</span> |
| Caches | `HashMap<Key, Weak<Value>>`<br><span class="zh-inline">缓存项可以自然过期</span> |
| Graphs with cross-links | Ownership edges strong, back-links weak<br><span class="zh-inline">拥有关系用强引用，回指关系用弱引用</span> |

> **Prefer the arena pattern** when possible. For many tree-like structures, `Vec<T>` plus indices is simpler, faster, and avoids all reference-counting overhead. Reach for `Rc` / `Weak` when lifetimes truly need to be dynamic and shared.<br><span class="zh-inline">**额外建议：** 新代码里如果结构其实能用 arena 模式表达，就优先用 `Vec<T>` 加索引。那种方式通常更简单、更快，也省掉引用计数的额外负担。</span>

----

## `Copy` vs `Clone`, `PartialEq` vs `Eq`<br><span class="zh-inline">`Copy` 与 `Clone`，`PartialEq` 与 `Eq`</span>

- **`Copy` roughly matches trivially copyable types in C++.** Simple integers, enums, or plain-old-data style structs can be duplicated by plain bit-copy, and assignment leaves both values usable.<br><span class="zh-inline">**`Copy` 大致对应 C++ 里那类“平凡可复制”的类型。** 赋值时直接按位拷贝，原值和新值都继续有效。</span>
- **`Clone` is closer to a user-defined copy constructor.** It may perform heap allocation or other custom logic, so Rust requires calling it explicitly.<br><span class="zh-inline">**`Clone` 更像显式的深拷贝。** 它可能需要重新分配堆内存，也可能跑别的逻辑，所以 Rust 不会偷偷替忙做。</span>
- The crucial difference from C++ is that Rust does not hide expensive copies behind `=`. Non-`Copy` types move by default, and explicit `.clone()` is the signal that cost is about to happen.<br><span class="zh-inline">Rust 最重要的一刀，就是把便宜复制和昂贵复制彻底分开，不让它们共用一套表面语法。</span>
- `PartialEq` 和 `Eq` 的关系也类似。前者表示“支持相等比较”，后者再进一步要求“自反性一定成立”，也就是 `a == a` 必须永远为真。<br><span class="zh-inline">浮点数因为 `NaN != NaN`，所以通常只能停在 `PartialEq`。</span>

### `Copy` vs `Clone`<br><span class="zh-inline">`Copy` 和 `Clone` 的区别</span>

| | **Copy** | **Clone** |
|---|---------|----------|
| **How it works** | Implicit bitwise copy<br><span class="zh-inline">隐式按位复制</span> | Explicit logic via `.clone()`<br><span class="zh-inline">显式调用自定义复制逻辑</span> |
| **When it happens** | On assignment<br><span class="zh-inline">赋值时自动发生</span> | Only when `.clone()` is called<br><span class="zh-inline">只有手调 `.clone()` 才发生</span> |
| **After operation** | Both values remain valid<br><span class="zh-inline">两边都继续有效</span> | Both values remain valid<br><span class="zh-inline">两边都继续有效</span> |
| **Without either** | Assignment moves the value<br><span class="zh-inline">没有 `Copy` 时，赋值默认是 move</span> | Same<br><span class="zh-inline">一样会 move</span> |
| **Allowed for** | Small non-owning types<br><span class="zh-inline">小型、非拥有资源的类型</span> | Any type<br><span class="zh-inline">几乎任意类型</span> |
| **C++ analogy** | POD / trivially copyable<br><span class="zh-inline">平凡可复制类型</span> | Custom copy constructor<br><span class="zh-inline">自定义拷贝构造</span> |

### Real example: `Copy` enums<br><span class="zh-inline">真实例子：可 `Copy` 的枚举</span>

```rust
// From fan_diag/src/sensor.rs — all unit variants, fits in 1 byte
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum FanStatus {
    #[default]
    Normal,
    Low,
    High,
    Missing,
    Failed,
    Unknown,
}

let status = FanStatus::Normal;
let copy = status;   // Implicit copy — status is still valid
println!("{:?} {:?}", status, copy);  // Both work
```

### Real example: `Copy` enum with payloads<br><span class="zh-inline">真实例子：带整数载荷的 `Copy` 枚举</span>

```rust
// Example: healthcheck.rs — u32 payloads are Copy, so the whole enum is too
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HealthcheckStatus {
    Pass,
    ProgramError(u32),
    DmesgError(u32),
    RasError(u32),
    OtherError(u32),
    Unknown,
}
```

### Real example: `Clone` only<br><span class="zh-inline">真实例子：只能 `Clone`，不能 `Copy`</span>

```rust
// Example: components.rs — String prevents Copy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FruData {
    pub technology: DeviceTechnology,
    pub physical_location: String,      // ← String: heap-allocated, can't Copy
    pub expected: bool,
    pub removable: bool,
}
// let a = fru_data;   → MOVES (a is gone)
// let a = fru_data.clone();  → CLONES (fru_data still valid, new heap allocation)
```

### Rule of thumb: can it be `Copy`?<br><span class="zh-inline">经验判断：这个类型能不能做成 `Copy`</span>

```text
Does the type contain String, Vec, Box, HashMap,
Rc, Arc, or any other heap-owning type?
    YES → Clone only (cannot be Copy)
    NO  → You CAN derive Copy (and usually should if the type is small)
```

### `PartialEq` vs `Eq`<br><span class="zh-inline">`PartialEq` 和 `Eq` 的区别</span>

| | **PartialEq** | **Eq** |
|---|--------------|-------|
| **What it gives you** | `==` and `!=`<br><span class="zh-inline">支持相等比较</span> | Marker for reflexive equality<br><span class="zh-inline">额外保证自反性</span> |
| **Is `a == a` guaranteed?** | Not always<br><span class="zh-inline">不一定</span> | Yes<br><span class="zh-inline">必须成立</span> |
| **Why it matters** | Floats break reflexivity via `NaN`<br><span class="zh-inline">浮点数遇到 `NaN` 会出问题</span> | Required by things like `HashMap` keys<br><span class="zh-inline">像 `HashMap` 键这类场景通常需要它</span> |
| **When to derive** | Almost always<br><span class="zh-inline">大多数类型都能有</span> | When there are no `f32` / `f64` fields<br><span class="zh-inline">没有浮点字段时通常可以加上</span> |
| **C++ analogy** | `operator==`<br><span class="zh-inline">只有相等运算的表面能力</span> | No direct checked equivalent<br><span class="zh-inline">C++ 没把这层语义单独拆出来检查</span> |

### Real example: `Eq` for hash keys<br><span class="zh-inline">真实例子：当 `HashMap` 键时需要 `Eq`</span>

```rust
// From hms_trap/src/cpu_handler.rs — Hash requires Eq
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CpuFaultType {
    InvalidFaultType,
    CpuCperFatalErr,
    CpuLpddr5UceErr,
    CpuC2CUceFatalErr,
    // ...
}
// Used as: HashMap<CpuFaultType, FaultHandler>
// HashMap keys must be Eq + Hash — PartialEq alone won't compile
```

### Real example: no `Eq` for `f32` fields<br><span class="zh-inline">真实例子：带 `f32` 的类型不能推 `Eq`</span>

```rust
// Example: types.rs — f32 prevents Eq
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TemperatureSensors {
    pub warning_threshold: Option<f32>,   // ← f32 has NaN ≠ NaN
    pub critical_threshold: Option<f32>,  // ← can't derive Eq
    pub sensor_names: Vec<String>,
}
// Cannot be used as HashMap key. Cannot derive Eq.
// Because: f32::NAN == f32::NAN is false, violating reflexivity.
```

### `PartialOrd` vs `Ord`<br><span class="zh-inline">`PartialOrd` 和 `Ord`</span>

| | **PartialOrd** | **Ord** |
|---|---------------|--------|
| **What it gives you** | `<`, `>`, `<=`, `>=`<br><span class="zh-inline">比较运算</span> | Total ordering for sorting / ordered maps<br><span class="zh-inline">全序关系，可用于排序和有序映射</span> |
| **Total ordering?** | No<br><span class="zh-inline">不一定是全序</span> | Yes<br><span class="zh-inline">必须是全序</span> |
| **f32/f64?** | Usually only `PartialOrd`<br><span class="zh-inline">浮点通常只能停在这里</span> | Cannot derive `Ord`<br><span class="zh-inline">浮点没法直接做总序</span> |

### Real example: ordered severity levels<br><span class="zh-inline">真实例子：可排序的严重等级</span>

```rust
// From hms_trap/src/fault.rs — variant order defines severity
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum FaultSeverity {
    Info,      // lowest  (discriminant 0)
    Warning,   //         (discriminant 1)
    Error,     //         (discriminant 2)
    Critical,  // highest (discriminant 3)
}
// FaultSeverity::Info < FaultSeverity::Critical → true
// Enables: if severity >= FaultSeverity::Error { escalate(); }
```

### Real example: ordered diagnostic levels<br><span class="zh-inline">真实例子：可排序的诊断等级</span>

```rust
// Example: orchestration.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default)]
pub enum GpuDiagLevel {
    #[default]
    Quick,     // lowest
    Standard,
    Extended,
    Full,      // highest
}
// Enables: if requested_level >= GpuDiagLevel::Extended { run_extended_tests(); }
```

### Derive decision tree<br><span class="zh-inline">派生决策树</span>

```text
                        Your new type
                            │
                   Contains String/Vec/Box?
                      /              \
                    YES                NO
                     │                  │
              Clone only          Clone + Copy
                     │                  │
              Contains f32/f64?    Contains f32/f64?
                /          \         /          \
              YES           NO     YES           NO
               │             │      │             │
         PartialEq       PartialEq  PartialEq  PartialEq
         only            + Eq       only       + Eq
                          │                      │
                    Need sorting?           Need sorting?
                      /       \               /       \
                    YES        NO            YES        NO
                     │          │              │          │
               PartialOrd    Done        PartialOrd    Done
               + Ord                     + Ord
                     │                        │
               Need as                  Need as
               map key?                 map key?
                  │                        │
                + Hash                   + Hash
```

### Quick reference: common derive combos<br><span class="zh-inline">速查：生产代码里常见的派生组合</span>

| **Type category** | **Typical derive** | **Example** |
|-------------------|--------------------|------------|
| Simple status enum | `Copy, Clone, PartialEq, Eq, Default` | `FanStatus` |
| Enum used as `HashMap` key | `Copy, Clone, PartialEq, Eq, Hash` | `CpuFaultType`, `SelComponent` |
| Sortable severity enum | `Copy, Clone, PartialEq, Eq, PartialOrd, Ord` | `FaultSeverity`, `GpuDiagLevel` |
| Data struct with `String` fields | `Clone, Debug, Serialize, Deserialize` | `FruData`, `OverallSummary` |
| Serializable config | `Clone, Debug, Default, Serialize, Deserialize` | `DiagConfig` |

----
