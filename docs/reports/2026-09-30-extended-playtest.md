# Extended playable audit — 30 September 2026

Status: local validation passed; final review complete. This report covers a hardening pass on the playable alpha, not completion of every revision-6 mechanic, art asset or managed service requirement.

## Campaign sessions

- **55 real Chromium UI campaigns**: every exact starting profile selected from the normal setup screen; ordinary signature component and hero recipes; twelve weekly resolutions; hero occupancy and four stocks; IndexedDB reload at week 13. All 55 passed, 660 played weeks, approximately nine minutes. No stocks, terrain or heroes were injected into these campaigns. Log: `/tmp/agent-runs/playtest-all-profiles--20260930T073658Z-1464811.log`.
- **165 deterministic simulation campaigns**: all 55 profiles against an ordinary opponent for seeds 7, 29 and 113. Actual AI commands use the common validator, with repeated checkpoint replay and guest projection validation. These campaigns naturally ended after 10–38 weeks: 2,998 resolved weeks. This is invariant testing, not a balance study.
- **Three 64-week peaceful economies**: four seats, normal resources and production, military orders deliberately declined. These add 192 actual weeks and test long-lived state without disabling victory rules. They are explicitly distinct from unfiltered AI matches. Combined simulation evidence: [campaign-soak.json](runtime/campaign-soak.json).
- Interactive in-app inspection exercised tutorial presentation, real component/hero review, paid queues and visible budgets. Automated pointer/keyboard checks remain separate from this small manual sample.

## Reproduced defects and corrections

| Priority | Reproduction / consequence | Correction and regression evidence |
|---|---|---|
| P1 | Interrupted equipment work left a duplicate union separator and optional facility IDs passed to required queue checks; application typecheck failed. | Repaired syntax and narrowing; equipment, remount and watch command/checkpoint tests cover the completed integration. |
| P1 | A concealed formation crossing a posted garrison's route was tested as bare coordinates and produced a report. | Observation now tests the actual unit with its concealment effects; hidden crossing regression fails before the change. |
| P1 | After 260 movements, bounded survey history evicted a route still referenced by an assigned garrison and broke saving. | Retain referenced garrison/current-watch surveys inside the same 256-record cap; explicit private archive-full notice when no entry is evictable. |
| P1 | `tool-breach` / `tool-repair` existed in the rules but were missing from the sole Economy recipe list. Normal users could never unlock tools. | Added both recipe keys; browser flow purchases both research queues, produces a tool and performs Nogrod refitting before reload. |
| P2 | Canceled, blocked or expired fallback orders left an active `declared-fallback` effect. | All exits use the existing release cleanup; no phantom withdrawal remains available to powers. |
| P2 | Crafted saves could associate a dark shift with another owner's funded job, or give a relay receipt a different owner/destination/report date. | Validate relationships against the actual job/message and its immutable source date. |
| P2 | An older partial snapshot could complete after a newer one and roll back guest state. | Monotonic revision/seat-sequence protection and connection-scoped snapshot ordinals reject stale transfers, including equal-revision lobby updates; reconnect resets only the connection ordinal. |
| P2 | Empty, duplicated or missing saved seat credentials and duplicate peer assignments were accepted. | Reject ambiguous returning identities; 64 host restorations and 192 duplicate retries preserve exactly-once commands. |
| P2 | Prepared ranged-shot review was overwritten by pursuit-only instructions. | Distinct review branch; browser checks correct shot description and cancellation. |
| P2 | Entity, facility and text-size selections lost keyboard focus after rerender. | Restore focus to the replacement select; actual keyboard/focus regression covers all three. Escape also closes/removes its dialog and restores the opener. |
| P2 | Night work, scouting and equipment domain controls existed as modules but were not attached to the actual application. | Connected panels, command builders and exact cost reviews; browser scout training and finite remount breeding/reload pass. |
| P2 | Atmospheric rivers/woods do not match simulation tile geometry, making route interpretation unreliable. | Added explicit opt-in **Rules terrain** with different grass/tree/wave/square/chevron marks and text legend. The underlying painting mismatch remains open. |
| P2 | Same-match terrain changes could leave baked terrain chunks stale. | Terrain identity stamp invalidates changed chunks while identical snapshots reuse them; tests cover mutation and idempotent overlay toggles. |
| P3 | Runtime figure atlas reused the concept SVG's manifest ID. | Gave the runtime atlas its own unique ID; all 1,700 static art checks pass. |

