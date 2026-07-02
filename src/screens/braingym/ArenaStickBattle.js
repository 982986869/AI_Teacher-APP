// src/screens/braingym/ArenaStickBattle.js
// "Matchsticks" Arena flow (Cuemath-style): choice/how-to (an animated demo that fixes
// an equation by itself, looping like a short video) → game (fix N equations by moving
// one matchstick, picked from 3 options) → +points → streak → back to the Arena wheel.
// Matches the ArenaFlipBattle pattern (howto → game → reward).
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { tokensFor, buildRun } from './stickLogic';
import PracticeReward from './PracticeReward';

const AMBER = '#F2A93B';      // lit matchstick
const AMBER_TIP = '#E5532B';  // stick head
const OFF = '#23232B';        // unlit slot
const GREEN = '#39D98A';
const RED = '#F0564B';

const POINTS_PER = 15;
const LIVES = 3;
const ROUNDS = 8;

// ── Matchstick rendering ─────────────────────────────────────────────────────
// A single stick (rounded bar) with a little coloured "head" for the matchstick look.
function Stick({ x, y, w, h, on, vertical, glow }) {
  const color = on ? AMBER : OFF;
  return (
    <View style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: Math.min(w, h) / 2, backgroundColor: color, shadowColor: glow ? AMBER : 'transparent', shadowOpacity: glow ? 0.9 : 0, shadowRadius: glow ? 8 : 0 }}>
      {on && <View style={{ position: 'absolute', left: vertical ? (w - 5) / 2 : 0, top: vertical ? 0 : (h - 5) / 2, width: vertical ? 5 : 5, height: vertical ? 5 : 5, borderRadius: 3, backgroundColor: AMBER_TIP }} />}
    </View>
  );
}

// One seven-segment digit built from 7 sticks.
function MDigit({ segs, s }) {
  const T = Math.round(s * 0.09) + 2;          // stick thickness
  const W = Math.round(s * 0.62);              // digit width
  const H = s;                                 // digit height
  const I = T;                                 // inset
  const vLen = (H - T) / 2 - I + T;            // vertical length (slight overlap looks joined)
  const has = (k) => segs.has(k);
  return (
    <View style={{ width: W, height: H }}>
      <Stick x={I} y={0} w={W - 2 * I} h={T} on={has('a')} />
      <Stick x={I} y={(H - T) / 2} w={W - 2 * I} h={T} on={has('g')} />
      <Stick x={I} y={H - T} w={W - 2 * I} h={T} on={has('d')} />
      <Stick x={0} y={I} w={T} h={vLen} vertical on={has('f')} />
      <Stick x={W - T} y={I} w={T} h={vLen} vertical on={has('b')} />
      <Stick x={0} y={(H + T) / 2 - T} w={T} h={vLen} vertical on={has('e')} />
      <Stick x={W - T} y={(H + T) / 2 - T} w={T} h={vLen} vertical on={has('c')} />
    </View>
  );
}

// Operators drawn from the same sticks (+ − =).
function MOp({ op, s }) {
  const T = Math.round(s * 0.09) + 2;
  const W = Math.round(s * 0.5);
  const H = s;
  const midY = (H - T) / 2;
  return (
    <View style={{ width: W, height: H, marginHorizontal: 2 }}>
      {op === '-' && <Stick x={2} y={midY} w={W - 4} h={T} on />}
      {op === '+' && <>
        <Stick x={2} y={midY} w={W - 4} h={T} on />
        <Stick x={(W - T) / 2} y={midY - (W - 6) / 2} w={T} h={W - 6} vertical on />
      </>}
      {op === '=' && <>
        <Stick x={2} y={midY - T} w={W - 4} h={T} on />
        <Stick x={2} y={midY + T} w={W - 4} h={T} on />
      </>}
    </View>
  );
}

// A full equation laid out as matchsticks.
function MEquation({ str, size = 64, tint }) {
  const tokens = tokensFor(str);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {tokens.map((t, i) => (
        <View key={i} style={{ marginHorizontal: t.type === 'op' ? 4 : 5 }}>
          {t.type === 'digit'
            ? <View style={tint ? { opacity: 1 } : null}><MDigit segs={t.segs} s={size} /></View>
            : <MOp op={t.op} s={size} />}
        </View>
      ))}
    </View>
  );
}

