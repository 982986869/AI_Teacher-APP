'use strict'

// Who may read and change what. These are the rules that keep one family's billing
// complaint out of another family's app, so they are tested at the controller layer
// with fake req/res objects rather than through the service.

try { require('dotenv').config() } catch (_) { /* dotenv optional */ }
const test = require('node:test')
const assert = require('node:assert')

const hasDb = !!process.env.DATABASE_URL
const db = hasDb ? require('../src/config/database') : null
const ctrl = hasDb ? require('../src/controllers/support.controller') : null
const { ROLE_PERMISSIONS } = hasDb ? require('../src/services/admin/permissions') : { ROLE_PERMISSIONS: {} }

// A synthetic role, local to this test file's process, that carries support.view but
// deliberately withholds support.reply/support.resolve — no real role happens to be
// shaped exactly like that today, but the controller must still gate the two narrower
// permissions separately rather than collapsing everything into "isStaff".
if (hasDb) ROLE_PERMISSIONS.test_support_viewer = ['support.view']

const ctx = { skip: !hasDb, ids: [], agentTeams: [], realUserId: undefined }
const OWNER = '00000000-0000-4000-8000-00000000e001'
const OTHER = '00000000-0000-4000-8000-00000000e002'

// Queue assertions below pin themselves to a team nobody real is on. The queue query is
// `ORDER BY "createdAt" ASC LIMIT 200`, so on a database with a couple of hundred genuine
// tickets the newest rows — the ones a test just made — fall off the end. Filtering by a
// private team keeps these assertions about the predicate rather than about how busy the
// database happens to be.
const TEST_TEAM = 'Test queue team'
const AGENT_TEAM = 'Test routing team'

// NOTE: `ctrl.queue`/`ctrl.getOne`/`ctrl.listMine` each call `svc.autoCloseExpired()`
// first, which is a table-wide UPDATE — the same exposure that put the two direct
// autoCloseExpired tests in support.lifecycle.test.js behind SUPPORT_TEST_DB=1. It is not
// gated here because it is exactly what the deployed server does on every read (close the
// pending tickets that are already past their own deadline), so pointing these at a real
// database does nothing the API would not have done anyway. Point them at a database you
// are willing to have read from, all the same.

// Minimal Express doubles: capture what the controller answered.
function fakeRes() {
  const r = { statusCode: 0, body: null }
  r.status = (c) => { r.statusCode = c; return r }
  r.json = (b) => { r.body = b; return r }
  return r
}
const fakeReq = (user, over = {}) => ({ user, params: {}, query: {}, body: {}, scope: {}, ...over })

async function makeTicket(status = 'open', withMessage = true, opts = {}) {
  const userId = opts.userId || OWNER
  const rows = await db.$queryRawUnsafe(
    `INSERT INTO "support_tickets"
       ("ref","userId","role","topicId","topicLabel","team","status","assignedToId")
     VALUES ('TEST-' || nextval('support_ticket_ref_seq'), $1::uuid, 'student',
             'billing','Billing', $3, $2, $4::uuid) RETURNING *`,
    userId, status, opts.team || 'Accounts team', opts.assignedToId || null,
  )
  const t = rows[0]
  ctx.ids.push(t.id)
  if (withMessage) {
    await db.$executeRawUnsafe(
      `INSERT INTO "support_messages" ("ticketId","authorId","authorRole","text")
       VALUES ($1::uuid, $2::uuid, 'user', 'test message')`,
      t.id, userId,
    )
  }
  return t
}

// The permission tests above are happy with synthetic OWNER/OTHER uuids because they only
// ever read the ticket row back. The queue does not: it `JOIN "users"`, so a ticket owned
// by a uuid with no user behind it is invisible there no matter what the status predicate
// says. Anything asserting about queue CONTENTS has to be owned by somebody real.
async function realUser() {
  if (ctx.realUserId === undefined) {
    const rows = await db.$queryRawUnsafe('SELECT id FROM "users" ORDER BY "createdAt" LIMIT 1')
    ctx.realUserId = (rows && rows[0] && rows[0].id) || null
  }
  return ctx.realUserId
}

