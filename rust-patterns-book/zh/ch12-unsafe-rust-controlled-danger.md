# 12. Unsafe Rust — Controlled Danger 🔴<br><span class="zh-inline"># 12. Unsafe Rust：受控的危险 🔴</span>

> **What you'll learn:**<br><span class="zh-inline">**本章将学到什么：**</span>
> - The five unsafe superpowers and when each is needed<br><span class="zh-inline">`unsafe` 开启的五种“超能力”，以及它们各自适用的场景</span>
> - Writing sound abstractions: safe API, unsafe internals<br><span class="zh-inline">如何写出健全的抽象：外部安全 API，内部 `unsafe` 实现</span>
> - FFI patterns for calling C from Rust (and back)<br><span class="zh-inline">从 Rust 调用 C，或者让 C 调 Rust 时的 FFI 模式</span>
> - Common UB pitfalls and arena/slab allocator patterns<br><span class="zh-inline">常见未定义行为陷阱，以及 arena、slab 分配器模式</span>

## The Five Unsafe Superpowers<br><span class="zh-inline">`unsafe` 的五种超能力</span>

`unsafe` unlocks five operations that the compiler cannot verify:<br><span class="zh-inline">`unsafe` 只会解锁编译器没法自动验证的五类操作：</span>

```rust
unsafe {
    // 1. Dereference a raw pointer
    let ptr: *const i32 = &42;
    let value = *ptr; // Could be a dangling/null pointer

    // 2. Call an unsafe function
    let layout = std::alloc::Layout::new::<u64>();
    let mem = std::alloc::alloc(layout);

    // 3. Access a mutable static variable
    static mut COUNTER: u32 = 0;
    COUNTER += 1; // Data race if multiple threads access

    // 4. Implement an unsafe trait
    // unsafe impl Send for MyType {}

    // 5. Access fields of a union
    // union IntOrFloat { i: i32, f: f32 }
    // let u = IntOrFloat { i: 42 };
    // let f = u.f; // Reinterpret bits — could be garbage
}
```

> **Key principle**: `unsafe` does not shut down Rust's borrow checker or type system. It only grants access to these specific capabilities. Everything else in Rust still applies.<br><span class="zh-inline">**核心原则**：`unsafe` 并不会把 Rust 的借用检查器和类型系统整个关掉，它只是允许执行这五类特定操作。除此之外，Rust 的其他规则仍然照样生效。</span>

### Writing Sound Abstractions<br><span class="zh-inline">编写健全的抽象</span>

The real purpose of `unsafe` is to build **safe abstractions** around operations the compiler cannot check directly:<br><span class="zh-inline">`unsafe` 真正的用途，不是随便乱冲，而是给那些编译器没法直接验证的底层操作，包出**安全抽象**：</span>

```rust
/// A fixed-capacity stack-allocated buffer.
/// All public methods are safe — the unsafe is encapsulated.
pub struct StackBuf<T, const N: usize> {
    data: [std::mem::MaybeUninit<T>; N],
    len: usize,
}

impl<T, const N: usize> StackBuf<T, N> {
    pub fn new() -> Self {
        StackBuf {
            data: [const { std::mem::MaybeUninit::uninit() }; N],
            len: 0,
        }
    }

    pub fn push(&mut self, value: T) -> Result<(), T> {
        if self.len >= N {
            return Err(value);
        }
        // SAFETY: len < N, so data[len] is within bounds.
        self.data[self.len] = std::mem::MaybeUninit::new(value);
        self.len += 1;
        Ok(())
    }

    pub fn get(&self, index: usize) -> Option<&T> {
        if index < self.len {
            // SAFETY: index < len, and data[0..len] are all initialized.
            Some(unsafe { self.data[index].assume_init_ref() })
        } else {
            None
        }
    }
}

impl<T, const N: usize> Drop for StackBuf<T, N> {
    fn drop(&mut self) {
        // SAFETY: data[0..len] are initialized — drop them properly.
        for i in 0..self.len {
            unsafe { self.data[i].assume_init_drop(); }
        }
    }
}
```

