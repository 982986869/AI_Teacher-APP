-- Adds ONLY the exemplar_solutions table (NCERT Exemplar chapter-end solutions).
-- Safe & additive: does NOT touch any existing team tables. Run instead of
-- `prisma migrate dev` (which would try to reset the externally-managed schema).
--
--   npx prisma db execute --file prisma/sql/exemplar_solutions.sql --schema prisma/schema.prisma
--   npx prisma generate

CREATE TABLE IF NOT EXISTS "exemplar_solutions" (
  "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
  "subject"        TEXT         NOT NULL,
  "className"      TEXT         NOT NULL,
  "chapter"        TEXT         NOT NULL,
  "section"        TEXT         NOT NULL,
  "qNumber"        TEXT         NOT NULL,
  "text"           TEXT         NOT NULL,
  "options"        JSONB        NOT NULL DEFAULT '[]',
  "solutionLabel"  TEXT         NOT NULL,
  "solution"       TEXT         NOT NULL,
  "questionImages" JSONB        NOT NULL DEFAULT '[]',
  "solutionImages" JSONB        NOT NULL DEFAULT '[]',
  "position"       INTEGER      NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exemplar_solutions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "exemplar_solutions_subject_className_chapter_position_idx"
  ON "exemplar_solutions" ("subject", "className", "chapter", "position");
