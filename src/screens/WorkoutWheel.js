// src/screens/WorkoutWheel.js
// AILERNOVA — premium dark-neon "Workout" skill wheel (react-native-svg).
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform,
  TouchableOpacity, Animated, Dimensions, Easing,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_W - 48, 340);

const VB = 300;
const C = VB / 2;
const R_OUTER = 138;
const R_INNER = 96;
const R_TEXT = (R_OUTER + R_INNER) / 2;
const R_EMOJI = 80; // inside the band, in the dark gap — clear of the labels

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
const SEG = {
  reasoning:     { a0: -40, a1: 40 },
  application:   { a0: 50,  a1: 130 },
  understanding: { a0: 140, a1: 220 },
  fluency:       { a0: 230, a1: 310 },
};
const ORDER = ['reasoning', 'application', 'understanding', 'fluency'];

// Per-skill neon identity.
const SKILL_THEME = {
  reasoning:     { color: '#A855F7', glow: '#C084FC', emoji: '🧠' },
  application:   { color: '#F59E0B', glow: '#FCD34D', emoji: '⚙️' },
  understanding: { color: '#22C55E', glow: '#4ADE80', emoji: '💡' },
  fluency:       { color: '#06B6D4', glow: '#22D3EE', emoji: '⚡' },
};

const COL = {
  bg: '#0A0A0F', panel: '#15151E', segIdle: '#141420', segStroke: '#2C2C36',
  txtIdle: '#8A8A96', txtActive: '#0A0A0F',
  accent: '#34D399', white: '#FFFFFF', sub: '#8E8E93',
};

// Fixed twinkling sparkle positions (fraction of WHEEL_SIZE).
const SPARKLES = [
  { x: 0.10, y: 0.18, s: 7,  d: 0 },
  { x: 0.86, y: 0.12, s: 5,  d: 0.3 },
  { x: 0.92, y: 0.62, s: 6,  d: 0.6 },
  { x: 0.06, y: 0.66, s: 5,  d: 0.45 },
  { x: 0.50, y: 0.04, s: 6,  d: 0.15 },
  { x: 0.74, y: 0.90, s: 5,  d: 0.75 },
];

