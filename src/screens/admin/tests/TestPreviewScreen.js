// src/screens/admin/tests/TestPreviewScreen.js
// "Preview as student" — renders the REAL student mock runner (McqTestScreen) with the
// admin's questions, but with onSubmit as a no-op so NO attempt/result is ever created.
import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAdminTest } from '../../../api/adminApi';
import McqTestScreen from '../../McqTestScreen';
import { S, StudentErrorState } from '../../../theme/studentUI';

export default function TestPreviewScreen({ route, navigation }) {
  const { id } = route.params || {};
  const [state, setState] = useState({ loading: true, error: false, test: null, questions: [] });

  useFocusEffect(useCallback(() => {
    let alive = true;
    getAdminTest(id).then((d) => {
      if (!alive) return;
      const questions = (d.questions || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: (Array.isArray(q.options) ? q.options : []).map((o) => (o && o.text != null ? String(o.text) : String(o || ''))),
        correct: q.correctIndex != null ? q.correctIndex : -1,
        cat: q.sectionName || 'MCQ',
        explanation: q.explanation || '',
        sectionName: q.sectionName || 'Section',
      }));
      setState({ loading: false, error: false, test: d.test, questions });
    }).catch(() => { if (alive) setState((s) => ({ ...s, loading: false, error: true })); });
    return () => { alive = false; };
  }, [id]));

  if (state.loading) return <View style={{ flex: 1, backgroundColor: S.canvas, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={S.indigo} size="large" /></View>;
  if (state.error) return <View style={{ flex: 1, backgroundColor: S.canvas }}><StudentErrorState title="Couldn't load preview" onRetry={() => setState((s) => ({ ...s, loading: true, error: false }))} /></View>;
  if (!state.questions.length) return <View style={{ flex: 1, backgroundColor: S.canvas }}><StudentErrorState title="No questions to preview" message="Add questions first, then preview." onRetry={() => navigation.goBack()} retryLabel="Go back" /></View>;

  return (
    <McqTestScreen
      title={`Preview · ${state.test?.name || 'Test'}`}
      questions={state.questions}
      sections={null}
      durationMin={state.test?.durationMin || 30}
      pointsPerCorrect={1}
      negative={0}
      onExit={() => navigation.goBack()}
      onSubmit={() => { /* preview only — never persists an attempt */ }}
    />
  );
}
