'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Biology "Online Tests" (timed MCQ testpapers) into ot_tests / ot_questions,
// for any class. Same examin8 shape as the Class 7/8/9 seeders:
//   /v1/category/:subjectId/            → { categories:[chapters] }
//   /v1/category/:chapterId/            → { testpapers:[free], testpapers_paid:[paid] }
//   /v1/quiz/testpaper/:testpaperId/    → { testPaperName, testDuration, noOfQuestions,
//                                           testPaperInstruction, sections:[{questions:[…]}] }
// The plain testpaper view carries neither the answer nor the solution, but the
// ATTEMPT view of the same testpaper carries both:
//   /v1/quiz/testpaper/attempt/:testpaperId/ → sections[].questions[] with
//                                              `explanation` + options[].isCorrectOption
// It is a plain GET and records NOTHING on the account. The explanation IS the
// solution text; it lands in ot_questions.explanation_html and renders in
// OnlineTestReview.js. Each testpaper therefore costs two GETs, merged on questionID.
//
//   The Class 7/8/9 seeders predate this endpoint and instead POST /practice/attempted/
//   once per question — thousands of account-mutating writes, which is exactly what
//   scripts/examin8/README.md (Phase 2F) refuses to do. Don't reintroduce that here.
//
// Class 11 Biology is subject 1388 under batch 21884 — the same subject whose chapter
// question banks (1389–1410) already live in src/data/biology_questions/.
// NOTE: CBSE Class 10 has no standalone Biology; it is folded into Science (1176).
//
// SUBSCRIPTION: each chapter ships 1 free + 4 paid testpapers. An unsubscribed
// account fetches the free one and 403s on the rest, and /practice/attempted/ stops
// returning explanations. Use a subscribed login or the paid tests come back empty —
// the script reports the shortfall instead of failing silently.
//
// Answers are checkpointed to src/data/class<N>OnlineTests/<slug>.json so the
// attempt-POSTs never repeat on re-runs.
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedBiologyOnlineTests.js              # FETCH (dry), class 11
//   CLASS=12 EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedBiologyOnlineTests.js     # another class
//   CLASS=12 node scripts/seedBiologyOnlineTests.js --seed --live                       # SEED from checkpoints
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const SEED_ONLY = process.argv.includes('--seed')
const B = 'https://web.examin8.com/v1'
const CLASS_LEVEL = parseInt(process.env.CLASS || '11', 10)
const DELAY = 130

// `res` = examin8 content/category (subject) id, per class. Verified against
// /v1/category/:id/ → full_name. Class 10 is Science because CBSE Class 10 has no
// separate Biology paper — the bio chapters sit inside Science.
const BY_CLASS = {
  10: [{ name: 'Science', slug: 'science', res: '1176' }],
  11: [{ name: 'Biology', slug: 'biology', res: '1388' }],
}

const SUBJECTS = BY_CLASS[CLASS_LEVEL]
if (!SUBJECTS) {
  console.error(`No examin8 subject id registered for class ${CLASS_LEVEL}.`)
  console.error(`Known: ${Object.keys(BY_CLASS).join(', ')}. Add it to BY_CLASS first.`)
  process.exit(1)
}
const CACHE = path.join(ROOT, 'src', 'data', `class${CLASS_LEVEL}OnlineTests`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
const slugify = (s) => {
  const base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base) return base
  let h = 5381
  const str = String(s)
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  return 'u' + h.toString(36)
}

