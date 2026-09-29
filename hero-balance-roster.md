# Hero powers and faction balance - revision 6

**55 starting profiles across 54 factions.** Each entry has two defining powers, one passive, the shortcoming it helps and the weakness it retains. These are proposed starting kits, not evidence of achieved balance. Full progression trees and detailed combat statistics are later tuning work.

**Ten Istari choices:** Gandalf, Saruman, Radagast and the two Blue Wizards are five named factions alongside the five generic orders. Each has one fixed hero and one active/pending hero slot. Named identities are unique within a campaign; a generic order cannot recruit one as an extra hero. The two Blue Wizards are separate choices, with invented gameplay roles. All named Wizards use recipe A plus their faction component and the ordinary paid recreation rule. These new kits have offensive signatures; revision 5's other fifty profiles remain unchanged pending a separate combat redesign. New attack-equivalent figures are provisional tuning measures, not a complete combat-stat system.

**Shared rules:** local powers require the hero's field-encounter commitment; regional support uses the weekly hero commitment instead of travel, combat or recovery. Normal readiness is 6 and recovery restores 3; Worldbreaker uses 12/6. A second large spell is not a second strategic assignment. Some named field powers, such as Iron Edict, explicitly operate at regional scale and consume that assignment.

Paid jobs still need their resources, people, queues and source access. Production acceleration cannot complete a job in the turn it starts. Identical effects do not stack: use the strongest. Hard disables give the target two tactical phases of protection from another disable after ending. No power deletes a healthy hero/capital, produces extra hero slots or bypasses the exclusive Melkor allegiance of Dragons/Balrogs. Allied movement, rally and transport powers cannot issue or revise their orders; only Melkor does. Physical harm and obstruction remain valid counters.

**Ordinary interface information stays universal.** Known costs, prerequisites, inventory, repair needs and observed report times are visible to everyone. Intelligence perks reveal additional world evidence or preserve information; they never require hiding basic controls or known facts from other factions.

**Reading order:** Valar; Elven clans, kingdoms and other peoples; named Istari; generic Istari, other Maiar and guardians; Melkor's two doctrines. Faction production and hero recipes remain in `silmarillion-game-report.md`. The machine-readable companion is `hero-balance-roster.json`.

## Valar

### Manwë

**Faction:** Manwë's highlands

**Helps with:** Sparse messenger and convoy-coordination infrastructure.

**Remaining weakness:** Cannot replace roads, cargo capacity, food production or multiple relay networks.

**Field power - Skyhand:** Push one exposed formation a short distance; cannot push it across lethal edges or into impassable terrain.

- **Cost:** 2 readiness
- **Reach / duration:** Visible local encounter; one formation; One pulse after a visible wind-up
- **Counter:** Brace behind anchored cover, interrupt the wind-up, or spread formations.

**Support power - Heralds on the Wind:** Relay one convoy's warning and revised route without a staffed relay building; movement, escorts and cargo remain ordinary.

- **Cost:** 3 readiness + one weekly hero commitment; existing convoy crew and supplies
- **Reach / duration:** One connected region; one existing convoy; One week
- **Counter:** Break the route, conceal an ambush, or force competing emergencies.

**Passive - Clear Signals:** Nearby allied formations recover coordination after receiving verified orders. **Limit:** Once per formation per encounter; no extra actions or immunity to fear.

### Varda

**Faction:** Varda's beacon settlements

**Helps with:** Limited observation-post coverage.

**Remaining weakness:** Observation yields neither production capacity nor automatic knowledge of underground activity.

**Field power - Unclouded Flash:** Expose concealed silhouettes in one illuminated patch; does not reveal intentions, inventories or enemies behind solid walls.

- **Cost:** 2 readiness
- **Reach / duration:** One visible local patch; Three tactical phases
- **Counter:** Use solid cover, smoke, tunnels or movement beyond the lit patch.

**Support power - Starwatch Circuit:** Provide intermittent reports of exposed movement along one surveyed route without constructing its watchtowers.

- **Cost:** 3 readiness + one weekly hero commitment; maintained survey records
- **Reach / duration:** One connected region; one route; One week
- **Counter:** Travel under cover, sever the route, or send decoys; reports remain dated observations.

**Passive - Steady Bearing:** Nearby travelers resist one navigation delay on already surveyed ground. **Limit:** Once per journey; cannot bypass terrain, danger or supply costs.

### Ulmo

**Faction:** Ulmo's waterside enclaves

**Helps with:** Insufficient ferry and crossing infrastructure.

**Remaining weakness:** Dry divides, imported construction materials and limited transport crews still restrict expansion.

**Field power - Surging Passage:** Redirect existing shallow water to disrupt one formation's footing or open a brief withdrawal lane.

- **Cost:** 2 readiness
- **Reach / duration:** One visible crossing in the local encounter; Two tactical phases
- **Counter:** Take higher ground, brace, delay the crossing or interrupt Ulmo.

**Support power - Current-Borne Crossing:** Carry one normally loaded convoy across one surveyed water obstacle without a permanent ferry; no additional movement or cargo.

- **Cost:** 3 readiness + one weekly hero commitment; crew and normal convoy supplies
- **Reach / duration:** One connected region; one crossing; One convoy passage during the week
- **Counter:** Contest either landing, obstruct access or force an alternative crossing.

**Passive - Reading the Flow:** Inspection reveals the current crossing's flow and immediate navigational hazards. **Limit:** Existing nearby water only; no enemy-location or future-weather guarantee.

### Aulë

**Faction:** Aulë's workshops

**Helps with:** Low repair-workshop throughput.

**Remaining weakness:** One excellent commission cannot replace food imports, extraction or a broad factory network.

**Field power - Break the Brace:** Heavily damage one exposed cover piece or siege brace; never instantly destroy a hero or a complete fortified settlement.

- **Cost:** 2 readiness
- **Reach / duration:** Adjacent object in the local encounter; One strike after a visible wind-up
- **Counter:** Screen the structure, interrupt the approach or build layered defenses.

**Support power - Master's Repair:** Perform one normal repair job without its specialist workshop; the original repair recipe and crew requirements still apply.

- **Cost:** 3 readiness + one weekly hero commitment + the repair's full tagged M cost
- **Reach / duration:** One worksite in one connected region; One repair job during the week
- **Counter:** Disrupt material delivery, attack the worksite or spread damage across several sites.

**Passive - Sound Workmanship:** At one personally inspected owned worksite, reduce the first routine wear event by one severity step. **Limit:** One worksite per week; no reduction of combat damage, free repairs, material refunds or stacking.

### Yavanna

**Faction:** Yavanna's living groves

**Helps with:** Limited fortification-building capacity.

**Remaining weakness:** Needs mature habitat and water; cannot instantly rebuild forests or support extensive metal industry.

**Field power - Root's Grasp:** Existing roots slow one formation crossing a marked patch; affected units can still fight or cut themselves free.

- **Cost:** 2 readiness
- **Reach / duration:** One rooted patch in the local encounter; Three tactical phases
- **Counter:** Cut or burn the roots, interrupt the casting or take another approach.

**Support power - Living Buttress:** Turn existing mature vegetation into one temporary defensive barrier protecting a worksite; cannot harvest it for new M.

- **Cost:** 3 readiness + one weekly hero commitment; suitable living vegetation
- **Reach / duration:** One site in one connected region; One week or until destroyed
- **Counter:** Use fire, cutting tools, siege attacks or an approach outside the barrier.

**Passive - Tread Lightly:** Nearby allied travel causes less routine habitat damage. **Limit:** Does not cancel harvesting, fire, construction damage or enemy destruction.

### Námo / Mandos

**Faction:** Mandos's sanctuary halls

**Helps with:** Thin local guard coverage around vulnerable workplaces.

**Remaining weakness:** Cannot replace standing guards, broad food production or permanent defenses; grants no resurrection.

**Field power - Declared Threshold:** Mark one narrow threshold; the first hostile formation crossing it loses momentum and becomes briefly slowed.

- **Cost:** 2 readiness
- **Reach / duration:** One visible threshold in the local encounter; Three beats; triggers once
- **Counter:** Go around, trigger it with a small detachment or interrupt the declaration.

**Support power - Ward of Waiting:** Warn one staffed worksite of a direct approach and enable one organized evacuation; production stops when workers leave.

- **Cost:** 3 readiness + one weekly hero commitment; existing workers and evacuation route
- **Reach / duration:** One worksite in one connected region; One week; one evacuation
- **Counter:** Block the exit, use concealed infiltration or threaten several worksites.

**Passive - Shelter of the Threshold:** The first ordinary allied company withdrawing through an active Declared Threshold loses one fewer cohesion step. **Limit:** Once per encounter; excludes Dragons and Balrogs. Does not prevent pursuit, damage or enemy passage.

### Irmo / Lórien

**Faction:** Lórien's dream gardens

**Helps with:** Limited military training facilities.

**Remaining weakness:** Cannot manufacture equipment, train extra companies or substitute dreams for supplied troops.

**Field power - Drowsing Veil:** Disorient one formation in a small patch, reducing reaction speed without removing its ability to act.

