import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

const AuthHeader = ({ onBack, title }) => (
  <View style={styles.row}>
    {onBack ? (
      <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    ) : <View style={styles.placeholder} />}
    {title && <Text style={styles.title}>{title}</Text>}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backArrow: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  backText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  placeholder: { width: 48 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.15,
  },
});

export default AuthHeader;