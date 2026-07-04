// src/screens/braingym/TimedNumericQuizScreen.js
//
// 60-second timed numeric quiz for Brain Gym — olive/gold "exam board" UI:
//   - 3·2·1 countdown intro
//   - olive→gold gradient board with faint grid, question, "Enter Answer…" pill
//   - circular keypad ( . - ⌫ / 1-5 / 6-0 ) + bottom SUBMIT bar
//   - "All Done!" transition, then the reward / badge screen
//
// Props: { level, skill, onComplete, onExit, onViewArena }
// NOTE: UI-only styling layer. Timer, sound, scoring and result-saving logic
// are unchanged.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Animated, ScrollView, Dimensions,
} from 'react-native';
import { initSounds, playLoop, playSound, stopSound } from '../../utils/sound';
import { submitBrainGymResult, getBrainGymQuestions, submitBrainGymAttempts } from '../../api/brainGymApi';
import { pickQuestions } from '../../data/brainGymQuestions';

const { width: SCREEN_W } = Dimensions.get('window');
const DURATION = 60;
const NUM_QUESTIONS = 5;
const XP_PER_CORRECT = 10;

const SKILL_META = {
  reasoning:     { emoji: '🧠', label: 'Reasoning',     color: '#A855F7', glow: '#C084FC' },
  application:   { emoji: '⚙️', label: 'Application',   color: '#F59E0B', glow: '#FCD34D' },
  understanding: { emoji: '💡', label: 'Understanding', color: '#22C55E', glow: '#4ADE80' },
  fluency:       { emoji: '⚡', label: 'Fluency',       color: '#06B6D4', glow: '#22D3EE' },
};
const LEVEL_NAME = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };

// Smooth faux gradient (no extra library): interpolate the color stops into many
// thin bands so there are no visible hard stripes.
const hexToRgb = (h) => { const x = h.replace('#', ''); return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)]; };
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const buildGradient = (stops, steps = 48) => {
  const segs = stops.length - 1;
  const out = [];
  for (let i = 0; i < steps; i++) {
    const p = (i / (steps - 1)) * segs;
    const si = Math.min(segs - 1, Math.floor(p));
    const t = p - si;
    const c0 = hexToRgb(stops[si]);
    const c1 = hexToRgb(stops[si + 1]);
    out.push(`rgb(${lerp(c0[0], c1[0], t)},${lerp(c0[1], c1[1], t)},${lerp(c0[2], c1[2], t)})`);
  }
  return out;
};
const GradientBg = ({ colors }) => (
  <View style={StyleSheet.absoluteFill}>
    {colors.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
  </View>
);
// Dark/olive holds the top ~half, then ramps smoothly to gold at the bottom.
const G_NORMAL  = buildGradient(['#0A0A08', '#0C0B08', '#100D08', '#171208', '#2A200E', '#4E3D16', '#86671E', '#B68C26']);
const G_CORRECT = buildGradient(['#07110A', '#0A1A0D', '#102C16', '#1C481E', '#2E6E26', '#4F9A30']);
const G_WRONG   = buildGradient(['#140607', '#1C0A0C', '#301015', '#4E1C1C', '#7A2A20', '#9C3A2A']);

// Faint exam-paper grid behind the board.
const GridOverlay = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {Array.from({ length: 6 }).map((_, i) => (
      <View key={`v${i}`} style={[st.gridV, { left: `${((i + 1) * 100) / 7}%` }]} />
    ))}
    {Array.from({ length: 11 }).map((_, i) => (
      <View key={`h${i}`} style={[st.gridH, { top: `${((i + 1) * 100) / 12}%` }]} />
    ))}
  </View>
);

