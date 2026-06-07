import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const SuccessScreen = ({ navigation }) => {
  const { user } = useAuth();

  const handleNext = () => {
    navigation.navigate('OnboardingScreen');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.topBar}>
        <View style={styles.progressBarBg}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.emojiBubble}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emojiText}>🎉</Text>
          </View>
          <View style={styles.bubbleCloud}>
            <Text style={styles.bubbleText}>
              {user?.name
                ? `Amazing, ${user.name}! You're all set to start your learning journey!`
                : "Amazing! You're all set to start your learning journey!"}
            </Text>
          </View>
        </View>

        <Text style={styles.question}>You're all set!</Text>

        <View style={styles.cardsWrap}>
          {[
            { icon: '📚', label: 'Pick your first subject',       sub: 'Choose from 10+ subjects' },
            { icon: '⏱',  label: 'Set your daily goal',           sub: 'Just 15 minutes a day' },
            { icon: '🏆', label: 'Track progress & earn streaks', sub: 'Stay motivated every day' },
            { icon: '🔔', label: 'Get daily reminders',           sub: 'Never miss a session' },
          ].map((item, i) => (
            <View key={i} style={[styles.card, i < 3 && styles.cardBorder]}>
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{item.label}</Text>
                <Text style={styles.cardSub}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>Account setup complete</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#fff' },
  topBar:          { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  progressBarBg:   { height: 5, backgroundColor: '#e8e8e8', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 5, backgroundColor: '#0a0a0a', borderRadius: 3, width: '100%' },
  scroll:          { paddingHorizontal: 22, paddingTop: 16 },
  emojiBubble:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  emojiCircle:     { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e0e0e0' },
  emojiText:       { fontSize: 26 },
  bubbleCloud:     { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 14, borderTopLeftRadius: 2, padding: 12 },
  bubbleText:      { fontSize: 13, color: '#555', lineHeight: 19 },
  question:        { fontSize: 22, fontWeight: '700', color: '#0a0a0a', marginBottom: 24, lineHeight: 30 },
  cardsWrap:       { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 16, overflow: 'hidden' },
  card:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, gap: 14, backgroundColor: '#fff' },
  cardBorder:      { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cardIcon:        { fontSize: 24, width: 32, textAlign: 'center' },
  cardLabel:       { fontSize: 14, fontWeight: '600', color: '#0a0a0a', marginBottom: 2 },
  cardSub:         { fontSize: 12, color: '#999' },
  bottom:          { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 22, paddingBottom: 36, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e8e8e8' },
  nextBtn:         { backgroundColor: '#0a0a0a', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  nextText:        { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  counter:         { fontSize: 12, color: '#aaa', textAlign: 'center' },
});

export default SuccessScreen;