## Incremental Adoption Strategy<br><span class="zh-inline">渐进式引入策略</span>

> **What you'll learn:** A phased plan for bringing Rust into a C# / .NET organization, starting with learning exercises, moving to performance-sensitive replacements, and finally reaching new service development, along with concrete team timelines.<br><span class="zh-inline">**本章将学习：** 如何在 C# / .NET 团队里分阶段引入 Rust：先做学习型练习，再替换性能敏感部件，最后推进到新服务开发，同时给出更具体的团队时间安排。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 进阶</span>

### Phase 1: Learning and Experimentation (Weeks 1-4)<br><span class="zh-inline">阶段一：学习与试验（第 1 到 4 周）</span>

```rust
// Start with command-line tools and utilities
// Example: Log file analyzer
use std::collections::HashMap;
use std::fs;
use clap::Parser;

#[derive(Parser)]
#[command(author, version, about)]
struct Args {
    #[arg(short, long)]
    file: String,

    #[arg(short, long, default_value = "10")]
    top: usize,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    let content = fs::read_to_string(&args.file)?;
    let mut word_count = HashMap::new();

    for line in content.lines() {
        for word in line.split_whitespace() {
            let word = word.to_lowercase();
            *word_count.entry(word).or_insert(0) += 1;
        }
    }

    let mut sorted: Vec<_> = word_count.into_iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(&a.1));

    for (word, count) in sorted.into_iter().take(args.top) {
        println!("{}: {}", word, count);
    }

    Ok(())
}
```

The first phase should stay deliberately small. Command-line tools, file processors, and one-off utilities let the team learn ownership, error handling, and Cargo without putting production traffic at stake.<br><span class="zh-inline">第一阶段故意要选小东西。命令行工具、文件处理器、一次性实用脚本，足够让团队摸清所有权、错误处理和 Cargo，又不会一上来就把生产流量压上去。</span>

### Phase 2: Replace Performance-Critical Components (Weeks 5-8)<br><span class="zh-inline">阶段二：替换性能敏感部件（第 5 到 8 周）</span>

```rust
// Replace CPU-intensive data processing
// Example: Image processing microservice
use image::{DynamicImage, ImageBuffer, Rgb};
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use warp::Filter;

#[derive(Serialize, Deserialize)]
struct ProcessingRequest {
    image_data: Vec<u8>,
    operation: String,
    parameters: serde_json::Value,
}

#[derive(Serialize)]
struct ProcessingResponse {
    processed_image: Vec<u8>,
    processing_time_ms: u64,
}

async fn process_image(request: ProcessingRequest) -> Result<ProcessingResponse, Box<dyn std::error::Error + Send + Sync>> {
    let start = std::time::Instant::now();

    let img = image::load_from_memory(&request.image_data)?;

    let processed = match request.operation.as_str() {
        "blur" => {
            let radius = request.parameters["radius"].as_f64().unwrap_or(2.0) as f32;
            img.blur(radius)
        }
        "grayscale" => img.grayscale(),
        "resize" => {
            let width = request.parameters["width"].as_u64().unwrap_or(100) as u32;
            let height = request.parameters["height"].as_u64().unwrap_or(100) as u32;
            img.resize(width, height, image::imageops::FilterType::Lanczos3)
        }
        _ => return Err("Unknown operation".into()),
    };

    let mut buffer = Vec::new();
    processed.write_to(&mut std::io::Cursor::new(&mut buffer), image::ImageOutputFormat::Png)?;

    Ok(ProcessingResponse {
        processed_image: buffer,
        processing_time_ms: start.elapsed().as_millis() as u64,
    })
}

#[tokio::main]
async fn main() {
    let process_route = warp::path("process")
        .and(warp::post())
        .and(warp::body::json())
        .and_then(|req: ProcessingRequest| async move {
            match process_image(req).await {
                Ok(response) => Ok(warp::reply::json(&response)),
                Err(e) => Err(warp::reject::custom(ProcessingError(e.to_string()))),
            }
        });

    warp::serve(process_route)
        .run(([127, 0, 0, 1], 3030))
        .await;
}

#[derive(Debug)]
struct ProcessingError(String);
impl warp::reject::Reject for ProcessingError {}
```

