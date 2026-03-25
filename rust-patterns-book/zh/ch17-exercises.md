## Exercises<br><span class="zh-inline">## 练习</span>

### Exercise 1: Type-Safe State Machine ★★ (~30 min)<br><span class="zh-inline">练习 1：类型安全的状态机 ★★（约 30 分钟）</span>

Build a traffic light state machine using the type-state pattern. The light must transition `Red → Green → Yellow → Red` and no other order should be possible.<br><span class="zh-inline">使用类型状态模式实现一个红绿灯状态机。它必须严格遵循 `Red → Green → Yellow → Red` 的顺序，除此之外的任何切换都不应该被允许。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use std::marker::PhantomData;

struct Red;
struct Green;
struct Yellow;

struct TrafficLight<State> {
    _state: PhantomData<State>,
}

impl TrafficLight<Red> {
    fn new() -> Self {
        println!("🔴 Red — STOP");
        TrafficLight { _state: PhantomData }
    }

    fn go(self) -> TrafficLight<Green> {
        println!("🟢 Green — GO");
        TrafficLight { _state: PhantomData }
    }
}

impl TrafficLight<Green> {
    fn caution(self) -> TrafficLight<Yellow> {
        println!("🟡 Yellow — CAUTION");
        TrafficLight { _state: PhantomData }
    }
}

impl TrafficLight<Yellow> {
    fn stop(self) -> TrafficLight<Red> {
        println!("🔴 Red — STOP");
        TrafficLight { _state: PhantomData }
    }
}
```

**Key takeaway**: Invalid transitions become compile errors rather than runtime panics.<br><span class="zh-inline">**要点**：非法状态迁移会在编译期就被拦下来，而不是等到运行时再出问题。</span>

</details>

---

### Exercise 2: Unit-of-Measure with PhantomData ★★ (~30 min)<br><span class="zh-inline">练习 2：用 PhantomData 实现单位模式 ★★（约 30 分钟）</span>

Extend the unit-of-measure pattern from Ch4 to support `Meters`, `Seconds`, `Kilograms`, same-unit addition, `Meters * Meters = SquareMeters`, and `Meters / Seconds = MetersPerSecond`.<br><span class="zh-inline">把第 4 章里的单位模式扩展一下，让它支持 `Meters`、`Seconds`、`Kilograms`，支持同类单位相加，以及 `Meters * Meters = SquareMeters`、`Meters / Seconds = MetersPerSecond`。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use std::marker::PhantomData;
use std::ops::{Add, Mul, Div};

#[derive(Clone, Copy)]
struct Meters;
#[derive(Clone, Copy)]
struct Seconds;
#[derive(Clone, Copy)]
struct Kilograms;
#[derive(Clone, Copy)]
struct SquareMeters;
#[derive(Clone, Copy)]
struct MetersPerSecond;

#[derive(Debug, Clone, Copy)]
struct Qty<U> {
    value: f64,
    _unit: PhantomData<U>,
}

impl<U> Qty<U> {
    fn new(v: f64) -> Self { Qty { value: v, _unit: PhantomData } }
}

impl<U> Add for Qty<U> {
    type Output = Qty<U>;
    fn add(self, rhs: Self) -> Self::Output { Qty::new(self.value + rhs.value) }
}

impl Mul<Qty<Meters>> for Qty<Meters> {
    type Output = Qty<SquareMeters>;
    fn mul(self, rhs: Qty<Meters>) -> Qty<SquareMeters> {
        Qty::new(self.value * rhs.value)
    }
}

impl Div<Qty<Seconds>> for Qty<Meters> {
    type Output = Qty<MetersPerSecond>;
    fn div(self, rhs: Qty<Seconds>) -> Qty<MetersPerSecond> {
        Qty::new(self.value / rhs.value)
    }
}
```

</details>

---

### Exercise 3: Channel-Based Worker Pool ★★★ (~45 min)<br><span class="zh-inline">练习 3：基于 Channel 的工作池 ★★★（约 45 分钟）</span>

Build a worker pool using channels where a dispatcher sends `Job`, N workers consume jobs, and results are sent back. Use `crossbeam-channel` if available, otherwise `std::sync::mpsc`.<br><span class="zh-inline">用 channel 实现一个工作池：分发器发送 `Job`，N 个 worker 消费任务并回传结果。如果方便可以用 `crossbeam-channel`，没有的话就用 `std::sync::mpsc`。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use std::sync::mpsc;
use std::thread;

