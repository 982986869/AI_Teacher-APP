'use strict'
// The teacher dashboard's shape, built from plain rows. Pure (no DB, no clock of its
// own): the service passes `now`, the teacher's pairs and lessons, and gets back exactly
// what the app draws — next lesson, today, this week, my students.
//
// Time: everything is stored in UTC and the teacher works in India time. IST has no
// daylight saving, so a fixed +05:30 is exact; "today" and the 7 days of "this week"
// are IST calendar days, so an 11:30 PM lesson never lands on the wrong day.

const IST_MS = 330 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
// Join opens this long before a lesson and stays open until it ends.
const JOIN_EARLY_MS = 10 * 60 * 1000
const WEEK_DAYS = 7
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toDate = (v) => (v instanceof Date ? v : new Date(v))
// 'YYYY-MM-DD' of the IST calendar day an instant falls on.
const istDateKey = (t) => new Date(toDate(t).getTime() + IST_MS).toISOString().slice(0, 10)
// The UTC instant an IST calendar day starts at.
const istDayStart = (key) => new Date(Date.parse(`${key}T00:00:00Z`) - IST_MS)
const addDays = (key, n) => new Date(Date.parse(`${key}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10)

// The window the dashboard needs lessons for: from the start of today (IST) to the end
// of the 7th day. The service queries exactly this.
function weekWindow(now) {
  const today = istDateKey(now)
  return { today, from: istDayStart(today), to: istDayStart(addDays(today, WEEK_DAYS)) }
}

// One lesson as the app sees it. `state`: upcoming (Join not open yet) | joinable
// (from 10 min before until it ends) | over.
function lessonOut(row, now) {
  const startsAt = toDate(row.startsAt)
  const endsAt = row.endsAt ? toDate(row.endsAt) : new Date(startsAt.getTime() + (Number(row.durationMin) || 60) * 60000)
  const joinOpensAt = new Date(startsAt.getTime() - JOIN_EARLY_MS)
  const t = toDate(now).getTime()
  const state = t >= endsAt.getTime() ? 'over' : t >= joinOpensAt.getTime() ? 'joinable' : 'upcoming'
  return {
    id: String(row.id),
    assignmentId: row.assignmentId ? String(row.assignmentId) : null,
    studentName: row.studentName || '',
    subject: row.subject || '',
    classLevel: row.classLevel != null ? Number(row.classLevel) : null,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    joinOpensAt: joinOpensAt.toISOString(),
    roomLink: row.roomLink || null,
    date: istDateKey(startsAt),
    state,
  }
}

// rows → the dashboard. `lessons`: this week's lessons (any order). `nextRow`: the first
// lesson still to come or still running, which may be after this week (or null).
function buildDashboard({ now, pairs = [], lessons = [], nextRow = null }) {
  const { today } = weekWindow(now)
  const all = lessons.map((r) => lessonOut(r, now)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  const next = nextRow ? lessonOut(nextRow, now) : (all.find((l) => l.state !== 'over') || null)

  const week = []
  for (let i = 0; i < WEEK_DAYS; i++) {
    const date = addDays(today, i)
    const dow = WEEKDAY[new Date(`${date}T00:00:00Z`).getUTCDay()]
    week.push({ date, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dow, weekday: dow, lessons: all.filter((l) => l.date === date) })
  }

  // The next lesson of each pair, for "My students".
  const nextByPair = new Map()
  for (const l of all) {
    if (l.state === 'over' || !l.assignmentId || nextByPair.has(l.assignmentId)) continue
    nextByPair.set(l.assignmentId, l.startsAt)
  }
  const students = pairs.map((p) => ({
    assignmentId: String(p.assignmentId),
    studentId: String(p.studentId),
    studentName: p.studentName || '',
    classLevel: Number(p.classLevel),
    subject: p.subject,
    roomLink: p.roomLink || null,
    nextLessonAt: nextByPair.get(String(p.assignmentId)) || (p.nextLessonAt ? toDate(p.nextLessonAt).toISOString() : null),
  }))

  return {
    now: toDate(now).toISOString(),
    timezone: 'Asia/Kolkata',
    next,
    today: week[0].lessons,
    week,
    students,
  }
}

module.exports = { buildDashboard, lessonOut, weekWindow, istDateKey, istDayStart, addDays, JOIN_EARLY_MS, WEEK_DAYS }
