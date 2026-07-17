// src/screens/admin/aiteacher/AiLessonEditorScreen.js
// AI Teacher catalog — the lesson editor (level 4). Edits the lesson's info (title / summary /
// duration / difficulty / key terms — auto-saved on blur so nothing is lost when hopping to the
// slide editor), flips its publish status, and manages its slides (add / edit / duplicate /
// delete / reorder). "Preview" opens the REAL frozen student player (LiveTeachingPlayer) on the
// exact stored slides. All via /api/admin/ai-teacher/catalog/…
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Play, Send, Undo2, GripVertical, CopyPlus, Trash2, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react-native';
import { FONT } from '../../../constants/fonts';
import { getAiLesson, updateAiLesson, setAiLessonStatus, addAiSlide, duplicateAiSlide, deleteAiSlide, reorderAiSlides, getAdminAiLessonAnalytics } from '../../../api/adminApi';
import { TK, ScreenHeader } from '../../../components/testCardKit';
import { ActionSheet } from '../ui/ActionSheet';
import { apiError } from '../ui/format';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'challenge'];
const CLASSES = [6, 7, 8, 9, 10, 11, 12];
// gradeLevel stores '' for "all classes" or the class number as a string. Read either shape.
const gradeNum = (g) => { const n = parseInt(String(g || '').replace(/\D/g, ''), 10); return Number.isFinite(n) ? n : null; };
const VISUAL_TONE = { DIAGRAM: '#6366F1', CHART: '#0EA5E9', EXAMPLE: '#10B981', ANALOGY: '#F59E0B', FORMULA: '#EC4899', NONE: '#9CA3AF' };
const label = (t) => <Text style={{ color: TK.textMuted, fontFamily: FONT.bold, fontSize: 11, letterSpacing: 0.3, marginBottom: 6 }}>{t}</Text>;
const inputStyle = { backgroundColor: TK.card, borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontFamily: FONT.semibold, fontSize: 14.5, color: TK.text };
const fmtTime = (secs) => { const s = Math.max(0, Math.round(Number(secs) || 0)); if (s < 60) return `${s}s`; const m = Math.floor(s / 60); return s % 60 ? `${m}m ${s % 60}s` : `${m}m`; };
function StatTile({ label: l, value }) {
  return (
    <View style={{ flexGrow: 1, minWidth: 100, backgroundColor: TK.card, borderRadius: 14, borderWidth: 1, borderColor: TK.border, paddingVertical: 12, paddingHorizontal: 13 }}>
      <Text style={{ color: TK.text, fontFamily: FONT.black, fontSize: 18 }}>{value}</Text>
      <Text style={{ color: TK.textMuted, fontFamily: FONT.semibold, fontSize: 11.5, marginTop: 2 }}>{l}</Text>
    </View>
  );
}

