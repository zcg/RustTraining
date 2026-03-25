## Essential Crates for C# Developers<br><span class="zh-inline">面向 C# 开发者的常用 Rust Crate</span>

> **What you'll learn:** The Rust crate equivalents for common .NET libraries: `serde` for serialization, `reqwest` for HTTP, `tokio` for async runtime, `sqlx` for database access, and a deeper look at how `serde` attributes compare with `System.Text.Json`.<br><span class="zh-inline">**本章将学到什么：** 对照理解常见 .NET 库在 Rust 世界里的替代选择，例如用 `serde` 做序列化、用 `reqwest` 做 HTTP、用 `tokio` 跑异步、用 `sqlx` 访问数据库，并进一步看清 `serde` 的属性系统与 `System.Text.Json` 之间的对应关系。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 进阶</span>

### Core Functionality Equivalents<br><span class="zh-inline">核心能力对照</span>

```rust
// Cargo.toml dependencies for C# developers
[dependencies]
# Serialization (like Newtonsoft.Json or System.Text.Json)
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# HTTP client (like HttpClient)
reqwest = { version = "0.11", features = ["json"] }

# Async runtime (like Task.Run, async/await)
tokio = { version = "1.0", features = ["full"] }

# Error handling (like custom exceptions)
thiserror = "1.0"
anyhow = "1.0"

# Logging (like ILogger, Serilog)
log = "0.4"
env_logger = "0.10"

# Date/time (like DateTime)
chrono = { version = "0.4", features = ["serde"] }

# UUID (like System.Guid)
uuid = { version = "1.0", features = ["v4", "serde"] }

# Collections (like List<T>, Dictionary<K,V>)
# Built into std, but for advanced collections:
indexmap = "2.0"  # Ordered HashMap

# Configuration (like IConfiguration)
config = "0.13"

# Database (like Entity Framework)
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "postgres", "uuid", "chrono"] }

# Testing (like xUnit, NUnit)
# Built into std, but for more features:
rstest = "0.18"  # Parameterized tests

# Mocking (like Moq)
mockall = "0.11"

# Parallel processing (like Parallel.ForEach)
rayon = "1.7"
```

这份依赖清单最适合拿来建立“Rust 生态坐标感”。<br><span class="zh-inline">它并不是说一个 crate 就能一比一复制某个 .NET 组件，而是先帮大脑建立映射关系，知道遇到 JSON、HTTP、日志、数据库、并行处理这些问题时，Rust 圈子里通常会先看哪几样工具。</span>

### Example Usage Patterns<br><span class="zh-inline">典型用法示例</span>

```rust
use serde::{Deserialize, Serialize};
use reqwest;
use tokio;
use thiserror::Error;
use chrono::{DateTime, Utc};
use uuid::Uuid;

// Data models (like C# POCOs with attributes)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub created_at: DateTime<Utc>,
}

// Custom error types (like custom exceptions)
#[derive(Error, Debug)]
pub enum ApiError {
    #[error("HTTP request failed: {0}")]
    Http(#[from] reqwest::Error),
    
    #[error("Serialization failed: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("User not found: {id}")]
    UserNotFound { id: Uuid },
    
    #[error("Validation failed: {message}")]
    Validation { message: String },
}

// Service class equivalent
pub struct UserService {
    client: reqwest::Client,
    base_url: String,
}

impl UserService {
    pub fn new(base_url: String) -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");
            
        UserService { client, base_url }
    }
    
    // Async method (like C# async Task<User>)
    pub async fn get_user(&self, id: Uuid) -> Result<User, ApiError> {
        let url = format!("{}/users/{}", self.base_url, id);
        
        let response = self.client
            .get(&url)
            .send()
            .await?;
        
        if response.status() == 404 {
            return Err(ApiError::UserNotFound { id });
        }
        
        let user = response.json::<User>().await?;
        Ok(user)
    }
    
    // Create user (like C# async Task<User>)
    pub async fn create_user(&self, name: String, email: String) -> Result<User, ApiError> {
        if name.trim().is_empty() {
            return Err(ApiError::Validation {
                message: "Name cannot be empty".to_string(),
            });
        }
        
        let new_user = User {
            id: Uuid::new_v4(),
            name,
            email,
            created_at: Utc::now(),
        };
        
        let response = self.client
            .post(&format!("{}/users", self.base_url))
            .json(&new_user)
            .send()
            .await?;
        
        let created_user = response.json::<User>().await?;
        Ok(created_user)
    }
}

// Usage example (like C# Main method)
#[tokio::main]
async fn main() -> Result<(), ApiError> {
    // Initialize logging (like configuring ILogger)
    env_logger::init();
    
    let service = UserService::new("https://api.example.com".to_string());
    
    // Create user
    let user = service.create_user(
        "John Doe".to_string(),
        "john@example.com".to_string(),
    ).await?;
    
    println!("Created user: {:?}", user);
    
    // Get user
    let retrieved_user = service.get_user(user.id).await?;
    println!("Retrieved user: {:?}", retrieved_user);
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]  // Like C# [Test] or [Fact]
    async fn test_user_creation() {
        let service = UserService::new("http://localhost:8080".to_string());
        
        let result = service.create_user(
            "Test User".to_string(),
            "test@example.com".to_string(),
        ).await;
        
        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.name, "Test User");
        assert_eq!(user.email, "test@example.com");
    }
    
    #[test]
    fn test_validation() {
        // Synchronous test
        let error = ApiError::Validation {
            message: "Invalid input".to_string(),
        };
        
        assert_eq!(error.to_string(), "Validation failed: Invalid input");
    }
}
```

