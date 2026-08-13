// OnlineTestScreen.js
// Full Online-Test flow (DB-backed, class_level=7):
//   subjects → chapters (test counts) → tests → INSTRUCTIONS → timed RUNNER →
//   RESULT (donut + bar charts) → REVIEW (per-question solutions).
//
// Questions come from onlineTestApi.getOnlineTest:
//   { id, name, instructionHtml, durationMin, totalMarks, questions:[{ id, text,
//     options:[{key,label,optionId}], correctOptionId, correctAnswer, explanation, marks }] }
// The correct answer travels with the payload, so grading + review are client-side.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, Image, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator, Animated, Easing, Pressable,
} from 'react-native';
import { S } from '../theme/studentUI';
import { FONT } from '../constants/fonts';
import { Clock, CircleHelp, Award, BookOpen, ChevronDown } from 'lucide-react-native';
import Svg, { Circle, G, Rect, Line, Text as RNSvgText, Defs, RadialGradient, Stop } from 'react-native-svg';
import MathText from '../components/MathText';
import { hasMath, htmlToPlain, firstImg, stripImages } from '../utils/mathHtml';
import {
  TT, TimedTestFrame, TTConfirmDialog, TTPalette,
} from '../components/timedTestDark';
import { useAuth } from '../context/AuthContext';
import { getOnlineTestChapters, getOnlineTests, getOnlineTest, submitOnlineTest } from '../api/onlineTestApi';
import { useClassSubjects, toTile } from '../utils/classSubjects';
import { getOnlineTestAttempts, saveOnlineTestAttempt } from '../utils/storage';
import { TK, ScreenHeader, FilterTabs, SubjectRow, ChapterRow, TestCard } from '../components/testCardKit';

// Soft subject tints for the card list (cycled by index).
const TILES = ['#E1F5F3', '#FCEBDD', '#E9EBFB', '#E7F3E4', '#FBE9F0', '#EAF0FB', '#FCEFD6', '#E6F7F1'];

const classNum = (c) => parseInt(String(c || '').replace(/\D/g, ''), 10) || null;
const slugify = (s) => {
  // Normalize dashes/curly-quotes to ASCII so a stray em-dash doesn't count as
  // non-ASCII; then, if real Devanagari remains, append a stable hash so
  // Devanagari-heavy names whose only ASCII is a marker like "(R1)" stay unique.
  const str = String(s).replace(/[\u2013\u2014\u00AD\u2011]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  const base = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (base && !/[^\x00-\x7F]/.test(str)) return base;
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  const hash = 'u' + h.toString(36);
  return base ? base + '-' + hash : hash;
};

const C = {
  bg: '#F4F5FB', white: '#fff', text: S.ink, muted: S.muted,
  primary: '#534AB7', primaryLight: '#EEEDFE', border: S.hair,
  green: '#22B07A', greenBg: '#E7F7EC', red: '#F0564B', redBg: '#FDECEC',
  amber: '#F5A623', amberBg: '#FFF4E0', blue: '#4AA8F0', grey: S.faint,
};

// Subjects that have online tests, per class (must slugify to the seeded slug).
// Class 8's Science (Curiosity) has no online tests, so only the OLD subjects appear.
const SUBJECTS_BY_CLASS = {
  7: [
    { name: 'Science (Curiosity)', emoji: '🔬', bg: '#0F8A5F' },
    { name: 'Old - Social Sc',     emoji: '🏛️', bg: '#8A5A2B' },
    { name: 'Old - Maths',         emoji: '➗', bg: '#0F6E56' },
    { name: 'Old - हिंदी',          emoji: '📚', bg: '#2F80ED' },
  ],
  8: [
    { name: 'Old - Science',   emoji: '⚗️', bg: '#5AA84F' },
    { name: 'Old - Social Sc', emoji: '🏛️', bg: '#8A5A2B' },
    { name: 'Old - Maths',     emoji: '➗', bg: '#0F6E56' },
  ],
  9: [
    { name: 'Maths (Ganita Manjari)',     emoji: '📐', bg: '#0C8F88' },
    { name: 'Computer Applications (165)', emoji: '💻', bg: S.ink },
    { name: 'JSTSE Scholarship',           emoji: '🏆', bg: '#B0306B' },
    { name: 'Old - Maths',            emoji: '➗', bg: '#0F6E56' },
    { name: 'Old - Science',          emoji: '⚗️', bg: '#5AA84F' },
    { name: 'Old - Social Sc',        emoji: '🏛️', bg: '#8A5A2B' },
  ],
};
const subjectsForClass = (classLevel) => SUBJECTS_BY_CLASS[classLevel] || SUBJECTS_BY_CLASS[7];

// Renders real math via MathText and everything else as Text. Both paths run the
// HTML through mathHtml, so <sup>/<sub> and the server-flattened caret notation
// ([ML^(5)T^(-2)]) become real characters instead of raw markup.
//
// Diagrams keep a white plate: the source images are black line art, so on the
// runner's #0C0936 canvas they would otherwise be invisible.
function Rich({ value, fontSize = 15, lineHeight, color = C.text, family, imgHeight = 150 }) {
  if (value == null || !String(value).trim()) return null;
  const raw = String(value);
  const img = firstImg(raw);
  const textPart = stripImages(raw);
  const isMath = hasMath(textPart);
  const plain = isMath ? '' : htmlToPlain(textPart);
  const hasText = isMath ? !!textPart.trim() : plain.length > 0;
  const lh = lineHeight || fontSize * 1.45;
  const body = isMath
    ? <MathText value={textPart} fontSize={fontSize} color={color} textStyle={{ fontFamily: family, lineHeight: lh }} />
    : <Text style={{ fontSize, color, fontFamily: family, lineHeight: lh }}>{plain}</Text>;
  if (!img) return body;
  return (
    <View>
      {hasText ? body : null}
      <Image source={{ uri: img }} style={{ width: '100%', height: imgHeight, marginTop: hasText ? 8 : 0, borderRadius: 8, backgroundColor: '#fff' }} resizeMode="contain" />
    </View>
  );
}

// ─── Donut chart (segments = [{ value, color }]) ──────────────────────────────
function Donut({ segments, size = 190, stroke = 30, center }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.border} strokeWidth={stroke} fill="none" />
          {segments.map((s, i) => {
            const len = (s.value / total) * circ;
            const el = (
              <Circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={s.color} strokeWidth={stroke}
                fill="none" strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-acc} strokeLinecap="butt" />
            );
            acc += len;
            return el;
          })}
        </G>
      </Svg>
      {!!center && <View style={{ position: 'absolute', alignItems: 'center' }}>{center}</View>}
    </View>
  );
}

