### Unsafe Rust<br><span class="zh-inline">Unsafe Rust</span>

> **What you'll learn:** When and how to use `unsafe` — raw pointer dereferencing, FFI for calling C from Rust and vice versa, `CString` / `CStr` for string interop, and the discipline required to wrap unsafe code in safe interfaces.<br><span class="zh-inline">**本章将学到什么：** 什么时候该用 `unsafe`，以及该怎么用。内容包括原始指针解引用、Rust 与 C 双向调用的 FFI、用于字符串互操作的 `CString` / `CStr`，还有怎样把不安全代码包进安全接口里。</span>

- `unsafe` 会打开 Rust 编译器平时默认关着的那几扇门。<br><span class="zh-inline">也就是说，编译器不再替忙兜底，很多约束要靠代码作者自己守住。</span>
    - Dereferencing raw pointers<br><span class="zh-inline">解引用原始指针</span>
    - Accessing mutable static variables<br><span class="zh-inline">访问可变静态变量</span>
    - https://doc.rust-lang.org/book/ch19-01-unsafe-rust.html
- With great power comes great responsibility.<br><span class="zh-inline">能力越大，越容易一脚踩进未定义行为。</span>
    - `unsafe` 本质上是在告诉编译器：“这些不变量由程序员负责保证。”<br><span class="zh-inline">编译器平时会替忙检查的那部分，现在全部改成人工担保。</span>
    - Must guarantee no aliased mutable and immutable references, no dangling pointers, no invalid references, and so on.<br><span class="zh-inline">必须自己保证：不存在别名的可变与不可变引用，不存在悬空指针，不存在无效引用，等等。</span>
    - The scope of `unsafe` should be kept as small as possible.<br><span class="zh-inline">`unsafe` 的作用范围越小越好，别一时图省事把整段逻辑全糊进去。</span>
    - Every `unsafe` block should have a `Safety:` comment describing the assumptions being made.<br><span class="zh-inline">每个 `unsafe` 块都应该有明确的 `Safety:` 注释，把成立前提写清楚。</span>

### Unsafe Rust examples<br><span class="zh-inline">`unsafe` 的基础示例</span>

```rust
unsafe fn harmless() {}
fn main() {
    // Safety: We are calling a harmless unsafe function
    unsafe {
        harmless();
    }
    let a = 42u32;
    let p = &a as *const u32;
    // Safety: p is a valid pointer to a variable that will remain in scope
    unsafe {
        println!("{}", *p);
    }
    // Safety: Not safe; for illustration purposes only
    let dangerous_buffer = 0xb8000 as *mut u32;
    unsafe {
        println!("About to go kaboom!!!");
        *dangerous_buffer = 0; // This will SEGV on most modern machines
    }
}
```

### Simple FFI example (Rust library function consumed by C)<br><span class="zh-inline">简单 FFI 示例：让 C 调用 Rust 库函数</span>

## FFI Strings: `CString` and `CStr`<br><span class="zh-inline">FFI 字符串：`CString` 与 `CStr`</span>

FFI 全称是 *Foreign Function Interface*，就是 Rust 用来和其他语言互相调用的接口机制。最常见的对象当然是 C。<br><span class="zh-inline">这个概念听着很玄，其实就是“跨语言边界时，双方怎么约定数据和函数调用方式”。</span>

当 Rust 代码和 C 代码交互时，Rust 的 `String` 与 `&str` 不能直接等同于 C 字符串。Rust 字符串是 UTF-8 字节序列，不自带结尾的 `\0`；C 字符串则是以空字符结尾的字节数组。标准库里对应的桥接类型就是 `CString` 和 `CStr`。<br><span class="zh-inline">一个负责“从 Rust 侧构造可交给 C 的字符串”，另一个负责“把来自 C 的字符串借用成 Rust 可读形式”。</span>

