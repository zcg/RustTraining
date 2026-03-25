## `Vec<T>` vs `List<T>`<br><span class="zh-inline">`Vec&lt;T&gt;` 与 `List&lt;T&gt;` 对照</span>

> **What you'll learn:** `Vec<T>` compared with `List<T>`, `HashMap` compared with `Dictionary`, safe access patterns and why Rust returns `Option` instead of throwing, plus the ownership consequences of storing values inside collections.<br><span class="zh-inline">**本章将学到什么：** 对照理解 `Vec&lt;T&gt;` 和 `List&lt;T&gt;`，`HashMap` 和 `Dictionary`，理解 Rust 为什么更喜欢返回 `Option` 而不是直接抛异常，以及集合在所有权语义下会带来哪些变化。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 入门</span>

`Vec<T>` is Rust's closest equivalent to C#'s `List<T>`, but the ownership model changes how it behaves when passed around.<br><span class="zh-inline">`Vec&lt;T&gt;` 可以理解成 Rust 里最接近 `List&lt;T&gt;` 的东西，但一旦开始跨函数传递、借用、修改，所有权规则就会立刻把差异拉开。</span>

### C# `List<T>`<br><span class="zh-inline">C# 的 `List&lt;T&gt;`</span>

```csharp
// C# List<T> - Reference type, heap allocated
var numbers = new List<int>();
numbers.Add(1);
numbers.Add(2);
numbers.Add(3);

// Pass to method - reference is copied
ProcessList(numbers);
Console.WriteLine(numbers.Count);  // Still accessible

void ProcessList(List<int> list)
{
    list.Add(4);  // Modifies original list
    Console.WriteLine($"Count in method: {list.Count}");
}
```

### Rust `Vec<T>`<br><span class="zh-inline">Rust 的 `Vec&lt;T&gt;`</span>

```rust
// Rust Vec<T> - Owned type, heap allocated
let mut numbers = Vec::new();
numbers.push(1);
numbers.push(2);
numbers.push(3);

// Method that takes ownership
process_vec(numbers);
// println!("{:?}", numbers);  // ❌ Error: numbers was moved

// Method that borrows
let mut numbers = vec![1, 2, 3];  // vec! macro for convenience
process_vec_borrowed(&mut numbers);
println!("{:?}", numbers);  // ✅ Still accessible

fn process_vec(mut vec: Vec<i32>) {  // Takes ownership
    vec.push(4);
    println!("Count in method: {}", vec.len());
    // vec is dropped here
}

fn process_vec_borrowed(vec: &mut Vec<i32>) {  // Borrows mutably
    vec.push(4);
    println!("Count in method: {}", vec.len());
}
```

这里最容易把 C# 开发者晃一下的点，就是“把集合传给函数”这件事。<br><span class="zh-inline">在 C# 里通常只是拷了一份引用；在 Rust 里，如果函数签名写的是 `Vec&lt;T&gt;`，那就是所有权转移。要继续用原变量，就得改成借用，别装糊涂。</span>

### Creating and Initializing Vectors<br><span class="zh-inline">创建和初始化向量</span>

```csharp
// C# List initialization
var numbers = new List<int> { 1, 2, 3, 4, 5 };
var empty = new List<int>();
var sized = new List<int>(10);  // Initial capacity

// From other collections
var fromArray = new List<int>(new[] { 1, 2, 3 });
```

```rust
// Rust Vec initialization
let numbers = vec![1, 2, 3, 4, 5];  // vec! macro
let empty: Vec<i32> = Vec::new();   // Type annotation needed for empty
let sized = Vec::with_capacity(10); // Pre-allocate capacity

// From iterator
let from_range: Vec<i32> = (1..=5).collect();
let from_array = vec![1, 2, 3];
```

Rust 这边 `vec![]` 基本就是日常主力。<br><span class="zh-inline">`Vec::new()`、`with_capacity()`、`collect()` 也都很常见，但只要是直接写固定内容，`vec![]` 的观感最好，读起来也利索。</span>

### Common Operations Comparison<br><span class="zh-inline">常见操作对照</span>

```csharp
// C# List operations
var list = new List<int> { 1, 2, 3 };

list.Add(4);                    // Add element
list.Insert(0, 0);              // Insert at index
list.Remove(2);                 // Remove first occurrence
list.RemoveAt(1);               // Remove at index
list.Clear();                   // Remove all

int first = list[0];            // Index access
int count = list.Count;         // Get count
bool contains = list.Contains(3); // Check if contains
```

