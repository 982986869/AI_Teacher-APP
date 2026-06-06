import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      // TODO: replace with your real API call
      // const response = await authApi.login({ email: identifier, password });
      // await AsyncStorage.setItem('token', response.data.token);

      // ✅ navigate to onboarding after successful login
      navigation.replace('Onboarding');
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPLogin = () => {
    // TODO: implement OTP login
    console.log('OTP login pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        {/* Logo / Title */}
        <Text style={styles.appName}>ailernova</Text>
        <Text style={styles.title}>Login to your{'\n'}Student Account</Text>

        {/* Card */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Email or Phone number"
            placeholderTextColor="#AAA"
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#AAA"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgotText}>
              Forgot your password?{' '}
              <Text style={styles.forgotLink}>Click here to Recover account</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.otpBtn} onPress={handleOTPLogin}>
            <Text style={styles.otpBtnText}>LOGIN WITH OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupText}>
              New here?{' '}
              <Text style={styles.signupLink}>Create an Account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F0F4FF' },
  inner:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  appName:     { fontSize: 28, fontWeight: '800', color: '#4A90E2', marginBottom: 6 },
  title:       { fontSize: 22, fontWeight: '700', color: '#222', textAlign: 'center', marginBottom: 24, lineHeight: 30 },
  card:        { width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12 },
  input:       { borderWidth: 1.5, borderColor: '#4A90E2', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#222', marginBottom: 14 },
  loginBtn:    { backgroundColor: '#4A90E2', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  loginBtnText:{ color: '#FFF', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  forgotText:  { textAlign: 'center', color: '#555', fontSize: 13, marginBottom: 16 },
  forgotLink:  { color: '#4A90E2', fontWeight: '600' },
  orRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  line:        { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  orText:      { marginHorizontal: 10, color: '#888', fontWeight: '600' },
  otpBtn:      { backgroundColor: '#E8A020', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  otpBtnText:  { color: '#FFF', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  signupText:  { textAlign: 'center', color: '#555', fontSize: 13 },
  signupLink:  { color: '#E8A020', fontWeight: '700' },
});