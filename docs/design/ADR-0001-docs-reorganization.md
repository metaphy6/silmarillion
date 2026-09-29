# 📐 ADR-0001: Reorganize root documentation into `docs/design/`

- **Status**: accepted
- **Date**: 2026-09-29
- **Deciders**: @metaphy6
- **Supersedes**: none
- **Superseded by**: none

## Context

Before adopting the agentic-workspace framework, this repo kept every design document, source-reading note, concept-art asset and generated build artifact directly in the project root, by explicit prior convention ("All resources and generated deliverables live directly in this project root"). After scaffolding in `docs/{code,design,project,planning,tracking,guides,reports}/`, the root held 20+ unrelated markdown/data/image files alongside the new framework tree, making it hard for a new contributor or agent to tell authored documentation apart from build inputs and outputs.

## Decision

Move hand-authored design documentation into `docs/design/` (with `reading-notes/`, `concept-art/` and `iterations/` subfolders for the source-reading notes, the Brethil concept-art bundle, and archived report revisions respectively). Keep machine-oriented artifacts at the root: generated deliverables (`silmarillion-game-design-report.pdf`, `hero-balance-roster.json`), hero-kit data inputs (`hero-kits-*.json`), the two build scripts, and vendored source material (`silmarillion.pdf`, `silmarillion-extracted-text.txt`). Updated `build_hero_roster.py` and `build_report.py`'s path defaults to match, and regenerated the roster to confirm the pipeline still resolves correctly.

## Consequences

- ➕ Root now only holds build scripts, data inputs/outputs and vendored source material; `docs/design/` is a single place to browse the actual game design.
- ➕ Matches the `docs/design/README.md` convention already shipped by the agentic-workspace scaffold, instead of inventing a parallel structure.
- ➖ The two build scripts now hard-code one additional path segment (`docs/design/`); a future rename of that folder needs a matching script update.
- 🔁 Fully reversible: `git mv` the files back to root and revert the two path-default edits. No content was deleted, only relocated.

## Considered options

- **Move authored docs into `docs/design/`, keep data/build artifacts and vendored source at root** (chosen) — matches the scaffold's own taxonomy (`docs/design/README.md`: "design docs... live alongside the code they shape") while keeping the build pipeline's root-relative deliverables intact.
- **Leave everything at root** — simplest, but defeats the purpose of scaffolding `docs/` in the first place and leaves 20+ files with no structure.
- **Move everything, including generated PDFs/JSON and hero-kit inputs, into `docs/`** — rejected: blurs the line between hand-authored documentation and build inputs/outputs, and `docs/reports/README.md` explicitly expects generated reports to be dated tool output, not long-lived source data.
