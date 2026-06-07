import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import COLORS from '../constants/colors';

const DashboardScreen = () => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.center}>
      <Text style={styles.emoji}>📊</Text>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.sub}>Your progress & stats go here</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji:  { fontSize: 48, marginBottom: 12 },
  title:  { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  sub:    { fontSize: 14, color: COLORS.textSecondary },
});

export default DashboardScreen;