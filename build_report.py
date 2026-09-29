#!/usr/bin/env python3
"""Render the local game-design Markdown report as an editorial PDF.

Defaults are relative to this script, not to the caller's working directory.
Standalone ``---`` lines start new pages; overflow within sections flows normally.
No network requests are made. Local images are measured eagerly with Pillow.

Example:
    python3 build_report.py
    python3 build_report.py --check
    python3 build_report.py --input draft.md --output draft.pdf
"""

from __future__ import annotations

import argparse
import html
import math
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import unquote, urlparse

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    LongTable,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    TableStyle,
)


HERE = Path(__file__).resolve().parent
PAPER = colors.HexColor("#FBF8F0")
INK = colors.HexColor("#25322F")
TEAL = colors.HexColor("#205951")
MUTED = colors.HexColor("#65746E")
RULE = colors.HexColor("#C9D3C8")
TINT = colors.HexColor("#F0F2E9")
GOLD = colors.HexColor("#B5894F")


@dataclass
class Block:
    kind: str
    text: str = ""
    level: int = 0
    marker: str = ""
    rows: list[list[str]] = field(default_factory=list)
    aligns: list[str] = field(default_factory=list)


@dataclass
class Config:
    source: Path
    destination: Path
    page_size: tuple[float, float] = A4
    margin: float = 44.0
    body_size: float = 9.8
    author: str = "Design research and game direction"

    @property
    def width(self) -> float:
        return self.page_size[0] - self.margin * 2

    @property
    def height(self) -> float:
        return self.page_size[1] - 100


def register_fonts() -> None:
    roots = [
        Path("/usr/share/fonts/truetype/dejavu"),
        Path("/usr/share/fonts/dejavu"),
        Path.home() / ".fonts",
    ]
    faces = {
        "Editorial": "DejaVuSerif.ttf",
        "Editorial-Bold": "DejaVuSerif-Bold.ttf",
        "Editorial-Italic": "DejaVuSerif-Italic.ttf",
        "Editorial-BoldItalic": "DejaVuSerif-BoldItalic.ttf",
        "Interface": "DejaVuSans.ttf",
        "Interface-Bold": "DejaVuSans-Bold.ttf",
        "Interface-Italic": "DejaVuSans-Oblique.ttf",
        "Interface-BoldItalic": "DejaVuSans-BoldOblique.ttf",
        "Code": "DejaVuSansMono.ttf",
    }
    for name, filename in faces.items():
        found = next((root / filename for root in roots if (root / filename).is_file()), None)
        if found is None:
            raise FileNotFoundError(f"Required DejaVu font missing: {filename}")
        if name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(name, str(found)))
    for family in ("Editorial", "Interface"):
        pdfmetrics.registerFontFamily(
            family,
            normal=family,
            bold=f"{family}-Bold",
            italic=f"{family}-Italic",
            boldItalic=f"{family}-BoldItalic",
        )


INLINE = re.compile(
    r"(`[^`\n]+`|\[[^\]\n]+\]\((?:<[^>]+>|[^)\n]+)\)|"
    r"\*\*.+?\*\*|__.+?__|(?<!\*)\*(?!\*).+?(?<!\*)\*(?!\*)|"
    r"(?<!\w)_(?!_).+?(?<!_)_(?!\w)|\\[\\`*{}_\[\]()#+.!|>-]|<br\s*/?>)",
    re.IGNORECASE,
)


def inline(text: str) -> str:
    """Escape source text and translate the supported Markdown inline syntax."""
    pieces: list[str] = []
    previous = 0
    for match in INLINE.finditer(text):
        pieces.append(html.escape(text[previous:match.start()]))
        token = match.group(0)
        if token.startswith("`"):
            pieces.append(f'<font name="Code" size="9">{html.escape(token[1:-1])}</font>')
        elif token.startswith("["):
            label, target = re.match(r"\[([^\]]+)\]\((.*)\)", token).groups()
            target = target.strip()
            if target.startswith("<") and target.endswith(">"):
                target = target[1:-1]
            # Basic optional Markdown link titles are not printed in the PDF.
            target = re.sub(r'\s+[\"\'].*?[\"\']$', "", target)
            if urlparse(target).scheme.lower() in {"javascript", "data"}:
                raise ValueError(f"Unsupported link scheme: {target}")
            pieces.append(
                f'<link href="{html.escape(target, quote=True)}" color="#205951">'
                f"<u>{inline(label)}</u></link>"
            )
        elif token.startswith(("**", "__")):
            pieces.append(f"<b>{inline(token[2:-2])}</b>")
        elif token.startswith(("*", "_")):
            pieces.append(f"<i>{inline(token[1:-1])}</i>")
        elif token.startswith("\\"):
            pieces.append(html.escape(token[1:]))
        else:
            pieces.append("<br/>")
        previous = match.end()
    pieces.append(html.escape(text[previous:]))
    return "".join(pieces)


