# Teacher dashboard — design

2026-11-28. Branch `feat/teacher-dashboard`, built on `fix/teacher-role-escalation`
(only an admin can make someone a teacher).

## What the teacher sees (owner's list, nothing extra)

1. **Next lesson** — student · subject · "in 25 minutes", time and class, **Join** live
   from 10 minutes before until the lesson ends.
2. **Today** — every lesson today (finished ones too), each with Join.
3. **My students** — one row per teacher↔student pair: student · subject · class and the
   pair's **permanent room link** (bookmarkable, never changes).
4. **This week** — the 7 days from today, lessons per day.
5. **Homework + My class** — new (it did not exist anywhere): a teacher gives one student
   homework (title, details, due date); the student ticks it done; My class shows each
   pair's given / done / overdue.

Login: an account with `account_type = 'teacher'` (set by an admin) opens the dashboard
instead of the `RoleHomeScreen` placeholder. "Admin adds an email as teacher first" is a
later step.

## Data (prisma/sql/teacher_dashboard.sql — run BEFORE the code)

- `teacher_assignments` — the pair: student, teacher, class_level, subject, status
  (active/ended), **room_link**. One active pair per student per subject.
- `sessions` + `assignment_id`, `teacher_id` — a lesson of a pair. The end is always
  `starts_at + duration_min`, computed on read (the admin session editor changes start and
  duration, so a stored end would go stale). `teacher_id` is also what the admin's
  "remove teacher role" check counts.
- `homework` — one task inside a pair; status assigned/done (+ done_at); soft delete.

## API

Teacher only (`requireTeacher`: scope role 'teacher', active account):

| | |
|---|---|
| `GET /api/teaching/dashboard` | next, today, week, students — one request |
| `GET /api/teaching/class` | pairs with homework counts |
| `GET /api/teaching/homework?assignmentId=` | the teacher's homework |
| `POST /api/teaching/homework` | `{ assignmentId, title, details, dueOn }` |
| `PATCH /api/teaching/homework/:id` | edit, or `{ delete: true }` |

Student: `GET /api/homework`, `POST /api/homework/:id/done`, `POST /api/homework/:id/undo`,
`GET /api/my-classes` (their own pairs: teacher, subject, room link, next class).

Where things show: teacher — Home (next lesson Join, Today, My students' Room), Homework tab,
My class tab. Student — Home: **Your classes** card (teacher, next class, Join with the pair's room
link, open from 10 min before) and **Homework** card (tick done). Both hidden when empty.

Not `/api/teacher/*`: that path is the AI Teacher's avatar identity.

## Safety

- Every teacher query is filtered by `teacher_id = me`, every student query by
  `student_id = me`; a wrong id answers 404, never someone else's data.
- The class Sessions list (`GET /api/sessions`) now skips pair lessons
  (`assignment_id IS NULL`) — otherwise a private lesson and its room link would show to
  the whole class.

## Time

Stored in UTC, shown in IST (fixed +05:30, no daylight saving). "Today" and "this week"
are IST calendar days.

## Test data

`node scripts/teacher-demo-seed.js --teacher <email> --students <a,b> [--create <password>]`
(local only) — pairs, lessons today and across the week, homework; `--remove` undoes it.

## Days

1. Server (this) · 2. App: dashboard screen · 3. Homework + My class + student homework card.
