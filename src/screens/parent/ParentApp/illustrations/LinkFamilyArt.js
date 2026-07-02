// src/screens/parent/ParentApp/illustrations/LinkFamilyArt.js
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { C } from '../constants';

export default function LinkFamilyArt() {
  return (
    <Svg width="150" height="120" viewBox="0 0 150 120">
      <Defs>
        <LinearGradient id="lg" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={C.blueSoft} /><Stop offset="100%" stopColor="#DCE6FF" />
        </LinearGradient>
      </Defs>
      <Circle cx="75" cy="60" r="54" fill="url(#lg)" />
      <Circle cx="58" cy="52" r="15" fill="#F2C6A0" />
      <Path d="M40 96 q0 -22 18 -22 t18 22 z" fill={C.blue} />
      <Circle cx="92" cy="60" r="12" fill="#F5D0AE" />
      <Path d="M78 96 q0 -18 14 -18 t14 18 z" fill={C.orange} />
      <Path d="M75 40 c-3 -6 -12 -4 -12 3 c0 5 7 9 12 13 c5 -4 12 -8 12 -13 c0 -7 -9 -9 -12 -3 z" fill={C.red} />
    </Svg>
  );
}
