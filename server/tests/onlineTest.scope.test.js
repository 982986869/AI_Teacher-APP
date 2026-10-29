'use strict'
// Opening an online test while browsing another class (?class=). The chapter and test
// lists already honour ?class=; opening the test must too, and the senior-class stream
// check must only apply to the student's OWN class (the rule assertSubjectAllowed uses),
// or a Class 11 student browsing Class 6 gets a 403 on every test.
const test = require('node:test')
const assert = require('node:assert/strict')

const svc = require('../src/services/onlineTest.service')
const { getTest } = require('../src/controllers/onlineTest.controller')

const TESTS = {
  1: { classLevel: 6, subject: 'Old - Maths', subjectSlug: 'old-maths' },
  2: { classLevel: 11, subject: 'Biology', subjectSlug: 'biology' },
  3: { classLevel: 11, subject: 'Physics', subjectSlug: 'physics' },
}
svc.getTestMeta = async (id) => TESTS[id] || null
svc.getTest = async (id) => (TESTS[id] ? { id: Number(id), questions: [{ id: 1 }] } : null)

const student = (classNum, stream = null) => ({ role: 'student', classNum, stream })

async function call(testId, query, scope) {
  const req = { params: { testId: String(testId) }, query, scope }
  const res = {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this },
    json(b) { this.body = b; return this },
  }
  let nextErr = null
  await getTest(req, res, (e) => { nextErr = e })
  if (nextErr) throw nextErr
  return res
}

test('a Class 11 student browsing Class 6 can open a Class 6 test', async () => {
  const res = await call(1, { class: '6' }, student(11, 'pcm'))
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.data.id, 1)
})

test('without ?class= the saved class still decides, so another class is refused', async () => {
  const res = await call(1, {}, student(11, 'pcm'))
  assert.equal(res.statusCode, 403)
})

test('browsing one class does not open a test from a third class', async () => {
  const res = await call(1, { class: '7' }, student(11, 'pcm'))
  assert.equal(res.statusCode, 403)
})

test('the stream check still applies to the student\'s own class', async () => {
  const res = await call(2, { class: '11' }, student(11, 'commerce'))
  assert.equal(res.statusCode, 403)
  assert.match(res.body.error, /syllabus/)
})

test('an in-stream test in the student\'s own class opens', async () => {
  const res = await call(3, {}, student(11, 'pcm'))
  assert.equal(res.statusCode, 200)
})
