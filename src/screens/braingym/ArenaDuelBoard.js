// src/screens/braingym/ArenaDuelBoard.js
// Turn-based "No Attack" duel (Cuemath-style). You and the opponent ALTERNATE placing
// pieces on an irregular board; a piece may not attack any piece already down. On your
// turn the legal squares glow — tap one to place. The opponent then plays a RANDOM
// legal square. Whoever cannot move loses. The full move list is sent to the server,
// which replays it to decide the winner (anti-cheat).
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { legalMoves, MAX_TIME_MS } from './arenaLogic';
import QuitConfirm from './QuitConfirm';

const { width: SCREEN_W } = Dimensions.get('window');
const keyOf = (r, c) => `${r},${c}`;
const GLYPH = { queen: '♛', rook: '♜', bishop: '♝', knight: '♞', king: '♚' };
const PIECE_NAME = { queen: 'Queens', rook: 'Rooks', bishop: 'Bishops', knight: 'Knights', king: 'Kings' };
const OPP_DELAY = 800;

// Avatar with a pulsing glow ring while it's that player's turn.
function Avatar({ bg, emoji, active }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let anim;
    if (active) {
      anim = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 850, useNativeDriver: true }),
      ]));
      anim.start();
    } else {
      pulse.setValue(0);
    }
    return () => { if (anim) anim.stop(); };
  }, [active, pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  return (
    <View style={st.avatarWrap}>
      {active && <Animated.View style={[st.ring, { borderColor: bg, transform: [{ scale }], opacity }]} />}
      <View style={[st.avatar, { backgroundColor: bg }, active && st.avatarActive]}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
    </View>
  );
}

// Animated turn banner — springs in on each turn change and breathes gently.
function TurnBanner({ yourTurn, over, oppName }) {
  const enter = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    enter.setValue(0);
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, speed: 13, bounciness: 10 }).start();
  }, [yourTurn, over, enter]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 950, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 950, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  if (over) return <View style={st.turnSpacer} />;
  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  return (
    <Animated.View style={[st.turn, yourTurn ? st.turnYou : st.turnOpp, { opacity: enter, transform: [{ translateY }, { scale }] }]}>
      <Text style={[st.turnTxt, { color: yourTurn ? '#06210F' : '#FFC2DE' }]}>
        {yourTurn ? '🎯  YOUR TURN — tap a glowing square' : `⏳  ${oppName} is playing…`}
      </Text>
    </Animated.View>
  );
}

