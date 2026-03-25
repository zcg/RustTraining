## C++ → Rust Semantic Deep Dives<br><span class="zh-inline">C++ → Rust 语义深潜</span>

> **What you'll learn:** Detailed mappings for C++ concepts that do not have obvious Rust equivalents — the four named casts, SFINAE vs trait bounds, CRTP vs associated types, and other places where translation work often gets sticky.<br><span class="zh-inline">**本章将学到什么：** 那些在 C++ 里很常见、但在 Rust 里没有明显一一对应物的概念，到底应该怎么映射，包括四种具名 cast、SFINAE 与 trait bound、CRTP 与关联类型，以及其他迁移时很容易卡壳的地方。</span>

The sections below focus on exactly those C++ concepts that tend to trip people during translation work because there is no clean 1:1 substitution.<br><span class="zh-inline">下面这些内容，专门挑的就是那种“看着好像能类比，但真翻译时总感觉哪不对劲”的 C++ 概念。很多迁移工作卡壳，恰恰就卡在这些细语义上。</span>

### Casting Hierarchy: Four C++ Casts → Rust Equivalents<br><span class="zh-inline">cast 体系：C++ 四种具名转换在 Rust 里的对应物</span>

C++ has four named casts. Rust does not mirror that hierarchy directly; instead, it splits the job into several more explicit mechanisms.<br><span class="zh-inline">C++ 有四种大家都背过的具名 cast。Rust 没有把这套层级照搬过来，而是把这些用途拆散，交给几种更明确的机制分别处理。</span>

```cpp
// C++ casting hierarchy
int i = static_cast<int>(3.14);            // 1. Numeric / up-cast
Derived* d = dynamic_cast<Derived*>(base); // 2. Runtime downcasting
int* p = const_cast<int*>(cp);              // 3. Cast away const
auto* raw = reinterpret_cast<char*>(&obj); // 4. Bit-level reinterpretation
```

| C++ Cast | Rust Equivalent | Safety | Notes |
|----------|----------------|--------|-------|
| `static_cast` numeric | `as` keyword | Usually safe but may truncate or wrap<br><span class="zh-inline">常能用，但可能截断或绕回</span> | `let i = 3.14_f64 as i32;` truncates to `3` |
| `static_cast` widening numeric | `From` / `Into` | Safe and explicit<br><span class="zh-inline">安全、语义更明确</span> | `let i: i32 = 42_u8.into();` |
| `static_cast` fallible numeric | `TryFrom` / `TryInto` | Safe, returns `Result`<br><span class="zh-inline">可能失败，就显式返回结果</span> | `let i: u8 = 300_u16.try_into()?;` |
| `dynamic_cast` downcast | Enum `match` or `Any::downcast_ref` | Safe | Prefer enums when the variant set is closed<br><span class="zh-inline">闭集场景优先枚举匹配</span> |
| `const_cast` | No direct equivalent | — | Use `Cell` / `RefCell` for interior mutability instead<br><span class="zh-inline">内部可变性才是正路</span> |
| `reinterpret_cast` | `std::mem::transmute` | **`unsafe`** | Usually the wrong first choice<br><span class="zh-inline">通常先该找更安全的替代法</span> |

```rust
// Rust equivalents:

// 1. Numeric casts — prefer From/Into over `as`
let widened: u32 = 42_u8.into();             // Infallible widening — always prefer
let truncated = 300_u16 as u8;                // ⚠ Wraps to 44! Silent data loss
let checked: Result<u8, _> = 300_u16.try_into(); // Err — safe fallible conversion

// 2. Downcast: enum (preferred) or Any (when needed for type erasure)
use std::any::Any;

fn handle_any(val: &dyn Any) {
    if let Some(s) = val.downcast_ref::<String>() {
        println!("Got string: {s}");
    } else if let Some(n) = val.downcast_ref::<i32>() {
        println!("Got int: {n}");
    }
}

// 3. "const_cast" → interior mutability (no unsafe needed)
use std::cell::Cell;
struct Sensor {
    read_count: Cell<u32>,  // Mutate through &self
}
impl Sensor {
    fn read(&self) -> f64 {
        self.read_count.set(self.read_count.get() + 1); // &self, not &mut self
        42.0
    }
}

// 4. reinterpret_cast → transmute (almost never needed)
// Prefer safe alternatives:
let bytes: [u8; 4] = 0x12345678_u32.to_ne_bytes();  // ✅ Safe
let val = u32::from_ne_bytes(bytes);                   // ✅ Safe
// unsafe { std::mem::transmute::<u32, [u8; 4]>(val) } // ❌ Avoid
```

