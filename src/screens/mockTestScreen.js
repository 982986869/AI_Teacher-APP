// MockTestScreen.js
// "Pick a subject, then a mock quiz to begin."
// Two views in one component:
//   1) Subject list  -> each subject shows "10 mock tests"
//   2) Mock list     -> the 10 mock test cards for the chosen subject
//
// UI only for now. Each mock's questions are meant to come from your server/API.
// Wire that in onStartMock (load questions there) when ready.
//
// Props:
//   onBack()                         -> close this screen
//   onStartMock({ subject, mockNo }) -> open the test runner for that mock
//   subjects (optional)              -> [{ key, name, emoji, color, mockCount }]

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Modal } from 'react-native';

const DEFAULT_SUBJECTS = [
  { key: 'physics',   name: 'Physics',   emoji: '\u269B\uFE0F', color: '#EEF0FF', mockCount: 10 },
  { key: 'chemistry', name: 'Chemistry', emoji: '\u{1F9EA}',     color: '#E9F8F0', mockCount: 10 },
  { key: 'maths',     name: 'Maths',     emoji: '\u{1F4D0}',     color: '#FFF3E6', mockCount: 10 },
  { key: 'biology',   name: 'Biology',   emoji: '\u{1F9EC}',     color: '#FDEAF1', mockCount: 10 },
];

