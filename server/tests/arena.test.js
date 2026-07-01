'use strict'

// Pure unit tests for the Arena game/rating/scoring/anti-cheat logic. No I/O.

const test = require('node:test')
const assert = require('node:assert')

const game = require('../src/services/arena/game')
const { botFor } = require('../src/services/arena/opponent')

function seeded(seed) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff }
}

test('attack predicates: queen / rook / bishop / knight / king', () => {
  assert.equal(game.attack({ r: 0, c: 0 }, { r: 0, c: 4 }, 'queen'), true)   // row
  assert.equal(game.attack({ r: 0, c: 0 }, { r: 3, c: 3 }, 'queen'), true)   // diagonal
  assert.equal(game.attack({ r: 0, c: 0 }, { r: 1, c: 2 }, 'queen'), false)
  // rook: rows/cols, no diagonal
  assert.equal(game.attack({ r: 0, c: 0 }, { r: 3, c: 3 }, 'rook'), false)
  assert.equal(game.attack({ r: 0, c: 0 }, { r: 0, c: 3 }, 'rook'), true)
  // bishop: diagonal only
  assert.equal(game.attack({ r: 0, c: 0 }, { r: 3, c: 3 }, 'bishop'), true)
  assert.equal(game.attack({ r: 0, c: 0 }, { r: 0, c: 3 }, 'bishop'), false)
  // knight: L-shape only
  assert.equal(game.attack({ r: 0, c: 0 }, { r: 1, c: 2 }, 'knight'), true)
  assert.equal(game.attack({ r: 0, c: 0 }, { r: 0, c: 3 }, 'knight'), false)
  // king: adjacent only
  assert.equal(game.attack({ r: 0, c: 0 }, { r: 1, c: 1 }, 'king'), true)
  assert.equal(game.attack({ r: 0, c: 0 }, { r: 2, c: 0 }, 'king'), false)
})

test('solver finds a valid non-attacking placement; subsets stay safe', () => {
  for (const [gridN, target] of [[5, 4], [5, 5], [6, 6]]) {
    const sol = game.solveNonAttacking(gridN, target, 'queen')
    assert.ok(sol && sol.length === target, `solvable ${gridN}x${gridN} target ${target}`)
    assert.equal(game.conflicts(sol, 'queen').size, 0, 'solution is conflict-free')
    assert.equal(game.conflicts(sol.slice(0, target - 1), 'queen').size, 0, 'a subset is still safe')
  }
})

test('generated duel puzzle is playable (varied piece, blocked board, opening move)', () => {
  for (const rating of [900, 1100, 1300]) {
    const puzzle = game.generatePuzzle(rating)
    assert.ok(game.DUEL_PIECES.includes(puzzle.piece), 'piece is a known duel piece')
    assert.equal(puzzle.mode, 'duel')
    assert.ok(Array.isArray(puzzle.blocked) && puzzle.blocked.length > 0)
    assert.ok(game.legalMoves(puzzle, []).length > 0, `tier ${puzzle.tier} has an opening move`)
  }
})

test('validate flags conflicts, blocked cells and de-dupes', () => {
  const puzzle = { gridN: 5, target: 2, piece: 'queen', blocked: [{ r: 4, c: 4 }] }
  assert.equal(game.validate([{ r: 0, c: 0 }, { r: 0, c: 3 }], puzzle).conflicts, 2) // same row
  assert.equal(game.validate([{ r: 0, c: 0 }, { r: 4, c: 4 }], puzzle).solved, false) // diagonal + blocked
  assert.equal(game.validate([{ r: 0, c: 0 }, { r: 0, c: 0 }], puzzle).count, 1)       // de-dupe
  assert.equal(game.validate([{ r: 0, c: 0 }, { r: 99, c: 9 }], puzzle).count, 1)      // off-board dropped
})

test('score rewards solving and speed; partial credit is time-independent', () => {
  assert.ok(game.score({ solved: true, timeMs: 5000, target: 5 }) > game.score({ solved: true, timeMs: 80000, target: 5 }))
  assert.ok(game.score({ solved: true, timeMs: 80000, target: 5 }) > game.score({ solved: false, count: 3, target: 5 }))
  assert.equal(game.score({ solved: false, count: 3, target: 5 }), 36) // round(3/5*60)
})

test('decideResult: win / loss / draw', () => {
  assert.equal(game.decideResult(200, 180), 'win')
  assert.equal(game.decideResult(100, 180), 'loss')
  assert.equal(game.decideResult(150, 150), 'draw')
})

test('computeXp: base by result + solved bonus', () => {
  assert.equal(game.computeXp('win', true), 70)
  assert.equal(game.computeXp('win', false), 50)
  assert.equal(game.computeXp('draw', true), 50)
  assert.equal(game.computeXp('loss', false), 15)
})

