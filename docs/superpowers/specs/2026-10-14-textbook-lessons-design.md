# Textbook lessons: the AI Teacher teaches from the NCERT book

**Date:** 2026-10-14 · **Branch:** `feat/textbook-lessons` · **Status:** implemented locally on feat/textbook-lessons (plan: `docs/superpowers/plans/2026-10-14-textbook-lessons.md`); AWS steps in §12 pending

## 1. Goal

A student opens the AI Teacher, picks their class's textbook, picks a chapter, and either:

- hears a **spoken chapter summary** lesson, or
- ticks **1–3 topics** (the book's own numbered sections) and hears a lesson built from
  those sections' actual text.

Both play in the existing live-class player (`LiveTeachingPlayer`: whiteboard, ElevenLabs
voice, captions, checks, doubts). Lessons must be faithful to the book: NCERT's terms,
examples, numbering and depth.

**v1 scope:** Class 10, NCERT, English medium, **Science (13 chapters) + Mathematics
(14 chapters)**. Other Class 10 subjects (SST, English) and other classes use the same
pipeline later; only the manifest changes.

**Out of scope (v1):** mind maps, quizzes/PYQ per chapter, Hindi medium, admin upload of
new books, diagrams lifted from the PDF (the board redraws its own).

## 2. What exists today (and is reused unchanged)

| Piece | Where | Reused as-is? |
|---|---|---|
| Lesson JSON contract (7–10 slides, `visualType`, `visualData`, `check`, `reteach`) | `server/src/prompts/lessonGeneration.prompt.js` | yes, output shape unchanged |
| Generation + validation | `services/ai.service.js generateLesson`, `providers/ai/AnthropicProvider.js` | extended, not replaced |
| Lesson/Slide persistence, progress, doubts | `services/lesson.service.js`, `/api/ai/lesson/:id/*` | yes |
| Player: board, voice, captions, checks, voice doubts | `src/components/teacher/LiveTeachingPlayer.js` | yes, untouched |
| Student's class | `req.scope.classNum` (server), `scope.classNum` (app) | yes |
| PDF text → chunks → pgvector (Voyage) | `services/knowledge.service.js`, `knowledge_chunks` | reused for doubt grounding |
| AI Teacher home (state machine inside `HomeScreen` → `AITeacherScreen`) | `src/screens/AITeacherScreen.js`, `screens/aiteacher/*` | new sub-views added |

**Gaps this design fills:** no table holds book text; the lesson prompt never sees the
book (topic + grade only); no summary mode; no caching (every student pays a full
Opus generation, 30–90 s); the AI Teacher's subject list is hardcoded.

## 3. Source material (verified 2026-10-14)

NCERT serves every chapter as its own PDF:

```
https://ncert.nic.in/textbook/pdf/{code}{NN}.pdf     chapter NN (01, 02 …)
https://ncert.nic.in/textbook/pdf/{code}ps.pdf       prelims: cover + contents
```

`code` = class letter + language + subject + part: `jesc1` = Class 10 (j), English (e),
Science (sc), part 1; `jemh1` = Class 10 Maths. Probed: `jesc101…113` exist, `114` is 404;
`jemh101…114` exist, `115` is 404. Current (rationalised 2023-24) edition.

Extraction probe with PyMuPDF on Class 11 samples (same typesetting as Class 10):

- Maths chapter: 23 pages, ~45k chars (~11k tokens); 11 numbered sections; headings found
  cleanly by the `N.N Title` pattern.
- Physics/Science chapter: two-column; `page.get_text(sort=True)` yields readable column
  order; the real headings are **bold + `N.N`**, which separates them from formula lines
  (`1.2 g cm-3`) that a bare regex mistakes for headings.
- Superscripts flatten (`7.203)2 m2`), Greek/∈/× survive as Unicode. Acceptable: Claude
  reads it correctly and never shows the raw text to the student.
- A whole chapter fits in one model call with room to spare.

Copyright note: NCERT holds copyright on the books. The product uses the text to generate
original spoken lessons and never displays the book text itself. Flagged to the owner;
not a technical blocker.

## 4. Architecture

```
ncert.nic.in ──download.js──▶ server/data/textbooks/pdf/*.pdf   (git-ignored)
                                      │
                               extract.py (PyMuPDF, offline)
                                      ▼
                     server/data/textbooks/class10/<code>/chNN.raw.json
                                      │
                               outline.js (Claude Sonnet verifies headings, slices text)
                                      ▼
                     server/data/textbooks/class10/<code>/chNN.json   (committed)
                                      │
                 seed-textbooks.js ──▶ books / book_chapters / book_topics   (Postgres)
                 embed-textbooks.js ─▶ knowledge_sources / knowledge_chunks (pgvector)

App: AI Teacher home ─▶ Books grid ─▶ Chapter list ─▶ Chapter page
      (Summary | tick 1–3 topics) ─▶ POST /api/ai/lesson/generate {source}
                                          │
                     ai.service.generateLesson: load topic text ─▶ book_lessons cache?
                       hit  → copy cached JSON into the student's lessons/slides
                       miss → Anthropic (prompt-cached system + SOURCE block) → validate
                              → store in book_lessons → copy to student's lessons/slides
                                          │
                                 LiveTeachingPlayer (unchanged)
```

Python is used only by the offline extraction step on a developer machine. The server
and AWS never need Python; the committed JSON is the hand-off.

## 5. Content pipeline (`server/scripts/textbooks/`)

### 5.1 `books.json` manifest

```json
[
  { "code": "jesc1", "classLevel": 10, "subject": "Science",     "subjectSlug": "science",
    "title": "Science",      "publisher": "NCERT", "edition": "2023-24", "language": "en", "chapters": 13 },
  { "code": "jemh1", "classLevel": 10, "subject": "Mathematics", "subjectSlug": "mathematics",
    "title": "Mathematics",  "publisher": "NCERT", "edition": "2023-24", "language": "en", "chapters": 14 }
]
```

`subject` uses the canonical names the retriever already expects (`Mathematics`, not
`Maths`); `subjectSlug` matches `subjects.slug` where one exists.

### 5.2 `download.js` (Node)

For each book: prelims + chapters `01..N` → `server/data/textbooks/pdf/<code>NN.pdf`.
Skips files already present; 3 retries with backoff; fails loudly on a 404 inside the
declared range (manifest wrong) or a non-PDF body (NCERT occasionally serves HTML).

### 5.3 `extract.py` (Python 3.12 + PyMuPDF, offline)

Per chapter PDF → `chNN.raw.json`:

- `pages[]`: text per page via `get_text("dict")`, lines kept with `{text, size, bold, y}`;
  reading order from `sort=True`.
- Drops running headers/footers: the first/last line of a page when it is a bare page
  number or the book/chapter name in caps.
- `headingCandidates[]`: lines matching `^\d+\.\d+(\.\d+)?\s+\S` that are bold **or** at
  least 1 pt larger than the body size (mode of span sizes), with `{page, line, text}`.
- `chapterTitle`: the largest-font line on page 1 after the "Chapter N" line.
- `endMarkers[]`: pages/lines where `Summary`, `What you have learnt`, `Exercises`,
  `EXERCISE N.N`, `Points to Ponder`, `Historical Note` start.
- Cover: prelims page 1 rendered at 2× to `server/public/books/<code>.png` (~300 px wide).

Pure extraction, no judgement; deterministic, so it is re-runnable.

### 5.4 `outline.js` (Node, Claude Sonnet 5.5 via the existing provider)

Per chapter: sends the heading candidates + end markers + a 40-char context snippet
around each candidate (not the whole chapter) and asks for the verified outline as JSON:

```json
{ "chapterNumber": 7, "title": "Binomial Theorem",
  "topics": [ { "number": "7.1", "title": "Introduction", "startPage": 0, "startLine": 12 }, … ],
  "bodyEndsAt": { "page": 21, "line": 3 } }
```

Rules given to the model: keep NCERT's numbering; fold `N.N.M` sub-sections into their
parent `N.N`; drop "Introduction" only if it is under 400 chars (else keep it); stop at
the first of Summary / What you have learnt / Exercises; in-chapter `EXERCISE N.N`
blocks inside Maths are **cut out** of topic text (they are question lists, not
teaching). The script then slices the raw page text between consecutive starts, applies
the cuts, normalises whitespace, and writes `chNN.json`:

```json
{ "code": "jemh1", "chapterNumber": 7, "title": "Binomial Theorem", "slug": "binomial-theorem",
  "pageCount": 23, "sourceUrl": "https://ncert.nic.in/textbook/pdf/jemh107.pdf",
  "topics": [
    { "number": "7.1", "title": "Introduction", "slug": "7-1-introduction",
      "text": "…", "charCount": 1860 },
    …
  ] }
```

`chNN.json` is committed. The raw file and PDFs are git-ignored. One-time model cost is
a few rupees per chapter. Every chapter's topic list is read by a human before seeding
(27 lists; takes under an hour) — the script prints a review table.

Known limitations, accepted for v1: tables flatten to lines; figure captions stay in
the text ("Fig. 7.2 …") and are harmless; in-text activities ("Activity 1.3") stay in
the topic text (they are teaching content in Science).

### 5.5 `seed-textbooks.js` and `embed-textbooks.js` (Node)

- `seed-textbooks.js [--book jemh1]`: upserts `books` (by `code`), `book_chapters`
  (by `book_id, number`), `book_topics` (by `chapter_id, number`). Topics removed from a
  JSON are deleted. Re-runnable.
- `embed-textbooks.js [--book jemh1]`: one `knowledge_sources` row per book
  (`title: "NCERT Class 10 Mathematics"`, `type: 'textbook'`, `subject`, `gradeLevel:
  'Class 10'`, owner = oldest admin/teacher user, as `ingest-curriculum.js` does),
  deleting and rebuilding the previous one by title. Each topic is chunked with the
  existing `chunkText` (1500/200) and inserted with `metadata: {type:'textbook', book,
  chapterNumber, chapterTitle, topicNumber, topicTitle, topicId}`. Batches of 96 through
  Voyage.

## 6. Database

New SQL file `server/prisma/sql/textbooks.sql` (idempotent, `CREATE TABLE IF NOT
EXISTS`, header says how to apply) **and** matching models in `schema.prisma`,
following the project's convention of hand-run SQL files. Nothing uses `prisma migrate`.

```sql
CREATE TABLE IF NOT EXISTS books (
  id           BIGSERIAL PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,            -- jemh1
  class_level  INT  NOT NULL,                   -- 10
  subject      TEXT NOT NULL,                   -- Mathematics (canonical)
  subject_slug TEXT NOT NULL,                   -- mathematics
  title        TEXT NOT NULL,
  publisher    TEXT NOT NULL DEFAULT 'NCERT',
  edition      TEXT NOT NULL,                   -- 2023-24
  language     TEXT NOT NULL DEFAULT 'en',
  cover_url    TEXT,                            -- /books/jemh1.png
  position     INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
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
  number      TEXT NOT NULL,                    -- "7.3"
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  position    INT  NOT NULL,
  text        TEXT NOT NULL,
  char_count  INT  NOT NULL,
  UNIQUE (chapter_id, number)
);
-- Generated lessons shared across students. One row per distinct request shape.
CREATE TABLE IF NOT EXISTS book_lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key        TEXT NOT NULL UNIQUE,        -- sha1 of the key fields below
  chapter_id       BIGINT NOT NULL REFERENCES book_chapters(id) ON DELETE CASCADE,
  kind             TEXT NOT NULL,               -- 'summary' | 'topics'
  topic_ids        BIGINT[] NOT NULL DEFAULT '{}',
  grade_level      TEXT NOT NULL,
  teaching_mode    TEXT NOT NULL,
  explanation_style TEXT NOT NULL DEFAULT 'balanced',
  prompt_version   INT  NOT NULL,
  payload          JSONB NOT NULL,              -- validated lesson JSON (post-normalise)
  generation_model TEXT,
  generation_time_ms INT,
  hits             INT  NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_chapter_id BIGINT REFERENCES book_chapters(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_topic_ids  BIGINT[] NOT NULL DEFAULT '{}';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_lesson_id  UUID REFERENCES book_lessons(id) ON DELETE SET NULL;
```

`lessons.chapter` (text, used by progress roll-ups) is set to the book chapter's title for
book lessons, so existing chapter progress keeps working without `tagLessonChapter`.

## 7. Server API

All under `authenticate`. Class always comes from `req.scope.classNum`; the client never
sends it. Responses use `ApiResponse.success`.

| Route | Returns |
|---|---|
| `GET /api/books?subject=` | `[{id, code, title, subject, subjectSlug, coverUrl, edition, chapterCount}]` for the student's class, ordered by `position`. Empty array (not 404) when the class has no books → the app hides the card. |
| `GET /api/books/:bookId/chapters` | `{book, chapters:[{id, number, title, topicCount}]}` |
| `GET /api/books/chapters/:chapterId` | `{book:{…}, chapter:{id, number, title}, topics:[{id, number, title, charCount}]}` — titles only, never the text. |
| `POST /api/ai/lesson/generate` (existing) | body gains optional `source: { chapterId: number, kind: 'summary' } \| { chapterId, kind: 'topics', topicIds: number[] (1–3) }`. `topic` becomes optional when `source` is present (the server derives it: chapter title, or "7.3 General and Middle Terms"). |

Validation (express-validator, in `routes/ai.js`): `source.kind` ∈ {summary, topics};
`topicIds` 1–3 integers, must all belong to `chapterId`; the chapter's book must be the
student's class (403 otherwise, `OUT_OF_SCOPE`). Files: `routes/books.js`,
`controllers/books.controller.js`, `services/books.service.js`.

## 8. Grounded generation

### 8.1 Prompt

`buildLessonUserPrompt(topic, subject, gradeLevel, profile, source?)`. When `source` is
given, the prompt gets, after the existing lines:

```
SOURCE MATERIAL — NCERT Class 10 Mathematics, Chapter 7 "Binomial Theorem",
section(s) 7.2, 7.3 (this is the student's own textbook; it is authoritative):
<<<
[7.2 Binomial Theorem for Positive Integral Indices]
…verbatim topic text…
[7.3 General and Middle Terms]
…
>>>
TEACH FROM THE SOURCE: use its definitions, notation, worked examples and numbering;
when you add an analogy or extra example say so briefly ("here's one more…");
do not introduce results the source does not contain; refer to sections by number
("as 7.3 says…") so the student can follow in the book. If the source text is garbled
by PDF extraction (lost superscripts, joined words), read through it — never repeat the
garbling.
```

For `kind: 'summary'` the source is the whole chapter (all topics concatenated) plus:

```
LESSON KIND — CHAPTER SUMMARY: this is a spoken overview of the WHOLE chapter in 8–10
slides: one slide per major section (merge small ones), each stating the section's key
idea, its one must-know formula/definition, and one line on why it matters for the exam.
End with a "what to revise" slide listing the sections. Do not go deep on any one
section.
```

Depth still follows `levelGuidance` (Class 10 = board-exam language). The system prompt
is unchanged except for one line in the OUTPUT CONTRACT noting that the SOURCE block, when
present, is authoritative. `PROMPT_VERSION = 1` is exported and stored on cache rows so
a prompt change invalidates old cached lessons automatically.

### 8.2 Anthropic call

`_createLessonMessage` passes the system prompt and the SOURCE block with
`cache_control: {type: 'ephemeral'}` (system as a content array; the source as the first
user content block, the per-student lines as the second). Same chapter → cached input
across students. `max_tokens` and thinking settings unchanged. Input per request:
system (~3k) + source (≤ ~12k for a whole chapter) + ~0.5k — well inside limits.

### 8.3 `generateLesson` flow with `source`

1. Validate scope and load the chapter + topic rows (`books.service.loadSource`).
2. Build `cacheKey = sha1(chapterId | kind | sorted topicIds | gradeLevel | resolvedMode
   | explanationStyle | PROMPT_VERSION)`.
3. **Hit:** `payload = row.payload`, increment `hits`, `generationModel = 'cache:' +
   row.generation_model`, `generationTimeMs ≈ 0`.
4. **Miss:** call the provider with `source`; validate as today; insert the `book_lessons`
   row (`ON CONFLICT (cache_key) DO NOTHING`, then re-select, so two students generating
   the same lesson at once end up sharing one row).
5. Either way: `updateLessonWithContent` into the student's own `lessons`/`slides`
   (unchanged function), set `book_chapter_id`, `book_topic_ids`, `book_lesson_id`,
   `chapter = chapterTitle`. Skip `tagLessonChapter`.
6. Return as today, plus `source: {book, chapter, topics}` so the player header can say
   "Ch. 7 · 7.2, 7.3".

**Personalisation trade-off (agreed):** the cache key keeps teaching mode and explanation
style but not the learner's mastery profile; `learnerLine` is omitted from book lessons so
a cached lesson is the same for every student with that mode/style. Checks, re-teach and
doubts remain fully personal because they run live.

`MOCK_AI=true` path: `buildMockLesson` is called with the derived topic; the cache is
exercised the same way, so the whole flow is testable without a key.

### 8.4 Doubts during a book lesson

`answerDoubt`: if the lesson has `book_topic_ids`, load those topics' text (or the whole
chapter for summaries, capped at ~12k tokens) and pass it to the provider as an extra
`sourceText` argument; `buildDoubtMessages` appends it as "the student's textbook says…".
Falls back to today's behaviour when absent. The vector chunks from §5.5 serve the
free-form "Ask" screen (they are in the same `knowledge_chunks` table with subject +
`gradeLevel: 'Class 10'`, so `retrieve` finds them with no change).

