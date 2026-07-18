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
const sessionsCtrl = require('../controllers/admin/sessions.controller')
const testsCtrl = require('../controllers/admin/tests.controller')
const resCtrl = require('../controllers/admin/resources.controller')
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
router.get('/modules', requirePermission('dashboard.view'), require('../controllers/admin/modules.controller').overview)

// ─── Users ───────────────────────────────────────────────────────────────────
router.get('/users/meta', requirePermission('users.view'), usersCtrl.meta)
router.get('/users', requirePermission('users.view'), usersCtrl.list)
router.get('/users/:id', requirePermission('users.view'), usersCtrl.detail)
router.patch('/users/:id/role', requirePermission('users.role'), usersCtrl.setRole)
router.post('/users/:id/reset-password', requirePermission('users.password'), usersCtrl.resetPassword)
router.patch('/users/:id/status', requirePermission('users.edit'), usersCtrl.setStatus)
router.delete('/users/:id', requirePermission('users.delete'), usersCtrl.remove)

// ─── Student Results (admin views any student's Results — reuses results.service) ──
const studentResultsCtrl = require('../controllers/admin/studentResults.controller')
router.get('/students/:id/results', requirePermission('users.view'), studentResultsCtrl.results)
router.get('/students/:id/results/attempt/:attemptId', requirePermission('users.view'), studentResultsCtrl.attemptDetail)

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
router.get('/ai-teacher/lessons/:id', requirePermission('aiteacher.view'), aiCtrl.lessonDetail)
router.get('/ai-teacher/lessons/:id/analytics', requirePermission('aiteacher.view'), aiCtrl.lessonAnalytics)
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
router.get('/cms/nodes/:id/subtree', requirePermission('content.view'), cmsCtrl.subtree)
router.post('/cms/nodes/:id/duplicate', requirePermission('content.edit'), cmsCtrl.duplicate)
router.post('/cms/nodes', requirePermission('content.edit'), cmsCtrl.create)
router.post('/cms/nodes/reorder', requirePermission('content.edit'), cmsCtrl.reorder)
router.patch('/cms/nodes/:id', requirePermission('content.edit'), cmsCtrl.update)
router.post('/cms/nodes/:id/status', requirePermission('content.edit'), cmsCtrl.transition) // publish gated inside
router.post('/cms/nodes/:id/versions/:version/restore', requirePermission('content.edit'), cmsCtrl.restore)
router.delete('/cms/nodes/:id', requirePermission('content.edit'), cmsCtrl.remove)

// ── Sessions ────────────────────────────────────────────────────────────────────
router.get('/sessions', requirePermission('content.view'), sessionsCtrl.list)
router.get('/sessions/:id', requirePermission('content.view'), sessionsCtrl.get)
router.post('/sessions', requirePermission('content.edit'), sessionsCtrl.create)
router.patch('/sessions/:id', requirePermission('content.edit'), sessionsCtrl.update)
router.post('/sessions/:id/status', requirePermission('content.edit'), sessionsCtrl.transition)
router.delete('/sessions/:id', requirePermission('content.edit'), sessionsCtrl.remove)

// ── Tests (Mock Tests) ──────────────────────────────────────────────────────────
router.get('/tests', requirePermission('content.view'), testsCtrl.list)
router.get('/tests/subjects', requirePermission('content.view'), testsCtrl.subjects) // before /tests/:id
router.get('/tests/classes', requirePermission('content.view'), testsCtrl.classes)   // before /tests/:id
router.get('/tests/:id', requirePermission('content.view'), testsCtrl.get)
router.post('/tests', requirePermission('content.edit'), testsCtrl.create)
router.patch('/tests/:id', requirePermission('content.edit'), testsCtrl.update)
router.post('/tests/:id/status', requirePermission('content.edit'), testsCtrl.transition)
router.post('/tests/:id/duplicate', requirePermission('content.edit'), testsCtrl.duplicate)
router.delete('/tests/:id', requirePermission('content.edit'), testsCtrl.remove)
router.post('/tests/:id/questions', requirePermission('content.edit'), testsCtrl.addQuestion)
router.post('/tests/:id/questions/reorder', requirePermission('content.edit'), testsCtrl.reorderQuestions)
router.patch('/tests/:id/questions/:qid', requirePermission('content.edit'), testsCtrl.updateQuestion)
router.post('/tests/:id/questions/:qid/duplicate', requirePermission('content.edit'), testsCtrl.duplicateQuestion)
router.delete('/tests/:id/questions/:qid', requirePermission('content.edit'), testsCtrl.removeQuestion)

