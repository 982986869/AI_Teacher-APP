#!/usr/bin/env python
"""Pure text extraction for the textbook pipeline (no judgement, re-runnable).

    python -I -X utf8 scripts/textbooks/extract.py --book jemh1 [--chapter 7]

Reads data/textbooks/pdf/<code>NN.pdf, writes data/textbooks/class10/<code>/chNN.raw.json
and renders the prelims cover to public/books/<code>.png. Needs PyMuPDF (pip install pymupdf).
Python is only used here, offline; the server never needs it.
"""
import argparse
import json
import os
import re
import unicodedata
import sys
from collections import Counter

import fitz  # PyMuPDF

HERE = os.path.dirname(os.path.abspath(__file__))
SERVER = os.path.abspath(os.path.join(HERE, "..", ".."))
PDF_DIR = os.path.join(SERVER, "data", "textbooks", "pdf")
COVER_DIR = os.path.join(SERVER, "public", "books")

# "7.2 Distance Formula", "2.4. Linear growth" (trailing dot, 2026-27 Maths), "6.3 π Is
# Irrational" (any letter, not just A-Z). Formulas ("3.4 = …") are kept out downstream.
HEADING_RE = re.compile(r"^\d{1,2}\.\d{1,2}(\.\d{1,2})?\.?\s+(?:[^\W\d_]|\()")
END_MARKERS = ("summary", "what you have learnt", "exercises", "points to ponder", "historical note")
INLINE_EXERCISE_RE = re.compile(r"^(EXERCISE\s+\d+\.\d+|Q\s*U\s*E\s*S\s*T\s*I\s*O\s*N\s*S)\s*$", re.I)
# Maths numbers its end-of-chapter summary ("1.4 Summary"); it is an end marker, not a topic.
NUMBERED_SUMMARY_RE = re.compile(r"^\d{1,2}\.\d{1,2}\s+Summary\s*$", re.I)
REPRINT_RE = re.compile(r"^Reprint\s+\d{4}-\d{2}\s*$", re.I)
BOLD_FACE_RE = re.compile(r"bold|demi|black|heavy|semibold|extrabold|ultra", re.I)


def load_manifest():
    with open(os.path.join(HERE, "books.json"), encoding="utf-8") as f:
        return json.load(f)


def page_lines(page):
    """Lines in reading order with the max span size and a bold flag."""
    d = page.get_text("dict", sort=True)
    out = []
    for b in d["blocks"]:
        for l in b.get("lines", []):
            spans = [s for s in l["spans"] if s["text"].strip()]
            if not spans:
                continue
            text = "".join(s["text"] for s in l["spans"]).strip()
            # The 2026-27 books carry stray control characters inside headings
            # ("4.3 \x07Factorisation") — a tab-like glyph in the heading font.
            text = re.sub(r"[\x00-\x1f\x7f]+", " ", text)
            # Ligature glyphs arrive followed by a stray space ("Reﬂ ections"): close
            # the gap, then spell the ligature out (NFKC: ﬂ → fl).
            text = re.sub(r"([ﬀ-ﬆ]) (?=[a-z])", r"\1", text)
            text = unicodedata.normalize("NFKC", text)
            text = re.sub(r"\s+", " ", text).strip()
            out.append({
                "text": text,
                "size": round(max(s["size"] for s in spans), 1),
                # Bold by flag or by face name: the senior books set headings in
                # Bookman-Demi / Helvetica-Black etc., which carry no bold flag.
                "bold": any(BOLD_FACE_RE.search(s["font"]) or (s["flags"] & 16) for s in spans),
            })
    return out


def _overlap(acc, frag):
    """Largest k such that acc ends with frag[:k] (k >= 2), else 0."""
    for k in range(min(len(acc), len(frag)), 1, -1):
        if acc.endswith(frag[:k]):
            return k
    return 0


