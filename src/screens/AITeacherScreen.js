import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, TextInput, Platform,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { generateLesson, askAgent, askAgentStream, getResumeContext, getLesson, updateLessonProgress } from '../api/aiApi';
import { saveActiveLesson, getActiveLesson, clearActiveLesson } from '../utils/storage';
import KnowledgeAskScreen from './KnowledgeAskScreen';
import StudyInsightsScreen from './StudyInsightsScreen';
import LiveTeachingPlayer from '../components/teacher/LiveTeachingPlayer';
import TeacherAvatar from '../components/teacher/TeacherAvatar';
import { C } from '../components/teacher/premiumTheme';
import { Appear, PressableScale } from '../components/teacher/uiKit';
import { stopTeacher, primeTeacherVoice, SPEECH_OK } from '../utils/teacherVoice';

// Rotating reassurance shown while the lesson generates.
const GEN_STAGES = [
  'Understanding your topic…',
  'Thinking like a teacher…',
  'Preparing simple examples…',
  'Drawing the lesson on the board…',
  'Almost ready — final touches…',
];

// AI Teacher answers EVERY academic question, so it offers all subjects. Only the
// explanation depth adapts to the student's class (enforced server-side from scope);
// content restriction by stream lives on Practice/Resources, not here.
const SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'History'];

