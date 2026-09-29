# Source authority and current concept

Status: shared design contract, 2026-09-29. Gameplay remains revision 6 and is proposed, not playtested. This package introduces presentation decisions; it does not rebalance heroes. Start through the [shared skill](../../../.agents/skills/silmarillion-art-direction/SKILL.md).

## Authority and evidence classes

| Priority / class | Authority | What it establishes | What it cannot establish |
|---|---|---|---|
| Operating rules | [AGENTS.md](../../../AGENTS.md), then client adapters and [context](../../tracking/context.md) | Safety, tracking, staging, discovery | Fiction, mechanics, visual style |
| Current gameplay adaptation (`PROJECT`) | [Revision 6 report](../silmarillion-game-report.md), [structured roster](../../../hero-balance-roster.json), [roster companion](../hero-balance-roster.md) | Current faction economy, hero rules, powers, counters | Canonical events or demonstrated balance |
| Current production inputs (`PROJECT`) | Four root `hero-kits-*.json` files and [roster builder](../../../build_hero_roster.py) | Stable profile IDs and source of generated roster; Melkor's two definitions | Additional mechanics inferred from power names |
| Tolkien source (`LORE`) | Supplied [book](../../../silmarillion.pdf), checked against [extracted text](../../../silmarillion-extracted-text.txt) | What this compiled edition actually says, including attributed uncertainty | A single uncontested version of every Tolkien text; modern game rules |
| Wider Tolkien evidence (`WIDER`) | Individually cited and inspected editions or sources outside the supplied book | Only the claim and version actually verified | Silent replacement of the supplied edition or invented Blue Wizard biographies |
| Source interpretation | A stated inference with a source locator | A defensible reading of themes, motive, scale or material | A new canonical fact |
| Historical proposal (`HISTORY`) | [Iterations](../iterations/), `design-notes-*.md`, [reading notes](../reading-notes/) | Earlier decisions, proposed mechanics and research leads | A newer override of revision 6 |
| New presentation decision (`DESIGN`) | This art-direction package | Agent-facing visual, narrative, UI and asset conventions within r6 | A new resource, hero slot, faction or combat ability |

Resolve contradictions by domain, then recency and explicit authority. The book governs claims about the book; revision 6 governs the game even where the game deliberately departs from the book. Label the departure. Historical notes stay intact. New mechanics require a separate recorded project decision and tests when implemented.

## Current identity and fixed constraints

An isometric faction strategy game about choosing a faction, developing its distinctive production economy, and creating, developing, losing and recreating its sole fixed hero, presented through enormous painted landscapes, tiny expressive figures, carefully made objects, intimate portraits and consequential dialogue.

The following are constraints consumed from PROJECT-01/02, not invented here:

- 54 factions, 55 starting profiles; Melkor's two doctrines are mutually exclusive configurations of one faction and one hero identity.
- Five named Istari supplement Ember, Grove, Veil, Forge and Star. Alatar and Pallando are separate factions. Named identities are unique; Gandalf's Grey/White presentation does not create another hero.
- Exactly three selectable human kingdoms: Gondor, Rohan, Númenor. Brethil/Haladin communities can be narrative actors or scenario context, not an unannounced fourth kingdom.
- Four stocks: **P — Provisions; M — Materials; K — Lore supplies; E — Essence**. Source access is distinct from stock quantity. K is prepared teaching/research/ritual supplies; E is a game abstraction, never proof that souls are mined.
- Three weekly strategic operations plus one personal hero commitment. Established production queues operate separately. Do not make each ongoing job consume another operation.
- One living/pending hero slot: absent before creation, reserved during creation/recreation, living, captive, dead. A living captive still occupies it. Return costs the full recipe, new component and full time; level/perks persist; dropped gear does not duplicate.
- Known costs, prerequisites, inventory, repair needs and observed report times stay available to every faction. Intelligence reveals extra world evidence, not basic interface facts.
- Melkor's doctrine persists through recreation. Only Melkor commands every Dragon form and Balrog. Worldbreaker calls finite, discovered, living map entities over real routes; Dark Architect can also produce new creatures. Allies, rings, capture, trade and annexation cannot bypass this.
- Exact ability costs, ranges, warnings, counters and retained weaknesses come from the structured roster. Production-table magic names are themes, not additional free powers. The older fifty kits await separate offensive review.