**The three rules of sound unsafe code**:<br><span class="zh-inline">**写健全 `unsafe` 代码的三条规矩：**</span>
1. **Document invariants** — every `// SAFETY:` comment explains why the operation is valid<br><span class="zh-inline">**把不变量写清楚**：每个 `// SAFETY:` 注释都要说明为什么这里是安全的</span>
2. **Encapsulate** — keep unsafe internals behind a safe public API<br><span class="zh-inline">**把边界包住**：`unsafe` 藏在内部，公开 API 仍然安全</span>
3. **Minimize** — make the unsafe block as small as possible<br><span class="zh-inline">**把范围缩小**：`unsafe` 块越小越好</span>

### FFI Patterns: Calling C from Rust<br><span class="zh-inline">FFI 模式：从 Rust 调用 C</span>

```rust
// Declare the C function signature:
extern "C" {
    fn strlen(s: *const std::ffi::c_char) -> usize;
    fn printf(format: *const std::ffi::c_char, ...) -> std::ffi::c_int;
}

// Safe wrapper:
fn safe_strlen(s: &str) -> usize {
    let c_string = std::ffi::CString::new(s).expect("string contains null byte");
    // SAFETY: c_string is a valid null-terminated string, alive for the call.
    unsafe { strlen(c_string.as_ptr()) }
}

// Calling Rust from C (export a function):
#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 {
    a + b
}
```

**Common FFI types**:<br><span class="zh-inline">**常见 FFI 类型对照：**</span>

| Rust | C | Notes<br><span class="zh-inline">说明</span> |
|------|---|-------|
| `i32` / `u32` | `int32_t` / `uint32_t` | Fixed-width, safe<br><span class="zh-inline">固定宽度，比较安全</span> |
| `*const T` / `*mut T` | `const T*` / `T*` | Raw pointers<br><span class="zh-inline">裸指针</span> |
| `std::ffi::CStr` | `const char*` (borrowed) | Null-terminated, borrowed<br><span class="zh-inline">以空字符结尾，借用型</span> |
| `std::ffi::CString` | `char*` (owned) | Null-terminated, owned<br><span class="zh-inline">以空字符结尾，拥有所有权</span> |
| `std::ffi::c_void` | `void` | Opaque pointer target<br><span class="zh-inline">不透明指针目标</span> |
| `Option<fn(...)>` | Nullable function pointer | `None` = NULL |

### Common UB Pitfalls<br><span class="zh-inline">常见未定义行为陷阱</span>

| Pitfall<br><span class="zh-inline">陷阱</span> | Example<br><span class="zh-inline">示例</span> | Why It's UB<br><span class="zh-inline">为什么会出 UB</span> |
|---------|---------|------------|
| Null dereference<br><span class="zh-inline">解引用空指针</span> | `*std::ptr::null::<i32>()` | Dereferencing null is always UB<br><span class="zh-inline">空指针解引用永远是 UB</span> |
| Dangling pointer<br><span class="zh-inline">悬垂指针</span> | Dereference after `drop()` | Memory may be reused<br><span class="zh-inline">内存可能已经被复用</span> |
| Data race<br><span class="zh-inline">数据竞争</span> | Two threads write to `static mut` | Unsynchronized concurrent writes<br><span class="zh-inline">并发写入没有同步</span> |
| Wrong `assume_init`<br><span class="zh-inline">错误使用 `assume_init`</span> | `MaybeUninit::<String>::uninit().assume_init()` | Reading uninitialized memory<br><span class="zh-inline">读取未初始化内存</span> |
| Aliasing violation<br><span class="zh-inline">别名规则违规</span> | Creating two `&mut` to same data | Violates Rust's aliasing model<br><span class="zh-inline">破坏 Rust 的别名模型</span> |
| Invalid enum value<br><span class="zh-inline">非法枚举值</span> | `std::mem::transmute::<u8, bool>(2)` | `bool` can only be 0 or 1<br><span class="zh-inline">`bool` 只能是 0 或 1</span> |

> **When to use `unsafe` in production**: FFI boundary code, performance-sensitive primitives, and low-level building blocks are the usual places. Application business logic almost never needs it.<br><span class="zh-inline">**生产环境里什么时候该用 `unsafe`**：通常是 FFI 边界、性能特别敏感的底层原语，以及像容器、分配器这种基础设施代码。业务逻辑层一般很少需要它。</span>

### Custom Allocators — Arena and Slab Patterns<br><span class="zh-inline">自定义分配器：Arena 与 Slab 模式</span>

