// src/screens/braingym/ArenaWheel.js
// Cuemath ARENA wheel: a 3-segment radar — STRATEGY GAME (top-left, green) ·
// LOGIC PUZZLE (top-right, grey) · SPEED RUSH (bottom). Tap a segment to select it
// (it turns white), then START launches that game. Each segment → a different game.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polygon, G, Text as SvgText, TextPath, Defs } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import ArcTabs from './ArcTabs';

const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL = Math.min(SCREEN_W - 56, 300);
const VB = 300, C = 150, R = 132, RC = 56, RTEXT = 112, RICON = 86;

const polar = (r, d) => ({ x: C + r * Math.sin((d * Math.PI) / 180), y: C - r * Math.cos((d * Math.PI) / 180) });
const fx = (n) => (+n).toFixed(2);
const slice = (a0, a1) => {
  const p1 = polar(R, a0), p2 = polar(R, a1), lg = a1 - a0 > 180 ? 1 : 0;
  return `M ${C} ${C} L ${fx(p1.x)} ${fx(p1.y)} A ${R} ${R} 0 ${lg} 1 ${fx(p2.x)} ${fx(p2.y)} Z`;
};
const ringArc = (a0, a1, r) => {
  const p1 = polar(r, a0), p2 = polar(r, a1), lg = a1 - a0 > 180 ? 1 : 0;
  return `M ${fx(p1.x)} ${fx(p1.y)} A ${r} ${r} 0 ${lg} 1 ${fx(p2.x)} ${fx(p2.y)}`;
};

// STRATEGY top-left · LOGIC top-right · SPEED RUSH bottom (matches the screenshot)
const SEGS = [
  { key: 'strategy', label: 'STRATEGY GAME', a0: 240, a1: 360, mid: 300, base: '#1C7A45' },
  { key: 'logic',    label: 'LOGIC PUZZLE',  a0: 0,   a1: 120, mid: 60,  base: '#16161A' },
  { key: 'sticks',   label: 'MATCHSTICKS',   a0: 120, a1: 240, mid: 180, base: '#16161A' },
];
const GAME_NAME = { sticks: 'Matchstick Move', strategy: 'Rectangle It', logic: 'Logic Puzzle' };
const RADAR = [22, 38, 54, 70, 150, 168, 186];

function Icon({ k, x, y, selected }) {
  if (k === 'sticks') {                            // two crossed matchsticks (amber)
    const col = selected ? '#1A1A1F' : '#F2A93B';
    return (
      <G>
        <Rect x={x - 12} y={y - 3} width={24} height={5} rx={2.5} fill={col} transform={`rotate(-18 ${x} ${y})`} />
        <Rect x={x - 12} y={y - 1} width={24} height={5} rx={2.5} fill={col} transform={`rotate(18 ${x} ${y})`} />
      </G>
    );
  }
  if (k === 'strategy') {                          // 2×2 dots (Rectangle It)
    const o = 7;
    const col = selected ? '#1A1A1F' : '#CFF5E0';
    return (
      <G>
        {[[-o, -o], [o, -o], [-o, o], [o, o]].map((d, i) => <Circle key={i} cx={x + d[0]} cy={y + d[1]} r={3} fill={col} />)}
      </G>
    );
  }
  // logic: a small cluster of circles
  const col = selected ? '#1A1A1F' : '#6A6A72';
  return (
    <G>
      <Circle cx={x - 7} cy={y - 2} r={4} fill={col} />
      <Circle cx={x + 5} cy={y - 6} r={4} fill={col} />
      <Circle cx={x + 6} cy={y + 6} r={3.4} fill={col} />
    </G>
  );
}

