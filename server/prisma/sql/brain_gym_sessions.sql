-- Adds ONLY the brain_gym_sessions table (used by the Brain Gym quiz/Arena flow).
-- Safe & additive: it does NOT touch any existing team tables. Run this instead
-- of `prisma migrate dev` (that would reset the whole DB because the Supabase
-- schema is managed outside Prisma's migration history).
--
-- Run with either:
--   npx prisma db execute --file prisma/sql/brain_gym_sessions.sql --schema prisma/schema.prisma
-- or paste it into the Supabase SQL editor.
-- Then run:  npx prisma generate

CREATE TABLE IF NOT EXISTS "brain_gym_sessions" (
  "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
  "userId"         UUID         NOT NULL,
  "skill"          TEXT         NOT NULL,
  "level"          INTEGER      NOT NULL,
  "totalQuestions" INTEGER      NOT NULL,
  "correctCount"   INTEGER      NOT NULL,
  "wrongCount"     INTEGER      NOT NULL,
  "score"          INTEGER      NOT NULL,
  "xpEarned"       INTEGER      NOT NULL,
  "timeTakenSec"   INTEGER      NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "brain_gym_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "brain_gym_sessions_userId_createdAt_idx"
  ON "brain_gym_sessions" ("userId", "createdAt" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brain_gym_sessions_userId_fkey'
  ) THEN
    ALTER TABLE "brain_gym_sessions"
      ADD CONSTRAINT "brain_gym_sessions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