def split_cells(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|") and not line.endswith("\\|"):
        line = line[:-1]
    # Protect pipes inside code spans and escaped pipes before splitting.
    pieces, cell, in_code, escaped = [], [], False, False
    for character in line:
        if escaped:
            cell.append(character if character == "|" else "\\" + character)
            escaped = False
        elif character == "\\":
            escaped = True
        elif character == "`":
            in_code = not in_code
            cell.append(character)
        elif character == "|" and not in_code:
            pieces.append("".join(cell).strip())
            cell = []
        else:
            cell.append(character)
    if escaped:
        cell.append("\\")
    pieces.append("".join(cell).strip())
    return pieces


def table_delimiter(line: str) -> bool:
    cells = split_cells(line)
    return len(cells) > 1 and all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells)


HEADING = re.compile(r"^(#{1,3})\s+(.+?)\s*#*\s*$")
LIST_ITEM = re.compile(r"^(\s*)([-+*]|\d+[.)])\s+(.+)$")
FULL_IMAGE = re.compile(r"^!\[([^\]]*)\]\((.+)\)\s*$")


def parse_markdown(source: str) -> list[list[Block]]:
    sections: list[list[Block]] = [[]]
    lines = source.replace("\r\n", "\n").splitlines()
    position = 0
    while position < len(lines):
        line = lines[position]
        stripped = line.strip()
        if not stripped:
            position += 1
            continue
        if stripped == "---":
            if sections[-1]:
                sections.append([])
            position += 1
            continue
        heading = HEADING.match(line)
        if heading:
            sections[-1].append(Block("heading", heading[2], len(heading[1])))
            position += 1
            continue
        image_match = FULL_IMAGE.match(stripped)
        if image_match:
            sections[-1].append(Block("image", image_match[2], marker=image_match[1]))
            position += 1
            continue
        if stripped.startswith("```"):
            code = []
            position += 1
            while position < len(lines) and not lines[position].strip().startswith("```"):
                code.append(lines[position])
                position += 1
            sections[-1].append(Block("code", "\n".join(code)))
            position += 1
            continue
        if position + 1 < len(lines) and table_delimiter(lines[position + 1]):
            rows = [split_cells(line)]
            delimiters = split_cells(lines[position + 1])
            aligns = ["center" if d.startswith(":") and d.endswith(":")
                      else "right" if d.endswith(":") else "left" for d in delimiters]
            position += 2
            while position < len(lines) and "|" in lines[position] and lines[position].strip():
                rows.append(split_cells(lines[position]))
                position += 1
            columns = len(rows[0])
            if any(len(row) != columns for row in rows) or len(aligns) != columns:
                raise ValueError(f"Inconsistent table column count near Markdown line {position}")
            sections[-1].append(Block("table", rows=rows, aligns=aligns))
            continue
        item = LIST_ITEM.match(line)
        if item:
            indent = len(item[1].expandtabs(4))
            text = [item[3]]
            position += 1
            while position < len(lines) and lines[position].strip():
                following = lines[position]
                if (LIST_ITEM.match(following) or HEADING.match(following)
                        or following.strip() == "---" or FULL_IMAGE.match(following.strip())):
                    break
                if position + 1 < len(lines) and table_delimiter(lines[position + 1]):
                    break
                text.append(following.strip())
                position += 1
            marker = item[2] if item[2][0].isdigit() else "•"
            sections[-1].append(Block("list", " ".join(text), min(indent // 2, 4), marker))
            continue
        if stripped.startswith(">"):
            quote = []
            while position < len(lines) and lines[position].lstrip().startswith(">"):
                quote.append(lines[position].lstrip()[1:].lstrip())
                position += 1
            sections[-1].append(Block("quote", " ".join(quote)))
            continue
        paragraph = [stripped]
        position += 1
        while position < len(lines) and lines[position].strip():
            following = lines[position]
            if (HEADING.match(following) or LIST_ITEM.match(following)
                    or following.strip() == "---" or FULL_IMAGE.match(following.strip())
                    or following.strip().startswith(("```", ">"))):
                break
            if position + 1 < len(lines) and table_delimiter(lines[position + 1]):
                break
            paragraph.append(following.strip())
            position += 1
        sections[-1].append(Block("paragraph", " ".join(paragraph)))
    return [section for section in sections if section]


def make_styles(config: Config) -> dict[str, ParagraphStyle]:
    body = ParagraphStyle(
        "Body", fontName="Editorial", fontSize=config.body_size,
        leading=config.body_size * 1.42, textColor=INK, spaceAfter=8,
        allowWidows=0, allowOrphans=0, splitLongWords=1,
    )
    styles = {"body": body}
    styles["cover_body"] = ParagraphStyle("CoverBody", parent=body, fontSize=10.5, leading=15)
    styles["cover_title"] = ParagraphStyle(
        "CoverTitle", parent=body, fontName="Interface-Bold", fontSize=29,
        leading=34.5, textColor=TEAL, spaceBefore=9, spaceAfter=15, keepWithNext=1,
    )
    styles["cover_subtitle"] = ParagraphStyle(
        "CoverSubtitle", parent=body, fontName="Editorial", fontSize=17,
        leading=22, textColor=TEAL, spaceAfter=18, keepWithNext=1,
    )
    for level, size in ((1, 23), (2, 18), (3, 12)):
        styles[f"h{level}"] = ParagraphStyle(
            f"Heading{level}", parent=body, fontName="Interface-Bold",
            fontSize=size, leading=size * 1.2, textColor=TEAL,
            spaceBefore=10 if level == 3 else 3,
            spaceAfter=9 if level == 3 else 16, keepWithNext=1,
        )
    styles["caption"] = ParagraphStyle(
        "Caption", parent=body, fontName="Interface", fontSize=7.8, leading=10.7,
        textColor=MUTED, spaceBefore=5, spaceAfter=12,
    )
    styles["table"] = ParagraphStyle(
        "TableBody", parent=body, fontName="Interface", fontSize=8.4,
        leading=11.2, spaceAfter=0, allowWidows=1, allowOrphans=1,
    )
    styles["table_head"] = ParagraphStyle(
        "TableHead", parent=styles["table"], fontName="Interface-Bold",
        textColor=PAPER, fontSize=8.2, leading=10.8,
    )
    styles["quote"] = ParagraphStyle(
        "Quote", parent=body, fontName="Editorial-Italic", textColor=TEAL,
        leftIndent=13, rightIndent=10, borderPadding=8, backColor=TINT,
        spaceBefore=5, spaceAfter=12,
    )
    styles["code"] = ParagraphStyle(
        "CodeBlock", parent=body, fontName="Code", fontSize=8,
        leading=11, backColor=TINT, borderPadding=8, spaceAfter=12,
    )
    return styles


def image_path(target: str, source: Path) -> Path:
    target = re.sub(r'\s+[\"\'].*?[\"\']$', "", target.strip())
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1]
    parsed = urlparse(target)
    if parsed.scheme and parsed.scheme != "file":
        raise ValueError(f"Images must be local files; no download attempted: {target}")
    path = Path(unquote(parsed.path if parsed.scheme == "file" else target))
    return path.resolve() if path.is_absolute() else (source.parent / path).resolve()


def measured_image(block: Block, config: Config, styles: dict, cover: bool) -> KeepTogether:
    path = image_path(block.text, config.source)
    # Do not access ReportLab's lazy _width/_height fields: Pillow is authoritative.
    with PILImage.open(path) as inspected:
        inspected.load()
        pixel_width, pixel_height = inspected.size
    if min(pixel_width, pixel_height) <= 0:
        raise ValueError(f"Invalid image dimensions: {path}")
    max_height = config.height * (0.43 if cover else 0.57)
    scale = min(config.width / pixel_width, max_height / pixel_height)
    visual = Image(str(path), width=pixel_width * scale,
                   height=pixel_height * scale, lazy=0, hAlign="CENTER")
    content = [Spacer(1, 5), visual]
    if block.marker:
        content.append(Paragraph(inline(block.marker), styles["caption"]))
    else:
        content.append(Spacer(1, 10))
    return KeepTogether(content)


def make_table(block: Block, config: Config, styles: dict) -> LongTable:
    count = len(block.rows[0])
    # Text-heavy columns receive room, but no column can starve its neighbours.
    weights = []
    for column in range(count):
        lengths = sorted(len(re.sub(r"[*_`]", "", row[column])) for row in block.rows)
        typical = lengths[min(len(lengths) - 1, math.floor(len(lengths) * 0.75))]
        weights.append(min(15.0, max(5.8, math.sqrt(typical + 14))))
    widths = [config.width * value / sum(weights) for value in weights]
    data = []
    for row_index, row in enumerate(block.rows):
        converted = []
        for column, cell in enumerate(row):
            parent = styles["table_head"] if row_index == 0 else styles["table"]
            alignment = {"left": TA_LEFT, "center": TA_CENTER, "right": TA_RIGHT}[block.aligns[column]]
            style = ParagraphStyle(f"Cell-{row_index}-{column}", parent=parent, alignment=alignment)
            converted.append(Paragraph(inline(cell), style))
        data.append(converted)
    table = LongTable(
        data, colWidths=widths, repeatRows=1, hAlign="LEFT", splitByRow=1,
        splitInRow=1, spaceBefore=3, spaceAfter=12,
    )
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PAPER, TINT]),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, TEAL),
        ("LINEBELOW", (0, -1), (-1, -1), 0.45, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


class ReportDocument(BaseDocTemplate):
    def __init__(self, config: Config, title: str):
        self.config = config
        self.report_title = title
        self.heading_sequence = 0
        self.bookmark_counts: dict[str, int] = {}
        super().__init__(
            str(config.destination), pagesize=config.page_size,
            leftMargin=config.margin, rightMargin=config.margin,
            topMargin=54, bottomMargin=46, title=title, author=config.author,
            subject="Source-based strategy-game design analysis",
            allowSplitting=1,
        )
        self.addPageTemplates([
            PageTemplate(id="Cover", frames=[self.make_frame("cover")], onPage=self.paint_cover),
            PageTemplate(id="Body", frames=[self.make_frame("body")], onPage=self.paint_body),
        ])

    def make_frame(self, name: str) -> Frame:
        return Frame(
            self.config.margin, 46, self.config.width, self.config.height,
            id=name, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        )

    def background(self, canvas) -> None:
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, *self.config.page_size, stroke=0, fill=1)

    def footer(self, canvas) -> None:
        width, _ = self.config.page_size
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.45)
        canvas.line(self.config.margin, 34, width - self.config.margin, 34)
        canvas.setFont("Interface", 7.1)
        canvas.setFillColor(MUTED)
        canvas.drawString(self.config.margin, 21, "THE SILMARILLION  /  GAME DESIGN")
        canvas.setFillColor(TEAL)
        canvas.drawRightString(width - self.config.margin, 21, f"{self.page:02d}")

    def paint_cover(self, canvas, doc) -> None:
        canvas.saveState()
        self.background(canvas)
        width, height = self.config.page_size
        canvas.setFillColor(TEAL)
        canvas.rect(0, height - 13, width, 13, stroke=0, fill=1)
        canvas.setFont("Interface-Bold", 7.5)
        canvas.setFillColor(GOLD)
        canvas.drawString(self.config.margin, height - 37, "A WORLD TO INHABIT  /  DESIGN REPORT")
        self.footer(canvas)
        canvas.restoreState()

    def paint_body(self, canvas, doc) -> None:
        canvas.saveState()
        self.background(canvas)
        width, height = self.config.page_size
        title = re.sub(r"[*_`]", "", self.report_title).upper()
        while title and pdfmetrics.stringWidth(title, "Interface-Bold", 7.2) > self.config.width - 85:
            title = title[:-1]
        canvas.setFont("Interface-Bold", 7.2)
        canvas.setFillColor(TEAL)
        canvas.drawString(self.config.margin, height - 29, title)
        canvas.setFont("Interface", 7)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(width - self.config.margin, height - 29, "DESIGN ANALYSIS")
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.45)
        canvas.line(self.config.margin, height - 38, width - self.config.margin, height - 38)
        self.footer(canvas)
        canvas.restoreState()

    def afterFlowable(self, flowable) -> None:
        if isinstance(flowable, Paragraph) and hasattr(flowable, "heading_level"):
            text = flowable.getPlainText()
            base = re.sub(r"[^\w-]+", "-", text.lower()).strip("-") or "section"
            serial = self.bookmark_counts.get(base, 0)
            self.bookmark_counts[base] = serial + 1
            key = base if serial == 0 else f"{base}-{serial}"
            self.canv.bookmarkPage(key)
            # Flat outlines avoid illegal level jumps when a report starts with H2.
            self.canv.addOutlineEntry(text, key, level=0, closed=False)


