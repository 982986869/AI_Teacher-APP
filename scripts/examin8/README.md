# Examin8 class ingestion (generic)

Generic, resumable importer for Examin8 content. Works for **any class** by changing
`CLASS_ID` — the same two scripts handle Class 6–12. Reuses the existing DB schema
(`subjects`, `chapters`, …); **no new tables**, no frontend/navigation changes.

Examin8 hierarchy: `Class (CLASS_ID) → Subjects → Chapters → Resources`
- children:   `GET /v1/content/category/{id}/`
- resources:  `GET /v1/content/category/{id}/type/download-resources/`  (`has_*` flags; `ads_*` ignored)

Class category ids: **1175 = CBSE Class 10** (Maths 1202, Science 1176, Social Science 1896,
English Communicative(101) 1901, Artificial Intelligence(417) 21489).

## Phase 1 — subjects + chapters metadata

```bash
# 1) DRY-RUN extractor (read-only, no DB). Writes raw + normalized JSON.
node scripts/examin8/fetchClass10Metadata.js 1175
#    → data/examin8/class10/raw/*.json          (verbatim API)
#    → data/examin8/class10/normalized/*.json    (app-shaped)
#    Resume: re-run skips cached raw files; add --force to re-download.

# 2) DRY-RUN import (reports, writes nothing)
node scripts/examin8/importClass10Metadata.js

# 3) Apply (upsert into subjects + chapters class_level=10)
node scripts/examin8/importClass10Metadata.js --live
```

Any other class — just change the id (folder name is derived from the class number):
```bash
CLASS_ID=1428 node scripts/examin8/fetchClass10Metadata.js        # e.g. Class 9
CLASS_DIR=class9 node scripts/examin8/importClass10Metadata.js --live
```

Logs report: subjects imported, chapters imported, resources, questions, errors.
Upsert keys: `subjects(slug)`, `chapters(subject_id, class_level, slug)` — safe to re-run.

Once `chapters.class_level=10` rows exist, the class shows **live** (not "coming soon")
via the existing screens — `resources.service.listContentClasses()` scans that column.

## Phase 2A — Revision Notes

The website's "Revision Notes" chapter content comes from the flash_card API
(`GET /v1/flash_card/flash_cards/{chapterCategoryId}/`). It maps to the app's
existing Revision Notes model — `sections(type_key='revision_notes')` +
`notes.blocks:[{title, html}]` (what `getNotesByPath` reads). No new tables.
Math/HTML (`{tex}…{/tex}`, `<span class="math-tex">`) is stored verbatim.

> The endpoint is **session-gated (403 without login)**. Provide a browser session
> via `EXAMIN8_COOKIE` + `EXAMIN8_CSRF` (same as `scripts/buildClass7.js`).

```bash
# 1) Fetch (read-only). Resume-cached; --force to re-download.
EXAMIN8_COOKIE='<cookie header>' EXAMIN8_CSRF='<token>' \
  node scripts/examin8/fetchClass10RevisionNotes.js
#    → data/examin8/class10/raw/revision-notes/chapter-<id>.json
#    → data/examin8/class10/normalized/revision-notes.json

# 2) DRY-RUN import
node scripts/examin8/importClass10RevisionNotes.js

# 3) Apply (upsert) + auto-verify Math/Real Numbers, Science, Social Science
node scripts/examin8/importClass10RevisionNotes.js --live

# verify only (read-only), any time
node scripts/examin8/importClass10RevisionNotes.js --verify
```

Logs: chapters scanned, chapters with notes, topics, cards, notes new/updated,
skipped, errors.

> Display: the client only fetches DB revision-notes when `isDbNotes` is true —
> hardcoded to Class 12 (Physics/Chem/Maths) and Class 6 in
> `src/screens/ResourcesScreen.js` (~line 1018). To make Class 10 notes render, add
> Class 10 to that gate — a one-line, data-only change (no UI redesign). Left out
> here per the "no frontend changes" rule.

## Phase 2B — Last Year Papers

Subject-level "Last Year Papers". They come from TWO examin8 endpoints:

