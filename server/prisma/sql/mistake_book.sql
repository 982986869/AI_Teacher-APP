-- Personal Mistake Book — every wrong question the student should revisit.
-- Idempotent/additive. Populated automatically from wrong attempts (BrainGym /
-- homework) and surfaced for revision. Dedup per (userId, itemKey).
--   npx prisma db execute --file prisma/sql/mistake_book.sql --schema prisma/schema.prisma

CREATE TABLE IF NOT EXISTS "mistake_book" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId"        UUID NOT NULL,
  "itemKey"       TEXT NOT NULL,                 -- questionId or 'seed:<seedId>' (dedup key)
  "source"        TEXT NOT NULL DEFAULT 'braingym', -- braingym | homework | doubt
  "questionId"    UUID,
  "seedId"        TEXT,
  "subject"       TEXT NOT NULL DEFAULT 'Mental Math',
  "chapter"       TEXT NOT NULL DEFAULT '',
  "concept"       TEXT NOT NULL DEFAULT '',
  "category"      TEXT,
  "grade"         TEXT,
  "difficulty"    TEXT,
  "questionText"  TEXT NOT NULL DEFAULT '',
  "studentAnswer" TEXT,
  "correctAnswer" TEXT,
  "explanation"   TEXT NOT NULL DEFAULT '',
  "status"        TEXT NOT NULL DEFAULT 'unresolved', -- unresolved | resolved
  "timesWrong"    INTEGER NOT NULL DEFAULT 1,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "lastWrongAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "resolvedAt"    TIMESTAMPTZ,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "mistake_book_uq"        ON "mistake_book" ("userId", "itemKey");
CREATE INDEX        IF NOT EXISTS "mistake_book_open_idx"  ON "mistake_book" ("userId", "status", "lastWrongAt" DESC);
CREATE INDEX        IF NOT EXISTS "mistake_book_subj_idx"  ON "mistake_book" ("userId", "subject");
