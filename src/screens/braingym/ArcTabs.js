// src/screens/braingym/ArcTabs.js
// Clean, professional bottom section switcher — a dark rounded segmented control
// with a white pill that smoothly slides to the active section (Workout / Arena /
// Practice). Tap a segment to switch; the pill springs across. Reliable + premium.
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ORDER = ['workout', 'arena', 'practice'];
const META = {
  workout: { label: 'WORKOUT', icon: '🎯' },
  arena: { label: 'ARENA', icon: '🏆' },
  practice: { label: 'PRACTICE', icon: '⚡' },
};

export default function ArcTabs({ active = 'workout', onTabPress }) {
  const insets = useSafeAreaInsets();
  const i = Math.max(0, ORDER.indexOf(active));
  const [innerW, setInnerW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const seg = innerW ? innerW / 3 : 0;

  useEffect(() => {
    if (!seg) return;
    Animated.spring(x, { toValue: i * seg, useNativeDriver: true, speed: 16, bounciness: 7 }).start();
  }, [i, seg, x]);

  return (
    <View style={[st.wrap, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
      <View style={st.bar} onLayout={(e) => setInnerW(e.nativeEvent.layout.width - 10)}>
        {seg > 0 && (
          <Animated.View pointerEvents="none" style={[st.pill, { width: seg, transform: [{ translateX: x }] }]} />
        )}
        {ORDER.map((k) => {
          const on = k === active;
          return (
            <TouchableOpacity key={k} style={st.seg} activeOpacity={0.85} onPress={() => onTabPress && onTabPress(k)}
              accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={META[k].label}>
              <Text style={[st.icon, on && st.iconOn]}>{META[k].icon}</Text>
              <Text style={[st.txt, on && st.txtOn]}>{META[k].label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 4, backgroundColor: '#0B0B0D' },
  bar: {
    flexDirection: 'row', height: 62, borderRadius: 20, padding: 5,
    backgroundColor: '#141418', borderWidth: 1.5, borderColor: '#26262E',
  },
  pill: {
    position: 'absolute', top: 5, bottom: 5, left: 5, borderRadius: 15,
    backgroundColor: '#F4F4F5',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  seg: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  icon: { fontSize: 15, opacity: 0.5 },
  iconOn: { opacity: 1 },
  txt: { color: '#83838D', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  txtOn: { color: '#0B0B0D' },
});
