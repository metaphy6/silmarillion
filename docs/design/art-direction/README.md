# Silmarillion art and experience direction

Start with the [shared agent skill](../../../.agents/skills/silmarillion-art-direction/SKILL.md), then open the [visual gallery](gallery/index.html). This is a reusable design contract and original concept package, created 29 September 2026. It extends revision 6; it does not change faction rules or establish competitive balance.

An enormous painted world, a small figure with a specific life, a made object worth keeping. Cool spacious land contains fragile warm places; portraits and quiet reading surfaces hold the detail that the distant map cannot. Wonder and grief coexist with work, restraint, humor and hope.

## Authoritative homes

| Question | Resource |
|---|---|
| What is current, canonical, interpreted or invented? | [Source authority and inspected material](source-authority.md) |
| What was actually observed in Disco Elysium? | [Reference index](reference-index.md), [structured research ledger](research-ledger.json) |
| What do we adopt, transform or reject? | [Adaptation matrix](adaptation-matrix.md) |
| How should painting, light, shape and materials work? | [Art bible](art-bible.md) |
| How do maps, views, voices and local stories relate? | [World and narrative](world-narrative.md) |
| How is every profile distinctive? | [55-profile matrix](faction-matrix.md), [structured matrix](faction-matrix.json) |
| What does the player see and do? | [UI/UX and accessibility](ui-ux.md) |
| Which exact functional values are allowed? | [Semantic tokens](tokens.json) |
| What must an asset deliver? | [Asset specifications](asset-specifications.md), [manifest](asset-manifest.json) |
| How do I write a brief or handoff? | [Templates and filled examples](templates.md), [exact generation prompts](generation-prompts.md) |
| How do I accept or reject work? | [Review rubric](review-rubric.md), [verification evidence](verification.md) |
| How do agents find this? | [Discovery matrix](discovery-matrix.md) |

Rules have one home. The gallery demonstrates selected rules, not an alternative specification. Tokens govern interface colors; faction palettes govern decorative art and cannot override functional semantics. Source evidence never licenses a new mechanic. Roster completeness does not prove balance.

## Status and use

Current rules live in [revision 6](../silmarillion-game-report.md) and the [structured roster](../../../hero-balance-roster.json). This package's visual rules are new design decisions within the requested scope. Camera angles, pixel sizes, density, control mappings and screen flows are proposals to prototype. No game runtime manifest was present at initial inspection; input/platform contracts remain provisional. A concurrently added [saved implementation handoff](../../project/INITIATE.md) names Phaser + TypeScript + Vite; that implementation is outside this resource task. Portable JSON, Markdown, SVG and a self-contained HTML/CSS/JavaScript gallery are documentation formats, not a runtime stack choice.

Open `gallery/index.html` directly in a modern browser; it makes no remote requests. Its five studies are conceptual mockups with illustrative campaign state. Tab buttons, overlay controls and text-size controls work as demonstration controls. They do not execute gameplay. Production artwork, exact labels, source evidence and rendered screenshots are kept separate.

To repeat static checks from the repository root: `python3 docs/design/art-direction/validate.py`. Render instructions and measured evidence are in [verification](verification.md). Read the source-specific access limitations before repeating research claims.
