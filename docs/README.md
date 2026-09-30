# 📚 `docs/`

This folder is the human-readable side of the project. Source of truth for
agents on **what the project is and where it's going**; source of truth for
humans on **the project's design and history**.

## Layout

| Path | Purpose | Audience |
|---|---|---|
| [`code/`](code/) | Module-level documentation (architecture, modules, APIs). | Devs joining the codebase. |
| [`project/`](project/) | The project's charter, decision log, glossary. | New contributors. |
| [`design/`](design/) | Design docs (DESIGN.md) and ADRs. | Reviewers + future-you. |
| [`design/art-direction/`](design/art-direction/README.md) | Shared source-aware visual, narrative and UI/UX resources; [gallery](design/art-direction/gallery/index.html). | Every design/implementation agent + reviewers. |
| [`planning/`](planning/) | The **ROADMAP** — single source of truth for sequenced work. | Agents + humans. |
| [`tracking/`](tracking/) | How the `docs/tracking/tracking.csv` workflow is used. | Agents. |
| [`guides/`](guides/) | Cross-cutting how-tos: agent operating model, model profiles, MCP usage. | Agents + ops. |
| [`reports/`](reports/) | Generated reports (audit, status snapshots). | Reviewers. |
| [`.agents/skills/`](../.agents/skills/) | The **skill library** — load on demand. | Agents. |

## Discoverability rule

Before creating a new doc, search for an existing one. Templates live next
to their READMEs (e.g. [`code/MODULE.template.md`](code/MODULE.template.md)).
Use them.

For Silmarillion art, narrative, maps, assets or UI/UX work, begin with the
[shared entry skill](../.agents/skills/silmarillion-art-direction/SKILL.md).
The package [discovery matrix](design/art-direction/discovery-matrix.md) records
the explicit client and role routes.

## Playable runtime

[Living-world presentation](reports/2026-09-30-living-world.md) records current motion, privacy, compatibility boundaries and the remaining-work sequence.

Start with [Game runtime](guides/GAME_RUNTIME.md) for development commands, the local loop, architecture and static deployment. [Multiplayer](guides/MULTIPLAYER.md) documents managed connectivity, setup and unresolved provider authorization. The [validation report](reports/runtime/VALIDATION.md) owns current results and coverage gaps; the [extended playtest](reports/2026-09-30-extended-playtest.md) records campaign sessions, reproduced defects and corrections; incomplete work remains on the [roadmap](planning/ROADMAP.md).

The [content extraction and provisional tuning](design/runtime-content-notes.md), [ability coverage](design/runtime-ability-notes.md), and [runtime asset provenance](design/runtime-assets.md) separate the playable alpha from the complete revision-6 ambition. Source reports, historical notes and gallery studies remain in their existing locations.
