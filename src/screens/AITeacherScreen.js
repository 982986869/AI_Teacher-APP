import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, TextInput, Platform,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { generateLesson, askAgent, askAgentStream, getResumeContext, getLesson, updateLessonProgress } from '../api/aiApi';
import { saveActiveLesson, getActiveLesson, clearActiveLesson, getStudentModel, saveStudentModel } from '../utils/storage';
import { foldOutcome } from '../components/teacher/pedagogyEngine';
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
import { C, D, F, SP, GRAD, R, SERIF } from '../components/teacher/premiumTheme';
import { Appear, PressableScale, Gradient } from '../components/teacher/uiKit';
import { stopTeacher, primeTeacherVoice, SPEECH_OK } from '../utils/teacherVoice';

// AI Teacher answers EVERY academic question, so it offers all subjects. Only the
// explanation depth adapts to the student's class (enforced server-side from scope);
// content restriction by stream lives on Practice/Resources, not here.
const SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'History'];

// Per-subject glyph + tint for the subject tiles (presentation only — the list
// above stays the single source of truth for which subjects exist).
// Tints are OPAQUE on purpose: Android renders an elevation shadow from the view's
// own background, so a translucent one shows through as a white block behind the
// card. These are the same hues, pre-blended over C.cream.
const SUBJECT_META = {
  Physics: { icon: '🌌', tint: '#E9E4FB' },   // violet
  Maths: { icon: '📐', tint: '#DEE9FB' },     // blue
  Chemistry: { icon: '🧪', tint: '#D8F1EB' }, // emerald
  Biology: { icon: '🧬', tint: '#F8E0E6' },   // rose
  English: { icon: '📚', tint: '#F8EDDA' },   // amber
  History: { icon: '🏛️', tint: '#F8E7DC' },  // orange
};
const subjectMeta = (s) => SUBJECT_META[s] || { icon: '✨', tint: '#E6E9FB' };

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

  // ── CROSS-LESSON STUDENT MEMORY ──────────────────────────────────────────────
  // The long-term model the teacher remembers this student by (rolling confidence,
  // accuracy, topics learned, what was tricky). Loaded once, seeded into the live
  // player, and folded forward after each lesson. Keyed per student.
  const studentKey = user?.id || user?._id || user?.email || 'guest';
  const [studentModel, setStudentModel] = useState(null);
  useEffect(() => {
    let alive = true;
    getStudentModel(studentKey).then((m) => { if (alive) setStudentModel(m); }).catch(() => {});
    return () => { alive = false; };
  }, [studentKey]);
  const recordOutcome = async (outcome) => {
    try {
      const next = foldOutcome(studentModel, outcome);
      setStudentModel(next);
      await saveStudentModel(studentKey, next);
    } catch (_) { /* memory is best-effort — never block the lesson */ }
  };

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
  // The ref MUST be re-armed on mount: an effect cleanup also runs on Fast Refresh
  // (and under StrictMode's double-invoke), and refs survive it — so a setup that
  // only ever clears the flag leaves it false forever, and every guarded setState
  // below turns into a silent no-op (lesson generates server-side but never opens).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
  const lessonObj = useMemo(() => ({ lessonTitle, slides, keyTerms, grade: scope?.classNum || user?.grade || null }), [lessonTitle, slides, keyTerms, scope?.classNum, user?.grade]);

  // ── Human moments around the lesson (presentation copy — Ms. Nova's warmth on
  // the landing + while she prepares). Frames the REAL continuity data (resume /
  // saved lesson); never fabricates it. See teacherMoments.js. ──
  const greet = useMemo(() => greeting({ name: firstName, returning: !!resume, hasSaved: !!savedLesson }), [firstName, resume, savedLesson]);
  // Split the salutation from the name so the name can be shown large (editorial):
  // "Good morning, Arjun." → salute "Good morning," + name "Arjun".
  const salute = useMemo(() => {
    const head = String(greet.hello || '').split(firstName)[0].trim();
    return head || greet.hello;
  }, [greet, firstName]);
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
        <StatusBar barStyle="light-content" backgroundColor={GRAD.brand[0]} />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* ── GRADIENT HEADER: greeting · teacher · mode toggle · topic search ── */}
            <Gradient colors={GRAD.brand} style={st.hero}>
              {Platform.OS === 'android' && <View style={{ height: 24 }} />}

              <View style={st.heroTop}>
                <PressableScale onPress={handleBack} style={st.heroBack} accessibilityLabel="Go back">
                  <Text style={st.heroBackTxt}>‹</Text>
                </PressableScale>
                <Text style={st.heroKicker} accessibilityRole="header">AI TEACHER</Text>
                <View style={{ width: 38 }} />
              </View>

              <View style={st.greetRow}>
                <View style={{ flex: 1 }}>
                  <Text style={st.greetSalute}>{salute}</Text>
                  <Text style={st.greetName}>{firstName}</Text>
                  {!!resume && <Text style={st.greetWave}>Welcome back! {'\u{1F44B}'}</Text>}
                  <Text style={st.greetPrompt}>{greet.prompt}</Text>
                </View>
                <View style={st.heroAvatar}>
                  <TeacherAvatar theme="dark" photo={TEACHER_HEADSHOT} state="idle" expression="smile" size={54} />
                </View>
              </View>

              {/* Mode toggle — Learn a Topic ↔ Ask the Material */}
              <View style={st.modeRow}>
                <PressableScale style={[st.modeBtn, mode === 'learn' && st.modeBtnOn]} onPress={() => setMode('learn')}
                  accessibilityLabel="Learn a topic" accessibilityState={{ selected: mode === 'learn' }}>
                  <Text style={[st.modeTxt, mode === 'learn' && st.modeTxtOn]}>Learn a Topic</Text>
                </PressableScale>
                <PressableScale style={[st.modeBtn, mode === 'ask' && st.modeBtnOn]} onPress={() => setMode('ask')}
                  accessibilityLabel="Ask the material" accessibilityState={{ selected: mode === 'ask' }}>
                  <Text style={[st.modeTxt, mode === 'ask' && st.modeTxtOn]}>Ask the Material</Text>
                </PressableScale>
              </View>

              {/* Topic search */}
              <View style={st.searchRow}>
                <View style={st.searchBox}>
                  <Text style={st.searchIcon}>🔍</Text>
                  <TextInput
                    style={st.searchInput}
                    placeholder="e.g. Pythagoras Theorem"
                    placeholderTextColor={C.faint}
                    value={topic}
                    onChangeText={setTopic}
                    onSubmitEditing={handleGenerate}
                    returnKeyType="go"
                    editable={!loading}
                    accessibilityLabel="Topic to learn"
                  />
                </View>
                <PressableScale onPress={handleGenerate} disabled={loading || !topic.trim()} accessibilityLabel="Start lesson"
                  style={[st.searchGoWrap, (loading || !topic.trim()) && { opacity: 0.55 }]}>
                  <Gradient colors={GRAD.hot} style={st.searchGo}>
                    {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.searchGoTxt}>✦</Text>}
                  </Gradient>
                </PressableScale>
              </View>
            </Gradient>

            <View style={st.body}>
              {!!error && (
                <Appear style={st.errCard}>
                  <Text style={st.errTxt} accessibilityLiveRegion="polite">⚠️  {error}</Text>
                  <PressableScale onPress={handleGenerate} accessibilityLabel="Try again"><Text style={st.retryTxt}>Try again ›</Text></PressableScale>
                </Appear>
              )}

              {/* Your teacher — Ms. Nova (full-body avatar, dark stage card) */}
              <Appear from="scale" style={st.teacherCard}>
                <TeacherFullBody photo={TEACHER_PHOTO} video={TEACHER_VIDEO} state="idle" theme="dark" height={300} />
                <View style={st.teacherTag}>
                  <Text style={st.teacherRole}>YOUR TEACHER</Text>
                  <Text style={st.teacherName}>Ms. Nova</Text>
                </View>
              </Appear>

              {/* Subjects */}
              <Text style={st.seclbl}>Subjects</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.subjRow}>
                {subjects.map((subj) => {
                  const m = subjectMeta(subj);
                  const on = activeSubject === subj;
                  return (
                    <PressableScale key={subj} style={[st.subjCard, { backgroundColor: m.tint }, on && st.subjCardOn]} onPress={() => setActiveSubject(subj)}
                      accessibilityLabel={`Subject ${subj}`} accessibilityState={{ selected: on }}>
                      <Text style={st.subjIcon}>{m.icon}</Text>
                      <Text style={[st.subjTxt, on && st.subjTxtOn]}>{subj}</Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>

              {/* Jump back in — the saved lesson + the welcome-back continuity card */}
              {(!!savedLesson || (resume && !resumeDismissed)) && <Text style={st.seclbl}>Jump back in</Text>}

              {savedLesson && (
                <Appear>
                  <PressableScale style={st.resumeCard} onPress={resumeSavedLesson} disabled={restoring}
                    accessibilityLabel={`Resume your lesson: ${savedLesson.title || 'continue where you left off'}`}>
                    <View style={st.resumeIcon}><Text style={{ fontSize: 20 }}>⏱</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.resumeTitle} numberOfLines={1}>{savedLesson.title || 'Continue where you left off'}</Text>
                      <Text style={st.resumeTag}>{resumeCardTag}</Text>
                    </View>
                    {restoring
                      ? <ActivityIndicator color={C.accent} size="small" />
                      : <Text style={st.resumeGo}>›</Text>}
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

              {/* For you — the three Study Insights entry points */}
              <Text style={st.seclbl}>For you</Text>
              {isNewStudent && <Text style={st.forYouHint}>{emptyHint}</Text>}
              <View style={st.insightGrid}>
                {[
                  // Opaque fills — see SUBJECT_META: an elevated card must not be translucent on Android.
                  { tab: 'next', icon: '🧭', title: 'What next?', sub: 'Smart study plan', bg: '#F8EDE5', edge: 'rgba(249,115,22,0.22)' },
                  { tab: 'revise', icon: '🔁', title: 'Revise', sub: 'Weak topics', bg: '#EDEAFB', edge: 'rgba(139,92,246,0.22)' },
                ].map((a, i) => (
                  <Appear key={a.tab} delay={60 + i * 60} style={{ flex: 1 }}>
                    <PressableScale style={[st.insightCard, { backgroundColor: a.bg, borderColor: a.edge }]} onPress={() => setInsights({ tab: a.tab })}
                      accessibilityLabel={`${a.title}. ${a.sub}`}>
                      <Text style={st.insightIcon}>{a.icon}</Text>
                      <Text style={st.insightTitle}>{a.title}</Text>
                      <Text style={st.insightSub}>{a.sub}</Text>
                    </PressableScale>
                  </Appear>
                ))}
              </View>
              <Appear delay={180}>
                <PressableScale style={[st.insightWide]} onPress={() => setInsights({ tab: 'progress' })}
                  accessibilityLabel="Progress. Your stats">
                  <Text style={st.insightIcon}>📊</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={st.insightTitle}>Progress</Text>
                    <Text style={st.insightSub}>Streak, study time, mastery</Text>
                  </View>
                  <Text style={st.resumeGo}>›</Text>
                </PressableScale>
              </Appear>

              <Text style={st.hint}>A live, voice-narrated lesson with a teacher, whiteboard, and doubts you can ask anytime.</Text>
              {!SPEECH_OK && <Text style={st.voiceNote}>🔇 Voice off — run “npx expo install expo-speech” to enable narration.</Text>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Generation overlay — the real preparing beats, staged ── */}
        {loading && (
          <View style={st.genOverlay}>
            <View style={st.genSpark}><Text style={{ fontSize: 34 }}>✨</Text></View>
            <Text style={st.genTitle}>Crafting your lesson…</Text>
            <View style={st.genList}>
              {prepStages.map((s, i) => (
                <View key={i} style={st.genRow}>
                  {i < genStage
                    ? <Text style={[st.genDot, { color: C.green }]}>✓</Text>
                    : i === genStage
                      ? <ActivityIndicator size="small" color={C.accent} style={st.genSpin} />
                      : <Text style={[st.genDot, { color: C.faint }]}>○</Text>}
                  <Text style={[st.genTxt, i === genStage && st.genTxtOn, i < genStage && st.genTxtDone]}>{s}</Text>
                </View>
              ))}
            </View>
            <Text style={st.genHint}>{prepHint}</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── Live classroom ──
  return (
    <SafeAreaView style={st.safeDark}>
      <StatusBar barStyle="light-content" backgroundColor={D.bg} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: D.bg }} />}
      <LiveTeachingPlayer
        lesson={lessonObj}
        subject={activeSubject}
        ttsOk={SPEECH_OK}
        startIndex={startIndex}
        priorModel={studentModel}
        onOutcome={recordOutcome}
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
  safeDark: { flex: 1, backgroundColor: D.bg },
  scroll: { paddingBottom: SP.xxl },

  // ── gradient hero header ──
  hero: {
    paddingHorizontal: SP.lg, paddingTop: SP.md, paddingBottom: SP.lg,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden',
    shadowColor: '#4F46E5', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.sm },
  heroBack: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  heroBackTxt: { fontSize: 24, color: '#fff', marginTop: -3 },
  heroKicker: { fontSize: 11, fontFamily: F.bold, color: 'rgba(255,255,255,0.85)', letterSpacing: 2.2 },

  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SP.lg },
  greetSalute: { fontSize: 15, fontFamily: F.med, color: 'rgba(255,255,255,0.82)' },
  greetName: { fontSize: 30, fontFamily: SERIF, fontWeight: '700', color: '#fff', letterSpacing: -0.6, marginTop: 1 },
  greetWave: { fontSize: 13, fontFamily: F.bold, color: '#fff', marginTop: 6 },
  greetPrompt: { fontSize: 12.5, fontFamily: F.med, color: 'rgba(255,255,255,0.78)', lineHeight: 18, marginTop: 4 },
  heroAvatar: { borderRadius: 32, borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)', padding: 2, backgroundColor: 'rgba(255,255,255,0.18)' },

  modeRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: R.pill, padding: 4, marginBottom: SP.md },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: R.pill, alignItems: 'center' },
  modeBtnOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  modeTxt: { fontSize: 13, fontFamily: F.semi, color: 'rgba(255,255,255,0.85)' },
  modeTxtOn: { color: C.accent },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: R.lg, paddingHorizontal: 14, height: 50 },
  searchIcon: { fontSize: 14, opacity: 0.5 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: F.med, color: C.ink, paddingVertical: 0 },
  // backgroundColor is required: Android draws the elevation shadow from the view's
  // own background, so a transparent one shows through as a white shape.
  searchGoWrap: { borderRadius: R.lg, overflow: 'hidden', backgroundColor: GRAD.hot[0], shadowColor: '#EC4899', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  searchGo: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  searchGoTxt: { color: '#fff', fontSize: 20, fontFamily: F.bold },

  // ── body ──
  body: { paddingHorizontal: SP.lg, paddingTop: SP.lg },
  seclbl: { fontSize: 11, fontFamily: F.bold, color: C.dim, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: SP.lg, marginBottom: SP.md },

  // teacher stage card
  teacherCard: { backgroundColor: D.panel, borderRadius: R.xxl, overflow: 'hidden', alignItems: 'center', paddingTop: SP.md, shadowColor: '#0F172A', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  teacherTag: { alignItems: 'center', paddingBottom: SP.md, paddingTop: SP.xs },
  teacherRole: { fontSize: 10, fontFamily: F.bold, color: '#A5B4FC', letterSpacing: 1.8 },
  teacherName: { fontSize: 20, fontFamily: SERIF, fontWeight: '600', color: '#fff', marginTop: 2 },

  // subject tiles
  subjRow: { gap: 10, paddingVertical: 2, paddingRight: SP.lg },
  subjCard: { width: 86, height: 92, borderRadius: R.xl, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  subjCardOn: { borderColor: C.accent, borderWidth: 2 },
  subjIcon: { fontSize: 24 },
  subjTxt: { fontSize: 11.5, fontFamily: F.semi, color: C.ink2 },
  subjTxtOn: { color: C.accent, fontFamily: F.bold },

  // resume card
  resumeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: R.xxl, padding: 16, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  resumeIcon: { width: 48, height: 48, borderRadius: R.md, backgroundColor: 'rgba(59,130,246,0.10)', alignItems: 'center', justifyContent: 'center' },
  resumeTitle: { fontSize: 15, fontFamily: F.bold, color: C.ink },
  resumeTag: { fontSize: 11, fontFamily: F.med, color: C.dim, marginTop: 3 },
  resumeGo: { fontSize: 24, fontFamily: F.reg, color: C.faint },

  // welcome-back
  welcomeCard: { marginTop: SP.md, backgroundColor: 'rgba(16,185,129,0.07)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', borderRadius: R.xxl, padding: SP.lg },
  welcomeClose: { position: 'absolute', top: 12, right: 14, zIndex: 2 },
  welcomeCloseTxt: { fontSize: 14, fontFamily: F.bold, color: C.dim },
  welcomeTag: { fontSize: 10, fontFamily: F.bold, color: C.teal, letterSpacing: 1.2, marginBottom: 6 },
  welcomeGreeting: { fontSize: 15, fontFamily: F.semi, color: C.ink, lineHeight: 22, paddingRight: 16 },
  welcomeSuggest: { fontSize: 13, fontFamily: F.med, color: C.ink2, lineHeight: 19, marginTop: 6 },
  welcomeBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SP.md },
  welcomePrimary: { backgroundColor: C.teal, borderRadius: R.md, paddingVertical: 11, paddingHorizontal: 18 },
  welcomePrimaryTxt: { color: '#fff', fontSize: 13, fontFamily: F.bold },
  welcomeGhost: { borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingVertical: 11, paddingHorizontal: 16, backgroundColor: C.board },
  welcomeGhostTxt: { color: C.ink2, fontSize: 13, fontFamily: F.semi },

  // for-you
  forYouHint: { fontSize: 12.5, fontFamily: F.med, color: C.ink2, lineHeight: 18, marginTop: -SP.sm, marginBottom: SP.md },
  insightGrid: { flexDirection: 'row', gap: 12 },
  insightCard: { borderRadius: R.xxl, borderWidth: 1, padding: SP.lg, gap: 4, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  insightWide: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12, borderRadius: R.xxl, borderWidth: 1, borderColor: 'rgba(16,185,129,0.22)', backgroundColor: '#E1F4F0', padding: SP.lg },
  insightIcon: { fontSize: 22, marginBottom: 2 },
  insightTitle: { fontSize: 14, fontFamily: F.bold, color: C.ink, letterSpacing: -0.2 },
  insightSub: { fontSize: 11.5, fontFamily: F.med, color: C.ink2, marginTop: 1 },

  // error
  errCard: { marginBottom: SP.md, backgroundColor: 'rgba(244,63,94,0.08)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.28)', borderRadius: R.lg, padding: SP.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  errTxt: { flex: 1, color: C.pink, fontSize: 13, fontFamily: F.semi },
  retryTxt: { color: C.ink, fontSize: 13, fontFamily: F.bold },

  hint: { fontSize: 13, fontFamily: F.med, color: C.dim, lineHeight: 20, marginTop: SP.xl, textAlign: 'center' },
  voiceNote: { fontSize: 11, fontFamily: F.semi, color: C.accent, marginTop: SP.md, textAlign: 'center' },

  // ── generation overlay ──
  genOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(248,250,252,0.96)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SP.xl, zIndex: 30 },
  genSpark: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: SP.lg },
  genTitle: { fontSize: 20, fontFamily: F.bold, color: C.ink, marginBottom: SP.xl, letterSpacing: -0.3 },
  genList: { alignSelf: 'stretch', gap: SP.md },
  genRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  genDot: { fontSize: 15, width: 22, textAlign: 'center', fontFamily: F.bold },
  genSpin: { width: 22 },
  genTxt: { flex: 1, fontSize: 14, fontFamily: F.med, color: C.dim },
  genTxtOn: { color: C.ink, fontFamily: F.bold },
  genTxtDone: { color: C.ink2 },
  genHint: { fontSize: 12, fontFamily: F.med, color: C.dim, marginTop: SP.xl, textAlign: 'center' },
});

export default AITeacherScreen;
