-- Live sessions — the real data behind the Student "Sessions" tab and the Admin Sessions
-- manager. One table; the admin writes it, the student reads the published/active rows for
-- their class. Soft-deleted, status-driven. Runs alongside everything else; touches nothing.

CREATE TABLE IF NOT EXISTS "sessions" (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  subject         text NOT NULL DEFAULT '',
  chapter         text NOT NULL DEFAULT '',
  class_level     int,                              -- NULL = visible to every class
  board           text,
  teacher_name    text NOT NULL DEFAULT '',
  starts_at       timestamptz NOT NULL,
  duration_min    int NOT NULL DEFAULT 60,
  mode            text NOT NULL DEFAULT 'online',   -- online | offline
  meeting_link    text,
  location        text,
  capacity        int,
  description     text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'scheduled',-- scheduled | completed | cancelled | archived
  created_by      uuid,
  created_by_name text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS sessions_class_start ON "sessions" (class_level, starts_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS sessions_status ON "sessions" (status) WHERE deleted_at IS NULL;
