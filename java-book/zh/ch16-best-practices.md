## Best Practices and Reference<br><span class="zh-inline">最佳实践与参考</span>

> **What you'll learn:** The habits that help Java developers write more idiomatic Rust instead of mechanically translating old patterns.<br><span class="zh-inline">**本章将学习：** 哪些习惯能帮助 Java 开发者写出更符合 Rust 气质的代码，而不是机械翻译旧模式。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

## Prefer Explicit Ownership<br><span class="zh-inline">优先写清所有权</span>

Pass borrowed data when ownership is not needed. Return owned data when the caller should keep it.<br><span class="zh-inline">不需要所有权时就传借用，需要调用方长期持有时再返回拥有所有权的值。</span>

## Design Small Public APIs<br><span class="zh-inline">公开 API 尽量小</span>

Default privacy is an advantage. Use it to keep module boundaries narrow.<br><span class="zh-inline">默认私有性是优势，用它把模块边界压窄。</span>

## Model Variants with Enums<br><span class="zh-inline">变体优先考虑 enum</span>

If a Java design would reach for an inheritance hierarchy only to represent alternatives, consider an enum first.<br><span class="zh-inline">如果 Java 设计里那棵继承树只是为了表示几种分支，那在 Rust 里先想 enum。</span>

## Keep Error Types Honest<br><span class="zh-inline">错误类型要诚实</span>

Use domain enums or precise error wrappers instead of hiding everything behind generalized exceptions too early.<br><span class="zh-inline">优先使用领域错误枚举或精确错误包装，不要太早把一切都塞进泛化错误里。</span>

## Use Concrete Types Until Abstraction Is Earned<br><span class="zh-inline">抽象要靠事实争取</span>

Many Java developers abstract too early because frameworks encourage it. In Rust, concrete code often stays cleaner longer.<br><span class="zh-inline">很多 Java 开发者会因为框架文化而过早抽象。Rust 里具体代码通常能更久地保持整洁。</span>

## Let the Compiler Participate<br><span class="zh-inline">让编译器参与设计</span>

Compiler feedback is not just about fixing syntax. It is often feedback on ownership design, borrowing scope, API shape, and error flow.<br><span class="zh-inline">编译器反馈不只是语法纠错，它往往也在反馈所有权设计、借用范围、API 形状和错误流。</span>

Idiomatic Rust usually feels smaller, stricter, and less ceremonial than enterprise Java. That is a feature, not a deficit.<br><span class="zh-inline">符合 Rust 习惯的代码通常比企业 Java 更小、更严、更少仪式感。这是特性，不是短板。</span>
