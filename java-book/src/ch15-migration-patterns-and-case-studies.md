## Migration Patterns and Case Studies

> **What you'll learn:** How Java teams usually introduce Rust, which patterns translate cleanly, and where direct one-to-one translation is a trap.
>
> **Difficulty:** 🟡 Intermediate

The best Java-to-Rust migration is usually selective, not total. Teams get the highest return by moving the parts that benefit most from native performance, memory control, or stronger correctness guarantees.

## Pattern Mapping

| Java pattern | Rust direction |
|---|---|
| service interface | trait plus concrete implementation |
| builder | builder or configuration struct |
| `Optional<T>` | `Option<T>` |
| exception hierarchy | domain error enum |
| stream pipeline | iterator chain |
| Spring bean wiring | explicit construction and ownership |

## What Translates Cleanly

- DTOs and config types usually map well to Rust structs.
- Validation logic often becomes simpler once null and exception paths are explicit.
- Data transformation code often improves when rewritten as iterator pipelines.

## What Usually Needs Redesign

- inheritance-heavy service layers
- frameworks that rely on reflection and runtime proxies
- dependency injection patterns built around containers instead of explicit ownership
- large exception hierarchies used as ambient control flow

## Case Study 1: Native Helper Library

A Java service keeps its core business logic on the JVM but calls a Rust library for parsing, compression, or protocol processing. This is often the lowest-friction starting point because the Java service boundary remains stable while the hot path moves to native code.

## Case Study 2: Replace a CLI or Background Agent

Command-line tools, migration helpers, log processors, and small background agents are ideal Rust candidates. They benefit from:

- tiny deployment footprint
- predictable memory use
- easy static linking in container-heavy environments

## Case Study 3: Move a Gateway or Edge Component

Teams sometimes rewrite a proxy, rate limiter, or stream processor in Rust while the rest of the platform stays in Java. This works well when tail latency and resource efficiency matter more than framework convenience.

## Migration Rules That Save Pain

1. Move a boundary, not an entire monolith.
2. Pick one success metric up front: latency, memory, startup time, or bug class elimination.
3. Keep serialization formats and contracts stable during the first migration phase.
4. Let Rust own the components that benefit from stronger invariants.
5. Do not translate Java framework patterns blindly; redesign them around traits, enums, and explicit construction.

## A Good First Project

Pick one of these:

- a parser or validator library
- a CLI tool currently written in Java
- a background worker that spends most of its time transforming bytes or JSON
- an edge-facing network component with strict latency goals

That path teaches Cargo, ownership, error handling, testing, and deployment without forcing the whole organization into a risky rewrite.
