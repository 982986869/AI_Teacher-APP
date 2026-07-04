// src/screens/parent/ParentApp/anim.js
// Small, dependency-free animation primitives for the Parent app, built on React
// Native's own Animated (native driver where possible → 60fps). Reused everywhere so
// motion stays consistent and subtle. No new deps, no worklet/babel setup needed.
import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Easing } from 'react-native';
import { T } from './constants';

const EASE = Easing.bezier(0.22, 1, 0.36, 1); // gentle "ease-out-quint" feel

// Fade + rise on mount. `delay` staggers a list; transform/opacity use native driver.
export const FadeIn = memo(function FadeIn({ delay = 0, y = 12, duration = 440, style, children }) {
  const o = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(y)).current;
  useEffect(() => {
    const a = Animated.parallel([
      Animated.timing(o, { toValue: 1, duration, delay, easing: EASE, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration, delay, easing: EASE, useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
  }, [o, ty, delay, duration]);
  return <Animated.View style={[style, { opacity: o, transform: [{ translateY: ty }] }]}>{children}</Animated.View>;
});

// Press feedback: a soft spring scale-down. Drop-in for TouchableOpacity.
export function PressableScale({ onPress, onLongPress, style, children, scaleTo = 0.97, disabled, ...rest }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 45, bounciness: 0 }).start();
  return (
    <Pressable
      onPress={onPress} onLongPress={onLongPress} disabled={disabled}
      onPressIn={() => !disabled && to(scaleTo)} onPressOut={() => to(1)} {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// Count a number up to `value` on mount / when value changes. Renders via the shared
// <T> atom so typography stays consistent.
export const CountUp = memo(function CountUp({ value, duration = 900, prefix = '', suffix = '', ...textProps }) {
  const target = Number(value) || 0;
  const [n, setN] = useState(target === 0 ? 0 : 0);
  const av = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setN(0);
    const id = av.addListener(({ value: v }) => setN(v));
    const a = Animated.timing(av, { toValue: target, duration, easing: EASE, useNativeDriver: false });
    a.start();
    return () => { av.removeListener(id); a.stop(); };
  }, [target, duration, av]);
  return <T {...textProps}>{prefix}{Math.round(n)}{suffix}</T>;
});

// A bar that grows from 0 to `height` on mount (charts). Height animates on the JS
// thread (layout) but there are only a handful of bars → smooth in practice.
export const GrowBar = memo(function GrowBar({ height, color, delay = 120, duration = 720, style }) {
  const h = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(h, { toValue: height, duration, delay, easing: EASE, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [h, height, delay, duration]);
  return <Animated.View style={[style, { height: h, backgroundColor: color }]} />;
});

// A fill that grows from 0% to `pct` (0..1) — progress bars, goals.
export const GrowFill = memo(function GrowFill({ pct, color, delay = 150, duration = 720, style }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(w, { toValue: Math.max(0, Math.min(1, pct)), duration, delay, easing: EASE, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [w, pct, delay, duration]);
  const width = w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return <Animated.View style={[style, { width, backgroundColor: color }]} />;
});

// Premium shimmer block — a soft highlight sweeps across a neutral base (no gradient
// dependency). Used by the skeleton loader.
export const Shimmer = memo(function Shimmer({ w, h, r = 12, mt = 0, mb = 0, style }) {
  const x = useRef(new Animated.Value(0)).current;
  const width = typeof w === 'number' ? w : 260;
  useEffect(() => {
    const a = Animated.loop(Animated.timing(x, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.ease), useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [x]);
  const tx = x.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });
  return (
    <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#EDEDF0', overflow: 'hidden', marginTop: mt, marginBottom: mb }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
        <Animated.View style={{ width: '45%', height: '100%', backgroundColor: '#F7F7F9', opacity: 0.75 }} />
      </Animated.View>
    </Animated.View>
  );
});
