# World, views and narrative

Status: new presentation guidance, 2026-09-29. Gameplay authority remains [revision 6](../silmarillion-game-report.md). Source IDs resolve in [source authority](source-authority.md); profile treatments live in the [faction matrix](faction-matrix.md). Functional controls and their state requirements belong to [UI/UX](ui-ux.md); exact provisional measurements belong only to [tokens](tokens.json).

## World rule: a place must explain an action

Every playable composition contains an approach, a reason to stop, evidence of work and a route onward. Geography explains decisions before an overlay adds numbers. A ford offers a crossing and exposes a caravan; a terrace offers visibility and an exposed ascent; a shaded workshop suggests skilled labor and a narrow service road. Avoid placing arbitrary resource icons in otherwise interchangeable scenery.

For each scene, the brief records: named/canonical region; chronology mode; original local place name if used; primary terrain barrier; viable approach routes; observed resource access; production activity; visible history; unknown information; and at least one quiet sign of care. “Forest with ruins” is insufficient. A broken wheel patched with an older carved panel says who worked here and what they chose to preserve.

Landscape remains dominant across factions. A tiny settlement can matter because the player understands its work and people. Monumentality comes from cliffs, forest structure, water, weather and the accumulation of craft, not enormous map pawns. Figures and tools retain plausible relationships within a local scene. The large portrait is a separate view of the same identity.

## Three views and their scale promises

| View | Represents | Must reveal | Must not imply | Navigation and framing |
|---|---|---|---|---|
| Strategic | Routes, regions, sites, companies and weekly commitments | P/M/K/E stocks; operation/hero commitment availability; objectives; known routes, travel commitments, ownership and report age | One map marker equals one full-scale person; distant realms lie a few footsteps apart; unseen enemy positions are current facts | Stable north indicator, landmark hierarchy, pan/zoom, explicit “Enter local view” action; selected site anchors the next view |
| Local | One bounded place at coherent physical scale: worksite, settlement, crossing or encounter | Facilities, queues, source access, actual figures/groups, exits, traversal barriers, current selection and announced danger | Decorative water/wood/rocks are automatically traversable or harvestable; every painted person is selectable | Fixed orthographic oblique baseline; pan/zoom; clear authored exits; preserve selected entity and arrival direction |
| Inspection | Portrait, object, building, hero or conversation detail | Identity, condition, provenance, known facts, prerequisites, actions and commitments | A portrait is a second hero, an inspectable object's apparent radiance is an undisclosed stat, or a canonical item exists twice | Open from focus/selection, preserve context, return to previous camera/selection; no involuntary map zoom to show a face |

The baseline is a **projection experiment**, not a chosen renderer or engine. Camera pitch/yaw, figure heights, viewport resolution and panel proportions in tokens are hypotheses to test. Historical reading-note pixel ranges disagree because they explored different views; do not combine them into a hidden scale requirement. Do not turn an isometric local scene into a floating cutout with no continuation beyond its edges. An optional rotation feature remains an implementation decision requiring occlusion and orientation tests, not a promised capability.

On transition, retain the site ID, selected profile/entity, report knowledge state and route meaning. Strategic travel arrows resolve into local arrivals at authored exits; there is no silent teleport. An inspection panel may occupy more screen space than the character without changing the world's physical scale. If a very large creature needs more space, give its body a physically credible size and preserve hit/selection conventions; never enlarge all heroes to compensate.

## Camera, occlusion and tiny figures

Compose three or four major value masses, with a readable route running between them. Let foreground trunks or rock edges frame rather than seal the action. Avoid fine-grain texture of equal sharpness everywhere. Selective lost edges are permitted in uninteractive atmosphere, not on the only crossing or selected figure.

When an object is occluded, show its selection footprint/outline and a contextual label over the occluder. Fade or cut away only the obstructing authored layer; do not reveal unknown enemies by x-ray. Hover/focus previews use the same rule. A selected figure must remain findable through rain, pale rock, dark canopy, water reflections and friendly crowds. Provide “Locate selection” and a list-based alternate route to every actionable entity.