- **Cost:** 2 readiness
- **Reach / duration:** One visible patch in the local encounter; Two tactical phases
- **Counter:** Raise an alarm, move out, interrupt the caster or have an ally rally the formation.

**Support power - Rehearsal in Dream:** Prepare one existing company for one chosen contingency, reducing its first coordination penalty when that contingency occurs.

- **Cost:** 3 readiness + one weekly hero commitment; company's rest assignment and normal P upkeep
- **Reach / duration:** One resting company in one connected region; Next encounter within one week; triggers once
- **Counter:** Interrupt rest, scout the preparation or force a different tactical situation.

**Passive - Lucid Adaptation:** After a fresh verified scouting report, replace one company's prepared dream contingency without repeating its rest assignment. **Limit:** Once per weekly preparation; replaces rather than adds a contingency. Its original expiry and single-use limit remain.

### Nienna

**Faction:** Nienna's refuge cloisters

**Helps with:** Limited institutions for restoring cooperation after local losses.

**Remaining weakness:** Care and restitution consume real capacity; grief generates no resources or permanent morale immunity.

**Field power - Hold Fast:** Reduce one nearby allied formation's current panic by one step, allowing it to regroup or retreat.

- **Cost:** 2 readiness
- **Reach / duration:** One nearby allied formation in the local encounter; Immediate recovery; later pressure applies normally
- **Counter:** Renew pressure, isolate the formation or interrupt Nienna before completion.

**Support power - Council of Repair:** Resolve one recorded local grievance between willing parties after its negotiated restitution is actually delivered.

- **Cost:** 3 readiness + one weekly hero commitment + agreed existing stocks or service
- **Reach / duration:** Two participating groups in one connected region; One settlement during the week; new grievances remain possible
- **Counter:** Disrupt delivery, expose unfulfilled terms or continue the underlying injury.

**Passive - Leave None Uncounted:** Keep known separated survivors visible in recovery planning after a nearby retreat. **Limit:** Does not locate unknown survivors, revive deaths or recover anyone automatically.

### Oromë

**Faction:** Oromë's frontier lodges

**Helps with:** Insufficient patrol-barracks coverage of wilderness routes.

**Remaining weakness:** One hunter cannot guard every route, sustain a siege or replace local production.

**Field power - Hunter's Interception:** Charge along an open approach to disrupt one attacking formation and briefly check its advance.

- **Cost:** 2 readiness
- **Reach / duration:** One formation reached by a clear local charge lane; One impact; brief stagger
- **Counter:** Brace, deploy stakes, block the lane or bait the charge into supporting fire.

**Support power - Keep the Wild Road:** Personally patrol one marked route, producing warning reports and deterring minor harassment without a new barracks.

- **Cost:** 3 readiness + one weekly hero commitment; normal travel supplies
- **Reach / duration:** One route in one connected region; One week
- **Counter:** Avoid the patrol, set an ambush or concentrate a force requiring an actual battle.

**Passive - Persistent Trail:** Retain pursuit clues longer after personally observing a quarry's passage. **Limit:** Known tracks only; weather, concealment and deliberate false trails still interfere.

### Tulkas

**Faction:** Tulkas's muster grounds

**Helps with:** Weak heavy-construction equipment and lifting capacity.

**Remaining weakness:** Physical strength supplies neither materials nor advanced industry; dispersed threats still outnumber his interventions.

**Field power - Unyielding Grapple:** Briefly restrain one adjacent opponent while Tulkas remains occupied; causes no automatic kill.

- **Cost:** 2 readiness; Tulkas cannot perform another action while maintaining it
- **Reach / duration:** One adjacent opponent in the local encounter; Up to two beats; same opponent once per encounter
- **Counter:** Dodge the telegraphed approach, interrupt Tulkas or use allied attacks to break the hold.

**Support power - Shoulder the Burden:** Replace a crane or lifting crew for one construction phase; all other labor, materials and building prerequisites remain.

- **Cost:** 3 readiness + one weekly hero commitment + the phase's full tagged M cost
- **Reach / duration:** One worksite in one connected region; One construction phase during the week
- **Counter:** Cut material delivery, attack the exposed site or force Tulkas to leave.

**Passive - Stand Beside Me:** Nearby allies suffer a smaller first fear-induced coordination loss. **Limit:** Once per encounter; does not prevent retreat, injury or later panic.

### Nessa

**Faction:** Nessa's relay settlements

**Helps with:** Limited evacuation and civilian-transfer infrastructure.

**Remaining weakness:** Speed cannot replace freight capacity, stocked refuges, fortified roads or manufacturing.

**Field power - Impossible Step:** Lead one nearby ordinary allied formation through a short, rapid reposition along a visible traversable path; excludes all Dragons and Balrogs.

- **Cost:** 2 readiness
- **Reach / duration:** One nearby formation; short local path; One movement action
- **Counter:** Block the path, prepare interceptors or burden the formation with cargo it cannot carry quickly.

**Support power - Gather the Stragglers:** Organize one existing civilian group's transfer without a dedicated relay stable; actual destination consent and carrying limits apply.

- **Cost:** 3 readiness + one weekly hero commitment + normal P travel rations
- **Reach / duration:** One known route in one connected region; One transfer during the week
- **Counter:** Contest chokepoints, sever the route or force incompatible rescue priorities.

**Passive - Shared Pace:** Groups personally accompanied by Nessa are less likely to separate on difficult ground. **Limit:** Does not increase cargo, ignore barriers or protect against combat casualties.

### Vána

**Faction:** Vána's bloom nurseries

**Helps with:** Limited nursery capacity and vulnerable agricultural timing.

**Remaining weakness:** Needs real fields, water and workers; cannot multiply harvests or accelerate mature forests.

**Field power - Bloomscreen:** Existing shrubs flower densely enough to obscure one small patch and help a party change position.

- **Cost:** 2 readiness
- **Reach / duration:** One vegetated patch in the local encounter; Three tactical phases
- **Counter:** Use fire, cutting tools, elevated observation or another approach.

**Support power - Season Brought Forward:** Advance one already planted plot by one growth stage; its predetermined harvest amount and remaining upkeep stay unchanged.

- **Cost:** 3 readiness + one weekly hero commitment; planted seed inputs, irrigation and tending labor
- **Reach / duration:** One plot in one connected region; One growth-stage advance; once per crop cycle
- **Counter:** Damage irrigation, raid the field or interrupt tending; failed crops yield nothing.

**Passive - Signs of Renewal:** Inspection identifies viable plants and whether a cultivated plot can recover. **Limit:** Knowledge of condition only; creates no seeds, provisions or automatic recovery.

### Estë

**Faction:** Estë's healing refuges

**Helps with:** Limited hospital beds and medical-workshop access.

**Remaining weakness:** One party's recovery cannot absorb mass casualties; death and missing supply infrastructure remain consequential.

**Field power - Still the Wound:** Stabilize one living wounded target against immediate deterioration; it remains impaired and cannot instantly resume full combat.

- **Cost:** 2 readiness; uninterrupted treatment
- **Reach / duration:** One adjacent living target in the local encounter; Until encounter end or renewed injury
- **Counter:** Interrupt treatment, separate healer and patient or inflict a new wound.

**Support power - Rest Without Walls:** Treat one resting party as if a basic recovery facility were available, reducing one recoverable injury tier under normal care rules.

- **Cost:** 3 readiness + one weekly hero commitment + normal P care supplies and any required medical M
- **Reach / duration:** One sheltered party in one connected region; One week; one treatment result
- **Counter:** Interrupt rest, cut supplies or force the party to move.

**Passive - Care on the Road:** One personally treated ordinary party preserves accumulated recovery progress through its first routine evacuation journey. **Limit:** One party per week; normal travel costs and fatigue apply. New injury still disrupts care; no extra healing, readiness or resurrection.

### Vairë

**Faction:** Vairë's archive halls

**Helps with:** Fragile access to specialist production records after a workshop is lost.

**Remaining weakness:** Records cannot replace extraction, labor, surviving machinery or the rebuilding of an industrial network.

**Field power - Read the Broken Pattern:** Reconstruct one recent movement through inspected traces, producing a dated track rather than a live target marker.

- **Cost:** 2 readiness; stationary inspection
- **Reach / duration:** One accessible trace site in the local encounter; One report; becomes stale as units move
- **Counter:** Erase or overlay traces, leave decoys or attack during inspection.

**Support power - The Remembered Workshop:** Let one basic workshop complete one previously unlocked faction item from a preserved plan despite losing its specialist archive.

- **Cost:** 3 readiness + one weekly hero commitment + the item's full recipe and normal crew/time
- **Reach / duration:** One workshop in one connected region; One week; unfinished work requires renewed commitment
- **Counter:** Destroy the preserved plan, interrupt the workshop or deny recipe inputs.

**Passive - Portable Chronicle:** Carry a recoverable copy of one owned production plan or witnessed agreement. **Limit:** No foreign recipes, hero recipes, unit commands, equipment copies or free K.

## Peoples and communities

### Concord Singer

**Faction:** Vanyar

**Helps with:** Expensive elite formations cannot replace losses quickly.

**Remaining weakness:** Slow replacement, expensive equipment and limited army size remain.

