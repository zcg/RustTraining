## Spring and Spring Boot Migration

> **What you'll learn:** How Spring and Spring Boot concepts translate into idiomatic Rust service architecture, which Rust libraries usually replace familiar Spring features, and how to migrate one service without trying to clone the whole Spring ecosystem.
>
> **Difficulty:** 🟡 Intermediate

The biggest Spring-to-Rust mistake is hunting for "the Rust Spring Boot." That usually sends teams into a dead end, because Rust service development is more toolkit-oriented and much less centered around one container plus one annotation model.

The productive question is not "Which crate is Spring?" It is "Which combination of crates covers this service's real needs?"

## Concept Mapping

| Spring / Spring Boot concept | Common Rust direction | Notes |
|---|---|---|
| `@RestController` | `axum` or `actix-web` handlers | Handlers are plain async functions |
| dependency injection container | explicit construction plus shared app state | wiring is code, not reflection |
| `@ConfigurationProperties` | config structs plus `serde` and env/file loading | simpler and more visible |
| servlet filter chain | `tower` middleware | authentication, tracing, rate limits |
| `@ControllerAdvice` | `IntoResponse` or top-level error mapping | type-driven rather than exception-driven |
| Bean validation annotations | manual validation or helper crates | keep rules close to domain types |
| `JpaRepository` | `sqlx`, `sea-orm`, or handwritten repositories | less magic, more explicit SQL |
| `@Scheduled` | `tokio::time`, `cron`, or a separate worker | often split from the HTTP service |
| `RestTemplate` / `WebClient` | `reqwest` | explicit client ownership |

## What Changes the Most

### 1. No Container-Centric Worldview

Spring normalizes the idea that object graphs are built by the framework. Rust usually wants the service graph to be built explicitly:

```rust
#[derive(Clone)]
struct AppState {
    user_service: UserService,
    audit_service: AuditService,
}
```

This is more manual than Spring beans, but it is dramatically easier to trace when reading code and debugging startup behavior.

### 2. Reflection Moves Out of the Center

Spring leans hard on annotations, proxies, and runtime discovery. Rust ecosystems usually prefer:

- derives for data-model boilerplate
- middleware composition for cross-cutting concerns
- explicit constructors for dependencies
- types for validation and error boundaries

That means less magic, but it also means fewer invisible rules.

### 3. Data Access Becomes More Honest

Spring Boot teams often arrive with JPA habits:

- entity graphs
- lazy loading
- repository interfaces inferred by naming
- deep annotation-driven mapping

Rust teams usually choose earlier between three explicit options:

- raw SQL with `sqlx`
- a more ORM-like approach such as `sea-orm`
- a small handwritten repository layer over explicit queries

For teams migrating from Spring Boot, `sqlx` is often the easiest mental reset because the SQL remains visible and the query boundary is obvious.

## A Typical Rust Service Shape

Spring Boot often looks like this:

```text
controller -> service -> repository -> database
```

An equivalent Rust service often looks like this:

```text
router -> handler -> service -> repository -> database
```

The difference is mostly about where framework magic disappears:

- handler functions replace annotated controller methods
- shared state replaces bean lookup
- explicit error types replace exception conventions
- middleware replaces filter/interceptor stacks

## Framework Choices for Java Teams

For Java teams migrating services, these are common starting points:

- `axum`: excellent starting point for Spring Boot migrants because handlers, state, and middleware compose clearly
- `actix-web`: mature and fast, with a slightly different style that some teams like for high-throughput APIs
- `poem`: clean ergonomics and a smaller surface area than the larger ecosystems

For most migration tutorials and internal team onboarding, `axum` is usually the easiest place to start.

## From Spring Controller to Rust Handler

Java:

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
}
```

Rust:

```rust
use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    user_service: UserService,
}

async fn get_user(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<UserResponse>, AppError> {
    let user = state.user_service.get_user(id).await?;
    Ok(Json(user))
}
```

The handler is just a function. The framework extracts inputs and the service returns typed failures. There is very little ceremony between the route and the business rule.

## Configuration, Middleware, and App Wiring

Spring Boot startup often hides a lot inside auto-configuration. Rust startup is intentionally concrete:

```rust
let config = Config::from_env()?;
let pool = PgPoolOptions::new()
    .max_connections(config.database.max_connections)
    .connect(&config.database.url)
    .await?;

let state = AppState {
    user_service: UserService::new(UserRepository::new(pool)),
    audit_service: AuditService::new(),
};

let app = Router::new()
    .route("/users/:id", get(get_user))
    .with_state(state)
    .layer(tower_http::trace::TraceLayer::new_for_http());
```

This is the Rust answer to:

- bean construction
- configuration binding
- filter registration
- controller registration

Everything important is visible at startup.

## Replacing `JpaRepository`

Many Spring Boot teams expect a repository abstraction like this:

```java
public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByEmail(String email);
}
```

In Rust, the equivalent is usually either explicit SQL:

```rust
pub struct UserRepository {
    pool: sqlx::PgPool,
}

impl UserRepository {
    pub async fn find_by_email(&self, email: &str) -> Result<Option<UserRow>, sqlx::Error> {
        sqlx::query_as!(
            UserRow,
            "select id, email, display_name from users where email = $1",
            email
        )
        .fetch_optional(&self.pool)
        .await
    }
}
```

or a small trait if multiple implementations are truly needed. The main difference is that SQL and data shapes are explicit instead of inferred.

## Migration Sequence for One Spring Boot Service

The least painful path usually looks like this:

1. freeze the public API contract
2. write Rust request and response DTOs matching the current JSON
3. migrate one endpoint group first, usually reads before writes
4. add error mapping and logging
5. migrate writes and transactional flows
6. add integration tests comparing old and new behavior

Trying to recreate every Spring feature before the first endpoint works is the fastest way to waste weeks.

## What Usually Does Not Need a One-to-One Replacement

- annotations
- proxies
- bean post-processors
- AOP-driven indirection
- deep entity lifecycle callbacks

These features often exist in Spring because the framework is designed around runtime machinery. Rust usually prefers plain functions, middleware, and explicit composition.

## Practical Migration Advice

- keep HTTP contracts stable at the beginning
- migrate one bounded context at a time
- move business rules before polishing framework ergonomics
- choose observability early, not at the end
- resist the urge to rebuild Spring in macros

Rust service migration works best when the result is a good Rust service, not a resentful imitation of a Spring Boot service.
