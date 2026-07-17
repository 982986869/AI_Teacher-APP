// src/screens/admin/tests/OnlineTestsBrowser.js
// Admin browse + manage of imported ONLINE tests (ot_tests): Class → Subject → Chapter → Test →
// questions. This is where classes 6–9 (which have online tests, not mock tests) get their test
// content managed. Read-heavy: browse + delete (imported content has no draft/publish). Rendered
// inside the Tests tab under the Mock/Online toggle. Self-contained breadcrumb state.
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable, Alert, RefreshControl } from 'react-native';
import { ChevronRight, EllipsisVertical, Trash2, FileText, CircleCheck } from 'lucide-react-native';
import { FONT } from '../../../constants/fonts';
import { TK, ScreenHeader, SubjectRow, ChapterRow } from '../../../components/testCardKit';
import TestModeToggle from '../../../components/TestModeToggle';
import ClassSelector from '../../../components/ClassSelector';
import { ActionSheet } from '../ui/ActionSheet';
import { apiError, plainText } from '../ui/format';
import {
  getAdminOnlineTestClasses, getAdminOnlineTestSubjects, getAdminOnlineTestChapters,
  getAdminOnlineTests, getAdminOnlineTest, deleteAdminOnlineTest,
} from '../../../api/adminApi';
import { getLastClass, setLastClass } from '../../../utils/lastClass';

const EMOJI = { Physics: '⚛️', Chemistry: '🧪', Mathematics: '📐', Maths: '📐', Biology: '🧬', Science: '🔬', 'Social Science': '🌐', English: '📖', Hindi: '📖' };
const TILE = { Physics: '#E1F5F3', Chemistry: '#FCEBDD', Mathematics: '#E9EBFB', Maths: '#E9EBFB', Biology: '#E7F3E4', Science: '#E7F3E4', English: '#FDF3D6' };
const emojiFor = (name) => EMOJI[name] || (Object.keys(EMOJI).find((k) => (name || '').includes(k)) ? EMOJI[Object.keys(EMOJI).find((k) => (name || '').includes(k))] : '📝');
const tileFor = (name) => TILE[name] || Object.entries(TILE).find(([k]) => (name || '').includes(k))?.[1];
// Some questions/options are IMAGE-based (S3 diagrams) — pull the first image URL so we render it
// instead of a blank row (plainText strips the <img>).
const firstImg = (html) => { const m = String(html || '').match(/<img[^>]+src=["']([^"']+)["']/i); return m ? m[1] : null; };

const Loading = () => <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={TK.mint} /></View>;
const ErrState = ({ msg, onRetry }) => (
  <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
    <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{msg}</Text>
    <Pressable onPress={onRetry} style={{ borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}><Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 13 }}>Retry</Text></Pressable>
  </View>
);
const Empty = ({ msg }) => <View style={{ paddingVertical: 48, alignItems: 'center' }}><Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center', paddingHorizontal: 24 }}>{msg}</Text></View>;

