// teacherIdentity.js
// Single source of truth for what the AI teacher LOOKS like.
//
// ▶ To use your own avatar: replace assets/teacher-avatar.png (keep the name).
//   TEACHER_PHOTO is rendered full-body by TeacherFullBody on the AI-Teacher
//   landing hero and the live-teaching hero — a PORTRAIT frame with
//   resizeMode:"cover", so a wide full-body shot (figure centred, backdrop on the
//   sides) crops the sides and shows the whole standing figure head-to-toe.
//   The small floating corner badge still uses the animated illustrated
//   TeacherAvatar (blinks + lip-sync), so it does not use this photo.
//   assets/teacher-avatar-full.png keeps the original untouched full-body art.
//
// ▶ For a talking avatar with real lip movement, set TEACHER_VIDEO to a short
//   looping muted clip, e.g.  require('../../../assets/teacher-avatar.mp4').
//   The video takes priority over the photo; both fall back to the built-in
//   illustration if they fail to load.

export const TEACHER_PHOTO = require('../../../assets/teacher-avatar.png');

// Head-and-shoulders crop of the same avatar, for the small CIRCULAR badge (the
// full-body shot would just show her torso inside a circle). Swap this file to
// change the badge face. To use the exact head-shot you provided, overwrite
// assets/teacher-head.png with it (a square/portrait crop, face centred).
export const TEACHER_HEADSHOT = require('../../../assets/teacher-head.png');

// ▶ TALKING VIDEO (lip movement on this same avatar).
//   1. Generate a short talking clip FROM assets/teacher-avatar.png with an
//      image→video tool (D-ID / HeyGen / Runway — free tiers work). Keep it muted,
//      2–6 s, and it will loop; the tool keeps the same framing so it blends with
//      the still. Export as .mp4 (H.264).
//   2. Save it as  assets/teacher-avatar.mp4  and switch the line below to:
//         export const TEACHER_VIDEO = require('../../../assets/teacher-avatar.mp4');
//      (or, for a hosted file:  export const TEACHER_VIDEO = { uri: 'https://…/clip.mp4' };)
//   TeacherFullBody then plays it (muted, looping) with real mouth movement, and
//   falls back to the still photo automatically if it ever fails to load.
//   NOTE: the loop is AMBIENT talking motion, not word-synced to the lesson TTS —
//   for mouth shapes that match the actual words, use the 3D/GLB route below.
// HeyGen avatar "Tahlia in White shirt" (look id Tahlia_public_5), downloaded from
// that look's preview clip so the app SHIPS the file rather than calling HeyGen at
// runtime — no API key in the client, nothing to expire, works offline.
// To swap her for another look: GET https://api.heygen.com/v2/avatars with the key
// (server-side / your shell, never in this repo), save the look's preview_video_url
// as assets/teacher-tahlia.mp4, and this line does not change.
export const TEACHER_VIDEO = require('../../../assets/teacher-tahlia.mp4');

// ▶ THE SAME CLIP, WITH THE TEACHING SCREEN'S VIOLET STAGE BAKED IN.
//   LiveTeachingPlayer's camera card shows her on a violet gradient, and the raw
//   HeyGen clip above carries an opaque near-white studio backdrop (H.264 has no
//   alpha), so dropping it straight into that card whites the whole stage out.
//   scripts/bake-teacher-clip.js keys the backdrop and composites her over the
//   card's own gradient once, offline — a plain H.264 file that needs no runtime
//   keying and plays on both platforms.
//
//   Regenerate after ANY avatar swap, and whenever CAM_GRAD in LiveTeachingPlayer
//   changes, or the card will change colour the moment she starts talking:
//       node scripts/bake-teacher-clip.js
export const TEACHER_STAGE_CLIP = require('../../../assets/teacher-tahlia-stage.mp4');

// ▶ TALKING 3D AVATAR (your image → rigged 3D head).
//   Turn your photo into a rigged .glb on https://avaturn.me (paid) or
//   https://readyplayer.me (free — gives you a hosted URL directly), then paste
//   the hosted .glb URL below. TeacherFullBody then renders it in 3D with
//   lip-sync everywhere the teacher hero appears; every call site is unchanged.
//   Ready Player Me example: 'https://models.readyplayer.me/<id>.glb'
//   Leave null to keep the still photo above. Avaturn .glb files must be hosted
//   somewhere reachable (any static host / your own bucket) — a local file path
//   won't work without expo-asset installed.
//
//   NOTE: this is a Ready Player Me PLACEHOLDER, requested with the ARKit +
//   Oculus-viseme morph sets so the whole AvatarRuntime (expressions + lip-sync)
//   runs against real 52-blendshape geometry. Swap it for the artist's hosted
//   teacher.glb when it ships — one string change, nothing else moves. The rig is
//   validated / exported / optimized by the tooling in blender/ and scripts/.
export const TEACHER_GLB_URL =
  'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus%20Visemes';