test('elo moves the right direction; underdog gains more', () => {
  assert.ok(game.elo(1000, 1000, 1) > 1000)
  assert.ok(game.elo(1000, 1000, 0) < 1000)
  assert.equal(game.elo(1000, 1000, 0.5), 1000)
  assert.ok(game.elo(1000, 1400, 1) - 1000 > game.elo(1000, 600, 1) - 1000)
})

test('effectiveTime anti-cheat: floor blocks instant solve, ceiling blocks long forgery', () => {
  assert.equal(game.effectiveTime(0, 60000, 5), 5 * game.CONFIG.minMsPerPiece)
  assert.ok(game.effectiveTime(999999, 5000, 5) <= 5000 + game.CONFIG.graceMs)
  const forged = game.score({ solved: true, timeMs: game.effectiveTime(0, 60000, 5), target: 5 })
  assert.ok(forged < 200, 'instant-solve forgery is capped below max')
})

test('duel: legalMoves shrinks as pieces are placed', () => {
  const p = { gridN: 5, piece: 'queen', blocked: [] }
  assert.equal(game.legalMoves(p, []).length, 25)
  // one queen on a 2×2 attacks every other square → no legal move remains
  assert.equal(game.legalMoves({ gridN: 2, piece: 'queen', blocked: [] }, [{ r: 0, c: 0 }]).length, 0)
})

test('duel: replay decides the winner and rejects cheats', () => {
  const small = { gridN: 2, piece: 'queen', blocked: [] }
  // user places, opponent then has no move → user wins
  const ok = game.replayDuel(small, [{ r: 0, c: 0, by: 'user' }])
  assert.equal(ok.valid, true)
  assert.equal(ok.winner, 'user')

  const big = { gridN: 5, piece: 'queen', blocked: [] }
  assert.equal(game.replayDuel(big, [{ r: 0, c: 0, by: 'opp' }]).reason, 'turn_order')      // wrong starter
  assert.equal(game.replayDuel(big, [{ r: 0, c: 0, by: 'user' }, { r: 0, c: 1, by: 'opp' }]).reason, 'attacks') // illegal move
  assert.equal(game.replayDuel(big, [{ r: 0, c: 0, by: 'user' }]).reason, 'not_over')        // game not actually over
})

test('rectangle: findRectangle detects axis-aligned rectangles', () => {
  assert.ok(game.findRectangle([{ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 2, c: 0 }, { r: 2, c: 2 }]))
  assert.equal(game.findRectangle([{ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 2, c: 0 }]), null) // only 3 corners
  assert.equal(game.findRectangle([{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }]), null)
})

test('rectangle: replay one round decides the winner + rejects cheats', () => {
  const puzzle = { gridN: 5, rounds: 3 }
  // user forms the rectangle (0,0)(0,2)(2,0)(2,2); opp plays harmless cells
  const moves = [
    { r: 0, c: 0, by: 'user' }, { r: 1, c: 1, by: 'opp' },
    { r: 0, c: 2, by: 'user' }, { r: 1, c: 3, by: 'opp' },
    { r: 2, c: 0, by: 'user' }, { r: 3, c: 1, by: 'opp' },
    { r: 2, c: 2, by: 'user' },
  ]
  const ok = game.replayRectRound(puzzle, moves, 'user')
  assert.equal(ok.valid, true)
  assert.equal(ok.winner, 'user')

  // wrong starter → rejected
  assert.equal(game.replayRectRound(puzzle, [{ r: 0, c: 0, by: 'opp' }], 'user').reason, 'turn_order')
  // claiming an occupied dot → rejected
  assert.equal(game.replayRectRound(puzzle, [{ r: 0, c: 0, by: 'user' }, { r: 0, c: 0, by: 'opp' }], 'user').reason, 'occupied')
  // game not actually over → rejected
  assert.equal(game.replayRectRound(puzzle, [{ r: 0, c: 0, by: 'user' }], 'user').reason, 'not_over')
})

test('rectangle: best-of-3 match winner is the first to 2 rounds', () => {
  const puzzle = { gridN: 5, rounds: 3 }
  const userRound = {
    starter: 'user',
    moves: [
      { r: 0, c: 0, by: 'user' }, { r: 1, c: 1, by: 'opp' },
      { r: 0, c: 2, by: 'user' }, { r: 1, c: 3, by: 'opp' },
      { r: 2, c: 0, by: 'user' }, { r: 3, c: 1, by: 'opp' },
      { r: 2, c: 2, by: 'user' },
    ],
  }
  const rep = game.replayRectMatch(puzzle, [userRound, userRound])
  assert.equal(rep.valid, true)
  assert.equal(rep.winner, 'user')
  assert.equal(rep.userWins, 2)
})

test('bot opponent is well-formed', () => {
  const puzzle = game.generatePuzzle(1000)
  const bot = botFor(puzzle, 1000, seeded(42))
  assert.equal(typeof bot.name, 'string')
  assert.equal(bot.isBot, true)
  assert.ok(bot.timeMs > 0 && bot.timeMs <= game.MAX_TIME_MS)
  assert.ok(bot.rating > 800 && bot.rating < 1200)
})
