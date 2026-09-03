'use strict'

// The page the emailed link opens, and the POST that changes the password.
//
// Served by the API rather than the marketing site or a deep link, because the mail
// has to work wherever it is opened: a desktop browser, a webmail preview, a phone
// without the app installed. A deep link fails all three.
//
// Plain server-rendered HTML with no build step and no assets — the page must load
// from an email client on a bad connection, and it exists for about ninety seconds.

const bcrypt = require('bcryptjs')
const db = require('../config/database')
const { findToken, sha256, MIN_PASSWORD } = require('./passwordReset.controller')

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

function page({ title, body, ok }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)} · Ailernova</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; padding:24px; background:#F7F7F8; color:#111;
         font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  .card { max-width:420px; margin:6vh auto; background:#fff; border-radius:16px; padding:28px 26px;
          box-shadow:0 1px 3px rgba(17,17,17,.06), 0 8px 24px rgba(17,17,17,.05); }
  h1 { margin:0 0 6px; font-size:21px; letter-spacing:-.02em; }
  p  { margin:0 0 18px; font-size:14.5px; line-height:1.55; color:#555; }
  label { display:block; font-size:13px; font-weight:600; margin:0 0 6px; color:#111; }
  input { width:100%; padding:12px 13px; font-size:16px; border:1px solid rgba(17,17,17,.14);
          border-radius:10px; background:#fff; color:#111; margin:0 0 16px; }
  input:focus { outline:2px solid #7C4DFF; outline-offset:1px; border-color:transparent; }
  button { width:100%; padding:13px; font-size:15px; font-weight:700; color:#fff; background:#7C4DFF;
           border:0; border-radius:10px; cursor:pointer; }
  button:hover { background:#6B3FE0; }
  .err { background:#FDECEC; color:#8E1B1B; border-radius:9px; padding:10px 12px;
         font-size:13.5px; margin:0 0 16px; }
  .ok  { background:#E8F6EE; color:#155C33; border-radius:9px; padding:10px 12px;
         font-size:13.5px; margin:0 0 16px; }
  .hint { font-size:12.5px; color:#777; margin:-8px 0 16px; }
</style>
</head><body><div class="card">${body}</div>
${ok ? '' : `<script>
  // Compare on the client too, purely so the mistake is caught before a round trip.
  // The server checks the same thing and is the one that decides.
  document.addEventListener('submit', function (e) {
    var a = document.getElementById('p1'), b = document.getElementById('p2');
    if (!a || !b) return;
    if (a.value !== b.value) { e.preventDefault(); alert('The two passwords do not match.'); }
    else if (a.value.length < ${MIN_PASSWORD}) { e.preventDefault(); alert('Use at least ${MIN_PASSWORD} characters.'); }
  });
</script>`}
</body></html>`
}

const form = (token, error) => page({
  title: 'Choose a new password',
  body: `
    <h1>Choose a new password</h1>
    <p>Set a new password for your Ailernova account.</p>
    ${error ? `<div class="err">${esc(error)}</div>` : ''}
    <form method="POST" action="/api/auth/reset-password">
      <input type="hidden" name="token" value="${esc(token)}">
      <label for="p1">New password</label>
      <input id="p1" name="password" type="password" autocomplete="new-password" required minlength="${MIN_PASSWORD}">
      <div class="hint">At least ${MIN_PASSWORD} characters.</div>
      <label for="p2">Confirm new password</label>
      <input id="p2" name="confirmPassword" type="password" autocomplete="new-password" required minlength="${MIN_PASSWORD}">
      <button type="submit">Reset password</button>
    </form>`,
})

const dead = (msg) => page({
  title: 'Link expired',
  ok: true,
  body: `<h1>This link no longer works</h1>
    <p>${esc(msg)}</p>
    <p>Open the app, tap <b>Forgot password</b> and request a new one.</p>`,
})

const done = () => page({
  title: 'Password changed',
  ok: true,
  body: `<h1>Password changed</h1>
    <div class="ok">You can now sign in with your new password.</div>
    <p>Head back to the Ailernova app and sign in. You can close this page.</p>`,
})

// GET /api/auth/reset-password?token=…
async function showResetPage(req, res, next) {
  try {
    const token = String((req.query && req.query.token) || '')
    const row = await findToken(token)
    if (!row) return res.status(400).type('html').send(dead('It may have expired, already been used, or been replaced by a newer request.'))
    return res.type('html').send(form(token))
  } catch (err) { return next(err) }
}

// POST /api/auth/reset-password  { token, password, confirmPassword }
//
// Answers with HTML for the browser form, and with JSON when asked for it, so the
// app could drive the same endpoint later without a second implementation.
async function submitReset(req, res, next) {
  const wantsJson = (req.get('accept') || '').includes('application/json')
  const fail = (status, msg, token) => (wantsJson
    ? res.status(status).json({ success: false, error: msg })
    : res.status(status).type('html').send(token ? form(token, msg) : dead(msg)))

  try {
    const body = req.body || {}
    const token = String(body.token || '')
    const password = String(body.password || '')
    const confirm = String(body.confirmPassword == null ? password : body.confirmPassword)

    const row = await findToken(token)
    if (!row) return fail(400, 'It may have expired, already been used, or been replaced by a newer request.')
    if (password.length < MIN_PASSWORD) return fail(422, `Use at least ${MIN_PASSWORD} characters.`, token)
    if (password !== confirm) return fail(422, 'The two passwords do not match.', token)

    const hash = await bcrypt.hash(password, 12)   // same cost as registration

    // Burn the token in the same statement that checks it is still unused, so two
    // submissions of the same form cannot both succeed.
    const burned = await db.$executeRawUnsafe(
      `UPDATE "password_reset_tokens" SET "usedAt" = now()
        WHERE "tokenHash" = $1 AND "usedAt" IS NULL AND "expiresAt" > now()`,
      sha256(token),
    )
    if (!burned) return fail(400, 'That link has already been used.')

    await db.$executeRawUnsafe(
      `UPDATE "users" SET "passwordHash" = $1, "updatedAt" = now() WHERE id = $2::uuid`,
      hash, row.userId,
    )
    // Any other outstanding link for this account dies with the change.
    await db.$executeRawUnsafe(
      `UPDATE "password_reset_tokens" SET "usedAt" = now()
        WHERE "userId" = $1::uuid AND "usedAt" IS NULL`,
      row.userId,
    )

    console.log(`[reset] password changed for ${row.email}`)
    if (wantsJson) return res.json({ success: true, message: 'Password changed' })
    return res.type('html').send(done())
  } catch (err) { return next(err) }
}

module.exports = { showResetPage, submitReset }
