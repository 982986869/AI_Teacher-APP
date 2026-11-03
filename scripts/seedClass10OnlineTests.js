'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed a Class 10 subject's "Online Tests" into ot_tests /
// ot_questions — the tables OnlineTestScreen reads.
//
// WHY
//   The Class 10 import took only each chapter's ONE free testpaper, so the app
//   showed "Test - 01" and nothing else. examin8 publishes five per chapter
//   (Test-01 … Test-05, the last four behind the subscription this account has),
//   so four of every five tests were missing.
//
// examin8 structure (same chain the Class 6-9 seeders walk):
//   /v1/category/:subjectId/         → { categories:[chapters] }
//   /v1/category/:chapterId/         → { testpapers:[free], testpapers_paid:[paid] }
//   /v1/quiz/testpaper/:testPaperId/ → { testPaperName, testDuration, noOfQuestions,
//                                        testPaperInstruction, sections:[{questions}] }
//
// ANSWERS
//   A testpaper's options carry no key — examin8 only reveals it per question via
//   POST /v1/practice/attempted/, which RECORDS AN ATTEMPT on the logged-in
//   account (this is why a seeded chapter later reads "Attempted" on their site).
//   That is how every existing ot_questions key in this DB was obtained; there is
//   no read-only endpoint that returns it.
//
//   Each reveal is cached to data/examin8/class10/raw/online-tests/answers.json,
//   so a re-run never re-POSTs a question it has already asked about.
//
// SAFETY
//   DRY-RUN by default. Resumable: a testpaper whose ext_test_id is already in
//   ot_tests is skipped, so this never duplicates the five tests already seeded.
//   DATABASE_URL picks the target DB; server/.env is the fallback.
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass10OnlineTests.js
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass10OnlineTests.js --live
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const B = 'https://web.examin8.com/v1'
const LIVE = process.argv.includes('--live')
const DELAY = Number(process.env.DELAY || 140)

const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF

const CLASS_LEVEL = Number(process.env.CLASS || 10)
// Which subject to seed. All three must agree with the DB's existing rows, or the
// new tests file themselves under a subject the app never looks up — the slug is
// what OnlineTestScreen passes to listChapters.
//   SUBJECT_ID   examin8 category id (the /resources/<id> in the website URL)
//   SUBJECT_NAME subjects.name / ot_tests.subject_name
//   SUBJECT_SLUG subjects.slug / ot_tests.subject_slug
const SUBJECT = {
  name: process.env.SUBJECT_NAME || 'Information Technology (402)',
  slug: process.env.SUBJECT_SLUG || 'information-technology-402',
  res: process.env.SUBJECT_ID || '7595',
}

const CACHE_DIR = path.join(ROOT, 'data', 'examin8', 'class10', 'raw', 'online-tests')
const ANSWERS = path.join(CACHE_DIR, 'answers.json')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (v) => (v == null || v === '' ? null : Number(v))

// Byte-identical to the client slugify so chapter lookups round-trip.
const slugify = (s) => {
  const base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base) return base
  let h = 5381
  const str = String(s)
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  return 'u' + h.toString(36)
}

const headers = (post) => Object.assign(
  { accept: 'application/json', referer: 'https://web.examin8.com/' },
  post ? { 'content-type': 'application/json' } : {},
  CSRF ? { 'x-csrftoken': CSRF } : {},
  COOKIE ? { cookie: COOKIE } : {},
)

// Retries transient failures. Without this a single dropped connection silently
// loses a whole testpaper: the error is logged, the loop moves on, and the test is
// simply absent from the DB with nothing to show it was ever attempted.
async function get(url, tries = 3) {
  let last
  for (let a = 1; a <= tries; a++) {
    try {
      const r = await fetch(url, { headers: headers(false) })
      if (r.status === 401 || r.status === 403) throw Object.assign(new Error('AUTH ' + r.status), { fatal: true })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return await r.json()
    } catch (e) {
      if (e.fatal) throw e
      last = e
      if (a < tries) await sleep(DELAY * a * 3)
    }
  }
  throw last
}

