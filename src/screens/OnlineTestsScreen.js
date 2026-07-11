// OnlineTestsScreen.js
// Online Tests: pick a subject (Physics / Chemistry / Maths / Biology),
// then a chapter (from the offline banks) -> opens the test.
// Pastel mint & peach theme.
//
// Props:
//   onBack()                              -> close
//   onStartTest({ subject, chapterId, chapterName, questions })
//
// NOTE: imports all four banks. All four bank files + their data folders must
// exist in src/data. If you haven't added a subject yet, comment out its import
// and its entry in SUBJECTS below.

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar, SafeAreaView, ActivityIndicator, TextInput } from 'react-native';

import { chapterList as physicsChapters, getQuestions as getPhysics, htmlToText } from '../data/questionBank';
import { chapterList as chemChapters,    getQuestions as getChem }    from '../data/chemistryBank';
import { chapterList as mathsChapters,   getQuestions as getMaths }   from '../data/mathsBank';
import { chapterList as bioChapters,     getQuestions as getBio }     from '../data/biologyBank';
import { getChapters, getQuestionsByPath } from '../api/resourcesApi';
import { getOnlineTestAttempts } from '../utils/storage';

const LETTERS = 'ABCDEFGHIJ'.split('');

// Map a DB online-test question (questionHtml + options:[{idx,html,is_correct}])
// to the normalized shape TestQuestionScreen renders (plain text, letter answer).
const normalizeApiQuestion = (q) => {
  const opts = Array.isArray(q.options) ? q.options : [];
  const options = opts.map((o, i) => ({ key: o.idx || LETTERS[i], label: htmlToText(o.html || ''), optionId: null }));
  let correctAnswer = q.correctOption || null;
  if (!correctAnswer) { const ci = opts.findIndex((o) => o.is_correct); if (ci >= 0) correctAnswer = opts[ci].idx || LETTERS[ci]; }
  return {
    id: q.id,
    text: htmlToText(q.questionHtml || ''),
    difficulty: null,
    options,
    correctAnswer,
    explanation: htmlToText(q.solutionHtml || ''),
  };
};

// ---- app theme (matches PracticeScreen / TestQuestionScreen) ----
// White headers, near-black ink, neutral greys, teal brand accent.
const C = {
  bg: '#F7F7F7',
  card: '#FFFFFF',
  border: '#E8E8E8',
  text: '#1C1C1E',
  textMuted: '#6B6B70',
  mint: '#0FA39A',        // brand accent (teal)
  mintInk: '#0A7D75',     // darker teal for text on tints
  mintSoft: '#E1F5F3',    // accent tint
  peach: '#0FA39A',
  peachSoft: '#E1F5F3',
  sand: '#F0F0F0',
  sandSoft: '#F0F0F0',
  lilacSoft: '#F0F0F0',
  headerMint: '#FFFFFF',  // header is white now (app style)
};

// On Class 12, Physics, Chemistry & Maths online tests come from the DB (the
// `online12` flag routes the chapter list + questions through the API, then splits
// them into 5 generic tests). `apiSlug` is the DB subject slug ('mathematics' for
// Maths). Other subjects (and Class 11) stay on the generic offline banks.
const buildSubjects = (selectedClass, c12, c6Maths) => {
  // Class 6 Maths (Ganita Prakash) online tests are DB-backed (online12 API path).
  // Science (OLD) has no online_test data, so it is not listed here.
  if (selectedClass === 'Class 6') {
    return [
      { key: 'maths-ganita-prakash', apiSlug: 'maths-ganita-prakash', name: 'Maths (Ganita Prakash)', emoji: '\u{1F4D0}', tile: C.sandSoft, chapters: c6Maths, getQuestions: null, online12: true },
    ];
  }
  const isC12 = selectedClass === 'Class 12';
  const phys = isC12
    ? { chapters: c12.physics, getQuestions: null, online12: true }
    : { chapters: physicsChapters, getQuestions: getPhysics };
  const chem = isC12
    ? { chapters: c12.chemistry, getQuestions: null, online12: true }
    : { chapters: chemChapters, getQuestions: getChem };
  const maths = isC12
    ? { chapters: c12.maths, getQuestions: null, online12: true }
    : { chapters: mathsChapters, getQuestions: getMaths };
  return [
    { key: 'physics',   apiSlug: 'physics',     name: 'Physics',   emoji: '\u269B\uFE0F', tile: C.mintSoft,  chapters: phys.chapters, getQuestions: phys.getQuestions, online12: phys.online12 },
    { key: 'chemistry', apiSlug: 'chemistry',   name: 'Chemistry', emoji: '\u{1F9EA}',    tile: C.peachSoft, chapters: chem.chapters, getQuestions: chem.getQuestions, online12: chem.online12 },
    { key: 'maths',     apiSlug: 'mathematics', name: 'Maths',     emoji: '\u{1F4D0}',    tile: C.sandSoft,  chapters: maths.chapters, getQuestions: maths.getQuestions, online12: maths.online12 },
    // Biology is not offered in Class 12 (PCM stream) \u2014 only list it for other classes.
    ...(isC12 ? [] : [{ key: 'biology', apiSlug: 'biology', name: 'Biology', emoji: '\u{1F9EC}', tile: C.lilacSoft, chapters: bioChapters, getQuestions: getBio }]),
  ];
};