def clean_lines(lines, body):
    """Undo the typesetting artefacts PyMuPDF surfaces as separate lines.

    - Science headings are drawn several times as overlapping fragments (an outline
      effect): "1.1 CHEMIC", "1.1 CHEMICAL EQUA", "AL EQUATIONS", "TIONS" → one line.
    - The in-text question box title is set vertically, one letter per line
      (Q, U, E, S, T, I, O, N, S) → one "QUESTIONS" line so it can be cut.
    - Decorative glyphs: a giant "?" (size ≥ 40) and Wingdings bullets that come
      through as a tiny "n" are dropped.
    - A drop cap ("C" at 30pt) lands AFTER the line it belongs to ("onsider...") → joined.
    """
    out = []
    i = 0
    n = len(lines)
    while i < n:
        ln = lines[i]
        t, sz = ln["text"], ln["size"]
        if sz >= 40 and len(t) <= 2:
            i += 1
            continue
        if REPRINT_RE.match(t):  # page footer
            i += 1
            continue
        if len(t) == 1 and t.isalpha() and t.islower() and sz < body - 1:
            i += 1
            continue
        # vertical single-letter run (question box title)
        if len(t) == 1 and t.isupper() and sz >= body + 5:
            j = i
            letters = []
            while j < n and len(lines[j]["text"]) == 1 and lines[j]["text"].isupper() and lines[j]["size"] == sz:
                letters.append(lines[j]["text"])
                j += 1
            if len(letters) >= 4:
                out.append({"text": "".join(letters), "size": sz, "bold": False})
                i = j
                continue
            # drop cap: a single capital sorted after the paragraph's first lines. Walk
            # back over the lines that start lowercase (at most 3) and prepend it to
            # the earliest one — that is the one whose first letter it is.
            if sz >= 20 and out and out[-1]["text"][:1].islower() and out[-1]["size"] <= body + 1:
                k = len(out) - 1
                para_size = out[k]["size"]
                while k - 1 >= 0 and len(out) - k < 3 and out[k - 1]["text"][:1].islower() and out[k - 1]["size"] == para_size:
                    k -= 1
                out[k]["text"] = t + out[k]["text"]
                i += 1
                continue
            # ...or sorted BEFORE its paragraph: prepend to the next lowercase-starting line
            if sz >= 20 and i + 1 < n and lines[i + 1]["text"][:1].islower() and lines[i + 1]["size"] <= body + 1:
                lines[i + 1]["text"] = t + lines[i + 1]["text"]
                i += 1
                continue
        # a section number alone on its line ("13.2") with the title on the next line
        # (Class 11-12 set it bold at body size: "3.1" / "WHY DO WE NEED TO CLASSIFY…")
        if re.fullmatch(r"\d{1,2}\.\d{1,2}(\.\d{1,2})?", t) and (sz >= body + 2 or ln["bold"]) and i + 1 < n and lines[i + 1]["size"] == sz:
            if not lines[i + 1]["text"].startswith(t):  # else it is a stacked fragment of the next line
                lines[i + 1]["text"] = t + " " + lines[i + 1]["text"]
            i += 1
            continue
        # stacked heading fragments
        if sz >= body + 2 and len(t) >= 3:
            acc = t
            j = i + 1
            while j < n and lines[j]["size"] == sz:
                frag = lines[j]["text"]
                if frag in acc:
                    j += 1
                    continue
                k = _overlap(acc, frag)
                if k:
                    acc += frag[k:]
                    j += 1
                    continue
                # a heading that wraps: the next same-size line that is not itself a
                # numbered heading is its second line
                if HEADING_RE.match(acc) and not HEADING_RE.match(frag) and sum(c.isalpha() for c in frag) >= 3:
                    acc += " " + frag
                    j += 1
                    continue
                break
            out.append({"text": acc, "size": sz, "bold": ln["bold"]})
            i = j
            continue
        out.append(ln)
        i += 1
    return out


def chapter_title_of(first_page_lines, body):
    """The chapter title: the largest-font wordy line(s) on page 1 (digits and drop caps
    excluded), joined when the title wraps onto a second line of the same size."""
    wordy = [(i, ln) for i, ln in enumerate(first_page_lines) if sum(c.isalpha() for c in ln["text"]) >= 3 and not HEADING_RE.match(ln["text"])]
    if not wordy:
        return ""
    i, best = max(wordy, key=lambda p: p[1]["size"])
    parts = [best["text"]]
    j = i + 1
    while j < len(first_page_lines) and first_page_lines[j]["size"] == best["size"] and sum(c.isalpha() for c in first_page_lines[j]["text"]) >= 2:
        parts.append(first_page_lines[j]["text"])
        j += 1
    title = " ".join(parts)
    return title.title() if title.isupper() else title


