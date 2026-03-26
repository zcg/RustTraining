## Object-Oriented Thinking in Rust<br><span class="zh-inline">Rust 中的面向对象思维</span>

> **What you'll learn:** How Java's object-oriented instincts map into Rust, what Rust keeps from classic OOP, what it rejects, and how to redesign Java service and domain models without forcing Rust into a class hierarchy.<br><span class="zh-inline">**本章将学习：** Java 的面向对象直觉如何迁移到 Rust，Rust 保留了经典 OOP 的哪些部分、明确舍弃了哪些部分，以及怎样重构 Java 的服务与领域模型，而不是强行把 Rust 写成 class 层级。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Java developers usually carry four strong OOP instincts:<br><span class="zh-inline">Java 开发者通常会带着四种很强的面向对象直觉：</span>

- bundle data and behavior together<br><span class="zh-inline">把数据和行为绑在一起。</span>
- reuse through inheritance<br><span class="zh-inline">通过继承做复用。</span>
- hide implementation behind interfaces<br><span class="zh-inline">通过接口隐藏实现。</span>
- let frameworks create and wire object graphs<br><span class="zh-inline">让框架负责创建和装配对象图。</span>

Rust认可其中一部分，但也会明确拒绝另一部分。<br><span class="zh-inline">Rust agrees with some of that package, and clearly rejects the rest.</span>

## What Rust Keeps<br><span class="zh-inline">Rust 保留了什么</span>

- encapsulation<br><span class="zh-inline">封装。</span>
- methods on user-defined types<br><span class="zh-inline">自定义类型上的方法。</span>
- interface-like abstraction through traits<br><span class="zh-inline">通过 trait 实现接口式抽象。</span>
- polymorphism through generics and trait objects<br><span class="zh-inline">通过泛型和 trait object 实现多态。</span>

So the right takeaway is not "Rust has no OOP."<br><span class="zh-inline">因此，正确的理解绝不是“Rust 没有 OOP”。</span>

The right takeaway is that Rust keeps the useful parts of OOP and drops the class-centric worldview.<br><span class="zh-inline">更准确的理解是：Rust 保留了 OOP 里真正有用的部分，同时丢掉了以 class 为中心的世界观。</span>

## What Rust Rejects<br><span class="zh-inline">Rust 拒绝什么</span>

- class inheritance as the main reuse mechanism<br><span class="zh-inline">把类继承当成主要复用机制。</span>
- “everything is an object” as the default worldview<br><span class="zh-inline">把“万物皆对象”当成默认世界观。</span>
- hidden ownership behind ambient references<br><span class="zh-inline">把所有权隐藏在到处可拿的引用后面。</span>
- framework-controlled object graphs as the normal structure source<br><span class="zh-inline">把框架控制的对象图当成结构的默认来源。</span>

This is why Java-shaped Rust often feels awkward.<br><span class="zh-inline">这也是为什么很多“Java 味道过重”的 Rust 代码会显得很别扭。</span>

## A Practical Translation Table<br><span class="zh-inline">一张实用映射表</span>

| Java OOP habit<br><span class="zh-inline">Java OOP 习惯</span> | Better Rust direction<br><span class="zh-inline">更合适的 Rust 方向</span> |
|---|---|
| entity class | `struct` |
| service interface | `trait` |
| abstract base class | trait plus helper `struct` or `enum`<br><span class="zh-inline">trait 配合辅助 `struct` 或 `enum`</span> |
| field injection | explicit constructor wiring<br><span class="zh-inline">显式构造装配</span> |
| inheritance reuse | composition and delegation<br><span class="zh-inline">组合与委托</span> |
| nullable property | `Option<T>` |
| exception flow | `Result<T, E>` |

## Encapsulation Still Exists<br><span class="zh-inline">封装依然存在</span>

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

Data and methods still live together, but inheritance is no longer the glue.<br><span class="zh-inline">数据和方法依然可以放在一起，只不过把它们粘起来的东西不再是继承层级。</span>

## Traits Are Interface-Like, Not Class-Like<br><span class="zh-inline">Trait 更像接口，不像类</span>

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

Traits give Java developers familiar abstraction power, but Rust does not expect a base class to sit underneath everything.<br><span class="zh-inline">trait 会提供 Java 开发者熟悉的抽象能力，但 Rust 并不期待所有东西下面都躺着一个基类。</span>

## Polymorphism Without Inheritance<br><span class="zh-inline">没有继承也能实现多态</span>

### Static dispatch with generics<br><span class="zh-inline">用泛型做静态分发</span>

```rust
fn checkout<G: PaymentGateway>(gateway: &G, cents: u64) -> Result<(), String> {
    gateway.charge(cents)
}
```

### Dynamic dispatch with trait objects<br><span class="zh-inline">用 trait object 做动态分发</span>

```rust
fn checkout_dyn(gateway: &dyn PaymentGateway, cents: u64) -> Result<(), String> {
    gateway.charge(cents)
}
```

For Java developers, the crucial shift is that dispatch choice is explicit instead of being silently bundled with class inheritance.<br><span class="zh-inline">对 Java 开发者来说，最关键的变化在于：分发方式是显式选择的，而不是默认绑死在类继承上。</span>

## Composition Beats Inheritance<br><span class="zh-inline">组合通常胜过继承</span>

```java
abstract class BaseService {
    protected final AuditClient auditClient;

    protected BaseService(AuditClient auditClient) {
        this.auditClient = auditClient;
    }
}
```

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

Shared capability comes from shared fields and delegation, not from a parent class chain.<br><span class="zh-inline">能力复用来自共享字段和委托，而不是来自一条父类链。</span>

## Closed Variation Often Wants `enum`<br><span class="zh-inline">封闭变体通常更适合 `enum`</span>

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

If the set of cases is already known, an `enum` is often more honest than an abstract hierarchy.<br><span class="zh-inline">如果所有情况本来就已经知道了，那 `enum` 往往比抽象层级更诚实。</span>

## Service Design Without a DI Container<br><span class="zh-inline">没有 DI 容器时如何设计服务</span>

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

This looks more manual at first, but it becomes much easier to read and debug because the dependency graph is plain code.<br><span class="zh-inline">这乍看会更“手工”，但由于依赖图就是普通代码，阅读和调试都会轻松很多。</span>

## Better Questions for Java Developers<br><span class="zh-inline">更适合 Java 开发者的新问题</span>

Instead of asking:<br><span class="zh-inline">别再优先问这些：</span>

- what is the base class?<br><span class="zh-inline">基类是什么？</span>
- where is the DI container?<br><span class="zh-inline">DI 容器在哪？</span>
- which abstract service owns this behavior?<br><span class="zh-inline">哪一个抽象服务拥有这段行为？</span>

Ask:<br><span class="zh-inline">更应该问这些：</span>

- who owns this data?<br><span class="zh-inline">这份数据归谁拥有？</span>
- is this variation open or closed?<br><span class="zh-inline">这类变化是开放的还是封闭的？</span>
- does this behavior need static or dynamic dispatch?<br><span class="zh-inline">这段行为需要静态分发还是动态分发？</span>
- should this be a trait, a struct, or an enum?<br><span class="zh-inline">这里到底该用 trait、struct，还是 enum？</span>

Once these questions change, Rust stops feeling restrictive and starts opening design space.<br><span class="zh-inline">一旦提问方式变了，Rust 就不再像一门处处设限的语言，而会开始真正打开设计空间。</span>

