-- ============================================================
-- Add class/grade dimension to the STRUCTURED content tree.
--
-- Content (chapters → sections → questions, and chapters → subtopics →
-- mcq_questions) was all implicitly Class 11. We tag CLASS on `chapters`;
-- everything below inherits class via its chapter, so no other table changes.
--
-- Existing rows default to class_level = 11 (backfill), so nothing breaks.
-- A subject (e.g. Physics) stays a single row, shared across classes.
-- ============================================================

-- 1. New column — existing 64 chapters become Class 11 automatically.
alter table chapters
  add column if not exists class_level int not null default 11;

-- 2. Same chapter slug can now exist per class → widen the uniqueness.
alter table chapters drop constraint if exists chapters_subject_id_slug_key;
alter table chapters
  add constraint chapters_subject_class_slug_key
  unique (subject_id, class_level, slug);

-- 3. Helps class-filtered chapter listings.
create index if not exists idx_chapters_subject_class
  on chapters(subject_id, class_level);
