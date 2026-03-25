## Exercises<br><span class="zh-inline">练习</span>

### Exercise 1: Async Echo Server<br><span class="zh-inline">练习 1：异步 Echo 服务器</span>

Build a TCP echo server that handles multiple clients concurrently.<br><span class="zh-inline">实现一个 TCP echo 服务器，要求能够并发处理多个客户端。</span>

**Requirements**:<br><span class="zh-inline">**要求：**</span>
- Listen on `127.0.0.1:8080`<br><span class="zh-inline">监听 `127.0.0.1:8080`</span>
- Accept connections and echo back each line<br><span class="zh-inline">接收连接，并把每一行原样回写</span>
- Handle client disconnections gracefully<br><span class="zh-inline">优雅处理客户端断开</span>
- Print a log when clients connect or disconnect<br><span class="zh-inline">在客户端连接与断开时打印日志</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Echo server listening on :8080");

    loop {
        let (socket, addr) = listener.accept().await?;
        println!("[{addr}] Connected");

        tokio::spawn(async move {
            let (reader, mut writer) = socket.into_split();
            let mut reader = BufReader::new(reader);
            let mut line = String::new();

            loop {
                line.clear();
                match reader.read_line(&mut line).await {
                    Ok(0) => {
                        println!("[{addr}] Disconnected");
                        break;
                    }
                    Ok(_) => {
                        print!("[{addr}] Echo: {line}");
                        if writer.write_all(line.as_bytes()).await.is_err() {
                            println!("[{addr}] Write error, disconnecting");
                            break;
                        }
                    }
                    Err(e) => {
                        eprintln!("[{addr}] Read error: {e}");
                        break;
                    }
                }
            }
        });
    }
}
```

</details>

---

### Exercise 2: Concurrent URL Fetcher with Rate Limiting<br><span class="zh-inline">练习 2：带并发限制的 URL 抓取器</span>

Fetch a list of URLs concurrently, with at most 5 requests running at the same time.<br><span class="zh-inline">并发抓取一组 URL，但同一时刻最多只能有 5 个请求在飞。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use futures::stream::{self, StreamExt};
use tokio::time::{sleep, Duration};

async fn fetch_urls(urls: Vec<String>) -> Vec<Result<String, String>> {
    // buffer_unordered(5) ensures at most 5 futures are polled
    // concurrently — no separate Semaphore needed here.
    let results: Vec<_> = stream::iter(urls)
        .map(|url| {
            async move {
                println!("Fetching: {url}");

                match reqwest::get(&url).await {
                    Ok(resp) => match resp.text().await {
                        Ok(body) => Ok(body),
                        Err(e) => Err(format!("{url}: {e}")),
                    },
                    Err(e) => Err(format!("{url}: {e}")),
                }
            }
        })
        .buffer_unordered(5) // ← This alone limits concurrency to 5
        .collect()
        .await;

    results
}

// NOTE: Use Semaphore when you need to limit concurrency across
// independently spawned tasks (tokio::spawn). Use buffer_unordered
// when processing a stream. Don't combine both for the same limit.
```

**Why this works**: `buffer_unordered(5)` itself is already the concurrency limiter. It only allows five in-flight futures at a time while still collecting results as soon as they finish.<br><span class="zh-inline">**为什么这样就够了：** `buffer_unordered(5)` 本身就是并发闸门。它只允许五个 future 同时处于进行中状态，并且谁先完成就先把结果收回来。</span>

</details>

---

### Exercise 3: Graceful Shutdown with Worker Pool<br><span class="zh-inline">练习 3：带优雅退出的工作池</span>

Build a task processor with these properties:<br><span class="zh-inline">实现一个任务处理器，要求具备下面这些特性：</span>
- A channel-based work queue<br><span class="zh-inline">基于 channel 的工作队列</span>
- N worker tasks consuming from the queue<br><span class="zh-inline">N 个 worker 任务从队列中消费任务</span>
- Graceful shutdown on Ctrl+C: stop accepting new work and finish in-flight work<br><span class="zh-inline">按下 Ctrl+C 后优雅退出：停止接收新任务，但把已经在处理中的任务收完</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use tokio::sync::{mpsc, watch};
use tokio::time::{sleep, Duration};

struct WorkItem {
    id: u64,
    payload: String,
}

