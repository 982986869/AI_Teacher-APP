// src/screens/braingym/ProfileSelectScreen.js
//
// "Select your profile" — the Student / Parent picker shown after login, before
// Home. Rebuilt to the reference: a warm cream page, a green eyebrow pill, the
// heading and sub-line, then two white cards — Student first and lit with the
// brand yellow, Parent second and neutral.
//
// It replaces a split-screen layout (white top half for Parent, near-black bottom
// half for Student, a bear and a wink emoji in circles) that predated the light
// theme and was the last near-black full-page surface outside Brain Gym's games.
//
// ⚠ THE ILLUSTRATIONS ARE NOT IN THE REPO. The reference shows two drawn
// characters — a student with a backpack, a parent with folded arms — and there is
// no such art in assets/. Rather than ship a wrong picture or an empty box, each
// card renders its `art` if one is supplied and falls back to the emoji in a
// tinted panel of the same size and position. Dropping the real art in later is
// one line per card:
//
//     art: require('../../../assets/brand/profile-student.png'),
//
// and the fallback disappears on its own. Keep them roughly 4:5 portrait with a
// transparent background so they sit on the card rather than in a box.
//
// Usage:
//   <ProfileSelectScreen onSelect={(role) => {/* 'parent' | 'student' */}} />

import React, { useRef, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, SafeAreaView, StatusBar, Platform,
  TouchableOpacity, Animated, Easing,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONT_FAMILY } from '../../theme/designSystem';
import { pressSpring, PRESS_SCALE } from './motion';

// Everything comes from the design system except `paper`. The reference ground is
// a WARM off-white; the theme's neutral page (#F7F7F8) is cool, and against it the
// yellow card border reads slightly green. This is the one value the theme has no
// token for, so it is named and explained here rather than left as a loose hex.
const C = {
  paper: '#FAF7F0',
  card: COLORS.background,
  ink: COLORS.textPrimary,
  sub: COLORS.textSecondary,
  hair: COLORS.border,
  primary: COLORS.primary,
  onPrimary: COLORS.ink,        // ink on yellow — yellow is a fill, never a label
  dark: COLORS.ink,
  onDark: COLORS.onInk,
  ok: COLORS.success,
  okSoft: '#E6F6F0',            // the eyebrow pill's fill, same pair used app-wide
  glow: COLORS.glow,
};

const ROLES = [
  {
    key: 'student',
    name: 'Student',
    blurb: 'Complete the daily workout',
    emoji: '🎒',
    art: null,          // ← drop the illustration here
    lit: true,          // the recommended path, so it carries the accent
  },
  {
    key: 'parent',
    name: 'Parent',
    blurb: 'Track progress and more',
    emoji: '👩',
    art: null,
    lit: false,
  },
];

