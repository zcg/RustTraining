## Avoiding unchecked indexing<br><span class="zh-inline">避免不受检查的下标访问</span>

> **What you'll learn:** Why `vec[i]` is dangerous in Rust because it panics on out-of-bounds, and what the safer alternatives look like: `.get()`、iterators、`and_then()` and the `entry()`-style mindset. The goal is to replace C++'s silent undefined behavior with explicit control flow.<br><span class="zh-inline">**本章将学到什么：** 为什么 `vec[i]` 在 Rust 里仍然危险，因为越界时会 panic；以及更安全的替代方式有哪些：`.get()`、迭代器、`and_then()`，还有 `entry()` 这类显式处理思路。核心目标是把 C++ 里那种悄悄掉进未定义行为的写法，替换成可见、可控的分支流程。</span>

- In C++, `vec[i]` may become undefined behavior and `map[key]` may silently insert a missing key. Rust's `[]` does not go that far, but it still panics if the index is invalid.<br><span class="zh-inline">C++ 里，`vec[i]` 越界会直接掉进未定义行为，而 `map[key]` 还会在键不存在时偷偷插入默认值。Rust 的 `[]` 没这么离谱，但索引无效时照样会 panic。</span>
- **Rule of thumb:** use `.get()` instead of `[]` unless the code can clearly prove the index is valid.<br><span class="zh-inline">**经验法则：** 除非代码本身已经清楚证明下标一定合法，否则优先用 `.get()`，别硬写 `[]`。</span>

### C++ → Rust comparison<br><span class="zh-inline">C++ 与 Rust 的对照</span>

```cpp
// C++ — silent UB or insertion
std::vector<int> v = {1, 2, 3};
int x = v[10];        // UB! No bounds check with operator[]

std::map<std::string, int> m;
int y = m["missing"]; // Silently inserts key with value 0!
```

```rust
// Rust — safe alternatives
let v = vec![1, 2, 3];

// Bad: panics if index out of bounds
// let x = v[10];

// Good: returns Option<&i32>
let x = v.get(10);              // None — no panic
let x = v.get(1).copied().unwrap_or(0);  // 2, or 0 if missing
```

### Real example: safe byte parsing from production Rust code<br><span class="zh-inline">真实例子：生产代码里的安全字节解析</span>

```rust
// Example: diagnostics.rs
// Parsing a binary SEL record — buffer might be shorter than expected
let sensor_num = bytes.get(7).copied().unwrap_or(0);
let ppin = cpu_ppin.get(i).map(|s| s.as_str()).unwrap_or("");
```

### Real example: chained safe lookups with `.and_then()`<br><span class="zh-inline">真实例子：用 `.and_then()` 串联安全查找</span>

```rust
// Example: profile.rs — double lookup: HashMap → Vec
pub fn get_processor(&self, location: &str) -> Option<&Processor> {
    self.processor_by_location
        .get(location)                              // HashMap → Option<&usize>
        .and_then(|&idx| self.processors.get(idx))   // Vec → Option<&Processor>
}
// Both lookups return Option — no panics, no UB
```

### Real example: safe JSON navigation<br><span class="zh-inline">真实例子：安全地层层取 JSON 字段</span>

```rust
// Example: framework.rs — every JSON key returns Option
let manufacturer = product_fru
    .get("Manufacturer")            // Option<&Value>
    .and_then(|v| v.as_str())       // Option<&str>
    .unwrap_or(UNKNOWN_VALUE)       // &str (safe fallback)
    .to_string();
```

Compared with the familiar C++ style `json["SystemInfo"]["ProductFru"]["Manufacturer"]`, this version makes every possible failure visible in the type. Missing data stops the chain cleanly instead of exploding later in an unexpected place.<br><span class="zh-inline">和 C++ 里常见的 `json["SystemInfo"]["ProductFru"]["Manufacturer"]` 相比，这种写法把每一步可能失败的地方都放进了类型里。字段缺失时，链条会安静地中断，而不是在某个更奇怪的地方爆炸。</span>

