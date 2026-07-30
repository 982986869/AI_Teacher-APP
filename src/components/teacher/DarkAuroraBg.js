// src/components/teacher/DarkAuroraBg.js
// The dark "Aurora" classroom wash — deep violet / magenta / blue radial blooms on a
// near-black purple base, slowly drifting behind the live lesson. Keeps the room dark
// (whiteboard stays crisp) while trading the flat black for an aurora glow. SVG
// (react-native-svg) for smooth gradients; drift runs on the native driver.
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// Blob: [cx fraction, cy fraction, radius(px), color]
const BLOBS = [
  [0.12, 0.00, 340, '#3A2870'],  // violet   top-left
  [1.00, 0.16, 320, '#6A3480'],  // magenta  top-right
  [0.24, 1.04, 380, '#243875'],  // blue     bottom-left
];

export default function DarkAuroraBg({ base = '#120F26' }) {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 12000, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 12000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const tx = drift.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });
  const ty = drift.interpolate({ inputRange: [0, 1], outputRange: [12, -12] });

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: base, transform: [{ translateX: tx }, { translateY: ty }] }]}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          {BLOBS.map(([cx, cy, r, color], i) => (
            <RadialGradient key={i} id={`dab${i}`} cx={W * cx} cy={H * cy} r={r} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={color} stopOpacity="0.85" />
              <Stop offset="0.55" stopColor={color} stopOpacity="0.32" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>
        {BLOBS.map((_, i) => <Rect key={i} x="0" y="0" width={W} height={H} fill={`url(#dab${i})`} />)}
      </Svg>
    </Animated.View>
  );
}
