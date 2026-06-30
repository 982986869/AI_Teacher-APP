'use strict'

// ───────────────────────────────────────────────────────────────────────────
// CONSOLIDATE Exemplar + NCERT onto the section model (Option A).
//
// Class 11 stored these in standalone tables (exemplar_solutions / ncert_solutions,
// served by the legacy /exemplar + /ncert endpoints). Class 12 stores them in the
// generic chapter→section→questions model (section_types exemplar_notes / ncert1 /
// ncert2, served by /content). This migrates the Class-11 standalone data INTO the
// section model so ONE API (/content) serves both classes.
//
//   exemplar_solutions (Class 11) → questions @ section_type 'exemplar_notes'
//   ncert_solutions    (Class 11) → questions @ section_type 'ncert<part>'
//
// q_number mirrors the Class-12 convention "<Section> · <Qn>" so the sub-section
// grouping (e.g. "Examples 1.2", "Chapter-end") is preserved.
//
// Non-destructive to the source: the standalone tables are LEFT INTACT as a backup.
// Idempotent: each target section's questions are cleared before re-insert.
//
//   node scripts/migrateExemplarNcertToSections.js          # DRY RUN
//   node scripts/migrateExemplarNcertToSections.js --live    # write to DB
//
// DB connection from server/.env (DATABASE_URL).
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 11
const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology']
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const textToHtml = (t) => {
  const s = String(t == null ? '' : t).trim()
  return s ? '<p>' + esc(s).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br/>') + '</p>' : ''
}
const imgsHtml = (arr) => (Array.isArray(arr) ? arr : [])
  .map((im) => {
    const u = typeof im === 'string' ? im : (im && (im.src || im.url || im.image || im.href))
    return u ? `<img src="${u}" style="max-width:100%"/>` : ''
  }).join('')

// exemplar_solutions row → questions row shape
function mapExemplar(r) {
  const opts = Array.isArray(r.options) ? r.options : []
  const usable = opts.filter((o) => (o && (o.text || (o.html))) )
  const isMcq = usable.length >= 2 && opts.some((o) => o && o.correct)
  let options = null
  let correct = null
  if (isMcq) {
    options = opts.map((o, i) => {
      const idx = LETTERS[i] || String(i + 1)
      if (o.correct && !correct) correct = idx
      return { idx, html: (o.html ? String(o.html) : textToHtml(o.text)) + imgsHtml(o.images), is_correct: !!o.correct }
    })
  }
  const qNum = r.section ? `${r.section} · ${r.qNumber || ''}`.trim().replace(/ ·\s*$/, '') : (r.qNumber || null)
  const solution =
    (r.solutionLabel ? `<p><strong>${esc(r.solutionLabel)}</strong></p>` : '') +
    textToHtml(r.solution) + imgsHtml(r.solutionImages)
  return {
    q_number: qNum,
    question_html: textToHtml(r.text) + imgsHtml(r.questionImages),
    is_mcq: isMcq,
    options,
    correct_option: correct,
    solution_html: solution || null,
  }
}

// ncert_solutions row (one section's HTML) → one questions row
function mapNcert(r) {
  return {
    q_number: r.sectionLabel || r.sectionKey || null,
    question_html: r.html || '',
    is_mcq: false,
    options: null,
    correct_option: null,
    solution_html: null,
  }
}

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

async function upsertChapter(client, subjectId, name, pos) {
  return (await client.query(
    `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
     on conflict (subject_id, class_level, slug) do update set name = excluded.name returning id`,
    [subjectId, name, slugify(name), CLASS_LEVEL, pos])).rows[0].id
}
async function upsertSection(client, chapterId, typeKey, pos) {
  return (await client.query(
    `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
     on conflict (chapter_id, type_key) do update set position = excluded.position returning id`,
    [chapterId, typeKey, pos])).rows[0].id
}
async function insertQuestions(client, sectionId, rows) {
  await client.query('delete from questions where section_id = $1', [sectionId])
  let pos = 0
  for (const q of rows) {
    await client.query(
      `insert into questions (section_id, q_number, question_html, is_mcq, options, correct_option, solution_html, position)
       values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)`,
      [sectionId, q.q_number, q.question_html, q.is_mcq,
       q.options ? JSON.stringify(q.options) : null, q.correct_option, q.solution_html, ++pos])
  }
  return rows.length
}

