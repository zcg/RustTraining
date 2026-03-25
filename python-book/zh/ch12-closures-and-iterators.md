## Rust Closures vs Python Lambdas<br><span class="zh-inline">Rust 闭包与 Python Lambda</span>

> **What you'll learn:** Multi-line closures, `Fn`/`FnMut`/`FnOnce` capture semantics, iterator chains vs list comprehensions, `map`/`filter`/`fold`, and `macro_rules!` basics.<br><span class="zh-inline">**本章将学习：** 多行闭包、`Fn`/`FnMut`/`FnOnce` 的捕获语义、迭代器链与列表推导式的对应关系、`map`/`filter`/`fold` 的基本用法，以及 `macro_rules!` 的入门概念。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 进阶</span>

### Python Closures and Lambdas<br><span class="zh-inline">Python 闭包与 Lambda</span>

```python
# Python — lambdas are one-expression anonymous functions
double = lambda x: x * 2
result = double(5)  # 10

# Full closures capture variables from enclosing scope:
def make_adder(n):
    def adder(x):
        return x + n    # Captures `n` from outer scope
    return adder

add_5 = make_adder(5)
print(add_5(10))  # 15

# Higher-order functions:
numbers = [1, 2, 3, 4, 5]
doubled = list(map(lambda x: x * 2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))
```

### Rust Closures<br><span class="zh-inline">Rust 闭包</span>

```rust
// Rust — closures use |args| body syntax
let double = |x: i32| x * 2;
let result = double(5);  // 10

// Closures capture variables from enclosing scope:
fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
    move |x| x + n    // `move` transfers ownership of `n` into the closure
}

let add_5 = make_adder(5);
println!("{}", add_5(10));  // 15

// Higher-order functions with iterators:
let numbers = vec![1, 2, 3, 4, 5];
let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
let evens: Vec<i32> = numbers.iter().filter(|&&x| x % 2 == 0).copied().collect();
```

### Closure Syntax Comparison<br><span class="zh-inline">闭包语法对照</span>

```text
Python:                              Rust:
─────────                            ─────
lambda x: x * 2                      |x| x * 2
lambda x, y: x + y                   |x, y| x + y
lambda: 42                           || 42

# Multi-line
def f(x):                            |x| {
    y = x * 2                            let y = x * 2;
    return y + 1                         y + 1
                                      }
```

Rust 的闭包语法一开始看着像是在较劲，其实逻辑很统一：参数放在竖线里，后面接表达式或者代码块。真用熟了之后，反而比 Python 里 `lambda` 加外层函数定义那套更利索。<br><span class="zh-inline">Rust closure syntax can look unusual at first, but the rule is consistent: put parameters between pipes, then follow with an expression or block. Once it clicks, it often feels cleaner than juggling Python lambdas and nested functions.</span>

### Closure Capture — How Rust Differs<br><span class="zh-inline">闭包捕获：Rust 有什么不同</span>

```python
# Python — closures capture by reference (late binding!)
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])  # [2, 2, 2] — surprise! All captured the same `i`

# Fix with default arg trick:
funcs = [lambda i=i: i for i in range(3)]
print([f() for f in funcs])  # [0, 1, 2]
```

```rust
// Rust — closures capture correctly (no late-binding gotcha)
let funcs: Vec<Box<dyn Fn() -> i32>> = (0..3)
    .map(|i| Box::new(move || i) as Box<dyn Fn() -> i32>)
    .collect();

let results: Vec<i32> = funcs.iter().map(|f| f()).collect();
println!("{:?}", results);  // [0, 1, 2] — correct!

// `move` captures a COPY of `i` for each closure — no late-binding surprise.
```

Python 里这个 late binding 坑，坑过一次基本就记一辈子。Rust 借助 `move` 和所有权语义，把每次循环里的值稳稳当当地放进各自闭包里，少了很多阴招。<br><span class="zh-inline">Python’s late-binding surprise is memorable for all the wrong reasons. Rust avoids it by making capture behavior explicit through ownership and `move`.</span>

