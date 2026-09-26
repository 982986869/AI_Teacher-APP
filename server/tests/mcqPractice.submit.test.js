'use strict'

// mcqPractice.service — submit/grade.
//
// The app's quiz reports answers as a { questionId: optionId } map, while the
// service was written for [{ questionId, optionId }]. The mismatch made every
// submit throw, so no practice attempt was ever saved. The Prisma client is
// stubbed into require.cache before the service is loaded — no database needed.

const test = require('node:test')
const assert = require('node:assert')
const path = require('node:path')

const DB_PATH = require.resolve(path.join(__dirname, '..', 'src', 'config', 'database.js'))

// Subtopic 7 owns questions 101 (correct 1001), 102 (correct 1002), 103 (correct 1003).
const QUESTIONS = [
  { id: 101n, correct_option_id: 1001n },
  { id: 102n, correct_option_id: 1002n },
  { id: 103n, correct_option_id: 1003n },
]
const executes = []

require.cache[DB_PATH] = {
  id: DB_PATH,
  filename: DB_PATH,
  loaded: true,
  exports: {
    mcq_questions: { findMany: async () => QUESTIONS },
    $executeRawUnsafe: async (sql, ...params) => { executes.push({ sql, params }); return 1 },
  },
}

const svc = require('../src/services/mcqPractice.service')

test('submit accepts the { questionId: optionId } map the app sends, and saves it', async () => {
  executes.length = 0
  const out = await svc.submitTest('user-1', 7, { 101: 1001, 102: 9999 })
  assert.equal(out.total, 3)
  assert.equal(out.attempted, 2)
  assert.equal(out.correct, 1)
  assert.equal(executes.length, 1, 'attempts are persisted')
  // two rows × 5 params
  assert.equal(executes[0].params.length, 10)
})

test('submit still accepts the documented [{ questionId, optionId }] array', async () => {
  const out = await svc.submitTest(null, 7, [{ questionId: 101, optionId: 1001 }, { questionId: 103, optionId: 1003 }])
  assert.equal(out.attempted, 2)
  assert.equal(out.correct, 2)
})

test('a repeated question id counts once (last answer wins), so scores cannot exceed 100%', async () => {
  executes.length = 0
  const out = await svc.submitTest('user-1', 7, [
    { questionId: 101, optionId: 1001 },
    { questionId: 101, optionId: 1001 },
    { questionId: 101, optionId: 1001 },
    { questionId: 101, optionId: 1001 },
  ])
  assert.equal(out.attempted, 1)
  assert.equal(out.correct, 1)
  assert.ok(out.score <= 100)
  assert.equal(executes[0].params.length, 5, 'one row, so the upsert cannot hit the same key twice')
})

test("ids from another subtopic are ignored, not graded or saved under this one", async () => {
  executes.length = 0
  const out = await svc.submitTest('user-1', 7, { 101: 1001, 555: 1 })
  assert.equal(out.attempted, 1)
  assert.equal(out.results.length, 1)
  assert.equal(executes[0].params.length, 5)
})

test('missing or malformed answers grade as nothing attempted instead of crashing', async () => {
  for (const bad of [undefined, null, 'x', 42]) {
    const out = await svc.submitTest(null, 7, bad)
    assert.equal(out.attempted, 0)
  }
})
