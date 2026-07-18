'use strict'

// Admin management of Mock Tests — the same mock_tests / mock_test_questions rows the
// Student Practice → Mock Tests flow reads. Draft/published/archived + soft delete, with
// STUDENT-HISTORY PROTECTION: a published test that already has attempts can't be
// structurally edited or hard-deleted — you duplicate it into a new draft version instead.
// (mock_tests.id is a bare integer PK with no sequence, so new ids are MAX(id)+1.)

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')

const STATUSES = ['draft', 'published', 'archived']
const int = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : parseInt(v, 10))

const TEST_COLS = `t.id, t.subject, t.name, t.class_level AS "classLevel", t.status, t.difficulty, t.board, t.chapter,
  t.duration_min AS "durationMin", t.question_count AS "questionCount", t.section_count AS "sectionCount",
  t.instruction, t.created_by_name AS "createdByName", t.created_at AS "createdAt", t.updated_at AS "updatedAt"`

async function loadTestOr404(id) {
  const [t] = await db.$queryRawUnsafe(`SELECT * FROM mock_tests WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, int(id))
  if (!t) throw new AppError('Test not found', 404)
  return t
}
async function attemptCount(id) {
  const [r] = await db.$queryRawUnsafe(`SELECT count(*)::int AS n FROM mock_test_attempts WHERE test_id = $1`, int(id))
  return (r && r.n) || 0
}
// Guard structural edits: a live test with real attempts is immutable — version it instead.
async function assertEditable(test) {
  if (test.status === 'published' && (await attemptCount(test.id)) > 0) {
    throw new AppError('This test already has student attempts. Duplicate it to create a new version.', 409, 'HAS_ATTEMPTS')
  }
}
async function recountQuestions(exec, id) {
  await exec.$executeRawUnsafe(
    `UPDATE mock_tests SET question_count = (SELECT count(*) FROM mock_test_questions WHERE test_id = $1),
       no_of_questions = (SELECT count(*) FROM mock_test_questions WHERE test_id = $1),
       section_count = GREATEST(1, (SELECT count(DISTINCT section_id) FROM mock_test_questions WHERE test_id = $1)),
       updated_at = now() WHERE id = $1`, int(id))
}

// Concurrency-safe next id for admin-created tests. mock_tests.id is a bare integer PK
// (mirrors source testPaperIDs, no DEFAULT), so two concurrent MAX(id)+1 could collide.
// A dedicated sequence is atomic; GREATEST keeps it ahead of any out-of-band import
// without ever reusing or renumbering an existing id.
async function nextTestId(exec) {
  await exec.$executeRawUnsafe(`SELECT setval('mock_tests_admin_id_seq', GREATEST((SELECT last_value FROM mock_tests_admin_id_seq),(SELECT COALESCE(MAX(id),0) FROM mock_tests)))`)
  const [r] = await exec.$queryRawUnsafe(`SELECT nextval('mock_tests_admin_id_seq')::int AS id`)
  return r.id
}

// ─── GET /api/admin/tests ─────────────────────────────────────────────────────
async function list(req, res, next) {
  try {
    const { status, subject, search } = req.query
    const cls = int(req.query.class)
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 100)
    const conds = ['t.deleted_at IS NULL']; const p = []; const bind = (v) => { p.push(v); return `$${p.length}` }
    if (status && STATUSES.includes(status)) conds.push(`t.status = ${bind(status)}`)
    if (subject) conds.push(`t.subject ILIKE ${bind(`%${subject}%`)}`)
    if (cls != null) conds.push(`t.class_level = ${bind(cls)}`)
    if (search) conds.push(`(t.name ILIKE ${bind(`%${search}%`)} OR t.subject ILIKE $${p.length} OR CAST(t.id AS text) = ${bind(String(search).trim())})`)
    const where = `WHERE ${conds.join(' AND ')}`
    const [cnt] = await db.$queryRawUnsafe(`SELECT count(*)::int AS n FROM mock_tests t ${where}`, ...p)
    const total = (cnt && cnt.n) || 0
    const rows = await db.$queryRawUnsafe(
      `SELECT ${TEST_COLS}, COALESCE(a.attempts, 0)::int AS "attemptCount", a.avg_score AS "avgScore"
         FROM mock_tests t
         LEFT JOIN (SELECT test_id, count(*)::int AS attempts, AVG(score)::float AS avg_score FROM mock_test_attempts GROUP BY test_id) a ON a.test_id = t.id
         ${where} ORDER BY t.updated_at DESC NULLS LAST, t.id DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      ...p)
    return ApiResponse.success(res, { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) })
  } catch (e) { next(e) }
}

