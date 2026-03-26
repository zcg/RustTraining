## Performance Comparison and Migration<br><span class="zh-inline">性能比较与迁移</span>

> **What you'll learn:** How to think honestly about JVM performance versus Rust native performance and when migration is actually justified.<br><span class="zh-inline">**本章将学习：** 如何诚实地比较 JVM 性能和 Rust 原生性能，以及什么时候迁移才真的说得过去。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

Rust often wins on startup time, memory footprint, and tail-latency predictability. Java often wins on mature libraries, team familiarity, and framework productivity.<br><span class="zh-inline">Rust 通常在启动时间、内存占用和尾延迟可预测性上更强；Java 则常常在成熟库、团队熟练度和框架生产力上更占优。</span>

## Where Rust Usually Wins<br><span class="zh-inline">Rust 通常更强的地方</span>

- startup time<br><span class="zh-inline">启动时间。</span>
- binary distribution simplicity<br><span class="zh-inline">二进制分发更简单。</span>
- memory footprint<br><span class="zh-inline">内存占用更小。</span>
- predictable latency under load<br><span class="zh-inline">负载下延迟更可预测。</span>

## Where Java Still Holds Up Well<br><span class="zh-inline">Java 依然很能打的地方</span>

- large business systems with mature Spring-based workflows<br><span class="zh-inline">基于 Spring 的大型业务系统。</span>
- teams optimized for JVM tooling and operations<br><span class="zh-inline">已经围绕 JVM 工具和运维体系优化好的团队。</span>
- applications where throughput is fine and developer speed matters more than native efficiency<br><span class="zh-inline">吞吐已经够用，而开发速度比原生效率更重要的应用。</span>

## Migration Rule<br><span class="zh-inline">迁移规则</span>

Benchmark the actual workload before declaring victory. Replace hype with measurements:<br><span class="zh-inline">先测真实负载，再谈胜利。别拿情绪和口号替代测量：</span>

- p50 and p99 latency<br><span class="zh-inline">p50 和 p99 延迟。</span>
- memory use<br><span class="zh-inline">内存占用。</span>
- startup time<br><span class="zh-inline">启动时间。</span>
- deployment complexity<br><span class="zh-inline">部署复杂度。</span>

Rust is strongest when it solves a concrete operational pain, not when it is adopted as an aesthetic preference.<br><span class="zh-inline">Rust 最强的时候，是它在解决一个明确的运行问题，而不是被当成审美选择时。</span>
