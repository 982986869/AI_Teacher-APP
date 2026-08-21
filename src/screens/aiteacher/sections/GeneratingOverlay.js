// src/screens/aiteacher/sections/GeneratingOverlay.js
// "Ms. Nova is preparing your lesson…" — the full-screen cover while a lesson generates.
//
// Generation takes 30–90 seconds, which is far too long for a spinner. It keeps the old
// screen's two devices, both of which exist to make that wait legible rather than to
// decorate it: a staged checklist that advances on a timer, and a reassurance line that
// rotates on a slower cadence so a minute of waiting never shows one frozen sentence.
//
// The stages and the hint are passed in — they come from teacherMoments.js, which frames
// them around the actual topic. This component decides nothing about the copy.
import React from 'react';
import { View, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { Sparkles, Check, Circle } from 'lucide-react-native';

import { AIT } from '../../../theme/aiTeacherTheme';
import { T, PAD } from './ui';

export default function GeneratingOverlay({
  visible,
  opacity,        // Animated.Value from the caller, so the fade-in is owned with the state
  stages = [],
  stage = 0,
  hint = '',
}) {
  if (!visible) return null;

  return (
    <Animated.View style={[s.root, opacity ? { opacity } : null]}>
      <View style={s.spark}>
        <Sparkles size={30} color={AIT.accent} strokeWidth={2} />
      </View>

      <T w="bold" s={18} style={s.title} accessibilityLiveRegion="polite">
        Ms. Nova is preparing your lesson…
      </T>

      <View style={s.list}>
        {stages.map((label, i) => {
          const done = i < stage;
          const current = i === stage;
          return (
            <View key={label || i} style={s.row}>
              <View style={s.marker}>
                {done ? (
                  <Check size={14} color={AIT.ink} strokeWidth={3} />
                ) : current ? (
                  <ActivityIndicator size="small" color={AIT.accent} />
                ) : (
                  <Circle size={12} color={AIT.inkMuted} strokeWidth={2.2} />
                )}
              </View>
              <T
                w={current ? 'semi' : 'reg'}
                s={14}
                c={current ? AIT.ink : done ? AIT.inkSoft : AIT.inkMuted}
                style={{ flex: 1 }}
              >
                {label}
              </T>
            </View>
          );
        })}
      </View>

      {!!hint && <T w="reg" s={13} c={AIT.inkSoft} style={s.hint}>{hint}</T>}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AIT.bg,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: PAD + 8,
  },
  spark: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: AIT.sparkleChip,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { marginTop: 18, textAlign: 'center', lineHeight: 24 },
  list: { alignSelf: 'stretch', marginTop: 22, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  // A fixed box so the rows do not jog sideways when a spinner swaps for a tick.
  marker: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  hint: { marginTop: 20, textAlign: 'center', lineHeight: 19 },
});
