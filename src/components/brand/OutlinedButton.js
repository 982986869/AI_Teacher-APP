import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, RADIUS } from '../../theme/designSystem';

/**
 * The design system's "Outlined" button — transparent fill, a hairline border,
 * text-primary label. For a real but non-CTA action, e.g. "Browse Courses".
 */
export default function OutlinedButton({ label, onPress, icon, loading = false, disabled = false, style }) {
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={inactive}
      style={[styles.btn, inactive && styles.disabled, style]}
    >
      {loading ? <ActivityIndicator color={COLORS.textPrimary} /> : (
        <>
          {icon}
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabled: { opacity: 0.5 },
  label: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
});
