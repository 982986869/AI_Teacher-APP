import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

const ErrorMessage = ({ message, style }) => {
  if (!message) return null;
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  text: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ErrorMessage;