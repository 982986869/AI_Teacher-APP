import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';

const SUBJECTS = [
  { name: 'Physics',     emoji: '⚛️', topics: 24, done: 18 },
  { name: 'Mathematics', emoji: '📐', topics: 32, done: 28 },
  { name: 'Chemistry',   emoji: '🧪', topics: 20, done: 11 },
  { name: 'Biology',     emoji: '🧬', topics: 18, done: 10 },
  { name: 'English',     emoji: '📝', topics: 15, done: 13 },
];

const QUESTION_TYPES = [
  { icon: '🎯', label: 'MCQ Practice',    sub: 'Multiple choice questions',  count: '120+ Qs' },
  { icon: '✍️', label: 'Short Answer',    sub: 'Written response questions', count: '80+ Qs' },
  { icon: '🧩', label: 'Fill in Blanks',  sub: 'Complete the statement',     count: '60+ Qs' },
  { icon: '⚡', label: 'Speed Round',     sub: '30 sec per question',        count: '50 Qs' },
];

const RECENT = [
  { subject: 'Physics', topic: 'Laws of Motion', score: 85, date: 'Today' },
  { subject: 'Maths',   topic: 'Quadratic Eq.',  score: 92, date: 'Yesterday' },
  { subject: 'Chemistry', topic: 'Periodic Table', score: 74, date: '2 days ago' },
];

