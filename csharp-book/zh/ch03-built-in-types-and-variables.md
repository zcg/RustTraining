## Variables and Mutability<br><span class="zh-inline">变量与可变性</span>

> **What you'll learn:** Rust's variable declaration and mutability model compared with C# `var` and `const`, primitive type mappings, the important distinction between `String` and `&str`, type inference, and Rust's stricter approach to casting and conversions.<br><span class="zh-inline">**本章将学到什么：** 对照理解 Rust 的变量声明与可变性模型，理解它和 C# 里的 `var`、`const` 有什么差别，熟悉基础类型映射，掌握 `String` 与 `&str` 的关键区别，理解类型推断，以及 Rust 对类型转换更严格的处理方式。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 入门</span>

### C# Variable Declaration<br><span class="zh-inline">C# 的变量声明</span>

```csharp
// C# - Variables are mutable by default
int count = 0;           // Mutable
count = 5;               // ✅ Works

// readonly fields (class-level only, not for local variables)
// readonly int maxSize = 100;  // Immutable after initialization

const int BUFFER_SIZE = 1024; // Compile-time constant (works as local or field)
```

### Rust Variable Declaration<br><span class="zh-inline">Rust 的变量声明</span>

```rust
// Rust - Variables are immutable by default
let count = 0;           // Immutable by default
// count = 5;            // ❌ Compile error: cannot assign twice to immutable variable

let mut count = 0;       // Explicitly mutable
count = 5;               // ✅ Works

const BUFFER_SIZE: usize = 1024; // Compile-time constant
```

Rust 在这里的核心思路很简单：默认别改，真要改就把 `mut` 写出来。<br><span class="zh-inline">这和 C# 基本反着来。C# 里默认可变，想收紧要额外写；Rust 则先把变化这件事当成需要明确声明的动作。</span>

### Key Mental Shift for C# Developers<br><span class="zh-inline">给 C# 开发者的关键心智转变</span>

```rust
// Think of 'let' as C#'s readonly field semantics applied to all variables
let name = "John";       // Like a readonly field: once set, cannot change
let mut age = 30;        // Like: int age = 30;

// Variable shadowing (unique to Rust)
let spaces = "   ";      // String
let spaces = spaces.len(); // Now it's a number (usize)
// This is different from mutation - we're creating a new variable
```

`shadowing` 很容易被误会成“换皮的可变赋值”，其实不是一回事。<br><span class="zh-inline">它不是把原变量改了，而是重新引入了一个同名新变量。这个机制在类型转换、去空格、解析字符串这类场景里非常顺手。</span>

### Practical Example: Counter<br><span class="zh-inline">实战例子：计数器</span>

```csharp
// C# version
public class Counter
{
    private int value = 0;
    
    public void Increment()
    {
        value++;  // Mutation
    }
    
    public int GetValue() => value;
}
```

```rust
// Rust version
pub struct Counter {
    value: i32,  // Private by default
}

impl Counter {
    pub fn new() -> Counter {
        Counter { value: 0 }
    }
    
    pub fn increment(&mut self) {  // &mut needed for mutation
        self.value += 1;
    }
    
    pub fn get_value(&self) -> i32 {
        self.value
    }
}
```

这里顺手就把 Rust 的另一个常识带出来了：方法要改内部状态，就得拿到 `&mut self`。<br><span class="zh-inline">也就是说，可变性不只是变量层面的事，方法签名层面也会被强制写清楚。</span>

***

## Data Types Comparison<br><span class="zh-inline">数据类型对照</span>

### Primitive Types<br><span class="zh-inline">基础类型</span>

