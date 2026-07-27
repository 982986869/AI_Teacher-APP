// "Atelier" design tokens for the AI Teacher — a warm, editorial luxury look
// (approved direction): warm ivory ground, ink-blue accent, a whisper of brass,
// serif display + Poppins body. One source of truth so the avatar, cards, dock and
// SVG boards re-theme together. Key names are unchanged so everything re-skins.
import { Platform } from 'react-native';

// Serif display role — used with restraint for the greeting, lesson title & formulas.
// System serif (Georgia on iOS, Noto/serif on Android) so no extra font dependency.
export const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export const T = {
  // Surfaces (cool off-white → white cards float on it)
  bg: '#F3F6FC',
  bgElev: '#F8FAFE',
  bgElev2: '#E4EBF7',

  // Fills (translucent cool-navy over the paper bg) + hairline borders
  glass: 'rgba(20,33,60,0.04)',
  glassStrong: 'rgba(20,33,60,0.07)',
  border: 'rgba(20,33,60,0.09)',
  borderStrong: 'rgba(20,33,60,0.15)',

  // Brand — AZURE primary, deep-teal secondary
  primary: '#2F6BEB',
  primaryBright: '#1E52C8',
  primarySoft: 'rgba(47,107,235,0.13)',

  // State accents — blue speaking · teal listening · blue thinking
  speaking: '#2F6BEB',
  listening: '#0E8F8F',
  thinking: '#2F6BEB',

  // Text (navy)
  text: '#16213B',
  textDim: '#4C5A78',
  textFaint: '#8593AE',

  // Semantic
  success: '#1E9E63',   // green
  danger: '#E0524B',    // red

  // Radii
  rXl: 28,
  rLg: 22,
  rMd: 16,
  rSm: 12,
};

// ── PREMIUM TYPOGRAPHY · SPACING · GLASS ──────────────────────────────────────
// One deliberate type system (Poppins — loaded at the AI Teacher root) and an
// Apple-style spacing scale, so the teaching surfaces read as one crafted product
// instead of ad-hoc numeric weights. Family names fall back to the system font if
// Poppins hasn't loaded, so referencing them is always safe.
export const F = {
  black: 'Poppins_800ExtraBold',
  bold:  'Poppins_700Bold',
  semi:  'Poppins_600SemiBold',
  med:   'Poppins_500Medium',
  reg:   'Poppins_400Regular',
};

// spacing scale (multiples that give generous, consistent rhythm)
export const SP = { xs: 4, sm: 8, md: 14, lg: 20, xl: 28, xxl: 40, xxxl: 56 };

// Faux-frosted glass for floating controls over the warm paper (no native blur
// dependency): layered translucent white + a bright top hairline + a soft ambient
// shadow reads as premium frosted glass on the light theme.
export const GLASS = {
  fill:       'rgba(255,255,255,0.60)',
  fillStrong: 'rgba(255,255,255,0.86)',
  hair:       'rgba(255,255,255,0.9)',  // inner top highlight
  edge:       'rgba(20,33,60,0.07)',    // faint outer border
  shadow:     '#1B2A47',                // cool ambient shadow
};

// State → accent color helper.
export const stateColor = (s) => (
  s === 'listening' ? T.listening : s === 'thinking' ? T.thinking : T.speaking
);

// ── CHALK-ON-SLATE palette — the board is a real slate she writes on, not a white
// card. Key names are unchanged (cream = board ground, ink = what she writes,
// accent = the colour she emphasises in…), so every SVG board, the formula card
// and the gestures re-skin from this one place without touching a call site.
//
// Two rules the values follow, because chalk is not just "light text on dark":
//   • nothing is pure white — chalk is warm and slightly dusty (#F2F5F0), and pure
//     white on a dark ground glares on an OLED phone in a dark room;
//   • the hues are DESATURATED versions of the light palette. A #F97316 orange
//     that sings on paper vibrates against slate, so it lands as chalk amber.
export const C = {
  cream: '#14201D',      // the slate itself
  cream2: '#1B2B27',     // elevated band / track on the slate
  board: '#14201D',      // board surface (same slate — cards sit ON it, not in it)
  ink: '#F2F5F0',        // chalk — primary
  ink2: '#B9C6BE',       // chalk — secondary
  dim: '#8FA096',        // labels / tertiary
  faint: '#5F6D66',      // faint / placeholders
  line: 'rgba(255,255,255,0.13)',  // hairline borders/dividers

  // diagram / token colors — chalk sticks: distinct enough that a multi-part
  // diagram still reads, muted enough that four of them don't fight.
  orange: '#EFC152',     // chalk amber
  blue: '#8FC7E8',       // chalk sky
  green: '#63D6BB',      // chalk mint (success / correct)
  pink: '#E88A86',       // chalk rose (danger / weak)
  accent: '#EFC152',     // chalk amber — what she underlines and boxes
  accentBright: '#F7D278',
  accentSoft: 'rgba(239,193,82,0.16)',
  teal: '#63D6BB',       // mint secondary
  brass: '#C9A5E8',      // chalk violet (field lines, flows)
  brassSoft: 'rgba(201,165,232,0.18)',

  // bottom area — slate bands (legacy WarmGradient key)
  peachBands: ['#14201D', '#131E1B', '#121D1A', '#111B18', '#101917', '#0C1512'],
  // very subtle bottom scrim
  scrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.18)'],
};

// ── DARK palette — the live classroom "room lights down" chrome. The whiteboard
// card itself stays on C (white surface + ink text), so every SVG board renders
// unchanged inside the dark room.
export const D = {
  bg: '#020617',                       // slate-950 — the room
  panel: '#0F172A',                    // slate-900 — teacher / caption panel
  panel2: '#1E293B',                   // slate-800 — inner chips, meta strip
  edge: 'rgba(255,255,255,0.10)',      // hairline on dark
  edgeSoft: 'rgba(255,255,255,0.06)',
  fill: 'rgba(255,255,255,0.10)',      // ghost button fill
  text: '#F8FAFC',
  textDim: '#94A3B8',
  textFaint: '#64748B',
  scrim: 'rgba(2,6,23,0.55)',
};

// ── Gradient pairs (rendered by <Gradient/> in uiKit — SVG based, no extra dep).
export const GRAD = {
  brand: ['#4F46E5', '#7E22CE'],   // indigo-600 → purple-700  (landing header)
  hot: ['#EC4899', '#FB923C'],     // pink-500 → orange-400    (primary CTA)
  mint: ['#0D9488', '#047857'],    // teal-600 → emerald-700   (study insights)
  violet: ['#4F46E5', '#9333EA'],  // indigo-600 → purple-600  (ask mic)
  ink: ['#1E293B', '#0F172A'],     // slate-800 → slate-900    (dark cards)
};

// Radii scale (the preview's generous rounding).
export const R = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, pill: 999 };
