// src/screens/braingym/ArenaRectBattle.js
// Full "Rectangle It" Arena flow:
//   choice → (how-to demo) → "3 Rounds, 1 Winner" → Finding opponent → VS reveal →
//   [Round N counter → board] (best of 3) → Game Over → +points → streak → wheel.
// Server-authoritative result via the per-round move logs; offline fallback if needed.
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Animated, Easing, Dimensions, Vibration,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { matchmakeArena, submitArenaResult, abandonMatch } from '../../api/arenaApi';
import ArenaRectBoard from './ArenaRectBoard';
import PracticeReward from './PracticeReward';
import { pressSpring, PRESS_SCALE } from './motion';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const RAD = Math.round(Math.min(SCREEN_W, SCREEN_H * 0.5));
const BOTS = ['ronaldo2008', 'Aarav', 'Zoya', 'Kabir', 'Mira', 'Ishaan', 'Diya'];
const MAX_ROUNDS = 5;

const localRectMatch = () => ({
  matchId: null,
  game: 'rectangle_it',
  puzzle: { game: 'rectangle_it', mode: 'duel', gridN: 5, rounds: 3 },
  opponent: { name: BOTS[Math.floor(Math.random() * BOTS.length)], isBot: true, rating: 1000 },
  rating: 1000,
});

// concentric-radar backdrop used by the intro / finding / VS-ish screens
function RadarBg({ children }) {
  return (
    <View style={{ width: RAD, height: RAD, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RAD} height={RAD} style={StyleSheet.absoluteFill}>
        {[0.16, 0.3, 0.46, 0.64, 0.84].map((f, i) => (
          <Circle key={i} cx={RAD / 2} cy={RAD / 2} r={(RAD * f) / 2} fill="none" stroke="#1A1A20" strokeWidth={1} />
        ))}
        {[0, 45, 90, 135].map((a, i) => {
          const rad = (a * Math.PI) / 180; const dx = Math.cos(rad) * (RAD * 0.42); const dy = Math.sin(rad) * (RAD * 0.42);
          return <Line key={i} x1={RAD / 2 - dx} y1={RAD / 2 - dy} x2={RAD / 2 + dx} y2={RAD / 2 + dy} stroke="#16161A" strokeWidth={1} />;
        })}
      </Svg>
      {children}
    </View>
  );
}

const Face = ({ bg, emoji, size = 96 }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: size * 0.46 }}>{emoji}</Text>
  </View>
);

// A tappable that springs down on press (tactile feedback for CTAs + close buttons).
const PressBtn = ({ style, wrapStyle, onPress, disabled, activeOpacity = 0.9, accessibilityLabel, children }) => {
  const sc = useRef(new Animated.Value(1)).current;
  const to = (v) => pressSpring(sc, v).start();
  return (
    <TouchableOpacity activeOpacity={activeOpacity} disabled={disabled} onPress={onPress}
      onPressIn={() => !disabled && to(PRESS_SCALE)} onPressOut={() => to(1)} style={wrapStyle} accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[style, { transform: [{ scale: sc }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

function CenteredScreen({ children, onExit }) {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}
      {onExit && (
        <View style={s.topbar}>
          <PressBtn onPress={onExit} style={s.x} activeOpacity={0.85} accessibilityLabel="Close"><Text style={s.xTxt}>✕</Text></PressBtn>
        </View>
      )}
      <View style={s.center}>{children}</View>
    </SafeAreaView>
  );
}

// ── VS reveal ───────────────────────────────────────────────────────────────
function VS({ oppName, meName }) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 10 }).start(); }, [pop]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}
      <View style={s.vsWrap}>
        <View style={s.vsTop}><Text style={s.vsName}>{oppName}</Text><Face bg="#E0509A" emoji="😌" size={86} /></View>
        <Animated.View style={[s.vsBadge, { transform: [{ scale }] }]}><Text style={s.vsTxt}>VS</Text></Animated.View>
        <View style={s.vsBot}><Face bg="#39D98A" emoji="😎" size={86} /><Text style={s.vsName}>{meName}</Text></View>
      </View>
    </SafeAreaView>
  );
}