struct Job {
    id: u64,
    data: String,
}

struct JobResult {
    job_id: u64,
    output: String,
    worker_id: usize,
}

fn worker_pool(jobs: Vec<Job>, num_workers: usize) -> Vec<JobResult> {
    let (job_tx, job_rx) = mpsc::channel::<Job>();
    let (result_tx, result_rx) = mpsc::channel::<JobResult>();

    let job_rx = std::sync::Arc::new(std::sync::Mutex::new(job_rx));
    let mut handles = Vec::new();

    for worker_id in 0..num_workers {
        let job_rx = job_rx.clone();
        let result_tx = result_tx.clone();
        handles.push(thread::spawn(move || {
            loop {
                let job = {
                    let rx = job_rx.lock().unwrap();
                    rx.recv()
                };
                match job {
                    Ok(job) => {
                        let output = format!("processed '{}' by worker {worker_id}", job.data);
                        result_tx.send(JobResult {
                            job_id: job.id,
                            output,
                            worker_id,
                        }).unwrap();
                    }
                    Err(_) => break,
                }
            }
        }));
    }
```

</details>

---

### Exercise 4: Higher-Order Combinator Pipeline ★★ (~25 min)<br><span class="zh-inline">练习 4：高阶组合器流水线 ★★（约 25 分钟）</span>

Create a `Pipeline` struct that supports `.pipe(f)` to add a transformation and `.execute(input)` to run the entire chain.<br><span class="zh-inline">实现一个 `Pipeline` 结构体，支持用 `.pipe(f)` 追加变换步骤，并用 `.execute(input)` 运行整条流水线。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
struct Pipeline<T> {
    transforms: Vec<Box<dyn Fn(T) -> T>>,
}

impl<T: 'static> Pipeline<T> {
    fn new() -> Self {
        Pipeline { transforms: Vec::new() }
    }

    fn pipe(mut self, f: impl Fn(T) -> T + 'static) -> Self {
        self.transforms.push(Box::new(f));
        self
    }

    fn execute(self, input: T) -> T {
        self.transforms.into_iter().fold(input, |val, f| f(val))
    }
}
```

**Bonus**: A pipeline that changes types between stages needs a different generic design, because each `.pipe()` changes the output type parameter.<br><span class="zh-inline">**额外思考**：如果流水线每一步都可能把类型改掉，那就得换一种更复杂的泛型设计，因为每次 `.pipe()` 其实都在改变输出类型。</span>

</details>

---

### Exercise 5: Error Hierarchy with thiserror ★★ (~30 min)<br><span class="zh-inline">练习 5：用 `thiserror` 设计错误层级 ★★（约 30 分钟）</span>

Design an error type hierarchy for a file-processing application that can fail during I/O, parsing, and validation. Use `thiserror` and demonstrate `?` propagation.<br><span class="zh-inline">为一个文件处理程序设计一套错误层级。它可能在 I/O、解析和校验阶段失败。使用 `thiserror`，并演示 `?` 是怎么一路传播错误的。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust,ignore
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON parse error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("CSV error at line {line}: {message}")]
    Csv { line: usize, message: String },

    #[error("validation error: {field} — {reason}")]
    Validation { field: String, reason: String },
}
```

</details>

---

### Exercise 6: Generic Trait with Associated Types ★★★ (~40 min)<br><span class="zh-inline">练习 6：带关联类型的泛型 Trait ★★★（约 40 分钟）</span>

Design a `Repository` trait with associated `Item`、`Id` and `Error` types. Implement it for an in-memory store and show compile-time type safety.<br><span class="zh-inline">设计一个带 `Item`、`Id`、`Error` 关联类型的 `Repository` trait。为内存仓库实现它，并展示编译期类型安全。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use std::collections::HashMap;

trait Repository {
    type Item;
    type Id;
    type Error;

    fn get(&self, id: &Self::Id) -> Result<Option<&Self::Item>, Self::Error>;
    fn insert(&mut self, item: Self::Item) -> Result<Self::Id, Self::Error>;
    fn delete(&mut self, id: &Self::Id) -> Result<bool, Self::Error>;
}
```

