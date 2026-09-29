#!/usr/bin/env python3
"""Read-only static checks for Silmarillion's portable art-direction package.

Run from any directory: python3 /path/to/validate.py [--self-test]
No game runtime, browser, client-loading or competitive-balance claim is made.
PyYAML adds real YAML parsing when installed; absence is reported as a limitation.
"""

from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import dataclass, field
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import struct
import sys
import unittest
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET
import zlib

try:
    import tomllib
except ImportError:  # Python < 3.11 can still report the other checks.
    tomllib = None

try:
    import yaml
except ImportError:
    yaml = None


ENTRY_PATHS = (
    "AGENTS.md", "CLAUDE.md", "CONVENTIONS.md", "README.md",
    "docs/README.md", "docs/design/README.md", "docs/tracking/context.md",
    "docs/guides/CODEX_SETUP.md", ".agents/skills/README.md",
    ".agents/skills/silmarillion-art-direction/SKILL.md",
    ".github/copilot-instructions.md",
    ".github/instructions/silmarillion-design.instructions.md",
    *[f".github/agents/{role}.agent.md" for role in
      ("planner", "implementer", "reviewer", "verifier")],
)
PACKAGE_PATHS = (
    "README.md", "source-authority.md", "art-bible.md", "world-narrative.md",
    "reference-index.md", "research-ledger.json", "adaptation-matrix.md",
    "faction-matrix.md", "faction-matrix.json", "ui-ux.md", "tokens.json",
    "asset-specifications.md", "asset-manifest.json", "templates.md",
    "generation-prompts.md", "review-rubric.md", "discovery-matrix.md",
    "verification.md", "gallery/index.html",
)
SKILL_PATH = ".agents/skills/silmarillion-art-direction/SKILL.md"
ALLOWED_ORIGINAL_TYPES = {"original-generated", "original-vector", "rendered-evidence"}
PROFILE_DOMAINS = {"character", "settlement", "production", "army", "artifact", "magic", "terrain"}
HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


@dataclass
class Report:
    checks: int = 0
    failures: list[str] = field(default_factory=list)
    limitations: list[str] = field(default_factory=list)
    counts: Counter = field(default_factory=Counter)
    evidence: list[str] = field(default_factory=list)

    def check(self, condition: bool, message: str) -> None:
        self.checks += 1
        if not condition:
            self.failures.append(message)

    def finish(self) -> int:
        for key, value in sorted(self.counts.items()):
            print(f"COUNT {key}: {value}")
        for item in self.evidence:
            print(f"EVIDENCE {item}")
        for item in self.failures:
            print(f"FAIL {item}")
        for item in self.limitations:
            print(f"LIMITATION {item}")
        print(f"{'FAIL' if self.failures else 'PASS'}: {self.checks} static checks; "
              f"{len(self.failures)} failures; {len(self.limitations)} limitations.")
        print("Static checks do not prove rendered usability, runtime performance, "
              "full accessibility, competitive balance or actual client loading.")
        return 1 if self.failures else 0


def read_json(path: Path, report: Report):
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        report.check(False, f"JSON {path.name}: {exc}")
        return None
    report.counts["json_parsed"] += 1
    return value


