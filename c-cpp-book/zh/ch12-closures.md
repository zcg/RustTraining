## Rust closures<br><span class="zh-inline">Rust 的闭包</span>

> **What you'll learn:** Closures as anonymous functions, the three capture traits `Fn`、`FnMut`、`FnOnce`, `move` closures, and how Rust closures compare with C++ lambdas. The biggest difference is that Rust infers capture behavior automatically instead of making you manually juggle `[&]`、`[=]` and friends.<br><span class="zh-inline">**本章将学到什么：** 闭包作为匿名函数的基本用法，三种捕获 trait `Fn`、`FnMut`、`FnOnce`，`move` 闭包，以及 Rust 闭包和 C++ lambda 的对照。最关键的差别在于：Rust 会自动推导捕获方式，而不是让人手动去摆弄 `[&]`、`[=]` 这些符号。</span>

- Closures are anonymous functions that can capture values from the surrounding scope.<br><span class="zh-inline">闭包本质上就是能从外围作用域捕获值的匿名函数。</span>
    - The closest C++ equivalent is a lambda such as `[&](int x) { return x + 1; }`.<br><span class="zh-inline">在 C++ 里，最接近的东西就是 lambda，例如 `[&](int x) { return x + 1; }`。</span>
    - Rust has **three** closure traits, and the compiler picks the right one automatically.<br><span class="zh-inline">Rust 给闭包准备了 **三种** trait，具体用哪一种由编译器自动判断。</span>
    - C++ capture modes like `[=]`、`[&]`、`[this]` are manual and easy to misuse.<br><span class="zh-inline">C++ 的 `[=]`、`[&]`、`[this]` 这套捕获模式全靠手写，稍不留神就会写出危险代码。</span>
    - Rust's borrow checker prevents dangling captures at compile time.<br><span class="zh-inline">Rust 的借用检查器会在编译期阻止悬空捕获。</span>
- Closures are introduced with `||`, and parameter types can usually be inferred.<br><span class="zh-inline">闭包用 `||` 这对竖线引出来，参数类型大多数时候都能自动推导。</span>
- Closures are frequently paired with iterators, which is why they show up everywhere in idiomatic Rust code.<br><span class="zh-inline">闭包和迭代器经常成套出现，所以在惯用 Rust 代码里会高频见到它们。</span>

```rust
fn add_one(x: u32) -> u32 {
    x + 1
}
fn main() {
    let add_one_v1 = |x : u32| {x + 1}; // Explicitly specified type
    let add_one_v2 = |x| {x + 1};   // Type is inferred from call site
    let add_one_v3 = |x| x+1;   // Permitted for single line functions
    println!("{} {} {} {}", add_one(42), add_one_v1(42), add_one_v2(42), add_one_v3(42) );
}
```

这种语法最开始会让很多 C++ 程序员皱眉头，但熟悉之后会发现它其实更统一。参数放在 `||` 里，后面接表达式或代码块，没有额外的捕获列表样板。<br><span class="zh-inline">The syntax may look odd at first, especially to C++ eyes, but it is actually very uniform: parameters go between pipes, then you write either an expression or a block. There is no extra capture-list ceremony to maintain.</span>

#
## Exercise: Closures and capturing<br><span class="zh-inline">练习：闭包与捕获</span>

🟡 **Intermediate**<br><span class="zh-inline">🟡 **进阶练习**</span>

