import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS, FONT_FAMILY } from '../../theme/designSystem';

/**
 * The design's shared `primary-button` node, 1:1: 56px tall, 28px radius, 24px
 * side padding, a three-stop purple gradient, a hairline white border at 12% and
 * a purple drop shadow. Used for "Get Started", "Next", and every primary CTA
 * after them — change it here, not per screen.
 */
export default function PrimaryButton({ label, onPress, style }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.shadow, style]}>
      {/* The gradient has to be clipped to the radius, but `overflow: hidden` on the
          same view would also clip the drop shadow away on iOS — hence two views. */}
      <View style={styles.clip}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 28,
    shadowColor: '#6D4AFF',
    shadowOpacity: 0.251,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  clip: {
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF1F',   // white @ 12%
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});