def relative_luminance(color: str) -> float:
    if not isinstance(color, str) or not HEX_COLOR.fullmatch(color):
        raise ValueError(f"expected #RRGGBB color, got {color!r}")
    channels = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
              for c in channels]
    return sum(c * weight for c, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast_ratio(foreground: str, background: str) -> float:
    light, dark = sorted((relative_luminance(foreground),
                          relative_luminance(background)), reverse=True)
    return (light + 0.05) / (dark + 0.05)


def check_tokens(tokens, report: Report) -> None:
    if not isinstance(tokens, dict):
        report.check(False, "tokens must be an object")
        return
    colors = tokens.get("color", {})
    report.check(isinstance(colors, dict) and bool(colors), "tokens.color must be nonempty")
    if not isinstance(colors, dict):
        return
    for name, color in colors.items():
        report.check(isinstance(color, str) and bool(HEX_COLOR.fullmatch(color)),
                     f"token color {name} must be #RRGGBB")
    report.counts["semantic_colors"] = len(colors)
    pairings = tokens.get("permitted_pairings", [])
    report.check(isinstance(pairings, list) and bool(pairings), "permitted_pairings must be nonempty")
    if not isinstance(pairings, list):
        pairings = []
    ratios = []
    for index, pair in enumerate(pairings):
        try:
            foreground, background = pair["foreground"], pair["background"]
            minimum = pair["minimum_ratio"]
            if isinstance(minimum, bool) or not isinstance(minimum, (int, float)) or minimum < 3:
                raise ValueError("minimum_ratio must be a number >= 3")
            ratio = contrast_ratio(colors[foreground], colors[background])
            report.check(ratio >= minimum,
                         f"contrast {foreground}/{background} = {ratio:.3f}:1 below {minimum}:1")
            report.counts["contrast_pairings"] += 1
            ratios.append(ratio)
        except (KeyError, TypeError, ValueError) as exc:
            report.check(False, f"permitted_pairings[{index}]: {exc}")
    if ratios:
        report.evidence.append(f"Lowest declared functional pairing contrast: {min(ratios):.3f}:1")
    target = tokens.get("selection", {}).get("target_minimum")
    report.check(isinstance(target, (int, float)) and not isinstance(target, bool) and target >= 44,
                 "selection.target_minimum must be at least 44 logical pixels")
    report.evidence.append(f"Declared minimum selection target: {target} logical pixels")


def check_lore_evidence(profile: dict, known_lore_ids: set[str], report: Report) -> None:
    """Require either inspected citations or an explicit unverified-invention label."""
    identifier = profile.get("id")
    references = profile.get("lore_refs")
    status = profile.get("lore_evidence_status")
    report.check(isinstance(references, list), f"{identifier}: lore_refs must be an array")
    if not isinstance(references, list):
        return
    if references:
        report.check(status == "inspected-source",
                     f"{identifier}: nonempty lore_refs require inspected-source evidence status")
        report.check(all(isinstance(ref, str) and ref in known_lore_ids for ref in references),
                     f"{identifier}: lore_refs must cite known LORE IDs in source-authority.md")
        report.counts["profiles_with_lore_references"] += 1
    else:
        report.check(status == "gameplay-only-unverified-lore",
                     f"{identifier}: empty lore_refs require gameplay-only-unverified-lore evidence status")
        report.check(isinstance(profile.get("lore_status"), str) and bool(profile["lore_status"].strip()),
                     f"{identifier}: unverified/invented treatment requires an explicit lore_status")
        locator = profile.get("project_locator", "")
        report.check(isinstance(locator, str) and bool(re.search(r"\bPROJECT-\d+\b", locator)),
                     f"{identifier}: unverified/invented treatment requires a PROJECT locator")
        report.counts["profiles_with_explicit_unverified_lore"] += 1


def check_coverage(roster, matrix, report: Report, known_lore_ids: set[str] | None = None) -> None:
    if not isinstance(roster, dict) or not isinstance(matrix, dict):
        report.check(False, "roster and faction matrix must be objects")
        return
    expected, actual = roster.get("profiles", []), matrix.get("profiles", [])
    if not isinstance(expected, list) or not isinstance(actual, list):
        report.check(False, "roster/matrix profiles must be arrays")
        return
    expected_ids = [p.get("id") for p in expected if isinstance(p, dict)]
    actual_ids = [p.get("id") for p in actual if isinstance(p, dict)]
    report.check(len(expected_ids) == len(expected) == 55 and len(set(expected_ids)) == 55,
                 "current roster must contain exactly 55 unique profile IDs")
    report.check(len(actual_ids) == len(actual) == 55 and len(set(actual_ids)) == 55,
                 "faction matrix must contain exactly 55 unique profile IDs")
    report.check(set(actual_ids) == set(expected_ids),
                 f"profile coverage mismatch: missing={set(expected_ids) - set(actual_ids)}, "
                 f"extra={set(actual_ids) - set(expected_ids)}")
    expected_by_id = {p["id"]: p for p in expected if isinstance(p, dict) and "id" in p}
    faction_names = {p.get("faction") for p in actual if isinstance(p, dict)}
    report.check(len(faction_names) == 54 and None not in faction_names,
                 "faction matrix must contain exactly 54 distinct faction names")
    families = matrix.get("families", [])
    family_ids = set(families) if isinstance(families, dict) else {
        f.get("id") for f in families if isinstance(f, dict)}
    for profile in actual:
        if not isinstance(profile, dict):
            report.check(False, "matrix profile must be an object")
            continue
        identifier = profile.get("id")
        canonical = expected_by_id.get(identifier)
        if canonical:
            for key in ("faction", "hero"):
                report.check(profile.get(key) == canonical.get(key),
                             f"{identifier}: {key} differs from structured roster")
        report.check(profile.get("family") in family_ids, f"{identifier}: unknown visual family")
        domains = profile.get("domains", {})
        report.check(isinstance(domains, dict) and PROFILE_DOMAINS <= domains.keys()
                     and all(domains.get(key) for key in PROFILE_DOMAINS),
                     f"{identifier}: all seven visual domains require treatments")
        for key in ("lore_status", "project_locator", "chronology", "economy_anchor", "validation"):
            report.check(bool(profile.get(key)), f"{identifier}: missing {key}")
        check_lore_evidence(profile, known_lore_ids or set(), report)
    report.counts["matrix_profiles"] = len(actual)
    report.counts["matrix_factions"] = len(faction_names)


def inspect_png(data: bytes) -> tuple[int, int, bool]:
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("invalid PNG signature")
    offset, chunks, width, height, alpha = 8, [], None, None, False
    while offset < len(data):
        if offset + 12 > len(data):
            raise ValueError("truncated PNG chunk")
        length, = struct.unpack(">I", data[offset:offset + 4])
        kind = data[offset + 4:offset + 8]
        end = offset + 12 + length
        if end > len(data):
            raise ValueError("truncated PNG chunk data")
        payload = data[offset + 8:offset + 8 + length]
        crc, = struct.unpack(">I", data[offset + 8 + length:end])
        if zlib.crc32(kind + payload) & 0xFFFFFFFF != crc:
            raise ValueError(f"PNG CRC mismatch in {kind.decode('ascii', errors='replace')}")
        if not chunks and kind != b"IHDR":
            raise ValueError("IHDR must be first PNG chunk")
        if kind == b"IHDR":
            if chunks or length != 13:
                raise ValueError("invalid or duplicate IHDR")
            width, height, depth, color_type, compression, filtering, interlace = struct.unpack(">IIBBBBB", payload)
            if not width or not height or compression or filtering or interlace not in (0, 1):
                raise ValueError("invalid PNG IHDR values")
            alpha = color_type in (4, 6)
        elif kind == b"tRNS":
            alpha = True
        chunks.append(kind)
        offset = end
        if kind == b"IEND":
            if length or offset != len(data) or b"IDAT" not in chunks:
                raise ValueError("invalid IEND, trailing bytes or missing image data")
            return width, height, alpha
    raise ValueError("missing PNG IEND")


def local_target(base: Path, target: str, root: Path) -> Path | None:
    parsed = urlsplit(target)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None
    path = (base / unquote(parsed.path)).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f"local reference escapes repository: {target}")
    return path


