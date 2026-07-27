// src/screens/admin/tests/TestsHomeScreen.js
// Admin Tests — Student Mock Tests experience, organized by CLASS: Class → Subjects → Tests.
// A shared ClassSelector sits under the header; subjects + counts + the test list are all
// scoped to the selected class (no cross-class mixing). The class is remembered per-tab
// (AsyncStorage) and preserved when returning from a nested screen. Built from the shared
// testCardKit; the only additions are the FAB (+ Add Test, carrying the class/subject) and the
// per-card "⋯". Real data from /api/admin/tests(+/subjects,/classes); stale responses are
// dropped via sequence guards.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Pencil, Copy, Eye, Send, Archive, RotateCcw, Trash2, ListChecks, Plus } from 'lucide-react-native';
import { FONT } from '../../../constants/fonts';
import {
  getAdminTestSubjects, getAdminTestClasses, getAdminTests, setAdminTestStatus, duplicateAdminTest, deleteAdminTest,
} from '../../../api/adminApi';
import { TK, ScreenHeader, SearchBox, SubjectRow } from '../../../components/testCardKit';
import StatusTabs from '../../../components/StatusTabs';
import AdminTestCard from '../../../components/AdminTestCard';
import { ActionSheet } from '../ui/ActionSheet';
import { apiError } from '../ui/format';
import Fab from '../../../components/Fab';
import ClassSelector from '../../../components/ClassSelector';
import TestModeToggle from '../../../components/TestModeToggle';
import OnlineTestsBrowser from './OnlineTestsBrowser';
import { getLastClass, setLastClass } from '../../../utils/lastClass';
import { useBottomPad } from '../../../theme/layout';