This phase is where Rust starts paying rent. Image manipulation, batch transforms, parsers, compression, and protocol handling are all strong candidates because throughput and memory predictability matter there.<br><span class="zh-inline">到了这一阶段，Rust 才开始真正体现“值回票价”。像图像处理、批量转换、解析器、压缩、协议编解码这些地方，本来就对吞吐和内存可预测性更敏感，非常适合作为替换对象。</span>

### Phase 3: New Microservices (Weeks 9-12)<br><span class="zh-inline">阶段三：新微服务采用 Rust（第 9 到 12 周）</span>

```rust
// Build new services from scratch in Rust
// Example: Authentication service
use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres};
use uuid::Uuid;
use bcrypt::{hash, verify, DEFAULT_COST};

#[derive(Clone)]
struct AppState {
    db: Pool<Postgres>,
    jwt_secret: String,
}

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

#[derive(Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Serialize)]
struct LoginResponse {
    token: String,
    user_id: Uuid,
}

async fn login(
    State(state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    let user = sqlx::query!(
        "SELECT id, password_hash FROM users WHERE email = $1",
        request.email
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let user = user.ok_or(StatusCode::UNAUTHORIZED)?;

    if !verify(&request.password, &user.password_hash)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let claims = Claims {
        sub: user.id.to_string(),
        exp: (chrono::Utc::now() + chrono::Duration::hours(24)).timestamp() as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_ref()),
    )
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(LoginResponse {
        token,
        user_id: user.id,
    }))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = std::env::var("DATABASE_URL")?;
    let jwt_secret = std::env::var("JWT_SECRET")?;

    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(20)
        .connect(&database_url)
        .await?;

    let app_state = AppState {
        db: pool,
        jwt_secret,
    };

    let app = Router::new()
        .route("/login", post(login))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, app).await?;

    Ok(())
}
```

By the time the team reaches this phase, Rust should stop being “that experimental side language” and become a normal choice for greenfield services. New services are often a better fit than rewrites because they avoid the complexity of carrying old architecture decisions along.<br><span class="zh-inline">等团队走到这一阶段时，Rust 就不该再被当成“那个试验性质的边角语言”，而应该成为新项目的正常选项。很多时候，新服务比大规模重写老系统更适合 Rust，因为它不需要背着历史架构包袱前进。</span>

***

## Team Adoption Timeline<br><span class="zh-inline">团队采用时间线</span>

### Month 1: Foundation<br><span class="zh-inline">第 1 个月：打基础</span>

**Week 1-2: Syntax and Ownership**<br><span class="zh-inline">**第 1 到 2 周：语法与所有权**</span>
- Basic syntax differences from C#<br><span class="zh-inline">C# 与 Rust 的基础语法差异</span>
- Understanding ownership, borrowing, and lifetimes<br><span class="zh-inline">理解所有权、借用和生命周期</span>
- Small exercises: CLI tools, file processing<br><span class="zh-inline">小练习：命令行工具、文件处理</span>

**Week 3-4: Error Handling and Types**<br><span class="zh-inline">**第 3 到 4 周：错误处理与类型系统**</span>
- `Result<T, E>` vs exceptions<br><span class="zh-inline">`Result&lt;T, E&gt;` 和异常的差异</span>
- `Option<T>` vs nullable types<br><span class="zh-inline">`Option&lt;T&gt;` 和可空类型的区别</span>
- Pattern matching and exhaustive checking<br><span class="zh-inline">模式匹配与穷尽性检查</span>

**Recommended exercises:**<br><span class="zh-inline">**推荐练习：**</span>

