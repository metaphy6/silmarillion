# FACTIONS, PRODUCTION & HEROES

## The Powers and Peoples of Arda - revision 6

**Compact design update | 29 September 2026**

**Current runtime amendment:** Section 14 adopts continuous real-time play for The Two Fords. Earlier weekly timing remains authoritative for the retained weekly mode.

**Choose a faction, build its production network, and create its sole hero.** Death leaves the slot empty until resources and time recreate that same hero.

| Family | Main strength | Main limitation |
|---|---|---|
| Valar | Exceptional hero and domain magic | Small sanctuary, few production sites, small supporting army |
| Melkor: two doctrines | Worldbreaker: personal might; Dark Architect: cities and monsters | Choose one for the campaign; only Melkor commands Balrogs and Dragons |
| Sauron | Command, binding, workshops and organized armies | Costly control network and dependence on functioning industry |
| Named and generic Istari | Specialized offensive magic, wards, healing and craft | Small armies, readiness costs and preparation |
| Elven clans | Elite companies, skilled craft and enchantment | Slow, expensive replacement |
| Three human kingdoms | Cities, logistics and large specialized armies | Heroes are more vulnerable; armies need supply |
| Dwarves and Orcs | Industry, engineering, equipment or economical mass production | Terrain, food and workshop dependencies |
| Creatures and guardians | Lairs, habitats and unusual movement or combat | Specialized infrastructure and narrow economic options |

**Three human kingdoms:** Gondor / Citadel Engineer; Rohan / Rider Marshal; Númenor / Ocean Warden. Each has one unique hero.

**Ten Istari choices:** Gandalf, Saruman, Radagast, Alatar and Pallando, plus the generic Ember, Grove, Veil, Forge and Star orders. Each faction has one hero.

**Elves:** eight clans or houses, each with distinct production and a unique hero.

**Visual direction remains:** huge isometric painted landscapes, tiny expressive figures, carefully made objects, intimate portraits and consequential dialogue inspired by Disco Elysium.

**Balance target:** each faction has strengths and exploitable weaknesses. Worldbreaker calls existing creatures; Dark Architect also creates them. Hero powers and counters: `hero-balance-roster.md`. Playtesting remains required.

---

## 01 / What factions actually produce

Every faction has a basic economy and specialist recipes. Buying an allied product does not automatically teach its recipe.

| Stock | Gathered or generated through | Spent on |
|---|---|---|
| P - Provisions | Farms, herds, fisheries, hunting or habitat care | Recruiting, creature feeding, army upkeep and some heroes |
| M - Materials | Forest work, quarrying, mines, salvage and trade | Buildings, weapons, ships, tools and crafted bodies |
| K - Lore supplies | Scribes, research work, recovered records and study | Training, research, ritual preparation and magical craft |
| E - Essence | Rare map sites, discoveries and slow sanctuary rituals | Hero manifestation, summons, enchantments and major magic |

M recipes can require timber, stone, metal, textile or crystal access. Sources produce shared stock, but required access must remain available when starting a recipe. Four resource bars therefore support different local economies. K represents prepared teaching and ritual work. All gains and costs are shown before commitment.

**Six production channels:** buildings expand capacity; training recruits ordinary units; kennels/nurseries/forges produce beasts or constructs; research unlocks magic; workshops craft equipment; a dedicated hero building creates the sole hero. Every playable recipe must define inputs, source access, facility, workers, duration, upkeep and population or binding cost. This report specifies the hero recipes and ordinary production identities; detailed unit/building prices remain a tuning task.

**One job per facility queue.** Pay the recipe upfront. An upgrade improves that queue or unlocks a recipe; extra buildings add ordinary production capacity within the faction's limits. Terrain and staff remain necessary. Destroying a production building loses unfinished work; voluntary cancellation returns half its stock cost. Completed units and items have individual identities, preventing cancellation or capture from duplicating outputs.

**Ordinary units need supply; summons need binding capacity.** Infantry use 1 supply, elite companies 2 and large creatures 3 as initial tuning values. Workers use housing capacity instead. Each summoned group also occupies a binding slot; starting capacity is 2, expanded only by specified structures. A summoned entity cannot be sacrificed for more resources than it cost.

**Magic has three forms:** research permanently unlocks hero techniques; workshops prepare consumable spell charges; major rituals consume resources and time at use. An ability states which form applies, so a researched technique is not accidentally charged as both a scroll and a ritual. Hero techniques use readiness, normally 6, with recovery restoring 3. Worldbreaker has 12 and recovers 6. The companion hero roster specifies costs, reach, duration and counters; production-table magic labels describe research themes, not additional free hero powers.

**Every economy can operate independently.** Basic exchange converts surplus P/M into K at a poor rate; a core ritual converts 20M + 10K into 10E over two turns. Hero base recipes require generic stocks; source access applies to their component. Without that access, the core can synthesize the component for **30M + 20K + 10E over three turns**. This grants no production knowledge or source access for other recipes. Local sources and trade remain more efficient.

---

## 02 / Create, lose and recreate the one hero

**The rule is one fixed hero type per faction and at most one living instance. Melkor selects one of two doctrines at setup; both use the same identity and hero slot, and recreation preserves the choice.** Before first creation, during production and after death there can be zero. Recruitment, capture, promotion, summoning and annexation never grant a second controllable hero. Ordinary captains and specialist units have limited abilities but no hero progression tree.

1. **Establish the hero building.** A sanctuary, hall, forge or lair contains the faction's single hero queue. Additional copies do not unlock additional hero queues.
2. **Collect the recipe and signature component.** Resources come from production, trade or exploration. Each faction makes its own component at its hero building for an additional 10M + 5K over one turn; its material or terrain access differs by faction.
3. **Create the hero.** Consume the component and pay the recipe below upfront. Production locks the slot, preventing simultaneous jobs. The hero appears only when training or manifestation completes.
4. **Develop the hero.** Three branching specializations develop the same role. Appearance and personality can vary at campaign setup; the underlying faction hero type stays fixed.
5. **Recreate after death.** Pay the full recipe, a new component and the full production time again. The same identity, level and chosen perks return. There is no free timer-based revival and no additional hero slot.

| Hero recipe code | Resource cost, excluding component | Production time |
|---|---|---|
| D - Divine: all Valar and Melkor | 120M + 100K + 120E | 4 turns |
| A - Maia/Istar, including Sauron | 80M + 80K + 70E | 3 turns |
| E - Elven clan hero | 60P + 80M + 50K + 25E | 3 turns |
| C - Dwarf, Orc, Troll or Hobbit hero | 60P + 60M + 30K + 10E | 2 turns |
| B - Ent, Eagle, Wolf or Spider hero | 90P + 40M + 30K + 40E | 3 turns |

