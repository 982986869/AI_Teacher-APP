// src/screens/admin/books/UploadBookSheet.js
// Pick a PDF on the phone, name it, target it, upload it.
//
// The class is REQUIRED and the subject strongly encouraged, for the same reasons
// as in the web portal:
//   · class — "all classes" used to be the default rather than a decision, which
//     is how a document reached students it had nothing to do with;
//   · subject — it is not a label, it is the filter the concept matcher searches
//     within. Filed under nothing, a chapter is matched against every concept in
//     every subject, and the "practise this" hints students see go wrong.

import React, { useCallback, useEffect, useState } from 'react';
import { View, Modal, ScrollView, TextInput, Alert, ActivityIndicator, Pressable } from 'react-native';
import { FileText, X, CloudUpload, TriangleAlert, Check } from 'lucide-react-native';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';
import { S } from '../ui/kit';
import * as api from '../../../api/adminBooksApi';

const MAX_BYTES = 40 * 1024 * 1024;
const CLASSES = [6, 7, 8, 9, 10, 11, 12];

// expo-document-picker is a native module. Required lazily so the lookup happens
// when an admin actually taps "Choose PDF" — the same reason pickAndUploadImage
// does it, and it keeps the student app's graph from touching it at all.
let DocumentPicker = null;
function getPicker() {
  if (DocumentPicker) return DocumentPicker;
  try { DocumentPicker = require('expo-document-picker'); } catch (e) { DocumentPicker = null; }
  return DocumentPicker;
}

