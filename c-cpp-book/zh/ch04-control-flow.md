# Rust if keyword<br><span class="zh-inline">Rust 的 if 关键字</span>

> **What you'll learn:** Rust's control flow constructs — `if`/`else` as expressions, `loop`/`while`/`for`, `match`, and how they differ from C/C++ counterparts. The key insight: most Rust control flow returns values.<br><span class="zh-inline">**将学到什么：** Rust 的控制流结构，包括作为表达式的 `if`/`else`、`loop`/`while`/`for`、`match`，以及它们与 C/C++ 对应写法的差异。最重要的一点是：Rust 中的大多数控制流都能返回值。</span>

- In Rust, ```if``` is actually an expression, i.e., it can be used to assign values, but it also behaves like a statement. [▶ Try it](https://play.rust-lang.org/)<br><span class="zh-inline">在 Rust 中，```if``` 实际上是表达式，也就是说它可以参与赋值；但与此同时，它也具备语句的行为。[▶ 亲自试试](https://play.rust-lang.org/)</span>

```rust
fn main() {
    let x = 42;
    if x < 42 {
        println!("Smaller than the secret of life");
    } else if x == 42 {
        println!("Is equal to the secret of life");
    } else {
        println!("Larger than the secret of life");
    }
    let is_secret_of_life = if x == 42 {true} else {false};
    println!("{}", is_secret_of_life);
}
```

# Rust loops using while and for<br><span class="zh-inline">使用 while 和 for 的 Rust 循环</span>
- The ```while``` keyword can be used to loop while an expression is true<br><span class="zh-inline">```while``` 关键字可以在条件表达式为真时持续循环</span>
```rust
fn main() {
    let mut x = 40;
    while x != 42 {
        x += 1;
    }
}
```
- The ```for``` keyword can be used to iterate over ranges<br><span class="zh-inline">```for``` 关键字可以用于遍历区间</span>
```rust
fn main() {
    // Will not print 43; use 40..=43 to include last element
    for x in 40..43 {
        println!("{}", x);
    } 
}
```

# Rust loops using loop<br><span class="zh-inline">使用 loop 的 Rust 循环</span>
- The ```loop``` keyword creates an infinite loop until a ```break``` is encountered<br><span class="zh-inline">```loop``` 关键字会创建一个无限循环，直到遇到 ```break``` 为止</span>
```rust
fn main() {
    let mut x = 40;
    // Change the below to 'here: loop to specify optional label for the loop
    loop {
        if x == 42 {
            break; // Use break x; to return the value of x
        }
        x += 1;
    }
}
```
- The ```break``` statement can include an optional expression that can be used to assign the value of a ```loop``` expression<br><span class="zh-inline">```break``` 语句可以附带一个表达式，用来作为整个 ```loop``` 表达式的返回值</span>
- The ```continue``` keyword can be used to return to the top of the ```loop```<br><span class="zh-inline">```continue``` 关键字可以让流程直接回到 ```loop``` 的开头</span>
- Loop labels can be used with ```break``` or ```continue``` and are useful when dealing with nested loops<br><span class="zh-inline">循环标签可以和 ```break``` 或 ```continue``` 一起使用，在处理嵌套循环时尤其有用</span>

# Rust expression blocks<br><span class="zh-inline">Rust 表达式代码块</span>
- Rust expression blocks are simply a sequence of expressions enclosed in ```{}```. The evaluated value is simply the last expression in the block<br><span class="zh-inline">Rust 的表达式代码块就是一串被 ```{}``` 包裹起来的表达式，其求值结果就是代码块中的最后一个表达式</span>
```rust
fn main() {
    let x = {
        let y = 40;
        y + 2 // Note: ; must be omitted
    };
    // Notice the Python style printing
    println!("{x}");
}
```
- Rust style is to use this to omit the ```return``` keyword in functions<br><span class="zh-inline">Rust 的惯用写法经常利用这一点，在函数中省略 ```return``` 关键字</span>
```rust
fn is_secret_of_life(x: u32) -> bool {
    // Same as if x == 42 {true} else {false}
    x == 42 // Note: ; must be omitted 
}
fn main() {
    println!("{}", is_secret_of_life(42));
}
```


