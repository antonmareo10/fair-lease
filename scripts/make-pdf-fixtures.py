"""Builds the awkward PDFs the upload tests use (tests/fixtures/pdf/). Run once: python scripts/make-pdf-fixtures.py

Needs PyMuPDF and pypdf (dev tools only, not app dependencies) and Windows' Arial. The three sample PDFs in public/samples/
are the real ones from the prepared material; these are the edge cases around them:

- two-columns.pdf  the fair sample set in two columns, written line by line ACROSS both columns
                    (left line, right line, ...) so the reading order must come from the layout,
                    plus a full-width title, a hyphenated word and a running footer
- scanned.pdf      page images of the traps sample with no text layer (what a phone scan gives)
- protected.pdf    the reform sample with an open password
- damaged.pdf      the first half of a real PDF
"""
import json
import pathlib

import fitz  # PyMuPDF
from pypdf import PdfReader, PdfWriter

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "tests" / "fixtures" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)

FONT = "arial"
# An embedded TrueType font, so accents and the euro sign survive (the built-in Helvetica has no €).
FONT_FILE = "C:/Windows/Fonts/arial.ttf"
MEASURE = fitz.Font(fontfile=FONT_FILE)
SIZE = 9.5
LEAD = 12.5


def wrap(text: str, width: float) -> list[str]:
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if MEASURE.text_length(trial, fontsize=SIZE) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def two_columns() -> None:
    text = json.loads((ROOT / "samples" / "fair-2024.json").read_text(encoding="utf8"))["text"]
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    title, body = paragraphs[0], paragraphs[1:]
    col_w, gutter, margin = 240.0, 30.0, 42.0
    # Build each column's lines (with a blank line between paragraphs), then pour them into pages.
    lines: list[str] = []
    for p in body:
        wrapped = wrap(p, col_w)
        lines.extend(wrapped + [""])
    # One deliberate hyphenation: break "vivienda" across two lines the way a word processor would.
    for i, line in enumerate(lines):
        if " vivienda " not in line:  # in the middle of a line, so the next line goes on with the rest
            continue
        head, _, tail = line.partition(" vivienda")
        lines[i : i + 1] = [f"{head} vi-", f"vienda{tail}".strip()]
        break
    doc = fitz.open()
    top = 110.0
    per_col = int((842 - top - 70) // LEAD)
    chunks = [lines[i : i + per_col] for i in range(0, len(lines), per_col)]
    pages = [chunks[i : i + 2] for i in range(0, len(chunks), 2)]
    for n, cols in enumerate(pages, start=1):
        page = doc.new_page(width=595, height=842)
        if n == 1:
            page.insert_text((margin, 70), title, fontname=FONT, fontfile=FONT_FILE, fontsize=14)
        left = cols[0]
        right = cols[1] if len(cols) > 1 else []
        for row in range(max(len(left), len(right))):
            y = top + row * LEAD
            if row < len(left) and left[row]:
                # The subset Arial maps "-" to a soft hyphen, which readers drop; the built-in Helvetica keeps a real one.
                font = dict(fontname="helv") if left[row].endswith("-") else dict(fontname=FONT, fontfile=FONT_FILE)
                page.insert_text((margin, y), left[row], fontsize=SIZE, **font)
            if row < len(right) and right[row]:
                page.insert_text((margin + col_w + gutter, y), right[row], fontname=FONT, fontfile=FONT_FILE, fontsize=SIZE)
        page.insert_text((270, 815), f"Página {n} de {len(pages)}", fontname=FONT, fontfile=FONT_FILE, fontsize=8)
    doc.subset_fonts()
    doc.save(OUT / "two-columns.pdf", garbage=4, deflate=True)


def scanned() -> None:
    src = fitz.open(ROOT / "public" / "samples" / "traps-2025.pdf")
    doc = fitz.open()
    for page in src:
        pix = page.get_pixmap(dpi=70, colorspace=fitz.csGRAY)
        out = doc.new_page(width=page.rect.width, height=page.rect.height)
        out.insert_image(out.rect, stream=pix.tobytes("jpeg", jpg_quality=55))
    doc.save(OUT / "scanned.pdf", garbage=4, deflate=True)


def protected() -> None:
    reader = PdfReader(ROOT / "public" / "samples" / "reform-oct-2026.pdf")
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt(user_password="alquiler", owner_password="alquiler-owner", algorithm="AES-128")
    with open(OUT / "protected.pdf", "wb") as f:
        writer.write(f)


def damaged() -> None:
    data = (ROOT / "public" / "samples" / "fair-2024.pdf").read_bytes()
    (OUT / "damaged.pdf").write_bytes(data[: len(data) // 2])


if __name__ == "__main__":
    two_columns()
    scanned()
    protected()
    damaged()
    for f in sorted(OUT.iterdir()):
        print(f.name, f.stat().st_size)
