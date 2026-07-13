// src/screens/parent/ParentApp/ChatTab.js — mentor chat, locked until the first class.
// The empty state plays a compact, looping "live conversation": a wave, then the mentor
// TYPES (three dots) and that same bubble resolves into a message, then a reply — like a
// real chat. Copy + CTA below, and a dark scheduled-time banner once a demo is booked.
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { C, st, T } from './constants';
import Header from './Header';
import { PressableScale, FadeIn, Breathe, Nudge, Wave } from './anim';
import { fmtDateShort, fmtTime } from './demoConfig';

const CHAT_BG = '#4F46E5';   // premium indigo (replaces the flat Cuemath cyan)
const OUTLINE = '#15202A';
const FILL = '#DCE7FF';
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const CYCLE = 5600;

// One bubble in the loop: waits (appearAt), springs in, holds until disappearAt, fades
// out, then repeats in sync with the cycle. A short-lived typing bubble + a message that
// appears as it leaves = "typed, then sent".
function ChatBubble({ appearAt, disappearAt, style, children }) {
  const o = useRef(new Animated.Value(0)).current;
  const s = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    let alive = true;
    const inT = 240, outT = 340;
    const hold = Math.max(0, disappearAt - appearAt - inT);
    const rest = Math.max(0, CYCLE - disappearAt - outT);
    const run = () => {
      if (!alive) return;
      o.setValue(0); s.setValue(0.55);
      Animated.sequence([
        Animated.delay(appearAt),
        Animated.parallel([
          Animated.timing(o, { toValue: 1, duration: inT, easing: EASE, useNativeDriver: true }),
          Animated.spring(s, { toValue: 1, useNativeDriver: true, damping: 11, stiffness: 210, mass: 0.6 }),
        ]),
        Animated.delay(hold),
        Animated.timing(o, { toValue: 0, duration: outT, easing: EASE, useNativeDriver: true }),
        Animated.delay(rest),
      ]).start(({ finished }) => { if (finished) run(); });
    };
    run();
    return () => { alive = false; o.stopAnimation(); s.stopAnimation(); };
  }, [appearAt, disappearAt, o, s]);
  const translateY = o.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  return <Animated.View style={[style, { opacity: o, transform: [{ scale: s }, { translateY }] }]}>{children}</Animated.View>;
}

function Bubble({ side, fill = FILL, style, children }) {
  const right = side === 'right';
  return (
    <View style={[cs.bubble, { backgroundColor: fill }, style]}>
      {children}
      <View style={right ? cs.tailRO : cs.tailLO} />
      <View style={[right ? cs.tailRI : cs.tailLI, { borderTopColor: fill }]} />
    </View>
  );
}

function Dot({ delay }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 280, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.delay(500 - delay),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return <Animated.View style={[cs.dot, { opacity, transform: [{ translateY }] }]} />;
}
function TypingDots() {
  return <View style={cs.dotsRow}><Dot delay={0} /><Dot delay={130} /><Dot delay={260} /></View>;
}

export default function ChatTab({ meta, childName, onAvatar, onGym, onBookTrial, booking }) {
  const valid = booking && Number.isFinite(new Date(booking.date).getTime());
  const short = valid ? fmtDateShort(booking.date) : null;
  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} onGym={onGym} />
      <View style={cs.blue}>
        <FadeIn style={cs.center} y={10}>
          {/* compact looping live chat: wave → (typing → message) → reply */}
          <View style={cs.convo}>
            <View style={cs.rowL}>
              <ChatBubble appearAt={300} disappearAt={4900}>
                <Bubble side="left"><Wave><T s={22}>👋</T></Wave></Bubble>
              </ChatBubble>
            </View>

            {/* mentor types, then the same slot resolves into a message */}
            <View style={cs.slotL}>
              <ChatBubble appearAt={1150} disappearAt={2400} style={cs.abs}>
                <Bubble side="left" fill={OUTLINE} style={cs.typing}><TypingDots /></Bubble>
              </ChatBubble>
              <ChatBubble appearAt={2300} disappearAt={4900} style={cs.abs}>
                <Bubble side="left" style={cs.msg}>
                  <View style={[cs.line, { width: 104 }]} />
                  <View style={[cs.line, { width: 66, marginTop: 7 }]} />
                </Bubble>
              </ChatBubble>
            </View>

            <View style={cs.rowR}>
              <ChatBubble appearAt={3300} disappearAt={4900}>
                <Bubble side="right"><T s={21}>🙂</T></Bubble>
              </ChatBubble>
            </View>
          </View>

          <T w="bold" s={16.5} c="#FFFFFF" style={cs.text}>Chat with {childName}'s mentor,{'\n'}once you book your first class.</T>

          <Breathe>
            <PressableScale style={cs.btn} onPress={onBookTrial} accessibilityLabel="Book a free demo class">
              <T w="bold" s={14.5} c={C.ink}>Book a free demo</T>
              <Nudge distance={5}><ArrowRight size={17} color={C.ink} strokeWidth={2.6} /></Nudge>
            </PressableScale>
          </Breathe>
        </FadeIn>

        {valid && short && (
          <FadeIn y={0} style={cs.banner}>
            <T w="semi" s={13} c="rgba(255,255,255,0.78)">Your first session is scheduled for</T>
            <T w="xbold" s={15} c="#fff" style={{ marginTop: 3, letterSpacing: 0.3 }}>
              {short.dow.toUpperCase()} · {short.day} {short.month} · {fmtTime(booking.date)}
            </T>
          </FadeIn>
        )}
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  blue: { flex: 1, backgroundColor: CHAT_BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 22 },
  text: { textAlign: 'center', lineHeight: 24 },

  // compact conversation — small bubbles, tight rows, plenty of breathing room around it
  convo: { width: 210, height: 168, justifyContent: 'center' },
  rowL: { alignSelf: 'flex-start' },
  rowR: { alignSelf: 'flex-end', marginTop: 12 },
  slotL: { alignSelf: 'flex-start', height: 52, marginTop: 12 },
  abs: { position: 'absolute', left: 0, top: 0 },

  bubble: { borderRadius: 14, borderWidth: 2.5, borderColor: OUTLINE, paddingHorizontal: 13, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  typing: { paddingVertical: 12, paddingHorizontal: 14 },
  msg: { alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14 },
  line: { height: 7, borderRadius: 4, backgroundColor: 'rgba(21,32,42,0.18)' },
  dotsRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EAF6FF', marginHorizontal: 2.5 },

  tailRO: { position: 'absolute', right: 12, bottom: -12, width: 0, height: 0, borderLeftWidth: 11, borderLeftColor: 'transparent', borderTopWidth: 13, borderTopColor: OUTLINE },
  tailRI: { position: 'absolute', right: 15, bottom: -7, width: 0, height: 0, borderLeftWidth: 7, borderLeftColor: 'transparent', borderTopWidth: 8 },
  tailLO: { position: 'absolute', left: 12, bottom: -12, width: 0, height: 0, borderRightWidth: 11, borderRightColor: 'transparent', borderTopWidth: 13, borderTopColor: OUTLINE },
  tailLI: { position: 'absolute', left: 15, bottom: -7, width: 0, height: 0, borderRightWidth: 7, borderRightColor: 'transparent', borderTopWidth: 8 },

  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 13, paddingHorizontal: 22, paddingVertical: 13, shadowColor: '#0B2430', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  banner: { backgroundColor: '#312BA6', paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
});
