# Silmarillion strategy game design

An isometric strategy game design with painterly surroundings, small figures against expansive landscapes, distinct faction economies and one recreatable hero per faction.

All resources and generated deliverables live directly in this project root. There is no `output` directory.

## Current design

- [Design report](silmarillion-game-report.md) and [PDF edition](silmarillion-game-design-report.pdf): revision 6 is the current design.
- [Hero powers and counters](hero-balance-roster.md) and [structured roster](hero-balance-roster.json): 55 starting profiles across 54 factions, including Melkor's two mutually exclusive doctrines.
- Five named Istari (Gandalf, Saruman, Radagast, Alatar and Pallando) supplement the five generic orders; each faction has one hero. The two Blue Wizards are separate selections.
- `hero-kits-valar-v5.json`, `hero-kits-peoples-v5.json`, `hero-kits-other-v5.json` and `hero-kits-named-istari-v6.json` are the hero-kit inputs. Melkor's two profiles are defined in `build_hero_roster.py`.

These rules are proposed designs, not evidence of validated competitive balance.

## Source material and artwork

- [Supplied book](silmarillion.pdf) and [retained extracted text](silmarillion-extracted-text.txt).
- `reading-*.md` contains the source-reading notes.
- [Brethil concept art](brethil-isometric-concept.png), [art notes](brethil-concept-readme.md) and [generation prompt](concept-prompt.txt).

The reading notes retain historical references to temporary inspection files that had already been removed before this repository migration.

## Earlier work

`silmarillion-game-report-v1.md` through `silmarillion-game-report-v5.md` and their matching `silmarillion-game-design-report-v*.pdf` files preserve earlier revisions. Their rules may be superseded by revision 6. Historical PDFs retain their original wording; archived Markdown links have been adjusted to this root layout. `design-notes-*.md` contains supporting drafts rather than current rules. The older fifty hero profiles remain unchanged while their offensive redesign is pending; the five named Wizard kits are new proposals.

## Rebuild

Use Python 3 with Pillow and ReportLab installed. The hero roster builder uses only the Python standard library.

```bash
python3 build_hero_roster.py
python3 build_report.py --check
python3 build_report.py
```

Both builders resolve inputs and destinations relative to their own location, so they also work when invoked from another directory. The current PDF, Markdown roster and JSON roster are written here at the project root.
