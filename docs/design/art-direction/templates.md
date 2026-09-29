# Reusable briefs and completed examples

Use the common envelope for every asset. Add the kind-specific fields and compare with the filled example. Every example below is a completed **design brief**; only assets explicitly present in [manifest](asset-manifest.json) are produced. Do not claim a future portrait/building cutout exists because its specification exists.

## Common envelope (copy and fill)

```yaml
id: sm-kind-profile-purpose-v1
status: specified-not-produced
profile_id: exact ID from hero-balance-roster.json, or null for shared geography
source_basis: [PROJECT-01, LORE-xx, DE-xx]
evidence_class: current-gameplay | supplied-book | interpretation | new-design
purpose: what the player must understand
view: strategic | local | inspection
camera_and_scale: projection, framing, intended logical display size
composition: dominant mass, focal detail, quiet area, target clearance
shape_and_material: structural silhouettes and material-specific edges
palette: decorative family plus semantic token references for UI
light_and_weather: light origin, value grouping, atmosphere
text: exact live UI strings; none baked in artwork
states: default, selected, pending, unavailable, uncertain, or relevant subset
exclusions: forbidden source/mechanic/visual implications
output_contract: format, dimensions, aspect, alpha, layers, variants
provenance: creator/tool/date/input rights/exact prompt reference
acceptance: measurable check, visual inspection and unresolved prototype test
```

A title or artist name is insufficient. Keep Tolkien evidence and gameplay invention separately labeled. Use a current source locator rather than a vague “lore accurate.” If a cost is undefined, say so. The exact prompts actually used for the three paintings are in [generation prompts](generation-prompts.md).

## 1. Portrait brief — Rohan's Rider Marshal

**Purpose:** a mortal decision-maker whose repair and care remain readable after leaving the map. **Status:** produced within the comparison sheet, not a standalone layered portrait. **Basis:** PROJECT-01 §08; Rohan is cross-era relative to First Age scenes; costume and individual appearance are new design. Exact roster profile ID: `human_rohan`.

Bust, slight three-quarter turn, quiet eye line, asymmetry from fatigue rather than villain coding. Green flax cloak in broad folds, one worn copper horse clasp, restrained leather straps, dark braided hair. Paint precise eyes and clasp; lose outer cloak edges into slate. Cool daylight, a small warm reflection; no crown, film likeness or oversized weapon. Sheet crop is demonstrated in gallery; production target is portrait contract in asset specifications. Accept expressive face at 200px display, consistent clasp in inspection/map simplification, and no name baked into paint.

## 2. World figure brief — Rider Marshal

**Purpose:** find the same person at a distant camera without making them enormous. **Status:** produced as original vector silhouette study, production sprite not produced. Orthographic oblique, broad green cloak wedge, small straw face break, single vertical staff/weapon cue; no facial detail at 14px. Terrain keeps normal scale; selection target 44px. Output current SVG strip, future RGBA body/shadow/selection layers. Accept distinct silhouettes on three ground values; make accessible selection list available. Actual click accuracy and motion readability require a playable prototype.

## 3. Environment brief — the long route to the ford

**Purpose:** understand a river barrier, alternate approach and small productive habitation. **Status:** generated `strategic-rohan-v1.png`. **Basis:** PROJECT-03's scale principle, transformed through grassland economy; invented sandbox basin, not a map of Rohan or Brethil.

High oblique orthographic, no horizon, land beyond every edge. Slate river across a deep ravine, broad meadow void, small sod-roof stead at middle-left, long ochre approach, distant ford, tiny riders. Wet grass/rock masses, cool blue-violet depth, straw/amber at inhabited sites. Separate route geometry from paint; no HUD text baked in. Accept dominated landscape, usable panel space, plausible terrain; exact movement topology belongs to scenario design. Gallery route labels must not claim the unverified paint itself is traversable data.

## 4. Building brief — Muster Hall and farrier bay

**Purpose:** distinguish hero facility from horse production. **Status:** generated inside local plate; standalone layered building not produced. Low elongated timber hall with sod roof, braced porch, visible component workbench; a lower open farrier bay and pasture paths show labor. Small relative to the valley; warm forge confined to hearth, cool rain on roof. No stone keep, giant horse statue, fabricated extra hero queue or roof letters. Future footprint includes entrance and yard; overhead roof can occlude but selection outline/list must resolve it. Accept building role with label removed, entrance clearance, staff/source fields in UI.

