// src/screens/braingym/ArenaFlipGame.js
// "Flip It Up" — a Lights Out puzzle. Tap a coin to FLIP it AND its neighbours (with a
// coin-flip animation); make every coin magenta (up). Solve 3 boards. Hints glow the
// correct next coin every move (follow them to guarantee a win); using hints halves the
// reward. A small round button bottom-right resets the board. "?" shows the goal.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLIP_N, flipAt, allUp, scrambleFlip, hintCellFor } from './arenaLogic';
import { initSounds, playSound } from '../../utils/sound';
import QuitConfirm from './QuitConfirm';
import GoalTip from './GoalTip';

const { width: SCREEN_W } = Dimensions.get('window');
const TARGET_SOLVES = 3;
const UP = '#D838C8';
const DOWN = '#2A2A30';

// a coin that physically flips (squash → swap colour → unsquash) when toggled
function Coin({ up, size, isHint, onPress }) {
  const sx = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(up);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; setShown(up); return; }
    Animated.timing(sx, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setShown(up);
      Animated.timing(sx, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    });
  }, [up]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let anim;
    if (isHint) {
      anim = Animated.loop(Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]));
      anim.start();
    } else ring.setValue(0);
    return () => { if (anim) anim.stop(); };
  }, [isHint, ring]);

  const rScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.32] });
  const rOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.65, 0] });
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {isHint && <Animated.View style={[s.hintRing, { width: size * 0.86, height: size * 0.86, borderRadius: size, transform: [{ scale: rScale }], opacity: rOpacity }]} />}
      <Animated.View style={{ width: size * 0.78, height: size * 0.78, borderRadius: size, backgroundColor: shown ? UP : DOWN, transform: [{ scaleX: sx }] }} />
    </TouchableOpacity>
  );
}

