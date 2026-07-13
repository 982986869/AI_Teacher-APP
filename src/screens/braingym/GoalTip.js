// src/screens/braingym/GoalTip.js
// A small "?" button that toggles a tooltip showing the game's goal/question.
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { pressSpring, PRESS_SCALE } from './motion';

export default function GoalTip({ text }) {
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false); // stays true through the exit
  const press = useRef(new Animated.Value(1)).current;
  const bubble = useRef(new Animated.Value(0)).current;

  const to = (v) => pressSpring(press, v).start();

  // Pops in on open with a little overshoot; on close it shrinks + fades back into the
  // button before unmounting (never a hard cut).
  useEffect(() => {
    if (open) {
      setShowBubble(true);
      bubble.setValue(0);
      Animated.spring(bubble, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 9 }).start();
    } else if (showBubble) {
      Animated.timing(bubble, { toValue: 0, duration: 140, easing: Easing.in(Easing.cubic), useNativeDriver: true })
        .start(({ finished }) => { if (finished) setShowBubble(false); });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={st.wrap}>
      <TouchableOpacity onPress={() => setOpen((o) => !o)} activeOpacity={0.85} accessibilityLabel="What to do"
        onPressIn={() => to(PRESS_SCALE)} onPressOut={() => to(1)}>
        <Animated.View style={[st.btn, { transform: [{ scale: press }] }]}>
          <Text style={st.q}>?</Text>
        </Animated.View>
      </TouchableOpacity>
      {showBubble && (
        <Animated.View style={[st.bubble, {
          opacity: bubble,
          transform: [
            { scale: bubble.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
            { translateY: bubble.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) },
          ],
        }]}>
          <Text style={st.bubbleTxt}>{text}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'relative' },
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16161A', borderWidth: 1.5, borderColor: '#2C2C30', alignItems: 'center', justifyContent: 'center' },
  q: { color: '#fff', fontSize: 16, fontWeight: '900' },
  bubble: { position: 'absolute', top: 42, right: 0, minWidth: 170, maxWidth: 240, backgroundColor: '#F4F4F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, zIndex: 60, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8 },
  bubbleTxt: { color: '#0B0B0D', fontSize: 13, fontWeight: '800', lineHeight: 18 },
});
