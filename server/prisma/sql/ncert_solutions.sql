-- NCERT Solutions (Part-I / Part-II), DB-backed. Idempotent: safe to re-run, no reset.
CREATE TABLE IF NOT EXISTS "ncert_solutions" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "part"         integer NOT NULL DEFAULT 2,
  "subject"      text NOT NULL,
  "className"    text NOT NULL DEFAULT 'Class 11',
  "chapter"      text NOT NULL,
  "sectionKey"   text NOT NULL,
  "sectionLabel" text NOT NULL,
  "html"         text,
  "chapterPos"   integer NOT NULL DEFAULT 0,
  "position"     integer NOT NULL DEFAULT 0,
  "createdAt"    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ncert_solutions_part_subject_className_chapter_position_idx"
  ON "ncert_solutions" ("part", "subject", "className", "chapter", "position");
