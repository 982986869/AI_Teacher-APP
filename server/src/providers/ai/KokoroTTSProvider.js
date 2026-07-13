'use strict'

// Self-hosted Kokoro TTS — free, OpenAI-compatible endpoint that gives every
// device the same natural female teacher voice ("Sarah" = af_sarah) with no
// per-request cost. Server runs locally (see ../../../../kokoro-server), default
// http://localhost:8880.
//
// Kokoro buffers the whole clip server-side, so we return a Buffer (not a
// stream). Repeated lesson lines are cached on disk so the same text is only
// generated once — big latency/CPU saver.

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { config } = require('../../config/env')
const { mimeFor } = require('./OpenAITTSProvider')

// Cache lives next to the server so it survives restarts.
const CACHE_DIR = path.join(__dirname, '..', '..', '..', 'tts-cache')
try { fs.mkdirSync(CACHE_DIR, { recursive: true }) } catch (e) { /* best-effort */ }

const keyFor = (text, voice, format) =>
  crypto.createHash('sha1').update(`${voice}:${format}:${text}`).digest('hex')

// Synthesize `text` → { ok, status, buffer, mime } or { ok:false, status, error }.
async function synthesizeSpeech(text, opts = {}) {
  const { kokoroUrl, kokoroVoice, format } = config.tts
  const useVoice = opts.voice || kokoroVoice
  // Kokoro returns WAV natively (no ffmpeg); only fall back to the configured
  // format when the caller explicitly asks for something else.
  const useFormat = opts.format || 'wav'

  const cacheFile = path.join(CACHE_DIR, `${keyFor(text, useVoice, useFormat)}.${useFormat}`)
  try {
    if (fs.existsSync(cacheFile)) {
      return { ok: true, status: 200, buffer: fs.readFileSync(cacheFile), mime: mimeFor(useFormat) }
    }
  } catch (e) { /* ignore cache read errors, regenerate below */ }

  let res
  try {
    res = await fetch(`${kokoroUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'kokoro',
        input: text,
        voice: useVoice,
        response_format: useFormat,
        speed: opts.speed || 1.0,
      }),
    })
  } catch (err) {
    return { ok: false, status: 502, error: `Kokoro TTS unreachable at ${kokoroUrl}: ${err.message}` }
  }

  if (!res.ok) {
    let detail = ''
    try { detail = await res.text() } catch (e) { /* ignore */ }
    return { ok: false, status: res.status, error: `Kokoro TTS error ${res.status}: ${detail.slice(0, 300)}` }
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  try { fs.writeFileSync(cacheFile, buffer) } catch (e) { /* cache is best-effort */ }
  return { ok: true, status: 200, buffer, mime: mimeFor(useFormat) }
}

module.exports = { synthesizeSpeech }
