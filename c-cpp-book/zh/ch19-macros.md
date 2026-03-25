## Rust Macros: From Preprocessor to Metaprogramming<br><span class="zh-inline">Rust 宏：从预处理器到元编程</span>

> **What you'll learn:** How Rust macros work, when to use them instead of functions or generics, and how they replace the C/C++ preprocessor. By the end of this chapter you will be able to write your own `macro_rules!` macros and understand what `#[derive(Debug)]` is really generating for you.<br><span class="zh-inline">**本章将学到什么：** Rust 宏到底是怎么工作的，什么时候该用宏而不是函数或泛型，以及它是怎样取代 C/C++ 预处理器那一套的。学完这一章之后，就能自己写 `macro_rules!` 宏，也能看明白 `#[derive(Debug)]` 背后到底生成了什么代码。</span>

Macros are one of the very first things people see in Rust, for example `println!("hello")`, but却常常是课程里最晚才解释清楚的部分。本章就是专门来补这个坑的。<br><span class="zh-inline">宏明明出场很早，却总被拖到最后才讲，这确实挺别扭。本章就是把这件事一次讲透。</span>

### Why Macros Exist<br><span class="zh-inline">为什么会有宏</span>

Functions and generics already handle most code reuse in Rust. Macros exist to cover the places where the type system and ordinary functions触不到。<br><span class="zh-inline">也就是说，宏不是拿来滥用的，而是用来补函数和泛型做不到的那几块。</span>

| Need | Function/Generic? | Macro? | Why |
|------|-------------------|--------|-----|
| Compute a value | ✅ `fn max<T: Ord>(a: T, b: T) -> T` | — | Type system handles it<br><span class="zh-inline">普通函数和泛型足够了</span> |
| Accept variable number of arguments | ❌ Rust has no variadic functions | ✅ `println!("{} {}", a, b)` | Macros can accept an arbitrary token list<br><span class="zh-inline">宏可以吃任意数量的 token</span> |
| Generate repetitive `impl` blocks | ❌ Not possible with generics alone | ✅ `macro_rules!` | Macros generate source code at compile time<br><span class="zh-inline">宏能在编译期直接生成代码</span> |
| Run code at compile time | ❌ `const fn` is limited | ✅ Procedural macros | Full Rust code can run during compilation<br><span class="zh-inline">过程宏能在编译期跑真正的 Rust 逻辑</span> |
| Conditionally include code | ❌ | ✅ `#[cfg(...)]` | Attribute-style macros and cfg drive compilation<br><span class="zh-inline">属性宏和条件编译控制代码是否存在</span> |

If coming from C/C++, the right mental model is: Rust macros are the only sane replacement for the preprocessor. The difference is that they operate on syntax trees instead of raw text, so they are hygienic and type-aware.<br><span class="zh-inline">从 C/C++ 视角看，Rust 宏可以理解成“正确版本的预处理器替代品”。区别在于它处理的是语法结构，不是纯文本替换，所以不会轻易发生命名污染，也更容易和类型系统配合。</span>

> **For C developers:** Rust macros replace `#define` completely. There is no textual preprocessor. See [ch18](ch18-cpp-rust-semantic-deep-dives.md) for the full preprocessor-to-Rust mapping.<br><span class="zh-inline">**给 C 开发者：** Rust 没有那种文本级预处理器，`#define` 这套思路整体被宏体系取代了。更完整的预处理器映射关系可以看 [ch18](ch18-cpp-rust-semantic-deep-dives.md)。</span>

---

## Declarative Macros with `macro_rules!`<br><span class="zh-inline">声明式宏：`macro_rules!`</span>

Declarative macros, also called macros by example, are the most common macro form in Rust. They work by pattern-matching on syntax, much like `match` works on values.<br><span class="zh-inline">声明式宏也叫“按样例匹配的宏”，是 Rust 里最常见的宏形式。它的工作方式很像 `match`，只不过匹配对象从运行时的值换成了语法结构。</span>

### Basic syntax<br><span class="zh-inline">基础语法</span>

```rust
macro_rules! say_hello {
    () => {
        println!("Hello!");
    };
}

fn main() {
    say_hello!();  // Expands to: println!("Hello!");
}
```

The `!` after the name is the signal to both the compiler and the reader that this is a macro invocation, not an ordinary function call.<br><span class="zh-inline">名字后面那个 `!` 就是在明确告诉编译器和读代码的人：这不是函数调用，这是宏展开。</span>

