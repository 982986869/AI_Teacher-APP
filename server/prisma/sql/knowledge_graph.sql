-- Concept-level knowledge graph. Idempotent, no reset.
CREATE TABLE IF NOT EXISTS "concepts" (
  "id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "subject"   text NOT NULL,
  "chapter"   text NOT NULL,
  "name"      text NOT NULL,
  "slug"      text NOT NULL,
  "position"  integer NOT NULL DEFAULT 0,
  "embedding" vector(1024),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT concepts_uq UNIQUE ("subject", "chapter", "name")
);
CREATE INDEX IF NOT EXISTS concepts_subject_idx ON "concepts" ("subject", "chapter");

CREATE TABLE IF NOT EXISTS "concept_prereqs" (
  "concept_id" uuid NOT NULL,
  "prereq_id"  uuid NOT NULL,
  PRIMARY KEY ("concept_id", "prereq_id")
);

-- Per-student concept state (the knowledge-graph instance).
CREATE TABLE IF NOT EXISTS "student_concepts" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"        uuid NOT NULL,
  "concept_id"    uuid NOT NULL,
  "mastery"       numeric NOT NULL DEFAULT 0,   -- 0..1 estimated skill
  "confidence"    numeric NOT NULL DEFAULT 0,   -- 0..1 certainty of the estimate
  "weakness"      numeric NOT NULL DEFAULT 0,   -- 0..1 recency-weighted weakness
  "evidenceCount" integer NOT NULL DEFAULT 0,
  "quizCorrect"   integer NOT NULL DEFAULT 0,
  "quizTotal"     integer NOT NULL DEFAULT 0,
  "doubts"        integer NOT NULL DEFAULT 0,
  "recentFails"   integer NOT NULL DEFAULT 0,
  "lastSeen"      timestamptz NOT NULL DEFAULT now(),
  "updatedAt"     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_concepts_uq UNIQUE ("userId", "concept_id")
);
CREATE INDEX IF NOT EXISTS student_concepts_user_idx ON "student_concepts" ("userId");