</details>

---

### Exercise 7: Safe Wrapper around Unsafe (Ch11) ★★★ (~45 min)<br><span class="zh-inline">练习 7：为 Unsafe 包一层安全外壳（第 11 章）★★★（约 45 分钟）</span>

Write a `FixedVec<T, const N: usize>` — a fixed-capacity stack-allocated vector. Use `MaybeUninit<T>` and make sure all public methods stay safe.<br><span class="zh-inline">编写一个 `FixedVec&lt;T, const N: usize&gt;`，也就是固定容量、栈上分配的向量。使用 `MaybeUninit&lt;T&gt;` 实现，并确保对外公开的方法全部保持安全。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use std::mem::MaybeUninit;

pub struct FixedVec<T, const N: usize> {
    data: [MaybeUninit<T>; N],
    len: usize,
}

impl<T, const N: usize> FixedVec<T, N> {
    pub fn new() -> Self {
        FixedVec {
            data: [const { MaybeUninit::uninit() }; N],
            len: 0,
        }
    }
}
```

</details>

---

### Exercise 8: Declarative Macro — `map!` (Ch12) ★ (~15 min)<br><span class="zh-inline">练习 8：声明式宏 `map!`（第 12 章）★（约 15 分钟）</span>

Write a `map!` macro that creates a `HashMap` from key-value pairs, supports trailing commas, and supports an empty invocation `map!{}`.<br><span class="zh-inline">实现一个 `map!` 宏，能从键值对构造 `HashMap`，支持结尾逗号，也支持空调用 `map!{}`。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
macro_rules! map {
    () => {
        std::collections::HashMap::new()
    };
    ( $( $key:expr => $val:expr ),+ $(,)? ) => {{
        let mut m = std::collections::HashMap::new();
        $( m.insert($key, $val); )+
        m
    }};
}
```

</details>

---

### Exercise 9: Custom serde Deserialization (Ch10) ★★★ (~45 min)<br><span class="zh-inline">练习 9：自定义 `serde` 反序列化（第 10 章）★★★（约 45 分钟）</span>

Design a `Duration` wrapper that can deserialize from strings like `"30s"`、`"5m"` and `"2h"`, and serialize back to the same format.<br><span class="zh-inline">设计一个 `Duration` 包装类型，让它能从 `"30s"`、`"5m"`、`"2h"` 这类字符串反序列化出来，并能序列化回同样格式。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust,ignore
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt;

#[derive(Debug, Clone, PartialEq)]
struct HumanDuration(std::time::Duration);
```

</details>

---

### Exercise 10 — Concurrent Fetcher with Timeout ★★ (~25 min)<br><span class="zh-inline">练习 10：带超时的并发抓取器 ★★（约 25 分钟）</span>

Write an async function `fetch_all` that spawns three `tokio::spawn` tasks, joins them with `tokio::try_join!`, and wraps the whole thing in `tokio::time::timeout(Duration::from_secs(5), ...)`.<br><span class="zh-inline">编写一个异步函数 `fetch_all`，它要启动三个 `tokio::spawn` 任务，用 `tokio::try_join!` 汇总，并用 `tokio::time::timeout(Duration::from_secs(5), ...)` 给整段流程套上超时。</span>

<details>
<summary>Solution<br><span class="zh-inline">参考答案</span></summary>

```rust,ignore
use tokio::time::{sleep, timeout, Duration};
```

</details>

---

### Exercise 11 — Async Channel Pipeline ★★★ (~40 min)<br><span class="zh-inline">练习 11：异步 Channel 流水线 ★★★（约 40 分钟）</span>

Build a producer → transformer → consumer pipeline with bounded `tokio::sync::mpsc` channels and make sure the final result is `[1, 4, 9, ..., 400]`.<br><span class="zh-inline">使用有界 `tokio::sync::mpsc` channel 构造一个 producer → transformer → consumer 流水线，并确保最终结果是 `[1, 4, 9, ..., 400]`。</span>

<details>
<summary>Solution<br><span class="zh-inline">参考答案</span></summary>

```rust,ignore
use tokio::sync::mpsc;
```

</details>

***