// ─── Time-per-question bar chart ──────────────────────────────────────────────
function TimeBars({ data }) {
  // data = [{ time, color }]; width scrolls if many questions.
  const H = 170, barW = 16, gap = 10, padL = 30, padB = 22, padT = 10;
  const maxT = Math.max(5, ...data.map((d) => d.time));
  const chartH = H - padB - padT;
  const width = padL + data.length * (barW + gap) + 10;
  const ticks = 4;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={width} height={H}>
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const y = padT + (chartH * i) / ticks;
          const val = Math.round(maxT - (maxT * i) / ticks);
          return (
            <G key={i}>
              <Line x1={padL} y1={y} x2={width - 6} y2={y} stroke={C.border} strokeWidth={1} />
              <SvgText x={padL - 6} y={y + 3} val={val} />
            </G>
          );
        })}
        {data.map((d, i) => {
          const h = Math.max(2, (d.time / maxT) * chartH);
          const x = padL + i * (barW + gap);
          const y = padT + chartH - h;
          return (
            <G key={i}>
              <Rect x={x} y={y} width={barW} height={h} rx={3} fill={d.color} />
              <SvgText x={x + barW / 2} y={H - 8} val={i + 1} anchor="middle" />
            </G>
          );
        })}
      </Svg>
    </ScrollView>
  );
}
// tiny SVG text helper (react-native-svg Text)
function SvgText({ x, y, val, anchor = 'end' }) {
  return <RNSvgText x={x} y={y} fontSize={9} fill={C.muted} textAnchor={anchor}>{String(val)}</RNSvgText>;
}

function LegendDot({ color, label }) {
  return (
    <View style={st.legendItem}>
      <View style={[st.dot, { backgroundColor: color }]} />
      <Text style={st.legendTxt}>{label}</Text>
    </View>
  );
}

function Header({ onBack, title }) {
  return (
    <View style={st.header}>
      <TouchableOpacity onPress={onBack} hitSlop={10}><Text style={st.back}>← Back</Text></TouchableOpacity>
      <Text style={st.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 48 }} />
    </View>
  );
}