## 9. App

### 9.1 Flow (all inside `AITeacherScreen`, following its existing `view` state pattern)

```
AITeacherHome
  └─ new card "Learn from your textbook" (hidden when GET /api/books is empty)
        ▼ view: 'books'
BookGrid            grade label from scope · subject chips (All / Science / Maths)
                    2-column cover cards "Mathematics · 14 chapters"
        ▼ view: 'chapters'
ChapterList         "Ch. 7  Binomial Theorem"  rows
        ▼ view: 'chapter'
ChapterTopics       header: book · chapter
                    [▶ Chapter summary — ~6 min]            (primary button)
                    "Or pick what to learn (up to 3)"
                    ☐ 7.1 Introduction
                    ☑ 7.2 Binomial Theorem for Positive…
                    ☑ 7.3 General and Middle Terms
                    [Teach me 7.2, 7.3 →]                   (sticky bottom CTA)
        ▼ existing GeneratingOverlay (copy: "Reading Chapter 7 · Binomial Theorem…")
LiveTeachingPlayer  unchanged; header subtitle "NCERT Ch. 7 · 7.2, 7.3"
```

Back from any sub-view returns one step. The existing teaching-style pills on the home
screen still apply (`teachMode` is sent as today). Selecting a 4th topic shows a toast
"Pick up to 3, or play the chapter summary".

