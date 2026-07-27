'use strict'

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')

const q = (sql, ...p) => db.$queryRawUnsafe(sql, ...p).catch(() => [])
const one = async (sql, ...p) => { const r = await q(sql, ...p); return (r && r[0]) || {} }
const num = (v) => Number(v) || 0

// GET /api/admin/content/overview — the content catalog at a glance.
async function overview(req, res, next) {
  try {
    const [subjects, chapters, sections, notes, questions, mcqs, genQ, mocks, onlineT, papers, classes] = await Promise.all([
      one(`SELECT COUNT(*)::int AS n FROM "subjects"`),
      one(`SELECT COUNT(*)::int AS n FROM "chapters"`),
      one(`SELECT COUNT(*)::int AS n FROM "sections"`),
      one(`SELECT COUNT(*)::int AS n FROM "notes"`),
      one(`SELECT COUNT(*)::int AS n FROM "questions"`),
      one(`SELECT COUNT(*)::int AS n FROM "mcq_questions"`),
      one(`SELECT COUNT(*)::int AS n,
                  COUNT(*) FILTER (WHERE status='ACTIVE')::int AS active,
                  COUNT(*) FILTER (WHERE status='DRAFT')::int AS draft,
                  COUNT(*) FILTER (WHERE status='ARCHIVED')::int AS archived
             FROM "generated_questions"`),
      one(`SELECT COUNT(*)::int AS n FROM "mock_tests"`),
      one(`SELECT COUNT(*)::int AS n FROM "ot_tests"`).catch(() => ({ n: 0 })),
      one(`SELECT COUNT(*)::int AS n FROM "papers"`).catch(() => ({ n: 0 })),
      q(`SELECT DISTINCT class_level AS c FROM "chapters" ORDER BY class_level`),
    ])
    return ApiResponse.success(res, {
      counts: {
        subjects: num(subjects.n), chapters: num(chapters.n), sections: num(sections.n),
        notes: num(notes.n), questions: num(questions.n), mcqs: num(mcqs.n),
        mockTests: num(mocks.n), onlineTests: num(onlineT.n), papers: num(papers.n),
        brainGym: { total: num(genQ.n), active: num(genQ.active), draft: num(genQ.draft), archived: num(genQ.archived) },
      },
      classes: classes.map((c) => num(c.c)),
    })
  } catch (err) { next(err) }
}

// GET /api/admin/content/subjects?class=
async function subjects(req, res, next) {
  try {
    const klass = req.query.class ? parseInt(req.query.class, 10) : null
    const rows = klass
      ? await q(`SELECT s.id::text AS id, s.name, s.slug,
                        COUNT(c.id) FILTER (WHERE c.class_level = $1)::int AS chapters
                   FROM "subjects" s LEFT JOIN "chapters" c ON c.subject_id = s.id
                  GROUP BY s.id ORDER BY s.position, s.name`, klass)
      : await q(`SELECT s.id::text AS id, s.name, s.slug, COUNT(c.id)::int AS chapters
                   FROM "subjects" s LEFT JOIN "chapters" c ON c.subject_id = s.id
                  GROUP BY s.id ORDER BY s.position, s.name`)
    return ApiResponse.success(res, { rows: rows.map((r) => ({ ...r, chapters: num(r.chapters) })) })
  } catch (err) { next(err) }
}

// GET /api/admin/content/chapters?subject=<slug|id>&class=
async function chapters(req, res, next) {
  try {
    const { subject } = req.query
    const klass = req.query.class ? parseInt(req.query.class, 10) : null
    const conds = []
    const params = []
    const bind = (v) => { params.push(v); return `$${params.length}` }
    if (subject) conds.push(`s.slug = ${bind(subject)}`)
    if (klass != null) conds.push(`c.class_level = ${bind(klass)}`)
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
    const rows = await q(
      `SELECT c.id::text AS id, c.name, c.slug, c.class_level AS "classLevel", c.position,
              s.name AS subject, s.slug AS "subjectSlug",
              (SELECT COUNT(*) FROM "sections" se WHERE se.chapter_id = c.id)::int AS sections,
              (SELECT COUNT(*) FROM "subtopics" st WHERE st.chapter_id = c.id)::int AS subtopics
         FROM "chapters" c JOIN "subjects" s ON s.id = c.subject_id
        ${where}
        ORDER BY s.position, c.position, c.name LIMIT 500`,
      ...params,
    )
    return ApiResponse.success(res, { rows })
  } catch (err) { next(err) }
}

