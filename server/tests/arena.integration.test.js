'use strict'

// Live integration tests against the real DB (matchmaking, authoritative result,
// idempotency, abandon, ownership, anti-cheat, recovery, history, leaderboard).
// Skips automatically if there is no DATABASE_URL. Cleans up every row it creates.

try { require('dotenv').config() } catch (_) { /* dotenv optional */ }
const test = require('node:test')
const assert = require('node:assert')

const hasDb = !!process.env.DATABASE_URL
const db = hasDb ? require('../src/config/database') : null
const arena = hasDb ? require('../src/services/arena/arena.service') : null
const game = require('../src/services/arena/game')

const ctx = { userId: null, ids: [], skip: !hasDb }
const track = (id) => { if (id) ctx.ids.push(id); return id }
// A valid 5-queens solution; any prefix is a safe (non-attacking) subset.
const safeCells = (n) => game.solveNonAttacking(5, 5, 'queen').slice(0, n)
const randUuid = () => '00000000-0000-4000-8000-0000000000ff'

async function insertPending(userId, { opponentScore, opponentSolved = true, opponentTimeMs = 10000, ratingBefore = 1000, target = 5, opponentRating = 1000 }) {
  const puzzle = JSON.stringify({ game: 'no_attack', piece: 'queen', gridN: 5, target, blocked: [], tier: 'easy', opponentRating })
  const rows = await db.$queryRawUnsafe(
    `INSERT INTO "arena_matches"
       ("userId","game","puzzle","status","opponentName","opponentIsBot","opponentSolved","opponentTimeMs","opponentScore","ratingBefore","ratingAfter")
     VALUES ($1::uuid,'no_attack',$2::jsonb,'pending','TestBot',true,$3,$4,$5,$6,$6) RETURNING id`,
    userId, puzzle, opponentSolved, opponentTimeMs, opponentScore, ratingBefore,
  )
  return track(rows[0].id)
}

test('setup: pick a user', { skip: ctx.skip }, async () => {
  const rows = await db.$queryRawUnsafe('SELECT id FROM "users" LIMIT 1')
  if (!rows[0]) { ctx.skip = true; return }
  ctx.userId = rows[0].id
  assert.ok(ctx.userId)
})

test('matchmake creates a single active match (auto-abandons orphans)', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const a = await arena.matchmake({ userId: ctx.userId }); track(a.matchId)
  const b = await arena.matchmake({ userId: ctx.userId }); track(b.matchId)
  assert.notEqual(a.matchId, b.matchId)
  assert.ok(a.puzzle.gridN >= 5)
  assert.ok(['queen', 'rook', 'bishop', 'knight'].includes(a.puzzle.piece))
  assert.ok(a.opponent && typeof a.opponent.name === 'string')

  const first = await db.$queryRawUnsafe('SELECT status FROM "arena_matches" WHERE id=$1::uuid', a.matchId)
  assert.equal(first[0].status, 'abandoned', 'older pending match is retired')

  const active = await arena.getActive({ userId: ctx.userId })
  assert.equal(active.active.matchId, b.matchId, 'only the newest match is active')
})

test('result: solved WIN awards solved-bonus XP and raises rating', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const id = await insertPending(ctx.userId, { opponentScore: 0 })
  const res = await arena.submitResult({ userId: ctx.userId, matchId: id, placements: safeCells(5), timeMs: 4000 })
  assert.equal(res.result, 'win')
  assert.equal(res.userSolved, true)
  assert.equal(res.xpEarned, 70)            // win 50 + solved 20
  assert.ok(res.ratingDelta > 0)
})

test('result: partial board → DRAW and LOSS are decided by score', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  // 3 non-attacking knights = unsolved → time-independent score of 36
  const drawId = await insertPending(ctx.userId, { opponentScore: 36 })
  const draw = await arena.submitResult({ userId: ctx.userId, matchId: drawId, placements: safeCells(3), timeMs: 9000 })
  assert.equal(draw.result, 'draw')
  assert.equal(draw.userScore, 36)
  assert.equal(draw.xpEarned, 30)           // draw 30, unsolved

  const lossId = await insertPending(ctx.userId, { opponentScore: 37 })
  const loss = await arena.submitResult({ userId: ctx.userId, matchId: lossId, placements: safeCells(3), timeMs: 9000 })
  assert.equal(loss.result, 'loss')
  assert.equal(loss.xpEarned, 15)
  assert.ok(loss.ratingDelta < 0)
})

test('duel: a turn-based win is recorded from the move list', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  // 2×2 queen board: one queen leaves the opponent with no legal move → user wins.
  const puzzle = JSON.stringify({ game: 'no_attack', mode: 'duel', piece: 'queen', gridN: 2, target: 1, blocked: [], tier: 'easy', opponentRating: 1000 })
  const rows = await db.$queryRawUnsafe(
    `INSERT INTO "arena_matches"
       ("userId","game","puzzle","status","opponentName","opponentIsBot","opponentSolved","opponentTimeMs","opponentScore","ratingBefore","ratingAfter")
     VALUES ($1::uuid,'no_attack',$2::jsonb,'pending','TestBot',true,false,30000,1,1000,1000) RETURNING id`,
    ctx.userId, puzzle,
  )
  const id = track(rows[0].id)
  const res = await arena.submitResult({ userId: ctx.userId, matchId: id, moves: [{ r: 0, c: 0, by: 'user' }], timeMs: 3000 })
  assert.equal(res.result, 'win')
  assert.equal(res.userSolved, true)
  assert.equal(res.xpEarned, 70)

  // an invalid move list is rejected (anti-cheat)
  const rows2 = await db.$queryRawUnsafe(
    `INSERT INTO "arena_matches"
       ("userId","game","puzzle","status","opponentName","opponentIsBot","opponentSolved","opponentTimeMs","opponentScore","ratingBefore","ratingAfter")
     VALUES ($1::uuid,'no_attack',$2::jsonb,'pending','TestBot',true,false,30000,1,1000,1000) RETURNING id`,
    ctx.userId, puzzle,
  )
  const id2 = track(rows2[0].id)
  await assert.rejects(
    () => arena.submitResult({ userId: ctx.userId, matchId: id2, moves: [{ r: 0, c: 0, by: 'opp' }], timeMs: 3000 }),
    (e) => e.status === 422,
  )
})