def strip_running_header(lines, book_title, chapter_title):
    """Drop page numbers / 'PHYSICS' / chapter-name running heads in the first 3 lines."""
    caps = {book_title.upper(), (chapter_title or "").upper()}
    n = len(lines)

    def is_head(t):
        return bool(
            re.fullmatch(r"\d{1,3}", t)
            or re.fullmatch(r"\d{1,3}\s+[A-Z ]{3,40}", t)
            or re.fullmatch(r"[A-Z ]{3,40}\s+\d{1,3}", t)
            or t.upper() in caps
        )

    keep, dropped_top, dropped_bottom = [], 0, 0
    for i, ln in enumerate(lines):
        t = ln["text"]
        # Running heads sit in the first lines of a page (even pages) or the last
        # lines (odd pages: chapter name, then the page number).
        if i < 3 and dropped_top < 2 and is_head(t):
            dropped_top += 1
            continue
        if i >= n - 3 and dropped_bottom < 2 and is_head(t):
            dropped_bottom += 1
            continue
        keep.append(ln)
    return keep


def extract_chapter(book, n):
    code = book["code"]
    pdf = os.path.join(PDF_DIR, f"{code}{n:02d}.pdf")
    doc = fitz.open(pdf)
    pages = [page_lines(p) for p in doc]

    sizes = Counter()
    for pl in pages:
        for ln in pl:
            sizes[ln["size"]] += len(ln["text"])
    body = sizes.most_common(1)[0][0]

    pages = [clean_lines(pl, body) for pl in pages]
    chapter_title = chapter_title_of(pages[0], body)
    pages = [strip_running_header(pl, book["title"], chapter_title) for pl in pages]

    cands, ends = [], []
    for pi, pl in enumerate(pages):
        for li, ln in enumerate(pl):
            t = ln["text"]
            if HEADING_RE.match(t) and (ln["bold"] or ln["size"] >= body + 1) and not re.search(r"[=<>]", t):
                cands.append({"page": pi, "line": li, "text": t, "size": ln["size"], "bold": ln["bold"]})
            low = t.lower().strip(" :")
            if low in END_MARKERS or INLINE_EXERCISE_RE.match(t) or NUMBERED_SUMMARY_RE.match(t):
                ends.append({"page": pi, "line": li, "text": t})

    return {
        # A part-2 book continues part 1's numbering (Class 9 Maths Part 2 is chapters
        # 9–14), so its section numbers read "12.1": chapterOffset keeps them in step.
        "code": code, "chapterNumber": n + int(book.get("chapterOffset", 0)), "pageCount": len(doc), "chapterTitle": chapter_title,
        # The opening lines as printed, for the outline step to confirm the title: the
        # younger classes' books wrap it across lines of different sizes and decorate
        # the page with giant glyphs, which defeats the largest-font heuristic above.
        "firstPage": [{"text": ln["text"], "size": ln["size"]} for ln in pages[0][:14] if ln["text"]],
        "bodySize": body,
        "pages": [{"index": i, "lines": pl} for i, pl in enumerate(pages)],
        "headingCandidates": cands, "endMarkers": ends,
    }


def render_cover(book):
    pdf = os.path.join(PDF_DIR, f"{book['code']}ps.pdf")
    os.makedirs(COVER_DIR, exist_ok=True)
    pix = fitz.open(pdf)[0].get_pixmap(matrix=fitz.Matrix(2, 2))
    out = os.path.join(COVER_DIR, f"{book['code']}.png")
    pix.save(out)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--book")
    ap.add_argument("--chapter", type=int)
    a = ap.parse_args()
    for book in load_manifest():
        if a.book and book["code"] != a.book:
            continue
        out_dir = os.path.join(SERVER, "data", "textbooks", f"class{book['classLevel']}", book["code"])
        os.makedirs(out_dir, exist_ok=True)
        if not a.chapter:
            print("cover", render_cover(book))
        for n in range(1, book["chapters"] + 1):
            if a.chapter and n != a.chapter:
                continue
            raw = extract_chapter(book, n)
            path = os.path.join(out_dir, f"ch{n:02d}.raw.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(raw, f, ensure_ascii=False)
            chars = sum(len(l["text"]) for p in raw["pages"] for l in p["lines"])
            print(f"{book['code']} ch{n:02d} {raw['chapterTitle'][:40]:<40} pages={raw['pageCount']:>3} chars={chars:>6} headings={len(raw['headingCandidates']):>2} ends={len(raw['endMarkers'])}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
