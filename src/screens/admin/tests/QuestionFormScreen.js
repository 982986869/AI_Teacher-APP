// src/screens/admin/tests/QuestionFormScreen.js
// Add / edit a single-choice MCQ (the type the mock engine + student runner support).
// Validates before save; blocks with a clear message if the test already has attempts.
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Check, Copy, Trash2 } from 'lucide-react-native';
import { addAdminTestQuestion, updateAdminTestQuestion, duplicateAdminTestQuestion, removeAdminTestQuestion } from '../../../api/adminApi';
import { AdminScreen, AdminHeader, GhostButton, S } from '../ui/kit';
import { apiError, firstImg, stripImg } from '../ui/format';
import ImageField from '../ui/ImageField';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';

const inputStyle = { backgroundColor: S.card, borderWidth: 1.5, borderColor: S.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: S.ink };
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const isAttemptBlock = (e) => e?.response?.status === 409 && /attempt/i.test(e?.response?.data?.error || '');

export default function QuestionFormScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { mode = 'add', testId, question = null } = route.params || {};
  const isEdit = mode === 'edit';
  const initial = useMemo(() => {
    const rawOpts = Array.isArray(question?.options) ? question.options : [];
    const opts = rawOpts.map((o) => (o && typeof o === 'object' ? String(o.text || '') : String(o || '')));
    const optImgs = rawOpts.map((o) => (o && typeof o === 'object' ? (o.image || null) : null));
    return {
      text: stripImg(question?.question || ''),
      questionImage: firstImg(question?.question || ''),
      options: opts.length ? opts : ['', '', '', ''],
      optionImages: optImgs.length ? optImgs : [null, null, null, null],
      correctIndex: question?.correctIndex != null ? question.correctIndex : 0,
      explanation: question?.explanation || '',
    };
  }, [question]);
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const setOpt = (i, v) => setForm((f) => ({ ...f, options: f.options.map((o, j) => (j === i ? v : o)) }));
  const setOptImage = (i, url) => setForm((f) => ({ ...f, optionImages: f.optionImages.map((im, j) => (j === i ? url : im)) }));
  const addOpt = () => setForm((f) => (f.options.length >= 6 ? f : { ...f, options: [...f.options, ''], optionImages: [...f.optionImages, null] }));
  const removeOpt = (i) => setForm((f) => {
    if (f.options.length <= 2) return f;
    const options = f.options.filter((_, j) => j !== i);
    const optionImages = f.optionImages.filter((_, j) => j !== i);
    let correctIndex = f.correctIndex; if (i === correctIndex) correctIndex = 0; else if (i < correctIndex) correctIndex -= 1;
    return { ...f, options, optionImages, correctIndex };
  });

  const trimmedOpts = form.options.map((o) => o.trim());
  const optFilled = (i) => !!trimmedOpts[i] || !!form.optionImages[i];   // text OR image
  const blankOpt = touched && form.options.some((_, i) => !optFilled(i));
  const dupOpt = new Set(trimmedOpts.filter(Boolean)).size !== trimmedOpts.filter(Boolean).length;
  const textError = touched && !form.text.trim() && !form.questionImage ? 'Question text or image is required.' : null;
  const valid = (form.text.trim() || form.questionImage) && form.options.filter((_, i) => optFilled(i)).length >= 2 && form.options.every((_, i) => optFilled(i));

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!dirty || savedRef.current || saving) return;
      e.preventDefault();
      Alert.alert('Discard changes?', 'Your edits will be lost.', [{ text: 'Keep editing', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) }]);
    });
    return unsub;
  }, [navigation, dirty, saving]);

  const handleErr = (e, fallbackTitle) => { if (isAttemptBlock(e)) Alert.alert('Locked', 'This test has student attempts. Duplicate the test to make an editable new version.'); else Alert.alert(fallbackTitle, apiError(e)); };

  const save = async () => {
    setTouched(true);
    if (!valid || saving) return;
    const body = {
      question: form.text.trim(),
      questionImage: form.questionImage || null,
      options: form.options.map((o, i) => ({ text: o.trim(), image: form.optionImages[i] || null })),
      correctIndex: form.correctIndex,
      explanation: form.explanation.trim(),
    };
    setSaving(true);
    try {
      if (isEdit) await updateAdminTestQuestion(testId, question.id, body); else await addAdminTestQuestion(testId, body);
      savedRef.current = true; navigation.goBack();
    } catch (e) { handleErr(e, 'Could not save'); }
    finally { setSaving(false); }
  };

  const dup = async () => { setSaving(true); try { await duplicateAdminTestQuestion(testId, question.id); savedRef.current = true; navigation.goBack(); } catch (e) { setSaving(false); handleErr(e, 'Could not duplicate'); } };
  const remove = () => Alert.alert('Remove question?', 'This removes it from the test.', [{ text: 'Cancel', style: 'cancel' }, {
    text: 'Remove', style: 'destructive', onPress: async () => { setSaving(true); try { await removeAdminTestQuestion(testId, question.id); savedRef.current = true; navigation.goBack(); } catch (e) { setSaving(false); handleErr(e, 'Could not remove'); } },
  }]);

  return (
    <AdminScreen>
      <AdminHeader title={isEdit ? 'Edit question' : 'New question'} subtitle="Single-choice MCQ" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={{ flexDirection: 'row', gap: 3, marginBottom: 7 }}><T w="xbold" s={12.5} c={S.sub}>Question</T><T w="xbold" s={12.5} c={S.red}>*</T></View>
          <TextInput style={[inputStyle, { minHeight: 84, textAlignVertical: 'top' }, textError && { borderColor: S.red }]} value={form.text} onChangeText={(v) => setForm((f) => ({ ...f, text: v }))} placeholder="Type the question…" placeholderTextColor={S.faint} multiline onBlur={() => setTouched(true)} />
          <ImageField value={form.questionImage} onChange={(url) => setForm((f) => ({ ...f, questionImage: url }))} />
          {textError ? <T w="semi" s={11.5} c={S.red} style={{ marginTop: 5 }}>{textError}</T> : null}

          <View style={{ flexDirection: 'row', gap: 3, marginTop: 18, marginBottom: 4 }}><T w="xbold" s={12.5} c={S.sub}>Options</T><T w="xbold" s={12.5} c={S.red}>*</T></View>
          <T w="med" s={11.5} c={S.faint} style={{ marginBottom: 8 }}>Tap the circle to mark the correct answer.</T>
          {form.options.map((o, i) => {
            const correct = form.correctIndex === i;
            return (
              <View key={i} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <PressableScale onPress={() => setForm((f) => ({ ...f, correctIndex: i }))} hitSlop={6} accessibilityRole="radio" accessibilityState={{ selected: correct }}
                    style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: correct ? S.emerald : S.border, backgroundColor: correct ? S.emerald : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {correct ? <Check size={15} color="#fff" strokeWidth={3} /> : <T w="bold" s={11} c={S.faint}>{LETTERS[i]}</T>}
                  </PressableScale>
                  <TextInput style={[inputStyle, { flex: 1 }]} value={o} onChangeText={(v) => setOpt(i, v)} placeholder={`Option ${LETTERS[i]}${form.optionImages[i] ? ' (or leave blank for image only)' : ''}`} placeholderTextColor={S.faint} />
                  {form.options.length > 2 && <PressableScale onPress={() => removeOpt(i)} hitSlop={6} style={{ padding: 4 }}><X size={18} color={S.faint} /></PressableScale>}
                </View>
                <View style={{ marginLeft: 34 }}>
                  <ImageField compact value={form.optionImages[i]} onChange={(url) => setOptImage(i, url)} />
                </View>
              </View>
            );
          })}
          {blankOpt ? <T w="semi" s={11.5} c={S.red}>Options cannot be blank.</T> : null}
          {dupOpt ? <T w="semi" s={11.5} c={S.orange}>Two options are identical — check them.</T> : null}
          {form.options.length < 6 && <PressableScale onPress={addOpt} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 4 }}><Plus size={15} color={S.indigo} strokeWidth={2.6} /><T w="xbold" s={12.5} c={S.indigo}>Add option</T></PressableScale>}

          <View style={{ marginTop: 18, marginBottom: 7 }}><T w="xbold" s={12.5} c={S.sub}>Explanation</T></View>
          <TextInput style={[inputStyle, { minHeight: 70, textAlignVertical: 'top' }]} value={form.explanation} onChangeText={(v) => setForm((f) => ({ ...f, explanation: v }))} placeholder="Optional — shown after submitting" placeholderTextColor={S.faint} multiline />

          {isEdit && (
            <View style={{ gap: 10, marginTop: 22 }}>
              <GhostButton label="Duplicate question" icon={Copy} onPress={dup} disabled={saving} />
              <GhostButton label="Remove question" icon={Trash2} danger onPress={remove} disabled={saving} />
            </View>
          )}
        </ScrollView>
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: S.hair, backgroundColor: S.canvas }}>
          <PressableScale onPress={save} disabled={saving || (touched && !valid)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: S.indigo, borderRadius: 16, paddingVertical: 16, opacity: saving || (touched && !valid) ? 0.6 : 1 }} accessibilityRole="button" accessibilityLabel="Save question">
            {saving ? <ActivityIndicator color="#fff" /> : <T w="bold" s={15} c="#fff">{isEdit ? 'Save question' : 'Add question'}</T>}
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </AdminScreen>
  );
}
