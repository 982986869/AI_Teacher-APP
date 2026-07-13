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

// Premium press feedback — gently scales down while held. A drop-in replacement
// for TouchableOpacity (same style / onPress / disabled / children) that also
// wires proper accessibility (role, label, disabled state) for screen readers.
export function PressableScale({
  children, style, onPress, disabled = false, scaleTo = 0.96, hitSlop,
  accessibilityLabel, accessibilityHint, accessibilityRole = 'button', ...rest
}) {
  const s = useRef(new Animated.Value(1)).current;
  const animate = (to) => Animated.spring(s, { toValue: to, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  return (
    <APressable
      style={[style, { transform: [{ scale: s }] }]}
      onPress={disabled ? undefined : onPress}
      onPressIn={() => { if (!disabled) animate(scaleTo); }}
      onPressOut={() => animate(1)}
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
