## Collections: `Vec`, `HashMap`, and Iterators<br><span class="zh-inline">集合：`Vec`、`HashMap` 与迭代器</span>

> **What you'll learn:** How the most common Rust collections compare to Java's `List`, `Map`, and stream-based traversal patterns.<br><span class="zh-inline">**本章将学习：** Rust 最常用的集合类型，分别如何对应 Java 的 `List`、`Map` 和基于 Stream 的遍历模式。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 初级</span>

## `Vec<T>` vs `List<T>`<br><span class="zh-inline">`Vec<T>` 与 `List<T>`</span>

`Vec<T>` is the workhorse collection in Rust.<br><span class="zh-inline">`Vec<T>` 是 Rust 里最常干活的集合类型。</span>

```rust
let mut numbers = vec![1, 2, 3];
numbers.push(4);
```

If Java developers are tempted to ask “what is the interface type here?”, the answer is usually “there isn't one yet, because the concrete vector is enough.”<br><span class="zh-inline">如果脑子里冒出来“这里的接口类型是什么”，Rust 的常见答案往往是：“暂时没有，因为具体的 `Vec` 已经够用了。”</span>

## `HashMap<K, V>` vs `Map<K, V>`<br><span class="zh-inline">`HashMap<K, V>` 与 `Map<K, V>`</span>

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert("ada", 98);
scores.insert("grace", 100);
```

Lookups return `Option<&V>` rather than `null`.<br><span class="zh-inline">查找结果返回的是 `Option<&V>`，不是 `null`。</span>

## Iteration<br><span class="zh-inline">迭代</span>

```rust
for value in &numbers {
    println!("{value}");
}
```

Rust makes ownership visible during iteration:<br><span class="zh-inline">Rust 会在迭代时把所有权意图直接摆出来：</span>

- `iter()` borrows items<br><span class="zh-inline">`iter()` 借用元素。</span>
- `iter_mut()` mutably borrows items<br><span class="zh-inline">`iter_mut()` 可变借用元素。</span>
- `into_iter()` consumes the collection<br><span class="zh-inline">`into_iter()` 消耗整个集合。</span>

That third case is where many Java developers first feel the ownership model in collection code.<br><span class="zh-inline">第三种情况往往是很多 Java 开发者第一次在集合代码里真正感受到所有权模型的地方。</span>

## Iterators vs Streams<br><span class="zh-inline">迭代器与 Stream</span>

| Java Stream | Rust iterator |
|---|---|
| lazy pipeline<br><span class="zh-inline">惰性流水线</span> | lazy pipeline<br><span class="zh-inline">惰性流水线</span> |
| terminal operation required<br><span class="zh-inline">需要终止操作</span> | terminal operation required<br><span class="zh-inline">需要终止操作</span> |
| often object-heavy<br><span class="zh-inline">常常对象味更重</span> | often zero-cost and monomorphized<br><span class="zh-inline">通常零成本、单态化</span> |

```rust
let doubled: Vec<_> = numbers
    .iter()
    .map(|n| n * 2)
    .collect();
```

## Advice<br><span class="zh-inline">建议</span>

- start with `Vec` before searching for more abstract collection models<br><span class="zh-inline">先把 `Vec` 用明白，再考虑更抽象的集合模型。</span>
- use `Option`-aware lookups rather than assuming missing values are exceptional<br><span class="zh-inline">查找缺失值时顺着 `Option` 去处理，不要先把它想成异常。</span>
- choose `iter`, `iter_mut`, or `into_iter` based on ownership intent<br><span class="zh-inline">根据所有权意图去选 `iter`、`iter_mut` 还是 `into_iter`。</span>

Once these three collection patterns click, a large amount of day-to-day Rust code becomes readable.<br><span class="zh-inline">只要这三类集合模式顺下来，大量日常 Rust 代码就开始变得好读了。</span>
