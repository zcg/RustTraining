## Migration Patterns and Case Studies<br><span class="zh-inline">迁移模式与案例</span>

> **What you'll learn:** How Java teams usually introduce Rust, which patterns translate cleanly, and where direct one-to-one translation is a trap.<br><span class="zh-inline">**本章将学习：** Java 团队通常怎样引入 Rust、哪些模式转换起来比较顺手，以及哪些地方如果硬做一比一翻译基本都会踩坑。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

The best Java-to-Rust migration is usually selective, not total. Teams get the highest return by moving the parts that benefit most from native performance, memory control, or stronger correctness guarantees.<br><span class="zh-inline">从 Java 迁到 Rust，最好的策略通常都是“选择性迁移”，而不是“整体替换”。真正回报最高的，是那些最吃原生性能、内存控制或强编译期正确性的模块。</span>

## Pattern Mapping<br><span class="zh-inline">模式映射</span>

| Java pattern<br><span class="zh-inline">Java 模式</span> | Rust direction<br><span class="zh-inline">Rust 方向</span> |
|---|---|
| service interface | trait plus concrete implementation<br><span class="zh-inline">trait 加具体实现</span> |
| builder | builder or configuration struct<br><span class="zh-inline">builder 或配置结构体</span> |
| `Optional<T>` | `Option<T>` |
| exception hierarchy<br><span class="zh-inline">异常层级</span> | domain error enum<br><span class="zh-inline">领域错误枚举</span> |
| stream pipeline<br><span class="zh-inline">Stream 流水线</span> | iterator chain<br><span class="zh-inline">迭代器链</span> |
| Spring bean wiring<br><span class="zh-inline">Spring Bean 装配</span> | explicit construction and ownership<br><span class="zh-inline">显式构造与显式所有权</span> |

## What Translates Cleanly<br><span class="zh-inline">哪些东西迁起来比较顺</span>

- DTOs and config types usually map well to Rust structs.<br><span class="zh-inline">DTO 和配置类型通常很容易映射成 Rust struct。</span>
- Validation logic often becomes simpler once null and exception paths are explicit.<br><span class="zh-inline">校验逻辑在空值和错误路径显式化之后，往往会比原来更清爽。</span>
- Data transformation code often improves when rewritten as iterator pipelines.<br><span class="zh-inline">数据转换类代码在改写成迭代器流水线后，通常质量会更好。</span>

## What Usually Needs Redesign<br><span class="zh-inline">哪些地方通常要重做设计</span>

- inheritance-heavy service layers<br><span class="zh-inline">高度依赖继承层级的服务层。</span>
- frameworks that rely on reflection and runtime proxies<br><span class="zh-inline">严重依赖反射和运行时代理的框架式写法。</span>
- dependency injection patterns built around containers instead of explicit ownership<br><span class="zh-inline">围绕容器展开、而不是围绕显式所有权展开的依赖注入模式。</span>
- large exception hierarchies used as ambient control flow<br><span class="zh-inline">把大型异常层级当成隐式控制流来使用的写法。</span>

## Case Study 1: Native Helper Library<br><span class="zh-inline">案例一：原生辅助库</span>

A Java service keeps its core business logic on the JVM but calls a Rust library for parsing, compression, or protocol processing. This is often the lowest-friction starting point because the Java service boundary remains stable while the hot path moves to native code.<br><span class="zh-inline">一种很常见的路线是：主业务逻辑继续留在 JVM 上，只把解析、压缩、协议处理之类的热点路径交给 Rust 库。这类起点通常摩擦最小，因为 Java 服务边界保持稳定，但性能热点已经转移到了原生层。</span>

## Case Study 2: Replace a CLI or Background Agent<br><span class="zh-inline">案例二：替换 CLI 或后台 agent</span>

Command-line tools, migration helpers, log processors, and small background agents are ideal Rust candidates. They benefit from:<br><span class="zh-inline">命令行工具、迁移辅助程序、日志处理器、小型后台 agent 这些东西，通常都很适合先交给 Rust：</span>

- tiny deployment footprint<br><span class="zh-inline">部署体积小。</span>
- predictable memory use<br><span class="zh-inline">内存使用可预测。</span>
- easy static linking in container-heavy environments<br><span class="zh-inline">在容器密集环境里更容易做静态交付。</span>

## Case Study 3: Move a Gateway or Edge Component<br><span class="zh-inline">案例三：迁移网关或边缘组件</span>

Teams sometimes rewrite a proxy, rate limiter, or stream processor in Rust while the rest of the platform stays in Java. This works well when tail latency and resource efficiency matter more than framework convenience.<br><span class="zh-inline">还有一条路线是把代理、限流器、流处理器这类边缘组件改成 Rust，而平台主体继续保留在 Java。只要关注点在尾延迟和资源效率，这种拆法通常很划算。</span>

## Migration Rules That Save Pain<br><span class="zh-inline">真正能省事的迁移规则</span>

1. Move a boundary, not an entire monolith.<br><span class="zh-inline">迁移一个边界，不要试图一口吞掉整个单体。</span>
2. Pick one success metric up front: latency, memory, startup time, or bug class elimination.<br><span class="zh-inline">先选定一个成功指标，比如延迟、内存、启动时间，或者某类 bug 的消失。</span>
3. Keep serialization formats and contracts stable during the first migration phase.<br><span class="zh-inline">第一阶段尽量保持序列化格式和接口契约稳定。</span>
4. Let Rust own the components that benefit from stronger invariants.<br><span class="zh-inline">让 Rust 去接管那些最依赖强约束的模块。</span>
5. Do not translate Java framework patterns blindly; redesign them around traits, enums, and explicit construction.<br><span class="zh-inline">别把 Java 框架模式生搬硬套过来，要围绕 trait、enum 和显式构造去重新组织。</span>

## A Good First Project<br><span class="zh-inline">一个合适的第一站项目</span>

Pick one of these:<br><span class="zh-inline">下面几类都很适合作为第一站：</span>

- a parser or validator library<br><span class="zh-inline">解析器或校验器库。</span>
- a CLI tool currently written in Java<br><span class="zh-inline">当前由 Java 编写的命令行工具。</span>
- a background worker that spends most of its time transforming bytes or JSON<br><span class="zh-inline">主要工作是处理字节流或 JSON 的后台 worker。</span>
- an edge-facing network component with strict latency goals<br><span class="zh-inline">对延迟目标要求严格的边缘网络组件。</span>

That path teaches Cargo, ownership, error handling, testing, and deployment without forcing the whole organization into a risky rewrite.<br><span class="zh-inline">这条路能把 Cargo、所有权、错误处理、测试和部署全都带一遍，同时又不用把整个组织拖进高风险重写里。</span>
