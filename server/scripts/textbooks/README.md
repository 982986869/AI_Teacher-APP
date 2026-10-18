# Textbook pipeline (NCERT → textbook_topics)

One-time, per book. Everything before `seed` runs on a developer machine; the server
only ever reads the committed `data/textbooks/class<N>/<code>/chNN.json`.

    node   scripts/textbooks/download.js            # PDFs → data/textbooks/pdf/ (ignored)
    python -I -X utf8 scripts/textbooks/extract.py  # raw text/headings → chNN.raw.json (ignored), covers → public/books/
    node   scripts/textbooks/outline.js             # Claude verifies the outline → chNN.json (committed); prints a review table
    node   scripts/textbooks/seed-textbooks.js      # chNN.json → books / textbook_chapters / textbook_topics
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

What the extractor has learnt from the books so far (extract.py): headings may carry a
trailing dot ("2.4."), start with a symbol ("6.3 π Is Irrational"), hide a control
character after the number, or sit as a bold bare number with the title on the next
line ("3.1" / "WHY DO WE NEED TO CLASSIFY…"); "bold" includes demi/black faces that carry
no bold flag; ligatures arrive with a stray space ("Reﬂ ections"). The outline step gets
the first page's lines so Claude can return the full printed title where the largest-font
heuristic fails (titles wrapped across sizes, "Chapter 3", decorative glyphs).

Books so far (all English, 2026-27): Class 6–8 Curiosity + Ganita Prakash (Maths in two
parts for 7 and 8); Class 9 Science + Mathematics Part 1/2 (new syllabus); Class 10 Science +
Mathematics; Class 11 Physics 1/2, Chemistry 1/2, Biology, Mathematics; Class 12 Physics
1/2, Chemistry 1/2, Biology, Mathematics 1/2.

Design: `docs/superpowers/specs/2026-10-14-textbook-lessons-design.md`.