export default function ArenaWheel({ onStartGame, onTabPress, onBack }) {
  const { user } = useAuth();
  const name = user?.name || 'kumkum02';
  const grade = user?.grade || 'G11';
  const [selected, setSelected] = useState('sticks');

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}

      {/* header */}
      <View style={st.header}>
        <View style={st.userRow}>
          <TouchableOpacity onPress={onBack} style={st.back} activeOpacity={0.85} accessibilityLabel="Back">
            <Text style={st.backTxt}>‹</Text>
          </TouchableOpacity>
          <View style={st.avatar}><Text style={{ fontSize: 20 }}>😎</Text></View>
          <View>
            <Text style={st.name}>{name}<Text style={st.grade}> {grade}</Text></Text>
            <Text style={st.xp}>+100</Text>
          </View>
        </View>
        <View style={st.stats}>
          <View style={st.boltPill}><Text style={{ fontSize: 12 }}>⚡⚡</Text></View>
          <View style={st.badge}><Text style={{ fontSize: 13 }}>🏆</Text></View>
          <View style={[st.badge, st.badgeRed]}><Text style={st.badgeRedTxt}>2</Text></View>
        </View>
      </View>

      <View style={st.infoWrap}><View style={st.info}><Text style={st.infoTxt}>i</Text></View></View>

      {/* wheel */}
      <View style={st.wheelWrap}>
        <View style={{ width: WHEEL, height: WHEEL }}>
          <Svg width={WHEEL} height={WHEEL} viewBox={`0 0 ${VB} ${VB}`}>
            <Defs>
              {SEGS.filter((s) => s.mid !== 180).map((s) => (
                <Path key={'p' + s.key} id={`arc-${s.key}`} d={ringArc(s.a0 + 12, s.a1 - 12, RTEXT)} />
              ))}
            </Defs>

            {RADAR.map((r, i) => (
              <Circle key={i} cx={C} cy={C} r={r} fill="none" stroke={i % 3 === 0 ? '#1C1C22' : '#141418'} strokeWidth={1} />
            ))}

            {/* segments (tappable to select) */}
            {SEGS.map((s) => {
              const sel = s.key === selected;
              return (
                <Path key={s.key} d={slice(s.a0, s.a1)}
                  fill={sel ? '#FFFFFF' : s.base}
                  stroke={sel ? '#FFFFFF' : '#2A2A30'} strokeWidth={sel ? 2 : 1.5}
                  onPress={() => setSelected(s.key)} />
              );
            })}

            <Circle cx={C} cy={C} r={RC + 6} fill="#0B0B0D" />

            {/* icons */}
            {SEGS.map((s) => { const p = polar(RICON, s.mid); return <Icon key={'ic' + s.key} k={s.key} x={p.x} y={p.y} selected={s.key === selected} />; })}

            {/* labels */}
            {SEGS.map((s) => {
              const sel = s.key === selected;
              const color = sel ? '#1A1A1F' : s.base === '#1C7A45' ? '#DFF7EA' : '#8A8A92';
              if (s.mid === 180) {
                const p = polar(RTEXT, 180);
                return <SvgText key={'lbl-' + s.key} x={p.x} y={p.y + 4} fill={color} fontSize={11} fontWeight="800" letterSpacing={2} textAnchor="middle">{s.label}</SvgText>;
              }
              return (
                <SvgText key={'lbl-' + s.key} fill={color} fontSize={10.5} fontWeight="800" letterSpacing={2}>
                  <TextPath href={`#arc-${s.key}`} startOffset="50%" textAnchor="middle">{s.label}</TextPath>
                </SvgText>
              );
            })}
          </Svg>

          {/* START hub */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => onStartGame && onStartGame(selected)}
            style={[st.start, { left: WHEEL / 2, top: WHEEL / 2, width: (WHEEL * 2 * RC) / VB, height: (WHEEL * 2 * RC) / VB, borderRadius: (WHEEL * RC) / VB, marginLeft: -(WHEEL * RC) / VB, marginTop: -(WHEEL * RC) / VB }]}
            accessibilityRole="button" accessibilityLabel={`Start ${GAME_NAME[selected]}`}>
            <Text style={st.startTxt}>START</Text>
          </TouchableOpacity>
        </View>

        <Text style={st.subtitle}>{GAME_NAME[selected]}</Text>
        <Text style={st.hintTap}>tap a segment to switch game</Text>
      </View>

      {/* bottom tabs */}
      <ArcTabs active="arena" onTabPress={onTabPress} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: -3 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#39D98A', alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  grade: { color: '#8E8E93', fontSize: 9, fontWeight: '800' },
  xp: { color: '#39D98A', fontSize: 12, fontWeight: '800', marginTop: 1 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boltPill: { borderWidth: 1.5, borderColor: '#5A4A12', backgroundColor: '#231D08', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  badgeRed: { backgroundColor: '#E0322E', borderColor: '#E0322E' },
  badgeRedTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },

  infoWrap: { alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 2 },
  info: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  infoTxt: { color: '#8E8E93', fontSize: 13, fontWeight: '900', fontStyle: 'italic' },

  wheelWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  start: { position: 'absolute', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#fff', shadowOpacity: 0.18, shadowRadius: 16, elevation: 6 },
  startTxt: { color: '#0B0B0D', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  subtitle: { color: '#fff', fontSize: 19, fontWeight: '900', marginTop: 22, letterSpacing: -0.2 },
  hintTap: { color: '#6E6E77', fontSize: 11, fontWeight: '700', marginTop: 6 },
});
