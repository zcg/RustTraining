## Tuples and Destructuring<br><span class="zh-inline">元组与解构</span>

> **What you'll learn:** Rust tuples vs Python tuples, arrays and slices, structs (Rust's replacement for classes), `Vec<T>` vs `list`, `HashMap<K,V>` vs `dict`, and the newtype pattern for domain modeling.<br><span class="zh-inline">**本章将学习：** Rust 元组和 Python 元组的区别、数组与切片、结构体这类用来替代类的核心数据结构、`Vec<T>` 与 `list`、`HashMap<K,V>` 与 `dict` 的对应关系，以及用于领域建模的 newtype 模式。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 入门</span>

### Python Tuples<br><span class="zh-inline">Python 元组</span>

```python
# Python — tuples are immutable sequences
point = (3.0, 4.0)
x, y = point                    # Unpacking
print(f"x={x}, y={y}")

# Tuples can hold mixed types
record = ("Alice", 30, True)
name, age, active = record

# Named tuples for clarity
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float

p = Point(3.0, 4.0)
print(p.x)                      # Named access
```

### Rust Tuples<br><span class="zh-inline">Rust 元组</span>

```rust
// Rust — tuples are fixed-size, typed, can hold mixed types
let point: (f64, f64) = (3.0, 4.0);
let (x, y) = point;              // Destructuring (same as Python unpacking)
println!("x={x}, y={y}");

// Mixed types
let record: (&str, i32, bool) = ("Alice", 30, true);
let (name, age, active) = record;

// Access by index (unlike Python, uses .0 .1 .2 syntax)
let first = record.0;            // "Alice"
let second = record.1;           // 30

// Python: record[0]
// Rust:   record.0      ← dot-index, not bracket-index
```

### When to Use Tuples vs Structs<br><span class="zh-inline">什么时候该用元组，什么时候该用结构体</span>

```rust
// Tuples: quick grouping, function returns, temporary values
fn min_max(data: &[i32]) -> (i32, i32) {
    (*data.iter().min().unwrap(), *data.iter().max().unwrap())
}
let (lo, hi) = min_max(&[3, 1, 4, 1, 5]);

// Structs: named fields, clear intent, methods
struct Point { x: f64, y: f64 }

// Rule of thumb:
// - 2-3 same-type fields → tuple is fine
// - Named fields needed  → use struct
// - Methods needed       → use struct
// (Same guidance as Python: tuple vs namedtuple vs dataclass)
```

元组适合做轻量打包，结构体适合承载有明确语义的数据。只要开始想给字段命名、给类型加方法、或者让别人一眼看懂字段含义，基本就该上 `struct` 了。<br><span class="zh-inline">Tuples are good for light grouping, while structs are better once the data has real meaning. As soon as field names, methods, or readability start to matter, `struct` is usually the better choice.</span>

***

## Arrays and Slices<br><span class="zh-inline">数组与切片</span>

### Python Lists vs Rust Arrays<br><span class="zh-inline">Python 列表与 Rust 数组</span>

```python
# Python — lists are dynamic, heterogeneous
numbers = [1, 2, 3, 4, 5]       # Can grow, shrink, hold mixed types
numbers.append(6)
mixed = [1, "two", 3.0]         # Mixed types allowed
```

```rust
// Rust has TWO fixed-size vs dynamic concepts:

// 1. Array — fixed size, stack-allocated (no Python equivalent)
let numbers: [i32; 5] = [1, 2, 3, 4, 5]; // Size is part of the type!
// numbers.push(6);  // ❌ Arrays can't grow

// Initialize all elements to same value:
let zeros = [0; 10];            // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

// 2. Slice — a view into an array or Vec (like Python slicing, but borrowed)
let slice: &[i32] = &numbers[1..4]; // [2, 3, 4] — a reference, not a copy!

// Python: numbers[1:4] creates a NEW list (copy)
// Rust:   &numbers[1..4] creates a VIEW (no copy, no allocation)
```

Rust 这里分得很细：数组负责“固定大小的数据块”，切片负责“借一个窗口看看其中一段”。Python 开发者第一次看会觉得有点较真，但这套区分能把拷贝、分配和所有权说得非常清楚。<br><span class="zh-inline">Rust draws a sharper line here: arrays represent fixed-size data, while slices represent borrowed views into existing data. It feels stricter at first, but it makes copying, allocation, and ownership far more explicit.</span>

### Practical Comparison<br><span class="zh-inline">实际对照</span>

