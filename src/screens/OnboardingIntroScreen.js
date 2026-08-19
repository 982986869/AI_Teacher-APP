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
    // The export itself has a dead transparent margin baked into its right edge
    // (~13% of the 390px width) — the real graph content only fills the left
    // ~87%, which reads as visibly off-centre on screen. Cropped out below so
    // the content, not the raw canvas, is what gets centred.
    graphicRightCrop: 0.13,
    // The peak dot's pixel position in the ORIGINAL 390x304 crop (found by
    // scanning for the brightest pixel) — left is re-derived at render time
    // against the cropped frame; top is untouched since only width is cropped.
    shineAt: { left: '77.4%', top: '8.9%' },
    title: 'Track Your Progress',
    body: 'Complete lessons, earn achievements, and improve every day. Your math & science superpower.',
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

  // shineAt is calibrated against the ORIGINAL (uncropped) image; re-derive it
  // against the cropped, content-only frame the box actually renders now.
  const cropFrac = slide.graphicRightCrop || 0;
  const adjustedShineAt = slide.shineAt
    ? { top: slide.shineAt.top, left: `${parseFloat(slide.shineAt.left) / (1 - cropFrac)}%` }
    : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {slide.graphic ? (
        <View style={styles.graphicWrap}>
          <View style={{ width: '100%', aspectRatio: slide.graphicRatio * (1 - cropFrac), overflow: 'hidden' }}>
            <Image
              source={slide.graphic}
              style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${100 / (1 - cropFrac)}%` }}
              resizeMode="contain"
            />
            {!!slide.shineAt && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shine,
                  adjustedShineAt,
                  { opacity: shineOpacity, transform: [{ scale: shineScale }] },
                ]}
              />
            )}
          </View>
        </View>
      ) : (
        <>
          {/* The export is already cropped to the 390x844 frame, so it drops straight in. */}
          <Image source={slide.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Image source={SCRIM} style={StyleSheet.absoluteFill} resizeMode="stretch" />
        </>
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
  // Centered on slide.shineAt via marginLeft/Top so the anchor point (not the
  // circle's own top-left corner) sits exactly on the peak dot.
  shine: {
    position: 'absolute',
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
    borderRadius: 7,
    backgroundColor: '#C084FC',
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
