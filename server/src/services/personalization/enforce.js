'use strict'

// Request-level enforcement helpers.
//
// Content class comes from the student's own saved class UNLESS they explicitly
// ask for another one with ?class=. Browsing is deliberate: a Class 9 student
// may want to look ahead at Class 11, and the syllabus is curriculum, not
// anyone's private data.
//
// This is NOT the bug the old rule was written against. That one was a silent
// DEFAULT: with no saved class the code fell back to a fixed class, so every
// user with an unfilled profile was shown Class 11 without asking for it. The
// difference is consent — an explicit param is the student choosing, and with
// no param the answer is still their saved class, or null. A missing profile
// still yields null and an empty result, never someone else's class.
//
// What this does NOT open: paid content. /api routes are gated separately by
// requireFullAccess, so browsing another class shows the same locked state a
// free account sees for its own.

const { isAllowedSubject } = require('./subjects')
const { normalizeClass } = require('./scope')

const err = (message, status) => { const e = new Error(message); e.status = status; return e }

// Authoritative class number for this request, or null when unknown.
// - Students: the class they asked for (?class=), else their saved class.
// - Parents/teachers/incomplete profiles: null → empty content (they don't consume
//   the student content endpoints; parents read a child's data via parent.controller).
function resolveClassNum(req) {
  const sc = req.scope
  if (!sc || sc.role !== 'student') return null
  const picked = normalizeClass(req.query && (req.query.class || req.query.className))
  if (picked) return picked
  return sc.classNum || null
}
// "Class N" for the request, or null when the class is unknown (→ empty results).
const resolveClassName = (req) => {
  const n = resolveClassNum(req)
  return n ? `Class ${n}` : null
}

// Reject a content request for a subject outside the student's syllabus.
//
// Scoped to the class being VIEWED, not the saved one. When those differ the
// check is skipped altogether rather than run against the student's stream: a
// Class 9 student has no stream, and subjectsFor(11, null) answers with the
// science union — so a stream-based check would 403 Class 11 Accountancy for
// everyone browsing, which is the whole thing being fixed. The stream still
// applies to their OWN class, where it means what it was written to mean.
function assertSubjectAllowed(req, subject) {
  const sc = req.scope
  if (!sc || sc.role !== 'student' || !sc.classNum) return // only enforce for known students
  if (sc.tester) return // testers roam all classes → their saved stream doesn't apply
  if (resolveClassNum(req) !== sc.classNum) return // browsing another class, not enrolling
  if (!isAllowedSubject(subject, sc.classNum, sc.stream)) {
    throw err('This subject is not part of your syllabus.', 403)
  }
}

// Block non-students (parent/teacher) from student-only actions (attempting quizzes etc.).
function assertStudent(req) {
  if (req.scope && req.scope.role !== 'student') {
    throw err('Only students can do this.', 403)
  }
}

module.exports = { resolveClassNum, resolveClassName, assertSubjectAllowed, assertStudent }
