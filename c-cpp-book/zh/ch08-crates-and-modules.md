# Rust crates and modules<br><span class="zh-inline">Rust 的 crate 与模块</span>

> **What you'll learn:** How Rust organizes code with modules and crates, why visibility is private by default, how `pub` works, what workspaces are for, and how the crates.io ecosystem replaces the old C/C++ header plus build-system dependency stack.<br><span class="zh-inline">**本章将学到什么：** Rust 是怎样用模块和 crate 组织代码的，为什么可见性默认是私有，`pub` 到底控制了什么，workspace 有什么用，以及 crates.io 生态如何取代 C/C++ 里那套头文件加构建系统依赖管理的组合拳。</span>

- Modules are the fundamental code organization unit inside a crate.<br><span class="zh-inline">模块是 Rust crate 内部最基础的代码组织单位。</span>
    - Each source file `.rs` is its own module, and nested modules can be introduced with the `mod` keyword.<br><span class="zh-inline">每个 `.rs` 源文件本身就是一个模块，也可以继续用 `mod` 定义子模块。</span>
    - Types and functions inside a module are **private** by default. They are not visible outside that module unless explicitly marked `pub`. Visibility can be narrowed further with forms such as `pub(crate)`.<br><span class="zh-inline">模块里的类型和函数默认都是**私有**的，不显式写 `pub` 就出不了这个模块。`pub` 还可以继续细分成 `pub(crate)` 这类范围更窄的可见性。</span>
    - Even if an item is public, it still does not become automatically available in another module's local scope. It usually needs to be brought in with `use`, and child modules can reach parent items through `super::`.<br><span class="zh-inline">就算某个条目是公开的，也不会自动出现在别的模块局部作用域里。通常还是要配合 `use` 引进来，子模块访问父模块时则经常会看到 `super::`。</span>
    - Source files are not automatically part of the crate unless they are explicitly declared from `main.rs` or `lib.rs`.<br><span class="zh-inline">一个 `.rs` 文件摆在那里，并不意味着它已经进了 crate。要让它真正参与编译，通常还得在 `main.rs` 或 `lib.rs` 里显式声明。</span>

# Exercise: Modules and functions<br><span class="zh-inline">练习：模块与函数</span>

- Let's modify a simple [hello world](https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&gist=522d86dbb8c4af71ff2ec081fb76aee7) so it calls a helper function from another module.<br><span class="zh-inline">先拿最简单的 hello world 开刀，改成从另一个模块里调用函数。</span>
    - Functions are declared with the `fn` keyword. The `->` arrow declares a return value, and here the return type is `u32`.<br><span class="zh-inline">函数用 `fn` 关键字定义。`->` 后面跟的是返回类型，这里例子里是 `u32`。</span>
    - Functions are scoped by module. Two modules can each define a function with the same name without conflict.<br><span class="zh-inline">函数的名字是带模块作用域的，所以两个不同模块里就算有同名函数，也不会直接打架。</span>
        - The same scoping rule applies to types. For example, `struct foo` inside `mod a` and `struct foo` inside `mod b` are two distinct types: `a::foo` and `b::foo`.<br><span class="zh-inline">类型也是一样。`mod a { struct Foo; }` 和 `mod b { struct Foo; }` 里的 `Foo` 在 Rust 看来根本就是两个不同类型。</span>

**Starter code** — complete the functions:<br><span class="zh-inline">**起始代码**：把下面这段补完整。</span>

```rust
mod math {
    // TODO: implement pub fn add(a: u32, b: u32) -> u32
}

fn greet(name: &str) -> String {
    // TODO: return "Hello, <name>! The secret number is <math::add(21,21)>"
    todo!()
}

fn main() {
    println!("{}", greet("Rustacean"));
}
```

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
mod math {
    pub fn add(a: u32, b: u32) -> u32 {
        a + b
    }
}

fn greet(name: &str) -> String {
    format!("Hello, {}! The secret number is {}", name, math::add(21, 21))
}

