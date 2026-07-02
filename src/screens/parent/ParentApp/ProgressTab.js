// src/screens/parent/ParentApp/ProgressTab.js — teammate's week UI + real report stats.
import React, { memo, useMemo } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { C, st, T, Label, DOWF, MONF, ARENA_BASE_RATING } from './constants';
import Header from './Header';
import { SleepyMonitor } from './illustrations';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
function Stat({ value, label, color }) {
  return (
    <View style={st.stat}>
      <T w="xbold" s={22} c={color || C.ink}>{value}</T>
      <T w="bold" s={11} c={C.muted} style={{ marginTop: 3 }}>{label}</T>
    </View>
  );
}

function ProgressTab({ meta, childName, onAvatar, report, refreshing, onRefresh }) {
  const bg = report.brainGym || {};
  const ar = report.arena || {};
  const mistakes = Number(report.openMistakes) || 0;
  const hasActivity = (Number(bg.quizzesCompleted) || 0) > 0 || (Number(bg.totalXp) || 0) > 0;

  const { week, hdr } = useMemo(() => {
    const today = new Date();
    const start = new Date(today); start.setDate(today.getDate() - today.getDay());
    const w = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const t = d.toDateString() === today.toDateString();
      w.push({ d: DOW[d.getDay()], n: d.getDate(), st: t ? 'today' : d > today ? 'future' : 'past' });
    }
    return { week: w, hdr: `${DOWF[today.getDay()]}, ${today.getDate()} ${MONF[today.getMonth()]}, ${today.getFullYear()}`.toUpperCase() };
  }, []);

  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} />
      <ScrollView style={{ paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}>
        <View style={st.progHead}>
          <T w="bold" s={13.5} c={C.muted} style={{ letterSpacing: 0.5 }}>{hdr}</T>
          <ChevronDown size={18} color={C.ink} />
        </View>
        <View style={st.weekRow}>
          {week.map((w, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 9 }}>
              <View style={[st.dowChip, w.st === 'today' && { backgroundColor: '#E6E7EA' }]}><T w="bold" s={12} c={C.muted}>{w.d}</T></View>
              <View style={[st.dateCircle, w.st === 'today' && { backgroundColor: C.ink, borderColor: C.ink }, w.st === 'future' && { borderColor: '#F2F2F3' }]}>
                <T w="bold" s={14} c={w.st === 'today' ? '#fff' : w.st === 'future' ? C.faint : C.ink}>{w.n}</T>
              </View>
            </View>
          ))}
        </View>

        {!hasActivity ? (
          <View style={st.noActivity}>
            <SleepyMonitor />
            <T w="semi" s={15} c={C.faint}>No activity yet today</T>
          </View>
        ) : (
          <>
            <Label>BrainGym</Label>
            <View style={st.statCard}>
              <View style={st.statRow}>
                <Stat value={bg.totalXp ?? 0} label="XP" color={C.green} />
                <Stat value={bg.quizzesCompleted ?? 0} label="Quizzes" />
                <Stat value={`${bg.accuracy ?? 0}%`} label="Accuracy" />
                <Stat value={bg.currentStreak ?? 0} label="Streak" color={C.orange} />
              </View>
            </View>
            <Label>Arena</Label>
            <View style={st.statCard}>
              <View style={st.statRow}>
                <Stat value={ar.rating ?? ARENA_BASE_RATING} label="Rating" color={C.blue} />
                <Stat value={ar.wins ?? 0} label="Wins" color={C.green} />
                <Stat value={ar.losses ?? 0} label="Losses" color={C.red} />
                <Stat value={ar.played ?? 0} label="Played" />
              </View>
            </View>
            <Label>Areas to focus</Label>
            <View style={st.focusCard}>
              <T w="xbold" s={30} c={C.peachInk}>{mistakes}</T>
              <T w="med" s={13} c={C.muted}>open items in the Mistake Book to revise.</T>
              <T w="semi" s={13} c={C.ink} style={{ marginTop: 12, lineHeight: 19 }}>
                {(Number(bg.accuracy) || 0) >= 80
                  ? '🌟 Strong accuracy — encourage harder Arena challenges.'
                  : '💡 A short daily BrainGym + clearing the Mistake Book will help most.'}
              </T>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default memo(ProgressTab);
