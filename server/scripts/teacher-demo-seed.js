'use strict'
// Test data for the teacher dashboard, until the admin screens exist (LOCAL / staging
// only — it refuses a production-looking database unless --i-know).
//
//   node scripts/teacher-demo-seed.js --teacher t@example.com --students a@example.com,b@example.com
//        [--room https://meet.google.com/xxx-xxxx-xxx] [--subjects Science,Maths]
//   node scripts/teacher-demo-seed.js --teacher t@example.com --students ... --remove
//
// What it does, for existing accounts found by email:
//   - makes the teacher a teacher (account_type = 'teacher') — the same change the admin's
//     "Make teacher" button makes (PATCH /api/admin/users/:id/account-type)
//   - one pair per student (class from the student's profile, subject from --subjects),
//     each with a room link (--room, else a placeholder that opens a new Meet)
//   - lessons: one in 25 minutes, one earlier today (finished), one late tonight, and a
//     few across the week — so every part of the dashboard has something in it
//   - homework: one due soon, one done, one overdue
// --remove deletes the pairs (their homework goes with them) and the lessons it made.
// It does not undo "teacher": do that from the admin's user page.

try { require('dotenv').config() } catch (_) { /* optional */ }
const db = require('../src/config/database')
const { normalizeClass } = require('../src/services/personalization/scope')

const MARK = 'teacher-demo-seed' // sessions.description of the lessons this script makes
const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined }
const has = (name) => process.argv.includes(`--${name}`)

