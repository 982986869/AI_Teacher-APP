'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 9 "MCQ Practice" content (Practice tab → MCQ Practice) into the
// DB-backed MCQ model:  subjects → chapters(class_level=9) → subtopics → mcq_questions.
//
// examin8 exposes practice questions per CHAPTER (offset pagination, limit≤20)
// but does NOT return the correct answer in the read API. The answer is only
// revealed by POSTing an attempt to /practice/attempted/ (same mechanism used to
// build the Class 12 answer-key). We POST one attempt per question and read
// `correct_option` + `explanation` from the response.
//
// Because that POST records an attempt on the examin8 account, every fetched
// question (with its answer) is CHECKPOINTED to src/data/class7Practice/<slug>.json.
// Re-runs reuse the checkpoint and never re-POST an already-answered question.
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass9McqPractice.js            # FETCH (+checkpoint), dry
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… ONLY=science node scripts/seedClass9McqPractice.js  # one subject
//   node scripts/seedClass9McqPractice.js --seed --live                              # SEED from checkpoints
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const SEED_ONLY = process.argv.includes('--seed') // skip fetching; seed from existing checkpoints
const B = 'https://web.examin8.com/v1'
const CLASS_LEVEL = 9
const DELAY = 130
const CACHE = path.join(ROOT, 'src', 'data', 'class9Practice')

