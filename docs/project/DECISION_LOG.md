# 🗳 Decision log

Append-only log of **meta-decisions** about the project. Code-level
architectural decisions go in [`../design/`](../design/) as ADRs.

| # | Date | Decision | Context | Consequence | Owner |
|---|---|---|---|---|---|
| 0001 | 2026-09-29 | Adopt the agentic-workspace operating framework (`AGENTS.md`, tracking log, `make git`) | Repo had no cross-assistant operating rules; multiple AI agents needed one consistent set of conventions | Agents now log work to `docs/tracking/tracking.csv` and stage via `git add -A`; only the human runs `make git` to commit/push | @metaphy6 |
| 0002 | 2026-09-29 | Move authored design documentation into `docs/design/` (plus `reading-notes/`, `concept-art/`, `iterations/` subfolders); keep generated deliverables, hero-kit JSON inputs and vendored source material at the repo root | Root held 20+ mixed markdown/data/asset files with no structure, per the agentic-workspace scaffold's `docs/` layout | `README.md`, `build_hero_roster.py` and `build_report.py` path defaults updated to match; see [`docs/design/ADR-0001-docs-reorganization.md`](../design/ADR-0001-docs-reorganization.md) | @metaphy6 |

## Rules

- **Append-only.** Reversing a decision = a new row that references the prior one.
- **One line per decision.** Anything longer becomes an ADR in `docs/design/`.
- **Owner is a real person**, not a team — the human accountable for living with the consequence.
