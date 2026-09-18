-- Free demo-class bookings made from the parent app (controllers/trialBooking).
-- Replaces the Calendly embed: the row is our record, the emails are built from it.
-- Idempotent/additive; safe to re-run.
--   npx prisma db execute --file prisma/sql/trial_bookings.sql --schema prisma/schema.prisma

CREATE TABLE IF NOT EXISTS "trial_bookings" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  -- The signed-in account that booked. Not a foreign key: accounts are purged after
  -- their grace period and the team still wants the booking history.
  "user_id"       UUID NOT NULL,
  "parent_name"   TEXT NOT NULL,
  "parent_email"  TEXT NOT NULL,                      -- where the confirmation went
  "parent_phone"  TEXT NOT NULL,
  "child_name"    TEXT,
  "child_class"   TEXT NOT NULL,                      -- 'Class 8'
  "subject"       TEXT NOT NULL,                      -- 'Maths'
  "slot_at"       TIMESTAMPTZ NOT NULL,               -- class start
  "duration_min"  INTEGER NOT NULL DEFAULT 45,
  "meet_link"     TEXT NOT NULL,                      -- the link that was emailed, frozen
  "status"        TEXT NOT NULL DEFAULT 'booked',     -- booked | cancelled
  "mail_status"   TEXT NOT NULL DEFAULT 'pending',    -- pending | sent | failed
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "cancelled_at"  TIMESTAMPTZ,
  CONSTRAINT "trial_bookings_pkey" PRIMARY KEY ("id")
);

-- "Does this user already have a demo coming up?" is the query on every booking and
-- every dashboard load.
CREATE INDEX IF NOT EXISTS "trial_bookings_user_slot_idx" ON "trial_bookings" ("user_id", "slot_at");
