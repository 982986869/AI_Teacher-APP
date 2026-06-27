-- Mastery Lifecycle Engine — add long-term learning columns to student_concepts.
-- Idempotent and additive (existing rows default to 0). Safe to re-run.
--   npx prisma db execute --file prisma/sql/mastery_lifecycle.sql --schema prisma/schema.prisma

ALTER TABLE "student_concepts"
  ADD COLUMN IF NOT EXISTS "speedScore"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "retentionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "streak"         INTEGER          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "revisionCount"  INTEGER          NOT NULL DEFAULT 0;
