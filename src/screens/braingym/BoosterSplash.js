// src/screens/braingym/BoosterSplash.js
//
// Rocket "booster" splash shown between profile select and the intro.
// Auto-advances after ~1.7s (or tap to skip).
//
// Usage:
//   <BoosterSplash onDone={() => {/* go to intro */}} />

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Animated, Easing, TouchableWithoutFeedback, Text } from 'react-native';

const AMBER = '#F5B301';

const BoosterSplash = ({ onDone, duration = 1700 }) => {
  const lift = useRef(new Animated.Value(0)).current;
  const streak = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const finished = useRef(false);

  const finish = () => { if (!finished.current) { finished.current = true; onDone && onDone(); } };

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(lift, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(lift, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(streak, { toValue: 1, duration: 700, useNativeDriver: false }),
          Animated.timing(streak, { toValue: 0, duration: 700, useNativeDriver: false }),
        ]),
      ])
    );
    loop.start();
    const t = setTimeout(finish, duration);
    return () => { loop.stop(); clearTimeout(t); };
  }, []);

  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [4, -6] });
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const streakH = streak.interpolate({ inputRange: [0, 1], outputRange: [60, 104] });
  const streakO = streak.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <TouchableWithoutFeedback onPress={finish}>
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#0E0E10" />
        <Animated.View style={[s.rocket, { transform: [{ translateY }, { scale }] }]}>
          <Text style={{ fontSize: 70 }}>🚀</Text>
          <Animated.View style={[s.streak, { height: streakH, opacity: streakO }]} />
        </Animated.View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0E10', alignItems: 'center', justifyContent: 'center' },
  rocket: { width: 160, height: 160, borderRadius: 80, backgroundColor: AMBER, alignItems: 'center', justifyContent: 'center' },
  streak: { position: 'absolute', right: 34, top: 30, width: 3, backgroundColor: '#fff', borderRadius: 2 },
});

export default BoosterSplash;