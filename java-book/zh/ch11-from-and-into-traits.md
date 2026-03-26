## Type Conversions in Rust<br><span class="zh-inline">Rust 中的类型转换</span>

> **What you'll learn:** How Rust conversion traits map to Java constructors, static factories, DTO mappers, and parsing APIs, plus when to use `From`, `Into`, `TryFrom`, and `FromStr` in real service code.<br><span class="zh-inline">**本章将学习：** Rust 的转换 trait 如何对应 Java 的构造器、静态工厂、DTO 映射器与解析 API，以及在真实服务代码里什么时候该用 `From`、`Into`、`TryFrom`、`FromStr`。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Java projects often express conversions through constructors, `of(...)`, `valueOf(...)`, or mapper classes.<br><span class="zh-inline">Java 项目通常会用构造器、`of(...)`、`valueOf(...)`，或者 mapper 类来表达各种转换。</span>

Rust pulls that intent into a small set of standard traits.<br><span class="zh-inline">Rust 会把这些意图收束到一小组标准 trait 里。</span>

## The Core Distinction<br><span class="zh-inline">核心区别</span>

- `From<T>` means the conversion cannot fail<br><span class="zh-inline">`From<T>` 表示转换一定成功。</span>
- `TryFrom<T>` means validation is required<br><span class="zh-inline">`TryFrom<T>` 表示转换前必须校验。</span>
- `FromStr` means parse text into a value<br><span class="zh-inline">`FromStr` 表示把文本解析成值。</span>
- `Into<T>` is what callers usually use after `From<T>` exists<br><span class="zh-inline">`Into<T>` 往往是调用方在 `From<T>` 存在之后更方便使用的入口。</span>

## Java Mapper vs Rust Trait Impl<br><span class="zh-inline">Java Mapper 和 Rust Trait 实现的对照</span>

```java
public record UserDto(String id, String email) { }

public final class User {
    private final UUID id;
    private final String email;

    private User(UUID id, String email) {
        this.id = id;
        this.email = email;
    }

    public static User fromDto(UserDto dto) {
        return new User(UUID.fromString(dto.id()), dto.email());
    }
}
```

```rust
#[derive(Debug)]
struct UserDto {
    id: String,
    email: String,
}

#[derive(Debug)]
struct User {
    id: uuid::Uuid,
    email: String,
}

impl TryFrom<UserDto> for User {
    type Error = String;

    fn try_from(dto: UserDto) -> Result<Self, Self::Error> {
        let id = dto.id.parse().map_err(|_| "invalid UUID".to_string())?;
        if !dto.email.contains('@') {
            return Err("invalid email".into());
        }

        Ok(User {
            id,
            email: dto.email,
        })
    }
}
```

The business purpose is the same, but Rust turns the conversion rule into part of the type system.<br><span class="zh-inline">业务目的其实是一样的，但 Rust 会把这条转换规则直接写进类型系统里。</span>

## `From` for Infallible Conversions<br><span class="zh-inline">用 `From` 表示必然成功的转换</span>

```rust
#[derive(Debug)]
struct UserId(uuid::Uuid);

impl From<uuid::Uuid> for UserId {
    fn from(value: uuid::Uuid) -> Self {
        Self(value)
    }
}

impl From<UserId> for uuid::Uuid {
    fn from(value: UserId) -> Self {
        value.0
    }
}
```

If no validation is needed, `From` is the most direct expression.<br><span class="zh-inline">如果完全不需要校验，`From` 就是最直接的表达方式。</span>

## `Into` for Convenient Call Sites<br><span class="zh-inline">用 `Into` 让调用点更顺手</span>

```rust
fn load_user(id: impl Into<UserId>) {
    let id = id.into();
    println!("loading {:?}", id);
}

let uuid = uuid::Uuid::new_v4();
load_user(UserId::from(uuid));
```

