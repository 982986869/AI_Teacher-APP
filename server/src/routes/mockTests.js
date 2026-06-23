'use strict'

const { Router } = require('express')
const { authenticate } = require('../middleware/auth')
const { listTests, getAttempts, getTest, getQuestions, submit } = require('../controllers/mockTest.controller')

const router = Router()

// All mock-test routes require a valid JWT (so attempts can be linked to a user).
router.use(authenticate)

router.get('/', listTests)                 // /api/mock-tests?subject=Physics
router.get('/attempts', getAttempts)       // /api/mock-tests/attempts?subject=Physics  (before :id)
router.get('/:id', getTest)                // /api/mock-tests/:id
router.get('/:id/questions', getQuestions) // /api/mock-tests/:id/questions
router.post('/:id/submit', submit)         // /api/mock-tests/:id/submit

module.exports = router
