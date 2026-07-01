// cameraDirector.js
// ── THE CAMERA DIRECTOR ───────────────────────────────────────────────────────
// A premium lesson is *shot*, not just displayed. A real teaching video racks
// focus between the teacher and the board: an establishing wide shot, a push-in
// on the board while she works, then back to her face when she turns to you.
//
// This assigns each beat a CAMERA FOCUS. The player turns that into a smooth
// rack-focus (scale + gentle dim) — no hard cuts, no layout jumps. It never
// moves the actual DOM; it only changes emphasis, so text stays crisp and the
// scroll position is untouched.
//
//   'teacher' — she owns the frame (she's addressing you / no board yet)
//   'board'   — push in on the board (a diagram is being drawn, a formula written)
//   'wide'    — establishing / both in frame (scene open, quick-check)

// Focus for one beat, from what that beat is doing.
export function cameraForBeat({ expression, i, n, boardTotal, template }) {
  const first = i === 0;
  const last = i === n - 1;

  if (!boardTotal) return 'teacher';               // text-only scene — she is the shot
  if (template === 'QuickCheck') return 'wide';    // question + student together
  if (first && n > 1) return 'wide';               // establishing shot as the scene opens
  if (last) return 'teacher';                       // she turns back to you to land it
  if (expression === 'writing' || expression === 'pointing') return 'board'; // push in on her work
  return 'board';
}

// The rack-focus target the player animates toward: 0 = full teacher focus,
// 1 = full board focus, 0.5 = wide/neutral. Kept as one scalar so a single
// Animated value can drive both the board's scale/dim and the teacher's size.
export function focusTarget(camera) {
  switch (camera) {
    case 'teacher': return 0;
    case 'board': return 1;
    case 'wide':
    default: return 0.5;
  }
}