fn main() {
    println!("{}", greet("Rustacean"));
}
// Output: Hello, Rustacean! The secret number is 42
```

</details>

## Workspaces and crates (packages)<br><span class="zh-inline">workspace 与 crate（包）</span>

- Any non-trivial Rust project should strongly consider using a workspace to organize related crates.<br><span class="zh-inline">只要项目稍微有点规模，基本都应该认真考虑用 workspace 来组织多个 crate。</span>
    - A workspace is simply a collection of local crates that are built together. The root `Cargo.toml` lists the member packages.<br><span class="zh-inline">workspace 本质上就是一组一起构建的本地 crate。根目录下的 `Cargo.toml` 会把成员包列出来。</span>

```toml
[workspace]
resolver = "2"
members = ["package1", "package2"]
```

```text
workspace_root/
|-- Cargo.toml      # Workspace configuration
|-- package1/
|   |-- Cargo.toml  # Package 1 configuration
|   `-- src/
|       `-- lib.rs  # Package 1 source code
|-- package2/
|   |-- Cargo.toml  # Package 2 configuration
|   `-- src/
|       `-- main.rs # Package 2 source code
```

---

## Exercise: Using workspaces and package dependencies<br><span class="zh-inline">练习：使用 workspace 和包依赖</span>

- We will create a simple workspace and make one package depend on another.<br><span class="zh-inline">下面动手建一个最小 workspace，再让其中一个包依赖另一个包。</span>
- Create the workspace directory.<br><span class="zh-inline">先创建 workspace 目录。</span>

```bash
mkdir workspace
cd workspace
```

- Create `Cargo.toml` at the root and initialize an empty workspace.<br><span class="zh-inline">然后在根目录创建 `Cargo.toml`，先把空 workspace 搭起来。</span>

```toml
[workspace]
resolver = "2"
members = []
```

- Add the packages. The `--lib` flag creates a library crate instead of a binary crate.<br><span class="zh-inline">再加两个包。`--lib` 的意思是建一个库 crate，而不是可执行程序 crate。</span>

```bash
cargo new hello
cargo new --lib hellolib
```

## Exercise: Using workspaces and package dependencies<br><span class="zh-inline">练习继续：把包连起来</span>

- Inspect the generated `Cargo.toml` files in `hello` and `hellolib`. Notice that both of them now participate in the upper-level workspace.<br><span class="zh-inline">看看 `hello` 和 `hellolib` 里生成出来的 `Cargo.toml`，会发现它们已经被纳入上层 workspace 了。</span>
- The presence of `lib.rs` in `hellolib` indicates a library package. See the Cargo targets reference if customization is needed later.<br><span class="zh-inline">`hellolib` 里有 `lib.rs`，这就意味着它是个库包。以后如果要玩更复杂的目标配置，可以再去查 Cargo targets 文档。</span>
- Add a dependency on `hellolib` in `hello/Cargo.toml`.<br><span class="zh-inline">接着在 `hello` 的 `Cargo.toml` 里把 `hellolib` 作为本地依赖加进去。</span>

```toml
[dependencies]
hellolib = {path = "../hellolib"}
```

- Use `add()` from `hellolib`.<br><span class="zh-inline">然后在 `hello` 里调用 `hellolib::add()`。</span>

```rust
fn main() {
    println!("Hello, world! {}", hellolib::add(21, 21));
}
```

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

The complete workspace setup:<br><span class="zh-inline">完整的 workspace 配置如下：</span>

```bash
# Terminal commands
mkdir workspace && cd workspace

# Create workspace Cargo.toml
cat > Cargo.toml << 'EOF'
[workspace]
resolver = "2"
members = ["hello", "hellolib"]
EOF

