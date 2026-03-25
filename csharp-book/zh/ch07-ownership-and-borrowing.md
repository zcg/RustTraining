## Understanding Ownership<br><span class="zh-inline">理解所有权</span>

> **What you'll learn:** Rust's ownership system, why `let s2 = s1` invalidates `s1` unlike C# reference copying, the three ownership rules, `Copy` vs move types, borrowing with `&` and `&mut`, and how the borrow checker replaces garbage collection.<br><span class="zh-inline">**本章将学到什么：** 理解 Rust 的所有权系统，理解为什么 `let s2 = s1` 会让 `s1` 失效而不是像 C# 那样复制引用，掌握三条所有权规则，分清 `Copy` 类型和移动类型，理解 `&`、`&mut` 借用，以及借用检查器如何替代垃圾回收。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 进阶</span>

Ownership is Rust's most distinctive feature and usually the biggest conceptual jump for C# developers. The trick is to stop treating it as mysticism and instead read it as a set of concrete rules about who is responsible for a value at any moment.<br><span class="zh-inline">所有权是 Rust 最有辨识度的特性，也往往是 C# 开发者迈过去最费劲的一坎。关键是别把它看成玄学，而是把它当成一套非常具体的规则：在任何时刻，谁负责这个值，谁能使用它，谁该在作用域结束时把它清理掉。</span>

### C# Memory Model (Review)<br><span class="zh-inline">C# 内存模型回顾</span>

```csharp
// C# - Automatic memory management
public void ProcessData()
{
    var data = new List<int> { 1, 2, 3, 4, 5 };
    ProcessList(data);
    // data is still accessible here
    Console.WriteLine(data.Count);  // Works fine
    
    // GC will clean up when no references remain
}

public void ProcessList(List<int> list)
{
    list.Add(6);  // Modifies the original list
}
```

### Rust Ownership Rules<br><span class="zh-inline">Rust 所有权规则</span>

1. **Each value has exactly one owner** unless shared ownership is made explicit with types like `Rc<T>` or `Arc<T>`.<br><span class="zh-inline">**每个值在默认情况下都只有一个拥有者**，除非显式引入 `Rc<T>`、`Arc<T>` 这类共享所有权方案。</span>
2. **When the owner goes out of scope, the value is dropped** and cleanup happens deterministically.<br><span class="zh-inline">**拥有者离开作用域时，值就会被销毁**，清理时机是确定的，不靠 GC 碰运气。</span>
3. **Ownership can be transferred by moving the value.**<br><span class="zh-inline">**所有权可以被转移**，也就是常说的 move。</span>

```rust
// Rust - Explicit ownership management
fn process_data() {
    let data = vec![1, 2, 3, 4, 5];  // data owns the vector
    process_list(data);              // Ownership moved to function
    // println!("{:?}", data);       // ❌ Error: data no longer owned here
}

fn process_list(mut list: Vec<i32>) {  // list now owns the vector
    list.push(6);
    // list is dropped here when function ends
}
```

这三条规则其实不绕，就是很严。<br><span class="zh-inline">一旦接受“值在某个时刻只能有一个明确负责者”，很多报错都会突然变得有逻辑。Rust 不是故意刁难，而是在逼代码把资源归属说清楚。</span>

### Understanding "Move" for C# Developers<br><span class="zh-inline">C# 开发者怎么理解 move</span>

```csharp
// C# - References are copied, objects stay in place
// (Only reference types — classes — work this way;
//  C# value types like struct behave differently)
var original = new List<int> { 1, 2, 3 };
var reference = original;  // Both variables point to same object
original.Add(4);
Console.WriteLine(reference.Count);  // 4 - same object
```

```rust
// Rust - Ownership is transferred
let original = vec![1, 2, 3];
let moved = original;       // Ownership transferred
// println!("{:?}", original);  // ❌ Error: original no longer owns the data
println!("{:?}", moved);    // ✅ Works: moved now owns the data
```

这里最大的心理落差就在于：C# 的“赋值”经常只是多了一个指向同一对象的引用；Rust 的“赋值”在很多类型上代表所有权转交。<br><span class="zh-inline">所以很多刚上手的人会觉得“怎么赋个值原变量就死了”，其实不是原变量死了，是责任被正式交出去了。</span>