// ─── GET /api/admin/tests/subjects — subject list for the Student-style browse ────
// One row per subject with per-status counts + a representative class, so the admin Tests
// tab opens on Subjects (exactly like the student Mock Tests flow) instead of a flat list.
async function subjects(req, res, next) {
  try {
    const cls = int(req.query.class)
    // Class-scoped: when ?class is given, only subjects that have tests for THAT class, and all
    // counts are scoped to that class (never global). Without ?class it stays global (compat).
    const rows = await db.$queryRawUnsafe(
      `SELECT COALESCE(NULLIF(trim(subject), ''), 'General') AS name,
              count(*)::int AS total,
              count(*) FILTER (WHERE status = 'published')::int AS published,
              count(*) FILTER (WHERE status = 'draft')::int AS draft,
              count(*) FILTER (WHERE status = 'archived')::int AS archived,
              max(class_level)::int AS "classLevel"
         FROM mock_tests
        WHERE deleted_at IS NULL ${cls != null ? 'AND class_level = $1' : ''}
        GROUP BY 1
        ORDER BY 1 ASC`, ...(cls != null ? [cls] : []))
    return ApiResponse.success(res, { subjects: rows })
  } catch (e) { next(e) }
}

// ─── GET /api/admin/tests/classes — distinct classes that actually have tests ─────
async function classes(req, res, next) {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT DISTINCT class_level::int AS n FROM mock_tests
        WHERE deleted_at IS NULL AND class_level IS NOT NULL AND class_level BETWEEN 1 AND 12
        ORDER BY n`)
    return ApiResponse.success(res, { classes: rows.map((r) => r.n) })
  } catch (e) { next(e) }
}

// ─── GET /api/admin/tests/:id (detail + questions + attempts) ─────────────────
async function get(req, res, next) {
  try {
    const t = await loadTestOr404(req.params.id)
    const [meta] = await db.$queryRawUnsafe(
      `SELECT ${TEST_COLS}, COALESCE(a.attempts,0)::int AS "attemptCount", a.avg_score AS "avgScore"
         FROM mock_tests t LEFT JOIN (SELECT test_id, count(*)::int AS attempts, AVG(score)::float AS avg_score FROM mock_test_attempts WHERE test_id=$1 GROUP BY test_id) a ON a.test_id=t.id
        WHERE t.id = $1`, int(req.params.id))
    const questions = await db.$queryRawUnsafe(
      `SELECT id, order_index AS "orderIndex", section_name AS "sectionName", section_id AS "sectionId",
              question, options, correct_index AS "correctIndex", explanation
         FROM mock_test_questions WHERE test_id = $1 ORDER BY order_index`, int(req.params.id))
    return ApiResponse.success(res, { test: meta, questions, editable: !(t.status === 'published' && (await attemptCount(t.id)) > 0) })
  } catch (e) { next(e) }
}

// ─── POST /api/admin/tests ────────────────────────────────────────────────────
async function create(req, res, next) {
  try {
    const b = req.body || {}
    if (!b.name || !String(b.name).trim()) throw new AppError('A test title is required', 422)
    const id = await db.$transaction(async (tx) => {
      const newId = await nextTestId(tx)
      await tx.$executeRawUnsafe(
        `INSERT INTO mock_tests (id, subject, name, class_level, status, difficulty, board, chapter, duration_min, instruction,
                                 no_of_questions, section_count, question_count, created_by, created_by_name, created_at, updated_at)
         VALUES ($1,$2,$3,$4,'draft',$5,$6,$7,$8,$9,0,1,0,$10::uuid,$11, now(), now())`,
        newId, b.subject || '', String(b.name).trim(), int(b.classLevel), b.difficulty || null, b.board || null, b.chapter || null,
        int(b.durationMin) || 30, b.instruction || '', req.admin.id, req.admin.name)
      return newId
    })
    await audit.record(req, { module: 'tests', action: 'create', targetType: 'mock_test', targetId: String(id), targetLabel: String(b.name) })
    const [meta] = await db.$queryRawUnsafe(`SELECT ${TEST_COLS} FROM mock_tests t WHERE t.id = $1`, id)
    return ApiResponse.created(res, { test: { ...meta, attemptCount: 0, avgScore: null } })
  } catch (e) { next(e) }
}

// ─── PATCH /api/admin/tests/:id ───────────────────────────────────────────────
// Metadata edits are safe after attempts (attempts snapshot their own answers/score, so
// old results stay valid). The ONLY exception: the SCOPING fields subject + class decide
// which students see the test, so once attempts exist they're locked — retarget by
// duplicating. Everything else (title, difficulty, board, chapter, instructions, duration)
// stays editable.
async function update(req, res, next) {
  try {
    const t = await loadTestOr404(req.params.id)
    const changesSubject = req.body.subject !== undefined && String(req.body.subject) !== String(t.subject || '')
    const changesClass = req.body.classLevel !== undefined && int(req.body.classLevel) !== (t.class_level ?? null)
    if ((changesSubject || changesClass) && (await attemptCount(t.id)) > 0) {
      throw new AppError('This test has student attempts — its class and subject are locked. Duplicate it to re-target a new version.', 409, 'HAS_ATTEMPTS')
    }
    const map = { name: 'name', subject: 'subject', difficulty: 'difficulty', board: 'board', chapter: 'chapter', instruction: 'instruction' }
    const sets = []; const p = []; const bind = (v) => { p.push(v); return `$${p.length}` }
    for (const [k, col] of Object.entries(map)) if (req.body[k] !== undefined) sets.push(`${col} = ${bind(req.body[k])}`)
    if (req.body.classLevel !== undefined) sets.push(`class_level = ${bind(int(req.body.classLevel))}`)
    if (req.body.durationMin !== undefined) sets.push(`duration_min = ${bind(int(req.body.durationMin) || 30)}`)
    if (req.body.name !== undefined && !String(req.body.name).trim()) throw new AppError('Title cannot be empty', 422)
    if (!sets.length) throw new AppError('Nothing to update', 400)
    sets.push('updated_at = now()')
    await db.$executeRawUnsafe(`UPDATE mock_tests SET ${sets.join(', ')} WHERE id = ${bind(int(req.params.id))}`, ...p)
    await audit.record(req, { module: 'tests', action: 'update', targetType: 'mock_test', targetId: String(t.id), targetLabel: t.name })
    const [meta] = await db.$queryRawUnsafe(`SELECT ${TEST_COLS} FROM mock_tests t WHERE t.id = $1`, int(req.params.id))
    return ApiResponse.success(res, { test: meta })
  } catch (e) { next(e) }
}

// ─── POST /api/admin/tests/:id/status ─────────────────────────────────────────
async function transition(req, res, next) {
  try {
    const t = await loadTestOr404(req.params.id)
    const status = String(req.body.status || '')
    if (!STATUSES.includes(status)) throw new AppError(`status must be one of ${STATUSES.join(', ')}`, 422)
    if (status === 'published') {
      const [qc] = await db.$queryRawUnsafe(`SELECT count(*)::int AS n FROM mock_test_questions WHERE test_id = $1`, t.id)
      if (!qc.n) throw new AppError('Add at least one question before publishing.', 422, 'NO_QUESTIONS')
    }
    await db.$executeRawUnsafe(`UPDATE mock_tests SET status = $2, updated_at = now() WHERE id = $1`, t.id, status)
    await audit.record(req, { module: 'tests', action: `status.${status}`, targetType: 'mock_test', targetId: String(t.id), targetLabel: t.name, before: { status: t.status }, after: { status } })
    const [meta] = await db.$queryRawUnsafe(`SELECT ${TEST_COLS} FROM mock_tests t WHERE t.id = $1`, t.id)
    return ApiResponse.success(res, { test: meta }, `Moved to ${status}`)
  } catch (e) { next(e) }
}

// ─── POST /api/admin/tests/:id/duplicate (new DRAFT; no attempts copied) ──────
async function duplicate(req, res, next) {
  try {
    const t = await loadTestOr404(req.params.id)
    const newId = await db.$transaction(async (tx) => {
      const nid = await nextTestId(tx)
      await tx.$executeRawUnsafe(
        `INSERT INTO mock_tests (id, subject, name, class_level, status, difficulty, board, chapter, duration_min, instruction,
                                 no_of_questions, section_count, question_count, category_full_name, created_by, created_by_name, created_at, updated_at)
         SELECT $1, subject, name || ' (copy)', class_level, 'draft', difficulty, board, chapter, duration_min, instruction,
                no_of_questions, section_count, question_count, category_full_name, $2::uuid, $3, now(), now()
           FROM mock_tests WHERE id = $4`, nid, req.admin.id, req.admin.name, t.id)
      await tx.$executeRawUnsafe(
        `INSERT INTO mock_test_questions (test_id, id, order_index, section_name, section_id, question, question_raw, options, correct_option_ids, correct_option_texts, correct_index, explanation)
         SELECT $1, id, order_index, section_name, section_id, question, question_raw, options, correct_option_ids, correct_option_texts, correct_index, explanation
           FROM mock_test_questions WHERE test_id = $2`, nid, t.id)
      return nid
    })
    await audit.record(req, { module: 'tests', action: 'duplicate', targetType: 'mock_test', targetId: String(newId), targetLabel: `${t.name} (copy)`, before: { source: t.id } })
    const [meta] = await db.$queryRawUnsafe(`SELECT ${TEST_COLS} FROM mock_tests t WHERE t.id = $1`, newId)
    return ApiResponse.created(res, { test: { ...meta, attemptCount: 0, avgScore: null } })
  } catch (e) { next(e) }
}

// ─── DELETE /api/admin/tests/:id (BLOCKED when attempts exist) ────────────────
async function remove(req, res, next) {
  try {
    const t = await loadTestOr404(req.params.id)
    if ((await attemptCount(t.id)) > 0) {
      throw new AppError('This test has student attempts and cannot be permanently deleted. Archive it instead.', 409, 'HAS_ATTEMPTS')
    }
    await db.$executeRawUnsafe(`UPDATE mock_tests SET deleted_at = now() WHERE id = $1`, t.id)
    await audit.record(req, { module: 'tests', action: 'delete', targetType: 'mock_test', targetId: String(t.id), targetLabel: t.name })
    return ApiResponse.success(res, { id: t.id }, 'Removed')
  } catch (e) { next(e) }
}

// ── Question validation + shaping ──────────────────────────────────────────────
// Questions/options may carry an image (diagram). The question image is embedded as <img>
// in the question text column (no schema change); option images are kept structured in the
// options jsonb ({ id, text, image, is_correct }). Back-compatible: string options + no image.
const stripImg = (html) => String(html || '')
  .replace(/<p[^>]*>\s*<img[^>]*>\s*<\/p>/gi, '')
  .replace(/<img[^>]*>/gi, '')
  .replace(/<p[^>]*>\s*<\/p>/gi, '')
  .trim()
const withImage = (base, url) => {
  const b = stripImg(base)
  if (!url) return b
  const img = `<p style="text-align:center;margin:8px 0"><img src="${String(url).replace(/"/g, '&quot;')}" style="max-width:100%;height:auto" /></p>`
  return b ? `${b}${img}` : img
}