### Three Closure Traits<br><span class="zh-inline">三种闭包 trait</span>

```rust
// Rust closures implement one or more of these traits:

// Fn — can be called multiple times, doesn't mutate captures (most common)
fn apply(f: impl Fn(i32) -> i32, x: i32) -> i32 { f(x) }

// FnMut — can be called multiple times, MAY mutate captures
fn apply_mut(mut f: impl FnMut(i32) -> i32, x: i32) -> i32 { f(x) }

// FnOnce — can only be called ONCE (consumes captures)
fn apply_once(f: impl FnOnce() -> String) -> String { f() }

// Python has no equivalent — closures are always Fn-like.
// In Rust, the compiler automatically determines which trait to use.
```

这三个 trait 讲的不是闭包长啥样，而是闭包会不会修改捕获值、会不会把捕获值消耗掉。理解这一层，很多编译器提示就顺眼多了。<br><span class="zh-inline">These traits describe how a closure uses what it captures, not what it looks like. Once that clicks, many Rust compiler messages around closures become much easier to read.</span>

***

## Iterators vs Generators<br><span class="zh-inline">迭代器与生成器</span>

### Python Generators<br><span class="zh-inline">Python 生成器</span>

```python
# Python — generators with yield
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# Lazy — values computed on demand
fib = fibonacci()
first_10 = [next(fib) for _ in range(10)]

# Generator expressions — like lazy list comprehensions
squares = (x ** 2 for x in range(1000000))  # No memory allocation
first_5 = [next(squares) for _ in range(5)]
```

### Rust Iterators<br><span class="zh-inline">Rust 迭代器</span>

```rust
// Rust — Iterator trait (similar concept, different syntax)
struct Fibonacci {
    a: u64,
    b: u64,
}

impl Fibonacci {
    fn new() -> Self {
        Fibonacci { a: 0, b: 1 }
    }
}

impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<Self::Item> {
        let current = self.a;
        self.a = self.b;
        self.b = current + self.b;
        Some(current)
    }
}

// Lazy — values computed on demand (just like Python generators)
let first_10: Vec<u64> = Fibonacci::new().take(10).collect();

// Iterator chains — like generator expressions
let squares: Vec<u64> = (0..1_000_000u64).map(|x| x * x).take(5).collect();
```

Rust 没有 `yield` 这个语法糖，但 `Iterator` trait 把“按需产出下一个值”这件事固定成了统一接口。写法更工程化，组合能力也更强。<br><span class="zh-inline">Rust does not use `yield` here, but the `Iterator` trait formalizes the same lazy “produce the next item on demand” behavior through a reusable interface.</span>

***

## Comprehensions vs Iterator Chains<br><span class="zh-inline">推导式与迭代器链</span>

This section maps Python's comprehension syntax to Rust's iterator chains.<br><span class="zh-inline">这一节把 Python 的推导式写法，对应到 Rust 的迭代器链上。</span>

### List Comprehension → map/filter/collect<br><span class="zh-inline">列表推导式 → `map` / `filter` / `collect`</span>

```python
# Python comprehensions:
squares = [x ** 2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]
names = [user.name for user in users if user.active]
pairs = [(x, y) for x in range(3) for y in range(3)]
flat = [item for sublist in nested for item in sublist]
```

```mermaid
flowchart LR
    A["Source<br/>[1,2,3,4,5]<br/>原始数据"] -->|.iter()| B["Iterator<br/>迭代器"]
    B -->|.filter(|x| x%2==0)| C["[2, 4]<br/>筛选后"]
    C -->|.map(|x| x*x)| D["[4, 16]<br/>映射后"]
    D -->|.collect()| E["Vec&lt;i32&gt;<br/>[4, 16]"]
    style A fill:#ffeeba
    style E fill:#d4edda
```