### When `[]` is acceptable<br><span class="zh-inline">什么时候 `[]` 仍然可以接受</span>

- **After a bounds check**: `if i < v.len() { v[i] }`<br><span class="zh-inline">**已经先做过边界检查时**：比如 `if i < v.len() { v[i] }`。</span>
- **In tests**: when panicking is the desired behavior<br><span class="zh-inline">**测试代码里**：如果故意要验证 panic 行为，也可以直接用。</span>
- **With constants and invariants**: `let first = v[0];` right after `assert!(!v.is_empty());`<br><span class="zh-inline">**有明确不变量时**：比如刚写完 `assert!(!v.is_empty())`，随后访问 `v[0]`。</span>

----

## Safe value extraction with `unwrap_or`<br><span class="zh-inline">用 `unwrap_or` 安全提取值</span>

- `unwrap()` panics on `None` or `Err`. In production code, safer alternatives are usually better.<br><span class="zh-inline">`unwrap()` 在遇到 `None` 或 `Err` 时会 panic。生产代码里大多数时候都应该优先考虑更稳妥的替代方式。</span>

### The unwrap family<br><span class="zh-inline">`unwrap` 家族速查</span>

| **Method** | **Behavior on None/Err** | **Use When**<br><span class="zh-inline">适用场景</span> |
|-----------|------------------------|-------------|
| `.unwrap()` | Panics<br><span class="zh-inline">直接 panic</span> | Tests or truly infallible paths<br><span class="zh-inline">测试，或者逻辑上绝不可能失败的地方</span> |
| `.expect("msg")` | Panics with message<br><span class="zh-inline">带消息 panic</span> | Panic is acceptable and needs explanation<br><span class="zh-inline">允许 panic，但想把原因写清楚</span> |
| `.unwrap_or(default)` | Returns `default`<br><span class="zh-inline">返回默认值</span> | Cheap fallback available<br><span class="zh-inline">有便宜的默认值可用</span> |
| `.unwrap_or_else(|| expr)` | Computes fallback lazily<br><span class="zh-inline">按需计算默认值</span> | Fallback is expensive<br><span class="zh-inline">默认值构造较重时</span> |
| `.unwrap_or_default()` | Returns `Default::default()`<br><span class="zh-inline">返回默认类型值</span> | Type implements `Default`<br><span class="zh-inline">类型实现了 `Default`</span> |

### Real example: parsing with safe defaults<br><span class="zh-inline">真实例子：带安全默认值的解析</span>

```rust
// Example: peripherals.rs
// Regex capture groups might not match — provide safe fallbacks
let bus_hex = caps.get(1).map(|m| m.as_str()).unwrap_or("00");
let fw_status = caps.get(5).map(|m| m.as_str()).unwrap_or("0x0");
let bus = u8::from_str_radix(bus_hex, 16).unwrap_or(0);
```

### Real example: `unwrap_or_else` with a fallback struct<br><span class="zh-inline">真实例子：`unwrap_or_else` 配合后备结构体</span>

```rust
// Example: framework.rs
// Full function wraps logic in an Option-returning closure;
// if anything fails, return a default struct:
(|| -> Option<BaseboardFru> {
    let content = std::fs::read_to_string(path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    // ... extract fields with .get()? chains
    Some(baseboard_fru)
})()
.unwrap_or_else(|| BaseboardFru {
    manufacturer: String::new(),
    model: String::new(),
    product_part_number: String::new(),
    serial_number: String::new(),
    asset_tag: String::new(),
})
```

### Real example: `unwrap_or_default` on config deserialization<br><span class="zh-inline">真实例子：配置反序列化失败时用 `unwrap_or_default`</span>

```rust
// Example: framework.rs
// If JSON config parsing fails, fall back to Default — no crash
Ok(json) => serde_json::from_str(&json).unwrap_or_default(),
```

