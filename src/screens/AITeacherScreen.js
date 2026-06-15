import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, TextInput, Platform,
  KeyboardAvoidingView, Animated, ActivityIndicator, Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { generateLesson, askDoubt } from '../api/aiApi';

// expo-speech is optional at runtime — require defensively so the app still
// works (without voice) if the package isn't installed yet.
// To enable voice run:  npx expo install expo-speech
let Speech = null;
try { Speech = require('expo-speech'); } catch (e) { Speech = null; }
const SPEECH_OK = !!(Speech && typeof Speech.speak === 'function');

const { height: SCREEN_H } = Dimensions.get('window');
const SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'History'];

// Faux warm vertical gradient (cream → orange) built from stacked Views — no lib.
const WARM_BANDS = ['#FFF7EE', '#FFEEDB', '#FFE4C6', '#FFD8AE', '#FFCB98', '#FFBC80'];
const WarmGradient = () => (
  <View style={StyleSheet.absoluteFill}>
    {WARM_BANDS.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
  </View>
);

// ─── Visual renderer: turns visualType/visualData into a simple concept card ────
const Visual = ({ slide }) => {
  const v = slide.visualData || {};
  switch (slide.visualType) {
    case 'FORMULA':
      return (
        <View style={st.vCard}>
          <Text style={st.vFormula}>{v.formula || ''}</Text>
          {Array.isArray(v.variables) && v.variables.map((vr, i) => (
            <Text key={i} style={st.vVar}>
              <Text style={st.vVarSym}>{vr.symbol}</Text>  =  {vr.meaning}
            </Text>
          ))}
          {!!v.explanation && <Text style={st.vSub}>{v.explanation}</Text>}
        </View>
      );
    case 'DIAGRAM':
      return (
        <View style={st.vCard}>
          {!!v.label && <Text style={st.vLabel}>{v.label}</Text>}
          <View style={st.vDiagramRow}>
            {(v.components || []).map((c, i, arr) => (
              <React.Fragment key={i}>
                <View style={st.vBox}><Text style={st.vBoxTxt}>{c}</Text></View>
                {i < arr.length - 1 && <Text style={st.vArrow}>→</Text>}
              </React.Fragment>
            ))}
          </View>
          {!!v.description && <Text style={st.vSub}>{v.description}</Text>}
        </View>
      );
    case 'EXAMPLE':
      return (
        <View style={st.vCard}>
          {!!v.scenario && <Text style={st.vLabel}>{v.scenario}</Text>}
          {(v.steps || []).map((stp, i) => (
            <View key={i} style={st.vStepRow}>
              <View style={st.vNum}><Text style={st.vNumTxt}>{i + 1}</Text></View>
              <Text style={st.vStep}>{stp}</Text>
            </View>
          ))}
        </View>
      );
    case 'ANALOGY':
      return (
        <View style={st.vCard}>
          <Text style={st.vAnalogyObj}>🔗  {v.realWorldObject || ''}</Text>
          <Text style={st.vSub}>{v.comparison || ''}</Text>
        </View>
      );
    case 'CHART': {
      const labels = v?.data?.labels || [];
      const values = v?.data?.values || [];
      const max = Math.max(1, ...values);
      return (
        <View style={st.vCard}>
          <View style={st.vBars}>
            {values.map((val, i) => (
              <View key={i} style={st.vBarCol}>
                <View style={[st.vBar, { height: Math.max(8, (val / max) * 110) }]} />
                <Text style={st.vBarLbl} numberOfLines={1}>{labels[i] ?? ''}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    default: // NONE / recap
      return (
        <View style={[st.vCard, { alignItems: 'center' }]}>
          <Text style={{ fontSize: 40 }}>📘</Text>
          <Text style={st.vLabel}>Recap & Key Takeaways</Text>
        </View>
      );
  }
};

const AITeacherScreen = ({ initialSubject = 'Physics', initialTopic = '', onBack }) => {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Student';

  const [activeSubject, setActiveSubject] = useState(initialSubject);

  // Generator phase
  const [topic, setTopic]     = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Lesson player
  const [lessonId, setLessonId]       = useState(null);
  const [slides, setSlides]           = useState([]);
  const [slideIdx, setSlideIdx]       = useState(0);
  const [lessonTitle, setLessonTitle] = useState('');

  // Voice (TTS)
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'playing' | 'paused'
  const [autoPlay, setAutoPlay]     = useState(true);

  // Ask-doubt sheet
  const [doubtOpen, setDoubtOpen]   = useState(false);
  const [doubtInput, setDoubtInput] = useState('');
  const [doubtBusy, setDoubtBusy]   = useState(false);
  const [doubts, setDoubts]         = useState([]);

  // Animations
  const anim = useRef(new Animated.Value(0)).current;      // per-slide fade + scale + rise
  const pulse = useRef(new Animated.Value(1)).current;     // avatar pulse while speaking
  const doubtAnim = useRef(new Animated.Value(0)).current; // doubt sheet slide-up

  // Refs to avoid stale closures inside speech callbacks
  const slideIdxRef = useRef(0);
  const autoPlayRef = useRef(autoPlay);
  useEffect(() => { slideIdxRef.current = slideIdx; }, [slideIdx]);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

  const stopSpeech = () => { if (SPEECH_OK) { try { Speech.stop(); } catch (e) {} } };

  // Speak a given slide's narration. onDone optionally advances (auto-play).
  const speakSlide = (idx) => {
    if (!SPEECH_OK) return;
    const sl = slides[idx];
    if (!sl?.narrationText) return;
    stopSpeech();
    setVoiceState('playing');
    Speech.speak(sl.narrationText, {
      language: 'en-US',
      rate: 0.92,
      pitch: 1.05,
      onStart:   () => setVoiceState('playing'),
      onDone:    () => {
        setVoiceState('idle');
        if (autoPlayRef.current && slideIdxRef.current < slides.length - 1) {
          setSlideIdx(i => Math.min(slides.length - 1, i + 1));
        }
      },
      onStopped: () => {},                 // manual stop / slide change — don't advance
      onError:   () => setVoiceState('idle'),
    });
  };

  // On every slide change: animate the visual in + auto-speak the narration.
  // Cleanup stops speech when the slide changes or the screen unmounts.
  useEffect(() => {
    if (slides.length === 0) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 360, useNativeDriver: true }).start();
    speakSlide(slideIdx);
    return () => stopSpeech();
  }, [slideIdx, slides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pulse the avatar while the teacher is speaking.
  useEffect(() => {
    let loop;
    if (voiceState === 'playing') {
      loop = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.07, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0,  duration: 600, useNativeDriver: true }),
      ]));
      loop.start();
    } else {
      pulse.setValue(1);
    }
    return () => loop && loop.stop();
  }, [voiceState]); // eslint-disable-line react-hooks/exhaustive-deps

  const fade  = anim;
  const rise  = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const vRise = anim.interpolate({ inputRange: [0, 1], outputRange: [26, 0] });

  const goNext = () => { stopSpeech(); setSlideIdx(i => Math.min(slides.length - 1, i + 1)); };
  const goPrev = () => { stopSpeech(); setSlideIdx(i => Math.max(0, i - 1)); };

  // Voice controls
  const pauseVoice = async () => {
    if (!SPEECH_OK) return;
    try {
      if (Platform.OS === 'ios' && Speech.pause) { await Speech.pause(); }
      else { stopSpeech(); } // Android has no reliable pause — stop, resume re-speaks
    } catch (e) { stopSpeech(); }
    setVoiceState('paused');
  };
  const resumeVoice = async () => {
    if (!SPEECH_OK) return;
    try {
      if (Platform.OS === 'ios' && Speech.resume) { await Speech.resume(); setVoiceState('playing'); return; }
    } catch (e) {}
    speakSlide(slideIdxRef.current); // fallback: re-speak from the start
  };
  const togglePlay = () => {
    if (!SPEECH_OK) return;
    if (voiceState === 'playing') pauseVoice();
    else if (voiceState === 'paused') resumeVoice();
    else speakSlide(slideIdx); // idle → replay current
  };
  const replay = () => { if (SPEECH_OK) speakSlide(slideIdx); };

  const handleBack = () => { stopSpeech(); onBack && onBack(); };

  const handleGenerate = async () => {
    const t = topic.trim();
    if (!t || loading) return;
    setLoading(true);
    setError('');
    try {
      const payload = { topic: t, subject: activeSubject, gradeLevel: user?.grade || '8' };
      console.log('Generating lesson:', payload);
      const { lessonId: id, lesson } = await generateLesson(payload);
      setLessonId(id);
      setLessonTitle(lesson.lessonTitle || t);
      setSlides(lesson.slides || []);
      setSlideIdx(0);
      setDoubts([]);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not generate the lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const newLesson = () => {
    stopSpeech();
    setSlides([]);
    setLessonId(null);
    setSlideIdx(0);
    setDoubts([]);
    setDoubtOpen(false);
    setVoiceState('idle');
  };

  const openDoubt = () => {
    stopSpeech();
    setVoiceState('idle');
    setDoubtOpen(true);
    Animated.timing(doubtAnim, { toValue: 1, duration: 240, useNativeDriver: true }).start();
  };
  const closeDoubt = () => {
    Animated.timing(doubtAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setDoubtOpen(false));
  };

  const sendDoubt = async () => {
    const q = doubtInput.trim();
    if (!q || doubtBusy) return;
    setDoubtInput('');
    setDoubts(d => [...d, { from: 'user', text: q }]);
    setDoubtBusy(true);
    try {
      const { answer } = await askDoubt(lessonId, { question: q, slideIndex: slideIdx });
      setDoubts(d => [...d, { from: 'ai', text: answer }]);
    } catch (e) {
      setDoubts(d => [...d, { from: 'ai', text: `⚠️ ${e?.response?.data?.error || e?.message || 'Could not answer.'}` }]);
    } finally {
      setDoubtBusy(false);
    }
  };

  // ─── PHASE A: Generator ──────────────────────────────────────────────────────
  if (slides.length === 0) {
    return (
      <SafeAreaView style={st.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <View style={st.genHeader}>
          <TouchableOpacity onPress={handleBack} style={st.backBtn}><Text style={st.backTxt}>‹ Back</Text></TouchableOpacity>
          <Text style={st.genHeaderTitle}>AI Teacher 🎓</Text>
          <View style={{ width: 60 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={st.genBody} keyboardShouldPersistTaps="handled">
            <Text style={st.genHi}>Hi {firstName}! 👋</Text>
            <Text style={st.genQ}>What do you want to learn today?</Text>

            <Text style={st.genLbl}>SUBJECT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
              {SUBJECTS.map(subj => (
                <TouchableOpacity key={subj}
                  style={[st.chip, activeSubject === subj && st.chipOn]}
                  onPress={() => setActiveSubject(subj)}>
                  <Text style={[st.chipTxt, activeSubject === subj && st.chipTxtOn]}>{subj}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[st.genLbl, { marginTop: 18 }]}>TOPIC</Text>
            <TextInput
              style={st.genInput}
              placeholder={`e.g. Pythagoras Theorem`}
              placeholderTextColor="#C7A98A"
              value={topic}
              onChangeText={setTopic}
              onSubmitEditing={handleGenerate}
              returnKeyType="go"
              editable={!loading}
            />

            {!!error && <Text style={st.genError}>{error}</Text>}

            <TouchableOpacity style={[st.genBtn, (loading || !topic.trim()) && { opacity: 0.6 }]}
              onPress={handleGenerate} disabled={loading || !topic.trim()}>
              {loading
                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={st.genBtnTxt}>Building your lesson…</Text>
                  </View>
                : <Text style={st.genBtnTxt}>Generate Lesson  ✨</Text>}
            </TouchableOpacity>

            <Text style={st.genHint}>
              You'll get a voice-narrated, slide-by-slide lesson you can play through — then ask doubts on any slide.
            </Text>
            {!SPEECH_OK && (
              <Text style={st.genVoiceNote}>🔇 Voice off — run “npx expo install expo-speech” to enable narration.</Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── PHASE B: Full-screen narrated reel player ───────────────────────────────
  const slide = slides[slideIdx];
  const isFirst = slideIdx === 0;
  const isLast = slideIdx === slides.length - 1;
  const playIcon = voiceState === 'playing' ? '⏸' : '▶';

  return (
    <SafeAreaView style={st.reelSafe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFCF7" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#FFFCF7' }} />}

      {/* ── TOP 55% — slide title + animated visual ── */}
      <View style={st.top}>
        <View style={st.topBar}>
          <TouchableOpacity onPress={handleBack} style={st.iconBtn}><Text style={st.iconTxt}>‹</Text></TouchableOpacity>
          <View style={st.progressTrack}>
            <View style={[st.progressFill, { width: `${((slideIdx + 1) / slides.length) * 100}%` }]} />
          </View>
          <Text style={st.counter}>{slideIdx + 1}/{slides.length}</Text>
          <TouchableOpacity onPress={newLesson} style={st.iconBtn}><Text style={st.newTxt}>↺</Text></TouchableOpacity>
        </View>

        <Animated.View style={[st.topContent, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <Text style={st.slideNo}>SLIDE {slide.slideNumber}</Text>
          <Text style={st.slideTitle}>{slide.slideTitle}</Text>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 6 }} showsVerticalScrollIndicator={false}>
            {/* Visual pops with scale + rise for a dynamic feel */}
            <Animated.View style={{ opacity: fade, transform: [{ translateY: vRise }, { scale }] }}>
              <Visual slide={slide} />
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </View>

      {/* ── BOTTOM 45% — warm gradient + avatar + narration + voice ── */}
      <View style={st.bottom}>
        <WarmGradient />
        <View style={st.bottomInner}>

          {/* Avatar (student/photo area) + speaking indicator */}
          <View style={st.avatarRow}>
            <Animated.View style={[st.avatarBig, { transform: [{ scale: pulse }] }]}>
              <Text style={{ fontSize: 50 }}>🧑‍🎓</Text>
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={st.narrLabel}>AI TEACHER</Text>
              <View style={[st.statePill, voiceState === 'playing' && st.statePillOn]}>
                <Text style={[st.stateTxt, voiceState === 'playing' && st.stateTxtOn]}>
                  {!SPEECH_OK ? '🔇 voice off' : voiceState === 'playing' ? '🔊 speaking…' : voiceState === 'paused' ? '⏸ paused' : '🎧 ready'}
                </Text>
              </View>
            </View>
          </View>

          {/* Large narration subtitle near the avatar */}
          <Animated.View style={[{ flex: 1 }, { opacity: fade, transform: [{ translateY: rise }] }]}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 6 }} showsVerticalScrollIndicator={false}>
              <Text style={st.narr}>{slide.narrationText}</Text>
            </ScrollView>
          </Animated.View>

          {/* Voice controls + auto-play */}
          <View style={st.voiceRow}>
            <TouchableOpacity style={[st.vBtn, !SPEECH_OK && st.vBtnOff]} onPress={replay} disabled={!SPEECH_OK}>
              <Text style={st.vBtnTxt}>↺ Replay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.vBtn, st.vBtnPrimary, !SPEECH_OK && st.vBtnOff]} onPress={togglePlay} disabled={!SPEECH_OK}>
              <Text style={[st.vBtnTxt, st.vBtnTxtPrimary]}>{playIcon} {voiceState === 'playing' ? 'Pause' : 'Play'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.vBtn, autoPlay && st.vBtnAuto]} onPress={() => setAutoPlay(a => !a)}>
              <Text style={[st.vBtnTxt, autoPlay && { color: '#1C7A3D' }]}>Auto {autoPlay ? 'On' : 'Off'}</Text>
            </TouchableOpacity>
          </View>

          {/* Prev / dots / Next */}
          <View style={st.controls}>
            <TouchableOpacity style={[st.navBtn, isFirst && st.navBtnOff]} onPress={goPrev} disabled={isFirst}>
              <Text style={[st.navBtnTxt, isFirst && st.navBtnTxtOff]}>‹ Prev</Text>
            </TouchableOpacity>
            <View style={st.dots}>
              {slides.map((_, i) => <View key={i} style={[st.dot, i === slideIdx && st.dotOn]} />)}
            </View>
            <TouchableOpacity style={[st.navBtn, st.navBtnPrimary, isLast && st.navBtnOff]} onPress={goNext} disabled={isLast}>
              <Text style={[st.navBtnTxt, st.navBtnTxtPrimary, isLast && st.navBtnTxtOff]}>Next ›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Floating Ask-a-doubt button */}
      <TouchableOpacity style={st.fab} onPress={openDoubt} activeOpacity={0.9}>
        <Text style={st.fabTxt}>💬  Ask a doubt</Text>
      </TouchableOpacity>

      {/* ── Collapsible doubt sheet ── */}
      {doubtOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[st.sheetBackdrop, { opacity: doubtAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDoubt} />
          </Animated.View>
          <Animated.View style={[st.sheet, {
            transform: [{ translateY: doubtAnim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H * 0.7, 0] }) }],
          }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={st.sheetHandle} />
              <View style={st.sheetHeader}>
                <Text style={st.sheetTitle}>Ask a doubt · Slide {slide.slideNumber}</Text>
                <TouchableOpacity onPress={closeDoubt}><Text style={st.sheetClose}>✕</Text></TouchableOpacity>
              </View>
              <ScrollView style={st.sheetChat} contentContainerStyle={{ gap: 10, paddingVertical: 6 }} showsVerticalScrollIndicator={false}>
                {doubts.length === 0 && (
                  <Text style={st.sheetEmpty}>Ask anything about “{slide.slideTitle}”.</Text>
                )}
                {doubts.map((m, i) => (
                  <View key={i} style={[st.dBubble, m.from === 'user' ? st.dBubbleMe : st.dBubbleAi]}>
                    <Text style={[st.dBubbleTxt, m.from === 'user' && { color: '#fff' }]}>{m.text}</Text>
                  </View>
                ))}
                {doubtBusy && <Text style={st.sheetEmpty}>Thinking…</Text>}
              </ScrollView>
              <View style={st.sheetInputRow}>
                <TextInput
                  style={st.sheetInput}
                  placeholder="Type your doubt…"
                  placeholderTextColor="#B0B0B5"
                  value={doubtInput}
                  onChangeText={setDoubtInput}
                  onSubmitEditing={sendDoubt}
                  returnKeyType="send"
                  editable={!doubtBusy}
                />
                <TouchableOpacity style={[st.sheetSend, doubtBusy && { opacity: 0.5 }]} onPress={sendDoubt} disabled={doubtBusy}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>↑</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  // Generator
  safe:            { flex: 1, backgroundColor: '#fff' },
  genHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  backBtn:         { width: 60 },
  backTxt:         { fontSize: 15, fontWeight: '800', color: '#1C1C1E' },
  genHeaderTitle:  { fontSize: 18, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  genBody:         { padding: 20, paddingBottom: 40 },
  genHi:           { fontSize: 16, fontWeight: '700', color: '#8E8E93' },
  genQ:            { fontSize: 24, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5, marginTop: 4, marginBottom: 22 },
  genLbl:          { fontSize: 10, fontWeight: '800', color: '#8E8E93', letterSpacing: 0.8, marginBottom: 10 },
  chip:            { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 18, borderWidth: 2, borderColor: '#E8E8E8', backgroundColor: '#fff' },
  chipOn:          { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  chipTxt:         { fontSize: 13, fontWeight: '800', color: '#8E8E93' },
  chipTxtOn:       { color: '#fff' },
  genInput:        { backgroundColor: '#FFF8F0', borderWidth: 2, borderColor: '#FFE0C2', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 18, fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  genError:        { color: '#C0392B', fontSize: 12, fontWeight: '600', marginTop: 12 },
  genBtn:          { backgroundColor: '#FF8A3D', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 22 },
  genBtnTxt:       { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  genHint:         { fontSize: 12, color: '#8E8E93', fontWeight: '600', lineHeight: 18, marginTop: 16, textAlign: 'center' },
  genVoiceNote:    { fontSize: 11, color: '#B5774A', fontWeight: '700', marginTop: 12, textAlign: 'center' },

  // Reel — top
  reelSafe:        { flex: 1, backgroundColor: '#FFFCF7' },
  top:             { flex: 55, backgroundColor: '#FFFCF7', paddingHorizontal: 18 },
  topBar:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  iconBtn:         { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0E6D8', alignItems: 'center', justifyContent: 'center' },
  iconTxt:         { fontSize: 22, fontWeight: '900', color: '#1C1C1E', marginTop: -2 },
  newTxt:          { fontSize: 16, fontWeight: '900', color: '#1C1C1E' },
  progressTrack:   { flex: 1, height: 6, backgroundColor: '#F0E2D0', borderRadius: 10, overflow: 'hidden' },
  progressFill:    { height: '100%', backgroundColor: '#FF8A3D', borderRadius: 10 },
  counter:         { fontSize: 12, fontWeight: '800', color: '#8E7A66' },
  topContent:      { flex: 1, paddingTop: 4, paddingBottom: 10 },
  slideNo:         { fontSize: 11, fontWeight: '800', color: '#C79A6E', letterSpacing: 1.2, marginBottom: 4 },
  slideTitle:      { fontSize: 24, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5, lineHeight: 29, marginBottom: 12 },

  // Visual card
  vCard:           { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F1E6D6', padding: 16, shadowColor: '#C9A06A', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  vFormula:        { fontSize: 22, fontWeight: '900', color: '#1C1C1E', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 },
  vVar:            { fontSize: 13, fontWeight: '600', color: '#5A4A38', lineHeight: 22 },
  vVarSym:         { fontWeight: '900', color: '#FF8A3D' },
  vLabel:          { fontSize: 15, fontWeight: '800', color: '#1C1C1E', marginBottom: 10 },
  vSub:            { fontSize: 13, fontWeight: '600', color: '#6B5B49', lineHeight: 20, marginTop: 10 },
  vDiagramRow:     { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  vBox:            { backgroundColor: '#FFF3E6', borderWidth: 1.5, borderColor: '#FFD9B3', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  vBoxTxt:         { fontSize: 12, fontWeight: '800', color: '#1C1C1E' },
  vArrow:          { fontSize: 16, fontWeight: '900', color: '#FF8A3D' },
  vStepRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  vNum:            { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FF8A3D', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  vNumTxt:         { fontSize: 11, fontWeight: '900', color: '#fff' },
  vStep:           { flex: 1, fontSize: 13, fontWeight: '600', color: '#3A3A3C', lineHeight: 19 },
  vAnalogyObj:     { fontSize: 16, fontWeight: '900', color: '#1C1C1E', marginBottom: 6 },
  vBars:           { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 130, gap: 8 },
  vBarCol:         { flex: 1, alignItems: 'center', gap: 5 },
  vBar:            { width: '70%', backgroundColor: '#FF8A3D', borderRadius: 6 },
  vBarLbl:         { fontSize: 9, fontWeight: '700', color: '#8E7A66' },

  // Reel — bottom
  bottom:          { flex: 45, overflow: 'hidden' },
  bottomInner:     { flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  avatarRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  avatarBig:       { width: 84, height: 84, borderRadius: 42, backgroundColor: '#fff', borderWidth: 3, borderColor: '#FF8A3D', alignItems: 'center', justifyContent: 'center', shadowColor: '#C9702A', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  narrLabel:       { fontSize: 11, fontWeight: '900', color: '#9A6233', letterSpacing: 0.8, marginBottom: 6 },
  statePill:       { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10 },
  statePillOn:     { backgroundColor: '#1C1C1E' },
  stateTxt:        { fontSize: 11, fontWeight: '800', color: '#7A4F28' },
  stateTxtOn:      { color: '#fff' },
  narr:            { fontSize: 19, fontWeight: '800', color: '#4A2F18', lineHeight: 27, letterSpacing: -0.2 },

  voiceRow:        { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 8 },
  vBtn:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.65)', borderWidth: 1.5, borderColor: '#E8C7A4' },
  vBtnPrimary:     { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  vBtnAuto:        { backgroundColor: '#DFF3E4', borderColor: '#A6DCB6' },
  vBtnOff:         { opacity: 0.45 },
  vBtnTxt:         { fontSize: 12, fontWeight: '900', color: '#7A4F28' },
  vBtnTxtPrimary:  { color: '#fff' },

  controls:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  navBtn:          { borderWidth: 2, borderColor: '#E0A877', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, minWidth: 84, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.55)' },
  navBtnPrimary:   { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  navBtnOff:       { borderColor: '#EAD9C6', backgroundColor: 'rgba(255,255,255,0.35)' },
  navBtnTxt:       { fontSize: 14, fontWeight: '900', color: '#7A4F28' },
  navBtnTxtPrimary:{ color: '#fff' },
  navBtnTxtOff:    { color: '#C9B49E' },
  dots:            { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, flex: 1 },
  dot:             { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(122,79,40,0.25)' },
  dotOn:           { width: 18, backgroundColor: '#7A4F28' },

  // FAB
  fab:             { position: 'absolute', top: SCREEN_H * 0.5 - 20, right: 16, backgroundColor: '#1C1C1E', borderRadius: 22, paddingVertical: 10, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  fabTxt:          { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Doubt sheet
  sheetBackdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:           { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 28 : 16, maxHeight: SCREEN_H * 0.7 },
  sheetHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 12 },
  sheetHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sheetTitle:      { fontSize: 15, fontWeight: '900', color: '#1C1C1E' },
  sheetClose:      { fontSize: 16, fontWeight: '800', color: '#8E8E93', padding: 4 },
  sheetChat:       { maxHeight: SCREEN_H * 0.36 },
  sheetEmpty:      { fontSize: 12, fontWeight: '600', color: '#A0A0A5', textAlign: 'center', paddingVertical: 8 },
  dBubble:         { maxWidth: '85%', padding: 11, borderRadius: 16 },
  dBubbleAi:       { backgroundColor: '#F4F4F5', borderBottomLeftRadius: 4, alignSelf: 'flex-start' },
  dBubbleMe:       { backgroundColor: '#1C1C1E', borderBottomRightRadius: 4, alignSelf: 'flex-end' },
  dBubbleTxt:      { fontSize: 13, fontWeight: '600', color: '#1C1C1E', lineHeight: 19 },
  sheetInputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  sheetInput:      { flex: 1, backgroundColor: '#F7F7F7', borderWidth: 1.5, borderColor: '#EBEBEB', borderRadius: 22, paddingVertical: 11, paddingHorizontal: 16, fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  sheetSend:       { width: 42, height: 42, backgroundColor: '#1C1C1E', borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});

export default AITeacherScreen;
