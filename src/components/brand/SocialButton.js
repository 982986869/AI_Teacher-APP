import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, RADIUS, SPACING } from '../../theme/designSystem';

/** The outlined "Continue with X" row on the sign-in screen — same card/border
 * tokens as AuthInput so the two read as one family, an icon slot on the left
 * (Ionicons logo-google / logo-apple / call-outline, kept brand-accurate
 * rather than lucide's generic set), label centered. */
export default function SocialButton({ icon, label, onPress, style }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.btn, style]}>
      {icon}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  label: {
    fontFamily: FONT_FAMILY.semibold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});
