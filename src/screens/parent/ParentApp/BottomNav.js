// src/screens/parent/ParentApp/BottomNav.js
// Premium floating bottom nav with a GLIDING active pill: a soft tinted pill sits
// behind the active tab and springs horizontally to whichever tab you pick (native-
// driven translateX → 60fps). The active icon springs up + scales, its label turns bold
// and coloured. Everything else stays calm. Press feedback via PressableScale.
//
// Safe area: React Native's <SafeAreaView> does NOT reserve the bottom system-bar space
// on Android, so we add the real bottom inset as margin — the bar always floats clear of
// the phone's back/home/recents buttons.
import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, st, T, TABS } from './constants';
import { PressableScale } from './anim';

function NavTab({ label, Icon, color, active, onPress }) {
  const v = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: active ? 1 : 0, useNativeDriver: true, damping: 12, stiffness: 220, mass: 0.7 }).start();
  }, [active, v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  // flex:1 wrapper → 5 equal slots. (PressableScale puts its style on the inner view, so
  // the Pressable itself is content-sized; the wrapper is what divides the row evenly.)
  return (
    <View style={bn.slot}>
      <PressableScale style={bn.item} onPress={onPress} scaleTo={0.9} accessibilityLabel={label} accessibilityState={{ selected: active }}>
        <Animated.View style={[bn.iconBox, { transform: [{ scale }] }]}>
          <Icon size={21} color={active ? color : C.muted} strokeWidth={active ? 2.7 : 2} />
        </Animated.View>
        <T w={active ? 'xbold' : 'semi'} s={10.5} c={active ? color : C.muted} numberOfLines={1} style={bn.label}>{label}</T>
      </PressableScale>
    </View>
  );
}

function BottomNav({ tab, setTab }) {
  const insets = useSafeAreaInsets();
  // Docked bar: no bottom margin. Instead pad the bottom by the safe-area inset so the
  // white background fills down to the very edge (covering the system-nav strip) while
  // the tabs stay above the phone's back/home/recents buttons.
  const padBottom = Math.max(insets.bottom, 8) + 6;

  const [trackW, setTrackW] = useState(0);
  const n = TABS.length;
  const idx = Math.max(0, TABS.findIndex((t) => t.id === tab));
  const tabW = trackW ? trackW / n : 0;
  const active = TABS[idx] || TABS[0];

  // Spring the pill toward the active index; translateX (native) does the gliding.
  const slide = useRef(new Animated.Value(idx)).current;
  useEffect(() => {
    Animated.spring(slide, { toValue: idx, useNativeDriver: true, damping: 16, stiffness: 170, mass: 0.9 }).start();
  }, [idx, slide]);
  const translateX = slide.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabW),
  });

  return (
    <View style={[st.nav, { paddingBottom: padBottom }]}>
      <View style={bn.track} onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
        {tabW > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[bn.pill, { width: tabW, backgroundColor: active.color, transform: [{ translateX }] }]}
          />
        )}
        {TABS.map(({ id, label, Icon, color }) => (
          <NavTab key={id} label={label} Icon={Icon} color={color} active={id === tab} onPress={() => setTab(id)} />
        ))}
      </View>
    </View>
  );
}

const bn = StyleSheet.create({
  track: { flexDirection: 'row', alignItems: 'center', position: 'relative', minHeight: 50 },
  slot: { flex: 1 },
  // Soft tinted highlight behind the active tab — glides between tabs. Sits behind the
  // icons/labels (rendered first → lower z-order).
  pill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 16, opacity: 0.14 },
  item: { alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 5 },
  iconBox: { height: 24, alignItems: 'center', justifyContent: 'center' },
  label: { letterSpacing: 0.1, textAlign: 'center' },
});

export default memo(BottomNav);
