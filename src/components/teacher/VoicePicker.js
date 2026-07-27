import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
// App design system, same as the classroom this sheet opens from. Uses the Nunito
// FAMILIES rather than fontWeight — see src/constants/fonts.js on why weights render
// inconsistently across platforms.
import { S, shadow } from '../../theme/studentTheme';
import { F } from '../../screens/parent/ParentApp/constants';
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
    const g = v.gender === 'f' ? '♀ Female' : v.gender === 'm' ? '♂ Male' : 'Voice';
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
            <View style={s.loading}><ActivityIndicator color={S.indigo} /><Text style={s.loadingTxt}>Loading voices…</Text></View>
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
                    <View style={s.play}>
                      {on
                        ? <Check size={17} color={S.indigo} strokeWidth={3} />
                        : <Play size={15} color={S.muted} strokeWidth={2.4} fill={S.muted} />}
                    </View>
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
  // Scrim is S.ink, not black — the same "product goes quiet" dim the classroom's
  // completion sheet uses.
  backdrop: { flex: 1, backgroundColor: 'rgba(21,24,41,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: S.canvas, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, maxHeight: '78%', ...shadow },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: S.border, marginBottom: 14 },
  title: { fontSize: 18, fontFamily: F.black, color: S.ink, letterSpacing: -0.3 },
  sub: { fontSize: 12.5, fontFamily: F.med, color: S.muted, marginTop: 6, lineHeight: 18 },
  loading: { paddingVertical: 30, alignItems: 'center', gap: 10 },
  loadingTxt: { fontSize: 13, fontFamily: F.bold, color: S.muted },
  empty: { fontSize: 13, fontFamily: F.med, color: S.muted, lineHeight: 20, paddingVertical: 22 },
  list: { marginTop: 14, alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 15, marginBottom: 9 },
  rowOn: { borderColor: S.indigo, backgroundColor: S.indigoSoft },
  rowTitle: { fontSize: 14.5, fontFamily: F.xbold, color: S.ink },
  rowTitleOn: { color: S.indigo },
  rowSub: { fontSize: 11, fontFamily: F.semi, color: S.muted, marginTop: 2 },
  play: { width: 26, alignItems: 'center', justifyContent: 'center' },
  done: { marginTop: 14, backgroundColor: S.indigo, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  doneTxt: { color: '#fff', fontSize: 15, fontFamily: F.bold },
});
