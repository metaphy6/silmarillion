# Verification record — 29 September 2026

This record distinguishes **measured/static checks**, **human-style visual judgment**, and **future runtime/playtest work**. It does not certify a game implementation. The work extends the staged documentation reorganization; original rules, kits, book, historic notes and generated roster were preserved.

## Reproduce

From the repository root (confirm `pwd` first):

```bash
bash xops/agent/safe-run.sh art-package-selftest -- python3 docs/design/art-direction/validate.py --self-test
bash xops/agent/safe-run.sh art-package-static -- python3 docs/design/art-direction/validate.py
```

`validate.py` uses the standard library for data, hashes, PNG chunk CRC/dimensions, SVG, local links, contrast, exact roster coverage and route checks. Python 3.11+ supplies TOML parsing. Installed PyYAML parses YAML metadata; if absent, the script reports that limitation instead of claiming parsing success. It does not mutate sources, regenerate the roster or access the network.

To refresh screenshots, use an **existing** Playwright installation and browser; no installer is part of this package:

```bash
SILMARILLION_PLAYWRIGHT_MODULE=/path/to/installed/playwright \
SILMARILLION_BROWSER_EXECUTABLE=/path/to/installed/chrome \
bash xops/agent/safe-run.sh art-gallery-render -- node docs/design/art-direction/render-gallery.mjs
```

These environment names are local renderer options, not Codex configuration keys. Without overrides it resolves the environment's installed `playwright` module/browser. This run used the app-bundled Playwright module and existing `/snap/chromium/current/usr/lib/chromium-browser/chrome`; the bundled headless browser binary was absent. No OS package was installed. After refreshing evidence or art, update the corresponding manifest dimensions/hash and rerun the static gate. Screenshot PNGs are full-page captures from the declared viewport; some pages extend below its 900px height.

## Measured and static scope

| Check | Result / evidence |
|---|---|
| Roster coverage | Exact 55 profile IDs and faction/name mappings against root JSON; 54 factions, 12 visual families, 7 domains/profile (385 populated treatments). Source-agent gate passed. |
| Research structure | 20 unique DE reference IDs with creator/title/URL/access date/locator/type/observation/interpretation/consequence and honest access mode; source ledger adds PROJECT/LORE references. |
| Functional tokens | 19 permitted color pairs calculated using sRGB relative luminance; all declared thresholds pass. Lowest declared pair: border on raised surface, 3.877:1 (control boundary, threshold 3). Normal text pairs meet 4.5:1. |
| Asset availability | 3 original generated paintings, 4 original SVG studies and 8 rendered evidence images in the manifest; actual dimensions, alpha declarations, hashes, PNG CRC and SVG parsing checked. 385 future domain requirements are explicitly `specified-not-produced`. |
| Gallery render | Five views rendered at 1440×900 viewport; all image loads succeeded; no console/request errors. Compact 1024px and 200% text cases checked on all five views for horizontal overflow. [Machine report](gallery/evidence/render-checks.json). |
| Controls and text | Visible buttons/selects measured ≥44px on both axes; reference-view paragraph/button text ≥14px. Tab/Enter view activation and visible 3px focus ring checked. Overlay checkbox hides/restores warning; dialogue demo updates reply. [Focus render](gallery/evidence/keyboard-focus-1440.png). |
| Typography coverage | Fontconfig character ranges for installed Noto Sans and Noto Serif contain all letters in “Númenor Fëanor Aulë Eönwë Lórien”; this is glyph coverage, not all-language shaping or target-platform proof. |
| Agent integration | Skill metadata validates; 5 Codex TOMLs, 6 YAML headers parse; existing parsed config fields except appended developer instructions preserved. Explicit routes in common/vendor files and eight role files. [Discovery matrix](discovery-matrix.md). |
| Local links | Validator checks the package and touched entry/index/role Markdown plus HTML paths. External links retain per-source access status; URLs are evidence locators, not a promise of permanent availability. |

The completed static gate passed **1,582 checks with zero failures**, and six validator self-tests passed. A later concurrent review read a refreshed map screenshot before its manifest update; refreshing its measured dimensions/hash resolved that expected synchronization failure. Exact counts are emitted by the validator and can change when documentation links are added. Logs: `/tmp/agent-runs/art-package-final--20260929T200118Z-671911.log` and `/tmp/agent-runs/art-validator-selftest--20260929T195652Z-668739.log`. The single static-tool limitation concerns external URL reachability, fragment targets and rendered layout; those require the recorded source/visual evidence. Existing unrelated scaffold links and placeholder roadmap phases are not a claim of game infrastructure readiness.