def check_manifest(manifest, package: Path, root: Path, report: Report) -> None:
    if not isinstance(manifest, dict) or not isinstance(manifest.get("assets"), list):
        report.check(False, "asset manifest must contain an assets array")
        return
    report.check(bool(manifest.get("schema_version")), "asset manifest needs schema_version")
    ids = [a.get("id") for a in manifest["assets"] if isinstance(a, dict)]
    report.check(len(ids) == len(set(ids)) and None not in ids, "asset IDs must be unique and nonempty")
    required = {"id", "path", "purpose", "status", "format", "width", "height", "alpha",
                "layers", "provenance", "palette_refs", "variants", "acceptance", "source_type"}
    for asset in manifest["assets"]:
        if not isinstance(asset, dict):
            report.check(False, "manifest asset must be an object")
            continue
        name = asset.get("id", "unnamed")
        report.check(required <= asset.keys(), f"asset {name}: missing fields {sorted(required - asset.keys())}")
        report.check(asset.get("source_type") in ALLOWED_ORIGINAL_TYPES,
                     f"asset {name}: reference material cannot be classified as original production/example art")
        try:
            path = local_target(package, asset.get("path", ""), root)
            if path is None or not path.is_file():
                raise ValueError(f"missing local asset file: {asset.get('path')}")
            data = path.read_bytes()
            report.counts["manifest_assets_present"] += 1
            provenance = asset.get("provenance", {})
            digest = provenance.get("sha256", "")
            report.check(bool(re.fullmatch(r"[0-9a-fA-F]{64}", digest))
                         and hashlib.sha256(data).hexdigest() == digest.lower(),
                         f"asset {name}: SHA256 absent or mismatched")
            for key in ("creator", "tool", "date", "prompt_ref"):
                report.check(bool(provenance.get(key)), f"asset {name}: provenance.{key} missing")
            for dimension in ("width", "height"):
                value = asset.get(dimension)
                report.check(isinstance(value, int) and not isinstance(value, bool) and value > 0,
                             f"asset {name}: {dimension} must be a positive integer")
            report.check(isinstance(asset.get("alpha"), bool), f"asset {name}: alpha must be boolean")
            if path.suffix.lower() == ".png":
                width, height, alpha = inspect_png(data)
                report.check(str(asset.get("format", "")).lower() in ("png", "image/png"), f"asset {name}: format differs from PNG")
                report.check((width, height) == (asset.get("width"), asset.get("height")),
                             f"asset {name}: PNG dimensions {width}x{height} differ from manifest")
                report.check(alpha == asset.get("alpha"), f"asset {name}: PNG transparency differs from manifest")
                report.counts["png_crc_and_dimensions"] += 1
            elif path.suffix.lower() == ".svg":
                element = ET.fromstring(data)
                report.check(element.tag.split("}")[-1] == "svg", f"asset {name}: root is not SVG")
                viewbox = element.get("viewBox", "").split()
                if len(viewbox) == 4:
                    width, height = float(viewbox[2]), float(viewbox[3])
                    report.check((width, height) == (asset.get("width"), asset.get("height")),
                                 f"asset {name}: SVG viewBox dimensions differ from manifest")
                report.counts["manifest_svg_parsed"] += 1
            prompt_ref = provenance.get("prompt_ref", "")
            if isinstance(prompt_ref, str) and ("/" in prompt_ref or ".md" in prompt_ref):
                prompt_path = local_target(package, prompt_ref, root)
                report.check(prompt_path is not None and prompt_path.exists(),
                             f"asset {name}: prompt reference path missing")
        except (OSError, ValueError, TypeError, AttributeError, ET.ParseError) as exc:
            report.check(False, f"asset {name}: {exc}")


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("href", "src", "poster") and value:
                self.links.append(value)


