// src/components/teacher/AuroraCraftingLoader.js
// The "Crafting Your Personal Lesson" screen — shown while Ms. Nova generates a lesson.
// A deep-indigo night wash, a glass card holding the sparkle orb / heading / progress
// bar, then her thinking beats as a staged checklist (done → active → pending) and a
// closing reassurance line.
//
// Motion (all core Animated; every transform/opacity runs on the native driver — only
// the progress WIDTH can't, and that's one thin bar):
//   • card       — fade + rise + settle on mount
//   • orb        — slow float, rotating sparkle, two sonar rings, two twinkles
//   • progress   — eased width to the current stage + a looping shimmer sweep
//   • steps      — staggered entrance, spring "pop" the moment one completes
//   • active dot — breathing opacity/scale
//   • quote      — delayed fade with a long breath
//
// Props:
//   topic   — the lesson topic (shown in the subtitle)
//   stages  — string[] of preparing beats
//   stage   — index of the currently-active beat (earlier = done, later = pending)
//   quote   — the reassurance line at the bottom
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLG, RadialGradient, Stop, Rect } from 'react-native-svg';
import {
  useFonts,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { N } from '../../theme/nightTheme';

const { width: W, height: H } = Dimensions.get('window');

const F = {
  reg: 'SpaceGrotesk_400Regular', med: 'SpaceGrotesk_500Medium',
  semi: 'SpaceGrotesk_600SemiBold', bold: 'SpaceGrotesk_700Bold',
};

// Shared night palette — the same tokens the Student Home wears, so the two dark
// surfaces read as one product. See src/theme/nightTheme.js.
const P = { ...N, card: N.cardSoft, cardEdge: 'rgba(255,255,255,0.085)' };

// ── page background: vertical gradient + two low-opacity violet blooms ────────
function NightBg() {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [drift]);
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[P.bgTop, P.bgBot]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]}>
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="gl0" cx={W * 0.5} cy={H * 0.16} r={W * 0.62} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={P.glow} stopOpacity="0.55" />
              <Stop offset="1" stopColor={P.glow} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="gl1" cx={W * 0.1} cy={H * 0.92} r={W * 0.7} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#2A3A7C" stopOpacity="0.4" />
              <Stop offset="1" stopColor="#2A3A7C" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={W} height={H} fill="url(#gl0)" />
          <Rect x="0" y="0" width={W} height={H} fill="url(#gl1)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ── generic entrance: fade + rise (+ optional settle) ────────────────────────
function Appear({ delay = 0, y = 14, scaleFrom, style, children }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [a, delay]);
  const transform = [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }];
  if (scaleFrom) transform.push({ scale: a.interpolate({ inputRange: [0, 1], outputRange: [scaleFrom, 1] }) });
  return <Animated.View style={[style, { opacity: a, transform }]}>{children}</Animated.View>;
}

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
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const opacity = a.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.38, 0, 0] });
  return <Animated.View pointerEvents="none" style={[st.ring, { borderColor: color, opacity, transform: [{ scale }] }]} />;
}

// ── the sparkle glyph, slowly rotating ───────────────────────────────────────
function SparkleStar() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rot, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [rot]);
  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Svg width={34} height={34} viewBox="0 0 24 24">
        <Defs>
          <SvgLG id="spkD" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#E4DCFF" />
          </SvgLG>
        </Defs>
        <Path fill="url(#spkD)" d="M12 2l2.2 6.2L20 10l-5.8 1.8L12 18l-2.2-6.2L4 10l5.8-1.8z" />
        <Path fill="url(#spkD)" opacity={0.9} d="M18.5 3l.9 2.4L22 6l-2.6.6-.9 2.4-.9-2.4L15 6l2.6-.6z" />
      </Svg>
    </Animated.View>
  );
}

// ── a small twinkling glyph near the orb ─────────────────────────────────────
function Twinkle({ style, delay = 0, color }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop;
    const t = setTimeout(() => {
      loop = Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]));
      loop.start();
    }, delay);
    return () => { clearTimeout(t); loop && loop.stop(); };
  }, [a, delay]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.95] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
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
  const translateY = floaty.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  return (
    <Animated.View style={[st.orbWrap, { transform: [{ translateY }] }]}>
      <PulseRing color="rgba(150,130,240,0.5)" delay={0} />
      <PulseRing color="rgba(120,100,220,0.4)" delay={1000} />
      <LinearGradient colors={[P.orbA, P.orbB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.orb}>
        <SparkleStar />
      </LinearGradient>
      <Twinkle style={st.tw1} color="#CFC3FF" delay={0} />
      <Twinkle style={st.tw2} color="#9E8CE8" delay={700} />
    </Animated.View>
  );
}

// ── looping highlight sweep across the filled part of the bar ────────────────
function Shimmer() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.delay(700),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [-70, 300] });
  return (
    <Animated.View pointerEvents="none" style={[st.shimmer, { transform: [{ translateX }] }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ── the breathing dot for the active step ────────────────────────────────────
function ActiveDot() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.1] });
  return (
    <View style={st.slot}>
      <Animated.View style={[st.activeDot, { opacity, transform: [{ scale }] }]} />
    </View>
  );
}