const PracticeScreen = () => {
  const [activeSub, setActiveSub] = useState('Physics');
  const activeFull = SUBJECTS.find(s => s.name === activeSub) || SUBJECTS[0];
  const pct = Math.round((activeFull.done / activeFull.topics) * 100);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}

      <View style={s.header}>
        <Text style={s.headerTitle}>Practice</Text>
        <View style={s.headerRight}>
          <View style={s.xpBadge}><Text style={s.xpTxt}>🔥 7 day streak</Text></View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Subject selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
          {SUBJECTS.map(sub => (
            <TouchableOpacity key={sub.name}
              style={[s.subChip, activeSub === sub.name && s.subChipActive]}
              onPress={() => setActiveSub(sub.name)}>
              <Text style={{ fontSize: 16 }}>{sub.emoji}</Text>
              <Text style={[s.subChipTxt, activeSub === sub.name && s.subChipTxtActive]}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Active subject card */}
        <View style={s.subjectCard}>
          <View style={s.subjectCardTop}>
            <View style={s.subjectIconBig}>
              <Text style={{ fontSize: 34 }}>{activeFull.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.subjectCardTitle}>{activeFull.name}</Text>
              <Text style={s.subjectCardSub}>{activeFull.done} / {activeFull.topics} topics completed</Text>
              <View style={s.progBarBg}>
                <View style={[s.progBarFill, { width: `${pct}%` }]} />
              </View>
            </View>
            <View style={s.pctCircle}>
              <Text style={s.pctTxt}>{pct}%</Text>
            </View>
          </View>
          <TouchableOpacity style={s.startBtn}>
            <Text style={s.startBtnTxt}>Start Practice Session  →</Text>
          </TouchableOpacity>
        </View>

        {/* Question types */}
        <Text style={s.sectionTitle}>Practice Modes</Text>
        <View style={s.qTypesGrid}>
          {QUESTION_TYPES.map((qt, i) => (
            <TouchableOpacity key={i} style={s.qTypeCard}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>{qt.icon}</Text>
              <Text style={s.qTypeLabel}>{qt.label}</Text>
              <Text style={s.qTypeSub}>{qt.sub}</Text>
              <View style={s.qTypeBadge}><Text style={s.qTypeBadgeTxt}>{qt.count}</Text></View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Practice Tests */}
        <Text style={s.sectionTitle}>Practice Tests</Text>
        <View style={s.practiceTestsCard}>
          {[
            { icon: '⚡', label: 'Chapter-wise Tests',  sub: 'Test one chapter at a time', count: '120+ Tests' },
            { icon: '📋', label: 'Full Syllabus Test',  sub: 'Complete subject mock test',  count: '20 Tests' },
            { icon: '🎯', label: 'Previous Year Papers',sub: '10 years question bank',      count: '50 Papers' },
            { icon: '⏱',  label: 'Timed Challenge',    sub: '30 sec per question',         count: '200+ Qs' },
          ].map((item, i, arr) => (
            <TouchableOpacity key={i}
              style={[s.ptRow, i < arr.length - 1 && s.ptRowBorder]}>
              <View style={s.ptIconBox}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.ptLabel}>{item.label}</Text>
                <Text style={s.ptSub}>{item.sub}</Text>
              </View>
              <View style={s.ptBadge}><Text style={s.ptBadgeTxt}>{item.count}</Text></View>
              <Text style={s.ptArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent attempts */}
        <Text style={s.sectionTitle}>Recent Attempts</Text>
        <View style={s.recentCard}>
          {RECENT.map((r, i) => (
            <View key={i} style={[s.recentRow, i < RECENT.length - 1 && s.recentRowBorder]}>
              <View style={s.recentLeft}>
                <Text style={s.recentSubject}>{r.subject}</Text>
                <Text style={s.recentTopic}>{r.topic}</Text>
              </View>
              <View style={s.recentRight}>
                <View style={[s.scoreBadge, r.score >= 85 && s.scoreBadgeHigh, r.score < 75 && s.scoreBadgeLow]}>
                  <Text style={s.scoreTxt}>{r.score}%</Text>
                </View>
                <Text style={s.recentDate}>{r.date}</Text>
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
  headerRight:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xpBadge:          { backgroundColor: '#F0F0F0', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1.5, borderColor: '#E8E8E8' },
  xpTxt:            { fontSize: 12, fontWeight: '800', color: '#1C1C1E' },
  subChip:          { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#E8E8E8', backgroundColor: '#fff' },
  subChipActive:    { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  subChipTxt:       { fontSize: 13, fontWeight: '800', color: '#8E8E93' },
  subChipTxtActive: { color: '#fff' },
  subjectCard:      { marginHorizontal: 16, backgroundColor: '#1C1C1E', borderRadius: 22, padding: 18, marginBottom: 8 },
  subjectCardTop:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  subjectIconBig:   { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  subjectCardTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  subjectCardSub:   { fontSize: 12, color: '#888', fontWeight: '600', marginTop: 3, marginBottom: 8 },
  progBarBg:        { height: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
  progBarFill:      { height: 5, backgroundColor: '#fff', borderRadius: 3 },
  pctCircle:        { width: 48, height: 48, borderRadius: 24, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  pctTxt:           { fontSize: 13, fontWeight: '900', color: '#fff' },
  startBtn:         { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  startBtnTxt:      { fontSize: 15, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  sectionTitle:     { fontSize: 17, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3, paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },
  qTypesGrid:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  qTypeCard:        { width: '47%', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 16 },
  qTypeLabel:       { fontSize: 14, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3, marginBottom: 4 },
  qTypeSub:         { fontSize: 11, color: '#8E8E93', fontWeight: '600', lineHeight: 16, marginBottom: 10 },
  qTypeBadge:       { backgroundColor: '#F0F0F0', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  qTypeBadgeTxt:    { fontSize: 10, fontWeight: '800', color: '#1C1C1E' },
  practiceTestsCard:{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', overflow: 'hidden', marginBottom: 4 },
  ptRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  ptRowBorder:      { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  ptIconBox:        { width: 44, height: 44, backgroundColor: '#F0F0F0', borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E8E8E8' },
  ptLabel:          { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  ptSub:            { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  ptBadge:          { backgroundColor: '#F0F0F0', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  ptBadgeTxt:       { fontSize: 10, fontWeight: '800', color: '#1C1C1E' },
  ptArrow:          { fontSize: 18, color: '#C7C7CC' },
  recentCard:       { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0F0F0', overflow: 'hidden' },
  recentRow:        { flexDirection: 'row', alignItems: 'center', padding: 14, justifyContent: 'space-between' },
  recentRowBorder:  { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  recentLeft:       {},
  recentSubject:    { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  recentTopic:      { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  recentRight:      { alignItems: 'flex-end', gap: 4 },
  scoreBadge:       { backgroundColor: '#F0F0F0', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 12 },
  scoreBadgeHigh:   { backgroundColor: '#1C1C1E' },
  scoreBadgeLow:    { backgroundColor: '#E8E8E8' },
  scoreTxt:         { fontSize: 13, fontWeight: '900', color: '#fff' },
  recentDate:       { fontSize: 10, color: '#8E8E93', fontWeight: '600' },
});

export default PracticeScreen;