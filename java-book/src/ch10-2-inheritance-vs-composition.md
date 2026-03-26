## Inheritance vs Composition

> **What you'll learn:** Why Rust favors composition over class inheritance and how Java design patterns change under that pressure.
>
> **Difficulty:** 🟡 Intermediate

Rust has no class inheritance. That is not a missing feature by accident; it is a design decision.

## What Replaces Inheritance

- traits for shared behavior
- structs for data ownership
- delegation for reuse
- enums for explicit variant modeling

## Why This Helps

Inheritance-heavy code often mixes state sharing, behavioral polymorphism, and framework convenience into one mechanism. Rust separates those concerns, which can make designs flatter and easier to audit.

## Advice for Java Developers

- model behavior with traits
- reuse implementation through helper types and delegation
- use enums where inheritance trees only exist to model variants

Composition in Rust is usually less magical and more honest about where behavior really lives.
