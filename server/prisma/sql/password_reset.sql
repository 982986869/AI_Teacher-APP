-- Self-service password reset. Additive & idempotent (safe to re-run).
--
-- One row per reset request. The token is stored HASHED: this table is a list of
-- "anyone holding this string may take over that account", and a leaked backup or
-- a stray SELECT would otherwise be a set of live keys. The server hashes what the
-- user presents and looks up the hash, exactly the way a password is checked.
--
-- Rows are kept after use rather than deleted, so `usedAt` can distinguish "already
-- used" from "never existed" in the logs without telling the user the difference.
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id"        UUID        NOT NULL DEFAULT gen_random_uuid(),
  "userId"    UUID        NOT NULL,
  "tokenHash" TEXT        NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Kept for rate limiting and for answering "was this us?" after the fact.
  "requestIp" TEXT,
  PRIMARY KEY ("id")
);

-- The lookup on every reset attempt.
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_hash_uq"
  ON "password_reset_tokens" ("tokenHash");

-- "How many requests has this account had recently" — the rate limit, and the
-- invalidate-the-others step when a new request is issued.
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_idx"
  ON "password_reset_tokens" ("userId", "createdAt" DESC);

-- A deleted user must not leave a live reset key behind.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_tokens_user_fk'
  ) THEN
    ALTER TABLE "password_reset_tokens"
      ADD CONSTRAINT "password_reset_tokens_user_fk"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ── Code-based reset (in-app, no browser) ────────────────────────────────────
-- Additive & idempotent.
--
-- The emailed link opens a page; a 6-digit code is typed into the app instead,
-- so the student never leaves it. Both are stored for the same request: the link
-- still works from a desktop, and the code works on the phone.
--
-- A code is ENORMOUSLY weaker than the token beside it — a million combinations
-- against 2^256 — so it needs a limit the token does not. `attempts` provides it:
-- the row is spent after a handful of wrong guesses, which is what keeps a
-- six-digit secret honest. Without it, a million guesses is minutes of scripting.
ALTER TABLE "password_reset_tokens"
  ADD COLUMN IF NOT EXISTS "codeHash" TEXT,
  ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;

-- Verification looks the row up by user, since the student types a code and an
-- email rather than presenting a token.
CREATE INDEX IF NOT EXISTS "password_reset_tokens_code_idx"
  ON "password_reset_tokens" ("userId", "usedAt", "expiresAt");