The C++ equivalent usually turns into a `try/catch` around JSON parsing plus a manually constructed fallback object. Rust lets that behavior remain visible, local, and predictable.<br><span class="zh-inline">对应到 C++，通常就会变成一层 `try/catch` 再手动构造一个兜底对象。Rust 的版本则把这个行为控制得更局部、更显式，也更好预期。</span>

----

## Functional transforms: `map`、`map_err`、`find_map`<br><span class="zh-inline">函数式变换：`map`、`map_err`、`find_map`</span>

- These methods let `Option` and `Result` flow through transformations without being manually unpacked, which often replaces nested `if/else` chains with clearer pipelines.<br><span class="zh-inline">这些方法能让 `Option` 和 `Result` 在不手动拆开的前提下持续变换，很多原本会写成层层 `if/else` 的东西，都能改造成更直的流水线。</span>

### Quick reference<br><span class="zh-inline">速查表</span>

| **Method** | **On** | **Does**<br><span class="zh-inline">作用</span> | **C++ Equivalent**<br><span class="zh-inline">C++ 里的近似写法</span> |
|-----------|-------|---------|-------------------|
| `.map(|v| ...)` | `Option` / `Result` | Transform the `Some` or `Ok` value<br><span class="zh-inline">变换成功值</span> | `if (opt) { ... }`-style transform |
| `.map_err(|e| ...)` | `Result` | Transform the error value<br><span class="zh-inline">变换错误值</span> | Add context in catch/rethrow logic |
| `.and_then(|v| ...)` | `Option` / `Result` | Chain another fallible step<br><span class="zh-inline">串联下一步可能失败的操作</span> | Nested `if` / nested return checks |
| `.find_map(|v| ...)` | Iterator | Search and transform in one pass<br><span class="zh-inline">一边找一边变换</span> | Loop with `if` + `break` |
| `.filter(|v| ...)` | `Option` / Iterator | Keep only matching values<br><span class="zh-inline">只保留满足条件的值</span> | Predicate gate |
| `.ok()?` | `Result` | Convert `Result` to `Option` and propagate `None`<br><span class="zh-inline">把 `Result` 转成 `Option` 并在失败时早退</span> | Manual “if error then return nullopt” |

### Real example: `.and_then()` chain for JSON field extraction<br><span class="zh-inline">真实例子：用 `.and_then()` 链式提取 JSON 字段</span>

```rust
// Example: framework.rs — finding serial number with fallbacks
let sys_info = json.get("SystemInfo")?;

// Try BaseboardFru.BoardSerialNumber first
if let Some(serial) = sys_info
    .get("BaseboardFru")
    .and_then(|b| b.get("BoardSerialNumber"))
    .and_then(|v| v.as_str())
    .filter(valid_serial)     // Only accept non-empty, valid serials
{
    return Some(serial.to_string());
}

// Fallback to BoardFru.SerialNumber
sys_info
    .get("BoardFru")
    .and_then(|b| b.get("SerialNumber"))
    .and_then(|v| v.as_str())
    .filter(valid_serial)
    .map(|s| s.to_string())   // Convert &str → String only if Some
```

### Real example: `find_map` — search plus transform in one pass<br><span class="zh-inline">真实例子：`find_map` 把查找和变换合并成一趟</span>

```rust
// Example: context.rs — find SDR record matching sensor + owner
pub fn find_for_event(&self, sensor_number: u8, owner_id: u8) -> Option<&SdrRecord> {
    self.by_sensor.get(&sensor_number).and_then(|indices| {
        indices.iter().find_map(|&i| {
            let record = &self.records[i];
            if record.sensor_owner_id() == Some(owner_id) {
                Some(record)
            } else {
                None
            }
        })
    })
}
```

`find_map` 很适合替换那种“for 循环里先判断，再 break，再把结果包一层”的写法。把“找到谁”和“找到后要怎么变”放进同一步里，代码会短很多。<br><span class="zh-inline">`find_map` is ideal for the old loop shape where you test each element, stop at the first match, and then transform it. Rust fuses that into one clear operation.</span>

