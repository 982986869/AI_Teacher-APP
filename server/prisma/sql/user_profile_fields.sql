-- The fields the Edit Profile and Learning Preferences screens collect that
-- user_personalization.sql did not cover. Additive/idempotent, same style as that file.
--   npx prisma db execute --file prisma/sql/user_profile_fields.sql --schema prisma/schema.prisma
--
-- Until this ran, the app kept name / favourite subject / learning goal on the DEVICE
-- (src/utils/storage.js saveProfileExtras) because PATCH /api/auth/profile had nowhere
-- to put them. `name` already had a column; the other three did not.
--
-- learning_prefs is one JSONB blob rather than four columns because it is a single
-- screen's answer sheet, read and written whole, and its shape is still moving:
--   { goals: string[], subjects: string[], style: string, difficulty: string }
-- Nothing joins or filters on it, so a column per key would buy nothing and cost a
-- migration every time the design adds a chip row.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth"  DATE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "parent_email"   TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "learning_prefs" JSONB;
