// Design tokens ported 1:1 from the Ailernova Student system (src/theme/studentTheme.js).
// The canonical values also live as CSS custom properties in app/globals.css — this
// module is for the few places that need the raw values in TS (charts, inline accents).

export const S = {
  canvas: '#F4F5FB',
  card: '#FFFFFF',
  ink: '#151829',
  sub: '#454B63',
  muted: '#6A7086',
  faint: '#A6ABBE',
  hair: '#ECEEF6',
  border: '#E4E7F1',

  indigo: '#4F46E5', indigoSoft: '#ECEBFE',
  blue: '#2563EB', blueSoft: '#E5EDFF',
  emerald: '#0DA96B', emeraldSoft: '#DFF6EC',
  orange: '#F97316', orangeSoft: '#FFEEE2',
  gold: '#F5A623', goldSoft: '#FFF3DA',
  purple: '#8B5CF6', purpleSoft: '#F0EAFE',
  cyan: '#06B6D4', cyanSoft: '#DBF5FA',
  red: '#EF4444', redSoft: '#FDE7E7',
} as const

// Full tone lookup (every accent, incl. red for destructive/error states).
export const TONES = {
  indigo: { color: S.indigo, soft: S.indigoSoft },
  blue: { color: S.blue, soft: S.blueSoft },
  emerald: { color: S.emerald, soft: S.emeraldSoft },
  orange: { color: S.orange, soft: S.orangeSoft },
  gold: { color: S.gold, soft: S.goldSoft },
  purple: { color: S.purple, soft: S.purpleSoft },
  cyan: { color: S.cyan, soft: S.cyanSoft },
  red: { color: S.red, soft: S.redSoft },
} as const

export type AccentKey = keyof typeof TONES

// Ordered accent hues used to cycle a distinct colour per section/module.
export const ACCENTS = (['indigo', 'blue', 'emerald', 'orange', 'gold', 'purple', 'cyan'] as const)
  .map((key) => ({ key, ...TONES[key] }))

export function accent(key: AccentKey) {
  return { key, ...TONES[key] }
}

// Status → accent mapping reused across badges/pills.
export const STATUS_TONE: Record<string, AccentKey> = {
  active: 'emerald', published: 'emerald', ready: 'emerald', resolved: 'emerald',
  draft: 'gold', generating: 'gold', pending: 'gold', unresolved: 'orange',
  archived: 'purple', deactivated: 'red', failed: 'red', rejected: 'red',
}