> **Guideline:** In idiomatic Rust, `as` should be used sparingly, `From` / `Into` should handle safe widening, `TryFrom` / `TryInto` should handle narrowing, `transmute` should be treated as exceptional, and `const_cast` simply does not exist as a normal tool.<br><span class="zh-inline">**经验建议：** 惯用 Rust 里，`as` 应该尽量少用；安全放宽靠 `From` / `Into`，可能失败的缩窄靠 `TryFrom` / `TryInto`，`transmute` 则属于非常规武器。至于 `const_cast`，Rust 干脆就没给它留正常入口。</span>

---

### `std::function` → Function Pointers, `impl Fn`, and `Box<dyn Fn>`<br><span class="zh-inline">`std::function` → 函数指针、`impl Fn` 与 `Box<dyn Fn>`</span>

C++ `std::function<R(Args...)>` is a type-erased callable wrapper. Rust splits that space into several options with different trade-offs.<br><span class="zh-inline">C++ 里的 `std::function<R(Args...)>` 属于类型擦除后的可调用对象包装器。Rust 没用一个东西把所有需求全吃掉，而是拆成了几种不同方案，各有代价和适用面。</span>

```cpp
// C++: one-size-fits-all (heap-allocated, type-erased)
#include <functional>
std::function<int(int)> make_adder(int n) {
    return [n](int x) { return x + n; };
}
```

```rust
// Rust Option 1: fn pointer — simple, no captures, no allocation
fn add_one(x: i32) -> i32 { x + 1 }
let f: fn(i32) -> i32 = add_one;
println!("{}", f(5)); // 6

// Rust Option 2: impl Fn — monomorphized, zero overhead, can capture
fn apply(val: i32, f: impl Fn(i32) -> i32) -> i32 { f(val) }
let n = 10;
let result = apply(5, |x| x + n);  // Closure captures `n`

// Rust Option 3: Box<dyn Fn> — type-erased, heap-allocated (like std::function)
fn make_adder(n: i32) -> Box<dyn Fn(i32) -> i32> {
    Box::new(move |x| x + n)
}
let adder = make_adder(10);
println!("{}", adder(5));  // 15

// Storing heterogeneous callables (like vector<function<int(int)>>):
let callbacks: Vec<Box<dyn Fn(i32) -> i32>> = vec![
    Box::new(|x| x + 1),
    Box::new(|x| x * 2),
    Box::new(make_adder(100)),
];
for cb in &callbacks {
    println!("{}", cb(5));  // 6, 10, 105
}
```

| When to use | C++ Equivalent | Rust Choice |
|------------|---------------|-------------|
| Top-level function, no captures | Function pointer | `fn(Args) -> Ret` |
| Generic callable parameter | Template parameter | `impl Fn(Args) -> Ret` |
| Generic trait bound form | `template<typename F>` | `F: Fn(Args) -> Ret` |
| Stored type-erased callable | `std::function<R(Args)>` | `Box<dyn Fn(Args) -> Ret>` |
| Mutable callback | Mutable lambda in `std::function` | `Box<dyn FnMut(Args) -> Ret>` |
| One-shot consumed callback | Moved callable | `Box<dyn FnOnce(Args) -> Ret>` |

> **Performance note:** `impl Fn` is the zero-overhead choice because it monomorphizes like a C++ template. `Box<dyn Fn>` carries the same general class of overhead as `std::function`: indirection plus heap allocation.<br><span class="zh-inline">**性能提醒：** `impl Fn` 基本就是零额外开销路线，和模板实例化很像；`Box<dyn Fn>` 则和 `std::function` 一样，要付出堆分配和动态分发成本。</span>

---

### Container Mapping: C++ STL → Rust `std::collections`<br><span class="zh-inline">容器映射：C++ STL → Rust `std::collections`</span>

| C++ STL Container | Rust Equivalent | Notes |
|------------------|----------------|-------|
| `std::vector<T>` | `Vec<T>` | APIs are very close; Rust bounds-checks by default |
| `std::array<T, N>` | `[T; N]` | Fixed-size stack array |
| `std::deque<T>` | `VecDeque<T>` | Ring buffer, efficient at both ends |
| `std::list<T>` | `LinkedList<T>` | Rarely preferred in Rust |
| `std::forward_list<T>` | No std equivalent | Usually `Vec` or `VecDeque` instead |
| `std::unordered_map<K, V>` | `HashMap<K, V>` | Type bounds on keys are explicit |
| `std::map<K, V>` | `BTreeMap<K, V>` | Ordered map |
| `std::unordered_set<T>` | `HashSet<T>` | Requires `Hash + Eq` |
| `std::set<T>` | `BTreeSet<T>` | Requires `Ord` |
| `std::priority_queue<T>` | `BinaryHeap<T>` | Max-heap by default |
| `std::stack<T>` | `Vec<T>` | Usually no dedicated stack type needed |
| `std::queue<T>` | `VecDeque<T>` | Queue patterns map naturally here |
| `std::string` | `String` | UTF-8, owned |
| `std::string_view` | `&str` | Borrowed UTF-8 slice |
| `std::span<T>` | `&[T]` / `&mut [T]` | Slices are first-class in Rust |
| `std::tuple<A, B, C>` | `(A, B, C)` | Native syntax |
| `std::pair<A, B>` | `(A, B)` | Just a two-element tuple |
| `std::bitset<N>` | No std equivalent | Use crates like `bitvec` if needed |

