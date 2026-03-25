# 14. Testing and Benchmarking Patterns 🟢<br><span class="zh-inline"># 14. 测试与基准模式 🟢</span>

> **What you'll learn:**<br><span class="zh-inline">**本章将学到什么：**</span>
> - Rust's three test tiers: unit, integration, and doc tests<br><span class="zh-inline">Rust 内建的三层测试体系：单元测试、集成测试和文档测试</span>
> - Property-based testing with proptest for discovering edge cases<br><span class="zh-inline">如何用 `proptest` 做性质测试，专门挖边界情况</span>
> - Benchmarking with criterion for reliable performance measurement<br><span class="zh-inline">如何用 `criterion` 做更可靠的性能测量</span>
> - Mocking strategies without heavyweight frameworks<br><span class="zh-inline">不用厚重 Mock 框架时的依赖替身策略</span>

## Unit Tests, Integration Tests, Doc Tests<br><span class="zh-inline">单元测试、集成测试与文档测试</span>

Rust has three testing tiers built into the language:<br><span class="zh-inline">Rust 语言本身就内建了三层测试体系：</span>

```rust
// --- Unit tests: in the same file as the code ---
pub fn factorial(n: u64) -> u64 {
    (1..=n).product()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_factorial_zero() {
        // (1..=0).product() returns 1 — the multiplication identity for empty ranges
        assert_eq!(factorial(0), 1);
    }

    #[test]
    fn test_factorial_five() {
        assert_eq!(factorial(5), 120);
    }

    #[test]
    #[cfg(debug_assertions)] // overflow checks are only enabled in debug mode
    #[should_panic(expected = "overflow")]
    fn test_factorial_overflow() {
        // ⚠️ This test only passes in debug mode (overflow checks enabled).
        // In release mode (`cargo test --release`), u64 arithmetic wraps
        // silently and no panic occurs. Use `checked_mul` or the
        // `overflow-checks = true` profile setting for release-mode safety.
        factorial(100); // Should panic on overflow
    }

    #[test]
    fn test_with_result() -> Result<(), Box<dyn std::error::Error>> {
        // Tests can return Result — ? works inside!
        let value: u64 = "42".parse()?;
        assert_eq!(value, 42);
        Ok(())
    }
}
```

```rust
// --- Integration tests: in tests/ directory ---
// tests/integration_test.rs
// These test your crate's PUBLIC API only

use my_crate::factorial;

#[test]
fn test_factorial_from_outside() {
    assert_eq!(factorial(10), 3_628_800);
}
```

```rust
// --- Doc tests: in documentation comments ---
/// Computes the factorial of `n`.
///
/// # Examples
///
/// ```
/// use my_crate::factorial;
/// assert_eq!(factorial(5), 120);
/// ```
///
/// # Panics
///
/// Panics if the result overflows `u64`.
///
/// ```should_panic
/// my_crate::factorial(100);
/// ```
pub fn factorial(n: u64) -> u64 {
    (1..=n).product()
}
// Doc tests are compiled and run by `cargo test` — they keep examples honest.
```

Unit tests stay next to the implementation and are best for internal helper logic. Integration tests live under `tests/` and can only touch the crate's public API, so they behave more like external consumers. Doc tests turn examples in comments into executable checks, which is a very Rust-style way to keep documentation from rotting.<br><span class="zh-inline">单元测试和实现写在一起，最适合覆盖内部辅助逻辑；集成测试放在 `tests/` 目录下，只能通过公开 API 访问 crate，因此更像真实外部调用方；文档测试则会把注释里的示例代码当成可执行检查，这是 Rust 很有代表性的一种做法，能防止文档示例慢慢烂掉。</span>

### Test Fixtures and Setup<br><span class="zh-inline">测试夹具与初始化</span>

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // Shared setup — create a helper function
    fn setup_database() -> TestDb {
        let db = TestDb::new_in_memory();
        db.run_migrations();
        db.seed_test_data();
        db
    }

    #[test]
    fn test_user_creation() {
        let db = setup_database();
        let user = db.create_user("Alice", "alice@test.com").unwrap();
        assert_eq!(user.name, "Alice");
    }

    #[test]
    fn test_user_deletion() {
        let db = setup_database();
        db.create_user("Bob", "bob@test.com").unwrap();
        assert!(db.delete_user("Bob").is_ok());
        assert!(db.get_user("Bob").is_none());
    }

    // Cleanup with Drop (RAII):
    struct TempDir {
        path: std::path::PathBuf,
    }

    impl TempDir {
        fn new() -> Self {
            // Cargo.toml: rand = "0.8"
            let path = std::env::temp_dir().join(format!("test_{}", rand::random::<u32>()));
            std::fs::create_dir_all(&path).unwrap();
            TempDir { path }
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.path);
        }
    }

    #[test]
    fn test_file_operations() {
        let dir = TempDir::new(); // Created
        std::fs::write(dir.path.join("test.txt"), "hello").unwrap();
        assert!(dir.path.join("test.txt").exists());
    } // dir dropped here → temp directory cleaned up
}
```