function headers(json) {
  const h = { Accept: 'application/json, text/plain, */*', 'X-CSRFToken': CSRF, Cookie: COOKIE, Origin: 'https://web.examin8.com', Referer: 'https://web.examin8.com/' }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

async function apiGet(url, tries = 4) {
  for (let a = 1; a <= tries; a++) {
    try {
      const r = await fetch(url, { headers: headers(false) })
      if (r.status === 401 || r.status === 403) throw Object.assign(new Error('AUTH ' + r.status), { fatal: true })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return await r.json()
    } catch (e) { if (e.fatal) throw e; if (a === tries) throw e; await sleep(DELAY * a * 2) }
  }
}

// Answers + worked solutions come from the ATTEMPT view of a testpaper:
//   GET /v1/quiz/testpaper/attempt/:id/
// which returns, per question, `explanation` (the solution) and options carrying
// `isCorrectOption: "1"|"0"`. It is a plain GET — it records NOTHING on the account,
// and one call covers a whole testpaper.
//
// The Class 7/8/9 seeders predate this and instead POST /practice/attempted/ once per
// question — thousands of account-mutating writes that wreck the login's practice
// history. Don't go back to that; this endpoint returns strictly more, for less.
//
// → Map of questionID → { correctIds:[optionID], explanation, typeBase }.
async function fetchAttempt(testpaperId) {
  const j = await apiGet(`${B}/quiz/testpaper/attempt/${testpaperId}/`)
  const byQ = new Map()
  for (const sec of (j.sections || [])) {
    for (const q of (sec.questions || [])) {
      byQ.set(q.questionID, {
        correctIds: (q.options || []).filter((o) => String(o.isCorrectOption) === '1').map((o) => o.optionID),
        explanation: trim(q.explanation) || '',
        typeBase: q.questionTypeBase,
      })
    }
  }
  return byQ
}

// One testpaper → { extTestId, name, instructionHtml, durationMin, totalMarks, isPaid, questions:[…] }.
// Two GETs, merged on questionID: the plain view carries duration / instruction / marks,
// the attempt view carries the answer key and the solutions.
async function fetchTestpaper(tp, chapterId, isPaid, warn) {
  const j = await apiGet(`${B}/quiz/testpaper/${tp.id}/`)
  await sleep(DELAY)
  const key = await fetchAttempt(tp.id)
  const questions = []
  let totalMarks = 0
  let pos = 0
  for (const sec of (j.sections || [])) {
    for (const q of (sec.questions || [])) {
      const opts = (q.options || []).map((o) => ({ id: o.optionID, html: trim(o.option) }))
      const marks = parseInt(q.questionMark, 10) || 1
      totalMarks += marks
      const ans = key.get(q.questionID) || { correctIds: [], explanation: '' }
      // ot_questions stores ONE correct option and OnlineTestReview grades against it.
      // A multi-response question can't be modelled that way, so flag it rather than
      // silently keeping the first id and marking three-quarters of students wrong.
      if (ans.correctIds.length > 1) warn(`q${q.questionID}: ${ans.correctIds.length} correct options (type ${ans.typeBase}) — stored answer-less`)
      questions.push({
        extQuestionId: q.questionID,
        question: trim(q.question) || '',
        options: opts,
        correctOptionId: ans.correctIds.length === 1 ? ans.correctIds[0] : null,
        explanation: ans.explanation || '',
        marks,
        position: pos++,
      })
    }
  }
  return {
    extTestId: j.testPaperID || tp.id,
    name: normApos(j.testPaperName || tp.testpaper || tp.title),
    instructionHtml: trim(j.testPaperInstruction) || '',
    durationMin: parseInt(j.testDuration, 10) || 0,
    totalMarks,
    isPaid: !!isPaid,
    questions,
  }
}

// Resume is keyed on the answer, not the solution: some questions genuinely ship
// without an explanation, and gating on it would re-fetch those chapters forever.
const chapterComplete = (c) =>
  c && c.tests.length && c.tests.every((t) => t.questions.length && t.questions.every((q) => q.correctOptionId != null))

async function fetchSubject(s, cacheFile) {
  const prev = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : null
  const prevByChapter = {}
  if (prev) for (const c of prev.chapters) prevByChapter[c.id] = c

  const subj = await apiGet(`${B}/category/${s.res}/`)
  if (subj.has_subscription === false) {
    process.stdout.write('    ! account has NO subscription for this subject — paid testpapers and\n')
    process.stdout.write('      their solutions will come back empty. Log in with a subscribed account.\n')
  }
  const chapterCats = subj.categories || []
  const chapters = []
  for (const cc of chapterCats) {
    const chId = cc.id
    const chName = normApos(cc.name || cc.text)
    // Reuse checkpoint if this chapter is already fully fetched (all questions answered).
    const cached = prevByChapter[chId]
    if (chapterComplete(cached)) {
      chapters.push(cached)
      process.stdout.write(`    ~ ${chName} (cached ${cached.tests.length} tests)\n`)
      continue
    }
    const listing = await apiGet(`${B}/category/${chId}/`)
    const free = (listing.testpapers || []).map((t) => ({ t, paid: false }))
    const paid = (listing.testpapers_paid || []).map((t) => ({ t, paid: true }))
    const warn = (msg) => process.stdout.write(`      ? ${msg}\n`)
    const tests = []
    for (const { t, paid: isPaid } of [...free, ...paid]) {
      try {
        const tp = await fetchTestpaper(t, chId, isPaid, warn)
        if (tp.questions.length) { tests.push(tp); tp.position = tests.length - 1 }
      } catch (e) { process.stdout.write(`      ! test ${t.id} failed: ${e.message}\n`); if (e.fatal) throw e }
      await sleep(DELAY)
    }
    const qn = tests.reduce((n, t) => n + t.questions.length, 0)
    const an = tests.reduce((n, t) => n + t.questions.filter((q) => q.correctOptionId != null).length, 0)
    const sol = tests.reduce((n, t) => n + t.questions.filter((q) => q.explanation).length, 0)
    chapters.push({ id: chId, name: chName, position: chapters.length, tests })
    process.stdout.write(`    + ${chName}: ${tests.length} tests, ${qn}q (${an} answered, ${sol} with solution)\n`)
    fs.writeFileSync(cacheFile, JSON.stringify({ name: s.name, slug: s.slug, res: s.res, chapters }, null, 2))
  }
  const doc = { name: s.name, slug: s.slug, res: s.res, chapters }
  fs.writeFileSync(cacheFile, JSON.stringify(doc, null, 2))
  return doc
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

// Same ot_tests / ot_questions the Class 7/8/9 seeders fill — the tables are
// class-aware, so Class 11 is just another class_level. onlineTest.service.js already
// filters on it and OnlineTestReview.js already renders explanation_html.
const SCHEMA = `
create table if not exists ot_tests (
  id               bigint generated by default as identity primary key,
  subject_slug     text not null,
  subject_name     text not null,
  class_level      int  not null default 7,
  chapter_name     text not null,
  chapter_slug     text not null,
  chapter_pos      int  not null default 0,
  ext_test_id      bigint,
  name             text not null,
  instruction_html text,
  duration_min     int  not null default 0,
  total_marks      int  not null default 0,
  is_paid          boolean not null default false,
  position         int  not null default 0,
  created_at       timestamptz not null default now(),
  constraint ot_tests_uq unique (subject_slug, class_level, chapter_slug, ext_test_id)
);
create index if not exists idx_ot_tests_subject_class on ot_tests(subject_slug, class_level);
create table if not exists ot_questions (
  id                bigint generated by default as identity primary key,
  ot_test_id        bigint not null references ot_tests(id) on delete cascade,
  ext_question_id   bigint,
  question_html     text not null,
  options           jsonb not null,
  correct_option_id bigint,
  explanation_html  text,
  marks             int not null default 1,
  position          int not null default 0
);
create index if not exists idx_ot_questions_test on ot_questions(ot_test_id);
`

async function insertQuestions(client, testId, questions) {
  if (!questions.length) return
  const tuples = [], params = []
  questions.forEach((q, i) => {
    const b = i * 7
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7})`)
    params.push(testId, q.extQuestionId, q.question, JSON.stringify(q.options), q.correctOptionId, q.explanation || null, q.marks)
  })
  // position = ordinal within the batch
  const withPos = tuples.map((t, i) => t.replace(/\)$/, `,${i}) `))
  await client.query(
    `insert into ot_questions (ot_test_id, ext_question_id, question_html, options, correct_option_id, explanation_html, marks, position) values ${withPos.join(',')}`,
    params)
}

async function seed(docs) {
  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected. Ensuring schema…')
  try {
    await client.query(SCHEMA)
    for (const doc of docs) {
      // Clean slate for this subject+class.
      await client.query('delete from ot_tests where subject_slug = $1 and class_level = $2', [doc.slug, CLASS_LEVEL])
      let nTests = 0, nQ = 0, nSol = 0
      for (const ch of doc.chapters) {
        for (const t of ch.tests) {
          const r = await client.query(
            `insert into ot_tests (subject_slug, subject_name, class_level, chapter_name, chapter_slug, chapter_pos, ext_test_id, name, instruction_html, duration_min, total_marks, is_paid, position)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
            [doc.slug, doc.name, CLASS_LEVEL, ch.name, slugify(ch.name), ch.position, t.extTestId, t.name, t.instructionHtml, t.durationMin, t.totalMarks, t.isPaid, t.position])
          await insertQuestions(client, r.rows[0].id, t.questions)
          nTests++; nQ += t.questions.length; nSol += t.questions.filter((q) => q.explanation).length
        }
      }
      console.log(`  ✓ ${doc.name}: ${doc.chapters.length} chapters, ${nTests} tests, ${nQ} questions, ${nSol} solutions (class_level=${CLASS_LEVEL})`)
    }
  } finally { await client.end() }
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true })
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const subjects = ONLY.length ? SUBJECTS.filter((s) => ONLY.some((t) => s.name.toLowerCase().includes(t) || s.slug.includes(t))) : SUBJECTS

  const docs = []
  if (SEED_ONLY) {
    for (const s of subjects) {
      const f = path.join(CACHE, s.slug + '.json')
      if (fs.existsSync(f)) docs.push(JSON.parse(fs.readFileSync(f, 'utf8')))
      else console.warn(`  ! no checkpoint for ${s.name}`)
    }
  } else {
    if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
    for (const s of subjects) {
      console.log(`\n=== ${s.name} (res ${s.res}) ===`)
      const f = path.join(CACHE, s.slug + '.json')
      try { docs.push(await fetchSubject(s, f)) }
      catch (e) { console.error(`  FAILED ${s.name}: ${e.message}`); if (e.fatal) { console.error('  (auth — refresh cookie)'); process.exit(1) } }
    }
  }

  console.log('\n=== SUMMARY ===')
  for (const d of docs) {
    const tests = d.chapters.reduce((n, c) => n + c.tests.length, 0)
    const q = d.chapters.reduce((n, c) => n + c.tests.reduce((a, t) => a + t.questions.length, 0), 0)
    const ans = d.chapters.reduce((n, c) => n + c.tests.reduce((a, t) => a + t.questions.filter((x) => x.correctOptionId != null).length, 0), 0)
    const sol = d.chapters.reduce((n, c) => n + c.tests.reduce((a, t) => a + t.questions.filter((x) => x.explanation).length, 0), 0)
    console.log(`  ${d.name.padEnd(20)} ${d.chapters.length} ch, ${tests} tests, ${q} q (${ans} answered, ${sol} with solution)`)
    if (q && sol < q) console.log(`  ${''.padEnd(20)} ↳ ${q - sol} question(s) came back with no solution text.`)
  }

  if (!LIVE) { console.log('\n[DRY] add --seed --live to insert from checkpoints.'); return }
  await seed(docs)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
