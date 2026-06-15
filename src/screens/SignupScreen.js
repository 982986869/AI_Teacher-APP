import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';

import AuthHeader    from '../components/AuthHeader';
import InputField    from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorMessage  from '../components/ErrorMessage';

import { signupWithEmail, requestPhoneOtp } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, validateName, validatePhone } from '../utils/validators';
import COLORS from '../constants/colors';

const TABS = ['Email', 'Phone'];

const SignupScreen = ({ navigation }) => {
  const { signIn } = useAuth();
  const [activeTab, setActiveTab] = useState('Email');

  // Email state
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [grade, setGrade]       = useState('');

  // Phone state
  const [phone, setPhone]         = useState('');
  const [phoneName, setPhoneName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ── Email Signup (real backend JWT) ──────────────────────────────────────────
  const handleEmailSignup = async () => {
    setError('');
    const nameErr = validateName(name);
    if (nameErr) return setError(nameErr);
    if (!validateEmail(email)) return setError('Enter a valid email address.');
    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);

    try {
      setLoading(true);
      const data = await signupWithEmail({ name, email, password, grade });
      await signIn(data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Phone Signup → request OTP → OTP screen ──────────────────────────────────
  const handleSendOTP = async () => {
    setError('');
    const nameErr = validateName(phoneName);
    if (nameErr) return setError(nameErr);
    if (!validatePhone(phone)) return setError('Enter a valid 10-digit phone number.');
    const fullPhone = `+91${phone}`;
    try {
      setLoading(true);
      const data = await requestPhoneOtp({ phone: fullPhone });
      navigation.navigate('OTPScreen', {
        phone: fullPhone,
        name: phoneName,
        grade,
        mode: 'signup',
        devOtp: data?.devOtp,
      });
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AuthHeader onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>AILERNOVA</Text>
        <Text style={styles.heading}>Create your account</Text>

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
            <InputField placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
            <InputField placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <InputField
              placeholder="Password (min 8 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPw(p => !p)}>
                  <Text style={{ fontSize: 16 }}>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              }
            />
            <InputField placeholder="Grade / Class (optional)" value={grade} onChangeText={setGrade} />
            <PrimaryButton title="Create account" onPress={handleEmailSignup} loading={loading} style={styles.mainBtn} />
          </>
        )}

        {activeTab === 'Phone' && (
          <>
            <InputField placeholder="Full name" value={phoneName} onChangeText={setPhoneName} autoCapitalize="words" />
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
            <InputField placeholder="Grade / Class (optional)" value={grade} onChangeText={setGrade} style={{ marginTop: 10 }} />
            <PrimaryButton title="Send OTP" onPress={handleSendOTP} loading={loading} style={styles.mainBtn} />
          </>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google sign-up — disabled until backend support exists */}
        <View style={[styles.googleBtn, styles.disabledBtn]}>
          <Text style={[styles.googleIcon, styles.disabledTxt]}>G</Text>
          <Text style={[styles.googleText, styles.disabledTxt]}>Continue with Google</Text>
          <View style={styles.badge}><Text style={styles.badgeTxt}>Coming soon</Text></View>
        </View>

        <Text style={styles.terms}>
          By signing up, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Use</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
            <Text style={styles.switchLink}>Log in</Text>
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
  mainBtn:    { marginTop: 6, marginBottom: 4 },
  phoneRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  countryCode:{ height: 50, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: COLORS.subtleBg, justifyContent: 'center', paddingHorizontal: 14 },
  countryText:{ fontSize: 14, color: COLORS.textPrimary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine:{ flex: 1, height: 0.5, backgroundColor: COLORS.divider },
  dividerText:{ marginHorizontal: 12, fontSize: 12, color: COLORS.textMuted },
  googleBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, height: 50, gap: 10 },
  disabledBtn:{ opacity: 0.6, backgroundColor: COLORS.subtleBg },
  googleIcon: { fontSize: 16, fontWeight: '700', color: COLORS.googleRed },
  googleText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  disabledTxt:{ color: COLORS.textMuted },
  badge:      { backgroundColor: COLORS.border, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  badgeTxt:   { fontSize: 9, fontWeight: '700', color: COLORS.textSecondary },
  terms:      { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  termsLink:  { color: COLORS.textSecondary, fontWeight: '500' },
  switchRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchLabel:{ fontSize: 12, color: COLORS.textSecondary },
  switchLink: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
});

export default SignupScreen;
