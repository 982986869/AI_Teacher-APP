'use strict'

// The wording of the account-deletion messages.
//
// Kept apart from services/mailer, which sends them, so the copy can be read, reviewed
// and tested without touching SMTP — tests/mail.test.js renders each one and asserts on
// what it says. Each returns { subject, text, html }, which is exactly the shape
// mailer.sendMail takes, so a caller is: sendMail({ to, ...accountDeleted({ … }) }).
//
// (mailer.js carries resetPasswordEmail inline, from when there was one message. These
// live out here because there are now several and they have real copy to review.)
//
// The text part is not a fallback to be neglected: plenty of people read mail as plain
// text, and a message that only makes sense in HTML reads to them as an empty envelope.

const { GRACE_PERIOD_DAYS } = require('./accountDeletion')
const { istDate, istRange, istTime, DURATION_MIN } = require('./trialBooking')

// Inline styles only, a table-free single column, and no external images. Mail clients
// strip <style> blocks, block remote content by default, and render floats unevenly —
// this is the shape that survives all of them.
function layout(bodyHtml) {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f4f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <div style="font-size:18px;font-weight:700;color:#5b3df5;margin-bottom:24px;">Ailernova</div>
${bodyHtml}
    <hr style="border:none;border-top:1px solid #e6e6ea;margin:32px 0 16px;">
    <div style="font-size:12px;color:#8a8a94;line-height:1.5;">
      This is an automated message from Ailernova. If you were not expecting it, you can ignore it safely.
    </div>
  </div>
</body></html>`
}

const p = (t) => `    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${t}</p>`

// Formats a date the way a person reads one. Deliberately not a raw timestamp: the
// student is being told a deadline, and "2026-10-03T09:12:44.318Z" is not a deadline.
const onDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

const hello = (name) => (name ? `Hi ${name},` : 'Hi,')

// ─── 1. You deleted your account ─────────────────────────────────────────────
//
// Sent immediately on soft delete. Its real job is the second paragraph: the person
// has just done something destructive and needs to know it is not yet final, and
// exactly how long they have.

function accountDeleted({ name, purgeDueAt }) {
  const by = onDate(purgeDueAt)
  const subject = 'Your Ailernova account has been deactivated'
  const text = [
    hello(name),
    '',
    'Your Ailernova account has been deactivated and you have been signed out.',
    '',
    `Changed your mind? You have until ${by} to bring it back with everything still in it —`,
    'your lessons, your progress and your notes. Just try to sign in with this email address',
    'and the app will offer to restore the account.',
    '',
    `After ${by} the account and its data are removed for good and cannot be recovered.`,
    '',
    '— Ailernova',
  ].join('\n')

  const html = layout([
    p(hello(name)),
    p('Your Ailernova account has been <strong>deactivated</strong> and you have been signed out.'),
    p(`Changed your mind? You have until <strong>${by}</strong> to bring it back with everything still in it — your lessons, your progress and your notes. Just try to sign in with this email address and the app will offer to restore the account.`),
    p(`After ${by} the account and its data are removed for good and cannot be recovered.`),
  ].join('\n'))

  return { subject, text, html }
}

// ─── 2. Restore your account ─────────────────────────────────────────────────
//
// Carries a link AND a code on purpose. The link is the easy path; the code is what
// works when the link is opened on a different device from the one the app is on,
// or when a mail client mangles it.

function reactivate({ name, link, code, expiresInHours }) {
  const subject = 'Restore your Ailernova account'
  const text = [
    hello(name),
    '',
    'Someone asked to restore the Ailernova account for this email address.',
    '',
    'Open this link to restore it:',
    link,
    '',
    `Or enter this code in the app: ${code}`,
    '',
    `Either one works once, and stops working in ${expiresInHours} hours.`,
    '',
    "If this wasn't you, ignore this email — nothing changes and the account stays deactivated.",
    '',
    '— Ailernova',
  ].join('\n')

  const html = layout([
    p(hello(name)),
    p('Someone asked to restore the Ailernova account for this email address.'),
    `    <p style="margin:0 0 24px;"><a href="${link}" style="display:inline-block;background:#5b3df5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;">Restore my account</a></p>`,
    p('Or enter this code in the app:'),
    `    <div style="font-size:28px;font-weight:700;letter-spacing:6px;color:#5b3df5;margin:0 0 20px;">${code}</div>`,
    p(`Either one works once, and stops working in ${expiresInHours} hours.`),
    p("If this wasn't you, ignore this email — nothing changes and the account stays deactivated."),
  ].join('\n'))

  return { subject, text, html }
}

// ─── 3. Daily digest for staff ───────────────────────────────────────────────
//
// A reminder, never the record. The admin console's deletion queue is the record —
// it is derived from deleted_at, so an account cannot be missed just because one
// morning's mail bounced. See controllers/admin/deletionQueue.controller.

function adminDigest({ rows }) {
  const n = rows.length
  const subject = n === 1
    ? '1 Ailernova account is ready to be deleted'
    : `${n} Ailernova accounts are ready to be deleted`

  const line = (r) =>
    `  • ${r.email || r.name || r.id} — deleted ${onDate(r.deletedAt)} (${r.daysWaiting} days ago)`

  const text = [
    `${n} account${n === 1 ? ' has' : 's have'} passed the ${GRACE_PERIOD_DAYS}-day grace period and can now be permanently deleted:`,
    '',
    ...rows.map(line),
    '',
    'Open the admin console → Users → Deleted to remove them.',
    '',
    'This is a reminder only. The console list is the source of truth — nothing is missed if this email fails.',
  ].join('\n')

  const html = layout([
    p(`<strong>${n} account${n === 1 ? '' : 's'}</strong> passed the ${GRACE_PERIOD_DAYS}-day grace period and can now be permanently deleted:`),
    `    <ul style="font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 16px;">`,
    ...rows.map((r) => `      <li>${r.email || r.name || r.id} — deleted ${onDate(r.deletedAt)} (${r.daysWaiting} days ago)</li>`),
    `    </ul>`,
    p('Open the admin console → Users → Deleted to remove them.'),
    p('<em>This is a reminder only. The console list is the source of truth — nothing is missed if this email fails.</em>'),
  ].join('\n'))

  return { subject, text, html }
}

// ─── 4. Your free demo class is booked ───────────────────────────────────────
//
// The one email a parent must be able to find on the day: when, and the link. The link
// appears twice on purpose — as a button and as bare text — because some clients strip
// the button styling and a link a person cannot copy is not a link.

const shortDay = (d) =>
  new Date(d).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' })

// "Maths for Aarav, Class 8 (CBSE)" — the board in brackets, dropped when unknown.
function classLine({ childName, childClass, board, subject }) {
  const cls = board ? `${childClass} (${board})` : childClass
  return childName ? `${subject} for ${childName}, ${cls}` : `${subject}, ${cls}`
}

function trialBooked({ parentName, childName, childClass, board, subject, slotAt, durationMin = DURATION_MIN, meetLink }) {
  const when = `${istDate(slotAt)}, ${istRange(slotAt, durationMin)} (IST)`
  const what = classLine({ childName, childClass, board, subject })
  const text = [
    hello(parentName),
    '',
    'Your free demo class is booked.',
    '',
    `Class: ${what}`,
    `When: ${when}`,
    `Join on Google Meet: ${meetLink}`,
    '',
    'Please join about 10 minutes early so the mentor can say hello and check the audio.',
    'If the time no longer works, you can cancel from the app and book another slot, or write to kids@ailernova.com.',
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

function trialBookedTeam({ parentName, parentEmail, parentPhone, childName, childClass, board, subject, slotAt, durationMin = DURATION_MIN, meetLink, bookingId }) {
  const rows = [
    ['When', `${istDate(slotAt)}, ${istRange(slotAt, durationMin)} (IST)`],
    ['Class', classLine({ childName, childClass, board, subject })],
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

module.exports = { accountDeleted, reactivate, adminDigest, trialBooked, trialBookedTeam }
