import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUpCircle, Download } from 'lucide-react-native';
import { useRuntimeConfig } from '../context/RuntimeConfigContext';

const C = { canvas: '#F4F5FB', card: '#FFFFFF', ink: '#151829', muted: '#6A7086', faint: '#A6ABBE', indigo: '#4F46E5', soft: '#ECEBFE' };

// Mandatory-update blocker. Shown when the installed version is below the required
// per-platform minimum and force-update is on. Uses the admin-configured store URL
// (falls back to the platform store if none is set). Store-open cannot be verified
// without a real device.
export default function ForceUpdateScreen() {
  const insets = useSafeAreaInsets();
  const { config, installedVersion, platformMin, storeUrl, refresh } = useRuntimeConfig();

  const openStore = () => {
    const fallback = Platform.select({
      ios: 'itms-apps://apps.apple.com',
      android: 'market://details?id=com.ailernova',
      default: 'https://ailernova.in',
    });
    const url = storeUrl && storeUrl.trim() ? storeUrl.trim() : fallback;
    Linking.openURL(url).catch(() => {
      if (url !== fallback) Linking.openURL(fallback).catch(() => {});
    });
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.center}>
        <View style={styles.iconWrap}><ArrowUpCircle size={36} color={C.indigo} strokeWidth={2} /></View>
        <Text style={styles.title}>Update required</Text>
        <Text style={styles.msg}>
          A newer version of Ailernova is required to continue. You're on {installedVersion}; version {platformMin} or later is needed.
        </Text>
        {!!config.releaseNotes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>What's new</Text>
            <Text style={styles.notesText}>{config.releaseNotes}</Text>
          </View>
        )}
        <Pressable style={styles.btn} onPress={openStore} accessibilityRole="button" accessibilityLabel="Update the app">
          <Download size={16} color="#fff" strokeWidth={2.5} /><Text style={styles.btnText}>Update now</Text>
        </Pressable>
        <Pressable style={styles.ghost} onPress={refresh} accessibilityRole="button" accessibilityLabel="Check again">
          <Text style={styles.ghostText}>I've updated — check again</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.canvas },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  iconWrap: { width: 78, height: 78, borderRadius: 26, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  title: { fontSize: 21, fontWeight: '900', color: C.ink, letterSpacing: -0.4 },
  msg: { fontSize: 14, fontWeight: '600', color: C.muted, textAlign: 'center', lineHeight: 21, maxWidth: 340 },
  notes: { backgroundColor: C.card, borderRadius: 16, padding: 16, width: '100%', maxWidth: 360, marginTop: 6 },
  notesLabel: { fontSize: 11, fontWeight: '800', color: C.faint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  notesText: { fontSize: 13.5, fontWeight: '600', color: C.ink, lineHeight: 20 },
  btn: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.indigo, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14.5 },
  ghost: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 16 },
  ghostText: { color: C.muted, fontWeight: '700', fontSize: 13 },
});
