# Java → Rust Training Merge Plan

This file is now an archival note for the `java-book` migration work.

## Canonical Source

The authoritative book content now lives in:

- `java-book/src/` for the English edition
- `java-book/zh/` for the bilingual edition

The rendered output is produced by the workspace `xtask` pipeline and appears under:

- `site/java-book/`
- `site/zh/java-book/`

## Status

The earlier merge process started from temporary source notes and manually curated chapter drafts.

That phase is complete.

The current book structure, chapter order, examples, and bilingual presentation should be maintained through the mdBook sources rather than through any standalone scratch document.

## Maintenance Rule

If future edits are needed:

1. modify the chapter files under `src/` and `zh/`
2. rebuild with `cargo run -p xtask -- build`
3. verify the generated pages under `site/`

This file remains only as a small historical marker so the root directory stays understandable.
