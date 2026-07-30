// Small, shared micro-interaction kit for the AI Teacher surfaces. Keeps the
// premium feel (entrance + press animations) consistent without duplicating
// animation logic across screens. Pure React Native core (Animated + Pressable),
// so it's safe across Expo 54 with no extra dependency.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

const APressable = Animated.createAnimatedComponent(Pressable);

// Linear gradient fill without an extra native dependency — react-native-svg is
// already a dependency (the whiteboard boards use it). `colors` is a [from, to]
// pair from GRAD in premiumTheme; `diag` paints top-left → bottom-right, else
// left → right. Children render above the fill.
//
// Two Android details this has to get right:
//  • the SVG is sized from onLayout in real pixels (percentage sizes resolve
//    against the viewBox, not the laid-out box, so "100%" under-paints);
//  • `from` is also set as the View's backgroundColor — Android renders an
//    elevation shadow using the view's own background, so a transparent one
//    shows through as a white shape behind the card. It doubles as the fill
//    for the first frame, before onLayout has measured.
let gradSeq = 0;
export function Gradient({ colors, style, children, diag = true, pointerEvents }) {
  const id = useRef(`g${(gradSeq += 1)}`).current;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [from, to] = colors || ['#4F46E5', '#7E22CE'];

  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((p) => (Math.abs(p.w - width) < 0.5 && Math.abs(p.h - height) < 0.5 ? p : { w: width, h: height }));
  };

  return (
    <View style={[style, { backgroundColor: from }]} pointerEvents={pointerEvents} onLayout={onLayout}>
      {size.w > 0 && size.h > 0 && (
        <Svg style={StyleSheet.absoluteFill} width={size.w} height={size.h} pointerEvents="none">
          <Defs>
            <SvgLinearGradient
              id={id}
              gradientUnits="userSpaceOnUse"
              x1={0} y1={0}
              x2={size.w} y2={diag ? size.h : 0}
            >
              <Stop offset="0" stopColor={from} />
              <Stop offset="1" stopColor={to} />
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill={`url(#${id})`} />
        </Svg>
      )}
      {children}
    </View>
  );
}

// Entrance animation — a soft fade + slide (or scale). Subtle and short so it
// reads as "premium", never as a delay. Cleans its animation up on unmount.
export function Appear({ children, style, from = 'up', delay = 0, duration = 360 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(a, {
      toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [a, delay, duration]);

  const transform = from === 'scale'
    ? [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }]
    : from === 'down'
      ? [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }]
      : [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }];

  return <Animated.View style={[style, { opacity: a, transform }]}>{children}</Animated.View>;
}

// Premium press feedback — snaps down while held, then springs back with a touch
// of bounce (the Duolingo-style "alive" release). Drop-in for TouchableOpacity
// (same style / onPress / disabled / children) and wires accessibility (role,
// label, disabled state) for screen readers. `bounciness` tunes the release spring.
export function PressableScale({
  children, style, onPress, disabled = false, scaleTo = 0.96, hitSlop, bounciness = 7,
  accessibilityLabel, accessibilityHint, accessibilityRole = 'button', ...rest
}) {
  const s = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(s, { toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const release = () => Animated.spring(s, { toValue: 1, useNativeDriver: true, speed: 20, bounciness }).start();
  return (
    <APressable
      style={[style, { transform: [{ scale: s }] }]}
      onPress={disabled ? undefined : onPress}
      onPressIn={() => { if (!disabled) press(); }}
      onPressOut={release}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
    >
      {children}
    </APressable>
  );
}

// Pop — a spring entrance that overshoots then settles (scale `from`→1 + fade). The
// signature "professional" element-appear (Duolingo pops each new element in). Use
// for cards, quiz options, reward chips. Prefer over <Appear> when you want bounce.
export function Pop({ children, style, delay = 0, from = 0.85 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 11 }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [a, delay]);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [from, 1] });
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

// useShake — imperative horizontal shake for "wrong / try again" feedback. Returns
// [animatedStyle, trigger]; spread the style on an <Animated.View> and call trigger()
// on a wrong answer. Damped left-right so it reads as a firm "no", not a jitter.
export function useShake(distance = 8) {
  const x = useRef(new Animated.Value(0)).current;
  const shake = () => {
    x.setValue(0);
    Animated.sequence([
      Animated.timing(x, { toValue: -distance, duration: 45, useNativeDriver: true }),
      Animated.timing(x, { toValue: distance, duration: 45, useNativeDriver: true }),
      Animated.timing(x, { toValue: -distance * 0.6, duration: 45, useNativeDriver: true }),
      Animated.timing(x, { toValue: distance * 0.6, duration: 45, useNativeDriver: true }),
      Animated.timing(x, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  };
  return [{ transform: [{ translateX: x }] }, shake];
}

// usePop — imperative "success pop": a quick spring bump (1→peak→1) for correct
// answers, XP gains, streak ticks. Returns [animatedStyle, trigger].
export function usePop(peak = 1.18) {
  const s = useRef(new Animated.Value(1)).current;
  const pop = () => {
    s.setValue(1);
    Animated.sequence([
      Animated.spring(s, { toValue: peak, useNativeDriver: true, speed: 20, bounciness: 14 }),
      Animated.spring(s, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }),
    ]).start();
  };
  return [{ transform: [{ scale: s }] }, pop];
}
