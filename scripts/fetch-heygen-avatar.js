'use strict'

// Pull a HeyGen avatar into assets/ as the MALE teacher, the same way
// assets/teacher-tahlia.mp4 was produced from Tahlia_public_5 — the app ships
// the files rather than calling HeyGen at runtime, so no key reaches the client
// and nothing expires.
//
//   HEYGEN_API_KEY=... node scripts/fetch-heygen-avatar.js
//   node scripts/fetch-heygen-avatar.js --avatar <id>     (defaults to Iker)
//
// The key is read from server/.env if not in the environment. It is only used
// to resolve the avatar id to its asset URLs; /v2/avatars answers 401 without
// one, which is why the id on its own is not enough.
//
// Writes:
//   assets/teacher-male.png        full still
//   assets/teacher-male-head.png   square head crop for the badge
//   assets/teacher-male.mp4        talking loop, when the look exposes one
//
// then points MALE in src/components/teacher/teacherIdentity.js at them and
// flips hasOwnArt to true. Re-runnable: the edit is idempotent.

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const ASSETS = path.join(ROOT, 'assets')
const IDENTITY = path.join(ROOT, 'src', 'components', 'teacher', 'teacherIdentity.js')
const BASE = 'https://api.heygen.com'

const argv = process.argv.slice(2)
const AVATAR_ID = (argv[argv.indexOf('--avatar') + 1] !== undefined && argv.includes('--avatar'))
  ? argv[argv.indexOf('--avatar') + 1]
  : '214e2370f8464f83a3d3fe9bcf412c64'

function keyFromEnv() {
  if (process.env.HEYGEN_API_KEY) return process.env.HEYGEN_API_KEY
  const f = path.join(ROOT, 'server', '.env')
  if (!fs.existsSync(f)) return null
  const m = /^HEYGEN_API_KEY=(.*)$/m.exec(fs.readFileSync(f, 'utf8'))
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null
}

