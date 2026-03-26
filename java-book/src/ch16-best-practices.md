## Best Practices and Reference

> **What you'll learn:** The habits that help Java developers write more idiomatic Rust instead of mechanically translating old patterns.
>
> **Difficulty:** 🟡 Intermediate

## Prefer Explicit Ownership

Pass borrowed data when ownership is not needed. Return owned data when the caller should keep it.

## Design Small Public APIs

Default privacy is an advantage. Use it to keep module boundaries narrow.

## Model Variants with Enums

If a Java design would reach for an inheritance hierarchy only to represent alternatives, consider an enum first.

## Keep Error Types Honest

Use domain enums or precise error wrappers instead of hiding everything behind generalized exceptions too early.

## Use Concrete Types Until Abstraction Is Earned

Many Java developers abstract too early because frameworks encourage it. In Rust, concrete code often stays cleaner longer.

## Let the Compiler Participate

Compiler feedback is not just about fixing syntax. It is often feedback on ownership design, borrowing scope, API shape, and error flow.

Idiomatic Rust usually feels smaller, stricter, and less ceremonial than enterprise Java. That is a feature, not a deficit.