### 9.2 Files

- `src/api/booksApi.js` — `getBooks`, `getChapters(bookId)`, `getChapter(chapterId)`.
- `src/screens/aiteacher/books/BookGrid.js`, `ChapterList.js`, `ChapterTopics.js`,
  `TextbookCard.js` (home card). AIT tokens (`theme/aiTeacherTheme.js`), Inter, white
  surface, amber accent — matching the AI Teacher home, not the dark reference app.
- `AITeacherScreen.js` — `view` gains `'books' | 'chapters' | 'chapter'`; `handleGenerate`
  accepts `{source}` and passes it through `generateLesson` in `aiApi.js`; `topic` is
  derived for display.
- `AITeacherHome.js` — renders `TextbookCard` after the action cards when books exist.

Loading, empty and error states on each sub-view use the same primitives as `MyLessons`.

## 10. Error handling

| Case | Behaviour |
|---|---|
| Chapter not in student's class | 403 `OUT_OF_SCOPE`; app shows "This book isn't part of your class" |
| Topic ids not all in the chapter / > 3 | 422 validation message |
| Provider failure on a miss | existing `markLessonFailed` + rethrow; no cache row written |
| Cache row has stale `prompt_version` | treated as a miss (key includes the version) |
| Topic text empty (bad extraction) | seed script refuses the chapter; API never exposes an empty topic |
| Books table missing in an environment (SQL not run) | `GET /api/books` returns `[]` and logs once; home card hidden — no 500 |

