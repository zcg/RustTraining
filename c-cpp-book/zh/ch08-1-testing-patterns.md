## Testing Patterns for C++ Programmers<br><span class="zh-inline">面向 C++ 程序员的测试模式</span>

> **What you'll learn:** Rust's built-in test framework, including `#[test]`, `#[should_panic]`, `Result`-returning tests, builder patterns for test data, trait-based mocking, property testing with `proptest`, snapshot testing with `insta`, and integration test organization. This is the zero-config testing experience that replaces Google Test plus CMake glue.<br><span class="zh-inline">**本章将学到什么：** Rust 内建测试框架的核心用法，包括 `#[test]`、`#[should_panic]`、返回 `Result` 的测试、测试数据的 builder 模式、基于 trait 的 mock、`proptest` 属性测试、`insta` 快照测试，以及集成测试的目录组织方式。整体体验就是把 Google Test 加一堆 CMake 胶水活，换成零配置起步。</span>

C++ testing usually relies on external frameworks such as Google Test, Catch2, or Boost.Test, plus a pile of build-system integration. Rust takes a much simpler route: the test framework is built into the language and toolchain itself.<br><span class="zh-inline">C++ 测试通常离不开外部框架，比如 Google Test、Catch2、Boost.Test，再配上一坨构建系统接线。Rust 走的是另一条路：测试框架直接内建在语言和工具链里。</span>

### Test attributes beyond `#[test]`<br><span class="zh-inline">除了 `#[test]` 之外的常用测试属性</span>

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_pass() {
        assert_eq!(2 + 2, 4);
    }

    // Expect a panic — equivalent to GTest's EXPECT_DEATH
    #[test]
    #[should_panic]
    fn out_of_bounds_panics() {
        let v = vec![1, 2, 3];
        let _ = v[10]; // Panics — test passes
    }

    // Expect a panic with a specific message substring
    #[test]
    #[should_panic(expected = "index out of bounds")]
    fn specific_panic_message() {
        let v = vec![1, 2, 3];
        let _ = v[10];
    }

    // Tests that return Result<(), E> — use ? instead of unwrap()
    #[test]
    fn test_with_result() -> Result<(), String> {
        let value: u32 = "42".parse().map_err(|e| format!("{e}"))?;
        assert_eq!(value, 42);
        Ok(())
    }

    // Ignore slow tests by default — run with `cargo test -- --ignored`
    #[test]
    #[ignore]
    fn slow_integration_test() {
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}
```

```bash
cargo test                          # Run all non-ignored tests
cargo test -- --ignored             # Run only ignored tests
cargo test -- --include-ignored     # Run ALL tests including ignored
cargo test test_name                # Run tests matching a name pattern
cargo test -- --nocapture           # Show println! output during tests
cargo test -- --test-threads=1      # Run tests serially (for shared state)
```

这套属性系统的好处在于，测试行为直接写在函数定义旁边，读代码时一眼就能看到预期。C++ 里那种测试框架宏、运行器参数、构建脚本三头分裂的局面，在 Rust 这里会轻很多。<br><span class="zh-inline">The biggest advantage of these attributes is that test behavior lives right beside the test function itself. Instead of spreading intent across framework macros, runner flags, and build scripts, Rust keeps it close to the code.</span>

### Test helpers: builder pattern for test data<br><span class="zh-inline">测试辅助：用 builder 模式构造测试数据</span>

In C++ you'd often reach for Google Test fixtures such as `class MyTest : public ::testing::Test`. In Rust, builder functions and `Default` usually cover the same use case with less ceremony.<br><span class="zh-inline">在 C++ 里，这类场景通常会写成 Google Test fixture，比如 `class MyTest : public ::testing::Test`。在 Rust 里，builder 函数和 `Default` 往往就够用了，样板更少。</span>

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // Builder function — creates test data with sensible defaults
    fn make_gpu_event(severity: Severity, fault_code: u32) -> DiagEvent {
        DiagEvent {
            source: "accel_diag".to_string(),
            severity,
            message: format!("Test event FC:{fault_code}"),
            fault_code,
        }
    }

    // Reusable test fixture — a set of pre-built events
    fn sample_events() -> Vec<DiagEvent> {
        vec![
            make_gpu_event(Severity::Critical, 67956),
            make_gpu_event(Severity::Warning, 32709),
            make_gpu_event(Severity::Info, 10001),
        ]
    }

    #[test]
    fn filter_critical_events() {
        let events = sample_events();
        let critical: Vec<_> = events.iter()
            .filter(|e| e.severity == Severity::Critical)
            .collect();
        assert_eq!(critical.len(), 1);
        assert_eq!(critical[0].fault_code, 67956);
    }
}
```

### Mocking with traits<br><span class="zh-inline">用 trait 做 mock</span>

In C++, mocking often means Google Mock, inheritance tricks, or hand-written virtual overrides. In Rust, the common pattern is simpler: abstract the dependency behind a trait, then swap in a test implementation.<br><span class="zh-inline">在 C++ 里，mock 往往意味着 Google Mock、继承技巧，或者手写虚函数覆盖。Rust 更常见的写法反而更直白：先把依赖抽象成 trait，再在测试里换成一个测试实现。</span>

