'use strict'

const { Router } = require('express')
const healthRouter = require('./health')
const { authenticate, requireFullAccess } = require('../middleware/auth')

const router = Router()

// ── The content paywall ───────────────────────────────────────────────────────
// `paid` mounts a router behind requireFullAccess: a free account gets 403 LOCKED
// and the app raises its unlock sheet. This is the enforcement — the locks the app
// draws are presentation, and a token plus curl would walk straight past them.
//
// It is applied HERE, in one list, rather than inside each router, so that the set
// of things you have to pay for is one readable block instead of a property you can
// only discover by opening nineteen files. A new content router that forgets to
// register here is the failure mode; see the routing test.
//
// authenticate is repeated because requireFullAccess needs req.scope and most of
// these routers only authenticate internally, i.e. too late. It short-circuits when
// req.user is already set, so this costs nothing.
const paid = (mod) => [authenticate, requireFullAccess, mod]

router.use('/health',    healthRouter)
router.use('/config',    require('./config'))
router.use('/cms',       require('./cms'))
router.use('/auth',      require('./auth'))

// Free: the whole point of the free tier. Brain Gym, the Arena and the games are
// what a new account can do before paying, and support is how they ask to pay.
router.use('/brain-gym',  require('./brainGym'))
router.use('/arena',      require('./arena'))
router.use('/support',    require('./support'))
router.use('/parent',     require('./parent'))

// Free. Every endpoint here is a derived view of the student's OWN history —
// mastery, weak concepts, revision due, results, mistake book. None of them return
// lesson or question content, so there is nothing here to withhold, and for a free
// account they are all empty anyway. The Results SCREEN is gated in the app; that is
// a product choice about what to show, not a leak this router could cause.
router.use('/learning',   require('./learning'))

// Paid.
router.use('/ai',           paid(require('./ai')))
router.use('/knowledge',    paid(require('./knowledge')))
router.use('/tts',          paid(require('./tts')))
router.use('/resources',    paid(require('./resources')))
router.use('/mcq-practice', paid(require('./mcqPractice')))
router.use('/online-tests', paid(require('./onlineTest')))
router.use('/offline-tests', paid(require('./offlineTest')))
router.use('/mock-tests',   paid(require('./mockTests')))
router.use('/sessions',     paid(require('./sessions')))

router.use('/admin',      require('./admin'))

module.exports = router
