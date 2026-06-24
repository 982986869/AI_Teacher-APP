// OnlineTestsScreen.js
// Online Tests: pick a subject (Physics / Chemistry / Maths / Biology),
// then a chapter, then a test -> opens the test.
// Pastel mint & peach theme.
//
// DB-backed: subjects are fixed; chapters, tests and questions are fetched from
// the backend (online_tests). The UI/flow is unchanged from the previous
// local-data version — only the data source moved to the database.
//
// Props:
//   onBack()
//   onStartTest({ subject, chapterId, chapterName, testId, questions })

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar, SafeAreaView, ActivityIndicator } from 'react-native';

import { listOnlineChapters, listOnlineTests, getOnlineTestQuestions } from '../api/onlineTestsApi';

// ---- pastel mint & peach palette ----
const C = {
  bg: '#F4FBF8',
  card: '#FFFFFF',
  border: '#E6F2EC',
  text: '#2E4039',
  textMuted: '#7C8C85',
  mint: '#7BD3B0',
  mintSoft: '#D6F2E7',
  peach: '#F6A98C',
  peachSoft: '#FBE0D5',
  sand: '#F3D9A4',
  sandSoft: '#FBEFD6',
  lilacSoft: '#E6E2F6',
  headerMint: '#CDEFE2',
};

// Subjects are fixed; `dbSubject` is the value the API expects (Maths -> Mathematics).
const SUBJECTS = [
  { key: 'physics',   name: 'Physics',   dbSubject: 'Physics',     emoji: '⚛️', tile: C.mintSoft },
  { key: 'chemistry', name: 'Chemistry', dbSubject: 'Chemistry',   emoji: '\u{1F9EA}',    tile: C.peachSoft },
  { key: 'maths',     name: 'Maths',     dbSubject: 'Mathematics', emoji: '\u{1F4D0}',    tile: C.sandSoft },
  { key: 'biology',   name: 'Biology',   dbSubject: 'Biology',     emoji: '\u{1F9EC}',    tile: C.lilacSoft },
];