> **Key insight**: Rust iterators are lazy — nothing happens until `.collect()`. Python generators work similarly, but list comprehensions evaluate eagerly.<br><span class="zh-inline">**关键理解：** Rust 迭代器默认是惰性的，通常到 `.collect()` 为止才真正执行。Python 生成器也类似，但列表推导式本身是立即求值的。</span>

```rust
// Rust iterator chains:
let squares: Vec<i32> = (0..10).map(|x| x * x).collect();
let evens: Vec<i32> = (0..20).filter(|x| x % 2 == 0).collect();
let names: Vec<&str> = users.iter()
    .filter(|u| u.active)
    .map(|u| u.name.as_str())
    .collect();
let pairs: Vec<(i32, i32)> = (0..3)
    .flat_map(|x| (0..3).map(move |y| (x, y)))
    .collect();
let flat: Vec<i32> = nested.iter()
    .flat_map(|sublist| sublist.iter().copied())
    .collect();
```

### Dict Comprehension → collect into HashMap<br><span class="zh-inline">字典推导式 → 收集成 `HashMap`</span>

```python
# Python
word_lengths = {word: len(word) for word in words}
inverted = {v: k for k, v in mapping.items()}
```

```rust
// Rust
let word_lengths: HashMap<&str, usize> = words.iter()
    .map(|w| (*w, w.len()))
    .collect();
let inverted: HashMap<&V, &K> = mapping.iter()
    .map(|(k, v)| (v, k))
    .collect();
```

### Set Comprehension → collect into HashSet<br><span class="zh-inline">集合推导式 → 收集成 `HashSet`</span>

```python
# Python
unique_lengths = {len(word) for word in words}
```

```rust
// Rust
let unique_lengths: HashSet<usize> = words.iter()
    .map(|w| w.len())
    .collect();
```

### Common Iterator Methods<br><span class="zh-inline">常见迭代器方法</span>

| Python | Rust | Notes<br><span class="zh-inline">说明</span> |
|--------|------|-------|
| `map(f, iter)` | `.map(f)` | Transform each element<br><span class="zh-inline">转换每个元素</span> |
| `filter(f, iter)` | `.filter(f)` | Keep matching elements<br><span class="zh-inline">保留满足条件的元素</span> |
| `sum(iter)` | `.sum()` | Sum all elements<br><span class="zh-inline">求和</span> |
| `min(iter)` / `max(iter)` | `.min()` / `.max()` | Returns `Option`<br><span class="zh-inline">返回 `Option`</span> |
| `any(f(x) for x in iter)` | `.any(f)` | True if any match<br><span class="zh-inline">任一满足即可</span> |
| `all(f(x) for x in iter)` | `.all(f)` | True if all match<br><span class="zh-inline">全部满足才为真</span> |
| `enumerate(iter)` | `.enumerate()` | Index + value<br><span class="zh-inline">返回索引和值</span> |
| `zip(a, b)` | `a.zip(b)` | Pair elements<br><span class="zh-inline">把两个迭代器配对</span> |
| `len(list)` | `.count()` or `.len()` | Counting may consume iterators<br><span class="zh-inline">计数可能会消耗迭代器</span> |
| `list(reversed(x))` | `.rev()` | Reverse iteration<br><span class="zh-inline">反向迭代</span> |
| `itertools.chain(a, b)` | `a.chain(b)` | Concatenate iterators<br><span class="zh-inline">拼接迭代器</span> |
| `next(iter)` | `.next()` | Get next element<br><span class="zh-inline">取下一个元素</span> |
| `next(iter, default)` | `.next().unwrap_or(default)` | With default<br><span class="zh-inline">带默认值</span> |
| `list(iter)` | `.collect::<Vec<_>>()` | Materialize into collection<br><span class="zh-inline">物化成集合</span> |
| `sorted(iter)` | Collect, then `.sort()` | No lazy sorted iterator<br><span class="zh-inline">一般先收集再排序</span> |
| `functools.reduce(f, iter)` | `.fold(init, f)` or `.reduce(f)` | Accumulate<br><span class="zh-inline">累计归约</span> |

