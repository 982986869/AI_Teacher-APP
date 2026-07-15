import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloudOff, RefreshCw } from 'lucide-react-native';
import { useRuntimeConfig } from '../context/RuntimeConfigContext';

const C = { canvas: '#F4F5FB', card: '#FFFFFF', ink: '#151829', muted: '#6A7086', faint: '#A6ABBE', indigo: '#4F46E5', soft: '#ECEBFE' };

// Shown to non-admin users while maintenance mode is enabled (admins pass through).
export default function MaintenanceScreen() {
  const insets = useSafeAreaInsets();
  const { maintenance, refresh, loading } = useRuntimeConfig();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.center}>
        <View style={styles.iconWrap}><CloudOff size={34} color={C.muted} strokeWidth={2} /></View>
        <Text style={styles.title}>We'll be right back</Text>
        <Text style={styles.msg}>{maintenance?.message || 'Ailernova is undergoing scheduled maintenance. Please check back shortly.'}</Text>
        <Pressable style={styles.btn} onPress={refresh} accessibilityRole="button" accessibilityLabel="Try again">
          {loading ? <ActivityIndicator color="#fff" /> : (
            <><RefreshCw size={16} color="#fff" strokeWidth={2.5} /><Text style={styles.btnText}>Try again</Text></>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  iconWrap: { width: 74, height: 74, borderRadius: 24, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '900', color: C.ink, letterSpacing: -0.4 },
  msg: { fontSize: 14, fontWeight: '600', color: C.muted, textAlign: 'center', lineHeight: 21, maxWidth: 320 },
  btn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.indigo, paddingVertical: 13, paddingHorizontal: 26, borderRadius: 16 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14.5 },
});
