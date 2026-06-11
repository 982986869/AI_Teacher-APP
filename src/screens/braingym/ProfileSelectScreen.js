// src/screens/braingym/ProfileSelectScreen.js
//
// "Select your profile" — Parent / Student role picker (shown before Home).
//
// Usage:
//   <ProfileSelectScreen onSelect={(role) => {/* 'parent' | 'student' */}} />

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity } from 'react-native';

const ProfileSelectScreen = ({ onSelect }) => {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F4F6" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#F4F4F6' }} />}

      {/* Parent — light half */}
      <View style={s.parentHalf}>
        <Text style={s.title}>Select your profile</Text>
        <TouchableOpacity style={s.role} activeOpacity={0.85} onPress={() => onSelect && onSelect('parent')}>
          <Text style={s.lblDark}><Text style={s.b}>Parent</Text> – Track progress and more</Text>
          <View style={[s.face, { backgroundColor: '#3a3a3a' }]}><Text style={{ fontSize: 56 }}>🐻</Text></View>
        </TouchableOpacity>
      </View>

      {/* Student — dark half */}
      <View style={s.studentHalf}>
        <TouchableOpacity style={s.role} activeOpacity={0.85} onPress={() => onSelect && onSelect('student')}>
          <Text style={s.lblLight}><Text style={s.b}>Student</Text> – Complete the daily workout</Text>
          <View style={[s.face, s.studentFace]}><Text style={{ fontSize: 58 }}>😉</Text></View>
          <Text style={s.who}>Kj<Text style={s.whoGrade}> G12</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10' },
  parentHalf: { backgroundColor: '#fff', paddingTop: 18, paddingBottom: 28 },
  studentHalf: { flex: 1, backgroundColor: '#0E0E10', paddingTop: 24 },
  title: { textAlign: 'center', fontSize: 24, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3, marginBottom: 18 },
  role: { alignItems: 'center', gap: 14, paddingHorizontal: 24 },
  lblDark: { fontSize: 16, color: '#1C1C1E' },
  lblLight: { fontSize: 16, color: '#fff' },
  b: { fontWeight: '800' },
  face: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  studentFace: { backgroundColor: '#9b8cf5', borderWidth: 3, borderColor: '#fff' },
  who: { color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 2 },
  whoGrade: { fontSize: 10, color: '#8E8E93', fontWeight: '800' },
});

export default ProfileSelectScreen;