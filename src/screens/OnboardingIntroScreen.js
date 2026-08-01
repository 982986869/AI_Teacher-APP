import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PrimaryButton from '../components/brand/PrimaryButton';
import { COLORS, TYPE, SPACING } from '../theme/designSystem';

// The 3-page intro carousel between the welcome screen and signup.
//
// NOT the same thing as OnboardingScreen.js — that one is the post-login survey
// (grade, subjects, goals) and stays exactly where it is in AppNavigator. This is
// the logged-out intro from the design file.
//
// Slides 1 and 2 are finished — copy inspected off Figma, art cropped from the
// design board (assets/brand/README.md documents the crop rule). Slide 3 is an
// open handoff; read the block on it before touching this file.
const SLIDES = [
  {
    image: require('../../assets/brand/onboarding-1.jpg'),
    title: 'Personalized Learning',
    body: 'Learn at your own pace with AI lessons created just for you. No pressure, only growth.',
  },
  {
    image: require('../../assets/brand/onboarding-2.jpg'),
    title: 'Interactive AI Lessons',
    body: 'Watch, ask questions, practice, and learn with your AI tutor. Education that answers back.',
  },
  {
    // ── UNFINISHED SLIDE — this one is yours ───────────────────────────────────
    // Landed on main deliberately, as a starting point rather than finished work.
    // Everything around it is done: the carousel, the dots, the Next button and the
    // hand-off to Signup all work, and this slide already renders. Only its content
    // is open.
    //
    // What is missing, and where it comes from:
    //   • Copy  — no Figma node exists for page 3 yet. Get one, inspect it, and
    //             replace both strings. Slides 1-2 show the shape to match: a short
    //             heading (TYPE.heading, Poppins 700/26) and two lines of body.
    //   • Art   — the image below is a stand-in: the design board's left-over card,
    //             the one whose caption reads "Your AI Learning Companion". The real
    //             page-3 artwork is still coming. Drop it in as
    //             assets/brand/onboarding-3.jpg (390x844) and this line needs no edit.
    //             assets/brand/README.md has the crop rule if it arrives as another
    //             full board rather than a single screen.
    //
    // Leave the TODO strings visible until then — they are meant to be impossible to
    // miss in a build. Don't swap in plausible-sounding copy; earlier drafts of this
    // slide read as final and nearly shipped that way.
    // ───────────────────────────────────────────────────────────────────────────
    image: require('../../assets/brand/onboarding-3.jpg'),
    title: 'TODO — page 3 title',
    body: 'TODO — page 3 body copy, still to come from Figma.',
  },
];

// The scrim ships as its own layer on this page (unlike the welcome screen, where
// it is baked into the hero export), so it is composited here.
const SCRIM = require('../../assets/brand/welcome-scrim.png');

export default function OnboardingIntroScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const next = () => {
    if (index < SLIDES.length - 1) setIndex(index + 1);
    else navigation.navigate('SignupScreen');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* The export is already cropped to the 390x844 frame, so it drops straight in. */}
      <Image source={slide.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Image source={SCRIM} style={StyleSheet.absoluteFill} resizeMode="stretch" />

      <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.copy}>{slide.body}</Text>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={i === index ? styles.dotActive : styles.dot} />
          ))}
        </View>

        <PrimaryButton label="Next" onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030124',
    justifyContent: 'flex-end',
  },
  // onboarding-body: 32px sides, 20px bottom, 28px between each child.
  // Hugs at 237 = 97 (text-stack) + 28 + 8 (dots) + 28 + 56 (button) + 20.
  body: {
    paddingHorizontal: SPACING.xl,
  },

  title: {
    ...TYPE.heading,
    textAlign: 'center',
  },
  copy: {
    ...TYPE.body,
    fontSize: 15,          // this page runs body one step down from the welcome screen
    lineHeight: 22.5,      // 150%
    textAlign: 'center',
    marginTop: 12,         // text-stack gap
    marginBottom: 28,      // onboarding-body gap
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    height: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
    opacity: 0.3,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C084FC',
  },
});
