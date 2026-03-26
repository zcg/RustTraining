## Spring and Spring Boot Migration<br><span class="zh-inline">Spring 与 Spring Boot 迁移</span>

> **What you'll learn:** How Spring and Spring Boot concepts translate into idiomatic Rust service architecture, which Rust libraries usually replace familiar Spring features, and how to migrate one service without trying to clone the whole Spring ecosystem.<br><span class="zh-inline">**本章将学习：** Spring 与 Spring Boot 的核心概念如何迁移到符合 Rust 习惯的服务架构中，哪些 Rust 库通常会替代熟悉的 Spring 功能，以及怎样迁移一个服务而不是妄图克隆整个 Spring 生态。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

The biggest Spring-to-Rust mistake is searching for "the Rust Spring Boot."<br><span class="zh-inline">从 Spring 迁到 Rust 时，最大的误区就是拼命去找“Rust 版 Spring Boot”。</span>

Rust web development is more toolkit-oriented and much less centered around one giant framework.<br><span class="zh-inline">Rust 的 Web 开发生态更偏工具箱式组合，而不是围绕一个超级框架打天下。</span>

## Concept Mapping<br><span class="zh-inline">概念映射</span>

| Spring concept<br><span class="zh-inline">Spring 概念</span> | Common Rust direction<br><span class="zh-inline">Rust 常见对应方向</span> |
|---|---|
| `@RestController` | `axum` or `actix-web` handlers<br><span class="zh-inline">`axum` 或 `actix-web` 的 handler</span> |
| dependency injection container | explicit construction plus shared state<br><span class="zh-inline">显式构造加共享状态</span> |
| `@ConfigurationProperties` | config structs plus env/file loading<br><span class="zh-inline">配置结构体加环境变量或文件加载</span> |
| servlet filter chain | `tower` middleware<br><span class="zh-inline">`tower` 中间件</span> |
| `@ControllerAdvice` | `IntoResponse` or top-level error mapping<br><span class="zh-inline">`IntoResponse` 或顶层错误映射</span> |
| `JpaRepository` | `sqlx`, `sea-orm`, or handwritten repositories<br><span class="zh-inline">`sqlx`、`sea-orm` 或手写 repository</span> |

## What Changes the Most<br><span class="zh-inline">变化最大的地方</span>

### 1. Dependency Wiring Becomes Explicit<br><span class="zh-inline">依赖装配会变得显式</span>

```rust
#[derive(Clone)]
struct AppState {
    user_service: UserService,
    audit_service: AuditService,
}
```

Spring relies on the container to build the object graph.<br><span class="zh-inline">Spring 依赖容器去构建对象图。</span>

Rust usually wants that wiring visible in startup code.<br><span class="zh-inline">Rust 更希望这套装配逻辑直接写在启动代码里，让人一眼看明白。</span>

### 2. Reflection Stops Being the Center<br><span class="zh-inline">反射不再处在系统中心</span>

Spring leans heavily on annotations, proxies, and runtime discovery.<br><span class="zh-inline">Spring 很依赖注解、代理和运行时发现机制。</span>

Rust ecosystems usually prefer:<br><span class="zh-inline">Rust 生态通常更偏好：</span>

- derives for data boilerplate<br><span class="zh-inline">用 derive 处理数据样板代码。</span>
- middleware for cross-cutting concerns<br><span class="zh-inline">用中间件承接横切关注点。</span>
- plain functions plus explicit types<br><span class="zh-inline">用普通函数和显式类型完成主逻辑。</span>

### 3. Data Access Gets More Honest<br><span class="zh-inline">数据访问会变得更诚实</span>

Spring Boot teams often carry JPA habits such as inferred repositories and hidden query behavior.<br><span class="zh-inline">Spring Boot 团队往往会带着 JPA 的思维惯性，比如推断式 repository 和隐藏的查询行为。</span>

Rust teams usually choose earlier between explicit SQL, a lighter ORM, or a small handwritten repository layer.<br><span class="zh-inline">Rust 团队通常会更早在显式 SQL、较轻的 ORM、或小型手写 repository 层之间做选择。</span>

For migration work, `sqlx` is often the easiest mental reset.<br><span class="zh-inline">在迁移场景里，`sqlx` 往往是最容易把脑子掰正过来的选择。</span>

## Typical Service Shape<br><span class="zh-inline">典型服务形态</span>

Spring Boot often looks like this:<br><span class="zh-inline">Spring Boot 常见结构是这样：</span>

```text
controller -> service -> repository -> database
```

Rust often looks like this:<br><span class="zh-inline">Rust 服务更常见的是这样：</span>

```text
router -> handler -> service -> repository -> database
```

The key change is not the number of layers; it is the disappearance of hidden framework behavior.<br><span class="zh-inline">真正的关键变化不在于层数，而在于隐藏的框架行为被拿掉了。</span>

## From Controller to Handler<br><span class="zh-inline">从 Controller 到 Handler</span>

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

```rust
async fn get_user(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<UserResponse>, AppError> {
    let user = state.user_service.get_user(id).await?;
    Ok(Json(user))
}
```

The handler is just a function, which is a huge part of why Rust services feel easier to trace.<br><span class="zh-inline">handler 就是一个普通函数，这也是 Rust 服务为什么会显得更容易追踪的一大原因。</span>

## Practical Advice<br><span class="zh-inline">实用建议</span>

- keep the HTTP contract stable first<br><span class="zh-inline">先把 HTTP 契约稳住。</span>
- migrate one bounded context at a time<br><span class="zh-inline">一次迁一个边界清晰的上下文。</span>
- move business rules before chasing framework parity<br><span class="zh-inline">先搬业务规则，再谈框架表面对齐。</span>
- do not rebuild Spring in macros<br><span class="zh-inline">别想着用宏把 Spring 整个再造一遍。</span>

Rust migration works best when the result is a good Rust service, not a bitter imitation of a Spring service.<br><span class="zh-inline">迁移最成功的状态，是最后得到一个好的 Rust 服务，而不是一个带着怨气模仿 Spring 的 Rust 程序。</span>

