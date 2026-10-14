# Textbook Lessons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Class 10 student picks an NCERT book → chapter → "Summary" or 1–3 topics, and the AI Teacher speaks a lesson built from that chapter's real text, cached across students.

**Architecture:** Offline pipeline (Node download → Python/PyMuPDF extract → Claude Sonnet outline → committed JSON) seeds three new Postgres tables; the existing `generateLesson` gains a `source` that injects topic text into the prompt (with Anthropic prompt caching) and a shared `book_lessons` cache; the app adds a book/chapter/topic picker as sub-views of `AITeacherScreen` and plays the result in the untouched `LiveTeachingPlayer`.

**Tech Stack:** Node 20 (CommonJS, Express, Prisma 5, `node --test`), Python 3.12 + PyMuPDF (offline only), `@anthropic-ai/sdk`, Voyage embeddings + pgvector, React Native/Expo app.

**Spec:** `docs/superpowers/specs/2026-10-14-textbook-lessons-design.md`

## Global Constraints

- Worktree `F:\aiLernova2\textbook-lessons-wt`, branch `feat/textbook-lessons`. Run all commands from there. Server commands from `server/`.
- Local DB: `server/.env` must be copied from `F:\aiLernova2\AI_Teacher-APP\server\.env` (git-ignored, not in the worktree). It points at Docker Postgres `ailernova-pg` on port 5434. Never `prisma db push`; schema changes go through `prisma/sql/textbooks.sql` run by hand + `schema.prisma` edits + `npx prisma generate` (stop any running dev server first — Windows locks the engine DLL).
- Server code style: `'use strict'`, CommonJS, 2-space, no semicolons, `node:test` + `node:assert/strict`. App code: ES modules, semicolons, AIT tokens from `src/theme/aiTeacherTheme.js`.
- Class always comes from `req.scope.classNum` on the server; the client never sends it.
- Scope: Class 10, NCERT English, books `jesc1` (Science, 13 chapters) and `jemh1` (Mathematics, 14 chapters). Subject names canonical: `Science`, `Mathematics`.
- Topics = NCERT numbered sections `N.N`; `N.N.M` folded into parent; exercises/summary excluded. 1–3 topics per lesson; `kind: 'summary'` = whole chapter.
- `PROMPT_VERSION` is part of the cache key; bump it whenever the SOURCE prompt text changes.
- Python is never required at runtime; only `server/data/textbooks/class10/**/chNN.json` and `server/public/books/*.png` are committed.
- Commit messages: imperative subject, end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Baseline: `npm test` in `server/` has **1 pre-existing failure** (`personalization.test.js:105`, "NEVER refuse" regex). Do not fix it in this plan; every task's "tests pass" means no *new* failures.

## Review Focus

1. **A student whose class has no books (e.g. Class 11)** → `GET /api/books` returns `[]`, the home card is hidden, no 500. Test in Task 6.
2. **Same chapter/topics requested by two students at the same time** → one `book_lessons` row (unique `cache_key`, `ON CONFLICT DO NOTHING`), both get a lesson. Test in Task 9.
3. **Topic ids from a different chapter, or 4 ids** → 422, nothing generated. Test in Task 6 and Task 10.
4. **Chapter whose extraction produced an empty/too-short topic** → seed refuses the whole chapter and names it; the API never serves an empty topic. Test in Task 3.
5. **A cached lesson with an old `prompt_version`** → treated as a miss (the version is in the key). Test in Task 9.

---

### Task 1: Manifest, URL helpers and the PDF downloader

**Files:**
- Create: `server/scripts/textbooks/books.json`
- Create: `server/scripts/textbooks/lib.js`
- Create: `server/scripts/textbooks/download.js`
- Create: `server/tests/textbooks.lib.test.js`
- Modify: `server/.gitignore`

**Interfaces:**
- Produces: `lib.js` exports `pad2(n)`, `pdfUrl(code, n)`, `prelimsUrl(code)`, `chapterPdfPath(code, n)`, `prelimsPdfPath(code)`, `rawJsonPath(code, n)`, `chapterJsonPath(code, n)`, `coverPngPath(code)`, `loadManifest()`, `DATA_DIR`, `PDF_DIR`, `COVER_DIR`. Tasks 2–5 and 11 use these paths.

- [ ] **Step 1: Write the manifest**

`server/scripts/textbooks/books.json`:
```json
[
  {
    "code": "jesc1",
    "classLevel": 10,
    "subject": "Science",
    "subjectSlug": "science",
    "title": "Science",
    "publisher": "NCERT",
    "edition": "2023-24",
    "language": "en",
    "chapters": 13,
    "position": 1
  },
  {
    "code": "jemh1",
    "classLevel": 10,
    "subject": "Mathematics",
    "subjectSlug": "mathematics",
    "title": "Mathematics",
    "publisher": "NCERT",
    "edition": "2023-24",
    "language": "en",
    "chapters": 14,
    "position": 2
  }
]
```

- [ ] **Step 2: Write the failing test**

`server/tests/textbooks.lib.test.js`:
```js
'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const lib = require('../scripts/textbooks/lib')

test('pad2 zero-pads chapter numbers the way NCERT names its files', () => {
  assert.equal(lib.pad2(1), '01')
  assert.equal(lib.pad2(14), '14')
})

test('pdfUrl and prelimsUrl follow the ncert.nic.in pattern', () => {
  assert.equal(lib.pdfUrl('jemh1', 7), 'https://ncert.nic.in/textbook/pdf/jemh107.pdf')
  assert.equal(lib.prelimsUrl('jesc1'), 'https://ncert.nic.in/textbook/pdf/jesc1ps.pdf')
})

test('paths land under server/data/textbooks and server/public/books', () => {
  assert.equal(path.basename(lib.chapterPdfPath('jemh1', 7)), 'jemh107.pdf')
  assert.ok(lib.chapterPdfPath('jemh1', 7).includes(path.join('data', 'textbooks', 'pdf')))
  assert.ok(lib.rawJsonPath('jemh1', 7).endsWith(path.join('class10', 'jemh1', 'ch07.raw.json')))
  assert.ok(lib.chapterJsonPath('jemh1', 7).endsWith(path.join('class10', 'jemh1', 'ch07.json')))
  assert.ok(lib.coverPngPath('jemh1').endsWith(path.join('public', 'books', 'jemh1.png')))
})

test('loadManifest returns the two Class 10 books with their chapter counts', () => {
  const books = lib.loadManifest()
  assert.deepEqual(books.map((b) => [b.code, b.chapters]), [['jesc1', 13], ['jemh1', 14]])
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd server && node --test tests/textbooks.lib.test.js`
Expected: FAIL — `Cannot find module '../scripts/textbooks/lib'`

- [ ] **Step 4: Write lib.js**

`server/scripts/textbooks/lib.js`:
```js
'use strict'
// Paths and URLs shared by the textbook pipeline scripts (download → extract →
// outline → seed → embed). Everything is keyed by the NCERT book code, e.g.
// "jemh1" = Class 10 (j), English (e), Mathematics (mh), part 1.
const fs = require('fs')
const path = require('path')

const SERVER_ROOT = path.join(__dirname, '..', '..')
const DATA_DIR = path.join(SERVER_ROOT, 'data', 'textbooks')
const PDF_DIR = path.join(DATA_DIR, 'pdf')
const COVER_DIR = path.join(SERVER_ROOT, 'public', 'books')
const NCERT_BASE = 'https://ncert.nic.in/textbook/pdf/'

const pad2 = (n) => String(n).padStart(2, '0')

const pdfUrl = (code, n) => `${NCERT_BASE}${code}${pad2(n)}.pdf`
const prelimsUrl = (code) => `${NCERT_BASE}${code}ps.pdf`

const chapterPdfPath = (code, n) => path.join(PDF_DIR, `${code}${pad2(n)}.pdf`)
const prelimsPdfPath = (code) => path.join(PDF_DIR, `${code}ps.pdf`)
const bookJsonDir = (code, classLevel = 10) => path.join(DATA_DIR, `class${classLevel}`, code)
const rawJsonPath = (code, n, classLevel = 10) => path.join(bookJsonDir(code, classLevel), `ch${pad2(n)}.raw.json`)
const chapterJsonPath = (code, n, classLevel = 10) => path.join(bookJsonDir(code, classLevel), `ch${pad2(n)}.json`)
const coverPngPath = (code) => path.join(COVER_DIR, `${code}.png`)

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'books.json'), 'utf8'))
}

// --book jemh1 --chapter 7 --force  →  { book: 'jemh1', chapter: 7, force: true }
function parseArgs(argv = process.argv.slice(2)) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--book') out.book = argv[++i]
    else if (a === '--chapter') out.chapter = Number(argv[++i])
    else if (a === '--force') out.force = true
  }
  return out
}

module.exports = {
  DATA_DIR, PDF_DIR, COVER_DIR, pad2, pdfUrl, prelimsUrl,
  chapterPdfPath, prelimsPdfPath, bookJsonDir, rawJsonPath, chapterJsonPath, coverPngPath,
  loadManifest, parseArgs,
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd server && node --test tests/textbooks.lib.test.js`
Expected: 4 passing.

- [ ] **Step 6: Write download.js**

`server/scripts/textbooks/download.js`:
```js
'use strict'
// Downloads every chapter PDF (+ the prelims PDF with the cover) for the books in
// books.json into server/data/textbooks/pdf/. Skips files already on disk.
//
//   node scripts/textbooks/download.js                 # all books
//   node scripts/textbooks/download.js --book jemh1    # one book
//   node scripts/textbooks/download.js --book jemh1 --chapter 7
const fs = require('fs')
const path = require('path')
const lib = require('./lib')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchPdf(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) return 'skip'
  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (res.status === 404) throw Object.assign(new Error(`404 ${url}`), { fatal: true })
      if (!res.ok) throw new Error(`${res.status} ${url}`)
      const buf = Buffer.from(await res.arrayBuffer())
      // NCERT sometimes answers with an HTML error page and a 200 — check the magic bytes.
      if (buf.subarray(0, 4).toString() !== '%PDF') throw new Error(`not a PDF: ${url}`)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, buf)
      return 'ok'
    } catch (err) {
      if (err.fatal) throw err
      lastErr = err
      await sleep(1500 * attempt)
    }
  }
  throw lastErr
}

;(async () => {
  const args = lib.parseArgs()
  const books = lib.loadManifest().filter((b) => !args.book || b.code === args.book)
  if (!books.length) throw new Error(`unknown book ${args.book}`)
  for (const b of books) {
    const jobs = [[lib.prelimsUrl(b.code), lib.prelimsPdfPath(b.code)]]
    for (let n = 1; n <= b.chapters; n++) {
      if (args.chapter && n !== args.chapter) continue
      jobs.push([lib.pdfUrl(b.code, n), lib.chapterPdfPath(b.code, n)])
    }
    for (const [url, dest] of jobs) {
      const r = await fetchPdf(url, dest)
      console.log(`${r.padEnd(4)} ${path.basename(dest)}`)
    }
  }
})().catch((e) => { console.error('DOWNLOAD ERROR:', e.message); process.exit(1) })
```

- [ ] **Step 7: Git-ignore the PDFs and raw JSON**

Append to `server/.gitignore`:
```
# Textbook pipeline: the NCERT PDFs and the raw extraction are rebuilt by
# scripts/textbooks/*; only the final chNN.json is committed.
data/textbooks/pdf/
data/textbooks/**/*.raw.json
```

- [ ] **Step 8: Run the download for both books**

Run: `cd server && node scripts/textbooks/download.js`
Expected: 29 lines (`ok jesc1ps.pdf`, `ok jesc101.pdf` … `ok jemh114.pdf`), exit 0. `ls data/textbooks/pdf | wc -l` → 29. If a chapter 404s, the manifest count is wrong — fix `books.json`, don't guess.

- [ ] **Step 9: Commit**

```bash
git add server/scripts/textbooks/books.json server/scripts/textbooks/lib.js server/scripts/textbooks/download.js server/tests/textbooks.lib.test.js server/.gitignore
git commit -m "Textbook pipeline: manifest, path helpers and NCERT downloader"
```

---

### Task 2: Raw extraction with PyMuPDF (offline)

**Files:**
- Create: `server/scripts/textbooks/extract.py`
- Create: `server/scripts/textbooks/README.md`

**Interfaces:**
- Consumes: `books.json`, PDFs from Task 1.
- Produces: `chNN.raw.json` with shape
  `{code, chapterNumber, pageCount, chapterTitle, bodySize, pages:[{index, lines:[{text,size,bold}]}], headingCandidates:[{page,line,text,size,bold}], endMarkers:[{page,line,text}]}` and `server/public/books/<code>.png`. Task 3/4 read this shape.

- [ ] **Step 1: Write extract.py**

`server/scripts/textbooks/extract.py`:
```python
#!/usr/bin/env python
"""Pure text extraction for the textbook pipeline (no judgement, re-runnable).

    python scripts/textbooks/extract.py --book jemh1 [--chapter 7]

Reads data/textbooks/pdf/<code>NN.pdf, writes data/textbooks/class10/<code>/chNN.raw.json
and renders the prelims cover to public/books/<code>.png. Needs PyMuPDF (pip install pymupdf).
"""
import argparse, json, os, re, sys
from collections import Counter
import fitz  # PyMuPDF

HERE = os.path.dirname(os.path.abspath(__file__))
SERVER = os.path.abspath(os.path.join(HERE, "..", ".."))
PDF_DIR = os.path.join(SERVER, "data", "textbooks", "pdf")
COVER_DIR = os.path.join(SERVER, "public", "books")

HEADING_RE = re.compile(r"^\d{1,2}\.\d{1,2}(\.\d{1,2})?\s+[A-Za-z(]")
END_MARKERS = ("summary", "what you have learnt", "exercises", "points to ponder", "historical note")
INLINE_EXERCISE_RE = re.compile(r"^(EXERCISE\s+\d+\.\d+|Q\s*U\s*E\s*S\s*T\s*I\s*O\s*N\s*S)\s*$", re.I)

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
            text = re.sub(r"\s+", " ", text)
            out.append({
                "text": text,
                "size": round(max(s["size"] for s in spans), 1),
                "bold": any("bold" in s["font"].lower() or (s["flags"] & 16) for s in spans),
            })
    return out

def strip_running_header(lines, book_title, chapter_title):
    """Drop page numbers / 'PHYSICS' / chapter-name running heads in the first 3 lines."""
    caps = {book_title.upper(), (chapter_title or "").upper()}
    keep, dropped = [], 0
    for i, ln in enumerate(lines):
        t = ln["text"]
        if i < 3 and dropped < 2 and (
            re.fullmatch(r"\d{1,3}", t)
            or re.fullmatch(r"\d{1,3}\s+[A-Z ]{3,40}", t)
            or re.fullmatch(r"[A-Z ]{3,40}\s+\d{1,3}", t)
            or t.upper() in caps
        ):
            dropped += 1
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

    # Chapter title: the largest line on page 1 after a "Chapter N" line, else the largest line.
    first = pages[0]
    start = next((i + 1 for i, ln in enumerate(first) if re.fullmatch(rf"chapter\s+{n}", ln["text"], re.I)), 0)
    title_line = max(first[start:start + 8] or first, key=lambda ln: ln["size"])
    chapter_title = title_line["text"].title() if title_line["text"].isupper() else title_line["text"]

    pages = [strip_running_header(pl, book["title"], chapter_title) for pl in pages]

    cands, ends = [], []
    for pi, pl in enumerate(pages):
        for li, ln in enumerate(pl):
            t = ln["text"]
            if HEADING_RE.match(t) and (ln["bold"] or ln["size"] >= body + 1) and not re.search(r"[=<>]", t):
                cands.append({"page": pi, "line": li, "text": t, "size": ln["size"], "bold": ln["bold"]})
            low = t.lower().strip(" :")
            if low in END_MARKERS or INLINE_EXERCISE_RE.match(t):
                ends.append({"page": pi, "line": li, "text": t})

    return {
        "code": code, "chapterNumber": n, "pageCount": len(doc), "chapterTitle": chapter_title,
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
```

- [ ] **Step 2: Run it on one chapter and eyeball the output**

