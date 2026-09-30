# Living-world presentation — 30 September 2026

The playable map now expresses more of the game through motion. This is a bounded presentation upgrade, not completion of production animation or the remaining mechanics.

## Delivered behavior

- Companies and heroes follow **their own actual recorded routes**, lasting roughly 0.8–2.6 seconds depending on distance. Small stride/posture changes make travel visible. Missing/ambiguous routes snap rather than cutting across untraversed land. Observer enemies do not receive invented paths.
- Five distant birds flap and cross the scene; three broad, faint mist wisps drift. These are decorative, contain no gameplay entities and never consume simulation randomness.
- Staffed active queues show small local working gestures. Appropriate craft settlements emit restrained chimney smoke. Ent, Eagle, Wolf and Spider habitats use branch, wing or creature silhouettes rather than human workers or universal smoke.
- Observed health loss produces a short impact and damage amount; actual own arrivals, explicit observed losses, changed public control and newly visible zone effects have separate shapes. Work cessation is labeled **Work changed**, not inferred to mean successful completion. The Chronicle and ordinary UI remain the factual result record.
- **Settings → World motion** follows the system reduced-motion preference or explicitly selects a still world. The preference survives reload. Reduced motion clears effects, snaps to committed positions and stops ambient/idle loops. No camera flights, sound dependency, flashes or turn blocking were added.

The painterly landscape, small figure scale, opaque reading surfaces and enlarged selection targets remain. Motion uses original procedural geometry and existing original figure/building atlases; no reference artwork or source text was added to the public build. This is transform-based animation, not newly painted directional walk/attack frames.

## Rule and privacy separation

`src/render/presentation.ts` copies only currently observable data. It never keeps an authoritative Match reference as its previous observation. Visible enemy buildings do not expose hidden job/repair/rest activity. A missing actor is not treated as dead. Repeated, initial or older frames do not replay effects; new destinations cancel obsolete walking immediately.

A trusted simulation movement hook emits optional `GameEvent.motion = { unit, route }` only after checking the actual actor and traversed adjacent path. The event is addressed exclusively to its owner. Guest filtering retains their own motion and strips enemy events/raw trails. Save validation rejects public/multi-seat/foreign-guest motion and invalid routes. The animation clock cannot move a company in simulation or change resources, RNG or commands. Walks/effects are capped at 32 each, work details at 16 visible sites, route events at 400 and route points at 256.

## Compatibility boundary

Current version: **`r6-sim-10-1ba24d66-protocol-2-save-2`**.
Previous version: `r6-sim-9-1ba24d66-protocol-1-save-2`.

The old strict event reader cannot accept the added metadata, and recording events changes future entity-ID allocation. Therefore previous-version peers and checkpoints are explicitly rejected. Existing exported files are not modified. Keep the previous build to finish/resume its campaigns; this change does **not** implement a save migration. Do not edit version strings in saved files or deploy this build over an active match. Local development reloads also cross this boundary; create a new match for this build.

## Review and verification

The regression-first review caught and corrected private enemy-queue animation, unproven anonymous movement routes, obsolete movement continuing after a newer snapshot, and an overconfident completion label. A follow-up art check replaced human work silhouettes at creature habitats. No tests or assertions were disabled.

The aggregate check passed 637 tests across 92 files, typecheck, lint and build (`living-full-check--20260930T080959Z-1565080.log`). One additional habitat regression was then added; final typecheck/lint/build and all 27 affected presentation, renderer and patrol tests passed (`living-final--20260930T081735Z-1587412.log`). The 43-case Chromium component run passed; final four animation plus six native local WebRTC cases also passed (`living-final-browser--20260930T081804Z-1589487.log`), giving 49 distinct Chromium component/network cases this pass. Network cases cover 2/3/4 seats and interruptions before acceptance, after acceptance and during first welcome; these use same-device signaling, not managed-service certification. Firefox 156.0.1 local hero creation and IndexedDB reload passed; this is not Firefox multiplayer or pointer-input certification. Static art validation passed 1,702 checks with zero failures and one declared limitation. Tests cover immutable visible observations, owner-private route provenance, no effects from hidden/disappearing enemies, bounds, actual engine movement through Phaser, unchanged simulation during frames, live nature, damage feedback, stale-route cancellation and system/user reduced motion. Desktop and compact/200-percent views are inspected separately from static art checks.

The animated 96×96 / 400-company Chromium fixture loaded in **710ms**, with **33.4ms p95** frame time and **64,187,795 bytes** JS heap. This is workstation evidence, not physical-device certification. Production JavaScript remains large: application 1,136.41kB (285.06kB gzip), Phaser 1,208.05kB (330.07kB gzip). Existing chunk-size and upstream annotation warnings remain. Logs are under `/tmp/agent-runs/`; reproducible commands are in the [validation record](runtime/VALIDATION.md).

## Next work

The [roadmap](../planning/ROADMAP.md#remaining-implementation-sequence--after-living-world-presentation) orders seven batches: Irmo/forest integration; Nienna/Vairë/Avari support; target/passive completion; terrain masks before paint; directional figure production and situated scenes; managed authorization and remote certification; final device/accessibility evidence.

The current source audit identifies **103 routed powers and seven without integrated command routes**. Routed powers still have incomplete target classes and passive producers. The [ability ledger](../design/runtime-ability-notes.md#reachability-audit-and-next-mechanics-batches--2026-09-30-follow-up) gives exact IDs, source constraints and acceptance cases.

The landscape painting still disagrees with some simulation tiles. Rules terrain remains an inspection aid; authored terrain/landmark masks must drive both traversal and the next landscape composition. This animation pass does not claim to fix geography.

The [managed-service matrix](../guides/MULTIPLAYER.md#remaining-managed-service-verification-plan--2026-09-30) specifies independent-network 2/3/4-seat, selected TURN relay, credential expiry, room restrictions and recovery evidence. Provider-operated scoped authorization remains unresolved, including contradictory current provider origin-restriction documentation. All real managed-network tests remain unexecuted. No owner-operated backend, private browser key, deployment or service purchase was introduced. Safari and physical-device coverage remain unavailable.

Typography was not changed. The earlier Arial finding remains standing; no suppression was added.
