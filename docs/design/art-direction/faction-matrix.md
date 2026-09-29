# Faction and profile visual matrix

Status: 55 profiles / 54 factions, matched by exact ID, faction and hero to revision 6. Every profile covers seven asset domains. All specific visual treatments are new presentation decisions, not canonical facts or revised mechanics.

**Authority:** [faction-matrix.json](faction-matrix.json) owns the per-profile content; this is its readable view. If changed, update both together. Source IDs resolve in [source authority](source-authority.md). Shared rendering/composition rules belong in [art bible](art-bible.md), view/narrative rules in [world guidance](world-narrative.md), and functional colors in [tokens](tokens.json).

Families are production grammars, not extra factions or assertions of ancestry. A family can connect people who work similar materials while their institutions, moral choices, domains and histories remain distinct. Palette hexes below are decorative art swatches only; never use them as untested text/background pairs.

## Shared visual families

| ID | Shape and material grammar | Decorative base / middle / accent |
|---|---|---|
| `high-air` — Air, light and signals | Long narrow verticals; open sightlines; small bright nodes. Pale stone, wind-worn cloth, lens glass, calibrated metal. | `#182B47` / `#6A8297` / `#DED8AF` |
| `river-sea` — Water, shore and voyages | Horizontal sweeps, sheltered concavities, hull curves. Wet stone, worked timber, rope, shell, salt-worn metal. | `#163D46` / `#618C89` / `#DECE9F` |
| `living-refuge` — Living growth and care | Nested canopy, porous edges, varied growth stages. Living bark, leaves, clay vessels, woven shade, worn linen. | `#193D34` / `#678C55` / `#D4B47D` |
| `memory-threshold` — Memory, waiting and sanctuary | Measured thresholds, still verticals, cloth planes. Basalt, pale stone, woven records, soft weathered textiles. | `#302A40` / `#847D97` / `#D5C2A0` |
| `path-and-pursuit` — Paths, passage and pursuit | Diagonals, directional gaps, light mobile shelters. Weathered timber, leather, cord, local stone and travel cloth. | `#273B38` / `#A0804D` / `#B7CFBC` |
| `worked-stone` — Craft, excavation and fitted work | Heavy load-bearing forms with precise small joints. Cut stone, iron, copper, crystal, soot, timber bracing. | `#242D37` / `#745B4E` / `#DBA85F` |
| `elven-house` — Elven community and skilled tradition | Restrained branching/arched forms; distinct house organization. Fitted wood and stone, woven cloth, maintained metal. | `#263D47` / `#6F927E` / `#D8CEA3` |
| `mortal-works` — Mortal civic and agricultural work | Useful repetitive bays and broad work/service routes. Dressed masonry or timber, iron fittings, grain, wool. | `#333E42` / `#92794D` / `#D8C596` |
| `commons` — Refuge, household and mutual work | Low inviting clusters, open working courts, human-scaled doors. Repaired cloth, plaster, timber, earthen stores, small lamps. | `#313C3A` / `#866B50` / `#DBB168` |
| `veiled-path` — Concealment and qualified evidence | Offset layers and interrupted edges with readable exits. Frosted glass, thin cloth screens, local masonry, wax. | `#293A49` / `#77728B` / `#C0B9A8` |
| `dominion-works` — Coercive or contested industry | Compressed monumental planes and exposed service dependencies. Black iron, basalt, salvaged metal, soot and worn banners. | `#272633` / `#615361` / `#D29A53` |
| `embodied-wild` — Habitats and nonhuman bodies | Body-appropriate shelter, movement and storage shapes. Local living/rock materials; no default humanoid furnishings. | `#283836` / `#777B66` / `#B9A17A` |

## Coverage index

