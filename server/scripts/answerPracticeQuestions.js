'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fill in the missing correct answers for imported MCQs, using Claude.
//
// WHY THIS EXISTS
//   examin8's Practice bank is an adaptive attempt engine: the paginated list
//   exposes the question and its options but never the key — that appears only
//   when a question is SUBMITTED on a real account. So Class 10 Practice was
//   imported answer-less (16,251 questions, correct_option = null, every option
//   is_correct = false), and the app could only ever show it read-only.
//   Students could read practice questions but not practise.
//
// WHAT IT DOES NOT DO
//   It does not invent an answer it is unsure of. Each question comes back with
//   a confidence, and anything below MIN_CONFIDENCE is left null — a blank is
//   recoverable, a confidently wrong key taught to a student is not. Skipped
//   rows stay selectable by a later run (or a human), because the selector is
//   "correct_option IS NULL", not "never looked at".
//
//   Every answer it does write is stamped answer_source = 'ai:<model>', so an
//   inferred key is never mistaken for one examin8 published, and the whole set
//   can be found, re-checked or reverted in one query.
//
// SAFETY
//   DRY-RUN by default — it costs money either way (the model still runs), but
//   nothing is written without --live. Resumable: a question that already has a
//   key is never re-sent, so an interrupted run resumes where it stopped.
//
//   DATABASE_URL in the environment picks the target DB, so this can seed
//   production without editing a file; it falls back to server/.env.
//
// USAGE
//   node scripts/answerPracticeQuestions.js                      # dry-run, class 10 practice
//   node scripts/answerPracticeQuestions.js --live               # write
//   LIMIT=40 node scripts/answerPracticeQuestions.js --live      # a sample first
//   SUBJECT='Social Science' LIMIT=40 node scripts/answerPracticeQuestions.js
//   SECTION=pyq CLASS=10 node scripts/answerPracticeQuestions.js --live
//   DATABASE_URL='postgres://…' node scripts/answerPracticeQuestions.js --live
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')
const Anthropic = require('@anthropic-ai/sdk')

const ROOT = path.join(__dirname, '..')
const LIVE = process.argv.includes('--live')
// Measure accuracy instead of filling blanks: select questions that ALREADY have a
// real examin8 key, hide it, ask the same prompt, and compare. The only honest way
// to know what a backfill is worth before running it on questions nobody can check.
const BENCHMARK = process.argv.includes('--benchmark')
// Re-ask the questions a previous run declined to answer. Off by default so a
// resume after an interruption costs only the questions never reached; turn it on
// for a second pass at a stronger model or a higher effort.
const RECHECK = process.argv.includes('--recheck')

const CLASS_LEVEL = Number(process.env.CLASS || 10)
const SECTION = process.env.SECTION || 'practice'
const SUBJECT = process.env.SUBJECT || null
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null

// Per request. Big enough that the instructions are amortised over many questions,
// small enough that one bad response costs little and retries stay cheap.
const BATCH = Number(process.env.BATCH || 20)
// Requests in flight. The account's rate limit, not the DB, is the ceiling here.
const CONCURRENCY = Number(process.env.CONCURRENCY || 4)

// Answering a Class 10 MCQ is not a hard reasoning task, so the default model runs
// at low effort — the quality that matters is "knows CBSE Class 10", not depth of
// search. Both are env-overridable for a re-check pass over the skipped rows.
const MODEL = process.env.ANSWER_MODEL || 'claude-opus-5-5'
const EFFORT = process.env.ANSWER_EFFORT || 'low'

// Below this, the answer is discarded and the row left null — bad OCR, questions
// that lost their diagram on import, "all of the above" variants.
//
// 0.9 is measured, not picked. Benchmarked against examin8's own keys on 200 random
// answered Class 10 MCQs (--benchmark):
//     threshold 0.8 → 95.0% accurate, answers 80.5% of questions
//     threshold 0.9 → 98.5% accurate, answers 68.5% of questions
// Over the 16k-question practice bank that is ~170 wrong keys instead of ~650, for
// ~2,000 more blanks. A blank shows the student nothing; a wrong key teaches them
// something false and they have no way to tell. So the stricter number wins.
const MIN_CONFIDENCE = Number(process.env.MIN_CONFIDENCE || 0.9)

