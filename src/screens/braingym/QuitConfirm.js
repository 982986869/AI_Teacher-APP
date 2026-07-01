// src/screens/braingym/QuitConfirm.js
// Confirmation overlay shown when the player taps the ✕ in a game. "Keep playing"
// dismisses it (stay in the game); "Quit" exits. Animated, blocks touches behind it.
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

export default function QuitConfirm({
  visible, onQuit, onCancel,
  title = 'Quit game?', message = 'You’ll lose your progress in this game.',
}) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(a, { toValue: visible ? 1 : 0, useNativeDriver: true, speed: 16, bounciness: 8 }).start();
  }, [visible, a]);

  if (!visible) return null;
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <View style={st.overlay}>
      <Animated.View style={[st.card, { opacity: a, transform: [{ scale }] }]}>
        <Text style={st.icon}>🚪</Text>
        <Text style={st.title}>{title}</Text>
        <Text style={st.msg}>{message}</Text>
        <TouchableOpacity style={st.cancel} activeOpacity={0.9} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Keep playing">
          <Text style={st.cancelTxt}>KEEP PLAYING</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.quit} activeOpacity={0.85} onPress={onQuit} accessibilityRole="button" accessibilityLabel="Quit game">
          <Text style={st.quitTxt}>Quit</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,7,0.78)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, zIndex: 50 },
  card: { width: '100%', maxWidth: 340, backgroundColor: '#16161C', borderWidth: 1, borderColor: '#2C2C34', borderRadius: 24, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 18, alignItems: 'center' },
  icon: { fontSize: 38, marginBottom: 6 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.2 },
  msg: { color: '#9A9AA0', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8, marginBottom: 22, lineHeight: 20 },
  cancel: { width: '100%', backgroundColor: '#39D98A', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  cancelTxt: { color: '#06210F', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  quit: { width: '100%', paddingVertical: 12, alignItems: 'center' },
  quitTxt: { color: '#FF6B62', fontSize: 14, fontWeight: '800' },
});
