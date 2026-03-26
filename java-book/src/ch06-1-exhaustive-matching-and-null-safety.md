## Exhaustive Matching and Null Safety

> **What you'll learn:** Why `Option<T>` and exhaustive `match` matter so much to developers coming from Java's null-heavy past, and how Rust turns absence and branching into ordinary type design instead of defensive programming.
>
> **Difficulty:** 🟡 Intermediate

Rust treats absence as a first-class type problem, not as a convention problem.

## `Option<T>`

```rust
fn find_user(id: u64) -> Option<User> {
    // ...
}
```

That return type forces callers to think about “found” and “not found” explicitly.

## Why This Feels Different from Java

Java has `Optional<T>`, but it is mostly used at API boundaries, and ordinary references can still be null. In many codebases, `Optional` is avoided in fields, serialization models, or older service layers. Rust uses `Option<T>` in ordinary APIs, so absence handling becomes routine instead of exceptional.

That means Rust developers stop asking “should this be nullable?” and start asking “what shape of value describes reality?”

## `Optional<T>` Versus `Option<T>`

For Java developers, the mental shift is important:

- Java `Optional<T>` is often advisory
- Rust `Option<T>` is structural
- Java still allows `null` to bypass the model
- Rust safe code does not let absence hide outside the model

In practice, `Option<T>` is closer to a language-wide discipline than to a convenience wrapper.

## Exhaustive `match`

```rust
match maybe_user {
    Some(user) => println!("{}", user.name),
    None => println!("not found"),
}
```

Missing a branch is usually a compile error rather than a runtime surprise.

## More Than Null Checks

Exhaustive matching becomes even more powerful when the type is not just “present or absent” but a real domain model:

```rust
enum PaymentMethod {
    Card(CardInfo),
    BankTransfer(BankInfo),
    Cash,
}
```

When a new variant is added, existing `match` expressions become incomplete until the logic is updated. That is a very different safety story from a Java `switch` over strings or ad-hoc discriminator values.

## Why Java Teams Notice This Early

Java developers often come from codebases with some combination of:

- nullable entity fields
- `Optional` at service boundaries
- `switch` branches that quietly miss new states
- defensive `if (x != null)` checks repeated everywhere

Rust cuts through that clutter by making the state model explicit first.

## Practical Benefits

- no accidental null dereference in normal safe code
- branching logic is visible in one place
- new enum variants force old logic to be revisited
- domain transitions become easier to review because the type tells the story

For Java developers, this is one of the first chapters where Rust's type system stops feeling like syntax and starts feeling like a design tool.
