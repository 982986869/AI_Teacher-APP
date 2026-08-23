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
// Violet is the accent, because two of the three hubs already led with it and it
// is the one Practice's centre gradient starts from. Brain Gym deliberately keeps
// its dark arcade surface rather than the app's light Cuemath theme — that was a
// design decision, not an oversight, so only the ACCENT is unified here.
//
// ⚠ SEMANTIC COLOURS ARE NOT ACCENTS. `win` stays green and `lose` stays red
// whatever the accent is: a won match must not render violet because violet is
// this season's colour. Never substitute `accent` for either.
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
  accent:     '#8B5CF6',   // violet — selected segment, active tab, centre glow
  accentLit:  '#A78BFA',   // hover/lit edge
  accentDeep: '#3B1E78',   // the filled segment behind a white label
  accent2:    '#3C9DF0',   // blue — second stop on sweeps and gradients
  accentInk:  '#1A1A1F',   // text sitting ON an accent fill

  // ── semantics — never swapped for the accent ──
  win:  '#39D98A',
  lose: '#E0322E',
  warn: '#FFD75E',
  gold: '#F2A93B',         // the matchstick/trophy amber, an object colour
};

export default BG;
