## Crates and Modules

> **What you'll learn:** How Rust code organization maps to Java packages, modules, and artifacts.
>
> **Difficulty:** 🟢 Beginner

Rust organizes code around crates and modules rather than packages and classpaths.

## Mental Mapping

| Java idea | Rust idea |
|---|---|
| artifact or module | crate |
| package | module tree |
| package-private or public API | module privacy plus `pub` |

## Basic Layout

```text
src/
├── main.rs
├── lib.rs
├── api.rs
└── model/
    └── user.rs
```

## Visibility

- items are private by default
- `pub` exposes an item more broadly
- `pub(crate)` exposes within the current crate

This default privacy is stricter than typical Java codebases and often leads to cleaner boundaries.

## Guidance

- keep module trees shallow at first
- design crate boundaries around ownership of concepts, not around arbitrary layering
- expose a small public API and keep the rest internal

Crates and modules are simpler than many Java build layouts, but they reward deliberate boundary design.
