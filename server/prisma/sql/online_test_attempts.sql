-- Online Test attempts — additive & idempotent (safe to re-run).
-- Until now an online test was graded entirely on the device and the result was kept
-- in AsyncStorage, so nothing ever reached the server and a parent could never see it.
-- This table is the server-side record, deliberately mirroring mock_test_attempts
-- column-for-column so both can be read the same way.
--
-- Nothing existing is altered or dropped — this only adds one table and its indexes.
-- To undo: DROP TABLE IF EXISTS ot_attempts;

CREATE TABLE IF NOT EXISTS ot_attempts (
  id             bigserial PRIMARY KEY,
  user_id        uuid,
  ot_test_id     bigint  NOT NULL REFERENCES ot_tests(id) ON DELETE CASCADE,
  answers        jsonb   NOT NULL DEFAULT '{}',
  total          integer NOT NULL DEFAULT 0,
  attempted      integer NOT NULL DEFAULT 0,
  correct_count  integer NOT NULL DEFAULT 0,
  wrong_count    integer NOT NULL DEFAULT 0,
  score          integer NOT NULL DEFAULT 0,
  time_taken_sec integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- The parent day-view reads by user and date, the tests list reads by test.
CREATE INDEX IF NOT EXISTS ot_attempts_user_idx ON ot_attempts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ot_attempts_test_idx ON ot_attempts (ot_test_id);
