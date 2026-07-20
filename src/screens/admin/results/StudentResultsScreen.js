// src/screens/admin/results/StudentResultsScreen.js
// Admin "view a student's Results" — this is NOT a separate analytics page. It renders the
// EXACT same <ResultsView> the student sees on their own Progress tab; the ONLY difference is
// the data source (a selected student, reached via the Results search) and the header, which
// shows that student's name with a back affordance instead of the fixed "Progress" title.
import React, { useCallback } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { getAdminStudentResults, getAdminStudentAttemptDetail } from '../../../api/adminApi';
import ResultsView from '../../results/ResultsView';
import { S } from '../../../theme/studentUI';
import { T } from '../../parent/ParentApp/constants';

export default function StudentResultsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id, name } = route.params || {};

  const fetchResults = useCallback((period, offset) => getAdminStudentResults(id, { period, offset }), [id]);
  const fetchAttemptSections = useCallback((attemptId) => getAdminStudentAttemptDetail(id, attemptId), [id]);

  // Mirrors StudentScreenHeader's metrics (title black 22, subtitle semi 12.5) so the page
  // reads as the same header — with a back chevron because this one was pushed from search.
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingRight: 18, paddingBottom: 10, paddingTop: insets.top + 8 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ padding: 4 }}>
        <ChevronLeft size={26} color={S.ink} strokeWidth={2.5} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <T w="black" s={22} c={S.ink} style={{ letterSpacing: -0.5 }} numberOfLines={1}>{name || 'Student'}</T>
        <T w="semi" s={12.5} c={S.muted} style={{ marginTop: 1 }} numberOfLines={1}>Progress · tests, scores & study time</T>
      </View>
    </View>
  );

  return (
    <ResultsView
      fetchResults={fetchResults}
      fetchAttemptSections={fetchAttemptSections}
      header={header}
    />
  );
}
