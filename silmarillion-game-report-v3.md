# FACTIONS, PRODUCTION & HEROES

## The Powers and Peoples of Arda - revision 3

**Compact design update | 29 September 2026**

**Choose a faction, develop its distinctive production network, create its one hero, and combine the two to win.** Every faction has one fixed hero type and one active hero slot. When that hero dies, the slot becomes vacant until the same hero is recreated with resources and time.

| Family | Main strength | Main limitation |
|---|---|---|
| Valar and Melkor | Exceptional hero and domain magic | Small sanctuary, few production sites, small supporting army |
| Sauron | Command, binding, workshops and organized armies | Costly control network and dependence on functioning industry |
| Generic Istari orders | Specialized spells, enchanted items, constructs and support | Small armies and reliance on preparation |
| Elven clans | Elite companies, skilled craft and enchantment | Slow, expensive replacement |
| Three human kingdoms | Cities, logistics and large specialized armies | Heroes are more vulnerable; armies need supply |
| Dwarves and Orcs | Industry, engineering, equipment or economical mass production | Terrain, food and workshop dependencies |
| Creatures and guardians | Lairs, habitats and unusual movement or combat | Specialized infrastructure and narrow economic options |

**Human selection is exactly three kingdoms:** Gondor has the **Citadel Engineer**; Rohan the **Rider Marshal**; Númenor the **Ocean Warden**. Each kingdom has its own single hero, not three hero choices.

**Istari become five original orders:** Ember, Grove, Veil, Forge and Star. Select an order and generate the appearance/personality of its fixed hero type. Named Gandalf, Saruman and Radagast are removed from the standard selectable roster.

**Elves are selected by clan or house.** Eight distinct faction profiles replace the broad Elves button. Their production and hero differ even where they share ancestry.

**Visual direction remains:** huge isometric painted landscapes, tiny expressive figures, carefully made objects, intimate portraits and consequential dialogue inspired by Disco Elysium.

This shorter revision is the current gameplay specification. Its faction roster and hero rules supersede revision 2. The original book analysis remains available in the archived report. All recipes, production entities and repeatable hero returns are deliberate game inventions.

---

## 01 / What factions actually produce

Every faction has a basic economy and specialist recipes. Buying an allied product does not automatically teach its recipe.

| Stock | Gathered or generated through | Spent on |
|---|---|---|
| P - Provisions | Farms, herds, fisheries, hunting or habitat care | Recruiting, creature feeding, army upkeep and some heroes |
| M - Materials | Forest work, quarrying, mines, salvage and trade | Buildings, weapons, ships, tools and crafted bodies |
| K - Lore supplies | Scribes, research work, recovered records and study | Training, research, ritual preparation and magical craft |
| E - Essence | Rare map sites, discoveries and slow sanctuary rituals | Hero manifestation, summons, enchantments and major magic |

M recipes can require a timber, stone, metal, textile or crystal source. A source grants access and then produces the shared stock; required access must remain available when starting a recipe. This keeps four resource bars while making a metal-poor forest different from a mining realm. K represents prepared teaching and ritual work, not knowledge erased from memory when spent. All resource gains and costs are shown before commitment.

**Six production channels:** buildings expand capacity; training recruits ordinary units; kennels/nurseries/forges produce beasts or constructs; research unlocks magic; workshops craft equipment; a dedicated hero building creates the sole hero. Every playable recipe must define inputs, source access, facility, workers, duration, upkeep and population or binding cost. This report specifies the hero recipes and ordinary production identities; detailed unit/building prices remain a tuning task.

**One job per facility queue.** Pay the recipe upfront. An upgrade improves that queue or unlocks a recipe; extra buildings add ordinary production capacity within the faction's limits. Terrain and staff remain necessary. Destroying a production building loses unfinished work; voluntary cancellation returns half its stock cost. Completed units and items have individual identities, preventing cancellation or capture from duplicating outputs.

**Ordinary units need supply; summons need binding capacity.** Infantry use 1 supply, elite companies 2 and large creatures 3 as initial tuning values. Workers use housing capacity instead. Each summoned group also occupies a binding slot; starting capacity is 2, expanded only by specified structures. A summoned entity cannot be sacrificed for more resources than it cost.

**Magic has three forms:** research permanently unlocks hero techniques; workshops prepare consumable spell charges; major rituals consume resources and time at use. An ability states which form applies, so a researched technique is not accidentally charged as both a scroll and a ritual. Hero combat techniques also use personal readiness, initially 6, restored by a recovery commitment.

