## Testing in Rust vs Java

> **What you'll learn:** How Rust testing maps to JUnit-style workflows, where parameterized tests fit, and how property testing and mocking compare to the Java ecosystem.
>
> **Difficulty:** 🟡 Intermediate

Rust testing feels much closer to library development than to framework-heavy test runners. The defaults are small and built in.

## Unit Tests

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

## Test Layout Mapping

| Java habit | Rust habit |
|---|---|
| `src/test/java` | inline `#[cfg(test)]` modules or `tests/` |
| JUnit assertions | `assert!`, `assert_eq!`, `assert_ne!` |
| integration test module | files in `tests/` |
| parameterized tests | `rstest` crate |
| property testing libraries | `proptest` or `quickcheck` |
| Mockito | `mockall` or handwritten trait-based fakes |

## Integration Tests

```rust
// tests/api_smoke.rs
use my_crate::parse_user;

#[test]
fn parses_valid_payload() {
    let input = r#"{"id":1,"name":"Ada"}"#;
    assert!(parse_user(input).is_ok());
}
```

Integration tests compile as external consumers of the crate. That makes them a good match for “public API only” expectations.

## Async Tests

```rust
#[tokio::test]
async fn fetch_user_returns_data() {
    let result = fetch_user(42).await;
    assert!(result.is_ok());
}
```

The mental model is straightforward: if production code needs a runtime, async tests need one too.

## Property Testing

Property testing is a strong fit for parsers, codecs, query builders, and data transformations.

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

## Advice for Java Teams

- Keep fast unit tests close to the module they validate.
- Add integration tests for crate boundaries, CLI behavior, and serialized formats.
- Prefer trait-based seams for mocking instead of container-heavy indirection.
- Use property tests where one handwritten example is not enough.

Rust's testing model feels lighter than a typical enterprise Java test stack, but that lightness is usually an advantage rather than a limitation.
