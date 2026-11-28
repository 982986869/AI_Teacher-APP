'use strict'
// The teacher dashboard and homework, against the DB. createTeachingService(db) for
// tests; `teachingService` is bound to the real Prisma client.
//
// Ownership is the whole security story here, so it lives in the SQL, not in the
// controller: every teacher query is filtered by `teacher_id = <the logged-in teacher>`,
// every student query by `student_id = <the logged-in student>`. A wrong id therefore
// answers "not found" — never someone else's child, lesson or room link.

const realDb = require('../../config/database')
const { AppError } = require('../../middleware/errorHandler')
const { buildDashboard, weekWindow, istDateKey, lessonOut } = require('./dashboard')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TITLE_MAX = 120
const DETAILS_MAX = 2000
const NOTE_MAX = 4000
const IMAGES_MAX = 5

const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v)

// A calendar date 'YYYY-MM-DD' that really exists (no 2026-02-30).
function validDate(v) {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false
  const d = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

// Homework fields from a request body → { title, details, dueOn } or an AppError.
// `partial`: an edit may send only some fields. A due date may not be in the past
// (IST), except that an edit may keep an existing past date untouched.
function cleanHomework(body = {}, { partial = false, now = new Date() } = {}) {
  const out = {}
  if (!partial || body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.replace(/\s+/g, ' ').trim() : ''
    if (!title) throw new AppError('Give the homework a title.', 422)
    if (title.length > TITLE_MAX) throw new AppError(`The title can be at most ${TITLE_MAX} characters.`, 422)
    out.title = title
  }
  if (!partial || body.details !== undefined) {
    const details = typeof body.details === 'string' ? body.details.trim() : ''
    if (details.length > DETAILS_MAX) throw new AppError(`The details can be at most ${DETAILS_MAX} characters.`, 422)
    out.details = details
  }
  if (!partial || body.dueOn !== undefined) {
    if (!validDate(body.dueOn)) throw new AppError('Pick a due date.', 422)
    if (body.dueOn < istDateKey(now)) throw new AppError('The due date cannot be in the past.', 422)
    out.dueOn = body.dueOn
  }
  return out
}

// Photos on homework are URLs of files this server stored (POST /api/homework/upload →
// uploads/homework/…). Anything else — another site, another upload folder — is refused,
// so a teacher or student can never make the other side's app load an outside URL.
function cleanImages(list, prefix) {
  if (list === undefined) return undefined
  if (!Array.isArray(list)) throw new AppError('Photos must be a list.', 422)
  const out = []
  for (const u of list) {
    // Exactly the names storage.js gives an upload — 32 random hex characters + an image
    // extension — so no "../", no sub-folders, nothing else in the uploads folder.
    if (typeof u !== 'string' || !u.startsWith(prefix) || !/^[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif)$/.test(u.slice(prefix.length))) {
      throw new AppError('A photo was not uploaded through the app. Add it again.', 422)
    }
    if (!out.includes(u)) out.push(u)
  }
  if (out.length > IMAGES_MAX) throw new AppError(`At most ${IMAGES_MAX} photos.`, 422)
  return out
}

const HW_COLS = `h.id::text AS id, h.assignment_id::text AS "assignmentId", h.title, h.details,
  to_char(h.due_on, 'YYYY-MM-DD') AS "dueOn", h.status, h.done_at AS "doneAt", h.created_at AS "createdAt",
  h.attachments, h.submission_note AS "submissionNote", h.submission_images AS "submissionImages",
  h.submitted_at AS "submittedAt", h.checked_at AS "checkedAt", h.teacher_comment AS "teacherComment",
  ta.subject, ta.class_level AS "classLevel"`

function hwOut(r, today) {
  return {
    id: r.id,
    assignmentId: r.assignmentId,
    title: r.title,
    details: r.details || '',
    dueOn: r.dueOn,
    status: r.status,
    doneAt: r.doneAt ? new Date(r.doneAt).toISOString() : null,
    givenAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    images: Array.isArray(r.attachments) ? r.attachments : [],          // the teacher's photos
    // The student's work. Kept after an undo (as a draft), but only "submitted" with a date.
    submission: (r.submittedAt || r.submissionNote || (Array.isArray(r.submissionImages) && r.submissionImages.length))
      ? { note: r.submissionNote || '', images: Array.isArray(r.submissionImages) ? r.submissionImages : [], submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString() : null }
      : null,
    checkedAt: r.checkedAt ? new Date(r.checkedAt).toISOString() : null,
    teacherComment: r.teacherComment || '',
    overdue: r.status !== 'done' && r.dueOn < today,
    subject: r.subject,
    classLevel: r.classLevel != null ? Number(r.classLevel) : null,
    ...(r.studentName !== undefined ? { studentName: r.studentName } : {}),
    ...(r.teacherName !== undefined ? { teacherName: r.teacherName } : {}),
  }
}

function createTeachingService(db, { uploadsPrefix } = {}) {
  // Where this server's homework photos live (see cleanImages).
  const prefix = uploadsPrefix || `${require('../../config/env').config.publicUrl}/uploads/homework/`

  // ── dashboard ─────────────────────────────────────────────────────────────────
  async function dashboard(teacherId, now = new Date()) {
    const { from, to } = weekWindow(now)
    const pairs = await db.$queryRawUnsafe(
      `SELECT ta.id::text AS "assignmentId", ta.student_id::text AS "studentId", u.name AS "studentName",
              ta.class_level AS "classLevel", ta.subject, ta.room_link AS "roomLink",
              (SELECT min(s.starts_at) FROM sessions s
                WHERE s.assignment_id = ta.id AND s.teacher_id = ta.teacher_id AND s.deleted_at IS NULL
                  AND s.status = 'scheduled' AND (s.starts_at + make_interval(mins => s.duration_min)) > $2
              ) AS "nextLessonAt"
         FROM teacher_assignments ta JOIN users u ON u.id = ta.student_id
        WHERE ta.teacher_id = $1::uuid AND ta.status = 'active'
        ORDER BY lower(u.name), lower(ta.subject)`, teacherId, now)

    const LESSON = `s.id::text AS id, s.assignment_id::text AS "assignmentId", s.subject, s.class_level AS "classLevel",
              s.starts_at AS "startsAt", (s.starts_at + make_interval(mins => s.duration_min)) AS "endsAt",
              s.duration_min AS "durationMin", u.name AS "studentName", COALESCE(ta.room_link, s.meeting_link) AS "roomLink"
         FROM sessions s
         LEFT JOIN teacher_assignments ta ON ta.id = s.assignment_id
         LEFT JOIN users u ON u.id = ta.student_id`
    const lessons = await db.$queryRawUnsafe(
      `SELECT ${LESSON}
        WHERE s.teacher_id = $1::uuid AND s.deleted_at IS NULL AND s.status IN ('scheduled', 'completed')
          AND s.starts_at < $3 AND (s.starts_at + make_interval(mins => s.duration_min)) > $2
        ORDER BY s.starts_at`, teacherId, from, to)
    // The next lesson may be after this week.
    const [nextRow] = await db.$queryRawUnsafe(
      `SELECT ${LESSON}
        WHERE s.teacher_id = $1::uuid AND s.deleted_at IS NULL AND s.status = 'scheduled'
          AND (s.starts_at + make_interval(mins => s.duration_min)) > $2
        ORDER BY s.starts_at LIMIT 1`, teacherId, now)

    return buildDashboard({ now, pairs, lessons, nextRow: nextRow || null })
  }

  // ── homework: the teacher's side ─────────────────────────────────────────────
  // The teacher's ACTIVE pair, or a 404 (someone else's pair looks exactly like none).
  async function ownPair(teacherId, assignmentId) {
    if (!isUuid(assignmentId)) throw new AppError('Choose one of your students.', 422)
    const [p] = await db.$queryRawUnsafe(
      `SELECT id FROM teacher_assignments WHERE id = $1::uuid AND teacher_id = $2::uuid AND status = 'active'`,
      assignmentId, teacherId)
    if (!p) throw new AppError('That student is not one of yours.', 404)
    return assignmentId
  }

  async function listHomework(teacherId, { assignmentId } = {}, now = new Date()) {
    const p = [teacherId]
    let extra = ''
    if (assignmentId !== undefined) {
      if (!isUuid(assignmentId)) throw new AppError('Choose one of your students.', 422)
      p.push(assignmentId); extra = ` AND h.assignment_id = $${p.length}::uuid`
    }
    const rows = await db.$queryRawUnsafe(
      `SELECT ${HW_COLS}, u.name AS "studentName"
         FROM homework h JOIN teacher_assignments ta ON ta.id = h.assignment_id JOIN users u ON u.id = ta.student_id
        WHERE ta.teacher_id = $1::uuid AND h.deleted_at IS NULL${extra}
        ORDER BY (h.status = 'done'), h.due_on, h.created_at`, ...p)
    const today = istDateKey(now)
    return rows.map((r) => hwOut(r, today))
  }

  async function giveHomework(teacherId, body = {}, now = new Date()) {
    const assignmentId = await ownPair(teacherId, body.assignmentId)
    const hw = cleanHomework(body, { now })
    const images = cleanImages(body.images, prefix) || []
    const [row] = await db.$queryRawUnsafe(
      `INSERT INTO homework (assignment_id, title, details, due_on, created_by, attachments)
       VALUES ($1::uuid, $2, $3, $4::date, $5::uuid, $6::jsonb) RETURNING id::text AS id`,
      assignmentId, hw.title, hw.details, hw.dueOn, teacherId, JSON.stringify(images))
    return (await listHomework(teacherId, { assignmentId }, now)).find((h) => h.id === row.id)
  }

  // Edit or (with { delete: true }) remove one of the teacher's own homework items.
  async function editHomework(teacherId, id, body = {}, now = new Date()) {
    if (!isUuid(id)) throw new AppError('Homework not found.', 404)
    const [own] = await db.$queryRawUnsafe(
      `SELECT h.id, to_char(h.due_on, 'YYYY-MM-DD') AS "dueOn" FROM homework h JOIN teacher_assignments ta ON ta.id = h.assignment_id
        WHERE h.id = $1::uuid AND ta.teacher_id = $2::uuid AND h.deleted_at IS NULL`, id, teacherId)
    if (!own) throw new AppError('Homework not found.', 404)
    if (body.delete === true) {
      await db.$executeRawUnsafe(`UPDATE homework SET deleted_at = now(), updated_at = now() WHERE id = $1::uuid`, id)
      return { id, deleted: true }
    }
    // Keeping an existing (now past) due date is fine; only a NEW date must not be past.
    const b = { ...body }
    if (b.dueOn !== undefined && b.dueOn === own.dueOn) delete b.dueOn
    const hw = cleanHomework(b, { partial: true, now })
    const images = cleanImages(body.images, prefix)
    if (!Object.keys(hw).length && images === undefined) throw new AppError('Nothing to change.', 422)
    await db.$executeRawUnsafe(
      `UPDATE homework SET title = COALESCE($2, title), details = COALESCE($3, details),
              due_on = COALESCE($4::date, due_on), attachments = COALESCE($5::jsonb, attachments), updated_at = now()
        WHERE id = $1::uuid`, id, hw.title ?? null, hw.details ?? null, hw.dueOn ?? null, images === undefined ? null : JSON.stringify(images))
    return (await listHomework(teacherId, {}, now)).find((h) => h.id === id)
  }

  // The teacher marks a homework checked (with an optional comment), or un-checks it.
  async function checkHomework(teacherId, id, body = {}, now = new Date()) {
    if (!isUuid(id)) throw new AppError('Homework not found.', 404)
    const comment = typeof body.comment === 'string' ? body.comment.trim() : ''
    if (comment.length > DETAILS_MAX) throw new AppError(`The comment can be at most ${DETAILS_MAX} characters.`, 422)
    const uncheck = body.uncheck === true
    const n = await db.$executeRawUnsafe(
      `UPDATE homework h SET checked_at = CASE WHEN $3 THEN NULL ELSE now() END,
              teacher_comment = CASE WHEN $3 THEN teacher_comment ELSE NULLIF($4, '') END, updated_at = now()
         FROM teacher_assignments ta
        WHERE h.id = $1::uuid AND ta.id = h.assignment_id AND ta.teacher_id = $2::uuid AND h.deleted_at IS NULL`,
      id, teacherId, uncheck, comment)
    if (!n) throw new AppError('Homework not found.', 404)
    return (await listHomework(teacherId, {}, now)).find((h) => h.id === id)
  }

  // "My class": each active pair with its homework counts.
  async function myClass(teacherId, now = new Date()) {
    const today = istDateKey(now)
    const rows = await db.$queryRawUnsafe(
      `SELECT ta.id::text AS "assignmentId", ta.student_id::text AS "studentId", u.name AS "studentName",
              ta.class_level AS "classLevel", ta.subject, ta.room_link AS "roomLink",
              count(h.id)::int AS given,
              count(h.id) FILTER (WHERE h.status = 'done')::int AS done,
              count(h.id) FILTER (WHERE h.status <> 'done' AND h.due_on < $2::date)::int AS overdue,
              (SELECT min(s.starts_at) FROM sessions s
                WHERE s.assignment_id = ta.id AND s.teacher_id = ta.teacher_id AND s.deleted_at IS NULL AND s.status = 'scheduled'
                  AND (s.starts_at + make_interval(mins => s.duration_min)) > $3) AS "nextLessonAt"
         FROM teacher_assignments ta
         JOIN users u ON u.id = ta.student_id
         LEFT JOIN homework h ON h.assignment_id = ta.id AND h.deleted_at IS NULL
        WHERE ta.teacher_id = $1::uuid AND ta.status = 'active'
        GROUP BY ta.id, u.name
        ORDER BY lower(u.name), lower(ta.subject)`, teacherId, today, now)
    return rows.map((r) => ({
      assignmentId: r.assignmentId,
      studentId: r.studentId,
      studentName: r.studentName,
      classLevel: Number(r.classLevel),
      subject: r.subject,
      roomLink: r.roomLink || null,
      nextLessonAt: r.nextLessonAt ? new Date(r.nextLessonAt).toISOString() : null,
      homework: { given: r.given, done: r.done, overdue: r.overdue },
    }))
  }

  // ── the student's classes: their teachers, room links, next class ─────────────
  // One row per ACTIVE pair of this student. The room link goes only to the student of
  // the pair (and the teacher) — filtered by student_id here, never by class.
  async function studentClasses(studentId, now = new Date()) {
    const rows = await db.$queryRawUnsafe(
      `SELECT ta.id::text AS "assignmentId", ta.subject, ta.class_level AS "classLevel", ta.room_link AS "roomLink",
              t.name AS "teacherName", nx.id::text AS "lessonId", nx.starts_at AS "startsAt", nx.duration_min AS "durationMin"
         FROM teacher_assignments ta
         JOIN users t ON t.id = ta.teacher_id
         LEFT JOIN LATERAL (
           SELECT s.id, s.starts_at, s.duration_min FROM sessions s
            WHERE s.assignment_id = ta.id AND s.teacher_id = ta.teacher_id AND s.deleted_at IS NULL AND s.status = 'scheduled'
              AND (s.starts_at + make_interval(mins => s.duration_min)) > $2
            ORDER BY s.starts_at LIMIT 1) nx ON true
        WHERE ta.student_id = $1::uuid AND ta.status = 'active'
        ORDER BY nx.starts_at NULLS LAST, lower(ta.subject)`, studentId, now)
    return rows.map((r) => ({
      assignmentId: r.assignmentId,
      subject: r.subject,
      classLevel: Number(r.classLevel),
      teacherName: r.teacherName,
      roomLink: r.roomLink || null,
      next: r.startsAt ? lessonOut({ id: r.lessonId, assignmentId: r.assignmentId, subject: r.subject, classLevel: r.classLevel, startsAt: r.startsAt, durationMin: r.durationMin, roomLink: r.roomLink }, now) : null,
    }))
  }

  // ── homework: the student's side ─────────────────────────────────────────────
  async function studentHomework(studentId, now = new Date()) {
    const rows = await db.$queryRawUnsafe(
      `SELECT ${HW_COLS}, t.name AS "teacherName"
         FROM homework h JOIN teacher_assignments ta ON ta.id = h.assignment_id JOIN users t ON t.id = ta.teacher_id
        WHERE ta.student_id = $1::uuid AND h.deleted_at IS NULL
        ORDER BY (h.status = 'done'), h.due_on, h.created_at`, studentId)
    const today = istDateKey(now)
    return rows.map((r) => hwOut(r, today))
  }

  // The student hands in their work: a note and/or photos. That also marks it done, and a
  // fresh hand-in clears an earlier check (the teacher looks again).
  async function submitHomework(studentId, id, body = {}, now = new Date()) {
    if (!isUuid(id)) throw new AppError('Homework not found.', 404)
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    if (note.length > NOTE_MAX) throw new AppError(`Your answer can be at most ${NOTE_MAX} characters.`, 422)
    const images = cleanImages(body.images || [], prefix)
    if (!note && !images.length) throw new AppError('Write your answer or add a photo of your work.', 422)
    const n = await db.$executeRawUnsafe(
      `UPDATE homework h SET status = 'done', done_at = now(), submission_note = NULLIF($3, ''),
              submission_images = $4::jsonb, submitted_at = now(), checked_at = NULL, teacher_comment = NULL, updated_at = now()
         FROM teacher_assignments ta
        WHERE h.id = $1::uuid AND ta.id = h.assignment_id AND ta.student_id = $2::uuid AND h.deleted_at IS NULL`,
      id, studentId, note, JSON.stringify(images))
    if (!n) throw new AppError('Homework not found.', 404)
    return (await studentHomework(studentId, now)).find((h) => h.id === id)
  }

  // Who may upload a homework photo: a teacher, or a student who has a teacher.
  async function mayUpload(userId, role) {
    if (role === 'teacher') return true
    const [row] = await db.$queryRawUnsafe(
      `SELECT 1 AS ok FROM teacher_assignments WHERE student_id = $1::uuid AND status = 'active' LIMIT 1`, userId)
    return !!row
  }

  // The student ticks their own homework done (or un-ticks it).
  async function markHomework(studentId, id, done, now = new Date()) {
    if (!isUuid(id)) throw new AppError('Homework not found.', 404)
    const n = await db.$executeRawUnsafe(
      `UPDATE homework h SET status = $3, done_at = CASE WHEN $3 = 'done' THEN now() ELSE NULL END,
              submitted_at = CASE WHEN $3 = 'done' THEN submitted_at ELSE NULL END, updated_at = now()
         FROM teacher_assignments ta
        WHERE h.id = $1::uuid AND ta.id = h.assignment_id AND ta.student_id = $2::uuid AND h.deleted_at IS NULL`,
      id, studentId, done ? 'done' : 'assigned')
    if (!n) throw new AppError('Homework not found.', 404)
    return (await studentHomework(studentId, now)).find((h) => h.id === id)
  }

  return { dashboard, listHomework, giveHomework, editHomework, checkHomework, myClass, studentClasses, studentHomework, submitHomework, markHomework, mayUpload }
}

module.exports = { createTeachingService, teachingService: createTeachingService(realDb), cleanHomework, cleanImages, validDate, IMAGES_MAX }