test('rectangle: a best-of-3 win is recorded from the round logs', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const puzzle = JSON.stringify({ game: 'rectangle_it', mode: 'duel', gridN: 5, rounds: 3, opponentRating: 1000 })
  const rows = await db.$queryRawUnsafe(
    `INSERT INTO "arena_matches"
       ("userId","game","puzzle","status","opponentName","opponentIsBot","opponentSolved","opponentTimeMs","opponentScore","ratingBefore","ratingAfter")
     VALUES ($1::uuid,'rectangle_it',$2::jsonb,'pending','TestBot',true,false,0,0,1000,1000) RETURNING id`,
    ctx.userId, puzzle,
  )
  const id = track(rows[0].id)
  const userRound = {
    starter: 'user',
    moves: [
      { r: 0, c: 0, by: 'user' }, { r: 1, c: 1, by: 'opp' },
      { r: 0, c: 2, by: 'user' }, { r: 1, c: 3, by: 'opp' },
      { r: 2, c: 0, by: 'user' }, { r: 3, c: 1, by: 'opp' },
      { r: 2, c: 2, by: 'user' },
    ],
  }
  const res = await arena.submitResult({ userId: ctx.userId, matchId: id, rounds: [userRound, userRound], timeMs: 9000 })
  assert.equal(res.result, 'win')
  assert.equal(res.userScore, 2)

  // an illegal round log is rejected
  const rows2 = await db.$queryRawUnsafe(
    `INSERT INTO "arena_matches"
       ("userId","game","puzzle","status","opponentName","opponentIsBot","opponentSolved","opponentTimeMs","opponentScore","ratingBefore","ratingAfter")
     VALUES ($1::uuid,'rectangle_it',$2::jsonb,'pending','TestBot',true,false,0,0,1000,1000) RETURNING id`,
    ctx.userId, puzzle,
  )
  const id2 = track(rows2[0].id)
  await assert.rejects(
    () => arena.submitResult({ userId: ctx.userId, matchId: id2, rounds: [{ starter: 'user', moves: [{ r: 0, c: 0, by: 'opp' }] }], timeMs: 9000 }),
    (e) => e.status === 422,
  )
})

test('duplicate submit is idempotent (replays the recorded result)', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const id = await insertPending(ctx.userId, { opponentScore: 0 })
  const first = await arena.submitResult({ userId: ctx.userId, matchId: id, placements: safeCells(5), timeMs: 4000 })
  const again = await arena.submitResult({ userId: ctx.userId, matchId: id, placements: safeCells(5), timeMs: 1 })
  assert.equal(again.duplicate, true)
  assert.equal(again.userScore, first.userScore, 'second submit cannot change the score')
  assert.equal(again.result, first.result)
})

test('abandon: pending → abandoned, and submitting an abandoned match is rejected', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const id = await insertPending(ctx.userId, { opponentScore: 0 })
  const r = await arena.abandon({ userId: ctx.userId, matchId: id })
  assert.equal(r.abandoned, 1)
  await assert.rejects(
    () => arena.submitResult({ userId: ctx.userId, matchId: id, placements: safeCells(5), timeMs: 4000 }),
    (e) => e.status === 409,
  )
})

test('ownership: another user cannot submit my match (404)', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const id = await insertPending(ctx.userId, { opponentScore: 0 })
  await assert.rejects(
    () => arena.submitResult({ userId: randUuid(), matchId: id, placements: safeCells(5), timeMs: 4000 }),
    (e) => e.status === 404,
  )
})

test('anti-cheat: a forged 0ms solve cannot score a perfect 200', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const id = await insertPending(ctx.userId, { opponentScore: 0 })
  const res = await arena.submitResult({ userId: ctx.userId, matchId: id, placements: safeCells(5), timeMs: 0 })
  assert.equal(res.userSolved, true)
  assert.ok(res.userScore < 200 && res.userScore > 150, `forged-fast score clamped: ${res.userScore}`)
})

test('history and leaderboard return well-formed data', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const h = await arena.history({ userId: ctx.userId, limit: 10 })
  assert.ok(typeof h.rating === 'number')
  assert.ok(Array.isArray(h.matches) && h.matches.length >= 1)
  assert.ok(h.wins >= 1)

  const lb = await arena.leaderboard({ userId: ctx.userId, limit: 10 })
  assert.ok(Array.isArray(lb.top))
  assert.ok(lb.me && typeof lb.me.rating === 'number')
})

test('cleanup: remove all rows created by this run', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  for (const id of ctx.ids) {
    try { await db.$executeRawUnsafe('DELETE FROM "arena_matches" WHERE id=$1::uuid', id) } catch (_) { /* ignore */ }
  }
  assert.ok(true)
})
