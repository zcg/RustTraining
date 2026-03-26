## Memory Safety Deep Dive<br><span class="zh-inline">内存安全深入解析</span>

> **What you'll learn:** How Rust avoids common memory bugs without a garbage collector and why that changes systems design.<br><span class="zh-inline">**本章将学习：** Rust 如何在没有垃圾回收器的前提下避免常见内存错误，以及这为什么会影响系统设计。</span>
>
> **Difficulty:** 🔴 Advanced<br><span class="zh-inline">**难度：** 🔴 高级</span>

Rust memory safety is not built on runtime object tracing. It is built on ownership rules, borrow checking, lifetimes, and a carefully limited `unsafe` escape hatch.<br><span class="zh-inline">Rust 的内存安全不是靠运行时对象追踪建立起来的，而是靠所有权规则、借用检查、生命周期，以及被严格限制的 `unsafe` 出口共同撑起来的。</span>

## What Rust Tries to Prevent<br><span class="zh-inline">Rust 要拦哪些问题</span>

- use-after-free<br><span class="zh-inline">释放后继续使用。</span>
- double free<br><span class="zh-inline">重复释放。</span>
- data races<br><span class="zh-inline">数据竞争。</span>
- invalid aliasing<br><span class="zh-inline">非法别名。</span>
- null dereference in safe code<br><span class="zh-inline">安全代码里的空指针解引用。</span>

## Why This Matters for Java Developers<br><span class="zh-inline">这对 Java 开发者意味着什么</span>

Java protects against many of these problems through the runtime. Rust shifts more responsibility to compile time, which usually means more work during development and fewer surprises in production.<br><span class="zh-inline">Java 主要靠运行时兜住这些问题，Rust 则把更多责任前移到编译期。通常这意味着开发时更费脑子，但线上惊喜更少。</span>

## Stack and Heap<br><span class="zh-inline">栈与堆</span>

Rust uses both stack and heap, just like Java ultimately does under the hood. The difference is that value layout and ownership are much more visible in user code.<br><span class="zh-inline">Rust 当然也同时使用栈和堆，Java 底层也一样。差别在于 Rust 会把值布局和所有权关系更明显地暴露在用户代码里。</span>

## Safety as a Design Constraint<br><span class="zh-inline">把安全当设计约束</span>

In Rust, APIs often become cleaner because ownership must be obvious. That pressure frequently removes ambiguous lifetimes, hidden caches, and casual shared mutation.<br><span class="zh-inline">在 Rust 里，API 经常会因为“所有权必须明确”而变得更干净。这种压力会顺手清掉很多模糊生命周期、隐藏缓存和随手共享可变状态。</span>

Memory safety in Rust is not a single feature. It is the result of several smaller rules all pushing in the same direction.<br><span class="zh-inline">Rust 的内存安全不是某个单独大招，而是很多小规则一起朝同一个方向使劲的结果。</span>
