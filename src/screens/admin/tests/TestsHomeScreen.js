// src/screens/admin/tests/TestsHomeScreen.js
// Admin Tests — Student Mock Tests experience, organized by CLASS: Class → Subjects → Tests.
// A class chip row sits under the header; subjects + counts + the test list are all scoped
// to the selected class (no cross-class mixing). The class is remembered per-tab
// (AsyncStorage) and preserved when returning from a nested screen. The FAB (+ Add Test,
// carrying the class/subject) and the per-card "⋯" are the only extra affordances. Real
// data from /api/admin/tests(+/subjects,/classes); stale responses are dropped via
// sequence guards.
//
// AILERNOVA dark design system pass: this screen used to render on the shared light
// `testCardKit`/`StatusTabs`/`AdminTestCard`/`ClassSelector`/`TestModeToggle` components
// (still light — shared with the un-migrated student Mock Tests screens), so instead of
// reskinning those shared files, this screen now renders its own local dark equivalents
// (SubjectRow/TestCard/ClassChips) plus the already-dark `../ui/kit` primitives
// (AdminHeader/AdminSearchBar/ChipRow/AdminSegmented), same recipe as AdminHomeScreen.js.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Pencil, Copy, Eye, Send, Archive, RotateCcw, Trash2, ListChecks, Plus, ChevronRight, EllipsisVertical } from 'lucide-react-native';
import {
  getAdminTestSubjects, getAdminTestClasses, getAdminTests, setAdminTestStatus, duplicateAdminTest, deleteAdminTest,
} from '../../../api/adminApi';
import { AdminHeader, AdminSearchBar, ChipRow, AdminSegmented } from '../ui/kit';
import { ActionSheet } from '../ui/ActionSheet';
import { apiError } from '../ui/format';
import Fab from '../../../components/Fab';
import OnlineTestsBrowser from './OnlineTestsBrowser';
import { getLastClass, setLastClass } from '../../../utils/lastClass';
import { useBottomPad } from '../../../theme/layout';
import { COLORS } from '../../../theme/designSystem';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';

// Local dark palette — same recipe as AdminHomeScreen.js's DK, kept local (not merged into
// the shared light `testCardKit`) since that kit is still what the un-migrated light student
// Mock Tests screens render with.
const DK = {
  canvas: COLORS.background,
  card: 'rgba(255,255,255,0.05)',
  hair: 'rgba(255,255,255,0.10)',
  ink: COLORS.textPrimary,
  muted: COLORS.textSecondary,
  faint: 'rgba(241,240,245,0.45)',
  indigo: COLORS.primary, indigoSoft: 'rgba(124,58,237,0.18)',
  blue: '#60A5FA', blueSoft: 'rgba(96,165,250,0.16)',
  emerald: COLORS.success, emeraldSoft: 'rgba(16,185,129,0.16)',
  gold: COLORS.accent, goldSoft: 'rgba(245,158,11,0.16)',
  orange: COLORS.warning, orangeSoft: 'rgba(249,115,22,0.16)',
  purple: COLORS.primaryLight, purpleSoft: 'rgba(168,85,247,0.16)',
};

// Stable subject tints (DK soft tones) + emoji (match the student Mock Tests screen's icons).
const TILE = {
  Physics: DK.blueSoft, Chemistry: DK.orangeSoft, Mathematics: DK.indigoSoft, Maths: DK.indigoSoft,
  Biology: DK.emeraldSoft, Science: DK.emeraldSoft, 'Social Science': DK.indigoSoft,
  English: DK.goldSoft, Hindi: DK.orangeSoft, 'Computer Applications': DK.indigoSoft,
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
    <View style={{ width: 70, height: 70, borderRadius: 22, backgroundColor: DK.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><T s={30}>📝</T></View>
    <T w="xbold" s={17} c={DK.ink} style={{ textAlign: 'center' }}>{title}</T>
    {!!sub && <T w="semi" s={13} c={DK.muted} style={{ textAlign: 'center', lineHeight: 19 }}>{sub}</T>}
    {!!label && (
      <PressableScale style={{ marginTop: 6, backgroundColor: DK.indigo, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 }} onPress={onPress} accessibilityLabel={label}>
        <T w="bold" s={14} c="#fff">{label}</T>
      </PressableScale>
    )}
  </View>
);

// A subject navigation row (emoji tile + name + subtitle + chevron) — local dark equivalent
// of testCardKit's SubjectRow.
function SubjectRow({ emoji, tile, name, sub, onPress }) {
  return (
    <PressableScale onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DK.card, borderRadius: 18, borderWidth: 1, borderColor: DK.hair, padding: 14, marginBottom: 12 }} accessibilityLabel={name}>
      <View style={{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: tile || DK.indigoSoft }}>
        <T s={26}>{emoji}</T>
      </View>
      <View style={{ flex: 1 }}>
        <T w="xbold" s={17} c={DK.ink}>{name}</T>
        {!!sub && <T w="semi" s={12.5} c={DK.muted} style={{ marginTop: 2 }}>{sub}</T>}
      </View>
      <ChevronRight size={22} color={DK.faint} strokeWidth={2} />
    </PressableScale>
  );
}