// ── Round counter ────────────────────────────────────────────────────────────
function RoundCounter({ n, oppName, meName }) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => { pop.setValue(0); Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 11, bounciness: 12 }).start(); }, [n, pop]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}
      <View style={s.vsWrap}>
        <View style={s.vsTop}><Text style={s.vsName}>{oppName}</Text><Face bg="#E0509A" emoji="😌" size={70} /></View>
        <View style={s.line} />
        <Animated.View style={[s.roundCircle, { transform: [{ scale }] }]}><Text style={s.roundNum}>{n}</Text></Animated.View>
        <View style={s.line} />
        <View style={s.vsBot}><Face bg="#39D98A" emoji="😎" size={70} /><Text style={s.vsName}>{meName}</Text></View>
      </View>
    </SafeAreaView>
  );
}

// ── Game over ────────────────────────────────────────────────────────────────
function GameOver({ winner, oppName, meName }) {
  const label = winner === 'user' ? 'YOU WIN' : winner === 'opp' ? 'YOU LOST' : 'DRAW';
  const color = winner === 'user' ? '#39D98A' : winner === 'opp' ? '#FF5B52' : '#E8C341';
  const pop = useRef(new Animated.Value(0)).current;
  const labelV = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: winner === 'user' ? 15 : 7 }).start();
    Animated.spring(labelV, { toValue: 1, delay: 240, useNativeDriver: true, speed: 13, bounciness: 12 }).start();
    if (winner === 'user') {
      Animated.timing(glow, { toValue: 1, duration: 950, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    } else if (winner === 'opp') {
      try { Vibration.vibrate(45); } catch (e) {}
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
  }, [winner, pop, labelV, glow, shake]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const tx = shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  const labelScale = labelV.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.7] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 0] });
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}
      <View style={s.vsWrap}>
        <View style={s.vsTop}><Text style={s.vsName}>{oppName}</Text><Face bg="#E0509A" emoji="😔" size={70} /></View>
        <Animated.View style={{ alignItems: 'center', justifyContent: 'center', transform: [{ scale }, { translateX: tx }] }}>
          <Animated.View pointerEvents="none" style={[s.overGlow, { borderColor: color, opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
          <View style={[s.overCircle, { borderColor: color }]}>
            <Text style={[s.overTxt, { color }]}>GAME{'\n'}OVER</Text>
          </View>
        </Animated.View>
        <Animated.Text style={[s.overLabel, { color, opacity: labelV, transform: [{ scale: labelScale }] }]}>{label}</Animated.Text>
        <View style={s.vsBot}><Face bg="#39D98A" emoji="😎" size={70} /><Text style={s.vsName}>{meName}</Text></View>
      </View>
    </SafeAreaView>
  );
}

// ── Animated how-to (demo plays itself) ──────────────────────────────────────
const HT_N = 4;
const HT_FRAMES = [
  { cap: 'You and your opponent take turns', d: [] },
  { cap: 'Tap a dot to claim it (you = orange)', d: [['u', 0, 0]] },
  { cap: 'The opponent claims a dot too (pink)', d: [['u', 0, 0], ['p', 1, 1]] },
  { cap: 'Build the four corners of a rectangle…', d: [['u', 0, 0], ['p', 1, 1], ['u', 0, 2]] },
  { cap: 'Keep claiming your corners…', d: [['u', 0, 0], ['p', 1, 1], ['u', 0, 2], ['p', 3, 3], ['u', 2, 0]] },
  { cap: 'Four in a rectangle — YOU WIN! 🏆', d: [['u', 0, 0], ['p', 1, 1], ['u', 0, 2], ['p', 3, 3], ['u', 2, 0], ['p', 1, 3], ['u', 2, 2]], rect: { r1: 0, r2: 2, c1: 0, c2: 2 } },
];
function RectHowTo({ onPlay, onExit }) {
  const [step, setStep] = useState(0);
  const cap = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let i = 0; let t;
    const tick = () => { setStep(i); const dur = HT_FRAMES[i].rect ? 2400 : 1500; i = (i + 1) % HT_FRAMES.length; t = setTimeout(tick, dur); };
    tick();
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { cap.setValue(0); Animated.timing(cap, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [step, cap]);

  const frame = HT_FRAMES[step];
  const cell = 56, dotR = 11;
  const center = (i) => i * cell + cell / 2;
  const owner = new Map(frame.d.map(([by, r, c]) => [`${r},${c}`, by]));
  const board = HT_N * cell;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}
      <View style={s.topbar}>
        <PressBtn onPress={onExit} style={s.x} activeOpacity={0.85} accessibilityLabel="Close"><Text style={s.xTxt}>✕</Text></PressBtn>
        <Text style={s.htTitle}>RECTANGLE IT</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.center}>
        <Text style={s.htRule}>First to connect four of their dots in a <Text style={{ color: '#FF8FC2' }}>rectangle</Text> wins.</Text>
        <View style={{ width: board, height: board, marginTop: 8 }}>
          {frame.rect && (
            <Svg width={board} height={board} style={StyleSheet.absoluteFill} pointerEvents="none">
              {[[frame.rect.r1, frame.rect.c1, frame.rect.r1, frame.rect.c2], [frame.rect.r1, frame.rect.c2, frame.rect.r2, frame.rect.c2],
                [frame.rect.r2, frame.rect.c2, frame.rect.r2, frame.rect.c1], [frame.rect.r2, frame.rect.c1, frame.rect.r1, frame.rect.c1]].map((l, i) => (
                  <Line key={i} x1={center(l[1])} y1={center(l[0])} x2={center(l[3])} y2={center(l[2])} stroke="#F2962C" strokeWidth={4} strokeLinecap="round" />
                ))}
            </Svg>
          )}
          {Array.from({ length: HT_N }).map((_, r) => Array.from({ length: HT_N }).map((__, c) => {
            const by = owner.get(`${r},${c}`);
            return <View key={`${r},${c}`} style={{
              position: 'absolute', left: center(c) - dotR, top: center(r) - dotR, width: dotR * 2, height: dotR * 2, borderRadius: dotR,
              backgroundColor: by === 'u' ? '#F2962C' : by === 'p' ? '#E0509A' : '#2A2A30', borderWidth: 1.5, borderColor: by ? '#fff3' : '#3A3A42',
            }} />;
          }))}
        </View>
        <Animated.Text style={[s.htCap, { opacity: cap }]}>{frame.cap}</Animated.Text>
        <View style={s.dots}>{HT_FRAMES.map((_, i) => <View key={i} style={[s.pdot, i === step && s.pdotOn]} />)}</View>
      </View>
      <View style={s.foot}>
        <PressBtn style={s.play} wrapStyle={{ width: '100%' }} activeOpacity={0.9} onPress={onPlay} accessibilityLabel="Play"><Text style={s.playTxt}>PLAY ▶</Text></PressBtn>
        <Text style={s.skip}>You can start playing any time</Text>
      </View>
    </SafeAreaView>
  );
}

