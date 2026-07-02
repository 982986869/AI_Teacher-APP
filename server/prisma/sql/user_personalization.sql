-- Personalization profile fields on users. Additive/idempotent. account_type is the
-- source of truth for role gating (student | parent | teacher) so we don't have to
-- migrate the existing role enum. linked_student_id links a parent to their child.
--   npx prisma db execute --file prisma/sql/user_personalization.sql --schema prisma/schema.prisma

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "board"             TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stream"            TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language"          TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "school"            TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_type"      TEXT NOT NULL DEFAULT 'student';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "linked_student_id" UUID;

CREATE INDEX IF NOT EXISTS "users_linked_student_idx" ON "users" ("linked_student_id");
