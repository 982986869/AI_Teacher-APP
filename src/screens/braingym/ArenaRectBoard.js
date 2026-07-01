// src/screens/braingym/ArenaRectBoard.js
// "Rectangle It" — one round. Players ALTERNATE claiming dots on a grid; the first to
// own four dots forming an axis-aligned rectangle wins the round. You = orange,
// opponent = pink. The opponent (bot) wins if it can, blocks your winning dot, else
// builds toward its own rectangle. The full move log is reported up for the match.
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findRectangle, botRectMove } from './arenaLogic';
import { playSound } from '../../utils/sound';
import QuitConfirm from './QuitConfirm';
import GoalTip from './GoalTip';

const { width: SCREEN_W } = Dimensions.get('window');
const keyOf = (r, c) => `${r},${c}`;
const YOU = '#F2962C';   // orange
const OPP = '#E0509A';   // pink
const OPP_DELAY = 750;

function GlowAvatar({ bg, emoji, active, size = 46 }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let anim;
    if (active) {
      anim = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 850, useNativeDriver: true }),
      ]));
      anim.start();
    } else pulse.setValue(0);
    return () => { if (anim) anim.stop(); };
  }, [active, pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {active && <Animated.View style={[stt.ring, { width: size, height: size, borderRadius: size / 2, borderColor: bg, transform: [{ scale }], opacity }]} />}
      <View style={[stt.av, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, active && stt.avActive]}>
        <Text style={{ fontSize: size * 0.46 }}>{emoji}</Text>
      </View>
    </View>
  );
}

