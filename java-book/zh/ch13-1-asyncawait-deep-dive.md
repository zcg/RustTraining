## Async Programming: `CompletableFuture` vs Rust `Future`<br><span class="zh-inline">异步编程：`CompletableFuture` 与 Rust `Future`</span>

> **What you'll learn:** The runtime model behind Rust async, how it differs from Java's eager futures, and which patterns correspond to `CompletableFuture`, executors, and timeouts.<br><span class="zh-inline">**本章将学习：** Rust async 背后的运行时模型、它和 Java eager future 的区别，以及哪些模式分别对应 `CompletableFuture`、执行器和超时控制。</span>
>
> **Difficulty:** 🔴 Advanced<br><span class="zh-inline">**难度：** 🔴 高级</span>

Rust and Java both talk about futures, but the execution model is not the same.<br><span class="zh-inline">Rust 和 Java 都会讲 future，但两边的执行模型并不是一回事。</span>

## The First Big Difference: Rust Futures Are Lazy<br><span class="zh-inline">第一个大差异：Rust future 是惰性的</span>

```java
CompletableFuture<String> future =
    CompletableFuture.supplyAsync(() -> fetchFromRemote());
```

That Java future starts work as soon as it is scheduled on an executor.<br><span class="zh-inline">这类 Java future 一旦被执行器接管，任务就开始推进了。</span>

```rust
async fn fetch_from_remote() -> String {
    "done".to_string()
}

let future = fetch_from_remote();
// nothing happens yet
let value = future.await;
```

In Rust, creating the future does not start execution. Polling by an executor starts progress.<br><span class="zh-inline">在 Rust 里，光把 future 创建出来并不会自动执行。只有被执行器轮询之后，任务才会真正推进。</span>

## Why Tokio Exists<br><span class="zh-inline">为什么 Rust 里会有 Tokio</span>

Java ships with threads, executors, and a rich runtime by default. Rust does not include a default async runtime in the language. That is why libraries such as Tokio exist.<br><span class="zh-inline">Java 默认就带着线程、执行器和比较完整的运行时能力。Rust 语言本身没有默认 async 运行时，所以才会有 Tokio 这种库承担调度器、定时器和 IO 驱动的职责。</span>

```rust
#[tokio::main]
async fn main() {
    let body = reqwest::get("https://example.com")
        .await
        .unwrap()
        .text()
        .await
        .unwrap();

    println!("{body}");
}
```

The runtime owns the scheduler, timers, IO drivers, and task system.<br><span class="zh-inline">运行时负责调度器、定时器、IO 驱动和任务系统。</span>

## Mental Mapping<br><span class="zh-inline">心智映射表</span>

| Java | Rust |
|---|---|
| `CompletableFuture<T>` | `Future<Output = T>` |
| `ExecutorService` | Tokio runtime or another async executor<br><span class="zh-inline">Tokio 运行时或其他异步执行器</span> |
| `CompletableFuture.allOf(...)` | `join!` or `try_join!` |
| `orTimeout(...)` | `tokio::time::timeout(...)` |
| cancellation<br><span class="zh-inline">取消</span> | dropping the future or explicit cancellation primitives<br><span class="zh-inline">丢弃 future 或使用显式取消原语</span> |

## Concurrency Pattern: Wait for Many Tasks<br><span class="zh-inline">并发模式：等待多个任务</span>

```java
var userFuture = client.fetchUser(id);
var ordersFuture = client.fetchOrders(id);

var result = userFuture.thenCombine(ordersFuture, Combined::new);
```

```rust
let user = fetch_user(id);
let orders = fetch_orders(id);

let (user, orders) = tokio::join!(user, orders);
```

Rust keeps the control flow flatter. The combined result is often easier to read because `.await` and `join!` look like normal program structure instead of chained callbacks.<br><span class="zh-inline">Rust 通常会让控制流更平。`.await` 和 `join!` 看起来更像普通程序结构，而不是一串层层套下去的回调拼接。</span>

## Timeouts and Cancellation<br><span class="zh-inline">超时与取消</span>

```rust
use std::time::Duration;

let result = tokio::time::timeout(Duration::from_secs(2), fetch_user(42)).await;
```

When a future is dropped, its work is cancelled unless it was explicitly spawned elsewhere. That is a major conceptual difference from Java code that assumes executor-managed tasks continue until completion.<br><span class="zh-inline">如果一个 future 被丢弃，它的工作通常也就跟着取消，除非这份工作已经被显式 `spawn` 到别处。这和很多 Java 代码默认“交给执行器之后它会自己跑完”的思路差别很大。</span>

## Spawning Background Work<br><span class="zh-inline">派生后台任务</span>

```rust
let handle = tokio::spawn(async move {
    expensive_job().await
});

let value = handle.await.unwrap();
```

This is the closest match to scheduling work on an executor and retrieving the result later.<br><span class="zh-inline">这和把任务提交给执行器、稍后再取结果的思路最接近。</span>

## Practical Advice for Java Developers<br><span class="zh-inline">给 Java 开发者的实际建议</span>

- Learn the difference between “constructing a future” and “driving a future”.<br><span class="zh-inline">先把“创建 future”和“驱动 future 执行”这两个动作彻底分开。</span>
- Reach for `join!`, `select!`, and `timeout` early; they cover most day-one patterns.<br><span class="zh-inline">尽早熟悉 `join!`、`select!`、`timeout`，入门阶段的大多数模式都离不开它们。</span>
- Be careful with blocking APIs inside async code. Use dedicated blocking pools when needed.<br><span class="zh-inline">在 async 代码里要小心阻塞 API，确实要阻塞时就切到专门的阻塞线程池。</span>
- Treat async Rust as a separate runtime model, not as Java async with different syntax.<br><span class="zh-inline">把 async Rust 当成一套独立运行时模型来看，不要把它当成“只是语法不同的 Java async”。</span>

Once this clicks, Rust async stops feeling mysterious and starts feeling mechanically predictable.<br><span class="zh-inline">这层一旦想通，Rust async 就不会再显得玄乎，反而会变得非常机械、非常可预测。</span>