```rust
// Rust Vec operations
let mut vec = vec![1, 2, 3];

vec.push(4);                    // Add element
vec.insert(0, 0);               // Insert at index
vec.retain(|&x| x != 2);        // Remove elements (functional style)
vec.remove(1);                  // Remove at index
vec.clear();                    // Remove all

let first = vec[0];             // Index access (panics if out of bounds)
let safe_first = vec.get(0);    // Safe access, returns Option<&T>
let count = vec.len();          // Get count
let contains = vec.contains(&3); // Check if contains
```

这里最该盯住的是 `get()`。<br><span class="zh-inline">直接索引 `vec[0]` 在越界时会 panic，`vec.get(0)` 才是安全访问入口。Rust 很喜欢把“可能失败”显式写出来，不会假装一切都能拿到值。</span>

### Safe Access Patterns<br><span class="zh-inline">安全访问模式</span>

```csharp
// C# - Exception-based bounds checking
public int SafeAccess(List<int> list, int index)
{
    try
    {
        return list[index];
    }
    catch (ArgumentOutOfRangeException)
    {
        return -1;  // Default value
    }
}
```

```rust
// Rust - Option-based safe access
fn safe_access(vec: &Vec<i32>, index: usize) -> Option<i32> {
    vec.get(index).copied()  // Returns Option<i32>
}

fn main() {
    let vec = vec![1, 2, 3];
    
    // Safe access patterns
    match vec.get(10) {
        Some(value) => println!("Value: {}", value),
        None => println!("Index out of bounds"),
    }
    
    // Or with unwrap_or
    let value = vec.get(10).copied().unwrap_or(-1);
    println!("Value: {}", value);
}
```

Rust 的思路很直白：既然越界是正常可能性之一，那就把它编码进返回类型。<br><span class="zh-inline">所以这里不是捕异常，而是返回 `Option`。调用方必须决定怎么处理 `None`，这个决定也会被代码明明白白写出来。</span>

***

## HashMap vs Dictionary<br><span class="zh-inline">`HashMap` 与 `Dictionary` 对照</span>

HashMap is Rust's equivalent to C#'s `Dictionary<K, V>`.<br><span class="zh-inline">`HashMap` 基本就是 Rust 里对应 `Dictionary&lt;K, V&gt;` 的那一位，但它同样会受到所有权和借用规则影响。</span>

### C# Dictionary<br><span class="zh-inline">C# 的 `Dictionary`</span>

```csharp
// C# Dictionary<TKey, TValue>
var scores = new Dictionary<string, int>
{
    ["Alice"] = 100,
    ["Bob"] = 85,
    ["Charlie"] = 92
};

// Add/Update
scores["Dave"] = 78;
scores["Alice"] = 105;  // Update existing

// Safe access
if (scores.TryGetValue("Eve", out int score))
{
    Console.WriteLine($"Eve's score: {score}");
}
else
{
    Console.WriteLine("Eve not found");
}

// Iteration
foreach (var kvp in scores)
{
    Console.WriteLine($"{kvp.Key}: {kvp.Value}");
}
```

### Rust HashMap<br><span class="zh-inline">Rust 的 `HashMap`</span>

```rust
use std::collections::HashMap;

// Create and initialize HashMap
let mut scores = HashMap::new();
scores.insert("Alice".to_string(), 100);
scores.insert("Bob".to_string(), 85);
scores.insert("Charlie".to_string(), 92);

// Or use from iterator
let scores: HashMap<String, i32> = [
    ("Alice".to_string(), 100),
    ("Bob".to_string(), 85),
    ("Charlie".to_string(), 92),
].into_iter().collect();

// Add/Update
let mut scores = scores;  // Make mutable
scores.insert("Dave".to_string(), 78);
scores.insert("Alice".to_string(), 105);  // Update existing

// Safe access
match scores.get("Eve") {
    Some(score) => println!("Eve's score: {}", score),
    None => println!("Eve not found"),
}

// Iteration
for (name, score) in &scores {
    println!("{}: {}", name, score);
}
```

读 `HashMap` 时，要把“插入会移动键和值”这件事记脑子里。<br><span class="zh-inline">特别是 `String` 这种非 `Copy` 类型，插进去以后原变量就别再想着继续随便用了，除非是借用、克隆，或者本来就打算把所有权交进去。</span>

### HashMap Operations<br><span class="zh-inline">`HashMap` 常见操作</span>

```csharp
// C# Dictionary operations
var dict = new Dictionary<string, int>();

dict["key"] = 42;                    // Insert/update
bool exists = dict.ContainsKey("key"); // Check existence
bool removed = dict.Remove("key");    // Remove
dict.Clear();                        // Clear all

// Get with default
int value = dict.GetValueOrDefault("missing", 0);
```

