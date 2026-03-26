## Smart Pointers: Beyond Single Ownership<br><span class="zh-inline">智能指针：超越单一所有权</span>

> **What you'll learn:** When `Box`, `Rc`, `Arc`, `RefCell`, and `Mutex` are needed, and how they compare to Java's always-reference-based object model.<br><span class="zh-inline">**本章将学习：** 什么时候该用 `Box`、`Rc`、`Arc`、`RefCell`、`Mutex`，以及它们和 Java 那种“对象默认全靠引用”模型有什么区别。</span>
>
> **Difficulty:** 🔴 Advanced<br><span class="zh-inline">**难度：** 🔴 高级</span>

Java developers are used to object references everywhere. Rust starts from direct ownership and only adds pointer-like wrappers when they are actually needed.<br><span class="zh-inline">Java 开发者习惯了对象到处都是引用。Rust 则是先从直接所有权开始，只有真的需要时才引入带指针味道的包装类型。</span>

## Common Smart Pointers<br><span class="zh-inline">常见智能指针</span>

| Type | Typical use |
|---|---|
| `Box<T>` | heap allocation with single ownership<br><span class="zh-inline">单一所有权下的堆分配</span> |
| `Rc<T>` | shared ownership in single-threaded code<br><span class="zh-inline">单线程共享所有权</span> |
| `Arc<T>` | shared ownership across threads<br><span class="zh-inline">跨线程共享所有权</span> |
| `RefCell<T>` | checked interior mutability in single-threaded code<br><span class="zh-inline">单线程内部可变性</span> |
| `Mutex<T>` | synchronized shared mutable access<br><span class="zh-inline">同步共享可变访问</span> |

## The Key Difference from Java<br><span class="zh-inline">和 Java 的关键差异</span>

In Java, shared references are the default. In Rust, shared ownership is a deliberate choice with a specific type.<br><span class="zh-inline">在 Java 里，共享引用是默认状态；在 Rust 里，共享所有权必须通过专门类型显式表达。</span>

## Guidance<br><span class="zh-inline">使用建议</span>

- use plain values and references first<br><span class="zh-inline">优先从普通值和引用开始。</span>
- add `Box` when recursive or heap-allocated layout is needed<br><span class="zh-inline">递归结构或需要稳定堆布局时，再加 `Box`。</span>
- add `Rc` or `Arc` only when multiple owners are truly required<br><span class="zh-inline">只有真的存在多个 owner 时，再上 `Rc` 或 `Arc`。</span>
- pair `Arc` with `Mutex` only when shared mutable state is unavoidable<br><span class="zh-inline">只有共享可变状态躲不过去时，才把 `Arc` 和 `Mutex` 配一起。</span>

These types are powerful, but they are also signals that the ownership model has become more complex.<br><span class="zh-inline">这些类型很好用，但它们同时也是信号：代码里的所有权关系已经开始变复杂了。</span>
