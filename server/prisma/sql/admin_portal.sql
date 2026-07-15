-- Admin Portal schema — additive & idempotent (safe to re-run).
-- Creates the admin RBAC column + the three portal-owned tables:
--   users.admin_role / is_active / deactivated_at   (portal access + soft-deactivate)
--   audit_logs                                       (who changed what, before/after)
--   announcements                                    (draft/publish/archive broadcasts)
--   app_settings                                     (feature flags, maintenance, config)
-- Nothing here touches the student/parent runtime tables.

-- ─── Users: admin RBAC + soft-deactivate ─────────────────────────────────────
-- admin_role gates the whole portal (NULL = not an admin). Kept separate from the
-- UserRole enum so elevating a person to admin never disturbs their student data.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_role"     text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active"      boolean NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deactivated_at" timestamptz;

CREATE INDEX IF NOT EXISTS "users_admin_role_idx" ON "users" ("admin_role") WHERE "admin_role" IS NOT NULL;

-- ─── Audit log ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id"    uuid,
  "actor_name"  text,
  "actor_email" text,
  "actor_role"  text,
  "module"      text NOT NULL,
  "action"      text NOT NULL,
  "target_type" text,
  "target_id"   text,
  "target_label" text,
  "before"      jsonb,
  "after"       jsonb,
  "ip"          text,
  "user_agent"  text,
  "created_at"  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx"   ON "audit_logs" ("actor_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_module_idx"  ON "audit_logs" ("module", "created_at" DESC);

-- ─── Announcements ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "announcements" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"        text NOT NULL,
  "body"         text NOT NULL DEFAULT '',
  "audience"     text NOT NULL DEFAULT 'all',   -- all | students | parents | teachers | class
  "class_level"  int,                            -- set when audience = 'class'
  "status"       text NOT NULL DEFAULT 'draft',  -- draft | published | archived
  "pinned"       boolean NOT NULL DEFAULT false,
  "starts_at"    timestamptz,
  "ends_at"      timestamptz,
  "created_by"   uuid,
  "created_by_name" text,
  "published_at" timestamptz,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "announcements_status_idx" ON "announcements" ("status", "created_at" DESC);

-- ─── App settings (key/value: maintenance, academic year, config, …) ─────────
CREATE TABLE IF NOT EXISTS "app_settings" (
  "key"        text PRIMARY KEY,
  "value"      jsonb NOT NULL DEFAULT '{}'::jsonb,
  "category"   text NOT NULL DEFAULT 'general',
  "label"      text,
  "description" text,
  "updated_by" uuid,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
-- Optimistic-concurrency guard: a PATCH must send the version it read; a mismatch 409s.
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "version" int NOT NULL DEFAULT 1;

-- ─── Feature flags ───────────────────────────────────────────────────────────
-- One row per flag (per-flag description / environment / rollout / audit +
-- optimistic-concurrency version). Distinct from app_settings so each flag carries
-- its own last-modified metadata. Not yet consumed by the app runtime (rollout is
-- "global" for now); a public /api/config will read these when app-side gating ships.
CREATE TABLE IF NOT EXISTS "feature_flags" (
  "key"            text PRIMARY KEY,
  "label"          text NOT NULL,
  "description"    text,
  "enabled"        boolean NOT NULL DEFAULT true,
  "environment"    text NOT NULL DEFAULT 'all',      -- all | production | development
  "rollout_scope"  text NOT NULL DEFAULT 'global',   -- global (extensible later)
  "version"        int  NOT NULL DEFAULT 1,
  "position"       int  NOT NULL DEFAULT 0,
  "updated_by"     uuid,
  "updated_by_name" text,
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  "created_at"     timestamptz NOT NULL DEFAULT now()
);
