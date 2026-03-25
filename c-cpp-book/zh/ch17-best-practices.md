# Rust Best Practices Summary<br><span class="zh-inline">Rust 最佳实践总结</span>

> **What you'll learn:** Practical guidelines for writing idiomatic Rust, including code organization, naming, error handling, memory usage, performance habits, and which common traits are worth implementing.<br><span class="zh-inline">**本章将学到什么：** 编写惯用 Rust 的一组实用准则，包括代码组织、命名、错误处理、内存使用、性能习惯，以及哪些常见 trait 值得实现。</span>

## Code Organization<br><span class="zh-inline">代码组织</span>

- **Prefer small functions**: they are easier to test and reason about.<br><span class="zh-inline">**优先写小函数**：更容易测试，也更容易推理。</span>
- **Use descriptive names**: `calculate_total_price()` beats `calc()` every day.<br><span class="zh-inline">**名字要说明白**：`calculate_total_price()` 远比 `calc()` 强。</span>
- **Group related functionality**: use modules and separate files to表达职责边界。<br><span class="zh-inline">**把相关功能放在一起**：用模块和拆文件表达清楚职责边界。</span>
- **Write documentation**: public API 就老老实实写 `///` 文档。<br><span class="zh-inline">**写文档**：公开 API 就别偷懒，老老实实写 `///`。</span>

## Error Handling<br><span class="zh-inline">错误处理</span>

- **Avoid `unwrap()` unless the operation is truly infallible**.<br><span class="zh-inline">**除非真的是不可能失败，否则别乱用 `unwrap()`。**</span>

```rust
// Bad: can panic
let value = some_option.unwrap();

// Better: handle the missing case
let value = some_option.unwrap_or(default_value);
let value = some_option.unwrap_or_else(|| expensive_computation());
let value = some_option.unwrap_or_default();

// For Result<T, E>
let value = some_result.unwrap_or(fallback_value);
let value = some_result.unwrap_or_else(|err| {
    eprintln!("Error occurred: {err}");
    default_value
});
```

- **Use `expect()` with a descriptive message** when an unwrap-style failure would indicate a violated invariant.<br><span class="zh-inline">**如果失败意味着不变量被破坏，就改用 `expect()` 并写清楚原因。**</span>

```rust
let config = std::env::var("CONFIG_PATH")
    .expect("CONFIG_PATH environment variable must be set");
```

- **Return `Result<T, E>` for fallible operations** so callers decide what recovery means.<br><span class="zh-inline">**可失败操作就返回 `Result<T, E>`**，把恢复策略交给调用方。</span>
- **Use `thiserror` for custom error types** instead of手写一堆样板实现。<br><span class="zh-inline">**自定义错误类型优先用 `thiserror`**，别手搓一堆样板代码。</span>

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Parse error: {message}")]
    Parse { message: String },
    
    #[error("Value {value} is out of range")]
    OutOfRange { value: i32 },
}
```

- **Use `?` to propagate errors** through the call stack cleanly.<br><span class="zh-inline">**用 `?` 传播错误**，让调用链保持干净。</span>
- **Prefer `thiserror` over `anyhow`** for libraries and production code, because explicit error enums remain matchable by callers.<br><span class="zh-inline">**库代码和正式生产代码里更推荐 `thiserror` 而不是 `anyhow`**，因为显式错误枚举还能被调用方精确匹配。</span>
- **Acceptable uses of `unwrap()`**:<br><span class="zh-inline">**`unwrap()` 勉强算合理的场景：**</span>
  - Unit tests<br><span class="zh-inline">单元测试里</span>
  - Short-lived prototypes<br><span class="zh-inline">短命原型代码里</span>
  - Situations where failure has already been logically ruled out<br><span class="zh-inline">前面已经在逻辑上排除了失败的情况</span>

```rust
let numbers = vec![1, 2, 3];
let first = numbers.get(0).unwrap();

let first = numbers.get(0)
    .expect("numbers vec is non-empty by construction");