| C# Type<br><span class="zh-inline">C# 类型</span> | Rust Type | Size<br><span class="zh-inline">位宽</span> | Range<br><span class="zh-inline">范围</span> |
|---------|-----------|------|-------|
| `byte`<br><span class="zh-inline">`byte`</span> | `u8`<br><span class="zh-inline">`u8`</span> | 8 bits<br><span class="zh-inline">8 位</span> | 0 to 255<br><span class="zh-inline">0 到 255</span> |
| `sbyte`<br><span class="zh-inline">`sbyte`</span> | `i8`<br><span class="zh-inline">`i8`</span> | 8 bits<br><span class="zh-inline">8 位</span> | -128 to 127<br><span class="zh-inline">-128 到 127</span> |
| `short`<br><span class="zh-inline">`short`</span> | `i16`<br><span class="zh-inline">`i16`</span> | 16 bits<br><span class="zh-inline">16 位</span> | -32,768 to 32,767<br><span class="zh-inline">-32,768 到 32,767</span> |
| `ushort`<br><span class="zh-inline">`ushort`</span> | `u16`<br><span class="zh-inline">`u16`</span> | 16 bits<br><span class="zh-inline">16 位</span> | 0 to 65,535<br><span class="zh-inline">0 到 65,535</span> |
| `int`<br><span class="zh-inline">`int`</span> | `i32`<br><span class="zh-inline">`i32`</span> | 32 bits<br><span class="zh-inline">32 位</span> | -2³¹ to 2³¹-1<br><span class="zh-inline">-2³¹ 到 2³¹-1</span> |
| `uint`<br><span class="zh-inline">`uint`</span> | `u32`<br><span class="zh-inline">`u32`</span> | 32 bits<br><span class="zh-inline">32 位</span> | 0 to 2³²-1<br><span class="zh-inline">0 到 2³²-1</span> |
| `long`<br><span class="zh-inline">`long`</span> | `i64`<br><span class="zh-inline">`i64`</span> | 64 bits<br><span class="zh-inline">64 位</span> | -2⁶³ to 2⁶³-1<br><span class="zh-inline">-2⁶³ 到 2⁶³-1</span> |
| `ulong`<br><span class="zh-inline">`ulong`</span> | `u64`<br><span class="zh-inline">`u64`</span> | 64 bits<br><span class="zh-inline">64 位</span> | 0 to 2⁶⁴-1<br><span class="zh-inline">0 到 2⁶⁴-1</span> |
| `float`<br><span class="zh-inline">`float`</span> | `f32`<br><span class="zh-inline">`f32`</span> | 32 bits<br><span class="zh-inline">32 位</span> | IEEE 754<br><span class="zh-inline">IEEE 754</span> |
| `double`<br><span class="zh-inline">`double`</span> | `f64`<br><span class="zh-inline">`f64`</span> | 64 bits<br><span class="zh-inline">64 位</span> | IEEE 754<br><span class="zh-inline">IEEE 754</span> |
| `bool`<br><span class="zh-inline">`bool`</span> | `bool`<br><span class="zh-inline">`bool`</span> | 1 bit<br><span class="zh-inline">1 位逻辑值</span> | true/false<br><span class="zh-inline">真 / 假</span> |
| `char`<br><span class="zh-inline">`char`</span> | `char`<br><span class="zh-inline">`char`</span> | 32 bits<br><span class="zh-inline">32 位</span> | Unicode scalar<br><span class="zh-inline">Unicode 标量值</span> |

### Size Types (Important!)<br><span class="zh-inline">尺寸类型（很重要）</span>

```csharp
// C# - int is always 32-bit
int arrayIndex = 0;
long fileSize = file.Length;
```

```rust
// Rust - size types match pointer size (32-bit or 64-bit)
let array_index: usize = 0;    // Like size_t in C
let file_size: u64 = file.len(); // Explicit 64-bit
```

`usize` 和 `isize` 是 Rust 里很容易早期忽略、后面频繁见到的类型。<br><span class="zh-inline">只要牵扯到索引、容量、长度、切片范围，这俩就经常跳出来，因为它们专门表示“适合当前平台地址宽度的大小”。</span>

### Type Inference<br><span class="zh-inline">类型推断</span>

```csharp
// C# - var keyword
var name = "John";        // string
var count = 42;           // int
var price = 29.99;        // double
```

```rust
// Rust - automatic type inference
let name = "John";        // &str (string slice)
let count = 42;           // i32 (default integer)
let price = 29.99;        // f64 (default float)

// Explicit type annotations
let count: u32 = 42;
let price: f32 = 29.99;
```

Rust 的类型推断很强，但它不是“模糊处理”。<br><span class="zh-inline">一旦上下文不够，或者默认推断类型和需求不一致，就得老老实实补标注。尤其是空集合、数值类型和泛型代码里，这种事很常见。</span>

### Arrays and Collections Overview<br><span class="zh-inline">数组与集合概览</span>