### Pattern matching with arguments<br><span class="zh-inline">带参数的模式匹配</span>

Macros match token trees via fragment specifiers.<br><span class="zh-inline">宏通过 fragment specifier 去匹配 token tree，不是按字符串硬替换。</span>

```rust
macro_rules! greet {
    // Pattern 1: no arguments
    () => {
        println!("Hello, world!");
    };
    // Pattern 2: one expression argument
    ($name:expr) => {
        println!("Hello, {}!", $name);
    };
}

fn main() {
    greet!();           // "Hello, world!"
    greet!("Rust");     // "Hello, Rust!"
}
```

#### Fragment specifiers reference<br><span class="zh-inline">fragment specifier 速查</span>

| Specifier | Matches | Example |
|-----------|---------|---------|
| `$x:expr` | Any expression<br><span class="zh-inline">任意表达式</span> | `42`, `a + b`, `foo()` |
| `$x:ty` | A type<br><span class="zh-inline">一个类型</span> | `i32`, `Vec<String>`, `&str` |
| `$x:ident` | An identifier<br><span class="zh-inline">标识符</span> | `foo`, `my_var` |
| `$x:pat` | A pattern<br><span class="zh-inline">模式</span> | `Some(x)`, `_`, `(a, b)` |
| `$x:stmt` | A statement<br><span class="zh-inline">语句</span> | `let x = 5;` |
| `$x:block` | A block<br><span class="zh-inline">代码块</span> | `{ println!("hi"); 42 }` |
| `$x:literal` | A literal<br><span class="zh-inline">字面量</span> | `42`, `"hello"`, `true` |
| `$x:tt` | A single token tree<br><span class="zh-inline">单个 token tree</span> | Almost anything |
| `$x:item` | An item like `fn` / `struct` / `impl`<br><span class="zh-inline">条目定义</span> | `fn foo() {}` |

### Repetition — the killer feature<br><span class="zh-inline">重复匹配：最有杀伤力的能力</span>

C/C++ 宏做不到循环展开这种事，而 Rust 宏可以直接重复一段模式。<br><span class="zh-inline">这也是为什么很多样板代码在 Rust 里适合交给宏处理。</span>

```rust
macro_rules! make_vec {
    // Match zero or more comma-separated expressions
    ( $( $element:expr ),* ) => {
        {
            let mut v = Vec::new();
            $( v.push($element); )*  // Repeat for each matched element
            v
        }
    };
}

fn main() {
    let v = make_vec![1, 2, 3, 4, 5];
    println!("{v:?}");  // [1, 2, 3, 4, 5]
}
```

The syntax `$( ... ),*` means “match zero or more repetitions of this pattern separated by commas.” The expansion-side `$( ... )*` then repeats the body once for each matched element.<br><span class="zh-inline">`$( ... ),*` 的意思是“匹配零个或多个、以逗号分隔的模式项”；展开侧的 `$( ... )*` 则表示“每匹配到一个，就把这里复制一遍”。</span>

> **This is exactly how `vec![]` is implemented in the standard library.** The real source is close to the following:<br><span class="zh-inline">**标准库里的 `vec![]` 本质上就是这么实现的。** 实际源码形式和下面非常接近：</span>
>
> ```rust
> macro_rules! vec {
>     () => { Vec::new() };
>     ($elem:expr; $n:expr) => { vec::from_elem($elem, $n) };
>     ($($x:expr),+ $(,)?) => { <[_]>::into_vec(Box::new([$($x),+])) };
> }
> ```
>
> The trailing `$(,)?` means an optional trailing comma is accepted.<br><span class="zh-inline">最后那个 `$(,)?` 就是在允许“多写一个尾逗号”。</span>

#### Repetition operators<br><span class="zh-inline">重复运算符</span>

| Operator | Meaning | Example |
|----------|---------|---------|
| `$( ... )*` | Zero or more<br><span class="zh-inline">零个或多个</span> | `vec![]`, `vec![1]`, `vec![1, 2, 3]` |
| `$( ... )+` | One or more<br><span class="zh-inline">一个或多个</span> | At least one element required |
| `$( ... )?` | Zero or one<br><span class="zh-inline">零个或一个</span> | Optional trailing item |

### Practical example: a `hashmap!` constructor<br><span class="zh-inline">实用例子：自己写个 `hashmap!` 构造器</span>

