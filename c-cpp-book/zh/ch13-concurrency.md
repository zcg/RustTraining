# Rust concurrency<br><span class="zh-inline">Rust 并发</span>

> **What you'll learn:** Rust's concurrency model, including threads, `Send` / `Sync` marker traits, `Mutex<T>`、`Arc<T>`、channels and the way the compiler prevents data races at compile time. The key theme is that Rust charges for synchronization only when the code actually needs it.<br><span class="zh-inline">**本章将学到什么：** Rust 的并发模型，包括线程、`Send` / `Sync` 标记 trait、`Mutex<T>`、`Arc<T>`、channel，以及编译器如何在编译期阻止数据竞争。核心主题是：只有真正需要同步的时候，Rust 才会让代码付出对应成本。</span>

- Rust has built-in support for concurrency, similar in spirit to C++ `std::thread`.<br><span class="zh-inline">Rust 对并发有原生支持，整体气质上和 C++ 的 `std::thread` 是同一类工具。</span>
    - The major difference is that Rust rejects many unsafe sharing patterns at compile time through `Send` and `Sync`.<br><span class="zh-inline">最大的差异在于：Rust 会借助 `Send` 和 `Sync` 在编译期直接拒绝很多危险共享模式。</span>
    - In C++, sharing a `std::vector` across threads without synchronization compiles and becomes undefined behavior at runtime. In Rust, the same shape of code simply does not type-check.<br><span class="zh-inline">在 C++ 里，不加同步就把 `std::vector` 跨线程共享，代码照样能编，出事全靠运行时；Rust 则会在类型检查阶段直接拦住。</span>
    - `Mutex<T>` in Rust wraps the protected data itself, so you cannot even access the value without going through the lock guard.<br><span class="zh-inline">Rust 的 `Mutex<T>` 不是光包一把锁，而是连数据本体一起包起来，想碰数据就必须先拿到锁 guard。</span>

### Spawning threads<br><span class="zh-inline">创建线程</span>

`thread::spawn()` launches a new thread and runs a closure on it in parallel.<br><span class="zh-inline">`thread::spawn()` 会拉起一个新线程，并在这个线程里并行执行闭包。</span>

```rust
use std::thread;
use std::time::Duration;
fn main() {
    let handle = thread::spawn(|| {
        for i in 0..10 {
            println!("Count in thread: {i}!");
            thread::sleep(Duration::from_millis(5));
        }
    });

    for i in 0..5 {
        println!("Main thread: {i}");
        thread::sleep(Duration::from_millis(5));
    }

    handle.join().unwrap(); // The handle.join() ensures that the spawned thread exits
}
```

### Borrowing into scoped threads<br><span class="zh-inline">把借用带进受限作用域线程</span>

- `thread::scope()` is useful when a spawned thread needs to borrow data from the surrounding stack frame.<br><span class="zh-inline">如果线程需要借用外层栈上的数据，`thread::scope()` 就特别有用。</span>
- It works because `thread::scope()` waits until all inner threads finish before the borrowed data can go out of scope.<br><span class="zh-inline">它之所以安全，是因为 `thread::scope()` 会在内部线程全部结束之后才退出，所以借用对象不会提前死亡。</span>

```rust
use std::thread;
fn main() {
  let a = [0, 1, 2];
  thread::scope(|scope| {
      scope.spawn(|| {
          for x in &a {
            println!("{x}");
          }
      });
  });
}
```

Try removing `thread::scope()` and replacing this with a plain `thread::spawn()`. The compiler will immediately complain, because the borrow would no longer be guaranteed to outlive the spawned thread.<br><span class="zh-inline">可以自己试着把 `thread::scope()` 去掉，改成普通 `thread::spawn()`。编译器会立刻报错，因为那样一来，借用值就不一定能活过新线程了。</span>

----

## Moving data into threads<br><span class="zh-inline">把数据 move 进线程</span>

