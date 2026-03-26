## Object-Oriented Thinking in Rust

> **What you'll learn:** How Java's object-oriented instincts map into Rust, what Rust keeps from classic OOP, what it rejects, and how to redesign Java service and domain models without forcing Rust into a class hierarchy.
>
> **Difficulty:** 🟡 Intermediate

Java developers usually carry four strong OOP instincts:

- bundle data and behavior together
- reuse through inheritance
- hide implementation behind interfaces
- let frameworks create and wire object graphs

Rust agrees with some of that package, and flatly rejects the rest.

## What Rust Keeps

Rust absolutely supports these object-oriented goals:

- encapsulation
- method syntax on user-defined types
- interface-like abstraction through traits
- polymorphism through generics and trait objects

So the right mental shift is not "Rust has no OOP." The right shift is "Rust keeps the useful parts of OOP and drops the class-centric worldview."

## What Rust Rejects

Rust rejects several habits that Java developers often treat as default:

- class inheritance as the main reuse mechanism
- "everything is an object" as the core mental model
- hidden ownership behind ambient references
- framework-controlled object graphs as the normal source of structure

This is why Java-shaped Rust often feels awkward. The language is asking different design questions.

## A Practical Translation Table

| Java OOP habit | Better Rust direction |
|---|---|
| entity class | `struct` |
| service interface | `trait` |
| abstract base class | trait plus helper `struct` or `enum` |
| field injection | explicit constructor wiring |
| inheritance reuse | composition and delegation |
| nullable property | `Option<T>` |
| checked or unchecked exception | `Result<T, E>` |

## Encapsulation Still Exists

Encapsulation is alive and well in Rust:

```rust
pub struct Counter {
    value: u64,
}

impl Counter {
    pub fn new() -> Self {
        Self { value: 0 }
    }

    pub fn increment(&mut self) {
        self.value += 1;
    }

    pub fn value(&self) -> u64 {
        self.value
    }
}
```

The difference is that encapsulation is not built on a class hierarchy. Data and methods live together, but inheritance is not the glue.

## Traits Are Interface-Like, Not Class-Like

Java developers usually meet traits and immediately ask whether they are just interfaces. The closest answer is "interface-like behavior plus stronger generic composition."

```rust
trait PaymentGateway {
    fn charge(&self, cents: u64) -> Result<(), String>;
}

struct StripeGateway;

impl PaymentGateway for StripeGateway {
    fn charge(&self, cents: u64) -> Result<(), String> {
        println!("charging {cents}");
        Ok(())
    }
}
```

That gives interface-style abstraction, but Rust does not expect behavior sharing to be built around a base class.

## Polymorphism Without Inheritance

Rust gives Java developers two main ways to express polymorphism.

### Static dispatch with generics

Use this when the concrete implementation is known at compile time:

```rust
fn checkout<G: PaymentGateway>(gateway: &G, cents: u64) -> Result<(), String> {
    gateway.charge(cents)
}
```

### Dynamic dispatch with trait objects

Use this when the implementation is selected at runtime:

```rust
fn checkout_dyn(gateway: &dyn PaymentGateway, cents: u64) -> Result<(), String> {
    gateway.charge(cents)
}
```

For Java developers, the important shift is that polymorphism is not automatically tied to a class hierarchy. Dispatch choice is explicit.

## Composition Beats Inheritance

A lot of Java reuse patterns are really "I want to share capabilities" rather than "I need a deep base class."

Java developers often begin here:

```java
abstract class BaseService {
    protected final AuditClient auditClient;

    protected BaseService(AuditClient auditClient) {
        this.auditClient = auditClient;
    }

    protected void audit(String message) {
        auditClient.send(message);
    }
}
```

In Rust, that usually becomes composition:

```rust
struct AuditClient;

impl AuditClient {
    fn send(&self, message: &str) {
        println!("audit: {message}");
    }
}

struct UserService {
    audit: AuditClient,
}

impl UserService {
    fn create_user(&self, email: &str) {
        self.audit.send(&format!("create user {email}"));
    }
}
```

The behavior is shared because a field is shared, not because a parent class exists.

## Closed Variation Often Wants `enum`

Java teams sometimes reach for abstract classes and interfaces even when the domain cases are fully known. Rust usually models that kind of variation with `enum`.

```rust
enum Notification {
    Email { address: String },
    Sms { number: String },
    Push { device_id: String },
}

fn send(notification: Notification) {
    match notification {
        Notification::Email { address } => println!("email {address}"),
        Notification::Sms { number } => println!("sms {number}"),
        Notification::Push { device_id } => println!("push {device_id}"),
    }
}
```

That is often better than a hierarchy because the compiler can enforce complete handling.

## Service Design Without a DI Container

Spring and similar frameworks train Java developers to expect a container to wire everything together. Rust usually prefers constructors and explicit state:

```rust
struct UserRepository;
struct EmailClient;

struct UserService {
    repo: UserRepository,
    email: EmailClient,
}

impl UserService {
    fn new(repo: UserRepository, email: EmailClient) -> Self {
        Self { repo, email }
    }
}
```

That looks more manual at first, but it becomes much easier to read and debug because the dependency graph is plain code.

## Better Questions for Java Developers

Instead of asking:

- what is the base class?
- where is the DI container?
- which abstract service owns this behavior?

Ask:

- who owns this data?
- is this variation open or closed?
- does this behavior need static or dynamic dispatch?
- should this be a trait, a struct, or an enum?

Those questions fit Rust much better than classic OOP reflexes.

## Common Java-to-Rust OOP Mistakes

- rebuilding inheritance with unnecessary trait hierarchies
- using trait objects everywhere, even when generics would be simpler
- creating "manager" and "service" structs with vague ownership rules
- hiding optional state in many nullable-like fields instead of using `Option`
- expecting a framework to solve object graph design automatically

When Rust code starts looking like "Java without inheritance syntax," the design usually needs another pass.

## Final Thought

Rust does not ask Java developers to abandon abstraction, encapsulation, or polymorphism. It asks for better separation between:

- data ownership
- behavior abstraction
- variation modeling
- construction and wiring

Once those concerns stop being fused into "class design," Rust becomes much easier to reason about.
