// src/screens/CompleteProfileScreen.js
// Premium, guided profile setup shown once after signup/login when the profile is
// incomplete (scope.complete === false). Matches the OnboardingScreen design language
// (white, progress bar, emoji bubble, grid/chip/card selectors, dark Next button) —
// deliberately NOT a plain black form. Collects role → class → stream (11/12) → board
// → language for students; role only for parents/teachers. Saves to the backend, which
// is the authority; navigation advances automatically once scope.complete flips true.
import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity,
  Animated, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { normalizeClass } from '../utils/personalization';

const ROLE_OPTIONS = [
  { key: 'student', label: 'Student', icon: '🎒', sub: 'I want to learn' },
  { key: 'parent',  label: 'Parent',  icon: '👨‍👩‍👧', sub: "Track my child's progress" },
  { key: 'teacher', label: 'Teacher', icon: '🧑‍🏫', sub: 'I teach students' },
];
const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const STREAMS = [
  { key: 'PCM',      label: 'PCM',  sub: 'Physics · Chemistry · Maths',    icon: '📐' },
  { key: 'PCB',      label: 'PCB',  sub: 'Physics · Chemistry · Biology',  icon: '🧬' },
  { key: 'PCMB',     label: 'PCMB', sub: 'All four subjects',              icon: '🔬' },
  { key: 'Commerce', label: 'Commerce', sub: 'Accounts · Business · Eco',  icon: '📊' },
  { key: 'Arts',     label: 'Arts / Humanities', sub: 'History · Pol Sci · Geo', icon: '🎨' },
];
const BOARDS = ['CBSE', 'ICSE', 'State Board', 'Other'];
const LANGS = [
  { key: 'English',  label: 'English',  icon: '🇬🇧' },
  { key: 'Hindi',    label: 'Hindi',    icon: '🇮🇳' },
  { key: 'Hinglish', label: 'Hinglish', icon: '💬' },
];

