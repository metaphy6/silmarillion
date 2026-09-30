# The Two Fords — real-time transformation

30 September 2026. **Playable representative local slice; not a full-roster conversion.** Launch `npm run dev`, then open `http://127.0.0.1:5173/?mode=rts`. The weekly setup also offers a prominent real-time skirmish link.

## Assessment and implementation decision

The existing Phaser/TypeScript/Vite game already provided the exact 54 factions / 55 profiles, paid recipes, hero identity, private information, save validation, weekly multiplayer and original painted assets. Actual baseline play produced a signature component and resolved a week. Ordinary movement and combat were bound to weekly operation/resolution; the large strategic sidebar and small static scene did not provide direct battlefield command. The baseline capture is [before](runtime/rts-before.png), with [raw measurements](runtime/rts-baseline.json).

Retained the stack, catalog and weekly game. Added a separate deterministic 100ms kernel because accelerating `resolveWeek` would silently alter dozens of weekly production, commitment and diplomacy contracts. The new timing authority is game-report §14; all existing weekly saves remain in their original mode. The first skirmish is Gondor versus Saruman’s White Tower on an original two-ford basin, explicitly **Cross-era sandbox**.

## Delivered loop

Workers extract finite P/M/K/E, visibly carry cargo and credit it only on delivery. They travel to paid construction, contribute work, and physically supply siege ammunition. Farms provide finite provisions; staffed lore production consumes materials. Paid recruitment and FIFO queues reserve capacity. Local AI develops its economy, builds fortifications and siege, defends threats, and launches raids. Both crossings allow bypasses; towers, walls, shield troops and ranged engines support defense and siege. Destroy every hostile stronghold to win; losing the last friendly stronghold loses.

The single living/pending/captive hero slot and full paid component/recreation are enforced. Gondor’s bounded repair commitment and Saruman’s warned lane attack have cooldowns, payment and interruption. Melkor remains restricted to the retained weekly mode until both permanent doctrines and creature contracts are explicitly converted.

Direct controls include click/drag/additive selection, contextual right-click, attack-move, stop, hold, queued orders, control groups, rally points, paid queues, placement previews, configurable hotkeys, pan/zoom, and clickable/orderable minimap. Named selection and coordinate orders provide alternate keyboard access. The contextual HUD exposes costs, prerequisites, progress, cargo/ammunition and hero cooldown; opponents’ private orders, cargo and queues are hidden. Text scales to 200%, motion can be reduced, and ownership/placement feedback uses shapes/text as well as color.

The oblique battlefield integrates original directional figures, new painted siege/fortification and forest atlases, continuous terrain material sampling, animated work/combat/damage/death, staged construction, projectiles and destruction. The asset manifest and `docs/design/runtime-assets.md` record actual generation prompts and limitations. [After normal paid recruitment and worker construction](runtime/rts-after.png); [100-unit synthetic combat capture](runtime/rts-battle.png).

## Reproduce play and verification

1. Begin a real-time skirmish. Workers gather automatically. Recruit workers at the Citadel Hall; spend materials on a defensive tower or workshop rather than spending everything on troops.
2. Select workers with W, choose a building, and click valid ground (or enter X/Y and Enter). Shift queues movement. Train guards/rangers at the mustering hall; the workshop unlocks siege.
3. Select the army with E, attack-move with A, and scout either ford. Preserve workers and build a supply route for siege ammunition. Use Ctrl+1–9/1–9 for groups and the minimap to respond to raids.
4. Craft a signature component and pay the full hero recipe when the economy supports it. Save/reload resumes paused. Settings also supports explicit JSON export/import; weekly saves are rejected with an explanation.
5. The deterministic `wins through paid economy...` test runs the complete ordinary-cost strategy to victory, including construction, recruitment, scouting, defense, siege and reload. Its counterpart leaves the player passive and proves AI defeat pressure. These are simulation policy tests, not a claim of a human-played full match or balance.

Reproduction commands:

```sh
npm run check
npx playwright test tests/browser/rts-play.spec.ts tests/browser/rts-baseline.spec.ts tests/browser/rts-performance.spec.ts
npx playwright test tests/browser/local.spec.ts tests/browser/multiplayer.spec.ts
python3 docs/design/art-direction/validate.py
```

Run performance checks after source edits stop: Vite hot reload resets in-progress scenes. The performance harness suppresses only its HMR websocket, retaining ordinary app modules. Browser-side command timing excludes OS/device latency.

## Measured targets and results

Targets established after the baseline: p95 frame time ≤33.3ms at 100 units, synchronous acknowledgment <50ms, deterministic simulation tick 100ms with no discarded backlog. Forty units represent a small battle; 200 is a stress fixture. The synthetic fixtures use 10,000 HP and extra siege ammunition solely to sustain unit counts, with real navigation/combat/visibility and AI disabled. They do not establish economic balance or normal supply limits.

Measured on Chromium **153.0.8010.47**, headless Phaser Canvas, **1440×1000**, Intel Core Ultra 9 285H, **16 logical CPUs**, **32.57 GB RAM**, Linux 7.0.0-34. This was a shared workstation, not an isolated hardware certification. Raw after data: [rts-performance.json](runtime/rts-performance.json).

