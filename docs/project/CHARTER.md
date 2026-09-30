# Charter: Silmarillion strategy game

## Vision

A browser faction strategy game with enormous painterly isometric landscapes, tiny expressive figures, distinctive production economies and one fixed recreatable hero per faction. The default **Cross-era sandbox** deliberately joins identities and invented geographic connections from different eras; it is not a canonical historical moment in Beleriand.

## Current scope

The repository contains a playable Phaser + TypeScript + Vite alpha alongside its authoritative revision-6 design. Local play includes faction/doctrine selection, company movement and combat, representative production, hero creation/death/recreation, objectives, AI and committed checkpoint save/load. Optional private 2–4-player multiplayer uses browser-hosted authority, WebRTC and external managed connectivity. The owner operates static hosting only.

All 55 profiles across 54 factions are selectable. This establishes roster identity coverage, not complete gameplay coverage. The current dispatcher has 27 of 110 power handlers, with Worldbreaker Call and Saruman Sentinel using dedicated action routes. Passives, full faction economic trees and the narrative system remain incomplete. Ordinary output statistics are provisional; portraits are shared studies and map figures are procedural. The [runtime guide](../guides/GAME_RUNTIME.md) and [validation report](../reports/runtime/VALIDATION.md) distinguish implementation from evidence and remaining work.

## Authorities and preserved decisions

- [Revision-6 report](../design/silmarillion-game-report.md), [hero roster companion](../design/hero-balance-roster.md) and root `hero-balance-roster.json` own adopted gameplay.
- Four root `hero-kits-*.json` inputs and `build_hero_roster.py` preserve exact identities and Melkor's mutually exclusive doctrines.
- [Art direction](../design/art-direction/README.md) owns source hierarchy, faction materials, presentation, narrative and accessible interaction contracts.
- [Roadmap](../planning/ROADMAP.md) owns sequenced work; unfinished deliverables remain unfinished.

## Architecture and delivery constraints

Simulation, rendering, DOM UI, persistence and transport remain separate. The simulation has typed serializable state/commands, stored seeded randomness and deterministic order resolution. Local AI and remote players use the same command validation. Vite builds static files in `dist/`; deploy only those files. No owner-operated production backend, Flutter application or desktop package is part of this architecture.

Managed signaling, STUN and TURN remain external dependencies. Publishable-key integration does not resolve scoped provider authorization; see [Multiplayer](../guides/MULTIPLAYER.md). The host can inspect and alter authoritative state. Closing the host stops the match; restoration uses an authoritative turn-boundary checkpoint, not seamless migration.

## Success criteria

A complete release must implement and verify the adopted gameplay, roster economics, powers, passives, recovery, accessibility and cross-network multiplayer requirements. An executable alpha, static art checks and profile count alone do not satisfy those gates. Evidence must identify browser/device coverage, provisional values, unavailable service tests and performance measurements separately. Competitive balance requires playtesting beyond contract tests.

## Source and publication boundaries

This is unlicensed Tolkien fan content; a working title and original generated assets do not establish a commercial license. The supplied novel, extracted text and reference-only artwork stay outside public build files. Historical reports and reading notes remain intact as provenance and do not override revision 6. No commit, push, deployment or service purchase is implied by this charter.
