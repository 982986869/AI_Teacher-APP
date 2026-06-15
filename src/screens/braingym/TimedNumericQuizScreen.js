// src/screens/braingym/TimedNumericQuizScreen.js
//
// Premium dark-neon 60-second timed numeric quiz for Brain Gym.
//   - questions are local (src/data/brainGymQuestions.js), picked by (level, skill)
//   - numeric keypad + typed answer + submit, animated correct/wrong glow
//   - each question scored once (first answer counts); accurate final score
//   - reward / badge screen at the end (badge + stars + stats); result POSTed
//   - sounds: playLoop('tick') during countdown, stop on end/exit, correct/wrong,
//     success on completion
//
// Props: { level, skill, onComplete, onExit, onViewArena }
// NOTE: UI-only styling layer. Timer, sound, scoring and result-saving logic
// are unchanged.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Animated, ScrollView,
} from 'react-native';
import { initSounds, playLoop, playSound, stopSound } from '../../utils/sound';
import { submitBrainGymResult } from '../../api/brainGymApi';
import { pickQuestions } from '../../data/brainGymQuestions';

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

// Faux gradient (stacked bands — no extra library). Dark, not bright.
const GradientBg = ({ colors }) => (
  <View style={StyleSheet.absoluteFill}>
    {colors.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
  </View>
);
const G_NORMAL  = ['#0A0A12', '#0E0E1A', '#0B0B14'];
const G_CORRECT = ['#06140C', '#0A2012', '#06140C'];
const G_WRONG   = ['#160608', '#220A10', '#160608'];

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'clr'];