## Chronology and sandbox contract

Revision 6 explicitly combines eras. Default selection must say **Cross-era sandbox** and explain that coexistence, repeated hero return and many faction institutions are game inventions. It must not say “all these factions existed together in Beleriand.” The later-age narrative names Rohan and describes the Wizards' Third Age activity (LORE-11); Númenor's history belongs to an earlier age (LORE-10). Aman, Beleriand, eastern lands and later western kingdoms are not adjacent merely because their cards appear together.

Every map/scenario brief records `chronology_mode` (`cross-era-sandbox`, `historical-window`, or `alternate-history`), `era_or_window`, `geography_basis`, `available_profiles`, `artifact_custody`, `fixed_events`, and `invented_connections`. These are portable design fields, not an engine schema. A historical-window mode restricts identities, forms, artifacts and geography; a counterfactual mode states which established outcomes can change. A player's credible preparations must matter inside the declared contract.

Source caution: repeated paid return for mortals and local Arien/Tilion manifestations are explicit adaptations. They neither cancel the source's mortality nor imply replacing the Sun and Moon through a production queue. The One Ring, Silmarils, unique ships and other named artifacts are not repeatable generic equipment. Generic foci are original items.

## Conflicts already resolved

| Historical/supporting claim | Current treatment |
|---|---|
| Only a mortal march-warden of Brethil is playable | Superseded by the selectable faction game. Brethil remains valuable local scale/atmosphere reference. |
| Named Wizards are narrative-only | Superseded by revision 6's five added selectable factions. |
| Broad human roster; independent Dragon/Balrog factions | Superseded. Three kingdoms; Dragons/Balrogs are Melkor-exclusive ordinary units. |
| Ongoing builds consume operation slots | Superseded by independent established queues. |
| Permanent death instead of full paid recreation | Superseded for the standard mode. Source mortality remains correctly described in lore. |
| Historical inner voices, quantified figure sizes, camera angles and density percentages | Proposals, not adopted mechanics or measured targets. New view experiments must identify themselves as provisional. |
| Brethil generation prompt says no HUD/text | Applies only to PROJECT-03's illustration. UI screens require readable functional information. |
| Reading notes refer to deleted `tmp/reading` renders or say an earlier report is final | Historical evidence claims, not current file paths or current authority. Use the current source and locators below. |
| Old report prose says archived files are at root | Current files were rediscovered under `docs/design/iterations/`; do not recreate duplicate authorities. |

## Local reference ledger

Access date for every row: **2026-09-29**. PDF locators are **1-based PDF positions, not printed folios**. Text checks use the corresponding form-feed page in the retained extraction. `Text` means read the listed passage; `visual` means a rendered page or the actual image was inspected. The ledger records observation separately from the new consequence. Foreign reference imagery is reference only; no book plate, chart or map is copied into original production assets.