cargo new hello
cargo new --lib hellolib
```

```toml
# hello/Cargo.toml — add dependency
[dependencies]
hellolib = {path = "../hellolib"}
```

```rust
// hellolib/src/lib.rs — already has add() from cargo new --lib
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}
```

```rust,ignore
// hello/src/main.rs
fn main() {
    println!("Hello, world! {}", hellolib::add(21, 21));
}
// Output: Hello, world! 42
```

</details>

# Using community crates from crates.io<br><span class="zh-inline">使用 crates.io 上的社区 crate</span>

- Rust has a very active ecosystem of community crates. See https://crates.io/.<br><span class="zh-inline">Rust 的社区 crate 生态非常活跃，核心入口就是 https://crates.io/。</span>
    - A common Rust philosophy is to keep the standard library relatively compact and move lots of functionality into external crates.<br><span class="zh-inline">Rust 的一条重要思路就是：标准库保持相对紧凑，更多功能交给社区 crate 去扩展。</span>
    - There is no absolute rule for whether a community crate should be used, but the usual checks are maturity, version history, and whether maintenance still looks active.<br><span class="zh-inline">要不要引入某个社区 crate，没有死规矩。通常先看成熟度、版本演进和维护活跃度，拿不准时再去问项目里更熟这块的人。</span>
- Every crate on crates.io carries semantic version information.<br><span class="zh-inline">每个 crate 都会带语义化版本信息。</span>
    - Crates are expected to follow Cargo's SemVer guidelines: https://doc.rust-lang.org/cargo/reference/semver.html<br><span class="zh-inline">Cargo 对 SemVer 的约定可以看官方文档。</span>
    - The simple summary is that within a compatible version range, breaking changes should not suddenly出现。<br><span class="zh-inline">简单说，同一兼容区间里不应该突然塞进破坏性改动。</span>

# Crate dependencies and SemVer<br><span class="zh-inline">crate 依赖与语义化版本</span>

- Dependencies can be pinned tightly, loosened to a version range, or left very open. The following `Cargo.toml` snippets demonstrate several ways to depend on the `rand` crate.<br><span class="zh-inline">依赖版本既可以卡得很死，也可以只约束一个兼容区间，还可以几乎不管。下面用 `rand` 举几个例子。</span>

- At least `0.10.0`, but anything `< 0.11.0` is acceptable.<br><span class="zh-inline">至少是 `0.10.0`，但小于 `0.11.0` 的兼容版本都可以。</span>

```toml
[dependencies]
rand = { version = "0.10.0"}
```

- Exactly `0.10.0`, and nothing else.<br><span class="zh-inline">只接受 `0.10.0`，一丁点都不放宽。</span>

```toml
[dependencies]
rand = { version = "=0.10.0"}
```

- “I don't care, pick the newest one.”<br><span class="zh-inline">“无所谓，给我挑最新的。”</span>

```toml
[dependencies]
rand = { version = "*"}
```

- Reference: https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html<br><span class="zh-inline">更完整的依赖写法可以看官方文档。</span>

----

# Exercise: Using the `rand` crate<br><span class="zh-inline">练习：使用 `rand` crate</span>

- Modify the hello world example so it prints random values.<br><span class="zh-inline">把 hello world 例子改成打印随机值。</span>
- Use `cargo add rand` to add the dependency.<br><span class="zh-inline">先用 `cargo add rand` 加依赖。</span>
- Use `https://docs.rs/rand/latest/rand/` as the API reference.<br><span class="zh-inline">API 文档参考 `https://docs.rs/rand/latest/rand/`。</span>

**Starter code** — add this to `main.rs` after running `cargo add rand`:<br><span class="zh-inline">**起始代码**：执行完 `cargo add rand` 之后，把下面内容放进 `main.rs`。</span>

```rust,ignore
use rand::RngExt;

fn main() {
    let mut rng = rand::rng();
    // TODO: Generate and print a random u32 in 1..=100
    // TODO: Generate and print a random bool
    // TODO: Generate and print a random f64
}
```

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
use rand::RngExt;

