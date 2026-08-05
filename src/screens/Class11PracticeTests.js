// PracticeTestsCards.js (default export: PracticeTestsCards)
// MCQ Practice in the shared artifact-style card UI for EVERY class:
//   subject → chapter → tests (Full Chapter Test + each sub-topic), with
//   "All / Attempted" tabs. Attempts are tracked locally (persisted by McqLoader
//   when a practice quiz finishes) so cards can show a best score + drive the
//   "Attempted" filter.
//
// Subject/chapter sourcing mirrors McqPracticeScreen so behaviour matches:
//   • Class 6 & 9  → subjects are DB-driven (class-subjects endpoint)
//   • Class 6–9,12 → chapters from the API (getChapters)
//   • Class 10/11  → chapters from the static MCQ bank (MCQ_DATA)
//   • sub-topics + availability always come from the API.
//
// Props:
//   onBack()
//   onStartChapter(subjectName, chapterName)
//   onStartSubtopic(subjectName, chapterName, subtopicId)

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, ActivityIndicator, StyleSheet, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Atom, FlaskConical, Sigma, Dna, BookOpen, Search, ListChecks } from 'lucide-react-native';
import { FONT } from '../constants/fonts';
import MCQ_DATA from '../data/mcqPractice';
import { getMcqChaptersWithContent, getMcqSubtopics as apiMcqSubtopics } from '../api/mcqPracticeApi';
import { getChapters } from '../api/resourcesApi';
import { getPracticeAttempts, practiceAttemptKey } from '../utils/storage';
import { useClassSubjects, toTile } from '../utils/classSubjects';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/designSystem';

// Dark reskin of all three levels of this flow (subject list, chapter list, test
// list — the "subject-selection-dark" / "chapter-tests-dark" references), same
// opt-in-per-screen technique as the Practice landing page. This screen no longer
// uses testCardKit at all — that shared kit (Mock Tests, Online Tests, admin
// browse) is left exactly as-is; every level here renders its own local dark UI.
const D = {
  canvas: COLORS.background, card: 'rgba(255,255,255,0.05)',
  ink: COLORS.textPrimary, sub: COLORS.textSecondary, muted: COLORS.textSecondary,
  faint: 'rgba(255,255,255,0.38)', hair: 'rgba(255,255,255,0.10)',
  cyan: '#22D3EE', cyanSoft: 'rgba(34,211,238,0.16)',
  purple: '#C084FC', purpleSoft: 'rgba(192,132,252,0.16)',
  emerald: COLORS.success, indigo: COLORS.primary,
};
// Vector icon + accent per known subject; anything else (Class 6-9's longer,
// varied subject lists) falls back to a generic book icon, alternating the two
// accent tints so the list still reads cleanly.
const SUBJECT_ICON = { Physics: Atom, Chemistry: FlaskConical, Mathematics: Sigma, Biology: Dna };
const SUBJECT_TINTS = [
  { tint: D.cyan, soft: D.cyanSoft },
  { tint: D.purple, soft: D.purpleSoft },
];

const classNum = (c) => parseInt(String(c || '').replace(/\D/g, ''), 10) || null;

