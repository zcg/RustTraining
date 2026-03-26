## True Immutability vs Record Illusions<br><span class="zh-inline">真正的不可变性与 record 幻觉</span>

> **What you'll learn:** Why Java records are useful but not deeply immutable by default, and how Rust's default immutability changes the design conversation.<br><span class="zh-inline">**本章将学习：** 为什么 Java record 很有用，但默认并不等于深度不可变，以及 Rust 的默认不可变性会怎样改变设计讨论。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Java records reduce boilerplate, but they do not automatically guarantee deep immutability.<br><span class="zh-inline">Java record 确实能大幅减少样板代码，但它并不会自动保证深度不可变。</span>

## The Java Record Caveat<br><span class="zh-inline">Java record 的限制</span>

```java
record UserProfile(String name, List<String> tags) {}
```

The `tags` reference is final, but the list behind it can still mutate unless the code deliberately wraps or copies it.<br><span class="zh-inline">这里 `tags` 引用本身是 final，但后面的列表内容依然可能变化，除非显式包裹或拷贝。</span>

## Rust's Default Position<br><span class="zh-inline">Rust 的默认立场</span>

```rust
struct UserProfile {
    name: String,
    tags: Vec<String>,
}
```

If the binding is immutable, mutation is blocked unless a mutable binding or a special interior mutability type is involved.<br><span class="zh-inline">如果绑定本身不可变，那么修改动作就会被拦住，除非显式使用可变绑定，或者引入内部可变性类型。</span>

## What This Means in Practice<br><span class="zh-inline">落到实践里的差别</span>

| Concern<br><span class="zh-inline">关注点</span> | Java record | Rust struct |
|---|---|---|
| shallow immutability<br><span class="zh-inline">浅层不可变</span> | common<br><span class="zh-inline">常见</span> | common<br><span class="zh-inline">常见</span> |
| deep immutability<br><span class="zh-inline">深度不可变</span> | manual design choice<br><span class="zh-inline">靠设计保证</span> | manual design choice<br><span class="zh-inline">也靠设计保证</span> |
| mutation signal<br><span class="zh-inline">修改信号</span> | often hidden behind references<br><span class="zh-inline">常藏在引用背后</span> | explicit through `mut` or interior mutability<br><span class="zh-inline">通过 `mut` 或内部可变性显式出现</span> |

Rust does not magically make every data structure deeply immutable, but it makes mutation far easier to spot.<br><span class="zh-inline">Rust 也不会魔法般地让所有数据结构都变成深度不可变，但它确实让“哪里会变”更容易被看出来。</span>

## Design Guidance<br><span class="zh-inline">设计建议</span>

- treat Java records as concise carriers, not as proof of immutability<br><span class="zh-inline">把 Java record 当成简洁的数据载体，不要把它误当成不可变证明。</span>
- in Rust, start immutable and add `mut` only where required<br><span class="zh-inline">在 Rust 里先从不可变开始，再在必要处加 `mut`。</span>
- if mutation must cross shared boundaries, make that choice obvious in the type design<br><span class="zh-inline">如果可变状态必须跨共享边界存在，就让这种选择在类型设计里足够显眼。</span>

The useful lesson is not “records are bad.” The useful lesson is that Rust defaults push teams toward more explicit state transitions.<br><span class="zh-inline">真正有价值的结论不是“record 不好”，而是 Rust 的默认值会把团队推向更明确的状态转换设计。</span>
