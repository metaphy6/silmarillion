# Browser runtime guide

The repository contains a runnable Phaser + TypeScript + Vite local alpha. The retained weekly mode implements the adopted roster mechanics and named production routes; numerical balance and managed internet certification are separate gates. Its default scenario is **Cross-era sandbox**: chronology, artifact custody and invented geographic connections are deliberate scenario adaptations, not claims that all factions coexisted.

Software GPUs identified as SwiftShader, llvmpipe, softpipe or a software rasterizer use the same scene through Canvas, avoiding costly WebGL framebuffer readback. Hardware and unidentified GPUs retain automatic Phaser renderer selection.

## Real-time skirmish: The Two Fords

See the [transformation and measured playtest report](../reports/2026-09-30-rts-transformation.md) for before/after captures, hardware, regression evidence and remaining limitations.

Choose **Play real-time skirmish → Gondor vs Saruman** at setup, or open `?mode=rts`. This is the first continuous two-profile scenario; the other 53 profiles remain in the weekly game. The battlefield runs while you issue commands, with a local AI that gathers, recruits, defends and raids. There are no weekly operation slots in this mode.

- Click a unit/building, drag a selection box, or use **Named battlefield selection**. Shift adds/toggles selection; Shift-right-click queues orders. Right-click ground to move, enemies to attack, resources to gather, construction to build, or an owned siege engine to deliver a paid ammunition reload with workers.
- **A** then click orders attack-move; **S** stops; **H** holds position. **W** selects workers; **E** selects the army; **Home** locates the stronghold. Ctrl+1–9 stores groups; 1–9 recalls them. Hotkeys can be changed in Settings without triggering commands while typing.
- Arrows and middle-drag pan; the wheel zooms. Click the minimap to center, or right-click it to order. Coordinate fields and named command buttons offer a keyboard route to ground orders and placement; Enter places an armed building at the entered X/Y.
- Select the Citadel Hall for workers, components and the sole Citadel Engineer; the Mustering hall recruits guards and rangers. Select workers to build a Siege workshop, farms, lore facilities, towers and walls. Displayed prices are paid immediately; physical construction and queued work take time. A worker's carried stocks are not usable until delivery.
- Select a production building to inspect remaining time, add jobs, cancel the last job for half stocks, or set a rally point. Destroying a facility loses unfinished jobs. Siege engines need real material deliveries after their three rounds are spent.
- Protect your workers and use either ford. Destroy every rival stronghold to win. The loss of your last stronghold ends the skirmish; hero death alone does not.

Pause, Settings and leaving the tab stop local time. **Save skirmish** stores an independent local checkpoint; **Continue skirmish** restores paused. Settings also offers export/import, text at 100/150/200%, reduced motion and hotkeys. Quota/invalid-save errors are explicit. Keep exported files if long-term retention matters: browser storage can be cleared by the user or browser.

