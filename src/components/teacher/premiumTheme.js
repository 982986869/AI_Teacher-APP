// Light "peach & mint" design tokens for the AI Teacher (Cuemath-style, friendly
// EdTech look). One source of truth so the avatar, cards, dock and screens stay
// cohesive. Key names are unchanged from the old dark theme — only the values —
// so every screen and SVG board re-themes together.

export const T = {
  // Surfaces (warm white)
  bg: '#FFF9F5',
  bgElev: '#FFFFFF',
  bgElev2: '#FFF1E9',

  // Fills (translucent dark over the light bg) + borders
  glass: 'rgba(44,48,67,0.04)',
  glassStrong: 'rgba(44,48,67,0.07)',
  border: 'rgba(44,48,67,0.10)',
  borderStrong: 'rgba(44,48,67,0.16)',

  // Brand (peach / coral)
  primary: '#FF6F61',
  primaryBright: '#FF5C4D',
  primarySoft: 'rgba(255,111,97,0.16)',

  // State accents
  speaking: '#FF6F61',   // peach
  listening: '#0FA39A',  // mint
  thinking: '#F5A623',   // amber

  // Text (dark slate)
  text: '#2C3043',
  textDim: '#5E6473',
  textFaint: '#9097A6',

  // Semantic
  success: '#0FA39A',    // mint-green
  danger: '#F2685F',

  // Radii
  rXl: 28,
  rLg: 22,
  rMd: 16,
  rSm: 12,
};

// State → accent color helper.
export const stateColor = (s) => (
  s === 'listening' ? T.listening : s === 'thinking' ? T.thinking : T.speaking
);

// ── CLASSROOM palette — LIGHT peach & mint theme. Key names kept (cream = app
// bg, ink = text…) so the player and its SVG boards re-theme together.
export const C = {
  cream: '#FFF9F5',      // app background (warm white)
  cream2: '#FFF1E9',     // soft peach elevated
  board: '#FFFFFF',      // card / surface
  ink: '#2C3043',        // primary text (dark slate)
  ink2: '#5E6473',       // secondary text
  dim: '#9097A6',        // dim grey
  faint: '#B9BECB',      // faint grey / placeholders
  line: 'rgba(44,48,67,0.10)',  // borders/dividers on light

  // diagram / token colors — tuned to read on a white board
  orange: '#EF8A43',
  blue: '#3C9DF0',
  green: '#0FA39A',
  pink: '#EE6F96',
  accent: '#FF6F61',     // peach primary

  // bottom area — peach fading into mint (warm → cool)
  peachBands: ['#FFF9F5', '#FFF4EE', '#FFEFE7', '#F1F8F3', '#E9F6EF', '#E3F5EC'],
  // very subtle bottom scrim
  scrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.02)', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.06)'],
};