| ID | Creator / title; source and locator | Inspection / type | Observation | Interpretation | Design consequence |
|---|---|---|---|---|---|
| PROJECT-01 | Project authors, *The Powers and Peoples of Arda*, r6; [report](../silmarillion-game-report.md), §§01–13 | Current gameplay; full report read | Distinct economies, one hero, four stocks, separate queues, cross-age roster and explicit counters | Institutions make differences legible before numerical bonuses | Each visual profile names its actual work and vulnerability; no invented power from ornament |
| PROJECT-02 | Project authors, [roster](../../../hero-balance-roster.json); [Valar](../../../hero-kits-valar-v5.json), [peoples](../../../hero-kits-peoples-v5.json), [other](../../../hero-kits-other-v5.json), [named Istari](../../../hero-kits-named-istari-v6.json); [builder](../../../build_hero_roster.py), lines 6–8, 27–34 | Structured data reviewed; CodeGraph source inspected | 55 unique IDs, 54 faction strings, one Melkor identity with two doctrines | Profile identity must survive presentation layers | Matrix IDs and names copied verbatim; no balance edits |
| PROJECT-03 | Original generated *Brethil concept view*; [image](../concept-art/brethil-isometric-concept.png), [notes](../concept-art/brethil-concept-readme.md), [prompt](../concept-art/concept-prompt.txt) | Image visually inspected; prompt and provenance read | Slate river diagonals, modest camp, amber fire, tiny travelers, numerous wet rocks/trees; landscape continues beyond frame | Small bright habitation can carry emotional attention in a large cold environment | Preserve scale/atmosphere; author new geography and readable UI separately |
| PROJECT-04 | Project authors, [origins](../reading-notes/reading-origins.md), [realms](../reading-notes/reading-realms.md), [fall](../reading-notes/reading-fall.md), [later ages](../reading-notes/reading-later-ages-and-reference.md); `design-notes-*.md`; iterations v1, v2, v5 | Historical notes read; proposal headers/selected relevant sections checked | Earlier local campaigns, internal perspectives and alternative economies coexist with useful source locators | Valuable evidence leads can contain superseded design | Check source passages; never promote a proposal by copying it |
| LORE-01 | J. R. R. Tolkien, ed. Christopher Tolkien, *The Silmarillion*, [supplied PDF](../../../silmarillion.pdf), pp.37–42, Valaquenta | Text; pp.37,39 also visual | Differentiated domains: air/light/water/craft/growth, memory/dream/rest/grief, movement/hunt; named Maiar; Sauron's craft background | Divine identity is broader than combat spectacle | Domain-specific materials and gestures; no identical throne/castle kit for fourteen Powers |
| LORE-02 | Same, pp.56–59, *Of Aulë and Yavanna* | Text; p.59 visual | Aulë does not independently grant autonomous life; craft, living things and the cost of wood coexist; Eagles and tree shepherds differentiated | Making and stewardship are a tension with legitimate needs | Forges show materials, repair and labor; groves show habitat; constructs/production are labeled invention |
| LORE-03 | Same, pp.110–111, Alqualondë | Text | Ships embody irreplaceable labor and attachment; violent seizure follows refusal | Useful objects carry relationships beyond market value | Inspection includes maker, custody, repair and obligation; shipyards are craft places, not vending machines |
| LORE-04 | Same, pp.117–119, *Of the Sindar* | Text | Distinct Belegost/Nogrod; Khazad-dûm distant; reciprocal Dwarf/Elf craft; Menegroth uses carved tree forms, lamps, water and colored stone | Shared making can produce hybrid material languages | Different Dwarf economies; Sindarin built craft need not be treehouses or bare caves |
| LORE-05 | Same, p.151; p.183; p.196, Beleriand/Brethil passages | Text; p.183 visual | Brethil lies between Sirion/Teiglin, outside the Girdle; negotiated residence and crossing duty; Halmir/Beleg defense | Geography, autonomy and assistance are linked | Separate Teiglin crossings from Brithiach; Brethil is a scenario/reference, not the complete roster |
| LORE-06 | Same, pp.241–242, Fifth Battle | Text; p.242 visual | Belegost uses protective masks; Azaghâl's wound drives Glaurung back; a martial success coexists with loss | Protection has specific craft and cost; sacrifice can change outcomes | Belegost mask/heat-treatment identity; evacuation/recovery can remain meaningful after a lost encounter |
| LORE-07 | Ted Nasmith, supplied edition illustration, p.70, lakeshore figures under stars | Visual | Wide blue-violet sky, dark trees, pale shore and small human forms; no game interface | Luminous cool color can make figures emotionally significant without enlargement | Original night plates retain luminous color and figure/ground separation; never trace the painting |
| LORE-08 | Supplied edition, *Sundering of the Elves* chart, p.383 | Visual, rotated for inspection | Quendi divides Eldar/Avari; Vanyar/Noldor/Teleri and Telerin branches are nested, not eight equal clans | Historical names describe journeys and relationships | Selection hierarchy explains overlap; “dark” classifications are not skin colors or moral alignment |
| LORE-09 | Supplied edition, *Map of Beleriand and the Lands to the North*, pp.442–446 | All quadrants and whole map visually inspected, rotated upright | Brethil northwest of Doriath, Sirion/Teiglin distinct; Falas/Balar southwest; Gelion/Ossiriand east; chart joins are not routes | Macro topology is stronger evidence than exact gameplay distance | Canonical map preserves relationships; invented paths/settlements and scale compression are declared |
| LORE-10 | Tolkien, supplied PDF, pp.329,333, Akallabêth | Text | Númenor remains mortal; learned craft, sea connections, accumulated power and internal division | Beauty and capability need not imply innocence or inevitable corruption | Maritime reach plus vulnerable dependence; chosen institutions have consequences, no forced racial morality |
| LORE-11 | Same, pp.370–373, *Of the Rings of Power and the Third Age* | Text | Rohan is described in Third Age context; Gandalf, Saruman, Radagast named; other Wizards go east without named biographies here | The full roster cannot be one canonical First Age moment | Cross-era label; eastern Wizard appearances and societies remain consciously authored inventions |
| LORE-12 | Same, p.125 (Arien/Tilion paragraph), p.127 (Morgoth's dispersal paragraph), p.320 (Balrog remnants/winged Dragon passages) | Selected passages read in extraction | Arien/Tilion have distinct origins; Melkor spends power outward; winged Dragons arrive late; few Balrogs flee | Source supports thematic distinctions, not renewable factories or all-era availability | Local celestial embodiments, doctrine split, new-creature production and ordinary unit recipes are clearly sandbox adaptations |
| LORE-13 | Same, pp.98,106,321–322, reconciliation, oath and aftermath | Text, all four pages read | Fingolfin offers reconciliation; Fëanor's oath targets any keeper of the jewels; Maglor argues breaking it would do less evil, yet yields | A promise's object and subsequent choices matter; oathkeeping is not an automatic moral score | Dialogue names beneficiaries, witnesses and costs; preserve alternatives and responsibility rather than a generic oath buff |

### Wider-source boundary and unresolved evidence

Every profile in [faction-matrix.json](faction-matrix.json) records `lore_evidence_status`. `inspected-source` means its nonempty `lore_refs` list points to inspected source evidence in this ledger; it does not turn its invented gameplay or visual treatment into canon. `gameplay-only-unverified-lore` deliberately pairs with an empty `lore_refs` array: no independently inspected lore basis is claimed for that treatment. This is an explicit evidence boundary, not a lost citation. A current `project_locator` is mandatory in both cases, and `lore_status` explains the limits in prose. Add lore references only after inspecting evidence; never populate the array merely to satisfy a completeness check.

PROJECT-01 §06a cites the licensed *Middle-earth: The Wizards* rulebook, printed pp.2–3, attributing Alatar/Pallando to *Unfinished Tales*. This session did not independently read that external rulebook or *Unfinished Tales*. Their names and inclusion are current project decisions; their Eastern Hunt/Resistance factions, powers and material cultures are inventions. Do not describe them as book-established biographies or use an unverified cinematic likeness. Any later lore expansion must add a `WIDER-xx` ledger row with actual edition/page and inspection scope.

The retained historical notes claim a complete 461-page reading in their original session. This work **does not claim a fresh complete-book reading**. Current verification covers the ledger's specific text passages, twelve rendered PDF pages (37,39,59,70,183,242,383,442–446), and the original Brethil image. Map minor lettering is softer than body text; use larger source renders before placing a disputed small label. No independent textual-variant comparison or comprehensive costume archaeology has been performed. No game runtime manifest was present at initial inspection; Python builders generate documents/data only. The concurrently added [INITIATE.md](../../project/INITIATE.md) is a saved implementation prompt naming Phaser + TypeScript + Vite. It was preserved, not executed as part of this resource task; it does not turn the gallery into a validated game runtime.

## Decisions introduced by this package

1. Faction visual design starts from work, habitat, material and vulnerability; silhouette and accent follow. This is a presentation rule, not an economic rebalance.
2. An original object retains a short human history; canonical unique artifacts require explicit custody and era checks.
3. Strategic, local and inspection views share identity but make different scale promises. See [world and narrative](world-narrative.md).
4. All 55 profiles have seven explicit art domains in the [faction matrix](faction-matrix.md); the [JSON](faction-matrix.json) owns those per-profile design details.
5. Psychological depth comes from situated perspectives, memory and commitments in dialogue. A Disco-like internal-skill chorus is **not adopted**; introducing one requires a separate rationale and mechanic decision.

## Change protocol

Before changing a source claim, open the cited passage and record the version. Before changing a gameplay number or faction, amend the current design authority rather than this package. Before changing a presentation rule, update its single owning resource, dependent examples and validation evidence. Keep quoted source material short; link rather than redistribute book pages or reference art. A source citation indicates evidence, never ownership or a license to reproduce it.