Run: `cd server && python -I -X utf8 scripts/textbooks/extract.py --book jemh1 --chapter 1`
Expected: one line like `jemh1 ch01 Real Numbers  pages= 18 chars= 30000 headings= 5 ends= 4`. Then:
`python -X utf8 -c "import json;r=json.load(open('data/textbooks/class10/jemh1/ch01.raw.json',encoding='utf-8'));print(r['chapterTitle']);print([c['text'] for c in r['headingCandidates']]);print([e['text'] for e in r['endMarkers']])"`
Expected: title `Real Numbers`; candidates `1.1 Introduction`, `1.2 The Fundamental Theorem of Arithmetic`, `1.3 Revisiting Irrational Numbers`, … ; end markers include `EXERCISE 1.1` and `Summary`. If a formula line sneaks in, that's fine — Task 4's model pass removes it.

- [ ] **Step 3: Run it for everything**

Run: `cd server && python -I -X utf8 scripts/textbooks/extract.py`
Expected: 2 cover lines + 27 chapter lines, every `headings` ≥ 2 and `chars` ≥ 8000. Confirm `public/books/jesc1.png` and `jemh1.png` exist and open as cover images.

- [ ] **Step 4: Write the README**

`server/scripts/textbooks/README.md`:
```markdown
# Textbook pipeline (NCERT → book_topics)

One-time, per book. Everything before `seed` runs on a developer machine; the server
only ever reads the committed `data/textbooks/class10/<code>/chNN.json`.

    node   scripts/textbooks/download.js            # PDFs → data/textbooks/pdf/ (ignored)
    python -I -X utf8 scripts/textbooks/extract.py  # raw text/headings → chNN.raw.json (ignored), covers → public/books/
    node   scripts/textbooks/outline.js             # Claude verifies the outline → chNN.json (committed); prints a review table
    node   scripts/textbooks/seed-textbooks.js      # chNN.json → books / book_chapters / book_topics
    node   scripts/textbooks/embed-textbooks.js     # topics → knowledge_chunks (needs VOYAGE_API_KEY)

All take `--book <code>` and (except seed/embed) `--chapter <n>`; `outline.js` takes `--force`
to redo a chapter that already has a chNN.json. Python needs `pip install pymupdf`.

Adding a book = one entry in `books.json` (code from the ncert.nic.in URL, e.g.
`jemh1` = Class 10 English Mathematics part 1) and running the five steps.
```

- [ ] **Step 5: Commit**

```bash
git add server/scripts/textbooks/extract.py server/scripts/textbooks/README.md server/public/books/jesc1.png server/public/books/jemh1.png
git commit -m "Textbook pipeline: PyMuPDF extraction and covers"
```

---

### Task 3: Outline slicing library (pure, TDD)

**Files:**
- Create: `server/scripts/textbooks/outlineLib.js`
- Create: `server/tests/textbooks.outline.test.js`

**Interfaces:**
- Consumes: raw JSON shape from Task 2.
- Produces: `sliceChapter(raw, outline) → { chapterNumber, title, slug, topics:[{number,title,slug,text,charCount}] }`, `slugify(s)`, `MIN_TOPIC_CHARS = 200`, `MIN_INTRO_CHARS = 400`. Throws `Error` naming the topic when a topic is too short. `outline` shape: `{ title, topics:[{number,title,page,line}], subsections:[{number,title,page,line}], bodyEnd:{page,line} }`.

- [ ] **Step 1: Write the failing tests**

`server/tests/textbooks.outline.test.js`:
```js
'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { sliceChapter, slugify, MIN_TOPIC_CHARS } = require('../scripts/textbooks/outlineLib')

const L = (text) => ({ text, size: 10, bold: false })
const fill = (n, tag) => Array.from({ length: n }, (_, i) => L(`${tag} sentence number ${i} with enough words to count.`))

function raw() {
  return {
    code: 'jemh1', chapterNumber: 7, chapterTitle: 'Binomial Theorem', pageCount: 2,
    pages: [
      { index: 0, lines: [L('7.1 Introduction'), ...fill(12, 'intro'), L('7.2 Binomial Theorem'), ...fill(10, 'bt'),
        L('EXERCISE 7.1'), L('1. Expand (x+1)^2'), L('2. Expand (2x-3)^3')] },
      { index: 1, lines: [L('7.2.1 Special cases'), ...fill(8, 'special'), L('7.3 General Term'), ...fill(9, 'gen'),
        L('Summary'), L('1. The binomial theorem states ...')] },
    ],
  }
}

const outline = () => ({
  title: 'Binomial Theorem',
  topics: [
    { number: '7.1', title: 'Introduction', page: 0, line: 0 },
    { number: '7.2', title: 'Binomial Theorem', page: 0, line: 13 },
    { number: '7.3', title: 'General Term', page: 1, line: 9 },
  ],
  subsections: [{ number: '7.2.1', title: 'Special cases', page: 1, line: 0 }],
  bodyEnd: { page: 1, line: 19 },
})

test('slugify', () => {
  assert.equal(slugify('7.3 General and Middle Terms'), '7-3-general-and-middle-terms')
})

test('topics are sliced between consecutive starts and stop at bodyEnd', () => {
  const ch = sliceChapter(raw(), outline())
  assert.equal(ch.topics.length, 3)
  assert.ok(ch.topics[0].text.includes('intro sentence number 11'))
  assert.ok(!ch.topics[0].text.includes('bt sentence'))
  assert.ok(ch.topics[2].text.includes('gen sentence number 8'))
  assert.ok(!ch.topics[2].text.includes('The binomial theorem states'), 'summary excluded')
})

test('a subsection folds into its parent topic', () => {
  const ch = sliceChapter(raw(), outline())
  assert.ok(ch.topics[1].text.includes('7.2.1 Special cases'))
  assert.ok(ch.topics[1].text.includes('special sentence number 7'))
})

test('an in-chapter EXERCISE block is cut up to the next boundary, even a subsection', () => {
  const ch = sliceChapter(raw(), outline())
  assert.ok(!ch.topics[1].text.includes('Expand (x+1)^2'))
  assert.ok(ch.topics[1].text.includes('special sentence number 0'), 'text after the cut survives')
})

test('the heading line itself is not repeated inside the topic text', () => {
  const ch = sliceChapter(raw(), outline())
  assert.ok(!ch.topics[0].text.startsWith('7.1 Introduction'))
})

test('a topic shorter than MIN_TOPIC_CHARS makes the chapter refuse', () => {
  const r = raw()
  r.pages[1].lines.splice(10, 8) // gut 7.3
  assert.throws(() => sliceChapter(r, outline()), new RegExp(`7\\.3 .*${MIN_TOPIC_CHARS}`))
})

test('a short Introduction is dropped instead of refusing', () => {
  const r = raw()
  r.pages[0].lines.splice(1, 12, L('Short intro.'))
  const o = outline(); o.topics[1].line = 2
  const ch = sliceChapter(r, o)
  assert.deepEqual(ch.topics.map((t) => t.number), ['7.2', '7.3'])
})

test('charCount matches text length and slugs are prefixed with the number', () => {
  const ch = sliceChapter(raw(), outline())
  assert.equal(ch.topics[0].charCount, ch.topics[0].text.length)
  assert.equal(ch.topics[2].slug, '7-3-general-term')
  assert.equal(ch.slug, 'binomial-theorem')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test tests/textbooks.outline.test.js`
Expected: FAIL — `Cannot find module '../scripts/textbooks/outlineLib'`

- [ ] **Step 3: Write outlineLib.js**

`server/scripts/textbooks/outlineLib.js`:
```js
'use strict'
// Turns a verified outline (where each section starts) plus the raw page lines into
// topic texts. Pure: no I/O, no model calls — so it is unit-tested and outline.js is
// only glue.

const MIN_TOPIC_CHARS = 200
const MIN_INTRO_CHARS = 400
const EXERCISE_RE = /^(EXERCISE\s+\d+\.\d+|Q\s*U\s*E\s*S\s*T\s*I\s*O\s*N\s*S)\s*$/i

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// Flatten pages to one array of { page, line, text } so positions compare as integers.
function flatten(raw) {
  const flat = []
  for (const p of raw.pages) p.lines.forEach((ln, li) => flat.push({ page: p.index, line: li, text: ln.text }))
  return flat
}
const indexOf = (flat, pos) => flat.findIndex((x) => x.page === pos.page && x.line === pos.line)

function sliceChapter(raw, outline) {
  const flat = flatten(raw)
  const topics = [...outline.topics].sort((a, b) => a.page - b.page || a.line - b.line)
  const subs = Array.isArray(outline.subsections) ? outline.subsections : []
  const boundaries = [...topics, ...subs].map((t) => indexOf(flat, t)).filter((i) => i >= 0)
  const endIdx = outline.bodyEnd ? indexOf(flat, outline.bodyEnd) : -1
  const end = endIdx >= 0 ? endIdx : flat.length
  boundaries.push(end)
  const nextBoundaryAfter = (i) => Math.min(...boundaries.filter((b) => b > i), end)

  const out = []
  topics.forEach((t, ti) => {
    const start = indexOf(flat, t)
    if (start < 0) throw new Error(`topic ${t.number} "${t.title}": start line not found at page ${t.page} line ${t.line}`)
    const next = topics[ti + 1] ? indexOf(flat, topics[ti + 1]) : end
    const stop = Math.min(next, end)

    const lines = []
    for (let i = start + 1; i < stop; i++) {
      const text = flat[i].text
      if (EXERCISE_RE.test(text)) { i = nextBoundaryAfter(i) - 1; continue } // skip to the boundary
      lines.push(text)
    }
    const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
    out.push({ number: t.number, title: t.title, slug: slugify(`${t.number} ${t.title}`), text, charCount: text.length })
  })

  const kept = out.filter((t) => {
    if (/^introduction$/i.test(t.title) && t.charCount < MIN_INTRO_CHARS) return false
    if (t.charCount < MIN_TOPIC_CHARS) throw new Error(`topic ${t.number} "${t.title}" has only ${t.charCount} chars (< ${MIN_TOPIC_CHARS}) — extraction or outline is wrong`)
    return true
  })
  if (!kept.length) throw new Error('no topics survived slicing')

  return { chapterNumber: raw.chapterNumber, title: outline.title || raw.chapterTitle, slug: slugify(outline.title || raw.chapterTitle), topics: kept }
}

module.exports = { sliceChapter, slugify, MIN_TOPIC_CHARS, MIN_INTRO_CHARS }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --test tests/textbooks.outline.test.js`
Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add server/scripts/textbooks/outlineLib.js server/tests/textbooks.outline.test.js
git commit -m "Textbook pipeline: pure outline slicing with exercise cuts and subsection folding"
```

---

### Task 4: outline.js — Claude verifies the outline, writes chNN.json

**Files:**
- Create: `server/scripts/textbooks/outline.js`
- Create: `server/data/textbooks/class10/jesc1/ch01.json` … `ch13.json`, `server/data/textbooks/class10/jemh1/ch01.json` … `ch14.json` (generated)

**Interfaces:**
- Consumes: `chNN.raw.json`, `sliceChapter` from Task 3.
- Produces: `chNN.json` = `{ code, classLevel, chapterNumber, title, slug, pageCount, sourceUrl, topics:[{number,title,slug,text,charCount}] }`. Task 5 seeds exactly this.

- [ ] **Step 1: Write outline.js**

`server/scripts/textbooks/outline.js`:
```js
'use strict'
// Asks Claude to confirm which heading candidates are the chapter's real numbered
// sections (and which are subsections / formula lines / exercise numbers), then slices
// the raw text with outlineLib and writes the committed chNN.json.
//
//   node scripts/textbooks/outline.js --book jemh1 [--chapter 7] [--force]
//
// Model: TEXTBOOK_OUTLINE_MODEL (default claude-sonnet-5-5). ~5–8k input tokens per
// chapter, a few hundred out — a few rupees per chapter, one time.
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const fs = require('fs')
const Anthropic = require('@anthropic-ai/sdk')
const lib = require('./lib')
const { sliceChapter } = require('./outlineLib')

const MODEL = process.env.TEXTBOOK_OUTLINE_MODEL || 'claude-sonnet-5-5'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You verify the section outline of one NCERT textbook chapter from PDF-extracted lines.
You are given numbered heading CANDIDATES (page, line, text, bold, font size) and END MARKERS (Summary / Exercises / etc).
Return ONLY a JSON object:
{
  "title": string,                                        // the chapter title, Title Case
  "topics":      [{ "number": "N.N",   "title": string, "page": int, "line": int }],   // the real top-level sections, in order
  "subsections": [{ "number": "N.N.M", "title": string, "page": int, "line": int }],   // real sub-sections (kept separate so exercises can be cut up to them)
  "bodyEnd": { "page": int, "line": int }                 // the FIRST of: Summary / What you have learnt / Exercises (the end-of-chapter one, not an in-text "EXERCISE N.N")
}
Rules: a candidate is a section only if its text is a heading (a number followed by a title in words), NOT a formula, a measurement ("1.2 g cm-3"), or an exercise question ("1.14 The unit of length ..."). Use page/line EXACTLY as given. Titles: clean up ALL-CAPS to Title Case, drop trailing punctuation. Every real section N.N in the chapter must appear once.`

function candidateBlock(raw) {
  const flat = []
  for (const p of raw.pages) p.lines.forEach((ln, li) => flat.push({ page: p.index, line: li, text: ln.text }))
  const ctx = (c) => {
    const i = flat.findIndex((x) => x.page === c.page && x.line === c.line)
    return flat.slice(i + 1, i + 3).map((x) => x.text).join(' ').slice(0, 120)
  }
  const cands = raw.headingCandidates.map((c) => `p${c.page} l${c.line} ${c.bold ? 'BOLD' : 'reg '} ${c.size} | ${c.text} || next: ${ctx(c)}`)
  const ends = raw.endMarkers.map((e) => `p${e.page} l${e.line} | ${e.text}`)
  return `CHAPTER ${raw.chapterNumber} (extracted title: "${raw.chapterTitle}", ${raw.pageCount} pages)\n\nCANDIDATES:\n${cands.join('\n')}\n\nEND MARKERS:\n${ends.join('\n')}`
}

async function verifyOutline(raw) {
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 4000, system: SYSTEM,
    messages: [{ role: 'user', content: candidateBlock(raw) }],
  })
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  const start = text.indexOf('{'); const stop = text.lastIndexOf('}')
  if (start < 0 || stop < 0) throw new Error(`no JSON in outline response: ${text.slice(0, 200)}`)
  return JSON.parse(text.slice(start, stop + 1))
}

;(async () => {
  const args = lib.parseArgs()
  const books = lib.loadManifest().filter((b) => !args.book || b.code === args.book)
  const review = []
  for (const b of books) {
    for (let n = 1; n <= b.chapters; n++) {
      if (args.chapter && n !== args.chapter) continue
      const outPath = lib.chapterJsonPath(b.code, n, b.classLevel)
      if (fs.existsSync(outPath) && !args.force) { console.log(`skip ${b.code} ch${lib.pad2(n)} (exists)`); continue }
      const raw = JSON.parse(fs.readFileSync(lib.rawJsonPath(b.code, n, b.classLevel), 'utf8'))
      const outline = await verifyOutline(raw)
      const ch = sliceChapter(raw, outline)
      const json = { code: b.code, classLevel: b.classLevel, chapterNumber: n, title: ch.title, slug: ch.slug, pageCount: raw.pageCount, sourceUrl: lib.pdfUrl(b.code, n), topics: ch.topics }
      fs.writeFileSync(outPath, JSON.stringify(json, null, 1) + '\n', 'utf8')
      review.push(`\n${b.code} ch${lib.pad2(n)} ${ch.title}`)
      for (const t of ch.topics) review.push(`   ${t.number.padEnd(5)} ${t.title.padEnd(50).slice(0, 50)} ${String(t.charCount).padStart(6)} chars`)
      console.log(`ok   ${b.code} ch${lib.pad2(n)} ${ch.title} — ${ch.topics.length} topics`)
    }
  }
  console.log('\n=== REVIEW TABLE (read every line against the book\'s contents page) ===' + review.join('\n'))
})().catch((e) => { console.error('OUTLINE ERROR:', e.message); process.exit(1) })
```

Check `dotenv` is a server dependency (`grep dotenv server/package.json`); it is used by `src/config/env.js`, so it is.

- [ ] **Step 2: Copy the local .env and run on one chapter**

