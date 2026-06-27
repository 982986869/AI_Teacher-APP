// Small, shared micro-interaction kit for the AI Teacher surfaces. Keeps the
// premium feel (entrance + press animations) consistent without duplicating
// animation logic across screens. Pure React Native core (Animated + Pressable),
// so it's safe across Expo 54 with no extra dependency.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

const APressable = Animated.createAnimatedComponent(Pressable);

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