**Key differences:**<br><span class="zh-inline">**需要特别记住的差异：**</span>

- `HashMap` and `HashSet` state key requirements explicitly through traits like `Hash` and `Eq`.<br><span class="zh-inline">`HashMap` 和 `HashSet` 会把键类型要求通过 trait 显式写出来，不会等到模板深处才炸一大片错误。</span>
- `Vec` indexing with `v[i]` panics on out-of-bounds. Use `.get(i)` when absence should be handled explicitly.<br><span class="zh-inline">`Vec` 的 `v[i]` 越界会 panic。只要下标不百分百可信，就优先 `.get(i)`。</span>
- There is no built-in `multimap` / `multiset`; build those patterns with maps to vectors or similar structures.<br><span class="zh-inline">标准库里没有现成 `multimap` / `multiset`，通常用 `HashMap<K, Vec<V>>` 这种方式自己拼出来。</span>

---

### Exception Safety → Panic Safety<br><span class="zh-inline">异常安全 → panic 安全</span>

C++ exception safety is often explained with the no-throw / strong / basic guarantee ladder. Rust's ownership model changes the conversation quite a bit.<br><span class="zh-inline">C++ 里讲异常安全，常会提 no-throw、strong、basic 这三档保证。Rust 因为错误处理和所有权模型不一样，这个话题会换一种面貌出现。</span>

| C++ Level | Meaning | Rust Equivalent |
|----------|---------|----------------|
| **No-throw** | Function never throws | Return `Result` and avoid panic for routine errors |
| **Strong** | Commit-or-rollback | Often comes naturally from ownership and early-return |
| **Basic** | Invariants preserved, resources cleaned up | Rust's default cleanup model via `Drop` |

#### How Rust ownership helps<br><span class="zh-inline">Rust 所有权为什么会帮上忙</span>

```rust
// Strong guarantee for free — if file.write() fails, config is unchanged
fn update_config(config: &mut Config, path: &str) -> Result<(), Error> {
    let new_data = fetch_from_network()?; // Err → early return, config untouched
    let validated = validate(new_data)?;   // Err → early return, config untouched
    *config = validated;                   // Only reached on success (commit)
    Ok(())
}
```

In C++, achieving this strong guarantee often means manual rollback logic or copy-and-swap patterns. In Rust, `?` plus ownership frequently gives the same outcome almost for free.<br><span class="zh-inline">在 C++ 里，这种强保证往往要靠手写回滚逻辑或者 copy-and-swap。Rust 这边用 `?` 配合所有权，经常天然就站到类似结果上了。</span>

#### `catch_unwind` — the rough analogue of `catch(...)`<br><span class="zh-inline">`catch_unwind`：大致对应 `catch(...)`</span>

```rust
use std::panic;

// Catch a panic (like catch(...) in C++) — rarely needed
let result = panic::catch_unwind(|| {
    // Code that might panic
    let v = vec![1, 2, 3];
    v[10]  // Panics! (index out of bounds)
});

match result {
    Ok(val) => println!("Got: {val}"),
    Err(_) => eprintln!("Caught a panic — cleaned up"),
}
```

#### `UnwindSafe` — marking panic-safe captures<br><span class="zh-inline">`UnwindSafe`：描述 unwind 过程中是否安全</span>

```rust
use std::panic::UnwindSafe;

// Types behind &mut are NOT UnwindSafe by default — the panic may have
// left them in a partially-modified state
fn safe_execute<F: FnOnce() + UnwindSafe>(f: F) {
    let _ = std::panic::catch_unwind(f);
}

// Use AssertUnwindSafe to override when you've audited the code:
use std::panic::AssertUnwindSafe;
let mut data = vec![1, 2, 3];
let _ = std::panic::catch_unwind(AssertUnwindSafe(|| {
    data.push(4);
}));
```

| C++ Exception Pattern | Rust Equivalent |
|-----------------------|-----------------|
| `throw MyException()` | `Err(MyError::...)` or occasionally `panic!()` |
| `try { } catch (const E& e)` | `match result` or `?` propagation |
| `catch (...)` | `std::panic::catch_unwind(...)` |
| `noexcept` | Returning `Result<T, E>` for routine errors |
| RAII cleanup during unwinding | `Drop::drop()` during panic unwind |
| `std::uncaught_exceptions()` | `std::thread::panicking()` |
| `-fno-exceptions` | `panic = "abort"` in Cargo profile |

