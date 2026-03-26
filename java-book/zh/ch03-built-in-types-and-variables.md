## Built-in Types and Variables<br><span class="zh-inline">内置类型与变量</span>

> **What you'll learn:** How Rust primitives, strings, mutability, and conversions differ from Java's type model.<br><span class="zh-inline">**本章将学习：** Rust 的基础类型、字符串、可变性和类型转换，分别和 Java 的类型模型有哪些差别。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 初级</span>

Rust looks familiar at first because it has integers, booleans, strings, and variables. The differences start showing up once ownership, mutability, and explicit conversions enter the picture.<br><span class="zh-inline">Rust 乍一看不难认，因为它也有整数、布尔、字符串和变量。真正的差异会在所有权、可变性和显式转换这些地方开始冒出来。</span>

## Primitive Types<br><span class="zh-inline">基础类型</span>

| Java | Rust | Notes |
|---|---|---|
| `int` | `i32` | explicit width<br><span class="zh-inline">位宽显式</span> |
| `long` | `i64` | explicit width<br><span class="zh-inline">位宽显式</span> |
| `double` | `f64` | default floating-point choice<br><span class="zh-inline">默认浮点选择</span> |
| `boolean` | `bool` | same general role<br><span class="zh-inline">职责类似</span> |
| `char` | `char` | Unicode scalar value, not UTF-16 code unit<br><span class="zh-inline">Unicode 标量值，不是 UTF-16 单元</span> |
| `byte` | `u8` or `i8` | choose signedness explicitly<br><span class="zh-inline">显式区分有无符号</span> |

Rust forces width and signedness into the spelling. That removes guesswork at API boundaries.<br><span class="zh-inline">Rust 把位宽和有无符号直接写进类型名里，这样 API 边界上的歧义会少很多。</span>

## Variables and Mutability<br><span class="zh-inline">变量与可变性</span>

```rust
let name = "Ada";
let mut count = 0;
count += 1;
```

Bindings are immutable by default. This is one of the earliest places where Rust asks for more explicit intent than Java.<br><span class="zh-inline">绑定默认不可变，这是 Rust 最早要求“意图必须写清楚”的地方之一。</span>

## Shadowing<br><span class="zh-inline">遮蔽</span>

```rust
let port = "8080";
let port: u16 = port.parse().unwrap();
```

Shadowing lets a name be rebound with a new type or refined value. It is often cleaner than introducing `parsedPort`-style names everywhere.<br><span class="zh-inline">遮蔽允许同一个名字重新绑定成更精确的值或新类型。很多时候，它比到处起 `parsedPort` 这种名字更清爽。</span>

## `String` vs `&str`<br><span class="zh-inline">`String` 与 `&str`</span>

This is the first string distinction Java developers must really learn.<br><span class="zh-inline">这是 Java 开发者必须认真吃透的第一个字符串差异。</span>

| Rust type | Rough Java intuition | Meaning |
|---|---|---|
| `String` | owned `String`<br><span class="zh-inline">拥有所有权的字符串</span> | heap-allocated, owned text<br><span class="zh-inline">堆分配、拥有所有权</span> |
| `&str` | read-only string view<br><span class="zh-inline">只读字符串视图</span> | borrowed string slice<br><span class="zh-inline">借用的字符串切片</span> |

If a function only needs to read text, prefer `&str`.<br><span class="zh-inline">如果函数只是读取文本，优先用 `&str`。</span>

## Formatting and Printing<br><span class="zh-inline">格式化与打印</span>

```rust
let name = "Ada";
let score = 42;
println!("{name} scored {score}");
```

Rust formatting uses macros rather than overloaded `println` methods.<br><span class="zh-inline">Rust 的格式化基于宏，不是靠一堆重载打印方法。</span>

## Explicit Conversions<br><span class="zh-inline">显式转换</span>

Rust avoids many implicit numeric conversions:<br><span class="zh-inline">Rust 会尽量避免隐式数值转换：</span>

```rust
let x: i32 = 10;
let y: i64 = x as i64;
```

That can feel verbose at first, but it reduces accidental widening and narrowing.<br><span class="zh-inline">刚开始会觉得啰嗦，但它确实减少了很多无意间的扩大和截断。</span>

## Advice<br><span class="zh-inline">建议</span>

- Use immutable bindings unless mutation is genuinely needed.<br><span class="zh-inline">除非真的要改，否则先用不可变绑定。</span>
- Prefer `&str` for input parameters and `String` for owned returned text.<br><span class="zh-inline">输入参数优先 `&str`，需要返回拥有所有权的文本时再用 `String`。</span>
- Read the type annotations in compiler diagnostics carefully; they are often the fastest way to learn.<br><span class="zh-inline">编译器诊断里的类型信息要认真看，那往往是学得最快的入口。</span>

This chapter is where the surface syntax still feels easy. The harder conceptual shift begins when values start moving rather than merely being referenced.<br><span class="zh-inline">这一章还只是表层语法，整体不算难。真正更硬的思维切换，会从“值开始 move，而不是只是被引用”那里开始。</span>
