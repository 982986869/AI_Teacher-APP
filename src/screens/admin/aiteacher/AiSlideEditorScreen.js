// src/screens/admin/aiteacher/AiSlideEditorScreen.js
// AI Teacher catalog — edit ONE slide. Content the student player renders: title, explanation,
// narration (what the teacher voice says), an optional visual (type + JSON data), and a voice
// cue. visualType NONE + visualData {} is a valid text-only slide. Saved via
// PATCH /api/admin/ai-teacher/catalog/slides/:slideId. The slide is loaded from its lesson
// (no separate GET), keeping the backend surface small.
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FONT } from '../../../constants/fonts';
import { getAiLesson, updateAiSlide } from '../../../api/adminApi';
import { TK, ScreenHeader } from '../../../components/testCardKit';
import { apiError } from '../ui/format';

const VISUAL_TYPES = ['NONE', 'DIAGRAM', 'CHART', 'EXAMPLE', 'ANALOGY', 'FORMULA'];
const label = (t, extra) => <Text style={{ color: TK.textMuted, fontFamily: FONT.bold, fontSize: 11, letterSpacing: 0.3, marginBottom: 6 }}>{t}{extra ? <Text style={{ fontFamily: FONT.semibold }}>  ·  {extra}</Text> : null}</Text>;
const inputStyle = { backgroundColor: TK.card, borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontFamily: FONT.semibold, fontSize: 14.5, color: TK.text };
const codeStyle = { backgroundColor: TK.card, borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12.5, color: TK.text, minHeight: 90, textAlignVertical: 'top' };

export default function AiSlideEditorScreen({ route, navigation }) {
  const { slideId, lessonId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ slideTitle: '', explanation: '', narrationText: '', visualType: 'NONE', voiceCue: '' });
  const [visualDataText, setVisualDataText] = useState('{}');
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const load = useCallback(async () => {
    try {
      const d = await getAiLesson(lessonId);
      const s = (d?.slides || []).find((x) => String(x.id) === String(slideId));
      if (!s) { setError('Slide not found'); return; }
      setF({ slideTitle: s.slideTitle || '', explanation: s.explanation || '', narrationText: s.narrationText || '', visualType: s.visualType || 'NONE', voiceCue: s.voiceCue || '' });
      setVisualDataText(JSON.stringify(s.visualData ?? {}, null, 2));
      setError('');
    } catch (e) { setError(apiError(e)); }
    finally { setLoading(false); }
  }, [lessonId, slideId]);
  // Load once (don't reload on every focus — would discard in-progress edits).
  useFocusEffect(useCallback(() => { let first = true; if (first) load(); return () => { first = false; }; }, [load]));

  const save = async () => {
    if (saving) return;
    let visualData;
    try { visualData = visualDataText.trim() ? JSON.parse(visualDataText) : {}; }
    catch { Alert.alert('Invalid visual data', 'The visual data must be valid JSON (e.g. {} for a text-only slide).'); return; }
    if (visualData == null || typeof visualData !== 'object' || Array.isArray(visualData)) { Alert.alert('Invalid visual data', 'Visual data must be a JSON object, like {}.'); return; }
    setSaving(true);
    try {
      await updateAiSlide(slideId, { slideTitle: f.slideTitle, explanation: f.explanation, narrationText: f.narrationText, visualType: f.visualType, voiceCue: f.voiceCue, visualData });
      navigation.goBack();
    } catch (e) { Alert.alert('Could not save', apiError(e)); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
      <ScreenHeader title="Edit slide" subtitle={f.slideTitle || 'Slide'} onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={TK.mint} /></View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{error}</Text>
          <Pressable onPress={load} style={{ borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}><Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 13 }}>Retry</Text></Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {label('SLIDE TITLE')}
            <TextInput style={[inputStyle, { marginBottom: 14 }]} value={f.slideTitle} onChangeText={set('slideTitle')} placeholder="e.g. What is acceleration?" placeholderTextColor={TK.textMuted} />

            {label('EXPLANATION', 'shown on the board')}
            <TextInput style={[inputStyle, { minHeight: 90, textAlignVertical: 'top', marginBottom: 14 }]} value={f.explanation} onChangeText={set('explanation')} placeholder="The concept in the student's words…" placeholderTextColor={TK.textMuted} multiline />

            {label('NARRATION', 'what the teacher says aloud')}
            <TextInput style={[inputStyle, { minHeight: 90, textAlignVertical: 'top', marginBottom: 14 }]} value={f.narrationText} onChangeText={set('narrationText')} placeholder="Spoken narration for this slide…" placeholderTextColor={TK.textMuted} multiline />

            {label('VISUAL')}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {VISUAL_TYPES.map((v) => { const on = f.visualType === v; return (
                <Pressable key={v} onPress={() => set('visualType')(v)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: on ? TK.mint : TK.border, backgroundColor: on ? TK.mint : TK.card }}>
                  <Text style={{ color: on ? '#fff' : TK.textMuted, fontFamily: FONT.extrabold, fontSize: 12 }}>{v === 'NONE' ? 'Text only' : v}</Text>
                </Pressable>
              ); })}
            </View>

            {f.visualType !== 'NONE' && (
              <>
                {label('VISUAL DATA', 'JSON for the ' + f.visualType.toLowerCase())}
                <TextInput style={[codeStyle, { marginBottom: 14 }]} value={visualDataText} onChangeText={setVisualDataText} placeholder='{ }' placeholderTextColor={TK.textMuted} multiline autoCapitalize="none" autoCorrect={false} />
              </>
            )}

            {label('VOICE CUE', 'optional')}
            <TextInput style={inputStyle} value={f.voiceCue} onChangeText={set('voiceCue')} placeholder="e.g. pause, then emphasise" placeholderTextColor={TK.textMuted} />
          </ScrollView>

          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, borderTopWidth: 1, borderTopColor: TK.border, backgroundColor: TK.bg }}>
            <Pressable onPress={save} disabled={saving} style={{ minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: TK.mint, borderRadius: 16, opacity: saving ? 0.6 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontFamily: FONT.extrabold, fontSize: 15 }}>Save slide</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
