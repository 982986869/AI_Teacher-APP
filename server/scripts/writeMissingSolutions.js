'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Write the missing solutions — the ones the SOURCE does not have.
//
// WHY
//   Most imported questions arrive with the publisher's own worked solution. A
//   small number do not, because examin8's payload carries solution_html = '' for
//   them: 102 across Class 12 (Economics 56, Accountancy 29, Entrepreneurship 7,
//   Biology 6, Computer Science 3, Applied Maths 1). Re-fetching cannot fix that —
//   there is nothing upstream to fetch. A student opening those sees the question
//   and no explanation.
//
// WHAT IT WILL NOT DO
//   It does not touch a question that already has a solution, so a real one is
//   never overwritten by a generated one. It asks for a confidence and leaves the
//   row untouched below MIN_CONFIDENCE: a blank explanation is honest, a confident
//   wrong one is taught as fact. And it never invents an ANSWER — for an MCQ the
//   key already in the DB is given to the model as ground truth to explain, not
//   something to decide.
//
//   Every solution it writes is stamped solution_source = 'ai:<model>', so a
//   generated explanation is never mistaken for the publisher's, and the whole set
//   can be found, re-checked or reverted in one query.
//
// SAFETY
//   DRY-RUN by default. Resumable: a question that already has a solution is never
//   re-sent, so an interrupted run resumes where it stopped. DATABASE_URL picks the
//   target database; server/.env is the fallback.
//
//   node server/scripts/writeMissingSolutions.js                 # dry-run, class 12
//   node server/scripts/writeMissingSolutions.js --live
//   CLASS=10 LIMIT=20 node server/scripts/writeMissingSolutions.js --live
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const Anthropic = require('@anthropic-ai/sdk')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')

const CLASS_LEVEL = Number(process.env.CLASS || 12)
const SUBJECT = process.env.SUBJECT || null
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null
// Solutions are prose, so a batch is smaller than the MCQ answerer's: the reply has
// to carry a full explanation per question and still fit in max_tokens.
const BATCH = Number(process.env.BATCH || 6)
const CONCURRENCY = Number(process.env.CONCURRENCY || 3)

const MODEL = process.env.SOLUTION_MODEL || 'claude-opus-5-5'
// Writing a board-style solution is a real explanation task, not a lookup, so this
// runs a step above the MCQ answerer's "low".
const EFFORT = process.env.SOLUTION_EFFORT || 'medium'
const MIN_CONFIDENCE = Number(process.env.MIN_CONFIDENCE || 0.8)

const PRICE_IN = Number(process.env.PRICE_IN || 4)
const PRICE_OUT = Number(process.env.PRICE_OUT || 20)

// ── db ───────────────────────────────────────────────────────────────────────
function getDbUrl() {
  let u = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '')
  if (!u) {
    const envPath = path.join(ROOT, '.env')
    if (!fs.existsSync(envPath)) throw new Error('No database: set DATABASE_URL, or create server/.env')
    const m = fs.readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.*)$/m)
    if (!m) throw new Error('server/.env has no DATABASE_URL')
    u = m[1].trim().replace(/^["']|["']$/g, '')
  }
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}
function dbSsl() {
  try {
    const h = new URL(getDbUrl()).hostname
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false
  } catch (_) {}
  return { rejectUnauthorized: false }
}
const dbLabel = () => {
  try { const x = new URL(getDbUrl()); return x.hostname + (x.port ? ':' + x.port : '') + x.pathname }
  catch (_) { return '(unparseable DATABASE_URL)' }
}

const plain = (html) => String(html == null ? '' : html)
  .replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
  .replace(/\s+/g, ' ').trim()

const SYSTEM = [
  'You write solutions for CBSE board questions, in the style a board examiner expects:',
  'the reasoning a student must show to earn the marks, not a bare answer.',
  '',
  'Rules:',
  '  - Give the steps. For numericals show the working; for theory give the definition or',
  '    reason that earns the mark. For a fill-in-the-blank, state the term AND why it fits.',
  '  - Keep to the CBSE syllabus and standard NCERT terminology for the subject and class.',
  '  - Where an answer key is supplied, it is CORRECT: explain why it is right. Never',
  '    contradict it and never choose a different answer.',
  '  - 2-5 sentences for theory, as many lines as the working needs for a numerical.',
  '  - Plain prose. No markdown, no headings, no "Solution:" prefix.',
  '',
  'Report confidence honestly. Use below 0.8 when the question looks truncated, has lost a',
  'diagram, table or passage it depends on, or could be read several ways. A question we',
  'leave blank costs nothing; a confident wrong explanation is taught to a student as fact.',
  '',
  'Reply with ONLY a JSON array, no prose and no code fences, one object per question:',
  '[{"id": <the id given>, "solution": "<the worked solution>", "confidence": <0 to 1>}]',
].join('\n')

function buildPrompt(batch) {
  return batch.map((q) => {
    const lines = [`id: ${q.id}`, `subject: ${q.subject} (Class ${CLASS_LEVEL})`, `chapter: ${q.chapter}`]
    if (q.marks) lines.push(`marks: ${q.marks}`)
    lines.push(`question: ${plain(q.question_html)}`)
    const opts = Array.isArray(q.options) ? q.options : []
    if (opts.length) {
      lines.push('options:')
      opts.forEach((o) => lines.push(`  ${o.idx}. ${plain(o.html)}`))
      if (q.correct_option) lines.push(`correct answer (given, do not change): ${q.correct_option}`)
    }
    return lines.join('\n')
  }).join('\n\n')
}

