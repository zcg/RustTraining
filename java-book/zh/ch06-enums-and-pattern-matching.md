## Enums and Pattern Matching<br><span class="zh-inline">枚举与模式匹配</span>

> **What you'll learn:** How Java's `sealed interface`, `record`, and `switch` expressions map to Rust `enum` and `match`, and when a closed domain should be modeled as an enum instead of a hierarchy.<br><span class="zh-inline">**本章将学习：** Java 里的 `sealed interface`、`record`、`switch` 表达式如何迁到 Rust 的 `enum` 与 `match`，以及什么时候应该把封闭领域建模成枚举，而不是继承层级。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Java developers often reach for classes and interfaces when a domain has a few fixed variants.<br><span class="zh-inline">当一个领域只有少数几种固定变体时，Java 开发者通常会本能地想到 class 和 interface。</span>

Rust's default answer is different: if the set of cases is closed, define an `enum` and let `match` force complete handling.<br><span class="zh-inline">Rust 的默认答案不一样：如果变体集合是封闭的，就定义 `enum`，再让 `match` 强制把所有情况处理完整。</span>

## The Familiar Java Shape<br><span class="zh-inline">Java 里熟悉的建模方式</span>

```java
public sealed interface PaymentCommand
    permits Charge, Refund, Cancel { }

public record Charge(String orderId, long cents) implements PaymentCommand { }
public record Refund(String paymentId, long cents) implements PaymentCommand { }
public record Cancel(String orderId) implements PaymentCommand { }

public final class PaymentService {
    public String handle(PaymentCommand command) {
        return switch (command) {
            case Charge charge -> "charge " + charge.orderId();
            case Refund refund -> "refund " + refund.paymentId();
            case Cancel cancel -> "cancel " + cancel.orderId();
        };
    }
}
```

This is already the better side of modern Java, but the model is still spread across multiple declarations.<br><span class="zh-inline">这已经是现代 Java 里相对更好的写法了，但模型依然分散在多个声明里。</span>

## The Native Rust Shape<br><span class="zh-inline">Rust 原生的写法</span>

```rust
#[derive(Debug, Clone)]
enum PaymentCommand {
    Charge { order_id: String, cents: u64 },
    Refund { payment_id: String, cents: u64 },
    Cancel { order_id: String },
}

fn handle(command: PaymentCommand) -> String {
    match command {
        PaymentCommand::Charge { order_id, cents } => {
            format!("charge {order_id} for {cents} cents")
        }
        PaymentCommand::Refund { payment_id, cents } => {
            format!("refund {payment_id} for {cents} cents")
        }
        PaymentCommand::Cancel { order_id } => {
            format!("cancel order {order_id}")
        }
    }
}
```

Rust keeps the whole closed set in one place, which makes the model easier to audit and change.<br><span class="zh-inline">Rust 会把整个封闭集合放在一处定义，阅读、审查和修改都会更直接。</span>

Two consequences matter a lot:<br><span class="zh-inline">这里有两个很关键的后果：</span>

- the full set of variants is visible at once<br><span class="zh-inline">所有变体一眼就能看全。</span>
- adding a new variant forces every relevant `match` to be revisited<br><span class="zh-inline">一旦新增变体，所有相关 `match` 都会被编译器强制重新检查。</span>

## `match` Is More Than a Safer `switch`<br><span class="zh-inline">`match` 不只是更安全的 `switch`</span>

Rust `match` brings four habits that Java teams quickly learn to rely on:<br><span class="zh-inline">Rust 的 `match` 会带来四种很快就离不开的习惯：</span>

- exhaustive handling<br><span class="zh-inline">穷尽处理。</span>
- pattern destructuring<br><span class="zh-inline">模式解构。</span>
- guards with `if`<br><span class="zh-inline">带 `if` 的守卫。</span>
- expression-oriented branching<br><span class="zh-inline">以表达式为中心的分支返回。</span>

```rust
#[derive(Debug)]
enum UserEvent {
    SignedUp { user_id: u64, email: String },
    LoginFailed { user_id: u64, attempts: u32 },
    SubscriptionChanged { plan: String, seats: u32 },
}

fn describe(event: UserEvent) -> String {
    match event {
        UserEvent::SignedUp { user_id, email } => {
            format!("user {user_id} signed up with {email}")
        }
        UserEvent::LoginFailed { user_id, attempts } if attempts >= 3 => {
            format!("user {user_id} is locked after {attempts} failures")
        }
        UserEvent::LoginFailed { user_id, attempts } => {
            format!("user {user_id} failed login attempt {attempts}")
        }
        UserEvent::SubscriptionChanged { plan, seats } => {
            format!("subscription moved to {plan} with {seats} seats")
        }
    }
}
```

The guard branch is the kind of thing Java developers often write as a type check followed by nested `if` logic.<br><span class="zh-inline">上面这个 guard 分支，正是 Java 开发者经常会写成“类型判断 + 里层 `if`”的那类逻辑。</span>

## Destructuring Replaces Boilerplate Getters<br><span class="zh-inline">解构会取代很多样板 getter</span>

```java
if (command instanceof Charge charge) {
    return charge.orderId() + ":" + charge.cents();
}
```

```rust
fn audit(command: &PaymentCommand) -> String {
    match command {
        PaymentCommand::Charge { order_id, cents } => {
            format!("charge:{order_id}:{cents}")
        }
        PaymentCommand::Refund { payment_id, cents } => {
            format!("refund:{payment_id}:{cents}")
        }
        PaymentCommand::Cancel { order_id } => {
            format!("cancel:{order_id}")
        }
    }
}
```

