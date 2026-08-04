import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { User, Mail, Phone as PhoneIcon, Lock, Eye, EyeOff } from 'lucide-react-native';

import AuthInput     from '../components/brand/AuthInput';
import AuthError     from '../components/brand/AuthError';
import AuthCheckbox  from '../components/brand/AuthCheckbox';
import PrimaryButton from '../components/brand/PrimaryButton';
import { COLORS, TYPE, FONT_FAMILY, SPACING } from '../theme/designSystem';

import { signupWithEmail } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, validateName, validatePhone } from '../utils/validators';

// "Create Account" — the design's sign-up screen: one unified form (name,
// email, phone, password, confirm), not the old Email/Phone tab split, and no
// social buttons (those live on Login now, matching the reference). The Phone
// field is UI-only for now: POST /api/auth/register (signupWithEmail) takes
// { name, email, password, grade } — no phone column — so it's collected but
// deliberately not sent rather than silently pretending it's saved. Wire it
// through once the backend accepts it.
const SignupScreen = ({ navigation }) => {
  const { signIn } = useAuth();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [agreed, setAgreed]     = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleCreateAccount = async () => {
    setError('');
    const nameErr = validateName(name);
    if (nameErr) return setError(nameErr);
    if (!validateEmail(email)) return setError('Enter a valid email address.');
    if (phone && !validatePhone(phone)) return setError('Enter a valid 10-digit phone number, or leave it blank.');
    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (!agreed) return setError('Please agree to the Terms & Privacy Policy to continue.');

    try {
      setLoading(true);
      const data = await signupWithEmail({ name, email, password });
      await signIn(data);
    } catch (e) {
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
          I agree to <Text style={styles.link}>Terms</Text> & <Text style={styles.link}>Privacy Policy</Text>
        </AuthCheckbox>

        <PrimaryButton label="Create Account" onPress={handleCreateAccount} loading={loading} style={styles.mainBtn} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
            <Text style={styles.switchLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.xl },
  heading: { ...TYPE.display, marginBottom: 6 },
  sub: { ...TYPE.body, marginBottom: SPACING.xl },
  link: { color: COLORS.primaryLight, fontFamily: FONT_FAMILY.semibold },
  mainBtn: { marginTop: SPACING.xs },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  switchLabel: { fontFamily: FONT_FAMILY.regular, fontSize: 13, color: COLORS.textSecondary },
  switchLink: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.primaryLight },
});

export default SignupScreen;
