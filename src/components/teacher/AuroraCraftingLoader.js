// src/components/teacher/AuroraCraftingLoader.js
// The "Aurora Crafting Lesson" screen — shown while Ms. Nova generates a personal
// lesson. A floating sparkle orb with pulsing rings, an animated progress bar, and a
// staged checklist (done → active → pending) over the aurora wash. Pure core Animated
// (native driver) + expo-linear-gradient + react-native-svg — no extra native deps.
//
// Props:
//   topic   — the lesson topic (shown in the subtitle)
//   stages  — string[] of preparing beats
//   stage   — index of the currently-active beat (earlier = done, later = pending)
//   quote   — the italic reassurance line at the bottom
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLG, Stop } from 'react-native-svg';
import {
  useFonts,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import AuroraBg from './AuroraBg';

const F = {
  reg: 'SpaceGrotesk_400Regular', med: 'SpaceGrotesk_500Medium',
  semi: 'SpaceGrotesk_600SemiBold', bold: 'SpaceGrotesk_700Bold',
};

// ── one expanding "sonar" ring behind the orb ────────────────────────────────
function PulseRing({ delay = 0, color }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop;
    const t = setTimeout(() => {
      loop = Animated.loop(
        Animated.timing(a, { toValue: 1, duration: 3000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      );
      loop.start();
    }, delay);
    return () => { clearTimeout(t); loop && loop.stop(); };
  }, [a, delay]);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const opacity = a.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0, 0] });
  return <Animated.View pointerEvents="none" style={[st.ring, { borderColor: color, opacity, transform: [{ scale }] }]} />;
}

// ── the gold sparkle star, slowly rotating ───────────────────────────────────
function SparkleStar() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rot, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [rot]);
  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Svg width={46} height={46} viewBox="0 0 24 24">
        <Defs>
          <SvgLG id="spk" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFCF5C" />
            <Stop offset="1" stopColor="#FFAB3D" />
          </SvgLG>
        </Defs>
        <Path fill="url(#spk)" d="M12 2l2.2 6.2L20 10l-5.8 1.8L12 18l-2.2-6.2L4 10l5.8-1.8z" />
        <Path fill="url(#spk)" opacity={0.85} d="M18.5 3l.9 2.4L22 6l-2.6.6-.9 2.4-.9-2.4L15 6l2.6-.6z" />
      </Svg>
    </Animated.View>
  );
}

// ── a small twinkling glyph ──────────────────────────────────────────────────
function Twinkle({ style, delay = 0, color }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop;
    const t = setTimeout(() => {
      loop = Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]));
      loop.start();
    }, delay);
    return () => { clearTimeout(t); loop && loop.stop(); };
  }, [a, delay]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  return <Animated.Text style={[style, { color, opacity, transform: [{ scale }] }]}>✦</Animated.Text>;
}