APIs often accept `Into<T>` so callers can pass either the wrapped type or something easy to wrap.<br><span class="zh-inline">很多 API 会选择接收 `Into<T>`，这样调用方既可以传已经包装好的值，也可以传容易包装进去的值。</span>

## `TryFrom` for DTO-to-Domain Boundaries<br><span class="zh-inline">DTO 到领域对象边界上用 `TryFrom`</span>

This is one of the most useful patterns for Java backend teams.<br><span class="zh-inline">这其实是 Java 后端团队最该尽快掌握的模式之一。</span>

```rust
#[derive(Debug)]
struct CreateUserRequest {
    email: String,
    age: u8,
}

#[derive(Debug)]
struct NewUser {
    email: String,
    age: u8,
}

impl TryFrom<CreateUserRequest> for NewUser {
    type Error = String;

    fn try_from(value: CreateUserRequest) -> Result<Self, Self::Error> {
        if !value.email.contains('@') {
            return Err("email must contain @".into());
        }

        if value.age < 18 {
            return Err("user must be an adult".into());
        }

        Ok(Self {
            email: value.email.trim().to_lowercase(),
            age: value.age,
        })
    }
}
```

This is the Rust version of validating request data before creating a stronger domain object.<br><span class="zh-inline">这就是 Rust 版本的“先验证请求数据，再创建更强约束的领域对象”。</span>

## `FromStr` for Parsing<br><span class="zh-inline">用 `FromStr` 表示解析</span>

```rust
use std::str::FromStr;

#[derive(Debug, Clone, Copy)]
enum Environment {
    Local,
    Staging,
    Production,
}

impl FromStr for Environment {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.trim().to_ascii_lowercase().as_str() {
            "local" => Ok(Self::Local),
            "staging" => Ok(Self::Staging),
            "production" => Ok(Self::Production),
            other => Err(format!("unknown environment: {other}")),
        }
    }
}
```

This is the natural Rust equivalent of `UUID.fromString`, `Integer.parseInt`, or Spring binder conversion.<br><span class="zh-inline">这就是 Rust 对 `UUID.fromString`、`Integer.parseInt`、Spring 绑定器转换的自然对应物。</span>

## `Display` for Rendering<br><span class="zh-inline">用 `Display` 负责展示</span>

```rust
use std::fmt;

struct AccountNumber(String);

impl fmt::Display for AccountNumber {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "acct:{}", self.0)
    }
}
```

Parsing and rendering stay separate in Rust, which usually makes formatting code easier to reason about.<br><span class="zh-inline">Rust 会把“解析”和“展示”分开处理，这通常会让格式化代码更清晰。</span>

## Quick Rules<br><span class="zh-inline">快速规则</span>

| Java habit<br><span class="zh-inline">Java 习惯</span> | Better Rust choice<br><span class="zh-inline">更合适的 Rust 选择</span> |
|---|---|
| constructor that always succeeds<br><span class="zh-inline">一定成功的构造器</span> | `From<T>` |
| static factory that may reject input<br><span class="zh-inline">可能拒绝输入的静态工厂</span> | `TryFrom<T>` |
| `valueOf(String)` or parser<br><span class="zh-inline">`valueOf(String)` 或解析器</span> | `FromStr` |
| standalone mapper service everywhere<br><span class="zh-inline">到处都是独立 mapper 服务</span> | put trait impls near the types<br><span class="zh-inline">把 trait 实现贴近类型本身</span> |

## Common Mistakes<br><span class="zh-inline">常见误区</span>

- using `From<T>` for a conversion that can fail<br><span class="zh-inline">明明可能失败，却硬写成 `From<T>`。</span>
- spreading validation across controllers and services<br><span class="zh-inline">把校验逻辑拆散到 controller 和 service 各处。</span>
- passing raw `String` everywhere instead of introducing value objects<br><span class="zh-inline">到处乱传裸 `String`，而不是建立小型值对象。</span>