In C, specific allocation patterns often lead to custom `malloc()` replacements. Rust can express the same ideas through arena allocators, slab pools, and allocator crates, while still using lifetimes to prevent whole classes of use-after-free bugs.<br><span class="zh-inline">在 C 里，只要分配模式特殊，往往就会想自己写一套 `malloc()` 替代方案。Rust 也能表达同样的思路，比如 arena 分配器、slab 池和各种 allocator crate，而且还可以借助生命周期，把一大类 use-after-free 错误提前扼杀掉。</span>

#### Arena Allocators — Bulk Allocation, Bulk Free<br><span class="zh-inline">Arena 分配器：批量分配，批量释放</span>

An arena bumps a pointer forward as it allocates. Individual values are not freed one by one; the whole arena is discarded at once. That makes it perfect for request-scoped or frame-scoped workloads:<br><span class="zh-inline">arena 分配器分配时就是把指针一路往前推。单个对象不会单独释放，而是在整个 arena 丢弃时一次性回收，所以它特别适合请求作用域、帧作用域这种批处理场景：</span>

```rust
use bumpalo::Bump;

fn process_sensor_frame(raw_data: &[u8]) {
    let arena = Bump::new();
    let header = arena.alloc(parse_header(raw_data));
    let readings: &mut [f32] = arena.alloc_slice_fill_default(header.sensor_count);

    for (i, chunk) in raw_data[header.payload_offset..].chunks(4).enumerate() {
        if i < readings.len() {
            readings[i] = f32::from_le_bytes(chunk.try_into().unwrap());
        }
    }

    let avg = readings.iter().sum::<f32>() / readings.len() as f32;
    println!("Frame avg: {avg:.2}");
}
# fn parse_header(_: &[u8]) -> Header { Header { sensor_count: 4, payload_offset: 8 } }
# struct Header { sensor_count: usize, payload_offset: usize }
```

**Arena vs standard allocator**:<br><span class="zh-inline">**Arena 和标准分配器的对比：**</span>

| Aspect<br><span class="zh-inline">维度</span> | `Vec::new()` / `Box::new()` | `Bump` arena |
|--------|---------------------------|--------------|
| Alloc speed<br><span class="zh-inline">分配速度</span> | ~25ns (`malloc`)<br><span class="zh-inline">要走堆分配</span> | ~2ns (pointer bump)<br><span class="zh-inline">只是挪一下指针</span> |
| Free speed<br><span class="zh-inline">释放速度</span> | Per-object destructor<br><span class="zh-inline">逐对象析构</span> | O(1) bulk free<br><span class="zh-inline">O(1) 整体释放</span> |
| Fragmentation<br><span class="zh-inline">碎片化</span> | Yes<br><span class="zh-inline">会有</span> | None within arena<br><span class="zh-inline">arena 内部基本没有</span> |
| Lifetime safety<br><span class="zh-inline">生命周期安全</span> | Heap-based<br><span class="zh-inline">依赖运行时 `Drop`</span> | Lifetime-scoped<br><span class="zh-inline">可被生命周期约束</span> |
| Use case<br><span class="zh-inline">场景</span> | General purpose<br><span class="zh-inline">通用场景</span> | Request/frame/batch processing<br><span class="zh-inline">请求、帧、批处理</span> |

#### Slab Allocators — Fixed-Size Object Pools<br><span class="zh-inline">Slab 分配器：固定大小对象池</span>

A slab allocator pre-allocates slots of the same size. Objects can be inserted and removed individually, but storage remains compact and O(1) to reuse:<br><span class="zh-inline">slab 分配器会预先准备一堆等大小的槽位。对象虽然可以单独插入和删除，但存储仍然规整，复用起来也是 O(1)：</span>

```rust
use slab::Slab;

struct Connection {
    id: u64,
    buffer: [u8; 1024],
    active: bool,
}

fn connection_pool_example() {
    let mut connections: Slab<Connection> = Slab::with_capacity(256);

    let key1 = connections.insert(Connection {
        id: 1001,
        buffer: [0; 1024],
        active: true,
    });

    let key2 = connections.insert(Connection {
        id: 1002,
        buffer: [0; 1024],
        active: true,
    });

    if let Some(conn) = connections.get_mut(key1) {
        conn.buffer[0..5].copy_from_slice(b"hello");
    }

    let removed = connections.remove(key2);
    assert_eq!(removed.id, 1002);

    let key3 = connections.insert(Connection {
        id: 1003,
        buffer: [0; 1024],
        active: true,
    });
    assert_eq!(key3, key2);
}
```

