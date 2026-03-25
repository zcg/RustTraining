## Iterator Power Tools Reference<br><span class="zh-inline">迭代器进阶工具速查</span>

> **What you'll learn:** Advanced iterator combinators beyond `filter`/`map`/`collect` — `enumerate`, `zip`, `chain`, `flat_map`, `scan`, `windows`, and `chunks`. Essential for replacing C-style indexed `for` loops with safe, expressive Rust iterators.<br><span class="zh-inline">**本章将学到什么：** 除了 `filter` / `map` / `collect` 之外，Rust 迭代器里更进阶的一批组合器，例如 `enumerate`、`zip`、`chain`、`flat_map`、`scan`、`windows`、`chunks`。这些工具对把 C 风格下标循环迁移成更安全、更清晰的 Rust 写法非常关键。</span>

The basic `filter`/`map`/`collect` chain covers many cases, but Rust's iterator library is far richer. This section covers the tools you'll reach for daily — especially when translating C loops that manually track indices, accumulate results, or process data in fixed-size chunks.<br><span class="zh-inline">`filter` / `map` / `collect` 这套三连已经能覆盖很多场景，但 Rust 的迭代器库远远不止这些。这一节要讲的是那批真正高频、能天天用到的工具，尤其适合替换那些手动记索引、手动累加、手动按固定块处理数据的 C 式循环。</span>

### Quick Reference Table<br><span class="zh-inline">快速对照表</span>

| Method<br><span class="zh-inline">方法</span> | C Equivalent<br><span class="zh-inline">C 里的近似写法</span> | What it does<br><span class="zh-inline">作用</span> | Returns<br><span class="zh-inline">返回类型</span> |
|--------|-------------|-------------|---------|
| `enumerate()` | `for (int i=0; ...)` | Pairs each element with its index<br><span class="zh-inline">给每个元素配上索引</span> | `(usize, T)` |
| `zip(other)` | Parallel arrays with same index<br><span class="zh-inline">同索引并行遍历多个数组</span> | Pairs elements from two iterators<br><span class="zh-inline">把两个迭代器按位配对</span> | `(A, B)` |
| `chain(other)` | Process array1 then array2<br><span class="zh-inline">先处理数组 1 再处理数组 2</span> | Concatenates two iterators<br><span class="zh-inline">串接两个迭代器</span> | `T` |
| `flat_map(f)` | Nested loops<br><span class="zh-inline">嵌套循环</span> | Maps then flattens one level<br><span class="zh-inline">映射后再拍平一层</span> | `U` |
| `windows(n)` | `for (int i=0; i<len-n+1; i++) &arr[i..i+n]` | Overlapping slices of size `n`<br><span class="zh-inline">长度为 `n` 的滑动窗口</span> | `&[T]` |
| `chunks(n)` | Process `n` elements at a time<br><span class="zh-inline">每次处理 `n` 个元素</span> | Non-overlapping slices of size `n`<br><span class="zh-inline">固定大小、不重叠的切片块</span> | `&[T]` |
| `fold(init, f)` | `int acc = init; for (...) acc = f(acc, x);` | Reduce to single value<br><span class="zh-inline">归约成一个结果</span> | `Acc` |
| `scan(init, f)` | Running accumulator with output<br><span class="zh-inline">边累计边产出中间结果</span> | Like `fold` but yields intermediate results<br><span class="zh-inline">类似 `fold`，但会把中间状态产出出来</span> | `Option<B>` |
| `take(n)` / `skip(n)` | Start loop at offset / limit<br><span class="zh-inline">从偏移处开始，或限制前几个元素</span> | First `n` / skip first `n` elements<br><span class="zh-inline">取前 `n` 个 / 跳过前 `n` 个</span> | `T` |
| `take_while(f)` / `skip_while(f)` | `while (pred) {...}` | Take/skip while predicate holds<br><span class="zh-inline">条件成立时持续取或跳过</span> | `T` |
| `peekable()` | Lookahead with `arr[i+1]`<br><span class="zh-inline">偷看下一个元素</span> | Allows `.peek()` without consuming<br><span class="zh-inline">允许在不消费元素的前提下预览</span> | `T` |
| `step_by(n)` | `for (i=0; i<len; i+=n)` | Take every nth element<br><span class="zh-inline">每隔 `n` 个取一个</span> | `T` |
| `unzip()` | Split parallel arrays<br><span class="zh-inline">把配对结果拆回两组</span> | Collect pairs into two collections<br><span class="zh-inline">把成对元素拆成两个集合</span> | `(A, B)` |
| `sum()` / `product()` | Accumulate sum/product<br><span class="zh-inline">累加 / 累乘</span> | Reduce with `+` or `*`<br><span class="zh-inline">通过加法或乘法归约</span> | `T` |
| `min()` / `max()` | Find extremes<br><span class="zh-inline">找最小值 / 最大值</span> | Return `Option<T>` | `Option<T>` |
| `any(f)` / `all(f)` | `bool found = false; for (...) ...` | Short-circuit boolean search<br><span class="zh-inline">短路式布尔判断</span> | `bool` |
| `position(f)` | `for (i=0; ...) if (pred) return i;` | Index of first match<br><span class="zh-inline">返回第一个匹配项的索引</span> | `Option<usize>` |

