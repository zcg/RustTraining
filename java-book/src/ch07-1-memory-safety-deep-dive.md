## Memory Safety Deep Dive

> **What you'll learn:** How Rust avoids common memory bugs without a garbage collector and why that changes systems design.
>
> **Difficulty:** 🔴 Advanced

Rust memory safety is not built on runtime object tracing. It is built on ownership rules, borrow checking, lifetimes, and a carefully limited `unsafe` escape hatch.

## What Rust Tries to Prevent

- use-after-free
- double free
- data races
- invalid aliasing
- null dereference in safe code

## Why This Matters for Java Developers

Java protects against many of these problems through the runtime. Rust shifts more responsibility to compile time, which usually means more work during development and fewer surprises in production.

## Stack and Heap

Rust uses both stack and heap, just like Java ultimately does under the hood. The difference is that value layout and ownership are much more visible in user code.

## Safety as a Design Constraint

In Rust, APIs often become cleaner because ownership must be obvious. That pressure frequently removes ambiguous lifetimes, hidden caches, and casual shared mutation.

Memory safety in Rust is not a single feature. It is the result of several smaller rules all pushing in the same direction.
