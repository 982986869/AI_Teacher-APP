// src/screens/ParentDashboardScreen.js
// Parent's read-only view of their child's progress. Parents never see the student
// dashboard or attempt content. If no child is linked yet, prompts to link one.
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { linkChild, getParentReport } from '../api/parentApi';

const Card = ({ children, style }) => <View style={[st.card, style]}>{children}</View>;
const Stat = ({ value, label, color }) => (
  <View style={st.stat}><Text style={[st.statVal, color && { color }]}>{value}</Text><Text style={st.statLabel}>{label}</Text></View>
);

export default function ParentDashboardScreen() {
  const { user, signOut } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState('');
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    try { setData(await getParentReport()); } catch (_) { setData({ linked: false }); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doLink = async () => {
    if (!email.trim() || linking) return;
    setLinking(true);
    try { await linkChild({ email: email.trim() }); await load(); }
    catch (e) { Alert.alert('Could not link', e?.response?.data?.error || 'Check the email and try again.'); }
    finally { setLinking(false); }
  };

  if (loading) {
    return <SafeAreaView style={st.safe}><View style={st.center}><ActivityIndicator size="large" color="#39D98A" /></View></SafeAreaView>;
  }

  const linked = data && data.linked;
  const child = data && data.child;
  const bg = (data && data.brainGym) || {};
  const ar = (data && data.arena) || {};

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}

      <View style={st.header}>
        <View>
          <Text style={st.hi}>Hi, {user?.name || 'Parent'} 👋</Text>
          <Text style={st.role}>Parent view</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={st.logout}><Text style={st.logoutTxt}>Log out</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#39D98A" />}>

        {!linked ? (
          <Card>
            <Text style={st.cardTitle}>Link your child</Text>
            <Text style={st.muted}>Enter the email your child uses to log in. You’ll then see their progress here.</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="child@email.com" placeholderTextColor="#5A5A62"
              autoCapitalize="none" keyboardType="email-address" style={st.input} />
            <TouchableOpacity style={[st.btn, (!email.trim() || linking) && st.btnOff]} disabled={!email.trim() || linking} onPress={doLink}>
              {linking ? <ActivityIndicator color="#06210F" /> : <Text style={st.btnTxt}>LINK CHILD</Text>}
            </TouchableOpacity>
          </Card>
        ) : (
          <>
            <Card>
              <Text style={st.childName}>{child.name}</Text>
              <Text style={st.muted}>{[child.className, child.stream ? child.stream.toUpperCase() : null, child.board].filter(Boolean).join(' · ') || 'Class not set'}</Text>
              {!!(child.subjects && child.subjects.length) && <Text style={st.subjects}>{child.subjects.join('  ·  ')}</Text>}
            </Card>

            <Text style={st.section}>BrainGym performance</Text>
            <Card>
              <View style={st.statRow}>
                <Stat value={bg.totalXp ?? 0} label="XP" color="#39D98A" />
                <Stat value={bg.quizzesCompleted ?? 0} label="Quizzes" />
                <Stat value={`${bg.accuracy ?? 0}%`} label="Accuracy" />
                <Stat value={bg.currentStreak ?? 0} label="Streak" />
              </View>
            </Card>

            <Text style={st.section}>Arena</Text>
            <Card>
              <View style={st.statRow}>
                <Stat value={ar.rating ?? 1000} label="Rating" color="#8FB8FF" />
                <Stat value={ar.wins ?? 0} label="Wins" color="#39D98A" />
                <Stat value={ar.losses ?? 0} label="Losses" color="#FF6B62" />
                <Stat value={ar.played ?? 0} label="Played" />
              </View>
            </Card>

            <Text style={st.section}>Areas to focus</Text>
            <Card>
              <Text style={st.weakNum}>{data.openMistakes ?? 0}</Text>
              <Text style={st.muted}>open items in the Mistake Book to revise.</Text>
              <Text style={st.reco}>
                {(bg.accuracy ?? 0) >= 80
                  ? '🌟 Strong accuracy — encourage harder challenges in Arena.'
                  : '💡 Recommend a short daily BrainGym + clearing the Mistake Book.'}
              </Text>
            </Card>

            <Text style={st.section}>Weekly report · Study time · Homework · AI Teacher usage</Text>
            <Card><Text style={st.muted}>Detailed weekly analytics are coming soon.</Text></Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  hi: { color: '#fff', fontSize: 20, fontWeight: '900' },
  role: { color: '#39D98A', fontSize: 12, fontWeight: '800', marginTop: 2 },
  logout: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#2C2C30' },
  logoutTxt: { color: '#C7C7CD', fontSize: 12, fontWeight: '800' },

  body: { paddingHorizontal: 18, paddingBottom: 30 },
  card: { backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262E', borderRadius: 18, padding: 16, marginBottom: 14 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '900', marginBottom: 6 },
  muted: { color: '#9A9AA0', fontSize: 13, fontWeight: '600', lineHeight: 19 },
  input: { backgroundColor: '#0E0E12', borderWidth: 1.5, borderColor: '#2C2C30', borderRadius: 12, color: '#fff', paddingHorizontal: 14, paddingVertical: 12, marginTop: 12, fontSize: 15 },
  btn: { backgroundColor: '#39D98A', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  btnOff: { opacity: 0.4 },
  btnTxt: { color: '#06210F', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },

  childName: { color: '#fff', fontSize: 22, fontWeight: '900' },
  subjects: { color: '#8FB8FF', fontSize: 12, fontWeight: '800', marginTop: 8 },
  section: { color: '#C7C7CD', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4, marginBottom: 10, marginLeft: 4 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statVal: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#8E8E93', fontSize: 11, fontWeight: '700', marginTop: 3 },
  weakNum: { color: '#FFB36B', fontSize: 30, fontWeight: '900' },
  reco: { color: '#D8D8DE', fontSize: 13, fontWeight: '700', marginTop: 12, lineHeight: 19 },
});
