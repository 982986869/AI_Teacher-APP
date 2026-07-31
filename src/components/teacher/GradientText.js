// src/components/teacher/GradientText.js
// A single line of text painted with a horizontal gradient — used for the aurora
// greeting name (purple → pink). Uses react-native-svg (masked-view isn't installed).
// The SVG is sized from the string, so it's meant for short labels/names, not paragraphs.
import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

export default function GradientText({
  children,
  colors = ['#7B5CF0', '#E86BB0'],
  size = 36,
  weight = 'Poppins_800ExtraBold',
  widthFactor = 0.62,
}) {
  const text = String(children ?? '');
  const w = Math.max(24, Math.ceil(text.length * size * widthFactor) + 6);
  const h = Math.ceil(size * 1.28);
  const id = `gt${text.length}_${size}`;
  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>
      <SvgText x="0" y={size} fontSize={size} fontFamily={weight} fill={`url(#${id})`}>{text}</SvgText>
    </Svg>
  );
}
