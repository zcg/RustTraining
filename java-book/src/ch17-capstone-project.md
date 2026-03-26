## Capstone Project: Migrate a Spring Boot User Service

> **What you'll learn:** How to migrate a small Spring Boot user service into a Rust web service step by step, preserving the HTTP contract while changing the implementation model from container-driven Java to explicit Rust composition.
>
> **Difficulty:** 🔴 Advanced

This capstone is intentionally shaped like everyday Java backend work instead of a toy CLI example. The source system is a small Spring Boot service with:

- `GET /users/{id}`
- `POST /users`
- simple validation
- a repository layer
- JSON request and response payloads

The migration objective is not to imitate Spring Boot line by line. The objective is to preserve behavior while adopting Rust-native design.

## Source Shape in Spring Boot

```text
controller -> service -> repository -> database
```

Typical pieces:

- `@RestController`
- `@Service`
- `@Repository`
- request DTOs
- response DTOs

Example Java sketch:

```java
@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable UUID id) {
        return userService.getUser(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }
}
```

## Target Shape in Rust

```text
router -> handler -> service -> repository -> database
```

Suggested crate stack:

```toml
[dependencies]
axum = "0.8"
serde = { version = "1", features = ["derive"] }
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "postgres", "uuid"] }
tokio = { version = "1", features = ["full"] }
thiserror = "2"
uuid = { version = "1", features = ["serde", "v4"] }
```

## Step 1: Freeze the Contract First

Before touching implementation details, write down the contract that must remain stable:

- route paths
- payload shapes
- status codes
- validation rules

For example:

```json
POST /users
{
  "email": "alice@example.com",
  "display_name": "Alice"
}
```

Response:

```json
{
  "id": "0f3df13f-13ce-4fd4-8c4b-53f62f98f3d7",
  "email": "alice@example.com",
  "display_name": "Alice"
}
```

If the contract drifts during migration, it becomes impossible to tell whether a failure came from business logic or interface churn.

## Step 2: Design the Rust Crate Layout

```text
src/
  main.rs
  config.rs
  error.rs
  http/
    handlers.rs
  domain/
    user.rs
  repository/
    user_repository.rs
  service/
    user_service.rs
```

This mirrors familiar controller/service/repository separation, but each module is plain Rust rather than a Spring stereotype.

## Step 3: Define DTOs and Domain Types

Wire-format types should stay close to the HTTP boundary:

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub display_name: String,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub display_name: String,
}
```

Domain types should express stronger guarantees:

```rust
#[derive(Debug, Clone)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub display_name: String,
}
```

This separation is the Rust equivalent of keeping controller DTOs distinct from domain objects.

## Step 4: Introduce Explicit Validation During Conversion

Instead of relying on annotation magic, validate explicitly when converting the request into a domain input:

```rust
pub struct NewUser {
    pub email: String,
    pub display_name: String,
}

impl TryFrom<CreateUserRequest> for NewUser {
    type Error = AppError;

    fn try_from(value: CreateUserRequest) -> Result<Self, Self::Error> {
        let email = value.email.trim().to_ascii_lowercase();
        let display_name = value.display_name.trim().to_string();

        if !email.contains('@') {
            return Err(AppError::Validation {
                message: "email must contain @".into(),
            });
        }

        if display_name.is_empty() {
            return Err(AppError::Validation {
                message: "display_name cannot be blank".into(),
            });
        }

        Ok(Self { email, display_name })
    }
}
```

This is easier to reason about than scattering validation between annotations, binders, and advice handlers.

## Step 5: Build the Repository with Visible SQL

For this migration, `sqlx` is a good fit because it avoids rebuilding a JPA mental model on day one.

```rust
pub struct UserRepository {
    pool: sqlx::PgPool,
}

impl UserRepository {
    pub fn new(pool: sqlx::PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_id(&self, id: uuid::Uuid) -> Result<Option<User>, sqlx::Error> {
        sqlx::query_as!(
            User,
            "select id, email, display_name from users where id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await
    }
}
```

Compared with Spring Data JPA, this is more explicit and less magical. That is exactly the point.

## Step 6: Move Business Rules into a Service Module

```rust
pub struct UserService {
    repo: UserRepository,
}

impl UserService {
    pub fn new(repo: UserRepository) -> Self {
        Self { repo }
    }

    pub async fn get_user(&self, id: uuid::Uuid) -> AppResult<User> {
        self.repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound {
                entity: "user".into(),
                id: id.to_string(),
            })
    }
}
```

This looks familiar to Java service developers, but the failures are now typed and explicit.

## Step 7: Wire Handlers and Shared State

```rust
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

#[derive(Clone)]
pub struct AppState {
    pub user_service: std::sync::Arc<UserService>,
}

async fn get_user(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> AppResult<Json<UserResponse>> {
    let user = state.user_service.get_user(id).await?;
    Ok(Json(UserResponse {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
    }))
}

async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUserRequest>,
) -> AppResult<(StatusCode, Json<UserResponse>)> {
    let input = NewUser::try_from(payload)?;
    let user = state.user_service.create_user(input).await?;
    Ok((
        StatusCode::CREATED,
        Json(UserResponse {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
        }),
    ))
}
```

This replaces `@RestController`, parameter binding, and response serialization with plain functions and typed extractors.

## Step 8: Add an Error Boundary Equivalent to `@ControllerAdvice`

```rust
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("validation failed: {message}")]
    Validation { message: String },

    #[error("not found: {entity} {id}")]
    NotFound { entity: String, id: String },

    #[error(transparent)]
    Database(#[from] sqlx::Error),
}

pub type AppResult<T> = std::result::Result<T, AppError>;

#[derive(Serialize)]
struct ErrorResponse {
    code: &'static str,
    message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::Validation { message } => (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    code: "validation_error",
                    message,
                }),
            )
                .into_response(),
            AppError::NotFound { entity, id } => (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    code: "not_found",
                    message: format!("{entity} {id} not found"),
                }),
            )
                .into_response(),
            AppError::Database(error) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    code: "database_error",
                    message: error.to_string(),
                }),
            )
                .into_response(),
        }
    }
}
```

This is the Rust equivalent of centralized exception translation.

## Step 9: Write Integration Tests Before Declaring Victory

The best migration confidence comes from black-box tests:

- `GET /users/{id}` returns the same status and payload shape as before
- `POST /users` enforces the same validation rules
- error bodies remain stable enough for clients

For a Spring Boot migration, contract-level tests are far more valuable than arguing over framework aesthetics.

## Step 10: Roll Out Safely

Reasonable rollout patterns:

- mirror traffic
- shadow reads first
- migrate a small tenant or region
- keep the old Spring Boot service available during comparison

Measure:

- p95 and p99 latency
- memory footprint
- error rate
- startup time

## Why This Capstone Matters

This project forces practice with nearly every major Java-to-Rust transition:

- DTO to domain conversion
- explicit dependency wiring
- `Result` instead of exception flow
- handler/service/repository separation
- SQL visibility instead of repository inference
- HTTP contract preservation during migration

Once this capstone feels manageable, migrating a small real Spring Boot service becomes a realistic engineering task instead of an abstract hope.
