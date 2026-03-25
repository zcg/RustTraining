## Logging and Tracing: syslog/printf → `log` + `tracing`<br><span class="zh-inline">日志与追踪：从 syslog/printf 到 `log` + `tracing`</span>

> **What you'll learn:** Rust's two-layer logging architecture (facade + backend), the `log` and `tracing` crates, structured logging with spans, and how this replaces `printf`/`syslog` debugging.<br><span class="zh-inline">**本章将学到什么：** Rust 的双层日志架构，也就是 facade 加 backend；`log` 和 `tracing` 这两个核心 crate；带 span 的结构化日志；以及这一整套是怎样替代 `printf` / `syslog` 式调试的。</span>

C++ diagnostic code typically uses `printf`, `syslog`, or custom logging frameworks. Rust has a standardized two-layer logging architecture: a **facade** crate (`log` or `tracing`) and a **backend** (the actual logger implementation).<br><span class="zh-inline">C++ 诊断代码里最常见的是 `printf`、`syslog`，或者各写各的日志框架。Rust 这边则已经形成了标准化的双层结构：前面是一层 **facade** crate，例如 `log` 或 `tracing`，后面再挂真正负责输出的 **backend**。</span>

### The `log` facade — Rust's universal logging API<br><span class="zh-inline">`log` facade：Rust 通用日志 API</span>

The `log` crate provides macros that mirror syslog severity levels. Libraries use `log` macros; binaries choose a backend:<br><span class="zh-inline">`log` crate 提供了一套和 syslog 严重级别非常接近的宏。库通常只写 `log` 宏，最终具体输出到哪里，由二进制程序决定后端：</span>

```rust
// Cargo.toml
// [dependencies]
// log = "0.4"
// env_logger = "0.11"    # One of many backends

use log::{info, warn, error, debug, trace};

fn check_sensor(id: u32, temp: f64) {
    trace!("Reading sensor {id}");           // Finest granularity
    debug!("Sensor {id} raw value: {temp}"); // Development-time detail

    if temp > 85.0 {
        warn!("Sensor {id} high temperature: {temp}°C");
    }
    if temp > 95.0 {
        error!("Sensor {id} CRITICAL: {temp}°C — initiating shutdown");
    }
    info!("Sensor {id} check complete");     // Normal operation
}

fn main() {
    // Initialize the backend — typically done once in main()
    env_logger::init();  // Controlled by RUST_LOG env var

    check_sensor(0, 72.5);
    check_sensor(1, 91.0);
}
```

```bash
# Control log level via environment variable
RUST_LOG=debug cargo run          # Show debug and above
RUST_LOG=warn cargo run           # Show only warn and error
RUST_LOG=my_crate=trace cargo run # Per-module filtering
RUST_LOG=my_crate::gpu=debug,warn cargo run  # Mix levels
```

### C++ comparison<br><span class="zh-inline">和 C++ 的对照</span>

| C++ | Rust (`log`) | Notes |
|-----|-------------|-------|
| `printf("DEBUG: %s\n", msg)`<br><span class="zh-inline">`printf("DEBUG: %s\n", msg)`</span> | `debug!("{msg}")`<br><span class="zh-inline">`debug!("{msg}")`</span> | Format checked at compile time<br><span class="zh-inline">格式在编译期就会检查</span> |
| `syslog(LOG_ERR, "...")`<br><span class="zh-inline">`syslog(LOG_ERR, "...")`</span> | `error!("...")`<br><span class="zh-inline">`error!("...")`</span> | Backend decides where output goes<br><span class="zh-inline">实际输出目标由后端决定</span> |
| `#ifdef DEBUG` around log calls<br><span class="zh-inline">用 `#ifdef DEBUG` 包日志调用</span> | `trace!` / `debug!` compiled out at max_level<br><span class="zh-inline">`trace!` / `debug!` 在高优化级别下可被编译期裁掉</span> |
| Custom `Logger::log(level, msg)`<br><span class="zh-inline">自定义 `Logger::log(level, msg)`</span> | `log::info!("...")` — all crates use same API<br><span class="zh-inline">`log::info!("...")`，全生态共用一套 API</span> |
| Per-file log verbosity<br><span class="zh-inline">按文件调日志级别</span> | `RUST_LOG=crate::module=level`<br><span class="zh-inline">`RUST_LOG=crate::module=level`</span> | Environment-based, no recompile<br><span class="zh-inline">环境变量控制，不需要重编译</span> |

