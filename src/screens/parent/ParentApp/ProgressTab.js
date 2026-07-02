// src/screens/parent/ParentApp/ProgressTab.js
import React, { memo, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { C, s, DOW, DOWF, MONF, ARENA_BASE_RATING, Label } from './constants';
import { SleepyMonitor } from './illustrations';

function Stat({ value, label, color }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statVal, color && { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ProgressTab({ report, sidePad, refreshing, onRefresh }) {
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
      const isToday = d.toDateString() === today.toDateString();
      w.push({ d: DOW[d.getDay()], n: d.getDate(), today: isToday, future: d > today && !isToday });
    }
    return { week: w, hdr: `${DOWF[today.getDay()]}, ${today.getDate()} ${MONF[today.getMonth()]}, ${today.getFullYear()}`.toUpperCase() };
  }, []);

  return (
    <ScrollView style={[s.body, { paddingTop: 0, paddingHorizontal: sidePad }]} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}>
      <View style={s.progHead}><Text style={s.progHeadTxt}>{hdr}</Text></View>
      <View style={s.weekRow}>
        {week.map((w, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 9 }}>
            <View style={[s.dowChip, w.today && { backgroundColor: '#E6E7EA' }]}><Text style={s.dowChipTxt}>{w.d}</Text></View>
            <View style={[s.dateCircle, w.today && { backgroundColor: C.ink, borderColor: C.ink }, w.future && { borderColor: '#F2F2F3' }]}>
              <Text style={[s.dateCircleTxt, w.today && { color: '#fff' }, w.future && { color: C.faint }]}>{w.n}</Text>
            </View>
          </View>
        ))}
      </View>

      {!hasActivity ? (
        <View style={s.noActivity}>
          <SleepyMonitor />
          <Text style={s.noActivityTxt}>No activity yet</Text>
        </View>
      ) : (
        <>
          <Label style={{ marginTop: 4 }}>BrainGym</Label>
          <View style={s.statCard}>
            <View style={s.statRow}>
              <Stat value={bg.totalXp ?? 0} label="XP" color={C.green} />
              <Stat value={bg.quizzesCompleted ?? 0} label="Quizzes" />
              <Stat value={`${bg.accuracy ?? 0}%`} label="Accuracy" />
              <Stat value={bg.currentStreak ?? 0} label="Streak" color={C.orange} />
            </View>
          </View>

          <Label>Arena</Label>
          <View style={s.statCard}>
            <View style={s.statRow}>
              <Stat value={ar.rating ?? ARENA_BASE_RATING} label="Rating" color={C.blue} />
              <Stat value={ar.wins ?? 0} label="Wins" color={C.green} />
              <Stat value={ar.losses ?? 0} label="Losses" color={C.red} />
              <Stat value={ar.played ?? 0} label="Played" />
            </View>
          </View>

          <Label>Areas to focus</Label>
          <View style={s.focusCard}>
            <Text style={s.focusNum}>{mistakes}</Text>
            <Text style={s.updSub}>open items in the Mistake Book to revise.</Text>
            <Text style={s.focusReco}>
              {(Number(bg.accuracy) || 0) >= 80
                ? '🌟 Strong accuracy — encourage harder Arena challenges.'
                : '💡 A short daily BrainGym + clearing the Mistake Book will help most.'}
            </Text>
          </View>
        </>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

export default memo(ProgressTab);
