## Best Practices for C# Developers<br><span class="zh-inline">给 C# 开发者的最佳实践</span>

> **What you'll learn:** Five key mindset shifts, idiomatic project organization, error-handling strategy, testing patterns, and the most common mistakes C# developers make when learning Rust.<br><span class="zh-inline">**本章将学到什么：** 五个关键思维转变、惯用的项目组织方式、错误处理策略、测试模式，以及 C# 开发者在 Rust 里最常犯的错误。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 进阶</span>

### 1. Mindset Shifts<br><span class="zh-inline">1. 思维方式要先拧过来</span>

- **From GC to Ownership**: think about who owns the data and when it gets released.<br><span class="zh-inline">**从 GC 到所有权**：先想清楚数据归谁管，什么时候被释放。</span>
- **From Exceptions to Results**: make failure paths explicit and visible.<br><span class="zh-inline">**从异常到 `Result`**：失败路径要显式写出来，别藏着。</span>
- **From Inheritance to Composition**: traits are for combining behavior, not simulating class hierarchies.<br><span class="zh-inline">**从继承到组合**：trait 是用来拼行为的，不是让人硬复刻类继承树的。</span>
- **From Null to Option**: absence becomes part of the type, not a convention in the programmer's head.<br><span class="zh-inline">**从 null 到 `Option`**：值可能不存在这件事，直接写进类型里。</span>

### 2. Code Organization<br><span class="zh-inline">2. 代码组织</span>

```rust
// Structure projects roughly like a C# solution
src/
├── main.rs          // Program.cs equivalent
├── lib.rs           // Library entry point
├── models/
│   ├── mod.rs
│   ├── user.rs
│   └── product.rs
├── services/
│   ├── mod.rs
│   ├── user_service.rs
│   └── product_service.rs
├── controllers/
├── repositories/
└── utils/
```

Rust projects do not need to imitate C# folder naming exactly, but the idea of separating data models, services, repositories, and interface layers still maps well. The trick is to let modules describe boundaries of responsibility rather than just mirror namespaces mechanically.<br><span class="zh-inline">Rust 项目没必要机械模仿 C# 的目录命名，但把数据模型、服务、仓储、接口层拆开这件事，本身还是很有价值。关键是让模块边界表达职责，而不是单纯照着 namespace 画葫芦。</span>

### 3. Error Handling Strategy<br><span class="zh-inline">3. 错误处理策略</span>

```rust
// Create a common Result type for the application
pub type AppResult<T> = Result<T, AppError>;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    
    #[error("Validation error: {message}")]
    Validation { message: String },
    
    #[error("Business logic error: {message}")]
    Business { message: String },
}

pub async fn create_user(data: CreateUserRequest) -> AppResult<User> {
    validate_user_data(&data)?;
    let user = repository.create_user(data).await?;
    Ok(user)
}
```

The important shift is to treat error flow as part of the API contract. In C#, exceptions often stay invisible until runtime. In Rust, callers can see from the signature that a function may fail, and what class of failure it may produce.<br><span class="zh-inline">最关键的转变，是把错误流也当成 API 合同的一部分。在 C# 里，异常很多时候得运行起来才知道会不会冒出来。Rust 则会把“这里可能失败”以及“失败大概分哪几类”直接写到签名里。</span>

### 4. Testing Patterns<br><span class="zh-inline">4. 测试模式</span>

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use rstest::*;
    
    #[test]
    fn test_basic_functionality() {
        let input = "test data";
        let result = process_data(input);
        assert_eq!(result, "expected output");
    }
    
    #[rstest]
    #[case(1, 2, 3)]
    #[case(5, 5, 10)]
    #[case(0, 0, 0)]
    fn test_addition(#[case] a: i32, #[case] b: i32, #[case] expected: i32) {
        assert_eq!(add(a, b), expected);
    }
    
    #[tokio::test]
    async fn test_async_functionality() {
        let result = async_function().await;
        assert!(result.is_ok());
    }
}
```

Rust testing feels familiar at a high level: arrange, act, assert still works fine. The main difference is that testing helpers are often traits, macros, or crates such as `rstest`, rather than attributes hanging off a large framework.<br><span class="zh-inline">Rust 的测试在大思路上其实不陌生，Arrange / Act / Assert 那套照样能用。最大的不同在于，测试辅助设施更多来自 trait、宏和独立 crate，比如 `rstest`，而不是挂在一个庞大框架上的注解系统。</span>

### 5. Common Mistakes to Avoid<br><span class="zh-inline">5. 最常见、也最该绕开的错误</span>

```rust
// [ERROR] Don't try to implement inheritance
// struct Manager : Employee

// [OK] Use composition with traits
trait Employee {
    fn get_salary(&self) -> u32;
}

