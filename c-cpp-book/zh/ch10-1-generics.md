# Rust generics<br><span class="zh-inline">Rust 泛型</span>

> **What you'll learn:** Generic type parameters, monomorphization (zero-cost generics), trait bounds, and how Rust generics compare to C++ templates — with better error messages and no SFINAE.<br><span class="zh-inline">**本章将学到什么：** 泛型类型参数是什么，单态化也就是零成本泛型怎么工作，trait bound 如何约束泛型，以及 Rust 泛型和 C++ 模板相比到底强在哪，尤其是错误信息和可读性这一块。</span>

- Generics allow the same algorithm or data structure to be reused across data types<br><span class="zh-inline">泛型允许同一套算法或数据结构在不同数据类型上复用。</span>
    - The generic parameter appears as an identifer within `<>`, e.g.: `<T>`. The parameter can have any legal identifier name, but is typically kept short for brevity<br><span class="zh-inline">泛型参数会写在 `<>` 里，例如 `<T>`。理论上名字可以随便起，只要是合法标识符；不过惯例上会保持简短。</span>
    - The compiler performs monomorphization at compile time, i.e., it generates a new type for every variation of `T` that is encountered<br><span class="zh-inline">编译器会在编译期做单态化，也就是针对每一种实际出现的 `T` 都生成对应版本的实现。</span>

```rust
// Returns a tuple of type <T> composed of left and right of type <T>
fn pick<T>(x: u32, left: T, right: T) -> (T, T) {
   if x == 42 {
    (left, right) 
   } else {
    (right, left)
   }
}
fn main() {
    let a = pick(42, true, false);
    let b = pick(42, "hello", "world");
    println!("{a:?}, {b:?}");
}
```

对 C++ 开发者来说，这里最容易类比的是模板。但 Rust 泛型和模板虽然神似，脾气可差不少。Rust 会更明确地告诉“这里需要什么能力”，也更少出现那种模板炸开之后报错像天书的场面。<br><span class="zh-inline">单态化带来的结果则类似：最终生成的代码是具体类型版本，不是运行时再绕一层动态分发，所以依然能保持零成本抽象。</span>

# Generics on data types and methods<br><span class="zh-inline">把泛型用在数据类型和方法上</span>

- Generics can also be applied to data types and associated methods. It is possible to specialize the implementation for a specific `<T>` (example: `f32` vs. `u32`)<br><span class="zh-inline">泛型不只用在函数上，也能用在数据类型和关联方法上。必要时还可以为某个特定类型参数单独写专门实现，例如 `f32` 和 `u32` 走不同逻辑。</span>

```rust
#[derive(Debug)] // We will discuss this later
struct Point<T> {
    x : T,
    y : T,
}
impl<T> Point<T> {
    fn new(x: T, y: T) -> Self {
        Point {x, y}
    }
    fn set_x(&mut self, x: T) {
         self.x = x;       
    }
    fn set_y(&mut self, y: T) {
         self.y = y;       
    }
}
impl Point<f32> {
    fn is_secret(&self) -> bool {
        self.x == 42.0
    }    
}
fn main() {
    let mut p = Point::new(2, 4); // i32
    let q = Point::new(2.0, 4.0); // f32
    p.set_x(42);
    p.set_y(43);
    println!("{p:?} {q:?} {}", q.is_secret());
}
```

这里 `impl<T> Point<T>` 表示“任何 `T` 都适用的通用实现”，而 `impl Point<f32>` 则表示“只给 `Point<f32>` 开的小灶”。<br><span class="zh-inline">这点非常实用，因为它允许在保留通用接口的同时，对某些特殊类型加专用能力，而不需要把整个类型体系搞复杂。</span>

# Exercise: Generics<br><span class="zh-inline">练习：泛型</span>

🟢 **Starter**<br><span class="zh-inline">🟢 **基础练习**</span>

