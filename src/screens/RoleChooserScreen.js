// src/screens/RoleChooserScreen.js
// Shown right after a STUDENT logs in (same login — no separate parent account). The
// user picks how to enter the app this session: the Student experience or the Parent
// dashboard about the same student's progress. The choice sets AuthContext.activeView,
// which AppNavigator routes on; it is remembered until logout and can be switched from
// either app's profile menu.
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

function Card({ emoji, title, body, cta, accent, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[st.card, { borderColor: accent }]}>
      <View style={[st.badge, { backgroundColor: accent }]}><Text style={st.badgeEmoji}>{emoji}</Text></View>
      <View style={st.cardText}>
        <Text style={st.cardTitle}>{title}</Text>
        <Text style={st.cardBody}>{body}</Text>
        <Text style={[st.cta, { color: accent }]}>{cta} →</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function RoleChooserScreen() {
  const { user, setActiveView, signOut } = useAuth();
  const first = user?.name ? String(user.name).split(' ')[0] : 'there';

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}
      <View style={st.top}>
        <View>
          <Text style={st.hi}>Hi {first} 👋</Text>
          <Text style={st.sub}>Who's using the app right now?</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={st.logout}><Text style={st.logoutTxt}>Log out</Text></TouchableOpacity>
      </View>

      <View style={st.center}>
        <Card
          emoji="🎓"
          accent="#5A67E8"
          title="I'm the Student"
          body="Lessons, practice, AI teacher, Arena and your daily learning."
          cta="Continue as Student"
          onPress={() => setActiveView('student')}
        />
        <Card
          emoji="👨‍👩‍👧"
          accent="#16A34A"
          title="I'm the Parent"
          body="Track progress, weekly activity, strengths and what needs help."
          cta="Continue as Parent"
          onPress={() => setActiveView('parent')}
        />
        <Text style={st.foot}>You can switch anytime from the profile menu.</Text>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  hi: { color: '#fff', fontSize: 22, fontWeight: '900' },
  sub: { color: '#9A9AA0', fontSize: 13, fontWeight: '600', marginTop: 4 },
  logout: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#2C2C30' },
  logoutTxt: { color: '#C7C7CD', fontSize: 12, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 40, gap: 18 },
  card: {
    backgroundColor: '#151518', borderRadius: 22, borderWidth: 1.5, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  badge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeEmoji: { fontSize: 30 },
  cardText: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  cardBody: { color: '#9A9AA0', fontSize: 13, fontWeight: '600', marginTop: 5, lineHeight: 19 },
  cta: { fontSize: 13, fontWeight: '800', marginTop: 10 },
  foot: { color: '#6B6B72', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 8 },
});