### `enumerate` — Index + Value<br><span class="zh-inline">`enumerate`：索引和值一起拿</span>

```rust
fn main() {
    let sensors = ["GPU_TEMP", "CPU_TEMP", "FAN_RPM", "PSU_WATT"];

    // C style: for (int i = 0; i < 4; i++) printf("[%d] %s\n", i, sensors[i]);
    for (i, name) in sensors.iter().enumerate() {
        println!("[{i}] {name}");
    }

    // Find the index of a specific sensor
    let gpu_idx = sensors.iter().position(|&s| s == "GPU_TEMP");
    println!("GPU sensor at index: {gpu_idx:?}");  // Some(0)
}
```

`enumerate()` 是替换“手动维护索引变量”最直接的一招。只要原来循环里既要元素又要下标，先想到它基本不会错。<br><span class="zh-inline">相比自己写 `i += 1`，这种写法更安全，也更不容易把索引和数据流搞脱节。</span>

### `zip` — Parallel Iteration<br><span class="zh-inline">`zip`：并行迭代</span>

```rust
fn main() {
    let names = ["accel_diag", "nic_diag", "cpu_diag"];
    let statuses = [true, false, true];
    let durations_ms = [1200, 850, 3400];

    // C: for (int i=0; i<3; i++) printf("%s: %s (%d ms)\n", names[i], ...);
    for ((name, passed), ms) in names.iter().zip(&statuses).zip(&durations_ms) {
        let status = if *passed { "PASS" } else { "FAIL" };
        println!("{name}: {status} ({ms} ms)");
    }
}
```

`zip()` 特别适合替换那种“多个数组长度一致，然后靠同一个索引并行访问”的老写法。<br><span class="zh-inline">C 里这种代码写多了很容易下标错位，Rust 用 `zip()` 后意图就清晰得多。</span>

### `chain` — Concatenate Iterators<br><span class="zh-inline">`chain`：把两个迭代器接起来</span>

```rust
fn main() {
    let critical = vec!["ECC error", "Thermal shutdown"];
    let warnings = vec!["Link degraded", "Fan slow"];

    // Process all events in priority order
    let all_events: Vec<_> = critical.iter().chain(warnings.iter()).collect();
    println!("{all_events:?}");
    // ["ECC error", "Thermal shutdown", "Link degraded", "Fan slow"]
}
```

这玩意看似简单，但在日志、告警、配置拼接这种地方特别顺手。与其先分配个新数组再复制一遍，不如直接把两个迭代器首尾相连。<br><span class="zh-inline">只要处理逻辑本身是线性的，`chain()` 往往比手写循环更干净。</span>

