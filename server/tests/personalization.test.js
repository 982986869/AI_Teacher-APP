'use strict'

const test = require('node:test')
const assert = require('node:assert')

const { subjectsFor, isAllowedSubject, normalizeStream } = require('../src/services/personalization/subjects')
const { deriveScope, normalizeClass } = require('../src/services/personalization/scope')
const { resolveClassNum, assertSubjectAllowed, assertStudent } = require('../src/services/personalization/enforce')
const { buildLessonUserPrompt, buildLessonSystemPrompt, profileLine, levelGuidance } = require('../src/prompts/lessonGeneration.prompt')
const { validateProfilePatch } = require('../src/services/personalization/validateProfile')

test('normalizeClass tolerates every historical grade format', () => {
  assert.equal(normalizeClass('Class 11'), 11)
  assert.equal(normalizeClass('11'), 11)
  assert.equal(normalizeClass('G12'), 12)
  assert.equal(normalizeClass('Grade 9'), 9)
  assert.equal(normalizeClass('11 PCM'), 11)
  assert.equal(normalizeClass('Class 6'), 6)
  assert.equal(normalizeClass(null), null)
  assert.equal(normalizeClass('K'), null)
  assert.equal(normalizeClass('99'), null)
})

test('normalizeStream maps variants', () => {
  assert.equal(normalizeStream('PCM'), 'pcm')
  assert.equal(normalizeStream('Science - PCB'), 'pcb')
  assert.equal(normalizeStream('Commerce'), 'commerce')
  assert.equal(normalizeStream('Humanities'), 'arts')
  assert.equal(normalizeStream(''), null)
})

