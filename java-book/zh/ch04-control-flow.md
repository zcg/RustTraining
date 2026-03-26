## Control Flow<br><span class="zh-inline">控制流</span>

> **What you'll learn:** How Rust control flow resembles Java in shape but differs in one crucial way: many constructs are expressions, not just statements.<br><span class="zh-inline">**本章将学习：** Rust 控制流在外形上和 Java 很像，但有个关键差异：很多结构是表达式，不只是语句。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 初级</span>

Java developers usually adapt to Rust control flow quickly. The biggest surprise is that Rust uses expressions much more aggressively.<br><span class="zh-inline">Java 开发者通常很快就能适应 Rust 的控制流。真正让人一下子拧巴的，往往是 Rust 对表达式的使用要激进得多。</span>

## `if` as an Expression<br><span class="zh-inline">把 `if` 当表达式</span>

```rust
let label = if score >= 90 { "great" } else { "ok" };
```

That is closer to a Java ternary expression than to a plain `if` statement.<br><span class="zh-inline">这更接近 Java 里的三元表达式，而不是普通 `if` 语句。</span>

## `match`<br><span class="zh-inline">`match`</span>

```rust
let text = match status {
    200 => "ok",
    404 => "missing",
    _ => "other",
};
```

`match` is central in Rust because it works with enums, options, results, and destructuring.<br><span class="zh-inline">`match` 在 Rust 里特别核心，因为它能同时覆盖 enum、option、result 和解构场景。</span>

## Loops<br><span class="zh-inline">循环</span>

| Java | Rust |
|---|---|
| `while (...)` | `while condition { ... }` |
| enhanced `for` | `for item in items { ... }` |
| `for (;;)` | `loop { ... }` |

`loop` is the dedicated infinite-loop construct.<br><span class="zh-inline">`loop` 是专门的无限循环结构。</span>

## Early Exit<br><span class="zh-inline">提前退出</span>

Rust has `return`, `break`, and `continue` as expected. It also lets `break` return a value from `loop`.<br><span class="zh-inline">Rust 当然也有 `return`、`break`、`continue`，但它还允许 `break` 从 `loop` 里直接带值出来。</span>

```rust
let result = loop {
    if ready() {
        break 42;
    }
};
```

## Pattern-Oriented Flow<br><span class="zh-inline">面向模式的控制流</span>

```rust
if let Some(user) = maybe_user {
    println!("{}", user.name);
}
```

This is a very common replacement for “null check plus cast plus use” style logic.<br><span class="zh-inline">这在 Rust 里非常常见，经常用来替代“先判空、再取值、再使用”的流程。</span>

## Advice<br><span class="zh-inline">建议</span>

- remember that `if`, `match`, and even `loop` can produce values<br><span class="zh-inline">记住 `if`、`match`、甚至 `loop` 都可能产出值。</span>
- reach for `match` when branching on enums or structured data<br><span class="zh-inline">只要是在 enum 或结构化数据上分支，就优先考虑 `match`。</span>
- prefer readable control flow over clever one-liners<br><span class="zh-inline">可读的控制流比自作聪明的一行流更重要。</span>

Rust control flow is not hard. The main adjustment is learning to think in expressions and patterns rather than in statements alone.<br><span class="zh-inline">Rust 控制流本身并不难。真正需要适应的是：思考方式要从“纯语句”转向“表达式和模式”。</span>