Run: `cp ../AI_Teacher-APP/server/.env server/.env` (once), then `cd server && node scripts/textbooks/outline.js --book jemh1 --chapter 1`
Expected: `ok jemh1 ch01 Real Numbers — N topics` and a review table whose topic list matches the book's contents (1.1 Introduction, 1.2 The Fundamental Theorem of Arithmetic, 1.3 Revisiting Irrational Numbers, 1.4 Summary is NOT a topic). Open `data/textbooks/class10/jemh1/ch01.json` and read topic 1.2's text: it must start after the heading and must not contain "EXERCISE 1.1" questions.

- [ ] **Step 3: Run for all 27 chapters and review**

Run: `cd server && node scripts/textbooks/outline.js`
Expected: 27 `ok` lines. If any chapter throws ("has only N chars" / "start line not found"), run `--book X --chapter N --force` after inspecting its raw JSON; adjust `HEADING_RE`/`strip_running_header` in `extract.py` only if the raw candidates are wrong, then re-extract that chapter.

**Human review gate:** read the review table against the NCERT contents pages (Science: 13 chapters; Maths: 14). Every numbered section present, no formula lines, no "Exercise" topics. Fix by `--force` re-run or by hand-editing the JSON (document any hand edit in the commit message).

- [ ] **Step 4: Commit the script and the 27 chapter files**

```bash
git add server/scripts/textbooks/outline.js server/data/textbooks/class10
git commit -m "Textbook content: Class 10 NCERT Science and Mathematics outlines and topic text"
```

---

### Task 5: Database tables, Prisma models, seed script

**Files:**
- Create: `server/prisma/sql/textbooks.sql`
- Modify: `server/prisma/schema.prisma` (Lesson model lines 61–83; append new models)
- Create: `server/scripts/textbooks/seed-textbooks.js`

**Interfaces:**
- Produces: Prisma models `books`, `book_chapters`, `book_topics`, `book_lessons`; `Lesson` gains `bookChapterId Int?`, `bookTopicIds Int[]`, `bookLessonId String?`. Tasks 6, 9, 11 use `db.books`, `db.book_chapters`, `db.book_topics`, `db.book_lessons`.

- [ ] **Step 1: Write the SQL**

`server/prisma/sql/textbooks.sql`:
```sql
-- Textbook lessons: NCERT books → chapters → numbered-section topics, plus the
-- shared cache of generated lessons. Idempotent; no reset.
--
-- Apply by hand (project convention — nothing uses prisma migrate):
--   npx prisma db execute --file prisma/sql/textbooks.sql --schema prisma/schema.prisma
-- or
--   psql "$DATABASE_URL" -f prisma/sql/textbooks.sql
-- then `npx prisma generate` so the client knows the new models.

CREATE TABLE IF NOT EXISTS books (
  id           BIGSERIAL PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  class_level  INT  NOT NULL,
  subject      TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  title        TEXT NOT NULL,
  publisher    TEXT NOT NULL DEFAULT 'NCERT',
  edition      TEXT NOT NULL,
  language     TEXT NOT NULL DEFAULT 'en',
  cover_url    TEXT,
  position     INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS books_class_level_idx ON books (class_level, position);

CREATE TABLE IF NOT EXISTS book_chapters (
  id          BIGSERIAL PRIMARY KEY,
  book_id     BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  number      INT  NOT NULL,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  page_count  INT,
  source_url  TEXT,
  char_count  INT  NOT NULL DEFAULT 0,
  UNIQUE (book_id, number)
);

CREATE TABLE IF NOT EXISTS book_topics (
  id          BIGSERIAL PRIMARY KEY,
  chapter_id  BIGINT NOT NULL REFERENCES book_chapters(id) ON DELETE CASCADE,
  number      TEXT NOT NULL,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  position    INT  NOT NULL,
  text        TEXT NOT NULL,
  char_count  INT  NOT NULL,
  UNIQUE (chapter_id, number)
);

CREATE TABLE IF NOT EXISTS book_lessons (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key          TEXT NOT NULL UNIQUE,
  chapter_id         BIGINT NOT NULL REFERENCES book_chapters(id) ON DELETE CASCADE,
  kind               TEXT NOT NULL,
  topic_ids          BIGINT[] NOT NULL DEFAULT '{}',
  grade_level        TEXT NOT NULL,
  teaching_mode      TEXT NOT NULL,
  explanation_style  TEXT NOT NULL DEFAULT 'balanced',
  prompt_version     INT  NOT NULL,
  payload            JSONB NOT NULL,
  generation_model   TEXT,
  generation_time_ms INT,
  hits               INT  NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_chapter_id BIGINT REFERENCES book_chapters(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_topic_ids  BIGINT[] NOT NULL DEFAULT '{}';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_lesson_id  UUID REFERENCES book_lessons(id) ON DELETE SET NULL;
```

- [ ] **Step 2: Add the Prisma models**

In `server/prisma/schema.prisma`, inside `model Lesson` after `generationTimeMs  Int?` add:
```prisma
  // Textbook lessons (prisma/sql/textbooks.sql): which chapter/topics this lesson was
  // built from, and the shared book_lessons row it was copied from (null = fresh).
  bookChapterId     BigInt?        @map("book_chapter_id")
  bookTopicIds      BigInt[]       @map("book_topic_ids")
  bookLessonId      String?        @map("book_lesson_id") @db.Uuid
```
Append at the end of the file:
```prisma
// ─── Textbook lessons (prisma/sql/textbooks.sql) ─────────────────────────────
model books {
  id           BigInt          @id @default(autoincrement())
  code         String          @unique
  class_level  Int
  subject      String
  subject_slug String
  title        String
  publisher    String          @default("NCERT")
  edition      String
  language     String          @default("en")
  cover_url    String?
  position     Int             @default(0)
  created_at   DateTime        @default(now()) @db.Timestamptz(6)
  chapters     book_chapters[]

  @@index([class_level, position])
}

model book_chapters {
  id         BigInt         @id @default(autoincrement())
  book_id    BigInt
  number     Int
  title      String
  slug       String
  page_count Int?
  source_url String?
  char_count Int            @default(0)
  book       books          @relation(fields: [book_id], references: [id], onDelete: Cascade)
  topics     book_topics[]
  lessons    book_lessons[]

  @@unique([book_id, number])
}

model book_topics {
  id         BigInt        @id @default(autoincrement())
  chapter_id BigInt
  number     String
  title      String
  slug       String
  position   Int
  text       String
  char_count Int
  chapter    book_chapters @relation(fields: [chapter_id], references: [id], onDelete: Cascade)

  @@unique([chapter_id, number])
}

model book_lessons {
  id                 String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  cache_key          String        @unique
  chapter_id         BigInt
  kind               String
  topic_ids          BigInt[]
  grade_level        String
  teaching_mode      String
  explanation_style  String        @default("balanced")
  prompt_version     Int
  payload            Json
  generation_model   String?
  generation_time_ms Int?
  hits               Int           @default(0)
  created_at         DateTime      @default(now()) @db.Timestamptz(6)
  chapter            book_chapters @relation(fields: [chapter_id], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 3: Apply SQL locally and regenerate the client**

Run (dev server must not be running): `cd server && npx prisma db execute --file prisma/sql/textbooks.sql --schema prisma/schema.prisma && npx prisma generate`
Expected: both succeed. Then `npx prisma validate` → "The schema is valid".

- [ ] **Step 4: Write the seed script**

`server/scripts/textbooks/seed-textbooks.js`:
```js
'use strict'
// Upserts books / book_chapters / book_topics from the committed chNN.json files.
// Re-runnable: topics missing from a JSON are deleted, everything else is updated in
// place so ids (and therefore cached book_lessons) survive a re-seed.
//
//   node scripts/textbooks/seed-textbooks.js [--book jemh1]
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')
const lib = require('./lib')

const db = new PrismaClient()

async function seedBook(b) {
  const book = await db.books.upsert({
    where: { code: b.code },
    create: { code: b.code, class_level: b.classLevel, subject: b.subject, subject_slug: b.subjectSlug, title: b.title, publisher: b.publisher, edition: b.edition, language: b.language, cover_url: `/books/${b.code}.png`, position: b.position || 0 },
    update: { class_level: b.classLevel, subject: b.subject, subject_slug: b.subjectSlug, title: b.title, publisher: b.publisher, edition: b.edition, language: b.language, cover_url: `/books/${b.code}.png`, position: b.position || 0 },
  })
  let topicsTotal = 0
  for (let n = 1; n <= b.chapters; n++) {
    const file = lib.chapterJsonPath(b.code, n, b.classLevel)
    if (!fs.existsSync(file)) throw new Error(`missing ${file} — run outline.js first`)
    const ch = JSON.parse(fs.readFileSync(file, 'utf8'))
    const bad = ch.topics.find((t) => !t.text || t.text.length < 200)
    if (bad) throw new Error(`${b.code} ch${n} topic ${bad.number} has no usable text — refusing the chapter`)
    const charCount = ch.topics.reduce((s, t) => s + t.charCount, 0)
    const chapter = await db.book_chapters.upsert({
      where: { book_id_number: { book_id: book.id, number: n } },
      create: { book_id: book.id, number: n, title: ch.title, slug: ch.slug, page_count: ch.pageCount, source_url: ch.sourceUrl, char_count: charCount },
      update: { title: ch.title, slug: ch.slug, page_count: ch.pageCount, source_url: ch.sourceUrl, char_count: charCount },
    })
    for (let i = 0; i < ch.topics.length; i++) {
      const t = ch.topics[i]
      await db.book_topics.upsert({
        where: { chapter_id_number: { chapter_id: chapter.id, number: t.number } },
        create: { chapter_id: chapter.id, number: t.number, title: t.title, slug: t.slug, position: i + 1, text: t.text, char_count: t.charCount },
        update: { title: t.title, slug: t.slug, position: i + 1, text: t.text, char_count: t.charCount },
      })
    }
    await db.book_topics.deleteMany({ where: { chapter_id: chapter.id, number: { notIn: ch.topics.map((t) => t.number) } } })
    topicsTotal += ch.topics.length
    console.log(`  ch${lib.pad2(n)} ${ch.title} — ${ch.topics.length} topics`)
  }
  console.log(`${b.code}: ${b.chapters} chapters, ${topicsTotal} topics`)
}

;(async () => {
  const args = lib.parseArgs()
  for (const b of lib.loadManifest()) {
    if (args.book && b.code !== args.book) continue
    await seedBook(b)
  }
  await db.$disconnect()
})().catch(async (e) => { console.error('SEED ERROR:', e.message); await db.$disconnect(); process.exit(1) })
```

- [ ] **Step 5: Seed and verify**

Run: `cd server && node scripts/textbooks/seed-textbooks.js`
Expected: 27 chapter lines, two book totals. Then:
`node -e "require('dotenv').config();const {PrismaClient}=require('@prisma/client');const d=new PrismaClient();(async()=>{console.log(await d.books.count(),await d.book_chapters.count(),await d.book_topics.count());const t=await d.book_topics.findFirst({where:{number:'7.2'},select:{title:true,char_count:true}});console.log(t);await d.$disconnect()})()"`
Expected: `2 27 <N>` with N ≥ 80, and a sensible 7.2 topic. Run the seed a second time: same counts (idempotent).

- [ ] **Step 6: Run the full test suite, commit**

Run: `cd server && npm test 2>&1 | grep -E "^# (pass|fail)"` → `fail 1` (the pre-existing one only).
```bash
git add server/prisma/sql/textbooks.sql server/prisma/schema.prisma server/scripts/textbooks/seed-textbooks.js
git commit -m "Textbook lessons: books/chapters/topics tables, lesson cache table, seed script"
```

---

### Task 6: Books service, routes and controller

**Files:**
- Create: `server/src/services/books.service.js`
- Create: `server/src/controllers/books.controller.js`
- Create: `server/src/routes/books.js`
- Modify: `server/src/routes/index.js` (add mount next to `/ai`)
- Create: `server/tests/books.service.test.js`

**Interfaces:**
- Produces: `createBooksService(db)` → `{ listBooks({classLevel, subject}), listChapters({bookId, classLevel}), getChapter({chapterId, classLevel}), loadSource({chapterId, kind, topicIds, classLevel}) }` and a default instance bound to the real db exported as `booksService`. `loadSource` returns `{ book:{id,code,title,subject}, chapter:{id,number,title}, kind, topics:[{id,number,title,text}], topicLabel, derivedTopic }` or throws `AppError` 403 `OUT_OF_SCOPE` / 422. Task 9 and 10 consume these. All ids are returned as **numbers** (BigInt converted).

- [ ] **Step 1: Write the failing tests**

`server/tests/books.service.test.js`:
```js
'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { createBooksService } = require('../src/services/books.service')

// A tiny Prisma stand-in with only the query shapes the service uses.
function fakeDb() {
  const books = [
    { id: 1n, code: 'jemh1', class_level: 10, subject: 'Mathematics', subject_slug: 'mathematics', title: 'Mathematics', edition: '2023-24', cover_url: '/books/jemh1.png', position: 2, _count: { chapters: 14 } },
    { id: 2n, code: 'jesc1', class_level: 10, subject: 'Science', subject_slug: 'science', title: 'Science', edition: '2023-24', cover_url: '/books/jesc1.png', position: 1, _count: { chapters: 13 } },
  ]
  const chapters = [
    { id: 10n, book_id: 1n, number: 7, title: 'Binomial Theorem', slug: 'binomial-theorem', _count: { topics: 3 } },
    { id: 11n, book_id: 1n, number: 8, title: 'Sequences', slug: 'sequences', _count: { topics: 2 } },
  ]
  const topics = [
    { id: 100n, chapter_id: 10n, number: '7.1', title: 'Introduction', position: 1, text: 'intro text', char_count: 10 },
    { id: 101n, chapter_id: 10n, number: '7.2', title: 'Binomial Theorem for Positive Integral Indices', position: 2, text: 'bt text', char_count: 7 },
    { id: 102n, chapter_id: 10n, number: '7.3', title: 'General and Middle Terms', position: 3, text: 'gen text', char_count: 8 },
    { id: 110n, chapter_id: 11n, number: '8.1', title: 'Introduction', position: 1, text: 'seq text', char_count: 8 },
  ]
  const withBook = (c) => ({ ...c, book: books.find((b) => b.id === c.book_id) })
  return {
    books: {
      async findMany({ where = {}, orderBy }) {
        return books.filter((b) => (where.class_level == null || b.class_level === where.class_level) && (!where.subject || b.subject === where.subject))
          .sort((a, b) => a.position - b.position)
      },
    },
    book_chapters: {
      async findMany({ where }) { return chapters.filter((c) => c.book_id === where.book_id && (!where.book || where.book.class_level === withBook(c).book.class_level)).map(withBook) },
      async findFirst({ where }) { const c = chapters.find((c) => c.id === where.id); return c ? withBook(c) : null },
    },
    book_topics: {
      async findMany({ where, orderBy }) {
        return topics.filter((t) => t.chapter_id === where.chapter_id && (!where.id || where.id.in.includes(t.id))).sort((a, b) => a.position - b.position)
      },
    },
  }
}

const svc = createBooksService(fakeDb())

test('listBooks returns the class\'s books in position order with plain-number ids and chapter counts', async () => {
  const out = await svc.listBooks({ classLevel: 10 })
  assert.deepEqual(out.map((b) => [b.id, b.code, b.chapterCount]), [[2, 'jesc1', 13], [1, 'jemh1', 14]])
  assert.equal(typeof out[0].id, 'number')
  assert.equal(out[0].coverUrl, '/books/jesc1.png')
})

test('listBooks is empty (not an error) for a class with no books', async () => {
  assert.deepEqual(await svc.listBooks({ classLevel: 11 }), [])
})

test('listChapters returns number/title/topicCount', async () => {
  const out = await svc.listChapters({ bookId: 1, classLevel: 10 })
  assert.deepEqual(out.chapters.map((c) => [c.id, c.number, c.topicCount]), [[10, 7, 3], [11, 8, 2]])
  assert.equal(out.book.title, 'Mathematics')
})

test('getChapter returns topic titles and sizes but never the text', async () => {
  const out = await svc.getChapter({ chapterId: 10, classLevel: 10 })
  assert.equal(out.chapter.title, 'Binomial Theorem')
  assert.deepEqual(out.topics.map((t) => t.number), ['7.1', '7.2', '7.3'])
  assert.equal(out.topics[0].text, undefined)
})

