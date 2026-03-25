# Summary and Reference Card<br><span class="zh-inline">总结与参考卡片</span>

## Quick Reference Card<br><span class="zh-inline">快速参考卡片</span>

### Async Mental Model<br><span class="zh-inline">Async 心智模型</span>

```text
┌─────────────────────────────────────────────────────┐
│  async fn → State Machine (enum) → impl Future     │
│  .await   → poll() the inner future                 │
│  executor → loop { poll(); sleep_until_woken(); }   │
│  waker    → "hey executor, poll me again"           │
│  Pin      → "promise I won't move in memory"        │
└─────────────────────────────────────────────────────┘
```

<span class="zh-inline">可以把整套 async 先记成这一句话：`async fn` 会被编译成状态机，`.await` 会去 poll 内层 future，executor 负责不断轮询并在被唤醒后继续推进，waker 用来通知执行器“我又能继续了”，而 `Pin` 保证状态机不会在内存里乱挪位置。</span>

### Common Patterns Cheat Sheet<br><span class="zh-inline">常见模式速查表</span>

| Goal | Use |
|------|-----|
| Run two futures concurrently<br><span class="zh-inline">让两个 future 并发执行</span> | `tokio::join!(a, b)` |
| Race two futures<br><span class="zh-inline">让两个 future 竞速</span> | `tokio::select! { ... }` |
| Spawn a background task<br><span class="zh-inline">启动后台任务</span> | `tokio::spawn(async { ... })` |
| Run blocking code in async<br><span class="zh-inline">在 async 上下文中执行阻塞代码</span> | `tokio::task::spawn_blocking(\|\| { ... })` |
| Limit concurrency<br><span class="zh-inline">限制并发数</span> | `Semaphore::new(N)` |
| Collect many task results<br><span class="zh-inline">收集大量任务结果</span> | `JoinSet` |
| Share state across tasks<br><span class="zh-inline">在任务之间共享状态</span> | `Arc<Mutex<T>>` or channels<br><span class="zh-inline">`Arc<Mutex<T>>` 或 channel</span> |
| Graceful shutdown<br><span class="zh-inline">优雅停机</span> | `watch::channel` + `select!` |
| Process a stream N-at-a-time<br><span class="zh-inline">按 N 个一组处理 stream</span> | `.buffer_unordered(N)` |
| Timeout a future<br><span class="zh-inline">给 future 设置超时</span> | `tokio::time::timeout(dur, fut)` |
| Retry with backoff<br><span class="zh-inline">带退避的重试</span> | Custom combinator (see Ch. 13)<br><span class="zh-inline">自定义组合器，见第 13 章</span> |

### Pinning Quick Reference<br><span class="zh-inline">Pinning 速查</span>

| Situation | Use |
|-----------|-----|
| Pin a future on the heap<br><span class="zh-inline">把 future 固定在堆上</span> | `Box::pin(fut)` |
| Pin a future on the stack<br><span class="zh-inline">把 future 固定在栈上</span> | `tokio::pin!(fut)` |
| Pin an `Unpin` type<br><span class="zh-inline">固定一个 `Unpin` 类型</span> | `Pin::new(&mut val)` — safe, free<br><span class="zh-inline">`Pin::new(&mut val)`，安全且没有额外成本</span> |
| Return a pinned trait object<br><span class="zh-inline">返回一个被 pin 的 trait object</span> | `-> Pin<Box<dyn Future<Output = T> + Send>>` |

### Channel Selection Guide<br><span class="zh-inline">Channel 选型指南</span>

| Channel | Producers | Consumers | Values | Use When |
|---------|-----------|-----------|--------|----------|
| `mpsc` | N | 1 | Stream | Work queues, event buses<br><span class="zh-inline">工作队列、事件总线</span> |
| `oneshot` | 1 | 1 | Single | Request/response, completion notification<br><span class="zh-inline">请求响应、完成通知</span> |
| `broadcast` | N | N | All recv all | Fan-out notifications, shutdown signals<br><span class="zh-inline">扇出通知、停机信号</span> |
| `watch` | 1 | N | Latest only | Config updates, health status<br><span class="zh-inline">配置更新、健康状态</span> |

### Mutex Selection Guide<br><span class="zh-inline">Mutex 选型指南</span>

| Mutex | Use When |
|-------|----------|
| `std::sync::Mutex` | Lock is held briefly, never across `.await`<br><span class="zh-inline">锁持有时间很短，而且绝对不会跨 `.await`。</span> |
| `tokio::sync::Mutex` | Lock must be held across `.await`<br><span class="zh-inline">锁需要跨 `.await` 持有。</span> |
| `parking_lot::Mutex` | High contention, no `.await`, need performance<br><span class="zh-inline">竞争激烈、没有 `.await`，并且特别看重性能。</span> |
| `tokio::sync::RwLock` | Many readers, few writers, locks cross `.await`<br><span class="zh-inline">读多写少，而且锁要跨 `.await`。</span> |

