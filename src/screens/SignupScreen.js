import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { User, Mail, Phone as PhoneIcon, Lock, Eye, EyeOff, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import AuthInput     from '../components/brand/AuthInput';
import AuthError     from '../components/brand/AuthError';
import AuthCheckbox  from '../components/brand/AuthCheckbox';
import PolicyModal   from '../components/brand/PolicyModal';
import { TERMS_HTML } from '../constants/termsOfUse';
import PrimaryButton from '../components/brand/PrimaryButton';
import { COLORS, TYPE, FONT_FAMILY, SPACING } from '../theme/designSystem';

import { signupWithEmail } from '../api/authApi';
import { flow, flowErr } from '../utils/flowLog';
import { useAuth } from '../context/AuthContext';
import { reportError } from '../utils/errorLog';
import { validateEmail, validatePassword, validateName, validatePhone } from '../utils/validators';

// The policy the tick-box commits the student to. Signup is BLOCKED until they
// agree, so it has to be readable before they agree — it was styled as a link
// with no handler, which asked for consent to something that could not be opened.
const PRIVACY_URL = 'https://ailernova.in/privacy-policy/';

// The checkbox names two documents and both can be opened.
//
// It used to name only the Privacy Policy, because there was no terms document:
// ailernova.in publishes eleven pages and none of them is one, and /terms/,
// /terms-and-conditions/, /terms-of-use/, /tnc/ and /terms-conditions/ all 404.
// A sentence collecting agreement to a document nobody can read is the one thing
// a consent control must not do.
//
// The terms now SHIP WITH THE APP (constants/termsOfUse.js) rather than living on
// the site, so the version a student agreed to is the version in their build. The
// privacy policy stays a URL, because that page exists and is the source of truth.



// "Create Account" — the design's sign-up screen: one unified form (name,
// email, phone, password, confirm), not the old Email/Phone tab split, and no
// social buttons (those live on Login now, matching the reference). The Phone
// field is UI-only for now: POST /api/auth/register (signupWithEmail) takes
// { name, email, password, grade } — no phone column — so it's collected but
// deliberately not sent rather than silently pretending it's saved. Wire it
// through once the backend accepts it.
//
// Profile photo is optional here — pick one and it uploads right after the
// account is created; skip it and the backend assigns a default avatar
// instead (see auth.controller.js's ensurePhoto), so every account has a
// real photoUrl either way and nothing downstream has to guess.
const SignupScreen = ({ navigation }) => {
  const { signIn, updatePhoto } = useAuth();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [agreed, setAgreed]     = useState(false);
  // Which policy sheet is open, if any: 'privacy' | 'terms' | null.
  const [policy, setPolicy]     = useState(null);
  const [photo, setPhoto]       = useState(null); // RN asset { uri, ... } or null

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setError('Photo access is needed to choose a picture.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.length) setPhoto(res.assets[0]);
  };
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setError('Camera access is needed to take a picture.'); return; }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.length) setPhoto(res.assets[0]);
  };
  const choosePhoto = () => {
    Alert.alert('Profile photo', 'Add a profile photo', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCreateAccount = async () => {
    setError('');
    const nameErr = validateName(name);
    if (nameErr) return setError(nameErr);
    if (!validateEmail(email)) return setError('Enter a valid email address.');
    if (phone && !validatePhone(phone)) return setError('Enter a valid 10-digit phone number, or leave it blank.');
    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);
    if (password !== confirmPassword) return setError('Passwords do not match.');
    // Names exactly what the checkbox names — an error that asks a student to
    // accept "Terms" they were never shown is the same defect in another place.
    if (!agreed) return setError('Please agree to the Terms and Privacy Policy to continue.');

    try {
      setLoading(true);
      flow('S1. sign up  —  trying', email.trim());
      const data = await signupWithEmail({ name, email, password });
      flow('S2. sign up  —  a NEW account was created');
      await signIn(data);
      // Best-effort — a photo-upload hiccup should never block a just-created
      // account from signing in. No photo picked → the backend's own default
      // avatar (already on the account from signup) stands as-is.
      if (photo) { try { await updatePhoto(photo); } catch (e) { reportError('screens/SignupScreen.js:updatePhoto', e); } }
    } catch (e) {
      // Signing up with an address that already has a DELETED account. A bare "that
      // email is taken" would strand exactly the person the recovery window is for —
      // told the address is unavailable, and not told it is their own account holding it.
      if (e?.response?.data?.code === 'ACCOUNT_DEACTIVATED') {
        flow('S2. sign up  —  this address has a DELETED account; opening restore screen');
        return navigation.navigate('ReactivateAccountScreen', { email: email.trim() });
      }
      setError(e?.response?.data?.error || e?.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.sub}>Join Ailernova and unlock personalized learning</Text>

        <View style={styles.avatarRow}>
          <TouchableOpacity style={styles.avatarWrap} onPress={choosePhoto} accessibilityLabel="Add a profile photo">
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}><User size={28} color={COLORS.textSecondary} strokeWidth={1.8} /></View>
            )}
            <View style={styles.avatarBadge}><Camera size={13} color="#fff" strokeWidth={2.4} /></View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>{photo ? 'Tap to change photo' : 'Add a profile photo (optional)'}</Text>
        </View>

        <AuthError message={error} />

        <AuthInput
          icon={<User size={18} color={COLORS.textSecondary} strokeWidth={2} />}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <AuthInput
          icon={<Mail size={18} color={COLORS.textSecondary} strokeWidth={2} />}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <AuthInput
          icon={<PhoneIcon size={18} color={COLORS.textSecondary} strokeWidth={2} />}
          placeholder="Phone Number"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
          keyboardType="phone-pad"
          maxLength={10}
        />
        <AuthInput
          icon={<Lock size={18} color={COLORS.textSecondary} strokeWidth={2} />}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPw}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPw((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showPw ? <EyeOff size={18} color={COLORS.textSecondary} strokeWidth={2} /> : <Eye size={18} color={COLORS.textSecondary} strokeWidth={2} />}
            </TouchableOpacity>
          }
        />
        <AuthInput
          icon={<Lock size={18} color={COLORS.textSecondary} strokeWidth={2} />}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPw}
          rightIcon={
            <TouchableOpacity onPress={() => setShowConfirmPw((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {showConfirmPw ? <EyeOff size={18} color={COLORS.textSecondary} strokeWidth={2} /> : <Eye size={18} color={COLORS.textSecondary} strokeWidth={2} />}
            </TouchableOpacity>
          }
        />

        <AuthCheckbox checked={agreed} onToggle={() => setAgreed((a) => !a)}>
          I agree to the{' '}
          {/* Every named document here is one the student can open. */}
          <Text style={styles.link} onPress={() => setPolicy('terms')} accessibilityRole="link">Terms</Text>
          {' '}&{' '}
          <Text
            style={styles.link}
            onPress={() => setPolicy('privacy')}
            accessibilityRole="link"
          >Privacy Policy</Text>
        </AuthCheckbox>

        <PrimaryButton label="Create Account" onPress={handleCreateAccount} loading={loading} style={styles.mainBtn} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
            <Text style={styles.switchLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Outside the ScrollView: a Modal nested in a scroller inherits its
          scroll state on Android and can open scrolled to the middle. */}
      <PolicyModal
        visible={policy !== null}
        onClose={() => setPolicy(null)}
        url={policy === 'terms' ? undefined : PRIVACY_URL}
        html={policy === 'terms' ? TERMS_HTML : undefined}
        title={policy === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.xl },
  heading: { ...TYPE.display, marginBottom: 6 },
  sub: { ...TYPE.body, marginBottom: SPACING.xl },
  avatarRow: { alignItems: 'center', marginBottom: SPACING.xl },
  avatarWrap: { width: 84, height: 84 },
  avatarImg: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: COLORS.primary },
  avatarPlaceholder: { width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  avatarBadge: { position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.background },
  avatarHint: { fontFamily: FONT_FAMILY.medium, fontSize: 12, color: COLORS.textSecondary, marginTop: 9 },
  link: { color: COLORS.primaryLight, fontFamily: FONT_FAMILY.semibold },
  mainBtn: { marginTop: SPACING.xs },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  switchLabel: { fontFamily: FONT_FAMILY.regular, fontSize: 13, color: COLORS.textSecondary },
  switchLink: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.primaryLight },
});

export default SignupScreen;
