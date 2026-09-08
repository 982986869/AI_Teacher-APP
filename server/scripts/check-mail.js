'use strict'

// Does the app have a working way to send email?
//
//   node server/scripts/check-mail.js                 # connect + authenticate only
//   node server/scripts/check-mail.js you@example.com # ...and send a real test message
//
// Reads server/.env, so credentials never have to be pasted anywhere committable
// (server/.gitignore already covers .env*).
//
// The password reset is the only mail the app sends, and routes/auth.js answers
// /forgot-password identically whether or not the mail went out — deliberately, so
// the endpoint cannot be used to discover which addresses are registered. That means
// a broken mailer is INVISIBLE from the outside: the app says "a reset link is on its
// way" either way. This is how you find out.

const fs = require('fs')
const path = require('path')

const ENV = path.join(__dirname, '..', '.env')
if (fs.existsSync(ENV)) {
  for (const line of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const { sendMail, resetPasswordEmail, verifyTransport, mail } = require('../src/services/mailer')

const ok = (m) => console.log('  \u2713 ' + m)
const no = (m) => console.log('  \u2717 ' + m)

async function main() {
  const to = process.argv[2]
  console.log('\nMail check')
  console.log(`  transport : ${mail.transport}`)
  console.log(`  from      : ${mail.from}`)
  if (mail.transport === 'smtp') {
    console.log(`  host      : ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`)
    console.log(`  user      : ${process.env.SMTP_USER || '(none)'}`)
  }
  console.log('')

  if (mail.transport === 'none') {
    no('no transport configured')
    console.log('')
    console.log('  Set these in server/.env:')
    console.log('')
    console.log('    SMTP_HOST=sandbox.smtp.mailtrap.io')
    console.log('    SMTP_PORT=2525')
    console.log('    SMTP_USER=...')
    console.log('    SMTP_PASS=...')
    console.log('    MAIL_FROM=Ailernova <noreply@ailernova.com>')
    console.log('')
    console.log('  We send through Brevo on port 2525 — not because 2525 is better, but')
    console.log('  because Render\'s free plan drops outbound 465 and 587 to every')
    console.log('  host, and 2525 is the one SMTP port it lets out. Brevo shows 587 in its')
    console.log('  own dashboard; it answers on both, so use the one that also works in')
    console.log('  production. Values: app.brevo.com/settings/keys/smtp')
    console.log('')
    process.exit(1)
  }

  const v = await verifyTransport()
  ;(v.ok ? ok : no)(`${v.transport}: ${v.detail}`)
  if (!v.ok) {
    console.log('\n  Reaching AUTH at all means the port, TLS and host are fine — only the')
    console.log('  credentials are wrong. SMTP_PASS must be the Brevo SMTP KEY (it starts')
    console.log('  xsmtpsib-), not the Brevo account password and not the old mail password.')
    console.log('  Generate one at app.brevo.com/settings/keys/smtp.\n')
    process.exit(1)
  }

  if (!to) {
    console.log('\n  Transport is reachable. Pass an address to send a real test:')
    console.log('    node server/scripts/check-mail.js you@example.com\n')
    return
  }

  const { subject, html, text } = resetPasswordEmail({
    name: 'Test', link: 'https://example.com/api/auth/reset-password?token=TEST', minutes: 30,
  })
  const r = await sendMail({ to, subject, html, text })
  if (r.ok) {
    ok(`sent to ${to}${r.id ? ` (id ${r.id})` : ''}`)
    console.log(mail.transport === 'smtp'
      ? '\n  Brevo delivers for real — check the spam folder too. SPF on ailernova.com\n  ends in -all and does not list Brevo, so the message is unauthenticated.\n  DMARC is p=none, so it is not rejected for that.\n'
      : '\n  Check the inbox.\n')
  } else {
    no(`send failed: ${r.error}`)
    process.exit(1)
  }
}

main().catch((e) => { console.error('\n  check failed:', e.message, '\n'); process.exit(1) })