fn main() {
    let mut rng = rand::rng();
    let n: u32 = rng.random_range(1..=100);
    println!("Random number (1-100): {n}");

    // Generate a random boolean
    let b: bool = rng.random();
    println!("Random bool: {b}");

    // Generate a random float between 0.0 and 1.0
    let f: f64 = rng.random();
    println!("Random float: {f:.4}");
}
```

</details>

# `Cargo.toml` and `Cargo.lock`<br><span class="zh-inline">`Cargo.toml` 与 `Cargo.lock`</span>

- As mentioned earlier, `Cargo.lock` is generated automatically based on `Cargo.toml`.<br><span class="zh-inline">前面提过，`Cargo.lock` 是根据 `Cargo.toml` 自动生成出来的。</span>
    - Its main purpose is reproducible builds. For example, if `Cargo.toml` only says `0.10.0`, Cargo is allowed to pick any compatible version below `0.11.0`.<br><span class="zh-inline">它的核心价值是保证构建可复现。比如 `Cargo.toml` 只写了 `0.10.0`，那 Cargo 实际可以在兼容区间里选具体版本。</span>
    - `Cargo.lock` records the exact version that was selected during the build.<br><span class="zh-inline">`Cargo.lock` 会把最终选中的精确版本记下来。</span>
    - The usual recommendation is to commit `Cargo.lock` into the repository so everyone builds against the same dependency graph.<br><span class="zh-inline">通常建议把 `Cargo.lock` 一起提交进仓库，这样大家拉下来之后用的是同一套依赖图。</span>

## `cargo test` feature<br><span class="zh-inline">`cargo test` 与测试模块</span>

- Rust unit tests usually live in the same source file as the code, grouped by convention inside a test-only module.<br><span class="zh-inline">Rust 单元测试通常就写在源文件里，按约定放进一个只在测试时启用的模块里。</span>
    - Test code is not included in the production binary. This is powered by the `cfg` feature, which is also used for platform-specific code such as Linux vs Windows differences.<br><span class="zh-inline">测试代码不会混进正式二进制里，这靠的就是 `cfg` 条件编译机制。平台差异代码，比如 Linux 和 Windows 分支，也经常用它处理。</span>
    - Tests can be run with `cargo test`.<br><span class="zh-inline">执行测试就直接用 `cargo test`。</span>

```rust
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}
// Will be included only during testing
#[cfg(test)]
mod tests {
    use super::*; // This makes all types in the parent scope visible
    #[test]
    fn it_works() {
        let result = add(2, 2); // Alternatively, super::add(2, 2);
        assert_eq!(result, 4);
    }
}
```

# Other Cargo features<br><span class="zh-inline">Cargo 的其他常用能力</span>

- Cargo also has several other very useful tools built in or tightly integrated.<br><span class="zh-inline">Cargo 不只是管编译和依赖，它还把一堆日常工具都串起来了。</span>
    - `cargo clippy` is Rust's linting workhorse. Warnings should usually be fixed rather than ignored.<br><span class="zh-inline">`cargo clippy` 是最常用的 Rust lint 工具。大多数警告都应该处理掉，而不是假装没看见。</span>
    - `cargo format` runs `rustfmt` and standardizes formatting.<br><span class="zh-inline">`cargo format` 会调用 `rustfmt`，统一代码格式，省掉样式争论。</span>
    - `cargo doc` generates documentation from `///` comments, and that is how docs for crates.io packages are commonly built.<br><span class="zh-inline">`cargo doc` 可以根据 `///` 文档注释生成文档，crates.io 上大部分 crate 的文档就是这么来的。</span>

### Build Profiles: Controlling Optimization<br><span class="zh-inline">构建 profile：控制优化方式</span>

In C, people pass flags like `-O0`、`-O2`、`-Os`、`-flto` to `gcc` or `clang`. In Rust, the equivalent knobs live under build profiles in `Cargo.toml`.<br><span class="zh-inline">C 里习惯在命令行里堆 `-O0`、`-O2`、`-Os`、`-flto` 这些选项；Rust 则把这类配置主要放在 `Cargo.toml` 的 profile 里。</span>