### Real example: `map_err` for error context<br><span class="zh-inline">真实例子：用 `map_err` 给错误补上下文</span>

```rust
// Example: main.rs — add context to errors before propagating
let json_str = serde_json::to_string_pretty(&config)
    .map_err(|e| format!("Failed to serialize config: {}", e))?;
```

----

## JSON handling: `nlohmann::json` → `serde`<br><span class="zh-inline">JSON 处理：从 `nlohmann::json` 到 `serde`</span>

- C++ teams often use `nlohmann::json` for runtime field access. Rust usually uses `serde` plus `serde_json`, which moves more schema knowledge into the type system itself.<br><span class="zh-inline">C++ 团队处理 JSON 时，很常见的是 `nlohmann::json` 这种运行时取字段模式。Rust 更常见的是 `serde` 加 `serde_json`，把更多“这个 JSON 应该长什么样”的知识前移进类型系统。</span>

### C++ (`nlohmann`) vs Rust (`serde`) comparison<br><span class="zh-inline">C++ 的 `nlohmann` 与 Rust 的 `serde` 对照</span>

```cpp
// C++ with nlohmann::json — runtime field access
#include <nlohmann/json.hpp>
using json = nlohmann::json;

struct Fan {
    std::string logical_id;
    std::vector<std::string> sensor_ids;
};

Fan parse_fan(const json& j) {
    Fan f;
    f.logical_id = j.at("LogicalID").get<std::string>();    // throws if missing
    if (j.contains("SDRSensorIdHexes")) {                   // manual default handling
        f.sensor_ids = j["SDRSensorIdHexes"].get<std::vector<std::string>>();
    }
    return f;
}
```

```rust
// Rust with serde — compile-time schema, automatic field mapping
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Fan {
    pub logical_id: String,
    #[serde(rename = "SDRSensorIdHexes", default)]  // JSON key → Rust field
    pub sensor_ids: Vec<String>,                     // Missing → empty Vec
    #[serde(default)]
    pub sensor_names: Vec<String>,                   // Missing → empty Vec
}

// One line replaces the entire parse function:
let fan: Fan = serde_json::from_str(json_str)?;
```

### Key serde attributes<br><span class="zh-inline">常用 serde 属性</span>

| **Attribute** | **Purpose**<br><span class="zh-inline">作用</span> | **C++ Equivalent**<br><span class="zh-inline">C++ 里的近似写法</span> |
|--------------|------------|--------------------|
| `#[serde(default)]` | Fill missing fields with `Default::default()`<br><span class="zh-inline">字段缺失时用默认值补上</span> | `if (j.contains(key)) { ... } else { default; }` |
| `#[serde(rename = "Key")]` | Map JSON key names to Rust field names<br><span class="zh-inline">把 JSON 键名映射到 Rust 字段名</span> | Manual `j.at("Key")` access |
| `#[serde(flatten)]` | Absorb extra keys into a map<br><span class="zh-inline">把额外字段摊进映射里</span> | Manual `for (auto& [k, v] : j.items())` |
| `#[serde(skip)]` | Skip this field during ser/de<br><span class="zh-inline">序列化和反序列化时忽略该字段</span> | Manual omission |
| `#[serde(tag = "type")]` | Tagged enum dispatch<br><span class="zh-inline">按类型字段分发枚举变体</span> | `if (j["type"] == "...")` chain |

### Real example: full config struct<br><span class="zh-inline">真实例子：完整配置结构体</span>

```rust
// Example: diag.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagConfig {
    pub sku: SkuConfig,
    #[serde(default)]
    pub level: DiagLevel,            // Missing → DiagLevel::default()
    #[serde(default)]
    pub modules: ModuleConfig,       // Missing → ModuleConfig::default()
    #[serde(default)]
    pub output_dir: String,          // Missing → ""
    #[serde(default, flatten)]
    pub options: HashMap<String, serde_json::Value>,  // Absorbs unknown keys
}

// Loading is 3 lines (vs ~20+ in C++ with nlohmann):
let content = std::fs::read_to_string(path)?;
let config: DiagConfig = serde_json::from_str(&content)?;
Ok(config)
```

