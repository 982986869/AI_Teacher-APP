-- Lesson progress tracking. Idempotent, no reset.
CREATE TABLE IF NOT EXISTS "lesson_progress" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"          uuid NOT NULL,
  "lessonId"        uuid NOT NULL,
  "slidesTotal"     integer NOT NULL DEFAULT 0,
  "lastSlideIndex"  integer NOT NULL DEFAULT 0,
  "slidesCompleted" integer NOT NULL DEFAULT 0,
  "completedAt"     timestamptz,
  "updatedAt"       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_progress_uq UNIQUE ("userId", "lessonId")
);
CREATE INDEX IF NOT EXISTS lesson_progress_user_idx ON "lesson_progress" ("userId");
