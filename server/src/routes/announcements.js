'use strict'

// Announcements a signed-in person is allowed to see. Admins author them under
// /api/admin/announcements; this is the read side the app calls.
//
// Mounted with `authenticate` only — NOT behind the paid gate. The whole point of an
// announcement is to reach everyone, and a free account is exactly who needs to hear
// that new content or a price change has landed.

const { Router } = require('express')
const { list } = require('../controllers/announcements.controller')

const router = Router()

router.get('/', list)

module.exports = router
