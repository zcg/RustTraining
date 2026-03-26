## Inheritance vs Composition<br><span class="zh-inline">继承与组合</span>

> **What you'll learn:** Why Rust favors composition over class inheritance and how Java design patterns change under that pressure.<br><span class="zh-inline">**本章将学习：** 为什么 Rust 明显偏向组合而不是类继承，以及 Java 设计模式在这种压力下会怎么变形。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Rust has no class inheritance. That is not a missing feature by accident; it is a design decision.<br><span class="zh-inline">Rust 没有类继承，这不是漏掉了什么，而是刻意的设计选择。</span>

## What Replaces Inheritance<br><span class="zh-inline">什么东西替代了继承</span>

- traits for shared behavior<br><span class="zh-inline">trait 承载共享行为。</span>
- structs for data ownership<br><span class="zh-inline">struct 承载数据所有权。</span>
- delegation for reuse<br><span class="zh-inline">委托负责复用。</span>
- enums for explicit variant modeling<br><span class="zh-inline">enum 负责显式的分支建模。</span>

## Why This Helps<br><span class="zh-inline">这样做有什么好处</span>

Inheritance-heavy code often mixes state sharing, behavioral polymorphism, and framework convenience into one mechanism. Rust separates those concerns, which can make designs flatter and easier to audit.<br><span class="zh-inline">重继承代码经常把状态共享、行为多态和框架便利性揉进一个机制里。Rust 则会把这些关注点拆开，所以设计通常更扁平，也更容易审计。</span>

## Advice for Java Developers<br><span class="zh-inline">给 Java 开发者的建议</span>

- model behavior with traits<br><span class="zh-inline">行为抽象优先用 trait。</span>
- reuse implementation through helper types and delegation<br><span class="zh-inline">实现复用优先靠辅助类型和委托。</span>
- use enums where inheritance trees only exist to model variants<br><span class="zh-inline">如果继承树只是为了表示“几种变体”，那大概率该换成 enum。</span>

Composition in Rust is usually less magical and more honest about where behavior really lives.<br><span class="zh-inline">Rust 里的组合通常更少魔法，也更诚实地表达“行为到底放在哪”。</span>
