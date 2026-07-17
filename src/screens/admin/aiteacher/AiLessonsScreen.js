// src/screens/admin/aiteacher/AiLessonsScreen.js
// AI Teacher catalog — Lessons within a chapter (level 3). Reuses the shared testCardKit
// ChapterRow so it matches the student browse; additions are a FAB (+ New lesson), a per-row
// "⋯" (Edit / Publish-Unpublish / Duplicate / Archive-Restore / Delete) and a status pill.
// Real CRUD via /api/admin/ai-teacher/catalog/…. Tapping a lesson opens its editor.
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Pencil, Send, Undo2, CopyPlus, Archive, RotateCcw, Trash2, Sparkles, PencilLine } from 'lucide-react-native';
import { FONT } from '../../../constants/fonts';
import { getAiLessons, createAiLesson, generateAiLesson, setAiLessonStatus, duplicateAiLesson, deleteAiLesson } from '../../../api/adminApi';
import { TK, ScreenHeader, ChapterRow } from '../../../components/testCardKit';
import { ActionSheet } from '../ui/ActionSheet';
import { apiError } from '../ui/format';
import Fab from '../../../components/Fab';
import NamePrompt from '../../../components/NamePrompt';
import { useBottomPad } from '../../../theme/layout';

const STATUS_TONE = { draft: { bg: '#FEF3C7', fg: '#B45309', label: 'Draft' }, published: { bg: '#DCFCE7', fg: '#15803D', label: 'Published' }, archived: { bg: '#E5E7EB', fg: '#6B7280', label: 'Archived' } };