- Create a closure that captures a `String` from the enclosing scope and appends to it.<br><span class="zh-inline">创建一个闭包，从外层作用域捕获一个 `String`，并往里面追加内容。</span>
- Create a vector of closures `Vec<Box<dyn Fn(i32) -> i32>>` that add 1、multiply by 2、and square the input. Then iterate over the vector and apply each closure to `5`.<br><span class="zh-inline">再创建一个闭包向量 `Vec<Box<dyn Fn(i32) -> i32>>`，里面分别放“加 1”“乘 2”“平方”三种闭包。随后遍历这个向量，把每个闭包都作用到数字 `5` 上。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
fn main() {
    // Part 1: Closure that captures and appends to a String
    let mut greeting = String::from("Hello");
    let mut append = |suffix: &str| {
        greeting.push_str(suffix);
    };
    append(", world");
    append("!");
    println!("{greeting}");  // "Hello, world!"

    // Part 2: Vector of closures
    let operations: Vec<Box<dyn Fn(i32) -> i32>> = vec![
        Box::new(|x| x + 1),      // add 1
        Box::new(|x| x * 2),      // multiply by 2
        Box::new(|x| x * x),      // square
    ];

    let input = 5;
    for (i, op) in operations.iter().enumerate() {
        println!("Operation {i} on {input}: {}", op(input));
    }
}
// Output:
// Hello, world!
// Operation 0 on 5: 6
// Operation 1 on 5: 10
// Operation 2 on 5: 25
```

</details>

# Rust iterators<br><span class="zh-inline">Rust 的迭代器</span>

- Iterators are one of Rust's most powerful features. They provide elegant ways to filter, transform, search, and combine collection processing steps.<br><span class="zh-inline">迭代器是 Rust 最有力量的一批特性之一。无论是过滤、变换、查找还是组合处理集合，它们都能把代码写得非常顺。</span>
- In the example below, `|&x| *x >= 42` is a closure used by `filter()`, and `|x| println!("{x}")` is another closure used by `for_each()`.<br><span class="zh-inline">下面例子里的 `|&x| *x >= 42` 是交给 `filter()` 的闭包，而 `|x| println!("{x}")` 则是交给 `for_each()` 的闭包。</span>

```rust
fn main() {
    let a = [0, 1, 2, 3, 42, 43];
    for x in &a {
        if *x >= 42 {
            println!("{x}");
        }
    }
    // Same as above
    a.iter().filter(|&x| *x >= 42).for_each(|x| println!("{x}"))
}
```

# Rust iterators are lazy<br><span class="zh-inline">Rust 迭代器是惰性的</span>

- A key property of iterators is laziness: most iterator chains do nothing until a consuming operation actually evaluates them.<br><span class="zh-inline">迭代器最关键的性质之一就是惰性。大多数链式操作在真正被消费之前，其实什么都不会做。</span>
- For example, `a.iter().filter(|&x| *x >= 42);` by itself produces no output and performs no side-effect. The compiler even warns when it notices a lazy iterator chain that gets thrown away unused.<br><span class="zh-inline">例如 `a.iter().filter(|&x| *x >= 42);` 单独写在那里时，既不会输出，也不会产生副作用。编译器甚至会在发现这种“惰性链建好了却没用”的情况时主动警告。</span>

```rust
fn main() {
    let a = [0, 1, 2, 3, 42, 43];
    // Add one to each element and print it
    let _ = a.iter().map(|x|x + 1).for_each(|x|println!("{x}"));
    let found = a.iter().find(|&x|*x == 42);
    println!("{found:?}");
    // Count elements
    let count = a.iter().count();
    println!("{count}");
}
```

# `collect()` gathers results into a collection<br><span class="zh-inline">`collect()` 用来把结果收集进集合</span>

- `collect()` materializes the results of an iterator chain into a concrete collection such as `Vec<T>`.<br><span class="zh-inline">`collect()` 会把迭代器链最终“物化”成一个具体集合，比如 `Vec<T>`。</span>
    - The `_` in `Vec<_>` means “infer the element type from the iterator output”.<br><span class="zh-inline">`Vec<_>` 里的 `_` 表示“元素类型交给编译器从迭代器输出里推导”。</span>
    - The mapped type can be anything, including `String`.<br><span class="zh-inline">`map()` 后产出的新类型可以是任何东西，包括 `String`。</span>

```rust
fn main() {
    let a = [0, 1, 2, 3, 42, 43];
    let squared_a : Vec<_> = a.iter().map(|x|x*x).collect();
    for x in &squared_a {
        println!("{x}");
    }
    let squared_a_strings : Vec<_> = a.iter().map(|x|(x*x).to_string()).collect();
    // These are actually string representations
    for x in &squared_a_strings {
        println!("{x}");
    }
}
```

# Exercise: Rust iterators<br><span class="zh-inline">练习：Rust 迭代器</span>

🟢 **Starter**<br><span class="zh-inline">🟢 **基础练习**</span>

- Create an integer array containing both odd and even numbers. Iterate over it and split the values into two vectors.<br><span class="zh-inline">创建一个同时包含奇数和偶数的整数数组，把它拆分成两个向量，一个存偶数，一个存奇数。</span>
- Can this be done in a single pass? Hint: try `partition()`.<br><span class="zh-inline">能不能一趟完成？提示：试试 `partition()`。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
fn main() {
    let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Approach 1: Manual iteration
    let mut evens = Vec::new();
    let mut odds = Vec::new();
    for n in numbers {
        if n % 2 == 0 {
            evens.push(n);
        } else {
            odds.push(n);
        }
    }
    println!("Evens: {evens:?}");
    println!("Odds:  {odds:?}");

    // Approach 2: Single pass with partition()
    let (evens, odds): (Vec<i32>, Vec<i32>) = numbers
        .into_iter()
        .partition(|n| n % 2 == 0);
    println!("Evens (partition): {evens:?}");
    println!("Odds  (partition): {odds:?}");
}
// Output:
// Evens: [2, 4, 6, 8, 10]
// Odds:  [1, 3, 5, 7, 9]
// Evens (partition): [2, 4, 6, 8, 10]
// Odds  (partition): [1, 3, 5, 7, 9]
```

