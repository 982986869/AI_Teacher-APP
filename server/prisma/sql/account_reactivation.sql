-- Bringing a deleted account back. See docs/superpowers/specs/ for the design.
--
-- RUN THIS BY HAND against the deployed database BEFORE deploying the server code
-- that reads it. These files are not applied automatically, and a missed one shows up
-- in production as a 500 reading "relation does not exist".
--
--   psql "$DATABASE_URL" -f server/prisma/sql/account_reactivation.sql
--
-- Idempotent: safe to run twice.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. The one-time secrets that let a student restore their own account
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "account_reactivation_tokens" (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ON DELETE CASCADE so a staff purge cannot leave a live token pointing at a
  -- user id that no longer exists.
  user_id     uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,

  -- Hashes, never the values themselves. Anyone who can read this table — a backup,
  -- a support query, a leaked dump — must not be able to restore someone's account
  -- with what they find in it.
  token_hash  text NOT NULL,
  code_hash   text NOT NULL,

  expires_at  timestamptz NOT NULL,

  -- Set the moment the token is spent. A used token must not work a second time:
  -- restore links sit in inboxes for a long time, and forwarded ones sit in others.
  used_at     timestamptz,

  -- Wrong guesses against the 6-digit code. Six digits is only a million
  -- possibilities, and a request-level rate limit alone does not stop someone
  -- spreading those guesses out. The row is spent after MAX_CODE_ATTEMPTS of them,
  -- so a code is only ever worth a handful of tries no matter how patiently it is
  -- attacked. See services/accountReactivation.
  attempts    integer NOT NULL DEFAULT 0,

  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Idempotency for a database that already has the table from an earlier run of this
-- file: CREATE TABLE IF NOT EXISTS would silently skip a column added later.
ALTER TABLE "account_reactivation_tokens" ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

-- The link path looks a token up by its hash and nothing else, so this is the one
-- index that has to exist. UNIQUE also makes a hash collision a loud error rather
-- than an ambiguous row.
CREATE UNIQUE INDEX IF NOT EXISTS account_reactivation_tokens_hash
  ON "account_reactivation_tokens" (token_hash);

-- The code path arrives with an email address, resolves it to a user, and needs that
-- user's live tokens newest-first.
CREATE INDEX IF NOT EXISTS account_reactivation_tokens_user
  ON "account_reactivation_tokens" (user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Undo the email/phone archiving done by the previous release
-- ─────────────────────────────────────────────────────────────────────────────
--
-- The release before this one rewrote email and phone on delete
-- ('asha@example.com' -> 'deleted+<uuid>+asha@example.com') because the rule then was
-- "you can never sign in again". That rule is gone: the address is now exactly how a
-- returning student is recognised, so anything left in the archived shape is a person
-- who can never come back.
--
-- This has to run even when the count looks like zero, because the old release stays
-- deployed until the new one ships: anyone who deletes their account in between gets
-- archived on the way out.
--
-- TWO ways this can collide with the UNIQUE constraint on email/phone. Either one
-- aborts the whole migration if it is not guarded:
--
--   1. A LIVE row already holds the address. Under the old rule the student was told
--      to register again, so this is simply what happens when someone did as they were
--      told. The live account is the real one; the archived row stays archived.
--
--   2. SEVERAL archived rows recover to the SAME address — delete, register again,
--      delete again. Only one of them could ever hold it, and choosing by rule would
--      silently decide which of someone's accounts is "the" account, stranding the
--      data in the others. That is not a migration's decision to make. It restores
--      none of the group and leaves them for a person to look at:
--
--        SELECT id, name, email, "createdAt", deleted_at FROM "users"
--         WHERE is_deleted AND email LIKE 'deleted+%'
--         ORDER BY regexp_replace(email, '^deleted[+][0-9a-fA-F-]+[+]', ''), "createdAt";

UPDATE "users" u
   SET email = regexp_replace(u.email, '^deleted[+][0-9a-fA-F-]+[+]', '')
 WHERE u.is_deleted
   AND u.email LIKE 'deleted+%'
   -- nothing live is holding the address
   AND NOT EXISTS (
     SELECT 1 FROM "users" o
      WHERE o.id <> u.id
        AND o.email = regexp_replace(u.email, '^deleted[+][0-9a-fA-F-]+[+]', '')
   )
   -- and no other archived row wants it either
   AND NOT EXISTS (
     SELECT 1 FROM "users" o
      WHERE o.id <> u.id
        AND o.is_deleted
        AND o.email LIKE 'deleted+%'
        AND regexp_replace(o.email, '^deleted[+][0-9a-fA-F-]+[+]', '')
          = regexp_replace(u.email, '^deleted[+][0-9a-fA-F-]+[+]', '')
   );

UPDATE "users" u
   SET phone = regexp_replace(u.phone, '^del:[0-9a-fA-F-]+:', '')
 WHERE u.is_deleted
   AND u.phone LIKE 'del:%'
   AND NOT EXISTS (
     SELECT 1 FROM "users" o
      WHERE o.id <> u.id
        AND o.phone = regexp_replace(u.phone, '^del:[0-9a-fA-F-]+:', '')
   )
   AND NOT EXISTS (
     SELECT 1 FROM "users" o
      WHERE o.id <> u.id
        AND o.is_deleted
        AND o.phone LIKE 'del:%'
        AND regexp_replace(o.phone, '^del:[0-9a-fA-F-]+:', '')
          = regexp_replace(u.phone, '^del:[0-9a-fA-F-]+:', '')
   );