- `move` transfers ownership into the thread closure. For `Copy` types such as `[i32; 3]`, this behaves like a copy; for non-`Copy` values, the original binding is consumed.<br><span class="zh-inline">`move` 会把所有权转移进线程闭包。对于 `[i32; 3]` 这种 `Copy` 类型，看起来更像复制；对于非 `Copy` 类型，原变量则会被真正消费掉。</span>

```rust
use std::thread;
fn main() {
  let mut a = [0, 1, 2];
  let handle = thread::spawn(move || {
      for x in a {
        println!("{x}");
      }
  });
  a[0] = 42;    // Doesn't affect the copy sent to the thread
  handle.join().unwrap();
}
```

### Sharing read-only data with `Arc<T>`<br><span class="zh-inline">用 `Arc<T>` 共享只读数据</span>

- `Arc<T>` is the standard way to share read-only ownership across threads.<br><span class="zh-inline">`Arc<T>` 是跨线程共享只读所有权的标准工具。</span>
    - `Arc` means Atomic Reference Counted.<br><span class="zh-inline">`Arc` 的全名就是 Atomic Reference Counted。</span>
    - `Arc::clone()` only increments the reference count; it does not deep-copy the underlying data.<br><span class="zh-inline">`Arc::clone()` 只是把引用计数加一，不会深拷贝底层数据。</span>

```rust
use std::sync::Arc;
use std::thread;
fn main() {
    let a = Arc::new([0, 1, 2]);
    let mut handles = Vec::new();
    for i in 0..2 {
        let arc = Arc::clone(&a);
        handles.push(thread::spawn(move || {
            println!("Thread: {i} {arc:?}");
        }));
    }
    handles.into_iter().for_each(|h| h.join().unwrap());
}
```

### Sharing mutable data with `Arc<Mutex<T>>`<br><span class="zh-inline">用 `Arc<Mutex<T>>` 共享可变数据</span>

- `Arc<T>` plus `Mutex<T>` is the standard combination for mutable shared state across threads.<br><span class="zh-inline">跨线程共享可变状态时，最常见的标准组合就是 `Arc<T>` 配 `Mutex<T>`。</span>
    - The `MutexGuard` returned by `lock()` releases automatically when it goes out of scope.<br><span class="zh-inline">`lock()` 返回的 `MutexGuard` 一离开作用域就会自动释放锁。</span>
    - This is still RAII, just applied to synchronization instead of only memory management.<br><span class="zh-inline">这仍然是 RAII，只不过这次管理的不是堆内存，而是同步资源。</span>

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = Vec::new();

    for _ in 0..5 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
            // MutexGuard dropped here — lock released automatically
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", *counter.lock().unwrap());
    // Output: Final count: 5
}
```

### `RwLock<T>` for read-heavy sharing<br><span class="zh-inline">读多写少时用 `RwLock<T>`</span>

- `RwLock<T>` allows many readers or one writer, which matches the same read/write lock pattern as C++ `std::shared_mutex`.<br><span class="zh-inline">`RwLock<T>` 允许多个读者同时存在，或者单个写者独占，这和 C++ 的 `std::shared_mutex` 是同一类模式。</span>
- Use it when reads vastly outnumber writes, such as configuration snapshots or caches.<br><span class="zh-inline">当读取明显多于写入时，比如配置快照、缓存这类场景，`RwLock` 往往更合适。</span>

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let config = Arc::new(RwLock::new(String::from("v1.0")));
    let mut handles = Vec::new();

    // Spawn 5 readers — all can run concurrently
    for i in 0..5 {
        let config = Arc::clone(&config);
        handles.push(thread::spawn(move || {
            let val = config.read().unwrap();  // Multiple readers OK
            println!("Reader {i}: {val}");
        }));
    }

    // One writer — blocks until all readers finish
    {
        let config = Arc::clone(&config);
        handles.push(thread::spawn(move || {
            let mut val = config.write().unwrap();  // Exclusive access
            *val = String::from("v2.0");
            println!("Writer: updated to {val}");
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

### Mutex poisoning<br><span class="zh-inline">`Mutex` 中毒</span>

- If a thread panics while holding a `Mutex` or `RwLock`, the lock becomes poisoned.<br><span class="zh-inline">如果线程在持有 `Mutex` 或 `RwLock` 时 panic，这把锁就会变成 poisoned 状态。</span>
    - Later `lock()` calls return `Err(PoisonError)` because the protected data may now be inconsistent.<br><span class="zh-inline">后续再去 `lock()`，就会得到 `Err(PoisonError)`，因为受保护的数据可能已经处于不一致状态。</span>
    - If the caller knows the value is still usable, it can recover through `.into_inner()`.<br><span class="zh-inline">如果调用方很确定数据其实还可以继续用，也能通过 `.into_inner()` 把它抢回来。</span>
    - C++ `std::mutex` has no equivalent poisoning concept.<br><span class="zh-inline">C++ 的 `std::mutex` 没有这层“中毒”概念。</span>

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));

    let data2 = Arc::clone(&data);
    let handle = thread::spawn(move || {
        let mut guard = data2.lock().unwrap();
        guard.push(4);
        panic!("oops!");  // Lock is now poisoned
    });

    let _ = handle.join();  // Thread panicked

    match data.lock() {
        Ok(guard) => println!("Data: {guard:?}"),
        Err(poisoned) => {
            println!("Lock was poisoned! Recovering...");
            let guard = poisoned.into_inner();
            println!("Recovered data: {guard:?}");
        }
    }
}
```