// Stable subject tints + emoji (match the student Mock Tests screen).
const TILE = {
  Physics: '#E1F5F3', Chemistry: '#FCEBDD', Mathematics: '#E9EBFB', Maths: '#E9EBFB',
  Biology: '#E7F3E4', Science: '#E7F3E4', 'Social Science': '#E9EBFB',
  English: '#FDF3D6', Hindi: '#FBE9E7', 'Computer Applications': '#E9EBFB',
};
const EMOJI = {
  Physics: '⚛️', Chemistry: '🧪', Mathematics: '📐', Maths: '📐', Biology: '🧬', Science: '🔬',
  'Social Science': '🌐', English: '📖', Hindi: '📖', 'Computer Applications': '💻', 'Information Technology': '💻',
};
const emojiFor = (name) => {
  if (EMOJI[name]) return EMOJI[name];
  const k = Object.keys(EMOJI).find((k) => (name || '').includes(k));
  return k ? EMOJI[k] : '📚';
};
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const CenteredCta = ({ title, sub, label, onPress }) => (
  <View style={{ alignItems: 'center', paddingVertical: 52, paddingHorizontal: 24, gap: 10 }}>
    <View style={{ width: 70, height: 70, borderRadius: 22, backgroundColor: TK.mintSoft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 30 }}>📝</Text></View>
    <Text style={{ fontSize: 17, fontWeight: '900', color: TK.text, textAlign: 'center' }}>{title}</Text>
    {!!sub && <Text style={{ fontSize: 13, fontWeight: '600', color: TK.textMuted, textAlign: 'center', lineHeight: 19 }}>{sub}</Text>}
    {!!label && (
      <Pressable onPress={onPress} style={{ marginTop: 6, backgroundColor: TK.mint, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{label}</Text>
      </Pressable>
    )}
  </View>
);

export default function TestsHomeScreen({ navigation }) {
  const [mode, setMode] = useState('mock'); // 'mock' (admin-authored) | 'online' (imported ot_tests)
  const [classes, setClasses] = useState([]);
  const [cls, setCls] = useState(null);
  const [ready, setReady] = useState(false);
  const [subject, setSubject] = useState(null); // null → subjects; else tests for that subject
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [subjects, setSubjects] = useState({ loading: true, error: '', list: [] });
  const [tests, setTests] = useState({ loading: false, error: '', list: [] });
  const [menuTest, setMenuTest] = useState(null);
  const bottomPad = useBottomPad({ fab: true });

  const subjSeq = useRef(0);
  const testSeq = useRef(0);

  const loadSubjects = useCallback(async (klass) => {
    if (klass == null) { setSubjects({ loading: false, error: '', list: [] }); return; }
    const my = ++subjSeq.current;
    setSubjects((s) => ({ ...s, loading: true, error: '' }));
    try { const d = await getAdminTestSubjects({ class: klass }); if (my === subjSeq.current) setSubjects({ loading: false, error: '', list: d?.subjects || [] }); }
    catch (e) { if (my === subjSeq.current) setSubjects({ loading: false, error: apiError(e), list: [] }); }
  }, []);

  const loadTests = useCallback(async (subjName, klass) => {
    const my = ++testSeq.current;
    setTests({ loading: true, error: '', list: [] });
    try {
      const all = []; let page = 1;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const d = await getAdminTests({ subject: subjName, class: klass, page, pageSize: 100 });
        all.push(...(d?.rows || []));
        if (all.length >= (d?.total || 0) || !(d?.rows || []).length) break;
        page += 1;
      }
      if (my === testSeq.current) setTests({ loading: false, error: '', list: all });
    } catch (e) { if (my === testSeq.current) setTests({ loading: false, error: apiError(e), list: [] }); }
  }, []);

  // Load available classes once; default to the last-used class (else first class with tests).
  useEffect(() => {
    let alive = true;
    (async () => {
      let list = [];
      try { const d = await getAdminTestClasses(); list = d?.classes || []; } catch { /* keep [] */ }
      const saved = await getLastClass('tests');
      if (!alive) return;
      setClasses(list);
      setCls(saved != null && list.includes(saved) ? saved : (list[0] ?? null));
      setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  // Reload subjects for the current class whenever the tab regains focus (reflects adds/edits).
  useFocusEffect(useCallback(() => { if (ready && cls != null) loadSubjects(cls); }, [ready, cls, loadSubjects]));
  // Load tests when a subject is chosen (scoped to the class).
  useEffect(() => { if (subject && cls != null) { setTab('all'); loadTests(subject.name, cls); } }, [subject, cls, loadTests]);

  const pickClass = (n) => {
    if (n === cls) return;
    setCls(n); setLastClass('tests', n); setSubject(null); setSearch('');
    loadSubjects(n);
  };

  const afterMutate = useCallback(() => { if (subject) loadTests(subject.name, cls); loadSubjects(cls); }, [subject, cls, loadTests, loadSubjects]);
  const runStatus = (t, status, verb) => setAdminTestStatus(t.id, status).then(afterMutate).catch((e) => Alert.alert(`Could not ${verb}`, apiError(e)));
  const doDuplicate = (t) => duplicateAdminTest(t.id).then((r) => { afterMutate(); const nid = r?.test?.id; if (nid) navigation.navigate('TestDetail', { id: nid }); }).catch((e) => Alert.alert('Could not duplicate', apiError(e)));
  const confirmArchive = (t) => Alert.alert('Archive test?', `“${t.name}” will be hidden from students. Existing attempts are kept.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Archive', style: 'destructive', onPress: () => runStatus(t, 'archived', 'archive') }]);
  const confirmDelete = (t) => Alert.alert('Delete test?', `This permanently deletes “${t.name}”. This cannot be undone.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteAdminTest(t.id).then(afterMutate).catch((e) => Alert.alert('Could not delete', apiError(e))) }]);

  const addTest = () => navigation.navigate('TestForm', { mode: 'add', classLevel: cls, subject: subject ? subject.name : undefined });

  const menuOptions = (t) => t ? [
    { key: 'manage', label: 'Manage questions', sub: 'Add, edit & reorder questions', icon: ListChecks, tone: 'indigo', onPress: () => navigation.navigate('TestDetail', { id: t.id }) },
    { key: 'edit', label: 'Edit details', sub: 'Title, subject, duration…', icon: Pencil, tone: 'blue', onPress: () => navigation.navigate('TestForm', { mode: 'edit', test: t }) },
    { key: 'preview', label: 'Preview as student', icon: Eye, tone: 'purple', onPress: () => navigation.navigate('TestPreview', { id: t.id }) },
    t.status !== 'published'
      ? { key: 'publish', label: 'Publish', sub: 'Make it live in Practice', icon: Send, tone: 'emerald', onPress: () => runStatus(t, 'published', 'publish') }
      : { key: 'unpublish', label: 'Unpublish', sub: 'Move back to draft', icon: RotateCcw, tone: 'gold', onPress: () => runStatus(t, 'draft', 'unpublish') },
    { key: 'duplicate', label: 'Duplicate', sub: 'Copy as a new draft', icon: Copy, tone: 'indigo', onPress: () => doDuplicate(t) },
    t.status === 'archived'
      ? { key: 'restore', label: 'Restore', sub: 'Move back to draft', icon: RotateCcw, tone: 'emerald', onPress: () => runStatus(t, 'draft', 'restore') }
      : { key: 'archive', label: 'Archive', icon: Archive, tone: 'gold', onPress: () => confirmArchive(t) },
    { key: 'delete', label: 'Delete', icon: Trash2, danger: true, onPress: () => confirmDelete(t) },
  ] : [];

  // Online Tests mode — a self-contained browser (imported ot_tests). Rendered after all hooks.
  if (mode === 'online') {
    return <OnlineTestsBrowser navigation={navigation} mode={mode} setMode={setMode} />;
  }

  // ────────────────────────────── level 1: class → subjects ──────────────────────
  if (!subject) {
    const q = search.trim().toLowerCase();
    const list = q ? subjects.list.filter((s) => (s.name || '').toLowerCase().includes(q)) : subjects.list;
    const showFab = ready && cls != null && subjects.list.length > 0;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
        <ScreenHeader title="Tests" subtitle="Pick a class, then a subject" />
        <TestModeToggle mode={mode} onChange={setMode} />
        {classes.length > 0 && <ClassSelector classes={classes} value={cls} onChange={pickClass} />}
        <SearchBox value={search} onChangeText={setSearch} placeholder={cls != null ? `Search Class ${cls} subjects…` : 'Search subjects…'} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => loadSubjects(cls)} tintColor={TK.mint} />}>
          {!ready || (subjects.loading && !subjects.list.length) ? (
            <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={TK.mint} /></View>
          ) : !classes.length ? (
            <CenteredCta title="No tests yet" sub="Create your first mock test — it appears in students’ Practice tab once published." label="Add Test" onPress={addTest} />
          ) : subjects.error ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
              <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{subjects.error}</Text>
              <Pressable onPress={() => loadSubjects(cls)} style={{ borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}><Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 13 }}>Retry</Text></Pressable>
            </View>
          ) : !list.length ? (
            q
              ? <View style={{ paddingVertical: 48, alignItems: 'center' }}><Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>No Class {cls} subjects match your search.</Text></View>
              : <CenteredCta title={`No tests for Class ${cls} yet`} sub="Add the first mock test for this class." label="Add the first test" onPress={addTest} />
          ) : list.map((s) => (
            <SubjectRow
              key={s.name}
              emoji={emojiFor(s.name)}
              tile={TILE[s.name]}
              name={s.name}
              sub={`Class ${cls}  ·  ${s.total} ${s.total === 1 ? 'test' : 'tests'}  ·  ${s.published} published${s.draft ? `  ·  ${s.draft} draft` : ''}`}
              onPress={() => setSubject(s)}
            />
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
        {showFab && <Fab onPress={addTest} accessibilityLabel="Add test" />}
      </SafeAreaView>
    );
  }

  // ────────────────────────────── level 2: tests in subject (class-scoped) ────────
  const counts = {
    all: tests.list.length,
    published: tests.list.filter((t) => t.status === 'published').length,
    draft: tests.list.filter((t) => t.status === 'draft').length,
    archived: tests.list.filter((t) => t.status === 'archived').length,
  };
  const shown = tab === 'all' ? tests.list : tests.list.filter((t) => t.status === tab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
      <ScreenHeader title={subject.name} subtitle={`Class ${cls} · Mock Tests`} onBack={() => setSubject(null)} />
      <StatusTabs
        tab={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'All', count: counts.all },
          { id: 'published', label: 'Published', count: counts.published },
          { id: 'draft', label: 'Draft', count: counts.draft },
          { id: 'archived', label: 'Archived', count: counts.archived },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => loadTests(subject.name, cls)} tintColor={TK.mint} />}>
        {tests.loading ? (
          <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={TK.mint} /></View>
        ) : tests.error ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
            <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{tests.error}</Text>
            <Pressable onPress={() => loadTests(subject.name, cls)} style={{ borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}><Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 13 }}>Retry</Text></Pressable>
          </View>
        ) : shown.length === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}><Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{tab === 'all' ? `No mock tests in Class ${cls} ${subject.name} yet.` : `No ${tab} tests.`}</Text></View>
        ) : shown.map((t) => (
          <AdminTestCard
            key={t.id}
            status={t.status}
            title={t.name}
            metas={[
              `\u{1F4DD} ${t.questionCount || 0} questions`,
              `⏱ ${t.durationMin || 90} min`,
              t.attemptCount > 0 ? `\u{1F465} ${t.attemptCount} attempts` : null,
            ].filter(Boolean)}
            onPress={() => navigation.navigate('TestDetail', { id: t.id })}
            onMenu={() => setMenuTest(t)}
          />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Fab onPress={addTest} accessibilityLabel="Add test" />

      <ActionSheet
        visible={!!menuTest}
        onClose={() => setMenuTest(null)}
        title={menuTest?.name}
        message={menuTest ? `${cap(menuTest.status)} · ${menuTest.questionCount || 0} questions` : ''}
        options={menuOptions(menuTest)}
      />
    </SafeAreaView>
  );
}
