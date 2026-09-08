'use strict'

// Transactional email. One message type today (the password reset), so this is a
// sender and not a mail framework — no queue, no templates, no retries.
//
// SMTP only, over nodemailer. Works with Mailtrap, Brevo, Gmail, Office 365 or any
// other provider — the four env values below are the whole configuration.
//
// A Resend-over-HTTP path used to sit alongside this. It was removed: two transports
// meant two code paths to keep correct for one message type, and the one that could
// not send to real students without a verified sending domain was the one that looked
// configured. SMTP has no such gate, so there is nothing the second path bought.
//
// Without SMTP_HOST nothing is sent. Outside production the message is logged so the
// reset link is still usable in development.
//
// Env:
//   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS   (SMTP_SECURE=true forces TLS)
//   MAIL_FROM        "Ailernova <noreply@ailernova.com>"
//   APP_PUBLIC_URL   base URL the reset link points at
const { config } = require('../config/env')

// Trimmed, every one of them. A value pasted into a dashboard field can carry a
// trailing newline or space, and the failure that produces is genuinely hard to
// read: production answered ENOTFOUND for a hostname that reads correctly both in
// the error and in the dashboard, because the value carried a trailing newline.
// Credentials fail the same way: an authentication error that looks like a wrong
// password rather than a stray character.
const env = (k) => (process.env[k] || '').trim()

// The relay wins when it is configured. Render cannot open SMTP at all — 465 and
// 587 both time out while the same credentials work from anywhere else — so on
// that host SMTP_HOST is present and useless. Preferring the relay means one set
// of variables can serve both places: SMTP locally, relay in production.
const relayUrl = env('MAIL_RELAY_URL')
const relaySecret = env('MAIL_RELAY_SECRET')

const smtpHost = env('SMTP_HOST')
const smtpPort = parseInt(env('SMTP_PORT'), 10) || 587

const mail = {
  // No default sender: a made-up From is rejected by every provider, and a silent
  // rejection is worse than an obvious missing value.
  from: env('MAIL_FROM') || 'Ailernova <noreply@ailernova.com>',
  transport: (relayUrl && relaySecret) ? 'relay' : (smtpHost ? 'smtp' : 'none'),
  enabled: !!((relayUrl && relaySecret) || smtpHost),
  // Which of the four are actually present. `enabled` asks only whether a host
  // is set, which is not the same question: SMTP_HOST has a value in render.yaml
  // and deploys on its own, while SMTP_USER and SMTP_PASS are sync:false and have
  // to be typed into the dashboard. A host with no credentials looks enabled,
  // selects the smtp transport, and then fails authentication on every send —
  // which is exactly the state production was found in.
  missing: (relayUrl || relaySecret)
    ? ['MAIL_RELAY_URL', 'MAIL_RELAY_SECRET'].filter((k) => !env(k))
    : ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter((k) => !env(k)),
}

// Built once and reused: a transport per message would open a new TCP+TLS
// connection every time, which is what makes naive SMTP senders slow.
let _tx = null
function transporter() {
  if (_tx) return _tx
  const nodemailer = require('nodemailer')
  _tx = nodemailer.createTransport({
    host: smtpHost,
    // IPv4 only. smtp.hostinger.com publishes an AAAA record, Node prefers it, and
    // Render has no IPv6 route — so production answered
    // "connect ENETUNREACH 2606:4700:...:587" while the same host and port worked
    // from anywhere with IPv6. Pinning the family removes the difference between
    // where this is tested and where it runs.
    family: 4,
    port: smtpPort,
    // 465 is implicit TLS; 587 and 2525 start plaintext and STARTTLS up, which is
    // what Mailtrap and most providers expect. Overridable for the rare host that
    // wants TLS on a non-standard port.
    secure: env('SMTP_SECURE') ? env('SMTP_SECURE') === 'true' : smtpPort === 465,
    auth: (env('SMTP_USER') || env('SMTP_PASS'))
      ? { user: env('SMTP_USER'), pass: env('SMTP_PASS') }
      : undefined,
  })
  return _tx
}

// Send one message. Returns { ok, id } or { ok: false, error }.
//
// A failure here must NEVER fail the caller's request: /forgot-password answers the
// same way whether or not the address exists, and letting a provider outage change
// that answer would leak which addresses are real. The caller logs and moves on.
async function sendMail({ to, subject, html, text }) {
  if (mail.transport === 'relay') {
    try {
      const r = await fetch(relayUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-relay-key': relaySecret },
        body: JSON.stringify({ to, subject, html, text }),
      })
      const body = await r.json().catch(() => ({}))
      if (!r.ok || !body.ok) {
        console.error(`[mail] relay failed: ${r.status} ${body.error || mail.transport}`)
        return { ok: false, error: body.error || `relay ${r.status}` }
      }
      return { ok: true, id: body.id }
    } catch (err) {
      console.error('[mail] relay threw:', err.message)
      return { ok: false, error: err.message }
    }
  }

  if (mail.transport === 'smtp') {
    try {
      const info = await transporter().sendMail({ from: mail.from, to, subject, html, text })
      return { ok: true, id: info.messageId }
    } catch (err) {
      console.error(`[mail] smtp send failed: ${err.message}`)
      return { ok: false, error: err.message }
    }
  }

  // config.nodeEnv, not config.env — there is no 'env' key, so this read was always
  // undefined and the branch always took the development path. In production that printed
  // the whole message, reset link included, into the logs.
  if (config.nodeEnv !== 'production') {
    console.log(`\n[mail] no transport configured — not sending.\n[mail] to: ${to}\n[mail] ${subject}\n[mail] ${text}\n`)
  } else {
    console.error('[mail] no transport configured — password reset mail was NOT sent')
  }
  return { ok: false, error: 'mailer not configured' }
}

