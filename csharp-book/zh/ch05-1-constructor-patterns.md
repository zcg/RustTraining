## Constructor Patterns<br><span class="zh-inline">构造器模式</span>

> **What you'll learn:** How to create Rust structs without traditional constructors — `new()` conventions, the `Default` trait, factory methods, and the builder pattern for complex initialization.<br><span class="zh-inline">**本章将学到什么：** Rust 在没有传统类构造函数的前提下，通常如何创建结构体，包括 `new()` 约定、`Default` trait、工厂方法，以及复杂初始化常用的 builder 模式。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 入门</span>

### C# Constructor Patterns<br><span class="zh-inline">C# 里的构造器模式</span>

```csharp
public class Configuration
{
    public string DatabaseUrl { get; set; }
    public int MaxConnections { get; set; }
    public bool EnableLogging { get; set; }
    
    // Default constructor
    public Configuration()
    {
        DatabaseUrl = "localhost";
        MaxConnections = 10;
        EnableLogging = false;
    }
    
    // Parameterized constructor
    public Configuration(string databaseUrl, int maxConnections)
    {
        DatabaseUrl = databaseUrl;
        MaxConnections = maxConnections;
        EnableLogging = false;
    }
    
    // Factory method
    public static Configuration ForProduction()
    {
        return new Configuration("prod.db.server", 100)
        {
            EnableLogging = true
        };
    }
}
```

C# 的写法很顺：默认构造器、带参构造器、静态工厂，全都围着类构造函数转。很多开发者刚到 Rust 时，最先懵的一下就是“诶，构造函数呢？”<br><span class="zh-inline">答案是 Rust 压根没有语言层面的专用构造函数语法，但这不代表它没有成熟模式，反而是把选择权交给了类型本身。</span>

### Rust Constructor Patterns<br><span class="zh-inline">Rust 的构造器模式</span>

```rust
#[derive(Debug)]
pub struct Configuration {
    pub database_url: String,
    pub max_connections: u32,
    pub enable_logging: bool,
}

impl Configuration {
    // Default constructor
    pub fn new() -> Configuration {
        Configuration {
            database_url: "localhost".to_string(),
            max_connections: 10,
            enable_logging: false,
        }
    }
    
    // Parameterized constructor
    pub fn with_database(database_url: String, max_connections: u32) -> Configuration {
        Configuration {
            database_url,
            max_connections,
            enable_logging: false,
        }
    }
    
    // Factory method
    pub fn for_production() -> Configuration {
        Configuration {
            database_url: "prod.db.server".to_string(),
            max_connections: 100,
            enable_logging: true,
        }
    }
    
    // Builder pattern method
    pub fn enable_logging(mut self) -> Configuration {
        self.enable_logging = true;
        self  // Return self for chaining
    }
    
    pub fn max_connections(mut self, count: u32) -> Configuration {
        self.max_connections = count;
        self
    }
}

// Default trait implementation
impl Default for Configuration {
    fn default() -> Self {
        Self::new()
    }
}

fn main() {
    // Different construction patterns
    let config1 = Configuration::new();
    let config2 = Configuration::with_database("localhost:5432".to_string(), 20);
    let config3 = Configuration::for_production();
    
    // Builder pattern
    let config4 = Configuration::new()
        .enable_logging()
        .max_connections(50);
    
    // Using Default trait
    let config5 = Configuration::default();
    
    println!("{:?}", config4);
}
```

Rust 的常见套路，是在 `impl` 里自己定义 `new()`、`with_xxx()`、`for_production()` 这种关联函数。它们看着像构造器，实际上只是普通关联函数，但完全够用，而且命名更自由。<br><span class="zh-inline">也就是说，Rust 并不是“没有构造方案”，而是没有把构造强塞进语言语法里，反而让接口设计更明确。</span>

### `Default` Is More Important Than It Looks<br><span class="zh-inline">`Default` 的地位比表面看起来更重要</span>

很多 C# 开发者会下意识去找“无参构造函数”的平替。Rust 里更常见的答案是 `Default`。<br><span class="zh-inline">只要类型有一个合理的默认值集合，实现 `Default` 通常比单独搞一堆“空构造器”更顺手，因为生态里很多泛型组件也会优先认这个 trait。</span>

如果默认值语义明确，用 `Configuration::default()` 往往比 `Configuration::new()` 更能表达意图。反过来，如果默认值并不天然成立，而是某种具体场景的初始化，那继续保留 `new()` 或命名工厂方法会更清楚。<br><span class="zh-inline">别把所有初始化都一股脑塞进 `Default`，那样也容易把接口搞脏。</span>

### Builder Pattern Implementation<br><span class="zh-inline">Builder 模式实现</span>

