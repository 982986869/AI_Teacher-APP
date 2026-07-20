// src/screens/ResultsScreen.js
// The student's own "Progress" tab. All of the UI now lives in the shared <ResultsView>
// (src/screens/results/ResultsView.js) so the Admin "view any student's results" screen is
// pixel-for-pixel the same page — the two differ ONLY by their data source and header.
// Here the source is the signed-in student's own results; the header is the Progress header
// and re-tapping the Results tab scrolls to top.
import React from 'react';
import { getResults, getAttemptDetail } from '../api/learningApi';
import { StudentScreenHeader } from '../theme/studentUI';
import ResultsView from './results/ResultsView';

const ResultsScreen = () => (
  <ResultsView
    fetchResults={getResults}
    fetchAttemptSections={getAttemptDetail}
    enableTabScrollToTop
    header={<StudentScreenHeader title="Progress" subtitle="Tests, scores & study time" />}
  />
);

export default ResultsScreen;