// ── HOW TO PLAY — auto-playing demo (bad ⇄ good), loops like a short video ─────
const DEMO = { bad: '1+1=3', good: '1+1=2' };
function StickHowTo({ onPlay, onExit }) {
  const [good, setGood] = useState(false);
  const fade = useRef(new Animated.Value(1)).current; // 1 = bad, 0 mid, → good
  const chip = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(chip, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(chip, { toValue: 0.3, duration: 700, useNativeDriver: true }),
    ])).start();
    let alive = true;
    let toggle;
    const run = (showGood) => {
      if (!alive) return;
      Animated.timing(fade, { toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true })
        .start(() => {
          if (!alive) return;
          setGood(showGood);
          Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
          toggle = setTimeout(() => run(!showGood), showGood ? 1500 : 1300);
        });
    };
    toggle = setTimeout(() => run(true), 1300);
    return () => { alive = false; clearTimeout(toggle); };
  }, [fade, chip]);

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}
      <View style={st.head}>
        <TouchableOpacity onPress={onExit} style={st.x} activeOpacity={0.85}><Text style={st.xTxt}>✕</Text></TouchableOpacity>
        <Text style={st.headTitle}>MATCHSTICKS</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={st.center}>
        <Text style={st.rule}>The equation is wrong. Move <Text style={{ color: '#fff' }}>one matchstick</Text> to make it true.</Text>

        <View style={st.stage}>
          <Animated.View style={{ opacity: fade }}>
            <MEquation str={good ? DEMO.good : DEMO.bad} size={64} />
          </Animated.View>
          <Animated.View style={[st.moveChip, { opacity: chip }]}>
            <Text style={st.moveChipTxt}>✦ move 1 stick</Text>
          </Animated.View>
        </View>

        <Text style={[st.caption, good && { color: GREEN }]}>
          {good ? '1 + 1 = 2  ✓  solved!' : 'Watch — one stick turns the 3 into a 2…'}
        </Text>
      </View>

      <View style={st.foot}>
        <TouchableOpacity style={st.play} activeOpacity={0.9} onPress={onPlay}>
          <Text style={st.playTxt}>PLAY ▶</Text>
        </TouchableOpacity>
        <Text style={st.skip}>You can start playing any time</Text>
      </View>
    </SafeAreaView>
  );
}

