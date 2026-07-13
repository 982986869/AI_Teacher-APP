// src/theme/studentTheme.js
// The Student experience's own visual identity. It shares the app-wide DESIGN SYSTEM
// with the Parent app — the Nunito `T` typography, spacing rhythm, soft elevation and
// the native-driven motion primitives in parent/ParentApp/anim — but has a distinctly
// more energetic, inspiring COLOUR palette. Sections pick different accents from `S`
// while the neutral surfaces keep everything calm and premium.

export const S = {
  // Neutrals / surfaces (slightly indigo-tinted so white cards feel lifted).
  canvas: '#F4F5FB',
  card: '#FFFFFF',
  ink: '#151829',
  sub: '#454B63',
  muted: '#6A7086',
  faint: '#A6ABBE',
  hair: '#ECEEF6',
  border: '#E4E7F1',
  white: '#FFFFFF',

  // Vibrant accents — each section leans on one so the page reads energetic yet unified.
  indigo: '#4F46E5', indigoSoft: '#ECEBFE',
  blue: '#2563EB', blueSoft: '#E5EDFF',
  emerald: '#0DA96B', emeraldSoft: '#DFF6EC',
  orange: '#F97316', orangeSoft: '#FFEEE2',
  gold: '#F5A623', goldSoft: '#FFF3DA',
  purple: '#8B5CF6', purpleSoft: '#F0EAFE',
  cyan: '#06B6D4', cyanSoft: '#DBF5FA',
  red: '#EF4444', redSoft: '#FDE7E7',

  // Deep indigo hero gradient + its glow, for the signature dark cards.
  heroA: '#3B2F86', heroB: '#191B3D', heroGlow: '#8B93FF',
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