// ── the floating sparkle orb ─────────────────────────────────────────────────
function SparkleOrb() {
  const floaty = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(floaty, { toValue: 1, duration: 2250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floaty, { toValue: 0, duration: 2250, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [floaty]);
  const translateY = floaty.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  return (
    <Animated.View style={[st.orbWrap, { transform: [{ translateY }] }]}>
      <PulseRing color="rgba(167,139,255,0.45)" delay={0} />
      <PulseRing color="rgba(255,158,205,0.4)" delay={1000} />
      <LinearGradient colors={['#EFE3FF', '#E3D0FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.orb}>
        <SparkleStar />
      </LinearGradient>
      <Twinkle style={st.tw1} color="#FFB84D" delay={0} />
      <Twinkle style={st.tw2} color="#A78BFF" delay={600} />
    </Animated.View>
  );
}

// ── the pulsing dot for the active step ──────────────────────────────────────
function ActiveDot() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  return (
    <View style={st.activeRing}>
      <Animated.View style={[st.activeDot, { opacity }]} />
    </View>
  );
}

export default function AuroraCraftingLoader({ topic, stages = [], stage = 0, quote }) {
  useFonts({ SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold });

  // Progress bar fills toward the current stage (non-native — width can't use the
  // native driver, but it's a single thin bar so cost is negligible).
  const total = Math.max(1, stages.length);
  const prog = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const target = Math.min(0.95, Math.max(0.1, (stage + 1) / total));
    Animated.timing(prog, { toValue: target, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [stage, total, prog]);
  const width = prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const subtitle = topic ? `Shaping a lesson on “${topic}”` : 'Reading chapter syllabus & key concepts';

  return (
    <View style={st.root}>
      <AuroraBg base="#F2F0FA" />

      <View style={st.content}>
        <SparkleOrb />
        <Text style={st.thinkingLabel}>Ms. Nova is thinking</Text>

        <Text style={st.heading}>Crafting Your{'\n'}Personal Lesson</Text>
        <Text style={st.subtitle}>{subtitle}</Text>

        <View style={st.track}>
          <Animated.View style={[st.fillWrap, { width }]}>
            <LinearGradient colors={['#6C4DE6', '#B365D6', '#FF9ECD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.fill} />
          </Animated.View>
        </View>

        <View style={st.steps}>
          {stages.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <View key={i} style={[st.step, !done && !active && st.stepPending]}>
                {done ? (
                  <LinearGradient colors={['#35D39A', '#22C58A']} style={st.check}>
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M4 12l5 5L20 6" />
                    </Svg>
                  </LinearGradient>
                ) : active ? (
                  <ActiveDot />
                ) : (
                  <View style={st.pending} />
                )}
                <Text style={[st.stepTxt, done && st.stepDone, active && st.stepActive]}>{s}</Text>
              </View>
            );
          })}
        </View>

        {!!quote && <Text style={st.quote}>{`“${String(quote).replace(/^["“]|["”]$/g, '')}”`}</Text>}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 30 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 30 },

  // orb
  orbWrap: { width: 108, height: 108, marginTop: 22, marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 108, height: 108, borderRadius: 54, borderWidth: 2 },
  orb: {
    width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7850F0', shadowOpacity: 0.28, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 8,
  },
  tw1: { position: 'absolute', top: 4, right: 6, fontSize: 12 },
  tw2: { position: 'absolute', bottom: 8, left: 0, fontSize: 10 },

  thinkingLabel: { fontFamily: F.med, fontSize: 8, letterSpacing: 1.2, color: '#A49DC8', marginTop: 2, textTransform: 'uppercase' },

  heading: { fontFamily: F.bold, fontSize: 24, lineHeight: 29, color: '#2A2450', textAlign: 'center', marginTop: 16 },
  subtitle: { fontFamily: F.reg, fontSize: 14, color: '#8079B0', textAlign: 'center', marginTop: 12, maxWidth: 250 },

  // progress
  track: { width: '100%', maxWidth: 240, height: 7, borderRadius: 999, backgroundColor: 'rgba(140,110,240,0.16)', marginTop: 22, overflow: 'hidden' },
  fillWrap: { height: '100%', borderRadius: 999, overflow: 'hidden' },
  fill: { flex: 1, borderRadius: 999 },

  // steps
  steps: { alignSelf: 'stretch', marginTop: 32, gap: 20 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepPending: { opacity: 0.5 },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activeRing: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#A78BFF', alignItems: 'center', justifyContent: 'center' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A78BFF' },
  pending: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CFC7EA' },
  stepTxt: { flex: 1, fontFamily: F.med, fontSize: 14, lineHeight: 19, color: '#3A3560' },
  stepDone: { color: '#3A3560' },
  stepActive: { fontFamily: F.bold, color: '#2A2450' },

  quote: { marginTop: 'auto', paddingVertical: 22, fontFamily: F.reg, fontStyle: 'italic', fontSize: 12, color: '#A49DC8', textAlign: 'center' },
});
