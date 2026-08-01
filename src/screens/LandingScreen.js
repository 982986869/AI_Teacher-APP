import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import WelcomeHero from '../components/brand/WelcomeHero';
import PrimaryButton from '../components/brand/PrimaryButton';
import { COLORS, TYPE, SPACING, MOTION, FONT_FAMILY } from '../theme/designSystem';

// First screen of the logged-out flow (AuthNavigator's initialRoute).
//
// The design's welcome-body holds exactly four things — headline, body, Get Started,
// Sign In — and nothing else belongs here. Google sign-in and the terms/privacy line
// used to live on this screen and were removed on purpose; don't reintroduce them.
//
//   Get Started → OnboardingIntro (the 3-page intro carousel, then signup)
//   Sign In     → LoginScreen (email)
export default function LandingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(MOTION.slideUp.distance * 1.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        delay: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 600,
        delay: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      {/* Translucent so the hero bleeds to the very top edge, as in the design.
          Safe because the content block is bottom-anchored — nothing can slide
          under the status bar. */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <WelcomeHero />

      <Animated.View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + 20, opacity: fade, transform: [{ translateY: slide }] },
        ]}
      >
        <Text style={styles.display}>Welcome to{'\n'}AILERNOVA</Text>

        <Text style={styles.body}>
          Your personal AI tutor for Math & Science.{'\n'}Clear concepts instantly.
        </Text>

        <PrimaryButton label="Get Started" onPress={() => navigation.navigate('OnboardingIntro')} />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('LoginScreen')}
          style={styles.signInWrap}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.signIn}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'flex-end',
  },
  content: {
    // Figma's welcome-body is 390 wide with 32 padding, but sits at left: -12,
    // which puts its content 12px left of centre. That reads as a stray nudge in
    // the file, not intent, so we centre it — the 326px content width still matches
    // the text-stack exactly. Flip to asymmetric padding if it turns out deliberate.
    paddingHorizontal: SPACING.xl,
  },

  display: {
    ...TYPE.display,
    textAlign: 'center',
  },
  body: {
    ...TYPE.body,
    textAlign: 'center',
    // 12 = text-stack gap, 28 = welcome-body gap (text-stack → button-stack).
    // Both are off the 4/8/16/24/… spacing grid, so they stay literals rather
    // than pretending to be tokens.
    marginTop: 12,
    marginBottom: 28,
  },

  // button-stack hugs at 95px with a 20px gap: 56 (button) + 20 + 19 (link line).
  signInWrap: { alignItems: 'center', marginTop: 20 },
  signIn: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
});
