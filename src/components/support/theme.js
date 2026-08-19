// src/components/support/theme.js
// Design tokens for the support flow (`chat-v3-topic-select` → `chat-v3`). The layout,
// spacing and type below are still the Figma spec; the PALETTE is not. The flow was
// drawn dark (#0C0936 base) and has been re-skinned onto the app's day palette, so a
// student moving from the light Home into support does not fall through a trapdoor
// into a dark screen.
//
// The values are taken from DAY (src/theme/dayTheme.js) rather than copied as hexes:
// that palette is the one Student Home and the dock already run on, and importing it
// means a change there reaches this flow instead of quietly drifting from it.
//
// Token NAMES are unchanged on purpose — `indigo` is violet now and `card` is white —
// so none of the seven components that read them had to be rewritten. Renaming them
// would have been a much larger diff for no visual difference.
import React from 'react';
import { Text } from 'react-native';
import { DAY } from '../../theme/dayTheme';

export const D = {
  // The page sits on the palette's off-white, NOT its pure white, so that the header,
  // the input and the agent bubbles — all `card` — read as raised surfaces. With both
  // at #FFFFFF the whole screen flattens into one sheet and only the hairlines survive.
  bg: DAY.bgBot,            // #F8F8FB — screen base
  card: DAY.card,           // #FFFFFF — panels, agent bubbles, chips, input field
  border: DAY.cardEdge,     // #E5E5EA — every hairline
  ink: DAY.ink,             // #1C1C1E — primary type
  muted: DAY.inkSoft,       // #6B7280 — secondary type + icon strokes
  // The palette's dimmest ink (#9CA3AF) is the natural placeholder colour and is what
  // the rest of the app uses for de-emphasis, but on white it measures 2.54:1 — under
  // every threshold, including the 3:1 floor for incidental text. The composer's
  // placeholder is the one thing a student reads before they know what to type, so it
  // takes the secondary ink instead. That makes it equal to `muted`; they are kept as
  // separate keys because they answer to different questions and may diverge again.
  placeholder: DAY.inkSoft,
  indigo: DAY.violet,       // #7C3AED — user bubble, send button, ticket ref, typing dots
  ticketBg: DAY.violetSoft, // ticket-badge fill, a 10% wash of the accent
  // Agent-avatar fallback (the initial in a circle). The dark flow used a solid
  // #2B2560 with light type on it; on white that pairing inverts, so the circle
  // becomes the accent wash and the initial keeps the normal ink colour.
  avatarBg: DAY.violetSoft,
  online: DAY.green,        // presence dot
  wa: '#25D366',            // WhatsApp brand green — a brand colour, not a theme one
  // The resolved tick and the "duplicate payment" / rating amber. The dark flow's
  // #3DD68C and #F5A623 were mixed to sit on a near-black page and are far too light
  // to carry as type on white; DAY's own green and amber are the light-page versions.
  success: DAY.green,       // #12A06A — fills, and the 22px bold "Resolved" heading,
                            // which clears 3:1 as WCAG large text (3.35:1 measured)
  amber: DAY.amber,         // #D97706 — icons and fills only (3.19:1 clears the 3:1
                            // non-text threshold, and nothing else)
  // ...but NOT small type. "Not sent · Retry" is 11px semibold, so it needs 4.5:1 and
  // DAY.amber gives 3.19. This is that amber darkened by the least amount that clears
  // the bar (4.54:1) — the same hue, so the retry affordance still reads as the warning
  // colour beside its icon rather than turning into a second, unrelated accent.
  amberInk: '#B26205',
};

// The whole flow is specced in Inter. 400/500/600/700 are loaded app-wide in App.js.
export const IF = {
  reg: 'Inter_400Regular',
  med: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

// Inter text atom — the parent app's `T` is Nunito, so these screens carry their own.
export function TX({ w = 'reg', s = 14, lh, c = D.ink, style, children, ...rest }) {
  return (
    <Text style={[{ fontFamily: IF[w], fontSize: s, color: c }, lh ? { lineHeight: lh } : null, style]} {...rest}>
      {children}
    </Text>
  );
}

// "2:09 PM" — the format the event chips and message timestamps use.
export function fmtClock(d = new Date()) {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "11 Aug 2026, 12:01 PM" — for server timestamps that are shown on their own rather than
// beside a message. Built on fmtClock so the time half matches the bubbles exactly.
// Returns '' for anything unparseable: a blank line is honest, an "Invalid Date" is not.
export function fmtStamp(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${fmtClock(d)}`;
}