#[tokio::main]
async fn main() {
    let (work_tx, work_rx) = mpsc::channel::<WorkItem>(100);
    let (shutdown_tx, shutdown_rx) = watch::channel(false);

    // Spawn 4 workers
    let mut worker_handles = Vec::new();
    let work_rx = std::sync::Arc::new(tokio::sync::Mutex::new(work_rx));

    for id in 0..4 {
        let rx = work_rx.clone();
        let mut shutdown = shutdown_rx.clone();
        let handle = tokio::spawn(async move {
            loop {
                let item = {
                    let mut rx = rx.lock().await;
                    tokio::select! {
                        item = rx.recv() => item,
                        _ = shutdown.changed() => {
                            if *shutdown.borrow() { None } else { continue }
                        }
                    }
                };

                match item {
                    Some(work) => {
                        println!("Worker {id}: processing item {}", work.id);
                        sleep(Duration::from_millis(200)).await; // Simulate work
                        println!("Worker {id}: done with item {}", work.id);
                    }
                    None => {
                        println!("Worker {id}: channel closed, exiting");
                        break;
                    }
                }
            }
        });
        worker_handles.push(handle);
    }

    // Producer: submit some work
    let producer = tokio::spawn(async move {
        for i in 0..20 {
            let _ = work_tx.send(WorkItem {
                id: i,
                payload: format!("task-{i}"),
            }).await;
            sleep(Duration::from_millis(50)).await;
        }
    });

    // Wait for Ctrl+C
    tokio::signal::ctrl_c().await.unwrap();
    println!("\nShutdown signal received!");
    shutdown_tx.send(true).unwrap();
    producer.abort(); // Cancel the producer task

    // Wait for workers to finish
    for handle in worker_handles {
        let _ = handle.await;
    }
    println!("All workers shut down. Goodbye!");
}
```

**Key point**: graceful shutdown is not “kill everything immediately”. The important part is to stop producing new work, broadcast shutdown intent, and allow existing worker tasks to reach a clean stopping point.<br><span class="zh-inline">**关键点：** 优雅退出不是“一刀切全杀掉”，而是先停掉新任务来源，再广播关闭意图，同时让已经跑起来的 worker 有机会走到一个干净的结束点。</span>

</details>

---

### Exercise 4: Build a Simple Async Mutex from Scratch<br><span class="zh-inline">练习 4：从零实现一个简单的异步 Mutex</span>

Implement an async-aware mutex without using `tokio::sync::Mutex`.<br><span class="zh-inline">在不使用 `tokio::sync::Mutex` 的前提下，实现一个能感知异步等待的 mutex。</span>

*Hint*: Use a `tokio::sync::mpsc` channel with capacity 1 as a semaphore.<br><span class="zh-inline">*提示*：可以把容量为 1 的 `tokio::sync::mpsc` channel 想成一个信号量。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use std::cell::UnsafeCell;
use std::sync::Arc;
use tokio::sync::{OwnedSemaphorePermit, Semaphore};

pub struct SimpleAsyncMutex<T> {
    data: Arc<UnsafeCell<T>>,
    semaphore: Arc<Semaphore>,
}

// SAFETY: Access to T is serialized by the semaphore (max 1 permit).
unsafe impl<T: Send> Send for SimpleAsyncMutex<T> {}
unsafe impl<T: Send> Sync for SimpleAsyncMutex<T> {}

pub struct SimpleGuard<T> {
    data: Arc<UnsafeCell<T>>,
    _permit: OwnedSemaphorePermit, // Dropped on guard drop → releases lock
}

impl<T> SimpleAsyncMutex<T> {
    pub fn new(value: T) -> Self {
        SimpleAsyncMutex {
            data: Arc::new(UnsafeCell::new(value)),
            semaphore: Arc::new(Semaphore::new(1)),
        }
    }

    pub async fn lock(&self) -> SimpleGuard<T> {
        let permit = self.semaphore.clone().acquire_owned().await.unwrap();
        SimpleGuard {
            data: self.data.clone(),
            _permit: permit,
        }
    }
}

impl<T> std::ops::Deref for SimpleGuard<T> {
    type Target = T;
    fn deref(&self) -> &T {
        // SAFETY: We hold the only semaphore permit, so no other
        // SimpleGuard exists → exclusive access is guaranteed.
        unsafe { &*self.data.get() }
    }
}

impl<T> std::ops::DerefMut for SimpleGuard<T> {
    fn deref_mut(&mut self) -> &mut T {
        // SAFETY: Same reasoning — single permit guarantees exclusivity.
        unsafe { &mut *self.data.get() }
    }
}

// When SimpleGuard is dropped, _permit is dropped,
// which releases the semaphore permit — another lock() can proceed.

// Usage:
// let mutex = SimpleAsyncMutex::new(vec![1, 2, 3]);
// {
//     let mut guard = mutex.lock().await;
//     guard.push(4);
// } // permit released here
```

**Key takeaway**: async mutexes are usually built on semaphores. The semaphore is what provides “wait asynchronously until the lock becomes available”.<br><span class="zh-inline">**核心收获：** 异步 mutex 底层通常就是信号量。真正提供“等锁可用时挂起任务而不是阻塞线程”能力的，正是信号量这一层。</span>

