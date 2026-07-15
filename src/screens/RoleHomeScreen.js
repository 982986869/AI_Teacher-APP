// src/screens/RoleHomeScreen.js
// Landing for roles whose full dashboard is not built yet (teacher / admin). Prevents
// any leak into the student dashboard while keeping the architecture role-ready.
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const COPY = {
  teacher: { emoji: '🧑‍🏫', title: 'Teacher workspace', body: 'Class rosters, assignments and student insights are on the way. Your teacher account is set up and ready.' },
  admin: { emoji: '🛠️', title: 'Admin console', body: 'Your admin account is active. Manage content, users, analytics and settings from the Ailernova Admin Portal on the web.' },
};

export default function RoleHomeScreen({ role = 'teacher' }) {
  const { user, signOut } = useAuth();
  const c = COPY[role] || COPY.teacher;
  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}
      <View style={st.top}>
        <Text style={st.hi}>{user?.name || 'Welcome'}</Text>
        <TouchableOpacity onPress={signOut} style={st.logout}><Text style={st.logoutTxt}>Log out</Text></TouchableOpacity>
      </View>
      <View style={st.center}>
        <Text style={{ fontSize: 64 }}>{c.emoji}</Text>
        <Text style={st.title}>{c.title}</Text>
        <Text style={st.body}>{c.body}</Text>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  hi: { color: '#fff', fontSize: 18, fontWeight: '900' },
  logout: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#2C2C30' },
  logoutTxt: { color: '#C7C7CD', fontSize: 12, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 14 },
  body: { color: '#9A9AA0', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 10, lineHeight: 21 },
});