// Keypad layout: row1 has . and − on the left, ⌫ on the right.
const ROWS = [
  ['.', '-', null, null, 'del'],
  ['1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '0'],
];
const KP_PAD = 22;
const KP_GAP = 12;
const CIRCLE = Math.min(54, Math.floor((SCREEN_W - KP_PAD * 2 - KP_GAP * 4) / 5));

const TimedNumericQuizScreen = ({ level = 1, skill = 'reasoning', onComplete, onExit, onViewArena }) => {
  const lvl = [1, 2, 3].includes(level) ? level : 1;
  const meta = SKILL_META[skill] || SKILL_META.reasoning;

  // Questions: start from the LOCAL seed bank immediately (offline-safe), then try
  // to upgrade to adaptive backend questions during the countdown. The student
  // never sees the source. Backend answers are numeric, exactly like the seed —
  // so the numeric keypad comparison below is unchanged.
  const [qs, setQs] = useState(() => pickQuestions({ skill, level: lvl, count: NUM_QUESTIONS }));

  // Per-question metadata (id/seedId/source) for attempt telemetry — aligned with
  // qs by index. Entries are null for local-seed questions (no server id to log).
  const qMetaRef = useRef(null);
  const startedRef = useRef(false);   // true once the quiz phase begins (locks qs)
  const qShownAtRef = useRef(0);      // timestamp the current question became visible
  const attemptsRef = useRef([]);     // [{ index, isCorrect, answerGiven, timeMs }]

  // Fetch adaptive questions once; only apply BEFORE the quiz starts so we never
  // swap questions mid-round. Falls back silently to the local seed on any error.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getBrainGymQuestions({ skill, count: NUM_QUESTIONS });
      if (cancelled || startedRef.current || !data || !Array.isArray(data.questions) || !data.questions.length) return;
      let nextQs = data.questions
        .filter((x) => x && x.q != null && Number.isFinite(Number(x.answer)))
        .map((x) => ({ q: x.q, answer: Number(x.answer) }));
      let meta = data.questions
        .filter((x) => x && x.q != null && Number.isFinite(Number(x.answer)))
        .map((x) => ({ id: x.id || null, seedId: x.seedId || null, source: x.source || 'generated', category: x.category || skill, difficulty: x.difficulty || data.difficulty }));
      // Guarantee a full round — top up from the local seed if the backend returned fewer.
      if (nextQs.length < NUM_QUESTIONS) {
        const extra = pickQuestions({ skill, level: lvl, count: NUM_QUESTIONS - nextQs.length });
        nextQs = nextQs.concat(extra.map((e) => ({ q: e.q, answer: e.answer })));
        meta = meta.concat(extra.map(() => null));
      }
      if (cancelled || startedRef.current) return;
      qMetaRef.current = meta.slice(0, NUM_QUESTIONS);
      setQs(nextQs.slice(0, NUM_QUESTIONS));
    })();
    return () => { cancelled = true; };
  }, [skill, lvl]);

  const [phase, setPhase]       = useState('intro');   // 'intro' | 'quiz'
  const [countdown, setCountdown] = useState(3);
  const [finishing, setFinishing] = useState(false);   // brief "All Done!" screen

  const [index, setIndex]       = useState(0);
  const [input, setInput]       = useState('');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [done, setDone]         = useState(false);
  const [score, setScore]       = useState(0);
  const [answered, setAnswered] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [timeTakenSec, setTimeTakenSec] = useState(0); // display only
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'failed'

  const lastPayloadRef = useRef(null);

  const doneRef    = useRef(false);
  const mountedRef = useRef(true);
  const scoreRef   = useRef(0);
  const answeredRef = useRef(0);
  const timeLeftRef = useRef(DURATION);
  const pop = useRef(new Animated.Value(0)).current; // feedback pop animation

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { answeredRef.current = answered; }, [answered]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  // Mount/unmount guard.
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // POST the result to the backend. Reusable so the reward screen can retry.
  const saveResult = useCallback((payload) => {
    lastPayloadRef.current = payload;
    setSaveState('saving');
    return submitBrainGymResult(payload)
      .then((res) => {
        if (!mountedRef.current) return;
        if (res && typeof res.xpEarned === 'number') setXpEarned(res.xpEarned);
        setSaveState('saved');
      })
      .catch(() => { if (mountedRef.current) setSaveState('failed'); });
  }, []);

  const finish = useCallback((reason) => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopSound('tick');
    playSound(reason === 'timeup' ? 'timeout' : 'success'); // gentle timeout vs. all-done chime
    setFinishing(true); // show "All Done!" briefly, then the reward screen

    const correct = scoreRef.current;
    const total = (qs && qs.length) || NUM_QUESTIONS;
    const wrong = Math.max(0, answeredRef.current - correct);
    const taken = Math.min(DURATION, Math.max(0, DURATION - timeLeftRef.current));
    setTimeTakenSec(taken);
    setXpEarned(correct * XP_PER_CORRECT); // optimistic; replaced by server value below

    saveResult({ skill, level: lvl, totalQuestions: total, correctCount: correct, wrongCount: wrong, timeTakenSec: taken });

    // Per-question attempt telemetry (only for server-sourced questions that carry
    // an id/seedId). Fire-and-forget — never affects the reward screen.
    const meta = qMetaRef.current;
    if (meta) {
      const items = attemptsRef.current
        .filter((a) => meta[a.index])
        .map((a) => ({ ...meta[a.index], isCorrect: a.isCorrect, answerGiven: a.answerGiven, timeMs: a.timeMs }));
      if (items.length) submitBrainGymAttempts({ items });
    }

    setTimeout(() => { if (mountedRef.current) setDone(true); }, 1400);
  }, [qs, skill, lvl, saveResult]);

  // 3·2·1 countdown intro, then start the quiz.
  useEffect(() => {
    if (phase !== 'intro') return undefined;
    if (countdown <= 0) { setPhase('quiz'); return undefined; }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, countdown]);

  // Lock the question set once the quiz starts, and (re)start the per-question
  // timer whenever a new question is shown — used for attempt telemetry. A soft
  // pop plays automatically as each new question appears.
  useEffect(() => {
    if (phase === 'quiz') { startedRef.current = true; qShownAtRef.current = Date.now(); playSound('pop'); }
  }, [phase, index]);

  // Start the countdown timer once the quiz begins (preload sounds up front).
  useEffect(() => {
    if (phase !== 'quiz') return undefined;
    initSounds();
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => { clearInterval(id); stopSound('tick'); };
  }, [phase]);

  // Soft tick ONLY in the final 5 seconds — one per second, automatically.
  useEffect(() => {
    if (phase === 'quiz' && !doneRef.current && timeLeft > 0 && timeLeft <= 5) playSound('tick');
  }, [phase, timeLeft]);

  // End when the timer hits zero → gentle "time up" sound.
  useEffect(() => {
    if (phase === 'quiz' && timeLeft === 0 && !doneRef.current) finish('timeup');
  }, [phase, timeLeft, finish]);

  const runPop = () => {
    pop.setValue(0);
    Animated.sequence([
      Animated.timing(pop, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(pop, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start();
  };

  const locked = !!feedback || done || finishing;

  const submit = () => {
    if (locked || input === '' || input === '-') return;
    const correct = Number(input) === qs[index].answer;
    attemptsRef.current.push({
      index,
      isCorrect: correct,
      answerGiven: input,
      timeMs: Math.max(0, Date.now() - (qShownAtRef.current || Date.now())),
    });
    setAnswered((n) => n + 1);
    setFeedback(correct ? 'correct' : 'wrong');
    runPop();
    if (correct) { setScore((n) => n + 1); playSound('correct'); }
    else { playSound('wrong'); }

    const delay = correct ? 550 : 1000;
    setTimeout(() => {
      if (!mountedRef.current) return;
      setFeedback(null);
      setInput('');
      if (index + 1 >= qs.length) finish();
      else setIndex((i) => i + 1);
    }, delay);
  };

  const onKey = (k) => {
    if (locked) return;
    playSound('tap'); // subtle keypad tap
    if (k === 'del') { setInput((str) => str.slice(0, -1)); return; }
    setInput((str) => (str.length >= 6 ? str : str + k));
  };

  const exit = () => { stopSound('tick'); onExit && onExit(); };

  const mmss = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`;
  const grad = feedback === 'correct' ? G_CORRECT : feedback === 'wrong' ? G_WRONG : G_NORMAL;
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  // ── Countdown intro ──
  if (phase === 'intro') {
    return (
      <SafeAreaView style={st.introSafe}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={st.introWrap}>
          <Text style={st.countNum}>{countdown > 0 ? countdown : 'Go!'}</Text>
          <Text style={st.introMsg}>You have 60 seconds!{'\n'}Be quick and accurate to clear the challenge.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── "All Done!" transition ──
  if (finishing && !done) {
    return (
      <SafeAreaView style={st.introSafe}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={st.introWrap}>
          <View style={st.donePill}><Text style={st.doneTxt}>All Done!</Text></View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Reward / badge screen ──
  if (done) {
    const total = qs.length;
    const pct = total ? Math.round((score / total) * 100) : 0;
    const stars = pct >= 80 ? 3 : pct >= 50 ? 2 : pct > 0 ? 1 : 0;
    const badge = pct >= 80
      ? { emoji: '🥇', name: 'Gold',   color: '#FDE047' }
      : pct >= 50
        ? { emoji: '🥈', name: 'Silver', color: '#CBD5E1' }
        : { emoji: '🥉', name: 'Bronze', color: '#D9A066' };
    const line = pct >= 80 ? 'Awesome!' : pct >= 50 ? 'Great work!' : pct > 0 ? 'Good try!' : 'Keep practising!';
    const rows = [
      { icon: '⭐', label: 'Score',      value: `${score} / ${total}`,            color: '#FDE047' },
      { icon: '🎯', label: 'Accuracy',   value: `${pct}%`,                        color: '#34D399' },
      { icon: '⏱', label: 'Time Taken',  value: `${timeTakenSec}s`,               color: '#60A5FA' },
      { icon: '⚡', label: 'XP Earned',   value: `+${xpEarned} XP`,                color: meta.glow },
      { icon: meta.emoji, label: 'Skill', value: meta.label,                      color: meta.glow },
      { icon: '🛡', label: 'Level',       value: `${lvl} (${LEVEL_NAME[lvl] || ''})`, color: '#A855F7' },
    ];
    return (
      <SafeAreaView style={st.safe}>
        <GradientBg colors={G_NORMAL} />
        <StatusBar barStyle="light-content" />
        {Platform.OS === 'android' && <View style={{ height: 24 }} />}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.rewardScroll}>
          <Text style={st.rewardHeader}>Workout Complete! 🎉</Text>

          <View style={[st.badgeRing, { borderColor: badge.color, shadowColor: badge.color }]}>
            <Text style={st.badgeEmoji}>{badge.emoji}</Text>
          </View>
          <Text style={[st.rewardLine, { color: badge.color }]}>{line}</Text>
          <Text style={st.badgeName}>{badge.name} Badge</Text>

          <View style={st.stars}>
            {[0, 1, 2].map((i) => <Text key={i} style={[st.star, i >= stars && st.starOff]}>★</Text>)}
          </View>

          <View style={st.statsCard}>
            {rows.map((r, i) => (
              <View key={r.label} style={[st.statRow, i < rows.length - 1 && st.statDiv]}>
                <Text style={st.statIcon}>{r.icon}</Text>
                <Text style={st.statLabel}>{r.label}</Text>
                <Text style={[st.statValue, { color: r.color }]}>{r.value}</Text>
              </View>
            ))}
          </View>

          <View style={st.perfRow}>
            {Array.from({ length: total }).map((_, i) => (
              <View key={i} style={[st.perfDot, i < score ? st.perfOk : st.perfBad]}>
                <Text style={st.perfDotTxt}>{i < score ? '✓' : '✕'}</Text>
              </View>
            ))}
          </View>

          {saveState === 'failed' && (
            <View style={st.saveFail}>
              <Text style={st.saveFailTxt}>Progress couldn't be saved. Please try again.</Text>
              <TouchableOpacity style={st.saveRetryBtn} activeOpacity={0.9}
                onPress={() => lastPayloadRef.current && saveResult(lastPayloadRef.current)}>
                <Text style={st.saveRetryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {saveState === 'saving' && <Text style={st.saveHint}>Saving your progress…</Text>}
          {saveState === 'saved' && <Text style={st.saveHintOk}>Progress saved ✓</Text>}

          <TouchableOpacity style={st.primaryBtn} activeOpacity={0.9} onPress={() => onComplete && onComplete()}>
            <Text style={st.primaryBtnTxt}>Continue  🔄</Text>
          </TouchableOpacity>
          {onViewArena && (
            <TouchableOpacity style={st.secondaryBtn} activeOpacity={0.9} onPress={() => onViewArena()}>
              <Text style={st.secondaryBtnTxt}>View Arena  🏆</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={exit}><Text style={st.rewardExit}>Back to Home  🏠</Text></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const q = qs[index] || { q: '', answer: 0 };
  const progress = qs.length ? (index / qs.length) * 100 : 0;

  // ── Quiz board ──
  return (
    <SafeAreaView style={st.safe}>
      <GradientBg colors={grad} />
      <GridOverlay />
      <StatusBar barStyle="light-content" />
      {Platform.OS === 'android' && <View style={{ height: 24 }} />}

      {/* Top bar: close + timer */}
      <View style={st.top}>
        <TouchableOpacity style={st.exitBtn} onPress={exit}><Text style={st.exitTxt}>✕</Text></TouchableOpacity>
        <View style={{ flex: 1 }} />
        <View style={[st.timer, timeLeft <= 10 && st.timerLow]}>
          <Text style={st.timerTxt}>⏱ {mmss}</Text>
        </View>
      </View>

      {/* Progress line */}
      <View style={st.progRow}>
        <View style={st.progTrack}><View style={[st.progFill, { width: `${progress}%` }]} /></View>
        <Text style={st.progTxt}>{index + 1}/{qs.length}</Text>
      </View>

      {/* Question */}
      <View style={st.qWrap}>
        <Text style={st.qText}>{q.q}</Text>
      </View>

      {/* Answer pill */}
      <View style={st.pillWrap}>
        <Animated.View style={[
          st.pill,
          feedback === 'correct' && st.pillOk,
          feedback === 'wrong' && st.pillBad,
          { transform: [{ scale: popScale }] },
        ]}>
          <Text style={[st.pillTxt, input === '' && st.pillPlaceholder]}>
            {input === '' ? 'Enter Answer…' : input}
          </Text>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      {/* Circular keypad */}
      <View style={st.pad}>
        {ROWS.map((row, ri) => (
          <View key={ri} style={st.padRow}>
            {row.map((k, ci) => {
              if (!k) return <View key={ci} style={{ width: CIRCLE, height: CIRCLE }} />;
              const isDel = k === 'del';
              return (
                <TouchableOpacity
                  key={ci}
                  activeOpacity={0.8}
                  disabled={locked}
                  onPress={() => onKey(k)}
                  style={[
                    st.circle,
                    isDel && st.circleAccent,
                    { width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2 },
                    locked && { opacity: 0.5 },
                  ]}
                >
                  <Text style={[st.circleTxt, isDel && st.circleAccentTxt]}>{isDel ? '⌫' : k}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Submit bar */}
      <TouchableOpacity
        style={st.submitBar}
        activeOpacity={0.85}
        disabled={locked || input === '' || input === '-'}
        onPress={submit}
      >
        <Text style={[st.submitTxt, (locked || input === '' || input === '-') && st.submitDim]}>SUBMIT</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B09' },

  // intro / all-done
  introSafe: { flex: 1, backgroundColor: '#000' },
  introWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  countNum: { color: '#fff', fontSize: 130, fontWeight: '900', letterSpacing: 4, marginBottom: 30, textShadowColor: 'rgba(255,255,255,0.15)', textShadowRadius: 24 },
  introMsg: { color: '#B9B9C2', fontSize: 16, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  donePill: { backgroundColor: 'rgba(20,20,16,0.9)', borderRadius: 22, paddingVertical: 18, paddingHorizontal: 40 },
  doneTxt: { color: '#39D98A', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },

  // grid
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.045)' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.045)' },

  // top
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  exitBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  exitTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
  timer: { flexDirection: 'row', backgroundColor: 'rgba(26,21,48,0.6)', borderWidth: 1.5, borderColor: '#6D28D9', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  timerLow: { backgroundColor: 'rgba(42,14,18,0.7)', borderColor: '#EF4444' },
  timerTxt: { color: '#D7C9FF', fontSize: 13, fontWeight: '900' },

  // progress
  progRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, marginTop: 2 },
  progTrack: { flex: 1, height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 4, backgroundColor: '#fff' },
  progTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '800' },

  // question
  qWrap: { paddingHorizontal: 26, paddingTop: 26, alignItems: 'center' },
  qText: { color: '#fff', fontSize: 19, fontWeight: '800', textAlign: 'center', lineHeight: 27, letterSpacing: -0.2 },

  // answer pill
  pillWrap: { alignItems: 'center', marginTop: 36 },
  pill: { minWidth: SCREEN_W * 0.6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 18, paddingHorizontal: 30 },
  pillOk: { borderColor: '#39D98A', backgroundColor: 'rgba(6,32,15,0.5)' },
  pillBad: { borderColor: '#F43F5E', backgroundColor: 'rgba(32,10,16,0.5)' },
  pillTxt: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  pillPlaceholder: { color: 'rgba(255,255,255,0.45)', fontSize: 17, fontWeight: '700', letterSpacing: 0 },

  // keypad
  pad: { paddingHorizontal: KP_PAD, gap: KP_GAP, marginBottom: 10, alignSelf: 'center', width: '100%', maxWidth: 420 },
  padRow: { flexDirection: 'row', justifyContent: 'space-between' },
  circle: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.30)' },
  circleAccent: { borderColor: '#8B6CFF', backgroundColor: 'rgba(48,36,96,0.6)' },
  circleTxt: { color: '#F6F1DC', fontSize: 21, fontWeight: '800' },
  circleAccentTxt: { color: '#CDBCFF' },

  // submit
  submitBar: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.28)' },
  submitTxt: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  submitDim: { color: 'rgba(255,255,255,0.45)' },

  // ── Reward ──
  rewardScroll: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 30 },
  rewardHeader: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 18 },
  badgeRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', shadowOpacity: 0.8, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  badgeEmoji: { fontSize: 62 },
  rewardLine: { fontSize: 28, fontWeight: '900', marginTop: 14 },
  badgeName: { color: '#D8CBA6', fontSize: 13, fontWeight: '800', marginTop: 2 },
  stars: { flexDirection: 'row', gap: 8, marginTop: 12 },
  star: { fontSize: 34, color: '#FDE047' },
  starOff: { color: 'rgba(255,255,255,0.18)' },

  statsCard: { width: '100%', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', marginTop: 20, paddingHorizontal: 16 },
  statRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  statDiv: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  statIcon: { fontSize: 16, width: 26 },
  statLabel: { flex: 1, color: '#E7E0CC', fontSize: 14, fontWeight: '700' },
  statValue: { fontSize: 15, fontWeight: '900' },

  perfRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  perfDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  perfOk: { backgroundColor: 'rgba(14,42,22,0.7)', borderWidth: 1.5, borderColor: '#22C55E' },
  perfBad: { backgroundColor: 'rgba(42,14,18,0.7)', borderWidth: 1.5, borderColor: '#F43F5E' },
  perfDotTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },

  saveFail: { alignItems: 'center', marginTop: 18, paddingHorizontal: 8 },
  saveFailTxt: { color: '#FECACA', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  saveRetryBtn: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 26 },
  saveRetryTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  saveHint: { color: '#C9BE9C', fontSize: 12, fontWeight: '800', marginTop: 16 },
  saveHintOk: { color: '#9BE6B8', fontSize: 12, fontWeight: '800', marginTop: 16 },

  primaryBtn: { width: '100%', backgroundColor: '#FDE047', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 22, shadowColor: '#FDE047', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  primaryBtnTxt: { color: '#1E1B05', fontSize: 16, fontWeight: '900' },
  secondaryBtn: { width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1.5, borderColor: '#6D28D9', borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  secondaryBtnTxt: { color: '#C4B5FD', fontSize: 15, fontWeight: '900' },
  rewardExit: { color: '#C9BE9C', fontSize: 13, fontWeight: '800', marginTop: 18 },
});

export default TimedNumericQuizScreen;
