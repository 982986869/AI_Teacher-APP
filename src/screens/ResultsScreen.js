// src/screens/ResultsScreen.js
// The student's own "Progress" tab. All of the UI now lives in the shared <ResultsView>
// (src/screens/results/ResultsView.js) so the Admin "view any student's results" screen is
// pixel-for-pixel the same page — the two differ ONLY by their data source, header and the
// `dark` flag (the student's own tab renders on the AILERNOVA dark design system; the admin
// caller keeps the existing light look untouched).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getResults, getAttemptDetail } from '../api/learningApi';
import { COLORS } from '../theme/designSystem';
import { FONT } from '../constants/fonts';
import ResultsView from './results/ResultsView';

function ProgressHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <Text style={s.title}>Progress</Text>
      <Text style={s.sub}>Tests, scores & study time</Text>
    </View>
  );
}

const ResultsScreen = () => (
  <ResultsView
    fetchResults={getResults}
    fetchAttemptSections={getAttemptDetail}
    enableTabScrollToTop
    dark
    header={<ProgressHeader />}
  />
);

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 12 },
  title:  { fontSize: 24, fontFamily: FONT.black, color: COLORS.textPrimary, letterSpacing: -0.5 },
  sub:    { fontSize: 13, fontFamily: FONT.semibold, color: COLORS.textSecondary, marginTop: 4 },
});

export default ResultsScreen;