```csharp
// C# - reference types, heap allocated
int[] numbers = new int[5];        // Fixed size
List<int> list = new List<int>();  // Dynamic size
```

```rust
// Rust - multiple options
let numbers: [i32; 5] = [1, 2, 3, 4, 5];  // Stack array, fixed size
let mut list: Vec<i32> = Vec::new();       // Heap vector, dynamic size
```

Rust 对“固定大小数组”和“动态大小向量”分得更清楚。<br><span class="zh-inline">数组 `[T; N]` 是类型级别就带长度的，`Vec<T>` 才是运行时可增长的集合。别把两者混成一回事，不然一到函数参数和 trait 实现就容易懵。</span>

***

## String Types: String vs &str<br><span class="zh-inline">字符串类型：`String` 与 `&str`</span>

This is one of the most confusing concepts for C# developers, so it deserves careful treatment.<br><span class="zh-inline">这是 C# 开发者进 Rust 最容易卡住的地方之一，所以必须掰细了讲。很多前期的所有权、借用、函数参数设计问题，最后都会绕回这里。</span>

### C# String Handling<br><span class="zh-inline">C# 的字符串处理</span>

```csharp
// C# - Simple string model
string name = "John";           // String literal
string greeting = "Hello, " + name;  // String concatenation
string upper = name.ToUpper();  // Method call
```

### Rust String Types<br><span class="zh-inline">Rust 的字符串类型</span>

```rust
// Rust - Two main string types

// 1. &str (string slice) - like ReadOnlySpan<char> in C#
let name: &str = "John";        // String literal (immutable, borrowed)

// 2. String - like StringBuilder or mutable string
let mut greeting = String::new();       // Empty string
greeting.push_str("Hello, ");          // Append
greeting.push_str(name);               // Append

// Or create directly
let greeting = String::from("Hello, John");
let greeting = "Hello, John".to_string();  // Convert &str to String
```

### When to Use Which?<br><span class="zh-inline">什么时候该用哪个</span>

| Scenario<br><span class="zh-inline">场景</span> | Use<br><span class="zh-inline">建议使用</span> | C# Equivalent<br><span class="zh-inline">在 C# 里更接近的东西</span> |
|----------|-----|---------------|
| String literals<br><span class="zh-inline">字符串字面量</span> | `&str`<br><span class="zh-inline">`&str`</span> | `string` literal<br><span class="zh-inline">`string` 字面量</span> |
| Function parameters (read-only)<br><span class="zh-inline">只读函数参数</span> | `&str`<br><span class="zh-inline">`&str`</span> | `string` or `ReadOnlySpan<char>`<br><span class="zh-inline">`string` 或 `ReadOnlySpan<char>`</span> |
| Owned, mutable strings<br><span class="zh-inline">需要拥有并可修改的字符串</span> | `String`<br><span class="zh-inline">`String`</span> | `StringBuilder`<br><span class="zh-inline">有点像 `StringBuilder`</span> |
| Return owned strings<br><span class="zh-inline">返回拥有所有权的字符串</span> | `String`<br><span class="zh-inline">`String`</span> | `string`<br><span class="zh-inline">`string`</span> |

### Practical Examples<br><span class="zh-inline">实战例子</span>

```rust
// Function that accepts any string type
fn greet(name: &str) {  // Accepts both String and &str
    println!("Hello, {}!", name);
}

fn main() {
    let literal = "John";                    // &str
    let owned = String::from("Jane");        // String
    
    greet(literal);                          // Works
    greet(&owned);                           // Works (borrow String as &str)
    greet("Bob");                            // Works
}

// Function that returns owned string
fn create_greeting(name: &str) -> String {
    format!("Hello, {}!", name)  // format! macro returns String
}
```

函数参数优先写 `&str`，这是 Rust 里非常常见的习惯。<br><span class="zh-inline">因为它最宽松，既能接字面量，也能接 `String` 的借用。除非函数明确要拿走字符串所有权，否则别上来就写 `String`，那样会把调用方搞得更难受。</span>

### C# Developers: Think of it This Way<br><span class="zh-inline">给 C# 开发者的直观类比</span>

