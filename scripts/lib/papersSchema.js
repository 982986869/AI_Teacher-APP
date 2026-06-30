'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Shared, idempotent migration that makes the `papers` table identity a stable
// per-subject external id (`ext_uid`) instead of (subject, class, code, year).
//
// Why: (1) some HTML papers share the same CBSE code+year+set but are distinct
// documents (different `uuid`), so code+year cannot hold them all; (2) older
// papers exist only as PDFs with no `code`/answer-key at all. `ext_uid` =
// the source's `uuid` (HTML) or `pdf:<id>` (PDF) keys both cleanly.
//
// Safe to run repeatedly and against the existing prod table:
//   • adds columns if missing
//   • makes `code` nullable (PDF papers have none)
//   • backfills ext_uid for any legacy rows (stable surrogate) so the new
//     UNIQUE can be added
//   • swaps the old (subject,class,code,year) unique for (subject,class,ext_uid)
// ───────────────────────────────────────────────────────────────────────────

const ENSURE_PAPERS_EXT_UID = `
create table if not exists papers (
  id                  bigint generated always as identity primary key,
  subject_id          bigint not null references subjects(id) on delete cascade,
  class_level         int  not null default 12,
  year                int,
  code                text,
  set_label           text,
  name                text,
  question_paper_html text,
  answer_key_html     text,
  position            int  not null default 0,
  created_at          timestamptz not null default now()
);
alter table papers add column if not exists ext_uid      text;
alter table papers add column if not exists pdf_file     text;
alter table papers add column if not exists paper_title  text;
alter table papers add column if not exists region       text;
alter table papers add column if not exists paper_format text not null default 'html';
alter table papers alter column code drop not null;
alter table papers alter column year drop not null;
-- legacy rows (no ext_uid yet) get a stable surrogate so the UNIQUE can be added
update papers set ext_uid = 'row:' || id::text where ext_uid is null;
alter table papers alter column ext_uid set not null;
-- swap identity: old (subject,class,code,year) → (subject,class,ext_uid)
alter table papers drop constraint if exists papers_subject_class_code_year_key;
alter table papers drop constraint if exists papers_subject_id_class_level_code_key;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'papers_subject_class_extuid_key') then
    alter table papers add constraint papers_subject_class_extuid_key
      unique (subject_id, class_level, ext_uid);
  end if; end $$;
create index if not exists idx_papers_subject_class on papers(subject_id, class_level);`

// INSERT … ON CONFLICT (subject_id, class_level, ext_uid) statement shared by
// every paper writer. Columns are positional $1..$14 in this exact order.
const UPSERT_PAPER_SQL = `
insert into papers
  (subject_id, class_level, ext_uid, year, code, set_label, region, name,
   paper_title, pdf_file, question_paper_html, answer_key_html, paper_format, position)
values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
on conflict (subject_id, class_level, ext_uid)
do update set
  year = excluded.year, code = excluded.code, set_label = excluded.set_label,
  region = excluded.region, name = excluded.name, paper_title = excluded.paper_title,
  pdf_file = excluded.pdf_file, question_paper_html = excluded.question_paper_html,
  answer_key_html = excluded.answer_key_html, paper_format = excluded.paper_format,
  position = excluded.position`

// Positional params for UPSERT_PAPER_SQL from a normalized paper object.
function upsertParams(subjectId, classLevel, p) {
  return [
    subjectId, classLevel, p.ext_uid, p.year ?? null, p.code ?? null,
    p.set_label ?? null, p.region ?? null, p.name ?? null, p.paper_title ?? null,
    p.pdf_file ?? null, p.question_paper_html ?? null, p.answer_key_html ?? null,
    p.paper_format || 'html', p.position ?? 0,
  ]
}

module.exports = { ENSURE_PAPERS_EXT_UID, UPSERT_PAPER_SQL, upsertParams }
