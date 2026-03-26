## Learning Path and Next Steps

> **What you'll learn:** A structured Rust learning plan tailored for experienced Java developers, the concept pairs that matter most during migration, and a resource stack that supports moving from language study to real service work.
>
> **Difficulty:** 🟢 Beginner

The fastest way for an experienced Java developer to learn Rust is not to start from zero. The better method is to map familiar Java concepts to Rust concepts in the right order.

## The Six Concept Pairs That Matter Most

| Java habit | Rust replacement | Why this comes first |
|---|---|---|
| `null` and `Optional<T>` | `Option<T>` | teaches explicit absence |
| exceptions | `Result<T, E>` | changes control flow and API design |
| mutable object references | ownership and borrowing | core mental model shift |
| interfaces | traits | changes abstraction style |
| class hierarchies | `struct` + `enum` + composition | changes domain modeling |
| Spring container wiring | explicit state and constructors | changes service architecture |

If these six pairs feel natural, the rest of the language becomes much easier.

## An 8-Week Learning Plan for Java Engineers

### Weeks 1-2: Ownership, Borrowing, and Basic Types

Focus:

- `String` vs `&str`
- move vs borrow
- `Option<T>` and `Result<T, E>`
- simple `struct` and `impl`

Suggested practice:

- port a small Java file-processing utility
- write functions that accept borrowed input
- convert a null-heavy Java method into `Option`

### Weeks 3-4: Enums, Traits, and Collections

Focus:

- `enum` and `match`
- traits as interface-like behavior
- `Vec`, `HashMap`, iterators
- crate and module layout

Suggested practice:

- rewrite a small sealed hierarchy as a Rust `enum`
- replace a Java stream pipeline with iterator chains
- model domain validation with `TryFrom`

### Weeks 5-6: Errors, Async, and I/O Boundaries

Focus:

- crate-level error enums
- `thiserror` and `anyhow`
- `tokio`, async functions, and HTTP clients
- serialization with `serde`

Suggested practice:

- build a small JSON importer
- call an external API with `reqwest`
- return typed errors from a service module

### Weeks 7-8: Service Architecture and Migration Work

Focus:

- `axum` or `actix-web`
- configuration
- tracing and metrics
- repository/service/handler boundaries

Suggested practice:

- build one CRUD endpoint
- map errors to HTTP responses
- add integration tests
- compare it to an existing Spring Boot endpoint

## Suggested Project Ladder

Each project should feel slightly more like real Java production work.

1. log or CSV transformation tool
2. JSON validation and enrichment job
3. external API client with retries
4. small HTTP service with one read endpoint
5. Spring Boot endpoint migration with persistence

This ladder matters because jumping straight to async web services before understanding ownership often leads to confusion that has nothing to do with web development.

## Resource Stack

### Core Language

- **The Rust Programming Language**: the canonical entry point for ownership, traits, enums, and modules
- **Rust by Example**: small, runnable examples that help reinforce syntax
- **Rustlings**: hands-on drills for early muscle memory

### Service and Ecosystem

- `serde` documentation for JSON modeling
- `tokio` tutorial for async runtime basics
- `axum` guide for request extraction, routing, and state
- `sqlx` docs for explicit SQL-driven persistence

### Reference Habits

Java developers often over-rely on blog posts. In Rust, official docs and crate documentation are unusually good. Spending time in `docs.rs` pays off quickly.

## Common Learning Traps for Java Developers

### Trap 1: Treating the Borrow Checker as a Bug

The borrow checker is the language telling the truth about aliasing and mutation. Fighting it with random `clone()` calls usually hides the lesson rather than solving the design issue.

### Trap 2: Recreating Inheritance Everywhere

If a design uses traits for every closed set of cases, it often means `enum` should have been introduced earlier.

### Trap 3: Learning Async Before Learning Ownership

Async Rust is easier when moves, borrows, and error propagation already feel normal. Otherwise every compiler message looks unrelated and overwhelming.

### Trap 4: Copying Spring Structure Blindly

A Rust service can have handlers, services, and repositories, but it should not imitate bean configuration, proxies, and annotation-heavy lifecycle rules unless there is a strong reason.

## What to Read in Parallel with Practice

Pair each concept with a small exercise:

- `Option` and `Result` with CLI parsing
- `enum` and `match` with workflow modeling
- traits with small formatting or repository abstractions
- `tokio` with a small HTTP client
- `axum` with one migrated endpoint

This combination is more effective than reading chapters in isolation.

## A Good Weekly Study Rhythm

For working Java engineers, a sustainable weekly rhythm looks like this:

- 2 short reading sessions
- 2 coding sessions on small examples
- 1 review session reading other Rust code
- 1 session converting an existing Java pattern into Rust

Consistency beats marathon study sessions.

## Final Milestone

A reasonable "ready for real migration work" milestone is this:

- can model domain states with `enum`
- can explain ownership and borrowing clearly
- can define crate-level error types
- can build a small HTTP service with shared state
- can compare a Spring Boot endpoint with its Rust equivalent

At that point, learning stops being purely academic and becomes engineering work.

---

## Exercises

<details>
<summary><strong>🏋️ Exercise: Build a Java-to-Rust Study Plan</strong> (click to expand)</summary>

Create a four-week plan for a Java team that already knows:

- Spring Boot
- JPA
- REST APIs
- Maven or Gradle

The plan should include:

1. one concept focus per week
2. one practice project per week
3. one "migration concept pair" per week
4. one clear checkpoint proving the team is ready to move on

</details>