- **List (public):** `GET /v1/content/category/{subjectCategoryId}/type/3/`
  → `previous_year_papers[]` = `{ uuid, name, year, code, set, title }` (HTML papers, incl. 2025).
- **Snapshot (session-gated, 401 without login):** `GET /v1/previous_year_question/paper/data/{uuid}/`
  → `{ name, year, code, set, has_subscription, is_solution_available, snapshot, answer_snapshot }`.
  `snapshot` = full question-paper HTML; `answer_snapshot` = solution HTML.

They map onto the **existing** `papers` table (the one Class 12 uses — see
`scripts/migratePapers.js` + `scripts/lib/papersSchema.js`). **No new tables.**
Identity = `(subject_id, class_level=10, ext_uid=uuid)`. HTML is stored **verbatim**
(`{tex}…{/tex}`, `<span class="math-tex">`, images — never stripped).

> Snapshots are **session-gated** — provide `EXAMIN8_COOKIE` + `EXAMIN8_CSRF`
> (same creds as Revision Notes). The **list is public**, so a run without creds
> still catalogues every paper's metadata; it just fetches no snapshot HTML.

```bash
# 1) Fetch. List is public; snapshots need creds. Resume-cached; --force to redo.
EXAMIN8_COOKIE='<cookie header>' EXAMIN8_CSRF='<token>' \
  node scripts/examin8/fetchClass10LastYearPapers.js
#    → data/examin8/class10/raw/last-year-papers/subject-<id>.json   (verbatim list)
#    → data/examin8/class10/raw/last-year-papers/paper-<uuid>.json   (verbatim snapshot)
#    → data/examin8/class10/normalized/last-year-papers.json          (import-ready: HTML papers)
#    → data/examin8/class10/normalized/last-year-papers-catalog.json  (every discovered paper)
#    ONLY=mathematics,science limits to matching subjects.

# 2) DRY-RUN import (reports; writes nothing)
node scripts/examin8/importClass10LastYearPapers.js

# 3) Apply (UPSERT into papers, class_level=10) + auto-verify Math 2025 / Science / Social Science
node scripts/examin8/importClass10LastYearPapers.js --live

# verify only (read-only), any time
node scripts/examin8/importClass10LastYearPapers.js --verify
```

Logs: subjects scanned, papers discovered, snapshots fetched, importable, skipped
(no snapshot / login-gated), errors. Import UPSERTs by `ext_uid` (resume-safe; no delete).

> **Display (data-only, no UI redesign):** the Class 10 "Last Year Papers" tile is
> enabled in `src/screens/ResourcesScreen.js` — `getResourceTypes` (adds the tile for
> Mathematics / Science / Social Science) and `isDbPapers` (routes them through the
> existing DB papers flow). The tapped paper resolves by `extUid` (uuid) because
> Class 10 shares `code`+`year` across Basic/Standard variants (`resourcesApi.getPaper`
> already sends `extUid`; the backend already prefers it). Same paper list/detail UI
> as Class 12 — no navigation change.

## Phase 2C — NCERT & Exemplar Solutions

Textbook solutions (book → chapters → exercise nodes → questions+solutions) from the
`/textbook` API, seeded into the EXISTING `ncert_solutions` table (className='Class 10'),
rendered by `Ncert2Screen` — same model as Class 7/8/9. Each book is its own tile+`part`:
`2`=NCERT, `3`=Exemplar, `6/7/8`=extra NCERT books of a multi-book subject (Social Science
has 4: Political Science/History/Economics/Geography). Book UUIDs are read from
`normalized/resources.json` (textbook_data) — not hardcoded. HTML/math/images verbatim.

```bash
EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/examin8/fetchClass10Ncert.js   # ONLY=/TYPE= to scope
node scripts/examin8/importClass10Ncert.js --live                          # + verify
```
Frontend: `getResourceTypes` (Class 10) NCERT_TILES → `type='ncert2'`, `part=…`. No UI change.

## Phase 2D — Important Questions & Previous Year Questions (chapter banks)

