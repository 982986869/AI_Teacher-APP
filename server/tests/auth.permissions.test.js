'use strict'

// The app gates its Support tab on this array. If /me stops returning it, or returns a
// role's permissions when the caller is a student, the app silently shows or hides a
// console it has no business showing or hiding.

try { require('dotenv').config() } catch (_) { /* dotenv optional */ }
const test = require('node:test')
const assert = require('node:assert')

const hasDb = !!process.env.DATABASE_URL
const ctrl = hasDb ? require('../src/controllers/auth.controller') : null
const db = hasDb ? require('../src/config/database') : null
const bcrypt = hasDb ? require('bcryptjs') : null

// A user row with photoUrl already set, so ensurePhoto() short-circuits and never
// touches the database.
function fakeReq(adminRole) {
  return {
    user: {
      id: '00000000-0000-4000-8000-0000000000a1',
      name: 'Test Agent',
      photoUrl: 'https://example.test/a.png',
      role: 'STUDENT',
      admin_role: adminRole,
    },
    scope: { role: 'student' },
  }
}

function fakeRes() {
  const out = {}
  return {
    payload: out,
    status() { return this },
    json(body) { out.body = body; return this },
  }
}

test('me() returns the support permissions for a support role', { skip: !hasDb }, async () => {
  const res = fakeRes()
  await ctrl.me(fakeReq('support'), res)
  const perms = res.payload.body.data.permissions
  assert.ok(Array.isArray(perms), 'permissions must be an array')
  assert.ok(perms.includes('support.view'))
  assert.ok(perms.includes('support.reply'))
  assert.ok(perms.includes('support.resolve'))
})

test('me() withholds support permissions from content_manager', { skip: !hasDb }, async () => {
  const res = fakeRes()
  await ctrl.me(fakeReq('content_manager'), res)
  const perms = res.payload.body.data.permissions
  assert.ok(perms.includes('content.view'))
  assert.ok(!perms.includes('support.view'))
  assert.ok(!perms.includes('support.resolve'))
})

// Deactivating an account (admin/users.controller.js setStatus) flips is_active and
// deliberately leaves admin_role alone, so the role map on its own still reads "support"
// for somebody who was locked out of the web portal weeks ago. The portal enforces the
// switch at its own login; a phone holding an app JWT never goes through that login again,
// so /me is where it has to be honoured for the app.
test('me() gives a deactivated support agent no permissions at all', { skip: !hasDb }, async () => {
  const req = fakeReq('support')
  req.user.is_active = false
  const res = fakeRes()
  await ctrl.me(req, res)
  assert.deepStrictEqual(
    res.payload.body.data.permissions, [],
    'a deactivated account keeps its admin_role — the permission list is what must go empty',
  )
})

test('me() still trusts a row that carries no is_active column', { skip: !hasDb }, async () => {
  const res = fakeRes()
  await ctrl.me(fakeReq('support'), res) // no is_active key at all
  assert.ok(
    res.payload.body.data.permissions.includes('support.view'),
    'only an explicit false revokes; a missing column must not read as deactivated',
  )
})

test('me() gives a plain student an empty permission list', { skip: !hasDb }, async () => {
  const res = fakeRes()
  await ctrl.me(fakeReq(null), res)
  assert.deepStrictEqual(res.payload.body.data.permissions, [])
})

// fetchScopeUser() is the private helper login() and register() both build their response
// `user` from — it is not exported, so it cannot be called directly. The only way to prove
// it carries admin_role (and therefore that login/register can derive real permissions
// instead of always seeing undefined) is to exercise login() itself against a real row,
// end to end: create a user with a known password, promote it to a support role, and check
// that logging in returns that role's permissions rather than [].
test('login() returns real permissions — proves fetchScopeUser carries admin_role', { skip: !hasDb }, async () => {
  const email = `test-login-permissions-${Date.now()}@example.test`
  const password = 'Test-Password-123!'
  const passwordHash = await bcrypt.hash(password, 12)

  const created = await db.user.create({
    data: { name: 'Login Permissions Test', email, passwordHash, provider: 'EMAIL' },
    select: { id: true },
  })

  try {
    await db.$executeRawUnsafe(`UPDATE "users" SET "admin_role" = 'support' WHERE id = $1::uuid`, created.id)

    const res = fakeRes()
    await ctrl.login({ body: { email, password } }, res, (err) => { if (err) throw err })

    const perms = res.payload.body.data.permissions
    assert.ok(Array.isArray(perms), 'permissions must be an array')
    assert.ok(
      perms.includes('support.view') && perms.includes('support.reply') && perms.includes('support.resolve'),
      'login must return the support role\'s real permissions, not [] — which is what happens ' +
        'if fetchScopeUser stops selecting admin_role',
    )
  } finally {
    await db.user.delete({ where: { id: created.id } }).catch(() => {})
  }
})
