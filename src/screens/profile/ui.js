// src/screens/profile/ui.js
// The pieces the three Profile screens repeat: typed text, the screen header with its
// bordered round back button, the black pill CTA and its footer, and the home indicator.
//
// They live here rather than in each screen because Edit Profile and Learning
// Preferences draw the SAME header (Figma: screen-header, padding 20/24/4/24, gap 8)
// and the SAME footer (border-top 1px, padding 20, a 52px radius-26 black CTA). One
// definition each keeps them from drifting apart as either screen is edited.
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { P, F, PAD, TRACK } from './theme';

const FAM = { reg: F.reg, med: F.med, semi: F.semi, bold: F.bold };

export function T({ w = 'reg', s = 14, c = P.ink, style, children, ...rest }) {
  return (
    <Text {...rest} style={[{ fontFamily: FAM[w] || F.reg, fontSize: s, color: c }, style]}>
      {children}
    </Text>
  );
}

// Figma: 40x40, radius 20, 1px #E5E7EB on #FFFFFF. The chevron itself has no panel —
// 20px at 2.2 weight matches the drawing.
export function BackButton({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [u.back, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <ChevronLeft size={20} color={P.ink} strokeWidth={2.2} />
    </Pressable>
  );
}

// The header both sub-screens share, identically. The back button sits BESIDE the title,
// not above it — the two hug heights only add up that way:
//   Edit Profile          92 = 20 top + 40 row + 8 gap + 20 subtitle (1 line) + 4 bottom
//   Learning Preferences 112 = 20 top + 40 row + 8 gap + 40 subtitle (2 lines) + 4 bottom
// Stacked, the button's own 40 would put both frames ~40px over what Figma reports.
//
// Learning Preferences names the row `top-row` and gives it gap 12; Edit Profile does not
// export that node, so it takes the same 12.
export function ScreenHeader({ title, subtitle, onBack }) {
  return (
    <View style={u.header}>
      <View style={u.topRow}>
        <BackButton onPress={onBack} />
        <T w="bold" s={24} style={{ flex: 1 }}>{title}</T>
      </View>
      {/* Figma: Inter 400 14, line height 140% → 19.6. Two lines of it is the 40 that
          makes the Learning Preferences header 20px taller than this one. */}
      {!!subtitle && <T w="reg" s={14} c={P.inkSoft} style={{ lineHeight: 19.6 }}>{subtitle}</T>}
    </View>
  );
}

// Figma: "MY LEARNING GOALS" / "FAVORITE SUBJECTS" — Inter 600 17, uppercase, #111111.
// The Profile screen's own eyebrows ("MY LEARNING", "SETTINGS", "ACCOUNT") are the
// smaller grey variant and pass their own size/colour.
export function Eyebrow({ children, s = 17, c = P.ink, style }) {
  return (
    <T w="semi" s={s} c={c} style={[{ letterSpacing: TRACK, textTransform: 'uppercase' }, style]}>
      {children}
    </T>
  );
}

// Figma: footer — fill, padding 20, border-top 1px #E5E7EB, white; primary-cta — fill,
// h52, radius 26, #111111; label Inter 700 16 #FFFFFF.
//
// The home-indicator below the CTA is iOS-only on purpose: on Android the system draws
// its own gesture bar in that space, so painting a second one stacks two pills.
export function StickyFooter({ label, onPress, busy = false, disabled = false, bottomInset = 0 }) {
  const off = busy || disabled;
  return (
    <View style={[u.footer, { paddingBottom: 20 + (Platform.OS === 'android' ? bottomInset : 0) }]}>
      <Pressable
        onPress={onPress}
        disabled={off}
        style={({ pressed }) => [u.cta, off && { opacity: 0.55 }, pressed && !off && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityState={{ disabled: off, busy }}
        accessibilityLabel={label}
      >
        {busy
          ? <ActivityIndicator color="#FFFFFF" size="small" />
          : <T w="bold" s={16} c="#FFFFFF">{label}</T>}
      </Pressable>
      {Platform.OS === 'ios' && (
        <View style={u.indicatorWrap}><View style={u.indicatorBar} /></View>
      )}
    </View>
  );
}

const u = StyleSheet.create({
  // Figma: screen-header — padding T20 R24 B4 L24, gap 8.
  header: { paddingTop: 20, paddingRight: PAD, paddingBottom: 4, paddingLeft: PAD, gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 40 },

  back: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: P.page, borderWidth: 1, borderColor: P.hair,
    alignItems: 'center', justifyContent: 'center',
  },

  footer: {
    backgroundColor: P.page,
    borderTopWidth: 1, borderTopColor: P.hair,
    paddingHorizontal: 20, paddingTop: 20,
  },
  cta: {
    height: 52, borderRadius: 26, backgroundColor: P.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  // Figma: home-indicator — padding T21 B8; indicator-bar 139x5, radius 100, #111111 35%.
  indicatorWrap: { paddingTop: 21, paddingBottom: 8, alignItems: 'center' },
  indicatorBar: { width: 139, height: 5, borderRadius: 100, backgroundColor: P.ink, opacity: 0.35 },
});

export default T;
