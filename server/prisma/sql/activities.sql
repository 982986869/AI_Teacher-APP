-- Chapter activities: the "missions" a student plays for one chapter.
--
-- Two tables, and the split is the point.
--
-- `activities` holds a CURATED spec for a chapter — hand-written or generated and
-- then reviewed — as one JSON document in the shape the app renders. Most chapters
-- will never have a row here: for those, the server ASSEMBLES an activity on the fly
-- from the chapter's existing question banks (mcq_questions and questions), so every
-- chapter with enough MCQs is playable from day one without anyone authoring it. A
-- row here overrides that assembly, which is how a chapter earns a theme, riddles
-- with spelling aliases, and a real-world task — things a bank cannot supply.
--
-- `activity_progress` is per student per chapter. Best score is kept separately from
-- the last score because assembled activities draw a fresh question set each time —
-- a student who scored 18/20 and then 12/20 on different questions has not got worse,
-- and the chapter list should say 18.

CREATE TABLE IF NOT EXISTS "activities" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chapter_id" bigint NOT NULL UNIQUE REFERENCES "chapters"("id") ON DELETE CASCADE,
  -- { kicker, title, emoji, missions: [{ type, title, note, items: [...] }] }
  -- Validated in activities.service.js before insert, not by the database: the shape
  -- has five mission types with different item fields, and a CHECK that long would be
  -- a second copy of the validator to keep in step.
  "spec"       jsonb NOT NULL,
  -- draft | published. Only published rows are served to students; a draft lets an
  -- admin stage a generated activity for review without it going live.
  "status"     text NOT NULL DEFAULT 'published',
  -- curated | generated. Where the spec came from — so a later "regenerate all the
  -- generated ones" never touches something a person wrote by hand.
  "source"     text NOT NULL DEFAULT 'curated',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "activity_progress" (
  "user_id"    uuid   NOT NULL REFERENCES "users"("id")    ON DELETE CASCADE,
  "chapter_id" bigint NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
  "best_score" integer NOT NULL DEFAULT 0,
  "best_total" integer NOT NULL DEFAULT 0,
  "last_score" integer,
  "last_total" integer,
  "attempts"   integer NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "chapter_id")
);

-- The chapter list asks "which of this subject's chapters has this student played" —
-- one lookup per screen open, by user then chapter. The primary key already serves
-- it; this index is for the reverse question an admin dashboard will ask ("how many
-- students have played chapter X"), which the PK order does not help.
CREATE INDEX IF NOT EXISTS "activity_progress_chapter_idx" ON "activity_progress" ("chapter_id");
