'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 6 "Important Questions" into the generic Practice-tab model
// (subjects → chapters(class_level=6) → sections(type_key='important_questions')
// → questions), mirroring Class 9. Fetches raw MCQs from examin8 (question +
// option[] + weightage_name) and maps to the questions schema.
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass6IQPractice.js          # DRY
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass6IQPractice.js --live    # seed
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const B = 'https://web.examin8.com/v1'
const CLASS_LEVEL = 6
const DELAY = 130
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f']

// name + explicit slug + examin8 content/category (subject) id.
const SUBJECTS = [
  { name: 'Maths (Ganita Prakash)',            slug: 'maths-ganita-prakash',             res: '23261' },
  { name: 'Science (Curiosity)',               slug: 'science-curiosity',                res: '23200' },
  { name: 'Social Science (Exploring Society)', slug: 'social-science-exploring-society',  res: '23213' },
  { name: 'English (Poorvi)',                  slug: 'english-poorvi',                   res: '23228' },
  { name: 'हिंदी (मल्हार)',                     slug: 'hindi-malhar',                     res: '23246' },
  { name: 'Reasoning & Mental Ability',        slug: 'reasoning-mental-ability',         res: '10015' },
  { name: 'सामाजिक विज्ञान',                    slug: 'samajik-vigyan',                   res: '10916' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
// MUST stay byte-identical to the client slugify (src/screens/PracticeScreen.js).
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

async function api(url) {
  const r = await fetch(url, { headers: { accept: 'application/json', 'x-csrftoken': CSRF, referer: 'https://web.examin8.com/', cookie: COOKIE } })
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url)
  return r.json()
}

// Map an examin8 IQ to a questions-table row.
function mapQ(q, i) {
  const opts = Array.isArray(q.option) ? q.option : []
  const mcq = opts.length > 0
  let options = null, correct_option = null
  if (mcq) {
    options = opts.map((o, k) => {
      const idx = LETTERS[k] || String(k + 1)
      if (o.is_correct && !correct_option) correct_option = idx
      return { idx, html: trim(o.option), is_correct: !!o.is_correct }
    })
  }
  const co = opts.find((o) => o.is_correct)
  const solution_html = trim(co && co.explanation) || ''
  return {
    q_number: `Q${i + 1}`,
    year: trim(q.weightage_name) || null,
    question_html: trim(q.question) || '',
    is_mcq: mcq,
    options,
    correct_option,
    solution_html,
    position: i,
  }
}

async function fetchChapterIQ(chapterId) {
  const out = []
  let url = `${B}/question/important-questions/${chapterId}/`
  while (url) {
    let j
    try { j = await api(url) } catch (e) { break }
    for (const q of ((j.data && j.data.results) || [])) out.push(q)
    url = (j.data && j.data.next) || null
    if (url) await sleep(DELAY)
  }
  return out.map((q, i) => mapQ(q, i))
}

async function fetchSubject(s) {
  const list = await api(`${B}/content/category/${s.res}/type/0/content_name/important-questions/`)
  const byChapter = {}
  let pos = 0
  const children = list.children || []
  // Flat subject (e.g. Reasoning) — questions live directly on the subject node.
  if (!children.length) {
    const qs = await fetchChapterIQ(s.res)
    if (qs.length) byChapter[normApos(s.name)] = { position: 0, questions: qs }
    return byChapter
  }
  for (const ch of children) {
    const qs = await fetchChapterIQ(ch.id)
    if (qs.length) byChapter[normApos(ch.name)] = { position: pos++, questions: qs }
    await sleep(DELAY)
  }
  return byChapter
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function insertQuestions(client, sectionId, questions) {
  if (!questions.length) return
  const tuples = [], params = []
  questions.forEach((q, i) => {
    const b = i * 9
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9})`)
    params.push(sectionId, q.q_number, q.year, q.question_html, q.is_mcq, q.options ? JSON.stringify(q.options) : null, q.correct_option, q.solution_html, q.position)
  })
  await client.query(
    `insert into questions (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position) values ${tuples.join(',')}`,
    params)
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const subjects = ONLY.length ? SUBJECTS.filter((s) => ONLY.some((t) => s.name.toLowerCase().includes(t) || s.slug.includes(t))) : SUBJECTS
  const data = []
  for (const s of subjects) {
    let byChapter
    try { byChapter = await fetchSubject(s) } catch (e) { console.log(`  FAILED ${s.name}: ${e.message}`); continue }
    const chapters = Object.keys(byChapter)
    const total = chapters.reduce((n, c) => n + byChapter[c].questions.length, 0)
    console.log(`  ${s.name.padEnd(38)} ${chapters.length} chapters, ${total} questions`)
    data.push({ ...s, byChapter })
  }
  if (!LIVE) { console.log('\n[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')
  try {
    for (const s of data) {
      const sub = await client.query(
        `insert into subjects (name, slug) values ($1,$2) on conflict (slug) do update set name = excluded.name returning id`,
        [s.name, slugify(s.name)])
      const subjectId = sub.rows[0].id
      // Clear ONLY this subject's important-questions sections (questions cascade) —
      // NOT the chapters. The chapters are shared with MCQ Practice (subtopics hang off
      // the same class_level=9 chapters); deleting chapters would wipe MCQ content.
      await client.query(
        `delete from sections where type_key = 'important_questions'
         and chapter_id in (select id from chapters where subject_id = $1 and class_level = $2)`,
        [subjectId, CLASS_LEVEL])
      let ci = 0, items = 0
      for (const chName of Object.keys(s.byChapter)) {
        const info = s.byChapter[chName]
        const chp = await client.query(
          `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
           on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position returning id`,
          [subjectId, chName, slugify(chName), CLASS_LEVEL, info.position])
        const chapterId = chp.rows[0].id
        const sec = await client.query(
          `insert into sections (chapter_id, type_key, position) values ($1,'important_questions',6)
           on conflict (chapter_id, type_key) do update set position = excluded.position returning id`,
          [chapterId])
        const sectionId = sec.rows[0].id
        await client.query('delete from questions where section_id = $1', [sectionId])
        await insertQuestions(client, sectionId, info.questions)
        ci++; items += info.questions.length
      }
      console.log(`  ✓ ${s.name}: ${ci} chapters, ${items} questions (class_level=6)`)
    }
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
