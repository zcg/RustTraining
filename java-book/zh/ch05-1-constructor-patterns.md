## Constructor Patterns<br><span class="zh-inline">构造器模式</span>

> **What you'll learn:** How Rust replaces Java constructors with associated functions, `Default`, and builders.<br><span class="zh-inline">**本章将学习：** Rust 如何用关联函数、`Default` 和 builder 模式，替代 Java 风格的构造器。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 初级</span>

Rust does not have constructors in the Java sense. Instead, types usually expose associated functions such as `new`.<br><span class="zh-inline">Rust 没有 Java 意义上的构造器，类型通常通过关联函数来暴露初始化入口，最常见的名字就是 `new`。</span>

## A Basic `new`<br><span class="zh-inline">一个基本的 `new`</span>

```rust
struct Config {
    host: String,
    port: u16,
}

impl Config {
    fn new(host: String, port: u16) -> Self {
        Self { host, port }
    }
}
```

This is explicit and boring, which is usually a good thing.<br><span class="zh-inline">这种写法非常直白，也有点朴素，但大多数时候这恰恰是好事。</span>

## `Default`<br><span class="zh-inline">`Default`</span>

```rust
#[derive(Default)]
struct RetryPolicy {
    max_retries: u32,
}
```

`Default` is a natural fit for types that have sensible baseline values.<br><span class="zh-inline">只要一个类型存在合理的默认值，`Default` 就很合适。</span>

## Builder Pattern<br><span class="zh-inline">builder 模式</span>

Builders are useful when:<br><span class="zh-inline">下面这些情况就适合上 builder：</span>

- there are many optional fields<br><span class="zh-inline">可选字段很多。</span>
- construction needs validation<br><span class="zh-inline">构造过程需要校验。</span>
- call sites should read like configuration<br><span class="zh-inline">调用点希望看起来像配置声明。</span>

```rust
struct ClientBuilder {
    timeout_ms: u64,
}

impl ClientBuilder {
    fn new() -> Self {
        Self { timeout_ms: 1000 }
    }

    fn timeout_ms(mut self, timeout_ms: u64) -> Self {
        self.timeout_ms = timeout_ms;
        self
    }
}
```

## Guidance<br><span class="zh-inline">选择建议</span>

- use `new` for ordinary construction<br><span class="zh-inline">普通初始化用 `new`。</span>
- use `Default` for sensible zero-argument initialization<br><span class="zh-inline">零参数初始化合理时，用 `Default`。</span>
- use builders when option count and readability demand them<br><span class="zh-inline">可选项太多、又想保证可读性时，用 builder。</span>

Rust construction is less magical than Java frameworks, but the trade-off is simpler reasoning at call sites.<br><span class="zh-inline">Rust 的构造方式没有 Java 框架那种魔法感，但换来的好处是：调用点更容易读，也更容易推理。</span>
