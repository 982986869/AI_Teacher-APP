'use strict'
// The teacher dashboard's shape, homework rules and the teacher gate — no DB.
const test = require('node:test')
const assert = require('node:assert/strict')

const { buildDashboard, lessonOut, weekWindow, istDateKey } = require('../src/services/teaching/dashboard')
const { cleanHomework, validDate } = require('../src/services/teaching/teaching.service')
const { requireTeacher } = require('../src/middleware/auth')

// 2026-11-28 15:30 IST = 10:00 UTC
const NOW = new Date('2026-11-28T10:00:00Z')
const lesson = (id, startUtc, min = 60, extra = {}) => ({ id, assignmentId: 'a1', studentName: 'Aarav', subject: 'Science', classLevel: 10, startsAt: startUtc, endsAt: new Date(new Date(startUtc).getTime() + min * 60000), roomLink: 'https://meet.google.com/abc', ...extra })

test('IST days: an 11:30 PM IST lesson is on that IST day, not the next UTC one', () => {
  assert.equal(istDateKey('2026-11-28T18:00:00Z'), '2026-11-28') // 23:30 IST
  assert.equal(istDateKey('2026-11-28T18:30:00Z'), '2026-11-29') // 00:00 IST next day
  const w = weekWindow(NOW)
  assert.equal(w.today, '2026-11-28')
  assert.equal(w.from.toISOString(), '2026-11-27T18:30:00.000Z') // IST midnight
  assert.equal(w.to.toISOString(), '2026-12-04T18:30:00.000Z')   // 7 days later
})

test('Join opens 10 minutes before and stays open until the lesson ends', () => {
  const l = (start) => lessonOut(lesson('x', start), NOW)
  assert.equal(l('2026-11-28T10:25:00Z').state, 'upcoming')   // starts in 25 min
  assert.equal(l('2026-11-28T10:25:00Z').joinOpensAt, '2026-11-28T10:15:00.000Z')
  assert.equal(l('2026-11-28T10:10:00Z').state, 'joinable')   // starts in 10 min
  assert.equal(l('2026-11-28T09:30:00Z').state, 'joinable')   // started 30 min ago, 60 min long
  assert.equal(l('2026-11-28T08:59:00Z').state, 'over')       // ended a minute ago
  // no stored end: start + duration
  assert.equal(lessonOut({ id: 'y', startsAt: '2026-11-28T09:30:00Z', durationMin: 45 }, NOW).endsAt, '2026-11-28T10:15:00.000Z')
})

