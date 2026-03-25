## Algebraic Data Types vs C# Unions<br><span class="zh-inline">代数数据类型与 C# 联合类型对照</span>

> **What you'll learn:** Rust's algebraic data types, meaning enums that can carry data, compared with C#'s more limited discriminated-union workarounds; `match` expressions with exhaustive checking, guard clauses, and nested destructuring patterns.<br><span class="zh-inline">**本章将学到什么：** 对照理解 Rust 的代数数据类型，也就是“可携带数据的 enum”，以及 C# 里相对受限的判别联合替代写法；同时掌握带穷尽检查的 `match` 表达式、守卫条件和嵌套解构模式。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 进阶</span>

### C# Discriminated Unions (Limited)<br><span class="zh-inline">C# 的判别联合写法（能力有限）</span>

```csharp
// C# - Limited union support with inheritance
public abstract class Result
{
    public abstract T Match<T>(Func<Success, T> onSuccess, Func<Error, T> onError);
}

public class Success : Result
{
    public string Value { get; }
    public Success(string value) => Value = value;
    
    public override T Match<T>(Func<Success, T> onSuccess, Func<Error, T> onError)
        => onSuccess(this);
}

public class Error : Result
{
    public string Message { get; }
    public Error(string message) => Message = message;
    
    public override T Match<T>(Func<Success, T> onSuccess, Func<Error, T> onError)
        => onError(this);
}

// C# 9+ Records with pattern matching (better)
public abstract record Shape;
public record Circle(double Radius) : Shape;
public record Rectangle(double Width, double Height) : Shape;

public static double Area(Shape shape) => shape switch
{
    Circle(var radius) => Math.PI * radius * radius,
    Rectangle(var width, var height) => width * height,
    _ => throw new ArgumentException("Unknown shape")  // [ERROR] Runtime error possible
};
```

### Rust Algebraic Data Types (Enums)<br><span class="zh-inline">Rust 代数数据类型（Enum）</span>

```rust
// Rust - True algebraic data types with exhaustive pattern matching
#[derive(Debug, Clone)]
pub enum Result<T, E> {
    Ok(T),
    Err(E),
}

#[derive(Debug, Clone)]
pub enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
    Triangle { base: f64, height: f64 },
}

impl Shape {
    pub fn area(&self) -> f64 {
        match self {
            Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
            Shape::Rectangle { width, height } => width * height,
            Shape::Triangle { base, height } => 0.5 * base * height,
            // [OK] Compiler error if any variant is missing!
        }
    }
}

// Advanced: Enums can hold different types
#[derive(Debug)]
pub enum Value {
    Integer(i64),
    Float(f64),
    Text(String),
    Boolean(bool),
    List(Vec<Value>),  // Recursive types!
}

impl Value {
    pub fn type_name(&self) -> &'static str {
        match self {
            Value::Integer(_) => "integer",
            Value::Float(_) => "float",
            Value::Text(_) => "text",
            Value::Boolean(_) => "boolean",
            Value::List(_) => "list",
        }
    }
}
```

这块差别非常大。<br><span class="zh-inline">C# 里想做“不同分支携带不同数据”的模型，往往要靠继承、record、手写 `Match` 方法或者第三方库来拼；Rust 里 `enum` 天生就是干这个的，而且编译器还会盯着每个分支是不是都处理到了。</span>

```mermaid
graph TD
    subgraph "C# Discriminated Unions (Workarounds)"
        CS_ABSTRACT["abstract class Result<br/>抽象基类"]
        CS_SUCCESS["class Success : Result<br/>成功分支类"]
        CS_ERROR["class Error : Result<br/>错误分支类"]
        CS_MATCH["Manual Match method<br/>or switch expressions<br/>手写 Match 或 switch"]
        CS_RUNTIME["[ERROR] Runtime exceptions<br/>for missing cases<br/>漏分支时可能在运行时炸"]
        CS_HEAP["[ERROR] Heap allocation<br/>for class inheritance<br/>继承对象通常走堆分配"]
        
        CS_ABSTRACT --> CS_SUCCESS
        CS_ABSTRACT --> CS_ERROR
        CS_SUCCESS --> CS_MATCH
        CS_ERROR --> CS_MATCH
        CS_MATCH --> CS_RUNTIME
        CS_ABSTRACT --> CS_HEAP
    end
    
    subgraph "Rust Algebraic Data Types"
        RUST_ENUM["enum Shape { ... }<br/>enum 定义"]
        RUST_VARIANTS["Circle { radius }<br/>Rectangle { width, height }<br/>Triangle { base, height }"]
        RUST_MATCH["match shape { ... }<br/>模式匹配"]
        RUST_EXHAUSTIVE["[OK] Exhaustive checking<br/>Compile-time guarantee<br/>编译期穷尽检查"]
        RUST_STACK["[OK] Efficient layout<br/>Memory use is explicit<br/>内存布局更明确"]
        RUST_ZERO["[OK] Zero-cost abstraction<br/>零成本抽象"]
        
        RUST_ENUM --> RUST_VARIANTS
        RUST_VARIANTS --> RUST_MATCH
        RUST_MATCH --> RUST_EXHAUSTIVE
        RUST_ENUM --> RUST_STACK
        RUST_STACK --> RUST_ZERO
    end
    
    style CS_RUNTIME fill:#ffcdd2,color:#000
    style CS_HEAP fill:#fff3e0,color:#000
    style RUST_EXHAUSTIVE fill:#c8e6c9,color:#000
    style RUST_STACK fill:#c8e6c9,color:#000
    style RUST_ZERO fill:#c8e6c9,color:#000
```

