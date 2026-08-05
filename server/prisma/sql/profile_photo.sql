-- Profile photo column on users. Idempotent — safe to re-run.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "photo_url" TEXT;
