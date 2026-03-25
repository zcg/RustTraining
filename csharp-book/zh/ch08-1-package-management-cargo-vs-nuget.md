## Package Management: Cargo vs NuGet<br><span class="zh-inline">包管理：Cargo 与 NuGet 对照</span>

> **What you'll learn:** `Cargo.toml` vs `.csproj`, version specifiers, `Cargo.lock`, feature flags for conditional compilation, and common Cargo commands mapped to their NuGet/dotnet equivalents.<br><span class="zh-inline">**本章将学到什么：** `Cargo.toml` 和 `.csproj` 的对应关系，版本约束写法，`Cargo.lock` 的作用，条件编译里的 feature flag，以及常见 Cargo 命令和 NuGet / dotnet 命令之间的映射。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 入门</span>

### Dependency Declaration<br><span class="zh-inline">依赖声明</span>

#### C# NuGet Dependencies<br><span class="zh-inline">C# 的 NuGet 依赖</span>

```xml
<!-- MyApp.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  
  <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  <PackageReference Include="Serilog" Version="3.0.1" />
  <PackageReference Include="Microsoft.AspNetCore.App" />
  
  <ProjectReference Include="../MyLibrary/MyLibrary.csproj" />
</Project>
```

#### Rust Cargo Dependencies<br><span class="zh-inline">Rust 的 Cargo 依赖</span>

```toml
# Cargo.toml
[package]
name = "my_app"
version = "0.1.0"
edition = "2021"

[dependencies]
serde_json = "1.0"               # From crates.io (like NuGet)
serde = { version = "1.0", features = ["derive"] }  # With features
log = "0.4"
tokio = { version = "1.0", features = ["full"] }

# Local dependencies (like ProjectReference)
my_library = { path = "../my_library" }

# Git dependencies
my_git_crate = { git = "https://github.com/user/repo" }

# Development dependencies (like test packages)
[dev-dependencies]
criterion = "0.5"               # Benchmarking
proptest = "1.0"               # Property testing
```

### Version Management<br><span class="zh-inline">版本管理</span>

#### C# Package Versioning<br><span class="zh-inline">C# 的包版本管理</span>

```xml
<!-- Centralized package management (Directory.Packages.props) -->
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  
  <PackageVersion Include="Newtonsoft.Json" Version="13.0.3" />
  <PackageVersion Include="Serilog" Version="3.0.1" />
</Project>

<!-- packages.lock.json for reproducible builds -->
```

#### Rust Version Management<br><span class="zh-inline">Rust 的版本管理</span>

```toml
# Cargo.toml - Semantic versioning
[dependencies]
serde = "1.0"        # Compatible with 1.x.x (>=1.0.0, <2.0.0)
log = "0.4.17"       # Compatible with 0.4.x (>=0.4.17, <0.5.0)
regex = "=1.5.4"     # Exact version
chrono = "^0.4"      # Caret requirements (default)
uuid = "~1.3.0"      # Tilde requirements (>=1.3.0, <1.4.0)

# Cargo.lock - Exact versions for reproducible builds (auto-generated)
[[package]]
name = "serde"
version = "1.0.163"
# ... exact dependency tree
```

### Package Sources<br><span class="zh-inline">包源</span>

#### C# Package Sources<br><span class="zh-inline">C# 的包源</span>

```xml
<!-- nuget.config -->
<configuration>
  <packageSources>
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <add key="MyCompanyFeed" value="https://pkgs.dev.azure.com/company/_packaging/feed/nuget/v3/index.json" />
  </packageSources>
</configuration>
```

#### Rust Package Sources<br><span class="zh-inline">Rust 的包源</span>

```toml
# .cargo/config.toml
[source.crates-io]
replace-with = "my-awesome-registry"

[source.my-awesome-registry]
registry = "https://my-intranet:8080/index"

# Alternative registries
[registries]
my-registry = { index = "https://my-intranet:8080/index" }

# In Cargo.toml
[dependencies]
my_crate = { version = "1.0", registry = "my-registry" }
```

### Common Commands Comparison<br><span class="zh-inline">常用命令对照</span>

