// src/screens/AITeacherScreen.js
// The AI Teacher landing, rebuilt as a LESSON LIBRARY on the shared night palette
// (src/theme/nightTheme.js) — the same layout as the Sessions tab:
//
//   header → composer (subject · topic · teaching style) → Continue-learning hero
//   → My Lessons (subject chips + date range + grid/list toggle) with % rings
//
// The lesson-generation flow, the resume/restore flow, Ask-the-Material, Study
// Insights, "Your learning" and the live classroom are all unchanged — only the
// landing's presentation moved. Entering a lesson still hands off to
// LiveTeachingPlayer, which owns all playback state.
//
// Unlike the Sessions tab, the progress rings here are REAL: GET /api/ai/lessons/progress
// returns a stored `percent` per lesson (written by updateLessonProgress on a 15s timer
// while a lesson is open), so the ring is the student's actual position, not a guess.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, ScrollView, TextInput, Platform, Modal,
  KeyboardAvoidingView, ActivityIndicator, Animated, Easing, Pressable, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts as useAuroraFonts,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useAuth } from '../context/AuthContext';
import {
  generateLesson, askAgent, askAgentStream, getResumeContext, getLesson,
  updateLessonProgress, getLessonsProgress, TEACHING_MODES,
} from '../api/aiApi';
import { saveActiveLesson, getActiveLesson, clearActiveLesson, getStudentModel, saveStudentModel } from '../utils/storage';
import { loadLearnerPrefs, prefsForRequest } from '../utils/learnerPrefs';
import { foldOutcome } from '../components/teacher/pedagogyEngine';
import KnowledgeAskScreen from './KnowledgeAskScreen';
import StudyInsightsScreen from './StudyInsightsScreen';
import LiveTeachingPlayer from '../components/teacher/LiveTeachingPlayer';
import TeacherAvatar from '../components/teacher/TeacherAvatar';
import { TEACHER_HEADSHOT } from '../components/teacher/teacherIdentity';
import { greeting, preparingBeats, preparingHint, resumeTag, emptyState } from '../components/teacher/teacherMoments';
import {
  ChevronLeft, ChevronRight, ChevronDown, Search, Sparkles, Clock, X, Compass, Repeat,
  ChartNoAxesColumn, Check, Circle, CircleAlert, VolumeX, Brain, Play,
  LayoutGrid, List, Calendar,
  // Subject glyphs — see SUBJECT_META below.
  Atom, Sigma, FlaskConical, Dna, BookOpen, Landmark,
} from 'lucide-react-native';
import { stopTeacher, primeTeacherVoice, SPEECH_OK } from '../utils/teacherVoice';
import YourLearning from '../components/teacher/YourLearning';
import { N, NFONT } from '../theme/nightTheme';
import { NightBg, Appear as Rise } from '../theme/nightChrome';

const { width: W } = Dimensions.get('window');
const PAD = 18;
const GRID_W = (W - PAD * 2 - 12) / 2;

// AI Teacher answers EVERY academic question, so it offers all subjects. Only the
// explanation depth adapts to the student's class (enforced server-side from scope);
// content restriction by stream lives on Practice/Resources, not here.
const SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'History'];

// Per-subject glyph + hue for the composer's subject row. The list above stays the
// single source of truth for which subjects exist; this is presentation only. Hues are
// night-palette tokens, since this screen is on `N` now.
const SUBJECT_META = {
  Physics:   { Icon: Atom,        hue: N.violet },
  Maths:     { Icon: Sigma,       hue: N.blue },
  Chemistry: { Icon: FlaskConical, hue: N.green },
  Biology:   { Icon: Dna,         hue: '#F0566E' },
  English:   { Icon: BookOpen,    hue: N.amber },
  History:   { Icon: Landmark,    hue: '#E88A4D' },
};
const subjectMeta = (s) => SUBJECT_META[s] || { Icon: Sparkles, hue: N.violet };

const RANGES = [
  { key: 'all', label: 'All time',      days: null },
  { key: 'd7',  label: 'Last 7 days',   days: 7 },
  { key: 'd30', label: 'Last 30 days',  days: 30 },
  { key: 'd90', label: 'Last 3 months', days: 90 },
];

const DAY = 86400000;
const ms = (iso) => new Date(iso).getTime();
const fmtDay   = (iso) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtShort = (d)   => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// ── type helper ─────────────────────────────────────────────────────────────
function T({ w = 'reg', s = 14, c = N.inkSoft, F, style, children, ...rest }) {
  const fam = w === 'bold' ? F.bold : w === 'semi' || w === 'med' ? F.med : F.reg;
  return <Text {...rest} style={[{ fontFamily: fam, fontSize: s, color: c }, style]}>{children}</Text>;
}

