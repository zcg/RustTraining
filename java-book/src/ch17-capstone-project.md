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

## Real-World Java-to-Rust References

All links in this section were verified as reachable on March 26, 2026.

- <a href="https://www.datadoghq.com/blog/engineering/how-we-migrated-our-static-analyzer-from-java-to-rust/" target="_blank" rel="noopener noreferrer"><strong>Datadog: static analyzer migration</strong></a>  
  Datadog migrated a production static analyzer from Java to Rust, used feature-parity tests to keep behavior stable, learned enough Rust to map the codebase in about 10 days, completed the overall migration within a month, and reported about 3x faster execution with roughly 10x lower memory use. This is one of the clearest public examples of a disciplined Java-to-Rust migration in a real product. [How we migrated our static analyzer from Java to Rust](https://www.datadoghq.com/blog/engineering/how-we-migrated-our-static-analyzer-from-java-to-rust/)

- <a href="https://medium.com/cimb-niaga-engineering/delivering-superior-banking-experiences-bc7ca491eae5" target="_blank" rel="noopener noreferrer"><strong>CIMB Niaga: banking microservice migration</strong></a>  
  CIMB Niaga migrated a critical internal authentication microservice from Java to Rust with a phased rollout that ran beside the Java service. Their public numbers are unusually concrete: startup time fell from about 31.9 seconds to under 1 second, CPU use dropped from 3 cores to 0.25 cores, and memory use fell from 3.8 GB to 8 MB. They also explicitly describe the learning curve as steep and mention knowledge sharing plus peer mentoring as part of the migration strategy. [Delivering Superior Banking Experiences](https://medium.com/cimb-niaga-engineering/delivering-superior-banking-experiences-bc7ca491eae5)

- <a href="https://upsilon.cc/~zack/research/publications/www-2024-webgraph-rs.pdf" target="_blank" rel="noopener noreferrer"><strong>WebGraph and Software Heritage: large-scale graph processing rewrite</strong></a>  
  The WebGraph team rewrote a long-standing Java graph-processing framework in Rust because JVM memory and memory-mapping limits became a bottleneck at Software Heritage scale. Their paper reports about 1.4x to 3.18x speedups on representative workloads and explains how Rust's type system and compilation model enabled a cleaner, faster implementation for huge immutable datasets. [WebGraph: The Next Generation (Is in Rust)](https://upsilon.cc/~zack/research/publications/www-2024-webgraph-rs.pdf)

- <a href="https://opensource.com/article/20/6/why-rust" target="_blank" rel="noopener noreferrer"><strong>Mike Bursell: a Java developer's transition notes</strong></a>  
  Mike Bursell describes taking one of his own Java projects and reimplementing it in Rust. The valuable part is the tone: enough of Rust felt familiar to keep going, ownership became understandable with practice, and Cargo plus compiler feedback made the language feel learnable rather than mystical. It is a good first-person account of what the transition feels like after years of Java. [Why I switched from Java to Rust](https://opensource.com/article/20/6/why-rust)

- <a href="https://keazkasun.medium.com/before-moving-to-rust-from-java-2b87a70654c0" target="_blank" rel="noopener noreferrer"><strong>Kasun Sameera: practical trade-offs before moving from Java</strong></a>  
  Kasun Sameera compares Rust web development with Spring Boot from a Java developer's perspective. The useful takeaway is the trade-off analysis: Rust web frameworks could outperform the same Spring Boot service, but the initial setup effort, library maturity, and convenience story still favored Java for many business applications. That balance is exactly what engineering teams need to judge honestly before migrating. [Before moving to Rust from Java](https://keazkasun.medium.com/before-moving-to-rust-from-java-2b87a70654c0)

## When Java Teams Should Migrate to Rust

Rust becomes a strong choice when most of the following are true:

- predictable latency, low memory usage, or fast startup materially affect user experience or operating cost
- the service does parser work, protocol handling, security scanning, gateways, agents, stream processing, or other infrastructure-heavy work where control over performance matters
- the migration target can be isolated behind a clear HTTP, gRPC, queue, or library boundary
- the team is willing to invest in ownership, borrowing, explicit error handling, and stronger test discipline
- success can be measured with concrete metrics instead of general excitement about a new language

Java should usually remain the default when most of the following are true:

- the main bottleneck is product complexity or delivery throughput rather than runtime performance
- Spring Boot, JPA, and the existing JVM platform are still the main reason the team ships quickly
- the team has no room for training, design reviews, or a slower first migration
- the proposal is a full rewrite with weak contract tests and no shadow rollout or rollback plan

A practical recommendation for Java teams is to migrate in this order:

1. start with one bounded service, parser, background worker, or performance-critical library
2. preserve the external contract first and improve internals second
3. run the Java and Rust implementations side by side during validation
4. measure latency, memory, startup time, and operational simplicity
5. expand only after the first migration clearly pays for itself

For most teams, Rust works best as a selective addition to the architecture, not as a blanket replacement for every Java service.