```rust
// Production trait
trait SensorReader {
    fn read_temperature(&self, sensor_id: u32) -> Result<f64, String>;
}

// Production implementation
struct HwSensorReader;
impl SensorReader for HwSensorReader {
    fn read_temperature(&self, sensor_id: u32) -> Result<f64, String> {
        // Real hardware call...
        Ok(72.5)
    }
}

// Test mock — returns predictable values
#[cfg(test)]
struct MockSensorReader {
    temperatures: std::collections::HashMap<u32, f64>,
}

#[cfg(test)]
impl SensorReader for MockSensorReader {
    fn read_temperature(&self, sensor_id: u32) -> Result<f64, String> {
        self.temperatures.get(&sensor_id)
            .copied()
            .ok_or_else(|| format!("Unknown sensor {sensor_id}"))
    }
}

// Function under test — generic over the reader
fn check_overtemp(reader: &impl SensorReader, ids: &[u32], threshold: f64) -> Vec<u32> {
    ids.iter()
        .filter(|&&id| reader.read_temperature(id).unwrap_or(0.0) > threshold)
        .copied()
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detect_overtemp_sensors() {
        let mut mock = MockSensorReader { temperatures: Default::default() };
        mock.temperatures.insert(0, 72.5);
        mock.temperatures.insert(1, 91.0);  // Over threshold
        mock.temperatures.insert(2, 65.0);

        let hot = check_overtemp(&mock, &[0, 1, 2], 80.0);
        assert_eq!(hot, vec![1]);
    }
}
```

这就是 Rust 在测试里很典型的一种风格：不靠“神奇 mock 框架”到处 patch，而是让抽象边界本身更清楚。这样测试舒服，生产代码结构也顺手更健康。<br><span class="zh-inline">This is a very Rust-flavored testing style: instead of relying on magical patching frameworks, the code makes dependency boundaries explicit. That tends to improve both testability and overall design at the same time.</span>

### Temporary files and directories in tests<br><span class="zh-inline">测试中的临时文件与目录</span>

C++ tests often end up with platform-specific temp-directory hacks. Rust has the `tempfile` crate, which makes this boring in a good way.<br><span class="zh-inline">C++ 测试里一涉及临时目录，经常就开始平台分支乱飞。Rust 这边有 `tempfile` crate，基本能把这件事处理得非常省心。</span>

```rust
// Cargo.toml: [dev-dependencies]
// tempfile = "3"

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;
    use std::io::Write;

    #[test]
    fn parse_config_from_file() -> Result<(), Box<dyn std::error::Error>> {
        // Create a temp file that's auto-deleted when dropped
        let mut file = NamedTempFile::new()?;
        writeln!(file, r#"{{"sku": "ServerNode", "level": "Quick"}}"#)?;

        let config = load_config(file.path().to_str().unwrap())?;
        assert_eq!(config.sku, "ServerNode");
        Ok(())
        // file is deleted here — no cleanup code needed
    }
}
```

### Property-based testing with `proptest`<br><span class="zh-inline">用 `proptest` 做属性测试</span>

Instead of writing a few hand-picked cases, property testing describes rules that should hold for a wide range of inputs. The framework then generates inputs automatically and shrinks failures to minimal repro cases.<br><span class="zh-inline">属性测试的思路不是手写几个样例，而是先描述“什么性质必须始终成立”，然后让框架自动生成大量输入，并在失败时尽量收缩到最小复现用例。</span>

```rust
// Cargo.toml: [dev-dependencies]
// proptest = "1"

#[cfg(test)]
mod tests {
    use proptest::prelude::*;

    fn parse_and_format(n: u32) -> String {
        format!("{n}")
    }

    proptest! {
        #[test]
        fn roundtrip_u32(n: u32) {
            let formatted = parse_and_format(n);
            let parsed: u32 = formatted.parse().unwrap();
            prop_assert_eq!(n, parsed);
        }

        #[test]
        fn string_contains_no_null(s in "[a-zA-Z0-9 ]{0,100}") {
            prop_assert!(!s.contains('\0'));
        }
    }
}
```

### Snapshot testing with `insta`<br><span class="zh-inline">用 `insta` 做快照测试</span>

For complex JSON, formatted text, or structured output, snapshot testing can save a lot of repetitive assertion code. `insta` manages the baseline files and helps review changes.<br><span class="zh-inline">如果测试产物是复杂 JSON、格式化文本或者层次很多的结构化输出，快照测试能省掉一大堆重复断言。`insta` 会替着管理基线文件，并协助审阅变更。</span>

```rust
// Cargo.toml: [dev-dependencies]
// insta = { version = "1", features = ["json"] }

#[cfg(test)]
mod tests {
    use insta::assert_json_snapshot;

    #[test]
    fn der_entry_format() {
        let entry = DerEntry {
            fault_code: 67956,
            component: "GPU".to_string(),
            message: "ECC error detected".to_string(),
        };
        // First run: creates a snapshot file in tests/snapshots/
        // Subsequent runs: compares against the saved snapshot
        assert_json_snapshot!(entry);
    }
}
```

