# 15. Async/Await Essentials 🔴<br><span class="zh-inline">15. Async/Await 核心要点 🔴</span>

> **What you'll learn:**<br><span class="zh-inline">**本章将学到什么：**</span>
> - How Rust's `Future` trait differs from Go's goroutines and Python's asyncio<br><span class="zh-inline">Rust 的 `Future` trait 和 Go goroutine、Python asyncio 到底差在哪</span>
> - Tokio quick-start: spawning tasks, `join!`, and runtime configuration<br><span class="zh-inline">Tokio 快速上手：启动任务、使用 `join!`、配置运行时</span>
> - Common async pitfalls and how to fix them<br><span class="zh-inline">常见 async 陷阱以及修法</span>
> - When to offload blocking work with `spawn_blocking`<br><span class="zh-inline">什么时候该用 `spawn_blocking` 把阻塞工作甩出去</span>

## Futures, Runtimes, and `async fn`<br><span class="zh-inline">Future、运行时与 `async fn`</span>

Rust's async model is *fundamentally different* from Go's goroutines or Python's `asyncio`. Understanding three concepts is enough to get started:<br><span class="zh-inline">Rust 的 async 模型和 Go 的 goroutine、Python 的 `asyncio` 有 *根本差异*。真正入门只要先吃透三件事：</span>

1. **A `Future` is a lazy state machine** — calling `async fn` doesn't execute anything; it returns a `Future` that must be polled.<br><span class="zh-inline">1. **`Future` 是惰性的状态机**：调用 `async fn` 时什么都不会真正执行，它只会返回一个等待被 poll 的 `Future`。</span>
2. **You need a runtime** to poll futures — `tokio`, `async-std`, or `smol`. The standard library defines `Future` but provides no runtime.<br><span class="zh-inline">2. **必须有运行时** 才能 poll future，比如 `tokio`、`async-std` 或 `smol`。标准库只定义了 `Future`，但压根没带运行时。</span>
3. **`async fn` is sugar** — the compiler transforms it into a state machine that implements `Future`.<br><span class="zh-inline">3. **`async fn` 只是语法糖**：编译器会把它展开成一个实现了 `Future` 的状态机。</span>

```rust
// A Future is just a trait:
pub trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}

// async fn desugars to:
// fn fetch_data(url: &str) -> impl Future<Output = Result<Vec<u8>, Error>>
async fn fetch_data(url: &str) -> Result<Vec<u8>, reqwest::Error> {
    let response = reqwest::get(url).await?;  // .await yields until ready
    let bytes = response.bytes().await?;
    Ok(bytes.to_vec())
}
```

### Tokio Quick Start<br><span class="zh-inline">Tokio 快速上手</span>

```toml
# Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

```rust,ignore
use tokio::time::{sleep, Duration};
use tokio::task;

#[tokio::main]
async fn main() {
    // Spawn concurrent tasks (like lightweight threads):
    let handle_a = task::spawn(async {
        sleep(Duration::from_millis(100)).await;
        "task A done"
    });

    let handle_b = task::spawn(async {
        sleep(Duration::from_millis(50)).await;
        "task B done"
    });

    // .await both — they run concurrently, not sequentially:
    let (a, b) = tokio::join!(handle_a, handle_b);
    println!("{}, {}", a.unwrap(), b.unwrap());
}
```

### Async Common Pitfalls<br><span class="zh-inline">Async 常见陷阱</span>

| Pitfall | Why It Happens | Fix |
|---------|---------------|-----|
| Blocking in async<br><span class="zh-inline">在 async 里做阻塞操作</span> | `std::thread::sleep` or CPU work blocks the executor<br><span class="zh-inline">`std::thread::sleep` 或重 CPU 工作会把执行器线程直接卡死</span> | Use `tokio::task::spawn_blocking` or `rayon`<br><span class="zh-inline">用 `tokio::task::spawn_blocking` 或 `rayon`</span> |
| `Send` bound errors<br><span class="zh-inline">`Send` 约束报错</span> | Future held across `.await` contains `!Send` type (e.g., `Rc`, `MutexGuard`)<br><span class="zh-inline">跨 `.await` 保存了 `!Send` 类型，例如 `Rc`、`MutexGuard`</span> | Restructure to drop non-Send values before `.await`<br><span class="zh-inline">重构代码，让这些非 Send 值在 `.await` 之前就被释放</span> |
| Future not polled<br><span class="zh-inline">Future 根本没被 poll</span> | Calling `async fn` without `.await` or spawning — nothing happens<br><span class="zh-inline">只调用 `async fn` 却没 `.await`，也没 spawn，结果就是什么都不会发生</span> | Always `.await` or `tokio::spawn` the returned future<br><span class="zh-inline">要么 `.await`，要么 `tokio::spawn`</span> |
| Holding `MutexGuard` across `.await`<br><span class="zh-inline">把 `MutexGuard` 跨 `.await` 持有</span> | `std::sync::MutexGuard` is `!Send`; async tasks may resume on different thread<br><span class="zh-inline">`std::sync::MutexGuard` 是 `!Send`，而 async 任务恢复时可能换线程</span> | Use `tokio::sync::Mutex` or drop the guard before `.await`<br><span class="zh-inline">改用 `tokio::sync::Mutex`，或者在 `.await` 前先释放 guard</span> |
| Accidental sequential execution<br><span class="zh-inline">不小心写成串行执行</span> | `let a = foo().await; let b = bar().await;` runs sequentially<br><span class="zh-inline">`let a = foo().await; let b = bar().await;` 天然就是顺序执行</span> | Use `tokio::join!` or `tokio::spawn` for concurrency<br><span class="zh-inline">想并发就用 `tokio::join!` 或 `tokio::spawn`</span> |

```rust
// ❌ Blocking the async executor:
async fn bad() {
    std::thread::sleep(std::time::Duration::from_secs(5)); // Blocks entire thread!
}