### Atomics for simple shared state<br><span class="zh-inline">简单共享状态时用原子类型</span>

- For counters, flags, and other tiny shared states, `std::sync::atomic` avoids the overhead of a `Mutex`.<br><span class="zh-inline">如果只是共享计数器、标志位之类很小的状态，`std::sync::atomic` 往往比 `Mutex` 更合适。</span>
    - `AtomicBool`、`AtomicU64`、`AtomicUsize` and friends are roughly analogous to C++ `std::atomic<T>`.<br><span class="zh-inline">`AtomicBool`、`AtomicU64`、`AtomicUsize` 这些类型，整体上可以类比 C++ 的 `std::atomic<T>`。</span>
    - The same memory ordering vocabulary appears here too: `Relaxed`、`Acquire`、`Release`、`SeqCst`。<br><span class="zh-inline">这里也会遇到同一套内存序词汇：`Relaxed`、`Acquire`、`Release`、`SeqCst`。</span>

```rust
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let counter = Arc::new(AtomicU64::new(0));
    let mut handles = Vec::new();

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                counter.fetch_add(1, Ordering::Relaxed);
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Counter: {}", counter.load(Ordering::SeqCst));
    // Output: Counter: 10000
}
```

| Primitive | When to use<br><span class="zh-inline">什么时候用</span> | C++ equivalent |
|-----------|-------------|----------------|
| `Mutex<T>` | General mutable shared state<br><span class="zh-inline">通用可变共享状态</span> | `std::mutex` + manually associated data |
| `RwLock<T>` | Read-heavy workloads<br><span class="zh-inline">读多写少</span> | `std::shared_mutex` |
| `Atomic*` | Counters, flags, lock-free basics<br><span class="zh-inline">计数器、标志位、简单无锁场景</span> | `std::atomic<T>` |
| `Condvar` | Wait for a condition to change<br><span class="zh-inline">等待条件变化</span> | `std::condition_variable` |

### `Condvar` for waiting on shared state<br><span class="zh-inline">用 `Condvar` 等待共享状态变化</span>

