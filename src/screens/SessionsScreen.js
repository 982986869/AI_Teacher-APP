import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';

const SESSIONS = [
  { id: 1, subject: 'Physics',     teacher: "Arjun Sir",    date: 'Today',       time: '5:30 PM – 6:30 PM', type: 'Live',     status: 'upcoming',  meet: 'Google Meet' },
  { id: 2, subject: 'Mathematics', teacher: "Priya Ma'am",  date: 'Tomorrow',    time: '4:00 PM – 5:00 PM', type: 'Live',     status: 'upcoming',  meet: 'Zoom' },
  { id: 3, subject: 'Chemistry',   teacher: "Raj Sir",      date: 'Wed, 12 Jun', time: '6:00 PM – 7:00 PM', type: 'Live',     status: 'upcoming',  meet: 'Google Meet' },
  { id: 4, subject: 'Biology',     teacher: "Sneha Ma'am",  date: 'Thu, 13 Jun', time: '3:30 PM – 4:30 PM', type: 'Recorded', status: 'upcoming',  meet: 'Zoom' },
  { id: 5, subject: 'Physics',     teacher: "Arjun Sir",    date: 'Mon, 3 Jun',  time: '5:30 PM – 6:30 PM', type: 'Live',     status: 'completed', meet: 'Google Meet' },
  { id: 6, subject: 'English',     teacher: "Meera Ma'am",  date: 'Sat, 1 Jun',  time: '2:00 PM – 3:00 PM', type: 'Live',     status: 'completed', meet: 'Zoom' },
];

const SUBJECT_EMOJIS = { Physics: '⚛️', Mathematics: '📐', Chemistry: '🧪', Biology: '🧬', English: '📝' };

const SessionsScreen = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const filtered = SESSIONS.filter(s => s.status === activeTab);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}

      <View style={s.header}>
        <Text style={s.headerTitle}>My Sessions</Text>
        <TouchableOpacity style={s.headerBtn}><Text style={s.headerBtnTxt}>+ Book</Text></TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        {[{ n: '12', l: 'Total' }, { n: '8', l: 'Completed' }, { n: '4', l: 'Upcoming' }].map((st, i) => (
          <View key={i} style={s.statBox}>
            <Text style={s.statNum}>{st.n}</Text>
            <Text style={s.statLbl}>{st.l}</Text>
          </View>
        ))}
      </View>

      <View style={s.tabRow}>
        {['upcoming', 'completed'].map(t => (
          <TouchableOpacity key={t} style={[s.tab, activeTab === t && s.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[s.tabTxt, activeTab === t && s.tabTxtActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {filtered.map((sess, idx) => {
          const isNext = sess.status === 'upcoming' && idx === 0;
          return (
            <View key={sess.id} style={[s.sessCard, isNext && s.sessCardDark]}>
              {isNext && <View style={s.nextBadge}><Text style={s.nextBadgeTxt}>NEXT UP</Text></View>}
              <View style={s.sessTop}>
                <View style={[s.sessIconWrap, isNext && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <Text style={{ fontSize: 22 }}>{SUBJECT_EMOJIS[sess.subject] || '📚'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sessSubject, isNext && { color: '#fff' }]}>{sess.subject}</Text>
                  <Text style={[s.sessTeacher, isNext && { color: '#888' }]}>with {sess.teacher}</Text>
                </View>
                <View style={[s.typeBadge, isNext && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <Text style={[s.typeBadgeTxt, isNext && { color: '#ccc' }]}>{sess.type}</Text>
                </View>
              </View>

              <View style={[s.divider, isNext && { backgroundColor: '#333' }]} />

              <View style={s.sessBottom}>
                <View style={s.sessMeta}>
                  <Text style={{ fontSize: 12 }}>📅</Text>
                  <Text style={[s.sessMetaTxt, isNext && { color: '#bbb' }]}>{sess.date}  •  {sess.time}</Text>
                </View>
                <View style={s.sessMeta}>
                  <Text style={{ fontSize: 12 }}>📹</Text>
                  <Text style={[s.sessMetaTxt, isNext && { color: '#bbb' }]}>{sess.meet}</Text>
                </View>
              </View>

              {sess.status === 'upcoming' ? (
                <TouchableOpacity style={[s.actionBtn, isNext && s.actionBtnWhite]}>
                  <Text style={[s.actionBtnTxt, isNext && { color: '#1C1C1E' }]}>
                    {isNext ? 'Join Session  📹' : 'Set Reminder  🔔'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={s.completedRow}>
                  <View style={s.completedBadge}><Text style={s.completedTxt}>✓ Completed</Text></View>
                  <TouchableOpacity style={s.watchBtn}><Text style={s.watchTxt}>Watch Recording</Text></TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#F7F7F7' },
  header:         { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  headerTitle:    { fontSize: 22, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5 },
  headerBtn:      { backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16 },
  headerBtnTxt:   { color: '#fff', fontSize: 13, fontWeight: '800' },
  statsRow:       { flexDirection: 'row', backgroundColor: '#fff', padding: 14, gap: 10, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  statBox:        { flex: 1, alignItems: 'center', backgroundColor: '#F7F7F7', borderRadius: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: '#F0F0F0' },
  statNum:        { fontSize: 20, fontWeight: '900', color: '#1C1C1E' },
  statLbl:        { fontSize: 10, color: '#8E8E93', fontWeight: '700', marginTop: 2 },
  tabRow:         { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  tab:            { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:      { borderBottomColor: '#1C1C1E' },
  tabTxt:         { fontSize: 14, fontWeight: '700', color: '#8E8E93' },
  tabTxtActive:   { color: '#1C1C1E' },
  sessCard:       { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 16 },
  sessCardDark:   { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  nextBadge:      { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 12 },
  nextBadgeTxt:   { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  sessTop:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sessIconWrap:   { width: 46, height: 46, backgroundColor: '#F7F7F7', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#F0F0F0' },
  sessSubject:    { fontSize: 16, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  sessTeacher:    { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  typeBadge:      { backgroundColor: '#F0F0F0', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  typeBadgeTxt:   { fontSize: 10, fontWeight: '800', color: '#1C1C1E' },
  divider:        { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },
  sessBottom:     { gap: 6, marginBottom: 14 },
  sessMeta:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessMetaTxt:    { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  actionBtn:      { backgroundColor: '#F0F0F0', borderRadius: 13, paddingVertical: 12, alignItems: 'center' },
  actionBtnWhite: { backgroundColor: '#fff' },
  actionBtnTxt:   { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  completedRow:   { flexDirection: 'row', gap: 10 },
  completedBadge: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  completedTxt:   { fontSize: 12, fontWeight: '800', color: '#1C1C1E' },
  watchBtn:       { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  watchTxt:       { fontSize: 12, fontWeight: '800', color: '#fff' },
});

export default SessionsScreen;