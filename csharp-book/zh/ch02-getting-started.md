## Installation and Setup<br><span class="zh-inline">安装与环境准备</span>

> **What you'll learn:** How to install Rust and set up your IDE, the Cargo build system vs MSBuild/NuGet, your first Rust program compared to C#, and how to read command-line input.<br><span class="zh-inline">**本章将学到什么：** 如何安装 Rust 并配置开发环境，Cargo 构建系统和 MSBuild / NuGet 的对应关系，第一段 Rust 程序和 C# 的对照，以及如何读取命令行输入。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 入门</span>

### Installing Rust<br><span class="zh-inline">安装 Rust</span>

```bash
# Install Rust (works on Windows, macOS, Linux)
# 安装 Rust（Windows、macOS、Linux 都可用）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# On Windows, you can also download from: https://rustup.rs/
# 在 Windows 上也可以直接从这个地址下载安装包：https://rustup.rs/
```

### Rust Tools vs C# Tools<br><span class="zh-inline">Rust 工具链与 C# 工具链对照</span>

| C# Tool<br><span class="zh-inline">C# 工具</span> | Rust Equivalent<br><span class="zh-inline">Rust 对应物</span> | Purpose<br><span class="zh-inline">作用</span> |
|---------|----------------|---------|
| `dotnet new` | `cargo new` | Create new project<br><span class="zh-inline">创建新项目</span> |
| `dotnet build` | `cargo build` | Compile project<br><span class="zh-inline">编译项目</span> |
| `dotnet run` | `cargo run` | Run project<br><span class="zh-inline">运行项目</span> |
| `dotnet test` | `cargo test` | Run tests<br><span class="zh-inline">运行测试</span> |
| NuGet | Crates.io | Package repository<br><span class="zh-inline">包仓库</span> |
| MSBuild | Cargo | Build system<br><span class="zh-inline">构建系统</span> |
| Visual Studio | VS Code + rust-analyzer | IDE<br><span class="zh-inline">集成开发环境</span> |

### IDE Setup<br><span class="zh-inline">IDE 配置</span>

1. **VS Code** (Recommended for beginners)<br><span class="zh-inline">1. **VS Code**（适合刚上手的人）</span>
   - Install the `rust-analyzer` extension<br><span class="zh-inline">安装 `rust-analyzer` 扩展</span>
   - Install `CodeLLDB` for debugging<br><span class="zh-inline">安装 `CodeLLDB` 作为调试器</span>

2. **Visual Studio** (Windows)<br><span class="zh-inline">2. **Visual Studio**（Windows）</span>
   - Install a Rust support extension<br><span class="zh-inline">安装 Rust 支持扩展</span>

3. **JetBrains RustRover** (Full IDE)<br><span class="zh-inline">3. **JetBrains RustRover**（完整 IDE）</span>
   - Similar to Rider for C# developers<br><span class="zh-inline">对 C# 开发者来说，使用感受和 Rider 比较接近</span>

***

## Your First Rust Program<br><span class="zh-inline">第一段 Rust 程序</span>

### C# Hello World<br><span class="zh-inline">C# 版 Hello World</span>

```csharp
// Program.cs
using System;

namespace HelloWorld
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
        }
    }
}
```

### Rust Hello World<br><span class="zh-inline">Rust 版 Hello World</span>

```rust
// main.rs
fn main() {
    println!("Hello, World!");
}
```

### Key Differences for C# Developers<br><span class="zh-inline">C# 开发者需要先记住的差别</span>

1. **No classes required** - Functions can exist at the top level<br><span class="zh-inline">1. **不需要类**，函数可以直接定义在顶层。</span>
2. **No namespaces** - Uses module system instead<br><span class="zh-inline">2. **没有 namespace**，Rust 用模块系统组织代码。</span>
3. **`println!` is a macro** - Notice the `!`<br><span class="zh-inline">3. **`println!` 是宏**，后面的 `!` 不是摆设。</span>
4. **No semicolon after `println!`** - Expression vs statement<br><span class="zh-inline">4. `println!` 这一段开始要慢慢习惯 Rust 里“表达式”和“语句”的区别。</span>
5. **No explicit return type** - `main` returns `()` (unit type)<br><span class="zh-inline">5. **没有显式返回类型**，`main` 默认返回 `()`，也就是单元类型。</span>

### Creating Your First Project<br><span class="zh-inline">创建第一个项目</span>

```bash
# Create new project (like 'dotnet new console')
# 创建新项目（相当于 'dotnet new console'）
cargo new hello_rust
cd hello_rust

# Project structure created:
# 生成出来的项目结构：
# hello_rust/
# ├── Cargo.toml      (like .csproj file)
# │                   （相当于 .csproj 文件）
# └── src/
#     └── main.rs     (like Program.cs)
#                      （相当于 Program.cs）

# Run the project (like 'dotnet run')
# 运行项目（相当于 'dotnet run'）
cargo run
```

