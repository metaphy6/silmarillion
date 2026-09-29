# UI/UX and accessibility specification

**Authority:** new proposed flows and controls, preserving [revision 6](../silmarillion-game-report.md) §§01–13 and the [roster](../../../hero-balance-roster.json). Neither the gallery nor this document is a runtime implementation. [Tokens](tokens.json) govern exact values; [world/narrative](world-narrative.md) governs view/geography/voice; [source authority](source-authority.md) governs evidence.

## Information architecture

Campaign setup → faction/profile and doctrine → scenario/map assumptions → start. Campaign workspace → world / local place / selected entity inspection. Persistent access: stocks, weekly budget, single hero status, objectives, economy, event history, settings. Inspection opens a contextual reading surface, retaining selection and camera. Dialogue is a focused reading mode with speaker portrait, text, choices and history; returning restores the prior world state.

Proposed desktop controls: pointer to inspect, explicit button or Enter to confirm; Tab/Shift+Tab through UI, Enter/Space activate, Escape closes the top layer, arrows move within lists, remappable camera/zoom keys. No irreversible action on click-to-select, hover, camera movement or accidental double-click. Keyboard world traversal uses a named entity/route list; it never requires pointing at a 12px figure. Controller/touch mappings are future target decisions, not supported by these static samples.

At strategic distance, one thin resource/turn band and one compact selected-object block are normally enough; keep a large uninterrupted world. Expandable panels hold detail, and a dedicated economy view can prioritize tables. Inspection and dialogue may deliberately occupy much more screen area. Do not force a 70% landscape goal onto a reading or settings view.

## Persistent information contract

Show **P—Provisions, M—Materials, K—Lore supplies, E—Essence** with amount, projected change and a drilldown separating income/upkeep/committed payments. No fifth currency and no relabeling K as abstract research points. Subtype source access is a prerequisite, not another resource stock. Display `Strategic operations 2 / 3 remaining` separately from `Hero commitment 1 / 1 available`. Facilities report queues separately; a ticking established job must not consume another operation.

Every faction gets ordinary map controls, visible self-economy, recipes/prerequisites, public objective progress, known warnings, own hero state and basic explanations. Information abilities add **world evidence** within their defined scope. They do not unlock the player's settings, stock labels, counters, tooltips or ability to read visible costs. Enemy hidden facts stay unknown; an empty UI field is not proof of absence.

Use separate fields for known/observed, last seen with week, inferred and unknown. Keep ownership separate from confidence. Fog obscures unknown world evidence, not the rules. A route through unknown space displays uncertainty and known cost assumptions; it must not leak a hidden enemy through path color, disabled targets or tooltip internals.

## Critical flows and state transitions

All layouts below are proposals. Rules/costs are existing design; mock campaign values are examples.

