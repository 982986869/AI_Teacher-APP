-- Teacher dashboard: teacher ↔ student pairs (each with a permanent room link), lessons
-- that belong to a pair, and homework a teacher gives inside a pair.
-- Idempotent; no reset. Apply BEFORE deploying the code that reads it — the student
-- Sessions tab filters on sessions.assignment_id, so code-first would 500 that tab.
--
-- Apply by hand (project convention — nothing uses prisma migrate):
--   psql "$DATABASE_URL" -f prisma/sql/teacher_dashboard.sql
-- No `prisma generate` needed: everything here is read and written with raw SQL.
--
-- Design: docs/superpowers/specs/2026-11-28-teacher-dashboard-design.md

BEGIN;

-- 1. A pair: one student taught one subject by one teacher. The room link belongs to the
--    pair, never to a lesson, so it never changes and both of them can bookmark it.
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id   uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  class_level  int  NOT NULL CHECK (class_level BETWEEN 1 AND 12),
  subject      text NOT NULL CHECK (length(trim(subject)) > 0),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  room_link    text CHECK (room_link IS NULL OR room_link ~* '^https://'),
  assigned_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  starts_on    date NOT NULL DEFAULT current_date,
  ends_on      date,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (student_id <> teacher_id),
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);
-- One active teacher per student per subject.
CREATE UNIQUE INDEX IF NOT EXISTS teacher_assignments_one_active
  ON teacher_assignments (student_id, lower(subject)) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS teacher_assignments_teacher_idx
  ON teacher_assignments (teacher_id) WHERE status = 'active';

-- 2. Lessons are rows of the existing sessions table. A pair lesson carries its pair and
--    its teacher. Its end is always starts_at + duration_min, worked out when read — not
--    stored, because the admin's session editor changes start and duration and would
--    leave a stored end time stale. teacher_id is also what the admin's "remove teacher
--    role" check counts (admin/users.controller.js setAccountType).
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS assignment_id uuid;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS teacher_id    uuid;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_assignment_fkey') THEN
    ALTER TABLE sessions ADD CONSTRAINT sessions_assignment_fkey
      FOREIGN KEY (assignment_id) REFERENCES teacher_assignments(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_teacher_fkey') THEN
    ALTER TABLE sessions ADD CONSTRAINT sessions_teacher_fkey
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sessions_teacher_idx    ON sessions (teacher_id, starts_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS sessions_assignment_idx ON sessions (assignment_id) WHERE assignment_id IS NOT NULL;

-- 3. Homework a teacher gives one student, inside their pair.
CREATE TABLE IF NOT EXISTS homework (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  uuid NOT NULL REFERENCES teacher_assignments(id) ON DELETE CASCADE,
  title          text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
  details        text NOT NULL DEFAULT '',
  due_on         date NOT NULL,
  status         text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'done')),
  done_at        timestamptz,
  created_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  CHECK ((status = 'done') = (done_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS homework_assignment_idx ON homework (assignment_id, due_on) WHERE deleted_at IS NULL;

COMMIT;

-- 4. Photos with homework (added 2026-11-28). The teacher may attach photos when giving it
--    (a worksheet, a question); the student submits their work — a note and photos of their
--    notebook; the teacher marks it checked with a comment. One student per pair, so one
--    submission per homework: kept on the row. Images are URLs of files in uploads/homework/
--    (the server only accepts its own upload URLs here).
BEGIN;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS attachments       jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS submission_note   text;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS submission_images jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS submitted_at      timestamptz;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS checked_at        timestamptz;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS teacher_comment   text;
COMMIT;
