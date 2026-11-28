'use strict'
// The teacher dashboard + homework against the real DB: above all, that nobody reaches
// another teacher's students or another student's homework. Skips without DATABASE_URL.
// Every row this file creates is deleted in teardown (fixed ids, so a crashed run is
// cleaned by the next one).

try { require('dotenv').config() } catch (_) { /* dotenv optional */ }
const test = require('node:test')
const assert = require('node:assert/strict')

const hasDb = !!process.env.DATABASE_URL
const db = hasDb ? require('../src/config/database') : null
const { createTeachingService } = require('../src/services/teaching/teaching.service')
const svc = hasDb ? createTeachingService(db) : null

const id = (n) => `00000000-0000-4000-8000-0000000ec${String(n).padStart(3, '0')}`
const T1 = id(1); const T2 = id(2); const S1 = id(11); const S2 = id(12)
const P1 = id(21); const P2 = id(22)
const L1 = id(31); const L2 = id(32); const C1 = id(33)
const USERS = [T1, T2, S1, S2]
const ROOM1 = 'https://meet.google.com/test-pair-one'

async function cleanup() {
  await db.$executeRawUnsafe(`DELETE FROM sessions WHERE id IN ($1::uuid, $2::uuid, $3::uuid)`, L1, L2, C1)
  await db.$executeRawUnsafe(`DELETE FROM teacher_assignments WHERE student_id = ANY($1::uuid[]) OR teacher_id = ANY($1::uuid[])`, USERS)
  await db.$executeRawUnsafe(`DELETE FROM users WHERE id = ANY($1::uuid[])`, USERS)
}

test.before(async () => {
  if (!hasDb) return
  await cleanup()
  const user = (uid, name, type, grade) => db.$executeRawUnsafe(
    `INSERT INTO users (id, name, email, grade, account_type, "updatedAt") VALUES ($1::uuid, $2, $3, $4, $5, now())`,
    uid, name, `${uid}@test.invalid`, grade, type)
  await user(T1, 'Test Teacher One', 'teacher', null)
  await user(T2, 'Test Teacher Two', 'teacher', null)
  await user(S1, 'Test Student One', 'student', 'Class 10')
  await user(S2, 'Test Student Two', 'student', 'Class 10')
  await db.$executeRawUnsafe(
    `INSERT INTO teacher_assignments (id, student_id, teacher_id, class_level, subject, room_link)
     VALUES ($1::uuid, $2::uuid, $3::uuid, 10, 'Science', $4), ($5::uuid, $6::uuid, $7::uuid, 10, 'Maths', NULL)`,
    P1, S1, T1, ROOM1, P2, S2, T2)
  const soon = new Date(Date.now() + 25 * 60000)
  await db.$executeRawUnsafe(
    `INSERT INTO sessions (id, title, subject, class_level, starts_at, duration_min, status, assignment_id, teacher_id, meeting_link)
     VALUES ($1::uuid, 'Science with S1', 'Science', 10, $2, 60, 'scheduled', $3::uuid, $4::uuid, NULL),
            ($5::uuid, 'Maths with S2', 'Maths', 10, $2, 60, 'scheduled', $6::uuid, $7::uuid, NULL),
            ($8::uuid, 'Class 10 revision', 'Science', 10, $2, 60, 'scheduled', NULL, NULL, 'https://meet.google.com/class-room')`,
    L1, soon, P1, T1, L2, P2, T2, C1)
})
test.after(async () => {
  if (!hasDb) return
  await cleanup()
  await db.$disconnect()
})

test('a teacher sees only their own lesson, student and room link', { skip: !hasDb }, async () => {
  const d1 = await svc.dashboard(T1)
  assert.equal(d1.next.id, L1)
  assert.equal(d1.next.roomLink, ROOM1)
  assert.equal(d1.next.studentName, 'Test Student One')
  assert.equal(d1.next.state, 'upcoming')
  assert.ok(d1.today.some((l) => l.id === L1))
  assert.ok(!JSON.stringify(d1).includes(L2) && !JSON.stringify(d1).includes(C1))
  assert.deepEqual(d1.students.map((s) => s.studentId), [S1])
  assert.equal(d1.students[0].roomLink, ROOM1)
  const d2 = await svc.dashboard(T2)
  assert.ok(!JSON.stringify(d2).includes(L1) && !JSON.stringify(d2).includes(ROOM1))
})

