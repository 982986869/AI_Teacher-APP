// src/screens/OTPScreen.js
// Phone verification — dark "night" re-skin on the shared palette
// (src/theme/nightTheme.js) so it reads as the same product as Home and the
// AI-Teacher crafting screen.
//
// Layout: shield badge → heading → sub → 6 code boxes → timer chip | Resend
// → gradient Verify pill. The verify/resend logic is unchanged from the light
// version; only the presentation moved.
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, StatusBar,
  ScrollView, Animated, Dimensions, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ShieldUser } from 'lucide-react-native';
import {
  useFonts as useAuroraFonts,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { verifyOTP, sendOTP, completePhoneSignup } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { OTP_RESEND_TIMER } from '../constants/config';
import { N, NFONT } from '../theme/nightTheme';
import { NightBg, Appear } from '../theme/nightChrome';

const { width: W } = Dimensions.get('window');
const OTP_LENGTH = 6;
const PAD = 24;
const GAP = 10;
const BOX_W = Math.min(56, (W - PAD * 2 - GAP * (OTP_LENGTH - 1)) / OTP_LENGTH);
const BOX_H = Math.round(BOX_W * 1.18);

const mmss = (s) => {
  const m = Math.floor(Math.max(0, s) / 60);
  const r = Math.max(0, s) % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

const OTPScreen = ({ navigation, route }) => {
  const { phone, name, grade, mode } = route.params || {}; // mode: 'signup' | 'login'
  const { signIn } = useAuth();
  const [fontsLoaded] = useAuroraFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  });
  const F = fontsLoaded ? NFONT : { reg: undefined, med: undefined, semi: undefined, bold: undefined };
  const insets = useSafeAreaInsets();

  const [otp, setOtp]         = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [timer, setTimer]     = useState(OTP_RESEND_TIMER);
  const [resent, setResent]   = useState(false);
  const [focused, setFocused] = useState(0);

  const inputs = useRef([]);
  const shake = useRef(new Animated.Value(0)).current;

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const runShake = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleChange = (index, val) => {
    const digits = val.replace(/\D/g, '');
    // Paste / SMS autofill delivers the whole code into one box — spread it.
    if (digits.length > 1) {
      const next = [...otp];
      for (let i = 0; i < digits.length && index + i < OTP_LENGTH; i++) next[index + i] = digits[i];
      setOtp(next);
      setError('');
      const last = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputs.current[last]?.focus();
      return;
    }
    if (!/^\d?$/.test(digits)) return;
    const next = [...otp];
    next[index] = digits;
    setOtp(next);
    setError('');
    if (digits && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      runShake();
      return setError('Please enter the full 6-digit code.');
    }
    setError('');
    try {
      setLoading(true);
      const data = await verifyOTP({ phone, otp: code });
      // For signup mode with a new user, complete profile if needed
      if (mode === 'signup' && data.isNewUser && name) {
        const completed = await completePhoneSignup({ phone, name, grade, token: data.token });
        await signIn(completed);
      } else {
        await signIn(data);
      }
      // Do NOT navigate here. signIn() flips isAuthenticated -> AppNavigator
      // automatically swaps the stack to BrainGym -> Onboarding -> Home.
    } catch (e) {
      setError('Incorrect code. Please check and try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      runShake();
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
      await sendOTP({ phone });
      setTimer(OTP_RESEND_TIMER);
      setResent(true);
      setTimeout(() => setResent(false), 2500);
    } catch (e) {
      setError('Failed to resend the code. Please try again.');
    }
  };

  const displayPhone = phone
    ? phone.replace(/(\+91)(\d{5})(\d{5})/, '$1 $2XXXXX')
    : 'your phone';

  const complete = otp.every(Boolean);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={N.bgTop} translucent={false} />
      <NightBg id="otp" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back and change phone number"
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color={N.inkSoft} />
          </Pressable>

          {/* Badge */}
          <Appear delay={40} style={styles.center}>
            <View style={styles.badgeGlow}>
              <View style={styles.badge}>
                <ShieldUser size={34} color={N.violet} strokeWidth={1.6} />
              </View>
            </View>
          </Appear>

          {/* Heading */}
          <Appear delay={110} style={styles.center}>
            <Text style={[styles.heading, { fontFamily: F.bold }]}>Verify Your Account</Text>
            <Text style={[styles.sub, { fontFamily: F.reg }]}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={{ color: N.ink, fontFamily: F.med }}>{displayPhone}</Text>
            </Text>
          </Appear>

          <View style={styles.spacer} />

          {/* Code boxes */}
          <Appear delay={180}>
            <Animated.View
              style={[styles.otpRow, {
                transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }],
              }]}
            >
              {otp.map((digit, i) => {
                const active = !!digit || focused === i;
                return (
                  <TextInput
                    key={i}
                    ref={el => (inputs.current[i] = el)}
                    style={[
                      styles.otpBox,
                      { fontFamily: F.bold },
                      active && styles.otpBoxActive,
                      error && styles.otpBoxError,
                    ]}
                    value={digit}
                    onChangeText={val => handleChange(i, val)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                    onFocus={() => setFocused(i)}
                    onBlur={() => setFocused(f => (f === i ? -1 : f))}
                    keyboardType="number-pad"
                    keyboardAppearance="dark"
                    selectionColor={N.violet}
                    textContentType="oneTimeCode"
                    autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                    maxLength={i === 0 ? OTP_LENGTH : 1}
                    selectTextOnFocus
                    accessibilityLabel={`Digit ${i + 1} of ${OTP_LENGTH}`}
                  />
                );
              })}
            </Animated.View>

            {!!error && <Text style={[styles.error, { fontFamily: F.med }]}>{error}</Text>}
            {resent && !error && (
              <Text style={[styles.resent, { fontFamily: F.med }]}>Code resent successfully</Text>
            )}

            {/* Timer chip | Resend */}
            <View style={styles.metaRow}>
              <View style={styles.timerChip}>
                <Text style={[styles.timerText, { fontFamily: F.med }]}>{mmss(timer)}</Text>
              </View>
              <Pressable
                onPress={handleResend}
                disabled={timer > 0}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityState={{ disabled: timer > 0 }}
              >
                <Text style={[styles.resendLink, { fontFamily: F.med }, timer > 0 && styles.resendLinkOff]}>
                  Resend Code
                </Text>
              </Pressable>
            </View>

            {/* Verify */}
            <Pressable
              onPress={handleVerify}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Verify"
              style={({ pressed }) => [styles.btnWrap, pressed && { transform: [{ scale: 0.985 }] }, loading && { opacity: 0.7 }]}
            >
              <LinearGradient
                colors={complete ? [N.violet, '#A855F7'] : [N.violetLo, N.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                {loading
                  ? <ActivityIndicator color={N.ink} size="small" />
                  : <Text style={[styles.btnText, { fontFamily: F.bold }]}>Verify</Text>}
              </LinearGradient>
            </Pressable>
          </Appear>

          <View style={styles.spacerSm} />

          <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.center}>
            <Text style={[styles.change, { fontFamily: F.reg }]}>Change phone number</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: N.bg },
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: PAD },
  center: { alignItems: 'center', alignSelf: 'stretch' },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge,
    marginBottom: 12,
  },

  badgeGlow: {
    width: 116, height: 116, borderRadius: 58,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(139,110,240,0.10)',
    marginTop: 8,
  },
  badge: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: N.violetSoft,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },

  heading: {
    fontSize: 32, lineHeight: 40, color: N.ink,
    letterSpacing: -0.4, textAlign: 'center', marginTop: 24,
  },
  sub: {
    fontSize: 15, lineHeight: 22, color: N.inkSoft,
    textAlign: 'center', marginTop: 10,
  },

  spacer:   { flex: 1, minHeight: 32 },
  spacerSm: { flex: 0.5, minHeight: 16 },

  otpRow: { flexDirection: 'row', gap: GAP, justifyContent: 'center' },
  otpBox: {
    width: BOX_W, height: BOX_H,
    borderRadius: 14, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(10,8,26,0.55)',
    textAlign: 'center', textAlignVertical: 'center',
    fontSize: 24, color: N.ink,
    padding: 0,
  },
  otpBoxActive: { borderColor: N.violet, backgroundColor: 'rgba(139,110,240,0.10)' },
  otpBoxError:  { borderColor: '#F0566E' },

  error:  { fontSize: 13, color: '#F0566E', marginTop: 12, textAlign: 'center' },
  resent: { fontSize: 13, color: N.green, marginTop: 12, textAlign: 'center' },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 22,
  },
  timerChip: {
    paddingHorizontal: 16, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: N.cardEdge,
  },
  timerText:     { fontSize: 14, color: N.inkSoft, letterSpacing: 0.5 },
  resendLink:    { fontSize: 15, color: N.ink, textDecorationLine: 'underline' },
  resendLinkOff: { color: N.inkDim },

  btnWrap: {
    marginTop: 26,
    borderRadius: 32,
    shadowColor: N.violet,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  btn: {
    height: 62, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: 17, color: N.ink, letterSpacing: 0.2 },

  change: { fontSize: 13, color: N.inkDim, marginTop: 4 },
});

export default OTPScreen;
