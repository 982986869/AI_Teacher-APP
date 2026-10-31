'use strict'

const { Router } = require('express')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const {
  linkChild, children, setActiveChild, unlinkChild,
  pendingLinkNotices, ackLinkNotices,
  report, progressDay, progressCalendar,
} = require('../controllers/parent.controller')
const { createTrialBooking, upcomingTrialBooking, cancelTrialBooking } = require('../controllers/trialBooking.controller')

const router = Router()
router.use(authenticate)

router.post('/link-child', [
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('phone').optional({ checkFalsy: true }).isString(),
], linkChild)
// A parent may have more than one child: list them, switch which one the app
// shows, and remove one. The link itself is created by POST /link-child above.
router.get('/children', children)
router.post('/active-child', [body('childId').isUUID()], setActiveChild)
router.delete('/children/:childId', unlinkChild)

router.get('/report', report)
// The CHILD's side of linking — these two are the only routes here a student
// calls. `authenticate` above covers them; no parent check, deliberately.
router.get('/link-notices', pendingLinkNotices)
router.post('/link-notices/ack', ackLinkNotices)

router.get('/progress/day', progressDay)
router.get('/progress/calendar', progressCalendar)

// Free demo-class booking. Validation lives in services/trialBooking (one place, unit
// tested) rather than express-validator chains here.
router.post('/trial-bookings', createTrialBooking)
router.get('/trial-bookings/upcoming', upcomingTrialBooking)
router.post('/trial-bookings/:id/cancel', cancelTrialBooking)

module.exports = router