export default function OnlineTestScreen({ onExit = () => {} }) {
  const { selectedClass } = useAuth();
  const classLevel = classNum(selectedClass) || 7;
  // Class 6 & 9 online-test subjects are DB-driven (online flag); other classes keep theirs.
  const isDyn = [6, 9].includes(classLevel);
  const dynSubs = useClassSubjects(classLevel, isDyn);
  const subjectList = isDyn ? (dynSubs || []).filter((s) => s.online).map((s) => toTile(s)) : subjectsForClass(classLevel);

  const [view, setView] = useState('subjects'); // subjects|chapters|tests|instruction|running|result|review
  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [tests, setTests] = useState(null);
  const [test, setTest] = useState(null);       // full test payload
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('all');        // tests view: 'all' | 'attempted'
  const [attempts, setAttempts] = useState({}); // local attempt records for this class

  const back = () => {
    if (view === 'review') setView('result');
    else if (view === 'result') setView('tests');
    else if (view === 'running') setView('instruction');
    else if (view === 'instruction') setView('tests');
    else if (view === 'tests') setView('chapters');
    else if (view === 'chapters') setView('subjects');
    else onExit();
  };

  // ── load chapters when a subject is picked ──
  // Prefer the tile's DB slug (from the class-subjects endpoint) over re-deriving
  // it — the client slugify appends a Devanagari hash for names like 'Old - हिंदी'
  // (→ "old-u…") that would not match the seeded slug ("old").
  const subjSlug = (s) => (s && s.slug) || slugify(s.name);
  const openSubject = async (s) => {
    setSubject(s); setView('chapters'); setChapters(null);
    try { setChapters(await getOnlineTestChapters(subjSlug(s), classLevel)); }
    catch { setChapters([]); }
  };
  const openChapter = async (ch) => {
    setChapter(ch); setView('tests'); setTests(null); setTab('all');
    try { setTests(await getOnlineTests(subjSlug(subject), ch.slug, classLevel)); }
    catch { setTests([]); }
  };
  const openTest = async (t) => {
    setLoading(true);
    try {
      const data = await getOnlineTest(t.id);
      setTest(data); setView('instruction');
    } catch { setTest(null); } finally { setLoading(false); }
  };

  const attemptKey = (t) => `${classLevel}:${subject ? subjSlug(subject) : ''}:${chapter ? chapter.slug : ''}:${t.id}`;

  const onFinish = (res) => {
    setResult(res); setView('result');
    // Record the attempt locally so the tests list can show "Completed" + score.
    if (subject && chapter && test) {
      const total = (test.totalMarks != null ? test.totalMarks : res.total) || res.total || 0;
      const score = res.score != null ? res.score : res.correct;
      const percent = total ? Math.round((score / total) * 100) : 0;
      saveOnlineTestAttempt(attemptKey(test), { score, total, percent, date: new Date().toISOString() });
    }
    // Also record it server-side so it reaches the parent's progress view. The server
    // re-grades from its own answer key. Fire-and-forget: the local record above is
    // what this screen reads, so a failed sync must never change what the student sees.
    if (test && res.answers && Object.keys(res.answers).length) {
      submitOnlineTest(test.id, { answers: res.answers, timeTakenSec: res.timeTakenSec || 0 })
        .catch(() => {});
    }
  };

  // (Re)load local attempt records whenever the tests list is shown.
  useEffect(() => {
    if (view !== 'tests') return undefined;
    let alive = true;
    getOnlineTestAttempts(classLevel).then((a) => { if (alive) setAttempts(a || {}); }).catch(() => {});
    return () => { alive = false; };
  }, [view, classLevel]);

  // The runner is the only stage on the dark canvas, so the shared shell (and the
  // status bar sitting on it) flips with it rather than each stage owning a page.
  const dark = view === 'running';

  return (
    <SafeAreaView style={[st.safe, dark && { backgroundColor: TT.canvas }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={dark ? TT.canvas : C.white} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: dark ? TT.canvas : C.white }} />}

      {view === 'subjects' && (
        <>
          <ScreenHeader title="Online Tests" subtitle="Pick a subject, then a chapter" onBack={onExit} />
          <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {subjectList.length === 0 && <Empty title="No subjects yet" sub="No online-test subjects for this class yet." />}
            {subjectList.map((sub, i) => (
              <SubjectRow key={sub.name} emoji={sub.emoji} tile={TILES[i % TILES.length]} name={sub.name} sub="Chapter-wise timed tests" onPress={() => openSubject(sub)} />
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </>
      )}

      {view === 'chapters' && (
        <>
          <ScreenHeader title={subject?.name || 'Chapters'} subtitle="Pick a chapter to see its tests" onBack={back} />
          {chapters == null ? <Center><ActivityIndicator color={TK.mint} /></Center> : (
            <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {chapters.length === 0 && <Empty title="No online tests" sub="No tests have been added for this subject yet." />}
              {chapters.map((ch, i) => (
                <ChapterRow key={ch.slug} index={i + 1} name={ch.name} sub={`${ch.testCount} test${ch.testCount > 1 ? 's' : ''}`} onPress={() => openChapter(ch)} />
              ))}
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </>
      )}

      {view === 'tests' && (() => {
        const list = tests || [];
        const attemptFor = (t) => attempts[attemptKey(t)];
        const attemptedCount = list.filter(attemptFor).length;
        const shown = list.filter((t) => tab !== 'attempted' || attemptFor(t));
        return (
          <>
            <ScreenHeader title={chapter?.name || 'Tests'} subtitle={subject?.name} onBack={back} />
            {tests != null && (
              <FilterTabs tab={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: list.length }, { id: 'attempted', label: 'Attempted', count: attemptedCount }]} />
            )}
            {tests == null ? <Center><ActivityIndicator color={TK.mint} /></Center> : (
              <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                {shown.length === 0 && <Empty title={tab === 'attempted' ? 'No attempted tests' : 'No tests'} sub={tab === 'attempted' ? 'You have not attempted any test here yet.' : 'No tests here yet.'} />}
                {shown.map((t) => {
                  const att = attemptFor(t);
                  const done = !!att;
                  const pct = done ? Math.round(att.percent || 0) : null;
                  return (
                    <TestCard
                      key={t.id}
                      done={done}
                      title={t.name}
                      metas={[`\u{1F4DD} ${t.questionCount} questions`, `⏱ ${t.durationMin} min`]}
                      scoreText={done ? `${att.score}/${att.total}` : null}
                      scorePct={pct}
                      actionLabel={done ? 'Retake' : 'Attempt'}
                      onPress={() => openTest(t)}
                      disabled={loading}
                    />
                  );
                })}
                <View style={{ height: 24 }} />
              </ScrollView>
            )}
            {loading && <View style={st.loadingOverlay}><ActivityIndicator color={TK.mint} size="large" /></View>}
          </>
        );
      })()}

      {view === 'instruction' && test && (
        <Instruction test={test} onBack={back} onStart={() => setView('running')} />
      )}

      {view === 'running' && test && (
        <Runner test={test} subject={subject} chapter={chapter} onBack={back} onFinish={onFinish} />
      )}

      {view === 'result' && result && (
        <Result test={test} result={result} onBack={() => setView('tests')}
          onReview={() => setView('review')} onRetake={() => setView('running')} onMore={() => setView('tests')} />
      )}

      {view === 'review' && result && (
        <Review test={test} result={result} onBack={() => setView('result')} />
      )}
    </SafeAreaView>
  );
}

// ─── Instruction page ─────────────────────────────────────────────────────────
// Built on TT (the timed-test dark tokens), not this file's light `C`, so the
// briefing and the runner it launches read as one flow rather than two products.
// The default rules below are only a fallback — a test that ships its own
// instructionHtml always wins.
const DEFAULT_RULES = [
  'Ensure stable connectivity before launching. Once initiated, the countdown cannot be paused.',
  'Each question has one correct answer. Save your choice to commit progress.',
  'All questions are compulsory and carry equal marks.',
  'You can move freely between questions until you submit.',
  'The test submits itself automatically when the timer reaches zero.',
];

// Fade + rise, delayed. The briefing's elements arrive in reading order rather
// than as one slab, so the eye is walked down to the CTA.
function Rise({ delay = 0, y = 14, style, children }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a, delay]);
  return (
    <Animated.View style={[style, {
      opacity: a,
      transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

// The orb: a saturated core inside a wide soft bloom. Two radial gradients rather
// than a blurred image, so it stays crisp at any density and ships no asset.
// It breathes and drifts — the only ambient motion on the page, which is what
// makes it read as a light source rather than a sticker.
function HeroOrb({ size = 190 }) {
  const c = size / 2;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  return (
    <Animated.View style={{
      opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }),
      transform: [
        { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.05] }) },
        { translateY: breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
      ],
    }}>
      <OrbArt size={size} c={c} />
    </Animated.View>
  );
}

function OrbArt({ size, c }) {
  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <RadialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0.35" stopColor="#FF7A45" stopOpacity="0.55" />
          <Stop offset="0.62" stopColor="#8B5CF6" stopOpacity="0.30" />
          <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="orbCore" cx="38%" cy="34%" r="72%">
          <Stop offset="0" stopColor="#FFB27A" />
          <Stop offset="0.55" stopColor="#F97445" />
          <Stop offset="1" stopColor="#E2542B" />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={c} fill="url(#orbGlow)" />
      <Circle cx={c} cy={c} r={size * 0.21} fill="url(#orbCore)" />
      {/* the slash, as in the frame */}
      <Line
        x1={c - size * 0.075} y1={c + size * 0.075}
        x2={c + size * 0.075} y2={c - size * 0.075}
        stroke="#FFD8C2" strokeOpacity={0.85} strokeWidth={3} strokeLinecap="round"
      />
    </Svg>
  );
}