**No economy needs another faction to exist.** Basic exchange converts surplus P/M into K at a poor rate; a core ritual converts 20M + 10K into 10E over two turns. These slow fallback routes prevent loss of a rare node from permanently blocking hero recreation. Hero base recipes require generic stocks; source access applies to the component step. If that access is lost, the core can synthesize the faction component for **30M + 20K + 10E over three turns**, with no source prerequisite. It grants no production knowledge or source access for other recipes. Strong local sources and trade remain far more efficient.

---

## 02 / Create, lose and recreate the one hero

**The rule is one fixed hero type per faction and at most one living instance.** Before first creation, during production and after death there can be zero. Recruitment, capture, promotion, summoning and annexation never grant a second controllable hero. Ordinary captains and specialist units have limited abilities but no hero progression tree.

1. **Establish the hero building.** A sanctuary, hall, forge or lair contains the faction's single hero queue. Additional copies do not unlock additional hero queues.
2. **Collect the recipe and signature component.** Resources come from production, trade or exploration. Each faction makes its own component at its hero building for an additional 10M + 5K over one turn; its material or terrain access differs by faction.
3. **Create the hero.** Consume the component and pay the recipe below upfront. Production locks the slot, preventing simultaneous jobs. The hero appears only when training or manifestation completes.
4. **Develop the hero.** Three branching specializations develop the same role. Appearance and personality can vary at campaign setup; the underlying faction hero type stays fixed.
5. **Recreate after death.** Pay the full recipe, a new component and the full production time again. The same identity, level and chosen perks return. There is no free timer-based revival and no additional hero slot.

| Hero recipe code | Resource cost, excluding component | Production time |
|---|---|---|
| D - Divine: all Valar and Melkor | 120M + 100K + 120E | 4 turns |
| A - Maia/Istar, including Sauron and Balrog | 80M + 80K + 70E | 3 turns |
| E - Elven clan hero | 60P + 80M + 50K + 25E | 3 turns |
| C - Dwarf, Orc, Troll or Hobbit hero | 60P + 60M + 30K + 10E | 2 turns |
| B - Ent, Eagle, Wolf or Spider hero | 90P + 40M + 30K + 40E | 3 turns |
| G - Dragon hero | 120P + 80M + 40K + 80E | 4 turns |

Human kingdoms use their own recipes on page 9. These numbers are prototype hypotheses; tune starting stocks, income and map rewards for an attainable first hero rather than copying identical opening economies. Creature recipes represent playable recruitment, magical growth or reconstruction, not literal real-world maturation.

**Death has lasting cost:** travel time is lost, commitments fail, and carried equipment drops once at the death site. Recreating the hero does not copy those items. Recover them or craft replacements. Bound starter gear cannot be traded, salvaged or duplicated for profit. Capture of a corpse or equipment never blocks the basic return recipe. The faction keeps operating through its ordinary units.

A destroyed hero building can be rebuilt by a surviving worker. Losing all recovery footholds can end the faction, according to the scenario; losing the hero alone does not. A living captive still occupies the slot and needs rescue or an explicitly chosen surrender that ends the current incarnation, drops equipment once, and opens the ordinary paid recreation process.

---

## 03 / Gods, cities and mixed factions

**God factions win through the hero's presence and domain.** The fourteen Valar and Melkor receive a small sanctuary economy: one core plus four support plots, no new independent cities, two ordinary production jobs running at once and a starting supply ceiling of 12. Their exceptional hero uses no supply slot but still needs readiness and travel time. One utility plot can provide housing, stores or exchange; the other plots force meaningful production choices.

Aulë can create outstanding tools and defensive works, but his few queues cannot manufacture a whole industrial empire. Yavanna excels at habitat; she does not receive every civilian building. Melkor fields dangerous creatures while competing with them for essence and degrading exploited sites. Sauron is deliberately an industrial Maia faction: his hero is below the strongest Valar in raw power, while his city development is much stronger.

**Proposed starting supply ceilings:** divine factions 12; other Maiar and Istari 18; Elves and Dwarves 24; human kingdoms and Orcs 36; creature factions 18. Ordinary settlements can grow capacity through infrastructure and upkeep. Divine factions remain at 12: recruiting a larger retinue requires releasing or transferring another unit. These limits balance supporting armies, not intrinsic hero strength.

| Cooperation | What can transfer | What stays with its faction |
|---|---|---|
| Trade | Materials, provisions, ordinary items, trained mounts, spell charges | Unresearched recipes and unique hero identity |
| Auxiliary contract | Ordinary companies or constructs, within recipient supply/binding capacity | Hero slot and faction-wide passive bonuses |
| Joint project | Labor, materials and a named service | Ownership, maintenance duties and cancellation terms remain explicit |
| Coalition | Coordinated missions by independent factions | Each faction keeps its own hero, budget and objective |