// ── GAME — fix N equations, pick the right move from 3 options ─────────────────
function StickGame({ onExit, onGameOver }) {
  const [run] = useState(() => buildRun(ROUNDS));
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);   // { opt, correct }
  const [solved, setSolved] = useState(false);   // show the fixed equation on the stage
  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const round = run[idx];

  const next = useCallback((nextLives, nextScore) => {
    if (!mounted.current) return;
    if (idx + 1 >= run.length || nextLives <= 0) { onGameOver(nextScore); return; }
    setIdx((i) => i + 1);
    setPicked(null); setSolved(false); busy.current = false;
  }, [idx, run.length, onGameOver]);

  const choose = (opt) => {
    if (busy.current) return;
    busy.current = true;
    const correct = opt === round.good;
    setPicked({ opt, correct });
    if (correct) {
      const ns = score + POINTS_PER;
      setScore(ns); setSolved(true);
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 240, delay: 500, useNativeDriver: true }),
      ]).start();
      setTimeout(() => next(lives, ns), 900);
    } else {
      const nl = lives - 1;
      setLives(nl);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      setTimeout(() => next(nl, score), 750);
    }
  };

  const tx = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const flashColor = flash.interpolate({ inputRange: [0, 1], outputRange: ['transparent', 'rgba(57,217,138,0.16)'] });

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}
      <View style={st.head}>
        <TouchableOpacity onPress={onExit} style={st.x} activeOpacity={0.85}><Text style={st.xTxt}>✕</Text></TouchableOpacity>
        <Text style={st.headTitle}>MATCHSTICKS</Text>
        <View style={st.hearts}>
          {Array.from({ length: LIVES }).map((_, i) => (
            <Text key={i} style={[st.heart, i >= lives && st.heartOff]}>♥</Text>
          ))}
        </View>
      </View>

      <View style={st.progressRow}>
        <Text style={st.progressTxt}>Round {idx + 1}/{run.length}</Text>
        <Text style={st.scoreTxt}>⭐ {score}</Text>
      </View>

      <View style={st.center}>
        <Text style={st.rule}>Move <Text style={{ color: '#fff' }}>one matchstick</Text> to fix it</Text>

        <Animated.View style={[st.stage, { transform: [{ translateX: tx }] }, { backgroundColor: flashColor }]}>
          <MEquation str={solved ? round.good : round.bad} size={62} />
        </Animated.View>

        <Text style={st.tip}>💡 {round.tip}</Text>

        <View style={st.options}>
          {round.options.map((opt) => {
            const isPicked = picked && picked.opt === opt;
            const state = isPicked ? (picked.correct ? 'ok' : 'bad') : (picked && opt === round.good ? 'reveal' : 'idle');
            return (
              <TouchableOpacity key={opt} activeOpacity={0.9} disabled={!!picked}
                style={[st.opt, state === 'ok' && st.optOk, state === 'bad' && st.optBad, state === 'reveal' && st.optReveal]}
                onPress={() => choose(opt)}>
                <View style={{ transform: [{ scale: 0.5 }] }}>
                  <MEquation str={opt} size={46} />
                </View>
                {state === 'ok' && <Text style={st.optMark}>✓</Text>}
                {state === 'bad' && <Text style={[st.optMark, { color: RED }]}>✕</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Wrapper: howto → game → reward ───────────────────────────────────────────
export default function ArenaStickBattle({ onExit, onTabPress }) {
  const [phase, setPhase] = useState('howto'); // howto | game | reward
  const [pts, setPts] = useState(POINTS_PER);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const finish = useCallback((points) => { if (!mounted.current) return; setPts(Math.max(POINTS_PER, points)); setPhase('reward'); }, []);

  if (phase === 'game') return <StickGame onExit={onExit} onGameOver={finish} />;
  if (phase === 'reward') return <PracticeReward points={pts} activeTab="arena" onTabPress={onTabPress} onDone={onExit} />;
  return <StickHowTo onPlay={() => setPhase('game')} onExit={onExit} />;
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  x: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  xTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
  headTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  hearts: { flexDirection: 'row', gap: 3, minWidth: 36, justifyContent: 'flex-end' },
  heart: { color: RED, fontSize: 16, fontWeight: '900' },
  heartOff: { color: '#2C2C33' },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22, marginTop: 2 },
  progressTxt: { color: '#8A8A93', fontSize: 12, fontWeight: '800' },
  scoreTxt: { color: '#F2A93B', fontSize: 13, fontWeight: '900' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  rule: { color: '#C7C7CD', fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  stage: { minHeight: 96, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 20, backgroundColor: '#141014', borderWidth: 1, borderColor: '#2A2420', alignItems: 'center', justifyContent: 'center' },
  moveChip: { position: 'absolute', top: -10, right: -6, backgroundColor: '#231D08', borderWidth: 1.5, borderColor: '#5A4A12', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  moveChipTxt: { color: '#F2A93B', fontSize: 11, fontWeight: '900' },
  caption: { color: '#EDEDF2', fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 22, minHeight: 24 },
  tip: { color: '#7C7C85', fontSize: 12.5, fontWeight: '700', marginTop: 16, marginBottom: 6 },

  options: { flexDirection: 'row', gap: 12, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  opt: { width: 96, height: 64, borderRadius: 16, backgroundColor: '#141418', borderWidth: 1.5, borderColor: '#2C2C33', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  optOk: { borderColor: GREEN, backgroundColor: '#10241A' },
  optBad: { borderColor: RED, backgroundColor: '#241012' },
  optReveal: { borderColor: GREEN },
  optMark: { position: 'absolute', bottom: 3, right: 6, color: GREEN, fontSize: 14, fontWeight: '900' },

  foot: { paddingHorizontal: 22, paddingBottom: Platform.OS === 'ios' ? 24 : 18 },
  play: { backgroundColor: GREEN, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  playTxt: { color: '#06210F', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  skip: { color: '#6E6E77', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 8 },
});