test('the dashboard: next lesson, today (past ones too), 7 days, my students', () => {
  const lessons = [
    lesson('past', '2026-11-28T05:00:00Z'),                       // this morning, over
    lesson('soon', '2026-11-28T10:25:00Z'),                       // in 25 min
    lesson('late', '2026-11-28T18:00:00Z', 60, { assignmentId: 'a2', studentName: 'Riya', subject: 'Maths' }), // 23:30 IST today
    lesson('tue', '2026-12-01T11:30:00Z'),
  ]
  const pairs = [
    { assignmentId: 'a1', studentId: 's1', studentName: 'Aarav', classLevel: 10, subject: 'Science', roomLink: 'https://meet.google.com/abc' },
    { assignmentId: 'a2', studentId: 's2', studentName: 'Riya', classLevel: 9, subject: 'Maths', roomLink: null },
    { assignmentId: 'a3', studentId: 's3', studentName: 'Kabir', classLevel: 8, subject: 'English', roomLink: null, nextLessonAt: '2026-12-20T10:00:00Z' },
  ]
  const d = buildDashboard({ now: NOW, pairs, lessons })
  assert.equal(d.next.id, 'soon')
  assert.deepEqual(d.today.map((l) => l.id), ['past', 'soon', 'late'])
  assert.equal(d.today[0].state, 'over')
  assert.equal(d.week.length, 7)
  assert.deepEqual(d.week.map((w) => w.label), ['Today', 'Tomorrow', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  assert.deepEqual(d.week[3].lessons.map((l) => l.id), ['tue'])
  assert.equal(d.students[0].nextLessonAt, '2026-11-28T10:25:00.000Z')
  assert.equal(d.students[1].nextLessonAt, '2026-11-28T18:00:00.000Z')
  assert.equal(d.students[2].nextLessonAt, '2026-12-20T10:00:00.000Z') // beyond this week, from the DB
})

test('the next lesson can be after this week; no lessons at all → nulls and empty days', () => {
  const later = lesson('later', '2026-12-15T10:00:00Z')
  assert.equal(buildDashboard({ now: NOW, lessons: [], nextRow: later }).next.id, 'later')
  const empty = buildDashboard({ now: NOW })
  assert.equal(empty.next, null)
  assert.deepEqual(empty.today, [])
  assert.ok(empty.week.every((w) => w.lessons.length === 0))
})

test('homework input: title, details and a real, not-past due date', () => {
  assert.deepEqual(cleanHomework({ title: '  Chapter 6   questions ', details: ' 1 to 5 ', dueOn: '2026-11-30' }, { now: NOW }),
    { title: 'Chapter 6 questions', details: '1 to 5', dueOn: '2026-11-30' })
  assert.deepEqual(cleanHomework({ title: 'x', dueOn: '2026-11-28' }, { now: NOW }).dueOn, '2026-11-28') // today is fine
  const bad = [
    [{ title: '', dueOn: '2026-11-30' }, /title/],
    [{ title: 'a'.repeat(121), dueOn: '2026-11-30' }, /120/],
    [{ title: 'x', dueOn: '2026-11-27' }, /past/],
    [{ title: 'x', dueOn: '2026-02-30' }, /due date/],
    [{ title: 'x', dueOn: '30-11-2026' }, /due date/],
    [{ title: 'x', details: 'd'.repeat(2001), dueOn: '2026-11-30' }, /2000/],
  ]
  for (const [b, re] of bad) assert.throws(() => cleanHomework(b, { now: NOW }), re, JSON.stringify(b).slice(0, 60))
  // an edit may send only some fields
  assert.deepEqual(cleanHomework({ details: 'new' }, { partial: true, now: NOW }), { details: 'new' })
  assert.equal(validDate('2028-02-29'), true)
  assert.equal(validDate('2027-02-29'), false)
})

test('only a teacher (made by an admin) passes the teacher gate', () => {
  const run = (req) => { let err = 'none'; requireTeacher(req, {}, (e) => { err = e }); return err }
  assert.equal(run({ user: { id: 't', is_active: true }, scope: { role: 'teacher' } }), undefined)
  assert.equal(run({ user: { id: 's' }, scope: { role: 'student' } }).statusCode, 403)
  assert.equal(run({ user: { id: 'p' }, scope: { role: 'parent' } }).statusCode, 403)
  assert.equal(run({ user: { id: 'a' }, scope: { role: 'admin' } }).statusCode, 403)
  assert.equal(run({ user: { id: 't', is_active: false }, scope: { role: 'teacher' } }).statusCode, 403)
  assert.equal(run({}).statusCode, 401)
})

test('a pair lesson never shows in the class Sessions list', async () => {
  const dbPath = require.resolve('../src/config/database')
  const seen = []
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { $queryRawUnsafe: async (sql) => { seen.push(sql); return [] } } }
  delete require.cache[require.resolve('../src/controllers/sessions.controller')]
  const { forStudent } = require('../src/controllers/sessions.controller')
  await forStudent({ scope: { classNum: 10 } }, { status() { return this }, json() { return this } }, (e) => { throw e })
  assert.match(seen[0], /assignment_id IS NULL/)
  delete require.cache[dbPath]
  delete require.cache[require.resolve('../src/controllers/sessions.controller')]
})

test('homework photos: only this server\'s homework uploads, at most 5, no duplicates', () => {
  const { cleanImages } = require('../src/services/teaching/teaching.service')
  const P = 'https://api.example/uploads/homework/'
  assert.equal(cleanImages(undefined, P), undefined)
  assert.deepEqual(cleanImages([`${P}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg`, `${P}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg`, `${P}bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png`], P), [`${P}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg`, `${P}bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png`])
  for (const bad of [[`https://evil/x.jpg`], [`${P}../../etc/passwd`], [`${P}a b.jpg`], [7], 'x']) {
    assert.throws(() => cleanImages(bad, P), undefined, JSON.stringify(bad))
  }
  assert.throws(() => cleanImages([1, 2, 3, 4, 5, 6].map((n) => `${P}${String(n).repeat(32)}.jpg`), P), /5/)
})
