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

Design: `docs/superpowers/specs/2026-10-14-textbook-lessons-design.md`.