```python
# Python slicing — creates copies
data = [10, 20, 30, 40, 50]
first_three = data[:3]          # New list: [10, 20, 30]
last_two = data[-2:]            # New list: [40, 50]
reversed_data = data[::-1]      # New list: [50, 40, 30, 20, 10]
```

```rust
// Rust slicing — creates views (references)
let data = [10, 20, 30, 40, 50];
let first_three = &data[..3];         // &[i32], view: [10, 20, 30]
let last_two = &data[3..];            // &[i32], view: [40, 50]

// No negative indexing — use .len()
let last_two = &data[data.len()-2..]; // &[i32], view: [40, 50]

// Reverse: use an iterator
let reversed: Vec<i32> = data.iter().rev().copied().collect();
```

***

## Structs vs Classes<br><span class="zh-inline">结构体与类</span>

### Python Classes<br><span class="zh-inline">Python 类</span>

```python
# Python — class with __init__, methods, properties
from dataclasses import dataclass

@dataclass
class Rectangle:
    width: float
    height: float

    def area(self) -> float:
        return self.width * self.height

    def perimeter(self) -> float:
        return 2.0 * (self.width + self.height)

    def scale(self, factor: float) -> "Rectangle":
        return Rectangle(self.width * factor, self.height * factor)

    def __str__(self) -> str:
        return f"Rectangle({self.width} x {self.height})"

r = Rectangle(10.0, 5.0)
print(r.area())         # 50.0
print(r)                # Rectangle(10.0 x 5.0)
```

### Rust Structs<br><span class="zh-inline">Rust 结构体</span>

```rust
// Rust — struct + impl blocks (no inheritance!)
#[derive(Debug, Clone)]
struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    // "Constructor" — associated function (no self)
    fn new(width: f64, height: f64) -> Self {
        Rectangle { width, height }   // Field shorthand when names match
    }

    fn area(&self) -> f64 {
        self.width * self.height
    }

    fn perimeter(&self) -> f64 {
        2.0 * (self.width + self.height)
    }

    fn scale(&self, factor: f64) -> Rectangle {
        Rectangle::new(self.width * factor, self.height * factor)
    }
}

// Display trait = Python's __str__
impl std::fmt::Display for Rectangle {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Rectangle({} x {})", self.width, self.height)
    }
}

fn main() {
    let r = Rectangle::new(10.0, 5.0);
    println!("{}", r.area());    // 50.0
    println!("{}", r);           // Rectangle(10 x 5)
}
```

```mermaid
flowchart LR
    subgraph Python ["Python Object (Heap)<br/>Python 对象（堆上）"]
        PH["PyObject Header<br/>(refcount + type ptr)<br/>对象头"]
        PW["width: float obj<br/>width 浮点对象"]
        PHT["height: float obj<br/>height 浮点对象"]
        PD["__dict__"]
        PH --> PW
        PH --> PHT
        PH --> PD
    end
    subgraph Rust ["Rust Struct (Stack)<br/>Rust 结构体（栈上）"]
        RW["width: f64<br/>(8 bytes)"]
        RH["height: f64<br/>(8 bytes)"]
        RW --- RH
    end
    style Python fill:#ffeeba
    style Rust fill:#d4edda
```

> **Memory insight**: A Python `Rectangle` object has a 56-byte header + separate heap-allocated float objects. A Rust `Rectangle` is exactly 16 bytes on the stack — no indirection, no GC pressure.<br><span class="zh-inline">**内存视角：** Python 的 `Rectangle` 对象除了对象头之外，还会再指向独立分配的浮点对象；Rust 的 `Rectangle` 则是两个 `f64` 紧挨着放在一起，总共 16 字节，没有额外间接层，也没有垃圾回收压力。</span>
>
> 📌 **See also**: [Ch. 10 — Traits and Generics](ch10-traits-and-generics.md) covers implementing traits like `Display`, `Debug`, and operator overloading for your structs.<br><span class="zh-inline">📌 **延伸阅读：** [第 10 章——Trait 与泛型](ch10-traits-and-generics.md) 会继续讲如何为结构体实现 `Display`、`Debug` 以及运算符重载相关 trait。</span>

### Key Mapping: Python Dunder Methods → Rust Traits<br><span class="zh-inline">关键映射：Python 双下方法 → Rust trait</span>

