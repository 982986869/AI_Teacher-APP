'use strict'

const { validationResult } = require('express-validator')
const arena = require('../services/arena/arena.service')
const ApiResponse = require('../utils/ApiResponse')

// POST /api/arena/matchmake → { matchId, puzzle, opponent, rating, startedAt }
async function matchmake(req, res, next) {
  try {
    const data = await arena.matchmake({ userId: req.user.id, gameKey: req.body?.game, userName: req.user.name })
    return ApiResponse.created(res, data, 'Match ready')
  } catch (err) {
    console.error('[Arena] matchmake failed', err.code || '', err.message)
    next(err)
  }
}

// GET /api/arena/active → { active: {...} | null } — resume an in-progress match
async function active(req, res, next) {
  try {
    const data = await arena.getActive({ userId: req.user.id })
    return ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

// POST /api/arena/abandon → { abandoned } — safe neutral cleanup (no rating change)
async function abandon(req, res, next) {
  try {
    const data = await arena.abandon({ userId: req.user.id, matchId: req.body?.matchId })
    return ApiResponse.success(res, data, 'Abandoned')
  } catch (err) {
    next(err)
  }
}

// POST /api/arena/result → { result, userScore, opponentScore, xpEarned, ratingDelta, ... }
async function submitResult(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { matchId, placements, moves, rounds, timeMs } = req.body
    const data = await arena.submitResult({ userId: req.user.id, matchId, placements, moves, rounds, timeMs })
    console.log('[Arena] result', { userId: req.user.id, result: data.result, score: data.userScore, rating: data.ratingAfter, dup: !!data.duplicate })
    return ApiResponse.success(res, data, 'Result recorded')
  } catch (err) {
    if (err.status) return ApiResponse.error(res, err.message, err.status)
    console.error('[Arena] result failed', err.code || '', err.message)
    next(err)
  }
}

// GET /api/arena/history → { rating, played, wins, losses, matches }
async function history(req, res, next) {
  try {
    const data = await arena.history({ userId: req.user.id, limit: req.query.limit })
    return ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

// GET /api/arena/leaderboard → { totalPlayers, me, top } (rating-ranked)
async function leaderboard(req, res, next) {
  try {
    const data = await arena.leaderboard({ userId: req.user.id, limit: req.query.limit })
    return ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

module.exports = { matchmake, active, abandon, submitResult, history, leaderboard }
