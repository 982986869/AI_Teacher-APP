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
import {
  useFonts,
  Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
  Poppins_700Bold, Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import LiveTeachingPlayer from '../components/teacher/LiveTeachingPlayer';
import TeacherAvatar from '../components/teacher/TeacherAvatar';
import TeacherFullBody from '../components/teacher/TeacherFullBody';
import { TEACHER_HEADSHOT, TEACHER_PHOTO, TEACHER_VIDEO } from '../components/teacher/teacherIdentity';
import { greeting, firstHello, preparingBeats, preparingHint, resumeTag, emptyState } from '../components/teacher/teacherMoments';
import { C, F, SP, GLASS, SERIF } from '../components/teacher/premiumTheme';
import { Appear, PressableScale } from '../components/teacher/uiKit';
import { stopTeacher, primeTeacherVoice, SPEECH_OK } from '../utils/teacherVoice';

// AI Teacher answers EVERY academic question, so it offers all subjects. Only the
// explanation depth adapts to the student's class (enforced server-side from scope);
// content restriction by stream lives on Practice/Resources, not here.
const SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'History'];

const AITeacherScreen = ({ initialSubject = 'Physics', initialTopic = '', onBack }) => {
  const { user, scope } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const subjects = SUBJECTS;
  // Load the premium type family for the whole AI Teacher feature (cached after the
  // first load). The live player references the same family names.
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
    Poppins_700Bold, Poppins_800ExtraBold,
  });

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
    const id = setInterval(() => setGenStage((s) => Math.min(prepStages.length - 1, s + 1)), 2600);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ── Human moments around the lesson (presentation copy — Ms. Nova's warmth on
  // the landing + while she prepares). Frames the REAL continuity data (resume /
  // saved lesson); never fabricates it. See teacherMoments.js. ──
  const greet = useMemo(() => greeting({ name: firstName, returning: !!resume, hasSaved: !!savedLesson }), [firstName, resume, savedLesson]);
  const intro = useMemo(() => firstHello(), []);
  const isNewStudent = !resume && !savedLesson;
  const prepStages = useMemo(() => preparingBeats(topic), [topic]);
  const prepHint = useMemo(() => preparingHint(), []);
  const resumeCardTag = useMemo(() => resumeTag(), [savedLesson]);
  const emptyHint = useMemo(() => emptyState('insights'), []);

  // Hold the first paint until the type family is ready (a brief, calm splash) so
  // the product never flashes system font → Poppins. Fails open on a font error.
  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaView style={[st.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.cream} />
        <ActivityIndicator size="large" color={C.accent} />
      </SafeAreaView>
    );
  }

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
        <StatusBar barStyle="dark-content" backgroundColor={C.cream} />
        {Platform.OS === 'android' && <View style={{ height: 24 }} />}
        <View style={st.header}>
          <PressableScale onPress={handleBack} style={st.hIcon} accessibilityLabel="Go back"><Text style={st.hIconTxt}>‹</Text></PressableScale>
          <Text style={st.headerTitle} accessibilityRole="header">AI TEACHER</Text>
          <View style={{ width: 38 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Your teacher — Ms. Nova (FULL-BODY avatar on the landing) */}
            <Appear from="scale" style={st.hero}>
              <TeacherFullBody photo={TEACHER_PHOTO} video={TEACHER_VIDEO} state="idle" theme="dark" height={300} />
            </Appear>
            <Appear delay={40} style={{ alignItems: 'center', marginBottom: SP.lg }}>
              <Text style={st.teacherRole}>YOUR TEACHER</Text>
              <Text style={st.teacherName}>Ms. Nova</Text>
            </Appear>

            {/* Greeting (serif) */}
            <Appear delay={70}><Text style={st.greet}>{greet.hello}{'\n'}{greet.prompt}</Text></Appear>

            {/* Topic search */}
            <Appear delay={110} style={st.searchRow}>
              <TextInput
                style={st.searchInput}
                placeholder="Search a topic — e.g. Pythagoras"
                placeholderTextColor={C.faint}
                value={topic}
                onChangeText={setTopic}
                onSubmitEditing={handleGenerate}
                returnKeyType="go"
                editable={!loading}
                accessibilityLabel="Topic to learn"
              />
              <PressableScale style={[st.searchGo, (loading || !topic.trim()) && { opacity: 0.5 }]} onPress={handleGenerate} disabled={loading || !topic.trim()} accessibilityLabel="Start lesson">
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.searchGoTxt}>→</Text>}
              </PressableScale>
            </Appear>

            {!!error && (
              <Appear style={st.errCard}>
                <Text style={st.errTxt} accessibilityLiveRegion="polite">⚠️  {error}</Text>
                <PressableScale onPress={handleGenerate} accessibilityLabel="Try again"><Text style={st.retryTxt}>Try again ›</Text></PressableScale>
              </Appear>
            )}

            {loading && (
              <View style={st.loadCard}>
                {prepStages.map((s, i) => (
                  <View key={i} style={st.stageRow}>
                    <Text style={st.stageIcon}>{i < genStage ? '✅' : i === genStage ? '⏳' : '○'}</Text>
                    <Text style={[st.stageTxt, i === genStage && st.stageTxtOn, i < genStage && st.stageTxtDone]}>{s}</Text>
                  </View>
                ))}
                <Text style={st.loadHint}>{prepHint}</Text>
              </View>
            )}

            {/* Subjects */}
            <Text style={st.seclbl}>Subjects</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingBottom: 4 }}>
              {subjects.map((subj) => (
                <PressableScale key={subj} style={[st.chip, activeSubject === subj && st.chipOn]} onPress={() => setActiveSubject(subj)}
                  accessibilityLabel={`Subject ${subj}`} accessibilityState={{ selected: activeSubject === subj }}>
                  <Text style={[st.chipTxt, activeSubject === subj && st.chipTxtOn]}>{subj}</Text>
                </PressableScale>
              ))}
            </ScrollView>

            {savedLesson && (
              <Appear>
                <PressableScale style={st.resumeLessonCard} onPress={resumeSavedLesson} disabled={restoring}
                  accessibilityLabel={`Resume your lesson: ${savedLesson.title || 'continue where you left off'}`}>
                  <View style={st.resumeLessonIcon}><Text style={{ fontSize: 18 }}>▶</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.resumeLessonTag}>{resumeCardTag}</Text>
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
                <Text style={[st.modeTxt, st.modeTxtOn]}>Learn a Topic</Text>
              </PressableScale>
              <PressableScale style={st.modeBtn} onPress={() => setMode('ask')}
                accessibilityLabel="Ask the material" accessibilityState={{ selected: false }}>
                <Text style={st.modeTxt}>Ask the Material</Text>
              </PressableScale>
            </View>

            <Text style={st.label}>FOR YOU</Text>
            {isNewStudent && <Text style={st.forYouHint}>{emptyHint}</Text>}
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
        subject={activeSubject}
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

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SP.lg, paddingVertical: SP.sm },
  hIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, // ghost — no box
  hIconTxt: { fontSize: 26, color: C.ink2, marginTop: -3 },
  headerTitle: { fontSize: 11.5, fontFamily: F.bold, color: C.dim, letterSpacing: 2.4, textTransform: 'uppercase' },

  body: { paddingHorizontal: SP.lg, paddingBottom: SP.xxxl },
  hero: { alignItems: 'center', marginTop: SP.sm, marginBottom: SP.md },
  hi: { fontSize: 13, fontFamily: F.semi, color: C.dim, textAlign: 'center', letterSpacing: 0.3 },

  // teacher intro row
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: SP.sm, marginBottom: SP.lg },
  teacherRole: { fontSize: 9.5, fontFamily: F.bold, color: C.accent, letterSpacing: 1.6, textTransform: 'uppercase' },
  teacherName: { fontSize: 17, fontFamily: SERIF, fontWeight: '600', color: C.ink, marginTop: 2 },

  // serif greeting
  q: { fontSize: 29, fontFamily: SERIF, fontWeight: '500', color: C.ink, letterSpacing: -0.3, lineHeight: 37, marginBottom: SP.lg },
  greet: { fontSize: 29, fontFamily: SERIF, fontWeight: '500', color: C.ink, letterSpacing: -0.3, lineHeight: 37, marginBottom: SP.lg },

  // topic search bar
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.board, borderRadius: 16, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, borderWidth: 1, borderColor: C.line, shadowColor: GLASS.shadow, shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2, marginBottom: SP.xl },
  searchInput: { flex: 1, fontSize: 14, fontFamily: F.med, color: C.ink, paddingVertical: 8 },
  searchGo: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOpacity: 0.38, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  searchGoTxt: { color: '#fff', fontSize: 20, marginTop: -2 },
  seclbl: { fontSize: 10.5, fontFamily: F.bold, color: C.dim, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: SP.md },
  intro: { fontSize: 13.5, fontFamily: F.med, color: C.ink2, textAlign: 'center', lineHeight: 20, marginBottom: SP.lg, maxWidth: 360, alignSelf: 'center' },
  label: { fontSize: 11, fontFamily: F.bold, color: C.dim, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: SP.md },
  forYouHint: { fontSize: 12.5, fontFamily: F.med, color: C.ink2, lineHeight: 18, marginTop: -SP.sm, marginBottom: SP.md },

  // resume = the PRIMARY continuity action → soft-blue accent, gently floating
  resumeLessonCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.board, borderWidth: 1, borderColor: 'rgba(76,130,240,0.35)', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16, marginBottom: SP.md, shadowColor: C.accent, shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  resumeLessonIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  resumeLessonTag: { fontSize: 9, fontFamily: F.bold, color: C.accent, letterSpacing: 1.2 },
  resumeLessonTitle: { fontSize: 14, fontFamily: F.bold, color: C.ink, marginTop: 2 },
  resumeLessonGo: { fontSize: 24, fontFamily: F.reg, color: C.accent },

  // welcome-back = a SECONDARY moment → subtle teal, so it reads distinct from resume
  welcomeCard: { backgroundColor: 'rgba(18,165,148,0.06)', borderWidth: 1, borderColor: 'rgba(18,165,148,0.24)', borderRadius: 22, padding: SP.lg, marginBottom: SP.lg },
  welcomeClose: { position: 'absolute', top: 12, right: 14, zIndex: 2 },
  welcomeCloseTxt: { fontSize: 14, fontFamily: F.bold, color: C.dim },
  welcomeTag: { fontSize: 10, fontFamily: F.bold, color: C.teal, letterSpacing: 1.2, marginBottom: 6 },
  welcomeGreeting: { fontSize: 15, fontFamily: F.semi, color: C.ink, lineHeight: 22, paddingRight: 16 },
  welcomeSuggest: { fontSize: 13, fontFamily: F.med, color: C.ink2, lineHeight: 19, marginTop: 6 },
  welcomeBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SP.md },
  welcomePrimary: { backgroundColor: C.teal, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 18 },
  welcomePrimaryTxt: { color: '#fff', fontSize: 13, fontFamily: F.bold },
  welcomeGhost: { borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 16, backgroundColor: GLASS.fill },
  welcomeGhostTxt: { color: C.ink2, fontSize: 13, fontFamily: F.semi },

  // segmented control — a soft warm track; the active tab lifts on a white card
  modeRow: { flexDirection: 'row', backgroundColor: 'rgba(42,46,58,0.045)', borderRadius: 16, padding: 4, marginBottom: SP.xl },
  modeBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  modeBtnOn: { backgroundColor: C.board, shadowColor: GLASS.shadow, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  modeTxt: { fontSize: 13.5, fontFamily: F.semi, color: C.dim },
  modeTxtOn: { color: C.ink },

  // for-you — soft frosted cards that float (no grey, no hard border)
  insightRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  insightCard: { flex: 1, paddingVertical: SP.md, paddingHorizontal: SP.sm, borderRadius: 20, backgroundColor: GLASS.fillStrong, borderWidth: 1, borderColor: GLASS.edge, alignItems: 'center', gap: 3, shadowColor: GLASS.shadow, shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  insightIcon: { fontSize: 22, marginBottom: 2 },
  insightTitle: { fontSize: 13, fontFamily: F.bold, color: C.ink, letterSpacing: -0.2 },
  insightSub: { fontSize: 10, fontFamily: F.med, color: C.dim },

  // subject chips — soft frosted (unselected) → solid soft-blue (selected)
  chip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, backgroundColor: GLASS.fillStrong, borderWidth: 1, borderColor: GLASS.edge },
  chipOn: { backgroundColor: C.teal, borderColor: C.teal, shadowColor: C.teal, shadowOpacity: 0.24, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  chipTxt: { fontSize: 14, fontFamily: F.semi, color: C.ink2 },
  chipTxtOn: { color: '#fff' },

  input: { backgroundColor: C.board, borderWidth: 1, borderColor: GLASS.edge, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, fontSize: 16, fontFamily: F.semi, color: C.ink, shadowColor: GLASS.shadow, shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },

  errCard: { marginTop: SP.md, backgroundColor: 'rgba(242,104,95,0.10)', borderWidth: 1, borderColor: 'rgba(242,104,95,0.35)', borderRadius: 16, padding: SP.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  errTxt: { flex: 1, color: C.pink, fontSize: 13, fontFamily: F.semi },
  retryTxt: { color: C.ink, fontSize: 13, fontFamily: F.bold },

  cta: { backgroundColor: C.accent, borderRadius: 20, paddingVertical: 18, alignItems: 'center', marginTop: SP.lg, shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  ctaTxt: { color: '#fff', fontSize: 16, fontFamily: F.bold, letterSpacing: -0.2 },

  loadCard: { marginTop: SP.lg, padding: SP.lg, gap: SP.md, backgroundColor: GLASS.fillStrong, borderWidth: 1, borderColor: GLASS.edge, borderRadius: 22, shadowColor: GLASS.shadow, shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stageIcon: { fontSize: 14, width: 20, color: C.faint },
  stageTxt: { fontSize: 14, fontFamily: F.med, color: C.faint },
  stageTxtOn: { color: C.ink, fontFamily: F.bold },
  stageTxtDone: { color: C.green },
  loadHint: { fontSize: 11, fontFamily: F.med, color: C.dim, marginTop: 4, textAlign: 'center' },

  hint: { fontSize: 13, fontFamily: F.med, color: C.dim, lineHeight: 20, marginTop: SP.lg, textAlign: 'center' },
  voiceNote: { fontSize: 11, fontFamily: F.semi, color: C.accent, marginTop: SP.md, textAlign: 'center' },
});

export default AITeacherScreen;
