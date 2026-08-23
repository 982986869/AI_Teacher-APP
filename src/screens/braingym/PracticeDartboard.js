// src/screens/braingym/PracticeDartboard.js
// PRACTICE landing — a 1–20 numbered dartboard with a hexagonal ∞ hub in the
// shared Brain Gym accent. Tap the centre → a brief loading spinner → the
// math-tile game.
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform,
  TouchableOpacity, Animated, Easing, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import ArcTabs from './ArcTabs';
import { pressSpring, PRESS_SCALE } from './motion';
import { BG } from './palette';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SIZE = Math.round(Math.min(SCREEN_W - 56, SCREEN_H * 0.42, 320));
const VB = 300;
const C = VB / 2;
const R_OUT = 140;
const R_IN = 90;
const R_NUM = 116;
const R_HUB = 50;
const N = 20;
const STEP = 360 / N;

const polar = (r, deg) => {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) };
};
const wedge = (a0, a1, rOut, rIn) => {
  const large = a1 - a0 > 180 ? 1 : 0;
  const p1 = polar(rOut, a0), p2 = polar(rOut, a1), p3 = polar(rIn, a1), p4 = polar(rIn, a0);
  return [`M ${p1.x} ${p1.y}`, `A ${rOut} ${rOut} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`, `A ${rIn} ${rIn} 0 ${large} 0 ${p4.x} ${p4.y}`, 'Z'].join(' ');
};

const RADAR = [30, 46, 62, 78, 156, 172];

