// src/screens/admin/resources/PaperEditorScreen.js
// Create / edit a Previous-Year Paper. A paper is metadata + two HTML bodies
// (question_paper_html, answer_key_html) that students render in a MathJax WebView
// ({tex}…{/tex} → \(…\)) — NOT a PDF upload. Admin edits the raw HTML source and sees a
// live "what students see" preview via MathHtmlPreview (same renderer as the student paper view).
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, EyeOff, ImagePlus } from 'lucide-react-native';
import { getAdminPaper, createAdminPaper, updateAdminPaper } from '../../../api/adminApi';
import { S } from '../../../theme/studentUI';
import { T } from '../../parent/ParentApp/constants';
import { apiError } from '../ui/format';
import { pickAndUploadImage } from '../ui/pickAndUploadImage';
import MathHtmlPreview from './MathHtmlPreview';

const inputBase = { backgroundColor: '#fff', borderWidth: 1.5, borderColor: S.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontFamily: 'Nunito_600SemiBold', fontSize: 14.5, color: S.ink };
const htmlInput = { backgroundColor: '#fff', borderWidth: 1.5, borderColor: S.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12.5, color: S.ink, minHeight: 130, textAlignVertical: 'top' };

function Field({ label, value, onChangeText, placeholder, keyboardType, hint }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <T w="bold" s={11} c={S.muted} style={{ marginBottom: 5 }}>{label}</T>
      <TextInput style={inputBase} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={S.faint} keyboardType={keyboardType} />
      {!!hint && <T w="semi" s={10.5} c={S.faint} style={{ marginTop: 4 }}>{hint}</T>}
    </View>
  );
}

// A raw-HTML body with a collapsible rendered preview (what students will see) and an
// "Add image" button that uploads a picture and inserts an <img> tag into the HTML.
function HtmlBody({ label, value, onChangeText, previewOpen, onTogglePreview }) {
  const [uploading, setUploading] = useState(false);
  const insertImage = async () => {
    if (uploading) return;
    try {
      setUploading(true);
      const url = await pickAndUploadImage();
      if (!url) return;
      const tag = `<p style="text-align:center;margin:8px 0"><img src="${url}" style="max-width:100%;height:auto" /></p>`;
      const base = String(value || '').trim();
      onChangeText(base ? `${base}\n${tag}` : tag);
    } catch (e) {
      Alert.alert('Could not upload image', apiError(e));
    } finally {
      setUploading(false);
    }
  };
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <T w="bold" s={11} c={S.muted}>{label}</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={insertImage} disabled={uploading} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 28, paddingHorizontal: 10, borderRadius: 9, backgroundColor: S.indigoSoft, opacity: uploading ? 0.6 : 1 }}>
            {uploading ? <ActivityIndicator size="small" color={S.indigo} /> : <ImagePlus size={13} color={S.indigo} strokeWidth={2.6} />}
            <Text style={{ fontSize: 11.5, fontWeight: '800', color: S.indigo }}>{uploading ? 'Uploading…' : 'Add image'}</Text>
          </Pressable>
          <Pressable onPress={onTogglePreview} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 28, paddingHorizontal: 10, borderRadius: 9, backgroundColor: previewOpen ? S.indigo : S.indigoSoft }}>
            {previewOpen ? <EyeOff size={13} color="#fff" strokeWidth={2.6} /> : <Eye size={13} color={S.indigo} strokeWidth={2.6} />}
            <Text style={{ fontSize: 11.5, fontWeight: '800', color: previewOpen ? '#fff' : S.indigo }}>{previewOpen ? 'Hide' : 'Preview'}</Text>
          </Pressable>
        </View>
      </View>
      <TextInput style={htmlInput} value={value} onChangeText={onChangeText} placeholder="<div>…</div>  ({tex}…{/tex} for math)" placeholderTextColor={S.faint} multiline autoCapitalize="none" autoCorrect={false} />
      {previewOpen && (
        <View style={{ marginTop: 8, backgroundColor: '#F4F4F5', borderRadius: 12, borderWidth: 1, borderColor: S.hair, padding: 10 }}>
          <T w="xbold" s={10.5} c={S.indigo} style={{ marginBottom: 6, letterSpacing: 0.4 }}>WHAT STUDENTS SEE</T>
          {value.trim() ? <MathHtmlPreview html={value} /> : <T w="semi" s={12} c={S.faint}>Nothing yet.</T>}
        </View>
      )}
    </View>
  );
}

