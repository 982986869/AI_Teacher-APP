'use strict'

// HeyGen Interactive/Streaming Avatar — real-time WebRTC video avatar. The server
// only proxies HeyGen's REST session/task calls (never the media itself, which the
// client connects to directly over LiveKit using the roomUrl/roomToken this hands
// back). The HEYGEN_API_KEY never leaves the server; per-session `sessionToken`s
// are minted here and held server-side (see routes/avatar.js's session registry).
//
// Env: HEYGEN_API_KEY, HEYGEN_AVATAR_ID (see config/env.js `avatar` block).

const { config } = require('../../config/env')

const BASE_URL = 'https://api.heygen.com'

async function post(path, { apiKey, sessionToken, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers['x-api-key'] = apiKey
  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    return { ok: false, status: 502, error: `HeyGen unreachable: ${err.message}` }
  }

  let json = null
  try { json = await res.json() } catch (e) { /* empty/non-JSON body */ }

  if (!res.ok) {
    const detail = json ? JSON.stringify(json).slice(0, 300) : ''
    return { ok: false, status: res.status, error: `HeyGen error ${res.status}: ${detail}` }
  }
  return { ok: true, status: res.status, data: (json && json.data) || json || {} }
}

// Step 1: exchange the long-lived API key for a short-lived session_token. All
// subsequent calls for this session (new/start/task/keep_alive/stop) authorize
// with this token, never the raw API key.
async function createToken() {
  const { heygenApiKey } = config.avatar
  if (!heygenApiKey) return { ok: false, status: 503, error: 'HeyGen API key not set' }

  const r = await post('/v1/streaming.create_token', { apiKey: heygenApiKey })
  if (!r.ok) return r
  const sessionToken = r.data && r.data.token
  if (!sessionToken) return { ok: false, status: 502, error: 'HeyGen create_token returned no token' }
  return { ok: true, status: 200, sessionToken }
}

// Step 2: allocate the LiveKit room. Returns the connection info the CLIENT uses
// to join directly (roomUrl/roomToken) — this is safe to hand to the client,
// unlike sessionToken.
async function createSession(sessionToken) {
  const { heygenAvatarId, sessionDurationSec, idleTimeoutSec, quality } = config.avatar
  if (!heygenAvatarId) return { ok: false, status: 503, error: 'HeyGen avatar id not set' }

  const r = await post('/v1/streaming.new', {
    sessionToken,
    body: {
      avatar_id: heygenAvatarId,
      quality,
      version: 'v2',
      session_duration_limit: sessionDurationSec,
      activity_idle_timeout: idleTimeoutSec,
    },
  })
  if (!r.ok) return r
  const { session_id: sessionId, url: roomUrl, access_token: roomToken } = r.data || {}
  if (!sessionId || !roomUrl || !roomToken) {
    return { ok: false, status: 502, error: 'HeyGen streaming.new missing session_id/url/access_token' }
  }
  return { ok: true, status: 200, sessionId, roomUrl, roomToken }
}

// Step 3: make the avatar actually join/publish into the room. The client should
// not attempt to connect to roomUrl until this succeeds.
async function startSession(sessionToken, sessionId) {
  return post('/v1/streaming.start', { sessionToken, body: { session_id: sessionId } })
}

// Make the avatar speak `text`. Always task_type 'repeat' (never 'talk') — talk
// can route through HeyGen's own conversational/knowledge-base layer and speak
// something other than the authored lesson line; repeat is verbatim TTS.
async function sendTask(sessionToken, sessionId, text) {
  return post('/v1/streaming.task', {
    sessionToken,
    body: { session_id: sessionId, text, task_type: 'repeat' },
  })
}

// Resets HeyGen's activity_idle_timeout clock without speaking anything — used
// during silent modes (LISTENING/THINKING/PAUSED) so the session doesn't close
// mid-doubt-handling.
async function keepAlive(sessionToken, sessionId) {
  return post('/v1/streaming.keep_alive', { sessionToken, body: { session_id: sessionId } })
}

async function closeSession(sessionToken, sessionId) {
  return post('/v1/streaming.stop', { sessionToken, body: { session_id: sessionId } })
}

module.exports = { createToken, createSession, startSession, sendTask, keepAlive, closeSession }
