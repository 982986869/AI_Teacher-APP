-- Lesson progress tracking. Idempotent, no reset.
CREATE TABLE IF NOT EXISTS "lesson_progress" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"          uuid NOT NULL,
  "lessonId"        uuid NOT NULL,
  "slidesTotal"     integer NOT NULL DEFAULT 0,
  "lastSlideIndex"  integer NOT NULL DEFAULT 0,
  "slidesCompleted" integer NOT NULL DEFAULT 0,
  "studyTimeSeconds" integer NOT NULL DEFAULT 0,
  "currentConcept"  text,
  "completedAt"     timestamptz,
  "startedAt"       timestamptz NOT NULL DEFAULT now(),
  "updatedAt"       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_progress_uq UNIQUE ("userId", "lessonId")
);
CREATE INDEX IF NOT EXISTS lesson_progress_user_idx ON "lesson_progress" ("userId");

-- Idempotent column adds for already-created tables.
ALTER TABLE "lesson_progress" ADD COLUMN IF NOT EXISTS "studyTimeSeconds" integer NOT NULL DEFAULT 0;
ALTER TABLE "lesson_progress" ADD COLUMN IF NOT EXISTS "currentConcept" text;
ALTER TABLE "lesson_progress" ADD COLUMN IF NOT EXISTS "startedAt" timestamptz NOT NULL DEFAULT now();
