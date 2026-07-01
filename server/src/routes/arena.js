'use strict'

const { Router } = require('express')
const { body, query } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const { matchmake, active, abandon, submitResult, history, leaderboard } = require('../controllers/arena.controller')

const router = Router()

// Every Arena route requires a valid JWT (req.user is set by authenticate).
router.use(authenticate)

const matchmakeRules = [
  body('game').optional().isIn(['no_attack', 'rectangle_it']).withMessage('unknown game'),
]

const abandonRules = [
  body('matchId').optional().isUUID().withMessage('matchId must be a UUID'),
]

const resultRules = [
  body('matchId').isUUID().withMessage('matchId is required'),
  // solo race (placements) OR turn-based duel (moves) — both optional at the schema
  // layer; the service requires the right one for the match.
  body('placements').optional().isArray({ max: 100 }).withMessage('placements must be an array'),
  body('placements.*.r').optional().isInt({ min: 0, max: 31 }).withMessage('bad cell row'),
  body('placements.*.c').optional().isInt({ min: 0, max: 31 }).withMessage('bad cell col'),
  body('moves').optional().isArray({ max: 200 }).withMessage('moves must be an array'),
  body('moves.*.r').optional().isInt({ min: 0, max: 31 }).withMessage('bad move row'),
  body('moves.*.c').optional().isInt({ min: 0, max: 31 }).withMessage('bad move col'),
  body('moves.*.by').optional().isIn(['user', 'opp']).withMessage('bad move owner'),
  // best-of-N rectangle duel
  body('rounds').optional().isArray({ max: 9 }).withMessage('rounds must be an array'),
  body('rounds.*.moves').optional().isArray({ max: 200 }).withMessage('round moves must be an array'),
  body('rounds.*.starter').optional().isIn(['user', 'opp']).withMessage('bad starter'),
  body('timeMs').isInt({ min: 0, max: 600000 }).withMessage('timeMs is invalid').toInt(),
]

const listRules = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
]

router.post('/matchmake', matchmakeRules, matchmake) // find an opponent + a puzzle
router.get('/active', active)                        // resume an in-progress match
router.post('/abandon', abandonRules, abandon)       // safe cleanup of a pending match
router.post('/result', resultRules, submitResult)    // submit my solve → win/loss + rating
router.get('/history', listRules, history)           // my recent battles + rating
router.get('/leaderboard', listRules, leaderboard)   // rating-ranked players

module.exports = router
