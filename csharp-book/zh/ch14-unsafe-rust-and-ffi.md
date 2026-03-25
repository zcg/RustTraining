## Unsafe Rust<br><span class="zh-inline">unsafe Rust</span>

> **What you'll learn:** What `unsafe` permits (raw pointers, FFI, unchecked casts), safe wrapper patterns, C# P/Invoke vs Rust FFI for calling native code, and the safety checklist for `unsafe` blocks.<br><span class="zh-inline">**本章将学到什么：** `unsafe` 到底开放了哪些能力，例如裸指针、FFI、未检查转换；如何把危险实现包进安全封装；C# 的 P/Invoke 和 Rust FFI 在调用原生代码时怎么对应；以及写 `unsafe` 块时该遵守的安全检查清单。</span>
>
> **Difficulty:** 🔴 Advanced<br><span class="zh-inline">**难度：** 🔴 进阶</span>

Unsafe Rust allows operations that the borrow checker cannot verify. It should be used sparingly, and every use最好都带着清晰的边界与说明。<br><span class="zh-inline">unsafe Rust 允许开发者做一些借用检查器无法验证的操作。它不是洪水猛兽，但确实应该少用，而且每一处都得把边界和理由讲明白。</span>

> **Advanced coverage**: For safe abstraction patterns over unsafe code, such as arena allocators, lock-free structures, and custom vtables, see [Rust Patterns](../../rust-patterns-book/src/SUMMARY.md).<br><span class="zh-inline">**更深入的延伸阅读：** 如果想继续看如何在 unsafe 之上建立安全抽象，例如 arena 分配器、无锁结构和自定义 vtable，可以去读 [Rust Patterns](../../rust-patterns-book/src/SUMMARY.md)。</span>

### When You Need Unsafe<br><span class="zh-inline">什么时候会需要 unsafe</span>

```rust
// 1. Dereferencing raw pointers
let mut value = 42;
let ptr = &mut value as *mut i32;
unsafe {
    *ptr = 100; // Must be in unsafe block
}

// 2. Calling unsafe functions
unsafe fn dangerous() {
    // Internal implementation that requires caller to maintain invariants
}

unsafe {
    dangerous(); // Caller takes responsibility
}

// 3. Accessing mutable static variables
static mut COUNTER: u32 = 0;
unsafe {
    COUNTER += 1; // Not thread-safe — caller must ensure synchronization
}

// 4. Implementing unsafe traits
unsafe trait UnsafeTrait {
    fn do_something(&self);
}
```

Rust 并不是见到 `unsafe` 就自动失控。准确地说，`unsafe` 只是把一小块区域标记成“这里的正确性证明，交给开发者自己负责”。<br><span class="zh-inline">也就是说，`unsafe` 不会关闭整个 Rust 的安全系统，它只是局部放开几个原本被严格限制的操作。</span>

### C# Comparison: unsafe Keyword<br><span class="zh-inline">和 C# `unsafe` 的对比</span>

```csharp
// C# unsafe - similar concept, different scope
unsafe void UnsafeExample()
{
    int value = 42;
    int* ptr = &value;
    *ptr = 100;
    
    // C# unsafe is about pointer arithmetic
    // Rust unsafe is about ownership/borrow rule relaxation
}

// C# fixed - pinning managed objects
unsafe void PinnedExample()
{
    byte[] buffer = new byte[100];
    fixed (byte* ptr = buffer)
    {
        // ptr is valid only within this block
    }
}
```

C# 里的 `unsafe` 更多是为了直接操作指针、和托管内存系统短接。Rust 里的 `unsafe` 范围更广一些，它不只和指针有关，也包括别名规则、FFI 边界、可变静态变量和 trait 安全契约。<br><span class="zh-inline">所以 C# 开发者刚接触 Rust 时，容易误以为“unsafe 就是指针区”，其实 Rust 的 unsafe 语义更系统化，也更强调局部证明责任。</span>

