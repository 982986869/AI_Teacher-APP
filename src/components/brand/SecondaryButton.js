import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, RADIUS } from '../../theme/designSystem';

/**
 * The design system's "Secondary" button — same pill shape as PrimaryButton but
 * a flat solid fill (no gradient, no glow shadow), for actions that matter less
 * than the page's one primary CTA. e.g. "View Progress".
 */
export default function SecondaryButton({ label, onPress, icon, loading = false, disabled = false, style }) {
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={inactive}
      style={[styles.btn, inactive && styles.disabled, style]}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : (
        <View style={styles.row}>
          {icon}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
