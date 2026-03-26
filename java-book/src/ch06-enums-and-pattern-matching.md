## Enums and Pattern Matching

> **What you'll learn:** How Java's `sealed interface`, `record`, and `switch` expressions map to Rust `enum` and `match`, when an `enum` is better than a trait hierarchy, and how Rust uses algebraic data types for everyday domain modeling.
>
> **Difficulty:** 🟡 Intermediate

Java developers often reach for class hierarchies when a domain has a few known variants. Rust takes a different route: when the set of cases is closed, model it as an `enum` and let `match` force complete handling.

That sounds like a small syntax change. It is actually a major design shift.

## The Familiar Java Shape

In modern Java, the best equivalent is usually a sealed hierarchy:

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

This is a good direction in Java 21+, but the language still carries class-oriented baggage:

- variants are separate types
- construction and pattern matching live across multiple declarations
- the modeling style still feels like inheritance, even when sealed

## The Native Rust Shape

Rust keeps the same domain in one place:

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

Two practical consequences matter immediately:

1. The closed set of variants is obvious from one definition.
2. Adding a new variant forces every relevant `match` to be revisited by the compiler.

That second point is where Rust starts saving real maintenance effort.

## `match` Is More Than a Safer `switch`

Java's modern `switch` is much better than the old statement form, but Rust `match` still goes further:

- exhaustiveness is the default expectation
- destructuring is first-class
- guards compose naturally with data extraction
- `match` is an expression, so every branch must produce a coherent type

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

The guard on `attempts >= 3` is especially useful for Java developers who are used to nested `if` blocks after type checks.

## Destructuring Replaces Boilerplate Getters

In Java, one often writes:

```java
if (command instanceof Charge charge) {
    return charge.orderId() + ":" + charge.cents();
}
```

Rust treats that style as ordinary, not special:

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

The payload is unpacked where it is used. There is less ceremony around "data carrier plus accessor methods."

## `Option` and `Result` Are the Same Idea Applied Everywhere

Java developers normally meet sum types in advanced modeling, then go back to `Optional<T>` and exceptions in daily work.

Rust uses the same algebraic-data-type idea in the standard library:

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

That consistency matters. After a while, `enum` stops feeling like a special topic and becomes the ordinary way to model absence, failure, workflow states, and protocol messages.

## When an `enum` Beats a Trait Hierarchy

Java developers often ask, "Should this be an interface?" Rust changes the question to "Is the variation open or closed?"

| Situation | Better Rust tool | Why |
|---|---|---|
| A fixed set of domain states | `enum` | The compiler can enforce complete handling |
| Plugin-style extension by downstream code | `trait` | New implementations can appear later |
| Commands or events crossing a boundary | `enum` | Serialization and matching stay simple |
| Shared behavior over many unrelated types | `trait` | Behavior is the changing axis |

A good smell check:

- if the team controls every variant and knows them today, prefer `enum`
- if outside code must implement the abstraction later, prefer `trait`

## Migration Example: Java Order State Machine

Java teams often model workflows with status enums plus scattered validation rules:

```java
public enum OrderStatus {
    PENDING, PAID, SHIPPED, CANCELLED
}
```

The trouble begins when `SHIPPED` needs tracking data or `CANCELLED` needs a reason. The model usually expands into extra nullable fields.

Rust handles this more honestly:

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

No meaningless fields exist on the wrong state. The payload travels with the variant that actually owns it.

## Common Java-to-Rust Mistakes

- using `struct` plus a manual `kind: String` field instead of an `enum`
- recreating abstract base classes for a domain that is already closed
- adding wildcard arms too early and losing exhaustiveness pressure
- storing optional fields that only make sense for one state

If the design starts feeling like "one base type plus many flags," the model usually wants an `enum`.

## Practical Checklist

Before choosing a Rust design, ask:

1. Is the set of cases known and controlled by this crate?
2. Does each case carry different data?
3. Do handlers need to branch on the case frequently?
4. Would adding a new case require touching business logic across the codebase?

If the answer is mostly yes, an `enum` is probably the right starting point.

<details>
<summary><strong>🏋️ Exercise: Command Parser</strong> (click to expand)</summary>

Model a billing workflow with these cases:

- `Draft`
- `Issued { invoice_id: String, total_cents: u64 }`
- `Paid { invoice_id: String, paid_at: String }`
- `Failed { invoice_id: String, reason: String }`

```rust
// Write:
// 1. fn status_label(state: &BillingState) -> &'static str
// 2. fn can_send_receipt(state: &BillingState) -> bool
// 3. fn invoice_id(state: &BillingState) -> Option<&str>
```

<details>
<summary>🔑 Solution</summary>

```rust
enum BillingState {
    Draft,
    Issued { invoice_id: String, total_cents: u64 },
    Paid { invoice_id: String, paid_at: String },
    Failed { invoice_id: String, reason: String },
}

fn status_label(state: &BillingState) -> &'static str {
    match state {
        BillingState::Draft => "draft",
        BillingState::Issued { .. } => "issued",
        BillingState::Paid { .. } => "paid",
        BillingState::Failed { .. } => "failed",
    }
}

fn can_send_receipt(state: &BillingState) -> bool {
    matches!(state, BillingState::Paid { .. })
}

fn invoice_id(state: &BillingState) -> Option<&str> {
    match state {
        BillingState::Draft => None,
        BillingState::Issued { invoice_id, .. }
        | BillingState::Paid { invoice_id, .. }
        | BillingState::Failed { invoice_id, .. } => Some(invoice_id.as_str()),
    }
}
```

</details>
</details>


