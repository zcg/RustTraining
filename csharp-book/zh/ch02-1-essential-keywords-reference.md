## Essential Rust Keywords for C# Developers<br><span class="zh-inline">面向 C# 开发者的 Rust 核心关键字速查</span>

> **What you'll learn:** A quick-reference mapping of Rust keywords to their C# equivalents — visibility modifiers, ownership keywords, control flow, type definitions, and pattern matching syntax.<br><span class="zh-inline">**本章将学到什么：** 一份面向 C# 开发者的 Rust 关键字速查表，覆盖可见性修饰符、所有权相关关键字、控制流、类型定义和模式匹配语法。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 入门</span>

Understanding Rust's keywords and their purposes helps C# developers navigate the language more effectively.<br><span class="zh-inline">先把 Rust 关键字和用途认熟，C# 开发者切进 Rust 时会顺很多，不至于看代码像在啃天书。</span>

### Visibility and Access Control Keywords<br><span class="zh-inline">可见性与访问控制关键字</span>

#### C# Access Modifiers<br><span class="zh-inline">C# 的访问修饰符</span>

```csharp
public class Example
{
    public int PublicField;           // Accessible everywhere
    private int privateField;        // Only within this class
    protected int protectedField;    // This class and subclasses
    internal int internalField;      // Within this assembly
    protected internal int protectedInternalField; // Combination
}
```

#### Rust Visibility Keywords<br><span class="zh-inline">Rust 的可见性关键字</span>

```rust
// pub - Makes items public (like C# public)
pub struct PublicStruct {
    pub public_field: i32,           // Public field
    private_field: i32,              // Private by default (no keyword)
}

pub mod my_module {
    pub(crate) fn crate_public() {}     // Public within current crate (like internal)
    pub(super) fn parent_public() {}    // Public to parent module
    pub(self) fn self_public() {}       // Public within current module (same as private)
    
    pub use super::PublicStruct;        // Re-export (like using alias)
}

// No direct equivalent to C# protected - use composition instead
```

Rust 这块最容易让 C# 开发者发愣的点，是“默认私有”。很多东西不写 `pub` 就关起来了，而且 `pub(crate)`、`pub(super)` 这种粒度比 C# 更细。<br><span class="zh-inline">另外，Rust 没有一个和 C# `protected` 完全对位的关键字，很多时候更推荐通过模块边界和组合关系来表达设计意图。</span>

### Memory and Ownership Keywords<br><span class="zh-inline">内存与所有权关键字</span>

#### C# Memory Keywords<br><span class="zh-inline">C# 里和内存相关的关键字</span>

```csharp
// ref - Pass by reference
public void Method(ref int value) { value = 10; }

// out - Output parameter
public bool TryParse(string input, out int result) { /* */ }

// in - Readonly reference (C# 7.2+)
public void ReadOnly(in LargeStruct data) { /* Cannot modify data */ }
```

#### Rust Ownership Keywords<br><span class="zh-inline">Rust 里的所有权相关关键字</span>

```rust
// & - Immutable reference (like C# in parameter)
fn read_only(data: &Vec<i32>) {
    println!("Length: {}", data.len()); // Can read, cannot modify
}

// &mut - Mutable reference (like C# ref parameter)
fn modify(data: &mut Vec<i32>) {
    data.push(42); // Can modify
}

// move - Force move capture in closures
let data = vec![1, 2, 3];
let closure = move || {
    println!("{:?}", data); // data is moved into closure
};
// data is no longer accessible here

// Box - Heap allocation (like C# new for reference types)
let boxed_data = Box::new(42); // Allocate on heap
```

这部分是 Rust 和 C# 真正拉开差距的地方。C# 里的 `ref`、`out`、`in` 更像参数传递方式；Rust 的 `&`、`&mut` 背后还连着借用规则和生命周期。<br><span class="zh-inline">`move` 也很关键，它不是“复制一份”，而是把所有权直接交出去。这个语义如果没吃透，后面闭包、线程和异步代码会频繁撞墙。</span>

### Control Flow Keywords<br><span class="zh-inline">控制流关键字</span>

#### C# Control Flow<br><span class="zh-inline">C# 的控制流</span>

```csharp
// return - Exit function with value
public int GetValue() { return 42; }

// yield return - Iterator pattern
public IEnumerable<int> GetNumbers()
{
    yield return 1;
    yield return 2;
}

// break/continue - Loop control
foreach (var item in items)
{
    if (item == null) continue;
    if (item.Stop) break;
}
```

#### Rust Control Flow Keywords<br><span class="zh-inline">Rust 的控制流关键字</span>

```rust
// return - Explicit return (usually not needed)
fn get_value() -> i32 {
    return 42; // Explicit return
    // OR just: 42 (implicit return)
}

// break/continue - Loop control with optional values
fn find_value() -> Option<i32> {
    loop {
        let value = get_next();
        if value < 0 { continue; }
        if value > 100 { break None; }      // Break with value
        if value == 42 { break Some(value); } // Break with success
    }
}

// loop - Infinite loop (like while(true))
loop {
    if condition { break; }
}

// while - Conditional loop
while condition {
    // code
}

// for - Iterator loop
for item in collection {
    // code
}
```

