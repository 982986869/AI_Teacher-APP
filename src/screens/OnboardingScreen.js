 import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const { width } = Dimensions.get('window');

// ─── Data ────────────────────────────────────────────────────────────────────

const SUBJECTS = [
  {
    id: 'math',
    label: 'Mathematics',
    icon: '🔢',
    color: '#FFF3CD',
    border: '#FFC107',
    text: '#7A5800',
  },
  {
    id: 'science',
    label: 'Science',
    icon: '🔬',
    color: '#D4EDDA',
    border: '#28A745',
    text: '#155724',
  },
];

const MATH_TOPICS = [
  { id: 'algebra', label: 'Algebra', icon: '➗' },
  { id: 'geometry', label: 'Geometry', icon: '📐' },
  { id: 'arithmetic', label: 'Arithmetic', icon: '🔢' },
  { id: 'fractions', label: 'Fractions', icon: '½' },
  { id: 'statistics', label: 'Statistics', icon: '📊' },
  { id: 'trigonometry', label: 'Trigonometry', icon: '📏' },
];

const SCIENCE_TOPICS = [
  { id: 'physics', label: 'Physics', icon: '⚡' },
  { id: 'chemistry', label: 'Chemistry', icon: '🧪' },
  { id: 'biology', label: 'Biology', icon: '🧬' },
  { id: 'earth', label: 'Earth Science', icon: '🌍' },
  { id: 'space', label: 'Space & Astronomy', icon: '🚀' },
  { id: 'environment', label: 'Environment', icon: '🌿' },
];

const MOODS = [
  { id: 'excited', label: 'Excited', face: '😄' },
  { id: 'okay', label: 'Okay', face: '😐' },
  { id: 'bored', label: 'Bored', face: '😴' },
  { id: 'stressed', label: 'Stressed', face: '😟' },
  { id: 'curious', label: 'Curious', face: '🤩' },
  { id: 'confused', label: 'Confused', face: '😕' },
];

const GOALS = [
  { id: 'grades', label: 'Improve my grades', icon: '🏆' },
  { id: 'learn', label: 'Learn something new', icon: '🧠' },
  { id: 'exam', label: 'Prepare for exams', icon: '📝' },
  { id: 'daily', label: 'Practice daily', icon: '🎯' },
  { id: 'ahead', label: 'Get ahead of class', icon: '🚀' },
];

// ─── Step Config ─────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'subject',    bubbleText: 'Which subject do you want to focus on?' },
  { key: 'topic',      bubbleText: 'Great! Which areas do you want to improve?' },
  { key: 'mood',       bubbleText: 'How do you feel about studying right now?' },
  { key: 'goal',       bubbleText: "What's your main learning goal?" },
];

// ─── SubjectCard ─────────────────────────────────────────────────────────────