def check_links(paths: set[Path], root: Path, report: Report) -> None:
    for path in sorted(paths):
        if not path.is_file():
            report.check(False, f"required document absent: {path.relative_to(root)}")
            continue
        content = path.read_text(encoding="utf-8")
        if path.suffix == ".md":
            content = re.sub(r"```.*?```|~~~.*?~~~", "", content, flags=re.S)
            links = re.findall(r"\[[^\]]*\]\(<?([^\s)>]+)>?(?:\s+\"[^\"]*\")?\)", content)
        else:
            parser = LinkParser()
            parser.feed(content)
            links = parser.links
        for link in links:
            try:
                target = local_target(path.parent, link, root)
                if target is not None:
                    report.counts["local_links"] += 1
                    report.check(target.exists(), f"broken local link in {path.relative_to(root)}: {link}")
            except ValueError as exc:
                report.check(False, f"link in {path.relative_to(root)}: {exc}")
        report.counts["documents_link_checked"] += 1


def check_routes(root: Path, report: Report) -> None:
    for relative in ENTRY_PATHS:
        path = root / relative
        report.check(path.is_file(), f"missing agent/index route: {relative}")
        if path.is_file():
            report.check("silmarillion-art-direction" in path.read_text(), f"shared route absent: {relative}")
            report.counts["markdown_routes"] += 1
    configs = [root / ".codex/config.toml", *[root / f".codex/agents/{role}.toml"
               for role in ("planner", "implementer", "reviewer", "verifier")]]
    if tomllib is None:
        report.limitations.append("TOML parser unavailable: use Python 3.11+ to verify all five Codex configurations.")
    else:
        for path in configs:
            try:
                config = tomllib.loads(path.read_text())
                instructions = config.get("developer_instructions", "")
                report.check(SKILL_PATH in instructions, f"explicit shared skill route absent: {path.name}")
                report.check(".github/instructions/silmarillion-design.instructions.md" in instructions,
                             f"explicit design instruction route absent: {path.name}")
                report.counts["toml_parsed"] += 1
            except (OSError, ValueError) as exc:
                report.check(False, f"TOML {path}: {exc}")
    metadata_paths = [root / SKILL_PATH, root / ".github/instructions/silmarillion-design.instructions.md",
                      *[root / f".github/agents/{role}.agent.md" for role in
                        ("planner", "implementer", "reviewer", "verifier")]]
    if yaml is None:
        report.limitations.append("PyYAML unavailable: YAML metadata parsing skipped explicitly; install through approved project tooling before claiming that check.")
    else:
        for path in metadata_paths:
            try:
                match = re.match(r"\A---\n(.*?)\n---(?:\n|$)", path.read_text(), re.S)
                if match is None:
                    raise ValueError("missing YAML frontmatter")
                metadata = yaml.safe_load(match.group(1))
                report.check(isinstance(metadata, dict) and bool(metadata.get("description")),
                             f"invalid description metadata: {path.name}")
                if path == root / SKILL_PATH:
                    report.check(metadata.get("name") == path.parent.name,
                                 "skill name must match its directory")
                report.counts["yaml_headers_parsed"] += 1
            except (OSError, ValueError, yaml.YAMLError) as exc:
                report.check(False, f"YAML {path}: {exc}")


