'use strict'

// Derives a normalized "scope" from a user row — the single object every API and the
// client use to personalize + enforce content. Tolerates the historically-inconsistent
// grade formats ("Class 11", "11", "G11", "Grade 9", "11 PCM", …).

const { subjectsFor, normalizeStream } = require('./subjects')

const ROLES = new Set(['student', 'parent', 'teacher', 'admin'])

// Tester/QA accounts can browse EVERY class from a single login (via the class picker),
// instead of us creating a fresh signup per class. Everyone else stays locked to their
// own saved class. Extend with TESTER_EMAILS (comma-separated) without a code change.
const TESTER_EMAILS = new Set(
  String(process.env.TESTER_EMAILS || 'kjha70455@gmail.com,pathakarpita867@gmail.com,kadhalakumkum@gmail.com')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean),
)
const isTester = (user) =>
  !!(user && user.email && TESTER_EMAILS.has(String(user.email).toLowerCase()))

// Any grade string → integer class 1..12 (or null).
function normalizeClass(grade) {
  if (grade == null) return null
  const m = String(grade).match(/\d{1,2}/)
  if (!m) return null
  const n = parseInt(m[0], 10)
  return n >= 1 && n <= 12 ? n : null
}

function roleOf(user) {
  // The DB auth-role is authoritative for ADMIN: an admin is ALWAYS an admin, even if a
  // stale account_type ('student'/'teacher') is left over from an earlier session. Every
  // other role still honours account_type first, so the student↔parent dual-view (which
  // flips account_type without touching the auth-role) keeps working unchanged.
  const dbRole = String(user.role || '').toLowerCase()
  if (dbRole === 'admin') return 'admin'
  const a = String(user.account_type || user.accountType || '').toLowerCase()
  if (ROLES.has(a)) return a
  return ROLES.has(dbRole) ? dbRole : 'student'
}

// Returns: { role, classNum, className, stream, board, language, school, subjects, complete }
function deriveScope(user) {
  if (!user) {
    return { role: 'student', classNum: null, className: null, stream: null, board: null, language: null, school: null, subjects: [], complete: false }
  }
  const role = roleOf(user)
  const tester = isTester(user)
  const classNum = normalizeClass(user.grade)
  const stream = normalizeStream(user.stream) || normalizeStream(user.grade)
  const needsStream = classNum != null && classNum >= 11
  const subjects = subjectsFor(classNum, stream)

  // A profile is "complete" enough to personalize when we know the class (and, for
  // senior classes, the stream). Teachers/parents only need their role; testers pick
  // their class per-request via the picker, so they're never gated on CompleteProfile.
  let complete
  if (role === 'teacher' || role === 'admin') complete = true
  else if (role === 'parent') complete = true
  else complete = tester || (!!classNum && (!needsStream || !!stream))

  return {
    role,
    tester,
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
