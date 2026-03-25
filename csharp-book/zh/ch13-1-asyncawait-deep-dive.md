## Async Programming: C# Task vs Rust Future<br><span class="zh-inline">异步编程：C# `Task` 与 Rust `Future` 对照</span>

> **What you'll learn:** Rust's lazy `Future` vs C#'s eager `Task`, the executor model (tokio), cancellation via `Drop` + `select!` vs `CancellationToken`, and real-world patterns for concurrent requests.<br><span class="zh-inline">**本章将学到什么：** Rust 惰性 `Future` 与 C# 急切 `Task` 的根本区别，执行器模型也就是 Tokio 在做什么，`Drop` 加 `select!` 如何对应 `CancellationToken`，以及并发请求在真实项目里的常见写法。</span>
>
> **Difficulty:** 🔴 Advanced<br><span class="zh-inline">**难度：** 🔴 高级</span>

C# developers are deeply familiar with `async`/`await`. Rust uses the same keywords but with a fundamentally different execution model.<br><span class="zh-inline">C# 开发者对 `async` / `await` 通常已经很熟，但 Rust 虽然沿用了同样的关键字，执行模型却从根上就不一样。</span>

### The Executor Model<br><span class="zh-inline">执行器模型</span>

```csharp
// C# — The runtime provides a built-in thread pool and task scheduler
// async/await "just works" out of the box
public async Task<string> FetchDataAsync(string url)
{
    using var client = new HttpClient();
    return await client.GetStringAsync(url);  // Scheduled by .NET thread pool
}
// .NET manages the thread pool, task scheduling, and synchronization context
```

```rust
// Rust — No built-in async runtime. You choose an executor.
// The most popular is tokio.
async fn fetch_data(url: &str) -> Result<String, reqwest::Error> {
    let body = reqwest::get(url).await?.text().await?;
    Ok(body)
}

// You MUST have a runtime to execute async code:
#[tokio::main]  // This macro sets up the tokio runtime
async fn main() {
    let data = fetch_data("https://example.com").await.unwrap();
    println!("{}", &data[..100]);
}
```

这里最要命的误区，就是把 Rust async 想成“.NET 那套换了个语法皮”。不是。C# 里运行时帮忙把线程池、任务调度、同步上下文都安排好了；Rust 则要求把运行时选择这件事明确摆到台面上。<br><span class="zh-inline">所以在 Rust 里，Tokio 不是可有可无的小工具，而是 async 代码真正跑起来的基础设施之一。</span>

### Future vs Task<br><span class="zh-inline">`Future` 与 `Task` 的区别</span>

| | C# `Task<T>` | Rust `Future<Output = T>` |
|---|---|---|
| **Execution**<br><span class="zh-inline">执行时机</span> | Starts immediately when created<br><span class="zh-inline">创建后立刻开始执行</span> | **Lazy** — does nothing until `.await`ed<br><span class="zh-inline">**惰性**，在被 `.await` 或 `poll` 前什么都不做</span> |
| **Runtime**<br><span class="zh-inline">运行时</span> | Built-in (CLR thread pool)<br><span class="zh-inline">CLR 内建</span> | External (tokio, async-std, etc.)<br><span class="zh-inline">外部运行时提供，例如 Tokio</span> |
| **Cancellation**<br><span class="zh-inline">取消方式</span> | `CancellationToken` | Drop the `Future` (or `tokio::select!`) |
| **State machine**<br><span class="zh-inline">状态机</span> | Compiler-generated<br><span class="zh-inline">编译器生成</span> | Compiler-generated<br><span class="zh-inline">编译器生成</span> |
| **Size**<br><span class="zh-inline">大小</span> | Heap-allocated<br><span class="zh-inline">通常堆分配</span> | Stack-allocated until boxed<br><span class="zh-inline">装箱前通常放在栈上</span> |

```rust
// IMPORTANT: Futures are lazy in Rust!
async fn compute() -> i32 { println!("Computing!"); 42 }

let future = compute();  // Nothing printed! Future not polled yet.
let result = future.await; // NOW "Computing!" is printed
```

```csharp
// C# Tasks start immediately!
var task = ComputeAsync();  // "Computing!" printed immediately
var result = await task;    // Just waits for completion
```

这张表里最关键的一行就是第一行：Rust `Future` 是惰性的。这个差异几乎会影响后面所有 async 代码的理解方式。<br><span class="zh-inline">在 C# 里，任务一旦创建，通常已经在跑；在 Rust 里，future 更像“待执行计划”，不是“已经启动的任务”。</span>

