import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

const PrimaryButton = ({ title, onPress, loading = false, disabled = false, style, textStyle }) => (
  <TouchableOpacity
    style={[styles.btn, (disabled || loading) && styles.btnDisabled, style]}
    onPress={onPress}
    activeOpacity={0.8}
    disabled={disabled || loading}
  >
    {loading
      ? <ActivityIndicator color={COLORS.white} size="small" />
      : <Text style={[styles.text, textStyle]}>{title}</Text>
    }
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnDisabled: { opacity: 0.5 },
  text: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default PrimaryButton;