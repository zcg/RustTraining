# 5. Channels and Message Passing 🟢<br><span class="zh-inline">5. Channel 与消息传递 🟢</span>

> **What you'll learn:**<br><span class="zh-inline">**本章将学到什么：**</span>
> - `std::sync::mpsc` basics and when to upgrade to crossbeam-channel<br><span class="zh-inline">`std::sync::mpsc` 的基础用法，以及什么时候该升级到 `crossbeam-channel`</span>
> - Channel selection with `select!` for multi-source message handling<br><span class="zh-inline">如何用 `select!` 同时处理多个消息来源</span>
> - Bounded vs unbounded channels and backpressure strategies<br><span class="zh-inline">有界与无界 channel 的区别，以及背压策略</span>
> - The actor pattern for encapsulating concurrent state<br><span class="zh-inline">如何用 actor 模式封装并发状态</span>

## std::sync::mpsc — The Standard Channel<br><span class="zh-inline">`std::sync::mpsc`：标准库自带的 channel</span>

Rust's standard library provides a multi-producer, single-consumer channel:<br><span class="zh-inline">Rust 标准库提供了一套多生产者、单消费者的 channel：</span>

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    // Create a channel: tx (transmitter) and rx (receiver)
    let (tx, rx) = mpsc::channel();

    // Spawn a producer thread
    let tx1 = tx.clone(); // Clone for multiple producers
    thread::spawn(move || {
        for i in 0..5 {
            tx1.send(format!("producer-1: msg {i}")).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
    });

    // Second producer
    thread::spawn(move || {
        for i in 0..5 {
            tx.send(format!("producer-2: msg {i}")).unwrap();
            thread::sleep(Duration::from_millis(150));
        }
    });

    // Consumer: receive all messages
    for msg in rx {
        // rx iterator ends when ALL senders are dropped
        println!("Received: {msg}");
    }
    println!("All producers done.");
}
```

这个模型非常直观：发送端往里塞消息，接收端顺着 `rx` 把消息一个个取出来。只要还有任何一个 `Sender` 活着，接收端就会认为后面还有可能来消息。<br><span class="zh-inline">所以很多新手程序一挂住，往往不是 channel 坏了，而是某个 `Sender` 忘了 drop，接收端还在傻等。</span>

**Key properties**:<br><span class="zh-inline">**几个关键特性：**</span>

- **Unbounded** by default (can fill memory if consumer is slow)<br><span class="zh-inline">默认是**无界**的，如果消费者太慢，内存会一路涨上去。</span>
- `mpsc::sync_channel(N)` creates a **bounded** channel with backpressure<br><span class="zh-inline">`mpsc::sync_channel(N)` 可以创建**有界** channel，自带背压。</span>
- `rx.recv()` blocks the current thread until a message arrives<br><span class="zh-inline">`rx.recv()` 会阻塞当前线程，直到有消息到来。</span>
- `rx.try_recv()` returns immediately with `Err(TryRecvError::Empty)` if nothing is ready<br><span class="zh-inline">`rx.try_recv()` 会立即返回；如果当前没消息，就给出 `Err(TryRecvError::Empty)`。</span>
- The channel closes when all `Sender`s are dropped<br><span class="zh-inline">所有 `Sender` 都被释放后，channel 才真正关闭。</span>

```rust
// Bounded channel with backpressure:
let (tx, rx) = mpsc::sync_channel(10); // Buffer of 10 messages

thread::spawn(move || {
    for i in 0..1000 {
        tx.send(i).unwrap(); // BLOCKS if buffer is full — natural backpressure
    }
});
```

这里的背压非常朴素也非常实用。缓冲区满了，`send()` 就阻塞，生产者自然慢下来。系统不会假装“一切都能先收下再说”，然后把内存撑爆。<br><span class="zh-inline">很多生产事故说到底就一句话：本该有界的地方写成了无界。</span>

### crossbeam-channel — The Production Workhorse<br><span class="zh-inline">`crossbeam-channel`：生产环境里的主力选手</span>

`crossbeam-channel` is the de facto standard for production channel usage. It's faster than `std::sync::mpsc` and supports multi-consumer (`mpmc`):<br><span class="zh-inline">在生产环境里，`crossbeam-channel` 基本已经成了事实标准。它比 `std::sync::mpsc` 更快，也支持真正的多生产者多消费者模型，也就是 `mpmc`：</span>

```rust,ignore
// Cargo.toml:
//   [dependencies]
//   crossbeam-channel = "0.5"
use crossbeam_channel::{bounded, unbounded, select, Sender, Receiver};
use std::thread;
use std::time::Duration;

