// src/screens/braingym/palette.js
// ONE accent system for Brain Gym.
//
// The three hubs — Workout (WorkoutWheel), Arena (ArenaWheel) and Practice
// (PracticeDartboard) — each hardcoded their own accents, so the same feature
// changed colour as you moved between its tabs: Practice ran violet, Workout ran
// violet with orange, and Arena was green throughout, down to recolouring the
// app's own dock and help button. Three tabs of one product should not look like
// three products.
//
// Green is the accent — Arena's colour, kept because it is the one that was
// wanted once all three were seen together. Brain Gym deliberately keeps
// its dark arcade surface rather than the app's light Cuemath theme — that was a
// design decision, not an oversight, so only the ACCENT is unified here.
//
// ⚠ SEMANTIC COLOURS ARE NOT ACCENTS. `lose` stays red and `warn` stays amber
// whatever the accent happens to be — a lost match must never take the accent
// just because the accent moved. Never substitute `accent` for either of them.
export const BG = {
  // ── surfaces (all three hubs already agreed on these) ──
  bg:        '#0B0B0D',
  surface:   '#141418',
  surfaceLit:'#1A1A1F',
  ring:      '#16161A',
  ring2:     '#1E1E24',
  line:      '#2C2C30',

  // ── type ──
  ink:  '#FFFFFF',
  sub:  '#8E8E93',
  dim:  '#6E6E77',

  // ── the one accent family ──
  // GREEN, which is Arena's own colour. The first pass at unifying these screens
  // made everything violet because Arena was the odd one out; the call afterwards
  // was that Arena's green was the look worth keeping, so the family moved to it
  // rather than the other way round. Changing these five values is the whole
  // change — every hub reads them, which is what this file is for.
  accent:     '#39D98A',   // selected segment, active tab, centre glow
  accentLit:  '#5FE39A',   // hover/lit edge
  accentDeep: '#1C7A45',   // the filled segment behind a white label
  accent2:    '#2FB98C',   // deeper emerald — second stop on sweeps and gradients
  accentInk:  '#06210F',   // text sitting ON an accent fill

  // ── semantics ──
  // `win` and `accent` are now the SAME green, which the violet version kept
  // apart. That is tolerable because the pair a student actually reads is
  // win-versus-LOSE, and lose is untouched: a won match is still green against a
  // lost one in red. What must not happen is `lose` or `warn` drifting toward the
  // accent — those two carry the meaning, not the green.
  win:  '#39D98A',
  lose: '#E0322E',
  warn: '#FFD75E',
  gold: '#F2A93B',         // the matchstick/trophy amber, an object colour
};

export default BG;
