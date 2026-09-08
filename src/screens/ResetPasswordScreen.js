// src/screens/ResetPasswordScreen.js
// The second half of the reset, done inside the app.
//
// The email carries a 6-digit code AND a link. The link exists for mail opened on
// a desktop, where there is no app to type into; this screen is for the common
// case, a student reading that mail on the same phone the app is on. Sending them
// out to a browser there — to sign in again afterwards in the app they never
// left — was the whole reason this screen exists.
//
// Both point at the same one-time row on the server, so whichever is used first
// ends the other. Nothing here needs to know that; it just posts the code.
//
// Styling follows OTPScreen deliberately: same night surface, same box metrics,
// same shake. A student who has just typed a phone OTP should recognise this as
// the same kind of step rather than a new one.
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, StatusBar,
  ScrollView, Animated, Dimensions, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, KeyRound, Lock, Eye, EyeOff, CircleCheck } from 'lucide-react-native';
import {
  useFonts as useAuroraFonts,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { resetPasswordWithCode, requestPasswordReset } from '../api/authApi';
import { N, NFONT } from '../theme/nightTheme';
import { NightBg, Appear } from '../theme/nightChrome';

const { width: W } = Dimensions.get('window');
const PAD = 24;
const CODE_LENGTH = 6;
const GAP = 10;
const BOX_W = Math.min(56, (W - PAD * 2 - GAP * (CODE_LENGTH - 1)) / CODE_LENGTH);
const BOX_H = Math.round(BOX_W * 1.18);

// The server refuses anything shorter, so check here too — a round trip only to
// be told the length is wrong is a round trip that did not need to happen.
const MIN_PASSWORD = 8;

const ResetPasswordScreen = ({ navigation, route }) => {
  const [fontsLoaded] = useAuroraFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  });
  const F = fontsLoaded ? NFONT : { reg: undefined, med: undefined, semi: undefined, bold: undefined };
  const insets = useSafeAreaInsets();

  const email = (route?.params?.email || '').trim();

  const [code, setCode]           = useState(Array(CODE_LENGTH).fill(''));
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [reveal, setReveal]       = useState(false);
  const [focused, setFocused]     = useState(-1);
  const [field, setField]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent]       = useState(false);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);

  const inputs = useRef([]);
  const shake = useRef(new Animated.Value(0)).current;

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
    // Pasted from the email — spread it across the boxes rather than dropping
    // five of the six digits.
    if (digits.length > 1) {
      const next = [...code];
      for (let i = 0; i < digits.length && index + i < CODE_LENGTH; i++) next[index + i] = digits[i];
      setCode(next);
      setError('');
      inputs.current[Math.min(index + digits.length, CODE_LENGTH - 1)]?.focus();
      return;
    }
    if (!/^\d?$/.test(digits)) return;
    const next = [...code];
    next[index] = digits;
    setCode(next);
    setError('');
    if (digits && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !code[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const handleReset = async () => {
    Keyboard.dismiss();
    const joined = code.join('');
    if (joined.length < CODE_LENGTH) {
      runShake();
      return setError('Enter the full 6-digit code from your email.');
    }
    if (password.length < MIN_PASSWORD) {
      runShake();
      return setError(`Your new password needs at least ${MIN_PASSWORD} characters.`);
    }
    if (password !== confirm) {
      runShake();
      return setError('The two passwords do not match.');
    }
    setError('');
    try {
      setLoading(true);
      await resetPasswordWithCode({ email, code: joined, password });
      setDone(true);
    } catch (e) {
      // The server's wording is deliberately vague about which part failed.
      // Show it as sent rather than translating it into a guess.
      setError(
        e?.response?.data?.error
          || e?.response?.data?.message
          || 'Could not reset your password. Please try again.'
      );
      setCode(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
      runShake();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setError('');
    try {
      setResending(true);
      await requestPasswordReset({ email });
      // A new code ends the old one server-side, so clear the boxes: digits left
      // on screen are no longer the answer to anything.
      setCode(Array(CODE_LENGTH).fill(''));
      setResent(true);
      inputs.current[0]?.focus();
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not send a new code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const goToSignIn = () => navigation.navigate('LoginScreen', { email });
  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : goToSignIn());

  const ready = code.every(Boolean) && password.length >= MIN_PASSWORD && password === confirm;

  // ── Done ───────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={N.bgTop} translucent={false} />
        <NightBg id="rp-done" />
        <View style={[styles.doneWrap, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
          <Appear delay={40} style={styles.center}>
            <View style={styles.badgeGlow}>
              <View style={[styles.badge, styles.badgeDone]}>
                <CircleCheck size={34} color={N.green} strokeWidth={1.6} />
              </View>
            </View>
          </Appear>
          <Appear delay={110} style={styles.center}>
            <Text style={[styles.heading, { fontFamily: F.bold }]}>Password Changed</Text>
            <Text style={[styles.sub, { fontFamily: F.reg }]}>
              You can sign in with your new password now.
            </Text>
          </Appear>
          <Appear delay={180} style={styles.stretch}>
            <Pressable
              onPress={goToSignIn}
              accessibilityRole="button"
              accessibilityLabel="Go to sign in"
              style={({ pressed }) => [styles.btnWrap, pressed && styles.pressed]}
            >
              <LinearGradient
                colors={[N.violet, N.violetLo]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                <Text style={[styles.btnText, { fontFamily: F.bold }]}>Sign In</Text>
              </LinearGradient>
            </Pressable>
          </Appear>
        </View>
      </View>
    );
  }

  // ── Code + new password ────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={N.bgTop} translucent={false} />
      <NightBg id="rp" />

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
            onPress={goBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color={N.inkSoft} />
          </Pressable>

          <Appear delay={40} style={styles.center}>
            <View style={styles.badgeGlow}>
              <View style={styles.badge}>
                <KeyRound size={34} color={N.dot} strokeWidth={1.6} />
              </View>
            </View>
          </Appear>

          <Appear delay={110} style={styles.center}>
            <Text style={[styles.heading, { fontFamily: F.bold }]}>Enter Your Code</Text>
            <Text style={[styles.sub, { fontFamily: F.reg }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={[styles.subStrong, { fontFamily: F.med }]}>{email}</Text>
            </Text>
          </Appear>

          <View style={styles.spacerSm} />

          <Appear delay={180}>
            <Animated.View
              style={[styles.codeRow, {
                transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }],
              }]}
            >
              {code.map((digit, i) => {
                const active = !!digit || focused === i;
                return (
                  <TextInput
                    key={i}
                    ref={el => (inputs.current[i] = el)}
                    style={[
                      styles.codeBox,
                      { fontFamily: F.bold },
                      active && styles.codeBoxActive,
                      !!error && styles.codeBoxError,
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
                    maxLength={i === 0 ? CODE_LENGTH : 1}
                    selectTextOnFocus
                    editable={!loading}
                    accessibilityLabel={`Digit ${i + 1} of ${CODE_LENGTH}`}
                  />
                );
              })}
            </Animated.View>

            {/* New password */}
            <View style={[styles.field, field === 'pw' && styles.fieldActive]}>
              <Lock size={20} color={field === 'pw' || password ? N.dot : N.inkDim} strokeWidth={1.8} />
              <TextInput
                style={[styles.input, { fontFamily: F.reg }]}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                onFocus={() => setField('pw')}
                onBlur={() => setField('')}
                placeholder={`New password (min ${MIN_PASSWORD})`}
                placeholderTextColor={N.inkDim}
                secureTextEntry={!reveal}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                keyboardAppearance="dark"
                selectionColor={N.violet}
                editable={!loading}
                accessibilityLabel="New password"
              />
              <Pressable
                onPress={() => setReveal(r => !r)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
              >
                {reveal
                  ? <EyeOff size={20} color={N.inkDim} strokeWidth={1.8} />
                  : <Eye size={20} color={N.inkDim} strokeWidth={1.8} />}
              </Pressable>
            </View>

            {/* Confirm — a mismatch shows on the field itself rather than waiting
                for submit to say so. */}
            <View style={[
              styles.field,
              styles.fieldGap,
              field === 'cf' && styles.fieldActive,
              !!confirm && confirm !== password && styles.fieldError,
            ]}>
              <Lock size={20} color={field === 'cf' || confirm ? N.dot : N.inkDim} strokeWidth={1.8} />
              <TextInput
                style={[styles.input, { fontFamily: F.reg }]}
                value={confirm}
                onChangeText={(t) => { setConfirm(t); setError(''); }}
                onFocus={() => setField('cf')}
                onBlur={() => setField('')}
                placeholder="Confirm new password"
                placeholderTextColor={N.inkDim}
                secureTextEntry={!reveal}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                keyboardAppearance="dark"
                selectionColor={N.violet}
                returnKeyType="done"
                onSubmitEditing={handleReset}
                editable={!loading}
                accessibilityLabel="Confirm new password"
              />
            </View>

            {!!error && <Text style={[styles.error, { fontFamily: F.med }]}>{error}</Text>}
            {!error && resent && (
              <Text style={[styles.ok, { fontFamily: F.med }]}>
                A new code has been requested. Any earlier code no longer works.
              </Text>
            )}

            <Pressable
              onPress={handleReset}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Reset password"
              style={({ pressed }) => [
                styles.btnWrap,
                pressed && styles.pressed,
                loading && styles.dim,
              ]}
            >
              <LinearGradient
                colors={ready ? [N.violet, N.violetLo] : [N.violetLo, N.violet]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                {loading
                  ? <ActivityIndicator color={N.ink} size="small" />
                  : <Text style={[styles.btnText, { fontFamily: F.bold }]}>Reset Password</Text>}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleResend}
              disabled={resending || loading}
              hitSlop={10}
              style={styles.center}
              accessibilityRole="button"
              accessibilityLabel="Send a new code"
            >
              <Text style={[styles.resendLink, { fontFamily: F.med }, resending && styles.dim]}>
                {resending ? 'Sending…' : 'Did not get it? Send a new code'}
              </Text>
            </Pressable>
          </Appear>

          <View style={styles.spacer} />

          <Pressable onPress={goToSignIn} hitSlop={10} style={styles.center} accessibilityRole="button">
            <Text style={[styles.backLink, { fontFamily: F.med }]}>Back to Sign In</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: N.bg },
  flex:      { flex: 1 },
  scroll:    { flexGrow: 1, paddingHorizontal: PAD },
  center:    { alignItems: 'center', alignSelf: 'stretch' },
  stretch:   { alignSelf: 'stretch' },
  doneWrap:  { flex: 1, paddingHorizontal: PAD, justifyContent: 'center' },
  pressed:   { transform: [{ scale: 0.985 }] },
  dim:       { opacity: 0.7 },

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
    backgroundColor: N.violetSoft,
    alignSelf: 'center',
    marginTop: 8,
  },
  badge: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: N.bg,
    borderWidth: 1, borderColor: N.cardEdge,
  },
  badgeDone: { backgroundColor: 'rgba(53,190,124,0.12)' },

  heading: {
    fontSize: 30, lineHeight: 38, color: N.ink,
    letterSpacing: -0.4, textAlign: 'center', marginTop: 20,
  },
  sub: {
    fontSize: 15, lineHeight: 22, color: N.inkSoft,
    textAlign: 'center', marginTop: 10, paddingHorizontal: 4,
  },
  subStrong: { color: N.ink },

  spacer:   { flex: 1, minHeight: 28 },
  spacerSm: { flex: 0.4, minHeight: 20 },

  codeRow: { flexDirection: 'row', gap: GAP, justifyContent: 'center' },
  codeBox: {
    width: BOX_W, height: BOX_H,
    borderRadius: 14, borderWidth: 1.5,
    borderColor: N.cardEdge,
    backgroundColor: N.cardSoft,
    textAlign: 'center', textAlignVertical: 'center',
    fontSize: 24, color: N.ink,
    padding: 0,
  },
  codeBoxActive: { borderColor: N.violet, backgroundColor: N.violetSoft },
  codeBoxError:  { borderColor: '#F0566E' },

  field: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    height: 60, borderRadius: 16, paddingHorizontal: 18,
    backgroundColor: N.cardSoft,
    borderWidth: 1.5, borderColor: N.cardEdge,
    marginTop: 22,
  },
  fieldGap:    { marginTop: 12 },
  fieldActive: { borderColor: N.violet, backgroundColor: N.violetSoft },
  fieldError:  { borderColor: '#F0566E' },
  input:       { flex: 1, fontSize: 16, color: N.ink, padding: 0 },

  error: { fontSize: 13, color: '#F0566E', marginTop: 12, textAlign: 'center', lineHeight: 19 },
  ok:    { fontSize: 13, color: N.green,   marginTop: 12, textAlign: 'center', lineHeight: 19 },

  btnWrap: {
    marginTop: 22,
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

  resendLink: { fontSize: 14, color: N.dot, marginTop: 18, textAlign: 'center' },
  backLink: {
    fontSize: 15, color: N.dot, textDecorationLine: 'underline', marginTop: 4,
  },
});

export default ResetPasswordScreen;