**Field power - Harmonic Cover:** One own infantry company takes 25% less damage while holding formation; damage is never negated.

- **Cost:** 2 readiness
- **Reach / duration:** Local encounter; within the hero's audible radius; One tactical phase
- **Counter:** Flank the company, separate it from the singer, or interrupt the hero.

**Support power - Shared Rehearsal:** Advance one already-paid infantry training job that was started in an earlier turn by one weekly progress step; retain its queue and workers. A job started this turn is ineligible, so this power cannot start and finish a job in the same turn.

- **Cost:** 3 readiness + one weekly hero commitment + 5K
- **Reach / duration:** One connected region containing the hero and training facility; One weekly resolution; one job
- **Counter:** Disrupt supplies, close the route, or attack the training facility.

**Passive - Keep the Standard:** One nearby own infantry company ignores its first formation-cohesion penalty from an allied retreat. **Limit:** Once per encounter; casualties and other morale penalties still apply.

### Jewelwright

**Faction:** House of Fëanor

**Helps with:** Rare-input masterworks are costly to replace and their specialists are vulnerable.

**Remaining weakness:** Rare materials, occupied queues and specialist training still limit throughput.

**Field power - Prismatic Flare:** A visible cone of radiance reduces ranged accuracy through it by 25%, including friendly fire.

- **Cost:** 2 readiness
- **Reach / duration:** Local encounter; short cone from the hero; One tactical phase
- **Counter:** Change firing angle, wait out the flare, or close to melee.

**Support power - Rework the Setting:** Restore up to 25% durability to one existing crafted item; cannot copy it, recover spent charges, or produce salvage.

- **Cost:** 3 readiness + one weekly hero commitment + 10M + 5K; compatible material access, staffed workshop and its repair queue required
- **Reach / duration:** One connected region; hero, workshop and item must be present; One week; repair capped at maximum durability
- **Counter:** Contest the workshop, interrupt material delivery, or capture the item.

**Passive - Careful Setting:** One own crafted item carried with the hero loses 25% less durability on its first ordinary wear event each week. **Limit:** One item and one event per week; does not restore durability, spent charges or salvage value.

### Shield Marshal

**Faction:** House of Fingolfin

**Helps with:** Costly defenders must survive while defending dispersed approaches.

**Remaining weakness:** Few expensive formations cannot cover every pass or replace severe losses quickly.

**Field power - Shielded Withdrawal:** One own infantry company withdraws toward a chosen clear exit with 25% less pursuit damage; it still travels through the encounter.

- **Cost:** 2 readiness
- **Reach / duration:** Local encounter; company within command radius; One withdrawal phase
- **Counter:** Block the exit, attack from another direction, or pursue with fresh troops.

**Support power - Watch Rotation:** Two existing own garrisons exchange posts using an open road; their existing patrol coverage remains coordinated during transit. No new garrison or extra order is created.

- **Cost:** 3 readiness + one weekly hero commitment; normal movement orders and travel provisions required
- **Reach / duration:** Two posts in one connected region; One week
- **Counter:** Cut the road, attack a moving garrison, or threaten a third approach.

**Passive - Measured Rearguard:** One own formation near the hero recovers its facing immediately after an orderly withdrawal. **Limit:** Once per encounter; no free movement, healing or attack.

### Lore Envoy

**Faction:** House of Finarfin

**Helps with:** Specialist recovery and cooperation require facilities, time and consent.

**Remaining weakness:** Recovery is finite, training remains slow, and allies may refuse.

**Field power - Song of Steadiness:** One own infantry company suppresses one fear penalty; existing casualties and movement restrictions remain.

- **Cost:** 2 readiness
- **Reach / duration:** Local encounter; within audible radius; Two tactical phases
- **Counter:** Separate the singers, interrupt the hero, or apply pressure from multiple directions.

**Support power - Restorative Assembly:** One own company at a staffed refuge removes one noncritical wound condition one week sooner, never faster than one full week. Dead members do not return.

- **Cost:** 3 readiness + one weekly hero commitment + 5P + 5K; occupied recovery queue and normal upkeep required
- **Reach / duration:** One connected region containing hero, refuge and company; One week
- **Counter:** Threaten the refuge or interrupt its food and medicine route.

**Passive - Hospitality:** One own company completing a normal paid rest assignment at the hero's staffed refuge removes one additional fatigue point. **Limit:** Once per week; minimum zero fatigue. Normal rest time, queue and provisions remain; wounds and casualties are unchanged.

### Tide Captain

**Faction:** Falmari

**Helps with:** Valuable ships and transported specialists are exposed during coastal movement.

**Remaining weakness:** Harbor dependence, limited inland influence and expensive hull replacement remain.

**Field power - Sheltered Disembarkation:** One own transport unloads at a viable nearby landing with 25% less ranged damage during unloading; passengers are not immune.

- **Cost:** 2 readiness
- **Reach / duration:** Local coastal encounter; hero aboard or at the landing; One unloading phase
- **Counter:** Occupy the beach, use flanking fire, or force the ship toward an unsuitable landing.

**Support power - Beacon Passage:** One existing convoy on an observed coastal route ignores a single ordinary fog-navigation delay; ships still sail the full route.

- **Cost:** 3 readiness + one weekly hero commitment + 5M for beacon fuel; existing staffed beacons, convoy order and provisions required
- **Reach / duration:** One connected coastal region; One week; one convoy
- **Counter:** Extinguish a beacon, blockade the route, or intercept the convoy.

**Passive - Familiar Rigging:** One own convoy accompanied by the hero ignores one ordinary handling-delay modifier on its first loading or unloading action each week. **Limit:** One action per week; base handling time, cargo capacity, workers and material costs remain.

### March Warden

**Faction:** Sindar

**Helps with:** Hidden woodland defenses lose value once routes and companies are exposed.

**Remaining weakness:** Fire, lost woodland and sustained open combat still defeat concealment advantages.

**Field power - Veil the Retreat:** One own woodland company moving between existing cover is harder to target at range; ranged accuracy against it falls 25%.

- **Cost:** 2 readiness
- **Reach / duration:** Local encounter; linked cover near the hero; One movement phase
- **Counter:** Enter the cover, illuminate the route, or attack its exposed destination.

**Support power - Reweave the Watch:** Relocate one existing watch-post's concealment and observation equipment to a surveyed nearby site; the old post loses those functions.

- **Cost:** 3 readiness + one weekly hero commitment + 5M; one worker project order and normal provisions required
- **Reach / duration:** One connected woodland region; One week; only the completed new site remains active
- **Counter:** Track workers, patrol both sites, or remove surrounding cover.

**Passive - Border Memory:** Detect a fresh crossing disturbance on a route the hero personally revisits. **Limit:** One route per week; reveals neither identity nor exact troop count.

### Woodland Pathfinder

**Faction:** Nandor

**Helps with:** Dispersed production and light companies depend on fragile woodland connections.

**Remaining weakness:** Weak armor, poor open-field performance and dependence on living woodland remain.

**Field power - Rootwise Escape:** One own light infantry company ignores one ordinary woodland movement penalty while using an already passable route.

- **Cost:** 2 readiness
- **Reach / duration:** Local encounter; company near the hero; One movement phase
- **Counter:** Guard the exit, cut the route, or intercept on open ground.

**Support power - Open the Old Trail:** Restore one obstructed existing woodland trail for light convoys; cannot create a route through cliffs or unbridged rivers.

- **Cost:** 3 readiness + one weekly hero commitment + 5M for tools; one worker project order and normal provisions required
- **Reach / duration:** One connected woodland region surveyed by the hero; One week to complete; trail persists and can be blocked again
- **Counter:** Patrol the trail, damage its waystations, or fell cover at a chokepoint.

**Passive - Light Footprint:** The hero's accompanying light company leaves tracks that remain identifiable for one phase less. **Limit:** Minimum one detectable phase; no effect on wagons, heavy formations or visible movement.

### Frontier Mediator

**Faction:** Avari clan

**Helps with:** Mobile workshops and decentralized settlements lack concentrated protection.

**Remaining weakness:** Small workshops, limited armor and distance between settlements still constrain output.

**Field power - Rendezvous Signal:** Two own light companies near the hero synchronize their next retreat or advance without a coordination penalty; each spends its normal movement.

- **Cost:** 2 readiness
- **Reach / duration:** Local encounter; both companies within signal radius; One movement phase
- **Counter:** Block one route, separate the companies, or attack the signal position.

**Support power - Traveling Compact:** Move one existing portable workshop and its staff between consenting own settlements without losing its stored work progress. It produces nothing while moving.

- **Cost:** 3 readiness + one weekly hero commitment + 5P; normal transport order, carrying capacity and open route required
- **Reach / duration:** One connected region; One week; travel must fit the normal route time
- **Counter:** Intercept the workshop or deny its destination and passage.

**Passive - Travel Rigs:** One own portable workshop moving with the hero suffers 25% less durability loss from its first rough-road wear event each week. **Limit:** One relocation event per week; combat damage, transport costs and destination setup requirements remain.

### Citadel Engineer

**Faction:** Gondor

**Helps with:** Walls, armies and depots consume substantial metal and maintenance.

