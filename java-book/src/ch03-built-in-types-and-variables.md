## Built-in Types and Variables

> **What you'll learn:** How Rust primitives, strings, mutability, and conversions differ from Java's type model.
>
> **Difficulty:** 🟢 Beginner

Rust looks familiar at first because it has integers, booleans, strings, and variables. The differences start showing up once ownership, mutability, and explicit conversions enter the picture.

## Primitive Types

| Java | Rust | Notes |
|---|---|---|
| `int` | `i32` | explicit width |
| `long` | `i64` | explicit width |
| `double` | `f64` | default floating-point choice |
| `boolean` | `bool` | same general role |
| `char` | `char` | Unicode scalar value, not UTF-16 code unit |
| `byte` | `u8` or `i8` | choose signedness explicitly |

Rust forces width and signedness into the spelling. That removes guesswork at API boundaries.

## Variables and Mutability

```rust
let name = "Ada";
let mut count = 0;
count += 1;
```

Bindings are immutable by default. This is one of the earliest places where Rust asks for more explicit intent than Java.

## Shadowing

```rust
let port = "8080";
let port: u16 = port.parse().unwrap();
```

Shadowing lets a name be rebound with a new type or refined value. It is often cleaner than introducing `parsedPort`-style names everywhere.

## `String` vs `&str`

This is the first string distinction Java developers must really learn.

| Rust type | Rough Java intuition | Meaning |
|---|---|---|
| `String` | owned `String` | heap-allocated, owned text |
| `&str` | read-only string view | borrowed string slice |

If a function only needs to read text, prefer `&str`.

## Formatting and Printing

```rust
let name = "Ada";
let score = 42;
println!("{name} scored {score}");
```

Rust formatting uses macros rather than overloaded `println` methods.

## Explicit Conversions

Rust avoids many implicit numeric conversions:

```rust
let x: i32 = 10;
let y: i64 = x as i64;
```

That can feel verbose at first, but it reduces accidental widening and narrowing.

## Advice

- Use immutable bindings unless mutation is genuinely needed.
- Prefer `&str` for input parameters and `String` for owned returned text.
- Read the type annotations in compiler diagnostics carefully; they are often the fastest way to learn.

This chapter is where the surface syntax still feels easy. The harder conceptual shift begins when values start moving rather than merely being referenced.