### Copy Types vs Move Types<br><span class="zh-inline">`Copy` 类型与 move 类型</span>

```rust
// Copy types (like C# value types) - copied, not moved
let x = 5;        // i32 implements Copy
let y = x;        // x is copied to y
println!("{}", x); // ✅ Works: x is still valid

// Move types (like C# reference types) - moved, not copied  
let s1 = String::from("hello");  // String doesn't implement Copy
let s2 = s1;                     // s1 is moved to s2
// println!("{}", s1);           // ❌ Error: s1 is no longer valid
```

并不是所有 Rust 类型都会 move。<br><span class="zh-inline">像整数、布尔、字符这类小而固定的值，通常实现了 `Copy`，赋值就是复制；而像 `String`、`Vec<T>`、大多数 struct 这类拥有资源的类型，默认就是 move。这条线要早点分清，不然后面会老在脑内打架。</span>

### Practical Example: Swapping Values<br><span class="zh-inline">实战例子：交换值</span>

```csharp
// C# - Simple reference swapping
public void SwapLists(ref List<int> a, ref List<int> b)
{
    var temp = a;
    a = b;
    b = temp;
}
```

```rust
// Rust - Ownership-aware swapping
fn swap_vectors(a: &mut Vec<i32>, b: &mut Vec<i32>) {
    std::mem::swap(a, b);  // Built-in swap function
}

// Or manual approach
fn manual_swap() {
    let mut a = vec![1, 2, 3];
    let mut b = vec![4, 5, 6];
    
    let temp = a;  // Move a to temp
    a = b;         // Move b to a
    b = temp;      // Move temp to b
    
    println!("a: {:?}, b: {:?}", a, b);
}
```

这类例子很适合把 move 想明白。<br><span class="zh-inline">所谓 move，不一定意味着“底层内存真的被搬来搬去”，更准确地说，是变量和它所拥有资源之间的归属关系在变。</span>

***

## Borrowing Basics<br><span class="zh-inline">借用基础</span>

Borrowing in Rust is a bit like passing references in C#, except the compiler actually enforces the safety contract instead of trusting everyone to behave.<br><span class="zh-inline">Rust 的借用有点像 C# 里的引用传递，但区别在于：C# 往往只是提供机制，开发者自己负责别出乱子；Rust 则是编译器亲自盯着，谁乱来谁别过编译。</span>

### C# Reference Parameters<br><span class="zh-inline">C# 的引用参数</span>

```csharp
// C# - ref and out parameters
public void ModifyValue(ref int value)
{
    value += 10;
}

public void ReadValue(in int value)  // readonly reference
{
    Console.WriteLine(value);
}

public bool TryParse(string input, out int result)
{
    return int.TryParse(input, out result);
}
```

### Rust Borrowing<br><span class="zh-inline">Rust 借用</span>

```rust
// Rust - borrowing with & and &mut
fn modify_value(value: &mut i32) {  // Mutable borrow
    *value += 10;
}

fn read_value(value: &i32) {        // Immutable borrow
    println!("{}", value);
}

fn main() {
    let mut x = 5;
    
    read_value(&x);      // Borrow immutably
    modify_value(&mut x); // Borrow mutably
    
    println!("{}", x);   // x is still owned here
}
```

这里要养成一个习惯：看到 `&T` 就想“只读借用”，看到 `&mut T` 就想“独占可变借用”。<br><span class="zh-inline">这不是语法细枝末节，而是 Rust 代码阅读的基本功。很多 API 的语义，其实在参数类型上已经写得明明白白了。</span>

### Borrowing Rules (Enforced at Compile Time!)<br><span class="zh-inline">借用规则（编译期强制执行）</span>

```rust
fn borrowing_rules() {
    let mut data = vec![1, 2, 3];
    
    // Rule 1: Multiple immutable borrows are OK
    let r1 = &data;
    let r2 = &data;
    println!("{:?} {:?}", r1, r2);  // ✅ Works
    
    // Rule 2: Only one mutable borrow at a time
    let r3 = &mut data;
    // let r4 = &mut data;  // ❌ Error: cannot borrow mutably twice
    // let r5 = &data;      // ❌ Error: cannot borrow immutably while borrowed mutably
    
    r3.push(4);  // Use the mutable borrow
    // r3 goes out of scope here
    
    // Rule 3: Can borrow again after previous borrows end
    let r6 = &data;  // ✅ Works now
    println!("{:?}", r6);
}
```

