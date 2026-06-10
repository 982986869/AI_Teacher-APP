import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const WEEK_DATA = [
  { day: 'M', val: 65 }, { day: 'T', val: 80 }, { day: 'W', val: 55 },
  { day: 'T', val: 90 }, { day: 'F', val: 70 }, { day: 'S', val: 60 }, { day: 'S', val: 95 },
];

const SUBJECT_RESULTS = [
  { name: 'Mathematics', score: 91, tests: 8,  trend: '+5%' },
  { name: 'Physics',     score: 85, tests: 12, trend: '+2%' },
  { name: 'English',     score: 84, tests: 6,  trend: '+8%' },
  { name: 'Biology',     score: 63, tests: 5,  trend: '-3%' },
  { name: 'Chemistry',   score: 55, tests: 4,  trend: '+1%' },
];

const TEST_HISTORY = [
  { subject: 'Mathematics', topic: 'Quadratic Equations', score: 92, total: 100, date: 'Today',       type: 'MCQ' },
  { subject: 'Physics',     topic: 'Laws of Motion',      score: 85, total: 100, date: 'Yesterday',   type: 'Mixed' },
  { subject: 'English',     topic: 'Essay Writing',       score: 78, total: 100, date: '2 days ago',  type: 'Written' },
  { subject: 'Chemistry',   topic: 'Periodic Table',      score: 74, total: 100, date: '3 days ago',  type: 'MCQ' },
];

const EMOJIS = { Mathematics: '📐', Physics: '⚛️', English: '📝', Biology: '🧬', Chemistry: '🧪' };

