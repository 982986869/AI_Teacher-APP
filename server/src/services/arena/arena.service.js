'use strict'

// Arena battle service — matchmaking, authoritative result scoring, recovery,
// history and leaderboard. Uses raw SQL (no Prisma client regen needed) against the
// "arena_matches" table. Every write is scoped to the caller's userId.

const db = require('../../config/database')
const game = require('./game')
const { pickOpponent } = require('./opponent')

const DEFAULT_RATING = game.CONFIG.defaultRating
const GAME_KEYS = new Set(['no_attack', 'rectangle_it'])
const normGame = (g) => (GAME_KEYS.has(g) ? g : 'no_attack')

// Current rating = the ratingAfter of the player's most recent finished match.
async function currentRating(userId) {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT "ratingAfter" FROM "arena_matches"
        WHERE "userId" = $1::uuid AND "status" = 'done'
        ORDER BY "completedAt" DESC NULLS LAST LIMIT 1`,
      userId,
    )
    return rows && rows[0] ? Number(rows[0].ratingAfter) : DEFAULT_RATING
  } catch (_) {
    return DEFAULT_RATING
  }
}

// Public (client-safe) subset of a stored puzzle — never leaks the opponent score.
const clientPuzzle = (p) => ({
  game: p.game || 'no_attack', mode: p.mode || 'duel', gridN: p.gridN,
  target: p.target, blocked: p.blocked || [], piece: p.piece, tier: p.tier, rounds: p.rounds,
})

// Build the result payload from a finished row (used for the live result AND for
// idempotent replays of a duplicate submit).
function resultFromRow(m, extra = {}) {
  const ratingBefore = Number(m.ratingBefore)
  const ratingAfter = Number(m.ratingAfter)
  return {
    result: m.result,
    userScore: Number(m.userScore),
    opponentScore: Number(m.opponentScore),
    userSolved: m.userSolved,
    xpEarned: Number(m.xpEarned),
    ratingBefore,
    ratingAfter,
    ratingDelta: ratingAfter - ratingBefore,
    opponent: { name: m.opponentName, isBot: m.opponentIsBot, solved: m.opponentSolved, timeMs: Number(m.opponentTimeMs) },
    ...extra,
  }
}

// ── POST /matchmake ──────────────────────────────────────────────────────────
async function matchmake({ userId, gameKey = 'no_attack', userName }) {
  const g = normGame(gameKey)
  // Single active match per player: retire any orphaned pending matches first so
  // an abandoned/never-finished game can never pile up.
  await db.$executeRawUnsafe(
    `UPDATE "arena_matches" SET "status"='abandoned' WHERE "userId" = $1::uuid AND "status" = 'pending'`,
    userId,
  )

  const rating = await currentRating(userId)
  const puzzle = g === 'rectangle_it' ? game.generateRectPuzzle(rating) : game.generatePuzzle(rating)
  const opp = await pickOpponent(db, { userId, game: g, rating, puzzle, userName })
  const opponentScore = g === 'rectangle_it'
    ? 0
    : game.score({ solved: opp.solved, timeMs: opp.timeMs, count: puzzle.target, target: puzzle.target })

  const rows = await db.$queryRawUnsafe(
    `INSERT INTO "arena_matches"
       ("userId","game","puzzle","status","opponentName","opponentIsBot",
        "opponentSolved","opponentTimeMs","opponentScore","ratingBefore","ratingAfter")
     VALUES ($1::uuid,$2,$3::jsonb,'pending',$4,$5,$6,$7,$8,$9,$9)
     RETURNING id, "createdAt"`,
    userId, g, JSON.stringify({ ...puzzle, opponentRating: opp.rating }),
    opp.name, opp.isBot, opp.solved, opp.timeMs, opponentScore, rating,
  )

  return {
    matchId: rows[0].id,
    game: g,
    rating,
    startedAt: new Date(rows[0].createdAt).getTime(),
    puzzle: clientPuzzle(puzzle),
    // opponent time is revealed so the client can race a live "ghost"; the exact
    // score stays hidden until the result.
    opponent: { name: opp.name, isBot: opp.isBot, solved: opp.solved, timeMs: opp.timeMs, rating: opp.rating },
  }
}

// ── GET /active ──────────────────────────────────────────────── (resume after restart)
async function getActive({ userId }) {
  const rows = await db.$queryRawUnsafe(
    `SELECT id, game, puzzle, "opponentName", "opponentIsBot", "opponentSolved",
            "opponentTimeMs", "ratingBefore", "createdAt"
       FROM "arena_matches"
      WHERE "userId" = $1::uuid AND "status" = 'pending'
      ORDER BY "createdAt" DESC LIMIT 1`,
    userId,
  )
  const m = rows && rows[0]
  if (!m) return { active: null }

  const puzzle = typeof m.puzzle === 'string' ? JSON.parse(m.puzzle) : m.puzzle
  const elapsedMs = Date.now() - new Date(m.createdAt).getTime()

  // A pending match older than the whole game clock (+1 min) is dead → retire it.
  if (elapsedMs > game.MAX_TIME_MS + 60000) {
    await db.$executeRawUnsafe(`UPDATE "arena_matches" SET "status"='abandoned' WHERE id = $1::uuid`, m.id)
    return { active: null }
  }

  return {
    active: {
      matchId: m.id,
      game: m.game,
      rating: Number(m.ratingBefore),
      startedAt: new Date(m.createdAt).getTime(),
      elapsedMs,
      puzzle: clientPuzzle(puzzle),
      opponent: { name: m.opponentName, isBot: m.opponentIsBot, solved: m.opponentSolved, timeMs: Number(m.opponentTimeMs), rating: puzzle.opponentRating },
    },
  }
}

// ── POST /abandon ───────────────────────────────────────────── (safe cleanup, neutral)
async function abandon({ userId, matchId }) {
  const count = matchId
    ? await db.$executeRawUnsafe(
        `UPDATE "arena_matches" SET "status"='abandoned'
          WHERE id = $1::uuid AND "userId" = $2::uuid AND "status" = 'pending'`,
        matchId, userId,
      )
    : await db.$executeRawUnsafe(
        `UPDATE "arena_matches" SET "status"='abandoned'
          WHERE "userId" = $1::uuid AND "status" = 'pending'`,
        userId,
      )
  return { abandoned: Number(count) || 0 }
}

// ── POST /result ───────────────────────────────────────────────── (authoritative)
// Two modes: a turn-based `duel` (body.moves — server replays + decides the winner)
// or the legacy solo race (body.placements — server validates + scores).
async function submitResult({ userId, matchId, placements, moves, rounds, timeMs }) {
  const rows = await db.$queryRawUnsafe(
    `SELECT * FROM "arena_matches" WHERE id = $1::uuid AND "userId" = $2::uuid LIMIT 1`,
    matchId, userId,
  )
  const m = rows && rows[0]
  if (!m) { const e = new Error('Match not found'); e.status = 404; throw e }

  // Idempotent replay: a retried submit returns the already-recorded result.
  if (m.status === 'done') return resultFromRow(m, { duplicate: true })
  if (m.status === 'abandoned') { const e = new Error('Match is no longer active'); e.status = 409; throw e }

  const puzzle = typeof m.puzzle === 'string' ? JSON.parse(m.puzzle) : m.puzzle
  const serverElapsed = Date.now() - new Date(m.createdAt).getTime()  // wall-clock truth
  const effTime = game.effectiveTime(timeMs, serverElapsed, puzzle.target)

  let result, userSolved, userScore, opponentScore
  if (puzzle.game === 'rectangle_it') {
    // best-of-N rectangle duel → replay every round to decide the match (anti-cheat)
    const rep = game.replayRectMatch(puzzle, rounds)
    if (!rep.valid) { const e = new Error(`Invalid game (${rep.reason})`); e.status = 422; throw e }
    result = rep.winner === 'user' ? 'win' : rep.winner === 'opp' ? 'loss' : 'draw'
    userSolved = result === 'win'
    userScore = rep.userWins
    opponentScore = rep.oppWins
  } else if (Array.isArray(moves) && moves.length) {
    // turn-based duel → replay authoritatively to decide the winner (anti-cheat)
    const rep = game.replayDuel(puzzle, moves)
    if (!rep.valid) { const e = new Error(`Invalid game (${rep.reason})`); e.status = 422; throw e }
    result = rep.winner === 'user' ? 'win' : 'loss'
    userSolved = result === 'win'
    userScore = result === 'win' ? 1 : 0
    opponentScore = result === 'win' ? 0 : 1
  } else {
    // legacy solo race → validate + score
    const v = game.validate(placements, puzzle)
    userSolved = v.solved
    userScore = game.score({ solved: v.solved, timeMs: effTime, count: v.count, target: puzzle.target })
    opponentScore = Number(m.opponentScore)
    result = game.decideResult(userScore, opponentScore)
  }

  const ratingBefore = Number(m.ratingBefore)
  const oppRating = puzzle.opponentRating || ratingBefore
  const ratingAfter = game.elo(ratingBefore, oppRating, game.actualScoreFor(result))
  const xpEarned = game.computeXp(result, userSolved)

  // Conditional UPDATE (status='pending') closes the duplicate-submit race: only the
  // first concurrent writer flips the row; a loser updates 0 rows and replays the result.
  const updated = await db.$executeRawUnsafe(
    `UPDATE "arena_matches"
        SET "status"='done',"userSolved"=$2,"userTimeMs"=$3,"userScore"=$4,
            "result"=$5,"xpEarned"=$6,"ratingAfter"=$7,"completedAt"=now()
      WHERE id=$1::uuid AND "status"='pending'`,
    matchId, userSolved, effTime, userScore, result, xpEarned, ratingAfter,
  )
  if (Number(updated) === 0) {
    const again = await db.$queryRawUnsafe(`SELECT * FROM "arena_matches" WHERE id = $1::uuid`, matchId)
    if (again && again[0] && again[0].status === 'done') return resultFromRow(again[0], { duplicate: true })
    const e = new Error('Match is no longer active'); e.status = 409; throw e
  }

  return {
    result, userScore, opponentScore, userSolved,
    xpEarned, ratingBefore, ratingAfter, ratingDelta: ratingAfter - ratingBefore,
    opponent: { name: m.opponentName, isBot: m.opponentIsBot, solved: m.opponentSolved, timeMs: Number(m.opponentTimeMs) },
  }
}

// ── GET /history ───────────────────────────────────────────────────────────────
async function history({ userId, limit = 20 }) {
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 50)
  const matches = await db.$queryRawUnsafe(
    `SELECT id, game, result, "userScore", "opponentScore", "opponentName",
            "userSolved", "xpEarned", "ratingAfter", "completedAt"
       FROM "arena_matches"
      WHERE "userId" = $1::uuid AND "status" = 'done'
      ORDER BY "completedAt" DESC LIMIT $2`,
    userId, lim,
  )
  const rating = await currentRating(userId)
  return {
    rating,
    played: matches.length,
    wins: matches.filter((r) => r.result === 'win').length,
    losses: matches.filter((r) => r.result === 'loss').length,
    matches,
  }
}

// ── GET /leaderboard ─────────────────────────────────── (rating-ranked, public names)
async function leaderboard({ userId, limit = 50 }) {
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 100)

  // Latest rating per player (DISTINCT ON), plus their W/L from a grouped count.
  const ratings = await db.$queryRawUnsafe(
    `SELECT DISTINCT ON (m."userId") m."userId" AS uid, m."ratingAfter" AS rating, u."name" AS name, u."grade" AS grade
       FROM "arena_matches" m JOIN "users" u ON u.id = m."userId"
      WHERE m."status" = 'done'
      ORDER BY m."userId", m."completedAt" DESC NULLS LAST`,
  )
  const stats = await db.$queryRawUnsafe(
    `SELECT "userId" AS uid,
            COUNT(*) FILTER (WHERE "result" = 'win')::int  AS wins,
            COUNT(*) FILTER (WHERE "result" = 'loss')::int AS losses,
            COUNT(*)::int AS played
       FROM "arena_matches" WHERE "status" = 'done' GROUP BY "userId"`,
  )
  const byId = Object.fromEntries(stats.map((s) => [s.uid, s]))

  const rows = ratings.map((r) => ({
    userId: r.uid,
    name: r.name || 'Student',
    grade: r.grade || null,
    rating: Number(r.rating),
    wins: byId[r.uid]?.wins || 0,
    losses: byId[r.uid]?.losses || 0,
    played: byId[r.uid]?.played || 0,
  }))
  rows.sort((a, b) => b.rating - a.rating || b.wins - a.wins)
  rows.forEach((e, i) => { e.rank = i + 1 })

  const top = rows.slice(0, lim).map((e) => ({ ...e, isMe: e.userId === userId }))
  const meEntry = rows.find((e) => e.userId === userId)
  const me = meEntry
    ? { ...meEntry, isMe: true }
    : { rank: null, userId, name: 'You', grade: null, rating: DEFAULT_RATING, wins: 0, losses: 0, played: 0, isMe: true }

  return { totalPlayers: rows.length, me, top }
}

module.exports = {
  matchmake, getActive, abandon, submitResult, history, leaderboard,
  currentRating, normGame,
}
