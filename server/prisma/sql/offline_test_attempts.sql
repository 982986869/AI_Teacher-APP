-- Offline-bank online tests — additive & idempotent (safe to re-run).
--
-- Classes 10/11/12 (and Class 12 biology) take their online tests from question
-- banks bundled inside the app, not from ot_tests. Those attempts were only ever
-- written to AsyncStorage, so a parent could never see them. These two tables are
-- the server-side record.
--
-- Two tables rather than one because the two problems are different:
--   offline_answer_keys   — id -> correct option, so the SERVER can grade. The
--                           question text stays bundled in the app (the bank is
--                           offline-first), only the key is mirrored here.
--   offline_test_attempts — the attempt itself. It cannot reuse ot_attempts because
--                           these "tests" are composed on the client at runtime
--                           (a chapter is split into N tests), so there is no
--                           server-side test row to reference.
--
-- Nothing existing is altered or dropped.
-- To undo: DROP TABLE IF EXISTS offline_test_attempts, offline_answer_keys;

CREATE TABLE IF NOT EXISTS offline_answer_keys (
  question_id       bigint PRIMARY KEY,
  correct_option_id bigint,
  correct_answer    text,      -- letter form (A/B/C/D) when that is all we have
  subject           text,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offline_test_attempts (
  id             bigserial PRIMARY KEY,
  user_id        uuid,
  class_level    integer,
  subject        text,
  chapter        text,
  test_label     text,
  answers        jsonb   NOT NULL DEFAULT '{}',
  total          integer NOT NULL DEFAULT 0,
  attempted      integer NOT NULL DEFAULT 0,
  correct_count  integer NOT NULL DEFAULT 0,
  wrong_count    integer NOT NULL DEFAULT 0,
  -- How many of the attempted questions we actually held a key for. When this is 0
  -- the score is meaningless (biology ships with no answer key at all), and the
  -- parent view says so instead of showing a fake 0/N.
  graded_count   integer NOT NULL DEFAULT 0,
  time_taken_sec integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- The parent day-view reads by user and date.
CREATE INDEX IF NOT EXISTS offline_attempts_user_idx
  ON offline_test_attempts (user_id, created_at DESC);
