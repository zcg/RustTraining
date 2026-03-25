### Rust array type<br><span class="zh-inline">Rust 的数组类型</span>

> **What you'll learn:** Rust's core data structures — arrays, tuples, slices, strings, structs, `Vec`, and `HashMap`. This is a dense chapter; focus on understanding `String` vs `&str` and how structs work. You'll revisit references and borrowing in depth in chapter 7.<br><span class="zh-inline">**本章将学到什么：** Rust 里最常用的几类核心数据结构：数组、元组、切片、字符串、结构体、`Vec` 和 `HashMap`。这一章信息量比较大，先重点盯住 `String` 和 `&str` 的区别，以及结构体是怎么工作的。引用和借用会在第 7 章再深入展开。</span>

- Arrays contain a fixed number of elements of the same type.<br><span class="zh-inline">数组里装的是固定数量、相同类型的元素。</span>
    - Like all other Rust types, arrays are immutable by default unless `mut` is used.<br><span class="zh-inline">和 Rust 里其他类型一样，数组默认也是不可变的，除非显式写 `mut`。</span>
    - Arrays are indexed using `[]` and the access is bounds-checked. Use `.len()` to get the array length.<br><span class="zh-inline">数组用 `[]` 索引，而且会做边界检查。数组长度可以通过 `.len()` 取得。</span>

```rust
    fn get_index(y : usize) -> usize {
        y+1        
    }
    
    fn main() {
        // Initializes an array of 10 elements and sets all to 42
        let a : [u8; 3] = [42; 3];
        // Alternative syntax
        // let a = [42u8, 42u8, 42u8];
        for x in a {
            println!("{x}");
        }
        let y = get_index(a.len());
        // Commenting out the below will cause a panic
        //println!("{}", a[y]);
    }
```

----

### Rust array type continued<br><span class="zh-inline">Rust 数组补充说明</span>

- Arrays can be nested.<br><span class="zh-inline">数组还可以继续嵌套数组。</span>
    - Rust has several built-in formatters for printing. In the example below, `:?` is the debug formatter, and `:#?` can be used for pretty printing. These formatters can also be customized per type later on.<br><span class="zh-inline">Rust 内置了几种常用打印格式。下面例子里的 `:?` 是调试打印格式，`:#?` 则是更适合阅读的 pretty print。后面也会看到，这些输出格式还能按类型自定义。</span>

```rust
    fn main() {
        let a = [
            [40, 0], // Define a nested array
            [41, 0],
            [42, 1],
        ];
        for x in a {
            println!("{x:?}");
        }
    }
```

----

### Rust tuples<br><span class="zh-inline">Rust 的元组</span>

- Tuples have a fixed size and can group arbitrary types into one compound value.<br><span class="zh-inline">元组也是固定大小，但它能把不同类型的值组合到一起。</span>
    - Individual elements are accessed by position: `.0`, `.1`, `.2`, and so on. The empty tuple `()` is called the unit value and is roughly the Rust equivalent of a void return value.<br><span class="zh-inline">元组元素按位置访问，也就是 `.0`、`.1`、`.2` 这种写法。空元组 `()` 叫 unit value，大致可以看成 Rust 里的“空返回值”。</span>
    - Rust also supports tuple destructuring, which makes it easy to bind names to each element.<br><span class="zh-inline">Rust 还支持元组解构，能很方便地把各个位置的值分别绑定到变量上。</span>

```rust
fn get_tuple() -> (u32, bool) {
    (42, true)        
}

fn main() {
   let t : (u8, bool) = (42, true);
   let u : (u32, bool) = (43, false);
   println!("{}, {}", t.0, t.1);
   println!("{}, {}", u.0, u.1);
   let (num, flag) = get_tuple(); // Tuple destructuring
   println!("{num}, {flag}");
}
```

### Rust references<br><span class="zh-inline">Rust 的引用</span>

