# `no_std` — Rust Without the Standard Library<br><span class="zh-inline">`no_std`：不依赖标准库的 Rust</span>

> **What you'll learn:** How to write Rust for bare-metal and embedded targets using `#![no_std]`, how `core` and `alloc` split responsibilities, what panic handlers do, and how all this compares to embedded C without `libc`.<br><span class="zh-inline">**本章将学到什么：** 如何用 `#![no_std]` 为裸机和嵌入式目标编写 Rust，`core` 与 `alloc` 分别负责什么，panic handler 是干什么的，以及这套模式和不依赖 `libc` 的嵌入式 C 有什么对应关系。</span>

If the background is embedded C, working without `libc` or with a极小运行时本来就不陌生。Rust 也有一等公民级别的对应机制，那就是 **`#![no_std]`**。<br><span class="zh-inline">如果本来就在写嵌入式 C，那么“不带 `libc`”或者“只带很小一层 runtime”这件事一点都不新鲜。Rust 对这类场景也有一套正统支持，就是 **`#![no_std]`**。</span>

## What is `no_std`?<br><span class="zh-inline">`no_std` 到底是什么</span>

When `#![no_std]` is added to the crate root, the compiler removes the implicit `extern crate std;` and links only against **`core`**，必要时再额外接上 **`alloc`**。<br><span class="zh-inline">只要在 crate 根部加上 `#![no_std]`，编译器就不会再偷偷帮忙引入 `std`，而是只链接 **`core`**，如果环境允许堆分配，再自行接上 **`alloc`**。</span>

| Layer<br><span class="zh-inline">层级</span> | What it provides<br><span class="zh-inline">提供什么</span> | Requires OS / heap?<br><span class="zh-inline">需要操作系统或堆吗？</span> |
|-------|-----------------|---------------------|
| `core` | Primitive types, `Option`, `Result`, `Iterator`, math, `slice`, `str`, atomics, `fmt`<br><span class="zh-inline">基础类型、`Option`、`Result`、`Iterator`、数学、切片、字符串切片、原子类型、格式化基础设施</span> | **No**<br><span class="zh-inline">不需要，裸机也能跑</span> |
| `alloc` | `Vec`, `String`, `Box`, `Rc`, `Arc`, `BTreeMap`<br><span class="zh-inline">`Vec`、`String`、`Box`、`Rc`、`Arc`、`BTreeMap`</span> | Needs allocator, but **no OS**<br><span class="zh-inline">需要全局分配器，但不一定需要操作系统</span> |
| `std` | `HashMap`, `fs`, `net`, `thread`, `io`, `env`, `process`<br><span class="zh-inline">`HashMap`、文件系统、网络、线程、I/O、环境变量、进程控制</span> | **Yes**<br><span class="zh-inline">通常需要操作系统支持</span> |

> **Rule of thumb for embedded developers:** if the C project links against `-lc` and uses `malloc`, then `core + alloc` is often可行；如果是纯裸机而且连 `malloc` 都没有，那就老老实实只用 `core`。<br><span class="zh-inline">**给嵌入式开发者的简单经验：** 如果 C 项目会链接 `-lc`，还会用 `malloc`，那么很多时候 `core + alloc` 就够了；如果是纯裸机，连 `malloc` 都没有，那就尽量只用 `core`。</span>

## Declaring `no_std`<br><span class="zh-inline">如何声明 `no_std`</span>

```rust
// src/lib.rs  (or src/main.rs for a binary with #![no_main])
#![no_std]

// You still get everything in `core`
use core::fmt;
use core::result::Result;
use core::option::Option;

// If an allocator exists, opt in to heap-backed types
extern crate alloc;
use alloc::vec::Vec;
use alloc::string::String;
```

For bare-metal binaries, `#![no_main]` and a panic handler are usually needed too:<br><span class="zh-inline">如果是裸机二进制，通常还得配上 `#![no_main]` 和 panic handler：</span>

