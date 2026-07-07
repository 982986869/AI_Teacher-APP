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
export const TEACHER_VIDEO = null;

// ▶ TALKING 3D AVATAR (your image → rigged 3D head).
//   Turn your photo into a rigged .glb on https://avaturn.me (paid) or
//   https://readyplayer.me (free — gives you a hosted URL directly), then paste
//   the hosted .glb URL below. TeacherFullBody then renders it in 3D with
//   lip-sync everywhere the teacher hero appears; every call site is unchanged.
//   Ready Player Me example: 'https://models.readyplayer.me/<id>.glb'
//   Leave null to keep the still photo above. Avaturn .glb files must be hosted
//   somewhere reachable (any static host / your own bucket) — a local file path
//   won't work without expo-asset installed.
export const TEACHER_GLB_URL = null;
