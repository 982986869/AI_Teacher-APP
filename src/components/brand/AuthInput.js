import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY, RADIUS, SPACING } from '../../theme/designSystem';

/**
 * The dark input field shared by Login/Signup: a left icon, translucent card
 * fill, hairline border that goes primary-purple on focus, and an optional
 * right slot (the password eye toggle). Same prop shape as the legacy
 * InputField so screens read the same either way — only the skin changed.
 */
export default function AuthInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  rightIcon,
  style,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.box, focused && styles.boxFocused, !!error && styles.boxError]}>
        {icon}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {rightIcon}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.md },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
  },
  boxFocused: { borderColor: COLORS.primary },
  boxError: { borderColor: COLORS.error },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  errorText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
    marginLeft: 2,
  },
});
