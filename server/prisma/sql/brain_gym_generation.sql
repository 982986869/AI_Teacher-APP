-- BrainGym Adaptive Question Intelligence — schema
-- Idempotent. Run with:
--   npx prisma db execute --file prisma/sql/brain_gym_generation.sql --schema prisma/schema.prisma
-- then: npx prisma generate
-- (or simply `npx prisma db push` to sync the whole schema.prisma)

CREATE EXTENSION IF NOT EXISTS vector;

-- ── generated_questions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "generated_questions" (
  "id"                      UUID NOT NULL DEFAULT gen_random_uuid(),
  "category"                TEXT NOT NULL,
  "grade"                   TEXT NOT NULL,
  "subject"                 TEXT NOT NULL DEFAULT 'Mental Math',
  "chapter"                 TEXT NOT NULL DEFAULT '',
  "topic"                   TEXT NOT NULL DEFAULT '',
  "concept"                 TEXT NOT NULL DEFAULT '',
  "difficulty"              TEXT NOT NULL,
  "level"                   INTEGER NOT NULL,
  "questionText"            TEXT NOT NULL,
  "answer"                  TEXT NOT NULL,
  "answerValue"             DOUBLE PRECISION,
  "options"                 JSONB NOT NULL DEFAULT '[]',
  "correctOption"           INTEGER NOT NULL DEFAULT 0,
  "explanation"             TEXT NOT NULL DEFAULT '',
  "hints"                   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "bloomLevel"              TEXT NOT NULL DEFAULT 'understand',
  "estimatedTimeSec"        INTEGER NOT NULL DEFAULT 30,
  "qualityScore"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "validationScore"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status"                  TEXT NOT NULL DEFAULT 'ACTIVE',
  "isPrerequisite"          BOOLEAN NOT NULL DEFAULT FALSE,
  "prereqGrade"             TEXT,
  "parentQuestionId"        TEXT,
  "generationPromptVersion" TEXT NOT NULL DEFAULT 'v1',
  "llmModel"                TEXT NOT NULL DEFAULT '',
  "signature"              TEXT NOT NULL,
  "timesServed"             INTEGER NOT NULL DEFAULT 0,
  "timesCorrect"            INTEGER NOT NULL DEFAULT 0,
  "timesWrong"              INTEGER NOT NULL DEFAULT 0,
  "ambiguityFlag"           BOOLEAN NOT NULL DEFAULT FALSE,
  "archivedReason"          TEXT,
  "createdAt"               TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "gen_q_lookup_idx"   ON "generated_questions" ("grade","subject","category","difficulty","status");
CREATE INDEX IF NOT EXISTS "gen_q_quality_idx"  ON "generated_questions" ("status","qualityScore" DESC);
CREATE INDEX IF NOT EXISTS "gen_q_signature_idx" ON "generated_questions" ("signature");

-- ── question_embeddings (pgvector, 1024-dim Voyage) ─────────────────────────
CREATE TABLE IF NOT EXISTS "question_embeddings" (
  "questionId" UUID NOT NULL,
  "embedding"  vector(1024),
  "model"      TEXT NOT NULL DEFAULT 'voyage-3.5-lite',
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("questionId"),
  CONSTRAINT "question_embeddings_question_fkey"
    FOREIGN KEY ("questionId") REFERENCES "generated_questions"("id") ON DELETE CASCADE
);
-- Approximate-NN index for fast similarity search (cosine).
CREATE INDEX IF NOT EXISTS "question_embeddings_hnsw_idx"
  ON "question_embeddings" USING hnsw ("embedding" vector_cosine_ops);

-- ── question_attempts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "question_attempts" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId"      UUID NOT NULL,
  "questionId"  UUID,
  "seedId"      TEXT,
  "source"      TEXT NOT NULL,
  "category"    TEXT NOT NULL,
  "grade"       TEXT,
  "subject"     TEXT NOT NULL DEFAULT 'Mental Math',
  "difficulty"  TEXT,
  "isCorrect"   BOOLEAN NOT NULL,
  "answerGiven" TEXT,
  "timeMs"      INTEGER NOT NULL DEFAULT 0,
  "sessionId"   UUID,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "question_attempts_question_fkey"
    FOREIGN KEY ("questionId") REFERENCES "generated_questions"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "q_attempts_user_idx"          ON "question_attempts" ("userId","createdAt" DESC);
CREATE INDEX IF NOT EXISTS "q_attempts_user_question_idx" ON "question_attempts" ("userId","questionId");
CREATE INDEX IF NOT EXISTS "q_attempts_user_seed_idx"     ON "question_attempts" ("userId","seedId");

-- ── student_mastery (per user × category × subject) ─────────────────────────
CREATE TABLE IF NOT EXISTS "student_mastery" (
  "id"                 UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId"             UUID NOT NULL,
  "category"           TEXT NOT NULL,
  "subject"            TEXT NOT NULL DEFAULT 'Mental Math',
  "grade"              TEXT NOT NULL,
  "attempts"           INTEGER NOT NULL DEFAULT 0,
  "correct"            INTEGER NOT NULL DEFAULT 0,
  "accuracy"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "streak"             INTEGER NOT NULL DEFAULT 0,
  "masteryScore"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currentDifficulty"  TEXT NOT NULL DEFAULT 'easy',
  "hiAccuracySessions" INTEGER NOT NULL DEFAULT 0,
  "recentFails"        INTEGER NOT NULL DEFAULT 0,
  "lastSeen"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "student_mastery_uq"       ON "student_mastery" ("userId","category","subject");
CREATE INDEX        IF NOT EXISTS "student_mastery_user_idx" ON "student_mastery" ("userId");

-- ── generation_history (audit trail) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "generation_history" (
  "id"                 UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId"             UUID,
  "category"           TEXT NOT NULL,
  "grade"              TEXT NOT NULL,
  "subject"            TEXT NOT NULL DEFAULT 'Mental Math',
  "difficulty"         TEXT NOT NULL,
  "requested"          INTEGER NOT NULL DEFAULT 0,
  "generated"          INTEGER NOT NULL DEFAULT 0,
  "accepted"           INTEGER NOT NULL DEFAULT 0,
  "rejectedValidation" INTEGER NOT NULL DEFAULT 0,
  "rejectedDuplicate"  INTEGER NOT NULL DEFAULT 0,
  "rejectedGuardrail"  INTEGER NOT NULL DEFAULT 0,
  "promptVersion"      TEXT NOT NULL DEFAULT 'v1',
  "llmModel"           TEXT NOT NULL DEFAULT '',
  "durationMs"         INTEGER NOT NULL DEFAULT 0,
  "trigger"            TEXT NOT NULL DEFAULT 'on_demand',
  "status"             TEXT NOT NULL DEFAULT 'SUCCESS',
  "error"              TEXT,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "gen_history_time_idx"      ON "generation_history" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "gen_history_cat_grade_idx" ON "generation_history" ("category","grade");