这个例子能把几件事一次串起来：数据模型、错误类型、异步服务、HTTP 请求、日志初始化、测试。<br><span class="zh-inline">对 C# 开发者来说，最值得盯住的是“错误是显式类型”“异步依赖运行时”“数据结构天然和序列化系统贴合”这三点，它们会反复出现。</span>

***

<!-- ch15.1a: Serde Deep Dive for C# Developers -->
## Serde Deep Dive: JSON Serialization for C# Developers<br><span class="zh-inline">Serde 深入：面向 C# 开发者的 JSON 序列化</span>

C# developers rely heavily on `System.Text.Json` or `Newtonsoft.Json`. In Rust, **serde** is the universal serialization framework, and understanding its attribute system opens the door to most real-world data exchange scenarios.<br><span class="zh-inline">C# 里做 JSON 基本绕不开 `System.Text.Json` 或 `Newtonsoft.Json`。Rust 这边更通用的底座是 **serde**。只要把它的属性系统看明白，现实里大多数数据交换场景就都有着落了。</span>

### Basic Derive: The Starting Point<br><span class="zh-inline">基础派生：最常见的起点</span>

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct User {
    name: String,
    age: u32,
    email: String,
}

let user = User { name: "Alice".into(), age: 30, email: "alice@co.com".into() };
let json = serde_json::to_string_pretty(&user)?;
let parsed: User = serde_json::from_str(&json)?;
```

```csharp
// C# equivalent
public class User
{
    public string Name { get; set; }
    public int Age { get; set; }
    public string Email { get; set; }
}
var json = JsonSerializer.Serialize(user, new JsonSerializerOptions { WriteIndented = true });
var parsed = JsonSerializer.Deserialize<User>(json);
```

先派生 `Serialize` 和 `Deserialize`，这是大多数 serde 使用的起点。<br><span class="zh-inline">和 C# 相比，这里最大的爽点是：模型类型本身很朴素，序列化能力通过 derive 挂上去，语义还比较集中，不容易散得到处都是属性配置。</span>

### Field-Level Attributes (Like `[JsonProperty]`)<br><span class="zh-inline">字段级属性（类似 `[JsonProperty]`）</span>

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct ApiResponse {
    // Rename field in JSON output (like [JsonPropertyName("user_id")])
    #[serde(rename = "user_id")]
    id: u64,

    // Use different names for serialize vs deserialize
    #[serde(rename(serialize = "userName", deserialize = "user_name"))]
    name: String,

    // Skip this field entirely (like [JsonIgnore])
    #[serde(skip)]
    internal_cache: Option<String>,

    // Skip during serialization only
    #[serde(skip_serializing)]
    password_hash: String,

    // Default value if missing from JSON (like default constructor values)
    #[serde(default)]
    is_active: bool,

    // Custom default
    #[serde(default = "default_role")]
    role: String,

    // Flatten a nested struct into the parent (like [JsonExtensionData])
    #[serde(flatten)]
    metadata: Metadata,

    // Skip if the value is None (omit null fields)
    #[serde(skip_serializing_if = "Option::is_none")]
    nickname: Option<String>,
}

fn default_role() -> String { "viewer".into() }

#[derive(Serialize, Deserialize, Debug)]
struct Metadata {
    created_at: String,
    version: u32,
}
```

```csharp
// C# equivalent attributes
public class ApiResponse
{
    [JsonPropertyName("user_id")]
    public ulong Id { get; set; }

    [JsonIgnore]
    public string? InternalCache { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? Metadata { get; set; }
}
```

