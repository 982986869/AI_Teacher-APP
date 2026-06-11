// src/screens/WorkoutWheel.js
// AILERNOVA — radial "Workout" skill wheel (react-native-svg).
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform,
  TouchableOpacity, Animated, Dimensions, Easing,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, TextPath, Defs } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_W - 48, 340);

const VB = 300;
const C = VB / 2;
const R_OUTER = 138;
const R_INNER = 96;
const R_TEXT = (R_OUTER + R_INNER) / 2;

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
const progressArc = (a0, a1, frac, r) => {
  const end = a0 + (a1 - a0) * Math.max(0, Math.min(1, frac));
  const p1 = polar(r, a0), p2 = polar(r, end);
  const large = end - a0 > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
};
const labelArc = (a0, a1, r) => {
  const p1 = polar(r, a0), p2 = polar(r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
};

const SEG = {
  reasoning:     { a0: -40, a1: 40 },
  application:   { a0: 50,  a1: 130 },
  understanding: { a0: 140, a1: 220 },
  fluency:       { a0: 230, a1: 310 },
};
const ORDER = ['reasoning', 'application', 'understanding', 'fluency'];

const COL = {
  bg: '#0E0E10', panel: '#1C1C1E', segIdle: '#1A1A1D', segStroke: '#2C2C30',
  segActive: '#FFFFFF', txtIdle: '#7C7C82', txtActive: '#0E0E10',
  accent: '#34D399', white: '#FFFFFF', sub: '#8E8E93',
};

const WorkoutWheel = ({
  topic = 'Exponents in Real World',
  user = {},
  skills,
  defaultActiveKey = 'understanding',
  spinOnStart = true,
  onStart,
  onSelectSkill,
  activeTab = 'workout',
  onTabPress,
}) => {
  const u = user || {};
  const uName  = u.name  ?? 'sam09';
  const uGrade = u.grade ?? '';
  const uXp    = u.xp ?? 0;

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

  const pulse = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [enter, pulse]);

  const handleStart = () => {
    if (spinning) return;
    if (!spinOnStart) { onStart && onStart(data[lit]); return; }
    setSpinning(true);
    let target = 0;
    data.forEach((sk, i) => { if ((sk.progress || 0) < (data[target].progress || 0)) target = i; });
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
        onStart && onStart(data[target]);
      }
    };
    tick();
  };

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const enterScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const btnPx = (WHEEL_SIZE * (2 * 60)) / VB;

  // Curved-label arcs (understanding is rendered as straight text below).
  const ARCS = [
    { key: 'reasoning',   id: 'arc-reasoning',   seg: SEG.reasoning },
    { key: 'application', id: 'arc-application', seg: SEG.application },
    { key: 'fluency',     id: 'arc-fluency',     seg: SEG.fluency },
  ];

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
            <Text style={s.userXp}>+{uXp}</Text>
          </View>
        </View>
        <View style={s.statsRow}>
          <View style={s.boltPill}><Text style={s.boltTxt}>⚡⚡⚡</Text></View>
          <View style={s.circleBadge}><Text style={{ fontSize: 14 }}>🏆</Text></View>
          <View style={[s.circleBadge, s.streakBadge]}><Text style={s.streakTxt}>2</Text></View>
        </View>
      </View>

      <View style={s.wheelWrap}>
        <Animated.View style={{ transform: [{ scale: enterScale }], opacity: enter }}>
          <View style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
            <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${VB} ${VB}`}>
              <Defs>
                {ARCS.map(({ id, seg }) => (
                  <Path key={id} id={id} d={labelArc(seg.a0, seg.a1, R_TEXT)} />
                ))}
              </Defs>

              {[132, 110, 86, 64].map((r, i) => (
                <Circle key={i} cx={C} cy={C} r={r} fill="none" stroke="#1A1A1D" strokeWidth={1} />
              ))}

              {data.map((skill, i) => {
                const seg = SEG[skill.key];
                if (!seg) return null;
                const isLit = i === lit;
                return (
                  <G key={skill.key} onPress={() => onSelectSkill && onSelectSkill(skill)}>
                    <Path d={wedge(seg.a0, seg.a1, R_OUTER, R_INNER)}
                      fill={isLit ? COL.segActive : COL.segIdle}
                      stroke={isLit ? COL.segActive : COL.segStroke} strokeWidth={1.5} />
                    {(skill.progress || 0) > 0 && (
                      <Path d={progressArc(seg.a0, seg.a1, skill.progress, R_OUTER - 4)}
                        fill="none" stroke={isLit ? '#0E0E10' : COL.accent}
                        strokeWidth={4} strokeLinecap="round" />
                    )}
                  </G>
                );
              })}

              {ARCS.map(({ key, id }) => {
                const i = ORDER.indexOf(key);
                const isLit = i === lit;
                const label = data[i]?.label || '';
                return (
                  <SvgText key={key} fill={isLit ? COL.txtActive : COL.txtIdle}
                    fontSize={11} fontWeight="800" letterSpacing={2}>
                    <TextPath href={`#${id}`} xlinkHref={`#${id}`} startOffset="50%" textAnchor="middle">
                      {label}
                    </TextPath>
                  </SvgText>
                );
              })}

              {(() => {
                const i = ORDER.indexOf('understanding');
                const isLit = i === lit;
                const p = polar(R_TEXT, 180);
                return (
                  <SvgText x={p.x} y={p.y + 4} fill={isLit ? COL.txtActive : COL.txtIdle}
                    fontSize={11} fontWeight="800" letterSpacing={2} textAnchor="middle">
                    {data[i]?.label || ''}
                  </SvgText>
                );
              })()}
            </Svg>

            <Animated.View style={[s.startWrap, {
              width: btnPx, height: btnPx, borderRadius: btnPx / 2,
              marginLeft: -btnPx / 2, marginTop: -btnPx / 2,
              transform: [{ scale: pulseScale }],
            }]}>
              <TouchableOpacity activeOpacity={0.85} onPress={handleStart}
                style={[s.startBtn, { borderRadius: btnPx / 2 }]}>
                <Text style={s.startTxt}>{spinning ? '…' : 'START'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        <Text style={s.topic}>{topic}</Text>
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
  userXp: { color: COL.accent, fontSize: 13, fontWeight: '800', marginTop: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boltPill: { borderWidth: 1.5, borderColor: '#3A3A1E', backgroundColor: '#1E1B0E', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  boltTxt: { fontSize: 12, letterSpacing: 1 },
  circleBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: COL.panel, borderWidth: 1.5, borderColor: COL.segStroke, alignItems: 'center', justifyContent: 'center' },
  streakBadge: { backgroundColor: '#7A1F1F', borderColor: '#7A1F1F' },
  streakTxt: { color: COL.white, fontSize: 13, fontWeight: '900' },
  wheelWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
  startWrap: { position: 'absolute', left: '50%', top: '50%' },
  startBtn: { flex: 1, backgroundColor: COL.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#fff', shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  startTxt: { color: '#0E0E10', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  topic: { color: COL.white, fontSize: 18, fontWeight: '800', marginTop: 28, letterSpacing: -0.2 },
  tabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 8 : 18, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
  tabActive: { borderWidth: 1.5, borderColor: COL.white },
  tabTxt: { color: COL.txtIdle, fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  tabTxtActive: { color: COL.white },
});

export default WorkoutWheel;