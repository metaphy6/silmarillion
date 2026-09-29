```text
Build the actual playable game in /home/serhatakbak/code/projects/silmarillion using Phaser + TypeScript + Vite. Create, run and test the implementation in this repository. Do not stop at a proposal, scaffold, mockup, art gallery or another prompt.

1. Read the project and preserve its decisions

Read AGENTS.md, current tracking/context, the roadmap and relevant repository instructions. Inspect existing implementation and preserve unrelated changes.

Apply this exact skill before planning or implementing visuals:
.agents/skills/silmarillion-art-direction/SKILL.md

Follow its source hierarchy and applicable art, faction, narrative, UI/UX, token, asset and verification resources under docs/design/art-direction/. Inspect the rendered gallery if available. Some referenced resources may be unfinished: verify their existence and report meaningful gaps instead of inventing their contents.

Current gameplay authorities:
- docs/design/silmarillion-game-report.md — revision 6
- hero-balance-roster.json
- docs/design/hero-balance-roster.md

Current roster inputs:
- hero-kits-valar-v5.json
- hero-kits-peoples-v5.json
- hero-kits-other-v5.json
- hero-kits-named-istari-v6.json

Historical drafts do not override current decisions. Distinguish Tolkien lore from deliberate gameplay adaptations. This request selects Phaser + TypeScript + Vite even if older documents say the engine is undecided.

Preserve the current directory organization. Do not create an output/ folder. Follow repository tracking and staging policies. Do not commit, push, deploy or purchase services.

2. Implement the browser architecture

Use:
- Phaser: isometric map, characters, animation, camera and input.
- Independent TypeScript simulation: turns, combat, economy, production, abilities, AI and rule validation.
- WebRTC: multiplayer commands and match updates.
- Managed signaling: connection establishment and room coordination.
- STUN/TURN: direct connectivity discovery and relaying when direct connections fail.
- Static hosting: HTML, JavaScript, styles and game assets.
- Vite: development and production builds.

The owner must operate only static hosting. Do not introduce an owner-operated production backend, Flutter application or desktop package. Managed connectivity services remain external dependencies; WebRTC does not eliminate them.

Separate simulation, rendering, UI, persistence and networking. The simulation must not depend on Phaser, the DOM, transport or animation clocks. Single-player and multiplayer must use identical rules and command validation.

Use typed serializable commands/events/state, stable entity IDs, seeded stored randomness and deterministic resolution. Define simultaneous-order processing explicitly; network arrival timing must not accidentally determine outcomes. AI submits commands through the same validation interface as players.

3. Preserve and implement the gameplay

Implement all 54 factions and 55 starting profiles. Melkor’s two mutually exclusive doctrines represent one faction and one hero identity, locked for the match.

Preserve exact roster IDs, recipes and identities, including:
- All 14 individual Valar and Sauron.
- Gandalf, Saruman, Radagast, Alatar and Pallando.
- Generic Ember, Grove, Veil, Forge and Star Istari.
- Current Elven clan profiles.
- Exactly three human kingdoms: Gondor, Rohan and Númenor, each with its own fixed hero type.
- Every other group in the authoritative roster.

Factions must have functional differences in production, units, buildings, magic, equipment, combat and counterplay. Do not turn them into cosmetic reskins. Powerful god heroes retain weak city development. Implement adopted offensive and support abilities faithfully.

Each faction has exactly one hero slot. Pending creation/recreation and living captivity occupy it. Creation and recreation require the prescribed resources, component and time. Preserve retained levels/perks without duplicating dropped equipment or creating extra heroes.

Enforce Melkor’s distinction:
- Worldbreaker calls finite, discovered, existing living Balrogs and Dragons along real routes. He cannot create or revive them.
- Dark Architect can additionally create/summon them through paid recipes, queues and capacity.
- Every Dragon form and Balrog obeys only Melkor. Sauron, allies, capture, trade, rings and annexation cannot bypass this.
- Preserve exact activation prerequisites, ownership after hero death and doctrine persistence through recreation.

Keep exactly four stocks:
P — Provisions
M — Materials
K — Lore supplies
E — Essence

Resource-source access differs from stock quantity. Preserve three weekly strategic operations plus one personal hero commitment. Established production queues operate separately.

Validate costs, prerequisites, targets, cooldowns, counters and victory conditions in the simulation. Essential known interface facts must remain available to every faction.

The older fifty hero kits await a separate offensive review. Do not silently redesign them or claim demonstrated balance. Record genuinely unspecified implementation values as provisional; distinguish them from adopted rules.

Provide the complete gameplay loop: faction/doctrine selection, scenario setup, map interaction, settlements, production, research/magic, combat, hero creation/death/recreation, adopted diplomacy, objectives, victory/defeat, save/load, local AI and a playable tutorial.

A representative vertical slice is an intermediate milestone. Complete the current roster rather than quietly reducing final scope.

Label the default scenario “Cross-era sandbox.” Record chronology, geography, available profiles, unique artifact custody and invented connections. Do not imply all factions historically coexisted.

4. Deliver the intended visual experience

Follow the art-direction skill and its actual written rules.

Enormous painterly isometric landscapes must dominate the view. Characters, creatures and objects should be tiny relative to the map, expressive and selectable at normal zoom, with detailed portraits and inspection views.

Use luminous cool terrain, warm inhabited places and faction-specific materials, work and habitats. Convey wonder, grief, humor and hope.

Translate the Disco Elysium influence into original painterly presentation and consequential situated dialogue. Do not copy its assets, likenesses or interface, or introduce an unapproved internal-skill chorus.

Show costs, prerequisites, consequences, uncertainty, turn status, hero occupancy and disabled reasons before commitment. Support keyboard focus/cancellation, scalable text, touch targets and color-independent state cues. Use accessible DOM controls where canvas alone is insufficient. Essential information cannot depend on tiny sprites, hovering or color alone.

Distinguish reference, concept and production assets. Use original releasable game assets. Exclude the source book, extracted text and reference-only artwork from public build files.

5. Implement optional multiplayer properly

Multiplayer is optional for players, but its implementation is part of this project.

Support private 2–4-player turn-based matches using a host-authoritative star topology and reliable ordered WebRTC data channels. One player’s browser hosts the simulation. Clients send orders such as moving a company or casting a spell; each browser renders animations locally.

Provide private invites/rooms, joining, lobby readiness, player-seat identity, compatibility checks, connection status, actionable errors, timeouts and cleanup.

Validate message schemas, payload sizes/rates, identity, ownership, turn/revision and legality. Assign command identifiers/sequences and deduplicate retries, including across reconnection. Never trust client-declared resources or results.

Filter guest snapshots, events, logs and exports to protect hidden information. Keep authoritative host checkpoints distinct from guest saves.

Be explicit about the trust model: the host can inspect and alter authoritative state. Checksums do not make the host trustworthy. This is practical multiplayer for friends, not secure ranked competition.

Keep provider integrations behind adapters. Verify current official documentation and implement a concrete managed signaling/STUN/TURN integration. Include setup instructions and .env.example placeholders.

Browser-exposed Vite variables are public. Never embed private provider API keys or permanent TURN secrets. Identify a managed mechanism for room authorization and short-lived scoped credentials. If a provider requires a separate private token issuer, choose a compatible alternative or disclose the unresolved dependency; do not quietly add an owner backend.

Missing credentials must not prevent local gameplay or implementation of the networking adapter. Clearly report remaining external setup and unexecuted service tests. Manual offer/answer exchange may be a development fallback, not a substitute for normal invitation UX.

6. Design persistence and recovery from the beginning

Save committed turn-boundary checkpoints containing match/scenario identifiers, authoritative state/revision, player assignments, turn/phase, RNG state, command sequence and deduplication data.

Use IndexedDB and validated export/import. Interrupted writes must preserve the last valid checkpoint.

Authenticate returning peers, restore their seat, synchronize appropriate snapshots/events and resolve pending commands exactly once. Define pause, timeout and rejoin behavior.

For version one, host loss stops the match with an explicit checkpoint restoration path. Do not promise seamless migration unless implemented and tested. Closing or suspending the host browser cannot guarantee continued simulation.

Check protocol, save-schema and simulation/rules/content compatibility before joining or resuming. Reject mismatches with actionable messages. Save migration must be explicit; deployment must not silently change a running match’s rules.

Add PWA support only if useful. It may cache offline single-player assets and support installation. Handle cache invalidation and updates between matches without reloading an active game. Do not claim offline internet multiplayer.

7. Keep resource consumption controlled

Use company-level simulation rather than individual-soldier agents, map chunking/culling, zoom-dependent detail, sprite pooling/batching, suitable atlases, compressed assets, baked effects, lazy loading and bounded visual effects.

Cache and budget pathfinding. Separate animation frame rate from turn processing. Add workers only where profiling justifies them.

Define provisional browser/device budgets for loading, memory and frame time. Measure representative large-map scenarios and optimize observed bottlenecks. Do not invent performance results or add unnecessary physics, 3D or backend infrastructure.

8. Execute, verify and deliver

Sequence concrete work in the existing roadmap:
- Inspect the repository and record architectural decisions.
- Build a complete playable vertical slice.
- Complete gameplay and roster coverage.
- Complete multiplayer and recovery.
- Harden performance, accessibility and browser compatibility.

Continue through authorized work rather than stopping after scaffolding. Use safe reversible defaults for minor choices; surface consequential conflicts and unavailable external dependencies honestly.

Provide reproducible development, build, typecheck, lint and test commands, plus static deployment and managed-service setup documentation.

Test meaningful invariants: all profiles, operation budgets, resource validation, hero creation/recreation/captivity, Melkor doctrines and creature exclusivity, AI legality, deterministic replay, save round trips and version rejection.

Browser-test the complete local loop and two-, three- and four-player flows. Cover malformed, duplicate and stale commands; disconnects before acceptance, after commitment and during snapshot transfer; reconnection; host loss; and checkpoint restoration.

Distinguish mocks/local-tab tests from real cross-network WebRTC and forced TURN relay tests. When credentials are available, verify relay connectivity, credential expiration and room access restrictions. Never claim remote reliability without real evidence.

Check Chrome, Firefox and Safari where available, reporting coverage gaps. Inspect actual rendered UI at multiple viewport, zoom and text scales. Run existing art validators where present and distinguish static checks from runtime, accessibility and performance evidence. Do not weaken tests to obtain passing results.

Deliver the runnable implementation, assets, updated current documentation, actual validation results, measured performance, known limitations and precise remaining service setup. Never mark missing mechanics, unavailable service tests or failed checks as completed.
```
