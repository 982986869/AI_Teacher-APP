'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Rebuild Class 12 "Last Year Papers" for a subject (or all) to the FULL set,
// from the dataExtraction-Class12 examin8 output. Generic version of the
// Chemistry migrator — Chemistry additionally has an older PDF-only archive.
//
//   Recent (2019–2025) HTML papers, keyed by uuid:
//     …/packages/<Subject>_Last_Year_Papers/papers_json/*.json
//   Older (2005–2020) PDF-only papers, keyed by 'pdf:<id>'  (CHEMISTRY ONLY):
//     …/last_year_papers_pdf/Chemistry/_index.json
//
//   Physics    : 109 HTML            (no PDF archive)
//   Mathematics: 109 HTML            (no PDF archive)
//   Chemistry  : 109 HTML + 79 PDF = 188
//
// Identity is the source `ext_uid` (uuid / pdf:<id>) — see lib/papersSchema.js.
//
//   node scripts/migratePapers.js --subject=physics                 # DRY RUN
//   node scripts/migratePapers.js --subject=physics --live          # delete old + insert
//   node scripts/migratePapers.js --subject=all --live              # all three
//
// DB connection from server/.env (DATABASE_URL). Re-runnable.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const { ENSURE_PAPERS_EXT_UID, UPSERT_PAPER_SQL, upsertParams } = require('./lib/papersSchema')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 12
const arg = (name, def) => {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`))
  return a ? a.slice(name.length + 3) : def
}
const EXTRACT = arg('extract', 'f:/dataExtraction-Class12/scripts/examin8_output')
const pkg = (Subject) => `${EXTRACT}/packages/${Subject}_Last_Year_Papers/papers_json`

const SUBJECTS = {
  physics:     { name: 'Physics',     slug: 'physics',     html: pkg('Physics'),     pdf: null },
  chemistry:   { name: 'Chemistry',   slug: 'chemistry',   html: pkg('Chemistry'),   pdf: `${EXTRACT}/last_year_papers_pdf/Chemistry` },
  mathematics: { name: 'Mathematics', slug: 'mathematics', html: pkg('Mathematics'), pdf: null },
}

const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const jsonFiles = (dir) => fs.readdirSync(dir)
  .filter((f) => f.toLowerCase().endsWith('.json'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((f) => path.join(dir, f))

// ── Recent papers (HTML), keyed by uuid ──────────────────────────────────────
function collectHtmlPapers(dir) {
  const seen = new Set()
  const out = []
  jsonFiles(dir).forEach((file, i) => {
    const p = loadJson(file)
    if (!p.uuid || seen.has(p.uuid)) return
    seen.add(p.uuid)
    out.push({
      ext_uid: p.uuid,
      paper_format: 'html',
      code: p.code || null,
      year: p.year != null ? parseInt(p.year, 10) : null,
      set_label: p.set != null ? String(p.set) : (p.code ? String(p.code).split('/').pop() : null),
      region: null,
      name: p.name || null,
      paper_title: null,
      pdf_file: null,
      question_paper_html: p.question_paper_html || null,
      answer_key_html: p.answer_key_html || null,
      position: i + 1,
    })
  })
  return out
}

// ── Older papers (PDF only), keyed by pdf:<id> ───────────────────────────────
function collectPdfPapers(dir) {
  const idxPath = path.join(dir, '_index.json')
  if (!fs.existsSync(idxPath)) return []
  return loadJson(idxPath).map((e, i) => {
    const title = e.title || ''
    const fnYear = (String(e.file_name).match(/(?:19|20)\d{2}/) || [])[0]
    const titleYear = (title.match(/Question Paper\s+(\d{4})/) || [])[1]
    const year = parseInt(fnYear || titleYear || '0', 10) || null
    const set = (title.match(/Set\s*-\s*([0-9A-Za-z]+)/) || [])[1] || null
    const after = title.split(/\(Chemistry\)|\(Physics\)|\(Mathematics\)/i)[1]
    return {
      ext_uid: `pdf:${e.id}`,
      paper_format: 'pdf',
      code: null,
      year,
      set_label: set,
      region: after && after.trim() ? after.trim() : null,
      name: title.replace(/Question Paper.*?\(([^)]+)\).*/, '$1 (Theory)') || null,
      paper_title: title || null,
      pdf_file: e.file_name || null,
      question_paper_html: null,
      answer_key_html: null,
      position: 1000 + i,
    }
  })
}

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

function collectFor(cfg) {
  if (!fs.existsSync(cfg.html)) throw new Error(`HTML source not found: ${cfg.html}`)
  const html = collectHtmlPapers(cfg.html)
  const pdf = cfg.pdf ? collectPdfPapers(cfg.pdf) : []
  const all = [...html, ...pdf]
  const ids = new Set(); all.forEach((p) => ids.add(p.ext_uid))
  return { html, pdf, all, distinct: ids.size }
}

async function main() {
  const which = (arg('subject', '') || '').toLowerCase()
  const slugs = which === 'all' ? Object.keys(SUBJECTS) : [which]
  if (!which || slugs.some((s) => !SUBJECTS[s])) {
    console.error('Usage: node scripts/migratePapers.js --subject=physics|chemistry|mathematics|all [--live]')
    process.exit(1)
  }

  const plan = slugs.map((s) => ({ cfg: SUBJECTS[s], ...collectFor(SUBJECTS[s]) }))
  console.log('\n=== CLASS 12 — LAST YEAR PAPERS (FULL) ===')
  for (const p of plan) {
    console.log(`${p.cfg.name.padEnd(12)} html=${p.html.length} pdf=${p.pdf.length} → distinct ext_uid=${p.distinct}`)
    const noYear = p.all.filter((x) => !x.year)
    if (noYear.length) console.log(`   ⚠ ${noYear.length} with no parsed year: ${noYear.map((x) => x.ext_uid).join(', ')}`)
  }

  if (!LIVE) {
    console.log('\n[DRY RUN] No DB writes. Add --live to apply.\n')
    return
  }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected to Supabase.')
  try {
    await client.query(ENSURE_PAPERS_EXT_UID)
    console.log('✓ papers schema ensured (identity = subject, class, ext_uid).')

    for (const p of plan) {
      const subjectId = (await client.query(
        `insert into subjects (name, slug) values ($1,$2)
         on conflict (slug) do update set name = excluded.name returning id`,
        [p.cfg.name, p.cfg.slug])).rows[0].id

      await client.query('begin')
      try {
        const del = await client.query(
          'delete from papers where subject_id = $1 and class_level = $2', [subjectId, CLASS_LEVEL])
        for (const paper of p.all) {
          await client.query(UPSERT_PAPER_SQL, upsertParams(subjectId, CLASS_LEVEL, paper))
        }
        await client.query('commit')
        const after = (await client.query(
          'select count(*)::int n from papers where subject_id=$1 and class_level=$2', [subjectId, CLASS_LEVEL])).rows[0].n
        console.log(`   ✓ ${p.cfg.name.padEnd(12)} deleted ${del.rowCount}, inserted ${p.all.length} → DB now ${after}`)
      } catch (e) {
        await client.query('rollback')
        throw e
      }
    }
    console.log('\n✓ Last Year Papers migration complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