### The `tracing` crate — structured logging with spans<br><span class="zh-inline">`tracing` crate：带 span 的结构化日志</span>

`tracing` extends `log` with **structured fields** and **spans** (timed scopes). This is especially useful for diagnostics code where you want to track context:<br><span class="zh-inline">`tracing` 在 `log` 的基础上继续加了 **结构化字段** 和 **span**，也就是带时序范围的上下文。这对诊断代码尤其有价值，因为它天生适合把上下文信息一路带下去。</span>

```rust
// Cargo.toml
// [dependencies]
// tracing = "0.1"
// tracing-subscriber = { version = "0.3", features = ["env-filter"] }

use tracing::{info, warn, error, instrument, info_span};

#[instrument(skip(data), fields(gpu_id = gpu_id, data_len = data.len()))]
fn run_gpu_test(gpu_id: u32, data: &[u8]) -> Result<(), String> {
    info!("Starting GPU test");

    let span = info_span!("ecc_check", gpu_id);
    let _guard = span.enter();  // All logs inside this scope include gpu_id

    if data.is_empty() {
        error!(gpu_id, "No test data provided");
        return Err("empty data".to_string());
    }

    // Structured fields — machine-parseable, not just string interpolation
    info!(
        gpu_id,
        temp_celsius = 72.5,
        ecc_errors = 0,
        "ECC check passed"
    );

    Ok(())
}

fn main() {
    // Initialize tracing subscriber
    tracing_subscriber::fmt()
        .with_env_filter("debug")  // Or use RUST_LOG env var
        .with_target(true)          // Show module path
        .with_thread_ids(true)      // Show thread IDs
        .init();

    let _ = run_gpu_test(0, &[1, 2, 3]);
}
```

Output with `tracing-subscriber`:<br><span class="zh-inline">用 `tracing-subscriber` 输出时，大概会长这样：</span>

```rust
2026-02-15T10:30:00.123Z DEBUG ThreadId(01) run_gpu_test{gpu_id=0 data_len=3}: my_crate: Starting GPU test
2026-02-15T10:30:00.124Z  INFO ThreadId(01) run_gpu_test{gpu_id=0 data_len=3}:ecc_check{gpu_id=0}: my_crate: ECC check passed gpu_id=0 temp_celsius=72.5 ecc_errors=0
```

### `#[instrument]` — automatic span creation<br><span class="zh-inline">`#[instrument]`：自动创建 span</span>

The `#[instrument]` attribute automatically creates a span with the function name and its arguments:<br><span class="zh-inline">`#[instrument]` 这个属性会自动创建一个 span，把函数名和参数都挂进去：</span>

```rust
use tracing::instrument;

#[instrument]
fn parse_sel_record(record_id: u16, sensor_type: u8, data: &[u8]) -> Result<(), String> {
    // Every log inside this function automatically includes:
    // record_id, sensor_type, and data (if Debug)
    tracing::debug!("Parsing SEL record");
    Ok(())
}

// skip: exclude large/sensitive args from the span
// fields: add computed fields
#[instrument(skip(raw_buffer), fields(buf_len = raw_buffer.len()))]
fn decode_ipmi_response(raw_buffer: &[u8]) -> Result<Vec<u8>, String> {
    tracing::trace!("Decoding {} bytes", raw_buffer.len());
    Ok(raw_buffer.to_vec())
}
```

### `log` vs `tracing` — which to use<br><span class="zh-inline">`log` 和 `tracing` 到底怎么选</span>