| Scene | Units alive | Frame samples | Frame p50 / p95 | Maximum simulation step | Command acknowledgment |
|---|---:|---:|---:|---:|---:|
| Weekly baseline, week 2 | 9 | 180 | 16.7 / 16.8 ms | Not a real-time battle | 7.5 ms handler; 8.4 ms next frame |
| RTS small battle | 40 | 240 | 16.7 / 16.8 ms | 2.3 ms | 3.7 ms |
| RTS target battle | 100 | 240 | 16.7 / 16.7 ms | 4.3 ms | 4.4 ms |
| RTS stress battle | 200 | 240 | 16.7 / 16.7 ms | 11.6 ms | 6.9 ms |

Normal UI paid recruitment acknowledged in **2.9 ms**, next animation frame **12.0 ms**. At tick 126, the ordinary-play capture contained 21 units and a completed paid farm. These short sustained samples meet the stated budgets; they are not a long-duration memory/leak or physical input-latency claim.

Final verification:

- Aggregate `npm run check`: **891 tests in 138 files**, typecheck, lint and production build passed (`rts-check-final--20260930T120544Z-2490395.log`). After the acquisition refactor and one additional regression, **38 affected tests in five files**, full typecheck/lint and build passed (`rts-final-quality--20260930T121335Z-2519823.log`). Current unit inventory: 892; the last full aggregate precedes that one added test.
- **21 distinct Chromium cases** passed across five RTS interaction flows, one baseline capture, one performance/play capture, eight retained weekly local flows and six retained weekly WebRTC cases. The two source-reload interruptions passed after source freeze; no assertions were deleted. RTS networking itself remains disabled.
- Final five RTS browser flows: `rts-final-surface--20260930T121042Z-2511047.log`; weekly recovery: `rts-browser-recovered--20260930T120844Z-2506583.log`; mixed weekly/RTS evidence including retained failures: `rts-browser-final--20260930T120624Z-2499763.log`; optimized performance: `rts-performance-optimized--20260930T121341Z-2521622.log`. Logs live under `/tmp/agent-runs/`.
- **1,829 static art checks**, zero failures, one declared static-check limitation. Source assets and composed normal/battle screenshots inspected. The synchronized design PDF rebuilt successfully as 20 pages using the bundled Python runtime.
- Parent review and independent kernel/renderer review addressed private observations, save occupancy, invisible commands, damage interruption, command targeting, font minimums and the acquisition bottleneck. No commit, push or deployment.

## Remaining scope and limits

- Two profiles are implemented in this RTS scenario; the remaining 53 and every unported power/economy remain explicitly unchecked in the existing roadmap. The full 55-profile weekly mode is retained.
- RTS multiplayer is disabled. Sequenced command rejection, deterministic continuation and filtered snapshots have local regression coverage; authenticated transport/reconnect and 2/3/4-seat RTS play remain future work. Existing weekly WebRTC is separately verified.
- Visibility is radial, not terrain-occluded. Ordinary units have no periodic upkeep here. Captive occupancy is enforced, but capture/rescue initiation, equipment and perk progression, naval systems and diplomacy are not converted. AI uses ordinary armies/siege, not Saruman’s hero.
- Figures reuse original directional masters with runtime articulation; siege has two painted facing views, not a complete independently painted pose strip. Shared scaffold/rubble art is provisional. The forest sheet has edge-reaching canopies, documented as masses rather than inspection-grade botanical masters.
- Navigation uses grid routes, formation destinations, spacing and bounded stuck feedback; the exercised crossing/congestion cases are not a proof against every possible enclosure. Large armies cannot all occupy one destination cell.
- Headless Chromium and manual in-app-browser inspection on this workstation do not certify Safari, physical GPUs/devices, assistive technology, remote networking or competitive balance. Production build retains pre-existing large-chunk warnings.

## Recovery record

Tests were not skipped or weakened. Missing-module TDD failures preceded control implementation. UI and kernel reviews corrected hostile queue/cargo exposure, unreachable routes, hero import/commitment validity and invisible gathering. Full-check initially exposed a winning-policy fixture that neglected the required K supply; the policy now assigns a real worker to lore rather than granting resources. Browser source reloads interrupted two flows; logs show navigation back to setup, and those cases were rerun after freezing source. The performance harness’s zero-height body click was replaced by direct keyboard input; its failed HMR stub was replaced by websocket interception. The design PDF builder required the existing bundled Python runtime and removal of an unsupported internal PDF anchor; the regenerated PDF is synchronized with §14.

Initial performance diagnosis is retained in [pre-optimization data](runtime/rts-performance-before-optimization.json): the 200-unit fixture saturated acquisition at 185.9ms maximum per tick and accumulated 2.3s of simulation debt. The acquisition loop scanned every observer for every candidate of every unit, despite its acquisition radius being inside the acting unit’s own vision radius. The correction removes that redundant visibility scan and avoids acquisition for workers and ordinary move orders; target eligibility and deterministic tie order remain regression-tested.
