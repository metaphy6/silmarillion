# Runtime validation — 2026-09-30

**Status: runnable alpha; the requested complete game is not finished. Final integrated checks are pending while implementation continues.** Results below describe particular runs, not certification of later edits. The coordinating agent must update this report after the final build and browser run. No remote reliability or demonstrated gameplay balance is claimed.

## Recorded checks

| Check | Actual evidence and boundary |
|---|---|
| Latest frozen `npm run check` | 489 tests across74files passed, plus typecheck, lint and production build. Log: `/tmp/agent-runs/phase-frozen-aggregate--20260929T234633Z-1236125.log`. Subsequent remaining-roster work needs another final aggregate gate. |
| Full frozen Chromium suite | 37/37 passed including local gameplay, paid physical domains, civilian conservation, dialogue, portraits, 2/3/4-player same-device nativeWebRTC, reconnect faults and performance. Log: `/tmp/agent-runs/phase-full-browser--20260929T234708Z-1241432.log`. UI multiplayer used fresh immutable production preview5174; source-injected domain/fault tests used5173. |
| Identity portraits | Seven Chromium UI flows and two asset-contract tests passed. Actual atlas crops inspected across all five atlases, both Melkor doctrines and a compact spider view; no neighboring-cell bleed. Only selected atlas loads. Log: `/tmp/agent-runs/portrait-browser-stable--20260929T223455Z-1013330.log`. Initial bootstrap test failure was caused by the then-missing navalRoute export and resolved before this passing run. |
| Latest scoped networking/persistence | 30 tests passed; global typecheck and scoped network lint passed. Logs: `/tmp/agent-runs/network-repair-final--20260929T213021Z-837565.log`, `network-repair-types--20260929T213022Z-838754.log`, `network-repair-lint--20260929T213024Z-837564.log`. |
| Integrated Chromium browser run | 10 of 11 passed; actual large-map renderer failed its unchanged `<50ms` frame p95 assertion at exactly 50ms. Log: `/tmp/agent-runs/current-browser-suite--20260929T212304Z-816376.log`. The failed gate is retained as evidence. |
| Targeted renderer correction | Actual large-map renderer passed after terrain caching and removal of framebuffer multisampling; p95 33.4ms. Log: `/tmp/agent-runs/terrain-no-msaa-browser--20260929T212928Z-834585.log`. This targeted pass does not substitute for a final integrated rerun. |
| Firefox 156.0.1 | Native WebDriver BiDi exercised hero creation and IndexedDB reload successfully. Controls were DOM-dispatched through real handlers; pointer/keyboard compatibility and multiplayer were not tested. Latest frozen rerun: `/tmp/agent-runs/phase-firefox--20260929T235023Z-1245934.log`. See [record](firefox.json) and [capture](firefox-local.png). |
| Safari | Unavailable in this environment; no runtime or compatibility result. |
| Static art checks | 1,689 checks passed,0failures,1declaredlimitation. Log: `/tmp/agent-runs/building-art-validator--20260929T234046Z-1214657.log`. Originalbuildingatlas integrated and rendered withoutbrowsererrors; staticchecks do not establish runtime/accessibility. |

Local Chromium tests cover hero creation, AI resolution, save/restore, visible objective victory, compact viewport, 200-percent text and keyboard cancellation. Screenshots include [desktop](local-1440.png) and [compact](compact-390.png). These are bounded flows, not a complete accessibility audit, touch-device certification or all-faction playthrough.

## Networking and recovery

The six local Chromium multiplayer cases passed in the recorded integrated browser run: two-, three- and four-tab UI flows plus interruptions before acceptance, after commitment and during a partial first welcome. They use real reliable ordered RTCDataChannels with same-device BroadcastChannel signaling. Fault cases verify rejoin, exactly-once command acceptance and restoration from a committed authoritative checkpoint. Manual host save/export retains guest seat credentials. Source-module fault injection uses the development server; multiplayer UI cases can use an immutable production preview. Do not conflate those build environments.

An earlier four-player stress run reproduced two reconnect failures in ten attempts. The host connection-cap race was fixed with one bounded temporary handshake slot and authenticated retirement of the superseded connection. A subsequent ten-run stress test passed all ten. See [multiplayer implementation and evidence](../../guides/MULTIPLAYER.md) for the earlier bundle-version boundary and test details.

