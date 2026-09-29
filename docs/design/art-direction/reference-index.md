# Research reference index

The machine-readable evidence record is [research-ledger.json](research-ledger.json).
Its IDs are stable: retain an ID when correcting a locator, and add a new ID
for a different source. Access date for this research pass: **29 September 2026**.
The project and Tolkien source hierarchy is owned by
[source-authority.md](source-authority.md); the translation into design is in
[adaptation-matrix.md](adaptation-matrix.md).

## What was actually inspected

The research combined complete developer articles/interviews, credited art
pages and browser inspection of seven individual images. No game executable
was played. The official GDC talk was sampled as paused video frames with
captions, **not watched end to end or listened to**. The third-party transcript
was read separately and remains secondary evidence. No audio listening or
animation timing measurements were performed.

Published gameplay screenshots support observations of the displayed
interface and art. They do not establish which build produced them or whether
every displayed behavior shipped unchanged. Development posts support
techniques and intent; they are not final-game tests. The portfolio village is
a concept image. These classes remain distinct in the ledger.

## Visual references

| ID | Credited source and exact locator | Inspection scope |
|---|---|---|
| DE-03 | [Official media](https://discoelysium.com/media), `screenshot_climbing.jpg` | Full image fitted from 2560×1440 to 1280×720; world scale and path hierarchy |
| DE-04 | [Official media](https://discoelysium.com/media), `screenshot_communist-room.jpg` | Full image fitted to 1280×720; warm interior within cool damaged surroundings |
| DE-05 | [Official media](https://discoelysium.com/media), `de-doomspiral_251673110.jpg` | Full image fitted from 3840×2160 to 1280×720; dialogue, portrait and lower controls |
| DE-06 | [Official media](https://discoelysium.com/media), `disco_elysium_skills-1.jpg` | Full image fitted to 1280×720; selected tile, information pane and typography |
| DE-07 | Aleksander Rostov, [Disco Elysium Archetypes](https://rostovjanka.artstation.com/projects/6aAL8x), **Archetypes together** | Combined 1920×882 image; individual enlarged crops not inspected |
| DE-08 | Aleksander Rostov, [Disco Elysium Village](https://rostovjanka.artstation.com/projects/QERm4), single signed fishing-village concept | Full 1920×980 image; massing, work court, jetty and material repair |
| DE-19 | [Official media](https://discoelysium.com/media), `de-wakeup_2376311b5.jpg` | First carousel image at approximately 748×414; composition and causal props |
| DE-20 | [Rostov portfolio index](https://rostovjanka.artstation.com/) | Creator attribution and links to DE-07/08; other projects not inspected |

Exact resolved image URLs are retained in each ledger entry's `image_url`.
Use the credited page first if a CDN URL changes. Image URLs were discovered
from the page, not guessed. No reference images were downloaded into the
production asset folders. Browser screenshots served only as inspection
evidence in the research session.

## Developer techniques and release evidence

| ID | Creator / source | Evidence class |
|---|---|---|
| DE-01 | Rostov, [Village Concept Art](https://discoelysium.com/devblog/2016/06/29/fishing-village-concept-art) | 2016 development text; planning, scale and paint workflow |
| DE-02 | Rostov, [Gorgeous ground](https://discoelysium.com/devblog/2016/03/29/gorgeous-ground) | 2016 development text; underpainting and surface variation |
| DE-09 | Mikk Metsniit, [Feld Playback Experiment](https://discoelysium.com/devblog/2016/12/20/feld-playback-experiment) | 2016 interface metaphor and feedback intent |
| DE-10 | Markus Härma, [From Render to Paintover](https://discoelysium.com/devblog/2019/01/23/from-render-to-paintover) | 2019 description of static and changing visual layers |
| DE-11 | Markus Rondo, [Audio & Action](https://discoelysium.com/devblog/2016/08/02/audio-action) | 2016 audio and stage-direction design description |
| DE-17 | Dani / ZA/UM, [Jamais Vu Update & huge thanks for 2021!](https://discoelysium.com/devblog/2022/02/07/jamais-vu-update-huge-thanks-for-2021) | Release retrospective; reported options, not measured accessibility |

Original inline images in DE-01/02 and embedded motion in DE-10 were not
separately inspected. DE-08 provides a credited, visually inspected village
reference. Neither Blender, Unity, articy nor the audio middleware named in
these articles is a technology decision for this repository.

## Narrative evidence

| ID | Creator / source | Read or watched? |
|---|---|---|
| DE-12 | Justin Keenan, [GDC 2021: Meaningless Choices and Impractical Advice](https://gdcvault.com/play/1027160/-Disco-Elysium-Meaningless-Choices) | Description read; official video/caption samples at approximately **00:10, 05:46, 11:53, 19:39**. Not a full viewing or listening session. |
| DE-13 | [ikesau.co transcription of Keenan's talk](https://ikesau.co/justin-keenan-meaningless-choices-and-impractical-advice/) | Full transcript body read; third-party transcription, with only sampled points checked against DE-12 |
| DE-14 | Keenan interviewed by Eva Padilla, [Dream Quests and Desires](https://www.rpgfan.com/feature/dream-quests-and-desires-an-interview-with-disco-elysiums-justin-keenan/) | Interview read; developer answers are primary testimony, editorial framing is secondary |
| DE-15 | Robert Kurvitz interviewed by Izual, translated by Steph Noviss, [Choose Your Own Misadventure — Part 2](https://discoelysium.com/devblog/2019/07/23/choose-your-own-misadventure-part-2) | Official repost of interview read; pre-release design intent |
| DE-16 | Rostov/Kurvitz interviewed by Erik Meyer, [Intriguing Indigraze Interview](https://discoelysium.com/devblog/2017/08/02/intriguing-indigraze-interview) | Official repost read; early development perspective |
| DE-18 | Keenan / GDC, [indexed slide PDF](https://media.gdcvault.com/GDC%2B2021/GDC%2B2021%2BUpdated%2BTemplates.pdf) | **Not read: HTTP 403** from the web reader. No page claims. |

The initially found `dev.gdcvault.com` talk endpoint returned 502; the
canonical GDC page above and its embedded official player were accessible.
That recovery does not make the separate PDF accessible. No paid art book,
unlicensed rip, full gameplay recording or uncredited image-board content was
used as a source.

## How agents extend this evidence

1. Record creator, page URL or repository path, access date and exact image,
   page or timestamp locator. State whether the material is Tolkien evidence,
   an interview, a development technique, a published game image or criticism.
2. Describe only inspected material under `observation`. Put inference under
   `interpretation` and proposed project choices under `design_consequence`.
   Mark unread material inaccessible; a search excerpt does not count as
   inspection.
3. Link the resulting rationale to the relevant authoritative rule, profile
   and asset brief. Do not require an artist's name or another game's title as
   the production specification.
4. Keep external art in a reference register with its creator and rights
   status. Public access grants no production license. Original generated or
   authored examples belong in [asset-manifest.json](asset-manifest.json) with
   their own provenance and status; reference images must never silently
   become production textures, portraits or interface elements.

The remaining uncertainties are bounded: actual final-game motion/sound,
exact fonts, measured reference contrast, full GDC delivery, and full client
behavior were not verified. This package adopts independently specified
design rules and validation gates rather than treating those gaps as facts.
