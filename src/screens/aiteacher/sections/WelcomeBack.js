// src/screens/aiteacher/sections/WelcomeBack.js
// The continuity snapshot — what the teacher remembers from last time, with the two
// things it suggests doing about it. Dismissible for the session.
//
// Not in the design either, and it only appears for a returning student, which is
// probably why: the mockup is a resting screen. The copy is REAL — it comes from
// GET /api/ai/resume-context via getResumeContext(), framed by teacherMoments.js. This
// section renders it and never invents any of it, so when there is no snapshot the
// caller passes null and nothing draws.
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { X, ChevronRight } from 'lucide-react-native';

import { AIT } from '../../../theme/aiTeacherTheme';
import { T, Eyebrow, PAD, cardSurface } from './ui';

export default function WelcomeBack({
  snapshot,                       // { greeting, suggestion, last: { subject, chapter } }
  onRevise = () => {},
  onRelearn = () => {},
  onDismiss = () => {},
}) {
  if (!snapshot) return null;
  const { greeting, suggestion, last } = snapshot;
  const chapter = last?.chapter;

  return (
    <View style={s.wrap}>
      <View style={s.card}>
        <Pressable
          onPress={onDismiss}
          hitSlop={10}
          style={s.close}
          accessibilityRole="button"
          accessibilityLabel="Dismiss welcome back"
        >
          <X size={14} color={AIT.inkMuted} strokeWidth={2.4} />
        </Pressable>

        <Eyebrow style={{ color: AIT.accent }}>Welcome back</Eyebrow>
        {/* Right padding clears the close button so a long greeting cannot run under it. */}
        <T w="bold" s={16} style={s.greeting}>{greeting}</T>
        {!!suggestion && (
          <T w="reg" s={13} c={AIT.inkSoft} style={{ lineHeight: 19 }}>{suggestion}</T>
        )}

        <View style={s.actions}>
          <Pressable
            onPress={onRevise}
            style={({ pressed }) => [s.primary, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Continue revising"
          >
            <T w="bold" s={13}>Continue revising</T>
            <ChevronRight size={15} color={AIT.ink} strokeWidth={2.6} />
          </Pressable>

          {!!chapter && (
            <Pressable
              onPress={() => onRelearn(chapter)}
              style={({ pressed }) => [s.ghost, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel={`Re-learn ${chapter}`}
            >
              <T w="med" s={12.5} c={AIT.inkSoft} numberOfLines={1}>Re-learn {chapter}</T>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingTop: 20 },
  card: { ...cardSurface, marginHorizontal: PAD, padding: 14, gap: 6 },
  close: {
    position: 'absolute', top: 10, right: 10, zIndex: 1,
    width: 26, height: 26, borderRadius: 13, backgroundColor: AIT.field,
    alignItems: 'center', justifyContent: 'center',
  },
  greeting: { lineHeight: 22, paddingRight: 28 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  primary: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    height: 38, borderRadius: 10, paddingHorizontal: 14,
    backgroundColor: AIT.cardAmber,
  },
  ghost: {
    height: 38, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center',
    borderWidth: 1, borderColor: AIT.chipEdge, flexShrink: 1,
  },
});
