// src/screens/admin/aiteacher/AiLessonDetailScreen.js
// A generated lesson: its identity + key terms, its ordered slides (each opens the REAL
// student player at that slide), and ONLY the analytics that real tables back (views,
// completion, avg study time, questions asked, furthest slide reached). No editing/publish/
// version controls are shown — slide/lesson mutation has no backend, and we never fake it.
import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Eye, BookOpen, GraduationCap, Cpu, Clock3, CircleQuestionMark, TrendingDown, CircleCheck } from 'lucide-react-native';
import { getAdminAiLesson, getAdminAiLessonAnalytics } from '../../../api/adminApi';
import { T } from '../../parent/ParentApp/constants';
import { S, shadow, StudentScreenHeader, StudentSectionHeader, StudentErrorState, StudentPrimaryButton, StudentSkeleton } from '../../../theme/studentUI';
import { FadeInOnce, PressableScale, Stagger } from '../../parent/ParentApp/anim';

const STATUS_TONE = { READY: S.emerald, GENERATING: S.gold, FAILED: S.red };
const fmtSecs = (s) => { if (!s) return '—'; const m = Math.floor(s / 60), ss = s % 60; return m ? `${m}m ${ss}s` : `${ss}s`; };
const fmtDate = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };

function Meta({ icon: Icon, k, v }) {
  return (
    <View style={{ width: '48%', flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 7 }}>
      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><Icon size={15} color={S.indigo} strokeWidth={2.3} /></View>
      <View style={{ flex: 1, minWidth: 0 }}><T w="semi" s={10.5} c={S.faint}>{k}</T><T w="xbold" s={12.5} c={S.ink} numberOfLines={1}>{v}</T></View>
    </View>
  );
}

