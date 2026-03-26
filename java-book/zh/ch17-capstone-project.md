## Capstone Project: Migrate a Spring Boot User Service<br><span class="zh-inline">综合项目：迁移一个 Spring Boot 用户服务</span>

> **What you'll learn:** How to migrate a small Spring Boot user service into a Rust web service step by step, preserving the HTTP contract while changing the implementation model from container-driven Java to explicit Rust composition.<br><span class="zh-inline">**本章将学习：** 如何一步一步把一个小型 Spring Boot 用户服务迁移成 Rust Web 服务，在保持 HTTP 契约稳定的前提下，把实现方式从 Java 容器驱动切换成 Rust 的显式组合。</span>
>
> **Difficulty:** 🔴 Advanced<br><span class="zh-inline">**难度：** 🔴 高级</span>

This capstone is intentionally shaped like real Java backend work.<br><span class="zh-inline">这个综合项目故意做成贴近真实 Java 后端工作的形态，而不是玩具示例。</span>

The source service contains:<br><span class="zh-inline">原始服务包含下面这些内容：</span>

- `GET /users/{id}`<br><span class="zh-inline">查询用户接口。</span>
- `POST /users`<br><span class="zh-inline">创建用户接口。</span>
- request validation<br><span class="zh-inline">请求校验。</span>
- repository layer<br><span class="zh-inline">repository 层。</span>
- JSON request and response DTOs<br><span class="zh-inline">JSON 请求和响应 DTO。</span>

## Source Shape in Spring Boot<br><span class="zh-inline">Spring Boot 版本的结构</span>

```text
controller -> service -> repository -> database
```

Typical pieces include `@RestController`, `@Service`, `@Repository`, request DTOs, and response DTOs.<br><span class="zh-inline">典型组成就是 `@RestController`、`@Service`、`@Repository`、请求 DTO、响应 DTO 这些老熟人。</span>

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

## Target Shape in Rust<br><span class="zh-inline">Rust 版本的目标结构</span>

```text
router -> handler -> service -> repository -> database
```

Suggested crates:<br><span class="zh-inline">建议使用的 crate 组合：</span>

```toml
[dependencies]
axum = "0.8"
serde = { version = "1", features = ["derive"] }
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "postgres", "uuid"] }
tokio = { version = "1", features = ["full"] }
thiserror = "2"
uuid = { version = "1", features = ["serde", "v4"] }
```

## Step 1: Freeze the Contract<br><span class="zh-inline">第一步：先冻结接口契约</span>

Before changing implementation details, lock down:<br><span class="zh-inline">在动实现之前，先把这些东西钉死：</span>

- route paths<br><span class="zh-inline">路由路径。</span>
- JSON payload shapes<br><span class="zh-inline">JSON 载荷结构。</span>
- status codes<br><span class="zh-inline">状态码。</span>
- validation rules<br><span class="zh-inline">校验规则。</span>

If the contract changes during migration, debugging becomes muddy immediately.<br><span class="zh-inline">如果迁移过程中连契约都在乱变，排查问题时马上就会变得一团糟。</span>

## Step 2: Design the Rust Layout<br><span class="zh-inline">第二步：先设计 Rust 模块布局</span>

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

This keeps the familiar layered feeling without copying Spring stereotypes one by one.<br><span class="zh-inline">这样既保留了 Java 团队熟悉的分层感，又不会逐个复制 Spring stereotype。</span>

## Step 3: Separate DTOs and Domain Types<br><span class="zh-inline">第三步：把 DTO 和领域对象分开</span>

```rust
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

#[derive(Debug, Clone)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub display_name: String,
}
```

The request and response shapes belong to the HTTP boundary, while the domain type belongs to business logic.<br><span class="zh-inline">请求和响应结构属于 HTTP 边界，领域对象属于业务逻辑内部，这两者就应该分开。</span>

## Step 4: Validate During Conversion<br><span class="zh-inline">第四步：在转换阶段显式校验</span>

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

This replaces a lot of annotation-driven validation magic with plain, visible rules.<br><span class="zh-inline">这一步会把很多依赖注解的校验魔法，换成朴素而可见的规则代码。</span>

## Step 5: Keep SQL Visible<br><span class="zh-inline">第五步：让 SQL 保持可见</span>

```rust
pub struct UserRepository {
    pool: sqlx::PgPool,
}

impl UserRepository {
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

For migration work, this is often easier to reason about than jumping straight back into another layer of ORM magic.<br><span class="zh-inline">在迁移工作里，这通常比又一头扎进另一层 ORM 魔法更容易掌控。</span>

## Step 6: Move Business Logic into a Service<br><span class="zh-inline">第六步：把业务逻辑搬进 Service</span>

```rust
pub struct UserService {
    repo: UserRepository,
}

impl UserService {
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

This still feels familiar to Java developers, but errors are now explicit and typed.<br><span class="zh-inline">这一步对 Java 开发者来说依然很熟悉，只不过失败路径现在已经是显式且有类型的了。</span>

## Step 7: Wire Handlers and Shared State<br><span class="zh-inline">第七步：装配 Handler 和共享状态</span>

```rust
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
```

This is the Rust replacement for controller method binding plus dependency injection.<br><span class="zh-inline">这就是 Rust 对“controller 方法绑定加依赖注入”的替代方案。</span>

## Step 8: Build an Error Boundary<br><span class="zh-inline">第八步：建立错误边界</span>

Use `IntoResponse` to play the role that `@ControllerAdvice` often plays in Spring Boot.<br><span class="zh-inline">可以用 `IntoResponse` 去承担 Spring Boot 里 `@ControllerAdvice` 常承担的职责。</span>

Centralized error mapping keeps HTTP behavior stable while the internals change.<br><span class="zh-inline">即使内部实现正在迁移，集中式错误映射也能让外部 HTTP 行为保持稳定。</span>

## Step 9: Test the Contract<br><span class="zh-inline">第九步：围绕契约做测试</span>

The most valuable migration tests are black-box contract tests:<br><span class="zh-inline">迁移阶段最值钱的测试，其实是黑盒契约测试：</span>

- same status codes<br><span class="zh-inline">状态码一致。</span>
- same response shape<br><span class="zh-inline">响应结构一致。</span>
- same validation behavior<br><span class="zh-inline">校验行为一致。</span>

## Step 10: Roll Out Carefully<br><span class="zh-inline">第十步：谨慎发布</span>

- mirror traffic if possible<br><span class="zh-inline">能镜像流量就尽量镜像。</span>
- migrate one tenant or region first<br><span class="zh-inline">先迁一个租户或一个区域。</span>
- compare latency, memory, and error rate<br><span class="zh-inline">重点对比延迟、内存和错误率。</span>

## Why This Capstone Matters<br><span class="zh-inline">为什么这个综合项目很重要</span>

This one project forces practice with nearly every major Java-to-Rust transition:<br><span class="zh-inline">这个项目几乎会把 Java 迁到 Rust 时最关键的转换都练一遍：</span>

- DTO to domain conversion<br><span class="zh-inline">DTO 到领域对象转换。</span>
- explicit dependency wiring<br><span class="zh-inline">显式依赖装配。</span>
- `Result` instead of exceptions<br><span class="zh-inline">用 `Result` 替代异常流。</span>
- handler/service/repository separation<br><span class="zh-inline">handler、service、repository 分层。</span>
- explicit SQL and HTTP contract preservation<br><span class="zh-inline">显式 SQL 与 HTTP 契约保持稳定。</span>