这几条规则看起来死板，但它们正是 Rust 能把数据竞争和悬垂引用挡在编译阶段的原因。<br><span class="zh-inline">“多个只读可以同时存在，但可变借用必须独占”这条一旦吃透，后面大量借用检查器报错都会自己解开一半。</span>

### C# vs Rust: Reference Safety<br><span class="zh-inline">C# 与 Rust 的引用安全对照</span>

```csharp
// C# - Potential runtime errors
public class ReferenceSafety
{
    private List<int> data = new List<int>();
    
    public List<int> GetData() => data;  // Returns reference to internal data
    
    public void UnsafeExample()
    {
        var reference = GetData();
        
        // Another thread could modify data here!
        Thread.Sleep(1000);
        
        // reference might be invalid or changed
        reference.Add(42);  // Potential race condition
    }
}
```

```rust
// Rust - Compile-time safety
pub struct SafeContainer {
    data: Vec<i32>,
}

impl SafeContainer {
    // Return immutable borrow - caller can't modify
    // Prefer &[i32] over &Vec<i32> — accept the broadest type
    pub fn get_data(&self) -> &[i32] {
        &self.data
    }
    
    // Return mutable borrow - exclusive access guaranteed
    pub fn get_data_mut(&mut self) -> &mut Vec<i32> {
        &mut self.data
    }
}

fn safe_example() {
    let mut container = SafeContainer { data: vec![1, 2, 3] };
    
    let reference = container.get_data();
    // container.get_data_mut();  // ❌ Error: can't borrow mutably while immutably borrowed
    
    println!("{:?}", reference);  // Use immutable reference
    // reference goes out of scope here
    
    let mut_reference = container.get_data_mut();  // ✅ Now OK
    mut_reference.push(4);
}
```

Rust 很喜欢把“什么时候能改，什么时候只能看”写成类型规则。<br><span class="zh-inline">所以 API 设计也会跟着更清楚。返回 `&[i32]` 就是只读视图，返回 `&mut Vec<i32>` 就是明确放出独占修改权，没有模糊地带。</span>

***

## Move Semantics<br><span class="zh-inline">Move 语义</span>

### C# Value Types vs Reference Types<br><span class="zh-inline">C# 值类型与引用类型</span>

```csharp
// C# - Value types are copied
struct Point
{
    public int X { get; set; }
    public int Y { get; set; }
}

var p1 = new Point { X = 1, Y = 2 };
var p2 = p1;  // Copy
p2.X = 10;
Console.WriteLine(p1.X);  // Still 1

// C# - Reference types share the object
var list1 = new List<int> { 1, 2, 3 };
var list2 = list1;  // Reference copy
list2.Add(4);
Console.WriteLine(list1.Count);  // 4 - same object
```

### Rust Move Semantics<br><span class="zh-inline">Rust 的 move 语义</span>

```rust
// Rust - Move by default for non-Copy types
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn move_example() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = p1;  // Move (not copy)
    // println!("{:?}", p1);  // ❌ Error: p1 was moved
    println!("{:?}", p2);    // ✅ Works
}

// To enable copying, implement Copy trait
#[derive(Debug, Copy, Clone)]
struct CopyablePoint {
    x: i32,
    y: i32,
}

fn copy_example() {
    let p1 = CopyablePoint { x: 1, y: 2 };
    let p2 = p1;  // Copy (because it implements Copy)
    println!("{:?}", p1);  // ✅ Works
    println!("{:?}", p2);  // ✅ Works
}
```

这一步经常能让人理解一个关键事实：Rust 不是“所有 struct 都不能复制”，而是“默认别偷偷复制可能很重或者会造成语义歧义的值”。<br><span class="zh-inline">如果一个类型足够小、语义上也适合按位复制，就让它实现 `Copy`。如果不适合，那就老老实实走 move。</span>