The standard library gives you `vec![]` but no built-in `hashmap!{}`. Writing one is a good demonstration of pattern repetition.<br><span class="zh-inline">标准库有 `vec![]`，却没有内置 `hashmap!{}`。自己写一个，正好能把模式重复的威力看明白。</span>

```rust
macro_rules! hashmap {
    ( $( $key:expr => $value:expr ),* $(,)? ) => {
        {
            let mut map = std::collections::HashMap::new();
            $( map.insert($key, $value); )*
            map
        }
    };
}

fn main() {
    let scores = hashmap! {
        "Alice" => 95,
        "Bob" => 87,
        "Carol" => 92,  // trailing comma OK thanks to $(,)?
    };
    println!("{scores:?}");
}
```

### Practical example: diagnostic check macro<br><span class="zh-inline">实用例子：诊断检查宏</span>

A common embedded or systems pattern is “check a condition, and if it fails return an error immediately.” This is a good fit for a macro.<br><span class="zh-inline">嵌入式和系统代码里，经常会有“条件不满足就立刻返回错误”的模式，这种场景很适合用宏抽出来。</span>

```rust
use thiserror::Error;

#[derive(Error, Debug)]
enum DiagError {
    #[error("Check failed: {0}")]
    CheckFailed(String),
}

macro_rules! diag_check {
    ($cond:expr, $msg:expr) => {
        if !($cond) {
            return Err(DiagError::CheckFailed($msg.to_string()));
        }
    };
}

fn run_diagnostics(temp: f64, voltage: f64) -> Result<(), DiagError> {
    diag_check!(temp < 85.0, "GPU too hot");
    diag_check!(voltage > 0.8, "Rail voltage too low");
    diag_check!(voltage < 1.5, "Rail voltage too high");
    println!("All checks passed");
    Ok(())
}
```

> **C/C++ comparison:**<br><span class="zh-inline">**和 C/C++ 的对照：**</span>
>
> ```c
> // C preprocessor — textual substitution, no type safety, no hygiene
> #define DIAG_CHECK(cond, msg) \
>     do { if (!(cond)) { log_error(msg); return -1; } } while(0)
> ```
>
> The Rust version returns a proper `Result`, avoids double evaluation traps, and the compiler verifies that `$cond` is a valid boolean expression.<br><span class="zh-inline">Rust 版本会返回正规的 `Result`，没有那种宏参数被重复求值的坑，而且编译器还会检查 `$cond` 真的是个布尔表达式。</span>

### Hygiene: why Rust macros are safer<br><span class="zh-inline">卫生性：为什么 Rust 宏更安全</span>

C/C++ 宏最容易出事的点之一，就是名字碰撞和副作用重复求值。<br><span class="zh-inline">这也是很多人一提宏就头大的根源。</span>

```c
// C: dangerous — `x` could shadow the caller's `x`
#define SQUARE(x) ((x) * (x))
int x = 5;
int result = SQUARE(x++);  // UB: x incremented twice!
```

Rust macros are **hygienic**, which means variables introduced inside the macro body do not accidentally collide with names from the call site.<br><span class="zh-inline">Rust 宏具有**卫生性**，也就是宏内部引入的标识符，不会随便污染调用点的命名空间。</span>

```rust
macro_rules! make_x {
    () => {
        let x = 42;  // This `x` is scoped to the macro expansion
    };
}

fn main() {
    let x = 10;
    make_x!();
    println!("{x}");  // Prints 10, not 42 — hygiene prevents collision
}
```

The macro's `x` and the caller's `x` are treated as distinct bindings by the compiler. That level of hygiene simply does not exist in the C preprocessor world.<br><span class="zh-inline">宏里的 `x` 和外面那个 `x` 在编译器眼里根本就不是一回事。C 预处理器那种纯文本替换，做不到这种防护。</span>

---

## Common Standard Library Macros<br><span class="zh-inline">标准库里那些常见宏</span>

这些宏从第一章就开始用了，只是前面没有专门拆开说。<br><span class="zh-inline">现在正好把它们的作用一起捋顺。</span>

