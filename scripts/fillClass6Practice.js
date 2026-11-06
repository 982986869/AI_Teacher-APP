'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Add the Class 6 practice questions the DB lacks (owner OK'd recording attempts on
// the examin8 account, 2026-11-04). Answers are only revealed by POSTing one attempt
// per question, so this touches ONLY chapters where the DB holds fewer questions than
// examin8, and only questions the DB does not already have (by examin8 question id).
//
// Every answered question is checkpointed to src/data/class6Practice/<slug>-gap.json,
// so a re-run never POSTs twice. The seed step only appends: it never deletes a question
// or subtopic, so mcq_attempts are safe. Questions without an answer are not inserted.
//
//   node scripts/fillClass6Practice.js          # fetch + checkpoint, no DB write
//   node scripts/fillClass6Practice.js --live   # also insert from the checkpoints
//   node scripts/fillClass6Practice.js --seed --live   # insert only, no examin8 calls
//   ONLY=english node scripts/fillClass6Practice.js
// Login: EXAMIN8_COOKIE / EXAMIN8_CSRF from the environment.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const ROOT = path.join(__dirname, '..')
// CLASS=7 → Class 7 subjects, checkpoints and class_level (default Class 6).
const CLASS = process.env.CLASS || '6'
const CACHE = path.join(ROOT, 'src', 'data', `class${CLASS}Practice`)
const LIVE = process.argv.includes('--live')
const B = 'https://web.examin8.com/v1'
const DELAY = 130
const CLASS_LEVEL = Number(CLASS)
const BY_CLASS = {
  6: [
    { name: 'English (Poorvi)', slug: 'english-poorvi', res: '23228' },
    { name: 'Reasoning & Mental Ability', slug: 'reasoning-mental-ability', res: '10015' },
    { name: 'सामाजिक विज्ञान', slug: 'us1q786', res: '10916' },
  ],
  // Slugs are the subjects rows written by CLASS=3 seedClass11Examin8.js.
  3: [
    { name: 'Mathematics', slug: 'mathematics', res: '1655' },
    { name: 'EVS - Our Wondrous World', slug: 'evs-our-wondrous-world', res: '26852' },
    { name: 'Science', slug: 'science', res: '4532' },
    { name: 'Social Science', slug: 'social-science', res: '4533' },
    { name: 'English', slug: 'english', res: '1927' },
    { name: 'हिंदी', slug: 'u12is5yf', res: '1924' },
    { name: 'Maths Olympiad', slug: 'maths-olympiad', res: '21467' },
    { name: 'EVS', slug: 'evs', res: '1702' },
    { name: 'Reasoning & Mental Ability', slug: 'reasoning-mental-ability', res: '10018' },
  ],
  7: [
    { name: 'English (Poorvi)', slug: 'english-poorvi', res: '24715' },
    { name: 'Reasoning & Mental Ability', slug: 'reasoning-mental-ability', res: '10014' },
    { name: 'सामाजिक विज्ञान', slug: 'us1q786', res: '10915' },
    { name: 'Old - हिंदी', slug: 'old', res: '1922' },
  ],
}
const SUBJECTS = BY_CLASS[CLASS]
const ONLY = (process.env.ONLY || '').toLowerCase().split(',').filter(Boolean)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const nameKey = (s) => String(s || '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '')
const isDeleted = (n) => /\(deleted\)/i.test(n || '')
// Identical to the app's slugify (src/screens/*.js).
const slugify = (s) => {
  const str = String(s).replace(/[–—­‑]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  const base = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base && !/[^\x00-\x7F]/.test(str)) return base
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  const hash = 'u' + h.toString(36)
  return base ? base + '-' + hash : hash
}

// examin8 rotates msessionid on nearly every response; keep the newest.
const jar = new Map(String(process.env.EXAMIN8_COOKIE || '').split(/;\s*/).filter(Boolean).map((p) => [p.split('=')[0], p.slice(p.indexOf('=') + 1)]))
function absorb(r) {
  for (const sc of (r.headers.getSetCookie ? r.headers.getSetCookie() : [])) {
    const kv = sc.split(';')[0], k = kv.split('=')[0], v = kv.slice(kv.indexOf('=') + 1)
    if ((k === 'msessionid' || k === 'mcsrftoken') && v && v !== '""') jar.set(k, v)
  }
}
const headers = (json) => ({
  Accept: 'application/json, text/plain, */*',
  'X-CSRFToken': jar.get('mcsrftoken') || process.env.EXAMIN8_CSRF,
  Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
  Origin: 'https://web.examin8.com',
  Referer: 'https://web.examin8.com/',
  ...(json ? { 'Content-Type': 'application/json' } : {}),
})

class StopError extends Error {}

async function apiGet(url) {
  for (let a = 1; ; a++) {
    try {
      const r = await fetch(url, { headers: headers(false) })
      absorb(r)
      if (r.status === 401 || r.status === 403) throw new StopError('session rejected (' + r.status + ')')
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return await r.json()
    } catch (e) {
      if (e instanceof StopError || a >= 4) throw e
      await sleep(1000 * a)
    }
  }
}

// One recorded attempt → the answer. HTTP 400 is examin8's daily attempt limit.
async function fetchAnswer(q, chapterId) {
  const body = JSON.stringify({ question: q.id, option: q.options[0].id, time_taken: 4, category: chapterId })
  for (let a = 1; ; a++) {
    try {
      const r = await fetch(`${B}/practice/attempted/`, { method: 'POST', headers: headers(true), body })
      absorb(r)
      if (r.status === 401 || r.status === 403) throw new StopError('session rejected (' + r.status + ')')
      if (r.status === 400) { const t = await r.text(); throw new StopError('examin8 refused the attempt: ' + t.slice(0, 160)) }
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const j = await r.json()
      return { correctOptionId: j.correct_option != null ? j.correct_option : null, explanation: trim(j.explanation) }
    } catch (e) {
      if (e instanceof StopError) throw e
      if (a >= 4) return { correctOptionId: null, explanation: '' }
      await sleep(1000 * a)
    }
  }
}

// Pages can overlap mid-stream, so step by 20, de-duplicate, and stop only on an empty page.
async function fetchChapterQuestions(chapterId, total) {
  const out = new Map()
  for (let offset = 0; offset < total + 20; offset += 20) {
    const j = await apiGet(`${B}/practice/question/category/${chapterId}/paginate/?limit=20&offset=${offset}`)
    const items = (j && j.data) || []
    if (!items.length) break
    for (const q of items) if (!out.has(q.id)) out.set(q.id, { id: q.id, question: trim(q.question), difficulty: trim(q.difficulty_label) || null, options: (q.options || []).map((o) => ({ id: o.id, option: trim(o.option) })) })
    await sleep(DELAY)
  }
  return [...out.values()]
}

function topicNames(ch, count) {
  const topics = (ch.topics || []).filter((t) => (t.total_questions || 0) > 0)
  const sum = topics.reduce((n, t) => n + t.total_questions, 0)
  if (topics.length > 1 && sum === count) return topics.flatMap((t) => Array(t.total_questions).fill(trim(t.name)))
  const single = topics.length === 1 ? trim(topics[0].name) : 'Practice Questions'
  return Array(count).fill(single)
}

async function fetchSubject(s, db) {
  const file = path.join(CACHE, `${s.slug}-gap.json`)
  const doc = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { name: s.name, slug: s.slug, res: s.res, chapters: {} }
  // fsync before the rename: a power cut once left a checkpoint of nothing but NUL bytes.
  const save = () => {
    const fd = fs.openSync(file + '.tmp', 'w')
    fs.writeSync(fd, JSON.stringify(doc)); fs.fsyncSync(fd); fs.closeSync(fd)
    fs.renameSync(file + '.tmp', file)
  }
  const rows = (await db.query(
    `select c.name, m.source_id from subjects su join chapters c on c.subject_id = su.id and c.class_level = $2
       join subtopics st on st.chapter_id = c.id join mcq_questions m on m.subtopic_id = st.id where su.slug = $1`, [s.slug, CLASS_LEVEL])).rows
  const have = new Set(rows.map((r) => Number(r.source_id)))
  const perCh = {}
  for (const r of rows) perCh[nameKey(r.name)] = (perCh[nameKey(r.name)] || 0) + 1
  const dash = await apiGet(`${B}/practice/topics-q-attempt-data/${s.res}/`)
  console.log(`\n=== ${s.name} (subscribed: ${!!dash.has_subscription})`)
  let posted = 0
  for (const ch of dash.chapters || []) {
    const total = ch.total_questions || 0
    const name = trim(ch.name)
    if (!total || isDeleted(name) || (perCh[nameKey(name)] || 0) >= total) continue
    const qs = await fetchChapterQuestions(ch.id, total)
    const names = topicNames(ch, qs.length)
    const entry = doc.chapters[ch.id] || (doc.chapters[ch.id] = { name, questions: {} })
    let added = 0, noAnswer = 0
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i]
      if (have.has(Number(q.id)) || !q.options.length) continue
      const prior = entry.questions[q.id]
      if (prior && prior.correctOptionId != null) { added++; continue }
      const a = await fetchAnswer(q, ch.id)
      posted++
      if (a.correctOptionId == null || !q.options.some((o) => Number(o.id) === Number(a.correctOptionId))) { noAnswer++; continue }
      entry.questions[q.id] = { ...q, topic: names[i], order: i, correctOptionId: a.correctOptionId, explanation: a.explanation }
      added++
      if (added % 20 === 0) save()
      await sleep(DELAY)
    }
    save()
    console.log(`  ${name}: examin8 lists ${total}, served ${qs.length}, DB had ${perCh[nameKey(name)] || 0}, new with answers ${added}${noAnswer ? `, no answer ${noAnswer}` : ''}`)
  }
  console.log(`  attempts recorded this run: ${posted}`)
  return doc
}