***

## Cargo vs NuGet/MSBuild<br><span class="zh-inline">Cargo 与 NuGet / MSBuild 的对应关系</span>

### Project Configuration<br><span class="zh-inline">项目配置文件</span>

**C# (.csproj)**<br><span class="zh-inline">**C#（`.csproj`）**</span>

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  
  <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  <PackageReference Include="Serilog" Version="3.0.1" />
</Project>
```

**Rust (Cargo.toml)**<br><span class="zh-inline">**Rust（`Cargo.toml`）**</span>

```toml
[package]
name = "hello_rust"
version = "0.1.0"
edition = "2021"

[dependencies]
serde_json = "1.0"    # Like Newtonsoft.Json
log = "0.4"           # Like Serilog
```

### Common Cargo Commands<br><span class="zh-inline">常用 Cargo 命令</span>

```bash
# Create new project
# 创建新项目
cargo new my_project
cargo new my_project --lib  # Create library project
                             # 创建库项目

# Build and run
# 编译与运行
cargo build          # Like 'dotnet build'
cargo run            # Like 'dotnet run'
cargo test           # Like 'dotnet test'

# Package management
# 包管理
cargo add serde      # Add dependency (like 'dotnet add package')
cargo update         # Update dependencies

# Release build
# 发布构建
cargo build --release  # Optimized build
cargo run --release    # Run optimized version

# Documentation
# 文档
cargo doc --open     # Generate and open docs
```

### Workspace vs Solution<br><span class="zh-inline">Workspace 与 Solution 的对照</span>

**C# Solution (.sln)**<br><span class="zh-inline">**C# 的 Solution（`.sln`）**</span>

```text
MySolution/
├── MySolution.sln
├── WebApi/
│   └── WebApi.csproj
├── Business/
│   └── Business.csproj
└── Tests/
    └── Tests.csproj
```

**Rust Workspace (Cargo.toml)**<br><span class="zh-inline">**Rust 的 Workspace（写在 `Cargo.toml` 里）**</span>

```toml
[workspace]
members = [
    "web_api",
    "business", 
    "tests"
]
```

***

## Reading Input and CLI Arguments<br><span class="zh-inline">读取输入与命令行参数</span>

Every C# developer knows `Console.ReadLine()`. Here's how Rust handles user input, environment variables, and command-line arguments.<br><span class="zh-inline">`Console.ReadLine()` 写 C# 的都熟，Rust 这边处理用户输入、环境变量和命令行参数的方式也得顺手摸清。</span>

### Console Input<br><span class="zh-inline">控制台输入</span>

```csharp
// C# — reading user input
// C#：读取用户输入
Console.Write("Enter your name: ");
string name = Console.ReadLine();
Console.WriteLine($"Hello, {name}!");

// Parsing input
// 解析输入
Console.Write("Enter a number: ");
if (int.TryParse(Console.ReadLine(), out int number))
{
    Console.WriteLine($"You entered: {number}");
}
else
{
    Console.WriteLine("That's not a valid number.");
}
```

```rust
use std::io::{self, Write};

fn main() {
    // Reading a line of input
    // 读取一行输入
    print!("Enter your name: ");
    io::stdout().flush().unwrap(); // flush because print! doesn't auto-flush
                                  // print! 不会自动刷新，所以要手动 flush

    let mut name = String::new();
    io::stdin().read_line(&mut name).expect("Failed to read line");
    let name = name.trim(); // remove trailing newline
                            // 去掉结尾换行
    println!("Hello, {name}!");

    // Parsing input
    // 解析输入
    print!("Enter a number: ");
    io::stdout().flush().unwrap();

    let mut input = String::new();
    io::stdin().read_line(&mut input).expect("Failed to read");
    match input.trim().parse::<i32>() {
        Ok(number) => println!("You entered: {number}"),
        Err(_)     => println!("That's not a valid number."),
    }
}
```

### Command-Line Arguments<br><span class="zh-inline">命令行参数</span>

```csharp
// C# — reading CLI args
// C#：读取命令行参数
static void Main(string[] args)
{
    if (args.Length < 1)
    {
        Console.WriteLine("Usage: program <filename>");
        return;
    }
    string filename = args[0];
    Console.WriteLine($"Processing {filename}");
}
```

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    // args[0] = program name (like C#'s Assembly name)
    // args[1..] = actual arguments
    // args[0] 是程序名，args[1..] 才是真正传进来的参数

    if args.len() < 2 {
        eprintln!("Usage: {} <filename>", args[0]); // eprintln! -> stderr
                                                    // eprintln! 会写到标准错误
        std::process::exit(1);
    }
    let filename = &args[1];
    println!("Processing {filename}");
}
```

