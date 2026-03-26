# Phantom Types for Resource Tracking 🟡<br><span class="zh-inline">用于资源跟踪的 Phantom Types 🟡</span>

> **What you'll learn:** How `PhantomData` markers encode register width, DMA direction, and file-descriptor state at the type level — preventing an entire class of resource-mismatch bugs at zero runtime cost.<br><span class="zh-inline">**本章将学到什么：** `PhantomData` 标记怎样把寄存器宽度、DMA 方向和文件描述符状态编码进类型层，从而以零运行时成本消灭整整一类资源错配 bug。</span>
>
> **Cross-references:** [ch05](ch05-protocol-state-machines-type-state-for-r.md) (type-state), [ch06](ch06-dimensional-analysis-making-the-compiler.md) (dimensional types), [ch08](ch08-capability-mixins-compile-time-hardware-.md) (mixins), [ch10](ch10-putting-it-all-together-a-complete-diagn.md) (integration)<br><span class="zh-inline">**交叉阅读：** [ch05](ch05-protocol-state-machines-type-state-for-r.md) 讲 type-state，[ch06](ch06-dimensional-analysis-making-the-compiler.md) 讲量纲类型，[ch08](ch08-capability-mixins-compile-time-hardware-.md) 讲 mixin，[ch10](ch10-putting-it-all-together-a-complete-diagn.md) 讲整体集成。</span>

## The Problem: Mixing Up Resources<br><span class="zh-inline">问题：把不同资源混在一起</span>

Hardware resources look alike in code but aren't interchangeable:<br><span class="zh-inline">很多硬件资源在代码里看着很像，但它们其实根本不能互换：</span>

- A 32-bit register and a 16-bit register are both "registers"<br><span class="zh-inline">32 位寄存器和 16 位寄存器看上去都只是“寄存器”</span>
- A DMA buffer for read and a DMA buffer for write both look like `*mut u8`<br><span class="zh-inline">读方向的 DMA 缓冲区和写方向的 DMA 缓冲区，看上去都像 `*mut u8`</span>
- An open file descriptor and a closed one are both `i32`<br><span class="zh-inline">打开的文件描述符和已经关闭的文件描述符，底层都只是 `i32`</span>

In C:<br><span class="zh-inline">放在 C 里就是这个味道：</span>

```c
// C — all registers look the same
uint32_t read_reg32(volatile void *base, uint32_t offset);
uint16_t read_reg16(volatile void *base, uint32_t offset);

// Bug: reading a 16-bit register with the 32-bit function
uint32_t status = read_reg32(pcie_bar, LINK_STATUS_REG);  // should be reg16!
```

## Phantom Type Parameters<br><span class="zh-inline">Phantom 类型参数</span>

A **phantom type** is a type parameter that appears in the struct definition but not in any field. It exists purely to carry type-level information:<br><span class="zh-inline">所谓 **phantom type**，就是一个出现在结构体类型参数里、却不真正出现在字段里的类型参数。它存在的目的只有一个：携带类型层的信息。</span>

```rust,ignore
use std::marker::PhantomData;

// Register width markers — zero-sized
pub struct Width8;
pub struct Width16;
pub struct Width32;
pub struct Width64;

/// A register handle parameterised by its width.
/// PhantomData<W> costs zero bytes — it's a compile-time-only marker.
pub struct Register<W> {
    base: usize,
    offset: usize,
    _width: PhantomData<W>,
}

impl Register<Width8> {
    pub fn read(&self) -> u8 {
        // ... read 1 byte from base + offset ...
        0 // stub
    }
    pub fn write(&self, _value: u8) {
        // ... write 1 byte ...
    }
}

impl Register<Width16> {
    pub fn read(&self) -> u16 {
        // ... read 2 bytes from base + offset ...
        0 // stub
    }
    pub fn write(&self, _value: u16) {
        // ... write 2 bytes ...
    }
}

impl Register<Width32> {
    pub fn read(&self) -> u32 {
        // ... read 4 bytes from base + offset ...
        0 // stub
    }
    pub fn write(&self, _value: u32) {
        // ... write 4 bytes ...
    }
}

/// PCIe config space register definitions.
pub struct PcieConfig {
    base: usize,
}

impl PcieConfig {
    pub fn vendor_id(&self) -> Register<Width16> {
        Register { base: self.base, offset: 0x00, _width: PhantomData }
    }

    pub fn device_id(&self) -> Register<Width16> {
        Register { base: self.base, offset: 0x02, _width: PhantomData }
    }

    pub fn command(&self) -> Register<Width16> {
        Register { base: self.base, offset: 0x04, _width: PhantomData }
    }

    pub fn status(&self) -> Register<Width16> {
        Register { base: self.base, offset: 0x06, _width: PhantomData }
    }

    pub fn bar0(&self) -> Register<Width32> {
        Register { base: self.base, offset: 0x10, _width: PhantomData }
    }
}

fn pcie_example() {
    let cfg = PcieConfig { base: 0xFE00_0000 };

    let vid: u16 = cfg.vendor_id().read();    // returns u16 ✅
    let bar: u32 = cfg.bar0().read();         // returns u32 ✅

    // Can't mix them up:
    // let bad: u32 = cfg.vendor_id().read(); // ❌ ERROR: expected u16
    // cfg.bar0().write(0u16);                // ❌ ERROR: expected u32
}
```