// Prices per million tokens, for the run report only (claude-opus-5-5).
const PRICE_IN = Number(process.env.PRICE_IN || 4)
const PRICE_OUT = Number(process.env.PRICE_OUT || 20)

// ── db ───────────────────────────────────────────────────────────────────────
// DATABASE_URL wins so the same script can target production; server/.env is the
// development fallback (the local Docker container).
function getDbUrl() {
  let u = (process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '')
  if (!u) {
    const envPath = path.join(ROOT, '.env')
    if (!fs.existsSync(envPath)) throw new Error('No database: set DATABASE_URL, or create server/.env')
    const m = fs.readFileSync(envPath, 'utf8').match(/^DATABASE_URL=(.*)$/m)
    if (!m) throw new Error('server/.env has no DATABASE_URL — set DATABASE_URL in the environment instead.')
    u = m[1].trim().replace(/^["']|["']$/g, '')
  }
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

// Local Postgres is built without SSL; remote hosts require it. Decide by host
// rather than hardcoding either way.
function dbSsl() {
  try {
    const h = new URL(getDbUrl()).hostname
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false
  } catch (_) { /* fall through to the safe default */ }
  return { rejectUnauthorized: false }
}

const dbLabel = () => {
  try { const x = new URL(getDbUrl()); return x.hostname + (x.port ? ':' + x.port : '') + x.pathname }
  catch (_) { return '(unparseable DATABASE_URL)' }
}

// ── text ─────────────────────────────────────────────────────────────────────
// The model is asked about the QUESTION, not about our HTML. Stripping tags cuts
// roughly half the input tokens and removes markup it would otherwise reason about.
// &nbsp; shows up throughout the examin8 import and reads as a word boundary.
const plain = (html) => String(html == null ? '' : html)
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim()

const SYSTEM = [
  'You are a CBSE subject expert marking multiple-choice questions for Classes 6-12 in India.',
  '',
  'For each question you are given an id and its lettered options. Choose the single option that',
  'the CBSE syllabus and standard NCERT textbooks treat as correct.',
  '',
  'Report confidence honestly. Use a confidence below 0.8 when any of these is true:',
  '  - the question text or an option looks truncated, garbled, or lost its diagram/table on import;',
  '  - more than one option is defensible, or none is clearly right;',
  '  - answering needs a figure, map, passage or case study that is not in the text you were given;',
  '  - the question is asking for an opinion, or depends on a specific edition or year.',
  'A low confidence is not a failure. An answer we discard costs nothing; a wrong answer shown to a',
  'student as correct is the thing to avoid. Never pick an option merely to produce one.',
  '',
  'Reply with ONLY a JSON array, no prose and no code fences, one object per question, same order:',
  '[{"id": <the id you were given>, "answer": "<option letter>", "confidence": <0 to 1>}]',
].join('\n')

function buildUserPrompt(batch) {
  return batch.map((q) => {
    const opts = (q.options || [])
      .map((o) => `  ${o.idx}. ${plain(o.html)}`)
      .join('\n')
    return `id: ${q.id}\n${plain(q.question_html)}\n${opts}`
  }).join('\n\n')
}

// Tolerant of a stray fence or a sentence before the array — the array itself is
// unambiguous, so find it rather than failing the whole batch on packaging.
function parseAnswers(text) {
  const s = String(text || '')
  const start = s.indexOf('[')
  const end = s.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) return null
  try {
    const arr = JSON.parse(s.slice(start, end + 1))
    return Array.isArray(arr) ? arr : null
  } catch (_) { return null }
}

// ── one request ──────────────────────────────────────────────────────────────
async function answerBatch(client, batch, stat) {
  let msg
  try {
    msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: EFFORT },
      system: SYSTEM,
      messages: [{ role: 'user', content: buildUserPrompt(batch) }],
    })
  } catch (err) {
    // A 400 here usually means the model does not accept output_config/effort —
    // retry once plainly rather than losing the batch.
    if (err && err.status === 400) {
      msg = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{ role: 'user', content: buildUserPrompt(batch) }],
      })
    } else { throw err }
  }

  if (msg.usage) {
    stat.inTokens += msg.usage.input_tokens || 0
    stat.outTokens += msg.usage.output_tokens || 0
  }

  const text = (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
  const parsed = parseAnswers(text)
  if (!parsed) { stat.unparsed += batch.length; return [] }

  const byId = new Map(batch.map((q) => [String(q.id), q]))
  const out = []
  // Questions the model looked at but would not commit to. Stamped (below) so a
  // resume does not pay to ask the same unanswerable question again.
  const unsure = []
  for (const a of parsed) {
    const q = byId.get(String(a && a.id))
    if (!q) { stat.strayId += 1; continue }
    const letter = String((a && a.answer) || '').trim().toUpperCase()
    // The letter has to be one this question actually offers. This is what makes a
    // hallucinated "E", or an answer pasted from the wrong question, unwritable.
    const opt = (q.options || []).find((o) => String(o.idx).toUpperCase() === letter)
    if (!opt) { stat.badLetter += 1; unsure.push(q.id); continue }
    const conf = Number(a.confidence)
    if (!Number.isFinite(conf) || conf < MIN_CONFIDENCE) { stat.lowConfidence += 1; unsure.push(q.id); continue }
    out.push({ id: q.id, letter: opt.idx, confidence: conf, options: q.options, truth: q.truth })
  }
  // Anything the model simply left out of its reply is left null, not guessed.
  stat.missing += batch.length - parsed.length > 0 ? batch.length - parsed.length : 0
  return { answers: out, unsure }
}

