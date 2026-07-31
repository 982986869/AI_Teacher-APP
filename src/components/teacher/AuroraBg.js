// src/components/teacher/AuroraBg.js
// The "Neo Aurora" background — four soft pastel radial blobs on a lavender base that
// slowly drift, behind the AI Teacher home. SVG (react-native-svg) so the gradients are
// smooth on Android; the drift runs on the native driver. Sits behind content, no touches.
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// Blob: [cx%, cy%, radius(px), color]
const BLOBS = [
  [0.10, 0.06, 300, '#FFCBE8'],  // pink   top-left
  [0.94, 0.18, 320, '#BFE2FF'],  // blue   top-right
  [0.26, 0.98, 340, '#C4F6DE'],  // green  bottom-left
  [0.92, 0.90, 300, '#E3CCFF'],  // violet bottom-right
];

export default function AuroraBg({ base = '#F1EEFA' }) {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const tx = drift.interpolate({ inputRange: [0, 1], outputRange: [-12, 12] });
  const ty = drift.interpolate({ inputRange: [0, 1], outputRange: [10, -10] });

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: base, transform: [{ translateX: tx }, { translateY: ty }] }]}>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          {BLOBS.map(([cx, cy, r, color], i) => (
            <RadialGradient key={i} id={`ab${i}`} cx={W * cx} cy={H * cy} r={r} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={color} stopOpacity="0.9" />
              <Stop offset="0.6" stopColor={color} stopOpacity="0.35" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>
        {BLOBS.map((_, i) => <Rect key={i} x="0" y="0" width={W} height={H} fill={`url(#ab${i})`} />)}
      </Svg>
    </Animated.View>
  );
}
