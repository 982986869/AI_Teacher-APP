'use strict'

// Offline-bank online tests (Classes 10/11/12). The questions live in the app
// bundle, not the DB, so only the answer KEY is mirrored server-side
// (offline_answer_keys, populated by scripts/import-offline-answer-keys.js).
//
// Grading still happens here rather than trusting the client's number, so the
// stored score always agrees with the stored answers — the same rule the mock-test
// and ot_tests paths follow.

const db = require('../config/database')

// answers = { "<questionId>": "A" }  (letters, matching the bank's option order)
// questionIds = every question in the test, so `total` counts skipped ones too.
async function submit({ userId, classLevel, subject, chapter, testLabel, answers = {}, questionIds = [], timeTakenSec = 0 }) {
  const ids = (Array.isArray(questionIds) ? questionIds : [])
    .map((x) => Number(x)).filter(Number.isFinite)
  const answered = Object.entries(answers || {})
    .filter(([, v]) => v != null)
    .map(([k, v]) => ({ id: Number(k), letter: String(v).toUpperCase() }))
    .filter((a) => Number.isFinite(a.id))

  const total = ids.length || answered.length
  const attempted = answered.length

  // Only the answered questions need a key lookup.
  let keys = new Map()
  if (attempted) {
    const rows = await db.$queryRawUnsafe(
      `SELECT question_id, correct_answer FROM offline_answer_keys
        WHERE question_id = ANY($1::bigint[])`,
      answered.map((a) => a.id),
    ).catch(() => [])
    keys = new Map((rows || []).map((r) => [String(r.question_id), r.correct_answer]))
  }

  let graded = 0
  let correct = 0
  for (const a of answered) {
    const key = keys.get(String(a.id))
    if (!key) continue           // no answer key for this question — cannot judge it
    graded += 1
    if (String(key).toUpperCase() === a.letter) correct += 1
  }
  const wrong = graded - correct

  // Best-effort persist: the student's result comes back either way, matching the
  // mock-test and online-test paths.
  try {
    await db.$executeRawUnsafe(
      `INSERT INTO offline_test_attempts
         (user_id, class_level, subject, chapter, test_label, answers,
          total, attempted, correct_count, wrong_count, graded_count, time_taken_sec)
       VALUES ($1::uuid,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12)`,
      userId || null,
      Number(classLevel) || null,
      subject || null,
      chapter || null,
      testLabel || null,
      JSON.stringify(answers || {}),
      total, attempted, correct, wrong, graded, Number(timeTakenSec) || 0,
    )
  } catch (e) { console.warn('[OfflineTest] attempt save skipped:', e.message) }

  return { total, attempted, correct, wrong, graded, skipped: Math.max(0, total - attempted) }
}

module.exports = { submit }
