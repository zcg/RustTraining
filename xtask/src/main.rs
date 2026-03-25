use std::env;
use std::fs;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::Command;

/// (slug, title_en, title_zh, desc_en, desc_zh, category)
const BOOKS: &[(&str, &str, &str, &str, &str, &str)] = &[
    (
        "c-cpp-book",
        "Rust for C/C++ Programmers",
        "Rust 面向 C/C++ 程序员",
        "Move semantics, RAII, FFI, embedded, no_std",
        "移动语义、RAII、FFI、嵌入式与 no_std",
        "bridge",
    ),
    (
        "csharp-book",
        "Rust for C# Programmers",
        "Rust 面向 C# 程序员",
        "Best for Swift / C# / Java developers",
        "适合 Swift / C# / Java 开发者",
        "bridge",
    ),
    (
        "python-book",
        "Rust for Python Programmers",
        "Rust 面向 Python 程序员",
        "Dynamic → static typing, GIL-free concurrency",
        "从动态类型走向静态类型，摆脱 GIL 的并发",
        "bridge",
    ),
    (
        "async-book",
        "Async Rust: From Futures to Production",
        "Async Rust：从 Future 到生产环境",
        "Tokio, streams, cancellation safety",
        "Tokio、流与取消安全",
        "deep-dive",
    ),
    (
        "rust-patterns-book",
        "Rust Patterns",
        "Rust 模式精讲",
        "Pin, allocators, lock-free structures, unsafe",
        "Pin、分配器、无锁结构与 unsafe",
        "advanced",
    ),
    (
        "type-driven-correctness-book",
        "Type-Driven Correctness",
        "类型驱动的正确性",
        "Type-state, phantom types, capability tokens",
        "类型状态、幻类型与能力令牌",
        "expert",
    ),
    (
        "engineering-book",
        "Rust Engineering Practices",
        "Rust 工程实践",
        "Build scripts, cross-compilation, coverage, CI/CD",
        "构建脚本、交叉编译、覆盖率与 CI/CD",
        "practices",
    ),
];

fn project_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("xtask must live in a workspace subdirectory")
        .to_path_buf()
}

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    match args.first().map(|s| s.as_str()) {
        Some("build") => cmd_build(),
        Some("serve") => {
            cmd_build();
            cmd_serve();
        }
        Some("deploy") => cmd_deploy(),
        Some("clean") => cmd_clean(),
        Some("--help" | "-h" | "help") | None => print_usage(0),
        Some(other) => {
            eprintln!("Unknown command: {other}\n");
            print_usage(1);
        }
    }
}

fn print_usage(code: i32) {
    let stream: &mut dyn Write = if code == 0 {
        &mut std::io::stdout()
    } else {
        &mut std::io::stderr()
    };
    let _ = writeln!(
        stream,
        "\
Usage: cargo xtask <COMMAND>

Commands:
  build    Build all books into site/ (for local preview)
  serve    Build and serve at http://localhost:3000
  deploy   Build all books into docs/ (for GitHub Pages)
  clean    Remove site/ and docs/ directories"
    );
    std::process::exit(code);
}

// ── build ────────────────────────────────────────────────────────────

fn cmd_build() {
    build_to("site");
}

fn cmd_deploy() {
    build_to("docs");
    println!("\nTo publish, commit docs/ and enable GitHub Pages → \"Deploy from a branch\" → /docs.");
}

