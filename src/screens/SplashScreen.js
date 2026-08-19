import React, { useEffect, useRef } from 'react';
import {
  View, Text, Image, Animated, Easing, StyleSheet, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, FONT_FAMILY, MOTION } from '../theme/designSystem';

const LOGO = require('../../assets/brand/logo.png');

const TAGLINE = 'Learn Smarter with AI';
const HOLD_AFTER_FILL = 250;    // beat after the progress bar tops out
const PROGRESS_DURATION = 2200; // full sweep of the loader

// The design frame is 390 wide; the bar is a 326px fill inside 32px padding.
const { width: SCREEN_W } = Dimensions.get('window');
const BAR_WIDTH = Math.min(SCREEN_W - 32 * 2, 326);

// AppNavigator renders this as <SplashScreen onFinish={...} /> with NO navigation
// prop, so we must NOT call navigation.replace here. When the intro finishes we
// call onFinish() (optional) to let AppNavigator move on. AppNavigator also has
// its own timer, so onFinish is just a nicety.
export default function SplashScreen({ onFinish }) {
  const insets = useSafeAreaInsets();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.86)).current;
  const tagline     = useRef(new Animated.Value(0)).current;
  const progress    = useRef(new Animated.Value(0)).current;   // JS-driven (animates width)

  useEffect(() => {
    const intro = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: MOTION.fade.duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: MOTION.scaleBounce.damping,
        stiffness: MOTION.scaleBounce.stiffness,
        mass: MOTION.scaleBounce.mass,
        useNativeDriver: true,
      }),
      Animated.timing(tagline, {
        toValue: 1,
        duration: MOTION.fade.duration,
        delay: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    // Progress Fill runs on its own value: it animates `width`, which the native
    // driver can't handle, so it must stay off the native-driven parallel above.
    const fill = Animated.timing(progress, {
      toValue: 1,
      duration: PROGRESS_DURATION,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    });

    intro.start();
    fill.start(({ finished }) => {
      if (!finished) return;
      setTimeout(() => onFinish && onFinish(), HOLD_AFTER_FILL);
    });

    return () => {
      intro.stop();
      fill.stop();
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={GRADIENTS.splash[0]} translucent={false} />
      <LinearGradient colors={GRADIENTS.splash} style={StyleSheet.absoluteFill} />

      {/* Frame 2147224117 — logo + tagline, 22px apart. Its 187px box sits at
          y 328.69 in the 844 frame, i.e. dead centre, so it just centres here. */}
      <View style={styles.center}>
        <Animated.Image
          source={LOGO}
          resizeMode="contain"
          style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        />
        <Animated.Text style={[styles.tagline, { opacity: tagline }]}>{TAGLINE}</Animated.Text>
      </View>

      {/* splash-bottom — the bar's baseline sits 90px above the frame bottom, of
          which 34px is the home-indicator area the OS already reserves. */}
      <View style={[styles.barWrap, { paddingBottom: insets.bottom + 56 }]}>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              { width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, BAR_WIDTH] }) },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    height: 143,
  },
  tagline: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 16,
    lineHeight: 22,
    // Figma reads 50% tracking = 8px. That is very wide for 16px text, so it is
    // pulled out here as an obvious dial rather than buried in the style.
    letterSpacing: 8,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 22,          // Frame 2147224117 gap
  },
  barWrap: {
    alignItems: 'center',
  },
  barTrack: {
    width: BAR_WIDTH,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