> **Why `UnsafeCell` and not `std::sync::Mutex`?** A previous version of this exercise used `Arc<Mutex<T>>` and then tried to expose `&T` / `&mut T` through `Deref`. That fails because the references would borrow from a temporary `MutexGuard` that gets dropped immediately. `UnsafeCell` removes that temporary guard layer, while semaphore-based serialization keeps the `unsafe` sound.<br><span class="zh-inline">**为什么这里用 `UnsafeCell`，而不是 `std::sync::Mutex`？** 之前一种更直觉的写法是 `Arc&lt;Mutex&lt;T&gt;&gt;` 再配合 `Deref` / `DerefMut` 暴露 `&T` 和 `&mut T`。但那样不成立，因为引用会借自一个马上就被丢弃的临时 `MutexGuard`。`UnsafeCell` 去掉了这层临时 guard，而信号量串行化则保证了这段 `unsafe` 的合理性。</span>

</details>

---

### Exercise 5: Stream Pipeline<br><span class="zh-inline">练习 5：Stream 处理流水线</span>

Build a stream-based data pipeline that does the following:<br><span class="zh-inline">实现一条基于 stream 的数据处理流水线，要求完成下面这些步骤：</span>
1. Generate numbers `1..=100`<br><span class="zh-inline">生成 `1..=100` 的数字</span>
2. Keep only even numbers<br><span class="zh-inline">筛出偶数</span>
3. Square each value<br><span class="zh-inline">把每个值平方</span>
4. Process 10 items concurrently, using sleep to simulate async work<br><span class="zh-inline">每次并发处理 10 个，休眠可用于模拟异步工作</span>
5. Collect the results<br><span class="zh-inline">收集最终结果</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
use futures::stream::{self, StreamExt};
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let results: Vec<u64> = stream::iter(1u64..=100)
        // Step 2: Filter evens
        .filter(|x| futures::future::ready(x % 2 == 0))
        // Step 3: Square each
        .map(|x| x * x)
        // Step 4: Process concurrently (simulate async work)
        .map(|x| async move {
            sleep(Duration::from_millis(50)).await;
            println!("Processed: {x}");
            x
        })
        .buffer_unordered(10) // 10 concurrent
        // Step 5: Collect
        .collect()
        .await;

    println!("Got {} results", results.len());
    println!("Sum: {}", results.iter().sum::<u64>());
}
```

This exercise is useful because it compresses several common stream operations into one place: filtering, mapping, async fan-out, and collection.<br><span class="zh-inline">这个练习很值，因为它把 stream 里最常见的几类操作一次串齐了：过滤、映射、异步扇出，以及收集结果。</span>

</details>

---

### Exercise 6: Implement Select with Timeout<br><span class="zh-inline">练习 6：实现带超时的 Select</span>

Without using `tokio::select!` or `tokio::time::timeout`, implement a function that races a future against a deadline and returns `Either::Left(result)` or `Either::Right(())` when time runs out.<br><span class="zh-inline">在不使用 `tokio::select!` 和 `tokio::time::timeout` 的前提下，实现一个函数，让某个 future 和截止时间赛跑，并在成功时返回 `Either::Left(result)`，超时时返回 `Either::Right(())`。</span>

*Hint*: Build it on top of the `Select` combinator and `TimerFuture` from Chapter 6.<br><span class="zh-inline">*提示*：可以直接建立在第 6 章的 `Select` 组合子和 `TimerFuture` 之上。</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust,ignore
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::Duration;

pub enum Either<A, B> {
    Left(A),
    Right(B),
}

pub struct Timeout<F> {
    future: F,
    timer: TimerFuture, // From Chapter 6
}

impl<F: Future + Unpin> Timeout<F> {
    pub fn new(future: F, duration: Duration) -> Self {
        Timeout {
            future,
            timer: TimerFuture::new(duration),
        }
    }
}

impl<F: Future + Unpin> Future for Timeout<F> {
    type Output = Either<F::Output, ()>;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        // Check if the main future is done
        if let Poll::Ready(val) = Pin::new(&mut self.future).poll(cx) {
            return Poll::Ready(Either::Left(val));
        }

        // Check if the timer expired
        if let Poll::Ready(()) = Pin::new(&mut self.timer).poll(cx) {
            return Poll::Ready(Either::Right(()));
        }

        Poll::Pending
    }
}

// Usage:
// match Timeout::new(fetch_data(), Duration::from_secs(5)).await {
//     Either::Left(data) => println!("Got data: {data}"),
//     Either::Right(()) => println!("Timed out!"),
// }
```

**Key takeaway**: `select` and `timeout` are conceptually simple. They are both just “poll two futures and see which one finishes first”. A surprising amount of async infrastructure is built from that one primitive idea.<br><span class="zh-inline">**核心收获：** `select` 和 `timeout` 在概念上其实很朴素，本质都是“把两个 future 一起 poll，看谁先结束”。异步生态里一大堆看起来高级的能力，往下拆最后就是这个原语。</span>

</details>

***
