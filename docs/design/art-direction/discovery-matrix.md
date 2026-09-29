# Agent discovery and responsibility matrix

Status: repository routes added on 2026-09-29. This document owns route
coverage and role responsibilities; design rules remain in the resources
selected by the [shared skill](../../../.agents/skills/silmarillion-art-direction/SKILL.md).
The [verification record](verification.md) owns measured results. Static file
inspection does not prove that any client automatically loaded these routes.

## Required resource sets

These named sets keep adapter instructions short. Read only applicable
resources after the shared skill's common source-authority step.

| Set | Required resources | Purpose |
|---|---|---|
| A — authority | [Source hierarchy](source-authority.md), [package index](README.md), relevant revision-6/roster entries linked there | Resolve current mechanics, lore class, chronology and profile identity |
| V — visual | [Art bible](art-bible.md), [adaptation matrix](adaptation-matrix.md), [faction matrix](faction-matrix.md), relevant [gallery](gallery/index.html) renders | Shared composition, family/exception treatment and visual evidence |
| N — world/narrative | [World and narrative](world-narrative.md), relevant [research ledger](research-ledger.json) and [reference index](reference-index.md) | Geography, atmosphere, object history, voice and source locators |
| U — interaction | [UI/UX](ui-ux.md), [tokens](tokens.json), relevant [gallery](gallery/index.html) renders | Screens, states, information boundaries, accessible functional colors |
| P — production | [Asset specifications](asset-specifications.md), [manifest](asset-manifest.json), [templates](templates.md) | Concrete briefs, dimensions, provenance, outputs and acceptance criteria |
| Q — review | [Review rubric](review-rubric.md), [verification](verification.md), this matrix | Measured, visual and deferred checks, with honest loading limitations |

## Entry points

Every route is conditional on relevant planning, art, narrative, map, asset,
UI implementation, review or verification work. None changes permission,
model, workflow, MCP or unrelated ops requirements.

| Entry point | Explicit route to shared skill | Resources after routing | Responsibility / static inspection |
|---|---|---|---|
| [AGENTS.md](../../../AGENTS.md) §1 | Direct Markdown link; common instruction entry | A + task sets | Require loading before relevant work for all clients; inspect link and scope |
| [docs/tracking/context.md](../../tracking/context.md) | Direct link in active context and key-path entry | A + task sets | Correct cross-era identity, current report/roster and source classes; inspect paths |
| [.agents/skills/README.md](../../../.agents/skills/README.md) | Catalog entry for `silmarillion-art-direction` | A + task sets | Make native/on-demand skill discoverable; inspect metadata and folder/name match |
| [CLAUDE.md](../../../CLAUDE.md) | Ordered entry instructions link directly | A + task sets | Require explicit read; no claim that Codex metadata applies to Claude |
| [CONVENTIONS.md](../../../CONVENTIONS.md) | Critical convention links directly | A + task sets | Shared fallback for vendor clients and Codex's explicit startup instructions |
| [.github/copilot-instructions.md](../../../.github/copilot-instructions.md) | Discoverability row plus required-load prose | A + task sets | Route Copilot and supplementary readers without copying design rules |
| [.github/instructions/silmarillion-design.instructions.md](../../../.github/instructions/silmarillion-design.instructions.md) | Direct link, task-conditioned instructions under `applyTo: '**'` | A + task sets | Covers current assets/docs and future runtime paths; glob is Copilot metadata only |
| [.codex/config.toml](../../../.codex/config.toml) | Existing `developer_instructions` names shared skill and instruction adapter explicitly | A + task sets | Avoid dependence on Copilot globs; preserve every other parsed TOML field |
| [README.md](../../../README.md) | Shared visual-direction section links directly | A + task sets | Human/project discovery; accurately label gallery studies and runtime status |
| [docs/README.md](../../README.md) | Package table entry and direct skill link | A + task sets | Top-level documentation discovery |
| [docs/design/README.md](../README.md) | Current-design map and direct skill link | A + task sets | Distinguish current design, references and archive |
| [docs/guides/CODEX_SETUP.md](../../guides/CODEX_SETUP.md) | Explicit native-route explanation and client probe | A + Q | Explain adapter loading and what a new-session check must establish |