async function download(url, dest) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} fetching ${url.slice(0, 80)}`)
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()))
  return fs.statSync(dest).size
}

// Point MALE at the downloaded files. Done by rewriting the source because a
// require() of a missing asset fails the whole bundle — the assets have to
// exist before the module may name them, which is why MALE shipped pointing at
// the female files with hasOwnArt:false.
// Point MALE at the downloaded files. Done by rewriting the source because a
// require() of a missing asset fails the whole bundle — the assets have to
// exist before the module may name them, which is why MALE shipped pointing at
// the female files with hasOwnArt:false.
//
// Scoped to the MALE block. FEMALE has the identical `photo: TEACHER_PHOTO`
// lines and comes first in the file, so a plain replace() rewrites HER and
// leaves him on her assets — with hasOwnArt flipped to true, which is worse
// than not running at all: both teachers would then be Iker's photo.
function wireIdentity() {
  const src = fs.readFileSync(IDENTITY, 'utf8')
  const from = src.indexOf('const MALE = {')
  if (from < 0) throw new Error('MALE block not found in teacherIdentity.js')
  const to = src.indexOf('};', from)
  if (to < 0) throw new Error('MALE block is not closed')

  let block = src.slice(from, to)
  const before = block
  const hasVideo = fs.existsSync(path.join(ASSETS, 'teacher-male.mp4'))
  block = block
    .replace(/photo: TEACHER_PHOTO,.*/, "photo: require('../../../assets/teacher-male.png'),")
    .replace(/headshot: TEACHER_HEADSHOT,.*/, "headshot: require('../../../assets/teacher-male-head.png'),")
    .replace(/hasOwnArt: false,/, 'hasOwnArt: true,')
  // The comment above hasOwnArt explains why it is false. Once it is true that
  // comment says the opposite of the code, so it goes with it.
  const cStart = block.indexOf("  // False until a male photo")
  const cEnd = block.indexOf("when it is false.")
  if (cStart >= 0 && cEnd > cStart) {
    block = block.slice(0, cStart)
      + "  // Wired by scripts/fetch-heygen-avatar.js."
      + block.slice(cEnd + "when it is false.".length)
  }
  if (hasVideo) {
    block = block.replace(/video: TEACHER_VIDEO,.*/, "video: require('../../../assets/teacher-male.mp4'),")
  }
  if (block === before) return false

  // Refuse to leave the file claiming assets it does not point at.
  if (/hasOwnArt: true/.test(block) && /TEACHER_PHOTO|TEACHER_HEADSHOT/.test(block)) {
    throw new Error('refusing to write: MALE would claim its own art while still using hers')
  }
  fs.writeFileSync(IDENTITY, src.slice(0, from) + block + src.slice(to))
  return true
}
// Use a LOCAL image instead of calling HeyGen. No API key is involved: if you
// can see the avatar on heygen.com you can save its preview straight from the
// browser, and any male portrait works just as well. Same pipeline from the
// download onward — crop, wire, done.
async function fromFile(file) {
  if (!fs.existsSync(file)) { console.error(`\n  no such file: ${file}\n`); process.exit(1) }
  const sharp = require('sharp')
  fs.mkdirSync(ASSETS, { recursive: true })

  const meta = await sharp(file).metadata()
  console.log(`\n  source ${path.basename(file)}  ${meta.width}x${meta.height}`)

  const still = path.join(ASSETS, 'teacher-male.png')
  await sharp(file).png().toFile(still)
  console.log(`  ✓ still        ${(fs.statSync(still).size / 1024).toFixed(0)} KB`)

  // The badge is a 28px circle: the full still inside it is just his torso, so
  // crop to the most salient region, which on a portrait is the face.
  const head = path.join(ASSETS, 'teacher-male-head.png')
  await sharp(still).resize(512, 512, { fit: 'cover', position: sharp.strategy.attention }).png().toFile(head)
  console.log(`  ✓ headshot     ${(fs.statSync(head).size / 1024).toFixed(0)} KB`)

  console.log(wireIdentity() ? '  ✓ teacherIdentity.js now points at the male assets'
    : '  · teacherIdentity.js unchanged')
  console.log('\n  Done. Restart Metro so the new assets are bundled.\n')
}

async function main() {
  const fromIdx = argv.indexOf('--from')
  if (fromIdx >= 0 && argv[fromIdx + 1]) return fromFile(path.resolve(argv[fromIdx + 1]))

  const key = keyFromEnv()
  if (!key) {
    console.error('\n  HEYGEN_API_KEY is not set.')
    console.error('  Put it in server/.env (gitignored) or pass it inline:')
    console.error('      HEYGEN_API_KEY=... node scripts/fetch-heygen-avatar.js\n')
    console.error('  The avatar id alone is not enough — /v2/avatars answers 401')
    console.error('  without a key, so the id cannot be resolved to asset URLs.\n')
    process.exit(1)
  }

  console.log(`\n  avatar ${AVATAR_ID}`)
  const r = await fetch(`${BASE}/v2/avatars`, { headers: { 'x-api-key': key, accept: 'application/json' } })
  if (!r.ok) {
    console.error(`  ✗ /v2/avatars -> ${r.status} ${(await r.text()).slice(0, 160)}\n`)
    process.exit(1)
  }
  const body = await r.json()
  const all = [...((body.data && body.data.avatars) || []), ...((body.data && body.data.talking_photos) || [])]
  const hit = all.find((a) => a.avatar_id === AVATAR_ID || a.talking_photo_id === AVATAR_ID)
  if (!hit) {
    console.error(`  ✗ not on this account (${all.length} avatars available).`)
    console.error('    Check the id, or add the avatar to the account first.\n')
    process.exit(1)
  }
  console.log(`  ✓ found "${hit.avatar_name || hit.talking_photo_name || AVATAR_ID}"`)

  const img = hit.preview_image_url || hit.talking_photo_url || hit.image_url
  if (!img) { console.error('  ✗ this look exposes no preview image\n'); process.exit(1) }

  fs.mkdirSync(ASSETS, { recursive: true })
  const still = path.join(ASSETS, 'teacher-male.png')
  console.log(`  ✓ still        ${(await download(img, still) / 1024).toFixed(0)} KB`)

  // Head crop for the 28px badge. `attention` picks the most salient region,
  // which on a portrait is the face — the full still inside a circle would just
  // show his torso.
  const sharp = require('sharp')
  const head = path.join(ASSETS, 'teacher-male-head.png')
  await sharp(still).resize(512, 512, { fit: 'cover', position: sharp.strategy.attention }).png().toFile(head)
  console.log(`  ✓ headshot     ${(fs.statSync(head).size / 1024).toFixed(0)} KB`)

  if (hit.preview_video_url) {
    const vid = path.join(ASSETS, 'teacher-male.mp4')
    console.log(`  ✓ talking loop ${(await download(hit.preview_video_url, vid) / 1024).toFixed(0)} KB`)
  } else {
    console.log('  · no preview video on this look — the still is used instead')
  }

  console.log(wireIdentity() ? '  ✓ teacherIdentity.js now points at the male assets'
    : '  · teacherIdentity.js unchanged')
  console.log('\n  Done. Restart Metro so the new assets are bundled.\n')
  console.log('  The stage clip stays suppressed for him: it has HER composited onto')
  console.log('  the card gradient. To animate him there, run scripts/bake-teacher-clip.js')
  console.log('  against teacher-male.mp4 (needs ffmpeg on PATH).\n')
}

main().catch((e) => { console.error('\n  failed:', e.message, '\n'); process.exit(1) })