```bash
cargo insta test              # Run tests and review new/changed snapshots
cargo insta review            # Interactive review of snapshot changes
```

### C++ vs Rust testing comparison<br><span class="zh-inline">C++ 与 Rust 测试对照</span>

| **C++ (Google Test)** | **Rust** | **Notes**<br><span class="zh-inline">说明</span> |
|----------------------|---------|----------|
| `TEST(Suite, Name) { }` | `#[test] fn name() { }` | No suite or fixture class hierarchy required<br><span class="zh-inline">不需要测试套件类层级</span> |
| `ASSERT_EQ(a, b)` | `assert_eq!(a, b)` | Built-in macro<br><span class="zh-inline">内建宏</span> |
| `ASSERT_NEAR(a, b, eps)` | `assert!((a - b).abs() < eps)` | Or use `approx` crate<br><span class="zh-inline">也可以用 `approx` crate</span> |
| `EXPECT_THROW(expr, type)` | `#[should_panic(expected = "...")]` | Or use `catch_unwind` for finer control<br><span class="zh-inline">更细控制可以用 `catch_unwind`</span> |
| `EXPECT_DEATH(expr, "msg")` | `#[should_panic(expected = "msg")]` | Similar panic expectation<br><span class="zh-inline">对应 panic 预期</span> |
| `class Fixture : public ::testing::Test` | Builder functions + `Default` | No inheritance needed<br><span class="zh-inline">通常不用继承</span> |
| Google Mock `MOCK_METHOD` | Trait + test impl | More explicit, less magic<br><span class="zh-inline">更显式，少很多魔法</span> |
| `INSTANTIATE_TEST_SUITE_P` | `proptest!` or macro-generated tests | Parameterized strategies differ<br><span class="zh-inline">参数化策略不同</span> |
| `SetUp()` / `TearDown()` | RAII via `Drop` | Cleanup is automatic<br><span class="zh-inline">清理自动完成</span> |
| Separate test binary + CMake | `cargo test` | Zero-config default<br><span class="zh-inline">默认零配置</span> |
| `ctest --output-on-failure` | `cargo test -- --nocapture` | Show test output<br><span class="zh-inline">显示测试输出</span> |

----

### Integration tests: the `tests/` directory<br><span class="zh-inline">集成测试：`tests/` 目录</span>

Unit tests live inside `#[cfg(test)]` modules next to the code they exercise. Integration tests live under a top-level `tests/` directory and interact only with the crate's public API, just like an external consumer would.<br><span class="zh-inline">单元测试一般直接写在被测代码旁边的 `#[cfg(test)]` 模块里。集成测试则放在 crate 根目录下的 `tests/` 目录中，只能通过公开 API 来访问代码，就像真正的外部使用者一样。</span>

```text
my_crate/
├── src/
│   └── lib.rs          # Your library code
├── tests/
│   ├── smoke.rs        # Each .rs file is a separate test binary
│   ├── regression.rs
│   └── common/
│       └── mod.rs      # Shared test helpers (NOT a test itself)
└── Cargo.toml
```

```rust
// tests/smoke.rs — tests your crate as an external user would
use my_crate::DiagEngine;  // Only public API is accessible

#[test]
fn engine_starts_successfully() {
    let engine = DiagEngine::new("test_config.json");
    assert!(engine.is_ok());
}

#[test]
fn engine_rejects_invalid_config() {
    let engine = DiagEngine::new("nonexistent.json");
    assert!(engine.is_err());
}
```

```rust
// tests/common/mod.rs — shared helpers, NOT compiled as a test binary
pub fn setup_test_environment() -> tempfile::TempDir {
    let dir = tempfile::tempdir().unwrap();
    std::fs::write(dir.path().join("config.json"), r#"{"log_level": "debug"}"#).unwrap();
    dir
}
```

```rust
// tests/regression.rs — can use shared helpers
mod common;

#[test]
fn regression_issue_42() {
    let env = common::setup_test_environment();
    let engine = my_crate::DiagEngine::new(
        env.path().join("config.json").to_str().unwrap()
    );
    assert!(engine.is_ok());
}
```

**Running integration tests:**<br><span class="zh-inline">**运行集成测试：**</span>

```bash
cargo test                          # Runs unit AND integration tests
cargo test --test smoke             # Run only tests/smoke.rs
cargo test --test regression        # Run only tests/regression.rs
cargo test --lib                    # Run ONLY unit tests (skip integration)
```

> **Key difference from unit tests**: Integration tests cannot touch private functions or `pub(crate)` items. That restriction is useful, because it forces the public API to prove that it is actually testable and complete.<br><span class="zh-inline">**和单元测试最大的区别：** 集成测试碰不到私有函数，也碰不到 `pub(crate)` 项。这种限制其实很有价值，因为它会逼着公共 API 自己站得住，测试用例也更接近真实使用方式。</span>
