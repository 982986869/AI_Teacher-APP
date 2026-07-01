'use strict'

// Parent experience — read-only. A parent links to ONE child (by email/phone), then
// sees the child's progress. Parents can never attempt student content (enforced via
// req.scope.role across the student write endpoints).

const db = require('../config/database')
const ApiResponse = require('../utils/ApiResponse')
const braingym = require('../services/braingym.service')
const arena = require('../services/arena/arena.service')
const { deriveScope } = require('../services/personalization/scope')

const onlyParent = (req) => req.scope && req.scope.role === 'parent'

// POST /api/parent/link-child  { email? , phone? }
async function linkChild(req, res, next) {
  try {
    if (!onlyParent(req)) return ApiResponse.error(res, 'Only a parent account can link a child.', 403)
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : null
    const phone = req.body.phone ? String(req.body.phone).trim() : null
    if (!email && !phone) return ApiResponse.error(res, 'Child email or phone is required.', 422)

    const rows = await db.$queryRawUnsafe(
      `SELECT id, name, grade, stream, account_type FROM "users"
        WHERE ($1::text IS NOT NULL AND lower(email) = $1) OR ($2::text IS NOT NULL AND phone = $2)
        LIMIT 1`,
      email, phone,
    )
    const child = rows && rows[0]
    if (!child) return ApiResponse.error(res, 'No student found with those details.', 404)
    if (String(child.account_type || 'student') !== 'student') return ApiResponse.error(res, 'That account is not a student.', 422)
    if (child.id === req.user.id) return ApiResponse.error(res, 'You cannot link yourself.', 422)

    await db.$executeRawUnsafe(`UPDATE "users" SET "linked_student_id" = $1::uuid WHERE id = $2::uuid`, child.id, req.user.id)
    return ApiResponse.success(res, { child: { id: child.id, name: child.name, grade: child.grade } }, 'Child linked')
  } catch (err) { next(err) }
}

// GET /api/parent/report — the linked child's progress summary (read-only)
async function report(req, res, next) {
  try {
    if (!onlyParent(req)) return ApiResponse.error(res, 'Only a parent account can view this.', 403)
    const childId = req.user.linked_student_id
    if (!childId) return ApiResponse.success(res, { linked: false })

    const rows = await db.$queryRawUnsafe(
      `SELECT id, name, grade, stream, board, account_type FROM "users" WHERE id = $1::uuid LIMIT 1`,
      childId,
    )
    const child = rows && rows[0]
    if (!child) return ApiResponse.success(res, { linked: false })

    // Pull the child's progress from the existing services (best-effort each).
    const [progress, arenaHist] = await Promise.all([
      braingym.getProgress(childId).catch(() => null),
      arena.history({ userId: childId, limit: 10 }).catch(() => null),
    ])
    let mistakes = 0
    try {
      const mc = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "mistake_book" WHERE "userId" = $1::uuid AND status = 'unresolved'`, childId)
      mistakes = (mc && mc[0] && mc[0].n) || 0
    } catch (_) { /* table may not exist in some envs */ }

    const sc = deriveScope(child)
    return ApiResponse.success(res, {
      linked: true,
      child: { id: child.id, name: child.name, className: sc.className, stream: sc.stream, board: sc.board, subjects: sc.subjects },
      brainGym: progress || { totalXp: 0, quizzesCompleted: 0, accuracy: 0, currentStreak: 0 },
      arena: arenaHist ? { rating: arenaHist.rating, played: arenaHist.played, wins: arenaHist.wins, losses: arenaHist.losses } : { rating: 1000, played: 0, wins: 0, losses: 0 },
      openMistakes: mistakes,
    })
  } catch (err) { next(err) }
}

module.exports = { linkChild, report }
