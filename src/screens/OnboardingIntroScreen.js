import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, StatusBar, Animated, Easing } from 'react-native';
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
// design board (assets/brand/README.md documents the crop rule). Slide 3 is the
// odd one out: its reference has no photo, just a dark progress/achievement/
// streak graphic (390x304, cropped from the user's own Figma export — not part
// of the same source board as slides 1-2), so it renders as a contained `graphic`
// Image sized to the top of the frame instead of a `image` full-bleed background,
// and skips welcome-scrim.png — that scrim exists to darken a photo into
// legibility, and this graphic is already dark by construction.
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
    graphic: require('../../assets/brand/onboarding-3-graph.png'),
    graphicRatio: 390 / 304,
    // The peak dot's pixel position in the 390x304 crop (found by scanning for
    // the brightest pixel) — since the Image renders at this exact aspect
    // ratio with resizeMode="contain", there's no letterboxing, so these
    // percentages line up with the glow overlay 1:1.
    shineAt: { left: '77.4%', top: '8.9%' },
    title: 'Track Your Progress',
    body: 'Complete lessons, earn achievements, and improve every day. Your math & science superpower.',
  },
];

export default function OnboardingIntroScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const next = () => {
    if (index < SLIDES.length - 1) setIndex(index + 1);
    else navigation.navigate('SignupScreen');
  };

  // The peak dot's shine: a halo that breathes out and fades, looping.
  const shine = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!slide.shineAt) return undefined;
    const loop = Animated.loop(
      Animated.timing(shine, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [slide.shineAt, shine]);
  const shineScale = shine.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.6] });
  const shineOpacity = shine.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.7, 0.15, 0] });

  return (
    <View style={styles.root}>
      {/* Every slide is light at the top now — the photos are unscrimmed (their upper
          half is bright lavender) and slide 3 is a white page. Light icons would
          disappear on all three. */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {slide.graphic ? (
        <View style={styles.graphicWrap}>
          {/* The art is dark by construction and the page is white, so it needs a
              deliberate home rather than floating: a soft-yellow accent panel with
              the graphic clipped into a rounded, shadowed frame inside it. Reads as
              a framed illustration instead of an orphaned dark rectangle. */}
          <View style={styles.graphicPanel}>
            <View style={[styles.graphicFrame, { aspectRatio: slide.graphicRatio }]}>
              <Image source={slide.graphic} style={StyleSheet.absoluteFill} resizeMode="cover" />
              {!!slide.shineAt && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.shine,
                    slide.shineAt,
                    { opacity: shineOpacity, transform: [{ scale: shineScale }] },
                  ]}
                />
              )}
            </View>
          </View>
        </View>
      ) : (
        // No SCRIM any more. That overlay existed to darken the photo so WHITE
        // copy could sit on it; the copy now lives in a white sheet instead, so the
        // scrim would only dim the art for nothing.
        <Image source={slide.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.copy}>{slide.body}</Text>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={i === index ? styles.dotActive : styles.dot} />
          ))}
        </View>

        <PrimaryButton label={index === SLIDES.length - 1 ? 'Start Learning' : 'Next'} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'flex-end',
  },
  // flex:1 so it absorbs whatever space `body` doesn't need, pushing body to
  // the bottom the same way the flex-end image slides do — independent of
  // root's justifyContent, which only matters when no child claims the slack.
  graphicWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  // Soft-yellow accent panel — the brand tint doing the work of separating the
  // dark art from the white page.
  graphicPanel: {
    width: '100%',
    backgroundColor: COLORS.glow,
    borderRadius: 28,
    padding: 14,
  },
  graphicFrame: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A1140',
    shadowColor: '#111111',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  // Centered on slide.shineAt via marginLeft/Top so the anchor point (not the
  // circle's own top-left corner) sits exactly on the peak dot.
  shine: {
    position: 'absolute',
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
  },
  // The copy sits in a white sheet over the art — the headline is ink now, and ink
  // on a photograph is unreadable no matter how the photo is scrimmed. Matches the
  // welcome screen, so the two read as one flow.
  body: {
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
    backgroundColor: COLORS.primary,
  },
});