Unit regressions cover malformed, oversized, duplicate, stale and unauthorized orders; interrupted snapshot cleanup; preserved first-welcome credentials; late transport callbacks; expected-host signaling; bounded ICE queues; filtered inventories and repair queues; visible neutral equipment recovery; save compatibility and round trips; invalid metadata and oversized writes preserving the previous checkpoint. A 1,000-message malformed/oversized flood produces no full-state broadcast or render amplification and causes a bounded disconnect after the message-rate threshold. This is not a claim of comprehensive denial-of-service resistance.

The host remains trusted: it can inspect and alter authoritative state. Guest filtering and checksums cannot make it trustworthy. Host loss stops the match; restoration requires a committed host checkpoint, without seamless migration. Guest exports are filtered and cannot serve as authoritative restoration checkpoints.

**Not executed:** real managed signaling, independent-network 2–4-player matches, forced TURN relay, provider credential expiration and provider-enforced room restrictions. No production credentials were available. Mocked SDK tests are not service evidence. Firefox multiplayer and all Safari checks also remain open.

## Performance measurements

The actual Phaser renderer fixture is 96×96 terrain tiles with 400 company markers at 1440×1000, sampled for 120 frames on headless Chromium. The corrected run measured load553ms, p5033.3ms, p9533.4ms and JavaScript heap67,653,851bytes. Eleven visible cached chunks account for 32,024,608 RGBA bytes; heap does not include complete GPU/driver memory. Provisional targets are load under 8 seconds, heap under 256MiB and frame p95 34ms. See [raw metrics](large-render.json), [capture](large-map.png) and [diagnosis](../2026-09-30-renderer-performance.md).

The separately recorded simulation fixture processed ten weeks on a 96×96 map with 400 companies in 20.3ms total (2.03ms/week); 100 pathfinding requests took 13.5ms. Its latest default-map frame sample recorded p95 33.4ms. Earlier runs recorded p95 50ms; those failures and the terrain raster correction remain in the diagnosis document. See [separate simulation/default-render metrics](performance.json).

These workstation measurements do not establish mobile, wide-zoom, physical-device, Firefox or Safari performance. Terrain textures are bounded to sixteen chunks; the wider-view Graphics fallback still needs profiling. Animation does not advance simulation time.

## Gameplay completion boundary

All 55 starting profiles across 54 factions are selectable, preserving the two mutually exclusive Melkor doctrines under one faction identity. Runtime tests exercise operation budgets, four stocks versus source access, hero occupancy/creation/death/recreation, Melkor creature ownership restrictions, AI legality, deterministic resolution and checkpoint validation. Roster presence and invariant tests do not prove complete faction mechanics.

The current [ability ledger](../../design/runtime-ability-notes.md) records 36 of 110 dispatcher handlers and 15 earlier dedicated command routes, with intelligence, recovery, crop and naval routes being integrated and tested. The earlier 51 routed / 59 unavailable snapshot is being expanded; neither registered handlers nor new domain modules establish complete roster coverage. Selected equipment-wear passives now have consumers, but most passive execution remains missing. Registered handlers may require entities or conditions absent from the default scenario; unsupported powers are disabled with explicit reasons. The older fifty hero kits have not undergone the separate offensive review, and no balance claim is supported.

Ordinary faction outputs, buildings, equipment and economic differences use explicitly provisional runtime values. Paid repair, durability, physical convoy loading/travel/unloading, recovery/rerouting, terrain zones and bilateral diplomacy now have integrated regression coverage. Full production/equipment/research trees, settlement-local transport inventories, all ability counters, consequential situated dialogue and finished production art remain incomplete. The 54 original identity portraits cover all 55 profiles; flattened portrait atlases and procedural map silhouettes still do not constitute the requested final painted character/building animation atlas. Consult [content limits](../../design/runtime-content-notes.md) and [asset provenance](../../design/runtime-assets.md). The default **Cross-era sandbox** is a deliberate chronology/geography adaptation, not a historical coexistence claim.

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

The browser suite expects Vite on port 5173. To validate immutable multiplayer UI, build and run `npm run preview -- --port 5174`, then set `SILMARILLION_TEST_URL=http://127.0.0.1:5174`; keep development Vite available for source-module fault fixtures. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` separately when diagnosing a failing aggregate gate. No publication, service purchase, commit or push is part of these checks.

The 216-test integrated typecheck/lint/test/build snapshot passed. Browser repair/rerun after current edits and current art-validator evidence are **pending**; the latest expanded local browser gate remains failed under diagnosis. Unavailable service/browser tests and missing mechanics remain incomplete even if local gates become green.