### Safe Wrappers<br><span class="zh-inline">安全封装</span>

```rust
/// The key pattern: wrap unsafe code in a safe API
pub struct SafeBuffer {
    data: Vec<u8>,
}

impl SafeBuffer {
    pub fn new(size: usize) -> Self {
        SafeBuffer { data: vec![0; size] }
    }
    
    /// Safe API — bounds-checked access
    pub fn get(&self, index: usize) -> Option<u8> {
        self.data.get(index).copied()
    }
    
    /// Fast unchecked access — unsafe but wrapped safely with bounds check
    pub fn get_unchecked_safe(&self, index: usize) -> Option<u8> {
        if index < self.data.len() {
            // SAFETY: we just checked that index is in bounds
            Some(unsafe { *self.data.get_unchecked(index) })
        } else {
            None
        }
    }
}
```

这就是 Rust 里最值钱的思路之一：把不安全操作关进一个很小的实现细节里，对外暴露 100% 安全的 API。<br><span class="zh-inline">标准库里的 `Vec`、`String`、`HashMap` 其实也都靠类似思路活着，内部有 unsafe，但接口本身尽量保持安全。</span>

***

## Interop with C# via FFI<br><span class="zh-inline">通过 FFI 和 C# 互操作</span>

Rust can expose C-compatible functions that C# calls through P/Invoke.<br><span class="zh-inline">Rust 可以导出符合 C ABI 的函数，C# 再通过 P/Invoke 去调用它们。</span>

```mermaid
graph LR
    subgraph "C# Process"
        CS["C# Code<br/>C# 代码"] -->|"P/Invoke"| MI["Marshal Layer<br/>UTF-16 → UTF-8<br/>结构体布局"]
    end
    MI -->|"C ABI call"| FFI["FFI Boundary<br/>FFI 边界"]
    subgraph "Rust cdylib (.so / .dll)"
        FFI --> RF["extern \"C\" fn<br/>#[no_mangle]"]
        RF --> Safe["Safe Rust<br/>内部实现"]
    end

    style FFI fill:#fff9c4,color:#000
    style MI fill:#bbdefb,color:#000
    style Safe fill:#c8e6c9,color:#000
```

### Rust Library (compiled as cdylib)<br><span class="zh-inline">Rust 侧库（编译成 cdylib）</span>

```rust
// src/lib.rs
#[no_mangle]
pub extern "C" fn add_numbers(a: i32, b: i32) -> i32 {
    a + b
}

#[no_mangle]
pub extern "C" fn process_string(input: *const std::os::raw::c_char) -> i32 {
    let c_str = unsafe {
        if input.is_null() {
            return -1;
        }
        std::ffi::CStr::from_ptr(input)
    };
    
    match c_str.to_str() {
        Ok(s) => s.len() as i32,
        Err(_) => -1,
    }
}
```

```toml
# Cargo.toml
[lib]
crate-type = ["cdylib"]
```

### C# Consumer (P/Invoke)<br><span class="zh-inline">C# 侧调用方（P/Invoke）</span>

```csharp
using System.Runtime.InteropServices;

public static class RustInterop
{
    [DllImport("my_rust_lib", CallingConvention = CallingConvention.Cdecl)]
    public static extern int add_numbers(int a, int b);
    
    [DllImport("my_rust_lib", CallingConvention = CallingConvention.Cdecl)]
    public static extern int process_string(
        [MarshalAs(UnmanagedType.LPUTF8Str)] string input);
}

// Usage
int sum = RustInterop.add_numbers(5, 3);
int len = RustInterop.process_string("Hello from C#!");
```

### FFI Safety Checklist<br><span class="zh-inline">FFI 安全检查清单</span>

When exposing Rust functions to C#, the following rules avoid many common crashes and ABI mismatches:<br><span class="zh-inline">Rust 往 C# 暴露函数时，下面这些规则能挡掉一大堆常见炸点和 ABI 不匹配问题。</span>

