'use strict'

// Derives a normalized "scope" from a user row — the single object every API and the
// client use to personalize + enforce content. Tolerates the historically-inconsistent
// grade formats ("Class 11", "11", "G11", "Grade 9", "11 PCM", …).

const { subjectsFor, normalizeStream } = require('./subjects')

const ROLES = new Set(['student', 'parent', 'teacher', 'admin'])

// Any grade string → integer class 1..12 (or null).
function normalizeClass(grade) {
  if (grade == null) return null
  const m = String(grade).match(/\d{1,2}/)
  if (!m) return null
  const n = parseInt(m[0], 10)
  return n >= 1 && n <= 12 ? n : null
}

function roleOf(user) {
  const a = String(user.account_type || user.accountType || '').toLowerCase()
  if (ROLES.has(a)) return a
  const r = String(user.role || 'student').toLowerCase()
  return ROLES.has(r) ? r : 'student'
}

// Returns: { role, classNum, className, stream, board, language, school, subjects, complete }
function deriveScope(user) {
  if (!user) {
    return { role: 'student', classNum: null, className: null, stream: null, board: null, language: null, school: null, subjects: [], complete: false }
  }
  const role = roleOf(user)
  const classNum = normalizeClass(user.grade)
  const stream = normalizeStream(user.stream) || normalizeStream(user.grade)
  const needsStream = classNum != null && classNum >= 11
  const subjects = subjectsFor(classNum, stream)

  // A profile is "complete" enough to personalize when we know the class (and, for
  // senior classes, the stream). Teachers/parents only need their role.
  let complete
  if (role === 'teacher' || role === 'admin') complete = true
  else if (role === 'parent') complete = true
  else complete = !!classNum && (!needsStream || !!stream)

  return {
    role,
    classNum,
    className: classNum ? `Class ${classNum}` : null,
    stream: needsStream ? stream : null,
    board: user.board || null,
    language: user.language || null,
    school: user.school || null,
    subjects,
    complete,
  }
}

module.exports = { deriveScope, normalizeClass, roleOf }