def validate(root: Path) -> Report:
    root = root.resolve()
    package = root / "docs/design/art-direction"
    report = Report()
    for name in PACKAGE_PATHS:
        report.check((package / name).is_file(), f"missing package resource: {name}")
    parsed = {path.name: read_json(path, report) for path in package.rglob("*.json")}
    tokens, matrix, manifest = (parsed.get(name) for name in
                               ("tokens.json", "faction-matrix.json", "asset-manifest.json"))
    check_tokens(tokens, report)
    authority_path = package / "source-authority.md"
    known_lore_ids = set(re.findall(r"^\|\s*(LORE-\d+)\s*\|", authority_path.read_text(), re.M)) if authority_path.is_file() else set()
    report.check(bool(known_lore_ids), "source-authority.md must declare a local LORE reference ledger")
    report.counts["known_lore_references"] = len(known_lore_ids)
    check_coverage(read_json(root / "hero-balance-roster.json", report), matrix, report, known_lore_ids)
    check_manifest(manifest, package, root, report)
    ledger = parsed.get("research-ledger.json", {})
    references = ledger.get("references", []) if isinstance(ledger, dict) else []
    ref_ids = [ref.get("id") for ref in references if isinstance(ref, dict)]
    report.check(bool(ref_ids) and len(ref_ids) == len(set(ref_ids)), "research reference IDs must be present and unique")
    for reference in references:
        for key in ("id", "creator", "title", "access_date", "locator", "source_type", "observation", "interpretation", "design_consequence"):
            report.check(bool(reference.get(key)), f"reference {reference.get('id')}: missing {key}")
        report.check(bool(reference.get("url") or reference.get("path")),
                     f"reference {reference.get('id')}: URL or local path required")
    report.counts["research_references"] = len(references)
    paths = {root / name for name in ENTRY_PATHS}
    paths.update(p for p in package.rglob("*") if p.suffix in (".md", ".html"))
    check_links(paths, root, report)
    for path in package.rglob("*.svg"):
        try:
            ET.parse(path)
            report.counts["svg_files_parsed"] += 1
        except (OSError, ET.ParseError) as exc:
            report.check(False, f"SVG {path.name}: {exc}")
    check_routes(root, report)
    report.limitations.append("External URL reachability, Markdown/HTML fragments and rendered layout are outside this static path check; inspect referenced evidence and the gallery separately.")
    return report


