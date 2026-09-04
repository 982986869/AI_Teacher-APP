'use strict'

const nodemailer = require('nodemailer')
const { config } = require('../../config/env')
const templates = require('./templates')

// The one place this server sends email from.
//
// There is no "Mailtrap mode" and no "production mode" — Mailtrap's sandbox, a relay
// and a transactional provider are all plain SMTP, so switching between them is the
// MAIL_* environment variables and nothing else. Sandbox credentials simply cause the
// mail to stop in Mailtrap's inbox instead of reaching a real one.
//
// With no credentials at all, every message is written to the log in full. That is
// deliberate: it keeps local development working with no account anywhere, and it means
// a missing credential in production shows up as a readable log line rather than an
// exception thrown from inside someone's account deletion.

let transporter = null

// Built on first use, not at require time: constructing it opens no socket, but tests
// and scripts that never send mail should not have to care about SMTP config at all.
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: { user: config.mail.user, pass: config.mail.pass },
    })
  }
  return transporter
}

function logInstead(to, subject, text, why) {
  console.log(
    [
      '',
      '──────────────────────────────────────────────────────────────',
      `  EMAIL NOT SENT (${why}) — printed here instead`,
      `  To:      ${to}`,
      `  Subject: ${subject}`,
      '──────────────────────────────────────────────────────────────',
      text,
      '──────────────────────────────────────────────────────────────',
      '',
    ].join('\n'),
  )
}

/**
 * Send one message. Resolves to a small result rather than throwing, ever.
 *
 * Every caller sits in a path where the email is the secondary effect: the account has
 * already been deleted, or restored, by the time this runs. A send that throws would
 * turn a completed action into a 500 and tell the student their deletion failed when
 * it did not — so failures are logged and reported, never raised.
 *
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
async function send({ to, subject, text, html }) {
  if (!to) {
    // Accounts created through the phone path have no email address at all. Nothing to
    // do, and nothing wrong — the caller carries on.
    logInstead('(no address on this account)', subject, text, 'no recipient')
    return { sent: false, reason: 'no-recipient' }
  }

  if (!config.mail.enabled) {
    logInstead(to, subject, text, 'MAIL_HOST / MAIL_USER / MAIL_PASS not set')
    return { sent: false, reason: 'not-configured' }
  }

  try {
    await getTransporter().sendMail({ from: config.mail.from, to, subject, text, html })
    return { sent: true }
  } catch (err) {
    // Loud, because a silent mail failure looks exactly like a working system until a
    // student says they never got their restore link.
    console.error(`[mail] failed to send "${subject}" to ${to}: ${err.message}`)
    return { sent: false, reason: 'send-failed' }
  }
}

// ─── The three messages ──────────────────────────────────────────────────────

const sendAccountDeleted = ({ to, name, purgeDueAt }) =>
  send({ to, ...templates.accountDeleted({ name, purgeDueAt }) })

const sendReactivation = ({ to, name, link, code, expiresInHours }) =>
  send({ to, ...templates.reactivate({ name, link, code, expiresInHours }) })

// Goes to staff, not to a student — so the recipient comes from configuration.
const sendAdminDigest = ({ rows }) =>
  send({ to: config.mail.adminTo, ...templates.adminDigest({ rows }) })

module.exports = {
  send, sendAccountDeleted, sendReactivation, sendAdminDigest,
  isConfigured: () => config.mail.enabled,
}