**Remaining weakness:** High material demand and weak coverage away from prepared positions remain.

**Field power - Brace the Breach:** Restore up to 15% structural durability to one damaged gate or barricade using an engineer company; cannot rebuild a destroyed structure.

- **Cost:** 2 readiness + 5M from a carried compatible repair kit; consumes the engineers' action
- **Reach / duration:** Local encounter; hero and engineers adjacent to the structure; One action; repair cannot exceed maximum durability
- **Counter:** Attack the repair crew, interrupt access, or bypass the structure.

**Support power - Supply Refit:** Repair up to 25% durability on one existing fortification or siege machine at a supplied depot; no ammunition or new unit is created.

- **Cost:** 3 readiness + one weekly hero commitment + 10M; matching material access, workers and one repair queue required
- **Reach / duration:** One connected region containing the hero, depot and target; One week; capped at maximum durability
- **Counter:** Raid the depot, cut its supply road, or attack the repair site.

**Passive - Stable Bracing:** One staffed own defensive structure beside the hero suffers 25% less durability loss from its first ordinary weather or maintenance-wear event each week. **Limit:** One structure and one event per week; upkeep is paid normally. Combat damage and existing repair needs are unchanged.

### Rider Marshal

**Faction:** Rohan

**Helps with:** Costly trained horses need fodder and lose effectiveness in broken terrain.

**Remaining weakness:** Mount production, fodder demand and poor charge terrain remain hard constraints.

**Field power - Relief Charge:** One own mounted company suppresses an exposed enemy infantry company's pursuit for one phase after a successful normal charge; casualties still resolve.

- **Cost:** 2 readiness; cavalry spends its normal charge action
- **Reach / duration:** Local encounter; viable charge lane within command radius; One tactical phase
- **Counter:** Brace spears, occupy broken ground, or block the charge lane.

**Support power - Remount Circuit:** Exchange tired mounts in one own rider company for an equal number of existing rested remounts at connected stables. Tired mounts remain and need normal recovery.

- **Cost:** 3 readiness + one weekly hero commitment + 5P for handlers and fodder; remount stock and normal transfer order required
- **Reach / duration:** One connected region; One week; no net new horses
- **Counter:** Raid the stables, intercept the transfer, or disrupt fodder supply.

**Passive - Careful Pacing:** One own rider company traveling with the hero gains one less fatigue point on its first ordinary travel leg each week. **Limit:** Minimum zero fatigue gain; no reduction in distance, travel time, fodder or combat fatigue.

### Ocean Warden

**Faction:** Númenor

**Helps with:** Expensive fleets depend on harbors and vulnerable sea supply.

**Remaining weakness:** Complex ship recipes, harbor loss and deep inland commitments remain costly.

**Field power - Coastal Landing:** One own marine company disembarks in organized formation rather than suffering the normal unloading cohesion penalty; it still uses a viable landing and normal movement.

- **Cost:** 2 readiness
- **Reach / duration:** Local coastal encounter; hero with the transport or landing force; One disembarkation phase
- **Counter:** Fortify the landing, contest nearby water, or strike the transport before unloading.

**Support power - Convoy Command:** Reassign existing escorts and cargo across up to three own ships without an organization delay; total cargo, escort strength and ship capacity do not increase.

- **Cost:** 3 readiness + one weekly hero commitment + 5P for handling crews; normal voyage order and ship upkeep required
- **Reach / duration:** One connected coastal region with an accessible rendezvous harbor; One week; actual loading and sailing time still applies
- **Counter:** Blockade the harbor, intercept the rendezvous, or force the convoy to split.

**Passive - Fixed Lashings:** One own convoy carrying the hero loses 25% less existing cargo to its first minor storm-loss event each week. **Limit:** One convoy and one event per week; creates no cargo, changes no capacity and does not protect against combat or catastrophic wrecking.

### Deep Surveyor

**Faction:** Khazad-dûm

**Helps with:** Underground production relies on narrow entrances, ventilation and food imports.

**Remaining weakness:** Food imports, bottlenecks and the expense of genuinely new excavation remain.

**Field power - Read the Fault:** Mark one observed unstable surface; an ordinary engineer attack against that obstacle gains 25% breach effectiveness. Occupied ground is not collapsed automatically.

- **Cost:** 2 readiness; engineer spends its normal action and tools
- **Reach / duration:** Local encounter; visible stone obstacle within short survey range; One tactical phase
- **Counter:** Guard the obstacle, move away, or attack the surveying hero.

**Support power - Restore the Airway:** Repair one existing blocked ventilation shaft or supply passage; restores its original capacity, never creates a new tunnel.

- **Cost:** 3 readiness + one weekly hero commitment + 10M for supports and tools; worker project order and safe access required
- **Reach / duration:** One connected underground region; One week
- **Counter:** Contest shaft access, block the worksite, or raid its supplies.

**Passive - Pressure Sense:** Warns of a worsening airflow problem in the hero's occupied tunnel section before its next ordinary production penalty. **Limit:** One local warning per week; does not prevent the failure or detect enemy plans.

### Armor Master

**Faction:** Belegost

**Helps with:** Slow, metal-intensive companies are vulnerable when their protection mismatches the threat.

**Remaining weakness:** Heavy equipment, slow queues and the need to choose the right protection remain.

**Field power - Fit the Guard:** One own armored infantry company takes 25% less damage from one selected ordinary hazard type after fitting a carried protection kit.

- **Cost:** 2 readiness + one existing protection kit; company spends its equipment action
- **Reach / duration:** Local encounter; company beside the hero; Two tactical phases; only one fitted type at a time
- **Counter:** Switch damage type, flank the company, or wait out the temporary fitting.

**Support power - Temper for the Threat:** Refit one existing company's armor for one declared hazard; improves that resistance by 20% while increasing equipment burden. Replaces its previous special fitting.

- **Cost:** 3 readiness + one weekly hero commitment + 10M + 5K; metal access, staffed workshop and its queue required
- **Reach / duration:** One connected region containing the hero, workshop and company; One week to fit; persists until replaced or destroyed
- **Counter:** Use other attacks, exploit slower movement, or interrupt the refit.

**Passive - Field Care:** One own armored company near the hero suffers 20% less armor-durability loss during its first encounter each week. **Limit:** One company per week; incoming damage, fitting costs and pre-existing wear are unchanged. Durability is never restored.

### Master Artificer

**Faction:** Nogrod

**Helps with:** Rare inputs and specialist labor bottleneck tools and commissions.

**Remaining weakness:** Rare commissions still require their full inputs, specialist queues and development time.

**Field power - Exact Breach:** One own engineer company's next obstacle attack gains 25% breach effectiveness when using an existing breach-tool set; its normal wear still applies.

- **Cost:** 2 readiness; normal engineer action and tool wear
- **Reach / duration:** Local encounter; hero beside engineers at the obstacle; One action
- **Counter:** Defend the approach, damage the tools, or move the contested objective.

**Support power - Modular Refit:** Convert one existing standard tool set to another already-researched compatible function. The original is consumed; rare or unique items are ineligible.

- **Cost:** 3 readiness + one weekly hero commitment + 10M + 5K; compatible inputs, staffed forge and one queue required
- **Reach / duration:** One connected region containing hero, forge and item; One week; output keeps the input item's salvage-value ceiling
- **Counter:** Interrupt the forge, deny compatible materials, or force a different operational need.

**Passive - Calibrated Grip:** One own engineer company beside the hero consumes 25% less breach-tool durability on its first ordinary obstacle attack each week. **Limit:** One attack per week; normal attack action, tool requirements and recipe inputs remain. No resource refund or durability restoration.

### Warband Organizer

**Faction:** Orc fortress-clan

**Helps with:** Large warbands consume food and divided command can destabilize operations.

**Remaining weakness:** Food demand, disputed leadership and finite salvage continue to constrain expansion.

**Field power - Rally the Line:** One own Orc infantry company removes one temporary rout condition and reforms at its current position; wounds and casualty losses remain.

- **Cost:** 2 readiness
- **Reach / duration:** Local encounter; within the hero's command radius; One reform phase; renewed pressure can rout it again
- **Counter:** Separate the hero, attack during reforming, or threaten another company.

**Support power - Count the Spoils:** Advance one salvage job started in an earlier turn by one weekly progress step. Consume its finite claimed wreck once; normal salvage yield remains. A job started this turn is ineligible, so this power cannot start and finish a job in the same turn.

- **Cost:** 3 readiness + one weekly hero commitment + 5P; assigned workers, project order and foundry queue required
- **Reach / duration:** One connected region with hero, wreck and receiving foundry; One weekly resolution; one salvage job
- **Counter:** Recover or destroy the wreck, raid workers, or cut the return route.

**Passive - Declared Shares:** One own participating warband avoids a dispute penalty when the player delivers an agreed reward on time. **Limit:** One fulfilled agreement per week; reward is paid normally and existing grievances remain.

### Shirekeeper

**Faction:** Hobbit Shire

**Helps with:** Strong food production supports a community poorly suited to prolonged open battle.

**Remaining weakness:** Weak heavy forces, occupation risk and dependence on defensible refuge routes remain.

