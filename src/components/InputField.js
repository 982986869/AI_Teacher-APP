 import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../constants/colors';

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
}) {
  const [hide, setHide] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={COLORS.subtext}
          secureTextEntry={hide}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHide(!hide)}>
            <Text style={styles.toggle}>{hide ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: COLORS.text,
  },
  toggle: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
  },
});