| Flow | Required content and actions | Failure / alternate state | Acceptance |
|---|---|---|---|
| Faction choice | Search/filter 54 factions by economy/domain, not moral rank. Show sole hero, production identity, dependencies, source-era tag, strengths/counters. Five named Istari **and** five generic orders; Alatar/Pallando separate. | No compatible essential terrain → explain map mismatch and choose another compatible scenario, not a secretly crippled start. | Structured IDs match roster; no fourth human kingdom; five named choices visible. |
| Melkor doctrine | A single faction with a two-option doctrine comparison: Worldbreaker / Dark Architect. Contrast personal force, economy, finite call vs production; show persistence at final review. | Before campaign creation selection can change; after start read-only doctrine field. Both use same identity/slot. | Reload/recreation cannot switch or combine doctrine. Never show two Melkors in campaign. |
| Campaign map | Label canonical geography vs invented local composition vs cross-era sandbox. Show chosen factions, compatible resources and scenario rules. | Unsupported era combination must be labeled sandbox, not dated canon. | No claim the 54-faction roster occupies one historical instant. |
| Economy and production | Stocks and deltas; each facility queue; recipe inputs, source tags, workers, time, upkeep, supply/binding or creature-capacity reservation; pay upfront with review. | Missing access, worker, plot/capacity or stock is named separately. Voluntary cancel explains half stock refund; destruction loses unfinished work. | No opaque disabled button; no “free” acceleration or same-turn duplication. Detail prices not defined in r6 remain “Not specified”, never invented as approved. |
| First hero creation | Fixed hero card and slot state; component, facility, recipe/time chain. Review total and current step, consume component once, lock queue/slot. | Additional hero building does not add a queue. Unavailable source offers the established synthesis fallback with cost/time, not new recipes. | One living/pending slot; full Rohan chain 100P+50M+25K+10E over 3 sequential turns, excluding Hall. |
| Development | Same identity, level and three branch choices; selected perks, prerequisites and branch implications shown before commitment. Portrait clothing can reflect work/choice without changing hero type. | A branch price or respec rule not defined by current sources is “Design pending”, not guessed. | No second controllable hero via promotion/alliance; no undocumented respec button. |
| Captivity | Portrait restrained, status “Captive — occupies your hero slot”; last known place/evidence; rescue route or surrender review. | Unknown prison location stays unknown. Surrender explicitly ends incarnation, drops equipment once and opens paid recreation. | Rescue and surrender cannot coexist with recreation of a living captive. No instant “dismiss captive and spawn” action. |
| Death and recreation | Death event, retained identity/level/perks, equipment dropped once, hero absent; economy continues. Rebuild facility if necessary; new component plus full original recipe/time. | Lost source → synthesis; lost building → rebuild; all footholds lost → scenario defeat rules, not invented universal defeat. | No free countdown revival; no copied inventory; recreated Melkor keeps doctrine. |
| Combat warning / counter | Visible warning area, affected known units, windup/response window from actual ability, cost/readiness/range/duration, available ordinary counters and commit review. | Hidden targets remain hidden; unavailable counter names required prerequisite; text and boundary persist if sound/motion off. | No healthy hero/capital erased by a single use; no implied infinite control chain; link actual roster action. |
| Melkor creature call / manufacture | Distinct “Call existing creature” and “Produce new creature” actions; existing permanent ID, discovered living location/route, cost and reservations. | Worldbreaker never receives manufacture/egg/revive route, including captured facilities. Dead candidate stays dead. | Dragon/Balrog control cannot transfer via trade, transport, domination, annexation or alliance; Sauron no exception. |
| Objective progress | All players see public site control, capture eligibility and hold streak. Scenario banner states from turn 8, at least 2 of 3 sites held for 3 consecutive resolutions; loss resets streak. | Contested or unsupplied means not qualifying; air must land. Unknown enemy detail remains unknown. | Narrative victory is clearly a different scenario; no hidden progress UI. |
| Inspection / dialogue | Object/portrait, evidence status, provenance/condition, concise description; choices with factual effects if a commitment is involved. Optional expressive replies can have bounded narrative reactivity. | Long text scrolls without losing speaker/close controls; unknown lore attribution says so. | No unapproved inner-voice skill system, copied dialogue or hidden resource deductions. |
| Weekly resolution | Review operations and hero commitment, queues ticking independently, publicly known risks, unspent budget. Explicit “Resolve week” control. | New visible state invalidates a choice → return to review with reason; never charge twice. | Actual execution/idempotency/reconnect handling require later engine tests; gallery asserts none. |
| Settings | Text scale, contrast mode, reduced motion, separate audio volumes, captions, key remap, overlay/pattern visibility, UI scale. | Settings available before campaign and during play; focus restored on return. | No faction intelligence gate; no cost; display changes never alter turn state. |

### Hero slot model

`Uncreated → component ready → creating (reserved) → living`.

From living: `living → captive → living` through rescue, or `living → dead → recreating (reserved) → living`. A captive can enter the latter path only through `captive → dead` after explicit surrender.

A component alone is not a second hero. Captive transitions to living through rescue, or to dead through explicit surrender. A pending job locks the unique slot; living and captive are both occupied. A destroyed creation facility has no completed hero; the consequence is lost unfinished work and appropriate reopened recovery, not two job outputs. Exact event/transaction contracts belong to the future engine.

Rohan example: normal component `10M + 5K / 1 turn`; hero `100P + 40M + 20K + 10E / 2 turns`. Show both, and show total `100P + 50M + 25K + 10E / 3 sequential turns`. If the component is already owned, show its inventory consumption and only remaining payment, not double billing. Fallback component `30M + 20K + 10E / 3 turns` is instead of the normal component, never added to it.

