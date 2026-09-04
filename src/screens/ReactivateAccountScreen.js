// src/screens/ReactivateAccountScreen.js
// Bringing back an account the student deleted — dark "night" surface on the shared
// palette (src/theme/nightTheme.js), built to read as one flow with ForgotPasswordScreen
// and OTPScreen rather than as a screen bolted on beside them.
//
// Reached ONLY from Login or Signup, when the server answers 403/409 with
// code: 'ACCOUNT_DEACTIVATED'. It is never an entry point of its own, because it needs
// the address that was just rejected — there is no "who are you?" step here.
//
// Three states in one screen, no pushes: ask → check your email → done. The student has
// nothing else to do in between, and a stack of screens they must back out of would be
// three chances to lose the code they just received.
//
// What it deliberately does NOT do is sign anyone in. The server will not mint a session
// from a six-digit code — that would make the code a way around the password rather than
// a way back to a deactivated account — so this ends by sending them to Sign In.
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, StatusBar,
  ScrollView, Animated, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ShieldCheck, MailCheck, CircleCheck } from 'lucide-react-native';
import {
  useFonts as useAuroraFonts,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { requestReactivation, confirmReactivation } from '../api/authApi';
import { flow, flowErr } from '../utils/flowLog';
import { N, NFONT } from '../theme/nightTheme';
import { NightBg, Appear } from '../theme/nightChrome';

const PAD = 24;
const CODE_LENGTH = 6;

const ReactivateAccountScreen = ({ navigation, route }) => {
  const [fontsLoaded] = useAuroraFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  });
  const F = fontsLoaded ? NFONT : { reg: undefined, med: undefined, semi: undefined, bold: undefined };
  const insets = useSafeAreaInsets();

  // The address comes from the sign-in attempt that was just refused. It is shown but
  // not editable: the student has proved they hold this account's password, and letting
  // them retype any address here would turn the screen into a way to send mail to
  // strangers.
  const email = String(route?.params?.email || '').trim();

  const [phase, setPhase]     = useState('ask');   // 'ask' | 'code' | 'done'
  const [code, setCode]       = useState('');
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

  const backToSignIn = () =>
    (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LoginScreen'));

  const handleSend = async () => {
    Keyboard.dismiss();
    setError('');
    try {
      setLoading(true);
      flow('6. restore  —  asking for the email', email);
      await requestReactivation({ email });
      flow('7. restore  —  request accepted; check Mailtrap');
      // Straight to the code step whatever the server said. It answers identically for
      // an address with no account, on purpose, and this screen must not undo that by
      // behaving differently.
      setCode('');
      setPhase('code');
    } catch (e) {
      flowErr('7. restore  —  the request FAILED', e);
      setError(
        e?.response?.data?.error
          || e?.response?.data?.message
          || 'Could not send the email. Please check your connection and try again.'
      );
      runShake();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    Keyboard.dismiss();
    if (code.length < CODE_LENGTH) {
      runShake();
      return setError(`Enter the ${CODE_LENGTH}-digit code from your email.`);
    }
    setError('');
    try {
      setLoading(true);
      flow('8. restore  —  submitting the code');
      await confirmReactivation({ email, code });
      flow('9. restore  —  ACCOUNT IS BACK; sign in normally now');
      setPhase('done');
    } catch (e) {
      flowErr('9. restore  —  the code was REFUSED', e);
      setError(
        e?.response?.data?.error
          || e?.response?.data?.message
          || 'That code did not work. Please try again.'
      );
      runShake();
    } finally {
      setLoading(false);
    }
  };

  const badge = phase === 'done'
    ? <CircleCheck size={34} color={N.green} strokeWidth={1.6} />
    : phase === 'code'
      ? <MailCheck size={34} color={N.violet} strokeWidth={1.6} />
      : <ShieldCheck size={34} color={N.violet} strokeWidth={1.6} />;

  const heading = phase === 'done'
    ? 'Your Account Is Back'
    : phase === 'code'
      ? 'Check Your Email'
      : 'Account Deactivated';

  const primaryLabel = phase === 'done'
    ? 'Back to Sign In'
    : phase === 'code'
      ? 'Restore My Account'
      : 'Email Me A Restore Link';

  const onPrimary = phase === 'done' ? backToSignIn : phase === 'code' ? handleConfirm : handleSend;

  // Greyed until there is a full code to submit, so the button is not an invitation to
  // fire off half-typed guesses — each one costs an attempt against the token.
  const primaryReady = phase !== 'code' || code.length === CODE_LENGTH;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={N.bgTop} translucent={false} />
      <NightBg id="reactivate" />

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

          <Appear delay={40} style={styles.center}>
            <View style={styles.badgeGlow}>
              <View style={styles.badge}>{badge}</View>
            </View>
          </Appear>

          <Appear delay={110} style={styles.center}>
            <Text style={[styles.heading, { fontFamily: F.bold }]}>{heading}</Text>
            <Text style={[styles.sub, { fontFamily: F.reg }]}>
              {phase === 'done'
                ? 'Everything is where you left it — your lessons, your progress and your notes. Sign in with your usual password.'
                : phase === 'code'
                  ? <>We&apos;ve sent a link and a code to{'\n'}<Text style={{ color: N.ink, fontFamily: F.med }}>{email}</Text></>
                  : <>You deleted this account, and it can still be brought back with everything in it.{'\n\n'}We&apos;ll email a restore link to{'\n'}<Text style={{ color: N.ink, fontFamily: F.med }}>{email}</Text></>}
            </Text>
          </Appear>

          <View style={styles.spacer} />

          <Appear delay={180}>
            {phase === 'code' && (
              <Animated.View
                style={{ transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] }}
              >
                <View style={[styles.field, focused && styles.fieldActive, !!error && styles.fieldError]}>
                  <TextInput
                    style={[styles.codeInput, { fontFamily: F.bold }]}
                    value={code}
                    // Strip anything that is not a digit rather than rejecting it: codes
                    // get pasted from a mail client with stray spaces around them.
                    onChangeText={(t) => { setCode(t.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH)); setError(''); }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="000000"
                    placeholderTextColor={N.inkDim}
                    keyboardType="number-pad"
                    maxLength={CODE_LENGTH}
                    autoFocus
                    keyboardAppearance="dark"
                    selectionColor={N.violet}
                    returnKeyType="done"
                    onSubmitEditing={handleConfirm}
                    editable={!loading}
                    accessibilityLabel="Six digit restore code"
                  />
                </View>
              </Animated.View>
            )}

            {!!error && <Text style={[styles.error, { fontFamily: F.med }]}>{error}</Text>}

            {phase === 'code' && !error && (
              <Text style={[styles.ok, { fontFamily: F.med }]}>
                The link in the email works too. Either one expires in 24 hours — check spam if it hasn&apos;t arrived.
              </Text>
            )}

            <Pressable
              onPress={onPrimary}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={primaryLabel}
              style={({ pressed }) => [
                styles.btnWrap,
                pressed && { transform: [{ scale: 0.985 }] },
                loading && { opacity: 0.7 },
              ]}
            >
              <LinearGradient
                colors={primaryReady ? [N.violet, '#A855F7'] : [N.violetLo, N.violet]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                {loading
                  ? <ActivityIndicator color={N.ink} size="small" />
                  : <Text style={[styles.btnText, { fontFamily: F.bold }]}>{primaryLabel}</Text>}
              </LinearGradient>
            </Pressable>

            {phase === 'code' && (
              <Pressable onPress={handleSend} disabled={loading} hitSlop={10} style={styles.center}>
                <Text style={[styles.resend, { fontFamily: F.med }]}>Send another email</Text>
              </Pressable>
            )}
          </Appear>

          <View style={styles.spacerLg} />

          {phase !== 'done' && (
            <Pressable onPress={backToSignIn} hitSlop={10} style={styles.center} accessibilityRole="button">
              <Text style={[styles.backLink, { fontFamily: F.med }]}>Back to Sign In</Text>
            </Pressable>
          )}
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
    flexDirection: 'row', alignItems: 'center',
    height: 64, borderRadius: 16, paddingHorizontal: 18,
    backgroundColor: N.cardSoft,
    borderWidth: 1.5, borderColor: N.cardEdge,
  },
  fieldActive: { borderColor: N.violet, backgroundColor: 'rgba(139,110,240,0.10)' },
  fieldError:  { borderColor: '#F0566E' },
  codeInput: {
    flex: 1, fontSize: 26, color: N.ink, padding: 0,
    textAlign: 'center', letterSpacing: 8,
  },

  error: { fontSize: 13, color: '#F0566E', marginTop: 12, textAlign: 'center' },
  ok:    { fontSize: 13, color: N.inkSoft, marginTop: 12, textAlign: 'center', lineHeight: 19 },

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

  resend: {
    fontSize: 14, color: N.dot, textDecorationLine: 'underline', marginTop: 18,
  },
  backLink: {
    fontSize: 15, color: N.dot, textDecorationLine: 'underline', marginTop: 4,
  },
});

export default ReactivateAccountScreen;
