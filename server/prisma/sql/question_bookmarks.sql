-- Bookmarked questions. Additive & idempotent (safe to re-run).
--
-- The solve screen and the NCERT reader both show a bookmark control, and there was
-- nowhere to put the answer — a bookmark that forgets on reload is worse than no
-- bookmark, so the control was left out until this existed.
--
-- Keyed (user_id, question_id) like question_progress, and for the same reason: a
-- bookmark is the PRESENCE of a row. There is no is_bookmarked flag to keep in sync,
-- and un-bookmarking is a delete rather than a false.
--
-- note: optional free text — "revise before the exam", "ask sir about step 2". The
-- UI does not collect it yet; the column is here so adding that later needs no
-- migration, and it costs nothing while null.
--
-- To undo: DROP TABLE IF EXISTS question_bookmarks;

CREATE TABLE IF NOT EXISTS question_bookmarks (
  user_id     uuid   NOT NULL,
  question_id bigint NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

-- "My bookmarks", newest first.
CREATE INDEX IF NOT EXISTS question_bookmarks_user_idx
  ON question_bookmarks (user_id, created_at DESC);
