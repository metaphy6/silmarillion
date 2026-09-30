# Browser runtime guide

The repository now contains a runnable Phaser + TypeScript + Vite alpha. It is not the completed full-game implementation. Its default scenario is **Cross-era sandbox**: chronology, artifact custody and invented geographic connections are deliberate scenario adaptations, not claims that all factions coexisted.

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
| `src/render/` | Phaser camera, input, eight-by-eight terrain chunks, visibility culling, reusable tiny markers and cosmetic movement tweens |
| `src/ui/` | Accessible DOM controls, setup/tutorial, inspection, confirmation, turn status and session integration |
| `src/persistence/` | Validated committed authoritative checkpoints in atomic IndexedDB transactions and export/import |
| `src/network/` | Managed/local signaling adapters, reliable ordered WebRTC star topology, host validation, seat identity/rejoin, filtered snapshots and recovery |

Order resolution is an explicit simulation process rather than network arrival order. Rendering interpolates already resolved positions and never advances simulation time. Host-authoritative multiplayer uses the same rules as local play. One player's browser hosts; it can inspect and alter authoritative state. Host loss stops the match, with checkpoint restoration rather than seamless migration.

## Current scope and honest limitations

All 55 exact starting profiles across 54 factions are selectable. One Melkor identity retains its chosen doctrine, and the three human kingdoms retain their fixed heroes. Hero creation, occupancy, death/recreation, source access and creature-exclusivity invariants have runtime tests; tests do not establish balance or imply every adopted mechanic is finished.

The current dispatcher and dedicated command routes are individually listed in [ability coverage](../design/runtime-ability-notes.md). Routing is not full source completion: target qualifications, missing normal domains, incomplete passives and unavailable default-scenario prerequisites remain explicit. The older fifty kits have not been offensively redesigned or demonstrated balanced.

Paid repair and fitting queues, finite cargo and civilian stores, physical loading/travel/unloading, recovery, naval counterplay, finite hunting, cultivated plots, terrain zones, staffed defenses, old woodland trails and mutual-consent diplomacy have integrated rules and regressions. Household ledgers preserve finite people and deposited Provisions; general settlement economies still use faction stocks. Faction output and ordinary numbers are provisional. See [content notes](../design/runtime-content-notes.md).

Original 54 identity portraits cover 55 profiles with one shared Melkor face. Sixteen original painted building/habitat studies are integrated; tiny mobile figures remain procedural and move through cosmetic tweens. The huge landscape painting is atmospheric and does not yet align every feature with authoritative terrain. Three original situated dialogue scenes route through normal paid commands; this is not a complete narrative library. See [asset provenance](../design/runtime-assets.md).


Private multiplayer implementation includes local test signaling and a concrete managed provider adapter. Same-device browser tests are distinct from real internet matches. Scoped provider authorization, short-lived credential guarantees, forced TURN relay and service restrictions remain external requirements; see [Multiplayer](MULTIPLAYER.md). No claim of remote reliability follows from local-tab tests.

## Static deployment

```bash
npm run build
npm run preview
```

Publish **only `dist/`** to static HTTPS hosting. Vite includes imported modules and `public/` assets; never serve the repository root, source novel, extracted text, reference art or private configuration. Inspect the built directory before publication. Root-path hosting is the current configuration; a subdirectory deployment needs matching Vite base and asset-path verification before use.

The owner operates static files only. Managed signaling/STUN/TURN remain external services; WebRTC does not remove them. `.env.example` contains public configuration placeholders. Browser-exposed `VITE_*` values are public and cannot contain private provider keys or permanent TURN secrets. Deployments must preserve protocol/save/simulation/content compatibility; mismatches are rejected rather than silently migrated. No PWA offline-internet-multiplayer claim is made.

Design reports and root roster builders remain separate from Vite. The revision-6 report and structured hero roster retain gameplay authority; historical drafts do not override them. Art-direction resources retain presentation authority. Consult the [roadmap](../planning/ROADMAP.md) before treating an alpha limitation as completed work.
