// src/screens/braingym/ChallengeWheel.js
//
// AILERNOVA — black & white 4-quadrant "challenge wheel".
// Quadrants: Understanding (top), Fluency (right), Reasoning (bottom), Application (left).
// Pick a quadrant → tap START → answer the challenge question → that quadrant completes.
// Finish all 4 → centre shows DONE and onComplete() fires.
//
// Dependency: react-native-svg
//
// Usage:
//   <ChallengeWheel
//     questions={{ understanding:{...}, fluency:{...}, reasoning:{...}, application:{...} }}
//     onComplete={() => {/* daily workout finished */}}
//     onExit={(tab) => {/* 'practice' | 'workout' | 'arena' bottom-bar tap */}}
//   />

import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform,
  TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Path, Text as SvgText, TextPath, Defs } from 'react-native-svg';
import { initSounds, playSound, unloadSounds } from '../../utils/sound';

const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_PX = Math.min(SCREEN_W - 50, 300);

// ── geometry (ported from the validated prototype) ──
const VB = 300, C = 150, R = 132, RC = 52, RTEXT = 118;
const ICON_R = (R + RC) / 2;
const polar = (r, d) => ({ x: C + r * Math.sin((d * Math.PI) / 180), y: C - r * Math.cos((d * Math.PI) / 180) });
const fx = (n) => (+n).toFixed(2);
const slice = (a0, a1, r) => {
  const p1 = polar(r, a0), p2 = polar(r, a1), lg = a1 - a0 > 180 ? 1 : 0;
  return `M ${C} ${C} L ${fx(p1.x)} ${fx(p1.y)} A ${r} ${r} 0 ${lg} 1 ${fx(p2.x)} ${fx(p2.y)} Z`;
};
const ringArc = (a0, a1, r) => {
  const p1 = polar(r, a0), p2 = polar(r, a1), lg = a1 - a0 > 180 ? 1 : 0;
  return `M ${fx(p1.x)} ${fx(p1.y)} A ${r} ${r} 0 ${lg} 1 ${fx(p2.x)} ${fx(p2.y)}`;
};

const QUAD = [
  { key: 'understanding', label: 'UNDERSTANDING', a0: -45, a1: 45,  icon: '▦', mid: 0 },
  { key: 'fluency',       label: 'FLUENCY',       a0: 45,  a1: 135, icon: 'a', mid: 90 },
  { key: 'reasoning',     label: 'REASONING',     a0: 135, a1: 225, icon: '＋', mid: 180 },
  { key: 'application',   label: 'APPLICATION',   a0: 225, a1: 315, icon: 'x', mid: 270 },
];

const DEFAULT_Q = {
  understanding: { tag: 'Understanding', q: 'What does 2³ mean?', opts: ['2 × 3', '2 + 2 + 2', '2 × 2 × 2', '3 × 3'], ans: 2 },
  fluency:       { tag: 'Fluency',       q: 'Simplify: a × a × a', opts: ['3a', 'a³', 'a + 3', '3ᵃ'], ans: 1 },
  reasoning:     { tag: 'Reasoning',     q: 'If 2ˣ = 8, then x = ?', opts: ['2', '3', '4', '8'], ans: 1 },
  application:   { tag: 'Application',   q: 'A cell doubles each hour. After 3 hours it is ×?', opts: ['×6', '×8', '×9', '×3'], ans: 1 },
};

const COL = {
  bg: '#0E0E10', idleQuad: '#16161A', doneQuad: '#202024', sub: '#8E8E93',
  txtIdle: '#7C7C82', white: '#fff',
};

