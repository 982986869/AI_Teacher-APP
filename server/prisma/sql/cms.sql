-- CMS content model (Phase 1) — additive & idempotent. A new UUID hierarchy that runs
-- in PARALLEL to the existing examin8 catalog tables; nothing here touches those or the
-- student read paths. Board → Class → Subject → Chapter → Topic → Lesson as one
-- normalized adjacency tree, plus immutable publish versions and typed content items.

-- ─── Nodes (the hierarchy) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cms_nodes" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parent_id"          uuid REFERENCES "cms_nodes"("id") ON DELETE CASCADE,
  "level"              text NOT NULL,                 -- board|class|subject|chapter|topic|lesson
  "name"               text NOT NULL,
  "slug"               text NOT NULL,
  "description"        text NOT NULL DEFAULT '',
  "position"           int  NOT NULL DEFAULT 0,
  "status"             text NOT NULL DEFAULT 'draft', -- draft|review|published|archived|rejected
  "icon"               text,
  "cover_image"        text,
  "estimated_duration" int,                            -- minutes
  "difficulty"         text,                           -- easy|medium|hard
  "tags"               text[] NOT NULL DEFAULT '{}',
  "visibility"         text NOT NULL DEFAULT 'visible',-- visible|hidden
  "version"            int  NOT NULL DEFAULT 0,        -- highest published version (0 = never published)
  "lock_version"       int  NOT NULL DEFAULT 1,        -- optimistic-concurrency guard
  "created_by"         uuid,
  "created_by_name"    text,
  "updated_by"         uuid,
  "updated_by_name"    text,
  "published_at"       timestamptz,
  "created_at"         timestamptz NOT NULL DEFAULT now(),
  "updated_at"         timestamptz NOT NULL DEFAULT now(),
  "deleted_at"         timestamptz
);
-- Slug unique among live siblings of the same level (roots use a sentinel parent).
CREATE UNIQUE INDEX IF NOT EXISTS "cms_nodes_slug_uq"
  ON "cms_nodes" (COALESCE("parent_id", '00000000-0000-0000-0000-000000000000'::uuid), "level", "slug")
  WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "cms_nodes_parent_pos"  ON "cms_nodes" ("parent_id", "position") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "cms_nodes_level_status" ON "cms_nodes" ("level", "status") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "cms_nodes_status"       ON "cms_nodes" ("status") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "cms_nodes_tags"         ON "cms_nodes" USING gin ("tags");

-- ─── Immutable publish versions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cms_versions" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "node_id"        uuid NOT NULL REFERENCES "cms_nodes"("id") ON DELETE CASCADE,
  "version"        int  NOT NULL,
  "status"         text NOT NULL,
  "editor_id"      uuid,
  "editor_name"    text,
  "change_summary" text NOT NULL DEFAULT '',
  "snapshot"       jsonb NOT NULL,
  "published_at"   timestamptz,
  "created_at"     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cms_versions_node" ON "cms_versions" ("node_id", "version" DESC);

-- ─── Typed content items (one row per lesson content block; editor lands in P2) ─
CREATE TABLE IF NOT EXISTS "cms_content_items" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "node_id"      uuid NOT NULL REFERENCES "cms_nodes"("id") ON DELETE CASCADE,
  "type"         text NOT NULL,                 -- ai_lesson|video|notes|flashcards|mcq|…
  "title"        text NOT NULL DEFAULT '',
  "position"     int  NOT NULL DEFAULT 0,
  "metadata"     jsonb NOT NULL DEFAULT '{}',   -- per-type payload (no giant shared schema)
  "status"       text NOT NULL DEFAULT 'draft',
  "version"      int  NOT NULL DEFAULT 1,
  "lock_version" int  NOT NULL DEFAULT 1,
  "created_by"   uuid,
  "updated_by"   uuid,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now(),
  "deleted_at"   timestamptz
);
CREATE INDEX IF NOT EXISTS "cms_content_node" ON "cms_content_items" ("node_id", "position") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "cms_content_type" ON "cms_content_items" ("type") WHERE "deleted_at" IS NULL;