function RoleCard({ role, index, onPress, float }) {
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = Animated.timing(enter, {
      toValue: 1, duration: 460, delay: 160 + index * 110,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    t.start();
    return () => t.stop();
  }, [enter, index]);

  const y = enter.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(role.key)}
      onPressIn={() => pressSpring(press, PRESS_SCALE).start()}
      onPressOut={() => pressSpring(press, 1).start()}
      accessibilityRole="button"
      accessibilityLabel={`I'm a ${role.name}. ${role.blurb}`}
    >
      <Animated.View
        style={[
          s.card,
          role.lit && s.cardLit,
          { opacity: enter, transform: [{ translateY: y }, { scale: Animated.multiply(scale, press) }] },
        ]}
      >
        <View style={s.copy}>
          <Text style={s.eyebrow}>I&apos;m a</Text>
          <Text style={s.name}>{role.name}</Text>
          <Text style={s.blurb}>{role.blurb}</Text>
          <View style={[s.go, role.lit ? s.goLit : s.goDark]}>
            <ArrowRight size={20} strokeWidth={2.6} color={role.lit ? C.onPrimary : C.onDark} />
          </View>
        </View>

        {/* The art column. Floats gently so the page has a pulse without anything
            demanding attention — the same idle motion the old screen used. */}
        <Animated.View style={[s.artWrap, { transform: [{ translateY: float }] }]}>
          {role.art
            ? <Image source={role.art} style={s.art} resizeMode="contain" />
            : <View style={[s.artStub, role.lit && s.artStubLit]}>
                <Text style={s.artEmoji}>{role.emoji}</Text>
              </View>}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const ProfileSelectScreen = ({ onSelect }) => {
  const { user, selectedClass } = useAuth();
  const studentName = (user?.name && String(user.name).trim()) || '';
  const grade = selectedClass ? `Class ${String(selectedClass).replace(/\D/g, '')}` : '';
  const who = [studentName, grade].filter(Boolean).join('  ·  ');

  const head = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(head, {
      toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [head, float]);

  const headY = head.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.paper} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.paper }} />}

      <View style={s.page}>
        <Animated.View style={{ opacity: head, transform: [{ translateY: headY }] }}>
          <View style={s.pill}><Text style={s.pillTxt}>EDUCATIONAL PORTAL</Text></View>
          <Text style={s.title}>Select your profile</Text>
          <Text style={s.subtitle}>Choose how you want to continue</Text>
          {/* Kept from the previous screen: which account is signed in. The
              reference has no such line, but dropping it would leave a shared
              device with no way to tell whose profile is about to open. */}
          {!!who && <Text style={s.who}>{who}</Text>}
        </Animated.View>

        <View style={s.cards}>
          {ROLES.map((r, i) => (
            <RoleCard key={r.key} role={r} index={i} float={floatY} onPress={(k) => onSelect && onSelect(k)} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  page: { flex: 1, paddingHorizontal: 22, paddingTop: 26 },

  pill: {
    alignSelf: 'center', backgroundColor: C.okSoft, borderRadius: 999,
    paddingVertical: 7, paddingHorizontal: 16, borderWidth: 1, borderColor: C.ok,
  },
  pillTxt: {
    fontSize: 11, lineHeight: 14, fontFamily: FONT_FAMILY.bold,
    color: C.ok, letterSpacing: 1.2,
  },
  title: {
    marginTop: 18, textAlign: 'center', fontSize: 29, lineHeight: 36,
    fontFamily: FONT_FAMILY.display, color: C.ink, letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 8, textAlign: 'center', fontSize: 14.5, lineHeight: 20,
    fontFamily: FONT_FAMILY.medium, color: C.sub,
  },
  who: {
    marginTop: 6, textAlign: 'center', fontSize: 12.5, lineHeight: 17,
    fontFamily: FONT_FAMILY.semibold, color: COLORS.textMuted, letterSpacing: 0.2,
  },

  cards: { marginTop: 26, gap: 18 },
  card: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1, borderColor: C.hair,
    paddingLeft: 20, paddingVertical: 20, paddingRight: 0,
    overflow: 'hidden', minHeight: 172,
    // Cards are white on a warm ground, so the lift comes from a soft shadow
    // rather than a heavier border.
    shadowColor: '#111111', shadowOpacity: 0.07, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  // The recommended path. A 2px brand edge, not a yellow fill — the card stays
  // white so the copy on it keeps full contrast.
  cardLit: { borderWidth: 2, borderColor: C.primary },

  copy: { flex: 1, justifyContent: 'center', paddingRight: 8 },
  eyebrow: { fontSize: 13.5, lineHeight: 18, fontFamily: FONT_FAMILY.medium, color: C.sub },
  name: {
    marginTop: 2, fontSize: 27, lineHeight: 34,
    fontFamily: FONT_FAMILY.display, color: C.ink, letterSpacing: -0.5,
  },
  blurb: { marginTop: 8, fontSize: 13, lineHeight: 18, fontFamily: FONT_FAMILY.medium, color: C.sub },
  go: {
    width: 44, height: 44, borderRadius: 22, marginTop: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  goLit: { backgroundColor: C.primary },
  goDark: { backgroundColor: '#2E3A4A' },

  artWrap: { width: '42%', alignItems: 'center', justifyContent: 'flex-end' },
  art: { width: '100%', height: '100%' },
  // Fallback only — see the note at the top of the file.
  artStub: {
    width: '86%', aspectRatio: 0.82, borderRadius: 18,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  artStubLit: { backgroundColor: C.glow },
  artEmoji: { fontSize: 58 },
});

export default ProfileSelectScreen;