// Slugify — MUST stay byte-identical to McqPracticeScreen so API lookups match.
const slugify = (s) => {
  const str = String(s).replace(/[–—­‑]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  const base = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (base && !/[^\x00-\x7F]/.test(str)) return base;
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  const hash = 'u' + h.toString(36);
  return base ? base + '-' + hash : hash;
};
const SUBJECT_SLUG_OVERRIDES = { 'Old - हिंदी': 'old', 'Old - हिंदी ए': 'old-hindi-a', 'Old - हिंदी ब': 'old-hindi-b' };
const subjectSlugOf = (subj) => subj.slug || SUBJECT_SLUG_OVERRIDES[subj.name] || slugify(subj.name);

const DYNAMIC_CLASSES = [6, 9];

// Per-class subject lists (mirror McqPracticeScreen).
const S = (name, emoji) => ({ name, emoji });
const SUBJECTS_SENIOR = [S('Physics', '⚛️'), S('Chemistry', '🧪'), S('Mathematics', '📐'), S('Biology', '🧬')];
const SUBJECTS_CLASS7 = [
  S('Science (Curiosity)', '🔬'), S('Social Science (Exploring Society)', '🌍'), S('हिंदी (मल्हार)', '📖'),
  S('English (Poorvi)', '✍️'), S('Maths (Ganita Prakash)', '📐'), S('Old - Science', '⚗️'),
  S('Reasoning & Mental Ability', '🧠'), S('Old - Maths', '➗'), S('Old - Social Sc', '🏛️'),
  S('Old - हिंदी', '📚'), S('Old - English', '📖'),
];
const SUBJECTS_CLASS8 = [
  S('Science (Curiosity)', '🔬'), S('Social Science (Exploring Society)', '🌍'), S('हिंदी (मल्हार)', '📖'),
  S('English (Poorvi)', '✍️'), S('Maths (Ganita Prakash)', '📐'), S('Old - Science', '⚗️'),
  S('Reasoning & Mental Ability', '🧠'), S('Old - Maths', '➗'), S('Old - Social Sc', '🏛️'),
  S('Old - English', '📖'), S('Old - हिंदी', '📚'),
];
const subjectsForClass = (cl) =>
  cl === 7 ? SUBJECTS_CLASS7 : cl === 8 ? SUBJECTS_CLASS8 : SUBJECTS_SENIOR;

export default function PracticeTestsCards({ onBack, onStartChapter, onStartSubtopic }) {
  const { selectedClass } = useAuth();
  const insets = useSafeAreaInsets();
  const classLevel = classNum(selectedClass) || 11;
  const isDyn = DYNAMIC_CLASSES.includes(classLevel);
  const dynSubs = useClassSubjects(classLevel, isDyn);
  const subjects = isDyn
    ? (dynSubs || []).filter((x) => x.practice).map((x) => toTile(x))
    : subjectsForClass(classLevel).filter((x) => !(classLevel === 12 && x.name === 'Biology'));

  const [subject, setSubject] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [attempts, setAttempts] = useState({});
  const [chapState, setChapState] = useState({ loading: false, names: [] }); // API chapter names (DB classes)
  const [avail, setAvail] = useState({ loading: false, slugs: null, counts: null });
  const [subtopics, setSubtopics] = useState({ loading: false, list: [] });

  // A subject uses the DB chapter list (else the static MCQ bank).
  const usesApiChapters = (subj) =>
    [6, 7, 8, 9].includes(classLevel) ||
    (classLevel === 12 && ['Physics', 'Chemistry', 'Mathematics'].includes(subj.name));

  useEffect(() => {
    let alive = true;
    getPracticeAttempts(classLevel).then((a) => { if (alive) setAttempts(a || {}); }).catch(() => {});
    return () => { alive = false; };
  }, [classLevel]);

  useEffect(() => { setTab('all'); setQuery(''); }, [subject, chapter]);

  // Load the subject's chapters (API for DB classes; MCQ bank otherwise) + which
  // chapters actually have MCQ content (+ counts).
  useEffect(() => {
    if (!subject) return undefined;
    let alive = true;
    setAvail({ loading: true, slugs: null, counts: null });
    getMcqChaptersWithContent(subjectSlugOf(subject), classLevel)
      .then((chs) => {
        if (!alive) return;
        const list = chs || [];
        setAvail({ loading: false, slugs: new Set(list.map((c) => c.slug)), counts: new Map(list.map((c) => [c.slug, c.questionCount || 0])) });
      })
      .catch(() => { if (alive) setAvail({ loading: false, slugs: null, counts: null }); });

    if (usesApiChapters(subject)) {
      setChapState({ loading: true, names: [] });
      getChapters(subjectSlugOf(subject), undefined, classLevel)
        .then((chs) => { if (alive) setChapState({ loading: false, names: (chs || []).map((c) => c.name) }); })
        .catch(() => { if (alive) setChapState({ loading: false, names: [] }); });
    } else {
      setChapState({ loading: false, names: Object.keys(MCQ_DATA[subject.name] || {}) });
    }
    return () => { alive = false; };
  }, [subject, classLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load sub-topics for the chosen chapter.
  useEffect(() => {
    if (!subject || !chapter) return undefined;
    let alive = true;
    setSubtopics({ loading: true, list: [] });
    apiMcqSubtopics(subjectSlugOf(subject), slugify(chapter), classLevel)
      .then((list) => { if (alive) setSubtopics({ loading: false, list: Array.isArray(list) ? list : [] }); })
      .catch(() => { if (alive) setSubtopics({ loading: false, list: [] }); });
    return () => { alive = false; };
  }, [subject, chapter, classLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  const attemptForKey = (subjName, chapName, subtopicId) => attempts[practiceAttemptKey(classLevel, subjName, chapName, subtopicId)];

  // ── Level 1 · subject list (dark — the "subject-selection-dark" reference) ──
  if (!subject) {
    const loadingSubs = isDyn && dynSubs === null;
    return (
      <View style={d.safe}>
        <StatusBar barStyle="light-content" backgroundColor={D.canvas} />
        <View style={[d.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onBack} style={d.backBtn} hitSlop={8} accessibilityLabel="Go back">
            <ChevronLeft size={19} color={D.ink} strokeWidth={2.6} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={d.title}>Practice Questions</Text>
            <Text style={d.subtitle}>Pick a subject, then a chapter</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {loadingSubs ? (
            <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={D.cyan} /></View>
          ) : subjects.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Text style={{ color: D.muted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>No practice subjects yet.</Text>
            </View>
          ) : subjects.map((subj, i) => {
            const Icon = SUBJECT_ICON[subj.name] || BookOpen;
            const { tint, soft } = SUBJECT_TINTS[i % SUBJECT_TINTS.length];
            return (
              <Pressable key={subj.name} style={d.subjectCard} onPress={() => setSubject(subj)}>
                <View style={[d.subjectIcon, { backgroundColor: soft }]}><Icon size={22} color={tint} strokeWidth={2.2} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={d.subjectName}>{subj.name}</Text>
                  <Text style={d.subjectSub}>Chapter-wise practice</Text>
                </View>
                <ChevronRight size={19} color={D.faint} strokeWidth={2.2} />
              </Pressable>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Level 2 · chapter list ──
  if (!chapter) {
    const chapters = avail.slugs ? chapState.names.filter((ch) => avail.slugs.has(slugify(ch))) : chapState.names;
    const cq = query.trim().toLowerCase();
    const shownChs = chapters.filter((ch) => !cq || ch.toLowerCase().includes(cq));
    const loading = chapState.loading || avail.loading;
    return (
      <View style={d.safe}>
        <StatusBar barStyle="light-content" backgroundColor={D.canvas} />
        <View style={[d.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => setSubject(null)} style={d.backBtn} hitSlop={8} accessibilityLabel="Go back">
            <ChevronLeft size={19} color={D.ink} strokeWidth={2.6} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={d.title}>{subject.name}</Text>
            <Text style={d.subtitle}>Pick a chapter to see its practice tests</Text>
          </View>
        </View>
        <View style={d.searchWrap}>
          <Search size={16} color={D.faint} strokeWidth={2.4} />
          <TextInput
            style={d.searchInput}
            placeholder={`Search ${subject.name} chapters…`}
            placeholderTextColor={D.faint}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={D.cyan} /></View>
          ) : shownChs.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Text style={{ color: D.muted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>No chapters available yet.</Text>
            </View>
          ) : shownChs.map((ch, i) => {
            const count = avail.counts ? avail.counts.get(slugify(ch)) : null;
            const done = Object.keys(attempts).filter((key) => key.startsWith(`${classLevel}::${subject.name}::${ch}::`)).length;
            const { tint, soft } = SUBJECT_TINTS[i % SUBJECT_TINTS.length];
            return (
              <Pressable key={ch} style={d.chapterRow} onPress={() => setChapter(ch)}>
                <View style={[d.chapterNum, { backgroundColor: soft }]}><Text style={[d.chapterNumTxt, { color: tint }]}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={d.chapterName} numberOfLines={2}>{ch}</Text>
                  <Text style={d.chapterSub}>{`${count != null ? `${count} questions` : 'Practice'}${done ? ` · ${done} attempted` : ''}`}</Text>
                </View>
                <ChevronRight size={19} color={D.faint} strokeWidth={2.2} />
              </Pressable>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Level 3 · tests for the chosen chapter (Full Chapter + sub-topics) ──
  const chapterCount = avail.counts ? avail.counts.get(slugify(chapter)) : null;
  const tests = [
    { id: 'full', label: 'Full Chapter Test', count: chapterCount, subtopicId: null },
    ...subtopics.list.map((st) => ({ id: `st-${st.id}`, label: st.name, count: st.questionCount, subtopicId: st.id })),
  ];
  const attemptFor = (t) => attemptForKey(subject.name, chapter, t.subtopicId);
  const attemptedCount = tests.filter(attemptFor).length;
  const shown = tests.filter((t) => tab !== 'attempted' || attemptFor(t));

  const start = (t) => {
    if (t.subtopicId == null) onStartChapter(subject.name, chapter);
    else onStartSubtopic(subject.name, chapter, t.subtopicId);
  };

  return (
    <View style={d.safe}>
      <StatusBar barStyle="light-content" backgroundColor={D.canvas} />
      <View style={[d.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => setChapter(null)} style={d.backBtn} hitSlop={8} accessibilityLabel="Go back">
          <ChevronLeft size={19} color={D.ink} strokeWidth={2.6} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={d.title} numberOfLines={1}>{chapter}</Text>
          <Text style={d.subtitle}>{subject.name}</Text>
        </View>
      </View>
      <View style={d.tabRow}>
        {[{ id: 'all', label: 'All Tests', count: tests.length }, { id: 'attempted', label: 'Attempted', count: attemptedCount }].map((t) => {
          const on = tab === t.id;
          return (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={[d.tab, on && d.tabOn]}>
              <Text style={[d.tabTxt, on && d.tabTxtOn]}>{t.label}{t.count != null ? ` (${t.count})` : ''}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {subtopics.loading && (
          <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={D.cyan} /></View>
        )}
        {!subtopics.loading && shown.length === 0 && (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <Text style={{ color: D.muted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>
              {tab === 'attempted' ? 'No attempted tests yet.' : 'No practice tests available.'}
            </Text>
          </View>
        )}
        {!subtopics.loading && shown.map((t) => {
          const att = attemptFor(t);
          const done = !!att;
          return (
            <View key={t.id} style={d.testCard}>
              <View style={[d.statusPill, done ? d.statusPillDone : d.statusPillOpen]}>
                <View style={[d.statusDot, { backgroundColor: done ? D.faint : D.emerald }]} />
                <Text style={[d.statusTxt, { color: done ? D.muted : D.emerald }]}>{done ? 'Completed' : 'Available'}</Text>
              </View>
              <Text style={d.testTitle} numberOfLines={2}>{t.label}</Text>
              {(t.count != null || done) && (
                <View style={d.metaRow}>
                  {t.count != null && (
                    <View style={d.metaItem}>
                      <ListChecks size={13} color={D.muted} strokeWidth={2.4} />
                      <Text style={d.metaTxt}>{t.count} questions</Text>
                    </View>
                  )}
                  {done && <Text style={d.metaTxt}>{att.score}/{att.total}</Text>}
                </View>
              )}
              <Pressable style={[d.actionBtn, done && d.actionBtnGhost]} onPress={() => start(t)}>
                <Text style={[d.actionTxt, done && d.actionTxtGhost]}>{done ? 'Retry' : 'Practice'}</Text>
              </Pressable>
            </View>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// Dark styles for the LEVEL-1 subject list only — level 2/3 above stay on TK/k.
const d = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: D.canvas },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn:     { width: 34, height: 34, borderRadius: 17, backgroundColor: D.card, borderWidth: 1, borderColor: D.hair, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 20, fontWeight: '900', color: D.ink, letterSpacing: -0.4 },
  subtitle:    { fontSize: 12.5, color: D.sub, marginTop: 2, fontWeight: '600' },

  subjectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.card, borderRadius: 18, borderWidth: 1, borderColor: D.hair, padding: 14, marginBottom: 12 },
  subjectIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  subjectName: { fontSize: 16, fontWeight: '800', color: D.ink },
  subjectSub:  { fontSize: 12.5, color: D.muted, marginTop: 2, fontWeight: '600' },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: D.card, borderWidth: 1, borderColor: D.hair, borderRadius: 15, paddingHorizontal: 14, height: 44, marginHorizontal: 16, marginTop: 4 },
  searchInput: { flex: 1, fontSize: 14, color: D.ink, fontWeight: '600', padding: 0 },

  chapterRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: D.card, borderRadius: 14, borderWidth: 1, borderColor: D.hair, padding: 14, marginBottom: 10, gap: 12 },
  chapterNum:     { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  chapterNumTxt:  { fontSize: 13, fontWeight: '800' },
  chapterName:    { fontSize: 14.5, fontWeight: '700', color: D.ink },
  chapterSub:     { fontSize: 12, color: D.muted, marginTop: 2, fontWeight: '600' },

  tabRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 4, marginBottom: 4 },
  tab:         { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12, backgroundColor: D.card, borderWidth: 1, borderColor: D.hair },
  tabOn:       { backgroundColor: D.cyan, borderColor: D.cyan },
  tabTxt:      { fontSize: 12.5, fontWeight: '800', color: D.muted },
  tabTxtOn:    { color: '#08181C' },

  testCard:       { backgroundColor: D.card, borderWidth: 1, borderColor: D.hair, borderRadius: 18, padding: 16, marginBottom: 12, gap: 10 },
  statusPill:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8 },
  statusPillOpen: { backgroundColor: 'rgba(16,185,129,0.14)' },
  statusPillDone: { backgroundColor: 'rgba(255,255,255,0.06)' },
  statusDot:      { width: 6, height: 6, borderRadius: 3 },
  statusTxt:      { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  testTitle:      { fontSize: 16, fontWeight: '800', color: D.ink, letterSpacing: -0.2 },
  metaRow:        { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaItem:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTxt:        { fontSize: 12, fontWeight: '700', color: D.muted },
  actionBtn:      { backgroundColor: D.indigo, borderRadius: 13, paddingVertical: 13, alignItems: 'center' },
  actionBtnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: D.hair },
  actionTxt:      { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  actionTxtGhost: { color: D.ink },
});
