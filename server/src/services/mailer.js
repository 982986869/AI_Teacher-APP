'use strict'

// Transactional email. One provider (Resend), called over plain fetch so nothing
// new is installed — the SDK is a thin wrapper over this same endpoint.
//
// Deliberately NOT a general mail library: the app sends exactly one kind of mail
// today, and a queue, templates and retries would all be scaffolding around a
// single message.
//
// Env:
//   RESEND_API_KEY   required to actually send; without it nothing is sent
//   MAIL_FROM        e.g. "Ailernova <noreply@ailernova.com>" — must be a domain
//                    verified in Resend, or every send is rejected
//   APP_PUBLIC_URL   base URL the reset link points at (defaults to the API's own
//                    origin, which serves the reset page)

const { config } = require('../config/env')

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

const mail = {
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.MAIL_FROM || 'Ailernova <onboarding@resend.dev>',
  enabled: !!process.env.RESEND_API_KEY,
}

// Send one message. Returns { ok, id } or { ok: false, error }.
//
// A failure here must NEVER fail the caller's request: /forgot-password answers the
// same way whether or not the address exists, and letting a provider outage change
// that answer would leak which addresses are real. The caller logs and moves on.
async function sendMail({ to, subject, html, text }) {
  if (!mail.enabled) {
    // Development, and any deploy where the key was not set. The link is printed so
    // the flow is testable end to end without a provider account — never in
    // production, where config.env is not 'development'.
    if (config.env !== 'production') {
      console.log(`\n[mail] RESEND_API_KEY not set — not sending.\n[mail] to: ${to}\n[mail] ${subject}\n[mail] ${text}\n`)
    } else {
      console.error('[mail] RESEND_API_KEY not set — password reset mail was NOT sent')
    }
    return { ok: false, error: 'mailer not configured' }
  }

  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${mail.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ from: mail.from, to: [to], subject, html, text }),
    })
    if (!r.ok) {
      const detail = await r.text()
      console.error(`[mail] send failed: ${r.status} ${detail.slice(0, 200)}`)
      return { ok: false, error: `provider ${r.status}` }
    }
    const body = await r.json().catch(() => ({}))
    return { ok: true, id: body.id }
  } catch (err) {
    console.error('[mail] send threw:', err.message)
    return { ok: false, error: err.message }
  }
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

module.exports = { sendMail, resetPasswordEmail, mail }
