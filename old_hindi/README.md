# Old - हिंदी (CBSE Class 07) — Extracted Data

Source: **web.examin8.com** · Subject ID: **1922**

All questions include **correct answers** and, where available, **solutions/explanations**.

## Sections

| Folder | Content | Count |
|---|---|---|
| `important_questions/` | 32 topics, per-topic JSON | **1431** questions (with `is_correct` + explanation) |
| `practice_questions/` | 28 chapters, per-chapter JSON | **2558** questions — **100% answered** (correct option + solution) |
| `online_test/` | 7 chapters × pre-made test papers | **22 tests, 330** questions — **100% answered** |
| `last_year_papers/` | Previous-year question papers | **17 PDFs** + `papers.json` |
| `ncert_solutions/` | NCERT textbook solutions (2 books) | वसंत भाग-२ (15 ch / 178 q), बाल महाभारत कथा (20 q) |

**Total: 4517 questions with answers + 17 PDF papers.**

## JSON shape (questions)

```jsonc
{
  "id": 93676,
  "question": "…",                 // clean text (html stripped)
  "images": ["https://…"],          // <img> pulled out, absolute URLs
  "options": [
    { "id": 237365, "text": "गुणवाचक", "is_correct": true, "explanation": "…" }
  ],
  "correct_answer": ["गुणवाचक"],     // correct option text(s)
  "solution": "…"                    // explanation / solution text
}
```

## Notes
- Each `<section>/index.json` lists all files with per-topic/chapter counts.
- `manifest.json` = top-level summary of everything.
- **Online-test** papers draw their questions from the practice bank; correct answers were resolved by matching question text against the practice/important answer key, with a `POST /v1/practice/attempted/` fallback for any that didn't match.
- Practice answers were resolved authoritatively via `POST /v1/practice/attempted/` (returns `correct_option` + explanation). Side effect: this marks those practice questions as "attempted" on the account.
