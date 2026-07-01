// src/screens/braingym/ArenaHowToPlay.js
// Animated "how to play" — auto-plays a full demo duel (pieces drop in turn by turn,
// attacked squares lock, the opponent runs out of moves → you win), looping like a
// short video. A PLAY button is ALWAYS visible so the learner can jump in any time.
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Animated,
} from 'react-native';
import { attacks } from './arenaLogic';

const DEMO_N = 4;
// A real, valid 4×4 queen game: u = you (blue), o = opponent (pink).
const FRAMES = [
  { cap: 'Take turns placing ♛ — no two may attack', pcs: [] },
  { cap: 'Your move — tap a glowing safe square', pcs: [['u', 1, 1]] },
  { cap: 'Your queen locks every square it attacks 🔒', pcs: [['u', 1, 1]] },
  { cap: 'The opponent answers on a safe square', pcs: [['u', 1, 1], ['o', 3, 0]] },
  { cap: 'Your move again…', pcs: [['u', 1, 1], ['o', 3, 0], ['u', 2, 3]] },
  { cap: 'No safe square is left for the opponent…', pcs: [['u', 1, 1], ['o', 3, 0], ['u', 2, 3]] },
  { cap: 'They can’t move — YOU WIN! 🏆', pcs: [['u', 1, 1], ['o', 3, 0], ['u', 2, 3]], win: true },
];

function DemoPiece({ by, size }) {
  const s = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    s.setValue(0.2);
    Animated.spring(s, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 12 }).start();
  }, [s]);
  return (
    <Animated.Text style={{ fontSize: size, lineHeight: size * 1.08, fontWeight: '900', color: by === 'u' ? '#8FB8FF' : '#FF8FC2', transform: [{ scale: s }] }}>
      ♛
    </Animated.Text>
  );
}

