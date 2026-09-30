# Silmarillion strategy game — playable browser alpha

A runnable Phaser + TypeScript + Vite strategy alpha with an independent turn simulation, local AI, checkpoint saves and optional private WebRTC matches. The default scenario is **Cross-era sandbox**; the 55 starting profiles represent 54 factions, including one Melkor identity with two mutually exclusive doctrines.

**The full game request is not complete.** All profiles are selectable, but 107 of 110 powers have command routes (36 dispatcher handlers and 71 dedicated routes), with incomplete target scope and passives, representative provisional production rather than full economic trees, shared portrait studies and procedural figures, and no finished narrative system. See the [runtime guide](docs/guides/GAME_RUNTIME.md), [ability coverage](docs/design/runtime-ability-notes.md) and [validation report](docs/reports/runtime/VALIDATION.md).

## Run the game

Use Node.js 22.12 or newer and npm.

```bash
npm ci
npm run dev
```

Open the local address printed by Vite. No multiplayer credentials are needed for local play. Choose a profile, begin the sandbox and follow the tutorial. The [runtime guide](docs/guides/GAME_RUNTIME.md) covers controls, verification, architecture and static deployment.

```bash
npm run typecheck
npm run lint
npm test
npm run build
# With the local Vite server running and a configured browser executable:
npm run test:browser
```

Publish only the generated `dist/` directory to static HTTPS hosting; never publish the repository root. Managed signaling/TURN setup and the unresolved scoped-credential dependency are described in [Multiplayer](docs/guides/MULTIPLAYER.md). No deployment or purchase is performed by these commands.

> Working in this repo with an AI coding agent? Read [`AGENTS.md`](AGENTS.md) first.

Generated build deliverables (PDF, JSON roster) and the hero-kit/data inputs live directly in this project root — there is no `output` directory. Authored design documentation lives under [`docs/design/`](docs/design/); see [`docs/README.md`](docs/README.md) for the full documentation map.

## Current design

- [Design report](docs/design/silmarillion-game-report.md) and [PDF edition](silmarillion-game-design-report.pdf): revision 6 is the current design.
- [Hero powers and counters](docs/design/hero-balance-roster.md) and [structured roster](hero-balance-roster.json): 55 starting profiles across 54 factions, including Melkor's two mutually exclusive doctrines.
- Five named Istari (Gandalf, Saruman, Radagast, Alatar and Pallando) supplement the five generic orders; each faction has one hero. The two Blue Wizards are separate selections.
- `hero-kits-valar-v5.json`, `hero-kits-peoples-v5.json`, `hero-kits-other-v5.json` and `hero-kits-named-istari-v6.json` are the hero-kit inputs. Melkor's two profiles are defined in `build_hero_roster.py`.

These rules are proposed designs, not evidence of validated competitive balance.

## Shared visual and interaction direction

Every agent working on art, narrative, maps, assets or UI/UX starts with
[`silmarillion-art-direction`](.agents/skills/silmarillion-art-direction/SKILL.md).
The [resource package](docs/design/art-direction/README.md) contains the source
hierarchy, research ledger, visual and narrative rules, faction/profile matrix,
UI states, portable tokens, asset specifications, templates and review gates.
Inspect the [original visual gallery](docs/design/art-direction/gallery/index.html)
for conceptual screen examples and the
[verification record](docs/design/art-direction/verification.md) for measured
results and remaining checks.

The roster combines identities from different eras; scenarios must label their
chronology and sandbox geography. Phaser, TypeScript and Vite now implement the browser alpha requested by the
[saved implementation handoff](docs/project/INITIATE.md). The gallery remains a
design study; runtime assets and their limitations are recorded in the
[asset provenance](docs/design/runtime-assets.md).

## Source material and artwork

- [Supplied book](silmarillion.pdf) and [retained extracted text](silmarillion-extracted-text.txt) stay at the project root as vendored reference material.
- [`docs/design/reading-notes/`](docs/design/reading-notes/) contains the source-reading notes (`reading-*.md`).
- [Brethil concept art](docs/design/concept-art/brethil-isometric-concept.png), [art notes](docs/design/concept-art/brethil-concept-readme.md) and [generation prompt](docs/design/concept-art/concept-prompt.txt).

The reading notes retain historical references to temporary inspection files that had already been removed before this repository migration.

## Earlier work

[`docs/design/iterations/`](docs/design/iterations/) holds `silmarillion-game-report-v1.md` through `silmarillion-game-report-v5.md` and their matching `silmarillion-game-design-report-v*.pdf` files, preserving earlier revisions. Their rules may be superseded by revision 6. Historical PDFs retain their original wording; archived Markdown links have been adjusted to match the current layout. [`docs/design/`](docs/design/) also holds `design-notes-*.md`, supporting drafts rather than current rules. The older fifty hero profiles remain unchanged while their offensive redesign is pending; the five named Wizard kits are new proposals.

## Rebuild design deliverables

Use Python 3 with Pillow and ReportLab installed. The hero roster builder uses only the Python standard library.

```bash
python3 build_hero_roster.py
python3 build_report.py --check
python3 build_report.py
```

Both builders resolve inputs and destinations relative to their own location, so they also work when invoked from another directory. The design report source lives at `docs/design/silmarillion-game-report.md`; the current PDF and JSON roster are written at the project root.