## 11. Testing

Server (`node --test tests/*.test.js`, existing runner):

- `textbooks.outline.test.js`: slicing topic text between anchors; exercise cuts;
  sub-section folding; refuses empty topics.
- `books.service.test.js`: scope check, `loadSource` for summary and topics, cache key
  stability (order-independent topic ids, version bump changes key).
- `lesson.source.test.js` (`MOCK_AI=true`): generate with `source` → lesson rows carry
  `book_chapter_id/topic_ids`; second identical call hits the cache (`generationModel`
  starts with `cache:`), different mode misses; `topic` derived when absent.
- `lessonPrompt.test.js`: SOURCE block present/absent; summary kind adds the summary
  guidance; `learnerLine` omitted when source is present.
- `books.routes.test.js`: validation and 403.

Content QA (manual, recorded in the plan): all 27 topic lists reviewed; 6 real lessons
generated (3 Science, 3 Maths: one summary + two topic lessons each) and read against the
book for fidelity before the feature is called done.

App: run on a device/emulator against the local server; walk the full flow; verify the
player plays a cached lesson identically to a fresh one.

## 12. Deployment (AWS)

1. Run `prisma/sql/textbooks.sql` on the production database by hand (project
   convention; the app serves `[]` for books until this is done).
2. Confirm `CREATE EXTENSION vector` exists there (already required by Ask the Material).
3. Deploy the server (the committed `server/data/textbooks/**/chNN.json` and
   `server/public/books/*.png` ship with the code; `server/public` is already served
   statically).