async function seed(db, doc) {
  const subject = (await db.query('select id from subjects where slug = $1', [doc.slug])).rows[0]
  if (!subject) throw new Error('no subject row ' + doc.slug)
  const have = new Set((await db.query(
    `select m.source_id from chapters c join subtopics st on st.chapter_id = c.id join mcq_questions m on m.subtopic_id = st.id
      where c.subject_id = $1 and c.class_level = $2`, [subject.id, CLASS_LEVEL])).rows.map((r) => Number(r.source_id)))
  const chapters = (await db.query('select id, name, position from chapters where subject_id = $1 and class_level = $2', [subject.id, CLASS_LEVEL])).rows
  const byName = new Map(chapters.map((c) => [nameKey(c.name), c]))
  let nextPos = chapters.reduce((m, c) => Math.max(m, c.position || 0), 0) + 1
  let inserted = 0
  for (const ch of Object.values(doc.chapters)) {
    const qs = Object.values(ch.questions).filter((q) => !have.has(Number(q.id))).sort((a, b) => a.order - b.order)
    if (!qs.length) continue
    let c = byName.get(nameKey(ch.name))
    if (!c) {
      c = (await db.query(
        `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
         on conflict (subject_id, class_level, slug) do update set name = chapters.name returning id`,
        [subject.id, ch.name, slugify(ch.name), CLASS_LEVEL, nextPos++])).rows[0]
    }
    const subs = (await db.query('select id, name from subtopics where chapter_id = $1 order by position', [c.id])).rows
    for (const q of qs) {
      // A chapter with subtopics already keeps its shape; a new one follows examin8's topics.
      let sub = subs.find((x) => nameKey(x.name) === nameKey(q.topic)) || (subs.length && subs[0])
      if (!sub) {
        sub = (await db.query(
          `insert into subtopics (chapter_id, name, position) values ($1,$2,$3)
           on conflict (chapter_id, name) do update set position = subtopics.position returning id, name`, [c.id, q.topic, 1])).rows[0]
        subs.push(sub)
      }
      const pos = (await db.query('select coalesce(max(position), 0) + 1 p from mcq_questions where subtopic_id = $1', [sub.id])).rows[0].p
      await db.query(
        `insert into mcq_questions (subtopic_id, source_id, question_html, difficulty, options, correct_option_id, explanation_html, position)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [sub.id, q.id, q.question, q.difficulty, JSON.stringify(q.options.map((o) => ({ id: o.id, html: o.option }))), q.correctOptionId, q.explanation || null, pos])
      inserted++
    }
  }
  console.log(`  ${doc.name}: inserted ${inserted}`)
}

async function main() {
  const url = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) throw new Error('Refusing to run: DATABASE_URL is not the local database')
  fs.mkdirSync(CACHE, { recursive: true })
  const db = new Client({ connectionString: url.split('?')[0] })
  await db.connect()
  const docs = []
  try {
    for (const s of SUBJECTS.filter((x) => !ONLY.length || ONLY.some((t) => x.slug.includes(t) || x.name.toLowerCase().includes(t)))) {
      const saved = path.join(CACHE, `${s.slug}-gap.json`)
      if (process.argv.includes('--seed')) { if (fs.existsSync(saved)) docs.push(JSON.parse(fs.readFileSync(saved, 'utf8'))); continue }
      try { docs.push(await fetchSubject(s, db)) } catch (e) {
        if (!(e instanceof StopError)) throw e
        console.error(`  STOPPED: ${e.message}`)
        const f = path.join(CACHE, `${s.slug}-gap.json`)
        if (fs.existsSync(f)) docs.push(JSON.parse(fs.readFileSync(f, 'utf8')))
        if (/session/.test(e.message)) break
      }
    }
    if (!LIVE) { console.log('\n[DRY] checkpoints saved; add --live to insert.'); return }
    await db.query('BEGIN')
    for (const d of docs) await seed(db, d)
    await db.query('COMMIT')
    console.log('COMMITTED')
  } catch (e) {
    await db.query('ROLLBACK').catch(() => {})
    throw e
  } finally { await db.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