// ── db ───────────────────────────────────────────────────────────────────────
function getDbUrl() {
  let u = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '')
  if (!u) {
    const envPath = path.join(ROOT, 'server', '.env')
    if (!fs.existsSync(envPath)) throw new Error('No database: set DATABASE_URL, or create server/.env')
    const m = fs.readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.*)$/m)
    if (!m) throw new Error('server/.env has no DATABASE_URL')
    u = m[1].trim().replace(/^["']|["']$/g, '')
  }
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}
function dbSsl() {
  try {
    const h = new URL(getDbUrl()).hostname
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false
  } catch (_) {}
  return { rejectUnauthorized: false }
}
const dbLabel = () => {
  try { const x = new URL(getDbUrl()); return x.hostname + (x.port ? ':' + x.port : '') + x.pathname }
  catch (_) { return '(unparseable DATABASE_URL)' }
}

// ── answer cache ─────────────────────────────────────────────────────────────
let answerCache = {}
function loadCache() {
  try { answerCache = JSON.parse(fs.readFileSync(ANSWERS, 'utf8')) } catch (_) { answerCache = {} }
}
function saveCache() {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(ANSWERS, JSON.stringify(answerCache, null, 2))
}

// Reveal one question's key. The POST is the only way examin8 exposes it, and it
// records an attempt — so the cache above matters: it keeps a re-run from adding
// a second attempt for a question already answered.
async function reveal(questionId, optionId, categoryId, stat, tries = 3) {
  const hit = answerCache[String(questionId)]
  if (hit) { stat.cached += 1; return hit }
  const body = JSON.stringify({ question: questionId, option: optionId, time_taken: 4, category: categoryId })
  for (let a = 1; a <= tries; a++) {
    try {
      const r = await fetch(`${B}/practice/attempted/`, { method: 'POST', headers: headers(true), body })
      if (r.status === 401 || r.status === 403) throw Object.assign(new Error('AUTH ' + r.status), { fatal: true })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const j = await r.json()
      const out = {
        correctOptionId: j.correct_option != null ? Number(j.correct_option) : null,
        explanation: trim(j.explanation) || '',
      }
      answerCache[String(questionId)] = out
      stat.revealed += 1
      await sleep(DELAY)
      return out
    } catch (e) {
      if (e.fatal) throw e
      if (a === tries) { stat.revealFailed += 1; return { correctOptionId: null, explanation: '' } }
      await sleep(DELAY * a * 2)
    }
  }
  return { correctOptionId: null, explanation: '' }
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!COOKIE || !CSRF) {
    console.error('✗ EXAMIN8_COOKIE and EXAMIN8_CSRF are required (these endpoints 403 without a session).')
    process.exit(1)
  }
  loadCache()

  const { Client } = require('pg')
  const pg = new Client({ connectionString: getDbUrl(), ssl: dbSsl() })
  await pg.connect()

  console.log(`\nOnline Tests — class ${CLASS_LEVEL} · ${SUBJECT.name}`)
  console.log(`  database : ${dbLabel()}`)
  console.log(`  mode     : ${LIVE ? 'LIVE (writes)' : 'DRY-RUN (fetches + reveals; writes nothing)'}`)

  const existing = new Set(
    (await pg.query('SELECT ext_test_id FROM ot_tests WHERE class_level=$1 AND subject_slug=$2', [CLASS_LEVEL, SUBJECT.slug]))
      .rows.map((r) => String(r.ext_test_id)),
  )
  console.log(`  already in DB : ${existing.size} tests`)

  const subject = await get(`${B}/category/${SUBJECT.res}/`)
  const chapters = subject.categories || []
  console.log(`  chapters      : ${chapters.length}\n`)

  const stat = { tests: 0, skipped: 0, questions: 0, revealed: 0, cached: 0, revealFailed: 0, noKey: 0 }

  // Ids are assigned explicitly (these tables carry no sequence default) — carry on
  // from the current maximum rather than colliding with the seeded rows.
  let nextTestId = Number((await pg.query('SELECT COALESCE(MAX(id),0)+1 AS n FROM ot_tests')).rows[0].n)
  let nextQId = Number((await pg.query('SELECT COALESCE(MAX(id),0)+1 AS n FROM ot_questions')).rows[0].n)

  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci]
    const chapterName = trim(ch.name)
    const chapterSlug = slugify(chapterName)
    const detail = await get(`${B}/category/${ch.id}/`)
    await sleep(DELAY)

    const free = (detail.testpapers || []).map((t) => ({ t, paid: false }))
    const paid = (detail.testpapers_paid || []).map((t) => ({ t, paid: true }))
    const papers = [...free, ...paid]
    console.log(`  ${chapterName}  (${papers.length} testpapers)`)

    for (let pi = 0; pi < papers.length; pi++) {
      const { t, paid: isPaid } = papers[pi]
      const extId = String(t.id != null ? t.id : t.testPaperID)
      if (existing.has(extId)) { stat.skipped += 1; console.log(`      · ${extId} already seeded — skipped`); continue }

      let paper
      try { paper = await get(`${B}/quiz/testpaper/${extId}/`) }
      catch (e) { console.log(`      ! ${extId} fetch failed: ${e.message}`); continue }
      await sleep(DELAY)

      const qRows = []
      for (const sec of (paper.sections || [])) {
        for (const q of (sec.questions || [])) {
          const opts = (q.options || []).map((o) => ({ id: num(o.optionID), html: trim(o.option) }))
          if (!opts.length) continue
          const { correctOptionId, explanation } = await reveal(q.questionID, opts[0].id, ch.id, stat)
          if (correctOptionId == null) stat.noKey += 1
          qRows.push({
            extQuestionId: num(q.questionID),
            questionHtml: trim(q.question),
            options: opts,
            correctOptionId,
            explanationHtml: explanation,
            marks: num(q.questionMark) || 1,
            position: qRows.length,
          })
        }
      }
      saveCache()

      const name = trim(paper.testPaperName) || `${chapterName} Test`
      console.log(`      + ${name}  (${qRows.length} questions${isPaid ? ', paid' : ''})`)
      stat.tests += 1
      stat.questions += qRows.length
      // Claim the id immediately. The skip-set is built once at startup, so a
      // testpaper listed under two chapters in the SAME run would otherwise pass
      // the check twice and be inserted twice — the DB has no unique index on
      // ext_test_id to catch it.
      existing.add(extId)

      if (!LIVE) continue

      const testId = nextTestId++
      await pg.query(
        `INSERT INTO ot_tests
           (id, subject_slug, subject_name, class_level, chapter_name, chapter_slug, chapter_pos,
            ext_test_id, name, instruction_html, duration_min, total_marks, is_paid, position, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
         ON CONFLICT (id) DO NOTHING`,
        [testId, SUBJECT.slug, SUBJECT.name, CLASS_LEVEL, chapterName, chapterSlug, ci,
          Number(extId), name, trim(paper.testPaperInstruction), num(paper.testDuration),
          qRows.length, isPaid, pi],
      )
      for (const q of qRows) {
        await pg.query(
          `INSERT INTO ot_questions
             (id, ot_test_id, ext_question_id, question_html, options, correct_option_id,
              explanation_html, marks, position)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)
           ON CONFLICT (id) DO NOTHING`,
          [nextQId++, testId, q.extQuestionId, q.questionHtml, JSON.stringify(q.options),
            q.correctOptionId, q.explanationHtml, q.marks, q.position],
        )
      }
    }
  }

  // The seeded Test-01 rows all carry chapter_pos 0, so chapters sorted arbitrarily
  // against the new rows. Align them to examin8's own chapter order.
  if (LIVE) {
    for (let ci = 0; ci < chapters.length; ci++) {
      await pg.query(
        'UPDATE ot_tests SET chapter_pos=$1 WHERE class_level=$2 AND subject_slug=$3 AND chapter_slug=$4',
        [ci, CLASS_LEVEL, SUBJECT.slug, slugify(trim(chapters[ci].name))],
      )
    }
  }

  saveCache()
  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Tests added       : ${LIVE ? stat.tests : 0}${LIVE ? '' : `  (dry-run — ${stat.tests} ready)`}`)
  console.log(`  Already seeded    : ${stat.skipped}`)
  console.log(`  Questions         : ${stat.questions}`)
  console.log(`  Keys revealed     : ${stat.revealed} new, ${stat.cached} from cache`)
  console.log(`  Questions with NO key : ${stat.noKey}`)
  console.log(`  Reveal failures   : ${stat.revealFailed}`)
  if (!LIVE) console.log('\n[DRY] add --live to write.')

  await pg.end()
}

main().catch((e) => { console.error('FAILED:', e && e.message ? e.message : e); process.exit(1) })