```toml
# Cargo.toml — build profile configuration

[profile.dev]
opt-level = 0          # No optimization (fast compile, like -O0)
debug = true           # Full debug symbols (like -g)

[profile.release]
opt-level = 3          # Maximum optimization (like -O3)
lto = "fat"            # Link-Time Optimization (like -flto)
strip = true           # Strip symbols (like the strip command)
codegen-units = 1      # Single codegen unit — slower compile, better optimization
panic = "abort"        # No unwind tables (smaller binary)
```

| C/GCC Flag | Cargo.toml Key | Values |
|------------|---------------|--------|
| `-O0` / `-O2` / `-O3` | `opt-level` | `0`, `1`, `2`, `3`, `"s"`, `"z"` |
| `-flto` | `lto` | `false`, `"thin"`, `"fat"` |
| `-g` / no `-g` | `debug` | `true`, `false`, `"line-tables-only"` |
| `strip` command | `strip` | `"none"`, `"debuginfo"`, `"symbols"`, `true`/`false` |
| — | `codegen-units` | `1` means best optimization, slowest compile<br><span class="zh-inline">`1` 通常最利于优化，但编译也最慢</span> |

```bash
cargo build              # Uses [profile.dev]
cargo build --release    # Uses [profile.release]
```

### Build Scripts (`build.rs`): Linking C Libraries<br><span class="zh-inline">构建脚本 `build.rs`：链接 C 库</span>

In C projects, Makefiles or CMake are usually responsible for linking libraries and running code generation. Rust crates can embed that setup in a `build.rs` script.<br><span class="zh-inline">C 项目里，这类事情一般交给 Makefile 或 CMake。Rust 则允许在 crate 根目录放一个 `build.rs`，把这部分逻辑收进来。</span>

```rust
// build.rs — runs before compiling the crate

fn main() {
    // Link a system C library (like -lbmc_ipmi in gcc)
    println!("cargo::rustc-link-lib=bmc_ipmi");

    // Where to find the library (like -L/usr/lib/bmc)
    println!("cargo::rustc-link-search=/usr/lib/bmc");

    // Re-run if the C header changes
    println!("cargo::rerun-if-changed=wrapper.h");
}
```

You can even compile C source files directly from the Rust crate by using the `cc` build dependency.<br><span class="zh-inline">如果需要，Rust crate 还能直接在构建阶段把 C 源文件一起编进去。</span>

```toml
# Cargo.toml
[build-dependencies]
cc = "1"  # C compiler integration
```

```rust
// build.rs
fn main() {
    cc::Build::new()
        .file("src/c_helpers/ipmi_raw.c")
        .include("/usr/include/bmc")
        .compile("ipmi_raw");   // Produces libipmi_raw.a, linked automatically
    println!("cargo::rerun-if-changed=src/c_helpers/ipmi_raw.c");
}
```

| C / Make / CMake | Rust `build.rs` |
|-----------------|-----------------|
| `-lfoo` | `println!("cargo::rustc-link-lib=foo")` |
| `-L/path` | `println!("cargo::rustc-link-search=/path")` |
| Compile C source | `cc::Build::new().file("foo.c").compile("foo")` |
| Generate code | Write files to `$OUT_DIR`, then `include!()` |

### Cross-compilation<br><span class="zh-inline">交叉编译</span>

In C, cross-compilation usually means installing a separate compiler toolchain and then wiring it into Make or CMake. In Rust, the target and the linker are configured a bit differently.<br><span class="zh-inline">C 里交叉编译通常得另装一套编译器，再去改 Makefile 或 CMake。Rust 的方式会统一一些，但思路仍然差不多：目标三元组加外部 linker。</span>