export default function ArenaFlipGame({ onExit, onGameOver }) {
  const insets = useSafeAreaInsets();
  const [grid, setGrid] = useState(() => scrambleFlip().grid);
  const [movesLeft, setMovesLeft] = useState(6);
  const [solved, setSolved] = useState(0);
  const [noMoves, setNoMoves] = useState(false);
  const [hintsOn, setHintsOn] = useState(false);
  const [hint, setHint] = useState(-1);
  const [showRules, setShowRules] = useState(false);
  const [quit, setQuit] = useState(false);

  const hintUsedRef = useRef(false);
  const pointsRef = useRef(0);
  const lockRef = useRef(false);
  const mountedRef = useRef(true);

  // Re-arm on mount — refs survive an effect cleanup (Fast Refresh / StrictMode), so
  // a setup that only clears the flag would leave it false and no-op every guarded setState.
  useEffect(() => { mountedRef.current = true; initSounds(); return () => { mountedRef.current = false; }; }, []);

  const newBoard = useCallback(() => {
    const { grid: g, optimal } = scrambleFlip();
    setGrid(g);
    setMovesLeft(optimal + 2);
    setNoMoves(false);
    setHintsOn(false);
    setHint(-1);
    hintUsedRef.current = false;
    lockRef.current = false;
  }, []);

  useEffect(() => { newBoard(); }, [newBoard]);

  // when hints are on, keep glowing the correct next coin (follow → guaranteed win)
  useEffect(() => {
    if (hintsOn && !noMoves && !allUp(grid)) setHint(hintCellFor(grid));
    else setHint(-1);
  }, [grid, hintsOn, noMoves]);

  const tap = (i) => {
    if (noMoves || lockRef.current || showRules) return;
    const g = flipAt(grid, i);
    setGrid(g);
    const ml = movesLeft - 1;
    setMovesLeft(ml);
    if (allUp(g)) {
      lockRef.current = true;
      playSound('correct');
      pointsRef.current += hintUsedRef.current ? 50 : 100;
      const nextSolved = solved + 1;
      setSolved(nextSolved);
      setTimeout(() => {
        if (!mountedRef.current) return;
        if (nextSolved >= TARGET_SOLVES) onGameOver && onGameOver(pointsRef.current);
        else newBoard();
      }, 950);
    } else if (ml <= 0) {
      setNoMoves(true);
      playSound('wrong');
    }
  };

  const showHints = () => { hintUsedRef.current = true; setHintsOn(true); setShowRules(false); };

  const boardW = Math.min(SCREEN_W - 80, 300);
  const cell = boardW / FLIP_N;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}

      <View style={s.head}>
        <TouchableOpacity onPress={() => setQuit(true)} style={s.icon} activeOpacity={0.85} accessibilityLabel="Quit"><Text style={s.iconTxt}>✕</Text></TouchableOpacity>
        <View style={s.dots}>
          {Array.from({ length: TARGET_SOLVES }).map((_, i) => <View key={i} style={[s.pdot, i < solved && s.pdotOn]} />)}
        </View>
        <View style={s.rightIcons}>
          <TouchableOpacity onPress={() => setShowRules(true)} style={s.icon} activeOpacity={0.85} accessibilityLabel="Hint"><Text style={s.iconTxt}>💡</Text></TouchableOpacity>
          <GoalTip text="Flip all the coins up." />
        </View>
      </View>

      <Text style={[s.msg, noMoves && s.msgBad]}>{noMoves ? 'No moves left, please reset.' : ' '}</Text>

      <View style={s.boardWrap}>
        <View style={{ width: boardW, height: boardW }}>
          {Array.from({ length: FLIP_N }).map((_, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {Array.from({ length: FLIP_N }).map((__, c) => {
                const i = r * FLIP_N + c;
                return <Coin key={i} up={grid[i]} size={cell} isHint={hint === i} onPress={() => tap(i)} />;
              })}
            </View>
          ))}
        </View>
      </View>

      {/* small round reset, bottom-right */}
      <TouchableOpacity onPress={newBoard} activeOpacity={0.85}
        style={[s.reset, { bottom: Math.max(insets.bottom, 10) + 16 }]} accessibilityLabel="Reset puzzle">
        <Text style={s.resetIcon}>↻</Text>
      </TouchableOpacity>

      {/* hint rules sheet */}
      {showRules && (
        <View style={s.sheetWrap}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Hint Rules</Text>
            <Text style={s.sheetMsg}>You’ll earn <Text style={s.strike}>100</Text> <Text style={s.amber}>50+</Text> upon solving and the puzzle will reset.</Text>
            <View style={s.sheetRow}>
              <TouchableOpacity onPress={() => setShowRules(false)} activeOpacity={0.8}><Text style={s.sheetClose}>Close</Text></TouchableOpacity>
              <TouchableOpacity onPress={showHints} activeOpacity={0.8}><Text style={s.sheetShow}>Show Hints</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <QuitConfirm visible={quit} onQuit={onExit} onCancel={() => setQuit(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  iconTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
  rightIcons: { flexDirection: 'row', gap: 8 },
  dots: { flexDirection: 'row', gap: 7 },
  pdot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#33333B' },
  pdotOn: { backgroundColor: '#D838C8' },

  msg: { color: '#9A9AA0', fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 6, minHeight: 20 },
  msgBad: { color: '#FF6B62', fontWeight: '900' },

  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hintRing: { position: 'absolute', borderWidth: 3, borderColor: '#FFD75E' },

  reset: { position: 'absolute', right: 22, width: 50, height: 50, borderRadius: 25, backgroundColor: '#1C1C22', borderWidth: 1.5, borderColor: '#3A3A42', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  resetIcon: { color: '#C9C9D2', fontSize: 22, fontWeight: '900' },

  sheetWrap: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,7,0.7)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, zIndex: 40 },
  sheet: { width: '100%', maxWidth: 360, backgroundColor: '#0E0E12', borderWidth: 1, borderColor: '#26262E', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 26, alignItems: 'center' },
  sheetTitle: { color: '#fff', fontSize: 15, fontWeight: '900', marginBottom: 12 },
  sheetMsg: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', lineHeight: 30, marginBottom: 22 },
  strike: { color: '#E8833A', textDecorationLine: 'line-through' },
  amber: { color: '#F5A623' },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 10 },
  sheetClose: { color: '#9A9AA0', fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },
  sheetShow: { color: '#fff', fontSize: 15, fontWeight: '900', textDecorationLine: 'underline' },
});
