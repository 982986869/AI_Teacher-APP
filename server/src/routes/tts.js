'use strict'

const { Router } = require('express')
const { Readable } = require('stream')
const jwt = require('jsonwebtoken')
const { config } = require('../config/env')
const { synthesizeSpeech: openaiSynthesize } = require('../providers/ai/OpenAITTSProvider')
const { synthesizeSpeech: kokoroSynthesize } = require('../providers/ai/KokoroTTSProvider')

// ── TTS providers ─────────────────────────────────────────────────────────────
//   • Kokoro (default) — self-hosted, free, no API key. Needs the Python server
//                 running at http://localhost:8880 (see /kokoro-server). It buffers
//                 the whole clip before responding, so first-audio is slower than
//                 OpenAI's stream; repeated lines are disk-cached to offset that.
//   • OpenAI    — gpt-4o-mini-tts, "coral". Streams, so playback starts before the
//                 line finishes synthesizing. Used when TTS_PROVIDER=openai, or as
//                 the fallback when Kokoro is unreachable and a key is set.
//   • ElevenLabs — written (ElevenLabsTTSProvider.js) but NOT wired up here, and
//                 its config keys are commented out. Premium/paid: a FREE plan
//                 cannot use the API at all (402 paid_plan_required).

const router = Router()

// Lightweight auth: the streaming <Audio> client can't set an Authorization
// header, so we also accept a `token` query param. We only verify the JWT
// signature (no DB hit) — this endpoint exposes no user data, just TTS.
function verifyToken(req, res, next) {
  const header = req.headers.authorization
  const token = (header && header.startsWith('Bearer ') ? header.slice(7) : null) || req.query.token
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' })
  try {
    jwt.verify(token, config.auth.jwtSecret)
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

// Synthesize with the configured provider. Kokoro is primary (self-hosted, free,
// "Sarah" voice); if it's unreachable and an OpenAI key is set, fall back to
// OpenAI so the teacher still speaks. Returns the provider result unchanged.
async function synthesize(text, opts) {
  if (config.tts.provider === 'openai') {
    return openaiSynthesize(text, opts)
  }
  const kokoro = await kokoroSynthesize(text, opts)
  if (kokoro.ok || !config.tts.apiKey) return kokoro
  // Kokoro down but OpenAI is configured → don't leave the student in silence.
  return openaiSynthesize(text, opts)
}

// GET /api/tts?text=...&voice=...&token=...  → streams/sends audio
// (GET so the mobile audio player can stream straight from the URL.)
async function handleTts(req, res) {
  const text = String((req.query.text != null ? req.query.text : req.body && req.body.text) || '').trim()
  if (!text) return res.status(400).json({ success: false, message: 'text is required' })
  if (text.length > config.tts.maxChars) {
    return res.status(413).json({ success: false, message: `text exceeds ${config.tts.maxChars} characters` })
  }

  const result = await synthesize(text, { voice: req.query.voice })
  if (!result.ok) {
    // Non-2xx → the client falls back to on-device TTS.
    return res.status(result.status || 502).json({ success: false, message: result.error || 'TTS failed' })
  }

  res.setHeader('Content-Type', result.mime)
  res.setHeader('Cache-Control', 'public, max-age=86400')

  // Kokoro returns a buffered Buffer; OpenAI returns a web ReadableStream.
  if (result.buffer) {
    return res.send(result.buffer)
  }
  try {
    Readable.fromWeb(result.body).pipe(res)
  } catch (err) {
    if (!res.headersSent) res.status(502).json({ success: false, message: 'TTS stream failed' })
    else res.end()
  }
}

router.get('/', verifyToken, handleTts)
router.post('/', verifyToken, handleTts)

module.exports = router
