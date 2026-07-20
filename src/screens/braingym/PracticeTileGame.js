// src/screens/braingym/PracticeTileGame.js
// Cuemath-style PRACTICE arcade (stacking falls). A card — the question PLUS its four
// answer tiles — drops from the top. Tap the correct tile before it lands and it pops
// away. Tap wrong, or let it land, and it greys out (showing the right answer) and
// STACKS at the bottom. When the grey stack reaches the top there's no room for a new
// card → GAME OVER. Smooth, wall-clock-free, fully animated.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform,
  TouchableOpacity, Animated, Easing, Dimensions, Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickQuestions } from '../../data/brainGymQuestions';
import { initSounds, playSound } from '../../utils/sound';
import QuitConfirm from './QuitConfirm';
import GoalTip from './GoalTip';
import { pressSpring, PRESS_SCALE } from './motion';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_H = 104;
const GAP = 8;
const SLOT = CARD_H + GAP;
const CARD_W = Math.min(SCREEN_W - 32, 360);
const BASE_FALL_MS = 6500;
const MIN_FALL_MS = 3000;

const COLORS = {
  blue: { bg: '#1A63D6', tile: '#2C80F0', tBorder: '#86B9FF', border: '#5FA0F7' },
  orange: { bg: '#DD7C1B', tile: '#F2962C', tBorder: '#FFCB86', border: '#F4AC5C' },
};
const PALS = ['blue', 'orange'];
const splitQ = (s) => { const p = String(s).split('?'); return [p[0] || '', p.slice(1).join('?') || '']; };

function buildOptions(answer) {
  const a = Number(answer);
  const set = new Set([a]);
  const offsets = [1, -1, 2, -2, 10, -10, 4, a, 5, -3];
  let i = 0;
  while (set.size < 4 && i < offsets.length * 2) {
    const off = offsets[i % offsets.length] + (i >= offsets.length ? 1 + Math.floor(Math.random() * 5) : 0);
    const v = a + off;
    if (v >= 0 && v !== a) set.add(v);
    i += 1;
  }
  while (set.size < 4) set.add(a + set.size + 1);
  const arr = [...set].slice(0, 4);
  for (let j = arr.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [arr[j], arr[k]] = [arr[k], arr[j]]; }
  return arr;
}

const GridBg = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {Array.from({ length: 6 }).map((_, i) => <View key={`v${i}`} style={[st.gridV, { left: `${((i + 1) * 100) / 7}%` }]} />)}
    {Array.from({ length: 11 }).map((_, i) => <View key={`h${i}`} style={[st.gridH, { top: `${((i + 1) * 100) / 12}%` }]} />)}
  </View>
);

