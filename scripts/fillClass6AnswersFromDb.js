'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Class 6 Important Questions: written questions still without an answer get one
// copied from elsewhere in this database, when the SAME question (identical text and
// images) already has an answer: another subject/class, or a book solution card.
//
// Short questions ("Who wrote this poem?") mean different things in different
// chapters, so a source from another chapter is only trusted for longer questions.
// MCQ sources and book cards with options are skipped: their answer points at an
// option the written question does not have. Only empty answers are ever written.
//
//   node scripts/fillClass6AnswersFromDb.js          # DRY report
//   node scripts/fillClass6AnswersFromDb.js --live   # write
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = Number(process.env.CLASS || 6) // CLASS=7 → Class 7 questions
const MIN_LENGTH_OTHER_CHAPTER = 40

const decode = (s) => String(s || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&[a-z]+;/g, ' ')
const textKey = (s) => decode(String(s || '').replace(/<[^>]+>/g, ' ')).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '')
const imgs = (s) => [...String(s || '').matchAll(/<img[^>]*?src=["']([^"']+)/gi)].map((m) => m[1].split('?')[0].split('/').pop()).sort().join('|')
const questionKey = (s) => textKey(s) + '#' + imgs(s)
const hasBody = (s) => /<img|<math|<table/i.test(String(s || '')) || textKey(s).length > 0

// question-card → { question, answer }, or null when it has options or no solution.
function parseCard(html) {
  if (/<div class="options"/.test(html)) return null
  const q = html.match(/<div class="question-text">([\s\S]*?)<\/div><\/div><div class="answer-section">/)
  const a = html.match(/<div class="label">Solution<\/div><div>([\s\S]*)<\/div><\/div><\/div><\/div>\s*$/)
  return q && a && hasBody(a[1]) ? { question: q[1], answer: a[1].trim() } : null
}

async function main() {
  const url = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) throw new Error('Refusing to run: DATABASE_URL is not the local database')
  const db = new Client({ connectionString: url.split('?')[0] })
  await db.connect()
  try {
    const targets = (await db.query(
      `select x.id, x.question_html h, su.name subject, c.name chapter from questions x
         join sections s on s.id = x.section_id and s.type_key = 'important_questions'
         join chapters c on c.id = s.chapter_id and c.class_level = $1
         join subjects su on su.id = c.subject_id
        where not x.is_mcq and coalesce(x.solution_html, '') = ''`, [CLASS_LEVEL])).rows
    const wanted = new Set(targets.map((t) => questionKey(t.h)))

    // Every candidate source: { key, answer, subject, chapter, classLevel, kind }.
    const sources = new Map()
    const add = (key, src) => { if (!sources.has(key)) sources.set(key, []); sources.get(key).push(src) }
    for (const r of (await db.query(
      `select x.question_html h, x.solution_html sol, su.name subject, c.name chapter, c.class_level cl from questions x
         join sections s on s.id = x.section_id join chapters c on c.id = s.chapter_id join subjects su on su.id = c.subject_id
        where not x.is_mcq and coalesce(x.solution_html, '') <> ''`)).rows) {
      const k = questionKey(r.h)
      if (wanted.has(k) && hasBody(r.sol)) add(k, { answer: r.sol, subject: r.subject, chapter: r.chapter, classLevel: r.cl, kind: 'question' })
    }
    for (const r of (await db.query(`select subject, "className" cn, chapter, html from ncert_solutions where part < 13`)).rows) {
      for (const raw of String(r.html).split(/(?=<div class="question-card")/)) {
        const card = parseCard(raw)
        if (!card) continue
        const k = questionKey(card.question)
        if (wanted.has(k)) add(k, { answer: card.answer, subject: r.subject, chapter: r.chapter, classLevel: Number(String(r.cn).replace(/\D/g, '')), kind: 'book' })
      }
    }

    // Closest source first: same subject, same chapter, then nearest class.
    const sameName = (a, b) => textKey(a) === textKey(b)
    const rank = (t, s) => (sameName(s.subject, t.subject) ? 0 : 100) + (sameName(s.chapter, t.chapter) ? 0 : 200) + Math.abs((s.classLevel || CLASS_LEVEL) - CLASS_LEVEL)

    const summary = {}
    let filled = 0, shortSkipped = 0
    await db.query('BEGIN')
    for (const t of targets) {
      const row = summary[t.subject] = summary[t.subject] || { unanswered: 0, filled: 0, left: 0 }
      row.unanswered++
      const k = questionKey(t.h)
      const usable = (sources.get(k) || []).filter((s) => sameName(s.chapter, t.chapter) || textKey(t.h).length >= MIN_LENGTH_OTHER_CHAPTER)
      if ((sources.get(k) || []).length && !usable.length) shortSkipped++
      if (!usable.length) { row.left++; continue }
      usable.sort((a, b) => rank(t, a) - rank(t, b))
      await db.query(`update questions set solution_html = $1 where id = $2 and coalesce(solution_html, '') = ''`, [usable[0].answer, t.id])
      row.filled++
      filled++
    }
    console.table(summary)
    console.log(`filled ${filled}, left ${targets.length - filled}, short questions skipped because the only match was another chapter: ${shortSkipped}`)
    if (LIVE) { await db.query('COMMIT'); console.log('COMMITTED') } else { await db.query('ROLLBACK'); console.log('[DRY] rolled back; add --live to write') }
  } catch (e) {
    await db.query('ROLLBACK').catch(() => {})
    throw e
  } finally { await db.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
