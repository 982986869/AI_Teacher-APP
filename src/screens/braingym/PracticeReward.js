// src/screens/braingym/PracticeReward.js
// Post-game reward shown on the practice radar: first a "+N points" burst, then the
// daily "Streak N day" card, then it auto-returns to the practice wheel.
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, Animated, Easing, Dimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { bumpPracticeStreak } from '../../utils/storage';
import { play } from '../../utils/sound';
import ArcTabs from './ArcTabs';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SIZE = Math.round(Math.min(SCREEN_W, SCREEN_H * 0.55));
const C = SIZE / 2;
const RINGS = [0.18, 0.3, 0.42, 0.54, 0.66, 0.78];

// Confetti — colored bits that fly out radially from the centre and fade.
const CONF_COLORS = ['#F5A623', '#39D98A', '#5B7CE2', '#E0322E', '#E26FA6', '#5BC3E2', '#FFD54A'];
const CONF = Array.from({ length: 18 }, (_, i) => ({
  ang: (i / 18) * Math.PI * 2 + ((i % 3) - 1) * 0.18,
  dist: 118 + (i % 4) * 30,
  col: CONF_COLORS[i % CONF_COLORS.length],
  rot: (i % 2 ? 1 : -1) * (200 + i * 12),
  sz: 7 + (i % 3) * 2,
}));
const Confetti = ({ trigger }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {CONF.map((c, i) => {
      const tx = trigger.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(c.ang) * c.dist] });
      const ty = trigger.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(c.ang) * c.dist] });
      const op = trigger.interpolate({ inputRange: [0, 0.12, 0.8, 1], outputRange: [0, 1, 1, 0] });
      const rot = trigger.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${c.rot}deg`] });
      const sc = trigger.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
      return (
        <Animated.View key={i} style={{
          position: 'absolute', left: '50%', top: '50%', width: c.sz, height: c.sz, borderRadius: 2,
          backgroundColor: c.col, opacity: op, transform: [{ translateX: tx }, { translateY: ty }, { rotate: rot }, { scale: sc }],
        }} />
      );
    })}
  </View>
);

// A number that rolls up to `to`.
const CountText = ({ to, style, prefix = '' }) => {
  const [n, setN] = useState(0);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setN(0);
    const id = v.addListener(({ value }) => setN(Math.round(value)));
    Animated.timing(v, { toValue: to, duration: 850, delay: 150, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [to, v]);
  return <Text style={style}>{prefix}{n}</Text>;
};

export default function PracticeReward({ points = 5, onDone, onTabPress, activeTab = 'practice' }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState('points'); // points | streak
  const [streak, setStreak] = useState(1);

  const pop = useRef(new Animated.Value(0)).current;
  const spark = useRef(new Animated.Value(0)).current;
  const conf = useRef(new Animated.Value(0)).current;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let t1, t2;
    (async () => {
      const s = await bumpPracticeStreak();
      if (mounted.current) setStreak(s);
    })();

    const burst = () => {
      pop.setValue(0); spark.setValue(0); conf.setValue(0);
      Animated.parallel([
        Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 12 }),
        Animated.timing(spark, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(conf, { toValue: 1, duration: 950, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    };
    burst();
    play('xp'); // XP / points burst sparkle
    t1 = setTimeout(() => { if (!mounted.current) return; setPhase('streak'); burst(); play('achievement'); }, 1700);
    t2 = setTimeout(() => { if (mounted.current && onDone) onDone(); }, 3700);
    return () => { mounted.current = false; clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const sparkScale = spark.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.6] });
  const sparkOpacity = spark.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.9, 0.5, 0] });

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}

      {/* header */}
      <View style={st.header}>
        <View style={st.userRow}>
          <View style={st.avatar}><Text style={{ fontSize: 20 }}>😎</Text></View>
          <View>
            <Text style={st.name}>{user?.name || 'kumkum02'}<Text style={st.grade}> {user?.grade || 'G11'}</Text></Text>
            <Text style={st.xp}>+{75}</Text>
          </View>
        </View>
        <View style={st.stats}>
          <View style={st.boltPill}><Text style={{ fontSize: 12 }}>⚡⚡</Text></View>
          <View style={st.badge}><Text style={{ fontSize: 13 }}>🏆</Text></View>
          <View style={[st.badge, st.badgeRed]}><Text style={st.badgeRedTxt}>{streak}</Text></View>
        </View>
      </View>

      {/* radar + reward */}
      <View style={st.center}>
        <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
            {RINGS.map((f, i) => <Circle key={i} cx={C} cy={C} r={(SIZE * f) / 2} fill="none" stroke={i % 2 ? '#141418' : '#1C1C22'} strokeWidth={1} />)}
          </Svg>

          {/* sparkle burst behind the content */}
          <Animated.Text style={[st.burst, { opacity: sparkOpacity, transform: [{ scale: sparkScale }] }]}>✦</Animated.Text>
          {/* colourful confetti flying out from the centre */}
          <Confetti trigger={conf} />

          {phase === 'points' ? (
            <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
              <CountText to={points} prefix="+" style={st.plus} />
              <Text style={st.plusLabel}>POINTS</Text>
            </Animated.View>
          ) : (
            <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
              <View style={st.streakFace}><Text style={{ fontSize: 40 }}>😌</Text></View>
              <CountText to={streak} style={st.streakNum} />
              <Text style={st.streakLabel}>Streak <Text style={st.streakDays}>{streak} day{streak === 1 ? '' : 's'}</Text></Text>
            </Animated.View>
          )}
        </View>
      </View>

      <ArcTabs active={activeTab} onTabPress={onTabPress} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#39D98A', alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: 16, fontWeight: '900' },
  grade: { color: '#8E8E93', fontSize: 9, fontWeight: '800' },
  xp: { color: '#39D98A', fontSize: 12, fontWeight: '800', marginTop: 1 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boltPill: { borderWidth: 1.5, borderColor: '#5A4A12', backgroundColor: '#231D08', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  badgeRed: { backgroundColor: '#E0322E', borderColor: '#E0322E' },
  badgeRedTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  burst: { position: 'absolute', fontSize: 120, color: 'rgba(245,166,35,0.35)' },

  plus: { color: '#F5A623', fontSize: 80, fontWeight: '900', letterSpacing: -2 },
  plusLabel: { color: '#C99A3A', fontSize: 14, fontWeight: '900', letterSpacing: 3, marginTop: 2 },

  streakFace: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#39D98A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  streakNum: { color: '#fff', fontSize: 56, fontWeight: '900' },
  streakLabel: { color: '#C7C7CD', fontSize: 16, fontWeight: '700', marginTop: 2 },
  streakDays: { color: '#fff', fontWeight: '900' },
});
