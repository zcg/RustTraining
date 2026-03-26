## Data Structures and Collections<br><span class="zh-inline">数据结构与集合</span>

> **What you'll learn:** How Rust models data with tuples, arrays, slices, structs, and standard collections, and how those choices compare to Java classes and collection interfaces.<br><span class="zh-inline">**本章将学习：** Rust 如何用元组、数组、切片、结构体和标准集合来建模数据，以及这些选择和 Java 的 class、集合接口体系有什么差别。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 初级</span>

Rust data modeling is lighter than Java's object-oriented default. There is less ceremony, but also less hidden behavior.<br><span class="zh-inline">Rust 的数据建模比 Java 默认的面向对象风格更轻。仪式感更少，隐藏行为也更少。</span>

## Tuples<br><span class="zh-inline">元组</span>

```rust
let pair = ("Ada", 42);
let (name, score) = pair;
```

Tuples are useful for temporary groupings. If the fields need names, move to a struct.<br><span class="zh-inline">元组适合临时打包几个值。如果字段需要名字，就该升级成 struct 了。</span>

## Arrays and Slices<br><span class="zh-inline">数组与切片</span>

| Java | Rust |
|---|---|
| `int[]` | `[i32; N]` |
| array view or subrange<br><span class="zh-inline">数组视图或子区间</span> | `&[i32]` |

An array in Rust has length as part of its type. A slice is the borrowed view over contiguous elements.<br><span class="zh-inline">Rust 数组会把长度写进类型里。slice 则是对连续元素的一段借用视图。</span>

## Structs vs Classes<br><span class="zh-inline">结构体与类</span>

```rust
struct User {
    id: u64,
    name: String,
}
```

Rust structs hold data. Methods live separately in `impl` blocks. There is no hidden inheritance tree around them.<br><span class="zh-inline">Rust struct 主要承载数据，方法放在单独的 `impl` 块里。它背后没有一整棵默认继承树跟着跑。</span>

## Standard Collections<br><span class="zh-inline">标准集合</span>

| Java | Rust |
|---|---|
| `List<T>` | `Vec<T>` |
| `Map<K, V>` | `HashMap<K, V>` |
| `Set<T>` | `HashSet<T>` |

Rust standard collections are concrete types rather than interface-first abstractions.<br><span class="zh-inline">Rust 标准集合更偏向具体类型，而不是先上接口再谈实现。</span>

## Why This Matters<br><span class="zh-inline">这意味着什么</span>

Java code often starts with interfaces and containers. Rust code often starts with concrete data structures and only introduces abstraction when the need becomes real.<br><span class="zh-inline">Java 代码经常从接口和容器开始，Rust 代码则更常从具体数据结构起步，等抽象需求真的出现时再加一层。</span>

## Advice<br><span class="zh-inline">建议</span>

- use tuples for short-lived grouped values<br><span class="zh-inline">短生命周期的分组值用 tuple。</span>
- use structs for domain data<br><span class="zh-inline">领域数据优先用 struct。</span>
- use slices for read-only borrowed views into arrays or vectors<br><span class="zh-inline">只读借用视图优先用 slice。</span>
- begin with `Vec` and `HashMap`; optimize later if the workload demands it<br><span class="zh-inline">先把 `Vec` 和 `HashMap` 用顺，真的有性能压力再优化。</span>

Rust's data model is simple on purpose. That simplicity is one of the reasons ownership stays tractable.<br><span class="zh-inline">Rust 的数据模型是故意做得简单，这种简单也是所有权还能维持可理解性的原因之一。</span>
