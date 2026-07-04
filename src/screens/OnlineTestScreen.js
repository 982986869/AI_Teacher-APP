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
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import Svg, { Circle, G, Rect, Line, Text as RNSvgText } from 'react-native-svg';
import MathText from '../components/MathText';
import { useAuth } from '../context/AuthContext';
import { getOnlineTestChapters, getOnlineTests, getOnlineTest } from '../api/onlineTestApi';

const classNum = (c) => parseInt(String(c || '').replace(/\D/g, ''), 10) || null;
const slugify = (s) => {
  const base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (base) return base;
  let h = 5381;
  const str = String(s);
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return 'u' + h.toString(36);
};

const C = {
  bg: '#F4F5FB', white: '#fff', text: '#22222A', muted: '#7A7A8C',
  primary: '#534AB7', primaryLight: '#EEEDFE', border: '#E7E7EF',
  green: '#22B07A', greenBg: '#E7F7EC', red: '#F0564B', redBg: '#FDECEC',
  amber: '#F5A623', amberBg: '#FFF4E0', blue: '#4AA8F0', grey: '#C7C7D1',
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
    { name: 'Computer Applications (165)', emoji: '💻', bg: '#1C1C1E' },
  ],
};
const subjectsForClass = (classLevel) => SUBJECTS_BY_CLASS[classLevel] || SUBJECTS_BY_CLASS[7];

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const stripHtml = (s) =>
  String(s == null ? '' : s)
    .replace(/<sup[^>]*>(.*?)<\/sup>/gis, '^$1')
    .replace(/<sub[^>]*>(.*?)<\/sub>/gis, '_$1')
    .replace(/<li[^>]*>/gi, '\n• ').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