function shapeQuestion(b) {
  const qText = String(b.question || '').trim()
  const qImage = b.questionImage ? String(b.questionImage).trim() : null
  if (!qText && !qImage) throw new AppError('Question text or image is required', 422)
  const opts = (Array.isArray(b.options) ? b.options : []).map((o) => (
    o && typeof o === 'object'
      ? { text: String(o.text == null ? '' : o.text).trim(), image: o.image ? String(o.image).trim() : null }
      : { text: String(o == null ? '' : o).trim(), image: null }
  ))
  if (opts.length < 2) throw new AppError('At least 2 options are required', 422)
  if (opts.some((o) => !o.text && !o.image)) throw new AppError('Options cannot be blank (add text or an image)', 422)
  const correctIndex = int(b.correctIndex)
  if (correctIndex == null || correctIndex < 0 || correctIndex >= opts.length) throw new AppError('The correct answer must be one of the options', 422)
  const question = withImage(qText, qImage)
  const options = opts.map((o, i) => ({ id: i + 1, text: o.text, image: o.image || null, is_correct: i === correctIndex }))
  const correctText = opts[correctIndex].text || (opts[correctIndex].image ? '[image]' : '')
  return { question, options, correctIndex, correctOptionIds: [correctIndex + 1], correctOptionTexts: [correctText], explanation: String(b.explanation || '').trim() }
}

