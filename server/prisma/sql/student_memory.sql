-- Student Memory: per-chapter aggregates + an event log. Idempotent, no reset.
CREATE TABLE IF NOT EXISTS "student_memory" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"       uuid NOT NULL,
  "subject"      text NOT NULL,
  "chapter"      text NOT NULL DEFAULT '',
  "doubts"       integer NOT NULL DEFAULT 0,
  "mistakes"     integer NOT NULL DEFAULT 0,
  "quizCorrect"  integer NOT NULL DEFAULT 0,
  "quizTotal"    integer NOT NULL DEFAULT 0,
  "lastSeen"     timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_memory_uq UNIQUE ("userId", "subject", "chapter")
);
CREATE INDEX IF NOT EXISTS student_memory_user_idx ON "student_memory" ("userId", "subject");

CREATE TABLE IF NOT EXISTS "student_events" (
  "id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    uuid NOT NULL,
  "type"      text NOT NULL,           -- 'doubt' | 'mistake' | 'quiz'
  "subject"   text,
  "chapter"   text,
  "detail"    jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS student_events_user_idx ON "student_events" ("userId", "createdAt");
