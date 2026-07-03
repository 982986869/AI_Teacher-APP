'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 8 "Important Questions" into the generic Practice/Resources model:
//   subjects → chapters(class_level=8) → sections(type_key='important_questions')
//   → questions
//
// Fetches from examin8 (needs your logged-in session):
//   chapter list : GET /v1/content/category/:res/type/0/content_name/important-questions/
//   questions    : GET /v1/question/important-questions/:chapterId/   (paginated via .next)
// `res` = the examin8 resource/category id per subject (same ids as buildClass8.js).
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass8IQ.js                 # DRY (fetch+report)
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… ONLY=old-science node scripts/seedClass8IQ.js  # one subject
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… node scripts/seedClass8IQ.js --live            # + seed DB
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const LIVE = process.argv.includes('--live')
const B = 'https://web.examin8.com/v1'
const CLASS_LEVEL = 8
const DELAY = 130
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f']

// Class 8 subjects with their examin8 resource/category id (= buildClass8's `flash`).
const SUBJECTS = [
  { name: 'Science (Curiosity)',                res: '26867' },
  { name: 'Social Science (Exploring Society)', res: '27030' },
  { name: 'हिंदी (मल्हार)',                      res: '26769' },
  { name: 'English (Poorvi)',                   res: '26892' },
  { name: 'Maths (Ganita Prakash)',             res: '26761' },
  { name: 'Old - Science',                      res: '1466'  },
  { name: 'Old - Maths',                        res: '1449'  },
  { name: 'Old - Social Sc',                    res: '1485'  },
  { name: 'Old - English',                      res: '1918'  },
  { name: 'Old - हिंदी',                         res: '1921'  },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
// MUST stay byte-identical to the client slugify (PracticeScreen) so DB slugs match.
const slugify = (s) => {
  const base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base) return base
  let h = 5381; const str = String(s)
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  return 'u' + h.toString(36)
}

async function api(url) {
  const r = await fetch(url, { headers: { accept: 'application/json', 'x-csrftoken': CSRF, referer: 'https://web.examin8.com/', cookie: COOKIE } })
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url)
  return r.json()
}

// Map an examin8 IQ → questions-table row.
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
  // MCQ → correct option's explanation; subjective (VSA/SA/LA) → q.solution, which is
  // an array [{ id, solution(html) }] (join all parts), with alt_solution as fallback.
  const solArr = (v) => (Array.isArray(v) ? v.map((x) => trim(x && x.solution)).filter(Boolean).join('') : trim(v))
  const solution_html = trim(co && co.explanation) || solArr(q.solution) || solArr(q.alt_solution) || ''
  return { q_number: `Q${i + 1}`, year: trim(q.weightage_name) || null, question_html: trim(q.question) || '', is_mcq: mcq, options, correct_option, solution_html, position: i }
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
  // Flat subject (no chapter breakdown) → single chapter named after the subject.
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
  await client.query(`insert into questions (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position) values ${tuples.join(',')}`, params)
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const subjects = ONLY.length ? SUBJECTS.filter((s) => ONLY.some((t) => s.name.toLowerCase().includes(t) || slugify(s.name).includes(t))) : SUBJECTS

  const data = []
  for (const s of subjects) {
    const byChapter = await fetchSubject(s)
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
      const sub = await client.query(`insert into subjects (name, slug) values ($1,$2) on conflict (slug) do update set name = excluded.name returning id`, [s.name, slugify(s.name)])
      const subjectId = sub.rows[0].id
      await client.query('delete from chapters where subject_id = $1 and class_level = $2', [subjectId, CLASS_LEVEL])
      let ci = 0, items = 0
      for (const chName of Object.keys(s.byChapter)) {
        const info = s.byChapter[chName]
        const chp = await client.query(`insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5) on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position returning id`, [subjectId, chName, slugify(chName), CLASS_LEVEL, info.position])
        const sec = await client.query(`insert into sections (chapter_id, type_key, position) values ($1,'important_questions',6) on conflict (chapter_id, type_key) do update set position = excluded.position returning id`, [chp.rows[0].id])
        await client.query('delete from questions where section_id = $1', [sec.rows[0].id])
        await insertQuestions(client, sec.rows[0].id, info.questions)
        ci++; items += info.questions.length
      }
      console.log(`  ✓ ${s.name}: ${ci} chapters, ${items} questions (class_level=8)`)
    }
  } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