## Proposed view and interaction pattern

| View | World treatment | Reading/control treatment |
|---|---|---|
| Strategic | Dominant continuous landscape, compact company/hero markers, optional named overlay | Top stock/week band, objective strip, selected summary; full panel only on request |
| Local | Same orientation; production footprints, access paths, tiny workers | Facility queue + source access + fixed hero state in side sheet; return-to-world breadcrumb |
| Inspection | Retain place thumbnail or contextual backdrop | Intimate portrait/object, factual fields, narrow reading measure; deliberate commitment review |
| Economy | World context can shrink | Queue rows grouped by facility, filters and failure reasons; no decorative dashboards invented to fill space |
| Map study | Explicit top-down schematic (different from rendered local projection) | Legend, route confidence, resource access, ownership and warning patterns; named entity list |
| Dialogue | Scene remains visible where space allows | Speaker, portrait, text history, numbered but remappable choices; no time pressure without source rule |

Hover previews are duplicated by focus/selection. Selecting a tiny figure uses an enlarged target and disambiguation list when overlaps occur. Pins/labels can move to avoid collision with leader lines; objects do not move. Occluding trees fade or use a silhouette outline only during inspection, with a setting to keep terrain stable and use the entity list instead. Terrain transparency must not reveal unknown enemies.

## Accessibility requirements

- Functional reading surfaces are opaque. Only approved pairings in tokens may carry text; measure 4.5:1 for all normal text, 3:1 for control boundaries/focus. Art colors and live backgrounds are not assumed compliant. Labels over art have opaque backing; line overlays have a dark casing and a matching text/list representation.
- Ownership, selected, hostile, warned, blocked, unknown and available use words plus distinct shapes/patterns. No red/green-only encoding. Stock abbreviations are always accompanied by full names in the persistent band or focus detail. An icon is never the sole explanation of a resource or counter.
- Start body copy at the token size; allow 200% text scaling with reflow. A side panel becomes a full-width reading surface when needed; do not shrink all controls to preserve the painting. Do not hardcode text into the generated image. Test Númenor, Fëanor, Aulë, Eönwë and localized long strings. Maintain searchable Unicode names and accessible labels; no forced ASCII display.
- All interactive targets meet the token minimum in both dimensions. A 10–18px world figure can have a 44px target and a list alternative. Crowded targets open a disambiguation list; invisible overlapping hit rectangles cannot select arbitrary entities.
- Visible keyboard focus, logical order, no keyboard trap; Escape dismisses only the top reversible layer. Focus returns to the opener, announcements describe committed result once. Persistent status is available to assistive technology without flooding announcements on every ambient change.
- Screen-reader contract: region headings, meaningful button names, semantic lists/tables, dialog labels, textual route/queue summaries and image descriptions. Decorative texture is ignored. Accessible tree behavior, gamepad support and screen-reader operation in a future engine require runtime testing.
- Reduced motion removes camera flights, parallax, idle effects and panel animation; no flashes. Sound has captions or visual equivalents and independent voice/ambience/UI volume. Do not rely on stereo direction to reveal a necessary warning.

## Information and copy examples

| State | Use | Reject |
|---|---|---|
| Missing input | “Horse crest: metal source access missing. Synthesize at the core: 30M + 20K + 10E, 3 turns.” | “Cannot do that.” |
| Captive | “The Rider Marshal is alive in captivity. Your hero slot remains occupied.” | “Recruit another hero.” |
| Death | “The Marshal is lost. The stead continues its work. Recreate the same hero at the Muster Hall.” | “Revives automatically in 2 turns.” |
| Uncertain route | “Northern track — last observed week 6. Conditions unconfirmed.” | “Safe route” inferred from absence of visible enemies |
| Worldbreaker | “Call a discovered living creature. Dead creatures cannot return through this doctrine.” | “Summon Dragon” for an existing-ID call |
| Object history | “The maker's mark is worn. The repair is later than the original ironwork.” | A confident named-owner claim without source evidence |

Narrative warmth surrounds facts, never replaces them. Original voice examples and lore boundaries live in [world/narrative](world-narrative.md). Test the complete flows with players before treating these screen proposals as usable game UX.