| Macro | What it does | Expands to, simplified |
|-------|-------------|------------------------|
| `println!("{}", x)` | Format and print to stdout with a newline<br><span class="zh-inline">格式化后打印到标准输出并换行</span> | `std::io::_print(format_args!(...))` |
| `eprintln!("{}", x)` | Print to stderr with a newline<br><span class="zh-inline">打印到标准错误并换行</span> | Same idea, different output stream |
| `format!("{}", x)` | Format into a `String`<br><span class="zh-inline">格式化成一个 `String`</span> | Allocates and returns a `String` |
| `vec![1, 2, 3]` | Construct a `Vec` with elements<br><span class="zh-inline">构造一个向量</span> | Approximately `Vec::from([1, 2, 3])` |
| `todo!()` | Mark unfinished code<br><span class="zh-inline">标记尚未完成的代码</span> | `panic!("not yet implemented")` |
| `unimplemented!()` | Mark deliberately missing implementation<br><span class="zh-inline">标记故意暂未实现</span> | `panic!("not implemented")` |
| `unreachable!()` | Mark code that should never execute<br><span class="zh-inline">标记理论上不该走到的路径</span> | `panic!("unreachable")` |
| `assert!(cond)` | Panic if condition is false<br><span class="zh-inline">条件不成立就 panic</span> | `if !cond { panic!(...) }` |
| `assert_eq!(a, b)` | Panic if values differ<br><span class="zh-inline">值不相等就 panic</span> | Also prints both sides on failure |
| `dbg!(expr)` | Print expression and value to stderr, then return the value<br><span class="zh-inline">把表达式和值打到 stderr，再把值原样返回</span> | Debug helper |
| `include_str!("file.txt")` | Embed a file as `&str` at compile time<br><span class="zh-inline">编译期把文件内容嵌成字符串</span> | Reads the file during compilation |
| `include_bytes!("data.bin")` | Embed a file as `&[u8]` at compile time<br><span class="zh-inline">编译期把文件内容嵌成字节数组</span> | Reads the file during compilation |
| `cfg!(condition)` | Evaluate a compile-time condition into `bool`<br><span class="zh-inline">把条件编译判断变成布尔值</span> | `true` or `false` |
| `env!("VAR")` | Read an environment variable at compile time<br><span class="zh-inline">编译期读取环境变量</span> | Compilation fails if missing |
| `concat!("a", "b")` | Concatenate literals at compile time<br><span class="zh-inline">编译期拼接字面量</span> | `"ab"` |

### `dbg!` — the debugging macro you'll use all the time<br><span class="zh-inline">`dbg!`：日常排查时非常顺手的宏</span>

```rust
fn factorial(n: u32) -> u32 {
    if dbg!(n <= 1) {     // Prints: [src/main.rs:2] n <= 1 = false
        dbg!(1)           // Prints: [src/main.rs:3] 1 = 1
    } else {
        dbg!(n * factorial(n - 1))  // Prints intermediate values
    }
}

fn main() {
    dbg!(factorial(4));   // Prints all recursive calls with file:line
}
```

`dbg!` returns the wrapped value, so it can be inserted without changing the surrounding logic. It writes to stderr rather than stdout, so it usually does not disturb normal program output.<br><span class="zh-inline">`dbg!` 的妙处在于它会把包住的值原样返回，所以往表达式中间塞进去也不会改变程序结构。它打印到 stderr，因此通常不会搅乱正常输出。</span>

**Remove all `dbg!` calls before committing.**<br><span class="zh-inline">正式提交前，`dbg!` 最好都清干净，别把调试痕迹留在主代码里。</span>

### Format string syntax<br><span class="zh-inline">格式化字符串语法速查</span>

Since `println!`、`format!`、`eprintln!` and `write!` all share the same formatting machinery, the quick reference below applies to all of them.<br><span class="zh-inline">`println!`、`format!`、`eprintln!`、`write!` 底层都共用一套格式化系统，所以这张速查表基本都适用。</span>

```rust
let name = "sensor";
let value = 3.14159;
let count = 42;

println!("{name}");                    // Variable by name (Rust 1.58+)
println!("{}", name);                  // Positional
println!("{value:.2}");                // 2 decimal places: "3.14"
println!("{count:>10}");               // Right-aligned, width 10: "        42"
println!("{count:0>10}");              // Zero-padded: "0000000042"
println!("{count:#06x}");              // Hex with prefix: "0x002a"
println!("{count:#010b}");             // Binary with prefix: "0b00101010"
println!("{value:?}");                 // Debug format
println!("{value:#?}");                // Pretty-printed Debug format
```

