import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { C } from './premiumTheme';

// ── LIVING STAGE — the room, not a page ───────────────────────────────────────
// A cinematic light field behind the whole lesson: soft colour blooms that drift
// and breathe like a lit room, and brighten/warm when she speaks — so the surface
// feels alive and conversational (OpenAI Voice Mode / Arc energy) instead of a flat
// educational page. Pure react-native-svg radial gradients + native-driver motion.

const { width: W, height: H } = Dimensions.get('window');
const AView = Animated.View;

// Unique gradient id per mounted instance — react-native-svg registers <Defs> ids
// and duplicates collide (one overrides the other → wrong/invisible fill).
let _gid = 0;
const useGradId = (p) => {
  const r = useRef(null);
  if (r.current == null) r.current = `${p}-${(_gid += 1)}`;
  return r.current;
};

// One drifting, breathing light bloom (a soft radial gradient disc).
function Bloom({ tint, size, left, top, drift = 26, dur = 14000, phase = 0, energy, baseOpacity = 0.5 }) {
  const t = useRef(new Animated.Value(0)).current;       // slow drift 0↔1
  const br = useRef(new Animated.Value(0)).current;      // slow breathe 0↔1
  useEffect(() => {
    const mk = (v, d) => Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: d, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const a = mk(t, dur);
    const b = mk(br, dur * 0.72);
    // stagger so blooms never pulse in lock-step
    const s = setTimeout(() => { a.start(); b.start(); }, phase);
    return () => { clearTimeout(s); a.stop(); b.stop(); };
  }, [t, br, dur, phase]);
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [-drift, drift] });
  const translateY = br.interpolate({ inputRange: [0, 1], outputRange: [drift * 0.5, -drift * 0.5] });
  const scale = Animated.add(
    br.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }),
    energy.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14] }),
  );
  const opacity = Animated.multiply(
    br.interpolate({ inputRange: [0, 1], outputRange: [baseOpacity * 0.7, baseOpacity] }),
    energy.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }),
  );
  const id = useGradId('bloom');
  return (
    <AView pointerEvents="none" style={{ position: 'absolute', left, top, width: size, height: size, opacity, transform: [{ translateX }, { translateY }, { scale }] }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={tint} stopOpacity="1" />
            <Stop offset="55%" stopColor={tint} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={tint} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </AView>
  );
}

// The full-screen living backdrop. `speaking` drives the shared energy; `state`
// gently shifts the palette (speaking = warm+teal, listening = cool blue).
export function AmbientStage({ speaking = false, state = 'idle' }) {
  const energy = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(energy, { toValue: speaking ? 1 : 0, duration: speaking ? 700 : 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [speaking, energy]);
  const cool = state === 'listening';
  const warm = state === 'thinking';
  const washId = useGradId('wash');
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* base vertical light — brighter overhead, a touch of warmth low down */}
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={washId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="52%" stopColor={C.cream} stopOpacity="1" />
            <Stop offset="100%" stopColor={C.cream2} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width={W} height={H} fill={`url(#${washId})`} />
      </Svg>
      <Bloom tint={cool ? C.blue : C.accent} size={W * 1.15} left={-W * 0.28} top={-H * 0.12} drift={30} dur={15000} phase={0} energy={energy} baseOpacity={0.16} />
      <Bloom tint={warm ? '#F5A623' : C.orange} size={W * 1.0} left={W * 0.34} top={H * 0.42} drift={34} dur={18000} phase={900} energy={energy} baseOpacity={0.13} />
      <Bloom tint={C.teal} size={W * 0.9} left={W * 0.05} top={H * 0.68} drift={22} dur={13000} phase={1800} energy={energy} baseOpacity={0.1} />
    </View>
  );
}

// ── VOICE AURA — the teacher's living halo (OpenAI Voice-Mode presence) ────────
// Concentric soft radial rings behind the avatar that breathe continuously and
// bloom outward while she speaks, so she reads as a present, listening intelligence
// rather than a picture. `size` should be the avatar diameter.
export function VoiceAura({ size, speaking = false, listening = false }) {
  const energy = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(energy, { toValue: speaking || listening ? 1 : 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [speaking, listening, energy]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breathe]);
  useEffect(() => {
    let loop;
    if (speaking) {
      loop = Animated.loop(Animated.timing(shimmer, { toValue: 1, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true }));
      loop.start();
    } else { shimmer.setValue(0); }
    return () => loop && loop.stop();
  }, [speaking, shimmer]);

  const tint = listening ? C.blue : C.accent;
  const d = size * 2.5;
  const ringId = useGradId('aura');
  const coreScale = Animated.add(
    breathe.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.06] }),
    energy.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }),
  );
  const coreOpacity = energy.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.92] });
  // Centred on the parent's centre (absolute children ignore flex alignment, so we
  // offset by half the box) — this sits exactly behind the avatar.
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: '50%', left: '50%', width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2, alignItems: 'center', justifyContent: 'center' }}>
      {/* soft ambient core that breathes + blooms on voice (fills the box) */}
      <AView style={{ position: 'absolute', width: d, height: d, opacity: coreOpacity, transform: [{ scale: coreScale }] }}>
        <Svg width={d} height={d}>
          <Defs>
            <RadialGradient id={ringId} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={tint} stopOpacity="0.34" />
              <Stop offset="42%" stopColor={tint} stopOpacity="0.14" />
              <Stop offset="100%" stopColor={tint} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={d / 2} cy={d / 2} r={d / 2} fill={`url(#${ringId})`} />
        </Svg>
      </AView>
      {/* an expanding shimmer ring emitted while speaking (flow child → auto-centred) */}
      {speaking && (
        <AView style={{
          width: size * 1.2, height: size * 1.2, borderRadius: size, borderWidth: 2, borderColor: tint,
          opacity: shimmer.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.28, 0] }),
          transform: [{ scale: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.9] }) }],
        }} />
      )}
    </View>
  );
}
