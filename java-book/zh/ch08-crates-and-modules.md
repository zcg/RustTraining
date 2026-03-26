## Crates and Modules<br><span class="zh-inline">crate 与模块</span>

> **What you'll learn:** How Rust code organization maps to Java packages, modules, and artifacts.<br><span class="zh-inline">**本章将学习：** Rust 的代码组织方式，如何对应 Java 的 package、module 和构建产物。</span>
>
> **Difficulty:** 🟢 Beginner<br><span class="zh-inline">**难度：** 🟢 初级</span>

Rust organizes code around crates and modules rather than packages and classpaths.<br><span class="zh-inline">Rust 围绕 crate 和模块组织代码，而不是围绕 package 和 classpath。</span>

## Mental Mapping<br><span class="zh-inline">心智映射</span>

| Java idea<br><span class="zh-inline">Java 概念</span> | Rust idea<br><span class="zh-inline">Rust 概念</span> |
|---|---|
| artifact or module<br><span class="zh-inline">产物或模块</span> | crate |
| package | module tree<br><span class="zh-inline">模块树</span> |
| package-private or public API<br><span class="zh-inline">包级或公开 API</span> | module privacy plus `pub`<br><span class="zh-inline">模块私有性加 `pub`</span> |

## Basic Layout<br><span class="zh-inline">基本结构</span>

```text
src/
├── main.rs
├── lib.rs
├── api.rs
└── model/
    └── user.rs
```

## Visibility<br><span class="zh-inline">可见性</span>

- items are private by default<br><span class="zh-inline">默认私有。</span>
- `pub` exposes an item more broadly<br><span class="zh-inline">`pub` 让条目向更外层暴露。</span>
- `pub(crate)` exposes within the current crate<br><span class="zh-inline">`pub(crate)` 只在当前 crate 内可见。</span>

This default privacy is stricter than typical Java codebases and often leads to cleaner boundaries.<br><span class="zh-inline">这种默认私有性通常比常见 Java 代码库更严格，但也经常能逼出更干净的边界。</span>

## Guidance<br><span class="zh-inline">建议</span>

- keep module trees shallow at first<br><span class="zh-inline">前期模块树不要搞太深。</span>
- design crate boundaries around ownership of concepts, not around arbitrary layering<br><span class="zh-inline">crate 边界围绕概念归属来设计，不要只按机械分层切。</span>
- expose a small public API and keep the rest internal<br><span class="zh-inline">公开 API 尽量小，其余内容尽量内部化。</span>

Crates and modules are simpler than many Java build layouts, but they reward deliberate boundary design.<br><span class="zh-inline">crate 与模块比很多 Java 构建布局都简单，但它很奖励那种边界清楚的设计方式。</span>