- Modify the `Point` type to use two different types (`T` and `U`) for x and y<br><span class="zh-inline">把 `Point` 改成 x 和 y 使用两种不同类型，也就是 `T` 和 `U`。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
#[derive(Debug)]
struct Point<T, U> {
    x: T,
    y: U,
}

impl<T, U> Point<T, U> {
    fn new(x: T, y: U) -> Self {
        Point { x, y }
    }
}

fn main() {
    let p1 = Point::new(42, 3.14);        // Point<i32, f64>
    let p2 = Point::new("hello", true);   // Point<&str, bool>
    let p3 = Point::new(1u8, 1000u64);    // Point<u8, u64>
    println!("{p1:?}");
    println!("{p2:?}");
    println!("{p3:?}");
}
// Output:
// Point { x: 42, y: 3.14 }
// Point { x: "hello", y: true }
// Point { x: 1, y: 1000 }
```

</details>

### Combining Rust traits and generics<br><span class="zh-inline">把 trait 和泛型组合起来</span>

- Traits can be used to place restrictions on generic types (constraints)<br><span class="zh-inline">trait 可以给泛型施加约束，也就是限制某个泛型参数必须具备哪些能力。</span>
- The constraint can be specified using a `:` after the generic type parameter, or using `where`. The following defines a generic function `get_area` that takes any type `T` as long as it implements the `ComputeArea` trait<br><span class="zh-inline">约束既可以直接写在泛型参数后面，用 `:` 表示，也可以改写成 `where` 子句。下面这个例子表示 `get_area` 可以接收任意 `T`，只要它实现了 `ComputeArea` trait。</span>

```rust
trait ComputeArea {
    fn area(&self) -> u64;
}
fn get_area<T: ComputeArea>(t: &T) -> u64 {
    t.area()
}
```

- [▶ Try it in the Rust Playground](https://play.rust-lang.org/)<br><span class="zh-inline">[▶ 在 Rust Playground 里试试](https://play.rust-lang.org/)</span>

这一步就是 Rust 泛型真正开始发力的地方。泛型负责“可以适配很多类型”，trait bound 负责“但这些类型必须满足某种能力要求”。<br><span class="zh-inline">也就是说，Rust 泛型不是无条件的“万物皆可塞”，而是带合同的抽象。</span>

### Multiple trait constraints<br><span class="zh-inline">多个 trait 约束</span>

- It is possible to have multiple trait constraints<br><span class="zh-inline">一个泛型参数当然可以同时受多个 trait 约束。</span>

```rust
trait Fish {}
trait Mammal {}
struct Shark;
struct Whale;
impl Fish for Shark {}
impl Fish for Whale {}
impl Mammal for Whale {}
fn only_fish_and_mammals<T: Fish + Mammal>(_t: &T) {}
fn main() {
    let w = Whale {};
    only_fish_and_mammals(&w);
    let _s = Shark {};
    // Won't compile
    only_fish_and_mammals(&_s);
}
```

这段代码很好地展示了 Rust 的“能力组合”风格。一个类型不是因为继承了谁才合法，而是因为它同时实现了需要的 trait 组合。<br><span class="zh-inline">这套模式比 C++ 里很多靠模板技巧和概念约束拼出来的写法更直接。</span>

### Trait constraints in data types<br><span class="zh-inline">在数据类型里使用 trait 约束</span>

- Trait constraints can be combined with generics in data types<br><span class="zh-inline">trait 约束也可以直接放到泛型数据类型上。</span>
- In the following example, we define the `PrintDescription` trait and a generic `struct` `Shape` with a member constrained by the trait<br><span class="zh-inline">下面这个例子里，先定义 `PrintDescription` trait，再定义一个泛型结构体 `Shape`，其中成员类型受这个 trait 约束。</span>

```rust
trait PrintDescription {
    fn print_description(&self);
}
struct Shape<S: PrintDescription> {
    shape: S,
}
// Generic Shape implementation for any type that implements PrintDescription
impl<S: PrintDescription> Shape<S> {
    fn print(&self) {
        self.shape.print_description();
    }
}
```

- [▶ Try it in the Rust Playground](https://play.rust-lang.org/)<br><span class="zh-inline">[▶ 在 Rust Playground 里试试](https://play.rust-lang.org/)</span>

这类写法很常见，尤其是在想表达“这个容器或包装器只接受某类能力对象”时。<br><span class="zh-inline">和传统面向对象里把基类指针塞进去相比，Rust 这边通常会优先用泛型加 trait bound，把约束放到编译期解决。</span>

# Exercise: Trait constraints and generics<br><span class="zh-inline">练习：trait 约束与泛型</span>

🟡 **Intermediate**<br><span class="zh-inline">🟡 **进阶**</span>

- Implement a `struct` with a generic member `cipher` that implements `CipherText`<br><span class="zh-inline">实现一个带泛型成员 `cipher` 的 `struct`，要求这个成员实现 `CipherText`。</span>

```rust
trait CipherText {
    fn encrypt(&self);
}
// TO DO
//struct Cipher<>
```

- Next, implement a method called `encrypt` on the `struct` `impl` that invokes `encrypt` on `cipher`<br><span class="zh-inline">然后为这个结构体实现一个 `encrypt` 方法，内部调用成员 `cipher` 的 `encrypt`。</span>

```rust
// TO DO
impl for Cipher<> {}
```

- Next, implement `CipherText` on two structs called `CipherOne` and `CipherTwo` (just `println()` is fine). Create `CipherOne` and `CipherTwo`, and use `Cipher` to invoke them<br><span class="zh-inline">接着再给 `CipherOne` 和 `CipherTwo` 两个结构体实现 `CipherText`，哪怕只是简单 `println!()` 也行。最后用 `Cipher` 包一层并调用它们。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
trait CipherText {
    fn encrypt(&self);
}

struct Cipher<T: CipherText> {
    cipher: T,
}

impl<T: CipherText> Cipher<T> {
    fn encrypt(&self) {
        self.cipher.encrypt();
    }
}

struct CipherOne;
struct CipherTwo;

impl CipherText for CipherOne {
    fn encrypt(&self) {
        println!("CipherOne encryption applied");
    }
}

impl CipherText for CipherTwo {
    fn encrypt(&self) {
        println!("CipherTwo encryption applied");
    }
}

fn main() {
    let c1 = Cipher { cipher: CipherOne };
    let c2 = Cipher { cipher: CipherTwo };
    c1.encrypt();
    c2.encrypt();
}
// Output:
// CipherOne encryption applied
// CipherTwo encryption applied
```

