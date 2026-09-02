'use strict'

// Does the teacher actually have a voice? Answers the one question the app
// cannot: whether ELEVENLABS_API_KEY is set, paid, in quota, AND allowed to use
// the specific voice the lessons ask for.
//
//   node server/scripts/check-tts-key.js
//
// Reads server/.env, so the key never has to be pasted anywhere it could be
// committed (server/.gitignore already covers .env*). Read-only: it lists the
// account and its voices, and synthesizes one short line to prove the path end
// to end. Nothing is written and no app state changes.
//
// There is no fallback chain in routes/tts.js — ANY failure here means every
// lesson drops to the device's own voice, which on most Android builds is male.

const fs = require('fs')
const path = require('path')

const ENV = path.join(__dirname, '..', '.env')
if (fs.existsSync(ENV)) {
  for (const line of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const KEY = process.env.ELEVENLABS_API_KEY
const VOICE = process.env.ELEVENLABS_VOICE_ID || 'Ghr5KCyOzBvJpcdBbJhE'
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5'
const B = 'https://api.elevenlabs.io/v1'

const ok = (m) => console.log('  \u2713 ' + m)
const no = (m) => console.log('  \u2717 ' + m)

async function main() {
  console.log('\nElevenLabs check')
  console.log('  voice ' + VOICE + '   model ' + MODEL + '\n')

  if (!KEY) {
    no('ELEVENLABS_API_KEY is not set')
    console.log('\n  config.tts.enabled is FALSE, so the server never calls ElevenLabs')
    console.log('  and every lesson uses the device voice. Add the key to server/.env')
    console.log('  (copy it from Render > Environment) and run this again.\n')
    process.exit(1)
  }
  ok('key present (' + KEY.slice(0, 4) + '\u2026' + KEY.slice(-4) + ', ' + KEY.length + ' chars)')

  const H = { 'xi-api-key': KEY }

  // 1. Is the key valid, and is the account paid?
  const u = await fetch(B + '/user', { headers: H })
  if (!u.ok) {
    no('key rejected: HTTP ' + u.status + ' ' + (await u.text()).slice(0, 160))
    console.log('\n  401 = invalid or revoked key. Every lesson falls back to the device voice.\n')
    process.exit(1)
  }
  const user = await u.json()
  const sub = user.subscription || {}
  const used = sub.character_count, cap = sub.character_limit
  ok('key valid \u2014 tier "' + (sub.tier || '?') + '"')
  if (String(sub.tier).toLowerCase() === 'free') {
    no('FREE tier: the TTS API returns 402 paid_plan_required on every call')
  }
  if (typeof used === 'number' && typeof cap === 'number') {
    const left = cap - used
    ;(left > 0 ? ok : no)('quota ' + used.toLocaleString() + ' / ' + cap.toLocaleString()
      + ' used \u2014 ' + left.toLocaleString() + ' characters left')
  }

  // 2. The voice id is a LIBRARY voice: valid key + paid plan still 404s until it
  //    has been added to this account. This is the failure that looks like
  //    "the key is set, so why is the teacher male".
  const v = await fetch(B + '/voices', { headers: H })
  if (v.ok) {
    const list = (await v.json()).voices || []
    const hit = list.find((x) => x.voice_id === VOICE)
    if (hit) ok('voice "' + hit.name + '" is on the account')
    else {
      no('voice ' + VOICE + ' is NOT on this account (' + list.length + ' voices there)')
      console.log('      Add it in ElevenLabs > Voice Library > "Add to my voices",')
      console.log('      or set ELEVENLABS_VOICE_ID to one of: '
        + list.slice(0, 4).map((x) => x.name + '=' + x.voice_id).join(', '))
    }
  }

  // 3. Synthesize one line — the only proof that a lesson would actually speak.
  const r = await fetch(B + '/text-to-speech/' + VOICE, {
    method: 'POST',
    headers: { ...H, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text: 'Hello, this is your teacher.', model_id: MODEL }),
  })
  if (r.ok) {
    const bytes = (await r.arrayBuffer()).byteLength
    ok('synthesis OK \u2014 ' + bytes.toLocaleString() + ' bytes of audio')
    console.log('\n  The teacher voice works. A male voice in the app is NOT this key.\n')
  } else {
    const body = (await r.text()).slice(0, 220)
    no('synthesis FAILED: HTTP ' + r.status + ' ' + body)
    const why = { 401: 'invalid key', 402: 'free plan \u2014 TTS API not available',
      404: 'voice not on this account (add it in the Voice Library)',
      429: 'rate limited / out of quota' }[r.status]
    console.log('\n  ' + (why || 'upstream error') + '. Every lesson falls back to the device voice.\n')
    process.exit(1)
  }
}

main().catch((e) => { console.error('\n  check failed to run:', e.message, '\n'); process.exit(1) })
