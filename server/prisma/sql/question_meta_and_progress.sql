-- Per-question metadata + per-student progress for resource questions
-- (Important Questions / PYQ). Additive & idempotent (safe to re-run).
--
-- The chapter screen wants to show, per question, what TYPE it is ("Very Short
-- Answer"), what it is WORTH ("4 Marks"), and whether this student has finished it.
-- The `questions` table carried none of that: it stores q_number, the HTML, options
-- and a solution, and progress was never tracked at all — so the screen had nothing
-- true to render.
--
--   questions.marks          — integer weight from the paper. NULL = unknown, which
--                              the UI must render as absent rather than as 0 marks.
--   questions.question_type  — free text, not an enum: the boards keep inventing
--                              categories ("Case Study-Based", "Assertion-Reason")
--                              and an enum would need a migration for each one.
--   question_progress        — one row per (student, question). Absent = untouched;
--                              this is deliberately not a status column defaulted to
--                              'pending', so a chapter with no rows costs nothing.
--
-- Nothing existing is altered or dropped; both columns are nullable, so every
-- existing row and every importer that does not set them keeps working.
--
-- To undo:
--   DROP TABLE IF EXISTS question_progress;
--   ALTER TABLE questions DROP COLUMN IF EXISTS marks, DROP COLUMN IF EXISTS question_type;

ALTER TABLE questions ADD COLUMN IF NOT EXISTS marks         integer;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type text;

CREATE TABLE IF NOT EXISTS question_progress (
  user_id     uuid    NOT NULL,
  question_id bigint  NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  -- 'solved'    — the student worked it and marked it done
  -- 'attempted' — opened and answered, not confirmed correct
  -- 'skipped'   — explicitly set aside, so it can be surfaced again later
  status      text    NOT NULL DEFAULT 'solved',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

-- The chapter screen reads every row for one student at once.
CREATE INDEX IF NOT EXISTS question_progress_user_idx
  ON question_progress (user_id);

-- "What should I do next" walks a chapter's questions and takes the first with no
-- progress row, so the join goes the other way too.
CREATE INDEX IF NOT EXISTS question_progress_question_idx
  ON question_progress (question_id);