```bash
# Install a cross-compilation target
rustup target add aarch64-unknown-linux-gnu

# Cross-compile
cargo build --target aarch64-unknown-linux-gnu --release
```

Specify the linker in `.cargo/config.toml`:<br><span class="zh-inline">linker 则放在 `.cargo/config.toml` 里配置。</span>

```toml
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
```

| C Cross-Compile | Rust Equivalent |
|-----------------|-----------------|
| `apt install gcc-aarch64-linux-gnu` | `rustup target add aarch64-unknown-linux-gnu` + install the linker |
| `CC=aarch64-linux-gnu-gcc make` | `.cargo/config.toml` with `[target.X] linker = "..."` |
| `#ifdef __aarch64__` | `#[cfg(target_arch = "aarch64")]` |
| Separate Makefile targets | `cargo build --target ...` |

### Feature Flags: Conditional Compilation<br><span class="zh-inline">feature flag：条件编译</span>

C code often relies on `#ifdef` and `-DFOO`. Rust expresses the same class of conditional compilation with feature flags declared in `Cargo.toml`.<br><span class="zh-inline">C 里常用 `#ifdef` 和 `-DDEBUG` 这类写法做条件编译；Rust 则用 `Cargo.toml` 里的 feature flag 来表达同样思路。</span>

```toml
# Cargo.toml
[features]
default = ["json"]         # Enabled by default
json = ["dep:serde_json"]  # Optional dependency
verbose = []               # Flag with no dependency
gpu = ["dep:cuda-sys"]     # Optional GPU support
```

```rust
// Code gated on features:
#[cfg(feature = "json")]
pub fn parse_config(data: &str) -> Result<Config, Error> {
    serde_json::from_str(data).map_err(Error::from)
}

#[cfg(feature = "verbose")]
macro_rules! verbose {
    ($($arg:tt)*) => { eprintln!("[VERBOSE] {}", format!($($arg)*)); }
}
#[cfg(not(feature = "verbose"))]
macro_rules! verbose {
    ($($arg:tt)*) => {}; // Compiles to nothing
}
```

| C Preprocessor | Rust Feature Flags |
|---------------|-------------------|
| `gcc -DDEBUG` | `cargo build --features verbose` |
| `#ifdef DEBUG` | `#[cfg(feature = "verbose")]` |
| `#define MAX 100` | `const MAX: u32 = 100;` |
| `#ifdef __linux__` | `#[cfg(target_os = "linux")]` |

### Integration tests vs unit tests<br><span class="zh-inline">集成测试与单元测试</span>

Unit tests live next to the implementation, but integration tests live under `tests/` and can only see the crate's public API.<br><span class="zh-inline">单元测试通常和实现写在一起；集成测试则放在 `tests/` 目录下，而且只能通过 crate 的公开 API 来测试。</span>

```rust
// tests/smoke_test.rs — no #[cfg(test)] needed
use my_crate::parse_config;

#[test]
fn parse_valid_config() {
    let config = parse_config("test_data/valid.json").unwrap();
    assert_eq!(config.max_retries, 5);
}
```

| Aspect | Unit Tests (`#[cfg(test)]`) | Integration Tests (`tests/`) |
|--------|----------------------------|------------------------------|
| Location | Same file as implementation<br><span class="zh-inline">和实现写在同一个文件</span> | Separate `tests/` directory<br><span class="zh-inline">单独放在 `tests/` 目录</span> |
| Access | Private + public items<br><span class="zh-inline">私有和公开内容都能碰</span> | **Public API only**<br><span class="zh-inline">只能碰公开 API</span> |
| Run command | `cargo test` | `cargo test --test smoke_test` |

### Testing patterns and strategies<br><span class="zh-inline">测试模式与策略</span>

C firmware teams often rely on CUnit, CMocka, or a pile of custom boilerplate. Rust's built-in test harness is more capable out of the box, and traits make mocking much cleaner.<br><span class="zh-inline">很多 C 固件团队会用 CUnit、CMocka，或者自己堆一套测试样板。Rust 自带的测试框架已经很够用，再加上 trait 的帮助，mock 也会自然很多。</span>

