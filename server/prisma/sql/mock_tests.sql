-- ─── Mock tests (e.g. Physics) ────────────────────────────────────────────────
-- Idempotent. Safe to re-run; does NOT touch any other table. Apply with either:
--   psql "$DATABASE_URL" -f prisma/sql/mock_tests.sql
--   npm run db:mock:setup   (runs scripts/seed-physics-mock-tests.js, which runs this first)
--
-- Managed by raw SQL (NOT Prisma migrations) — like the pgvector tables — so
-- `prisma migrate`/`db push` is never required and the database is never reset.

CREATE TABLE IF NOT EXISTS mock_tests (
  id                  integer PRIMARY KEY,            -- source testPaperID
  subject             text    NOT NULL DEFAULT 'Physics',
  name                text    NOT NULL,               -- testPaperName, e.g. "Mock Test - 01"
  category_full_name  text,
  duration_min        integer,
  no_of_questions     integer,
  instruction         text,
  section_count       integer NOT NULL DEFAULT 0,
  question_count      integer NOT NULL DEFAULT 0,
  source_extracted_at text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Source questionID is unique only WITHIN a test (some datasets, e.g. Chemistry,
-- reuse the same question id across different tests), so the primary key is the
-- composite (test_id, id).
CREATE TABLE IF NOT EXISTS mock_test_questions (
  id                   integer NOT NULL,              -- source questionID (unique within a test)
  test_id              integer NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  order_index          integer NOT NULL,              -- position within the test (across sections)
  section_name         text,
  section_id           integer,
  question             text    NOT NULL,              -- plain text
  question_raw         text,                          -- original HTML (preserved exactly)
  options              jsonb   NOT NULL,              -- [{ id, text, is_correct }]
  correct_option_ids   jsonb   NOT NULL DEFAULT '[]',
  correct_option_texts jsonb   NOT NULL DEFAULT '[]',
  correct_index        integer,                       -- index of the correct option within `options`
  explanation          text,
  PRIMARY KEY (test_id, id)
);

-- Idempotent migration: if an older install used PRIMARY KEY (id) only, switch it
-- to the composite (test_id, id). Safe to re-run (drop-if-exists then add).
ALTER TABLE mock_test_questions DROP CONSTRAINT IF EXISTS mock_test_questions_pkey;
ALTER TABLE mock_test_questions ADD CONSTRAINT mock_test_questions_pkey PRIMARY KEY (test_id, id);

CREATE INDEX IF NOT EXISTS mock_test_questions_test_idx ON mock_test_questions (test_id, order_index);

CREATE TABLE IF NOT EXISTS mock_test_attempts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid,
  test_id       integer NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  answers       jsonb   NOT NULL DEFAULT '{}',
  total         integer NOT NULL DEFAULT 0,
  attempted     integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  wrong_count   integer NOT NULL DEFAULT 0,
  score         integer NOT NULL DEFAULT 0,
  time_taken_sec integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mock_test_attempts_user_idx ON mock_test_attempts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mock_test_attempts_test_idx ON mock_test_attempts (test_id);