The RTS checkpoint version is `silmarillion-rts-1`; it has no inferred weekly migration and never overwrites the old IndexedDB checkpoint. Imports validate structural and gameplay invariants. RTS multiplayer is not enabled; weekly private multiplayer remains a separately labeled mode. Local sequenced-command and private-observation tests are not network certification. Personal hero actions use explicit time, readiness and commitment cooldowns; see the [authoritative amendment](../design/silmarillion-game-report.md#14--adopted-real-time-skirmish-amendment--30-september-2026).

Reproduce the baseline with `npx playwright test tests/browser/rts-baseline.spec.ts`; exercise controls with `npx playwright test tests/browser/rts-play.spec.ts`; run the labeled synthetic performance fixtures with `npx playwright test tests/browser/rts-performance.spec.ts`. Before/after screenshots and measured evidence are in `docs/reports/runtime/rts-*`. Ordinary numerical tuning remains provisional.

## Install and run

Use Node.js 22.12 or newer and npm from the repository root:

```bash
npm ci
npm run dev
```

Open the local Vite address. Local gameplay works without external service credentials. Choose a faction and, for Melkor, a doctrine; begin the sandbox and follow the tutorial. Economy starts component and hero queues, Hero shows slot occupancy, World selects companies and facilities, and Resolve week commits orders. AI uses the same command interface. Three strategic operations and one personal hero commitment are separate from established production queues. Tactical warning/response phases can precede weekly production.

Use the DOM entity list to select tiny world figures, Locate to find the selection, and the zoom buttons or mouse wheel to change scale. Arrow keys pan the map outside focused form controls; right-drag pans. Named controls and confirmation dialogs expose costs and disabled reasons. Settings provides text scaling. Save checkpoints only at committed turn boundaries; pending orders/tactical phases must resolve first. Continue saved match restores IndexedDB state; authoritative export/import is version checked. Guest exports are filtered views and cannot restore a host.

## Verification commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check
```

`check` runs typecheck, lint, Vitest and build. Browser tests are separate:

```bash
# Terminal 1
npm run dev
# Terminal 2, after configuring an available Chromium executable
SILMARILLION_BROWSER_EXECUTABLE=/absolute/path/to/chromium npm run test:browser
```

The current Playwright configuration expects a server at `http://127.0.0.1:5173`; it does not start one. Its default executable path is workstation-specific. For immutable multiplayer UI testing, keep the development server on 5173 for source-module fault injection, run `npm run build` then `npm run preview -- --port 5174`, and set `SILMARILLION_TEST_URL=http://127.0.0.1:5174` when running the browser suite. Performance and fixture-import tests intentionally use the development server; they are not production-bundle tests. Browser installation and additional browser coverage are environment setup, not evidence supplied by passing unit tests. Existing static art checks run with `python3 docs/design/art-direction/validate.py`.

The [validation report](../reports/runtime/VALIDATION.md) records actual checks, measured performance and unavailable tests. This guide deliberately does not freeze test counts while implementation and validation continue.

## Runtime boundaries

| Module | Responsibility |
|---|---|
| `src/simulation/` | Serializable state/commands, rule validation, seeded randomness, deterministic resolution, AI, abilities and version checks; independent of Phaser/DOM/animation/transport |
| `src/content/` | Derived profile/economy data, explicit production catalog and ability contracts; provisional values remain labeled |
| `src/render/` | Phaser camera/input, authoritative terrain masks, bounded terrain chunks, visibility culling and articulated painted figures |
| `src/ui/` | Accessible DOM controls, setup/tutorial, inspection, confirmation, turn status and session integration |
| `src/persistence/` | Validated committed authoritative checkpoints in atomic IndexedDB transactions and export/import |
| `src/network/` | Managed/local signaling adapters, reliable ordered WebRTC star topology, host validation, seat identity/rejoin, filtered snapshots and recovery |

Order resolution is an explicit simulation process rather than network arrival order. Rendering interpolates already resolved positions and never advances simulation time. Host-authoritative multiplayer uses the same rules as local play. One player's browser hosts; it can inspect and alter authoritative state. Host loss stops the match, with checkpoint restoration rather than seamless migration.

## Current scope and honest limitations

All 55 exact starting profiles across 54 factions are selectable. One Melkor identity retains its chosen doctrine, and the three human kingdoms retain their fixed heroes. Hero creation, occupancy, death/recreation, source access and creature-exclusivity invariants have runtime tests; tests establish the exercised invariants, not competitive balance.

The current dispatcher and dedicated command routes are individually listed in [ability coverage](../design/runtime-ability-notes.md). The local completion audit records source-qualified targets, event consumers and counters for every adopted power and passive; provisional tuning and bounded interpretations remain explicit. The older fifty kits have not been offensively redesigned or demonstrated balanced.

Paid repair and fitting queues, finite cargo and civilian stores, physical loading/travel/unloading, recovery, naval counterplay, finite hunting, cultivated plots, terrain zones, staffed defenses, old woodland trails and mutual-consent diplomacy have integrated rules and regressions. Household ledgers preserve finite people and deposited Provisions; general settlement economies still use faction stocks. Faction output and ordinary numbers are provisional. See [content notes](../design/runtime-content-notes.md).

Original 54 identity portraits cover 55 profiles with one shared Melkor face. Sixteen painted building/habitat studies and 22 figure archetypes are integrated. Four independently painted views per archetype supply articulated walk, work and attack frames; companies retain three figures. The authored basin provides the same river, ford, cliff and road masks to traversal and rendering. Original material paint is clipped to those masks; **Rules terrain** remains available for exact tile inspection and color-independent marks. Locally bundled Noto fonts cover the roster’s diacritics. Three situated dialogue scenes route through ordinary paid commands; they are a bounded narrative set. See [asset provenance](../design/runtime-assets.md) and [available browser/visual evidence](../reports/runtime/VALIDATION.md).


Private multiplayer implementation includes local test signaling and a concrete managed provider adapter. Same-device browser tests are distinct from real internet matches. Scoped provider authorization, short-lived credential guarantees, forced TURN relay and service restrictions remain external requirements; see [Multiplayer](MULTIPLAYER.md). No claim of remote reliability follows from local-tab tests.

## Static deployment

```bash
npm run build
npm run preview
```

Publish **only `dist/`** to static HTTPS hosting. Vite includes imported modules and `public/` assets; never serve the repository root, source novel, extracted text, reference art or private configuration. Inspect the built directory before publication. Root-path hosting is the current configuration; a subdirectory deployment needs matching Vite base and asset-path verification before use.

The owner operates static files only. Managed signaling/STUN/TURN remain external services; WebRTC does not remove them. `.env.example` contains public configuration placeholders. Browser-exposed `VITE_*` values are public and cannot contain private provider keys or permanent TURN secrets. Deployments must preserve protocol/save/simulation/content compatibility; mismatches are rejected rather than silently migrated. No PWA offline-internet-multiplayer claim is made.

Design reports and root roster builders remain separate from Vite. The revision-6 report with its scoped RTS amendment and structured hero roster retain gameplay authority; historical drafts do not override them. Art-direction resources retain presentation authority. Consult the [roadmap](../planning/ROADMAP.md) before treating an alpha limitation as completed work.

## Extended playtests

Use a dedicated development server without hot reload so edits cannot reset an active test match:

```bash
SILMARILLION_PLAYTEST=1 npm run dev -- --port 5180 --strictPort
# Separate terminal:
SILMARILLION_DEV_TEST_URL=http://127.0.0.1:5180 npm run test:browser
```

`tests/browser/campaign-soak.spec.ts` plays all 55 profiles through ordinary component/hero creation, twelve weekly resolutions and reload. `tests/campaign-soak.test.ts` runs three deterministic seeds per profile until victory or 64 weeks, plus a separately labeled peaceful economy policy for 64-week persistence. The peaceful policy declines military orders; it is not evidence of a naturally long competitive match. See the [extended playtest report](../reports/2026-09-30-extended-playtest.md).

### Living-world presentation

Recorded own movement now plays along the real route; visible damage, arrival, losses, public control and zone changes have bounded map effects. Birds/mist and working-site gestures are decorative and do not advance turns. Settings → World motion follows system reduced motion or stops all ambient/idle effects; preference is local and persists. Creature work silhouettes remain nonhuman. See [delivery and limits](../reports/2026-09-30-living-world.md).

**Version boundary:** this build is `r6-sim-13-1ba24d66-protocol-2-save-2`. Previous `r6-sim-12-1ba24d66-protocol-2-save-2` saves/peers are rejected; no automatic or manual migration is implemented. Preserve original exports and use their original build to finish those matches. Start a new match for this build. Do not update an active multiplayer match.

### Dream preparation and forest routes

Irmo's **Economy → Rehearsal in Dream** uses an existing paid rest assignment. Completing rest prepares one fear, withdrawal or landing coordination reduction; injury during rest interrupts it. The original following-week expiry and one-use limit survive reload. **Lucid Adaptation** accepts a fresh, nonempty, owned verified night-patrol report once; it replaces the contingency without extra rest, payment or expiry. These three events and this report producer are a bounded implementation, not general foresight.

Oromë's **World → Keep the Wild Road** uses a route created by actual movement. The hero starts at its origin, pays ordinary travel supplies and personally traverses it after a response phase. Only nearby minor convoy harassment is deterred; normal attacks remain effective. Melian's **World → Woodland roads and thresholds** wards an existing wooded supply route for the current week, or veils the trail of an already declared ordinary withdrawal. **Consent to a departing veil** grants/revokes a foreign allied company's specific permission without exporting its route. Own parties use the owner's declaration. A ward needs two owned staffed endpoints and paid markers; close patrol, destroyed markers, cleared cover and captured endpoints counter it. Neither power grants extra travel, cargo or health.

New orders use the standard review/cancel/confirm flow and guest filtering. Midweek state is carried by validated network snapshots; authoritative disk checkpoints remain restricted to committed weekly boundaries. Guest Road expires at that boundary, while a completed dream can remain ready for the following week. No save policy was relaxed. Ordinary travel supplies (1P), marker durability (20HP), local patrol/inspection reach and one-step coordination reduction remain provisional tuning.

### Nienna council and recovery records

**Economy → Council of Repair** records identified ordinary groups injured by actual attacks. Participating owners offer 1–20 existing stocks (provisional courier capacity), invite the existing Nienna seat, and explicitly accept the exact version of the terms. Offers and consent consume no operation or stock; dispatch reserves the agreed stock once and costs one normal operation. Each party must resolve its consent before the other can rely on it. Changed terms clear consent; withdrawal resolves before settlement. Negotiated service is not implemented.

An existing supplied ordinary courier carries the escrow along a surveyed open route within ordinary movement. Hostile occupation, unavailable recipient facilities or withdrawn consent pause delivery. **Cargo drop** frees the courier without refund and preserves the same cargo on the ground; death/capture also leaves recoverable escrow. Recovery requires an existing courier at that physical location and renewed consent. Delivery transfers the cargo exactly once. Nienna then spends 3 readiness and one weekly commitment to settle that grievance while both original groups remain alive in the connected region. New injuries remain separate grievances.

**Leave None Uncounted** retains at most 64 private dated records of known injured, separated allied companies after an actual nearby withdrawal. It does not track later movement, disclose unknown survivors, heal or resurrect. Terms go only to the participating seats and their mutually invited mediator; courier routes/cargo stay private to the payer. Completed council history retires at the 128-record bound only together with empty arrived escrow. Unresolved records are retained; new records at full unresolved capacity are not added.


### Preserved plans and traveling workshops

**Economy → The Remembered Workshop** first requires Vairë's ordinary archive research (10M + 10K, one week) and a personal archive visit. Preserve one equipment plan, then use it only after actual archive destruction. Each replacement production week costs three readiness and a hero commitment; the ordinary equipment queue still needs its full recipe, staff, inputs and time. Death drops the same plan. Its owner can recover it; a nearby opponent can discover and destroy the dropped copy without learning the original archive location or research ledger.

**Economy → Traveling Compact** moves the same existing portable workshop, staff and paid queue between explicitly consenting owned settlements. The carrier pays six existing Provisions (five for the power plus one ordinary loading ration), one operation, three readiness and the weekly hero commitment. Rig and staff occupy finite capacity. Production pauses in transit. Interception leaves the same recoverable workshop and progress; destination refusal prevents dispatch. The latest consent choice in a phase is authoritative. Accompanied first rough-road wear falls from four to three HP; ordinary attack damage is unchanged.

### Local inspections and physical support

**Local knowledge** reports dated observations of nearby real water, plants or tracks. Water channels have explicit draft data; unspecified depth stays unknown. Heavy cargo and passengers increase required draft. **Finite timber harvest** reserves an ordinary worker beside one mature tree for one week, costs 5P + 2M and produces 10M once while consuming that tree. These ordinary numbers are provisional. Neither inspecting a grove nor waiting creates replacement trees.

Staffed worksites have ordinary maintenance wear. Aulë can personally inspect one site for a reduced first event; Gondor bracing affects a nearby defensive structure. Blocked tunnel shafts build airflow pressure, and a locally present Khazad-dûm hero receives warning before the next production penalty. Rough-ground accompaniment, fresh track expiry and scheduled rain consume actual movement and weather events.

**Declared shares** records an Orc company's finite reward before actual participation, then requires the agreed stocks at a real staffed payout site by its deadline. Old disputes remain. Sauron's **Reserved provisions** transfers up to five existing P into one ordinary company's carried reserve; normal upkeep consumes it and loss destroys it. Paid siege engines have a three-round magazine and require physical paid reloading. Preview reserves ammunition, so the same last round cannot fund multiple attacks.

**Visual beacon signals** uses an existing dated report and staffed endpoints. Star must personally traverse and survey the link before its one light-fog exception; storms, heavy fog and solid cover still block it. **Ordinary agent captivity** requires an identified, adjacent, weakened agent with a real current assignment. Captivity preserves the body at the capture site; rescuers must remove the guard. Veil disclosures contain only that assignment and its contacts.

A paid Forge repair kit is consumed alongside normal materials and repair time. Heavy equipment can be carried by a porter or the Troll hero, occupying capacity and slowing ordinary movement until equipped or dropped. Personally treated Estë/Grove patients retain only existing recovery progress through their first eligible evacuation. Prepared Uinen rescue rigging saves deployment delay, with normal transport and capacity still required.

### Remote certification boundary

For this implementation pass, the owner explicitly chose to keep remote certification blocked and finish local work. No provider credentials, room authorization, independent-network participants, forced TURN results or credential-expiration evidence are fabricated. The local adapter and same-device RTC tests remain usable; see the separate managed-service gate in [Multiplayer](MULTIPLAYER.md).
