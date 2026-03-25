## Testing in Rust vs C#<br><span class="zh-inline">Rust 与 C# 中的测试</span>

> **What you'll learn:** Built-in `#[test]` vs xUnit, parameterized tests with `rstest` (like `[Theory]`), property testing with `proptest`, mocking with `mockall`, and async test patterns.<br><span class="zh-inline">**本章将学到什么：** 对照理解内建 `#[test]` 与 xUnit，学习如何用 `rstest` 写参数化测试，如何用 `proptest` 做性质测试，如何用 `mockall` 做 mock，以及异步测试的常见写法。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 进阶</span>

### Unit Tests<br><span class="zh-inline">单元测试</span>

```csharp
// C# — xUnit
using Xunit;

public class CalculatorTests
{
    [Fact]
    public void Add_ReturnsSum()
    {
        var calc = new Calculator();
        Assert.Equal(5, calc.Add(2, 3));
    }

    [Theory]
    [InlineData(1, 2, 3)]
    [InlineData(0, 0, 0)]
    [InlineData(-1, 1, 0)]
    public void Add_Theory(int a, int b, int expected)
    {
        Assert.Equal(expected, new Calculator().Add(a, b));
    }
}
```

```rust
// Rust — built-in testing, no external framework needed
pub fn add(a: i32, b: i32) -> i32 { a + b }

#[cfg(test)]  // Only compiled during `cargo test`
mod tests {
    use super::*;  // Import from parent module

    #[test]
    fn add_returns_sum() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn add_negative_numbers() {
        assert_eq!(add(-1, 1), 0);
    }

    #[test]
    #[should_panic(expected = "overflow")]
    fn add_overflow_panics() {
        let _ = add(i32::MAX, 1); // panics in debug mode
    }
}
```

Rust 自带的测试框架比不少 C# 开发者预想得更完整。<br><span class="zh-inline">很多最常见的单元测试场景，光靠 `#[test]`、`assert_eq!`、`#[should_panic]` 就已经够用了，完全不用先抱一大坨外部测试框架进来。</span>

### Parameterized Tests (like `[Theory]`)<br><span class="zh-inline">参数化测试（类似 `[Theory]`）</span>

```rust
// Use the `rstest` crate for parameterized tests
use rstest::rstest;

#[rstest]
#[case(1, 2, 3)]
#[case(0, 0, 0)]
#[case(-1, 1, 0)]
fn test_add(#[case] a: i32, #[case] b: i32, #[case] expected: i32) {
    assert_eq!(add(a, b), expected);
}

// Fixtures — like test setup methods
#[rstest]
fn test_with_fixture(#[values(1, 2, 3)] x: i32) {
    assert!(x > 0);
}
```

如果已经习惯 xUnit 的 `[Theory]` 和 `[InlineData]`，那 `rstest` 基本属于一眼就能上手的工具。<br><span class="zh-inline">它把“同一条测试逻辑喂多组输入”这件事做得非常自然，还顺带补了 fixture 这类常用能力。</span>

### Assertions Comparison<br><span class="zh-inline">断言写法对照</span>

| C# (xUnit)<br><span class="zh-inline">C#（xUnit）</span> | Rust | Notes<br><span class="zh-inline">说明</span> |
|-------------|------|-------|
| `Assert.Equal(expected, actual)`<br><span class="zh-inline">`Assert.Equal(expected, actual)`</span> | `assert_eq!(expected, actual)`<br><span class="zh-inline">`assert_eq!(expected, actual)`</span> | Prints diff on failure<br><span class="zh-inline">失败时会把差异打印出来。</span> |
| `Assert.NotEqual(a, b)`<br><span class="zh-inline">`Assert.NotEqual(a, b)`</span> | `assert_ne!(a, b)`<br><span class="zh-inline">`assert_ne!(a, b)`</span> | Same intent<br><span class="zh-inline">表达的是同一层意思。</span> |
| `Assert.True(condition)`<br><span class="zh-inline">`Assert.True(condition)`</span> | `assert!(condition)`<br><span class="zh-inline">`assert!(condition)`</span> | Boolean assertion<br><span class="zh-inline">布尔条件断言。</span> |
| `Assert.Contains("sub", str)`<br><span class="zh-inline">`Assert.Contains("sub", str)`</span> | `assert!(str.contains("sub"))`<br><span class="zh-inline">`assert!(str.contains("sub"))`</span> | Compose from normal methods<br><span class="zh-inline">通常直接和普通方法组合使用。</span> |
| `Assert.Throws<T>(() => ...)`<br><span class="zh-inline">`Assert.Throws&lt;T&gt;(() =&gt; ...)`</span> | `#[should_panic]`<br><span class="zh-inline">`#[should_panic]`</span> | Or use `std::panic::catch_unwind`<br><span class="zh-inline">也可以改用 `std::panic::catch_unwind`。</span> |
| `Assert.Null(obj)`<br><span class="zh-inline">`Assert.Null(obj)`</span> | `assert!(option.is_none())`<br><span class="zh-inline">`assert!(option.is_none())`</span> | No nulls, use `Option`<br><span class="zh-inline">Rust 没有随处可见的 `null`，这里对应的是 `Option`。</span> |

