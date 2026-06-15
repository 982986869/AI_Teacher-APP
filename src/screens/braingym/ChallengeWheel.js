// src/screens/braingym/ChallengeWheel.js
// Black & white 4-quadrant daily-workout wheel with a NUMPAD quiz per quadrant.
//   pick quadrant -> START -> numpad question (B&W) -> SUBMIT -> quadrant fills white
//   finish all 4 -> "All Done!" -> onComplete()
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform,
  TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Path, Text as SvgText, TextPath, Defs } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_PX = Math.min(SCREEN_W - 50, 300);

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

// Each quadrant is a mini-set of 4 numeric questions. Edit freely.
const DEFAULT_Q = {
  understanding: {
    tag: 'Understanding',
    items: [
      { q: 'What is the value of 2³?',                 a: '8' },
      { q: 'What is 5²?',                              a: '25' },
      { q: 'What is the value of 10⁰?',               a: '1' },
      { q: 'What is 3³?',                              a: '27' },
    ],
  },
  fluency: {
    tag: 'Fluency',
    items: [
      { q: 'How many terms are in 6x + 8?',           a: '2' },
      { q: 'Simplify: 4 + 5 × 2',                     a: '14' },
      { q: 'What is 9 × 7?',                           a: '63' },
      { q: 'What is 100 ÷ 4?',                         a: '25' },
    ],
  },
  reasoning: {
    tag: 'Reasoning',
    items: [
      { q: 'If 2ˣ = 8, then x = ?',                   a: '3' },
      { q: 'If 3x = 12, then x = ?',                  a: '4' },
      { q: 'Next number: 2, 4, 8, 16, ?',            a: '32' },
      { q: 'If x + 7 = 15, then x = ?',              a: '8' },
    ],
  },
  application: {
    tag: 'Application',
    items: [
      { q: 'A cell doubles each hour. After 3 hours ×?', a: '8' },
      { q: '15% of 200 = ?',                            a: '30' },
      { q: 'A car goes 60 km/h. In 2 hours, km?',       a: '120' },
      { q: 'Rectangle 5 × 4. Area = ?',                 a: '20' },
    ],
  },
};

const COL = { bg: '#0E0E10', idleQuad: '#16161A', doneQuad: '#202024', sub: '#8E8E93', txtIdle: '#7C7C82', white: '#fff' };

const KEYS = [['.', '-', '', '', 'del'], ['1', '2', '3', '4', '5'], ['6', '7', '8', '9', '0']];

