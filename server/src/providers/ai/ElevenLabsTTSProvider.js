'use strict'

// ElevenLabs TTS — premium, very natural voices. Paid plan required to use voices
// via the API (the free tier blocks library voices). Returns MP3 audio. Repeated
// lesson lines are cached on disk so the same text is only billed once.
//
// Env: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL (see config/env.js).

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { config } = require('../../config/env')
const { mimeFor } = require('./OpenAITTSProvider')

const CACHE_DIR = path.join(__dirname, '..', '..', '..', 'tts-cache')
try { fs.mkdirSync(CACHE_DIR, { recursive: true }) } catch (e) { /* best-effort */ }

// `el:` prefix keeps ElevenLabs clips distinct from Kokoro/OpenAI in the shared cache.
const keyFor = (text, voice, format) =>
  crypto.createHash('sha1').update(`el:${voice}:${format}:${text}`).digest('hex')

// Synthesize `text` → { ok, status, buffer, mime } or { ok:false, status, error }.
async function synthesizeSpeech(text, opts = {}) {
  const { elevenApiKey, elevenVoiceId, elevenModel } = config.tts
  const voice = opts.voice || elevenVoiceId
  const format = 'mp3'

  if (!elevenApiKey) return { ok: false, status: 503, error: 'ElevenLabs API key not set' }
  if (!voice) return { ok: false, status: 503, error: 'ElevenLabs voice id not set' }

  const cacheFile = path.join(CACHE_DIR, `${keyFor(text, voice, format)}.${format}`)
  try {
    if (fs.existsSync(cacheFile)) {
      return { ok: true, status: 200, buffer: fs.readFileSync(cacheFile), mime: mimeFor(format) }
    }
  } catch (e) { /* ignore cache read errors, regenerate below */ }

  let res
  try {
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenApiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: elevenModel,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })
  } catch (err) {
    return { ok: false, status: 502, error: `ElevenLabs unreachable: ${err.message}` }
  }

  if (!res.ok) {
    let detail = ''
    try { detail = await res.text() } catch (e) { /* ignore */ }
    return { ok: false, status: res.status, error: `ElevenLabs error ${res.status}: ${detail.slice(0, 300)}` }
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  try { fs.writeFileSync(cacheFile, buffer) } catch (e) { /* cache is best-effort */ }
  return { ok: true, status: 200, buffer, mime: mimeFor(format) }
}

module.exports = { synthesizeSpeech }
