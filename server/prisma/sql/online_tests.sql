-- ─── Online Tests (Practice → Online Tests) ──────────────────────────────────
-- Idempotent. Safe to re-run; does NOT touch any other table. Apply with:
--   npm run db:online:setup   (runs scripts/seed-online-tests.js, which runs this first)
--
-- Managed by raw SQL (NOT Prisma migrations) — like mock_tests / the pgvector
-- tables — so `prisma migrate`/`db push` is never required.
--
-- Model: one row per TEST PAPER (chapter is a column → the chapter list is
-- derived with GROUP BY chapter_id, exactly like mock_tests derives sections).
-- Scoring stays client-side (correctAnswer letter is returned per question), so
-- there is no attempts table.

CREATE TABLE IF NOT EXISTS online_tests (
  id                  integer PRIMARY KEY,            -- source testPaperID (stable, unique)
  subject             text    NOT NULL,               -- 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'
  chapter_id          integer NOT NULL,               -- source chapter id (e.g. 1342)
  chapter_name        text    NOT NULL,               -- e.g. "Units and Measurements"
  name                text    NOT NULL,               -- testPaperName, e.g. "Units and Measurements Test 01"
  category_full_name  text,
  no_of_questions     integer,
  question_count      integer NOT NULL DEFAULT 0,
  source_extracted_at text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS online_tests_subject_chapter_idx ON online_tests (subject, chapter_id);

-- Source questionID is unique only WITHIN a test (it repeats across tests), so the
-- primary key is the composite (test_id, id) — same as mock_test_questions.
CREATE TABLE IF NOT EXISTS online_test_questions (
  id                 integer NOT NULL,                -- source questionID (unique within a test)
  test_id            integer NOT NULL REFERENCES online_tests(id) ON DELETE CASCADE,
  order_index        integer NOT NULL,                -- position within the test
  section_name       text,                            -- usually "General"
  question           text    NOT NULL,                -- plain text
  question_raw       text,                            -- original HTML (preserved)
  options            jsonb   NOT NULL,                -- [{ id, text, is_correct }] in display order
  correct_index      integer,                         -- 0-based index of the correct option
  explanation        text,
  PRIMARY KEY (test_id, id)
);

-- Idempotent migration: if an older install used PRIMARY KEY (id) only, switch it
-- to the composite (test_id, id). Safe to re-run.
ALTER TABLE online_test_questions DROP CONSTRAINT IF EXISTS online_test_questions_pkey;
ALTER TABLE online_test_questions ADD CONSTRAINT online_test_questions_pkey PRIMARY KEY (test_id, id);

CREATE INDEX IF NOT EXISTS online_test_questions_test_idx ON online_test_questions (test_id, order_index);