> **Bottom line:** Most Rust code uses `Result<T, E>` instead of exceptions for routine failure. `panic!` is for bugs and broken invariants, not for ordinary control flow. That alone removes a huge amount of classic exception-safety anxiety.<br><span class="zh-inline">**一句话概括：** Rust 把日常失败交给 `Result<T, E>`，把 `panic!` 留给 bug 和不变量损坏。这一下就把很多传统“异常安全焦虑”直接压下去了。</span>

---

## C++ to Rust Migration Patterns<br><span class="zh-inline">C++ 到 Rust 的迁移模式</span>

### Quick Reference: C++ → Rust Idiom Map<br><span class="zh-inline">速查：C++ 惯用法到 Rust 惯用法</span>

| **C++ Pattern** | **Rust Idiom** | **Notes** |
|----------------|---------------|----------|
| `class Derived : public Base` | `enum Variant { A {...}, B {...} }` | Closed sets often want enums |
| `virtual void method() = 0` | `trait MyTrait { fn method(&self); }` | Open extension points map to traits |
| `dynamic_cast<Derived*>(ptr)` | `match` on enum or explicit downcast | Prefer exhaustive enum matches when possible |
| `vector<unique_ptr<Base>>` | `Vec<Box<dyn Trait>>` | Use only when true runtime polymorphism is needed |
| `shared_ptr<T>` | `Rc<T>` or `Arc<T>` | But prefer plain ownership first |
| `enable_shared_from_this<T>` | Arena pattern like `Vec<T>` + indices | Often simpler and cycle-free |
| Stored framework base pointers everywhere | Pass a context parameter | Avoid ambient pointer tangles |
| `try { } catch (...) { }` | `match` on `Result` or `?` | Errors stay explicit |
| `std::optional<T>` | `Option<T>` | Exhaustive handling required |
| `const std::string&` parameter | `&str` parameter | Accepts both `String` and `&str` naturally |
| `enum class Foo { A, B, C }` | `enum Foo { A, B, C }` | Rust enums can also carry data |
| `auto x = std::move(obj)` | `let x = obj;` | Move is already the default |
| CMake + make + extra lint wiring | `cargo build / test / clippy / fmt` | Tooling tends to be more unified |

### Migration Strategy<br><span class="zh-inline">迁移策略</span>

1. **Start with data types.** Translate structs and enums first, because that forces ownership questions into the open early.<br><span class="zh-inline">**先从数据类型下手。** 先翻结构体和枚举，所有权问题会被尽早逼出来。</span>
2. **Turn factories into enums when the variant set is closed.** Many class hierarchies are really just tagged unions wearing a tuxedo.<br><span class="zh-inline">**变体集合固定时，优先把工厂模式改成枚举。** 很多看似威风的类层次，扒开一看其实就是带标签联合体。</span>
3. **Break god objects into focused structs.** Rust usually rewards smaller, more explicit responsibility boundaries.<br><span class="zh-inline">**把上帝对象拆掉。** Rust 更偏爱职责明确的小结构，而不是一个对象什么都挂。</span>
4. **Replace stored pointers with borrows or explicit handles.** Long-lived raw pointer graphs are usually a smell when moving into Rust.<br><span class="zh-inline">**把到处乱存的指针换成借用或显式句柄。** 一大堆长生命周期裸指针图，迁到 Rust 时往往就是味道最重的地方。</span>
5. **Use `Box<dyn Trait>` sparingly.** It is valuable, but it should not become the knee-jerk replacement for every base-class pointer.<br><span class="zh-inline">**`Box<dyn Trait>` 要节制用。** 它当然有用，但别把每个基类指针都条件反射地翻成它。</span>
6. **Let the compiler participate.** Rust's errors are often part of the design process, not just complaints after the fact.<br><span class="zh-inline">**让编译器参与设计。** Rust 报错很多时候不是单纯挑刺，而是在把设计问题提前暴露出来。</span>

### Header Files and `#include` → Modules and `use`<br><span class="zh-inline">头文件与 `#include` → 模块与 `use`</span>

The C++ compilation model revolves around textual inclusion. Rust has no header files, no forward declarations, and no include guards in that style.<br><span class="zh-inline">C++ 的编译模型核心是文本包含。Rust 则完全不是这条思路：没有头文件，没有前置声明，也不用靠 include guard 保命。</span>

```cpp
// widget.h — every translation unit that uses Widget includes this
#pragma once
#include <string>
#include <vector>

class Widget {
public:
    Widget(std::string name);
    void activate();
private:
    std::string name_;
    std::vector<int> data_;
};
```

