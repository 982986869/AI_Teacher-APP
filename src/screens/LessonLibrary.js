// src/screens/LessonLibrary.js
// Student browse of the admin-authored, PUBLISHED lesson catalog (Subjects → Chapters →
// Lessons → play). Additive and self-contained: it does NOT touch the generate-from-topic
// AITeacherScreen. Playing a lesson reuses the FROZEN LiveTeachingPlayer verbatim (same props
// as AITeacherScreen), with doubts routed through the real agent. Read-only content — students
// never edit here.
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable, RefreshControl, Platform } from 'react-native';
import { ChevronLeft, BookOpen, Layers, GraduationCap, Play, ChevronRight, Clock, CircleCheck, RotateCcw } from 'lucide-react-native';
import { getCatalogSubjects, getCatalogChapters, getCatalogLessons, getCatalogLesson, getCatalogResume, askAgent, askAgentStream, updateLessonProgress } from '../api/aiApi';
import { useAuth } from '../context/AuthContext';
import { S, shadow } from '../theme/studentUI';
import { T } from './parent/ParentApp/constants';
import LiveTeachingPlayer from '../components/teacher/LiveTeachingPlayer';
import { SPEECH_OK } from '../utils/teacherVoice';
import { D } from '../components/teacher/premiumTheme';
import { apiError } from './admin/ui/format';

const DIFF_TONE = { easy: '#10B981', medium: '#0EA5E9', hard: '#F59E0B', challenge: '#EF4444' };

// ── The player, wired exactly like AITeacherScreen but on a catalog lesson ──────
// Progress persists to lesson_progress (per-student, even though the lesson is admin-owned) via
// the same 15s-flush + on-exit pattern the student screen uses — so Resume/Done work here too.
function LibraryPlayer({ lesson, startIndex = 0, onExit }) {
  const { user, scope } = useAuth();
  const historyRef = useRef([]);
  const pendingRef = useRef(null);
  const posRef = useRef({ slideIndex: startIndex, total: (lesson.slides || []).length });
  const grade = lesson.gradeLevel || (scope?.classNum ? String(scope.classNum) : (user?.grade || ''));
  const lessonObj = useMemo(
    () => ({ lessonTitle: lesson.lessonTitle, slides: lesson.slides || [], keyTerms: lesson.keyTerms || [], grade: grade || null }),
    [lesson, grade],
  );
  useEffect(() => {
    if (!lesson.id || !(lesson.slides || []).length) return undefined;
    const flush = (secs) => {
      const { slideIndex, total } = posRef.current;
      updateLessonProgress(lesson.id, { slideIndex, total, studyTimeSeconds: secs, concept: lesson.lessonTitle }).catch(() => {});
    };
    const id = setInterval(() => flush(15), 15000);
    return () => { clearInterval(id); flush(3); };
  }, [lesson.id, lesson.slides, lesson.lessonTitle]);
  const ask = async (q, i, stream) => {
    const args = { text: q, subject: lesson.subject, gradeLevel: grade || '8', lessonId: lesson.id, slideIndex: i, history: historyRef.current, pending: pendingRef.current };
    const res = stream ? await askAgentStream(args, stream) : await askAgent(args);
    pendingRef.current = res.pending || null;
    historyRef.current = [...historyRef.current, { role: 'USER', content: q }, { role: 'ASSISTANT', content: res.answer || '' }].slice(-12);
    return res;
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: D.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={D.bg} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: D.bg }} />}
      <LiveTeachingPlayer
        lesson={lessonObj}
        subject={lesson.subject}
        ttsOk={SPEECH_OK}
        startIndex={startIndex}
        priorModel={null}
        onProgress={({ slideIndex, total }) => { posRef.current = { slideIndex: Number(slideIndex) || 0, total: Number(total) || 0 }; }}
        onOutcome={() => {}}
        onAsk={(q, i) => ask(q, i, null)}
        onAskStream={(q, i, cbs) => ask(q, i, cbs || {})}
        onExit={onExit}
        onNewLesson={onExit}
      />
    </SafeAreaView>
  );
}

const ICON_FOR = { subjects: BookOpen, chapters: Layers, lessons: GraduationCap };

