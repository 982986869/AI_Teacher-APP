// teacherIdentity.js
// Single source of truth for what the AI teacher LOOKS like.
//
// ▶ To use your own avatar (e.g. the 3D "bloom" character): replace the file
//   assets/teacher-avatar.png with your artwork (keep the same name). A square
//   headshot / upper-body crop works best — TeacherAvatar renders it inside a
//   circular frame with resizeMode:"cover", so anything off-centre gets cropped.
//   No code change needed — it shows everywhere the teacher appears.
//
// ▶ For a talking avatar with real lip movement, set TEACHER_VIDEO to a short
//   looping muted clip, e.g.  require('../../../assets/teacher-avatar.mp4').
//   The video takes priority over the photo; both fall back to the built-in
//   illustration if they fail to load.

export const TEACHER_PHOTO = require('../../../assets/teacher-avatar.png');
export const TEACHER_VIDEO = null;