async function makeAgent(team, userId, name) {
  await db.$executeRawUnsafe(
    `INSERT INTO "support_agents" ("team","userId","name") VALUES ($1, $2::uuid, $3)
     ON CONFLICT ("team","userId") DO UPDATE SET "name" = EXCLUDED."name", "active" = true`,
    team, userId, name,
  )
  if (!ctx.agentTeams.includes(team)) ctx.agentTeams.push(team)
}

test('a student token is refused the staff queue', { skip: ctx.skip }, async () => {
  const res = fakeRes()
  await ctrl.queue(fakeReq({ id: OWNER, admin_role: null }), res, () => {})
  assert.equal(res.statusCode, 403)
})

test('a stale admin_role string is refused — isStaff, not a truthy check', { skip: ctx.skip }, async () => {
  const res = fakeRes()
  await ctrl.queue(fakeReq({ id: OWNER, admin_role: 'superadmin' }), res, () => {})
  assert.equal(res.statusCode, 403, "'superadmin' is not a role; only the exact names count")
})

test('a real staff role reaches the queue', { skip: ctx.skip }, async () => {
  await makeTicket('open')
  const res = fakeRes()
  await ctrl.queue(fakeReq({ id: OTHER, admin_role: 'support' }), res, () => {})
  assert.equal(res.statusCode, 200)
  assert.ok(Array.isArray(res.body.data.tickets))
  assert.equal(typeof res.body.data.unreadCount, 'number')
})

test('a user cannot close someone else’s ticket', { skip: ctx.skip }, async () => {
  const t = await makeTicket('pending_confirmation')
  const res = fakeRes()
  await ctrl.close(fakeReq({ id: OTHER, admin_role: null }, { params: { id: t.id } }), res, () => {})
  assert.equal(res.statusCode, 404, 'not 403 — an outsider must not learn the ticket exists')
  const after = await db.$queryRawUnsafe(`SELECT status FROM "support_tickets" WHERE id=$1::uuid`, t.id)
  assert.equal(after[0].status, 'pending_confirmation')
})

test('a user message no longer reopens a closed ticket', { skip: ctx.skip }, async () => {
  const t = await makeTicket('closed')
  const res = fakeRes()
  await ctrl.addMessage(
    fakeReq({ id: OWNER, admin_role: null }, { params: { id: t.id }, body: { text: 'thank you' } }),
    res, () => {},
  )
  const after = await db.$queryRawUnsafe(`SELECT status FROM "support_tickets" WHERE id=$1::uuid`, t.id)
  assert.equal(after[0].status, 'closed', 'only the Reopen button reopens')
})

test('a ticket with no user message shows in neither queue nor listMine', { skip: ctx.skip }, async () => {
  const t = await makeTicket('open', false)

  const q = fakeRes()
  await ctrl.queue(fakeReq({ id: OTHER, admin_role: 'support' }), q, () => {})
  assert.ok(!q.body.data.tickets.some((x) => x.id === t.id), 'browsing a department is not a ticket')

  const m = fakeRes()
  await ctrl.listMine(fakeReq({ id: OWNER, admin_role: null }), m, () => {})
  assert.ok(!m.body.data.tickets.some((x) => x.id === t.id))
})

test('a content_manager token is refused the queue', { skip: ctx.skip }, async () => {
  const res = fakeRes()
  await ctrl.queue(fakeReq({ id: OTHER, admin_role: 'content_manager' }), res, () => {})
  assert.equal(res.statusCode, 403, 'content_manager IS an admin role but was never granted support.view')
})

test('a content_manager token is refused a ticket it does not own', { skip: ctx.skip }, async () => {
  const t = await makeTicket('open')
  const res = fakeRes()
  await ctrl.getOne(fakeReq({ id: OTHER, admin_role: 'content_manager' }, { params: { id: t.id } }), res, () => {})
  assert.equal(res.statusCode, 404, 'not 403 — an outsider must not learn the ticket exists')
})