const SubjectCard = ({ item, selected, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
    onPress(item.id);
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
      <Animated.View
        style={[
          styles.subjectCard,
          { backgroundColor: selected ? item.color : '#fff', borderColor: selected ? item.border : '#E8E8E8' },
          { transform: [{ scale }] },
        ]}
      >
        <Text style={styles.subjectIcon}>{item.icon}</Text>
        <Text style={[styles.subjectLabel, { color: selected ? item.text : '#333' }]}>
          {item.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── TopicChip ────────────────────────────────────────────────────────────────

const TopicChip = ({ item, selected, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => onPress(item.id)}
    style={[styles.topicChip, selected && styles.topicChipSelected]}
  >
    <Text style={styles.topicChipIcon}>{item.icon}</Text>
    <Text style={[styles.topicChipLabel, selected && styles.topicChipLabelSelected]}>
      {item.label}
    </Text>
  </TouchableOpacity>
);

// ─── MoodCard ────────────────────────────────────────────────────────────────

const MoodCard = ({ item, selected, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => onPress(item.id)}
    style={[styles.moodCard, selected && styles.moodCardSelected]}
  >
    <Text style={styles.moodFace}>{item.face}</Text>
    <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>{item.label}</Text>
  </TouchableOpacity>
);

// ─── GoalItem ────────────────────────────────────────────────────────────────

const GoalItem = ({ item, selected, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => onPress(item.id)}
    style={[styles.goalItem, selected && styles.goalItemSelected]}
  >
    <Text style={styles.goalIcon}>{item.icon}</Text>
    <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>{item.label}</Text>
    {selected && <Text style={styles.goalCheck}>✓</Text>}
  </TouchableOpacity>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function OnboardingScreen({ navigation }) {
  const [step, setStep]             = useState(0);
  const [subject, setSubject]       = useState(null);
  const [topics, setTopics]         = useState([]);
  const [mood, setMood]             = useState(null);
  const [goal, setGoal]             = useState(null);
  const [done, setDone]             = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const topicList = subject === 'math' ? MATH_TOPICS : SCIENCE_TOPICS;
  const progress  = ((step + 1) / STEPS.length) * 100;

  // ── Validate current step ──
  const canProceed = () => {
    if (step === 0) return !!subject;
    if (step === 1) return topics.length > 0;
    if (step === 2) return !!mood;
    if (step === 3) return !!goal;
    return false;
  };

  // ── Animated transition ──
  const transition = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const goNext = () => {
    if (!canProceed()) return;
    if (step < STEPS.length - 1) {
      transition(() => setStep(s => s + 1));
    } else {
      setDone(true);
    }
  };

  const goBack = () => {
    if (step > 0) transition(() => setStep(s => s - 1));
  };

  const toggleTopic = (id) => {
    setTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // ── Done screen ──
  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneScreen}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>You're all set!</Text>
          <Text style={styles.doneSub}>
            We've built a personalized learning plan for{' '}
            <Text style={{ fontWeight: '700', color: '#FFC107' }}>
              {subject === 'math' ? 'Mathematics' : 'Science'}
            </Text>
            {'\n'}focused on{' '}
            {topics.map(t => topicList.find(x => x.id === t)?.label).join(', ')}.
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => navigation.replace('Auth')}
          >
            <Text style={styles.startBtnText}>Start Learning 🚀</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Bot bubble */}
        <View style={styles.botRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🌸</Text>
          </View>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{STEPS[step].bubbleText}</Text>
          </View>
        </View>

        {/* Step content */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Step 0 — Subject */}
          {step === 0 && (
            <View style={styles.stepContent}>
              {SUBJECTS.map(item => (
                <SubjectCard
                  key={item.id}
                  item={item}
                  selected={subject === item.id}
                  onPress={(id) => { setSubject(id); setTopics([]); }}
                />
              ))}
            </View>
          )}

          {/* Step 1 — Topics */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionHint}>Select all that apply</Text>
              <View style={styles.topicsGrid}>
                {topicList.map(item => (
                  <TopicChip
                    key={item.id}
                    item={item}
                    selected={topics.includes(item.id)}
                    onPress={toggleTopic}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Step 2 — Mood */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <View style={styles.moodGrid}>
                {MOODS.map(item => (
                  <MoodCard
                    key={item.id}
                    item={item}
                    selected={mood === item.id}
                    onPress={setMood}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Step 3 — Goal */}
          {step === 3 && (
            <View style={styles.stepContent}>
              {GOALS.map(item => (
                <GoalItem
                  key={item.id}
                  item={item}
                  selected={goal === item.id}
                  onPress={setGoal}
                />
              ))}
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={goNext}
          disabled={!canProceed()}
        >
          <Text style={[styles.nextBtnText, !canProceed() && styles.nextBtnTextDisabled]}>
            {step === STEPS.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8F8F8' },
  scroll:      { paddingBottom: 20 },

  progressBar: { height: 5, backgroundColor: '#EEE' },
  progressFill:{ height: '100%', backgroundColor: '#FFC107' },

  botRow:  { flexDirection: 'row', alignItems: 'flex-start', padding: 20, paddingBottom: 8, gap: 10 },
  avatar:  { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F48FB1', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22 },
  bubble:  { backgroundColor: '#FFF', borderRadius: 16, borderTopLeftRadius: 4, padding: 12, maxWidth: width - 100, borderWidth: 0.5, borderColor: '#E0E0E0' },
  bubbleText: { fontSize: 14, color: '#222', lineHeight: 21 },

  stepContent: { paddingHorizontal: 16, paddingTop: 8 },
  sectionHint: { fontSize: 12, color: '#888', marginBottom: 12 },

  // Subject cards
  subjectCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, borderWidth: 1.5,
    padding: 16, marginBottom: 12,
  },
  subjectIcon:  { fontSize: 32 },
  subjectLabel: { fontSize: 17, fontWeight: '600' },

  // Topic chips
  topicsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  topicChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FFF' },
  topicChipSelected:{ borderColor: '#FFC107', backgroundColor: '#FFF9E6' },
  topicChipIcon:    { fontSize: 16 },
  topicChipLabel:   { fontSize: 13, color: '#444', fontWeight: '500' },
  topicChipLabelSelected: { color: '#7A5800' },

  // Mood
  moodGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodCard:     { width: (width - 52) / 3, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FFF' },
  moodCardSelected: { borderColor: '#FFC107', backgroundColor: '#FFF9E6' },
  moodFace:     { fontSize: 28, marginBottom: 4 },
  moodLabel:    { fontSize: 12, color: '#555', fontWeight: '500' },
  moodLabelSelected: { color: '#7A5800' },

  // Goal
  goalItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E8E8', padding: 14, marginBottom: 10 },
  goalItemSelected: { borderColor: '#FFC107', backgroundColor: '#FFF9E6' },
  goalIcon:     { fontSize: 20, width: 28, textAlign: 'center' },
  goalLabel:    { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  goalLabelSelected: { color: '#7A5800' },
  goalCheck:    { fontSize: 16, color: '#FFC107', fontWeight: '700' },

  // Bottom
  bottomBar:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingBottom: 20, backgroundColor: '#F8F8F8', borderTopWidth: 0.5, borderTopColor: '#E0E0E0' },
  backBtn:    { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#CCC', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  backBtnText:{ fontSize: 18, color: '#444' },
  nextBtn:    { flex: 1, backgroundColor: '#FFC107', borderRadius: 10, height: 44, alignItems: 'center', justifyContent: 'center' },
  nextBtnDisabled: { backgroundColor: '#E0E0E0' },
  nextBtnText:{ fontSize: 15, fontWeight: '700', color: '#333' },
  nextBtnTextDisabled: { color: '#999' },

  // Done
  doneScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  doneEmoji:  { fontSize: 60 },
  doneTitle:  { fontSize: 24, fontWeight: '700', color: '#222' },
  doneSub:    { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  startBtn:   { marginTop: 16, backgroundColor: '#FFC107', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 28 },
  startBtnText:{ fontSize: 16, fontWeight: '700', color: '#333' },
});