fn main() {
    // Bounded MPMC channel
    let (tx, rx) = bounded::<String>(100);

    // Multiple producers
    for id in 0..4 {
        let tx = tx.clone();
        thread::spawn(move || {
            for i in 0..10 {
                tx.send(format!("worker-{id}: item-{i}")).unwrap();
            }
        });
    }
    drop(tx); // Drop the original sender so the channel can close

    // Multiple consumers (not possible with std::sync::mpsc!)
    let rx2 = rx.clone();
    let consumer1 = thread::spawn(move || {
        while let Ok(msg) = rx.recv() {
            println!("[consumer-1] {msg}");
        }
    });
    let consumer2 = thread::spawn(move || {
        while let Ok(msg) = rx2.recv() {
            println!("[consumer-2] {msg}");
        }
    });

    consumer1.join().unwrap();
    consumer2.join().unwrap();
}
```

标准库版 `mpsc` 在简单项目里完全够用，但只要开始认真处理吞吐、多消费者、超时控制和组合式等待，`crossbeam-channel` 的手感就会明显更成熟。<br><span class="zh-inline">这不是“为了高级而高级”，而是生态已经把很多真实需求都踩透了，用起来省心不少。</span>

### Channel Selection (`select!`)<br><span class="zh-inline">多路等待：`select!`</span>

Listen on multiple channels simultaneously — like `select` in Go:<br><span class="zh-inline">如果需要同时监听多个 channel，可以用 `select!`。这个东西和 Go 里的 `select` 很像：</span>

```rust,ignore
use crossbeam_channel::{bounded, tick, after, select};
use std::time::Duration;

