import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY } from '../../theme/designSystem';

/**
 * The design system's "Text" button — no fill, no border, just a purple label.
 * For the lightest-weight action on a page, e.g. "← Back to Dashboard".
 */
export default function TextButton({ label, onPress, icon, style, textStyle, disabled = false }) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, disabled && styles.disabled, style]}
    >
      {icon}
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  disabled: { opacity: 0.5 },
  label: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: COLORS.primaryLight,
  },
});