1. **Always use `extern "C"`** — otherwise Rust uses its own unstable calling convention.<br><span class="zh-inline">1. **一定要用 `extern "C"`**，不然调用约定就对不上。</span>
2. **Add `#[no_mangle]`** — otherwise C# often找不到符号。<br><span class="zh-inline">2. **补上 `#[no_mangle]`**，否则 C# 经常连导出名都找不到。</span>
3. **Never let a panic cross the FFI boundary** — unwinding into foreign code is undefined behavior.<br><span class="zh-inline">3. **绝对别让 panic 穿过 FFI 边界**，Rust unwind 到外部语言里属于未定义行为。</span>
4. **Use `#[repr(C)]` for transparent structs** that foreign code reads directly.<br><span class="zh-inline">4. **如果外部语言要直接读结构体字段，就必须用 `#[repr(C)]`**。</span>
5. **Always validate pointers before dereferencing**.<br><span class="zh-inline">5. **所有裸指针解引用之前都先判空**。</span>
6. **Document string encoding clearly** — C# 内部是 UTF-16，Rust `CStr` 常常期待 UTF-8。<br><span class="zh-inline">6. **把字符串编码规则写清楚**，别让 UTF-16 和 UTF-8 在边界上互相埋雷。</span>

```rust
#[no_mangle]
pub extern "C" fn safe_ffi_function() -> i32 {
    match std::panic::catch_unwind(|| {
        42
    }) {
        Ok(result) => result,
        Err(_) => -1,
    }
}
```

```rust
// Opaque handle — no #[repr(C)] needed when C# only stores IntPtr
pub struct Connection { /* Rust-only fields */ }

// Transparent data — C# reads fields directly
#[repr(C)]
pub struct Point { pub x: f64, pub y: f64 }
```

### End-to-End Example: Opaque Handle with Lifecycle Management<br><span class="zh-inline">完整例子：带生命周期管理的不透明句柄</span>

This is a very common production pattern: Rust owns the object, C# only holds an opaque handle, and explicit create/free functions manage lifetime.<br><span class="zh-inline">这是一种非常常见的生产写法：对象真实所有权归 Rust，C# 只拿一个不透明句柄，再通过显式的创建和释放函数管理生命周期。</span>

**Rust side**:<br><span class="zh-inline">**Rust 侧：**</span>

```rust
use std::ffi::{c_char, CStr};

pub struct ImageProcessor {
    width: u32,
    height: u32,
    pixels: Vec<u8>,
}

#[no_mangle]
pub extern "C" fn processor_new(width: u32, height: u32) -> *mut ImageProcessor {
    if width == 0 || height == 0 {
        return std::ptr::null_mut();
    }
    let proc = ImageProcessor {
        width,
        height,
        pixels: vec![0u8; (width * height * 4) as usize],
    };
    Box::into_raw(Box::new(proc))
}

#[no_mangle]
pub extern "C" fn processor_grayscale(ptr: *mut ImageProcessor) -> i32 {
    let proc = match unsafe { ptr.as_mut() } {
        Some(p) => p,
        None => return -1,
    };
    for chunk in proc.pixels.chunks_exact_mut(4) {
        let gray = (0.299 * chunk[0] as f64
                  + 0.587 * chunk[1] as f64
                  + 0.114 * chunk[2] as f64) as u8;
        chunk[0] = gray;
        chunk[1] = gray;
        chunk[2] = gray;
    }
    0
}

#[no_mangle]
pub extern "C" fn processor_free(ptr: *mut ImageProcessor) {
    if !ptr.is_null() {
        unsafe { drop(Box::from_raw(ptr)); }
    }
}
```

**C# side**:<br><span class="zh-inline">**C# 侧：**</span>

