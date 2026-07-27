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
import LiveTeachingPlayer from '../components/teacher/LiveTeachingPlayer';
import TeacherAvatar from '../components/teacher/TeacherAvatar';
import TeacherFullBody from '../components/teacher/TeacherFullBody';
import { TEACHER_HEADSHOT, TEACHER_PHOTO, TEACHER_VIDEO } from '../components/teacher/teacherIdentity';
import { greeting, firstHello, preparingBeats, preparingHint, resumeTag, emptyState } from '../components/teacher/teacherMoments';
import { SP, R } from '../components/teacher/premiumTheme';
// AI Teacher runs on the app-wide design system, exactly like Home / Resources /
// Practice: studentTheme tokens, the Nunito family, the shared student UI kit and
// lucide icons. Only SP/R (spacing + radii) are still structural scales from the
// teacher module. Subject tiles keep their emoji — that is the app's own convention
// for subject identity (see utils/classSubjects → subjectDisplay).
import { S, shadow, shadowSm } from '../theme/studentTheme';
import { StudentSectionHeader, InkSurface } from '../theme/studentUI';
import { F } from './parent/ParentApp/constants';
import {
  ChevronLeft, ChevronRight, Search, Sparkles, Clock, X, Compass, Repeat,
  ChartNoAxesColumn, Check, Circle, CircleAlert, VolumeX,
} from 'lucide-react-native';
import { Appear, PressableScale } from '../components/teacher/uiKit';
import { stopTeacher, primeTeacherVoice, SPEECH_OK } from '../utils/teacherVoice';

// AI Teacher answers EVERY academic question, so it offers all subjects. Only the
// explanation depth adapts to the student's class (enforced server-side from scope);
// content restriction by stream lives on Practice/Resources, not here.
const SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'History'];

