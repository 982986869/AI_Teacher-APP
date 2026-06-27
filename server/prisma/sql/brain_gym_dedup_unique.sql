-- Production hardening: make duplicate generation a hard DB-level guarantee.
-- A concurrent generation race can attempt to insert the same question twice;
-- this unique index makes the loser fail with P2002 (handled as a duplicate).
-- Idempotent and safe on an empty/clean table.
--   npx prisma db execute --file prisma/sql/brain_gym_dedup_unique.sql --schema prisma/schema.prisma

CREATE UNIQUE INDEX IF NOT EXISTS "gen_q_grade_subject_sig_uq"
  ON "generated_questions" ("grade", "subject", "signature");

-- The plain signature index is now redundant (the unique index covers it); drop it
-- so the DB matches schema.prisma. Non-destructive (index only).
DROP INDEX IF EXISTS "gen_q_signature_idx";
