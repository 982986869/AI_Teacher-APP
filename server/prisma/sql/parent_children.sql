-- Parent ⇄ child links — a parent may have MORE THAN ONE child.
-- Idempotent/additive.
--   npx prisma db execute --file prisma/sql/parent_children.sql --schema prisma/schema.prisma
--
-- Why a table instead of widening users.linked_student_id: a parent with two
-- children is a list, and a column can only ever hold one. The column survives,
-- but its meaning narrows to "the child currently being viewed" — every existing
-- read of it (report, progress/day, progress/calendar, the admin parent screens,
-- analytics, studentSnapshot) keeps working untouched, and this table becomes the
-- answer to "which children does this parent have".

CREATE TABLE IF NOT EXISTS "parent_children" (
  "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
  "parentId"  UUID NOT NULL,
  "childId"   UUID NOT NULL,
  "linkedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "parent_children_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "parent_children_parent_fkey" FOREIGN KEY ("parentId")
    REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "parent_children_child_fkey" FOREIGN KEY ("childId")
    REFERENCES "users"("id") ON DELETE CASCADE,
  -- Linking the same child twice is a no-op, not a second row. The controller
  -- relies on this for its ON CONFLICT.
  CONSTRAINT "parent_children_unique" UNIQUE ("parentId", "childId")
);

CREATE INDEX IF NOT EXISTS "parent_children_parent_idx" ON "parent_children" ("parentId");
CREATE INDEX IF NOT EXISTS "parent_children_child_idx"  ON "parent_children" ("childId");

-- Backfill every link that already exists as a column value, so no parent who had
-- linked a child before this migration loses them. Safe to re-run.
INSERT INTO "parent_children" ("parentId", "childId")
SELECT "id", "linked_student_id"
  FROM "users"
 WHERE "linked_student_id" IS NOT NULL
   AND "account_type" = 'parent'
ON CONFLICT ("parentId", "childId") DO NOTHING;

-- ── Telling the child, once ──────────────────────────────────────────────────
-- A child learns a parent has linked them through a one-time in-app notice, and
-- "one-time" has to be remembered somewhere or the popup greets them on every
-- launch forever. The row that records the link is the natural place: it already
-- knows which child, which parent, and when.
--
-- NULL means "not told yet" and is therefore the correct default for the backfill
-- above too — a parent who linked before this existed still owes their child the
-- notice.
ALTER TABLE "parent_children"
  ADD COLUMN IF NOT EXISTS "childNotifiedAt" TIMESTAMPTZ;

-- The child's read: "is there anything I have not been told about".
CREATE INDEX IF NOT EXISTS "parent_children_unnotified_idx"
  ON "parent_children" ("childId") WHERE "childNotifiedAt" IS NULL;