// ── write ────────────────────────────────────────────────────────────────────
async function writeAnswers(client, pg, answers, stat) {
  for (const a of answers) {
    const options = a.options.map((o) => ({ ...o, is_correct: String(o.idx) === String(a.letter) }))
    await pg.query(
      `UPDATE questions
          SET correct_option = $2,
              options = $3::jsonb,
              answer_source = $4,
              answer_checked_at = now()
        WHERE id = $1 AND correct_option IS NULL`,
      [a.id, a.letter, JSON.stringify(options), 'ai:' + MODEL],
    )
    stat.written += 1
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    try {
      const m = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^ANTHROPIC_API_KEY=(.*)$/m)
      if (m) process.env.ANTHROPIC_API_KEY = m[1].trim().replace(/^["']|["']$/g, '')
    } catch (_) { /* reported below */ }
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY is not set (and not in server/.env).'); process.exit(1)
  }

  const { Client } = require('pg')
  const pg = new Client({ connectionString: getDbUrl(), ssl: dbSsl() })
  await pg.connect()

  const params = [CLASS_LEVEL, SECTION]
  let sql = `SELECT q.id, q.question_html, q.options${BENCHMARK ? ', q.correct_option AS truth' : ''}
               FROM chapters c
               JOIN sections s ON s.chapter_id = c.id AND s.type_key = $2
               JOIN questions q ON q.section_id = s.id
              WHERE c.class_level = $1
                AND q.is_mcq = true
                AND q.correct_option IS ${BENCHMARK ? 'NOT NULL' : 'NULL'}
                AND q.options IS NOT NULL`
  // A question already looked at and declined is skipped on a resume — asking the
  // same unanswerable question again costs money and returns the same shrug. The
  // stamp is what --recheck clears, e.g. for a pass at a stronger model or effort.
  if (!BENCHMARK && !RECHECK) sql += ' AND q.answer_checked_at IS NULL'
  if (SUBJECT) { params.push(SUBJECT); sql += ` AND c.subject_id = (SELECT id FROM subjects WHERE name = $${params.length})` }
  // A benchmark ordered by id would measure one or two chapters, not the bank —
  // sample across the whole class instead.
  sql += BENCHMARK ? ' ORDER BY random()' : ' ORDER BY q.id'
  if (LIMIT) { params.push(LIMIT); sql += ` LIMIT $${params.length}` }

  const { rows } = await pg.query(sql, params)

  console.log(`\nAnswer MCQs — class ${CLASS_LEVEL} · ${SECTION}${SUBJECT ? ' · ' + SUBJECT : ''}`)
  console.log(`  database   : ${dbLabel()}`)
  console.log(`  model      : ${MODEL} (effort ${EFFORT}, min confidence ${MIN_CONFIDENCE})`)
  console.log(`  unanswered : ${rows.length}${LIMIT ? ` (LIMIT ${LIMIT})` : ''}`)
  if (!rows.length) { console.log('\n  Nothing to do.'); await pg.end(); return }
  console.log(`  batches    : ${Math.ceil(rows.length / BATCH)} × ${BATCH}, ${CONCURRENCY} in flight`)
  console.log(LIVE ? '  mode       : LIVE (writes)' : '  mode       : DRY-RUN (model still runs and bills; nothing is written)')

  const client = new Anthropic()
  const stat = {
    inTokens: 0, outTokens: 0, answered: 0, written: 0,
    lowConfidence: 0, badLetter: 0, strayId: 0, unparsed: 0, missing: 0, failed: 0,
    correct: 0, wrong: 0, wrongSample: [],
  }

  const batches = []
  for (let i = 0; i < rows.length; i += BATCH) batches.push(rows.slice(i, i + BATCH))

  let next = 0
  let done = 0
  const worker = async () => {
    while (next < batches.length) {
      const batch = batches[next++]
      try {
        const { answers, unsure } = await answerBatch(client, batch, stat)
        stat.answered += answers.length
        // Record the attempt on questions it declined, so the next run can leave
        // them alone. Benchmark mode writes nothing.
        if (LIVE && !BENCHMARK && unsure.length) {
          await pg.query(
            'UPDATE questions SET answer_checked_at = now() WHERE id = ANY($1::bigint[]) AND correct_option IS NULL',
            [unsure],
          )
        }
        if (BENCHMARK) {
          for (const a of answers) {
            if (String(a.letter).toUpperCase() === String(a.truth).toUpperCase()) stat.correct += 1
            else { stat.wrong += 1; stat.wrongSample.push({ id: a.id, said: a.letter, truth: a.truth, conf: a.confidence }) }
          }
        } else if (LIVE && answers.length) {
          await writeAnswers(client, pg, answers, stat)
        }
      } catch (err) {
        stat.failed += batch.length
        console.warn(`  ! batch failed (${batch.length} questions): ${err && err.message ? err.message : err}`)
      }
      done += 1
      if (done % 5 === 0 || done === batches.length) {
        process.stdout.write(`\r  … ${done}/${batches.length} batches · ${stat.answered} answered · ${stat.lowConfidence} left for review   `)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batches.length) }, worker))
  process.stdout.write('\n')

  const cost = (stat.inTokens / 1e6) * PRICE_IN + (stat.outTokens / 1e6) * PRICE_OUT
  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Questions sent    : ${rows.length}`)
  console.log(`  Answered          : ${stat.answered}`)
  console.log(`  Written to DB     : ${LIVE ? stat.written : 0}${LIVE ? '' : '  (dry-run)'}`)
  console.log(`  Left null — low confidence : ${stat.lowConfidence}`)
  console.log(`  Left null — invalid letter : ${stat.badLetter}`)
  console.log(`  Left null — not answered   : ${stat.missing}`)
  console.log(`  Unparsable replies         : ${stat.unparsed}`)
  console.log(`  Stray ids / failed         : ${stat.strayId} / ${stat.failed}`)
  console.log(`  Tokens            : ${stat.inTokens.toLocaleString()} in · ${stat.outTokens.toLocaleString()} out`)
  console.log(`  Cost (this run)   : $${cost.toFixed(4)}`)
  if (rows.length) {
    console.log(`  Per 1,000 qs      : $${((cost / rows.length) * 1000).toFixed(2)}`)
  }
  if (BENCHMARK) {
    const graded = stat.correct + stat.wrong
    const pct = graded ? (stat.correct / graded) * 100 : 0
    // Coverage is the other half of the number: accuracy is measured only on the
    // questions it was confident enough to answer, and the rest stay blank.
    const coverage = rows.length ? (graded / rows.length) * 100 : 0
    console.log('\n── BENCHMARK (vs examin8\'s own keys) ──')
    console.log(`  Graded            : ${graded} of ${rows.length} sent  (coverage ${coverage.toFixed(1)}%)`)
    console.log(`  Correct           : ${stat.correct}`)
    console.log(`  Wrong             : ${stat.wrong}`)
    console.log(`  Accuracy          : ${pct.toFixed(1)}%  (on answered only)`)
    if (stat.wrongSample.length) {
      console.log('  Misses (id · said → actual · confidence):')
      stat.wrongSample.slice(0, 15).forEach((w) =>
        console.log(`    ${w.id} · ${w.said} → ${w.truth} · ${Number(w.conf).toFixed(2)}`))
    }
  } else if (!LIVE) {
    console.log('\n[DRY] add --live to write these answers.')
  }

  await pg.end()
}

main().catch((err) => { console.error('FAILED:', err && err.message ? err.message : err); process.exit(1) })