export default function PaperEditorScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { slug, classLevel, extUid, subjectName } = route.params || {};
  const isEdit = !!extUid;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ paperTitle: '', year: '', code: '', setLabel: '', name: '', region: '', questionPaperHtml: '', answerKeyHtml: '' });
  const [prevQ, setPrevQ] = useState(false);
  const [prevA, setPrevA] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    getAdminPaper(slug, extUid)
      .then((d) => {
        if (!alive || !d?.paper) return;
        const p = d.paper;
        setF({
          paperTitle: p.paperTitle || '', year: p.year != null ? String(p.year) : '', code: p.code || '',
          setLabel: p.setLabel || '', name: p.name || '', region: p.region || '',
          questionPaperHtml: p.questionPaperHtml || '', answerKeyHtml: p.answerKeyHtml || '',
        });
      })
      .catch((e) => Alert.alert('Could not load', apiError(e)))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug, extUid, isEdit]);

  const save = useCallback(async () => {
    if (saving) return;
    if (!f.paperTitle.trim() && !f.name.trim()) { Alert.alert('Add a title', 'Give the paper a title or name.'); return; }
    setSaving(true);
    try {
      const body = { ...f, classLevel };
      if (isEdit) await updateAdminPaper(slug, extUid, body);
      else await createAdminPaper(slug, body);
      navigation.goBack();
    } catch (e) { Alert.alert('Could not save', apiError(e)); }
    finally { setSaving(false); }
  }, [saving, f, classLevel, isEdit, slug, extUid, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingRight: 18, paddingBottom: 10, paddingTop: insets.top + 8 }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ padding: 4 }}>
          <ChevronLeft size={26} color={S.ink} strokeWidth={2.5} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="black" s={20} c={S.ink} numberOfLines={1}>{isEdit ? 'Edit paper' : 'New paper'}</T>
          <T w="semi" s={12.5} c={S.muted} numberOfLines={1}>{subjectName ? `${subjectName} · ` : ''}{classLevel != null ? `Class ${classLevel}` : ''} · students read this</T>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={S.indigo} /></View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <T w="xbold" s={12.5} c={S.sub} style={{ marginTop: 2, marginBottom: 10 }}>Details</T>
            <Field label="PAPER TITLE" value={f.paperTitle} onChangeText={set('paperTitle')} placeholder="e.g. Physics (Theory) 2019" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Field label="YEAR" value={f.year} onChangeText={set('year')} placeholder="2019" keyboardType="number-pad" /></View>
              <View style={{ flex: 1 }}><Field label="SET" value={f.setLabel} onChangeText={set('setLabel')} placeholder="1" /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Field label="CODE" value={f.code} onChangeText={set('code')} placeholder="55/1/1" /></View>
              <View style={{ flex: 1 }}><Field label="REGION" value={f.region} onChangeText={set('region')} placeholder="Delhi" /></View>
            </View>
            <Field label="NAME" value={f.name} onChangeText={set('name')} placeholder="Internal name (optional)" hint="Shown if no title is set." />

            <T w="xbold" s={12.5} c={S.sub} style={{ marginTop: 8, marginBottom: 10 }}>Content · HTML</T>
            <HtmlBody label="QUESTION PAPER" value={f.questionPaperHtml} onChangeText={set('questionPaperHtml')} previewOpen={prevQ} onTogglePreview={() => setPrevQ((v) => !v)} />
            <HtmlBody label="ANSWER KEY" value={f.answerKeyHtml} onChangeText={set('answerKeyHtml')} previewOpen={prevA} onTogglePreview={() => setPrevA((v) => !v)} />
          </ScrollView>

          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: S.hair, backgroundColor: S.canvas }}>
            <Pressable onPress={save} disabled={saving} style={{ minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: S.indigo, borderRadius: 16, opacity: saving ? 0.6 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{isEdit ? 'Save changes' : 'Add paper'}</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
