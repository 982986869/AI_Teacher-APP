-- error_logs — the swallowed-error trail (bug list item 15).
--
-- Every place the code used to write `catch {}` now reports here instead, plus every
-- 5xx the server's errorHandler sees. Read by admins only, through
-- GET /api/admin/error-logs.
--
-- RUN THIS BY HAND against the database (psql / Supabase SQL editor) before deploying
-- the code that writes to it. Nothing here fails loudly if it is missing — the writer
-- is best-effort by design — so a forgotten migration looks exactly like "no errors
-- ever happened". The admin screen detects the missing table and says so.
--
-- SIZE BUDGET. The database sits at ~482 MB of the free tier's 500 MB. This table is
-- therefore capped, not merely retained: services/errorLog.service.js trims to
-- MAX_ROWS on a rolling basis and drops anything older than RETENTION_DAYS. At the
-- current cap (5,000 rows x ~500 B) the ceiling is ~2.5 MB. Raise MAX_ROWS in that
-- file — not here — once the Supabase plan is upgraded.

CREATE TABLE IF NOT EXISTS "error_logs" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 'app' (a device) or 'server'.
  "source"       text NOT NULL,
  -- 'error' = something broke; 'warn' = a deliberate best-effort swallow that we
  -- still want visible (a cache write that failed, say).
  "level"        text NOT NULL DEFAULT 'error',
  -- Where it happened: 'utils/sound.js:playTap' for the app, 'POST /api/lessons'
  -- for the server. This is the column you scan the list by.
  "site"         text NOT NULL,
  "message"      text,
  "stack"        text,
  -- Small, bounded bag: screen, statusCode, route params. Never request bodies.
  "context"      jsonb,
  "user_id"      uuid,
  "user_role"    text,
  "app_version"  text,
  "platform"     text,
  "os_version"   text,
  -- Stable hash of (source, site, normalized message) so the same fault recurring
  -- can be grouped in the UI without storing one row per occurrence differently.
  "fingerprint"  text,
  "created_at"   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "error_logs_created_idx"     ON "error_logs" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "error_logs_source_idx"      ON "error_logs" ("source", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "error_logs_fingerprint_idx" ON "error_logs" ("fingerprint", "created_at" DESC);
