## Collapsing assignment pyramids with closures<br><span class="zh-inline">用闭包压平层层赋值金字塔</span>

> **What you'll learn:** How Rust's expression-oriented syntax and closures flatten deeply nested C++ `if/else` validation and fallback chains into cleaner, more linear code.<br><span class="zh-inline">**本章将学到什么：** Rust 这种以表达式为核心的语法，再配合闭包，如何把 C++ 里层层嵌套的 `if/else` 校验和回退逻辑压平成更干净、更线性的代码。</span>

- C++ often spreads one logical assignment across several nested blocks, especially when validation and fallback logic get mixed together. Rust's expression style plus closures make it possible to bind the final result in a single place.<br><span class="zh-inline">C++ 里只要掺进校验和回退，单次“给变量赋值”这件事就很容易被拆成好多层 block。Rust 的表达式风格和闭包则能把最终结果收束到一个地方完成绑定。</span>

### Pattern 1: Tuple assignment with `if` expression<br><span class="zh-inline">模式 1：用 `if` 表达式一次性绑定元组</span>

```cpp
// C++ — three variables set across a multi-block if/else chain
uint32_t fault_code;
const char* der_marker;
const char* action;
if (is_c44ad) {
    fault_code = 32709; der_marker = "CSI_WARN"; action = "No action";
} else if (error.is_hardware_error()) {
    fault_code = 67956; der_marker = "CSI_ERR"; action = "Replace GPU";
} else {
    fault_code = 32709; der_marker = "CSI_WARN"; action = "No action";
}
```

```rust
// Rust equivalent:accel_fieldiag.rs
// Single expression assigns all three at once:
let (fault_code, der_marker, recommended_action) = if is_c44ad {
    (32709u32, "CSI_WARN", "No action")
} else if error.is_hardware_error() {
    (67956u32, "CSI_ERR", "Replace GPU")
} else {
    (32709u32, "CSI_WARN", "No action")
};
```

这一招的关键不是“语法短”，而是它把三个变量的来源绑成一个原子决策。读代码时，不会再怀疑哪个分支漏赋值，或者哪两个变量是在不同条件里拼出来的。<br><span class="zh-inline">The real win here is not just shorter syntax. It makes all three values come from one atomic decision, which eliminates the “did one branch forget to set something?” style of doubt.</span>

### Pattern 2: IIFE for fallible chains<br><span class="zh-inline">模式 2：用立即调用闭包处理可能失败的链式逻辑</span>

```cpp
// C++ — pyramid of doom for JSON navigation
std::string get_part_number(const nlohmann::json& root) {
    if (root.contains("SystemInfo")) {
        auto& sys = root["SystemInfo"];
        if (sys.contains("BaseboardFru")) {
            auto& bb = sys["BaseboardFru"];
            if (bb.contains("ProductPartNumber")) {
                return bb["ProductPartNumber"].get<std::string>();
            }
        }
    }
    return "UNKNOWN";
}
```

```rust
// Rust equivalent:framework.rs
// Closure + ? operator collapses the pyramid into linear code:
let part_number = (|| -> Option<String> {
    let path = self.args.sysinfo.as_ref()?;
    let content = std::fs::read_to_string(path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    let ppn = json
        .get("SystemInfo")?
        .get("BaseboardFru")?
        .get("ProductPartNumber")?
        .as_str()?;
    Some(ppn.to_string())
})()
.unwrap_or_else(|| "UNKNOWN".to_string());
```

The closure creates a temporary `Option<String>` scope where `?` can bail out early at any step. The fallback stays in one place at the very end instead of being repeated in every branch.<br><span class="zh-inline">这个闭包相当于临时造了一个 `Option<String>` 作用域，链条上任何一步失败都能直接用 `?` 早退。兜底值只在最后写一次，不用在每个分支里重复抄一遍。</span>

### Pattern 3: Iterator chain replacing manual loop plus `push_back`<br><span class="zh-inline">模式 3：用迭代器链替代手写循环加 `push_back`</span>

```cpp
// C++ — manual loop with intermediate variables
std::vector<std::tuple<std::vector<std::string>, std::string, std::string>> gpu_info;
for (const auto& [key, info] : gpu_pcie_map) {
    std::vector<std::string> bdfs;
    // ... parse bdf_path into bdfs
    std::string serial = info.serial_number.value_or("UNKNOWN");
    std::string model = info.model_number.value_or(model_name);
    gpu_info.push_back({bdfs, serial, model});
}
```

```rust
// Rust equivalent:peripherals.rs
// Single chain: values() → map → collect
let gpu_info: Vec<(Vec<String>, String, String, String)> = self
    .gpu_pcie_map
    .values()
    .map(|info| {
        let bdfs: Vec<String> = info.bdf_path
            .split(')')
            .filter(|s| !s.is_empty())
            .map(|s| s.trim_start_matches('(').to_string())
            .collect();
        let serial = info.serial_number.clone()
            .unwrap_or_else(|| "UNKNOWN".to_string());
        let model = info.model_number.clone()
            .unwrap_or_else(|| model_name.to_string());
        let gpu_bdf = format!("{}:{}:{}.{}",
            info.bdf.segment, info.bdf.bus, info.bdf.device, info.bdf.function);
        (bdfs, serial, model, gpu_bdf)
    })
    .collect();
```