| Python | Rust | Purpose<br><span class="zh-inline">用途</span> |
|--------|------|---------|
| `__str__` | `impl Display` | Human-readable string<br><span class="zh-inline">面向人的展示字符串</span> |
| `__repr__` | `#[derive(Debug)]` | Debug representation<br><span class="zh-inline">调试表示</span> |
| `__eq__` | `#[derive(PartialEq)]` | Equality comparison<br><span class="zh-inline">相等比较</span> |
| `__hash__` | `#[derive(Hash)]` | Hashable for maps and sets<br><span class="zh-inline">可作为哈希键</span> |
| `__lt__`, `__le__`, etc. | `#[derive(PartialOrd, Ord)]` | Ordering<br><span class="zh-inline">排序与比较</span> |
| `__add__` | `impl Add` | `+` operator<br><span class="zh-inline">`+` 运算符</span> |
| `__iter__` | `impl Iterator` | Iteration<br><span class="zh-inline">迭代</span> |
| `__len__` | `.len()` method | Length<br><span class="zh-inline">长度</span> |
| `__enter__`/`__exit__` | `impl Drop` | Cleanup<br><span class="zh-inline">资源清理</span> |
| `__init__` | `fn new()` | Constructor by convention<br><span class="zh-inline">约定俗成的构造函数</span> |
| `__getitem__` | `impl Index` | Indexing with `[]`<br><span class="zh-inline">下标访问</span> |
| `__contains__` | `.contains()` method | Membership test<br><span class="zh-inline">成员测试</span> |

### No Inheritance — Composition Instead<br><span class="zh-inline">没有继承，改用组合与 trait</span>

```python
# Python — inheritance
class Animal:
    def __init__(self, name: str):
        self.name = name
    def speak(self) -> str:
        raise NotImplementedError

class Dog(Animal):
    def speak(self) -> str:
        return f"{self.name} says Woof!"

class Cat(Animal):
    def speak(self) -> str:
        return f"{self.name} says Meow!"
```

```rust
// Rust — traits + composition (no inheritance)
trait Animal {
    fn name(&self) -> &str;
    fn speak(&self) -> String;
}

struct Dog { name: String }
struct Cat { name: String }

impl Animal for Dog {
    fn name(&self) -> &str { &self.name }
    fn speak(&self) -> String {
        format!("{} says Woof!", self.name)
    }
}

impl Animal for Cat {
    fn name(&self) -> &str { &self.name }
    fn speak(&self) -> String {
        format!("{} says Meow!", self.name)
    }
}

// Use trait objects for polymorphism (like Python's duck typing):
fn animal_roll_call(animals: &[&dyn Animal]) {
    for a in animals {
        println!("{}", a.speak());
    }
}
```

> **Mental model**: Python says "inherit behavior". Rust says "implement contracts". The practical outcome can look similar, but Rust avoids fragile base classes and diamond-inheritance-style surprises.<br><span class="zh-inline">**心智模型：** Python 更像是在说“把行为继承下来”，Rust 更像是在说“把契约实现出来”。最后呈现的多态效果可能类似，但 Rust 会避开脆弱基类和菱形继承那类历史遗留麻烦。</span>

***

## Vec vs list<br><span class="zh-inline">`Vec` 与 `list`</span>

`Vec<T>` is Rust's growable, heap-allocated array — the closest equivalent to Python's `list`.<br><span class="zh-inline">`Vec<T>` 是 Rust 里可增长、分配在堆上的顺序容器，也是最接近 Python `list` 的类型。</span>

### Creating Vectors<br><span class="zh-inline">创建向量</span>

```python
# Python
numbers = [1, 2, 3]
empty = []
repeated = [0] * 10
from_range = list(range(1, 6))
```

```rust
// Rust
let numbers = vec![1, 2, 3];            // vec! macro (like a list literal)
let empty: Vec<i32> = Vec::new();        // Empty vec (type annotation needed)
let repeated = vec![0; 10];              // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
let from_range: Vec<i32> = (1..6).collect(); // [1, 2, 3, 4, 5]
```

### Common Operations<br><span class="zh-inline">常见操作</span>

```python
# Python list operations
nums = [1, 2, 3]
nums.append(4)                   # [1, 2, 3, 4]
nums.extend([5, 6])             # [1, 2, 3, 4, 5, 6]
nums.insert(0, 0)               # [0, 1, 2, 3, 4, 5, 6]
last = nums.pop()               # 6, nums = [0, 1, 2, 3, 4, 5]
length = len(nums)              # 6
nums.sort()                     # In-place sort
sorted_copy = sorted(nums)     # New sorted list
nums.reverse()                  # In-place reverse
contains = 3 in nums           # True
index = nums.index(3)          # Index of first 3
```

