'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Import CLASS 6 MATHS — GANITA PRAKASH (new NCERT syllabus) content into
// Supabase, mapped onto the existing structured schema (supabase/schema.sql)
// so the generic /content + /notes APIs serve it unchanged:
//
//   subject('Maths (Ganita Prakash)', slug 'maths-ganita-prakash', class_level=6)
//     -> chapter (10)
//         -> section('ncert2')        -> questions   (NCERT "Figure it Out" solutions)
//         -> section('revision_notes')-> notes        (Flash cards, topic-grouped blocks)
//         -> section('online_test')   -> questions   (Online Test MCQs — unlocked only)
//
// Source: Ganita-Prakash-Class6-StudyPack/<NN-Chapter-Name>/{ncert-solutions,
//         flash-cards,online-tests}.md
//
//   node scripts/importClass6GanitaPrakash.js          # DRY RUN (parse + report)
//   node scripts/importClass6GanitaPrakash.js --live    # insert into Supabase
//
// DB connection from server/.env (DATABASE_URL). Re-runnable: each section's
// rows are cleared before re-insert. Secret never printed.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'Ganita-Prakash-Class6-StudyPack')
const LIVE = process.argv.includes('--live')
// slug MUST equal slugify('Maths (Ganita Prakash)') used by the frontend, or the
// /content and /notes lookups (which send the slug) will 404.
const SUBJECT = { name: 'Maths (Ganita Prakash)', slug: 'maths-ganita-prakash' }
const CLASS_LEVEL = 6

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// Folder '01-Patterns-in-Mathematics' -> { pos: 1, name: 'Patterns in Mathematics' }
function chapterFolders() {
  return fs.readdirSync(DATA)
    .filter((f) => /^\d\d-/.test(f) && fs.statSync(path.join(DATA, f)).isDirectory())
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((dir) => ({
      dir,
      pos: parseInt(dir.slice(0, 2), 10),
      name: dir.replace(/^\d+-/, '').replace(/-/g, ' ').trim(),
    }))
}

const readIf = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null)

// ── Markdown → HTML (keeps $...$ for MathJax, converts images + bullets) ──────
const mdInline = (s) =>
  String(s == null ? '' : s)
    .replace(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g, '<img src="$1" style="max-width:100%;height:auto" />')
    .trim()