| Type | Analogous to | Use when |
|------|-------------|----------|
| `CString` | Owned `String` for C interop<br><span class="zh-inline">给 C 用的拥有型字符串</span> | Creating a C string from Rust data<br><span class="zh-inline">把 Rust 数据变成 C 风格字符串时</span> |
| `&CStr` | Borrowed `&str` for foreign input<br><span class="zh-inline">借用型 C 字符串视图</span> | Receiving a C string from foreign code<br><span class="zh-inline">接收外部代码传进来的 C 字符串时</span> |

```rust
use std::ffi::{CString, CStr};
use std::os::raw::c_char;

fn demo_ffi_strings() {
    // Creating a C-compatible string (adds null terminator)
    let c_string = CString::new("Hello from Rust").expect("CString::new failed");
    let ptr: *const c_char = c_string.as_ptr();

    // Converting a C string back to Rust (unsafe because we trust the pointer)
    // Safety: ptr is valid and null-terminated (we just created it above)
    let back_to_rust: &CStr = unsafe { CStr::from_ptr(ptr) };
    let rust_str: &str = back_to_rust.to_str().expect("Invalid UTF-8");
    println!("{}", rust_str);
}
```

> **Warning:** `CString::new()` returns an error if the input contains an interior null byte `\0`. That `Result` needs to be handled. `CStr` 会在后面的 FFI 例子里反复出现，因为凡是从 C 边界接收字符串，几乎都得走它。<br><span class="zh-inline">**提醒：** 如果字符串内部本身带着 `\0`，`CString::new()` 会返回错误，所以这个 `Result` 不能随手糊掉。后面几乎所有 FFI 字符串示例都会用到 `CStr`。</span>

- FFI 导出函数通常要标记 `#[no_mangle]`，这样编译器才不会把符号名改得乱七八糟。<br><span class="zh-inline">不然 C 那边按原名去找，大概率直接扑空。</span>
- We'll compile the crate as a static library.<br><span class="zh-inline">这里先假设把 Rust crate 编译成静态库，交给 C 链接。</span>

```rust
#[no_mangle] 
pub extern "C" fn add(left: u64, right: u64) -> u64 {
    left + right
}
```

- 然后可以在 C 侧按普通外部函数那样声明并调用它。<br><span class="zh-inline">只要 ABI 和符号名对得上，调用方式看起来就很平常。</span>

```c
#include <stdio.h>
#include <stdint.h>
extern uint64_t add(uint64_t, uint64_t);
int main() {
    printf("Add returned %llu\n", add(21, 21));
}
``` 

### Complex FFI example<br><span class="zh-inline">更完整的 FFI 例子</span>

- In the following example, the plan is to build a Rust logging interface and expose it to Python and C.<br><span class="zh-inline">下面这个例子里，会做一个 Rust 日志接口，再把它导出给 Python 和 C 使用。</span>
    - The same interface can be used natively from Rust and from C.<br><span class="zh-inline">同一套核心逻辑既能被 Rust 直接调用，也能被 C 侧复用。</span>
    - Tools such as `cbindgen` can generate header files automatically.<br><span class="zh-inline">像 `cbindgen` 这样的工具可以自动生成 C 头文件，省掉很多手写同步工作。</span>
    - Thin `unsafe` wrappers can serve as a bridge into safe Rust internals.<br><span class="zh-inline">`unsafe` 包装层的理想职责，是把边界上的脏活做完，再把内部逻辑交回安全 Rust。</span>

## Logger helper functions<br><span class="zh-inline">日志器辅助函数</span>

```rust
fn create_or_open_log_file(log_file: &str, overwrite: bool) -> Result<File, String> {
    if overwrite {
        File::create(log_file).map_err(|e| e.to_string())
    } else {
        OpenOptions::new()
            .write(true)
            .append(true)
            .open(log_file)
            .map_err(|e| e.to_string())
    }
}

fn log_to_file(file_handle: &mut File, message: &str) -> Result<(), String> {
    file_handle
        .write_all(message.as_bytes())
        .map_err(|e| e.to_string())
}
```

## Logger struct<br><span class="zh-inline">日志器结构体</span>

