// src/screens/aiteacher/sections/JumpBackIn.js
// "Jump back in" — the one card that resumes an unfinished lesson: subject tag and a
// CURRENT LESSON marker, then a real progress ring beside the lesson title, then the
// continue button.
//
// The ring is drawn with react-native-svg rather than faked with a bordered View, because
// the number it shows is a real one everywhere else in this feature: AITeacherScreen
// reads a stored `percent` per lesson from GET /api/ai/lessons/progress, written on a 15s
// timer while a lesson is open. A ring that cannot show 68% would have to be replaced the
// moment this page is wired.
//
// TODO(wire): `lesson` is placeholder. Feed it from getLessonsProgress() in
// src/api/aiApi.js — the same call AITeacherScreen's library uses — and render nothing
// when the student has no lesson in progress (the whole section returns null already).
import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Play } from 'lucide-react-native';

import { AIT } from '../../../theme/aiTeacherTheme';
import { T, SectionTitle, PAD, cardSurface } from './ui';

// TODO(wire): placeholder lesson — the mockup's own values.
export const DEFAULT_LESSON = {
  subject: 'Physics',
  title: 'Thermodynamics: First Law',
  detail: 'Section 3 • 12 mins remaining',
  percent: 68,
};

function Ring({ percent = 0, size = 46 }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={AIT.track} strokeWidth={stroke} fill="none" />
        {pct > 0 && (
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={AIT.cardAmber} strokeWidth={stroke} fill="none"
            strokeDasharray={`${(circ * pct) / 100} ${circ}`} strokeLinecap="round"
            // Start the sweep at twelve o'clock instead of three.
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <T w="bold" s={11}>{pct}%</T>
    </View>
  );
}

// `lesson` is null when there is nothing in progress — the whole section disappears
// rather than showing an empty card, because a resume card with nothing to resume is
// worse than no card.
export default function JumpBackIn({ lesson = DEFAULT_LESSON, busy = false, onContinue = () => {} }) {
  if (!lesson) return null;
  const { subject, title, detail, percent } = lesson;

  return (
    <View style={s.wrap}>
      <SectionTitle style={s.title}>Jump back in</SectionTitle>

      <View style={s.cardOuter}>
        {/* The amber rail down the left edge. Drawn as a sibling behind the padded body
            rather than a border, so it can keep the card's own corner radius. */}
        <View style={s.rail} />

        <View style={s.card}>
          <View style={s.metaRow}>
            <View style={s.tag}>
              <T w="bold" s={10} c={AIT.inkSoft} style={s.tagText}>{subject}</T>
            </View>
            <View style={s.currentWrap}>
              <View style={s.dot} />
              <T w="bold" s={10} c={AIT.accent} style={s.tagText}>Current lesson</T>
            </View>
          </View>

          <View style={s.lessonRow}>
            <Ring percent={percent} />
            <View style={s.lessonText}>
              <T w="bold" s={16} numberOfLines={2}>{title}</T>
              <T w="reg" s={12} c={AIT.inkSoft} numberOfLines={1}>{detail}</T>
            </View>
          </View>

          <Pressable
            onPress={onContinue}
            disabled={busy}
            style={({ pressed }) => [s.cta, (busy || pressed) && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy, busy }}
            accessibilityLabel={`Continue lesson: ${title}`}
          >
            {busy ? (
              <ActivityIndicator size="small" color={AIT.ink} />
            ) : (
              <>
                <T w="xbold" s={13} style={s.ctaText}>Let&apos;s continue lesson</T>
                <Play size={13} color={AIT.ink} strokeWidth={2.5} fill={AIT.ink} />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingTop: 22, gap: 12 },
  title: { paddingHorizontal: PAD },

  cardOuter: { ...cardSurface, marginHorizontal: PAD, overflow: 'hidden' },
  rail: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
    backgroundColor: AIT.cardAmber,
  },
  card: { paddingLeft: 5 + 14, paddingRight: 14, paddingVertical: 14, gap: 12 },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: { backgroundColor: AIT.tagBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { letterSpacing: 0.9, textTransform: 'uppercase' },
  currentWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AIT.accent },

  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lessonText: { flex: 1, minWidth: 0, gap: 3 },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 46, borderRadius: 10, backgroundColor: AIT.cardAmber,
  },
  ctaText: { letterSpacing: 0.6, textTransform: 'uppercase', color: AIT.ink },
});
