# 📦 Module: `build_report.py`

## Purpose

Render the local Markdown design report ([`docs/design/silmarillion-game-report.md`](../design/silmarillion-game-report.md)) into a typeset PDF (`silmarillion-game-design-report.pdf`) using a small hand-written Markdown parser and ReportLab layout, with no network access.

## Public surface

| Symbol | Kind | Purpose |
|---|---|---|
| `main(argv)` | function | CLI entry point: parses args, parses Markdown, builds and writes the PDF (or validates with `--check`). |
| `parse_markdown(text)` | function | Splits raw Markdown into `Block` / section structures (headings, paragraphs, lists, tables, images, quotes, code, page breaks). |
| `inline(text)` | function | Escapes and translates inline Markdown (bold/italic/code/links) into ReportLab's mini-HTML markup. |
| `build_story(sections, config, styles)` | function | Converts parsed sections into a ReportLab "story" (flowables). |
| `register_fonts()` | function | Registers the DejaVu font family from well-known system paths; raises `FileNotFoundError` if missing. |
| `Config` | dataclass | Page size, margins, body size and source/destination paths for one render. |
| `ReportDocument` | class | `BaseDocTemplate` subclass wiring page templates (cover vs. body) and page numbering. |

## Internals

`main()` reads the source file, calls `parse_markdown` to get a list of sections (each a list of `Block`s), registers fonts, builds paragraph/table/list styles, then `build_story` walks the blocks and appends ReportLab flowables (`Paragraph`, `LongTable`, `Image`, `Preformatted`, ...) to a single story list rendered by `ReportDocument.build()`. A standalone `---` line starts a new page; everything else flows normally within a section. `--check` runs the full parse-and-build pipeline (including font registration) and prints a per-section word count without writing a PDF — it still requires Pillow and ReportLab to be importable, since both are imported at module scope.

## Invariants

- Inputs and outputs default to paths relative to this script's own location (`HERE = Path(__file__).resolve().parent`), not the caller's working directory.
- No network requests are made; local images are measured eagerly with Pillow.
- `--input` and `--output` must resolve to different files (checked in `main()`).

## Tests

- None automated. Verify with `python3 build_report.py --check` (parse-only) and `python3 build_report.py` (full render) after any change — see `README.md`'s Rebuild section.

## Dependencies

- `Pillow` (image measurement) and `reportlab` (PDF layout) — both external; `build_hero_roster.py` has no such dependency (standard library only).
- DejaVu TTF fonts on the host (`/usr/share/fonts/truetype/dejavu`, `/usr/share/fonts/dejavu`, or `~/.fonts`).

## Known issues / future work

- No automated tests; regressions are only caught by manually diffing the rendered PDF or running `--check`.