### `flat_map` — Flatten Nested Results<br><span class="zh-inline">`flat_map`：映射后拍平</span>

```rust
fn main() {
    let lines = vec!["gpu:42:ok", "nic:99:fail", "cpu:7:ok"];

    // Extract all numeric values from colon-separated lines
    let numbers: Vec<u32> = lines.iter()
        .flat_map(|line| line.split(':'))
        .filter_map(|token| token.parse::<u32>().ok())
        .collect();
    println!("{numbers:?}");  // [42, 99, 7]
}
```

`flat_map()` 的味道是“每个元素先变成一小串，再把这些小串摊平”。<br><span class="zh-inline">处理多层数据、拆分字符串、展开子集合时，这招比嵌套循环顺很多。</span>

### `windows` and `chunks` — Sliding and Fixed-Size Groups<br><span class="zh-inline">`windows` 与 `chunks`：滑动窗口和固定分块</span>

```rust
fn main() {
    let temps = [65, 68, 72, 71, 75, 80, 78, 76];

    // windows(3): overlapping groups of 3 (like a sliding average)
    // C: for (int i = 0; i <= len-3; i++) avg(arr[i], arr[i+1], arr[i+2]);
    let moving_avg: Vec<f64> = temps.windows(3)
        .map(|w| w.iter().sum::<i32>() as f64 / 3.0)
        .collect();
    println!("Moving avg: {moving_avg:.1?}");

    // chunks(2): non-overlapping groups of 2
    // C: for (int i = 0; i < len; i += 2) process(arr[i], arr[i+1]);
    for pair in temps.chunks(2) {
        println!("Chunk: {pair:?}");
    }

    // chunks_exact(2): same but panics if remainder exists
    // Also: .remainder() gives leftover elements
}
```

`windows()` 适合做滑动平均、相邻差分、连续模式检测；`chunks()` 则适合按包、按帧、按固定尺寸批处理。<br><span class="zh-inline">这两个 API 把 C 里最容易写错边界条件的那类循环，直接包装成了现成工具。</span>

### `fold` and `scan` — Accumulation<br><span class="zh-inline">`fold` 与 `scan`：累计计算</span>

```rust
fn main() {
    let values = [10, 20, 30, 40, 50];

    // fold: single final result (like C's accumulator loop)
    let sum = values.iter().fold(0, |acc, &x| acc + x);
    println!("Sum: {sum}");  // 150

    // Build a string with fold
    let csv = values.iter()
        .fold(String::new(), |acc, x| {
            if acc.is_empty() { format!("{x}") }
            else { format!("{acc},{x}") }
        });
    println!("CSV: {csv}");  // "10,20,30,40,50"

    // scan: like fold but yields intermediate results
    let running_sum: Vec<i32> = values.iter()
        .scan(0, |state, &x| {
            *state += x;
            Some(*state)
        })
        .collect();
    println!("Running sum: {running_sum:?}");  // [10, 30, 60, 100, 150]
}
```

`fold()` 更像“最后只要一个总结果”；`scan()` 则像“每一步中间结果我也想拿到”。<br><span class="zh-inline">一个偏归约，一个偏流水线状态传播，记住这个差别就够了。</span>

### Exercise: Sensor Data Pipeline<br><span class="zh-inline">练习：传感器数据流水线</span>

Given raw sensor readings (one per line, format `"sensor_name:value:unit"`), write an iterator pipeline that:<br><span class="zh-inline">给定原始传感器读数，每行格式是 `"sensor_name:value:unit"`，请写一个迭代器流水线，完成下面这些步骤：</span>

1. Parses each line into `(name, f64, unit)`<br><span class="zh-inline">1. 把每一行解析成 `(name, f64, unit)`。</span>
2. Filters out readings below a threshold<br><span class="zh-inline">2. 过滤掉低于阈值的读数。</span>
3. Groups by sensor name using `fold` into a `HashMap`<br><span class="zh-inline">3. 用 `fold` 按传感器名聚合进 `HashMap`。</span>
4. Prints the average reading per sensor<br><span class="zh-inline">4. 输出每个传感器的平均读数。</span>

