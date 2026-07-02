'use strict'

// Matchmaking opponent. We pair the player ASYNCHRONOUSLY: first try a real "ghost"
// (another student's recorded solve on the same game), otherwise a bot calibrated to
// the player's rating. Both feel identical to the player and neither needs the other
// human to be online at the same instant — the right model for a casual edu arena.

const game = require('./game')

const BOT_NAMES = [
  'Aarav', 'Zoya', 'Kabir', 'Mira', 'Vihaan', 'Anya', 'Reyansh', 'Sara',
  'Ishaan', 'Diya', 'Arjun', 'Nila', 'Vivaan', 'Tara', 'Advait', 'Kiara',
]

const firstName = (name) => String(name || 'Player').trim().split(/\s+/)[0] || 'Player'

function botFor(puzzle, rating = 1000, rng = Math.random) {
  const tier = puzzle.tier || 'easy'
  const solveProb = tier === 'hard' ? 0.6 : tier === 'medium' ? 0.72 : 0.85
  const solved = rng() < solveProb

  // Time window widens with difficulty; stronger ratings imply a slightly faster rival.
  const win = tier === 'hard' ? [16000, 42000] : tier === 'medium' ? [12000, 32000] : [8000, 22000]
  const speedBias = Math.max(0.55, Math.min(1.2, 1100 / rating))
  const timeMs = solved
    ? Math.round((win[0] + rng() * (win[1] - win[0])) * speedBias)
    : game.MAX_TIME_MS

  return {
    name: BOT_NAMES[Math.floor(rng() * BOT_NAMES.length)],
    isBot: true,
    solved,
    timeMs,
    rating: Math.round(rating + (rng() * 160 - 80)),
  }
}

// Best-effort ghost first, calibrated bot as the reliable fallback.
// A ghost must be a DIFFERENT person AND not share the player's first name — a
// same-name opponent reads as "playing against myself" (common with dev/test
// accounts), so we skip it and use a varied bot instead.
async function pickOpponent(db, { userId, game: gameKey, rating, puzzle, userName }) {
  try {
    const mine = firstName(userName).toLowerCase()
    const rows = await db.$queryRawUnsafe(
      `SELECT m."userTimeMs" AS "timeMs", u."name" AS name
         FROM "arena_matches" m
         JOIN "users" u ON u.id = m."userId"
        WHERE m."game" = $1 AND m."status" = 'done'
          AND m."userId" <> $2::uuid AND m."userSolved" = true
          AND ($3::text IS NULL OR LOWER(split_part(btrim(u."name"), ' ', 1)) <> LOWER($3))
        ORDER BY random() LIMIT 1`,
      gameKey, userId, userName || null,
    )
    const ghost = rows && rows[0]
    if (ghost && firstName(ghost.name).toLowerCase() !== mine) {
      return {
        name: firstName(ghost.name),
        isBot: false,
        solved: true,
        timeMs: Number(ghost.timeMs) || game.MAX_TIME_MS,
        rating,
      }
    }
  } catch (_) {
    // ghost lookup is optional — fall through to a bot
  }
  return botFor(puzzle, rating)
}

module.exports = { pickOpponent, botFor, firstName, BOT_NAMES }