Rust 的断言体系很朴素，但也正因为朴素，读起来很利索。<br><span class="zh-inline">多数时候没有那种“框架魔法味儿”很重的测试 DSL，测试代码和业务代码贴得更近，维护时反而省心。</span>

### Test Organization<br><span class="zh-inline">测试组织方式</span>

```text
my_crate/
├── src/
│   ├── lib.rs          # Unit tests in #[cfg(test)] mod tests { }
│   └── parser.rs       # Each module can have its own test module
├── tests/              # Integration tests (each file is a separate crate)
│   ├── parser_test.rs  # Tests the public API as an external consumer
│   └── api_test.rs
└── benches/            # Benchmarks (with criterion crate)
    └── my_benchmark.rs
```

```rust
// tests/parser_test.rs — integration test
// Can only access PUBLIC API (like testing from outside the assembly)
use my_crate::parser;

#[test]
fn test_parse_valid_input() {
    let result = parser::parse("valid input");
    assert!(result.is_ok());
}
```

这套目录结构有个很重要的意思：单元测试和集成测试从工程边界上就是分开的。<br><span class="zh-inline">`src/` 里的测试更贴近实现细节，`tests/` 则像外部使用者那样只碰公开 API，这种分层能逼着接口设计更清楚。</span>

### Async Tests<br><span class="zh-inline">异步测试</span>

```csharp
// C# — async test with xUnit
[Fact]
public async Task GetUser_ReturnsUser()
{
    var service = new UserService();
    var user = await service.GetUserAsync(1);
    Assert.Equal("Alice", user.Name);
}
```

```rust
// Rust — async test with tokio
#[tokio::test]
async fn get_user_returns_user() {
    let service = UserService::new();
    let user = service.get_user(1).await.unwrap();
    assert_eq!(user.name, "Alice");
}
```

异步测试的心智模型和 C# 其实差得不大。<br><span class="zh-inline">主要区别在于 Rust 需要先把运行时说清楚，例如这里用的是 `tokio`，所以测试属性也写成 `#[tokio::test]`。</span>

### Mocking with mockall<br><span class="zh-inline">使用 `mockall` 做 Mock</span>

```rust
use mockall::automock;

#[automock]                         // Generates MockUserRepo struct
trait UserRepo {
    fn find_by_id(&self, id: u32) -> Option<User>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn service_returns_user_from_repo() {
        let mut mock = MockUserRepo::new();
        mock.expect_find_by_id()
            .with(mockall::predicate::eq(1))
            .returning(|_| Some(User { name: "Alice".into() }));

        let service = UserService::new(mock);
        let user = service.get_user(1).unwrap();
        assert_eq!(user.name, "Alice");
    }
}
```

```csharp
// C# — Moq equivalent
var mock = new Mock<IUserRepo>();
mock.Setup(r => r.FindById(1)).Returns(new User { Name = "Alice" });
var service = new UserService(mock.Object);
Assert.Equal("Alice", service.GetUser(1).Name);
```

如果之前常用 Moq，看 `mockall` 时最大的差异在于：Rust 往往先通过 trait 把边界切清楚，再围着 trait 生成 mock。<br><span class="zh-inline">这件事表面上麻烦一点，实际上会逼着模块边界更明确，长期维护时挺值。</span>

<details>
<summary><strong>🏋️ Exercise: Write Comprehensive Tests</strong><br><span class="zh-inline"><strong>🏋️ 练习：编写覆盖更完整的测试</strong></span></summary>