// Prove the transport works without sending anything: connect and authenticate, the
// two things that fail silently once /forgot-password starts answering the same way
// whether or not the mail went out.
async function verifyTransport() {
  if (mail.transport === 'relay') {
    try {
      // A GET reaches the same file and is refused with 405, which proves the URL
      // resolves and the script is running without sending anything.
      const r = await fetch(relayUrl, { method: 'GET' })
      const ok = r.status === 405 || r.status === 401
      return { ok, transport: 'relay', detail: ok ? `${relayUrl} responding` : `unexpected ${r.status} from ${relayUrl}` }
    } catch (err) {
      return { ok: false, transport: 'relay', detail: err.message }
    }
  }
  if (mail.transport === 'smtp') {
    try {
      await transporter().verify()
      return { ok: true, transport: 'smtp', detail: `${smtpHost}:${smtpPort}` }
    } catch (err) {
      return { ok: false, transport: 'smtp', detail: err.message }
    }
  }
  return { ok: false, transport: 'none', detail: 'set SMTP_HOST' }
}

// The reset message. Plain and short on purpose: a long marketing-styled mail with
// a bare link is exactly what a phishing filter — and a cautious student — distrusts.
// The same reset, two ways out of one email.
//
// The code is what a student on a phone uses: they read six digits and type them
// back into the app they already have open. The link is for mail opened on a
// desktop, where there is no app to type them into. Both address the same row, so
// whichever is used first spends the other.
//
// The code leads because the phone is the common case. Putting the button first
// would send a student to a browser for a reset the app can finish itself.
function resetPasswordEmail({ name, link, code, minutes }) {
  const who = name ? `Hi ${name},` : 'Hi,'
  // 483920 is unreadable at a glance; 483 920 is. The app strips the space.
  const spaced = code ? `${String(code).slice(0, 3)} ${String(code).slice(3)}` : ''

  const text = [
    who,
    '',
    'Someone asked to reset the password for your Ailernova account.',
    '',
    ...(code ? [`Your code is ${code}`, '', `Type it into the app. It works once and expires in ${minutes} minutes.`, ''] : []),
    ...(link ? ['Not on your phone? Open this link instead:', '', link, ''] : []),
    'If this was not you, you can ignore this email — your password stays as it is.',
    '',
    'Ailernova',
  ].join('\n')

  // Table layout and inline styles throughout: Gmail strips <style> blocks and
  // Outlook ignores most of flexbox, so anything structural has to be attributes
  // on a table. letter-spacing on the digits is the one thing that degrades
  // gracefully if a client drops it.
  const codeBlock = code ? `
    <div style="margin:22px 0;padding:18px 20px;background:#F4F1FF;border:1px solid #E3DAFF;border-radius:12px;text-align:center">
      <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6B5BA8;margin:0 0 8px">Your reset code</div>
      <div style="font-size:32px;font-weight:700;letter-spacing:0.14em;color:#3B2E6B;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace">${spaced}</div>
      <div style="font-size:13px;color:#6B5BA8;margin:10px 0 0">Type this into the app. Expires in ${minutes} minutes.</div>
    </div>` : ''

  const linkBlock = link ? `
    <p style="margin:0 0 6px;font-size:13px;color:#666">Reading this on a computer? Use this instead:</p>
    <p style="margin:0 0 20px">
      <a href="${link}" style="display:inline-block;background:#7C4DFF;color:#fff;text-decoration:none;
         padding:11px 20px;border-radius:10px;font-weight:700;font-size:14px">Choose a new password</a>
    </p>` : ''

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#F7F7F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:28px">
    <p style="margin:0 0 16px;font-size:15px">${who}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55">
      Someone asked to reset the password for your Ailernova account.
    </p>${codeBlock}${linkBlock}
    <p style="margin:0;font-size:13px;color:#666;line-height:1.55">
      If this was not you, ignore this email — your password stays as it is.
      Nobody can change it without the code above.
    </p>
  </div>
</body></html>`

  // The subject carries the code too: on a lock screen that is often the whole
  // interaction — read the notification, type the digits, never open the mail.
  const subject = code ? `${code} is your Ailernova reset code` : 'Reset your Ailernova password'
  return { subject, html, text }
}

module.exports = { sendMail, resetPasswordEmail, verifyTransport, mail }