A coalition can therefore contain several heroes, because several independent factions participate. One player-controlled faction still has only one. An allied hero follows agreed missions rather than joining the player's hero inventory. Annexing a settlement never transfers its hero queue; the former hero departs or the independent faction remains a vassal with its own agency. Divine annexation yields tribute or an allied enclave, not a loophole around the sanctuary cap.

**Counterplay:** threaten supplies, expose plans, contest essence, force the hero to travel or split objectives. Avoid equalizing a god and a mortal through identical damage statistics. Terrain and scenario objectives must give weaker factions alternatives to a direct duel.

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

## 05 / Valar and Melkor: life, memory and force

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
| Melkor | War Furnace; Deep Breeding Vault | Ravager / siege brute | Mar the land / black war crown |

**Components:** Nienna uses a mourning veil; Oromë a carved horn; Tulkas forged grip bands; Nessa a woven relay cord; Vána a flowering circlet; Estë a healing vessel; Vairë a woven memory; Melkor a black iron core. All are made through the common component recipe. A healer, courier or living grove can be decisive even when its faction produces little siege equipment.

---

## 06 / Sauron and five generic Istari orders

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

**Sole hero:** Sauron, recipe A, created at a Binding Forge with a forged binding core. **Buildings:** Binding Forge, Command Tower, foundries and tribute depots. **Production:** armored overseers, werewolves, siege equipment and lesser binding rings. **Hero capabilities:** borrowed disguise, terror and coordinated command. **Perk:** functioning client networks improve mobilization. **Weakness:** surveillance, armies and industry compete for resources; exposed dependency creates secession opportunities.

A lesser binding ring is an ordinary invented item. The One Ring remains a unique optional world project with one identity and disclosed consequences. The standard production mode's repeatable hero return does not use permanent Ring-destruction elimination. A separate historical scenario can make destroying the One decisive, with that exception shown before play. This prevents the standard hero rule from silently changing mid-match.

**Optional character flavor:** generated names, portraits, voices and histories make each Kindler or Wayseer memorable. Their mechanical identity comes from the order. A named Wizard can appear as a narrative reference in an authored scenario without creating a second controllable hero.

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

Nandorin and Avari factions can recruit animals through their specialist grounds. Elven armies chiefly train people and craft enchanted objects; they do not all need an invented monster-breeding roster. A Fëanorian player can obtain an allied beast or a construct without learning every foreign recipe. Melian's Girdle remains her faction's major enchantment, not a free racial ability for every Sindarin player.

---

## 08 / Exactly three human kingdoms

**Each kingdom has one unique hero type, recreated through its own recipe.** Every kingdom can build housing, farms, stores, roads, barracks and basic defenses. Their specialist production gives each a different reason to expand and trade. The hero building makes a signature component using the common 10M + 5K, one-turn rule.

| Kingdom | Sole hero, creation and component | Distinct production |
|---|---|---|
| Gondor | **Citadel Engineer**; Citadel Hall; stone command seal. **60P + 80M + 30K + 10E / 2 turns** | Fortified Supply Depots, Shield Companies, siege engines, repair kits and defensive standards |
| Rohan | **Rider Marshal**; Muster Hall; forged horse crest. **100P + 40M + 20K + 10E / 2 turns** | Horse-breeding Steads, Rider Companies, mounted scouts, remounts, saddles and rally horns |
| Númenor | **Ocean Warden**; Admiralty Hall; carved sea compass. **70P + 70M + 60K + 20E / 3 turns** | Deep-water Shipyards, Expedition Ships, marines, navigation tools, signal towers and sea wards |

### Gondor: hold and engineer

**Hero actions:** Field Repair restores a supplied defensive position; Ordered Withdrawal preserves an endangered company. **Perk:** prepared depots extend operational endurance. **Branches:** fortification, siege engineering or supply command. **Production weakness:** armies and walls consume metal and maintenance. **Counter:** bypass its strong points, contest roads and force dispersed defense.

### Rohan: concentrate and move

**Hero actions:** Muster Riders draws nearby companies together; Relief Charge interrupts a threatened approach. **Perk:** mounted forces reposition rapidly on suitable ground. **Branches:** scouting, shock action or relief logistics. **Production weakness:** horses require pasture, fodder and training; a stable does not create instant mature mounts without stock. **Counter:** defended chokepoints, broken terrain and attacks on fodder.

### Númenor: reach and sustain