```rust
// &str is like ReadOnlySpan<char> - a view into string data
// String is like a char[] that you own and can modify

let borrowed: &str = "I don't own this data";
let owned: String = String::from("I own this data");

// Convert between them
let owned_copy: String = borrowed.to_string();  // Copy to owned
let borrowed_view: &str = &owned;               // Borrow from owned
```

当然，这个类比只能帮入门，别太当真。<br><span class="zh-inline">但在早期阶段，用“`&str` 是借来的视图，`String` 是自己拥有的字符串缓冲区”这个脑图，已经足够把很多问题想顺。</span>

***

## Printing and String Formatting<br><span class="zh-inline">打印与字符串格式化</span>

C# developers rely heavily on `Console.WriteLine` and string interpolation. Rust has equally strong formatting tools, but they live in macros and trait-based formatting machinery.<br><span class="zh-inline">C# 里大家基本张嘴就是 `Console.WriteLine` 和插值字符串；Rust 这边的能力一点也不弱，只是它更多是通过宏和格式化 trait 体系来运作。</span>

### Basic Output<br><span class="zh-inline">基础输出</span>

```csharp
// C# output
Console.Write("no newline");
Console.WriteLine("with newline");
Console.Error.WriteLine("to stderr");

// String interpolation (C# 6+)
string name = "Alice";
int age = 30;
Console.WriteLine($"{name} is {age} years old");
```

```rust
// Rust output — all macros (note the !)
print!("no newline");              // → stdout, no newline
println!("with newline");           // → stdout + newline
eprint!("to stderr");              // → stderr, no newline  
eprintln!("to stderr with newline"); // → stderr + newline

// String formatting (like $"" interpolation)
let name = "Alice";
let age = 30;
println!("{name} is {age} years old");     // Inline variable capture (Rust 1.58+)
println!("{} is {} years old", name, age); // Positional arguments

// format! returns a String instead of printing
let msg = format!("{name} is {age} years old");
```

Rust 里一看到 `println!`、`format!` 这种写法，就记住后面的 `!` 不是装饰。<br><span class="zh-inline">这些都是宏，不是普通函数。也正因为是宏，格式字符串检查和参数展开才能在编译期做得这么紧。</span>

### Format Specifiers<br><span class="zh-inline">格式说明符</span>

```csharp
// C# format specifiers
Console.WriteLine($"{price:F2}");         // Fixed decimal:  29.99
Console.WriteLine($"{count:D5}");         // Padded integer: 00042
Console.WriteLine($"{value,10}");         // Right-aligned, width 10
Console.WriteLine($"{value,-10}");        // Left-aligned, width 10
Console.WriteLine($"{hex:X}");            // Hexadecimal:    FF
Console.WriteLine($"{ratio:P1}");         // Percentage:     85.0%
```

```rust
// Rust format specifiers
println!("{price:.2}");          // 2 decimal places:  29.99
println!("{count:05}");          // Zero-padded, width 5: 00042
println!("{value:>10}");         // Right-aligned, width 10
println!("{value:<10}");         // Left-aligned, width 10
println!("{value:^10}");         // Center-aligned, width 10
println!("{hex:#X}");            // Hex with prefix: 0xFF
println!("{hex:08X}");           // Hex zero-padded: 000000FF
println!("{bits:#010b}");        // Binary with prefix: 0b00001010
println!("{big}", big = 1_000_000); // Named parameter
```

这套格式说明符一开始看着有点硬，但用熟了比 C# 那套更统一。<br><span class="zh-inline">特别是和 `Display`、`Debug` 这些 trait 结合以后，用户输出和开发者调试输出能分得很明白。</span>

### Debug vs Display Printing<br><span class="zh-inline">`Debug` 与 `Display` 打印</span>

```rust
// {:?}  — Debug trait (for developers, auto-derived)
// {:#?} — Pretty-printed Debug (indented, multi-line)
// {}    — Display trait (for users, must implement manually)

#[derive(Debug)] // Auto-generates Debug output
struct Point { x: f64, y: f64 }

let p = Point { x: 1.5, y: 2.7 };

println!("{:?}", p);   // Point { x: 1.5, y: 2.7 }   — compact debug
println!("{:#?}", p);  // Point {                     — pretty debug
                        //     x: 1.5,
                        //     y: 2.7,
                        // }
// println!("{}", p);  // ❌ ERROR: Point doesn't implement Display

// Implement Display for user-facing output:
use std::fmt;

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}
println!("{}", p);    // (1.5, 2.7)  — user-friendly
```