#### `#[should_panic]` — testing expected failures<br><span class="zh-inline">`#[should_panic]`：测试“预期会炸”的情况</span>

```rust
// Test that certain conditions cause panics (like C's assert failures)
#[test]
#[should_panic(expected = "index out of bounds")]
fn test_bounds_check() {
    let v = vec![1, 2, 3];
    let _ = v[10];  // Should panic
}

#[test]
#[should_panic(expected = "temperature exceeds safe limit")]
fn test_thermal_shutdown() {
    fn check_temperature(celsius: f64) {
        if celsius > 105.0 {
            panic!("temperature exceeds safe limit: {celsius}°C");
        }
    }
    check_temperature(110.0);
}
```

#### `#[ignore]` — slow or hardware-dependent tests<br><span class="zh-inline">`#[ignore]`：慢测试或依赖特定硬件的测试</span>

```rust
// Mark tests that require special conditions (like C's #ifdef HARDWARE_TEST)
#[test]
#[ignore = "requires GPU hardware"]
fn test_gpu_ecc_scrub() {
    // This test only runs on machines with GPUs
    // Run with: cargo test -- --ignored
    // Run with: cargo test -- --include-ignored  (runs ALL tests)
}
```

#### Result-returning tests<br><span class="zh-inline">返回 `Result` 的测试函数</span>

```rust
// Instead of many unwrap() calls that hide the actual failure:
#[test]
fn test_config_parsing() -> Result<(), Box<dyn std::error::Error>> {
    let json = r#"{"hostname": "node-01", "port": 8080}"#;
    let config: ServerConfig = serde_json::from_str(json)?;  // ? instead of unwrap()
    assert_eq!(config.hostname, "node-01");
    assert_eq!(config.port, 8080);
    Ok(())  // Test passes if we reach here without error
}
```

This style often produces clearer failure information than stacking `unwrap()` everywhere.<br><span class="zh-inline">这种写法通常比一连串 `unwrap()` 更清楚，失败时也更容易看出究竟是哪一步出问题。</span>

#### Test fixtures with builder functions<br><span class="zh-inline">用辅助构造函数做测试夹具</span>

```rust
struct TestFixture {
    temp_dir: std::path::PathBuf,
    config: Config,
}

impl TestFixture {
    fn new() -> Self {
        let temp_dir = std::env::temp_dir().join(format!("test_{}", std::process::id()));
        std::fs::create_dir_all(&temp_dir).unwrap();
        let config = Config {
            log_dir: temp_dir.clone(),
            max_retries: 3,
            ..Default::default()
        };
        Self { temp_dir, config }
    }
}

impl Drop for TestFixture {
    fn drop(&mut self) {
        // Automatic cleanup — like C's tearDown() but can't be forgotten
        let _ = std::fs::remove_dir_all(&self.temp_dir);
    }
}

#[test]
fn test_with_fixture() {
    let fixture = TestFixture::new();
    // Use fixture.config, fixture.temp_dir...
    assert!(fixture.temp_dir.exists());
    // fixture is automatically dropped here → cleanup runs
}
```

This pattern replaces the old `setUp()` / `tearDown()` style with regular Rust values plus `Drop` cleanup.<br><span class="zh-inline">这种方式本质上就是把 C 世界那种 `setUp()` / `tearDown()` 流程，换成了“构造一个值，结束时自动清理”的 Rust 风格。</span>

#### Mocking traits for hardware interfaces<br><span class="zh-inline">为硬件接口做 trait mock</span>

In C, mocking hardware often means function-pointer swapping or preprocessor tricks. In Rust, traits make dependency injection much more natural.<br><span class="zh-inline">C 里做硬件 mock 往往要靠函数指针替换或者预处理器戏法，Rust 则直接用 trait 做依赖注入，结构干净得多。</span>