export default function OnlineTestsScreen({ onBack, onStartTest = () => {} }) {
  const [subject, setSubject] = useState(null);
  const [chapter, setChapter] = useState(null); // chosen chapter -> show its tests

  // chapters per subject: { [dbSubject]: { loading, error, chapters:[{chapterId,chapterName,testCount,questionCount}] } }
  const [chaptersData, setChaptersData] = useState({});
  // tests for the current chapter: { loading, error, tests:[{id,name,questionCount}] }
  const [testsData, setTestsData] = useState({ loading: false, error: '', tests: [] });
  // loading a test's questions before handing off to the test screen
  const [starting, setStarting] = useState(false);

  // Load all four subjects' chapter lists once so the subject cards show counts.
  useEffect(() => {
    let alive = true;
    SUBJECTS.forEach((subj) => {
      setChaptersData((p) => ({ ...p, [subj.dbSubject]: { loading: true, error: '', chapters: [] } }));
      listOnlineChapters(subj.dbSubject)
        .then((res) => { if (alive) setChaptersData((p) => ({ ...p, [subj.dbSubject]: { loading: false, error: '', chapters: res.chapters || [] } })); })
        .catch((e) => { if (alive) setChaptersData((p) => ({ ...p, [subj.dbSubject]: { loading: false, error: e?.response?.data?.error || e?.message || 'Could not load', chapters: [] } })); });
    });
    return () => { alive = false; };
  }, []);

  const loadTests = (chapterId) => {
    setTestsData({ loading: true, error: '', tests: [] });
    listOnlineTests(chapterId)
      .then((res) => setTestsData({ loading: false, error: '', tests: res.tests || [] }))
      .catch((e) => setTestsData({ loading: false, error: e?.response?.data?.error || e?.message || 'Could not load tests', tests: [] }));
  };

  const openChapter = (ch) => { setChapter(ch); loadTests(ch.chapterId); };

  const startTest = (t) => {
    if (starting) return;
    setStarting(true);
    getOnlineTestQuestions(t.id)
      .then((res) => {
        onStartTest({
          subject: subject.name,
          chapterId: chapter.chapterId,
          chapterName: t.name,
          testId: t.id,
          questions: res.questions || [],
        });
      })
      .catch(() => {})
      .finally(() => setStarting(false));
  };

  const Header = ({ title, subtitle }) => (
    <View style={s.header}>
      <Pressable onPress={chapter ? () => setChapter(null) : (subject ? () => setSubject(null) : onBack)} style={s.backRow} hitSlop={8}>
        <Text style={s.backArrow}>{'←'}</Text>
        <Text style={s.backText}>Back</Text>
      </Pressable>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
    </View>
  );

  const Loading = ({ label }) => (
    <View style={{ paddingVertical: 30, alignItems: 'center', gap: 10 }}>
      <ActivityIndicator color={C.mint} />
      {label ? <Text style={s.subjectSub}>{label}</Text> : null}
    </View>
  );

  // ---- subject list ----
  if (!subject) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.headerMint} />
        <Header title="Online Tests" subtitle="Pick a subject, then a chapter" />
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {SUBJECTS.map((subj, si) => {
            const sd = chaptersData[subj.dbSubject];
            const sub = sd && sd.loading ? 'Loading…' : `${(sd && sd.chapters.length) || 0} chapters`;
            return (
              <Pressable key={`${subj.key}-${si}`} style={s.subjectCard} onPress={() => setSubject(subj)}>
                <View style={[s.subjectIcon, { backgroundColor: subj.tile }]}>
                  <Text style={s.subjectEmoji}>{subj.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.subjectName}>{subj.name}</Text>
                  <Text style={s.subjectSub}>{sub}</Text>
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

  // ---- tests for the chosen chapter ----
  if (chapter) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.headerMint} />
        <Header title={chapter.chapterName} subtitle="Select an online test to explore" />
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {testsData.loading ? (
            <Loading />
          ) : testsData.error ? (
            <View style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
              <Text style={s.subjectSub}>{testsData.error}</Text>
              <Pressable style={[s.subjectCard, { justifyContent: 'center' }]} onPress={() => loadTests(chapter.chapterId)}>
                <Text style={s.subjectName}>Retry</Text>
              </Pressable>
            </View>
          ) : testsData.tests.length === 0 ? (
            <Text style={[s.subjectSub, { textAlign: 'center', paddingVertical: 24 }]}>No tests yet.</Text>
          ) : (
            testsData.tests.map((t) => (
              <Pressable
                key={t.id}
                style={s.testRow}
                disabled={starting}
                onPress={() => startTest(t)}
              >
                <View style={s.testIcon}><Text style={s.testIconTxt}>{'\u{1F4DD}'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.testName}>{t.name}</Text>
                  <Text style={s.testSub}>{t.questionCount} questions</Text>
                </View>
                <Text style={s.chevron}>{'›'}</Text>
              </Pressable>
            ))
          )}
          {starting && <Loading label="Loading test…" />}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---- chapter list for the chosen subject ----
  const sd = chaptersData[subject.dbSubject];
  const chapters = (sd && sd.chapters) || [];
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.headerMint} />
      <Header title={subject.name} subtitle={`${chapters.length} chapters · tap one to start`} />
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {sd && sd.loading ? (
          <Loading />
        ) : sd && sd.error ? (
          <View style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
            <Text style={s.subjectSub}>{sd.error}</Text>
          </View>
        ) : chapters.length === 0 ? (
          <Text style={[s.subjectSub, { textAlign: 'center', paddingVertical: 24 }]}>No chapters yet.</Text>
        ) : (
          chapters.map((ch, i) => (
            <Pressable
              key={`${ch.chapterId}-${i}`}
              style={s.chapterRow}
              onPress={() => openChapter(ch)}
            >
              <View style={s.chapterNum}><Text style={s.chapterNumTxt}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.chapterName}>{ch.chapterName}</Text>
                <Text style={s.chapterSub}>{ch.questionCount} questions</Text>
              </View>
              <Text style={s.chevron}>{'›'}</Text>
            </Pressable>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.headerMint, paddingTop: 48, paddingHorizontal: 20, paddingBottom: 18 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backArrow: { fontSize: 20, color: C.text, marginRight: 8, fontWeight: '700' },
  backText: { fontSize: 16, color: C.text, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '900', color: C.text },
  subtitle: { fontSize: 13.5, color: '#5C7268', marginTop: 4, fontWeight: '600' },

  body: { padding: 16 },

  subjectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 12 },
  subjectIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  subjectEmoji: { fontSize: 26 },
  subjectName: { fontSize: 17, fontWeight: '800', color: C.text },
  subjectSub: { fontSize: 12.5, color: C.textMuted, marginTop: 2, fontWeight: '600' },

  chapterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
  chapterNum: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  chapterNumTxt: { fontSize: 13, fontWeight: '800', color: '#2E6B53' },
  chapterName: { fontSize: 14.5, fontWeight: '700', color: C.text },
  chapterSub: { fontSize: 12, color: C.textMuted, marginTop: 2, fontWeight: '600' },

  testRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
  testIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  testIconTxt: { fontSize: 18 },
  testName: { fontSize: 14.5, fontWeight: '700', color: C.text },
  testSub: { fontSize: 12, color: C.textMuted, marginTop: 2, fontWeight: '600' },

  chevron: { fontSize: 24, color: '#BFD8CD', fontWeight: '400', marginLeft: 8 },
});
