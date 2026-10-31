'use strict'

const { Router } = require('express')
const { body } = require('express-validator')
const { authenticate } = require('../middleware/auth')
const {
  linkChild, children, setActiveChild, unlinkChild,
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
router.get('/progress/day', progressDay)
router.get('/progress/calendar', progressCalendar)

// Free demo-class booking. Validation lives in services/trialBooking (one place, unit
// tested) rather than express-validator chains here.
router.post('/trial-bookings', createTrialBooking)
router.get('/trial-bookings/upcoming', upcomingTrialBooking)
router.post('/trial-bookings/:id/cancel', cancelTrialBooking)

module.exports = router