字段级属性是 serde 最常打交道的地方。<br><span class="zh-inline">改字段名、跳过字段、补默认值、在父对象里拍平子对象，这些操作都很常见。看多了就会发现，serde 这套东西虽然密，但条理其实挺直，不算阴间。</span>

### Enum Representations (Critical Difference from C#)<br><span class="zh-inline">枚举表示方式（和 C# 的关键差异）</span>

Rust serde supports **four different JSON representations** for enums. That has no direct C# equivalent, because C# enums usually只是整数或字符串标签，而 Rust 的 `enum` 本身可以携带数据。<br><span class="zh-inline">serde 支持 **四种不同的枚举 JSON 表示方式**。这在 C# 里没有完全对应的原生概念，因为 C# 的 enum 通常只是数字或字符串标签，而 Rust 的 `enum` 可以直接带结构化数据。</span>

```rust
use serde::{Deserialize, Serialize};

// 1. Externally tagged (DEFAULT) — most common
#[derive(Serialize, Deserialize)]
enum Message {
    Text(String),
    Image { url: String, width: u32 },
    Ping,
}
// Text variant:  {"Text": "hello"}
// Image variant: {"Image": {"url": "...", "width": 100}}
// Ping variant:  "Ping"

// 2. Internally tagged — like discriminated unions in other languages
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
enum Event {
    Created { id: u64, name: String },
    Deleted { id: u64 },
    Updated { id: u64, fields: Vec<String> },
}
// {"type": "Created", "id": 1, "name": "Alice"}
// {"type": "Deleted", "id": 1}

// 3. Adjacently tagged — tag and content in separate fields
#[derive(Serialize, Deserialize)]
#[serde(tag = "t", content = "c")]
enum ApiResult {
    Success(UserData),
    Error(String),
}
// {"t": "Success", "c": {"name": "Alice"}}
// {"t": "Error", "c": "not found"}

// 4. Untagged — serde tries each variant in order
#[derive(Serialize, Deserialize)]
#[serde(untagged)]
enum FlexibleValue {
    Integer(i64),
    Float(f64),
    Text(String),
    Bool(bool),
}
// 42, 3.14, "hello", true — serde auto-detects the variant
```

这部分特别值得反复看。<br><span class="zh-inline">很多 C# 开发者刚进 Rust 时，会把 `enum` 误会成“只是更高级一点的枚举值”。其实它更像是内建的代数数据类型。也正因为如此，serde 才会围着它提供这么多表示方式。</span>

### Custom Serialization (Like `JsonConverter`)<br><span class="zh-inline">自定义序列化（类似 `JsonConverter`）</span>

```rust
use serde::{Deserialize, Deserializer, Serialize, Serializer};

// Custom serialization for a specific field
#[derive(Serialize, Deserialize)]
struct Config {
    #[serde(serialize_with = "serialize_duration", deserialize_with = "deserialize_duration")]
    timeout: std::time::Duration,
}

fn serialize_duration<S: Serializer>(dur: &std::time::Duration, s: S) -> Result<S::Ok, S::Error> {
    s.serialize_u64(dur.as_millis() as u64)
}

fn deserialize_duration<'de, D: Deserializer<'de>>(d: D) -> Result<std::time::Duration, D::Error> {
    let ms = u64::deserialize(d)?;
    Ok(std::time::Duration::from_millis(ms))
}
// JSON: {"timeout": 5000}  <->  Config { timeout: Duration::from_millis(5000) }
```

如果内建映射满足不了需求，就该上自定义序列化逻辑了。<br><span class="zh-inline">这一块和 C# 里写 `JsonConverter` 的思路很像：把领域类型和外部表示之间那层转换关系明确写出来，别靠临时修修补补混过去。</span>

### Container-Level Attributes<br><span class="zh-inline">容器级属性</span>

```rust
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]  // All fields become camelCase in JSON
struct UserProfile {
    first_name: String,      // -> "firstName"
    last_name: String,       // -> "lastName"
    email_address: String,   // -> "emailAddress"
}

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]  // Reject JSON with extra fields (strict parsing)
struct StrictConfig {
    port: u16,
    host: String,
}
// serde_json::from_str::<StrictConfig>(r#"{"port":8080,"host":"localhost","extra":true}"#)
// -> Error: unknown field `extra`
```

容器级属性控制的是“整个类型”的约束和命名策略。<br><span class="zh-inline">像 `rename_all = "camelCase"` 这种配置，在对接前端或外部 JSON API 时非常省事；`deny_unknown_fields` 则适合用在希望解析更严格的配置对象上。</span>

### Quick Reference: Serde Attributes<br><span class="zh-inline">Serde 属性速查表</span>