Human kingdoms use their own recipes in section 08. These numbers are prototype hypotheses; tune starting stocks, income and map rewards for an attainable first hero rather than copying identical opening economies. Creature recipes represent playable recruitment, magical growth or reconstruction, not literal real-world maturation.

**Death has lasting cost:** travel time is lost, commitments fail, and carried equipment drops once at the death site. Recreating the hero does not copy those items. Recover them or craft replacements. Bound starter gear cannot be traded, salvaged or duplicated for profit. Capture of a corpse or equipment never blocks the basic return recipe. The faction keeps operating through its ordinary units.

A destroyed hero building can be rebuilt by a surviving worker. Losing all recovery footholds can end the faction, according to the scenario; losing the hero alone does not. A living captive still occupies the slot and needs rescue or an explicitly chosen surrender that ends the current incarnation, drops equipment once, and opens the ordinary paid recreation process.

---

## 03 / Gods, cities and mixed factions

**God factions win through the hero's presence and domain.** The fourteen Valar and Worldbreaker Melkor receive a small sanctuary economy: one core plus four support plots, no new independent cities, two ordinary production jobs running at once and a starting supply ceiling of 12. Their exceptional hero uses no supply slot but still needs readiness and travel time. One utility plot can provide housing, stores or exchange; the other plots force meaningful production choices.

Aulë can create outstanding tools and defensive works, but his few queues cannot manufacture a whole industrial empire. Yavanna excels at habitat; she does not receive every civilian building. Dark Architect Melkor instead develops fortress cities and mass creature production under section 05a's limits; he shares essence with his monsters and degrades exploited sites. Sauron is deliberately an industrial Maia faction: his hero is below the strongest Valar in raw power, while his city development is much stronger.

**Proposed starting supply ceilings:** Valar and Worldbreaker Melkor 12; Dark Architect Melkor 36, expandable to 60; other Maiar and Istari 18; Elves and Dwarves 24; human kingdoms and Orcs 36; creature factions 18. Ordinary settlements can grow capacity through infrastructure and upkeep. The Valar and Worldbreaker remain at 12. New production stops above a cap; existing units never lose loyalty. Balrogs and Dragons cannot be transferred. These limits balance supporting armies, not intrinsic hero strength.

| Cooperation | What can transfer | What stays with its faction |
|---|---|---|
| Trade | Materials, provisions, ordinary items, trained mounts, spell charges | Unresearched recipes and unique hero identity |
| Auxiliary contract | Eligible ordinary companies or constructs; never Balrogs or Dragons | Hero slot and faction-wide passive bonuses |
| Joint project | Labor, materials and a named service | Ownership, maintenance duties and cancellation terms remain explicit |
| Coalition | Coordinated missions by independent factions | Each faction keeps its own hero, budget and objective |

A coalition can therefore contain several heroes, because several independent factions participate. One player-controlled faction still has only one. An allied hero follows agreed missions rather than joining the player's hero inventory. Annexing a settlement never transfers its hero queue; the former hero departs or the independent faction remains a vassal with its own agency. Valar and Worldbreaker annexation yields tribute or an allied enclave. Dark Architect may annex within his three-city limit. Balrog and Dragon ownership and command never transfer through any coalition, auxiliary or annexation rule.

**Counterplay:** every faction must have affordable ways to delay, defend against or evade a rival's signature power. God heroes remain locally formidable but are damageable and can be defeated through preparation, combined forces and objective pressure. No race or skill grants an automatic matchup victory. Section 13 defines the common balance rules.

**Turn structure:** three strategic operations plus one personal hero commitment each week. Established production queues run separately, bounded by facilities, workforce and resources. This replaces revision 2's rule that every ongoing build occupies an operation slot. A hero can empower one workshop, lead a battle, travel or recover; routine production continues during death and recreation.

---

## 04 / Valar: sky, sea, craft and boundaries

**Every row is a separate faction with the named Power as its only hero; recipe D.** The two building families fit inside the sanctuary cap. Troops, animals, constructs and manifestations are ordinary units, never extra heroes. The first listed building creates the hero.

| Sole hero | Buildings | Ordinary unit / creature | Magic / item |
| --- | --- | --- | --- |
| Manwë | Windwatch; Herald Court | Spear herald / courier-eagle | Gale corridor / sapphire command sceptre |
| Varda | Star Observatory; Beacon Terrace | Lantern guard / lumen construct | Reveal the hidden / star-glass lens |
| Ulmo | Spring Sanctuary; Tide Gate | Ford keeper / current-spirit | Raise or divide waters / shell horn |
| Aulë | Master Forge; Stone Workshop | Smith-guard / articulated stone porter | Shape the earthworks / maker's hammer |
| Yavanna | Seed Vault; Living Grove | Grove tender / root guardian | Awaken the canopy / grafting staff |
| Námo / Mandos | Hall of Waiting; Judgment Gate | Threshold sentinel / oath-echo | Bind a passage / judgment seal |
| Irmo / Lórien | Dream Garden; Vision Pavilion | Dream attendant / phantom hound | Sleep and misdirection / dream lantern |

**Components:** Manwë uses a wind-carved crystal; Varda a star lens; Ulmo a shell focus; Aulë a forged core; Yavanna a living seed; Námo a stone seal; Irmo a dreamglass. Each uses its fitting M-source tag, or in Yavanna's case a living grove. Spell and item names are proposed recipes; generic focuses do not duplicate canonical unique artifacts.

---

## 05 / Valar: life, memory and force

**Every row is a separate faction with the named Power as its only hero; recipe D.** The two building families fit inside the sanctuary cap. Troops, animals, constructs and manifestations are ordinary units, never extra heroes. The first listed building creates the hero.

| Sole hero | Buildings | Ordinary unit / creature | Magic / item |
| --- | --- | --- | --- |
| Nienna | House of Mourning; Refuge Cloister | Mercy attendant / memory lantern | Unbroken resolve / grey mantle |
| Oromë | Hunt Lodge; Trail Kennel | Mounted tracker / hunting-hound pack | Reveal the quarry / hunting horn |
| Tulkas | Wrestling Yard; Muster Ground | Wrestler / pack aurochs | Break the siege / grip wraps |
| Nessa | Dance Court; Relay Stable | Runner / courier stag | Fleet company / step-light anklets |
| Vána | Bloom Nursery; Song Aviary | Garden tender / songbird swarm | Sudden flowering / renewal wreath |
| Estë | Rest House; Healing Pool | Field healer / rescue hind | Deep restoration / healing veil |
| Vairë | Chronicle Loom; Archive Hall | Recorder-guard / threadward effigy | Reconstruct the past / memory shuttle |