export default function LessonLibrary({ onClose }) {
  const { scope } = useAuth();
  const cls = scope?.classNum ?? null; // student's class → only their (and all-class) lessons
  // Breadcrumb stack: each entry drives one fetch. Top = current view.
  const [stack, setStack] = useState([{ level: 'subjects', title: 'Lesson library', sub: 'Lessons made by your teachers' }]);
  const cur = stack[stack.length - 1];
  const [state, setState] = useState({ loading: true, error: '', rows: [] });
  const [resumeRows, setResumeRows] = useState([]);
  const [opening, setOpening] = useState(false);
  const [playing, setPlaying] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      let d;
      if (cur.level === 'subjects') d = await getCatalogSubjects(cls);
      else if (cur.level === 'chapters') d = await getCatalogChapters(cur.subjectId, cls);
      else d = await getCatalogLessons(cur.chapterId, cls);
      setState({ loading: false, error: '', rows: d?.rows || [] });
    } catch (e) { setState({ loading: false, error: apiError(e), rows: [] }); }
    // "Jump back in" only on the landing (subjects) view — best-effort, never blocks browse.
    if (cur.level === 'subjects') getCatalogResume(cls).then((r) => setResumeRows(r?.rows || [])).catch(() => {});
  }, [cur, cls]);
  useEffect(() => { load(); }, [load]);

  // Fetch a full lesson and start it at the student's resume slide (or 0 if finished).
  const playLesson = async (id) => {
    setOpening(true);
    try {
      const d = await getCatalogLesson(id, cls);
      if (d?.lesson) {
        const total = (d.lesson.slides || []).length;
        const startIndex = d.lesson.completed ? 0 : Math.min(Math.max(0, d.lesson.lastSlideIndex || 0), Math.max(0, total - 1));
        setPlaying({ lesson: d.lesson, startIndex });
      }
    } catch (e) { setState((s) => ({ ...s, error: apiError(e) })); }
    finally { setOpening(false); }
  };

  const back = () => {
    if (playing) { setPlaying(null); return; }
    if (stack.length > 1) setStack((s) => s.slice(0, -1));
    else onClose();
  };
  const openRow = async (row) => {
    if (cur.level === 'subjects') setStack((s) => [...s, { level: 'chapters', subjectId: row.id, title: row.name, sub: `${row.lessonCount} ${row.lessonCount === 1 ? 'lesson' : 'lessons'}` }]);
    else if (cur.level === 'chapters') setStack((s) => [...s, { level: 'lessons', chapterId: row.id, title: row.name, sub: `${row.lessonCount} ${row.lessonCount === 1 ? 'lesson' : 'lessons'}` }]);
    else await playLesson(row.id);
  };

  if (playing) return <LibraryPlayer lesson={playing.lesson} startIndex={playing.startIndex} onExit={() => { setPlaying(null); load(); }} />;

  const isLessons = cur.level === 'lessons';
  const Icon = ICON_FOR[cur.level];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: S.canvas }}>
      <StatusBar barStyle="dark-content" backgroundColor={S.canvas} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingRight: 18, paddingTop: 8, paddingBottom: 12 }}>
        <Pressable onPress={back} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ padding: 4 }}>
          <ChevronLeft size={26} color={S.ink} strokeWidth={2.5} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="black" s={20} c={S.ink} numberOfLines={1}>{cur.title}</T>
          {!!cur.sub && <T w="semi" s={12.5} c={S.muted} numberOfLines={1}>{cur.sub}</T>}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={S.indigo} />}>
        {cur.level === 'subjects' && resumeRows.length > 0 && (
          <View style={{ marginBottom: 14 }}>
            <T w="black" s={13.5} c={S.ink} style={{ marginBottom: 9 }}>Jump back in</T>
            {resumeRows.map((r) => {
              const total = r.slideCount || 0;
              const at = Math.min(Math.max(0, r.lastSlideIndex || 0), Math.max(0, total - 1)) + 1;
              const pct = total ? Math.round((at / total) * 100) : 0;
              return (
                <Pressable key={r.id} onPress={() => playLesson(r.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: S.hair, padding: 13, marginBottom: 10, ...shadow }}>
                  <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><Play size={19} color={S.indigo} strokeWidth={2.6} /></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w="xbold" s={14} c={S.ink} numberOfLines={1}>{r.title}</T>
                    <T w="semi" s={11.5} c={S.muted} numberOfLines={1} style={{ marginTop: 1 }}>{[r.subject, r.chapterName].filter(Boolean).join('  ·  ')}</T>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 }}>
                      <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: S.hair, overflow: 'hidden' }}><View style={{ width: `${pct}%`, height: '100%', backgroundColor: S.indigo }} /></View>
                      <T w="bold" s={10.5} c={S.faint}>{total ? `Slide ${at}/${total}` : ''}</T>
                    </View>
                  </View>
                  <ChevronRight size={18} color={S.faint} strokeWidth={2.4} />
                </Pressable>
              );
            })}
            <T w="xbold" s={9.5} c={S.faint} style={{ letterSpacing: 0.6, marginTop: 4, marginBottom: 2 }}>ALL SUBJECTS</T>
          </View>
        )}
        {state.loading && !state.rows.length ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator color={S.indigo} /></View>
        ) : state.error ? (
          <View style={{ paddingVertical: 50, alignItems: 'center', gap: 12 }}>
            <T w="semi" s={14} c={S.muted} style={{ textAlign: 'center', paddingHorizontal: 24 }}>{state.error}</T>
            <Pressable onPress={load} style={{ borderWidth: 1.5, borderColor: S.border, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}><T w="xbold" s={13} c={S.ink}>Retry</T></Pressable>
          </View>
        ) : !state.rows.length ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 10 }}>
            <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><Icon size={26} color={S.indigo} strokeWidth={2.2} /></View>
            <T w="semi" s={13.5} c={S.muted} style={{ textAlign: 'center', maxWidth: 260, lineHeight: 19 }}>
              {isLessons ? 'No lessons here yet. Check back soon.' : 'Nothing published yet. Your teachers add lessons here.'}
            </T>
          </View>
        ) : state.rows.map((row) => (
          <Pressable key={row.id} onPress={() => openRow(row)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, padding: 15, marginBottom: 12, ...shadow }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: isLessons ? (row.completed ? '#DCFCE7' : S.indigoSoft) : S.emeraldSoft, alignItems: 'center', justifyContent: 'center' }}>
              {isLessons ? (row.completed ? <CircleCheck size={22} color="#15803D" strokeWidth={2.5} /> : <Play size={20} color={S.indigo} strokeWidth={2.5} />) : row.emoji ? <Text style={{ fontSize: 24 }}>{row.emoji}</Text> : <Icon size={22} color={S.emerald} strokeWidth={2.3} />}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w="xbold" s={15} c={S.ink} numberOfLines={2}>{isLessons ? row.title : row.name}</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                {isLessons ? (
                  <>
                    {row.completed ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#DCFCE7', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}><CircleCheck size={11} color="#15803D" strokeWidth={2.6} /><Text style={{ fontSize: 10.5, fontWeight: '800', color: '#15803D' }}>Done</Text></View>
                    ) : row.started ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: S.indigoSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}><RotateCcw size={10} color={S.indigo} strokeWidth={2.6} /><Text style={{ fontSize: 10.5, fontWeight: '800', color: S.indigo }}>Resume</Text></View>
                    ) : null}
                    {!!row.estimatedDuration && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Clock size={12} color={S.faint} strokeWidth={2.3} /><T w="semi" s={11.5} c={S.muted}>{row.estimatedDuration}</T></View>}
                    <T w="semi" s={11.5} c={S.muted}>{row.slideCount} {row.slideCount === 1 ? 'slide' : 'slides'}</T>
                    {!!row.difficulty && <View style={{ backgroundColor: (DIFF_TONE[row.difficulty] || S.muted) + '22', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}><Text style={{ fontSize: 10.5, fontWeight: '800', color: DIFF_TONE[row.difficulty] || S.muted, textTransform: 'capitalize' }}>{row.difficulty}</Text></View>}
                  </>
                ) : (
                  <T w="semi" s={12} c={S.muted}>{row.lessonCount} {row.lessonCount === 1 ? 'lesson' : 'lessons'}</T>
                )}
              </View>
            </View>
            <ChevronRight size={20} color={S.faint} strokeWidth={2.4} />
          </Pressable>
        ))}
      </ScrollView>

      {opening && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={S.indigo} size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}