export default function MockTestScreen({ onBack, onStartMock, subjects = DEFAULT_SUBJECTS }) {
  const [selected, setSelected] = useState(null); // chosen subject (object)
  const [pickedMock, setPickedMock] = useState(null); // chosen mock number -> show instructions
  const [confirmOpen, setConfirmOpen] = useState(false); // start-test confirmation modal

  const Header = ({ title, subtitle }) => (
    <View style={s.header}>
      <TouchableOpacity onPress={selected ? () => { setSelected(null); setPickedMock(null); } : onBack} style={s.backRow} activeOpacity={0.7}>
        <Text style={s.backArrow}>{'\u2190'}</Text>
        <Text style={s.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>
    </View>
  );

  if (!selected) {
    return (
      <View style={s.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Header title="Mock Test" subtitle="Pick a subject, then a mock quiz to begin" />
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {subjects.map((subj) => (
            <TouchableOpacity key={subj.key} style={s.subjectCard} activeOpacity={0.8} onPress={() => setSelected(subj)}>
              <View style={[s.subjectIcon, { backgroundColor: subj.color }]}>
                <Text style={s.subjectEmoji}>{subj.emoji}</Text>
              </View>
              <View style={s.subjectMeta}>
                <Text style={s.subjectName}>{subj.name}</Text>
                <Text style={s.subjectSub}>{subj.mockCount} mock tests</Text>
              </View>
              <Text style={s.chevron}>{'\u203A'}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  }

  // ---- instructions view (shown after picking a mock, before questions) ----
  if (selected && pickedMock != null) {
    const RULES = [
      'The Question Paper contains three sections.',
      'Section A has 25 questions. Attempt any 20 questions.',
      'Section B has 24 questions. Attempt any 20 questions.',
      'Section C has 6 questions. Attempt any 5 questions.',
      'All questions carry equal marks.',
      'There is no negative marking.',
    ];
    return (
      <View style={s.screen}>
        <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />
        <View style={s.instrHeader}>
          <TouchableOpacity onPress={() => { setPickedMock(null); setConfirmOpen(false); }} style={s.closeBtn} activeOpacity={0.7}>
            <Text style={s.closeTxt}>{'\u2715'}</Text>
          </TouchableOpacity>
          <Text style={s.instrHeaderTitle}>{`Mock Test - ${String(pickedMock).padStart(2, '0')}`}</Text>
        </View>
        <ScrollView contentContainerStyle={s.instrBody} showsVerticalScrollIndicator={false}>
          <View style={s.instrCard}>
            {RULES.map((r, i) => (
              <View key={i} style={s.ruleRow}>
                <Text style={s.ruleNum}>{i + 1}.</Text>
                <Text style={s.ruleTxt}>{r}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={s.startBar}>
          <TouchableOpacity
            style={s.startTestBtn}
            activeOpacity={0.85}
            onPress={() => setConfirmOpen(true)}
          >
            <Text style={s.startTestTxt}>Start Test</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <View style={s.modalIcon}><Text style={s.modalIconTxt}>{'\u25B6'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalTitle}>Start Test</Text>
                  <Text style={s.modalSub}>Read before you begin</Text>
                </View>
                <TouchableOpacity onPress={() => setConfirmOpen(false)} style={s.modalClose} activeOpacity={0.7}>
                  <Text style={s.modalCloseTxt}>{'\u2715'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.modalLead}>You will get only one attempt. Make sure you:</Text>
              {['Have a stable internet connection','Have enough time to complete the test','Avoid refreshing or leaving the page'].map((t, i) => (
                <View key={i} style={s.modalBulletRow}>
                  <Text style={s.modalBulletDot}>{'\u2022'}</Text>
                  <Text style={s.modalBulletTxt}>{t}</Text>
                </View>
              ))}
              <Text style={s.modalReady}>Ready to start?</Text>
              <View style={s.modalActions}>
                <TouchableOpacity onPress={() => setConfirmOpen(false)} style={s.modalCancel} activeOpacity={0.7}>
                  <Text style={s.modalCancelTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setConfirmOpen(false); onStartMock && onStartMock({ subject: selected.key, mockNo: pickedMock }); }}
                  style={s.modalStart}
                  activeOpacity={0.85}
                >
                  <Text style={s.modalStartTxt}>Start Test</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  const mocks = Array.from({ length: selected.mockCount }, (_, i) => i + 1);
  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header title={selected.name} subtitle={`${selected.mockCount} mock tests \u00B7 tap one to begin`} />
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {mocks.map((n) => (
          <TouchableOpacity key={n} style={s.mockCard} activeOpacity={0.8}
            onPress={() => setPickedMock(n)}>
            <View style={s.mockIcon}><Text style={s.mockIconTxt}>{'\u{1F4DD}'}</Text></View>
            <View style={s.mockMeta}>
              <Text style={s.mockName}>{`Mock Test - ${String(n).padStart(2, '0')}`}</Text>
              <Text style={s.mockSub}>Tap to start test</Text>
            </View>
            <Text style={s.chevron}>{'\u203A'}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F6FA' },
  header: { backgroundColor: '#FFFFFF', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backArrow: { fontSize: 20, color: '#1A1A1A', marginRight: 8, fontWeight: '600' },
  backText: { fontSize: 17, color: '#1A1A1A', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 14, color: '#8A8A8E', marginTop: 4 },
  body: { padding: 16 },
  subjectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  subjectIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  subjectEmoji: { fontSize: 26 },
  subjectMeta: { flex: 1 },
  subjectName: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  subjectSub: { fontSize: 13, color: '#8A8A8E', marginTop: 2 },
  mockCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  mockIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  mockIconTxt: { fontSize: 22 },
  mockMeta: { flex: 1 },
  mockName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  mockSub: { fontSize: 13, color: '#8A8A8E', marginTop: 2 },
  chevron: { fontSize: 24, color: '#C4C4C8', fontWeight: '400', marginLeft: 8 },

  // instructions view
  instrHeader: { backgroundColor: '#1C1C1E', flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, gap: 14 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  instrHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  instrBody: { padding: 16 },
  instrCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', padding: 18 },
  ruleRow: { flexDirection: 'row', marginBottom: 12 },
  ruleNum: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', width: 22 },
  ruleTxt: { flex: 1, fontSize: 14, color: '#3A3A3C', lineHeight: 20 },
  startBar: { padding: 16, paddingBottom: 28, backgroundColor: 'transparent' },
  startTestBtn: { backgroundColor: '#1C1C1E', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  startTestTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // start-test confirmation modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 18, padding: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  modalIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  modalIconTxt: { color: '#fff', fontSize: 15 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1C1C1E' },
  modalSub: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
  modalClose: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#E8E8E8', alignItems: 'center', justifyContent: 'center' },
  modalCloseTxt: { fontSize: 13, color: '#8E8E93', fontWeight: '700' },
  modalLead: { fontSize: 14, color: '#1C1C1E', fontWeight: '600', marginBottom: 10 },
  modalBulletRow: { flexDirection: 'row', gap: 8, marginBottom: 7, paddingLeft: 4 },
  modalBulletDot: { fontSize: 14, color: '#1C1C1E', lineHeight: 20 },
  modalBulletTxt: { flex: 1, fontSize: 13, color: '#3A3A3C', lineHeight: 20 },
  modalReady: { fontSize: 14, color: '#1C1C1E', fontWeight: '600', marginTop: 8, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  modalCancel: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: 12 },
  modalCancelTxt: { fontSize: 14, fontWeight: '700', color: '#8E8E93' },
  modalStart: { backgroundColor: '#1C1C1E', paddingVertical: 11, paddingHorizontal: 22, borderRadius: 12 },
  modalStartTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});