```rust
struct SimpleLogger {
    log_level: LogLevel,
    file_handle: File,
}

impl SimpleLogger {
    fn new(log_file: &str, overwrite: bool, log_level: LogLevel) -> Result<Self, String> {
        let file_handle = create_or_open_log_file(log_file, overwrite)?;
        Ok(Self {
            file_handle,
            log_level,
        })
    }

    fn log_message(&mut self, log_level: LogLevel, message: &str) -> Result<(), String> {
        if log_level as u32 <= self.log_level as u32 {
            let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
            let message = format!("Simple: {timestamp} {log_level} {message}\n");
            log_to_file(&mut self.file_handle, &message)
        } else {
            Ok(())
        }
    }
}
```

## Testing<br><span class="zh-inline">测试</span>

- Testing the Rust side is easy.<br><span class="zh-inline">这部分一旦还在 Rust 语言边界内，测试成本其实很低。</span>
    - Test methods use the `#[test]` attribute and are not part of the final binary.<br><span class="zh-inline">测试函数用 `#[test]` 标记，编译出的正式二进制里不会带着它们一起跑。</span>
    - Creating mock helpers for tests is straightforward.<br><span class="zh-inline">需要伪造输入或辅助对象时，也很好搭。</span>

```rust
#[test]
fn testfunc() -> Result<(), String> {
    let mut logger = SimpleLogger::new("test.log", false, LogLevel::INFO)?;
    logger.log_message(LogLevel::TRACELEVEL1, "Hello world")?;
    logger.log_message(LogLevel::CRITICAL, "Critical message")?;
    Ok(()) // The compiler automatically drops logger here
}
```

```bash
cargo test
```

## (C)-Rust FFI<br><span class="zh-inline">C 与 Rust 的 FFI</span>

- `cbindgen` is a very handy tool for generating headers for exported Rust functions.<br><span class="zh-inline">给 C 提供接口时，这玩意儿很省心，头文件能自动生成。</span>
    - Can be installed using cargo.<br><span class="zh-inline">直接用 cargo 就能装。</span>

```bash
cargo install cbindgen
cbindgen 
```

- Functions and structs exported across the C boundary typically use `#[no_mangle]` and, when C needs field-level access, `#[repr(C)]`.<br><span class="zh-inline">导出函数基本都绕不开 `#[no_mangle]`。如果结构体字段布局也要给 C 看，就得再配上 `#[repr(C)]`。</span>
    - The example below uses the classic interface style: pass `**` out-parameters and return `0` on success, non-zero on failure.<br><span class="zh-inline">下面沿用 C 世界最熟悉的那种接口习惯：通过二级指针把对象传出去，返回 `0` 表示成功，非零表示失败。</span>
    - **Opaque vs transparent structs:** `SimpleLogger` is passed around as an opaque pointer, so C never inspects its fields and `#[repr(C)]` is unnecessary. If C code needs to read/write fields directly, `#[repr(C)]` becomes mandatory.<br><span class="zh-inline">**不透明结构体和透明结构体的区别：** `SimpleLogger` 这里只是作为不透明指针在 C 侧流转，C 根本不碰内部字段，所以可以不加 `#[repr(C)]`。如果 C 要直接读写字段，那就必须显式保证布局兼容。</span>

```rust
// Opaque — C only holds a pointer, never inspects fields. No #[repr(C)] needed.
struct SimpleLogger { /* Rust-only fields */ }

// Transparent — C reads/writes fields directly. MUST use #[repr(C)].
#[repr(C)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}
```

```c
typedef struct SimpleLogger SimpleLogger;
uint32_t create_simple_logger(const char *file_name, struct SimpleLogger **out_logger);
uint32_t log_entry(struct SimpleLogger *logger, const char *message);
uint32_t drop_logger(struct SimpleLogger *logger);
```

- Note how much defensive checking is required at the boundary.<br><span class="zh-inline">这地方最忌讳想当然，凡是从外面传进来的指针都得先验一遍。</span>
- We also have to leak memory deliberately so Rust does not drop the logger too early.<br><span class="zh-inline">还有一个很容易忘的点：对象交给 C 管理以后，Rust 这一侧必须先把自动释放停掉，否则刚创建完就没了。</span>