**Field power - Quiet Departure:** One own civilian or light-infantry group withdraws through existing cover with 25% lower ranged targeting accuracy against it; visibility is not erased.

- **Cost:** 2 readiness
- **Reach / duration:** Local encounter; group near hero and a viable covered exit; One withdrawal phase
- **Counter:** Guard the exit, enter the cover, or attack the destination.

**Support power - Neighbors' Stores:** Consolidate and move up to 10 existing P from willing own households to one refuge using available carriers; source stores lose the same amount.

- **Cost:** 3 readiness + one weekly hero commitment + 2P for transport; normal convoy order and carrying capacity required
- **Reach / duration:** One connected region with an open route; One week; no stock duplication or capacity increase
- **Counter:** Block the road, intercept carriers, or threaten the receiving refuge.

**Passive - Packed for Rain:** One supplied own civilian convoy accompanied by the hero ignores its first ordinary rain-fatigue increment each week. **Limit:** One weather event per week; travel time, provisions, carrying capacity and all combat effects remain.

### Stonebreaker

**Faction:** Troll Hold

**Helps with:** Heavy Troll forces need substantial supplies and struggle to bypass fortifications.

**Remaining weakness:** Food consumption, slow repositioning and exposure to coordinated ranged forces remain.

**Field power - Measured Shatter:** The hero's next normal strike against a gate or barricade gains 25% breach effectiveness but exposes the hero to counterattack.

- **Cost:** 2 readiness; normal attack action
- **Reach / duration:** Local encounter; melee contact with the obstacle; One attack
- **Counter:** Use ranged focus, traps, a reserve barrier, or attacks during the exposed recovery.

**Support power - Clear the Haulway:** Remove one ordinary fallen-stone or timber obstruction from an existing supply route. Cleared debris yields no resource stock.

- **Cost:** 3 readiness + one weekly hero commitment + 5P + 5M for provisions and tool wear; worker project order required
- **Reach / duration:** One connected region; hero physically at the obstruction; One week; does not create bridges or passages through mountains
- **Counter:** Contest the worksite, attack its supplies, or obstruct another route.

**Passive - Shoulder the Load:** The hero carries one existing heavy equipment piece during ordinary movement without requiring a separate porter. **Limit:** One item; it occupies carrying capacity and prevents sprinting. No added supply ceiling.

### Packwarden

**Faction:** Wolf Pack

**Helps with:** Lightly protected packs rely on viable hunting territory and coordinated movement.

**Remaining weakness:** Finite prey, light protection, defended chokepoints and the lack of heavy industry remain.

**Field power - Split the Pursuit:** Two own wolf groups approaching from different passable directions impose one temporary pursuit penalty on a single isolated enemy company.

- **Cost:** 2 readiness; both groups spend their normal movement
- **Reach / duration:** Local encounter; groups within howling radius; One tactical phase
- **Counter:** Close ranks, reach a defended crossing, or support the isolated company.

**Support power - Read the Hunting Ground:** Survey one connected habitat for existing prey and recent danger; one normally assigned hunting group can choose its route using that report. Harvest still consumes finite prey.

- **Cost:** 3 readiness + one weekly hero commitment + 2P for the scouting pack; any hunt needs its normal separate order and upkeep
- **Reach / duration:** One connected habitat region physically traversable by the hero; One week; report becomes stale as prey and threats move
- **Counter:** Patrol the hunting route, defend prey areas, or force movement through chokepoints.

**Passive - Recognized Scent:** Distinguishes an own pack's recent trail from an unknown trail when the hero encounters it. **Limit:** Fresh local traces only; reveals no remote position, identity or exact numbers.

## Named Istari

### Gandalf

**Faction:** Gandalf's Fellowship

**Helps with:** A small refuge network cannot field enough troops to withstand a concentrated assault.

**Remaining weakness:** His strongest burst consumes most of his six readiness and exposes a small army to pressure elsewhere. Refuge staff, provisions and ordinary troops remain necessary; protection has limited targets and duration.

**Field power - Flame of the White Fire:** After a visible wind-up, strike up to three exposed enemies in one 5-metre area with fire and light. Each takes damage equivalent to two of Gandalf's ordinary weapon hits, subject to normal defense; one selected victim also loses its current prepared ranged attack. The combined effect cannot kill a healthy hero or destroy a healthy capital in one use.

- **Cost:** 4 readiness and 10E; one local casting action within the battle commitment
- **Reach / duration:** One visible 5-metre area centred within 18 metres; One-phase warning, then one burst; interruption affects only the currently prepared attack
- **Counter:** Disperse before the burst, take solid cover, interrupt the wind-up or close on Gandalf from another direction.

**Support power - Stand of the Free:** Remove one fear step from up to two nearby friendly units and ward each against its next damaging hit. Each ward absorbs at most the damage of one of Gandalf's ordinary weapon hits; excess damage passes through. Wards do not restore health or change orders or allegiance.

- **Cost:** 2 readiness and 10K; one local casting action within the battle commitment
- **Reach / duration:** Two visible friendly units within 10 metres; Two tactical phases or until each ward absorbs one hit; same wards do not stack
- **Counter:** Use repeated attacks, wait out the ward, separate its recipients or pressure an unprotected objective.

**Passive - Hope Rekindled:** The first panic-driven rout of one owned ordinary company within 10 metres of Gandalf becomes an orderly fallback for one tactical phase, preserving its formation while it withdraws. **Limit:** One company per encounter; does not heal, add movement or prevent later panic. Requires a traversable fallback route and Gandalf to remain conscious; excludes Dragons and Balrogs.

### Saruman

**Faction:** Saruman's White Tower

**Helps with:** A compact industrial enclave needs costly specialist defenders while workshops and workers are exposed.

**Remaining weakness:** His three ordinary queues still share six support plots and supply 18. Industry, siege ammunition and his one bound Sentinel compete for materials and essence; his force lane needs positioning and offers no mass healing.

**Field power - Shattering Voice:** Release a directed sonic-force blow through a 3-metre-wide lane, striking at most two exposed units for damage equivalent to two of Saruman's ordinary weapon hits each. It also pushes each struck unit up to 3 metres along traversable ground; it cannot push across lethal edges. Normal defense applies, and one use cannot kill a healthy hero or destroy a healthy capital. This is physical force, not compelled obedience.

- **Cost:** 3 readiness, 5K and 5E; one local casting action within the battle commitment
- **Reach / duration:** One visible lane up to 16 metres long; One-phase audible wind-up followed by one pulse
- **Counter:** Leave the lane, use solid barriers, brace against anchored cover to prevent the push, or interrupt Saruman before the pulse.

**Support power - Commission the Iron Servant:** Create one ordinary Resonant Sentinel at a staffed Orthanc Workshop with a paid construct berth. It is an armed guard that may intercept one attack aimed at an adjacent ordinary ally per encounter, taking that attack's normal damage itself. It has no hero progression or hero slot. Creation occupies one ordinary queue for two turns and cannot attack in its completion resolution. This power cannot create, copy or command Dragons or Balrogs.

- **Cost:** 3 readiness and one weekly hero commitment at the start; 40M, 15K and 20E paid upfront; reserve 2 supply and 1 binding slot before work begins; upkeep 2M and 1E per turn after completion
- **Reach / duration:** One reachable staffed Orthanc Workshop in the connected region; Sentinel appears only at its berth; Two production turns; at most one active or pending Sentinel from this power. It persists with upkeep until destroyed or deliberately dismantled; no material refund on dismantling
- **Counter:** Raid the workshop or interrupt staff and inputs before completion; afterwards flank the guard, attack from range or disrupt its upkeep. Shortages disable its special interception and block another commission, without changing ownership.

**Passive - Measured Demolition:** One owned ordinary siege weapon within 12 metres of Saruman adds one ordinary-hit equivalent of its own damage to its first successful hit against a visible fortification in the encounter. **Limit:** One weapon and one enhanced hit per encounter; ordinary action, ammunition, range and defense still apply. No extra shot, healthy-capital one-shot, or enhancement to a hero, Dragon or Balrog is granted.

### Radagast

**Faction:** Radagast's Woodland Circle

**Helps with:** A habitat-dependent force cannot cheaply replace trained beasts and wounded defenders.

**Remaining weakness:** Offense requires living vegetation and grounded targets. Healing consumes the same readiness needed for attack, and neither healing nor a bodyguard replaces lost habitats, destroyed units or a conventional siege force.

**Field power - Wrath of Root and Thorn:** Drive living roots and thorns into up to two grounded enemies in one vegetated patch. Each suffers damage equivalent to two of Radagast's ordinary weapon hits, with normal defense, and its next movement is limited to one 3-metre step. Roots do not change allegiance; the combined strike cannot kill a healthy hero or destroy a healthy capital in one use.

- **Cost:** 3 readiness, 5P and 5E; one local casting action within the battle commitment
- **Reach / duration:** One visible 5-metre patch of living vegetation within 14 metres; One-phase visible wind-up; damage once and movement restriction for the next tactical phase; normal two-phase disable reapplication grace applies
- **Counter:** Leave the growing roots during the warning, use paved or barren ground, cut or burn the roots, attack from range or take flight.

