import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Modal,
} from 'react-native';
// Icons: uses @expo/vector-icons (bundled with Expo).
// Bare RN: `npm i react-native-vector-icons` and import from 'react-native-vector-icons/Ionicons'.
import { Ionicons } from '@expo/vector-icons';

// ----- Theme -----
const COLORS = {
  purple: '#534AB7',
  purpleLight: '#EEEDFE',
  purpleText: '#534AB7',
  subtitle: '#CECBF6',
  greenBg: '#E1F5EE',
  greenText: '#0F6E56',
  greenDark: '#085041',
  redBg: '#FCEBEB',
  redText: '#A32D2D',
  redDark: '#791F1F',
  text: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textTertiary: '#9A9A9A',
  border: '#ECECEC',
  white: '#FFFFFF',
  pageBg: '#F4F5FB',
  chip: 'rgba(255,255,255,0.16)',
  // Confirm-modal pastels
  purpleMid: '#7F77DD',
  purpleDeep: '#26215C',
  purpleBorder: '#CECBF6',
  overlay: 'rgba(40,33,92,0.35)',
};

// Confirmation checklist (override via the `confirm` prop)
const DEFAULT_CONFIRM = {
  title: 'Start Test',
  subtitle: 'Read before you begin',
  lead: 'You will get only one attempt. Make sure you:',
  leadBold: 'only one attempt',
  checks: [
    'Have a stable internet connection',
    'Have enough time to complete the test',
    'Avoid refreshing or leaving the page',
  ],
  ready: 'Ready to start?',
};

// ----- Default test data (override via the `test` prop) -----
const DEFAULT_TEST = {
  brandLeft: 'Ai',
  brandRight: 'Lernova',
  badge: 'Online Test · MCQ',
  title: 'Mock Test - 01',
  subtitle: 'Mathematics · Important MCQ Practice',
  meta: [
    { icon: 'time-outline', label: '30 Min' },
    { icon: 'help-circle-outline', label: '5 Qs' },
    { icon: 'trophy-outline', label: '20 Marks' },
  ],
  marking: { correct: '+4', wrong: '−1' },
  instructions: [
    '5 MCQ questions, one correct answer each.',
    'Timer starts when you press Start Test.',
    'Save & Next to lock. Skip to revisit later.',
    'Use Question Palette to jump between questions.',
    'Finish Test anytime. Cannot reattempt after submit.',
  ],
};

const NAV_ITEMS = [
  { icon: 'home-outline', label: 'Home', active: false },
  { icon: 'calendar-outline', label: 'Sessions', active: false },
  { icon: 'disc-outline', label: 'Practice', active: true },
  { icon: 'book-outline', label: 'Resources', active: false },
  { icon: 'bar-chart-outline', label: 'Results', active: false },
  { icon: 'person-outline', label: 'Profile', active: false },
];

