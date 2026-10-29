'use strict'
// Opening a mock test while browsing another class (?class=). The list already honours
// ?class=; opening the test must too, and the senior-class stream check must only apply
// to the student's OWN class (the rule assertSubjectAllowed uses), or a Class 11 student
// browsing Class 9 gets "not part of your syllabus" on every test.
const test = require('node:test')
const assert = require('node:assert/strict')

const svc = require('../src/services/mockTest.service')
const { getQuestions } = require('../src/controllers/mockTest.controller')
const { errorHandler } = require('../src/middleware/errorHandler')

const TESTS = {
  1: { classLevel: 9, subject: 'Old - Maths' },
  2: { classLevel: 11, subject: 'Biology' },
  3: { classLevel: 11, subject: 'Physics' },
}
svc.getTestMeta = async (id) => TESTS[id] || null
svc.getQuestions = async (id) => ({ questions: [{ id: 1 }], total: 1, testId: id })

const student = (classNum, stream = null) => ({ role: 'student', classNum, stream })

async function call(id, query, scope) {
  const req = { params: { id: String(id) }, query, scope }
  const res = {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this },
    json(b) { this.body = b; return this },
  }
  // AppError carries `statusCode`, which the controller forwards to next(); Express
  // then hands it to the global errorHandler — do the same here.
  let nextErr = null
  await getQuestions(req, res, (e) => { nextErr = e })
  if (nextErr) errorHandler(nextErr, req, res, () => {})
  return res
}

test('a Class 11 student browsing Class 9 can open a Class 9 mock', async () => {
  const res = await call(1, { class: '9' }, student(11, 'pcm'))
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.data.questions.length, 1)
})

test('without ?class= the saved class still decides, so another class is refused', async () => {
  const res = await call(1, {}, student(11, 'pcm'))
  assert.equal(res.statusCode, 403)
})

test('browsing one class does not open a mock from a third class', async () => {
  const res = await call(1, { class: '10' }, student(11, 'pcm'))
  assert.equal(res.statusCode, 403)
})

test('the stream check still applies to the student\'s own class', async () => {
  const res = await call(2, { class: '11' }, student(11, 'commerce'))
  assert.equal(res.statusCode, 403)
  assert.match(res.body.error, /syllabus/)
})

test('an in-stream mock in the student\'s own class opens', async () => {
  const res = await call(3, {}, student(11, 'pcm'))
  assert.equal(res.statusCode, 200)
})
