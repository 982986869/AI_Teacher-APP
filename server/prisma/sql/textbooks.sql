-- Textbook lessons: NCERT books → chapters → numbered-section topics, plus the
-- shared cache of generated lessons. Idempotent; no reset.
--
-- Apply by hand (project convention — nothing uses prisma migrate):
--   npx prisma db execute --file prisma/sql/textbooks.sql --schema prisma/schema.prisma
-- or
--   psql "$DATABASE_URL" -f prisma/sql/textbooks.sql
-- then `npx prisma generate` so the client knows the new models.

CREATE TABLE IF NOT EXISTS textbooks (
  id           BIGSERIAL PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  class_level  INT  NOT NULL,
  subject      TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  title        TEXT NOT NULL,
  publisher    TEXT NOT NULL DEFAULT 'NCERT',
  edition      TEXT NOT NULL,
  language     TEXT NOT NULL DEFAULT 'en',
  cover_url    TEXT,
  position     INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS textbooks_class_level_idx ON textbooks (class_level, position);

CREATE TABLE IF NOT EXISTS textbook_chapters (
  id          BIGSERIAL PRIMARY KEY,
  book_id     BIGINT NOT NULL REFERENCES textbooks(id) ON DELETE CASCADE,
  number      INT  NOT NULL,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  page_count  INT,
  source_url  TEXT,
  char_count  INT  NOT NULL DEFAULT 0,
  UNIQUE (book_id, number)
);

CREATE TABLE IF NOT EXISTS textbook_topics (
  id          BIGSERIAL PRIMARY KEY,
  chapter_id  BIGINT NOT NULL REFERENCES textbook_chapters(id) ON DELETE CASCADE,
  number      TEXT NOT NULL,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  position    INT  NOT NULL,
  text        TEXT NOT NULL,
  char_count  INT  NOT NULL,
  UNIQUE (chapter_id, number)
);

CREATE TABLE IF NOT EXISTS textbook_lessons (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key          TEXT NOT NULL UNIQUE,
  chapter_id         BIGINT NOT NULL REFERENCES textbook_chapters(id) ON DELETE CASCADE,
  kind               TEXT NOT NULL,
  topic_ids          BIGINT[] NOT NULL DEFAULT '{}',
  grade_level        TEXT NOT NULL,
  teaching_mode      TEXT NOT NULL,
  explanation_style  TEXT NOT NULL DEFAULT 'balanced',
  prompt_version     INT  NOT NULL,
  payload            JSONB NOT NULL,
  generation_model   TEXT,
  generation_time_ms INT,
  hits               INT  NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_chapter_id BIGINT REFERENCES textbook_chapters(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_topic_ids  BIGINT[] NOT NULL DEFAULT '{}';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS book_lesson_id  UUID REFERENCES textbook_lessons(id) ON DELETE SET NULL;
