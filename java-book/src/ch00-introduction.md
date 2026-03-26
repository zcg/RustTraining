# Rust for Java Programmers

> **AI-driven guide**: Written with GPT-5.4 assistance for experienced Java developers who want to learn Rust with clear conceptual mapping and practical migration advice.

This book is a bridge text. It assumes comfort with Java, Maven or Gradle, the JVM, exceptions, interfaces, streams, and the usual enterprise toolkit. The goal is not to re-teach programming. The goal is to show which instincts transfer cleanly, which ones must change, and how to reach idiomatic Rust without dragging Java habits everywhere.

## Who This Book Is For

- Developers who already write Java for backend services, tooling, data pipelines, or libraries
- Teams evaluating Rust for performance-sensitive or safety-sensitive components
- Readers who want a chapter order that moves from syntax and ownership into async, FFI, and migration strategy

## What You Will Learn

- How Rust differs from Java in memory management, error handling, type modeling, and concurrency
- How to map Java concepts such as interfaces, records, streams, `Optional`, and `CompletableFuture` into Rust equivalents
- How to structure real Rust projects with Cargo, crates, modules, testing, and common ecosystem tools
- How to migrate gradually instead of attempting a reckless full rewrite

## Suggested Reading Order

| Range | Focus | Outcome |
|---|---|---|
| Chapters 1-4 | Motivation, setup, core syntax | Can read and write small Rust programs |
| Chapters 5-7 | Data modeling and ownership | Can explain moves, borrows, and `Option` |
| Chapters 8-10 | Project structure, errors, traits | Can organize multi-file crates and design APIs |
| Chapters 11-14 | Conversions, iterators, async, FFI, testing | Can build realistic services and tools |
| Chapters 15-17 | Migration, tooling, capstone | Can plan a Java-to-Rust adoption path |

## Companion Books In This Repository

- [Rust for C/C++ Programmers](../c-cpp-book/)
- [Rust for C# Programmers](../csharp-book/)
- [Rust for Python Programmers](../python-book/)
- [Async Rust: From Futures to Production](../async-book/)
- [Rust Patterns](../rust-patterns-book/)

## Table of Contents

### Part I — Foundations

- [1. Introduction and Motivation](ch01-introduction-and-motivation.md)
- [2. Getting Started](ch02-getting-started.md)
- [3. Built-in Types and Variables](ch03-built-in-types-and-variables.md)
- [4. Control Flow](ch04-control-flow.md)
- [5. Data Structures and Collections](ch05-data-structures-and-collections.md)
- [6. Enums and Pattern Matching](ch06-enums-and-pattern-matching.md)
- [7. Ownership and Borrowing](ch07-ownership-and-borrowing.md)
- [8. Crates and Modules](ch08-crates-and-modules.md)
- [9. Error Handling](ch09-error-handling.md)
- [10. Traits and Generics](ch10-traits-and-generics.md)
- [10.3 Object-Oriented Thinking in Rust](ch10-3-object-oriented-thinking-in-rust.md)
- [11. From and Into Traits](ch11-from-and-into-traits.md)
- [12. Closures and Iterators](ch12-closures-and-iterators.md)

### Part II — Concurrency and Systems

- [13. Concurrency](ch13-concurrency.md)
- [13.1 Async/Await Deep Dive](ch13-1-asyncawait-deep-dive.md)
- [14. Unsafe Rust and FFI](ch14-unsafe-rust-and-ffi.md)
- [14.1 Testing](ch14-1-testing.md)

### Part III — Migration and Practice

- [15. Migration Patterns and Case Studies](ch15-migration-patterns-and-case-studies.md)
- [15.1 Essential Crates for Java Developers](ch15-1-essential-crates-for-java-developers.md)
- [15.2 Incremental Adoption Strategy](ch15-2-incremental-adoption-strategy.md)
- [15.3 Spring and Spring Boot Migration](ch15-3-spring-and-spring-boot-migration.md)
- [16. Best Practices and Reference](ch16-best-practices.md)
- [16.1 Performance Comparison and Migration](ch16-1-performance-comparison-and-migration.md)
- [16.2 Learning Path and Resources](ch16-2-learning-path-and-resources.md)
- [16.3 Rust Tooling for Java Developers](ch16-3-rust-tooling-ecosystem.md)

### Capstone

- [17. Capstone Project: Migrate a Spring Boot User Service](ch17-capstone-project.md)