**Components:** Nienna uses a mourning veil; Oromë a carved horn; Tulkas forged grip bands; Nessa a woven relay cord; Vána a flowering circlet; Estë a healing vessel; Vairë a woven memory. All are made through the common component recipe. A healer, courier or living grove can be decisive even when its faction produces little siege equipment.

---

## 05a / Melkor: two doctrines, one hero

**Choose at campaign setup.** Both doctrines represent the same Melkor, use one hero slot and preserve the chosen doctrine after death. They cannot coexist, combine their bonuses or switch through recreation. Both use recipe D and the black iron component: normally **130M + 105K + 120E over five sequential turns**, including component manufacture but excluding the core's construction. The established component-synthesis fallback remains available.

| System | Worldbreaker - hero oriented | Dark Architect - city oriented |
|---|---|---|
| Power focus | Overwhelming personal combat, destructive magic and direct intervention | A formidable commander investing power in fortresses, industry and creatures |
| Readiness | 12 maximum; recovery restores 6 | 6 maximum; recovery restores 3 |
| Cities | One Dark Sanctuary core plus four support plots; no additional cities | One Black Citadel with eight support plots; up to two additional Fortress Holds with six plots each |
| Ordinary production | Two concurrent jobs across the faction | Six concurrent jobs across the faction |
| Army supply | 12, fixed | 36; each completed, held Fortress Hold adds 12, up to 60 |
| Great-creature capacity | 2 points, fixed | 4 points; each held Fortress Hold adds 2, up to 8 |
| Monster access | Call and use existing Balrogs and Dragons only; cannot create, breed, hatch, summon new ones or revive dead ones | Call existing creatures; breed/create Dragons and summon new Balrogs through production |
| Principal weakness | Limited territory coverage and replacement capacity | Expensive supply networks, vulnerable worksites and weaker personal intervention |

### Worldbreaker's hero kit

**Worldbreak [4 readiness]** damages one obstacle or a tightly held position after a visible warning; it cannot erase a healthy capital or hero in one use. **Call of the Dark [3 readiness + 20P + 20M + 10E]** uses the weekly hero commitment to mobilize one discovered, living creature already on the map. It follows an actual route. **Unspent Might** gives 12 readiness and recovery of 6, supporting direct intervention. His limited city economy and finite monster pool remain weaknesses.

### Dark Architect's hero kit

**Forge Will [3 readiness + 10E]** uses the hero commitment to advance one fully paid, staffed job by one turn, without same-turn start-and-finish. **Iron Edict [3]** uses that commitment to coordinate up to three owned great creatures on one connected front. **Brood Discipline**, researched at the Command Spire, improves production as described below. He also uses the common call action on existing creatures, with the same costs as Worldbreaker. His personal combat remains weaker, and industry consumes upkeep and vulnerable sites.

**Better control means greater capacity and coordination.** Both doctrines have identical, unconditional loyalty from every Balrog and Dragon. Command buildings relay Melkor's orders; workers, captains and allies never gain independent authority over those creatures. Melkor's nonhero units remain nonheroes even when individually powerful.

---

## 05b / Melkor's exclusive creature industry

**New Balrogs and Dragons require Dark Architect.** Worldbreaker has no production, hatching, resurrection or transformation route that adds to their living population. The Dragon/Balrog rows below are disabled for him, including captured or annexed facilities. Siege brutes remain available to either doctrine. Every new creature consumes the full recipe, facility time and capacity; summoning is a production ritual, not an instant army button.

| Product | Facility | Base cost / turns | Supply / great-creature points |
|---|---|---|---|
| Siege brute | War Pens | 40P + 50M + 10K + 5E / 3 | 3 / 0 |
| Lesser Drake | Dragon Brood Vault | 40P + 35M + 10K + 20E / 3 | 3 / 1 |
| Ground Dragon | Dragon Brood Vault, tier 2 | 120P + 100M + 40K + 80E / 6 | 6 / 1 |
| Winged Dragon | Sky Brood Vault, tier 3; Dark Architect only | 160P + 140M + 60K + 120E / 8 | 8 / 2 |
| Balrog | Black Crucible, tier 2 | 100M + 60K + 100E / 6 | 6 / 1 |

Dark Architect's War Furnace supplies metalwork; Dragon vaults breed/create; the Crucible summons new Balrogs through an invented production ritual. Each creature is one individually counted unit, not an unlimited group hidden inside one slot. These creatures use the listed supply and great-creature points instead of ordinary summon binding slots. Siege brutes remain available to other permitted factions; exclusivity applies to the Dragon and Balrog families.

**Industry advantage:** Dark Architect can research Brood Discipline at a Command Spire for 60M + 40K + 30E over three turns. It reduces future Dragon/Balrog base production time by 25%, rounded up: 3/6/8 becomes 3/5/6 turns. Prices stay unchanged. Each facility still runs one job, within the faction's six-job ceiling. Queued creatures reserve supply and great-creature points, preventing mass completion beyond capacity.

**Sustainment costs:** Lesser Drakes consume 1P + 1E per turn; Ground Dragons 3P + 1E; Winged Dragons 5P + 2E; Balrogs 3E. Called and newly produced creatures pay identical upkeep. Unpaid upkeep reduces readiness and stalls further activation/production; it never changes loyalty. These starting numbers require economic testing.

**Balance lever:** Worldbreaker saves construction and manufacturing investment but cannot replace slain creatures from production. Dark Architect pays to build that replacement capacity. His industrial output is constrained by supplies, essence, vulnerable facilities, queue time and his weaker personal hero. Opponents can exploit those pressures without controlling his monsters.

---

## 05c / Calling existing creatures and absolute loyalty

**Calling moves an existing entity; creation adds a new entity.** At map generation, each existing Balrog or Dragon receives a permanent ID, location, life state and discovery route. Call reserves one living ID plus its full supply and great-creature capacity. Repeated calls, leaving/re-entering the map and recreating Melkor cannot duplicate it or restore a dead one.