### Enum deserialization with `#[serde(tag = "type")]`<br><span class="zh-inline">带 `#[serde(tag = "type")]` 的枚举反序列化</span>

```rust
// Example: components.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]                   // JSON: {"type": "Gpu", "product": ...}
pub enum PcieDeviceKind {
    Gpu { product: GpuProduct, manufacturer: GpuManufacturer },
    Nic { product: NicProduct, manufacturer: NicManufacturer },
    NvmeDrive { drive_type: StorageDriveType, capacity_gb: u32 },
    // ... 9 more variants
}
// serde automatically dispatches on the "type" field — no manual if/else chain
```

# Exercise: JSON deserialization with serde<br><span class="zh-inline">练习：用 serde 做 JSON 反序列化</span>

- Define a `ServerConfig` struct that can be deserialized from the JSON below<br><span class="zh-inline">定义一个 `ServerConfig` 结构体，让它能从下面这段 JSON 反序列化出来。</span>

```json
{
    "hostname": "diag-node-01",
    "port": 8080,
    "debug": true,
    "modules": ["accel_diag", "nic_diag", "cpu_diag"]
}
```

- Use `#[derive(Deserialize)]` and `serde_json::from_str()`<br><span class="zh-inline">使用 `#[derive(Deserialize)]` 和 `serde_json::from_str()`。</span>
- Add `#[serde(default)]` to `debug` so it becomes `false` when missing<br><span class="zh-inline">给 `debug` 加上 `#[serde(default)]`，这样缺失时默认就是 `false`。</span>
- **Bonus**: add `DiagLevel { Quick, Full, Extended }` with a default of `Quick`<br><span class="zh-inline">**加分项**：再补一个 `DiagLevel { Quick, Full, Extended }` 字段，默认值设成 `Quick`。</span>

**Starter code**<br><span class="zh-inline">**起始代码**</span>

```rust
use serde::Deserialize;

// TODO: Define DiagLevel enum with Default impl

// TODO: Define ServerConfig struct with serde attributes

fn main() {
    let json_input = r#"{
        "hostname": "diag-node-01",
        "port": 8080,
        "debug": true,
        "modules": ["accel_diag", "nic_diag", "cpu_diag"]
    }"#;

    // TODO: Deserialize and print the config
    // TODO: Try parsing JSON with "debug" field missing — verify it defaults to false
}
```

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize, Default)]
enum DiagLevel {
    #[default]
    Quick,
    Full,
    Extended,
}

#[derive(Debug, Deserialize)]
struct ServerConfig {
    hostname: String,
    port: u16,
    #[serde(default)]       // defaults to false if missing
    debug: bool,
    modules: Vec<String>,
    #[serde(default)]       // defaults to DiagLevel::Quick if missing
    level: DiagLevel,
}

fn main() {
    let json_input = r#"{
        "hostname": "diag-node-01",
        "port": 8080,
        "debug": true,
        "modules": ["accel_diag", "nic_diag", "cpu_diag"]
    }"#;

    let config: ServerConfig = serde_json::from_str(json_input)
        .expect("Failed to parse JSON");
    println!("{config:#?}");

    // Test with missing optional fields
    let minimal = r#"{
        "hostname": "node-02",
        "port": 9090,
        "modules": []
    }"#;
    let config2: ServerConfig = serde_json::from_str(minimal)
        .expect("Failed to parse minimal JSON");
    println!("debug (default): {}", config2.debug);    // false
    println!("level (default): {:?}", config2.level);  // Quick
}
// Output:
// ServerConfig {
//     hostname: "diag-node-01",
//     port: 8080,
//     debug: true,
//     modules: ["accel_diag", "nic_diag", "cpu_diag"],
//     level: Quick,
// }
// debug (default): false
// level (default): Quick
```

</details>

----