fn build_to(dir_name: &str) {
    let root = project_root();
    let out = root.join(dir_name);

    if out.exists() {
        fs::remove_dir_all(&out).expect("failed to clean output dir");
    }
    fs::create_dir_all(&out).expect("failed to create output dir");

    println!("Building unified site into {dir_name}/\n");

    let mut ok = 0u32;
    let mut zh_ok = 0u32;
    fs::create_dir_all(out.join("zh")).expect("failed to create zh output dir");

    for &(slug, title_en, title_zh, _, _, _) in BOOKS {
        let book_dir = root.join(slug);
        if !book_dir.is_dir() {
            eprintln!("  ✗ {slug}/ not found, skipping");
            continue;
        }
        let dest = out.join(slug);
        if run_mdbook(&book_dir, &dest, &[]) {
            println!("  ✓ {slug}");
            ok += 1;
        } else {
            eprintln!("  ✗ {slug} FAILED");
        }

        let zh_src = book_dir.join("zh");
        if !zh_src.is_dir() {
            eprintln!("  ✗ {slug}/zh not found, skipping bilingual build");
            continue;
        }

        let zh_dest = out.join("zh").join(slug);
        let zh_env = vec![
            ("MDBOOK_BOOK__SRC", "zh".to_string()),
            (
                "MDBOOK_BOOK__TITLE",
                format!("{title_en} | {title_zh}"),
            ),
            ("MDBOOK_BOOK__LANGUAGE", "zh-CN".to_string()),
        ];

        if run_mdbook(&book_dir, &zh_dest, &zh_env) {
            println!("  ✓ zh/{slug}");
            zh_ok += 1;
        } else {
            eprintln!("  ✗ zh/{slug} FAILED");
        }
    }
    println!(
        "\n  {ok}/{} English books built\n  {zh_ok}/{} bilingual books built",
        BOOKS.len(),
        BOOKS.len()
    );

    write_landing_page(&out);
    println!("\nDone! Output in {dir_name}/");
}

fn category_label(cat: &str) -> &str {
    match cat {
        "bridge" => "Bridge",
        "deep-dive" => "Deep Dive",
        "advanced" => "Advanced",
        "expert" => "Expert",
        "practices" => "Practices",
        _ => cat,
    }
}

fn category_label_zh(cat: &str) -> &str {
    match cat {
        "bridge" => "跨语言入门",
        "deep-dive" => "专题深入",
        "advanced" => "高级主题",
        "expert" => "专家主题",
        "practices" => "工程实践",
        _ => cat,
    }
}

fn run_mdbook(book_dir: &Path, dest: &Path, envs: &[(&str, String)]) -> bool {
    let mut command = Command::new("mdbook");
    command
        .args(["build", "--dest-dir"])
        .arg(dest)
        .current_dir(book_dir);

    for (key, value) in envs {
        command.env(key, value);
    }

    command
        .status()
        .expect("failed to run mdbook — is it installed?")
        .success()
}

