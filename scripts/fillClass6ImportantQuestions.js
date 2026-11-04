'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fill the Class 6 Important Questions gaps from the raw examin8 cache written by
// `CLASS=6 node scripts/fetchClass11Examin8.js` (no network).
//
//   1. Written-answer questions with an empty answer get examin8's answer, matched
//      by exact question text and image. Questions examin8 no longer lists are left as they are.
//   2. Chapters that are missing, or hold fewer questions than examin8, get the
//      examin8 questions they lack, up to examin8's count for that chapter.
//
// Purely additive: never deletes a question and never overwrites an existing answer,
// so question_progress is safe. "(Deleted)" examin8 chapters are ignored.
//
//   node scripts/fillClass6ImportantQuestions.js          # DRY report
//   node scripts/fillClass6ImportantQuestions.js --live   # write
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const ROOT = path.join(__dirname, '..')
// CLASS=7 → Class 7 cache and class_level (default Class 6).
const CLASS = process.env.CLASS || '6'
const RAW = path.join(ROOT, 'src', 'data', `class${CLASS}Examin8`)
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = Number(CLASS)
// examin8 name → subjects.name, where they differ.
const DB_NAME = CLASS === '6' ? { 'Maths (OLD)': 'Old - Maths', 'Science (OLD)': 'Old - Science', 'Social (OLD)': 'Old - Social Sc', 'English (OLD)': 'Old - English', 'हिंदी (OLD)': 'Old - हिंदी' } : {}
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f']

