// src/components/support/theme.js
// Design tokens for the support flow (`chat-v3-topic-select` → `chat-v3`). The layout,
// spacing and type in the components are the Figma spec verbatim; this file is only the
// palette. The flow was drawn dark (#0C0936 base) and has been re-skinned onto the app's
// day palette, so a student moving from the light Home into support does not fall
// through a trapdoor into a dark screen.
//
// The values are taken from DAY (src/theme/dayTheme.js) rather than copied as hexes:
// that palette is the one Student Home and the dock already run on, and importing it
// means a change there reaches this flow instead of quietly drifting from it.
//
// ── The accent is YELLOW, and that is why three tokens exist where one used to ────────
// The re-skin first picked DAY.violet for the accent. The design's own light-mode
// comps use the app's hero yellow instead, so it now does too — but yellow behaves
// nothing like violet, and one token cannot cover the two jobs the old `indigo` did:
//
//   accent     a FILL. Reads as the accent because of its area, not its darkness.
//   onAccent   what sits ON that fill. Near-black — white on #FFBA07 is 1.4:1, i.e.
//              gone. Every `#FFFFFF` that used to sit on the violet is now this.
//   accentInk  accent-coloured TYPE on the page. The fill colour cannot do this job:
//              #FFBA07 on white measures 1.6:1. This is the same hue taken down until
//              it clears 4.5:1 on both surfaces the flow uses (5.00:1 on #FFFFFF,
//              4.72:1 on the #F8F8FB page).
//
// Splitting fill from ink is the whole change; violet happened to be dark enough to do
// both, which is what hid the distinction until the accent moved.
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
  // #FFBA07 — user bubble, send button, primary CTAs, typing dots, the rich card's
  // border. DAY.heroA is the Home hero's fill, so support and the screen a student
  // arrives from are literally the same yellow rather than two that nearly match.
  //
  // ⚠ Measured 1.61:1 against the page. That is under WCAG 1.4.11's 3:1 for a component
  // boundary, and it is not an oversight: the Home hero is this exact fill on this exact
  // background, so "fixing" it here would make support the one screen wearing a colour
  // the rest of the app does not. The shapes it paints are large and self-evident (a
  // bubble, a 40px send disc, a 50px CTA) rather than a control you have to find. The
  // one place the thinness genuinely bit — 28px topic badges — already carries a
  // hairline for it, see TopicSelect's `badge`.
  accent: DAY.heroA,
  // Type and icons ON `accent`. Pure #FFFFFF was correct on the violet and is invisible
  // on yellow; this is the hero's own label colour and measures 11.05:1.
  onAccent: DAY.ctaFg,      // #141118
  // Accent-coloured type on the PAGE: "View Invoice", "Email this conversation",
  // attachment filenames, and the "Not sent · Retry" warning, which is 11px semibold and
  // therefore holds this token to the full 4.5:1 rather than the 3:1 large-text bar.
  accentInk: '#A85C04',
  // The ticket badge (`#AL-2291`). Violet was dark enough to be legible as type on a 10%
  // wash of itself; yellow is not, so the badge is now the solid fill with `onAccent` on
  // it — which is also what the comps show.
  //
  // ⚠ SOLID, and only for that badge. `ticketBg` used to be the 10% wash, and three
  // other things had borrowed it precisely BECAUSE it was barely visible — the topic
  // screen's back button, most of all, which turned into a solid disc floating over the
  // agent's avatar the moment this became a fill. Anything that wants "barely there but
  // present" takes `accentSoft` below; this key means the badge and nothing else.
  ticketBg: DAY.heroA,
  // The wash `ticketBg` used to be: a tint you can lay under a small control without it
  // becoming the loudest thing on the screen.
  accentSoft: DAY.amberSoft, // #FEF3C7
  // Inert fill — a finished thing that must not look like it wants attention. DAY uses
  // this for skeletons, ghost buttons and empty days, which is the same idea.
  inert: DAY.cardSoft,       // #F3F4F6
  // Agent-avatar fallback (the initial in a circle). The dark flow used a solid
  // #2B2560 with light type on it; on white that pairing inverts, so the circle
  // becomes a pale wash of the accent and the initial keeps the normal ink colour.
  avatarBg: DAY.amberSoft,  // #FEF3C7 — same value as accentSoft, different question
  online: DAY.green,        // presence dot
  wa: '#25D366',            // WhatsApp brand green — a brand colour, not a theme one
  // The resolved tick and the "duplicate payment" / rating amber. The dark flow's
  // #3DD68C and #F5A623 were mixed to sit on a near-black page and are far too light
  // to carry as type on white; DAY's own green and amber are the light-page versions.
  success: DAY.green,       // #12A06A — fills, and the 22px bold "Resolved" heading,
                            // which clears 3:1 as WCAG large text (3.35:1 measured)
  // #D97706 — the rating ribbons, and icons/fills generally (3.19:1 clears the 3:1
  // non-text threshold, and nothing else). Deliberately NOT `accent`: the ribbons are
  // stroked outlines, not filled shapes, so at #FFBA07 they would be a 1.6:1 scribble.
  amber: DAY.amber,
};

// ── Topic badges ─────────────────────────────────────────────────────────────────────
// The numbered circles in the topic list, and the same circle repeated in the chat
// header. Each entry pairs a fill with the numeral that goes on it, because the right
// numeral is NOT the same on every swatch: on this green white measures 3.35:1 and on
// this violet near-black measures 3.32:1 — each fails, and each fails on the swatch the
// other one passes. A 14px bold numeral is not WCAG "large text" (that starts at
// 18.66px bold), so both are held to the full 4.5:1 and the ink is chosen per swatch.
//
// The fills are DAY's semantic colours rather than the dark comps' hexes, whose palest
// (#E8D14D) dropped to 1.54:1 on white and left its numeral floating.
export const BADGE = {
  accent: { tint: D.accent, badgeInk: D.onAccent },   // 10.93:1
  // Figma `number-badge` panel. Pastel, so the numeral is near-black here too.
  green:  { tint: '#8FF0C0',  badgeInk: D.onAccent }, // 15.11:1
  // Read off the Figma `number-badge` panel (28×28, r14, #D8C7F5) — a PASTEL, not the
  // brand violet. It also settles the numeral: white on this measures 1.57:1 and is
  // simply not there, so the numeral is near-black (12.08:1).
  violet: { tint: '#D8C7F5', badgeInk: D.onAccent },  // 12.08:1
  blue:   { tint: '#A9DDF5',  badgeInk: D.onAccent }, // 13.79:1
  red:    { tint: DAY.red,    badgeInk: '#FFFFFF' },  //  4.67:1
  // `plain` rows draw no badge at all; this exists so every category can carry a swatch
  // and nothing has to special-case the one that never paints it.
  grey:   { tint: DAY.inkSoft, badgeInk: '#FFFFFF' },
};

// ► TODO(figma-badges): `red` is the last unconfirmed swatch. It is the 5th row and only
//   the STUDENT list has one ("App not working"), which is why the parent-list comps
//   never showed it — so it is still the saturated day-palette red while 1-4 are pastels,
//   and it will be the one badge that shouts. Replace it with its panel value when the
//   student screen is drawn, and re-check the numeral: every pastel here flipped it to
//   near-black, and #DC2F35 is the only swatch still carrying white.

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