The idea is simple: factor shared setup into helper functions, and let RAII clean temporary resources automatically. That keeps each test focused on behavior instead of repeating boilerplate for database creation, file directories, or cleanup logic.<br><span class="zh-inline">核心思路很朴素：公共初始化抽成辅助函数，临时资源则交给 RAII 自动清理。这样每个测试都能专注在行为验证上，不用反复堆数据库初始化、临时目录创建和收尾清理这些样板代码。</span>

### Property-Based Testing (proptest)<br><span class="zh-inline">性质测试 `proptest`</span>

Instead of testing specific values, test *properties* that should always hold:<br><span class="zh-inline">与其只测几个手挑的输入，不如测试那些“无论输入怎么变都应该成立”的*性质*：</span>

```rust
// Cargo.toml: proptest = "1"
use proptest::prelude::*;

fn reverse(v: &[i32]) -> Vec<i32> {
    v.iter().rev().cloned().collect()
}

proptest! {
    #[test]
    fn test_reverse_twice_is_identity(v in prop::collection::vec(any::<i32>(), 0..100)) {
        // Property: reversing twice gives back the original
        assert_eq!(reverse(&reverse(&v)), v);
    }

    #[test]
    fn test_reverse_preserves_length(v in prop::collection::vec(any::<i32>(), 0..100)) {
        assert_eq!(reverse(&v).len(), v.len());
    }

    #[test]
    fn test_sort_is_idempotent(mut v in prop::collection::vec(any::<i32>(), 0..100)) {
        v.sort();
        let sorted_once = v.clone();
        v.sort();
        assert_eq!(v, sorted_once); // Sorting twice = sorting once
    }

    #[test]
    fn test_parse_roundtrip(x in any::<f64>().prop_filter("finite", |x| x.is_finite())) {
        // Property: formatting then parsing gives back the same value
        let s = format!("{x}");
        let parsed: f64 = s.parse().unwrap();
        prop_assert!((x - parsed).abs() < f64::EPSILON);
    }
}
```

> **When to use proptest**: When you're testing a function with a large input space and want confidence it works for edge cases you didn't think of. `proptest` generates hundreds of random inputs and shrinks failures to the minimal reproducing case.<br><span class="zh-inline">**什么时候该上 `proptest`**：当函数的输入空间很大，靠手写几个例子根本覆盖不住，而且还想顺手揪出自己没想到的边界情况时，就该用它。`proptest` 会生成成百上千个随机输入，出问题以后还会自动把失败样例缩减到最小复现用例。</span>

### Benchmarking with criterion<br><span class="zh-inline">用 `criterion` 做基准测试</span>

```rust
// Cargo.toml:
// [dev-dependencies]
// criterion = { version = "0.5", features = ["html_reports"] }
//
// [[bench]]
// name = "my_benchmarks"
// harness = false

// benches/my_benchmarks.rs
use criterion::{criterion_group, criterion_main, Criterion, black_box};

fn fibonacci(n: u64) -> u64 {
    match n {
        0 | 1 => n,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn bench_fibonacci(c: &mut Criterion) {
    c.bench_function("fibonacci 20", |b| {
        b.iter(|| fibonacci(black_box(20)))
    });

    // Compare different implementations:
    let mut group = c.benchmark_group("fibonacci_compare");
    for size in [10, 15, 20, 25] {
        group.bench_with_input(
            criterion::BenchmarkId::from_parameter(size),
            &size,
            |b, &size| b.iter(|| fibonacci(black_box(size))),
        );
    }
    group.finish();
}

criterion_group!(benches, bench_fibonacci);
criterion_main!(benches);

// Run: cargo bench
// Produces HTML reports in target/criterion/
```

Unlike ad-hoc timing with `Instant::now()`, `criterion` repeats runs, warms up, applies statistical analysis, and produces HTML reports. That matters because micro-benchmarks are full of noise; if the tool itself is shaky, the numbers are decoration rather than evidence.<br><span class="zh-inline">和拿 `Instant::now()` 手搓计时相比，`criterion` 会反复运行、做预热、统计分析，还能生成 HTML 报告。这点很关键，因为微基准里噪声多得离谱；测量工具本身要是不靠谱，跑出来的数字基本就是装饰品。</span>

### Mocking Strategies without Frameworks<br><span class="zh-inline">不用框架的 Mock 策略</span>

Rust's trait system provides natural dependency injection — no mocking framework required:<br><span class="zh-inline">Rust 的 trait 系统天生就适合做依赖注入，很多时候根本用不到专门的 Mock 框架：</span>