### Key Differences<br><span class="zh-inline">关键差异</span>

```text
Python iterators:                     Rust iterators:
─────────────────                     ──────────────
- Lazy by default (generators)       - Lazy by default (all iterator chains)
- yield creates generators           - impl Iterator { fn next() }
- StopIteration to end               - None to end
- Can be consumed once               - Can be consumed once
- No type safety                     - Fully type-safe
- Slightly slower (interpreter)      - Zero-cost (compiled away)
```

***

## Why Macros Exist in Rust<br><span class="zh-inline">Rust 为什么需要宏</span>

Python has no macro system. It relies on decorators, metaclasses, and runtime introspection for metaprogramming. Rust instead uses macros for compile-time code generation.<br><span class="zh-inline">Python 没有真正意义上的宏系统，元编程主要依赖装饰器、元类和运行时反射。Rust 则把这类能力前移到编译期，用宏来生成代码。</span>

### Python Metaprogramming vs Rust Macros<br><span class="zh-inline">Python 元编程与 Rust 宏</span>

```python
# Python — decorators and metaclasses for metaprogramming
from dataclasses import dataclass
from functools import wraps

@dataclass              # Generates __init__, __repr__, __eq__ at import time
class Point:
    x: float
    y: float

# Custom decorator
def log_calls(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log_calls
def process(data):
    return data.upper()
```

```rust
// Rust — derive macros and declarative macros for code generation
#[derive(Debug, Clone, PartialEq)]  // Generates Debug, Clone, PartialEq impls at COMPILE time
struct Point {
    x: f64,
    y: f64,
}

// Declarative macro (like a template)
macro_rules! log_call {
    ($func_name:expr, $body:expr) => {
        println!("Calling {}", $func_name);
        $body
    };
}

fn process(data: &str) -> String {
    log_call!("process", data.to_uppercase())
}
```

### Common Built-in Macros<br><span class="zh-inline">常见内建宏</span>

```rust
// These macros are used everywhere in Rust:

println!("Hello, {}!", name);           // Print with formatting
format!("Value: {}", x);               // Create formatted String
vec![1, 2, 3];                          // Create a Vec
assert_eq!(2 + 2, 4);                  // Test assertion
assert!(value > 0, "must be positive"); // Boolean assertion
dbg!(expression);                       // Debug print: prints expression AND value
todo!();                                // Placeholder — compiles but panics if reached
unimplemented!();                       // Mark code as unimplemented
panic!("something went wrong");         // Crash with message (like raise RuntimeError)

// Why are these macros instead of functions?
// - println! accepts variable arguments (Rust functions can't)
// - vec! generates code for any type and size
// - assert_eq! knows the SOURCE CODE of what you compared
// - dbg! knows the FILE NAME and LINE NUMBER
```

宏本质上就是“编译前展开的代码模板”。听着挺猛，但 Rust 把常用宏控制得很规矩，所以平时写起来并不会妖里妖气。<br><span class="zh-inline">Macros are essentially code templates expanded before compilation. That sounds powerful, but Rust keeps common macro usage disciplined enough to remain readable in everyday code.</span>

## Writing a Simple Macro with macro_rules!<br><span class="zh-inline">用 `macro_rules!` 写一个简单宏</span>

```rust
// Python dict() equivalent
// Python: d = dict(a=1, b=2)
// Rust:   let d = hashmap!{ "a" => 1, "b" => 2 };

macro_rules! hashmap {
    ($($key:expr => $value:expr),* $(,)?) => {
        {
            let mut map = std::collections::HashMap::new();
            $(map.insert($key, $value);)*
            map
        }
    };
}

let scores = hashmap! {
    "Alice" => 100,
    "Bob" => 85,
    "Charlie" => 90,
};
```

