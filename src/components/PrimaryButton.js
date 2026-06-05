 import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../constants/colors';

export default function PrimaryButton({ title, onPress, loading }) {
  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.disabled]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