export default function AiLessonEditorScreen({ route, navigation }) {
  const { lessonId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState({ title: '', summary: '', estimatedDuration: '', difficulty: null, keyTerms: [], gradeLevel: '', subject: '', status: 'draft' });
  const [keyTermsText, setKeyTermsText] = useState('');
  const [slides, setSlides] = useState([]);
  const [stats, setStats] = useState(null); // student engagement (real lesson_progress data)
  const [menu, setMenu] = useState(null);
  const dirty = useRef(false); // don't let a focus-reload clobber in-progress info edits

  const load = useCallback(async () => {
    try {
      const d = await getAiLesson(lessonId);
      const l = d?.lesson || {};
      setSlides(d?.slides || []);
      if (!dirty.current) {
        setInfo({ title: l.title || '', summary: l.summary || '', estimatedDuration: l.estimatedDuration || '', difficulty: l.difficulty || null, keyTerms: l.keyTerms || [], gradeLevel: l.gradeLevel || '', subject: l.subject || '', status: l.status || 'draft' });
        setKeyTermsText((l.keyTerms || []).join(', '));
      }
      setError('');
    } catch (e) { setError(apiError(e)); }
    finally { setLoading(false); }
    // Engagement is best-effort telemetry — never block the editor on it.
    getAdminAiLessonAnalytics(lessonId).then(setStats).catch(() => {});
  }, [lessonId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Persist one info field (auto-save on blur). Optimistic; reverts nothing on error but alerts.
  const saveField = async (patch) => {
    setInfo((s) => ({ ...s, ...patch }));
    try { await updateAiLesson(lessonId, patch); dirty.current = false; }
    catch (e) { Alert.alert('Could not save', apiError(e)); }
  };
  const commitKeyTerms = () => {
    const arr = keyTermsText.split(',').map((s) => s.trim()).filter(Boolean);
    saveField({ keyTerms: arr });
  };

  const act = (fn, errTitle) => fn().then(load).catch((e) => Alert.alert(errTitle, apiError(e)));
  const addSlide = async () => {
    try { const d = await addAiSlide(lessonId, {}); await load(); if (d?.slide?.id) navigation.navigate('AiSlideEditor', { slideId: d.slide.id, lessonId }); }
    catch (e) { Alert.alert('Could not add slide', apiError(e)); }
  };
  const moveSlide = (index, dir) => {
    const j = index + dir; if (j < 0 || j >= slides.length) return;
    const next = slides.slice(); const [it] = next.splice(index, 1); next.splice(j, 0, it);
    setSlides(next);
    reorderAiSlides(lessonId, next.map((s) => s.id)).catch((e) => { Alert.alert('Could not reorder', apiError(e)); load(); });
  };
  const confirmDeleteSlide = (s) => Alert.alert('Delete slide?', `“${s.slideTitle}” will be removed.`,
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => act(() => deleteAiSlide(s.id), 'Could not delete') }]);
  const slideMenu = (s) => s ? [
    { key: 'edit', label: 'Edit slide', icon: GripVertical, tone: 'indigo', onPress: () => navigation.navigate('AiSlideEditor', { slideId: s.id, lessonId }) },
    { key: 'dup', label: 'Duplicate', icon: CopyPlus, tone: 'blue', onPress: () => act(() => duplicateAiSlide(s.id), 'Could not duplicate') },
    { key: 'del', label: 'Delete', icon: Trash2, danger: true, onPress: () => confirmDeleteSlide(s) },
  ] : [];

  const published = info.status === 'published';
  const togglePublish = () => {
    if (!published && !slides.length) { Alert.alert('Add a slide first', 'A lesson needs at least one slide before it can be published.'); return; }
    act(() => setAiLessonStatus(lessonId, published ? 'draft' : 'published'), 'Could not update');
  };
  const preview = () => {
    if (!slides.length) { Alert.alert('Nothing to preview', 'Add a slide first — this lesson has no slides yet.'); return; }
    navigation.navigate('AiTeacherPreview', {
      lesson: { lessonTitle: info.title, slides, keyTerms: info.keyTerms, gradeLevel: info.gradeLevel, subject: info.subject },
    });
  };

  const statusTone = published ? { bg: '#DCFCE7', fg: '#15803D', label: 'Published' } : info.status === 'archived' ? { bg: '#E5E7EB', fg: '#6B7280', label: 'Archived' } : { bg: '#FEF3C7', fg: '#B45309', label: 'Draft' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
      <ScreenHeader title="Edit lesson" subtitle={info.subject || 'Lesson'} onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={TK.mint} /></View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{error}</Text>
          <Pressable onPress={load} style={{ borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}><Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 13 }}>Retry</Text></Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={TK.mint} />}>
          {/* status + preview + publish */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <View style={{ backgroundColor: statusTone.bg, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6 }}><Text style={{ color: statusTone.fg, fontFamily: FONT.extrabold, fontSize: 12 }}>{statusTone.label}</Text></View>
            <View style={{ flex: 1 }} />
            <Pressable onPress={preview} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingHorizontal: 13, height: 40 }}>
              <Play size={15} color={TK.text} strokeWidth={2.4} /><Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 13 }}>Preview</Text>
            </Pressable>
            <Pressable onPress={togglePublish} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: published ? '#FEF3C7' : TK.mint, borderRadius: 12, paddingHorizontal: 14, height: 40 }}>
              {published ? <Undo2 size={15} color="#B45309" strokeWidth={2.6} /> : <Send size={15} color="#fff" strokeWidth={2.6} />}
              <Text style={{ color: published ? '#B45309' : '#fff', fontFamily: FONT.extrabold, fontSize: 13 }}>{published ? 'Unpublish' : 'Publish'}</Text>
            </Pressable>
          </View>

          {/* info */}
          <View style={{ backgroundColor: TK.card, borderRadius: 16, borderWidth: 1, borderColor: TK.border, padding: 14, marginBottom: 16 }}>
            {label('TITLE')}
            <TextInput style={[inputStyle, { marginBottom: 12 }]} value={info.title} onChangeText={(v) => { dirty.current = true; setInfo((s) => ({ ...s, title: v })); }} onEndEditing={(e) => saveField({ title: e.nativeEvent.text })} placeholder="Lesson title" placeholderTextColor={TK.textMuted} />
            {label('SUMMARY')}
            <TextInput style={[inputStyle, { minHeight: 70, textAlignVertical: 'top', marginBottom: 12 }]} value={info.summary} onChangeText={(v) => { dirty.current = true; setInfo((s) => ({ ...s, summary: v })); }} onEndEditing={(e) => saveField({ summary: e.nativeEvent.text })} placeholder="One or two lines on what this teaches" placeholderTextColor={TK.textMuted} multiline />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>{label('DURATION')}<TextInput style={inputStyle} value={info.estimatedDuration} onChangeText={(v) => { dirty.current = true; setInfo((s) => ({ ...s, estimatedDuration: v })); }} onEndEditing={(e) => saveField({ estimatedDuration: e.nativeEvent.text })} placeholder="5 min" placeholderTextColor={TK.textMuted} /></View>
            </View>
            {label('DIFFICULTY')}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {DIFFICULTIES.map((d) => { const on = info.difficulty === d; return (
                <Pressable key={d} onPress={() => saveField({ difficulty: on ? null : d })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: on ? TK.mint : TK.border, backgroundColor: on ? TK.mint : TK.card }}>
                  <Text style={{ color: on ? '#fff' : TK.textMuted, fontFamily: FONT.extrabold, fontSize: 12.5, textTransform: 'capitalize' }}>{d}</Text>
                </Pressable>
              ); })}
            </View>
            {label('CLASS · who sees this in the library')}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {[{ n: null, t: 'All classes' }, ...CLASSES.map((n) => ({ n, t: `Class ${n}` }))].map(({ n, t }) => {
                const on = gradeNum(info.gradeLevel) === n;
                return (
                  <Pressable key={t} onPress={() => saveField({ gradeLevel: n == null ? '' : String(n) })} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: on ? TK.mint : TK.border, backgroundColor: on ? TK.mint : TK.card }}>
                    <Text style={{ color: on ? '#fff' : TK.textMuted, fontFamily: FONT.extrabold, fontSize: 12.5 }}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
            {label('KEY TERMS · comma-separated')}
            <TextInput style={inputStyle} value={keyTermsText} onChangeText={(v) => { dirty.current = true; setKeyTermsText(v); }} onEndEditing={commitKeyTerms} placeholder="velocity, acceleration, vector" placeholderTextColor={TK.textMuted} autoCapitalize="none" />
          </View>

          {/* slides */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 16 }}>Slides <Text style={{ color: TK.textMuted, fontSize: 13 }}>{slides.length}</Text></Text>
            <Pressable onPress={addSlide} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: TK.mint, borderRadius: 11, paddingHorizontal: 12, height: 36 }}>
              <Plus size={16} color="#fff" strokeWidth={2.8} /><Text style={{ color: '#fff', fontFamily: FONT.extrabold, fontSize: 12.5 }}>Add slide</Text>
            </Pressable>
          </View>

          {!slides.length ? (
            <View style={{ backgroundColor: TK.card, borderRadius: 16, borderWidth: 1, borderColor: TK.border, padding: 22, alignItems: 'center' }}>
              <Text style={{ color: TK.textMuted, fontFamily: FONT.semibold, fontSize: 13.5, textAlign: 'center' }}>No slides yet. Tap “Add slide” to build the lesson.</Text>
            </View>
          ) : slides.map((s, i) => (
            <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: TK.card, borderRadius: 14, borderWidth: 1, borderColor: TK.border, marginBottom: 10, overflow: 'hidden' }}>
              <Pressable onPress={() => navigation.navigate('AiSlideEditor', { slideId: s.id, lessonId })} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, paddingHorizontal: 13 }}>
                <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: TK.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: TK.textMuted, fontFamily: FONT.extrabold, fontSize: 13 }}>{i + 1}</Text></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ color: TK.text, fontFamily: FONT.bold, fontSize: 14 }}>{s.slideTitle || 'Untitled slide'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: VISUAL_TONE[s.visualType] || VISUAL_TONE.NONE }} />
                    <Text style={{ color: TK.textMuted, fontFamily: FONT.semibold, fontSize: 11 }}>{(s.visualType || 'NONE') === 'NONE' ? 'Text only' : s.visualType}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={TK.textMuted} />
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 8, gap: 2 }}>
                <Pressable onPress={() => moveSlide(i, -1)} disabled={i === 0} hitSlop={6} style={{ opacity: i === 0 ? 0.25 : 1, padding: 5 }}><ArrowUp size={16} color={TK.text} /></Pressable>
                <Pressable onPress={() => moveSlide(i, 1)} disabled={i === slides.length - 1} hitSlop={6} style={{ opacity: i === slides.length - 1 ? 0.25 : 1, padding: 5 }}><ArrowDown size={16} color={TK.text} /></Pressable>
                <Pressable onPress={() => setMenu(s)} hitSlop={6} style={{ padding: 5 }}><Text style={{ color: TK.textMuted, fontFamily: FONT.black, fontSize: 18, marginTop: -4 }}>⋯</Text></Pressable>
              </View>
            </View>
          ))}

          {/* engagement — real lesson_progress data (only meaningful once published & played) */}
          <Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 16, marginTop: 22, marginBottom: 10 }}>Insights</Text>
          {!stats || !stats.views ? (
            <View style={{ backgroundColor: TK.card, borderRadius: 16, borderWidth: 1, borderColor: TK.border, padding: 20, alignItems: 'center' }}>
              <Text style={{ color: TK.textMuted, fontFamily: FONT.semibold, fontSize: 13, textAlign: 'center' }}>No student activity yet.{'\n'}Publish the lesson and insights will appear here.</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <StatTile label="Learners" value={String(stats.views)} />
                <StatTile label="Completed" value={`${stats.completed} · ${stats.completionRate}%`} />
                <StatTile label="Avg time" value={fmtTime(stats.avgSeconds)} />
                <StatTile label="Avg reached" value={stats.slidesTotal ? `slide ${Math.round(stats.avgLastSlide) + 1}/${stats.slidesTotal}` : '—'} />
                <StatTile label="Doubts" value={String(stats.questionsAsked)} />
              </View>
              <Text style={{ color: TK.textMuted, fontFamily: FONT.semibold, fontSize: 11, marginTop: 8 }}>From students who played this lesson. No ratings are collected, so none are shown.</Text>
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      <ActionSheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.slideTitle} message="Slide" options={slideMenu(menu)} />
    </SafeAreaView>
  );
}