// GET /api/admin/content/mock-tests?subject=
async function mockTests(req, res, next) {
  try {
    const subject = req.query.subject
    const rows = subject
      ? await q(`SELECT id, subject, name, duration_min AS "durationMin", question_count AS "questionCount",
                        section_count AS "sectionCount", created_at AS "createdAt"
                   FROM "mock_tests" WHERE subject = $1 ORDER BY id DESC`, subject)
      : await q(`SELECT id, subject, name, duration_min AS "durationMin", question_count AS "questionCount",
                        section_count AS "sectionCount", created_at AS "createdAt"
                   FROM "mock_tests" ORDER BY id DESC LIMIT 300`)
    return ApiResponse.success(res, { rows: rows.map((r) => ({ ...r, questionCount: num(r.questionCount), durationMin: num(r.durationMin) })) })
  } catch (err) { next(err) }
}

// ─── Brain Gym question bank — real draft/active/archived workflow ─────────────

// GET /api/admin/content/braingym-questions?status=&grade=&category=&search=&page=
async function brainGymQuestions(req, res, next) {
  try {
    const { status, grade, category, search } = req.query
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 100)
    const conds = []
    const params = []
    const bind = (v) => { params.push(v); return `$${params.length}` }
    if (status) conds.push(`status = ${bind(status)}`)
    if (grade) conds.push(`grade = ${bind(grade)}`)
    if (category) conds.push(`category = ${bind(category)}`)
    if (search) conds.push(`"questionText" ILIKE ${bind(`%${search}%`)}`)
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
    const offset = (page - 1) * pageSize

    const countRow = await q(`SELECT COUNT(*)::int AS n FROM "generated_questions" ${where}`, ...params)
    const total = num(countRow && countRow[0] && countRow[0].n)
    const rows = await q(
      `SELECT id::text AS id, category, grade, subject, chapter, difficulty, "questionText", answer,
              status, "qualityScore", "validationScore", "timesServed", "timesCorrect", "timesWrong",
              "createdAt"
         FROM "generated_questions" ${where}
        ORDER BY "createdAt" DESC LIMIT ${pageSize} OFFSET ${offset}`,
      ...params,
    )
    return ApiResponse.success(res, { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) })
  } catch (err) { next(err) }
}

// PATCH /api/admin/content/braingym-questions/:id/status  { status }  (content.edit)
const BG_STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED', 'REJECTED']
async function setBrainGymStatus(req, res, next) {
  try {
    const id = req.params.id
    const status = String(req.body.status || '').toUpperCase()
    if (!BG_STATUSES.includes(status)) throw new AppError(`status must be one of ${BG_STATUSES.join(', ')}`, 422)

    const rows = await db.$queryRawUnsafe(`SELECT status, "questionText" FROM "generated_questions" WHERE id = $1::uuid LIMIT 1`, id)
    const cur = rows && rows[0]
    if (!cur) throw new AppError('Question not found', 404)

    await db.$executeRawUnsafe(`UPDATE "generated_questions" SET status = $2, "updatedAt" = now() WHERE id = $1::uuid`, id, status)
    await audit.record(req, {
      module: 'content', action: 'braingym.status', targetType: 'generated_question', targetId: id,
      targetLabel: String(cur.questionText || '').slice(0, 80), before: { status: cur.status }, after: { status },
    })
    return ApiResponse.success(res, { id, status }, 'Status updated')
  } catch (err) { next(err) }
}

module.exports = { overview, subjects, chapters, mockTests, brainGymQuestions, setBrainGymStatus }