```rust
use std::collections::HashMap;

// Rust HashMap operations
let mut map = HashMap::new();

map.insert("key".to_string(), 42);   // Insert/update
let exists = map.contains_key("key"); // Check existence
let removed = map.remove("key");      // Remove, returns Option<V>
map.clear();                         // Clear all

// Entry API for advanced operations
let mut map = HashMap::new();
map.entry("key".to_string()).or_insert(42);  // Insert if not exists
map.entry("key".to_string()).and_modify(|v| *v += 1); // Modify if exists

// Get with default
let value = map.get("missing").copied().unwrap_or(0);
```

`entry()` 是 `HashMap` 里最值得尽快掌握的接口之一。<br><span class="zh-inline">很多“如果不存在就插入，存在就修改”的操作，写成 `entry` 风格以后既省查找次数，也更不容易写出啰嗦分支。</span>

### Ownership with HashMap Keys and Values<br><span class="zh-inline">`HashMap` 中键和值的所有权</span>

```rust
// Understanding ownership with HashMap
fn ownership_example() {
    let mut map = HashMap::new();
    
    // String keys and values are moved into the map
    let key = String::from("name");
    let value = String::from("Alice");
    
    map.insert(key, value);
    // println!("{}", key);   // ❌ Error: key was moved
    // println!("{}", value); // ❌ Error: value was moved
    
    // Access via references
    if let Some(name) = map.get("name") {
        println!("Name: {}", name);  // Borrowing the value
    }
}

// Using &str keys (no ownership transfer)
fn string_slice_keys() {
    let mut map = HashMap::new();
    
    map.insert("name", "Alice");     // &str keys and values
    map.insert("age", "30");
    
    // No ownership issues with string literals
    println!("Name exists: {}", map.contains_key("name"));
}
```

这段就是典型的“Rust 不让糊涂账过关”。<br><span class="zh-inline">字符串一旦被移动进 `HashMap`，原变量就结束了。反过来，如果键和值本身就是 `'static` 的字符串字面量，那自然就轻松很多，因为它们本来就不需要被所有权管理得那么紧。</span>

***

## Working with Collections<br><span class="zh-inline">操作集合</span>

### Iteration Patterns<br><span class="zh-inline">迭代模式</span>

```csharp
// C# iteration patterns
var numbers = new List<int> { 1, 2, 3, 4, 5 };

// For loop with index
for (int i = 0; i < numbers.Count; i++)
{
    Console.WriteLine($"Index {i}: {numbers[i]}");
}

// Foreach loop
foreach (int num in numbers)
{
    Console.WriteLine(num);
}

// LINQ methods
var doubled = numbers.Select(x => x * 2).ToList();
var evens = numbers.Where(x => x % 2 == 0).ToList();
```

```rust
// Rust iteration patterns
let numbers = vec![1, 2, 3, 4, 5];

// For loop with index
for (i, num) in numbers.iter().enumerate() {
    println!("Index {}: {}", i, num);
}

// For loop over values
for num in &numbers {  // Borrow each element
    println!("{}", num);
}

// Iterator methods (like LINQ)
let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
let evens: Vec<i32> = numbers.iter().filter(|&x| x % 2 == 0).cloned().collect();

// Or more efficiently, consuming iterator
let doubled: Vec<i32> = numbers.into_iter().map(|x| x * 2).collect();
```

Rust 的 `for` 本质上也是围着迭代器转，所以“集合怎么被迭代”这件事比 C# 更重要一点。<br><span class="zh-inline">是只读借用、可变借用，还是把元素本体直接拿走，这三种选择都会影响后续还能不能继续用原集合。</span>

### Iterator vs IntoIterator vs Iter<br><span class="zh-inline">`iter`、`into_iter`、`iter_mut` 的区别</span>

```rust
// Understanding different iteration methods
fn iteration_methods() {
    let vec = vec![1, 2, 3, 4, 5];
    
    // 1. iter() - borrows elements (&T)
    for item in vec.iter() {
        println!("{}", item);  // item is &i32
    }
    // vec is still usable here
    
    // 2. into_iter() - takes ownership (T)
    for item in vec.into_iter() {
        println!("{}", item);  // item is i32
    }
    // vec is no longer usable here
    
    let mut vec = vec![1, 2, 3, 4, 5];
    
    // 3. iter_mut() - mutable borrows (&mut T)
    for item in vec.iter_mut() {
        *item *= 2;  // item is &mut i32
    }
    println!("{:?}", vec);  // [2, 4, 6, 8, 10]
}
```