class ValidatorNegativeTests(unittest.TestCase):
    def test_empty_lore_references_cannot_claim_inspection(self):
        profile = {"id": "invented-order", "lore_refs": [], "lore_evidence_status": "inspected-source",
                   "lore_status": "An original gameplay invention.", "project_locator": "PROJECT-01 §06"}
        report = Report()
        check_lore_evidence(profile, {"LORE-01"}, report)
        self.assertTrue(any("empty lore_refs require" in error for error in report.failures))
        profile["lore_evidence_status"] = "gameplay-only-unverified-lore"
        explicit_invention = Report()
        check_lore_evidence(profile, {"LORE-01"}, explicit_invention)
        self.assertEqual(explicit_invention.failures, [])

    def test_insufficient_contrast_detected(self):
        report = Report()
        check_tokens({"color": {"ink": "#777777", "surface": "#777777"},
                      "permitted_pairings": [{"foreground": "ink", "background": "surface", "minimum_ratio": 4.5}],
                      "selection": {"target_minimum": 44}}, report)
        self.assertTrue(any("contrast" in error for error in report.failures))
        self.assertAlmostEqual(contrast_ratio("#FFFFFF", "#000000"), 21)

    def test_missing_profile_detected(self):
        expected = [{"id": f"p{i}", "faction": f"f{min(i, 53)}", "hero": f"h{i}"} for i in range(55)]
        report = Report()
        check_coverage({"profiles": expected}, {"profiles": expected[:-1]}, report)
        self.assertTrue(any("coverage mismatch" in error for error in report.failures))

    def test_missing_asset_detected(self):
        report = Report()
        root = Path(__file__).resolve().parents[3]
        check_manifest({"schema_version": 1, "assets": [{"id": "missing", "path": "definitely-absent-test-art.png"}]},
                       root / "docs/design/art-direction", root, report)
        self.assertTrue(any("missing local asset file" in error for error in report.failures))

    def test_small_selection_target_detected(self):
        report = Report()
        check_tokens({"color": {"ink": "#FFFFFF", "surface": "#000000"},
                      "permitted_pairings": [{"foreground": "ink", "background": "surface", "minimum_ratio": 4.5}],
                      "selection": {"target_minimum": 18}}, report)
        self.assertTrue(any("at least 44" in error for error in report.failures))

    def test_corrupt_png_crc_detected(self):
        payload = struct.pack(">IIBBBBB", 1, 1, 8, 6, 0, 0, 0)
        corrupt = b"\x89PNG\r\n\x1a\n" + struct.pack(">I", 13) + b"IHDR" + payload + b"\x00\x00\x00\x00"
        with self.assertRaisesRegex(ValueError, "CRC mismatch"):
            inspect_png(corrupt)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[3], help="repository root")
    parser.add_argument("--self-test", action="store_true", help="run negative/regression checks without package mutation")
    args = parser.parse_args()
    if args.self_test:
        result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(ValidatorNegativeTests))
        return 0 if result.wasSuccessful() else 1
    return validate(args.root).finish()


if __name__ == "__main__":
    sys.exit(main())
