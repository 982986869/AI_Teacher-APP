// src/screens/parent/ParentApp/illustrations/CalendarArt.js
import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, G } from 'react-native-svg';
import { Check } from 'lucide-react-native';
import { st } from '../constants';

export default function CalendarArt() {
  const dark = new Set(['0,1', '0,3', '1,3', '2,1', '2,3', '3,1', '3,3']);
  const soft = '1,1', cols = 5, rows = 4, cw = 42, ch = 28, x0 = 6, y0 = 20;
  const W = cols * cw + 12, Hh = rows * ch + 60, cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = `${r},${c}`;
    cells.push(<Rect key={k} x={x0 + c * cw} y={y0 + r * ch} width={cw - 4} height={ch - 4} rx={3}
      fill={dark.has(k) ? '#0E3D1E' : soft === k ? '#63C983' : '#A3ECBE'} stroke="#0E3D1E" strokeWidth={1.4} />);
  }
  const ticks = [];
  for (let i = 0; i < cols + 1; i++) ticks.push(<Line key={i} x1={x0 + i * cw} y1={5} x2={x0 + i * cw} y2={16} stroke="#0E3D1E" strokeWidth={2} strokeLinecap="round" />);
  return (
    <View style={{ width: W, height: Hh }}>
      <Svg width={W} height={Hh} viewBox={`0 0 ${W} ${Hh}`}>{ticks}{cells}</Svg>
      <View style={st.checkBadge}><Check size={17} color="#0E3D1E" strokeWidth={3.5} /></View>
      <Svg width={46} height={52} viewBox="0 0 46 52" style={{ position: 'absolute', right: 6, bottom: -6 }}>
        <G rotation={12} originX={23} originY={26}>
          <Rect x={14} y={4} width={10} height={26} rx={5} fill="#fff" stroke="#0E3D1E" strokeWidth={2.2} />
          <Rect x={6} y={22} width={30} height={24} rx={11} fill="#fff" stroke="#0E3D1E" strokeWidth={2.2} />
        </G>
      </Svg>
    </View>
  );
}
