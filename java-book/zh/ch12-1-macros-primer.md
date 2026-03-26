## Macros Primer<br><span class="zh-inline">宏入门</span>

> **What you'll learn:** Why Rust macros exist, how they differ from Java annotations or code generation, and which macros matter first.<br><span class="zh-inline">**本章将学习：** Rust 宏为什么存在、它和 Java 注解或代码生成有什么差别，以及最先应该认识哪些宏。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Macros in Rust are syntax-level generation tools. They are much closer to language extension points than to Java annotations.<br><span class="zh-inline">Rust 宏是语法级生成工具，它更接近语言扩展点，而不是 Java 注解那一路。</span>

## First Macros to Recognize<br><span class="zh-inline">最先要认熟的宏</span>

- `println!`
- `vec!`
- `format!`
- `dbg!`
- `#[derive(...)]`

## Why Java Developers Should Care<br><span class="zh-inline">Java 开发者为什么要关心</span>

In Java, many conveniences come from frameworks, annotation processors, Lombok-style generation, or reflection. Rust often solves the same ergonomics problem earlier in the compilation pipeline through macros.<br><span class="zh-inline">Java 里很多便利性来自框架、注解处理器、Lombok 式代码生成或者反射。Rust 则经常在更前面的编译阶段通过宏把这件事解决掉。</span>

## Practical Advice<br><span class="zh-inline">实用建议</span>

- learn to read macro invocations before learning to write macros<br><span class="zh-inline">先学会读宏，再学写宏。</span>
- treat derive macros as the normal entry point<br><span class="zh-inline">把 derive 宏当成最自然的入口。</span>
- use `cargo expand` when a macro stops making sense<br><span class="zh-inline">一旦宏看不懂，就用 `cargo expand`。</span>

Macros are powerful, but most day-to-day Rust work only needs comfort with using them, not authoring them.<br><span class="zh-inline">宏确实很强，但绝大多数日常 Rust 开发只需要会用，不需要一上来就自己写。</span>
