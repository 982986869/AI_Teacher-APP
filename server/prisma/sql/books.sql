-- Admin-uploaded books, and the content generated from them.
--
-- An admin uploads a PDF; the server extracts it, splits it into chapters, and
-- generates notes, quizzes, practice questions and resources per chapter. Students
-- only ever read, and only what an admin has published.
--
-- Three tables, because three different things have three different lifetimes:
--   books          the upload itself — one row per PDF, deduplicated by hash
--   book_chapters  the structure found inside it
--   book_content   what was generated, per chapter, per kind, each separately
--                  publishable so an admin can release notes while a quiz is still
--                  under review

CREATE TABLE IF NOT EXISTS "books" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"        text NOT NULL,
  -- Targeting reuses the pattern chapters already use, so a book reaches students
  -- the same way every other piece of content does. No assignments table needed:
  -- an admin uploads for a class and a subject.
  "subject_id"   bigint REFERENCES "subjects"("id") ON DELETE SET NULL,
  "class_level"  integer,
  -- SHA-256 of the file. The same textbook uploaded twice is recognised before a
  -- byte is stored or a rupee of AI spend is incurred.
  "sha256"       text UNIQUE,
  "original_filename" text,
  "size_bytes"   bigint,
  "page_count"   integer,
  -- uploaded → extracting → ready → failed. `failed` keeps `error` so an admin can
  -- see why rather than re-uploading blindly into the same problem.
  "status"       text NOT NULL DEFAULT 'uploaded',
  "error"        text,
  -- Nothing reaches a student until an admin sets this. The default is the safe one.
  "published"    boolean NOT NULL DEFAULT false,
  "uploaded_by"  uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "uploaded_by_name" text,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "book_chapters" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "book_id"    uuid NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
  "position"   integer NOT NULL,
  "title"      text NOT NULL,
  "page_from"  integer,
  "page_to"    integer,
  -- The extracted text. Kept so generation can be re-run for a chapter without
  -- re-reading the PDF — which matters because the PDF itself is deleted after
  -- extraction: once the text is out, a 50 MB file costs storage and serves nothing.
  "text"       text,
  "char_count" integer,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("book_id", "position")
);

CREATE TABLE IF NOT EXISTS "book_content" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chapter_id" uuid NOT NULL REFERENCES "book_chapters"("id") ON DELETE CASCADE,
  -- The four sub-sections an admin files generated content into.
  "kind"       text NOT NULL CHECK ("kind" IN ('notes', 'quiz', 'practice', 'resource')),
  "title"      text,
  -- Shape depends on kind: notes are blocks, a quiz is questions with answers,
  -- practice is a question list, a resource is a link or a summary. Validated in
  -- the service rather than by a CHECK, because one constraint covering four
  -- shapes would be a second copy of the validator to keep in step.
  "payload"    jsonb NOT NULL,
  -- draft → published, per piece. An admin can publish notes for chapter 1 while
  -- its quiz is still being reviewed; they are separate rows, separately gated.
  "status"     text NOT NULL DEFAULT 'draft',
  -- ai | manual — so a later "regenerate everything AI made" never touches
  -- something a person wrote or corrected by hand.
  "source"     text NOT NULL DEFAULT 'ai',
  "model"      text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("chapter_id", "kind")
);

-- The student query: published books for my class and subject.
CREATE INDEX IF NOT EXISTS "books_visible_idx"
  ON "books" ("class_level", "subject_id") WHERE "published" = true;

-- The admin list, newest first.
CREATE INDEX IF NOT EXISTS "books_created_idx" ON "books" ("created_at" DESC);

-- Chapter → its generated pieces, which is every read on the student side.
CREATE INDEX IF NOT EXISTS "book_content_chapter_idx" ON "book_content" ("chapter_id", "kind");