Both doctrines can use **Call of the Dark**: 3 readiness, the weekly hero commitment, 20P + 20M + 10E. The cost equips and provisions its deployment; obedience is unconditional. A discovered creature travels from its real position through ordinary movement operations, with warning and interception opportunities. It never teleports or appears as a new summon. Calling is unavailable while Melkor's embodiment is absent, though previously called creatures remain commanded by his will.

**Worldbreaker's finite pool:** every compatible map provides at least two discoverable one-point candidates, and an optional two-point Winged Dragon alternative, with comparable travel and risk. Only his two-point capacity can be active. Once called, a creature continues occupying capacity while garrisoned or returning to its lair. Slain IDs stay dead for this doctrine. No random empty map may disable the calling playstyle; opponents can still scout, block routes or kill candidates during play.

**Exclusive allegiance overrides every other mechanic.** Balrogs and every Dragon form, including offspring, always obey Melkor and nobody else. They cannot be bought, hired, tamed, charmed, dominated, commandeered, inherited through annexation or controlled by an allied player. Allied movement, rally and transport powers cannot issue or revise their orders. Sauron and his rings receive no exception. Captivity may restrain them. Damage, stun, physical obstruction and terrain hazards work normally; changing their commander does not.

**During Melkor's return:** only previously called creatures or creatures completed through Dark Architect production follow his faction orders while his body is recreated. Uncalled map creatures retain fixed lair orders until a paid Call reserves their capacity. Bodily hero abilities are unavailable. Captured buildings halt production; stolen eggs cannot hatch for another faction; copied recipes cannot bypass doctrine or owner checks. Low morale, shortages, lost Holds and damaged relays never cause betrayal. Losing capacity prevents new reservations, while living creatures and prior reservations retain allegiance.

Without an active Melkor faction, these beings can appear only as unrecruitable remnants following his last orders. After elimination, survivors defend their assigned territory. A remnant is part of the finite map population, not a renewable spawn source. The prior independent Dragon and Balrog factions remain removed.

---

## 06 / Sauron and the five generic Istari orders

**Each order has one generated hero of the listed type, using recipe A.** The first building creates its hero and signature component. The component's required source gives the order a distinct opening. Other trained casters and constructs remain ordinary support units. These are original orders, not five canonical Wizard identities.

| Faction / sole hero | Buildings / component access | Ordinary production | Magic / item |
|---|---|---|---|
| Ember / Kindler | Hearth Sanctuary; Refuge Lodge / metal, ember focus | Hearth Wardens; Ashlight spirits | Rally through terror; shelter ward / Oath Lantern |
| Grove / Grovekeeper | Seedwell; Medicine Nursery / living grove, growth focus | Thornkeepers; Moth Clouds | Root snare; recovery bloom / Renewal Charm |
| Veil / Veilweaver | Hidden Observatory; Safehouse / glass, mist focus | Quiet Envoys; Mist Doubles | False signal; concealed passage / False-Signal Seal |
| Forge / Artificer | Arcane Foundry; Service Depot / metal, binding focus | Wrought Sentinels; Bound Sparks | Repair supplied equipment; reinforce cover / Repair Matrix |
| Star / Wayseer | Astral Hall; Beacon Station / crystal, star focus | Beacon Riders; Star Motes | Route warning; prepared interception / Wayglass |

**Distinct costs:** Ember needs supplies for occupied refuges; Grove needs viable habitat; Veil needs staffed contacts and fragile decoys; Forge consumes material even when using magic to repair; Star needs connected beacons and verified observations. Summoned spirits and motes occupy binding capacity, while trained followers need ordinary supply.

### Sauron: the industrial controller

**Sole hero:** Sauron, recipe A, created at a Binding Forge with a forged binding core. **Buildings:** Binding Forge, Command Tower, foundries and tribute depots. **Production:** armored overseers, werewolves, siege equipment and lesser binding rings. **Hero capabilities:** borrowed disguise, terror and coordinated command. **Perk:** functioning client networks improve mobilization. **Weakness:** surveillance, armies and industry compete for resources; exposed dependency creates secession opportunities. Sauron's command, bindings and rings never control, create or revive Balrogs or Dragons; those families belong exclusively to Melkor.

A lesser binding ring is an ordinary invented item. The One Ring remains a unique optional world project with one identity and disclosed consequences. The standard production mode's repeatable hero return does not use permanent Ring-destruction elimination. A separate historical scenario can make destroying the One decisive, with that exception shown before play. This prevents the standard hero rule from silently changing mid-match.

**Generic identity:** generated names, portraits, voices and histories make each Kindler or Wayseer memorable. Their identity comes from the order. Named Wizards are additional selectable factions under section 06a, never bonus heroes recruited into a generic order.

---

## 06a / Five named Istari, five additional factions

**Gandalf, Saruman, Radagast and both Blue Wizards supplement all five generic orders.** Each named Wizard leads a distinct selectable faction with one fixed hero and one active/pending slot. Alatar and Pallando are separate choices and may cooperate as independent allies; neither faction receives both heroes.

| Sole hero | Hero building / component | Faction production | Intended specialty / weakness |
|---|---|---|---|
| Gandalf | Fellowship Refuge; Council Hall / emberwood focus, timber | Free-company wardens, resolve standards, wardstones | Fire and light, protection and courage / limited industry and endurance |
| Saruman | Orthanc Workshop; Muster Foundry / resonant core, metal | Uruk companies, siege engines, wrought sentinels | Destructive force and paid construct creation / material demand and exposed workshops |
| Radagast | Woodland Sanctuary; Beast Refuge / living seed, grove | Beast companions, woodland defenders, healing salves | Offensive living terrain and healing / fire, barren ground and weak siege industry |
| Alatar, Blue Wizard | Eastern Hunt Lodge; Outrider Camp / hunter seal, stone | Outriders, hunters, marked-shot equipment | Dangerous-target hunter and pursuit / weaker against crowds and fortified positions |
| Pallando, Blue Wizard | Resistance Hall; Ward Workshop / ward-knot, crystal | Resistance companies, ward-breaker tools, resistance charms | Damaging spell disruption and protective wards / lower pressure against mundane massed troops |

**Shared economy:** one enclave core plus six support plots; starting supply 18 and two ordinary production queues. Saruman has three queues within the same plot and supply limits. Existing enclave improvements can expand supply with normal costs; these profiles do not gain unlimited colonies. Detailed ordinary-unit prices remain a tuning task.

**Creation and return:** recipe A plus the usual component: **90M + 85K + 70E over four sequential turns**, excluding the core's construction. Missing-source synthesis uses the established fallback. Named Wizards have readiness 6, recover 3, and pay the same recreation cost after death. Gandalf's Grey and White presentations share one identity and slot; no second Gandalf or automatic death-triggered power upgrade is granted. Unique artifacts are optional world rewards, not duplicated starting equipment.