Map figures use three identity cues: a silhouette mass (hood, shield, staff, wing, body plan), a gait/posture, and a small bounded textile/material accent. Color alone never identifies allegiance, hero status or hostility. Idle motion should reveal work or attention: a smith tests a joint, a courier protects a packet, a scout pauses at a fork. Do not use constant bobbing, spectacle loops or exaggerated weapons to keep attention.

Selection is an interaction layer larger than the artwork. Footprint targets may extend beyond the sprite; overlapping targets resolve through a labeled chooser or entity list. Selection, keyboard focus, hover and path previews remain separate states. Labels appear on focus/selection and on request; important alerts remain explicit. Dense streets need an optional label mode and cycling, not permanently stacked names.

Movement preview shows the known traversable path, exit/site destination, time or commitment charged by the current rules, conflicts and uncertainty. Use solid segments for confirmed path, broken segments with an uncertainty label for unverified continuation, and a blocked glyph at a known impassable edge. Never make a broken line silently mean both “uncertain” and “unreachable.” Show route changes before confirmation; pending movement is distinguishable from completed movement.

## Maps: evidence, invention and legibility

**Canonical regional map:** preserve source-supported river topology, major mountain barriers, coast relationships and historically appropriate names. LORE-09 provides Beleriand's relative geography; LORE-05 establishes Brethil between Teiglin and Sirion, outside the Girdle. The Crossings of Teiglin and Brithiach are distinct. Falas/Balar and Gelion/Ossiriand are regional destinations, not adjacent Brethil camps. Printed map seams are neither roads nor borders. First Age Minas Tirith on Tol Sirion is not Gondor's later Minas Tirith.

**Invented local composition:** author camps, footpaths, workshop yards, individual trees, small bridges, fords and shelters that fit the regional constraints. Label the map legend “Original local layout within [region].” Do not add an invented camp to the lore index as a discovered canonical settlement. A painting is not a surveyed tactical plan; route geometry must be authored and checked separately.

**Cross-era sandbox:** label the map and selection screen accordingly. Use regional analogues or explicitly joined theaters; document that connection in the scenario brief. A later-age faction placed in a Beleriand-shaped arena does not establish a canonical colony. Do not relocate Gondor, Númenor or Rohan onto the book's First Age map without that explanation. A historical scenario needs a separate era audit; it cannot inherit all 54 factions by default.

Terrain layers communicate slope, water depth/fordability, woodland cover, road quality, shelter and source access using bounded symbols with a text legend. Decorative tree density alone does not define visibility rules. Cliffs have consistent impassable edges; route overlays terminate at them unless a defined traversal action exists. Resource access markers describe the current rule tag (timber, stone, metal, textile, crystal, living grove, etc.) while stock totals remain P/M/K/E.

Fog is knowledge, not darkness painted over all beauty. The base terrain can show a clearly marked remembered map while dynamic entities disappear when no longer observed. Every report carries its source, location and age; uncertain reports receive a distinct label. Intelligence may add tracks, corroboration, movement evidence or preserved reports. It never unlocks the ordinary recipe cost, repair bill or navigation controls. An atmospheric mist bank may coexist with full knowledge, and a bright plain may hold unobserved activity.

Overlays are switchable tasks: routes, source access/production, control/objectives, known threats and evidence. Use restrained area fills, edge lines, patterns and icons; avoid repainting the whole landscape into a multicolored heatmap. Default to the currently relevant overlay with a visible off switch. Objective progress in the common scenario stays visible to all players; palette or fog never conceals it. Melkor's call preview displays an existing creature's ID, known location, real route and capacity reservation; production preview displays a job at a facility. Their visual grammar must remain different.

## Regional atmosphere and history

Region is more than faction color. A Fëanorian workshop on a wet coast inherits salt, wet stone and cloudy light; its precise crystal fittings do not turn the coast red. A Rohan remount circuit in damaged terrain visibly struggles with broken ground and depleted fodder. Family treatments in the matrix modify architecture, objects and human practice inside an environmental palette; they do not replace the biome with a uniform faction tint.

