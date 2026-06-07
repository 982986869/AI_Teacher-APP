import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

const LoadingSpinner = ({ fullScreen = false, size = 'large', color = COLORS.primary }) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }
  return <ActivityIndicator size={size} color={color} />;
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});

export default LoadingSpinner;