// src/screens/AITeacherScreen.js
// The AI Teacher feature. This file is now STATE AND FLOW ONLY — it owns four states and
// hands each one to a screen that draws it:
//
//   landing  → src/screens/aiteacher/AITeacherHome.js   (light palette)
//   ask      → KnowledgeAskScreen                        (grounded RAG over uploads)
//   insights → StudyInsightsScreen                       (plan / revise / progress)
//   lesson   → LiveTeachingPlayer                        (the live classroom)
//
// The landing was the night-palette lesson library; it moved to the light design and
// took its markup with it, which is why nothing but the classroom's backdrop is styled
// here any more. Every flow it carried survived the move — generation, resume/restore,
// the library with its filters, "Your learning", the three Study Insights entries — they
// are wired through props in the landing block below.
//
// The library's progress rings are REAL: GET /api/ai/lessons/progress returns a stored
// `percent` per lesson (written by updateLessonProgress on a 15s timer while a lesson is
// open), so a ring is the student's actual position, not a guess.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, StatusBar, Platform, Animated, Easing } from 'react-native';
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
// The landing itself — light palette, src/theme/aiTeacherTheme.js. Everything below the
// landing (this screen's other three states) is still on the night palette.
import AITeacherHome from './aiteacher/AITeacherHome';
import GeneratingOverlay from './aiteacher/sections/GeneratingOverlay';
import RangeSheet from './aiteacher/sections/RangeSheet';
import LiveTeachingPlayer from '../components/teacher/LiveTeachingPlayer';
import { TEACHER_HEADSHOT } from '../components/teacher/teacherIdentity';
import { greeting, preparingBeats, preparingHint, resumeTag, emptyState } from '../components/teacher/teacherMoments';
import { stopTeacher, primeTeacherVoice, SPEECH_OK } from '../utils/teacherVoice';
import YourLearning from '../components/teacher/YourLearning';

// AI Teacher answers EVERY academic question, so it offers all subjects. Only the
// explanation depth adapts to the student's class (enforced server-side from scope);
// content restriction by stream lives on Practice/Resources, not here.
const SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'History'];

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

const AITeacherScreen = ({ initialSubject = 'Physics', initialTopic = '', onBack }) => {
  const { user, scope } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const subjects = SUBJECTS;

  // Space Grotesk used to be loaded here for the night-palette landing. It is gone with
  // that landing: KnowledgeAskScreen loads the family itself, and StudyInsightsScreen,
  // YourLearning and LiveTeachingPlayer are each on a different one.

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

  // ── Landing: the light AI Teacher home ──
  // All of it is presentation — see src/screens/aiteacher/AITeacherHome.js. This block
  // only maps this screen's state onto that layout's props, so the landing can be
  // re-designed without any of the logic above moving.
  if (slides.length === 0) {
    // The library rows, flattened to what the section renders. `startAt` rides along so
    // opening a lesson still resumes at the stored slide.
    const libraryRows = library.map((l) => ({
      id: l.id,
      subject: l.subject,
      title: titleOf(l),
      meta: [fmtDay(l.createdAt), l.estimatedDuration].filter(Boolean).join('  •  '),
      percent: l.percent,
      startAt: l.lastSlideIndex,
    }));

    // "Jump back in" — the saved pointer if there is one, else the newest unfinished
    // lesson, else nothing at all (the section removes itself).
    const jumpBackIn = savedLesson
      ? {
          subject: savedLesson.subject || activeSubject,
          title: savedLesson.title || 'Continue where you left off',
          detail: resumeCardTag,
          percent: 0,
        }
      : heroLesson
        ? {
            subject: heroLesson.subject || activeSubject,
            title: titleOf(heroLesson),
            detail: `${Math.round(heroLesson.percent)}% complete`,
            percent: heroLesson.percent,
          }
        : null;

    const continueLesson = () => (savedLesson
      ? resumeSavedLesson()
      : heroLesson && openLesson({ id: heroLesson.id, title: titleOf(heroLesson), startAt: heroLesson.lastSlideIndex }));

    return (
      <View style={{ flex: 1 }}>
        <AITeacherHome
          // identity — the design's "Hey <name>" line carries the name, so the warm
          // half of greeting() lands as the subtitle beneath it.
          userName={firstName}
          photoUrl={user?.photo || user?.avatar || null}
          greetingLine={greet.prompt}

          // topic composer
          topic={topic}
          onChangeTopic={setTopic}
          onGenerate={handleGenerate}
          generating={loading}
          error={error}

          // subject + register for the next lesson
          subjects={subjects}
          subject={activeSubject}
          onSelectSubject={setActiveSubject}
          teachingStyles={TEACHING_MODES.map((m) => ({ key: m.key, label: m.short }))}
          teachingStyle={teachMode}
          onSelectTeachingStyle={setTeachMode}

          // the teacher. One coach exists today; the section renders a list so a second
          // one needs no layout change.
          instructors={[{ id: 'nova', name: 'Ms. Nova', role: 'Your AI Teacher', photo: TEACHER_HEADSHOT }]}
          onCustomizeCoach={() => setLearningOpen(true)}

          // continuity
          welcomeBack={resume && !resumeDismissed ? resume : null}
          onRevise={() => {
            if (resume?.last?.subject && SUBJECTS.includes(resume.last.subject)) setActiveSubject(resume.last.subject);
            setInsights({ tab: 'revise' });
          }}
          onRelearn={(chapter) => {
            setTopic(chapter);
            if (resume?.last?.subject && SUBJECTS.includes(resume.last.subject)) setActiveSubject(resume.last.subject);
          }}
          onDismissWelcome={() => setResumeDismissed(true)}
          currentLesson={jumpBackIn}
          resuming={restoring}
          onContinueLesson={continueLesson}

          // the library
          lessons={lessons === null ? null : libraryRows}
          librarySubjects={libSubjects}
          librarySubject={libSubject}
          libraryView={view}
          rangeLabel={rangeLabel}
          filtersActive={filtersActive}
          onSelectLibrarySubject={setLibSubject}
          onToggleLibraryView={setView}
          onOpenRange={() => setRangeOpen(true)}
          onOpenLesson={(l) => openLesson({ id: l.id, title: l.title, startAt: l.startAt })}

          // the rest
          onSelectPersonalized={(tab) => setInsights({ tab })}
          emptyHint={isNewStudent ? emptyHint : ''}
          voiceOff={!SPEECH_OK}

          onBack={handleBack}
          onSettings={() => setLearningOpen(true)}
          onAskMaterial={() => setMode('ask')}
        />

        <GeneratingOverlay
          visible={loading}
          opacity={genFade}
          stages={prepStages}
          stage={genStage}
          hint={prepHint}
        />

        <RangeSheet
          visible={rangeOpen}
          ranges={RANGES}
          value={range}
          onSelect={(k) => { setRange(k); setRangeOpen(false); }}
          onClose={() => setRangeOpen(false)}
        />

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

// Only the live classroom is still drawn here; the landing moved to
// src/screens/aiteacher/ and brought its own light styles with it.
const ns = StyleSheet.create({
  // The live classroom is a dark violet "room" (LiveTeachingPlayer's own V.ground) —
  // this must match it or a light seam shows at the screen edges.
  safeRoom: { flex: 1, backgroundColor: '#0C0936' },
});

export default AITeacherScreen;