const trim = (s) => (s == null ? '' : String(s)).trim()
const rj = (...p) => { const f = path.join(RAW, ...p); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null }
const isDeleted = (n) => /\(deleted\)/i.test(n || '')
const decode = (s) => String(s || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&[a-z]+;/g, ' ')
const textKey = (s) => decode(String(s || '').replace(/<[^>]+>/g, ' ')).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '')
// Same wording with a different picture is a different question (Reasoning figures).
const imgs = (s) => [...String(s || '').matchAll(/<img[^>]*?src=["']([^"']+)/gi)].map((m) => m[1].split('?')[0].split('/').pop()).sort().join('|')
const questionKey = (s) => textKey(s) + '#' + imgs(s)
const nameKey = (s) => String(s || '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '')
const hasBody = (s) => /<img|<math|<table/i.test(String(s || '')) || textKey(s).length > 0
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

function answerOf(q) {
  const fromSolution = (q.solution || []).map((s) => trim(s.solution)).filter(hasBody).join('<hr/>')
  if (fromSolution) return fromSolution
  const co = (q.option || []).find((o) => o.is_correct)
  return co && hasBody(co.explanation) ? trim(co.explanation) : ''
}

function examin8Chapters(res) {
  const list = rj(res, 'iq', 'list.json')
  const chapters = rj(res, 'chapters.json') || []
  const kids = list && list.children && list.children.length ? list.children : chapters
  const out = []
  for (const c of kids) {
    if (isDeleted(c.name)) continue
    const qs = []
    for (let p = 1; ; p++) {
      const j = rj(res, 'iq', `ch-${c.id}-p${p}.json`)
      if (!j) break
      qs.push(...((j.data && j.data.results) || j.results || []))
    }
    if (qs.length) out.push({ name: trim(c.name), questions: qs })
  }
  return out
}

async function main() {
  const url = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) throw new Error('Refusing to run: DATABASE_URL is not the local database')
  const db = new Client({ connectionString: new URL(url).origin === 'null' ? url : url.split('?')[0] })
  await db.connect()
  const total = { answers: 0, inserted: 0, newChapters: 0, unanswered: 0 }
  try {
    await db.query('BEGIN')
    for (const s of rj('subjects.json')) {
      const res = String(s.id)
      const name = DB_NAME[s.name.trim()] || s.name.trim()
      const e8 = examin8Chapters(res)
      if (!e8.length) continue
      // Two rows can share a name (Old - हिंदी, हिंदी (मल्हार)); the lower id holds the IQ chapters.
      const subject = (await db.query('select id from subjects where name = $1 order by id limit 1', [name])).rows[0]
      if (!subject) { console.log(`  ! no subject row for ${name}, skipped`); continue }

      const chapters = (await db.query('select id, name, slug, position from chapters where subject_id = $1 and class_level = $2', [subject.id, CLASS_LEVEL])).rows
      const byName = new Map(chapters.map((c) => [nameKey(c.name), c]))
      const rows = (await db.query(
        `select x.id, x.question_html, x.solution_html, x.is_mcq, x.correct_option, sec.chapter_id
           from questions x join sections sec on sec.id = x.section_id
           join chapters c on c.id = sec.chapter_id
          where c.subject_id = $1 and c.class_level = $2 and sec.type_key = 'important_questions'`, [subject.id, CLASS_LEVEL])).rows
      const byText = new Map()
      for (const r of rows) { const k = questionKey(r.question_html); if (!byText.has(k)) byText.set(k, []); byText.get(k).push(r) }

      // 1. Empty answers, matched by exact text anywhere in the subject.
      let answers = 0
      for (const ch of e8) for (const q of ch.questions) {
        const k = questionKey(q.question)
        const ans = answerOf(q)
        if (k === '#' || !ans) continue
        for (const r of byText.get(k) || []) {
          if (r.is_mcq || hasBody(r.solution_html)) continue
          await db.query('update questions set solution_html = $1 where id = $2', [ans, r.id])
          r.solution_html = ans
          answers++
        }
      }

      // 2. Missing / short chapters.
      let inserted = 0, newChapters = 0
      let nextPos = chapters.reduce((m, c) => Math.max(m, c.position || 0), 0) + 1
      for (const ch of e8) {
        const existing = byName.get(nameKey(ch.name))
        const have = existing ? rows.filter((r) => String(r.chapter_id) === String(existing.id)).length : 0
        const unique = [...new Map(ch.questions.map((q) => [q.id, q])).values()]
        let need = unique.length - have
        if (need <= 0) continue
        const fresh = unique.filter((q) => !byText.has(questionKey(q.question)))
        const take = fresh.slice(0, need)
        if (!take.length) continue
        let chapterId = existing && existing.id
        if (!chapterId) {
          chapterId = (await db.query(
            `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
             on conflict (subject_id, class_level, slug) do update set name = chapters.name returning id`,
            [subject.id, ch.name, slugify(ch.name), CLASS_LEVEL, nextPos++])).rows[0].id
          newChapters++
        }
        const sectionId = (await db.query(
          `insert into sections (chapter_id, type_key, position) values ($1,'important_questions',0)
           on conflict (chapter_id, type_key) do update set position = sections.position returning id`, [chapterId])).rows[0].id
        let pos = (await db.query('select coalesce(max(position), -1) + 1 p from questions where section_id = $1', [sectionId])).rows[0].p
        for (const q of take) {
          const opts = Array.isArray(q.option) ? q.option : []
          const mcq = opts.length > 0
          const options = mcq ? opts.map((o, i) => ({ idx: LETTERS[i] || String(i + 1), html: trim(o.option), is_correct: !!o.is_correct })) : null
          const correct = mcq ? (options.find((o) => o.is_correct) || {}).idx || null : null
          await db.query(
            `insert into questions (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [sectionId, `Q${pos + 1}`, trim(q.weightage_name) || null, trim(q.question), mcq, options && JSON.stringify(options), correct, answerOf(q), pos])
          pos++
          inserted++
        }
        console.log(`    ${ch.name}: +${take.length}${existing ? '' : ' (new chapter)'}`)
      }

      const left = rows.filter((r) => !r.is_mcq && !hasBody(r.solution_html)).length
      console.log(`  ${name}: answers filled ${answers}, questions added ${inserted}, new chapters ${newChapters}, still no answer ${left}`)
      total.answers += answers; total.inserted += inserted; total.newChapters += newChapters; total.unanswered += left
    }
    if (LIVE) { await db.query('COMMIT'); console.log('\nCOMMITTED') } else { await db.query('ROLLBACK'); console.log('\n[DRY] rolled back; add --live to write') }
    console.log(JSON.stringify(total))
  } catch (e) {
    await db.query('ROLLBACK').catch(() => {})
    throw e
  } finally { await db.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