const TimedNumericQuizScreen = ({ level = 1, skill = 'reasoning', onComplete, onExit, onViewArena }) => {
  const lvl = [1, 2, 3].includes(level) ? level : 1;
  const meta = SKILL_META[skill] || SKILL_META.reasoning;

  // Questions are local: filter by skill (+ level), pick a random 5.
  const qs = useMemo(() => pickQuestions({ skill, level: lvl, count: NUM_QUESTIONS }), [skill, lvl]);

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

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopSound('tick');
    setDone(true);
    playSound('success');

    const correct = scoreRef.current;
    const total = (qs && qs.length) || NUM_QUESTIONS;
    const wrong = Math.max(0, answeredRef.current - correct);
    const taken = Math.min(DURATION, Math.max(0, DURATION - timeLeftRef.current));
    setTimeTakenSec(taken);
    setXpEarned(correct * XP_PER_CORRECT); // optimistic; replaced by server value below

    saveResult({ skill, level: lvl, totalQuestions: total, correctCount: correct, wrongCount: wrong, timeTakenSec: taken });
  }, [qs, skill, lvl, saveResult]);

  // Start timer + ticking sound on mount.
  useEffect(() => {
    initSounds().then(() => { if (mountedRef.current && !doneRef.current) playLoop('tick'); });
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => { clearInterval(id); stopSound('tick'); };
  }, []);

  // End when the timer hits zero.
  useEffect(() => {
    if (timeLeft === 0 && !doneRef.current) finish();
  }, [timeLeft, finish]);

  const runPop = () => {
    pop.setValue(0);
    Animated.sequence([
      Animated.timing(pop, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(pop, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start();
  };

  const locked = !!feedback || done;

  const submit = () => {
    if (locked || input === '') return;
    const correct = Number(input) === qs[index].answer;
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
    if (k === 'del') { setInput((str) => str.slice(0, -1)); return; }
    if (k === 'clr') { setInput(''); return; }
    setInput((str) => (str.length >= 6 ? str : str + k));
  };

  const exit = () => { stopSound('tick'); onExit && onExit(); };

  const mmss = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`;
  const grad = feedback === 'correct' ? G_CORRECT : feedback === 'wrong' ? G_WRONG : G_NORMAL;
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const cardBorder = feedback === 'correct' ? '#22C55E' : feedback === 'wrong' ? '#F43F5E' : meta.color;

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
      <SafeAreaView style={s.safe}>
        <GradientBg colors={G_NORMAL} />
        <StatusBar barStyle="light-content" />
        {Platform.OS === 'android' && <View style={{ height: 24 }} />}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.rewardScroll}>
          <Text style={s.rewardHeader}>Workout Complete! 🎉</Text>

          <View style={[s.badgeRing, { borderColor: badge.color, shadowColor: badge.color }]}>
            <Text style={s.badgeEmoji}>{badge.emoji}</Text>
          </View>
          <Text style={[s.rewardLine, { color: badge.color }]}>{line}</Text>
          <Text style={s.badgeName}>{badge.name} Badge</Text>

          <View style={s.stars}>
            {[0, 1, 2].map((i) => <Text key={i} style={[s.star, i >= stars && s.starOff]}>★</Text>)}
          </View>

          {/* Stats card */}
          <View style={s.statsCard}>
            {rows.map((r, i) => (
              <View key={r.label} style={[s.statRow, i < rows.length - 1 && s.statDiv]}>
                <Text style={s.statIcon}>{r.icon}</Text>
                <Text style={s.statLabel}>{r.label}</Text>
                <Text style={[s.statValue, { color: r.color }]}>{r.value}</Text>
              </View>
            ))}
          </View>

          {/* Performance dots */}
          <View style={s.perfRow}>
            {Array.from({ length: total }).map((_, i) => (
              <View key={i} style={[s.perfDot, i < score ? s.perfOk : s.perfBad]}>
                <Text style={s.perfDotTxt}>{i < score ? '✓' : '✕'}</Text>
              </View>
            ))}
          </View>

          {/* Save status */}
          {saveState === 'failed' && (
            <View style={s.saveFail}>
              <Text style={s.saveFailTxt}>Progress couldn't be saved. Please try again.</Text>
              <TouchableOpacity style={s.saveRetryBtn} activeOpacity={0.9}
                onPress={() => lastPayloadRef.current && saveResult(lastPayloadRef.current)}>
                <Text style={s.saveRetryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {saveState === 'saving' && <Text style={s.saveHint}>Saving your progress…</Text>}
          {saveState === 'saved' && <Text style={s.saveHintOk}>Progress saved ✓</Text>}

          {/* Actions */}
          <TouchableOpacity style={s.primaryBtn} activeOpacity={0.9} onPress={() => onComplete && onComplete()}>
            <Text style={s.primaryBtnTxt}>Continue  🔄</Text>
          </TouchableOpacity>
          {onViewArena && (
            <TouchableOpacity style={s.secondaryBtn} activeOpacity={0.9} onPress={() => onViewArena()}>
              <Text style={s.secondaryBtnTxt}>View Arena  🏆</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={exit}><Text style={s.rewardExit}>Back to Home  🏠</Text></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const q = qs[index];
  const progress = (index / qs.length) * 100;

  return (
    <SafeAreaView style={s.safe}>
      <GradientBg colors={grad} />
      <StatusBar barStyle="light-content" />
      {Platform.OS === 'android' && <View style={{ height: 24 }} />}

      {/* Top bar */}
      <View style={s.top}>
        <TouchableOpacity style={s.exitBtn} onPress={exit}><Text style={s.exitTxt}>✕</Text></TouchableOpacity>
        <Text style={s.skill}>{meta.emoji} {meta.label} · Lvl {lvl}</Text>
        <View style={[s.timer, timeLeft <= 10 && s.timerLow]}>
          <Text style={s.timerTxt}>⏱ {mmss}</Text>
        </View>
      </View>

      {/* Neon progress bar */}
      <View style={s.progRow}>
        <View style={s.progTrack}>
          <View style={[s.progFill, { width: `${progress}%`, backgroundColor: meta.color, shadowColor: meta.glow }]} />
        </View>
        <Text style={s.progTxt}>{index + 1}/{qs.length}</Text>
      </View>

      {/* Question card */}
      <View style={s.qWrap}>
        <Animated.View style={[
          s.qCard,
          { borderColor: cardBorder, shadowColor: cardBorder, transform: [{ scale: popScale }] },
        ]}>
          <Text style={s.qStar}>{feedback === 'correct' ? '🌟' : feedback === 'wrong' ? '💥' : '⭐'}</Text>
          <Text style={s.qTxt}>{q.q}</Text>
          <View style={[
            s.ansBox,
            feedback === 'correct' && s.ansCorrect,
            feedback === 'wrong' && s.ansWrong,
          ]}>
            <Text style={s.ansTxt}>{input === '' ? '—' : input}</Text>
            {feedback === 'correct' && <Text style={s.fbIcon}>✅</Text>}
            {feedback === 'wrong' && <Text style={s.fbIcon}>❌</Text>}
          </View>
        </Animated.View>
      </View>

      {/* Numeric keypad */}
      <View style={s.pad}>
        {KEYS.map((k) => {
          const isDel = k === 'del', isClr = k === 'clr';
          return (
            <TouchableOpacity key={k} activeOpacity={0.8} disabled={locked}
              style={[s.key, (isDel || isClr) && s.keyAlt, locked && { opacity: 0.5 }]} onPress={() => onKey(k)}>
              <Text style={[s.keyTxt, (isDel || isClr) && s.keyAltTxt]}>{isDel ? '⌫' : isClr ? 'C' : k}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Submit */}
      <TouchableOpacity style={[s.submit, locked && { opacity: 0.5 }]} activeOpacity={0.9} disabled={locked} onPress={submit}>
        <Text style={s.submitTxt}>Submit ✏️</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A12' },

  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  exitBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#16161F', borderWidth: 1.5, borderColor: '#2A2A36', alignItems: 'center', justifyContent: 'center' },
  exitTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
  skill: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
  timer: { backgroundColor: '#1A1530', borderWidth: 1.5, borderColor: '#6D28D9', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  timerLow: { backgroundColor: '#2A0E12', borderColor: '#EF4444' },
  timerTxt: { color: '#C4B5FD', fontSize: 13, fontWeight: '900' },

  progRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, marginBottom: 2, marginTop: 4 },
  progTrack: { flex: 1, height: 12, borderRadius: 8, backgroundColor: '#16161F', borderWidth: 1, borderColor: '#26263200', overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 8, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  progTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },

  qWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  qCard: {
    width: '100%', alignItems: 'center', gap: 16, borderRadius: 26, paddingVertical: 30, paddingHorizontal: 22,
    backgroundColor: '#13131D', borderWidth: 2,
    shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  qStar: { fontSize: 30 },
  qTxt: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  ansBox: { minWidth: 180, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 24, backgroundColor: '#0C0C14', borderWidth: 2, borderColor: '#2A2A38' },
  ansCorrect: { backgroundColor: '#06200F', borderColor: '#22C55E' },
  ansWrong: { backgroundColor: '#200A10', borderColor: '#F43F5E' },
  ansTxt: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: 1 },
  fbIcon: { fontSize: 22 },

  pad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  key: { width: '30%', aspectRatio: 2, borderRadius: 16, backgroundColor: '#16161F', borderWidth: 1.5, borderColor: '#2A2A38', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  keyAlt: { backgroundColor: '#1A1530', borderColor: '#4C2A9E' },
  keyTxt: { color: '#E5E7EB', fontSize: 24, fontWeight: '900' },
  keyAltTxt: { color: '#C4B5FD' },

  submit: { marginHorizontal: 16, marginBottom: Platform.OS === 'ios' ? 14 : 22, backgroundColor: '#FDE047', borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: '#FDE047', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  submitTxt: { color: '#1E1B4B', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  // ── Reward ──
  rewardScroll: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 30 },
  rewardHeader: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 18 },
  badgeRing: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#13131D', shadowOpacity: 0.8, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 12,
  },
  badgeEmoji: { fontSize: 62 },
  rewardLine: { fontSize: 28, fontWeight: '900', marginTop: 14 },
  badgeName: { color: '#8E8E93', fontSize: 13, fontWeight: '800', marginTop: 2 },
  stars: { flexDirection: 'row', gap: 8, marginTop: 12 },
  star: { fontSize: 34, color: '#FDE047' },
  starOff: { color: 'rgba(255,255,255,0.18)' },

  statsCard: { width: '100%', backgroundColor: '#13131D', borderRadius: 20, borderWidth: 1.5, borderColor: '#26263200', marginTop: 20, paddingHorizontal: 16 },
  statRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  statDiv: { borderBottomWidth: 1, borderBottomColor: '#20202A' },
  statIcon: { fontSize: 16, width: 26 },
  statLabel: { flex: 1, color: '#C7C7CF', fontSize: 14, fontWeight: '700' },
  statValue: { fontSize: 15, fontWeight: '900' },

  perfRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  perfDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  perfOk: { backgroundColor: '#0E2A16', borderWidth: 1.5, borderColor: '#22C55E' },
  perfBad: { backgroundColor: '#2A0E12', borderWidth: 1.5, borderColor: '#F43F5E' },
  perfDotTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },

  saveFail: { alignItems: 'center', marginTop: 18, paddingHorizontal: 8 },
  saveFailTxt: { color: '#FECACA', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  saveRetryBtn: { marginTop: 10, backgroundColor: '#2A2A38', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 26 },
  saveRetryTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  saveHint: { color: '#8E8E93', fontSize: 12, fontWeight: '800', marginTop: 16 },
  saveHintOk: { color: '#86EFAC', fontSize: 12, fontWeight: '800', marginTop: 16 },

  primaryBtn: { width: '100%', backgroundColor: '#FDE047', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 22, shadowColor: '#FDE047', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  primaryBtnTxt: { color: '#1E1B4B', fontSize: 16, fontWeight: '900' },
  secondaryBtn: { width: '100%', backgroundColor: '#16161F', borderWidth: 1.5, borderColor: '#6D28D9', borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  secondaryBtnTxt: { color: '#C4B5FD', fontSize: 15, fontWeight: '900' },
  rewardExit: { color: '#8E8E93', fontSize: 13, fontWeight: '800', marginTop: 18 },
});

export default TimedNumericQuizScreen;
