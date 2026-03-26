## Essential Keywords Reference

> **What you'll learn:** A compact keyword map for Java developers so Rust syntax stops looking alien during the first few chapters.
>
> **Difficulty:** 🟢 Beginner

This chapter is a quick reference, not a replacement for the conceptual chapters.

| Rust keyword | Rough Java analogy | What it usually means |
|---|---|---|
| `let` | local variable declaration | bind a value to a name |
| `mut` | mutable local variable | allow reassignment or mutation |
| `fn` | method or function declaration | define a function |
| `struct` | class or record shell | define a data type with fields |
| `enum` | enum plus sealed hierarchy | tagged union with variants |
| `impl` | method block | attach methods or trait impls |
| `trait` | interface | shared behavior contract |
| `match` | switch expression | exhaustive pattern matching |
| `if let` | guarded destructuring | handle one successful pattern |
| `while let` | loop while match succeeds | consume values until pattern stops matching |
| `pub` | public visibility | expose outside the module |
| `crate` | module or artifact root | current package boundary |
| `use` | import | bring names into scope |
| `mod` | package or nested module | declare a module |
| `ref` | bind by reference in a pattern | avoid moving during pattern matching |
| `move` | capture by value | transfer ownership into closure or thread |
| `async` | async method marker | function returns a future |
| `await` | future completion point | suspend until result is ready |
| `unsafe` | dangerous low-level block | programmer must uphold invariants |
| `where` | generic bounds clause | move trait bounds out of the angle brackets |
| `Self` | current class type | current implementing type |
| `dyn` | interface reference | dynamic dispatch through a trait object |
| `const` | compile-time constant | inlined immutable value |
| `static` | static field | process-wide storage |

## Three Keywords That Need Extra Attention

### `mut`

Mutability is explicit on the binding:

```rust
let x = 1;
let mut y = 2;
y += 1;
```

### `match`

`match` is not just a switch statement. It is a pattern-matching expression and must usually cover every case.

### `move`

Java developers often underestimate `move`. In Rust it matters whenever values enter closures, threads, or async tasks.

Keep this table nearby during the first pass through the book. After a few chapters, most of these keywords become second nature.
