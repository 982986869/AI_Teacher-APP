// src/screens/parent/ParentApp/anim.js
// Small, dependency-free animation primitives for the Parent app, built on React
// Native's own Animated (native driver where possible → 60fps). Reused everywhere so
// motion stays consistent and subtle. No new deps, no worklet/babel setup needed.
import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Easing, View } from 'react-native';
import { T } from './constants';

const EASE = Easing.bezier(0.22, 1, 0.36, 1); // gentle "ease-out-quint" feel

// Fade + rise (and/or slide) on mount. `delay` staggers a list; `x` slides in from the
// side (positive = from the right) for carousels. transform/opacity use native driver.
export const FadeIn = memo(function FadeIn({ delay = 0, y = 12, x = 0, duration = 440, style, children }) {
  const o = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(y)).current;
  const tx = useRef(new Animated.Value(x)).current;
  useEffect(() => {
    const a = Animated.parallel([
      Animated.timing(o, { toValue: 1, duration, delay, easing: EASE, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration, delay, easing: EASE, useNativeDriver: true }),
      Animated.timing(tx, { toValue: 0, duration, delay, easing: EASE, useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
  }, [o, ty, tx, delay, duration]);
  return <Animated.View style={[style, { opacity: o, transform: [{ translateY: ty }, { translateX: tx }] }]}>{children}</Animated.View>;
});

// Spring pop-in: scale up from `from` + fade. Springy + delightful — great for chips,
// day cells, badges. `delay` staggers a set. Native-driven.
export const PopIn = memo(function PopIn({ delay = 0, from = 0.5, duration = 420, style, children }) {
  const o = useRef(new Animated.Value(0)).current;
  const s = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    const a = Animated.parallel([
      Animated.timing(o, { toValue: 1, duration, delay, easing: EASE, useNativeDriver: true }),
      Animated.spring(s, { toValue: 1, delay, useNativeDriver: true, damping: 11, stiffness: 200, mass: 0.7 }),
    ]);
    a.start();
    return () => a.stop();
  }, [o, s, delay, duration]);
  return <Animated.View style={[style, { opacity: o, transform: [{ scale: s }] }]}>{children}</Animated.View>;
});

// Press feedback: a soft spring scale-down. Drop-in for TouchableOpacity.
export function PressableScale({ onPress, onLongPress, style, children, scaleTo = 0.97, disabled, ...rest }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 45, bounciness: 0 }).start();
  return (
    <Pressable
      accessibilityRole="button"
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
  const [n, setN] = useState(0);
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

// Number that WAITS (`delay`), then rolls 0 → value so the roll is clearly visible
// after a card's entrance settles, and lands with a spring "punch" scale. The hero
// stat animation — feels alive. Renders through the shared <T> atom.
export const RollNumber = memo(function RollNumber({ value, delay = 0, duration = 1100, prefix = '', suffix = '', ...textProps }) {
  const target = Number(value) || 0;
  const [n, setN] = useState(0);
  const av = useRef(new Animated.Value(0)).current;
  const punch = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    setN(0);
    const id = av.addListener(({ value: v }) => setN(v));
    const a = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(av, { toValue: target, duration, easing: EASE, useNativeDriver: false }),
    ]);
    a.start(({ finished }) => {
      if (finished && target > 0) {
        Animated.sequence([
          Animated.spring(punch, { toValue: 1.2, useNativeDriver: true, damping: 6, stiffness: 320 }),
          Animated.spring(punch, { toValue: 1, useNativeDriver: true, damping: 9, stiffness: 260 }),
        ]).start();
      }
    });
    return () => { av.removeListener(id); a.stop(); };
  }, [target, delay, duration, av, punch]);
  return (
    <Animated.View style={{ transform: [{ scale: punch }] }}>
      <T {...textProps}>{prefix}{Math.round(n)}{suffix}</T>
    </Animated.View>
  );
});