### Cancellation: CancellationToken vs Drop / `select!`<br><span class="zh-inline">取消：`CancellationToken` 对比 `Drop` / `select!`</span>

```csharp
// C# — Cooperative cancellation with CancellationToken
public async Task ProcessAsync(CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        await Task.Delay(1000, ct);  // Throws if cancelled
        DoWork();
    }
}

var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
await ProcessAsync(cts.Token);
```

```rust
// Rust — Cancellation by dropping the future, or with tokio::select!
use tokio::time::{sleep, Duration};

async fn process() {
    loop {
        sleep(Duration::from_secs(1)).await;
        do_work();
    }
}

// Timeout pattern with select!
async fn run_with_timeout() {
    tokio::select! {
        _ = process() => { println!("Completed"); }
        _ = sleep(Duration::from_secs(5)) => { println!("Timed out!"); }
    }
    // When select! picks the timeout branch, the process() future is DROPPED
    // —  automatic cleanup, no CancellationToken needed
}
```

Rust 这边的取消思路更加直接粗暴一点：future 不再被持有，也不再被 `poll`，它就结束了。<br><span class="zh-inline">这也是为什么 `tokio::select!` 这么重要。它不仅是“谁先完成选谁”，同时也天然带着“没赢的分支直接被丢弃”的语义。</span>

### Real-World Pattern: Concurrent Requests with Timeout<br><span class="zh-inline">真实模式：并发请求加超时</span>

```csharp
// C# — Concurrent HTTP requests with timeout
public async Task<string[]> FetchAllAsync(string[] urls, CancellationToken ct)
{
    var tasks = urls.Select(url => httpClient.GetStringAsync(url, ct));
    return await Task.WhenAll(tasks);
}
```

```rust
// Rust — Concurrent requests with tokio::join! or futures::join_all
use futures::future::join_all;

async fn fetch_all(urls: &[&str]) -> Vec<Result<String, reqwest::Error>> {
    let futures = urls.iter().map(|url| reqwest::get(*url));
    let responses = join_all(futures).await;

    let mut results = Vec::new();
    for resp in responses {
        results.push(resp?.text().await);
    }
    results
}

// With timeout:
async fn fetch_all_with_timeout(urls: &[&str]) -> Result<Vec<String>, &'static str> {
    tokio::time::timeout(
        Duration::from_secs(10),
        async {
            let futures: Vec<_> = urls.iter()
                .map(|url| async { reqwest::get(*url).await?.text().await })
                .collect();
            let results = join_all(futures).await;
            results.into_iter().collect::<Result<Vec<_>, _>>()
        }
    )
    .await
    .map_err(|_| "Request timed out")?
    .map_err(|_| "Request failed")
}
```

Rust 在并发请求这种场景里依然很好用，只是习惯不同。C# 常见是 `Task.WhenAll`、`Task.WhenAny`，Rust 这边则是 `join!`、`join_all`、`select!`、`timeout` 这些组合拳。<br><span class="zh-inline">思路本身没变，变的是调度和取消的语义基础。</span>

<details>
<summary><strong>🏋️ Exercise: Async Timeout Pattern</strong> <span class="zh-inline">🏋️ 练习：异步超时模式</span></summary>