trait Manager: Employee {
    fn get_team_size(&self) -> usize;
}

// [ERROR] Don't use unwrap() everywhere
let value = might_fail().unwrap();

// [OK] Handle errors explicitly
let value = match might_fail() {
    Ok(v) => v,
    Err(e) => {
        log::error!("Operation failed: {}", e);
        return Err(e.into());
    }
};

// [ERROR] Don't clone everything
let data = expensive_data.clone();

// [OK] Borrow where possible
let data = &expensive_data;

// [ERROR] Don't spread RefCell everywhere
struct Data {
    value: RefCell<i32>,
}

// [OK] Prefer simple ownership first
struct Data {
    value: i32,
}
```

Rust's constraints look annoying only at first glance. In practice, they are fencing off whole classes of bugs that remain perfectly possible in C# codebases.<br><span class="zh-inline">Rust 这些约束，刚看时确实像是在故意添堵。但写久了就会发现，它们其实是在把一整类 C# 代码库里依然可能出现的 bug 整片隔离出去。</span>

---

### 6. Avoiding Excessive `clone()` 🟡<br><span class="zh-inline">6. 避免过度 `clone()` 🟡</span>

C# developers often clone almost instinctively, because the GC hides much of the ownership cost. In Rust, every `.clone()` is explicit work, often an allocation, and often avoidable.<br><span class="zh-inline">很多 C# 开发者会下意识复制数据，因为 GC 把很多所有权成本藏起来了。Rust 里每一个 `.clone()` 都是显式动作，很多时候还意味着分配，而它往往本来就能省掉。</span>

```rust
// [ERROR] Cloning strings to pass them around
fn greet(name: String) {
    println!("Hello, {name}");
}

let user_name = String::from("Alice");
greet(user_name.clone());
greet(user_name.clone());

// [OK] Borrow instead
fn greet(name: &str) {
    println!("Hello, {name}");
}

let user_name = String::from("Alice");
greet(&user_name);
greet(&user_name);
```

**When `clone` is appropriate:**<br><span class="zh-inline">**什么时候 `clone` 反而是合理的：**</span>

1. Moving data into a thread or `'static` closure.<br><span class="zh-inline">1. 需要把数据移进线程或 `'static` 闭包。</span>
2. Caching, when a truly independent copy is needed.<br><span class="zh-inline">2. 做缓存，确实需要一份独立副本。</span>
3. Prototyping first, then optimizing ownership later.<br><span class="zh-inline">3. 原型阶段先跑通，后续再收紧所有权设计。</span>

**Decision checklist:**<br><span class="zh-inline">**决策清单：**</span>

1. Can `&T` or `&str` work instead?<br><span class="zh-inline">1. 能不能改成传 `&T` 或 `&str`？</span>
2. Does the callee actually need ownership?<br><span class="zh-inline">2. 被调用方真的需要所有权吗？</span>
3. Is the data shared across threads?<br><span class="zh-inline">3. 是不是在跨线程共享？</span>
4. If none of those simplify things, `clone()` may be justified.<br><span class="zh-inline">4. 如果前面都不合适，那 `clone()` 才算真正站得住。</span>

---

### 7. Avoiding `unwrap()` in Production Code 🟡<br><span class="zh-inline">7. 生产代码里少碰 `unwrap()` 🟡</span>

Filling a Rust codebase with `.unwrap()` is morally equivalent to everywhere assuming “this exception will never happen” in C#. Both are easy, both are reckless, and both eventually bite back.<br><span class="zh-inline">在 Rust 代码里到处塞 `.unwrap()`，本质上和在 C# 里到处默认“这个异常肯定不会发生”差不多。写起来都很省事，结果也都很容易反咬一口。</span>

```rust
// [ERROR] "I'll clean this up later"
let config = std::fs::read_to_string("config.toml").unwrap();
let port: u16 = config_value.parse().unwrap();
let conn = db_pool.get().await.unwrap();

// [OK] Propagate with ?
let config = std::fs::read_to_string("config.toml")?;
let port: u16 = config_value.parse()?;
let conn = db_pool.get().await?;

// [OK] Use expect() when failure means a bug in assumptions
let home = std::env::var("HOME")
    .expect("HOME environment variable must be set");