> **For C developers:** Think of this as a type-safe `printf`; the compiler checks that the formatting directives match the argument types.<br><span class="zh-inline">**给 C 开发者：** 可以把它看成类型安全版 `printf`。像 `%s` 配整数、`%d` 配字符串这种错，Rust 会在编译期拦下来。</span>
>
> **For C++ developers:** This replaces a lot of `std::cout << ... << std::setprecision(...)` ceremony with one format string.<br><span class="zh-inline">**给 C++ 开发者：** 它基本取代了那种一长串 `std::cout <<` 配 `std::setprecision` 的组合拳，写法更集中。</span>

---

## Derive Macros<br><span class="zh-inline">派生宏</span>

This book has already used `#[derive(...)]` on almost every struct and enum.<br><span class="zh-inline">前面一路看到的 `#[derive(...)]`，本质上就是派生宏最典型的例子。</span>

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}
```

`#[derive(Debug)]` is a special kind of procedural macro. It inspects the type definition at compile time and generates the corresponding trait implementation automatically.<br><span class="zh-inline">`#[derive(Debug)]` 属于过程宏的一种。它会在编译期读入类型定义，然后自动生成对应 trait 的实现。</span>

```rust
// What #[derive(Debug)] generates for Point:
impl std::fmt::Debug for Point {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Point")
            .field("x", &self.x)
            .field("y", &self.y)
            .finish()
    }
}
```

Without `#[derive(Debug)]`, you would have to write that whole `impl` by hand for every type.<br><span class="zh-inline">如果没有派生宏，这种样板实现每个结构体都得手写一遍，想想就够烦。</span>

### Commonly derived traits<br><span class="zh-inline">常见的派生 trait</span>

| Derive | What it generates | When to use |
|--------|-------------------|-------------|
| `Debug` | `{:?}` formatting<br><span class="zh-inline">调试输出格式</span> | Almost always useful<br><span class="zh-inline">几乎总是值得加</span> |
| `Clone` | `.clone()` support<br><span class="zh-inline">显式复制能力</span> | When values need duplication |
| `Copy` | Implicit copy on assignment<br><span class="zh-inline">赋值时按值复制</span> | Small stack-only types |
| `PartialEq` / `Eq` | Equality comparison<br><span class="zh-inline">相等比较</span> | Types that should compare by value |
| `PartialOrd` / `Ord` | Ordering support<br><span class="zh-inline">排序和比较能力</span> | Types with meaningful ordering |
| `Hash` | Hashing support<br><span class="zh-inline">哈希能力</span> | Hash map / hash set keys |
| `Default` | `Type::default()`<br><span class="zh-inline">默认值构造</span> | Types with sensible zero or empty state |
| `Serialize` / `Deserialize` | Serialization support<br><span class="zh-inline">序列化与反序列化</span> | API and persistence boundary types |

### The derive decision tree<br><span class="zh-inline">该不该派生，怎么判断</span>

```text
Should I derive it?
  │
  ├── Does my type contain only types that implement the trait?
  │     ├── Yes → #[derive] will work
  │     └── No  → Write a manual impl (or skip it)
  │
  └── Will users of my type reasonably expect this behavior?
        ├── Yes → Derive it (Debug, Clone, PartialEq are almost always reasonable)
        └── No  → Don't derive (e.g., don't derive Copy for a type with a file handle)
```

> **C++ comparison:** `#[derive(Clone)]` is like auto-generating a correct copy constructor, and `#[derive(PartialEq)]` is close to auto-generating field-wise equality. Modern C++ has started moving in that direction, but Rust makes it far more routine.<br><span class="zh-inline">**和 C++ 的类比：** `#[derive(Clone)]` 有点像自动生成正确的拷贝构造，`#[derive(PartialEq)]` 则像自动生成按字段比较的 `operator==`。现代 C++ 也在往这个方向靠，但 Rust 把它做成了日常操作。</span>

---

## Attribute Macros<br><span class="zh-inline">属性宏</span>

Attribute macros transform the item they annotate. In practice, the book has already used several of them.<br><span class="zh-inline">属性宏会改写它挂着的那个条目。前面其实已经用过不少，只是当时没有专门点名。</span>