const ChallengeWheel = ({ questions = DEFAULT_Q, onComplete, onExit, showTabs = true }) => {
  const [done, setDone] = useState({});
  const [selected, setSelected] = useState(null);
  const [activeQ, setActiveQ] = useState(null);      // key of open question
  const [picked, setPicked] = useState(null);        // chosen option index

  const allDone = QUAD.every((q) => done[q.key]);

  // Load sounds on mount; stop + free them when leaving the challenge.
  useEffect(() => {
    initSounds();
    return () => { unloadSounds(); };
  }, []);

  const labelArcs = useMemo(() => QUAD
    .filter((q) => q.key !== 'reasoning')
    .map((q) => ({ id: `lp-${q.key}`, d: ringArc(q.a0 + 10, q.a1 - 10, RTEXT) })), []);

  const selectQuad = (key) => { if (!done[key]) { setSelected(key); } };

  const pressCenter = () => {
    if (allDone) return;
    if (!selected) return;            // require a pick first
    setPicked(null);
    setActiveQ(selected);
  };

  const answer = (i) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === questions[selected].ans;
    const next = { ...done, [selected]: true };
    const willComplete = QUAD.every((q) => next[q.key]);

    // Sound: success jingle on the final challenge, otherwise correct/wrong.
    playSound(willComplete ? 'success' : (correct ? 'correct' : 'wrong'));

    setTimeout(() => {
      setActiveQ(null); setPicked(null); setSelected(null); setDone(next);
      if (willComplete) { onComplete && onComplete(); }
    }, correct ? 650 : 1100);
  };

  const caption = allDone
    ? { h: 'Workout complete! 🎉', s: 'All 4 challenges done — 360° BrainFit.' }
    : selected
      ? { h: `${questions[selected].tag} selected`, s: 'Tap START to begin this challenge.' }
      : { h: 'Your Daily Workout', s: 'Select a challenge and tap START to begin.' };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COL.bg} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: COL.bg }} />}

      {/* header */}
      <View style={s.header}>
        <View style={s.uwrap}>
          <View style={s.avatar}><Text style={{ fontSize: 18 }}>😉</Text></View>
          <View>
            <Text style={s.uname}>kjha<Text style={s.ugrade}> G12</Text></Text>
            <Text style={s.uxp}>+0</Text>
          </View>
        </View>
        <View style={s.stats}>
          <View style={s.boltPill}><Text style={{ fontSize: 11, letterSpacing: 1 }}>⚡⚡⚡</Text></View>
          <View style={s.badge}><Text style={{ fontSize: 12 }}>🏆</Text></View>
          <View style={[s.badge, s.badgeRed]}><Text style={s.badgeRedTxt}>0</Text></View>
        </View>
      </View>

      {/* wheel */}
      <View style={s.wheelWrap}>
        <View style={{ width: WHEEL_PX, height: WHEEL_PX }}>
          <Svg width={WHEEL_PX} height={WHEEL_PX} viewBox={`0 0 ${VB} ${VB}`}>
            <Defs>
              {labelArcs.map((l) => <Path key={l.id} id={l.id} d={l.d} />)}
            </Defs>

            {QUAD.map((q) => {
              const sel = selected === q.key, dn = done[q.key];
              const fill = sel ? COL.white : (dn ? COL.doneQuad : COL.idleQuad);
              return (
                <Path key={q.key} d={slice(q.a0, q.a1, R)} fill={fill} stroke="#000" strokeWidth={1.5}
                  onPress={() => selectQuad(q.key)} />
              );
            })}

            {/* outer ring: white when that quadrant is done */}
            {QUAD.map((q) => (
              <Path key={'r' + q.key} d={ringArc(q.a0 + 2, q.a1 - 2, R - 3)} fill="none"
                stroke={done[q.key] ? COL.white : '#2C2C30'} strokeWidth={4} strokeLinecap="round" />
            ))}

            {/* labels */}
            {QUAD.map((q) => {
              const sel = selected === q.key;
              if (q.key === 'reasoning') {
                const p = polar(RTEXT, 180);
                return (
                  <SvgText key="lbl-reasoning" x={p.x} y={p.y + 4} fill={sel ? COL.white : '#9a9aa0'}
                    fontSize={10} fontWeight="800" letterSpacing={2} textAnchor="middle">REASONING</SvgText>
                );
              }
              return (
                <SvgText key={'lbl-' + q.key} fill={sel ? COL.white : COL.sub}
                  fontSize={10} fontWeight="800" letterSpacing={2}>
                  <TextPath href={`#lp-${q.key}`} startOffset="50%" textAnchor="middle">{q.label}</TextPath>
                </SvgText>
              );
            })}
          </Svg>

          {/* challenge icons (absolute, over the svg) */}
          {QUAD.map((q) => {
            const p = polar(ICON_R, q.mid);
            const sel = selected === q.key, dn = done[q.key];
            const color = sel ? '#0E0E10' : (dn ? COL.white : '#cfcfd6');
            return (
              <View key={'ic-' + q.key} pointerEvents="none" style={[s.qIcon, {
                left: (p.x / VB) * WHEEL_PX, top: (p.y / VB) * WHEEL_PX,
              }]}>
                <Text style={{ color, fontSize: 18, fontWeight: '800' }}>{dn ? '✓' : q.icon}</Text>
              </View>
            );
          })}

          {/* centre button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={pressCenter}
            style={[s.center, allDone && s.centerDone, {
              left: WHEEL_PX / 2, top: WHEEL_PX / 2,
            }]}
          >
            <Text style={[s.centerTxt, allDone && { color: COL.white }]}>{allDone ? 'DONE' : 'START'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.capH}>{caption.h}</Text>
        <Text style={s.capS}>{caption.s}</Text>
      </View>

      {/* bottom tabs */}
      {showTabs && (
        <View style={s.tabs}>
          {[['practice', 'PRACTICE'], ['workout', 'WORKOUT'], ['arena', 'ARENA']].map(([k, l]) => (
            <TouchableOpacity key={k} style={[s.tab, k === 'workout' && s.tabOn]}
              activeOpacity={0.85} onPress={() => onExit && onExit(k)}>
              <Text style={[s.tabTxt, k === 'workout' && s.tabTxtOn]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* question sheet */}
      {activeQ && (
        <View style={s.qOverlay}>
          <View style={s.qCard}>
            <Text style={s.qTag}>{questions[activeQ].tag} challenge</Text>
            <Text style={s.qQ}>{questions[activeQ].q}</Text>
            {questions[activeQ].opts.map((o, i) => {
              const isAns = i === questions[activeQ].ans;
              let style = [s.opt];
              if (picked !== null) {
                if (i === picked && isAns) style = [s.opt, s.optRight];
                else if (i === picked && !isAns) style = [s.opt, s.optWrong];
                else if (isAns) style = [s.opt, s.optRight];
              }
              const txtCol = (picked !== null && (i === picked && isAns)) || (picked !== null && isAns)
                ? '#fff' : '#1C1C1E';
              return (
                <TouchableOpacity key={i} style={style} activeOpacity={0.9} onPress={() => answer(i)}>
                  <Text style={[s.optTxt, { color: txtCol }]}>{o}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity onPress={() => { setActiveQ(null); setPicked(null); }}>
              <Text style={s.qSkip}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COL.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  uwrap: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#9b8cf5', alignItems: 'center', justifyContent: 'center' },
  uname: { color: '#fff', fontWeight: '900', fontSize: 14 },
  ugrade: { color: COL.sub, fontSize: 9, fontWeight: '800' },
  uxp: { color: '#34D399', fontSize: 11, fontWeight: '800' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  boltPill: { borderWidth: 1.4, borderColor: '#3A3A1E', backgroundColor: '#1E1B0E', borderRadius: 13, paddingHorizontal: 9, paddingVertical: 5 },
  badge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#161619', borderWidth: 1.4, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  badgeRed: { backgroundColor: '#7A1F1F', borderColor: '#7A1F1F' },
  badgeRedTxt: { color: '#fff', fontWeight: '900', fontSize: 12 },

  wheelWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qIcon: { position: 'absolute', width: 24, height: 24, marginLeft: -12, marginTop: -12, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', width: 96, height: 96, marginLeft: -48, marginTop: -48, borderRadius: 48, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#fff', shadowOpacity: 0.18, shadowRadius: 16, elevation: 6 },
  centerDone: { backgroundColor: '#2A2A2E', shadowOpacity: 0 },
  centerTxt: { color: '#0E0E10', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  capH: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 22 },
  capS: { color: '#9a9aa0', fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center', maxWidth: 240, lineHeight: 18 },

  tabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingBottom: Platform.OS === 'ios' ? 8 : 18, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 13 },
  tabOn: { borderWidth: 1.5, borderColor: '#fff' },
  tabTxt: { color: COL.txtIdle, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  tabTxtOn: { color: '#fff' },

  qOverlay: { position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  qCard: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 26 },
  qTag: { fontSize: 10, fontWeight: '900', letterSpacing: 1, color: '#8E8E93', textTransform: 'uppercase' },
  qQ: { fontSize: 19, fontWeight: '800', color: '#1C1C1E', marginTop: 8, marginBottom: 16, letterSpacing: -0.3 },
  opt: { borderWidth: 1.5, borderColor: '#E5E5E8', borderRadius: 14, padding: 14, marginBottom: 10 },
  optRight: { backgroundColor: '#0E0E10', borderColor: '#0E0E10' },
  optWrong: { backgroundColor: '#F4D4D4', borderColor: '#E0A0A0' },
  optTxt: { fontSize: 15, fontWeight: '700' },
  qSkip: { textAlign: 'center', color: '#8E8E93', fontSize: 12, fontWeight: '700', marginTop: 4 },
});

export default ChallengeWheel;