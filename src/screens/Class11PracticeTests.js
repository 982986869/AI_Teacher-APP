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
import { View, Text, ScrollView, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import MCQ_DATA from '../data/mcqPractice';
import { getMcqChaptersWithContent, getMcqSubtopics as apiMcqSubtopics } from '../api/mcqPracticeApi';
import { getChapters } from '../api/resourcesApi';
import { getPracticeAttempts, practiceAttemptKey } from '../utils/storage';
import { useClassSubjects, toTile } from '../utils/classSubjects';
import { useAuth } from '../context/AuthContext';
import { TK, ScreenHeader, FilterTabs, SearchBox, SubjectRow, ChapterRow, TestCard } from '../components/testCardKit';

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

const TINTS = ['#E1F5F3', '#FCEBDD', '#E9EBFB', '#E7F3E4', '#FBE9F0', '#EAF0FB', '#FCEFD6', '#E6F7F1'];

const EmptyMsg = ({ text }) => (
  <View style={{ paddingVertical: 48, alignItems: 'center' }}>
    <Text style={{ color: TK.textMuted, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>{text}</Text>
  </View>
);
const Loading = () => (
  <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={TK.mint} /></View>
);

export default function PracticeTestsCards({ onBack, onStartChapter, onStartSubtopic }) {
  const { selectedClass } = useAuth();
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

  // ── Level 1 · subject list ──
  if (!subject) {
    const loadingSubs = isDyn && dynSubs === null;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
        <ScreenHeader title="Practice Questions" subtitle="Pick a subject, then a chapter" onBack={onBack} />
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {loadingSubs ? <Loading /> : subjects.length === 0 ? (
            <EmptyMsg text="No practice subjects yet." />
          ) : subjects.map((subj, i) => (
            <SubjectRow key={subj.name} emoji={subj.emoji} tile={TINTS[i % TINTS.length]} name={subj.name} sub="Chapter-wise practice" onPress={() => setSubject(subj)} />
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Level 2 · chapter list ──
  if (!chapter) {
    const chapters = avail.slugs ? chapState.names.filter((ch) => avail.slugs.has(slugify(ch))) : chapState.names;
    const cq = query.trim().toLowerCase();
    const shownChs = chapters.filter((ch) => !cq || ch.toLowerCase().includes(cq));
    const loading = chapState.loading || avail.loading;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
        <ScreenHeader title={subject.name} subtitle="Pick a chapter to see its practice tests" onBack={() => setSubject(null)} />
        <SearchBox value={query} onChangeText={setQuery} placeholder={`Search ${subject.name} chapters…`} />
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {loading ? <Loading /> : shownChs.length === 0 ? (
            <EmptyMsg text="No chapters available yet." />
          ) : shownChs.map((ch, i) => {
            const count = avail.counts ? avail.counts.get(slugify(ch)) : null;
            const done = Object.keys(attempts).filter((key) => key.startsWith(`${classLevel}::${subject.name}::${ch}::`)).length;
            return (
              <ChapterRow
                key={ch}
                index={i + 1}
                name={ch}
                sub={`${count != null ? `${count} questions` : 'Practice'}${done ? ` · ${done} attempted` : ''}`}
                onPress={() => setChapter(ch)}
              />
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
      <ScreenHeader title={chapter} subtitle={subject.name} onBack={() => setChapter(null)} />
      <FilterTabs
        tab={tab}
        onChange={setTab}
        tabs={[{ id: 'all', label: 'All', count: tests.length }, { id: 'attempted', label: 'Attempted', count: attemptedCount }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {subtopics.loading && <Loading />}
        {!subtopics.loading && shown.length === 0 && (
          <EmptyMsg text={tab === 'attempted' ? 'No attempted tests yet.' : 'No practice tests available.'} />
        )}
        {!subtopics.loading && shown.map((t) => {
          const att = attemptFor(t);
          const done = !!att;
          const pct = done ? Math.round(att.percent || 0) : null;
          return (
            <TestCard
              key={t.id}
              done={done}
              title={t.label}
              metas={t.count != null ? [`\u{1F4DD} ${t.count} questions`] : []}
              scoreText={done ? `${att.score}/${att.total}` : null}
              scorePct={pct}
              actionLabel={done ? 'Retry' : 'Practice'}
              onPress={() => start(t)}
            />
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