fn main() {
    let (work_tx, work_rx) = bounded::<String>(10);
    let ticker = tick(Duration::from_secs(1));        // Periodic tick
    let deadline = after(Duration::from_secs(10));     // One-shot timeout

    // Producer
    let tx = work_tx.clone();
    std::thread::spawn(move || {
        for i in 0..100 {
            tx.send(format!("job-{i}")).unwrap();
            std::thread::sleep(Duration::from_millis(500));
        }
    });
    drop(work_tx);

    loop {
        select! {
            recv(work_rx) -> msg => {
                match msg {
                    Ok(job) => println!("Processing: {job}"),
                    Err(_) => {
                        println!("Work channel closed");
                        break;
                    }
                }
            },
            recv(ticker) -> _ => {
                println!("Tick — heartbeat");
            },
            recv(deadline) -> _ => {
                println!("Deadline reached — shutting down");
                break;
            },
        }
    }
}
```

这类代码如果手写成轮询加睡眠，基本都会很丑，也容易漏边界情况。`select!` 把“多个来源谁先到就处理谁”这件事写成声明式结构，读起来顺得多。<br><span class="zh-inline">在服务程序里，它特别适合同时处理工作消息、心跳、超时和关闭信号。</span>

> **Go comparison**: This is exactly like Go's `select` statement over channels. crossbeam's `select!` macro randomizes order to prevent starvation, just like Go.<br><span class="zh-inline">**和 Go 的对照：** 这基本就是 Go `select` 的 Rust 版。`crossbeam` 的 `select!` 也会打乱子句顺序，尽量避免固定顺序带来的饥饿问题。</span>

### Bounded vs Unbounded and Backpressure<br><span class="zh-inline">有界、无界与背压</span>

| Type<br><span class="zh-inline">类型</span> | Behavior When Full<br><span class="zh-inline">满了之后会怎样</span> | Memory<br><span class="zh-inline">内存表现</span> | Use Case<br><span class="zh-inline">适用场景</span> |
|------|-------------------|--------|----------|
| **Unbounded**<br><span class="zh-inline">无界</span> | Never blocks (grows heap)<br><span class="zh-inline">永远不阻塞，但会一直涨堆内存</span> | Unbounded ⚠️<br><span class="zh-inline">无上限 ⚠️</span> | Rare — only when producer is slower than consumer<br><span class="zh-inline">很少用，只适合能确认生产者永远慢于消费者的场景</span> |
| **Bounded**<br><span class="zh-inline">有界</span> | `send()` blocks until space<br><span class="zh-inline">`send()` 会阻塞，直到有空位</span> | Fixed<br><span class="zh-inline">固定上限</span> | Production default — prevents OOM<br><span class="zh-inline">生产环境默认选择，能防止内存打爆</span> |
| **Rendezvous** (bounded(0))<br><span class="zh-inline">会合型（`bounded(0)`）</span> | `send()` blocks until receiver is ready<br><span class="zh-inline">接收端没准备好，发送端就一直等</span> | None<br><span class="zh-inline">几乎不占缓冲</span> | Synchronization / handoff<br><span class="zh-inline">精确同步、直接交接</span> |

```rust
// Rendezvous channel — zero capacity, direct handoff
let (tx, rx) = crossbeam_channel::bounded(0);
// tx.send(x) blocks until rx.recv() is called, and vice versa.
// This synchronizes the two threads precisely.
```

**Rule**: Always use bounded channels in production unless you can prove the producer will never outpace the consumer.<br><span class="zh-inline">**经验规则：** 生产环境优先使用有界 channel。除非能明确证明生产者绝对追不上消费者，否则别轻易上无界版本。</span>

这条规矩真不是矫情。无界 channel 用起来确实爽，问题是它把压力延迟成了内存问题。表面上消息都塞进去了，实际只是把故障从“现在阻塞”改成了“过会儿爆炸”。<br><span class="zh-inline">有界 channel 至少会诚实地把系统压力表现出来。</span>

### Actor Pattern with Channels<br><span class="zh-inline">用 channel 实现 actor 模式</span>

The actor pattern uses channels to serialize access to mutable state — no mutexes needed:<br><span class="zh-inline">actor 模式会把可变状态收口到一个专门的执行体里，外界通过消息和它通信。这样就能把“共享可变”变成“串行处理消息”，很多情况下连 mutex 都省了：</span>

```rust
use std::sync::mpsc;
use std::thread;

// Messages the actor can receive
enum CounterMsg {
    Increment,
    Decrement,
    Get(mpsc::Sender<i64>), // Reply channel
}

struct CounterActor {
    count: i64,
    rx: mpsc::Receiver<CounterMsg>,
}

impl CounterActor {
    fn new(rx: mpsc::Receiver<CounterMsg>) -> Self {
        CounterActor { count: 0, rx }
    }

    fn run(mut self) {
        while let Ok(msg) = self.rx.recv() {
            match msg {
                CounterMsg::Increment => self.count += 1,
                CounterMsg::Decrement => self.count -= 1,
                CounterMsg::Get(reply) => {
                    let _ = reply.send(self.count);
                }
            }
        }
    }
}

// Actor handle — cheap to clone, Send + Sync
#[derive(Clone)]
struct Counter {
    tx: mpsc::Sender<CounterMsg>,
}

impl Counter {
    fn spawn() -> Self {
        let (tx, rx) = mpsc::channel();
        thread::spawn(move || CounterActor::new(rx).run());
        Counter { tx }
    }

    fn increment(&self) { let _ = self.tx.send(CounterMsg::Increment); }
    fn decrement(&self) { let _ = self.tx.send(CounterMsg::Decrement); }

    fn get(&self) -> i64 {
        let (reply_tx, reply_rx) = mpsc::channel();
        self.tx.send(CounterMsg::Get(reply_tx)).unwrap();
        reply_rx.recv().unwrap()
    }
}

