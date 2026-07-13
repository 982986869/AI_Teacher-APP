// src/theme/studentUI.js
// Shared Student UI kit — the single source of truth for the chrome every non-game content
// screen (Home, Sessions, Profile, Results, …) uses, so they can't drift apart. Extracts the
// previously copy-pasted helpers (InkSurface, SoftGlow) and the repeated header / section /
// error / button patterns. Feature-specific UI stays in its own screen; only genuinely shared
// primitives live here. Built on the studentTheme tokens + Nunito `T` + the shared anim.
import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, LinearGradient as LG, Stop, Rect } from 'react-native-svg';
import { CircleAlert, ArrowRight } from 'lucide-react-native';
import { T } from '../screens/parent/ParentApp/constants';
import { S, shadow, shadowSm } from './studentTheme';
import { PressableScale, Nudge } from '../screens/parent/ParentApp/anim';

let _uid = 0;

// Soft radial glow disc (a real light halo, not a hard circle).
export function SoftGlow({ size = 120, color = S.heroGlow, opacity = 0.5 }) {
  const id = useRef('sg' + (_uid++)).current;
  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx={size / 2} cy={size / 2} r={size / 2} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="0.6" stopColor={color} stopOpacity={opacity * 0.4} />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}

// Deep gradient surface for premium dark cards. Measured in px (userSpaceOnUse) so the
// gradient never skews on Android. Parent must be overflow:'hidden'.
export function InkSurface({ a = S.heroA, b = S.heroB, glow = S.heroGlow, radius = 0 }) {
  const [d, setD] = useState({ w: 0, h: 0 });
  const id = useRef('ink' + (_uid++)).current;
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} pointerEvents="none"
      onLayout={(e) => setD({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })}>
      {d.w > 0 && (
        <Svg width={d.w} height={d.h}>
          <Defs>
            <LG id={`${id}g`} x1="0" y1="0" x2={d.w} y2={d.h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={a} /><Stop offset="1" stopColor={b} />
            </LG>
            <RadialGradient id={`${id}h`} cx={d.w * 0.82} cy={d.h * 0.12} r={d.w * 0.72} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={glow} stopOpacity="0.4" /><Stop offset="1" stopColor={glow} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width={d.w} height={d.h} fill={`url(#${id}g)`} />
          <Rect width={d.w} height={d.h} fill={`url(#${id}h)`} />
        </Svg>
      )}
    </View>
  );
}

// Clean light screen header (title + optional subtitle + optional right slot), padding the
// top by the safe-area inset for edge-to-edge. The one header every standard screen uses.
export function StudentScreenHeader({ title, subtitle, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[ui.header, { paddingTop: insets.top + 8 }]}>
      <View style={{ flex: 1 }}>
        <T w="black" s={22} c={S.ink} style={{ letterSpacing: -0.5 }} numberOfLines={1}>{title}</T>
        {!!subtitle && <T w="semi" s={12.5} c={S.muted} style={{ marginTop: 1 }} numberOfLines={1}>{subtitle}</T>}
      </View>
      {right}
    </View>
  );
}

// Section header: quiet accent dot + bold title + optional right-aligned sub.
export function StudentSectionHeader({ title, accent = S.indigo, sub, style }) {
  return (
    <View style={[ui.secHead, style]}>
      <View style={[ui.secDot, { backgroundColor: accent }]} />
      <T w="black" s={16} c={S.ink} style={{ letterSpacing: -0.3 }}>{title}</T>
      {!!sub && <T w="bold" s={11.5} c={S.faint} style={{ marginLeft: 'auto' }}>{sub}</T>}
    </View>
  );
}

// Full-bleed error state with a Retry action — identical across every data screen.
export function StudentErrorState({ title = 'Something went wrong', message = 'Check your connection and try again.', onRetry, retryLabel = 'Retry' }) {
  return (
    <View style={ui.center}>
      <View style={ui.errIcon}><CircleAlert size={30} color={S.muted} strokeWidth={2} /></View>
      <T w="xbold" s={18} c={S.ink} style={{ textAlign: 'center' }}>{title}</T>
      <T w="med" s={13} c={S.muted} style={{ textAlign: 'center' }}>{message}</T>
      {!!onRetry && (
        <PressableScale style={ui.retryBtn} onPress={onRetry} accessibilityLabel={retryLabel}>
          <T w="bold" s={14} c="#fff">{retryLabel}</T>
        </PressableScale>
      )}
    </View>
  );
}

// Primary filled button with press-spring + optional icon + arrow nudge.
export function StudentPrimaryButton({ label, onPress, tint = S.indigo, Icon, showArrow, disabled, style, accessibilityLabel }) {
  return (
    <PressableScale
      style={[ui.primaryBtn, { backgroundColor: tint }, disabled && { opacity: 0.5 }, style]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      {!!Icon && <Icon size={17} color="#fff" strokeWidth={2.5} />}
      <T w="bold" s={14.5} c="#fff">{label}</T>
      {showArrow && <Nudge distance={5}><ArrowRight size={18} color="#fff" strokeWidth={2.8} /></Nudge>}
    </PressableScale>
  );
}

const ui = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 },
  secDot: { width: 8, height: 8, borderRadius: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  errIcon: { width: 74, height: 74, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center', ...shadowSm },
  retryBtn: { marginTop: 6, backgroundColor: S.indigo, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 30, ...shadowSm },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 16, paddingVertical: 15, ...shadowSm },
});

// Re-export tokens + skeleton primitive so a screen imports its whole kit from one module.
export { S, shadow, shadowSm } from './studentTheme';
export { Shimmer as StudentSkeleton } from '../screens/parent/ParentApp/anim';