In Rust, unpacking the payload at the point of use is the natural style, not an advanced trick.<br><span class="zh-inline">在 Rust 里，在哪里使用，就在哪里把载荷拆开，这是自然写法，不是什么高级技巧。</span>

## `Option` and `Result` Are the Same Modeling Idea<br><span class="zh-inline">`Option` 和 `Result` 其实是同一套建模思想</span>

Java teams often learn sum types as a special topic, but Rust applies the same idea to ordinary absence and failure.<br><span class="zh-inline">Java 团队经常把 sum type 当成专题知识来看，但 Rust 会把同样的思想直接用于“值可能不存在”和“调用可能失败”这些日常场景。</span>

```rust
fn maybe_discount(code: &str) -> Option<u8> {
    match code {
        "VIP" => Some(20),
        "WELCOME" => Some(10),
        _ => None,
    }
}

fn parse_port(raw: &str) -> Result<u16, String> {
    raw.parse::<u16>()
        .map_err(|_| format!("invalid port: {raw}"))
}
```

After a while, `enum` stops feeling like a separate chapter and becomes the default tool for domain states, optional data, and typed failures.<br><span class="zh-inline">学到后面，`enum` 就不会再像一章单独知识点，而会变成建模状态、可选值、类型化失败时的默认工具。</span>

## Enum or Trait?<br><span class="zh-inline">该用 Enum 还是 Trait</span>

| Situation<br><span class="zh-inline">场景</span> | Better Rust tool<br><span class="zh-inline">更适合的 Rust 工具</span> | Why<br><span class="zh-inline">原因</span> |
|---|---|---|
| fixed set of domain states<br><span class="zh-inline">固定的领域状态集合</span> | `enum` | compiler can enforce completeness<br><span class="zh-inline">编译器可以强制完整处理</span> |
| plugin-style extension<br><span class="zh-inline">插件式可扩展实现</span> | `trait` | downstream code may add implementations<br><span class="zh-inline">下游代码以后还能新增实现</span> |
| commands or events across a boundary<br><span class="zh-inline">跨边界的命令或事件</span> | `enum` | easy to serialize and match<br><span class="zh-inline">更适合序列化和匹配</span> |
| shared behavior over unrelated types<br><span class="zh-inline">多个无关类型共享行为</span> | `trait` | behavior is the changing axis<br><span class="zh-inline">变化轴是行为，不是状态集合</span> |

If the team already knows every variant today, `enum` is usually the honest model.<br><span class="zh-inline">如果团队今天就已经知道所有变体是什么，`enum` 往往就是更诚实的模型。</span>

## Migration Example: Order State<br><span class="zh-inline">迁移示例：订单状态</span>

```java
public enum OrderStatus {
    PENDING, PAID, SHIPPED, CANCELLED
}
```

In Java, the trouble starts when only some states need extra data, and then nullable fields begin to spread.<br><span class="zh-inline">在 Java 里，麻烦通常从“只有部分状态需要额外数据”开始，然后各种可空字段慢慢扩散。</span>

```rust
#[derive(Debug)]
enum OrderState {
    Pending,
    Paid { receipt_id: String },
    Shipped { tracking_number: String },
    Cancelled { reason: String },
}

fn can_refund(state: &OrderState) -> bool {
    match state {
        OrderState::Paid { .. } => true,
        OrderState::Shipped { .. } => false,
        OrderState::Cancelled { .. } => false,
        OrderState::Pending => false,
    }
}
```

The data lives exactly on the variant that owns it.<br><span class="zh-inline">数据会准确地挂在真正拥有它的那个变体上。</span>

## Common Mistakes<br><span class="zh-inline">常见误区</span>

- using `struct` plus a manual `kind: String` field<br><span class="zh-inline">用 `struct` 再手写一个 `kind: String` 字段冒充变体。</span>
- rebuilding abstract base classes for a closed domain<br><span class="zh-inline">明明是封闭领域，还去重建抽象基类体系。</span>
- adding wildcard arms too early<br><span class="zh-inline">太早加通配分支，直接把穷尽检查价值打掉。</span>
- storing optional fields that belong to only one case<br><span class="zh-inline">把只属于某一种状态的字段做成一堆 `Option` 塞在公共结构里。</span>

---

## Exercises<br><span class="zh-inline">练习</span>

<details>
<summary><strong>🏋️ Exercise: Replace a Java Sealed Hierarchy</strong> <span class="zh-inline">练习：把 Java sealed 层级改写成 Rust 枚举</span></summary>

Model a billing workflow with these cases:<br><span class="zh-inline">请用下面这些状态建模一个账单流程：</span>

- `Draft`<br><span class="zh-inline">草稿。</span>
- `Issued { invoice_id: String, total_cents: u64 }`<br><span class="zh-inline">已开单，带账单号和金额。</span>
- `Paid { invoice_id: String, paid_at: String }`<br><span class="zh-inline">已支付，带支付时间。</span>
- `Failed { invoice_id: String, reason: String }`<br><span class="zh-inline">失败，带失败原因。</span>

Then write these functions:<br><span class="zh-inline">然后实现下面几个函数：</span>

1. `fn status_label(state: &BillingState) -> &'static str`<br><span class="zh-inline">返回状态标签。</span>
2. `fn can_send_receipt(state: &BillingState) -> bool`<br><span class="zh-inline">判断是否可以发送回执。</span>
3. `fn invoice_id(state: &BillingState) -> Option<&str>`<br><span class="zh-inline">返回可选的账单号。</span>

</details>