function mdToHtml(text) {
  const t = String(text || '').replace(/\r/g, '').trim()
  if (!t) return ''
  const out = []
  for (let para of t.split(/\n\s*\n/)) {
    const lines = para.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim())
    if (!lines.length) continue
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      const items = lines.map((l) => `<li>${mdInline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')
      out.push(`<ul>${items}</ul>`)
    } else {
      out.push(`<p>${lines.map((l) => mdInline(l.trim())).join('<br/>')}</p>`)
    }
  }
  return out.join('\n')
}

// ── Parse ncert-solutions.md -> [{ q_number, year, question_html, solution_html }]
function parseNcert(md) {
  if (!md) return []
  const questions = []
  let curExercise = null
  let pos = 0
  for (const block of md.split(/^\s*---\s*$/m)) {
    const headingRe = /^##\s+(.+)$/gm
    let hm
    while ((hm = headingRe.exec(block)) !== null) curExercise = hm[1].trim()
    const qm = block.match(/\*\*Q(\d+)\.\*\*([\s\S]*)$/)
    if (!qm) continue
    const [questionText, ...solParts] = qm[2].split(/\*\*Solution:\*\*/)
    const solutionText = solParts.join('**Solution:**')
    const question_html = mdToHtml(questionText)
    if (!question_html) continue
    pos++
    questions.push({
      q_number: `Q${qm[1]}`,
      year: curExercise,
      question_html,
      is_mcq: false,
      options: null,
      correct_option: null,
      solution_html: mdToHtml(solutionText) || null,
      position: pos,
    })
  }
  return questions
}

// ── Parse flash-cards.md -> [{ title, html }] (notes blocks) ─────────────────
function parseFlashcards(md) {
  if (!md) return []
  const blocks = []
  let cur = null
  const push = () => { if (cur && cur.parts.length) blocks.push({ title: cur.title, html: cur.parts.join('\n') }) }
  for (const line of md.split(/\r?\n/)) {
    let m
    if ((m = line.match(/^##\s+(.+)$/))) { push(); cur = { title: m[1].trim(), parts: [] }; continue }
    if (!cur) continue
    if ((m = line.match(/^\*\*\d+\.\*\*\s*(.*)$/))) { cur.parts.push(`<p>${mdInline(m[1].trim())}</p>`); continue }
    if (line.trim() && cur.parts.length) {
      const i = cur.parts.length - 1
      cur.parts[i] = cur.parts[i].replace(/<\/p>$/, `<br/>${mdInline(line.trim())}</p>`)
    }
  }
  push()
  return blocks.filter((b) => b.html.trim())
}

// ── Parse online-tests.md -> [{ year, q_number, question_html, is_mcq, options,
//    correct_option, solution_html }] (unlocked tests only) ──────────────────
function parseOnlineTests(md) {
  if (!md) return []
  const questions = []
  let curTest = null
  let locked = false
  let q = null
  let mode = null
  const flush = () => {
    if (!q) return
    const question_html = mdToHtml(q.qLines.join('\n'))
    if (question_html && q.options.length) {
      questions.push({
        q_number: `Q${q.num}`,
        year: curTest,
        question_html,
        is_mcq: true,
        options: q.options,
        correct_option: q.correct,
        solution_html: mdToHtml(q.explLines.join('\n')) || null,
        position: questions.length + 1,
      })
    }
    q = null
  }
  for (const line of md.split(/\r?\n/)) {
    let m
    if ((m = line.match(/^##\s+Online Test\s*-\s*(\d+)/i))) {
      flush()
      locked = /🔒|locked|paid|403/i.test(line)
      curTest = `Online Test - ${m[1]}`
      continue
    }
    if (/^###\s+Section/i.test(line) || /^\s*---\s*$/.test(line)) continue
    if (locked) continue
    if ((m = line.match(/^\*\*Q(\d+)\.\*\*\s*(.*)$/))) {
      flush()
      q = { num: m[1], qLines: [m[2].replace(/^\[[^\]]*\]\s*/, '')], options: [], explLines: [], correct: null }
      mode = 'q'
      continue
    }
    if (!q) continue
    if ((m = line.match(/^\s*-\s*\(([a-hA-H])\)\s*(.*)$/))) {
      let opt = m[2]
      const is_correct = /✅/.test(opt)
      opt = opt.replace(/✅/g, '').trim()
      const idx = m[1].toUpperCase()
      q.options.push({ idx, html: mdInline(opt), is_correct })
      if (is_correct && !q.correct) q.correct = idx
      mode = 'opt'
      continue
    }
    if ((m = line.match(/^>?\s*\*\*Explanation:\*\*\s*(.*)$/i))) {
      mode = 'expl'
      if (m[1].trim()) q.explLines.push(m[1].replace(/^>\s*/, ''))
      continue
    }
    if (mode === 'expl') q.explLines.push(line.replace(/^>\s*/, ''))
    else if (mode === 'q' && line.trim()) q.qLines.push(line)
  }
  flush()
  return questions
}

// ── Collect every chapter's three content buckets ────────────────────────────
function collect() {
  return chapterFolders().map((c) => {
    const base = path.join(DATA, c.dir)
    return {
      ...c,
      slug: slugify(c.name),
      ncert: parseNcert(readIf(path.join(base, 'ncert-solutions.md'))),
      flash: parseFlashcards(readIf(path.join(base, 'flash-cards.md'))),
      online: parseOnlineTests(readIf(path.join(base, 'online-tests.md'))),
    }
  })
}

function getDatabaseUrl() {
  const env = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
  const m = env.match(/^DATABASE_URL=(.*)$/m)
  if (!m) throw new Error('DATABASE_URL not found in server/.env')
  return m[1].trim().replace(/^["']|["']$/g, '')
}

async function insertQuestions(client, sectionId, questions) {
  if (!questions.length) return
  const tuples = []
  const params = []
  questions.forEach((q, i) => {
    const b = i * 9
    tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9})`)
    params.push(
      sectionId, q.q_number, q.year, q.question_html, q.is_mcq,
      q.options ? JSON.stringify(q.options) : null, q.correct_option, q.solution_html, q.position
    )
  })
  await client.query(
    `insert into questions
     (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position)
     values ${tuples.join(',')}`,
    params
  )
}