## Coverage boundaries

Existing tests cover paid repair, injury care, crops, ship transport/landing, physical cargo, fieldworks, creature exclusivity, captivity/recreation, diplomacy, objectives, conservation, deterministic resolution, command validation and filtered guest state. Passing a module test does not prove an unintegrated ability can be used through the UI. Forest, dream-preparation and council modules still have integration work; Vairë/Avari support and remaining source qualifications remain on the implementation roadmap.

Real managed cross-network connections, forced TURN, credential expiration and provider room restrictions are not tested because compatible scoped authorization remains unresolved. Local-tab native WebRTC is useful transport evidence, not internet reliability. Safari and physical mobile devices are unavailable. Firefox's existing BiDi runner dispatches DOM controls; it does not certify pointer/keyboard or multiplayer behavior.

## Failed runs retained

- Initial browser baseline: 12/14 passed; two tests were interrupted by Vite reloads while source was being edited. A dedicated `SILMARILLION_PLAYTEST=1` server disables HMR; no assertions were removed.
- Attempting to stub the Vite client prevented application boot because transformed modules need its exports. The stub was removed; server-level HMR configuration is used instead.
- Campaign harness initially starved Vitest's worker RPC during long synchronous work. It now yields each simulated week. An initial longevity assertion also assumed competitive AI would last 60 weeks; natural victory at week 30 disproved that assumption. Unfiltered campaigns remain intact, and longevity uses a separately labeled peaceful policy with normal rules.
- An isolated tool UI fixture incorrectly copied the engineer role onto a hero and was correctly rejected by save validation. The fixture was corrected; production validation was preserved.
- The art validator found the duplicate concept/runtime asset ID before its correction.

## Final integrated gates

- `npm run check`: **626 tests / 91 files passed**, typecheck, lint and production build passed. Log: `/tmp/agent-runs/playtest-frozen-check--20260930T074819Z-1519142.log`.
- Chromium: **55 campaign cases + 45 distinct component/performance/network cases passed**. The 42-case local run covered every non-fault case; the separate six-case networking run repeated three UI cases against the refreshed production build and added the three fault cases. This is 100 distinct browser cases, not 103. Logs: `/tmp/agent-runs/playtest-browser-local--20260930T074820Z-1519232.log` and `/tmp/agent-runs/playtest-final-network--20260930T075216Z-1531761.log`.
- Firefox **156.0.1**: local hero creation and IndexedDB reload passed through native BiDi DOM dispatch. Log: `/tmp/agent-runs/playtest-final-firefox--20260930T075218Z-1531893.log`.
- Art validation: **1,700 static checks, zero failures, one declared limitation**. Log: `/tmp/agent-runs/playtest-final-art--20260930T075302Z-1533641.log`.
- Actual 96×96-map / 400-company Phaser fixture: **621ms load**, **33.4ms frame p95**, **68,103,917 bytes JS heap**; eleven cached terrain chunks account for 32,024,608 estimated RGBA bytes. Sixteen overlay/camera cycles retained at most sixteen textures / 46,581,248 estimated RGBA bytes. These are workstation measurements; GPU/driver memory is not measured. [Large render](runtime/large-render.json), [cache soak](runtime/terrain-cache-soak.json).
- Separate simulation fixture: ten weeks / 400 companies in **29.3ms total**, 100 pathfinding requests in **17.6ms**. [Raw metrics](runtime/performance.json).
- Build retains large-chunk warnings (application 1,126.05kB, Phaser 1,208.05kB before gzip) and harmless upstream Zod annotation warnings. No warning threshold was raised.
- Screenshots reviewed at desktop, compact/200-percent text, landscape and rules-overlay views. [Painted world](runtime/painted-world.png), [rules terrain](runtime/rules-terrain.png), [compact view](runtime/compact-390.png). The map painting mismatch remains visible and unresolved; the overlay is an inspection aid.
- Read-only peer review found the missing tool-research UI routes and equal-revision snapshot ordering before correction; final networking review found no new actionable issue. No tests were skipped or assertions weakened.

The earlier font hook's Arial finding remains standing: this pass made no typography change and added no suppression. No new design-hook finding was silently dismissed.