async function main() {
  const url = String(process.env.DATABASE_URL || '')
  if (!url) throw new Error('DATABASE_URL is not set')
  if (!/localhost|127\.0\.0\.1/.test(url) && !has('i-know')) {
    throw new Error('This is test data. DATABASE_URL is not local; pass --i-know only for a staging database.')
  }
  const teacherEmail = arg('teacher')
  const studentEmails = String(arg('students') || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!teacherEmail || !studentEmails.length) throw new Error('Usage: --teacher <email> --students <email,email>')
  const subjects = String(arg('subjects') || 'Science,Maths,English').split(',').map((s) => s.trim())
  const room = arg('room') || 'https://meet.google.com/new'
  if (!/^https:\/\//.test(room)) throw new Error('--room must be an https:// link')

  // --create <password>: make any missing account (local demo logins), with email+password
  // sign-in and a finished profile (students in Class 10) so they land straight in the app.
  const createPw = arg('create')
  const byEmail = async (email, kind, n) => {
    const find = () => db.$queryRawUnsafe(`SELECT id::text AS id, name, grade, account_type FROM users WHERE lower(email) = lower($1)`, email)
    let [u] = await find()
    if (!u && createPw) {
      const hash = await require('bcryptjs').hash(createPw, 12)
      const name = kind === 'teacher' ? 'Demo Teacher' : `Demo Student ${String.fromCharCode(65 + n)}`
      await db.$executeRawUnsafe(
        // Students get full access: a family with a teacher is on the paid plan, and a free
        // demo account would sit behind the "This is locked" sheet on Home.
        `INSERT INTO users (id, name, email, "passwordHash", grade, board, language, account_type, access_level, "updatedAt")
         VALUES (gen_random_uuid(), $1, lower($2), $3, $4, 'CBSE', 'English', 'student', 'full', now())`,
        name, email, hash, kind === 'teacher' ? null : 'Class 10')
      ;[u] = await find()
      console.log(`Created ${name} <${email}>`)
    }
    if (!u) throw new Error(`No account with email ${email} (add --create <password> to make demo accounts)`)
    return u
  }
  const teacher = await byEmail(teacherEmail, 'teacher', 0)
  const students = []
  for (let i = 0; i < studentEmails.length; i++) students.push(await byEmail(studentEmails[i], 'student', i))

  if (has('remove')) {
    const ids = students.map((s) => s.id)
    const n1 = await db.$executeRawUnsafe(`DELETE FROM sessions WHERE description = $1 AND teacher_id = $2::uuid`, MARK, teacher.id)
    const n2 = await db.$executeRawUnsafe(`DELETE FROM teacher_assignments WHERE teacher_id = $1::uuid AND student_id = ANY($2::uuid[])`, teacher.id, ids)
    console.log(`Removed ${n1} lesson(s) and ${n2} pair(s). ${teacher.name} is still a teacher (change that from the admin user page).`)
    return
  }

  if (teacher.account_type !== 'teacher') {
    await db.$executeRawUnsafe(`UPDATE users SET account_type = 'teacher' WHERE id = $1::uuid`, teacher.id)
    console.log(`${teacher.name} is now a teacher (was ${teacher.account_type || 'student'}).`)
  }

  const now = Date.now()
  const at = (ms) => new Date(now + ms)
  const MIN = 60000; const HOUR = 60 * MIN; const DAY = 24 * HOUR
  // IST clock time on a day offset from today, as a UTC instant.
  const ist = (dayOffset, hh, mm = 0) => {
    const d = new Date(now + 330 * MIN + dayOffset * DAY)
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hh, mm) - 330 * MIN)
  }

  for (let i = 0; i < students.length; i++) {
    const s = students[i]
    const subject = subjects[i % subjects.length]
    const cls = normalizeClass(s.grade) || 10
    await db.$executeRawUnsafe(
      `UPDATE teacher_assignments SET status = 'ended', ends_on = current_date, updated_at = now()
        WHERE student_id = $1::uuid AND lower(subject) = lower($2) AND status = 'active' AND teacher_id <> $3::uuid`, s.id, subject, teacher.id)
    let [pair] = await db.$queryRawUnsafe(
      `SELECT id::text AS id FROM teacher_assignments WHERE student_id = $1::uuid AND teacher_id = $2::uuid AND lower(subject) = lower($3) AND status = 'active'`,
      s.id, teacher.id, subject)
    if (!pair) {
      ;[pair] = await db.$queryRawUnsafe(
        `INSERT INTO teacher_assignments (student_id, teacher_id, class_level, subject, room_link)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5) RETURNING id::text AS id`, s.id, teacher.id, cls, subject, room)
    }

    // The first student gets today's lessons; everyone gets some of the week.
    const plan = i === 0
      ? [[at(25 * MIN), 60, 'scheduled'], [at(-3 * HOUR), 45, 'completed'], [ist(0, 21, 30), 60, 'scheduled'], [ist(2, 17), 60, 'scheduled'], [ist(9, 17), 60, 'scheduled']]
      : [[ist(1, 16), 60, 'scheduled'], [ist(4, 18), 45, 'scheduled']]
    for (const [startsAt, min, status] of plan) {
      await db.$executeRawUnsafe(
        `INSERT INTO sessions (title, subject, class_level, teacher_name, starts_at, duration_min, status, assignment_id, teacher_id, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::uuid, $9::uuid, $10)`,
        `${subject} with ${s.name}`, subject, cls, teacher.name, startsAt, min, status, pair.id, teacher.id, MARK)
    }

    const date = (days) => new Date(now + 330 * MIN + days * DAY).toISOString().slice(0, 10)
    await db.$executeRawUnsafe(
      `INSERT INTO homework (assignment_id, title, details, due_on, status, done_at, created_by) VALUES
         ($1::uuid, $2, 'Questions 1 to 5 at the end of the section.', $3::date, 'assigned', NULL, $6::uuid),
         ($1::uuid, $4, 'Write the answers in your notebook.', $5::date, 'done', now(), $6::uuid),
         ($1::uuid, 'Revise last week''s notes', '', $7::date, 'assigned', NULL, $6::uuid)`,
      pair.id, `${subject}: practice questions`, date(2), `${subject}: chapter summary`, date(-1), teacher.id, date(-2))
    console.log(`Pair: ${s.name} · ${subject} · Class ${cls} — ${plan.length} lessons, 3 homework`)
  }
  console.log(`Done. Log in as ${teacherEmail} to see the teacher dashboard.`)
}

main()
  .catch((e) => { console.error(e.message || e); process.exitCode = 1 })
  .finally(() => db.$disconnect())
