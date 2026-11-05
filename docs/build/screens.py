"""Cuts the tall full-page screenshots into panels and joins them side by side so they fit a Word page."""
import os
from PIL import Image

SRC = r"C:\Users\202308446\OneDrive - Sol Plaatje University\Desktop\AgroAdvisor\docs\phase3\screens"
PUBLIC = {"home", "login", "register"}


def compose(name, per_row, chunk_h, max_rows):
    img = Image.open(os.path.join(SRC, name + ".png")).convert("RGB")
    width = 625 if name in PUBLIC else 404
    img = img.crop((0, 0, min(width, img.width), img.height))
    chunk_h = -(-img.height // (per_row * max_rows))
    chunks = [img.crop((0, y, img.width, min(y + chunk_h, img.height))) for y in range(0, img.height, chunk_h)]
    chunks = chunks[: per_row * max_rows]
    rows = [chunks[i : i + per_row] for i in range(0, len(chunks), per_row)]
    gap = 14
    out_w = per_row * img.width + (per_row - 1) * gap
    out_h = len(rows) * chunk_h + (len(rows) - 1) * gap
    out = Image.new("RGB", (out_w, out_h), (200, 200, 200))
    for r, row in enumerate(rows):
        for c, chunk in enumerate(row):
            out.paste(chunk, (c * (img.width + gap), r * (chunk_h + gap)))
    path = os.path.join(SRC, "composite-" + name + ".png")
    out.save(path)
    return path, img.height, len(chunks)


if __name__ == "__main__":
    for n, per_row, ch, rows in (("home", 2, 900, 1), ("login", 1, 700, 1), ("register", 1, 900, 1), ("dashboard", 2, 900, 1),
                                 ("farm", 2, 900, 2), ("lessons", 3, 900, 2), ("memory", 2, 900, 1), ("community", 3, 900, 2)):
        print(n, compose(n, per_row, ch, rows))

