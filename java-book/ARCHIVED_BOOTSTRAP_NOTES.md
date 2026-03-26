# Archived Bootstrap Notes

This file is no longer the source of truth for the Java-oriented Rust guide.

The canonical material has been moved into the mdBook chapters under:

- `java-book/src/`
- `java-book/zh/`

The bootstrap concepts that used to live here have been redistributed into the actual book chapters, especially:

- `ch00-introduction.md`
- `ch01-introduction-and-motivation.md`
- `ch02-getting-started.md`
- `ch03-built-in-types-and-variables.md`
- `ch06-enums-and-pattern-matching.md`
- `ch07-ownership-and-borrowing.md`

For future maintenance, edit the chapter files directly and rebuild the site with:

```bash
cargo run -p xtask -- build
```

This archived note remains only to explain why an old bootstrap draft exists in the folder history.
