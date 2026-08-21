// src/theme/studentTheme.js
// The Student experience's own visual identity. It shares the app-wide DESIGN SYSTEM
// with the Parent app — the Nunito `T` typography, spacing rhythm, soft elevation and
// the native-driven motion primitives in parent/ParentApp/anim — but has a distinctly
// more energetic, inspiring COLOUR palette. Sections pick different accents from `S`
// while the neutral surfaces keep everything calm and premium.

export const S = {
  // ⚠ CUEMATH LIGHT SYSTEM. Keys are unchanged so the ~39 files reading S keep
  // working; only the values moved.
  //
  // `indigo` is the PRIMARY ACCENT and is deliberately the DARKENED amber, not the
  // brand yellow: it is used as a text/icon colour in 50 places against 31 fills, and
  // #FFC629 on white is 1.7:1. Reading has to win. Where a bright-yellow fill is
  // wanted, use `gold` with ink on top — that pair is safe.

  // Neutrals / surfaces
  canvas: '#F7F7F8',
  card: '#FFFFFF',
  ink: '#111111',
  sub: '#666666',
  muted: '#666666',
  faint: '#9B9B9B',
  hair: 'rgba(17,17,17,0.08)',
  border: 'rgba(17,17,17,0.12)',
  white: '#FFFFFF',

  // Accents. Each still reads on white; the softs are their tints.
  indigo: '#8A6A00', indigoSoft: '#FFF4CC',   // primary accent (see note above)
  gold: '#FFC629', goldSoft: '#FFF4CC',       // the brand yellow — a FILL, ink on top
  blue: '#2563EB', blueSoft: '#E8EEFD',
  emerald: '#0E9F6E', emeraldSoft: '#D6F5E7',
  orange: '#C2410C', orangeSoft: '#FDEAE0',
  purple: '#6D28D9', purpleSoft: '#EDE7FB',
  cyan: '#0891B2', cyanSoft: '#DCF1F7',
  red: '#D92D20', redSoft: '#FDECEA',

  // Hero. Was a deep indigo gradient for dark signature cards; on a white app that
  // is the one surface that fought the rest, so it is the brand yellow now.
  heroA: '#FFD75E', heroB: '#FFC629', heroGlow: '#FFF4CC',
};

// Premium soft elevation — a little deeper and indigo-tinted vs the Parent neutral.
export const shadow = {
  shadowColor: '#1A1B45', shadowOpacity: 0.10, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 5,
};
// A tighter shadow for small chips / dock.
export const shadowSm = {
  shadowColor: '#1A1B45', shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
};

// Ordered accent list — handy for cycling section hues.
export const ACCENTS = [S.indigo, S.blue, S.emerald, S.orange, S.gold, S.purple, S.cyan];
