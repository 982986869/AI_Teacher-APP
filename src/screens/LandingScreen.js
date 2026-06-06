import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';

const { width } = Dimensions.get('window');

// Math/science symbols scattered in the hero
const SYMBOLS = [
  { label: 'π',      top: 30,  left: 24,   size: 28, color: '#7ecfff', delay: 0    },
  { label: '∑',      top: 55,  right: 28,  size: 26, color: '#ffcc66', delay: 400  },
  { label: '√x',     top: 110, left: 40,   size: 22, color: '#a78bfa', delay: 800  },
  { label: 'E=mc²',  top: 90,  right: 20,  size: 15, color: '#34d399', delay: 200  },
  { label: '∞',      top: 160, left: 20,   size: 30, color: '#f472b6', delay: 600  },
  { label: '∆',      top: 140, right: 50,  size: 24, color: '#fb923c', delay: 1000 },
  { label: 'H₂O',    top: 40,  left: 130,  size: 14, color: '#67e8f9', delay: 300  },
  { label: '⚛',      top: 170, right: 18,  size: 26, color: '#c4b5fd', delay: 700  },
  { label: '÷',      top: 200, left: 70,   size: 28, color: '#fde68a', delay: 500  },
  { label: 'DNA',    top: 195, right: 70,  size: 13, color: '#86efac', delay: 900  },
  { label: '∫',      top: 75,  left: 170,  size: 26, color: '#fdba74', delay: 1200 },
  { label: 'λ',      top: 130, left: 100,  size: 22, color: '#93c5fd', delay: 100  },
];

function FloatingSymbol({ label, top, left, right, size, color, delay }) {
  const floatY  = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // fade in then loop float
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 0.85, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(delay % 500),
        Animated.timing(floatY, { toValue: -10, duration: 1800 + delay % 600, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,   duration: 1800 + delay % 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.symbol,
        {
          top,
          left:    left  !== undefined ? left  : undefined,
          right:   right !== undefined ? right : undefined,
          fontSize: size,
          color,
          opacity,
          transform: [{ translateY: floatY }],
        },
      ]}
    >
      {label}
    </Animated.Text>
  );
}

export default function LandingScreen({ navigation }) {
  // Fade-in for bottom content
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, delay: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleGoogle = () => {
    // TODO: wire up Google OAuth
    console.log('Google sign-in pressed');
  };

  const handleEmail = () => navigation.navigate('Login');
  const handlePhone = () => navigation.navigate('Signup');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0c2e" />

      {/* ── Hero dark section ── */}
      <View style={styles.hero}>

        {/* Floating pill badges */}
        <View style={[styles.badge, styles.badgeLeft]}>
          <Text style={styles.badgeText}>✦ AI Powered</Text>
        </View>
        <View style={[styles.badge, styles.badgeRight]}>
          <Text style={styles.badgeText}>🏆 Learn Smarter</Text>
        </View>

        {/* Floating math/science symbols */}
        {SYMBOLS.map((s, i) => (
          <FloatingSymbol key={i} {...s} />
        ))}

        {/* Central glowing atom ring */}
        <View style={styles.atomOuter}>
          <View style={styles.atomMiddle}>
            <View style={styles.atomCore} />
          </View>
        </View>

      </View>

      {/* ── White curved content section ── */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.title}>
          Ai<Text style={styles.titleAccent}>Lernova</Text>
        </Text>

        <Text style={styles.tagline}>
          Make your Learning{' '}
          <Text style={styles.taglineAccent}>Smarter, Faster</Text>
          {'\n'}and More Effective!
        </Text>

        <Text style={styles.subTagline}>
          Join thousands of students learning with AI
        </Text>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google button */}
        <TouchableOpacity style={styles.btnGoogle} onPress={handleGoogle} activeOpacity={0.85}>
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.btnGoogleText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Email + Phone row */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.btnEmail]} onPress={handleEmail} activeOpacity={0.85}>
            <Text style={styles.btnEmailText}>✉  Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnPhone]} onPress={handlePhone} activeOpacity={0.85}>
            <Text style={styles.btnPhoneText}>📞  Phone</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text
            style={styles.termsLink}
            onPress={() => Linking.openURL('https://ailernova.com/terms')}
          >
            Terms of Use
          </Text>
          {' '}and{' '}
          <Text
            style={styles.termsLink}
            onPress={() => Linking.openURL('https://ailernova.com/privacy')}
          >
            Privacy Policy
          </Text>
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const HERO_BG = '#0f0c2e';
const ACCENT  = '#5b8dee';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: HERO_BG,
  },

  // ── Hero ──
  hero: {
    backgroundColor: HERO_BG,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  badge: {
    position: 'absolute',
    top: 16,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    zIndex: 10,
  },
  badgeLeft:  { left: 16 },
  badgeRight: { right: 16 },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // floating symbols
  symbol: {
    position: 'absolute',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Central atom decoration
  atomOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(126,207,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  atomMiddle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(126,207,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  atomCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7ecfff',
    opacity: 0.9,
  },

  // ── Content ──
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    marginTop: -24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f0c2e',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  titleAccent: { color: ACCENT },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 6,
  },
  taglineAccent: { color: ACCENT },
  subTagline: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  dividerText: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
  },

  // Buttons
  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  googleG: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4285F4',
  },
  btnGoogleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEmail: {
    borderColor: '#ffe0b2',
    backgroundColor: '#fff8f0',
  },
  btnEmailText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b85c00',
  },
  btnPhone: {
    borderColor: '#c8f0e0',
    backgroundColor: '#f0fff7',
  },
  btnPhoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a7a50',
  },

  terms: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 17,
  },
  termsLink: { color: ACCENT },
});