Chapter-level MCQ/subjective banks into the EXISTING sections + questions tables
(`type_key='important_questions'` / `'pyq'`), rendered via `getQuestionsByPath` +
`buildPyqDocument` in a DocWebView. chapterId = examin8 category_id from `chapters.json`.

```bash
SECTION=important_questions EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/examin8/fetchClass10Questions.js
SECTION=important_questions node scripts/examin8/importClass10Questions.js --live
SECTION=pyq                 EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/examin8/fetchClass10Questions.js
SECTION=pyq                 node scripts/examin8/importClass10Questions.js --live
```
Frontend: Class 10 tiles `type='important_questions'` / `'pyq'` (generic DB-question path
`isDbQDoc`/`dbQAvail` in ResourcesScreen). `pyq` questions carry the CBSE `years` tag.

> **Flash Cards** = **Revision Notes** (both from `/flash_card/flash_cards/…`) — already
> delivered in Phase 2A (notes table). No separate tile (would duplicate Revision Notes).
>
> **Flash Cards** = **Revision Notes** (same `/flash_card/` source; not duplicated).

## Phase 2F — Practice Questions (answer-less)

examin8's Practice bank is an adaptive attempt engine: the paginated list
(`GET /v1/practice/question/category/{chapterId}/paginate/?limit&offset`) exposes the
question + options but NO correct answer/solution — those appear only when each question
is SUBMITTED (`/practice/attempted/`), which is account-mutating and, in bulk, thousands
of writes. We do NOT harvest answers that way.

Practice is imported ANSWER-LESS into the EXISTING sections+questions tables
(type_key='practice'): question HTML, options, images, math, ordering — verbatim — with
`correct_option=null` and every option `is_correct=false` (never faked). The app shows them
read-only via the same `isDbQDoc` DocWebView path (Important Qs / PYQ); scoring is disabled.

```bash
EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/examin8/fetchClass10Practice.js   # read-only paginate
SECTION=practice node scripts/examin8/importClass10Questions.js --live
```
Frontend: Class 10 tile `type='practice'` (already in ResourcesScreen's DBQ_TYPES).

## Phase 2E — Mock Tests

examin8 serves mock tests through an interactive attempt flow; correct answers +
explanations are only exposed by the RESULT of a completed attempt:
  list   : GET  /v1/mock-test/category/{subjectCategoryId}/
  start  : POST /v1/mock-test/testpaper/{id}/start/   (creates the attempt)
  result : GET  /v1/mock-test/testpaper/{id}/result/  (question, options[is_correct], explanation)

The fetch script does list → (result? use it : start → wait ~3s → result), creating
one attempt per test on the logged-in account. Imports into the EXISTING
`mock_tests` + `mock_test_questions` tables (the same ones Class 11/12 use), with:
  • class_level = 10   (the live-DB discriminator the mock service filters on)
  • test id     = 100_000_000 + examin8 testPaperID   (disjoint from existing ids)
HTML/math/images/options/explanations preserved verbatim (McqTestScreen renders via MathText).

```bash
EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/examin8/fetchClass10MockTests.js
node scripts/examin8/importClass10MockTests.js --live   # + verify (ordering, correct_index, sections, math)
```
Frontend: PracticeScreen `MOCK_SUBJECTS_CLASS10` (Science/Maths/Social Science) shown
when `selectedClass==='Class 10'`; Science/Social Science added to `DB_MOCK_SUBJECTS`.

## Phase 2 — actual content (per detected type)

Not built yet. `normalized/resources.json` already lists each subject's available content
types (NCERT, Exemplar, Important/Practice/PYQ, Online/Mock tests, Flash Cards, Sample/Test
Papers, Case Study, …) with their `content_id`/`textbook_data` UUIDs. Phase 2 fetches those
into the existing tables (`questions`/`sections`, `ncert_solutions`, `exemplar_solutions`,
`mock_tests`) reusing the Class 7 / Maths 12 scripts as templates. The deeper item endpoints
need `EXAMIN8_COOKIE` and `EXAMIN8_CSRF`.
