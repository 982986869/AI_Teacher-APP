'use strict'

// Request-level enforcement helpers. The golden rule: a student's OWN class/stream
// (from their JWT, via req.scope) is the ONLY source of truth for content. We never
// trust the client's ?class= param and never fall back to a default class — doing so
// used to leak Class 11 content to every user with an unfilled profile ("all classes
// see the same content"). When the class is unknown, callers get null and their query
// returns an empty result, which the UI renders as a "coming soon" empty state.

const { isAllowedSubject } = require('./subjects')

const err = (message, status) => { const e = new Error(message); e.status = status; return e }

// Authoritative class number for this request, or null when unknown.
// - Students: their saved class (req.scope.classNum). Never the client param.
// - Parents/teachers/incomplete profiles: null → empty content (they don't consume
//   the student content endpoints; parents read a child's data via parent.controller).
function resolveClassNum(req) {
  if (req.scope && req.scope.role === 'student' && req.scope.classNum) return req.scope.classNum
  return null
}
// "Class N" for the request, or null when the class is unknown (→ empty results).
const resolveClassName = (req) => {
  const n = resolveClassNum(req)
  return n ? `Class ${n}` : null
}

// Reject a content request for a subject outside the student's syllabus.
function assertSubjectAllowed(req, subject) {
  const sc = req.scope
  if (!sc || sc.role !== 'student' || !sc.classNum) return // only enforce for known students
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