// ── VOICE-MATCHED IDENTITY ───────────────────────────────────────────────────
// The teacher above is female, and so is the server voice (ElevenLabs). When that
// voice is unreachable the app falls back to the device's own engine, and on many
// Android builds the only English voice is male — leaving a woman on screen and a
// man speaking. That reads as a bug, not as a fallback.
//
// `teacherFor(gender)` returns the identity to render for the voice the student
// is actually hearing. teacherVoice.js publishes that gender: subscribe with
// onTeacherVoiceGenderChange, or read getTeacherVoiceGender().
//
// ⚠ THE MALE ASSETS DO NOT EXIST YET, so the male entry currently returns the
// female ones and nothing changes on screen. This is deliberate: a require() of a
// missing file does not fall back, it fails the bundle, so the switch is wired and
// inert rather than wired and broken.
//
// To finish it, generate these three from HeyGen avatar 214e2370f8464f83a3d3fe9bcf412c64
// — the same way assets/teacher-tahlia.mp4 was produced from Tahlia_public_5 —
// and save them beside the existing files:
//
//     assets/teacher-male.png         full-body still, figure centred
//     assets/teacher-male-head.png    square head-and-shoulders crop for the badge
//     assets/teacher-male.mp4         2–6 s muted talking loop, H.264
//
// then replace the three `require` lines in MALE below with those paths. Nothing
// else changes — every call site already goes through teacherFor().
const FEMALE = {
  gender: 'f',
  hasOwnArt: true,
  // The STUDENT-FACING name. "Tahlia" is HeyGen's name for the source avatar and
  // is an asset detail; the lesson has always shown "Ms. Nova". That string was
  // hardcoded in LiveTeachingPlayer, which is why it could not follow the voice.
  name: 'Ms. Nova',
  photo: TEACHER_PHOTO,
  headshot: TEACHER_HEADSHOT,
  video: TEACHER_VIDEO,
  stageClip: TEACHER_STAGE_CLIP,
};

const MALE = {
  gender: 'm',
  name: 'Mr. Iker',
  // False until a male photo actually exists. The fields below still point at
  // HER files, because a require() of a missing asset fails the bundle rather
  // than falling back — so consumers must ask this before showing `photo` or
  // `headshot`, and draw the illustrated male avatar instead when it is false.
  hasOwnArt: false,
  photo: TEACHER_PHOTO,           // → require('../../../assets/teacher-male.png')
  headshot: TEACHER_HEADSHOT,     // → require('../../../assets/teacher-male-head.png')
  video: TEACHER_VIDEO,           // → require('../../../assets/teacher-male.mp4')
  stageClip: TEACHER_STAGE_CLIP,
};

// True once the male identity is genuinely distinct — used to avoid announcing a
// change that would not be visible.
export const MALE_ASSETS_READY = MALE.photo !== FEMALE.photo;

export function teacherFor(gender, remote) {
  const base = gender === 'm' ? MALE : FEMALE;
  return applyRemote(base, remote && remote[gender === 'm' ? 'male' : 'female']);
}

// Overlay the server's override onto a bundled identity.
//
// The bundled assets are require()d module numbers and the server's are URL
// strings, but every consumer passes these straight to <Image source> / <Video
// source>, which accept either — a string only has to be wrapped as { uri }.
//
// Per FIELD, not per identity: an override that sets only a headshot keeps the
// bundled photo and clip, so a partial upload degrades to a partial swap instead
// of a broken screen. stageClip has no override because it is not interchangeable
// — it has the lesson card's own gradient baked in by scripts/bake-teacher-clip.js,
// so a raw hosted clip in its place would white the stage out.
function applyRemote(base, o) {
  if (!o) return base;
  const out = { ...base };
  if (typeof o.name === 'string' && o.name.trim()) out.name = o.name.trim();
  // https only, re-checked here rather than trusted from the response: this is
  // the layer that hands the value to <Image>/<Video>, and on Android a cleartext
  // URL fails silently — a blank teacher with nothing in the logs to explain it.
  for (const f of ['photo', 'headshot', 'video']) {
    if (typeof o[f] === 'string' && o[f].slice(0, 8).toLowerCase() === 'https://') {
      out[f] = { uri: o[f] };
      out.hasOwnArt = true;   // a real asset of its own, so consumers may show it
    }
  }
  return out;
}