// Pills pop rather than rise — they read as three discrete facts landing, not a
// paragraph arriving.
function StatPill({ Icon, label, delay = 0 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(a, { toValue: 1, delay, friction: 6, tension: 150, useNativeDriver: true }).start();
  }, [a, delay]);
  return (
    <Animated.View style={[st.statPill, {
      opacity: a,
      transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) }],
    }]}>
      <Icon size={17} color={TT.violet} strokeWidth={2.3} />
      <Text style={st.statPillTxt}>{label}</Text>
    </Animated.View>
  );
}

function Instruction({ test, onBack, onStart }) {
  const [open, setOpen] = useState(true);
  const spin = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const rules = useMemo(() => {
    if (!test.instructionHtml) return DEFAULT_RULES;
    // Server rules arrive as HTML; split them into lines so they can be counted
    // and laid out like the frame instead of dumped as one block.
    const plain = htmlToPlain(test.instructionHtml) || '';
    const lines = plain.split(/\n+|(?:•|·)\s*/).map((t) => t.trim()).filter((t) => t.length > 2);
    return lines.length ? lines : DEFAULT_RULES;
  }, [test.instructionHtml]);

  // shadowOpacity cannot run on the native driver, but this is one view pulsing
  // slowly — cheap enough, and the CTA is worth it.
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow]);

  useEffect(() => {
    Animated.timing(spin, { toValue: open ? 1 : 0, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [spin, open]);

  // LayoutAnimation is a no-op under the New Architecture (app.json → newArchEnabled),
  // so the reveal is driven explicitly instead: the body fades and slides in on open.
  const body = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!open) return;
    body.setValue(0);
    Animated.timing(body, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [body, open]);

  const toggle = () => setOpen((v) => !v);

  const to = (v) => Animated.spring(press, { toValue: v, friction: 7, tension: 180, useNativeDriver: true }).start();
  const marks = test.totalMarks != null ? test.totalMarks : test.questionCount;

  return (
    <View style={st.brief}>
      {/* The shared Header is a white bar — wrong here, and the frame has no title
          bar at all. A single dark back control keeps the exit without the chrome. */}
      <View style={st.briefTop}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back" style={st.briefBack}>
          <ChevronDown size={20} color={TT.ink} strokeWidth={2.5} style={{ transform: [{ rotate: '90deg' }] }} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={st.briefBody} showsVerticalScrollIndicator={false}>
        {/* brand */}
        <Rise delay={0} style={st.brandRow}>
          <View style={st.brandDot} />
          <Text style={st.brandTxt}>AiLernova</Text>
        </Rise>

        {/* title block — the orb sits behind/right of it */}
        <View style={st.titleRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Rise delay={70}><Text style={st.eyebrow}>ONLINE TEST · MCQ</Text></Rise>
            <Rise delay={130} y={18}><Text style={st.briefTitle}>{test.name}</Text></Rise>
            <Rise delay={210}>
              <Text style={st.briefSub}>
                {[test.subjectName, test.chapterName].filter(Boolean).join(' · ')}
              </Text>
            </Rise>
          </View>
          <View style={st.orbWrap} pointerEvents="none"><HeroOrb /></View>
        </View>

        {/* facts */}
        <View style={st.statRow}>
          <StatPill Icon={Clock} label={`${test.durationMin} Min`} delay={280} />
          <StatPill Icon={CircleHelp} label={`${test.questionCount} Qs`} delay={350} />
          <StatPill Icon={Award} label={`${marks} Marks`} delay={420} />
        </View>

        <Rise delay={480}>
          <Text style={st.markingLine}>
            Marking:  <Text style={st.markPos}>✓ +1 per correct</Text>
            <Text style={st.markNeg}>   ✗ –0 per wrong</Text>
          </Text>
        </Rise>

        {/* instructions */}
        <Rise delay={540}>
          <Pressable onPress={toggle} style={st.instrHead} accessibilityRole="button"
            accessibilityState={{ expanded: open }} accessibilityLabel={`Instructions, ${rules.length} rules`}>
            <BookOpen size={21} color={TT.violet} strokeWidth={2.3} />
            <Text style={st.instrHeadTxt}>Instructions · {rules.length} rules</Text>
            <Animated.View style={{
              transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) }],
            }}>
              <ChevronDown size={22} color={TT.sub} strokeWidth={2.2} />
            </Animated.View>
          </Pressable>
          <View style={st.instrRule} />
        </Rise>

        {open && (
          <Animated.View style={{
            opacity: body,
            transform: [{ translateY: body.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
          }}>
            {rules.map((r, i) => <Text key={i} style={st.instrPara}>{r}</Text>)}
          </Animated.View>
        )}
      </ScrollView>

      <View style={st.briefFooter}>
        {/* The CTA arrives last and keeps a slow glow — it is the only thing on the
            page you can act on, and the page is otherwise all reading. */}
        <Rise delay={620} y={20}>
          <Animated.View style={{
            transform: [{ scale: press }],
            shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] }),
            shadowColor: '#8B5CF6', shadowRadius: 22, shadowOffset: { width: 0, height: 10 },
          }}>
            <Pressable
              onPress={onStart}
              onPressIn={() => to(0.98)}
              onPressOut={() => to(1)}
              accessibilityRole="button"
              accessibilityLabel={`Start ${test.name}`}
              style={st.startBtn}
            >
              <Text style={st.startBtnTxt}>Start Test</Text>
            </Pressable>
          </Animated.View>
        </Rise>
      </View>
    </View>
  );
}