</details>

### Rust type-state pattern and generics<br><span class="zh-inline">Rust 的 type-state 模式与泛型</span>

- Rust types can be used to enforce state machine transitions at *compile* time<br><span class="zh-inline">Rust 类型系统可以在**编译期**强制状态机转换规则。</span>
    - Consider a `Drone` with say two states: `Idle` and `Flying`. In the `Idle` state, the only permitted method is `takeoff()`. In the `Flying` state, we permit `land()`<br><span class="zh-inline">例如一个 `Drone` 有两个状态：`Idle` 和 `Flying`。在 `Idle` 状态只允许 `takeoff()`，在 `Flying` 状态只允许 `land()`。</span>

- One approach is to model the state machine using something like the following<br><span class="zh-inline">最直接的办法，是先写一个普通枚举状态机：</span>

```rust
enum DroneState {
    Idle,
    Flying
}
struct Drone {x: u64, y: u64, z: u64, state: DroneState}  // x, y, z are coordinates
```

- This requires a lot of runtime checks to enforce the state machine semantics — [▶ try it](https://play.rust-lang.org/) to see why<br><span class="zh-inline">但这样做仍然需要一堆运行时检查才能保证状态转移合法。可以 [▶ 自己试试](https://play.rust-lang.org/)，很快就会明白为什么这招不够硬。</span>

### Type-state with `PhantomData<T>`<br><span class="zh-inline">用 `PhantomData<T>` 做 type-state</span>

- Generics allow us to enforce the state machine at *compile time*. This requires using a special generic called `PhantomData<T>`<br><span class="zh-inline">泛型可以把状态机约束直接搬到**编译期**，常见办法就是使用 `PhantomData<T>`。</span>
- `PhantomData<T>` is a zero-sized marker type. In this case, we use it to represent `Idle` and `Flying`, but it has zero runtime size<br><span class="zh-inline">`PhantomData<T>` 是零尺寸标记类型。这里可以用它表示 `Idle` 和 `Flying` 两种状态，而且不会引入额外运行时大小。</span>
- Notice that the `takeoff` and `land` methods take `self` as a parameter. This is referred to as consuming. Once we call `takeoff()` on `Drone<Idle>`, we only get back a `Drone<Flying>` and vice versa<br><span class="zh-inline">注意 `takeoff` 和 `land` 都直接接收 `self`，也就是消费当前值。这样一来，`Drone<Idle>` 调用 `takeoff()` 后，只会得到 `Drone<Flying>`，反过来也一样。</span>

```rust
struct Drone<T> {x: u64, y: u64, z: u64, state: PhantomData<T> }
impl Drone<Idle> {
    fn takeoff(self) -> Drone<Flying> {...}
}
impl Drone<Flying> {
    fn land(self) -> Drone<Idle> { ...}
}
```

- [▶ Try it in the Rust Playground](https://play.rust-lang.org/)<br><span class="zh-inline">[▶ 在 Rust Playground 里试试](https://play.rust-lang.org/)</span>

### Key takeaways for type-state<br><span class="zh-inline">type-state 的关键结论</span>

- States can be represented using structs (zero-size)<br><span class="zh-inline">状态可以用零尺寸结构体来表示。</span>
- We can combine the state `T` with `PhantomData<T>` (zero-size)<br><span class="zh-inline">状态参数 `T` 可以通过 `PhantomData<T>` 挂到类型上。</span>
- Implementing methods for a particular stage of the state machine is then just a matter of `impl State<T>`<br><span class="zh-inline">给某个状态提供专属方法，只需要针对对应类型参数写 `impl` 即可。</span>
- Use a method that consumes `self` to transition from one state to another<br><span class="zh-inline">状态转换通常用消费 `self` 的方法来表达。</span>
- This gives zero-cost abstractions. The compiler enforces the state machine at compile time and it's impossible to call methods unless the state is right<br><span class="zh-inline">这就是零成本抽象：编译器会在编译期强制状态机规则，状态不对时连方法都调用不了。</span>

### Builder pattern and consuming `self`<br><span class="zh-inline">builder 模式与消费 `self`</span>

- Consuming `self` is also useful for builder patterns<br><span class="zh-inline">消费 `self` 的写法在 builder 模式里也特别常见。</span>
- Consider a GPIO configuration with several dozen pins. The pins can be configured high or low, and the default is low<br><span class="zh-inline">例如一个 GPIO 配置对象里可能有几十个引脚，每个引脚能配成高电平或低电平，默认值是低。</span>

```rust
#[derive(Default)]
enum PinState {
    #[default]
    Low,
    High,
} 
#[derive(Default)]
struct GPIOConfig {
    pin0: PinState,
    pin1: PinState,
    // ...
}
```

- The builder pattern can be used to construct a GPIO configuration by chaining — [▶ Try it](https://play.rust-lang.org/)<br><span class="zh-inline">这时候就很适合用链式 builder 一步步构造配置对象。[▶ 可以自己试试](https://play.rust-lang.org/)</span>

Rust 泛型这一章说到底就在讲一件事：抽象当然要有，但抽象最好让编译器看得懂、管得住、还能帮着生成高效代码。<br><span class="zh-inline">这也是它和 C++ 模板世界最大的气质差别之一。Rust 不只是想给表达力，还想把表达力收拾得更规矩。</span>
