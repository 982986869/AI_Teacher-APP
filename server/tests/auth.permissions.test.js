'use strict'

// The app gates its Support tab on this array. If /me stops returning it, or returns a
// role's permissions when the caller is a student, the app silently shows or hides a
// console it has no business showing or hiding.

try { require('dotenv').config() } catch (_) { /* dotenv optional */ }
const test = require('node:test')
const assert = require('node:assert')

const hasDb = !!process.env.DATABASE_URL
const ctrl = hasDb ? require('../src/controllers/auth.controller') : null

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

test('me() gives a plain student an empty permission list', { skip: !hasDb }, async () => {
  const res = fakeRes()
  await ctrl.me(fakeReq(null), res)
  assert.deepStrictEqual(res.payload.body.data.permissions, [])
})
