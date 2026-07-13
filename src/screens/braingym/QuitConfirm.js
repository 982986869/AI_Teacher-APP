// src/screens/braingym/QuitConfirm.js
// Confirmation overlay shown when the player taps the ✕ in a game. "Keep playing"
// dismisses it (stay in the game); "Quit" exits. Animated, blocks touches behind it.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { pressSpring, PRESS_SCALE } from './motion';

// A modal button that depresses with the app's shared press feel.
function ModalBtn({ style, textStyle, label, onPress, accessibilityLabel }) {
  const sc = useRef(new Animated.Value(1)).current;
  const to = (v) => pressSpring(sc, v).start();
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}
      onPressIn={() => to(PRESS_SCALE)} onPressOut={() => to(1)}
      accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[style, { transform: [{ scale: sc }] }]}>
        <Text style={textStyle}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function QuitConfirm({
  visible, onQuit, onCancel,
  title = 'Quit game?', message = 'You’ll lose your progress in this game.',
}) {
  const a = useRef(new Animated.Value(0)).current;
  // Stay mounted through the exit so the dismiss actually animates (nothing should
  // disappear instantly); unmount only once the close has played out.
  const [render, setRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRender(true);
      // Open: spring in with a little overshoot (anticipation → settle).
      Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 8 }).start();
    } else if (render) {
      // Close: quick accelerate-out (fade + shrink), then unmount. Kept short so it
      // still feels fast.
      Animated.timing(a, { toValue: 0, duration: 170, easing: Easing.in(Easing.cubic), useNativeDriver: true })
        .start(({ finished }) => { if (finished) setRender(false); });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!render) return null;
  // Backdrop + card fade together; the card also scales, so it grows on open and
  // shrinks away on close instead of popping.
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  return (
    <Animated.View style={[st.overlay, { opacity: a }]} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[st.card, { transform: [{ scale }] }]}>
        <Text style={st.icon}>🚪</Text>
        <Text style={st.title}>{title}</Text>
        <Text style={st.msg}>{message}</Text>
        <ModalBtn style={st.cancel} textStyle={st.cancelTxt} label="KEEP PLAYING" onPress={onCancel} accessibilityLabel="Keep playing" />
        <ModalBtn style={st.quit} textStyle={st.quitTxt} label="Quit" onPress={onQuit} accessibilityLabel="Quit game" />
      </Animated.View>
    </Animated.View>
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