```rust
#[no_mangle] 
pub extern "C" fn create_simple_logger(file_name: *const std::os::raw::c_char, out_logger: *mut *mut SimpleLogger) -> u32 {
    use std::ffi::CStr;
    // Make sure pointer isn't NULL
    if file_name.is_null() || out_logger.is_null() {
        return 1;
    }
    // Safety: The passed in pointer is either NULL or 0-terminated by contract
    let file_name = unsafe {
        CStr::from_ptr(file_name)
    };
    let file_name = file_name.to_str();
    // Make sure that file_name doesn't have garbage characters
    if file_name.is_err() {
        return 1;
    }
    let file_name = file_name.unwrap();
    // Assume some defaults; we'll pass them in in real life
    let new_logger = SimpleLogger::new(file_name, false, LogLevel::CRITICAL);
    // Check that we were able to construct the logger
    if new_logger.is_err() {
        return 1;
    }
    let new_logger = Box::new(new_logger.unwrap());
    // This prevents the Box from being dropped when if goes out of scope
    let logger_ptr: *mut SimpleLogger = Box::leak(new_logger);
    // Safety: logger is non-null and logger_ptr is valid
    unsafe {
        *out_logger = logger_ptr;
    }
    return 0;
}
```

- `log_entry()` has the same style of checks: validate pointers, validate UTF-8, then hand off to safe logic.<br><span class="zh-inline">`log_entry()` 也一样，边界层先把脏活干完，再把调用转进去。</span>

```rust
#[no_mangle]
pub extern "C" fn log_entry(logger: *mut SimpleLogger, message: *const std::os::raw::c_char) -> u32 {
    use std::ffi::CStr;
    if message.is_null() || logger.is_null() {
        return 1;
    }
    // Safety: message is non-null
    let message = unsafe {
        CStr::from_ptr(message)
    };
    let message = message.to_str();
    // Make sure that file_name doesn't have garbage characters
    if message.is_err() {
        return 1;
    }
    // Safety: logger is valid pointer previously constructed by create_simple_logger()
    unsafe {
        (*logger).log_message(LogLevel::CRITICAL, message.unwrap()).is_err() as u32
    }
}

#[no_mangle]
pub extern "C" fn drop_logger(logger: *mut SimpleLogger) -> u32 {
    if logger.is_null() {
        return 1;
    }
    // Safety: logger is valid pointer previously constructed by create_simple_logger()
    unsafe {
        // This constructs a Box<SimpleLogger>, which is dropped when it goes out of scope
        let _ = Box::from_raw(logger);
    }
    0
}
```

- This FFI can be tested from Rust itself, or from a small C program.<br><span class="zh-inline">一套边界接口，既可以在 Rust 测试里先跑通，也可以在 C 侧写个小程序做集成验证。</span>

```rust
#[test]
fn test_c_logger() {
    // The c".." creates a NULL terminated string
    let file_name = c"test.log".as_ptr() as *const std::os::raw::c_char;
    let mut c_logger: *mut SimpleLogger = std::ptr::null_mut();
    assert_eq!(create_simple_logger(file_name, &mut c_logger), 0);
    // This is the manual way to create c"..." strings
    let message = b"message from C\0".as_ptr() as *const std::os::raw::c_char;
    assert_eq!(log_entry(c_logger, message), 0);
    drop_logger(c_logger);
}
```

```c
#include "logger.h"
...
int main() {
    SimpleLogger *logger = NULL;
    if (create_simple_logger("test.log", &logger) == 0) {
        log_entry(logger, "Hello from C");
        drop_logger(logger); /*Needed to close handle, etc.*/
    } 
    ...
}
```

## Ensuring correctness of unsafe code<br><span class="zh-inline">怎么验证 `unsafe` 代码真的站得住</span>