function Stat({ icon: Icon, tint, soft, value, label }) {
  return (
    <View style={{ width: '48%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: S.hair, ...shadow }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: soft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}><Icon size={17} color={tint} strokeWidth={2.3} /></View>
      <T w="black" s={22} c={S.ink} style={{ letterSpacing: -0.6 }}>{value}</T>
      <T w="semi" s={11} c={S.muted} numberOfLines={1}>{label}</T>
    </View>
  );
}

export default function AiLessonDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params || {};
  const [state, setState] = useState({ loading: true, error: null, lesson: null });
  const [analytics, setAnalytics] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const d = await getAdminAiLesson(id);
      setState({ loading: false, error: null, lesson: d?.lesson || null });
    } catch (e) { setState({ loading: false, error: e?.response?.data?.error || e?.message || 'Could not load lesson', lesson: null }); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { let alive = true; getAdminAiLessonAnalytics(id).then((a) => { if (alive) setAnalytics(a); }).catch(() => {}); return () => { alive = false; }; }, [id]);

  const lesson = state.lesson;
  const slides = lesson?.slides || [];
  const watch = (startIndex) => navigation.navigate('AiTeacherPreview', { id, startIndex, lesson });

  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <StudentScreenHeader title={lesson?.lessonTitle || 'Lesson'} subtitle={lesson ? [lesson.subject, lesson.gradeLevel].filter(Boolean).join(' · ') : 'AI Teacher'} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40, paddingTop: 6 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={S.indigo} />}>
        {state.loading && !lesson ? (
          <View style={{ paddingTop: 8 }}>{[0, 1, 2].map((i) => <StudentSkeleton key={i} w="100%" h={92} r={18} mb={12} />)}</View>
        ) : state.error ? (
          <StudentErrorState title="Couldn’t load lesson" message={state.error} onRetry={load} />
        ) : lesson ? (
          <Stagger base={20} step={50}>
            {/* Status + watch */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <View style={{ backgroundColor: (STATUS_TONE[lesson.status] || S.faint) + '1f', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <T w="xbold" s={11} c={STATUS_TONE[lesson.status] || S.faint}>{lesson.status}</T>
              </View>
              <T w="bold" s={12} c={S.muted}>{slides.length} slides</T>
            </View>

            <View style={{ marginTop: 12 }}>
              <StudentPrimaryButton label="Watch as student" Icon={Play} onPress={() => watch(0)} disabled={!slides.length} />
            </View>

            {!!lesson.summary && (
              <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, padding: 15, marginTop: 14, ...shadow }}>
                <T w="semi" s={13} c={S.sub} style={{ lineHeight: 20 }}>{lesson.summary}</T>
              </View>
            )}

            {/* Identity */}
            <StudentSectionHeader title="Lesson" accent={S.indigo} style={{ marginTop: 18 }} />
            <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, paddingHorizontal: 14, paddingVertical: 6, flexDirection: 'row', flexWrap: 'wrap', ...shadow }}>
              <Meta icon={BookOpen} k="Subject" v={lesson.subject || '—'} />
              <Meta icon={GraduationCap} k="Grade" v={lesson.gradeLevel || '—'} />
              <Meta icon={Clock3} k="Est. duration" v={lesson.estimatedDuration || '—'} />
              <Meta icon={Cpu} k="Model" v={lesson.generationModel || '—'} />
              <Meta icon={CircleCheck} k="Created" v={fmtDate(lesson.createdAt)} />
              <Meta icon={Clock3} k="Gen time" v={lesson.generationTimeMs ? `${(lesson.generationTimeMs / 1000).toFixed(1)}s` : '—'} />
            </View>

            {/* Real analytics only */}
            <StudentSectionHeader title="Analytics" accent={S.emerald} sub="real data" style={{ marginTop: 20 }} />
            {analytics ? (
              analytics.views > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  <Stat icon={Eye} tint={S.indigo} soft={S.indigoSoft} value={analytics.views} label="Views" />
                  <Stat icon={CircleCheck} tint={S.emerald} soft={S.emeraldSoft} value={`${analytics.completionRate}%`} label={`Completed (${analytics.completed})`} />
                  <Stat icon={Clock3} tint={S.gold} soft={S.goldSoft} value={fmtSecs(analytics.avgSeconds)} label="Avg study time" />
                  <Stat icon={CircleQuestionMark} tint={S.purple} soft={S.purpleSoft} value={analytics.questionsAsked} label="Questions asked" />
                  <Stat icon={TrendingDown} tint={S.orange} soft={S.orangeSoft} value={`${Math.round(analytics.avgLastSlide) + 1}/${analytics.slidesTotal || slides.length}`} label="Avg furthest slide" />
                </View>
              ) : (
                <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, padding: 18, alignItems: 'center', ...shadow }}>
                  <T w="semi" s={13} c={S.muted} style={{ textAlign: 'center' }}>No student activity on this lesson yet. Views, completion, study time and questions appear here once students engage.</T>
                </View>
              )
            ) : (
              <StudentSkeleton w="100%" h={110} r={18} />
            )}

            {/* Slides — each opens the real player at that slide */}
            <StudentSectionHeader title={`Slides · ${slides.length}`} accent={S.blue} style={{ marginTop: 22 }} />
            <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, padding: 6, ...shadow }}>
              {slides.map((sl, i) => (
                <FadeInOnce key={sl.id} id={`sl-${sl.id}`} delay={20 + i * 12} y={8}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 8, borderBottomWidth: i < slides.length - 1 ? 1 : 0, borderBottomColor: S.hair }}>
                    <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: S.blueSoft, alignItems: 'center', justifyContent: 'center' }}><T w="black" s={11} c={S.blue}>{i + 1}</T></View>
                    <T w="semi" s={13} c={S.ink} numberOfLines={2} style={{ flex: 1 }}>{sl.slideTitle}</T>
                    <PressableScale onPress={() => watch(i)} hitSlop={6} accessibilityLabel={`Preview slide ${i + 1}`}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: S.indigoSoft, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 11 }}>
                      <Eye size={13} color={S.indigo} strokeWidth={2.4} /><T w="xbold" s={11.5} c={S.indigo}>Preview</T>
                    </PressableScale>
                  </View>
                </FadeInOnce>
              ))}
              {!slides.length && <T w="semi" s={13} c={S.muted} style={{ padding: 14, textAlign: 'center' }}>This lesson has no slides.</T>}
            </View>
            <T w="med" s={11} c={S.faint} style={{ marginTop: 8, lineHeight: 16 }}>Slides are generated by the AI Teacher and shown read-only — editing/reordering will arrive with the content-authoring backend.</T>
          </Stagger>
        ) : null}
      </ScrollView>
    </View>
  );
}
