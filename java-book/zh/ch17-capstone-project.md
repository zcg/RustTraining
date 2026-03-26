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

## Real-World Java-to-Rust References<br><span class="zh-inline">真实世界的 Java 到 Rust 迁移参考</span>

All links in this section were verified as reachable on March 26, 2026.<br><span class="zh-inline">本节所有链接都已在 2026 年 3 月 26 日核验可访问。</span>

- **Datadog: static analyzer migration**<br><span class="zh-inline">Datadog：静态分析器迁移案例。</span>
  Datadog migrated a production static analyzer from Java to Rust, used feature-parity tests to keep behavior stable, learned enough Rust to map the codebase in about 10 days, completed the overall migration within a month, and reported about 3x faster execution with roughly 10x lower memory use. This is one of the clearest public examples of a disciplined Java-to-Rust migration in a real product. [How we migrated our static analyzer from Java to Rust](https://www.datadoghq.com/blog/engineering/how-we-migrated-our-static-analyzer-from-java-to-rust/)<br><span class="zh-inline">Datadog 把生产环境里的静态分析器从 Java 迁到 Rust，用特性对齐测试保证行为一致；团队大约 10 天摸清 Rust 的关键概念，1 个月完成整体迁移，并报告约 3 倍执行速度与约 10 倍内存下降。这是公开资料里非常扎实、也非常像真实工程迁移过程的一个案例。</span>

- **CIMB Niaga: banking microservice migration**<br><span class="zh-inline">CIMB Niaga：银行微服务迁移案例。</span>
  CIMB Niaga migrated a critical internal authentication microservice from Java to Rust with a phased rollout that ran beside the Java service. Their public numbers are unusually concrete: startup time fell from about 31.9 seconds to under 1 second, CPU use dropped from 3 cores to 0.25 cores, and memory use fell from 3.8 GB to 8 MB. They also explicitly describe the learning curve as steep and mention knowledge sharing plus peer mentoring as part of the migration strategy. [Delivering Superior Banking Experiences](https://medium.com/cimb-niaga-engineering/delivering-superior-banking-experiences-bc7ca491eae5)<br><span class="zh-inline">CIMB Niaga 把一个关键的内部认证微服务从 Java 迁到 Rust，而且是与原有 Java 服务并行逐步发布。它给出的公开数据很硬：启动时间从约 31.9 秒降到 1 秒以内，CPU 使用从 3 个核心降到 0.25 个核心，内存从 3.8 GB 降到 8 MB。同时他们也明确提到学习曲线比较陡，因此配套采用了知识分享和结对辅导。</span>

- **WebGraph and Software Heritage: large-scale graph processing rewrite**<br><span class="zh-inline">WebGraph 与 Software Heritage：超大规模图处理框架重写。</span>
  The WebGraph team rewrote a long-standing Java graph-processing framework in Rust because JVM memory and memory-mapping limits became a bottleneck at Software Heritage scale. Their paper reports about 1.4x to 3.18x speedups on representative workloads and explains how Rust's type system and compilation model enabled a cleaner, faster implementation for huge immutable datasets. [WebGraph: The Next Generation (Is in Rust)](https://upsilon.cc/~zack/research/publications/www-2024-webgraph-rs.pdf)<br><span class="zh-inline">WebGraph 团队之所以把一个存在多年的 Java 图处理框架改写成 Rust，核心原因是 Software Heritage 这种级别的数据规模下，JVM 的内存与内存映射限制已经成了瓶颈。论文里给出的代表性工作负载加速大约在 1.4 倍到 3.18 倍之间，也解释了 Rust 的类型系统和编译模型为什么更适合这类巨大而不可变的数据集。</span>

- **Mike Bursell: a Java developer's transition notes**<br><span class="zh-inline">Mike Bursell：Java 开发者迁到 Rust 的一手体验。</span>
  Mike Bursell describes taking one of his own Java projects and reimplementing it in Rust. The valuable part is the tone: enough of Rust felt familiar to keep going, ownership became understandable with practice, and Cargo plus compiler feedback made the language feel learnable rather than mystical. It is a good first-person account of what the transition feels like after years of Java. [Why I switched from Java to Rust](https://opensource.com/article/20/6/why-rust)<br><span class="zh-inline">Mike Bursell 讲的是把自己的一个 Java 项目改用 Rust 重写后的真实感受。这个文章有价值的地方在于它很克制：Rust 里有不少地方能让 Java 开发者保持熟悉感，所有权一开始确实拧巴，但通过练习会逐步理解，而 Cargo 加上编译器反馈会让学习过程变得非常具体。</span>

- **Kasun Sameera: practical trade-offs before moving from Java**<br><span class="zh-inline">Kasun Sameera：迁移前必须正视的现实权衡。</span>
  Kasun Sameera compares Rust web development with Spring Boot from a Java developer's perspective. The useful takeaway is the trade-off analysis: Rust web frameworks could outperform the same Spring Boot service, but the initial setup effort, library maturity, and convenience story still favored Java for many business applications. That balance is exactly what engineering teams need to judge honestly before migrating. [Before moving to Rust from Java](https://keazkasun.medium.com/before-moving-to-rust-from-java-2b87a70654c0)<br><span class="zh-inline">Kasun Sameera 从 Java 开发者视角把 Rust Web 开发和 Spring Boot 做了一个比较。真正值得看的是他的权衡分析：Rust Web 框架确实可能比同类 Spring Boot 服务更快，但初始化成本、类库成熟度和业务开发便利性，在很多场景里依然还是 Java 更占优。迁移前把这件事想明白，比一腔热血冲过去靠谱得多。</span>

## When Java Teams Should Migrate to Rust<br><span class="zh-inline">什么条件下适合从 Java 迁到 Rust</span>

Rust becomes a strong choice when most of the following are true:<br><span class="zh-inline">如果下面这些条件大部分都成立，那么 Rust 会是很强的选择：</span>

- predictable latency, low memory usage, or fast startup materially affect user experience or operating cost<br><span class="zh-inline">稳定延迟、低内存占用或快速启动，会直接影响用户体验或者运行成本。</span>
- the service does parser work, protocol handling, security scanning, gateways, agents, stream processing, or other infrastructure-heavy work where control over performance matters<br><span class="zh-inline">服务主要承担解析器、协议处理、安全扫描、网关、Agent、流处理这类基础设施型工作，而且性能控制真的很重要。</span>
- the migration target can be isolated behind a clear HTTP, gRPC, queue, or library boundary<br><span class="zh-inline">迁移目标可以被清晰地隔离在 HTTP、gRPC、消息队列或者库接口边界之后。</span>
- the team is willing to invest in ownership, borrowing, explicit error handling, and stronger test discipline<br><span class="zh-inline">团队愿意投入时间掌握所有权、借用、显式错误处理，以及更严格的测试纪律。</span>
- success can be measured with concrete metrics instead of general excitement about a new language<br><span class="zh-inline">迁移成效可以用明确指标来衡量，而不是只靠对新语言的兴奋感。</span>

Java should usually remain the default when most of the following are true:<br><span class="zh-inline">如果下面这些情况更贴近现实，那么继续留在 Java 往往更合适：</span>

- the main bottleneck is product complexity or delivery throughput rather than runtime performance<br><span class="zh-inline">主要瓶颈是业务复杂度或者交付速度，而不是运行时性能。</span>
- Spring Boot, JPA, and the existing JVM platform are still the main reason the team ships quickly<br><span class="zh-inline">Spring Boot、JPA 和现有 JVM 平台，依然是团队快速交付的主要原因。</span>
- the team has no room for training, design reviews, or a slower first migration<br><span class="zh-inline">团队当前没有余力做培训、设计评审，或者承受第一次迁移带来的节奏变慢。</span>
- the proposal is a full rewrite with weak contract tests and no shadow rollout or rollback plan<br><span class="zh-inline">方案是整块重写，但契约测试很弱，也没有影子发布和回滚预案。</span>

A practical recommendation for Java teams is to migrate in this order:<br><span class="zh-inline">比较务实的迁移顺序可以是这样：</span>

1. start with one bounded service, parser, background worker, or performance-critical library<br><span class="zh-inline">先挑一个边界清楚的服务、解析器、后台任务，或者性能敏感的库开始。</span>
2. preserve the external contract first and improve internals second<br><span class="zh-inline">先保证外部契约稳定，再谈内部实现优化。</span>
3. run the Java and Rust implementations side by side during validation<br><span class="zh-inline">验证阶段让 Java 与 Rust 两套实现并行运行。</span>
4. measure latency, memory, startup time, and operational simplicity<br><span class="zh-inline">重点测量延迟、内存、启动时间和运维复杂度。</span>
5. expand only after the first migration clearly pays for itself<br><span class="zh-inline">等第一批迁移确实证明有价值之后，再继续扩大范围。</span>

For most teams, Rust works best as a selective addition to the architecture, not as a blanket replacement for every Java service.<br><span class="zh-inline">对大多数团队来说，Rust 更适合作为架构里的选择性补强，而不是把所有 Java 服务一股脑全换掉。</span>