// Class chips — local dark equivalent of the shared ClassSelector.js (which stays light
// for other still-light callers). A plain wrapping row, not a horizontal ScrollView: the
// ScrollView variant was found to intermittently fail to paint its Pressable children's
// Text on this RN/Android combo — background/border rendered fine, the label just never
// painted (a real, reproducible platform quirk, not a color/font issue).
function ClassChips({ classes = [], value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
      {classes.map((n) => {
        const on = n === value;
        return (
          <PressableScale
            key={n}
            onPress={() => onChange(n)}
            style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: on ? DK.indigo : DK.hair, backgroundColor: on ? DK.indigo : DK.card }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`Class ${n}`}
          >
            <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: 'Nunito_800ExtraBold', color: on ? '#fff' : DK.muted }}>Class {n}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

// Status pill tones for the lifecycle states — local dark equivalent of AdminTestCard.js.
const TONE = {
  published: { soft: DK.emeraldSoft, ink: DK.emerald },
  draft: { soft: DK.goldSoft, ink: DK.gold },
  archived: { soft: 'rgba(255,255,255,0.08)', ink: DK.faint },
};
function TestCard({ status, title, metas = [], onPress, onMenu }) {
  const tone = TONE[status] || TONE.draft;
  return (
    <PressableScale onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: DK.card, borderWidth: 1, borderColor: DK.hair, borderRadius: 18, paddingVertical: 15, paddingLeft: 16, paddingRight: 12, marginBottom: 12 }} accessibilityLabel={title}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8, backgroundColor: tone.soft, alignSelf: 'flex-start' }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tone.ink }} />
            <T w="xbold" s={11} c={tone.ink} numberOfLines={1} style={{ letterSpacing: 0.2 }}>{cap(status)}</T>
          </View>
          <Pressable onPress={onMenu} hitSlop={12} style={{ padding: 2, marginLeft: 8 }} accessibilityRole="button" accessibilityLabel="More actions">
            <EllipsisVertical size={18} color={DK.faint} strokeWidth={2.2} />
          </Pressable>
        </View>
        <T w="xbold" s={16} c={DK.ink} numberOfLines={2} style={{ letterSpacing: -0.2, marginTop: 9 }}>{title}</T>
        {metas.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 9 }}>
            {metas.map((m, i) => <T key={i} w="bold" s={12} c={DK.muted}>{m}</T>)}
          </View>
        )}
      </View>
      <ChevronRight size={22} color={DK.faint} strokeWidth={2.4} />
    </PressableScale>
  );
}

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
      <SafeAreaView style={{ flex: 1, backgroundColor: DK.canvas }}>
        <StatusBar barStyle="dark-content" backgroundColor={DK.canvas} />
        <AdminHeader title="Tests" subtitle="Pick a class, then a subject" />
        <View style={{ paddingHorizontal: 16, marginTop: 2 }}>
          <AdminSegmented value={mode} onChange={setMode} options={[{ value: 'mock', label: 'Mock Tests' }, { value: 'online', label: 'Online Tests' }]} />
        </View>
        {classes.length > 0 && <ClassChips classes={classes} value={cls} onChange={pickClass} />}
        <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
          <AdminSearchBar value={search} onChangeText={setSearch} placeholder={cls != null ? `Search Class ${cls} subjects…` : 'Search subjects…'} />
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => loadSubjects(cls)} tintColor={DK.indigo} />}>
          {!ready || (subjects.loading && !subjects.list.length) ? (
            <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={DK.indigo} /></View>
          ) : !classes.length ? (
            <CenteredCta title="No tests yet" sub="Create your first mock test — it appears in students’ Practice tab once published." label="Add Test" onPress={addTest} />
          ) : subjects.error ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
              <T w="semi" s={14} c={DK.muted} style={{ textAlign: 'center' }}>{subjects.error}</T>
              <PressableScale onPress={() => loadSubjects(cls)} style={{ borderWidth: 1.5, borderColor: DK.hair, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}>
                <T w="xbold" s={13} c={DK.ink}>Retry</T>
              </PressableScale>
            </View>
          ) : !list.length ? (
            q
              ? <View style={{ paddingVertical: 48, alignItems: 'center' }}><T w="semi" s={14} c={DK.muted} style={{ textAlign: 'center' }}>No Class {cls} subjects match your search.</T></View>
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
        {showFab && <Fab onPress={addTest} accessibilityLabel="Add test" color={DK.indigo} />}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: DK.canvas }}>
      <StatusBar barStyle="dark-content" backgroundColor={DK.canvas} />
      <AdminHeader title={subject.name} subtitle={`Class ${cls} · Mock Tests`} onBack={() => setSubject(null)} />
      <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 }}>
        <ChipRow
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: `All ${counts.all}` },
            { value: 'published', label: `Published ${counts.published}` },
            { value: 'draft', label: `Draft ${counts.draft}` },
            { value: 'archived', label: `Archived ${counts.archived}` },
          ]}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => loadTests(subject.name, cls)} tintColor={DK.indigo} />}>
        {tests.loading ? (
          <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={DK.indigo} /></View>
        ) : tests.error ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
            <T w="semi" s={14} c={DK.muted} style={{ textAlign: 'center' }}>{tests.error}</T>
            <PressableScale onPress={() => loadTests(subject.name, cls)} style={{ borderWidth: 1.5, borderColor: DK.hair, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}>
              <T w="xbold" s={13} c={DK.ink}>Retry</T>
            </PressableScale>
          </View>
        ) : shown.length === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}><T w="semi" s={14} c={DK.muted} style={{ textAlign: 'center' }}>{tab === 'all' ? `No mock tests in Class ${cls} ${subject.name} yet.` : `No ${tab} tests.`}</T></View>
        ) : shown.map((t) => (
          <TestCard
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

      <Fab onPress={addTest} accessibilityLabel="Add test" color={DK.indigo} />

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
