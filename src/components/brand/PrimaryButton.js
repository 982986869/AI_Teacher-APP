import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS, FONT_FAMILY } from '../../theme/designSystem';

/**
 * The design's shared `primary-button` node, 1:1: 56px tall, 28px radius, 24px
 * side padding, a three-stop purple gradient, a hairline white border at 12% and
 * a purple drop shadow. Used for "Get Started", "Next", every primary CTA after
 * them, and the auth screens (Sign In / Create Account, with `loading`) — change
 * it here, not per screen.
 */
export default function PrimaryButton({ label, onPress, icon, loading = false, disabled = false, style }) {
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={inactive}
      style={[styles.shadow, inactive && styles.shadowOff, style]}
    >
      {/* The gradient has to be clipped to the radius, but `overflow: hidden` on the
          same view would also clip the drop shadow away on iOS — hence two views. */}
      <View style={[styles.clip, inactive && styles.clipDisabled]}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {loading ? <ActivityIndicator color="#FFFFFF" /> : (
          <View style={styles.row}>
            {icon}
            <Text style={styles.label}>{label}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 28,
    shadowColor: '#FFC629',
    shadowOpacity: 0.251,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  shadowOff: { shadowOpacity: 0, elevation: 0 },
  clip: {
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.10)',   // white @ 12%
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clipDisabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    lineHeight: 22,
    color: '#111111',   // ink on yellow — white would be 1.7:1
  },
});
