# Trial Booking (in-house + Brevo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Calendly embed with an in-app booking flow that stores the booking on our server and emails the parent a Google Meet link from `kids@ailernova.com` through Brevo.

**Architecture:** A new `trial_bookings` table written with raw SQL (like `support_tickets`), a pure `services/trialBooking.js` for validation and IST formatting (unit-tested without a DB), a thin controller under the existing authenticated `/api/parent` router, and two new templates in `services/mailTemplates.js` sent through the existing Brevo SMTP `mailer.js`. In the app, `TrialBookingEmbed.js` (Calendly) is replaced by `TrialBookingFlow.js` (slot → details → done) and the already-existing `UpcomingDemoCard` finally receives a real booking.

**Tech Stack:** Node 18+/Express/Prisma raw SQL/nodemailer (Brevo SMTP), `node --test`; React Native (Expo SDK 54) + react-native-web, no app test runner (parse-check with babel).

**Spec:** `docs/superpowers/specs/2026-09-18-trial-booking-brevo-design.md`

## Global Constraints

- Sender: `Ailernova Kids <kids@ailernova.com>` (env `TRIAL_MAIL_FROM`, must be Brevo-verified). Team copy to `kids@ailernova.com` (env `TRIAL_NOTIFY_EMAIL`).
- Meet link: env `TRIAL_MEET_LINK`; booking POST answers **503** when unset.
- Class length: **45 min** (`DEMO_DURATION_MIN` in `src/screens/parent/ParentApp/demoConfig.js`).
- Times in email rendered in `Asia/Kolkata`.
- Allowed classes: `Class 6 … Class 12`; allowed subjects: `Maths, Physics, Chemistry, Biology, Science, English` (copied from `demoConfig.js`; the server keeps its own copy).
- Slot must be ≥ 2 h in the future (matches `slotIsFuture` in `demoConfig.js`).
- One active (`status='booked'`, not yet ended) booking per user → **409**.
- DB access via `db.$queryRawUnsafe` / `db.$executeRawUnsafe` with `$n` params (never string-interpolate user input).
- SQL migration is hand-run: `npx prisma db execute --file prisma/sql/trial_bookings.sql --schema prisma/schema.prisma` (see memory note on manual migrations; on Render use the server's own Prisma).
- Server files use `'use strict'`, CommonJS, no semicolons. App files use semicolons, ES modules.
- Server tests: `cd server && npm test` (`node --test "tests/*.test.js"`). DB-backed tests skip without `DATABASE_URL`.
- App has no test runner: verify each changed file parses with `node -e "require('@babel/core').transformFileSync('<file>', {presets:['babel-preset-expo']})"` from the app root.
- Commit after each task with the trailer `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

## File map

| Path | Responsibility |
|---|---|
| `server/prisma/sql/trial_bookings.sql` (create) | table + index, idempotent |
| `server/src/services/trialBooking.js` (create) | constants, `validateBookingInput`, `istDate`/`istTime`, `bookingEndsAt`, `toApi` row mapper — pure |
| `server/src/services/mailTemplates.js` (modify) | `trialBooked`, `trialBookedTeam` |
| `server/src/services/mailer.js` (modify) | optional `from` on `sendMail` |
| `server/src/config/env.js` (modify) | `trial: { meetLink, mailFrom, notifyEmail }` |
| `server/src/controllers/trialBooking.controller.js` (create) | create / upcoming / cancel |
| `server/src/routes/parent.js` (modify) | three routes |
| `server/tests/trialBooking.test.js` (create) | pure service tests |
| `server/tests/mail.test.js` (modify) | template tests |
| `server/tests/trialBooking.db.test.js` (create) | controller against real DB, skips without `DATABASE_URL` |
| `render.yaml` (modify) | three env keys |
| `src/api/parentApi.js` (modify) | `createTrialBooking`, `getUpcomingTrialBooking`, `cancelTrialBooking` |
| `src/screens/parent/ParentApp/TrialBookingFlow.js` (create) | the 3-step modal |
| `src/screens/parent/ParentApp/TrialBookingEmbed.js` (delete) | Calendly |
| `src/screens/parent/ParentApp/ParentApp.js` (modify) | load/join/cancel wiring |
| `src/screens/parent/ParentApp/EventsCarousel.js` (modify) | program page CTA uses the flow |
| `src/screens/parent/ParentApp/UpcomingDemoCard.js` (modify) | drop Reschedule |
| `src/screens/parent/ParentApp/ClassesTab.js` (modify) | drop unused prop |
| `src/screens/parent/ParentApp/HomeTab.js` (modify) | "60 min" chip → `DEMO_DURATION_MIN` |

---

### Task 1: Pure booking service (validation, IST formatting, row mapping)

**Files:**
- Create: `server/src/services/trialBooking.js`
- Test: `server/tests/trialBooking.test.js`

**Interfaces:**
- Produces:
  - `CLASSES: string[]`, `SUBJECTS: string[]`, `DURATION_MIN = 45`, `LEAD_TIME_MS = 2h`
  - `validateBookingInput(body, now = new Date()) → { ok: true, value } | { ok: false, error: string }` where `value = { parentName, parentEmail, parentPhone, childName|null, childClass, subject, slotAt: Date }`
  - `istDate(d) → 'Friday, 19 September 2026'`, `istTime(d) → '4:00 PM'`, `istRange(d, durationMin) → '4:00 – 4:45 PM'`
  - `bookingEndsAt(row) → Date`
  - `toApi(row) → { id, parentName, parentEmail, parentPhone, childName, childClass, subject, slotAt (ISO), durationMin, meetLink, status, mailStatus, createdAt (ISO) }`

- [ ] **Step 1: Write the failing tests**

`server/tests/trialBooking.test.js`:

```js
'use strict'

const test = require('node:test')
const assert = require('node:assert')

const {
  CLASSES, SUBJECTS, DURATION_MIN,
  validateBookingInput, istDate, istTime, istRange, bookingEndsAt, toApi,
} = require('../src/services/trialBooking')

const NOW = new Date('2026-09-18T06:00:00Z') // 11:30 AM IST
const inThreeHours = new Date(NOW.getTime() + 3 * 3600000).toISOString()

const good = () => ({
  parentName: ' Meera Sharma ', parentEmail: 'MEERA@example.com ', parentPhone: '+91 98765-43210',
  childName: 'Aarav', childClass: 'Class 8', subject: 'Maths', slotAt: inThreeHours,
})

// ─── Validation ──────────────────────────────────────────────────────────────

test('a complete booking is accepted and normalised', () => {
  const r = validateBookingInput(good(), NOW)
  assert.equal(r.ok, true)
  assert.equal(r.value.parentName, 'Meera Sharma')
  assert.equal(r.value.parentEmail, 'meera@example.com')
  assert.equal(r.value.parentPhone, '+91 98765-43210')
  assert.equal(r.value.childName, 'Aarav')
  assert.equal(r.value.childClass, 'Class 8')
  assert.equal(r.value.subject, 'Maths')
  assert.ok(r.value.slotAt instanceof Date)
  assert.equal(r.value.slotAt.toISOString(), inThreeHours)
})

test('child name is optional and comes back as null when blank', () => {
  const r = validateBookingInput({ ...good(), childName: '   ' }, NOW)
  assert.equal(r.ok, true)
  assert.equal(r.value.childName, null)
})

test('a phone with fewer than 10 digits is rejected', () => {
  const r = validateBookingInput({ ...good(), parentPhone: '98765' }, NOW)
  assert.equal(r.ok, false)
  assert.match(r.error, /phone/i)
})

test('a malformed email is rejected', () => {
  const r = validateBookingInput({ ...good(), parentEmail: 'not-an-email' }, NOW)
  assert.equal(r.ok, false)
  assert.match(r.error, /email/i)
})

test('a class outside the list is rejected', () => {
  const r = validateBookingInput({ ...good(), childClass: 'Class 3' }, NOW)
  assert.equal(r.ok, false)
  assert.match(r.error, /class/i)
})

test('a subject outside the list is rejected', () => {
  const r = validateBookingInput({ ...good(), subject: 'Sanskrit' }, NOW)
  assert.equal(r.ok, false)
  assert.match(r.error, /subject/i)
})

test('a slot less than two hours away is rejected', () => {
  const soon = new Date(NOW.getTime() + 90 * 60000).toISOString()
  const r = validateBookingInput({ ...good(), slotAt: soon }, NOW)
  assert.equal(r.ok, false)
  assert.match(r.error, /2 hours/i)
})

test('a slot in the past or unparseable is rejected', () => {
  assert.equal(validateBookingInput({ ...good(), slotAt: '2020-01-01T10:00:00Z' }, NOW).ok, false)
  assert.equal(validateBookingInput({ ...good(), slotAt: 'tomorrow-ish' }, NOW).ok, false)
  assert.equal(validateBookingInput({ ...good(), slotAt: undefined }, NOW).ok, false)
})

test('the allowed lists match the app', () => {
  assert.deepEqual(CLASSES, ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'])
  assert.deepEqual(SUBJECTS, ['Maths', 'Physics', 'Chemistry', 'Biology', 'Science', 'English'])
  assert.equal(DURATION_MIN, 45)
})

// ─── IST formatting (Render runs in UTC) ─────────────────────────────────────

test('dates and times render in IST regardless of the process timezone', () => {
  const d = new Date('2026-09-19T10:30:00Z') // 4:00 PM IST
  assert.equal(istDate(d), 'Saturday, 19 September 2026')
  assert.equal(istTime(d), '4:00 PM')
  assert.equal(istRange(d, 45), '4:00 – 4:45 PM')
})

test('a range that crosses noon shows both meridiems', () => {
  const d = new Date('2026-09-19T06:00:00Z') // 11:30 AM IST
  assert.equal(istRange(d, 45), '11:30 AM – 12:15 PM')
})

// ─── Row helpers ─────────────────────────────────────────────────────────────

test('bookingEndsAt adds the duration to the slot', () => {
  const row = { slot_at: new Date('2026-09-19T10:30:00Z'), duration_min: 45 }
  assert.equal(bookingEndsAt(row).toISOString(), '2026-09-19T11:15:00.000Z')
})

test('toApi maps a DB row to the camelCase shape the app reads', () => {
  const row = {
    id: 'b1', user_id: 'u1', parent_name: 'Meera', parent_email: 'm@x.com', parent_phone: '9876543210',
    child_name: 'Aarav', child_class: 'Class 8', subject: 'Maths',
    slot_at: new Date('2026-09-19T10:30:00Z'), duration_min: 45,
    meet_link: 'https://meet.google.com/abc-defg-hij', status: 'booked', mail_status: 'sent',
    created_at: new Date('2026-09-18T06:00:00Z'), cancelled_at: null,
  }
  assert.deepEqual(toApi(row), {
    id: 'b1', parentName: 'Meera', parentEmail: 'm@x.com', parentPhone: '9876543210',
    childName: 'Aarav', childClass: 'Class 8', subject: 'Maths',
    slotAt: '2026-09-19T10:30:00.000Z', durationMin: 45,
    meetLink: 'https://meet.google.com/abc-defg-hij', status: 'booked', mailStatus: 'sent',
    createdAt: '2026-09-18T06:00:00.000Z',
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd server && node --test tests/trialBooking.test.js`
Expected: FAIL — `Cannot find module '../src/services/trialBooking'`

- [ ] **Step 3: Write the service**

`server/src/services/trialBooking.js`:

```js
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
  const subject = str(body.subject)
  const slotAt = body.slotAt ? new Date(body.slotAt) : null

  if (!parentName) return { ok: false, error: 'Please tell us your name.' }
  if (!EMAIL_RE.test(parentEmail)) return { ok: false, error: 'That email address does not look right.' }
  if (parentPhone.replace(/\D/g, '').length < 10) return { ok: false, error: 'Please enter a 10-digit phone number.' }
  if (!CLASSES.includes(childClass)) return { ok: false, error: "Please pick your child's class." }
  if (!SUBJECTS.includes(subject)) return { ok: false, error: 'Please pick a subject.' }
  if (!slotAt || !Number.isFinite(slotAt.getTime())) return { ok: false, error: 'Please pick a time slot.' }
  if (slotAt.getTime() < now.getTime() + LEAD_TIME_MS) {
    return { ok: false, error: 'Slots need at least 2 hours notice — please pick a later time.' }
  }

  return {
    ok: true,
    value: { parentName, parentEmail, parentPhone, childName: childNameRaw || null, childClass, subject, slotAt },
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
  CLASSES, SUBJECTS, DURATION_MIN, LEAD_TIME_MS, IST,
  validateBookingInput, istDate, istTime, istRange, bookingEndsAt, toApi,
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd server && node --test tests/trialBooking.test.js`
Expected: all PASS. If `istTime` yields `'4:00 pm'` with a non-breaking space on your Node/ICU, the `.replace(/\s+/g, ' ').toUpperCase()` handles it; if the en-IN output differs in another way, adjust the normalisation — the asserted strings are the contract.

- [ ] **Step 5: Commit**

```bash
git add server/src/services/trialBooking.js server/tests/trialBooking.test.js
git commit -m "Trial booking: pure validation, IST formatting and row mapping

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Email templates

**Files:**
- Modify: `server/src/services/mailTemplates.js` (add two functions, extend `module.exports`)
- Test: `server/tests/mail.test.js` (append)

**Interfaces:**
- Consumes: `istDate`, `istRange` from Task 1.
- Produces:
  - `trialBooked({ parentName, childName, childClass, subject, slotAt, durationMin, meetLink }) → { subject, text, html }`
  - `trialBookedTeam({ parentName, parentEmail, parentPhone, childName, childClass, subject, slotAt, durationMin, meetLink, bookingId }) → { subject, text, html }`

- [ ] **Step 1: Write the failing tests** — append to `server/tests/mail.test.js`:

```js
// ─── Free demo class booked ──────────────────────────────────────────────────

const { trialBooked, trialBookedTeam } = require('../src/services/mailTemplates')

const SLOT = new Date('2026-09-19T10:30:00Z') // Sat 19 Sep 2026, 4:00 PM IST
const MEET = 'https://meet.google.com/abc-defg-hij'
const booking = {
  parentName: 'Meera', parentEmail: 'meera@example.com', parentPhone: '9876543210',
  childName: 'Aarav', childClass: 'Class 8', subject: 'Maths',
  slotAt: SLOT, durationMin: 45, meetLink: MEET, bookingId: 'b1',
}

test('the parent email carries the Meet link in both parts', () => {
  const m = trialBooked(booking)
  assert.ok(m.text.includes(MEET))
  assert.ok(m.html.includes(`href="${MEET}"`))
})

test('the parent email says the day and the time in IST, not UTC', () => {
  const m = trialBooked(booking)
  assert.match(m.subject, /19 Sep/)
  assert.match(m.subject, /4:00 PM/)
  assert.match(m.text, /Saturday, 19 September 2026/)
  assert.match(m.text, /4:00 – 4:45 PM/)
  assert.ok(!bothParts(m).includes('10:30'))
})

test('the parent email names the child, class and subject', () => {
  const m = trialBooked(booking)
  assert.match(m.text, /Maths/)
  assert.match(m.text, /Aarav/)
  assert.match(m.text, /Class 8/)
})

test('the parent email works without a child name', () => {
  const m = trialBooked({ ...booking, childName: null })
  assert.match(m.text, /^Hi Meera,/)
  assert.ok(!bothParts(m).includes('null'))
  assert.ok(!bothParts(m).includes('undefined'))
})

test('the parent email tells them where to write back', () => {
  assert.match(trialBooked(booking).text, /kids@ailernova\.com/)
})

test('the team copy has the contact details the parent email does not', () => {
  const m = trialBookedTeam(booking)
  assert.match(m.subject, /^New demo booking: Maths/)
  assert.match(m.subject, /Meera/)
  assert.match(m.text, /meera@example\.com/)
  assert.match(m.text, /9876543210/)
  assert.match(m.text, /Sat/)
  assert.ok(m.text.includes(MEET))
  assert.ok(m.text.includes('b1'))
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd server && node --test tests/mail.test.js`
Expected: FAIL — `trialBooked is not a function`

- [ ] **Step 3: Add the templates** — in `server/src/services/mailTemplates.js`, add after the existing `require`:

```js
const { istDate, istRange, istTime, DURATION_MIN } = require('./trialBooking')
```

and before `module.exports`:

```js
// ─── 4. Your free demo class is booked ───────────────────────────────────────
//
// The one email a parent must be able to find on the day: when, and the link. The link
// appears twice on purpose — as a button and as bare text — because some clients strip
// the button styling and a link a person cannot copy is not a link.

const shortDay = (d) =>
  new Date(d).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' })

function classLine({ childName, childClass, subject }) {
  return childName ? `${subject} for ${childName}, ${childClass}` : `${subject}, ${childClass}`
}

function trialBooked({ parentName, childName, childClass, subject, slotAt, durationMin = DURATION_MIN, meetLink }) {
  const when = `${istDate(slotAt)}, ${istRange(slotAt, durationMin)} (IST)`
  const what = classLine({ childName, childClass, subject })
  const text = [
    hello(parentName),
    '',
    `Your free demo class is booked.`,
    '',
    `Class: ${what}`,
    `When: ${when}`,
    `Join on Google Meet: ${meetLink}`,
    '',
    `Please join about 10 minutes early so the mentor can say hello and check the audio.`,
    `If the time no longer works, you can cancel from the app and book another slot, or write to kids@ailernova.com.`,
    '',
    'See you there,',
    'Ailernova Kids',
  ].join('\n')

  const html = layout([
    p(hello(parentName)),
    p('Your free demo class is booked.'),
    `    <div style="background:#f6f6f9;border-radius:10px;padding:16px 18px;margin:0 0 20px;font-size:15px;line-height:1.7;">
      <div><strong>Class:</strong> ${what}</div>
      <div><strong>When:</strong> ${when}</div>
    </div>`,
    `    <p style="margin:0 0 20px;"><a href="${meetLink}" style="display:inline-block;background:#5b3df5;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 22px;border-radius:10px;">Join on Google Meet</a></p>`,
    p(`Or copy this link: <a href="${meetLink}">${meetLink}</a>`),
    p('Please join about 10 minutes early so the mentor can say hello and check the audio.'),
    p('If the time no longer works, you can cancel from the app and book another slot, or write to <a href="mailto:kids@ailernova.com">kids@ailernova.com</a>.'),
    p('See you there,<br>Ailernova Kids'),
  ].join('\n'))

  return { subject: `Your free demo class is booked — ${shortDay(slotAt)} at ${istTime(slotAt)}`, text, html }
}

// ─── 5. Team copy ────────────────────────────────────────────────────────────
//
// Whoever is staffing the Meet room needs to know who is coming and how to reach them
// if they do not show. Compact on purpose: it is read on a phone between classes.

function trialBookedTeam({ parentName, parentEmail, parentPhone, childName, childClass, subject, slotAt, durationMin = DURATION_MIN, meetLink, bookingId }) {
  const rows = [
    ['When', `${istDate(slotAt)}, ${istRange(slotAt, durationMin)} (IST)`],
    ['Class', classLine({ childName, childClass, subject })],
    ['Parent', parentName],
    ['Email', parentEmail],
    ['Phone', parentPhone],
    ['Meet', meetLink],
    ['Booking', bookingId],
  ]
  const text = ['New demo booking', '', ...rows.map(([k, v]) => `${k}: ${v}`)].join('\n')
  const html = layout([
    p('<strong>New demo booking</strong>'),
    `    <table style="border-collapse:collapse;font-size:14px;line-height:1.6;">${rows.map(([k, v]) =>
      `<tr><td style="padding:2px 14px 2px 0;color:#8a8a94;vertical-align:top;">${k}</td><td style="padding:2px 0;">${v}</td></tr>`).join('')}</table>`,
  ].join('\n'))
  return { subject: `New demo booking: ${subject} · ${shortDay(slotAt)}, ${istTime(slotAt)} · ${parentName}`, text, html }
}
```

Change the export line to:

```js
module.exports = { accountDeleted, reactivate, adminDigest, trialBooked, trialBookedTeam }
```

- [ ] **Step 4: Run to verify pass**

Run: `cd server && node --test tests/mail.test.js tests/trialBooking.test.js`
Expected: all PASS (the earlier deletion/reactivation tests must still pass too).

- [ ] **Step 5: Commit**

```bash
git add server/src/services/mailTemplates.js server/tests/mail.test.js
git commit -m "Trial booking: parent confirmation and team-copy emails

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Config, per-message sender, migration, render.yaml

**Files:**
- Modify: `server/src/config/env.js` (after `jobsSecret`)
- Modify: `server/src/services/mailer.js:89` (`sendMail` signature)
- Create: `server/prisma/sql/trial_bookings.sql`
- Modify: `render.yaml` (after the `MAIL_FROM` block)

**Interfaces:**
- Produces: `config.trial = { meetLink: string, mailFrom: string, notifyEmail: string }`; `sendMail({ to, subject, html, text, from? })`.

- [ ] **Step 1: Add config** — in `server/src/config/env.js`, after the `jobsSecret:` line:

```js
  // Free demo-class booking (controllers/trialBooking). One standing Google Meet room
  // for every demo — a link per booking would need the Calendar API and a service
  // account. Unset, booking refuses (503) rather than mail an empty link.
  trial: {
    meetLink: (process.env.TRIAL_MEET_LINK || '').trim(),
    // The sender parents see. Must be a verified sender in Brevo, like MAIL_FROM.
    mailFrom: (process.env.TRIAL_MAIL_FROM || 'Ailernova Kids <kids@ailernova.com>').trim(),
    // Where the team copy of every booking goes.
    notifyEmail: (process.env.TRIAL_NOTIFY_EMAIL || 'kids@ailernova.com').trim(),
  },
```

- [ ] **Step 2: Let `sendMail` take a sender** — in `server/src/services/mailer.js` change the signature and both transports:

```js
// `from` is optional: the default is MAIL_FROM. A message type that speaks for a
// different desk (the demo-class booking writes from kids@) passes its own, which
// must be a verified sender at the provider exactly like MAIL_FROM.
async function sendMail({ to, subject, html, text, from }) {
  const sender = (from || '').trim() || mail.from
  if (mail.transport === 'relay') {
    try {
      const r = await fetch(relayUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-relay-key': relaySecret },
        body: JSON.stringify({ to, subject, html, text, from: sender }),
      })
```

and in the smtp branch:

```js
      const info = await transporter().sendMail({ from: sender, to, subject, html, text })
```

Leave everything else in the function as is.

- [ ] **Step 3: Write the migration** — `server/prisma/sql/trial_bookings.sql`:

```sql
-- Free demo-class bookings made from the parent app (controllers/trialBooking).
-- Replaces the Calendly embed: the row is our record, the emails are built from it.
-- Idempotent/additive; safe to re-run.
--   npx prisma db execute --file prisma/sql/trial_bookings.sql --schema prisma/schema.prisma

CREATE TABLE IF NOT EXISTS "trial_bookings" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  -- The signed-in account that booked. Not a foreign key: accounts are purged after
  -- their grace period and the team still wants the booking history.
  "user_id"       UUID NOT NULL,
  "parent_name"   TEXT NOT NULL,
  "parent_email"  TEXT NOT NULL,                      -- where the confirmation went
  "parent_phone"  TEXT NOT NULL,
  "child_name"    TEXT,
  "child_class"   TEXT NOT NULL,                      -- 'Class 8'
  "subject"       TEXT NOT NULL,                      -- 'Maths'
  "slot_at"       TIMESTAMPTZ NOT NULL,               -- class start
  "duration_min"  INTEGER NOT NULL DEFAULT 45,
  "meet_link"     TEXT NOT NULL,                      -- the link that was emailed, frozen
  "status"        TEXT NOT NULL DEFAULT 'booked',     -- booked | cancelled
  "mail_status"   TEXT NOT NULL DEFAULT 'pending',    -- pending | sent | failed
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "cancelled_at"  TIMESTAMPTZ,
  CONSTRAINT "trial_bookings_pkey" PRIMARY KEY ("id")
);

-- "Does this user already have a demo coming up?" is the query on every booking and
-- every dashboard load.
CREATE INDEX IF NOT EXISTS "trial_bookings_user_slot_idx" ON "trial_bookings" ("user_id", "slot_at");
```

- [ ] **Step 4: Run the migration locally** (the dev DB is the Docker container on port 5434 — see `server/.env` `DATABASE_URL`):

Run: `cd server && npx prisma db execute --file prisma/sql/trial_bookings.sql --schema prisma/schema.prisma`
Expected: `Script executed successfully.` Then confirm: `docker exec ailernova-pg psql -U postgres -d <db> -c '\d trial_bookings'` shows the 15 columns.

- [ ] **Step 5: Add the env keys to `render.yaml`** — directly after the `MAIL_FROM` entry:

```yaml
      # Free demo-class booking. The standing Google Meet room every demo uses; the
      # booking endpoint answers 503 until this is set, so nothing is emailed blank.
      - key: TRIAL_MEET_LINK
        sync: false
      # Sender for the booking emails. Verified in Brevo like MAIL_FROM (Senders →
      # Add a sender). Defaults to "Ailernova Kids <kids@ailernova.com>" when unset.
      - key: TRIAL_MAIL_FROM
        sync: false
      # Team copy of every booking. Defaults to kids@ailernova.com when unset.
      - key: TRIAL_NOTIFY_EMAIL
        sync: false
```

- [ ] **Step 6: Run the whole server suite** to be sure the mailer change broke nothing

Run: `cd server && npm test`
Expected: PASS (DB-backed suites skip without `DATABASE_URL`; with it set they run against the local container).

- [ ] **Step 7: Commit**

```bash
git add server/src/config/env.js server/src/services/mailer.js server/prisma/sql/trial_bookings.sql render.yaml
git commit -m "Trial booking: config, per-message sender, trial_bookings table

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Controller and routes

**Files:**
- Create: `server/src/controllers/trialBooking.controller.js`
- Modify: `server/src/routes/parent.js`
- Test: `server/tests/trialBooking.db.test.js`

**Interfaces:**
- Consumes: Task 1 service, Task 2 templates, Task 3 `config.trial` + `sendMail({ from })`.
- Produces (all behind `authenticate`, `req.user.id` is the caller):
  - `POST /api/parent/trial-bookings` → `201 { success, data: { booking, mailSent } }`; `422` validation; `409` already booked; `503` no Meet link.
  - `GET /api/parent/trial-bookings/upcoming` → `200 { data: { booking: <toApi>|null } }`
  - `POST /api/parent/trial-bookings/:id/cancel` → `200 { data: { booking } }`; `404` not yours / not found.
  - Exported for tests: `createTrialBooking(req, res, next)`, `upcomingTrialBooking`, `cancelTrialBooking`, and `_deps` (mutable `{ sendMail }`) so a test can stub mail.

- [ ] **Step 1: Write the failing DB test** — `server/tests/trialBooking.db.test.js`:

```js
'use strict'

// The booking endpoints against the real DB. Skips without DATABASE_URL. Every row
// this file creates is deleted in teardown. Mail is stubbed — no SMTP here.

try { require('dotenv').config() } catch (_) { /* dotenv optional */ }
const test = require('node:test')
const assert = require('node:assert')

const hasDb = !!process.env.DATABASE_URL
const db = hasDb ? require('../src/config/database') : null
const ctrl = hasDb ? require('../src/controllers/trialBooking.controller') : null
const { config } = require('../src/config/env')

const USER = '00000000-0000-4000-8000-00000000f101'
const OTHER = '00000000-0000-4000-8000-00000000f102'
const ids = []

const inThreeHours = () => new Date(Date.now() + 3 * 3600000).toISOString()
const body = (over = {}) => ({
  parentName: 'Meera', parentEmail: 'meera@example.com', parentPhone: '9876543210',
  childName: 'Aarav', childClass: 'Class 8', subject: 'Maths', slotAt: inThreeHours(), ...over,
})

// A minimal res that records what the controller answered.
function fakeRes() {
  const r = { code: 200, body: null }
  r.status = (c) => { r.code = c; return r }
  r.json = (b) => { r.body = b; return r }
  return r
}
async function call(fn, { userId = USER, reqBody = {}, params = {} } = {}) {
  const res = fakeRes()
  let thrown = null
  await fn({ user: { id: userId }, body: reqBody, params }, res, (e) => { thrown = e })
  if (thrown) throw thrown
  if (res.body && res.body.data && res.body.data.booking) ids.push(res.body.data.booking.id)
  return res
}

let sent = []
test.before(() => {
  if (!hasDb) return
  config.trial.meetLink = 'https://meet.google.com/test-link-xyz'
  ctrl._deps.sendMail = async (m) => { sent.push(m); return { ok: true, id: 'stub' } }
})
test.beforeEach(async () => {
  sent = []
  if (hasDb) await db.$executeRawUnsafe(`DELETE FROM "trial_bookings" WHERE user_id IN ($1::uuid, $2::uuid)`, USER, OTHER)
})
test.after(async () => {
  if (!hasDb) return
  await db.$executeRawUnsafe(`DELETE FROM "trial_bookings" WHERE user_id IN ($1::uuid, $2::uuid)`, USER, OTHER)
  await db.$disconnect()
})

test('booking stores the row, emails parent and team, and answers 201', { skip: !hasDb }, async () => {
  const res = await call(ctrl.createTrialBooking, { reqBody: body() })
  assert.equal(res.code, 201, JSON.stringify(res.body))
  const b = res.body.data.booking
  assert.equal(b.status, 'booked')
  assert.equal(b.meetLink, 'https://meet.google.com/test-link-xyz')
  assert.equal(b.mailStatus, 'sent')
  assert.equal(res.body.data.mailSent, true)
  assert.equal(sent.length, 2)
  const toParent = sent.find((m) => m.to === 'meera@example.com')
  const toTeam = sent.find((m) => m.to === config.trial.notifyEmail)
  assert.ok(toParent && toTeam)
  assert.equal(toParent.from, config.trial.mailFrom)
  assert.ok(toParent.text.includes('https://meet.google.com/test-link-xyz'))
})

test('a second active booking is refused with 409', { skip: !hasDb }, async () => {
  await call(ctrl.createTrialBooking, { reqBody: body() })
  const res = await call(ctrl.createTrialBooking, { reqBody: body() })
  assert.equal(res.code, 409)
  assert.match(res.body.error, /already/i)
})

test('bad input is 422 and nothing is stored or sent', { skip: !hasDb }, async () => {
  const res = await call(ctrl.createTrialBooking, { reqBody: body({ parentPhone: '123' }) })
  assert.equal(res.code, 422)
  assert.equal(sent.length, 0)
  const rows = await db.$queryRawUnsafe(`SELECT id FROM "trial_bookings" WHERE user_id = $1::uuid`, USER)
  assert.equal(rows.length, 0)
})

test('without a Meet link configured the endpoint answers 503', { skip: !hasDb }, async () => {
  const saved = config.trial.meetLink
  config.trial.meetLink = ''
  try {
    const res = await call(ctrl.createTrialBooking, { reqBody: body() })
    assert.equal(res.code, 503)
    assert.equal(sent.length, 0)
  } finally { config.trial.meetLink = saved }
})

test('a mail failure still saves the row, with mailStatus failed and mailSent false', { skip: !hasDb }, async () => {
  ctrl._deps.sendMail = async () => ({ ok: false, error: 'boom' })
  try {
    const res = await call(ctrl.createTrialBooking, { reqBody: body() })
    assert.equal(res.code, 201)
    assert.equal(res.body.data.mailSent, false)
    assert.equal(res.body.data.booking.mailStatus, 'failed')
  } finally {
    ctrl._deps.sendMail = async (m) => { sent.push(m); return { ok: true, id: 'stub' } }
  }
})

test('upcoming returns the booking, and null after it is cancelled', { skip: !hasDb }, async () => {
  const made = await call(ctrl.createTrialBooking, { reqBody: body() })
  const id = made.body.data.booking.id

  let res = await call(ctrl.upcomingTrialBooking)
  assert.equal(res.code, 200)
  assert.equal(res.body.data.booking.id, id)

  res = await call(ctrl.cancelTrialBooking, { params: { id } })
  assert.equal(res.code, 200)
  assert.equal(res.body.data.booking.status, 'cancelled')

  res = await call(ctrl.upcomingTrialBooking)
  assert.equal(res.body.data.booking, null)

  // …and the slot is free to book again.
  res = await call(ctrl.createTrialBooking, { reqBody: body() })
  assert.equal(res.code, 201)
})

test('cancelling somebody else\'s booking is 404', { skip: !hasDb }, async () => {
  const made = await call(ctrl.createTrialBooking, { reqBody: body() })
  const res = await call(ctrl.cancelTrialBooking, { userId: OTHER, params: { id: made.body.data.booking.id } })
  assert.equal(res.code, 404)
})

test('a booking whose class has ended no longer counts as upcoming', { skip: !hasDb }, async () => {
  await db.$executeRawUnsafe(
    `INSERT INTO "trial_bookings" (user_id, parent_name, parent_email, parent_phone, child_class, subject, slot_at, meet_link, mail_status)
     VALUES ($1::uuid, 'M', 'm@x.com', '9876543210', 'Class 8', 'Maths', now() - interval '2 hours', 'https://meet.google.com/x', 'sent')`,
    USER,
  )
  const res = await call(ctrl.upcomingTrialBooking)
  assert.equal(res.body.data.booking, null)
  const made = await call(ctrl.createTrialBooking, { reqBody: body() })
  assert.equal(made.code, 201)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd server && node --test tests/trialBooking.db.test.js`
Expected: FAIL — `Cannot find module '../src/controllers/trialBooking.controller'` (with `DATABASE_URL` set; without it every test reports skipped — set it from `server/.env` to the local container to actually run).

- [ ] **Step 3: Write the controller** — `server/src/controllers/trialBooking.controller.js`:

```js
'use strict'

// Free demo-class booking from the parent app. The row in trial_bookings is the record;
// the two emails (parent confirmation, team copy) are built from it and sent from
// kids@. Mail failure is recorded on the row, not surfaced as a failed booking — the
// slot is taken either way, and the team copy or the admin can chase a lost email.

const db = require('../config/database')
const { config } = require('../config/env')
const ApiResponse = require('../utils/ApiResponse')
const mailer = require('../services/mailer')
const { trialBooked, trialBookedTeam } = require('../services/mailTemplates')
const { validateBookingInput, DURATION_MIN, toApi } = require('../services/trialBooking')

// Swappable for tests, which must not open SMTP.
const _deps = { sendMail: (m) => mailer.sendMail(m) }

// The user's one booking that is still ahead of them: booked, and its class has not
// ended. "Ended" rather than "started" so the Join button stays until the class is over.
async function findUpcoming(userId) {
  const rows = await db.$queryRawUnsafe(
    `SELECT * FROM "trial_bookings"
      WHERE user_id = $1::uuid AND status = 'booked'
        AND slot_at + make_interval(mins => duration_min) > now()
      ORDER BY slot_at ASC LIMIT 1`,
    userId,
  )
  return rows[0] || null
}

// POST /api/parent/trial-bookings
async function createTrialBooking(req, res, next) {
  try {
    const meetLink = config.trial.meetLink
    if (!meetLink) return ApiResponse.error(res, 'Demo booking is not set up yet — please try again later.', 503)

    const v = validateBookingInput(req.body)
    if (!v.ok) return ApiResponse.error(res, v.error, 422)

    if (await findUpcoming(req.user.id)) {
      return ApiResponse.error(res, 'You already have a demo booked. Cancel it first to pick another slot.', 409)
    }

    const { parentName, parentEmail, parentPhone, childName, childClass, subject, slotAt } = v.value
    const inserted = await db.$queryRawUnsafe(
      `INSERT INTO "trial_bookings"
         (user_id, parent_name, parent_email, parent_phone, child_name, child_class, subject, slot_at, duration_min, meet_link)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9::int, $10)
       RETURNING *`,
      req.user.id, parentName, parentEmail, parentPhone, childName, childClass, subject,
      slotAt.toISOString(), DURATION_MIN, meetLink,
    )
    let row = inserted[0]

    const facts = { parentName, parentEmail, parentPhone, childName, childClass, subject, slotAt, durationMin: DURATION_MIN, meetLink, bookingId: row.id }
    const [toParent, toTeam] = await Promise.all([
      _deps.sendMail({ to: parentEmail, from: config.trial.mailFrom, ...trialBooked(facts) }),
      _deps.sendMail({ to: config.trial.notifyEmail, from: config.trial.mailFrom, ...trialBookedTeam(facts) }),
    ])
    // The parent's copy is the one that matters for status; a lost team copy is a
    // nuisance, a lost parent copy is a no-show.
    const mailStatus = toParent.ok ? 'sent' : 'failed'
    if (!toTeam.ok) console.error(`[trial] team copy failed for ${row.id}: ${toTeam.error}`)
    const updated = await db.$queryRawUnsafe(
      `UPDATE "trial_bookings" SET mail_status = $2 WHERE id = $1::uuid RETURNING *`, row.id, mailStatus,
    )
    row = updated[0]

    return ApiResponse.created(res, { booking: toApi(row), mailSent: toParent.ok }, 'Demo booked')
  } catch (err) { next(err) }
}

// GET /api/parent/trial-bookings/upcoming
async function upcomingTrialBooking(req, res, next) {
  try {
    const row = await findUpcoming(req.user.id)
    return ApiResponse.success(res, { booking: row ? toApi(row) : null })
  } catch (err) { next(err) }
}

// POST /api/parent/trial-bookings/:id/cancel
async function cancelTrialBooking(req, res, next) {
  try {
    const id = String(req.params.id || '')
    if (!/^[0-9a-f-]{36}$/i.test(id)) return ApiResponse.error(res, 'Booking not found.', 404)
    const rows = await db.$queryRawUnsafe(
      `UPDATE "trial_bookings" SET status = 'cancelled', cancelled_at = now()
        WHERE id = $1::uuid AND user_id = $2::uuid AND status = 'booked'
        RETURNING *`,
      id, req.user.id,
    )
    if (!rows[0]) return ApiResponse.error(res, 'Booking not found.', 404)
    return ApiResponse.success(res, { booking: toApi(rows[0]) }, 'Demo cancelled')
  } catch (err) { next(err) }
}

module.exports = { createTrialBooking, upcomingTrialBooking, cancelTrialBooking, _deps }
```

- [ ] **Step 4: Add the routes** — in `server/src/routes/parent.js`:

```js
const { createTrialBooking, upcomingTrialBooking, cancelTrialBooking } = require('../controllers/trialBooking.controller')
```

and after `router.get('/progress/calendar', progressCalendar)`:

```js
// Free demo-class booking. Validation lives in services/trialBooking (one place, unit
// tested) rather than express-validator chains here.
router.post('/trial-bookings', createTrialBooking)
router.get('/trial-bookings/upcoming', upcomingTrialBooking)
router.post('/trial-bookings/:id/cancel', cancelTrialBooking)
```

- [ ] **Step 5: Run the DB tests**

Run: `cd server && node --test tests/trialBooking.db.test.js`
Expected: 8 PASS against the local container. Then `npm test` for the full suite: PASS.

- [ ] **Step 6: Smoke the route through HTTP** — start the server (`cd server && npm run dev`), get a JWT for any account (log in from the app, or use the `/api/auth/login` route with a dev account), then:

```bash
curl -s -X POST http://localhost:5000/api/parent/trial-bookings \
  -H "Authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"parentName":"Meera","parentEmail":"<your inbox>","parentPhone":"9876543210","childName":"Aarav","childClass":"Class 8","subject":"Maths","slotAt":"<ISO 3h from now>"}'
```

Expected: `201` with `booking` and `mailSent: true` when `TRIAL_MEET_LINK` and SMTP are set in `server/.env`; a `503` body when `TRIAL_MEET_LINK` is unset (set it locally to any `https://meet.google.com/…` for the smoke). In dev without SMTP the mailer logs the message to the console instead — read the Meet link there. Then `curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/parent/trial-bookings/upcoming` shows it.

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/trialBooking.controller.js server/src/routes/parent.js server/tests/trialBooking.db.test.js
git commit -m "Trial booking: create/upcoming/cancel endpoints under /api/parent

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: App API client

**Files:**
- Modify: `src/api/parentApi.js` (append)

**Interfaces:**
- Produces:
  - `createTrialBooking(input) → Promise<{ booking, mailSent }>`; throws with `err.status` (409/422/503) and `err.message` (the server's `error` string) on failure.
  - `getUpcomingTrialBooking() → Promise<booking|null>` (never throws; `null` on failure).
  - `cancelTrialBooking(id) → Promise<boolean>`.
  - `toAppBooking(apiBooking) → { id, date, durationMin, meetingUrl, subject, childName, childClass, parentEmail, mailStatus }` — the shape `UpcomingDemoCard`, `calendar.js` and `demoConfig.js` read (`date`, `durationMin`, `meetingUrl`).

- [ ] **Step 1: Append to `src/api/parentApi.js`**

```js
// ── Free demo-class booking ──────────────────────────────────────────────────
// The server row is snake_case-free already (toApi), but the dashboard card, the
// countdown helpers and the device-calendar sync all read `date` / `durationMin` /
// `meetingUrl`, so the API shape is adapted once here rather than at each reader.
export const toAppBooking = (b) => (b ? {
  id: b.id,
  date: b.slotAt,
  durationMin: b.durationMin,
  meetingUrl: b.meetLink,
  subject: b.subject,
  childName: b.childName,
  childClass: b.childClass,
  parentEmail: b.parentEmail,
  mailStatus: b.mailStatus,
} : null);

// POST /api/parent/trial-bookings. Throws on failure with `status` and the server's
// own message, so the flow can say "already booked" / "not set up yet" verbatim.
export const createTrialBooking = async (input) => {
  try {
    const res = await axiosInstance.post('/api/parent/trial-bookings', input);
    const d = res.data.data || {};
    return { booking: toAppBooking(d.booking), mailSent: d.mailSent !== false };
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.error || "Couldn't book the slot — please try again.";
    const e = new Error(message);
    e.status = status;
    throw e;
  }
};

export const getUpcomingTrialBooking = async () => {
  try {
    const res = await axiosInstance.get('/api/parent/trial-bookings/upcoming');
    return toAppBooking(res.data.data?.booking || null);
  } catch (err) {
    reportWarn('api/parentApi.js:getUpcomingTrialBooking', err);
    return null;
  }
};

export const cancelTrialBooking = async (id) => {
  try {
    await axiosInstance.post(`/api/parent/trial-bookings/${encodeURIComponent(id)}/cancel`);
    return true;
  } catch (err) {
    reportWarn('api/parentApi.js:cancelTrialBooking', err, { id });
    return false;
  }
};
```

- [ ] **Step 2: Parse-check**

Run (app root): `node -e "require('@babel/core').transformFileSync('src/api/parentApi.js',{presets:['babel-preset-expo']}); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add src/api/parentApi.js
git commit -m "Trial booking: app API client for create/upcoming/cancel

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: The booking flow screen

**Files:**
- Create: `src/screens/parent/ParentApp/TrialBookingFlow.js`
- Delete: `src/screens/parent/ParentApp/TrialBookingEmbed.js`
- Modify: `src/screens/parent/ParentApp/EventsCarousel.js:23` and `:1627` (import + usage)

**Interfaces:**
- Consumes: `buildDays`, `buildSlots`, `PERIODS`, `CLASSES`, `SUBJECTS`, `DEMO_DURATION_MIN`, `fmtDateLong`, `fmtTime` from `./demoConfig`; `createTrialBooking` from Task 5; `C`, `T` from `./constants`; `PressableScale`, `FadeIn` from `./anim`; `useAuth` for prefill.
- Produces: `export default function TrialBookingFlow({ visible, onClose, onBooked, childName, presetSubject })` — `onBooked(booking)` fires once with the `toAppBooking` shape after a successful POST; `presetSubject` (optional) preselects a subject (the program page passes its subject).

- [ ] **Step 1: Write the screen** — `src/screens/parent/ParentApp/TrialBookingFlow.js`:

```js
// src/screens/parent/ParentApp/TrialBookingFlow.js
// "Book a free class" — slot → details → done, booked on our own server.
//
// Replaces the Calendly embed. What Calendly gave us (a calendar, a Meet link, a
// confirmation email) the server now gives us: the slot list is generated here from
// demoConfig, the Meet link is a standing room the server knows, and the email goes
// out from kids@ailernova.com through Brevo. What we gain is the booking itself — a
// row we can see, a card on the dashboard, a cancel that means something.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Modal, ScrollView, TextInput, ActivityIndicator, Platform, StyleSheet, Linking } from 'react-native';
import { ArrowLeft, Video, Check, Mail, Copy } from 'lucide-react-native';
import { C, T } from './constants';
import { PressableScale, FadeIn } from './anim';
import { useAuth } from '../../../context/AuthContext';
import { createTrialBooking } from '../../../api/parentApi';
import { buildDays, buildSlots, PERIODS, CLASSES, SUBJECTS, DEMO_DURATION_MIN, fmtDateLong, fmtTime } from './demoConfig';

const DAYS_SHOWN = 7;

function Chip({ label, on, disabled, onPress, small }) {
  return (
    <PressableScale disabled={disabled} onPress={onPress}
      style={[s.chip, small && s.chipSmall, on && s.chipOn, disabled && s.chipOff]}>
      <T w="bold" s={small ? 13 : 14} c={on ? '#fff' : disabled ? C.faint : C.ink}>{label}</T>
    </PressableScale>
  );
}

function Field({ label, value, onChangeText, keyboardType, placeholder }) {
  return (
    <View style={s.field}>
      <T w="bold" s={10.5} c={C.faint} style={{ letterSpacing: 0.4 }}>{label}</T>
      {/* No autoFocus: react-native-web's Modal focus trap steals it on web (see aafba62). */}
      <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder}
        placeholderTextColor={C.faint} style={s.input} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'} />
    </View>
  );
}

function Eyebrow({ children }) {
  return <T w="bold" s={11} c={C.faint} style={{ letterSpacing: 0.6, marginTop: 18, marginBottom: 10 }}>{children}</T>;
}

export default function TrialBookingFlow({ visible, onClose, onBooked, childName, presetSubject }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0 slot, 1 details, 2 done
  const [day, setDay] = useState(null);
  const [period, setPeriod] = useState(PERIODS[1].key);
  const [slot, setSlot] = useState(null);
  const [f, setF] = useState({ parentName: '', parentEmail: '', parentPhone: '', childName: '', childClass: null, subject: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { booking, mailSent }

  // Fresh slots on every open (yesterday's "today" is gone), prefill from the login.
  const days = useMemo(() => (visible ? buildDays(DAYS_SHOWN) : []), [visible]);
  useEffect(() => {
    if (!visible) return;
    setStep(0); setDay(null); setSlot(null); setPeriod(PERIODS[1].key); setBusy(false); setError(''); setResult(null);
    setF({
      parentName: user?.name || '', parentEmail: user?.email || '', parentPhone: user?.phone || '',
      childName: childName || '', childClass: null, subject: SUBJECTS.includes(presetSubject) ? presetSubject : null,
    });
  }, [visible, user, childName, presetSubject]);

  const slots = useMemo(() => (day ? buildSlots(day, period) : []), [day, period]);
  const set = (patch) => setF((p) => ({ ...p, ...patch }));

  const slotOk = !!(day && slot);
  const detailsOk = !!(f.parentName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.parentEmail.trim())
    && f.parentPhone.replace(/\D/g, '').length >= 10 && f.childClass && f.subject);

  const back = () => {
    if (busy) return;
    if (step === 1) { setStep(0); setError(''); return; }
    onClose && onClose();
  };

  const submit = async () => {
    if (!detailsOk || !slotOk || busy) return;
    setBusy(true); setError('');
    try {
      const r = await createTrialBooking({
        parentName: f.parentName.trim(), parentEmail: f.parentEmail.trim(), parentPhone: f.parentPhone.trim(),
        childName: f.childName.trim() || undefined, childClass: f.childClass, subject: f.subject, slotAt: slot.iso,
      });
      setResult(r); setStep(2);
      onBooked && onBooked(r.booking);
    } catch (e) {
      setError(e.message || "Couldn't book the slot — please try again.");
    } finally { setBusy(false); }
  };

  const openMeet = () => { if (result?.booking?.meetingUrl) Linking.openURL(result.booking.meetingUrl); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={back} statusBarTranslucent>
      <View style={s.screen}>
        <View style={s.header}>
          {step !== 2 && (
            <PressableScale style={s.back} onPress={back} accessibilityLabel="Go back">
              <ArrowLeft size={24} color={C.ink} />
            </PressableScale>
          )}
          <T w="bold" s={20} c={C.ink}>{step === 2 ? 'You\'re booked' : 'Book a free class'}</T>
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <FadeIn key="slot" y={10} duration={240}>
              <T w="med" s={20} c={C.ink} style={{ lineHeight: 27 }}>
                Pick a <T w="xbold" s={20} c={C.ink}>time</T> for a live 1:1 class with an Ailernova mentor
              </T>
              <Eyebrow>SELECT A DAY</Eyebrow>
              <View style={s.wrap}>
                {days.map((d) => (
                  <Chip key={d.key} label={`${d.dow} ${d.dayNum} ${d.month}`} on={day?.key === d.key} disabled={!d.available}
                    onPress={() => { setDay(d); setSlot(null); }} />
                ))}
              </View>
              {!!day && (
                <>
                  <Eyebrow>SELECT A TIME · IST</Eyebrow>
                  <View style={s.tabRow}>
                    {PERIODS.map((p) => (
                      <PressableScale key={p.key} style={s.tab} onPress={() => { setPeriod(p.key); setSlot(null); }}>
                        <T w={period === p.key ? 'xbold' : 'semi'} s={14} c={period === p.key ? C.ink : C.faint}>{p.key}</T>
                        <View style={[s.tabRule, { backgroundColor: period === p.key ? C.gold : 'transparent' }]} />
                      </PressableScale>
                    ))}
                  </View>
                  <View style={s.wrap}>
                    {slots.map((sl) => (
                      <Chip key={sl.iso} small label={sl.label} on={slot?.iso === sl.iso} disabled={!sl.available} onPress={() => setSlot(sl)} />
                    ))}
                  </View>
                  {slots.every((sl) => !sl.available) && (
                    <T w="med" s={13} c={C.muted} style={{ marginTop: 8 }}>Nothing left in the {period.toLowerCase()} — try another period or day.</T>
                  )}
                </>
              )}
            </FadeIn>
          )}

          {step === 1 && (
            <FadeIn key="details" y={10} duration={240}>
              <T w="med" s={20} c={C.ink} style={{ lineHeight: 27 }}>
                A few <T w="xbold" s={20} c={C.ink}>details</T> so we can send the class link
              </T>
              <T w="semi" s={13} c={C.muted} style={{ marginTop: 6 }}>{fmtDateLong(slot.iso)} · {slot.label}</T>
              <Field label="YOUR NAME" value={f.parentName} onChangeText={(t) => set({ parentName: t })} />
              <Field label="EMAIL — THE MEET LINK GOES HERE" value={f.parentEmail} onChangeText={(t) => set({ parentEmail: t })} keyboardType="email-address" />
              <Field label="MOBILE NUMBER" value={f.parentPhone} onChangeText={(t) => set({ parentPhone: t })} keyboardType="phone-pad" />
              <Field label="CHILD'S NAME (OPTIONAL)" value={f.childName} onChangeText={(t) => set({ childName: t })} />
              <Eyebrow>CHILD'S CLASS</Eyebrow>
              <View style={s.wrap}>
                {CLASSES.map((c) => <Chip key={c} small label={c} on={f.childClass === c} onPress={() => set({ childClass: c })} />)}
              </View>
              <Eyebrow>SUBJECT</Eyebrow>
              <View style={s.wrap}>
                {SUBJECTS.map((sub) => <Chip key={sub} small label={sub} on={f.subject === sub} onPress={() => set({ subject: sub })} />)}
              </View>
              {!!error && <T w="semi" s={13} c={C.red} style={{ marginTop: 16 }}>{error}</T>}
            </FadeIn>
          )}

          {step === 2 && !!result && (
            <FadeIn key="done" y={10} duration={240} style={{ alignItems: 'center', paddingTop: 16 }}>
              <View style={s.tick}><Check size={30} color="#fff" strokeWidth={3} /></View>
              <T w="xbold" s={22} c={C.ink} style={{ marginTop: 20, textAlign: 'center' }}>Your free class is booked</T>
              <T w="semi" s={15} c={C.ink} style={{ marginTop: 14, textAlign: 'center' }}>{fmtDateLong(result.booking.date)} · {fmtTime(result.booking.date)}</T>
              <T w="med" s={13} c={C.muted} style={{ marginTop: 4, textAlign: 'center' }}>{result.booking.subject} · {DEMO_DURATION_MIN} min · Google Meet</T>

              <PressableScale style={s.meetRow} onPress={openMeet} accessibilityLabel="Open Google Meet link">
                <Video size={18} color={C.blue} />
                <T w="bold" s={13.5} c={C.blue} style={{ flex: 1 }} numberOfLines={1}>{result.booking.meetingUrl}</T>
                <Copy size={16} color={C.faint} />
              </PressableScale>

              {result.mailSent ? (
                <View style={s.note}>
                  <Mail size={15} color={C.green} />
                  <T w="semi" s={13} c={C.green} style={{ flex: 1 }}>We've emailed this to {result.booking.parentEmail}</T>
                </View>
              ) : (
                <View style={[s.note, s.noteWarn]}>
                  <Mail size={15} color={C.peachInk} />
                  <T w="semi" s={13} c={C.peachInk} style={{ flex: 1 }}>We couldn't send the email — please save this link. It's also on your dashboard.</T>
                </View>
              )}
              <T w="med" s={12.5} c={C.muted} style={{ marginTop: 18, textAlign: 'center', lineHeight: 18 }}>Join about 10 minutes early. Questions? kids@ailernova.com</T>
            </FadeIn>
          )}
        </ScrollView>

        <View style={s.footer}>
          {step === 0 && (
            <PressableScale disabled={!slotOk} style={slotOk ? s.btnOn : s.btnOff} onPress={() => setStep(1)}>
              <T w="bold" s={15.5} c={slotOk ? C.ink : '#9AA0AA'}>Next</T>
            </PressableScale>
          )}
          {step === 1 && (
            <PressableScale disabled={!detailsOk || busy} style={detailsOk && !busy ? s.btnOn : s.btnOff} onPress={submit}>
              {busy ? <ActivityIndicator color={C.ink} /> : <T w="bold" s={15.5} c={detailsOk ? C.ink : '#9AA0AA'}>Book my free class</T>}
            </PressableScale>
          )}
          {step === 2 && (
            <PressableScale style={s.btnOn} onPress={onClose}><T w="bold" s={15.5} c={C.ink}>Back to dashboard</T></PressableScale>
          )}
          {step < 2 && <T w="bold" s={12.5} c={C.faint} style={{ textAlign: 'center', marginTop: 12 }}>{step + 1} of 2</T>}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: '#C9CDD6', backgroundColor: '#fff' },
  chipSmall: { paddingVertical: 10, paddingHorizontal: 14 },
  chipOn: { backgroundColor: C.navy, borderColor: C.navy },
  chipOff: { backgroundColor: '#F3F4F6', borderColor: '#E6E8EC' },
  tabRow: { flexDirection: 'row', gap: 22, marginBottom: 14 },
  tab: { paddingBottom: 6 },
  tabRule: { height: 3, borderRadius: 2, marginTop: 6 },
  field: { marginTop: 18, borderWidth: 1, borderColor: '#C9CDD6', borderRadius: 10, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, backgroundColor: '#fff' },
  input: { fontSize: 16, color: C.ink, paddingVertical: 6, paddingHorizontal: 0 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 18, borderTopWidth: 1, borderTopColor: C.hair, backgroundColor: C.bg },
  btnOn: { backgroundColor: '#F9B234', borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  btnOff: { backgroundColor: '#D7DAE0', borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  tick: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#22B573', alignItems: 'center', justifyContent: 'center' },
  meetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, alignSelf: 'stretch', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.blueSoft },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, alignSelf: 'stretch', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: C.greenSoft },
  noteWarn: { backgroundColor: C.peach },
});
```

- [ ] **Step 2: Delete the Calendly embed and repoint the program page**

```bash
git rm src/screens/parent/ParentApp/TrialBookingEmbed.js
```

In `src/screens/parent/ParentApp/EventsCarousel.js`:
- line 23: `import TrialBookingEmbed from './TrialBookingEmbed';` → `import TrialBookingFlow from './TrialBookingFlow';`
- the comment + usage near line 1627 becomes:

```jsx
      {/* Different buttons, one booking flow. This entry point and the dashboard's
          "Book a free demo" both post to the same server endpoint, so every trial
          lands in one table. The program pages are the Maths curriculum (see
          downloadCurriculum: "<tab> · Maths Curriculum"), so Maths is preselected. */}
      <TrialBookingFlow visible={booking} onClose={() => setBooking(false)} presetSubject="Maths" />
```

(`cls` has `id`, `tab`, `topics`, `curriculumLead` — no `subject` field; the program pages are all Maths, hence the literal.)

- [ ] **Step 3: Parse-check both files**

Run (app root):
```bash
for f in src/screens/parent/ParentApp/TrialBookingFlow.js src/screens/parent/ParentApp/EventsCarousel.js; do node -e "require('@babel/core').transformFileSync('$f',{presets:['babel-preset-expo']}); console.log('ok $f')"; done
grep -rn "TrialBookingEmbed" src/ && echo "STALE REFERENCE" || echo "no stale refs"
```
Expected: two `ok` lines, `no stale refs` (ParentApp.js still imports it — fixed in Task 7, so expect one hit there until then; anything else is a bug).

- [ ] **Step 4: Commit**

```bash
git add -A src/screens/parent/ParentApp/TrialBookingFlow.js src/screens/parent/ParentApp/TrialBookingEmbed.js src/screens/parent/ParentApp/EventsCarousel.js
git commit -m "Trial booking: in-app slot/details/done flow replaces the Calendly embed

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Wire the dashboard — load, join, cancel; drop reschedule

**Files:**
- Modify: `src/screens/parent/ParentApp/ParentApp.js` (imports, state, handlers, the modal at the bottom)
- Modify: `src/screens/parent/ParentApp/UpcomingDemoCard.js:169-181` (actions row)
- Modify: `src/screens/parent/ParentApp/ClassesTab.js:91`
- Modify: `src/screens/parent/ParentApp/HomeTab.js:104-107` and `:230`
- Modify: `src/screens/parent/ParentApp/SessionsTab.js:107-116`

**Interfaces:**
- Consumes: `TrialBookingFlow` (Task 6), `getUpcomingTrialBooking`, `cancelTrialBooking` (Task 5), `addDemoToCalendar`/`removeDemoFromCalendar` (existing).

- [ ] **Step 1: ParentApp.js**

Imports — replace
```js
import { getParentReport } from '../../../api/parentApi';
```
with
```js
import { getParentReport, getUpcomingTrialBooking, cancelTrialBooking } from '../../../api/parentApi';
```
replace
```js
// Booking runs through Calendly.
import TrialBookingEmbed from './TrialBookingEmbed';
import { removeDemoFromCalendar } from './calendar';
```
with
```js
import TrialBookingFlow from './TrialBookingFlow';
import { addDemoToCalendar, removeDemoFromCalendar } from './calendar';
```
and add `Linking` to the react-native import: `import { View, SafeAreaView, Alert, Modal, Linking } from 'react-native';`

State — delete the line `const [rescheduleMode, setRescheduleMode] = useState(false);`. Change the booking comment to:
```js
  const [booking, setBooking] = useState(null); // the parent's upcoming free-demo booking, from the server
```

`load()` — the report and the booking are independent; fetch them together. Replace
```js
      const d = await getParentReport();
      if (!mounted.current) return;
      setReport(d); setErr(false);
```
with
```js
      const [d, b] = await Promise.all([getParentReport(), getUpcomingTrialBooking()]);
      if (!mounted.current) return;
      setReport(d); setBooking(b); setErr(false);
```

Handlers — replace the whole block from `// ── Free trial/demo booking` through the end of `handleCancelDemo` with:

```js
  // ── Free trial/demo booking ──────────────────────────────────────────────────
  // The server owns the booking (trial_bookings); this state mirrors the one
  // upcoming row. Cancel goes to the server first, then the device calendar.
  const handleBooked = useCallback(async (b) => {
    if (!mounted.current) return;
    setBooking(b);
    // Best effort — web has no calendar, a denied permission is fine.
    const r = await addDemoToCalendar(b);
    if (r.ok && mounted.current) setBooking((prev) => (prev && prev.id === b.id ? { ...prev, calendarEventId: r.eventId } : prev));
  }, []);
  const handleJoinDemo = useCallback((b) => {
    if (b && b.meetingUrl) Linking.openURL(b.meetingUrl);
    else flash('Your join link will be shared before the class');
  }, [flash]);
  const handleCancelDemo = useCallback((b) => {
    Alert.alert(
      'Cancel demo class?',
      'This frees up your slot. You can book another free demo anytime.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel demo',
          style: 'destructive',
          onPress: async () => {
            const ok = await cancelTrialBooking(b.id);
            if (!mounted.current) return;
            if (!ok) { flash("Couldn't cancel — check your connection"); return; }
            if (b.calendarEventId) await removeDemoFromCalendar(b.calendarEventId);
            if (mounted.current) { setBooking(null); flash('Demo cancelled'); }
          },
        },
      ],
    );
  }, [flash]);
```

`onBookTrial` — replace with:
```js
  const onBookTrial = useCallback(() => setTrialOpen(true), []); // "Book a FREE demo" → in-app flow
```

`shared` — remove `onRescheduleDemo: handleRescheduleDemo,` from the object.

The modal at the bottom — replace the comment + `<TrialBookingEmbed …/>` with:
```jsx
      {/* "Book a FREE trial" → slot, details, done. The server stores the row and
          emails the Meet link from kids@; `booking` mirrors it so the upcoming-demo
          card renders on Home and Sessions. */}
      <TrialBookingFlow
        visible={trialOpen}
        onClose={() => setTrialOpen(false)}
        onBooked={handleBooked}
        childName={child?.name}
      />
```

Note `Alert.alert` on web renders as `window.confirm`-style only for the two-button form on react-native-web — it is already used this way in this file for delete, so the behaviour is unchanged.

- [ ] **Step 2: UpcomingDemoCard.js** — drop Reschedule. Change the signature to `function UpcomingDemoCard({ booking, onJoin, onCancel })`, update the header comment line 6 to `// class window. Cancel inline. Pure presentation — persistence + calendar`, and replace the actions block:

```jsx
      {/* Cancel — rebooking is cancel + book again; there is no reschedule on the server. */}
      {!ended && (
        <View style={st.actions}>
          <PressableScale style={st.ghost} onPress={() => onCancel && onCancel(booking)} accessibilityLabel="Cancel demo">
            <X size={15} color="#FF8B8B" />
            <T w="bold" s={13.5} c="#FF8B8B">Cancel</T>
          </PressableScale>
        </View>
      )}
```
Remove `RefreshCw` from the lucide import if nothing else in the file uses it (`grep -n RefreshCw`).

- [ ] **Step 3: HomeTab.js and SessionsTab.js** — both render `<UpcomingDemoCard booking={booking} onJoin={onJoinDemo} onReschedule={onRescheduleDemo} onCancel={onCancelDemo} />`; drop `onReschedule={onRescheduleDemo}` in both, and remove `onRescheduleDemo` from both components' destructured props. In `HomeTab.js` `DemoCard`, change `{ Icon: Clock3, label: '60 min' }` to ``{ Icon: Clock3, label: `${DEMO_DURATION_MIN} min` }`` and add `import { DEMO_DURATION_MIN } from './demoConfig';`.

- [ ] **Step 4: ClassesTab.js** — line 91: remove `onBookTrial` from the destructured props (it was never used).

- [ ] **Step 5: Parse-check and sweep**

Run (app root):
```bash
for f in ParentApp HomeTab SessionsTab ClassesTab UpcomingDemoCard TrialBookingFlow EventsCarousel; do node -e "require('@babel/core').transformFileSync('src/screens/parent/ParentApp/$f.js',{presets:['babel-preset-expo']}); console.log('ok $f')"; done
grep -rn "TrialBookingEmbed\|rescheduleMode\|handleRescheduleDemo\|onRescheduleDemo\|onReschedule\b\|updateDemoInCalendar" src/ || echo "clean"
```
Expected: seven `ok`, then `clean` — except `updateDemoInCalendar` in `calendar.js` itself, which stays (unused export, harmless; leave it).

- [ ] **Step 6: Run it** — `npm run web`, log in, choose Parent (or a parent account), Home → "Book your free class" → pick a day/slot → Next → details → "Book my free class". Expected: done screen with the Meet link; close → the dark "Upcoming demo" card on Home and Sessions with the countdown; reload the page → card still there (fetched from the server); Cancel → card gone. Check the inbox for the parent email and `kids@ailernova.com` for the team copy (needs `TRIAL_MEET_LINK` + SMTP in `server/.env`; without SMTP the server console shows the mail).

- [ ] **Step 7: Commit**

```bash
git add src/screens/parent/ParentApp/ParentApp.js src/screens/parent/ParentApp/UpcomingDemoCard.js src/screens/parent/ParentApp/HomeTab.js src/screens/parent/ParentApp/SessionsTab.js src/screens/parent/ParentApp/ClassesTab.js
git commit -m "Trial booking: dashboard loads, joins and cancels the server booking

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Deploy notes and final verification

**Files:**
- Modify: `docs/superpowers/specs/2026-09-18-trial-booking-brevo-design.md` (status line → `implemented`)
- Modify: `server/prisma/sql/trial_bookings.sql` header already carries the run command; nothing else.

- [ ] **Step 1: Full server suite with the DB**

Run: `cd server && npm test`
Expected: PASS, including `trialBooking.db.test.js` (8 tests) and the mail template tests.

- [ ] **Step 2: Brevo sender check** — with the server running locally against the real SMTP values (`SMTP_USER`/`SMTP_PASS` from Render), `curl -s http://localhost:5000/api/health | grep -i mail` should report the transport as configured/verified. Then book once with your own email as `parentEmail` and confirm the message arrives **from** `Ailernova Kids <kids@ailernova.com>`. If Brevo answers `550` on the send, `kids@ailernova.com` is not yet a verified sender: add it under Brevo → Senders, click the verification link, retry. Until then set `TRIAL_MAIL_FROM` to the verified `MAIL_FROM` value.

- [ ] **Step 3: Update the spec status** — change `**Status:** draft, awaiting review` to `**Status:** implemented on feat/trial-booking (2026-09-18); pending: run trial_bookings.sql on production, set TRIAL_MEET_LINK on Render, verify kids@ailernova.com in Brevo`.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-09-18-trial-booking-brevo-design.md
git commit -m "Trial booking: spec status and deploy checklist

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 5: Report** what is done, what was verified (test output, the email that arrived), and the three production steps that remain for a human: run the SQL on Render's DB, set `TRIAL_MEET_LINK`, verify the sender in Brevo.