**Challenge**: Write an async function that fetches from two URLs concurrently, returns whichever responds first, and cancels the other. (This is `Task.WhenAny` in C#.)<br><span class="zh-inline">**挑战题：** 写一个 async 函数，并发请求两个 URL，谁先返回就用谁，同时取消另一个。这相当于 C# 里的 `Task.WhenAny`。</span>

<details>
<summary>🔑 Solution <span class="zh-inline">🔑 参考答案</span></summary>

```rust
use tokio::time::{sleep, Duration};

// Simulated async fetch
async fn fetch(url: &str, delay_ms: u64) -> String {
    sleep(Duration::from_millis(delay_ms)).await;
    format!("Response from {url}")
}

async fn fetch_first(url1: &str, url2: &str) -> String {
    tokio::select! {
        result = fetch(url1, 200) => {
            println!("URL 1 won");
            result
        }
        result = fetch(url2, 500) => {
            println!("URL 2 won");
            result
        }
    }
    // The losing branch's future is automatically dropped (cancelled)
}

#[tokio::main]
async fn main() {
    let result = fetch_first("https://fast.api", "https://slow.api").await;
    println!("{result}");
}
```

**Key takeaway**: `tokio::select!` is Rust's equivalent of `Task.WhenAny` — it races multiple futures, completes when the first one finishes, and drops (cancels) the rest.<br><span class="zh-inline">**关键点：** `tokio::select!` 基本可以看作 Rust 版 `Task.WhenAny`。它会让多个 future 竞争，谁先完成就取谁，其他分支会被直接丢弃，相当于自动取消。</span>

</details>
</details>

### Spawning Independent Tasks with `tokio::spawn`<br><span class="zh-inline">用 `tokio::spawn` 启动独立任务</span>

In C#, `Task.Run` launches work that runs independently of the caller. Rust's equivalent is `tokio::spawn`:<br><span class="zh-inline">在 C# 里，`Task.Run` 会启动一段独立于当前调用者的工作流。Rust 里最接近的东西就是 `tokio::spawn`：</span>

```rust
use tokio::task;

async fn background_work() {
    // Runs independently — even if the caller's future is dropped
    let handle = task::spawn(async {
        tokio::time::sleep(Duration::from_secs(2)).await;
        42
    });

    // Do other work while the spawned task runs...
    println!("Doing other work");

    // Await the result when you need it
    let result = handle.await.unwrap(); // 42
}
```

```csharp
// C# equivalent
var task = Task.Run(async () => {
    await Task.Delay(2000);
    return 42;
});
// Do other work...
var result = await task;
```

**Key difference**: A regular `async {}` block is lazy — it does nothing until awaited. `tokio::spawn` launches it on the runtime immediately, like C#'s `Task.Run`.<br><span class="zh-inline">**关键差异：** 普通 `async {}` 代码块本身是惰性的，不 `await` 不执行；`tokio::spawn` 则会把它立刻丢给运行时执行，更接近 C# `Task.Run` 的语义。</span>

### Pin: Why Rust Async Has a Concept C# Doesn't<br><span class="zh-inline">Pin：为什么 Rust async 多了个 C# 没有的概念</span>

C# developers never encounter `Pin` — the CLR's garbage collector moves objects freely and updates all references automatically. Rust has no GC. When the compiler transforms an `async fn` into a state machine, that struct may contain internal pointers to its own fields. Moving the struct would invalidate those pointers.<br><span class="zh-inline">C# 开发者几乎不会碰到 `Pin`，因为 CLR 的垃圾回收器会自由移动对象并自动更新引用。Rust 没有 GC。当编译器把 `async fn` 变成状态机后，这个结构体内部可能会含有指向自身字段的内部引用。如果再把整个值搬来搬去，这些内部引用就会失效。</span>

`Pin<T>` is a wrapper that says: **"this value will not be moved in memory."**<br><span class="zh-inline">`Pin<T>` 的意思可以粗暴理解成一句话：**“这个值放在内存里之后，别再挪它。”**</span>

```rust
// You'll see Pin in these contexts:
trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
    //           ^^^^^^^^^^^^^^ pinned — internal references stay valid
}

// Returning a boxed future from a trait:
fn make_future() -> Pin<Box<dyn Future<Output = i32> + Send>> {
    Box::pin(async { 42 })
}
```

**In practice, you almost never write `Pin` yourself.** The `async fn` and `.await` syntax handles it. You'll encounter it only in:<br><span class="zh-inline">**实际工作里，几乎不会频繁手写 `Pin`。** 大多数时候 `async fn` 和 `.await` 语法已经帮忙兜住了。真正会碰到它，通常是下面这几类场景：</span>

- Compiler error messages (follow the suggestion)<br><span class="zh-inline">编译器报错提示里出现 `Pin`。</span>
- `tokio::select!` (use the `pin!()` macro)<br><span class="zh-inline">`tokio::select!` 一类场景，需要配合 `pin!()` 宏。</span>
- Trait methods returning `dyn Future` (use `Box::pin(async { ... })`)<br><span class="zh-inline">trait 方法返回 `dyn Future` 时，通常要用 `Box::pin(async { ... })`。</span>

> **Want the deep dive?** The companion [Async Rust Training](../async-book/ch04-pin-and-unpin.html) covers Pin, Unpin, self-referential structs, and structural pinning in full detail.<br><span class="zh-inline">**想深挖？** 配套材料 [Async Rust Training](../async-book/ch04-pin-and-unpin.html) 会系统讲 `Pin`、`Unpin`、自引用结构体和结构性 pin。</span>

***