```csharp
// C# equivalent:
// {:?}  ≈ object.GetType().ToString() or reflection dump
// {}    ≈ object.ToString()
// In C# you override ToString(); in Rust you implement Display
```

`Debug` 和 `Display` 的分工特别值得早点建立起来。<br><span class="zh-inline">一个是给开发者看的，重点是信息量；一个是给用户看的，重点是可读性。别把这俩混着用，不然后面日志和终端输出都容易长得很别扭。</span>

### Quick Reference<br><span class="zh-inline">速查表</span>

| C# | Rust | Output<br><span class="zh-inline">用途</span> |
|----|------|--------|
| `Console.WriteLine(x)`<br><span class="zh-inline">`Console.WriteLine(x)`</span> | `println!("{x}")`<br><span class="zh-inline">`println!("{x}")`</span> | Display formatting<br><span class="zh-inline">用户输出</span> |
| `$"{x}"` (interpolation)<br><span class="zh-inline">插值字符串</span> | `format!("{x}")`<br><span class="zh-inline">`format!("{x}")`</span> | Returns `String`<br><span class="zh-inline">返回 `String`</span> |
| `x.ToString()`<br><span class="zh-inline">`x.ToString()`</span> | `x.to_string()`<br><span class="zh-inline">`x.to_string()`</span> | Requires `Display` trait<br><span class="zh-inline">要求实现 `Display`</span> |
| Override `ToString()`<br><span class="zh-inline">重写 `ToString()`</span> | `impl Display`<br><span class="zh-inline">实现 `Display`</span> | User-facing output<br><span class="zh-inline">用户可读输出</span> |
| Debugger view<br><span class="zh-inline">调试视图</span> | `{:?}` or `dbg!(x)`<br><span class="zh-inline">`{:?}` 或 `dbg!(x)`</span> | Developer output<br><span class="zh-inline">开发者调试输出</span> |
| `String.Format("{0:F2}", x)`<br><span class="zh-inline">格式化字符串</span> | `format!("{x:.2}")`<br><span class="zh-inline">`format!("{x:.2}")`</span> | Formatted `String`<br><span class="zh-inline">格式化后的字符串</span> |
| `Console.Error.WriteLine`<br><span class="zh-inline">写标准错误</span> | `eprintln!()`<br><span class="zh-inline">`eprintln!()`</span> | Write to stderr<br><span class="zh-inline">输出到 stderr</span> |

***

## Type Casting and Conversions<br><span class="zh-inline">类型转换与转换规则</span>

C# has implicit conversions, explicit casts, and `Convert.To*()` helpers. Rust is much stricter: numeric conversions are always explicit, and safe conversions usually return `Result`.<br><span class="zh-inline">C# 里有隐式转换、显式强转和 `Convert.To*()` 这套辅助方法；Rust 就收得紧得多。数值转换一律显式写，想要安全转换，通常就得接 `Result`。</span>

### Numeric Conversions<br><span class="zh-inline">数值转换</span>

```csharp
// C# — implicit and explicit conversions
int small = 42;
long big = small;              // Implicit widening: OK
double d = small;              // Implicit widening: OK
int truncated = (int)3.14;     // Explicit narrowing: 3
byte b = (byte)300;            // Silent overflow: 44

// Safe conversion
if (int.TryParse("42", out int parsed)) { /* ... */ }
```

```rust
// Rust — ALL numeric conversions are explicit
let small: i32 = 42;
let big: i64 = small as i64;       // Widening: explicit with 'as'
let d: f64 = small as f64;         // Int to float: explicit
let truncated: i32 = 3.14_f64 as i32; // Narrowing: 3 (truncates)
let b: u8 = 300_u16 as u8;        // Overflow: wraps to 44 (like C# unchecked)

// Safe conversion with TryFrom
use std::convert::TryFrom;
let safe: Result<u8, _> = u8::try_from(300_u16); // Err — out of range
let ok: Result<u8, _>   = u8::try_from(42_u16);  // Ok(42)

// String parsing — returns Result, not bool + out param
let parsed: Result<i32, _> = "42".parse::<i32>();   // Ok(42)
let bad: Result<i32, _>    = "abc".parse::<i32>();  // Err(ParseIntError)

// With turbofish syntax:
let n = "42".parse::<f64>().unwrap(); // 42.0
```

