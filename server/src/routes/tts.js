'use strict'

const { Router } = require('express')
const { Readable } = require('stream')
const jwt = require('jsonwebtoken')
const { config } = require('../config/env')
const { synthesizeSpeech } = require('../providers/ai/OpenAITTSProvider')

// ── FUTURE USE — alternative TTS providers (currently disabled) ───────────────
// The teacher voice is OpenAI TTS (gpt-4o-mini-tts, "coral"): it returns a stream,
// so playback starts before the whole line is synthesized — the lowest latency of
// the three. Kokoro and ElevenLabs stay here, commented, to switch back to later:
//
//   • Kokoro    — self-hosted, free, no API key. Needs the Python server running
//                 at http://localhost:8880 (see /kokoro-server). Buffers the whole
//                 clip before responding, so first-audio is slower than OpenAI.
//   • ElevenLabs — premium/paid. A FREE ElevenLabs plan cannot use the API at all
//                 (returns 402 paid_plan_required), so a paid plan is required.
//
// To re-enable: uncomment the require below and the matching branch in synthesize().
//
// const { synthesizeSpeech: kokoroSynthesize } = require('../providers/ai/KokoroTTSProvider')
// const { synthesizeSpeech: elevenSynthesize } = require('../providers/ai/ElevenLabsTTSProvider')

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

// ── FUTURE USE — multi-provider dispatcher (currently disabled) ───────────────
// Uncomment this (and the requires above) to route by TTS_PROVIDER again:
//
// async function synthesize(text, opts) {
//   const provider = config.tts.provider
//
//   if (provider === 'openai') {
//     return synthesizeSpeech(text, opts)
//   }
//
//   if (provider === 'elevenlabs') {
//     const eleven = await elevenSynthesize(text, opts)
//     if (eleven.ok) return eleven
//     // ElevenLabs failed (e.g. free plan / quota) → don't leave the student silent:
//     // fall back to the free self-hosted Kokoro, then OpenAI if configured.
//     const kok = await kokoroSynthesize(text, opts)
//     if (kok.ok || !config.tts.apiKey) return kok
//     return synthesizeSpeech(text, opts)
//   }
//
//   const kokoro = await kokoroSynthesize(text, opts)
//   if (kokoro.ok || !config.tts.apiKey) return kokoro
//   // Kokoro down but OpenAI is configured → don't leave the student in silence.
//   return synthesizeSpeech(text, opts)
// }

// GET /api/tts?text=...&voice=...&token=...  → streams audio/mpeg
// (GET so the mobile audio player can stream straight from the URL.)
async function handleTts(req, res) {
  const text = String((req.query.text != null ? req.query.text : req.body && req.body.text) || '').trim()
  if (!text) return res.status(400).json({ success: false, message: 'text is required' })
  if (text.length > config.tts.maxChars) {
    return res.status(413).json({ success: false, message: `text exceeds ${config.tts.maxChars} characters` })
  }

  const result = await synthesizeSpeech(text, { voice: req.query.voice })
  if (!result.ok) {
    // Log the provider detail server-side; never relay the upstream (OpenAI) error
    // body to the client — it can carry org/quota/model internals. The client only
    // needs a non-2xx to fall back to on-device TTS.
    console.error('[tts] synthesis failed:', result.status || '-', result.error || '')
    return res.status(result.status || 502).json({ success: false, message: 'Voice narration is temporarily unavailable.' })
  }

  res.setHeader('Content-Type', result.mime)
  // Per-user, auth-gated response — keep it out of shared/CDN caches.
  res.setHeader('Cache-Control', 'private, max-age=86400')

  // OpenAI returns a web ReadableStream. (A buffered provider — e.g. Kokoro, if it
  // is ever re-enabled above — would return `result.buffer` instead; this guard
  // keeps that path working without changing anything else.)
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
