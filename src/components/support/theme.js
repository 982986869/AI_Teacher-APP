// src/components/support/theme.js
// Design tokens for the support flow (`chat-v3-topic-select` → `chat-v3`), read straight
// off the Figma properties panels. Shared by TopicSelect, ChatScreen and HelpFab.
import React from 'react';
import { Text } from 'react-native';

export const D = {
  bg: '#0C0936',          // screen base
  card: '#171440',        // panels, bubbles, chips, input field
  border: '#30363D',      // every hairline
  ink: '#F0F6FC',         // primary type
  muted: '#8B949E',       // secondary type + icon strokes
  placeholder: '#484F58', // input placeholder
  indigo: '#6366F1',      // user bubble, send button, ticket ref, typing dots
  ticketBg: '#21262D',    // ticket-badge fill
  online: '#3FB950',      // presence dot — not in the file, matches the mockup
  wa: '#25D366',          // WhatsApp brand green — not in the file
  // Read off the mockups rather than a properties panel: the resolved tick/heading and
  // the receipt card's confirm button, and the "duplicate payment" / rating amber.
  success: '#3DD68C',
  amber: '#F5A623',
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
