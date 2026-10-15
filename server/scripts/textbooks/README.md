# Textbook pipeline (NCERT → book_topics)

One-time, per book. Everything before `seed` runs on a developer machine; the server
only ever reads the committed `data/textbooks/class<N>/<code>/chNN.json`.

    node   scripts/textbooks/download.js            # PDFs → data/textbooks/pdf/ (ignored)
    python -I -X utf8 scripts/textbooks/extract.py  # raw text/headings → chNN.raw.json (ignored), covers → public/books/
    node   scripts/textbooks/outline.js             # Claude verifies the outline → chNN.json (committed); prints a review table
    node   scripts/textbooks/seed-textbooks.js      # chNN.json → books / book_chapters / book_topics
    node   scripts/textbooks/embed-textbooks.js     # topics → knowledge_chunks (needs VOYAGE_API_KEY)

All take `--book <code>` and (except seed/embed) `--chapter <n>`; `outline.js` takes `--force`
to redo a chapter that already has a chNN.json. Python needs `pip install pymupdf`.

Adding a book = one entry in `books.json` (code from the ncert.nic.in URL, e.g.
`jemh1` = Class 10 English Mathematics part 1) and running the five steps.

Manifest fields beyond the obvious: `chapters` is how many chapter PDFs the site serves
(probe `{code}NN.pdf` until a 404); `chapterOffset` numbers a part-2 book after part 1
(Class 9 Maths Part 2 is chapters 9–14, so its sections read "12.1"). A chapter with no
numbered sections (the 2026-27 books open with a narrative "Exploration" chapter) becomes
one topic under the chapter title. A student only ever sees the books of their own class.

Books so far: Class 10 Science + Mathematics (2026-27 reprints); Class 9 Science,
Mathematics Part 1 and Part 2 (the new 2026-27 syllabus books).

Manifest fields beyond the obvious:  is how many chapter PDFs the site serves
(probe  until a 404);  numbers a part-2 book after part 1
(Class 9 Maths Part 2 is chapters 9–14, so its sections read 12.1). Chapters with no
numbered sections (the 2026-27 books open with a narrative Exploration chapter) become
one topic under the chapter title. Books live in the app under the class in
; a student only ever sees their own class's books.

Books so far: Class 10 Science + Mathematics (2026-27 reprints); Class 9 Science,
Mathematics Part 1 and Part 2 (the new 2026-27 syllabus books).

Design: `docs/superpowers/specs/2026-10-14-textbook-lessons-design.md`.
