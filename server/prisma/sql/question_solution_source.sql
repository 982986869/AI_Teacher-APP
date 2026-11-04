-- Where a question's written solution came from. Additive & idempotent (safe to re-run).
--
-- A handful of imported questions arrive with no solution because the SOURCE has
-- none: examin8's own payload carries solution_html = '' for 102 Class 12 questions
-- (Economics 56, Accountancy 29, Entrepreneurship 7, Biology 6, Computer Science 3,
-- Applied Maths 1). Re-fetching cannot fix that — there is nothing upstream to fetch.
--
-- Filling them from a model makes the app able to explain the answer, but it also
-- puts two different things in one column: a solution the board/publisher wrote,
-- and one we generated. Without a marker they are indistinguishable the moment the
-- script ends, so a wrong generated solution could never be found again, and a
-- later real import could not tell which rows were safe to overwrite.
--
--   null         — came with the import (the source's own solution), or none at all
--   'ai:<model>' — generated, e.g. 'ai:claude-opus-5-5'
--   'manual'     — a human wrote or corrected it
--
-- Mirrors answer_source in question_answer_source.sql, deliberately: the same rule
-- applied to the other half of a question.
--
-- To undo:
--   DROP INDEX IF EXISTS questions_needs_solution_idx;
--   DROP INDEX IF EXISTS questions_solution_source_idx;
--   ALTER TABLE questions DROP COLUMN IF EXISTS solution_source, DROP COLUMN IF EXISTS solution_written_at;

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS solution_source      text,
  ADD COLUMN IF NOT EXISTS solution_written_at  timestamptz;

-- The hot query this adds: "which questions still have no solution". Small and
-- shrinking, so a partial index rather than a full one.
CREATE INDEX IF NOT EXISTS questions_needs_solution_idx
  ON questions (section_id)
  WHERE solution_html IS NULL OR solution_html = '';

-- Finding generated solutions again (review queues, re-checks, bulk revert).
CREATE INDEX IF NOT EXISTS questions_solution_source_idx
  ON questions (solution_source)
  WHERE solution_source IS NOT NULL;