## DMA Buffer Access Control<br><span class="zh-inline">DMA 缓冲区访问控制</span>

DMA buffers have direction: some are for **device-to-host** (read), others for **host-to-device** (write). Using the wrong direction corrupts data or causes bus errors:<br><span class="zh-inline">DMA 缓冲区是有方向的。有些是 **device-to-host**，也就是读方向；有些是 **host-to-device**，也就是写方向。方向搞反了，不是数据损坏，就是总线错误。</span>

```rust,ignore
use std::marker::PhantomData;

// Direction markers
pub struct ToDevice;     // host writes, device reads
pub struct FromDevice;   // device writes, host reads

/// A DMA buffer with direction enforcement.
pub struct DmaBuffer<Dir> {
    ptr: *mut u8,
    len: usize,
    dma_addr: u64,  // physical address for the device
    _dir: PhantomData<Dir>,
}

impl DmaBuffer<ToDevice> {
    /// Fill the buffer with data to send to the device.
    pub fn write_data(&mut self, data: &[u8]) {
        assert!(data.len() <= self.len);
        // SAFETY: ptr is valid for self.len bytes (allocated at construction),
        // and data.len() <= self.len (asserted above).
        unsafe { std::ptr::copy_nonoverlapping(data.as_ptr(), self.ptr, data.len()) }
    }

    /// Get the DMA address for the device to read from.
    pub fn device_addr(&self) -> u64 {
        self.dma_addr
    }
}

impl DmaBuffer<FromDevice> {
    /// Read data that the device wrote into the buffer.
    pub fn read_data(&self) -> &[u8] {
        // SAFETY: ptr is valid for self.len bytes, and the device
        // has finished writing (caller ensures DMA transfer is complete).
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }

    /// Get the DMA address for the device to write to.
    pub fn device_addr(&self) -> u64 {
        self.dma_addr
    }
}

// Can't write to a FromDevice buffer:
// fn oops(buf: &mut DmaBuffer<FromDevice>) {
//     buf.write_data(&[1, 2, 3]);  // ❌ no method `write_data` on DmaBuffer<FromDevice>
// }

// Can't read from a ToDevice buffer:
// fn oops2(buf: &DmaBuffer<ToDevice>) {
//     let data = buf.read_data();  // ❌ no method `read_data` on DmaBuffer<ToDevice>
// }
```

## File Descriptor Ownership<br><span class="zh-inline">文件描述符所有权状态</span>

A common bug: using a file descriptor after it's been closed. Phantom types can track open/closed state:<br><span class="zh-inline">一个经典 bug 就是：文件描述符已经关了，还在继续用。phantom type 正好可以拿来跟踪“打开”和“关闭”这两种状态。</span>