```rust
// More complex builder pattern
#[derive(Debug)]
pub struct DatabaseConfig {
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
    ssl_enabled: bool,
    timeout_seconds: u64,
}

pub struct DatabaseConfigBuilder {
    host: Option<String>,
    port: Option<u16>,
    username: Option<String>,
    password: Option<String>,
    ssl_enabled: bool,
    timeout_seconds: u64,
}

impl DatabaseConfigBuilder {
    pub fn new() -> Self {
        DatabaseConfigBuilder {
            host: None,
            port: None,
            username: None,
            password: None,
            ssl_enabled: false,
            timeout_seconds: 30,
        }
    }
    
    pub fn host(mut self, host: impl Into<String>) -> Self {
        self.host = Some(host.into());
        self
    }
    
    pub fn port(mut self, port: u16) -> Self {
        self.port = Some(port);
        self
    }
    
    pub fn username(mut self, username: impl Into<String>) -> Self {
        self.username = Some(username.into());
        self
    }
    
    pub fn password(mut self, password: impl Into<String>) -> Self {
        self.password = Some(password.into());
        self
    }
    
    pub fn enable_ssl(mut self) -> Self {
        self.ssl_enabled = true;
        self
    }
    
    pub fn timeout(mut self, seconds: u64) -> Self {
        self.timeout_seconds = seconds;
        self
    }
    
    pub fn build(self) -> Result<DatabaseConfig, String> {
        let host = self.host.ok_or("Host is required")?;
        let port = self.port.ok_or("Port is required")?;
        let username = self.username.ok_or("Username is required")?;
        
        Ok(DatabaseConfig {
            host,
            port,
            username,
            password: self.password,
            ssl_enabled: self.ssl_enabled,
            timeout_seconds: self.timeout_seconds,
        })
    }
}

fn main() {
    let config = DatabaseConfigBuilder::new()
        .host("localhost")
        .port(5432)
        .username("admin")
        .password("secret123")
        .enable_ssl()
        .timeout(60)
        .build()
        .expect("Failed to build config");
    
    println!("{:?}", config);
}
```

当初始化参数多、可选项多、还带校验逻辑时，builder 模式基本就是最稳妥的解法。它能把“逐步填写字段”和“最终一致性检查”拆开。<br><span class="zh-inline">比起一个十几个参数的大构造器，builder 读起来不容易串参数，维护时也更容易扩展。</span>

Rust 的 builder 还有个常见优势，就是链式 API 可以直接消费 `self` 返回新值，写起来非常顺。<br><span class="zh-inline">如果再配合 typestate，还能把“哪些字段必填”也编码进类型系统，不过那就属于进阶玩法了。</span>

---

## Exercises<br><span class="zh-inline">练习</span>

<details>
<summary><strong>🏋️ Exercise: Builder with Validation</strong> <span class="zh-inline">🏋️ 练习：带校验的 builder</span></summary>

Create an `EmailBuilder` that:<br><span class="zh-inline">请实现一个 `EmailBuilder`，要求如下：</span>

1. Requires `to` and `subject` (builder won't compile without them — use a typestate or validate in `build()`)<br><span class="zh-inline">1. `to` 和 `subject` 是必填项。可以用 typestate，也可以在 `build()` 里做校验。</span>
2. Has optional `body` and `cc` (Vec of addresses)<br><span class="zh-inline">2. `body` 和 `cc` 是可选项，其中 `cc` 是地址列表。</span>
3. `build()` returns `Result<Email, String>` — rejects empty `to` or `subject`<br><span class="zh-inline">3. `build()` 返回 `Result<Email, String>`，空的 `to` 或 `subject` 必须被拒绝。</span>
4. Write tests proving invalid inputs are rejected<br><span class="zh-inline">4. 编写测试，证明非法输入会被正确拒绝。</span>

<details>
<summary>🔑 Solution <span class="zh-inline">🔑 参考答案</span></summary>

```rust
#[derive(Debug)]
struct Email {
    to: String,
    subject: String,
    body: Option<String>,
    cc: Vec<String>,
}

#[derive(Default)]
struct EmailBuilder {
    to: Option<String>,
    subject: Option<String>,
    body: Option<String>,
    cc: Vec<String>,
}

impl EmailBuilder {
    fn new() -> Self { Self::default() }

    fn to(mut self, to: impl Into<String>) -> Self {
        self.to = Some(to.into()); self
    }
    fn subject(mut self, subject: impl Into<String>) -> Self {
        self.subject = Some(subject.into()); self
    }
    fn body(mut self, body: impl Into<String>) -> Self {
        self.body = Some(body.into()); self
    }
    fn cc(mut self, addr: impl Into<String>) -> Self {
        self.cc.push(addr.into()); self
    }
    fn build(self) -> Result<Email, String> {
        let to = self.to.filter(|s| !s.is_empty())
            .ok_or("'to' is required")?;
        let subject = self.subject.filter(|s| !s.is_empty())
            .ok_or("'subject' is required")?;
        Ok(Email { to, subject, body: self.body, cc: self.cc })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn valid_email() {
        let email = EmailBuilder::new()
            .to("alice@example.com")
            .subject("Hello")
            .build();
        assert!(email.is_ok());
    }
    #[test]
    fn missing_to_fails() {
        let email = EmailBuilder::new().subject("Hello").build();
        assert!(email.is_err());
    }
}
```

这里答案选的是“在 `build()` 里集中校验”的做法，优点是实现简单、容易读懂。<br><span class="zh-inline">如果后续想再上一个台阶，可以把 builder 改造成 typestate 版本，让缺失必填项这件事直接变成编译错误。</span>

</details>
</details>

***