export default function MockTestScreen({
  test = DEFAULT_TEST,
  confirm = DEFAULT_CONFIRM,
  onBack = () => {},
  onStartTest = () => {},
}) {
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleConfirmStart = () => {
    setConfirmVisible(false);
    onStartTest();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.brand}>
          <Text style={{ color: COLORS.purple }}>{test.brandLeft}</Text>
          <Text style={{ color: '#D85A30' }}>{test.brandRight}</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Test card */}
        <View style={styles.testCard}>
          <View style={styles.badge}>
            <Ionicons name="book-outline" size={13} color={COLORS.white} />
            <Text style={styles.badgeText}>{test.badge.toUpperCase()}</Text>
          </View>
          <Text style={styles.testTitle}>{test.title}</Text>
          <Text style={styles.testSubtitle}>{test.subtitle}</Text>

          <View style={styles.metaRow}>
            {test.meta.map((m, i) => (
              <View key={i} style={styles.metaChip}>
                <Ionicons name={m.icon} size={14} color={COLORS.white} />
                <Text style={styles.metaText}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Marking scheme */}
        <View style={styles.card}>
          <SectionHeader title="Marking Scheme" />
          <View style={styles.markingRow}>
            <View style={[styles.markBox, { backgroundColor: COLORS.greenBg }]}>
              <Ionicons name="checkmark-circle" size={26} color={COLORS.greenText} />
              <View>
                <Text style={[styles.markLabel, { color: COLORS.greenText }]}>Correct</Text>
                <Text style={[styles.markValue, { color: COLORS.greenDark }]}>
                  {test.marking.correct}
                </Text>
              </View>
            </View>
            <View style={[styles.markBox, { backgroundColor: COLORS.redBg }]}>
              <Ionicons name="close-circle" size={26} color={COLORS.redText} />
              <View>
                <Text style={[styles.markLabel, { color: COLORS.redText }]}>Wrong</Text>
                <Text style={[styles.markValue, { color: COLORS.redDark }]}>
                  {test.marking.wrong}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.card}>
          <SectionHeader title="Instructions" />
          {test.instructions.map((line, i) => (
            <View key={i} style={styles.instrRow}>
              <View style={styles.instrNum}>
                <Text style={styles.instrNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.instrText}>{line}</Text>
            </View>
          ))}
        </View>

        {/* Start button */}
        <Pressable
          onPress={() => setConfirmVisible(true)}
          style={({ pressed }) => [
            styles.startBtn,
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
          ]}
        >
          <Ionicons name="rocket-outline" size={18} color={COLORS.white} />
          <Text style={styles.startText}>Start Test</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom nav (replace with your tab navigator if you use React Navigation) */}
      <View style={styles.bottomNav}>
        {NAV_ITEMS.map((n, i) => (
          <View key={i} style={styles.navItem}>
            <Ionicons
              name={n.icon}
              size={20}
              color={n.active ? COLORS.purple : COLORS.textTertiary}
            />
            <Text
              style={[
                styles.navLabel,
                { color: n.active ? COLORS.purple : COLORS.textTertiary },
              ]}
            >
              {n.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Start-test confirmation popup */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setConfirmVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="play" size={20} color={COLORS.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{confirm.title}</Text>
                <Text style={styles.modalSubtitle}>{confirm.subtitle}</Text>
              </View>
              <Pressable
                style={styles.modalClose}
                hitSlop={8}
                onPress={() => setConfirmVisible(false)}
              >
                <Ionicons name="close" size={16} color={COLORS.purple} />
              </Pressable>
            </View>

            <Text style={styles.modalLead}>
              {confirm.lead.split(confirm.leadBold).map((part, i, arr) => (
                <Text key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <Text style={styles.modalLeadBold}>{confirm.leadBold}</Text>
                  )}
                </Text>
              ))}
            </Text>

            <View style={styles.checkList}>
              {confirm.checks.map((c, i) => (
                <View key={i} style={styles.checkRow}>
                  <Ionicons name="checkmark-circle" size={17} color={COLORS.purpleMid} />
                  <Text style={styles.checkText}>{c}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.modalReady}>{confirm.ready}</Text>

            <View style={styles.modalActions}>
              <Pressable hitSlop={6} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmStart}
                style={({ pressed }) => [
                  styles.confirmBtn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.confirmText}>Start Test</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.pageBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 2 },
  brand: { fontSize: 18, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },

  testCard: {
    backgroundColor: COLORS.purple,
    borderRadius: 16,
    padding: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.chip,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  testTitle: { color: COLORS.white, fontSize: 23, fontWeight: '700', marginTop: 12 },
  testSubtitle: { color: COLORS.subtitle, fontSize: 13, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  metaChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.chip,
    paddingVertical: 8,
    borderRadius: 20,
  },
  metaText: { color: COLORS.white, fontSize: 12.5, fontWeight: '500' },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 14,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionBar: { width: 4, height: 16, borderRadius: 2, backgroundColor: COLORS.purple },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  markingRow: { flexDirection: 'row', gap: 10 },
  markBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    padding: 12,
  },
  markLabel: { fontSize: 12 },
  markValue: { fontSize: 18, fontWeight: '700' },

  instrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  instrNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instrNumText: { color: COLORS.purpleText, fontSize: 12, fontWeight: '600' },
  instrText: { flex: 1, fontSize: 14, lineHeight: 21, color: COLORS.textSecondary },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.purple,
    borderRadius: 28,
    paddingVertical: 16,
    marginTop: 18,
  },
  startText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  navItem: { alignItems: 'center', gap: 2, flex: 1 },
  navLabel: { fontSize: 10 },

  // ----- Confirm modal -----
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.purpleDeep },
  modalSubtitle: { fontSize: 13, color: COLORS.purpleMid, marginTop: 1 },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLead: { fontSize: 13.5, color: '#444441', marginTop: 16, lineHeight: 20 },
  modalLeadBold: { fontWeight: '700', color: COLORS.purpleDeep },
  checkList: { marginTop: 12, gap: 9 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  checkText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  modalReady: { fontSize: 13.5, fontWeight: '700', color: COLORS.purpleDeep, marginTop: 14 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  cancelText: { fontSize: 14, color: COLORS.textSecondary, paddingHorizontal: 14, paddingVertical: 9 },
  confirmBtn: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  confirmText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});