```cpp
// widget.cpp — separate definition
#include "widget.h"
Widget::Widget(std::string name) : name_(std::move(name)) {}
void Widget::activate() { /* ... */ }
```

```rust
// src/widget.rs — declaration AND definition in one file
pub struct Widget {
    name: String,         // Private by default
    data: Vec<i32>,
}

impl Widget {
    pub fn new(name: String) -> Self {
        Widget { name, data: Vec::new() }
    }
    pub fn activate(&self) { /* ... */ }
}
```

```rust
// src/main.rs — import by module path
mod widget;  // Tells compiler to include src/widget.rs
use widget::Widget;

fn main() {
    let w = Widget::new("sensor".to_string());
    w.activate();
}
```

| C++ | Rust | Why it is better |
|-----|------|------------------|
| `#include "foo.h"` | `mod foo;` plus `use foo::Item;` | No textual inclusion, less duplication |
| `#pragma once` | Not needed | Each module is compiled once |
| Forward declarations | Not needed | The compiler sees the crate structure directly |
| `.h` + `.cpp` split | One `.rs` file is often enough | Declaration and definition cannot drift apart |
| `using namespace std;` | `use std::collections::HashMap;` | Imports stay explicit |
| Nested namespaces | Nested `mod` tree | File system and module tree line up naturally |

---

### `friend` and Access Control → Module Visibility<br><span class="zh-inline">`friend` 与访问控制 → 模块可见性</span>

C++ uses `friend` for selective access to private members. Rust does not have a `friend` keyword; instead, privacy is defined at the module level.<br><span class="zh-inline">C++ 里常用 `friend` 给特定类或函数开后门。Rust 压根没有这个关键字，它把访问控制的核心单位换成了模块。</span>

```cpp
// C++
class Engine {
    friend class Car;   // Car can access private members
    int rpm_;
    void set_rpm(int r) { rpm_ = r; }
public:
    int rpm() const { return rpm_; }
};
```

```rust
// Rust — items in the same module can access all fields, no `friend` needed
mod vehicle {
    pub struct Engine {
        rpm: u32,  // Private to the module (not to the struct!)
    }

    impl Engine {
        pub fn new() -> Self { Engine { rpm: 0 } }
        pub fn rpm(&self) -> u32 { self.rpm }
    }

    pub struct Car {
        engine: Engine,
    }

    impl Car {
        pub fn new() -> Self { Car { engine: Engine::new() } }
        pub fn accelerate(&mut self) {
            self.engine.rpm = 3000; // ✅ Same module — direct field access
        }
        pub fn rpm(&self) -> u32 {
            self.engine.rpm  // ✅ Same module — can read private field
        }
    }
}

fn main() {
    let mut car = vehicle::Car::new();
    car.accelerate();
    // car.engine.rpm = 9000;  // ❌ Compile error: `engine` is private
    println!("RPM: {}", car.rpm()); // ✅ Public method on Car
}
```

| C++ Access | Rust Equivalent | Scope |
|-----------|----------------|-------|
| `private` | Default visibility | Accessible inside the same module only<br><span class="zh-inline">模块内可见</span> |
| `protected` | No direct equivalent | `pub(super)` sometimes covers related needs |
| `public` | `pub` | Visible everywhere |
| `friend class Foo` | Put `Foo` in the same module | Module privacy replaces friend |
| — | `pub(crate)` | Visible inside the current crate only |
| — | `pub(super)` | Visible to the parent module |
| — | `pub(in crate::path)` | Visible to a chosen module subtree |

> **Key insight:** C++ privacy is per-class; Rust privacy is per-module. Once that switch flips in your head, a lot of Rust API layout starts to make much more sense.<br><span class="zh-inline">**关键认知：** C++ 的私有性是“按类划分”，Rust 的私有性是“按模块划分”。脑子里这个开关一旦切过来，很多 Rust API 设计就顺眼多了。</span>

---

### `volatile` → Atomics and `read_volatile` / `write_volatile`<br><span class="zh-inline">`volatile` → 原子类型与显式 volatile 读写</span>

In C++, `volatile` often means “do not optimize this away,” especially for MMIO. Rust intentionally has no `volatile` keyword and instead forces explicit operations.<br><span class="zh-inline">在 C++ 里，`volatile` 经常被拿来表示“别把这次读写优化掉”，尤其是在 MMIO 里。Rust 则故意不提供这个关键字，而是要求显式调用对应操作。</span>

```cpp
// C++: volatile for hardware registers
volatile uint32_t* const GPIO_REG = reinterpret_cast<volatile uint32_t*>(0x4002'0000);
*GPIO_REG = 0x01;              // Write not optimized away
uint32_t val = *GPIO_REG;     // Read not optimized away
```