```rust,ignore
use std::marker::PhantomData;

pub struct Open;
pub struct Closed;

/// A file descriptor with state tracking.
pub struct Fd<State> {
    raw: i32,
    _state: PhantomData<State>,
}

impl Fd<Open> {
    pub fn open(path: &str) -> Result<Self, String> {
        // ... open the file ...
        Ok(Fd { raw: 3, _state: PhantomData }) // stub
    }

    pub fn read(&self, buf: &mut [u8]) -> Result<usize, String> {
        // ... read from fd ...
        Ok(0) // stub
    }

    pub fn write(&self, data: &[u8]) -> Result<usize, String> {
        // ... write to fd ...
        Ok(data.len()) // stub
    }

    /// Close the fd — returns a Closed handle.
    /// The Open handle is consumed, preventing use-after-close.
    pub fn close(self) -> Fd<Closed> {
        // ... close the fd ...
        Fd { raw: self.raw, _state: PhantomData }
    }
}

impl Fd<Closed> {
    // No read() or write() methods — they don't exist on Fd<Closed>.
    // This makes use-after-close a compile error.

    pub fn raw_fd(&self) -> i32 {
        self.raw
    }
}

fn fd_example() -> Result<(), String> {
    let fd = Fd::open("/dev/ipmi0")?;
    let mut buf = [0u8; 256];
    fd.read(&mut buf)?;

    let closed = fd.close();

    // closed.read(&mut buf)?;  // ❌ no method `read` on Fd<Closed>
    // closed.write(&[1])?;     // ❌ no method `write` on Fd<Closed>

    Ok(())
}
```

## Combining Phantom Types with Earlier Patterns<br><span class="zh-inline">把 Phantom Types 和前面的模式拼起来</span>

Phantom types compose with everything we've seen:<br><span class="zh-inline">phantom type 能很自然地和前面那些模式拼在一起：</span>

```rust,ignore
# use std::marker::PhantomData;
# pub struct Width32;
# pub struct Width16;
# pub struct Register<W> { _w: PhantomData<W> }
# impl Register<Width16> { pub fn read(&self) -> u16 { 0 } }
# impl Register<Width32> { pub fn read(&self) -> u32 { 0 } }
# #[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
# pub struct Celsius(pub f64);

/// Combine phantom types (register width) with dimensional types (Celsius).
fn read_temp_sensor(reg: &Register<Width16>) -> Celsius {
    let raw = reg.read();  // guaranteed u16 by phantom type
    Celsius(raw as f64 * 0.0625)  // guaranteed Celsius by return type
}

// The compiler enforces:
// 1. The register is 16-bit (phantom type)
// 2. The result is Celsius (newtype)
// Both at zero runtime cost.
```

### When to Use Phantom Types<br><span class="zh-inline">什么时候该用 Phantom Types</span>

| Scenario<br><span class="zh-inline">场景</span> | Use phantom parameter?<br><span class="zh-inline">适不适合用 phantom 参数</span> |
|----------|:------:|
| Register width encoding<br><span class="zh-inline">寄存器宽度编码</span> | ✅ Always — prevents width mismatch<br><span class="zh-inline">✅ 很适合，能防止宽度错配</span> |
| DMA buffer direction<br><span class="zh-inline">DMA 缓冲区方向</span> | ✅ Always — prevents data corruption<br><span class="zh-inline">✅ 很适合，能防止数据损坏</span> |
| File descriptor state<br><span class="zh-inline">文件描述符状态</span> | ✅ Always — prevents use-after-close<br><span class="zh-inline">✅ 很适合，能防止关闭后继续使用</span> |
| Memory region permissions (R/W/X)<br><span class="zh-inline">内存区域权限（R/W/X）</span> | ✅ Always — enforces access control<br><span class="zh-inline">✅ 很适合，能表达访问控制</span> |
| Generic container (Vec, HashMap)<br><span class="zh-inline">通用容器，比如 Vec、HashMap</span> | ❌ No — use concrete type parameters<br><span class="zh-inline">❌ 没必要，直接用正常类型参数就行</span> |
| Runtime-variable attributes<br><span class="zh-inline">运行时才确定的属性</span> | ❌ No — phantom types are compile-time only<br><span class="zh-inline">❌ 不适合，phantom type 只适合编译期信息</span> |

## Phantom Type Resource Matrix<br><span class="zh-inline">Phantom Type 资源矩阵</span>

