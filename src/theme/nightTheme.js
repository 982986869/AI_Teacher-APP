// src/theme/nightTheme.js
// The dark "night" palette shared by the AI-Teacher crafting screen and the Student
// Home. One source of truth so the two surfaces read as the same product rather than
// two dark screens that happen to both be purple.
//
// Deliberately NOT the `D` tokens in components/teacher/premiumTheme.js — those are
// slate-950 (#020617), a cool near-black for the live classroom where the whiteboard
// must dominate. This palette is indigo-violet: warmer, softer, for ambient screens.

export const N = {
  // surfaces
  bg: '#141130',                        // page base
  bgTop: '#1E1A4A',                     // page gradient, top
  bgBot: '#16123A',                     // page gradient, bottom
  glow: '#3B2F7E',                      // faint violet bloom
  glowBlue: '#2A3A7C',                  // faint blue bloom
  card: '#1C1943',                      // solid card
  cardSoft: 'rgba(255,255,255,0.04)',   // glass card fill
  cardEdge: 'rgba(255,255,255,0.075)',  // hairline border
  track: 'rgba(255,255,255,0.10)',      // progress trough / inert fill

  // type
  ink: '#FFFFFF',                       // headings, active state
  inkSoft: '#9A94BE',                   // body, secondary
  inkDim: '#6B6590',                    // pending, disabled

  // brand violet
  violet: '#8B6EF0',
  violetLo: '#6C4DE6',
  violetSoft: 'rgba(139,110,240,0.16)',
  dot: '#C4B8F5',

  // hero gradient (the "current lesson" card)
  heroA: '#7C5CE8',
  heroB: '#6247D4',

  // orb + progress fill (crafting screen)
  orbA: '#5E4FAE',
  orbB: '#463A8C',
  fillA: '#7C6BD4',
  fillB: '#9B8AEC',

  // semantic accents
  green: '#35BE7C',
  greenSoft: 'rgba(53,190,124,0.14)',
  amber: '#F5A623',
  amberSoft: 'rgba(245,166,35,0.14)',
  blue: '#5B8CFF',
  blueSoft: 'rgba(91,140,255,0.14)',
  // Error/destructive. The studentTheme red (#EF4444) muddies against the violet
  // page, so the night palette carries its own lighter, higher-contrast one.
  red: '#FF6B6B',
  redSoft: 'rgba(255,107,107,0.14)',

  pendingEdge: 'rgba(255,255,255,0.20)',
};

export const NFONT = {
  reg: 'SpaceGrotesk_400Regular',
  med: 'SpaceGrotesk_500Medium',
  semi: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
};

export default N;