```rust
#![no_std]
#![no_main]

use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {} // Hang forever on panic
}

// Entry point depends on the HAL and linker script
```

## What you lose and what replaces it<br><span class="zh-inline">失去什么，以及拿什么替代</span>

| `std` feature | `no_std` alternative<br><span class="zh-inline">替代方案</span> |
|---------------|---------------------|
| `println!` | `core::write!` to UART, or `defmt`<br><span class="zh-inline">往 UART 写，或者用 `defmt`</span> |
| `HashMap` | `heapless::FnvIndexMap` or `BTreeMap` with `alloc`<br><span class="zh-inline">`heapless::FnvIndexMap`，或者带 `alloc` 的 `BTreeMap`</span> |
| `Vec` | `heapless::Vec`<br><span class="zh-inline">固定容量的 `heapless::Vec`</span> |
| `String` | `heapless::String` or `&str` |
| `std::io::Read/Write` | `embedded_io::Read/Write` |
| `thread::spawn` | Interrupt handlers, RTIC tasks<br><span class="zh-inline">中断处理或 RTIC 任务</span> |
| `std::time` | Hardware timer peripherals<br><span class="zh-inline">硬件定时器外设</span> |
| `std::fs` | Flash / EEPROM drivers<br><span class="zh-inline">Flash / EEPROM 驱动</span> |

## Notable `no_std` crates for embedded<br><span class="zh-inline">嵌入式里常见的 `no_std` crate</span>