- `Condvar` lets one thread sleep until another thread signals that some condition has changed.<br><span class="zh-inline">`Condvar` 让一个线程睡下去，直到另一个线程发出“条件已经变化”的信号。</span>
    - It is always paired with a `Mutex`.<br><span class="zh-inline">它总是和 `Mutex` 搭配使用。</span>
    - The usual pattern is: lock, check condition, wait if not ready, re-check after waking.<br><span class="zh-inline">惯用套路就是：先加锁、检查条件、不满足就等待、醒来后重新检查。</span>
    - Just like in C++, spurious wakeups exist, so waiting should happen in a loop or through helpers such as `wait_while()`.<br><span class="zh-inline">和 C++ 一样，这里也要考虑虚假唤醒，所以等待动作通常放在循环里，或者用 `wait_while()` 这种辅助方法。</span>

```rust
use std::sync::{Arc, Condvar, Mutex};
use std::thread;

fn main() {
    let pair = Arc::new((Mutex::new(false), Condvar::new()));

    let pair2 = Arc::clone(&pair);
    let worker = thread::spawn(move || {
        let (lock, cvar) = &*pair2;
        let mut ready = lock.lock().unwrap();
        while !*ready {
            ready = cvar.wait(ready).unwrap();
        }
        println!("Worker: condition met, proceeding!");
    });

    thread::sleep(std::time::Duration::from_millis(100));
    {
        let (lock, cvar) = &*pair;
        let mut ready = lock.lock().unwrap();
        *ready = true;
        cvar.notify_one();
    }

    worker.join().unwrap();
}
```

> **Condvar vs channels:** Use `Condvar` when several threads share mutable state and need to wait for a condition on that state, such as “buffer is no longer empty”. Use channels when the real problem is passing messages from one thread to another.<br><span class="zh-inline">**`Condvar` 和 channel 怎么选：** 如果多个线程围着同一份共享状态转，只是在等它满足某个条件，比如“缓冲区不再为空”，那就用 `Condvar`。如果核心需求是在线程之间传消息，那就用 channel。</span>

### Channels for message passing<br><span class="zh-inline">用 channel 传递消息</span>

- Rust channels connect `Sender` and `Receiver` ends and support the classic `mpsc` pattern: multi-producer, single-consumer.<br><span class="zh-inline">Rust 的 channel 由 `Sender` 和 `Receiver` 两端组成，支持经典的 `mpsc` 模式，也就是多生产者、单消费者。</span>
- Both `send()` and `recv()` may block depending on the state of the channel.<br><span class="zh-inline">`send()` 和 `recv()` 都可能根据 channel 状态发生阻塞。</span>

```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
    
    tx.send(10).unwrap();
    tx.send(20).unwrap();
    
    println!("Received: {:?}", rx.recv());
    println!("Received: {:?}", rx.recv());

    let tx2 = tx.clone();
    tx2.send(30).unwrap();
    println!("Received: {:?}", rx.recv());
}
```