export default function ArenaRectBoard({
  gridN = 5, starter = 'user', opponentName = 'Rival',
  roundNo = 1, totalRounds = 3, userWins = 0, oppWins = 0,
  onRoundOver, onExit,
}) {
  const insets = useSafeAreaInsets();
  const [claims, setClaims] = useState([]);     // [{ r, c, by }]
  const [turn, setTurn] = useState(starter);
  const [winner, setWinner] = useState(null);
  const [rect, setRect] = useState(null);
  const [quit, setQuit] = useState(false);
  const claimsRef = useRef([]);
  const movesRef = useRef([]);
  const doneRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const ownerMap = useMemo(() => {
    const m = new Map();
    claims.forEach((c) => m.set(keyOf(c.r, c.c), c.by));
    return m;
  }, [claims]);

  const endRound = (w) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(() => { if (mountedRef.current && onRoundOver) onRoundOver(w, movesRef.current.slice(), starter); }, w ? 1400 : 700);
  };

  const claim = (r, c, by) => {
    if (doneRef.current) return;
    const next = [...claimsRef.current, { r, c, by }];
    claimsRef.current = next;
    movesRef.current.push({ r, c, by });
    setClaims(next);
    const rectFound = findRectangle(next.filter((x) => x.by === by));
    if (rectFound) {
      setWinner(by); setRect(rectFound);
      playSound(by === 'user' ? 'correct' : 'wrong');
      endRound(by);
    } else if (next.length >= gridN * gridN) {
      endRound(null);
    } else {
      setTurn(by === 'user' ? 'opp' : 'user');
    }
  };

  // opponent (bot) auto-plays on its turn
  useEffect(() => {
    if (winner || doneRef.current || turn !== 'opp') return undefined;
    const t = setTimeout(() => {
      const e = botRectMove(claimsRef.current, gridN);
      if (!e) { endRound(null); return; }
      claim(e.r, e.c, 'opp');
    }, OPP_DELAY);
    return () => clearTimeout(t);
  }, [turn, winner]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTap = (r, c) => {
    if (turn !== 'user' || winner || doneRef.current) return;
    if (ownerMap.has(keyOf(r, c))) return;
    claim(r, c, 'user');
  };

  const boardW = Math.min(SCREEN_W - 48, 320);
  const step = boardW / gridN;
  const dotR = step * 0.2;
  const center = (i) => i * step + step / 2;
  const yourTurn = turn === 'user' && !winner;

  return (
    <SafeAreaView style={stt.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}

      <View style={stt.head}>
        <TouchableOpacity onPress={() => setQuit(true)} style={stt.x} activeOpacity={0.85} accessibilityLabel="Quit">
          <Text style={stt.xTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={stt.title}>RECTANGLE IT</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <GoalTip text="Connect four of your dots in a rectangle before your opponent." />
          <View style={stt.roundPill}><Text style={stt.roundPillTxt}>R{roundNo}/{totalRounds}</Text></View>
        </View>
      </View>

      {/* opponent */}
      <View style={stt.player}>
        <GlowAvatar bg={OPP} emoji={turn === 'opp' && !winner ? '🤔' : '🙂'} active={turn === 'opp' && !winner} />
        <View style={{ flex: 1 }}>
          <Text style={stt.pName}>{opponentName}</Text>
          <Text style={stt.pMeta}>won {oppWins}</Text>
        </View>
        <View style={[stt.swatch, { backgroundColor: OPP }]} />
      </View>

      <Text style={[stt.turn, yourTurn ? stt.turnYou : stt.turnOpp]}>
        {winner ? (winner === 'user' ? '✦ You made a rectangle!' : `${opponentName} made a rectangle`) : yourTurn ? 'YOUR TURN — tap a dot' : `${opponentName} is thinking…`}
      </Text>

      {/* board */}
      <View style={stt.boardWrap}>
        <View style={{ width: boardW, height: boardW }}>
          {/* winning rectangle overlay */}
          {rect && (
            <Svg width={boardW} height={boardW} style={StyleSheet.absoluteFill} pointerEvents="none">
              {[[rect.r1, rect.c1, rect.r1, rect.c2], [rect.r1, rect.c2, rect.r2, rect.c2],
                [rect.r2, rect.c2, rect.r2, rect.c1], [rect.r2, rect.c1, rect.r1, rect.c1]].map((l, i) => (
                  <Line key={i} x1={center(l[1])} y1={center(l[0])} x2={center(l[3])} y2={center(l[2])}
                    stroke={winner === 'user' ? YOU : OPP} strokeWidth={4} strokeLinecap="round" />
                ))}
              {[[rect.r1, rect.c1], [rect.r1, rect.c2], [rect.r2, rect.c1], [rect.r2, rect.c2]].map((p, i) => (
                <Circle key={`c${i}`} cx={center(p[1])} cy={center(p[0])} r={dotR + 3} fill="none" stroke={winner === 'user' ? YOU : OPP} strokeWidth={3} />
              ))}
            </Svg>
          )}

          {/* dots */}
          {Array.from({ length: gridN }).map((_, r) => (
            Array.from({ length: gridN }).map((__, c) => {
              const by = ownerMap.get(keyOf(r, c));
              const cx = center(c), cy = center(r);
              return (
                <TouchableOpacity
                  key={keyOf(r, c)}
                  activeOpacity={by ? 1 : 0.6}
                  onPress={() => onTap(r, c)}
                  style={[stt.dot, {
                    width: dotR * 2, height: dotR * 2, borderRadius: dotR,
                    left: cx - dotR, top: cy - dotR,
                    backgroundColor: by === 'user' ? YOU : by === 'opp' ? OPP : '#2A2A30',
                    borderColor: by === 'user' ? '#FFC57A' : by === 'opp' ? '#FFA8D2' : '#3A3A42',
                  }]}
                  accessibilityLabel={by ? `${by} dot` : 'empty dot'}
                />
              );
            })
          ))}
        </View>
      </View>

      {/* you */}
      <View style={[stt.player, { paddingBottom: Math.max(insets.bottom, 10) + 10 }]}>
        <GlowAvatar bg="#39D98A" emoji="😎" active={yourTurn} />
        <View style={{ flex: 1 }}>
          <Text style={stt.pName}>You</Text>
          <Text style={stt.pMeta}>won {userWins}</Text>
        </View>
        <View style={[stt.swatch, { backgroundColor: YOU }]} />
      </View>

      <QuitConfirm visible={quit} onQuit={onExit} onCancel={() => setQuit(false)} />
    </SafeAreaView>
  );
}

const stt = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  x: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  xTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  roundPill: { backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  roundPillTxt: { color: '#C9C9D2', fontSize: 12, fontWeight: '900' },

  player: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 22, paddingVertical: 8 },
  ring: { position: 'absolute', borderWidth: 3 },
  av: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  avActive: { borderColor: '#fff' },
  pName: { color: '#fff', fontSize: 15, fontWeight: '900' },
  pMeta: { color: '#8E8E93', fontSize: 12, fontWeight: '700', marginTop: 1 },
  swatch: { width: 18, height: 18, borderRadius: 5 },

  turn: { textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 0.4, marginHorizontal: 22, borderRadius: 12, paddingVertical: 9 },
  turnYou: { color: '#06210F', backgroundColor: '#39D98A' },
  turnOpp: { color: '#FFC2DE', backgroundColor: '#2A1622' },

  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', borderWidth: 1.5 },
});
