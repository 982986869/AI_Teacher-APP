// screens/OnboardingScreen.js — AiLernova 4-step onboarding
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import COLORS from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { STEPS } from '../constants/onboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');// ─── Nova Mascot + Speech Bubble ─────────────────────────────────────────────
function NovaBubble({ text }) {
  const parts = (text || '').split('Nova'); // ← fix 1: guard against undefined
  return (
    <View style={styles.mascotRow}>
      <View style={styles.mascot}>
        <Text style={styles.mascotEmoji}>🤖</Text>
      </View>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < parts.length - 1 && (
                <Text style={styles.bubbleAccent}>Nova</Text>
              )}
            </React.Fragment>
          ))}
        </Text>
      </View>
    </View>
  );
}

// ─── Chip (pill) option ───────────────────────────────────────────────────────
function Chip({ label, icon, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Card (2-col grid) option ─────────────────────────────────────────────────
function SCard({ label, icon, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.scard, selected && styles.scardSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.scardIcon}>{icon}</Text>
      <Text style={[styles.scardLabel, selected && styles.scardLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const [current, setCurrent] = useState(0);
  const [selections, setSelections] = useState(
    STEPS.map(() => ({}))
  );

  const progressAnim = useRef(new Animated.Value(0)).current;

  const step = STEPS[current];
  if (!step) return null; // ← add this line here

  const isLast = current === STEPS.length - 1;
  const hasSelection = Object.keys(selections[current]).length > 0;
  const progressPct = ((current + 1) / STEPS.length) * 100;

  // Animate progress bar whenever step changes
  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPct,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [current]);

  function toggle(label) {
    setSelections(prev => {
      const updated = [...prev];
      const cur = { ...updated[current] };
      if (cur[label]) {
        delete cur[label];
      } else {
        if (!step.multi) {
          // single-select: clear others
          updated[current] = { [label]: true };
          return updated;
        }
        cur[label] = true;
      }
      updated[current] = cur;
      return updated;
    });
  }

  function goNext() {
    if (!isLast) {
      setCurrent(c => c + 1);
    } else {
      // Build the profile object and navigate
      const profile = {
        grade:    Object.keys(selections[0])[0] || '',
        subjects: Object.keys(selections[1]),
        styles:   Object.keys(selections[2]),
        goal:     Object.keys(selections[3])[0] || '',
      };
      // Replace with your navigation target:
      navigation.replace('Main', { profile });
    }
  }

  function goBack() {
    if (current > 0) setCurrent(c => c - 1);
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkNavy} />

      {/* ── Progress bar ── */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* ── Hero / Nova section ── */}
      <View style={styles.hero}>
        {/* decorative dots */}
        <View style={[styles.dot, { width: 70, height: 70, top: -20, right: 30 }]} />
        <View style={[styles.dot, { width: 40, height: 40, bottom: 10, left: 15 }]} />

        <Text style={styles.stepLabel}>
          Step {current + 1} of {STEPS.length}
        </Text>
        <NovaBubble text={step.bubble} />
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        <Text style={styles.qTitle}>{step.question}</Text>

        <ScrollView
          contentContainerStyle={
            step.type === 'cards' ? styles.cardGrid : styles.chipGrid
          }
          showsVerticalScrollIndicator={false}
          style={styles.optionsScroll}
        >
          {step.options.map((label, i) =>
            step.type === 'cards' ? (
              <SCard
                key={label}
                label={label}
                icon={step.icons[i]}
                selected={!!selections[current][label]}
                onPress={() => toggle(label)}
              />
            ) : (
              <Chip
                key={label}
                label={label}
                icon={step.icons[i]}
                selected={!!selections[current][label]}
                onPress={() => toggle(label)}
              />
            )
          )}
        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btnBack, current === 0 && { opacity: 0.3 }]}
            onPress={goBack}
            disabled={current === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.btnBackText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnNext, !hasSelection && styles.btnNextDisabled]}
            onPress={goNext}
            disabled={!hasSelection}
            activeOpacity={0.8}
          >
            <Text style={styles.btnNextText}>
              {isLast ? 'Finish 🚀' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.darkNavy,
  },

  // Progress
  progressTrack: {
    height: 5,
    backgroundColor: '#e2e8f0',
  },
  progressFill: {
    height: 5,
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },

  // Hero
  hero: {
    backgroundColor: COLORS.darkNavy,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: COLORS.heroDot,
  },
  stepLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONTS.semiBold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Nova mascot
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  mascot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mascotEmoji: {
    fontSize: 22,
  },
  bubble: {
    flex: 1,
    backgroundColor: COLORS.darkCard,
    borderRadius: 4,
    borderTopLeftRadius: 0, // speech tail side
    borderBottomLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleText: {
    color: COLORS.textWhite,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  bubbleAccent: {
    color: COLORS.novaBlue,
    fontFamily: FONTS.bold,
  },

  // Body
  body: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  qTitle: {
    fontSize: 14,
    fontFamily: FONTS.extraBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  optionsScroll: {
    flex: 1,
  },

  // Chip grid
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
  },
  chipSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  chipIcon: {
    fontSize: 15,
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
  },
  chipLabelSelected: {
    color: COLORS.white,
  },

  // Card grid
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  scard: {
    width: (SCREEN_WIDTH - 32 - 8) / 2, // 2 columns with gap
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  scardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.selectedBg,
  },
  scardIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  scardLabel: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  scardLabelSelected: {
    color: COLORS.textBlue,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  btnBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  btnBackText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  btnNext: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNextDisabled: {
    backgroundColor: COLORS.disabled,
  },
  btnNextText: {
    fontSize: 14,
    fontFamily: FONTS.extraBold,
    color: COLORS.white,
  },
});