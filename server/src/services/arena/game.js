'use strict'

// "No Attack" — place N chess pieces on a grid so that none attack each other
// (the classic N-Queens family). Pure, deterministic logic shared by matchmaking,
// validation, scoring and tests. No I/O here so it can run anywhere.

// Per-piece attack predicates.
const ATTACKS = {
  queen: (a, b) => a.r === b.r || a.c === b.c || Math.abs(a.r - b.r) === Math.abs(a.c - b.c),
  rook: (a, b) => a.r === b.r || a.c === b.c,
  bishop: (a, b) => { const dr = Math.abs(a.r - b.r), dc = Math.abs(a.c - b.c); return dr === dc && dr !== 0 },
  knight: (a, b) => {
    const dr = Math.abs(a.r - b.r), dc = Math.abs(a.c - b.c)
    return (dr === 1 && dc === 2) || (dr === 2 && dc === 1)
  },
  king: (a, b) => Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c)) === 1,
}
const attack = (a, b, piece = 'queen') => (ATTACKS[piece] || ATTACKS.queen)(a, b)

// Pieces a duel match can pick from (variety — every match feels different).
const DUEL_PIECES = ['queen', 'rook', 'bishop', 'knight']

// Difficulty rises with the player's arena rating.
function difficultyFor(rating = 1000) {
  if (rating >= 1250) return 'hard'
  if (rating >= 1080) return 'medium'
  return 'easy'
}

const TIER = {
  easy:   { gridN: 5, target: 4 },
  medium: { gridN: 5, target: 5 },
  hard:   { gridN: 6, target: 6 },
}

const MAX_TIME_MS = 90000
const keyOf = (r, c) => `${r},${c}`

// Backtracking solver — returns one valid non-attacking placement of `target`
// pieces, or null if impossible. Used to GUARANTEE every generated puzzle is
// solvable, and by tests/hints. Grids are tiny (≤ 6×6) so this is instant.
function solveNonAttacking(gridN, target, piece = 'queen') {
  const atk = ATTACKS[piece] || ATTACKS.queen
  const placed = []
  const bt = (start) => {
    if (placed.length === target) return true
    for (let i = start; i < gridN * gridN; i++) {
      const cell = { r: Math.floor(i / gridN), c: i % gridN }
      if (placed.every((p) => !atk(p, cell))) {
        placed.push(cell)
        if (bt(i + 1)) return true
        placed.pop()
      }
    }
    return false
  }
  return bt(0) ? placed.slice() : null
}

// Turn-based "No Attack" duel: an irregular board (random blocked cells) on which the
// two players ALTERNATE placing pieces that may not attack any piece already down. The
// player who cannot move loses. `target` is kept for compatibility / display.
function generatePuzzle(rating = 1000, rng = Math.random) {
  const tier = difficultyFor(rating)
  const piece = DUEL_PIECES[Math.floor(rng() * DUEL_PIECES.length)]
  const { gridN, target } = TIER[tier]

  // Random blocked cells give every match a fresh, irregular shape.
  const nBlocked = gridN >= 6 ? 6 : 4
  const all = []
  for (let r = 0; r < gridN; r++) for (let c = 0; c < gridN; c++) all.push({ r, c })
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = all[i]; all[i] = all[j]; all[j] = t
  }
  const blocked = all.slice(0, nBlocked)

  return { game: 'no_attack', mode: 'duel', piece, gridN, target, blocked, tier }
}

// Cells where the next piece may legally be placed: empty, not blocked, and not
// attacking any piece already on the board.
function legalMoves(puzzle, placed) {
  const atk = ATTACKS[puzzle.piece] || ATTACKS.queen
  const blocked = new Set((puzzle.blocked || []).map((b) => keyOf(b.r, b.c)))
  const occ = new Set((placed || []).map((p) => keyOf(p.r, p.c)))
  const out = []
  for (let r = 0; r < puzzle.gridN; r++) {
    for (let c = 0; c < puzzle.gridN; c++) {
      const k = keyOf(r, c)
      if (blocked.has(k) || occ.has(k)) continue
      const cell = { r, c }
      if ((placed || []).every((p) => !atk(p, cell))) out.push(cell)
    }
  }
  return out
}

