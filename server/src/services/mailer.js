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

const smtpHost = env('SMTP_HOST')
const smtpPort = parseInt(env('SMTP_PORT'), 10) || 587

const mail = {
  // No default sender: a made-up From is rejected by every provider, and a silent
  // rejection is worse than an obvious missing value.
  from: env('MAIL_FROM') || 'Ailernova <noreply@ailernova.com>',
  transport: smtpHost ? 'smtp' : 'none',
  enabled: !!smtpHost,
  // Which of the four are actually present. `enabled` asks only whether a host
  // is set, which is not the same question: SMTP_HOST has a value in render.yaml
  // and deploys on its own, while SMTP_USER and SMTP_PASS are sync:false and have
  // to be typed into the dashboard. A host with no credentials looks enabled,
  // selects the smtp transport, and then fails authentication on every send —
  // which is exactly the state production was found in.
  missing: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter((k) => !env(k)),
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
function resetPasswordEmail({ name, link, minutes }) {
  const who = name ? `Hi ${name},` : 'Hi,'
  const text = [
    who,
    '',
    'Someone asked to reset the password for your Ailernova account.',
    `Open this link to choose a new one. It works once and expires in ${minutes} minutes:`,
    '',
    link,
    '',
    'If this was not you, you can ignore this email — your password stays as it is.',
    '',
    'Ailernova',
  ].join('\n')

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#F7F7F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:28px">
    <p style="margin:0 0 16px;font-size:15px">${who}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55">
      Someone asked to reset the password for your Ailernova account.
      Choose a new one below. The link works <b>once</b> and expires in <b>${minutes} minutes</b>.
    </p>
    <p style="margin:24px 0">
      <a href="${link}" style="display:inline-block;background:#7C4DFF;color:#fff;text-decoration:none;
         padding:13px 22px;border-radius:10px;font-weight:700;font-size:15px">Choose a new password</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#666">Or paste this into your browser:</p>
    <p style="margin:0 0 20px;font-size:13px;color:#666;word-break:break-all">${link}</p>
    <p style="margin:0;font-size:13px;color:#666;line-height:1.55">
      If this was not you, ignore this email — your password stays as it is.
    </p>
  </div>
</body></html>`

  return { subject: 'Reset your Ailernova password', html, text }
}

module.exports = { sendMail, resetPasswordEmail, verifyTransport, mail }