#### Implementing a Minimal Arena (for `no_std`)<br><span class="zh-inline">给 `no_std` 环境写一个最小 Arena</span>

```rust
#![cfg_attr(not(test), no_std)]

use core::alloc::Layout;
use core::cell::{Cell, UnsafeCell};

pub struct FixedArena<const N: usize> {
    buf: UnsafeCell<[u8; N]>,
    offset: Cell<usize>,
}

impl<const N: usize> FixedArena<N> {
    pub const fn new() -> Self {
        FixedArena {
            buf: UnsafeCell::new([0; N]),
            offset: Cell::new(0),
        }
    }

    pub fn alloc<T>(&self, value: T) -> Option<&mut T> {
        let layout = Layout::new::<T>();
        let current = self.offset.get();
        let aligned = (current + layout.align() - 1) & !(layout.align() - 1);
        let new_offset = aligned + layout.size();

        if new_offset > N {
            return None;
        }

        self.offset.set(new_offset);

        // SAFETY:
        // - `aligned` is within `buf` bounds
        // - Alignment is correct for T
        // - Each allocation gets a unique non-overlapping region
        let ptr = unsafe {
            let base = (self.buf.get() as *mut u8).add(aligned);
            let typed = base as *mut T;
            typed.write(value);
            &mut *typed
        };

        Some(ptr)
    }

    pub unsafe fn reset(&self) {
        self.offset.set(0);
    }
}
```

#### Choosing an Allocator Strategy<br><span class="zh-inline">如何选择分配器策略</span>

```mermaid
graph TD
    A["What's your allocation pattern?<br/>分配模式是什么？"] --> B{All same type?<br/>是不是同一种类型？}
    A --> I{"Environment?<br/>运行环境？"}
    B -->|Yes<br/>是| C{Need individual free?<br/>要不要单独释放？}
    B -->|No<br/>否| D{Need individual free?<br/>要不要单独释放？}
    C -->|Yes<br/>要| E["<b>Slab</b><br/>slab crate<br/>O(1) alloc + free<br/>按索引访问"]
    C -->|No<br/>不要| F["<b>typed-arena</b><br/>批量分配、批量释放<br/>生命周期约束引用"]
    D -->|Yes<br/>要| G["<b>Standard allocator</b><br/>Box, Vec 等<br/>通用堆分配"]
    D -->|No<br/>不要| H["<b>Bump arena</b><br/>bumpalo crate<br/>~2ns alloc, O(1) bulk free"]
    
    I -->|no_std| J["FixedArena (custom)<br/>or embedded-alloc"]
    I -->|std| K["bumpalo / typed-arena / slab"]
    
    style E fill:#91e5a3,color:#000
    style F fill:#91e5a3,color:#000
    style G fill:#89CFF0,color:#000
    style H fill:#91e5a3,color:#000
    style J fill:#ffa07a,color:#000
    style K fill:#91e5a3,color:#000
```

| C Pattern<br><span class="zh-inline">C 里的常见模式</span> | Rust Equivalent<br><span class="zh-inline">Rust 对应方案</span> | Key Advantage<br><span class="zh-inline">主要优势</span> |
|-----------|----------------|---------------|
| Custom `malloc()` pool | `#[global_allocator]` impl | Type-safe, debuggable<br><span class="zh-inline">类型安全、调试友好</span> |
| `obstack` (GNU) | `bumpalo::Bump` | Lifetime-scoped, no use-after-free<br><span class="zh-inline">受生命周期约束，避免 use-after-free</span> |
| Kernel slab (`kmem_cache`) | `slab::Slab<T>` | Type-safe, index-based<br><span class="zh-inline">类型安全，按索引访问</span> |
| Stack-allocated temp buffer | `FixedArena<N>` | No heap, `const` constructible<br><span class="zh-inline">不依赖堆，可用 `const` 构造</span> |
| `alloca()` | `[T; N]` or `SmallVec` | Compile-time sized, no UB<br><span class="zh-inline">编译期定长，更可控</span> |