Rust 这里的态度非常明确：别让转换偷偷发生。<br><span class="zh-inline">这样写起来确实烦一点，但很多边界问题、溢出问题、类型误解问题，也就没那么容易悄悄溜进去了。</span>

### String Conversions<br><span class="zh-inline">字符串转换</span>

```csharp
// C#
int n = 42;
string s = n.ToString();          // "42"
string formatted = $"{n:X}";
int back = int.Parse(s);          // 42 or throws
bool ok = int.TryParse(s, out int result);
```

```rust
// Rust — to_string() via Display, parse() via FromStr
let n: i32 = 42;
let s: String = n.to_string();            // "42" (uses Display trait)
let formatted = format!("{n:X}");         // "2A"
let back: i32 = s.parse().unwrap();       // 42 or panics
let result: Result<i32, _> = s.parse();   // Ok(42) — safe version

// &str ↔ String conversions (most common conversion in Rust)
let owned: String = "hello".to_string();    // &str → String
let owned2: String = String::from("hello"); // &str → String (equivalent)
let borrowed: &str = &owned;               // String → &str (free, just a borrow)
```

这里最常见、也最不该糊涂的转换，就是 `&str` 和 `String` 之间那一对。<br><span class="zh-inline">前者变后者通常要分配和拷贝，后者借成前者基本是免费的。这个成本差异在写接口时很有意义。</span>

### Reference Conversions (No Inheritance Casting!)<br><span class="zh-inline">引用转换（没有继承式强转）</span>

```csharp
// C# — upcasting and downcasting
Animal a = new Dog();              // Upcast (implicit)
Dog d = (Dog)a;                    // Downcast (explicit, can throw)
if (a is Dog dog) { /* ... */ }    // Safe downcast with pattern match
```

```rust
// Rust — No inheritance, no upcasting/downcasting
// Use trait objects for polymorphism:
let animal: Box<dyn Animal> = Box::new(Dog);

// "Downcasting" requires the Any trait (rarely needed):
use std::any::Any;
if let Some(dog) = animal_any.downcast_ref::<Dog>() {
    // Use dog
}
// In practice, use enums instead of downcasting:
enum Animal {
    Dog(Dog),
    Cat(Cat),
}
match animal {
    Animal::Dog(d) => { /* use d */ }
    Animal::Cat(c) => { /* use c */ }
}
```

Rust 没有那种遍地都是继承树的默认心智，所以也就没有整套向上转型、向下转型的日常操作。<br><span class="zh-inline">真要做运行时类型判断，当然也有办法，但大多数时候更推荐用 `enum` 或 trait 设计把问题提前建模清楚。</span>

### Quick Reference<br><span class="zh-inline">速查表</span>

| C# | Rust | Notes<br><span class="zh-inline">说明</span> |
|----|------|-------|
| `(int)x`<br><span class="zh-inline">`(int)x`</span> | `x as i32`<br><span class="zh-inline">`x as i32`</span> | Truncating or wrapping cast<br><span class="zh-inline">可能截断或回绕</span> |
| Implicit widening<br><span class="zh-inline">隐式扩宽</span> | Must use `as`<br><span class="zh-inline">必须显式写 `as`</span> | No implicit numeric conversion<br><span class="zh-inline">没有隐式数值转换</span> |
| `Convert.ToInt32(x)`<br><span class="zh-inline">`Convert.ToInt32(x)`</span> | `i32::try_from(x)`<br><span class="zh-inline">`i32::try_from(x)`</span> | Safe and returns `Result`<br><span class="zh-inline">安全转换，返回 `Result`</span> |
| `int.Parse(s)`<br><span class="zh-inline">`int.Parse(s)`</span> | `s.parse::<i32>().unwrap()`<br><span class="zh-inline">`s.parse::<i32>().unwrap()`</span> | Panics on failure<br><span class="zh-inline">失败会 panic</span> |
| `int.TryParse(s, out n)`<br><span class="zh-inline">`int.TryParse(s, out n)`</span> | `s.parse::<i32>()`<br><span class="zh-inline">`s.parse::<i32>()`</span> | Returns `Result`<br><span class="zh-inline">返回 `Result`</span> |
| `(Dog)animal`<br><span class="zh-inline">向下转型</span> | Not available<br><span class="zh-inline">没有直接对应物</span> | Use enums or `Any`<br><span class="zh-inline">通常改用 `enum` 或 `Any`</span> |
| `as Dog` / `is Dog`<br><span class="zh-inline">类型测试</span> | `downcast_ref::<Dog>()`<br><span class="zh-inline">`downcast_ref::<Dog>()`</span> | Via `Any`; prefer enums<br><span class="zh-inline">依赖 `Any`，但通常更推荐 `enum`</span> |

