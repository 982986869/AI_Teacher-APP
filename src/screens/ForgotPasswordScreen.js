// src/screens/ForgotPasswordScreen.js
// Password reset request — dark "night" surface on the shared palette
// (src/theme/nightTheme.js), matching OTPScreen so the auth flow reads as one.
//
// Layout: lock badge → heading → sub → email field → gradient CTA → Back to Sign In.
// After a successful request the same layout swaps to a "check your email" state
// rather than pushing a new screen — the user has nothing else to do here.
//
// POST /api/auth/forgot-password answers identically whether or not the address
// is registered — that is what stops the screen being used to discover who has an
// account, and it also means success here is NOT proof a mail went out.
//
// On success it hands off to ResetPasswordScreen, where the 6-digit code from the
// email is typed. It used to stop at "check your email", which was a dead end: the
// only way on was the link, and the link opens a browser.
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, StatusBar,
  ScrollView, Animated, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, LockOpen, Mail } from 'lucide-react-native';
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
      navigation.navigate('ResetPasswordScreen', { email: value });
    } catch (e) {
      setError(
        e?.response?.data?.error
          || e?.response?.data?.message
          || e?.message
          || 'Could not send the code. Please try again.'
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
                <LockOpen size={34} color={N.dot} strokeWidth={1.6} />
              </View>
            </View>
          </Appear>

          {/* Heading */}
          <Appear delay={110} style={styles.center}>
            <Text style={[styles.heading, { fontFamily: F.bold }]}>Forgot Password?</Text>
            <Text style={[styles.sub, { fontFamily: F.reg }]}>
              Enter your email and we&apos;ll send you a 6-digit code.
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
              ]}>
                <Mail size={20} color={focused || email ? N.violet : N.inkDim} strokeWidth={1.8} />
                <TextInput
                  style={[styles.input, { fontFamily: F.reg }]}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
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


            {/* CTA */}
            <Pressable
              onPress={handleSend}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Send reset code"
              style={({ pressed }) => [
                styles.btnWrap,
                pressed && { transform: [{ scale: 0.985 }] },
                loading && { opacity: 0.7 },
              ]}
            >
              <LinearGradient
                colors={validateEmail(email.trim()) ? [N.violet, N.violetLo] : [N.violetLo, N.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                {loading
                  ? <ActivityIndicator color={N.ink} size="small" />
                  : <Text style={[styles.btnText, { fontFamily: F.bold }]}>Send Code</Text>}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('ResetPasswordScreen', { email: email.trim() })}
              disabled={!validateEmail(email.trim())}
              hitSlop={10}
              style={styles.center}
              accessibilityRole="button"
              accessibilityLabel="I already have a code"
            >
              <Text style={[
                styles.haveCode,
                { fontFamily: F.med },
                !validateEmail(email.trim()) && styles.haveCodeOff,
              ]}>
                Already have a code?
              </Text>
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
  input: {
    flex: 1, fontSize: 16, color: N.ink, padding: 0,
  },

  error: { fontSize: 13, color: '#F0566E', marginTop: 12, textAlign: 'center' },

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

  haveCode:    { fontSize: 14, color: N.dot, marginTop: 18 },
  haveCodeOff: { color: N.inkDim },

  backLink: {
    fontSize: 15, color: N.dot, textDecorationLine: 'underline', marginTop: 4,
  },
});

export default ForgotPasswordScreen;