export default function ArenaDuelBoard({ match, onDone, onExit }) {
  const insets = useSafeAreaInsets();
  const { puzzle, opponent } = match;
  const { gridN } = puzzle;
  const piece = puzzle.piece || 'queen';
  const glyph = GLYPH[piece] || GLYPH.queen;

  const blocked = useMemo(() => new Set((puzzle.blocked || []).map((b) => keyOf(b.r, b.c))), [puzzle.blocked]);
  const firstBlocked = useMemo(() => (puzzle.blocked || [])[0], [puzzle.blocked]);

  const [placed, setPlaced] = useState([]); // [{ r, c, by }]
  const [turn, setTurn] = useState('user'); // 'user' | 'opp'
  const [over, setOver] = useState(null);
  const [quit, setQuit] = useState(false);
  const startRef = useRef(Date.now());
  const submittedRef = useRef(false);
  const movesRef = useRef([]);

  const placedMap = useMemo(() => {
    const m = new Map();
    placed.forEach((p) => m.set(keyOf(p.r, p.c), p.by));
    return m;
  }, [placed]);
  const legalSet = useMemo(
    () => (turn === 'user' && !over ? new Set(legalMoves(puzzle, placed).map((c) => keyOf(c.r, c.c))) : new Set()),
    [turn, over, puzzle, placed],
  );
  const userCount = placed.filter((p) => p.by === 'user').length;
  const oppCount = placed.filter((p) => p.by === 'opp').length;

  const placePiece = (r, c, by) => {
    movesRef.current.push({ r, c, by });
    setPlaced((prev) => [...prev, { r, c, by }]);
  };

  const finish = (winner) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setOver({ winner });
    onDone({ moves: movesRef.current.slice(), winner, timeMs: Math.min(Date.now() - startRef.current, MAX_TIME_MS) });
  };

  // Drive turns: if the player to move has no legal square they lose; otherwise the
  // opponent auto-plays a random legal square after a short "thinking" delay.
  useEffect(() => {
    if (over) return undefined;
    const moves = legalMoves(puzzle, placed);
    if (moves.length === 0) {
      finish(turn === 'user' ? 'opp' : 'user');
      return undefined;
    }
    if (turn === 'opp') {
      const t = setTimeout(() => {
        const opts = legalMoves(puzzle, placed);
        if (opts.length === 0) { finish('user'); return; }
        const pick = opts[Math.floor(Math.random() * opts.length)];
        placePiece(pick.r, pick.c, 'opp');
        setTurn('user');
      }, OPP_DELAY);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [placed, turn, over]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTap = (r, c) => {
    if (turn !== 'user' || over) return;
    if (!legalSet.has(keyOf(r, c))) return;
    placePiece(r, c, 'user');
    setTurn('opp');
  };

  const boardW = Math.min(SCREEN_W - 40, 326);
  const gap = 8;
  const cell = (boardW - gap * (gridN - 1)) / gridN;
  const yourTurn = turn === 'user' && !over;
  const oppThinking = turn === 'opp' && !over;

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}

      <View style={st.head}>
        <TouchableOpacity onPress={() => setQuit(true)} style={st.x} activeOpacity={0.85} accessibilityLabel="Quit battle">
          <Text style={st.xTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={st.title}>NO ATTACK</Text>
        <View style={st.piecePill}>
          <Text style={st.piecePillTxt}>{glyph} {PIECE_NAME[piece] || 'Pieces'}</Text>
        </View>
      </View>

      {/* opponent */}
      <View style={st.player}>
        <Avatar bg="#E0509A" emoji={oppThinking ? '🤔' : '🙂'} active={oppThinking} />
        <View>
          <Text style={st.pName}>{opponent.name}</Text>
          <Text style={st.pMeta}>{oppCount} placed{oppThinking ? ' · thinking…' : ''}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={[st.pieceBadge, { color: '#FF8FC2' }]}>{glyph}</Text>
      </View>

      {/* turn banner */}
      <TurnBanner yourTurn={yourTurn} over={!!over} oppName={opponent.name} />

      {/* board */}
      <View style={st.boardWrap}>
        <View style={[st.boardPad, { width: boardW + 18, height: boardW + 18 }]}>
          <View style={{ width: boardW, height: boardW }}>
            {Array.from({ length: gridN }).map((_, r) => (
              <View key={r} style={{ flexDirection: 'row' }}>
                {Array.from({ length: gridN }).map((__, c) => {
                  const k = keyOf(r, c);
                  const isBlocked = blocked.has(k);
                  const striped = firstBlocked && firstBlocked.r === r && firstBlocked.c === c;
                  const by = placedMap.get(k);
                  const isLegal = legalSet.has(k);
                  return (
                    <TouchableOpacity
                      key={c}
                      activeOpacity={isLegal ? 0.7 : 1}
                      onPress={() => onTap(r, c)}
                      style={[
                        st.cell,
                        { width: cell, height: cell, marginRight: c < gridN - 1 ? gap : 0, marginBottom: r < gridN - 1 ? gap : 0 },
                        (r + c) % 2 === 1 && st.cellAlt,
                        isLegal && st.cellLegal,
                        by && (by === 'user' ? st.cellUser : st.cellOpp),
                        isBlocked && st.cellBlocked,
                      ]}
                      accessibilityLabel={isBlocked ? 'blocked' : by ? `${by} piece` : isLegal ? 'playable' : 'square'}
                    >
                      {isBlocked
                        ? <Text style={st.blockTxt}>{striped ? '▨' : '╳'}</Text>
                        : by
                          ? <Text style={[st.glyph, { fontSize: cell * 0.6, color: by === 'user' ? '#8FB8FF' : '#FF8FC2' }]}>{glyph}</Text>
                          : isLegal ? <PlacePiecePreview size={cell} glyph={glyph} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* you — lifted above the phone's system nav buttons */}
      <View style={[st.player, { paddingBottom: Math.max(insets.bottom, 10) + 10 }]}>
        <Avatar bg="#39D98A" emoji="😎" active={yourTurn} />
        <View>
          <Text style={st.pName}>You</Text>
          <Text style={st.pMeta}>{userCount} placed</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={[st.pieceBadge, { color: '#8FB8FF' }]}>{glyph}</Text>
      </View>

      <QuitConfirm visible={quit} onQuit={onExit} onCancel={() => setQuit(false)} />
    </SafeAreaView>
  );
}

// faint breathing piece preview on a playable square (so legal cells read as "place here")
function PlacePiecePreview({ size, glyph }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.5] });
  return <Animated.Text style={{ fontSize: size * 0.58, fontWeight: '900', color: '#3A2A12', opacity }}>{glyph}</Animated.Text>;
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  x: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  xTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  piecePill: { backgroundColor: '#10141F', borderWidth: 1.5, borderColor: '#3D6FE6', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  piecePillTxt: { color: '#8FB8FF', fontSize: 11, fontWeight: '900' },

  player: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 22, paddingVertical: 8 },
  avatarWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 3 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarActive: { borderColor: '#fff' },
  pName: { color: '#fff', fontSize: 15, fontWeight: '900' },
  pMeta: { color: '#8E8E93', fontSize: 12, fontWeight: '700', marginTop: 1 },
  pieceBadge: { fontSize: 26, fontWeight: '900' },

  turn: { marginHorizontal: 22, borderRadius: 13, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  turnSpacer: { height: 40, marginHorizontal: 22 },
  turnYou: { backgroundColor: '#39D98A' },
  turnOpp: { backgroundColor: '#2A1622', borderWidth: 1.5, borderColor: '#5A2C42' },
  turnTxt: { fontSize: 13, fontWeight: '900', letterSpacing: 0.4 },

  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  boardPad: { backgroundColor: '#141013', borderRadius: 22, borderWidth: 1, borderColor: '#2A2024', alignItems: 'center', justifyContent: 'center' },

  cell: { borderRadius: 11, backgroundColor: '#E8843A', borderWidth: 1.5, borderColor: '#C96A22', alignItems: 'center', justifyContent: 'center' },
  cellAlt: { backgroundColor: '#D9772F' },
  cellLegal: { backgroundColor: '#F0A055', borderColor: '#FFD27A', borderWidth: 2 },
  cellUser: { backgroundColor: '#10141F', borderColor: '#3D6FE6', borderWidth: 2 },
  cellOpp: { backgroundColor: '#1F0F19', borderColor: '#E0509A', borderWidth: 2 },
  cellBlocked: { backgroundColor: '#17171C', borderColor: '#2A2A30', borderWidth: 1 },
  blockTxt: { color: '#44444C', fontSize: 16, fontWeight: '900' },
  glyph: { fontWeight: '900' },
});