def build_story(sections: list[list[Block]], config: Config, styles: dict) -> list:
    story = [NextPageTemplate("Body")]
    for section_index, section in enumerate(sections):
        if section_index:
            story.append(PageBreak())
        cover = section_index == 0
        for block in section:
            if block.kind == "heading":
                name = "cover_title" if cover and block.level == 1 else (
                    "cover_subtitle" if cover and block.level == 2 else f"h{block.level}"
                )
                heading = Paragraph(inline(block.text), styles[name])
                heading.heading_level = block.level
                story.append(heading)
            elif block.kind == "paragraph":
                story.append(Paragraph(inline(block.text), styles["cover_body" if cover else "body"]))
            elif block.kind == "list":
                style = ParagraphStyle(
                    f"List-{block.level}", parent=styles["body"],
                    leftIndent=17 + block.level * 15, firstLineIndent=0,
                    bulletIndent=block.level * 15, bulletFontName="Interface",
                    bulletFontSize=9, spaceAfter=6,
                )
                story.append(Paragraph(inline(block.text), style, bulletText=block.marker))
            elif block.kind == "table":
                story.append(make_table(block, config, styles))
            elif block.kind == "image":
                story.append(measured_image(block, config, styles, cover))
            elif block.kind == "quote":
                story.append(Paragraph(inline(block.text), styles["quote"]))
            elif block.kind == "code":
                story.append(Preformatted(block.text, styles["code"], maxLineLength=94))
    return story


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input", "-i", type=Path, default=HERE / "docs" / "design" / "silmarillion-game-report.md")
    parser.add_argument("--output", "-o", type=Path, default=HERE / "silmarillion-game-design-report.pdf")
    parser.add_argument("--paper", choices=("a4", "large"), default="a4",
                        help="large is 225 × 310 mm; default is A4")
    parser.add_argument("--body-size", type=float, default=9.8)
    parser.add_argument("--check", action="store_true", help="Validate parse, images and flowables without writing a PDF")
    args = parser.parse_args(argv)
    source, destination = args.input.expanduser().resolve(), args.output.expanduser().resolve()
    if source == destination:
        parser.error("Input and output must be different files")
    if not 8.5 <= args.body_size <= 13:
        parser.error("--body-size must be between 8.5 and 13 points")
    page_size = A4 if args.paper == "a4" else (225 * 72 / 25.4, 310 * 72 / 25.4)
    config = Config(source, destination, page_size=page_size, body_size=args.body_size)
    source_text = source.read_text(encoding="utf-8")
    sections = parse_markdown(source_text)
    if not sections:
        parser.error("The Markdown input has no content")
    register_fonts()
    styles = make_styles(config)
    story = build_story(sections, config, styles)
    title = next((b.text for s in sections for b in s if b.kind == "heading"), source.stem)
    if args.check:
        print(f"Validated {len(sections)} sections, {len(story)} flowables; no PDF written.")
        for number, section in enumerate(sections, 1):
            words = sum(len(b.text.split()) + sum(len(c.split()) for r in b.rows for c in r) for b in section)
            label = next((b.text for b in section if b.kind == "heading"), "Untitled")
            print(f"  {number:02d}: {words:4d} words | {label}")
        return 0
    destination.parent.mkdir(parents=True, exist_ok=True)
    document = ReportDocument(config, title)
    document.build(story)
    print(f"Built {destination} ({document.page} pages)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (FileNotFoundError, ValueError) as error:
        print(f"build_report: {error}", file=sys.stderr)
        raise SystemExit(1)
