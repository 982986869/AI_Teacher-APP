'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import PYQ resource content (the src/data/*Pyq* files) into Supabase,
// PARSED into the structured schema (supabase/schema.sql):
//   subject -> chapter -> section('pyq') -> questions(options jsonb, correct_option, solution)
//
// Handles BOTH card templates:
//   • .pyq-card / .question-card   (physics, chemistry, biology)
//   • .pq-card                     (maths — pastel template, inline explanation)
//
// Usage:
//   node scripts/importResources.js            # DRY RUN (parse + report, no DB writes)
//   node scripts/importResources.js --live     # actually insert into Supabase
//
// DB connection is read from server/.env (DATABASE_URL). Secret never printed.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const Module = require('module')
const babel = require('@babel/core')
const cheerio = require('cheerio')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'src', 'data')
const LIVE = process.argv.includes('--live')

// ── Load an ESM data module (template-literal exports) via Babel ─────────────
function loadModule(p) {
  const code = babel.transformFileSync(p, {
    babelrc: false, configFile: false, presets: ['babel-preset-expo'],
    caller: { name: 'metro', platform: 'android', supportsStaticESM: false },
  }).code
  const m = new Module(p, module)
  m.filename = p
  m.paths = Module._nodeModulePaths(path.dirname(p))
  m._compile(code, p)
  return m.exports
}
// pyqContent.js statically imports ./physicsPyqchapters — intercept that require.
const origRequire = Module.prototype.require
Module.prototype.require = function (r) {
  if (r.includes('physicsPyqchapters')) return loadModule(path.join(DATA, 'physicsPyqchapters.js'))
  return origRequire.apply(this, arguments)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim()

// ── Parse one chapter's HTML fragment into structured questions ──────────────
function parseChapter(html) {
  const $ = cheerio.load(html)
  const out = []
  $('.pyq-card, .question-card, .pq-card').each((_, el) => {
    const $el = $(el)
    const q = $el.hasClass('pq-card') ? parsePq($, $el) : parseStd($, $el)
    if (q && (q.question_html || q.options)) out.push(q)
  })
  return out
}

// Standard template: .pyq-card / .question-card
function parseStd($, $el) {
  const qNumber = clean($el.find('.q-number').first().text())
  const year = clean($el.find('.pyq-year, .years').first().text())
  const question_html = ($el.find('.pyq-question, .question-text').first().html() || '').trim()

  const options = []
  $el.find('.pyq-options .option, .options .option').each((i, o) => {
    const $o = $(o)
    let idx = clean($o.find('.option-index').first().text())
    let html
    const $ot = $o.find('.option-text').first()
    if ($ot.length) {
      // New template: text lives in .option-text
      html = ($ot.html() || '').trim()
    } else {
      // Old template: option text is the node's own content. Drop the legacy ✓
      // tick — we DON'T store it; the correct option is flagged via is_correct
      // below and rendered GREEN in the app (no tick mark).
      const $clone = $o.clone()
      $clone.find('.tick').remove()
      html = ($clone.html() || '').trim()
    }
    if (!idx) idx = String.fromCharCode(65 + i) // A, B, C, D by position
    options.push({ idx, html, is_correct: $o.hasClass('correct') })
  })

  // Solution: content of .solution-box / .solution-block (minus its title)
  let solution_html = null
  const $sol = $el.find('.solution-box, .solution-block').first()
  if ($sol.length) {
    const $body = $sol.children().not('.solution-title')
    solution_html = ($body.length ? $.html($body) : $sol.html() || '').trim()
  }

  const correct = options.find((o) => o.is_correct)
  return {
    q_number: qNumber || null,
    year: year || null,
    question_html,
    is_mcq: options.length > 0,
    options: options.length ? options : null,
    correct_option: correct ? correct.idx : null,
    solution_html: solution_html || null,
  }
}

// Maths pastel template: .pq-card
function parsePq($, $el) {
  const qNumber = clean($el.find('.pq-q').first().text())
  // PYQ cards have a year (.pq-year); Important-Questions cards have a tag
  // (.pq-tag, e.g. "VSA"). Use whichever is present for the badge field.
  const year = clean($el.find('.pq-year').first().text()) || clean($el.find('.pq-tag').first().text())
  const question_html = ($el.find('.pq-question').first().html() || '').trim()

  const options = []
  let solution_html = null

  $el.find('.pq-opt').each((_, o) => {
    const $o = $(o)
    if ($o.hasClass('pq-opt-correct')) {
      const $row = $o.find('.pq-correct-row')
      const idx = clean($row.find('.pq-letter').first().text())
      const textSpan = $row.children('span').not('.pq-letter').first()
      options.push({ idx, html: (textSpan.html() || textSpan.text() || '').trim(), is_correct: true })
      const expl = $o.find('.pq-expl').first()
      if (expl.length) solution_html = (expl.html() || '').trim()
    } else {
      const idx = clean($o.find('.pq-letter').first().text())
      const textSpan = $o.children('span').not('.pq-letter').first()
      options.push({ idx, html: (textSpan.html() || textSpan.text() || '').trim(), is_correct: false })
    }
  })

  // Subjective maths cards: cream solution box, no options
  if (!options.length) {
    const $sol = $el.find('.pq-solution').first()
    if ($sol.length) solution_html = ($sol.html() || '').trim()
  }

  const correct = options.find((o) => o.is_correct)
  return {
    q_number: qNumber || null,
    year: year || null,
    question_html,
    is_mcq: options.length > 0,
    options: options.length ? options : null,
    correct_option: correct ? correct.idx : null,
    solution_html: solution_html || null,
  }
}

// ── Collect every section type -> its subjects -> {chapter: html} maps ───────
// Add a new block here to import another section (revision_solutions, etc.).
function collectSources() {
  const load = (f) => loadModule(path.join(DATA, f)).default
  return [
    {
      sectionType: 'pyq',
      subjects: [
        { name: 'Physics',     slug: 'physics',     map: load('pyqContent.js').Physics },
        { name: 'Mathematics', slug: 'mathematics', map: load('mathsPyq.js') },
        { name: 'Chemistry',   slug: 'chemistry',   map: load('chemistryPyq.js') },
        { name: 'Biology',     slug: 'biology',      map: load('biologyPyq.js') },
      ],
    },
    {
      sectionType: 'important_questions',
      subjects: [
        { name: 'Physics',     slug: 'physics',     map: load('physicsImportant.js') },
        { name: 'Mathematics', slug: 'mathematics', map: load('mathsImportant.js') },
        { name: 'Chemistry',   slug: 'chemistry',   map: load('chemistryImportant.js') },
        { name: 'Biology',     slug: 'biology',      map: load('biologyImportant.js') },
      ],
    },
  ]
}

// ── DATABASE_URL from server/.env (no secret printed) ────────────────────────
function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

// Bulk-insert a section's questions in one round-trip (Postgres param cap is
// 65535; 9 params/question keeps any single chapter well under it).
async function insertQuestions(client, sectionId, questions) {
  if (!questions.length) return
  const tuples = []
  const params = []
  questions.forEach((q, i) => {
    const b = i * 9
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9})`)
    params.push(
      sectionId, q.q_number, q.year, q.question_html, q.is_mcq,
      q.options ? JSON.stringify(q.options) : null, q.correct_option, q.solution_html, i + 1
    )
  })
  await client.query(
    `insert into questions
     (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position)
     values ${tuples.join(',')}`,
    params
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const sources = collectSources()

  // Parse every source (works in both dry-run and live)
  let grandQ = 0
  const parsedSources = sources.map((src, idx) => {
    let totalQ = 0
    const subjects = src.subjects.map((s) => {
      const chapters = Object.keys(s.map || {}).map((chapter) => {
        const questions = parseChapter(s.map[chapter])
        totalQ += questions.length
        return { chapter, questions }
      })
      return { ...s, chapters }
    })
    grandQ += totalQ
    return { sectionType: src.sectionType, position: idx + 1, subjects, totalQ }
  })

  // Report
  console.log('\n=== PARSE REPORT ===')
  for (const src of parsedSources) {
    console.log(`\n### section: ${src.sectionType}  —  ${src.totalQ} questions`)
    for (const s of src.subjects) {
      const qn = s.chapters.reduce((a, c) => a + c.questions.length, 0)
      const mcq = s.chapters.reduce((a, c) => a + c.questions.filter((q) => q.is_mcq).length, 0)
      console.log(`   ${s.name.padEnd(12)} ${String(s.chapters.length).padStart(2)} ch  ${String(qn).padStart(4)} q  (${mcq} mcq)`)
    }
  }
  console.log(`\nGRAND TOTAL: ${grandQ} questions`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Kuch insert nahi hua. Live insert ke liye: node scripts/importResources.js --live\n')
    return
  }

  // ── Live insert ────────────────────────────────────────────────────────────
  const { Client } = require('pg')
  // Strip any sslmode from the URL so our ssl object (accept Supabase's cert
  // chain) is honored instead of being forced to verify-full.
  let dbUrl = getDatabaseUrl()
  try {
    const u = new URL(dbUrl)
    u.searchParams.delete('sslmode')
    dbUrl = u.toString()
  } catch (_) { /* leave as-is if not parseable */ }
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected to Supabase.')
  try {
    // Ensure tables exist (schema.sql is idempotent: CREATE TABLE IF NOT EXISTS)
    const schemaSql = fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8')
    await client.query(schemaSql)
    console.log('✓ Schema ensured. Inserting...')

    for (const src of parsedSources) {
      console.log(`\n--- section: ${src.sectionType} ---`)
      for (const s of src.subjects) {
        const subRes = await client.query(
          `insert into subjects (name, slug) values ($1,$2)
           on conflict (slug) do update set name = excluded.name returning id`,
          [s.name, s.slug]
        )
        const subjectId = subRes.rows[0].id

        let pos = 0
        for (const c of s.chapters) {
          pos++
          const chRes = await client.query(
            `insert into chapters (subject_id, name, slug, position) values ($1,$2,$3,$4)
             on conflict (subject_id, slug) do update set name = excluded.name
             returning id`,
            [subjectId, c.chapter, slugify(c.chapter), pos]
          )
          const chapterId = chRes.rows[0].id

          const secRes = await client.query(
            `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
             on conflict (chapter_id, type_key) do update set position = excluded.position
             returning id`,
            [chapterId, src.sectionType, src.position]
          )
          const sectionId = secRes.rows[0].id

          // Re-runnable: clear this section's questions, then bulk-insert fresh
          await client.query('delete from questions where section_id = $1', [sectionId])
          await insertQuestions(client, sectionId, c.questions)
        }
        console.log(`   ✓ ${s.name}: ${s.chapters.length} chapters`)
      }
    }
    console.log('\n✓ Import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