> **Key Takeaways — Unsafe Rust**<br><span class="zh-inline">**本章要点 — Unsafe Rust**</span>
> - Document invariants, hide unsafe behind safe APIs, and keep unsafe scopes tiny<br><span class="zh-inline">把不变量写清、把 `unsafe` 藏在安全 API 后面、把 `unsafe` 范围压到最小</span>
> - `[const { MaybeUninit::uninit() }; N]` is the modern replacement for older `assume_init` array tricks<br><span class="zh-inline">`[const { MaybeUninit::uninit() }; N]` 是现代 Rust 里替代旧式 `assume_init` 数组写法的正路</span>
> - FFI requires `extern "C"`、`#[repr(C)]` and careful pointer/lifetime handling<br><span class="zh-inline">FFI 里必须认真处理 `extern "C"`、`#[repr(C)]`、指针和生命周期</span>
> - Arena and slab allocators trade general-purpose flexibility for predictability and speed<br><span class="zh-inline">arena 和 slab 分配器拿通用性换来了更强的可预测性和更高的分配效率</span>

> **See also:** [Ch 4 — PhantomData](ch04-phantomdata-types-that-carry-no-data.md) for how variance and drop-check interact with unsafe code. [Ch 9 — Smart Pointers](ch09-smart-pointers-and-interior-mutability.md) for `Pin` and self-referential types.<br><span class="zh-inline">**延伸阅读：** 想看变型与 drop check 怎么和 unsafe 互动，可以看 [第 4 章：PhantomData](ch04-phantomdata-types-that-carry-no-data.md)；想看 `Pin` 和自引用类型，可以看 [第 9 章：智能指针](ch09-smart-pointers-and-interior-mutability.md)。</span>

---

### Exercise: Safe Wrapper around Unsafe ★★★ (~45 min)<br><span class="zh-inline">练习：为 `unsafe` 包一层安全外壳 ★★★（约 45 分钟）</span>

Write a `FixedVec<T, const N: usize>` — a fixed-capacity, stack-allocated vector. Requirements:<br><span class="zh-inline">编写一个 `FixedVec&lt;T, const N: usize&gt;`，也就是固定容量、栈上分配的向量。要求如下：</span>
- `push(&mut self, value: T) -> Result<(), T>` returns `Err(value)` when full<br><span class="zh-inline">满了以后 `push` 返回 `Err(value)`</span>
- `pop(&mut self) -> Option<T>` returns and removes the last element<br><span class="zh-inline">`pop` 返回并移除最后一个元素</span>
- `as_slice(&self) -> &[T]` borrows initialized elements<br><span class="zh-inline">`as_slice` 返回当前已初始化元素的切片</span>
- All public methods must be safe; all unsafe must be encapsulated with `SAFETY:` comments<br><span class="zh-inline">所有公开方法都必须安全，`unsafe` 全部封装并写明 `SAFETY:` 说明</span>
- `Drop` must clean up initialized elements<br><span class="zh-inline">`Drop` 里要正确清理已经初始化的元素</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use std::mem::MaybeUninit;

pub struct FixedVec<T, const N: usize> {
    data: [MaybeUninit<T>; N],
    len: usize,
}

impl<T, const N: usize> FixedVec<T, N> {
    pub fn new() -> Self {
        FixedVec {
            data: [const { MaybeUninit::uninit() }; N],
            len: 0,
        }
    }

    pub fn push(&mut self, value: T) -> Result<(), T> {
        if self.len >= N { return Err(value); }
        self.data[self.len] = MaybeUninit::new(value);
        self.len += 1;
        Ok(())
    }

    pub fn pop(&mut self) -> Option<T> {
        if self.len == 0 { return None; }
        self.len -= 1;
        // SAFETY: data[len] was initialized before the decrement.
        Some(unsafe { self.data[self.len].assume_init_read() })
    }

    pub fn as_slice(&self) -> &[T] {
        // SAFETY: data[0..len] are initialized and layout-compatible with T.
        unsafe { std::slice::from_raw_parts(self.data.as_ptr() as *const T, self.len) }
    }

    pub fn len(&self) -> usize { self.len }
    pub fn is_empty(&self) -> bool { self.len == 0 }
}

impl<T, const N: usize> Drop for FixedVec<T, N> {
    fn drop(&mut self) {
        for i in 0..self.len {
            // SAFETY: data[0..len] are initialized.
            unsafe { self.data[i].assume_init_drop(); }
        }
    }
}
```

</details>

***