test('getChapter refuses a chapter from another class with OUT_OF_SCOPE', async () => {
  await assert.rejects(svc.getChapter({ chapterId: 10, classLevel: 11 }), (e) => e.statusCode === 403 && e.code === 'OUT_OF_SCOPE')
})

test('loadSource(topics) returns the chosen topics in book order and a derived topic string', async () => {
  const s = await svc.loadSource({ chapterId: 10, kind: 'topics', topicIds: [102, 101], classLevel: 10 })
  assert.deepEqual(s.topics.map((t) => t.number), ['7.2', '7.3'])
  assert.equal(s.topics[0].text, 'bt text')
  assert.equal(s.topicLabel, '7.2, 7.3')
  assert.equal(s.derivedTopic, 'Binomial Theorem: 7.2 Binomial Theorem for Positive Integral Indices; 7.3 General and Middle Terms')
})

test('loadSource(summary) returns every topic and a chapter-level topic string', async () => {
  const s = await svc.loadSource({ chapterId: 10, kind: 'summary', classLevel: 10 })
  assert.equal(s.topics.length, 3)
  assert.equal(s.derivedTopic, 'Chapter 7: Binomial Theorem (summary)')
})

test('loadSource rejects topic ids outside the chapter, empty, or more than 3', async () => {
  await assert.rejects(svc.loadSource({ chapterId: 10, kind: 'topics', topicIds: [101, 110], classLevel: 10 }), (e) => e.statusCode === 422)
  await assert.rejects(svc.loadSource({ chapterId: 10, kind: 'topics', topicIds: [], classLevel: 10 }), (e) => e.statusCode === 422)
  await assert.rejects(svc.loadSource({ chapterId: 10, kind: 'topics', topicIds: [100, 101, 102, 100], classLevel: 10 }), (e) => e.statusCode === 422)
})