// a settled grey card in the stack — just the solved equation
function StackCard({ q, answer, top }) {
  const [pre, post] = splitQ(q);
  const grow = useRef(new Animated.Value(0.96)).current;
  useEffect(() => { Animated.spring(grow, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start(); }, [grow]);
  return (
    <Animated.View style={[st.stackCard, { top, transform: [{ scale: grow }] }]}>
      <Text style={st.stackEq} numberOfLines={1} adjustsFontSizeToFit>{pre}<Text style={st.stackAns}>{answer}</Text>{post}</Text>
    </Animated.View>
  );
}

// One answer tile that springs down on press for tactile feedback.
function AnswerTile({ opt, i, pal, wrong, picked, onPick }) {
  const sc = useRef(new Animated.Value(1)).current;
  const to = (v) => pressSpring(sc, v).start();
  return (
    <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85}
      onPressIn={() => to(PRESS_SCALE)} onPressOut={() => to(1)} onPress={() => onPick(opt, i)}
      accessibilityRole="button" accessibilityLabel={`Answer ${opt}`}>
      <Animated.View style={[st.tile, { backgroundColor: pal.tile, borderColor: pal.tBorder }, wrong && picked === i && st.tileRed, { transform: [{ scale: sc }] }]}>
        <Text style={st.tileTxt}>{opt}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function PracticeTileGame({ skill = 'fluency', level = 2, onExit, onGameOver }) {
  const insets = useSafeAreaInsets();
  const [stack, setStack] = useState([]);
  const [cur, setCur] = useState(null);            // { q, answer, options, color }
  const [phase, setPhase] = useState('falling');   // falling | correct | wrong | landing | over
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [zoneH, setZoneH] = useState(0);
  const [round, setRound] = useState(0);
  const [quit, setQuit] = useState(false);

  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;   // wrong-answer nudge
  const pop = useRef(new Animated.Value(0)).current;      // correct-answer pop
  const overPop = useRef(new Animated.Value(0)).current;  // GAME OVER banner entrance
  const resolvedRef = useRef(false);
  const overRef = useRef(false);
  const mountedRef = useRef(true);
  const scoreRef = useRef(0);
  const stackRef = useRef([]);
  const curRef = useRef(null);  // current card — avoids stale closures in timers

  // Re-arm on mount — refs survive an effect cleanup (Fast Refresh / StrictMode), so
  // a setup that only clears the flag would leave it false and no-op every guarded setState.
  useEffect(() => { mountedRef.current = true; initSounds(); return () => { mountedRef.current = false; }; }, []);
  useEffect(() => { stackRef.current = stack; }, [stack]);
  useEffect(() => {
    if (phase !== 'over') return;
    overPop.setValue(0);
    Animated.spring(overPop, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 12 }).start();
  }, [phase, overPop]);

  const gameOver = useCallback(() => {
    if (overRef.current) return;
    overRef.current = true;
    setPhase('over');
    playSound('wrong');
    setTimeout(() => { if (mountedRef.current && onGameOver) onGameOver(scoreRef.current); }, 1950);
  }, [onGameOver]);

  // drop the current card into the stack (wrong answer or timed out), then next round
  const landToStack = useCallback(() => {
    const card = curRef.current;
    if (!card) { setRound((r) => r + 1); return; }
    setPhase('landing');
    const sh = stackRef.current.length * SLOT;
    const landingY = zoneH - sh - CARD_H;
    Animated.timing(y, { toValue: Math.max(0, landingY), duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true })
      .start(() => {
        if (!mountedRef.current) return;
        setStack((s) => { const ns = [...s, { q: card.q, answer: card.answer }]; stackRef.current = ns; return ns; });
        setRound((r) => r + 1);
      });
  }, [y, zoneH]);

  // spawn a fresh random card each round and start its fall
  useEffect(() => {
    if (!zoneH || overRef.current) return undefined;
    const sh = stackRef.current.length * SLOT;
    if (zoneH - sh - CARD_H < 8) { gameOver(); return undefined; }

    const nq = pickQuestions({ skill, level, count: 1 })[0] || { q: '0 = ?', answer: 0 };
    const card = { q: nq.q, answer: nq.answer, options: buildOptions(nq.answer), color: PALS[Math.floor(Math.random() * PALS.length)] };
    curRef.current = card;
    setCur(card);
    setPhase('falling');
    setPicked(null);
    resolvedRef.current = false;
    y.setValue(0);
    opacity.setValue(1);

    const landingY = zoneH - sh - CARD_H;
    const fallMs = Math.max(MIN_FALL_MS, BASE_FALL_MS - scoreRef.current * 130 - stackRef.current.length * 180);
    // Gravity: accelerate as it drops (matches the landToStack settle curve) so the
    // fall reads as physical weight instead of a constant-velocity, robotic glide.
    const anim = Animated.timing(y, { toValue: landingY, duration: fallMs, easing: Easing.in(Easing.quad), useNativeDriver: true });
    anim.start(({ finished }) => {
      if (finished && !resolvedRef.current) { resolvedRef.current = true; landToStack(); }
    });
    return () => anim.stop();
  }, [round, zoneH]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPick = (opt, i) => {
    if (phase !== 'falling' || resolvedRef.current || !cur) return;
    resolvedRef.current = true;
    setPicked(i);
    y.stopAnimation();
    if (Number(opt) === Number(cur.answer)) {
      setPhase('correct');
      setScore((s) => { scoreRef.current = s + 1; return s + 1; });
      playSound('correct');
      sparkle.setValue(0);
      pop.setValue(0);
      Animated.sequence([
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
        Animated.spring(pop, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 6 }),
      ]).start();
      Animated.timing(sparkle, { toValue: 1, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.timing(opacity, { toValue: 0, duration: 280, delay: 360, useNativeDriver: true }).start();
      setTimeout(() => { if (mountedRef.current) setRound((r) => r + 1); }, 720);
    } else {
      setPhase('wrong');
      playSound('wrong');
      try { Vibration.vibrate(35); } catch (e) {}
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      setTimeout(() => { if (mountedRef.current) landToStack(); }, 220);
    }
  };

  const stackSlots = stack.length;
  const roomLeft = zoneH ? Math.max(0, Math.floor((zoneH - CARD_H) / SLOT) - stackSlots) : 0;
  const dangerRatio = zoneH ? (stackSlots * SLOT) / zoneH : 0;
  const barColor = phase === 'over' || dangerRatio > 0.7 ? '#FF3B30' : dangerRatio > 0.45 ? '#FF9F0A' : '#2BB3FF';

  const pal = cur ? (COLORS[cur.color] || COLORS.blue) : COLORS.blue;
  const correct = phase === 'correct';
  const landing = phase === 'landing';
  const [pre, post] = cur ? splitQ(cur.q) : ['', ''];
  const showTiles = phase === 'falling' || phase === 'wrong';
  const cardBg = correct ? '#0F8A3E' : landing ? '#26262E' : pal.bg;
  const cardBorder = correct ? '#3FD37A' : landing ? '#3A3A42' : pal.border;
  const shakeTx = shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const overScale = overPop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#000' }} />}
      <GridBg />
      <View style={[st.topBar, { backgroundColor: barColor, shadowColor: barColor }]} />

      <View style={st.top}>
        <Text style={st.lives}>∞ <Text style={st.livesNum}>{roomLeft}</Text></Text>
        <View style={st.scoreBox}><Text style={st.scoreTxt}>{score}</Text></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <GoalTip text="Tap the correct answer before the card lands." />
          <TouchableOpacity onPress={() => setQuit(true)} style={st.close} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button" accessibilityLabel="Close practice">
            <Text style={st.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* fall zone */}
      <View style={st.zone} onLayout={(e) => { const h = e.nativeEvent.layout.height; if (h > 0 && Math.abs(h - zoneH) > 2) setZoneH(h); }}>
        {/* settled stack (bottom-up) */}
        {stack.map((c, i) => <StackCard key={i} q={c.q} answer={c.answer} top={zoneH - i * SLOT - CARD_H} />)}

        {/* falling card (question + tiles) */}
        {cur && phase !== 'over' && (
          <Animated.View style={[st.card, { backgroundColor: cardBg, borderColor: cardBorder, opacity, transform: [{ translateY: y }, { translateX: shakeTx }, { scale: popScale }] }]}>
            {correct && (
              <>
                <Animated.Text style={[st.sp, st.spTL, { opacity: sparkle, transform: [{ scale: sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.1] }) }] }]}>✦</Animated.Text>
                <Animated.Text style={[st.sp, st.spBR, { opacity: sparkle, transform: [{ scale: sparkle.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.1] }) }] }]}>✦</Animated.Text>
              </>
            )}
            <Text style={st.eq} numberOfLines={1} adjustsFontSizeToFit>
              {pre}<Text style={{ color: correct || landing ? '#9CF5BE' : '#FFE08A' }}>{phase === 'falling' || phase === 'wrong' ? '?' : cur.answer}</Text>{post}
            </Text>
            {showTiles && (
              <View style={st.tiles}>
                {cur.options.map((opt, i) => (
                  <AnswerTile key={i} opt={opt} i={i} pal={pal} wrong={phase === 'wrong'} picked={picked} onPick={onPick} />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* GAME OVER banner */}
        {phase === 'over' && (
          <Animated.View style={[st.overCard, { transform: [{ scale: overScale }] }]}>
            <Text style={st.overTxt}>GAME OVER</Text>
          </Animated.View>
        )}
      </View>

      <QuitConfirm visible={quit} onQuit={onExit} onCancel={() => setQuit(false)} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.045)' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.045)' },

  topBar: { height: 6, shadowOpacity: 0.9, shadowRadius: 9, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  lives: { color: '#FF7BC0', fontSize: 17, fontWeight: '900' },
  livesNum: { color: '#fff', fontSize: 15, fontWeight: '900' },
  scoreBox: { minWidth: 76, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 18 },
  scoreTxt: { color: '#fff', fontSize: 18, fontWeight: '900' },
  close: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: '#fff', fontSize: 20, fontWeight: '800' },

  zone: { flex: 1, overflow: 'hidden' },

  card: { position: 'absolute', top: 0, alignSelf: 'center', width: CARD_W, height: CARD_H, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  eq: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 8 },
  tiles: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', gap: 8 },
  tile: { flex: 1, borderWidth: 1.5, borderRadius: 11, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  tileRed: { backgroundColor: '#C0392B', borderColor: '#FF7A6B' },
  tileTxt: { color: '#fff', fontSize: 19, fontWeight: '900' },

  stackCard: { position: 'absolute', alignSelf: 'center', width: CARD_W, height: CARD_H, borderRadius: 16, borderWidth: 1.5, backgroundColor: 'rgba(40,40,46,0.92)', borderColor: '#3A3A42', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  stackEq: { color: '#8A8A92', fontSize: 21, fontWeight: '900', letterSpacing: 1 },
  stackAns: { color: '#C9C9D2' },

  sp: { position: 'absolute', fontSize: 22, color: '#FFD75E' },
  spTL: { top: -8, left: -4 },
  spBR: { bottom: -8, right: -4 },

  overCard: { position: 'absolute', top: 0, alignSelf: 'center', width: CARD_W, height: CARD_H, borderRadius: 16, borderWidth: 2, backgroundColor: '#3A0A0A', borderColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF3B30', shadowOpacity: 0.8, shadowRadius: 16, elevation: 8 },
  overTxt: { color: '#FF5B52', fontSize: 26, fontWeight: '900', letterSpacing: 2 },
});
