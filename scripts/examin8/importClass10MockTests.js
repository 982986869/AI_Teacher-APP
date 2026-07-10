'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Phase 2E — import Class 10 Mock Tests into the EXISTING mock_tests +
// mock_test_questions tables (the same tables Class 11/12 use; NO new tables).
//
// Reads normalized/mock-tests.json (the shape server/scripts/seed-physics-mock-tests.js
// consumes) and upserts with the SAME column mapping, plus two Class-10 specifics:
//   • class_level = 10   (the live-DB discriminator the mock service filters on;
//                         the physics seed omits it — default is 11)
//   • test id    = ID_OFFSET + examin8 testPaperID   (caller-provided integer PKs
//                  are shared across all classes; offsetting guarantees no collision
//                  with existing rows — current ids are 174..1_906_173)
//
// question row: options jsonb [{id,text,is_correct}], correct_option_ids/texts,
// correct_index (0-based index of the correct option — the field the server scores
// against), explanation. question/options/explanation HTML+math preserved verbatim
// (McqTestScreen renders HTML+LaTeX via MathText).
//
// Idempotent: upsert mock_tests by id; per test, delete its questions then insert
// (keeps mock_test_attempts intact — no cascade, questions have no inbound FK).
//
//   node scripts/examin8/importClass10MockTests.js            # DRY RUN
//   node scripts/examin8/importClass10MockTests.js --live     # apply + verify
//   node scripts/examin8/importClass10MockTests.js --verify   # verify only
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const LIVE = process.argv.includes('--live')
const VERIFY_ONLY = process.argv.includes('--verify')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const NORM = path.join(ROOT, 'data', 'examin8', CLASS_DIR, 'normalized')
const CLASS_LEVEL = 10
const ID_OFFSET = 100000000 // Class-10 mock id namespace (existing max ~1.9M)

const VERIFY_TARGETS = ['Mathematics', 'Science', 'Social Science']

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
    .match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

const TEST_UPSERT = `
insert into mock_tests
  (id, subject, name, category_full_name, duration_min, no_of_questions, instruction,
   section_count, question_count, source_extracted_at, class_level, updated_at)
values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
on conflict (id) do update set
  subject=excluded.subject, name=excluded.name, category_full_name=excluded.category_full_name,
  duration_min=excluded.duration_min, no_of_questions=excluded.no_of_questions,
  instruction=excluded.instruction, section_count=excluded.section_count,
  question_count=excluded.question_count, class_level=excluded.class_level, updated_at=now()`

const QUESTION_INSERT = `
insert into mock_test_questions
  (id, test_id, order_index, section_name, section_id, question, question_raw,
   options, correct_option_ids, correct_option_texts, correct_index, explanation)
values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12)`

// Flatten one normalized test into { test, questions[] } DB rows.
function toRows(subject, t) {
  const testId = ID_OFFSET + Number(t.testPaperID)
  const sections = t.sections || []
  const questionCount = sections.reduce((n, s) => n + (s.questions || []).length, 0)
  const questions = []
  let order = 0
  for (const s of sections) {
    for (const q of (s.questions || [])) {
      const options = (q.options || []).map((o) => ({ id: o.id, text: String(o.text != null ? o.text : ''), is_correct: o.is_correct === true }))
      const correctIndex = options.findIndex((o) => o.is_correct === true)
      questions.push({
        id: Number(q.questionID),
        test_id: testId,
        order_index: order++,
        section_name: s.sectionName || null,
        section_id: s.sectionID != null ? Number(s.sectionID) : null,
        question: String(q.question != null ? q.question : ''),           // verbatim HTML/math
        question_raw: String(q.question_raw != null ? q.question_raw : q.question || ''),
        options: JSON.stringify(options),
        correct_option_ids: JSON.stringify(q.correct_option_ids || options.filter((o) => o.is_correct).map((o) => o.id)),
        correct_option_texts: JSON.stringify(q.correct_option_texts || options.filter((o) => o.is_correct).map((o) => o.text)),
        correct_index: correctIndex >= 0 ? correctIndex : null,
        explanation: q.explanation != null ? String(q.explanation) : null,
      })
    }
  }
  return {
    test: [testId, subject, t.testPaperName || `Mock Test ${t.testPaperID}`, t.category_full_name || null,
      t.testDuration_min != null ? Number(t.testDuration_min) : null,
      t.noOfQuestions != null ? Number(t.noOfQuestions) : questionCount,
      t.instruction || null, sections.length, questionCount, null, CLASS_LEVEL],
    questions,
  }
}