const WorkoutWheel = ({
  topic = 'Build your math superpowers! 💪',
  user = {},
  skills,
  defaultActiveKey = 'understanding',
  spinOnStart = true,
  onStart,
  onSelectSkill,
  activeTab = 'workout',
  onTabPress,
}) => {
  const { user: authUser } = useAuth();
  const u = user || {};
  // Prefer the explicit prop, then the logged-in user, then a safe fallback.
  const uName  = u.name ?? authUser?.name ?? 'Learner';
  const uGrade = u.grade ?? '';

  const data = useMemo(() => {
    const provided = {};
    (skills || []).forEach((s) => { if (s && s.key) provided[s.key] = s; });
    const fallback = {
      reasoning:     { key: 'reasoning',     label: 'REASONING',     progress: 0 },
      application:   { key: 'application',   label: 'APPLICATION',   progress: 0 },
      understanding: { key: 'understanding', label: 'UNDERSTANDING', progress: 0 },
      fluency:       { key: 'fluency',       label: 'FLUENCY',       progress: 0 },
    };
    return ORDER.map((k) => ({ ...fallback[k], ...(provided[k] || {}) }));
  }, [skills]);

  const defaultIdx = Math.max(0, ORDER.indexOf(defaultActiveKey));
  const [lit, setLit] = useState(defaultIdx);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState(null);

  const pulse = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    const tw = Animated.loop(Animated.sequence([
      Animated.timing(twinkle, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(twinkle, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start(); tw.start();
    return () => { loop.stop(); tw.stop(); };
  }, [enter, pulse, twinkle]);

  const handleStart = () => {
    if (spinning) return;
    setLanded(null);
    if (!spinOnStart) { onStart && onStart(data[lit]); return; }
    setSpinning(true);
    // Pick a random skill from the wheel — every spin is independent.
    const target = Math.floor(Math.random() * data.length);
    console.log('[BrainGym] selected skill:', data[target]?.key);
    const totalSteps = data.length * 3 + target;
    let step = 0;
    const tick = () => {
      setLit(step % data.length);
      step += 1;
      if (step <= totalSteps) {
        const remaining = totalSteps - step;
        const delay = 55 + (remaining < 6 ? (6 - remaining) * 55 : 0);
        setTimeout(tick, delay);
      } else {
        setSpinning(false);
        setLanded(data[target]);
        // Brief "selected" reveal, then continue into the quiz.
        setTimeout(() => onStart && onStart(data[target]), 650);
      }
    };
    tick();
  };

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const enterScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const ringGlow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const btnPx = (WHEEL_SIZE * (2 * 60)) / VB;

  // Curved-label arcs (understanding is rendered as straight text below).
  const litTheme = SKILL_THEME[data[lit]?.key] || SKILL_THEME.reasoning;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COL.bg} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: COL.bg }} />}

      <View style={s.header}>
        <View style={s.userRow}>
          <View style={s.avatar}><Text style={{ fontSize: 22 }}>🙂</Text></View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={s.userName}>{uName}</Text>
              {!!uGrade && <Text style={s.userGrade}>{uGrade}</Text>}
            </View>
            <Text style={s.userSub}>Brain Gym</Text>
          </View>
        </View>
        <View style={s.statsRow}>
          <View style={s.boltPill}><Text style={s.boltTxt}>⚡⚡⚡</Text></View>
          <View style={s.circleBadge}><Text style={{ fontSize: 14 }}>🏆</Text></View>
        </View>
      </View>

      <View style={s.wheelWrap}>
        <Animated.View style={{ transform: [{ scale: enterScale }], opacity: enter }}>
          <View style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
            {/* Twinkling sparkles around the wheel */}
            {SPARKLES.map((sp, i) => (
              <Animated.Text key={i} style={{
                position: 'absolute',
                left: WHEEL_SIZE * sp.x,
                top: WHEEL_SIZE * sp.y,
                fontSize: sp.s + 8,
                opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.15 + sp.d * 0.2, 0.9] }),
              }}>✦</Animated.Text>
            ))}

            <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${VB} ${VB}`}>
              {/* Outer neon glow rings (subtle, tied to active skill) */}
              <Circle cx={C} cy={C} r={R_OUTER + 10} fill="none" stroke={litTheme.glow}  strokeWidth={1.5} strokeOpacity={0.16} />
              <Circle cx={C} cy={C} r={R_OUTER + 4}  fill="none" stroke={litTheme.color} strokeWidth={1.5} strokeOpacity={0.40} />

              {/* Faint inner guide ring */}
              <Circle cx={C} cy={C} r={R_INNER - 6} fill="none" stroke="#1B1B26" strokeWidth={1} />

              {/* Skill wedges */}
              {data.map((skill, i) => {
                const seg = SEG[skill.key];
                if (!seg) return null;
                const theme = SKILL_THEME[skill.key] || {};
                const isLit = i === lit;
                return (
                  <G key={skill.key} onPress={() => onSelectSkill && onSelectSkill(skill)}>
                    <Path d={wedge(seg.a0, seg.a1, R_OUTER, R_INNER)}
                      fill={isLit ? theme.color : COL.segIdle}
                      fillOpacity={isLit ? 0.92 : 1}
                      stroke={theme.color}
                      strokeWidth={isLit ? 3 : 1.5}
                      strokeOpacity={isLit ? 1 : 0.45} />
                  </G>
                );
              })}

              {/* Per-skill emoji icons */}
              {data.map((skill) => {
                const seg = SEG[skill.key];
                if (!seg) return null;
                const theme = SKILL_THEME[skill.key] || {};
                const mid = (seg.a0 + seg.a1) / 2;
                const p = polar(R_EMOJI, mid);
                return (
                  <SvgText key={'emo-' + skill.key} x={p.x} y={p.y + 6} fontSize={18} textAnchor="middle">
                    {theme.emoji}
                  </SvgText>
                );
              })}

              {/* Segment labels — all identical style, centered in each wedge,
                  rotated to follow the ring (top/bottom horizontal, sides upright). */}
              {data.map((skill, i) => {
                const seg = SEG[skill.key];
                if (!seg) return null;
                const mid = (seg.a0 + seg.a1) / 2;
                let rot = ((mid % 360) + 360) % 360;
                if (rot > 90 && rot < 270) rot -= 180; // keep text upright
                const p = polar(R_TEXT, mid);
                const isLit = i === lit;
                return (
                  <SvgText key={'lbl-' + skill.key}
                    x={p.x} y={p.y}
                    fill={isLit ? COL.txtActive : COL.txtIdle}
                    fontSize={11} fontWeight="800" letterSpacing={1.5}
                    textAnchor="middle" alignmentBaseline="middle"
                    transform={`rotate(${rot} ${p.x} ${p.y})`}>
                    {skill.label}
                  </SvgText>
                );
              })}
            </Svg>

            {/* Premium START button */}
            <Animated.View style={[s.startGlow, {
              width: btnPx + 16, height: btnPx + 16, borderRadius: (btnPx + 16) / 2,
              marginLeft: -(btnPx + 16) / 2, marginTop: -(btnPx + 16) / 2,
              borderColor: litTheme.color, opacity: ringGlow,
            }]} />
            <Animated.View style={[s.startWrap, {
              width: btnPx, height: btnPx, borderRadius: btnPx / 2,
              marginLeft: -btnPx / 2, marginTop: -btnPx / 2,
              transform: [{ scale: pulseScale }],
            }]}>
              <TouchableOpacity activeOpacity={0.85} onPress={handleStart}
                style={[s.startBtn, { borderRadius: btnPx / 2 }]}>
                <Text style={s.startTxt}>{spinning ? '✦' : 'START'}</Text>
                {!spinning && <Text style={s.startSub}>Spin the wheel!</Text>}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {landed ? (
          <View style={[s.skillChip, { borderColor: (SKILL_THEME[landed.key] || {}).color }]}>
            <Text style={[s.skillChipTxt, { color: (SKILL_THEME[landed.key] || {}).glow }]}>
              {(SKILL_THEME[landed.key] || {}).emoji} {landed.label} selected!
            </Text>
          </View>
        ) : (
          <Text style={s.topic}>{topic}</Text>
        )}
      </View>

      <View style={s.tabs}>
        {[{ key: 'practice', label: 'PRACTICE' }, { key: 'workout', label: 'WORKOUT' }, { key: 'arena', label: 'ARENA' }].map((t) => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity key={t.key} style={[s.tab, active && s.tabActive]} activeOpacity={0.85}
              onPress={() => onTabPress && onTabPress(t.key)}>
              <Text style={[s.tabTxt, active && s.tabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COL.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7EE7C7', alignItems: 'center', justifyContent: 'center' },
  userName: { color: COL.white, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  userGrade: { color: COL.sub, fontSize: 10, fontWeight: '800', marginLeft: 3, marginTop: 1 },
  userSub: { color: '#A855F7', fontSize: 11, fontWeight: '800', marginTop: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boltPill: { borderWidth: 1.5, borderColor: '#3A3A1E', backgroundColor: '#1E1B0E', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  boltTxt: { fontSize: 12, letterSpacing: 1 },
  circleBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: COL.panel, borderWidth: 1.5, borderColor: COL.segStroke, alignItems: 'center', justifyContent: 'center' },

  wheelWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },

  startGlow: { position: 'absolute', left: '50%', top: '50%', borderWidth: 2, backgroundColor: 'transparent' },
  startWrap: { position: 'absolute', left: '50%', top: '50%' },
  startBtn: {
    flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#A855F7', shadowOpacity: 0.7, shadowRadius: 22, shadowOffset: { width: 0, height: 0 }, elevation: 12,
  },
  startTxt: { color: '#0A0A0F', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  startSub: { color: '#6D28D9', fontSize: 9, fontWeight: '800', marginTop: 1, letterSpacing: 0.3 },

  topic: { color: COL.white, fontSize: 17, fontWeight: '800', marginTop: 26, letterSpacing: -0.2, textAlign: 'center' },
  skillChip: { marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, borderWidth: 2, backgroundColor: '#141420' },
  skillChipTxt: { fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },

  tabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 8 : 18, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
  tabActive: { borderWidth: 1.5, borderColor: COL.white },
  tabTxt: { color: COL.txtIdle, fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  tabTxtActive: { color: COL.white },
});

export default WorkoutWheel;