test('loadSource refuses an unknown chapter with 404', async () => {
  await assert.rejects(svc.loadSource({ chapterId: 999, kind: 'summary', classLevel: 10 }), (e) => e.statusCode === 404)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test tests/books.service.test.js`
Expected: FAIL — `Cannot find module '../src/services/books.service'`

- [ ] **Step 3: Write books.service.js**

`server/src/services/books.service.js`:
```js
'use strict'
// Textbook browsing + the source loader the lesson generator grounds on.
// Built as a factory so the tests can hand in a tiny fake db; the default export is
// bound to the real Prisma client.
const realDb = require('../config/database')
const { AppError } = require('../middleware/errorHandler')

const MAX_TOPICS = 3
const num = (v) => (typeof v === 'bigint' ? Number(v) : v)

function createBooksService(db) {
  async function listBooks({ classLevel, subject } = {}) {
    if (!classLevel) return []
    const rows = await db.books.findMany({
      where: { class_level: Number(classLevel), ...(subject ? { subject } : {}) },
      orderBy: { position: 'asc' },
      include: { _count: { select: { chapters: true } } },
    })
    return rows.map((b) => ({
      id: num(b.id), code: b.code, title: b.title, subject: b.subject, subjectSlug: b.subject_slug,
      edition: b.edition, coverUrl: b.cover_url, chapterCount: b._count ? b._count.chapters : 0,
    }))
  }

  const bookOut = (b) => ({ id: num(b.id), code: b.code, title: b.title, subject: b.subject, subjectSlug: b.subject_slug })

  async function listChapters({ bookId, classLevel }) {
    const rows = await db.book_chapters.findMany({
      where: { book_id: BigInt(bookId), book: { class_level: Number(classLevel) } },
      orderBy: { number: 'asc' },
      include: { book: true, _count: { select: { topics: true } } },
    })
    if (!rows.length) throw new AppError('Book not found for your class.', 404)
    return {
      book: bookOut(rows[0].book),
      chapters: rows.map((c) => ({ id: num(c.id), number: c.number, title: c.title, slug: c.slug, topicCount: c._count ? c._count.topics : 0 })),
    }
  }

  // The chapter row with its book, scope-checked against the student's class.
  async function chapterInScope(chapterId, classLevel) {
    const c = await db.book_chapters.findFirst({ where: { id: BigInt(chapterId) }, include: { book: true } })
    if (!c) throw new AppError('Chapter not found.', 404)
    if (c.book.class_level !== Number(classLevel)) throw new AppError("This book isn't part of your class.", 403, 'OUT_OF_SCOPE')
    return c
  }

  async function getChapter({ chapterId, classLevel }) {
    const c = await chapterInScope(chapterId, classLevel)
    const topics = await db.book_topics.findMany({ where: { chapter_id: c.id }, orderBy: { position: 'asc' } })
    return {
      book: bookOut(c.book),
      chapter: { id: num(c.id), number: c.number, title: c.title },
      topics: topics.map((t) => ({ id: num(t.id), number: t.number, title: t.title, charCount: t.char_count })),
    }
  }

  // What the lesson generator teaches from. kind 'summary' = whole chapter; 'topics' =
  // 1..MAX_TOPICS ids that must all belong to the chapter. Topics come back in book order.
  async function loadSource({ chapterId, kind, topicIds, classLevel }) {
    const c = await chapterInScope(chapterId, classLevel)
    let rows
    if (kind === 'summary') {
      rows = await db.book_topics.findMany({ where: { chapter_id: c.id }, orderBy: { position: 'asc' } })
    } else if (kind === 'topics') {
      const ids = Array.from(new Set((topicIds || []).map(Number)))
      if (!ids.length || ids.length > MAX_TOPICS || ids.length !== (topicIds || []).length) {
        throw new AppError(`Pick 1 to ${MAX_TOPICS} topics.`, 422)
      }
      rows = await db.book_topics.findMany({ where: { chapter_id: c.id, id: { in: ids.map((i) => BigInt(i)) } }, orderBy: { position: 'asc' } })
      if (rows.length !== ids.length) throw new AppError('Those topics are not in this chapter.', 422)
    } else {
      throw new AppError('source.kind must be "summary" or "topics".', 422)
    }
    if (!rows.length) throw new AppError('This chapter has no topics yet.', 404)

    const topics = rows.map((t) => ({ id: num(t.id), number: t.number, title: t.title, text: t.text }))
    const topicLabel = topics.map((t) => t.number).join(', ')
    const derivedTopic = kind === 'summary'
      ? `Chapter ${c.number}: ${c.title} (summary)`
      : `${c.title}: ${topics.map((t) => `${t.number} ${t.title}`).join('; ')}`
    return { book: bookOut(c.book), chapter: { id: num(c.id), number: c.number, title: c.title }, kind, topics, topicLabel, derivedTopic }
  }

  return { listBooks, listChapters, getChapter, loadSource }
}

module.exports = { createBooksService, booksService: createBooksService(realDb), MAX_TOPICS }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && node --test tests/books.service.test.js`
Expected: 9 passing.

- [ ] **Step 5: Controller and routes**

`server/src/controllers/books.controller.js`:
```js
'use strict'

const { booksService } = require('../services/books.service')
const ApiResponse = require('../utils/ApiResponse')

const classOf = (req) => (req.scope && req.scope.classNum) || null

// GET /api/books?subject=   → the student's class's books; [] when the class has none
// (the app hides its textbook card on an empty list — this is never a 404).
async function listBooks(req, res, next) {
  try {
    const classLevel = classOf(req)
    if (!classLevel) return ApiResponse.success(res, [])
    const subject = req.query.subject ? String(req.query.subject).slice(0, 100) : undefined
    return ApiResponse.success(res, await booksService.listBooks({ classLevel, subject }))
  } catch (err) {
    // A missing table (SQL not applied in this environment yet) must not take the
    // AI Teacher home down — log once, answer empty.
    if (err && err.code === 'P2021') { console.error('[books] tables missing — run prisma/sql/textbooks.sql'); return ApiResponse.success(res, []) }
    next(err)
  }
}

// GET /api/books/:bookId/chapters
async function listChapters(req, res, next) {
  try {
    const classLevel = classOf(req)
    if (!classLevel) return ApiResponse.error(res, 'Complete your class profile to open textbooks.', 422, 'PROFILE_INCOMPLETE')
    return ApiResponse.success(res, await booksService.listChapters({ bookId: Number(req.params.bookId), classLevel }))
  } catch (err) { next(err) }
}

// GET /api/books/chapters/:chapterId → topics (titles only)
async function getChapter(req, res, next) {
  try {
    const classLevel = classOf(req)
    if (!classLevel) return ApiResponse.error(res, 'Complete your class profile to open textbooks.', 422, 'PROFILE_INCOMPLETE')
    return ApiResponse.success(res, await booksService.getChapter({ chapterId: Number(req.params.chapterId), classLevel }))
  } catch (err) { next(err) }
}

module.exports = { listBooks, listChapters, getChapter }
```

`server/src/routes/books.js`:
```js
'use strict'

const { Router } = require('express')
const { param } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const { listBooks, listChapters, getChapter } = require('../controllers/books.controller')

const router = Router()
router.use(authenticate)

router.get('/', listBooks)
router.get('/chapters/:chapterId', param('chapterId').isInt({ min: 1 }).toInt(), getChapter)
router.get('/:bookId/chapters', param('bookId').isInt({ min: 1 }).toInt(), listChapters)

module.exports = router
```

In `server/src/routes/index.js`, directly after the line `router.use('/ai',           paid(require('./ai')))` add:
```js
router.use('/books',        paid(require('./books')))   // textbook browsing for the AI Teacher
```

- [ ] **Step 6: Smoke the routes against the local DB**

Start the server (`cd server && npm run dev`), log in as a Class 10 student account with full access (any existing dev account; set its `grade` to `Class 10` in the DB if needed), then:
`curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/books | head -c 400`
Expected: `{"success":true,...,"data":[{"id":..,"code":"jesc1",...,"chapterCount":13},{...jemh1...,"chapterCount":14}]}`.
`curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/books/<jemh1 id>/chapters | head -c 300` → 14 chapters.
`curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/books/chapters/<ch id>` → topics with no `text` field.
Stop the server.

- [ ] **Step 7: Commit**

```bash
git add server/src/services/books.service.js server/src/controllers/books.controller.js server/src/routes/books.js server/src/routes/index.js server/tests/books.service.test.js
git commit -m "Textbook lessons: books API (list, chapters, topics) and the source loader"
```

---

### Task 7: Prompt — SOURCE block, summary kind, PROMPT_VERSION

**Files:**
- Modify: `server/src/prompts/lessonGeneration.prompt.js` (lines 243–260, module.exports)
- Create: `server/tests/lessonPrompt.source.test.js`

**Interfaces:**
- Produces: `buildLessonUserPrompt(topic, subject, gradeLevel, profile, source)` — `source` is the `loadSource` result from Task 6 (or undefined). New exports `buildSourceBlock(source)`, `PROMPT_VERSION` (number). Task 8 passes the source block as its own cacheable content block, so `buildLessonUserPrompt` must NOT embed it; it only adds the instructions that refer to it. Exact contract: with `source`, the user prompt gains a `TEACH FROM THE SOURCE…` paragraph (and the `LESSON KIND — CHAPTER SUMMARY` paragraph when `source.kind === 'summary'`), and omits `learnerLine`.

- [ ] **Step 1: Write the failing tests**

`server/tests/lessonPrompt.source.test.js`:
```js
'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { buildLessonUserPrompt, buildSourceBlock, PROMPT_VERSION } = require('../src/prompts/lessonGeneration.prompt')

const source = {
  book: { title: 'Mathematics', subject: 'Mathematics' },
  chapter: { number: 7, title: 'Binomial Theorem' },
  kind: 'topics',
  topics: [
    { number: '7.2', title: 'Binomial Theorem for Positive Integral Indices', text: 'Let us expand (a+b)^n ...' },
    { number: '7.3', title: 'General and Middle Terms', text: 'The (r+1)th term is ...' },
  ],
  topicLabel: '7.2, 7.3',
}
const learner = { learner: { weak: ['sets'], averageMastery: 40 } }

test('PROMPT_VERSION is a positive integer', () => {
  assert.ok(Number.isInteger(PROMPT_VERSION) && PROMPT_VERSION >= 1)
})

test('buildSourceBlock wraps every topic with its number and title, in order', () => {
  const b = buildSourceBlock(source)
  assert.match(b, /SOURCE MATERIAL — NCERT Class 10 Mathematics, Chapter 7 "Binomial Theorem", section\(s\) 7\.2, 7\.3/)
  assert.ok(b.indexOf('[7.2 Binomial Theorem for Positive Integral Indices]') < b.indexOf('[7.3 General and Middle Terms]'))
  assert.ok(b.includes('Let us expand (a+b)^n'))
  assert.ok(b.trim().endsWith('>>>'))
})

test('buildSourceBlock for a summary says "whole chapter"', () => {
  const b = buildSourceBlock({ ...source, kind: 'summary' })
  assert.match(b, /Chapter 7 "Binomial Theorem" \(whole chapter\)/)
})

test('without a source the user prompt is unchanged in spirit: no SOURCE instructions, learner line present', () => {
  const p = buildLessonUserPrompt('Sets', 'Maths', '10', learner)
  assert.ok(!p.includes('TEACH FROM THE SOURCE'))
  assert.ok(p.includes('struggled before with: sets'))
})

test('with a source the user prompt instructs to teach from it and drops the learner line', () => {
  const p = buildLessonUserPrompt('Binomial Theorem: 7.2 …', 'Mathematics', '10', learner, source)
  assert.ok(p.includes('TEACH FROM THE SOURCE'))
  assert.ok(p.includes('refer to sections by number'))
  assert.ok(!p.includes('struggled before with'))
  assert.ok(!p.includes('LESSON KIND — CHAPTER SUMMARY'))
})

test('a summary source adds the chapter-summary guidance', () => {
  const p = buildLessonUserPrompt('Chapter 7: Binomial Theorem (summary)', 'Mathematics', '10', {}, { ...source, kind: 'summary' })
  assert.ok(p.includes('LESSON KIND — CHAPTER SUMMARY'))
  assert.ok(p.includes('what to revise'))
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && node --test tests/lessonPrompt.source.test.js`
Expected: FAIL — `buildSourceBlock is not a function` / `PROMPT_VERSION` undefined.

- [ ] **Step 3: Edit the prompt module**

In `server/src/prompts/lessonGeneration.prompt.js`, replace the `buildLessonUserPrompt` function (currently starting at `function buildLessonUserPrompt(topic, subject, gradeLevel, profile = {}) {`) with:
```js
// Bump whenever the SOURCE wording below (or anything that changes what a cached book
// lesson would say) changes — it is part of the book_lessons cache key.
const PROMPT_VERSION = 1

// The student's own textbook text, as one block. Sent by the provider as its OWN
// content block with cache_control (the same chapter is hit by many students), so it
// is deliberately NOT embedded in buildLessonUserPrompt.
function buildSourceBlock(source) {
  const classLabel = source.classLevel ? `Class ${source.classLevel}` : 'Class 10'
  const scope = source.kind === 'summary' ? '(whole chapter)' : `section(s) ${source.topicLabel}`
  const body = source.topics.map((t) => `[${t.number} ${t.title}]\n${t.text}`).join('\n\n')
  return `SOURCE MATERIAL — NCERT ${classLabel} ${source.book.title}, Chapter ${source.chapter.number} "${source.chapter.title}", ${scope} (this is the student's own textbook; it is authoritative):\n<<<\n${body}\n>>>`
}

const SOURCE_RULES = `TEACH FROM THE SOURCE (the SOURCE MATERIAL block above): use its definitions, notation, worked examples and numbering; when you add an analogy or an extra example of your own, say so briefly ("here's one more…"); do not introduce results the source does not contain; refer to sections by number ("as 7.3 says…") so the student can follow in the book. If the source text is garbled by PDF extraction (lost superscripts, joined words, stray symbols), read through it — never repeat the garbling.`

const SUMMARY_RULES = `LESSON KIND — CHAPTER SUMMARY: this is a spoken overview of the WHOLE chapter in 8 to 10 slides: one slide per major section (merge small ones), each stating the section's key idea, its one must-know formula or definition, and one line on why it matters for the exam. End with a "what to revise" slide listing the sections by number. Do not go deep on any one section.`

function buildLessonUserPrompt(topic, subject, gradeLevel, profile = {}, source = null) {
  const pl = profileLine(profile)
  const lg = levelGuidance(gradeLevel, profile)
  // Book lessons are shared across students (cached), so the per-learner mastery line
  // is left out of them; mode and preferences still apply and are in the cache key.
  const ll = source ? '' : learnerLine(profile)
  const pref = preferenceLine(profile)
  const md = modePrompt(profile.mode)
  const src = source ? `\n${SOURCE_RULES}${source.kind === 'summary' ? `\n${SUMMARY_RULES}` : ''}` : ''
  return `Create a classroom lesson. Return ONLY the JSON object defined in the system prompt — no markdown, no extra text.

Topic: ${topic}
Subject: ${subject}
Grade level: ${gradeLevel}${pl ? `\n${pl}` : ''}${lg ? `\n${lg}` : ''}${md ? `\n${md}` : ''}${pref ? `\nHOW THIS STUDENT LIKES TO LEARN: ${pref}` : ''}${ll ? `\nWHAT I REMEMBER ABOUT THIS STUDENT (adapt the lesson to them, but keep it implicit): ${ll}` : ''}${src}

ALWAYS teach ${topic} — never refuse it and never say it is "outside your syllabus".
PLAN it first like a teacher (privately): the learning objective for a Class ${gradeLevel} student; the concepts this topic requires at this class; the prerequisites (review them in at most one short slide — for Class 11–12 assume them); if the topic is broad, the single best focus for this class and duration; then the logical slide-by-slide progression toward the objective.
Then teach 7 to 10 slides that build logically toward that objective, at the DEPTH in the LEVEL line above — a senior lesson must be conceptually deep with reasoning and a short derivation, NOT a middle-school introduction. Every slide title must match its visual. Teach by REASONING (guiding question, "notice this", derive the key result), not by reading facts. Sound like a real Class ${gradeLevel} teacher, not a chatbot.`
}
```
and change the export line to:
```js
module.exports = { buildLessonSystemPrompt, buildLessonUserPrompt, buildSourceBlock, profileLine, levelGuidance, learnerLine, preferenceLine, LESSON_JSON_SCHEMA, PROMPT_VERSION }
```
Also, in `buildLessonSystemPrompt`'s OUTPUT CONTRACT text, add one line right after `OUTPUT CONTRACT (critical):`:
```
If the user message contains a SOURCE MATERIAL block, it is the student's own textbook and is authoritative for content, order and terminology.
```

- [ ] **Step 4: Run the prompt tests and the whole suite**

Run: `cd server && node --test tests/lessonPrompt.source.test.js` → 6 passing. `npm test 2>&1 | grep -E "^# (pass|fail)"` → still `fail 1`.

- [ ] **Step 5: Commit**

```bash
git add server/src/prompts/lessonGeneration.prompt.js server/tests/lessonPrompt.source.test.js
git commit -m "Lesson prompt: teach from a textbook SOURCE block, chapter-summary kind, PROMPT_VERSION"
```

---

### Task 8: Provider — cached system + source blocks; doubt grounding

**Files:**
- Modify: `server/src/providers/ai/AnthropicProvider.js` (`generateLesson` at ~109, `_createLessonMessage` at ~125, `answerDoubt` at ~170)
- Modify: `server/src/prompts/doubtResolution.prompt.js` (`buildDoubtSystemPrompt`)
- Modify: `server/src/providers/ai/AIProvider.js` (base-class signature docs, if it declares them)
- Create: `server/tests/lessonRequest.test.js`

**Interfaces:**
- Produces: `AnthropicProvider.generateLesson(topic, subject, gradeLevel, profile, source)`; pure helper `buildLessonRequestParts({ systemText, sourceBlock, userText })` → `{ system: [...], messages: [...] }` exported from the provider module; `answerDoubt(question, lessonContext, history, slideIndex, sourceText)`; `buildDoubtSystemPrompt(lesson, sourceText)`.

- [ ] **Step 1: Write the failing test**

`server/tests/lessonRequest.test.js`:
```js
'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { buildLessonRequestParts } = require('../src/providers/ai/AnthropicProvider')
const { buildDoubtSystemPrompt } = require('../src/prompts/doubtResolution.prompt')

test('without a source: plain cached system, one text block', () => {
  const r = buildLessonRequestParts({ systemText: 'SYS', sourceBlock: null, userText: 'USER' })
  assert.deepEqual(r.system, [{ type: 'text', text: 'SYS', cache_control: { type: 'ephemeral' } }])
  assert.deepEqual(r.messages, [{ role: 'user', content: [{ type: 'text', text: 'USER' }] }])
})

test('with a source: the source is its own cached block BEFORE the per-student text', () => {
  const r = buildLessonRequestParts({ systemText: 'SYS', sourceBlock: 'SOURCE MATERIAL …', userText: 'USER' })
  assert.equal(r.messages.length, 1)
  const [src, user] = r.messages[0].content
  assert.deepEqual(src, { type: 'text', text: 'SOURCE MATERIAL …', cache_control: { type: 'ephemeral' } })
  assert.deepEqual(user, { type: 'text', text: 'USER' })
})

test('doubt system prompt quotes the textbook when sourceText is given', () => {
  const lesson = { topic: 'Sets', subject: 'Maths', gradeLevel: '10', lessonTitle: 'Sets', summary: '', keyTerms: [], slides: [] }
  assert.ok(!buildDoubtSystemPrompt(lesson).includes('THE STUDENT\'S TEXTBOOK SAYS'))
  const p = buildDoubtSystemPrompt(lesson, '[1.2 Sets]\nA set is a well-defined collection.')
  assert.ok(p.includes('THE STUDENT\'S TEXTBOOK SAYS'))
  assert.ok(p.includes('well-defined collection'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && node --test tests/lessonRequest.test.js`
Expected: FAIL — `buildLessonRequestParts is not a function`.

- [ ] **Step 3: Edit the provider**

In `server/src/providers/ai/AnthropicProvider.js`:

(a) Extend the prompt import:
```js
const {
  buildLessonSystemPrompt,
  buildLessonUserPrompt,
  buildSourceBlock,
} = require('../../prompts/lessonGeneration.prompt')
```

(b) Replace `generateLesson` and the signature of `_createLessonMessage`:
```js
  async generateLesson(topic, subject, gradeLevel, profile = {}, source = null) {
    const client = this._getClient()
    const { system, messages } = buildLessonRequestParts({
      systemText: buildLessonSystemPrompt(),
      sourceBlock: source ? buildSourceBlock(source) : null,
      userText: buildLessonUserPrompt(topic, subject, gradeLevel, profile, source),
    })
    const message = await this._createLessonMessage(client, system, messages)
    const raw = extractText(message)
    return parseAndValidateLesson(raw)
  }
```
`_createLessonMessage` already takes `(client, system, messages)` and passes them straight to the SDK; an array `system` and content-block `messages` are valid there, so its body does not change.

(c) Add the pure helper near `parseAndValidateLesson` (module level) and export it:
```js
// The lesson request, laid out for prompt caching: the system prompt is one cached
// block; a textbook SOURCE block (shared by every student on that chapter) is its own
// cached block ahead of the per-student text. Order matters — caching is a prefix match.
function buildLessonRequestParts({ systemText, sourceBlock, userText }) {
  const ephemeral = { type: 'ephemeral' }
  const content = []
  if (sourceBlock) content.push({ type: 'text', text: sourceBlock, cache_control: ephemeral })
  content.push({ type: 'text', text: userText })
  return {
    system: [{ type: 'text', text: systemText, cache_control: ephemeral }],
    messages: [{ role: 'user', content }],
  }
}
```
and at the bottom:
```js
module.exports.buildLessonRequestParts = buildLessonRequestParts
```

(d) `answerDoubt` gains `sourceText`:
```js
  async answerDoubt(question, lessonContext, history = [], slideIndex, sourceText = null) {
    …
        system: buildDoubtSystemPrompt(lessonContext, sourceText),
    …
```

(e) In `server/src/prompts/doubtResolution.prompt.js`, change the signature to `function buildDoubtSystemPrompt(lesson, sourceText = null)` and, right before the `HOW TO ANSWER` heading in the template, insert:
```js
${sourceText ? `THE STUDENT'S TEXTBOOK SAYS (NCERT — authoritative; quote it when it answers the doubt):\n<<<\n${String(sourceText).slice(0, 48000)}\n>>>\n\n` : ''}HOW TO ANSWER
```
(i.e. replace the literal `HOW TO ANSWER` line with that expression).

(f) If `server/src/providers/ai/AIProvider.js` declares `generateLesson(topic, subject, gradeLevel, profile)` / `answerDoubt(...)` as abstract methods, add the trailing optional parameter to each with a one-line comment; otherwise skip.

- [ ] **Step 4: Run tests**

Run: `cd server && node --test tests/lessonRequest.test.js` → 3 passing. `npm test 2>&1 | grep -E "^# (pass|fail)"` → `fail 1`.

- [ ] **Step 5: Commit**

```bash
git add server/src/providers/ai/AnthropicProvider.js server/src/providers/ai/AIProvider.js server/src/prompts/doubtResolution.prompt.js server/tests/lessonRequest.test.js
git commit -m "Anthropic provider: cached system and textbook source blocks; textbook-grounded doubts"
```

---

### Task 9: Lesson cache + generateLesson with `source`

**Files:**
- Create: `server/src/services/bookLessonCache.js`
- Modify: `server/src/services/ai.service.js` (`generateLesson` ~192–274, `answerDoubt` ~276–307)
- Modify: `server/src/services/lesson.service.js` (`createLesson`, `getLessonById` select)
- Create: `server/tests/bookLessonCache.test.js`
- Create: `server/scripts/textbooks/e2e-book-lesson.js`

**Interfaces:**
- Produces: `createBookLessonCache(db)` → `{ cacheKey(parts), find(key), store({key, parts, payload, generationModel, generationTimeMs}) }`; default instance `bookLessonCache`. `cacheKey({chapterId, kind, topicIds, gradeLevel, teachingMode, explanationStyle, promptVersion})` is order-independent for `topicIds`. `store` is race-safe (`ON CONFLICT DO NOTHING` then re-select) and returns the row that won.
- `aiService.generateLesson({..., source})` where `source = { chapterId, kind, topicIds }` (raw, from the controller); it calls `booksService.loadSource` itself. Returned lesson gains `source: { book, chapter, kind, topics:[{id,number,title}], topicLabel }`.

- [ ] **Step 1: Write the failing cache tests**

`server/tests/bookLessonCache.test.js`:
```js
'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { createBookLessonCache } = require('../src/services/bookLessonCache')

function fakeDb() {
  const rows = []
  return {
    _rows: rows,
    book_lessons: {
      async findUnique({ where }) { return rows.find((r) => r.cache_key === where.cache_key) || null },
      async update({ where, data }) { const r = rows.find((r) => r.id === where.id); r.hits += data.hits.increment; return r },
    },
    // store() uses raw SQL for ON CONFLICT DO NOTHING; the fake mimics "insert unless the key exists".
    async $executeRaw(strings, ...values) {
      const key = values[0]
      if (rows.some((r) => r.cache_key === key)) return 0
      rows.push({ id: `bl-${rows.length + 1}`, cache_key: key, chapter_id: values[1], kind: values[2], topic_ids: values[3], grade_level: values[4], teaching_mode: values[5], explanation_style: values[6], prompt_version: values[7], payload: JSON.parse(values[8]), generation_model: values[9], generation_time_ms: values[10], hits: 0 })
      return 1
    },
  }
}

const parts = { chapterId: 10, kind: 'topics', topicIds: [102, 101], gradeLevel: '10', teachingMode: 'intermediate', explanationStyle: 'visual', promptVersion: 1 }

test('cacheKey is stable, order-independent for topic ids, and changes with every part', () => {
  const c = createBookLessonCache(fakeDb())
  const k = c.cacheKey(parts)
  assert.equal(k, c.cacheKey({ ...parts, topicIds: [101, 102] }))
  assert.notEqual(k, c.cacheKey({ ...parts, teachingMode: 'exam' }))
  assert.notEqual(k, c.cacheKey({ ...parts, explanationStyle: 'story' }))
  assert.notEqual(k, c.cacheKey({ ...parts, promptVersion: 2 }), 'a prompt bump is a miss')
  assert.notEqual(k, c.cacheKey({ ...parts, kind: 'summary', topicIds: [] }))
  assert.match(k, /^[0-9a-f]{40}$/)
})

test('store then find returns the payload and counts hits', async () => {
  const db = fakeDb(); const c = createBookLessonCache(db)
  const key = c.cacheKey(parts)
  assert.equal(await c.find(key), null)
  const row = await c.store({ key, parts, payload: { lessonTitle: 'T', slides: [] }, generationModel: 'm', generationTimeMs: 1234 })
  assert.equal(row.cache_key, key)
  const hit = await c.find(key)
  assert.equal(hit.payload.lessonTitle, 'T')
  assert.equal(hit.hits, 1)
})

test('two concurrent stores of the same key keep ONE row and both callers get it', async () => {
  const db = fakeDb(); const c = createBookLessonCache(db)
  const key = c.cacheKey(parts)
  const [a, b] = await Promise.all([
    c.store({ key, parts, payload: { lessonTitle: 'A', slides: [] }, generationModel: 'm', generationTimeMs: 1 }),
    c.store({ key, parts, payload: { lessonTitle: 'B', slides: [] }, generationModel: 'm', generationTimeMs: 1 }),
  ])
  assert.equal(db._rows.length, 1)
  assert.equal(a.id, b.id)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd server && node --test tests/bookLessonCache.test.js` → FAIL, module not found.

- [ ] **Step 3: Write bookLessonCache.js**

`server/src/services/bookLessonCache.js`:
```js
'use strict'
// Generated textbook lessons shared across students. One row per distinct request
// shape; the student's own lessons/slides rows are COPIED from the payload so progress,
// doubts and resume keep working unchanged.
const crypto = require('crypto')
const realDb = require('../config/database')

function createBookLessonCache(db) {
  function cacheKey({ chapterId, kind, topicIds, gradeLevel, teachingMode, explanationStyle, promptVersion }) {
    const ids = [...(topicIds || [])].map(Number).sort((a, b) => a - b).join(',')
    const raw = [Number(chapterId), kind, ids, String(gradeLevel), String(teachingMode), String(explanationStyle || 'balanced'), Number(promptVersion)].join('|')
    return crypto.createHash('sha1').update(raw).digest('hex')
  }

  async function find(key) {
    const row = await db.book_lessons.findUnique({ where: { cache_key: key } })
    if (!row) return null
    return db.book_lessons.update({ where: { id: row.id }, data: { hits: { increment: 1 } } })
  }

  // Insert-if-absent, then read back: when two students generate the same lesson at
  // once, the second insert is a no-op and both share the first row.
  async function store({ key, parts, payload, generationModel, generationTimeMs }) {
    const ids = [...(parts.topicIds || [])].map(Number)
    await db.$executeRaw`
      INSERT INTO book_lessons (cache_key, chapter_id, kind, topic_ids, grade_level, teaching_mode, explanation_style, prompt_version, payload, generation_model, generation_time_ms)
      VALUES (${key}, ${Number(parts.chapterId)}, ${parts.kind}, ${ids}::bigint[], ${String(parts.gradeLevel)}, ${String(parts.teachingMode)}, ${String(parts.explanationStyle || 'balanced')}, ${Number(parts.promptVersion)}, ${JSON.stringify(payload)}::jsonb, ${generationModel || null}, ${generationTimeMs == null ? null : Math.round(generationTimeMs)})
      ON CONFLICT (cache_key) DO NOTHING`
    return db.book_lessons.findUnique({ where: { cache_key: key } })
  }

  return { cacheKey, find, store }
}

module.exports = { createBookLessonCache, bookLessonCache: createBookLessonCache(realDb) }
```

Run: `node --test tests/bookLessonCache.test.js` → 3 passing.

- [ ] **Step 4: Wire `source` into ai.service.generateLesson**

In `server/src/services/ai.service.js`:

(a) Imports — add:
```js
const { booksService } = require('./books.service')
const { bookLessonCache } = require('./bookLessonCache')
const { PROMPT_VERSION } = require('../prompts/lessonGeneration.prompt')
```

(b) Change the signature to `async function generateLesson({ userId, topic, subject, gradeLevel, board, stream, language, mode, prefs, source })` and, as the first statement in the function (before `createLesson`), resolve the source:
```js
  // Textbook lesson: resolve chapter/topics first so an out-of-scope or bad request
  // fails before any lesson row exists. `topic` is derived when the client sent none.
  let src = null
  if (source) {
    src = await booksService.loadSource({ chapterId: source.chapterId, kind: source.kind, topicIds: source.topicIds, classLevel: gradeLevel })
    src.classLevel = Number(gradeLevel)
    if (!topic) topic = src.derivedTopic
    if (!subject) subject = src.book.subject
  }
```
and pass the chapter to `createLesson`:
```js
  const { id: lessonId } = await lessonService.createLesson({ userId, topic, subject, gradeLevel, chapter: src ? src.chapter.title : undefined, bookChapterId: src ? src.chapter.id : undefined, bookTopicIds: src && src.kind === 'topics' ? src.topics.map((t) => t.id) : [] })
```

(c) Replace the generation block inside `try` (from `let payload` through `const generationTimeMs = …`) with:
```js
    let payload
    let generationModel
    let bookLessonId = null
    const cacheParts = src ? {
      chapterId: src.chapter.id, kind: src.kind, topicIds: src.kind === 'topics' ? src.topics.map((t) => t.id) : [],
      gradeLevel, teachingMode: resolvedMode, explanationStyle: (cleanPrefs && cleanPrefs.explanationStyle) || 'balanced', promptVersion: PROMPT_VERSION,
    } : null
    const cacheKey = cacheParts ? bookLessonCache.cacheKey(cacheParts) : null
    const cached = cacheKey ? await bookLessonCache.find(cacheKey) : null

    if (cached) {
      payload = cached.payload
      generationModel = `cache:${cached.generation_model || 'unknown'}`
      bookLessonId = cached.id
    } else if (config.ai.mockMode) {
      payload = buildMockLesson(topic, subject, gradeLevel)
      generationModel = MOCK_MODEL
    } else {
      payload = await getAIProvider().generateLesson(topic, subject, gradeLevel, profile, src)
      generationModel = config.ai.lessonModel
    }

    const generationTimeMs = Date.now() - startTime

    if (cacheKey && !cached) {
      const row = await bookLessonCache.store({ key: cacheKey, parts: cacheParts, payload, generationModel, generationTimeMs })
      bookLessonId = row ? row.id : null
    }
```
(the existing `const startTime = Date.now()` stays above it). After `updateLessonWithContent(...)` add:
```js
    if (bookLessonId) {
      await db.$executeRaw`UPDATE lessons SET book_lesson_id = ${bookLessonId}::uuid WHERE id = ${lessonId}::uuid`
    }
```
Make `tagLessonChapter(lessonId, topic, subject)` conditional: `if (!src) tagLessonChapter(lessonId, topic, subject)`. Before `return saved` add:
```js
    if (saved && src) saved.source = { book: src.book, chapter: src.chapter, kind: src.kind, topics: src.topics.map((t) => ({ id: t.id, number: t.number, title: t.title })), topicLabel: src.topicLabel }
```

(d) In `lesson.service.js`, extend `createLesson`:
```js
async function createLesson({ userId, topic, subject, gradeLevel, chapter, bookChapterId, bookTopicIds }) {
  return db.lesson.create({
    data: {
      userId, topic, subject, gradeLevel,
      ...(chapter ? { chapter } : {}),
      ...(bookChapterId ? { bookChapterId: BigInt(bookChapterId) } : {}),
      bookTopicIds: Array.isArray(bookTopicIds) ? bookTopicIds.map((n) => BigInt(n)) : [],
      lessonTitle: '', estimatedDuration: '', summary: '', keyTerms: [], status: 'GENERATING',
    },
    select: { id: true },
  })
}
```
and make sure `getLessonById`'s select (used by `answerDoubt`) includes `bookChapterId: true, bookTopicIds: true` (add them to whatever select it has; if it has no `select`, nothing to do).

(e) `answerDoubt`: after `const lessonWithSlides = …` in the non-mock branch, load the textbook text:
```js
    let sourceText = null
    if (lesson.bookChapterId) {
      try {
        const ids = (lesson.bookTopicIds || []).map(Number)
        const s = await booksService.loadSource({ chapterId: Number(lesson.bookChapterId), kind: ids.length ? 'topics' : 'summary', topicIds: ids, classLevel: lesson.gradeLevel })
        sourceText = s.topics.map((t) => `[${t.number} ${t.title}]\n${t.text}`).join('\n\n')
      } catch (e) { console.error('[ai.service] doubt source load failed (answering without the book):', e?.message || e) }
    }
```
and pass it: `answer = await getAIProvider().answerDoubt(question, lessonWithSlides, history, slideIndex, sourceText)`.

- [ ] **Step 5: End-to-end script with MOCK_AI against the local DB**

`server/scripts/textbooks/e2e-book-lesson.js`:
```js
'use strict'
// Generates a textbook lesson through the real service against the local DB.
//   MOCK_AI=true node scripts/textbooks/e2e-book-lesson.js --book jemh1 --chapter 7 [--topics 2,3] [--summary]
// Prints the cache behaviour on a second identical call. With MOCK_AI unset it
// calls Claude for real (costs money; used in Task 13 for the fidelity review).
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const db = require('../../src/config/database')
const aiService = require('../../src/services/ai.service')
const lib = require('./lib')

;(async () => {
  const args = lib.parseArgs()
  const summary = process.argv.includes('--summary')
  const topicsArg = process.argv[process.argv.indexOf('--topics') + 1]
  const user = await db.user.findFirst({ where: { grade: { contains: '10' } }, select: { id: true, grade: true } })
  if (!user) throw new Error('no Class 10 user in the local DB — set a dev account\'s grade to "Class 10"')
  const book = await db.books.findUnique({ where: { code: args.book || 'jemh1' } })
  const chapter = await db.book_chapters.findFirst({ where: { book_id: book.id, number: args.chapter || 1 } })
  const topics = await db.book_topics.findMany({ where: { chapter_id: chapter.id }, orderBy: { position: 'asc' } })
  const picks = summary ? [] : (topicsArg ? topicsArg.split(',').map((i) => topics[Number(i) - 1]) : [topics[1] || topics[0]])
  const source = summary ? { chapterId: Number(chapter.id), kind: 'summary' } : { chapterId: Number(chapter.id), kind: 'topics', topicIds: picks.map((t) => Number(t.id)) }

  for (const pass of [1, 2]) {
    const t0 = Date.now()
    const lesson = await aiService.generateLesson({ userId: user.id, topic: '', subject: '', gradeLevel: '10', mode: 'intermediate', prefs: { explanationStyle: 'visual' }, source })
    console.log(`pass ${pass}: ${lesson.lessonTitle} | ${lesson.slides.length} slides | model=${lesson.generationModel} | ${Date.now() - t0} ms | source=${lesson.source.topicLabel || 'summary'}`)
    if (pass === 2 && !String(lesson.generationModel).startsWith('cache:')) throw new Error('second call did not hit the cache')
    if (process.argv.includes('--dump')) console.log(JSON.stringify(lesson.slides.map((s) => ({ t: s.slideTitle, n: s.narrationText })), null, 1))
  }
  await db.$disconnect()
})().catch(async (e) => { console.error('E2E ERROR:', e.message); await db.$disconnect(); process.exit(1) })
```

Run: `cd server && MOCK_AI=true node scripts/textbooks/e2e-book-lesson.js --book jemh1 --chapter 7` (PowerShell: `$env:MOCK_AI='true'; node …`)
Expected: `pass 1 … model=mock-v1 …` then `pass 2 … model=cache:mock-v1 …` and a much smaller ms. Then `--summary` → same shape, `source=summary`. Query: `SELECT kind, topic_ids, hits FROM book_lessons;` → 2 rows, each `hits = 1`. `SELECT chapter, book_chapter_id, book_lesson_id FROM lessons ORDER BY "createdAt" DESC LIMIT 2;` → chapter title + ids populated.

- [ ] **Step 6: Full suite and commit**

Run: `cd server && npm test 2>&1 | grep -E "^# (pass|fail)"` → `fail 1`.
```bash
git add server/src/services/bookLessonCache.js server/src/services/ai.service.js server/src/services/lesson.service.js server/tests/bookLessonCache.test.js server/scripts/textbooks/e2e-book-lesson.js
git commit -m "Textbook lessons: grounded generation with a shared per-chapter lesson cache; book-aware doubts"
```

---

### Task 10: Controller + route validation for `source`

**Files:**
- Modify: `server/src/routes/ai.js` (`generateRules` ~38–50)
- Modify: `server/src/controllers/ai.controller.js` (`generateLesson` ~29–61)
- Create: `server/src/services/lessonSource.js`
- Create: `server/tests/lessonSource.test.js`

**Interfaces:**
- Produces: `parseSourceBody(body) → { source: {chapterId, kind, topicIds} | null, error: string | null }` (pure). The controller passes `source` to `aiService.generateLesson`.

- [ ] **Step 1: Write the failing test**

`server/tests/lessonSource.test.js`:
```js
'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { parseSourceBody } = require('../src/services/lessonSource')

test('no source → null, no error (the free-topic path)', () => {
  assert.deepEqual(parseSourceBody({ topic: 'Sets' }), { source: null, error: null })
})

test('summary source needs only a chapter id', () => {
  assert.deepEqual(parseSourceBody({ source: { chapterId: 12, kind: 'summary' } }), { source: { chapterId: 12, kind: 'summary', topicIds: [] }, error: null })
})

test('topics source keeps 1–3 integer ids, de-duplicated, as numbers', () => {
  assert.deepEqual(parseSourceBody({ source: { chapterId: '12', kind: 'topics', topicIds: ['7', 8, 7] } }).source, { chapterId: 12, kind: 'topics', topicIds: [7, 8] })
})

test('rejects a bad kind, a missing chapter, zero or four topics, non-integers', () => {
  assert.match(parseSourceBody({ source: { chapterId: 1, kind: 'quiz' } }).error, /kind/)
  assert.match(parseSourceBody({ source: { kind: 'summary' } }).error, /chapterId/)
  assert.match(parseSourceBody({ source: { chapterId: 1, kind: 'topics', topicIds: [] } }).error, /1 to 3/)
  assert.match(parseSourceBody({ source: { chapterId: 1, kind: 'topics', topicIds: [1, 2, 3, 4] } }).error, /1 to 3/)
  assert.match(parseSourceBody({ source: { chapterId: 1, kind: 'topics', topicIds: ['a'] } }).error, /topicIds/)
})

test('topic is required only when there is no source', () => {
  assert.match(parseSourceBody({}).error || '', /^$/) // parse does not own the topic rule — see the route
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd server && node --test tests/lessonSource.test.js` → FAIL, module not found.

- [ ] **Step 3: Write lessonSource.js**

`server/src/services/lessonSource.js`:
```js
'use strict'
// Shape-checks the optional `source` of POST /api/ai/lesson/generate. Pure, so the
// rules are unit-tested; ownership/scope checks happen later in books.service.
const { MAX_TOPICS } = require('./books.service')

const KINDS = ['summary', 'topics']
const toInt = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null)

function parseSourceBody(body = {}) {
  const s = body.source
  if (s == null) return { source: null, error: null }
  if (typeof s !== 'object' || Array.isArray(s)) return { source: null, error: 'source must be an object' }
  const chapterId = toInt(s.chapterId)
  if (!chapterId) return { source: null, error: 'source.chapterId must be a positive integer' }
  if (!KINDS.includes(s.kind)) return { source: null, error: 'source.kind must be "summary" or "topics"' }
  if (s.kind === 'summary') return { source: { chapterId, kind: 'summary', topicIds: [] }, error: null }
  if (!Array.isArray(s.topicIds)) return { source: null, error: 'source.topicIds must be an array' }
  const ids = []
  for (const v of s.topicIds) {
    const n = toInt(v)
    if (!n) return { source: null, error: 'source.topicIds must be positive integers' }
    if (!ids.includes(n)) ids.push(n)
  }
  if (ids.length < 1 || ids.length > MAX_TOPICS) return { source: null, error: `Pick 1 to ${MAX_TOPICS} topics.` }
  return { source: { chapterId, kind: 'topics', topicIds: ids }, error: null }
}

module.exports = { parseSourceBody }
```

Run: `node --test tests/lessonSource.test.js` → 5 passing.

- [ ] **Step 4: Route rules and controller**

In `server/src/routes/ai.js`, change `generateRules` to:
```js
const generateRules = [
  // With a textbook `source` the topic/subject are derived server-side, so they are
  // optional; the free-topic path still requires them.
  body('topic').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('topic must be 200 characters or fewer'),
  body('subject').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('subject must be 100 characters or fewer'),
  body('gradeLevel').optional({ values: 'falsy' }).trim().isLength({ max: 20 }).withMessage('gradeLevel must be 20 characters or fewer'),
  body('source').optional().isObject().withMessage('source must be an object'),
  body('topic').custom((v, { req }) => {
    if (!req.body.source && !(v && String(v).trim())) throw new Error('topic is required')
    return true
  }),
]
```

In `server/src/controllers/ai.controller.js` `generateLesson`, after the `validationResult` check, replace `const { topic, subject } = req.body` with:
```js
    const { source, error: sourceError } = parseSourceBody(req.body)
    if (sourceError) return ApiResponse.error(res, sourceError, 422)
    const topic = req.body.topic ? String(req.body.topic).trim() : ''
    const subject = req.body.subject ? String(req.body.subject).trim() : ''
```
and add `source,` to the `aiService.generateLesson({ … })` call. Import at the top: `const { parseSourceBody } = require('../services/lessonSource')`.

- [ ] **Step 5: Smoke the endpoint with MOCK_AI**

Run the server with `MOCK_AI=true` and a Class 10 token:
`curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"source":{"chapterId":<id>,"kind":"topics","topicIds":[<t1>,<t2>]},"mode":"intermediate"}' http://localhost:5000/api/ai/lesson/generate | head -c 600`
Expected: 201 with `lesson.source.topicLabel`. Repeat with `"topicIds":[1,2,3,4]` → 422 `Pick 1 to 3 topics.`; with a chapter id from another class's book (none exist yet — use a non-existent id) → 404; with `{}` body → 422 `topic is required`; the old body `{"topic":"Sets","subject":"Maths","gradeLevel":"10"}` still → 201.

- [ ] **Step 6: Suite and commit**

`npm test 2>&1 | grep -E "^# (pass|fail)"` → `fail 1`.
```bash
git add server/src/routes/ai.js server/src/controllers/ai.controller.js server/src/services/lessonSource.js server/tests/lessonSource.test.js
git commit -m "Lesson generate API: optional textbook source, topic derived server-side"
```

---

### Task 11: Embed the topics for doubts / Ask (pgvector)

**Files:**
- Create: `server/scripts/textbooks/embed-textbooks.js`

**Interfaces:**
- Consumes: `book_topics` rows, `chunkText` (`src/utils/chunkText.js`), `getEmbeddingProvider()` (`src/providers/embeddings`).
- Produces: one `knowledge_sources` row per book (`title: "NCERT Class 10 Mathematics"`, `type: 'textbook'`, `subject`, `gradeLevel: 'Class 10'`, `status: READY`) and `knowledge_chunks` with `metadata {type:'textbook', book, chapterNumber, chapterTitle, topicNumber, topicTitle, topicId}`.

- [ ] **Step 1: Write the script (modelled on `scripts/ingest-curriculum.js`)**

`server/scripts/textbooks/embed-textbooks.js`:
```js
'use strict'
// Embeds book_topics into knowledge_chunks (one knowledge_source per book) so the
// Ask screen and in-lesson doubts can retrieve textbook passages. Rebuilds the
// book's source from scratch each run.
//   node scripts/textbooks/embed-textbooks.js [--book jemh1]
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const crypto = require('crypto')
const { Prisma } = require('@prisma/client')
const db = require('../../src/config/database')
const { chunkText } = require('../../src/utils/chunkText')
const { getEmbeddingProvider } = require('../../src/providers/embeddings')
const { config } = require('../../src/config/env')
const lib = require('./lib')

const EMBED_BATCH = 96
const vecLit = (v) => `[${v.join(',')}]`

async function ownerId() {
  const u = await db.user.findFirst({ where: { role: { in: ['ADMIN', 'TEACHER'] } }, orderBy: { createdAt: 'asc' }, select: { id: true } })
    || await db.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } })
  if (!u) throw new Error('no users in DB to own the knowledge source')
  return u.id
}

async function embedBook(book, uploadedById) {
  const title = `NCERT Class ${book.class_level} ${book.title}`
  await db.knowledge_sources.deleteMany({ where: { title } })
  const chapters = await db.book_chapters.findMany({ where: { book_id: book.id }, orderBy: { number: 'asc' }, include: { topics: { orderBy: { position: 'asc' } } } })
  const docs = []
  for (const ch of chapters) {
    for (const t of ch.topics) {
      for (const piece of chunkText(t.text, { chunkSize: config.rag.chunkSize, overlap: config.rag.chunkOverlap })) {
        docs.push({ content: `${ch.title} — ${t.number} ${t.title}\n${piece}`, metadata: { type: 'textbook', book: book.code, chapterNumber: ch.number, chapterTitle: ch.title, topicNumber: t.number, topicTitle: t.title, topicId: Number(t.id) } })
      }
    }
  }
  const source = await db.knowledge_sources.create({
    data: { title, description: `${book.publisher} ${book.edition}`, type: 'textbook', subject: book.subject, gradeLevel: `Class ${book.class_level}`, charCount: docs.reduce((s, d) => s + d.content.length, 0), chunkCount: docs.length, status: 'PROCESSING', uploadedById, updatedAt: new Date() },
  })
  const provider = getEmbeddingProvider()
  for (let i = 0; i < docs.length; i += EMBED_BATCH) {
    const slice = docs.slice(i, i + EMBED_BATCH)
    const vectors = await provider.embedDocuments(slice.map((d) => d.content))
    const rows = slice.map((d, j) => Prisma.sql`(${crypto.randomUUID()}::uuid, ${source.id}::uuid, ${i + j}, ${d.content}, ${d.content.length}, ${vecLit(vectors[j])}::vector, ${JSON.stringify(d.metadata)}::jsonb)`)
    await db.$executeRaw(Prisma.sql`INSERT INTO knowledge_chunks (id, "sourceId", "chunkIndex", content, "charCount", embedding, metadata) VALUES ${Prisma.join(rows)}`)
    process.stdout.write(`  ${book.code}: ${Math.min(i + EMBED_BATCH, docs.length)}/${docs.length}\r`)
  }
  await db.knowledge_sources.update({ where: { id: source.id }, data: { status: 'READY' } })
  console.log(`\n${title}: ${docs.length} chunks`)
}

;(async () => {
  const args = lib.parseArgs()
  const owner = await ownerId()
  const books = await db.books.findMany({ where: args.book ? { code: args.book } : {}, orderBy: { position: 'asc' } })
  for (const b of books) await embedBook(b, owner)
  await db.$disconnect()
})().catch(async (e) => { console.error('EMBED ERROR:', e.message); await db.$disconnect(); process.exit(1) })
```
Check the `User` model's role enum values and `createdAt` field name in `schema.prisma` before running; adjust the `ownerId` query if they differ (e.g. `created_at`).

- [ ] **Step 2: Run and verify retrieval**

Run: `cd server && node scripts/textbooks/embed-textbooks.js`
Expected: two `NCERT Class 10 …: N chunks` lines. Verify:
`node -e "require('dotenv').config();const {retrieve}=require('./src/services/retriever.service');retrieve({query:'What is the fundamental theorem of arithmetic?',subject:'Mathematics',gradeLevel:'Class 10'}).then(r=>{console.log(r.chunks.slice(0,2).map(c=>[c.similarity,c.metadata&&c.metadata.topicNumber,c.content.slice(0,80)]));process.exit(0)})"`
Expected: top chunk from topic `1.2` with similarity > 0.5.

- [ ] **Step 3: Commit**

```bash
git add server/scripts/textbooks/embed-textbooks.js
git commit -m "Textbook pipeline: embed topics into knowledge_chunks for doubts and Ask"
```

---

### Task 12: App — books API client and the three picker views

**Files:**
- Create: `src/api/booksApi.js`
- Create: `src/screens/aiteacher/books/BookGrid.js`
- Create: `src/screens/aiteacher/books/ChapterList.js`
- Create: `src/screens/aiteacher/books/ChapterTopics.js`
- Create: `src/screens/aiteacher/books/TextbookCard.js`
- Create: `src/screens/aiteacher/books/BookHeader.js`

**Interfaces:**
- Produces: `getBooks()`, `getBookChapters(bookId)`, `getBookChapter(chapterId)`; components with props documented inline. `ChapterTopics` calls `onTeach({ chapterId, kind, topicIds })` — the exact `source` shape Task 10 accepts.

- [ ] **Step 1: booksApi.js**

`src/api/booksApi.js`:
```js
import axiosInstance from './axiosInstance';
import { API_BASE_URL } from '../constants/config';

// Textbooks for the student's class (the server reads the class from the JWT scope).
// Backend wraps responses as { success, message, data }; we unwrap to `data`.

// GET /api/books → [{ id, code, title, subject, subjectSlug, edition, coverUrl, chapterCount }]
export const getBooks = async () => (await axiosInstance.get('/api/books')).data.data;

// GET /api/books/:bookId/chapters → { book, chapters:[{ id, number, title, topicCount }] }
export const getBookChapters = async (bookId) => (await axiosInstance.get(`/api/books/${bookId}/chapters`)).data.data;

// GET /api/books/chapters/:chapterId → { book, chapter:{id,number,title}, topics:[{ id, number, title, charCount }] }
export const getBookChapter = async (chapterId) => (await axiosInstance.get(`/api/books/chapters/${chapterId}`)).data.data;

// Cover images are served statically from the API host (server/public/books).
const HOST = String(API_BASE_URL || '').replace(/\/+$/, '').replace(/\/api$/i, '');
export const coverUri = (coverUrl) => (coverUrl ? `${HOST}${coverUrl}` : null);
```

- [ ] **Step 2: Shared header + home card**

`src/screens/aiteacher/books/BookHeader.js`:
```js
// The back-arrow header every textbook sub-view shares (same geometry as AITeacherHome's).
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { AIT } from '../../../theme/aiTeacherTheme';
import { T, PAD } from '../sections/ui';

export default function BookHeader({ title, subtitle, onBack }) {
  return (
    <View style={s.row}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back" style={s.back}>
        <ArrowLeft size={18} color={AIT.ink} strokeWidth={2} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <T w="bold" s={18} numberOfLines={1}>{title}</T>
        {!!subtitle && <T w="reg" s={12.5} c={AIT.inkSoft} numberOfLines={1}>{subtitle}</T>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 12 },
  back: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: AIT.edge, alignItems: 'center', justifyContent: 'center' },
});
```

`src/screens/aiteacher/books/TextbookCard.js`:
```js
// "Learn from your textbook" — the entry card on the AI Teacher home. Rendered only when
// the student's class has books (AITeacherScreen passes `visible`).
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BookOpen, ChevronRight } from 'lucide-react-native';
import { AIT } from '../../../theme/aiTeacherTheme';
import { T, PAD, cardSurface } from '../sections/ui';

export default function TextbookCard({ visible, bookCount = 0, onPress }) {
  if (!visible) return null;
  return (
    <View style={s.wrap}>
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.9 }]} accessibilityRole="button" accessibilityLabel="Learn from your textbook">
        <View style={s.icon}><BookOpen size={20} color={AIT.ink} strokeWidth={1.8} /></View>
        <View style={{ flex: 1 }}>
          <T w="bold" s={16}>Learn from your textbook</T>
          <T w="reg" s={12} c={AIT.inkSoft}>{bookCount ? `${bookCount} NCERT books · pick a chapter, hear it taught` : 'Pick a chapter, hear it taught'}</T>
        </View>
        <ChevronRight size={18} color={AIT.inkMuted} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingTop: 14 },
  card: { ...cardSurface, backgroundColor: AIT.cardAmber, borderColor: AIT.cardAmber, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: AIT.cardIconBg, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 3: BookGrid**

`src/screens/aiteacher/books/BookGrid.js`:
```js
// Books for the student's class: subject chips + a 2-column cover grid.
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Image, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AIT } from '../../../theme/aiTeacherTheme';
import { T, PAD, cardSurface } from '../sections/ui';
import { coverUri } from '../../../api/booksApi';
import BookHeader from './BookHeader';

const GAP = 12;

export default function BookGrid({ books, loading, error, classLabel, onOpenBook, onBack, onRetry }) {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const cardW = Math.floor((W - PAD * 2 - GAP) / 2);
  const subjects = useMemo(() => ['All', ...Array.from(new Set((books || []).map((b) => b.subject)))], [books]);
  const [subject, setSubject] = useState('All');
  const shown = (books || []).filter((b) => subject === 'All' || b.subject === subject);

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <BookHeader title="Your textbooks" subtitle={classLabel ? `NCERT · ${classLabel}` : 'NCERT'} onBack={onBack} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ flexGrow: 0 }}>
        {subjects.map((name) => (
          <Pressable key={name} onPress={() => setSubject(name)} style={[s.chip, name === subject && s.chipOn]} accessibilityRole="button" accessibilityState={{ selected: name === subject }}>
            <T w="semi" s={12.5} c={name === subject ? AIT.inkInv : AIT.ink}>{name}</T>
          </Pressable>
        ))}
      </ScrollView>
      {loading && <ActivityIndicator color={AIT.accent} style={{ marginTop: 40 }} />}
      {!!error && !loading && (
        <View style={s.empty}><T w="med" s={13} c={AIT.inkSoft}>{error}</T><Pressable onPress={onRetry}><T w="bold" s={13} c={AIT.accent}>Retry</T></Pressable></View>
      )}
      {!loading && !error && (
        <ScrollView contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          {shown.map((b) => (
            <Pressable key={b.id} onPress={() => onOpenBook(b)} style={({ pressed }) => [s.card, { width: cardW }, pressed && { opacity: 0.9 }]} accessibilityRole="button" accessibilityLabel={`${b.title}, ${b.chapterCount} chapters`}>
              <View style={[s.cover, { height: Math.round(cardW * 1.3) }]}>
                {coverUri(b.coverUrl) ? <Image source={{ uri: coverUri(b.coverUrl) }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <T w="bold" s={16} c={AIT.inkMuted}>{b.title}</T>}
              </View>
              <T w="bold" s={14} numberOfLines={2}>{b.title}</T>
              <T w="reg" s={12} c={AIT.inkSoft}>{b.chapterCount} chapters</T>
            </Pressable>
          ))}
          {!shown.length && <T w="med" s={13} c={AIT.inkSoft} style={{ padding: PAD }}>No books for this class yet.</T>}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: AIT.bg },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: PAD, paddingVertical: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: AIT.edge, backgroundColor: AIT.field },
  chipOn: { backgroundColor: AIT.chipOn, borderColor: AIT.chipOn },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: PAD, paddingTop: 8 },
  card: { ...cardSurface, padding: 10, gap: 4 },
  cover: { borderRadius: 10, overflow: 'hidden', backgroundColor: AIT.field, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  empty: { alignItems: 'center', gap: 10, padding: PAD * 2 },
});
```
If `AIT.chipOn` is not a token in `aiTeacherTheme.js`, use `AIT.ink` for both chip values.

- [ ] **Step 4: ChapterList**

`src/screens/aiteacher/books/ChapterList.js`:
```js
// "Ch. 7  Binomial Theorem" rows for one book.
import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { AIT } from '../../../theme/aiTeacherTheme';
import { T, PAD, cardSurface } from '../sections/ui';
import BookHeader from './BookHeader';

export default function ChapterList({ book, chapters, loading, error, onOpenChapter, onBack, onRetry }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <BookHeader title={book?.title || 'Chapters'} subtitle="Select a chapter" onBack={onBack} />
      {loading && <ActivityIndicator color={AIT.accent} style={{ marginTop: 40 }} />}
      {!!error && !loading && (<View style={s.empty}><T w="med" s={13} c={AIT.inkSoft}>{error}</T><Pressable onPress={onRetry}><T w="bold" s={13} c={AIT.accent}>Retry</T></Pressable></View>)}
      {!loading && !error && (
        <ScrollView contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          {(chapters || []).map((c) => (
            <Pressable key={c.id} onPress={() => onOpenChapter(c)} style={({ pressed }) => [s.row, pressed && { opacity: 0.9 }]} accessibilityRole="button" accessibilityLabel={`Chapter ${c.number}: ${c.title}`}>
              <View style={{ flex: 1 }}>
                <T w="bold" s={14}>Ch. {c.number}: {c.title}</T>
                <T w="reg" s={12} c={AIT.inkSoft}>{c.topicCount} topics</T>
              </View>
              <ChevronRight size={18} color={AIT.inkMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: AIT.bg },
  list: { paddingHorizontal: PAD, gap: 10, paddingTop: 4 },
  row: { ...cardSurface, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  empty: { alignItems: 'center', gap: 10, padding: PAD * 2 },
});
```

- [ ] **Step 5: ChapterTopics**

`src/screens/aiteacher/books/ChapterTopics.js`:
```js
// One chapter: a Summary button, a checklist of the book's numbered sections (up to 3),
// and the "Teach me" CTA. Emits the exact `source` the generate API accepts.
import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Square, CheckSquare } from 'lucide-react-native';
import { AIT } from '../../../theme/aiTeacherTheme';
import { T, PAD, cardSurface, Eyebrow } from '../sections/ui';
import BookHeader from './BookHeader';

export const MAX_TOPICS = 3;

export default function ChapterTopics({ data, loading, error, generating, onTeach, onBack, onRetry }) {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState([]);
  const [note, setNote] = useState('');
  const chapter = data?.chapter;
  const topics = data?.topics || [];

  const toggle = (id) => {
    setNote('');
    setPicked((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= MAX_TOPICS) { setNote(`Pick up to ${MAX_TOPICS}, or play the chapter summary.`); return cur; }
      return [...cur, id];
    });
  };
  const pickedLabel = topics.filter((t) => picked.includes(t.id)).map((t) => t.number).join(', ');

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <BookHeader title={chapter ? `Ch. ${chapter.number}: ${chapter.title}` : 'Chapter'} subtitle={data?.book?.title ? `NCERT · ${data.book.title}` : ''} onBack={onBack} />
      {loading && <ActivityIndicator color={AIT.accent} style={{ marginTop: 40 }} />}
      {!!error && !loading && (<View style={s.empty}><T w="med" s={13} c={AIT.inkSoft}>{error}</T><Pressable onPress={onRetry}><T w="bold" s={13} c={AIT.accent}>Retry</T></Pressable></View>)}
      {!loading && !error && chapter && (
        <>
          <ScrollView contentContainerStyle={[s.body, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
            <Pressable disabled={generating} onPress={() => onTeach({ chapterId: chapter.id, kind: 'summary' })} style={({ pressed }) => [s.summary, pressed && { opacity: 0.9 }]} accessibilityRole="button" accessibilityLabel="Play the chapter summary">
              <View style={s.playIcon}><Play size={16} color={AIT.ink} fill={AIT.ink} /></View>
              <View style={{ flex: 1 }}>
                <T w="bold" s={15}>Chapter summary</T>
                <T w="reg" s={12} c={AIT.onAmberSoft}>Every section, spoken in about 6 minutes</T>
              </View>
            </Pressable>

            <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>Or pick what to learn (up to {MAX_TOPICS})</Eyebrow>
            {topics.map((t) => {
              const on = picked.includes(t.id);
              const Icon = on ? CheckSquare : Square;
              return (
                <Pressable key={t.id} onPress={() => toggle(t.id)} style={[s.topic, on && s.topicOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${t.number} ${t.title}`}>
                  <Icon size={20} color={on ? AIT.accent : AIT.inkMuted} strokeWidth={2} />
                  <T w={on ? 'bold' : 'med'} s={14} style={{ flex: 1 }}>{t.number}  {t.title}</T>
                </Pressable>
              );
            })}
            {!!note && <T w="med" s={12.5} c={AIT.accent} style={{ marginTop: 10 }} accessibilityLiveRegion="polite">{note}</T>}
          </ScrollView>

          {picked.length > 0 && (
            <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 12 }]}>
              <Pressable disabled={generating} onPress={() => onTeach({ chapterId: chapter.id, kind: 'topics', topicIds: picked })} style={({ pressed }) => [s.cta, pressed && { opacity: 0.9 }, generating && { opacity: 0.6 }]} accessibilityRole="button" accessibilityLabel={`Teach me ${pickedLabel}`}>
                <T w="bold" s={15} c={AIT.inkInv}>Teach me {pickedLabel} →</T>
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: AIT.bg },
  body: { paddingHorizontal: PAD, paddingTop: 6 },
  summary: { ...cardSurface, backgroundColor: AIT.cardAmber, borderColor: AIT.cardAmber, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  playIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: AIT.cardIconBg, alignItems: 'center', justifyContent: 'center' },
  topic: { ...cardSurface, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8 },
  topicOn: { borderColor: AIT.accent },
  ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: PAD, paddingTop: 10, backgroundColor: AIT.bg },
  cta: { backgroundColor: AIT.cardInk, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  empty: { alignItems: 'center', gap: 10, padding: PAD * 2 },
});
```

- [ ] **Step 6: Lint/import check and commit**

Run from the repo root: `npx eslint src/api/booksApi.js src/screens/aiteacher/books/*.js` (if the project has an eslint config; otherwise `node -e "require('@babel/core')"`-style checks are overkill — a successful Metro bundle in Task 13 is the real check).
```bash
git add src/api/booksApi.js src/screens/aiteacher/books
git commit -m "AI Teacher app: textbook picker views (books, chapters, topics)"
```

---

### Task 13: Wire the picker into AITeacherScreen + generate with `source`

**Files:**
- Modify: `src/api/aiApi.js` (`generateLesson` ~30–40)
- Modify: `src/screens/AITeacherScreen.js` (state ~60–130, `handleGenerate` ~255–286, landing render ~377–495)
- Modify: `src/screens/aiteacher/AITeacherHome.js` (props + render the card after the action-card row ~270–280)
- Modify: `src/components/teacher/teacherMoments.js` (`preparingBeats` — accept a chapter label; only if the function takes the topic string, which it does)

- [ ] **Step 1: aiApi.generateLesson passes `source`**

In `src/api/aiApi.js` replace `generateLesson` with:
```js
// POST /api/ai/lesson/generate → { lessonId, lesson }
// `mode` (optional): a teaching-mode key (eli5/beginner/…/interview). Omit or pass
// null/'auto' to let the teacher auto-select from the student's mastery.
// `source` (optional): a textbook scope { chapterId, kind:'summary' } or
// { chapterId, kind:'topics', topicIds:[…] } — the server derives topic/subject from it.
export const generateLesson = async ({ topic, subject, gradeLevel, mode, prefs, source }) => {
  // Full lesson generation by Opus can take 30–90s — allow up to 2 minutes.
  const res = await axiosInstance.post('/api/ai/lesson/generate', {
    ...(topic ? { topic } : {}),
    ...(subject ? { subject } : {}),
    ...(gradeLevel ? { gradeLevel } : {}),
    ...(mode && mode !== 'auto' ? { mode } : {}),
    ...(prefs ? { prefs } : {}),
    ...(source ? { source } : {}),
  }, { timeout: 120000 });
  return res.data.data;
};
```

- [ ] **Step 2: AITeacherScreen state + loaders**

Add imports at the top of `src/screens/AITeacherScreen.js`:
```js
import { getBooks, getBookChapters, getBookChapter } from '../api/booksApi';
import BookGrid from './aiteacher/books/BookGrid';
import ChapterList from './aiteacher/books/ChapterList';
import ChapterTopics from './aiteacher/books/ChapterTopics';
```
After the `// Generator` state block add:
```js
  // ── Textbook flow (books → chapters → chapter topics), all inside this screen ──
  // 'home' | 'books' | 'chapters' | 'chapter'. Books load once per screen; the card on
  // the home hides itself while the list is empty or unknown.
  const [bookView, setBookView] = useState('home');
  const [books, setBooks] = useState(null);           // null = not loaded yet
  const [booksErr, setBooksErr] = useState('');
  const [bookSel, setBookSel] = useState(null);       // { book, chapters } for the chapter list
  const [chapterSel, setChapterSel] = useState(null); // getBookChapter() result
  const [bookBusy, setBookBusy] = useState(false);
  const [bookErr, setBookErr] = useState('');
  const [sourceLabel, setSourceLabel] = useState(''); // "Ch. 7 · 7.2, 7.3" while generating/playing

  const loadBooks = async () => {
    setBooksErr('');
    try { setBooks(await getBooks()); } catch (e) { setBooks([]); setBooksErr(e?.response?.data?.error || e?.message || 'Could not load your books.'); }
  };
  useEffect(() => { loadBooks(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openBook = async (book) => {
    setBookBusy(true); setBookErr(''); setBookView('chapters'); setBookSel({ book, chapters: [] });
    try { setBookSel(await getBookChapters(book.id)); } catch (e) { setBookErr(e?.response?.data?.error || e?.message || 'Could not load chapters.'); } finally { setBookBusy(false); }
  };
  const openChapter = async (chapter) => {
    setBookBusy(true); setBookErr(''); setBookView('chapter'); setChapterSel(null);
    try { setChapterSel(await getBookChapter(chapter.id)); } catch (e) { setBookErr(e?.response?.data?.error || e?.message || 'Could not load this chapter.'); } finally { setBookBusy(false); }
  };
```

- [ ] **Step 3: handleGenerate takes an optional source**

Replace the head of `handleGenerate` so it reads:
```js
  const handleGenerate = async (source = null) => {
    const t = topic.trim();
    if ((!t && !source) || loading) return;
    setLoading(true);
    setError('');
    historyRef.current = [];
    pendingRef.current = null;
    try {
      const prefs = prefsForRequest(await loadLearnerPrefs());
      const payload = source
        ? { gradeLevel: scope?.classNum ? String(scope.classNum) : (user?.grade || ''), mode: teachMode, prefs, source }
        : { topic: t, subject: activeSubject, gradeLevel: scope?.classNum ? String(scope.classNum) : (user?.grade || ''), mode: teachMode, prefs };
      const { lessonId: id, lesson } = await generateLesson(payload);
      if (!mountedRef.current) return;
      const shownSubject = lesson.subject || activeSubject;
      const shownTitle = lesson.lessonTitle || t || lesson.topic || 'Lesson';
      if (lesson.subject && SUBJECTS.includes(lesson.subject)) setActiveSubject(lesson.subject);
      setLessonId(id);
      setLessonTitle(shownTitle);
      setSlides(lesson.slides || []);
      setKeyTerms(lesson.keyTerms || []);
      setStartIndex(0);
      posRef.current = { slideIndex: 0, total: 0 };
      clearingRef.current = false;
      saveActiveLesson({ lessonId: id, title: shownTitle, subject: shownSubject, slideIndex: 0 });
      setSavedLesson(null);
      setBookView('home');
    } catch (e) {
      if (mountedRef.current) setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'I couldn’t put that lesson together just now — let’s try again.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const teachFromBook = (source) => {
    const ch = chapterSel?.chapter;
    const label = ch ? `Ch. ${ch.number}${source.kind === 'topics' ? ' · ' + (chapterSel.topics || []).filter((x) => source.topicIds.includes(x.id)).map((x) => x.number).join(', ') : ' · summary'}` : '';
    setSourceLabel(label);
    return handleGenerate(source);
  };
```
`onGenerate={handleGenerate}` on `AITeacherHome` must become `onGenerate={() => handleGenerate()}` (the search field's submit passes an event, which must not be mistaken for a source). Grep the file for every `handleGenerate` reference and make the same change (the error-card Retry too).

The generating-overlay stages: `const prepStages = useMemo(() => preparingBeats(sourceLabel ? `${sourceLabel}` : topic), [topic, sourceLabel]);` — `preparingBeats(topicString)` already frames copy around whatever string it is given, so "Reading Ch. 7 · 7.2, 7.3…" style beats need no change there. Clear `sourceLabel` in `newLesson()` (`setSourceLabel('')`).

- [ ] **Step 4: Render the sub-views and the home card**

In the landing branch (`if (slides.length === 0) {`), before `return ( <View style={{ flex: 1 }}> <AITeacherHome …`, add:
```js
    if (bookView === 'books') {
      return (
        <View style={{ flex: 1 }}>
          <BookGrid books={books || []} loading={books === null} error={booksErr} classLabel={scope?.className || ''} onOpenBook={openBook} onBack={() => setBookView('home')} onRetry={loadBooks} />
          <GeneratingOverlay visible={loading} opacity={genFade} stages={prepStages} stage={genStage} hint={prepHint} />
        </View>
      );
    }
    if (bookView === 'chapters') {
      return (
        <View style={{ flex: 1 }}>
          <ChapterList book={bookSel?.book} chapters={bookSel?.chapters || []} loading={bookBusy} error={bookErr} onOpenChapter={openChapter} onBack={() => setBookView('books')} onRetry={() => bookSel?.book && openBook(bookSel.book)} />
          <GeneratingOverlay visible={loading} opacity={genFade} stages={prepStages} stage={genStage} hint={prepHint} />
        </View>
      );
    }
    if (bookView === 'chapter') {
      return (
        <View style={{ flex: 1 }}>
          <ChapterTopics data={chapterSel} loading={bookBusy} error={bookErr || error} generating={loading} onTeach={teachFromBook} onBack={() => setBookView('chapters')} onRetry={() => chapterSel?.chapter ? openChapter(chapterSel.chapter) : setBookView('chapters')} />
          <GeneratingOverlay visible={loading} opacity={genFade} stages={prepStages} stage={genStage} hint={prepHint} />
        </View>
      );
    }
```
Pass two new props to `<AITeacherHome …>`:
```js
          textbookCount={Array.isArray(books) ? books.length : 0}
          onOpenTextbooks={() => setBookView('books')}
```
In `src/screens/aiteacher/AITeacherHome.js`: import `TextbookCard from './books/TextbookCard'`; add props `textbookCount = 0, onOpenTextbooks = () => {}` to the signature; render `<TextbookCard visible={textbookCount > 0} bookCount={textbookCount} onPress={onOpenTextbooks} />` immediately after the `</View>` that closes `s.actionCardsRow`.

- [ ] **Step 5: Run it on a device/emulator against the local server**

Start the server (`cd server && npm run dev`, real `MOCK_AI` setting off if you want real lessons; on for a fast first pass). Start the app (`npx expo start`), log in as the Class 10 account. Walk:
1. AI Teacher home shows "Learn from your textbook · 2 NCERT books".
2. Tap → two covers; chips All / Science / Mathematics filter.
3. Mathematics → 14 chapters → Ch. 7 → topics list; tick 4 → note appears; tick 2 → CTA "Teach me 7.2, 7.3 →".
4. Tap → overlay → player speaks; back out; My Lessons shows it with the lesson title.
5. Re-open the same chapter, same two topics → lesson appears in ~1–2 s (cache).
6. Chapter summary → plays.
7. Ask a doubt mid-lesson ("what does the book say about the middle term?") → answer quotes the book.
8. Log in as a Class 11 account → no textbook card on the home.
Fix anything that breaks; note each fix in the commit message.

- [ ] **Step 6: Commit**

```bash
git add src/api/aiApi.js src/screens/AITeacherScreen.js src/screens/aiteacher/AITeacherHome.js
git commit -m "AI Teacher app: learn from your textbook — book, chapter and topic flow into the live player"
```

---

### Task 14: Real-lesson fidelity review, hygiene, hand-off notes

**Files:**
- Modify: `server/Class06_Science_Textbooks/fetch-textbooks.js` (lines 20–21, if the file exists on this branch)
- Modify: `docs/superpowers/specs/2026-10-14-textbook-lessons-design.md` (status line + a "Deploy checklist" status)

- [ ] **Step 1: Generate 6 real lessons and read them against the book**

With `MOCK_AI` unset and a real `ANTHROPIC_API_KEY`:
```
node scripts/textbooks/e2e-book-lesson.js --book jemh1 --chapter 7 --topics 2,3 --dump
node scripts/textbooks/e2e-book-lesson.js --book jemh1 --chapter 1 --summary --dump
node scripts/textbooks/e2e-book-lesson.js --book jemh1 --chapter 4 --topics 2 --dump
node scripts/textbooks/e2e-book-lesson.js --book jesc1 --chapter 1 --topics 1,2 --dump
node scripts/textbooks/e2e-book-lesson.js --book jesc1 --chapter 10 --summary --dump
node scripts/textbooks/e2e-book-lesson.js --book jesc1 --chapter 6 --topics 3 --dump
```
For each: pass 2 must be `cache:`; read the dumped narration against the chapter PDF. Pass criteria: section numbers referenced, NCERT's definitions/examples used, nothing taught that the sections don't contain (extra examples announced as such), summary lessons cover every section. Record the findings (one line per lesson) in the spec under a new `## 14. Fidelity review (2026-10-xx)` section. If a systematic problem shows up (e.g. ignores numbering), fix the SOURCE_RULES wording in Task 7's prompt, **bump `PROMPT_VERSION`**, and re-run.

- [ ] **Step 2: Verify prompt caching is live**

Temporarily log `message.usage` in `AnthropicProvider._createLessonMessage` (`console.log('[lesson usage]', msg.usage)`), run the same chapter twice with different `--topics` within 5 minutes: the second run must show `cache_read_input_tokens > 0`. Remove the log line afterwards.

- [ ] **Step 3: Remove the hard-coded examin8 credentials**

If `server/Class06_Science_Textbooks/fetch-textbooks.js` exists on this branch, replace the literal cookie/CSRF values at lines 20–21 with `process.env.EXAMIN8_COOKIE` / `process.env.EXAMIN8_CSRF` and a comment `// set in .env — never commit session cookies`. If the file is not on this branch (it may only be in the main tree's uncommitted work), skip and say so.

- [ ] **Step 4: Spec status + deploy checklist**

In the spec, change `**Status:** design, awaiting review` to `**Status:** implemented locally on feat/textbook-lessons; AWS steps in §12 pending` and append under §12:
```markdown
Checklist for the AWS deploy (tick when done):
- [ ] `prisma/sql/textbooks.sql` run on the production DB
- [ ] `CREATE EXTENSION IF NOT EXISTS vector` confirmed
- [ ] server deployed from feat/textbook-lessons (or main after merge)
- [ ] `node scripts/textbooks/seed-textbooks.js` run on the server
- [ ] `node scripts/textbooks/embed-textbooks.js` run on the server (VOYAGE_API_KEY set)
- [ ] reverse proxy / ALB idle timeout ≥ 180 s
- [ ] `GET /api/books` from a Class 10 account returns 2 books; one real lesson generated and played
```

- [ ] **Step 5: Full suite, commit**

`cd server && npm test 2>&1 | grep -E "^# (pass|fail)"` → `fail 1` (pre-existing only).
```bash
git add -A docs/superpowers/specs/2026-10-14-textbook-lessons-design.md server/Class06_Science_Textbooks/fetch-textbooks.js
git commit -m "Textbook lessons: fidelity review notes, deploy checklist, drop hard-coded examin8 session"
```

Then run `superpowers:finishing-a-development-branch` to decide merge/PR.

---

## Self-review notes

- Spec §5.3 "Introduction dropped only if < 400 chars" → Task 3 `MIN_INTRO_CHARS`. §5.4 review table → Task 4. §6 tables → Task 5 verbatim. §7 three routes + 403/422 → Tasks 6, 10. §8.1 prompt text → Task 7 verbatim. §8.2 cache_control → Task 8. §8.3 flow incl. race → Task 9. §8.4 doubts → Tasks 8/9. §9 screens → Tasks 12/13. §10 error table → Tasks 6 (P2021 → `[]`), 9, 10. §11 tests → every task. §12 deploy → Task 14. §9.1's "player header subtitle" is implemented as the overlay/lesson-title label (`sourceLabel`) rather than a change inside the 2.4k-line player — a deliberate narrowing; the lesson title Claude returns already names the chapter.
- Names used consistently: `loadSource` / `derivedTopic` / `topicLabel` (Task 6 → 7 → 9), `buildSourceBlock` (7 → 8), `buildLessonRequestParts` (8), `createBookLessonCache.cacheKey/find/store` (9), `parseSourceBody` (10), `source` body shape `{chapterId, kind, topicIds}` (10 → 12/13).
- Review Focus 1–5 each have a test: Task 6 (`listBooks` empty, 403), Task 9 (race, prompt_version), Task 10 (4 ids / wrong chapter), Task 3 (empty topic refuses).