const AITeacherScreen = ({ initialSubject = 'Physics', initialTopic = '', onBack }) => {
  const { user, scope } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const subjects = SUBJECTS;

  const [activeSubject, setActiveSubject] = useState(initialSubject);
  // 'learn' = generate a lesson; 'ask' = grounded RAG Q&A over uploaded material.
  const [mode, setMode] = useState('learn');
  // When set ({ tab }), the Study Insights screen (plan / revision / progress) is shown.
  const [insights, setInsights] = useState(null);
  // "Welcome back" continuity snapshot (null until loaded; dismissible per session).
  const [resume, setResume] = useState(null);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  // A lesson left open in a previous app session (persisted) → offer to resume it.
  const [savedLesson, setSavedLesson] = useState(null);
  const [restoring, setRestoring] = useState(false);
  // Where the live player should start (resume position); 0 for a fresh lesson.
  const [startIndex, setStartIndex] = useState(0);
  // Latest player position, persisted on a timer (decouples scene changes from network).
  const posRef = useRef({ slideIndex: 0, total: 0 });
  // True while tearing down a lesson via "New Lesson" — stops the flush cleanup from
  // re-saving the just-cleared resume pointer (a race that revived stale lessons).
  const clearingRef = useRef(false);

  // Generator
  const [topic, setTopic] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [genStage, setGenStage] = useState(0);
  const [error, setError] = useState('');

  // Lesson (handed to the live player, which owns all playback state)
  const [lessonId, setLessonId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [slides, setSlides] = useState([]);
  const [keyTerms, setKeyTerms] = useState([]);

  // Rolling doubt history for the agent (multi-turn context), capped to keep it light.
  const historyRef = useRef([]);
  // Carries the agent's quiz / understanding-check state to the next turn so the
  // teaching loops (grade my answer, "did you understand?") work across messages.
  const pendingRef = useRef(null);

  // Guards async setState after the screen is unmounted (back-navigation while a
  // lesson is still generating / restoring) — prevents stale-state warnings + leaks.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => { primeTeacherVoice(); }, []);
  // Load the "Welcome back" snapshot once on mount (best-effort — never blocks the UI).
  useEffect(() => {
    let alive = true;
    getResumeContext().then((r) => { if (alive && r && r.hasHistory) setResume(r); }).catch(() => {});
    // Restore a lesson left open in a previous app session (session restoration).
    getActiveLesson().then((l) => { if (alive && l && l.lessonId) setSavedLesson(l); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Player position → ref (persisted on a timer below, not on every scene change).
  const handleProgress = ({ slideIndex, total }) => {
    posRef.current = { slideIndex: Number(slideIndex) || 0, total: Number(total) || 0 };
  };

  // While a lesson is open, persist progress + study time every 15s (and a final
  // flush on unmount/leave). This fills lesson_progress → resume, completed lessons,
  // chapter %, and Study Insights study-time all become real.
  useEffect(() => {
    if (!lessonId || slides.length === 0) return undefined;
    const flush = (secs) => {
      const { slideIndex, total } = posRef.current;
      updateLessonProgress(lessonId, { slideIndex, total, studyTimeSeconds: secs, concept: lessonTitle }).catch(() => {});
      // Don't revive the resume pointer if the lesson is being intentionally cleared.
      if (!clearingRef.current) saveActiveLesson({ lessonId, title: lessonTitle, subject: activeSubject, slideIndex });
    };
    const id = setInterval(() => flush(15), 15000);
    return () => { clearInterval(id); flush(3); };
  }, [lessonId, slides.length, lessonTitle, activeSubject]);

  // Pull a persisted lesson back into the player (re-fetches slides by id).
  const resumeSavedLesson = async () => {
    if (!savedLesson || restoring) return;
    setRestoring(true);
    setError('');
    try {
      const { lesson } = await getLesson(savedLesson.lessonId);
      if (!mountedRef.current) return;
      if (!lesson || !Array.isArray(lesson.slides) || lesson.slides.length === 0) throw new Error('empty');
      if (lesson.subject) setActiveSubject(lesson.subject);
      clearingRef.current = false;
      setStartIndex(Number(savedLesson.slideIndex) || 0); // resume at saved position
      setLessonId(savedLesson.lessonId);
      setLessonTitle(lesson.lessonTitle || savedLesson.title || '');
      setSlides(lesson.slides);
      setKeyTerms(lesson.keyTerms || []);
      historyRef.current = [];
      pendingRef.current = null;
    } catch (e) {
      // Lesson gone/deleted — drop the stale pointer so we don't offer it again.
      await clearActiveLesson();
      if (mountedRef.current) { setSavedLesson(null); setError('That lesson is no longer available. Start a new one below.'); }
    } finally {
      if (mountedRef.current) setRestoring(false);
    }
  };
  useEffect(() => {
    if (!loading) { setGenStage(0); return undefined; }
    const id = setInterval(() => setGenStage((s) => Math.min(GEN_STAGES.length - 1, s + 1)), 2600);
    return () => clearInterval(id);
  }, [loading]);

  const handleBack = () => { stopTeacher(); onBack && onBack(); };

  const handleGenerate = async () => {
    const t = topic.trim();
    if (!t || loading) return;
    setLoading(true);
    setError('');
    historyRef.current = [];
    pendingRef.current = null;
    try {
      // The backend is authoritative on grade (from the student's profile); we send
      // the saved class for clarity but it cannot be used to request another class.
      const payload = { topic: t, subject: activeSubject, gradeLevel: scope?.classNum ? String(scope.classNum) : (user?.grade || '') };
      const { lessonId: id, lesson } = await generateLesson(payload);
      if (!mountedRef.current) return;
      setLessonId(id);
      setLessonTitle(lesson.lessonTitle || t);
      setSlides(lesson.slides || []);
      setKeyTerms(lesson.keyTerms || []);
      // Persist so this lesson can be resumed if the app is closed mid-way.
      setStartIndex(0);
      posRef.current = { slideIndex: 0, total: 0 };
      clearingRef.current = false;
      saveActiveLesson({ lessonId: id, title: lesson.lessonTitle || t, subject: activeSubject, slideIndex: 0 });
      setSavedLesson(null);
    } catch (e) {
      if (mountedRef.current) setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Could not generate the lesson. Please try again.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const newLesson = () => { clearingRef.current = true; stopTeacher(); setSlides([]); setLessonId(null); historyRef.current = []; pendingRef.current = null; clearActiveLesson(); setSavedLesson(null); };

  // Stable lesson object so the player's buildScenes() memo isn't invalidated on
  // every re-render of this screen.
  const lessonObj = useMemo(() => ({ lessonTitle, slides, keyTerms }), [lessonTitle, slides, keyTerms]);

  // ── Study Insights (plan / revision / progress) — self-contained screen ──
  if (insights) {
    return (
      <StudyInsightsScreen
        initialSubject={activeSubject}
        initialTab={insights.tab}
        onBack={() => setInsights(null)}
      />
    );
  }

  // ── Ask-the-material (grounded RAG) — self-contained screen ──
  if (slides.length === 0 && mode === 'ask') {
    return <KnowledgeAskScreen initialSubject={activeSubject} onBack={() => setMode('learn')} />;
  }

  // ── Generator ──
  if (slides.length === 0) {
    return (
      <SafeAreaView style={st.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.cream} />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.cream }} />}
        <View style={st.header}>
          <PressableScale onPress={handleBack} style={st.hIcon} accessibilityLabel="Go back"><Text style={st.hIconTxt}>‹</Text></PressableScale>
          <Text style={st.headerTitle} accessibilityRole="header">AI Teacher</Text>
          <View style={{ width: 38 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Appear from="scale" style={st.hero}><TeacherAvatar size={96} state="idle" theme="dark" /></Appear>
            <Appear delay={60}><Text style={st.hi}>Hi {firstName} 👋</Text></Appear>
            <Appear delay={110}><Text style={st.q}>What should we learn today?</Text></Appear>

            {savedLesson && (
              <Appear>
                <PressableScale style={st.resumeLessonCard} onPress={resumeSavedLesson} disabled={restoring}
                  accessibilityLabel={`Resume your lesson: ${savedLesson.title || 'continue where you left off'}`}>
                  <View style={st.resumeLessonIcon}><Text style={{ fontSize: 18 }}>▶</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.resumeLessonTag}>RESUME YOUR LESSON</Text>
                    <Text style={st.resumeLessonTitle} numberOfLines={1}>{savedLesson.title || 'Continue where you left off'}</Text>
                  </View>
                  {restoring
                    ? <ActivityIndicator color={C.accent} size="small" />
                    : <Text style={st.resumeLessonGo}>›</Text>}
                </PressableScale>
              </Appear>
            )}

            {resume && !resumeDismissed && (
              <Appear style={st.welcomeCard}>
                <PressableScale style={st.welcomeClose} onPress={() => setResumeDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Dismiss welcome back">
                  <Text style={st.welcomeCloseTxt}>✕</Text>
                </PressableScale>
                <Text style={st.welcomeTag}>👋 WELCOME BACK</Text>
                <Text style={st.welcomeGreeting}>{resume.greeting}</Text>
                {!!resume.suggestion && <Text style={st.welcomeSuggest}>{resume.suggestion}</Text>}
                <View style={st.welcomeBtns}>
                  <PressableScale
                    style={st.welcomePrimary}
                    onPress={() => {
                      if (resume.last?.subject && SUBJECTS.includes(resume.last.subject)) setActiveSubject(resume.last.subject);
                      setInsights({ tab: 'revise' });
                    }}
                    accessibilityLabel="Continue revising"
                  >
                    <Text style={st.welcomePrimaryTxt}>Continue revising  ›</Text>
                  </PressableScale>
                  {!!resume.last?.chapter && (
                    <PressableScale
                      style={st.welcomeGhost}
                      onPress={() => { setTopic(resume.last.chapter); if (resume.last?.subject && SUBJECTS.includes(resume.last.subject)) setActiveSubject(resume.last.subject); }}
                      accessibilityLabel={`Re-learn ${resume.last.chapter}`}
                    >
                      <Text style={st.welcomeGhostTxt}>Re-learn {resume.last.chapter}</Text>
                    </PressableScale>
                  )}
                </View>
              </Appear>
            )}

            <View style={st.modeRow}>
              <PressableScale style={[st.modeBtn, st.modeBtnOn]} onPress={() => setMode('learn')}
                accessibilityLabel="Learn a topic" accessibilityState={{ selected: true }}>
                <Text style={[st.modeTxt, st.modeTxtOn]}>📖  Learn a Topic</Text>
              </PressableScale>
              <PressableScale style={st.modeBtn} onPress={() => setMode('ask')}
                accessibilityLabel="Ask the material" accessibilityState={{ selected: false }}>
                <Text style={st.modeTxt}>📚  Ask the Material</Text>
              </PressableScale>
            </View>

            <Text style={st.label}>FOR YOU</Text>
            <View style={st.insightRow}>
              {[
                { tab: 'next', icon: '🧭', title: 'What next?', sub: 'Smart plan' },
                { tab: 'revise', icon: '🔁', title: 'Revise', sub: 'Weak topics' },
                { tab: 'progress', icon: '📊', title: 'Progress', sub: 'Your stats' },
              ].map((a, i) => (
                <Appear key={a.tab} delay={60 + i * 60} style={{ flex: 1 }}>
                  <PressableScale style={st.insightCard} onPress={() => setInsights({ tab: a.tab })}
                    accessibilityLabel={`${a.title}. ${a.sub}`}>
                    <Text style={st.insightIcon}>{a.icon}</Text>
                    <Text style={st.insightTitle}>{a.title}</Text>
                    <Text style={st.insightSub}>{a.sub}</Text>
                  </PressableScale>
                </Appear>
              ))}
            </View>

            <Text style={[st.label, { marginTop: 20 }]}>SUBJECT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
              {subjects.map((subj) => (
                <PressableScale key={subj} style={[st.chip, activeSubject === subj && st.chipOn]} onPress={() => setActiveSubject(subj)}
                  accessibilityLabel={`Subject ${subj}`} accessibilityState={{ selected: activeSubject === subj }}>
                  <Text style={[st.chipTxt, activeSubject === subj && st.chipTxtOn]}>{subj}</Text>
                </PressableScale>
              ))}
            </ScrollView>

            <Text style={[st.label, { marginTop: 20 }]}>TOPIC</Text>
            <TextInput
              style={st.input}
              placeholder="e.g. Pythagoras Theorem"
              placeholderTextColor={C.faint}
              value={topic}
              onChangeText={setTopic}
              onSubmitEditing={handleGenerate}
              returnKeyType="go"
              editable={!loading}
              accessibilityLabel="Topic to learn"
            />

            {!!error && (
              <Appear style={st.errCard}>
                <Text style={st.errTxt} accessibilityLiveRegion="polite">⚠️  {error}</Text>
                <PressableScale onPress={handleGenerate} accessibilityLabel="Try again"><Text style={st.retryTxt}>Try again ›</Text></PressableScale>
              </Appear>
            )}

            <PressableScale style={[st.cta, (loading || !topic.trim()) && { opacity: 0.55 }]} onPress={handleGenerate} disabled={loading || !topic.trim()}
              accessibilityLabel={loading ? 'Generating your lesson' : 'Generate lesson'} accessibilityHint="Creates a live voice-narrated lesson on your topic">
              {loading
                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={st.ctaTxt}>{GEN_STAGES[genStage]}</Text>
                  </View>
                : <Text style={st.ctaTxt}>Generate Lesson  ✨</Text>}
            </PressableScale>

            {loading && (
              <View style={st.loadCard}>
                {GEN_STAGES.map((s, i) => (
                  <View key={i} style={st.stageRow}>
                    <Text style={st.stageIcon}>{i < genStage ? '✅' : i === genStage ? '⏳' : '○'}</Text>
                    <Text style={[st.stageTxt, i === genStage && st.stageTxtOn, i < genStage && st.stageTxtDone]}>{s}</Text>
                  </View>
                ))}
                <Text style={st.loadHint}>A good lesson takes a moment to craft. Hang tight 🎓</Text>
              </View>
            )}

            {!loading && (
              <Text style={st.hint}>A live, voice-narrated lesson with a teacher, whiteboard, and doubts you can ask anytime.</Text>
            )}
            {!SPEECH_OK && <Text style={st.voiceNote}>🔇 Voice off — run “npx expo install expo-speech” to enable narration.</Text>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Live classroom ──
  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.cream} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.cream }} />}
      <LiveTeachingPlayer
        lesson={lessonObj}
        ttsOk={SPEECH_OK}
        startIndex={startIndex}
        onProgress={handleProgress}
        onAsk={async (q, i) => {
          // Route doubts through the AI Teacher agent: intent → RAG grounding →
          // teacher-style answer → quality guard. `pending` carries the quiz /
          // understanding-check state so those loops continue across turns.
          const res = await askAgent({
            text: q,
            subject: activeSubject,
            gradeLevel: user?.grade || '8',
            lessonId,
            slideIndex: i,
            history: historyRef.current,
            pending: pendingRef.current,
          });
          pendingRef.current = res.pending || null;
          historyRef.current = [
            ...historyRef.current,
            { role: 'USER', content: q },
            { role: 'ASSISTANT', content: res.answer },
          ].slice(-12);
          // Return the full response so the player can surface retrieval metadata
          // (concept, prerequisites, confidence) alongside the answer text.
          return res;
        }}
        onAskStream={async (q, i, { onDelta }) => {
          // Streaming variant — the player speaks sentences as they arrive.
          const res = await askAgentStream({
            text: q,
            subject: activeSubject,
            gradeLevel: user?.grade || '8',
            lessonId,
            slideIndex: i,
            history: historyRef.current,
            pending: pendingRef.current,
          }, { onDelta });
          pendingRef.current = res.pending || null;
          historyRef.current = [
            ...historyRef.current,
            { role: 'USER', content: q },
            { role: 'ASSISTANT', content: res.answer || '' },
          ].slice(-12);
          return res;
        }}
        onExit={handleBack}
        onNewLesson={newLesson}
      />
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  hIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.board, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  hIconTxt: { fontSize: 22, fontWeight: '900', color: C.ink, marginTop: -2 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },

  body: { paddingHorizontal: 20, paddingBottom: 44 },
  hero: { alignItems: 'center', marginTop: 6, marginBottom: 8 },
  hi: { fontSize: 14, fontWeight: '700', color: C.dim, textAlign: 'center' },
  q: { fontSize: 25, fontWeight: '900', color: C.ink, letterSpacing: -0.5, marginTop: 4, marginBottom: 24, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  label: { fontSize: 11, fontWeight: '800', color: C.dim, letterSpacing: 1, marginBottom: 10 },

  resumeLessonCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.board, borderWidth: 1, borderColor: C.accent, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14, marginBottom: 14 },
  resumeLessonIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(124,58,237,0.18)', alignItems: 'center', justifyContent: 'center' },
  resumeLessonTag: { fontSize: 9, fontWeight: '900', color: C.accent, letterSpacing: 1 },
  resumeLessonTitle: { fontSize: 14, fontWeight: '900', color: C.ink, marginTop: 2 },
  resumeLessonGo: { fontSize: 24, fontWeight: '900', color: C.accent },

  welcomeCard: { backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.45)', borderRadius: 18, padding: 16, marginBottom: 18 },
  welcomeClose: { position: 'absolute', top: 10, right: 12, zIndex: 2 },
  welcomeCloseTxt: { fontSize: 14, fontWeight: '900', color: C.dim },
  welcomeTag: { fontSize: 10, fontWeight: '900', color: C.accent, letterSpacing: 1, marginBottom: 6 },
  welcomeGreeting: { fontSize: 15, fontWeight: '800', color: C.ink, lineHeight: 21, paddingRight: 16 },
  welcomeSuggest: { fontSize: 13, fontWeight: '600', color: C.ink2, lineHeight: 19, marginTop: 6 },
  welcomeBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  welcomePrimary: { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  welcomePrimaryTxt: { color: '#fff', fontSize: 13, fontWeight: '900' },
  welcomeGhost: { borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.board },
  welcomeGhostTxt: { color: C.ink2, fontSize: 13, fontWeight: '800' },

  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },

  insightRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  insightCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.board, alignItems: 'center', gap: 3 },
  insightIcon: { fontSize: 22, marginBottom: 2 },
  insightTitle: { fontSize: 13, fontWeight: '900', color: C.ink, letterSpacing: -0.2 },
  insightSub: { fontSize: 10, fontWeight: '700', color: C.dim },
  modeBtn: { flex: 1, paddingVertical: 13, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.board, alignItems: 'center' },
  modeBtnOn: { backgroundColor: C.accent, borderColor: C.accent },
  modeTxt: { fontSize: 14, fontWeight: '800', color: C.dim },
  modeTxtOn: { color: '#fff' },

  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.board },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipTxt: { fontSize: 14, fontWeight: '800', color: C.dim },
  chipTxtOn: { color: '#fff' },

  input: { backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 18, fontSize: 16, fontWeight: '700', color: C.ink },

  errCard: { marginTop: 14, backgroundColor: 'rgba(255,143,176,0.12)', borderWidth: 1, borderColor: 'rgba(255,143,176,0.4)', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  errTxt: { flex: 1, color: C.pink, fontSize: 13, fontWeight: '700' },
  retryTxt: { color: C.ink, fontSize: 13, fontWeight: '900' },

  cta: { backgroundColor: C.accent, borderRadius: 18, paddingVertical: 17, alignItems: 'center', marginTop: 22, shadowColor: C.accent, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  ctaTxt: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },

  loadCard: { marginTop: 18, padding: 18, gap: 12, backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: 18 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stageIcon: { fontSize: 14, width: 20, color: C.faint },
  stageTxt: { fontSize: 14, fontWeight: '700', color: C.faint },
  stageTxtOn: { color: C.ink, fontWeight: '900' },
  stageTxtDone: { color: C.green },
  loadHint: { fontSize: 11, fontWeight: '600', color: C.dim, marginTop: 4, textAlign: 'center' },

  hint: { fontSize: 13, color: C.dim, fontWeight: '600', lineHeight: 19, marginTop: 18, textAlign: 'center' },
  voiceNote: { fontSize: 11, color: C.accent, fontWeight: '700', marginTop: 12, textAlign: 'center' },
});

export default AITeacherScreen;
