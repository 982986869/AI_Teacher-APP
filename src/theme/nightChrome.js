// src/theme/nightChrome.js
// Shared presentation pieces for screens built on the night palette
// (src/theme/nightTheme.js): the page background and the standard entrance.
//
// Extracted so the auth screens don't each carry their own copy. HomeScreen keeps
// its inline versions on purpose — its blooms are positioned for that layout.
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { N } from './nightTheme';

const { width: W, height: H } = Dimensions.get('window');

// Vertical gradient + a violet bloom behind the top badge and a faint blue one
// bottom-left. `id` must be unique per mounted instance — SVG defs are global,
// so two screens using the same gradient id can collide during a transition.
export function NightBg({ id = 'nb' }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[N.bgTop, N.bgBot]} style={StyleSheet.absoluteFill} />
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={`${id}0`} cx={W * 0.5} cy={H * 0.12} r={W * 0.85} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={N.glow} stopOpacity="0.55" />
            <Stop offset="1" stopColor={N.glow} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`${id}1`} cx={W * 0.1} cy={H * 0.92} r={W * 0.8} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={N.glowBlue} stopOpacity="0.28" />
            <Stop offset="1" stopColor={N.glowBlue} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} fill={`url(#${id}0)`} />
        <Rect x="0" y="0" width={W} height={H} fill={`url(#${id}1)`} />
      </Svg>
    </View>
  );
}

// Fade + rise. Stagger with `delay` to walk the eye down the page.
export function Appear({ delay = 0, y = 14, style, children }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1, duration: 460, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [a, delay]);
  return (
    <Animated.View style={[style, {
      opacity: a,
      transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

export default { NightBg, Appear };