// ── Online Tests (imported examin8 MCQ tests; class → subject → chapter → test) ──
const otCtrl = require('../controllers/admin/onlineTests.controller')
router.get('/online-tests/classes', requirePermission('content.view'), otCtrl.classes)
router.get('/online-tests/subjects', requirePermission('content.view'), otCtrl.subjects)
router.get('/online-tests/subjects/:slug/chapters', requirePermission('content.view'), otCtrl.chapters)
router.get('/online-tests/tests', requirePermission('content.view'), otCtrl.tests)
router.post('/online-tests/reorder', requirePermission('content.edit'), otCtrl.reorder)
router.get('/online-tests/:id', requirePermission('content.view'), otCtrl.test)
router.delete('/online-tests/:id', requirePermission('content.edit'), otCtrl.remove)

// ── Resources (browse subjects; manage chapters + previous-year papers) ─────────
router.get('/resources/classes', requirePermission('content.view'), resCtrl.classesList)
router.get('/resources/subjects', requirePermission('content.view'), resCtrl.subjects)
router.patch('/resources/subjects/:id', requirePermission('content.edit'), resCtrl.renameSubject)
router.get('/resources/subjects/:slug/chapters', requirePermission('content.view'), resCtrl.chapters)
router.post('/resources/subjects/:slug/chapters', requirePermission('content.edit'), resCtrl.createChapter)
router.get('/resources/subjects/:slug/papers', requirePermission('content.view'), resCtrl.papers)
router.post('/resources/subjects/:slug/papers/reorder', requirePermission('content.edit'), resCtrl.reorderPapers)
router.post('/resources/subjects/:slug/papers', requirePermission('content.edit'), resCtrl.createPaper)
router.get('/resources/subjects/:slug/papers/:extUid', requirePermission('content.view'), resCtrl.paperOne)
router.put('/resources/subjects/:slug/papers/:extUid', requirePermission('content.edit'), resCtrl.updatePaper)
router.delete('/resources/subjects/:slug/papers', requirePermission('content.edit'), resCtrl.deletePaper)
router.post('/resources/chapters/reorder', requirePermission('content.edit'), resCtrl.reorderChapters)
router.patch('/resources/chapters/:id', requirePermission('content.edit'), resCtrl.updateChapter)
router.post('/resources/chapters/:id/status', requirePermission('content.edit'), resCtrl.chapterStatus)
router.get('/resources/chapters/:id/notes', requirePermission('content.view'), resCtrl.chapterNotes)
router.put('/resources/chapters/:id/notes', requirePermission('content.edit'), resCtrl.saveChapterNotes)
router.get('/resources/chapters/:id/questions/:type', requirePermission('content.view'), resCtrl.chapterQuestions)
router.put('/resources/chapters/:id/questions/:type', requirePermission('content.edit'), resCtrl.saveChapterQuestions)
router.delete('/resources/chapters/:id', requirePermission('content.edit'), resCtrl.deleteChapter)

// ─── Audit Logs ────────────────────────────────────────────────────────────────
router.get('/audit/facets', requirePermission('audit.view'), auditCtrl.facets)
router.get('/audit', requirePermission('audit.view'), auditCtrl.list)

module.exports = router