// ─── Test runner (timed, navigable, single submit) ───────────────────────────
function Runner({ test, subject, chapter, onBack, onFinish }) {
  const qs = test.questions || [];
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});       // questionId -> optionId
  const [palette, setPalette] = useState(false);    // hamburger sheet
  const [confirm, setConfirm] = useState(false);    // header Submit guard
  const [secs, setSecs] = useState((test.durationMin || 0) * 60 || qs.length * 60);
  const times = useRef(qs.map(() => 0));             // seconds per question
  const enter = useRef(Date.now());
  const timerRef = useRef(null);
  const submitRef = useRef(null);                    // always points at the latest submit()

  // Global countdown → auto-submit at 0. Calls submitRef so the timeout grades the
  // latest answers (not a stale first-render closure).
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecs((s) => { if (s <= 1) { clearInterval(timerRef.current); submitRef.current && submitRef.current(); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stampTime = () => {
    const dt = Math.round((Date.now() - enter.current) / 1000);
    times.current[idx] += Math.max(0, dt);
    enter.current = Date.now();
  };
  const goto = (n) => { stampTime(); setIdx(n); };
  const pick = (optionId) => setAnswers((a) => ({ ...a, [qs[idx].id]: optionId }));

  const submit = () => {
    clearInterval(timerRef.current);
    stampTime();
    let correct = 0, incorrect = 0, unanswered = 0, score = 0;
    const perQ = qs.map((q, i) => {
      const sel = answers[q.id];
      let status;
      if (sel == null) { unanswered++; status = 'unanswered'; }
      else if (String(sel) === String(q.correctOptionId)) { correct++; score += q.marks || 1; status = 'correct'; }
      else { incorrect++; status = 'incorrect'; }
      return { id: q.id, selected: sel ?? null, status, time: times.current[i] || 0 };
    });
    const timeTakenSec = times.current.reduce((n, t) => n + (t || 0), 0);
    onFinish({ correct, incorrect, unanswered, total: qs.length, score, perQ, answers, timeTakenSec });
  };
  submitRef.current = submit;

  const q = qs[idx];
  const answeredCount = Object.keys(answers).length;
  const low = secs <= 60;
  const marks = q && q.marks != null ? q.marks : null;

  // `context-banner` — "Physics • Units and Measurements — Test 1". The frame's
  // trailing "• attempt the questions" is instruction copy, not data, so it is
  // dropped rather than hard-coded under a real subject and chapter.
  const context = [subject && subject.name, chapter && chapter.name]
    .filter(Boolean).join(' • ') + (test.name ? ` — ${test.name}` : '');

  const clear = () => setAnswers((a) => { const next = { ...a }; delete next[q.id]; return next; });

  return (
    <TimedTestFrame
      onClose={onBack}
      secondsLeft={secs}
      progressText={`${idx + 1} / ${qs.length}`}
      // These tests carry no A/B/C sections, so the frame's `section-badge` slot
      // takes the one per-question fact worth that space in a timed paper.
      badgeText={marks != null ? `${marks} Mark${marks === 1 ? '' : 's'}` : null}
      bannerText={context}
      questionHtml={q.text}
      options={(q.options || []).map((o) => ({ id: o.optionId, key: o.key, label: o.label }))}
      selectedId={answers[q.id]}
      onSelect={pick}
      onClear={answers[q.id] != null ? clear : null}
      onPrev={() => goto(idx - 1)}
      prevDisabled={idx === 0}
      onMenu={() => setPalette(true)}
      onNext={() => goto(idx + 1)}
      nextDisabled={idx + 1 >= qs.length}
    >
      {/* The palette — a full screen, and where Submit lives now that the header is
          Exit · progress · timer only. This is the ONLY submit path for these tests:
          Next is disabled on the last question, so losing it would strand the student.
          These papers carry no A/B/C sections, so it renders as one untitled group. */}
      <TTPalette
        visible={palette}
        onClose={onBack}
        secondsLeft={secs}
        progressText={`${idx + 1} / ${qs.length}`}
        groups={[{
          id: 'all',
          items: qs.map((qq, i) => ({
            key: qq.id, label: i + 1, answered: answers[qq.id] != null, current: i === idx,
          })),
        }]}
        onPick={(_g, i) => { goto(i); setPalette(false); }}
        onFinish={() => { setPalette(false); setConfirm(true); }}
        onBack={() => setPalette(false)}
      />

      {/* `finish-test-dialog-dark`. Submit moved into the header, where it is
          reachable from every question — so it needs a guard the old "Submit on the
          last question" didn't. Same wording as the offline-bank runner's. */}
      <TTConfirmDialog
        visible={confirm}
        title="Finish Test?"
        body={`You've answered ${answeredCount} of ${qs.length} questions.${answeredCount < qs.length ? ' Unanswered questions will be marked as skipped.' : ''}`}
        confirmLabel="Finish Test"
        onConfirm={() => { setConfirm(false); submit(); }}
        onCancel={() => setConfirm(false)}
      />
    </TimedTestFrame>
  );
}

// ─── Result page (donuts + performance bars) ─────────────────────────────────
function Result({ test, result, onBack, onReview, onRetake, onMore }) {
  const { correct, incorrect, unanswered, total, score } = result;
  const attempted = correct + incorrect;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const barData = result.perQ.map((p) => ({
    time: p.time,
    color: p.status === 'correct' ? C.green : p.status === 'incorrect' ? C.red : C.amber,
  }));
  return (
    <>
      <Header onBack={onBack} title="Result" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 30 }}>
        {/* Score card */}
        <View style={st.resHero}>
          <Text style={st.resEmoji}>{accuracy >= 80 ? '🏆' : accuracy >= 50 ? '👍' : '💪'}</Text>
          <Text style={st.resScore}>{score} / {test.totalMarks || total}</Text>
          <Text style={st.resSub}>{test.name} · {accuracy}% accuracy</Text>
        </View>

        {/* Action buttons */}
        <View style={st.actionRow}>
          <ActionBtn icon="📋" label="Review Questions" onPress={onReview} primary />
          <ActionBtn icon="🔄" label="Retake Test" onPress={onRetake} />
          <ActionBtn icon="📈" label="More Tests" onPress={onMore} />
        </View>

        {/* Statistics — donut 1 */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Statistics</Text>
          <View style={st.donutRow}>
            <Donut size={170} stroke={28}
              segments={[{ value: correct, color: C.green }, { value: incorrect, color: C.red }, { value: unanswered, color: C.amber }]}
              center={<><Text style={st.donutCenterNum}>{total}</Text><Text style={st.donutCenterLbl}>Questions</Text></>} />
            <View style={{ flex: 1, gap: 8 }}>
              <StatChip color={C.green} bg={C.greenBg} label={`${correct} Correct`} />
              <StatChip color={C.red} bg={C.redBg} label={`${incorrect} Incorrect`} />
              <StatChip color={C.amber} bg={C.amberBg} label={`${unanswered} Unanswered`} />
            </View>
          </View>
          {/* donut 2 — correct vs incorrect ratio */}
          <View style={st.legendRow}><LegendDot color={C.blue} label="Correct" /><LegendDot color={C.grey} label="Incorrect" /></View>
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <Donut size={150} stroke={26}
              segments={[{ value: correct, color: C.blue }, { value: incorrect, color: C.grey }]}
              center={<><Text style={st.donutCenterNum}>{accuracy}%</Text></>} />
          </View>
        </View>

        {/* Detailed performance — time per question */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Detailed Performance</Text>
          <Text style={st.cardHint}>Time taken (sec) per question</Text>
          <TimeBars data={barData} />
          <View style={st.legendRow}>
            <LegendDot color={C.green} label="Correct" />
            <LegendDot color={C.red} label="Incorrect" />
            <LegendDot color={C.amber} label="Unanswered" />
          </View>
        </View>
      </ScrollView>
    </>
  );
}
function ActionBtn({ icon, label, onPress, primary }) {
  return (
    <TouchableOpacity style={[st.actionBtn, primary && st.actionBtnPrimary]} activeOpacity={0.85} onPress={onPress}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={[st.actionLbl, primary && { color: C.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}
function StatChip({ color, bg, label }) {
  return (
    <View style={[st.statChip, { backgroundColor: bg }]}>
      <View style={[st.dot, { backgroundColor: color }]} />
      <Text style={[st.statChipTxt, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Review (per-question solutions) ─────────────────────────────────────────
function Review({ test, result, onBack }) {
  const byId = useMemo(() => Object.fromEntries(result.perQ.map((p) => [String(p.id), p])), [result]);
  return (
    <>
      <Header onBack={onBack} title="Review Questions" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 30 }}>
        {(test.questions || []).map((q, i) => {
          const p = byId[String(q.id)] || {};
          return (
            <View key={q.id} style={st.reviewCard}>
              <View style={st.reviewTop}>
                <Text style={st.reviewNum}>Q{i + 1}</Text>
                <View style={[st.reviewBadge,
                  p.status === 'correct' ? { backgroundColor: C.greenBg } : p.status === 'incorrect' ? { backgroundColor: C.redBg } : { backgroundColor: C.amberBg }]}>
                  <Text style={[st.reviewBadgeTxt,
                    { color: p.status === 'correct' ? C.green : p.status === 'incorrect' ? C.red : C.amber }]}>
                    {p.status === 'correct' ? 'Correct' : p.status === 'incorrect' ? 'Incorrect' : 'Unanswered'}
                  </Text>
                </View>
              </View>
              <Rich value={q.text} fontSize={15} color={C.text} />
              <View style={{ gap: 8, marginTop: 8 }}>
                {(q.options || []).map((o) => {
                  const isCorrect = String(o.optionId) === String(q.correctOptionId);
                  const isPicked = String(o.optionId) === String(p.selected);
                  let box = st.rOpt, col = C.text;
                  if (isCorrect) { box = [st.rOpt, st.optCorrect]; col = C.green; }
                  else if (isPicked) { box = [st.rOpt, st.optWrong]; col = C.red; }
                  return (
                    <View key={o.optionId} style={box}>
                      <Text style={[st.optKey, { color: col }]}>{o.key}</Text>
                      <View style={{ flex: 1 }}><Rich value={o.label} fontSize={14} color={col} /></View>
                      {isCorrect && <Text style={st.tick}>✓</Text>}
                      {isPicked && !isCorrect && <Text style={st.cross}>✕</Text>}
                    </View>
                  );
                })}
              </View>
              {!!q.explanation && (
                <View style={st.solBox}>
                  <Text style={st.solTitle}>Solution</Text>
                  <Rich value={q.explanation} fontSize={13} color={C.text} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </>
  );
}

const Center = ({ children }) => <View style={st.center}>{children}</View>;
const Empty = ({ title, sub }) => (
  <View style={st.center}><Text style={st.emptyTitle}>{title}</Text><Text style={st.emptySub}>{sub}</Text></View>
);

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { fontSize: 15, color: C.primary, fontFamily: FONT.semibold },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontFamily: FONT.bold, color: C.text },
  sectionHint: { fontSize: 13, color: C.muted, marginBottom: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 17, fontFamily: FONT.extrabold, color: C.text },
  emptySub: { fontSize: 14, color: C.muted, marginTop: 6, textAlign: 'center' },
  chev: { fontSize: 26, color: C.grey, fontWeight: '300' },

  subjectCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  subjectEmoji: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectName: { flex: 1, fontSize: 15, fontFamily: FONT.bold, color: C.text },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  rowIdx: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rowIdxTxt: { fontSize: 13, fontFamily: FONT.extrabold, color: C.primary },
  rowTitle: { fontSize: 14.5, fontFamily: FONT.bold, color: C.text },
  rowSub: { fontSize: 12.5, color: C.muted, marginTop: 2 },

  testCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  testName: { fontSize: 15, fontFamily: FONT.extrabold, color: C.text },
  testMetaRow: { flexDirection: 'row', gap: 14, marginTop: 6 },
  testMeta: { fontSize: 12.5, color: C.muted, fontFamily: FONT.semibold },
  startPill: { backgroundColor: C.primary, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 50 },
  startPillTxt: { color: C.white, fontFamily: FONT.extrabold, fontSize: 13 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },

  // ── test briefing (dark, on TT) ──
  brief: { flex: 1, backgroundColor: TT.canvas },
  briefTop: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 2 },
  briefBack: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  briefBody: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 28 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 20 },
  brandDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#F97445' },
  brandTxt: { fontSize: 15.5, fontFamily: FONT.extrabold, color: TT.violet, letterSpacing: -0.2 },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  eyebrow: { fontSize: 11.5, fontFamily: FONT.extrabold, color: TT.sub, letterSpacing: 1.3, marginBottom: 8 },
  briefTitle: { fontSize: 38, lineHeight: 44, fontFamily: FONT.black, color: TT.ink, letterSpacing: -1.2 },
  briefSub: { fontSize: 16, lineHeight: 23, color: TT.sub, fontFamily: FONT.semibold, marginTop: 12 },
  // Pulled up and out so the bloom bleeds off the right edge, as in the frame.
  orbWrap: { position: 'absolute', right: -46, top: -34 },

  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 26 },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingVertical: 13, paddingHorizontal: 18, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  statPillTxt: { fontSize: 16, fontFamily: FONT.extrabold, color: TT.ink, letterSpacing: -0.3 },

  markingLine: { fontSize: 14.5, color: TT.sub, fontFamily: FONT.semibold, marginTop: 22 },
  markPos: { color: '#F97445', fontFamily: FONT.extrabold },
  markNeg: { color: TT.sub, fontFamily: FONT.semibold },

  instrHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 34 },
  instrHeadTxt: { flex: 1, fontSize: 19, fontFamily: FONT.extrabold, color: TT.ink, letterSpacing: -0.4 },
  instrRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginTop: 16 },
  instrPara: { fontSize: 15.5, lineHeight: 24, color: TT.sub, fontFamily: FONT.regular, marginTop: 18 },

  briefFooter: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 30 : 20 },
  startBtn: {
    height: 66, borderRadius: 18, backgroundColor: '#8B5CF6',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B5CF6', shadowOpacity: 0.55, shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  startBtnTxt: { fontSize: 19, fontFamily: FONT.black, color: '#FFFFFF', letterSpacing: -0.3 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  counter: { fontSize: 13, fontFamily: FONT.bold, color: C.muted },
  timerPill: { backgroundColor: C.primaryLight, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 50 },
  timerTxt: { fontSize: 13, fontFamily: FONT.extrabold, color: C.primary },
  palette: { maxHeight: 48, marginTop: 10, flexGrow: 0 },
  palCell: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  palAnswered: { backgroundColor: C.green, borderColor: C.green },
  palCur: { backgroundColor: C.primary, borderColor: C.primary },
  palTxt: { fontSize: 13, fontFamily: FONT.extrabold, color: C.muted },

  qNum: { fontSize: 12, fontFamily: FONT.extrabold, color: C.primary },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, padding: 12 },
  optSel: { borderColor: C.primary, backgroundColor: C.primaryLight },
  optCorrect: { borderColor: C.green, backgroundColor: C.greenBg },
  optWrong: { borderColor: C.red, backgroundColor: C.redBg },
  optKey: { fontFamily: FONT.extrabold, fontSize: 15, minWidth: 18 },
  selDot: { color: C.primary, fontSize: 12 },
  tick: { color: C.green, fontFamily: FONT.extrabold, fontSize: 16 },
  cross: { color: C.red, fontFamily: FONT.extrabold, fontSize: 16 },

  btnGhost: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  btnGhostTxt: { fontSize: 15, fontFamily: FONT.bold, color: C.muted },
  btnSubmit: { backgroundColor: C.green },

  resHero: { backgroundColor: C.white, borderRadius: 16, alignItems: 'center', padding: 22, gap: 4, borderWidth: 1, borderColor: C.border },
  resEmoji: { fontSize: 40 },
  resScore: { fontSize: 26, fontFamily: FONT.black, color: C.text },
  resSub: { fontSize: 13, color: C.muted },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center', paddingVertical: 12, gap: 4 },
  actionBtnPrimary: { borderColor: C.primary, backgroundColor: C.primaryLight },
  actionLbl: { fontSize: 11.5, fontFamily: FONT.bold, color: C.muted, textAlign: 'center' },

  card: { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  cardTitle: { fontSize: 15, fontFamily: FONT.extrabold, color: C.text },
  cardHint: { fontSize: 12, color: C.muted, marginTop: -4 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  donutCenterNum: { fontSize: 24, fontFamily: FONT.black, color: C.text },
  donutCenterLbl: { fontSize: 11, color: C.muted },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  statChipTxt: { fontSize: 13, fontFamily: FONT.extrabold },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendTxt: { fontSize: 12, color: C.muted, fontFamily: FONT.semibold },

  reviewCard: { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  reviewNum: { fontSize: 13, fontFamily: FONT.extrabold, color: C.primary },
  reviewBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50 },
  reviewBadgeTxt: { fontSize: 11, fontFamily: FONT.extrabold },
  rOpt: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 10 },
  solBox: { backgroundColor: C.bg, borderRadius: 10, padding: 12, marginTop: 10, gap: 4 },
  solTitle: { fontSize: 12.5, fontFamily: FONT.extrabold, color: C.text },
});