| Task | C# Command | Rust Command |
|------|------------|-------------|
| Restore packages<br><span class="zh-inline">恢复依赖</span> | `dotnet restore`<br><span class="zh-inline">`dotnet restore`</span> | `cargo fetch`<br><span class="zh-inline">`cargo fetch`</span> |
| Add package<br><span class="zh-inline">新增包</span> | `dotnet add package Newtonsoft.Json`<br><span class="zh-inline">`dotnet add package Newtonsoft.Json`</span> | `cargo add serde_json`<br><span class="zh-inline">`cargo add serde_json`</span> |
| Remove package<br><span class="zh-inline">删除包</span> | `dotnet remove package Newtonsoft.Json`<br><span class="zh-inline">`dotnet remove package Newtonsoft.Json`</span> | `cargo remove serde_json`<br><span class="zh-inline">`cargo remove serde_json`</span> |
| Update packages<br><span class="zh-inline">更新依赖</span> | `dotnet update`<br><span class="zh-inline">`dotnet update`</span> | `cargo update`<br><span class="zh-inline">`cargo update`</span> |
| List packages<br><span class="zh-inline">列出依赖</span> | `dotnet list package`<br><span class="zh-inline">`dotnet list package`</span> | `cargo tree`<br><span class="zh-inline">`cargo tree`</span> |
| Audit security<br><span class="zh-inline">安全审计</span> | `dotnet list package --vulnerable`<br><span class="zh-inline">`dotnet list package --vulnerable`</span> | `cargo audit`<br><span class="zh-inline">`cargo audit`</span> |
| Clean build<br><span class="zh-inline">清理构建</span> | `dotnet clean`<br><span class="zh-inline">`dotnet clean`</span> | `cargo clean`<br><span class="zh-inline">`cargo clean`</span> |

### Features: Conditional Compilation<br><span class="zh-inline">Feature：条件编译</span>

#### C# Conditional Compilation<br><span class="zh-inline">C# 条件编译</span>

```csharp
#if DEBUG
    Console.WriteLine("Debug mode");
#elif RELEASE
    Console.WriteLine("Release mode");
#endif

// Project file features
<PropertyGroup Condition="'$(Configuration)'=='Debug'">
    <DefineConstants>DEBUG;TRACE</DefineConstants>
</PropertyGroup>
```

#### Rust Feature Gates<br><span class="zh-inline">Rust 的 Feature Gate</span>

```toml
# Cargo.toml
[features]
default = ["json"]              # Default features
json = ["serde_json"]          # Feature that enables serde_json
xml = ["serde_xml"]            # Alternative serialization
advanced = ["json", "xml"]     # Composite feature

[dependencies]
serde_json = { version = "1.0", optional = true }
serde_xml = { version = "0.4", optional = true }
```

```rust
// Conditional compilation based on features
#[cfg(feature = "json")]
use serde_json;

#[cfg(feature = "xml")]
use serde_xml;

pub fn serialize_data(data: &MyStruct) -> String {
    #[cfg(feature = "json")]
    return serde_json::to_string(data).unwrap();
    
    #[cfg(feature = "xml")]
    return serde_xml::to_string(data).unwrap();
    
    #[cfg(not(any(feature = "json", feature = "xml")))]
    return "No serialization feature enabled".to_string();
}
```

### Using External Crates<br><span class="zh-inline">使用外部 crate</span>

#### Popular Crates for C# Developers<br><span class="zh-inline">适合 C# 开发者的常见 crate</span>

| C# Library | Rust Crate | Purpose |
|------------|------------|---------|
| Newtonsoft.Json<br><span class="zh-inline">Newtonsoft.Json</span> | `serde_json`<br><span class="zh-inline">`serde_json`</span> | JSON serialization<br><span class="zh-inline">JSON 序列化</span> |
| HttpClient<br><span class="zh-inline">HttpClient</span> | `reqwest`<br><span class="zh-inline">`reqwest`</span> | HTTP client<br><span class="zh-inline">HTTP 客户端</span> |
| Entity Framework<br><span class="zh-inline">Entity Framework</span> | `diesel` / `sqlx`<br><span class="zh-inline">`diesel` / `sqlx`</span> | ORM / SQL toolkit<br><span class="zh-inline">ORM / SQL 工具箱</span> |
| NLog/Serilog<br><span class="zh-inline">NLog / Serilog</span> | `log` + `env_logger`<br><span class="zh-inline">`log` + `env_logger`</span> | Logging<br><span class="zh-inline">日志</span> |
| xUnit/NUnit<br><span class="zh-inline">xUnit / NUnit</span> | Built-in `#[test]`<br><span class="zh-inline">内建 `#[test]`</span> | Unit testing<br><span class="zh-inline">单元测试</span> |
| Moq<br><span class="zh-inline">Moq</span> | `mockall`<br><span class="zh-inline">`mockall`</span> | Mocking<br><span class="zh-inline">Mock</span> |
| Flurl<br><span class="zh-inline">Flurl</span> | `url`<br><span class="zh-inline">`url`</span> | URL manipulation<br><span class="zh-inline">URL 处理</span> |
| Polly<br><span class="zh-inline">Polly</span> | `tower`<br><span class="zh-inline">`tower`</span> | Resilience patterns<br><span class="zh-inline">弹性治理模式</span> |

#### Example: HTTP Client Migration<br><span class="zh-inline">示例：HTTP 客户端迁移</span>

```csharp
// C# HttpClient usage
public class ApiClient
{
    private readonly HttpClient _httpClient;
    
    public async Task<User> GetUserAsync(int id)
    {
        var response = await _httpClient.GetAsync($"/users/{id}");
        var json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<User>(json);
    }
}
```