**Support power - Mending of Living Flesh:** Heal one living friendly unit, including a hero, by an amount equal to two of Radagast's ordinary weapon hits of damage, capped at its missing health; also end one ordinary ongoing poison effect. It cannot resurrect, repair constructs, regrow a destroyed unit or remove a lasting campaign injury.

- **Cost:** 3 readiness, 10P and 5E; one uninterrupted local treatment action within the battle commitment
- **Reach / duration:** Physical contact with one willing living patient; One tactical phase of treatment; each patient can receive this healing once per encounter
- **Counter:** Interrupt contact, separate healer and patient, deny the required supplies or inflict fresh injuries after treatment.

**Passive - Companion's Vigil:** One owned ordinary beast adjacent to Radagast may interpose against the first attack aimed at him in an encounter, taking the attack's normal damage instead. **Limit:** Once per encounter; the beast must already be adjacent, conscious and under its existing ownership. No free movement, attack, damage immunity or new beast is granted; Dragons and Balrogs are excluded.

### Alatar (Blue Wizard)

**Faction:** Alatar's Eastern Hunt

**Helps with:** A small hunting force must defeat dangerous individual opponents before they overwhelm its scattered outposts.

**Remaining weakness:** High-value single-target attacks do not clear a massed army or hold several outposts. Aiming and marking expose his position; walls, dense cover, close pressure and multiple simultaneous threats remain effective.

**Field power - Spear of the Far Hunt:** Launch one concentrated magical hunting strike at a visible enemy, dealing damage equivalent to three of Alatar's ordinary ranged weapon hits if it connects. Resolve normal armor and cover; a healthy hero or capital cannot be destroyed by this single strike. The attack is powerful against an exposed target but does not automatically hit or penetrate solid barriers.

- **Cost:** 4 readiness, 5K and 10E; one local casting action within the battle commitment
- **Reach / duration:** One visible enemy within 24 metres; One-phase visible aiming warning followed by one strike
- **Counter:** Break sight with solid cover, move out of the firing lane during the warning, close on Alatar or interrupt his aim.

**Support power - Quarry Sign:** Mark one currently visible enemy. Its outline remains observable through ordinary mist and light foliage within range, allowing pursuit after those forms of concealment. The mark reveals no other units, intentions or unseen terrain and gives no command over its target.

- **Cost:** 2 readiness and 5K; one local casting action within the battle commitment
- **Reach / duration:** One visible target within 24 metres; the mark stops providing information beyond that range; Three tactical phases; ends if the target leaves range or removes the visible mark with one ordinary cleansing action
- **Counter:** Use solid walls, roofs or dense terrain that fully blocks sight; leave range, remove the mark or threaten Alatar while he pursues.

**Passive - Prepared Ambush:** After one full tactical phase without moving or attacking, Alatar's next ordinary ranged attack gains one additional ordinary-hit equivalent of damage if it hits. **Limit:** Once per encounter, on an ordinary attack only; never stacks onto Spear of the Far Hunt. Normal attack action, ammunition, cover and armor still apply; it cannot make a single hit kill a healthy hero.

### Pallando (Blue Wizard)

**Faction:** Pallando's Eastern Resistance

**Helps with:** A lightly equipped resistance force cannot afford enough specialist equipment to withstand hostile battle magic.

**Remaining weakness:** His spell suppression is temporary and his protection covers only two units in a small fixed area. Ordinary armies, dispersed attacks and sustained physical pressure remain dangerous; essence and prepared lore supplies limit repeated casting.

**Field power - Word of Sundering:** Strike one visible enemy with force equal to two of Pallando's ordinary weapon hits, subject to normal defense, and suppress one selected active cast ward or enchantment on it for two phases. One use cannot kill a healthy hero or destroy a healthy capital. Suppression never removes inherent abilities, destroys a created body, frees Anchor capacity, changes ownership or interrupts Melkor's command link to Dragons or Balrogs.

- **Cost:** 4 readiness, 10K and 5E; one local casting action within the battle commitment
- **Reach / duration:** One visible enemy within 18 metres; the chosen enchantment must already be identified; One-phase spoken wind-up, damage once, then two-phase suppression; the original effect's duration and upkeep continue normally
- **Counter:** Take solid cover, interrupt the incantation, rely on ordinary weapons or armor, or outlast the short suppression before committing another spell.

**Support power - Circle of Refusal:** Ward up to two friendly units inside a prepared 5-metre circle, reducing damage from direct hostile spells by half while they remain inside. It also shortens the next magical fear or silence imposed on each by one phase, to a minimum of one phase. Physical attacks, environmental fire and movement remain normal; this grants resistance rather than immunity or control over another faction's units.

- **Cost:** 2 readiness, 10K and 5E; one local casting action within the battle commitment
- **Reach / duration:** A 5-metre circle centred within 8 metres; select up to two friendly recipients; Two tactical phases; ends for a recipient that leaves the circle; same-effect protection uses the strongest source only
- **Counter:** Use ordinary arrows or melee, destroy the visible ground markers, attack from outside the protected area or force the recipients to leave it.

**Passive - Unbroken Incantation:** The first magical interruption of a spell Pallando is actively casting delays its completion by one tactical phase instead of cancelling it. **Limit:** Once per encounter; a further interruption cancels normally. Lethal or incapacitating damage, lost range, lost target sight and physical displacement still invalidate the cast; costs are not refunded and no extra action or spell is created.

## Istari, Maiar and guardians

### Sauron

**Faction:** Sauron

**Helps with:** Industrial armies lose effectiveness when their supply network is disrupted.

**Remaining weakness:** The army still needs provisions, depots and travel; exposed clients can secede.

**Field power - Black Command:** One owned ordinary company regains one lost cohesion step and can execute its declared fallback. Never affects Dragons or Balrogs.

- **Cost:** 2 readiness
- **Reach / duration:** One visible company within 12 metres in the current encounter; Two tactical phases; no stacking
- **Counter:** Break line of sight, isolate the company or keep its fallback route blocked.

**Support power - Redundant Supply:** Prepare an alternate route for one funded convoy between owned depots. It may reroute once when its original path closes; goods still travel normally.

- **Cost:** 3 readiness, weekly hero commitment, 10M and 5K
- **Reach / duration:** One connected region with two owned depots and a surveyed open alternate route; One week
- **Counter:** Block the alternate route, damage a depot or intercept the convoy.

**Passive - Reserved Rations:** One selected owned ordinary company may carry up to 5P of paid reserve provisions beyond its normal load, reducing reliance on its next convoy. **Limit:** Stocks must be deducted from a depot; upkeep consumes them normally. One company at a time; no Dragons or Balrogs.

### Kindler

**Faction:** Ember Order

**Helps with:** Small support armies struggle to keep workers active near a threatening front.

**Remaining weakness:** Shelters cannot replace a field army, and displaced workers stop production.

**Field power - Hold the Hearth:** Two nearby owned ordinary groups reduce their current panic by one step. Damage and fatigue remain.

- **Cost:** 2 readiness
- **Reach / duration:** Two groups within 8 metres of the Kindler in the current encounter; Two tactical phases; one application per group per encounter
- **Counter:** Separate the groups, force the Kindler away or apply fresh pressure after the effect ends.

**Support power - Refuge Shift:** Prepare shelter and an evacuation drill for one staffed worksite. Its workers can withdraw once to the selected nearby refuge; the abandoned job pauses rather than producing remotely.

- **Cost:** 3 readiness, weekly hero commitment, 10P and 10M
- **Reach / duration:** One connected region; worksite and refuge linked by an open route; One week or one evacuation
- **Counter:** Cut the route, occupy the refuge or force evacuation before the job completes.

**Passive - Shared Warmth:** One ordinary company resting with the Kindler removes one additional fatigue step. **Limit:** Once per week at a supplied refuge; no readiness, stock or injury restoration.

### Grovekeeper

**Faction:** Grove Order

**Helps with:** Specialist training makes replacing injured personnel expensive.

**Remaining weakness:** Care depends on viable habitat, staff and supplies; overwhelming losses still exhaust the order.

**Field power - Living Dressing:** Stabilize one nonfatal wound on an owned ordinary unit, preventing that wound worsening during withdrawal. Does not restore combat strength or revive the dead.

- **Cost:** 2 readiness and 5P
- **Reach / duration:** Physical contact in the current encounter; Until encounter end or the unit suffers another wound
- **Counter:** Interrupt contact, deny a retreat route or inflict a new wound.

**Support power - Nursery Recovery:** Treat up to two injured ordinary units at a staffed medicine nursery; each completes one additional step of its existing recovery schedule.

- **Cost:** 3 readiness, weekly hero commitment, 10P and 10M
- **Reach / duration:** One connected region; patients physically present at the nursery; This week's recovery resolution
- **Counter:** Raid the nursery, interrupt supplies or force the patients to move.

**Passive - Measured Remedies:** One ordinary patient treated by Grovekeeper retains one already completed recovery step that would otherwise be lost during its first evacuation from the nursery. **Limit:** One patient per week and once per injury; no new healing, readiness restoration, supply generation or resurrection.

### Veilweaver

**Faction:** Veil Order

**Helps with:** Fragile agents cannot afford repeated losses while gathering information.

