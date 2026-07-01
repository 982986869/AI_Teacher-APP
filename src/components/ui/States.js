// src/components/ui/States.js
// Shared, dark-theme-consistent UI states: Loading · Skeleton · Empty · Error.
// Reusable primitives so every data screen handles its lifecycle the same way.
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';

const ACCENT = '#39D98A';

export function LoadingState({ label = 'Loading…', color = ACCENT, style }) {
  return (
    <View style={[st.center, style]}>
      <ActivityIndicator size="large" color={color} />
      {!!label && <Text style={st.loadingTxt}>{label}</Text>}
    </View>
  );
}

// A single shimmering placeholder block.
export function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  const a = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 750, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.4, duration: 750, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: '#1E1E24', opacity: a }, style]} />;
}

// A card-shaped skeleton; render `count` of them for lists.
export function SkeletonCard({ lines = 2 }) {
  return (
    <View style={st.skCard}>
      <Skeleton width="55%" height={14} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '40%' : '90%'} height={11} style={{ marginTop: 10 }} />
      ))}
    </View>
  );
}

export function SkeletonList({ count = 4, lines = 2 }) {
  return <View>{Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} lines={lines} />)}</View>;
}

export function EmptyState({ emoji = '🗂️', title = 'Nothing here yet', subtitle, actionLabel, onAction, style }) {
  return (
    <View style={[st.center, st.pad, style]}>
      <Text style={st.emoji}>{emoji}</Text>
      <Text style={st.title}>{title}</Text>
      {!!subtitle && <Text style={st.sub}>{subtitle}</Text>}
      {!!actionLabel && (
        <TouchableOpacity style={st.btn} activeOpacity={0.9} onPress={onAction}>
          <Text style={st.btnTxt}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function ErrorState({ title = 'Something went wrong', subtitle = 'Please check your connection and try again.', onRetry, style }) {
  return (
    <View style={[st.center, st.pad, style]}>
      <Text style={st.emoji}>⚠️</Text>
      <Text style={st.title}>{title}</Text>
      {!!subtitle && <Text style={st.sub}>{subtitle}</Text>}
      {!!onRetry && (
        <TouchableOpacity style={st.btn} activeOpacity={0.9} onPress={onRetry}>
          <Text style={st.btnTxt}>RETRY</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: 36 },
  loadingTxt: { color: '#9A9AA0', fontSize: 13, fontWeight: '700', marginTop: 12 },
  skCard: { backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262E', borderRadius: 16, padding: 16, marginBottom: 12 },
  emoji: { fontSize: 46, marginBottom: 8 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  sub: { color: '#9A9AA0', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  btn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28, marginTop: 20 },
  btnTxt: { color: '#06210F', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});
