# Class 6 — Mathematics NCERT (Revised / Ganita Prakash)

Destination for the Class 6 Maths NCERT textbook-solution content that backs the
**"Class 06 - Mathematics - Revised"** tile (Resources → Class 6 → a Maths subject).

## What to drop here
One JSON file per chapter, named `ch01.json`, `ch02.json`, … (plain ASCII — Metro
on Windows can't resolve import paths with spaces), in NCERT chapter order.

Each file is an **array** of question objects with at least these fields:

```json
[
  {
    "exercise": "Examples",            // split key: "Examples" -> Examples section;
                                       // anything else (Exercise 1.1, Chapter-end, …) -> Chapter-end
    "chapter": "Whole Numbers",
    "question_html": "<p>...</p>",     // question HTML (may contain {tex} LaTeX)
    "solution_html": "<p>...</p>"      // solution HTML
  }
]
```

Optional: `q_no`, `question_id`, `options` (empty for subjective NCERT).

## How it gets in
- **Pipeline export** → drop the files here, then run the importer.
- **Live fetch** → `scripts/fetchExamin8Ncert.js` writes here directly
  (`OUT_DIR=maths6Ncert`), given a fresh examin8 session + chapter UUIDs.

Then the importer groups each chapter into **Examples** + **Chapter-end** and seeds
`ncert_solutions` (subject Mathematics, className "Class 6"), so it renders as the
numbered list under the tile.
