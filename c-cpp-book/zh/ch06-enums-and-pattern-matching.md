# Rust enum types<br><span class="zh-inline">Rust 的 `enum` 类型</span>

> **What you'll learn:** Rust enums as discriminated unions (tagged unions done right), `match` for exhaustive pattern matching, and how enums replace C++ class hierarchies and C tagged unions with compiler-enforced safety.<br><span class="zh-inline">**本章将学到什么：** Rust `enum` 如何作为真正靠谱的判别联合使用，`match` 怎样实现穷尽式模式匹配，以及 `enum` 如何在编译器保证下替代 C++ 类层级和 C 风格 tagged union。</span>

- Enum types are discriminated unions, i.e., they are a sum type of several possible different types with a tag that identifies the specific variant<br><span class="zh-inline">`enum` 本质上是判别联合，也就是带标签的和类型。它可以表示多种可能形态，并通过标签标识当前到底是哪一种变体。</span>
    - For C developers: enums in Rust can carry data (tagged unions done right — the compiler tracks which variant is active)<br><span class="zh-inline">对 C 开发者来说：Rust 的 `enum` 可以携带数据，这才是“做对了的 tagged union”，因为编译器会跟踪当前激活的是哪个分支。</span>
    - For C++ developers: Rust enums are like `std::variant` but with exhaustive pattern matching, no `std::get` exceptions, and no `std::visit` boilerplate<br><span class="zh-inline">对 C++ 开发者来说：Rust `enum` 有点像 `std::variant`，但它自带穷尽匹配，没有 `std::get` 异常，也不需要一堆 `std::visit` 样板代码。</span>
    - The size of the `enum` is that of the largest possible type. The individual variants are not related to one another and can have completely different types<br><span class="zh-inline">`enum` 的整体大小由最大变体决定。各个变体之间不需要有继承关系，也可以带完全不同类型的数据。</span>
    - `enum` types are one of the most powerful features of the language — they replace entire class hierarchies in C++ (more on this in the Case Studies)<br><span class="zh-inline">`enum` 是 Rust 最有力量的特性之一，很多在 C++ 里要靠整棵类层级才能表达的东西，在 Rust 里一个 `enum` 就能拿下。</span>

```rust
fn main() {
    enum Numbers {
        Zero,
        SmallNumber(u8),
        BiggerNumber(u32),
        EvenBiggerNumber(u64),
    }
    let a = Numbers::Zero;
    let b = Numbers::SmallNumber(42);
    let c : Numbers = a; // Ok -- the type of a is Numbers
    let d : Numbers = b; // Ok -- the type of b is Numbers
}
```

这里最容易让 C/C++ 开发者眼前一亮的一点，就是 `enum` 的每个变体都能带不同数据，而且类型系统会一路帮忙兜着。<br><span class="zh-inline">再也不是手工维护一套 tag 字段，再配一个 union，然后祈祷每个分支都别拿错数据了。</span>

----

# Rust `match` statement<br><span class="zh-inline">Rust 的 `match` 语句</span>

- The Rust `match` is the equivalent of the C "switch" on steroids<br><span class="zh-inline">Rust 的 `match` 可以看作强化到离谱版本的 C `switch`。</span>
    - `match` can be used for pattern matching on simple data types, `struct`, `enum`<br><span class="zh-inline">`match` 不光能匹配简单值，还能匹配 `struct`、`enum` 等结构化数据。</span>
    - The `match` statement must be exhaustive, i.e., they must cover all possible cases for a given `type`. The `_` can be used a wildcard for the "all else" case<br><span class="zh-inline">`match` 必须穷尽所有可能情况。兜底分支通常用 `_` 表示“其余所有情况”。</span>
    - `match` can yield a value, but all arms (`=>`) must return a value of the same type<br><span class="zh-inline">`match` 本身可以产出值，但每个分支返回的类型必须一致。</span>

```rust
fn main() {
    let x = 42;
    // In this case, the _ covers all numbers except the ones explicitly listed
    let is_secret_of_life = match x {
        42 => true, // return type is boolean value
        _ => false, // return type boolean value
        // This won't compile because return type isn't boolean
        // _ => 0  
    };
    println!("{is_secret_of_life}");
}
```

`match` 最可贵的地方，不只是语法漂亮，而是它把“有没有漏分支”“分支返回值是否一致”这些本来容易出错的活都交给了编译器。<br><span class="zh-inline">和 C/C++ 里那种靠 `switch` 加 `default`，再小心翼翼提防漏 `break` 的日子比，体验差得可不是一星半点。</span>

# `match` supports ranges and guards<br><span class="zh-inline">`match` 还支持范围和守卫条件</span>

- `match` supports ranges, boolean filters, and `if` guard statements<br><span class="zh-inline">`match` 不光能精确匹配，还支持范围匹配、条件守卫和更复杂的模式。</span>

