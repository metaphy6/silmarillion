# Art bible — light held in the world

**Status:** new shared art decisions, subordinate to [source authority](source-authority.md) and revision 6. Derived adaptations are traced in [adaptation matrix](adaptation-matrix.md); named observations have evidence in [research ledger](research-ledger.json). Numerical viewing targets live only in [tokens](tokens.json) and remain prototype hypotheses.

## Image grammar

1. **Land before icons.** Read river, ridge, forest mass and open ground before a settlement; settlement before a person; person before a buckle. Three major value groups, with the broadest middle-value ground uninterrupted by unnecessary HUD. Reserve quiet land around important routes. A full landscape continues beyond frame edges; no floating diorama base.
2. **Small does not mean insignificant.** A map figure carries one legible posture, one cloak/wing/body shape, one light/dark break and one identifying object. The same worn clasp, bent staff or notched tool recurs in its portrait. Keep the figure physically small; enlarge the selection target and provide list/portrait access.
3. **Beauty has work in it.** Use repair, weather and skilled construction to communicate care. Show tool wear at contact surfaces, not uniform grunge. Forges need fuel storage and work access; stables need fodder and pasture; a refuge needs paths and shelter. Unused sockets, empty boats and repaired doors carry histories without a paragraph over every object.
4. **Darkness has color.** Separate violet-blue shadow from viridian land and silver atmospheric distance. Use warm straw, amber or coral as limited inhabited accents. Preserve luminous water, cloud breaks and pale stone; don't lower every value to manufacture seriousness.
5. **Power has a place and a cost.** Effects have a visible origin, affected area and ending. Compose a bounded wind corridor or a strained anchor, not a full-screen generic spell. Gameplay warnings remain readable above decorative effects. Never imply a larger ability than the roster grants.
6. **A face can disagree with its costume.** Portraits carry fatigue, curiosity, regret and resolve through gaze, mouth tension, asymmetry and hands. Do not reduce cultures to villain/saint physiognomy or beauty rankings. Orc institutions are player choices in the game; their portraits are not automatic moral verdicts.

## Composition and projection

Strategic: oblique orthographic landscape with no horizon; roads run through the painting, not between isolated board tiles. Keep continuous terrain and two legible approaches to contested objectives where the scenario requires them. Local: same directional lighting and world orientation, closer enough to distinguish queue buildings and working life. Inspection: detach an object/portrait into an opaque reading surface; never change the world scale to make the hero fill the map.

A diagonal river may organize a scene, but don't reuse the Brethil crossing in every region. Coast uses broken shore/harbor void; Dwarven territory uses terrace/shaft thresholds; woodland uses canopy masses and clearings; plains use long open bands; sanctuary uses one concentrated place in broad land. Break left-right symmetry. Avoid always placing the primary target beneath a permanent panel. Render a clean art layer underneath interface masks.

Camera, zoom, occlusion and geography policy are specified in [world/narrative](world-narrative.md); interaction contracts in [UI/UX](ui-ux.md). Do not treat historical camera or pixel suggestions as selected implementation settings.

## Paint and edge hierarchy

Block landform, traversal and building footprint in flat shapes first. Validate navigation before texture. Paint tactile interiors inside those shapes; texture must not break traversability or make every tree edge equally sharp. The research's separated shape-mask workflow is a useful production technique, not a requirement to use a particular renderer.

At the focal worksite, use hard edges at door, tool, bridge lip and silhouette break. Lose soft cloak edges into weather; recover the face or hand in inspection. Mid-distance merges small details into masses; far edges become cooler, lighter and softer. Never blur critical targets or route contours to imitate atmosphere. Repeated brush direction follows slope, grain or flowing water; noise across everything is a failure.

## Palette relationships (decorative, not UI semantics)

| Family relationship | Ground and shadow | Light / small accent | Treatment |
|---|---|---|---|
| Grassland and inhabited timber | deep meadow `#344D43`, slate `#304751` | straw `#C6AB72`, ember `#C9754E` | Open wind, worn timber and cloth; hearth is an island |
| Elven woodland / refuge | viridian `#214B48`, blue violet `#383D59` | birch `#D7D9BE`, muted rose `#BA7E80` | Cool depth with carefully placed pale craft, not neon green |
| Stone and forge | mineral `#334D62`, iron `#323338` | chalk `#CBC7B8`, hot amber `#D99456` | Strong construction joints; warmth stays at working source |
| Sea and star | ocean `#28505C`, indigo `#303B63` | sea-glass `#A9C9BE`, pale gold `#D8C698` | Wide cool space, interrupted by navigational/craft light |
| Shadow industry | violet coal `#2C283A`, oxidized iron `#50443E` | tarnished copper `#AB7751`, ember `#CA6D51` | Planned harsh geometry, stressed land; no featureless black |
| Habitat / creatures | peat `#394332`, bark `#57493E` | lichen `#AAA97C`, moon-silver `#BCC8CA` | Body and habitat rhyme without becoming invisible |