### When Values Are Moved<br><span class="zh-inline">值会在什么时候被 move</span>

```rust
fn demonstrate_moves() {
    let s = String::from("hello");
    
    // 1. Assignment moves
    let s2 = s;  // s moved to s2
    
    // 2. Function calls move
    take_ownership(s2);  // s2 moved into function
    
    // 3. Returning from functions moves
    let s3 = give_ownership();  // Return value moved to s3
    
    println!("{}", s3);  // s3 is valid
}

fn take_ownership(s: String) {
    println!("{}", s);
    // s is dropped here
}

fn give_ownership() -> String {
    String::from("yours")  // Ownership moved to caller
}
```

只要参数类型或赋值行为要求拿值本体，move 就会发生。<br><span class="zh-inline">这也是为什么看函数签名特别重要。很多时候问题根本不在调用点，而在于被调用函数要的是拥有者，还是只借一下。</span>

### Avoiding Moves with Borrowing<br><span class="zh-inline">用借用避免 move</span>

```rust
fn demonstrate_borrowing() {
    let s = String::from("hello");
    
    // Borrow instead of move
    let len = calculate_length(&s);  // s is borrowed
    println!("'{}' has length {}", s, len);  // s is still valid
}

fn calculate_length(s: &String) -> usize {
    s.len()  // s is not owned, so it's not dropped
}
```

很多新手阶段的修法，说白了就是一句话：别拿走，先借。<br><span class="zh-inline">当然也不是所有地方都该借，有些地方就该清清楚楚地转交所有权。但只要函数只是读一下数据，不打算接管生命周期，那借用通常就是更自然的设计。</span>

***

## Memory Management: GC vs RAII<br><span class="zh-inline">内存管理：GC 与 RAII 对照</span>

### C# Garbage Collection<br><span class="zh-inline">C# 垃圾回收</span>

```csharp
// C# - Automatic memory management
public class Person
{
    public string Name { get; set; }
    public List<string> Hobbies { get; set; } = new List<string>();
    
    public void AddHobby(string hobby)
    {
        Hobbies.Add(hobby);  // Memory allocated automatically
    }
    
    // No explicit cleanup needed - GC handles it
    // But IDisposable pattern for resources
}

using var file = new FileStream("data.txt", FileMode.Open);
// 'using' ensures Dispose() is called
```

### Rust Ownership and RAII<br><span class="zh-inline">Rust 的所有权与 RAII</span>

```rust
// Rust - Compile-time memory management
pub struct Person {
    name: String,
    hobbies: Vec<String>,
}

impl Person {
    pub fn add_hobby(&mut self, hobby: String) {
        self.hobbies.push(hobby);  // Memory management tracked at compile time
    }
    
    // Drop trait automatically implemented - cleanup is guaranteed
    // Compare to C#'s IDisposable:
    //   C#:   using var file = new FileStream(...)    // Dispose() called at end of using block
    //   Rust: let file = File::open(...)?             // drop() called at end of scope — no 'using' needed
}

// RAII - Resource Acquisition Is Initialization
{
    let file = std::fs::File::open("data.txt")?;
    // File automatically closed when 'file' goes out of scope
    // No 'using' statement needed - handled by type system
}
```

Rust 不是“没有内存管理”，而是把很多管理工作前置到了编译期。<br><span class="zh-inline">GC 的优势是省心，代价是运行时开销和清理时机不确定；RAII 的优势是确定性强、零运行时成本，代价是得先把所有权和借用这套脑回路练出来。</span>

