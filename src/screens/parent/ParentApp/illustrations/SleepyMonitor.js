// src/screens/parent/ParentApp/illustrations/SleepyMonitor.js
import React from 'react';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';

export default function SleepyMonitor() {
  return (
    <Svg width={44} height={38} viewBox="0 0 46 40">
      <Rect x={4} y={4} width={38} height={26} rx={4} stroke="#CDCFD3" strokeWidth={2.5} fill="none" />
      <Path d="M15 20c1.5-2 4.5-2 6 0M25 20c1.5-2 4.5-2 6 0" stroke="#CDCFD3" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Path d="M18 34h10M23 30v4" stroke="#CDCFD3" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <SvgText x={33} y={11} fontSize={9} fill="#CDCFD3">z</SvgText>
    </Svg>
  );
}