// Same subjects/slugs/resource-ids as the Important-Questions seed so MCQ Practice
// links to the SAME subject rows. `res` is the practice subject id (also the
// examin8 resource/category id) used by /practice/topics-q-attempt-data/:res/.
const SUBJECTS = [
  { name: 'Science (Exploration)',                  slug: 'science-exploration',                  res: '28744' },
  { name: 'हिंदी (गंगा)',                           slug: 'hindi-ganga',                          res: '29068' },
  { name: 'English (Kaveri)',                       slug: 'english-kaveri',                        res: '28696' },
  { name: 'Maths (Ganita Manjari)',                 slug: 'maths-ganita-manjari',                 res: '28726' },
  { name: 'Computer Applications (165)',            slug: 'computer-applications-165',            res: '1908'  },
  { name: 'Information Technology (402)',            slug: 'information-technology-402',            res: '5116'  },
  { name: 'JSTSE Scholarship',                      slug: 'jstse-scholarship',                    res: '2581'  },
  // These have NO practice bank; source MCQ Practice from important-questions (iq:true).
  { name: 'Social Science (Understanding Society)', slug: 'social-science-understanding-society',  res: '29069', iq: true },
  { name: 'Science (Advanced)',                     slug: 'science-advanced',                     res: '29087', iq: true },
  { name: 'संस्कृत (शारदा)',                         slug: 'sanskrit-sharda',                       res: '29148', iq: true },
  { name: 'Maths (Advanced)',                       slug: 'maths-advanced',                       res: '29098', iq: true },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
// Byte-identical to the client slugify (McqPracticeScreen) — Devanagari falls back
// to a stable hash slug so subjects/chapters stay unique instead of colliding.
const slugify = (s) => {
  // Normalize dashes/curly-quotes to ASCII so a stray em-dash doesn't count as
  // non-ASCII; then, if real Devanagari remains, append a stable hash so
  // Devanagari-heavy names whose only ASCII is a marker like "(R1)" stay unique.
  const str = String(s).replace(/[\u2013\u2014\u00AD\u2011]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  const base = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (base && !/[^\x00-\x7F]/.test(str)) return base;
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  const hash = 'u' + h.toString(36);
  return base ? base + '-' + hash : hash;
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

// POST an attempt → the response reveals correct_option + explanation.
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

// All questions for a chapter via offset pagination (server caps limit at 20).
async function fetchChapterQuestions(chapterId, total) {
  const out = []
  const seen = new Set()
  let offset = 0
  const target = total || 500
  while (offset < target + 20) {
    const j = await apiGet(`${B}/practice/question/category/${chapterId}/paginate/?limit=20&offset=${offset}`)
    const items = (j && j.data) || []
    if (!items.length) break
    let fresh = 0
    for (const q of items) {
      if (seen.has(q.id)) continue
      seen.add(q.id); fresh++
      out.push({
        id: q.id,
        question: trim(q.question) || '',
        difficulty: trim(q.difficulty_label) || null,
        options: (q.options || []).map((o) => ({ id: o.id, option: trim(o.option) })),
      })
    }
    if (fresh === 0) break
    offset += items.length
    if (items.length < 20) break
    await sleep(DELAY)
  }
  return out
}

// Split a chapter's ordered questions into per-topic subtopics. examin8 returns
// questions in topic order, so when the topic totals sum to the fetched count we
// slice sequentially; otherwise fall back to a single "Practice Questions" subtopic.
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

// ─── FETCH one subject → checkpoint JSON (resumable) ──────────────────────────
async function fetchSubject(s, cacheFile) {
  const prev = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : null
  const prevByChapter = {}
  if (prev) for (const c of prev.chapters) prevByChapter[c.id] = c

  const dash = await apiGet(`${B}/practice/topics-q-attempt-data/${s.res}/`)
  const chapters = []
  for (const ch of (dash.chapters || [])) {
    const total = ch.total_questions || 0
    if (!total) continue
    // Reuse checkpoint if this chapter was already fully fetched WITH answers.
    const cached = prevByChapter[ch.id]
    const cachedQ = cached ? cached.subtopics.reduce((n, st) => n + st.questions.length, 0) : 0
    const cachedAns = cached ? cached.subtopics.reduce((n, st) => n + st.questions.filter((q) => q.correctOptionId != null).length, 0) : 0
    if (cached && cachedQ >= total && cachedAns === cachedQ) {
      chapters.push(cached)
      process.stdout.write(`    ~ ${normApos(ch.name)} (cached ${cachedQ}q)\n`)
      continue
    }
    const qs = await fetchChapterQuestions(ch.id, total)
    // Answer-key: one attempt POST per question.
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
    // Persist after every chapter so a mid-run failure resumes cleanly.
    fs.writeFileSync(cacheFile, JSON.stringify({ name: s.name, slug: s.slug, res: s.res, chapters }, null, 2))
  }
  const doc = { name: s.name, slug: s.slug, res: s.res, chapters }
  fs.writeFileSync(cacheFile, JSON.stringify(doc, null, 2))
  return doc
}

// ─── FETCH a subject from Important-Questions (no practice bank) ───────────────
// IQ MCQs carry `option[].is_correct` + `explanation` but no option ids, so we
// synthesise index ids (0,1,2…) — correct_option_id then points at that index.
async function fetchIQChapter(chapterId) {
  const out = []
  let url = `${B}/question/important-questions/${chapterId}/`
  while (url) {
    let j
    try { j = await apiGet(url) } catch (e) { break }
    for (const q of ((j.data && j.data.results) || [])) out.push(q)
    url = (j.data && j.data.next) || null
    if (url) await sleep(DELAY)
  }
  return out.map((q) => {
    const opt = Array.isArray(q.option) ? q.option : []
    const options = opt.map((o, k) => ({ id: k, option: trim(o.option) }))
    const ci = opt.findIndex((o) => o.is_correct)
    const co = opt[ci]
    return {
      id: q.id,
      question: trim(q.question) || '',
      difficulty: trim(q.weightage_name) || null,
      options,
      correctOptionId: ci >= 0 ? ci : null,
      explanation: trim(co && co.explanation) || '',
    }
  }).filter((q) => q.options.length && q.correctOptionId != null)
}

async function fetchSubjectFromIQ(s, cacheFile) {
  const list = await apiGet(`${B}/content/category/${s.res}/type/0/content_name/important-questions/`)
  const children = list.children || []
  const chapters = []
  if (!children.length) {
    // Flat subject (Reasoning) — questions live on the subject node itself.
    const qs = await fetchIQChapter(s.res)
    if (qs.length) chapters.push({ id: s.res, name: normApos(s.name), position: 0, subtopics: [{ topicId: s.res, name: 'Practice Questions', questions: qs }] })
  } else {
    for (const ch of children) {
      const qs = await fetchIQChapter(ch.id)
      if (qs.length) chapters.push({ id: ch.id, name: normApos(ch.name), position: chapters.length, subtopics: [{ topicId: ch.id, name: 'Practice Questions', questions: qs }] })
      await sleep(DELAY)
    }
  }
  const doc = { name: s.name, slug: s.slug, res: s.res, chapters }
  fs.writeFileSync(cacheFile, JSON.stringify(doc, null, 2))
  const q = chapters.reduce((n, c) => n + c.subtopics[0].questions.length, 0)
  process.stdout.write(`    + ${chapters.length} chapters, ${q} questions (from important-questions)\n`)
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
        [doc.name, slugify(doc.name)])
      const subjectId = sub.rows[0].id
      let cpos = 0, totQ = 0
      for (const ch of doc.chapters) {
        cpos++
        const chp = await client.query(
          `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
           on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position returning id`,
          [subjectId, ch.name, slugify(ch.name), CLASS_LEVEL, cpos])
        const chapterId = chp.rows[0].id
        // Clean slate for this chapter's MCQ content (cascades mcq_questions).
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
      console.log(`  ✓ ${doc.name}: ${doc.chapters.length} chapters, ${totQ} questions (class_level=9)`)
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
      try { docs.push(await (s.iq ? fetchSubjectFromIQ(s, f) : fetchSubject(s, f))) }
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
