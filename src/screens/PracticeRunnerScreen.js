// src/screens/PracticeRunnerScreen.js
// Chapter practice, answered one question at a time.
//
// Practice used to render as a read-only document: the student could read the
// question and its four options, and that was the end of it. There was nothing to
// tap, nothing to submit, and no way to find out whether they were right — because
// the imported bank carried no answer key at all (examin8 only reveals the key when
// a question is submitted on its own site).
//
// With keys in the DB this becomes what practice is supposed to be: pick an option,
// submit it, see immediately whether it was right and which one was correct, move on.
// One question per screen, graded the moment it is submitted — not a timed test with
// the verdict withheld until the end (that is McqTestScreen, and it answers a
// different need: exam rehearsal rather than learning a chapter).
//
// Questions whose key is still null are not shown. A question that cannot be graded
// would hand the student a Submit button that does nothing useful, which is worse
// than one question fewer.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, Image, ScrollView, Pressable, StyleSheet,
  SafeAreaView, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { FONT } from '../constants/fonts';
import MathText from '../components/MathText';
import { firstImg, stripImages } from '../utils/mathHtml';
import { getQuestionsByPath } from '../api/resourcesApi';

const C = {
  bg: '#F4F5FB', card: '#FFFFFF',
  ink: '#111111', muted: '#666666', faint: '#9AA0B4',
  border: 'rgba(17,17,17,0.10)',
  teal: '#0C8F88', tealSoft: '#E3F3F2',
  green: '#0E9F6E', greenSoft: '#D6F5E7',
  red: '#E5484D', redSoft: '#FDECEA',
  amber: '#FFC629', amberSoft: '#FFF4CC',
};

// Question and option HTML may carry a diagram as an <img> or as a bare URL; the
// text renderer strips both, so render the image separately. Same treatment the
// other runners give it (McqTestScreen's Rich) so a diagram never silently vanishes.
function Rich({ value, fontSize = 15, color = C.ink, style, imgHeight = 160 }) {
  if (value == null || !String(value).trim()) return null;
  const raw = String(value);
  const img = firstImg(raw);
  if (!img) return <MathText value={raw} fontSize={fontSize} color={color} style={style} />;
  const textPart = stripImages(raw);
  const hasText = !!textPart.replace(/<[^>]+>/g, '').trim() || /\{tex\}/.test(textPart);
  return (
    <View style={style}>
      {hasText ? <MathText value={textPart} fontSize={fontSize} color={color} /> : null}
      <Image
        source={{ uri: img }}
        style={{ width: '100%', height: imgHeight, marginTop: hasText ? 8 : 0, borderRadius: 8, backgroundColor: '#fff' }}
        resizeMode="contain"
      />
    </View>
  );
}

// The key can arrive either as correctOption ('C') or as is_correct on an option.
// Accept both rather than depending on which importer wrote the row.
const keyOf = (q) => {
  const direct = q && q.correctOption != null ? String(q.correctOption).trim().toUpperCase() : '';
  if (direct) return direct;
  const flagged = (q && q.options ? q.options : []).find((o) => o && o.is_correct);
  return flagged ? String(flagged.idx).trim().toUpperCase() : '';
};

// Gradable = an MCQ with options AND a key that names one of them. A key pointing
// at an option that does not exist is treated as missing, not rendered as a
// question with no right answer.
const gradable = (q) => {
  if (!q || !Array.isArray(q.options) || q.options.length < 2) return false;
  const k = keyOf(q);
  return !!k && q.options.some((o) => String(o.idx).trim().toUpperCase() === k);
};

