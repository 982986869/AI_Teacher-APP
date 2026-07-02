// src/screens/parent/ParentApp/illustrations/TrialHero.js
import React from 'react';
import Svg, { Path, Rect, Circle, G, Text as SvgText } from 'react-native-svg';
import { C } from '../constants';

export default function TrialHero() {
  return (
    <Svg width="100%" height="150" viewBox="0 0 300 150">
      <G>
        <SvgText x="26" y="52" fontSize="30" fontWeight="700" fill="#7A4E00">a</SvgText>
        <SvgText x="20" y="92" fontSize="30" fontWeight="700" fill="#7A4E00">+</SvgText>
        <SvgText x="52" y="92" fontSize="30" fontWeight="700" fill="#7A4E00">−2</SvgText>
        <SvgText x="30" y="128" fontSize="26" fontWeight="700" fill="#7A4E00">÷</SvgText>
      </G>
      <Path d="M150 150 q-46 0 -46 -34 q0 -20 46 -20 t46 20 q0 34 -46 34 z" fill={C.blue} />
      <Rect x="192" y="96" width="16" height="18" rx="6" fill="#E7B48C" />
      <Circle cx="200" cy="78" r="27" fill="#F2C6A0" />
      <Path d="M173 78 q0 -30 54 0 q-4 -16 -27 -16 t-27 16 z" fill="#3A2A20" />
      <Circle cx="191" cy="80" r="2.6" fill="#2A2A2A" />
      <Circle cx="209" cy="80" r="2.6" fill="#2A2A2A" />
      <Path d="M193 90 q7 7 14 0" stroke="#2A2A2A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <G transform="rotate(-8 176 132)">
        <Rect x="150" y="116" width="56" height="38" rx="6" fill="#14151A" />
        <Rect x="155" y="121" width="46" height="28" rx="3" fill="#DCEBFF" />
        <SvgText x="163" y="140" fontSize="15" fontWeight="800" fill={C.blue}>a+b</SvgText>
      </G>
    </Svg>
  );
}