```rust
#[test]                    // Marks a function as a test
fn test_addition() {
    assert_eq!(2 + 2, 4);
}

#[cfg(target_os = "linux")] // Conditionally includes this function
fn linux_only() { /* ... */ }

#[derive(Debug)]            // Generates Debug implementation
struct MyType { /* ... */ }

#[allow(dead_code)]         // Suppresses a compiler warning
fn unused_helper() { /* ... */ }

#[must_use]                 // Warn if return value is discarded
fn compute_checksum(data: &[u8]) -> u32 { /* ... */ }
```

Common built-in attributes:<br><span class="zh-inline">常见内建属性如下：</span>

| Attribute | Purpose |
|-----------|---------|
| `#[test]` | Mark a test function<br><span class="zh-inline">标记测试函数</span> |
| `#[cfg(...)]` | Conditional compilation<br><span class="zh-inline">条件编译</span> |
| `#[derive(...)]` | Auto-generate trait impls<br><span class="zh-inline">自动生成 trait 实现</span> |
| `#[allow(...)]` / `#[deny(...)]` / `#[warn(...)]` | Control lint levels<br><span class="zh-inline">控制 lint 级别</span> |
| `#[must_use]` | Warn on ignored return values<br><span class="zh-inline">返回值被忽略时发警告</span> |
| `#[inline]` / `#[inline(always)]` | Hint inlining behavior<br><span class="zh-inline">提示内联</span> |
| `#[repr(C)]` | C-compatible layout<br><span class="zh-inline">保证 C 兼容布局</span> |
| `#[no_mangle]` | Preserve symbol name<br><span class="zh-inline">保持导出符号名</span> |
| `#[deprecated]` | Mark deprecated items<br><span class="zh-inline">标记废弃接口</span> |

> **For C/C++ developers:** Attributes replace a weird mixture of pragmas, compiler-specific attributes, and preprocessor tricks. The nice part is that they are part of Rust's actual syntax rather than bolt-on hacks.<br><span class="zh-inline">**给 C/C++ 开发者：** 这套属性机制，本质上取代了 pragma、编译器专属 attribute、以及部分预处理器技巧的混搭局面。好处是它们属于语言正经语法的一部分，不是外挂补丁。</span>

---

## Procedural Macros<br><span class="zh-inline">过程宏</span>

Procedural macros are separate Rust programs that run at compile time and generate code. They are more powerful than `macro_rules!`, but also more complex and heavier to write.<br><span class="zh-inline">过程宏本质上是“编译期运行的 Rust 程序”。它比 `macro_rules!` 更强，但复杂度也高不少，不是拿来随手乱上的。</span>

There are three kinds:<br><span class="zh-inline">过程宏主要分三类：</span>

| Kind | Syntax | Example | What it does |
|------|--------|---------|-------------|
| **Function-like** | `my_macro!(...)` | `sql!(SELECT * FROM users)` | Parse custom syntax and generate Rust code<br><span class="zh-inline">解析自定义语法并生成 Rust 代码</span> |
| **Derive** | `#[derive(MyTrait)]` | `#[derive(Serialize)]` | Generate a trait impl from a type definition<br><span class="zh-inline">根据类型定义生成 trait 实现</span> |
| **Attribute** | `#[my_attr]` | `#[tokio::main]`, `#[instrument]` | Transform the annotated item<br><span class="zh-inline">改写被标注的函数或类型</span> |

### You have already used proc macros<br><span class="zh-inline">其实已经用过过程宏了</span>

- `#[derive(Error)]` from `thiserror` generates `Display` and `From` implementations for error enums.<br><span class="zh-inline">`thiserror` 里的 `#[derive(Error)]` 会帮错误枚举生成 `Display` 和 `From` 相关实现。</span>
- `#[derive(Serialize, Deserialize)]` from `serde` generates serialization and deserialization code.<br><span class="zh-inline">`serde` 的这两个派生宏会自动生成序列化和反序列化逻辑。</span>
- `#[tokio::main]` rewrites `async fn main()` into runtime setup plus `block_on` machinery.<br><span class="zh-inline">`#[tokio::main]` 会把异步入口函数改写成运行时初始化加执行包装。</span>
- `#[test]` is also effectively part of this compile-time registration machinery.<br><span class="zh-inline">`#[test]` 也可以看成这类“编译期登记和改写”的一部分。</span>

### When to write your own proc macro<br><span class="zh-inline">什么时候需要自己写过程宏</span>

During normal application development, writing a custom proc macro is not common. Reach for it when:<br><span class="zh-inline">正常业务开发里，自己动手写过程宏并不算高频操作。一般是遇到下面这些需求时才值得考虑：</span>