Rust 这里最骚的一点，是 `break` 还能带值，`loop` 因此不只是“死循环”，还可以被拿来当表达式。<br><span class="zh-inline">另外，Rust 末尾表达式默认返回值这件事，也和 C# 那种处处写 `return` 的风格很不一样。</span>

### Type Definition Keywords<br><span class="zh-inline">类型定义关键字</span>

#### C# Type Keywords<br><span class="zh-inline">C# 的类型关键字</span>

```csharp
// class - Reference type
public class MyClass { }

// struct - Value type
public struct MyStruct { }

// interface - Contract definition
public interface IMyInterface { }

// enum - Enumeration
public enum MyEnum { Value1, Value2 }

// delegate - Function pointer
public delegate void MyDelegate(int value);
```

#### Rust Type Keywords<br><span class="zh-inline">Rust 的类型关键字</span>

```rust
// struct - Data structure (like C# class/struct combined)
struct MyStruct {
    field: i32,
}

// enum - Algebraic data type (much more powerful than C# enum)
enum MyEnum {
    Variant1,
    Variant2(i32),               // Can hold data
    Variant3 { x: i32, y: i32 }, // Struct-like variant
}

// trait - Interface definition (like C# interface but more powerful)
trait MyTrait {
    fn method(&self);
    
    // Default implementation (like C# 8+ default interface methods)
    fn default_method(&self) {
        println!("Default implementation");
    }
}

// type - Type alias (like C# using alias)
type UserId = u32;
type Result<T> = std::result::Result<T, MyError>;

// impl - Implementation block
impl MyStruct {
    fn new() -> MyStruct {
        MyStruct { field: 0 }
    }
}

impl MyTrait for MyStruct {
    fn method(&self) {
        println!("Implementation");
    }
}
```

Rust 的 `enum` 比 C# `enum` 强得多，这玩意儿本质上已经是代数数据类型了，能直接带结构化数据。<br><span class="zh-inline">`trait` 也不只是接口翻版，它配合默认实现、泛型约束和静态分发，能玩出来的花样比 C# interface 更大。</span>

### Function Definition Keywords<br><span class="zh-inline">函数定义关键字</span>

#### C# Function Keywords<br><span class="zh-inline">C# 的函数关键字</span>

```csharp
// static - Class method
public static void StaticMethod() { }

// virtual - Can be overridden
public virtual void VirtualMethod() { }

// override - Override base method
public override void VirtualMethod() { }

// abstract - Must be implemented
public abstract void AbstractMethod();

// async - Asynchronous method
public async Task<int> AsyncMethod() { return await SomeTask(); }
```

#### Rust Function Keywords<br><span class="zh-inline">Rust 的函数关键字</span>

```rust
// fn - Function definition
fn regular_function() {
    println!("Hello");
}

// const fn - Compile-time function
const fn compile_time_function() -> i32 {
    42
}

// async fn - Asynchronous function
async fn async_function() -> i32 {
    some_async_operation().await
}

// unsafe fn - Function that may violate memory safety
unsafe fn unsafe_function() {
    // Can perform unsafe operations
}

// extern fn - Foreign function interface
extern "C" fn c_compatible_function() {
    // Can be called from C
}
```

Rust 没有 `virtual`、`override` 这一套继承味很重的关键字组合，很多行为差异会被 `trait` 和静态分发吸收掉。<br><span class="zh-inline">反过来，`const fn`、`unsafe fn`、`extern fn` 这类关键字会更早把“这函数属于哪种语义区域”标清楚。</span>

### Variable Declaration Keywords<br><span class="zh-inline">变量声明关键字</span>

#### C# Variable Keywords<br><span class="zh-inline">C# 的变量关键字</span>

```csharp
// var - Type inference
var name = "John"; // Inferred as string

// const - Compile-time constant
const int MaxSize = 100;

// readonly - Runtime constant (fields only, not local variables)
// readonly DateTime createdAt = DateTime.Now;

// static - Class-level variable
static int instanceCount = 0;
```

#### Rust Variable Keywords<br><span class="zh-inline">Rust 的变量关键字</span>

```rust
// let - Variable binding
let name = "John"; // Immutable by default

// let mut - Mutable variable binding
let mut count = 0;
count += 1;

// const - Compile-time constant
const MAX_SIZE: usize = 100;

// static - Global variable
static INSTANCE_COUNT: std::sync::atomic::AtomicUsize =
    std::sync::atomic::AtomicUsize::new(0);
```

这里最值得记住的一件事就是：Rust 默认不可变。<br><span class="zh-inline">C# 里如果不特意写 `readonly`，很多变量都是默认可改；Rust 则反过来，想改就必须显式 `mut`。</span>

### Pattern Matching Keywords<br><span class="zh-inline">模式匹配关键字</span>