const fmtSize = (b) => (b == null ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export default function UploadBookSheet({ open, onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [klass, setKlass] = useState(null);     // null = not chosen, 'all' = every class
  const [subject, setSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [stage, setStage] = useState('');

  useEffect(() => {
    if (!open) { setFile(null); setTitle(''); setKlass(null); setSubject(null); setPct(0); setStage(''); return; }
    api.getBooksMeta().then((m) => setSubjects(m?.subjects || [])).catch(() => setSubjects([]));
  }, [open]);

  const pick = async () => {
    const Picker = getPicker();
    if (!Picker) {
      Alert.alert('Picker unavailable', 'Choosing a file needs the installed app (a dev build), not Expo Go.');
      return;
    }
    try {
      const res = await Picker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.length) return;
      const f = res.assets[0];
      if (f.size != null && f.size > MAX_BYTES) {
        Alert.alert('Too large', `That PDF is ${fmtSize(f.size)}. The limit is 40 MB — split or compress it first.`);
        return;
      }
      setFile(f);
      if (!title) setTitle(String(f.name || '').replace(/\.pdf$/i, ''));
    } catch (e) {
      Alert.alert('Could not open the file', e?.message || 'Please try again.');
    }
  };

  const send = async () => {
    if (!file) { Alert.alert('Choose a PDF first'); return; }
    if (!klass) { Alert.alert('Choose a class', '"All classes" is a choice, not a default — pick one deliberately.'); return; }

    setBusy(true); setPct(0); setStage('Uploading…');
    try {
      const out = await api.uploadBook(
        file,
        { title: title.trim() || file.name, classLevel: klass === 'all' ? null : klass, subjectId: subject },
        (p) => {
          setPct(p);
          // Once the bytes are sent the server parses the PDF and finds chapters,
          // and no further progress event arrives. Saying so beats a frozen bar.
          if (p >= 100) setStage('Reading the PDF and finding chapters…');
        },
      );
      onClose?.();
      // Hand the new book straight to generation. A PDF that has been split into
      // chapters is not yet useful to anybody — the admin's next step is always
      // "now make the content", so the upload leads there rather than dropping
      // them back on a shelf to find the book and start again.
      onDone?.(out?.duplicate ? null : { bookId: out?.bookId, title: title.trim() || file.name, chapters: out?.chapters, pages: out?.pages });
      if (out?.duplicate) {
        Alert.alert('Already uploaded', `This file is already here as "${out.book?.title}" — nothing was re-processed.`);
      }
    } catch (e) {
      Alert.alert('Upload failed', e?.response?.data?.error || e?.message || 'Please try again.');
    } finally { setBusy(false); setPct(0); setStage(''); }
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={() => !busy && onClose?.()}>
      <View style={{ flex: 1, backgroundColor: 'rgba(21,24,41,0.45)', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: S.canvas, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: '92%', paddingBottom: 26,
        }}>
          {/* head */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            padding: 18, borderBottomWidth: 1, borderBottomColor: S.hair,
          }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w="black" s={18} c={S.ink} numberOfLines={1}>Upload a book</T>
              <T w="semi" s={11.5} c={S.muted} numberOfLines={2} style={{ marginTop: 2 }}>
                PDF up to 40 MB · chapters are detected automatically · the file is not stored after extraction
              </T>
            </View>
            <PressableScale onPress={() => !busy && onClose?.()} hitSlop={10}
              accessibilityRole="button" accessibilityLabel="Close">
              <X size={22} color={S.muted} strokeWidth={2.3} />
            </PressableScale>
          </View>

          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            {/* file */}
            <PressableScale
              onPress={() => !busy && pick()}
              accessibilityRole="button"
              accessibilityLabel={file ? 'Change the chosen PDF' : 'Choose a PDF'}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16,
                borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
                borderColor: file ? S.indigo : S.border,
                backgroundColor: file ? S.indigoSoft : S.card,
              }}
            >
              <View style={{
                width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: file ? S.card : S.canvas,
              }}>
                <FileText size={22} color={file ? S.indigo : S.faint} strokeWidth={2.1} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T w="xbold" s={13.5} c={S.ink} numberOfLines={2}>
                  {file ? file.name : 'Choose a PDF'}
                </T>
                <T w="semi" s={11.5} c={S.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                  {file ? `${fmtSize(file.size)} · tap to change` : 'From your phone or Drive'}
                </T>
              </View>
            </PressableScale>

            {/* title */}
            <Field label="Title">
              <TextInput
                value={title}
                onChangeText={setTitle}
                editable={!busy}
                placeholder="Defaults to the filename"
                placeholderTextColor={S.faint}
                style={inputStyle}
              />
            </Field>

            {/* class — required */}
            <Field label="Class" hint="Required — pick one deliberately">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {CLASSES.map((c) => (
                  <Chip key={c} on={klass === c} disabled={busy} onPress={() => setKlass(c)} label={`Class ${c}`} />
                ))}
                <Chip on={klass === 'all'} disabled={busy} onPress={() => setKlass('all')} label="All classes" />
              </View>
            </Field>

            {/* subject */}
            <Field label="Subject" hint="Recommended — it decides how accurately chapters match concepts">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                {subjects.filter((s) => s.concepts > 0).map((s) => (
                  <Chip
                    key={s.id}
                    on={subject === s.id}
                    disabled={busy}
                    onPress={() => setSubject(subject === s.id ? null : s.id)}
                    label={`${s.name} · ${s.concepts}`}
                  />
                ))}
              </View>
              {!subject && (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 9 }}>
                  <TriangleAlert size={13} color={S.gold} strokeWidth={2.4} style={{ marginTop: 1 }} />
                  <T w="semi" s={11} c={S.gold} style={{ flex: 1, lineHeight: 16 }}>
                    Without a subject, chapters are matched against every concept in every subject — matching will be noticeably worse.
                  </T>
                </View>
              )}
            </Field>
          </ScrollView>

          {/* action */}
          <View style={{ paddingHorizontal: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: S.hair }}>
            {busy && (
              <View style={{ marginBottom: 10 }}>
                <View style={{ height: 5, borderRadius: 99, backgroundColor: S.hair, overflow: 'hidden' }}>
                  <View style={{ width: `${pct}%`, height: '100%', borderRadius: 99, backgroundColor: S.indigo }} />
                </View>
                <T w="semi" s={11.5} c={S.muted} style={{ marginTop: 6, textAlign: 'center' }}>{stage}</T>
              </View>
            )}
            <PressableScale
              onPress={send}
              disabled={busy || !file || !klass}
              accessibilityRole="button"
              accessibilityLabel="Upload this book"
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                paddingVertical: 15, borderRadius: 15,
                backgroundColor: (!file || !klass) ? S.border : S.indigo,
                opacity: busy ? 0.65 : 1,
              }}
            >
              {busy ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <CloudUpload size={18} color={(!file || !klass) ? S.faint : '#FFFFFF'} strokeWidth={2.3} />}
              <T w="xbold" s={14.5} c={(!file || !klass) ? S.faint : '#FFFFFF'}>
                {busy ? 'Uploading…' : 'Upload'}
              </T>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, hint, children }) {
  return (
    <View style={{ marginTop: 18 }}>
      <T w="xbold" s={11} c={S.muted} style={{ letterSpacing: 0.5, marginBottom: 7 }}>
        {String(label).toUpperCase()}
      </T>
      {children}
      {!!hint && <T w="semi" s={10.5} c={S.faint} style={{ marginTop: 6 }}>{hint}</T>}
    </View>
  );
}

function Chip({ on, onPress, disabled, label }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 13, paddingVertical: 9, borderRadius: 11,
        borderWidth: 1,
        borderColor: on ? S.indigo : S.border,
        backgroundColor: on ? S.indigo : S.card,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {on && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
      <T w="bold" s={12.5} c={on ? '#FFFFFF' : S.sub}>{label}</T>
    </Pressable>
  );
}

const inputStyle = {
  borderWidth: 1, borderColor: S.border, backgroundColor: S.card,
  borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12,
  fontSize: 14, color: S.ink,
};
