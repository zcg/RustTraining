## Essential Keywords Reference<br><span class="zh-inline">核心关键字速查表</span>

> **What you'll learn:** A compact keyword map for Java developers so Rust syntax stops looking alien during the first few chapters.<br><span class="zh-inline">**本章将学习：** 给 Java 开发者准备的一份紧凑关键字映射表，让 Rust 语法在前几章里别再显得那么陌生。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 初级</span>

This chapter is a quick reference, not a replacement for the conceptual chapters.<br><span class="zh-inline">这一章是速查表，不是概念章节的替代品。</span>

| Rust keyword | Rough Java analogy | What it usually means |
|---|---|---|
| `let` | local variable declaration<br><span class="zh-inline">局部变量声明</span> | bind a value to a name<br><span class="zh-inline">把一个值绑定到名字上</span> |
| `mut` | mutable local variable<br><span class="zh-inline">可变局部变量</span> | allow reassignment or mutation<br><span class="zh-inline">允许重绑定或修改</span> |
| `fn` | method or function declaration<br><span class="zh-inline">方法或函数声明</span> | define a function<br><span class="zh-inline">定义函数</span> |
| `struct` | class or record shell<br><span class="zh-inline">类或 record 外壳</span> | define a data type with fields<br><span class="zh-inline">定义带字段的数据类型</span> |
| `enum` | enum plus sealed hierarchy<br><span class="zh-inline">枚举加 sealed 层级</span> | tagged union with variants<br><span class="zh-inline">带分支的代数数据类型</span> |
| `impl` | method block<br><span class="zh-inline">方法实现块</span> | attach methods or trait impls<br><span class="zh-inline">挂方法或 trait 实现</span> |
| `trait` | interface | shared behavior contract<br><span class="zh-inline">行为契约</span> |
| `match` | switch expression<br><span class="zh-inline">switch 表达式</span> | exhaustive pattern matching<br><span class="zh-inline">穷尽模式匹配</span> |
| `if let` | guarded destructuring<br><span class="zh-inline">条件解构</span> | handle one successful pattern<br><span class="zh-inline">处理一个匹配成功的分支</span> |
| `while let` | loop while match succeeds<br><span class="zh-inline">匹配成功时循环</span> | consume values until pattern stops matching<br><span class="zh-inline">持续处理直到模式失配</span> |
| `pub` | public visibility<br><span class="zh-inline">公开可见性</span> | expose outside the module<br><span class="zh-inline">向模块外暴露</span> |
| `crate` | module or artifact root<br><span class="zh-inline">模块或产物根</span> | current package boundary<br><span class="zh-inline">当前包边界</span> |
| `use` | import | bring names into scope<br><span class="zh-inline">把名字引入当前作用域</span> |
| `mod` | package or nested module<br><span class="zh-inline">包或嵌套模块</span> | declare a module<br><span class="zh-inline">声明模块</span> |
| `ref` | bind by reference in a pattern<br><span class="zh-inline">在模式里按引用绑定</span> | avoid moving during pattern matching<br><span class="zh-inline">模式匹配时避免 move</span> |
| `move` | capture by value<br><span class="zh-inline">按值捕获</span> | transfer ownership into closure or thread<br><span class="zh-inline">把所有权带进闭包或线程</span> |
| `async` | async method marker<br><span class="zh-inline">异步方法标记</span> | function returns a future<br><span class="zh-inline">函数返回 future</span> |
| `await` | future completion point<br><span class="zh-inline">future 完成点</span> | suspend until result is ready<br><span class="zh-inline">挂起直到结果就绪</span> |
| `unsafe` | dangerous low-level block<br><span class="zh-inline">低层危险块</span> | programmer must uphold invariants<br><span class="zh-inline">开发者自己维持约束</span> |
| `where` | generic bounds clause<br><span class="zh-inline">泛型约束子句</span> | move trait bounds out of angle brackets<br><span class="zh-inline">把约束挪出尖括号</span> |
| `Self` | current class type<br><span class="zh-inline">当前类型</span> | current implementing type<br><span class="zh-inline">当前实现类型</span> |
| `dyn` | interface reference<br><span class="zh-inline">接口引用</span> | dynamic dispatch through a trait object<br><span class="zh-inline">通过 trait object 动态分发</span> |
| `const` | compile-time constant<br><span class="zh-inline">编译期常量</span> | inlined immutable value<br><span class="zh-inline">被内联的不可变值</span> |
| `static` | static field<br><span class="zh-inline">静态字段</span> | process-wide storage<br><span class="zh-inline">进程级存储</span> |

## Three Keywords That Need Extra Attention<br><span class="zh-inline">三个需要额外留神的关键字</span>

### `mut`<br><span class="zh-inline">`mut`</span>

Mutability is explicit on the binding:<br><span class="zh-inline">可变性直接写在绑定上：</span>

```rust
let x = 1;
let mut y = 2;
y += 1;
```

### `match`<br><span class="zh-inline">`match`</span>

`match` is not just a switch statement. It is a pattern-matching expression and must usually cover every case.<br><span class="zh-inline">`match` 不只是 switch 语句，它是模式匹配表达式，而且通常要求覆盖所有情况。</span>

### `move`<br><span class="zh-inline">`move`</span>

Java developers often underestimate `move`. In Rust it matters whenever values enter closures, threads, or async tasks.<br><span class="zh-inline">很多 Java 开发者会低估 `move` 的重要性。只要值要进入闭包、线程或异步任务，它就立刻变得关键。</span>

Keep this table nearby during the first pass through the book. After a few chapters, most of these keywords become second nature.<br><span class="zh-inline">前几章先把这张表放在手边。读上几章之后，大多数关键字就会自然顺下来了。</span>
