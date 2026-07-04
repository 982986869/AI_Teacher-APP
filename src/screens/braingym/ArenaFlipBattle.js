// src/screens/braingym/ArenaFlipBattle.js
// "Flip It Up" Arena flow: choice → animated how-to (a demo that solves itself) →
// game (solve 3 boards) → +points → streak → back to the Arena wheel.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { scrambleFlip, solveFlip, flipAt, FLIP_N } from './arenaLogic';
import { play } from '../../utils/sound';
import ArenaFlipGame from './ArenaFlipGame';
import PracticeReward from './PracticeReward';

const { width: SCREEN_W } = Dimensions.get('window');
const UP = '#D838C8';
const DOWN = '#2A2A30';

// auto-playing demo: scramble, then tap the solution coins one by one, loop
function FlipHowTo({ onPlay, onExit }) {
  const [grid, setGrid] = useState(() => scrambleFlip().grid);
  const [tapCell, setTapCell] = useState(-1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cur = grid.slice();
    let taps = solTaps(cur);
    let idx = 0; let t;
    const run = () => {
      if (idx < taps.length) {
        const cell = taps[idx]; setTapCell(cell);
        t = setTimeout(() => {
          cur = flipAt(cur, cell); setGrid(cur.slice()); setTapCell(-1); idx += 1;
          t = setTimeout(run, 480);
        }, 620);
      } else {
        setDone(true);
        t = setTimeout(() => {
          const ns = scrambleFlip().grid; cur = ns.slice(); setGrid(cur); taps = solTaps(cur); idx = 0; setDone(false); run();
        }, 1700);
      }
    };
    run();
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cell = 60, dot = cell * 0.74;
  const center = (i) => i * cell + cell / 2;
  const board = FLIP_N * cell;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}
      <View style={s.htHead}>
        <TouchableOpacity onPress={onExit} style={s.x} activeOpacity={0.85}><Text style={s.xTxt}>✕</Text></TouchableOpacity>
        <Text style={s.htTitle}>FLIP IT UP</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.center}>
        <Text style={s.htRule}>Tap a coin to flip it <Text style={{ color: '#fff' }}>and its neighbours</Text>. Turn them all magenta!</Text>
        <View style={{ width: board, height: board, marginTop: 18 }}>
          {Array.from({ length: FLIP_N }).map((_, r) => Array.from({ length: FLIP_N }).map((__, c) => {
            const i = r * FLIP_N + c;
            return (
              <View key={i} style={{ position: 'absolute', left: center(c) - dot / 2, top: center(r) - dot / 2, width: dot, height: dot, alignItems: 'center', justifyContent: 'center' }}>
                {tapCell === i && <View style={[s.tapRing, { width: dot + 10, height: dot + 10, borderRadius: dot }]} />}
                <View style={{ width: dot, height: dot, borderRadius: dot, backgroundColor: grid[i] ? UP : DOWN }} />
              </View>
            );
          }))}
        </View>
        <Text style={s.htCap}>{done ? 'All up — solved! 🎉' : 'Watch how a board gets solved…'}</Text>
      </View>
      <View style={s.foot}>
        <TouchableOpacity style={s.play} activeOpacity={0.9} onPress={onPlay}><Text style={s.playTxt}>SOLVE</Text></TouchableOpacity>
        <Text style={s.skip}>Tap SOLVE to start playing</Text>
      </View>
    </SafeAreaView>
  );
}
function solTaps(g) {
  const sol = solveFlip(g); const out = [];
  if (sol) for (let i = 0; i < FLIP_N * FLIP_N; i++) if (sol.mask & (1 << i)) out.push(i);
  return out;
}

export default function ArenaFlipBattle({ onExit, onTabPress }) {
  const [phase, setPhase] = useState('howto'); // howto | game | reward
  const [pts, setPts] = useState(100);
  const mounted = useRef(true);
  useEffect(() => { play('whoosh'); return () => { mounted.current = false; }; }, []); // arena start

  const finish = useCallback((points) => { if (!mounted.current) return; play('victory'); setPts(points); setPhase('reward'); }, []);

  if (phase === 'game') return <ArenaFlipGame onExit={onExit} onGameOver={finish} />;
  if (phase === 'reward') return <PracticeReward points={pts} activeTab="arena" onTabPress={onTabPress} onDone={onExit} />;
  return <FlipHowTo onPlay={() => setPhase('game')} onExit={onExit} />;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  htHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  x: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  xTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
  htTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  htRule: { color: '#C7C7CD', fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  tapRing: { position: 'absolute', borderWidth: 3, borderColor: '#FFD75E' },
  htCap: { color: '#EDEDF2', fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 22, minHeight: 24 },
  foot: { paddingHorizontal: 22, paddingBottom: Platform.OS === 'ios' ? 24 : 18 },
  play: { backgroundColor: '#39D98A', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  playTxt: { color: '#06210F', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  skip: { color: '#6E6E77', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 8 },
});