```

- **Fail fast**: validate preconditions early and bail out immediately when they do not hold.<br><span class="zh-inline">**尽早失败**：前置条件尽早检查，不成立就立刻返回错误。</span>

## Memory Management<br><span class="zh-inline">内存管理</span>

- **Prefer borrowing over cloning** whenever ownership transfer is unnecessary.<br><span class="zh-inline">**能借用就借用，别动不动就 clone。**</span>
- **Use `Rc<T>` sparingly** and only when shared ownership is genuinely needed.<br><span class="zh-inline">**`Rc<T>` 少用**，只有真的需要共享所有权时再上。</span>
- **Limit lifetimes with scopes**: `{}` blocks can make drop timing explicit.<br><span class="zh-inline">**用作用域控制生命周期**：必要时直接上 `{}` 缩短值的存活时间。</span>
- **Avoid exposing `RefCell<T>` in public APIs**: keep interior mutability tucked inside implementations.<br><span class="zh-inline">**别在公共 API 里乱暴露 `RefCell<T>`**，内部可变性尽量藏在实现细节里。</span>

## Performance<br><span class="zh-inline">性能</span>

- **Profile before optimizing**: use benchmarks and profiler data, not直觉表演。<br><span class="zh-inline">**优化前先测**：靠 benchmark 和 profiler 说话，别光靠直觉演戏。</span>
- **Prefer iterators over manual loops** when they improve clarity and allow optimization.<br><span class="zh-inline">**优先考虑迭代器**，写法更清晰时通常也更容易被优化。</span>
- **Use `&str` instead of `String`** whenever ownership is unnecessary.<br><span class="zh-inline">**不需要所有权时就用 `&str`，别硬上 `String`。**</span>
- **Move huge stack objects to the heap with `Box<T>` when needed**.<br><span class="zh-inline">**超大的栈对象必要时用 `Box<T>` 挪到堆上。**</span>

## Essential Traits to Implement<br><span class="zh-inline">值得考虑实现的核心 trait</span>

### Core Traits Every Type Should Consider<br><span class="zh-inline">每个类型都该想一想的核心 trait</span>

When building custom types, the goal is to make them feel native in Rust. These traits are the usual starting set.<br><span class="zh-inline">自定义类型想写得像“原生 Rust 类型”，最先该考虑的通常就是下面这些 trait。</span>

#### Debug and Display<br><span class="zh-inline">`Debug` 与 `Display`</span>

```rust
use std::fmt;

#[derive(Debug)]
struct Person {
    name: String,
    age: u32,
}

impl fmt::Display for Person {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} (age {})", self.name, self.age)
    }
}

let person = Person { name: "Alice".to_string(), age: 30 };
println!("{:?}", person);
println!("{}", person);
```

#### Clone and Copy<br><span class="zh-inline">`Clone` 与 `Copy`</span>

```rust
#[derive(Debug, Clone, Copy)]
struct Point {
    x: i32,
    y: i32,
}

#[derive(Debug, Clone)]
struct Person {
    name: String,
    age: u32,
}

let p1 = Point { x: 1, y: 2 };
let p2 = p1;

let person1 = Person { name: "Bob".to_string(), age: 25 };
let person2 = person1.clone();
```

#### PartialEq and Eq<br><span class="zh-inline">`PartialEq` 与 `Eq`</span>

```rust
#[derive(Debug, PartialEq, Eq)]
struct UserId(u64);

#[derive(Debug, PartialEq)]
struct Temperature {
    celsius: f64,
}

let id1 = UserId(123);
let id2 = UserId(123);
assert_eq!(id1, id2);
```

#### PartialOrd and Ord<br><span class="zh-inline">`PartialOrd` 与 `Ord`</span>

```rust
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
struct Priority(u8);

let high = Priority(1);
let low = Priority(10);
assert!(high < low);

let mut priorities = vec![Priority(5), Priority(1), Priority(8)];
priorities.sort();
```

#### Default<br><span class="zh-inline">`Default`</span>

```rust
#[derive(Debug, Default)]
struct Config {
    debug: bool,
    max_connections: u32,
    timeout: Option<u64>,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            debug: false,
            max_connections: 100,
            timeout: Some(30),
        }
    }
}

let config = Config::default();
let config = Config { debug: true, ..Default::default() };
```

#### From and Into<br><span class="zh-inline">`From` 与 `Into`</span>

```rust
struct UserId(u64);
struct UserName(String);