**Power kits:** `hero-balance-roster.md` defines each offensive signature, second power, passive, cost and counter. Names do not confer automatic superiority over generic orders. Strong spells spend readiness, expose the caster and have counterplay. Neither voice magic nor spellbreaking overrides Melkor's exclusive command of Dragons and Balrogs. The older fifty profiles await the separate offensive-capability redesign discussed with the user.

**Source boundary:** these five additions use wider Tolkien material. The [original licensed Wizards rulebook, printed pages 2-3](https://www.vintageccg.com/wp-content/uploads/2023/01/Middle-Earth-The-Wizards-CCG-Rulesbook.pdf) names the five and attributes Alatar and Pallando to *Unfinished Tales*. Their separate factions, powers, production and repeatable returns here are game inventions, not claims established by the supplied *Silmarillion*.

---

## 07 / Elves by clan and house

**Each row has one fixed hero type; recipe E.** The listed hero hall is also the component workshop. Noldorin houses and Telerin branches are different levels of ancestry; the selection screen presents the family tree rather than calling them eight equal ancestral kindreds. Each faction can recruit basic workers, defenders and archers alongside its specialties.

| Clan or house / sole hero | Hero hall / component | Signature production | Magic and equipment identity |
|---|---|---|---|
| Vanyar / Concord Singer | Chorus Court / tuned songstone | Banner Fellowships; ceremonial standards | Formation hymns, courage wards and resonant instruments |
| House of Fëanor / Jewelwright | Gem Atelier / cut crystal | Masterwork blades; bound-light jewels | Stored radiance, crafted traps and powerful personal equipment |
| House of Fingolfin / Shield Marshal | Pass-watch Fortress / forged shield seal | Mounted Wardens; reinforced gates | Protective banners, disciplined counterattacks and durable armor |
| House of Finarfin / Lore Envoy | Hall of Welcome / inscribed pact | Healing singers; guest workshops | Restorative songs, translation charms and diplomacy tools |
| Falmari / Tide Captain | Harbor Hall / carved shell compass | Swan-ships; Harbor Beacons | Calm-passage charms, sea cloaks and maritime signals |
| Sindar / March Warden | Hidden Court / woven veil | Hidden Watch-houses; woodland companies | Concealment mantles, boundary wards and song-lures |
| Nandor / Woodland Pathfinder | Forest Waystation / living trailmark | Canopy Scouts; trained woodland mounts | Root snares, hidden paths and practical bows |
| Avari clan / Frontier Mediator | Clan Lodge / local waystone | Portable Workshops; decentralized Waymarks | Mobile camp wards, local lore and adaptable travel gear |

**Tradeoff:** an Elven clan maintains fewer, more costly specialists than a human kingdom or Orc fortress. Long training and skilled workshops make preserving units valuable. Item production can be exceptional without making every ordinary recruit a spellcaster.

The hero's three branches express its existing role. A Jewelwright chooses weapons, protective works or utility craft; a March Warden chooses concealment, defense or border diplomacy. A clan cannot buy another clan's hero through an alliance.

Nandorin and Avari factions can recruit animals through their specialist grounds. Elven armies chiefly train people and craft enchanted objects; they do not all need an invented monster-breeding roster. A Fëanorian player can obtain an eligible allied beast or construct without learning its recipe; Balrogs and all Dragon forms are excluded. Melian's Girdle remains her faction's major enchantment, not a free racial ability for every Sindarin player.

---

## 08 / Exactly three human kingdoms

**Each kingdom has one unique hero type, recreated through its own recipe.** Every kingdom can build housing, farms, stores, roads, barracks and basic defenses. Their specialist production gives each a different reason to expand and trade. The hero building makes a signature component using the common 10M + 5K, one-turn rule.

| Kingdom | Sole hero, creation and component | Distinct production |
|---|---|---|
| Gondor | **Citadel Engineer**; Citadel Hall; stone command seal. **60P + 80M + 30K + 10E / 2 turns** | Fortified Supply Depots, Shield Companies, siege engines, repair kits and defensive standards |
| Rohan | **Rider Marshal**; Muster Hall; forged horse crest. **100P + 40M + 20K + 10E / 2 turns** | Horse-breeding Steads, Rider Companies, mounted scouts, remounts, saddles and rally horns |
| Númenor | **Ocean Warden**; Admiralty Hall; carved sea compass. **70P + 70M + 60K + 20E / 3 turns** | Deep-water Shipyards, Expedition Ships, marines, navigation tools, signal towers and sea wards |

### Gondor: hold and engineer

**Hero powers:** see the Citadel Engineer entry in `hero-balance-roster.md` for the defined actions, costs and counters. **Perk:** prepared depots extend operational endurance. **Branches:** fortification, siege engineering or supply command. **Production weakness:** armies and walls consume metal and maintenance. **Counter:** bypass its strong points, contest roads and force dispersed defense.

### Rohan: concentrate and move

**Hero powers:** see the Rider Marshal entry in `hero-balance-roster.md` for the defined actions, costs and counters. **Perk:** mounted forces reposition rapidly on suitable ground. **Branches:** scouting, shock action or relief logistics. **Production weakness:** horses require pasture, fodder and training; a stable does not create instant mature mounts without stock. **Counter:** defended chokepoints, broken terrain and attacks on fodder.

### Númenor: reach and sustain

**Hero powers:** see the Ocean Warden entry in `hero-balance-roster.md` for the defined actions, costs and counters. **Perk:** fleets can maintain more demanding routes. **Branches:** navigation, expedition command or maritime diplomacy. **Production weakness:** ships consume several material sources and are vulnerable away from harbors. **Counter:** blockade, damaged ports and commitments deep inland.

Human magic focuses on learned support, prepared wards and crafted equipment. They can obtain enchantments through trade or a slow local workshop. Strong production and adaptable armies compensate for heroes who cannot confront the greatest gods directly.

Númenor, Gondor and Rohan are the only selectable human kingdoms in this revision. Other human communities may appear as neutral settlements or narrative actors. The shared roster is explicitly cross-age; adding another playable human kingdom later requires a new design decision.

---

## 09 / Dwarves, Orcs and Hobbit communities

**Each row has one hero, recipe C.** Ordinary workers, storage, food access and defenses support the specialist economy. The first building creates the hero; the component uses the common recipe and the matching source. These Dwarven choices are realm traditions, not three exhaustive ancestral houses.

| Faction / sole hero | Buildings / component | Production and magic | Strategic constraint |
|---|---|---|---|
| Khazad-dûm / Deep Surveyor | Deepworks Hall; Tunnel Foundry / survey core | Tunnel Guards, mining engines, stone porters, survey lenses and passage wards | Food imports, ventilation and exposed entrances |
| Belegost / Armor Master | Mail Hall; Mask Workshop / tempered armor seal | Masked Vanguards, protected haulers, hazard armor and resistance fittings | Slow metal-intensive output; protection must match the threat |
| Nogrod / Master Artificer | Precision Forge; Commission House / master-tool core | Engineers, breach tools, small mechanisms, crafted weapons and durable inscriptions | Specialist labor and rare inputs constrain throughput |
| Orc fortress-clan / Warband Organizer | Warband Hall; Salvage Foundry; Tunnel Pens / black iron badge | Tunnel Raiders, wolf riders, siege brutes, crude artillery and scavenged arms | High food demand; coercive organization increases instability |
| Hobbit Shire / Shirekeeper | Common Hall; Commons Farm; Watch House / hearth token | Fieldhands, Bounders, pack ponies, superior food stores, travel kits and Hearthward Lanterns | Vulnerable to occupation and prolonged open battle |

**Dwarven heroes:** Deep Surveyor opens routes and identifies resources; Armor Master adapts a company's protection; Master Artificer specializes tools and siege support. Their equipment can strengthen other factions, but each buyer must maintain it and find a suitable bearer.

**Orc hero:** Warband Organizer unlocks three approaches: disciplined mustering, aggressive raiding or industrial salvage. It can bargain with clans, rally a broken formation and accelerate an existing salvage job. The player chooses institutions; Orc identity does not mandate a single political allegiance. Wolf riders require trained mounts, and siege brutes require dedicated pens, supplies and longer production.

**Hobbit hero:** Shirekeeper coordinates hidden movement, emergency provisioning and community defense. Its branches emphasize stealth, mutual aid or trade. Food and dependable support can make a small community strategically important without giving it a disguised god-level combatant.

These peoples have magic access through craft, qualified specialists, bought enchantments or explicitly invented research. Standard recruits do not receive every spell. Construct and creature production supplements the social identity of each faction rather than replacing it.

**Upgrades:** level 1 produces basic units; level 2 adds one specialized branch; level 3 unlocks its elite output. Choose between competing branches within a structure. Extra structures require workers, space and maintenance, and never create another hero slot.

---

## 10 / Creatures and guardians

**A lair, eyrie or grove is this faction's settlement.** It provides appropriate production and storage rather than copying a human city. All produced creatures are ordinary units. The hero's exceptional status, progression and return queue are unique even when followers share its species.

| Faction / sole hero / recipe | Hero building / component | Ordinary production and buildings | Magic / crafted asset |
|---|---|---|---|
| Ent Grove / Grove Elder / B | Moot Grove / living heartwood | Living Nursery grows Sapling Guardians; Rootworks grows shelters and defensive roots | Rootward protection / Rootward Totem |
| Eagle Eyrie / Skywarden / B | High Nest / feather sky-knot | Training Ledge recruits Scout Flights; Harness Perch prepares Rescue Flights | Wind guidance / carried Wind Knot |
| Troll Hold / Stonebreaker / C | Chieftain's Hall / iron-stone badge | Drill Yard trains Shield Trolls; Breach Workshop equips Siege Crews | Purchased protection / Stonehide Plate |
| Wolf Pack / Packwarden / B | Gathering Den / scent token | Scent Den raises Trackers; Pack Ground organizes Runners and hunting groups | Moon-marked pursuit / Moonfang Token |
| Spider Brood / Brood Matriarch / B | Royal Hollow / venom-silk spindle | Silk Nursery creates Weblayers; Brood Chamber raises Venom Stalkers | Concealed webs / Nightweb Snare |

Every component uses the common component cost; source requirements follow its material or habitat. Biological production uses existing populations, recruitment or disclosed magical growth to fit the campaign timescale. Dragon and Balrog production belongs exclusively to Melkor under section 05b. They are powerful ordinary units, not separate factions or extra heroes.

**Hero roles:** Grove Elder anchors territorial defense; Skywarden intercepts and extracts; Stonebreaker breaches; Packwarden coordinates pursuit; Brood Matriarch prepares ambush terrain. Each has three specialization branches within that role.

**Counters:** burn or divide a grove, threaten an eyrie, deny Troll supplies, deplete hunting territory or clear web routes. Give opponents warning, approach choices and ways to contest the objective rather than requiring every faction to win a frontal fight.

A lair asset strengthens a territory or is carried appropriately; creatures do not equip humanoid swords and boots by default. Lair upgrades, protective harnesses, caches, traps and ritual sites occupy the same design space as equipment and buildings elsewhere.

---

## 11 / Other Maiar remain distinct factions

These optional factions retain the broader roster from revision 2. Each has its named being as its sole hero, recipe A, with a component produced at the first listed building. Their cities remain modest: one enclave with six support plots and supply 18. They emphasize a narrow service or domain. Production below is invented gameplay, especially where the source describes an individual only briefly.

| Sole hero | Buildings / component | Ordinary production | Hero magic / item |
|---|---|---|---|
| Melian | Sanctuary Court; Veil Garden / woven sanctuary seal | Border attendants, refuge keepers and veil wisps | Bounded Girdle, concealment / sanctuary mantle |
| Ossë | Storm Haven; Surf Works / storm-shell core | Shore guards, storm skiffs and surf constructs | Hazardous seas, landing disruption / tidebreaker charm |
| Uinen | Haven Pool; Rescue Yard / pearl current-knot | Rescue crews, protected fishing craft and current guides | Calm water, convoy protection / safe-passage token |
| Arien | Solar Court; Dawn Terrace / fire crystal | Dawn sentries, light mirrors and sun-motes | Expose movement, contest shadow / daylight lens |
| Tilion | Lunar Lodge; Nightwatch Platform / silver moon-mark | Night scouts, patrol riders and moon-motes | Interception, night-route warning / silver sight |
| Eönwë | Herald Hall; Expedition Camp / heraldic seal | Supplied herald companies, banner guards and siege crews | Coordinated advance, rally / commission banner |
| Ilmarë | Signal Court; Star Relay / signal crystal | Couriers, beacon keepers and signal motes | Warning relays, illumination / witness glass |

**Different from the Valar:** these factions have somewhat more institutional capacity and lower hero costs, while their heroes have narrower reach and lower raw power than the greatest Powers. Melian invests in a stationary sanctuary; Eönwë concentrates supplied military strength; Ilmarë turns communication into strategic advantage.

**Persistent magic:** a maintained ward, major veil or protected route occupies an Anchor with a defined area and dependency. A hero has at most three Anchors; Melian's major Girdle uses two. Ordinary buildings use plots, not Anchors. Release ends the sustained magic, frees capacity at turn end and refunds no resources. Hero death suspends hero-dependent Anchors until return; ordinary physical buildings continue functioning.

Arien and Tilion use a small local manifestation for direct play and announced celestial routes for regional effects. Their hero deaths and returns are explicit sandbox inventions. They do not physically replace the world's Sun or Moon with a freshly purchased item, nor bombard the whole map without warning.

**Unique identity:** the game never creates a second Manwë, Sauron or Melian because another production queue completed. In multiplayer, if later implemented, named factions would require exclusive selection; custom races/orders would still obey one hero per player faction.

---

## 12 / A practical example and development order

**A three-faction coalition:** Rohan supplies cavalry and food; a Fëanorian clan supplies enchanted equipment; an Ember order prepares courage wards and support spirits. Each faction retains its own single hero. A joint army can contain ordinary units from all three, but recruiting their companies does not transfer their heroes or research trees. Melkor's Balrogs and Dragons can fight alongside allies only under Melkor's own orders; joint command never includes them.

**Rohan's opening:** build a Horse-breeding Stead, secure fodder and train workers. At the Muster Hall, spend 10M + 5K and one turn to make a horse crest. Then spend 100P + 40M + 20K + 10E and two turns to create the Rider Marshal. The full first-hero chain therefore costs **100P + 50M + 25K + 10E over three sequential production turns**, excluding the Hall's construction. Gathering and other queues can operate concurrently.

If the Marshal dies, Rohan keeps its farms, army and production. Recover the fallen hero's equipment or replace it. Recreate the horse crest and pay the same complete chain again. The Marshal returns with the same development, while the lost time and expenditure create a real opening for opponents. Another kingdom's hero cannot fill the empty slot.

**First prototype:** Gondor, Rohan, one Elven house, one generic Istar order, one Orc clan and one Vala. Test whether economic factions can exploit the god's limited coverage, whether crafted heroes feel worth saving, and whether returning after death preserves tension. Test Númenor on a coastal map. Then test each Melkor doctrine separately against the same opposition, including a hero death and an occupied breeding site.

**Required checks:** one living/pending hero per faction; exactly three human kingdom entries; one fixed hero type for every entry; no inventory duplication after death; no annexation bypass of hero or divine city limits; viable recreation after losing a contested resource site; useful production without the hero present; Melkor doctrine persistence, exclusive Dragon/Balrog command under every capture/trade/magic/death path, reserved creature capacity, and readability at the distant camera.

This specification contains **54 factions and 55 starting profiles:** fourteen Valar, Melkor with two mutually exclusive doctrines, Sauron, five named Istari and five generic orders, eight Elven profiles, three human kingdoms, three Dwarven traditions, Orcs, six creature/community factions and seven other Maiar. Dragons and Balrogs are Melkor-exclusive units. Two Melkor profiles never create two Melkors; each named Wizard also has one identity.

**Evidence and revision boundary:** the supplied 461-page *Silmarillion* was read for the source report. Production recipes, generic orders, constructs, city caps and repeatable resurrection are gameplay adaptations. Older permanent-death restrictions, broad human roster and ongoing-build order costs remain superseded. Revision 5 established Worldbreaker's existing-only monsters, hero kits and faction-wide balance requirements; Dark Architect alone produces new Dragons and Balrogs. Revision 6 adds five named Istari alongside the five generic orders, replacing the narrative-only restriction. Their offensive kits are new proposals; the older fifty profiles remain unchanged. Earlier reports and PDFs are versioned files at the project root.

The full reading notes remain beside this document. Historical revision-6 planning status: implementation and balance simulation were then pending. The current browser runtime and the scoped real-time amendment in Section 14 supersede that implementation status; competitive balance remains unverified. The huge-map, tiny-character visual direction remains applicable.

---

## 13 / Balanced factions, different strengths

**The goal is equal strategic opportunity, not automatic superiority from lore, race or a signature skill.** Balance applies to the entire faction: hero, economy, army, information, mobility and objective access together. Stronger personal power consumes the capacity that another faction spends on cities or armies. The figures in this report are starting hypotheses, not evidence of achieved balance.

**Every starting hero profile now has two defined signature powers and a bounded passive.** The companion `hero-balance-roster.md` covers all 55 profiles, including both Melkor doctrines and five named Istari. Each entry states the weakness it helps, costs, range, duration, counterplay and the weakness that remains. This roster replaces earlier informal hero suggestions; production tables describe possible research and crafted goods. The support-heavy older kits still need offensive review; their balance is not established by completeness alone.

| Requirement | Concrete rule |
|---|---|
| Partial compensation | A hero can temporarily repair, shelter, move or coordinate a limited operation. It cannot provide unlimited workers, permanent free resources or every missing building. |
| Opportunity cost | Regional support uses the same weekly hero commitment as travel, battle or recovery. Queue acceleration still requires full paid inputs, staff and a facility. |
| Useful weaknesses | Aulë can help one worksite, but keeps few queues; Ulmo can bypass broken roads through water, but cannot supply dry inland territory without routes. |
| Accessible counters | Basic scouting, cover, dispersed formations, fieldworks, anti-air defenses and supply disruption unlock before the relevant elite threat. No counter requires one particular named hero. |
| Bounded combat | Major effects have a visible warning and a response window. No single ability erases a healthy hero or capital. No permanent hard-control chain: after a disable ends, the target resists another for two tactical phases. |
| No infinite combinations | Same-effect bonuses use the strongest source, not repeated stacking. Acceleration cannot duplicate jobs or resources. Summons count against declared capacity. |

**Shared balance scenario:** three contested sites on a map with two approach routes each. From turn 8, holding at least two for three consecutive resolutions wins; losing that control resets the hold streak. A site requires a present eligible hero or supplied company with no unneutralized opponent in its capture area. Air units must land. Every faction has a qualifying unit; support heroes can win through their followers. All players see progress. Faction-specific story victories remain separate scenarios.

**Map fairness:** compare starting economic value and time-to-first-hero, not identical raw resource quantities. Place usable terrain for every selected theme, accessible alternatives to monopoly nodes, and a finite creature pool for Worldbreaker. Different maps can favor different approaches, but no start may remove a faction's essential actions or make its sole counter unavailable.

**Validation before claiming balance:** run mirrored starts and swaps of player/AI skill, track first-hero timing, replacement delay, objective access, resource surplus and ability use. Look for a consistently best faction, a mandatory skill choice, an unanswerable power or a matchup with no feasible response. Win-rate bands such as 45-55% overall and 40-60% by matchup are provisional investigation targets; samples and uncertainty must be reported. Tune costs, ranges, durations, upkeep or map access, then retest. No simulation or playtest claim is made here.

---

## 14 / Adopted real-time skirmish amendment — 30 September 2026

**Authority and scope.** The requested real-time transformation adopts the following timing and interaction rules for **The Two Fords**, an explicitly labeled **Cross-era sandbox** using `human_gondor` (Gondor) and `istari_saruman` (Saruman's White Tower). This section overrides the weekly-operation language above **only in real-time skirmishes**. The existing weekly game retains its 54 factions / 55 profiles, complete economic and ability contracts, save version and multiplayer mode. The representative RTS slice is not a claim that the entire roster or every support system has been converted.

**Adopted mechanics.** Simulation advances in deterministic 100 ms ticks. Ordinary movement, attack, gathering, delivery, construction, recruitment, scouting and tactical orders consume no weekly operation. A renderer interpolates positions and presents results but cannot generate production or damage. Local pause and background-tab pause stop simulation; frame stalls retain the tick backlog. Commands acknowledge immediately and are evaluated against current authoritative state. There is no Resolve week button in this mode.

Workers remove finite stocks from visible sources, carry them over traversable routes and credit them only at an owned completed delivery site. Loss of a carrier loses its cargo. Workers must reach construction before it progresses; additional construction workers contribute real work. Facilities process paid FIFO queues, reserve capacity, lose unfinished work on destruction, and refund half stock costs on voluntary cancellation. Five queued entries are a buffer, not five concurrent jobs. Recipe names, costs, prerequisites, remaining seconds and the occupied hero slot are basic information available without intelligence research. Ordinary numeric tuning lives in `src/simulation/rts.ts`, not in artwork.

**Fixed identities.** The four stocks remain P—Provisions, M—Materials, K—Lore supplies and E—Essence. The roster and exact original full-price hero recipes remain unchanged. Each faction retains one living, pending or captive hero slot; an additional hall cannot add another. Recreation consumes a new component and the complete original recipe and time, preserving identity and development. A captive cannot receive ordinary commands or permit another creation. Melkor's permanent mutually exclusive doctrines and exclusive Dragon/Balrog command remain mandatory for future conversions; unsupported profiles and creature products cannot be selected or imported into the two-profile RTS kernel. This is an explicit restriction, not a generic Melkor implementation.

**Prototype timing, not established balance.** A former production turn maps to 25 seconds for the component and full hero recipes; ordinary worker recruitment, building and military durations are separately tuned seconds. Stock prices, supply/plot/queue limits, movement speeds, ranges, damage, harvest rates and AI intervals are provisional, discoverable in the runtime and subject to measured playtests. Gondor's defensive shield line, stoneworks and ranged siege contrast with Saruman's compact metal industry and close siege. Each still depends on workers, P/M/K/E and exposed infrastructure. No faction receives free production because the clock is now continuous.

**Hero commitments and counterplay.** Personal support/casting commitments have explicit tick completion and a 25-second shared cooldown in this slice; ordinary movement/combat is independent. Gondor's Supply Refit pays 10M and requires a nearby worker and hero to restore at most 25% of an existing damaged fortification or siege engine over four seconds. Saruman's Shattering Voice pays 3 readiness, 5K and 5E, announces a two-second lane warning, affects at most two exposed units and permits dispersal, cover and interruption. Cover reduces damage and prevents push; movement cannot push a target across impassable terrain. These local durations and distance mappings are provisional adaptations, not literal lore or a conversion of every roster technique. Recovery takes ten uninterrupted seconds and restores three readiness; interruption and commitment checks are authoritative. Siege has a three-shot magazine and workers physically fetch paid material reloads and deliver them to engines; ammunition is not free replenishment.

**Scenario.** `chronology_mode=cross-era-sandbox`; `era_or_window=mixed`; `geography_basis=original invented basin`; `available_profiles=[human_gondor,istari_saruman]`; `artifact_custody=none`; `fixed_events=none`; `invented_connections=two settlements linked by two river fords`. This is not a historical map of Gondor beside Orthanc. The alternative crossings support scouting, raids and bypasses; formations, towers and walls make defended approaches costly. Destroying all of the opponent's strongholds ends the match; losing only the hero does not. The earlier two-of-three weekly objective belongs to the weekly scenario and is not silently reused.

**Information, saves and synchronization.** Own orders/cargo/queues/stocks are private. Current enemy figures and targeting require visibility; remembered terrain does not disclose current enemy activity. Observation snapshots cannot restore authority. `silmarillion-rts-1` checkpoints store fixed tick, paid queues, cargo, orders, profile/hero occupancy and deterministic continuation state. Legacy weekly saves remain untouched and are rejected with a mode/version explanation rather than guessed migration. RTS multiplayer is deliberately disabled: the weekly `Match` transport cannot synchronize this clock. The new sequenced command boundary and filtered observation contract have local regressions; authenticated host tick transport, reconnect, 2/3/4-player flows and independent-network certification remain separately unchecked roadmap work.

**Current slice boundaries.** Sight uses radial distance, with no forest or cliff occlusion. Farms add finite 500P sources; staffed lore workshops convert 1M into 2K every five seconds; a delivered 6M reload supplies three siege rounds. Ordinary units have no periodic upkeep in this slice. Captive occupancy is enforced on import and commands, but capture/rescue initiation and equipment/perk progression are not yet playable here; preserved hero metadata is not a progression implementation. The local AI gathers, builds, recruits, defends and raids with ordinary armies and siege; it does not produce or cast Saruman’s hero.

**Acceptance.** Complete gather → build → recruit → scout → fight → defend/besiege → win/lose through the actual runtime. Frame-rate measurements and browser handler acknowledgment are distinct from physical input latency. Tests and screenshots establish exercised implementation behavior; they do not establish competitive balance, full-roster conversion, physical-device coverage or remote multiplayer readiness. The runtime guide and validation evidence report the actual current results.
