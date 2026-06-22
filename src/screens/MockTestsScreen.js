import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import McqTestScreen from './McqTestScreen';
import { listMockTests, getMockTestQuestions, submitMockTest } from '../api/mockTestsApi';

// Reuse McqTestScreen's purple palette for a consistent look.
const C = {
  primary: '#6C63FF', primaryLight: '#EAE8FF', accent: '#FF7B7B', accentLight: '#FFF0F0',
  green: '#4CAF7D', bg: '#F4F6FF', white: '#fff', text: '#2D2D3A', muted: '#8A8AA0', border: '#E4E6F1',
};

// DB-backed mock tests: lists tests from the API, then runs the chosen one
// through the existing McqTestScreen and submits the attempt to the server.
export default function MockTestsScreen({ subject = 'Physics', onExit }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [running, setRunning] = useState(null); // { test, questions } once loaded
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    listMockTests(subject)
      .then((data) => setTests((data && data.tests) || []))
      .catch((e) => setError(e?.response?.data?.error || e?.message || 'Could not load mock tests.'))
      .finally(() => setLoading(false));
  }, [subject]);

  useEffect(() => { load(); }, [load]);

  const openTest = (t) => {
    setQLoading(true);
    setQError('');
    getMockTestQuestions(t.id)
      .then((data) => setRunning({ test: t, questions: (data && data.questions) || [] }))
      .catch((e) => setQError(e?.response?.data?.error || e?.message || 'Could not load questions.'))
      .finally(() => setQLoading(false));
  };

  // ── Running a test: hand off to the existing quiz UI ──
  if (running) {
    return (
      <McqTestScreen
        subject={subject}
        chapter={running.test.name}
        questions={running.questions}
        durationMin={running.test.durationMin || 30}
        pointsPerCorrect={1}
        negative={0}
        onExit={() => setRunning(null)}
        onSubmit={(payload) => { submitMockTest(running.test.id, payload).catch(() => {}); }}
      />
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}

      <View style={st.header}>
        <TouchableOpacity onPress={onExit} style={st.backBtn} activeOpacity={0.7}>
          <Text style={st.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>{subject} Mock Tests</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading */}
      {loading ? (
        <View style={st.center}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={st.centerTxt}>Loading mock tests…</Text>
        </View>
      ) : error ? (
        // Error
        <View style={st.center}>
          <Text style={st.errEmoji}>⚠️</Text>
          <Text style={st.errTitle}>Couldn't load tests</Text>
          <Text style={st.centerTxt}>{error}</Text>
          <TouchableOpacity style={st.retryBtn} onPress={load} activeOpacity={0.85}>
            <Text style={st.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tests.length === 0 ? (
        // Empty
        <View style={st.center}>
          <Text style={st.errEmoji}>📭</Text>
          <Text style={st.errTitle}>No mock tests yet</Text>
          <Text style={st.centerTxt}>{subject} mock tests haven't been added yet. Please check back later.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}>
          <Text style={st.sub}>{tests.length} tests · tap one to begin</Text>
          {tests.map((t) => (
            <TouchableOpacity key={t.id} style={st.card} activeOpacity={0.85} onPress={() => openTest(t)} disabled={qLoading}>
              <View style={st.cardIcon}><Text style={{ fontSize: 20 }}>📝</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={st.cardTitle}>{t.name}</Text>
                <Text style={st.cardMeta}>
                  {t.questionCount} Qs · {t.durationMin} min{t.categoryFullName ? ` · ${t.categoryFullName}` : ''}
                </Text>
              </View>
              <Text style={st.cardChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Loading a specific test's questions */}
      {qLoading && (
        <View style={st.overlay} pointerEvents="auto">
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={[st.centerTxt, { color: '#fff' }]}>Loading questions…</Text>
        </View>
      )}
      {!!qError && !qLoading && (
        <View style={st.toast}><Text style={st.toastTxt}>{qError}</Text></View>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.white, borderBottomWidth: 1.5, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40 },
  backArrow: { fontSize: 22, color: C.text, fontWeight: '700' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: C.text },

  sub: { fontSize: 12, fontWeight: '600', color: C.muted, marginBottom: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  cardMeta: { fontSize: 11, fontWeight: '600', color: C.muted, marginTop: 3 },
  cardChevron: { fontSize: 22, color: C.muted, fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 8 },
  centerTxt: { fontSize: 13, fontWeight: '600', color: C.muted, textAlign: 'center', lineHeight: 19 },
  errEmoji: { fontSize: 40 },
  errTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  retryBtn: { marginTop: 10, backgroundColor: C.primary, borderRadius: 50, paddingVertical: 11, paddingHorizontal: 28 },
  retryTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(45,45,58,0.55)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  toast: { position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: C.accent, borderRadius: 12, padding: 12 },
  toastTxt: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