These palettes are starting relationships, not faction skins. [Faction matrix](faction-matrix.md) defines all exceptions and economic identities. Do not use a decorative hue to encode ownership, hostility, affordability or rarity. Those use named functional tokens plus text/shape. Small warm accents should not turn every panel gold or every strong object red.

## Materials and construction

| Material | Show | Avoid |
|---|---|---|
| Living wood | directional grain, bent growth, repaired joint, uneven wet/dry value | extruded plastic branches, identical treehouses |
| Worked timber | cut ends, joinery, pegged braces, roof-weight support | beams without structural purpose |
| Stone | load-bearing masses, joints, edge chips where touched, mineral variation | universal gray brick texture |
| Iron / copper | restrained bright contact edge, matte oxidation, forge-scale | mirror chrome and gold trim on everything |
| Cloth / leather | weight, folds at tension, frayed repairs, small identifying weave | flat printed symbols enlarged to billboard size |
| Water / air | broad value shift, broken reflections, soft overlap and directional movement | transparent blue floor, constant sparkle particles |
| Craft / magic | specific prepared vessel, seam, bounded pressure or light | generic floating runes and endless luminous rings |

An Eagle eyrie, Ent nursery, Wolf den and Spider chamber use habitat structure, per the roster; never reskin a human barracks. Aulë's sanctuary stays small; craft excellence does not enlarge its city cap. Melkor's industrial doctrine receives a different settlement vocabulary from Worldbreaker's sparse sanctuary, while retaining the same identity.

## Portraits, figures, buildings and armies

Portrait: human-scale emotional access even for a chosen divine manifestation. Eyes and hands receive detail; outer silhouette can dissolve. Clothing exposes cultural work and history before status. No actor likeness, no Disco character imitation, no compulsory film costumes. Species anatomy remains coherent; no humanoid armor default for creatures. Use source-anchored decisions or label invention.

World figure: simplify cloth into a clear wedge, spear/staff into a single vertical, bird into wing/body separation. Test on meadow, stone and shadow. Never make a selected unit three times taller. Army depiction indicates company identity and supplied/unsupplied state with labels; a decorative crowd count cannot substitute for the actual unit list. Mixed armies preserve individual ownership; coalitions do not merge hero slots or grant allied Dragon/Balrog control.

Production building: functional silhouette plus visible input/output yard. Queue/status labels remain precise UI. Hero building has a recognizable entry and component station; its ornament may be stronger than ordinary workshops, but it is not a second giant hero figurine. Upgrades add a functional bay or fitting, not arbitrary towers.

Artifact: present workmanship, condition and use. A local recipe focus is not a duplicate canonical unique relic. Read history as evidence, including who knows it and uncertain attribution; see [world/narrative](world-narrative.md).

## Lighting, weather, motion and sound

Pick one broad sky illumination and a few grounded warm sources. Shadow placement must agree between art plates, figures and props. Light admits wonder: pale dust in a forge, rain silver on a roof, an opening in cloud. Danger is not always red light; safety is not always bright white.

Rain, mist and snow change atmosphere but cannot erase route and warning overlays. Weather's mechanical effects, if any, require current rule authority; this package adds none. UI surfaces remain opaque regardless of weather.

Idle motion is sparse and localized: cloth moves after wind reaches it, smoke bends with the scene, a worker completes an actual task. No constant bobbing of every marker. Reduced-motion rules and durations are in tokens. Ambient sound supports scale through near work and distant river/wind; narration has separate volume and captions. A warning sounds once on meaningful state change and remains visible. No source footage was needed to select a compulsory music style; do not claim the gallery demonstrates audio or real-time motion.

## Failure patterns

Reject muddy brown everywhere; glossy mobile-city buildings; giant map heroes; decorative runes replacing labels; dark transparent body text on busy paint; blanket gold ornament; stereotyped evil facial anatomy; unbounded magic; Brethil used as the whole world's geography; or historical inner voices quietly becoming mechanics. Each rejection needs a visual or rule-level reason, not merely “does not feel like Disco Elysium.” Annotated controls in [review rubric](review-rubric.md) make this testable.