```rust
// Rust: explicit volatile operations — only in unsafe code
use std::ptr;

const GPIO_REG: *mut u32 = 0x4002_0000 as *mut u32;

unsafe {
    ptr::write_volatile(GPIO_REG, 0x01);   // Write not optimized away
    let val = ptr::read_volatile(GPIO_REG); // Read not optimized away
}
```

For concurrent shared state, Rust uses atomics. In truth, modern C++ should too; `volatile` is not the right tool for thread synchronization there either.<br><span class="zh-inline">至于并发共享状态，Rust 用的是原子类型。说白了，现代 C++ 也应该这么干，`volatile` 本来就不是拿来做线程同步的。</span>

```cpp
// C++: volatile is NOT sufficient for thread safety (common mistake!)
volatile bool stop_flag = false;  // ❌ Data race — UB in C++11+

// Correct C++:
std::atomic<bool> stop_flag{false};
```

```rust
// Rust: atomics are the only way to share mutable state across threads
use std::sync::atomic::{AtomicBool, Ordering};

static STOP_FLAG: AtomicBool = AtomicBool::new(false);

// From another thread:
STOP_FLAG.store(true, Ordering::Release);

// Check:
if STOP_FLAG.load(Ordering::Acquire) {
    println!("Stopping");
}
```

| C++ Usage | Rust Equivalent | Notes |
|-----------|----------------|-------|
| `volatile` for MMIO | `ptr::read_volatile` / `ptr::write_volatile` | Explicit and usually `unsafe` |
| `volatile` for thread signaling | `AtomicBool`, `AtomicU32`, etc. | Same fix C++ should also use |
| `std::atomic<T>` | `std::sync::atomic::AtomicT` | Conceptually 1:1 |
| `memory_order_acquire` | `Ordering::Acquire` | Same memory ordering idea |

---

### `static` Variables → `static`, `const`, `LazyLock`, `OnceLock`<br><span class="zh-inline">静态变量 → `static`、`const`、`LazyLock`、`OnceLock`</span>

#### Basic `static` and `const`<br><span class="zh-inline">基础版 `static` 与 `const`</span>

```cpp
// C++
const int MAX_RETRIES = 5;                    // Compile-time constant
static std::string CONFIG_PATH = "/etc/app";  // Static init — order undefined!
```

```rust
// Rust
const MAX_RETRIES: u32 = 5;                   // Compile-time constant, inlined
static CONFIG_PATH: &str = "/etc/app";         // 'static lifetime, fixed address
```

#### The static initialization order fiasco<br><span class="zh-inline">静态初始化顺序灾难</span>

C++ has the classic problem that global constructors across translation units run in unspecified order. Rust avoids that whole category for plain statics because `static` values must be const-initialized.<br><span class="zh-inline">C++ 里最招人烦的老问题之一，就是不同翻译单元的全局构造顺序不确定。Rust 对普通 `static` 直接卡死成 const 初始化，于是这类问题能少掉一大截。</span>

For runtime-initialized globals, use `LazyLock` or `OnceLock`.<br><span class="zh-inline">如果确实需要运行时初始化的全局对象，就上 `LazyLock` 或 `OnceLock`。</span>

```rust
use std::sync::LazyLock;

// Equivalent to C++ `static std::regex` — initialized on first access, thread-safe
static CONFIG_REGEX: LazyLock<regex::Regex> = LazyLock::new(|| {
    regex::Regex::new(r"^[a-z]+_diag$").expect("invalid regex")
});

fn is_valid_diag(name: &str) -> bool {
    CONFIG_REGEX.is_match(name)  // First call initializes; subsequent calls are fast
}
```

```rust
use std::sync::OnceLock;

// OnceLock: initialized once, can be set from runtime data
static DB_CONN: OnceLock<String> = OnceLock::new();

fn init_db(connection_string: &str) {
    DB_CONN.set(connection_string.to_string())
        .expect("DB_CONN already initialized");
}

fn get_db() -> &'static str {
    DB_CONN.get().expect("DB not initialized")
}
```

| C++ | Rust | Notes |
|-----|------|-------|
| `const int X = 5;` | `const X: i32 = 5;` | Both are compile-time constants |
| `constexpr int X = 5;` | `const X: i32 = 5;` | Rust `const` is already constexpr-like |
| File-scope `static int` | `static` plus atomics or other safe wrappers | Mutable global state is handled more carefully |
| `static std::string s = "hi";` | `static S: &str = "hi";` or `LazyLock<String>` | Pick the simpler form when possible |
| Complex global object | `LazyLock<T>` | Avoids init-order issues |
| `thread_local` | `thread_local!` | Same high-level purpose |

---

### `constexpr` → `const fn`<br><span class="zh-inline">`constexpr` → `const fn`</span>