fn write_landing_page(site: &Path) {
    let cards: String = BOOKS
        .iter()
        .map(|&(slug, title_en, title_zh, desc_en, desc_zh, cat)| {
            let label_en = category_label(cat);
            let label_zh = category_label_zh(cat);
            format!(
                r#"    <article class="card cat-{cat}">
      <h2>{title_en}<span class="label">{label_en}</span></h2>
      <p class="title-zh">{title_zh}<span class="label label-zh">{label_zh}</span></p>
      <p>{desc_en}</p>
      <p class="desc-zh">{desc_zh}</p>
      <div class="card-links">
        <a class="card-link" href="{slug}/">English</a>
        <a class="card-link bilingual" href="zh/{slug}/">中英对照</a>
      </div>
    </article>"#
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let html = format!(
        r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rust Training Books</title>
  <style>
    :root {{
      --bg: #1a1a2e;
      --card-bg: #16213e;
      --accent: #e94560;
      --text: #eee;
      --muted: #a8a8b3;
      --clr-bridge: #4ade80;
      --clr-deep-dive: #22d3ee;
      --clr-advanced: #fbbf24;
      --clr-expert: #c084fc;
      --clr-practices: #2dd4bf;
    }}
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1rem;
    }}
    h1 {{ font-size: 2.5rem; margin-bottom: 0.5rem; }}
    h1 span {{ color: var(--accent); }}
    .subtitle {{ color: var(--muted); font-size: 1.1rem; margin-bottom: 1.2rem; text-align: center; line-height: 1.55; }}
    .hero-links {{
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.8rem;
      margin-bottom: 2.2rem;
    }}
    .hero-link {{
      text-decoration: none;
      color: var(--text);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 999px;
      padding: 0.55rem 0.95rem;
      font-size: 0.9rem;
      transition: background 0.15s, border-color 0.15s, transform 0.15s;
    }}
    .hero-link:hover {{
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.26);
      transform: translateY(-1px);
    }}

    /* Legend */
    .legend {{
      display: flex; flex-wrap: wrap; gap: 0.6rem 1.4rem;
      justify-content: center; margin-bottom: 2.2rem;
      font-size: 0.8rem; color: var(--muted);
    }}
    .legend-item {{ display: flex; align-items: center; gap: 0.35rem; }}
    .legend-dot {{
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    }}

    /* Grid & Cards */
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      max-width: 1000px;
      width: 100%;
    }}
    .card {{
      background: var(--card-bg);
      border-radius: 12px;
      padding: 1.5rem 1.5rem 1.5rem 1.25rem;
      color: var(--text);
      transition: transform 0.15s, box-shadow 0.15s;
      border: 1px solid rgba(255,255,255,0.05);
      border-left: 4px solid var(--stripe);
    }}
    .card:hover {{
      transform: translateY(-4px);
      box-shadow: 0 8px 25px color-mix(in srgb, var(--stripe) 30%, transparent);
      border-color: rgba(255,255,255,0.08);
      border-left-color: var(--stripe);
    }}
    .card h2 {{ font-size: 1.2rem; margin-bottom: 0.3rem; display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }}
    .card p  {{ color: var(--muted); font-size: 0.9rem; line-height: 1.4; }}
    .title-zh {{ color: var(--text); font-size: 0.98rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }}
    .desc-zh {{ margin-top: 0.3rem; margin-bottom: 1rem; }}
    .card-links {{ display: flex; gap: 0.75rem; margin-top: 1rem; }}
    .card-link {{
      text-decoration: none;
      color: var(--text);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 999px;
      padding: 0.45rem 0.8rem;
      font-size: 0.84rem;
      transition: background 0.15s, border-color 0.15s;
    }}
    .card-link:hover {{ background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.22); }}
    .card-link.bilingual {{ background: color-mix(in srgb, var(--stripe) 18%, transparent); border-color: color-mix(in srgb, var(--stripe) 55%, rgba(255,255,255,0.2)); }}

    /* Category colours */
    .cat-bridge     {{ --stripe: var(--clr-bridge); }}
    .cat-deep-dive  {{ --stripe: var(--clr-deep-dive); }}
    .cat-advanced   {{ --stripe: var(--clr-advanced); }}
    .cat-expert     {{ --stripe: var(--clr-expert); }}
    .cat-practices  {{ --stripe: var(--clr-practices); }}

    /* Label pill */
    .label {{
      font-size: 0.55rem; font-weight: 700; letter-spacing: 0.08em;
      text-transform: uppercase; padding: 0.15em 0.55em;
      border-radius: 4px; white-space: nowrap; flex-shrink: 0;
      color: var(--bg); background: var(--stripe);
    }}
    .label-zh {{
      text-transform: none;
      letter-spacing: 0.04em;
    }}

    footer {{ margin-top: 3rem; color: var(--muted); font-size: 0.85rem; text-align: center; line-height: 1.7; }}
    footer a {{ color: var(--accent); }}
  </style>
</head>
<body>
  <h1>🦀 <span>Rust</span> Training Books</h1>
  <p class="subtitle">Pick the guide that matches your background<br>选择符合当前背景的教程</p>
  <div class="hero-links">
    <a class="hero-link" href="https://github.com/zcg/RustTraining">Fork Repository</a>
    <a class="hero-link" href="https://github.com/zcg/RustTraining">GitHub 预览与源码</a>
  </div>

  <div class="legend">
    <span class="legend-item"><span class="legend-dot" style="background:var(--clr-bridge)"></span> Bridge &mdash; learn Rust from another language<br>Bridge：从其他语言迁移到 Rust</span>
    <span class="legend-item"><span class="legend-dot" style="background:var(--clr-deep-dive)"></span> Deep Dive<br>专题深入</span>
    <span class="legend-item"><span class="legend-dot" style="background:var(--clr-advanced)"></span> Advanced<br>高级主题</span>
    <span class="legend-item"><span class="legend-dot" style="background:var(--clr-expert)"></span> Expert<br>专家主题</span>
    <span class="legend-item"><span class="legend-dot" style="background:var(--clr-practices)"></span> Practices<br>工程实践</span>
  </div>

  <div class="grid">
{cards}
  </div>
  <footer>
    双语翻译与对照排版由 GPT-5.4 提供，感谢 <a href="https://openai.com/">OpenAI</a><br>
    项目主页与后续更新以 <a href="https://github.com/zcg/RustTraining">https://github.com/zcg/RustTraining</a> 为准<br>
    Built with <a href="https://rust-lang.github.io/mdBook/">mdBook</a> · 首页提供英文原版与中英对照入口
  </footer>
