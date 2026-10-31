'use strict'

// The free demo-class booking, minus the database and the mail: what a valid request
// is, how a slot is spoken about in Indian time, and how a stored row is handed to the
// app. Pure so tests/trialBooking.test.js can cover every rule without Postgres.
//
// The class and subject lists are copied from the app's demoConfig.js on purpose. The
// server is the one that says no, and a list it imported from the client would say yes
// to whatever the client sent.

const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
const SUBJECTS = ['Maths', 'Physics', 'Chemistry', 'Biology', 'Science', 'English']
const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB']
const DURATION_MIN = 45
// Same lead time the app's slot picker enforces (demoConfig.slotIsFuture). Enforced
// again here because the picker is only a suggestion once the request is on the wire.
const LEAD_TIME_MS = 2 * 60 * 60 * 1000
const IST = 'Asia/Kolkata'

const str = (v) => (v == null ? '' : String(v)).trim()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateBookingInput(body = {}, now = new Date()) {
  const parentName = str(body.parentName)
  const parentEmail = str(body.parentEmail).toLowerCase()
  const parentPhone = str(body.parentPhone)
  const childNameRaw = str(body.childName)
  const childClass = str(body.childClass)
  const board = str(body.board)
  const subject = str(body.subject)
  const slotAt = body.slotAt ? new Date(body.slotAt) : null

  if (!parentName) return { ok: false, error: 'Please tell us your name.' }
  if (!EMAIL_RE.test(parentEmail)) return { ok: false, error: 'That email address does not look right.' }
  if (parentPhone.replace(/\D/g, '').length < 10) return { ok: false, error: 'Please enter a 10-digit phone number.' }
  if (!childNameRaw) return { ok: false, error: "Please enter your child's name." }
  if (!CLASSES.includes(childClass)) return { ok: false, error: "Please pick your child's class." }
  if (!BOARDS.includes(board)) return { ok: false, error: "Please pick your child's board." }
  if (!SUBJECTS.includes(subject)) return { ok: false, error: 'Please pick a subject.' }
  if (!slotAt || !Number.isFinite(slotAt.getTime())) return { ok: false, error: 'Please pick a time slot.' }
  if (slotAt.getTime() < now.getTime() + LEAD_TIME_MS) {
    return { ok: false, error: 'Slots need at least 2 hours notice — please pick a later time.' }
  }

  return {
    ok: true,
    value: { parentName, parentEmail, parentPhone, childName: childNameRaw, childClass, board, subject, slotAt },
  }
}

// ─── Indian time, spelled out ────────────────────────────────────────────────
// Render runs in UTC; a parent in Pune reading "10:30 AM" for a 4 PM class would miss it.

function istDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { timeZone: IST, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// en-IN puts a lowercase "pm" with a narrow space; normalise to "4:00 PM".
function istTime(d) {
  return new Date(d)
    .toLocaleTimeString('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s+/g, ' ').toUpperCase()
}

// "4:00 – 4:45 PM", or "11:30 AM – 12:15 PM" when the class crosses noon.
function istRange(d, durationMin = DURATION_MIN) {
  const start = new Date(d)
  const end = new Date(start.getTime() + durationMin * 60000)
  const s = istTime(start)
  const e = istTime(end)
  const sMer = s.slice(-2)
  const eMer = e.slice(-2)
  return sMer === eMer ? `${s.slice(0, -3)} – ${e}` : `${s} – ${e}`
}

// ─── Rows ────────────────────────────────────────────────────────────────────

function bookingEndsAt(row) {
  return new Date(new Date(row.slot_at).getTime() + (row.duration_min || DURATION_MIN) * 60000)
}

function toApi(row) {
  return {
    id: row.id,
    parentName: row.parent_name,
    parentEmail: row.parent_email,
    parentPhone: row.parent_phone,
    childName: row.child_name,
    childClass: row.child_class,
    board: row.board,
    subject: row.subject,
    slotAt: new Date(row.slot_at).toISOString(),
    durationMin: row.duration_min,
    meetLink: row.meet_link,
    status: row.status,
    mailStatus: row.mail_status,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

module.exports = {
  CLASSES, SUBJECTS, BOARDS, DURATION_MIN, LEAD_TIME_MS, IST,
  validateBookingInput, istDate, istTime, istRange, bookingEndsAt, toApi,
}