**Remaining weakness:** The order lacks durable troops, and deception cannot substitute for holding ground.

**Field power - Borrowed Shadow:** Place one stationary silhouette of an ordinary infantry scout to draw observation. It cannot attack, carry goods, capture sites or copy a hero, Dragon or Balrog.

- **Cost:** 2 readiness and 5K
- **Reach / duration:** One visible location within 12 metres in the current encounter; Two tactical phases or until physically examined
- **Counter:** Scout from another angle, touch the silhouette or watch whether it interacts with terrain.

**Support power - Quiet Exchange:** Cross-check one dated report through two staffed safehouses, identifying contradictions and source uncertainty. It does not reveal unobserved facts.

- **Cost:** 3 readiness, weekly hero commitment and 10K
- **Reach / duration:** One connected region containing both safehouses; One report delivered at weekly resolution
- **Counter:** Close a safehouse, intercept its courier or supply independently consistent false evidence.

**Passive - Compartmented Contacts:** Capture of one ordinary agent reveals only that agent's current assignment and contacts. **Limit:** Does not conceal information already learned elsewhere or automatically rescue the captive.

### Artificer

**Faction:** Forge Order

**Helps with:** A small number of expensive constructs makes repair downtime costly.

**Remaining weakness:** Constructs remain material-intensive, and repair cannot compensate for destroyed production facilities.

**Field power - Brace the Mechanism:** Restore one movement impairment on an owned nonhero construct made by this order. No lost unit is recreated, and destroyed parts remain destroyed.

- **Cost:** 2 readiness and 10M
- **Reach / duration:** Physical contact in the current encounter; Until encounter end or another disabling hit
- **Counter:** Interrupt the repair, separate the Artificer from the machine or damage the repaired joint.

**Support power - Service Overhaul:** Advance one already-funded repair job by one turn. It cannot complete in the turn it starts; excludes hero creation, new-unit production, Dragons and Balrogs.

- **Cost:** 3 readiness, weekly hero commitment, 15M and 5K
- **Reach / duration:** One staffed service depot in the connected region; One repair job; once per job
- **Counter:** Occupy the depot, remove its crew or deny its required source access.

**Passive - Standard Fittings:** An ordinary repair kit made by this order fits any of its own ordinary constructs. **Limit:** Every repair still consumes the kit, materials and its normal action; never grants another faction's recipe.

### Wayseer

**Faction:** Star Order

**Helps with:** A dispersed small army often receives warnings too late to concentrate.

**Remaining weakness:** Knowledge does not create troops or transport; unconnected regions remain difficult to protect.

**Field power - Signal Flash:** One visible owned ordinary group may revise its declared fallback before the next tactical resolution; its movement allowance does not increase.

- **Cost:** 2 readiness
- **Reach / duration:** One group within 15 metres in the current encounter; Next tactical phase
- **Counter:** Obscure the signal, block the fallback or pressure a different group.

**Support power - Beacon Concord:** Prepare one verified warning relay between three staffed beacons. An observed attack is reported at the next planning phase, without revealing events outside their sightlines.

- **Cost:** 3 readiness, weekly hero commitment, 10M and 5K
- **Reach / duration:** One connected region with an intact beacon chain; One week
- **Counter:** Cut a relay, approach under cover or use a diversion beyond its sightlines.

**Passive - Veiled Starlight:** One staffed beacon link previously surveyed by Wayseer can transmit one already-observed warning through light fog that would normally block its visual signal. **Limit:** Once per week across one link; normal actions, staffing, costs, range and delivery time apply. No extra messages, improved observation, passage through solid cover or transmission through heavy fog or storms.

### Melian

**Faction:** Melian

**Helps with:** A stationary sanctuary depends on vulnerable trips beyond its protected boundary.

**Remaining weakness:** Protection remains stationary and cannot solve internal disputes or sustain distant armies.

**Field power - Veil the Departing:** Conceal the visible trail of one consenting ordinary party while it withdraws. Attacking or crossing open ground ends the concealment.

- **Cost:** 2 readiness
- **Reach / duration:** One party within 10 metres in a wooded encounter; Two tactical phases
- **Counter:** Watch exits, inspect fresh tracks from another angle or force the party into open terrain.

**Support power - Guest Road:** Ward one surveyed wooded supply route against casual observation. Convoys still require transport, provisions and ordinary travel time.

- **Cost:** 3 readiness, weekly hero commitment, 10M, 5K and one Anchor
- **Reach / duration:** One connected region adjoining the sanctuary; One week; ends early if its prepared markers are destroyed
- **Counter:** Patrol the route closely, clear cover or seize an endpoint.

**Passive - Known Thresholds:** One staffed sanctuary entrance records arrivals and departures for later inspection. **Limit:** One entrance at a time; cannot identify a concealed identity or observe outside the boundary.

### Ossë

**Faction:** Ossë

**Helps with:** Coastal workshops and landings lose productive access when channels are obstructed.

**Remaining weakness:** Inland threats remain difficult to answer, and storm magic endangers friendly shipping.

**Field power - Break the Landing:** Raise hazardous surf across one short landing approach, slowing ships and swimmers physically. Friendly vessels face the same hazard.

- **Cost:** 2 readiness
- **Reach / duration:** One visible coastal strip within 15 metres in the current encounter; Two tactical phases
- **Counter:** Use another beach, wait out the surf or approach from land.

**Support power - Workable Tide:** Help a supplied shore crew clear one silted or debris-blocked harbor channel, completing one step of its funded repair. No new harbor or ship is created.

- **Cost:** 3 readiness, weekly hero commitment and 20M
- **Reach / duration:** One owned harbor in a connected coastal region; This week's repair resolution
- **Counter:** Disrupt the shore crew, damage its equipment or renew the physical obstruction.

**Passive - Read the Shoals:** Inspection reveals safe draft and current hazards for one local channel. **Limit:** One inspected channel per week; information becomes stale after storms or sabotage.

### Uinen

**Faction:** Uinen

**Helps with:** Small maritime forces cannot replace damaged transport quickly.

**Remaining weakness:** She cannot replace destroyed fleets or secure inland supply lines through calming water alone.

**Field power - Stillwater Pocket:** Reduce wave hazard by one severity step around one damaged vessel so its crew can attempt repair or rescue. Enemy attacks remain effective.

- **Cost:** 2 readiness
- **Reach / duration:** One vessel within 15 metres in the current encounter; Two tactical phases
- **Counter:** Attack from shore, obstruct its route or force it beyond the calm pocket.

**Support power - Sheltered Refit:** A staffed rescue yard advances repairs on one existing transport by one step while Uinen maintains workable water conditions.

- **Cost:** 3 readiness, weekly hero commitment, 10P and 15M
- **Reach / duration:** One rescue yard in a connected coastal region; This week's repair resolution; once per repair job
- **Counter:** Blockade the yard, interrupt materials or raid the repair crew.

**Passive - Ready Lifelines:** One prepared friendly rescue craft can begin a rescue without first deploying its rigging. **Limit:** One rescue per encounter; normal load, movement and casualty limits still apply.

### Arien

**Faction:** Arien

**Helps with:** A small terrestrial workforce struggles to operate under hostile concealment.

**Remaining weakness:** Illumination cannot hold territory, enter sealed interiors or replace conventional defense.

**Field power - Unclouded Glimpse:** Thin ordinary smoke or mist in one visible area, exposing silhouettes without identifying hidden motives or targets behind solid cover.

- **Cost:** 2 readiness
- **Reach / duration:** One 6-metre area within 15 metres in the current encounter; Two tactical phases
- **Counter:** Use roofs, tunnels, solid cover or fresh smoke outside the illuminated area.

**Support power - Dawn Worksite:** Illuminate one prepared worksite so its existing crew can perform its normal shift despite darkness. No extra production cycle, workers or free materials are granted.

- **Cost:** 3 readiness, weekly hero commitment, 10M and 5K
- **Reach / duration:** One connected region; one staffed site with a maintained mirror station; One week
- **Counter:** Destroy the mirrors, attack the exposed crew or obstruct the sightline with solid cover.

**Passive - Long Shadows:** An occupied dawn watchpost records the direction of exposed movement crossing its lit approach. **Limit:** One selected post; only visible movement, with no tracking after cover is reached.

### Tilion

**Faction:** Tilion

**Helps with:** Limited patrol numbers leave nocturnal routes poorly covered.

**Remaining weakness:** A single patrol cannot protect multiple fronts, and dependable reports still require exposure.

**Field power - Silver Interception:** Make one aimed attack against an exposed attacker preparing to strike a nearby ordinary ally. It can interrupt that attack but cannot guarantee a kill.

- **Cost:** 2 readiness
- **Reach / duration:** One visible target within 15 metres in the current encounter; Next tactical phase
- **Counter:** Use cover, feint with one attacker and strike with another, or engage beyond the protected lane.

**Support power - Watch of the Moon:** Survey one declared night route personally and report observed crossings at the next planning phase. It does not reveal interiors or unvisited branches.

- **Cost:** 3 readiness, weekly hero commitment and 10P for supporting scouts
- **Reach / duration:** One connected region and one traversable patrol route; One week
- **Counter:** Travel outside the route, use overhead cover or stage a diversion.

