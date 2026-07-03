'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 7 "Old - हिंदी" Online Tests from LOCAL data into ot_tests /
// ot_questions (same model as scripts/seedClass7OnlineTests.js), sourced from
// old_hindi/online_test/ instead of examin8.
//
// Also writes checkpoint src/data/class7OnlineTests/old-hindi.json.
//
//   node scripts/seedClass7OldHindiOnlineTests.js            # DRY (build + checkpoint)
//   node scripts/seedClass7OldHindiOnlineTests.js --live     # seed DATABASE_URL (server/.env)
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 7
const SUBJECT = 'Old - हिंदी'
const SRC = path.join(ROOT, 'old_hindi', 'online_test')
const CACHE = path.join(ROOT, 'src', 'data', 'class7OnlineTests')

const trim = (s) => (s == null ? '' : String(s)).trim()
const esc = (s) => trim(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const slugify = (s) => {
  const base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base) return base
  let h = 5381; const str = String(s)
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  return 'u' + h.toString(36)
}
const imgs = (arr) => (Array.isArray(arr) ? arr : []).map((u) => `<img src="${trim(u)}" alt="" />`).join('')

function mapQ(q, pos) {
  const options = (q.options || []).map((o) => ({ id: o.id, html: esc(o.text) + imgs(o.images) }))
  const correct = (q.options || []).find((o) => o.is_correct)
  const marks = parseInt(q.marks, 10) || 1
  return {
    extQuestionId: q.id,
    question: esc(q.question) + imgs(q.images),
    options,
    correctOptionId: correct ? correct.id : null,
    explanation: trim(q.solution) ? esc(q.solution) : '',
    marks,
    position: pos,
  }
}

function build() {
  const idx = JSON.parse(fs.readFileSync(path.join(SRC, 'index.json'), 'utf8'))
  const chapters = []
  ;(idx.chapters || []).forEach((ch, ci) => {
    const chDir = path.join(SRC, ch.folder)
    if (!fs.existsSync(chDir)) { console.warn('  ! missing chapter folder:', ch.folder); return }
    const files = fs.readdirSync(chDir).filter((f) => f.endsWith('.json') && f !== 'index.json').sort()
    const tests = []
    files.forEach((f) => {
      const t = JSON.parse(fs.readFileSync(path.join(chDir, f), 'utf8'))
      const questions = (t.questions || []).map((q, i) => mapQ(q, i))
      if (!questions.length) return
      const totalMarks = questions.reduce((n, q) => n + q.marks, 0)
      tests.push({
        extTestId: t.testpaper_id,
        name: trim(t.testpaper_name),
        instructionHtml: '',
        durationMin: parseInt(t.duration_min, 10) || 0,
        totalMarks,
        isPaid: !!t.is_paid,
        position: tests.length,
        questions,
      })
    })
    if (tests.length) chapters.push({ id: ch.chapter_id, name: trim(ch.chapter_name), position: ci, tests })
  })
  return { name: SUBJECT, slug: slugify(SUBJECT), res: idx.subject_id, chapters }
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function insertQuestions(client, testId, questions) {
  if (!questions.length) return
  const tuples = [], params = []
  questions.forEach((q, i) => {
    const b = i * 8
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8})`)
    params.push(testId, q.extQuestionId, q.question, JSON.stringify(q.options), q.correctOptionId, q.explanation || null, q.marks, i)
  })
  await client.query(`insert into ot_questions (ot_test_id, ext_question_id, question_html, options, correct_option_id, explanation_html, marks, position) values ${tuples.join(',')}`, params)
}

async function main() {
  const doc = build()
  const tests = doc.chapters.reduce((n, c) => n + c.tests.length, 0)
  const totQ = doc.chapters.reduce((n, c) => n + c.tests.reduce((a, t) => a + t.questions.length, 0), 0)
  const ans = doc.chapters.reduce((n, c) => n + c.tests.reduce((a, t) => a + t.questions.filter((q) => q.correctOptionId != null).length, 0), 0)
  console.log(`\nClass 7 "Old - हिंदी" Online Tests (${LIVE ? 'LIVE' : 'DRY'})`)
  console.log(`  ${doc.chapters.length} chapters · ${tests} tests · ${totQ} questions · ${ans} answered · slug=${doc.slug}\n`)

  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(path.join(CACHE, 'old-hindi.json'), JSON.stringify(doc, null, 2))
  console.log('  ✓ checkpoint written: src/data/class7OnlineTests/old-hindi.json')

  if (!LIVE) { console.log('\n[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')
  try {
    // ot_tests / ot_questions already exist (created by seedClass7OnlineTests.js).
    await client.query('delete from ot_tests where subject_slug = $1 and class_level = $2', [doc.slug, CLASS_LEVEL])
    let nTests = 0, nQ = 0
    for (const ch of doc.chapters) {
      for (const t of ch.tests) {
        const r = await client.query(
          `insert into ot_tests (subject_slug, subject_name, class_level, chapter_name, chapter_slug, chapter_pos, ext_test_id, name, instruction_html, duration_min, total_marks, is_paid, position)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
          [doc.slug, doc.name, CLASS_LEVEL, ch.name, slugify(ch.name), ch.position, t.extTestId, t.name, t.instructionHtml, t.durationMin, t.totalMarks, t.isPaid, t.position])
        await insertQuestions(client, r.rows[0].id, t.questions)
        nTests++; nQ += t.questions.length
      }
    }
    console.log(`  ✓ ${doc.name}: ${doc.chapters.length} chapters, ${nTests} tests, ${nQ} questions (class_level=7)`)
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