- References in Rust are roughly comparable to pointers in C, but with much stricter rules.<br><span class="zh-inline">Rust 的引用和 C 里的指针有点像，但规则严格得多，不是一个量级。</span>
    - Any number of immutable references may coexist at the same time. A reference also cannot outlive the scope of the value it points to. That idea is the basis of lifetimes, which will be discussed in detail later.<br><span class="zh-inline">同一时间可以存在任意多个不可变引用，而且引用的存活时间绝对不能超过它指向的值。这背后就是生命周期的核心概念，后面会单独细讲。</span>
    - Only one mutable reference to a mutable value may exist at a time, and it cannot overlap with other references.<br><span class="zh-inline">可变引用则更严格：同一时刻只能有一个，而且不能和其他引用重叠。</span>

```rust
fn main() {
    let mut a = 42;
    {
        let b = &a;
        let c = b;
        println!("{} {}", *b, *c); // The compiler automatically dereferences *c
        // Illegal because b and still are still in scope
        // let d = &mut a;
    }
    let d = &mut a; // Ok: b and c are not in scope
    *d = 43;
}
```

----

# Rust slices<br><span class="zh-inline">Rust 的切片</span>

- References can be used to create views over part of an array.<br><span class="zh-inline">引用还能用来从数组里切出一段视图，也就是切片。</span>
    - Arrays have a compile-time fixed length, while slices can describe a range of arbitrary size. Internally, a slice is a fat pointer containing both a start pointer and a length.<br><span class="zh-inline">数组长度在编译期就固定了，而切片只是“看向其中一段”的视图，长度可以变化。底层上，切片是一个胖指针，里面既有起始位置，也有长度信息。</span>

```rust
fn main() {
    let a = [40, 41, 42, 43];
    let b = &a[1..a.len()]; // A slice starting with the second element in the original
    let c = &a[1..]; // Same as the above
    let d = &a[..]; // Same as &a[0..] or &a[0..a.len()]
    println!("{b:?} {c:?} {d:?}");
}
```

----

# Rust constants and statics<br><span class="zh-inline">Rust 的常量与静态变量</span>

- The `const` keyword defines a constant value. Constant expressions are evaluated at compile time and typically get inlined into the final program.<br><span class="zh-inline">`const` 用来定义常量值。常量会在编译期求值，通常会被直接内联进程序里。</span>
- The `static` keyword defines a true global variable similar to what C/C++ programs use. A static has a fixed memory address and exists for the entire lifetime of the program.<br><span class="zh-inline">`static` 则更像 C/C++ 里的全局变量：有固定地址，程序整个生命周期里都一直存在。</span>

```rust
const SECRET_OF_LIFE: u32 = 42;
static GLOBAL_VARIABLE : u32 = 2;
fn main() {
    println!("The secret of life is {}", SECRET_OF_LIFE);
    println!("Value of global variable is {GLOBAL_VARIABLE}")
}
```

----

# Rust strings: `String` vs `&str`<br><span class="zh-inline">Rust 字符串：`String` 和 `&str` 的区别</span>

- Rust has **two** string types with different jobs.<br><span class="zh-inline">Rust 里有 **两种** 字符串类型，它们分工完全不同。</span>
    - `String` is owned, heap-allocated, and growable. You can roughly compare it to a manually managed heap buffer in C or to C++ `std::string`.<br><span class="zh-inline">`String` 是拥有型、堆分配、可增长的字符串。大致可以类比 C 里自己管理的堆缓冲区，或者 C++ 的 `std::string`。</span>
    - `&str` is a borrowed string slice. It is lightweight, read-only, and closer in spirit to `const char*` plus a length, or to C++ `std::string_view`, except that Rust actually checks its lifetime so it cannot dangle.<br><span class="zh-inline">`&str` 是借用来的字符串切片，轻量、只读，更接近“带长度的 `const char*`”或者 C++ 的 `std::string_view`。区别在于 Rust 真会检查生命周期，所以它不能悬空。</span>
    - Rust strings are not null-terminated. They track length explicitly and are guaranteed to contain valid UTF-8.<br><span class="zh-inline">Rust 字符串也不是靠结尾 `\0` 判断长度的，而是显式记录长度，并且保证内容是合法 UTF-8。</span>

