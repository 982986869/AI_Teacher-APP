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

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar, SafeAreaView } from 'react-native';

import { chapterList as physicsChapters, getQuestions as getPhysics } from '../data/questionBank';
import { chapterList as chemChapters,    getQuestions as getChem }    from '../data/chemistryBank';
import { chapterList as mathsChapters,   getQuestions as getMaths }   from '../data/mathsBank';
import { chapterList as bioChapters,     getQuestions as getBio }     from '../data/biologyBank';

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

const SUBJECTS = [
  { key: 'physics',   name: 'Physics',   emoji: '\u269B\uFE0F', tile: C.mintSoft,  chapters: physicsChapters, getQuestions: getPhysics },
  { key: 'chemistry', name: 'Chemistry', emoji: '\u{1F9EA}',    tile: C.peachSoft, chapters: chemChapters,    getQuestions: getChem },
  { key: 'maths',     name: 'Maths',     emoji: '\u{1F4D0}',    tile: C.sandSoft,  chapters: mathsChapters,   getQuestions: getMaths },
  { key: 'biology',   name: 'Biology',   emoji: '\u{1F9EC}',    tile: C.lilacSoft, chapters: bioChapters,     getQuestions: getBio },
];

export default function OnlineTestsScreen({ onBack, onStartTest = () => {} }) {
  const [subject, setSubject] = useState(null);
  const [chapter, setChapter] = useState(null); // chosen chapter -> show its 5 tests

  const TESTS_PER_CHAPTER = 5;

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
    // split the chapter's questions into 5 roughly-equal tests
    const all = subject.getQuestions(chapter.id) || [];
    const per = Math.ceil(all.length / TESTS_PER_CHAPTER) || 0;
    const tests = Array.from({ length: TESTS_PER_CHAPTER }, (_, t) => {
      const slice = all.slice(t * per, (t + 1) * per);
      return { no: t + 1, questions: slice };
    });
    const shortName = chapter.name.length > 26 ? chapter.name.slice(0, 24) + '\u2026' : chapter.name;
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.headerMint} />
        <Header title={chapter.name} subtitle="Select an online test to explore" />
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {tests.map((t) => (
            <Pressable
              key={t.no}
              style={s.testRow}
              onPress={() => onStartTest({
                subject: subject.name,
                chapterId: chapter.id,
                chapterName: `${chapter.name} Test-${String(t.no).padStart(2, '0')}`,
                questions: t.questions,
              })}
            >
              <View style={s.testIcon}><Text style={s.testIconTxt}>{'\u{1F4DD}'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.testName}>{shortName} Test-{String(t.no).padStart(2, '0')}</Text>
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
              count: ch.count,
            })}
          >
            <View style={s.chapterNum}><Text style={s.chapterNumTxt}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.chapterName}>{ch.name || ch.chapter_name || ch.chapterName || ch.title || `Chapter ${i + 1}`}</Text>
              <Text style={s.chapterSub}>{ch.count} questions</Text>
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