// ── CLASS 11 · Online Tests (subject-wise, artifact-style chapter cards) ───────
// Keep the four subjects separate (pick a subject first, like before); inside a
// subject each chapter becomes an artifact-style card with two filter tabs on
// top: "All" and "Attempted". Attempts are read from local storage (persisted by
// PracticeScreen when a test is submitted); an attempted chapter shows its best
// score + a Retake action, otherwise Attempt.
const C11_SUBJECTS = [
  { key: 'physics',   name: 'Physics',   color: '#0FA39A', emoji: '⚛️', tile: '#E1F5F3', chapters: physicsChapters, getQuestions: getPhysics },
  { key: 'chemistry', name: 'Chemistry', color: '#E8703A', emoji: '\u{1F9EA}',    tile: '#FCEBDD', chapters: chemChapters,    getQuestions: getChem },
  { key: 'maths',     name: 'Maths',     color: '#5A67E8', emoji: '\u{1F4D0}',    tile: '#E9EBFB', chapters: mathsChapters,   getQuestions: getMaths },
  { key: 'biology',   name: 'Biology',   color: '#5AA84F', emoji: '\u{1F9EC}',    tile: '#E7F3E4', chapters: bioChapters,     getQuestions: getBio },
];

// Colour a completion percentage: green (strong) · amber (mid) · red (weak).
// Matches the app's result-screen semantics.
const scoreColor = (pct) => (pct >= 75 ? '#22B07A' : pct >= 40 ? '#F5A623' : '#F0564B');

// Offline-bank chapters are a single flat question list, so we synthesise
// several tests per chapter by chunking (TEST_SIZE questions each).
const TEST_SIZE = 25;
const testCountOf = (count) => Math.max(1, Math.ceil((count || 0) / TEST_SIZE));