| Aspect | `log` | `tracing` |
|--------|-------|-----------|
| **Complexity**<br><span class="zh-inline">复杂度</span> | Simple — 5 macros<br><span class="zh-inline">简单，核心就是 5 个级别宏</span> | Richer — spans, fields, instruments<br><span class="zh-inline">更丰富，支持 span、字段和 instrument</span> |
| **Structured data**<br><span class="zh-inline">结构化数据</span> | String interpolation only<br><span class="zh-inline">基本只能靠字符串插值</span> | Key-value fields: `info!(gpu_id = 0, "msg")`<br><span class="zh-inline">原生支持键值字段</span> |
| **Timing / spans**<br><span class="zh-inline">时序 / span</span> | No<br><span class="zh-inline">没有</span> | Yes — `#[instrument]`, `span.enter()`<br><span class="zh-inline">有，`#[instrument]` 和 `span.enter()` 都能用</span> |
| **Async support**<br><span class="zh-inline">异步支持</span> | Basic<br><span class="zh-inline">基础级别</span> | First-class — spans propagate across `.await`<br><span class="zh-inline">一等支持，span 能跨 `.await` 传播</span> |
| **Compatibility**<br><span class="zh-inline">兼容性</span> | Universal facade<br><span class="zh-inline">通用 facade</span> | Compatible with `log` (has a `log` bridge)<br><span class="zh-inline">兼容 `log`，也有桥接层</span> |
| **When to use**<br><span class="zh-inline">适用场景</span> | Simple applications, libraries<br><span class="zh-inline">简单应用、轻量库</span> | Diagnostic tools, async code, observability<br><span class="zh-inline">诊断工具、异步代码、可观测性系统</span> |

> **Recommendation**: Use `tracing` for production diagnostic-style projects (diagnostic tools with structured output). Use `log` for simple libraries where you want minimal dependencies. `tracing` includes a compatibility layer so libraries using `log` macros still work with a `tracing` subscriber.<br><span class="zh-inline">**建议**：做生产级诊断工具、结构化输出系统，优先上 `tracing`。如果只是简单库代码，想尽量少依赖，就用 `log`。另外 `tracing` 自带兼容层，所以那些还在用 `log` 宏的库，照样能挂到 `tracing` subscriber 上工作。</span>

### Backend options<br><span class="zh-inline">可选后端</span>

| Backend Crate | Output | Use Case |
|--------------|--------|----------|
| `env_logger`<br><span class="zh-inline">`env_logger`</span> | stderr, colored<br><span class="zh-inline">stderr，支持彩色输出</span> | Development, simple CLI tools<br><span class="zh-inline">开发阶段、简单 CLI 工具</span> |
| `tracing-subscriber`<br><span class="zh-inline">`tracing-subscriber`</span> | stderr, formatted<br><span class="zh-inline">stderr，格式化输出</span> | Production with `tracing`<br><span class="zh-inline">基于 `tracing` 的生产输出</span> |
| `syslog`<br><span class="zh-inline">`syslog`</span> | System syslog<br><span class="zh-inline">系统 syslog</span> | Linux system services<br><span class="zh-inline">Linux 系统服务</span> |
| `tracing-journald`<br><span class="zh-inline">`tracing-journald`</span> | systemd journal<br><span class="zh-inline">systemd journal</span> | systemd-managed services<br><span class="zh-inline">由 systemd 托管的服务</span> |
| `tracing-appender`<br><span class="zh-inline">`tracing-appender`</span> | Rotating log files<br><span class="zh-inline">滚动日志文件</span> | Long-running daemons<br><span class="zh-inline">长期运行的守护进程</span> |
| `tracing-opentelemetry`<br><span class="zh-inline">`tracing-opentelemetry`</span> | OpenTelemetry collector<br><span class="zh-inline">OpenTelemetry 收集器</span> | Distributed tracing<br><span class="zh-inline">分布式追踪</span> |

----