**Challenge**: Given this function, write tests covering: happy path, empty input, numeric strings, and Unicode.<br><span class="zh-inline">**挑战：** 针对下面这个函数，补出能覆盖正常路径、空输入、数字字符串和 Unicode 文本的测试。</span>

```rust
pub fn title_case(input: &str) -> String {
    input.split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                Some(c) => format!("{}{}", c.to_uppercase(), chars.as_str().to_lowercase()),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}
```

<details>
<summary>🔑 Solution<br><span class="zh-inline">🔑 参考答案</span></summary>

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn happy_path() {
        assert_eq!(title_case("hello world"), "Hello World");
    }

    #[test]
    fn empty_input() {
        assert_eq!(title_case(""), "");
    }

    #[test]
    fn single_word() {
        assert_eq!(title_case("rust"), "Rust");
    }

    #[test]
    fn already_title_case() {
        assert_eq!(title_case("Hello World"), "Hello World");
    }

    #[test]
    fn all_caps() {
        assert_eq!(title_case("HELLO WORLD"), "Hello World");
    }

    #[test]
    fn extra_whitespace() {
        // split_whitespace handles multiple spaces
        assert_eq!(title_case("  hello   world  "), "Hello World");
    }

    #[test]
    fn unicode() {
        assert_eq!(title_case("café résumé"), "Café Résumé");
    }

    #[test]
    fn numeric_words() {
        assert_eq!(title_case("hello 42 world"), "Hello 42 World");
    }
}
```

**Key takeaway**: Rust's built-in test framework handles most unit testing needs. Use `rstest` for parameterized tests and `mockall` for mocking. There is usually no need to drag in a large framework just to get started.<br><span class="zh-inline">**这一节的重点：** Rust 自带的测试框架已经能覆盖绝大多数单元测试需求；参数化测试用 `rstest`，mock 用 `mockall`，起步阶段通常完全没必要为了测试先背一个巨型框架。</span>

</details>
</details>

<!-- ch14a.1: Property Testing with proptest -->
## Property Testing: Proving Correctness at Scale<br><span class="zh-inline">性质测试：用规模化输入验证正确性</span>

C# developers familiar with **FsCheck** will recognize property-based testing: instead of writing individual test cases, you describe *properties* that must hold for **all possible inputs**, and the framework generates thousands of random inputs to try to break them.<br><span class="zh-inline">如果接触过 **FsCheck**，那对性质测试应该不会陌生。它不是手写一堆孤立样例，而是先描述“对所有可能输入都必须成立的性质”，然后让框架自动生成海量随机输入，专门找茬。</span>

### Why Property Testing Matters<br><span class="zh-inline">为什么性质测试很重要</span>

```csharp
// C# — Hand-written unit tests check specific cases
[Fact]
public void Reverse_Twice_Returns_Original()
{
    var list = new List<int> { 1, 2, 3 };
    list.Reverse();
    list.Reverse();
    Assert.Equal(new[] { 1, 2, 3 }, list);
}
// But what about empty lists? Single elements? 10,000 elements? Negative numbers?
// You'd need dozens of hand-written cases.
```

```rust
// Rust — proptest generates thousands of inputs automatically
use proptest::prelude::*;

fn reverse<T: Clone>(v: &[T]) -> Vec<T> {
    v.iter().rev().cloned().collect()
}

proptest! {
    #[test]
    fn reverse_twice_is_identity(ref v in prop::collection::vec(any::<i32>(), 0..1000)) {
        let reversed_twice = reverse(&reverse(v));
        prop_assert_eq!(v, &reversed_twice);
    }
    // proptest runs this with hundreds of random Vec<i32> values:
    // [], [0], [i32::MIN, i32::MAX], [42; 999], random sequences...
    // If it fails, it SHRINKS to the smallest failing input!
}
```

普通单元测试擅长保住已知边界，性质测试擅长把未知角落翻出来。<br><span class="zh-inline">尤其是解析、序列化、排序、编解码、校验器这类逻辑，用性质测试往往特别划算，因为很多 bug 根本不是某个具体值的问题，而是“某个规律在某些输入族里失效了”。</span>

### Getting Started with proptest<br><span class="zh-inline">快速接入 `proptest`</span>

```toml
# Cargo.toml
[dev-dependencies]
proptest = "1.4"
```

### Common Patterns for C# Developers<br><span class="zh-inline">适合 C# 开发者理解的常见模式</span>

```rust
use proptest::prelude::*;

