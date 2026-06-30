-- ============================================================
-- Ailernova "Resources" schema  (Supabase / PostgreSQL)
-- Shape:  subject -> chapter -> section -> question  (STRUCTURED)
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- 1. Subjects (Physics, Chemistry, Mathematics, Biology)
create table if not exists subjects (
  id          bigint generated always as identity primary key,
  name        text not null,
  slug        text not null unique,        -- 'physics', 'chemistry', ...
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

-- 2. Chapters inside a subject (class_level tags the grade: 9/10/11/12).
--    A subject stays a single row, shared across classes; the chapter carries
--    the class, and everything below (sections, questions, subtopics,
--    mcq_questions) inherits class via its chapter.
create table if not exists chapters (
  id          bigint generated always as identity primary key,
  subject_id  bigint not null references subjects(id) on delete cascade,
  name        text not null,
  slug        text not null,
  class_level int  not null default 11,
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (subject_id, class_level, slug)
);
create index if not exists idx_chapters_subject_class on chapters(subject_id, class_level);

-- 3. Section TYPES (pyq, important_questions, revision_solutions, exemplar_notes, ...)
create table if not exists section_types (
  key         text primary key,            -- machine name, e.g. 'pyq'
  label       text not null,               -- display name
  position    int  not null default 0
);

-- 4. A SECTION = one content block of a given type inside a chapter
create table if not exists sections (
  id          bigint generated always as identity primary key,
  chapter_id  bigint not null references chapters(id) on delete cascade,
  type_key    text   not null references section_types(key),
  position    int    not null default 0,
  created_at  timestamptz not null default now(),
  unique (chapter_id, type_key)
);

-- 5. QUESTIONS (structured)
create table if not exists questions (
  id              bigint generated always as identity primary key,
  section_id      bigint not null references sections(id) on delete cascade,
  q_number        text,                     -- 'Q1'
  year            text,                     -- '2020, 2018'
  question_html   text not null,            -- question body (HTML kept for math/sup/sub)
  is_mcq          boolean not null default false,
  options         jsonb,                    -- [{ "idx":"A", "html":"...", "is_correct":true }, ...]
  correct_option  text,                     -- 'A'/'B'/'C'/'D' for grading
  solution_html   text,                     -- worked solution (HTML)
  position        int not null default 0,
  created_at      timestamptz not null default now()
);

-- 6. NOTES — long-form revision-notes content (NOT question/answer).
--    One row per (chapter, revision_notes) section.
create table if not exists notes (
  id          bigint generated always as identity primary key,
  section_id  bigint not null references sections(id) on delete cascade,
  intro       text,
  blocks      jsonb,                    -- [{ title, content, bullets:[...] }]
  created_at  timestamptz not null default now(),
  unique (section_id)
);

create index if not exists idx_chapters_subject on chapters(subject_id);
create index if not exists idx_sections_chapter  on sections(chapter_id);
create index if not exists idx_questions_section  on questions(section_id);
create index if not exists idx_notes_section      on notes(section_id);

-- ------------------------------------------------------------
-- Seed: the 4 subjects
-- ------------------------------------------------------------
insert into subjects (name, slug, position) values
  ('Physics',     'physics',     1),
  ('Chemistry',   'chemistry',   2),
  ('Mathematics', 'mathematics', 3),
  ('Biology',     'biology',     4)
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Seed: section types   <-- EDIT to your real ~9 sections
-- ------------------------------------------------------------
insert into section_types (key, label, position) values
  ('pyq',                 'Previous Year Questions', 1),
  ('important_questions', 'Important Questions',     2),
  ('revision_notes',      'Revision Notes',          3),
  ('exemplar_notes',      'Exemplar Notes',          4),
  ('ncert1',              'NCERT Solutions Part-I',  5),
  ('ncert2',              'NCERT Solutions Part-II', 6),
  ('online_test',         'Online Tests',            7)
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- 7. PAPERS — full board "Last Year Papers" (question paper + answer key as
--    self-contained HTML). Subject-level (not per-chapter), tagged by class.
-- ------------------------------------------------------------
create table if not exists papers (
  id                  bigint generated always as identity primary key,
  subject_id          bigint not null references subjects(id) on delete cascade,
  class_level         int  not null default 12,
  ext_uid             text not null,            -- stable source id: uuid (HTML) | 'pdf:<id>' (PDF)
  year                int,                      -- 2019
  code                text,                     -- '55/1/1' (null for PDF-only papers)
  set_label           text,                     -- '1'
  region              text,                     -- 'Delhi' | 'Outside Delhi' | 'Foreign' | …
  name                text,                     -- 'PHYSICS (Theory)'
  paper_title         text,                     -- source title (esp. PDF papers)
  pdf_file            text,                     -- PDF filename for download-only papers
  paper_format        text not null default 'html',  -- 'html' | 'pdf'
  question_paper_html text,
  answer_key_html     text,
  position            int  not null default 0,
  created_at          timestamptz not null default now(),
  -- A paper is identified by its source ext_uid. code+year is NOT unique: some
  -- HTML papers share code+year+set (distinct documents), and PDFs have no code.
  unique (subject_id, class_level, ext_uid)
);
create index if not exists idx_papers_subject_class on papers(subject_id, class_level);