// ── real progress ring: percent comes from lesson_progress, not a guess ─────
function ProgressRing({ percent = 0, size = 48, F }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  const done = pct >= 100;
  const tint = done ? N.green : pct > 0 ? N.green : N.violet;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <SvgCircle cx={size / 2} cy={size / 2} r={r} stroke={N.track} strokeWidth={4} fill="none" />
        {pct > 0 && (
          <SvgCircle
            cx={size / 2} cy={size / 2} r={r}
            stroke={tint} strokeWidth={4} fill="none"
            strokeDasharray={`${(c * pct) / 100} ${c}`} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      {pct > 0
        ? <T F={F} w="bold" s={size > 36 ? 12 : 9} c={tint}>{pct}%</T>
        : <Play size={size > 36 ? 15 : 11} color={N.violet} strokeWidth={2.5} fill={N.violet} />}
    </View>
  );
}

// ── aurora placeholder thumbnail (lessons carry no artwork) ─────────────────
function Thumb({ style, radius = 12, Icon, hue }) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
      <LinearGradient
        colors={[N.orbA, N.orbB]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {!!Icon && <Icon size={28} color={hue || 'rgba(255,255,255,0.9)'} strokeWidth={1.8} />}
    </View>
  );
}

const AITeacherScreen = ({ initialSubject = 'Physics', initialTopic = '', onBack }) => {
  const { user, scope } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const subjects = SUBJECTS;
  const insetsSafe = useSafeAreaInsets();
  const [fontsLoaded] = useAuroraFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  });
  const F = fontsLoaded ? NFONT : { reg: undefined, med: undefined, semi: undefined, bold: undefined };

  const [activeSubject, setActiveSubject] = useState(initialSubject);
  // 'learn' = generate a lesson; 'ask' = grounded RAG Q&A over uploaded material.
  const [mode, setMode] = useState('learn');
  const [learningOpen, setLearningOpen] = useState(false); // "Your learning" memory sheet
  const [teachMode, setTeachMode] = useState('auto');      // teaching-mode register for the next lesson
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

  // ── the library ──
  const [lessons, setLessons] = useState(null); // null = loading
  const [libSubject, setLibSubject] = useState('All');
  const [range, setRange] = useState('all');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'grid'

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

  // The library — refetched whenever we come back to the landing (a lesson just
  // finished generating or the student exited the classroom), so a new lesson and
  // its progress appear without a manual refresh.
  useEffect(() => {
    if (slides.length > 0) return undefined;
    let alive = true;
    getLessonsProgress()
      .then((d) => { if (alive) setLessons(Array.isArray(d?.lessons) ? d.lessons : []); })
      .catch(() => { if (alive) setLessons([]); });
    return () => { alive = false; };
  }, [slides.length]);

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

  // Pull a lesson into the player by id, resuming at `startAt`. Shared by the saved
  // "continue" pointer and by any row tapped in the library.
  const openLesson = async ({ id, title, startAt = 0 }) => {
    if (!id || restoring) return;
    setRestoring(true);
    setError('');
    try {
      const { lesson } = await getLesson(id);
      if (!mountedRef.current) return;
      if (!lesson || !Array.isArray(lesson.slides) || lesson.slides.length === 0) throw new Error('empty');
      if (lesson.subject) setActiveSubject(lesson.subject);
      clearingRef.current = false;
      setStartIndex(Number(startAt) || 0); // resume at saved position
      setLessonId(id);
      setLessonTitle(lesson.lessonTitle || title || '');
      setSlides(lesson.slides);
      setKeyTerms(lesson.keyTerms || []);
      historyRef.current = [];
      pendingRef.current = null;
      return true;
    } catch (e) {
      if (mountedRef.current) setError('That lesson could not be opened — it may still be generating.');
      return false;
    } finally {
      if (mountedRef.current) setRestoring(false);
    }
  };

  // The persisted "continue where you left off" pointer. A failure here means the
  // lesson is gone, so drop the pointer rather than offering it again.
  const resumeSavedLesson = async () => {
    if (!savedLesson || restoring) return;
    const ok = await openLesson({
      id: savedLesson.lessonId,
      title: savedLesson.title,
      startAt: savedLesson.slideIndex,
    });
    if (ok === false) {
      await clearActiveLesson();
      if (mountedRef.current) { setSavedLesson(null); setError('That lesson is no longer available. Start a new one below.'); }
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
      // Read the latest saved learning preferences (edited in "Your learning") and
      // send them along so the lesson matches how this student likes to learn.
      const prefs = prefsForRequest(await loadLearnerPrefs());
      const payload = { topic: t, subject: activeSubject, gradeLevel: scope?.classNum ? String(scope.classNum) : (user?.grade || ''), mode: teachMode, prefs };
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
      if (mountedRef.current) setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'I couldn’t put that lesson together just now — let’s try again.');
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
  const isNewStudent = !resume && !savedLesson;
  const prepStages = useMemo(() => preparingBeats(topic), [topic]);
  // The long tail of generation (30–90s) used to sit on one static reassurance line —
  // a minute of the same line reads as hung. Rotate it on a calm cadence (distinct from
  // the stage ticker) so the wait stays alive and honest.
  const [prepHint, setPrepHint] = useState(preparingHint);
  useEffect(() => {
    if (!loading) return undefined;
    const id = setInterval(() => setPrepHint(preparingHint()), 4500);
    return () => clearInterval(id);
  }, [loading]);
  // Gently fade the full-screen preparing overlay in instead of hard-snapping it over
  // the screen when the student taps Start.
  const genFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!loading) { genFade.setValue(0); return undefined; }
    const anim = Animated.timing(genFade, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [loading, genFade]);
  const resumeCardTag = useMemo(() => resumeTag(), [savedLesson]);
  const emptyHint = useMemo(() => emptyState('insights'), []);

  // ── library derivations ──
  const rows = useMemo(() => lessons || [], [lessons]);
  const titleOf = (l) => l.lessonTitle || l.topic || 'Untitled lesson';
  const now = Date.now();

  const libSubjects = useMemo(() => {
    const set = [];
    rows.forEach((l) => { if (l.subject && !set.includes(l.subject)) set.push(l.subject); });
    return ['All', ...set];
  }, [rows]);

  // Keep the chip valid if the list changes under it.
  useEffect(() => {
    if (libSubject !== 'All' && !libSubjects.includes(libSubject)) setLibSubject('All');
  }, [libSubjects, libSubject]);

  const activeRange = RANGES.find((r) => r.key === range) || RANGES[0];
  const rangeLabel = activeRange.days
    ? `${fmtShort(new Date(now - activeRange.days * DAY))} – ${fmtShort(new Date(now))}`
    : 'All time';

  const library = useMemo(() => rows
    .filter((l) => libSubject === 'All' || l.subject === libSubject)
    .filter((l) => !activeRange.days || ms(l.createdAt) >= now - activeRange.days * DAY)
    .sort((a, b) => ms(b.createdAt) - ms(a.createdAt)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [rows, libSubject, activeRange]);

  const filtersActive = libSubject !== 'All' || range !== 'all';
  // The hero continues the saved pointer if there is one; otherwise the most recent
  // lesson the student has started but not finished.
  const heroLesson = rows.find((l) => l.percent > 0 && !l.completed) || null;

  // No font gate here any more. Space Grotesk falls back to the system font until it
  // lands, so holding the first paint would make this the only screen with a splash.

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

  // ── Landing: composer + lesson library ──
  if (slides.length === 0) {
    return (
      <View style={ns.root}>
        <StatusBar barStyle="light-content" backgroundColor={N.bgTop} translucent={false} />
        <NightBg id="ai" />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={ns.body}
            contentContainerStyle={{ paddingTop: insetsSafe.top + 10, paddingBottom: 44 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top row */}
            <View style={ns.topRow}>
              <Pressable onPress={handleBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back" style={ns.iconBtn}>
                <ChevronLeft size={22} color={N.inkSoft} strokeWidth={2.2} />
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => setLearningOpen(true)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Your learning — what the teacher remembers about you"
                style={ns.iconBtn}
              >
                <Brain size={20} color={N.inkSoft} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Header */}
            <Rise delay={30}>
              <View style={ns.headRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T F={F} w="bold" s={34} c={N.ink} style={{ letterSpacing: -0.8 }}>AI Teacher</T>
                  <T F={F} s={15} c={N.inkSoft} style={{ marginTop: 4 }}>
                    {greet.hello} {greet.prompt}
                  </T>
                </View>
                <View style={ns.avatarWrap}>
                  <TeacherAvatar theme="dark" photo={TEACHER_HEADSHOT} state="idle" expression="smile" size={54} />
                  <View style={ns.avatarDot} />
                </View>
              </View>
            </Rise>

            {/* Mode toggle — Learn a Topic ↔ Ask the Material */}
            <View style={ns.segment}>
              {[{ k: 'learn', label: 'Learn a Topic' }, { k: 'ask', label: 'Ask the Material' }].map((m) => {
                const on = mode === m.k;
                return (
                  <Pressable
                    key={m.k}
                    onPress={() => setMode(m.k)}
                    accessibilityRole="button"
                    accessibilityLabel={m.label}
                    accessibilityState={{ selected: on }}
                    style={[ns.segItem, on && ns.segItemOn]}
                  >
                    <T F={F} w="med" s={14} c={on ? N.ink : N.inkSoft}>{m.label}</T>
                  </Pressable>
                );
              })}
            </View>

            {/* Composer */}
            <Rise delay={70}>
              <View style={ns.composer}>
                {/* Subject */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingRight: 4 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {subjects.map((subj) => {
                    const m = subjectMeta(subj);
                    const on = activeSubject === subj;
                    return (
                      <Pressable
                        key={subj}
                        onPress={() => setActiveSubject(subj)}
                        accessibilityRole="button"
                        accessibilityLabel={`Subject ${subj}`}
                        accessibilityState={{ selected: on }}
                        style={[ns.subjChip, on && { borderColor: m.hue, backgroundColor: N.cardSoft }]}
                      >
                        <m.Icon size={16} color={on ? m.hue : N.inkSoft} strokeWidth={2} />
                        <T F={F} w="med" s={13.5} c={on ? N.ink : N.inkSoft}>{subj}</T>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Topic */}
                <View style={ns.searchRow}>
                  <View style={ns.searchBox}>
                    <Search size={18} color={N.inkDim} strokeWidth={2} />
                    <TextInput
                      style={[ns.searchInput, { fontFamily: F.reg }]}
                      placeholder="e.g. Pythagoras Theorem"
                      placeholderTextColor={N.inkDim}
                      value={topic}
                      onChangeText={setTopic}
                      onSubmitEditing={handleGenerate}
                      returnKeyType="go"
                      editable={!loading}
                      keyboardAppearance="dark"
                      selectionColor={N.violet}
                      accessibilityLabel="Topic to learn"
                    />
                  </View>
                  <Pressable
                    onPress={handleGenerate}
                    disabled={loading || !topic.trim()}
                    accessibilityRole="button"
                    accessibilityLabel="Start lesson"
                    style={({ pressed }) => [ns.goWrap, (loading || !topic.trim()) && { opacity: 0.5 }, pressed && { transform: [{ scale: 0.96 }] }]}
                  >
                    <LinearGradient
                      colors={[N.violet, N.violetLo]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={ns.go}
                    >
                      {loading
                        ? <ActivityIndicator color={N.ink} size="small" />
                        : <Sparkles size={20} color={N.ink} strokeWidth={2.2} />}
                    </LinearGradient>
                  </Pressable>
                </View>

                {/* Teaching style — Auto lets the teacher pick the register from what
                    it knows about the student; or override it. */}
                <T F={F} w="med" s={12.5} c={N.inkDim} style={{ letterSpacing: 0.6, marginTop: 2 }}>TEACHING STYLE</T>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingRight: 4 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {TEACHING_MODES.map((m) => {
                    const on = teachMode === m.key;
                    return (
                      <Pressable
                        key={m.key}
                        onPress={() => setTeachMode(m.key)}
                        accessibilityRole="button"
                        accessibilityLabel={`Teaching style: ${m.label}`}
                        accessibilityState={{ selected: on }}
                        style={[ns.styleChip, on && ns.styleChipOn]}
                      >
                        <T F={F} w="med" s={13} c={on ? N.ink : N.inkSoft}>{m.short}</T>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </Rise>

            {!!error && (
              <View style={ns.errCard}>
                <CircleAlert size={17} color="#F0566E" strokeWidth={2.2} />
                <T F={F} w="med" s={13} c="#F0566E" style={{ flex: 1, lineHeight: 18 }} accessibilityLiveRegion="polite">{error}</T>
                <Pressable onPress={handleGenerate} hitSlop={8} accessibilityRole="button" accessibilityLabel="Try again">
                  <T F={F} w="bold" s={13} c={N.ink}>Retry</T>
                </Pressable>
              </View>
            )}

            {/* Continue learning — the saved pointer, else the newest unfinished lesson */}
            {(!!savedLesson || !!heroLesson) && (
              <Rise delay={110}>
                <Pressable
                  onPress={() => (savedLesson
                    ? resumeSavedLesson()
                    : openLesson({ id: heroLesson.id, title: titleOf(heroLesson), startAt: heroLesson.lastSlideIndex }))}
                  disabled={restoring}
                  accessibilityRole="button"
                  accessibilityLabel={`Resume ${savedLesson ? (savedLesson.title || 'your lesson') : titleOf(heroLesson)}`}
                  style={({ pressed }) => [ns.hero, pressed && { opacity: 0.9 }]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={ns.heroTagRow}>
                      <View style={ns.livePill}>
                        <View style={ns.liveDot} />
                        <T F={F} w="bold" s={11} c={N.violet} style={{ letterSpacing: 0.8 }}>IN PROGRESS</T>
                      </View>
                      <T F={F} w="bold" s={13} c={N.violet} numberOfLines={1} style={{ letterSpacing: 0.4, flex: 1 }}>
                        {(savedLesson?.subject || heroLesson?.subject || activeSubject || '').toUpperCase()}
                      </T>
                    </View>
                    <T F={F} w="bold" s={20} c={N.ink} numberOfLines={2} style={{ marginTop: 10, letterSpacing: -0.3 }}>
                      {savedLesson ? (savedLesson.title || 'Continue where you left off') : titleOf(heroLesson)}
                    </T>
                    <View style={ns.heroMeta}>
                      <Clock size={14} color={N.amber} strokeWidth={2} />
                      <T F={F} w="med" s={13} c={N.inkSoft}>
                        {savedLesson ? resumeCardTag : `${Math.round(heroLesson.percent)}% complete`}
                      </T>
                    </View>
                  </View>
                  <View style={ns.resumeWrap}>
                    <LinearGradient
                      colors={[N.violet, N.violetLo]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={ns.resume}
                    >
                      {restoring
                        ? <ActivityIndicator color={N.ink} size="small" />
                        : <><Play size={16} color={N.ink} strokeWidth={2.5} fill={N.ink} /><T F={F} w="bold" s={15} c={N.ink}>Resume</T></>}
                    </LinearGradient>
                  </View>
                </Pressable>
              </Rise>
            )}

            {/* Welcome back — the continuity snapshot, dismissible */}
            {resume && !resumeDismissed && (
              <Rise delay={140}>
                <View style={ns.welcome}>
                  <Pressable
                    onPress={() => setResumeDismissed(true)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss welcome back"
                    style={ns.welcomeClose}
                  >
                    <X size={15} color={N.inkSoft} strokeWidth={2.4} />
                  </Pressable>
                  <T F={F} w="bold" s={10.5} c={N.dot} style={{ letterSpacing: 1.4 }}>WELCOME BACK</T>
                  <T F={F} w="bold" s={16} c={N.ink} style={{ marginTop: 6, lineHeight: 22 }}>{resume.greeting}</T>
                  {!!resume.suggestion && (
                    <T F={F} s={13.5} c={N.inkSoft} style={{ marginTop: 4, lineHeight: 19 }}>{resume.suggestion}</T>
                  )}
                  <View style={ns.welcomeBtns}>
                    <Pressable
                      onPress={() => {
                        if (resume.last?.subject && SUBJECTS.includes(resume.last.subject)) setActiveSubject(resume.last.subject);
                        setInsights({ tab: 'revise' });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Continue revising"
                      style={ns.welcomePrimary}
                    >
                      <T F={F} w="bold" s={13.5} c={N.ink}>Continue revising</T>
                      <ChevronRight size={16} color={N.ink} strokeWidth={2.6} />
                    </Pressable>
                    {!!resume.last?.chapter && (
                      <Pressable
                        onPress={() => {
                          setTopic(resume.last.chapter);
                          if (resume.last?.subject && SUBJECTS.includes(resume.last.subject)) setActiveSubject(resume.last.subject);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Re-learn ${resume.last.chapter}`}
                        style={ns.welcomeGhost}
                      >
                        <T F={F} w="med" s={13} c={N.inkSoft} numberOfLines={1}>Re-learn {resume.last.chapter}</T>
                      </Pressable>
                    )}
                  </View>
                </View>
              </Rise>
            )}

            <View style={ns.divider} />

            {/* ── My Lessons ── */}
            <View style={ns.sectionRow}>
              <View style={ns.sectionTitle}>
                <View style={ns.sectionDot} />
                <T F={F} w="bold" s={20} c={N.ink} style={{ letterSpacing: -0.3 }}>My Lessons</T>
              </View>
              <View style={ns.toggle}>
                <Pressable
                  onPress={() => setView('grid')}
                  accessibilityRole="button" accessibilityLabel="Grid view"
                  accessibilityState={{ selected: view === 'grid' }}
                  style={[ns.toggleBtn, view === 'grid' && ns.toggleBtnOn]}
                >
                  <LayoutGrid size={18} color={view === 'grid' ? N.violet : N.inkSoft} strokeWidth={2} />
                </Pressable>
                <Pressable
                  onPress={() => setView('list')}
                  accessibilityRole="button" accessibilityLabel="List view"
                  accessibilityState={{ selected: view === 'list' }}
                  style={[ns.toggleBtn, view === 'list' && ns.toggleBtnOn]}
                >
                  <List size={18} color={view === 'list' ? N.violet : N.inkSoft} strokeWidth={2} />
                </Pressable>
              </View>
            </View>

            {rows.length > 0 && (
              <>
                {libSubjects.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={ns.chipsRow}
                    style={{ marginHorizontal: -PAD }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {libSubjects.map((sub) => {
                      const on = libSubject === sub;
                      return (
                        <Pressable
                          key={sub}
                          onPress={() => setLibSubject(sub)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                          style={[ns.filterChip, on && ns.filterChipOn]}
                        >
                          <T F={F} w="med" s={15} c={on ? N.ink : N.inkSoft}>{sub}</T>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                <Pressable
                  onPress={() => setRangeOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Date range: ${rangeLabel}`}
                  style={({ pressed }) => [ns.rangeChip, pressed && { opacity: 0.8 }]}
                >
                  <Calendar size={17} color={N.violet} strokeWidth={2} />
                  <T F={F} w="med" s={15} c={N.ink}>{rangeLabel}</T>
                  <ChevronDown size={18} color={N.inkSoft} strokeWidth={2} />
                </Pressable>
              </>
            )}

            {lessons === null ? (
              <View>{[0, 1].map((i) => <View key={i} style={ns.skeleton} />)}</View>
            ) : library.length > 0 ? (
              view === 'list' ? (
                library.map((l, i) => {
                  const m = subjectMeta(l.subject);
                  return (
                    <Rise key={l.id} delay={40 + i * 26}>
                      <Pressable
                        onPress={() => openLesson({ id: l.id, title: titleOf(l), startAt: l.lastSlideIndex })}
                        disabled={restoring}
                        accessibilityRole="button"
                        accessibilityLabel={`Open lesson: ${titleOf(l)}`}
                        style={({ pressed }) => [ns.row, pressed && { opacity: 0.85 }]}
                      >
                        <Thumb style={ns.rowThumb} Icon={m.Icon} hue="rgba(255,255,255,0.92)" />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={ns.rowTop}>
                            <T F={F} w="bold" s={12.5} c={m.hue} style={{ letterSpacing: 0.5 }} numberOfLines={1}>
                              {(l.subject || 'Lesson').toUpperCase()}
                            </T>
                            {!!l.gradeLevel && (
                              <>
                                <View style={ns.metaDot} />
                                <T F={F} s={12.5} c={N.inkSoft} numberOfLines={1}>Class {l.gradeLevel}</T>
                              </>
                            )}
                          </View>
                          <T F={F} w="bold" s={16} c={N.ink} numberOfLines={2} style={{ marginTop: 3, lineHeight: 21 }}>
                            {titleOf(l)}
                          </T>
                          <View style={ns.rowTop}>
                            <T F={F} s={13} c={N.inkDim}>{fmtDay(l.createdAt)}</T>
                            {!!l.estimatedDuration && (
                              <>
                                <View style={ns.metaDot} />
                                <T F={F} s={13} c={N.inkDim}>{l.estimatedDuration}</T>
                              </>
                            )}
                          </View>
                        </View>
                        <ProgressRing percent={l.percent} F={F} />
                      </Pressable>
                    </Rise>
                  );
                })
              ) : (
                <View style={ns.grid}>
                  {library.map((l, i) => {
                    const m = subjectMeta(l.subject);
                    return (
                      <Rise key={l.id} delay={40 + i * 26} style={{ width: GRID_W }}>
                        <Pressable
                          onPress={() => openLesson({ id: l.id, title: titleOf(l), startAt: l.lastSlideIndex })}
                          disabled={restoring}
                          accessibilityRole="button"
                          accessibilityLabel={`Open lesson: ${titleOf(l)}`}
                          style={({ pressed }) => [ns.gridCard, pressed && { opacity: 0.85 }]}
                        >
                          <Thumb style={ns.gridThumb} radius={0} Icon={m.Icon} hue="rgba(255,255,255,0.92)" />
                          <View style={{ padding: 12 }}>
                            <T F={F} w="bold" s={11.5} c={m.hue} style={{ letterSpacing: 0.5 }} numberOfLines={1}>
                              {(l.subject || 'Lesson').toUpperCase()}
                            </T>
                            <T F={F} w="bold" s={14} c={N.ink} numberOfLines={2} style={{ marginTop: 4, lineHeight: 19 }}>
                              {titleOf(l)}
                            </T>
                            <View style={[ns.rowTop, { justifyContent: 'space-between', marginTop: 8 }]}>
                              <T F={F} s={12} c={N.inkDim}>{fmtShort(new Date(l.createdAt))}</T>
                              <ProgressRing percent={l.percent} size={30} F={F} />
                            </View>
                          </View>
                        </Pressable>
                      </Rise>
                    );
                  })}
                </View>
              )
            ) : (
              <View style={ns.emptyCard}>
                <View style={ns.emptyIcon}><Sparkles size={22} color={N.violet} strokeWidth={2} /></View>
                <View style={{ flex: 1 }}>
                  <T F={F} w="bold" s={14.5} c={N.ink}>
                    {filtersActive ? 'Nothing in this filter' : 'No lessons yet'}
                  </T>
                  <T F={F} s={13} c={N.inkSoft} style={{ marginTop: 3, lineHeight: 18 }}>
                    {filtersActive
                      ? 'Try another subject or widen the date range.'
                      : 'Type a topic above and Ms. Nova will build your first lesson.'}
                  </T>
                </View>
              </View>
            )}

            {/* For you — the three Study Insights entry points */}
            <View style={ns.sectionRow}>
              <View style={ns.sectionTitle}>
                <View style={[ns.sectionDot, { backgroundColor: N.amber }]} />
                <T F={F} w="bold" s={20} c={N.ink} style={{ letterSpacing: -0.3 }}>For you</T>
              </View>
            </View>
            {isNewStudent && <T F={F} s={13} c={N.inkSoft} style={{ marginBottom: 12, lineHeight: 18 }}>{emptyHint}</T>}
            <View style={ns.insightRow}>
              {[
                { tab: 'next',   Icon: Compass, title: 'What next?', sub: 'Smart study plan', tint: N.amber },
                { tab: 'revise', Icon: Repeat,  title: 'Revise',     sub: 'Weak topics',      tint: N.violet },
              ].map((a) => (
                <Pressable
                  key={a.tab}
                  onPress={() => setInsights({ tab: a.tab })}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.title}. ${a.sub}`}
                  style={({ pressed }) => [ns.insightCard, pressed && { opacity: 0.85 }]}
                >
                  <View style={ns.insightIcon}><a.Icon size={19} color={a.tint} strokeWidth={2.2} /></View>
                  <T F={F} w="bold" s={14.5} c={N.ink} style={{ marginTop: 10 }}>{a.title}</T>
                  <T F={F} s={12.5} c={N.inkSoft} style={{ marginTop: 2 }}>{a.sub}</T>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setInsights({ tab: 'progress' })}
              accessibilityRole="button"
              accessibilityLabel="Progress. Your stats"
              style={({ pressed }) => [ns.insightWide, pressed && { opacity: 0.85 }]}
            >
              <View style={ns.insightIcon}><ChartNoAxesColumn size={19} color={N.green} strokeWidth={2.2} /></View>
              <View style={{ flex: 1 }}>
                <T F={F} w="bold" s={14.5} c={N.ink}>Progress</T>
                <T F={F} s={12.5} c={N.inkSoft} style={{ marginTop: 2 }}>Streak, study time, mastery</T>
              </View>
              <ChevronRight size={20} color={N.inkSoft} strokeWidth={2.2} />
            </Pressable>

            <T F={F} s={12.5} c={N.inkDim} style={{ marginTop: 18, lineHeight: 18, textAlign: 'center' }}>
              A live, voice-narrated lesson with a teacher, whiteboard, and doubts you can ask anytime.
            </T>
            {!SPEECH_OK && (
              <View style={ns.voiceNote}>
                <VolumeX size={14} color={N.inkSoft} strokeWidth={2.2} />
                <T F={F} s={12} c={N.inkSoft} style={{ flex: 1 }}>Voice off — run “npx expo install expo-speech” to enable narration.</T>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Generation overlay — "Crafting Your Personal Lesson" ── */}
        {loading && (
          <Animated.View style={[ns.genOverlay, { opacity: genFade }]}>
            <NightBg id="aigen" />
            <View style={ns.genSpark}><Sparkles size={34} color={N.violet} strokeWidth={2} /></View>
            <T F={F} w="bold" s={19} c={N.ink} style={{ marginTop: 18, textAlign: 'center' }} accessibilityLiveRegion="polite">
              Ms. Nova is preparing your lesson…
            </T>
            <View style={ns.genList}>
              {prepStages.map((s, i) => (
                <View key={i} style={ns.genRow}>
                  {i < genStage
                    ? <View style={ns.genDot}><Check size={15} color={N.green} strokeWidth={3} /></View>
                    : i === genStage
                      ? <ActivityIndicator size="small" color={N.violet} style={ns.genSpin} />
                      : <View style={ns.genDot}><Circle size={13} color={N.inkDim} strokeWidth={2.2} /></View>}
                  <T F={F} w={i === genStage ? 'med' : 'reg'} s={14} c={i === genStage ? N.ink : i < genStage ? N.inkSoft : N.inkDim} style={{ flex: 1 }}>
                    {s}
                  </T>
                </View>
              ))}
            </View>
            <T F={F} s={13} c={N.inkSoft} style={{ marginTop: 18, textAlign: 'center', lineHeight: 19 }}>{prepHint}</T>
          </Animated.View>
        )}

        {/* Date range sheet */}
        <Modal visible={rangeOpen} transparent animationType="slide" onRequestClose={() => setRangeOpen(false)}>
          <Pressable style={ns.sheetBackdrop} onPress={() => setRangeOpen(false)} accessibilityLabel="Close" />
          <View style={[ns.sheet, { paddingBottom: insetsSafe.bottom + 16 }]}>
            <View style={ns.sheetGrab} />
            <T F={F} w="bold" s={18} c={N.ink} style={{ marginBottom: 12, paddingHorizontal: 4 }}>Date range</T>
            {RANGES.map((r) => {
              const on = range === r.key;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => { setRange(r.key); setRangeOpen(false); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[ns.sheetItem, on && ns.sheetItemOn]}
                >
                  <T F={F} w="med" s={15.5} c={on ? N.ink : N.inkSoft} style={{ flex: 1 }}>{r.label}</T>
                  {on && <Check size={18} color={N.violet} strokeWidth={2.5} />}
                </Pressable>
              );
            })}
          </View>
        </Modal>

        <YourLearning visible={learningOpen} onClose={() => setLearningOpen(false)} />
      </View>
    );
  }

  // ── Live classroom ──
  // Dark violet "room" (matches LiveTeachingPlayer's ROOM_GRAD/V.ground) — this must
  // match or a light seam shows at the screen edges.
  return (
    <View style={ns.safeRoom}>
      <StatusBar barStyle="light-content" backgroundColor="#14103F" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#14103F' }} />}
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
    </View>
  );
};

const ns = StyleSheet.create({
  root: { flex: 1, backgroundColor: N.bg },
  // The live classroom is a dark violet "room" (LiveTeachingPlayer's own V.ground).
  safeRoom: { flex: 1, backgroundColor: '#0C0936' },
  body: { flex: 1, paddingHorizontal: PAD },

  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge,
  },

  headRow:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { width: 54, height: 54, borderRadius: 27, overflow: 'visible' },
  avatarDot: {
    position: 'absolute', right: 1, bottom: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: N.green, borderWidth: 2, borderColor: N.bg,
  },

  segment: {
    flexDirection: 'row', gap: 6, padding: 4, marginTop: 18,
    backgroundColor: N.cardSoft, borderRadius: 14,
  },
  segItem:   { flex: 1, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segItemOn: { backgroundColor: N.violetSoft, borderWidth: 1, borderColor: N.violet },

  composer: {
    marginTop: 14, padding: 14, borderRadius: 20, gap: 12,
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge,
  },
  subjChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    height: 40, paddingHorizontal: 14, borderRadius: 13,
    backgroundColor: N.cardSoft,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 56, paddingHorizontal: 16, borderRadius: 15,
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge,
  },
  searchInput: { flex: 1, fontSize: 15.5, color: N.ink, padding: 0 },
  goWrap: {
    borderRadius: 15,
    shadowColor: N.violet, shadowOpacity: 0.45, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  go: { width: 56, height: 56, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  styleChip: {
    height: 36, paddingHorizontal: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: N.cardSoft,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  styleChipOn: { borderColor: N.violet, backgroundColor: N.violetSoft },

  errCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12,
    padding: 14, borderRadius: 16,
    backgroundColor: 'rgba(240,86,110,0.12)',
    borderWidth: 1, borderColor: 'rgba(240,86,110,0.4)',
  },

  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginTop: 18, borderRadius: 20, padding: 16,
    backgroundColor: N.cardSoft,
    borderWidth: 1.5, borderColor: N.violet,
    shadowColor: N.violet, shadowOpacity: 0.4, shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  heroTagRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: N.violet, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: N.violet },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  resumeWrap: {
    borderRadius: 16,
    shadowColor: N.violet, shadowOpacity: 0.5, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  resume: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 18, height: 52, borderRadius: 16,
  },

  welcome: {
    marginTop: 12, padding: 16, borderRadius: 20,
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge,
  },
  welcomeClose: { position: 'absolute', top: 12, right: 12, padding: 6, zIndex: 2 },
  welcomeBtns:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  welcomePrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 42, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: N.violetSoft, borderWidth: 1, borderColor: N.violet,
  },
  welcomeGhost: {
    height: 42, paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center',
    backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge,
    maxWidth: '60%',
  },

  divider: { height: 1, backgroundColor: N.cardEdge, marginVertical: 22 },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 14 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  sectionDot:   { width: 9, height: 9, borderRadius: 5, backgroundColor: N.violet },

  toggle: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: N.cardSoft,
    borderWidth: 1.5, borderColor: N.cardEdge,
  },
  toggleBtnOn: { borderColor: N.violet, backgroundColor: N.violetSoft },

  chipsRow: { gap: 10, paddingHorizontal: PAD, paddingBottom: 4 },
  filterChip: {
    height: 46, paddingHorizontal: 22, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: N.cardSoft,
    borderWidth: 1.5, borderColor: N.cardEdge,
  },
  filterChipOn: { backgroundColor: N.violet, borderColor: N.violet },

  rangeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start',
    height: 48, paddingHorizontal: 16, borderRadius: 14, marginTop: 14, marginBottom: 16,
    backgroundColor: N.cardSoft,
    borderWidth: 1.5, borderColor: N.cardEdge,
  },

  skeleton: { height: 106, borderRadius: 18, backgroundColor: N.cardSoft, marginBottom: 12 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 12, borderRadius: 18, marginBottom: 12,
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge,
  },
  rowThumb: { width: 82, height: 82 },
  rowTop:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  metaDot:  { width: 3, height: 3, borderRadius: 2, backgroundColor: N.inkDim },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: {
    borderRadius: 18, overflow: 'hidden',
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge,
  },
  gridThumb: { width: '100%', aspectRatio: 16 / 10 },

  emptyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 18,
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge,
  },
  emptyIcon: {
    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center', backgroundColor: N.violetSoft,
  },

  insightRow: { flexDirection: 'row', gap: 12 },
  insightCard: {
    flex: 1, padding: 14, borderRadius: 18,
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge,
  },
  insightWide: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 18, marginTop: 12,
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge,
  },
  insightIcon: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', backgroundColor: N.violetSoft,
  },

  voiceNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    padding: 12, borderRadius: 14,
    backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge,
  },

  genOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
    backgroundColor: N.bg,
  },
  genSpark: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: N.violetSoft, borderWidth: 1, borderColor: N.cardEdge,
  },
  genList: { alignSelf: 'stretch', marginTop: 24, gap: 14 },
  genRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  genDot:  { width: 22, alignItems: 'center', justifyContent: 'center' },
  genSpin: { width: 22 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15,18,34,0.45)' },
  sheet: {
    backgroundColor: N.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: N.cardEdge,
    paddingHorizontal: 16, paddingTop: 10,
  },
  sheetGrab: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: N.track,
    alignSelf: 'center', marginBottom: 14,
  },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 14, marginBottom: 8,
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: 'transparent',
  },
  sheetItemOn: { backgroundColor: N.violetSoft, borderColor: N.violet },
});

export default AITeacherScreen;