export default function OnlineTestsBrowser({ navigation, mode, setMode }) {
  const [classes, setClasses] = useState([]);
  const [cls, setCls] = useState(null);
  const [ready, setReady] = useState(false);
  // Breadcrumb: [{level:'subjects'} | {level:'chapters',subject} | {level:'tests',subject,chapter} | {level:'detail',test}]
  const [stack, setStack] = useState([{ level: 'subjects' }]);
  const cur = stack[stack.length - 1];
  const [state, setState] = useState({ loading: true, error: '', rows: [] });
  const [detail, setDetail] = useState({ loading: false, error: '', test: null, questions: [] });
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      let list = [];
      try { const d = await getAdminOnlineTestClasses(); list = d?.classes || []; } catch { /* keep [] */ }
      const saved = await getLastClass('online-tests');
      if (!alive) return;
      setClasses(list);
      setCls(saved != null && list.includes(saved) ? saved : (list[0] ?? null));
      setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  const load = useCallback(async () => {
    if (cls == null) { setState({ loading: false, error: '', rows: [] }); return; } // no classes → don't hang
    if (cur.level === 'detail') return; // detail loads separately
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      let rows = [];
      if (cur.level === 'subjects') rows = (await getAdminOnlineTestSubjects(cls))?.subjects || [];
      else if (cur.level === 'chapters') rows = (await getAdminOnlineTestChapters(cur.subject.slug, cls))?.chapters || [];
      else rows = (await getAdminOnlineTests({ class: cls, subject: cur.subject.slug, chapter: cur.chapter.slug }))?.rows || [];
      setState({ loading: false, error: '', rows });
    } catch (e) { setState({ loading: false, error: apiError(e), rows: [] }); }
  }, [cls, cur]);
  useEffect(() => { if (ready) load(); }, [ready, load]);

  const openDetail = async (t) => {
    setStack((s) => [...s, { level: 'detail', test: t }]);
    setDetail({ loading: true, error: '', test: null, questions: [] });
    try { const d = await getAdminOnlineTest(t.id); setDetail({ loading: false, error: '', test: d?.test || null, questions: d?.questions || [] }); }
    catch (e) { setDetail({ loading: false, error: apiError(e), test: null, questions: [] }); }
  };

  const back = () => { if (stack.length > 1) setStack((s) => s.slice(0, -1)); };
  const pickClass = (n) => { if (n === cls) return; setCls(n); setLastClass('online-tests', n); setStack([{ level: 'subjects' }]); };

  const confirmDelete = (t) => Alert.alert('Delete online test?', `This permanently deletes “${t.name}” and its questions. This cannot be undone.`,
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteAdminOnlineTest(t.id).then(load).catch((e) => Alert.alert('Could not delete', apiError(e))) }]);

  // ── DETAIL ──
  if (cur.level === 'detail') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
        <ScreenHeader title={cur.test.name} subtitle={cls != null ? `Class ${cls} · Online Test` : 'Online Test'} onBack={back} />
        {detail.loading ? <Loading /> : detail.error ? <ErrState msg={detail.error} onRetry={() => openDetail(cur.test)} /> : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Text style={{ color: TK.textMuted, fontFamily: FONT.extrabold, fontSize: 12, letterSpacing: 0.4, marginBottom: 10 }}>
              {detail.questions.length} {detail.questions.length === 1 ? 'QUESTION' : 'QUESTIONS'}{detail.test?.durationMin ? `  ·  ${detail.test.durationMin} MIN` : ''}{detail.test?.totalMarks ? `  ·  ${detail.test.totalMarks} MARKS` : ''}
            </Text>
            {detail.questions.map((q, i) => {
              const opts = Array.isArray(q.options) ? q.options : [];
              return (
                <View key={q.id || i} style={{ backgroundColor: TK.card, borderRadius: 14, borderWidth: 1, borderColor: TK.border, padding: 13, marginBottom: 10 }}>
                  {(() => { const qt = plainText(q.questionHtml); const qi = firstImg(q.questionHtml); return (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ color: TK.text, fontFamily: FONT.bold, fontSize: 14 }}>{i + 1}. {qt || (qi ? '' : '—')}</Text>
                      {!!qi && <Image source={{ uri: qi }} style={{ width: '70%', height: 120, marginTop: 6, borderRadius: 8, backgroundColor: '#fff' }} resizeMode="contain" />}
                    </View>
                  ); })()}
                  {opts.map((o, oi) => {
                    const correct = String(o.id) === String(q.correctOptionId);
                    const ot = plainText(o.html); const oi2 = firstImg(o.html);
                    return (
                      <View key={`${o.id ?? 'o'}-${oi}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: correct ? '#E7F7EE' : TK.bg, borderRadius: 9, borderWidth: 1, borderColor: correct ? '#16A34A' : TK.border, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 5 }}>
                        <View style={{ flex: 1 }}>
                          {ot ? <Text style={{ color: correct ? '#15803D' : TK.text, fontFamily: correct ? FONT.bold : FONT.semibold, fontSize: 12.5 }}>{ot}</Text>
                            : oi2 ? <Image source={{ uri: oi2 }} style={{ width: 96, height: 56, borderRadius: 6, backgroundColor: '#fff' }} resizeMode="contain" />
                            : <Text style={{ color: TK.textMuted, fontFamily: FONT.semibold, fontSize: 12.5 }}>—</Text>}
                        </View>
                        {correct && <CircleCheck size={15} color="#16A34A" strokeWidth={2.4} />}
                      </View>
                    );
                  })}
                  {!!plainText(q.explanationHtml) && <Text style={{ color: TK.textMuted, fontFamily: FONT.semibold, fontSize: 11.5, marginTop: 4 }}>Why: {plainText(q.explanationHtml)}</Text>}
                </View>
              );
            })}
            {!detail.questions.length && <Empty msg="This test has no questions." />}
            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ── BROWSE (subjects / chapters / tests) ──
  const title = cur.level === 'subjects' ? 'Tests' : cur.level === 'chapters' ? cur.subject.name : cur.chapter.name;
  const subtitle = cur.level === 'subjects' ? 'Pick a class, then a subject' : cur.level === 'chapters' ? `Class ${cls} · Chapters` : `Class ${cls} · ${cur.subject.name}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
      <ScreenHeader title={title} subtitle={subtitle} onBack={cur.level === 'subjects' ? undefined : back} />
      {cur.level === 'subjects' && <TestModeToggle mode={mode} onChange={setMode} />}
      {cur.level === 'subjects' && classes.length > 0 && <ClassSelector classes={classes} value={cls} onChange={pickClass} />}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={TK.mint} />}>
        {!ready || state.loading ? <Loading />
          : state.error ? <ErrState msg={state.error} onRetry={load} />
          : !state.rows.length ? <Empty msg={cur.level !== 'subjects' ? 'Nothing here yet.' : cls == null ? 'No online tests found.' : `No online tests for Class ${cls}.`} />
          : cur.level === 'subjects' ? state.rows.map((s) => (
              <SubjectRow key={`${s.slug}|${s.name}`} emoji={emojiFor(s.name)} tile={tileFor(s.name)} name={s.name}
                sub={`Class ${cls}  ·  ${s.testCount} ${s.testCount === 1 ? 'test' : 'tests'}  ·  ${s.chapterCount} ${s.chapterCount === 1 ? 'chapter' : 'chapters'}`}
                onPress={() => setStack((st) => [...st, { level: 'chapters', subject: s }])} />
            ))
          : cur.level === 'chapters' ? state.rows.map((c, i) => (
              <ChapterRow key={`${c.slug}|${i}`} index={i + 1} name={c.name} sub={`${c.testCount} ${c.testCount === 1 ? 'test' : 'tests'}`}
                onPress={() => setStack((st) => [...st, { level: 'tests', subject: cur.subject, chapter: c }])} />
            ))
          : state.rows.map((t) => (
              <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: TK.card, borderRadius: 14, borderWidth: 1, borderColor: TK.border, marginBottom: 10, overflow: 'hidden' }}>
                <Pressable onPress={() => openDetail(t)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: TK.mintSoft, alignItems: 'center', justifyContent: 'center' }}><FileText size={19} color={TK.mint} strokeWidth={2.3} /></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: TK.text, fontFamily: FONT.bold, fontSize: 14 }}>{t.name}</Text>
                    <Text style={{ color: TK.textMuted, fontFamily: FONT.semibold, fontSize: 11.5, marginTop: 2 }}>{t.questionCount} {t.questionCount === 1 ? 'question' : 'questions'}  ·  {t.durationMin || 0} min{t.totalMarks ? `  ·  ${t.totalMarks} marks` : ''}</Text>
                  </View>
                  <ChevronRight size={17} color={TK.textMuted} />
                </Pressable>
                <Pressable onPress={() => setMenu(t)} hitSlop={8} style={{ paddingHorizontal: 10, paddingVertical: 14 }}><EllipsisVertical size={18} color={TK.textMuted} /></Pressable>
              </View>
            ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      <ActionSheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.name} message="Online test"
        options={menu ? [{ key: 'del', label: 'Delete test', sub: 'Remove it and its questions', icon: Trash2, danger: true, onPress: () => confirmDelete(menu) }] : []} />
    </SafeAreaView>
  );
}