```csharp
using System.Runtime.InteropServices;

public sealed class ImageProcessor : IDisposable
{
    [DllImport("image_rust", CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr processor_new(uint width, uint height);

    [DllImport("image_rust", CallingConvention = CallingConvention.Cdecl)]
    private static extern int processor_grayscale(IntPtr ptr);

    [DllImport("image_rust", CallingConvention = CallingConvention.Cdecl)]
    private static extern void processor_free(IntPtr ptr);

    private IntPtr _handle;

    public ImageProcessor(uint width, uint height)
    {
        _handle = processor_new(width, height);
        if (_handle == IntPtr.Zero)
            throw new ArgumentException("Invalid dimensions");
    }

    public void Grayscale()
    {
        if (processor_grayscale(_handle) != 0)
            throw new InvalidOperationException("Processor is null");
    }

    public void Dispose()
    {
        if (_handle != IntPtr.Zero)
        {
            processor_free(_handle);
            _handle = IntPtr.Zero;
        }
    }
}

using var proc = new ImageProcessor(1920, 1080);
proc.Grayscale();
```

> **Key insight**: This is very close to the spirit of C# `SafeHandle`. Rust uses `Box::into_raw` / `Box::from_raw` to hand ownership across the FFI boundary, and the C# `IDisposable` wrapper makes cleanup explicit and reliable.<br><span class="zh-inline">**关键点**：这套思路和 C# 的 `SafeHandle` 很接近。Rust 用 `Box::into_raw` / `Box::from_raw` 转移所有权，C# 再用 `IDisposable` 把释放动作明确地兜住。</span>

---

## Exercises<br><span class="zh-inline">练习</span>

<details>
<summary><strong>🏋️ Exercise: Safe Wrapper for Raw Pointer</strong> <span class="zh-inline">🏋️ 练习：给裸指针做安全封装</span></summary>

You receive a raw pointer from a C library. Write a safe Rust wrapper:<br><span class="zh-inline">假设从一个 C 库拿到裸指针，尝试给它写一个安全 Rust 包装层：</span>

```rust
// Simulated C API
extern "C" {
    fn lib_create_buffer(size: usize) -> *mut u8;
    fn lib_free_buffer(ptr: *mut u8);
}
```

Requirements:<br><span class="zh-inline">要求：</span>

1. Create a `SafeBuffer` struct that wraps the raw pointer<br><span class="zh-inline">1. 定义一个 `SafeBuffer` 结构包住裸指针。</span>
2. Implement `Drop` to call `lib_free_buffer`<br><span class="zh-inline">2. 实现 `Drop`，在析构时调用 `lib_free_buffer`。</span>
3. Provide a safe `&[u8]` view via `as_slice()`<br><span class="zh-inline">3. 通过 `as_slice()` 暴露一个安全的 `&[u8]` 视图。</span>
4. Ensure `SafeBuffer::new()` returns `None` if the pointer is null<br><span class="zh-inline">4. 如果指针为空，`SafeBuffer::new()` 必须返回 `None`。</span>

<details>
<summary>🔑 Solution <span class="zh-inline">参考答案</span></summary>

```rust,ignore
struct SafeBuffer {
    ptr: *mut u8,
    len: usize,
}

impl SafeBuffer {
    fn new(size: usize) -> Option<Self> {
        let ptr = unsafe { lib_create_buffer(size) };
        if ptr.is_null() {
            None
        } else {
            Some(SafeBuffer { ptr, len: size })
        }
    }

    fn as_slice(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }
}

impl Drop for SafeBuffer {
    fn drop(&mut self) {
        unsafe { lib_free_buffer(self.ptr); }
    }
}

fn process(buf: &SafeBuffer) {
    let data = buf.as_slice();
    println!("First byte: {}", data[0]);
}
```

**Key pattern**: keep the `unsafe` in one tiny place, attach `// SAFETY:` reasoning, and present a fully safe public API.<br><span class="zh-inline">**核心模式**：把 `unsafe` 尽量缩成一个很小的实现块，配上 `// SAFETY:` 注释说明理由，然后对外提供纯安全 API。</span>

</details>
</details>

***