async function main() {
  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log(`\n=== CONSOLIDATE Class ${CLASS_LEVEL} Exemplar + NCERT → section model ===`)
  console.log(LIVE ? '(LIVE)\n' : '(DRY RUN — no writes)\n')
  try {
    const summary = []
    for (const subjectName of SUBJECTS) {
      const slug = slugify(subjectName)
      const sub = (await client.query('select id from subjects where slug = $1', [slug])).rows[0]
      if (!sub) { console.log(`! subject ${subjectName} not found — skip`); continue }
      const subjectId = sub.id

      // ── Exemplar ──────────────────────────────────────────────────────────
      const exRows = (await client.query(
        `select chapter, section, "qNumber", text, options, "solutionLabel", solution,
                "questionImages", "solutionImages", position
           from exemplar_solutions where subject = $1 and "className" = $2
          order by position asc`,
        [subjectName, `Class ${CLASS_LEVEL}`])).rows
      const exByChapter = new Map()
      for (const r of exRows) {
        if (!exByChapter.has(r.chapter)) exByChapter.set(r.chapter, [])
        exByChapter.get(r.chapter).push(mapExemplar(r))
      }

      // ── NCERT (part 1/2) ────────────────────────────────────────────────────
      const ncRows = (await client.query(
        `select chapter, part, "sectionKey", "sectionLabel", html, "chapterPos", position
           from ncert_solutions where subject = $1 and "className" = $2
          order by "chapterPos" asc, position asc`,
        [subjectName, `Class ${CLASS_LEVEL}`])).rows
      const ncByChapterPart = new Map() // key chapter|part
      for (const r of ncRows) {
        const k = `${r.chapter}|${r.part}`
        if (!ncByChapterPart.has(k)) ncByChapterPart.set(k, [])
        ncByChapterPart.get(k).push(mapNcert(r))
      }

      const exQ = [...exByChapter.values()].reduce((a, v) => a + v.length, 0)
      const ncQ = [...ncByChapterPart.values()].reduce((a, v) => a + v.length, 0)
      summary.push({ subject: subjectName, exemplar_chapters: exByChapter.size, exemplar_q: exQ, ncert_chapters: new Set([...ncByChapterPart.keys()].map((k) => k.split('|')[0])).size, ncert_rows: ncQ })

      if (!LIVE) continue

      let pos = 1000 // append exemplar/ncert chapters after existing ones
      for (const [chapter, qs] of exByChapter) {
        const chId = await upsertChapter(client, subjectId, chapter, pos++)
        const secId = await upsertSection(client, chId, 'exemplar_notes', 4)
        await insertQuestions(client, secId, qs)
      }
      for (const [key, qs] of ncByChapterPart) {
        const [chapter, part] = key.split('|')
        const chId = await upsertChapter(client, subjectId, chapter, pos++)
        const typeKey = `ncert${part}`
        const secId = await upsertSection(client, chId, typeKey, part === '1' ? 5 : 6)
        await insertQuestions(client, secId, qs)
      }
      console.log(`✓ ${subjectName}: exemplar ${exByChapter.size} ch / ${exQ} q · ncert ${ncByChapterPart.size} sec / ${ncQ} rows`)
    }
    console.log('\nPlan / result:')
    console.table(summary)
    if (!LIVE) console.log('\nAdd --live to apply.\n')
    else console.log('\n✓ Consolidation complete. Standalone tables left intact (backup).')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
