import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';

import AuthHeader    from '../components/AuthHeader';
import PrimaryButton from '../components/PrimaryButton';
import ErrorMessage  from '../components/ErrorMessage';

import { verifyPhoneOtp, requestPhoneOtp } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { OTP_RESEND_TIMER } from '../constants/config';
import COLORS from '../constants/colors';

const OTP_LENGTH = 6;

const OTPScreen = ({ navigation, route }) => {
 const { phone, name, grade, mode } = route.params || {}; // mode: 'signup' | 'login'
  const { signIn } = useAuth();

  const [otp, setOtp]       = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [timer, setTimer]   = useState(OTP_RESEND_TIMER);
  const [resent, setResent] = useState(false);
  const [devOtp, setDevOtp] = useState(route.params?.devOtp || null);

  const inputs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = (index, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    setError('');
    if (val && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return setError('Please enter the full 6-digit OTP.');
    setError('');
    try {
      setLoading(true);
      // Verify against the real backend. It logs in if the phone exists, or
      // creates the account (using name/grade) if it doesn't. Returns a real JWT.
      const data = await verifyPhoneOtp({ phone, otp: code, name, grade });
      await signIn(data);
      // signIn() flips isAuthenticated -> AppNavigator swaps to the main flow.
    } catch (e) {
      setError(e?.response?.data?.error || 'Incorrect OTP. Please check and try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError('');
    setOtp(Array(OTP_LENGTH).fill(''));
    inputs.current[0]?.focus();
    try {
      const data = await requestPhoneOtp({ phone });
      setDevOtp(data?.devOtp || null);
      setTimer(OTP_RESEND_TIMER);
      setResent(true);
      setTimeout(() => setResent(false), 2500);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to resend OTP. Please try again.');
    }
  };

const displayPhone = phone
  ? phone.replace(/(\+91)(\d{5})(\d{5})/, '$1 $2XXXXX')
  : '';

  return (
    <SafeAreaView style={styles.safe}>
      <AuthHeader onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>AILERNOVA</Text>

        <View style={styles.iconWrap}>
          <Text style={styles.icon}>📲</Text>
        </View>
        <Text style={styles.heading}>Verify your number</Text>
        <Text style={styles.sub}>OTP sent to <Text style={styles.phone}>{displayPhone}</Text></Text>

        <ErrorMessage message={error} style={{ marginTop: 16 }} />
        {resent && <Text style={styles.resentText}>OTP resent successfully!</Text>}
        {devOtp ? <Text style={styles.devOtp}>Dev OTP: {devOtp}  (development only)</Text> : null}

        {/* OTP Boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => inputs.current[i] = el}
              style={[styles.otpBox, digit && styles.otpBoxFilled, error && styles.otpBoxError]}
              value={digit}
              onChangeText={val => handleChange(i, val)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <PrimaryButton title="Verify & Continue" onPress={handleVerify} loading={loading} style={styles.btn} />

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive? </Text>
          {timer > 0
            ? <Text style={styles.timerText}>Resend in {timer}s</Text>
            : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )
          }
        </View>

        <TouchableOpacity style={styles.changeRow} onPress={() => navigation.goBack()}>
          <Text style={styles.changeText}>Change phone number</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.white },
  scroll:      { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
  logo:        { fontSize: 22, fontWeight: '800', letterSpacing: 3, color: COLORS.primary, textAlign: 'center', marginBottom: 24, marginTop: 12 },
  iconWrap:    { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.subtleBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  icon:        { fontSize: 32 },
  heading:     { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  sub:         { fontSize: 12, color: COLORS.textSecondary, marginBottom: 28, textAlign: 'center' },
  phone:       { fontWeight: '600', color: COLORS.textPrimary },
  otpRow:      { flexDirection: 'row', gap: 10, marginBottom: 10, width: '100%', justifyContent: 'center' },
  otpBox:      { width: 44, height: 54, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, textAlign: 'center', fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, backgroundColor: COLORS.white },
  otpBoxFilled:{ borderColor: COLORS.primary },
  otpBoxError: { borderColor: COLORS.error },
  btn:         { marginTop: 24, width: '100%' },
  resendRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  resendLabel: { fontSize: 12, color: COLORS.textSecondary },
  timerText:   { fontSize: 12, color: COLORS.textMuted },
  resendLink:  { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  resentText:  { fontSize: 12, color: COLORS.success, marginTop: 4, marginBottom: -8 },
  devOtp:      { fontSize: 12, color: COLORS.textSecondary, fontWeight: '700', textAlign: 'center', marginTop: 10 },
  changeRow:   { marginTop: 14 },
  changeText:  { fontSize: 12, color: COLORS.textSecondary, textDecorationLine: 'underline' },
});

export default OTPScreen;