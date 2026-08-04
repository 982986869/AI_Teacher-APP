import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, RADIUS, SPACING } from '../../theme/designSystem';

/** Dark-theme replacement for the legacy light-pink ErrorMessage — same
 * `message` prop, so it drops straight into the same call sites. */
export default function AuthError({ message, style }) {
  if (!message) return null;
  return (
    <View style={[styles.box, style]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#EF444426', // COLORS.error @ 15%
    borderWidth: 1,
    borderColor: '#EF444440',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  text: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
  },
});