test('subjectsFor: class band + stream', () => {
  assert.deepEqual(subjectsFor(8), ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'])
  assert.deepEqual(subjectsFor(11, 'pcm'), ['Physics', 'Chemistry', 'Mathematics'])
  assert.deepEqual(subjectsFor(11, 'pcb'), ['Physics', 'Chemistry', 'Biology'])
  assert.ok(subjectsFor(12, 'commerce').includes('Accountancy'))
  assert.ok(subjectsFor(11, null).includes('Biology')) // no stream → safe science union
})

test('isAllowedSubject blocks out-of-syllabus content', () => {
  assert.equal(isAllowedSubject('Biology', 11, 'pcm'), false)  // PCM has no Biology
  assert.equal(isAllowedSubject('Mathematics', 11, 'pcm'), true)
  assert.equal(isAllowedSubject('Biology', 11, 'pcb'), true)
  assert.equal(isAllowedSubject('Biology', 8, null), false)    // class 8 is "Science", not Biology
  assert.equal(isAllowedSubject('Physics', null, null), true)  // unknown class → don't block
})

test('deriveScope for the test personas', () => {
  const s6 = deriveScope({ grade: 'Class 6', account_type: 'student' })
  assert.equal(s6.classNum, 6); assert.equal(s6.role, 'student'); assert.equal(s6.complete, true); assert.equal(s6.stream, null)

  const pcm = deriveScope({ grade: '11', stream: 'PCM', account_type: 'student' })
  assert.equal(pcm.classNum, 11); assert.equal(pcm.stream, 'pcm'); assert.equal(pcm.complete, true)
  assert.deepEqual(pcm.subjects, ['Physics', 'Chemistry', 'Mathematics'])

  const pcb = deriveScope({ grade: 'Class 12', stream: 'pcb', account_type: 'student' })
  assert.deepEqual(pcb.subjects, ['Physics', 'Chemistry', 'Biology'])

  const seniorNoStream = deriveScope({ grade: 'Class 11', account_type: 'student' })
  assert.equal(seniorNoStream.complete, false) // senior class must pick a stream

  const parent = deriveScope({ grade: null, account_type: 'parent' })
  assert.equal(parent.role, 'parent'); assert.equal(parent.complete, true)

  const legacyRoleEnum = deriveScope({ grade: 'Class 9', role: 'TEACHER' })
  assert.equal(legacyRoleEnum.role, 'teacher')
})

test('enforce: only the saved class is used — never the client ?class= param', () => {
  const req = { scope: deriveScope({ grade: 'Class 8', account_type: 'student' }), query: { class: '11' } }
  assert.equal(resolveClassNum(req), 8) // ignores the client param

  // No saved class → null (NOT a fallback to 11 and NOT the client param). This is
  // what stops "all classes see Class 11 content": null → empty query result.
  const noClass = { scope: deriveScope({ grade: null, account_type: 'student' }), query: { class: '10' } }
  assert.equal(resolveClassNum(noClass), null)

  // Parents/teachers get no content class either.
  const parent = { scope: deriveScope({ account_type: 'parent' }), query: { class: '11' } }
  assert.equal(resolveClassNum(parent), null)
})

test('AI lesson prompt carries the student profile (board/stream/language) automatically', () => {
  const p = buildLessonUserPrompt('Kinematics', 'Physics', '11', { board: 'CBSE', stream: 'pcm', language: 'Hindi' })
  assert.match(p, /Grade level: 11/)
  assert.match(p, /CBSE board/)
  assert.match(p, /PCM stream/)
  assert.match(p, /Explain in Hindi/)
  // English needs no language instruction; no profile → no profile line
  assert.equal(/Explain in/.test(buildLessonUserPrompt('X', 'Y', '8', { language: 'English' })), false)
  assert.equal(profileLine({}), '')
})

test('AI Teacher teaches the SAME topic at a different depth per class', () => {
  const c6 = levelGuidance('6', {})
  const c8 = levelGuidance('Class 8', {})
  const c11 = levelGuidance('11', { stream: 'pcm' })
  const c12 = levelGuidance('12', { stream: 'pcb' })

  // Junior classes: simple, no advanced formulas — and Class 6 differs from Class 8.
  assert.match(c6, /Class 6/); assert.match(c6, /simple/i); assert.match(c6, /NO advanced formulas|NO derivations/i)
  assert.match(c8, /Class 8/); assert.match(c8, /basic|light/i)
  assert.notEqual(c6, c8) // Class 6 gets a simpler explanation than Class 8
  // Senior classes: rigour, derivations, stream-aware exam pitch.
  assert.match(c11, /Class 11/); assert.match(c11, /derivation/i); assert.match(c11, /PCM/)
  assert.match(c12, /Class 12/); assert.match(c12, /NEET/)  // PCB → NEET
  assert.match(levelGuidance('12', { stream: 'pcm' }), /JEE/)

  // No class → no guidance (and the lesson prompt requires the class upstream).
  assert.equal(levelGuidance(null), '')

  // AI Teacher ALWAYS teaches — it must never refuse a topic as out-of-syllabus.
  assert.match(buildLessonSystemPrompt(), /NEVER refuse/i)
  assert.match(buildLessonSystemPrompt(), /outside your syllabus/i)
  // Junior bands still teach an above-class topic (just simply), never refuse.
  assert.match(c6, /never refuse/i)
  assert.match(c8, /never refuse/i)
  // An above-class topic for a junior is still taught (instruction says ALWAYS teach).
  assert.match(buildLessonUserPrompt('Integration', 'Maths', '6', {}), /ALWAYS teach/i)

  // The level line is actually injected into the lesson prompt, tied to the class.
  const p8 = buildLessonUserPrompt('Motion', 'Physics', '8', { board: 'CBSE' })
  const p11 = buildLessonUserPrompt('Motion', 'Physics', '11', { board: 'CBSE', stream: 'pcm' })
  assert.match(p8, /LEVEL — Class 8/)
  assert.match(p11, /LEVEL — Class 11/)
  assert.notEqual(p8, p11) // same topic, different depth
})

test('validateProfilePatch: complete-profile rules (never trust the client)', () => {
  const ok = (r) => assert.equal(r.error, undefined)
  const err = (r, re) => assert.match(r.error, re)

  // Junior student needs only a class.
  ok(validateProfilePatch({ accountType: 'student', grade: 'Class 8' }, {}))
  // Class without stream is fine below 11.
  ok(validateProfilePatch({ accountType: 'student', grade: 'Class 10' }, {}))

  // Senior student must pick a valid stream.
  err(validateProfilePatch({ accountType: 'student', grade: 'Class 11' }, {}), /Stream is required/)
  ok(validateProfilePatch({ accountType: 'student', grade: 'Class 11', stream: 'PCM' }, {}))

  // Student with no class at all is rejected.
  err(validateProfilePatch({ accountType: 'student' }, {}), /Class is required/)

  // Invalid stream / role are rejected.
  err(validateProfilePatch({ accountType: 'student', grade: '11', stream: 'PCX' }, {}), /Invalid stream/)
  err(validateProfilePatch({ accountType: 'wizard' }, {}), /Invalid account type/)

  // Parent and teacher need neither class nor stream.
  ok(validateProfilePatch({ accountType: 'parent' }, {}))
  ok(validateProfilePatch({ accountType: 'teacher' }, {}))

  // Partial update validates against the stored row: senior student changing only
  // language keeps their already-saved stream.
  ok(validateProfilePatch({ language: 'Hindi' }, { account_type: 'student', grade: 'Class 12', stream: 'pcb' }))
  err(validateProfilePatch({ language: 'Hindi' }, { account_type: 'student', grade: 'Class 12' }), /Stream is required/)
})

test('enforce: subject + role guards throw 403', () => {
  const pcm = { scope: deriveScope({ grade: '11', stream: 'PCM', account_type: 'student' }), query: {} }
  assert.throws(() => assertSubjectAllowed(pcm, 'Biology'), (e) => e.status === 403)
  assert.doesNotThrow(() => assertSubjectAllowed(pcm, 'Physics'))

  const parent = { scope: deriveScope({ account_type: 'parent' }), query: {} }
  assert.throws(() => assertStudent(parent), (e) => e.status === 403)
})