```rust
fn main() {
    let x = 42;
    match x {
        // Note that the =41 ensures the inclusive range
        0..=41 => println!("Less than the secret of life"),
        42 => println!("Secret of life"),
        _ => println!("More than the secret of life"),
    }
    let y = 100;
    match y {
        100 if x == 43 => println!("y is 100% not secret of life"),
        100 if x == 42 => println!("y is 100% secret of life"),
        _ => (),    // Do nothing
    }
}
```

这种范围和 guard 的能力，会让很多原本需要层层 `if` 嵌套的逻辑一下整洁很多。<br><span class="zh-inline">尤其在协议解析、状态分发、错误分类这种分支很多的地方，`match` 的表现通常相当亮眼。</span>

# Combining `match` with `enum`<br><span class="zh-inline">把 `match` 和 `enum` 组合起来用</span>

- `match` and `enum` are often combined together<br><span class="zh-inline">`match` 和 `enum` 经常是成套出现的。</span>
    - The match statement can "bind" the contained value to a variable. Use `_` if the value is a don't care<br><span class="zh-inline">`match` 可以把变体里带的数据直接绑定到变量上。如果值无所谓，就用 `_` 忽略。</span>
    - The `matches!` macro can be used to match to specific variant<br><span class="zh-inline">`matches!` 宏可以用来快速判断某个值是否匹配指定模式。</span>

```rust
fn main() {
    enum Numbers {
        Zero,
        SmallNumber(u8),
        BiggerNumber(u32),
        EvenBiggerNumber(u64),
    }
    let b = Numbers::SmallNumber(42);
    match b {
        Numbers::Zero => println!("Zero"),
        Numbers::SmallNumber(value) => println!("Small number {value}"),
        Numbers::BiggerNumber(_) | Numbers::EvenBiggerNumber(_) => println!("Some BiggerNumber or EvenBiggerNumber"),
    }
    
    // Boolean test for specific variants
    if matches!(b, Numbers::Zero | Numbers::SmallNumber(_)) {
        println!("Matched Zero or small number");
    }
}
```

这正是 Rust `enum` 真正发力的地方。不是单独有个“高级枚举”，也不是单独有个“高级 switch”，而是两者组合之后，数据建模和控制流分发直接咬在一起。<br><span class="zh-inline">很多在 C++ 里需要继承加虚函数加 downcast 才能兜住的结构，在 Rust 里到这一步就已经非常顺了。</span>

# Destructuring with `match`<br><span class="zh-inline">用 `match` 做解构匹配</span>

- `match` can also perform matches using destructuring and slices<br><span class="zh-inline">`match` 还支持对结构体、元组、数组、切片做解构匹配。</span>

```rust
fn main() {
    struct Foo {
        x: (u32, bool),
        y: u32
    }
    let f = Foo {x: (42, true), y: 100};
    match f {
        // Capture the value of x into a variable called tuple
        Foo{y: 100, x : tuple} => println!("Matched x: {tuple:?}"),
        _ => ()
    }
    let a = [40, 41, 42];
    match a {
        // Last element of slice must be 42. @ is used to bind the match
        [rest @ .., 42] => println!("{rest:?}"),
        // First element of the slice must be 42. @ is used to bind the match
        [42, rest @ ..] => println!("{rest:?}"),
        _ => (),
    }
}
```

这类解构能力特别适合写解析器、协议包判断和结构化数据处理。以前在 C/C++ 里要手动拆字段、手动判断条件的东西，在 Rust 里 often 可以直接在模式里说清楚。<br><span class="zh-inline">代码读起来就像“描述要匹配的数据形状”，不是一堆零散判断拼起来的过程式流水账。</span>

# Exercise: Implement add and subtract using `match` and `enum`<br><span class="zh-inline">练习：用 `match` 和 `enum` 实现加减法</span>

🟢 **Starter**<br><span class="zh-inline">🟢 **基础练习**</span>

- Write a function that implements arithmetic operations on unsigned 64-bit numbers<br><span class="zh-inline">写一个函数，对无符号 64 位整数执行算术操作。</span>
- **Step 1**: Define an enum for operations:<br><span class="zh-inline">**步骤 1**：先定义操作枚举：</span>

```rust
enum Operation {
    Add(u64, u64),
    Subtract(u64, u64),
}
```

- **Step 2**: Define a result enum:<br><span class="zh-inline">**步骤 2**：再定义结果枚举：</span>

```rust
enum CalcResult {
    Ok(u64),                    // Successful result
    Invalid(String),            // Error message for invalid operations
}
```

- **Step 3**: Implement `calculate(op: Operation) -> CalcResult`<br><span class="zh-inline">**步骤 3**：实现 `calculate(op: Operation) -> CalcResult`。</span>
    - For Add: return Ok(sum)<br><span class="zh-inline">加法返回 `Ok(sum)`。</span>
    - For Subtract: return Ok(difference) if first >= second, otherwise Invalid("Underflow")<br><span class="zh-inline">减法在第一个值大于等于第二个值时返回结果，否则返回 `Invalid("Underflow")`。</span>
