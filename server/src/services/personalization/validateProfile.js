'use strict'

// Server-side validation for a profile patch (complete-profile / migration). Never
// trust the client: this decides whether a role/class/stream combination is allowed to
// be saved. Pure + synchronous so it is unit-testable without a DB.
//
// Rules:
//   • accountType (if provided) must be student | parent. NOT teacher — see below.
//   • A provided, non-empty stream must be a known stream key.
//   • Students must have a class; Class 11/12 students must have a valid stream.
//   • Parents and teachers need neither class nor stream.
// Effective values fall back to the stored user row so a partial update (e.g. changing
// only language later) is validated against the already-saved profile.
//
// WHY 'teacher' IS NOT SELF-ASSIGNABLE
// This patch comes from the client, and 'teacher' is not a preference — it is a
// privilege. deriveScope grants a teacher accessLevel 'full', so anyone who could set
// it on themselves would unlock every paid lesson for nothing, permanently and without
// paying. It also opens the teacherOnly routes (/classroom/roster, /classroom/
// assignments) and, once the teacher dashboard ships, other people's children's names
// and the room links to their lessons.
//
// So a teacher is made by an admin, through PATCH /api/admin/users/:id/account-type,
// which is audited. The only thing allowed through here is a no-op: an existing teacher
// whose client echoes their own current type back while changing something else.

const { normalizeClass, roleOf } = require('./scope')
const { normalizeStream } = require('./subjects')

// Every type the system understands...
const ACCOUNT_TYPES = new Set(['student', 'parent', 'teacher'])
// ...and the subset a person may choose for themselves.
const SELF_ASSIGNABLE = new Set(['student', 'parent'])
const STREAM_KEYS = new Set(['pcm', 'pcb', 'pcmb', 'commerce', 'arts'])

// Returns { error: 'msg' } on rejection, or
// { normalizedAccount, normalizedStream } on success (either may be undefined).
function validateProfilePatch(patch, currentUser = {}) {
  const { grade, stream, accountType } = patch

  let normalizedAccount
  if (accountType !== undefined) {
    normalizedAccount = String(accountType).toLowerCase()
    if (!ACCOUNT_TYPES.has(normalizedAccount)) return { error: 'Invalid account type' }

    const current = String(currentUser.account_type || currentUser.accountType || '').toLowerCase()
    if (!SELF_ASSIGNABLE.has(normalizedAccount) && normalizedAccount !== current) {
      // Deliberately specific rather than a bare "Invalid account type": a real teacher
      // hitting this needs to know the account exists and who can grant it, not that
      // they typed something malformed.
      return { error: 'A teacher account can only be set up by an administrator. Ask your admin to grant it.' }
    }
    // An unchanged value is nothing to write, and leaving it out keeps the UPDATE
    // honest about what actually changed.
    if (normalizedAccount === current) normalizedAccount = undefined
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

module.exports = { validateProfilePatch, ACCOUNT_TYPES, SELF_ASSIGNABLE, STREAM_KEYS }
