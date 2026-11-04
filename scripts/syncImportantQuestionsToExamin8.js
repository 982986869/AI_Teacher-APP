'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Make a class's Important Questions match examin8's current list, chapter by chapter,
// from the raw cache written by `CLASS=<n> node scripts/fetchClass11Examin8.js`.
//
//   - A question examin8 still lists keeps its row (and any student progress on it).
//   - A question examin8 no longer lists is DELETED; question_progress cascades.
//   - A question examin8 lists that the DB lacks is inserted, with examin8's answer.
//   - An empty answer on a kept question is filled; an existing answer is never changed.
//   - "(Deleted)" chapters are left alone: the API already hides them from students.
//
// Matching is by exact question text + image, as in fillClass6ImportantQuestions.js.
// Refuses to touch a chapter whose examin8 list is missing, or a non-local database.
//
//   CLASS=7 node scripts/syncImportantQuestionsToExamin8.js          # DRY report
//   CLASS=7 node scripts/syncImportantQuestionsToExamin8.js --live   # write
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const ROOT = path.join(__dirname, '..')
const CLASS = process.env.CLASS
if (!CLASS) throw new Error('Set CLASS=<n>')
const CLASS_LEVEL = Number(CLASS)
const RAW = path.join(ROOT, 'src', 'data', `class${CLASS}Examin8`)
const LIVE = process.argv.includes('--live')
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f']