4. On the server box: `node scripts/textbooks/seed-textbooks.js` then
   `node scripts/textbooks/embed-textbooks.js` (needs `VOYAGE_API_KEY`).
5. Raise the reverse-proxy/ALB idle timeout to ≥ 180 s — a first-time (uncached) lesson
   takes 30–90 s and the app waits 120 s. Cached lessons return in about a second.

No Python on the server; no new env vars.

Checklist for the AWS deploy (tick when done):
- [ ] `prisma/sql/textbooks.sql` run on the production DB (`npx prisma db execute --file prisma/sql/textbooks.sql --schema prisma/schema.prisma`)
- [ ] `CREATE EXTENSION IF NOT EXISTS vector` confirmed on that DB
- [ ] server deployed from feat/textbook-lessons (or main after merge) and `npx prisma generate` ran as part of the build
- [ ] `node scripts/textbooks/seed-textbooks.js` run on the server (reads the committed `data/textbooks/class10/**`)
- [ ] `node scripts/textbooks/embed-textbooks.js` run on the server (needs `VOYAGE_API_KEY`)
- [ ] reverse proxy / ALB idle timeout ≥ 180 s (a first-time lesson takes 30–90 s; the app waits 120 s)
- [ ] `ALLOWED_ORIGINS` includes any web origin that will call the API (native builds are unaffected)
- [ ] `GET /api/books` from a Class 10 account returns 2 books; one real lesson generated and played on a device

