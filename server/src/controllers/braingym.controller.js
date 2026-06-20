'use strict'

const { validationResult } = require('express-validator')
const braingym = require('../services/braingym.service')
const ApiResponse = require('../utils/ApiResponse')

// ─── POST /api/brain-gym/results ──────────────────────────────────────────────
async function submitResult(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return ApiResponse.error(res, errors.array()[0].msg, 422)

    const { skill, level, totalQuestions, correctCount, wrongCount, timeTakenSec } = req.body
    const { session, xpEarned } = await braingym.saveResult({
      userId: req.user.id,
      skill,
      level,
      totalQuestions,
      correctCount,
      wrongCount,
      timeTakenSec,
    })

    const progress = await braingym.getProgress(req.user.id)
    console.log('[BrainGym] result saved', { userId: req.user.id, xpEarned, totalXp: progress.totalXp })
    return ApiResponse.created(res, { session, xpEarned, progress }, 'Result saved')
  } catch (err) {
    console.error('[BrainGym] result save failed', err.code || '', err.message)
    next(err)
  }
}

// ─── GET /api/brain-gym/progress ──────────────────────────────────────────────
async function getProgress(req, res, next) {
  try {
    const progress = await braingym.getProgress(req.user.id)
    return ApiResponse.success(res, progress)
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/brain-gym/leaderboard?period= ───────────────────────────────────
async function getLeaderboard(req, res, next) {
  try {
    const period = ['weekly', 'monthly', 'all'].includes(req.query.period) ? req.query.period : 'all'
    const data = await braingym.getLeaderboard({ period, userId: req.user.id })
    return ApiResponse.success(res, data)
  } catch (err) {
    next(err)
  }
}

module.exports = { submitResult, getProgress, getLeaderboard }
