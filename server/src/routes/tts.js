'use strict'

const { Router } = require('express')
const { Readable } = require('stream')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { config } = require('../config/env')
const { synthesizeSpeech: openaiSynthesize } = require('../providers/ai/OpenAITTSProvider')
const { synthesizeSpeech: elevenSynthesize } = require('../providers/ai/ElevenLabsTTSProvider')
const { synthesizeSpeech: kokoroSynthesize } = require('../providers/ai/KokoroTTSProvider')

// ── AUDIO CACHE ───────────────────────────────────────────────────────────────
// Slide narration is deterministic: the same (text, voice) always synthesizes to
// the same audio. So we cache the finished clip in a bounded in-memory LRU — a
// replay, an adaptive re-teach, or the next student on the same slide is served
// instantly with ZERO OpenAI round-trip or cost. A miss still streams (first-audio
// stays low-latency) while we tee the bytes into the cache for next time. Sized by
// entry count; a restart just re-warms. Set TTS_CACHE_MAX=0 to disable.
const TTS_CACHE = new Map() // key -> { buf: Buffer, mime: string }
const TTS_CACHE_MAX = Number.isFinite(parseInt(process.env.TTS_CACHE_MAX, 10)) ? parseInt(process.env.TTS_CACHE_MAX, 10) : 300
const ttsKey = (text, voice) => crypto.createHash('sha1').update(`${voice || ''}\n${text}`).digest('hex')
function ttsCacheGet(key) {
  const v = TTS_CACHE.get(key)
  if (v) { TTS_CACHE.delete(key); TTS_CACHE.set(key, v) } // LRU bump
  return v
}
function ttsCacheSet(key, buf, mime) {
  if (TTS_CACHE_MAX <= 0 || !buf || !buf.length) return
  TTS_CACHE.set(key, { buf, mime })
  if (TTS_CACHE.size > TTS_CACHE_MAX) TTS_CACHE.delete(TTS_CACHE.keys().next().value)
}

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

// Routes by TTS_PROVIDER. ElevenLabs is premium/paid and can fail (quota, bad
// voice id) — fall back to free self-hosted Kokoro, then OpenAI, so a provider
// hiccup never leaves the student in silence.
async function synthesize(text, opts) {
  const provider = config.tts.provider

  if (provider === 'openai') {
    return openaiSynthesize(text, opts)
  }

  if (provider === 'elevenlabs') {
    const eleven = await elevenSynthesize(text, opts)
    if (eleven.ok) return eleven
    console.error('[tts] ElevenLabs failed, falling back:', eleven.status || '-', eleven.error || '')
    const kok = await kokoroSynthesize(text, opts)
    if (kok.ok || !config.tts.apiKey) return kok
    return openaiSynthesize(text, opts)
  }

  const kokoro = await kokoroSynthesize(text, opts)
  if (kokoro.ok || !config.tts.apiKey) return kokoro
  // Kokoro down but OpenAI is configured → don't leave the student in silence.
  return openaiSynthesize(text, opts)
}

// GET /api/tts?text=...&voice=...&token=...  → streams audio/mpeg
// (GET so the mobile audio player can stream straight from the URL.)
async function handleTts(req, res) {
  const text = String((req.query.text != null ? req.query.text : req.body && req.body.text) || '').trim()
  if (!text) return res.status(400).json({ success: false, message: 'text is required' })
  if (text.length > config.tts.maxChars) {
    return res.status(413).json({ success: false, message: `text exceeds ${config.tts.maxChars} characters` })
  }

  const voice = req.query.voice
  const key = ttsKey(text, voice)

  // Cache hit → serve the finished clip immediately (no OpenAI call, no cost).
  const hit = ttsCacheGet(key)
  if (hit) {
    res.setHeader('Content-Type', hit.mime)
    res.setHeader('Cache-Control', 'private, max-age=86400')
    res.setHeader('X-TTS-Cache', 'hit')
    return res.send(hit.buf)
  }

  const result = await synthesize(text, { voice })
  if (!result.ok) {
    // Log the provider detail server-side; never relay the upstream error body
    // to the client — it can carry org/quota/model internals. The client only
    // needs a non-2xx to fall back to on-device TTS.
    console.error('[tts] synthesis failed:', result.status || '-', result.error || '')
    return res.status(result.status || 502).json({ success: false, message: 'Voice narration is temporarily unavailable.' })
  }

  res.setHeader('Content-Type', result.mime)
  // Per-user, auth-gated response — keep it out of shared/CDN caches.
  res.setHeader('Cache-Control', 'private, max-age=86400')
  res.setHeader('X-TTS-Cache', 'miss')

  // ElevenLabs/Kokoro return a buffered clip (result.buffer); OpenAI streams a
  // web ReadableStream instead — this guard routes each provider correctly.
  if (result.buffer) {
    ttsCacheSet(key, result.buffer, result.mime)
    return res.send(result.buffer)
  }
  try {
    // Tee the stream: pipe to the client (keeps first-audio latency low) while
    // collecting the bytes; on a clean finish, store the clip so next time is a hit.
    const chunks = []
    const nodeStream = Readable.fromWeb(result.body)
    nodeStream.on('data', (c) => { chunks.push(Buffer.from(c)) })
    nodeStream.on('end', () => { try { ttsCacheSet(key, Buffer.concat(chunks), result.mime) } catch (_) { /* never cache on error */ } })
    nodeStream.on('error', () => { /* partial/aborted stream — do not cache */ })
    nodeStream.pipe(res)
  } catch (err) {
    if (!res.headersSent) res.status(502).json({ success: false, message: 'TTS stream failed' })
    else res.end()
  }
}

router.get('/', verifyToken, handleTts)
router.post('/', verifyToken, handleTts)

module.exports = router
module.exports.handleTts = handleTts // exported for tests