// ── Numpad quiz overlay: runs a SET of questions, then "All Done!" ───────────
const NumpadQuiz = ({ tag, items, perSeconds = 30, onFinish, onClose }) => {
  const list = Array.isArray(items) && items.length ? items : [{ q: '—', a: '' }];

  const [idx, setIdx]   = useState(0);
  const [val, setVal]   = useState('');
  const [left, setLeft] = useState(perSeconds);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  // per-question countdown
  useEffect(() => {
    if (done) return;
    if (left <= 0) { goNext(false); return; }
    const t = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [left, done]);

  // when the whole set is done, hand back after showing All Done!
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => onFinish && onFinish({ correct, total: list.length }), 1500);
    return () => clearTimeout(t);
  }, [done]);

  const goNext = (wasCorrect) => {
    if (wasCorrect) setCorrect((c) => c + 1);
    if (idx + 1 >= list.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setVal('');
      setLeft(perSeconds);
    }
  };

  const press = (k) => {
    if (!k) return;
    if (k === 'del') setVal((a) => a.slice(0, -1));
    else setVal((a) => (a.length < 8 ? a + k : a));
  };
  const submit = () => {
    if (!val) return;
    goNext(val.trim() === String(list[idx].a));
  };

  // All Done! for this quadrant
  if (done) {
    return (
      <View style={[q2.fill, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <Text style={q2.allDone}>All Done!</Text>
        <Text style={q2.allDoneSub}>{correct} / {list.length} correct</Text>
      </View>
    );
  }

  const cur = list[idx];
  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const setProgress = list.length ? idx / list.length : 0;

  return (
    <View style={q2.fill}>
      {/* faint grid for the "template" look (B&W) */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={'v' + i} style={[q2.gridV, { left: `${(i + 1) * 10}%` }]} />
        ))}
        {Array.from({ length: 16 }).map((_, i) => (
          <View key={'h' + i} style={[q2.gridH, { top: `${(i + 1) * 6}%` }]} />
        ))}
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={q2.top}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={q2.x}>✕</Text>
          </TouchableOpacity>
          <Text style={q2.timer}>{mmss}</Text>
        </View>
        <View style={q2.progressBg}><View style={[q2.progressFill, { width: `${setProgress * 100}%` }]} /></View>

        <Text style={q2.tag}>{tag} · {idx + 1}/{list.length}</Text>
        <View style={q2.qWrap}><Text style={q2.q}>{cur.q}</Text></View>

        <View style={q2.bottom}>
          <View style={q2.answerBox}>
            <Text style={[q2.answerTxt, !val && q2.placeholder]}>{val || 'Enter Answer...'}</Text>
          </View>

          <View style={q2.pad}>
            {KEYS.map((row, ri) => (
              <View key={ri} style={q2.padRow}>
                {row.map((k, ki) =>
                  k === '' ? <View key={'sp' + ki} style={q2.keySpacer} />
                    : (
                      <TouchableOpacity key={k} style={q2.key} activeOpacity={0.7} onPress={() => press(k)}>
                        <Text style={q2.keyTxt}>{k === 'del' ? '⌫' : k}</Text>
                      </TouchableOpacity>
                    )
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity style={q2.submit} activeOpacity={0.85} onPress={submit}>
            <Text style={q2.submitTxt}>SUBMIT</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

// ── Wheel ────────────────────────────────────────────────────────────────────
const ChallengeWheel = ({ questions = DEFAULT_Q, onComplete, onExit, showTabs = true }) => {
  const [done, setDone]         = useState({});
  const [selected, setSelected] = useState(null);
  const [activeQ, setActiveQ]   = useState(null);
  const [finished, setFinished] = useState(false);

  const allDone = QUAD.every((q) => done[q.key]);

  const labelArcs = useMemo(() => QUAD
    .filter((q) => q.key !== 'reasoning')
    .map((q) => ({ id: `lp-${q.key}`, d: ringArc(q.a0 + 10, q.a1 - 10, RTEXT) })), []);

  const selectQuad = (key) => { if (!done[key]) setSelected(key); };

  const pressCenter = () => {
    if (allDone || !selected) return;
    setActiveQ(selected);
  };

  const handleSubmit = () => {
    const next = { ...done, [activeQ]: true };
    setDone(next);
    setActiveQ(null);
    setSelected(null);
    if (QUAD.every((q) => next[q.key])) {
      setFinished(true);
      setTimeout(() => onComplete && onComplete(), 1600);
    }
  };

  // ── All Done! ──
  if (finished) {
    return (
      <SafeAreaView style={[s.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COL.bg} />
        <Text style={s.allDone}>All Done!</Text>
      </SafeAreaView>
    );
  }

  // ── Numpad quiz open (a 4-question set for the chosen quadrant) ──
  if (activeQ) {
    const Q = questions[activeQ] || DEFAULT_Q[activeQ];
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <NumpadQuiz
          tag={Q.tag}
          items={Q.items}
          perSeconds={30}
          onFinish={handleSubmit}
          onClose={() => { setActiveQ(null); }}
        />
      </SafeAreaView>
    );
  }

  const caption = allDone
    ? { h: 'Workout complete! 🎉', s: 'All 4 challenges done — 360° BrainFit.' }
    : selected
      ? { h: `${(questions[selected] || DEFAULT_Q[selected]).tag} selected`, s: 'Tap START to begin this challenge.' }
      : { h: 'Your Daily Workout', s: 'Select a challenge and tap START to begin.' };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COL.bg} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: COL.bg }} />}

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

      <View style={s.wheelWrap}>
        <View style={{ width: WHEEL_PX, height: WHEEL_PX }}>
          <Svg width={WHEEL_PX} height={WHEEL_PX} viewBox={`0 0 ${VB} ${VB}`}>
            <Defs>{labelArcs.map((l) => <Path key={l.id} id={l.id} d={l.d} />)}</Defs>

            {QUAD.map((q) => {
              const sel = selected === q.key, dn = done[q.key];
              const fill = sel ? COL.white : (dn ? COL.doneQuad : COL.idleQuad);
              return <Path key={q.key} d={slice(q.a0, q.a1, R)} fill={fill} stroke="#000" strokeWidth={1.5} onPress={() => selectQuad(q.key)} />;
            })}

            {QUAD.map((q) => (
              <Path key={'r' + q.key} d={ringArc(q.a0 + 2, q.a1 - 2, R - 3)} fill="none"
                stroke={done[q.key] ? COL.white : '#2C2C30'} strokeWidth={4} strokeLinecap="round" />
            ))}

            {QUAD.map((q) => {
              const sel = selected === q.key;
              if (q.key === 'reasoning') {
                const p = polar(RTEXT, 180);
                return <SvgText key="lbl-reasoning" x={p.x} y={p.y + 4} fill={sel ? COL.white : '#9a9aa0'} fontSize={10} fontWeight="800" letterSpacing={2} textAnchor="middle">REASONING</SvgText>;
              }
              return (
                <SvgText key={'lbl-' + q.key} fill={sel ? COL.white : COL.sub} fontSize={10} fontWeight="800" letterSpacing={2}>
                  <TextPath href={`#lp-${q.key}`} xlinkHref={`#lp-${q.key}`} startOffset="50%" textAnchor="middle">{q.label}</TextPath>
                </SvgText>
              );
            })}
          </Svg>

          {QUAD.map((q) => {
            const p = polar(ICON_R, q.mid);
            const sel = selected === q.key, dn = done[q.key];
            const color = sel ? '#0E0E10' : (dn ? COL.white : '#cfcfd6');
            return (
              <View key={'ic-' + q.key} pointerEvents="none" style={[s.qIcon, { left: (p.x / VB) * WHEEL_PX, top: (p.y / VB) * WHEEL_PX }]}>
                <Text style={{ color, fontSize: 18, fontWeight: '800' }}>{dn ? '✓' : q.icon}</Text>
              </View>
            );
          })}

          <TouchableOpacity activeOpacity={0.85} onPress={pressCenter}
            style={[s.center, allDone && s.centerDone, { left: WHEEL_PX / 2, top: WHEEL_PX / 2 }]}>
            <Text style={[s.centerTxt, allDone && { color: COL.white }]}>{allDone ? 'DONE' : 'START'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.capH}>{caption.h}</Text>
        <Text style={s.capS}>{caption.s}</Text>
      </View>

      {showTabs && (
        <View style={s.tabs}>
          {[['practice', 'PRACTICE'], ['workout', 'WORKOUT'], ['arena', 'ARENA']].map(([k, l]) => (
            <TouchableOpacity key={k} style={[s.tab, k === 'workout' && s.tabOn]} activeOpacity={0.85} onPress={() => onExit && onExit(k)}>
              <Text style={[s.tabTxt, k === 'workout' && s.tabTxtOn]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COL.bg },
  allDone: { fontSize: 30, fontWeight: '900', color: '#34D399' },

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
});

const q2 = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0a0a0a' },
  allDone: { fontSize: 30, fontWeight: '900', color: '#34D399' },
  allDoneSub: { fontSize: 14, color: '#8E8E93', fontWeight: '700', marginTop: 10 },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10 },
  x: { color: '#fff', fontSize: 22, fontWeight: '700' },
  timer: { color: '#fff', fontSize: 20, fontWeight: '800' },
  progressBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 22, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: '#fff', borderRadius: 2 },

  tag: { color: '#8E8E93', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', marginTop: 24 },
  qWrap: { paddingHorizontal: 28, paddingTop: 12 },
  q: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 32 },

  bottom: { marginTop: 'auto', paddingHorizontal: 22, paddingBottom: 8 },
  answerBox: { height: 58, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  answerTxt: { fontSize: 20, fontWeight: '800', color: '#fff' },
  placeholder: { color: 'rgba(255,255,255,0.45)', fontWeight: '600' },

  pad: { gap: 14, marginBottom: 14 },
  padRow: { flexDirection: 'row', justifyContent: 'space-between' },
  key: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  keySpacer: { width: 56, height: 56 },
  keyTxt: { color: '#fff', fontSize: 20, fontWeight: '700' },

  submit: { height: 56, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  submitTxt: { color: '#0a0a0a', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});

export default ChallengeWheel;