// Authoritatively replay a turn-based duel. Verifies every move was legal and the
// turns alternated, then confirms the game truly ended (the player to move has NO
// legal cell) and returns the winner. Server-side anti-cheat for the duel result.
function replayDuel(puzzle, moves, firstPlayer = 'user') {
  const atk = ATTACKS[puzzle.piece] || ATTACKS.queen
  const blocked = new Set((puzzle.blocked || []).map((b) => keyOf(b.r, b.c)))
  const placed = []
  let expect = firstPlayer
  for (const mv of moves || []) {
    const r = Number(mv && mv.r), c = Number(mv && mv.c)
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0 || r >= puzzle.gridN || c >= puzzle.gridN) {
      return { valid: false, reason: 'off_board' }
    }
    const k = keyOf(r, c)
    if (blocked.has(k)) return { valid: false, reason: 'blocked' }
    if (placed.some((p) => keyOf(p.r, p.c) === k)) return { valid: false, reason: 'occupied' }
    if (placed.some((p) => atk(p, { r, c }))) return { valid: false, reason: 'attacks' }
    if (mv.by !== expect) return { valid: false, reason: 'turn_order' }
    placed.push({ r, c })
    expect = expect === 'user' ? 'opp' : 'user'
  }
  if (legalMoves(puzzle, placed).length > 0) return { valid: false, reason: 'not_over' }
  // `expect` is to move but has no legal cell → they lose.
  return { valid: true, winner: expect === 'user' ? 'opp' : 'user', moves: placed.length }
}

// Indices of every piece involved in at least one attack.
function conflicts(cells, piece = 'queen') {
  const atk = ATTACKS[piece] || ATTACKS.queen
  const bad = new Set()
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (atk(cells[i], cells[j])) { bad.add(i); bad.add(j) }
    }
  }
  return bad
}

// De-dupe placements and clamp to the board.
function normalize(placements, puzzle) {
  const seen = new Set(), out = []
  for (const p of placements || []) {
    const r = Number(p && p.r), c = Number(p && p.c)
    if (!Number.isInteger(r) || !Number.isInteger(c)) continue
    if (r < 0 || c < 0 || r >= puzzle.gridN || c >= puzzle.gridN) continue
    const k = keyOf(r, c)
    if (seen.has(k)) continue
    seen.add(k); out.push({ r, c })
  }
  return out
}

function validate(placements, puzzle) {
  const cells = normalize(placements, puzzle)
  const blockedSet = new Set((puzzle.blocked || []).map((b) => keyOf(b.r, b.c)))
  const onBlocked = cells.some((c) => blockedSet.has(keyOf(c.r, c.c)))
  const conf = conflicts(cells, puzzle.piece)
  const solved = !onBlocked && conf.size === 0 && cells.length === puzzle.target
  return { count: cells.length, conflicts: conf.size, onBlocked, solved, cells }
}

// Reward solving + speed; partial credit for safe progress when unsolved.
function score({ solved, timeMs = 0, count = 0, target = 1 }) {
  if (solved) {
    const speed = Math.round(Math.max(0, (MAX_TIME_MS - Math.min(timeMs, MAX_TIME_MS)) / MAX_TIME_MS) * 100)
    return 100 + speed // 100..200
  }
  return Math.round((Math.min(count, target) / Math.max(1, target)) * 60) // 0..60
}

// ═══ "Rectangle It" — a turn-based dot-claiming duel, best of N rounds ═══════════
// Players alternate claiming empty dots on a grid. The first to own four dots that
// form an axis-aligned rectangle wins the round. First to win a majority of rounds
// wins the match.
const RECT_ROUNDS = 3

function generateRectPuzzle(/* rating */) {
  return { game: 'rectangle_it', mode: 'duel', gridN: 5, rounds: RECT_ROUNDS }
}

// Does this player's owned set contain an axis-aligned rectangle? Returns the four
// corners {r1,r2,c1,c2} or null. Two rows sharing the same column-pair = a rectangle.
function findRectangle(cells) {
  const byRow = new Map()
  for (const { r, c } of cells) {
    if (!byRow.has(r)) byRow.set(r, new Set())
    byRow.get(r).add(c)
  }
  const seenPair = new Map() // "c1,c2" -> first row that had both
  for (const [r, colSet] of byRow) {
    const cols = [...colSet].sort((a, b) => a - b)
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        const key = `${cols[i]},${cols[j]}`
        if (seenPair.has(key)) return { r1: seenPair.get(key), r2: r, c1: cols[i], c2: cols[j] }
        seenPair.set(key, r)
      }
    }
  }
  return null
}

