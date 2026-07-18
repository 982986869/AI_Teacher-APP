// McqQuizScreen.js
// Per-question MCQ practice flow (DB-backed). Each question has its own timer;
// the user either Skips or Submits. On Submit the correct answer is highlighted
// (green), a wrong pick is shown (red), and the solution (explanation) is
// revealed. Then "Next" moves on. A short summary is shown at the end.
//
// Questions come from mcqPracticeApi (getMcqSubtopicTest / getMcqChapterTest):
//   { id, text, options:[{ key, label, optionId }], correctOptionId,
//     correctAnswer, explanation }

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { S } from '../theme/studentUI';
import { FONT } from '../constants/fonts';
import MathText from '../components/MathText';

const QUESTION_SECONDS = 60;

const C = {
  bg: '#F4F5FB', white: '#fff', text: S.ink, muted: S.muted,
  primary: '#534AB7', primaryLight: '#EEEDFE', border: S.hair,
  green: '#0F8A5F', greenBg: '#E7F7EC', red: '#E5484D', redBg: '#FDECEC',
  amber: '#B5860B', amberBg: '#FBF3DD',
};

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// HTML → readable plain text (keeps sup/sub markers as ^ / _).
const stripHtml = (s) =>
  String(s == null ? '' : s)
    .replace(/<sup[^>]*>(.*?)<\/sup>/gis, '^$1')
    .replace(/<sub[^>]*>(.*?)<\/sub>/gis, '_$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

// First <img src> in an HTML string — some questions/options are diagrams (S3 imports or
// admin-uploaded), which the text renderers strip; we render them as a real <Image>.
const firstImg = (s) => { const m = String(s || '').match(/<img[^>]+src=["']([^"']+)["']/i); return m ? m[1] : null; };

// Renders math ({tex}) via MathText, otherwise plain HTML as readable Text
// (MathJaxSvg can render plain/HTML strings inconsistently). If the content carries an
// image (diagram), it's shown below any text.
function Rich({ value, fontSize = 15, color = C.text, imgHeight = 160 }) {
  if (value == null || !String(value).trim()) return null;
  const raw = String(value);
  const img = firstImg(raw);
  const textPart = raw.replace(/<img[^>]*>/gi, '').replace(/<p[^>]*>\s*<\/p>/gi, '');
  const hasTex = /\{tex\}/.test(textPart);
  const plain = stripHtml(textPart);
  const hasText = hasTex || plain.length > 0;
  if (!img) {
    return hasTex
      ? <MathText value={textPart} fontSize={fontSize} color={color} />
      : <Text style={{ fontSize, color, lineHeight: fontSize * 1.45 }}>{plain}</Text>;
  }
  return (
    <View>
      {hasText ? (
        hasTex
          ? <MathText value={textPart} fontSize={fontSize} color={color} />
          : <Text style={{ fontSize, color, lineHeight: fontSize * 1.45 }}>{plain}</Text>
      ) : null}
      <Image source={{ uri: img }} style={{ width: '100%', height: imgHeight, marginTop: hasText ? 8 : 0, borderRadius: 8, backgroundColor: '#fff' }} resizeMode="contain" />
    </View>
  );
}

export default function McqQuizScreen({
  questions = [], subject = '', chapter = '', subtopicName = '', onExit = () => {}, onComplete = () => {},
}) {
  const qs = Array.isArray(questions) ? questions : [];
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);   // optionId
  const [submitted, setSubmitted] = useState(false);
  const [secs, setSecs] = useState(QUESTION_SECONDS);
  const [score, setScore] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  // Per-question countdown — resets each question, auto-reveals at 0.
  useEffect(() => {
    if (done) return undefined;
    setSecs(QUESTION_SECONDS);
    timerRef.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) { clearInterval(timerRef.current); reveal(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done]);

  // Report the final score once, when the quiz finishes (for attempt tracking).
  useEffect(() => {
    if (done) onComplete({ correct: score.correct, total: qs.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (!qs.length) {
    return (
      <SafeAreaView style={st.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.white} />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.white }} />}
        <Header onExit={onExit} title={subtopicName || chapter} />
        <View style={st.center}>
          <Text style={st.emptyTitle}>No questions yet</Text>
          <Text style={st.emptySub}>Questions for this haven't been added yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const q = qs[idx];
  const correctId = q.correctOptionId;
  const doneCount = score.correct + score.wrong + score.skipped;
  const attemptedLive = score.correct + score.wrong;
  const liveAcc = attemptedLive ? Math.round((score.correct / attemptedLive) * 100) : 0;

  function reveal() {
    clearInterval(timerRef.current);
    setSubmitted((already) => {
      if (already) return already;
      setScore((s) => {
        if (selected == null) return { ...s, skipped: s.skipped + 1 };
        if (String(selected) === String(correctId)) return { ...s, correct: s.correct + 1 };
        return { ...s, wrong: s.wrong + 1 };
      });
      return true;
    });
  }

  function skip() {
    clearInterval(timerRef.current);
    setScore((s) => ({ ...s, skipped: s.skipped + 1 }));
    next();
  }

  function next() {
    clearInterval(timerRef.current);
    setSubmitted(false);
    setSelected(null);
    if (idx + 1 >= qs.length) setDone(true);
    else setIdx(idx + 1);
  }

  if (done) {
    const attempted = score.correct + score.wrong;
    const acc = attempted ? Math.round((score.correct / attempted) * 100) : 0;
    return (
      <SafeAreaView style={st.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.white} />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.white }} />}
        <Header onExit={onExit} title="Result" />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          <View style={st.resHero}>
            <Text style={st.resEmoji}>{acc >= 80 ? '🏆' : acc >= 50 ? '👍' : '💪'}</Text>
            <Text style={st.resTitle}>{score.correct} / {qs.length} correct</Text>
            <Text style={st.resSub}>{subtopicName || chapter}</Text>
          </View>
          <View style={st.tiles}>
            <Tile bg={C.greenBg} col={C.green} num={score.correct} label="Correct" />
            <Tile bg={C.redBg} col={C.red} num={score.wrong} label="Wrong" />
            <Tile bg={C.amberBg} col={C.amber} num={score.skipped} label="Skipped" />
          </View>
          <Text style={st.accTxt}>Accuracy: {acc}%</Text>
          <TouchableOpacity style={st.primaryBtn} onPress={onExit} activeOpacity={0.85}>
            <Text style={st.primaryBtnTxt}>Back to Practice</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.white }} />}
      <Header onExit={onExit} title={subtopicName || chapter} />

      <View style={st.topRow}>
        <Text style={st.counter}>Question {idx + 1} / {qs.length}</Text>
        <View style={[st.timerPill, secs <= 10 && { backgroundColor: C.redBg }]}>
          <Text style={[st.timerTxt, secs <= 10 && { color: C.red }]}>⏱ {fmt(secs)}</Text>
        </View>
      </View>

      <View style={st.statsRow}>
        <Text style={st.statItem}>Done {doneCount}/{qs.length}</Text>
        <Text style={[st.statItem, { color: C.green }]}>✓ {score.correct}</Text>
        <Text style={[st.statItem, { color: C.red }]}>✗ {score.wrong}</Text>
        <Text style={[st.statItem, { color: C.primary }]}>{liveAcc}%</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}>
        {!!q.cat && <Text style={st.cat}>{q.cat}</Text>}
        <Rich value={q.text} fontSize={16} color={C.text} />

        <View style={{ gap: 10, marginTop: 4 }}>
          {(q.options || []).map((o) => {
            const isSel = String(selected) === String(o.optionId);
            const isCorrect = String(o.optionId) === String(correctId);
            let box = st.opt;
            let txtCol = C.text;
            if (submitted) {
              if (isCorrect) { box = [st.opt, st.optCorrect]; txtCol = C.green; }
              else if (isSel) { box = [st.opt, st.optWrong]; txtCol = C.red; }
            } else if (isSel) { box = [st.opt, st.optSel]; }
            return (
              <TouchableOpacity
                key={o.optionId}
                activeOpacity={0.8}
                disabled={submitted}
                onPress={() => setSelected(o.optionId)}
                style={box}
              >
                <Text style={[st.optKey, { color: txtCol }]}>{o.key}</Text>
                <View style={{ flex: 1 }}>
                  <Rich value={o.label} fontSize={15} color={txtCol} imgHeight={92} />
                </View>
                {submitted && isCorrect && <Text style={st.tick}>✓</Text>}
                {submitted && isSel && !isCorrect && <Text style={st.cross}>✕</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {submitted && (
          <View style={st.solBox}>
            <Text style={st.solTitle}>
              {selected == null ? 'Skipped' : String(selected) === String(correctId) ? '✅ Correct' : '❌ Incorrect'}
              {'  ·  '}Answer: {q.correctAnswer || ''}
            </Text>
            {!!q.explanation && <Rich value={q.explanation} fontSize={14} color={C.text} />}
          </View>
        )}
      </ScrollView>

      <View style={st.footer}>
        {!submitted ? (
          <>
            <TouchableOpacity style={[st.btn, st.btnGhost]} activeOpacity={0.85} onPress={skip}>
              <Text style={st.btnGhostTxt}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.btn, st.btnPrimary, selected == null && { opacity: 0.5 }]}
              activeOpacity={0.85}
              disabled={selected == null}
              onPress={reveal}
            >
              <Text style={st.btnPrimaryTxt}>Submit</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[st.btn, st.btnPrimary, { flex: 1 }]} activeOpacity={0.85} onPress={next}>
            <Text style={st.btnPrimaryTxt}>{idx + 1 >= qs.length ? 'Finish' : 'Next'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function Header({ onExit, title }) {
  return (
    <View style={st.header}>
      <TouchableOpacity onPress={onExit} hitSlop={10}><Text style={st.back}>← Back</Text></TouchableOpacity>
      <Text style={st.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 48 }} />
    </View>
  );
}

function Tile({ bg, col, num, label }) {
  return (
    <View style={[st.tile, { backgroundColor: bg }]}>
      <Text style={[st.tileNum, { color: col }]}>{num}</Text>
      <Text style={st.tileLbl}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { fontSize: 15, color: C.primary, fontFamily: FONT.semibold },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontFamily: FONT.bold, color: C.text },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  counter: { fontSize: 13, fontFamily: FONT.bold, color: C.muted },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 8, backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingVertical: 8, paddingHorizontal: 12 },
  statItem: { fontSize: 13, fontFamily: FONT.extrabold, color: C.muted },
  timerPill: { backgroundColor: C.primaryLight, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 50 },
  timerTxt: { fontSize: 13, fontFamily: FONT.extrabold, color: C.primary },
  cat: { fontSize: 12, fontFamily: FONT.bold, color: C.primary },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, padding: 12 },
  optSel: { borderColor: C.primary, backgroundColor: C.primaryLight },
  optCorrect: { borderColor: C.green, backgroundColor: C.greenBg },
  optWrong: { borderColor: C.red, backgroundColor: C.redBg },
  optKey: { fontFamily: FONT.extrabold, fontSize: 15, minWidth: 18 },
  tick: { color: C.green, fontFamily: FONT.extrabold, fontSize: 16 },
  cross: { color: C.red, fontFamily: FONT.extrabold, fontSize: 16 },
  solBox: { backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginTop: 6, gap: 6 },
  solTitle: { fontSize: 13, fontFamily: FONT.extrabold, color: C.text },
  footer: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  btnGhost: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  btnGhostTxt: { fontSize: 15, fontFamily: FONT.bold, color: C.muted },
  btnPrimary: { backgroundColor: C.primary },
  btnPrimaryTxt: { fontSize: 15, fontFamily: FONT.extrabold, color: C.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 17, fontFamily: FONT.extrabold, color: C.text },
  emptySub: { fontSize: 14, color: C.muted, marginTop: 6, textAlign: 'center' },
  resHero: { backgroundColor: C.white, borderRadius: 16, alignItems: 'center', padding: 22, gap: 4 },
  resEmoji: { fontSize: 40 }, resTitle: { fontSize: 20, fontFamily: FONT.extrabold, color: C.text }, resSub: { fontSize: 13, color: C.muted },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  tileNum: { fontSize: 22, fontFamily: FONT.extrabold }, tileLbl: { fontSize: 12, color: C.muted, marginTop: 2 },
  accTxt: { fontSize: 15, fontFamily: FONT.bold, color: C.text, textAlign: 'center' },
  primaryBtn: { backgroundColor: C.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnTxt: { fontSize: 15, fontFamily: FONT.extrabold, color: C.white },
});
