import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
// TODO: replace mock with real package after running: npm install @react-native-google-signin/google-signin
import { GoogleSignin } from '../utils/googleSigninMock';

import AuthHeader    from '../components/AuthHeader';
import InputField    from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorMessage  from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

import { loginWithEmail, loginWithGoogle, sendOTP } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, validatePhone } from '../utils/validators';
import COLORS from '../constants/colors';

const TABS = ['Email', 'Phone'];

const LoginScreen = ({ navigation }) => {
  const { signIn } = useAuth();
  const [activeTab, setActiveTab] = useState('Email');

  // Email state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  // Phone state
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ── Email Login ─────────────────────────────────────────────────────────────
  const handleEmailLogin = async () => {
    setError('');
    if (!validateEmail(email)) return setError('Enter a valid email address.');
    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);

    try {
      setLoading(true);
      const data = await loginWithEmail({ email, password });
      await signIn(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Google Login ─────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError('');
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const data = await loginWithGoogle({ idToken });
      await signIn(data);
    } catch (e) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Phone Login → OTP ────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    setError('');
    if (!validatePhone(phone)) return setError('Enter a valid 10-digit phone number.');
    try {
      setLoading(true);
      await sendOTP({ phone: `+91${phone}` });
      navigation.navigate('OTPScreen', { phone: `+91${phone}`, mode: 'login' });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AuthHeader onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>AILERNOVA</Text>
        <Text style={styles.heading}>Welcome back</Text>

        {/* Tab Row */}
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={styles.tab} onPress={() => { setActiveTab(t); setError(''); }}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
              {activeTab === t && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        <ErrorMessage message={error} />

        {activeTab === 'Email' && (
          <>
            <InputField
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <InputField
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPw(p => !p)}>
                  <Text style={{ fontSize: 16 }}>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              }
            />
            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
            <PrimaryButton title="Log in" onPress={handleEmailLogin} loading={loading} style={styles.mainBtn} />
          </>
        )}

        {activeTab === 'Phone' && (
          <>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}><Text style={styles.countryText}>🇮🇳 +91</Text></View>
              <InputField
                placeholder="10-digit phone number"
                value={phone}
                onChangeText={t => setPhone(t.replace(/\D/g, ''))}
                keyboardType="phone-pad"
                maxLength={10}
                style={{ flex: 1, marginBottom: 0 }}
              />
            </View>
            <PrimaryButton title="Send OTP" onPress={handleSendOTP} loading={loading} style={styles.mainBtn} />
          </>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} activeOpacity={0.8}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
            <Text style={styles.switchLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.white },
  scroll:     { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  logo:       { fontSize: 22, fontWeight: '800', letterSpacing: 3, color: COLORS.primary, textAlign: 'center', marginBottom: 6, marginTop: 12 },
  heading:    { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 24 },
  tabRow:     { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.divider, marginBottom: 20 },
  tab:        { flex: 1, alignItems: 'center', paddingBottom: 10 },
  tabText:    { fontSize: 14, fontWeight: '500', color: COLORS.tabInactive },
  tabTextActive: { color: COLORS.tabActive, fontWeight: '600' },
  tabUnderline:  { position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, backgroundColor: COLORS.tabBorder, borderRadius: 1 },
  forgotRow:  { alignItems: 'flex-end', marginBottom: 16, marginTop: -4 },
  forgotText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  mainBtn:    { marginTop: 4, marginBottom: 4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine:{ flex: 1, height: 0.5, backgroundColor: COLORS.divider },
  dividerText:{ marginHorizontal: 12, fontSize: 12, color: COLORS.textMuted },
  googleBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, height: 50, gap: 10 },
  googleIcon: { fontSize: 16, fontWeight: '700', color: COLORS.googleRed },
  googleText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  phoneRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  countryCode:{ height: 50, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: COLORS.subtleBg, justifyContent: 'center', paddingHorizontal: 14 },
  countryText:{ fontSize: 14, color: COLORS.textPrimary },
  switchRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  switchLabel:{ fontSize: 12, color: COLORS.textSecondary },
  switchLink: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
});

export default LoginScreen;