# 📜 Charter: Silmarillion strategy game design

## Vision

A single-player isometric narrative strategy game set during the wars of Beleriand, where painterly, immense landscapes dwarf small expressive figures and every playable faction has its own economy, hero and way of preserving what it loves.

## Scope (in)

- A revision-controlled design report ([`docs/design/silmarillion-game-report.md`](../design/silmarillion-game-report.md)) defining 54 playable factions across Valar, peoples, Istari and Melkor.
- A starting hero kit per faction (55 profiles: [`docs/design/hero-balance-roster.md`](../design/hero-balance-roster.md) / `hero-balance-roster.json`), each with two signature powers, a passive, a compensated weakness and a retained weakness.
- Source-reading notes and concept art that ground the design in the source material without reproducing it.
- Reproducible build tooling (`build_hero_roster.py`, `build_report.py`) that regenerates the roster and a typeset PDF from the Markdown sources.

## Scope (out)

- A playable prototype or game-engine implementation — this repo is design documentation and build tooling only.
- Validated competitive balance — the roster is a proposed starting point; no playtesting has happened yet.
- Full combat statistics for the older fifty hero profiles — their offensive redesign is pending and tracked separately.
- Reproducing the source novel — `silmarillion.pdf` / `silmarillion-extracted-text.txt` are retained as private reference material, not for redistribution.

## Audience

- **Primary**: the designer(s) iterating on faction and hero balance and the narrative pitch.
- **Secondary**: AI coding agents (Copilot, Claude, Codex) helping draft, rebalance and typeset the design.
- **Operators**: whoever runs `build_hero_roster.py` / `build_report.py` to regenerate the roster and PDF — no hosted service exists.

## Success criteria

- The current revision's report and hero roster are internally consistent (`build_hero_roster.py`'s assertions pass) and render cleanly to PDF.
- A new reader can find the current design, its history and its source material within one glance at `README.md` and `docs/design/`.
- Every hero profile documents cost, range, duration and counterplay for both of its signature powers — no power is undocumented or uncounterable.

## Non-goals & explicit trade-offs

- Prose clarity and internal consistency take priority over exhaustive combat-stat completeness for the first several revisions.
- Historical iterations ([`docs/design/iterations/`](../design/iterations/)) are kept verbatim for provenance rather than cleaned up or corrected.

## Constraints

- This is unlicensed fan content adapting J. R. R. Tolkien's *The Silmarillion*; it must stay a transformative design proposal, not a redistribution of the source text or its illustrations.
- Working titles are not announced or licensed products.