## Role routes and responsibilities

Each of the eight role files below names the skill directly. Native Codex
roles also retain their existing explicit reference to the corresponding
Copilot workflow body; neither route depends on automatic glob loading.

| Role entry | Required resources | Required output for design work |
|---|---|---|
| [.github/agents/planner.agent.md](../../../.github/agents/planner.agent.md) | A, applicable V/N/U/P, Q | Source/profile references, applicable rules, task scope and verifiable acceptance criteria; identify proposed numbers and undecided runtime choices |
| [.codex/agents/planner.toml](../../../.codex/agents/planner.toml) | A, applicable V/N/U/P, Q | Same planning responsibility through native `developer_instructions`; follow existing role's edit restrictions |
| [.github/agents/implementer.agent.md](../../../.github/agents/implementer.agent.md) | A, applicable V/N/U, P, Q | Approved token/asset/state contracts, complete produced artifacts, provenance, rendered evidence and validation outcomes |
| [.codex/agents/implementer.toml](../../../.codex/agents/implementer.toml) | A, applicable V/N/U, P, Q | Same implementation responsibility; return evidence to parent for tracking/staging |
| [.github/agents/reviewer.agent.md](../../../.github/agents/reviewer.agent.md) | A, applicable V/N/U/P, Q | Prioritized source-fidelity, visual-consistency and usability findings tied to rendered artifacts and rules |
| [.codex/agents/reviewer.toml](../../../.codex/agents/reviewer.toml) | A, applicable V/N/U/P, Q | Same review responsibility; preserve read-only role and distinguish judgment from measurement |
| [.github/agents/verifier.agent.md](../../../.github/agents/verifier.agent.md) | A, applicable V/N/U/P, Q | Parser/path/coverage/contrast evidence, actual rendered checks, limitations and explicit PASS/FAIL for the scope tested |
| [.codex/agents/verifier.toml](../../../.codex/agents/verifier.toml) | A, applicable V/N/U/P, Q | Same verification responsibility; preserve test-artifact permission and do not claim static routes prove client loading |

## Static checks and actual client loading

Static verification should parse all five Codex TOML files, compare fields
other than `developer_instructions` to the pre-change configuration, check the
skill's `name`/`description` and folder, parse new scoped-instruction metadata,
and resolve every route and resource path. Inspect the role text to confirm
each responsibility is present. The package validator and verification record
report these checks; passing them proves a valid repository route only.

Actual client-loading verification requires a fresh trusted session in each
client being claimed. Do not silently restart a user's client or alter trust.
Within an authorized fresh session:

1. Ask it to list instructions and skills it actually loaded for a
   production-and-hero screen task, separating automatic discovery from
   explicit reads. It must reach the shared skill, source hierarchy, UI/UX,
   tokens, manifest and rubric, not merely repeat a configured filename.
2. Ask the planner to identify applicable rules and criteria; ask the
   implementer for its contract/asset handoff; ask reviewer/verifier for
   source, usability, rendered and structured checks. These can be read-only
   dry runs, with no game implementation required.
3. Record client/version if available, session date, role, loaded paths,
   evidence returned and any failure in verification.md. A manually supplied
   path demonstrates explicit readability, not automatic skill discovery.

No fresh client-loading result is asserted by this integration. The running
Codex session and preloaded role definitions can predate these file edits;
they must not be presented as evidence of reload. Claude and Copilot were not
launched by this work. Static examples also leave engine performance,
competitive balance, playtesting and full accessibility unverified.

## Maintenance

Change a design rule in its home resource and keep adapters as routes. When
moving a resource, update this matrix, the shared skill, indexes and parser
checks together. When a runtime is selected, extend the applicable resource
contracts and client checks without treating the gallery's HTML format as a
prior engine decision. No engine manifest was present in the initial project
inventory; Python builders and agent ops are document/tooling infrastructure.
The later concurrent [saved handoff](../../project/INITIATE.md) names Phaser,
TypeScript and Vite; this package preserves that document without executing
its separate game-implementation scope.
