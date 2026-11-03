-- Where a question's correct answer came from. Additive & idempotent (safe to re-run).
--
-- Class 10 Practice questions were imported from examin8 ANSWER-LESS: that API only
-- reveals the key when a question is submitted on a real account, so every row landed
-- with correct_option = null and every option is_correct = false. 16,251 questions the
-- student could read but never answer.
--
-- Filling those in from a model makes the app able to grade practice, but it also puts
-- two very different things in the same column: a key examin8 published, and a key we
-- inferred. Without a marker they are indistinguishable the moment this script ends —
-- so a wrong AI answer could never be found again, and re-importing real keys later
-- could not tell which rows it was safe to overwrite.
--
-- Hence this column rather than a quiet backfill:
--   null        — came with the import (examin8's own key), or no answer at all
--   'ai:<model>' — inferred, e.g. 'ai:claude-opus-5-5'
--   'manual'    — a human corrected it
--
-- answer_checked_at is when it was last written, so a later model pass can re-check
-- the oldest rows first instead of re-spending on all of them.
--
-- The partial index serves the only hot query this adds: "which questions still need
-- an answer" — ~16k rows now, ~0 once backfilled, so a full index would be waste.
--
-- To undo:
--   DROP INDEX IF EXISTS questions_needs_answer_idx;
--   ALTER TABLE questions DROP COLUMN IF EXISTS answer_source, DROP COLUMN IF EXISTS answer_checked_at;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS answer_source     text,
  ADD COLUMN IF NOT EXISTS answer_checked_at timestamptz;

-- MCQs that still have no key — what the backfill script selects on.
CREATE INDEX IF NOT EXISTS questions_needs_answer_idx
  ON questions (section_id)
  WHERE correct_option IS NULL AND is_mcq = true;

-- Finding AI-answered rows again (review queues, re-checks, bulk revert).
CREATE INDEX IF NOT EXISTS questions_answer_source_idx
  ON questions (answer_source)
  WHERE answer_source IS NOT NULL;