## Visual review and corrections

The coordinating agent inspected the original Brethil plate, all three new paintings and all five composed gallery views. The research agent independently inspected the five composed views and the 1024px/200% local render. The source agent inspected twelve supplied-PDF pages (37, 39, 59, 70, 183, 242, 383, 442–446); exact passage scope is in [source authority](source-authority.md). Research imagery/talk scope is in [reference index](reference-index.md), not inferred from search snippets.

Initial render exposed CSS background images captured before loading and two overlapping labels. Preload/decode synchronization and label positions were corrected; all five studies were rerendered. Review also clarified captive-state branches, changed ambiguous “paid inputs retained” to “inputs paid upfront”, added actual facility states, corrected Aulë's alt description to the displayed crop, and added orientation indicators. None changed gameplay.

Visual judgment: the strategic scene retains broad readable land and tiny habitation; local view has an explicit cost chain and continuing work; faction portraits differ by material, posture and economy; map patterns/text distinguish route, uncertainty, supply and warning; dialogue uses original voice around a specific repaired object. No source painting or character likeness is copied into production. The [annotated successful/rejected example](gallery/evidence/review-examples-1200.png) makes low contrast, tiny targets and incorrect mechanics visible as failures.

Generated workers vary in painted size. The art plates establish atmosphere/scale relationships but **do not meet a calibrated sprite specification**. The portrait sheet's lower figures are enlarged costume studies. A separate SVG strip demonstrates the proposed 14px silhouette and 44px target. Concept paintings are flattened RGB at 1672×941 and 1536×1024, not layered production masters. These limitations are in the manifest and asset contracts.

## Deferred validation and open choices

- A concurrently added [saved implementation handoff](../../project/INITIATE.md) names Phaser + TypeScript + Vite; it was absent from initial inspection and is preserved without execution. No actual game runtime is present. Camera implementation, rotation, touch/controller mappings, streaming/compression and frame-rate/memory budgets still need runtime decisions. HTML here is a portable inspection artifact.
- Camera pitch/yaw, figure-size targets, density and panel proportions require prototype tests; player click accuracy and occlusion cannot be proven by the static gallery.
- Game-state transitions, hidden-information security, simultaneous actions, inventory identity, queue reservations, captivity, Melkor command exclusivity, objective eligibility and duplicate submissions require actual runtime tests.
- Full keyboard world navigation, assistive-technology operation, localization, dyslexia/vision user studies, audio captions/mixing, color-vision use and touch/physical-device targets require real user and engine checks. This gallery's successful text scaling is a bounded check, not complete accessibility certification.
- Balance has not been tested. Numeric recipes and hero kits are current proposals; the older fifty kits still await their separate offensive review.
- Supplied lore was sampled at explicit locators, not freshly read cover-to-cover. Wider Alatar/Pallando evidence was not independently verified. The GDC talk was sampled visually/captions, not fully watched or listened to; sound guidance partly derives from written developer material.
- Static discovery routes are validated. A fresh Codex/Claude/Copilot client-loading audit was **not performed**; preloaded role definitions can predate this task. Future audit procedure is in discovery-matrix.md. Explicitly reading the shared skill during review proves readability, not automatic client loading.
- Production assets for every faction, unique artifact custody in specific scenarios and any commercial rights clearance remain future work. The present package supplies their specifications and traceability, not a completed game's asset library.

Final gallery runner log: `/tmp/agent-runs/art-gallery-keyboard--20260929T195944Z-670621.log`. It includes actual Tab traversal through skip link, text-size selector, resource link and study buttons, then Enter activation. No game or client reload is implied.

Independent verifier repeated six self-tests and 1,582 static checks successfully (`art-final-verifier-selftest--20260929T200240Z-672791.log`, `art-final-verifier-static--20260929T200240Z-672790.log` under `/tmp/agent-runs/`). Eleven actual gallery CSS color variables matched their semantic tokens. The full-staging whitespace check found one inherited trailing blank line in `docs/guides/MCP_SETUP.md`; only that line was removed, with the final staged gate repeated by the parent. The complete pre-existing staging set and concurrent saved handoff were inspected and preserved; no high-confidence secret pattern was found.
