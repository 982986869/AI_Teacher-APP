'use strict'

// Thin wrapper over OpenAI's /v1/audio/speech endpoint. Returns the raw fetch
// Response so the caller can stream the audio body straight to the client (no
// buffering the whole clip in memory → lower latency, less RAM).
//
// Docs: https://platform.openai.com/docs/api-reference/audio/createSpeech

const { config } = require('../../config/env')

const FORMAT_MIME = {
  mp3: 'audio/mpeg',
  opus: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
  wav: 'audio/wav',
  pcm: 'audio/L16',
}

function mimeFor(format) {
  return FORMAT_MIME[format] || 'audio/mpeg'
}

// Synthesize `text` → returns { ok, status, body (web ReadableStream), mime } or
// { ok:false, status, error }.
async function synthesizeSpeech(text, opts = {}) {
  const { apiKey, model, voice, format, instructions } = config.tts
  if (!apiKey) {
    return { ok: false, status: 503, error: 'TTS is not configured (no OPENAI_API_KEY).' }
  }

  const useVoice = opts.voice || voice
  const useFormat = opts.format || format
  const body = {
    model,
    voice: useVoice,
    input: text,
    response_format: useFormat,
  }
  // `instructions` is only honoured by the steerable gpt-4o-mini-tts model.
  if (/gpt-4o.*tts/i.test(model) && instructions) {
    body.instructions = opts.instructions || instructions
  }

  let res
  try {
    res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    return { ok: false, status: 502, error: `TTS upstream request failed: ${err.message}` }
  }

  if (!res.ok) {
    let detail = ''
    try { detail = await res.text() } catch (e) { /* ignore */ }
    return { ok: false, status: res.status, error: `TTS upstream error ${res.status}: ${detail.slice(0, 300)}` }
  }

  return { ok: true, status: 200, body: res.body, mime: mimeFor(useFormat) }
}

module.exports = { synthesizeSpeech, mimeFor }
