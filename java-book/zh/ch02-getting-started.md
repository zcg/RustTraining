## Getting Started<br><span class="zh-inline">快速开始</span>

> **What you'll learn:** How to install Rust, create the first project, and map the Cargo workflow to what Java developers know from Maven or Gradle.<br><span class="zh-inline">**本章将学习：** 如何安装 Rust、创建第一个项目，以及怎样把 Cargo 工作流和 Java 开发者熟悉的 Maven、Gradle 对上号。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 初级</span>

## Install the Toolchain<br><span class="zh-inline">安装工具链</span>

Use `rustup` to install Rust and manage toolchains:<br><span class="zh-inline">使用 `rustup` 安装 Rust 并管理工具链：</span>

```bash
winget install Rustlang.Rustup
rustup default stable
rustc --version
cargo --version
```

The Java analogy is a mix of JDK installer plus SDK manager, except Rust keeps the toolchain story much tighter.<br><span class="zh-inline">如果拿 Java 类比，这有点像把 JDK 安装器和 SDK 管理器揉到了一起，只是 Rust 的工具链故事要紧凑得多。</span>

## Create the First Project<br><span class="zh-inline">创建第一个项目</span>

```bash
cargo new hello-rust
cd hello-rust
cargo run
```

That single command sequence creates the project, compiles it, and runs it.<br><span class="zh-inline">这一串命令会把项目创建、编译和运行一次性做完。</span>

## Cargo vs Maven / Gradle<br><span class="zh-inline">Cargo 与 Maven / Gradle 对照</span>

| Activity<br><span class="zh-inline">活动</span> | Java habit<br><span class="zh-inline">Java 习惯</span> | Rust habit<br><span class="zh-inline">Rust 习惯</span> |
|---|---|---|
| initialize project<br><span class="zh-inline">初始化项目</span> | `gradle init` or archetype | `cargo new` |
| compile<br><span class="zh-inline">编译</span> | `mvn package` or `gradle build` | `cargo build` |
| run tests<br><span class="zh-inline">运行测试</span> | `mvn test` or `gradle test` | `cargo test` |
| run app<br><span class="zh-inline">运行程序</span> | plugin task | `cargo run` |
| add dependency<br><span class="zh-inline">添加依赖</span> | edit build file | `cargo add crate_name` |

## First Program<br><span class="zh-inline">第一个程序</span>

```rust
fn main() {
    println!("Hello, Rust!");
}
```

There is no class wrapper, no `public static void main`, and no object ceremony around the entry point.<br><span class="zh-inline">这里没有类壳子、没有 `public static void main`，也没有围绕入口点的对象仪式感。</span>

## Reading Arguments<br><span class="zh-inline">读取参数</span>

```rust
fn main() {
    let args: Vec<String> = std::env::args().collect();
    println!("{args:?}");
}
```

For anything beyond trivial parsing, use `clap`.<br><span class="zh-inline">只要参数解析稍微复杂一点，就上 `clap`。</span>

## The Three Commands to Memorize<br><span class="zh-inline">先记住这三个命令</span>

```bash
cargo check
cargo test
cargo run
```

`cargo check` is especially valuable for new Rust developers because it gives fast feedback without producing a final binary.<br><span class="zh-inline">对刚学 Rust 的人来说，`cargo check` 特别值钱，因为它不用真的产出最终二进制，就能给出很快的反馈。</span>

## Advice<br><span class="zh-inline">建议</span>

- Install `rust-analyzer` in the editor immediately.<br><span class="zh-inline">编辑器里第一时间装上 `rust-analyzer`。</span>
- Prefer `cargo check` during rapid iteration.<br><span class="zh-inline">快速迭代阶段优先跑 `cargo check`。</span>
- Keep the first project small; ownership is easier to learn on tiny programs.<br><span class="zh-inline">第一个项目尽量做小，所有权在小程序里更容易学明白。</span>

Once Cargo and the compiler stop feeling foreign, the rest of Rust becomes much easier to approach.<br><span class="zh-inline">只要 Cargo 和编译器不再显得陌生，后面的 Rust 学习难度就会明显往下掉。</span>