- **Hint**: Use pattern matching in your function:<br><span class="zh-inline">**提示**：在函数里用模式匹配：</span>

```rust
match op {
    Operation::Add(a, b) => { /* your code */ },
    Operation::Subtract(a, b) => { /* your code */ },
}
```

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
enum Operation {
    Add(u64, u64),
    Subtract(u64, u64),
}

enum CalcResult {
    Ok(u64),
    Invalid(String),
}

fn calculate(op: Operation) -> CalcResult {
    match op {
        Operation::Add(a, b) => CalcResult::Ok(a + b),
        Operation::Subtract(a, b) => {
            if a >= b {
                CalcResult::Ok(a - b)
            } else {
                CalcResult::Invalid("Underflow".to_string())
            }
        }
    }
}

fn main() {
    match calculate(Operation::Add(10, 20)) {
        CalcResult::Ok(result) => println!("10 + 20 = {result}"),
        CalcResult::Invalid(msg) => println!("Error: {msg}"),
    }
    match calculate(Operation::Subtract(5, 10)) {
        CalcResult::Ok(result) => println!("5 - 10 = {result}"),
        CalcResult::Invalid(msg) => println!("Error: {msg}"),
    }
}
// Output:
// 10 + 20 = 30
// Error: Underflow
```

</details>

# Rust associated methods<br><span class="zh-inline">Rust 的关联方法</span>

- `impl` can define methods associated for types like `struct`, `enum`, etc<br><span class="zh-inline">`impl` 可以为 `struct`、`enum` 等类型定义关联方法。</span>
    - The methods may optionally take `self` as a parameter. `self` is conceptually similar to passing a pointer to the struct as the first parameter in C, or `this` in C++<br><span class="zh-inline">方法可以选择接收 `self`。从概念上说，它有点像 C 里把结构体指针作为第一个参数传进去，或者像 C++ 里的 `this`。</span>
    - The reference to `self` can be immutable (default: `&self`), mutable (`&mut self`), or `self` (transferring ownership)<br><span class="zh-inline">`self` 可以是不可变借用 `&self`、可变借用 `&mut self`，也可以直接拿走所有权，也就是 `self`。</span>
    - The `Self` keyword can be used a shortcut to imply the type<br><span class="zh-inline">`Self` 关键字可以作为当前类型的简写。</span>

```rust
struct Point {x: u32, y: u32}
impl Point {
    fn new(x: u32, y: u32) -> Self {
        Point {x, y}
    }
    fn increment_x(&mut self) {
        self.x += 1;
    }
}
fn main() {
    let mut p = Point::new(10, 20);
    p.increment_x();
}
```

这部分和前面的 `enum` 主题放在一起，其实是在提醒一点：Rust 的类型系统不是只给“数据长什么样”建模，也给“这个类型能做什么操作”建模。<br><span class="zh-inline">`impl` 让数据和行为自然绑定，但又没有传统面向对象里那种重继承包袱，整体会更轻一些。</span>

# Exercise: Point add and transform<br><span class="zh-inline">练习：`Point` 的加法与变换</span>

🟡 **Intermediate** — requires understanding move vs borrow from method signatures<br><span class="zh-inline">🟡 **进阶**：需要理解方法签名里的 move 与 borrow 区别。</span>

- Implement the following associated methods for `Point`<br><span class="zh-inline">为 `Point` 实现下面这些关联方法：</span>
    - `add()` will take another `Point` and will increment the x and y values in place (hint: use `&mut self`)<br><span class="zh-inline">`add()` 接收另一个 `Point`，并原地累加 x、y 值，提示：用 `&mut self`。</span>
    - `transform()` will consume an existing `Point` (hint: use `self`) and return a new `Point` by squaring the x and y<br><span class="zh-inline">`transform()` 会消费当前 `Point`，返回一个新的 `Point`，其中 x、y 都变成平方值，提示：用 `self`。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
struct Point { x: u32, y: u32 }

impl Point {
    fn new(x: u32, y: u32) -> Self {
        Point { x, y }
    }
    fn add(&mut self, other: &Point) {
        self.x += other.x;
        self.y += other.y;
    }
    fn transform(self) -> Point {
        Point { x: self.x * self.x, y: self.y * self.y }
    }
}

fn main() {
    let mut p1 = Point::new(2, 3);
    let p2 = Point::new(10, 20);
    p1.add(&p2);
    println!("After add: x={}, y={}", p1.x, p1.y);           // x=12, y=23
    let p3 = p1.transform();
    println!("After transform: x={}, y={}", p3.x, p3.y);     // x=144, y=529
    // p1 is no longer accessible — transform() consumed it
}
```

</details>

----
