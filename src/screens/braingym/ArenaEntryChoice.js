// src/screens/braingym/ArenaEntryChoice.js
// Entry popup shown before a battle: learn how to play, or jump straight in.
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Animated,
} from 'react-native';

export default function ArenaEntryChoice({ onLearn, onPlay, onExit }) {
  const pop = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1400, useNativeDriver: true }),
    ])).start();
  }, [pop, float]);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const lift = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#0B0B0D' }} />}

      <View style={st.top}>
        <TouchableOpacity onPress={onExit} style={st.x} activeOpacity={0.85} accessibilityLabel="Close">
          <Text style={st.xTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={st.center}>
        <Animated.View style={[st.card, { opacity: pop, transform: [{ scale }] }]}>
          <Animated.View style={[st.badge, { transform: [{ translateY: lift }] }]}>
            <Text style={{ fontSize: 44 }}>⚔️</Text>
          </Animated.View>

          <Text style={st.title}>Arena Battle</Text>
          <Text style={st.sub}>No Attack · a quick 1v1 duel against a live opponent.</Text>

          <TouchableOpacity style={[st.btn, st.btnPlay]} activeOpacity={0.9} onPress={onPlay} accessibilityRole="button" accessibilityLabel="Play now">
            <Text style={st.btnPlayTxt}>⚡  PLAY NOW</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[st.btn, st.btnLearn]} activeOpacity={0.85} onPress={onLearn} accessibilityRole="button" accessibilityLabel="Learn how to play">
            <Text style={st.btnLearnTxt}>📘  LEARN HOW TO PLAY</Text>
          </TouchableOpacity>

          <Text style={st.hint}>New here? Watch the quick demo first.</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0D' },
  top: { flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 16, paddingVertical: 12 },
  x: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  xTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, paddingBottom: 40 },
  card: { width: '100%', maxWidth: 380, backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262E', borderRadius: 26, paddingHorizontal: 22, paddingTop: 30, paddingBottom: 24, alignItems: 'center' },
  badge: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#1C1C22', borderWidth: 2, borderColor: '#2E2E38', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  sub: { color: '#9A9AA0', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },

  btn: { width: '100%', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnPlay: { backgroundColor: '#39D98A' },
  btnPlayTxt: { color: '#06210F', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  btnLearn: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#3A3A44' },
  btnLearnTxt: { color: '#D8D8DE', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  hint: { color: '#6E6E77', fontSize: 12, fontWeight: '700', marginTop: 6 },
});
