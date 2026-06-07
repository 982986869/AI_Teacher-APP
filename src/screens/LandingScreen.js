import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, SafeAreaView, StatusBar, Linking, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Fontisto } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SYMBOLS = [
  { label: 'π',     top: 15,  left: 30,   size: 22, delay: 0    },
  { label: '∫',     top: 10,  left: 130,  size: 26, delay: 600  },
  { label: '∑',     top: 18,  right: 30,  size: 22, delay: 300  },
  { label: '√x',    top: 55,  left: 20,   size: 18, delay: 800  },
  { label: 'H₂O',   top: 60,  left: 100,  size: 14, delay: 400  },
  { label: 'E=mc²', top: 50,  right: 20,  size: 14, delay: 200  },
  { label: 'λ',     top: 105, left: 45,   size: 20, delay: 100  },
  { label: '∂',     top: 100, left: 140,  size: 20, delay: 700  },
  { label: '∆',     top: 110, right: 35,  size: 22, delay: 500  },
  { label: '∞',     top: 155, left: 20,   size: 26, delay: 600  },
  { label: 'Ω',     top: 160, left: 120,  size: 20, delay: 900  },
  { label: 'φ',     top: 150, right: 25,  size: 22, delay: 350  },
  { label: '÷',     top: 205, left: 40,   size: 22, delay: 500  },
  { label: 'DNA',   top: 210, left: 140,  size: 13, delay: 900  },
  { label: '∇',     top: 200, right: 30,  size: 22, delay: 750  },
];

function FloatingSymbol({ label, top, left, right, size, delay }) {
  const floatY  = useRef(new Animated.Value(0)).current;
  const floatX  = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 0.65, duration: 900, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 2000 + delay % 800, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,   duration: 2000 + delay % 800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatX, { toValue: delay % 2 === 0 ? 4 : -4, duration: 2500 + delay % 600, useNativeDriver: true }),
        Animated.timing(floatX, { toValue: 0, duration: 2500 + delay % 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text style={[
      styles.symbol,
      {
        top,
        left:  left  !== undefined ? left  : undefined,
        right: right !== undefined ? right : undefined,
        fontSize: size,
        opacity,
        transform: [{ translateY: floatY }, { translateX: floatX }],
      },
    ]}>
      {label}
    </Animated.Text>
  );
}

export default function LandingScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

      {/* BLACK HERO */}
      <View style={styles.hero}>
        {SYMBOLS.map((s, i) => <FloatingSymbol key={i} {...s} />)}
      </View>

      {/* WHITE CONTENT */}
      <Animated.View style={[
        styles.content,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
        <Text style={styles.title}>AILERNOVA</Text>

        <Text style={styles.tagline}>
          Make your Learning Smarter,{'\n'}Faster and More Effective!
        </Text>

        <View style={styles.subWrap}>
          <View style={styles.subPill}>
            <Text style={styles.subText}>JUST 15 MINUTES A DAY</Text>
          </View>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>Continue with</Text>
          <View style={styles.divLine} />
        </View>

        {/* Google button */}
        <TouchableOpacity style={styles.btnGoogle}
          onPress={() => console.log('Google')} activeOpacity={0.85}>
          <Fontisto name="google" size={18} color="#4285F4" />
          <Text style={styles.btnGoogleText}>Google</Text>
        </TouchableOpacity>

        {/* Email + Phone */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnHalf}
            onPress={() => navigation.navigate('LoginScreen')} activeOpacity={0.85}>
            <Fontisto name="email" size={16} color="#F4B400" />
            <Text style={styles.btnHalfText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnHalf}
            onPress={() => navigation.navigate('SignupScreen')} activeOpacity={0.85}>
            <MaterialCommunityIcons name="phone" size={18} color="#34A853" />
            <Text style={styles.btnHalfText}>Phone</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}
            onPress={() => Linking.openURL('https://ailernova.com/terms')}>
            Terms of Use
          </Text>
          {' '}and{' '}
          <Text style={styles.termsLink}
            onPress={() => Linking.openURL('https://ailernova.com/privacy')}>
            Privacy Policy
          </Text>
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const HERO_HEIGHT    = SCREEN_HEIGHT * 0.38;
const CONTENT_HEIGHT = SCREEN_HEIGHT * 0.65;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111111',
  },

  hero: {
    height: HERO_HEIGHT,
    backgroundColor: '#111111',
    overflow: 'hidden',
  },

  symbol: {
    position: 'absolute',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // large oval curve matching Cuemath
  content: {
    height: CONTENT_HEIGHT,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    marginTop: -40,
    justifyContent: 'center',
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#111111',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 14,
  },

  subWrap: { alignItems: 'center', marginBottom: 22 },
  subPill: {
    borderWidth: 1.5,
    borderColor: '#111111',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 7,
  },
  subText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: 1,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  divLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  divText: { fontSize: 11, color: '#999', fontWeight: '600' },

  // Google — full width rounded pill like Cuemath
  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 50,
    paddingVertical: 14,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  btnGoogleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },

  // Email + Phone — pill shaped like Cuemath
  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  btnHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 50,
    paddingVertical: 13,
    backgroundColor: '#fff',
  },
  btnHalfText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
  },

  terms: {
    fontSize: 10,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: '#555',
    textDecorationLine: 'underline',
  },
});