```mermaid
flowchart TD
    subgraph "Width Markers / 宽度标记"
        W8["Width8"] 
        W16["Width16"]
        W32["Width32"]
    end
    subgraph "Direction Markers / 方向标记"
        RD["Read"]
        WR["Write"]
    end
    subgraph "Typed Resources / 带类型的资源"
        R1["Register<Width16>"]
        R2["DmaBuffer<Read>"]
        R3["DmaBuffer<Write>"]
    end
    W16 --> R1
    RD --> R2
    WR --> R3
    R2 -.->|"write attempt / 尝试写入"| ERR["❌ Compile Error"]
    style W8 fill:#e1f5fe,color:#000
    style W16 fill:#e1f5fe,color:#000
    style W32 fill:#e1f5fe,color:#000
    style RD fill:#c8e6c9,color:#000
    style WR fill:#fff3e0,color:#000
    style R1 fill:#e8eaf6,color:#000
    style R2 fill:#c8e6c9,color:#000
    style R3 fill:#fff3e0,color:#000
    style ERR fill:#ffcdd2,color:#000
```

## Exercise: Memory Region Permissions<br><span class="zh-inline">练习：内存区域权限</span>

Design phantom types for memory regions with read, write, and execute permissions:<br><span class="zh-inline">给内存区域设计一套 phantom type 权限模型，支持读、写、执行三种权限：</span>
- `MemRegion<ReadOnly>` has `fn read(&self, offset: usize) -> u8`<br><span class="zh-inline">`MemRegion<ReadOnly>` 只有 `fn read(&self, offset: usize) -> u8`</span>
- `MemRegion<ReadWrite>` has both `read` and `write`<br><span class="zh-inline">`MemRegion<ReadWrite>` 同时具备 `read` 和 `write`</span>
- `MemRegion<Executable>` has `read` and `fn execute(&self)`<br><span class="zh-inline">`MemRegion<Executable>` 有 `read` 和 `fn execute(&self)`</span>
- Writing to `ReadOnly` or executing `ReadWrite` should not compile.<br><span class="zh-inline">对 `ReadOnly` 写入，或者对 `ReadWrite` 执行，都应该无法通过编译。</span>

<details>
<summary>Solution<br><span class="zh-inline">参考答案</span></summary>

```rust,ignore
use std::marker::PhantomData;

pub struct ReadOnly;
pub struct ReadWrite;
pub struct Executable;

pub struct MemRegion<Perm> {
    base: *mut u8,
    len: usize,
    _perm: PhantomData<Perm>,
}

// Read available on all permission types
impl<P> MemRegion<P> {
    pub fn read(&self, offset: usize) -> u8 {
        assert!(offset < self.len);
        // SAFETY: offset < self.len (asserted above), base is valid for len bytes.
        unsafe { *self.base.add(offset) }
    }
}

impl MemRegion<ReadWrite> {
    pub fn write(&mut self, offset: usize, val: u8) {
        assert!(offset < self.len);
        // SAFETY: offset < self.len (asserted above), base is valid for len bytes,
        // and &mut self ensures exclusive access.
        unsafe { *self.base.add(offset) = val; }
    }
}

impl MemRegion<Executable> {
    pub fn execute(&self) {
        // Jump to base address (conceptual)
    }
}

// ❌ region_ro.write(0, 0xFF);  // Compile error: no method `write`
// ❌ region_rw.execute();       // Compile error: no method `execute`
```

</details>

## Key Takeaways<br><span class="zh-inline">本章要点</span>

1. **PhantomData carries type-level information at zero size** — the marker exists only for the compiler.<br><span class="zh-inline">**`PhantomData` 能零成本携带类型层信息**：这些标记只给编译器看，运行时不占空间。</span>
2. **Register width mismatches become compile errors** — `Register<Width16>` returns `u16`, not `u32`.<br><span class="zh-inline">**寄存器宽度错配会变成编译错误**：`Register<Width16>` 返回的就是 `u16`，不是 `u32`。</span>
3. **DMA direction is enforced structurally** — `DmaBuffer<Read>` has no `write()` method.<br><span class="zh-inline">**DMA 方向会在结构层被强制执行**：`DmaBuffer<Read>` 就是没有 `write()` 方法。</span>
4. **Combine with dimensional types (ch06)** — `Register<Width16>` can return `Celsius` via the parse step.<br><span class="zh-inline">**可以和量纲类型组合**：`Register<Width16>` 读出来以后，可以在解析阶段进一步包装成 `Celsius`。</span>
5. **Phantom types are compile-time only** — they don't work for runtime-variable attributes; use enums for those.<br><span class="zh-inline">**phantom type 只适合编译期信息**：如果属性要到运行时才知道，那就该用 enum 或其他运行时表示方式。</span>

---
