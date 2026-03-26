## Ownership and Borrowing

> **What you'll learn:** The core Rust model that replaces GC-managed shared references with explicit ownership, borrowing, and moves.
>
> **Difficulty:** 🟡 Intermediate

This chapter is the real dividing line between “Rust syntax” and “Rust thinking.”

## Ownership in One Sentence

Every value has an owner, and when that owner goes out of scope, the value is dropped.

## Moves

```rust
let a = String::from("hello");
let b = a;
// a is no longer usable here
```

For Java developers, this is the first major shock. Assignment is not always “another reference to the same object.” Sometimes it is ownership transfer.

## Borrowing

```rust
fn print_name(name: &str) {
    println!("{name}");
}
```

Borrowing lets code read a value without taking ownership.

## Mutable Borrowing

```rust
fn append_world(text: &mut String) {
    text.push_str(" world");
}
```

Rust allows mutation through a borrowed path, but only under rules that prevent conflicting access.

## The Important Rule

At a given moment, you may have:

- many immutable references
- or one mutable reference

That rule prevents a large class of race conditions and aliasing bugs.

## Why Java Developers Struggle Here

Java normalizes free movement of references. Rust distinguishes very sharply between:

- owning a value
- borrowing it immutably
- borrowing it mutably

Once that distinction becomes intuitive, the compiler stops feeling hostile.