```rust
// Rust reqwest usage
use reqwest;
use serde::Deserialize;

#[derive(Deserialize)]
struct User {
    id: u32,
    name: String,
}

struct ApiClient {
    client: reqwest::Client,
}

impl ApiClient {
    async fn get_user(&self, id: u32) -> Result<User, reqwest::Error> {
        let user = self.client
            .get(&format!("https://api.example.com/users/{}", id))
            .send()
            .await?
            .json::<User>()
            .await?;
        
        Ok(user)
    }
}
```

***

## Workspaces vs Monorepos<br><span class="zh-inline">Workspace 与 Monorepo</span>

### Python Monorepo (typical)<br><span class="zh-inline">Python 里的典型 Monorepo</span>

```text
# Python monorepo (various approaches, no standard)
myproject/
├── pyproject.toml           # Root project
├── packages/
│   ├── core/
│   │   ├── pyproject.toml   # Each package has its own config
│   │   └── src/core/...
│   ├── api/
│   │   ├── pyproject.toml
│   │   └── src/api/...
│   └── cli/
│       ├── pyproject.toml
│       └── src/cli/...
# Tools: poetry workspaces, pip -e ., uv workspaces — no standard
```

### Rust Workspace<br><span class="zh-inline">Rust Workspace</span>

```toml
# Rust — Cargo.toml at root
[workspace]
members = [
    "core",
    "api",
    "cli",
]

# Shared dependencies across workspace
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
```

```text
# Rust workspace structure — standardized, built into Cargo
myproject/
├── Cargo.toml               # Workspace root
├── Cargo.lock               # Single lock file for all crates
├── core/
│   ├── Cargo.toml            # [dependencies] serde.workspace = true
│   └── src/lib.rs
├── api/
│   ├── Cargo.toml
│   └── src/lib.rs
└── cli/
    ├── Cargo.toml
    └── src/main.rs
```

```bash
# Workspace commands
cargo build                  # Build everything
cargo test                   # Test everything
cargo build -p core          # Build just the core crate
cargo test -p api            # Test just the api crate
cargo clippy --all           # Lint everything
```

> **Key insight**: Rust workspaces are first-class, built into Cargo. Python monorepos require third-party tools (poetry, uv, pants) with varying levels of support. In a Rust workspace, all crates share a single `Cargo.lock`, ensuring consistent dependency versions across the project.<br><span class="zh-inline">**关键认识**：Rust 的 workspace 是 Cargo 一等公民，原生就支持。Python 的 monorepo 通常得靠 poetry、uv、pants 这类第三方工具，支持程度参差不齐。Rust workspace 里所有 crate 共用一个 `Cargo.lock`，因此整仓依赖版本始终一致。</span>

---

## Exercises<br><span class="zh-inline">练习</span>

<details>
<summary><strong>🏋️ Exercise: Module Visibility</strong> <span class="zh-inline">🏋️ 练习：模块可见性</span></summary>

**Challenge**: Given this module structure, predict which lines compile and which don't:<br><span class="zh-inline">**挑战题**：给定下面这个模块结构，判断哪几行可以编译，哪几行不行：</span>

```rust
mod kitchen {
    fn secret_recipe() -> &'static str { "42 spices" }
    pub fn menu() -> &'static str { "Today's special" }

    pub mod staff {
        pub fn cook() -> String {
            format!("Cooking with {}", super::secret_recipe())
        }
    }
}

fn main() {
    println!("{}", kitchen::menu());             // Line A
    println!("{}", kitchen::secret_recipe());     // Line B
    println!("{}", kitchen::staff::cook());       // Line C
}
```

<details>
<summary>🔑 Solution <span class="zh-inline">🔑 参考答案</span></summary>

- **Line A**: ✅ Compiles — `menu()` is `pub`<br><span class="zh-inline">**A 行**：✅ 能编译，因为 `menu()` 是 `pub`。</span>
- **Line B**: ❌ Compile error — `secret_recipe()` is private to `kitchen`<br><span class="zh-inline">**B 行**：❌ 编译失败，因为 `secret_recipe()` 只在 `kitchen` 模块内部可见。</span>
- **Line C**: ✅ Compiles — `staff::cook()` is `pub`, and `cook()` can access `secret_recipe()` via `super::` (child modules can access parent's private items)<br><span class="zh-inline">**C 行**：✅ 能编译，因为 `staff::cook()` 是 `pub`，而且子模块可以通过 `super::` 访问父模块的私有成员。</span>

**Key takeaway**: In Rust, child modules can see parent's privates (like Python's `_private` convention, but enforced). Outsiders cannot. This is the opposite of Python where `_private` is just a hint.<br><span class="zh-inline">**关键结论**：在 Rust 里，子模块能看见父模块的私有项，这一点有点像 Python 里约定俗成的 `_private`，但 Rust 是编译器强制执行的。外部模块则完全看不到。这和 Python 那种“只是提醒一下”的私有约定是两回事。</span>

</details>
</details>

***