// ── Orchestrator ─────────────────────────────────────────────────────────────
export default function ArenaRectBattle({ onExit, onTabPress }) {
  const { user } = useAuth();
  const meName = user?.name || 'Player';
  const [phase, setPhase] = useState('howto'); // howto|intro3|finding|vs|round|board|result|reward
  const [match, setMatch] = useState(null);
  const [roundNo, setRoundNo] = useState(1);
  const [userWins, setUserWins] = useState(0);
  const [oppWins, setOppWins] = useState(0);
  const [matchWinner, setMatchWinner] = useState(null);
  const [rewardPts, setRewardPts] = useState(25);

  const mounted = useRef(true);
  const timers = useRef([]);
  const roundLogs = useRef([]);
  const starterRef = useRef('user');
  const winsRef = useRef({ u: 0, o: 0 });
  const roundNoRef = useRef(1);
  const matchRef = useRef(null);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const after = (ms, fn) => { timers.current.push(setTimeout(() => { if (mounted.current) fn(); }, ms)); };

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clear(); }; }, []);

  const totalRounds = match?.puzzle?.rounds || 3;

  const startRounds = useCallback((m) => {
    roundLogs.current = []; winsRef.current = { u: 0, o: 0 }; roundNoRef.current = 1; starterRef.current = 'user';
    setUserWins(0); setOppWins(0); setRoundNo(1); setMatchWinner(null);
    setPhase('round');
    after(1200, () => setPhase('board'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const begin = useCallback(async () => {
    clear();
    setMatch(null); matchRef.current = null;
    setPhase('intro3');
    const pending = matchmakeArena('rectangle_it');
    after(1600, async () => {
      setPhase('finding');
      const t0 = Date.now();
      const data = await pending;
      if (!mounted.current) return;
      const m = data || localRectMatch();
      setMatch(m); matchRef.current = m;
      after(Math.max(0, 1700 - (Date.now() - t0)), () => {
        setPhase('vs');
        after(1700, () => startRounds(m));
      });
    });
  }, [startRounds]);

  const finishMatch = useCallback((uw, ow) => {
    const winner = uw > ow ? 'user' : ow > uw ? 'opp' : 'draw';
    setMatchWinner(winner);
    setPhase('result');
    const m = matchRef.current;
    if (m?.matchId) submitArenaResult({ matchId: m.matchId, rounds: roundLogs.current, timeMs: 60000 });
    const pts = winner === 'user' ? 25 : winner === 'draw' ? 10 : 5;
    after(1950, () => { setRewardPts(pts); setPhase('reward'); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRoundOver = useCallback((winner, moves, starter) => {
    roundLogs.current.push({ moves, starter, winner });
    const w = winsRef.current;
    if (winner === 'user') w.u += 1; else if (winner === 'opp') w.o += 1;
    setUserWins(w.u); setOppWins(w.o);
    const need = Math.floor(totalRounds / 2) + 1;
    if (w.u >= need || w.o >= need || roundNoRef.current >= MAX_ROUNDS) {
      finishMatch(w.u, w.o);
    } else {
      roundNoRef.current += 1;
      starterRef.current = starterRef.current === 'user' ? 'opp' : 'user';
      setRoundNo(roundNoRef.current);
      setPhase('round');
      after(1200, () => setPhase('board'));
    }
  }, [totalRounds, finishMatch]);

  const handleExit = useCallback(() => {
    if (matchRef.current?.matchId) abandonMatch(matchRef.current.matchId);
    if (onExit) onExit();
  }, [onExit]);

  if (phase === 'howto') return <RectHowTo onPlay={begin} onExit={onExit} />;
  if (phase === 'intro3') return <CenteredScreen onExit={handleExit}><RadarBg><Face bg="#39D98A" emoji="😌" /></RadarBg><Text style={s.caption}>3 Rounds, 1 Winner</Text></CenteredScreen>;
  if (phase === 'finding') return <CenteredScreen onExit={handleExit}><RadarBg><Face bg="#39D98A" emoji="😌" /></RadarBg><Text style={s.captionDim}>Finding Your Opponent</Text></CenteredScreen>;
  if (phase === 'vs' && match) return <VS oppName={match.opponent.name} meName={meName} />;
  if (phase === 'round' && match) return <RoundCounter n={roundNo} oppName={match.opponent.name} meName={meName} />;
  if (phase === 'board' && match) {
    return (
      <ArenaRectBoard
        key={roundNo}
        gridN={match.puzzle.gridN}
        starter={starterRef.current}
        opponentName={match.opponent.name}
        roundNo={roundNo}
        totalRounds={totalRounds}
        userWins={userWins}
        oppWins={oppWins}
        onRoundOver={handleRoundOver}
        onExit={handleExit}
      />
    );
  }
  if (phase === 'result' && match) return <GameOver winner={matchWinner} oppName={match.opponent.name} meName={meName} />;
  if (phase === 'reward') return <PracticeReward points={rewardPts} activeTab="arena" onTabPress={onTabPress} onDone={onExit} />;
  return <CenteredScreen><RadarBg><Face bg="#39D98A" emoji="😌" /></RadarBg></CenteredScreen>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  x: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  xTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  caption: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 20 },
  captionDim: { color: '#8E8E93', fontSize: 15, fontWeight: '700', marginTop: 20 },

  vsWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  vsTop: { alignItems: 'center', gap: 10, marginBottom: 8 },
  vsBot: { alignItems: 'center', gap: 10, marginTop: 8 },
  vsName: { color: '#fff', fontSize: 16, fontWeight: '900' },
  vsBadge: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#1C1C22', borderWidth: 2, borderColor: '#3A3A44', alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  vsTxt: { color: '#C9C9D2', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  line: { width: 2, height: 30, backgroundColor: '#2A2A30' },
  roundCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#101014', borderWidth: 2, borderColor: '#3A3A44', alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  roundNum: { color: '#fff', fontSize: 56, fontWeight: '900' },
  overCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#101014', borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  overGlow: { position: 'absolute', top: 18, left: 0, width: 110, height: 110, borderRadius: 55, borderWidth: 2 },
  overTxt: { fontSize: 16, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  overLabel: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  htTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  htRule: { color: '#C7C7CD', fontSize: 14, fontWeight: '700', textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
  htCap: { color: '#EDEDF2', fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 18, minHeight: 42, paddingHorizontal: 20, lineHeight: 21 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 4 },
  pdot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2C2C34' },
  pdotOn: { backgroundColor: '#39D98A', width: 18 },
  foot: { paddingHorizontal: 22, paddingBottom: Platform.OS === 'ios' ? 24 : 18 },
  play: { backgroundColor: '#39D98A', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  playTxt: { color: '#06210F', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  skip: { color: '#6E6E77', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 8 },
});
