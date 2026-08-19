'use strict'

const { Router } = require('express')
const crypto = require('crypto')
const { config } = require('../config/env')
const { authenticate } = require('../middleware/auth')
const heygen = require('../providers/ai/HeyGenAvatarProvider')

// ── In-memory session registry ──────────────────────────────────────────────
// Maps our own opaque sessionId -> { sessionToken, heygenSessionId, userId,
// startedAt, lastActivityAt }. sessionToken can mint speak/stop calls for the
// session's lifetime, so it never leaves this server (the client only ever
// gets our sessionId + HeyGen's roomUrl/roomToken, which are LiveKit-scoped).
// Single-dyno in-memory store — fine for the tester-gated MVP rollout, NOT
// horizontally-scale-safe (a second server instance won't see another's
// sessions). Revisit if this ever needs multi-instance deployment.
const SESSIONS = new Map()

function reapStale() {
  const maxAgeMs = (config.avatar.sessionDurationSec + config.avatar.idleTimeoutSec + 30) * 1000
  const now = Date.now()
  for (const [id, s] of SESSIONS) {
    if (now - s.lastActivityAt > maxAgeMs) {
      SESSIONS.delete(id)
      // Best-effort — HeyGen will also self-close on its own idle timeout, this
      // just avoids leaving our registry entry (and, if reachable, the HeyGen
      // session) hanging around after an abnormal client exit (force-kill, crash).
      heygen.closeSession(s.sessionToken, s.heygenSessionId).catch(() => {})
    }
  }
}

const router = Router()
router.use(authenticate)

// POST /api/avatar/session — create + start a HeyGen streaming session. Gated
// behind config.avatar.enabled (instant server-side kill switch) and
// req.scope.tester (TESTER_EMAILS allowlist) since this is real per-minute cost.
router.post('/session', async (req, res) => {
  reapStale()

  if (!config.avatar.enabled) {
    return res.status(503).json({ success: false, message: 'Avatar is not enabled.' })
  }
  if (!req.scope || !req.scope.tester) {
    return res.status(403).json({ success: false, message: 'Avatar access is limited to testers.' })
  }
  if (SESSIONS.size >= config.avatar.maxConcurrentSessions) {
    return res.status(429).json({ success: false, message: 'Avatar is at capacity, try again shortly.' })
  }

  const tok = await heygen.createToken()
  if (!tok.ok) {
    console.error('[avatar] create_token failed:', tok.status || '-', tok.error || '')
    return res.status(tok.status || 502).json({ success: false, message: 'Avatar is temporarily unavailable.' })
  }

  const sess = await heygen.createSession(tok.sessionToken)
  if (!sess.ok) {
    console.error('[avatar] streaming.new failed:', sess.status || '-', sess.error || '')
    return res.status(sess.status || 502).json({ success: false, message: 'Avatar is temporarily unavailable.' })
  }

  const started = await heygen.startSession(tok.sessionToken, sess.sessionId)
  if (!started.ok) {
    console.error('[avatar] streaming.start failed:', started.status || '-', started.error || '')
    heygen.closeSession(tok.sessionToken, sess.sessionId).catch(() => {})
    return res.status(started.status || 502).json({ success: false, message: 'Avatar is temporarily unavailable.' })
  }

  const sessionId = crypto.randomUUID()
  SESSIONS.set(sessionId, {
    sessionToken: tok.sessionToken,
    heygenSessionId: sess.sessionId,
    userId: req.user.id,
    startedAt: Date.now(),
    lastActivityAt: Date.now(),
  })

  return res.json({ success: true, sessionId, roomUrl: sess.roomUrl, roomToken: sess.roomToken })
})

// POST /api/avatar/session/:id/speak — make the avatar speak `text` (visual only
// — see LiveTeachingPlayer's decoupled-audio design; ElevenLabs remains the
// audio source, this just drives the avatar's lip movement).
router.post('/session/:id/speak', async (req, res) => {
  const entry = SESSIONS.get(req.params.id)
  if (!entry) return res.status(404).json({ success: false, message: 'No active avatar session.' })
  if (entry.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not your session.' })

  const text = String((req.body && req.body.text) || '').trim()
  if (!text) return res.status(400).json({ success: false, message: 'text is required' })

  entry.lastActivityAt = Date.now()
  const r = await heygen.sendTask(entry.sessionToken, entry.heygenSessionId, text)
  if (!r.ok) {
    console.error('[avatar] task failed:', r.status || '-', r.error || '')
    return res.status(r.status || 502).json({ success: false, message: 'Avatar speak failed.' })
  }
  return res.json({ success: true })
})

// POST /api/avatar/session/:id/keep-alive — reset HeyGen's idle-timeout clock
// without speaking (used during LISTENING/THINKING/PAUSED silent gaps).
router.post('/session/:id/keep-alive', async (req, res) => {
  const entry = SESSIONS.get(req.params.id)
  if (!entry) return res.status(404).json({ success: false, message: 'No active avatar session.' })
  if (entry.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not your session.' })

  entry.lastActivityAt = Date.now()
  const r = await heygen.keepAlive(entry.sessionToken, entry.heygenSessionId)
  return res.json({ success: !!r.ok })
})

// DELETE /api/avatar/session/:id — close the HeyGen session and evict the registry entry.
router.delete('/session/:id', async (req, res) => {
  const entry = SESSIONS.get(req.params.id)
  if (!entry) return res.json({ success: true }) // already gone — not an error

  if (entry.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not your session.' })

  SESSIONS.delete(req.params.id)
  const r = await heygen.closeSession(entry.sessionToken, entry.heygenSessionId)
  return res.json({ success: !!r.ok })
})

module.exports = router