// ─── POST /api/admin/tests/:id/questions ──────────────────────────────────────
async function addQuestion(req, res, next) {
  try {
    const t = await loadTestOr404(req.params.id)
    await assertEditable(t)
    const q = shapeQuestion(req.body)
    const newId = await db.$transaction(async (tx) => {
      const [n] = await tx.$queryRawUnsafe(`SELECT COALESCE(MAX(id),0)+1 AS id, COALESCE(MAX(order_index),-1)+1 AS ord FROM mock_test_questions WHERE test_id = $1`, t.id)
      await tx.$executeRawUnsafe(
        `INSERT INTO mock_test_questions (test_id, id, order_index, section_name, section_id, question, options, correct_index, correct_option_ids, correct_option_texts, explanation)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9::jsonb,$10::jsonb,$11)`,
        t.id, n.id, n.ord, req.body.sectionName || 'Section A', int(req.body.sectionId) || 1, q.question,
        JSON.stringify(q.options), q.correctIndex, JSON.stringify(q.correctOptionIds), JSON.stringify(q.correctOptionTexts), q.explanation)
      await recountQuestions(tx, t.id)
      return n.id
    })
    await audit.record(req, { module: 'tests', action: 'question.add', targetType: 'mock_test', targetId: String(t.id), targetLabel: t.name })
    return ApiResponse.created(res, { id: newId })
  } catch (e) { next(e) }
}