- The short version is simple: writing `unsafe` requires deliberate thought and verification.<br><span class="zh-inline">不是“能跑就算对”，而是“必须知道为什么对”。</span>
    - Always document the safety assumptions and have experienced reviewers inspect them.<br><span class="zh-inline">安全前提要写出来，最好还得让熟悉这块的人再看一遍。</span>
    - Use tools such as `cbindgen`、Miri、Valgrind to help validate behavior.<br><span class="zh-inline">能借工具验证的地方就别只靠肉眼。</span>
    - **Never let a panic unwind across an FFI boundary** because that is undefined behavior. Wrap entry points with `std::panic::catch_unwind`, or configure `panic = "abort"` if that matches the project needs.<br><span class="zh-inline">**绝对不要让 panic 跨越 FFI 边界向外展开**，那会直接触发未定义行为。常见做法是入口处用 `std::panic::catch_unwind` 包起来，或者在配置里把 `panic` 设成 `"abort"`。</span>
    - If a struct crosses the FFI boundary by value or field access, mark it `#[repr(C)]` to lock down layout.<br><span class="zh-inline">凡是跨 FFI 边界按值传递，或者要让 C 直接碰字段的结构体，都应该用 `#[repr(C)]` 固定内存布局。</span>
    - Consult the Rustonomicon: https://doc.rust-lang.org/nomicon/intro.html<br><span class="zh-inline">这个话题真想深挖，Rustonomicon 基本绕不过去。</span>
    - Seek help from internal experts when in doubt.<br><span class="zh-inline">遇到拿不准的地方，别硬撑，找更熟的人一起看。</span>

### Verification tools: Miri vs Valgrind<br><span class="zh-inline">验证工具：Miri 和 Valgrind</span>

C++ 开发者通常熟悉 Valgrind 和各种 sanitizer。Rust 在这些工具之外，还有一个非常特别的 Miri，它对 Rust 特有的未定义行为更敏感。<br><span class="zh-inline">所以两边不是替代关系，更像是互补关系。</span>

| | **Miri** | **Valgrind** | **C++ sanitizers (ASan/MSan/UBSan)** |
|---|---------|-------------|--------------------------------------|
| **What it catches** | Rust-specific UB such as stacked borrows, invalid `enum` discriminants, uninitialized reads, aliasing violations<br><span class="zh-inline">Rust 特有的 UB，像 stacked borrows、非法枚举判别值、未初始化读取、别名违规</span> | Memory leaks, use-after-free, invalid reads/writes, uninitialized memory<br><span class="zh-inline">内存泄漏、释放后使用、非法读写、未初始化内存</span> | Buffer overflow, use-after-free, data races, generic UB<br><span class="zh-inline">缓冲区溢出、释放后使用、数据竞争和更通用的 UB</span> |
| **How it works** | Interprets MIR, Rust 的中层中间表示<br><span class="zh-inline">不是跑本机指令，而是解释执行 MIR</span> | Instruments the compiled binary at runtime<br><span class="zh-inline">在运行时对编译产物做检测</span> | Compile-time instrumentation<br><span class="zh-inline">编译阶段插桩</span> |
| **FFI support** | Cannot cross the FFI boundary<br><span class="zh-inline">过不去 FFI 边界，C 调用会跳过</span> | Works on full compiled binaries including FFI<br><span class="zh-inline">整套二进制都能查，包括 FFI</span> | Works if the C side is also built with sanitizers<br><span class="zh-inline">如果 C 那边也开 sanitizer，就能一起看</span> |
| **Speed** | About 100x slower than native<br><span class="zh-inline">比原生执行慢很多</span> | Roughly 10x 到 50x slower<br><span class="zh-inline">比原生慢一个明显量级</span> | Roughly 2x 到 5x slower<br><span class="zh-inline">相对温和一些</span> |
| **When to use** | Pure Rust `unsafe` code, invariants, unsafe data structures<br><span class="zh-inline">纯 Rust 的 `unsafe` 逻辑和数据结构不变量</span> | FFI code and integration tests of the full binary<br><span class="zh-inline">FFI 与整体验证</span> | C/C++ side of FFI or performance-sensitive testing<br><span class="zh-inline">C/C++ 边的检测，以及更重视性能的测试阶段</span> |
| **Catches aliasing bugs** | Yes, via the Stacked Borrows model<br><span class="zh-inline">能抓</span> | No<br><span class="zh-inline">抓不到</span> | Partial support only<br><span class="zh-inline">只能覆盖一部分场景</span> |