### Environment Variables<br><span class="zh-inline">环境变量</span>

```csharp
// C#
string dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL") ?? "localhost";
```

```rust
use std::env;

let db_url = env::var("DATABASE_URL").unwrap_or_else(|_| "localhost".to_string());
// env::var returns Result<String, VarError> — no nulls!
// env::var 返回的是 Result<String, VarError>，不会给个 null 糊弄过去
```

### Production CLI Apps with `clap`<br><span class="zh-inline">用 `clap` 编写正式 CLI 程序</span>

For anything beyond trivial argument parsing, use the **`clap`** crate. It fills the role that `System.CommandLine` or `CommandLineParser` libraries play in C#.<br><span class="zh-inline">只要参数解析稍微复杂一点，就该把 **`clap`** 拿出来了。它在 Rust 里的定位，大致就和 C# 里的 `System.CommandLine`、`CommandLineParser` 一个级别。</span>

```toml
# Cargo.toml
[dependencies]
clap = { version = "4", features = ["derive"] }
```

```rust
use clap::Parser;

/// A simple file processor — this doc comment becomes the help text
/// 一个简单的文件处理器，这段文档注释会直接变成帮助文本
#[derive(Parser, Debug)]
#[command(name = "processor", version, about)]
struct Args {
    /// Input file to process
    /// 要处理的输入文件
    #[arg(short, long)]
    input: String,

    /// Output file (defaults to stdout)
    /// 输出文件，默认写到标准输出
    #[arg(short, long)]
    output: Option<String>,

    /// Enable verbose logging
    /// 打开详细日志
    #[arg(short, long, default_value_t = false)]
    verbose: bool,

    /// Number of worker threads
    /// 工作线程数量
    #[arg(short = 'j', long, default_value_t = 4)]
    threads: usize,
}

fn main() {
    let args = Args::parse(); // auto-parses, validates, generates --help
                              // 自动解析、校验，并生成 --help

    if args.verbose {
        println!("Input:   {}", args.input);
        println!("Output:  {:?}", args.output);
        println!("Threads: {}", args.threads);
    }

    // Use args.input, args.output, etc.
    // 后面直接使用 args.input、args.output 等字段即可
}
```

```bash
# Auto-generated help:
# 自动生成的帮助信息：
$ processor --help
A simple file processor

Usage: processor [OPTIONS] --input <INPUT>

Options:
  -i, --input <INPUT>      Input file to process
  -o, --output <OUTPUT>    Output file (defaults to stdout)
  -v, --verbose            Enable verbose logging
  -j, --threads <THREADS>  Number of worker threads [default: 4]
  -h, --help               Print help
  -V, --version            Print version
```

```csharp
// C# equivalent with System.CommandLine (more boilerplate):
// C# 里用 System.CommandLine 的对应写法，样板代码会更多一些：
var inputOption = new Option<string>("--input", "Input file") { IsRequired = true };
var verboseOption = new Option<bool>("--verbose", "Enable verbose logging");
var rootCommand = new RootCommand("A simple file processor");
rootCommand.AddOption(inputOption);
rootCommand.AddOption(verboseOption);
rootCommand.SetHandler((input, verbose) => { /* ... */ }, inputOption, verboseOption);
await rootCommand.InvokeAsync(args);
// clap's derive macro approach is more concise and type-safe
// clap 用 derive 宏写起来更紧凑，类型约束也更自然
```

| C# | Rust | Notes<br><span class="zh-inline">说明</span> |
|----|------|-------|
| `Console.ReadLine()` | `io::stdin().read_line(&mut buf)` | Must provide buffer, returns `Result`<br><span class="zh-inline">必须先准备缓冲区，返回 `Result`。</span> |
| `int.TryParse(s, out n)` | `s.parse::<i32>()` | Returns `Result<i32, ParseIntError>`<br><span class="zh-inline">返回 `Result<i32, ParseIntError>`。</span> |
| `args[0]` | `env::args().nth(1)` | Rust `args[0]` = program name<br><span class="zh-inline">Rust 里的 `args[0]` 是程序名。</span> |
| `Environment.GetEnvironmentVariable` | `env::var("KEY")` | Returns `Result`, not nullable<br><span class="zh-inline">返回 `Result`，不是可空引用。</span> |
| `System.CommandLine` | `clap` | Derive-based, auto-generates help<br><span class="zh-inline">基于 derive，能自动生成帮助信息。</span> |

***
