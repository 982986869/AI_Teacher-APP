-- ============================================================
-- Fix: `papers` identity must include YEAR.
--
-- CBSE reuses the same paper `code` (e.g. 56/1/1) every year. The original
-- unique key (subject_id, class_level, code) therefore collapsed all years of a
-- code into ONE row — importing 109 Chemistry paper files left only 27 rows
-- (82 silently overwritten via ON CONFLICT). Widen the identity to include
-- `year` so each year's paper is its own row.
--
-- Safe on existing data: the old key is a stricter subset of the new one, so
-- current rows already satisfy (subject_id, class_level, code, year).
-- ============================================================

-- All real papers carry a year; enforce it so it can join the identity.
update papers set year = 0 where year is null;
alter table papers alter column year set not null;

-- Drop the too-narrow unique key (auto-named by Postgres for the inline
-- `unique (subject_id, class_level, code)`), then add the year-aware one.
alter table papers drop constraint if exists papers_subject_id_class_level_code_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'papers_subject_class_code_year_key'
  ) then
    alter table papers
      add constraint papers_subject_class_code_year_key
      unique (subject_id, class_level, code, year);
  end if;
end $$;
