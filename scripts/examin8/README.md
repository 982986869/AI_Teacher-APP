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

## Phase 2 — actual content (per detected type)

Not built yet. `normalized/resources.json` already lists each subject's available content
types (NCERT, Exemplar, Important/Practice/PYQ, Online/Mock tests, Flash Cards, Sample/Test
Papers, Case Study, …) with their `content_id`/`textbook_data` UUIDs. Phase 2 fetches those
into the existing tables (`questions`/`sections`, `ncert_solutions`, `exemplar_solutions`,
`mock_tests`) reusing the Class 7 / Maths 12 scripts as templates. The deeper item endpoints
need `EXAMIN8_COOKIE` and `EXAMIN8_CSRF`.