***

## Enums and Pattern Matching<br><span class="zh-inline">Enum 与模式匹配</span>

Rust enums are far more expressive than C# enums. They can carry data and are one of the foundations of type-safe program design in Rust.<br><span class="zh-inline">Rust 的 enum 比 C# 的 enum 强太多了。它不只是“几个命名常量”，而是能直接承载数据，并且是 Rust 类型安全设计里最核心的基石之一。</span>

### C# Enum Limitations<br><span class="zh-inline">C# enum 的局限</span>

```csharp
// C# enum - just named constants
public enum Status
{
    Pending,
    Approved,
    Rejected
}

// C# enum with backing values
public enum HttpStatusCode
{
    OK = 200,
    NotFound = 404,
    InternalServerError = 500
}

// Need separate classes for complex data
public abstract class Result
{
    public abstract bool IsSuccess { get; }
}

public class Success : Result
{
    public string Value { get; }
    public override bool IsSuccess => true;
    
    public Success(string value)
    {
        Value = value;
    }
}

public class Error : Result
{
    public string Message { get; }
    public override bool IsSuccess => false;
    
    public Error(string message)
    {
        Message = message;
    }
}
```

### Rust Enum Power<br><span class="zh-inline">Rust enum 的能力</span>

```rust
// Simple enum (like C# enum)
#[derive(Debug, PartialEq)]
enum Status {
    Pending,
    Approved,
    Rejected,
}

// Enum with data (this is where Rust shines!)
#[derive(Debug)]
enum Result<T, E> {
    Ok(T),      // Success variant holding value of type T
    Err(E),     // Error variant holding error of type E
}

// Complex enum with different data types
#[derive(Debug)]
enum Message {
    Quit,                       // No data
    Move { x: i32, y: i32 },   // Struct-like variant
    Write(String),             // Tuple-like variant
    ChangeColor(i32, i32, i32), // Multiple values
}

// Real-world example: HTTP Response
#[derive(Debug)]
enum HttpResponse {
    Ok { body: String, headers: Vec<String> },
    NotFound { path: String },
    InternalError { message: String, code: u16 },
    Redirect { location: String },
}
```

如果只把 Rust enum 当成“能带点字段的增强版枚举”，那就低估它了。<br><span class="zh-inline">它真正猛的地方在于：一个类型就能完整描述一组互斥状态，而且每个状态带什么数据都能写死在类型定义里。这种表达力会一路影响错误处理、协议建模、状态机设计和命令解析。</span>

### Pattern Matching with Match<br><span class="zh-inline">使用 `match` 做模式匹配</span>

```csharp
// C# switch statement (limited)
public string HandleStatus(Status status)
{
    switch (status)
    {
        case Status.Pending:
            return "Waiting for approval";
        case Status.Approved:
            return "Request approved";
        case Status.Rejected:
            return "Request rejected";
        default:
            return "Unknown status"; // Always need default
    }
}

// C# pattern matching (C# 8+)
public string HandleResult(Result result)
{
    return result switch
    {
        Success success => $"Success: {success.Value}",
        Error error => $"Error: {error.Message}",
        _ => "Unknown result" // Still need catch-all
    };
}
```

```rust
// Rust match - exhaustive and powerful
fn handle_status(status: Status) -> String {
    match status {
        Status::Pending => "Waiting for approval".to_string(),
        Status::Approved => "Request approved".to_string(),
        Status::Rejected => "Request rejected".to_string(),
        // No default needed - compiler ensures exhaustiveness
    }
}

// Pattern matching with data extraction
fn handle_result<T, E>(result: Result<T, E>) -> String 
where 
    T: std::fmt::Debug,
    E: std::fmt::Debug,
{
    match result {
        Result::Ok(value) => format!("Success: {:?}", value),
        Result::Err(error) => format!("Error: {:?}", error),
        // Exhaustive - no default needed
    }
}

// Complex pattern matching
fn handle_message(msg: Message) -> String {
    match msg {
        Message::Quit => "Goodbye!".to_string(),
        Message::Move { x, y } => format!("Move to ({}, {})", x, y),
        Message::Write(text) => format!("Write: {}", text),
        Message::ChangeColor(r, g, b) => format!("Change color to RGB({}, {}, {})", r, g, b),
    }
}

// HTTP response handling
fn handle_http_response(response: HttpResponse) -> String {
    match response {
        HttpResponse::Ok { body, headers } => {
            format!("Success! Body: {}, Headers: {:?}", body, headers)
        },
        HttpResponse::NotFound { path } => {
            format!("404: Path '{}' not found", path)
        },
        HttpResponse::InternalError { message, code } => {
            format!("Error {}: {}", code, message)
        },
        HttpResponse::Redirect { location } => {
            format!("Redirect to: {}", location)
        },
    }
}
```

