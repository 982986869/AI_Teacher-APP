import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, StatusBar, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

// "You're all set!" completion screen.
// "Next" calls onComplete(), which (via BrainGymScreen -> onFinish) advances
// to the Onboarding screen.
const ITEMS = [
  { icon: '📚', title: 'Pick your first subject',        desc: 'Choose from 10+ subjects' },
  { icon: '⏱',  title: 'Set your daily goal',            desc: 'Just 15 minutes a day' },
  { icon: '🏆', title: 'Track progress & earn streaks',  desc: 'Stay motivated every day' },
  { icon: '🔔', title: 'Get daily reminders',            desc: 'Never miss a session' },
];

const BrainGymOnboarding = ({ onComplete }) => {
  const { user } = useAuth();
  const name = user?.name || 'User';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Emoji + bubble */}
        <View style={styles.emojiBubble}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emojiText}>🎉</Text>
          </View>
          <View style={styles.bubbleCloud}>
            <Text style={styles.bubbleText}>
              Amazing, {name}! You're all set to start your learning journey!
            </Text>
          </View>
        </View>

        <Text style={styles.title}>You're all set!</Text>

        {/* Grouped list card */}
        <View style={styles.card}>
          {ITEMS.map((it, i) => (
            <View
              key={it.title}
              style={[styles.row, i < ITEMS.length - 1 && styles.rowDivider]}
            >
              <Text style={styles.rowIcon}>{it.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{it.title}</Text>
                <Text style={styles.rowDesc}>{it.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => onComplete?.()}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>Account setup complete</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#fff' },
  scroll:      { paddingHorizontal: 22, paddingTop: 24 },

  emojiBubble: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  emojiCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e0e0e0' },
  emojiText:   { fontSize: 26 },
  bubbleCloud: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 14, borderTopLeftRadius: 2, padding: 12 },
  bubbleText:  { fontSize: 13, color: '#555', lineHeight: 19 },

  title:       { fontSize: 26, fontWeight: '800', color: '#0a0a0a', marginBottom: 20 },

  card:        { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 16 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  rowDivider:  { borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowIcon:     { fontSize: 22 },
  rowTitle:    { fontSize: 15, fontWeight: '700', color: '#0a0a0a', marginBottom: 2 },
  rowDesc:     { fontSize: 12.5, color: '#888', lineHeight: 17 },

  bottom:      { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 22, paddingBottom: 36, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e8e8e8' },
  nextBtn:     { backgroundColor: '#0a0a0a', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  nextText:    { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  counter:     { fontSize: 12, color: '#aaa', textAlign: 'center' },
});

export default BrainGymOnboarding;