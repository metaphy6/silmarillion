# 🎨 `docs/design/` — design docs & ADRs

Design docs (forward-looking proposals) and ADRs (Architecture Decision
Records — accepted decisions with rationale).

## Silmarillion sources and current design

- [Revision 6 design report](silmarillion-game-report.md) — current gameplay design, with [hero roster](hero-balance-roster.md) and [structured roster](../../hero-balance-roster.json).
- [Shared art-direction package](art-direction/README.md) — source hierarchy, research, adaptation, visual/narrative/UI rules, portable tokens, asset contracts and review gates.
- [Entry skill](../../.agents/skills/silmarillion-art-direction/SKILL.md) — required route for all relevant agent work; [discovery matrix](art-direction/discovery-matrix.md) records each client and role.
- [Visual gallery](art-direction/gallery/index.html) — original conceptual examples, with [verification evidence](art-direction/verification.md).
- [Brethil concept and provenance](concept-art/brethil-concept-readme.md) — a scale/atmosphere reference, not the definition of the entire current game.
- [Reading notes](reading-notes/) and [archived revisions](iterations/) — preserved supporting/historical material; follow [source authority](art-direction/source-authority.md) before using a claim.

## Files

- [`DESIGN.template.md`](DESIGN.template.md) — for proposing a non-trivial change before building it.
- [`ADR.template.md`](ADR.template.md) — for recording a code-level decision after it's made.

## When to write

- **Design doc**: before a change > a few days of work, before a public API, before a cross-module refactor. Reviewed by humans + agents, signed off before code lands.
- **ADR**: after a meaningful architectural decision, so future-you can ask "why is it this way?" and get an answer.

Both live alongside the code they shape — file name embeds the topic
(`DESIGN-auth-rework.md`, `ADR-0007-use-postgres-not-mongo.md`).
