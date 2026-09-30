## Dream and forest integration — 30 September 2026

Current version is **r6-sim-11-1ba24d66-protocol-2-save-2**. Older version-10 checkpoints and peers are rejected; no migration is implemented. The project remains unfinished: the next mechanics batch is Nienna, Vairë and Avari support.

- `npm run check`: **652 tests / 94 files**, typecheck, lint and production build passed, including all 56 long campaign cases. Evidence: `/tmp/agent-runs/mechanics-final-check--20260930T084200Z-1675010.log`.
- Chromium: **nine passed** — three new dream/forest UI flows and six native local WebRTC cases (fault recovery and 2/3/4 seats). Evidence: `/tmp/agent-runs/mechanics-browser-final--20260930T084318Z-1682186.log`. These use the development server; the production bundle was built separately. Full roster UI campaigns, Firefox, Safari and physical-device checks were not repeated.
- New integration regressions cover paid dream rest, injury/cancellation, real fear/withdrawal/landing consumption, fresh ordinary patrol evidence and single replacement; forest route movement, explicit allied permission/revocation, concealed convoy observations, marker loss and finite harassment. Guest snapshots exclude private plans/routes and allied withdrawal trails. No instant travel, generated cargo or free attacks.
- Inspected desktop forest controls and compact dream controls; retained ordinary review, Escape/focus and scrolling behavior. This is bounded visual evidence, not full accessibility certification. Disk persistence remains restricted to committed weekly boundaries; strict filtered snapshots cover midweek state. Guest Road expires at the weekly boundary while the real convoy continues normally.
- Retained failed runs exposed missing command/schema integration, marker validation, absent consent enforcement and forged dream ownership checks; regressions now pass. Browser fixture failures attempted an uncommitted disk save; fixtures now use legitimate boundaries without weakening checkpoint validation. The earlier full run's stale version assertion was updated for the intentional compatibility fence.
- Application bundle: **1,166.76kB / 295.68kB gzip**; Phaser **1,208.05kB / 330.07kB gzip**. Existing large-chunk and upstream annotation warnings remain. Managed service authorization, independent networks and forced relay remain unverified.

## Living-world follow-up — 30 September 2026

Version for this earlier follow-up is **r6-sim-10-1ba24d66-protocol-2-save-2**. The evidence below this section describes the preceding playtest build unless explicitly refreshed here. Older peers/checkpoints are rejected; no migration is implemented and existing exports are untouched.

- Aggregate: **637 tests / 92 files**, typecheck, lint and build passed (`living-full-check--20260930T080959Z-1565080.log`). A subsequent habitat regression increases the suite inventory by one; final **27 affected tests**, typecheck, lint and production build passed (`living-final--20260930T081735Z-1587412.log`). The complete long soak was not repeated for that visual-only addition.
- Chromium component/render/accessibility checks: **43 passed**. Final four animation plus six native local WebRTC cases also passed (49 distinct cases total), including 2/3/4-seat flows and three interruption cases. Log: `living-final-browser--20260930T081804Z-1589487.log`. The prior 55 full UI campaigns were not rerun on this version; the aggregate simulation campaign soak was.
- Firefox 156.0.1: local hero creation / IndexedDB reload passed again. Static art: **1,702 checks, zero failures, one limitation**. Safari, physical devices and all real managed-service runs remain unexecuted.
- Updated 96×96 / 400-company fixture: load **710ms**, frame p95 **33.4ms**, JS heap **64,187,795 bytes**, eleven chunks / 32,024,608 estimated RGBA bytes. Ten simulation weeks **29.2ms**, 100 path requests **18.2ms**. Raw metrics linked below were refreshed. These are workstation measurements, not GPU-memory or remote reliability claims.
- Current build: application **1,136.41kB / 285.06kB gzip**, Phaser **1,208.05kB / 330.07kB gzip**. Large-chunk/upstream annotation warnings remain.

