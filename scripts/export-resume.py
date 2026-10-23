#!/usr/bin/env python3
"""Export the existing resume.html content to a two-page A4 PDF.

This is a ReportLab document layout, not a browser print emulation. It reads
the resume's HTML as its only content source. Dependencies: reportlab, lxml,
PyMuPDF, pypdf. PyMuPDF supplies its bundled Droid Sans Fallback TrueType font;
ReportLab embeds only the used glyphs. No browser, remote request or private
font file is required.

Usage: python scripts/export-resume.py
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import tempfile
from html import escape
from pathlib import Path
from urllib.parse import urljoin

import fitz
from lxml import html
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://zhouey314-cloud.github.io/"
INK = colors.HexColor("#171b18")
MUTED = colors.HexColor("#4f594a")
FOREST = colors.HexColor("#3c531e")
LINE = colors.HexColor("#d1d5c8")
PAPER = colors.HexColor("#f3f3ec")
ACID = colors.HexColor("#d6fa58")


def classes(node, name):
    return node.xpath(
        './/*[contains(concat(" ", normalize-space(@class), " "), " '
        + name
        + ' ")]'
    )


def one(node, name):
    values = classes(node, name)
    if len(values) != 1:
        raise ValueError(f"Expected one .{name}, found {len(values)}")
    return values[0]


def text(node):
    value = " ".join(node.itertext())
    return re.sub(r"\s+", " ", value).strip().replace("—", "-").replace("–", "-")


def link_target(anchor):
    result = urljoin(ORIGIN, anchor.get("href", ""))
    if not result.startswith(("https://", "mailto:")):
        raise ValueError(f"Unsupported link target: {result}")
    return result


def register_fonts():
    pdfmetrics.registerFont(TTFont("ResumeCJK", io.BytesIO(fitz.Font("cjk").buffer)))
    pdfmetrics.registerFontFamily(
        "ResumeCJK", normal="ResumeCJK", bold="ResumeCJK", italic="ResumeCJK", boldItalic="ResumeCJK"
    )


def styles():
    base = dict(fontName="ResumeCJK", textColor=INK, wordWrap="CJK", allowWidows=0, allowOrphans=0)
    return {
        "name": ParagraphStyle("Name", **base, fontSize=27, leading=34),
        "latin": ParagraphStyle("Latin", fontName="Helvetica-Bold", textColor=INK, fontSize=11, leading=16),
        "role": ParagraphStyle("Role", **base, fontSize=11, leading=17),
        "summary": ParagraphStyle("Summary", **base, fontSize=9.1, leading=14.7),
        "section": ParagraphStyle("Section", **base, fontSize=11, leading=16),
        "project": ParagraphStyle("Project", **base, fontSize=10.5, leading=15),
        "body": ParagraphStyle("Body", **base, fontSize=8.5, leading=13),
        "bullet": ParagraphStyle("Bullet", **base, fontSize=8.5, leading=13, leftIndent=8, firstLineIndent=-8, spaceAfter=3),
        "meta": ParagraphStyle("Meta", **{**base, "textColor": FOREST}, fontSize=7.4, leading=11),
        "scope": ParagraphStyle("Scope", **{**base, "textColor": MUTED}, fontSize=7.1, leading=10.5),
        "link": ParagraphStyle("Link", **{**base, "textColor": FOREST}, fontSize=6.9, leading=10),
        "micro": ParagraphStyle("Micro", **{**base, "textColor": MUTED}, fontSize=7.4, leading=11),
        "date": ParagraphStyle("Date", **{**base, "textColor": MUTED}, fontSize=7.5, leading=12, alignment=TA_RIGHT),
        "capability": ParagraphStyle("Capability", **base, fontSize=11, leading=17, spaceAfter=6),
        "detail": ParagraphStyle("Detail", **{**base, "textColor": MUTED}, fontSize=9.3, leading=16),
        "detail-link": ParagraphStyle("DetailLink", **{**base, "textColor": FOREST}, fontSize=8, leading=13),
    }


def p(value, style):
    return Paragraph(escape(value), style)


def linked(anchor, style, show_url=False):
    target = link_target(anchor)
    label = text(anchor).replace("↗", "").strip()
    if show_url:
        label += "  |  " + target
    return Paragraph(f'<link href="{escape(target, quote=True)}">{escape(label)}</link>', style)


def table(cells, widths, padding=0):
    result = Table(cells, colWidths=widths, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), padding),
        ("RIGHTPADDING", (0, 0), (-1, -1), padding),
        ("TOPPADDING", (0, 0), (-1, -1), padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
    ]))
    return result


def section_heading(number, title, style):
    return Paragraph(
        f'<font color="#3c531e" size="8">{number}</font>  {escape(title)}', style
    )


def first_page(tree, s, width):
    intro = one(tree, "resume-intro")
    heading = intro.xpath(".//h1")[0]
    name = (heading.text or "").strip()
    latin = text(heading.xpath("./span")[0])
    result = [
        table([[p(text(one(intro, "resume-kicker")), s["micro"]), p(text(one(intro, "resume-edition")), s["date"])]], [width * .75, width * .25]),
        Spacer(1, 9),
        table([[p(name, s["name"]), [Spacer(1, 5), p(latin, s["latin"]), p(text(one(intro, "resume-identity")), s["micro"])]]], [width * .57, width * .43]),
        Spacer(1, 4),
        p(text(one(intro, "resume-role")), s["role"]),
        Spacer(1, 8),
        p(text(one(intro, "resume-summary")), s["summary"]),
        Spacer(1, 7),
    ]
    top_links = one(intro, "resume-top-links").xpath("./a")
    link_markup = []
    for anchor in top_links:
        target = link_target(anchor)
        label = text(anchor).replace("↗", "").strip()
        if target == ORIGIN:
            label = "zhouey314-cloud.github.io"
        link_markup.append(f'<link href="{escape(target, quote=True)}">{escape(label)}</link>')
    result.extend([
        Paragraph("  /  ".join(link_markup), s["meta"]),
        Spacer(1, 10),
        HRFlowable(width="100%", thickness=.7, color=LINE),
        Spacer(1, 11),
    ])

    experience = one(tree, "resume-experience")
    experience_heading = one(experience, "resume-item-heading")
    block = [
        section_heading("01", "企业实践", s["section"]), Spacer(1, 7),
        table([[p(text(experience_heading.xpath("./h3")[0]), s["project"]), p(text(experience_heading.xpath("./p")[0]), s["date"])]], [width * .7, width * .3]),
        p(text(one(experience, "resume-item-meta")), s["meta"]), Spacer(1, 5),
    ]
    for item in one(experience, "resume-bullets").xpath("./li"):
        block.append(p("- " + text(item), s["bullet"]))
    for anchor in one(experience, "resume-evidence-links").xpath("./a"):
        block.append(linked(anchor, s["link"], show_url=True))
    result.extend([KeepTogether(block), Spacer(1, 12), section_heading("02", "个人开源项目", s["section"]), Spacer(1, 8)])

    for i, project in enumerate(classes(tree, "resume-project")):
        project_heading = one(project, "resume-project-heading")
        block = [
            table([[p(text(project_heading.xpath("./h3")[0]), s["project"]), p(text(project_heading.xpath("./span")[0]), s["date"])]], [width * .8, width * .2]),
            p(text(one(project, "resume-project-purpose")), s["body"]),
            p(text(one(project, "resume-item-meta")), s["meta"]), Spacer(1, 4),
        ]
        for item in one(project, "resume-bullets").xpath("./li"):
            block.append(p("- " + text(item), s["bullet"]))
        block.extend([p(text(one(project, "resume-project-scope")), s["scope"]), Spacer(1, 3)])
        for anchor in one(project, "resume-evidence-links").xpath("./a"):
            block.append(linked(anchor, s["link"], show_url=True))
        if i < 2:
            block.extend([Spacer(1, 7), HRFlowable(width="100%", thickness=.4, color=LINE), Spacer(1, 8)])
        result.append(KeepTogether(block))
    return result


def second_page(tree, s, width):
    details = one(tree, "resume-details")
    continuation = one(details, "resume-print-continuation")
    result = [
        p(text(continuation.xpath("./strong")[0]), s["name"]),
        p(text(continuation.xpath("./span")[0]), s["meta"]),
        Spacer(1, 13), HRFlowable(width="100%", thickness=.7, color=LINE), Spacer(1, 15),
        section_heading("03", "能带来的价值", s["section"]), Spacer(1, 11),
    ]
    capability_cells = []
    for item in one(details, "resume-capability-list").xpath("./li"):
        inner = item.xpath("./div")[0]
        capability_cells.append([
            p(text(inner.xpath("./h3")[0]), s["capability"]),
            p(text(inner.xpath("./p")[0]), s["detail"]), Spacer(1, 7),
            linked(inner.xpath("./a")[0], s["detail-link"]),
        ])
    capabilities = table([capability_cells[:2], capability_cells[2:]], [width / 2, width / 2], 14)
    capabilities.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PAPER),
        ("LINEBELOW", (0, 0), (-1, 0), .5, LINE),
        ("LINEAFTER", (0, 0), (0, -1), .5, LINE),
    ]))
    result.extend([capabilities, Spacer(1, 20)])

    technology = [section_heading("04", "项目中使用", s["section"]), Spacer(1, 10)]
    for item in one(details, "resume-tech-list").xpath("./div"):
        technology.extend([p(text(item.xpath("./dt")[0]), s["project"]), p(text(item.xpath("./dd")[0]), s["detail"]), Spacer(1, 9)])
    education = one(details, "resume-education")
    education_content = [
        section_heading("05", "教育与视角", s["section"]), Spacer(1, 10),
        p(text(education.xpath("./h3")[0]), s["project"]),
    ]
    for item in education.xpath("./p"):
        education_content.extend([p(text(item), s["detail"]), Spacer(1, 8)])
    education_content.append(linked(education.xpath("./a")[0], s["detail-link"]))
    result.extend([
        table([[technology, "", education_content]], [(width - 28) / 2, 28, (width - 28) / 2]),
        Spacer(1, 9), HRFlowable(width="100%", thickness=.6, color=LINE), Spacer(1, 14),
    ])

    contact = one(details, "resume-contact")
    result.extend([section_heading("06", "聊聊具体的工作", s["section"]), Spacer(1, 8), p(text(contact.xpath("./p")[0]), s["detail"]), Spacer(1, 7)])
    contact_rows = []
    for item in one(contact, "resume-contact-list").xpath("./li"):
        contact_rows.append([p(text(item.xpath("./span")[0]), s["micro"]), linked(item.xpath("./a")[0], s["detail-link"])])
    contact_table = table(contact_rows, [62, width - 62])
    contact_table.setStyle(TableStyle([("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    result.extend([contact_table, Spacer(1, 16)])
    footer = one(tree, "resume-document-footer")
    result.extend([p(text(footer.xpath("./p")[0]), s["scope"]), Spacer(1, 4), linked(footer.xpath("./a")[0], s["link"], show_url=True)])
    return result


def page_decoration(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(.45)
    canvas.line(40, 29, width - 40, 29)
    canvas.setFont("ResumeCJK", 6.8)
    canvas.setFillColor(MUTED)
    canvas.drawString(40, 17, "周恩宇 Ethan | FDE / AI 应用工程方向")
    canvas.drawRightString(width - 40, 17, f"0{doc.page} / 02")
    canvas.setFillColor(ACID)
    canvas.rect(width - 48, height - 37, 8, 3, stroke=0, fill=1)
    canvas.restoreState()


def verify_pdf(path):
    reader = PdfReader(path)
    if len(reader.pages) != 2:
        raise ValueError(f"Expected exactly two A4 pages; got {len(reader.pages)}")
    full_text = "\n".join(page.extract_text() or "" for page in reader.pages)
    for phrase in ["周恩宇", "企业实践", "个人开源项目", "广播电视编导", "Enterprise RAG", "RelayAudit", "AI Video Workflow Engine", "zhouey314@gmail.com"]:
        if phrase not in full_text:
            raise ValueError(f"Missing extractable PDF content: {phrase}")
    links = []
    embedded_fonts = set()
    for page in reader.pages:
        if abs(float(page.mediabox.width) - A4[0]) > 1 or abs(float(page.mediabox.height) - A4[1]) > 1:
            raise ValueError("Unexpected page size")
        for annotation in page.get("/Annots", []):
            action = annotation.get_object().get("/A", {})
            if action.get("/S") == "/URI":
                uri = str(action["/URI"])
                if not uri.startswith(("https://", "mailto:")):
                    raise ValueError(f"Invalid PDF link: {uri}")
                links.append(uri)
        for font in page.get("/Resources", {}).get("/Font", {}).values():
            item = font.get_object()
            descriptor = item.get("/FontDescriptor")
            if descriptor and any(key in descriptor.get_object() for key in ["/FontFile", "/FontFile2", "/FontFile3"]):
                embedded_fonts.add(str(item.get("/BaseFont")))
    for required in [ORIGIN + "cases/rag.html", ORIGIN + "cases/relay-audit.html", ORIGIN + "cases/video.html", "https://github.com/zhouey314-cloud", "mailto:zhouey314@gmail.com"]:
        if required not in links:
            raise ValueError(f"Missing required clickable link: {required}")
    if not embedded_fonts:
        raise ValueError("Expected an embedded Chinese font")
    return {"pages": 2, "clickable_links": len(links), "embedded_fonts": sorted(embedded_fonts), "text_characters": len(full_text)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=ROOT / "resume.html")
    parser.add_argument("--output", type=Path, default=ROOT / "public/ethan-zhou-resume.pdf")
    args = parser.parse_args()
    source_bytes = args.source.read_bytes()
    tree = html.fromstring(source_bytes.decode("utf-8"))
    register_fonts()
    s = styles()
    width = A4[0] - 80
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="ethan-resume-export-") as directory:
        temporary = Path(directory) / "resume.pdf"
        doc = SimpleDocTemplate(
            str(temporary), pagesize=A4, leftMargin=40, rightMargin=40,
            topMargin=32, bottomMargin=41, title="周恩宇 Ethan - 工作与项目简历",
            author="周恩宇 Ethan", subject="FDE / AI 应用工程方向；内容来自 resume.html",
            creator="ReportLab document export from resume.html", pageCompression=1,
        )
        story = first_page(tree, s, width) + [PageBreak()] + second_page(tree, s, width)
        doc.build(story, onFirstPage=page_decoration, onLaterPages=page_decoration)
        report = verify_pdf(temporary)
        args.output.write_bytes(temporary.read_bytes())
    report.update({"output": str(args.output), "source_sha256": hashlib.sha256(source_bytes).hexdigest(), "renderer": "ReportLab, not browser print", "bytes": args.output.stat().st_size})
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