// ✅ Offload blocking work:
async fn good() {
    tokio::task::spawn_blocking(|| {
        std::thread::sleep(std::time::Duration::from_secs(5)); // Runs on blocking pool
    }).await.unwrap();
}
```

> **Comprehensive async coverage**: For `Stream`, `select!`, cancellation safety, structured concurrency, and `tower` middleware, see our dedicated **Async Rust Training** guide. This section covers just enough to read and write basic async code.<br><span class="zh-inline">**更完整的 async 内容**：如果需要继续看 `Stream`、`select!`、取消安全、结构化并发和 `tower` 中间件，请直接去看单独的 **Async Rust Training**。这一节的目标只是让人能读懂并写出基础 async 代码。</span>

### Spawning and Structured Concurrency<br><span class="zh-inline">任务生成与结构化并发</span>

Tokio's `spawn` creates a new asynchronous task — similar to `thread::spawn` but much lighter:<br><span class="zh-inline">Tokio 的 `spawn` 会创建一个新的异步任务，概念上类似 `thread::spawn`，但成本轻得多：</span>

```rust,ignore
use tokio::task;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    // Spawn three concurrent tasks
    let h1 = task::spawn(async {
        sleep(Duration::from_millis(200)).await;
        "fetched user profile"
    });

    let h2 = task::spawn(async {
        sleep(Duration::from_millis(100)).await;
        "fetched order history"
    });

    let h3 = task::spawn(async {
        sleep(Duration::from_millis(150)).await;
        "fetched recommendations"
    });

    // Wait for all three concurrently (not sequentially!)
    let (r1, r2, r3) = tokio::join!(h1, h2, h3);
    println!("{}", r1.unwrap());
    println!("{}", r2.unwrap());
    println!("{}", r3.unwrap());
}
```

**`join!` vs `try_join!` vs `select!`**:<br><span class="zh-inline">**`join!`、`try_join!` 和 `select!` 的区别：**</span>

| Macro | Behavior | Use when |
|-------|----------|----------|
| `join!`<br><span class="zh-inline">`join!`</span> | Waits for ALL futures<br><span class="zh-inline">等待所有 future 完成</span> | All tasks must complete<br><span class="zh-inline">所有任务都必须完成时</span> |
| `try_join!`<br><span class="zh-inline">`try_join!`</span> | Waits for all, short-circuits on first `Err`<br><span class="zh-inline">等待全部，但一遇到 `Err` 就提前返回</span> | Tasks return `Result`<br><span class="zh-inline">任务返回值是 `Result` 时</span> |
| `select!`<br><span class="zh-inline">`select!`</span> | Returns when FIRST future completes<br><span class="zh-inline">哪个 future 先完成就先返回</span> | Timeouts, cancellation<br><span class="zh-inline">超时、取消等场景</span> |

```rust,ignore
use tokio::time::{timeout, Duration};

async fn fetch_with_timeout() -> Result<String, Box<dyn std::error::Error>> {
    let result = timeout(Duration::from_secs(5), async {
        // Simulate slow network call
        tokio::time::sleep(Duration::from_millis(100)).await;
        Ok::<_, Box<dyn std::error::Error>>("data".to_string())
    }).await??; // First ? unwraps Elapsed, second ? unwraps inner Result

    Ok(result)
}
```

### `Send` Bounds and Why Futures Must Be `Send`<br><span class="zh-inline">`Send` 约束，以及为什么 future 往往必须是 `Send`</span>

When you `tokio::spawn` a future, it may resume on a different OS thread. This means the future must be `Send`. Common pitfalls:<br><span class="zh-inline">当用 `tokio::spawn` 启动一个 future 时，它后续恢复执行的位置可能已经换成另一个操作系统线程了。所以这个 future 通常必须实现 `Send`。最常见的坑就在这里：</span>

```rust,ignore
use std::rc::Rc;