| Attribute<br><span class="zh-inline">属性</span> | Level<br><span class="zh-inline">作用层级</span> | C# Equivalent<br><span class="zh-inline">C# 对应概念</span> | Purpose<br><span class="zh-inline">用途</span> |
|-----------|-------|---------------|---------|
| `#[serde(rename = "...")]`<br><span class="zh-inline">`#[serde(rename = "...")]`</span> | Field<br><span class="zh-inline">字段</span> | `[JsonPropertyName]`<br><span class="zh-inline">`[JsonPropertyName]`</span> | Rename in JSON<br><span class="zh-inline">修改 JSON 中的字段名。</span> |
| `#[serde(skip)]`<br><span class="zh-inline">`#[serde(skip)]`</span> | Field<br><span class="zh-inline">字段</span> | `[JsonIgnore]`<br><span class="zh-inline">`[JsonIgnore]`</span> | Omit entirely<br><span class="zh-inline">序列化和反序列化都忽略。</span> |
| `#[serde(default)]`<br><span class="zh-inline">`#[serde(default)]`</span> | Field<br><span class="zh-inline">字段</span> | Default value<br><span class="zh-inline">默认值</span> | Use `Default::default()` if missing<br><span class="zh-inline">字段缺失时使用默认值。</span> |
| `#[serde(flatten)]`<br><span class="zh-inline">`#[serde(flatten)]`</span> | Field<br><span class="zh-inline">字段</span> | `[JsonExtensionData]`<br><span class="zh-inline">`[JsonExtensionData]`</span> | Merge nested struct into parent<br><span class="zh-inline">把嵌套结构拍平到父对象里。</span> |
| `#[serde(skip_serializing_if = "...")]`<br><span class="zh-inline">`#[serde(skip_serializing_if = "...")]`</span> | Field<br><span class="zh-inline">字段</span> | `JsonIgnoreCondition`<br><span class="zh-inline">`JsonIgnoreCondition`</span> | Conditional skip<br><span class="zh-inline">按条件跳过序列化。</span> |
| `#[serde(rename_all = "camelCase")]`<br><span class="zh-inline">`#[serde(rename_all = "camelCase")]`</span> | Container<br><span class="zh-inline">容器</span> | `JsonSerializerOptions.PropertyNamingPolicy`<br><span class="zh-inline">`JsonSerializerOptions.PropertyNamingPolicy`</span> | Naming convention<br><span class="zh-inline">统一命名风格。</span> |
| `#[serde(deny_unknown_fields)]`<br><span class="zh-inline">`#[serde(deny_unknown_fields)]`</span> | Container<br><span class="zh-inline">容器</span> | — | Strict deserialization<br><span class="zh-inline">拒绝未知字段，按严格模式解析。</span> |
| `#[serde(tag = "type")]`<br><span class="zh-inline">`#[serde(tag = "type")]`</span> | Enum<br><span class="zh-inline">枚举</span> | Discriminator pattern<br><span class="zh-inline">判别字段模式</span> | Internal tagging<br><span class="zh-inline">使用内部标签表示枚举分支。</span> |
| `#[serde(untagged)]`<br><span class="zh-inline">`#[serde(untagged)]`</span> | Enum<br><span class="zh-inline">枚举</span> | — | Try variants in order<br><span class="zh-inline">按顺序尝试各分支。</span> |
| `#[serde(with = "...")]`<br><span class="zh-inline">`#[serde(with = "...")]`</span> | Field<br><span class="zh-inline">字段</span> | `[JsonConverter]`<br><span class="zh-inline">`[JsonConverter]`</span> | Custom ser/de<br><span class="zh-inline">接入自定义序列化和反序列化。</span> |

### Beyond JSON: serde Works Everywhere<br><span class="zh-inline">不止 JSON：serde 到处都能用</span>

```rust
// The SAME derive works for ALL formats — just change the crate
let user = User { name: "Alice".into(), age: 30, email: "a@b.com".into() };

let json  = serde_json::to_string(&user)?;        // JSON
let toml  = toml::to_string(&user)?;              // TOML (config files)
let yaml  = serde_yaml::to_string(&user)?;        // YAML
let cbor  = serde_cbor::to_vec(&user)?;           // CBOR (binary, compact)
let msgpk = rmp_serde::to_vec(&user)?;            // MessagePack (binary)

// One #[derive(Serialize, Deserialize)] — every format for free
```

serde 最让人舒服的一点就在这。<br><span class="zh-inline">数据模型写好、derive 挂好，换个格式往往只是换个 crate 的函数调用，模型本身基本不用动。这个统一性在跨协议、跨格式的系统里非常值钱。</span>

***