test('homework: only into your own pair, only your own student ticks it', { skip: !hasDb }, async () => {
  const due = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  await assert.rejects(svc.giveHomework(T1, { assignmentId: P2, title: 'Not mine', dueOn: due }), { statusCode: 404 })
  await assert.rejects(svc.giveHomework(T1, { assignmentId: 'nope', title: 'x', dueOn: due }), { statusCode: 422 })
  const hw = await svc.giveHomework(T1, { assignmentId: P1, title: 'Read 6.1', details: 'Questions 1-3', dueOn: due })
  assert.equal(hw.status, 'assigned')
  assert.equal(hw.studentName, 'Test Student One')

  assert.deepEqual((await svc.studentHomework(S1)).map((h) => h.id), [hw.id])
  assert.deepEqual(await svc.studentHomework(S2), [])
  assert.equal((await svc.studentHomework(S1))[0].teacherName, 'Test Teacher One')

  await assert.rejects(svc.markHomework(S2, hw.id, true), { statusCode: 404 }) // not S2's
  const done = await svc.markHomework(S1, hw.id, true)
  assert.equal(done.status, 'done')
  assert.ok(done.doneAt)
  const cls = await svc.myClass(T1)
  assert.deepEqual(cls.map((c) => [c.studentId, c.homework]), [[S1, { given: 1, done: 1, overdue: 0 }]])

  await assert.rejects(svc.editHomework(T2, hw.id, { title: 'hijack' }), { statusCode: 404 }) // not T2's
  const edited = await svc.editHomework(T1, hw.id, { title: 'Read 6.1 and 6.2' })
  assert.equal(edited.title, 'Read 6.1 and 6.2')
  assert.deepEqual(await svc.editHomework(T1, hw.id, { delete: true }), { id: hw.id, deleted: true })
  assert.deepEqual(await svc.studentHomework(S1), [])
})

test('a student sees their own classes and room link, never another student\'s', { skip: !hasDb }, async () => {
  const c1 = await svc.studentClasses(S1)
  assert.equal(c1.length, 1)
  assert.equal(c1[0].teacherName, 'Test Teacher One')
  assert.equal(c1[0].subject, 'Science')
  assert.equal(c1[0].roomLink, ROOM1)
  assert.equal(c1[0].next.id, L1)
  assert.equal(c1[0].next.state, 'upcoming')
  const c2 = await svc.studentClasses(S2)
  assert.ok(!JSON.stringify(c2).includes(ROOM1) && !JSON.stringify(c2).includes(L1))
  assert.deepEqual(await svc.studentClasses(T1), []) // a teacher has no classes as a student
})

test('Sessions: the class session for everyone, a pair lesson only for its own student', { skip: !hasDb }, async () => {
  const { forStudent } = require('../src/controllers/sessions.controller')
  const sessionsOf = async (userId) => {
    let body = null
    await forStudent({ user: { id: userId }, scope: { classNum: 10 } }, { status() { return this }, json(b) { body = b; return this } }, (e) => { throw e })
    return body.data.sessions
  }
  const s1 = await sessionsOf(S1)
  const byId = Object.fromEntries(s1.map((s) => [s.id, s]))
  assert.ok(byId[C1] && byId[C1].private === false)
  assert.ok(byId[L1], 'S1 sees their own lesson')
  assert.equal(byId[L1].meetingLink, ROOM1)          // the pair's room
  assert.equal(byId[L1].teacherName, 'Test Teacher One')
  assert.equal(byId[L1].private, true)
  assert.equal(byId[L1].title, 'Science with Test Teacher One') // the student's side of it
  assert.ok(!byId[L2], "S1 never sees S2's lesson")
  const s2 = (await sessionsOf(S2)).map((s) => s.id)
  assert.ok(s2.includes(C1) && s2.includes(L2))
  assert.ok(!s2.includes(L1) && !JSON.stringify(await sessionsOf(S2)).includes(ROOM1), "S2 never sees S1's lesson or room")
  // A teacher's id as a "student" gets only the class sessions.
  const asTeacher = (await sessionsOf(T1)).map((s) => s.id)
  assert.ok(!asTeacher.includes(L1) && !asTeacher.includes(L2))
})