- You need to inspect struct fields or enum variants at compile time.<br><span class="zh-inline">需要在编译期读取结构体字段或枚举变体信息。</span>
- You are building a domain-specific language.<br><span class="zh-inline">需要做一套领域特定语法。</span>
- You need to transform function signatures or wrap functions systematically.<br><span class="zh-inline">需要批量改写函数签名或给函数统一包一层逻辑。</span>

For most day-to-day code, `macro_rules!` or a plain generic function is still the better choice.<br><span class="zh-inline">大多数日常代码场景里，`macro_rules!` 或普通函数就够了，别动不动就把武器升级过头。</span>

> **C++ comparison:** Procedural macros occupy a space similar to code generators, heavy template metaprogramming, or external tools like `protoc`. The key difference is that Rust integrates them directly into the Cargo build pipeline.<br><span class="zh-inline">**和 C++ 的类比：** 过程宏有点像代码生成器、重型模板元编程，或者 `protoc` 这类外部工具。最大的区别是 Rust 把它们直接纳入 Cargo 构建链里，不需要额外拼装那么多外部步骤。</span>

---

## When to Use What: Macros vs Functions vs Generics<br><span class="zh-inline">到底该用宏、函数，还是泛型</span>

```text
Need to generate code?
  │
  ├── No → Use a function or generic function
  │         (simpler, better error messages, IDE support)
  │
  └── Yes ─┬── Variable number of arguments?
            │     └── Yes → macro_rules! (e.g., println!, vec!)
            │
            ├── Repetitive impl blocks for many types?
            │     └── Yes → macro_rules! with repetition
            │
            ├── Need to inspect struct fields?
            │     └── Yes → Derive macro (proc macro)
            │
            ├── Need custom syntax (DSL)?
            │     └── Yes → Function-like proc macro
            │
            └── Need to transform a function/struct?
                  └── Yes → Attribute proc macro
```

**General guideline:** if a normal function or generic function can solve the problem, prefer that. Macros usually have worse error messages, are harder to debug, and IDE support inside macro bodies is often weaker.<br><span class="zh-inline">**总体原则：** 只要普通函数或泛型函数能解决，就先用它们。宏的错误信息通常更拧巴，调试体验也更差，IDE 支持也没那么丝滑。</span>

---

## Exercises<br><span class="zh-inline">练习</span>

### 🟢 Exercise 1: `min!` macro<br><span class="zh-inline">🟢 练习 1：实现 `min!` 宏</span>

Write a `min!` macro that:<br><span class="zh-inline">写一个 `min!` 宏，要求如下：</span>

- `min!(a, b)` returns the smaller of two values.<br><span class="zh-inline">`min!(a, b)` 返回两个值里更小的那个。</span>
- `min!(a, b, c)` returns the smallest of three values.<br><span class="zh-inline">`min!(a, b, c)` 返回三个值里最小的那个。</span>
- It works for any type implementing `PartialOrd`.<br><span class="zh-inline">凡是实现了 `PartialOrd` 的类型都能用。</span>

**Hint:** You will need two match arms in `macro_rules!`.<br><span class="zh-inline">**提示：** 这个宏至少需要两个分支匹配臂。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
macro_rules! min {
    ($a:expr, $b:expr) => {
        if $a < $b { $a } else { $b }
    };
    ($a:expr, $b:expr, $c:expr) => {
        min!(min!($a, $b), $c)
    };
}

