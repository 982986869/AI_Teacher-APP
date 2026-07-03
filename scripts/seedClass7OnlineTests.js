'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 7 "Online Tests" (timed MCQ testpapers) into online_tests /
// online_test_questions. examin8 structure:
//   /v1/category/:subjectId/            → { categories:[chapters] }
//   /v1/category/:chapterId/            → { testpapers:[free], testpapers_paid:[paid] }
//   /v1/quiz/testpaper/:testpaperId/    → { testPaperName, testDuration, noOfQuestions,
//                                           testPaperInstruction, sections:[{questions:[…]}] }
// Testpaper options don't carry the correct answer, but the questionIDs are from
// the same bank as practice, so we reveal it via POST /practice/attempted/
// (category = chapterId) — same key-building trick as MCQ Practice.
//
// Answers are checkpointed to src/data/class7OnlineTests/<slug>.json so the
// attempt-POSTs never repeat on re-runs.
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass7OnlineTests.js            # FETCH (dry)
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… ONLY=science node scripts/seedClass7OnlineTests.js
//   node scripts/seedClass7OnlineTests.js --seed --live                              # SEED from checkpoints
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const SEED_ONLY = process.argv.includes('--seed')
const B = 'https://web.examin8.com/v1'
const CLASS_LEVEL = 7
const DELAY = 130
const CACHE = path.join(ROOT, 'src', 'data', 'class7OnlineTests')

// The three subjects requested. `res` = examin8 content/category (subject) id.
const SUBJECTS = [
  { name: 'Science (Curiosity)', slug: 'science-curiosity', res: '24658' },
  { name: 'Old - Social Sc',     slug: 'old-social-sc',     res: '1544'  },
  { name: 'Old - Maths',         slug: 'old-maths',         res: '1509'  },
]

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

// Reveal a question's correct option via the practice-attempt trick.
async function fetchAnswer(questionId, optionId, categoryId, tries = 4) {
  const body = { question: questionId, option: optionId, time_taken: 4, category: categoryId }
  for (let a = 1; a <= tries; a++) {
    try {
      const r = await fetch(`${B}/practice/attempted/`, { method: 'POST', headers: headers(true), body: JSON.stringify(body) })
      if (r.status === 401 || r.status === 403) throw Object.assign(new Error('AUTH ' + r.status), { fatal: true })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const j = await r.json()
      return { correctOptionId: j.correct_option != null ? j.correct_option : null, explanation: trim(j.explanation) || '' }
    } catch (e) { if (e.fatal) throw e; if (a === tries) return {}; await sleep(DELAY * a * 2) }
  }
  return {}
}

// One testpaper → { extTestId, name, instructionHtml, durationMin, totalMarks, isPaid, questions:[…] }.
// answerCache maps questionId → {correctOptionId, explanation} to avoid duplicate POSTs
// when the same question recurs across a chapter's tests.
async function fetchTestpaper(tp, chapterId, isPaid, answerCache) {
  const j = await apiGet(`${B}/quiz/testpaper/${tp.id}/`)
  const questions = []
  let totalMarks = 0
  let pos = 0
  for (const sec of (j.sections || [])) {
    for (const q of (sec.questions || [])) {
      const opts = (q.options || []).map((o) => ({ id: o.optionID, html: trim(o.option) }))
      const marks = parseInt(q.questionMark, 10) || 1
      totalMarks += marks
      let ans = answerCache.get(q.questionID)
      if (!ans) {
        ans = opts.length ? await fetchAnswer(q.questionID, opts[0].id, chapterId) : {}
        answerCache.set(q.questionID, ans)
        await sleep(DELAY)
      }
      questions.push({
        extQuestionId: q.questionID,
        question: trim(q.question) || '',
        options: opts,
        correctOptionId: ans.correctOptionId != null ? ans.correctOptionId : null,
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

async function fetchSubject(s, cacheFile) {
  const prev = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : null
  const prevByChapter = {}
  if (prev) for (const c of prev.chapters) prevByChapter[c.id] = c

  const subj = await apiGet(`${B}/category/${s.res}/`)
  const chapterCats = subj.categories || []
  const chapters = []
  for (const cc of chapterCats) {
    const chId = cc.id
    const chName = normApos(cc.name || cc.text)
    // Reuse checkpoint if this chapter is already fully fetched (all questions answered).
    const cached = prevByChapter[chId]
    if (cached && cached.tests.length && cached.tests.every((t) => t.questions.length && t.questions.every((q) => q.correctOptionId != null))) {
      chapters.push(cached)
      process.stdout.write(`    ~ ${chName} (cached ${cached.tests.length} tests)\n`)
      continue
    }
    const listing = await apiGet(`${B}/category/${chId}/`)
    const free = (listing.testpapers || []).map((t) => ({ t, paid: false }))
    const paid = (listing.testpapers_paid || []).map((t) => ({ t, paid: true }))
    const answerCache = new Map()
    const tests = []
    for (const { t, paid: isPaid } of [...free, ...paid]) {
      try {
        const tp = await fetchTestpaper(t, chId, isPaid, answerCache)
        if (tp.questions.length) { tests.push(tp); tp.position = tests.length - 1 }
      } catch (e) { process.stdout.write(`      ! test ${t.id} failed: ${e.message}\n`); if (e.fatal) throw e }
      await sleep(DELAY)
    }
    const qn = tests.reduce((n, t) => n + t.questions.length, 0)
    const an = tests.reduce((n, t) => n + t.questions.filter((q) => q.correctOptionId != null).length, 0)
    chapters.push({ id: chId, name: chName, position: chapters.length, tests })
    process.stdout.write(`    + ${chName}: ${tests.length} tests, ${qn}q (${an} answered)\n`)
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

// ot_tests / ot_questions — distinct from the pre-existing `online_tests` table
// (Class 11/12 pipeline). This is the class-aware, DB-served Online Test feature.
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
    console.log(`  ${d.name.padEnd(20)} ${d.chapters.length} ch, ${tests} tests, ${q} q (${ans} answered)`)
  }

  if (!LIVE) { console.log('\n[DRY] add --seed --live to insert from checkpoints.'); return }
  await seed(docs)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