#### C# Pattern Matching (C# 8+)<br><span class="zh-inline">C# 8+ 的模式匹配</span>

```csharp
// switch expression
string result = value switch
{
    1 => "One",
    2 => "Two",
    _ => "Other"
};

// is pattern
if (obj is string str)
{
    Console.WriteLine(str.Length);
}
```

#### Rust Pattern Matching Keywords<br><span class="zh-inline">Rust 的模式匹配关键字</span>

```rust
// match - Pattern matching
let result = match value {
    1 => "One",
    2 => "Two",
    3..=10 => "Between 3 and 10",
    _ => "Other",
};

// if let - Conditional pattern matching
if let Some(value) = optional {
    println!("Got value: {}", value);
}

// while let - Loop with pattern matching
while let Some(item) = iterator.next() {
    println!("Item: {}", item);
}

// let with patterns - Destructuring
let (x, y) = point;
let Some(value) = optional else {
    return;
};
```

Rust 的 `match` 不只是更强的 `switch`，它还要求分支穷尽。<br><span class="zh-inline">这一点很值钱，因为很多“漏写一个 case”在编译期就会被卡死，不等到运行时再翻车。</span>

### Memory Safety Keywords<br><span class="zh-inline">内存安全关键字</span>

#### C# Memory Keywords<br><span class="zh-inline">C# 里的内存安全相关关键字</span>

```csharp
// unsafe - Disable safety checks
unsafe
{
    int* ptr = &variable;
    *ptr = 42;
}

// fixed - Pin managed memory
unsafe
{
    fixed (byte* ptr = array)
    {
        // Use ptr
    }
}
```

#### Rust Safety Keywords<br><span class="zh-inline">Rust 的安全关键字</span>

```rust
// unsafe - Disable borrow checker (use sparingly!)
unsafe {
    let ptr = &variable as *const i32;
    let value = *ptr; // Dereference raw pointer
}

// Raw pointer types
let ptr: *const i32 = &42;
let ptr: *mut i32 = &mut 42;
```

Rust 里 `unsafe` 不是“随便乱搞许可证”，而是“这里的安全性证明交给开发者自己承担”的标记。<br><span class="zh-inline">也正因为这样，`unsafe` 区域通常越小越好，最好把危险操作关进一层安全抽象里。</span>

### Common Rust Keywords Not in C#<br><span class="zh-inline">C# 里没有直接对应物的 Rust 常见关键字</span>

```rust
// where - Generic constraints
fn generic_function<T>()
where
    T: Clone + Send + Sync,
{
}

// dyn - Dynamic trait objects
let drawable: Box<dyn Draw> = Box::new(Circle::new());

// Self - Refer to the implementing type
impl MyStruct {
    fn new() -> Self {
        Self { field: 0 }
    }
}

// self - Method receiver
impl MyStruct {
    fn method(&self) { }
    fn method_mut(&mut self) { }
    fn consume(self) { }
}

// crate - Refer to current crate root
use crate::models::User;

// super - Refer to parent module
use super::utils;
```

这几个关键字经常会让 C# 开发者一开始有点懵。<br><span class="zh-inline">尤其是 `dyn`、`Self`、`self`、`crate`、`super` 这些，看起来短，实际背后牵扯的是 Rust 的模块系统、trait 对象和方法接收者模型。</span>

### Keywords Summary for C# Developers<br><span class="zh-inline">面向 C# 开发者的关键字总表</span>

| Purpose<br><span class="zh-inline">用途</span> | C# | Rust | Key Difference<br><span class="zh-inline">关键差异</span> |
|---------|----|----|----------------|
| Visibility<br><span class="zh-inline">可见性</span> | `public`, `private`, `internal` | `pub`, default private | More granular with `pub(crate)`<br><span class="zh-inline">Rust 粒度更细。</span> |
| Variables<br><span class="zh-inline">变量</span> | `var`, `readonly`, `const` | `let`, `let mut`, `const` | Immutable by default<br><span class="zh-inline">Rust 默认不可变。</span> |
| Functions<br><span class="zh-inline">函数</span> | `method()` | `fn` | Standalone functions are common<br><span class="zh-inline">Rust 常见独立函数。</span> |
| Types<br><span class="zh-inline">类型</span> | `class`, `struct`, `interface` | `struct`, `enum`, `trait` | Enums are algebraic types<br><span class="zh-inline">Rust 的 enum 强很多。</span> |
| Generics<br><span class="zh-inline">泛型</span> | `<T> where T : IFoo` | `<T> where T: Foo` | More flexible constraints<br><span class="zh-inline">约束组合更灵活。</span> |
| References<br><span class="zh-inline">引用</span> | `ref`, `out`, `in` | `&`, `&mut` | Borrow checking at compile time<br><span class="zh-inline">Rust 会做借用检查。</span> |
| Patterns<br><span class="zh-inline">模式</span> | `switch`, `is` | `match`, `if let` | Exhaustiveness is enforced<br><span class="zh-inline">Rust 要求穷尽匹配。</span> |

***
