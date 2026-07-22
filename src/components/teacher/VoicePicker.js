import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { C } from './premiumTheme';
import { Check, Play } from 'lucide-react-native';
import { listEnglishVoices, previewVoice, setPreferredVoice, getSelectedVoiceId, stopTeacher } from '../../utils/teacherVoice';

// Let the student pick the teacher's voice by ear — the reliable way to get a
// female voice when the device doesn't tag voice gender (common on Android).
export default function VoicePicker({ visible, onClose }) {
  const [voices, setVoices] = useState(null);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setPicked(getSelectedVoiceId());
    let alive = true;
    listEnglishVoices().then((list) => { if (alive) setVoices(list); });
    return () => { alive = false; stopTeacher(); };
  }, [visible]);

  const choose = (v) => {
    setPicked(v.identifier);
    setPreferredVoice(v.identifier);
    previewVoice(v.identifier);
  };

  const label = (v) => {
    const g = v.gender === 'f' ? 'Female' : v.gender === 'm' ? 'Male' : 'Voice';
    const lang = String(v.language || '').toUpperCase();
    const enh = String(v.quality) === 'Enhanced' ? ' · HD' : '';
    return `${g} · ${lang}${enh}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Choose the teacher’s voice</Text>
          <Text style={s.sub}>Tap a voice to hear a sample. Pick the one that sounds right — it’s saved automatically.</Text>

          {voices === null ? (
            <View style={s.loading}><ActivityIndicator color={C.accent} /><Text style={s.loadingTxt}>Loading voices…</Text></View>
          ) : voices.length === 0 ? (
            <Text style={s.empty}>No extra voices found on this device. Install a female voice in your phone’s Text-to-Speech settings, then reopen.</Text>
          ) : (
            <ScrollView style={s.list} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
              {voices.map((v) => {
                const on = picked === v.identifier;
                return (
                  <TouchableOpacity key={v.identifier} style={[s.row, on && s.rowOn]} activeOpacity={0.85} onPress={() => choose(v)}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.rowTitle, on && s.rowTitleOn]} numberOfLines={1}>{label(v)}</Text>
                      <Text style={s.rowSub} numberOfLines={1}>{v.name}</Text>
                    </View>
                    {on
                      ? <Check size={18} color={C.accent} strokeWidth={2.6} />
                      : <Play size={16} color={C.dim} strokeWidth={2.4} fill={C.dim} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <TouchableOpacity style={s.done} activeOpacity={0.9} onPress={() => { stopTeacher(); onClose && onClose(); }}>
            <Text style={s.doneTxt}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.cream2, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, maxHeight: '78%', borderWidth: 1, borderColor: C.line },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },
  sub: { fontSize: 12.5, fontWeight: '600', color: C.dim, marginTop: 6, lineHeight: 18 },
  loading: { paddingVertical: 30, alignItems: 'center', gap: 10 },
  loadingTxt: { fontSize: 13, fontWeight: '700', color: C.dim },
  empty: { fontSize: 13, fontWeight: '600', color: C.dim, lineHeight: 20, paddingVertical: 22 },
  list: { marginTop: 14, alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 15, marginBottom: 9 },
  rowOn: { borderColor: C.accent, backgroundColor: C.accentSoft },
  rowTitle: { fontSize: 14.5, fontWeight: '800', color: C.ink },
  rowTitleOn: { color: C.accent },
  rowSub: { fontSize: 11, fontWeight: '600', color: C.faint, marginTop: 2 },
  play: { fontSize: 16, fontWeight: '900', color: C.dim, width: 26, textAlign: 'center' },
  playOn: { color: C.accent },
  done: { marginTop: 14, backgroundColor: C.accent, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  doneTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