// ── one checklist row; the check springs in the moment the beat completes ─────
function Step({ label, done, active, index }) {
  const pop = useRef(new Animated.Value(done ? 1 : 0)).current;
  useEffect(() => {
    if (!done) { pop.setValue(0); return; }
    // Spring so completion lands with a little weight rather than just appearing.
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }).start();
  }, [done, pop]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Appear delay={260 + index * 90} y={10} style={st.step}>
      {done ? (
        <Animated.View style={[st.check, { transform: [{ scale }] }]}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 12l5 5L20 6" />
          </Svg>
        </Animated.View>
      ) : active ? (
        <ActiveDot />
      ) : (
        <View style={st.slot}><View style={st.pending} /></View>
      )}
      <Text style={[st.stepTxt, active && st.stepActive, !done && !active && st.stepPending]}>{label}</Text>
    </Appear>
  );
}

// ── the closing line: fades in late, then breathes ───────────────────────────
function Quote({ text }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 700, delay: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: 0.55, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(a, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    });
  }, [a]);
  return <Animated.Text style={[st.quote, { opacity: a }]}>{text}</Animated.Text>;
}

export default function AuroraCraftingLoader({ topic, stages = [], stage = 0, quote }) {
  useFonts({ SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold });

  // Progress eases toward the current stage. Width can't use the native driver, but
  // it's one thin bar so the cost is negligible.
  const total = Math.max(1, stages.length);
  const prog = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const target = Math.min(0.95, Math.max(0.1, (stage + 1) / total));
    Animated.timing(prog, { toValue: target, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [stage, total, prog]);
  const width = prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const subtitle = topic ? `Shaping a lesson on “${topic}”` : 'Reading chapter syllabus & key concepts…';
  const activeLabel = stages[stage] || '';

  return (
    <View style={st.root}>
      {/* The overlay is dark, so the clock/battery row needs light glyphs while it's up. */}
      <StatusBar barStyle="light-content" />
      <NightBg />

      <View
        style={st.content}
        accessibilityRole="progressbar"
        accessibilityLabel={`Crafting your personal lesson. ${activeLabel}`}
        accessibilityValue={{ min: 0, max: total, now: Math.min(stage + 1, total) }}
      >
        {/* ── glass card: orb + heading + progress ── */}
        <Appear y={18} scaleFrom={0.96} style={st.card}>
          <SparkleOrb />
          <Text style={st.heading}>Crafting Your Personal Lesson</Text>
          <Text style={st.subtitle}>{subtitle}</Text>

          <View style={st.track}>
            <Animated.View style={[st.fillWrap, { width }]}>
              <LinearGradient
                colors={[P.fillA, P.fillB]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={st.fill}
              />
              <Shimmer />
            </Animated.View>
          </View>
        </Appear>

        {/* ── her thinking beats ── */}
        <View style={st.steps}>
          {stages.map((s, i) => (
            <Step key={i} index={i} label={s} done={i < stage} active={i === stage} />
          ))}
        </View>

        {!!quote && <Quote text={String(quote).replace(/^["“]|["”]$/g, '')} />}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 30 },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 26 },

  // ── card ──
  card: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: P.cardEdge,
    backgroundColor: P.card,
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 30,
    alignItems: 'center',
  },

  // orb
  orbWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 1.5 },
  orb: {
    width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6A54C8', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  tw1: { position: 'absolute', top: -2, right: -4, fontSize: 11 },
  tw2: { position: 'absolute', bottom: 2, left: -6, fontSize: 9 },

  heading: {
    fontFamily: F.bold, fontSize: 22, lineHeight: 29, color: P.ink,
    textAlign: 'center', marginTop: 22, maxWidth: 250,
  },
  subtitle: {
    fontFamily: F.reg, fontSize: 14, lineHeight: 20, color: P.inkSoft,
    textAlign: 'center', marginTop: 10, maxWidth: 230,
  },

  // progress
  track: {
    alignSelf: 'stretch', height: 6, borderRadius: 999,
    backgroundColor: P.track, marginTop: 24, overflow: 'hidden',
  },
  fillWrap: { height: '100%', borderRadius: 999, overflow: 'hidden' },
  fill: { ...StyleSheet.absoluteFillObject, borderRadius: 999 },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 70 },

  // ── steps ──
  steps: { alignSelf: 'stretch', marginTop: 30, gap: 22, paddingHorizontal: 6 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  slot: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  check: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: P.green,
    alignItems: 'center', justifyContent: 'center',
  },
  activeDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: P.dot },
  pending: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: P.pendingEdge },
  stepTxt: { flex: 1, fontFamily: F.med, fontSize: 14, lineHeight: 20, color: P.inkSoft },
  stepActive: { fontFamily: F.bold, color: P.ink },
  stepPending: { color: P.inkDim },

  quote: {
    marginTop: 'auto', paddingVertical: 24,
    fontFamily: F.reg, fontSize: 13, color: P.inkSoft,
    textAlign: 'center',
  },
});