**Recommendation:** Use both. Let Miri inspect pure Rust `unsafe` code, and let Valgrind cover the integrated FFI binary.<br><span class="zh-inline">**建议：** 两边一起上。纯 Rust 的 `unsafe` 逻辑交给 Miri，牵扯 FFI 的整体验证交给 Valgrind。</span>

- **Miri** catches Rust-specific UB that Valgrind cannot see.<br><span class="zh-inline">像别名违规、非法枚举值这些，Valgrind 看不到，Miri 能看出来。</span>

```
rustup +nightly component add miri
cargo +nightly miri test                    # Run all tests under Miri
cargo +nightly miri test -- test_name       # Run a specific test
```

> ⚠️ Miri requires nightly and cannot execute FFI calls. Isolate unsafe Rust logic into self-contained units when testing it.<br><span class="zh-inline">⚠️ Miri 需要 nightly，而且执行不了真正的 FFI 调用。所以最好把纯 Rust 的 `unsafe` 逻辑拆成独立单元去测。</span>

- **Valgrind** remains useful for the compiled program including FFI.<br><span class="zh-inline">这就是老朋友的价值：它能看整套跑起来之后的真实行为。</span>

```
sudo apt install valgrind
cargo install cargo-valgrind
cargo valgrind test                         # Run all tests under Valgrind
```

> Catches leaks in `Box::leak` / `Box::from_raw` patterns that often show up in FFI code.<br><span class="zh-inline">像 `Box::leak`、`Box::from_raw` 这些 FFI 里常见的配对操作，Valgrind 很适合拿来查有没有漏掉释放。</span>

- **cargo-careful** sits somewhere between normal tests and Miri, enabling extra runtime checks.<br><span class="zh-inline">如果觉得 Miri 太重、普通测试又太松，可以拿 `cargo-careful` 做中间层补强。</span>

```
cargo install cargo-careful
cargo +nightly careful test
```

## Unsafe Rust summary<br><span class="zh-inline">本章小结</span>

- `cbindgen` is an excellent tool when exporting Rust APIs to C.<br><span class="zh-inline">如果方向反过来，是从 Rust 去调用 C，则通常会用 `bindgen` 去处理另一侧的绑定。</span>
    - Use `bindgen` for the opposite direction, namely importing C interfaces into Rust.<br><span class="zh-inline">两者别搞反，一个偏导出，一个偏导入。</span>
- Never assume `unsafe` code is correct just because it appears to work. Many bugs hide in invariants that are only violated under rare interleavings or unusual inputs.<br><span class="zh-inline">`unsafe` 代码最会骗人，表面上跑通根本不代表成立。很多问题只会在很偏的输入或时序下冒头。</span>
    - Use tools to verify correctness.<br><span class="zh-inline">能测就测，能查就查。</span>
    - If doubt remains, ask experienced reviewers for help.<br><span class="zh-inline">还有疑问就继续找人复核，别靠胆子硬顶。</span>
- Every `unsafe` block and every caller of an unsafe API should document the safety assumptions being relied on.<br><span class="zh-inline">不光 `unsafe` 块内部要写清楚前提，调用方如果也承担了某些约束，同样应该把这些约束写出来。</span>

# Exercise: Writing a safe FFI wrapper<br><span class="zh-inline">练习：给 FFI 写一个安全包装层</span>

🔴 **Challenge** — requires understanding raw pointers, unsafe blocks, and safe API design<br><span class="zh-inline">🔴 **挑战题**：这题会同时考原始指针、`unsafe` 块和安全 API 设计。</span>

