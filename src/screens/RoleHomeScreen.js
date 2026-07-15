// src/screens/RoleHomeScreen.js
// Landing for roles whose full dashboard is not built yet (teacher / admin). Prevents
// any leak into the student dashboard while keeping the architecture role-ready.
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, ScrollView,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useAuth } from '../context/AuthContext';
import FacultyCards from '../components/FacultyCards';
import { FACULTY } from '../data/faculty';

const COPY = {
  teacher: { emoji: '🧑‍🏫', title: 'Teacher workspace', body: 'Class rosters, assignments and student insights are on the way. Your teacher account is set up and ready.' },
  admin: { emoji: '🛠️', title: 'Admin console', body: 'Content, users and analytics management are on the way. Your admin account is set up and ready.' },
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
      {/* With no roster yet the hero still centres in the viewport, exactly as before. */}
      <ScrollView contentContainerStyle={[st.scroll, !FACULTY.length && st.scrollEmpty]} showsVerticalScrollIndicator={false}>
        <View style={st.center}>
          <LottieView
            source={require('../../assets/lottie/teacher.json')}
            autoPlay
            loop
            style={st.lottie}
          />
          <Text style={st.title}>{c.title}</Text>
          <Text style={st.body}>{c.body}</Text>
        </View>
        <View style={st.faculty}>
          <FacultyCards title="Your Faculty" dark />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  hi: { color: '#fff', fontSize: 18, fontWeight: '900' },
  logout: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#2C2C30' },
  logoutTxt: { color: '#C7C7CD', fontSize: 12, fontWeight: '800' },
  scroll: { flexGrow: 1, paddingBottom: 28 },
  scrollEmpty: { justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingVertical: 40 },
  lottie: { width: 140, height: 140 },
  // Cancels the FacultyCards rail's -18 bleed so cards start at the screen gutter.
  faculty: { paddingHorizontal: 18 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 14 },
  body: { color: '#9A9AA0', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 10, lineHeight: 21 },
});