</body>
</html>
"##
    );

    let path = site.join("index.html");
    fs::write(&path, html).expect("failed to write index.html");
    println!("  ✓ index.html");
}

// ── serve ────────────────────────────────────────────────────────────

fn cmd_serve() {
    let site = project_root().join("site");
    let addr = "127.0.0.1:3000";
    let listener = TcpListener::bind(addr).expect("failed to bind port 3000");

    // Handle Ctrl+C gracefully so cargo doesn't report an error
    ctrlc_exit();

    println!("\nServing at http://{addr}  (Ctrl+C to stop)");

    for stream in listener.incoming() {
        let Ok(mut stream) = stream else { continue };
        let mut buf = [0u8; 4096];
        let n = stream.read(&mut buf).unwrap_or(0);
        let request = String::from_utf8_lossy(&buf[..n]);

        let path = request
            .lines()
            .next()
            .and_then(|line| line.split_whitespace().nth(1))
            .unwrap_or("/");

        let mut file_path = site.join(path.trim_start_matches('/'));
        if file_path.is_dir() {
            file_path = file_path.join("index.html");
        }

        if file_path.is_file() {
            let body = fs::read(&file_path).unwrap_or_default();
            let mime = guess_mime(&file_path);
            let header = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: {mime}\r\nContent-Length: {}\r\n\r\n",
                body.len()
            );
            let _ = stream.write_all(header.as_bytes());
            let _ = stream.write_all(&body);
        } else {
            let body = b"404 Not Found";
            let header = format!(
                "HTTP/1.1 404 Not Found\r\nContent-Length: {}\r\n\r\n",
                body.len()
            );
            let _ = stream.write_all(header.as_bytes());
            let _ = stream.write_all(body);
        }
    }
}

/// Install a Ctrl+C handler that exits cleanly (code 0) instead of
/// letting the OS terminate with STATUS_CONTROL_C_EXIT.
fn ctrlc_exit() {
    unsafe {
        libc_set_handler();
    }
}

#[cfg(windows)]
unsafe fn libc_set_handler() {
    // SetConsoleCtrlHandler via the Windows API
    extern "system" {
        fn SetConsoleCtrlHandler(
            handler: Option<unsafe extern "system" fn(u32) -> i32>,
            add: i32,
        ) -> i32;
    }
    unsafe extern "system" fn handler(_ctrl_type: u32) -> i32 {
        std::process::exit(0);
    }
    unsafe {
        SetConsoleCtrlHandler(Some(handler), 1);
    }
}

#[cfg(not(windows))]
unsafe fn libc_set_handler() {
    // On Unix, register SIGINT via libc
    extern "C" {
        fn signal(sig: i32, handler: extern "C" fn(i32)) -> usize;
    }
    extern "C" fn handler(_sig: i32) {
        std::process::exit(0);
    }
    unsafe {
        signal(2 /* SIGINT */, handler);
    }
}

fn guess_mime(path: &Path) -> &'static str {
    match path.extension().and_then(|e| e.to_str()) {
        Some("html") => "text/html; charset=utf-8",
        Some("css") => "text/css",
        Some("js") => "application/javascript",
        Some("svg") => "image/svg+xml",
        Some("png") => "image/png",
        Some("jpg" | "jpeg") => "image/jpeg",
        Some("woff2") => "font/woff2",
        Some("woff") => "font/woff",
        Some("json") => "application/json",
        _ => "application/octet-stream",
    }
}

// ── clean ────────────────────────────────────────────────────────────

fn cmd_clean() {
    let root = project_root();
    for dir_name in ["site", "docs"] {
        let dir = root.join(dir_name);
        if dir.exists() {
            fs::remove_dir_all(&dir).expect("failed to remove dir");
            println!("Removed {dir_name}/");
        }
    }
}
