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

-- 2. Chapters inside a subject
create table if not exists chapters (
  id          bigint generated always as identity primary key,
  subject_id  bigint not null references subjects(id) on delete cascade,
  name        text not null,
  slug        text not null,
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (subject_id, slug)
);

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

create index if not exists idx_chapters_subject on chapters(subject_id);
create index if not exists idx_sections_chapter  on sections(chapter_id);
create index if not exists idx_questions_section  on questions(section_id);

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
  ('revision_solutions',  'Revision Solutions',      3),
  ('exemplar_notes',      'Exemplar Notes',          4)
  -- TODO: add the remaining ~5 section types (key, label, position)
on conflict (key) do nothing;
