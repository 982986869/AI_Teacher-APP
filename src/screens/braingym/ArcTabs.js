// src/screens/braingym/ArcTabs.js
// Clean, professional bottom section switcher — a dark rounded segmented control
// with a white pill that smoothly slides to the active section (Workout / Arena /
// Practice). Tap a segment to switch; the pill springs across. Each tab springs on
// press and its icon lifts + scales when active. Reliable + premium.
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pressSpring, PRESS_SCALE } from './motion';

const ORDER = ['workout', 'arena', 'practice'];
const META = {
  workout: { label: 'WORKOUT', icon: '🎯' },
  arena: { label: 'ARENA', icon: '🏆' },
  practice: { label: 'PRACTICE', icon: '⚡' },
};

function Tab({ k, on, onPress }) {
  const a = useRef(new Animated.Value(on ? 1 : 0)).current;    // active state
  const press = useRef(new Animated.Value(1)).current;         // press feedback
  useEffect(() => {
    Animated.spring(a, { toValue: on ? 1 : 0, useNativeDriver: true, damping: 13, stiffness: 210, mass: 0.7 }).start();
  }, [on, a]);
  const to = (v) => pressSpring(press, v).start();
  const iconScale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const lift = a.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] });
  return (
    <Pressable style={st.seg} onPress={onPress} onPressIn={() => to(PRESS_SCALE)} onPressOut={() => to(1)}
      accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={META[k].label}>
      <Animated.View style={{ alignItems: 'center', gap: 3, transform: [{ scale: press }, { translateY: lift }] }}>
        <Animated.Text style={[st.icon, on && st.iconOn, { transform: [{ scale: iconScale }] }]}>{META[k].icon}</Animated.Text>
        <Text style={[st.txt, on && st.txtOn]}>{META[k].label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function ArcTabs({ active = 'workout', onTabPress }) {
  const insets = useSafeAreaInsets();
  const i = Math.max(0, ORDER.indexOf(active));
  const [innerW, setInnerW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const seg = innerW ? innerW / 3 : 0;

  useEffect(() => {
    if (!seg) return;
    Animated.spring(x, { toValue: i * seg, useNativeDriver: true, damping: 15, stiffness: 190, mass: 0.8 }).start();
  }, [i, seg, x]);

  return (
    <View style={[st.wrap, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
      <View style={st.bar} onLayout={(e) => setInnerW(e.nativeEvent.layout.width - 10)}>
        {seg > 0 && (
          <Animated.View pointerEvents="none" style={[st.pill, { width: seg, transform: [{ translateX: x }] }]} />
        )}
        {ORDER.map((k) => (
          <Tab key={k} k={k} on={k === active} onPress={() => onTabPress && onTabPress(k)} />
        ))}
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
  seg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 15, opacity: 0.5 },
  iconOn: { opacity: 1 },
  txt: { color: '#83838D', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  txtOn: { color: '#0B0B0D' },
});