See [living-world changes and limits](../2026-09-30-living-world.md) and the ordered [remaining implementation plan](../../planning/ROADMAP.md#remaining-implementation-sequence--after-living-world-presentation). Typography remains unchanged; the Arial finding stands without suppression.

# Runtime validation — 2026-09-30

**Status: playable alpha; extended local playtest and hardening gates passed. The complete requested game remains unfinished.** These results do not establish competitive balance or remote reliability. The [extended playtest report](../2026-09-30-extended-playtest.md) records reproduced bugs, retained failed runs, fixes and exact log paths.

## Current checks

| Check | Actual evidence and boundary |
|---|---|
| `npm run check` | 626 tests across 91 files, typecheck, lint and production build passed against the frozen runtime. Log: `/tmp/agent-runs/playtest-frozen-check--20260930T074819Z-1519142.log`. |
| All-profile Chromium campaigns | 55/55 normal setup/component/hero campaigns, twelve weekly resolutions and IndexedDB reload each: 660 weeks. No fixture resource grants. |
| Chromium component and recovery suite | 45 distinct cases passed: 42-case local run plus three fault cases from the six-case fresh-production multiplayer rerun. Combined with campaigns: 100 distinct browser cases. |
| Simulation campaigns | 165 ordinary seeded AI campaigns, 2,998 resolved weeks; three separately labeled peaceful four-seat economies, 192 weeks. Deterministic replay, save validation and guest projection checked. [Evidence](campaign-soak.json). |
| Firefox 156.0.1 | Local hero creation and IndexedDB reload passed via native BiDi DOM-dispatched controls. Pointer/keyboard and multiplayer not tested. [Record](firefox.json), [capture](firefox-local.png). |
| Safari / physical mobile | Unavailable; no runtime certification. |
| Static art | 1,700 checks passed, zero failures, one declared limitation; does not establish rendered usability or accessibility. |

Browser component flows cover paid tools/refitting and research, finite Rohan remount breeding, scout training, repairs, injury care, crops, cargo, naval landing, fieldworks, formations, declared charges, tactical responses, dated intelligence, dialogue, objectives and portrait loading. Isolated component fixtures are distinct from normal all-profile campaigns. Compact viewport, 200-percent text, Escape cancellation and select-focus retention passed. These are bounded checks, not a complete accessibility audit. [Desktop](local-1440.png), [compact](compact-390.png), [rules overlay](rules-terrain.png).

## Networking and recovery

The six local Chromium multiplayer cases passed in the recorded integrated browser run: two-, three- and four-tab UI flows plus interruptions before acceptance, after commitment and during a partial first welcome. They use real reliable ordered RTCDataChannels with same-device BroadcastChannel signaling. Fault cases verify rejoin, exactly-once command acceptance and restoration from a committed authoritative checkpoint. Manual host save/export retains guest seat credentials. Source-module fault injection uses the development server; multiplayer UI cases can use an immutable production preview. Do not conflate those build environments.

An earlier four-player stress run reproduced two reconnect failures in ten attempts. The host connection-cap race was fixed with one bounded temporary handshake slot and authenticated retirement of the superseded connection. A subsequent ten-run stress test passed all ten. See [multiplayer implementation and evidence](../../guides/MULTIPLAYER.md) for the earlier bundle-version boundary and test details.

Unit regressions cover malformed, oversized, duplicate, stale and unauthorized orders; interrupted snapshot cleanup; preserved first-welcome credentials; late transport callbacks; expected-host signaling; bounded ICE queues; filtered inventories and repair queues; visible neutral equipment recovery; save compatibility and round trips; invalid metadata and oversized writes preserving the previous checkpoint. A 1,000-message malformed/oversized flood produces no full-state broadcast or render amplification and causes a bounded disconnect after the message-rate threshold. This is not a claim of comprehensive denial-of-service resistance.

The host remains trusted: it can inspect and alter authoritative state. Guest filtering and checksums cannot make it trustworthy. Host loss stops the match; restoration requires a committed host checkpoint, without seamless migration. Guest exports are filtered and cannot serve as authoritative restoration checkpoints.

**Not executed:** real managed signaling, independent-network 2–4-player matches, forced TURN relay, provider credential expiration and provider-enforced room restrictions. No production credentials were available. Mocked SDK tests are not service evidence. Firefox multiplayer and all Safari checks also remain open.

## Current performance

Actual Phaser fixture: 96×96 tiles and 400 companies at 1440×1000, 120 frame samples on headless Chromium. Load **621ms**, frame p50 **33.3ms**, p95 **33.4ms**, JS heap **68,103,917 bytes**. Eleven cached terrain chunks account for **32,024,608 estimated RGBA bytes**. Provisional targets remain load under 8s, heap under 256MiB and frame p95 34ms; the existing regression tolerance is under 50ms. [Raw metrics](large-render.json), [capture](large-map.png).

Sixteen rules-overlay/camera cycles retained at most sixteen terrain textures, **46,581,248 estimated RGBA bytes**. This counts texture allocations, not GPU/driver memory. [Cache soak](terrain-cache-soak.json). Separate simulation fixture: ten weeks on a 96×96 map with 400 companies took **29.3ms total**, 100 pathfinding requests **17.6ms**; default scene p95 **33.4ms**. [Metrics](performance.json).

Earlier 50ms frame failure and its correction remain in the [performance diagnosis](../2026-09-30-renderer-performance.md). Current workstation results do not establish mobile, Firefox/Safari or every wide-zoom case. Animation does not advance simulation. Production build retains large-chunk warnings: application 1,126.05kB / 281.60kB gzip; Phaser 1,208.05kB / 330.07kB gzip. Upstream Zod annotation warnings remain nonfatal.

## Gameplay and visual completion boundary

All 55 exact profiles across 54 factions are selectable; Melkor's doctrines remain one mutually exclusive faction/hero identity. Normal UI campaigns exercised every hero recipe. Unit tests cover operation budgets, four stocks versus source access, hero occupancy/recreation/captivity, Melkor creature exclusivity, AI legality, command validation, deterministic resolution and checkpoints. These do not prove complete faction mechanics or balance.

The [ability ledger](../../design/runtime-ability-notes.md) remains authoritative for implemented versus incomplete routes. Forest, dream-preparation and council modules still require engine/UI integration; Vairë/Avari support, remaining source qualifications and passive consumers remain unfinished. The older fifty kits still await a separate offensive review. Ordinary economic/combat values remain explicitly provisional.

Original identity portraits, building studies and a 16-archetype painted world-figure atlas are integrated; some creature silhouettes and animation remain provisional. The atmospheric painting does not align with all simulation terrain. **Rules terrain** exposes the actual tiles with color-independent symbols; it does not finish terrain art. More situated dialogue and production assets remain necessary. [Content limits](../../design/runtime-content-notes.md), [asset provenance](../../design/runtime-assets.md). **Cross-era sandbox** deliberately adapts chronology and geography, rather than claiming historical coexistence.

## Remaining service setup and reproducibility

Local play needs no credentials. For the implemented managed adapter, create a Metered account, enable TURN and publishable-key auto-injection, limit dashboard channel patterns to `silmarillion-*` and required subscribe/presence/send actions, and configure only `VITE_METERED_PUBLISHABLE_KEY`. `.env.example` also exposes optional `VITE_FORCE_TURN` diagnostics. Never embed private API keys, private JWT signing material or permanent TURN secrets in browser variables. Serve only the built `dist/` over static HTTPS.

**The production authorization requirement remains unresolved:** a Metered publishable key grants shared provider permissions and does not establish per-user room authorization or verified short-lived scoped TURN credentials. Expiring scoped JWT issuance requires private credentials. A compatible externally operated policy/credential mechanism must be secured; adding an owner-operated token function would violate the chosen architecture. Current official alternatives audited did not establish a turnkey compliant replacement. See [setup and official sources](../../guides/MULTIPLAYER.md).

From the repository root:

```bash
npm ci
npm run dev
# Separate terminal:
npm run check
SILMARILLION_BROWSER_EXECUTABLE=/absolute/path/to/chromium npm run test:browser
python3 docs/design/art-direction/validate.py
```

The browser suite defaults to Vite on port 5173. For extended sessions run `SILMARILLION_PLAYTEST=1 npm run dev -- --port 5180 --strictPort` and set `SILMARILLION_DEV_TEST_URL=http://127.0.0.1:5180` for the browser runner to avoid HMR interruptions. To validate immutable multiplayer UI, build and run `npm run preview -- --port 5174`, then set `SILMARILLION_TEST_URL=http://127.0.0.1:5174`; keep development Vite available for source-module fault fixtures. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` separately when diagnosing a failing aggregate gate. No publication, service purchase, commit or push is part of these checks.