// ─── PATCH /api/admin/tests/:id/questions/:qid ────────────────────────────────
async function updateQuestion(req, res, next) {
  try {
    const t = await loadTestOr404(req.params.id)
    await assertEditable(t)
    const q = shapeQuestion(req.body)
    const r = await db.$executeRawUnsafe(
      `UPDATE mock_test_questions SET question=$3, options=$4::jsonb, correct_index=$5, correct_option_ids=$6::jsonb, correct_option_texts=$7::jsonb, explanation=$8
        WHERE test_id=$1 AND id=$2`,
      t.id, int(req.params.qid), q.question, JSON.stringify(q.options), q.correctIndex, JSON.stringify(q.correctOptionIds), JSON.stringify(q.correctOptionTexts), q.explanation)
    if (!r) throw new AppError('Question not found', 404)
    await db.$executeRawUnsafe(`UPDATE mock_tests SET updated_at=now() WHERE id=$1`, t.id)
    return ApiResponse.success(res, { id: int(req.params.qid) })
  } catch (e) { next(e) }
}

// ─── POST /api/admin/tests/:id/questions/:qid/duplicate ───────────────────────
async function duplicateQuestion(req, res, next) {
  try {
    const t = await loadTestOr404(req.params.id)
    await assertEditable(t)
    const newId = await db.$transaction(async (tx) => {
      const [n] = await tx.$queryRawUnsafe(`SELECT COALESCE(MAX(id),0)+1 AS id, COALESCE(MAX(order_index),-1)+1 AS ord FROM mock_test_questions WHERE test_id = $1`, t.id)
      const done = await tx.$executeRawUnsafe(
        `INSERT INTO mock_test_questions (test_id, id, order_index, section_name, section_id, question, question_raw, options, correct_option_ids, correct_option_texts, correct_index, explanation)
         SELECT $1, $2, $3, section_name, section_id, question, question_raw, options, correct_option_ids, correct_option_texts, correct_index, explanation
           FROM mock_test_questions WHERE test_id = $1 AND id = $4`, t.id, n.id, n.ord, int(req.params.qid))
      if (!done) throw new AppError('Question not found', 404)
      await recountQuestions(tx, t.id)
      return n.id
    })
    return ApiResponse.created(res, { id: newId })
  } catch (e) { next(e) }
}

// ─── POST /api/admin/tests/:id/questions/reorder  { orderedIds:[] } ───────────
async function reorderQuestions(req, res, next) {
  try {
    const t = await loadTestOr404(req.params.id)
    await assertEditable(t)
    const ids = req.body.orderedIds
    if (!Array.isArray(ids) || !ids.length) throw new AppError('orderedIds must be a non-empty array', 422)
    await db.$transaction(ids.map((qid, i) => db.$executeRawUnsafe(`UPDATE mock_test_questions SET order_index=$3 WHERE test_id=$1 AND id=$2`, t.id, int(qid), i)))
    await db.$executeRawUnsafe(`UPDATE mock_tests SET updated_at=now() WHERE id=$1`, t.id)
    return ApiResponse.success(res, { reordered: ids.length }, 'Order updated')
  } catch (e) { next(e) }
}

// ─── DELETE /api/admin/tests/:id/questions/:qid ───────────────────────────────
async function removeQuestion(req, res, next) {
  try {
    const t = await loadTestOr404(req.params.id)
    await assertEditable(t)
    await db.$transaction(async (tx) => {
      const r = await tx.$executeRawUnsafe(`DELETE FROM mock_test_questions WHERE test_id=$1 AND id=$2`, t.id, int(req.params.qid))
      if (!r) throw new AppError('Question not found', 404)
      await recountQuestions(tx, t.id)
    })
    return ApiResponse.success(res, { id: int(req.params.qid) }, 'Question removed')
  } catch (e) { next(e) }
}

module.exports = { list, subjects, classes, get, create, update, transition, duplicate, remove, addQuestion, updateQuestion, duplicateQuestion, reorderQuestions, removeQuestion }
