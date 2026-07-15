import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { ArrowUpCircle, X } from 'lucide-react-native';
import { useRuntimeConfig } from '../context/RuntimeConfigContext';

// Non-blocking, dismissible "update available" notice. Renders only when an OPTIONAL
// update is available (installed < required min, but force-update is off). Safe to drop
// anywhere near the top of a screen — it renders null when there's nothing to show.
export default function OptionalUpdateBanner() {
  const { optionalUpdateAvailable, storeUrl, platformMin } = useRuntimeConfig();
  const [dismissed, setDismissed] = useState(false);
  if (!optionalUpdateAvailable || dismissed) return null;

  const open = () => {
    const fallback = Platform.select({ ios: 'itms-apps://apps.apple.com', android: 'market://details?id=com.ailernova', default: 'https://ailernova.in' });
    Linking.openURL(storeUrl && storeUrl.trim() ? storeUrl.trim() : fallback).catch(() => {});
  };

  return (
    <View style={styles.wrap}>
      <ArrowUpCircle size={18} color="#4F46E5" strokeWidth={2.4} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Update available</Text>
        <Text style={styles.sub}>Version {platformMin} brings improvements — tap to update.</Text>
      </View>
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel="Update the app"><Text style={styles.cta}>Update</Text></Pressable>
      <Pressable onPress={() => setDismissed(true)} accessibilityRole="button" accessibilityLabel="Dismiss update notice" hitSlop={8}><X size={16} color="#A6ABBE" /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ECEBFE', borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14, marginHorizontal: 18, marginTop: 10 },
  title: { fontSize: 13, fontWeight: '800', color: '#151829' },
  sub: { fontSize: 11.5, fontWeight: '600', color: '#6A7086', marginTop: 1 },
  cta: { fontSize: 12.5, fontWeight: '800', color: '#4F46E5', paddingHorizontal: 6 },
});
