// src/components/support/HelpFab.js
// The floating chat bubble that sits just above the bottom nav on both the student app
// and the parent dashboard. Tapping it opens the topic-select screen (SupportSheet),
// where the user picks what the issue is about and gets handed to the team that owns it.
//
// Deliberately a floating bubble rather than a seventh tab: the student dock already
// carries six, and support is a "when something breaks" action, not a destination you
// browse. It breathes very slightly so it reads as reachable without pulling focus.
import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { MessageCircle } from 'lucide-react-native';

import { PressableScale } from '../../screens/parent/ParentApp/anim';
import SupportSheet from './SupportSheet';
import { STUDENT_CATEGORIES, PARENT_CATEGORIES, DEFAULT_AGENT } from './supportConfig';

const SIZE = 52;
// The topic-select design's primary accent (#FA4F07, the topic-1 badge). One colour on
// both apps so the chat entry point is the same object wherever you meet it.
const ACCENT = '#FA4F07';

export default function HelpFab({
  role = 'student',
  userName,
  userPhone,             // goes on the ticket so the assigned member can call back
  childName,
  bottom = 84,           // distance above the screen bottom — set to clear the nav bar
  right = 16,
  hidden = false,        // immersive screens (AI Teacher lesson, MCQ quiz) hide it
  categories,
  agent = DEFAULT_AGENT,
  accent = ACCENT,
  // Real case data per topic id — drives the receipt-card conversation. Nothing is
  // rendered without it, on purpose: see the warning above DEMO_TICKET_CONTEXT in
  // supportConfig.js. To preview that screen on a dev build, pass
  //   ticketContexts={{ billing: DEMO_TICKET_CONTEXT }}
  ticketContexts,
  onContextAction,
}) {
  const [open, setOpen] = useState(false);
  const isParent = role === 'parent';
  const cats = categories || (isParent ? PARENT_CATEGORIES : STUDENT_CATEGORIES);

  // Slow halo pulse — one ring, low opacity. Calm, not a notification badge.
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (hidden) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(1400),
      ]),
    );
    loop.start();
    return () => { loop.stop(); ring.setValue(0); };
  }, [hidden, ring]);
  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.28, 0] });

  return (
    <>
      {!hidden && (
        <View style={[s.wrap, { bottom, right }]} pointerEvents="box-none">
          <Animated.View
            pointerEvents="none"
            style={[s.ring, { backgroundColor: accent, opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
          <PressableScale
            style={[s.fab, { backgroundColor: accent, shadowColor: accent }]}
            onPress={() => setOpen(true)}
            scaleTo={0.9}
            accessibilityRole="button"
            accessibilityLabel="Chat with support"
            accessibilityHint="Pick a topic and reach the Ailernova team"
          >
            <MessageCircle size={24} color="#FFFFFF" strokeWidth={2.3} />
          </PressableScale>
        </View>
      )}

      <SupportSheet
        visible={open}
        onClose={() => setOpen(false)}
        categories={cats}
        role={role}
        userName={userName}
        userPhone={userPhone}
        childName={childName}
        agent={agent}
        ticketContexts={ticketContexts}
        onContextAction={onContextAction}
      />
    </>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  fab: {
    width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
});