fn main() {
    let counter = Counter::spawn();

    // Multiple threads can safely use the counter — no mutex!
    let handles: Vec<_> = (0..10).map(|_| {
        let counter = counter.clone();
        thread::spawn(move || {
            for _ in 0..1000 {
                counter.increment();
            }
        })
    }).collect();

    for h in handles { h.join().unwrap(); }
    println!("Final count: {}", counter.get()); // 10000
}
```

actor 的核心优势，是把状态不变量关进一个单线程小房间里。外面谁都不能乱摸，只能发消息进去。<br><span class="zh-inline">如果状态逻辑复杂、操作持续时间长、或者一堆锁顺序想起来头皮发麻，那 actor 往往比 mutex 更容易维护。</span>

> **When to use actors vs mutexes**: Actors are great when the state has complex invariants, operations take a long time, or you want to serialize access without thinking about lock ordering. Mutexes are simpler for short critical sections.<br><span class="zh-inline">**什么时候用 actor，什么时候用 mutex：** 如果状态约束复杂、操作时间长、或者访问顺序很难梳理，actor 更省脑子。要是只是很短的小临界区，mutex 往往更直接。</span>

> **Key Takeaways — Channels**<br><span class="zh-inline">**本章要点：Channel**</span>
> - `crossbeam-channel` is the production workhorse — faster and more feature-rich than `std::sync::mpsc`<br><span class="zh-inline">`crossbeam-channel` 是生产环境里的主力，比 `std::sync::mpsc` 更快、功能也更全。</span>
> - `select!` replaces complex multi-source polling with declarative channel selection<br><span class="zh-inline">`select!` 能把复杂的多源等待写成更清晰的声明式结构。</span>
> - Bounded channels provide natural backpressure; unbounded channels risk OOM<br><span class="zh-inline">有界 channel 会自然提供背压；无界 channel 则存在内存失控风险。</span>

> **See also:** [Ch 6 — Concurrency](ch06-concurrency-vs-parallelism-vs-threads.md) for threads, Mutex, and shared state. [Ch 15 — Async](ch15-asyncawait-essentials.md) for async channels (`tokio::sync::mpsc`).<br><span class="zh-inline">**继续阅读：** [第 6 章：并发](ch06-concurrency-vs-parallelism-vs-threads.md) 会继续讲线程、Mutex 和共享状态；[第 15 章：Async](ch15-asyncawait-essentials.md) 会讲异步版 channel，例如 `tokio::sync::mpsc`。</span>

---

### Exercise: Channel-Based Worker Pool ★★★ (~45 min)<br><span class="zh-inline">练习：基于 channel 的 worker pool ★★★（约 45 分钟）</span>

Build a worker pool using channels where:<br><span class="zh-inline">用 channel 写一个 worker pool，要求如下：</span>

- A dispatcher sends `Job` structs through a channel<br><span class="zh-inline">调度器通过 channel 发送 `Job` 结构体。</span>
- N workers consume jobs and send results back<br><span class="zh-inline">N 个 worker 负责消费任务，再把结果发回去。</span>
- Use `std::sync::mpsc` with `Arc<Mutex<Receiver>>` for work-stealing<br><span class="zh-inline">使用 `std::sync::mpsc`，并通过 `Arc<Mutex<Receiver>>` 实现共享取任务。</span>

<details>
<summary>🔑 Solution <span class="zh-inline">🔑 参考答案</span></summary>

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
                            job_id: job.id, output, worker_id,
                        }).unwrap();
                    }
                    Err(_) => break,
                }
            }
        }));
    }
    drop(result_tx);

    let num_jobs = jobs.len();
    for job in jobs {
        job_tx.send(job).unwrap();
    }
    drop(job_tx);

    let results: Vec<_> = result_rx.into_iter().collect();
    assert_eq!(results.len(), num_jobs);

    for h in handles { h.join().unwrap(); }
    results
}

fn main() {
    let jobs: Vec<Job> = (0..20).map(|i| Job {
        id: i, data: format!("task-{i}"),
    }).collect();

    let results = worker_pool(jobs, 4);
    for r in &results {
        println!("[worker {}] job {}: {}", r.worker_id, r.job_id, r.output);
    }
}
```

这个实现的关键点在于：任务接收端只有一个，所以要用 `Arc<Mutex<Receiver<_>>>` 让多个 worker 轮流从同一个入口取任务。<br><span class="zh-inline">它不是最优雅的生产实现，但作为练习特别好，因为能把 channel、线程和同步边界一次性练明白。</span>

</details>

***