| Profile ID | Faction / sole hero | Family | Current report |
|---|---|---|---|
| [`manwe`](#manwe) | Manwë's highlands / Manwë | `high-air` | PROJECT-01 §04 |
| [`varda`](#varda) | Varda's beacon settlements / Varda | `high-air` | PROJECT-01 §04 |
| [`ulmo`](#ulmo) | Ulmo's waterside enclaves / Ulmo | `river-sea` | PROJECT-01 §04 |
| [`aule`](#aule) | Aulë's workshops / Aulë | `worked-stone` | PROJECT-01 §04 |
| [`yavanna`](#yavanna) | Yavanna's living groves / Yavanna | `living-refuge` | PROJECT-01 §04 |
| [`namo`](#namo) | Mandos's sanctuary halls / Námo / Mandos | `memory-threshold` | PROJECT-01 §04 |
| [`irmo`](#irmo) | Lórien's dream gardens / Irmo / Lórien | `living-refuge` | PROJECT-01 §04 |
| [`nienna`](#nienna) | Nienna's refuge cloisters / Nienna | `memory-threshold` | PROJECT-01 §05 |
| [`orome`](#orome) | Oromë's frontier lodges / Oromë | `path-and-pursuit` | PROJECT-01 §05 |
| [`tulkas`](#tulkas) | Tulkas's muster grounds / Tulkas | `mortal-works` | PROJECT-01 §05 |
| [`nessa`](#nessa) | Nessa's relay settlements / Nessa | `path-and-pursuit` | PROJECT-01 §05 |
| [`vana`](#vana) | Vána's bloom nurseries / Vána | `living-refuge` | PROJECT-01 §05 |
| [`este`](#este) | Estë's healing refuges / Estë | `living-refuge` | PROJECT-01 §05 |
| [`vaire`](#vaire) | Vairë's archive halls / Vairë | `memory-threshold` | PROJECT-01 §05 |
| [`elf_vanyar`](#elf-vanyar) | Vanyar / Concord Singer | `elven-house` | PROJECT-01 §07 |
| [`elf_feanor`](#elf-feanor) | House of Fëanor / Jewelwright | `worked-stone` | PROJECT-01 §07 |
| [`elf_fingolfin`](#elf-fingolfin) | House of Fingolfin / Shield Marshal | `elven-house` | PROJECT-01 §07 |
| [`elf_finarfin`](#elf-finarfin) | House of Finarfin / Lore Envoy | `elven-house` | PROJECT-01 §07 |
| [`elf_falmari`](#elf-falmari) | Falmari / Tide Captain | `river-sea` | PROJECT-01 §07 |
| [`elf_sindar`](#elf-sindar) | Sindar / March Warden | `elven-house` | PROJECT-01 §07 |
| [`elf_nandor`](#elf-nandor) | Nandor / Woodland Pathfinder | `path-and-pursuit` | PROJECT-01 §07 |
| [`elf_avari`](#elf-avari) | Avari clan / Frontier Mediator | `path-and-pursuit` | PROJECT-01 §07 |
| [`human_gondor`](#human-gondor) | Gondor / Citadel Engineer | `mortal-works` | PROJECT-01 §08 |
| [`human_rohan`](#human-rohan) | Rohan / Rider Marshal | `mortal-works` | PROJECT-01 §08 |
| [`human_numenor`](#human-numenor) | Númenor / Ocean Warden | `river-sea` | PROJECT-01 §08 |
| [`dwarf_khazad_dum`](#dwarf-khazad-dum) | Khazad-dûm / Deep Surveyor | `worked-stone` | PROJECT-01 §09 |
| [`dwarf_belegost`](#dwarf-belegost) | Belegost / Armor Master | `worked-stone` | PROJECT-01 §09 |
| [`dwarf_nogrod`](#dwarf-nogrod) | Nogrod / Master Artificer | `worked-stone` | PROJECT-01 §09 |
| [`orc_fortress_clan`](#orc-fortress-clan) | Orc fortress-clan / Warband Organizer | `dominion-works` | PROJECT-01 §09 |
| [`hobbit_shire`](#hobbit-shire) | Hobbit Shire / Shirekeeper | `commons` | PROJECT-01 §09 |
| [`troll_hold`](#troll-hold) | Troll Hold / Stonebreaker | `embodied-wild` | PROJECT-01 §10 |
| [`wolf_pack`](#wolf-pack) | Wolf Pack / Packwarden | `embodied-wild` | PROJECT-01 §10 |
| [`istari_gandalf`](#istari-gandalf) | Gandalf's Fellowship / Gandalf | `commons` | PROJECT-01 §06a |
| [`istari_saruman`](#istari-saruman) | Saruman's White Tower / Saruman | `dominion-works` | PROJECT-01 §06a |
| [`istari_radagast`](#istari-radagast) | Radagast's Woodland Circle / Radagast | `living-refuge` | PROJECT-01 §06a |
| [`istari_alatar`](#istari-alatar) | Alatar's Eastern Hunt / Alatar (Blue Wizard) | `path-and-pursuit` | PROJECT-01 §06a |
| [`istari_pallando`](#istari-pallando) | Pallando's Eastern Resistance / Pallando (Blue Wizard) | `commons` | PROJECT-01 §06a |
| [`sauron`](#sauron) | Sauron / Sauron | `dominion-works` | PROJECT-01 §06 |
| [`istari_ember`](#istari-ember) | Ember Order / Kindler | `commons` | PROJECT-01 §06 |
| [`istari_grove`](#istari-grove) | Grove Order / Grovekeeper | `living-refuge` | PROJECT-01 §06 |
| [`istari_veil`](#istari-veil) | Veil Order / Veilweaver | `veiled-path` | PROJECT-01 §06 |
| [`istari_forge`](#istari-forge) | Forge Order / Artificer | `worked-stone` | PROJECT-01 §06 |
| [`istari_star`](#istari-star) | Star Order / Wayseer | `high-air` | PROJECT-01 §06 |
| [`melian`](#melian) | Melian / Melian | `memory-threshold` | PROJECT-01 §11 |
| [`osse`](#osse) | Ossë / Ossë | `river-sea` | PROJECT-01 §11 |
| [`uinen`](#uinen) | Uinen / Uinen | `river-sea` | PROJECT-01 §11 |
| [`arien`](#arien) | Arien / Arien | `high-air` | PROJECT-01 §11 |
| [`tilion`](#tilion) | Tilion / Tilion | `high-air` | PROJECT-01 §11 |
| [`eonwe`](#eonwe) | Eönwë / Eönwë | `high-air` | PROJECT-01 §11 |
| [`ilmare`](#ilmare) | Ilmarë / Ilmarë | `high-air` | PROJECT-01 §11 |
| [`ent_grove`](#ent-grove) | Ent Grove / Grove Elder | `embodied-wild` | PROJECT-01 §10 |
| [`eagle_eyrie`](#eagle-eyrie) | Eagle Eyrie / Skywarden | `embodied-wild` | PROJECT-01 §10 |
| [`spider_brood`](#spider-brood) | Spider Brood / Brood Matriarch | `embodied-wild` | PROJECT-01 §10 |
| [`melkor_worldbreaker`](#melkor-worldbreaker) | Melkor / Melkor - Worldbreaker | `dominion-works` | PROJECT-01 §05a–05c |
| [`melkor_dark_architect`](#melkor-dark-architect) | Melkor / Melkor - Dark Architect | `dominion-works` | PROJECT-01 §05a–05c |

## manwe

**Manwë's highlands — Manwë.** Family `high-air`. Economy: Windwatch and Herald Court; tiny sanctuary, messenger reach.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §04; PROJECT-02 profile manwe. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Upright open mantle, narrow sceptre and windward stance; attentive portrait. |
| Settlement | Open Windwatch above a stepped Herald Court; no imperial city. |
| Production | Crystal cutting and message-handling benches exposed to air. |
| Army | Spear heralds in spaced files; courier-eagles need landing ledges. |
| Artifact | Sapphire command sceptre and wind-carved crystal with worked mounts. |
| Magic | Wind bends cloth, grass and projectile paths along a bounded corridor. |
| Terrain | Bare high ridge, cloud shadow and readable descent. |

**Exception / rejection:** Do not make air reports omniscient or replace roads with free flight.

**Review:** Identify Manwë through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Windwatch and Herald Court and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 manwe costs, reach, duration, counters and retained weakness; art adds no free power.

## varda

**Varda's beacon settlements — Varda.** Family `high-air`. Economy: Star Observatory and Beacon Terrace; observation with staffed sites.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §04; PROJECT-02 profile varda. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Tall dark silhouette with a small pale face plane and star-lens gesture. |
| Settlement | Low observation roof and separated beacon terrace in deep night. |
| Production | Lens alignment, lamp maintenance and survey marks. |
| Army | Lantern guards carry shielded lamps; lumen constructs remain distinct ordinary units. |
| Artifact | Star-glass lens, faceted rim and repair case. |
| Magic | Restrained points and revealed silhouettes inside an explicit area. |
| Terrain | Clear horizon, cold indigo rock, warm beacon maintenance niche. |

**Exception / rejection:** Starlight is not a global reveal of underground activity.

**Review:** Identify Varda through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Star Observatory and Beacon Terrace and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 varda costs, reach, duration, counters and retained weakness; art adds no free power.

## ulmo

**Ulmo's waterside enclaves — Ulmo.** Family `river-sea`. Economy: Spring Sanctuary and Tide Gate; water routes and crews.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §04; PROJECT-02 profile ulmo. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Foam-edged dark mantle, shell horn, weight like a breaking wave. |
| Settlement | Spring court linked to a working tide gate, never a generic naval palace. |
| Production | Sluices, shell-work, crews and stored building timber. |
| Army | Ford keepers and current-spirits follow accessible water. |
| Artifact | White shell focus with salt wear and fitted carrying sling. |
| Magic | Water level/flow changes bounded by marked banks and route limits. |
| Terrain | Wet slate, teal depth, pale foam; dry divides stay legible. |

**Exception / rejection:** Do not depict the source's remote Ulmo as canonically running this invented enclave.

**Review:** Identify Ulmo through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Spring Sanctuary and Tide Gate and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 ulmo costs, reach, duration, counters and retained weakness; art adds no free power.

## aule

**Aulë's workshops — Aulë.** Family `worked-stone`. Economy: Master Forge and Stone Workshop; outstanding work with few queues.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §04; PROJECT-02 profile aule. Lore: LORE-01, LORE-02. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Broad apron mass, capable hands, compact maker hammer; absorbed portrait. |
| Settlement | Open-sided forge beside a low stone workshop, few occupied plots. |
| Production | Jigs, cooling work, labeled inputs and one paid job per queue. |
| Army | Smith-guards and articulated stone porters with visible load joints. |
| Artifact | Forged core and maker hammer show tool marks, not jewel rarity glow. |
| Magic | Dust and brace deformation reveal a specific repair or break. |
| Terrain | Quarry edge, mineral blue shadows, contained furnace gold. |

**Exception / rejection:** Aulë cannot factory-create independent souls or a limitless industrial empire.

**Review:** Identify Aulë through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Master Forge and Stone Workshop and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 aule costs, reach, duration, counters and retained weakness; art adds no free power.

## yavanna

**Yavanna's living groves — Yavanna.** Family `living-refuge`. Economy: Seed Vault and Living Grove; viable habitat and water.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §04; PROJECT-02 profile yavanna. Lore: LORE-01, LORE-02. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Green robe with branching contour; patient protective gaze. |
| Settlement | Seed vault nested beneath living canopy; roots retain growing space. |
| Production | Grafting benches, seed stores, water channels and tended understory. |
| Army | Grove tenders carry tools; root guardians differ from the unique hero. |
| Artifact | Living seed in a breathable crafted holder. |
| Magic | Local roots flex through earth; growth never erases costs or maturity limits. |
| Terrain | Deep viridian, luminous new green and occasional yellow fruit. |

**Exception / rejection:** No instant forest restoration or identical flower effects for every living faction.

**Review:** Identify Yavanna through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Seed Vault and Living Grove and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 yavanna costs, reach, duration, counters and retained weakness; art adds no free power.

## namo

**Mandos's sanctuary halls — Námo / Mandos.** Family `memory-threshold`. Economy: Hall of Waiting and Judgment Gate; guarded thresholds.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §04; PROJECT-02 profile namo. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Still vertical cloak, closed gesture, stone seal; grave rather than sadistic. |
| Settlement | Quiet hall and precisely bounded gate, small sanctuary footprint. |
| Production | Seal cutting, threshold upkeep and waiting spaces. |
| Army | Sentinels hold edges; oath-echo units are labeled invented manifestations. |
| Artifact | Stone judgment seal, worn at contact faces. |
| Magic | One clear threshold line and a visible warning before restraint. |
| Terrain | Basalt planes, cool plum recesses, pale doorway. |

**Exception / rejection:** No resurrection power or undead army inferred from the Houses of the Dead.

**Review:** Identify Námo / Mandos through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Hall of Waiting and Judgment Gate and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 namo costs, reach, duration, counters and retained weakness; art adds no free power.

## irmo

**Lórien's dream gardens — Irmo / Lórien.** Family `living-refuge`. Economy: Dream Garden and Vision Pavilion; preparation and rehearsal.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §04; PROJECT-02 profile irmo. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Soft layered shawl, tilted listening head, dim lantern. |
| Settlement | Sheltered garden paths lead to an open pavilion, not a maze hiding controls. |
| Production | Water care, quiet resting places and rehearsal mats. |
| Army | Attendants and phantom hounds have separate physical/illusory cues. |
| Artifact | Dreamglass and shuttered lantern, clouded polished surface. |
| Magic | Soft duplicate edges stay within the disclosed effect footprint. |
| Terrain | Lake reflections, willow shade, violet-blue with warm sheltered light. |

**Exception / rejection:** Dream imagery never conceals real costs, targets or failure conditions.

**Review:** Identify Irmo / Lórien through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Dream Garden and Vision Pavilion and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 irmo costs, reach, duration, counters and retained weakness; art adds no free power.

## nienna

**Nienna's refuge cloisters — Nienna.** Family `memory-threshold`. Economy: House of Mourning and Refuge Cloister; care and restitution.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §05; PROJECT-02 profile nienna. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Grey mantle, unguarded hands and sustained attention; no compulsory tears. |
| Settlement | Windows open outward; seats, shelter and uncluttered thresholds. |
| Production | Mended cloth, named records, food carried to occupied places. |
| Army | Mercy attendants carry practical supplies; memory lantern units remain finite. |
| Artifact | Mourning veil with repeated repairs, no harvestable grief jewel. |
| Magic | Warmth steadies a small group; effect includes readable duration. |
| Terrain | Rain-silver stone, ash violet, a narrow amber interior. |

**Exception / rejection:** Sorrow never generates resources and care never grants permanent immunity.

**Review:** Identify Nienna through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show House of Mourning and Refuge Cloister and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 nienna costs, reach, duration, counters and retained weakness; art adds no free power.

## orome

**Oromë's frontier lodges — Oromë.** Family `path-and-pursuit`. Economy: Hunt Lodge and Trail Kennel; one maintained wild route.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §05; PROJECT-02 profile orome. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Forward rider silhouette, horn at shoulder, watchful anger. |
| Settlement | Low lodge, tack court and airy kennels at a trailhead. |
| Production | Tracks recorded, harness repaired, hounds fed; roads remain work. |
| Army | Mounted trackers and hound packs with purposeful spacing. |
| Artifact | Carved horn and repaired straps, distinct from random loot horns. |
| Magic | A readable intercept route and quarry evidence, not a map-wide hunt pulse. |
| Terrain | Pine green, exposed rust earth and a cool misted pass. |

**Exception / rejection:** Nahar and the canonical horn are not duplicated as ordinary mount/equipment stock.

**Review:** Identify Oromë through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Hunt Lodge and Trail Kennel and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 orome costs, reach, duration, counters and retained weakness; art adds no free power.

## tulkas

**Tulkas's muster grounds — Tulkas.** Family `mortal-works`. Economy: Wrestling Yard and Muster Ground; physical work with few queues.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §05; PROJECT-02 profile tulkas. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Golden hair and beard, open hands, grounded athletic stance and ready laughter. |
| Settlement | Unroofed yard and simple muster shelters; no colossal arena. |
| Production | Grip-wrap preparation, maintained exercise space and supplied haul crews. |
| Army | Wrestlers and pack aurochs occupy practical loading space. |
| Artifact | Forged grip bands and worn wraps with pressure marks. |
| Magic | Impact reads through posture, displaced dust and a bounded grapple. |
| Terrain | Sun-warm earth, cold stone shade and ruddy cloth. |

**Exception / rejection:** Hands are his source-grounded weapons; strength supplies neither materials nor a factory network.

**Review:** Identify Tulkas through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Wrestling Yard and Muster Ground and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 tulkas costs, reach, duration, counters and retained weakness; art adds no free power.

## nessa

**Nessa's relay settlements — Nessa.** Family `path-and-pursuit`. Economy: Dance Court and Relay Stable; fast bodies, limited freight.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §05; PROJECT-02 profile nessa. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Lithe diagonal posture, flowing relay cord, light footfall. |
| Settlement | Open court links modest relay shelters; no cavalry fortress. |
| Production | Water, rest and baton/cord exchange at staffed stops. |
| Army | Runners and courier stags; cargo visibly small. |
| Artifact | Woven relay cord and step-light anklets. |
| Magic | Brief step trail ends at reachable ground; no teleport language. |
| Terrain | Spring grass, stone steps, warm russet against pale air. |

**Exception / rejection:** Speed does not produce road capacity or move unlimited cargo.

**Review:** Identify Nessa through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Dance Court and Relay Stable and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 nessa costs, reach, duration, counters and retained weakness; art adds no free power.

## vana

**Vána's bloom nurseries — Vána.** Family `living-refuge`. Economy: Bloom Nursery and Song Aviary; prepared fields and workers.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §05; PROJECT-02 profile vana. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Flowering circlet, lifted head and small bright sleeves. |
| Settlement | Nursery beds and woven aviary roofs in a tended clearing. |
| Production | Seedlings at different stages, irrigation and pruning tools. |
| Army | Garden tenders and small songbird groups avoid battlefield swarm clutter. |
| Artifact | Renewal wreath and living flowering circlet. |
| Magic | Localized bloom moves through existing tended plants. |
| Terrain | Leaf green, lilac shade, limited coral blossom accents. |

**Exception / rejection:** Distinct from Yavanna's mature forest stewardship; never instant double harvest.

**Review:** Identify Vána through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Bloom Nursery and Song Aviary and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 vana costs, reach, duration, counters and retained weakness; art adds no free power.

## este

**Estë's healing refuges — Estë.** Family `living-refuge`. Economy: Rest House and Healing Pool; finite recovery and supplied care.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §05; PROJECT-02 profile este. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Grey veil, compact seated or steady stance, hands at a vessel. |
| Settlement | Low rest house beside shaded still water and accessible paths. |
| Production | Clean cloth, prepared salves and replenished drinking vessels. |
| Army | Healers and rescue hinds look laden and purposeful. |
| Artifact | Healing vessel has washable glaze and visible wear. |
| Magic | Quiet bounded glow marks recovery; no resurrection beam. |
| Terrain | Cool water, soft grey-green, warm linen near shelter. |

**Exception / rejection:** Differentiate death from treatable wounds and portray disability with dignity.

**Review:** Identify Estë through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Rest House and Healing Pool and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 este costs, reach, duration, counters and retained weakness; art adds no free power.

## vaire

**Vairë's archive halls — Vairë.** Family `memory-threshold`. Economy: Chronicle Loom and Archive Hall; records preserve skilled work.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §05; PROJECT-02 profile vaire. Lore: LORE-01. Source-named being; institutions, starting kit, embodiment scale and paid return are gameplay adaptations.

**Chronology:** Timeless/early divine identity used in a cross-era playable sanctuary.

| Asset domain | Concrete treatment |
|---|---|
| Character | Layered woven mantle, shuttle in hand, exact attentive eyes. |
| Settlement | Long low archive bays with a small loom court. |
| Production | Threads, labeled cases, repaired patterns and copied records. |
| Army | Recorder-guards protect carriers; threadward effigies are clearly constructs. |
| Artifact | Woven memory and shuttle show pattern continuity through repairs. |
| Magic | Selected traces align into a readable past report, not current omniscience. |
| Terrain | Muted indigo cloth, red-brown thread and pale stone. |

**Exception / rejection:** Records never rebuild absent machinery, labor or materials for free.

**Review:** Identify Vairë through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Chronicle Loom and Archive Hall and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 vaire costs, reach, duration, counters and retained weakness; art adds no free power.

## elf-vanyar

**Vanyar — Concord Singer.** Family `elven-house`. Economy: Chorus Court; costly banner fellowships and ceremonial craft.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §07; PROJECT-02 profile elf_vanyar. Lore: LORE-08. Source people/house; original hero and production institutions. Eight entries are not eight equal ancestral kindreds.

**Chronology:** Ancestral/house identities span different histories; original fixed hero in cross-era scenario.

| Asset domain | Concrete treatment |
|---|---|
| Character | Upright paired cloak lines, held instrument, composed breath. |
| Settlement | Open chorus court with acoustic walls and simple ordered steps. |
| Production | Instrument making, banner weaving and rehearsal places. |
| Army | Small disciplined banner groups with pale standards. |
| Artifact | Tuned songstone held in a finely fitted acoustic frame. |
| Magic | Resonant bands mark a limited formation rather than damage fireworks. |
| Terrain | Pale limestone, warm cream cloth and quiet gold. |

**Exception / rejection:** Original Concord Singer is not a new canonical Vanyar ruler.

**Review:** Identify Concord Singer through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Chorus Court and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 elf_vanyar costs, reach, duration, counters and retained weakness; art adds no free power.

## elf-feanor

**House of Fëanor — Jewelwright.** Family `worked-stone`. Economy: Gem Atelier; rare inputs and masterwork equipment.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §07; PROJECT-02 profile elf_feanor. Lore: LORE-08, LORE-03, LORE-13. Source people/house; original hero and production institutions. Eight entries are not eight equal ancestral kindreds.

**Chronology:** Ancestral/house identities span different histories; original fixed hero in cross-era scenario.

| Asset domain | Concrete treatment |
|---|---|
| Character | Angular sleeves, jewel-setting loupe/tool and intense focused portrait. |
| Settlement | Compact atelier with controlled daylight and secure work trays. |
| Production | Cutting tables, abrasive slurry, blade fittings and unfinished settings. |
| Army | Few elite equipped specialists, each tool visibly maintained. |
| Artifact | Cut crystal in precise geometric settings; not a duplicate Silmaril. |
| Magic | Prismatic flare with narrow angular facets and clear affected area. |
| Terrain | Dark cool stone, blue-violet shadow and concentrated garnet/copper. |

**Exception / rejection:** Craft beauty remains real; oath history does not force every player choice or grant canonical jewels.

**Review:** Identify Jewelwright through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Gem Atelier and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 elf_feanor costs, reach, duration, counters and retained weakness; art adds no free power.

## elf-fingolfin

**House of Fingolfin — Shield Marshal.** Family `elven-house`. Economy: Pass-watch Fortress; gates and mounted wardens.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §07; PROJECT-02 profile elf_fingolfin. Lore: LORE-08, LORE-13. Source people/house; original hero and production institutions. Eight entries are not eight equal ancestral kindreds.

**Chronology:** Ancestral/house identities span different histories; original fixed hero in cross-era scenario.

| Asset domain | Concrete treatment |
|---|---|
| Character | Shield-forward upright figure, blue-silver cloth break, measured gaze. |
| Settlement | Tiered gatehouse fitted to an actual pass, modest rear court. |
| Production | Gate braces, remount shelter and armor repair racks. |
| Army | Few costly wardens maintain gaps and rearguard lines. |
| Artifact | Forged shield seal and durable fittings. |
| Magic | Protective arcs follow formation edges; withdrawals have routes. |
| Terrain | Cold scree, blue shadow, weathered pale stone. |

**Exception / rejection:** No full cavalry charge through impossible terrain or endless elite replacement.

**Review:** Identify Shield Marshal through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Pass-watch Fortress and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 elf_fingolfin costs, reach, duration, counters and retained weakness; art adds no free power.

## elf-finarfin

**House of Finarfin — Lore Envoy.** Family `elven-house`. Economy: Hall of Welcome; healing singers and guest workshops.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §07; PROJECT-02 profile elf_finarfin. Lore: LORE-08. Source people/house; original hero and production institutions. Eight entries are not eight equal ancestral kindreds.

**Chronology:** Ancestral/house identities span different histories; original fixed hero in cross-era scenario.

| Asset domain | Concrete treatment |
|---|---|
| Character | Open cloak shape, inscribed pact case, listening expression. |
| Settlement | Welcoming court with shared benches and separate work bays. |
| Production | Translation tables, salves and guest makers using real inputs. |
| Army | Healers and guarded envoys; small escort formations. |
| Artifact | Inscribed pact with witnesses and repaired protective case. |
| Magic | Restorative song reaches a bounded supplied group. |
| Terrain | Warm sandstone, green-grey shadow, restrained pale gold. |

**Exception / rejection:** Hospitality does not automatically buy allegiance or erase disagreement.

**Review:** Identify Lore Envoy through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Hall of Welcome and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 elf_finarfin costs, reach, duration, counters and retained weakness; art adds no free power.

## elf-falmari

**Falmari — Tide Captain.** Family `river-sea`. Economy: Harbor Hall; swan-ships and harbor beacons.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §07; PROJECT-02 profile elf_falmari. Lore: LORE-08, LORE-03. Source people/house; original hero and production institutions. Eight entries are not eight equal ancestral kindreds.

**Chronology:** Ancestral/house identities span different histories; original fixed hero in cross-era scenario.

| Asset domain | Concrete treatment |
|---|---|
| Character | Curved sea cloak, shell compass, salt-weathered calm. |
| Settlement | Low harbor hall follows quays; elegant hulls dominate workspaces. |
| Production | Timber curing, sail weaving and rigging laid at physical scale. |
| Army | Mariners disembark through safe lanes, not instant inland armies. |
| Artifact | Shell compass and finely joined oar; each ship has a work history. |
| Magic | Calm corridors marked on water with shore limits. |
| Terrain | Pearl grey, sea blue, weathered white timber and coral rope. |

**Exception / rejection:** Swan shapes stay structural and restrained; named irreplaceable ships are not generic duplicates.

**Review:** Identify Tide Captain through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Harbor Hall and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 elf_falmari costs, reach, duration, counters and retained weakness; art adds no free power.

## elf-sindar

**Sindar — March Warden.** Family `elven-house`. Economy: Hidden Court; watch-houses and woodland companies.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §07; PROJECT-02 profile elf_sindar. Lore: LORE-08, LORE-04, LORE-05. Source people/house; original hero and production institutions. Eight entries are not eight equal ancestral kindreds.

**Chronology:** Ancestral/house identities span different histories; original fixed hero in cross-era scenario.

| Asset domain | Concrete treatment |
|---|---|
| Character | Grey-green mantle, long bow, quiet sideways attention. |
| Settlement | Carved woodland court can include worked stone; small hidden watch-houses. |
| Production | Weaving, bow repair and attended boundary paths. |
| Army | Woodland companies merge into cover but remain selectable. |
| Artifact | Woven veil and carved boundary tokens. |
| Magic | Retreat veil with clear extent; observed silhouettes never disappear from owner UI. |
| Terrain | Beech trunks, silver moss, deep green and warm lamp points. |

**Exception / rejection:** No free racial Girdle; Melian's specific power remains hers.

**Review:** Identify March Warden through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Hidden Court and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 elf_sindar costs, reach, duration, counters and retained weakness; art adds no free power.

## elf-nandor

**Nandor — Woodland Pathfinder.** Family `path-and-pursuit`. Economy: Forest Waystation; canopy scouts and woodland mounts.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §07; PROJECT-02 profile elf_nandor. Lore: LORE-08. Source people/house; original hero and production institutions. Eight entries are not eight equal ancestral kindreds.

**Chronology:** Ancestral/house identities span different histories; original fixed hero in cross-era scenario.

| Asset domain | Concrete treatment |
|---|---|
| Character | Low travel posture, practical bow, leaf-shaped trailmark. |
| Settlement | Light waystations thread through canopy without huge clearings. |
| Production | Mount care, rope bridges, bark-protected markers and bow work. |
| Army | Scouts travel singly or in loose strings; little heavy armor. |
| Artifact | Living trailmark and weathered short bow. |
| Magic | Rootwise passage uses existing habitat and visible exits. |
| Terrain | Luminous green breaks over dark fern beds and wet roots. |

**Exception / rejection:** Nandor is not interchangeable with Avari or a generic savage woodland race.

**Review:** Identify Woodland Pathfinder through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Forest Waystation and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 elf_nandor costs, reach, duration, counters and retained weakness; art adds no free power.

## elf-avari

**Avari clan — Frontier Mediator.** Family `path-and-pursuit`. Economy: Clan Lodge; portable workshops and decentralized waymarks.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §07; PROJECT-02 profile elf_avari. Lore: LORE-08. Source people/house; original hero and production institutions. Eight entries are not eight equal ancestral kindreds.

**Chronology:** Ancestral/house identities span different histories; original fixed hero in cross-era scenario.

| Asset domain | Concrete treatment |
|---|---|
| Character | Layered travel cloth, carrying frame, local stone token. |
| Settlement | Several modest lodges and mobile work shelters, no obligatory central palace. |
| Production | Foldable benches, repaired carts, region-specific local materials. |
| Army | Small adaptable escort groups carrying visible supplies. |
| Artifact | Local waystone and portable tool roll. |
| Magic | Rendezvous signals require known locations and communication. |
| Terrain | Authored regional materials; muted clay with a chosen textile accent. |

**Exception / rejection:** This clan's culture is invented, not a claim to describe all Avari.

**Review:** Identify Frontier Mediator through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Clan Lodge and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 elf_avari costs, reach, duration, counters and retained weakness; art adds no free power.

## human-gondor

**Gondor — Citadel Engineer.** Family `mortal-works`. Economy: Citadel Hall; depots, shield companies and engineering.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §08; PROJECT-02 profile human_gondor. Lore: LORE-11. Source kingdom; invented fixed hero, recipes and repeated return.

**Chronology:** Númenor Second Age; Gondor later Second/Third Age; Rohan Third Age. Coexistence is sandbox..

| Asset domain | Concrete treatment |
|---|---|
| Character | Square cloak/shield mass, survey tool, weathered practical portrait. |
| Settlement | Joined masonry, store courts and maintained gates; expansion has service routes. |
| Production | Stone cutting, braces, siege parts and visibly stocked depots. |
| Army | Shield companies form readable blocks with exposed flanks. |
| Artifact | Stone command seal and calibrated repair kit. |
| Magic | Prepared standards/wards reinforce specific works; no inherent divine aura. |
| Terrain | Pale dressed stone, charcoal shadow, muted blue cloth. |

**Exception / rejection:** A Citadel Engineer is an original role, not a duplicate named monarch or First Age Minas Tirith.

**Review:** Identify Citadel Engineer through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Citadel Hall and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 human_gondor costs, reach, duration, counters and retained weakness; art adds no free power.

## human-rohan

**Rohan — Rider Marshal.** Family `mortal-works`. Economy: Muster Hall; horses, fodder, remounts and mobile relief.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §08; PROJECT-02 profile human_rohan. Lore: LORE-11. Source kingdom; invented fixed hero, recipes and repeated return.

**Chronology:** Númenor Second Age; Gondor later Second/Third Age; Rohan Third Age. Coexistence is sandbox..

| Asset domain | Concrete treatment |
|---|---|
| Character | Wide rider-and-horse silhouette, short cloak, alert sideward glance. |
| Settlement | Timber muster hall, low fenced steads and extensive pasture. |
| Production | Fodder stacks, watered troughs, tack repair and distinct growing/trained stock. |
| Army | Rider groups leave room to turn; dismounted posture shown at gates. |
| Artifact | Forged horse crest, worn saddle and rally horn. |
| Magic | Rally follows a traversable route; dust/grass conveys movement. |
| Terrain | Ochre grass, dark green lowlands, weathered timber, pale horse accent. |

**Exception / rejection:** Horses are supplied stock; no instantaneous mature mounts or charge through marsh/rock.

**Review:** Identify Rider Marshal through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Muster Hall and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 human_rohan costs, reach, duration, counters and retained weakness; art adds no free power.

## human-numenor

**Númenor — Ocean Warden.** Family `river-sea`. Economy: Admiralty Hall; shipyards, marines and long sea routes.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §08; PROJECT-02 profile human_numenor. Lore: LORE-10. Source kingdom; invented fixed hero, recipes and repeated return.

**Chronology:** Númenor Second Age; Gondor later Second/Third Age; Rohan Third Age. Coexistence is sandbox..

| Asset domain | Concrete treatment |
|---|---|
| Character | Long sea cloak, compass case, composed but burdened gaze. |
| Settlement | Quays, sail lofts and heavy hull cradles; distinguish from light Falmari harbor. |
| Production | Multiple timber/metal/textile inputs, navigation work and signal towers. |
| Army | Marines and convoy crews; landing lanes and supplies matter. |
| Artifact | Sea compass, disciplined navigation tools and repaired sea charts. |
| Magic | Prepared sea wards sit on routes with known limits. |
| Terrain | Deep ultramarine water, pale sea-stone, warm brass and vermilion cloth. |

**Exception / rejection:** Coexistence with Rohan/Gondor is sandbox; maritime grandeur is not automatic moral virtue.

**Review:** Identify Ocean Warden through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Admiralty Hall and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 human_numenor costs, reach, duration, counters and retained weakness; art adds no free power.

## dwarf-khazad-dum

**Khazad-dûm — Deep Surveyor.** Family `worked-stone`. Economy: Deepworks Hall; mining engines, ventilation and food imports.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §09; PROJECT-02 profile dwarf_khazad_dum. Lore: LORE-04. Source realm; invented hero and specialized production contract.

**Chronology:** Distinct realm traditions used together in sandbox; Khazad-dûm is not adjacent to the Blue Mountain realms.

| Asset domain | Concrete treatment |
|---|---|
| Character | Broad low silhouette, survey rod/lens, dust on practical clothing. |
| Settlement | Entrances connect deep halls; shafts and airways define layout. |
| Production | Lifting machinery, survey marks and clear ventilation apparatus. |
| Army | Tunnel guards and stone porters move through narrow lanes. |
| Artifact | Survey core with mechanical mount and pressure fittings. |
| Magic | Fault/airway evidence appears at inspected rock or connected workings. |
| Terrain | Layered blue-black stone, mineral green and sheltered amber. |

**Exception / rejection:** Underground grandeur must show air, food and entrance dependencies.

**Review:** Identify Deep Surveyor through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Deepworks Hall and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 dwarf_khazad_dum costs, reach, duration, counters and retained weakness; art adds no free power.

## dwarf-belegost

**Belegost — Armor Master.** Family `worked-stone`. Economy: Mail Hall and Mask Workshop; slow fitted hazard protection.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §09; PROJECT-02 profile dwarf_belegost. Lore: LORE-04, LORE-06. Source realm; invented hero and specialized production contract.

**Chronology:** Distinct realm traditions used together in sandbox; Khazad-dûm is not adjacent to the Blue Mountain realms.

| Asset domain | Concrete treatment |
|---|---|
| Character | Protective mask frame, broad shoulder line; unmasked portrait shows a person. |
| Settlement | Low fortified mouth and vented metalwork court. |
| Production | Mail links, mask plates, heat tests and chosen resistance fittings. |
| Army | Masked vanguard in close formation with protected haulers. |
| Artifact | Tempered armor seal and masks with replaceable fittings. |
| Magic | Threat-specific treatment shown by marked panels, never universal immunity. |
| Terrain | Iron blue, soot plum, dull copper and hot-work gold. |

**Exception / rejection:** Masks have source anchor LORE-06; this industry's recipes and Armor Master remain invention.

**Review:** Identify Armor Master through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Mail Hall and Mask Workshop and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 dwarf_belegost costs, reach, duration, counters and retained weakness; art adds no free power.

## dwarf-nogrod

**Nogrod — Master Artificer.** Family `worked-stone`. Economy: Precision Forge and Commission House; rare specialist labor.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §09; PROJECT-02 profile dwarf_nogrod. Lore: LORE-04. Source realm; invented hero and specialized production contract.

**Chronology:** Distinct realm traditions used together in sandbox; Khazad-dûm is not adjacent to the Blue Mountain realms.

| Asset domain | Concrete treatment |
|---|---|
| Character | Tool-dense belt, compact precise pose, evaluating gaze. |
| Settlement | Workshop clusters and commission benches organized around measured work. |
| Production | Small mechanisms, breach wedges, inscriptions and careful tooling. |
| Army | Engineers and tool-bearing guards; fewer heavy protective ranks. |
| Artifact | Master-tool core with calibrated joints and maker marks. |
| Magic | Exact breach effect follows a known weak joint. |
| Terrain | Dark stone, oxidized bronze, narrow white work light. |

**Exception / rejection:** Keep Nogrod distinct from Belegost; political history does not make all Dwarves treacherous.

**Review:** Identify Master Artificer through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Precision Forge and Commission House and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 dwarf_nogrod costs, reach, duration, counters and retained weakness; art adds no free power.

## orc-fortress-clan

**Orc fortress-clan — Warband Organizer.** Family `dominion-works`. Economy: Warband Hall; salvage, finite spoils and food demand.

**Lore evidence status:** `gameplay-only-unverified-lore`.

**Evidence:** PROJECT-01 §09; PROJECT-02 profile orc_fortress_clan. Lore: no additional verified lore claim; use current project adaptation. Source-inspired people/creature; original playable society, hero and production. Specific taxonomy/costume lore beyond cited evidence needs new verification.

**Chronology:** Community or creature identity in a declared sandbox; no single fixed historical ruler implied.

| Asset domain | Concrete treatment |
|---|---|
| Character | Repaired layered armor, share badge, varied alert expressions. |
| Settlement | Incremental defenses and reusable scrap structures with food stores. |
| Production | Sorted salvage, mismatched replacement parts, trained mount pens. |
| Army | Mixed raiders/wolf riders; organization readable through formation, not race caricature. |
| Artifact | Black iron badge and reworked weapons with visible prior ownership. |
| Magic | Rally and salvage cues depend on real crews and spoils. |
| Terrain | Rust earth, slate debris, olive cloth and restrained ember. |

**Exception / rejection:** Orc identity does not mandate allegiance; do not turn suffering into comic texture.

**Review:** Identify Warband Organizer through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Warband Hall and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 orc_fortress_clan costs, reach, duration, counters and retained weakness; art adds no free power.

## hobbit-shire

**Hobbit Shire — Shirekeeper.** Family `commons`. Economy: Common Hall and Commons Farm; stores, travel kits and mutual aid.

**Lore evidence status:** `gameplay-only-unverified-lore`.

**Evidence:** PROJECT-01 §09; PROJECT-02 profile hobbit_shire. Lore: no additional verified lore claim; use current project adaptation. Source-inspired people/creature; original playable society, hero and production. Specific taxonomy/costume lore beyond cited evidence needs new verification.

**Chronology:** Community or creature identity in a declared sandbox; no single fixed historical ruler implied.

| Asset domain | Concrete treatment |
|---|---|
| Character | Short grounded figure, pack and lantern, observant open face. |
| Settlement | Low earth-sheltered homes, useful gardens and a common hall. |
| Production | Food drying, careful storage, packing and shared work tables. |
| Army | Bounders and fieldhands avoid heavy-army silhouettes; pack ponies carry goods. |
| Artifact | Hearth token, weatherproof food parcel and cared-for lantern. |
| Magic | Hearthward/safe departure effects are subtle and bounded. |
| Terrain | Leaf green, warm soil, cream plaster and small amber windows. |

**Exception / rejection:** Domestic does not mean childish, harmless or a comedy accent; occupation remains threatening.

**Review:** Identify Shirekeeper through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Common Hall and Commons Farm and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 hobbit_shire costs, reach, duration, counters and retained weakness; art adds no free power.

## troll-hold

**Troll Hold — Stonebreaker.** Family `embodied-wild`. Economy: Chieftain Hall; drill yard, supplied breach crews.

**Lore evidence status:** `gameplay-only-unverified-lore`.

**Evidence:** PROJECT-01 §10; PROJECT-02 profile troll_hold. Lore: no additional verified lore claim; use current project adaptation. Source-inspired people/creature; original playable society, hero and production. Specific taxonomy/costume lore beyond cited evidence needs new verification.

**Chronology:** Community or creature identity in a declared sandbox; no single fixed historical ruler implied.

| Asset domain | Concrete treatment |
|---|---|
| Character | Massive low shoulders, grounded hands and useful protective plate. |
| Settlement | Heavy stone shelter and broad haulways scaled to bodies. |
| Production | Large braces, stone blocks, food storage and maintained breach tools. |
| Army | Shield Trolls and siege crews show slow deliberate repositioning. |
| Artifact | Iron-stone badge and fitted Stonehide Plate. |
| Magic | Stone dust and physical fracture map the exact impact area. |
| Terrain | Cold boulders, grey-green moss and ochre work lamps. |

**Exception / rejection:** Large bodies do not imply unlimited force, instant industry or stupid dialogue.

**Review:** Identify Stonebreaker through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Chieftain Hall and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 troll_hold costs, reach, duration, counters and retained weakness; art adds no free power.

## wolf-pack

**Wolf Pack — Packwarden.** Family `embodied-wild`. Economy: Gathering Den; hunting territory and finite prey.

**Lore evidence status:** `gameplay-only-unverified-lore`.

**Evidence:** PROJECT-01 §10; PROJECT-02 profile wolf_pack. Lore: no additional verified lore claim; use current project adaptation. Source-inspired people/creature; original playable society, hero and production. Specific taxonomy/costume lore beyond cited evidence needs new verification.

**Chronology:** Community or creature identity in a declared sandbox; no single fixed historical ruler implied.

| Asset domain | Concrete treatment |
|---|---|
| Character | Low elongated silhouette; portrait attention through ears, muzzle and eyes. |
| Settlement | Dens, dry resting shelves and scent routes; no humanoid town. |
| Production | Food caches, tracked prey access and protected pup/recruit spaces. |
| Army | Trackers/runners maintain pursuit arcs; no army in human armor. |
| Artifact | Scent token and territory-mark object appropriate to anatomy. |
| Magic | Scent/track evidence becomes a labeled interface trail, not neon world paint. |
| Terrain | Grey fur, muted blue rocks, tawny grass and warm den earth. |

**Exception / rejection:** No swords/boots; pack hierarchy and gameplay roles are authored, not animal-science claims.

**Review:** Identify Packwarden through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Gathering Den and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 wolf_pack costs, reach, duration, counters and retained weakness; art adds no free power.

## istari-gandalf

**Gandalf's Fellowship — Gandalf.** Family `commons`. Economy: Fellowship Refuge and Council Hall; limited industry and courage.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §06a; PROJECT-02 profile istari_gandalf. Lore: LORE-11. Named identity; invented selectable faction and kit. Alatar/Pallando names rely on current project wider-source attribution, not independent verification here.

**Chronology:** Named Wizard identities are imported into the cross-era roster; scenario determines form and artifact custody.

| Asset domain | Concrete treatment |
|---|---|
| Character | Weathered grey mantle, small staff accent, warmth with impatience. |
| Settlement | Refuge benches, simple hearth and a council room open to travelers. |
| Production | Wardstones, supplied resolve standards and repaired travel gear. |
| Army | Free-company wardens retain their own practical clothing and clear allegiance. |
| Artifact | Emberwood focus and working staff; no automatically duplicated unique ring/sword. |
| Magic | White fire has a defined warning/area and leaves readable silhouettes. |
| Terrain | Rain-grey roads, deep blue-green shadows and fragile warm hearth. |

**Exception / rejection:** Grey/White are one identity; no second hero or automatic death-triggered upgrade.

**Review:** Identify Gandalf through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Fellowship Refuge and Council Hall and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 istari_gandalf costs, reach, duration, counters and retained weakness; art adds no free power.

## istari-saruman

**Saruman's White Tower — Saruman.** Family `dominion-works`. Economy: Orthanc Workshop and Muster Foundry; three queues, same enclave limits.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §06a; PROJECT-02 profile istari_saruman. Lore: LORE-11. Named identity; invented selectable faction and kit. Alatar/Pallando names rely on current project wider-source attribution, not independent verification here.

**Chronology:** Named Wizard identities are imported into the cross-era roster; scenario determines form and artifact custody.

| Asset domain | Concrete treatment |
|---|---|
| Character | Pale severe vertical robe, resonant core, controlled exact gesture. |
| Settlement | Dark vertical tower reference beside compact paid workshops, not a giant industrial continent. |
| Production | Metal stores, siege assembly and one bound Sentinel's work area. |
| Army | Uruk companies and constructs differentiated from the hero. |
| Artifact | Resonant core with smooth rings and stressed fastenings. |
| Magic | Force lane/construct commission visibly bounded and paid. |
| Terrain | Black stone, cold white cloth, smoke plum and furnace orange. |

**Exception / rejection:** Power cannot command Melkor's creatures; tower silhouette is original, not a copied film design.

**Review:** Identify Saruman through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Orthanc Workshop and Muster Foundry and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 istari_saruman costs, reach, duration, counters and retained weakness; art adds no free power.

## istari-radagast

**Radagast's Woodland Circle — Radagast.** Family `living-refuge`. Economy: Woodland Sanctuary and Beast Refuge; living terrain and healing.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §06a; PROJECT-02 profile istari_radagast. Lore: LORE-11. Named identity; invented selectable faction and kit. Alatar/Pallando names rely on current project wider-source attribution, not independent verification here.

**Chronology:** Named Wizard identities are imported into the cross-era roster; scenario determines form and artifact custody.

| Asset domain | Concrete treatment |
|---|---|
| Character | Brown-green layered travel wear, seed focus, alert listening posture. |
| Settlement | Sheltered animal recovery pens nested in living woodland. |
| Production | Salve preparation, habitat repair and supplied beast care. |
| Army | Woodland defenders and beast companions retain species-appropriate scale. |
| Artifact | Living seed and stained medicine pouch. |
| Magic | Root/thorn lines emerge from existing vegetation with clear affected area. |
| Terrain | Loam umber, saturated fern green and warm russet. |

**Exception / rejection:** Barren ground and fire remain counters; animal friendship is not unlimited control.

**Review:** Identify Radagast through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Woodland Sanctuary and Beast Refuge and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 istari_radagast costs, reach, duration, counters and retained weakness; art adds no free power.

## istari-alatar

**Alatar's Eastern Hunt — Alatar (Blue Wizard).** Family `path-and-pursuit`. Economy: Eastern Hunt Lodge and Outrider Camp; single-target pursuit.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §06a; PROJECT-02 profile istari_alatar. Lore: LORE-11. Named identity; invented selectable faction and kit. Alatar/Pallando names rely on current project wider-source attribution, not independent verification here.

**Chronology:** Named Wizard identities are imported into the cross-era roster; scenario determines form and artifact custody.

| Asset domain | Concrete treatment |
|---|---|
| Character | Deep blue narrow cloak, stone hunter seal and aiming stillness. |
| Settlement | Low lodge with sightline terrace and practical outrider shelters. |
| Production | Marked-shot tools, maintained saddles and survey records. |
| Army | Hunters and outriders spread along approaches; limited crowd coverage. |
| Artifact | Hunter seal with directional cuts and repaired carrying wrap. |
| Magic | A narrow aimed spear/mark silhouette discloses exposure and target. |
| Terrain | Authored eastern upland, storm blue cloth, ochre stone and silver grass. |

**Exception / rejection:** Names come from wider material; exact eastern culture, appearance and hunter role are inventions.

**Review:** Identify Alatar (Blue Wizard) through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Eastern Hunt Lodge and Outrider Camp and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 istari_alatar costs, reach, duration, counters and retained weakness; art adds no free power.

## istari-pallando

**Pallando's Eastern Resistance — Pallando (Blue Wizard).** Family `commons`. Economy: Resistance Hall and Ward Workshop; prepared lore/essence and limited protection.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §06a; PROJECT-02 profile istari_pallando. Lore: LORE-11. Named identity; invented selectable faction and kit. Alatar/Pallando names rely on current project wider-source attribution, not independent verification here.

**Chronology:** Named Wizard identities are imported into the cross-era roster; scenario determines form and artifact custody.

| Asset domain | Concrete treatment |
|---|---|
| Character | Blue broad shoulder wrap, crystal ward-knot, attentive measured stance. |
| Settlement | Shared hall and compact ward workshop with open assembly space. |
| Production | Ward-breaker tools, braided charms and stocked lore worktables. |
| Army | Small resistance companies; protected groups visibly bounded. |
| Artifact | Ward-knot combines crystal and textile, unlike Alatar's stone seal. |
| Magic | Broken hostile spell edge and fixed protective circle remain readable. |
| Terrain | Authored eastern settlement, ink blue, dusty coral cloth and pale quartz. |

**Exception / rejection:** Do not collapse two Blue Wizards into one choice or invent a canonical resistance biography.

**Review:** Identify Pallando (Blue Wizard) through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Resistance Hall and Ward Workshop and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 istari_pallando costs, reach, duration, counters and retained weakness; art adds no free power.

## sauron

**Sauron — Sauron.** Family `dominion-works`. Economy: Binding Forge and Command Tower; workshops, tribute and dependent clients.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §06; PROJECT-02 profile sauron. Lore: LORE-01, LORE-11. Source-named Maia; industrial controller faction and repeatable return are adaptations.

**Chronology:** One identity with scenario-specific form and Ring custody across ages.

| Asset domain | Concrete treatment |
|---|---|
| Character | Controlled symmetrical mantle with plausible crafted surfaces; no mandatory giant eye. |
| Settlement | Organized foundries, depots and command tower with exposed links. |
| Production | Repeated fittings, inspection stations, binding-ring work and material queues. |
| Army | Armored overseers, werewolves and siege equipment follow supply roads. |
| Artifact | Forged binding core and ordinary lesser rings distinct from unique One Ring. |
| Magic | Command links reveal their range/dependency; terror does not become ally control. |
| Terrain | Soot violet, black iron, cold polished metal and narrow red furnace light. |

**Exception / rejection:** Never controls/creates/revives Dragons or Balrogs; attractive craft may still serve coercion.

**Review:** Identify Sauron through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Binding Forge and Command Tower and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 sauron costs, reach, duration, counters and retained weakness; art adds no free power.

## istari-ember

**Ember Order — Kindler.** Family `commons`. Economy: Hearth Sanctuary and Refuge Lodge; occupied shelter and supplies.

**Lore evidence status:** `gameplay-only-unverified-lore`.

**Evidence:** PROJECT-01 §06; PROJECT-02 profile istari_ember. Lore: no additional verified lore claim; use current project adaptation. Entire order, fixed generated hero and institutional identity are original gameplay inventions.

**Chronology:** Original order placed by scenario; no claimed canonical founding date.

| Asset domain | Concrete treatment |
|---|---|
| Character | Rounded cloak, ember focus held low, worn practical hands. |
| Settlement | Hearth court and low refuge lodge with stocked sleeping spaces. |
| Production | Blanket repair, food preparation and paid shelter wards. |
| Army | Hearth Wardens and finite Ashlight spirits. |
| Artifact | Oath Lantern with repair seams and shuttered glow. |
| Magic | A small warm shelter edge with explicit duration/occupancy. |
| Terrain | Charcoal timber, blue dusk, dull brick and amber. |

**Exception / rejection:** Kindler is generated original identity, not Gandalf under another name.

**Review:** Identify Kindler through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Hearth Sanctuary and Refuge Lodge and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 istari_ember costs, reach, duration, counters and retained weakness; art adds no free power.

## istari-grove

**Grove Order — Grovekeeper.** Family `living-refuge`. Economy: Seedwell and Medicine Nursery; habitat, staff and measured remedies.

**Lore evidence status:** `gameplay-only-unverified-lore`.

**Evidence:** PROJECT-01 §06; PROJECT-02 profile istari_grove. Lore: no additional verified lore claim; use current project adaptation. Entire order, fixed generated hero and institutional identity are original gameplay inventions.

**Chronology:** Original order placed by scenario; no claimed canonical founding date.

| Asset domain | Concrete treatment |
|---|---|
| Character | Short layered green mantle, growth focus, close observation. |
| Settlement | Small seedwell and medicinal beds, unlike Yavanna's forest sanctuary. |
| Production | Sorted remedies, nursery recovery and clean water. |
| Army | Thornkeepers and bounded Moth Clouds; no giant forest army. |
| Artifact | Growth focus and Renewal Charm with handled organic surfaces. |
| Magic | Healing/root effects follow prepared plants and defined areas. |
| Terrain | Moss jade, blue shade, pale seed heads and copper vessels. |

**Exception / rejection:** Generated Grovekeeper remains distinct from Radagast's named biography.

**Review:** Identify Grovekeeper through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Seedwell and Medicine Nursery and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 istari_grove costs, reach, duration, counters and retained weakness; art adds no free power.

## istari-veil

**Veil Order — Veilweaver.** Family `veiled-path`. Economy: Hidden Observatory and Safehouse; contacts and fragile decoys.

**Lore evidence status:** `gameplay-only-unverified-lore`.

**Evidence:** PROJECT-01 §06; PROJECT-02 profile istari_veil. Lore: no additional verified lore claim; use current project adaptation. Entire order, fixed generated hero and institutional identity are original gameplay inventions.

**Chronology:** Original order placed by scenario; no claimed canonical founding date.

| Asset domain | Concrete treatment |
|---|---|
| Character | Asymmetric layered grey cloak, glass focus, sideward glance. |
| Settlement | Modest safehouse entries and a screened observatory, not invisible free buildings. |
| Production | Glass work, message cases, staffed contacts and replaceable decoy props. |
| Army | Quiet Envoys and clearly signaled friendly Mist Doubles. |
| Artifact | Mist focus and False-Signal Seal, worn glass and wax. |
| Magic | Double edges/false signals label what the owner knows is decoy. |
| Terrain | Fog blue, muted mauve, dusty linen and small copper glints. |

**Exception / rejection:** Deception never removes known costs or labels from opponents' ordinary controls.

**Review:** Identify Veilweaver through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Hidden Observatory and Safehouse and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 istari_veil costs, reach, duration, counters and retained weakness; art adds no free power.

## istari-forge

**Forge Order — Artificer.** Family `worked-stone`. Economy: Arcane Foundry and Service Depot; paid repairs and standard fittings.

**Lore evidence status:** `gameplay-only-unverified-lore`.

**Evidence:** PROJECT-01 §06; PROJECT-02 profile istari_forge. Lore: no additional verified lore claim; use current project adaptation. Entire order, fixed generated hero and institutional identity are original gameplay inventions.

**Chronology:** Original order placed by scenario; no claimed canonical founding date.

| Asset domain | Concrete treatment |
|---|---|
| Character | Apron over travel robe, binding focus, measured working posture. |
| Settlement | Compact foundry linked to a depot with visible service lanes. |
| Production | Replacement parts, repair matrices, input bins and staffed benches. |
| Army | Wrought Sentinels and Bound Sparks; clear construct joints. |
| Artifact | Binding focus and Repair Matrix in a portable frame. |
| Magic | Braces light only at repaired joints; supplies remain visibly consumed. |
| Terrain | Gunmetal, clay red, dark blue and limited molten gold. |

**Exception / rejection:** Artificer is an original order hero, not Aulë or Saruman and not free manufacturing.

**Review:** Identify Artificer through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Arcane Foundry and Service Depot and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 istari_forge costs, reach, duration, counters and retained weakness; art adds no free power.

## istari-star

**Star Order — Wayseer.** Family `high-air`. Economy: Astral Hall and Beacon Station; connected observations.

**Lore evidence status:** `gameplay-only-unverified-lore`.

**Evidence:** PROJECT-01 §06; PROJECT-02 profile istari_star. Lore: no additional verified lore claim; use current project adaptation. Entire order, fixed generated hero and institutional identity are original gameplay inventions.

**Chronology:** Original order placed by scenario; no claimed canonical founding date.

| Asset domain | Concrete treatment |
|---|---|
| Character | Hooded upward profile, crystal wayglass, survey stance. |
| Settlement | Astral hall with low observation apertures and connected beacon stations. |
| Production | Lens cleaning, chart preparation and timed signal records. |
| Army | Beacon Riders and bounded Star Motes. |
| Artifact | Star focus and Wayglass with readable calibrated rim. |
| Magic | Signals travel between known stations; gaps remain gaps. |
| Terrain | Ink blue, silver stone, muted brass and pinpoint pale light. |

**Exception / rejection:** Generated Wayseer cannot see every hidden place or conjure transportation.

**Review:** Identify Wayseer through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Astral Hall and Beacon Station and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 istari_star costs, reach, duration, counters and retained weakness; art adds no free power.

## melian

**Melian — Melian.** Family `memory-threshold`. Economy: Sanctuary Court and Veil Garden; stationary protection and Anchors.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §11; PROJECT-02 profile melian. Lore: LORE-01, LORE-04, LORE-05. Source-named being; modest enclave and ordinary production are invented, especially for briefly described figures.

**Chronology:** Source-named Maia placed by scenario; local return rule is sandbox.

| Asset domain | Concrete treatment |
|---|---|
| Character | Layered mantle, listening head and songlike calm with firm boundary. |
| Settlement | Sanctuary court combining carved boughs, lamps and garden thresholds. |
| Production | Veil weaving, refuge care and maintained boundary sites. |
| Army | Border attendants and finite veil wisps, not another royal hero. |
| Artifact | Woven sanctuary seal with layered threads and visible care. |
| Magic | Girdle boundary is spatially explicit; anchor dependencies remain readable. |
| Terrain | Deep beech green, marble shadow, warm gold lamps. |

**Exception / rejection:** Major Girdle is Melian-specific, uses current Anchor rules and is not universal Sindar protection.

**Review:** Identify Melian through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Sanctuary Court and Veil Garden and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 melian costs, reach, duration, counters and retained weakness; art adds no free power.

## osse

**Ossë — Ossë.** Family `river-sea`. Economy: Storm Haven and Surf Works; working tides and hazardous coasts.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §11; PROJECT-02 profile osse. Lore: LORE-01. Source-named being; modest enclave and ordinary production are invented, especially for briefly described figures.

**Chronology:** Source-named Maia placed by scenario; local return rule is sandbox.

| Asset domain | Concrete treatment |
|---|---|
| Character | Sharp windward cloak contour, storm-shell core, exhilarated intensity. |
| Settlement | Breakwater haven with practical surf-work platforms. |
| Production | Skiff repair, weighted lines and weather-beaten tools. |
| Army | Shore guards and surf constructs brace against waves. |
| Artifact | Storm-shell core with chipped outer ridges. |
| Magic | Wave fronts show approach and landing danger, including friendly risk. |
| Terrain | Cold aquamarine, violet-black rocks and salt-white edges. |

**Exception / rejection:** Keep coastal domain distinct from Ulmo's deep/widespread waters and Uinen's shelter.

**Review:** Identify Ossë through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Storm Haven and Surf Works and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 osse costs, reach, duration, counters and retained weakness; art adds no free power.

## uinen

**Uinen — Uinen.** Family `river-sea`. Economy: Haven Pool and Rescue Yard; protected craft and finite crews.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §11; PROJECT-02 profile uinen. Lore: LORE-01. Source-named being; modest enclave and ordinary production are invented, especially for briefly described figures.

**Chronology:** Source-named Maia placed by scenario; local return rule is sandbox.

| Asset domain | Concrete treatment |
|---|---|
| Character | Flowing horizontal mantle/hair rhythm, current-knot, attentive calm. |
| Settlement | Protected basin and low rescue yard beside clear embarkation edges. |
| Production | Lifelines, hull repair, fishing gear and crew rest. |
| Army | Rescue crews and protected fishing craft carry actual loads. |
| Artifact | Pearl current-knot and practical safe-passage token. |
| Magic | Calm pockets retain visible boundaries and moving water beyond. |
| Terrain | Sea green, pearl grey, deep blue and warm rope ochre. |

**Exception / rejection:** Calm does not replace destroyed fleets or inland supplies.

**Review:** Identify Uinen through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Haven Pool and Rescue Yard and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 uinen costs, reach, duration, counters and retained weakness; art adds no free power.

## arien

**Arien — Arien.** Family `high-air`. Economy: Solar Court and Dawn Terrace; local manifested light.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §11; PROJECT-02 profile arien. Lore: LORE-12. Source-named being; modest enclave and ordinary production are invented, especially for briefly described figures.

**Chronology:** Source-named Maia placed by scenario; local return rule is sandbox.

| Asset domain | Concrete treatment |
|---|---|
| Character | Compact flame-edged figure with readable silhouette, no face-searing glare. |
| Settlement | Open solar court and angled mirror terrace. |
| Production | Light mirrors, timed worksite preparation and supplied sentries. |
| Army | Dawn sentries and finite sun-motes stand apart from the hero. |
| Artifact | Fire crystal and daylight lens with dark shielding. |
| Magic | Directional light exposes a bounded area after warning. |
| Terrain | Dawn coral, indigo shadow, bright cream and restrained hot gold. |

**Exception / rejection:** Local playable form/return is sandbox; death does not extinguish or replace the Sun.

**Review:** Identify Arien through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Solar Court and Dawn Terrace and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 arien costs, reach, duration, counters and retained weakness; art adds no free power.

## tilion

**Tilion — Tilion.** Family `high-air`. Economy: Lunar Lodge and Nightwatch Platform; patrol and interception.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §11; PROJECT-02 profile tilion. Lore: LORE-12. Source-named being; modest enclave and ordinary production are invented, especially for briefly described figures.

**Chronology:** Source-named Maia placed by scenario; local return rule is sandbox.

| Asset domain | Concrete treatment |
|---|---|
| Character | Silver-bow contour, lunar mark, mobile watchful posture. |
| Settlement | Low lodge and exposed watch platform on a traversable ridge. |
| Production | Patrol equipment, silver fittings and night-route reports. |
| Army | Night scouts, patrol riders and finite moon-motes. |
| Artifact | Silver moon-mark and sight instrument. |
| Magic | Silver interception trail respects one route and actual patrol reach. |
| Terrain | Deep cobalt, cool silver and warm shelter windows. |

**Exception / rejection:** Local embodiment is sandbox; the Moon is not a recruitable object.

**Review:** Identify Tilion through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Lunar Lodge and Nightwatch Platform and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 tilion costs, reach, duration, counters and retained weakness; art adds no free power.

## eonwe

**Eönwë — Eönwë.** Family `high-air`. Economy: Herald Hall and Expedition Camp; supplied concentrated host.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §11; PROJECT-02 profile eonwe. Lore: LORE-01. Source-named being; modest enclave and ordinary production are invented, especially for briefly described figures.

**Chronology:** Source-named Maia placed by scenario; local return rule is sandbox.

| Asset domain | Concrete treatment |
|---|---|
| Character | Long standard line, heraldic seal, open commanding posture. |
| Settlement | Campaign hall with organized tents and stores, no endless imperial capital. |
| Production | Maintained banners, siege crew tools and written commissions. |
| Army | Supplied herald companies and banner guards with clear terms. |
| Artifact | Commission banner with maker/custody record. |
| Magic | Advance/rally cues align a bounded group and connected front. |
| Terrain | Wind-scoured stone, ivory cloth, blue shade and quiet gold. |

**Exception / rejection:** Martial stature never supplies provisions or extra hero commitments.

**Review:** Identify Eönwë through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Herald Hall and Expedition Camp and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 eonwe costs, reach, duration, counters and retained weakness; art adds no free power.

## ilmare

**Ilmarë — Ilmarë.** Family `high-air`. Economy: Signal Court and Star Relay; staffed evidence chain.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §11; PROJECT-02 profile ilmare. Lore: LORE-01. Source-named being; modest enclave and ordinary production are invented, especially for briefly described figures.

**Chronology:** Source-named Maia placed by scenario; local return rule is sandbox.

| Asset domain | Concrete treatment |
|---|---|
| Character | Narrow mantle and hand-held signal glass, exact listening gaze. |
| Settlement | Small court with separated low relays and open sightlines. |
| Production | Lamp upkeep, witness records and couriers at stations. |
| Army | Beacon keepers, couriers and signal motes. |
| Artifact | Signal crystal and witness glass in protective fittings. |
| Magic | A second signal confirms a message, never global clairvoyance. |
| Terrain | Cold indigo, silver flecks and tiny warm staffed windows. |

**Exception / rejection:** Source names her briefly; this communication economy and character detail are inventions.

**Review:** Identify Ilmarë through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Signal Court and Star Relay and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 ilmare costs, reach, duration, counters and retained weakness; art adds no free power.

## ent-grove

**Ent Grove — Grove Elder.** Family `embodied-wild`. Economy: Moot Grove and Rootworks; slow habitat defense.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §10; PROJECT-02 profile ent_grove. Lore: LORE-02. Source-inspired people/creature; original playable society, hero and production. Specific taxonomy/costume lore beyond cited evidence needs new verification.

**Chronology:** Community or creature identity in a declared sandbox; no single fixed historical ruler implied.

| Asset domain | Concrete treatment |
|---|---|
| Character | Branching asymmetric body, eyes held in bark folds, rooted weight. |
| Settlement | An inhabited grove with open moot space, no tree-shaped human castle. |
| Production | Nursery stages, water access and living root shelters. |
| Army | Sapling Guardians distinct in species/age, no duplicated Grove Elder. |
| Artifact | Living heartwood and Rootward Totem integrated with anatomy. |
| Magic | Roots form a specific screen or passage; growth remains bounded. |
| Terrain | Dark earth, saturated moss, pale bark and sunlit new leaves. |

**Exception / rejection:** Magical campaign growth is declared invention; fire and slowness remain real.

**Review:** Identify Grove Elder through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Moot Grove and Rootworks and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 ent_grove costs, reach, duration, counters and retained weakness; art adds no free power.

## eagle-eyrie

**Eagle Eyrie — Skywarden.** Family `embodied-wild`. Economy: High Nest and Training Ledge; small loads and exposed eyries.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §10; PROJECT-02 profile eagle_eyrie. Lore: LORE-02. Source-inspired people/creature; original playable society, hero and production. Specific taxonomy/costume lore beyond cited evidence needs new verification.

**Chronology:** Community or creature identity in a declared sandbox; no single fixed historical ruler implied.

| Asset domain | Concrete treatment |
|---|---|
| Character | Wide wing silhouette, compact perched portrait with intent eyes. |
| Settlement | High nest, safe landing ledges and a scale-credible harness perch. |
| Production | Harness work, cared-for landing area and provision caches. |
| Army | Scout/Rescue Flights differ by load and flight pattern. |
| Artifact | Feather sky-knot and appropriate rescue harness. |
| Magic | Wind guidance highlights a route and landing, not control of all air. |
| Terrain | Slate peaks, cold blue distance, warm russet feathers. |

**Exception / rejection:** Air units must land for objective capture; no humanoid city or infinite airlift.

**Review:** Identify Skywarden through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show High Nest and Training Ledge and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 eagle_eyrie costs, reach, duration, counters and retained weakness; art adds no free power.

## spider-brood

**Spider Brood — Brood Matriarch.** Family `embodied-wild`. Economy: Royal Hollow and Silk Nursery; prey and prepared ambush terrain.

**Lore evidence status:** `gameplay-only-unverified-lore`.

**Evidence:** PROJECT-01 §10; PROJECT-02 profile spider_brood. Lore: no additional verified lore claim; use current project adaptation. Source-inspired people/creature; original playable society, hero and production. Specific taxonomy/costume lore beyond cited evidence needs new verification.

**Chronology:** Community or creature identity in a declared sandbox; no single fixed historical ruler implied.

| Asset domain | Concrete treatment |
|---|---|
| Character | Low broad radial silhouette, eye cluster and poised forelimbs. |
| Settlement | Hollows, suspended nursery pockets and accessible maintenance strands. |
| Production | Silk stages, prey stores and layered web supports. |
| Army | Weblayers/Stalkers use different limb posture and occupied lanes. |
| Artifact | Venom-silk spindle and Nightweb Snare appropriate to body plan. |
| Magic | Visible selected web boundaries plus tremor evidence; no hidden UI traps. |
| Terrain | Indigo hollow, moss black, pearl silk and sparse amber eyes. |

**Exception / rejection:** Original brood economy; no claim this is Ungoliant or a copied film monster.

**Review:** Identify Brood Matriarch through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Royal Hollow and Silk Nursery and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 spider_brood costs, reach, duration, counters and retained weakness; art adds no free power.

## melkor-worldbreaker

**Melkor — Melkor - Worldbreaker.** Family `dominion-works`. Economy: Dark Sanctuary; one core plus four supports, finite creature calls.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §05a–05c; PROJECT-02 profile melkor_worldbreaker. Lore: LORE-01, LORE-12. Source-named Power; doctrine, capacities, exclusive game command and production rules are adaptations.

**Chronology:** One identity; source stages motivate but do not canonize the two locked sandbox doctrines.

| Asset domain | Concrete treatment |
|---|---|
| Character | One black iron identity, broad fractured mantle, force held in a still stance. |
| Settlement | Small sanctuary against enormous scarred land; never city sprawl. |
| Production | Few occupied worksites; existing-creature mustering has a real arrival route. |
| Army | Small supporting force; called Dragon/Balrog retains individual map ID. |
| Artifact | Black iron component, no unearned Silmarils in the crown. |
| Magic | Visible Worldbreak wind-up; call trail starts at a living discovered creature. |
| Terrain | Cold basalt, bruised violet, exposed iron and restrained ember cracks. |

**Exception / rejection:** Locked doctrine; cannot hatch/create/revive creatures, even in captured production buildings.

**Review:** Identify Melkor - Worldbreaker through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Dark Sanctuary and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 melkor_worldbreaker costs, reach, duration, counters and retained weakness; art adds no free power.

## melkor-dark-architect

**Melkor — Melkor - Dark Architect.** Family `dominion-works`. Economy: Black Citadel and Fortress Holds; costly capped industry and exposed networks.

**Lore evidence status:** `inspected-source`.

**Evidence:** PROJECT-01 §05a–05c; PROJECT-02 profile melkor_dark_architect. Lore: LORE-01, LORE-12. Source-named Power; doctrine, capacities, exclusive game command and production rules are adaptations.

**Chronology:** One identity; source stages motivate but do not canonize the two locked sandbox doctrines.

| Asset domain | Concrete treatment |
|---|---|
| Character | Same Melkor identity, disciplined iron mantle planes, command gesture. |
| Settlement | Citadel/holds show controlled sprawl within actual limits, linked by supply roads. |
| Production | Brood vault/crucible queues, paid inputs, staff and capacity reservations. |
| Army | Individually counted great creatures with exclusive command marks. |
| Artifact | Black iron component shares identity with Worldbreaker, not a second hero. |
| Magic | Coordinated order paths and a bounded Forge Will job cue. |
| Terrain | Ash-purple industry, cold iron, sulfur ochre and furnace amber. |

**Exception / rejection:** Can call existing and produce new creatures; lower personal intervention and declared caps remain visible.

**Review:** Identify Melkor - Dark Architect through silhouette/posture and one material accent at map scale; portrait preserves those cues. Show Black Citadel and Fortress Holds and their actual work/dependencies without changing costs or capacities. Ability cues must use PROJECT-02 melkor_dark_architect costs, reach, duration, counters and retained weakness; art adds no free power.

## Coverage and handoff checks

- Exact profile IDs, faction strings and hero strings must match the structured roster. Melkor supplies two profiles but one faction; neither doctrine creates a second identity.
- Each profile supplies all seven nonempty domains and a specific exception. Similar work may share a family, but copying an entire treatment across factions fails review.
- Keep ordinary units distinct from heroes and labels distinct from painted art. A named object shown in a portrait needs scenario custody; a generic focus does not duplicate it.
- Verify the current power record before any effect or counter overlay. These art notes never define a new ability.
- Review silhouette identification without color; inspect worksite purpose at local scale; check palette against the environmental region and semantic UI colors.
- Static coverage proves only traceability/completeness. Actual recognition, target acquisition, emotional distinction, performance and balance require prototypes and playtests.