function Rich({ value, fontSize = 15, color = C.text }) {
  if (value == null || !String(value).trim()) return null;
  if (/\{tex\}/.test(String(value))) return <MathText value={value} fontSize={fontSize} color={color} />;
  return <Text style={{ fontSize, color, lineHeight: fontSize * 1.45 }}>{stripHtml(value)}</Text>;
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

  const [view, setView] = useState('subjects'); // subjects|chapters|tests|instruction|running|result|review
  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [tests, setTests] = useState(null);
  const [test, setTest] = useState(null);       // full test payload
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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
  const openSubject = async (s) => {
    setSubject(s); setView('chapters'); setChapters(null);
    try { setChapters(await getOnlineTestChapters(slugify(s.name), classLevel)); }
    catch { setChapters([]); }
  };
  const openChapter = async (ch) => {
    setChapter(ch); setView('tests'); setTests(null);
    try { setTests(await getOnlineTests(slugify(subject.name), ch.slug, classLevel)); }
    catch { setTests([]); }
  };
  const openTest = async (t) => {
    setLoading(true);
    try {
      const data = await getOnlineTest(t.id);
      setTest(data); setView('instruction');
    } catch { setTest(null); } finally { setLoading(false); }
  };

  const onFinish = (res) => { setResult(res); setView('result'); };

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.white }} />}

      {view === 'subjects' && (
        <>
          <Header onBack={onExit} title="Online Test" />
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            <Text style={st.sectionHint}>Pick a subject to see chapter-wise timed tests.</Text>
            {subjectsForClass(classLevel).map((s) => (
              <TouchableOpacity key={s.name} style={st.subjectCard} activeOpacity={0.85} onPress={() => openSubject(s)}>
                <View style={[st.subjectEmoji, { backgroundColor: s.bg }]}><Text style={{ fontSize: 22 }}>{s.emoji}</Text></View>
                <Text style={st.subjectName}>{s.name}</Text>
                <Text style={st.chev}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {view === 'chapters' && (
        <>
          <Header onBack={back} title={subject?.name || 'Chapters'} />
          {chapters == null ? <Center><ActivityIndicator color={C.primary} /></Center> : (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
              {chapters.length === 0 && <Empty title="No online tests" sub="No tests have been added for this subject yet." />}
              {chapters.map((ch, i) => (
                <TouchableOpacity key={ch.slug} style={st.row} activeOpacity={0.85} onPress={() => openChapter(ch)}>
                  <View style={st.rowIdx}><Text style={st.rowIdxTxt}>{i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.rowTitle}>{ch.name}</Text>
                    <Text style={st.rowSub}>{ch.testCount} test{ch.testCount > 1 ? 's' : ''}</Text>
                  </View>
                  <Text style={st.chev}>›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {view === 'tests' && (
        <>
          <Header onBack={back} title={chapter?.name || 'Tests'} />
          {tests == null ? <Center><ActivityIndicator color={C.primary} /></Center> : (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
              {tests.length === 0 && <Empty title="No tests" sub="No tests here yet." />}
              {tests.map((t) => (
                <TouchableOpacity key={t.id} style={st.testCard} activeOpacity={0.85} onPress={() => openTest(t)} disabled={loading}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.testName}>{t.name}</Text>
                    <View style={st.testMetaRow}>
                      <Text style={st.testMeta}>📝 {t.questionCount} Qs</Text>
                      <Text style={st.testMeta}>⏱ {t.durationMin} min</Text>
                      <Text style={st.testMeta}>⭐ {t.totalMarks} marks</Text>
                    </View>
                  </View>
                  <View style={st.startPill}><Text style={st.startPillTxt}>Start</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {loading && <View style={st.loadingOverlay}><ActivityIndicator color={C.primary} size="large" /></View>}
        </>
      )}

      {view === 'instruction' && test && (
        <Instruction test={test} onBack={back} onStart={() => setView('running')} />
      )}

      {view === 'running' && test && (
        <Runner test={test} onBack={back} onFinish={onFinish} />
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
function Instruction({ test, onBack, onStart }) {
  return (
    <>
      <Header onBack={onBack} title="Instructions" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={st.instrHero}>
          <Text style={st.instrTitle}>{test.name}</Text>
          <Text style={st.instrSub}>{test.chapterName}</Text>
          <View style={st.instrStats}>
            <InstrStat num={test.questionCount} label="Questions" />
            <InstrStat num={test.durationMin} label="Minutes" />
            <InstrStat num={test.totalMarks} label="Marks" />
          </View>
        </View>
        <View style={st.instrBox}>
          <Text style={st.instrBoxTitle}>Instructions</Text>
          {test.instructionHtml
            ? <Rich value={test.instructionHtml} fontSize={14} color={C.text} />
            : <Text style={st.instrLine}>• All questions are compulsory.{'\n'}• Each question carries equal marks.{'\n'}• There is no negative marking.{'\n'}• The timer starts once you begin.</Text>}
        </View>
      </ScrollView>
      <View style={st.footer}>
        <TouchableOpacity style={[st.btn, st.btnPrimary, { flex: 1 }]} activeOpacity={0.85} onPress={onStart}>
          <Text style={st.btnPrimaryTxt}>Start Test</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
function InstrStat({ num, label }) {
  return <View style={st.instrStat}><Text style={st.instrStatNum}>{num}</Text><Text style={st.instrStatLbl}>{label}</Text></View>;
}

// ─── Test runner (timed, navigable, single submit) ───────────────────────────
function Runner({ test, onBack, onFinish }) {
  const qs = test.questions || [];
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});       // questionId -> optionId
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
    onFinish({ correct, incorrect, unanswered, total: qs.length, score, perQ, answers });
  };
  submitRef.current = submit;

  const q = qs[idx];
  const answeredCount = Object.keys(answers).length;
  const low = secs <= 30;

  return (
    <>
      <Header onBack={onBack} title={test.name} />
      <View style={st.topRow}>
        <Text style={st.counter}>Q {idx + 1} / {qs.length}</Text>
        <View style={[st.timerPill, low && { backgroundColor: C.redBg }]}>
          <Text style={[st.timerTxt, low && { color: C.red }]}>⏱ {fmt(secs)}</Text>
        </View>
      </View>

      {/* Question palette */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.palette} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {qs.map((qq, i) => {
          const answered = answers[qq.id] != null;
          const cur = i === idx;
          return (
            <TouchableOpacity key={qq.id} onPress={() => goto(i)}
              style={[st.palCell, answered && st.palAnswered, cur && st.palCur]}>
              <Text style={[st.palTxt, answered && { color: C.white }, cur && { color: C.white }]}>{i + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}>
        <Text style={st.qNum}>Question {idx + 1}</Text>
        <Rich value={q.text} fontSize={16} color={C.text} />
        <View style={{ gap: 10, marginTop: 4 }}>
          {(q.options || []).map((o) => {
            const sel = String(answers[q.id]) === String(o.optionId);
            return (
              <TouchableOpacity key={o.optionId} activeOpacity={0.8} onPress={() => pick(o.optionId)}
                style={[st.opt, sel && st.optSel]}>
                <Text style={[st.optKey, sel && { color: C.primary }]}>{o.key}</Text>
                <View style={{ flex: 1 }}><Rich value={o.label} fontSize={15} color={sel ? C.primary : C.text} /></View>
                {sel && <Text style={st.selDot}>●</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={st.footer}>
        <TouchableOpacity style={[st.btn, st.btnGhost, idx === 0 && { opacity: 0.4 }]} disabled={idx === 0}
          activeOpacity={0.85} onPress={() => goto(idx - 1)}>
          <Text style={st.btnGhostTxt}>Prev</Text>
        </TouchableOpacity>
        {idx + 1 < qs.length ? (
          <TouchableOpacity style={[st.btn, st.btnPrimary]} activeOpacity={0.85} onPress={() => goto(idx + 1)}>
            <Text style={st.btnPrimaryTxt}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[st.btn, st.btnSubmit]} activeOpacity={0.85} onPress={submit}>
            <Text style={st.btnPrimaryTxt}>Submit ({answeredCount}/{qs.length})</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
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
  back: { fontSize: 15, color: C.primary, fontWeight: '600' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: C.text },
  sectionHint: { fontSize: 13, color: C.muted, marginBottom: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  emptySub: { fontSize: 14, color: C.muted, marginTop: 6, textAlign: 'center' },
  chev: { fontSize: 26, color: C.grey, fontWeight: '300' },

  subjectCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  subjectEmoji: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectName: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  rowIdx: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rowIdxTxt: { fontSize: 13, fontWeight: '800', color: C.primary },
  rowTitle: { fontSize: 14.5, fontWeight: '700', color: C.text },
  rowSub: { fontSize: 12.5, color: C.muted, marginTop: 2 },

  testCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  testName: { fontSize: 15, fontWeight: '800', color: C.text },
  testMetaRow: { flexDirection: 'row', gap: 14, marginTop: 6 },
  testMeta: { fontSize: 12.5, color: C.muted, fontWeight: '600' },
  startPill: { backgroundColor: C.primary, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 50 },
  startPillTxt: { color: C.white, fontWeight: '800', fontSize: 13 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },

  instrHero: { backgroundColor: C.white, borderRadius: 16, padding: 20, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.border },
  instrTitle: { fontSize: 19, fontWeight: '800', color: C.text, textAlign: 'center' },
  instrSub: { fontSize: 13, color: C.muted },
  instrStats: { flexDirection: 'row', gap: 22, marginTop: 14 },
  instrStat: { alignItems: 'center' },
  instrStatNum: { fontSize: 22, fontWeight: '800', color: C.primary },
  instrStatLbl: { fontSize: 12, color: C.muted, marginTop: 2 },
  instrBox: { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, gap: 8 },
  instrBoxTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  instrLine: { fontSize: 14, color: C.text, lineHeight: 22 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  counter: { fontSize: 13, fontWeight: '700', color: C.muted },
  timerPill: { backgroundColor: C.primaryLight, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 50 },
  timerTxt: { fontSize: 13, fontWeight: '800', color: C.primary },
  palette: { maxHeight: 48, marginTop: 10, flexGrow: 0 },
  palCell: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  palAnswered: { backgroundColor: C.green, borderColor: C.green },
  palCur: { backgroundColor: C.primary, borderColor: C.primary },
  palTxt: { fontSize: 13, fontWeight: '800', color: C.muted },

  qNum: { fontSize: 12, fontWeight: '800', color: C.primary },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, padding: 12 },
  optSel: { borderColor: C.primary, backgroundColor: C.primaryLight },
  optCorrect: { borderColor: C.green, backgroundColor: C.greenBg },
  optWrong: { borderColor: C.red, backgroundColor: C.redBg },
  optKey: { fontWeight: '800', fontSize: 15, minWidth: 18 },
  selDot: { color: C.primary, fontSize: 12 },
  tick: { color: C.green, fontWeight: '800', fontSize: 16 },
  cross: { color: C.red, fontWeight: '800', fontSize: 16 },

  footer: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  btnGhost: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  btnGhostTxt: { fontSize: 15, fontWeight: '700', color: C.muted },
  btnPrimary: { backgroundColor: C.primary },
  btnSubmit: { backgroundColor: C.green },
  btnPrimaryTxt: { fontSize: 15, fontWeight: '800', color: C.white },

  resHero: { backgroundColor: C.white, borderRadius: 16, alignItems: 'center', padding: 22, gap: 4, borderWidth: 1, borderColor: C.border },
  resEmoji: { fontSize: 40 },
  resScore: { fontSize: 26, fontWeight: '900', color: C.text },
  resSub: { fontSize: 13, color: C.muted },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center', paddingVertical: 12, gap: 4 },
  actionBtnPrimary: { borderColor: C.primary, backgroundColor: C.primaryLight },
  actionLbl: { fontSize: 11.5, fontWeight: '700', color: C.muted, textAlign: 'center' },

  card: { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  cardHint: { fontSize: 12, color: C.muted, marginTop: -4 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  donutCenterNum: { fontSize: 24, fontWeight: '900', color: C.text },
  donutCenterLbl: { fontSize: 11, color: C.muted },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  statChipTxt: { fontSize: 13, fontWeight: '800' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendTxt: { fontSize: 12, color: C.muted, fontWeight: '600' },

  reviewCard: { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  reviewNum: { fontSize: 13, fontWeight: '800', color: C.primary },
  reviewBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50 },
  reviewBadgeTxt: { fontSize: 11, fontWeight: '800' },
  rOpt: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 10 },
  solBox: { backgroundColor: C.bg, borderRadius: 10, padding: 12, marginTop: 10, gap: 4 },
  solTitle: { fontSize: 12.5, fontWeight: '800', color: C.text },
});