// Per-subject glyph + tint for the subject tiles (presentation only — the list above
// stays the single source of truth for which subjects exist). Emoji glyphs match the
// app's own subject convention (utils/classSubjects → subjectDisplay); the tints are
// the palette's `*Soft` accents, one per subject, so nothing here is a bespoke hue.
// They are OPAQUE on purpose: Android renders an elevation shadow from the view's own
// background, so a translucent fill shows through as a white block behind the card.
const SUBJECT_META = {
  Physics: { icon: '🌌', tint: S.purpleSoft, accent: S.purple },
  Maths: { icon: '📐', tint: S.blueSoft, accent: S.blue },
  Chemistry: { icon: '🧪', tint: S.emeraldSoft, accent: S.emerald },
  Biology: { icon: '🧬', tint: S.redSoft, accent: S.red },
  English: { icon: '📚', tint: S.goldSoft, accent: S.gold },
  History: { icon: '🏛️', tint: S.orangeSoft, accent: S.orange },
};
const subjectMeta = (s) => SUBJECT_META[s] || { icon: '✨', tint: S.indigoSoft, accent: S.indigo };

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

  // No font gate here any more. Nunito is loaded app-wide in App.js WITHOUT blocking
  // render (see the comment there) and falls back to the system font until it lands,
  // so holding the first paint would make this the only screen in the app with a
  // splash — and a font hiccup could strand the student on it.

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
        <StatusBar barStyle="light-content" backgroundColor={S.heroB} />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* ── HERO: greeting · teacher · mode toggle · topic search. The deep indigo
                is the app's own signature dark surface (InkSurface, same as the Home
                hero), not a palette this screen invented. ── */}
            <View style={st.hero}>
              <InkSurface radius={0} />
              {Platform.OS === 'android' && <View style={{ height: 24 }} />}

              <View style={st.heroTop}>
                <PressableScale onPress={handleBack} style={st.heroBack} accessibilityLabel="Go back">
                  <ChevronLeft size={20} color="#fff" strokeWidth={2.6} />
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
                  <Search size={16} color={S.faint} strokeWidth={2.4} />
                  <TextInput
                    style={st.searchInput}
                    placeholder="e.g. Pythagoras Theorem"
                    placeholderTextColor={S.faint}
                    value={topic}
                    onChangeText={setTopic}
                    onSubmitEditing={handleGenerate}
                    returnKeyType="go"
                    editable={!loading}
                    accessibilityLabel="Topic to learn"
                  />
                </View>
                <PressableScale onPress={handleGenerate} disabled={loading || !topic.trim()} accessibilityLabel="Start lesson"
                  style={[st.searchGo, (loading || !topic.trim()) && { opacity: 0.55 }]}>
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : <Sparkles size={20} color="#fff" strokeWidth={2.4} />}
                </PressableScale>
              </View>
            </View>

            <View style={st.body}>
              {!!error && (
                <Appear style={st.errCard}>
                  <CircleAlert size={17} color={S.red} strokeWidth={2.4} />
                  <Text style={st.errTxt} accessibilityLiveRegion="polite">{error}</Text>
                  <PressableScale onPress={handleGenerate} accessibilityLabel="Try again"><Text style={st.retryTxt}>Try again</Text></PressableScale>
                </Appear>
              )}

              {/* Your teacher — Ms. Nova on the app's signature dark stage */}
              <Appear from="scale" style={st.teacherCard}>
                <InkSurface radius={R.xxl} />
                <TeacherFullBody photo={TEACHER_PHOTO} video={TEACHER_VIDEO} state="idle" theme="dark" height={300} />
                <View style={st.teacherTag}>
                  <Text style={st.teacherRole}>YOUR TEACHER</Text>
                  <Text style={st.teacherName}>Ms. Nova</Text>
                </View>
              </Appear>

              {/* Subjects */}
              <StudentSectionHeader title="Subjects" accent={S.indigo} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.subjRow}>
                {subjects.map((subj) => {
                  const m = subjectMeta(subj);
                  const on = activeSubject === subj;
                  return (
                    <PressableScale key={subj} style={[st.subjCard, { backgroundColor: m.tint }, on && { borderColor: m.accent, borderWidth: 2 }]} onPress={() => setActiveSubject(subj)}
                      accessibilityLabel={`Subject ${subj}`} accessibilityState={{ selected: on }}>
                      <Text style={st.subjIcon}>{m.icon}</Text>
                      <Text style={[st.subjTxt, on && st.subjTxtOn]}>{subj}</Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>

              {/* Jump back in — the saved lesson + the welcome-back continuity card */}
              {(!!savedLesson || (resume && !resumeDismissed)) && <StudentSectionHeader title="Jump back in" accent={S.blue} />}

              {savedLesson && (
                <Appear>
                  <PressableScale style={st.resumeCard} onPress={resumeSavedLesson} disabled={restoring}
                    accessibilityLabel={`Resume your lesson: ${savedLesson.title || 'continue where you left off'}`}>
                    <View style={st.resumeIcon}><Clock size={21} color={S.blue} strokeWidth={2.2} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.resumeTitle} numberOfLines={1}>{savedLesson.title || 'Continue where you left off'}</Text>
                      <Text style={st.resumeTag}>{resumeCardTag}</Text>
                    </View>
                    {restoring
                      ? <ActivityIndicator color={S.indigo} size="small" />
                      : <ChevronRight size={20} color={S.faint} strokeWidth={2.4} />}
                  </PressableScale>
                </Appear>
              )}

              {resume && !resumeDismissed && (
                <Appear style={st.welcomeCard}>
                  <PressableScale style={st.welcomeClose} onPress={() => setResumeDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Dismiss welcome back">
                    <X size={15} color={S.muted} strokeWidth={2.6} />
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
                      <Text style={st.welcomePrimaryTxt}>Continue revising</Text>
                      <ChevronRight size={16} color="#fff" strokeWidth={2.8} />
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
              <StudentSectionHeader title="For you" accent={S.orange} />
              {isNewStudent && <Text style={st.forYouHint}>{emptyHint}</Text>}
              {/* Each entry point takes ONE accent from the palette and wears it as a
                  tinted icon tile on a plain white card — the same shape Home and
                  Resources use, instead of three differently-tinted card fills. */}
              <View style={st.insightGrid}>
                {[
                  { tab: 'next', Icon: Compass, title: 'What next?', sub: 'Smart study plan', tint: S.orange, tintBg: S.orangeSoft },
                  { tab: 'revise', Icon: Repeat, title: 'Revise', sub: 'Weak topics', tint: S.purple, tintBg: S.purpleSoft },
                ].map((a, i) => (
                  <Appear key={a.tab} delay={60 + i * 60} style={{ flex: 1 }}>
                    <PressableScale style={st.insightCard} onPress={() => setInsights({ tab: a.tab })}
                      accessibilityLabel={`${a.title}. ${a.sub}`}>
                      <View style={[st.insightIcon, { backgroundColor: a.tintBg }]}>
                        <a.Icon size={19} color={a.tint} strokeWidth={2.3} />
                      </View>
                      <Text style={st.insightTitle}>{a.title}</Text>
                      <Text style={st.insightSub}>{a.sub}</Text>
                    </PressableScale>
                  </Appear>
                ))}
              </View>
              <Appear delay={180}>
                <PressableScale style={st.insightWide} onPress={() => setInsights({ tab: 'progress' })}
                  accessibilityLabel="Progress. Your stats">
                  <View style={[st.insightIcon, { backgroundColor: S.emeraldSoft, marginBottom: 0 }]}>
                    <ChartNoAxesColumn size={19} color={S.emerald} strokeWidth={2.3} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.insightTitle}>Progress</Text>
                    <Text style={st.insightSub}>Streak, study time, mastery</Text>
                  </View>
                  <ChevronRight size={20} color={S.faint} strokeWidth={2.4} />
                </PressableScale>
              </Appear>

              <Text style={st.hint}>A live, voice-narrated lesson with a teacher, whiteboard, and doubts you can ask anytime.</Text>
              {!SPEECH_OK && (
                <View style={st.voiceNote}>
                  <VolumeX size={14} color={S.muted} strokeWidth={2.3} />
                  <Text style={st.voiceNoteTxt}>Voice off — run “npx expo install expo-speech” to enable narration.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Generation overlay — the real preparing beats, staged ── */}
        {loading && (
          <View style={st.genOverlay}>
            <View style={st.genSpark}><Sparkles size={34} color={S.indigo} strokeWidth={2} /></View>
            <Text style={st.genTitle}>Crafting your lesson…</Text>
            <View style={st.genList}>
              {prepStages.map((s, i) => (
                <View key={i} style={st.genRow}>
                  {i < genStage
                    ? <View style={st.genDot}><Check size={15} color={S.emerald} strokeWidth={3} /></View>
                    : i === genStage
                      ? <ActivityIndicator size="small" color={S.indigo} style={st.genSpin} />
                      : <View style={st.genDot}><Circle size={13} color={S.faint} strokeWidth={2.2} /></View>}
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
    <SafeAreaView style={st.safeRoom}>
      <StatusBar barStyle="dark-content" backgroundColor={S.canvas} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: S.canvas }} />}
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

// Same three planes the live classroom uses, so entering a lesson is a continuation
// rather than a scene change: the canvas is quiet, white cards carry the content, and
// only the hero + teacher stage go deep. Every colour is a studentTheme token.
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: S.canvas },
  // The live classroom runs on the same canvas — see LiveTeachingPlayer.
  safeRoom: { flex: 1, backgroundColor: S.canvas },
  scroll: { paddingBottom: SP.xxl },

  // ── hero header (InkSurface paints the deep indigo behind this) ──
  hero: {
    paddingHorizontal: SP.lg, paddingTop: SP.md, paddingBottom: SP.lg,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden',
    backgroundColor: S.heroB, ...shadow,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.sm },
  heroBack: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  heroKicker: { fontSize: 11, fontFamily: F.xbold, color: 'rgba(255,255,255,0.85)', letterSpacing: 2.2 },

  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SP.lg },
  greetSalute: { fontSize: 15, fontFamily: F.med, color: 'rgba(255,255,255,0.82)' },
  greetName: { fontSize: 30, fontFamily: F.black, color: '#fff', letterSpacing: -0.6, marginTop: 1 },
  greetWave: { fontSize: 13, fontFamily: F.bold, color: '#fff', marginTop: 6 },
  greetPrompt: { fontSize: 12.5, fontFamily: F.med, color: 'rgba(255,255,255,0.78)', lineHeight: 18, marginTop: 4 },
  heroAvatar: { borderRadius: 32, borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)', padding: 2, backgroundColor: 'rgba(255,255,255,0.16)' },

  modeRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.24)', borderRadius: R.pill, padding: 4, marginBottom: SP.md },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: R.pill, alignItems: 'center' },
  modeBtnOn: { backgroundColor: '#fff', ...shadowSm },
  modeTxt: { fontSize: 13, fontFamily: F.bold, color: 'rgba(255,255,255,0.85)' },
  modeTxtOn: { color: S.indigo },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: S.card, borderRadius: R.lg, paddingHorizontal: 14, height: 50 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: F.med, color: S.ink, paddingVertical: 0 },
  // backgroundColor is required: Android draws the elevation shadow from the view's
  // own background, so a transparent one shows through as a white shape.
  searchGo: { width: 50, height: 50, borderRadius: R.lg, backgroundColor: S.indigo, alignItems: 'center', justifyContent: 'center', ...shadowSm },

  // ── body ──
  body: { paddingHorizontal: SP.lg, paddingTop: SP.md },

  // teacher stage — the one other deep surface, matching the hero
  teacherCard: { backgroundColor: S.heroB, borderRadius: R.xxl, overflow: 'hidden', alignItems: 'center', paddingTop: SP.md, ...shadow },
  teacherTag: { alignItems: 'center', paddingBottom: SP.md, paddingTop: SP.xs },
  teacherRole: { fontSize: 10, fontFamily: F.xbold, color: S.heroGlow, letterSpacing: 1.8 },
  teacherName: { fontSize: 20, fontFamily: F.black, color: '#fff', marginTop: 2, letterSpacing: -0.3 },

  // subject tiles — tinted fill, white hairline, accent border when picked
  subjRow: { gap: 10, paddingVertical: 2, paddingRight: SP.lg },
  subjCard: { width: 86, height: 92, borderRadius: R.xl, borderWidth: 1.5, borderColor: S.white, alignItems: 'center', justifyContent: 'center', gap: 6, ...shadowSm },
  subjIcon: { fontSize: 24 },
  subjTxt: { fontSize: 11.5, fontFamily: F.bold, color: S.sub },
  subjTxtOn: { color: S.ink, fontFamily: F.xbold },

  // resume card
  resumeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, borderRadius: R.xxl, padding: 16, ...shadowSm },
  resumeIcon: { width: 48, height: 48, borderRadius: R.md, backgroundColor: S.blueSoft, alignItems: 'center', justifyContent: 'center' },
  resumeTitle: { fontSize: 15, fontFamily: F.xbold, color: S.ink },
  resumeTag: { fontSize: 11, fontFamily: F.med, color: S.muted, marginTop: 3 },

  // welcome-back — the one tinted card, so it reads as a transient message
  welcomeCard: { marginTop: SP.md, backgroundColor: S.emeraldSoft, borderWidth: 1, borderColor: S.emerald, borderRadius: R.xxl, padding: SP.lg },
  welcomeClose: { position: 'absolute', top: 12, right: 14, zIndex: 2 },
  welcomeTag: { fontSize: 10, fontFamily: F.xbold, color: S.sub, letterSpacing: 1.2, marginBottom: 6 },
  welcomeGreeting: { fontSize: 15, fontFamily: F.bold, color: S.ink, lineHeight: 22, paddingRight: 16 },
  welcomeSuggest: { fontSize: 13, fontFamily: F.med, color: S.sub, lineHeight: 19, marginTop: 6 },
  welcomeBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SP.md },
  // Indigo, not the card's emerald: white on S.emerald is only 3.0:1, and indigo is
  // the app's primary-action colour everywhere else. The tint identifies the card,
  // the button identifies the action.
  welcomePrimary: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: S.indigo, borderRadius: R.md, paddingVertical: 11, paddingHorizontal: 18, ...shadowSm },
  welcomePrimaryTxt: { color: '#fff', fontSize: 13, fontFamily: F.bold },
  welcomeGhost: { borderWidth: 1, borderColor: S.border, borderRadius: R.md, paddingVertical: 11, paddingHorizontal: 16, backgroundColor: S.card },
  welcomeGhostTxt: { color: S.sub, fontSize: 13, fontFamily: F.bold },

  // for-you — plain white cards; the accent lives in the icon tile, not the fill
  forYouHint: { fontSize: 12.5, fontFamily: F.med, color: S.sub, lineHeight: 18, marginTop: -SP.sm, marginBottom: SP.md },
  insightGrid: { flexDirection: 'row', gap: 12 },
  insightCard: { flex: 1, backgroundColor: S.card, borderRadius: R.xxl, borderWidth: 1, borderColor: S.hair, padding: SP.lg, gap: 4, ...shadowSm },
  insightWide: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12, backgroundColor: S.card, borderRadius: R.xxl, borderWidth: 1, borderColor: S.hair, padding: SP.lg, ...shadowSm },
  insightIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  insightTitle: { fontSize: 14, fontFamily: F.xbold, color: S.ink, letterSpacing: -0.2 },
  insightSub: { fontSize: 11.5, fontFamily: F.med, color: S.muted, marginTop: 1 },

  // error
  errCard: { marginBottom: SP.md, backgroundColor: S.redSoft, borderWidth: 1, borderColor: S.red, borderRadius: R.lg, padding: SP.md, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errTxt: { flex: 1, color: S.ink, fontSize: 13, fontFamily: F.semi },
  // S.red on S.redSoft is 3.2:1 — the red stays on the icon and border, the action
  // label keeps ink so it is actually readable.
  retryTxt: { color: S.ink, fontSize: 13, fontFamily: F.xbold },

  hint: { fontSize: 13, fontFamily: F.med, color: S.muted, lineHeight: 20, marginTop: SP.xl, textAlign: 'center' },
  voiceNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: SP.md },
  voiceNoteTxt: { fontSize: 11.5, fontFamily: F.semi, color: S.muted },

  // ── generation overlay ──
  genOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(244,245,251,0.97)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SP.xl, zIndex: 30 },
  genSpark: { width: 80, height: 80, borderRadius: 40, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center', marginBottom: SP.lg },
  genTitle: { fontSize: 20, fontFamily: F.black, color: S.ink, marginBottom: SP.xl, letterSpacing: -0.3 },
  genList: { alignSelf: 'stretch', gap: SP.md },
  genRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  genDot: { width: 22, alignItems: 'center', justifyContent: 'center' },
  genSpin: { width: 22 },
  genTxt: { flex: 1, fontSize: 14, fontFamily: F.med, color: S.muted },
  genTxtOn: { color: S.ink, fontFamily: F.xbold },
  genTxtDone: { color: S.sub },
  genHint: { fontSize: 12, fontFamily: F.med, color: S.muted, marginTop: SP.xl, textAlign: 'center' },
});

export default AITeacherScreen;
