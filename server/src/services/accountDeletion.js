'use strict'

// Account deletion helpers. Pure functions with no DB import, so the rules can be
// tested without Postgres — see tests/accountDeletion.test.js.
//
// Deleting an account is REVERSIBLE for 30 days. Through that window the row keeps
// its email and phone exactly as they were: the address is what a returning student
// is recognised by, so rewriting it would make coming back impossible.
//
// An earlier release did rewrite them ('deleted+<uuid>+asha@example.com'), because
// the rule then was "you can never sign in again, register afresh". That rule is
// gone. The readers below stay anyway, because that release is DEPLOYED: any account
// deleted between it and this one is still sitting in the database in the archived
// shape and has to be recognised and undone once. See prisma/sql/account_reactivation.sql.

const PREFIX = 'deleted+'

// How long a deleted account can still be brought back. After this staff may purge
// it from the admin console — nothing purges on its own.
const GRACE_PERIOD_DAYS = 30

// The moment the grace period runs out for an account deleted at `deletedAt`.
function purgeDueAt(deletedAt) {
  if (!deletedAt) return null
  const due = new Date(deletedAt)
  if (Number.isNaN(due.getTime())) return null
  due.setUTCDate(due.getUTCDate() + GRACE_PERIOD_DAYS)
  return due
}

// Whole days still left before staff may purge. Never negative: 0 means "due now",
// which is what the admin console renders as READY.
function daysLeft(deletedAt, now = new Date()) {
  const due = purgeDueAt(deletedAt)
  if (!due) return null
  return Math.max(0, Math.ceil((due.getTime() - now.getTime()) / 86400000))
}

const isArchivedEmail = (email) => String(email || '').startsWith(PREFIX)
const isArchivedPhone = (phone) => String(phone || '').startsWith('del:')

// 'deleted+<uuid>+asha@example.com' -> 'asha@example.com'
function originalEmail(email) {
  if (!isArchivedEmail(email)) return email
  const rest = String(email).slice(PREFIX.length)
  const plus = rest.indexOf('+')
  return plus === -1 ? rest : rest.slice(plus + 1)
}

// 'del:<uuid>:9876543210' -> '9876543210'
function originalPhone(phone) {
  if (!isArchivedPhone(phone)) return phone
  const parts = String(phone).split(':')
  return parts.slice(2).join(':')
}

module.exports = {
  GRACE_PERIOD_DAYS, purgeDueAt, daysLeft,
  isArchivedEmail, isArchivedPhone, originalEmail, originalPhone,
}
