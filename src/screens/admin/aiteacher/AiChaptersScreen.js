// src/screens/admin/aiteacher/AiChaptersScreen.js
// AI Teacher catalog — Chapters within a subject (level 2). Shared testCardKit ChapterRow so
// it matches the student chapter browse; additions are a FAB (+ Add Chapter) and a per-row
// "⋯" (Rename / Move to another subject / Archive / Delete). Real CRUD via
// /api/admin/ai-teacher/catalog/…. Tapping a chapter opens its Lessons (AiLessons).
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Pencil, FolderInput, Archive, RotateCcw, Trash2 } from 'lucide-react-native';
import { FONT } from '../../../constants/fonts';
import { getAiChapters, createAiChapter, updateAiChapter, setAiChapterStatus, moveAiChapter, deleteAiChapter, getAiSubjects } from '../../../api/adminApi';
import { TK, ScreenHeader, ChapterRow } from '../../../components/testCardKit';
import { ActionSheet } from '../ui/ActionSheet';
import { apiError } from '../ui/format';
import Fab from '../../../components/Fab';
import NamePrompt from '../../../components/NamePrompt';
import { useBottomPad } from '../../../theme/layout';

export default function AiChaptersScreen({ route, navigation }) {
  const { subjectId, name } = route.params || {};
  const [data, setData] = useState({ loading: true, error: '', list: [] });
  const [menu, setMenu] = useState(null);       // chapter for the action sheet
  const [prompt, setPrompt] = useState(null);   // { mode:'create'|'rename', chapter? }
  const [moveFor, setMoveFor] = useState(null); // chapter being moved
  const [subjects, setSubjects] = useState([]);
  const bottomPad = useBottomPad({ fab: true });

  const load = useCallback(async () => {
    setData((d) => ({ ...d, loading: true, error: '' }));
    try { const d = await getAiChapters(subjectId); setData({ loading: false, error: '', list: d?.rows || [] }); }
    catch (e) { setData({ loading: false, error: apiError(e), list: [] }); }
  }, [subjectId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submitPrompt = async (nm) => {
    try {
      if (prompt.mode === 'create') await createAiChapter(subjectId, { name: nm });
      else await updateAiChapter(prompt.chapter.id, { name: nm });
      setPrompt(null); load();
    } catch (e) { Alert.alert('Could not save', apiError(e)); }
  };

  const act = (fn, errTitle) => fn().then(load).catch((e) => Alert.alert(errTitle, apiError(e)));
  const confirmDelete = (c) => Alert.alert('Delete chapter?', `“${c.name}” and its lessons will be removed from the catalog.`,
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => act(() => deleteAiChapter(c.id), 'Could not delete') }]);

  const openMove = async (c) => {
    setMoveFor(c);
    try { const d = await getAiSubjects(); setSubjects((d?.rows || []).filter((s) => s.id !== subjectId && s.status !== 'archived')); }
    catch { setSubjects([]); }
  };
  const doMove = (targetId) => { const c = moveFor; setMoveFor(null); act(() => moveAiChapter(c.id, targetId), 'Could not move'); };

  const menuOptions = (c) => c ? [
    { key: 'rename', label: 'Rename', icon: Pencil, tone: 'indigo', onPress: () => setPrompt({ mode: 'rename', chapter: c }) },
    { key: 'move', label: 'Move to another subject', icon: FolderInput, tone: 'blue', onPress: () => openMove(c) },
    c.status === 'archived'
      ? { key: 'restore', label: 'Restore', icon: RotateCcw, tone: 'emerald', onPress: () => act(() => setAiChapterStatus(c.id, 'published'), 'Could not restore') }
      : { key: 'archive', label: 'Archive', icon: Archive, tone: 'gold', onPress: () => act(() => setAiChapterStatus(c.id, 'archived'), 'Could not archive') },
    { key: 'delete', label: 'Delete', icon: Trash2, danger: true, onPress: () => confirmDelete(c) },
  ] : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
      <ScreenHeader title={name || 'Subject'} subtitle="Chapters" onBack={() => navigation.goBack()} />
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
            <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center', paddingHorizontal: 24 }}>No chapters yet. Tap ＋ to add one.</Text>
          </View>
        ) : data.list.map((c, i) => (
          <ChapterRow
            key={c.id}
            index={i + 1}
            name={c.name}
            dim={c.status === 'archived'}
            sub={`${c.lessonCount} ${c.lessonCount === 1 ? 'lesson' : 'lessons'}${c.status === 'archived' ? '  ·  Archived' : ''}`}
            onPress={() => navigation.navigate('AiLessons', { chapterId: c.id, name: c.name })}
            onMenu={() => setMenu(c)}
          />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Fab onPress={() => setPrompt({ mode: 'create' })} accessibilityLabel="Add chapter" />

      <ActionSheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.name} message="Chapter" options={menuOptions(menu)} />
      <ActionSheet
        visible={!!moveFor}
        onClose={() => setMoveFor(null)}
        title="Move to subject"
        message={subjects.length ? 'Choose a destination subject' : 'No other subjects available'}
        options={subjects.map((s) => ({ key: s.id, label: s.name, sub: `${s.chapterCount} chapters`, onPress: () => doMove(s.id) }))}
      />
      <NamePrompt
        visible={!!prompt}
        title={prompt?.mode === 'rename' ? 'Rename chapter' : 'New chapter'}
        placeholder="e.g. Laws of Motion"
        initialValue={prompt?.mode === 'rename' ? prompt.chapter.name : ''}
        saveLabel={prompt?.mode === 'rename' ? 'Save' : 'Add'}
        onSubmit={submitPrompt}
        onClose={() => setPrompt(null)}
      />
    </SafeAreaView>
  );
}
