## Testing in Rust vs Java<br><span class="zh-inline">Rust 与 Java 的测试方式对照</span>

> **What you'll learn:** How Rust testing maps to JUnit-style workflows, where parameterized tests fit, and how property testing and mocking compare to the Java ecosystem.<br><span class="zh-inline">**本章将学习：** Rust 测试模型如何对应 JUnit 风格工作流、参数化测试放在什么位置，以及性质测试和 mock 手法与 Java 生态如何对应。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Rust testing feels much closer to library development than to framework-heavy test runners. The defaults are small and built in.<br><span class="zh-inline">Rust 的测试模型更像贴着库开发本身展开，而不是围绕一个很重的测试框架转。默认能力很小、很直接，而且是内建的。</span>

## Unit Tests<br><span class="zh-inline">单元测试</span>

```java
class CalculatorTest {
    @org.junit.jupiter.api.Test
    void addReturnsSum() {
        assertEquals(5, new Calculator().add(2, 3));
    }
}
```

```rust
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::add;

    #[test]
    fn add_returns_sum() {
        assert_eq!(add(2, 3), 5);
    }
}
```

## Test Layout Mapping<br><span class="zh-inline">测试布局映射</span>

| Java habit<br><span class="zh-inline">Java 习惯</span> | Rust habit<br><span class="zh-inline">Rust 习惯</span> |
|---|---|
| `src/test/java` | inline `#[cfg(test)]` modules or `tests/`<br><span class="zh-inline">内联 `#[cfg(test)]` 模块或 `tests/` 目录</span> |
| JUnit assertions | `assert!`, `assert_eq!`, `assert_ne!` |
| integration test module<br><span class="zh-inline">集成测试模块</span> | files in `tests/` |
| parameterized tests<br><span class="zh-inline">参数化测试</span> | `rstest` crate |
| property testing libraries<br><span class="zh-inline">性质测试库</span> | `proptest` or `quickcheck` |
| Mockito | `mockall` or handwritten trait-based fakes<br><span class="zh-inline">`mockall` 或手写基于 trait 的 fake</span> |

## Integration Tests<br><span class="zh-inline">集成测试</span>

```rust
// tests/api_smoke.rs
use my_crate::parse_user;

#[test]
fn parses_valid_payload() {
    let input = r#"{"id":1,"name":"Ada"}"#;
    assert!(parse_user(input).is_ok());
}
```

Integration tests compile as external consumers of the crate. That makes them a good match for “public API only” expectations.<br><span class="zh-inline">集成测试会把 crate 当成外部消费者来编译，因此特别适合验证“公共 API 对外是否正常”这件事。</span>

## Async Tests<br><span class="zh-inline">异步测试</span>

```rust
#[tokio::test]
async fn fetch_user_returns_data() {
    let result = fetch_user(42).await;
    assert!(result.is_ok());
}
```

The mental model is straightforward: if production code needs a runtime, async tests need one too.<br><span class="zh-inline">理解起来很简单：生产代码如果需要运行时，异步测试也需要运行时。</span>

## Property Testing<br><span class="zh-inline">性质测试</span>

Property testing is a strong fit for parsers, codecs, query builders, and data transformations.<br><span class="zh-inline">解析器、编解码器、查询构造器、数据转换逻辑，这些都特别适合用性质测试补强。</span>

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn reversing_twice_returns_original(xs: Vec<i32>) {
        let reversed: Vec<_> = xs.iter().copied().rev().collect();
        let restored: Vec<_> = reversed.iter().copied().rev().collect();
        prop_assert_eq!(xs, restored);
    }
}
```

## Advice for Java Teams<br><span class="zh-inline">给 Java 团队的建议</span>

- Keep fast unit tests close to the module they validate.<br><span class="zh-inline">快速单元测试尽量贴着被测模块写。</span>
- Add integration tests for crate boundaries, CLI behavior, and serialized formats.<br><span class="zh-inline">crate 边界、CLI 行为、序列化格式这些地方要补上集成测试。</span>
- Prefer trait-based seams for mocking instead of container-heavy indirection.<br><span class="zh-inline">mock 时优先依靠 trait 边界，而不是把容器式间接层堆得很厚。</span>
- Use property tests where one handwritten example is not enough.<br><span class="zh-inline">凡是靠一两个手写样例压不住的逻辑，就考虑加性质测试。</span>

Rust's testing model feels lighter than a typical enterprise Java test stack, but that lightness is usually an advantage rather than a limitation.<br><span class="zh-inline">Rust 的测试模型看起来比典型企业 Java 测试栈轻得多，但这种“轻”大多数时候反而是优点，不是短板。</span>
