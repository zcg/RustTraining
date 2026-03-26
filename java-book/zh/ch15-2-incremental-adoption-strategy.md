## Incremental Adoption Strategy<br><span class="zh-inline">渐进式引入策略</span>

> **What you'll learn:** How a Java organization can introduce Rust gradually, which workloads make the best first candidates, and how to sequence skills, tooling, and production rollout.<br><span class="zh-inline">**本章将学习：** Java 团队如何渐进式地把 Rust 引入组织，哪些负载最适合作为第一批目标，以及能力、工具链、生产发布该怎样排顺序。</span>
>
> **Difficulty:** 🟡 Intermediate<br><span class="zh-inline">**难度：** 🟡 中级</span>

The wrong slogan is "rewrite the monolith in Rust."<br><span class="zh-inline">最容易把事情带偏的口号，就是“用 Rust 重写整个单体系统”。</span>

The healthy path is staged adoption:<br><span class="zh-inline">更健康的路径是分阶段引入：</span>

1. learn on contained workloads<br><span class="zh-inline">先在边界清晰的小工作负载上学习。</span>
2. deploy one focused service or worker<br><span class="zh-inline">再上线一个聚焦的服务或 worker。</span>
3. expand only after tooling and operations are stable<br><span class="zh-inline">等工具链和运维流程稳定之后再扩大范围。</span>

## Good First Targets<br><span class="zh-inline">适合作为第一批目标的工作负载</span>

| Candidate<br><span class="zh-inline">候选目标</span> | Why it works well<br><span class="zh-inline">为什么合适</span> |
|---|---|
| CLI or scheduled batch job<br><span class="zh-inline">CLI 或定时批处理任务</span> | easy deployment and rollback<br><span class="zh-inline">部署、回滚都简单</span> |
| CPU-heavy worker<br><span class="zh-inline">CPU 密集型 worker</span> | Rust often wins on latency and memory<br><span class="zh-inline">Rust 在延迟和内存上往往更有优势</span> |
| narrow microservice<br><span class="zh-inline">边界清晰的小型微服务</span> | HTTP or Kafka contract is easy to freeze<br><span class="zh-inline">HTTP 或 Kafka 契约容易冻结</span> |
| gateway or adapter<br><span class="zh-inline">网关或协议适配器</span> | explicit I/O fits Rust well<br><span class="zh-inline">显式 I/O 非常适合 Rust</span> |

Bad first targets usually look like this:<br><span class="zh-inline">不适合作为第一枪的目标通常长这样：</span>

- a huge Spring Boot monolith<br><span class="zh-inline">一个巨大无比的 Spring Boot 单体。</span>
- modules full of reflection and proxy magic<br><span class="zh-inline">充满反射和代理魔法的模块。</span>
- components with weak tests and many owners<br><span class="zh-inline">测试薄弱且多人共同维护的组件。</span>

## Three Common Integration Styles<br><span class="zh-inline">三种常见接入方式</span>

### 1. Separate Service or Sidecar<br><span class="zh-inline">独立服务或 Sidecar</span>

Spring Boot keeps calling over HTTP or gRPC, while Rust owns one focused workload.<br><span class="zh-inline">Spring Boot 继续通过 HTTP 或 gRPC 调用，Rust 则接管一个聚焦的工作负载。</span>

This is usually the best first production move.<br><span class="zh-inline">这通常是最适合作为第一步生产接入的方式。</span>

### 2. Queue Worker<br><span class="zh-inline">队列消费型 Worker</span>

If the organization already uses Kafka or RabbitMQ, a Rust consumer is often even easier than a public HTTP service.<br><span class="zh-inline">如果组织已经用了 Kafka 或 RabbitMQ，那么 Rust 消费者往往比新开一个公共 HTTP 服务还更容易上手。</span>

### 3. JNI or Native Embedding<br><span class="zh-inline">JNI 或原生嵌入</span>

Useful in some cases, but rarely the first step.<br><span class="zh-inline">某些场景里当然有用，但几乎不该作为第一步。</span>

Packaging, debugging, and ownership boundaries all become harder.<br><span class="zh-inline">打包、调试、所有权边界，都会一下子变得更难。</span>

## A 90-Day Plan<br><span class="zh-inline">一个 90 天引入计划</span>

### Days 1-30: Foundation<br><span class="zh-inline">第 1 到 30 天：打基础</span>

- ownership, borrowing, `Result`, and `Option`<br><span class="zh-inline">把所有权、借用、`Result`、`Option` 先学扎实。</span>
- standardize `cargo fmt`, `clippy`, and tests<br><span class="zh-inline">把 `cargo fmt`、`clippy`、测试命令统一下来。</span>
- write small internal exercises<br><span class="zh-inline">写几组内部小练习。</span>

### Days 31-60: One Real Service<br><span class="zh-inline">第 31 到 60 天：做一个真实服务</span>

- choose one bounded workload<br><span class="zh-inline">挑一个边界清晰的工作负载。</span>
- add config, logs, health checks, metrics<br><span class="zh-inline">把配置、日志、健康检查、指标都补齐。</span>
- make sure the team can operate it<br><span class="zh-inline">重点不是能跑，而是团队真能运维它。</span>

### Days 61-90: Expand Carefully<br><span class="zh-inline">第 61 到 90 天：谨慎扩大</span>

- define review checklists<br><span class="zh-inline">定义代码审查清单。</span>
- define crate layout conventions<br><span class="zh-inline">定义 crate 布局规范。</span>
- define error-handling conventions<br><span class="zh-inline">定义错误处理规范。</span>

That is when Rust stops being an experiment and starts becoming an engineering capability.<br><span class="zh-inline">走到这里，Rust 才算从实验品变成了组织真正掌握的工程能力。</span>

## Operational Readiness<br><span class="zh-inline">运维就绪清单</span>

Before expanding Rust usage, the first service should already have:<br><span class="zh-inline">在继续扩展 Rust 之前，第一批服务最好已经具备下面这些能力：</span>

- tracing or structured logging<br><span class="zh-inline">追踪或结构化日志。</span>
- health and readiness endpoints<br><span class="zh-inline">健康检查和就绪探针。</span>
- metrics export<br><span class="zh-inline">指标导出。</span>
- reproducible builds<br><span class="zh-inline">可复现构建。</span>
- integration tests against the real boundary<br><span class="zh-inline">对真实边界的集成测试。</span>

If these are missing, the organization is learning syntax but not learning production engineering.<br><span class="zh-inline">如果这些都没有，那组织学到的只是语法，不是生产工程能力。</span>

