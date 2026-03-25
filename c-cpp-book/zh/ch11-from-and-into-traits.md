# Rust From and Into traits<br><span class="zh-inline">Rust 的 From 与 Into trait</span>

> **What you'll learn:** Rust's type conversion traits — `From<T>` and `Into<T>` for infallible conversions, `TryFrom` and `TryInto` for fallible ones. Implement `From` and get `Into` for free. Replaces C++ conversion operators and constructors.<br><span class="zh-inline">**本章将学到什么：** Rust 的类型转换 trait，包括用于不会失败转换的 `From<T>` 和 `Into<T>`，以及用于可能失败转换的 `TryFrom` 和 `TryInto`。只要实现了 `From`，`Into` 就会自动可用。这一套基本可以替代 C++ 里的转换运算符和部分构造器用途。</span>

- ```From``` and ```Into``` are complementary traits to facilitate type conversion<br><span class="zh-inline">```From``` 和 ```Into``` 是一对互补的 trait，专门用来做类型转换。</span>
- Types normally implement on the ```From``` trait. the ```String::from()``` converts from "&str" to ```String```, and compiler can automatically derive ```&str.into```<br><span class="zh-inline">通常都是给类型实现 ```From```。例如 ```String::from()``` 会把 `&str` 转成 ```String```，而编译器也会自动让 ```&str.into()``` 成立。</span>

```rust
struct Point {x: u32, y: u32}
// Construct a Point from a tuple
impl From<(u32, u32)> for Point {
    fn from(xy : (u32, u32)) -> Self {
        Point {x : xy.0, y: xy.1}       // Construct Point using the tuple elements
    }
}
fn main() {
    let s = String::from("Rust");
    let x = u32::from(true);
    let p = Point::from((40, 42));
    // let p : Point = (40.42)::into(); // Alternate form of the above
    println!("s: {s} x:{x} p.x:{} p.y {}", p.x, p.y);   
}
```

# Exercise: From and Into<br><span class="zh-inline">练习：From 与 Into</span>

- Implement a ```From``` trait for ```Point``` to convert into a type called ```TransposePoint```. ```TransposePoint``` swaps the ```x``` and ```y``` elements of ```Point```<br><span class="zh-inline">为 ```Point``` 实现一个 ```From``` trait，把它转换成一个叫 ```TransposePoint``` 的类型。```TransposePoint``` 会把 ```Point``` 里的 ```x``` 和 ```y``` 对调。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
struct Point { x: u32, y: u32 }
struct TransposePoint { x: u32, y: u32 }

impl From<Point> for TransposePoint {
    fn from(p: Point) -> Self {
        TransposePoint { x: p.y, y: p.x }
    }
}

fn main() {
    let p = Point { x: 10, y: 20 };
    let tp = TransposePoint::from(p);
    println!("Transposed: x={}, y={}", tp.x, tp.y);  // x=20, y=10

    // Using .into() — works automatically when From is implemented
    let p2 = Point { x: 3, y: 7 };
    let tp2: TransposePoint = p2.into();
    println!("Transposed: x={}, y={}", tp2.x, tp2.y);  // x=7, y=3
}
// Output:
// Transposed: x=20, y=10
// Transposed: x=7, y=3
```

</details>

# Rust Default trait<br><span class="zh-inline">Rust 的 Default trait</span>

- ```Default``` can be used to implement default values for a type<br><span class="zh-inline">```Default``` 可以为类型提供默认值。</span>
    - Types can use the ```Derive``` macro with ```Default``` or provide a custom implementation<br><span class="zh-inline">类型既可以直接派生 ```Default```，也可以手写自定义实现。</span>

```rust
#[derive(Default, Debug)]
struct Point {x: u32, y: u32}
#[derive(Debug)]
struct CustomPoint {x: u32, y: u32}
impl Default for CustomPoint {
    fn default() -> Self {
        CustomPoint {x: 42, y: 42}
    }
}
fn main() {
    let x = Point::default();   // Creates a Point{0, 0}
    println!("{x:?}");
    let y = CustomPoint::default();
    println!("{y:?}");
}
```

### Rust Default trait<br><span class="zh-inline">Default trait 的常见用法</span>

- ```Default``` trait has several use cases including<br><span class="zh-inline">```Default``` trait 的常见用途包括：</span>
    - Performing a partial copy and using default initialization for rest<br><span class="zh-inline">只覆盖部分字段，其余字段走默认初始化。</span>
    - Default alternative for ```Option``` types in methods like ```unwrap_or_default()```<br><span class="zh-inline">给 ```Option``` 一类类型提供默认回退值，例如 ```unwrap_or_default()```。</span>

```rust
#[derive(Debug)]
struct CustomPoint {x: u32, y: u32}
impl Default for CustomPoint {
    fn default() -> Self {
        CustomPoint {x: 42, y: 42}
    }
}
fn main() {
    let x = CustomPoint::default();
    // Override y, but leave rest of elements as the default
    let y = CustomPoint {y: 43, ..CustomPoint::default()};
    println!("{x:?} {y:?}");
    let z : Option<CustomPoint> = None;
    // Try changing the unwrap_or_default() to unwrap()
    println!("{:?}", z.unwrap_or_default());
}
```

### Other Rust type conversions<br><span class="zh-inline">Rust 的其他类型转换方式</span>

- Rust doesn't support implicit type conversions and ```as``` can be used for ```explicit``` conversions<br><span class="zh-inline">Rust 不支持隐式类型转换，需要显式转换时可以使用 ```as```。</span>
- ```as``` should be sparingly used because it's subject to loss of data by narrowing and so forth. In general, it's preferable to use ```into()``` or ```from()``` where possible<br><span class="zh-inline">```as``` 要少用，因为它可能触发窄化转换，从而丢失数据。一般来说，能用 ```into()``` 或 ```from()``` 就尽量用它们。</span>

```rust
fn main() {
    let f = 42u8;
    // let g : u32 = f;    // Will not compile
    let g = f as u32;      // Ok, but not preferred. Subject to rules around narrowing
let g : u32 = f.into(); // Most preferred form; infallible and checked by the compiler
    //let k : u8 = f.into();  // Fails to compile; narrowing can result in loss of data
    
    // Attempting a narrowing operation requires use of try_into
    if let Ok(k) = TryInto::<u8>::try_into(g) {
        println!("{k}");
    }
}
```
