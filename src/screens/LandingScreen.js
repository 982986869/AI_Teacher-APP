import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/colors';


const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: '🤖', title: 'AI Powered', desc: 'Smart learning tailored for you' },
  { icon: '📚', title: 'Rich Content', desc: 'Courses by expert teachers' },
  { icon: '📊', title: 'Track Progress', desc: 'Monitor your growth daily' },
];

export default function LandingScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(150, [
        Animated.timing(card1Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(card2Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(card3Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const cardAnims = [card1Anim, card2Anim, card3Anim];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top visual section */}
      <View style={styles.heroSection}>

        {/* Background circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />

        {/* Floating logo box */}
        <Animated.View
          style={[
            styles.logoBox,
            {
              transform: [
                { translateY: floatAnim },
                { scale: scaleAnim },
              ],
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.logoIcon}>🎓</Text>
          <Text style={styles.logoText}>AiLernova</Text>
        </Animated.View>

        {/* Floating mini badges */}
        <Animated.View style={[styles.badge, styles.badge1, { opacity: fadeAnim }]}>
          <Text style={styles.badgeText}>✨ AI Powered</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.badge2, { opacity: fadeAnim }]}>
          <Text style={styles.badgeText}>📈 Track Progress</Text>
        </Animated.View>
        <Animated.View style={[styles.badge, styles.badge3, { opacity: fadeAnim }]}>
          <Text style={styles.badgeText}>🏆 Learn Smarter</Text>
        </Animated.View>
      </View>

      {/* Bottom white section */}
      <View style={styles.bottomSection}>

        {/* Headline */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.headline}>
            Make your Learning{'\n'}
            <Text style={styles.headlineAccent}>Smarter, Faster</Text>
            {'\n'}and More Effective!
          </Text>
          <Text style={styles.subheadline}>
            Join thousands of students learning with AI
          </Text>
        </Animated.View>

        {/* Feature cards */}
        <View style={styles.cardsRow}>
          {FEATURES.map((item, index) => (
            <Animated.View
              key={index}
              style={[
                styles.featureCard,
                {
                  opacity: cardAnims[index],
                  transform: [
                    {
                      translateY: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.featureIcon}>{item.icon}</Text>
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureDesc}>{item.desc}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google button */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Email and Phone buttons */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => navigation.navigate('Onboarding')}
          >
            <Text style={styles.optionIcon}>✉️</Text>
            <Text style={styles.optionText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.optionIcon}>📱</Text>
            <Text style={styles.optionText}>Phone</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Use</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },

  // Hero section
  heroSection: {
    backgroundColor: '#1a1a2e',
    height: height * 0.42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.primary,
    top: -60,
    left: -60,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#7C3AED',
    bottom: -40,
    right: -40,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#06B6D4',
    top: 20,
    right: 40,
  },

  // Logo
  logoBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // Floating badges
  badge: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badge1: { top: 30, left: 20 },
  badge2: { bottom: 40, left: 10 },
  badge3: { top: 50, right: 10 },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },

  // Bottom section
  bottomSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 10,
  },
  headlineAccent: {
    color: COLORS.primary,
  },
  subheadline: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Feature cards
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 8,
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 3,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 10,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 14,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: COLORS.subtext,
  },

  // Google button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 50,
    paddingVertical: 14,
    marginBottom: 14,
    backgroundColor: COLORS.white,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 10,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Options row
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 50,
    paddingVertical: 13,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  optionIcon: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Terms
  terms: {
    fontSize: 12,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
}); 