**Hero actions:** Convoy Command organizes distant supply; Coastal Landing coordinates an embarked force. **Perk:** fleets can maintain more demanding routes. **Branches:** navigation, expedition command or maritime diplomacy. **Production weakness:** ships consume several material sources and are vulnerable away from harbors. **Counter:** blockade, damaged ports and commitments deep inland.

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
| Dragon Dominion / Hoard Sovereign / G | Crown Lair / furnace core | Brood Vault breeds Lesser Drakes; Ember Fissure creates Cinderlings; hoard stores protect treasure | Dread and breath / Hoard Brand |
| Troll Hold / Stonebreaker / C | Chieftain's Hall / iron-stone badge | Drill Yard trains Shield Trolls; Breach Workshop equips Siege Crews | Purchased protection / Stonehide Plate |
| Wolf Pack / Packwarden / B | Gathering Den / scent token | Scent Den raises Trackers; Pack Ground organizes Runners and hunting groups | Moon-marked pursuit / Moonfang Token |
| Spider Brood / Brood Matriarch / B | Royal Hollow / venom-silk spindle | Silk Nursery creates Weblayers; Brood Chamber raises Venom Stalkers | Concealed webs / Nightweb Snare |
| Balrog Host / Flame Tyrant / A | Black Crucible / dread-iron core | War Barracks trains Cinder Guards; Binding Pit creates Furnace Wights | Flame barriers / Searing Standard |

Every component uses the common component cost; source requirements follow its material or habitat. Biological production uses existing populations, recruitment or disclosed magical growth to fit the campaign timescale. Winged and grounded Dragons are different starting forms; a standard upgrade cannot instantly add wings.

**Hero roles:** Grove Elder anchors territorial defense; Skywarden intercepts and extracts; Hoard Sovereign exerts extreme local force; Stonebreaker breaches; Packwarden coordinates pursuit; Brood Matriarch prepares ambush terrain; Flame Tyrant breaks defended positions. Each has three specialization branches within that role.

**Counters:** burn or divide a grove, threaten an eyrie, raid an abandoned hoard, deny Troll supplies, deplete hunting territory, clear web routes or disperse before a Balrog assault. Give opponents warning, approach choices and ways to contest the objective rather than requiring every faction to win a frontal fight.

A hoard item strengthens a territory or is carried appropriately; creatures do not equip humanoid swords and boots by default. Lair upgrades, protective harnesses, caches, traps and ritual sites occupy the same design space as equipment and buildings elsewhere.

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

**A three-faction coalition:** Rohan supplies cavalry and food; a Fëanorian clan supplies enchanted equipment; an Ember order prepares courage wards and support spirits. Each faction retains its own single hero. A joint army can contain ordinary units from all three, but recruiting their companies does not transfer their heroes or research trees.

**Rohan's opening:** build a Horse-breeding Stead, secure fodder and train workers. At the Muster Hall, spend 10M + 5K and one turn to make a horse crest. Then spend 100P + 40M + 20K + 10E and two turns to create the Rider Marshal. The full first-hero chain therefore costs **100P + 50M + 25K + 10E over three sequential production turns**, excluding the Hall's construction. Gathering and other queues can operate concurrently.

If the Marshal dies, Rohan keeps its farms, army and production. Recover the fallen hero's equipment or replace it. Recreate the horse crest and pay the same complete chain again. The Marshal returns with the same development, while the lost time and expenditure create a real opening for opponents. Another kingdom's hero cannot fill the empty slot.

**First prototype:** Gondor, Rohan, one Elven house, one generic Istar order, one Orc clan and one Vala. Test whether economic factions can exploit the god's limited coverage, whether crafted heroes feel worth saving, and whether returning after death preserves tension. Test Númenor next on a coastal map, before accepting the complete three-kingdom roster.

**Required checks:** one living/pending hero per faction; exactly three human kingdom entries; one fixed hero type for every entry; no inventory duplication after death; no annexation bypass of hero or divine city limits; viable recreation after losing a contested resource site; useful production without the hero present; and meaningful visual readability at the default distant camera.

This specification contains **51 faction profiles:** 15 divine, Sauron, five Istari orders, eight Elven profiles, three human kingdoms, three Dwarven traditions, Orcs, seven creature/community factions, Balrog and seven other Maiar. Some are optional roster packs, but every listed faction follows the same single-hero contract. This is a design scope, not a promise to ship them simultaneously.

**Evidence and revision boundary:** the supplied 461-page Silmarillion was read for the earlier source report. Its domains, peoples and conflicts inform these faction identities. Production recipes, generic orders, constructs, city caps and repeatable resurrection deliberately adapt that material for play. Revision 2's permanent-death restrictions, named-Wizard menu, broad human roster and ongoing-build order cost are superseded. The previous report and PDF are preserved as versioned files in the project root.

The full reading notes remain beside this document. No game implementation or balance simulation has been completed. The next milestone is a small playable economic and hero loop, with the same huge-map, tiny-character visual direction.