### Decision Quick Reference<br><span class="zh-inline">决策速查</span>

```text
Need concurrency?
├── I/O-bound → async/await
├── CPU-bound → rayon / std::thread
└── Mixed → spawn_blocking for CPU parts

Choosing runtime?
├── Server app → tokio
├── Library → runtime-agnostic (futures crate)
├── Embedded → embassy
└── Minimal → smol

Need concurrent futures?
├── Can be 'static + Send → tokio::spawn
├── Can be 'static + !Send → LocalSet
├── Can't be 'static → FuturesUnordered
└── Need to track/abort → JoinSet
```

<span class="zh-inline">如果只是为了快速判断，先按这个顺序想：先分清是 I/O 密集还是 CPU 密集，再决定运行时，最后再看 future 的生命周期和 `Send` 约束。</span>

### Common Error Messages and Fixes<br><span class="zh-inline">常见报错与修复思路</span>

| Error | Cause | Fix |
|-------|-------|-----|
| `future is not Send` | Holding `!Send` type across `.await`<br><span class="zh-inline">在 `.await` 之前持有了 `!Send` 类型。</span> | Scope the value so it's dropped before `.await`, or use `current_thread` runtime<br><span class="zh-inline">缩小作用域，让它在 `.await` 之前被释放，或者改用 `current_thread` 运行时。</span> |
| `borrowed value does not live long enough` in spawn | `tokio::spawn` requires `'static`<br><span class="zh-inline">`tokio::spawn` 要求 `'static` 生命周期。</span> | Use `Arc`, `clone()`, or `FuturesUnordered`<br><span class="zh-inline">使用 `Arc`、`clone()`，或者改用 `FuturesUnordered`。</span> |
| `the trait Future is not implemented for ()` | Missing `.await`<br><span class="zh-inline">漏写了 `.await`。</span> | Add `.await` to the async call<br><span class="zh-inline">给异步调用补上 `.await`。</span> |
| `cannot borrow as mutable` in poll | Self-referential borrow<br><span class="zh-inline">发生了自引用借用问题。</span> | Use `Pin<&mut Self>` correctly (see Ch. 4)<br><span class="zh-inline">正确使用 `Pin<&mut Self>`，详见第 4 章。</span> |
| Program hangs silently | Forgot to call `waker.wake()`<br><span class="zh-inline">忘了调用 `waker.wake()`。</span> | Ensure every `Pending` path registers and triggers the waker<br><span class="zh-inline">确保每条返回 `Pending` 的分支都注册并触发了 waker。</span> |

### Further Reading<br><span class="zh-inline">延伸阅读</span>

| Resource | Why |
|----------|-----|
| [Tokio Tutorial](https://tokio.rs/tokio/tutorial) | Official hands-on guide — excellent for first projects<br><span class="zh-inline">官方动手教程，非常适合第一个项目。</span> |
| [Async Book (official)](https://rust-lang.github.io/async-book/) | Covers `Future`, `Pin`, `Stream` at the language level<br><span class="zh-inline">从语言层面讲清 `Future`、`Pin` 和 `Stream`。</span> |
| [Jon Gjengset — Crust of Rust: async/await](https://www.youtube.com/watch?v=ThjvMReOXYM) | 2-hour deep dive into internals with live coding<br><span class="zh-inline">配合现场编码，深入讲解 async/await 内部机制。</span> |
| [Alice Ryhl — Actors with Tokio](https://ryhl.io/blog/actors-with-tokio/) | Production architecture pattern for stateful services<br><span class="zh-inline">面向有状态服务的生产架构模式。</span> |
| [Without Boats — Pin, Unpin, and why Rust needs them](https://without.boats/blog/pin/) | The original motivation from the language designer<br><span class="zh-inline">语言设计者给出的原始动机说明。</span> |
| [Tokio mini-Redis](https://github.com/tokio-rs/mini-redis) | Complete async Rust project — study-quality production code<br><span class="zh-inline">一个完整的 async Rust 项目，学习价值很高。</span> |
| [Tower documentation](https://docs.rs/tower) | Middleware/service architecture used by axum, tonic, hyper<br><span class="zh-inline">axum、tonic、hyper 等框架采用的中间件与服务架构。</span> |

***

*End of Async Rust Training Guide*<br><span class="zh-inline">Async Rust 训练指南到此结束。</span>
