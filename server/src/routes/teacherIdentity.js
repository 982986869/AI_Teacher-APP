'use strict'

// GET /api/teacher/identity
//
// Who the AI teacher is, per voice. The app ships Ms. Nova's photo, headshot and
// clip in the bundle, and that stays the default — it works offline and costs
// nothing. What it could NOT do is add a second teacher without a new build, and
// a second teacher is exactly what the voice fallback needs: when ElevenLabs is
// unreachable the device speaks, on many Android builds in a male voice, and the
// lesson then shows a woman while a man talks.
//
// This serves an override per gender. Set one and the app uses it; set none and
// the app keeps its bundled assets, so an empty response is a valid response and
// not an error.
//
// Stored in app_settings under `teacher_identity`, in the same shape the client
// expects:
//
//   {
//     "male":   { "name": "Mr. Iker",
//                 "photo":    "https://…/iker.png",
//                 "headshot": "https://…/iker-head.png",
//                 "video":    "https://…/iker.mp4" },
//     "female": { … }        // optional — omit to keep the bundled Ms. Nova
//   }
//
// Upload the files with the existing admin image upload, then write the URLs
// with PATCH /api/admin/settings/teacher_identity. No HeyGen key is involved:
// any hosted image or clip works, whatever produced it.

const { Router } = require('express')
const db = require('../config/database')
const ApiResponse = require('../utils/ApiResponse')
const { authenticate } = require('../middleware/auth')

const router = Router()
router.use(authenticate)

const KEY = 'teacher_identity'

// Only these fields cross the wire, and only as strings. The value is admin-
// writable JSON, so it is treated as untrusted input rather than trusted config.
const FIELDS = ['name', 'photo', 'headshot', 'video']

function clean(entry) {
  if (!entry || typeof entry !== 'object') return null
  const out = {}
  for (const f of FIELDS) {
    const v = entry[f]
    if (typeof v !== 'string') continue
    const s = v.trim()
    if (!s) continue
    // A URL field must actually be one. A relative path or a data: URI here would
    // be loaded by the client as a remote asset and silently fail.
    if (f !== 'name' && !/^https:\/\//i.test(s)) continue
    out[f] = s
  }
  // A variant with no usable asset is not worth returning — the client would
  // switch identity and render nothing.
  if (!out.photo && !out.headshot && !out.video) return null
  return out
}

router.get('/identity', async (req, res, next) => {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT value FROM "app_settings" WHERE key = $1 LIMIT 1`, KEY,
    ).catch(() => [])
    const raw = (rows && rows[0] && rows[0].value) || {}

    return ApiResponse.success(res, {
      female: clean(raw.female),
      male: clean(raw.male),
    })
  } catch (err) { next(err) }
})

module.exports = router
