'use strict'

// Server-side validation for a profile patch (complete-profile / migration). Never
// trust the client: this decides whether a role/class/stream combination is allowed to
// be saved. Pure + synchronous so it is unit-testable without a DB.
//
// Rules:
//   • accountType (if provided) must be student | parent | teacher.
//   • A provided, non-empty stream must be a known stream key.
//   • Students must have a class; Class 11/12 students must have a valid stream.
//   • Parents and teachers need neither class nor stream.
// Effective values fall back to the stored user row so a partial update (e.g. changing
// only language later) is validated against the already-saved profile.

const { normalizeClass, roleOf } = require('./scope')
const { normalizeStream } = require('./subjects')

const ACCOUNT_TYPES = new Set(['student', 'parent', 'teacher'])
const STREAM_KEYS = new Set(['pcm', 'pcb', 'pcmb', 'commerce', 'arts'])

// Returns { error: 'msg' } on rejection, or
// { normalizedAccount, normalizedStream } on success (either may be undefined).
function validateProfilePatch(patch, currentUser = {}) {
  const { grade, stream, accountType } = patch

  let normalizedAccount
  if (accountType !== undefined) {
    normalizedAccount = String(accountType).toLowerCase()
    if (!ACCOUNT_TYPES.has(normalizedAccount)) return { error: 'Invalid account type' }
  }
  const effectiveRole = normalizedAccount || roleOf(currentUser)

  let normalizedStream
  if (stream !== undefined && stream) {
    normalizedStream = normalizeStream(stream)
    if (!normalizedStream || !STREAM_KEYS.has(normalizedStream)) {
      return { error: 'Invalid stream' }
    }
  }

  if (effectiveRole === 'student') {
    const effGrade = grade !== undefined ? grade : currentUser.grade
    const classNum = normalizeClass(effGrade)
    if (!classNum) return { error: 'Class is required for students' }
    if (classNum >= 11) {
      const effStream = stream !== undefined ? normalizedStream : normalizeStream(currentUser.stream)
      if (!effStream || !STREAM_KEYS.has(effStream)) {
        return { error: 'Stream is required for Class 11–12' }
      }
    }
  }

  return { normalizedAccount, normalizedStream }
}

module.exports = { validateProfilePatch, ACCOUNT_TYPES, STREAM_KEYS }