async function verify(client) {
  console.log('\n── VERIFY ─────────────────────────────')
  let allPass = true
  const check = (c, m) => { console.log(`     ${c ? '✓' : '✗'} ${m}`); if (!c) allPass = false }
  for (const subject of VERIFY_TARGETS) {
    // Mirror mockTest.service.listTests: subject + class_level=10.
    const tq = await client.query(
      `select id, name, question_count from mock_tests where subject=$1 and class_level=$2 order by id`,
      [subject, CLASS_LEVEL])
    console.log(`\n  ${subject}`)
    check(tq.rows.length > 0, `mock tests for Class 10 (${tq.rows.length})`)
    if (!tq.rows.length) continue
    const testId = tq.rows[0].id
    const qq = await client.query(
      `select order_index, section_name, question, options, correct_index, explanation
         from mock_test_questions where test_id=$1 order by order_index`, [testId])
    const qs = qq.rows
    check(qs.length > 0, `"${tq.rows[0].name}" questions (${qs.length})`)
    check(qs.every((q, i) => q.order_index === i), 'question ordering preserved (0..n)')
    check(qs.every((q) => q.correct_index != null && q.correct_index >= 0), 'every question has a correct answer (correct_index)')
    check(qs.every((q) => Array.isArray(q.options) && q.options.length >= 2), 'options preserved (≥2 each)')
    check(qs.filter((q) => q.explanation && q.explanation.trim()).length > 0, 'explanations preserved')
    const html = qs.map((q) => String(q.question) + JSON.stringify(q.options) + String(q.explanation || '')).join('')
    const hasMath = /math-tex|\{tex\}/.test(html)
    // Social Science mocks (civics/history/geography) legitimately have no math.
    if (subject === 'Social Science') console.log(`     ${hasMath ? '✓' : '·'} math formulas: ${hasMath ? 'present' : 'none (text subject — expected)'}`)
    else check(hasMath, 'math formulas preserved (math-tex / {tex})')
    const sections = new Set(qs.map((q) => q.section_name))
    check(sections.size >= 1, `sections preserved (${[...sections].join(', ')})`)
  }
  console.log(`\n  ${allPass ? '✓ ALL VERIFY CHECKS PASSED' : '✗ SOME CHECKS FAILED'}`)
  return allPass
}

async function main() {
  const outPath = path.join(NORM, 'mock-tests.json')
  const data = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : []

  if (VERIFY_ONLY) {
    const { Client } = require('pg')
    const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
    await client.connect()
    try { await verify(client) } finally { await client.end() }
    return
  }

  let totTests = 0, totQ = 0
  for (const s of data) for (const t of s.mock_tests) { totTests++; totQ += (t.sections || []).reduce((n, x) => n + (x.questions || []).length, 0) }
  console.log(`\nImport Mock Tests → mock_tests + mock_test_questions (class_level=${CLASS_LEVEL}) — ${CLASS_DIR}`)
  console.log(`  subjects=${data.length}  tests=${totTests}  questions=${totQ}  (id offset=${ID_OFFSET})`)
  if (!totQ) console.log('  (nothing to import — run fetchClass10MockTests.js first.)')
  if (!LIVE) { console.log('\n[DRY] add --live to write to the DB.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')

  const stat = { tests: 0, questions: 0, errors: [] }
  try {
    // The live mock_tests has a class_level column absent from prisma/sql/mock_tests.sql.
    // Ensure it exists (idempotent — no-op where already present). No new tables.
    await client.query(`alter table mock_tests add column if not exists class_level integer not null default 11`)

    for (const pack of data) {
      const subject = pack.category_name
      for (const t of (pack.mock_tests || [])) {
        const { test, questions } = toRows(subject, t)
        try {
          await client.query('begin')
          await client.query(TEST_UPSERT, test)
          await client.query('delete from mock_test_questions where test_id=$1', [test[0]])
          // Batch inserts (50 questions/query, 12 params each) so ~55-question tests
          // over the pooled connection don't time out one INSERT at a time.
          const BATCH = 50
          for (let b = 0; b < questions.length; b += BATCH) {
            const slice = questions.slice(b, b + BATCH)
            const values = []; const params = []
            slice.forEach((q, k) => {
              const o = k * 12
              values.push(`($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8}::jsonb,$${o + 9}::jsonb,$${o + 10}::jsonb,$${o + 11},$${o + 12})`)
              params.push(q.id, q.test_id, q.order_index, q.section_name, q.section_id, q.question, q.question_raw,
                q.options, q.correct_option_ids, q.correct_option_texts, q.correct_index, q.explanation)
            })
            await client.query(
              `insert into mock_test_questions (id, test_id, order_index, section_name, section_id, question, question_raw, options, correct_option_ids, correct_option_texts, correct_index, explanation) values ${values.join(',')}`, params)
          }
          await client.query('commit')
          stat.tests += 1; stat.questions += questions.length
        } catch (e) { await client.query('rollback').catch(() => {}); stat.errors.push(`${subject}/${t.testPaperName}: ${e.message}`) }
      }
      console.log(`  ✓ ${subject}: ${(pack.mock_tests || []).length} tests`)
    }

    console.log('\n── LOG ────────────────────────────────')
    console.log(`  Tests imported     : ${stat.tests}`)
    console.log(`  Questions imported : ${stat.questions}`)
    console.log(`  Errors             : ${stat.errors.length}`)
    stat.errors.slice(0, 12).forEach((e) => console.log(`     ! ${e}`))

    await verify(client)
  } finally { await client.end() }

  console.log('\n✓ Mock Tests imported (class_level=10). Enable via the Class 10 mock subject list in PracticeScreen.')
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
