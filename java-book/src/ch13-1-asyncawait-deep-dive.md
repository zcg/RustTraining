## Async Programming: `CompletableFuture` vs Rust `Future`

> **What you'll learn:** The runtime model behind Rust async, how it differs from Java's eager futures, and which patterns correspond to `CompletableFuture`, executors, and timeouts.
>
> **Difficulty:** 🔴 Advanced

Rust and Java both talk about futures, but the execution model is not the same.

## The First Big Difference: Rust Futures Are Lazy

```java
CompletableFuture<String> future =
    CompletableFuture.supplyAsync(() -> fetchFromRemote());
```

That Java future starts work as soon as it is scheduled on an executor.

```rust
async fn fetch_from_remote() -> String {
    "done".to_string()
}

let future = fetch_from_remote();
// nothing happens yet
let value = future.await;
```

In Rust, creating the future does not start execution. Polling by an executor starts progress.

## Why Tokio Exists

Java ships with threads, executors, and a rich runtime by default. Rust does not include a default async runtime in the language. That is why libraries such as Tokio exist.

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

The runtime owns the scheduler, timers, IO drivers, and task system.

## Mental Mapping

| Java | Rust |
|---|---|
| `CompletableFuture<T>` | `Future<Output = T>` |
| `ExecutorService` | Tokio runtime or another async executor |
| `CompletableFuture.allOf(...)` | `join!` or `try_join!` |
| `orTimeout(...)` | `tokio::time::timeout(...)` |
| cancellation | dropping the future or explicit cancellation primitives |

## Concurrency Pattern: Wait for Many Tasks

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

Rust keeps the control flow flatter. The combined result is often easier to read because `.await` and `join!` look like normal program structure instead of chained callbacks.

## Timeouts and Cancellation

```rust
use std::time::Duration;

let result = tokio::time::timeout(Duration::from_secs(2), fetch_user(42)).await;
```

When a future is dropped, its work is cancelled unless it was explicitly spawned elsewhere. That is a major conceptual difference from Java code that assumes executor-managed tasks continue until completion.

## Spawning Background Work

```rust
let handle = tokio::spawn(async move {
    expensive_job().await
});

let value = handle.await.unwrap();
```

This is the closest match to scheduling work on an executor and retrieving the result later.

## Practical Advice for Java Developers

- Learn the difference between “constructing a future” and “driving a future”.
- Reach for `join!`, `select!`, and `timeout` early; they cover most day-one patterns.
- Be careful with blocking APIs inside async code. Use dedicated blocking pools when needed.
- Treat async Rust as a separate runtime model, not as Java async with different syntax.

Once this clicks, Rust async stops feeling mysterious and starts feeling mechanically predictable.
