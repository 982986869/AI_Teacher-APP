// MockTestsCards.js (default export: MockTestsCards)
// Mock Tests in the shared artifact-style card UI: pick a subject, then see that
// subject's DB-backed mock tests as cards, with "All / Attempted" tabs. Mocks are
// full-syllabus (not chapter-wise), so this is a 2-level flow. Works for every
// class — the parent passes that class's mock subjects + classLevel.
//
// Props:
//   subjects   [{ name, emoji, bg }]  — the class's mock subjects
//   classLevel number                 — the active class (6–12)
//   onBack()                          — close the mock section
//   onStart(subjectName, test, att)   — launch a mock test (parent runs it)

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable } from 'react-native';
import { FONT } from '../constants/fonts';
import { listMockTests, listMockAttempts } from '../api/mockTestsApi';
import { TK, ScreenHeader, FilterTabs, SubjectRow, TestCard } from '../components/testCardKit';

// Soft subject tints (match the Online Tests screen); unknown subjects fall back
// to the accent tint inside SubjectRow.
const TILE = {
  Physics: '#E1F5F3', Chemistry: '#FCEBDD', Mathematics: '#E9EBFB', Biology: '#E7F3E4',
  Science: '#E7F3E4', 'Social Science': '#E9EBFB', 'Old - Maths': '#E9EBFB',
  'Old - Science': '#E7F3E4', 'Old - Social Sc': '#FCEBDD',
};

const EmptyMsg = ({ text }) => (
  <View style={{ paddingVertical: 48, alignItems: 'center' }}>
    <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{text}</Text>
  </View>
);

export default function MockTestsCards({ subjects = [], classLevel = 11, onBack, onStart }) {
  const [subject, setSubject] = useState(null);
  const [tab, setTab] = useState('all');
  const [data, setData] = useState({ loading: false, error: '', tests: [], attempts: {} });

  useEffect(() => { setTab('all'); }, [subject]);

  useEffect(() => {
    if (!subject) return undefined;
    let alive = true;
    setData({ loading: true, error: '', tests: [], attempts: {} });
    Promise.all([
      listMockTests(subject.name, classLevel),
      listMockAttempts(subject.name, classLevel).catch(() => ({ attempts: [] })),
    ])
      .then(([listRes, attRes]) => {
        if (!alive) return;
        const attempts = {};
        for (const a of (attRes.attempts || [])) attempts[a.testId] = a;
        setData({ loading: false, error: '', tests: (listRes.tests || []), attempts });
      })
      .catch((e) => {
        if (alive) setData({ loading: false, error: e?.response?.data?.error || e?.message || 'Could not load tests.', tests: [], attempts: {} });
      });
    return () => { alive = false; };
  }, [subject, classLevel]);

  // ── subject list ──
  if (!subject) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
        <ScreenHeader title="Mock Tests" subtitle="Pick a subject, then a mock test" onBack={onBack} />
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {subjects.map((subj) => (
            <SubjectRow
              key={subj.name}
              emoji={subj.emoji}
              tile={TILE[subj.name]}
              name={subj.name}
              sub="Full-syllabus mock tests"
              onPress={() => setSubject(subj)}
            />
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── mock test cards for the chosen subject ──
  const tests = data.tests;
  const attemptFor = (t) => data.attempts[t.id];
  const attemptedCount = tests.filter(attemptFor).length;
  const shown = tests.filter((t) => tab !== 'attempted' || attemptFor(t));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
      <ScreenHeader title={subject.name} subtitle="Full-syllabus mock tests" onBack={() => setSubject(null)} />
      <FilterTabs
        tab={tab}
        onChange={setTab}
        tabs={[{ id: 'all', label: 'All', count: tests.length }, { id: 'attempted', label: 'Attempted', count: attemptedCount }]}
      />
      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {data.loading && (
          <View style={{ paddingVertical: 44, alignItems: 'center' }}>
            <ActivityIndicator color={TK.mint} />
          </View>
        )}
        {!data.loading && data.error ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
            <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{data.error}</Text>
            <Pressable onPress={() => setSubject({ ...subject })} style={{ borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}>
              <Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 13 }}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
        {!data.loading && !data.error && shown.length === 0 ? (
          <EmptyMsg text={tab === 'attempted' ? 'No attempted mock tests yet.' : 'No mock tests yet.'} />
        ) : null}
        {!data.loading && !data.error && shown.map((t) => {
          const att = attemptFor(t);
          const done = !!att;
          const total = att && att.total != null ? att.total : null;
          const pct = done && total ? Math.round((att.bestScore / total) * 100) : null;
          return (
            <TestCard
              key={t.id}
              done={done}
              title={t.name}
              metas={[`\u{1F4DD} ${t.questionCount || '—'} questions`, `⏱ ${t.durationMin || 90} min`]}
              scoreText={done && total != null ? `${att.bestScore}/${total}` : null}
              scorePct={pct}
              actionLabel={done ? 'Retake' : 'Attempt'}
              onPress={() => onStart(subject.name, t, att)}
            />
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