这种写法的意思特别明确：从一个集合映射出另一个集合。中间没有“先声明空容器，再一轮轮往里塞”的仪式感，逻辑主线更容易看。<br><span class="zh-inline">This style makes the intent obvious: transform one collection into another. There is no extra ceremony around mutable temporary vectors and repeated `push_back` calls.</span>

### Pattern 4: `.filter().collect()` replacing loop plus `continue`<br><span class="zh-inline">模式 4：用 `.filter().collect()` 替代循环里的 `continue`</span>

```cpp
// C++
std::vector<TestResult*> failures;
for (auto& t : test_results) {
    if (!t.is_pass()) {
        failures.push_back(&t);
    }
}
```

```rust
// Rust — from accel_diag/src/healthcheck.rs
pub fn failed_tests(&self) -> Vec<&TestResult> {
    self.test_results.iter().filter(|t| !t.is_pass()).collect()
}
```

### Summary: when to use each pattern<br><span class="zh-inline">总结：每种模式什么时候用</span>

| **C++ Pattern** | **Rust Replacement** | **Key Benefit**<br><span class="zh-inline">关键收益</span> |
|----------------|---------------------|-----------------|
| Multi-block variable assignment | `let (a, b) = if ... { } else { };` | Bind all outputs atomically<br><span class="zh-inline">多个结果一次性绑定</span> |
| Nested `if (contains)` pyramid | IIFE closure with `?` | Flat early-exit flow<br><span class="zh-inline">早退逻辑更平直</span> |
| `for` loop + `push_back` | `.iter().map(...).collect()` | No mutable accumulator noise<br><span class="zh-inline">去掉中间可变容器噪音</span> |
| `for` + `if (cond) continue` | `.iter().filter(...).collect()` | Declarative filtering<br><span class="zh-inline">筛选意图更直接</span> |
| `for` + `if + break` | `.iter().find_map(...)` | Search and transform in one pass<br><span class="zh-inline">查找与转换一步完成</span> |

----

# Capstone Exercise: Diagnostic Event Pipeline<br><span class="zh-inline">综合练习：诊断事件处理流水线</span>

🔴 **Challenge** — integrative exercise combining enums, traits, iterators, error handling, and generics<br><span class="zh-inline">🔴 **挑战练习**：把枚举、trait、迭代器、错误处理和泛型揉在一起做一个小型综合题。</span>

This exercise brings several major Rust ideas together in one place. The goal is to build a simplified diagnostic event pipeline that resembles patterns commonly seen in production Rust code.<br><span class="zh-inline">这个练习会把几项重要的 Rust 概念放进同一个题目里，目标是搭出一个简化版的诊断事件流水线。这种结构在生产级 Rust 项目里非常常见。</span>

**Requirements:**<br><span class="zh-inline">**要求如下：**</span>
1. Define an `enum Severity { Info, Warning, Critical }` with `Display`, and a `struct DiagEvent` containing `source: String`、`severity: Severity`、`message: String` and `fault_code: u32`<br><span class="zh-inline">1. 定义一个带 `Display` 的 `enum Severity { Info, Warning, Critical }`，再定义 `struct DiagEvent`，字段包括 `source: String`、`severity: Severity`、`message: String` 和 `fault_code: u32`。</span>
2. Define a `trait EventFilter` with a method `fn should_include(&self, event: &DiagEvent) -> bool`<br><span class="zh-inline">2. 定义 `trait EventFilter`，方法签名是 `fn should_include(&self, event: &DiagEvent) -> bool`。</span>
3. Implement two filters: `SeverityFilter` and `SourceFilter`<br><span class="zh-inline">3. 实现两个过滤器：`SeverityFilter` 和 `SourceFilter`。</span>
4. Write `fn process_events(events: &[DiagEvent], filters: &[&dyn EventFilter]) -> Vec<String>` and keep only events that pass **all** filters<br><span class="zh-inline">4. 写出 `fn process_events(events: &[DiagEvent], filters: &[&dyn EventFilter]) -> Vec<String>`，只保留同时通过 **所有** 过滤器的事件。</span>
5. Write `fn parse_event(line: &str) -> Result<DiagEvent, String>` to parse `"source:severity:fault_code:message"`<br><span class="zh-inline">5. 写 `fn parse_event(line: &str) -> Result<DiagEvent, String>`，把 `"source:severity:fault_code:message"` 这种字符串解析成事件。</span>

**Starter code:**<br><span class="zh-inline">**起始代码：**</span>