- Write a safe Rust wrapper around an `unsafe` FFI-style function. The exercise simulates a C function that writes a formatted string into a caller-provided buffer.<br><span class="zh-inline">给一个 `unsafe` 风格的 FFI 函数写安全包装层。这个练习模拟的是：C 函数往调用者提供的缓冲区里写一段格式化字符串。</span>
- **Step 1:** Implement `unsafe_greet`, which writes a greeting into a raw `*mut u8` buffer.<br><span class="zh-inline">**第 1 步：** 实现 `unsafe_greet`，把问候语写进原始 `*mut u8` 缓冲区。</span>
- **Step 2:** Write `safe_greet`, which allocates a `Vec<u8>`，调用 `unsafe_greet`，然后返回 `String`。<br><span class="zh-inline">**第 2 步：** 写一个 `safe_greet`，由它负责分配缓冲区、调用不安全函数、再把结果转回 `String`。</span>
- **Step 3:** Add proper `// Safety:` comments to every unsafe block.<br><span class="zh-inline">**第 3 步：** 每个 `unsafe` 块都补上明确的 `// Safety:` 注释。</span>

**Starter code:**<br><span class="zh-inline">**起始代码：**</span>

```rust
use std::fmt::Write as _;

/// Simulates a C function: writes "Hello, <name>!" into buffer.
/// Returns the number of bytes written (excluding null terminator).
/// # Safety
/// - `buf` must point to at least `buf_len` writable bytes
/// - `name` must be a valid pointer to a null-terminated C string
unsafe fn unsafe_greet(buf: *mut u8, buf_len: usize, name: *const u8) -> isize {
    // TODO: Build greeting, copy bytes into buf, return length
    // Hint: use std::ffi::CStr::from_ptr or iterate bytes manually
    todo!()
}

/// Safe wrapper — no unsafe in the public API
fn safe_greet(name: &str) -> Result<String, String> {
    // TODO: Allocate a Vec<u8> buffer, create a null-terminated name,
    // call unsafe_greet inside an unsafe block with Safety comment,
    // convert the result back to a String
    todo!()
}

fn main() {
    match safe_greet("Rustacean") {
        Ok(msg) => println!("{msg}"),
        Err(e) => eprintln!("Error: {e}"),
    }
    // Expected output: Hello, Rustacean!
}
```

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
use std::ffi::CStr;

/// Simulates a C function: writes "Hello, <name>!" into buffer.
/// Returns the number of bytes written, or -1 if buffer too small.
/// # Safety
/// - `buf` must point to at least `buf_len` writable bytes
/// - `name` must be a valid pointer to a null-terminated C string
unsafe fn unsafe_greet(buf: *mut u8, buf_len: usize, name: *const u8) -> isize {
    // Safety: caller guarantees name is a valid null-terminated string
    let name_cstr = unsafe { CStr::from_ptr(name as *const std::os::raw::c_char) };
    let name_str = match name_cstr.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    let greeting = format!("Hello, {}!", name_str);
    if greeting.len() > buf_len {
        return -1;
    }
    // Safety: buf points to at least buf_len writable bytes (caller guarantee)
    unsafe {
        std::ptr::copy_nonoverlapping(greeting.as_ptr(), buf, greeting.len());
    }
    greeting.len() as isize
}

/// Safe wrapper — no unsafe in the public API
fn safe_greet(name: &str) -> Result<String, String> {
    let mut buffer = vec![0u8; 256];
    // Create a null-terminated version of name for the C API
    let name_with_null: Vec<u8> = name.bytes().chain(std::iter::once(0)).collect();

    // Safety: buffer has 256 writable bytes, name_with_null is null-terminated
    let bytes_written = unsafe {
        unsafe_greet(buffer.as_mut_ptr(), buffer.len(), name_with_null.as_ptr())
    };

    if bytes_written < 0 {
        return Err("Buffer too small or invalid name".to_string());
    }

    String::from_utf8(buffer[..bytes_written as usize].to_vec())
        .map_err(|e| format!("Invalid UTF-8: {e}"))
}

fn main() {
    match safe_greet("Rustacean") {
        Ok(msg) => println!("{msg}"),
        Err(e) => eprintln!("Error: {e}"),
    }
}
// Output:
// Hello, Rustacean!
```

</details>

----
