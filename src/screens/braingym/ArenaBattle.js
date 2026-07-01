// src/screens/braingym/ArenaBattle.js
// Full Arena battle flow: (resume?) → Finding opponent (radar) → Game → Result.
// Robust: resumes an in-progress match after an app restart, abandons cleanly on
// quit, retries transient network failures, and falls back to a fully-offline local
// match if the backend is unreachable — so a battle always plays through.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Animated, ActivityIndicator, Easing,
} from 'react-native';
import { matchmakeArena, submitArenaResult, fetchActiveMatch, abandonMatch } from '../../api/arenaApi';
import { localMatch, localDuelResult } from './arenaLogic';
import { saveActiveMatch, clearActiveMatch } from '../../utils/storage';
import ArenaDuelBoard from './ArenaDuelBoard';
import ArenaHowToPlay from './ArenaHowToPlay';
import ArenaEntryChoice from './ArenaEntryChoice';

// ── Radar "finding opponent" screen ──────────────────────────────────────────
function Finding({ match }) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true }));
    const b = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    a.start(); b.start();
    return () => { a.stop(); b.stop(); };
  }, [spin, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const found = !!match;

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      <View style={st.center}>
        <View style={st.radar}>
          {[230, 176, 122].map((d) => <View key={d} style={[st.ring, { width: d, height: d, borderRadius: d / 2 }]} />)}
          {!found && (
            <Animated.View style={[st.sweepWrap, { transform: [{ rotate }] }]}>
              <View style={st.sweep} />
            </Animated.View>
          )}
          <Animated.View style={[st.radarAvatar, { transform: [{ scale: found ? 1 : scale }] }]}>
            <Text style={{ fontSize: 40 }}>{found ? '⚔️' : '😎'}</Text>
          </Animated.View>
        </View>

        {found ? (
          <>
            <Text style={st.foundName}>{match.opponent.name}</Text>
            <Text style={st.foundSub}>Opponent found · get ready!</Text>
          </>
        ) : (
          <Text style={st.finding}>Finding Your Opponent…</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Result screen ─────────────────────────────────────────────────────────────
function Result({ data, onRematch, onExit }) {
  const win = data.result === 'win';
  const draw = data.result === 'draw';
  const head = win ? 'YOU WON!' : draw ? 'IT’S A DRAW' : 'YOU LOST';
  const color = win ? '#39D98A' : draw ? '#E8C341' : '#E0322E';
  const emoji = win ? '🏆' : draw ? '🤝' : '💪';

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      <View style={st.center}>
        <Text style={{ fontSize: 64 }}>{emoji}</Text>
        <Text style={[st.resultHead, { color }]}>{head}</Text>

        <View style={st.scoreRow}>
          <View style={st.scoreCol}>
            <Text style={st.scoreLabel}>YOU</Text>
            <Text style={[st.scoreVal, { color }]}>{data.userScore}</Text>
            <Text style={st.scoreNote}>{data.userSolved ? 'solved' : 'unsolved'}</Text>
          </View>
          <Text style={st.vs}>vs</Text>
          <View style={st.scoreCol}>
            <Text style={st.scoreLabel}>{data.opponent?.name || 'Rival'}</Text>
            <Text style={st.scoreVal}>{data.opponentScore}</Text>
            <Text style={st.scoreNote}>{data.opponent?.solved ? 'solved' : 'unsolved'}</Text>
          </View>
        </View>

        <View style={st.rewards}>
          <View style={st.reward}><Text style={st.rewardVal}>+{data.xpEarned}</Text><Text style={st.rewardLabel}>XP</Text></View>
          <View style={st.rewardDiv} />
          <View style={st.reward}>
            <Text style={[st.rewardVal, { color: data.ratingDelta >= 0 ? '#39D98A' : '#E0322E' }]}>
              {data.ratingDelta >= 0 ? '+' : ''}{data.ratingDelta}
            </Text>
            <Text style={st.rewardLabel}>RATING · {data.ratingAfter}</Text>
          </View>
        </View>

        <TouchableOpacity style={st.rematch} activeOpacity={0.9} onPress={onRematch}>
          <Text style={st.rematchTxt}>REMATCH</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.exit} activeOpacity={0.85} onPress={onExit}>
          <Text style={st.exitTxt}>Back to Arena</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Orchestrator ──────────────────────────────────────────────────────────────
export default function ArenaBattle({ onExit }) {
  const [phase, setPhase] = useState('boot'); // boot | choice | howto | finding | game | tally | result
  const [match, setMatch] = useState(null);
  const [result, setResult] = useState(null);

  const mounted = useRef(true);
  const timers = useRef([]);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const after = (ms, fn) => { timers.current.push(setTimeout(() => { if (mounted.current) fn(); }, ms)); };

  const startMatch = useCallback(async () => {
    clearTimers();
    setMatch(null); setResult(null);
    setPhase('finding');

    const t0 = Date.now();
    const data = await matchmakeArena('no_attack');
    if (!mounted.current) return;
    const m = data || localMatch();
    if (m.matchId) saveActiveMatch({ matchId: m.matchId, startedAt: m.startedAt, placed: [] });

    const wait = Math.max(0, 2200 - (Date.now() - t0)); // radar shows for >= 2.2s
    after(wait, () => {
      setMatch(m);                                       // reveal opponent
      after(1500, () => setPhase('game'));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: resume an in-progress match if the server still has one, else show the
  // "how to play" intro (PLAY then starts matchmaking).
  useEffect(() => {
    mounted.current = true;
    (async () => {
      const active = await fetchActiveMatch();
      if (!mounted.current) return;
      if (active && active.matchId) {
        setMatch(active);
        setPhase('game'); // resume the same match (board restarts; result still counts)
      } else {
        setPhase('choice'); // ask: learn or play
      }
    })();
    return () => { mounted.current = false; clearTimers(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDone = useCallback(async ({ moves, winner, timeMs }) => {
    setPhase('tally');
    let res = match?.matchId ? await submitArenaResult({ matchId: match.matchId, moves, timeMs }) : null;
    if (!res) res = localDuelResult({ opponent: match.opponent, winner });
    await clearActiveMatch();
    if (!mounted.current) return;
    setResult(res);
    setPhase('result');
  }, [match]);

  // Quit mid-match → forfeit-clean (neutral, no rating change) + clear local copy.
  const handleExit = useCallback(async () => {
    if (match?.matchId) abandonMatch(match.matchId);
    await clearActiveMatch();
    if (onExit) onExit();
  }, [match, onExit]);

  if (phase === 'boot') {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}><ActivityIndicator size="large" color="#39D98A" /></View>
      </SafeAreaView>
    );
  }
  if (phase === 'choice') {
    return <ArenaEntryChoice onLearn={() => setPhase('howto')} onPlay={startMatch} onExit={onExit} />;
  }
  if (phase === 'howto') {
    return <ArenaHowToPlay onPlay={startMatch} onExit={() => setPhase('choice')} />;
  }
  if (phase === 'game' && match) {
    return <ArenaDuelBoard match={match} onDone={handleDone} onExit={handleExit} />;
  }
  if (phase === 'tally') {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}>
          <ActivityIndicator size="large" color="#39D98A" />
          <Text style={st.finding}>Checking your moves…</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (phase === 'result' && result) return <Result data={result} onRematch={startMatch} onExit={onExit} />;
  return <Finding match={match} />;
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },

  radar: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: '#23232A' },
  sweepWrap: { position: 'absolute', width: 230, height: 230, alignItems: 'center' },
  sweep: { width: 2, height: 115, backgroundColor: '#39D98A', opacity: 0.6 },
  radarAvatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#39D98A', alignItems: 'center', justifyContent: 'center' },
  finding: { color: '#C7C7CD', fontSize: 16, fontWeight: '700', marginTop: 12 },
  foundName: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.3 },
  foundSub: { color: '#39D98A', fontSize: 13, fontWeight: '700', marginTop: 4 },

  resultHead: { fontSize: 30, fontWeight: '900', letterSpacing: 0.5, marginTop: 8, marginBottom: 22 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 22 },
  scoreCol: { alignItems: 'center', minWidth: 96 },
  scoreLabel: { color: '#8E8E93', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  scoreVal: { color: '#fff', fontSize: 38, fontWeight: '900', marginVertical: 2 },
  scoreNote: { color: '#6E6E77', fontSize: 11, fontWeight: '700' },
  vs: { color: '#5A5A62', fontSize: 14, fontWeight: '900' },

  rewards: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262E', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 24, gap: 18, marginBottom: 30 },
  reward: { alignItems: 'center' },
  rewardVal: { color: '#fff', fontSize: 22, fontWeight: '900' },
  rewardLabel: { color: '#8E8E93', fontSize: 10, fontWeight: '800', letterSpacing: 0.6, marginTop: 2 },
  rewardDiv: { width: 1, height: 34, backgroundColor: '#2C2C30' },

  rematch: { backgroundColor: '#F4F4F5', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 60, marginBottom: 12 },
  rematchTxt: { color: '#0B0B0D', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  exit: { paddingVertical: 10 },
  exitTxt: { color: '#8E8E93', fontSize: 13, fontWeight: '700' },
});
