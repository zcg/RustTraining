## Type Conversions in Rust

> **What you'll learn:** How Rust conversion traits map to Java constructors, static factories, DTO mappers, and parsing APIs, plus when to use `From`, `Into`, `TryFrom`, and `FromStr` in real service code.
>
> **Difficulty:** 🟡 Intermediate

Java codebases usually express conversions through constructors, `of(...)`, `valueOf(...)`, mapper classes, or MapStruct-generated adapters. Rust gathers the same intent into a small family of traits.

The key distinction is simple:

- `From<T>` means conversion cannot fail
- `TryFrom<T>` means validation is required
- `FromStr` means parse text into a value
- `Into<T>` is mostly what callers use once `From<T>` exists

## Java-Style Mapping vs Rust-Style Mapping

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

Rust normally moves that logic into trait implementations:

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

This is the same business move as a Java mapper, but the contract is now encoded in the type system rather than in a naming convention.

## `From` for Infallible Conversions

Use `From` when the source value already has everything needed and no validation can fail.

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

That is similar to a Java value object wrapping a raw type, except Rust standardizes the conversion interface.

## `Into` at Call Sites

Most library code implements `From`, but many APIs accept `Into` because it is convenient for callers.

```rust
fn load_user(id: impl Into<UserId>) {
    let id = id.into();
    println!("loading {:?}", id);
}

let uuid = uuid::Uuid::new_v4();
load_user(UserId::from(uuid));
```

This reads like accepting both "already wrapped" and "easy to wrap" inputs.

## `TryFrom` for DTO-to-Domain Boundaries

This is where Rust becomes especially useful for Java teams building APIs.

Request DTOs often arrive in a weaker shape than domain models. Converting them should validate, not silently trust input.

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

This is the Rust version of a Java service doing request validation before creating a domain object.

## `FromStr` for Configuration, CLI, and HTTP Parameters

Java developers often use `UUID.fromString`, `Integer.parseInt`, or Spring's binder conversion infrastructure. Rust expresses the same pattern with `FromStr`.

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

let env: Environment = "staging".parse().unwrap();
```

This becomes useful in configuration loading, command-line parsing, and custom HTTP extractors.

## String Formatting Flows Through `Display`

Rust keeps parsing and rendering as separate concerns:

```rust
use std::fmt;

struct AccountNumber(String);

impl fmt::Display for AccountNumber {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "acct:{}", self.0)
    }
}

let account = AccountNumber("A-1024".into());
assert_eq!(account.to_string(), "acct:A-1024");
```

In Java terms, `Display` plays the role normally split between `toString()` conventions and formatter utilities. The difference is that generic Rust code can require `Display` explicitly.

## Mapping Rules for Java Teams

| Java habit | Better Rust choice |
|---|---|
| constructor that always succeeds | `From<T>` |
| static factory that may reject input | `TryFrom<T>` |
| `valueOf(String)` or parser | `FromStr` |
| mapper service passed around everywhere | trait impls near the types |
| implicit conversion magic | explicit `.into()` or `.try_into()` |

## Common Mistakes

- implementing `From<T>` for a conversion that can actually fail
- using `String` everywhere instead of introducing small value objects
- spreading validation across handlers instead of centralizing it in `TryFrom`
- creating mapper structs for one-off conversions that belong on the type itself

## Practical Example: Handler to Service Boundary

```rust
async fn create_user_handler(payload: CreateUserRequest) -> Result<(), String> {
    let new_user = NewUser::try_from(payload)?;
    println!("ready to persist {}", new_user.email);
    Ok(())
}
```

The handler receives wire-format input. The domain object is created only after conversion succeeds. This separation is one of the cleanest improvements over many Java controller designs where DTOs leak too far inward.

---

## Exercises

<details>
<summary><strong>🏋️ Exercise: Request DTO to Domain Object</strong> (click to expand)</summary>

Model a migration-friendly signup flow:

1. `EmailAddress(String)` should implement `FromStr`
2. `SignupRequest { email: String, display_name: String }`
3. `NewAccount { email: EmailAddress, display_name: String }`
4. Implement `TryFrom<SignupRequest>` for `NewAccount`
5. Reject blank display names and malformed emails

<details>
<summary>🔑 Solution</summary>

```rust
use std::str::FromStr;

#[derive(Debug, Clone)]
struct EmailAddress(String);

impl FromStr for EmailAddress {
    type Err = String;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        let email = value.trim().to_ascii_lowercase();
        if !email.contains('@') {
            return Err("invalid email".into());
        }
        Ok(Self(email))
    }
}

#[derive(Debug)]
struct SignupRequest {
    email: String,
    display_name: String,
}

#[derive(Debug)]
struct NewAccount {
    email: EmailAddress,
    display_name: String,
}

impl TryFrom<SignupRequest> for NewAccount {
    type Error = String;

    fn try_from(value: SignupRequest) -> Result<Self, Self::Error> {
        let display_name = value.display_name.trim().to_string();
        if display_name.is_empty() {
            return Err("display_name cannot be blank".into());
        }

        Ok(Self {
            email: value.email.parse()?,
            display_name,
        })
    }
}
```

</details>
</details>

***
