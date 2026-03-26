## Unsafe Rust and FFI

> **What you'll learn:** What `unsafe` actually means in Rust, when Java teams typically need it, and how JNI, JNA, or Panama map onto Rust FFI.
>
> **Difficulty:** 🔴 Advanced

`unsafe` does not turn Rust into chaos mode. It marks code where the compiler can no longer verify every safety invariant. The job of the programmer becomes narrower and more explicit: document the invariant, confine the dangerous operation, and expose a safe API whenever possible.

## When Java Developers Usually Meet `unsafe`

- wrapping a C library for use inside Rust
- exporting a Rust library so Java can call it
- working with raw buffers, shared memory, or kernel interfaces
- implementing performance-sensitive data structures that cannot be expressed in fully safe code

## What `unsafe` Allows

- dereferencing raw pointers
- calling unsafe functions
- accessing mutable statics
- implementing unsafe traits

Most real projects should keep `unsafe` in a tiny number of modules.

## FFI Boundary: Java and Rust

The cleanest mental model is:

| Java side | Rust side |
|---|---|
| JNI, JNA, or Panama binding | `extern "C"` functions |
| `ByteBuffer` or native memory segment | raw pointer or slice |
| Java object lifetime | explicit Rust ownership rules |
| exception and null conventions | explicit return value or error code |

## Minimal Rust Export

```rust
#[no_mangle]
pub extern "C" fn add_numbers(a: i32, b: i32) -> i32 {
    a + b
}
```

That symbol can then be called through a native interface on the Java side.

## Practical FFI Rules

1. Use a stable ABI such as `extern "C"`.
2. Do not let panics cross the FFI boundary.
3. Prefer plain integers, floats, pointers, and opaque handles at the boundary.
4. Convert strings and collections at the edge instead of trying to share high-level representations.
5. Free memory on the same side that allocated it.

## Opaque Handle Pattern

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

This pattern is far easier to reason about than trying to expose Rust structs field-by-field to Java code.

## JNI, JNA, or Panama?

- JNI offers full control, but the API is verbose.
- JNA is easier for quick integration, but adds overhead.
- Panama is the long-term modern direction for native interop on newer JDKs.

The Rust side stays mostly the same in all three cases. The biggest difference is how the Java layer loads symbols and marshals data.

## Advice

- Write the safe Rust API first.
- Add the FFI layer second.
- Audit every pointer assumption.
- Keep the boundary narrow and boring.

That discipline is what turns `unsafe` from a liability into an implementation detail.
