-- Per-user content access. Additive & idempotent (safe to re-run).
--
-- The app ships free: anyone who signs up gets Brain Gym, the Arena, the games and
-- the Home dashboard. Content — lessons, practice, resources, tests, the AI teacher
-- — is behind this column. An admin flips it to 'full'.
--
-- A column and not a table because there is exactly one line to draw. If access ever
-- has to vary per feature that is a different shape (user_features) and a different
-- design; widening this one would leave both half-built.
--
-- Modelled on is_active, which is the same idea (a per-user switch an admin throws,
-- read on every request in middleware/auth.js and audited on write). Same place,
-- same pattern, so nothing new has to be learned to maintain it.
--
-- NOT NULL DEFAULT 'free' means every account created from here on is free without
-- anything else being remembered. The backfill below is the opposite case: the
-- accounts that already exist predate the paywall and locking them out would only
-- break our own testing.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "access_level" text NOT NULL DEFAULT 'free';

-- Named so a re-run can find it; ADD CONSTRAINT has no IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_access_level_check') THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_access_level_check" CHECK ("access_level" IN ('free', 'full'));
  END IF;
END $$;

-- Backfill: everyone who existed before the gate keeps what they had.
--
-- Guarded on the column being brand new. Without the guard a re-run would undo every
-- lock an admin had set since — silently handing full access back to accounts that
-- were deliberately put on free.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "users" WHERE "access_level" = 'full'
  ) AND EXISTS (
    SELECT 1 FROM "users"
  ) THEN
    UPDATE "users" SET "access_level" = 'full';
  END IF;
END $$;

-- Admin screens list and filter by this, and auth.js reads it on every request.
CREATE INDEX IF NOT EXISTS "users_access_level_idx" ON "users" ("access_level");