test('one active teacher per student per subject; the demote check can count lessons', { skip: !hasDb }, async () => {
  await assert.rejects(db.$executeRawUnsafe(
    `INSERT INTO teacher_assignments (student_id, teacher_id, class_level, subject) VALUES ($1::uuid, $2::uuid, 10, 'SCIENCE')`, S1, T2))
  // The query admin/users.controller.js runs before removing a teacher's role.
  const [{ n }] = await db.$queryRawUnsafe(
    `SELECT count(*)::int AS n FROM "sessions" WHERE teacher_id = $1::uuid AND deleted_at IS NULL AND status = 'scheduled' AND starts_at > now()`, T1)
  assert.equal(n, 1)
})

test('photos: teacher attaches, student hands in work, teacher checks — each only on their own', { skip: !hasDb }, async () => {
  const PFX = 'http://test.local/uploads/homework/'
  const psvc = createTeachingService(db, { uploadsPrefix: PFX })
  const due = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  // only this server's homework uploads are accepted
  await assert.rejects(psvc.giveHomework(T1, { assignmentId: P1, title: 'x', dueOn: due, images: ['https://evil.example/a.jpg'] }), { statusCode: 422 })
  await assert.rejects(psvc.giveHomework(T1, { assignmentId: P1, title: 'x', dueOn: due, images: [`${PFX}../avatars/a.jpg`] }), { statusCode: 422 })
  const hw = await psvc.giveHomework(T1, { assignmentId: P1, title: 'Worksheet 3', dueOn: due, images: [`${PFX}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg`] })
  assert.deepEqual(hw.images, [`${PFX}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg`])
  assert.equal(hw.submission, null)

  // the student sees the teacher's photo and hands in work
  assert.deepEqual((await psvc.studentHomework(S1)).find((h) => h.id === hw.id).images, [`${PFX}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg`])
  await assert.rejects(psvc.submitHomework(S1, hw.id, {}), { statusCode: 422 })                       // nothing to hand in
  await assert.rejects(psvc.submitHomework(S2, hw.id, { note: 'mine' }), { statusCode: 404 })          // not S2's
  const sub = await psvc.submitHomework(S1, hw.id, { note: 'Done, see photo', images: [`${PFX}bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg`] })
  assert.equal(sub.status, 'done')
  assert.equal(sub.submission.note, 'Done, see photo')
  assert.deepEqual(sub.submission.images, [`${PFX}bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg`])
  assert.ok(sub.submission.submittedAt)

  // the teacher sees it, and checks it with a comment; another teacher cannot
  const mine = (await psvc.listHomework(T1)).find((h) => h.id === hw.id)
  assert.deepEqual(mine.submission.images, [`${PFX}bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg`])
  await assert.rejects(psvc.checkHomework(T2, hw.id, { comment: 'x' }), { statusCode: 404 })
  const checked = await psvc.checkHomework(T1, hw.id, { comment: 'Good. Redo Q3.' })
  assert.ok(checked.checkedAt)
  assert.equal(checked.teacherComment, 'Good. Redo Q3.')
  const seen = (await psvc.studentHomework(S1)).find((h) => h.id === hw.id)
  assert.ok(seen.checkedAt && seen.teacherComment === 'Good. Redo Q3.')

  // handing in again clears the check (the teacher looks again)
  const again = await psvc.submitHomework(S1, hw.id, { note: 'Redid Q3', images: [] })
  assert.equal(again.checkedAt, null)
  // undo keeps the draft but it is no longer handed in
  const undone = await psvc.markHomework(S1, hw.id, false)
  assert.equal(undone.status, 'assigned')
  assert.equal(undone.submission.note, 'Redid Q3')
  assert.equal(undone.submission.submittedAt, null)

  // who may upload: a teacher, a student with a teacher — not a stranger
  assert.equal(await psvc.mayUpload(T1, 'teacher'), true)
  assert.equal(await psvc.mayUpload(S1, 'student'), true)
  assert.equal(await psvc.mayUpload('00000000-0000-4000-8000-000000000999', 'student'), false)
  await psvc.editHomework(T1, hw.id, { delete: true })
})