export default function AiLessonsScreen({ route, navigation }) {
  const { chapterId, name } = route.params || {};
  const [data, setData] = useState({ loading: true, error: '', list: [] });
  const [menu, setMenu] = useState(null);
  const [chooser, setChooser] = useState(false);   // FAB → blank vs generate
  const [prompt, setPrompt] = useState(false);      // blank-lesson title prompt
  const [genPrompt, setGenPrompt] = useState(false);// generate-from-topic prompt
  const [generating, setGenerating] = useState(false);
  const bottomPad = useBottomPad({ fab: true });

  const load = useCallback(async () => {
    setData((d) => ({ ...d, loading: true, error: '' }));
    try { const d = await getAiLessons(chapterId); setData({ loading: false, error: '', list: d?.rows || [] }); }
    catch (e) { setData({ loading: false, error: apiError(e), list: [] }); }
  }, [chapterId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const createLesson = async (title) => {
    try {
      const d = await createAiLesson(chapterId, { title });
      setPrompt(false);
      if (d?.lesson?.id) navigation.navigate('AiLessonEditor', { lessonId: d.lesson.id, title: d.lesson.title });
      else load();
    } catch (e) { Alert.alert('Could not create', apiError(e)); }
  };
  const generate = async (topic) => {
    setGenPrompt(false);
    setGenerating(true);
    try {
      const d = await generateAiLesson(chapterId, { topic });
      if (d?.lesson?.id) navigation.navigate('AiLessonEditor', { lessonId: d.lesson.id, title: d.lesson.title });
      else load();
    } catch (e) { Alert.alert('Could not generate', apiError(e)); }
    finally { setGenerating(false); }
  };
  const chooserOptions = [
    { key: 'gen', label: 'Generate with AI', sub: 'Draft a full lesson from a topic', icon: Sparkles, tone: 'indigo', onPress: () => setGenPrompt(true) },
    { key: 'blank', label: 'Write from scratch', sub: 'Start with an empty lesson', icon: PencilLine, tone: 'blue', onPress: () => setPrompt(true) },
  ];

  const act = (fn, errTitle) => fn().then(load).catch((e) => Alert.alert(errTitle, apiError(e)));
  const confirmDelete = (l) => Alert.alert('Delete lesson?', `“${l.title}” and its slides will be removed from the catalog.`,
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => act(() => deleteAiLesson(l.id), 'Could not delete') }]);

  const menuOptions = (l) => l ? [
    { key: 'edit', label: 'Edit', sub: 'Info & slides', icon: Pencil, tone: 'indigo', onPress: () => navigation.navigate('AiLessonEditor', { lessonId: l.id, title: l.title }) },
    l.status === 'published'
      ? { key: 'unpub', label: 'Unpublish', sub: 'Back to draft', icon: Undo2, tone: 'gold', onPress: () => act(() => setAiLessonStatus(l.id, 'draft'), 'Could not update') }
      : { key: 'pub', label: 'Publish', sub: 'Make it live for students', icon: Send, tone: 'emerald', onPress: () => act(() => setAiLessonStatus(l.id, 'published'), 'Could not publish') },
    { key: 'dup', label: 'Duplicate', icon: CopyPlus, tone: 'blue', onPress: () => act(() => duplicateAiLesson(l.id), 'Could not duplicate') },
    l.status === 'archived'
      ? { key: 'restore', label: 'Restore', icon: RotateCcw, tone: 'emerald', onPress: () => act(() => setAiLessonStatus(l.id, 'draft'), 'Could not restore') }
      : { key: 'archive', label: 'Archive', icon: Archive, tone: 'gold', onPress: () => act(() => setAiLessonStatus(l.id, 'archived'), 'Could not archive') },
    { key: 'delete', label: 'Delete', icon: Trash2, danger: true, onPress: () => confirmDelete(l) },
  ] : [];

  const subFor = (l) => {
    const t = STATUS_TONE[l.status] || STATUS_TONE.draft;
    const sl = `${l.slideCount} ${l.slideCount === 1 ? 'slide' : 'slides'}`;
    const cn = parseInt(String(l.gradeLevel || '').replace(/\D/g, ''), 10);
    const cls = Number.isFinite(cn) ? `Class ${cn}` : 'All classes';
    return `${sl}  ·  ${cls}  ·  ${t.label}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
      <ScreenHeader title={name || 'Chapter'} subtitle="Lessons" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={TK.mint} />}>
        {data.loading && !data.list.length ? (
          <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={TK.mint} /></View>
        ) : data.error ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
            <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{data.error}</Text>
            <Pressable onPress={load} style={{ borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}><Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 13 }}>Retry</Text></Pressable>
          </View>
        ) : !data.list.length ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center', paddingHorizontal: 24 }}>No lessons yet. Tap ＋ to create one.</Text>
          </View>
        ) : data.list.map((l, i) => (
          <ChapterRow
            key={l.id}
            index={i + 1}
            name={l.title}
            dim={l.status === 'archived'}
            sub={subFor(l)}
            onPress={() => navigation.navigate('AiLessonEditor', { lessonId: l.id, title: l.title })}
            onMenu={() => setMenu(l)}
          />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Fab onPress={() => setChooser(true)} accessibilityLabel="New lesson" />

      <ActionSheet visible={chooser} onClose={() => setChooser(false)} title="New lesson" message="How do you want to start?" options={chooserOptions} />
      <ActionSheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.title} message="Lesson" options={menuOptions(menu)} />
      <NamePrompt
        visible={!!prompt}
        title="New lesson"
        placeholder="e.g. What is acceleration?"
        saveLabel="Create"
        onSubmit={createLesson}
        onClose={() => setPrompt(false)}
      />
      <NamePrompt
        visible={!!genPrompt}
        title="Generate a lesson"
        placeholder="Topic — e.g. Newton's second law"
        saveLabel="Generate"
        onSubmit={generate}
        onClose={() => setGenPrompt(false)}
      />

      {generating && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(10,12,20,0.72)', alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 40 }}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={{ color: '#fff', fontFamily: FONT.extrabold, fontSize: 16, textAlign: 'center' }}>Generating your lesson…</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: FONT.semibold, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>Writing the slides and narration. This can take up to a minute — you'll land in the editor to review and publish.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
