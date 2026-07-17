// src/screens/admin/aiteacher/AiSubjectsScreen.js
// AI Teacher catalog — Subjects (level 1 of Subjects → Chapters → Lessons → Slides). Built
// from the shared student testCardKit (SubjectRow) so it reads exactly like the student
// Practice/Resources browse; the only additions are a FAB (+ Add Subject) and a per-row "⋯"
// (Rename / Archive / Delete). Real CRUD via /api/admin/ai-teacher/catalog/subjects.
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Pencil, Archive, RotateCcw, Trash2 } from 'lucide-react-native';
import { FONT } from '../../../constants/fonts';
import { getAiSubjects, createAiSubject, updateAiSubject, setAiSubjectStatus, deleteAiSubject } from '../../../api/adminApi';
import { TK, ScreenHeader, SearchBox, SubjectRow } from '../../../components/testCardKit';
import { ActionSheet } from '../ui/ActionSheet';
import { apiError } from '../ui/format';
import Fab from '../../../components/Fab';
import NamePrompt from '../../../components/NamePrompt';
import { useBottomPad } from '../../../theme/layout';

const EmptyMsg = ({ text }) => (
  <View style={{ paddingVertical: 48, alignItems: 'center' }}>
    <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center', paddingHorizontal: 24 }}>{text}</Text>
  </View>
);

export default function AiSubjectsScreen({ navigation }) {
  const [data, setData] = useState({ loading: true, error: '', list: [] });
  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState(null);          // subject for the action sheet
  const [prompt, setPrompt] = useState(null);      // { mode:'create'|'rename', subject? }
  const bottomPad = useBottomPad({ fab: true });

  const load = useCallback(async () => {
    setData((d) => ({ ...d, loading: true, error: '' }));
    try { const d = await getAiSubjects(); setData({ loading: false, error: '', list: d?.rows || [] }); }
    catch (e) { setData({ loading: false, error: apiError(e), list: [] }); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submitPrompt = async (name) => {
    try {
      if (prompt.mode === 'create') await createAiSubject({ name });
      else await updateAiSubject(prompt.subject.id, { name });
      setPrompt(null); load();
    } catch (e) { Alert.alert('Could not save', apiError(e)); }
  };

  const act = (fn, errTitle) => fn().then(load).catch((e) => Alert.alert(errTitle, apiError(e)));
  const confirmDelete = (s) => Alert.alert('Delete subject?', `“${s.name}” and its chapters & lessons will be removed from the catalog. This can be restored by support.`,
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => act(() => deleteAiSubject(s.id), 'Could not delete') }]);

  const menuOptions = (s) => s ? [
    { key: 'rename', label: 'Rename', icon: Pencil, tone: 'indigo', onPress: () => setPrompt({ mode: 'rename', subject: s }) },
    s.status === 'archived'
      ? { key: 'restore', label: 'Restore', icon: RotateCcw, tone: 'emerald', onPress: () => act(() => setAiSubjectStatus(s.id, 'published'), 'Could not restore') }
      : { key: 'archive', label: 'Archive', icon: Archive, tone: 'gold', onPress: () => act(() => setAiSubjectStatus(s.id, 'archived'), 'Could not archive') },
    { key: 'delete', label: 'Delete', icon: Trash2, danger: true, onPress: () => confirmDelete(s) },
  ] : [];

  const q = search.trim().toLowerCase();
  const list = q ? data.list.filter((s) => (s.name || '').toLowerCase().includes(q)) : data.list;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
      <ScreenHeader title="AI Teacher" subtitle="Author lessons by subject" onBack={() => navigation.goBack()} />
      <SearchBox value={search} onChangeText={setSearch} placeholder="Search subjects…" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={TK.mint} />}>
        {data.loading && !data.list.length ? (
          <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={TK.mint} /></View>
        ) : data.error ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
            <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{data.error}</Text>
            <Pressable onPress={load} style={{ borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}><Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 13 }}>Retry</Text></Pressable>
          </View>
        ) : !list.length ? (
          <EmptyMsg text={q ? 'No subjects match your search.' : 'No subjects yet. Tap ＋ to add your first subject.'} />
        ) : list.map((s) => (
          <SubjectRow
            key={s.id}
            emoji={s.emoji || '📘'}
            name={s.name}
            dim={s.status === 'archived'}
            sub={`${s.chapterCount} ${s.chapterCount === 1 ? 'chapter' : 'chapters'}  ·  ${s.lessonCount} ${s.lessonCount === 1 ? 'lesson' : 'lessons'}${s.status === 'archived' ? '  ·  Archived' : ''}`}
            onPress={() => navigation.navigate('AiChapters', { subjectId: s.id, name: s.name })}
            onMenu={() => setMenu(s)}
          />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Fab onPress={() => setPrompt({ mode: 'create' })} accessibilityLabel="Add subject" />

      <ActionSheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.name} message="Subject" options={menuOptions(menu)} />
      <NamePrompt
        visible={!!prompt}
        title={prompt?.mode === 'rename' ? 'Rename subject' : 'New subject'}
        placeholder="e.g. Physics"
        initialValue={prompt?.mode === 'rename' ? prompt.subject.name : ''}
        saveLabel={prompt?.mode === 'rename' ? 'Save' : 'Add'}
        onSubmit={submitPrompt}
        onClose={() => setPrompt(null)}
      />
    </SafeAreaView>
  );
}