fn main() {
    println!("{}", min!(3, 7));        // 3
    println!("{}", min!(9, 2, 5));     // 2
    println!("{}", min!(1.5, 0.3));    // 0.3
}
```

**Note:** In production code, prefer `std::cmp::min` or methods like `a.min(b)`. This exercise is mainly about understanding multi-arm macro expansion.<br><span class="zh-inline">**说明：** 真到生产代码里，优先还是用 `std::cmp::min` 或类似 `a.min(b)` 的现成方法。这里主要是为了练多分支宏的写法。</span>

</details>

### 🟡 Exercise 2: `hashmap!` from scratch<br><span class="zh-inline">🟡 练习 2：从零写一个 `hashmap!`</span>

Without looking back at the earlier example, write a `hashmap!` macro that:<br><span class="zh-inline">先别回头抄前面的例子，自己写一个 `hashmap!`，要求如下：</span>

- Creates a `HashMap` from `key => value` pairs.<br><span class="zh-inline">能够根据 `key => value` 形式的输入构造 `HashMap`。</span>
- Supports trailing commas.<br><span class="zh-inline">支持尾逗号。</span>
- Works with any key type that implements hashing.<br><span class="zh-inline">只要 key 是可哈希类型，都能用。</span>

Test with:<br><span class="zh-inline">测试用例如下：</span>

```rust
let m = hashmap! {
    "name" => "Alice",
    "role" => "Engineer",
};
assert_eq!(m["name"], "Alice");
assert_eq!(m.len(), 2);
```

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
use std::collections::HashMap;

macro_rules! hashmap {
    ( $( $key:expr => $val:expr ),* $(,)? ) => {{
        let mut map = HashMap::new();
        $( map.insert($key, $val); )*
        map
    }};
}

fn main() {
    let m = hashmap! {
        "name" => "Alice",
        "role" => "Engineer",
    };
    assert_eq!(m["name"], "Alice");
    assert_eq!(m.len(), 2);
    println!("Tests passed!");
}
```

</details>

### 🟡 Exercise 3: `assert_approx_eq!` for floating-point comparison<br><span class="zh-inline">🟡 练习 3：给浮点比较写个 `assert_approx_eq!`</span>

Write a macro `assert_approx_eq!(a, b, epsilon)` that panics if `|a - b| > epsilon`. This is useful in tests where exact floating-point equality is unrealistic.<br><span class="zh-inline">写一个宏 `assert_approx_eq!(a, b, epsilon)`，当 `|a - b| > epsilon` 时触发 panic。浮点数测试里经常需要这种“近似相等”判断。</span>

Test with:<br><span class="zh-inline">可以用下面这些例子测试：</span>

```rust
assert_approx_eq!(0.1 + 0.2, 0.3, 1e-10);        // Should pass
assert_approx_eq!(3.14159, std::f64::consts::PI, 1e-4); // Should pass
// assert_approx_eq!(1.0, 2.0, 0.5);              // Should panic
```

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
macro_rules! assert_approx_eq {
    ($a:expr, $b:expr, $eps:expr) => {
        let (a, b, eps) = ($a as f64, $b as f64, $eps as f64);
        let diff = (a - b).abs();
        if diff > eps {
            panic!(
                "assertion failed: |{} - {}| = {} > {} (epsilon)",
                a, b, diff, eps
            );
        }
    };
}

fn main() {
    assert_approx_eq!(0.1 + 0.2, 0.3, 1e-10);
    assert_approx_eq!(3.14159, std::f64::consts::PI, 1e-4);
    println!("All float comparisons passed!");
}
```

</details>

### 🔴 Exercise 4: `impl_display_for_enum!`<br><span class="zh-inline">🔴 练习 4：实现 `impl_display_for_enum!`</span>

Write a macro that generates a `Display` implementation for simple C-like enums. Given the following invocation:<br><span class="zh-inline">写一个宏，用来给简单的 C 风格枚举生成 `Display` 实现。假设调用形式如下：</span>

```rust
impl_display_for_enum! {
    enum Color {
        Red => "red",
        Green => "green",
        Blue => "blue",
    }
}
```

It should generate both the enum definition and the matching `impl Display` block that maps each variant to its string form.<br><span class="zh-inline">它应该同时生成 `enum Color { ... }` 的定义，以及相应的 `impl Display for Color`，把每个变体映射到指定字符串。</span>

**Hint:** You will need both repetition and several fragment specifiers.<br><span class="zh-inline">**提示：** 这里既会用到重复模式，也会用到多个 fragment specifier。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
use std::fmt;

macro_rules! impl_display_for_enum {
    (enum $name:ident { $( $variant:ident => $display:expr ),* $(,)? }) => {
        #[derive(Debug, Clone, Copy, PartialEq)]
        enum $name {
            $( $variant ),*
        }

        impl fmt::Display for $name {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                match self {
                    $( $name::$variant => write!(f, "{}", $display), )*
                }
            }
        }
    };
}

impl_display_for_enum! {
    enum Color {
        Red => "red",
        Green => "green",
        Blue => "blue",
    }
}

fn main() {
    let c = Color::Green;
    println!("Color: {c}");          // "Color: green"
    println!("Debug: {c:?}");        // "Debug: Green"
    assert_eq!(format!("{}", Color::Red), "red");
    println!("All tests passed!");
}
```

</details>