Build local history through three time layers: the older land, the settled work, the recent consequence. Example: a smooth rock shelf predates a weathered ferry post; the post carries a newly tied rescue rope. Environmental evidence must agree with quest/state data. A burned store remains damaged until repaired, a completed boat leaves its cradle, a departed family leaves a cleared sleeping space. Avoid free resource clues from decorative props unless interaction confirms their status.

Loss should leave absence, repair and altered use rather than endless gore. Hope appears as shared food, new grafts, lit windows, repaired harness, copied records and a road made passable again. Beauty can survive in a hostile faction's precise metalwork; visible coercion and damage must retain their moral meaning. Do not use ugliness as a substitute for political characterization or biological identity as a moral score.

## Narrative voice

Use concrete observed things before abstraction: water against a hull, a thumb over a repaired seam, a name recited incorrectly. A speaker's practical stake makes the larger theme legible. Wonder may be sincere; tenderness does not need a cynical punch line. Dark humor comes from exhausted competence, stubborn habit, failed ceremony or unequal expectations. Do not turn grief, disability, refugee status or cultural difference into the joke.

Each speaking character needs a competence, present task, person/place they care for, public claim, private uncertainty and boundary they may defend. Give canonical figures source-grounded dispositions; original working characters can carry new local dilemmas. Portraits show differing attitudes and fatigue through gaze, asymmetry and posture rather than universal grimaces. Noble figures may be amused, evasive, attentive or ashamed. Neither realism nor psychological complexity requires a modern detective persona.

| Voice family | Use | Avoid | Original line illustrating register |
|---|---|---|---|
| Craftsperson | Exact material, repair, labor, responsibility | Mystical jargon for every tool | “The hinge will bear the gate. The post will not.” |
| Mortal steward | Seasons, mouths to feed, finite opportunity | Mortality as cowardice or inferiority | “We can promise spring. We must still feed them tonight.” |
| Long-lived keeper | Specific memory and changed names | Omniscient exposition or endless archaic clauses | “The path was open when I last came. That is not the same as saying it is open now.” |
| Divine embodiment | Domain, attention and limits, varied temperament | Administrative speeches from every Vala; generic booming threats | “I can hold this crossing. I cannot be every road.” |
| Coercive commander | Useful order, dependency, the cost imposed on others | Cartoon evil speech; making coercion disappear behind efficiency | “The stores will open when the households give their names.” |
| Creature or guardian | Sensory priorities and appropriate body/world relation | Human shoes, tavern banter and bureaucratic title pasted onto every species | “The stone is warm. Something beneath it has not slept.” |

These lines are original illustrative voice samples, not Tolkien quotations or new abilities. Named Istari require separate voices; two blue robes do not imply shared personality. Alatar/Pallando's characterization remains invented and must not impersonate an unverified textual biography.

Inner voices are not a required feature. Psychological conflict can be expressed through dialogue alternatives, portrait expression, remembered testimony, a qualified narrator and consequential action. Do not add skill entities, hallucinations or “voices of the Valar” merely because Disco Elysium uses internal interlocutors.

## Dialogue, commitments and failure

Dialogue choices describe the player's actual act. If a choice spends stocks, time, an operation, the hero commitment or an item, show that cost before confirmation using ordinary UI language. Keep literary prose in speech and object history; keep transactional consequences concise. A high-flown sentence must never disguise an irreversible commitment.

A scene distinguishes observed fact, testimony, inference and promise. A mistaken witness is not necessarily lying. The game may conceal future events or an adversary's intent, but not change a revealed rule because the narrative wants a tragedy. Explicitly state whether a choice commits immediately or opens a preview. Failure should create a changed situation—delayed arrival, damaged trust, lost equipment, an alternate route—within the authorized mechanics. Do not invent an unseen “hope currency” to price every moral action.

Oaths attach to people, purposes and witnesses. They are not uniformly good, uniformly corrupt or interchangeable temporary buffs. LORE-13 shows reconciliation, possessive oathmaking and a later argument that breaking the oath would do less evil; choices remain consequential. An object's ownership can be contested without a UI deciding that possession ends all other claims. Source LORE-03 supports the intimate value of ships.

## Completed original narrative example: The Spare Peg

