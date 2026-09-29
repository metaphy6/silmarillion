# Asset contracts and handoff

[Manifest](asset-manifest.json) records actual files and future production requirements separately. [Tokens](tokens.json) are the authority for interface values; [faction matrix](faction-matrix.json) provides profile identity. [Templates](templates.md) provide concrete briefs. These portable contracts do not select an engine or require a full production asset set in this documentation task.

## Identifiers and provenance

Identifier: `sm-{kind}-{profile-or-region}-{purpose}-v{integer}`. Use exact roster ID in metadata; the filename slug may normalize diacritics, but visible names retain them. Use lowercase ASCII filenames, hyphens and explicit version. Never overwrite a reference with an original asset. Keep `source_type` (`original-generated`, `original-vector`, `rendered-evidence`) and status (`concept-reviewed`, `schematic-reviewed`, `rendered-evidence`, `specified-not-produced`) explicit.

Each actual asset record must include purpose, path, dimensions, aspect ratio, format, alpha, layer status, palette/token references, variants, provenance and acceptance notes. Provenance includes creator/tool, generation or authorship date, exact prompt reference if applicable, source inputs, SHA-256 and limits. Generation is not evidence of ownership of Tolkien material or a commercial license. The supplied book and third-party reference images remain research-only; no reference imagery is imported into the production gallery. Confirm permissions before any public commercial distribution; this package makes no such clearance claim.

## Per-kind production contracts (provisional targets)

| Kind | Master / variants | Format and layers | Acceptance |
|---|---|---|---|
| Portrait | 1024×1280, 4:5; variants 512×640, 256×320 | Lossless RGB PNG for concept; production layered source with face/clothing/background separable; sRGB | Legible emotion at 176–280px display, hands coherent, silhouette/prop echoes map, diacritics kept outside image |
| World figure | 256×256 working canvas; 128 and 64 exports; logical display tested at strategic/local token sizes | RGBA PNG; separate body/shadow/selection; pivot/contact/occlusion metadata; no baked ring | Silhouette survives meadow/stone/shadow and grayscale; 44px target independent of art; no mandatory huge hero |
| Environment | 3840×2160 master, 16:9; 1920×1080 and 1280×720 previews | RGB PNG concept; production layers for terrain/structures/occlusion/fx, masks for traversal not inferred from paint | Continuous land, broad masses, routes readable; no text in paint; local composition labeled invented |
| Building / production site | 1024×1024 working square, 512/256 previews; occupancy footprint separate from canvas | RGBA PNG, ground contact + roof/occluder/fx layers; footprint/entrance/interaction polygon metadata | Faction economy distinguishable before label; production entrance and input/output area visible; no queue text baked |
| Prop / artifact | 1024×1024 inspection, 256 icon, 64 inventory preview | RGBA PNG or original SVG schematic; silhouette/shadow layers; separate condition metadata | Actual material, repair and use; unique canonical artifact not duplicated by recipe; no mechanical info only in image |
| Map | 2048×2048 or scenario extent with coordinate metadata; 1024 preview | SVG for authored schematic, separate geo/topology/overlay data for runtime; no engine coordinates implied | Canonical source map vs invented composition vs sandbox declared; resource access, two scenario approaches and unknowns explicit |
| Narrative scene | 1920×1080 or 1600×1200 depending panel composition | RGB plate with portrait/object/text separately; layers for optional motion | Clear speaker/place/time/evidence; one environmental question; room for opaque text panel |
| UI screen | 1440×900 reference; 1024px compact width; 200% text | Live text + portable tokens + layout/state brief; screenshot PNG as evidence only | Correct costs/states, keyboard/focus, meaningful error, no leakage; verify scroll/reflow rather than shrink text |
| Effect / terrain overlay | 512×512 effect study; resolution-independent boundary | RGBA sequence if later animated; SVG/path geometry for warnings; source/target/duration metadata | Bounded roster effect, warning before consequence; shape + label; motion/sound off still understandable |

These targets are proposals. Current generated environment files are 1672×941 (approximately 16:9) and a 1536×1024 comparison sheet, flattened opaque PNGs. They are accepted as concept evidence, not falsely labeled 4K production masters or cutout sprites. The sheet's three enlarged full-body studies are not calibrated world sprites. The separate authored vector silhouettes demonstrate scale without pretending the sheet passed sprite acceptance.

## Layer, scale and export policy

1. Record a master before exporting variants. Document crop windows; never crop out a functional entrance, threatened area or identifying prop. No speculative variants are marked present.
2. Treat color as sRGB in concepts; a later engine adapter must define import/color-management settings and verify them on target devices. Never encode functional text/values into the art texture.
3. Transparent assets need genuine alpha, clean edge colors at light/dark composites, a bottom contact/pivot and natural shadow separated. Current flattened concepts have `alpha:false`; do not auto-cut them out and call them production-ready.
4. Preserve plain-language alt text, source category, known lore constraints and asset ID in handoff. A content pack must use exact roster IDs, not a guessed hero alias.
5. Warnings/selections are functional overlays drawn from tokens; keep them above weather but below reading panels, and never bake them into a faction palette.
6. Exported runtime size, compression, atlases, animation frame rates, memory and streaming budgets remain unselected until an engine/target is chosen. Profile performance rather than inferring it from PNG size.

## Manifest acceptance

`assets` lists only delivered files and measured dimensions/hash. `production_requirements` lists category contracts by profile with `specified-not-produced`; it is a future asset backlog, not a claim of hundreds of images. `reference_material` links the existing Brethil study and evidence documents, not copied external art. A generated-image tool failure must leave that exact required artifact marked missing, never replace it with a prompt and mark it produced.

The completed gallery has five conceptual studies built from three original paintings and original vector examples. Rendered evidence is derived from those originals and exact live text; consult [verification](verification.md) for measurements and limitations.