## 5. Prop brief — forged horse crest

**Purpose:** tangible component for a fixed hero, with a history of repair. **Status:** produced original SVG schematic `horse-crest-v1.svg`. Three-quarter isolated iron horse silhouette, copper binding at a real stressed seam, a worn maker mark; matte iron with limited pale contact edges. Not a named canonical relic. Normal recipe 10M+5K/one turn and metal access are live UI, not engraved text. Current SVG has opaque surface background; future inspection master should have alpha. Accept readable shape at inspection size, distinct condition evidence, exact recipe label and no copied film emblem.

## 6. Map brief — invented river basin

**Purpose:** compare three public objectives and known versus uncertain routes. **Status:** produced `sandbox-map-v1.svg` plus separate functional overlay layer in gallery HTML. Top-down schematic deliberately differs from oblique world camera. Known west, unconfirmed east with observation age; objectives A/B/C form two approaches each; shared-stock source access labeled P/M/K/E. White solid route with arrows, lilac dashed uncertain passage, cyan double supply line with square node, hatched warned area with triangle. Dark casing around lines, opaque text backing. No canonical shoreline claim or fog-derived enemy disclosure. Accept all legend patterns in monochrome and textual list; path costs and fairness remain prototype work.

## 7. Narrative scene brief — a small repair

**Purpose:** make stewardship and mortality felt through an ordinary component. **Status:** produced original dialogue demonstration, not adopted quest content. Place: working stead after rain; speaker: Rider Marshal; object: inherited iron with a later copper repair. One environmental beat: water sits in the maker mark then runs clear. Player may ask about repair, remain quietly present, or inspect the actual recipe. No hidden cost, automatic moral score, invented inner voice or lore-authoritative claim about the object's owner. Accept original diction, personal specificity, concise factual attribution; future implementation can remember response without branching the entire game.

## 8. UI screen brief — paid hero return

**Purpose:** recover after death while seeing the economy continue. **Status:** produced local gallery mockup. 1440×900 reference; landscape and facility label on left, opaque sheet on right. State: hero dead, slot empty, no crest in inventory, illustrative stocks P180/M95/K45/E30. Show normal crest 10M+5K/one turn; Rider Marshal 100P+40M+20K+10E/two turns; total 100P+50M+25K+10E/three sequential turns excluding Hall. Live text uses token colors, full labels, staged review action. Explain retained development and dropped equipment once. Accept exact totals, captive alternative documented, 200% reflow and visible keyboard focus. Button demonstrates review intent; it does not execute production.

## 9. Asset-generation brief — three faction treatments

**Exact profile IDs:** `human_rohan`, `aule`, `melkor_dark_architect`.

**Purpose:** test shared paint across mortal work, restrained divine craft and industry. **Status:** produced `faction-portraits-v1.png`; exact prompt archived. Three equal vertical columns with separate intimate portraits and enlarged whole-body studies; no words or frames. Rohan uses worn green cloth and a horse clasp; Aulë uses mineral-blue cloth, ash beard, smith hands and a small worked object; Dark Architect uses angular charred iron, violet shadow and a cracked component. Eyes/hands/props are detailed, shoulders dissolve. No actor likeness, no copied game character, no horns/glowing villain eyes, no generic golden armor. Accept chromatic separation and material identity. Do **not** call the generated full bodies calibrated sprites: the vector scale strip demonstrates the actual proposed map size.

## Implementation handoff template

```text
Task / source IDs / exact roster IDs:
Applicable rule homes (links, not copied paragraphs):
Proposed view and state under review:
Functional data fields and player-knowledge boundary:
Token version + asset IDs + actual vs specified-not-produced status:
Required transitions / error messages / focus restoration:
Measurements to reproduce (resolution, text scale, contrast pairs, target size):
Visual evidence paths and observed failures:
New assumptions / alternatives / owner decision required:
Runtime tests still required:
```

**Filled handoff:** implement the future Rohan recreation review using PROJECT-01 §§02/08/12, tokens schema 1 and gallery local study; preserve exact total above, same fixed hero/level/perks, one slot reservation, independent ordinary queues, no copied inventory. Actual art is a flattened concept, not engine-ready cutouts. Test uncreated/dead/captive/pending, missing metal/stock/facility, component fallback, keyboard/reflow and duplicate submission in the eventual engine. The implementation must obtain rules for unspecified staffing details rather than invent prices from this mockup.
