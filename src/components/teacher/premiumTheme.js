// "Nova" design tokens for the AI Teacher — a calm, editorial-modern look: a cool
// slate paper ground, an indigo brand accent, an emerald secondary, with a serif
// display used sparingly over a Poppins body. One source of truth so the avatar,
// cards, dock and SVG boards re-theme together. Legacy key names are kept (see the
// notes on `brass`/`peachBands` below) so every surface re-skins from this file.
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

// ── LIGHT palette — slate paper + indigo brand (the "Nova" direction). Key names
// are kept (cream = app bg, ink = text, accent = brand…) so the player, its SVG
// boards, the avatar and the dock all re-theme from this one place.
export const C = {
  cream: '#F8FAFC',      // app background — slate-50
  cream2: '#F1F5F9',     // elevated / track — slate-100
  board: '#FFFFFF',      // card / surface
  ink: '#0F172A',        // primary text — slate-900
  ink2: '#475569',       // secondary text — slate-600
  dim: '#94A3B8',        // labels / tertiary — slate-400
  faint: '#CBD5E1',      // faint / placeholders — slate-300
  line: 'rgba(15,23,42,0.08)',  // hairline borders/dividers

  // diagram / token colors — distinct hues kept so multi-part diagrams still read
  orange: '#F97316',     // orange-500
  blue: '#3B82F6',       // blue-500
  green: '#10B981',      // emerald-500 (success / correct)
  pink: '#F43F5E',       // rose-500 (danger / weak)
  accent: '#4F46E5',     // INDIGO-600 — primary brand
  accentBright: '#4338CA',
  accentSoft: 'rgba(79,70,229,0.12)',
  teal: '#10B981',       // emerald secondary
  brass: '#8B5CF6',      // violet (kept for compatibility)
  brassSoft: 'rgba(139,92,246,0.14)',

  // bottom area — slate bands (legacy WarmGradient key)
  peachBands: ['#F8FAFC', '#F6F9FC', '#F4F7FB', '#F2F6FA', '#F0F4F9', '#EEF2F8'],
  // very subtle bottom scrim
  scrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.02)', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.06)'],
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