// Replay ONE round of alternating claims. Validates legality + turn order, and that
// the round genuinely ended (a rectangle was formed, or the board filled = draw).
function replayRectRound(puzzle, moves, starter = 'user') {
  const occ = new Set()
  const own = { user: [], opp: [] }
  let expect = starter
  for (const mv of moves || []) {
    const r = Number(mv && mv.r), c = Number(mv && mv.c)
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0 || r >= puzzle.gridN || c >= puzzle.gridN) {
      return { valid: false, reason: 'off_board' }
    }
    const k = keyOf(r, c)
    if (occ.has(k)) return { valid: false, reason: 'occupied' }
    if (mv.by !== 'user' && mv.by !== 'opp') return { valid: false, reason: 'bad_owner' }
    if (mv.by !== expect) return { valid: false, reason: 'turn_order' }
    occ.add(k)
    own[mv.by].push({ r, c })
    if (findRectangle(own[mv.by])) return { valid: true, winner: mv.by, done: true }
    expect = expect === 'user' ? 'opp' : 'user'
  }
  if (occ.size >= puzzle.gridN * puzzle.gridN) return { valid: true, winner: null, done: true } // draw
  return { valid: false, reason: 'not_over' }
}

// Replay a best-of-N match. `rounds` = [{ moves, starter }]. Starter alternates each
// round (loser/second starts next, here simply alternating). Returns the match winner.
function replayRectMatch(puzzle, rounds) {
  if (!Array.isArray(rounds) || rounds.length === 0) return { valid: false, reason: 'no_rounds' }
  const need = Math.floor((puzzle.rounds || RECT_ROUNDS) / 2) + 1
  let userWins = 0, oppWins = 0
  let starter = 'user'
  for (const round of rounds) {
    const res = replayRectRound(puzzle, round.moves, round.starter || starter)
    if (!res.valid) return { valid: false, reason: res.reason }
    if (res.winner === 'user') userWins += 1
    else if (res.winner === 'opp') oppWins += 1
    starter = starter === 'user' ? 'opp' : 'user'
    if (userWins >= need || oppWins >= need) break
  }
  const winner = userWins > oppWins ? 'user' : oppWins > userWins ? 'opp' : 'draw'
  return { valid: true, winner, userWins, oppWins }
}

// ── Tunables (single source of truth for rating/XP/anti-cheat) ─────────────────
const CONFIG = {
  defaultRating: 1000,
  ratingK: 24,
  minMsPerPiece: 350, // anti instant-solve floor: target × this
  graceMs: 1500,      // network grace on the wall-clock ceiling
  xp: { win: 50, draw: 30, loss: 15, solvedBonus: 20 },
}

function decideResult(userScore, opponentScore) {
  if (userScore > opponentScore) return 'win'
  if (userScore < opponentScore) return 'loss'
  return 'draw'
}

function actualScoreFor(result) {
  return result === 'win' ? 1 : result === 'draw' ? 0.5 : 0
}

function computeXp(result, solved) {
  const base = CONFIG.xp[result] != null ? CONFIG.xp[result] : CONFIG.xp.loss
  return base + (solved ? CONFIG.xp.solvedBonus : 0)
}

// Standard Elo. actual = 1 win / 0.5 draw / 0 loss.
function elo(before, oppRating, actual, k = CONFIG.ratingK) {
  const expected = 1 / (1 + Math.pow(10, (oppRating - before) / 400))
  return Math.round(before + k * (actual - expected))
}

// Server-authoritative play time — never trust the client clock blindly.
//   ceiling: wall-clock since the match was created (+ grace) — can't have played longer
//   floor:   target × minMsPerPiece — can't have played impossibly fast
function effectiveTime(clientMs, serverElapsedMs, target = 1) {
  const ceil = Math.min(MAX_TIME_MS, Math.max(0, Number(serverElapsedMs) || 0) + CONFIG.graceMs)
  const raw = Number.isFinite(clientMs) ? clientMs : ceil
  const clamped = Math.max(0, Math.min(raw, ceil))
  const floor = Math.min(ceil, target * CONFIG.minMsPerPiece)
  return Math.max(clamped, floor)
}

module.exports = {
  ATTACKS, DUEL_PIECES, MAX_TIME_MS, CONFIG, TIER, RECT_ROUNDS, difficultyFor,
  attack, generatePuzzle, solveNonAttacking, conflicts, normalize, validate, score, keyOf,
  legalMoves, replayDuel,
  generateRectPuzzle, findRectangle, replayRectRound, replayRectMatch,
  decideResult, actualScoreFor, computeXp, elo, effectiveTime,
}