const trim = (s) => (s == null ? '' : String(s)).trim()
const rj = (...p) => { const f = path.join(RAW, ...p); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null }
const isDeleted = (n) => /\(deleted\)/i.test(n || '')
const decode = (s) => String(s || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&[a-z]+;/g, ' ')
const textKey = (s) => decode(String(s || '').replace(/<[^>]+>/g, ' ')).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '')
const imgs = (s) => [...String(s || '').matchAll(/<img[^>]*?\ssrc=["']([^"']+)/gi)].map((m) => m[1].split('?')[0].split('/').pop()).sort().join('|')
const questionKey = (s) => textKey(s) + '#' + imgs(s)
const nameKey = (s) => String(s || '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '')
const hasBody = (s) => /<img|<math|<table/i.test(String(s || '')) || textKey(s).length > 0

function answerOf(q) {
  const fromSolution = (q.solution || []).map((s) => trim(s.solution)).filter(hasBody).join('<hr/>')
  if (fromSolution) return fromSolution
  const co = (q.option || []).find((o) => o.is_correct)
  return co && hasBody(co.explanation) ? trim(co.explanation) : ''
}

function examin8Chapters(res) {
  const list = rj(res, 'iq', 'list.json')
  const kids = list && list.children && list.children.length ? list.children : (rj(res, 'chapters.json') || [])
  const out = []
  for (const c of kids) {
    if (isDeleted(c.name)) continue
    const seen = new Set(); const qs = []
    let failed = false
    for (let p = 1; ; p++) {
      const j = rj(res, 'iq', `ch-${c.id}-p${p}.json`)
      if (!j) break
      if (j.__error) { failed = true; break }
      for (const q of ((j.data && j.data.results) || j.results || [])) {
        const k = questionKey(q.question)
        if (k === '#' || seen.has(k)) continue
        seen.add(k); qs.push(q)
      }
    }
    if (!failed) out.push({ name: trim(c.name), questions: qs })
  }
  return out
}

async function main() {
  const url = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) throw new Error('Refusing to run: DATABASE_URL is not the local database')
  const db = new Client({ connectionString: url.split('?')[0] })
  await db.connect()
  const summary = {}
  try {
    await db.query('BEGIN')
    for (const s of rj('subjects.json')) {
      const res = String(s.id), name = s.name.trim()
      const dr = rj(res, 'download-resources.json')
      if (!dr || !dr.has_important_questions) continue
      const e8 = examin8Chapters(res)
      if (!e8.length) continue
      const subject = (await db.query('select id from subjects where name = $1 order by id limit 1', [name])).rows[0]
      if (!subject) { console.log(`  ! no subject row for ${name}, skipped`); continue }
      const chapters = (await db.query('select id, name from chapters where subject_id = $1 and class_level = $2', [subject.id, CLASS_LEVEL])).rows
      const byName = new Map(chapters.map((c) => [nameKey(c.name), c]))
      const row = summary[name] = { before: 0, deleted: 0, added: 0, kept: 0, filled: 0, after: 0, dbChaptersNotOnExamin8: 0 }

      for (const ch of e8) {
        const c = byName.get(nameKey(ch.name))
        if (!c) continue // Missing chapters are created by fillClass6ImportantQuestions.js first.
        const sec = (await db.query(`select id from sections where chapter_id = $1 and type_key = 'important_questions'`, [c.id])).rows[0]
        if (!sec) continue
        const rows = (await db.query('select id, question_html, solution_html, is_mcq from questions where section_id = $1 order by position, id', [sec.id])).rows
        row.before += rows.length
        const have = new Map()
        const remove = []
        const wanted = new Set(ch.questions.map((q) => questionKey(q.question)))
        for (const r of rows) {
          const k = questionKey(r.question_html)
          if (!wanted.has(k) || have.has(k)) remove.push(r.id)
          else have.set(k, r)
        }
        if (remove.length) await db.query('delete from questions where id = any($1::bigint[])', [remove])
        row.deleted += remove.length
        let pos = 0
        for (const q of ch.questions) {
          const k = questionKey(q.question)
          const existing = have.get(k)
          const ans = answerOf(q)
          if (existing) {
            row.kept++
            const fill = !existing.is_mcq && !hasBody(existing.solution_html) && ans
            if (fill) row.filled++
            await db.query('update questions set position = $1, q_number = $2, solution_html = case when $3 then $4 else solution_html end where id = $5', [pos, `Q${pos + 1}`, !!fill, ans, existing.id])
          } else {
            const opts = Array.isArray(q.option) ? q.option : []
            const mcq = opts.length > 0
            const options = mcq ? opts.map((o, i) => ({ idx: LETTERS[i] || String(i + 1), html: trim(o.option), is_correct: !!o.is_correct })) : null
            const correct = mcq ? (options.find((o) => o.is_correct) || {}).idx || null : null
            await db.query(
              `insert into questions (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position)
               values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
              [sec.id, `Q${pos + 1}`, trim(q.weightage_name) || null, trim(q.question).replace(/\u0000/g, ''), mcq, options && JSON.stringify(options).replace(/\\u0000/g, ''), correct, ans.replace(/\u0000/g, ''), pos])
            row.added++
          }
          pos++
        }
        row.after += ch.questions.length
      }
      const onSite = new Set(e8.map((c) => nameKey(c.name)))
      const stale = (await db.query(
        `select c.name, count(q.id)::int n from chapters c join sections se on se.chapter_id = c.id and se.type_key = 'important_questions'
         join questions q on q.section_id = se.id where c.subject_id = $1 and c.class_level = $2 group by 1`, [subject.id, CLASS_LEVEL])).rows
        .filter((r) => !isDeleted(r.name) && !onSite.has(nameKey(r.name)))
      row.dbChaptersNotOnExamin8 = stale.length
      for (const r of stale) console.log(`  ? ${name}: DB chapter not on examin8, left as is: "${r.name}" (${r.n} q)`)
    }
    console.table(summary)
    const left = (await db.query(
      `select count(*)::int n from questions x join sections s on s.id = x.section_id and s.type_key = 'important_questions'
         join chapters c on c.id = s.chapter_id where c.class_level = $1 and not x.is_mcq and coalesce(x.solution_html, '') = '' and c.name not ilike '%(deleted)%'`, [CLASS_LEVEL])).rows[0].n
    console.log(`visible written questions with no answer afterwards: ${left}`)
    if (LIVE) { await db.query('COMMIT'); console.log('COMMITTED') } else { await db.query('ROLLBACK'); console.log('[DRY] rolled back; add --live to write') }
  } catch (e) {
    await db.query('ROLLBACK').catch(() => {})
    throw e
  } finally { await db.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