```

| Method | When to use<br><span class="zh-inline">适用时机</span> |
|--------|------------|
| `?` | Application or library code, when caller should decide how to handle failure<br><span class="zh-inline">应用或库代码里，把失败交给调用方处理</span> |
| `expect("reason")` | Invariants and startup assumptions that must hold<br><span class="zh-inline">必须成立的不变量和启动前提</span> |
| `unwrap()` | Mostly tests, or immediately after a prior checked guard<br><span class="zh-inline">主要限于测试，或前面已经明确检查过的情况</span> |
| `unwrap_or(default)` | A sensible fallback exists<br><span class="zh-inline">存在合理默认值</span> |
| `unwrap_or_else(|| ...)` | Fallback is expensive and should be lazily computed<br><span class="zh-inline">默认值构造代价高，适合惰性计算</span> |

---

### 8. Fighting the Borrow Checker and How to Stop 🟡<br><span class="zh-inline">8. 老跟借用检查器打架，以及怎么停手 🟡</span>

Almost every C# developer goes through a phase where borrow-checker errors feel unreasonable. Most of the time the cure is not some clever trick, but a structural rewrite that better matches ownership flow.<br><span class="zh-inline">几乎每个 C# 开发者都会经历一个阶段：借用检查器看起来像在无理取闹。大多数时候，解法并不是什么花哨技巧，而是老老实实重构代码结构，让它顺着所有权流向走。</span>

```rust
// [ERROR] Mutating while iterating
let mut items = vec![1, 2, 3, 4, 5];
for item in &items {
    if *item > 3 {
        items.push(*item * 2);
    }
}

// [OK] Collect first, then mutate
let extras: Vec<i32> = items.iter()
    .filter(|&&x| x > 3)
    .map(|&x| x * 2)
    .collect();
items.extend(extras);
```

```rust
// [ERROR] Returning a reference to a local
fn get_greeting() -> &str {
    let s = String::from("hello");
    &s
}

// [OK] Return owned data
fn get_greeting() -> String {
    String::from("hello")
}
```

| C# habit<br><span class="zh-inline">C# 习惯</span> | Rust solution<br><span class="zh-inline">Rust 里的处理方式</span> |
|----------|--------------|
| Store references in structs | Use owned data, or add lifetime parameters<br><span class="zh-inline">优先存拥有型数据，实在要借用再显式加生命周期</span> |
| Mutate shared state freely | Use `Arc<Mutex<T>>` or redesign ownership<br><span class="zh-inline">用 `Arc<Mutex<T>>`，或者重新设计状态归属</span> |
| Return references to locals | Return owned values<br><span class="zh-inline">改成返回拥有型值</span> |
| Modify a collection while iterating | Collect changes, then apply them<br><span class="zh-inline">先收集变化，再统一应用</span> |
| Multiple mutable references everywhere | Split the struct into independent parts<br><span class="zh-inline">把结构拆成彼此独立的部分</span> |

---

### 9. Collapsing Assignment Pyramids 🟢<br><span class="zh-inline">9. 把层层嵌套的赋值金字塔压平 🟢</span>

C# code often grows into nested null-check pyramids. Rust's `match`、`if let`、combinators 和 `?` can flatten that logic into something much clearer.<br><span class="zh-inline">C# 代码特别容易长成一层套一层的空值判断金字塔。Rust 里的 `match`、`if let`、各种组合子和 `?`，可以把这种结构压成更平、更清楚的形式。</span>

```rust
// [ERROR] Deeply nested style
fn process(input: Option<String>) -> Option<usize> {
    match input {
        Some(s) => {
            if !s.is_empty() {
                match s.parse::<usize>() {
                    Ok(n) => {
                        if n > 0 {
                            Some(n * 2)
                        } else {
                            None
                        }
                    }
                    Err(_) => None,
                }
            } else {
                None
            }
        }
        None => None,
    }
}

// [OK] Flatten with combinators
fn process(input: Option<String>) -> Option<usize> {
    input
        .filter(|s| !s.is_empty())
        .and_then(|s| s.parse::<usize>().ok())
        .filter(|&n| n > 0)
        .map(|n| n * 2)
}
```

| Combinator | What it does<br><span class="zh-inline">作用</span> | Rough C# equivalent<br><span class="zh-inline">大致对应 C# 概念</span> |
|-----------|-------------|---------------|
| `map` | Transform the inner value<br><span class="zh-inline">转换内部值</span> | `Select` / `?.` |
| `and_then` | Chain operations returning `Option` or `Result`<br><span class="zh-inline">串联继续返回 `Option` / `Result` 的操作</span> | `SelectMany` |
| `filter` | Keep the value only if predicate passes<br><span class="zh-inline">按条件保留值</span> | `Where` |
| `unwrap_or` | Provide a default<br><span class="zh-inline">提供默认值</span> | `?? defaultValue` |
| `ok()` | Turn `Result` into `Option` and discard the error<br><span class="zh-inline">把 `Result` 转成 `Option`，丢掉错误</span> | 没有特别直接的对应物 |
| `transpose` | Flip `Option<Result>` into `Result<Option>`<br><span class="zh-inline">把 `Option<Result>` 翻成 `Result<Option>`</span> | 没有特别直接的对应物 |

***