export default function ArenaHowToPlay({ onPlay, onExit }) {
  const [step, setStep] = useState(0);
  const capOpacity = useRef(new Animated.Value(0)).current;

  // auto-advance through the frames, looping forever (the demo "plays itself")
  useEffect(() => {
    let i = 0;
    let timer;
    const tick = () => {
      setStep(i);
      const dur = FRAMES[i].win ? 2600 : 1650;
      i = (i + 1) % FRAMES.length;
      timer = setTimeout(tick, dur);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  // fade the caption in on each step
  useEffect(() => {
    capOpacity.setValue(0);
    Animated.timing(capOpacity, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [step, capOpacity]);

  const frame = FRAMES[step];
  const pieces = frame.pcs;
  const pieceAt = useMemo(() => {
    const m = new Map();
    pieces.forEach(([by, r, c]) => m.set(`${r},${c}`, by));
    return m;
  }, [pieces]);
  const threatened = useMemo(() => {
    const cells = pieces.map(([, r, c]) => ({ r, c }));
    const occ = new Set(cells.map((c) => `${c.r},${c.c}`));
    const out = new Set();
    for (let r = 0; r < DEMO_N; r++) {
      for (let c = 0; c < DEMO_N; c++) {
        const k = `${r},${c}`;
        if (occ.has(k)) continue;
        if (cells.some((p) => attacks(p, { r, c }, 'queen'))) out.add(k);
      }
    }
    return out;
  }, [pieces]);

  const cell = 52, gap = 6;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}

      <View style={s.head}>
        <TouchableOpacity onPress={onExit} style={s.x} activeOpacity={0.85} accessibilityLabel="Back">
          <Text style={s.xTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={s.title}>HOW TO PLAY</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.body}>
        <Text style={s.game}>No Attack · a 1v1 duel</Text>

        {/* opponent peeking */}
        <View style={s.miniPlayer}><View style={[s.dotAvatar, { backgroundColor: '#E0509A' }]}><Text style={{ fontSize: 14 }}>🙂</Text></View><Text style={s.miniName}>Opponent</Text></View>

        <View style={s.boardPad}>
          {Array.from({ length: DEMO_N }).map((_, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {Array.from({ length: DEMO_N }).map((__, c) => {
                const k = `${r},${c}`;
                const by = pieceAt.get(k);
                const hit = threatened.has(k);
                return (
                  <View
                    key={c}
                    style={[
                      s.cell,
                      { width: cell, height: cell, marginRight: c < DEMO_N - 1 ? gap : 0, marginBottom: r < DEMO_N - 1 ? gap : 0 },
                      (r + c) % 2 === 1 && s.cellAlt,
                      hit && s.cellHit,
                      by && (by === 'u' ? s.cellU : s.cellO),
                    ]}
                  >
                    {by ? <DemoPiece key={`${k}-${by}`} by={by} size={cell * 0.6} /> : hit ? <View style={s.dot} /> : null}
                  </View>
                );
              })}
            </View>
          ))}
          {frame.win && (
            <View style={s.winOverlay} pointerEvents="none">
              <Text style={{ fontSize: 44 }}>🏆</Text>
            </View>
          )}
        </View>

        {/* you */}
        <View style={s.miniPlayer}><View style={[s.dotAvatar, { backgroundColor: '#39D98A' }]}><Text style={{ fontSize: 14 }}>😎</Text></View><Text style={s.miniName}>You</Text></View>

        <Animated.Text style={[s.caption, { opacity: capOpacity }]}>{frame.cap}</Animated.Text>

        {/* progress dots */}
        <View style={s.dots}>
          {FRAMES.map((_, i) => <View key={i} style={[s.pdot, i === step && s.pdotOn]} />)}
        </View>
      </View>

      <View style={s.foot}>
        <View style={s.legend}>
          <View style={s.lItem}><View style={[s.sw, { backgroundColor: '#A85A24' }]}><View style={s.dot} /></View><Text style={s.lTxt}>under attack</Text></View>
          <View style={s.lItem}><View style={[s.sw, { backgroundColor: '#E8843A' }]} /><Text style={s.lTxt}>safe</Text></View>
        </View>
        <TouchableOpacity style={s.play} activeOpacity={0.9} onPress={onPlay} accessibilityRole="button" accessibilityLabel="Play now">
          <Text style={s.playTxt}>PLAY ▶</Text>
        </TouchableOpacity>
        <Text style={s.skipHint}>You can start playing any time</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  x: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  xTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  game: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  miniPlayer: { flexDirection: 'row', alignItems: 'center', gap: 7, marginVertical: 7 },
  dotAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  miniName: { color: '#9A9AA0', fontSize: 12, fontWeight: '800' },

  boardPad: { backgroundColor: '#141013', borderRadius: 18, borderWidth: 1, borderColor: '#2A2024', padding: 10 },
  cell: { borderRadius: 9, backgroundColor: '#E8843A', borderWidth: 1.5, borderColor: '#C96A22', alignItems: 'center', justifyContent: 'center' },
  cellAlt: { backgroundColor: '#D9772F' },
  cellHit: { backgroundColor: '#A85A24', borderColor: '#8A4A1C' },
  cellU: { backgroundColor: '#10141F', borderColor: '#3D6FE6', borderWidth: 2 },
  cellO: { backgroundColor: '#1F0F19', borderColor: '#E0509A', borderWidth: 2 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(224,50,46,0.6)' },
  winOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,40,20,0.6)', borderRadius: 18 },

  caption: { color: '#EDEDF2', fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 16, minHeight: 40, paddingHorizontal: 26, lineHeight: 21 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 4 },
  pdot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2C2C34' },
  pdotOn: { backgroundColor: '#39D98A', width: 18 },

  foot: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: Platform.OS === 'ios' ? 22 : 16 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 12 },
  lItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sw: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#8A4A1C', alignItems: 'center', justifyContent: 'center' },
  lTxt: { color: '#9A9AA0', fontSize: 12, fontWeight: '700' },
  play: { backgroundColor: '#39D98A', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  playTxt: { color: '#06210F', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  skipHint: { color: '#6E6E77', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 8 },
});