export default function CompleteProfileScreen() {
  const { scope, user, updateProfile } = useAuth();
  const [role, setRole]     = useState(scope?.role === 'parent' || scope?.role === 'teacher' ? scope.role : (scope?.role === 'student' ? 'student' : null));
  const [klass, setKlass]   = useState(scope?.classNum ? String(scope.classNum) : null);
  const [stream, setStream] = useState(scope?.stream ? scope.stream.toUpperCase() : null);
  const [board, setBoard]   = useState(user?.board || null);
  const [language, setLanguage] = useState(user?.language || null);
  const [index, setIndex]   = useState(0);
  const [saving, setSaving] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;

  const senior = role === 'student' && normalizeClass(klass) >= 11;

  // Steps are computed from the current role/class so the flow adapts live.
  const steps = useMemo(() => {
    const s = [{
      key: 'role', emoji: '👋', type: 'role',
      question: 'Who are you?',
      subtitle: "Let's set up your account so everything fits you.",
    }];
    if (role === 'student') {
      s.push({ key: 'class', emoji: '🎓', type: 'grid',
        question: 'What class are you in?',
        subtitle: "We'll match every lesson, quiz and test to your class." });
      if (senior) {
        s.push({ key: 'stream', emoji: '🧪', type: 'stream',
          question: 'Which stream?',
          subtitle: 'This decides your subjects for Class 11–12.' });
      }
      s.push({ key: 'board', emoji: '🏫', type: 'chips',
        question: 'Which board?',
        subtitle: 'So your syllabus and papers match your school.' });
      s.push({ key: 'language', emoji: '🗣️', type: 'lang',
        question: 'Preferred language?',
        subtitle: 'Your AI Teacher will explain in this language.' });
    }
    return s;
  }, [role, senior]);

  const safeIndex = Math.min(index, steps.length - 1);
  const current = steps[safeIndex];
  const isLast = safeIndex === steps.length - 1;
  const progress = ((safeIndex + 1) / steps.length) * 100;

  const animate = () => {
    slide.setValue(40);
    Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  };

  const canProceed = () => {
    switch (current.key) {
      case 'role':     return !!role;
      case 'class':    return !!klass;
      case 'stream':   return !!stream;
      case 'board':    return !!board;
      case 'language': return !!language;
      default:         return true;
    }
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const patch = { accountType: role };
      if (role === 'student') {
        patch.grade = `Class ${normalizeClass(klass)}`;
        patch.stream = senior ? stream : '';
        patch.board = board || undefined;
        patch.language = language || undefined;
      }
      console.log('[COMPLETE] save role=', role, '| patch=', JSON.stringify(patch)); // TEMP diag
      const data = await updateProfile(patch);
      console.log('[COMPLETE] saved -> scope.role=', data?.scope?.role, '| account_type=', data?.user?.account_type); // TEMP diag
      // Navigation re-evaluates automatically once scope.complete flips true.
    } catch (e) {
      console.log('[COMPLETE] save FAILED', e?.response?.status, e?.response?.data || e?.message); // TEMP diag
      Alert.alert('Could not save', e?.response?.data?.error || e?.response?.data?.message || e.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!canProceed() || saving) return;
    if (isLast) { save(); return; }
    animate();
    setIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const back = () => {
    if (safeIndex === 0) return;
    animate();
    setIndex((i) => i - 1);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={s.topBar}>
        <TouchableOpacity onPress={back} style={[s.backCircle, safeIndex === 0 && s.hidden]} disabled={safeIndex === 0}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={s.barBg}><View style={[s.barFill, { width: `${progress}%` }]} /></View>
      </View>

      <Animated.ScrollView
        style={{ transform: [{ translateX: slide }] }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.emojiRow}>
          <View style={s.emojiCircle}><Text style={s.emojiText}>{current.emoji}</Text></View>
          <View style={s.bubble}><Text style={s.bubbleText}>{current.subtitle}</Text></View>
        </View>

        <Text style={s.question}>{current.question}</Text>

        {/* Role — big cards */}
        {current.type === 'role' && (
          <View style={s.cardsWrap}>
            {ROLE_OPTIONS.map((r) => {
              const sel = role === r.key;
              return (
                <TouchableOpacity key={r.key} style={[s.card, sel && s.cardSel]} activeOpacity={0.85}
                  onPress={() => { setRole(r.key); }}>
                  <Text style={s.cardIcon}>{r.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, sel && s.cardTextSel]}>{r.label}</Text>
                    <Text style={[s.cardSub, sel && s.cardSubSel]}>{r.sub}</Text>
                  </View>
                  {sel && <Text style={s.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Class — grid */}
        {current.type === 'grid' && (
          <View style={s.grid}>
            {CLASSES.map((c) => {
              const sel = klass === c;
              return (
                <TouchableOpacity key={c} style={[s.gridItem, sel && s.gridItemSel]} activeOpacity={0.8}
                  onPress={() => { setKlass(c); if (normalizeClass(c) < 11) setStream(null); }}>
                  <Text style={[s.gridText, sel && s.gridTextSel]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Stream — cards */}
        {current.type === 'stream' && (
          <View style={s.cardsWrap}>
            {STREAMS.map((r) => {
              const sel = stream === r.key;
              return (
                <TouchableOpacity key={r.key} style={[s.card, sel && s.cardSel]} activeOpacity={0.85}
                  onPress={() => setStream(r.key)}>
                  <Text style={s.cardIcon}>{r.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, sel && s.cardTextSel]}>{r.label}</Text>
                    <Text style={[s.cardSub, sel && s.cardSubSel]}>{r.sub}</Text>
                  </View>
                  {sel && <Text style={s.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Board — chips */}
        {current.type === 'chips' && (
          <View style={s.chipsWrap}>
            {BOARDS.map((b) => {
              const sel = board === b;
              return (
                <TouchableOpacity key={b} style={[s.chip, sel && s.chipSel]} activeOpacity={0.8}
                  onPress={() => setBoard(b)}>
                  <Text style={[s.chipText, sel && s.chipTextSel]}>{b}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Language — cards */}
        {current.type === 'lang' && (
          <View style={s.cardsWrap}>
            {LANGS.map((l) => {
              const sel = language === l.key;
              return (
                <TouchableOpacity key={l.key} style={[s.card, sel && s.cardSel]} activeOpacity={0.85}
                  onPress={() => setLanguage(l.key)}>
                  <Text style={s.cardIcon}>{l.icon}</Text>
                  <Text style={[s.cardTitle, { flex: 1 }, sel && s.cardTextSel]}>{l.label}</Text>
                  {sel && <Text style={s.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 130 }} />
      </Animated.ScrollView>

      <View style={s.bottom}>
        <TouchableOpacity style={[s.nextBtn, (!canProceed() || saving) && s.nextBtnOff]}
          onPress={next} activeOpacity={0.9} disabled={!canProceed() || saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.nextText}>{isLast ? 'Finish setup' : 'Continue'}</Text>}
        </TouchableOpacity>
        <Text style={s.counter}>{safeIndex + 1} of {steps.length}</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#fff' },
  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, gap: 12 },
  backCircle:  { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  hidden:      { opacity: 0 },
  backArrow:   { fontSize: 18, color: '#0a0a0a' },
  barBg:       { flex: 1, height: 5, backgroundColor: '#e8e8e8', borderRadius: 3, overflow: 'hidden' },
  barFill:     { height: 5, backgroundColor: '#0a0a0a', borderRadius: 3 },
  scroll:      { paddingHorizontal: 22, paddingTop: 16 },

  emojiRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  emojiCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e0e0e0' },
  emojiText:   { fontSize: 26 },
  bubble:      { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 14, borderTopLeftRadius: 2, padding: 12 },
  bubbleText:  { fontSize: 13, color: '#555', lineHeight: 19 },
  question:    { fontSize: 22, fontWeight: '700', color: '#0a0a0a', marginBottom: 24, lineHeight: 30 },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem:     { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  gridItemSel:  { backgroundColor: '#0a0a0a', borderColor: '#0a0a0a' },
  gridText:     { fontSize: 15, fontWeight: '600', color: '#333' },
  gridTextSel:  { color: '#fff' },

  chipsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip:         { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1.5, borderColor: '#e0e0e0', backgroundColor: '#fff' },
  chipSel:      { backgroundColor: '#0a0a0a', borderColor: '#0a0a0a' },
  chipText:     { fontSize: 13, color: '#444', fontWeight: '500' },
  chipTextSel:  { color: '#fff' },

  cardsWrap:    { gap: 12 },
  card:         { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#e0e0e0', backgroundColor: '#fff', gap: 14 },
  cardSel:      { backgroundColor: '#0a0a0a', borderColor: '#0a0a0a' },
  cardIcon:     { fontSize: 24 },
  cardTitle:    { fontSize: 15.5, color: '#1a1a1a', fontWeight: '700' },
  cardSub:      { fontSize: 12.5, color: '#888', fontWeight: '500', marginTop: 2 },
  cardTextSel:  { color: '#fff' },
  cardSubSel:   { color: '#c9c9c9' },
  check:        { fontSize: 16, color: '#fff', fontWeight: '700' },

  bottom:       { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 22, paddingBottom: 36, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e8e8e8' },
  nextBtn:      { backgroundColor: '#0a0a0a', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  nextBtnOff:   { opacity: 0.25 },
  nextText:     { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  counter:      { fontSize: 12, color: '#aaa', textAlign: 'center' },
});