C++ `constexpr` marks things for compile-time evaluation. Rust's equivalent is the combination of `const` and `const fn`.<br><span class="zh-inline">C++ 里 `constexpr` 负责标记编译期求值能力；Rust 这边对应的是 `const` 加 `const fn` 这套组合。</span>

```cpp
// C++
constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
constexpr int val = factorial(5);  // Computed at compile time → 120
```

```rust
// Rust
const fn factorial(n: u32) -> u32 {
    if n <= 1 { 1 } else { n * factorial(n - 1) }
}
const VAL: u32 = factorial(5);  // Computed at compile time → 120

// Also works in array sizes and match patterns:
const LOOKUP: [u32; 5] = [factorial(1), factorial(2), factorial(3),
                           factorial(4), factorial(5)];
```

| C++ | Rust | Notes |
|-----|------|-------|
| `constexpr int f()` | `const fn f() -> i32` | Same intent |
| `constexpr` variable | `const` variable | Both compile-time |
| `consteval` | No direct equivalent | Rust does not split this out the same way |
| `if constexpr` | No direct equivalent | Often replaced by traits, generics, or `cfg` |
| `constinit` | `static` with const initializer | Rust already expects const init for statics |

> **Current limitations of `const fn`:** not every ordinary operation is allowed in const context yet, although the boundary keeps moving as Rust evolves.<br><span class="zh-inline">**`const fn` 的现实限制：** 它还不是“什么普通代码都能塞进去”的状态，不过可用范围一直在扩张，别拿很老的印象去判断它。</span>

---

### SFINAE and `enable_if` → Trait Bounds and `where` Clauses<br><span class="zh-inline">SFINAE 与 `enable_if` → trait bound 与 `where` 子句</span>

In C++, SFINAE powers conditional template programming, but readability is often terrible. Rust replaces the whole pattern with trait bounds.<br><span class="zh-inline">C++ 里 SFINAE 是条件模板编程的核心手段，但可读性经常相当劝退。Rust 基本就是拿 trait bound 把这整套体验换掉了。</span>

```cpp
// C++: SFINAE-based conditional function (pre-C++20)
template<typename T,
         std::enable_if_t<std::is_integral_v<T>, int> = 0>
T double_it(T val) { return val * 2; }

template<typename T,
         std::enable_if_t<std::is_floating_point_v<T>, int> = 0>
T double_it(T val) { return val * 2.0; }

// C++20 concepts — cleaner but still verbose:
template<std::integral T>
T double_it(T val) { return val * 2; }
```

```rust
// Rust: trait bounds — readable, composable, excellent error messages
use std::ops::Mul;

fn double_it<T: Mul<Output = T> + From<u8>>(val: T) -> T {
    val * T::from(2)
}

// Or with where clause for complex bounds:
fn process<T>(val: T) -> String
where
    T: std::fmt::Display + Clone + Send,
{
    format!("Processing: {}", val)
}

// Conditional behavior via separate impls (replaces SFINAE overloads):
trait Describable {
    fn describe(&self) -> String;
}

impl Describable for u32 {
    fn describe(&self) -> String { format!("integer: {self}") }
}

impl Describable for f64 {
    fn describe(&self) -> String { format!("float: {self:.2}") }
}
```

| C++ Template Metaprogramming | Rust Equivalent | Readability |
|-----------------------------|----------------|-------------|
| `std::enable_if_t<cond>` | `where T: Trait` | Much clearer |
| `std::is_integral_v<T>` | A trait bound or specific impl set | No `_v` machinery clutter |
| SFINAE overload sets | Separate trait impls | Each case stands alone |
| `if constexpr` on type categories | Trait impl dispatch or `cfg` | Usually simpler |
| C++20 concept | Rust trait | Very close in intent |
| `requires` clause | `where` clause | Similar placement, cleaner style |
| Deep template errors | Call-site trait mismatch errors | Often much easier to read |

> **Key insight:** If C++20 concepts feel familiar, that is because they are philosophically close to Rust traits. The difference is that Rust has built the whole generic model around traits from the start.<br><span class="zh-inline">**关键点：** 如果已经熟悉 C++20 concept，会发现 Rust trait 在理念上非常接近。区别在于 Rust 从一开始就是围着 trait 建的整套泛型体系，而不是后来再补进去。</span>

---

### Preprocessor → `cfg`, Feature Flags, and `macro_rules!`<br><span class="zh-inline">预处理器 → `cfg`、feature flag 与 `macro_rules!`</span>

C++ leans heavily on the preprocessor for constants, conditional compilation, and code generation. Rust deliberately replaces all of that with first-class language mechanisms.<br><span class="zh-inline">C++ 很多项目对预处理器依赖极重，常量、条件编译、代码生成全往里塞。Rust 的态度则更明确：这几类需求都应该由语言级机制分别接手，而不是继续搞文本替换一锅炖。</span>