### Combining channels with threads<br><span class="zh-inline">把 channel 和线程组合起来</span>

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();
    for _ in 0..2 {
        let tx2 = tx.clone();
        thread::spawn(move || {
            let thread_id = thread::current().id();
            for i in 0..10 {
                tx2.send(format!("Message {i}")).unwrap();
                println!("{thread_id:?}: sent Message {i}");
            }
            println!("{thread_id:?}: done");
        });
    }

    drop(tx);

    thread::sleep(Duration::from_millis(100));

    for msg in rx.iter() {
        println!("Main: got {msg}");
    }
}
```

### Why Rust prevents data races: `Send` and `Sync`<br><span class="zh-inline">Rust 为什么能防住数据竞争：`Send` 与 `Sync`</span>

- Rust uses two marker traits to encode thread-safety properties directly into types.<br><span class="zh-inline">Rust 用两个标记 trait，把线程安全性质直接编码进类型里。</span>
    - `Send` means the value can be safely transferred to another thread.<br><span class="zh-inline">`Send` 表示这个值可以安全地转移到别的线程。</span>
    - `Sync` means shared references to the value can be safely used from multiple threads.<br><span class="zh-inline">`Sync` 表示这个值的共享引用可以安全地被多个线程同时使用。</span>
- Most ordinary types are automatically `Send + Sync`, but some notable types are not.<br><span class="zh-inline">大多数普通类型都会自动实现 `Send + Sync`，但也有一些典型例外。</span>
    - `Rc<T>` is neither `Send` nor `Sync`.<br><span class="zh-inline">`Rc<T>` 两个都不是。</span>
    - `Cell<T>` and `RefCell<T>` are not `Sync`.<br><span class="zh-inline">`Cell<T>` 和 `RefCell<T>` 不是 `Sync`。</span>
    - Raw pointers are neither `Send` nor `Sync` by default.<br><span class="zh-inline">裸指针默认也不是 `Send` 或 `Sync`。</span>
- This is why `Arc<Mutex<T>>` is often the thread-safe analogue of `Rc<RefCell<T>>`.<br><span class="zh-inline">这也是为什么 `Arc<Mutex<T>>` 常常可以看成线程安全版的 `Rc<RefCell<T>>`。</span>

> **Intuition**: think of values as toys. `Send` means “you can hand the toy to another child safely”. `Sync` means “multiple children can safely hold references to the toy at the same time”. `Rc<T>` fails both tests because its reference counter is not atomic.<br><span class="zh-inline">**直觉版理解：** 可以把值想成玩具。`Send` 的意思是“这玩具能安全地交给别的孩子”；`Sync` 的意思是“多个孩子能不能同时拿着这玩具的引用一起玩”。`Rc<T>` 两项都过不了，因为它的引用计数不是原子的。</span>

# Exercise: Multi-threaded word count<br><span class="zh-inline">练习：多线程词频统计</span>

🔴 **Challenge** — combines threads, `Arc`、`Mutex` and `HashMap`<br><span class="zh-inline">🔴 **挑战练习**：把线程、`Arc`、`Mutex` 和 `HashMap` 组合起来。</span>

- Given a `Vec<String>` of text lines, spawn one thread per line and count the words in that line.<br><span class="zh-inline">给定一组 `Vec<String>` 文本行，为每一行启动一个线程，并统计这一行里的单词。</span>
- Use `Arc<Mutex<HashMap<String, usize>>>` to collect the results.<br><span class="zh-inline">用 `Arc<Mutex<HashMap<String, usize>>>` 汇总结果。</span>
- Print the total word count across all lines.<br><span class="zh-inline">最后打印所有文本行的总词数。</span>
- **Bonus**: try a channel-based version instead of shared mutable state.<br><span class="zh-inline">**加分项**：不用共享可变状态，改成基于 channel 的版本。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let lines = vec![
        "the quick brown fox".to_string(),
        "jumps over the lazy dog".to_string(),
        "the fox is quick".to_string(),
    ];

    let word_counts: Arc<Mutex<HashMap<String, usize>>> =
        Arc::new(Mutex::new(HashMap::new()));

    let mut handles = vec![];
    for line in &lines {
        let line = line.clone();
        let counts = Arc::clone(&word_counts);
        handles.push(thread::spawn(move || {
            for word in line.split_whitespace() {
                let mut map = counts.lock().unwrap();
                *map.entry(word.to_lowercase()).or_insert(0) += 1;
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    let counts = word_counts.lock().unwrap();
    let total: usize = counts.values().sum();
    println!("Word frequencies: {counts:#?}");
    println!("Total words: {total}");
}
// Output (order may vary):
// Word frequencies: {
//     "the": 3,
//     "quick": 2,
//     "brown": 1,
//     "fox": 2,
//     "jumps": 1,
//     "over": 1,
//     "lazy": 1,
//     "dog": 1,
//     "is": 1,
// }
// Total words: 13
```

</details>