**Status:** authored local scene for a cross-era sandbox; original people and object, no new rule or canonical event. **Place:** a repaired boat at an invented riverside production yard. **Participants:** a boatwright and a quartermaster attached to the selected faction. **Visible history:** one peg is a different wood; old household initials remain on it. **Known fact:** it was cut from a broken chest used during an earlier evacuation. **Uncertain claim:** its former owner may still live upstream.

**Boatwright:** “It fits. I have tested it under load.”

**Quartermaster:** “You left the letters facing out.”

**Boatwright:** “They are not mine to plane away.”

**Inspection text:** “A pale peg against dark, wet ribs. The letters survived the chest; a boat now carries them. The maker calls it sound. No one here knows whether its first owner has seen the river again.”

**Choices:** “Inspect the repair” opens known condition/material information without cost; “Review the boat's production record” opens the existing queue/item history; “Ask about the owner” opens qualified testimony; “Close” returns to the yard. This example commits no resources and grants no hidden buff. A later task could author a rescue chain using existing movement/economy rules, with explicit costs and source boundaries.

**Validation:** the object panel identifies it as original; maker, known provenance and uncertain testimony are separate; the map boat remains small; letters are readable in inspection, not required at map scale; returning closes the panel without losing selection.

## Completed microcopy examples

These are presentation patterns bound to revision 6. Values come from the current recipe at implementation time; do not hard-code examples as a second balance source.

| State / action | Copy pattern | Guardrail |
|---|---|---|
| Faction selection | “Rohan · Rider Marshal · Cross-era sandbox” | Exactly one fixed hero; no extra named king |
| Doctrine confirmation | “Worldbreaker stays selected after Melkor's return.” | Persistent doctrine disclosed before commitment |
| Source absent | “Horse crest needs metal access. Review trade or component synthesis.” | Stock and source access are distinct; fallback remains visible |
| Creation preview | “Create Rider Marshal · 100P + 40M + 20K + 10E · 2 turns · Horse crest consumed” | Correct base recipe, component separately itemized |
| Hero commitment used | “Hero committed this week. Production continues.” | Does not imply ordinary queues consume operations |
| Captivity | “Captive · Hero slot occupied. Review rescue or surrender.” | No second creation queue; surrender consequences in confirmation |
| Death | “Hero fallen. Development is retained. Equipment remains at the death site.” | Return is paid; no copied equipment |
| Recreation | “Recreate the same hero. Full recipe, new component and production time required.” | No free countdown revival |
| Worldbreaker call | “Call existing creature · [ID] · [known location] · Review route and reserved capacity” | Not a spawn or production job |
| Intelligence uncertainty | “Tracks reported here · [source] · [observed time] · Not yet confirmed” | Uncertainty does not hide basic UI information |
| Counter warning | “[Power] preparing · [affected area] · [response window] · View counters” | Warning text mirrors actual ability rules |
| Cancel production | “Cancel this job? Half its stock cost is returned. The unfinished work ends.” | Matches r6 voluntary cancellation; destruction is different |

## Review questions and acceptance

- Does the map declare its era and distinguish source geography from original local construction? Fail if a cross-era roster is labeled a canonical First Age snapshot.
- Can a player find the selected small figure and its available action without recognizing a face at map scale? Fail if enlargement of all figures is the only solution.
- Do routes, cover, obstacles and source access remain readable with decorative layers reduced? Fail if one overlay must be inferred from color alone.
- Does a report distinguish age and certainty from actual state? Fail if atmospheric fog conceals known costs or shows current unseen enemy movement.
- Do voices differ through stakes and competence? Fail if every character uses the same cynical register or lore lecture.
- Do choices reveal commitments and produce the represented consequences? Fail if prose promises agency that the scenario contract denies.
- Does a failed encounter preserve the distinct meanings of captivity, death and paid return? Fail if a captive permits another living hero or recreation resets a doctrine.

Static art and documents can demonstrate these patterns. Actual target acquisition, controller/keyboard use, screen-reader relationships, motion, audio, route comprehension, pacing and emotional effect require an interactive prototype and playtests. No static gallery certifies those outcomes.
