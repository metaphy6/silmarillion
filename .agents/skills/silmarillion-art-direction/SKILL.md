---
name: silmarillion-art-direction
description: "Design, plan, implement, review or verify Silmarillion art, UI/UX, maps, assets and narrative using the shared source hierarchy, visual rules, tokens and examples."
---

# Silmarillion art direction

Use this skill before relevant planning, art generation, narrative writing,
map design, UI implementation, review or verification. It routes to the
shared package; it is not a second design bible. Repository operating policy
remains in [AGENTS.md](../../../AGENTS.md).

## Start with authority and the actual task

Read [source-authority.md](../../../docs/design/art-direction/source-authority.md)
and the [package index](../../../docs/design/art-direction/README.md) first.
Use revision 6 and the current structured roster for gameplay; distinguish
Tolkien evidence, wider sources, interpretation, gameplay adaptations,
historical proposals and the new design decisions in this package. Check the
specific profile and source locator needed for the task. Do not turn visual
examples, historical notes or untested numbers into mechanics or balance claims.

The project is a faction strategy game built around distinctive production
economies and one fixed, recreatable hero. Protect the revision-6 invariants
listed in source-authority.md, especially faction/profile counts, Melkor's
persistent doctrine, stocks, separate commitment budgets, the occupied hero
slot and universally available basic interface information. The roster spans
eras: identify the scenario's chronology and geography before composing a map
or writing an encounter.

Inspect the current runtime/tooling before implementation. This package uses
portable contracts and conceptual examples; it does not select a game engine.
If a platform is added later, map semantic contracts to it explicitly. Do not
silently promote gallery HTML into a production technology decision.

## Load the applicable resources

All paths below are relative to `docs/design/art-direction/`.

| Work | Required resources | Result to preserve in the handoff |
|---|---|---|
| Visual planning or direction | [art-bible.md](../../../docs/design/art-direction/art-bible.md), [adaptation-matrix.md](../../../docs/design/art-direction/adaptation-matrix.md), [review-rubric.md](../../../docs/design/art-direction/review-rubric.md) | Applicable rule IDs/sections, source basis, decisions and measurable acceptance criteria |
| Research or new visual references | [reference-index.md](../../../docs/design/art-direction/reference-index.md), [research-ledger.json](../../../docs/design/art-direction/research-ledger.json) | Stable reference ID, creator, locator, access mode, observation separated from interpretation |
| Faction, character, settlement, army or prop | [faction-matrix.md](../../../docs/design/art-direction/faction-matrix.md), [faction-matrix.json](../../../docs/design/art-direction/faction-matrix.json), [asset-specifications.md](../../../docs/design/art-direction/asset-specifications.md) | Exact faction/profile identifier, family and exception, economic purpose, scale variants |
| Terrain, maps, framing, atmosphere or narrative | [world-narrative.md](../../../docs/design/art-direction/world-narrative.md), [art-bible.md](../../../docs/design/art-direction/art-bible.md) | Canonical versus invented geography, view relationships, source class, narrative consequence |
| UI screens, flows, states or microcopy | [ui-ux.md](../../../docs/design/art-direction/ui-ux.md), [tokens.json](../../../docs/design/art-direction/tokens.json), [world-narrative.md](../../../docs/design/art-direction/world-narrative.md) | Costs/prerequisites before commitment, state and focus behavior, information boundary, accessible labels |
| Asset creation or generation | [templates.md](../../../docs/design/art-direction/templates.md), [asset-specifications.md](../../../docs/design/art-direction/asset-specifications.md), [asset-manifest.json](../../../docs/design/art-direction/asset-manifest.json) | Completed concrete brief, provenance/status, actual produced file, dimensions and acceptance evidence |
| Review and verification | [review-rubric.md](../../../docs/design/art-direction/review-rubric.md), [verification.md](../../../docs/design/art-direction/verification.md), [discovery-matrix.md](../../../docs/design/art-direction/discovery-matrix.md) | Measured checks, visual judgments and unresolved runtime/playtest checks reported separately |

For any visual creation, UI implementation or visual review, also inspect the
relevant rendered [gallery examples](../../../docs/design/art-direction/gallery/index.html),
not just their source. The gallery demonstrates the direction; the written
rules and semantic tokens own requirements. Read the manifest before using an
asset: reference imagery, generated concepts and production-ready assets are
different statuses.

## Execute without flattening the design

1. Select the current faction/profile and source references, then identify
   applicable rules and the task's acceptance criteria. Trace an exception to
   its authoritative home instead of inventing a competing rule elsewhere.
2. Complete the matching template. A generation brief must name concrete
   composition, projection, figure scale, shapes, materials, palette,
   illumination and exclusions. A game title or artist's name is not a brief.
3. Keep landscapes dominant, characters readable at map scale and intimate
   detail available through portraits/inspection. Use semantic UI colors and
   permitted pairings from tokens.json; decorative palettes do not authorize
   low-contrast controls. Keep precise labels outside generated artwork.
4. Preserve the UI state and information contracts in ui-ux.md. Test the
   relevant commitments, costs, cancellation, occupied hero slot, doctrine and
   uncertainty cases; illustration must never conceal a required decision.
5. Inspect the actual rendered result at its declared size and text scale.
   Check contrast, focus, selection targets and color-independent signals;
   correct material failures. Record unavailable tools/evidence honestly.
6. Update the manifest for new assets and run the applicable package checks
   in verification.md. Return files, reference/profile IDs, measured results,
   visual-review results and remaining assumptions to the coordinating agent.

Do not claim that static examples prove runtime performance, client loading,
full accessibility, competitive balance or canonical cross-era coexistence.
Reference works inform original design; do not copy character likenesses,
dialogue, institutional framing or unadopted inner-voice systems.
