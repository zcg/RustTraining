## Crate-Level Error Types and Result Aliases<br><span class="zh-inline">crate 级错误类型与 Result 别名</span>

> **What you'll learn:** How Java exception habits map to Rust crate-level error enums, how `AppError` plus `AppResult<T>` keeps code readable, and how this pattern replaces scattered exception classes in Rust services.<br><span class="zh-inline">**本章将学习：** Java 的异常习惯如何迁移到 Rust 的 crate 级错误枚举，`AppError` 加 `AppResult<T>` 为什么能让代码更整洁，以及这套模式如何替代分散的异常类体系。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Java developers are used to methods that may throw many different exceptions without showing the full failure contract in the signature.<br><span class="zh-inline">Java 开发者很习惯“方法可能抛出很多异常，但签名里并不完整展示失败契约”这种做法。</span>

Rust prefers a different style: define one central error enum for the crate and return it explicitly.<br><span class="zh-inline">Rust 更偏好另一种风格：为整个 crate 定义一个中心错误枚举，然后显式返回它。</span>

## The Core Pattern<br><span class="zh-inline">核心模式</span>

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Serialization error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Validation error: {message}")]
    Validation { message: String },

    #[error("Not found: {entity} with id {id}")]
    NotFound { entity: String, id: String },
}

pub type AppResult<T> = std::result::Result<T, AppError>;
```

The alias is not decorative.<br><span class="zh-inline">这个别名不是装饰品。</span>

It turns every signature into a house style that stays readable across repository, service, and handler layers.<br><span class="zh-inline">它会把 repository、service、handler 各层的函数签名统一成一种易读的团队风格。</span>

```rust
pub async fn get_user(id: Uuid) -> AppResult<User> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?;

    user.ok_or_else(|| AppError::NotFound {
        entity: "user".into(),
        id: id.to_string(),
    })
}
```

## Why This Feels Different from Java<br><span class="zh-inline">这和 Java 的体感为什么不一样</span>

In Java, a method can look simple because the exception contract is partly hidden in runtime behavior.<br><span class="zh-inline">在 Java 里，一个方法之所以看起来简洁，往往是因为异常契约有一部分被藏进了运行时行为里。</span>

In Rust, failure is part of the function type.<br><span class="zh-inline">在 Rust 里，失败本身就是函数类型的一部分。</span>

That means callers do not guess; they handle a typed result.<br><span class="zh-inline">这意味着调用方不是靠猜，而是在处理一个有类型约束的结果。</span>

## Replacing Exception Forests<br><span class="zh-inline">替代一大片异常类森林</span>

Java codebases often end up with many parallel exception classes:<br><span class="zh-inline">很多 Java 项目最后都会长出一大片平行存在的异常类：</span>

- `ValidationException`<br><span class="zh-inline">校验异常。</span>
- `UserNotFoundException`<br><span class="zh-inline">用户不存在异常。</span>
- `RepositoryException`<br><span class="zh-inline">仓储异常。</span>
- `RemoteServiceException`<br><span class="zh-inline">远程服务异常。</span>

Rust can pull the same vocabulary into one enum and make the set visible in one place.<br><span class="zh-inline">Rust 可以把这些失败语义拉回一个枚举里，并且让整个失败集合集中可见。</span>

```rust
#[derive(thiserror::Error, Debug)]
pub enum UserServiceError {
    #[error("validation failed: {0}")]
    Validation(String),

    #[error("user {0} not found")]
    UserNotFound(String),

    #[error("email already exists: {0}")]
    DuplicateEmail(String),

    #[error(transparent)]
    Database(#[from] sqlx::Error),
}
```

## Rust's Answer to `@ControllerAdvice`<br><span class="zh-inline">Rust 对 `@ControllerAdvice` 的回答</span>

Spring Boot usually converts exceptions to HTTP responses in a centralized place.<br><span class="zh-inline">Spring Boot 往往会在一个集中的位置把异常翻译成 HTTP 响应。</span>

Rust web frameworks usually express that with `IntoResponse`.<br><span class="zh-inline">Rust Web 框架通常会用 `IntoResponse` 来表达同样的职责。</span>

```rust
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::Validation { message } => (
                StatusCode::BAD_REQUEST,
                Json(ErrorBody {
                    code: "validation_error",
                    message,
                }),
            )
                .into_response(),
            AppError::NotFound { entity, id } => (
                StatusCode::NOT_FOUND,
                Json(ErrorBody {
                    code: "not_found",
                    message: format!("{entity} {id} was not found"),
                }),
            )
                .into_response(),
            AppError::Database(error) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorBody {
                    code: "database_error",
                    message: error.to_string(),
                }),
            )
                .into_response(),
            AppError::Json(error) => (
                StatusCode::BAD_REQUEST,
                Json(ErrorBody {
                    code: "invalid_json",
                    message: error.to_string(),
                }),
            )
                .into_response(),
        }
    }
}
```

The architectural role is similar, but the implementation is driven by plain types instead of reflection and advice rules.<br><span class="zh-inline">两者在架构职责上很像，但 Rust 这边是由普通类型驱动，而不是靠反射和 advice 规则完成。</span>

## Why `#[from]` Matters<br><span class="zh-inline">为什么 `#[from]` 很关键</span>

`#[from]` lets infrastructure errors flow upward without repetitive wrapping code.<br><span class="zh-inline">`#[from]` 可以让基础设施层错误向上传播时不必每次都手工包一层。</span>

```rust
#[derive(thiserror::Error, Debug)]
pub enum ImportError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("CSV parse error: {0}")]
    Csv(#[from] csv::Error),

    #[error("row {row}: invalid email")]
    InvalidEmail { row: usize },
}
```

This is the Rust alternative to a long chain of `catch`, wrap, and rethrow blocks.<br><span class="zh-inline">这就是 Rust 对“层层 catch、包装、再抛出”的替代方案。</span>

## `thiserror` vs `anyhow`<br><span class="zh-inline">`thiserror` 和 `anyhow` 的分工</span>

| Tool<br><span class="zh-inline">工具</span> | Best use<br><span class="zh-inline">最佳用途</span> |
|---|---|
| `thiserror` | library crates, service layers, reusable modules<br><span class="zh-inline">库 crate、服务层、可复用模块</span> |
| `anyhow` | binaries, CLI entrypoints, one-off tools<br><span class="zh-inline">可执行程序、CLI 入口、一次性工具</span> |

A good house rule for Java-to-Rust migration is simple:<br><span class="zh-inline">面向 Java 迁移时，一个很好用的团队规则很简单：</span>

- reusable layers use `thiserror`<br><span class="zh-inline">可复用层用 `thiserror`。</span>
- outer executable boundaries use `anyhow`<br><span class="zh-inline">最外层可执行边界用 `anyhow`。</span>

## Practical Rules<br><span class="zh-inline">实用规则</span>

1. keep one central error enum per crate whenever possible<br><span class="zh-inline">可以的话，每个 crate 保持一个中心错误枚举。</span>
2. use variants for domain failures that callers may distinguish<br><span class="zh-inline">调用方需要区分的领域失败，用独立变体表示。</span>
3. use `#[from]` for infrastructure failures that should bubble up<br><span class="zh-inline">需要向上传播的基础设施失败，用 `#[from]` 承接。</span>
4. convert to HTTP or CLI output only at the outer boundary<br><span class="zh-inline">只有在最外层边界才去翻译成 HTTP 响应或 CLI 输出。</span>

