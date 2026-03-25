# Built-in Rust types<br><span class="zh-inline">Rust 内建类型</span>

> **What you'll learn:** Rust's fundamental types (`i32`, `u64`, `f64`, `bool`, `char`), type inference, explicit type annotations, and how they compare to C/C++ primitive types. No implicit conversions — Rust requires explicit casts.<br><span class="zh-inline">**本章将学到什么：** Rust 的基础类型，例如 `i32`、`u64`、`f64`、`bool`、`char`，以及类型推断、显式类型标注，还有它们和 C/C++ 基本类型的对照关系。Rust 没有隐式类型转换，涉及转换时必须显式 cast。</span>

- Rust has type inference, but also allows explicit specification of the type<br><span class="zh-inline">Rust 支持类型推断，同时也允许显式写出类型。</span>

|  **Description**  |            **Type**            |          **Example**          |
|:-----------------:|:------------------------------:|:-----------------------------:|
| Signed integers<br><span class="zh-inline">有符号整数</span> | i8, i16, i32, i64, i128, isize<br><span class="zh-inline">i8、i16、i32、i64、i128、isize</span> | -1, 42, 1_00_000, 1_00_000i64<br><span class="zh-inline">-1、42、1_00_000、1_00_000i64</span> |
| Unsigned integers<br><span class="zh-inline">无符号整数</span> | u8, u16, u32, u64, u128, usize<br><span class="zh-inline">u8、u16、u32、u64、u128、usize</span> | 0, 42, 42u32, 42u64<br><span class="zh-inline">0、42、42u32、42u64</span> |
| Floating point<br><span class="zh-inline">浮点数</span> | f32, f64<br><span class="zh-inline">f32、f64</span> | 0.0, 0.42<br><span class="zh-inline">0.0、0.42</span> |
| Unicode<br><span class="zh-inline">Unicode 字符</span> | char<br><span class="zh-inline">char</span> | 'a', '$'<br><span class="zh-inline">`'a'`、`'$'`</span> |
| Boolean<br><span class="zh-inline">布尔值</span> | bool<br><span class="zh-inline">bool</span> | true, false<br><span class="zh-inline">true、false</span> |

- Rust permits arbitrarily use of ```_``` between numbers for ease of reading<br><span class="zh-inline">Rust 允许在数字中任意插入 ```_``` 来增强可读性。</span>

----

### Rust type specification and assignment<br><span class="zh-inline">Rust 类型标注与赋值</span>

- Rust uses the ```let``` keyword to assign values to variables. The type of the variable can be optionally specified after a ```:```<br><span class="zh-inline">Rust 使用 ```let``` 给变量赋值。变量类型可以省略，也可以在 ```:``` 后面显式标出。</span>

```rust
fn main() {
    let x : i32 = 42;
    // These two assignments are logically equivalent
    let y : u32 = 42;
    let z = 42u32;
}
```

- Function parameters and return values (if any) require an explicit type. The following takes an u8 parameter and returns u32<br><span class="zh-inline">函数参数和返回值如果存在，都必须显式标注类型。下面这个函数接收一个 `u8` 参数，并返回 `u32`。</span>

```rust
fn foo(x : u8) -> u32
{
    return x * x;
}
```

- Unused variables are prefixed with ```_``` to avoid compiler warnings<br><span class="zh-inline">未使用变量通常以前缀 ```_``` 命名，这样可以避免编译器警告。</span>

----

# Rust type specification and inference<br><span class="zh-inline">Rust 类型标注与类型推断</span>

- Rust can automatically infer the type of the variable based on the context.<br><span class="zh-inline">Rust 可以根据上下文自动推断变量类型。</span>
- [▶ Try it in the Rust Playground](https://play.rust-lang.org/)<br><span class="zh-inline">[▶ 在 Rust Playground 里试一试](https://play.rust-lang.org/)</span>

```rust
fn secret_of_life_u32(x : u32) {
    println!("The u32 secret_of_life is {}", x);
}

fn secret_of_life_u8(x : u8) {
    println!("The u8 secret_of_life is {}", x);
}

fn main() {
    let a = 42; // The let keyword assigns a value; type of a is u32
    let b = 42; // The let keyword assigns a value; inferred type of b is u8
    secret_of_life_u32(a);
    secret_of_life_u8(b);
}
```

# Rust variables and mutability<br><span class="zh-inline">Rust 变量与可变性</span>

- Rust variables are **immutable** by default unless the ```mut``` keyword is used to denote that a variable is mutable. For example, the following code will not compile unless the ```let a = 42``` is changed to ```let mut a = 42```<br><span class="zh-inline">Rust 变量默认是 **不可变** 的，除非显式使用 ```mut``` 表示该变量可变。比如下面这段代码，如果不把 ```let a = 42``` 改成 ```let mut a = 42```，就无法通过编译。</span>

```rust
fn main() {
    let a = 42; // Must be changed to let mut a = 42 to permit the assignment below 
    a = 43;  // Will not compile unless the above is changed
}
```

- Rust permits the reuse of the variable names (shadowing)<br><span class="zh-inline">Rust 允许重复使用变量名，这叫 shadowing。</span>

```rust
fn main() {
    let a = 42;
    {
        let a = 43; //OK: Different variable with the same name
    }
    // a = 43; // Not permitted
    let a = 43; // Ok: New variable and assignment
}
```