**Passive - Night Bearings:** One ordinary scout group accompanying Tilion reduces a routefinding delay by one tactical phase when retracing a route he personally surveyed. **Limit:** Once per encounter; does not bypass blockades, increase movement allowance or disclose new terrain.

### Eönwë

**Faction:** Eönwë

**Helps with:** A compact expeditionary economy struggles with dispersed military commitments.

**Remaining weakness:** Concentrating the host exposes other routes, and his martial strength cannot replace provisions.

**Field power - Heralds Advance:** Lead up to two owned ordinary companies in a coordinated advance, reducing separation by allowing a shared pace. Movement and damage remain otherwise normal.

- **Cost:** 2 readiness
- **Reach / duration:** Two companies within 10 metres in the current encounter; Two tactical phases
- **Counter:** Block their shared route, attack their flanks or force different terrain speeds.

**Support power - Muster by Terms:** Prepare one rally point and timed arrival plan for three owned ordinary companies. They retain separate travel requirements and can join one declared operation when they arrive.

- **Cost:** 3 readiness, weekly hero commitment, 15P and 10M
- **Reach / duration:** One connected region with surveyed routes and a supplied rally point; One week
- **Counter:** Intercept one route, deny the rally point or draw the force toward another objective.

**Passive - Clear Commission:** One supplied ordinary company operating under his written mission retains its declared fallback if communications are cut. **Limit:** One company and one mission; cannot issue new orders remotely or apply to Dragons or Balrogs.

### Ilmarë

**Faction:** Ilmarë

**Helps with:** A lightly defended communications network is easily disrupted.

**Remaining weakness:** Reliable communications still need staffed sites and cannot substitute for a defending army.

**Field power - Witness Flare:** Mark the observed position of one visible attacker for nearby defenders. The mark does not follow the target after it reaches cover.

- **Cost:** 2 readiness
- **Reach / duration:** One visible target within 15 metres in the current encounter; Two tactical phases
- **Counter:** Change position under cover, obscure the flare or attack from another direction.

**Support power - Second Signal:** Prepare a redundant physical relay for one staffed communications link. If its primary station fails, a courier can use the surveyed alternate route.

- **Cost:** 3 readiness, weekly hero commitment, 15M and 5K
- **Reach / duration:** One connected region with an available courier and alternate route; One week or one rerouted message
- **Counter:** Intercept the courier, block the alternate route or feed false reports into the surviving station.

**Passive - Witness Chain:** The first report crossing her network each week preserves the identities of its observed relay stations and its timestamp. **Limit:** Provenance supports checking, not guaranteed truth; generates no fresh observations.

### Grove Elder

**Faction:** Ent Grove

**Helps with:** Slow movement makes separated habitats and work areas difficult to defend.

**Remaining weakness:** The faction remains slow, habitat-dependent and vulnerable to sustained fire.

**Field power - Rooted Screen:** Raise existing roots across one short approach, slowing passage and sheltering withdrawal without sealing every exit.

- **Cost:** 2 readiness
- **Reach / duration:** One rooted area within 10 metres in the current encounter; Three tactical phases
- **Counter:** Cut or burn the roots, use a different approach or attack from range.

**Support power - Living Causeway:** Shape existing timber and roots into one short crossing for ordinary movement. Requires a working crew and suitable banks; does not create mature trees.

- **Cost:** 3 readiness, weekly hero commitment, 20M and 10P
- **Reach / duration:** One connected region; a surveyed gap no wider than 15 metres; Completed physical crossing persists until damaged
- **Counter:** Attack the builders, burn the crossing or block its far bank.

**Passive - Root Memory:** Once per week, inspect one connected grove for recent logging or heavy passage and identify its direction. **Limit:** Records disturbance rather than identities; disconnected land remains unknown.

### Skywarden

**Faction:** Eagle Eyrie

**Helps with:** Secure aerial territory still has little capacity to move supplies or rescue grounded allies.

**Remaining weakness:** Loads stay small, eyries remain exposed, and air superiority does not establish ground control.

**Field power - Lift the Stranded:** Carry one willing light nonhero ally to a safe landing point. Excludes large creatures, Dragons and Balrogs; both take the risk of the exposed flight.

- **Cost:** 2 readiness
- **Reach / duration:** Pickup by contact; landing within 20 metres in the current encounter; One flight across two tactical phases
- **Counter:** Guard the landing point, use ranged attacks or deny sufficient landing space.

**Support power - Eyrie Relay:** Move up to 20 units of existing P or K between two prepared ledges using one committed ordinary flight. It cannot transport M, E, troops or a second load.

- **Cost:** 3 readiness, weekly hero commitment, 10P and 5M
- **Reach / duration:** Two owned or consenting ledges within one connected region; One delivery at weekly resolution
- **Counter:** Threaten a ledge, intercept the flight or force weather delays.

**Passive - Landing Survey:** Before one rescue or delivery each week, reveal visible obstacles and available space at the inspected destination. **Limit:** Requires line of sight; concealed defenders remain concealed.

### Brood Matriarch

**Faction:** Spider Brood

**Helps with:** A prey-dependent economy struggles to connect separated lairs safely.

**Remaining weakness:** The brood still depends on prey and prepared terrain; fire and cleared routes remain effective counters.

**Field power - Layered Snare:** Web one short approach, reducing ordinary ground movement through it and revealing physical crossings. It does not issue orders or permanently immobilize targets.

- **Cost:** 2 readiness and 5M
- **Reach / duration:** One 6-metre approach within 10 metres in the current encounter; Three tactical phases or until cleared
- **Counter:** Cut or burn the web, cross elsewhere or attack from range.

**Support power - Brood Bridge:** Build one silk crossing between prepared anchors, opening a route for ordinary brood workers and hunters. Hunting and transport still require their normal assignments.

- **Cost:** 3 readiness, weekly hero commitment, 20M and 10P
- **Reach / duration:** One connected region; a surveyed gap no wider than 15 metres; Physical crossing persists until damaged
- **Counter:** Destroy an anchor, clear the crossing or ambush its exit.

**Passive - Tremor Ledger:** One occupied lair records the time and direction of crossings touching its connected web routes. **Limit:** No identity detection, remote control or information beyond intact connected silk.

## Melkor doctrines

### Melkor - Worldbreaker

**Faction:** Melkor

**Helps with:** A tiny sanctuary cannot maintain broad industry or replace a large army.

**Remaining weakness:** Small economy, limited simultaneous coverage and a finite, nonrenewable pool of living Balrogs and Dragons.

**Field power - Worldbreak:** Damage one defended obstacle or clustered position after a visible wind-up; cannot destroy a healthy hero or capital in one use.

- **Cost:** 4 readiness; ordinary local attack commitment
- **Reach / duration:** One visible local encounter position; One attack after a one-phase warning
- **Counter:** Disperse, use layered barriers, interrupt the approach or attack another objective.

**Support power - Call of the Dark:** Activate one discovered, living Balrog or Dragon with an existing map ID. It walks or flies from its real location; no new entity, hatching or resurrection is created.

- **Cost:** 3 readiness + one weekly hero commitment + 20P + 20M + 10E; reserve full supply and great-creature points; normal movement operations thereafter
- **Reach / duration:** One discovered candidate with a known traversable route; no teleportation; One call; arrival follows actual travel time
- **Counter:** Scout its departure, block or intercept the route, or kill the finite candidate before deployment.

**Passive - Unspent Might:** Maximum readiness is 12 and a recovery commitment restores 6, enabling more personal intervention. **Limit:** One hero commitment per week; sanctuary supply 12 and great-creature capacity 2 remain fixed. It grants no new creature production or extra map presence.

### Melkor - Dark Architect

**Faction:** Melkor

**Helps with:** Expensive creature industry matures slowly and needs coordination across vulnerable sites.

**Remaining weakness:** Lower personal combat capacity, slower economic setup and expensive, exposed production. Existing-creature calls remain available at the same cost; new Dragons and Balrogs require this doctrine.

**Field power - Iron Edict:** Coordinate a synchronized plan for up to three owned great creatures on one connected front; no additional attacks, movement or foreign control.

- **Cost:** 3 readiness + one weekly hero commitment; units retain normal movement and supply requirements
- **Reach / duration:** One connected front with surveyed routes; One weekly operation; plans resolve through ordinary tactical phases
- **Counter:** Divide the front, block one route, interrupt preparation or threaten an uncovered city.

**Support power - Forge Will:** Advance one fully paid, staffed production job by one turn; cannot finish in the turn it starts and cannot create duplicate outputs.

- **Cost:** 3 readiness + one weekly hero commitment + 10E; all original inputs, workers, capacity and facility remain required
- **Reach / duration:** One reachable owned worksite in one connected region; One job at one weekly resolution; at most once per turn
- **Counter:** Raid the facility, deny inputs, displace workers or destroy the job before completion.

**Passive - Brood Discipline:** After research, reduce future Dragon/Balrog base production time by 25%, rounded up; costs do not fall. **Limit:** Unlock costs 60M + 40K + 30E and three research turns. Six ordinary queues maximum, full reservations and upkeep; never applies to hero recreation.