## Derive Macros — Auto-Implementing Traits<br><span class="zh-inline">派生宏：自动实现 trait</span>

```rust
// #[derive(...)] is the Rust equivalent of Python's @dataclass decorator

// Python:
// @dataclass(frozen=True, order=True)
// class Student:
//     name: str
//     grade: int

// Rust:
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
struct Student {
    name: String,
    grade: i32,
}

// Common derive macros:
// Debug         → {:?} formatting (like __repr__)
// Clone         → .clone() deep copy
// Copy          → implicit copy (only for simple types)
// PartialEq, Eq → == comparison (like __eq__)
// PartialOrd, Ord → <, >, sorting (like __lt__ etc.)
// Hash          → usable as HashMap key (like __hash__)
// Default       → MyType::default() (like __init__ with no args)

// Crate-provided derive macros:
// Serialize, Deserialize (serde) → JSON/YAML/TOML serialization
//                                  (like Python's json.dumps/loads but type-safe)
```

### Python Decorator vs Rust Derive<br><span class="zh-inline">Python 装饰器与 Rust 派生宏</span>

| Python Decorator | Rust Derive | Purpose<br><span class="zh-inline">用途</span> |
|-----------------|-------------|---------|
| `@dataclass` | `#[derive(Debug, Clone, PartialEq)]` | Data class<br><span class="zh-inline">数据类</span> |
| `@dataclass(frozen=True)` | Immutable by default | Immutability<br><span class="zh-inline">默认不可变</span> |
| `@dataclass(order=True)` | `#[derive(Ord, PartialOrd)]` | Comparison and sorting<br><span class="zh-inline">比较与排序</span> |
| `@total_ordering` | `#[derive(PartialOrd, Ord)]` | Full ordering<br><span class="zh-inline">完整排序能力</span> |
| `json.dumps(obj.__dict__)` | `#[derive(Serialize)]` | Serialization<br><span class="zh-inline">序列化</span> |
| `MyClass(**json.loads(s))` | `#[derive(Deserialize)]` | Deserialization<br><span class="zh-inline">反序列化</span> |

---

## Exercises<br><span class="zh-inline">练习</span>

<details>
<summary><strong>🏋️ Exercise: Derive and Custom Debug</strong><br><span class="zh-inline"><strong>🏋️ 练习：派生与自定义 Debug</strong></span></summary>

**Challenge**: Create a `User` struct with fields `name: String`, `email: String`, and `password_hash: String`. Derive `Clone` and `PartialEq`, but implement `Debug` manually so it prints the name and email while redacting the password as `"***"`.<br><span class="zh-inline">**挑战**：创建一个 `User` 结构体，包含 `name: String`、`email: String` 和 `password_hash: String` 三个字段。为它派生 `Clone` 和 `PartialEq`，但手写 `Debug`，让调试输出只显示用户名和邮箱，密码位置统一显示成 `"***"`。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use std::fmt;

#[derive(Clone, PartialEq)]
struct User {
    name: String,
    email: String,
    password_hash: String,
}

impl fmt::Debug for User {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("User")
            .field("name", &self.name)
            .field("email", &self.email)
            .field("password_hash", &"***")
            .finish()
    }
}

fn main() {
    let user = User {
        name: "Alice".into(),
        email: "alice@example.com".into(),
        password_hash: "a1b2c3d4e5f6".into(),
    };
    println!("{user:?}");
    // Output: User { name: "Alice", email: "alice@example.com", password_hash: "***" }
}
```

**Key takeaway**: Rust lets you derive `Debug` for free, but it also lets you override the behavior when sensitive fields need special treatment. That is much safer than casually printing Python objects and hoping nothing private leaks.<br><span class="zh-inline">**核心收获：** Rust 虽然可以很方便地自动派生 `Debug`，但一旦涉及敏感字段，也能随时手写覆盖。这比在 Python 里随手 `print(obj)` 然后祈祷别把隐私打出去要稳当得多。</span>

</details>
</details>

***