```rust
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
enum Severity {
    Info,
    Warning,
    Critical,
}

impl fmt::Display for Severity {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        todo!()
    }
}

#[derive(Debug, Clone)]
struct DiagEvent {
    source: String,
    severity: Severity,
    message: String,
    fault_code: u32,
}

trait EventFilter {
    fn should_include(&self, event: &DiagEvent) -> bool;
}

struct SeverityFilter {
    min_severity: Severity,
}
// TODO: impl EventFilter for SeverityFilter

struct SourceFilter {
    source: String,
}
// TODO: impl EventFilter for SourceFilter

fn process_events(events: &[DiagEvent], filters: &[&dyn EventFilter]) -> Vec<String> {
    // TODO: Filter events that pass ALL filters, format as
    // "[SEVERITY] source (FC:fault_code): message"
    todo!()
}

fn parse_event(line: &str) -> Result<DiagEvent, String> {
    // Parse "source:severity:fault_code:message"
    // Return Err for invalid input
    todo!()
}

fn main() {
    let raw_lines = vec![
        "accel_diag:Critical:67956:ECC uncorrectable error detected",
        "nic_diag:Warning:32709:Link speed degraded",
        "accel_diag:Info:10001:Self-test passed",
        "cpu_diag:Critical:55012:Thermal throttling active",
        "accel_diag:Warning:32710:PCIe link width reduced",
    ];

    // Parse all lines, collect successes and report errors
    let events: Vec<DiagEvent> = raw_lines.iter()
        .filter_map(|line| match parse_event(line) {
            Ok(e) => Some(e),
            Err(e) => { eprintln!("Parse error: {e}"); None }
        })
        .collect();

    // Apply filters: only Critical+Warning events from accel_diag
    let sev_filter = SeverityFilter { min_severity: Severity::Warning };
    let src_filter = SourceFilter { source: "accel_diag".to_string() };
    let filters: Vec<&dyn EventFilter> = vec![&sev_filter, &src_filter];

    let report = process_events(&events, &filters);
    for line in &report {
        println!("{line}");
    }
    println!("--- {} event(s) matched ---", report.len());
}
```

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
enum Severity {
    Info,
    Warning,
    Critical,
}

impl fmt::Display for Severity {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Severity::Info => write!(f, "INFO"),
            Severity::Warning => write!(f, "WARNING"),
            Severity::Critical => write!(f, "CRITICAL"),
        }
    }
}

impl Severity {
    fn from_str(s: &str) -> Result<Self, String> {
        match s {
            "Info" => Ok(Severity::Info),
            "Warning" => Ok(Severity::Warning),
            "Critical" => Ok(Severity::Critical),
            other => Err(format!("Unknown severity: {other}")),
        }
    }
}

#[derive(Debug, Clone)]
struct DiagEvent {
    source: String,
    severity: Severity,
    message: String,
    fault_code: u32,
}

trait EventFilter {
    fn should_include(&self, event: &DiagEvent) -> bool;
}

struct SeverityFilter {
    min_severity: Severity,
}

impl EventFilter for SeverityFilter {
    fn should_include(&self, event: &DiagEvent) -> bool {
        event.severity >= self.min_severity
    }
}

struct SourceFilter {
    source: String,
}

impl EventFilter for SourceFilter {
    fn should_include(&self, event: &DiagEvent) -> bool {
        event.source == self.source
    }
}

fn process_events(events: &[DiagEvent], filters: &[&dyn EventFilter]) -> Vec<String> {
    events.iter()
        .filter(|e| filters.iter().all(|f| f.should_include(e)))
        .map(|e| format!("[{}] {} (FC:{}): {}", e.severity, e.source, e.fault_code, e.message))
        .collect()
}

fn parse_event(line: &str) -> Result<DiagEvent, String> {
    let parts: Vec<&str> = line.splitn(4, ':').collect();
    if parts.len() != 4 {
        return Err(format!("Expected 4 colon-separated fields, got {}", parts.len()));
    }
    let fault_code = parts[2].parse::<u32>()
        .map_err(|e| format!("Invalid fault code '{}': {e}", parts[2]))?;
    Ok(DiagEvent {
        source: parts[0].to_string(),
        severity: Severity::from_str(parts[1])?,
        fault_code,
        message: parts[3].to_string(),
    })
}

fn main() {
    let raw_lines = vec![
        "accel_diag:Critical:67956:ECC uncorrectable error detected",
        "nic_diag:Warning:32709:Link speed degraded",
        "accel_diag:Info:10001:Self-test passed",
        "cpu_diag:Critical:55012:Thermal throttling active",
        "accel_diag:Warning:32710:PCIe link width reduced",
    ];

    let events: Vec<DiagEvent> = raw_lines.iter()
        .filter_map(|line| match parse_event(line) {
            Ok(e) => Some(e),
            Err(e) => { eprintln!("Parse error: {e}"); None }
        })
        .collect();

    let sev_filter = SeverityFilter { min_severity: Severity::Warning };
    let src_filter = SourceFilter { source: "accel_diag".to_string() };
    let filters: Vec<&dyn EventFilter> = vec![&sev_filter, &src_filter];

    let report = process_events(&events, &filters);
    for line in &report {
        println!("{line}");
    }
    println!("--- {} event(s) matched ---", report.len());
}
// Output:
// [CRITICAL] accel_diag (FC:67956): ECC uncorrectable error detected
// [WARNING] accel_diag (FC:32710): PCIe link width reduced
// --- 2 event(s) matched ---
```

</details>

----
