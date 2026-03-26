## Unsafe Rust and FFI<br><span class="zh-inline">Unsafe Rust 与 FFI</span>

> **What you'll learn:** What `unsafe` actually means in Rust, when Java teams typically need it, and how JNI, JNA, or Panama map onto Rust FFI.<br><span class="zh-inline">**本章将学习：** Rust 里的 `unsafe` 到底意味着什么、Java 团队通常会在什么场景遇到它，以及 JNI、JNA、Panama 与 Rust FFI 的对应关系。</span>
>
> **Difficulty:** 🔴 Advanced<br><span class="zh-inline">**难度：** 🔴 高级</span>

`unsafe` does not turn Rust into chaos mode. It marks code where the compiler can no longer verify every safety invariant. The job of the programmer becomes narrower and more explicit: document the invariant, confine the dangerous operation, and expose a safe API whenever possible.<br><span class="zh-inline">`unsafe` 不是把 Rust 一键切成失控模式。它只是标记出“编译器已经无法替代开发者验证全部安全约束”的代码区块。此时开发者的职责会变得更窄、更明确：写清约束、把危险操作关进小范围、尽可能向外暴露安全 API。</span>

## When Java Developers Usually Meet `unsafe`<br><span class="zh-inline">Java 开发者通常会在什么时候碰到 `unsafe`</span>

- wrapping a C library for use inside Rust<br><span class="zh-inline">给 C 库写 Rust 包装层。</span>
- exporting a Rust library so Java can call it<br><span class="zh-inline">把 Rust 库导出给 Java 调用。</span>
- working with raw buffers, shared memory, or kernel interfaces<br><span class="zh-inline">处理原始缓冲区、共享内存或内核接口。</span>
- implementing performance-sensitive data structures that cannot be expressed in fully safe code<br><span class="zh-inline">实现一些性能敏感、无法完全用安全 Rust 表达的数据结构。</span>

## What `unsafe` Allows<br><span class="zh-inline">`unsafe` 允许做什么</span>

- dereferencing raw pointers<br><span class="zh-inline">解引用裸指针。</span>
- calling unsafe functions<br><span class="zh-inline">调用 unsafe 函数。</span>
- accessing mutable statics<br><span class="zh-inline">访问可变静态变量。</span>
- implementing unsafe traits<br><span class="zh-inline">实现 unsafe trait。</span>

Most real projects should keep `unsafe` in a tiny number of modules.<br><span class="zh-inline">真实项目通常都应该把 `unsafe` 收敛在极少数模块里。</span>

## FFI Boundary: Java and Rust<br><span class="zh-inline">FFI 边界：Java 与 Rust</span>

The cleanest mental model is:<br><span class="zh-inline">最容易记的心智模型是下面这张表：</span>

| Java side<br><span class="zh-inline">Java 侧</span> | Rust side<br><span class="zh-inline">Rust 侧</span> |
|---|---|
| JNI, JNA, or Panama binding | `extern "C"` functions |
| `ByteBuffer` or native memory segment<br><span class="zh-inline">`ByteBuffer` 或原生内存段</span> | raw pointer or slice<br><span class="zh-inline">裸指针或切片</span> |
| Java object lifetime<br><span class="zh-inline">Java 对象生命周期</span> | explicit Rust ownership rules<br><span class="zh-inline">显式 Rust 所有权规则</span> |
| exception and null conventions<br><span class="zh-inline">异常与空值约定</span> | explicit return value or error code<br><span class="zh-inline">显式返回值或错误码</span> |

## Minimal Rust Export<br><span class="zh-inline">最小 Rust 导出示例</span>

```rust
#[no_mangle]
pub extern "C" fn add_numbers(a: i32, b: i32) -> i32 {
    a + b
}
```

That symbol can then be called through a native interface on the Java side.<br><span class="zh-inline">这样导出的符号就可以通过 Java 侧的原生互操作层调用。</span>

## Practical FFI Rules<br><span class="zh-inline">FFI 实战规则</span>

1. Use a stable ABI such as `extern "C"`.<br><span class="zh-inline">使用稳定 ABI，比如 `extern "C"`。</span>
2. Do not let panics cross the FFI boundary.<br><span class="zh-inline">不要让 panic 穿过 FFI 边界。</span>
3. Prefer plain integers, floats, pointers, and opaque handles at the boundary.<br><span class="zh-inline">边界上优先使用整数、浮点、指针和 opaque handle 这类朴素类型。</span>
4. Convert strings and collections at the edge instead of trying to share high-level representations.<br><span class="zh-inline">字符串和集合在边界处转换，别试图共享两边各自的高级表示。</span>
5. Free memory on the same side that allocated it.<br><span class="zh-inline">谁分配内存，最好就由谁释放。</span>

## Opaque Handle Pattern<br><span class="zh-inline">opaque handle 模式</span>

```rust
pub struct Engine {
    counter: u64,
}

#[no_mangle]
pub extern "C" fn engine_new() -> *mut Engine {
    Box::into_raw(Box::new(Engine { counter: 0 }))
}

#[no_mangle]
pub extern "C" fn engine_increment(ptr: *mut Engine) -> u64 {
    let engine = unsafe { ptr.as_mut() }.expect("null engine pointer");
    engine.counter += 1;
    engine.counter
}

#[no_mangle]
pub extern "C" fn engine_free(ptr: *mut Engine) {
    if !ptr.is_null() {
        unsafe { drop(Box::from_raw(ptr)); }
    }
}
```

This pattern is far easier to reason about than trying to expose Rust structs field-by-field to Java code.<br><span class="zh-inline">和把 Rust 结构体字段逐个暴露给 Java 相比，这种 opaque handle 模式要好理解得多，也更稳妥。</span>

## JNI, JNA, or Panama?<br><span class="zh-inline">JNI、JNA、Panama 怎么选</span>

- JNI offers full control, but the API is verbose.<br><span class="zh-inline">JNI 控制力最强，但 API 很啰嗦。</span>
- JNA is easier for quick integration, but adds overhead.<br><span class="zh-inline">JNA 集成更快，但会带来额外开销。</span>
- Panama is the long-term modern direction for native interop on newer JDKs.<br><span class="zh-inline">Panama 则是较新 JDK 上更现代、也更值得关注的长期方向。</span>

The Rust side stays mostly the same in all three cases. The biggest difference is how the Java layer loads symbols and marshals data.<br><span class="zh-inline">对 Rust 侧来说，这三种方案的大体写法差不多。真正差异主要落在 Java 侧如何装载符号和封送数据。</span>

## Advice<br><span class="zh-inline">建议</span>

- Write the safe Rust API first.<br><span class="zh-inline">先把安全 Rust API 设计好。</span>
- Add the FFI layer second.<br><span class="zh-inline">再加 FFI 包装层。</span>
- Audit every pointer assumption.<br><span class="zh-inline">把每一条指针假设都审一遍。</span>
- Keep the boundary narrow and boring.<br><span class="zh-inline">让边界尽量窄、尽量朴素。</span>

That discipline is what turns `unsafe` from a liability into an implementation detail.<br><span class="zh-inline">真正能把 `unsafe` 从负担变成实现细节的，靠的就是这套纪律。</span>
