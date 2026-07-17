-- AI Teacher — admin-authored lesson catalog (Subjects → Chapters → Lessons → Slides).
-- Decoupled from the Resources subjects/chapters so archiving/renaming here never touches
-- Resources. Additive + idempotent (safe to re-run). The existing per-student generated
-- lessons are UNAFFECTED: they simply have catalog_status IS NULL. Student-facing browse of
-- this catalog is a later phase — nothing here changes the frozen student flow.

CREATE TABLE IF NOT EXISTS ai_lesson_subjects (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  emoji       text,
  position    int NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'published',   -- published | archived
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_lesson_chapters (
  id          bigserial PRIMARY KEY,
  subject_id  bigint NOT NULL REFERENCES ai_lesson_subjects(id) ON DELETE CASCADE,
  name        text NOT NULL,
  position    int NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'published',   -- published | archived
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_lesson_chapters_subject_idx ON ai_lesson_chapters(subject_id);

-- Link authored lessons to the catalog + the publish workflow. catalog_status IS NULL means
-- "a normal per-student generated lesson" (excluded from the catalog). Non-null means an
-- admin-authored catalog lesson: draft | published | archived.
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS catalog_subject_id bigint;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS catalog_chapter_id bigint;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS catalog_status     text;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS catalog_position   int NOT NULL DEFAULT 0;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS difficulty         text;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS deleted_at         timestamptz;
CREATE INDEX IF NOT EXISTS lessons_catalog_chapter_idx ON "lessons"(catalog_chapter_id) WHERE catalog_status IS NOT NULL;