// 1. Roundtrip property: serialize → deserialize = identity
// (Like testing JsonSerializer.Serialize → Deserialize)
proptest! {
    #[test]
    fn json_roundtrip(name in "[a-zA-Z]{1,50}", age in 0u32..150) {
        let user = User { name: name.clone(), age };
        let json = serde_json::to_string(&user).unwrap();
        let parsed: User = serde_json::from_str(&json).unwrap();
        prop_assert_eq!(user, parsed);
    }
}

// 2. Invariant property: output always satisfies a condition
proptest! {
    #[test]
    fn sort_output_is_sorted(ref v in prop::collection::vec(any::<i32>(), 0..500)) {
        let mut sorted = v.clone();
        sorted.sort();
        // Every adjacent pair must be in order
        for window in sorted.windows(2) {
            prop_assert!(window[0] <= window[1]);
        }
    }
}

// 3. Oracle property: compare two implementations
proptest! {
    #[test]
    fn fast_path_matches_slow_path(input in "[0-9a-f]{1,100}") {
        let result_fast = parse_hex_fast(&input);
        let result_slow = parse_hex_slow(&input);
        prop_assert_eq!(result_fast, result_slow);
    }
}

// 4. Custom strategies: generate domain-specific test data
fn valid_email() -> impl Strategy<Value = String> {
    ("[a-z]{1,20}", "[a-z]{1,10}", prop::sample::select(vec!["com", "org", "io"]))
        .prop_map(|(user, domain, tld)| format!("{}@{}.{}", user, domain, tld))
}

proptest! {
    #[test]
    fn email_parsing_accepts_valid_emails(email in valid_email()) {
        let result = Email::new(&email);
        prop_assert!(result.is_ok(), "Failed to parse: {}", email);
    }
}
```

这四类模式特别值得记住：往返一致性、恒成立约束、快慢实现对拍、自定义领域数据生成。<br><span class="zh-inline">只要脑子里先装下这四把锤子，后面很多测试问题都能很快找到能敲的位置。</span>

### proptest vs FsCheck Comparison<br><span class="zh-inline">`proptest` 与 FsCheck 对照</span>

| Feature<br><span class="zh-inline">能力点</span> | C# FsCheck | Rust proptest |
|---------|-----------|---------------|
| Random input generation<br><span class="zh-inline">随机输入生成</span> | `Arb.Generate&lt;T&gt;()`<br><span class="zh-inline">`Arb.Generate&lt;T&gt;()`</span> | `any::&lt;T&gt;()`<br><span class="zh-inline">`any::&lt;T&gt;()`</span> |
| Custom generators<br><span class="zh-inline">自定义生成器</span> | `Arb.Register&lt;T&gt;()`<br><span class="zh-inline">`Arb.Register&lt;T&gt;()`</span> | `impl Strategy&lt;Value = T&gt;`<br><span class="zh-inline">`impl Strategy&lt;Value = T&gt;`</span> |
| Shrinking on failure<br><span class="zh-inline">失败后收缩样例</span> | Automatic<br><span class="zh-inline">自动进行</span> | Automatic<br><span class="zh-inline">自动进行</span> |
| String patterns<br><span class="zh-inline">字符串模式</span> | Manual<br><span class="zh-inline">通常需要手写</span> | `"[regex]"` strategy<br><span class="zh-inline">可以直接用 `"[regex]"` 策略</span> |
| Collection generation<br><span class="zh-inline">集合生成</span> | `Gen.ListOf`<br><span class="zh-inline">`Gen.ListOf`</span> | `prop::collection::vec(strategy, range)`<br><span class="zh-inline">`prop::collection::vec(strategy, range)`</span> |
| Composing generators<br><span class="zh-inline">组合生成器</span> | `Gen.Select`<br><span class="zh-inline">`Gen.Select`</span> | `.prop_map()`, `.prop_flat_map()`<br><span class="zh-inline">`.prop_map()`、`.prop_flat_map()`</span> |
| Config (# of cases)<br><span class="zh-inline">配置测试样例数</span> | `Config.MaxTest`<br><span class="zh-inline">`Config.MaxTest`</span> | `#![proptest_config(ProptestConfig::with_cases(10000))]` inside `proptest!` block<br><span class="zh-inline">在 `proptest!` 块里用 `#![proptest_config(ProptestConfig::with_cases(10000))]` 配置</span> |

