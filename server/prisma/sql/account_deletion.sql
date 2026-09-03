-- In-app account deletion. See docs/superpowers/specs/2026-09-02-account-deletion-design.md
--
-- RUN THIS BY HAND against the deployed database BEFORE deploying the server code
-- that reads these columns. These files are not applied automatically, and a missed
-- one shows up in production as a 500 reading "column does not exist".
--
--   psql "$DATABASE_URL" -f server/prisma/sql/account_deletion.sql
--
-- Idempotent: safe to run twice.

-- Self-deletion by the account holder. Deliberately SEPARATE from is_active /
-- deactivated_at, which mean "staff suspended this person" and stay untouched.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Hard delete is a manual staff action with no timer, so the admin console has to
-- show how long an account has been waiting and sort by it. A 0/1 flag cannot.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Partial index: the only query is "list the deleted ones", and they are the
-- small minority, so indexing the false rows would be dead weight.
CREATE INDEX IF NOT EXISTS users_is_deleted ON "users" (deleted_at) WHERE is_deleted;
