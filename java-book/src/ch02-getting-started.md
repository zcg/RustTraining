## Getting Started

> **What you'll learn:** How to install Rust, create the first project, and map the Cargo workflow to what Java developers know from Maven or Gradle.
>
> **Difficulty:** 🟢 Beginner

## Install the Toolchain

Use `rustup` to install Rust and manage toolchains:

```bash
winget install Rustlang.Rustup
rustup default stable
rustc --version
cargo --version
```

The Java analogy is a mix of JDK installer plus SDK manager, except Rust keeps the toolchain story much tighter.

## Create the First Project

```bash
cargo new hello-rust
cd hello-rust
cargo run
```

That single command sequence creates the project, compiles it, and runs it.

## Cargo vs Maven / Gradle

| Task | Java habit | Rust habit |
|---|---|---|
| initialize project | `gradle init` or archetype | `cargo new` |
| compile | `mvn package` or `gradle build` | `cargo build` |
| run tests | `mvn test` or `gradle test` | `cargo test` |
| run app | plugin task | `cargo run` |
| add dependency | edit build file | `cargo add crate_name` |

## First Program

```rust
fn main() {
    println!("Hello, Rust!");
}
```

There is no class wrapper, no `public static void main`, and no object ceremony around the entry point.

## Reading Arguments

```rust
fn main() {
    let args: Vec<String> = std::env::args().collect();
    println!("{args:?}");
}
```

For anything beyond trivial parsing, use `clap`.

## The Three Commands to Memorize

```bash
cargo check
cargo test
cargo run
```

`cargo check` is especially valuable for new Rust developers because it gives fast feedback without producing a final binary.

## Advice

- Install `rust-analyzer` in the editor immediately.
- Prefer `cargo check` during rapid iteration.
- Keep the first project small; ownership is easier to learn on tiny programs.

Once Cargo and the compiler stop feeling foreign, the rest of Rust becomes much easier to approach.