`match` 的价值不是“语法比 switch 花哨”，而是它能把数据提取和分支覆盖检查揉成一个东西。<br><span class="zh-inline">在 C# 里，经常得靠默认分支兜底；在 Rust 里，少写一个分支，编译器就跟着拍桌子。这就是为什么很多逻辑一旦改成 `enum + match`，代码会明显更扎实。</span>

### Guards and Advanced Patterns<br><span class="zh-inline">守卫条件与进阶模式</span>

```rust
// Pattern matching with guards
fn describe_number(x: i32) -> String {
    match x {
        n if n < 0 => "negative".to_string(),
        0 => "zero".to_string(),
        n if n < 10 => "single digit".to_string(),
        n if n < 100 => "double digit".to_string(),
        _ => "large number".to_string(),
    }
}

// Matching ranges
fn describe_age(age: u32) -> String {
    match age {
        0..=12 => "child".to_string(),
        13..=19 => "teenager".to_string(),
        20..=64 => "adult".to_string(),
        65.. => "senior".to_string(),
    }
}

// Destructuring structs and tuples
```

这类高级模式真正好用的地方，在于它能把“判断条件”和“数据结构形状”一起表达出来。<br><span class="zh-inline">守卫、范围匹配、结构体解构、元组解构都属于这一挂。写得熟了以后，会发现很多 `if / else` 套娃都能被压扁成更清爽的 `match`。</span>

<details>
<summary><strong>🏋️ Exercise: Command Parser</strong><br><span class="zh-inline"><strong>🏋️ 练习：命令解析器</strong></span></summary>

**Challenge**: Model a CLI command system with Rust enums. Parse string input into a `Command` enum and execute each variant. Unknown commands should become proper errors instead of silently slipping through.<br><span class="zh-inline">**挑战：** 用 Rust enum 表达一个命令行命令系统。把字符串输入解析成 `Command` 枚举，再执行不同分支；未知命令要走明确的错误处理，而不是糊里糊涂放过去。</span>

```rust
// Starter code — fill in the blanks
#[derive(Debug)]
enum Command {
    // TODO: Add variants for Quit, Echo(String), Move { x: i32, y: i32 }, Count(u32)
}

fn parse_command(input: &str) -> Result<Command, String> {
    let parts: Vec<&str> = input.splitn(2, ' ').collect();
    // TODO: match on parts[0] and parse arguments
    todo!()
}

fn execute(cmd: &Command) -> String {
    // TODO: match on each variant and return a description
    todo!()
}
```

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
#[derive(Debug)]
enum Command {
    Quit,
    Echo(String),
    Move { x: i32, y: i32 },
    Count(u32),
}

fn parse_command(input: &str) -> Result<Command, String> {
    let parts: Vec<&str> = input.splitn(2, ' ').collect();
    match parts[0] {
        "quit" => Ok(Command::Quit),
        "echo" => {
            let msg = parts.get(1).unwrap_or(&"").to_string();
            Ok(Command::Echo(msg))
        }
        "move" => {
            let args = parts.get(1).ok_or("move requires 'x y'")?;
            let coords: Vec<&str> = args.split_whitespace().collect();
            let x = coords.get(0).ok_or("missing x")?.parse::<i32>().map_err(|e| e.to_string())?;
            let y = coords.get(1).ok_or("missing y")?.parse::<i32>().map_err(|e| e.to_string())?;
            Ok(Command::Move { x, y })
        }
        "count" => {
            let n = parts.get(1).ok_or("count requires a number")?
                .parse::<u32>().map_err(|e| e.to_string())?;
            Ok(Command::Count(n))
        }
        other => Err(format!("Unknown command: {other}")),
    }
}

fn execute(cmd: &Command) -> String {
    match cmd {
        Command::Quit           => "Goodbye!".to_string(),
        Command::Echo(msg)      => msg.clone(),
        Command::Move { x, y }  => format!("Moving to ({x}, {y})"),
        Command::Count(n)       => format!("Counted to {n}"),
    }
}
```

**Key takeaways:**<br><span class="zh-inline">**这一题该记住的重点：**</span>

- Each enum variant can hold different data, so there is no need to build a class hierarchy just to represent commands.<br><span class="zh-inline">每个 enum 分支都能带不同数据，所以根本不用为了命令系统专门搭一层类继承树。</span>
- `match` forces complete handling of every case, which prevents forgotten branches.<br><span class="zh-inline">`match` 会逼着把所有分支都处理完，漏分支这种事很难偷偷发生。</span>
- The `?` operator keeps parsing and error propagation clean without一层层嵌套 `try/catch`。<br><span class="zh-inline">`?` 运算符能把解析错误串起来，代码不会被层层 `try/catch` 套得乱七八糟。</span>

</details>
</details>

***
