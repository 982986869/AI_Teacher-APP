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

      {/* The hero export has the old theme's dark navy scrim BAKED INTO the PNG, so
          no palette change can reach it. The copy therefore moves off the photo and
          into a white sheet that covers that navy — which is what the design shows,
          and it means the art can be re-exported later without touching this. */}
      <Animated.View
        style={[
          styles.sheet,
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
          {/* The prompt is quiet, the action carries the accent — as drawn. */}
          <Text style={styles.signIn}>
            Already have an account? <Text style={styles.signInAction}>Sign In</Text>
          </Text>
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
  // White sheet over the bottom of the hero: 28px top corners, generous padding,
  // and a soft lift so it reads as a card sitting on the photo.
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.xl,
    paddingTop: 32,
    shadowColor: '#111111',
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
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
    color: COLORS.textSecondary,
  },
  signInAction: {
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.accent,
    textDecorationLine: 'underline',
  },
});