```rust
// Rust Vec operations
let mut nums = vec![1, 2, 3];
nums.push(4);                          // [1, 2, 3, 4]
nums.extend([5, 6]);                   // [1, 2, 3, 4, 5, 6]
nums.insert(0, 0);                     // [0, 1, 2, 3, 4, 5, 6]
let last = nums.pop();                 // Some(6), nums = [0, 1, 2, 3, 4, 5]
let length = nums.len();               // 6
nums.sort();                           // In-place sort
let mut sorted_copy = nums.clone();
sorted_copy.sort();                    // Sort a clone
nums.reverse();                        // In-place reverse
let contains = nums.contains(&3);      // true
let index = nums.iter().position(|&x| x == 3); // Some(index) or None
```

### Quick Reference<br><span class="zh-inline">速查表</span>

| Python | Rust | Notes<br><span class="zh-inline">说明</span> |
|--------|------|-------|
| `lst.append(x)` | `vec.push(x)` | Append one element<br><span class="zh-inline">追加一个元素</span> |
| `lst.extend(other)` | `vec.extend(other)` | Append many elements<br><span class="zh-inline">追加多个元素</span> |
| `lst.pop()` | `vec.pop()` | Returns `Option<T>`<br><span class="zh-inline">返回 `Option<T>`</span> |
| `lst.insert(i, x)` | `vec.insert(i, x)` | Insert at position<br><span class="zh-inline">在指定位置插入</span> |
| `lst.remove(x)` | `vec.retain(\|v\| v != &x)` | Remove by value<br><span class="zh-inline">按值删除通常用 `retain`</span> |
| `del lst[i]` | `vec.remove(i)` | Returns the removed element<br><span class="zh-inline">删除并返回该元素</span> |
| `len(lst)` | `vec.len()` | Length<br><span class="zh-inline">长度</span> |
| `x in lst` | `vec.contains(&x)` | Membership test<br><span class="zh-inline">成员测试</span> |
| `lst.sort()` | `vec.sort()` | In-place sort<br><span class="zh-inline">原地排序</span> |
| `sorted(lst)` | Clone + sort, or iterator | New sorted result<br><span class="zh-inline">得到新的排序结果</span> |
| `lst[i]` | `vec[i]` | Panics if out of bounds<br><span class="zh-inline">越界会 panic</span> |
| `lst.get(i, default)` | `vec.get(i)` | Returns `Option<&T>`<br><span class="zh-inline">返回 `Option<&T>`</span> |
| `lst[1:3]` | `&vec[1..3]` | Returns a slice<br><span class="zh-inline">返回切片视图</span> |

***

## HashMap vs dict<br><span class="zh-inline">`HashMap` 与 `dict`</span>

`HashMap<K, V>` is Rust's hash map — equivalent to Python's `dict`.<br><span class="zh-inline">`HashMap<K, V>` 是 Rust 标准库里的哈希映射，对应 Python 的 `dict`。</span>

### Creating HashMaps<br><span class="zh-inline">创建哈希映射</span>

```python
# Python
scores = {"Alice": 100, "Bob": 85}
empty = {}
from_pairs = dict([("x", 1), ("y", 2)])
comprehension = {k: v for k, v in zip(keys, values)}
```

```rust
// Rust
use std::collections::HashMap;

let scores = HashMap::from([("Alice", 100), ("Bob", 85)]);
let empty: HashMap<String, i32> = HashMap::new();
let from_pairs: HashMap<&str, i32> = [("x", 1), ("y", 2)].into_iter().collect();
let comprehension: HashMap<_, _> = keys.iter().zip(values.iter()).collect();
```

### Common Operations<br><span class="zh-inline">常见操作</span>

```python
# Python dict operations
d = {"a": 1, "b": 2}
d["c"] = 3                      # Insert
val = d["a"]                     # 1 (KeyError if missing)
val = d.get("z", 0)             # 0 (default if missing)
del d["b"]                       # Remove
exists = "a" in d               # True
keys = list(d.keys())           # ["a", "c"]
values = list(d.values())       # [1, 3]
items = list(d.items())         # [("a", 1), ("c", 3)]
length = len(d)                 # 2

# setdefault / defaultdict
from collections import defaultdict
word_count = defaultdict(int)
for word in words:
    word_count[word] += 1
```

```rust
// Rust HashMap operations
use std::collections::HashMap;

let mut d = HashMap::new();
d.insert("a", 1);
d.insert("b", 2);
d.insert("c", 3);                       // Insert or overwrite

let val = d["a"];                        // 1 (panics if missing)
let val = d.get("z").copied().unwrap_or(0); // 0 (safe access)
d.remove("b");                          // Remove
let exists = d.contains_key("a");       // true
let keys: Vec<_> = d.keys().collect();
let values: Vec<_> = d.values().collect();
let length = d.len();

// entry API = Python's setdefault / defaultdict pattern
let mut word_count: HashMap<&str, i32> = HashMap::new();
for word in words {
    *word_count.entry(word).or_insert(0) += 1;
}
```