async fn not_send() {
    let rc = Rc::new(42); // Rc is !Send
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    println!("{}", rc); // rc is held across .await — future is !Send
}

// Fix 1: Drop before .await
async fn fixed_drop() {
    let data = {
        let rc = Rc::new(42);
        *rc // Copy the value out
    }; // rc dropped here
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    println!("{}", data); // Just an i32, which is Send
}

// Fix 2: Use Arc instead of Rc
async fn fixed_arc() {
    let arc = std::sync::Arc::new(42); // Arc is Send
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    println!("{}", arc); // ✅ Future is Send
}
```

> **Comprehensive async coverage**: For `Stream`, `select!`, cancellation safety, structured concurrency, and `tower` middleware, see our dedicated **Async Rust Training** guide. This section covers just enough to read and write basic async code.<br><span class="zh-inline">**更完整的 async 内容**：`Stream`、`select!`、取消安全、结构化并发和 `tower` 中间件这些主题，还是继续看专门的 **Async Rust Training** 更合适。本节只负责把基础 async 写法讲明白。</span>

> **See also:** [Ch 5 — Channels](ch05-channels-and-message-passing.md) for synchronous channels. [Ch 6 — Concurrency](ch06-concurrency-vs-parallelism-vs-threads.md) for OS threads vs async tasks.<br><span class="zh-inline">**继续阅读：** [第 5 章：Channel](ch05-channels-and-message-passing.md) 讲同步 channel，[第 6 章：并发](ch06-concurrency-vs-parallelism-vs-threads.md) 会对比操作系统线程和 async 任务。</span>

> **Key Takeaways — Async**<br><span class="zh-inline">**本章要点：Async**</span>
> - `async fn` returns a lazy `Future` — nothing runs until you `.await` or spawn it<br><span class="zh-inline">`async fn` 返回的是惰性 `Future`，只有 `.await` 或 spawn 之后它才会真正运行。</span>
> - Use `tokio::task::spawn_blocking` for CPU-heavy or blocking work inside async contexts<br><span class="zh-inline">在 async 上下文里遇到重 CPU 或阻塞工作时，用 `tokio::task::spawn_blocking` 把它甩出去。</span>
> - Don't hold `std::sync::MutexGuard` across `.await` — use `tokio::sync::Mutex` instead<br><span class="zh-inline">不要把 `std::sync::MutexGuard` 跨 `.await` 持有，异步场景里改用 `tokio::sync::Mutex`。</span>
> - Futures must be `Send` when spawned — drop `!Send` types before `.await` points<br><span class="zh-inline">被 spawn 的 future 往往必须是 `Send`，因此在 `.await` 之前就要把 `!Send` 的值释放掉。</span>

---

### Exercise: Concurrent Fetcher with Timeout ★★ (~25 min)<br><span class="zh-inline">练习：带超时的并发抓取器 ★★（约 25 分钟）</span>

Write an async function `fetch_all` that spawns three `tokio::spawn` tasks, each simulating a network call with `tokio::time::sleep`. Join all three with `tokio::try_join!` wrapped in `tokio::time::timeout(Duration::from_secs(5), ...)`. Return `Result<Vec<String>, ...>` or an error if any task fails or the deadline expires.<br><span class="zh-inline">写一个异步函数 `fetch_all`，内部启动三个 `tokio::spawn` 任务，每个任务都用 `tokio::time::sleep` 模拟一次网络调用。然后用 `tokio::try_join!` 把它们合并，并且整个过程外面套上一层 `tokio::time::timeout(Duration::from_secs(5), ...)`。如果任一任务失败，或者总超时到了，就返回错误；否则返回 `Result<Vec<String>, ...>`。</span>

<details>
<summary>🔑 Solution <span class="zh-inline">🔑 参考答案</span></summary>

```rust,ignore
use tokio::time::{sleep, timeout, Duration};

async fn fake_fetch(name: &'static str, delay_ms: u64) -> Result<String, String> {
    sleep(Duration::from_millis(delay_ms)).await;
    Ok(format!("{name}: OK"))
}

async fn fetch_all() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let deadline = Duration::from_secs(5);

    let (a, b, c) = timeout(deadline, async {
        let h1 = tokio::spawn(fake_fetch("svc-a", 100));
        let h2 = tokio::spawn(fake_fetch("svc-b", 200));
        let h3 = tokio::spawn(fake_fetch("svc-c", 150));
        tokio::try_join!(h1, h2, h3)
    })
    .await??;

    Ok(vec![a?, b?, c?])
}

#[tokio::main]
async fn main() {
    let results = fetch_all().await.unwrap();
    for r in &results {
        println!("{r}");
    }
}
```

</details>

***
