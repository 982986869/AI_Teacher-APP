'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 12 MATHEMATICS Last Year Papers into Supabase (papers table) —
// the SAME table the Class 12 Physics papers importer uses, so the generic
// /papers + /paper APIs serve them unchanged:
//
//   subject(Mathematics) -> papers(class_level=12, code, year, question/answer html)
//
//   • papers ← src/data/maths12Papers/*.json  (CBSE board papers, QP + answer key)
//
// Source files carry { code, year, set, name, question_paper_html, answer_key_html }.
// The papers table is UNIQUE on (subject, class, code), so we dedup by code,
// preferring the copy that ships an answer key. Math stays as {tex}…{/tex}.
//
// Usage:
//   node scripts/importMaths12Papers.js          # DRY RUN (parse + report)
//   node scripts/importMaths12Papers.js --live    # actually insert into Supabase
//
// DB connection is read from server/.env (DATABASE_URL).
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'src', 'data', 'maths12Papers')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12

const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
function jsonFiles(dir) {
  return fs.readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => path.join(dir, f))
}

// Collect papers keyed by code; prefer the copy that has an answer key. Order
// the result by (year, code) so `position` is stable and chronological.
function collectPapers() {
  const byCode = {}
  for (const file of jsonFiles(DATA)) {
    const p = loadJson(file)
    if (!p.code) continue
    const rec = {
      code: p.code,
      year: p.year != null ? parseInt(p.year, 10) : null,
      set_label: p.set != null ? String(p.set) : String(p.code).split('/').pop(),
      name: p.name || null,
      question_paper_html: p.question_paper_html || null,
      answer_key_html: p.answer_key_html || null,
    }
    const cur = byCode[rec.code]
    // Keep the richer copy: one with an answer key wins; else the longer QP.
    if (!cur ||
        (rec.answer_key_html && !cur.answer_key_html) ||
        (!!rec.answer_key_html === !!cur.answer_key_html &&
         (rec.question_paper_html || '').length > (cur.question_paper_html || '').length)) {
      byCode[rec.code] = rec
    }
  }
  const papers = Object.values(byCode).sort((a, b) =>
    (a.year - b.year) || String(a.code).localeCompare(String(b.code), undefined, { numeric: true }))
  papers.forEach((p, i) => { p.position = i + 1 })
  return papers
}

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

async function main() {
  const papers = collectPapers()

  console.log('\n=== CLASS 12 MATHEMATICS — LAST YEAR PAPERS PARSE REPORT ===')
  console.log(`Papers (unique by code): ${papers.length}`)
  for (const p of papers) {
    console.log(`   #${String(p.position).padStart(2)} ${String(p.code).padEnd(10)} ${p.year} set ${p.set_label}  QP=${(p.question_paper_html || '').length}b AK=${(p.answer_key_html || '').length}b`)
  }

  if (!LIVE) {
    console.log('\n[DRY RUN] Nothing inserted. Live: node scripts/importMaths12Papers.js --live\n')
    return
  }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected to Supabase.')
  try {
    await client.query(fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8'))
    console.log('✓ Schema ensured.')

    const subjectId = (await client.query(
      `insert into subjects (name, slug) values ('Mathematics','mathematics')
       on conflict (slug) do update set name = excluded.name returning id`
    )).rows[0].id

    for (const p of papers) {
      await client.query(
        `insert into papers (subject_id, class_level, year, code, set_label, name, question_paper_html, answer_key_html, position)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (subject_id, class_level, code)
         do update set year=excluded.year, set_label=excluded.set_label, name=excluded.name,
           question_paper_html=excluded.question_paper_html, answer_key_html=excluded.answer_key_html, position=excluded.position`,
        [subjectId, CLASS_LEVEL, p.year, p.code, p.set_label, p.name, p.question_paper_html, p.answer_key_html, p.position])
    }
    console.log(`   ✓ papers       ${papers.length} papers (class_level=12)`)
    console.log('\n✓ Class 12 Mathematics papers import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
