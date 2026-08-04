import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { COLORS, FONT_FAMILY, RADIUS, SPACING } from '../../theme/designSystem';

/** Signup's "I agree to Terms & Privacy Policy" row. `children` carries the
 * mixed-style label (plain text + purple links) so this stays a dumb checkbox. */
export default function AuthCheckbox({ checked, onToggle, children }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
      </View>
      <Text style={styles.label}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  label: {
    flex: 1,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
});