</details>

> **Production patterns**: See [Collapsing assignment pyramids with closures](ch17-3-collapsing-assignment-pyramids.md#collapsing-assignment-pyramids-with-closures) for real iterator chains like `.map().collect()`、`.filter().collect()` and `.find_map()` from production Rust code.<br><span class="zh-inline">**生产代码里的延伸模式：** 可以再看 [用闭包压平层层赋值金字塔](ch17-3-collapsing-assignment-pyramids.md#collapsing-assignment-pyramids-with-closures)，里面有真实项目中的 `.map().collect()`、`.filter().collect()`、`.find_map()` 例子。</span>

### Iterator power tools: the methods that replace C++ loops<br><span class="zh-inline">迭代器进阶工具：替换 C++ 循环的那些常用方法</span>

The adapters below show up everywhere in production Rust. C++ has `<algorithm>` and C++20 ranges, but Rust iterator chains are often simpler to compose and far more common in everyday code.<br><span class="zh-inline">下面这些适配器在生产级 Rust 里出现频率极高。C++ 当然也有 `<algorithm>` 和 C++20 ranges，但 Rust 的迭代器链组合起来通常更顺，而且日常使用频率也更高。</span>

#### `enumerate` — index plus value<br><span class="zh-inline">`enumerate`：索引和值一起拿</span>

```rust
let sensors = vec!["temp0", "temp1", "temp2"];
for (idx, name) in sensors.iter().enumerate() {
    println!("Sensor {idx}: {name}");
}
// Sensor 0: temp0
// Sensor 1: temp1
// Sensor 2: temp2
```

C++ equivalent: `for (size_t i = 0; i < sensors.size(); ++i) { auto& name = sensors[i]; ... }`<br><span class="zh-inline">对应的 C++ 写法通常是手动维护一个 `size_t i`。</span>

#### `zip` — pair elements from two iterators<br><span class="zh-inline">`zip`：把两个迭代器按位配对</span>

```rust
let names = ["gpu0", "gpu1", "gpu2"];
let temps = [72.5, 68.0, 75.3];

let report: Vec<String> = names.iter()
    .zip(temps.iter())
    .map(|(name, temp)| format!("{name}: {temp}°C"))
    .collect();
println!("{report:?}");
// ["gpu0: 72.5°C", "gpu1: 68.0°C", "gpu2: 75.3°C"]
```

`zip()` 会在较短那一边结束，所以天然就避开了“两个数组长度不一致导致越界”的一类问题。<br><span class="zh-inline">`zip()` stops at the shorter iterator, which means a whole family of out-of-bounds bugs simply disappears.</span>

#### `flat_map` — map then flatten nested collections<br><span class="zh-inline">`flat_map`：映射后拍平嵌套集合</span>

```rust
let gpu_bdfs = vec![
    vec!["0000:01:00.0", "0000:02:00.0"],
    vec!["0000:41:00.0"],
    vec!["0000:81:00.0", "0000:82:00.0"],
];

let all_bdfs: Vec<&str> = gpu_bdfs.iter()
    .flat_map(|bdfs| bdfs.iter().copied())
    .collect();
println!("{all_bdfs:?}");
// ["0000:01:00.0", "0000:02:00.0", "0000:41:00.0", "0000:81:00.0", "0000:82:00.0"]
```

#### `chain` — concatenate iterators<br><span class="zh-inline">`chain`：把迭代器首尾接起来</span>

```rust
let critical_gpus = vec!["gpu0", "gpu3"];
let warning_gpus = vec!["gpu1", "gpu5"];

for gpu in critical_gpus.iter().chain(warning_gpus.iter()) {
    println!("Flagged: {gpu}");
}
```

#### `windows` and `chunks` — sliding and fixed-size views<br><span class="zh-inline">`windows` 与 `chunks`：滑动窗口与固定分块</span>

```rust
let temps = [70, 72, 75, 73, 71, 68, 65];

let rising = temps.windows(3)
    .any(|w| w[0] < w[1] && w[1] < w[2]);
println!("Rising trend detected: {rising}"); // true

for pair in temps.chunks(2) {
    println!("Pair: {pair:?}");
}
// Pair: [70, 72]
// Pair: [75, 73]
// Pair: [71, 68]
// Pair: [65]
```

#### `fold` — accumulate to a single result<br><span class="zh-inline">`fold`：归约成单个结果</span>

```rust
let errors = vec![
    ("gpu0", 3u32),
    ("gpu1", 0),
    ("gpu2", 7),
    ("gpu3", 1),
];

let (total, summary) = errors.iter().fold(
    (0u32, String::new()),
    |(count, mut s), (name, errs)| {
        if *errs > 0 {
            s.push_str(&format!("{name}:{errs} "));
        }
        (count + errs, s)
    },
);
println!("Total errors: {total}, details: {summary}");
```

#### `scan` — stateful transform<br><span class="zh-inline">`scan`：带状态的逐步变换</span>

```rust
let readings = [100, 105, 103, 110, 108];

let deltas: Vec<i32> = readings.iter()
    .scan(None::<i32>, |prev, &val| {
        let delta = prev.map(|p| val - p);
        *prev = Some(val);
        Some(delta)
    })
    .flatten()
    .collect();
println!("Deltas: {deltas:?}"); // [5, -2, 7, -2]
```

#### Quick reference: C++ loop → Rust iterator<br><span class="zh-inline">速查：C++ 循环 → Rust 迭代器</span>

| **C++ Pattern** | **Rust Iterator** | **Example**<br><span class="zh-inline">示例</span> |
|----------------|------------------|------------|
| `for (int i = 0; i < v.size(); i++)` | `.enumerate()` | `v.iter().enumerate()` |
| Parallel iteration with index | `.zip()` | `a.iter().zip(b.iter())` |
| Nested loop → flat result | `.flat_map()` | `vecs.iter().flat_map(\|v\| v.iter())` |
| Concatenate two containers | `.chain()` | `a.iter().chain(b.iter())` |
| Sliding window `v[i..i+n]` | `.windows(n)` | `v.windows(3)` |
| Process in fixed-size groups | `.chunks(n)` | `v.chunks(4)` |
| Manual accumulator | `.fold()` | `.fold(init, \|acc, x\| ...)` |
| Running total / delta tracking | `.scan()` | `.scan(state, \|s, x\| ...)` |
| Take first `n` elements | `.take(n)` | `.iter().take(5)` |
| Skip while predicate holds | `.skip_while()` | `.skip_while(\|x\| x < &threshold)` |
| `std::any_of` | `.any()` | `.iter().any(\|x\| x > &limit)` |
| `std::all_of` | `.all()` | `.iter().all(\|x\| x.is_valid())` |
| `std::count_if` | `.filter().count()` | `.filter(\|x\| x > &0).count()` |
| `std::min_element` / `std::max_element` | `.min()` / `.max()` | `.iter().max()` |

### Exercise: Iterator chains<br><span class="zh-inline">练习：迭代器链</span>

Given sensor data as `Vec<(String, f64)>`, write a single iterator chain that:<br><span class="zh-inline">给定 `Vec<(String, f64)>` 形式的传感器数据，请写一条迭代器链，完成下面这些事情：</span>

1. Filters sensors with temperature above `80.0`<br><span class="zh-inline">1. 筛掉温度不超过 `80.0` 的传感器。</span>
2. Sorts them by temperature descending<br><span class="zh-inline">2. 按温度从高到低排序。</span>
3. Formats each item as `"{name}: {temp}°C [ALARM]"`<br><span class="zh-inline">3. 把每条数据格式化成 `"{name}: {temp}°C [ALARM]"`。</span>
4. Collects the result into `Vec<String>`<br><span class="zh-inline">4. 最后收集成 `Vec<String>`。</span>

Hint: you will need to `collect()` before sorting, because sorting works on a real `Vec`, not on a lazy iterator.<br><span class="zh-inline">提示：排序之前需要先 `collect()`，因为排序操作作用在真实 `Vec` 上，而不是惰性迭代器上。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
fn alarm_report(sensors: &[(String, f64)]) -> Vec<String> {
    let mut hot: Vec<_> = sensors.iter()
        .filter(|(_, temp)| *temp > 80.0)
        .collect();
    hot.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    hot.iter()
        .map(|(name, temp)| format!("{name}: {temp}°C [ALARM]"))
        .collect()
}

fn main() {
    let sensors = vec![
        ("gpu0".to_string(), 72.5),
        ("gpu1".to_string(), 85.3),
        ("gpu2".to_string(), 91.0),
        ("gpu3".to_string(), 78.0),
        ("gpu4".to_string(), 88.7),
    ];
    for line in alarm_report(&sensors) {
        println!("{line}");
    }
}
// Output:
// gpu2: 91°C [ALARM]
// gpu4: 88.7°C [ALARM]
// gpu1: 85.3°C [ALARM]
```

</details>

----

# Implementing iterators for your own types<br><span class="zh-inline">为自定义类型实现迭代器</span>

- The `Iterator` trait is used when implementing iteration over your own types.<br><span class="zh-inline">如果想让自定义类型也能按 Rust 的迭代方式工作，就要实现 `Iterator` trait。</span>
    - A classic example is implementing Fibonacci sequence generation, where each next value depends on internal state.<br><span class="zh-inline">最经典的例子之一就是斐波那契数列，因为每个新值都依赖结构体内部维护的状态。</span>
    - The associated type `type Item = u32;` declares what each `next()` call yields.<br><span class="zh-inline">关联类型 `type Item = u32;` 用来声明每次 `next()` 会产出什么类型。</span>
    - The `next()` method contains the iteration logic itself.<br><span class="zh-inline">真正的迭代逻辑则写在 `next()` 方法里。</span>
    - For more ergonomic `for`-loop support, you often also implement `IntoIterator`.<br><span class="zh-inline">如果还想让类型在 `for` 循环里更顺手，通常还会顺带实现 `IntoIterator`。</span>
    - [▶ Try it in the Rust Playground](https://play.rust-lang.org/)<br><span class="zh-inline">[▶ 可以在 Rust Playground 里自己试](https://play.rust-lang.org/)</span>

这一章真正要带走的，不是把所有迭代器方法背成表，而是先把一个思路立起来：很多 C 风格循环，本质上只是在描述“数据怎么流过一连串变换”。<br><span class="zh-inline">真正重要的不是死记 API，而是先把脑子里的模型换掉：很多看起来必须手写循环的逻辑，其实只是数据在一条管道里被筛选、变换、组合而已。</span>
