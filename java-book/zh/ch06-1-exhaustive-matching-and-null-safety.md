## Exhaustive Matching and Null Safety<br><span class="zh-inline">穷尽匹配与空安全</span>

> **What you'll learn:** Why `Option<T>` and exhaustive `match` matter so much to developers coming from Java's null-heavy past, and how Rust turns absence and branching into ordinary type design instead of defensive programming.<br><span class="zh-inline">**本章将学习：** 为什么 `Option<T>` 和穷尽 `match` 对从 Java 空值历史里走出来的开发者会这么重要，以及 Rust 怎样把“值不存在”和“分支处理”变成正常的类型设计，而不是一层层防御式编程。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Rust treats absence as a first-class type problem, not as a convention problem.<br><span class="zh-inline">Rust 把“值不存在”当成类型问题来处理，而不是只靠约定来兜。</span>

## `Option<T>`<br><span class="zh-inline">`Option<T>`</span>

```rust
fn find_user(id: u64) -> Option<User> {
    // ...
}
```

That return type forces callers to think about “found” and “not found” explicitly.<br><span class="zh-inline">这个返回类型会强迫调用方显式面对“找到”和“没找到”两种情况。</span>

## Why This Feels Different from Java<br><span class="zh-inline">为什么这和 Java 体感不一样</span>

Java has `Optional<T>`, but it is mostly used at API boundaries, and ordinary references can still be null. In many codebases, `Optional` is avoided in fields, serialization models, or older service layers. Rust uses `Option<T>` in ordinary APIs, so absence handling becomes routine instead of exceptional.<br><span class="zh-inline">Java 虽然有 `Optional<T>`，但它更多出现在 API 边界，普通引用照样可能是 null。很多老代码库里，字段、序列化模型、旧服务层甚至都不怎么用 `Optional`。Rust 则会把 `Option<T>` 大量用在常规 API 里，于是“处理不存在”变成日常，而不是额外补丁。</span>

That means Rust developers stop asking “should this be nullable?” and start asking “what shape of value describes reality?”<br><span class="zh-inline">这意味着 Rust 开发里，思路会从“这里要不要可空”转成“什么样的值形态才能准确表达现实状态”。</span>

## `Optional<T>` Versus `Option<T>`<br><span class="zh-inline">`Optional<T>` 与 `Option<T>` 的差别</span>

For Java developers, the mental shift is important:<br><span class="zh-inline">对 Java 开发者来说，这里的思维转换非常关键：</span>

- Java `Optional<T>` is often advisory<br><span class="zh-inline">Java 的 `Optional<T>` 很多时候更像建议。</span>
- Rust `Option<T>` is structural<br><span class="zh-inline">Rust 的 `Option<T>` 则是结构本身。</span>
- Java still allows `null` to bypass the model<br><span class="zh-inline">Java 里的 `null` 仍然可以绕过建模。</span>
- Rust safe code does not let absence hide outside the model<br><span class="zh-inline">Rust 的安全代码不会让“值不存在”偷偷躲出模型之外。</span>

In practice, `Option<T>` is closer to a language-wide discipline than to a convenience wrapper.<br><span class="zh-inline">实际感受上，`Option<T>` 更像是一种贯穿语言层面的纪律，而不只是一个顺手的包装器。</span>

## Exhaustive `match`<br><span class="zh-inline">穷尽 `match`</span>

```rust
match maybe_user {
    Some(user) => println!("{}", user.name),
    None => println!("not found"),
}
```

Missing a branch is usually a compile error rather than a runtime surprise.<br><span class="zh-inline">漏掉一个分支，通常会变成编译错误，而不是运行时惊喜。</span>

## More Than Null Checks<br><span class="zh-inline">这远不只是空值判断</span>

Exhaustive matching becomes even more powerful when the type is not just “present or absent” but a real domain model:<br><span class="zh-inline">当类型表达的已经不只是“有值还是没值”，而是真实的领域状态时，穷尽匹配的力量会更明显：</span>

```rust
enum PaymentMethod {
    Card(CardInfo),
    BankTransfer(BankInfo),
    Cash,
}
```

When a new variant is added, existing `match` expressions become incomplete until the logic is updated. That is a very different safety story from a Java `switch` over strings or ad-hoc discriminator values.<br><span class="zh-inline">一旦新增了变体，现有的 `match` 表达式就会立刻变成不完整，直到逻辑补齐为止。这和 Java 里基于字符串或者临时判别字段的 `switch`，安全故事完全不是一个级别。</span>

## Why Java Teams Notice This Early<br><span class="zh-inline">为什么 Java 团队会很早注意到这一点</span>

Java developers often come from codebases with some combination of:<br><span class="zh-inline">很多 Java 开发者所在的代码库，通常多少都会混着下面这些情况：</span>

- nullable entity fields<br><span class="zh-inline">实体字段可空。</span>
- `Optional` at service boundaries<br><span class="zh-inline">服务边界上有 `Optional`。</span>
- `switch` branches that quietly miss new states<br><span class="zh-inline">`switch` 悄悄漏掉新状态。</span>
- defensive `if (x != null)` checks repeated everywhere<br><span class="zh-inline">到处重复出现防御式 `if (x != null)`。</span>

Rust cuts through that clutter by making the state model explicit first.<br><span class="zh-inline">Rust 的办法很干脆：先把状态模型写明白，再谈逻辑怎么处理。</span>

## Practical Benefits<br><span class="zh-inline">实践收益</span>

- no accidental null dereference in normal safe code<br><span class="zh-inline">普通安全代码里不会随手踩出空指针解引用。</span>
- branching logic is visible in one place<br><span class="zh-inline">分支逻辑会集中出现在一个地方。</span>
- new enum variants force old logic to be revisited<br><span class="zh-inline">enum 新增分支时，旧逻辑会被编译器逼着重新检查。</span>
- domain transitions become easier to review because the type tells the story<br><span class="zh-inline">领域状态迁移会更容易审查，因为类型本身就在讲故事。</span>

For Java developers, this is one of the first chapters where Rust's type system stops feeling like syntax and starts feeling like a design tool.<br><span class="zh-inline">对 Java 开发者来说，这往往是最早能明显体会到“Rust 类型系统已经不只是语法，而是设计工具”的章节之一。</span>