// The hub is a HEXAGON, not a circle. Flat-top — vertices at 0/60/…/300 measured
// from the +x axis — which is what puts the points at left and right and leaves the
// top and bottom edges horizontal, the way the reference has it.
const hexPath = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => {
  const a = (i * 60) * Math.PI / 180;
  return `${i ? 'L' : 'M'} ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
}).join(' ') + ' Z';

// A tappable that springs down on press (tactile feedback for the back button).
const PressBtn = ({ style, wrapStyle, onPress, activeOpacity = 0.9, accessibilityLabel, accessibilityRole, children }) => {
  const sc = useRef(new Animated.Value(1)).current;
  const to = (v) => pressSpring(sc, v).start();
  return (
    <TouchableOpacity activeOpacity={activeOpacity} onPress={onPress} onPressIn={() => to(PRESS_SCALE)} onPressOut={() => to(1)}
      style={wrapStyle} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[style, { transform: [{ scale: sc }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

export default function PracticeDartboard({ activeTab = 'practice', onTabPress, onBack, onPlay }) {
  const [loading, setLoading] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const head = useRef(new Animated.Value(0)).current;
  const hint = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  // Re-arm on mount — refs survive an effect cleanup (Fast Refresh / StrictMode), so
  // a setup that only clears the flag would leave it false and no-op every guarded setState.
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.timing(head, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.timing(hint, { toValue: 1, duration: 480, delay: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [enter, pulse, head, hint]);

  useEffect(() => {
    if (!loading) return undefined;
    spin.setValue(0);
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [loading, spin]);

  const start = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => { if (mountedRef.current) onPlay && onPlay(); }, 850);
  };

  const enterScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const headTY = head.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });
  const hintTY = hint.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const hubPx = (SIZE * 2 * R_HUB) / VB;

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}

      {/* header */}
      <Animated.View style={[st.header, { opacity: head, transform: [{ translateY: headTY }] }]}>
        <PressBtn onPress={onBack} style={st.back} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={st.backTxt}>‹</Text>
        </PressBtn>
        <Text style={st.title}>Practice</Text>
        <View style={st.stats}>
          <View style={st.boltPill}><Text style={{ fontSize: 11 }}>⚡⚡⚡</Text></View>
          <View style={st.badge}><Text style={{ fontSize: 13 }}>🏆</Text></View>
        </View>
      </Animated.View>

      {/* board */}
      <View style={st.wrap}>
        <Animated.View style={{ transform: [{ scale: enterScale }], opacity: enter, width: SIZE, height: SIZE }}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${VB} ${VB}`}>
            <Defs>
              {/* The hub was a five-stop rainbow — violet, blue, green, yellow, pink
                  — the one surface in Brain Gym still carrying colours the rest of
                  the feature had dropped. Two stops now, both from the shared accent,
                  so the centre reads as this product's colour. */}
              <LinearGradient id="hub" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={BG.accent2} />
                <Stop offset="100%" stopColor={BG.accent} />
              </LinearGradient>
              {/* The ring's edge light: blue on one diagonal, violet on the other, so
                  the outline shifts hue around the board instead of sitting flat. */}
              <LinearGradient id="edge" x1="0" y1="1" x2="1" y2="0">
                <Stop offset="0%" stopColor={BG.accent2} />
                <Stop offset="100%" stopColor={BG.accentLit} />
              </LinearGradient>
            </Defs>

            {RADAR.map((r, i) => (
              <Circle key={i} cx={C} cy={C} r={r} fill="none" stroke={i % 3 === 0 ? '#1E1E24' : '#16161A'} strokeWidth={1} />
            ))}

            {/* 20 numbered wedges */}
            {Array.from({ length: N }).map((_, i) => {
              const a0 = i * STEP - STEP / 2;
              const a1 = i * STEP + STEP / 2;
              return <Path key={`w${i}`} d={wedge(a0, a1, R_OUT, R_IN)} fill={i % 2 ? '#17171C' : '#101014'} stroke="url(#edge)" strokeWidth={1.4} strokeOpacity={0.85} />;
            })}
            {Array.from({ length: N }).map((_, i) => {
              const p = polar(R_NUM, i * STEP);
              return (
                <SvgText key={`n${i}`} x={p.x} y={p.y + 5} fill={BG.ink} fontSize={15} fontWeight="800" textAnchor="middle">
                  {i + 1}
                </SvgText>
              );
            })}

            {/* hex hub + infinity */}
            {/* A soft halo first, then the hex, then a light inner edge for the
                bevel. The dark stroke keeps the hex off the inner wedges. */}
            <Path d={hexPath(C, C, R_HUB + 9)} fill={BG.accent} opacity={0.14} />
            <Path d={hexPath(C, C, R_HUB)} fill="url(#hub)" />
            <Path d={hexPath(C, C, R_HUB)} fill="none" stroke={BG.bg} strokeWidth={3.5} />
            <Path d={hexPath(C, C, R_HUB - 3)} fill="none" stroke={BG.ink} strokeWidth={1} strokeOpacity={0.32} />
            <SvgText x={C} y={C + 13} fill={BG.ink} fontSize={36} fontWeight="900" textAnchor="middle">∞</SvgText>
          </Svg>

          {/* pulsing tap ring + transparent tap target over the hub */}
          <Animated.View pointerEvents="none" style={[st.tapRing, {
            width: hubPx, height: hubPx, borderRadius: hubPx / 2,
            marginLeft: -hubPx / 2, marginTop: -hubPx / 2,
            opacity: ringOpacity, transform: [{ scale: ringScale }],
          }]} />
          <Animated.View style={[st.tapHit, {
            width: hubPx, height: hubPx, borderRadius: hubPx / 2,
            marginLeft: -hubPx / 2, marginTop: -hubPx / 2, transform: [{ scale: pulseScale }],
          }]}>
            <TouchableOpacity style={{ width: '100%', height: '100%' }} onPress={start} activeOpacity={0.8}
              accessibilityRole="button" accessibilityLabel="Start practice" />
          </Animated.View>
        </Animated.View>

        <Animated.Text style={[st.hint, { opacity: hint, transform: [{ translateY: hintTY }] }]}>Tap the centre to start a quick challenge</Animated.Text>
      </View>

      {/* bottom tabs — Cuemath-style curved selector */}
      <ArcTabs active={activeTab} onTabPress={onTabPress} />

      {/* loading transition */}
      {loading && (
        <View style={st.loadOverlay}>
          <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
            <Svg width={64} height={64} viewBox="0 0 64 64">
              <Circle cx="32" cy="32" r="22" fill="none" stroke="#26262C" strokeWidth="5" />
              <Path d="M 32 10 A 22 22 0 0 1 54 32" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
            </Svg>
          </Animated.View>
          <Text style={st.loadTxt}>Loading…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: -3 },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boltPill: { borderWidth: 1.5, borderColor: '#5A4A12', backgroundColor: '#231D08', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },

  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  tapRing: { position: 'absolute', left: '50%', top: '50%', borderWidth: 2.5, borderColor: '#fff' },
  tapHit: { position: 'absolute', left: '50%', top: '50%' },
  hint: { color: '#8E8E93', fontSize: 13, fontWeight: '700', textAlign: 'center', paddingHorizontal: 30 },

  tabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 8 : 18, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
  tabActive: { borderWidth: 1.5, borderColor: '#fff' },
  tabTxt: { color: '#6E6E77', fontSize: 13, fontWeight: '900', letterSpacing: 1.4 },
  tabTxtActive: { color: '#fff' },

  loadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,11,13,0.92)', alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadTxt: { color: '#9A9AA0', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
});
