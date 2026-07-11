// src/screens/braingym/ProfileSelectScreen.js
//
// "Select your profile" — Parent / Student role picker (shown before Home).
//
// Usage:
//   <ProfileSelectScreen onSelect={(role) => {/* 'parent' | 'student' */}} />

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Animated, Easing } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { pressSpring, PRESS_SCALE } from './motion';

const ProfileSelectScreen = ({ onSelect }) => {
  const { user, selectedClass } = useAuth();
  // Show the signed-in student's name + grade (was hardcoded "Kj G12").
  const studentName = (user?.name && String(user.name).trim()) || 'Student';
  const grade = selectedClass ? `G${String(selectedClass).replace(/\D/g, '')}` : '';

  // ── Motion: staggered entrance, gentle idle float on the faces, spring press ──
  const title = useRef(new Animated.Value(0)).current;
  const pCard = useRef(new Animated.Value(0)).current;
  const sCard = useRef(new Animated.Value(0)).current;
  const pPress = useRef(new Animated.Value(1)).current;
  const sPress = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(title, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(pCard, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(sCard, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [title, pCard, sCard, float]);

  const press = (v, to) => pressSpring(v, to).start();
  const titleY = title.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const pCardY = pCard.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const pCardScale = pCard.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const sCardY = sCard.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  const sCardScale = sCard.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F4F6" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#F4F4F6' }} />}

      {/* Parent — light half */}
      <View style={s.parentHalf}>
        <Animated.Text style={[s.title, { opacity: title, transform: [{ translateY: titleY }] }]}>Select your profile</Animated.Text>
        <TouchableOpacity style={s.role} activeOpacity={0.85} onPress={() => onSelect && onSelect('parent')}
          onPressIn={() => press(pPress, PRESS_SCALE)} onPressOut={() => press(pPress, 1)}>
          <Animated.View style={[s.roleInner, { opacity: pCard, transform: [{ translateY: pCardY }, { scale: Animated.multiply(pCardScale, pPress) }] }]}>
            <Text style={s.lblDark}><Text style={s.b}>Parent</Text> – Track progress and more</Text>
            <Animated.View style={[s.face, { backgroundColor: '#3a3a3a', transform: [{ translateY: floatY }] }]}><Text style={{ fontSize: 56 }}>🐻</Text></Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Student — dark half */}
      <View style={s.studentHalf}>
        <TouchableOpacity style={s.role} activeOpacity={0.85} onPress={() => onSelect && onSelect('student')}
          onPressIn={() => press(sPress, PRESS_SCALE)} onPressOut={() => press(sPress, 1)}>
          <Animated.View style={[s.roleInner, { opacity: sCard, transform: [{ translateY: sCardY }, { scale: Animated.multiply(sCardScale, sPress) }] }]}>
            <Text style={s.lblLight}><Text style={s.b}>Student</Text> – Complete the daily workout</Text>
            <Animated.View style={[s.face, s.studentFace, { transform: [{ translateY: floatY }] }]}><Text style={{ fontSize: 58 }}>😉</Text></Animated.View>
            <Text style={s.who}>{studentName}{grade ? <Text style={s.whoGrade}> {grade}</Text> : null}</Text>
          </Animated.View>
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
  roleInner: { alignItems: 'center', gap: 14 },
  lblDark: { fontSize: 16, color: '#1C1C1E' },
  lblLight: { fontSize: 16, color: '#fff' },
  b: { fontWeight: '800' },
  face: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  studentFace: { backgroundColor: '#9b8cf5', borderWidth: 3, borderColor: '#fff' },
  who: { color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 2 },
  whoGrade: { fontSize: 10, color: '#8E8E93', fontWeight: '800' },
});

export default ProfileSelectScreen;