### When to Use Property Testing vs Unit Testing<br><span class="zh-inline">什么时候用性质测试，什么时候用单元测试</span>

| Use **unit tests** when<br><span class="zh-inline">适合用**单元测试**的场景</span> | Use **proptest** when<br><span class="zh-inline">适合用 **proptest** 的场景</span> |
|------------------------|----------------------|
| Testing specific edge cases<br><span class="zh-inline">验证明确已知的边界样例</span> | Verifying invariants across all inputs<br><span class="zh-inline">验证跨输入集合都必须成立的不变量</span> |
| Testing error messages/codes<br><span class="zh-inline">校验报错信息或错误码</span> | Roundtrip properties (parse ↔ format)<br><span class="zh-inline">验证往返性质，例如 parse ↔ format</span> |
| Integration/mock tests<br><span class="zh-inline">做集成测试或 mock 场景</span> | Comparing two implementations<br><span class="zh-inline">对拍两套实现</span> |
| Behavior depends on exact values<br><span class="zh-inline">行为强依赖某些特定值</span> | "For all X, property P holds"<br><span class="zh-inline">“对所有 X，性质 P 都成立”这一类问题</span> |

---

## Integration Tests: the `tests/` Directory<br><span class="zh-inline">集成测试：`tests/` 目录</span>

Unit tests live inside `src/` with `#[cfg(test)]`. Integration tests live in a separate `tests/` directory and test your crate's **public API**. That is very similar to how C# integration tests reference the project as an external assembly.<br><span class="zh-inline">单元测试通常放在 `src/` 里，配合 `#[cfg(test)]` 使用；集成测试则单独放进 `tests/` 目录，只测试 crate 的**公开 API**。这点和 C# 里把项目当作外部程序集来引用做测试，非常像。</span>

```text
my_crate/
├── src/
│   ├── lib.rs          // public API
│   └── internal.rs     // private implementation
├── tests/
│   ├── smoke.rs        // each file is a separate test binary
│   ├── api_tests.rs
│   └── common/
│       └── mod.rs      // shared test helpers
└── Cargo.toml
```

### Writing Integration Tests<br><span class="zh-inline">编写集成测试</span>

Each file in `tests/` is compiled as a separate crate that depends on your library:<br><span class="zh-inline">`tests/` 里的每个文件都会被编译成一个独立 crate，并依赖当前库：</span>

```rust
// tests/smoke.rs — can only access pub items from my_crate
use my_crate::{process_order, Order, OrderResult};

#[test]
fn process_valid_order_returns_confirmation() {
    let order = Order::new("SKU-001", 3);
    let result = process_order(order);
    assert!(matches!(result, OrderResult::Confirmed { .. }));
}
```

### Shared Test Helpers<br><span class="zh-inline">共享测试辅助代码</span>

Put shared setup code in `tests/common/mod.rs` rather than `tests/common.rs`, because the latter would be treated as its own test file:<br><span class="zh-inline">公共测试准备代码适合放在 `tests/common/mod.rs` 里，而不是 `tests/common.rs`。后者会被当成独立测试文件来编译，容易把目录结构搞拧巴。</span>

```rust
// tests/common/mod.rs
use my_crate::Config;

pub fn test_config() -> Config {
    Config::builder()
        .database_url("sqlite::memory:")
        .build()
        .expect("test config must be valid")
}
```

```rust
// tests/api_tests.rs
mod common;

use my_crate::App;

#[test]
fn app_starts_with_test_config() {
    let config = common::test_config();
    let app = App::new(config);
    assert!(app.is_healthy());
}
```

### Running Specific Test Types<br><span class="zh-inline">运行指定类型的测试</span>

```bash
cargo test                  # run all tests (unit + integration)
cargo test --lib            # unit tests only (like dotnet test --filter Category=Unit)
cargo test --test smoke     # run only tests/smoke.rs
cargo test --test api_tests # run only tests/api_tests.rs
```

**Key difference from C#:** Integration test files can only access your crate's `pub` API. Private functions are invisible, which pushes tests through the public interface and usually leads to cleaner design.<br><span class="zh-inline">**和 C# 很关键的一点差异：** 集成测试文件只能看到 crate 的 `pub` API，私有函数根本够不着。这种约束看起来更严格，实际上经常能把测试方式和接口设计一起拽回更健康的方向。</span>

***