export default function PracticeRunnerScreen({
  subjectSlug, chapterSlug, chapterName, subjectName, classLevel, onBack,
}) {
  const [state, setState] = useState({ loading: true, error: null, questions: [] });
  const [retry, setRetry] = useState(0);

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);   // the idx the student tapped
  const [locked, setLocked] = useState(false);  // submitted → reveal
  const [score, setScore] = useState({ right: 0, wrong: 0, skipped: 0 });
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, questions: [] });
    getQuestionsByPath(subjectSlug, chapterSlug, 'practice', classLevel)
      .then((qs) => {
        if (!alive) return;
        const usable = (Array.isArray(qs) ? qs : []).filter(gradable);
        setState({ loading: false, error: null, questions: usable });
      })
      .catch((e) => {
        if (!alive) return;
        setState({ loading: false, error: e?.response?.data?.error || e?.message || 'Could not load questions.', questions: [] });
      });
    return () => { alive = false; };
  }, [subjectSlug, chapterSlug, classLevel, retry]);

  const qs = state.questions;
  const q = qs[i];
  const answer = useMemo(() => (q ? keyOf(q) : ''), [q]);
  const total = qs.length;

  const reset = useCallback(() => { setPicked(null); setLocked(false); }, []);

  const submit = () => {
    if (picked == null || locked) return;
    setLocked(true);
    const ok = String(picked).toUpperCase() === answer;
    setScore((s) => ({ ...s, right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1) }));
  };

  const skip = () => {
    if (locked) { next(); return; }
    setScore((s) => ({ ...s, skipped: s.skipped + 1 }));
    next();
  };

  const next = () => {
    if (i + 1 >= total) { setDone(true); return; }
    setI((n) => n + 1);
    reset();
  };

  const restart = () => {
    setI(0); reset(); setScore({ right: 0, wrong: 0, skipped: 0 }); setDone(false);
  };

  // ── chrome ────────────────────────────────────────────────────────────────
  const Header = ({ right }) => (
    <View style={st.head}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back" style={st.back}>
        <Text style={st.backTxt}>‹</Text>
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.headTitle} numberOfLines={1}>{chapterName || 'Practice'}</Text>
        <Text style={st.headSub} numberOfLines={1}>{subjectName || 'Practice Questions'}</Text>
      </View>
      {right}
    </View>
  );

  if (state.loading) {
    return (
      <SafeAreaView style={st.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.bg }} />}
        <Header />
        <View style={st.center}>
          <ActivityIndicator size="large" color={C.teal} />
          <Text style={st.centerSub}>Loading questions…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.error) {
    return (
      <SafeAreaView style={st.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.bg }} />}
        <Header />
        <View style={st.center}>
          <Text style={st.errTxt}>⚠️  {state.error}</Text>
          <Pressable style={st.retryBtn} onPress={() => setRetry((k) => k + 1)} accessibilityRole="button">
            <Text style={st.retryTxt}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // No gradable question in this chapter yet. Say so plainly rather than opening an
  // empty runner — the keys are backfilled chapter by chapter, so this is temporary
  // and a student should not be left tapping at nothing.
  if (!total) {
    return (
      <SafeAreaView style={st.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.bg }} />}
        <Header />
        <View style={st.center}>
          <Text style={st.emptyTitle}>Not ready yet</Text>
          <Text style={st.centerSub}>
            These practice questions don’t have their answers marked yet, so they can’t be scored.
            Try another chapter — this one will work soon.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    const attempted = score.right + score.wrong;
    const pct = attempted ? Math.round((score.right / attempted) * 100) : 0;
    return (
      <SafeAreaView style={st.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.bg }} />}
        <Header />
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={st.card}>
            <Text style={st.doneTitle}>Chapter complete</Text>
            <Text style={st.doneScore}>{score.right}<Text style={st.doneOf}> / {attempted}</Text></Text>
            <Text style={st.doneSub}>{attempted ? `${pct}% correct` : 'Nothing attempted'}</Text>
            <View style={st.tallyRow}>
              <Tally label="Correct" value={score.right} bg={C.greenSoft} fg={C.green} />
              <Tally label="Wrong" value={score.wrong} bg={C.redSoft} fg={C.red} />
              <Tally label="Skipped" value={score.skipped} bg={C.amberSoft} fg="#8A6D00" />
            </View>
            <Pressable style={st.primaryBtn} onPress={restart} accessibilityRole="button">
              <Text style={st.primaryTxt}>Practise again</Text>
            </Pressable>
            <Pressable style={st.ghostBtn} onPress={onBack} accessibilityRole="button">
              <Text style={st.ghostTxt}>Back to chapters</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const correctPicked = locked && String(picked).toUpperCase() === answer;

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.bg }} />}
      <Header right={<Text style={st.counter}>{i + 1}/{total}</Text>} />

      {/* progress */}
      <View style={st.track}>
        <View style={[st.fill, { width: `${((i + (locked ? 1 : 0)) / total) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        <View style={st.card}>
          <Rich value={q.questionHtml} fontSize={16} />
        </View>

        <View style={{ height: 12 }} />

        {q.options.map((o) => {
          const idx = String(o.idx).toUpperCase();
          const isAnswer = idx === answer;
          const isPicked = picked != null && String(picked).toUpperCase() === idx;

          // Before submitting, only the student's choice is highlighted. After, the
          // correct option is always shown green — including when they skipped it —
          // and a wrong choice is shown red beside it, so the comparison is visible
          // rather than something they have to reconstruct.
          let box = st.opt, bubble = st.bubble, bubbleTxt = st.bubbleTxt, tint = null;
          if (!locked && isPicked) { box = [st.opt, st.optPicked]; bubble = [st.bubble, st.bubblePicked]; bubbleTxt = [st.bubbleTxt, st.bubbleTxtOn]; }
          if (locked && isAnswer) { box = [st.opt, st.optRight]; bubble = [st.bubble, st.bubbleRight]; bubbleTxt = [st.bubbleTxt, st.bubbleTxtOn]; tint = C.green; }
          if (locked && isPicked && !isAnswer) { box = [st.opt, st.optWrong]; bubble = [st.bubble, st.bubbleWrong]; bubbleTxt = [st.bubbleTxt, st.bubbleTxtOn]; tint = C.red; }

          return (
            <Pressable
              key={idx}
              onPress={() => !locked && setPicked(idx)}
              disabled={locked}
              accessibilityRole="radio"
              accessibilityState={{ selected: isPicked, disabled: locked }}
              accessibilityLabel={`Option ${idx}`}
              style={box}
            >
              <View style={bubble}><Text style={bubbleTxt}>{idx}</Text></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Rich value={o.html} fontSize={15} color={tint || C.ink} imgHeight={120} />
              </View>
              {locked && isAnswer && <Text style={[st.mark, { color: C.green }]}>✓</Text>}
              {locked && isPicked && !isAnswer && <Text style={[st.mark, { color: C.red }]}>✕</Text>}
            </Pressable>
          );
        })}

        {locked && (
          <View style={[st.verdict, { backgroundColor: correctPicked ? C.greenSoft : C.redSoft }]}>
            <Text style={[st.verdictTxt, { color: correctPicked ? C.green : C.red }]}>
              {correctPicked ? '✓  Correct' : `✕  Not quite — the answer is ${answer}`}
            </Text>
          </View>
        )}

        {locked && !!q.solutionHtml && String(q.solutionHtml).trim() ? (
          <View style={st.card}>
            <Text style={st.explLabel}>EXPLANATION</Text>
            <Rich value={q.solutionHtml} fontSize={14.5} color={C.muted} />
          </View>
        ) : null}
      </ScrollView>

      {/* action bar */}
      <View style={st.bar}>
        {!locked ? (
          <>
            <Pressable
              style={[st.submit, picked == null && st.submitOff]}
              onPress={submit}
              disabled={picked == null}
              accessibilityRole="button"
              accessibilityLabel="Submit answer"
            >
              <Text style={[st.submitTxt, picked == null && st.submitTxtOff]}>Submit</Text>
            </Pressable>
            <Pressable style={st.skip} onPress={skip} accessibilityRole="button" accessibilityLabel="Skip question">
              <Text style={st.skipTxt}>Skip</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={st.submit} onPress={next} accessibilityRole="button" accessibilityLabel="Next question">
            <Text style={st.submitTxt}>{i + 1 >= total ? 'Finish' : 'Next question'}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function Tally({ label, value, bg, fg }) {
  return (
    <View style={[st.tally, { backgroundColor: bg }]}>
      <Text style={[st.tallyVal, { color: fg }]}>{value}</Text>
      <Text style={[st.tallyLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  head: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  back: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  backTxt: { fontSize: 26, lineHeight: 28, color: C.ink, marginTop: -3 },
  headTitle: { fontSize: 15, fontFamily: FONT.bold, color: C.ink },
  headSub: { fontSize: 11.5, color: C.muted, marginTop: 1 },
  counter: { fontSize: 13, fontFamily: FONT.bold, color: C.teal },

  track: { height: 3, backgroundColor: 'rgba(17,17,17,0.07)' },
  fill: { height: '100%', backgroundColor: C.teal },

  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },

  opt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: C.border, marginBottom: 10,
  },
  optPicked: { borderColor: C.teal, backgroundColor: C.tealSoft },
  optRight: { borderColor: C.green, backgroundColor: C.greenSoft },
  optWrong: { borderColor: C.red, backgroundColor: C.redSoft },

  bubble: {
    width: 30, height: 30, borderRadius: 15, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  bubblePicked: { backgroundColor: C.teal, borderColor: C.teal },
  bubbleRight: { backgroundColor: C.green, borderColor: C.green },
  bubbleWrong: { backgroundColor: C.red, borderColor: C.red },
  bubbleTxt: { fontSize: 13, fontFamily: FONT.bold, color: C.muted },
  bubbleTxtOn: { color: '#FFFFFF' },
  mark: { fontSize: 17, fontFamily: FONT.bold, marginLeft: 4 },

  verdict: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 12 },
  verdictTxt: { fontSize: 14.5, fontFamily: FONT.bold },

  explLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: C.faint, letterSpacing: 0.6, marginBottom: 7 },

  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
  },
  submit: { flex: 1, backgroundColor: C.teal, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitOff: { backgroundColor: '#E3E5ED' },
  submitTxt: { fontSize: 15, fontFamily: FONT.bold, color: '#FFFFFF' },
  submitTxtOff: { color: C.faint },
  skip: { paddingHorizontal: 22, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.border },
  skipTxt: { fontSize: 15, fontFamily: FONT.bold, color: C.muted },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  centerSub: { fontSize: 13.5, color: C.muted, textAlign: 'center', lineHeight: 20 },
  emptyTitle: { fontSize: 17, fontFamily: FONT.bold, color: C.ink },
  errTxt: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
  retryBtn: { borderWidth: 1.5, borderColor: C.teal, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 20 },
  retryTxt: { color: C.teal, fontFamily: FONT.bold },

  doneTitle: { fontSize: 13, fontFamily: FONT.bold, color: C.muted, textAlign: 'center' },
  doneScore: { fontSize: 44, fontFamily: FONT.bold, color: C.ink, textAlign: 'center', marginTop: 6 },
  doneOf: { fontSize: 20, color: C.faint },
  doneSub: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 2 },
  tallyRow: { flexDirection: 'row', gap: 10, marginTop: 18, marginBottom: 18 },
  tally: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  tallyVal: { fontSize: 20, fontFamily: FONT.bold },
  tallyLabel: { fontSize: 11, fontFamily: FONT.bold, marginTop: 2 },
  primaryBtn: { backgroundColor: C.teal, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryTxt: { fontSize: 15, fontFamily: FONT.bold, color: '#FFFFFF' },
  ghostBtn: { paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  ghostTxt: { fontSize: 14, fontFamily: FONT.bold, color: C.muted },
});
