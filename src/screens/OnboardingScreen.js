import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Dimensions, StatusBar,
  ScrollView, Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const QUESTIONS = [
  {
    id: 1,
    emoji: '🎓',
    question: "What grade are you in?",
    subtitle: "We'll personalise your content to match your level.",
    type: 'grid',
    options: ['K','1','2','3','4','5','6','7','8','9','10','11','12'],
  },
  {
    id: 2,
    emoji: '📚',
    question: "Which subjects do you love?",
    subtitle: "Pick all that apply — we'll focus on what excites you.",
    type: 'chips',
    multi: true,
    options: ['Mathematics','Science','English','History','Geography','Physics','Chemistry','Biology','Computer Science','Economics','Art','Music'],
  },
  {
    id: 3,
    emoji: '🎯',
    question: "What's your main goal?",
    subtitle: "This helps us build the right learning path for you.",
    type: 'cards',
    options: [
      { label: 'Score better in exams',       icon: '📝' },
      { label: 'Build strong concepts',        icon: '🧠' },
      { label: 'Prepare for entrance tests',   icon: '🏆' },
      { label: 'Learn out of curiosity',       icon: '🔍' },
    ],
  },
  {
    id: 4,
    emoji: '⏱',
    question: "How much time can you give daily?",
    subtitle: "Even 15 minutes a day creates a powerful habit.",
    type: 'cards',
    options: [
      { label: '15 minutes',       icon: '⚡' },
      { label: '30 minutes',       icon: '🔥' },
      { label: '1 hour',           icon: '💪' },
      { label: 'More than 1 hour', icon: '🚀' },
    ],
  },
  {
    id: 5,
    emoji: '📱',
    question: "How do you learn best?",
    subtitle: "We'll mix in your favourite formats to keep it fun.",
    type: 'chips',
    multi: true,
    options: ['Short Videos','Practice Tests','Flashcards','Story-based','Diagrams & Charts','Live Quizzes','Reading Notes','Mind Maps'],
  },
];

const OnboardingScreen = () => {
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const slideAnim = useRef(new Animated.Value(0)).current;

  const current = QUESTIONS[currentIndex];
  const isLast = currentIndex === QUESTIONS.length - 1;
  const selected = answers[current.id] ?? (current.multi ? [] : null);
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;

  const animateSlide = () => {
    slideAnim.setValue(40);
    Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  };

  const handleSelect = (option) => {
    if (current.multi) {
      const prev = answers[current.id] || [];
      const next = prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option];
      setAnswers({ ...answers, [current.id]: next });
    } else {
      const val = typeof option === 'object' ? option.label : option;
      setAnswers({ ...answers, [current.id]: val });
    }
  };

  const isSelected = (option) => {
    const val = typeof option === 'object' ? option.label : option;
    if (current.multi) return (selected || []).includes(val);
    return selected === val;
  };

  const canProceed = () => {
    if (current.multi) return (selected || []).length > 0;
    return selected !== null && selected !== undefined;
  };

  const handleNext = async () => {
    if (!canProceed()) return;
    if (isLast) {
      await completeOnboarding();
    } else {
      animateSlide();
      setCurrentIndex(i => i + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      animateSlide();
      setCurrentIndex(i => i - 1);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top bar — progress + back */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backCircle, currentIndex === 0 && styles.backCircleHidden]}
          disabled={currentIndex === 0}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <Animated.ScrollView
        style={{ transform: [{ translateX: slideAnim }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Emoji + bubble */}
        <View style={styles.emojiBubble}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emojiText}>{current.emoji}</Text>
          </View>
          <View style={styles.bubbleCloud}>
            <Text style={styles.bubbleText}>{current.subtitle}</Text>
          </View>
        </View>

        <Text style={styles.question}>{current.question}</Text>

        {/* Grid (grades) */}
        {current.type === 'grid' && (
          <View style={styles.grid}>
            {current.options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.gridItem, isSelected(opt) && styles.gridItemSelected]}
                onPress={() => handleSelect(opt)}
                activeOpacity={0.8}
              >
                <Text style={[styles.gridText, isSelected(opt) && styles.gridTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Chips */}
        {current.type === 'chips' && (
          <View style={styles.chipsWrap}>
            {current.options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, isSelected(opt) && styles.chipSelected]}
                onPress={() => handleSelect(opt)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected(opt) && styles.chipTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Cards */}
        {current.type === 'cards' && (
          <View style={styles.cardsWrap}>
            {current.options.map(opt => {
              const sel = isSelected(opt);
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.card, sel && styles.cardSelected]}
                  onPress={() => handleSelect(opt)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardIcon}>{opt.icon}</Text>
                  <Text style={[styles.cardText, sel && styles.cardTextSelected]}>{opt.label}</Text>
                  {sel && <Text style={styles.cardCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Bottom */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>{currentIndex + 1} of {QUESTIONS.length}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#fff' },
  topBar:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, gap: 12 },
  backCircle:      { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  backCircleHidden:{ opacity: 0 },
  backArrow:       { fontSize: 18, color: '#0a0a0a' },
  progressBarBg:   { flex: 1, height: 5, backgroundColor: '#e8e8e8', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 5, backgroundColor: '#0a0a0a', borderRadius: 3 },
  scroll:          { paddingHorizontal: 22, paddingTop: 16 },
  emojiBubble:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  emojiCircle:     { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e0e0e0' },
  emojiText:       { fontSize: 26 },
  bubbleCloud:     { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 14, borderTopLeftRadius: 2, padding: 12 },
  bubbleText:      { fontSize: 13, color: '#555', lineHeight: 19 },
  question:        { fontSize: 22, fontWeight: '700', color: '#0a0a0a', marginBottom: 24, lineHeight: 30 },

  // Grid
  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem:        { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  gridItemSelected:{ backgroundColor: '#0a0a0a', borderColor: '#0a0a0a' },
  gridText:        { fontSize: 15, fontWeight: '600', color: '#333' },
  gridTextSelected:{ color: '#fff' },

  // Chips
  chipsWrap:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip:            { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1.5, borderColor: '#e0e0e0', backgroundColor: '#fff' },
  chipSelected:    { backgroundColor: '#0a0a0a', borderColor: '#0a0a0a' },
  chipText:        { fontSize: 13, color: '#444', fontWeight: '500' },
  chipTextSelected:{ color: '#fff' },

  // Cards
  cardsWrap:       { gap: 12 },
  card:            { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#e0e0e0', backgroundColor: '#fff', gap: 14 },
  cardSelected:    { backgroundColor: '#0a0a0a', borderColor: '#0a0a0a' },
  cardIcon:        { fontSize: 22 },
  cardText:        { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
  cardTextSelected:{ color: '#fff' },
  cardCheck:       { fontSize: 16, color: '#fff', fontWeight: '700' },

  // Bottom
  bottom:          { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 22, paddingBottom: 36, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e8e8e8' },
  nextBtn:         { backgroundColor: '#0a0a0a', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  nextBtnDisabled: { opacity: 0.25 },
  nextText:        { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  counter:         { fontSize: 12, color: '#aaa', textAlign: 'center' },
});

export default OnboardingScreen;