## 14. Fidelity review (2026-10-14, local, `AI_LESSON_MODEL=claude-haiku-4-5`)

Six real lessons generated through `scripts/textbooks/e2e-book-lesson.js` and read against
the chapter PDFs. Every one re-requested → served from `book_lessons` in ≈100 ms.

| Lesson | Verdict |
|---|---|
| Maths Ch. 7, §7.2 + 7.3 | Faithful: the book's A(4,0)/B(6,0), P(4,6)/Q(6,8), Example 1 P(3,2)/Q(−2,−3) → √50, similar-triangle derivation with m₁:m₂, Example 6 → (7,3), midpoint case. |
| Maths Ch. 1, summary | Faithful: Theorem 1.1/1.2 and Examples 1–7 cited by number; "what to revise" slide lists the sections. |
| Maths Ch. 4, §4.2 | Faithful: marbles (x²−45x+324=0) and toys (55−x, 750) examples, Example 2 (x+2)³ = x³−4. One slide title said "Examples from the Source" → prompt now forbids the word "source" to students; `PROMPT_VERSION` 1 → 2. |
| Science Ch. 1, §1.1 + 1.2 | First attempt: model returned malformed JSON (one-off; the app shows "try again"). Retry: faithful — writing, balancing, state symbols, the five reaction types. |
| Science Ch. 10, summary | Faithful: all six sections covered; 10.4/10.5 merged into one slide, as the summary rules allow. |
| Science Ch. 6, §6.3 | Faithful: hormones, adrenaline/thyroxine/growth hormone/insulin, feedback. |

Prompt caching verified from `usage`: first call on a chapter `cache_creation_input_tokens`
= system + source (4.7k–9.2k); a repeat within 5 min with a different teaching mode
`cache_read_input_tokens` = the same number, `cache_creation` 0. Haiku's minimum cacheable
prefix is 2048 tokens, so on that model the system prompt alone does not cache across
chapters; Opus/Sonnet (1024) do.

Known limitation: a malformed-JSON response is not retried automatically; the student sees
the error card and taps Retry (a second attempt costs no DB-cache state).

## 13. Decisions log

| # | Decision |
|---|---|
| 1 | Class 10 NCERT English, Science + Mathematics first (owner's choice 2026-10-14). |
| 2 | Topics = NCERT numbered sections; `N.N.M` folded into `N.N`; exercises/summary excluded from topic text. |
| 3 | 1–3 topics per lesson; whole chapter = summary lesson. |
| 4 | Ground by injecting full topic text (no retrieval); vector chunks only for doubts/Ask. |
| 5 | Shared `book_lessons` cache; mastery personalisation dropped for cached book lessons. |
| 6 | Python + PyMuPDF offline for extraction; JSON committed; Node for everything else. |
| 7 | Sonnet verifies outlines; a human reviews every topic list before seeding. |
| 8 | Covers rendered from the prelims PDF page 1. |
| 9 | Sub-views inside `AITeacherScreen`, AIT light theme. |
| 10 | Anthropic prompt caching on system + source block. |
| 11 | Worktree `textbook-lessons-wt`, branch `feat/textbook-lessons` from `main`. |
| 12 | Hand-run `prisma/sql/textbooks.sql` + `schema.prisma` models. |