### Quick Reference<br><span class="zh-inline">速查表</span>

| Python | Rust | Notes<br><span class="zh-inline">说明</span> |
|--------|------|-------|
| `d[key] = val` | `d.insert(key, val)` | Insert or replace<br><span class="zh-inline">插入或覆盖</span> |
| `d[key]` | `d[&key]` | Panics if missing<br><span class="zh-inline">键不存在会 panic</span> |
| `d.get(key)` | `d.get(&key)` | Returns `Option<&V>`<br><span class="zh-inline">返回 `Option<&V>`</span> |
| `d.get(key, default)` | `d.get(&key).unwrap_or(&default)` | Provide default<br><span class="zh-inline">提供默认值</span> |
| `key in d` | `d.contains_key(&key)` | Key existence check<br><span class="zh-inline">判断键是否存在</span> |
| `del d[key]` | `d.remove(&key)` | Returns `Option<V>`<br><span class="zh-inline">删除并返回旧值</span> |
| `d.keys()` | `d.keys()` | Iterator<br><span class="zh-inline">返回迭代器</span> |
| `d.values()` | `d.values()` | Iterator<br><span class="zh-inline">返回迭代器</span> |
| `d.items()` | `d.iter()` | Iterator of `(&K, &V)`<br><span class="zh-inline">产出键值对引用</span> |
| `len(d)` | `d.len()` | Length<br><span class="zh-inline">长度</span> |
| `d.update(other)` | `d.extend(other)` | Bulk update<br><span class="zh-inline">批量更新</span> |
| `defaultdict(int)` | `.entry().or_insert(0)` | Entry API<br><span class="zh-inline">用 entry API 表达</span> |
| `d.setdefault(k, v)` | `d.entry(k).or_insert(v)` | Insert default if missing<br><span class="zh-inline">缺失时插入默认值</span> |

***

### Other Collections<br><span class="zh-inline">其他常见集合</span>

| Python | Rust | Notes<br><span class="zh-inline">说明</span> |
|--------|------|-------|
| `set()` | `HashSet<T>` | `use std::collections::HashSet;` |
| `collections.deque` | `VecDeque<T>` | Double-ended queue<br><span class="zh-inline">双端队列</span> |
| `heapq` | `BinaryHeap<T>` | Max-heap by default<br><span class="zh-inline">默认是最大堆</span> |
| `collections.OrderedDict` | `IndexMap` (crate) | `HashMap` does not preserve insertion order<br><span class="zh-inline">标准 `HashMap` 不保留插入顺序</span> |
| `sortedcontainers.SortedList` | `BTreeSet<T>` / `BTreeMap<K,V>` | Tree-based and ordered<br><span class="zh-inline">基于树结构，天然有序</span> |

---

## Exercises<br><span class="zh-inline">练习</span>

<details>
<summary><strong>🏋️ Exercise: Word Frequency Counter</strong><br><span class="zh-inline"><strong>🏋️ 练习：单词频率统计器</strong></span></summary>

**Challenge**: Write a function that takes a `&str` sentence and returns a `HashMap<String, usize>` of word frequencies, case-insensitive. In Python this is `Counter(s.lower().split())`. Translate it to Rust.<br><span class="zh-inline">**挑战**：写一个函数，接收一个 `&str` 句子并返回 `HashMap<String, usize>`，按不区分大小写的方式统计词频。Python 里的写法可以看成 `Counter(s.lower().split())`，把它翻译成 Rust。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use std::collections::HashMap;

fn word_frequencies(text: &str) -> HashMap<String, usize> {
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        let key = word.to_lowercase();
        *counts.entry(key).or_insert(0) += 1;
    }
    counts
}

fn main() {
    let text = "the quick brown fox jumps over the lazy fox";
    let freq = word_frequencies(text);
    for (word, count) in &freq {
        println!("{word}: {count}");
    }
}
```

**Key takeaway**: `HashMap::entry().or_insert()` is Rust's equivalent of Python's `defaultdict` or `Counter`. The `*` dereference is needed because `or_insert` returns `&mut usize`.<br><span class="zh-inline">**核心收获：** `HashMap::entry().or_insert()` 基本就是 Rust 里对应 `defaultdict` 或 `Counter` 的套路。这里要写 `*` 解引用，是因为 `or_insert` 返回的是 `&mut usize`。</span>

</details>
</details>

***
