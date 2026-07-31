'use strict'

/**
 * import-offline-answer-keys.js
 * ------------------------------
 * Mirrors the app's bundled answer keys into offline_answer_keys, so the server can
 * grade Class 10/11/12 online tests instead of trusting a client-reported score.
 *
 * Only the KEY is copied (question id -> correct option). Question text stays in the
 * app bundle, which is what keeps those tests working offline.
 *
 * Sources (all under AI_Teacher-APP/src/data/):
 *   physics_questions/answer_key.json             { id: { correctAnswer, correctOptionId } }
 *   chemistry_questions/answer_key_chemistry.json  same shape
 *   maths_questions/answer_key_maths.json          same shape
 *
 * Biology is deliberately NOT listed: its key file is still empty ({}), because
 * build-answer-key-biology.js has never been run. Once it is, add it below and
 * re-run — this script is idempotent (upsert on question_id).
 *
 * RUN:  node scripts/import-offline-answer-keys.js
 */

const fs = require('fs')
const path = require('path')
const db = require('../src/config/database')

const DATA_DIR = path.resolve(__dirname, '../../src/data')

const SOURCES = [
  { subject: 'Physics', file: 'physics_questions/answer_key.json' },
  { subject: 'Chemistry', file: 'chemistry_questions/answer_key_chemistry.json' },
  { subject: 'Mathematics', file: 'maths_questions/answer_key_maths.json' },
  // { subject: 'Biology', file: 'biology_questions/answer_key_biology.json' },
]

const CHUNK = 500

function load(file) {
  const p = path.join(DATA_DIR, file)
  if (!fs.existsSync(p)) return null
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null }
}

async function upsertChunk(rows) {
  if (!rows.length) return
  const tuples = []
  const params = []
  rows.forEach((r, i) => {
    const b = i * 4
    tuples.push(`($${b + 1}::bigint,$${b + 2}::bigint,$${b + 3}::text,$${b + 4}::text)`)
    params.push(r.questionId, r.correctOptionId, r.correctAnswer, r.subject)
  })
  await db.$executeRawUnsafe(
    `INSERT INTO offline_answer_keys (question_id, correct_option_id, correct_answer, subject)
     VALUES ${tuples.join(',')}
     ON CONFLICT (question_id) DO UPDATE SET
       correct_option_id = EXCLUDED.correct_option_id,
       correct_answer    = EXCLUDED.correct_answer,
       subject           = EXCLUDED.subject,
       updated_at        = now()`,
    ...params,
  )
}

async function main() {
  let grand = 0
  for (const src of SOURCES) {
    const key = load(src.file)
    if (!key) { console.log(`SKIP  ${src.subject} — ${src.file} missing or unreadable`); continue }

    const rows = []
    let skipped = 0
    for (const [id, v] of Object.entries(key)) {
      const qid = Number(id)
      const optId = v && v.correctOptionId != null ? Number(v.correctOptionId) : null
      const letter = v && v.correctAnswer ? String(v.correctAnswer).toUpperCase() : null
      // A key with neither form cannot grade anything — do not store a dead row.
      if (!Number.isFinite(qid) || (optId == null && !letter)) { skipped++; continue }
      rows.push({ questionId: qid, correctOptionId: optId, correctAnswer: letter, subject: src.subject })
    }

    for (let i = 0; i < rows.length; i += CHUNK) {
      await upsertChunk(rows.slice(i, i + CHUNK))
      process.stdout.write(`\r  ${src.subject}: ${Math.min(i + CHUNK, rows.length)}/${rows.length}`)
    }
    process.stdout.write('\n')
    console.log(`OK    ${src.subject}: ${rows.length} keys${skipped ? ` (${skipped} unusable, skipped)` : ''}`)
    grand += rows.length
  }

  const [{ n }] = await db.$queryRawUnsafe('SELECT COUNT(*)::int AS n FROM offline_answer_keys')
  console.log(`\nimported this run: ${grand}   total in table: ${n}`)
  process.exit(0)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
