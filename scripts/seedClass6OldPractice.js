'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 6 OLD-subject MCQ Practice content (Practice tab → MCQ Practice)
// into subjects → chapters(class_level=6) → subtopics → mcq_questions. Mirror of
// seedClass9OldPractice.js.
//
// examin8 exposes practice questions per CHAPTER (offset pagination, limit≤20)
// but does NOT return the correct answer in the read API. The answer is revealed
// only by POSTing an attempt to /practice/attempted/. We POST one attempt per
// question and read correct_option + explanation. Every fetched question (with
// its answer) is CHECKPOINTED to src/data/class6Practice/<slug>.json so re-runs
// reuse the checkpoint and never re-POST an already-answered question.
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass6OldPractice.js            # FETCH (+checkpoint), dry
//   node scripts/seedClass6OldPractice.js --seed --live                              # SEED from checkpoints
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const SEED_ONLY = process.argv.includes('--seed')
const B = 'https://web.examin8.com/v1'
const CLASS_LEVEL = 6
const DELAY = 130
const CACHE = path.join(ROOT, 'src', 'data', 'class6Practice')

// Class 6 OLD subjects with a practice bank. `res` = /practice/topics-q-attempt-data/:res/.
const SUBJECTS = [
  { name: 'Old - Maths',     slug: 'old-maths',     res: '1612' },
  { name: 'Old - Science',   slug: 'old-science',   res: '1595' },
  { name: 'Old - Social Sc', slug: 'old-social-sc', res: '1570' },
  { name: 'Old - English',   slug: 'old-english',   res: '1920' },
  { name: 'Old - हिंदी',      slug: 'old',           res: '1923' },
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

async function fetchAnswer(q, categoryId, tries = 4) {
  const opts = q.options || []
  if (!opts.length) return {}
  const body = { question: q.id, option: opts[0].id, time_taken: 4, category: categoryId }
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

async function fetchChapterQuestions(chapterId, total) {
  const out = []
  const seen = new Set()
  const target = total || 500
  // Step by the page limit (20) across the whole offset range and DEDUP — do NOT
  // break early on a duplicate/short page. examin8 occasionally returns an
  // overlapping page mid-stream; the old `fresh===0`/`items<20` breaks stopped
  // short (e.g. 165 of 205). Only an empty page (past the end) ends the loop.
  for (let offset = 0; offset <= target + 20; offset += 20) {
    const j = await apiGet(`${B}/practice/question/category/${chapterId}/paginate/?limit=20&offset=${offset}`)
    const items = (j && j.data) || []
    if (!items.length) break
    for (const q of items) {
      if (seen.has(q.id)) continue
      seen.add(q.id)
      out.push({
        id: q.id,
        question: trim(q.question) || '',
        difficulty: trim(q.difficulty_label) || null,
        options: (q.options || []).map((o) => ({ id: o.id, option: trim(o.option) })),
      })
    }
    await sleep(DELAY)
  }
  return out
}

function splitIntoSubtopics(chapter, questions) {
  const topics = (chapter.topics || []).filter((t) => (t.total_questions || 0) > 0)
  const sum = topics.reduce((n, t) => n + (t.total_questions || 0), 0)
  if (topics.length > 1 && sum === questions.length) {
    const subs = []
    let i = 0
    for (const t of topics) {
      const n = t.total_questions
      subs.push({ topicId: t.id, name: normApos(t.name), questions: questions.slice(i, i + n) })
      i += n
    }
    return subs
  }
  const name = topics.length === 1 ? normApos(topics[0].name) : 'Practice Questions'
  return [{ topicId: topics[0] && topics[0].id, name, questions }]
}

async function fetchSubject(s, cacheFile) {
  const prev = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : null
  const prevByChapter = {}
  if (prev) for (const c of prev.chapters) prevByChapter[c.id] = c

  const dash = await apiGet(`${B}/practice/topics-q-attempt-data/${s.res}/`)
  const chapters = []
  for (const ch of (dash.chapters || [])) {
    const total = ch.total_questions || 0
    if (!total) continue
    const cached = prevByChapter[ch.id]
    const cachedQ = cached ? cached.subtopics.reduce((n, st) => n + st.questions.length, 0) : 0
    const cachedAns = cached ? cached.subtopics.reduce((n, st) => n + st.questions.filter((q) => q.correctOptionId != null).length, 0) : 0
    if (cached && cachedQ >= total && cachedAns === cachedQ) {
      chapters.push(cached)
      process.stdout.write(`    ~ ${normApos(ch.name)} (cached ${cachedQ}q)\n`)
      continue
    }
    const qs = await fetchChapterQuestions(ch.id, total)
    for (const q of qs) {
      const a = await fetchAnswer(q, ch.id)
      q.correctOptionId = a.correctOptionId != null ? a.correctOptionId : null
      q.explanation = a.explanation || ''
      await sleep(DELAY)
    }
    const withAns = qs.filter((q) => q.correctOptionId != null).length
    const subtopics = splitIntoSubtopics(ch, qs)
    chapters.push({ id: ch.id, name: normApos(ch.name), position: chapters.length, subtopics })
    process.stdout.write(`    + ${normApos(ch.name)}: ${qs.length}q (${withAns} answered), ${subtopics.length} subtopics\n`)
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

async function insertQuestions(client, subtopicId, questions) {
  if (!questions.length) return
  const tuples = [], params = []
  questions.forEach((q, i) => {
    const b = i * 8
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8})`)
    params.push(
      subtopicId, q.id, q.question, q.difficulty,
      JSON.stringify((q.options || []).map((o) => ({ id: o.id, html: o.option }))),
      q.correctOptionId, q.explanation || null, i + 1)
  })
  await client.query(
    `insert into mcq_questions (subtopic_id, source_id, question_html, difficulty, options, correct_option_id, explanation_html, position) values ${tuples.join(',')}`,
    params)
}

async function seed(docs) {
  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')
  try {
    for (const doc of docs) {
      const sub = await client.query(
        `insert into subjects (name, slug) values ($1,$2) on conflict (slug) do update set name = excluded.name returning id`,
        [doc.name, doc.slug || slugify(doc.name)])
      const subjectId = sub.rows[0].id
      let cpos = 0, totQ = 0
      for (const ch of doc.chapters) {
        cpos++
        const chp = await client.query(
          `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
           on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position returning id`,
          [subjectId, ch.name, slugify(ch.name), CLASS_LEVEL, cpos])
        const chapterId = chp.rows[0].id
        await client.query('delete from subtopics where chapter_id = $1', [chapterId])
        let spos = 0
        for (const st of ch.subtopics) {
          spos++
          const str = await client.query(
            `insert into subtopics (chapter_id, name, position) values ($1,$2,$3)
             on conflict (chapter_id, name) do update set position = excluded.position returning id`,
            [chapterId, st.name, spos])
          await insertQuestions(client, str.rows[0].id, st.questions)
          totQ += st.questions.length
        }
      }
      console.log(`  ✓ ${doc.name}: ${doc.chapters.length} chapters, ${totQ} questions (class_level=6)`)
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
      else console.warn(`  ! no checkpoint for ${s.name} (${f})`)
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
    const q = d.chapters.reduce((n, c) => n + c.subtopics.reduce((a, s) => a + s.questions.length, 0), 0)
    const ans = d.chapters.reduce((n, c) => n + c.subtopics.reduce((a, s) => a + s.questions.filter((x) => x.correctOptionId != null).length, 0), 0)
    console.log(`  ${d.name.padEnd(38)} ${d.chapters.length} ch, ${q} q (${ans} answered)`)
  }

  if (!LIVE) { console.log('\n[DRY] add --seed --live to insert from checkpoints.'); return }
  await seed(docs)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