function parseReply(text) {
  const s = String(text || '')
  const a = s.indexOf('['), b = s.lastIndexOf(']')
  if (a === -1 || b === -1 || b < a) return null
  try { const arr = JSON.parse(s.slice(a, b + 1)); return Array.isArray(arr) ? arr : null }
  catch (_) { return null }
}

async function askBatch(client, batch, stat) {
  let msg
  const body = {
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: 'user', content: buildPrompt(batch) }],
  }
  try {
    msg = await client.messages.create({ ...body, output_config: { effort: EFFORT } })
  } catch (err) {
    if (err && err.status === 400) msg = await client.messages.create(body)
    else throw err
  }
  if (msg.usage) { stat.inTokens += msg.usage.input_tokens || 0; stat.outTokens += msg.usage.output_tokens || 0 }

  const text = (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
  const parsed = parseReply(text)
  if (!parsed) { stat.unparsed += batch.length; return [] }

  const byId = new Map(batch.map((q) => [String(q.id), q]))
  const out = []
  for (const r of parsed) {
    const q = byId.get(String(r && r.id))
    if (!q) { stat.strayId += 1; continue }
    const sol = String((r && r.solution) || '').trim()
    const conf = Number(r && r.confidence)
    if (!sol) { stat.empty += 1; continue }
    if (!Number.isFinite(conf) || conf < MIN_CONFIDENCE) { stat.lowConfidence += 1; continue }
    out.push({ id: q.id, solution: sol })
  }
  return out
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    try {
      const m = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^ANTHROPIC_API_KEY=(.*)$/m)
      if (m) process.env.ANTHROPIC_API_KEY = m[1].trim().replace(/^["']|["']$/g, '')
    } catch (_) {}
  }
  if (!process.env.ANTHROPIC_API_KEY) { console.error('✗ ANTHROPIC_API_KEY is not set.'); process.exit(1) }

  const { Client } = require('pg')
  const pg = new Client({ connectionString: getDbUrl(), ssl: dbSsl() })
  await pg.connect()

  const params = [CLASS_LEVEL]
  let sql = `SELECT q.id, q.question_html, q.options, q.correct_option, q.marks,
                    sub.name AS subject, c.name AS chapter
               FROM subjects sub
               JOIN chapters c ON c.subject_id = sub.id
               JOIN sections s ON s.chapter_id = c.id
               JOIN questions q ON q.section_id = s.id
              WHERE c.class_level = $1
                AND (q.solution_html IS NULL OR q.solution_html = '')`
  if (SUBJECT) { params.push(SUBJECT); sql += ` AND sub.name = $${params.length}` }
  sql += ' ORDER BY q.id'
  if (LIMIT) { params.push(LIMIT); sql += ` LIMIT $${params.length}` }

  const { rows } = await pg.query(sql, params)
  console.log(`\nWrite missing solutions — class ${CLASS_LEVEL}${SUBJECT ? ' · ' + SUBJECT : ''}`)
  console.log(`  database  : ${dbLabel()}`)
  console.log(`  model     : ${MODEL} (effort ${EFFORT}, min confidence ${MIN_CONFIDENCE})`)
  console.log(`  to write  : ${rows.length}`)
  if (!rows.length) { console.log('\n  Nothing to do.'); await pg.end(); return }
  console.log(LIVE ? '  mode      : LIVE (writes)' : '  mode      : DRY-RUN (model still runs and bills; nothing is written)')

  const client = new Anthropic()
  const stat = { inTokens: 0, outTokens: 0, written: 0, lowConfidence: 0, empty: 0, strayId: 0, unparsed: 0, failed: 0 }

  const batches = []
  for (let i = 0; i < rows.length; i += BATCH) batches.push(rows.slice(i, i + BATCH))

  let next = 0, done = 0
  const worker = async () => {
    while (next < batches.length) {
      const batch = batches[next++]
      try {
        const got = await askBatch(client, batch, stat)
        if (LIVE) {
          for (const g of got) {
            // Guarded: only fills a still-empty solution, so a real one that arrived
            // from a re-import mid-run is never overwritten.
            await pg.query(
              `UPDATE questions
                  SET solution_html = $2, solution_source = $3, solution_written_at = now()
                WHERE id = $1 AND (solution_html IS NULL OR solution_html = '')`,
              [g.id, '<p>' + g.solution.replace(/\n+/g, '</p><p>') + '</p>', 'ai:' + MODEL])
            stat.written += 1
          }
        } else { stat.written += got.length }
      } catch (e) {
        stat.failed += batch.length
        console.warn(`  ! batch failed (${batch.length}): ${e && e.message ? e.message : e}`)
      }
      done += 1
      process.stdout.write(`\r  … ${done}/${batches.length} batches · ${stat.written} solutions   `)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batches.length) }, worker))
  process.stdout.write('\n')

  const cost = (stat.inTokens / 1e6) * PRICE_IN + (stat.outTokens / 1e6) * PRICE_OUT
  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Questions sent   : ${rows.length}`)
  console.log(`  Solutions ${LIVE ? 'written' : 'ready '}: ${stat.written}`)
  console.log(`  Left blank — low confidence : ${stat.lowConfidence}`)
  console.log(`  Left blank — empty reply    : ${stat.empty}`)
  console.log(`  Unparsable / stray / failed : ${stat.unparsed} / ${stat.strayId} / ${stat.failed}`)
  console.log(`  Tokens           : ${stat.inTokens.toLocaleString()} in · ${stat.outTokens.toLocaleString()} out`)
  console.log(`  Cost (this run)  : $${cost.toFixed(4)}`)
  if (!LIVE) console.log('\n[DRY] add --live to write.')

  await pg.end()
}

main().catch((e) => { console.error('FAILED:', e && e.message ? e.message : e); process.exit(1) })