这三个接口一定要区分清楚。<br><span class="zh-inline">很多借用检查器报错，说到底就是迭代方式选错了。`iter()` 是借，`into_iter()` 是拿走，`iter_mut()` 是独占可变借用。脑子里把这三张牌摆正，后面能少吃不少苦头。</span>

### Collecting Results<br><span class="zh-inline">收集结果</span>

```csharp
// C# - Processing collections with potential errors
public List<int> ParseNumbers(List<string> inputs)
{
    var results = new List<int>();
    foreach (string input in inputs)
    {
        if (int.TryParse(input, out int result))
        {
            results.Add(result);
        }
        // Silently skip invalid inputs
    }
    return results;
}
```

```rust
// Rust - Explicit error handling with collect
fn parse_numbers(inputs: Vec<String>) -> Result<Vec<i32>, std::num::ParseIntError> {
    inputs.into_iter()
        .map(|s| s.parse::<i32>())  // Returns Result<i32, ParseIntError>
        .collect()                  // Collects into Result<Vec<i32>, ParseIntError>
}

// Alternative: Filter out errors
fn parse_numbers_filter(inputs: Vec<String>) -> Vec<i32> {
    inputs.into_iter()
        .filter_map(|s| s.parse::<i32>().ok())  // Keep only Ok values
        .collect()
}

fn main() {
    let inputs = vec!["1".to_string(), "2".to_string(), "invalid".to_string(), "4".to_string()];
    
    // Version that fails on first error
    match parse_numbers(inputs.clone()) {
        Ok(numbers) => println!("All parsed: {:?}", numbers),
        Err(error) => println!("Parse error: {}", error),
    }
    
    // Version that skips errors
    let numbers = parse_numbers_filter(inputs);
    println!("Successfully parsed: {:?}", numbers);  // [1, 2, 4]
}
```

这段特别能体现 Rust 的风格差异。<br><span class="zh-inline">到底是“遇到一个错就整体失败”，还是“跳过错项继续收集成功结果”，在返回类型和迭代器链里会写得明明白白，不会混成一坨含糊逻辑。</span>

---

## Exercises<br><span class="zh-inline">练习</span>

<details>
<summary><strong>🏋️ Exercise: LINQ to Iterators</strong><br><span class="zh-inline"><strong>🏋️ 练习：把 LINQ 改成迭代器</strong></span></summary>

Translate this C# LINQ query to idiomatic Rust iterators:<br><span class="zh-inline">把下面这段 C# LINQ 查询改写成更符合 Rust 习惯的迭代器写法：</span>

```csharp
var result = students
    .Where(s => s.Grade >= 90)
    .OrderByDescending(s => s.Grade)
    .Select(s => $"{s.Name}: {s.Grade}")
    .Take(3)
    .ToList();
```

Use this struct:<br><span class="zh-inline">使用下面这个结构体：</span>

```rust
struct Student { name: String, grade: u32 }
```

Return a `Vec<String>` of the top 3 students with grade >= 90, formatted as `"Name: Grade"`.<br><span class="zh-inline">返回一个 `Vec<String>`，取分数大于等于 90 的前 3 名学生，并格式化成 `"Name: Grade"`。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
#[derive(Debug)]
struct Student { name: String, grade: u32 }

fn top_students(students: &mut [Student]) -> Vec<String> {
    students.sort_by(|a, b| b.grade.cmp(&a.grade)); // sort descending
    students.iter()
        .filter(|s| s.grade >= 90)
        .take(3)
        .map(|s| format!("{}: {}", s.name, s.grade))
        .collect()
}

fn main() {
    let mut students = vec![
        Student { name: "Alice".into(), grade: 95 },
        Student { name: "Bob".into(), grade: 88 },
        Student { name: "Carol".into(), grade: 92 },
        Student { name: "Dave".into(), grade: 97 },
        Student { name: "Eve".into(), grade: 91 },
    ];
    let result = top_students(&mut students);
    assert_eq!(result, vec!["Dave: 97", "Alice: 95", "Carol: 92"]);
    println!("{result:?}");
}
```

**Key difference from C#**: Rust iterators are lazy, but `.sort_by()` is eager and works in place. There is no lazy built-in `OrderBy`, so the usual approach is to sort first and then continue with lazy iterator steps.<br><span class="zh-inline">**和 C# 的一个关键差异：** Rust 迭代器本身是惰性的，但 `.sort_by()` 是立即执行而且原地排序。标准库里没有那种惰性的 `OrderBy`，所以通常要先排序，再接后面的惰性链。</span>

</details>
</details>

***