```rust
fn process_log_file(path: &str) -> Result<Vec<String>, std::io::Error> {
    let content = std::fs::read_to_string(path)?;
    let errors: Vec<String> = content
        .lines()
        .filter(|line| line.contains("ERROR"))
        .map(|line| line.to_string())
        .collect();
    Ok(errors)
}

use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug)]
struct LogEntry {
    timestamp: String,
    level: String,
    message: String,
}

fn parse_log_entries(json_str: &str) -> Result<Vec<LogEntry>, Box<dyn std::error::Error>> {
    let entries: Vec<LogEntry> = serde_json::from_str(json_str)?;
    Ok(entries)
}
```

### Month 2: Practical Applications<br><span class="zh-inline">第 2 个月：进入实战</span>

**Week 5-6: Traits and Generics**<br><span class="zh-inline">**第 5 到 6 周：Trait 与泛型**</span>
- Trait system vs interfaces<br><span class="zh-inline">Trait 系统与接口的差异</span>
- Generic constraints and bounds<br><span class="zh-inline">泛型约束与 bound</span>
- Common patterns and idioms<br><span class="zh-inline">常见模式与惯用法</span>

**Week 7-8: Async Programming and Concurrency**<br><span class="zh-inline">**第 7 到 8 周：异步与并发**</span>
- `async` / `await` similarities and differences<br><span class="zh-inline">`async` / `await` 的相似点与不同点</span>
- Channels for communication<br><span class="zh-inline">用 channel 做通信</span>
- Thread safety guarantees<br><span class="zh-inline">线程安全保证</span>

**Recommended projects:**<br><span class="zh-inline">**推荐项目：**</span>

```rust
trait DataProcessor<T> {
    type Output;
    type Error;

    fn process(&self, data: T) -> Result<Self::Output, Self::Error>;
}

struct JsonProcessor;

impl DataProcessor<&str> for JsonProcessor {
    type Output = serde_json::Value;
    type Error = serde_json::Error;

    fn process(&self, data: &str) -> Result<Self::Output, Self::Error> {
        serde_json::from_str(data)
    }
}

async fn fetch_and_process_data(urls: Vec<&str>) -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();

    let tasks: Vec<_> = urls
        .into_iter()
        .map(|url| {
            let client = client.clone();
            tokio::spawn(async move {
                let response = client.get(url).send().await?;
                let text = response.text().await?;
                println!("Fetched {} bytes from {}", text.len(), url);
                Ok::<(), reqwest::Error>(())
            })
        })
        .collect();

    for task in tasks {
        task.await??;
    }

    Ok(())
}
```

### Month 3+: Production Integration<br><span class="zh-inline">第 3 个月以后：进入生产整合</span>

**Week 9-12: Real Project Work**<br><span class="zh-inline">**第 9 到 12 周：真实项目改造**</span>
- Choose a non-critical component to rewrite<br><span class="zh-inline">挑一个非核心部件做重写</span>
- Implement comprehensive error handling<br><span class="zh-inline">把错误处理做完整</span>
- Add logging, metrics, and testing<br><span class="zh-inline">补上日志、指标和测试</span>
- Performance profiling and optimization<br><span class="zh-inline">做性能分析和优化</span>

**Ongoing: Team Review and Mentoring**<br><span class="zh-inline">**持续进行：代码审查与内部带教**</span>
- Code reviews focusing on Rust idioms<br><span class="zh-inline">代码审查重点盯 Rust 惯用法</span>
- Pair programming sessions<br><span class="zh-inline">安排结对编程</span>
- Knowledge sharing sessions<br><span class="zh-inline">定期做知识分享</span>

The real trick of incremental adoption is not syntax training. It is choosing the right order: learn safely, earn trust with performance wins, and only then let Rust enter core delivery paths.<br><span class="zh-inline">渐进式引入真正的关键并不是“先把语法背熟”，而是顺序要对：先在低风险场景里学会，再用明确的性能收益建立信心，最后才让 Rust 进入核心交付路径。</span>

***
