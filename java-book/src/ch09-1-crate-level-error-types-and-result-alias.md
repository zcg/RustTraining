## Crate-Level Error Types and Result Aliases

> **What you'll learn:** How Java exception habits map to Rust crate-level error enums, why a single `AppError` plus `AppResult<T>` keeps service code readable, and how this pattern replaces ad hoc exception trees in Rust web and library code.
>
> **Difficulty:** 🟡 Intermediate

One of the first design upgrades Java developers need in Rust is to stop thinking in terms of "anything may throw."

In a Rust crate, the normal production pattern is:

1. define one central error enum for the crate
2. convert lower-level failures into that enum
3. expose a crate-wide alias such as `AppResult<T>`

That gives the readability of a shared exception base type, but with explicit types in function signatures.

## The Core Pattern

```rust
// src/error.rs
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

The alias matters more than it first appears. Instead of every signature spelling out the full result type, the code reads like a house style:

```rust
use crate::error::{AppError, AppResult};

pub async fn get_user(id: Uuid) -> AppResult<User> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?;

    user.ok_or_else(|| AppError::NotFound {
        entity: "user".into(),
        id: id.to_string(),
    })
}

pub async fn create_user(req: CreateUserRequest) -> AppResult<User> {
    if req.name.trim().is_empty() {
        return Err(AppError::Validation {
            message: "name cannot be empty".into(),
        });
    }
    // ...
}
```

## Why This Feels Different from Java Exceptions

In Java, a service method might look tidy because the exception types are omitted:

```java
public User getUser(UUID id) {
    UserEntity entity = repository.findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));
    return mapper.toDomain(entity);
}
```

That style works, but the contract is partly hidden in runtime behavior.

Rust pushes the contract into the signature:

```rust
pub async fn get_user(id: Uuid) -> AppResult<User> {
    // ...
}
```

The caller now knows that failure is part of the type, and the crate owns the vocabulary of failures.

## A Better Replacement for "Exception Trees Everywhere"

Java codebases often accumulate this shape:

- `BusinessException`
- `ValidationException`
- `UserNotFoundException`
- `OrderNotFoundException`
- `RepositoryException`
- `RemoteServiceException`

Rust can model the same business space with one enum instead of a forest of classes:

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

pub type Result<T> = std::result::Result<T, UserServiceError>;
```

The advantages are practical:

- every case is visible in one place
- `match` can recover from specific variants cleanly
- HTTP handlers can convert the enum to status codes without string inspection

## Crate Errors and `@ControllerAdvice`

Spring Boot teams often centralize exception-to-response translation with `@ControllerAdvice`. In Rust web code, the equivalent usually lives in `IntoResponse` or a handler wrapper.

```rust
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Serialize)]
struct ErrorBody {
    code: &'static str,
    message: String,
}

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

That is the same architectural role as `@ControllerAdvice`, but with plain types rather than reflection-driven exception routing.

## Where `#[from]` Earns Its Keep

`#[from]` is the bridge between infrastructure errors and domain-level error vocabulary.

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

Then service code stays linear:

```rust
pub fn import_users(path: &str) -> Result<(), ImportError> {
    let file = std::fs::File::open(path)?;
    let mut reader = csv::Reader::from_reader(file);

    for (index, row) in reader.records().enumerate() {
        let row = row?;
        let email = row.get(0).unwrap_or("");
        if !email.contains('@') {
            return Err(ImportError::InvalidEmail { row: index + 1 });
        }
    }

    Ok(())
}
```

No nested `try/catch`, no manual wrapping on every line, and no "throws everything" signature.

## `thiserror` vs `anyhow`

Java teams often want one answer here. The real answer is that these crates serve different layers.

| | `thiserror` | `anyhow` |
|---|---|---|
| **Purpose** | Define structured domain errors | Bubble failures quickly in binaries |
| **Good fit** | library crates, service layers, reusable modules | `main`, CLI entrypoints, one-off tools |
| **Caller sees** | your enum | `anyhow::Error` |
| **Best feature** | rich, matchable variants | fast development plus `.context()` |

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ConfigError {
    #[error("missing configuration key: {0}")]
    MissingKey(String),

    #[error(transparent)]
    Io(#[from] std::io::Error),
}
```

```rust
use anyhow::{Context, Result};

fn main() -> Result<()> {
    let config = std::fs::read_to_string("config.toml")
        .context("failed to read config.toml")?;
    println!("{config}");
    Ok(())
}
```

For a Java-to-Rust migration, a good house rule is:

- reusable crates and service modules use `thiserror`
- binary entrypoints use `anyhow`

## Layered Service Example

This pattern becomes especially useful in a Spring Boot style service split into repository, service, and handler layers:

```rust
pub async fn create_user(repo: &UserRepository, req: CreateUser) -> AppResult<User> {
    if req.email.trim().is_empty() {
        return Err(AppError::Validation {
            message: "email cannot be empty".into(),
        });
    }

    let exists = repo.email_exists(&req.email).await?;
    if exists {
        return Err(AppError::Validation {
            message: "email already exists".into(),
        });
    }

    repo.insert(req).await
}
```

The repository contributes database failures through `?`. The service contributes domain failures through explicit enum variants. The handler converts `AppError` into HTTP responses. Responsibilities stay separated without burying errors in framework magic.

## Practical Rules

1. Keep one central error enum per crate unless there is a strong reason to split by bounded context.
2. Use variants for domain cases that callers may want to distinguish.
3. Use `#[from]` for infrastructure errors that should travel upward.
4. Use a result alias to keep every signature readable.
5. Convert to HTTP or CLI output only at the outer boundary.

---

## Exercises

<details>
<summary><strong>🏋️ Exercise: Design a Crate Error Type</strong> (click to expand)</summary>

Design an error type for a Rust replacement of a Spring Boot registration service:

1. Define `RegistrationError` with variants:
   `DuplicateEmail(String)`, `WeakPassword(String)`,
   `Database(#[from] sqlx::Error)`, `RateLimited { retry_after_secs: u64 }`
2. Create `type AppResult<T> = std::result::Result<T, RegistrationError>;`
3. Write `register_user(email: &str, password: &str) -> AppResult<()>`
4. Implement a small `IntoResponse` conversion for the HTTP boundary

<details>
<summary>🔑 Solution</summary>

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum RegistrationError {
    #[error("Email already registered: {0}")]
    DuplicateEmail(String),

    #[error("Password too weak: {0}")]
    WeakPassword(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Rate limited — retry after {retry_after_secs}s")]
    RateLimited { retry_after_secs: u64 },
}

pub type AppResult<T> = std::result::Result<T, RegistrationError>;

pub async fn register_user(email: &str, password: &str) -> AppResult<()> {
    if password.len() < 8 {
        return Err(RegistrationError::WeakPassword(
            "must be at least 8 characters".into(),
        ));
    }

    if email.contains("+spam") {
        return Err(RegistrationError::DuplicateEmail(email.to_string()));
    }

    Ok(())
}
```

</details>
</details>

***
