// src/screens/ForgotPasswordScreen.js
// Password reset request — dark "night" surface on the shared palette
// (src/theme/nightTheme.js), matching OTPScreen so the auth flow reads as one.
//
// Layout: lock badge → heading → sub → email field → gradient CTA → Back to Sign In.
// After a successful request the same layout swaps to a "check your email" state
// rather than pushing a new screen — the user has nothing else to do here.
//
// NOTE: this calls POST /api/auth/forgot-password, which does NOT exist on the
// server yet (server/src/routes/auth.js has register/login/google/me/profile only).
// requestPasswordReset() surfaces a clear "not available yet" message on a 404 so
// the screen degrades honestly instead of claiming a mail was sent.
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, StatusBar,
  ScrollView, Animated, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, LockOpen, Mail, MailCheck } from 'lucide-react-native';
import {
  useFonts as useAuroraFonts,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { requestPasswordReset } from '../api/authApi';
import { validateEmail } from '../utils/validators';
import { N, NFONT } from '../theme/nightTheme';
import { NightBg, Appear } from '../theme/nightChrome';

const PAD = 24;

const ForgotPasswordScreen = ({ navigation, route }) => {
  const [fontsLoaded] = useAuroraFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  });
  const F = fontsLoaded ? NFONT : { reg: undefined, med: undefined, semi: undefined, bold: undefined };
  const insets = useSafeAreaInsets();

  const [email, setEmail]     = useState(route?.params?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);
  const [focused, setFocused] = useState(false);

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

  const handleSend = async () => {
    Keyboard.dismiss();
    const value = email.trim();
    if (!validateEmail(value)) {
      runShake();
      return setError('Enter a valid email address.');
    }
    setError('');
    try {
      setLoading(true);
      await requestPasswordReset({ email: value });
      setSent(true);
    } catch (e) {
      setError(
        e?.response?.data?.error
          || e?.response?.data?.message
          || e?.message
          || 'Could not send the reset link. Please try again.'
      );
      runShake();
    } finally {
      setLoading(false);
    }
  };

  const backToSignIn = () =>
    (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LoginScreen'));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={N.bgTop} translucent={false} />
      <NightBg id="fp" />

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
            onPress={backToSignIn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color={N.inkSoft} />
          </Pressable>

          {/* Badge */}
          <Appear delay={40} style={styles.center}>
            <View style={styles.badgeGlow}>
              <View style={styles.badge}>
                {sent
                  ? <MailCheck size={34} color={N.green} strokeWidth={1.6} />
                  : <LockOpen size={34} color={N.violet} strokeWidth={1.6} />}
              </View>
            </View>
          </Appear>

          {/* Heading */}
          <Appear delay={110} style={styles.center}>
            <Text style={[styles.heading, { fontFamily: F.bold }]}>
              {sent ? 'Check Your Email' : 'Forgot Password?'}
            </Text>
            <Text style={[styles.sub, { fontFamily: F.reg }]}>
              {sent
                ? <>We&apos;ve sent a reset link to{'\n'}<Text style={{ color: N.ink, fontFamily: F.med }}>{email.trim()}</Text></>
                : "Enter your email and we'll send you a reset link."}
            </Text>
          </Appear>

          <View style={styles.spacer} />

          <Appear delay={180}>
            {/* Email field */}
            <Animated.View
              style={{ transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] }}
            >
              <View style={[
                styles.field,
                focused && styles.fieldActive,
                !!error && styles.fieldError,
                sent && styles.fieldDone,
              ]}>
                <Mail size={20} color={focused || email ? N.violet : N.inkDim} strokeWidth={1.8} />
                <TextInput
                  style={[styles.input, { fontFamily: F.reg }]}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); if (sent) setSent(false); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Enter your registered email"
                  placeholderTextColor={N.inkDim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  keyboardAppearance="dark"
                  selectionColor={N.violet}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  editable={!loading}
                  accessibilityLabel="Registered email address"
                />
              </View>
            </Animated.View>

            {!!error && <Text style={[styles.error, { fontFamily: F.med }]}>{error}</Text>}
            {sent && !error && (
              <Text style={[styles.ok, { fontFamily: F.med }]}>
                Link sent. It expires in a few minutes — check spam if it hasn&apos;t arrived.
              </Text>
            )}

            {/* CTA */}
            <Pressable
              onPress={handleSend}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={sent ? 'Resend reset link' : 'Send reset link'}
              style={({ pressed }) => [
                styles.btnWrap,
                pressed && { transform: [{ scale: 0.985 }] },
                loading && { opacity: 0.7 },
              ]}
            >
              <LinearGradient
                colors={validateEmail(email.trim()) ? [N.violet, '#A855F7'] : [N.violetLo, N.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                {loading
                  ? <ActivityIndicator color={N.ink} size="small" />
                  : <Text style={[styles.btnText, { fontFamily: F.bold }]}>
                      {sent ? 'Resend Link' : 'Send Reset Link'}
                    </Text>}
              </LinearGradient>
            </Pressable>
          </Appear>

          <View style={styles.spacerLg} />

          <Pressable onPress={backToSignIn} hitSlop={10} style={styles.center} accessibilityRole="button">
            <Text style={[styles.backLink, { fontFamily: F.med }]}>Back to Sign In</Text>
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
    borderWidth: 1, borderColor: N.cardEdge,
  },

  heading: {
    fontSize: 32, lineHeight: 40, color: N.ink,
    letterSpacing: -0.4, textAlign: 'center', marginTop: 24,
  },
  sub: {
    fontSize: 15, lineHeight: 22, color: N.inkSoft,
    textAlign: 'center', marginTop: 10, paddingHorizontal: 4,
  },

  spacer:   { flex: 1, minHeight: 40 },
  spacerLg: { flex: 1.2, minHeight: 32 },

  field: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    height: 64, borderRadius: 16, paddingHorizontal: 18,
    backgroundColor: N.cardSoft,
    borderWidth: 1.5, borderColor: N.cardEdge,
  },
  fieldActive: { borderColor: N.violet, backgroundColor: 'rgba(139,110,240,0.10)' },
  fieldError:  { borderColor: '#F0566E' },
  fieldDone:   { borderColor: 'rgba(53,190,124,0.55)' },
  input: {
    flex: 1, fontSize: 16, color: N.ink, padding: 0,
  },

  error: { fontSize: 13, color: '#F0566E', marginTop: 12, textAlign: 'center' },
  ok:    { fontSize: 13, color: N.green, marginTop: 12, textAlign: 'center', lineHeight: 19 },

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

  backLink: {
    fontSize: 15, color: N.dot, textDecorationLine: 'underline', marginTop: 4,
  },
});

export default ForgotPasswordScreen;
