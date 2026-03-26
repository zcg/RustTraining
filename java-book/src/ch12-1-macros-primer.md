## Macros Primer

> **What you'll learn:** Why Rust macros exist, how they differ from Java annotations or code generation, and which macros matter first.
>
> **Difficulty:** 🟡 Intermediate

Macros in Rust are syntax-level generation tools. They are much closer to language extension points than to Java annotations.

## First Macros to Recognize

- `println!`
- `vec!`
- `format!`
- `dbg!`
- `#[derive(...)]`

## Why Java Developers Should Care

In Java, many conveniences come from frameworks, annotation processors, Lombok-style generation, or reflection. Rust often solves the same ergonomics problem earlier in the compilation pipeline through macros.

## Practical Advice

- learn to read macro invocations before learning to write macros
- treat derive macros as the normal entry point
- use `cargo expand` when a macro stops making sense

Macros are powerful, but most day-to-day Rust work only needs comfort with using them, not authoring them.