test('a role holding only support.view cannot post a message on someone else’s ticket', { skip: ctx.skip }, async () => {
  const t = await makeTicket('open')
  const res = fakeRes()
  await ctrl.addMessage(
    fakeReq({ id: OTHER, admin_role: 'test_support_viewer' }, { params: { id: t.id }, body: { text: 'hi' } }),
    res, () => {},
  )
  assert.equal(res.statusCode, 403, 'support.view lets you watch, support.reply lets you speak')
  const msgs = await db.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS n FROM "support_messages" WHERE "ticketId" = $1::uuid AND "authorId" = $2::uuid`,
    t.id, OTHER,
  )
  assert.equal(msgs[0].n, 0, 'no message was written')
})

test('a role holding only support.view cannot resolve a ticket', { skip: ctx.skip }, async () => {
  const t = await makeTicket('assigned')
  const res = fakeRes()
  await ctrl.resolve(
    fakeReq({ id: OTHER, admin_role: 'test_support_viewer' }, { params: { id: t.id }, body: { summary: 'done' } }),
    res, () => {},
  )
  assert.equal(res.statusCode, 403)
  const after = await db.$queryRawUnsafe(`SELECT status FROM "support_tickets" WHERE id=$1::uuid`, t.id)
  assert.equal(after[0].status, 'assigned', 'not resolved')
})

test('a role holding support.reply CAN post a message on someone else’s ticket', { skip: ctx.skip }, async () => {
  const t = await makeTicket('open')
  const res = fakeRes()
  await ctrl.addMessage(
    fakeReq({ id: OTHER, name: 'Saurabh', admin_role: 'support' }, { params: { id: t.id }, body: { text: 'hi' } }),
    res, () => {},
  )
  assert.equal(res.statusCode, 201, 'the `support` role carries support.reply')
})

// ── the console's Open tab ────────────────────────────────────────────────────
// A ticket is created `assigned` the moment its team has anyone on it, and the setup
// script seeds all eight teams — so `assigned`, not `open`, is what a real ticket looks
// like. The console asks for status=open and must get both, or the queue reads empty and
// the sidebar badge reads 0 for every genuine ticket.
const askQueue = async (query) => {
  const res = fakeRes()
  await ctrl.queue(fakeReq({ id: OTHER, admin_role: 'support' }, { query }), res, () => {})
  return res
}

test('the queue `open` filter returns assigned tickets as well as open ones', { skip: ctx.skip }, async (t) => {
  const userId = await realUser()
  if (!userId) return t.skip('this database has no users to own a queue ticket')

  const anOpen = await makeTicket('open', true, { team: TEST_TEAM, userId })
  const anAssigned = await makeTicket('assigned', true, { team: TEST_TEAM, userId })

  const res = await askQueue({ team: TEST_TEAM })
  assert.equal(res.statusCode, 200)
  const ids = res.body.data.tickets.map((x) => x.id)
  assert.ok(ids.includes(anOpen.id), 'an `open` ticket is in the Open tab')
  assert.ok(ids.includes(anAssigned.id), 'an `assigned` ticket is in the Open tab too')
})

test('the queue `open` filter still excludes resolved-and-closed work', { skip: ctx.skip }, async (t) => {
  const userId = await realUser()
  if (!userId) return t.skip('this database has no users to own a queue ticket')

  const pending = await makeTicket('pending_confirmation', true, { team: TEST_TEAM, userId })
  const closed = await makeTicket('closed', true, { team: TEST_TEAM, userId })

  const res = await askQueue({ team: TEST_TEAM })
  const ids = res.body.data.tickets.map((x) => x.id)
  assert.ok(!ids.includes(pending.id), 'pending_confirmation belongs to the Pending tab')
  assert.ok(!ids.includes(closed.id), 'closed belongs to the Closed tab')
})

test('the other status tabs still match exactly', { skip: ctx.skip }, async (t) => {
  const userId = await realUser()
  if (!userId) return t.skip('this database has no users to own a queue ticket')

  const pending = await makeTicket('pending_confirmation', true, { team: TEST_TEAM, userId })
  const closed = await makeTicket('closed', true, { team: TEST_TEAM, userId })
  const assigned = await makeTicket('assigned', true, { team: TEST_TEAM, userId })

  const pIds = (await askQueue({ team: TEST_TEAM, status: 'pending_confirmation' })).body.data.tickets.map((x) => x.id)
  assert.ok(pIds.includes(pending.id))
  assert.ok(!pIds.includes(assigned.id), 'Pending must not inherit the Open widening')

  const cIds = (await askQueue({ team: TEST_TEAM, status: 'closed' })).body.data.tickets.map((x) => x.id)
  assert.ok(cIds.includes(closed.id))
  assert.ok(!cIds.includes(assigned.id))

  const aIds = (await askQueue({ team: TEST_TEAM, status: 'all' })).body.data.tickets.map((x) => x.id)
  assert.ok(aIds.includes(pending.id) && aIds.includes(closed.id) && aIds.includes(assigned.id), 'All means all')
})

test('unreadCount counts the same rows the Open tab lists', { skip: ctx.skip }, async (t) => {
  const userId = await realUser()
  if (!userId) return t.skip('this database has no users to own a queue ticket')

  // Never read by staff, so it is unread — and it is `assigned`, which is the whole
  // point: the sidebar badge fetches with status=open and must still count it.
  await makeTicket('assigned', true, { team: TEST_TEAM, userId })

  const { tickets, unreadCount } = (await askQueue({ team: TEST_TEAM })).body.data
  const expected = tickets.filter((x) => !x.staffReadAt || new Date(x.staffReadAt) < new Date(x.updatedAt)).length
  assert.equal(unreadCount, expected, 'the badge counts exactly the rows the Open tab lists')
  assert.ok(unreadCount > 0, 'an assigned ticket reaches the badge')
})

// ── routing load ──────────────────────────────────────────────────────────────
// pickAgent used to count `status <> 'resolved'`, and after the v2 migration no row ever
// holds 'resolved' — so an agent's "load" was every ticket they had EVER been assigned.
// A lifetime tally never goes down, so the busiest-historically member is permanently the
// least attractive and every new ticket lands on whoever joined most recently.
test('pickAgent counts live work only — a closed ticket is not load', { skip: ctx.skip }, async () => {
  await makeAgent(AGENT_TEAM, OWNER, 'Veteran')
  await makeAgent(AGENT_TEAM, OTHER, 'Newcomer')

  // The veteran has finished two tickets and is holding none.
  await makeTicket('closed', true, { team: AGENT_TEAM, assignedToId: OWNER })
  await makeTicket('closed', true, { team: AGENT_TEAM, assignedToId: OWNER })
  // The newcomer is holding one live ticket right now.
  await makeTicket('assigned', true, { team: AGENT_TEAM, assignedToId: OTHER })

  const picked = await ctrl.pickAgent(AGENT_TEAM)
  assert.ok(picked, 'the team has active members')
  assert.equal(picked.userId, OWNER, 'the free agent wins, however much they have finished')
})

test('pickAgent counts pending_confirmation as live work', { skip: ctx.skip }, async () => {
  await makeAgent(AGENT_TEAM, OWNER, 'Veteran')
  await makeAgent(AGENT_TEAM, OTHER, 'Newcomer')

  // The veteran now holds two awaiting-the-user tickets — still their work, still theirs
  // to chase — against the newcomer's one live ticket from the test above. If
  // pending_confirmation were treated as finished the veteran would read as free (0) and
  // win; counted honestly they are the busier of the two.
  await makeTicket('pending_confirmation', true, { team: AGENT_TEAM, assignedToId: OWNER })
  await makeTicket('pending_confirmation', true, { team: AGENT_TEAM, assignedToId: OWNER })

  const picked = await ctrl.pickAgent(AGENT_TEAM)
  assert.equal(picked.userId, OTHER, 'a ticket awaiting confirmation still counts against its owner')
})

test('teardown', { skip: ctx.skip }, async () => {
  for (const id of ctx.ids) {
    await db.$executeRawUnsafe(`DELETE FROM "support_messages" WHERE "ticketId" = $1::uuid`, id)
    await db.$executeRawUnsafe(`DELETE FROM "support_tickets" WHERE id = $1::uuid`, id)
  }
  for (const team of ctx.agentTeams) {
    await db.$executeRawUnsafe(`DELETE FROM "support_agents" WHERE "team" = $1`, team)
  }
  // The synthetic role was written into the permissions module's own object. `node --test`
  // shares one process across files, so leaving it there leaks a role that exists nowhere
  // in the product into every test that loads permissions after this one.
  delete ROLE_PERMISSIONS.test_support_viewer
  assert.equal(ROLE_PERMISSIONS.test_support_viewer, undefined)
})
