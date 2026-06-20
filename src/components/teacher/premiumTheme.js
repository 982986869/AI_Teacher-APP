// Premium dark design tokens for the AI Teacher (App-Store-grade EdTech look).
// One source of truth so the avatar, glass cards, dock and screens stay cohesive.

export const T = {
  // Surfaces
  bg: '#0D1117',
  bgElev: '#161B22',
  bgElev2: '#1B2230',

  // Glass (translucent fills layered over the dark bg)
  glass: 'rgba(255,255,255,0.055)',
  glassStrong: 'rgba(255,255,255,0.09)',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',

  // Brand
  primary: '#7C3AED',
  primaryBright: '#9F67FF',
  primarySoft: 'rgba(124,58,237,0.16)',

  // State accents
  speaking: '#9F67FF',   // purple
  listening: '#22D3EE',  // cyan
  thinking: '#F59E0B',   // amber

  // Text
  text: '#E6EDF3',
  textDim: '#9BA7B4',
  textFaint: '#6B7686',

  // Semantic
  success: '#34D399',
  danger: '#F87171',

  // Radii
  rXl: 28,
  rLg: 22,
  rMd: 16,
  rSm: 12,
};

// State → accent color helper (dark theme).
export const stateColor = (s) => (
  s === 'listening' ? T.listening : s === 'thinking' ? T.thinking : T.speaking
);

// ── CLASSROOM palette — DARK premium theme (deep navy/black + purple accent).
// Key names are kept (cream = app bg, ink = text…) so the player and its SVG
// boards re-theme together; only the values are dark now.
export const C = {
  cream: '#0C0C13',      // app background (dark)
  cream2: '#14141F',     // slightly elevated dark
  board: '#15161F',      // card / surface
  ink: '#F1F1F7',        // primary text (near white)
  ink2: '#C3C4D2',       // secondary text (light grey)
  dim: '#8C8DA0',        // dim grey
  faint: '#5C5D70',      // faint grey / placeholders
  line: 'rgba(255,255,255,0.10)',  // borders/dividers on dark

  // diagram / token colors (base=orange, height=blue, hypotenuse=green) — tuned
  // a touch brighter so they read on the dark board.
  orange: '#F2A15C',
  blue: '#6FB7FF',
  green: '#57D697',
  pink: '#FF8FB0',
  accent: '#7C3AED',     // purple primary

  // bottom area — kept dark (near-solid) so the whole screen reads as one surface
  peachBands: ['#0C0C13', '#0C0C13', '#0D0D15', '#0E0E17', '#0F0F1A', '#10101C'],
  // very subtle bottom scrim
  scrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.10)', 'rgba(0,0,0,0.16)'],
};
