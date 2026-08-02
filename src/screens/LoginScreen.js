import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, Phone as PhoneIcon, ChevronLeft } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogle, GoogleSignInCancelled } from '../utils/googleSignin';

import AuthInput     from '../components/brand/AuthInput';
import SocialButton  from '../components/brand/SocialButton';
import AuthError     from '../components/brand/AuthError';
import PrimaryButton from '../components/brand/PrimaryButton';
import { COLORS, TYPE, FONT_FAMILY, SPACING } from '../theme/designSystem';

import { loginWithEmail, loginWithGoogle, sendOTP } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, validatePhone } from '../utils/validators';

// "Welcome Back" — the design's sign-in screen. Email+password is the primary
// path; phone becomes a "Continue with Phone" alt-method here (not a tab like
// the old build) that swaps the form in place, reusing the exact same OTP
// hand-off to OTPScreen. Apple has no backend route yet — its button is a
// straight "coming soon", same as Forgot Password (no screen exists for it
// yet either); neither is faked into looking functional.
const LoginScreen = ({ navigation }) => {
  const { signIn } = useAuth();
  const [mode, setMode] = useState('email'); // 'email' | 'phone'

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const switchMode = (next) => { setMode(next); setError(''); };

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
      setError(e?.response?.data?.error || e?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      setLoading(true);
      const { idToken } = await signInWithGoogle();
      const data = await loginWithGoogle({ idToken });
      await signIn(data);
    } catch (e) {
      if (e instanceof GoogleSignInCancelled) return;
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {mode === 'phone' && (
          <TouchableOpacity style={styles.back} onPress={() => switchMode('email')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={18} color={COLORS.textSecondary} strokeWidth={2.3} />
            <Text style={styles.backText}>Email &amp; password</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.heading}>{mode === 'email' ? 'Welcome Back' : 'Enter Your Phone'}</Text>
        <Text style={styles.sub}>
          {mode === 'email' ? 'Sign in to continue learning' : "We'll text you a one-time code"}
        </Text>

        <AuthError message={error} />

        {mode === 'email' ? (
          <>
            <AuthInput
              icon={<Mail size={18} color={COLORS.textSecondary} strokeWidth={2} />}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <AuthInput
              icon={<Lock size={18} color={COLORS.textSecondary} strokeWidth={2} />}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPw((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPw ? <EyeOff size={18} color={COLORS.textSecondary} strokeWidth={2} /> : <Eye size={18} color={COLORS.textSecondary} strokeWidth={2} />}
                </TouchableOpacity>
              }
            />

            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => Alert.alert('Coming soon', 'Password reset is on its way.')}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PrimaryButton label="Sign In" onPress={handleEmailLogin} loading={loading} style={styles.mainBtn} />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <SocialButton
              icon={<Ionicons name="logo-google" size={18} color="#EA4335" />}
              label="Continue with Google"
              onPress={handleGoogleLogin}
              style={styles.socialGap}
            />
            <SocialButton
              icon={<Ionicons name="logo-apple" size={19} color={COLORS.textPrimary} />}
              label="Continue with Apple"
              onPress={() => Alert.alert('Coming soon', 'Apple sign-in is on its way.')}
              style={styles.socialGap}
            />
            <SocialButton
              icon={<PhoneIcon size={17} color={COLORS.textPrimary} strokeWidth={2} />}
              label="Continue with Phone"
              onPress={() => switchMode('phone')}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
                <Text style={styles.switchLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}><Text style={styles.countryText}>🇮🇳 +91</Text></View>
              <AuthInput
                icon={<PhoneIcon size={18} color={COLORS.textSecondary} strokeWidth={2} />}
                placeholder="10-digit phone number"
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.phoneInput}
              />
            </View>
            <PrimaryButton label="Send OTP" onPress={handleSendOTP} loading={loading} style={styles.mainBtn} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.xl },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: SPACING.lg },
  backText: { fontFamily: FONT_FAMILY.medium, fontSize: 13, color: COLORS.textSecondary },
  heading: { ...TYPE.display, marginBottom: 6 },
  sub: { ...TYPE.body, marginBottom: SPACING.xl },
  forgotRow: { alignItems: 'flex-end', marginTop: -4, marginBottom: SPACING.lg },
  forgotText: { fontFamily: FONT_FAMILY.medium, fontSize: 13, color: COLORS.primaryLight },
  mainBtn: { marginBottom: SPACING.xs },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontFamily: FONT_FAMILY.medium, fontSize: 12, color: COLORS.textSecondary, marginHorizontal: SPACING.md },
  socialGap: { marginBottom: SPACING.md },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  switchLabel: { fontFamily: FONT_FAMILY.regular, fontSize: 13, color: COLORS.textSecondary },
  switchLink: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.primaryLight },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  countryCode: { height: 52, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.card, justifyContent: 'center', paddingHorizontal: SPACING.md },
  countryText: { fontFamily: FONT_FAMILY.medium, fontSize: 14, color: COLORS.textPrimary },
  phoneInput: { flex: 1, marginBottom: 0 },
});

export default LoginScreen;