// ── Odometer number ───────────────────────────────────────────────────────────
// Each digit is a vertical strip of 0-9 (twice) that physically SPINS a full cycle and
// eases to rest on its value — the premium "mechanical counter" you see in Apple/Stripe
// UIs. Digits settle left-to-right on a stagger. tabular-nums keeps them from jittering.
const DIGITS2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const TNUM = { fontVariant: ['tabular-nums'] };
const OdoDigit = memo(function OdoDigit({ d, height, delay, textProps }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    y.setValue(0);
    const a = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(y, { toValue: -(d + 10) * height, duration: 1000, easing: EASE, useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
  }, [d, height, delay, y]);
  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY: y }] }}>
        {DIGITS2.map((n, idx) => (
          <View key={idx} style={{ height, alignItems: 'center', justifyContent: 'center' }}>
            <T {...textProps} style={[textProps.style, TNUM]}>{n}</T>
          </View>
        ))}
      </Animated.View>
    </View>
  );
});
export const Odometer = memo(function Odometer({ value, delay = 0, height = 30, prefix = '', suffix = '', ...textProps }) {
  const chars = String(Math.round(Number(value) || 0)).split('');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {prefix ? <T {...textProps}>{prefix}</T> : null}
      {chars.map((ch, i) => <OdoDigit key={`${chars.length}-${i}`} d={Number(ch)} height={height} delay={delay + i * 85} textProps={textProps} />)}
      {suffix ? <T {...textProps}>{suffix}</T> : null}
    </View>
  );
});

// Continuous heartbeat — a gentle scale + opacity loop for small live indicators
// (active-day dots, badges). Native-driven → 60fps, runs forever.
export const Pulse = memo(function Pulse({ children, style, from = 1, to = 1.3, duration = 1500 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [from, to] });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  return <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>{children}</Animated.View>;
});

// A hand-wave: tilts to `angle` and back a couple of times, then rests. For the 👋 in
// a greeting. Native-driven.
export const Wave = memo(function Wave({ children, style, angle = 20, duration = 300 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.delay(2200),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${angle}deg`] });
  return <Animated.View style={[style, { transform: [{ rotate }] }]}>{children}</Animated.View>;
});

// A gentle sideways nudge loop — for a CTA arrow that keeps inviting the tap.
export const Nudge = memo(function Nudge({ children, style, distance = 4, duration = 700 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, distance] });
  return <Animated.View style={[style, { transform: [{ translateX }] }]}>{children}</Animated.View>;
});

// A light "shine" that periodically sweeps a diagonal highlight across its container —
// the premium reflective sheen you see on high-end cards/buttons. Drop it as the last
// child of an `overflow:hidden` rounded box (it fills + clips to the box). Native-driven.
export const Shine = memo(function Shine({ delay = 900, gap = 2800, sweep = 850, width = 46, angle = 18, color = 'rgba(255,255,255,0.5)', halo = 0.4 }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(x, { toValue: 1, duration: sweep, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.delay(gap),
      Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [x, delay, gap, sweep]);
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-150, 560] });
  const beam = { position: 'absolute', top: -100, bottom: -100, backgroundColor: color, transform: [{ translateX }, { rotate: `${angle}deg` }] };
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {/* soft halo behind a bright narrow core → reads like a real light beam */}
      <Animated.View style={[beam, { left: -width, width: width * 3, opacity: halo }]} />
      <Animated.View style={[beam, { width }]} />
    </View>
  );
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

// ── Reveal-once ───────────────────────────────────────────────────────────────
// Plays a FadeIn the FIRST time an `id` is seen this session, then renders instantly
// on every later mount. Lets sections animate in the first time you open a tab and
// stay calm on subsequent visits (no re-animating on every tab switch).
const _revealed = new Set();
export const FadeInOnce = memo(function FadeInOnce({ id, style, children, ...rest }) {
  const seen = useRef(!!id && _revealed.has(id)).current;
  useEffect(() => { if (id) _revealed.add(id); }, [id]);
  if (seen) return <View style={style}>{children}</View>;
  return <FadeIn style={style} {...rest}>{children}</FadeIn>;
});

// Stagger a set of children into view (fresh each mount — good for sheets/lists).
export const Stagger = memo(function Stagger({ children, base = 40, step = 60, y = 10 }) {
  return React.Children.map(children, (child, i) => (
    child ? <FadeIn key={i} delay={base + i * step} y={y}>{child}</FadeIn> : null
  ));
});

// ── Ambient loops (all native-driven, transform/opacity only → 60fps) ─────────

// A very subtle continuous "breathing" scale — for a primary CTA that's ready to tap.
export const Breathe = memo(function Breathe({ children, style, from = 1, to = 1.02, duration = 2000 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [from, to] });
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
});

// A gentle vertical hover — for empty-state illustrations, so nothing feels static.
export const Float = memo(function Float({ children, style, distance = 6, duration = 2400 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [distance / 2, -distance / 2] });
  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
});

// An expanding, fading ring — sits behind a "live" dot to signal a real-time state.
export const PulseRing = memo(function PulseRing({ color = '#fff', size = 8, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, {
      toValue: 1, duration: 1700, easing: Easing.out(Easing.ease), useNativeDriver: true,
    }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity, transform: [{ scale }] }, style]}
    />
  );
});
