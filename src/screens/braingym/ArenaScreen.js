// src/screens/braingym/ArenaScreen.js
//
// Arena / Leaderboard — all Brain Gym progress + ranking lives here (NOT on Home).
// Shows: your rank, XP, accuracy, streak, quizzes, last score, Bronze/Silver/Gold
// badge, Weekly/Monthly/All-time leaderboards, and recent achievements.
//
// Data: GET /api/brain-gym/progress  +  GET /api/brain-gym/leaderboard?period=
// Fails gracefully — never crashes if the API is unavailable.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { getBrainGymProgress, getBrainGymLeaderboard } from '../../api/brainGymApi';

const PERIODS = [
  { key: 'weekly',  label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'all',     label: 'All-time' },
];
const AVATARS = ['😺', '🦊', '🐼', '🐯', '🐸', '🐵', '🦉', '🐧', '🦄', '🐶'];
const SKILL_EMOJI = { reasoning: '🧩', application: '⚙️', understanding: '💡', fluency: '⚡' };

function badgeFor(xp) {
  if (xp >= 500) return { emoji: '🥇', name: 'Gold',   color: '#FDE047' };
  if (xp >= 150) return { emoji: '🥈', name: 'Silver', color: '#CBD5E1' };
  if (xp >= 1)   return { emoji: '🥉', name: 'Bronze', color: '#D9A066' };
  return { emoji: '🌱', name: 'Rookie', color: '#34D399' };
}

