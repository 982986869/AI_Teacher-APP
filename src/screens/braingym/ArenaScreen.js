// src/screens/braingym/ArenaScreen.js
//
// Arena — "Top 50" Brain Gym leaderboard (dark, premium). All ranking lives here.
// Data: GET /api/brain-gym/progress  +  GET /api/brain-gym/leaderboard?period=
// Fails gracefully — never crashes if the API is unavailable.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { getBrainGymProgress, getBrainGymLeaderboard } from '../../api/brainGymApi';
import { FONT } from '../../constants/fonts';

const PERIODS = [
  { key: 'weekly',  label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'all',     label: 'All Time' },
];
const AVATARS  = ['😺', '🦊', '🐼', '🐯', '🐸', '🐵', '🦉', '🐧', '🦄', '🐶'];
const AV_BG    = ['#E26FA6', '#3FB27F', '#8A8F98', '#5B7CE2', '#39B5B0', '#B06FE2', '#E2A23F', '#5BC3E2', '#9B6FE2', '#E27B5B'];

// Thin spirograph "flower" line-art, like the reference header art.
const MANDALA = Array.from({ length: 12 }, (_, i) => i * 15);

const ArenaScreen = ({ onBack }) => {
  const [periodIdx, setPeriodIdx] = useState(0);
  const [progress, setProgress]   = useState(null);
  const [board, setBoard]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [failed, setFailed]       = useState(false);
  const [showInfo, setShowInfo]   = useState(true);

  const period = PERIODS[periodIdx].key;

  const loadBoard = useCallback((p) => {
    setLoading(true);
    Promise.allSettled([getBrainGymProgress(), getBrainGymLeaderboard(p)])
      .then(([prog, lb]) => {
        if (prog.status === 'fulfilled') setProgress(prog.value);
        if (lb.status === 'fulfilled') { setBoard(lb.value); setFailed(false); }
        else setFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { loadBoard(period); }, [period, loadBoard]);

  const me = board?.me || null;
  const myXp = progress?.totalXp ?? me?.xp ?? 0;
  const top = board?.top || [];
  const hasAny = top.length > 0;

  const cyclePeriod = (dir) => setPeriodIdx((i) => (i + dir + PERIODS.length) % PERIODS.length);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}

      {/* Decorative line-art */}
      <View style={s.mandalaWrap} pointerEvents="none">
        <Svg width={200} height={200} viewBox="0 0 180 180">
          {MANDALA.map((deg, i) => (
            <Ellipse key={i} cx={90} cy={90} rx={28} ry={82} fill="none"
              stroke="#FFFFFF" strokeOpacity={0.14} strokeWidth={0.7}
              transform={`rotate(${deg} 90 90)`} />
          ))}
        </Svg>
      </View>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.kicker}>ARENA STARS</Text>
        <Text style={s.title}>Top 50</Text>
        {me?.rank ? (
          <Text style={s.youLine}>You're #{me.rank} · {myXp} pts</Text>
        ) : (
          <Text style={s.youLine}>Play a quiz to join the board</Text>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Info card */}
        {showInfo && (
          <View style={s.infoCard}>
            <Text style={s.infoTxt}>
              Earn points by completing a Brain Gym quiz each day. The more you play, the higher you climb!
            </Text>
            <TouchableOpacity style={s.infoClose} onPress={() => setShowInfo(false)}>
              <Text style={s.infoCloseTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {loading ? (
          <View style={s.loadBox}><ActivityIndicator color="#39D98A" /></View>
        ) : failed && !hasAny ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📡</Text>
            <Text style={s.emptyTxt}>Couldn't load the leaderboard.{'\n'}Check your connection and try again.</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => loadBoard(period)}><Text style={s.retryTxt}>Retry</Text></TouchableOpacity>
          </View>
        ) : !hasAny ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>🚀</Text>
            <Text style={s.emptyTxt}>No players yet this period.{'\n'}Play a quiz to take the top spot!</Text>
          </View>
        ) : (
          <View style={s.list}>
            {top.map((p, i) => (
              <View key={p.userId} style={[s.row, p.isMe && s.rowMe]}>
                <Text style={[s.rank, p.rank <= 3 && s.rankTop]}>{p.rank}</Text>
                <View style={[s.avatar, { backgroundColor: AV_BG[i % AV_BG.length] }]}>
                  <Text style={s.avatarTxt}>{AVATARS[i % AVATARS.length]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name} numberOfLines={1}>
                    {p.name}{p.isMe ? ' (you)' : ''}
                    {p.grade ? <Text style={s.grade}> {p.grade}</Text> : null}
                  </Text>
                </View>
                {/* Green medal badge */}
                <View style={s.medal}>
                  <View style={s.medalInner}>
                    <Text style={s.medalNum}>{p.xp}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom bar — period switch + close */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.navBtn} activeOpacity={0.85} onPress={() => cyclePeriod(-1)}>
          <Text style={s.navTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.periodLabel}>{PERIODS[periodIdx].label}</Text>
        <TouchableOpacity style={s.navBtn} activeOpacity={0.85} onPress={() => cyclePeriod(1)}>
          <Text style={s.navTxt}>›</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={s.closeBtn} activeOpacity={0.85} onPress={onBack}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },

  mandalaWrap: { position: 'absolute', top: Platform.OS === 'android' ? 6 : -10, right: 4, opacity: 0.9 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  kicker: { color: '#7C7C85', fontSize: 12, fontFamily: FONT.extrabold, letterSpacing: 3 },
  title: { color: '#FFFFFF', fontSize: 38, fontFamily: FONT.black, letterSpacing: -0.5, marginTop: 2 },
  youLine: { color: '#39D98A', fontSize: 13, fontFamily: FONT.bold, marginTop: 4 },

  infoCard: { marginHorizontal: 16, marginTop: 8, marginBottom: 14, backgroundColor: '#B5651E', borderRadius: 16, paddingVertical: 16, paddingLeft: 16, paddingRight: 40, position: 'relative' },
  infoTxt: { color: '#FFF4E8', fontSize: 13, fontFamily: FONT.semibold, lineHeight: 19 },
  infoClose: { position: 'absolute', top: 10, right: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  infoCloseTxt: { color: '#FFE9D2', fontSize: 14, fontFamily: FONT.black },

  loadBox: { paddingVertical: 40, alignItems: 'center' },
  emptyBox: { marginHorizontal: 16, backgroundColor: '#141418', borderRadius: 18, borderWidth: 1, borderColor: '#26262E', padding: 26, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTxt: { color: '#8A8A93', fontSize: 13, fontFamily: FONT.semibold, textAlign: 'center', lineHeight: 19 },
  retryBtn: { marginTop: 6, backgroundColor: '#39D98A', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 22 },
  retryTxt: { color: '#06210F', fontSize: 13, fontFamily: FONT.extrabold },

  list: { paddingHorizontal: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#161620' },
  rowMe: { backgroundColor: '#10241A', borderRadius: 14, borderBottomColor: 'transparent' },
  rank: { width: 22, textAlign: 'center', color: '#FFFFFF', fontSize: 16, fontFamily: FONT.black },
  rankTop: { color: '#39D98A' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 22 },
  name: { color: '#FFFFFF', fontSize: 15, fontFamily: FONT.bold },
  grade: { color: '#8A8A93', fontSize: 10, fontFamily: FONT.extrabold },

  medal: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0E2A18', borderWidth: 2, borderColor: '#2E9E5E', alignItems: 'center', justifyContent: 'center' },
  medalInner: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#1E5E38', alignItems: 'center', justifyContent: 'center' },
  medalNum: { color: '#5FE39A', fontSize: 13, fontFamily: FONT.black },

  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 10 : 18, borderTopWidth: 1, borderTopColor: '#16161C' },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  navTxt: { color: '#0B0B0D', fontSize: 22, fontFamily: FONT.black, marginTop: -2 },
  periodLabel: { color: '#FFFFFF', fontSize: 14, fontFamily: FONT.extrabold, minWidth: 92, textAlign: 'center' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#141418', borderWidth: 1.5, borderColor: '#2C2C33', alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: '#fff', fontSize: 16, fontFamily: FONT.black },
});

export default ArenaScreen;