```rust
// Starter code
fn main() {
    let raw_data = vec![
        "gpu_temp:72.5:C",
        "cpu_temp:65.0:C",
        "gpu_temp:74.2:C",
        "fan_rpm:1200.0:RPM",
        "cpu_temp:63.8:C",
        "gpu_temp:80.1:C",
        "fan_rpm:1150.0:RPM",
    ];
    let threshold = 70.0;
    // TODO: Parse, filter values >= threshold, group by name, compute averages
}
```

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
use std::collections::HashMap;

fn main() {
    let raw_data = vec![
        "gpu_temp:72.5:C",
        "cpu_temp:65.0:C",
        "gpu_temp:74.2:C",
        "fan_rpm:1200.0:RPM",
        "cpu_temp:63.8:C",
        "gpu_temp:80.1:C",
        "fan_rpm:1150.0:RPM",
    ];
    let threshold = 70.0;

    // Parse → filter → group → average
    let grouped = raw_data.iter()
        .filter_map(|line| {
            let parts: Vec<&str> = line.splitn(3, ':').collect();
            if parts.len() == 3 {
                let value: f64 = parts[1].parse().ok()?;
                Some((parts[0], value, parts[2]))
            } else {
                None
            }
        })
        .filter(|(_, value, _)| *value >= threshold)
        .fold(HashMap::<&str, Vec<f64>>::new(), |mut acc, (name, value, _)| {
            acc.entry(name).or_default().push(value);
            acc
        });

    for (name, values) in &grouped {
        let avg = values.iter().sum::<f64>() / values.len() as f64;
        println!("{name}: avg={avg:.1} ({} readings)", values.len());
    }
}
// Output (order may vary):
// gpu_temp: avg=75.6 (3 readings)
// fan_rpm: avg=1175.0 (2 readings)
```

</details>

# Implementing iterators for your own types<br><span class="zh-inline">为自定义类型实现迭代器</span>

- The `Iterator` trait is used to implement iteration over user defined types (https://doc.rust-lang.org/std/iter/trait.IntoIterator.html)<br><span class="zh-inline">`Iterator` trait 用来给自定义类型实现迭代能力。参考： https://doc.rust-lang.org/std/iter/trait.IntoIterator.html</span>
    - In the example, we'll implement an iterator for the Fibonacci sequence, which starts with 1, 1, 2, ... and each successor is the sum of the previous two numbers<br><span class="zh-inline">例如可以为斐波那契数列实现一个迭代器，序列从 1、1、2 开始，后一个数等于前两个数之和。</span>
    - The associated type in `Iterator` (`type Item = u32;`) defines the output type from our iterator (`u32`)<br><span class="zh-inline">`Iterator` 里的关联类型，也就是 `type Item = u32;`，定义了这个迭代器每次产出的元素类型。</span>
    - The `next()` method simply contains the logic for implementing our iterator. In this case, all state information is available in the `Fibonacci` structure<br><span class="zh-inline">`next()` 方法里写的就是迭代逻辑本身。像斐波那契这种例子，所有状态都可以直接塞进结构体字段里。</span>
    - We could also implement another trait called `IntoIterator` to implement `into_iter()` for more specialized iterators<br><span class="zh-inline">如果还想让类型在 `for` 循环里更自然地工作，通常还会实现 `IntoIterator`。</span>
    - https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=ab367dc2611e1b5a0bf98f1185b38f3f<br><span class="zh-inline">示例链接： https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=ab367dc2611e1b5a0bf98f1185b38f3f</span>

这一章真正要带走的，不是把所有迭代器方法背成口诀，而是先把一个思路立住：很多 C 风格循环，本质上都在描述“数据如何流过一串变换”。<br><span class="zh-inline">一旦开始用迭代器去想问题，代码会更短、更安全，也更不容易在边界条件上翻车。</span>
