-- ============================================================
-- `papers` identity → stable per-subject `ext_uid` (was: code + year).
--
-- Two problems with (subject_id, class_level, code, year):
--   1. A few HTML board papers share the SAME code+year+set but are distinct
--      documents (different source uuid) — the old key silently dropped them.
--   2. Older papers exist only as downloadable PDFs with NO CBSE `code` and no
--      answer key, so they cannot be keyed by code at all.
--
-- Fix: key papers on `ext_uid` = source uuid (HTML) or 'pdf:<id>' (PDF), make
-- `code`/`year` nullable, and add PDF/metadata columns. Idempotent.
--
-- (Class 12 Chemistry now holds 188 papers: 109 HTML + 79 PDF.)
-- ============================================================

alter table papers add column if not exists ext_uid      text;
alter table papers add column if not exists pdf_file     text;
alter table papers add column if not exists paper_title  text;
alter table papers add column if not exists region       text;
alter table papers add column if not exists paper_format text not null default 'html';

alter table papers alter column code drop not null;
alter table papers alter column year drop not null;

-- Backfill any legacy rows so the new UNIQUE can be created.
update papers set ext_uid = 'row:' || id::text where ext_uid is null;
alter table papers alter column ext_uid set not null;

-- Swap the identity constraint.
alter table papers drop constraint if exists papers_subject_class_code_year_key;
alter table papers drop constraint if exists papers_subject_id_class_level_code_key;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'papers_subject_class_extuid_key'
  ) then
    alter table papers
      add constraint papers_subject_class_extuid_key
      unique (subject_id, class_level, ext_uid);
  end if;
end $$;