const ResultsScreen = () => {
  const [period, setPeriod] = useState('Week');
  const maxVal = Math.max(...WEEK_DATA.map(d => d.val));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}

      <View style={s.header}>
        <Text style={s.headerTitle}>Results</Text>
        <View style={s.periodRow}>
          {['Week', 'Month', 'All'].map(p => (
            <TouchableOpacity key={p} style={[s.periodBtn, period === p && s.periodBtnActive]} onPress={() => setPeriod(p)}>
              <Text style={[s.periodTxt, period === p && s.periodTxtActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Overview cards */}
        <View style={s.overviewRow}>
          {[
            { icon: '📚', val: '29',    lbl: 'Tests Taken' },
            { icon: '🎯', val: '85%',   lbl: 'Avg Score' },
            { icon: '🏆', val: '#3',    lbl: 'Class Rank' },
            { icon: '⚡', val: '1250',  lbl: 'XP Earned' },
          ].map((item, i) => (
            <View key={i} style={s.overviewCard}>
              <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</Text>
              <Text style={s.overviewVal}>{item.val}</Text>
              <Text style={s.overviewLbl}>{item.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Bar chart */}
        <View style={s.chartCard}>
          <View style={s.chartHdr}>
            <Text style={s.chartTitle}>Daily Score</Text>
            <Text style={s.chartSub}>This Week</Text>
          </View>
          <View style={s.barsArea}>
            {WEEK_DATA.map((d, i) => {
              const isToday = i === WEEK_DATA.length - 1;
              const barH = Math.max(8, (d.val / maxVal) * 90);
              return (
                <View key={i} style={s.barCol}>
                  <Text style={[s.barVal, isToday && { color: '#1C1C1E', fontWeight: '800' }]}>{d.val}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { height: barH }, isToday && s.barFillDark]} />
                  </View>
                  <Text style={[s.barDay, isToday && { color: '#1C1C1E', fontWeight: '800' }]}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Subject breakdown */}
        <Text style={s.sectionTitle}>Subject Breakdown</Text>
        <View style={s.subjectsCard}>
          {SUBJECT_RESULTS.map((sub, i) => (
            <View key={i} style={[s.subjectRow, i < SUBJECT_RESULTS.length - 1 && s.subjectRowBorder]}>
              <View style={s.subjectIconWrap}>
                <Text style={{ fontSize: 18 }}>{EMOJIS[sub.name] || '📚'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={s.subjectName}>{sub.name}</Text>
                  <Text style={[s.subjectScore, sub.score >= 80 && s.scoreHigh, sub.score < 70 && s.scoreLow]}>{sub.score}%</Text>
                </View>
                <View style={s.subBarBg}>
                  <View style={[s.subBarFill, { width: `${sub.score}%` }]} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={s.subMeta}>{sub.tests} tests taken</Text>
                  <Text style={[s.subTrend, sub.trend.startsWith('+') ? s.trendUp : s.trendDown]}>{sub.trend}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Test history */}
        <Text style={s.sectionTitle}>Recent Tests</Text>
        <View style={s.historyCard}>
          {TEST_HISTORY.map((t, i) => (
            <View key={i} style={[s.histRow, i < TEST_HISTORY.length - 1 && s.histRowBorder]}>
              <View style={s.histLeft}>
                <View style={s.histIconWrap}>
                  <Text style={{ fontSize: 16 }}>{EMOJIS[t.subject] || '📚'}</Text>
                </View>
                <View>
                  <Text style={s.histSubject}>{t.subject}</Text>
                  <Text style={s.histTopic}>{t.topic}</Text>
                  <View style={s.histMetaRow}>
                    <Text style={s.histDate}>{t.date}</Text>
                    <View style={s.typePill}><Text style={s.typePillTxt}>{t.type}</Text></View>
                  </View>
                </View>
              </View>
              <View style={s.histRight}>
                <Text style={s.histScore}>{t.score}</Text>
                <Text style={s.histTotal}>/{t.total}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#F7F7F7' },
  header:           { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  headerTitle:      { fontSize: 22, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5 },
  periodRow:        { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 12, padding: 3, gap: 2 },
  periodBtn:        { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10 },
  periodBtnActive:  { backgroundColor: '#1C1C1E' },
  periodTxt:        { fontSize: 12, fontWeight: '700', color: '#8E8E93' },
  periodTxtActive:  { color: '#fff' },
  overviewRow:      { flexDirection: 'row', padding: 16, gap: 10 },
  overviewCard:     { flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 12, alignItems: 'center' },
  overviewVal:      { fontSize: 18, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5 },
  overviewLbl:      { fontSize: 9, color: '#8E8E93', fontWeight: '700', marginTop: 2, textAlign: 'center' },
  chartCard:        { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 16, marginBottom: 8 },
  chartHdr:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  chartTitle:       { fontSize: 16, fontWeight: '900', color: '#1C1C1E' },
  chartSub:         { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  barsArea:         { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 },
  barCol:           { flex: 1, alignItems: 'center', gap: 4 },
  barVal:           { fontSize: 9, color: '#C7C7CC', fontWeight: '700' },
  barTrack:         { width: '80%', height: 90, justifyContent: 'flex-end', alignItems: 'center' },
  barFill:          { width: '100%', backgroundColor: '#E0E0E0', borderRadius: 6 },
  barFillDark:      { backgroundColor: '#1C1C1E' },
  barDay:           { fontSize: 10, color: '#C7C7CC', fontWeight: '600' },
  sectionTitle:     { fontSize: 17, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3, paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },
  subjectsCard:     { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', overflow: 'hidden' },
  subjectRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  subjectRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  subjectIconWrap:  { width: 40, height: 40, backgroundColor: '#F7F7F7', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#F0F0F0' },
  subjectName:      { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  subjectScore:     { fontSize: 14, fontWeight: '900', color: '#8E8E93' },
  scoreHigh:        { color: '#1C1C1E' },
  scoreLow:         { color: '#C7C7CC' },
  subBarBg:         { height: 5, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  subBarFill:       { height: 5, backgroundColor: '#1C1C1E', borderRadius: 3 },
  subMeta:          { fontSize: 10, color: '#C7C7CC', fontWeight: '600' },
  subTrend:         { fontSize: 11, fontWeight: '800' },
  trendUp:          { color: '#1C1C1E' },
  trendDown:        { color: '#C7C7CC' },
  historyCard:      { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', overflow: 'hidden' },
  histRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  histRowBorder:    { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  histLeft:         { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  histIconWrap:     { width: 38, height: 38, backgroundColor: '#F7F7F7', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#F0F0F0' },
  histSubject:      { fontSize: 13, fontWeight: '800', color: '#1C1C1E' },
  histTopic:        { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginTop: 1 },
  histMetaRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  histDate:         { fontSize: 10, color: '#C7C7CC', fontWeight: '600' },
  typePill:         { backgroundColor: '#F0F0F0', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 7 },
  typePillTxt:      { fontSize: 9, fontWeight: '800', color: '#8E8E93' },
  histRight:        { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  histScore:        { fontSize: 22, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5 },
  histTotal:        { fontSize: 12, color: '#C7C7CC', fontWeight: '700' },
});

export default ResultsScreen;