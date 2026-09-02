'use strict'

// Account deletion helpers. Pure string work lives here, with no DB import, so the
// archiving rules can be tested without Postgres — see tests/accountDeletion.test.js.
//
// Why archive at all: users.email and users.phone are both UNIQUE. A soft-deleted
// row keeps holding them, which would stop the same person ever registering again —
// and registering again is exactly what the product decided they should do. So the
// values are rewritten in place to free the unique slot, keeping the original
// readable inside so support can still answer "whose account was this".

const PREFIX = 'deleted+'

// 'asha@example.com' -> 'deleted+<userId>+asha@example.com'
// The user id makes it unique even if the same address is deleted, re-registered
// and deleted again.
function archiveEmail(email, userId) {
  if (!email) return null
  if (isArchivedEmail(email)) return email
  return `${PREFIX}${userId}+${email}`
}

// '9876543210' -> 'del:<userId>:9876543210'
// A different shape from the email because a phone column has no local part to hide
// behind, and 'del:' can never collide with a real number.
function archivePhone(phone, userId) {
  if (!phone) return null
  if (isArchivedPhone(phone)) return phone
  return `del:${userId}:${phone}`
}

const isArchivedEmail = (email) => String(email || '').startsWith(PREFIX)
const isArchivedPhone = (phone) => String(phone || '').startsWith('del:')

// Recover what the student actually signed up with, for support lookups.
function originalEmail(email) {
  if (!isArchivedEmail(email)) return email
  const rest = String(email).slice(PREFIX.length)
  const plus = rest.indexOf('+')
  return plus === -1 ? rest : rest.slice(plus + 1)
}

function originalPhone(phone) {
  if (!isArchivedPhone(phone)) return phone
  const parts = String(phone).split(':')
  return parts.slice(2).join(':')
}

module.exports = {
  archiveEmail, archivePhone, isArchivedEmail, isArchivedPhone, originalEmail, originalPhone,
}