```rust
// Define behavior as a trait
trait Clock {
    fn now(&self) -> std::time::Instant;
}

trait HttpClient {
    fn get(&self, url: &str) -> Result<String, String>;
}

// Production implementations
struct RealClock;
impl Clock for RealClock {
    fn now(&self) -> std::time::Instant { std::time::Instant::now() }
}

// Service depends on abstractions
struct CacheService<C: Clock, H: HttpClient> {
    clock: C,
    client: H,
    ttl: std::time::Duration,
}

impl<C: Clock, H: HttpClient> CacheService<C, H> {
    fn fetch(&self, url: &str) -> Result<String, String> {
        // Uses self.clock and self.client — injectable
        self.client.get(url)
    }
}

// Test with mock implementations — no framework needed!
#[cfg(test)]
mod tests {
    use super::*;

    struct MockClock {
        fixed_time: std::time::Instant,
    }
    impl Clock for MockClock {
        fn now(&self) -> std::time::Instant { self.fixed_time }
    }

    struct MockHttpClient {
        response: String,
    }
    impl HttpClient for MockHttpClient {
        fn get(&self, _url: &str) -> Result<String, String> {
            Ok(self.response.clone())
        }
    }

    #[test]
    fn test_cache_service() {
        let service = CacheService {
            clock: MockClock { fixed_time: std::time::Instant::now() },
            client: MockHttpClient { response: "cached data".into() },
            ttl: std::time::Duration::from_secs(300),
        };

        assert_eq!(service.fetch("http://example.com").unwrap(), "cached data");
    }
}
```

> **Test philosophy**: Prefer real dependencies in integration tests, trait-based mocks in unit tests. Avoid mocking frameworks unless your dependency graph is truly complicated — Rust's trait generics cover most cases naturally.<br><span class="zh-inline">**测试哲学**：集成测试优先接真实依赖，单元测试里再用基于 trait 的 mock。只有依赖图真的复杂得离谱时，才值得引入额外框架；多数场景下，Rust 的 trait 泛型已经够用了。</span>

> **Key Takeaways — Testing**<br><span class="zh-inline">**本章要点 — 测试**</span>
> - Doc tests (`///`) double as documentation and regression tests — they're compiled and run<br><span class="zh-inline">文档测试 `///` 既是文档，也是回归测试；它们会被编译和执行</span>
> - `proptest` generates random inputs to find edge cases you'd never write manually<br><span class="zh-inline">`proptest` 会生成随机输入，把手工很难想到的边界情况挖出来</span>
> - `criterion` provides statistically rigorous benchmarks with HTML reports<br><span class="zh-inline">`criterion` 提供更有统计意义的基准测试，并附带 HTML 报告</span>
> - Mock via trait generics + test doubles, not mock frameworks<br><span class="zh-inline">优先用 trait 泛型加测试替身做 Mock，而不是急着上 Mock 框架</span>

> **See also:** [Ch 12 — Macros](ch12-macros-code-that-writes-code.md) for testing macro-generated code. [Ch 14 — API Design](ch14-crate-architecture-and-api-design.md) for how module layout affects test organization.<br><span class="zh-inline">**延伸阅读：** 想看宏生成代码怎么测，可以看 [第 12 章：宏](ch12-macros-code-that-writes-code.md)；想看模块布局如何影响测试组织，可以看 [第 14 章：API 设计](ch14-crate-architecture-and-api-design.md)。</span>

---

### Exercise: Property-Based Testing with proptest ★★ (~25 min)<br><span class="zh-inline">练习：用 `proptest` 做性质测试 ★★（约 25 分钟）</span>

Write a `SortedVec<T: Ord>` wrapper that maintains a sorted invariant. Use `proptest` to verify that:<br><span class="zh-inline">写一个始终保持有序不变量的 `SortedVec&lt;T: Ord&gt;` 包装器，并使用 `proptest` 验证下面这些性质：</span>
1. After any sequence of insertions, the internal vec is always sorted<br><span class="zh-inline">无论插入序列怎样变化，内部 `Vec` 始终保持有序</span>
2. `contains()` agrees with the stdlib `Vec::contains()`<br><span class="zh-inline">`contains()` 的行为和标准库 `Vec::contains()` 一致</span>
3. The length equals the number of insertions<br><span class="zh-inline">长度等于插入元素的总数</span>

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust,ignore
#[derive(Debug)]
struct SortedVec<T: Ord> {
    inner: Vec<T>,
}

impl<T: Ord> SortedVec<T> {
    fn new() -> Self { SortedVec { inner: Vec::new() } }

    fn insert(&mut self, value: T) {
        let pos = self.inner.binary_search(&value).unwrap_or_else(|p| p);
        self.inner.insert(pos, value);
    }

    fn contains(&self, value: &T) -> bool {
        self.inner.binary_search(value).is_ok()
    }

    fn len(&self) -> usize { self.inner.len() }
    fn as_slice(&self) -> &[T] { &self.inner }
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    proptest! {
        #[test]
        fn always_sorted(values in proptest::collection::vec(-1000i32..1000, 0..100)) {
            let mut sv = SortedVec::new();
            for v in &values {
                sv.insert(*v);
            }
            for w in sv.as_slice().windows(2) {
                prop_assert!(w[0] <= w[1]);
            }
            prop_assert_eq!(sv.len(), values.len());
        }

        #[test]
        fn contains_matches_stdlib(values in proptest::collection::vec(0i32..50, 1..30)) {
            let mut sv = SortedVec::new();
            for v in &values {
                sv.insert(*v);
            }
            for v in &values {
                prop_assert!(sv.contains(v));
            }
            prop_assert!(!sv.contains(&9999));
        }
    }
}
```

</details>

***