> **For C++ developers:** `String` ≈ `std::string`, `&str` ≈ `std::string_view`. Unlike `std::string_view`, a Rust `&str` is guaranteed valid for its whole lifetime by the borrow checker.<br><span class="zh-inline">**给 C++ 开发者：** `String` 可以近似看成 `std::string`，`&str` 可以近似看成 `std::string_view`。但 `&str` 比 `std::string_view` 更硬，因为借用检查器会保证它在整个生命周期里都有效。</span>

## String vs `&str`: owned vs borrowed<br><span class="zh-inline">`String` 和 `&str`：拥有型与借用型</span>

> **Production patterns:** See [JSON handling: nlohmann::json → serde](ch17-2-avoiding-unchecked-indexing.md#json-handling-nlohmannjson--serde) for how string handling works with serde in production code.<br><span class="zh-inline">**生产代码里的用法：** 可以顺手参考 [JSON handling: nlohmann::json → serde](ch17-2-avoiding-unchecked-indexing.md#json-handling-nlohmannjson--serde)，看看真实项目里字符串和 serde 是怎么配合的。</span>

| **Aspect** | **C `char*`** | **C++ `std::string`** | **Rust `String`** | **Rust `&str`** |
|------------|--------------|----------------------|-------------------|----------------|
| **Memory** | Manual `malloc` / `free`<br><span class="zh-inline">手动管理</span> | Owns heap storage<br><span class="zh-inline">拥有堆内存</span> | Owns heap storage and auto-frees<br><span class="zh-inline">拥有堆内存并自动释放</span> | Borrowed reference with lifetime checks<br><span class="zh-inline">带生命周期检查的借用引用</span> |
| **Mutability** | Usually mutable through the pointer<br><span class="zh-inline">通常可变</span> | Mutable<br><span class="zh-inline">可变</span> | Mutable if declared `mut`<br><span class="zh-inline">写成 `mut` 才能改</span> | Always immutable<br><span class="zh-inline">始终只读</span> |
| **Size info** | None, relies on `'\0'`<br><span class="zh-inline">靠终止符</span> | Tracks length and capacity<br><span class="zh-inline">显式记录长度和容量</span> | Tracks length and capacity<br><span class="zh-inline">显式记录长度和容量</span> | Tracks length as part of the fat pointer<br><span class="zh-inline">长度包含在切片元数据里</span> |
| **Encoding** | Unspecified<br><span class="zh-inline">编码不受约束</span> | Unspecified<br><span class="zh-inline">编码不受约束</span> | Valid UTF-8<br><span class="zh-inline">保证合法 UTF-8</span> | Valid UTF-8<br><span class="zh-inline">保证合法 UTF-8</span> |
| **Null terminator** | Required<br><span class="zh-inline">需要</span> | Required for `c_str()` interop<br><span class="zh-inline">和 C 交互时才需要</span> | Not used<br><span class="zh-inline">不用</span> | Not used<br><span class="zh-inline">不用</span> |

```rust
fn main() {
    // &str - string slice (borrowed, immutable, usually a string literal)
    let greeting: &str = "Hello";  // Points to read-only memory

    // String - owned, heap-allocated, growable
    let mut owned = String::from(greeting);  // Copies data to heap
    owned.push_str(", World!");        // Grow the string
    owned.push('!');                   // Append a single character

    // Converting between String and &str
    let slice: &str = &owned;          // String -> &str (free, just a borrow)
    let owned2: String = slice.to_string();  // &str -> String (allocates)
    let owned3: String = String::from(slice); // Same as above

    // String concatenation (note: + consumes the left operand)
    let hello = String::from("Hello");
    let world = String::from(", World!");
    let combined = hello + &world;  // hello is moved (consumed), world is borrowed
    // println!("{hello}");  // Won't compile: hello was moved

    // Use format! to avoid move issues
    let a = String::from("Hello");
    let b = String::from("World");
    let combined = format!("{a}, {b}!");  // Neither a nor b is consumed

    println!("{combined}");
}
```

## Why you cannot index strings with `[]`<br><span class="zh-inline">为什么字符串不能直接用 `[]` 索引</span>

```rust
fn main() {
    let s = String::from("hello");
    // let c = s[0];  // Won't compile! Rust strings are UTF-8, not byte arrays

    // Safe alternatives:
    let first_char = s.chars().next();           // Option<char>: Some('h')
    let as_bytes = s.as_bytes();                 // &[u8]: raw UTF-8 bytes
    let substring = &s[0..1];                    // &str: "h" (byte range, must be valid UTF-8 boundary)

    println!("First char: {:?}", first_char);
    println!("Bytes: {:?}", &as_bytes[..5]);
}
```

Rust 不允许像数组那样随手取 `s[0]`，核心原因是 UTF-8 字符串里“第几个字符”和“第几个字节”根本不是一回事。<br><span class="zh-inline">这条限制看起来麻烦，其实是在防止把多字节字符切坏。</span>

## Exercise: String manipulation<br><span class="zh-inline">练习：字符串处理</span>

🟢 **Starter**<br><span class="zh-inline">🟢 **基础练习**</span>

- Write a function `fn count_words(text: &str) -> usize` that counts whitespace-separated words.<br><span class="zh-inline">写一个 `fn count_words(text: &str) -> usize`，统计字符串里按空白字符分隔后的单词数量。</span>
- Write a function `fn longest_word(text: &str) -> &str` that returns the longest word. Think about why the return type should be `&str` rather than `String`.<br><span class="zh-inline">再写一个 `fn longest_word(text: &str) -> &str`，返回最长的单词。顺手想一想：为什么这里返回 `&str` 更合适，而不是 `String`。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
fn count_words(text: &str) -> usize {
    text.split_whitespace().count()
}

fn longest_word(text: &str) -> &str {
    text.split_whitespace()
        .max_by_key(|word| word.len())
        .unwrap_or("")
}

fn main() {
    let text = "the quick brown fox jumps over the lazy dog";
    println!("Word count: {}", count_words(text));       // 9
    println!("Longest word: {}", longest_word(text));     // "jumps"
}
```

</details>

# Rust structs<br><span class="zh-inline">Rust 的结构体</span>

- The `struct` keyword declares a user-defined structure type.<br><span class="zh-inline">`struct` 关键字用来声明自定义结构体类型。</span>
    - A struct can have named fields, or it can be a tuple struct with unnamed fields.<br><span class="zh-inline">结构体既可以是带字段名的普通结构体，也可以是没有字段名的 tuple struct。</span>
- Unlike C++, Rust has no concept of data inheritance.<br><span class="zh-inline">Rust 这里没有 C++ 那种“数据继承”概念，结构体之间不会靠继承来复用字段。</span>

```rust
fn main() {
    struct MyStruct {
        num: u32,
        is_secret_of_life: bool,
    }
    let x = MyStruct {
        num: 42,
        is_secret_of_life: true,
    };
    let y = MyStruct {
        num: x.num,
        is_secret_of_life: x.is_secret_of_life,
    };
    let z = MyStruct { num: x.num, ..x }; // The .. means copy remaining
    println!("{} {} {}", x.num, y.is_secret_of_life, z.num);
}
```

# Rust tuple structs<br><span class="zh-inline">Rust 的元组结构体</span>

- Tuple structs are similar to tuples except they define a distinct type.<br><span class="zh-inline">tuple struct 看起来像元组，但它本身会形成一个新的独立类型。</span>
    - Individual fields are still accessed as `.0`, `.1`, `.2`, and so on. A common use is wrapping primitive types to prevent mixing semantically different values that happen to share the same underlying representation.<br><span class="zh-inline">字段访问方式还是 `.0`、`.1` 这种形式。它最常见的用途之一，就是把同一种原始类型包成不同语义的新类型，防止用错地方。</span>

```rust
struct WeightInGrams(u32);
struct WeightInMilligrams(u32);
fn to_weight_in_grams(kilograms: u32) -> WeightInGrams {
    WeightInGrams(kilograms * 1000)
}

fn to_weight_in_milligrams(w : WeightInGrams) -> WeightInMilligrams  {
    WeightInMilligrams(w.0 * 1000)
}

fn main() {
    let x = to_weight_in_grams(42);
    let y = to_weight_in_milligrams(x);
    // let z : WeightInGrams = x;  // Won't compile: x was moved into to_weight_in_milligrams()
    // let a : WeightInGrams = y;   // Won't compile: type mismatch (WeightInMilligrams vs WeightInGrams)
}
```

**Note:** The `#[derive(...)]` attribute automatically generates common trait implementations for structs and enums. You will see this repeatedly throughout the course.<br><span class="zh-inline">**说明：** `#[derive(...)]` 属性可以自动为结构体和枚举生成常见 trait 实现。后面整本书里都会频繁看到它。</span>

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point { x: i32, y: i32 }

fn main() {
    let p = Point { x: 1, y: 2 };
    println!("{:?}", p);           // Debug: works because of #[derive(Debug)]
    let p2 = p.clone();           // Clone: works because of #[derive(Clone)]
    assert_eq!(p, p2);            // PartialEq: works because of #[derive(PartialEq)]
}
```

The trait system will be covered in detail later, but `#[derive(Debug)]` is useful so often that it is worth adding to almost every `struct` and `enum` you create.<br><span class="zh-inline">trait 系统后面会专门讲，但 `#[derive(Debug)]` 实在太常用了，基本新建一个结构体或枚举都可以先把它带上。</span>

# Rust `Vec` type<br><span class="zh-inline">Rust 的 `Vec` 类型</span>

- `Vec<T>` is a dynamically sized heap buffer. It is comparable to manually managed `malloc` / `realloc` arrays in C or to C++ `std::vector`.<br><span class="zh-inline">`Vec<T>` 是动态大小的堆缓冲区，大致相当于 C 里自己管扩容的堆数组，或者 C++ 的 `std::vector`。</span>
    - Unlike fixed-size arrays, `Vec` can grow and shrink at runtime.<br><span class="zh-inline">和固定大小数组不同，`Vec` 在运行时可以扩容和缩容。</span>
    - `Vec` owns its contents and automatically manages allocation and deallocation.<br><span class="zh-inline">`Vec` 拥有里面的数据，也会自动处理内存分配和释放。</span>
- Common operations include `push()`、`pop()`、`insert()`、`remove()`、`len()` and `capacity()`.<br><span class="zh-inline">常见操作有 `push()`、`pop()`、`insert()`、`remove()`、`len()` 和 `capacity()`。</span>

```rust
fn main() {
    let mut v = Vec::new();    // Empty vector, type inferred from usage
    v.push(42);                // Add element to end - Vec<i32>
    v.push(43);                
    
    // Safe iteration (preferred)
    for x in &v {              // Borrow elements, don't consume vector
        println!("{x}");
    }
    
    // Initialization shortcuts
    let mut v2 = vec![1, 2, 3, 4, 5];           // Macro for initialization
    let v3 = vec![0; 10];                       // 10 zeros
    
    // Safe access methods (preferred over indexing)
    match v2.get(0) {
        Some(first) => println!("First: {first}"),
        None => println!("Empty vector"),
    }
    
    // Useful methods
    println!("Length: {}, Capacity: {}", v2.len(), v2.capacity());
    if let Some(last) = v2.pop() {             // Remove and return last element
        println!("Popped: {last}");
    }
    
    // Dangerous: direct indexing (can panic!)
    // println!("{}", v2[100]);  // Would panic at runtime
}
```

> **Production patterns:** See [Avoiding unchecked indexing](ch17-2-avoiding-unchecked-indexing.md#avoiding-unchecked-indexing) for safe `.get()` patterns from production Rust code.<br><span class="zh-inline">**生产代码里的安全写法：** 可以对照 [Avoiding unchecked indexing](ch17-2-avoiding-unchecked-indexing.md#avoiding-unchecked-indexing)，那一节专门讲 `.get()` 这种更稳妥的访问方式。</span>

# Rust `HashMap` type<br><span class="zh-inline">Rust 的 `HashMap` 类型</span>

- `HashMap` implements generic key-value lookups, also known as dictionaries or maps.<br><span class="zh-inline">`HashMap` 用来做通用的键值查找，也就是常说的字典或映射表。</span>

```rust
fn main() {
    use std::collections::HashMap;  // Need explicit import, unlike Vec
    let mut map = HashMap::new();       // Allocate an empty HashMap
    map.insert(40, false);  // Type is inferred as int -> bool
    map.insert(41, false);
    map.insert(42, true);
    for (key, value) in map {
        println!("{key} {value}");
    }
    let map = HashMap::from([(40, false), (41, false), (42, true)]);
    if let Some(x) = map.get(&43) {
        println!("43 was mapped to {x:?}");
    } else {
        println!("No mapping was found for 43");
    }
    let x = map.get(&43).or(Some(&false));  // Default value if key isn't found
    println!("{x:?}"); 
}
```

# Exercise: `Vec` and `HashMap`<br><span class="zh-inline">练习：`Vec` 与 `HashMap`</span>

🟢 **Starter**<br><span class="zh-inline">🟢 **基础练习**</span>

- Create a `HashMap<u32, bool>` with several entries, making sure some values are `true` and others are `false`. Loop over the hashmap and place the keys into one `Vec` and the values into another.<br><span class="zh-inline">创建一个 `HashMap<u32, bool>`，里面放几组数据，注意有些值是 `true`，有些是 `false`。遍历这个 hashmap，把所有 key 放进一个 `Vec`，把所有 value 放进另一个 `Vec`。</span>

<details><summary>Solution <span class="zh-inline">参考答案</span></summary>

```rust
use std::collections::HashMap;

fn main() {
    let map = HashMap::from([(1, true), (2, false), (3, true), (4, false)]);
    let mut keys = Vec::new();
    let mut values = Vec::new();
    for (k, v) in &map {
        keys.push(*k);
        values.push(*v);
    }
    println!("Keys:   {keys:?}");
    println!("Values: {values:?}");

    // Alternative: use iterators with unzip()
    let (keys2, values2): (Vec<u32>, Vec<bool>) = map.into_iter().unzip();
    println!("Keys (unzip):   {keys2:?}");
    println!("Values (unzip): {values2:?}");
}
```

</details>

---

## Deep Dive: C++ references vs Rust references<br><span class="zh-inline">深入对比：C++ 引用与 Rust 引用</span>

> **For C++ developers:** C++ programmers often assume Rust `&T` behaves like C++ `T&`. They look similar on the surface, but the semantics are very different. C developers can skip this section because Rust references are covered again in [Ownership and Borrowing](ch07-ownership-and-borrowing.md).<br><span class="zh-inline">**给 C++ 开发者：** 很多人第一眼会把 Rust 的 `&T` 想成 C++ 的 `T&`。表面上看确实像，但语义差别相当大。纯 C 开发者可以先跳过这里，Rust 引用的核心规则会在 [Ownership and Borrowing](ch07-ownership-and-borrowing.md) 再讲一遍。</span>

#### 1. No rvalue references or universal references<br><span class="zh-inline">1. 没有右值引用，也没有万能引用</span>

In C++, `&&` means different things depending on the context.<br><span class="zh-inline">在 C++ 里，`&&` 这玩意儿看上下文能变出不同含义，这事本身就挺折腾人。</span>

```cpp
// C++: && means different things:
int&& rref = 42;           // Rvalue reference — binds to temporaries
void process(Widget&& w);   // Rvalue reference — caller must std::move

// Universal (forwarding) reference — deduced template context:
template<typename T>
void forward(T&& arg) {     // NOT an rvalue ref! Deduced as T& or T&&
    inner(std::forward<T>(arg));  // Perfect forwarding
}
```

**In Rust, none of this exists.** `&&` is simply the logical AND operator.<br><span class="zh-inline">**Rust 里压根没有这套。** `&&` 就只是逻辑与，别脑补更多戏份。</span>

```rust
// Rust: && is just boolean AND
let a = true && false; // false

// Rust has NO rvalue references, no universal references, no perfect forwarding.
// Instead:
//   - Move is the default for non-Copy types (no std::move needed)
//   - Generics + trait bounds replace universal references
//   - No temporary-binding distinction — values are values

fn process(w: Widget) { }      // Takes ownership (like C++ value param + implicit move)
fn process_ref(w: &Widget) { } // Borrows immutably (like C++ const T&)
fn process_mut(w: &mut Widget) { } // Borrows mutably (like C++ T&, but exclusive)
```

| C++ Concept | Rust Equivalent | Notes |
|-------------|-----------------|-------|
| `T&` lvalue reference | `&T` or `&mut T` | Rust 拆成共享借用和独占借用两类<br><span class="zh-inline">语义比 C++ 更细</span> |
| `T&&` rvalue reference | `T` by value | Take ownership directly<br><span class="zh-inline">按值拿走就是所有权转移</span> |
| Universal reference | `impl Trait` or generic bounds | Generics replace forwarding tricks<br><span class="zh-inline">靠泛型约束表达能力</span> |
| `std::move(x)` | Usually just `x` | Move is the default<br><span class="zh-inline">默认就是 move</span> |
| `std::forward<T>(x)` | No direct equivalent | Rust does not need that machinery<br><span class="zh-inline">没有万能引用，也就没有这套转发戏法</span> |

#### 2. Moves are bitwise — no move constructors<br><span class="zh-inline">2. move 是按位移动，不存在 move 构造函数</span>

In C++, moving is user-defined via move constructors and move assignment. In Rust, a move is fundamentally a bitwise copy of the bytes followed by invalidating the source binding.<br><span class="zh-inline">C++ 的 move 是用户可定义行为；Rust 的 move 则更底层，就是把值的字节搬过去，再把原绑定判定为失效。</span>

```rust
// Rust move = memcpy the bytes, mark source as invalid
let s1 = String::from("hello");
let s2 = s1; // Bytes of s1 are copied to s2's stack slot
              // s1 is now invalid — compiler enforces this
// println!("{s1}"); // ❌ Compile error: value used after move
```

```cpp
// C++ move = call the move constructor (user-defined!)
std::string s1 = "hello";
std::string s2 = std::move(s1); // Calls string's move ctor
// s1 is now a "valid but unspecified state" zombie
std::cout << s1; // Compiles! Prints... something (empty string, usually)
```

**Consequences:**<br><span class="zh-inline">**直接后果：**</span>

- Rust has no Rule of Five ceremony.<br><span class="zh-inline">Rust 不需要一整套 Rule of Five 样板。</span>
- There is no moved-from zombie state; the compiler just forbids access.<br><span class="zh-inline">不存在“被 move 之后还能勉强访问但状态未定义”的僵尸对象。</span>
- Moves do not raise `noexcept` style questions; bitwise relocation itself does not throw.<br><span class="zh-inline">也没有 C++ 里那种 move 到底会不会抛异常的包袱。</span>

#### 3. Auto-deref: the compiler sees through layers of indirection<br><span class="zh-inline">3. 自动解引用：编译器会顺着一层层包装往里看</span>

Rust can automatically dereference through pointer-like wrappers using the `Deref` trait. C++ 没有完全同等的语言级体验。<br><span class="zh-inline">这也是为什么很多嵌套包装类型在 Rust 里看起来没那么吓人。</span>

```rust
use std::sync::{Arc, Mutex};

// Nested wrapping: Arc<Mutex<Vec<String>>>
let data = Arc::new(Mutex::new(vec!["hello".to_string()]));

// In C++, you'd need explicit unlocking and manual dereferencing at each layer.
// In Rust, the compiler auto-derefs through Arc → Mutex → MutexGuard → Vec:
let guard = data.lock().unwrap(); // Arc auto-derefs to Mutex
let first: &str = &guard[0];      // MutexGuard→Vec (Deref), Vec[0] (Index),
                                   // &String→&str (Deref coercion)
println!("First: {first}");

// Method calls also auto-deref:
let boxed_string = Box::new(String::from("hello"));
println!("Length: {}", boxed_string.len());  // Box→String, then String::len()
// No need for (*boxed_string).len() or boxed_string->len()
```

Deref coercion also applies to function arguments.<br><span class="zh-inline">函数参数匹配时，编译器也会自动做这类解引用转换。</span>

```rust
fn greet(name: &str) {
    println!("Hello, {name}");
}

fn main() {
    let owned = String::from("Alice");
    let boxed = Box::new(String::from("Bob"));
    let arced = std::sync::Arc::new(String::from("Carol"));

    greet(&owned);  // &String → &str  (1 deref coercion)
    greet(&boxed);  // &Box<String> → &String → &str  (2 deref coercions)
    greet(&arced);  // &Arc<String> → &String → &str  (2 deref coercions)
    greet("Dave");  // &str already — no coercion needed
}
// In C++ you'd need .c_str() or explicit conversions for each case.
```

**The deref chain:** when Rust sees `x.method()`, it first tries the receiver as-is, then `&T` and `&mut T`, and if that still does not fit it follows `Deref` implementations one layer at a time. Function argument coercion is related, but it is a separate mechanism.<br><span class="zh-inline">**自动解引用链的核心逻辑：** 调方法时，编译器会先尝试原类型，再尝试借用形式，实在不行再顺着 `Deref` 一层层往里找。函数参数的自动转换和它相关，但不是同一个机制。</span>

#### 4. No null references, no implicit optional references<br><span class="zh-inline">4. 没有空引用，也没有隐式“可空引用”</span>

```cpp
// C++: references can't be null, but pointers can, and the distinction is blurry
Widget& ref = *ptr;  // If ptr is null → UB
Widget* opt = nullptr;  // "optional" reference via pointer
```

```rust
// Rust: references are ALWAYS valid — guaranteed by the borrow checker
// No way to create a null or dangling reference in safe code
let r: &i32 = &42; // Always valid

// "Optional reference" is explicit:
let opt: Option<&Widget> = None; // Clear intent, no null pointer
if let Some(w) = opt {
    w.do_something(); // Only reachable when present
}
```

Rust 这里的态度很干脆：引用就是有效的引用。想表达“可能没有”，就老老实实写 `Option<&T>`。<br><span class="zh-inline">别搞那种靠约定区分“这是可空指针还是正常对象”的老把戏。</span>

#### 5. References cannot be reseated in C++, but Rust bindings can be rebound<br><span class="zh-inline">5. C++ 引用不能改绑，而 Rust 变量绑定可以重新绑定</span>

```cpp
// C++: a reference is an alias — it can't be rebound
int a = 1, b = 2;
int& r = a;
r = b;  // This ASSIGNS b's value to a — it does NOT rebind r!
// a is now 2, r still refers to a
```

```rust
// Rust: let bindings can shadow, but references follow different rules
let a = 1;
let b = 2;
let r = &a;
// r = &b;   // ❌ Cannot assign to immutable variable
let r = &b;  // ✅ But you can SHADOW r with a new binding
             // The old binding is gone, not reseated

// With mut:
let mut r = &a;
r = &b;      // ✅ r now points to b — this IS rebinding (not assignment through)
```

> **Mental model:** In C++, a reference is a permanent alias for one object. In Rust, a reference is still a normal value governed by binding rules. If the binding is mutable, it can be rebound to refer elsewhere; if the binding is immutable, it cannot.<br><span class="zh-inline">**心智模型：** C++ 的引用更像“永久别名”；Rust 的引用则更像“带额外安全保证的普通值”。它遵守变量绑定规则，本身不是那种永远锁死的别名语义。</span>