async function upsertSection(client, chapterId, typeKey, position) {
  return (await client.query(
    `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
     on conflict (chapter_id, type_key) do update set position = excluded.position returning id`,
    [chapterId, typeKey, position]
  )).rows[0].id
}

async function main() {
  const chapters = collect()

  console.log('\n=== CLASS 6 MATHS (GANITA PRAKASH) — IMPORT PARSE REPORT ===')
  let tN = 0, tF = 0, tO = 0
  for (const c of chapters) {
    tN += c.ncert.length; tF += c.flash.length; tO += c.online.length
    console.log(
      `  #${String(c.pos).padStart(2)} ${c.name.slice(0, 32).padEnd(32)} ` +
      `ncert:${String(c.ncert.length).padStart(3)}  flashBlocks:${String(c.flash.length).padStart(2)}  online:${String(c.online.length).padStart(3)}`
    )
  }
  console.log(`\nTOTAL: ${chapters.length} chapters | ${tN} ncert solutions | ${tF} flash-card blocks | ${tO} online-test MCQs`)

  if (!LIVE) {
    console.log('\n[DRY RUN] Kuch insert nahi hua. Live: node scripts/importClass6GanitaPrakash.js --live\n')
    return
  }

  const { Client } = require('pg')
  let dbUrl = getDatabaseUrl()
  try { const u = new URL(dbUrl); u.searchParams.delete('sslmode'); dbUrl = u.toString() } catch (_) {}
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('\n✓ Connected to Supabase.')
  try {
    await client.query(fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8'))
    console.log('✓ Schema ensured.')

    const subjectId = (await client.query(
      `insert into subjects (name, slug) values ($1,$2)
       on conflict (slug) do update set name = excluded.name returning id`,
      [SUBJECT.name, SUBJECT.slug]
    )).rows[0].id

    for (const c of chapters) {
      const chapterId = (await client.query(
        `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
         on conflict (subject_id, class_level, slug) do update set name = excluded.name, position = excluded.position returning id`,
        [subjectId, c.name, c.slug, CLASS_LEVEL, c.pos]
      )).rows[0].id

      // NCERT "Figure it Out" solutions -> ncert2 questions
      if (c.ncert.length) {
        const secId = await upsertSection(client, chapterId, 'ncert2', 6)
        await client.query('delete from questions where section_id = $1', [secId])
        await insertQuestions(client, secId, c.ncert)
      }

      // Flash cards -> revision_notes / notes blocks
      if (c.flash.length) {
        const secId = await upsertSection(client, chapterId, 'revision_notes', 3)
        await client.query('delete from notes where section_id = $1', [secId])
        await client.query('insert into notes (section_id, intro, blocks) values ($1,$2,$3)',
          [secId, null, JSON.stringify(c.flash)])
      }

      // Online tests -> online_test questions
      if (c.online.length) {
        const secId = await upsertSection(client, chapterId, 'online_test', 7)
        await client.query('delete from questions where section_id = $1', [secId])
        await insertQuestions(client, secId, c.online)
      }

      console.log(`   ✓ #${String(c.pos).padStart(2)} ${c.name}`)
    }
    console.log('\n✓ Class 6 Maths (Ganita Prakash) import complete.')
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