***

## Comments and Documentation<br><span class="zh-inline">注释与文档</span>

### Regular Comments<br><span class="zh-inline">普通注释</span>

```csharp
// C# comments
// Single line comment
/* Multi-line
   comment */

/// <summary>
/// XML documentation comment
/// </summary>
/// <param name="name">The user's name</param>
/// <returns>A greeting string</returns>
public string Greet(string name)
{
    return $"Hello, {name}!";
}
```

```rust
// Rust comments
// Single line comment
/* Multi-line
   comment */

/// Documentation comment (like C# ///)
/// This function greets a user by name.
/// 
/// # Arguments
/// 
/// * `name` - The user's name as a string slice
/// 
/// # Returns
/// 
/// A `String` containing the greeting
/// 
/// # Examples
/// 
/// ```
/// let greeting = greet("Alice");
/// assert_eq!(greeting, "Hello, Alice!");
/// ```
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

Rust 文档注释最爽的地方，是它不仅是注释，还是工具链的一部分。<br><span class="zh-inline">写好了以后能直接生成文档，示例代码还能进文档测试，这就比很多“只是写给人看、工具链不认”的注释系统强得多。</span>

### Documentation Generation<br><span class="zh-inline">文档生成</span>

```bash
# Generate documentation (like XML docs in C#)
cargo doc --open

# Run documentation tests
cargo test --doc
```

---

## Exercises<br><span class="zh-inline">练习</span>

<details>
<summary><strong>🏋️ Exercise: Type-Safe Temperature</strong><br><span class="zh-inline"><strong>🏋️ 练习：类型安全的温度转换</strong></span></summary>

Create a Rust program that:<br><span class="zh-inline">写一个 Rust 程序，要求做到下面几件事：</span>

1. Declares a `const` for absolute zero in Celsius as `-273.15`.<br><span class="zh-inline">定义一个摄氏绝对零度常量 `const`，值为 `-273.15`。</span>
2. Declares a `static` counter for the number of conversions performed using `AtomicU32`.<br><span class="zh-inline">定义一个 `static` 转换计数器，用 `AtomicU32` 统计已经做了多少次转换。</span>
3. Writes a function `celsius_to_fahrenheit(c: f64) -> f64` that returns `f64::NAN` for temperatures below absolute zero.<br><span class="zh-inline">写一个 `celsius_to_fahrenheit(c: f64) -> f64`，如果温度低于绝对零度，就返回 `f64::NAN`。</span>
4. Demonstrates shadowing by parsing the string `"98.6"` into `f64` and then converting it.<br><span class="zh-inline">用字符串 `"98.6"` 演示变量遮蔽：先解析成 `f64`，再继续转换成华氏温度。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use std::sync::atomic::{AtomicU32, Ordering};

const ABSOLUTE_ZERO_C: f64 = -273.15;
static CONVERSION_COUNT: AtomicU32 = AtomicU32::new(0);

fn celsius_to_fahrenheit(c: f64) -> f64 {
    if c < ABSOLUTE_ZERO_C {
        return f64::NAN;
    }
    CONVERSION_COUNT.fetch_add(1, Ordering::Relaxed);
    c * 9.0 / 5.0 + 32.0
}

fn main() {
    let temp = "98.6";           // &str
    let temp: f64 = temp.parse().unwrap(); // shadow as f64
    let temp = celsius_to_fahrenheit(temp); // shadow as Fahrenheit
    println!("{temp:.1}°F");
    println!("Conversions: {}", CONVERSION_COUNT.load(Ordering::Relaxed));
}
```

</details>
</details>

***