#### `#define` constants → `const` or `const fn`<br><span class="zh-inline">`#define` 常量 → `const` 或 `const fn`</span>

```cpp
// C++
#define MAX_RETRIES 5
#define BUFFER_SIZE (1024 * 64)
#define SQUARE(x) ((x) * (x))  // Macro — textual substitution, no type safety
```

```rust
// Rust — type-safe, scoped, no textual substitution
const MAX_RETRIES: u32 = 5;
const BUFFER_SIZE: usize = 1024 * 64;
const fn square(x: u32) -> u32 { x * x }  // Evaluated at compile time

// Can be used in const contexts:
const AREA: u32 = square(12);  // Computed at compile time
static BUFFER: [u8; BUFFER_SIZE] = [0; BUFFER_SIZE];
```

#### `#ifdef` / `#if` → `#[cfg()]` and `cfg!()`<br><span class="zh-inline">`#ifdef` / `#if` → `#[cfg()]` 与 `cfg!()`</span>

```cpp
// C++
#ifdef DEBUG
    log_verbose("Step 1 complete");
#endif

#if defined(LINUX) && !defined(ARM)
    use_x86_path();
#else
    use_generic_path();
#endif
```

```rust
// Rust — attribute-based conditional compilation
#[cfg(debug_assertions)]
fn log_verbose(msg: &str) { eprintln!("[VERBOSE] {msg}"); }

#[cfg(not(debug_assertions))]
fn log_verbose(_msg: &str) { /* compiled away in release */ }

// Combine conditions:
#[cfg(all(target_os = "linux", target_arch = "x86_64"))]
fn use_x86_path() { /* ... */ }

#[cfg(not(all(target_os = "linux", target_arch = "x86_64")))]
fn use_generic_path() { /* ... */ }

// Runtime check (condition is still compile-time, but usable in expressions):
if cfg!(target_os = "windows") {
    println!("Running on Windows");
}
```

#### Feature flags in `Cargo.toml`<br><span class="zh-inline">`Cargo.toml` 里的 feature flag</span>

```toml
# Cargo.toml — replace #ifdef FEATURE_FOO
[features]
default = ["json"]
json = ["dep:serde_json"]       # Optional dependency
verbose-logging = []            # Flag with no extra dependency
gpu-support = ["dep:cuda-sys"]  # Optional GPU support
```

```rust
// Conditional code based on feature flags:
#[cfg(feature = "json")]
pub fn parse_config(data: &str) -> Result<Config, Error> {
    serde_json::from_str(data).map_err(Error::from)
}

#[cfg(feature = "verbose-logging")]
macro_rules! verbose {
    ($($arg:tt)*) => { eprintln!("[VERBOSE] {}", format!($($arg)*)); }
}
#[cfg(not(feature = "verbose-logging"))]
macro_rules! verbose {
    ($($arg:tt)*) => { }; // Compiles to nothing
}
```

#### `#define MACRO(x)` → `macro_rules!`<br><span class="zh-inline">函数式宏 → `macro_rules!`</span>

```cpp
// C++ — textual substitution, notoriously error-prone
#define DIAG_CHECK(cond, msg) \
    do { if (!(cond)) { log_error(msg); return false; } } while(0)
```

```rust
// Rust — hygienic, type-checked, operates on syntax tree
macro_rules! diag_check {
    ($cond:expr, $msg:expr) => {
        if !($cond) {
            log_error($msg);
            return Err(DiagError::CheckFailed($msg.to_string()));
        }
    };
}

fn run_test() -> Result<(), DiagError> {
    diag_check!(temperature < 85.0, "GPU too hot");
    diag_check!(voltage > 0.8, "Rail voltage too low");
    Ok(())
}
```

| C++ Preprocessor | Rust Equivalent | Advantage |
|-----------------|----------------|-----------|
| `#define PI 3.14` | `const PI: f64 = 3.14;` | Typed and scoped<br><span class="zh-inline">有类型，也有作用域</span> |
| `#define MAX(a,b) ((a)>(b)?(a):(b))` | `macro_rules!` or generic `fn max<T: Ord>` | No double evaluation traps<br><span class="zh-inline">不会重复求值坑人</span> |
| `#ifdef DEBUG` | `#[cfg(debug_assertions)]` | Checked by compiler<br><span class="zh-inline">编译器会真检查</span> |
| `#ifdef FEATURE_X` | `#[cfg(feature = "x")]` | Feature system is Cargo-aware<br><span class="zh-inline">和依赖系统直接联动</span> |
| `#include "header.h"` | `mod module;` + `use module::Item;` | No textual inclusion |
| `#pragma once` | Not needed | Each `.rs` module is compiled once |

---
