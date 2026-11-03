'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Copy Class 11 Physics / Chemistry / Mathematics online tests from the legacy
// online_tests + online_test_questions tables (already answered + explained) into
// ot_tests + ot_questions, the model OnlineTestScreen reads. Needed because Class 11
// now routes to OnlineTestScreen (2026-11-01) so the new commerce subjects show up;
// Biology + commerce come straight from examin8 via scripts/seedBiologyOnlineTests.js.
// No network, no examin8 attempts. Chapters marked "(Deleted)" are dropped, the same
// rule the owner chose for Class 10.
//
//   node scripts/convertClass11LegacyOnlineTests.js          # dry report
//   node scripts/convertClass11LegacyOnlineTests.js --live
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = 11
const SUBJECTS = [
  { legacy: 'Physics', slug: 'physics', name: 'Physics' },
  { legacy: 'Chemistry', slug: 'chemistry', name: 'Chemistry' },
  { legacy: 'Mathematics', slug: 'mathematics', name: 'Mathematics' },
]
// Same as seedBiologyOnlineTests.js slugify (ASCII base, else hash).
const slugify = (s) => {
  const base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base) return base
  let h = 5381
  const str = String(s)
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  return 'u' + h.toString(36)
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); for (const k of [...x.searchParams.keys()]) x.searchParams.delete(k); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl() })
  await client.connect()
  try {
    if (LIVE) await client.query('BEGIN')
    for (const s of SUBJECTS) {
      const tests = (await client.query(
        `select id, chapter_id, chapter_name, name from online_tests
          where subject = $1 and category_full_name like 'CBSE > Class 11 >%' order by chapter_id, id`, [s.legacy])).rows
      const chapters = [...new Set(tests.map((t) => Number(t.chapter_id)))]
      let nT = 0, nQ = 0, dropped = 0
      if (LIVE) await client.query('delete from ot_tests where subject_slug = $1 and class_level = $2', [s.slug, CLASS_LEVEL])
      const posInChapter = new Map()
      for (const t of tests) {
        if (/\(deleted\)/i.test(t.chapter_name)) { dropped++; continue }
        const qs = (await client.query(
          'select order_index, question, options, correct_index, explanation from online_test_questions where test_id = $1 order by order_index', [t.id])).rows
        if (!qs.length) continue
        const pos = posInChapter.get(t.chapter_id) || 0
        posInChapter.set(t.chapter_id, pos + 1)
        nT++; nQ += qs.length
        if (!LIVE) continue
        const ins = await client.query(
          `insert into ot_tests (subject_slug, subject_name, class_level, chapter_name, chapter_slug, chapter_pos, ext_test_id, name, instruction_html, duration_min, total_marks, is_paid, position)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,$12) returning id`,
          [s.slug, s.name, CLASS_LEVEL, t.chapter_name, slugify(t.chapter_name), chapters.indexOf(Number(t.chapter_id)), t.id, t.name,
            `<p>${t.name}: ${qs.length} questions, 1 mark each. No negative marking.</p>`, qs.length * 2, qs.length, pos])
        const testId = ins.rows[0].id
        for (const q of qs) {
          const opts = (Array.isArray(q.options) ? q.options : []).map((o) => ({ id: o.id, html: o.text != null ? String(o.text) : '' }))
          const ci = q.correct_index != null ? q.correct_index : (Array.isArray(q.options) ? q.options.findIndex((o) => o.is_correct) : -1)
          await client.query(
            `insert into ot_questions (ot_test_id, ext_question_id, question_html, options, correct_option_id, explanation_html, marks, position)
             values ($1,$2,$3,$4::jsonb,$5,$6,1,$7)`,
            [testId, null, q.question, JSON.stringify(opts), ci >= 0 && opts[ci] ? opts[ci].id : null, q.explanation || null, q.order_index])
        }
      }
      console.log(`${s.name.padEnd(12)} ${nT} tests, ${nQ} questions${dropped ? ` (dropped ${dropped} tests in "(Deleted)" chapters)` : ''}`)
    }
    if (LIVE) await client.query('COMMIT')
    else console.log('\n[DRY] add --live to write.')
  } catch (e) { if (LIVE) await client.query('ROLLBACK').catch(() => {}); throw e } finally { await client.end() }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