| Crate | Purpose<br><span class="zh-inline">用途</span> | Notes<br><span class="zh-inline">说明</span> |
|-------|---------|-------|
| [`heapless`](https://crates.io/crates/heapless) | Fixed-capacity `Vec`, `String`, `Queue`, `Map` | No allocator needed — all stack or static storage<br><span class="zh-inline">不需要分配器，适合固定容量场景</span> |
| [`defmt`](https://crates.io/crates/defmt) | Efficient embedded logging | Deferred formatting on host side<br><span class="zh-inline">格式化推迟到主机端做，更省目标端资源</span> |
| [`embedded-hal`](https://crates.io/crates/embedded-hal) | HAL traits for SPI / I2C / GPIO / UART | Write once, adapt to many MCUs<br><span class="zh-inline">抽象一次，可适配多种 MCU</span> |
| [`cortex-m`](https://crates.io/crates/cortex-m) | ARM Cortex-M low-level support | Similar in spirit to CMSIS |
| [`cortex-m-rt`](https://crates.io/crates/cortex-m-rt) | Runtime and startup for Cortex-M | Replaces handwritten startup code |
| [`rtic`](https://crates.io/crates/rtic) | Real-time interrupt-driven concurrency | Compile-time scheduled tasks |
| [`embassy`](https://crates.io/crates/embassy-executor) | Async executor for embedded | Bring `async/await` to bare metal |
| [`postcard`](https://crates.io/crates/postcard) | `no_std` binary serialization | Useful where `serde_json` is too heavy |
| [`thiserror`](https://crates.io/crates/thiserror) | Error derive macros | Since v2, works in `no_std` nicely |
| [`smoltcp`](https://crates.io/crates/smoltcp) | `no_std` TCP/IP stack | Networking without a full OS |

## C vs Rust: bare-metal comparison<br><span class="zh-inline">C 与 Rust 的裸机场景对比</span>

A typical embedded C blinky:<br><span class="zh-inline">一个典型的嵌入式 C 闪灯程序：</span>

```c
// C — bare metal, vendor HAL
#include "stm32f4xx_hal.h"

void SysTick_Handler(void) {
    HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
}

int main(void) {
    HAL_Init();
    __HAL_RCC_GPIOA_CLK_ENABLE();
    GPIO_InitTypeDef gpio = { .Pin = GPIO_PIN_5, .Mode = GPIO_MODE_OUTPUT_PP };
    HAL_GPIO_Init(GPIOA, &gpio);
    HAL_SYSTICK_Config(HAL_RCC_GetHCLKFreq() / 1000);
    while (1) {}
}
```

The Rust equivalent:<br><span class="zh-inline">对应的 Rust 写法：</span>

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_halt as _;
use stm32f4xx_hal::{pac, prelude::*};

#[entry]
fn main() -> ! {
    let dp = pac::Peripherals::take().unwrap();
    let gpioa = dp.GPIOA.split();
    let mut led = gpioa.pa5.into_push_pull_output();

    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.freeze();
    let mut delay = dp.TIM2.delay_ms(&clocks);

    loop {
        led.toggle();
        delay.delay_ms(500u32);
    }
}
```

**Key differences for C developers:**<br><span class="zh-inline">**对 C 开发者来说，几个关键差别是：**</span>

- `Peripherals::take()` returns `Option`, which enforces the singleton pattern at compile time.<br><span class="zh-inline">`Peripherals::take()` 返回 `Option`，把“外设只能初始化一次”这件事收进了编译期约束里。</span>
- `.split()` transfers ownership of individual pins so two modules cannot accidentally drive the same pin.<br><span class="zh-inline">`.split()` 会把各个引脚的所有权拆开，避免两个模块同时控制同一根引脚。</span>
- Register access is type-checked, so写只读寄存器这种蠢事更难发生。<br><span class="zh-inline">寄存器访问是带类型检查的，写只读寄存器这类错误更不容易发生。</span>
- With frameworks such as RTIC, the borrow checker also helps prevent races between `main` and interrupt handlers.<br><span class="zh-inline">配合 RTIC 这类框架时，借用检查器还能顺手帮忙防住 `main` 和中断处理之间的数据竞争。</span>

## When to use `no_std` vs `std`<br><span class="zh-inline">什么时候该用 `no_std`，什么时候该用 `std`</span>

```mermaid
flowchart TD
    A["Does your target have an OS?<br/>目标环境有操作系统吗？"] -->|Yes<br/>有| B["Use std<br/>使用 std"]
    A -->|No<br/>没有| C["Do you have a heap allocator?<br/>有堆分配器吗？"]
    C -->|Yes<br/>有| D["Use #![no_std] + extern crate alloc"]
    C -->|No<br/>没有| E["Use #![no_std] with core only"]
    B --> F["Full Vec, HashMap, threads, fs, net<br/>完整容器、线程、文件系统、网络"]
    D --> G["Vec, String, Box, BTreeMap<br/>but no fs/net/threads"]
    E --> H["Fixed-size arrays, heapless collections<br/>no allocation"]
```

# Exercise: `no_std` ring buffer<br><span class="zh-inline">练习：`no_std` 环形缓冲区</span>

🔴 **Challenge** — combines generics, `MaybeUninit`, and `#[cfg(test)]` in a `no_std` setting.<br><span class="zh-inline">🔴 **挑战题**：在 `no_std` 环境下，把泛型、`MaybeUninit` 和 `#[cfg(test)]` 一起用起来。</span>

In embedded systems, a fixed-size ring buffer is a very common building block. It never allocates, capacity is known in advance, and behavior under full load is explicit.<br><span class="zh-inline">在嵌入式系统里，固定容量的环形缓冲区就是标准零件之一。它不分配内存，容量预先确定，写满时会怎么处理也完全可控。</span>

**Requirements:**<br><span class="zh-inline">**要求：**</span>

- Generic over `T: Copy`<br><span class="zh-inline">元素类型是 `T: Copy`</span>
- Fixed capacity `N` via const generics<br><span class="zh-inline">容量 `N` 用 const generics 表示</span>
- `push(&mut self, item: T)` overwrites the oldest element when full<br><span class="zh-inline">`push(&mut self, item: T)` 在满了时覆盖最旧元素</span>
- `pop(&mut self) -> Option<T>` returns the oldest element<br><span class="zh-inline">`pop(&mut self) -> Option<T>` 返回最旧元素</span>
- `len(&self) -> usize`<br><span class="zh-inline">提供 `len(&self) -> usize`</span>
- `is_empty(&self) -> bool`<br><span class="zh-inline">提供 `is_empty(&self) -> bool`</span>
- Must compile with `#![no_std]`<br><span class="zh-inline">必须能在 `#![no_std]` 下编译</span>

```rust
#![no_std]

use core::mem::MaybeUninit;

pub struct RingBuffer<T: Copy, const N: usize> {
    buf: [MaybeUninit<T>; N],
    head: usize,
    tail: usize,
    count: usize,
}

impl<T: Copy, const N: usize> RingBuffer<T, N> {
    pub const fn new() -> Self {
        todo!()
    }
    pub fn push(&mut self, item: T) {
        todo!()
    }
    pub fn pop(&mut self) -> Option<T> {
        todo!()
    }
    pub fn len(&self) -> usize {
        todo!()
    }
    pub fn is_empty(&self) -> bool {
        todo!()
    }
}
```

<details>
<summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
#![no_std]

use core::mem::MaybeUninit;

pub struct RingBuffer<T: Copy, const N: usize> {
    buf: [MaybeUninit<T>; N],
    head: usize,
    tail: usize,
    count: usize,
}

impl<T: Copy, const N: usize> RingBuffer<T, N> {
    pub const fn new() -> Self {
        Self {
            // SAFETY: MaybeUninit does not require initialization
            buf: unsafe { MaybeUninit::uninit().assume_init() },
            head: 0,
            tail: 0,
            count: 0,
        }
    }

    pub fn push(&mut self, item: T) {
        self.buf[self.head] = MaybeUninit::new(item);
        self.head = (self.head + 1) % N;
        if self.count == N {
            self.tail = (self.tail + 1) % N;
        } else {
            self.count += 1;
        }
    }

    pub fn pop(&mut self) -> Option<T> {
        if self.count == 0 {
            return None;
        }
        let item = unsafe { self.buf[self.tail].assume_init() };
        self.tail = (self.tail + 1) % N;
        self.count -= 1;
        Some(item)
    }

    pub fn len(&self) -> usize {
        self.count
    }

    pub fn is_empty(&self) -> bool {
        self.count == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_push_pop() {
        let mut rb = RingBuffer::<u32, 4>::new();
        assert!(rb.is_empty());

        rb.push(10);
        rb.push(20);
        rb.push(30);
        assert_eq!(rb.len(), 3);

        assert_eq!(rb.pop(), Some(10));
        assert_eq!(rb.pop(), Some(20));
        assert_eq!(rb.pop(), Some(30));
        assert_eq!(rb.pop(), None);
    }

    #[test]
    fn overwrite_on_full() {
        let mut rb = RingBuffer::<u8, 3>::new();
        rb.push(1);
        rb.push(2);
        rb.push(3);

        rb.push(4);
        assert_eq!(rb.len(), 3);
        assert_eq!(rb.pop(), Some(2));
        assert_eq!(rb.pop(), Some(3));
        assert_eq!(rb.pop(), Some(4));
        assert_eq!(rb.pop(), None);
    }
}
```

**Why this matters for embedded C developers:**<br><span class="zh-inline">**这道题对嵌入式 C 开发者有价值的地方在于：**</span>

- `MaybeUninit` is Rust's way to represent uninitialized memory explicitly.<br><span class="zh-inline">`MaybeUninit` 是 Rust 里显式表达“这块内存还没初始化”的正规方式。</span>
- The `unsafe` scope is tiny and each use can be单独解释清楚。<br><span class="zh-inline">`unsafe` 范围很小，而且每一处都能给出明确理由。</span>
- `const fn new()` means the buffer can be created in `static` storage without runtime construction.<br><span class="zh-inline">`const fn new()` 说明这个缓冲区可以直接放进 `static`，不需要运行时构造。</span>
- Even though the code is `no_std`, tests can still run on the host with `cargo test`.<br><span class="zh-inline">虽然代码本身是 `no_std`，但测试照样可以在主机上通过 `cargo test` 执行。</span>

</details>