```mermaid
graph TD
    subgraph "C# Memory Management"
        CS_ALLOC["Object Allocation<br/>new Person()"]
        CS_HEAP["Managed Heap<br/>托管堆"]
        CS_REF["References point to heap<br/>引用指向堆对象"]
        CS_GC_CHECK["GC periodically checks<br/>for unreachable objects<br/>周期性扫描不可达对象"]
        CS_SWEEP["Mark and sweep<br/>标记清扫"]
        CS_PAUSE["[ERROR] GC pause times<br/>可能有停顿"]
        
        CS_ALLOC --> CS_HEAP
        CS_HEAP --> CS_REF
        CS_REF --> CS_GC_CHECK
        CS_GC_CHECK --> CS_SWEEP
        CS_SWEEP --> CS_PAUSE
        
        CS_ISSUES["[ERROR] Non-deterministic cleanup<br/>[ERROR] Memory pressure<br/>[ERROR] Finalization complexity<br/>[OK] Easy to use"]
    end
    
    subgraph "Rust Ownership System"
        RUST_ALLOC["Value Creation<br/>Person { ... }"]
        RUST_OWNER["Single owner<br/>单一拥有者"]
        RUST_BORROW["Borrowing system<br/>&T, &mut T"]
        RUST_SCOPE["Scope-based cleanup<br/>Drop trait"]
        RUST_COMPILE["Compile-time verification<br/>编译期验证"]
        
        RUST_ALLOC --> RUST_OWNER
        RUST_OWNER --> RUST_BORROW
        RUST_BORROW --> RUST_SCOPE
        RUST_SCOPE --> RUST_COMPILE
        
        RUST_BENEFITS["[OK] Deterministic cleanup<br/>[OK] Zero runtime cost<br/>[OK] No memory leaks by default<br/>[ERROR] Learning curve"]
    end
    
    style CS_ISSUES fill:#ffebee,color:#000
    style RUST_BENEFITS fill:#e8f5e8,color:#000
    style CS_PAUSE fill:#ffcdd2,color:#000
    style RUST_COMPILE fill:#c8e6c9,color:#000
```

***

<details>
<summary><strong>🏋️ Exercise: Fix the Borrow Checker Errors</strong><br><span class="zh-inline"><strong>🏋️ 练习：修掉借用检查器报错</strong></span></summary>

**Challenge**: Each snippet below contains a borrow-checker problem. Fix them without changing the output.<br><span class="zh-inline">**挑战：** 下面每段代码都和借用检查器撞上了。要求在不改变输出结果的前提下把它们修好。</span>

```rust
// 1. Move after use
fn problem_1() {
    let name = String::from("Alice");
    let greeting = format!("Hello, {name}!");
    let upper = name.to_uppercase();  // hint: borrow instead of move
    println!("{greeting} — {upper}");
}

// 2. Mutable + immutable borrow overlap
fn problem_2() {
    let mut numbers = vec![1, 2, 3];
    let first = &numbers[0];
    numbers.push(4);            // hint: reorder operations
    println!("first = {first}");
}

// 3. Returning a reference to a local
fn problem_3() -> String {
    let s = String::from("hello");
    s   // hint: return owned value, not &str
}
```

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
// 1. format! already borrows — the fix is that format! takes a reference.
//    The original code actually compiles! But if we had `let greeting = name;`
//    then fix by using &name:
fn solution_1() {
    let name = String::from("Alice");
    let greeting = format!("Hello, {}!", &name); // borrow
    let upper = name.to_uppercase();             // name still valid
    println!("{greeting} — {upper}");
}

// 2. Use the immutable borrow before the mutable operation:
fn solution_2() {
    let mut numbers = vec![1, 2, 3];
    let first = numbers[0]; // copy the i32 value (i32 is Copy)
    numbers.push(4);
    println!("first = {first}");
}

// 3. Return the owned String (already correct — common beginner confusion):
fn solution_3() -> String {
    let s = String::from("hello");
    s // ownership transferred to caller — this is the correct pattern
}
```

**Key takeaways:**<br><span class="zh-inline">**这题最该记住的点：**</span>

- `format!()` borrows its arguments instead of taking ownership.<br><span class="zh-inline">`format!()` 默认借用参数，并不会直接拿走所有权。</span>
- Primitive types such as `i32` implement `Copy`, so indexing can copy the value instead of creating a long-lived borrow.<br><span class="zh-inline">像 `i32` 这种基础类型实现了 `Copy`，因此可以把索引结果直接复制出来，避免借用时间拉太长。</span>
- Returning an owned `String` is often exactly the right thing to do and avoids lifetime headaches.<br><span class="zh-inline">返回一个拥有所有权的 `String` 往往就是最正确的做法，反而能避开一堆生命周期麻烦。</span>

</details>
</details>

***
