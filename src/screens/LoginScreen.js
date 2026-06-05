import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS } from '../constants/colors';

const ROLES = ['Student', 'Teacher', 'Admin'];

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('Student');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      Alert.alert('Success', `Logged in as ${selectedRole}`);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerContainer}>
        <Text style={styles.appName}>AiLernova</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to your account</Text>

        <Text style={styles.roleLabel}>Login as</Text>
        <View style={styles.roleContainer}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleButton,
                selectedRole === role && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole(role)}
            >
              <Text
                style={[
                  styles.roleText,
                  selectedRole === role && styles.roleTextActive,
                ]}
              >
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="Enter your email"
        />

        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter your password"
        />

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <PrimaryButton
          title={`Login as ${selectedRole}`}
          onPress={handleLogin}
          loading={loading}
        />

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.subtext,
  },
  roleTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: COLORS.subtext,
    fontSize: 14,
  },
  signupLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});