function Class11OnlineTests({ onBack, onStartTest }) {
  const [subject, setSubject] = useState(null); // chosen subject or null (subject list)
  const [chapter, setChapter] = useState(null); // chosen chapter or null (chapter list)
  const [tab, setTab] = useState('all');        // 'all' | 'attempted'
  const [query, setQuery] = useState('');
  const [attempts, setAttempts] = useState({}); // key -> { score, total, percent, ... }

  // Re-read on mount (the screen remounts each time it's reopened after a test).
  useEffect(() => {
    let alive = true;
    getOnlineTestAttempts(11).then((a) => { if (alive) setAttempts(a || {}); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Reset the filter/search whenever the subject or chapter changes.
  useEffect(() => { setTab('all'); setQuery(''); }, [subject, chapter]);

  const attemptForKey = (subjName, chapterId, testId) => attempts[`11:${subjName}:${chapterId}:${testId}`];
  const subjectAttempts = (subjName) => Object.keys(attempts).filter((k) => k.startsWith(`11:${subjName}:`)).length;

  // ── Level 1 · subject list (subjects stay separate, like before) ──
  if (!subject) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.headerMint} />
        <View style={s.header}>
          <Pressable onPress={onBack} style={s.backRow} hitSlop={8}>
            <Text style={s.backArrow}>{'←'}</Text>
            <Text style={s.backText}>Back</Text>
          </Pressable>
          <Text style={s.title}>Online Tests</Text>
          <Text style={s.subtitle}>Pick a subject, then a chapter</Text>
        </View>
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {C11_SUBJECTS.map((subj) => {
            const done = subjectAttempts(subj.name);
            return (
              <Pressable key={subj.key} style={s.subjectCard} onPress={() => setSubject(subj)}>
                <View style={[s.subjectIcon, { backgroundColor: subj.tile }]}>
                  <Text style={s.subjectEmoji}>{subj.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.subjectName}>{subj.name}</Text>
                  <Text style={s.subjectSub}>
                    {subj.chapters.length} chapters{done ? ` · ${done} tests attempted` : ''}
                  </Text>
                </View>
                <Text style={s.chevron}>{'›'}</Text>
              </Pressable>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Level 2 · chapter list for the chosen subject ──
  if (!chapter) {
    const cq = query.trim().toLowerCase();
    const chs = subject.chapters.filter((ch) => !cq || String(ch.name || '').toLowerCase().includes(cq));
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.headerMint} />
        <View style={s.header}>
          <Pressable onPress={() => setSubject(null)} style={s.backRow} hitSlop={8}>
            <Text style={s.backArrow}>{'←'}</Text>
            <Text style={s.backText}>Back</Text>
          </Pressable>
          <Text style={s.title}>{subject.name}</Text>
          <Text style={s.subtitle}>{subject.chapters.length} chapters · pick one to see its tests</Text>
        </View>

        <View style={f.searchWrap}>
          <View style={f.search}>
            <Text style={f.searchIcon}>{'\u{1F50D}'}</Text>
            <TextInput
              style={f.searchInput}
              placeholder={`Search ${subject.name} chapters…`}
              placeholderTextColor={C.textMuted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {chs.length === 0 && (
            <View style={{ paddingVertical: 56, alignItems: 'center' }}>
              <Text style={{ color: C.textMuted, fontSize: 14, fontWeight: '600' }}>No chapters found.</Text>
            </View>
          )}
          {chs.map((ch, i) => {
            const nTests = testCountOf(ch.count);
            const done = Array.from({ length: nTests }, (_, ti) => ti)
              .filter((ti) => attemptForKey(subject.name, ch.id, ti)).length;
            return (
              <Pressable key={`${ch.id}-${i}`} style={s.chapterRow} onPress={() => setChapter(ch)}>
                <View style={s.chapterNum}><Text style={s.chapterNumTxt}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.chapterName}>{ch.name || `Chapter ${ch.id}`}</Text>
                  <Text style={s.chapterSub}>{nTests} test{nTests > 1 ? 's' : ''}{done ? ` · ${done} attempted` : ''}</Text>
                </View>
                <Text style={s.chevron}>{'›'}</Text>
              </Pressable>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Level 3 · tests for the chosen chapter (artifact-style cards) ──
  const allQs = subject.getQuestions(chapter.id) || [];
  const nTests = Math.max(1, Math.ceil(allQs.length / TEST_SIZE));
  const tests = Array.from({ length: nTests }, (_, i) => {
    const questions = allQs.slice(i * TEST_SIZE, (i + 1) * TEST_SIZE);
    return { id: `${chapter.id}:${i}`, testId: i, label: `Test ${i + 1}`, count: questions.length, questions };
  });

  const attemptFor = (t) => attemptForKey(subject.name, chapter.id, t.testId);
  const attemptedCount = tests.filter(attemptFor).length;
  const shown = tests.filter((t) => tab !== 'attempted' || attemptFor(t));

  const start = (t) => onStartTest({
    subject: subject.name,
    subjectKey: subject.key,
    chapterId: chapter.id,
    testId: t.testId,
    chapterName: `${chapter.name || `Chapter ${chapter.id}`} — ${t.label}`,
    questions: t.questions,
  });

  const Tab = ({ id, label, n }) => (
    <Pressable onPress={() => setTab(id)} style={[f.tab, tab === id && f.tabOn]}>
      <Text style={[f.tabTxt, tab === id && f.tabTxtOn]}>{label}</Text>
      <Text style={[f.tabCount, tab === id && f.tabCountOn]}>{n}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.headerMint} />
      <View style={s.header}>
        <Pressable onPress={() => setChapter(null)} style={s.backRow} hitSlop={8}>
          <Text style={s.backArrow}>{'←'}</Text>
          <Text style={s.backText}>Back</Text>
        </Pressable>
        <Text style={s.title} numberOfLines={1}>{chapter.name || `Chapter ${chapter.id}`}</Text>
        <Text style={s.subtitle}>{nTests} test{nTests > 1 ? 's' : ''} · {subject.name}</Text>
      </View>

      {/* All / Attempted tabs on top */}
      <View style={[f.tabs, { paddingTop: 14 }]}>
        <Tab id="all" label="All" n={tests.length} />
        <Tab id="attempted" label="Attempted" n={attemptedCount} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {shown.length === 0 && (
          <View style={{ paddingVertical: 56, alignItems: 'center' }}>
            <Text style={{ color: C.textMuted, fontSize: 14, fontWeight: '600' }}>
              {tab === 'attempted' ? 'No attempted tests yet.' : 'No tests available.'}
            </Text>
          </View>
        )}
        {shown.map((t) => {
          const att = attemptFor(t);
          const done = !!att;
          const pct = done ? Math.round((att.percent || 0)) : 0;
          return (
            <View key={t.id} style={f.card}>
              <View style={f.cardMain}>
                <View style={f.cardHeadRow}>
                  <View style={[f.status, done ? f.statusDone : f.statusOpen]}>
                    <View style={[f.statusDot, { backgroundColor: done ? C.textMuted : C.mint }]} />
                    <Text style={[f.statusTxt, { color: done ? C.textMuted : C.mintInk }]}>
                      {done ? 'Completed' : 'Available'}
                    </Text>
                  </View>
                  {done && (
                    <View style={f.score}>
                      <Text style={[f.scoreVal, { color: scoreColor(pct) }]}>{att.score}/{att.total}</Text>
                    </View>
                  )}
                </View>

                <Text style={f.cardTitle} numberOfLines={1}>{t.label}</Text>

                <View style={f.metaRow}>
                  <Text style={f.meta}>{'\u{1F4DD}'} {t.count} questions</Text>
                  <Text style={f.meta}>{'⏱'} {Math.max(5, t.count)} min</Text>
                </View>
              </View>

              <Pressable
                style={[f.btn, done ? f.btnGhost : f.btnAttempt]}
                onPress={() => start(t)}
                disabled={t.count === 0}
              >
                <Text style={done ? f.btnGhostTxt : f.btnAttemptTxt}>{done ? 'Retake' : 'Attempt'}</Text>
              </Pressable>
            </View>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function OnlineTestsScreen({ onBack, onStartTest = () => {}, selectedClass }) {
  // Class 11 gets the flat, artifact-style card list (All / Attempted tabs on
  // top). Other classes (10, 12) keep the subject → chapter → test drill-down.
  if (selectedClass === 'Class 11') {
    return <Class11OnlineTests onBack={onBack} onStartTest={onStartTest} />;
  }
  return <OnlineTestsDrillDown onBack={onBack} onStartTest={onStartTest} selectedClass={selectedClass} />;
}

function OnlineTestsDrillDown({ onBack, onStartTest = () => {}, selectedClass }) {
  const [subject, setSubject] = useState(null);
  const [chapter, setChapter] = useState(null); // chosen chapter -> show its 5 tests

  // Class 12 Physics online tests are DB-backed: chapter list + per-chapter
  // questions are fetched from the API and normalized for TestQuestionScreen.
  const isClass12 = selectedClass === 'Class 12';
  const classNum = parseInt(String(selectedClass).replace(/\D/g, ''), 10) || 11;
  const [c12Chapters, setC12Chapters] = useState({ physics: [], chemistry: [], maths: [] });
  const [c6Maths, setC6Maths] = useState([]);
  const [apiQuestions, setApiQuestions] = useState({ loading: false, list: [] });
  const SUBJECTS = buildSubjects(selectedClass, c12Chapters, c6Maths);

  useEffect(() => {
    if (!isClass12) { setC12Chapters({ physics: [], chemistry: [], maths: [] }); return undefined; }
    let alive = true;
    const norm = (chs) => (chs || []).map((c) => ({ id: c.slug, name: c.name, slug: c.slug }));
    Promise.all([
      getChapters('physics', 'online_test', 12).catch(() => []),
      getChapters('chemistry', 'online_test', 12).catch(() => []),
      getChapters('mathematics', 'online_test', 12).catch(() => []),
    ]).then(([p, c, m]) => { if (alive) setC12Chapters({ physics: norm(p), chemistry: norm(c), maths: norm(m) }); });
    return () => { alive = false; };
  }, [isClass12]);

  // Class 6 Maths (Ganita Prakash) online-test chapters (DB-backed).
  useEffect(() => {
    if (selectedClass !== 'Class 6') { setC6Maths([]); return undefined; }
    let alive = true;
    const norm = (chs) => (chs || []).map((c) => ({ id: c.slug, name: c.name, slug: c.slug }));
    getChapters('maths-ganita-prakash', 'online_test', 6)
      .then((chs) => { if (alive) setC6Maths(norm(chs)); })
      .catch(() => { if (alive) setC6Maths([]); });
    return () => { alive = false; };
  }, [selectedClass]);

  useEffect(() => {
    if (!subject?.online12 || !chapter) return undefined;
    let alive = true;
    setApiQuestions({ loading: true, list: [] });
    getQuestionsByPath(subject.apiSlug, chapter.slug, 'online_test', classNum)
      .then((qs) => { if (alive) setApiQuestions({ loading: false, list: (qs || []).map(normalizeApiQuestion) }); })
      .catch(() => { if (alive) setApiQuestions({ loading: false, list: [] }); });
    return () => { alive = false; };
  }, [subject, chapter]);

  const Header = ({ title, subtitle }) => (
    <View style={s.header}>
      <Pressable onPress={chapter ? () => setChapter(null) : (subject ? () => setSubject(null) : onBack)} style={s.backRow} hitSlop={8}>
        <Text style={s.backArrow}>{'\u2190'}</Text>
        <Text style={s.backText}>Back</Text>
      </Pressable>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
    </View>
  );

  // ---- subject list ----
  if (!subject) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.headerMint} />
        <Header title="Online Tests" subtitle="Pick a subject, then a chapter" />
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {SUBJECTS.map((subj, si) => (
            <Pressable key={`${subj.key}-${si}`} style={s.subjectCard} onPress={() => setSubject(subj)}>
              <View style={[s.subjectIcon, { backgroundColor: subj.tile }]}>
                <Text style={s.subjectEmoji}>{subj.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.subjectName}>{subj.name}</Text>
                <Text style={s.subjectSub}>{subj.chapters.length} chapters</Text>
              </View>
              <Text style={s.chevron}>{'\u203A'}</Text>
            </Pressable>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---- 5 tests for the chosen chapter ----
  if (chapter) {
    // Class 12 Physics: questions fetched from the API; others from the bank.
    if (subject.online12 && apiQuestions.loading) {
      return (
        <SafeAreaView style={s.safe}>
          <StatusBar barStyle="dark-content" backgroundColor={C.headerMint} />
          <Header title={chapter.name} subtitle="Select an online test to explore" />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={C.mint} />
            <Text style={{ color: C.textMuted, fontSize: 13 }}>Loading tests…</Text>
          </View>
        </SafeAreaView>
      );
    }
    const shortName = chapter.name.length > 26 ? chapter.name.slice(0, 24) + '\u2026' : chapter.name;
    // DB-backed (Class 12 Physics/Chemistry/Maths) pulls the chapter's questions
    // from the API; offline subjects use their bank. All of a chapter's questions
    // are merged into a SINGLE test (no 5-way split).
    const all = subject.online12 ? apiQuestions.list : (subject.getQuestions(chapter.id) || []);
    const tests = all.length ? [{ label: `${shortName} Test`, questions: all }] : [];
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.headerMint} />
        <Header title={chapter.name} subtitle="Start the chapter test" />
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {tests.length === 0 && (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Text style={{ color: C.textMuted, fontSize: 14 }}>No questions available yet.</Text>
            </View>
          )}
          {tests.map((t, ti) => (
            <Pressable
              key={ti}
              style={s.testRow}
              onPress={() => onStartTest({
                subject: subject.name,
                chapterId: chapter.id,
                chapterName: t.label,
                questions: t.questions,
              })}
            >
              <View style={s.testIcon}><Text style={s.testIconTxt}>{'\u{1F4DD}'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.testName}>{t.label}</Text>
                <Text style={s.testSub}>{t.questions.length} questions</Text>
              </View>
              <Text style={s.chevron}>{'\u203A'}</Text>
            </Pressable>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---- chapter list for the chosen subject ----
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.headerMint} />
      <Header title={subject.name} subtitle={`${subject.chapters.length} chapters \u00B7 tap one to start`} />
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {subject.chapters.map((ch, i) => (
          <Pressable
            key={`${ch.id}-${i}`}
            style={s.chapterRow}
            onPress={() => setChapter({
              id: ch.id,
              name: ch.name || ch.chapter_name || ch.chapterName || ch.title || `Chapter ${i + 1}`,
              slug: ch.slug,
              count: ch.count,
            })}
          >
            <View style={s.chapterNum}><Text style={s.chapterNumTxt}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.chapterName}>{ch.name || ch.chapter_name || ch.chapterName || ch.title || `Chapter ${i + 1}`}</Text>
              <Text style={s.chapterSub}>{ch.count != null ? `${ch.count} questions` : 'Online test'}</Text>
            </View>
            <Text style={s.chevron}>{'\u203A'}</Text>
          </Pressable>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.headerMint, paddingTop: 48, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1.5, borderBottomColor: C.border },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backArrow: { fontSize: 20, color: C.text, marginRight: 8, fontWeight: '700' },
  backText: { fontSize: 16, color: C.text, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13.5, color: C.textMuted, marginTop: 4, fontWeight: '600' },

  body: { padding: 16 },

  subjectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 12 },
  subjectIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  subjectEmoji: { fontSize: 26 },
  subjectName: { fontSize: 17, fontWeight: '800', color: C.text },
  subjectSub: { fontSize: 12.5, color: C.textMuted, marginTop: 2, fontWeight: '600' },

  chapterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
  chapterNum: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  chapterNumTxt: { fontSize: 13, fontWeight: '800', color: C.mintInk },
  chapterName: { fontSize: 14.5, fontWeight: '700', color: C.text },
  chapterSub: { fontSize: 12, color: C.textMuted, marginTop: 2, fontWeight: '600' },

  testRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
  testIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  testIconTxt: { fontSize: 18 },
  testName: { fontSize: 14.5, fontWeight: '700', color: C.text },
  testSub: { fontSize: 12, color: C.textMuted, marginTop: 2, fontWeight: '600' },

  chevron: { fontSize: 24, color: '#C7C7CC', fontWeight: '400', marginLeft: 8 },
});

// ── flat Class-11 card list styles ────────────────────────────────────────────
const f = StyleSheet.create({
  searchWrap: { paddingHorizontal: 16, paddingTop: 14 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 15, paddingHorizontal: 14, height: 44 },
  searchIcon: { fontSize: 14, color: C.textMuted },
  searchInput: { flex: 1, fontSize: 14, color: C.text, fontWeight: '600', padding: 0 },

  tabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 2 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingVertical: 9, paddingHorizontal: 16 },
  tabOn: { backgroundColor: C.text, borderColor: C.text },
  tabTxt: { fontSize: 13.5, fontWeight: '800', color: C.textMuted },
  tabTxtOn: { color: '#fff' },
  tabCount: { fontSize: 13, fontWeight: '800', color: '#9A9A9F' },
  tabCountOn: { color: '#8FE3DC' },

  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, marginBottom: 12 },
  cardMain: { flex: 1, gap: 9 },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8 },
  statusOpen: { backgroundColor: C.mintSoft },
  statusDone: { backgroundColor: '#F0F0F0' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  cardTitle: { fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  meta: { fontSize: 12, fontWeight: '700', color: C.textMuted },

  score: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  scoreVal: { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  scorePct: { fontSize: 12, fontWeight: '800' },

  btn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  btnAttempt: { backgroundColor: C.mint },
  btnAttemptTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.border },
  btnGhostTxt: { color: C.text, fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
});