impl From<u64> for UserId {
    fn from(id: u64) -> Self {
        UserId(id)
    }
}

impl From<String> for UserName {
    fn from(name: String) -> Self {
        UserName(name)
    }
}

impl From<&str> for UserName {
    fn from(name: &str) -> Self {
        UserName(name.to_string())
    }
}
```

#### TryFrom and TryInto<br><span class="zh-inline">`TryFrom` 与 `TryInto`</span>

```rust
use std::convert::TryFrom;

struct PositiveNumber(u32);

#[derive(Debug)]
struct NegativeNumberError;

impl TryFrom<i32> for PositiveNumber {
    type Error = NegativeNumberError;
    
    fn try_from(value: i32) -> Result<Self, Self::Error> {
        if value >= 0 {
            Ok(PositiveNumber(value as u32))
        } else {
            Err(NegativeNumberError)
        }
    }
}
```

#### Serde for Serialization<br><span class="zh-inline">序列化用的 Serde</span>

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
    email: String,
}
```

### Trait Implementation Checklist<br><span class="zh-inline">trait 实现检查清单</span>

```rust
#[derive(
    Debug,
    Clone,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
    Default,
)]
struct MyType {
    // fields...
}

impl Display for MyType { /* user-facing representation */ }
impl From<OtherType> for MyType { /* convenient conversion */ }
impl TryFrom<FallibleType> for MyType { /* fallible conversion */ }
```

### When NOT to Implement Traits<br><span class="zh-inline">什么时候不要乱实现 trait</span>

- **Do not implement `Copy` for heap-owning types** such as `String`、`Vec`、`HashMap`。<br><span class="zh-inline">**带堆数据的类型别实现 `Copy`**，像 `String`、`Vec`、`HashMap` 都不合适。</span>
- **Do not implement `Eq` for values that may contain NaN**.<br><span class="zh-inline">**可能含 NaN 的类型别实现 `Eq`。**</span>
- **Do not implement `Default` when no sensible default exists**.<br><span class="zh-inline">**如果根本不存在“合理默认值”，就别硬实现 `Default`。**</span>
- **Do not implement `Clone` casually for huge data structures** if the cost is misleadingly high.<br><span class="zh-inline">**巨大数据结构别随手实现 `Clone`**，否则别人一用就可能踩性能雷。</span>

### Summary: Trait Benefits<br><span class="zh-inline">trait 带来的直接好处</span>

| Trait | Benefit<br><span class="zh-inline">好处</span> | When to Use<br><span class="zh-inline">适用时机</span> |
|-------|---------|-------------|
| `Debug` | `println!("{:?}", value)` | Almost always<br><span class="zh-inline">几乎总该有</span> |
| `Display` | `println!("{}", value)` | User-facing types<br><span class="zh-inline">面向用户展示的类型</span> |
| `Clone` | `value.clone()` | Explicit duplication makes sense<br><span class="zh-inline">明确复制有意义时</span> |
| `Copy` | Implicit duplication | Small, plain-value types<br><span class="zh-inline">小而简单的值类型</span> |
| `PartialEq` | `==` and `!=` | Most comparable types<br><span class="zh-inline">大多数可比较类型</span> |
| `Eq` | Reflexive equality | Equality is mathematically sound<br><span class="zh-inline">相等关系严格成立时</span> |
| `PartialOrd` | `<`, `>`, `<=`, `>=` | Naturally ordered types<br><span class="zh-inline">存在自然顺序的类型</span> |
| `Ord` | `sort()`, `BinaryHeap` | Total ordering exists<br><span class="zh-inline">存在全序关系时</span> |
| `Hash` | HashMap keys | As map/set keys<br><span class="zh-inline">要作为键使用时</span> |
| `Default` | `Default::default()` | Obvious default value exists<br><span class="zh-inline">存在自然默认值时</span> |
| `From/Into` | Convenient conversions | Common conversions<br><span class="zh-inline">存在常用转换时</span> |
| `TryFrom/TryInto` | Fallible conversions | Conversion may fail<br><span class="zh-inline">转换本来就可能失败时</span> |

---
