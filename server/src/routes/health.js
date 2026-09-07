'use strict'

const { Router } = require('express')
const db = require('../config/database')
const { mail, verifyTransport } = require('../services/mailer')

const router = Router()

// GET /api/health?check=mail — actually open the SMTP connection and report what
// happens. Separate from the plain health read because it costs a TCP and TLS
// round trip to another host, which a liveness probe should never do.
//
// Needed because the send path swallows its own errors on purpose: a failure must
// not change what /forgot-password answers, or the endpoint becomes a way to ask
// which addresses are registered. The error therefore only ever reached a log
// nobody could read. This returns it.
//
// Safe to expose: nodemailer reports the failure MODE — timeout, refused,
// invalid login — never the credential. The host and port are already in
// render.yaml.
const net = require('net')

// GET /api/health?check=egress — can this host open an SMTP port AT ALL?
//
// A timeout talking to our own mail server has two possible causes and they look
// identical from here: this host blocking outbound SMTP, or that mail server
// refusing connections from cloud IPs. Trying several INDEPENDENT mail servers
// separates them. If every one times out the block is here; if some connect, the
// block is at the destination.
//
// The targets are a fixed list, not a parameter — an endpoint that connects to a
// host of the caller's choosing is a port scanner. It only opens a TCP socket and
// closes it: no TLS, no credentials, nothing sent.
const EGRESS_TARGETS = [
  { host: 'smtp.hostinger.com', port: 587, note: 'our mail server' },
  { host: 'smtp.hostinger.com', port: 465, note: 'our mail server, implicit TLS' },
  { host: 'smtp.gmail.com', port: 587, note: 'unrelated mail server' },
  { host: 'smtp.office365.com', port: 587, note: 'unrelated mail server' },
  { host: 'live.smtp.mailtrap.io', port: 2525, note: 'non-standard SMTP port' },
  { host: 'api.render.com', port: 443, note: 'HTTPS control — must succeed' },
]

const tcpProbe = ({ host, port }, timeout = 8000) => new Promise((resolve) => {
  const started = Date.now()
  const sock = new net.Socket()
  const done = (result) => {
    sock.destroy()
    resolve({ host, port, result, ms: Date.now() - started })
  }
  sock.setTimeout(timeout)
  sock.once('connect', () => done('open'))
  sock.once('timeout', () => done('timeout'))
  sock.once('error', (e) => done(e.code || 'error'))
  sock.connect({ host, port, family: 4 })
})

router.get('/', async (req, res, next) => {
  if (req.query.check === 'egress') {
    const results = await Promise.all(EGRESS_TARGETS.map(async (t) => ({
      ...(await tcpProbe(t)), note: t.note,
    })))
    const smtp = results.filter((r) => r.port !== 443)
    return res.json({ success: true, data: {
      verdict: smtp.every((r) => r.result !== 'open')
        ? 'every SMTP port blocked here — the block is this host, not the mail server'
        : 'some SMTP reachable — where it fails, the destination is refusing us',
      results,
    } })
  }
  if (req.query.check === 'mail') {
    const v = await verifyTransport()
    return res.json({ success: true, data: { transport: v.transport, ok: v.ok, detail: v.detail } })
  }
  return next()
})

router.get('/', async (req, res) => {
  let dbStatus = 'connected'
  try {
    await db.$queryRaw`SELECT 1`
  } catch {
    dbStatus = 'disconnected'
  }

  res.json({
    success: true,
    data: {
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      // WHICH COMMIT IS ACTUALLY RUNNING. `version` comes from package.json and
      // has read 1.0.0 through every deploy, so it could never answer "did my
      // change go out?" — the question that matters after every push. Render
      // injects RENDER_GIT_COMMIT; locally there is none, hence 'local'.
      //
      //   curl -s https://ailernova-api.onrender.com/api/health | jq -r .data.commit
      //   git log --oneline -1 <that sha>
      commit: (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7),
      branch: process.env.RENDER_GIT_BRANCH || null,
      // Uptime doubles as a deploy clock: a few seconds means it has just
      // restarted, which on the free plan is either a deploy or a cold start.
      uptimeSec: Math.round(process.uptime()),
      // WHETHER THIS SERVER CAN SEND MAIL. Not a detail — /forgot-password
      // answers "a reset link is on its way" whether or not the send worked,
      // deliberately, so it cannot be used to discover which addresses are
      // registered. That safety property also means an unset SMTP_HOST is
      // invisible from outside: tokens are written, students are told to check
      // their email, and nothing is ever sent.
      //
      // It cost a full debugging session to establish that from the outside —
      // reading the sending mailbox over IMAP to prove the message never came.
      // A boolean here answers it in one request. No host, user or secret is
      // exposed; "configured" only means SMTP_HOST is set.
      // 'incomplete' is the state that cost a debugging session: SMTP_HOST present
      // from render.yaml, credentials never entered, so the transport is selected
      // and every send fails authentication silently.
      mail: !mail.enabled ? 'not configured'
        : (mail.missing.length ? `incomplete (missing ${mail.missing.join(', ')})` : 'configured'),
    },
  })
})

module.exports = router
