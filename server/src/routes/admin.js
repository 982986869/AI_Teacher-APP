'use strict'

// Admin Portal API — mounted at /api/admin. Every route (except login) runs through
// adminAuthenticate (requires an admin_role) then a per-route requirePermission guard.
// The student runtime routes are entirely untouched.

const { Router } = require('express')
const { adminAuthenticate, requirePermission } = require('../middleware/adminAuth')

const authCtrl = require('../controllers/admin/auth.controller')
const dashboardCtrl = require('../controllers/admin/dashboard.controller')
const usersCtrl = require('../controllers/admin/users.controller')
const contentCtrl = require('../controllers/admin/content.controller')
const reportsCtrl = require('../controllers/admin/reports.controller')
const announceCtrl = require('../controllers/admin/announcements.controller')
const settingsCtrl = require('../controllers/admin/settings.controller')
const flagsCtrl = require('../controllers/admin/featureFlags.controller')
const cmsCtrl = require('../controllers/admin/cms.controller')
const parentsCtrl = require('../controllers/admin/parents.controller')
const analyticsCtrl = require('../controllers/admin/analytics.controller')
const auditCtrl = require('../controllers/admin/audit.controller')
const aiCtrl = require('../controllers/admin/aiTeacher.controller')

const router = Router()

// ─── Auth (public login, then everything below requires an admin session) ──────
router.post('/auth/login', authCtrl.login)
router.get('/auth/me', adminAuthenticate, authCtrl.me)

router.use(adminAuthenticate) // ← gate everything past this point

// ─── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', requirePermission('dashboard.view'), dashboardCtrl.overview)

// ─── Users ───────────────────────────────────────────────────────────────────
router.get('/users/meta', requirePermission('users.view'), usersCtrl.meta)
router.get('/users', requirePermission('users.view'), usersCtrl.list)
router.get('/users/:id', requirePermission('users.view'), usersCtrl.detail)
router.patch('/users/:id/role', requirePermission('users.role'), usersCtrl.setRole)
router.post('/users/:id/reset-password', requirePermission('users.password'), usersCtrl.resetPassword)
router.patch('/users/:id/status', requirePermission('users.edit'), usersCtrl.setStatus)
router.delete('/users/:id', requirePermission('users.delete'), usersCtrl.remove)

// ─── Parents (parent-centric view of the users table) ──────────────────────────
router.get('/parents', requirePermission('users.view'), parentsCtrl.list)
router.get('/parents/:id', requirePermission('users.view'), parentsCtrl.detail)
router.post('/parents/:id/link', requirePermission('users.edit'), parentsCtrl.link)
router.post('/parents/:id/unlink', requirePermission('users.edit'), parentsCtrl.unlink)

// ─── Content ─────────────────────────────────────────────────────────────────
router.get('/content/overview', requirePermission('content.view'), contentCtrl.overview)
router.get('/content/subjects', requirePermission('content.view'), contentCtrl.subjects)
router.get('/content/chapters', requirePermission('content.view'), contentCtrl.chapters)
router.get('/content/mock-tests', requirePermission('content.view'), contentCtrl.mockTests)
router.get('/content/braingym-questions', requirePermission('content.view'), contentCtrl.brainGymQuestions)
router.patch('/content/braingym-questions/:id/status', requirePermission('content.edit'), contentCtrl.setBrainGymStatus)

// ─── Reports ─────────────────────────────────────────────────────────────────
router.get('/reports', requirePermission('reports.view'), reportsCtrl.analytics)

// ─── Analytics (filterable SaaS dashboard, built on analytics.service) ──────────
router.get('/analytics/facets', requirePermission('reports.view'), analyticsCtrl.facets)
router.get('/analytics/summary', requirePermission('reports.view'), analyticsCtrl.summary)
router.get('/analytics/trends', requirePermission('reports.view'), analyticsCtrl.trends)
router.get('/analytics/top', requirePermission('reports.view'), analyticsCtrl.top)
router.get('/analytics/activity', requirePermission('reports.view'), analyticsCtrl.activity)

// ─── AI Teacher (monitor + non-runtime config) ─────────────────────────────────
router.get('/ai-teacher/overview', requirePermission('aiteacher.view'), aiCtrl.overview)
router.get('/ai-teacher/lessons', requirePermission('aiteacher.view'), aiCtrl.lessons)
router.patch('/ai-teacher/config', requirePermission('aiteacher.edit'), aiCtrl.saveConfig)

// ─── Announcements ─────────────────────────────────────────────────────────────
router.get('/announcements', requirePermission('announcements.view'), announceCtrl.list)
router.post('/announcements', requirePermission('announcements.edit'), announceCtrl.create)
router.patch('/announcements/:id', requirePermission('announcements.edit'), announceCtrl.update)
router.post('/announcements/:id/transition', requirePermission('announcements.edit'), announceCtrl.transition)
router.delete('/announcements/:id', requirePermission('announcements.edit'), announceCtrl.remove)

// ─── Settings ────────────────────────────────────────────────────────────────
router.get('/settings', requirePermission('settings.view'), settingsCtrl.list)
router.patch('/settings/:key', requirePermission('settings.edit'), settingsCtrl.update)

// ─── Feature Flags ─────────────────────────────────────────────────────────────
router.get('/feature-flags', requirePermission('flags.view'), flagsCtrl.list)
router.patch('/feature-flags/:key', requirePermission('flags.edit'), flagsCtrl.update)

// ─── CMS (content hierarchy) ────────────────────────────────────────────────────
router.get('/cms/meta', requirePermission('content.view'), cmsCtrl.meta)
router.get('/cms/nodes', requirePermission('content.view'), cmsCtrl.list)
router.get('/cms/nodes/:id', requirePermission('content.view'), cmsCtrl.get)
router.get('/cms/nodes/:id/versions', requirePermission('content.view'), cmsCtrl.versions)
router.post('/cms/nodes', requirePermission('content.edit'), cmsCtrl.create)
router.post('/cms/nodes/reorder', requirePermission('content.edit'), cmsCtrl.reorder)
router.patch('/cms/nodes/:id', requirePermission('content.edit'), cmsCtrl.update)
router.post('/cms/nodes/:id/status', requirePermission('content.edit'), cmsCtrl.transition) // publish gated inside
router.post('/cms/nodes/:id/versions/:version/restore', requirePermission('content.edit'), cmsCtrl.restore)
router.delete('/cms/nodes/:id', requirePermission('content.edit'), cmsCtrl.remove)

// ─── Audit Logs ────────────────────────────────────────────────────────────────
router.get('/audit/facets', requirePermission('audit.view'), auditCtrl.facets)
router.get('/audit', requirePermission('audit.view'), auditCtrl.list)

module.exports = router
