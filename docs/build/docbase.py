"""Shared python-docx helpers for the AgroAdvisor project documents."""
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_COLOR_INDEX, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Cm, RGBColor

GREEN = RGBColor(0x1F, 0x4D, 0x2B)
CENTER = WD_ALIGN_PARAGRAPH.CENTER
doc = None


def init(footer_text):
    global doc
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.left_margin = sec.right_margin = Cm(2.5)
    sec.top_margin = sec.bottom_margin = Cm(2.5)
    st = doc.styles["Normal"]
    st.font.name = "Calibri"
    st.font.size = Pt(11)
    st.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    st.paragraph_format.space_after = Pt(6)
    st.paragraph_format.line_spacing = 1.15
    for name, size in (("Heading 1", 16), ("Heading 2", 13), ("Heading 3", 11.5)):
        h = doc.styles[name]
        h.font.name = "Calibri"
        h.font.size = Pt(size)
        h.font.bold = True
        h.font.color.rgb = GREEN
        h.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
        h.paragraph_format.space_before = Pt(14 if name == "Heading 1" else 10)
        h.paragraph_format.keep_with_next = True
    fp = sec.footer.paragraphs[0]
    fp.alignment = CENTER
    fp.add_run(footer_text + " | Page ").font.size = Pt(9)
    field(fp, "PAGE")
    return doc


def add_runs(p, text, bold=False, italic=False, size=None):
    # Text in [[double brackets]] is highlighted so unfinished evidence is obvious.
    parts = text.split("[[")
    for i, part in enumerate(parts):
        if i == 0:
            seg = [(part, False)]
        else:
            inner, _, rest = part.partition("]]")
            seg = [("[" + inner + "]", True), (rest, False)]
        for s, hl in seg:
            if not s:
                continue
            r = p.add_run(s)
            r.bold = bold
            r.italic = italic
            if size:
                r.font.size = Pt(size)
            if hl:
                r.font.highlight_color = WD_COLOR_INDEX.YELLOW


def para(text="", bold=False, italic=False, align=None, size=None):
    p = doc.add_paragraph()
    add_runs(p, text, bold, italic, size)
    if align is not None:
        p.alignment = align
    return p


def bullet(text):
    p = doc.add_paragraph(style="List Bullet")
    add_runs(p, text)
    p.paragraph_format.space_after = Pt(3)
    return p


def heading(text, level=1):
    return doc.add_heading(text, level=level)


def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    tcPr.append(shd)


def table(headers, rows, widths=None, size=9.5):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers):
        c = t.rows[0].cells[i]
        c.text = ""
        r = c.paragraphs[0].add_run(h)
        r.bold = True
        r.font.size = Pt(size)
        r.font.color.rgb = RGBColor(255, 255, 255)
        shade(c, "1F4D2B")
    trPr = t.rows[0]._tr.get_or_add_trPr()
    th = OxmlElement("w:tblHeader")
    th.set(qn("w:val"), "true")
    trPr.append(th)
    for row in rows:
        cells = t.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = ""
            p = cells[i].paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            add_runs(p, v, size=size)
    if widths:
        for row in t.rows:
            for i, w in enumerate(widths):
                row.cells[i].width = Cm(w)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


def caption(text):
    return para(text, italic=True, align=CENTER, size=9.5)


def figure(path, width_cm, text):
    p = doc.add_paragraph()
    p.alignment = CENTER
    p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(path, width=Cm(width_cm))
    caption(text)


def page_break():
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def field(p, instr):
    r = p.add_run()
    for kind, txt in (("begin", None), (None, instr), ("separate", None), (None, "1"), ("end", None)):
        if kind:
            el = OxmlElement("w:fldChar")
            el.set(qn("w:fldCharType"), kind)
        elif txt == instr:
            el = OxmlElement("w:instrText")
            el.set(qn("xml:space"), "preserve")
            el.text = instr
        else:
            el = OxmlElement("w:t")
            el.text = txt
        r._r.append(el)


def cover(phase_label, subtitle, doc_name, supervisor, extra_note=True):
    for line, size, bold in (
        ("SCHOOL OF NATURAL AND APPLIED SCIENCES", 13, True),
        ("DEPARTMENT OF COMPUTER SCIENCE AND INFORMATION TECHNOLOGY (CSIT)", 11, True),
        ("PROJECT - NPRJ740", 11, False),
        ("ADVANCED ICT DIPLOMA - 2026", 11, False),
        ("SUPERVISOR: " + supervisor, 11, False),
    ):
        para(line, bold=bold, align=CENTER, size=size)
    para("")
    para(phase_label, bold=True, align=CENTER, size=22)
    para(subtitle, bold=True, align=CENTER, size=15)
    para("")
    table(
        ["Field", "Details"],
        [
            ["Name of Document", doc_name],
            ["Project Title", "AgroAdvisor: an AI-assisted farm advisory platform for smallholder farmers"],
            ["Name of the System", "AgroAdvisor"],
            ["Student Name", "[[Student name]]"],
            ["Student Number", "[[Student number]]"],
            ["Submission Date", "[[Confirm submission date with the supervisor]]"],
        ],
        widths=[4.5, 11.5],
        size=11,
    )
    if extra_note:
        para("Yellow-highlighted text marks content that still needs a personal detail or real evidence from the student.",
             italic=True, align=CENTER, size=9.5)
    page_break()
    para("TABLE OF CONTENTS", bold=True, size=14)
    p = doc.add_paragraph()
    field(p, 'TOC \\o "1-2" \\h \\z \\u')
    page_break()