```rust
// Production trait for IPMI communication
trait IpmiTransport {
    fn send_command(&self, cmd: u8, data: &[u8]) -> Result<Vec<u8>, String>;
}

// Real implementation (used in production)
struct RealIpmi { /* BMC connection details */ }
impl IpmiTransport for RealIpmi {
    fn send_command(&self, cmd: u8, data: &[u8]) -> Result<Vec<u8>, String> {
        // Actually talks to BMC hardware
        todo!("Real IPMI call")
    }
}

// Mock implementation (used in tests)
struct MockIpmi {
    responses: std::collections::HashMap<u8, Vec<u8>>,
}
impl IpmiTransport for MockIpmi {
    fn send_command(&self, cmd: u8, _data: &[u8]) -> Result<Vec<u8>, String> {
        self.responses.get(&cmd)
            .cloned()
            .ok_or_else(|| format!("No mock response for cmd 0x{cmd:02x}"))
    }
}

// Generic function that works with both real and mock
fn read_sensor_temperature(transport: &dyn IpmiTransport) -> Result<f64, String> {
    let response = transport.send_command(0x2D, &[])?;
    if response.len() < 2 {
        return Err("Response too short".into());
    }
    Ok(response[0] as f64 + (response[1] as f64 / 256.0))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_temperature_reading() {
        let mut mock = MockIpmi { responses: std::collections::HashMap::new() };
        mock.responses.insert(0x2D, vec![72, 128]); // 72.5°C

        let temp = read_sensor_temperature(&mock).unwrap();
        assert!((temp - 72.5).abs() < 0.01);
    }

    #[test]
    fn test_short_response() {
        let mock = MockIpmi { responses: std::collections::HashMap::new() };
        // No response configured → error
        assert!(read_sensor_temperature(&mock).is_err());
    }
}
```

#### Property-based testing with `proptest`<br><span class="zh-inline">用 `proptest` 做性质测试</span>

Instead of only testing a handful of fixed values, property-based testing checks invariants across many generated inputs.<br><span class="zh-inline">性质测试的思路不是只测几个固定样本，而是定义“某个性质应该永远成立”，再让工具自动生成大量输入去冲它。</span>

```rust
// Cargo.toml: [dev-dependencies] proptest = "1"
use proptest::prelude::*;

fn parse_sensor_id(s: &str) -> Option<u32> {
    s.strip_prefix("sensor_")?.parse().ok()
}

fn format_sensor_id(id: u32) -> String {
    format!("sensor_{id}")
}

proptest! {
    #[test]
    fn roundtrip_sensor_id(id in 0u32..10000) {
        // Property: format then parse should give back the original
        let formatted = format_sensor_id(id);
        let parsed = parse_sensor_id(&formatted);
        prop_assert_eq!(parsed, Some(id));
    }

    #[test]
    fn parse_rejects_garbage(s in "[^s].*") {
        // Property: strings not starting with 's' should never parse
        let result = parse_sensor_id(&s);
        prop_assert!(result.is_none());
    }
}
```

#### C vs Rust testing comparison<br><span class="zh-inline">C 测试方式与 Rust 测试方式对照</span>

| C Testing | Rust Equivalent |
|-----------|----------------|
| `CUnit`, `CMocka`, custom framework | Built-in `#[test]` + `cargo test` |
| `setUp()` / `tearDown()` | Builder helper + `Drop` cleanup |
| `#ifdef TEST` mock functions | Trait-based dependency injection |
| `assert(x == y)` | `assert_eq!(x, y)` with better diff output |
| Separate test executable | Same crate with conditional compilation |
| `valgrind --leak-check=full ./test` | `cargo test` plus tools like `cargo miri test` |
| Code coverage via `gcov` / `lcov` | `cargo tarpaulin` or `cargo llvm-cov` |
| Manual test registration | Any `#[test]` function is auto-discovered |