const ArenaScreen = ({ onBack }) => {
  const [period, setPeriod]     = useState('weekly');
  const [progress, setProgress] = useState(null);
  const [board, setBoard]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [failed, setFailed]     = useState(false);

  // Load my progress + the leaderboard together so a fresh quiz result is
  // always reflected (and Retry/Refresh updates both at once).
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
  const xp = progress?.totalXp ?? me?.xp ?? 0;
  const badge = badgeFor(xp);
  const accuracy = progress?.accuracy ?? me?.accuracy ?? 0;
  const streak = progress?.currentStreak ?? 0;
  const quizzes = progress?.quizzesCompleted ?? me?.quizzes ?? 0;
  const recent = progress?.recent || [];
  const last = recent[0];

  const hasAny = (board && board.top && board.top.length > 0) || quizzes > 0;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0E0E10" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0E0E10' }} />}

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}><Text style={s.backTxt}>‹</Text></TouchableOpacity>
        <Text style={s.title}>Arena 🏆</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => loadBoard(period)} disabled={loading}>
          <Text style={[s.backTxt, { fontSize: 18, marginTop: 0 }]}>⟳</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* My card */}
        <View style={s.meCard}>
          <View style={s.meTop}>
            <Text style={s.meBadge}>{badge.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.meRank}>{me?.rank ? `Rank #${me.rank}` : 'Unranked'}</Text>
              <Text style={[s.meBadgeName, { color: badge.color }]}>{badge.name} League</Text>
            </View>
            <View style={s.xpPill}><Text style={s.xpPillTxt}>{xp} XP ⭐</Text></View>
          </View>
          <View style={s.meStats}>
            {[
              { v: `${accuracy}%`, l: 'Accuracy' },
              { v: `🔥 ${streak}`, l: 'Streak' },
              { v: String(quizzes), l: 'Quizzes' },
              { v: last ? `${last.score}/${last.totalQuestions}` : '—', l: 'Last' },
            ].map((st, i) => (
              <View key={i} style={s.meStat}>
                <Text style={s.meStatV}>{st.v}</Text>
                <Text style={s.meStatL}>{st.l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Period tabs */}
        <View style={s.tabs}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p.key} style={[s.tab, period === p.key && s.tabOn]} onPress={() => setPeriod(p.key)}>
              <Text style={[s.tabTxt, period === p.key && s.tabTxtOn]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard */}
        <Text style={s.sectionTitle}>Leaderboard</Text>
        {loading ? (
          <View style={s.loadBox}><ActivityIndicator color="#34D399" /></View>
        ) : failed && !hasAny ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📡</Text>
            <Text style={s.emptyTxt}>Couldn't load the leaderboard.{'\n'}Check your connection and try again.</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => loadBoard(period)}><Text style={s.retryTxt}>Retry</Text></TouchableOpacity>
          </View>
        ) : !board || board.top.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>🚀</Text>
            <Text style={s.emptyTxt}>No players yet this period.{'\n'}Play a Brain Gym quiz to take the top spot!</Text>
          </View>
        ) : (
          <View style={s.listCard}>
            {board.top.map((u, i) => (
              <View key={u.userId} style={[s.row, i < board.top.length - 1 && s.rowDiv, u.isMe && s.rowMe]}>
                <Text style={[s.rank, u.rank <= 3 && s.rankTop]}>{u.rank}</Text>
                <Text style={s.avatar}>{AVATARS[i % AVATARS.length]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.name} numberOfLines={1}>
                    {u.name}{u.isMe ? '  (you)' : ''}{u.grade ? <Text style={s.grade}>  {u.grade}</Text> : null}
                  </Text>
                  <Text style={s.sub}>{u.quizzes} quizzes · {u.accuracy}% acc</Text>
                </View>
                <View style={s.xpChip}><Text style={s.xpChipTxt}>{u.xp}</Text></View>
              </View>
            ))}
          </View>
        )}

        {/* Recent achievements */}
        <Text style={s.sectionTitle}>Recent achievements</Text>
        {recent.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>🎯</Text>
            <Text style={s.emptyTxt}>Finish a quiz to earn your first badge!</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {recent.slice(0, 6).map((r) => (
              <View key={r.id} style={s.achCard}>
                <Text style={s.achEmoji}>{SKILL_EMOJI[r.skill] || '⭐'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.achTitle}>{r.score}/{r.totalQuestions} in {r.skill} · Lvl {r.level}</Text>
                  <Text style={s.achSub}>+{r.xpEarned} XP</Text>
                </View>
                <Text style={s.achStar}>{r.totalQuestions && r.score / r.totalQuestions >= 0.8 ? '🏆' : '⭐'}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C1E', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: -2 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },

  meCard: { marginHorizontal: 16, marginBottom: 14, borderRadius: 22, padding: 16, backgroundColor: '#17171B', borderWidth: 1.5, borderColor: '#2C2C30' },
  meTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  meBadge: { fontSize: 40 },
  meRank: { color: '#fff', fontSize: 18, fontWeight: '900' },
  meBadgeName: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  xpPill: { backgroundColor: '#1E3A1E', borderWidth: 1.5, borderColor: '#34D399', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  xpPillTxt: { color: '#34D399', fontSize: 13, fontWeight: '900' },
  meStats: { flexDirection: 'row', gap: 8 },
  meStat: { flex: 1, backgroundColor: '#0E0E10', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2C2C30' },
  meStatV: { color: '#fff', fontSize: 15, fontWeight: '900' },
  meStatL: { color: '#8E8E93', fontSize: 9, fontWeight: '700', marginTop: 3 },

  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: '#1C1C1E', borderWidth: 1.5, borderColor: '#2C2C30' },
  tabOn: { backgroundColor: '#fff', borderColor: '#fff' },
  tabTxt: { color: '#8E8E93', fontSize: 12, fontWeight: '800' },
  tabTxtOn: { color: '#0E0E10' },

  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '900', paddingHorizontal: 18, marginTop: 8, marginBottom: 10 },

  loadBox: { paddingVertical: 30, alignItems: 'center' },
  emptyBox: { marginHorizontal: 16, backgroundColor: '#17171B', borderRadius: 18, borderWidth: 1.5, borderColor: '#2C2C30', padding: 24, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTxt: { color: '#8E8E93', fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 19 },
  retryBtn: { marginTop: 6, backgroundColor: '#34D399', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 22 },
  retryTxt: { color: '#0E0E10', fontSize: 13, fontWeight: '900' },

  listCard: { marginHorizontal: 16, backgroundColor: '#17171B', borderRadius: 18, borderWidth: 1.5, borderColor: '#2C2C30', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  rowDiv: { borderBottomWidth: 1, borderBottomColor: '#232327' },
  rowMe: { backgroundColor: '#13241B' },
  rank: { width: 26, textAlign: 'center', color: '#8E8E93', fontSize: 14, fontWeight: '900' },
  rankTop: { color: '#FDE047' },
  avatar: { fontSize: 26 },
  name: { color: '#fff', fontSize: 14, fontWeight: '800' },
  grade: { color: '#8E8E93', fontSize: 10, fontWeight: '800' },
  sub: { color: '#8E8E93', fontSize: 11, fontWeight: '600', marginTop: 1 },
  xpChip: { backgroundColor: '#0E2A16', borderWidth: 1.5, borderColor: '#1E7A3E', borderRadius: 16, minWidth: 48, paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center' },
  xpChipTxt: { color: '#34D399', fontSize: 13, fontWeight: '900' },

  achCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#17171B', borderRadius: 16, borderWidth: 1.5, borderColor: '#2C2C30', padding: 12 },
  achEmoji: { fontSize: 26 },
  achTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  achSub: { color: '#34D399', fontSize: 11, fontWeight: '800', marginTop: 2 },
  achStar: { fontSize: 20 },
});

export default ArenaScreen;
