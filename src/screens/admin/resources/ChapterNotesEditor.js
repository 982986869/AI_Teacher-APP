// src/screens/admin/resources/ChapterNotesEditor.js
// Add / edit a chapter's Revision Notes — the actual content students read. Notes = an intro
// line + titled blocks. Each block is stored as { title, html } because the student notes
// renderer reads block.html (see ResourcesScreen). The admin edits plain TEXT; we convert
// text→html on save and html→text on load. A block the admin doesn't change keeps its original
// html verbatim, so existing rich formatting is never wiped. Plain Pressable/Text action bar.
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, X, FileText } from 'lucide-react-native';
import { getAdminChapterNotes, saveAdminChapterNotes } from '../../../api/adminApi';
import { S, shadow } from '../../../theme/studentUI';
import { T } from '../../parent/ParentApp/constants';
import { apiError, firstImg, stripImg } from '../ui/format';
import ImageField from '../ui/ImageField';

const inputBase = { backgroundColor: '#fff', borderWidth: 1.5, borderColor: S.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontFamily: 'Nunito_600SemiBold', fontSize: 14.5, color: S.ink };

// html → readable plain text (for editing).
const htmlToText = (html) => String(html || '')
  .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<li[^>]*>/gi, '• ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// plain text → the card html the student renderer expects (paragraphs, single line breaks).
const textToHtml = (text) => {
  const paras = String(text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return '';
  const inner = paras.map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`).join('');
  return `<div class="card">${inner}</div>`;
};

// Compose a note block's html with an authoritative single image: drop any existing <img>,
// then inject the image inside the card (or make an image-only card). null → no image.
const withBlockImage = (cardHtml, image) => {
  const stripped = stripImg(cardHtml);
  if (!image) return stripped;
  const img = `<p style="text-align:center;margin:8px 0"><img src="${image}" style="max-width:100%;height:auto" /></p>`;
  if (/<\/div>\s*$/i.test(stripped)) return stripped.replace(/<\/div>\s*$/i, `${img}</div>`);
  return stripped ? `${stripped}${img}` : `<div class="card">${img}</div>`;
};

export default function ChapterNotesEditor({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id, name } = route.params || {};
  const [intro, setIntro] = useState('');
  const [blocks, setBlocks] = useState([]); // { title, text, origHtml, loaded }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    getAdminChapterNotes(id)
      .then((d) => {
        if (!alive) return;
        setIntro(d?.intro || '');
        setBlocks((d?.blocks || []).map((b) => {
          const raw = b.html != null ? b.html : b.content;
          const text = htmlToText(raw);
          return { title: b.title || '', text, origHtml: b.html != null ? b.html : null, loaded: text, image: firstImg(raw) };
        }));
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const setField = (i, field) => (v) => setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, [field]: v } : b)));
  const addBlock = () => setBlocks((bs) => [...bs, { title: '', text: '', origHtml: null, loaded: '', image: null }]);
  const removeBlock = (i) => setBlocks((bs) => bs.filter((_, j) => j !== i));

  const save = useCallback(async () => {
    if (saving) return;
    const out = blocks.map((b) => {
      const title = b.title.trim();
      const changed = b.text.trim() !== (b.loaded || '').trim();
      // Keep original html verbatim when untouched; otherwise rebuild from the edited text.
      const base = b.origHtml != null && !changed ? b.origHtml : textToHtml(b.text.trim());
      const html = withBlockImage(base, b.image);
      return { title, html };
    }).filter((b) => b.title || String(b.html).replace(/<[^>]*>/g, '').trim() || /<img/i.test(b.html));
    setSaving(true);
    try {
      await saveAdminChapterNotes(id, { intro: intro.trim(), blocks: out });
      navigation.goBack();
    } catch (e) { Alert.alert('Could not save notes', apiError(e)); }
    finally { setSaving(false); }
  }, [id, intro, blocks, saving, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingRight: 18, paddingBottom: 10, paddingTop: insets.top + 8 }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ padding: 4 }}>
          <ChevronLeft size={26} color={S.ink} strokeWidth={2.5} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="black" s={20} c={S.ink} numberOfLines={1}>{name || 'Chapter'}</T>
          <T w="semi" s={12.5} c={S.muted}>Revision notes · students read this</T>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={S.indigo} /></View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <T w="xbold" s={12.5} c={S.sub} style={{ marginBottom: 7 }}>Intro</T>
            <TextInput style={[inputBase, { minHeight: 54, textAlignVertical: 'top' }]} value={intro} onChangeText={setIntro} placeholder="A one-line intro for the chapter (optional)" placeholderTextColor={S.faint} multiline />

            <T w="xbold" s={12.5} c={S.sub} style={{ marginTop: 20, marginBottom: 8 }}>Notes  ·  {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}</T>

            {blocks.map((b, i) => (
              <View key={i} style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: S.hair, padding: 12, marginBottom: 12, ...shadow }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <T w="xbold" s={11.5} c={S.faint}>BLOCK {i + 1}</T>
                  <Pressable onPress={() => removeBlock(i)} hitSlop={10} style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: S.redSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <X size={15} color={S.red} strokeWidth={2.6} />
                  </Pressable>
                </View>
                <TextInput style={[inputBase, { fontFamily: 'Nunito_800ExtraBold', marginBottom: 8 }]} value={b.title} onChangeText={setField(i, 'title')} placeholder="Heading" placeholderTextColor={S.faint} />
                <TextInput style={[inputBase, { minHeight: 110, textAlignVertical: 'top' }]} value={b.text} onChangeText={setField(i, 'text')} placeholder="Write the note…  (blank line = new paragraph)" placeholderTextColor={S.faint} multiline />
                <ImageField value={b.image} onChange={setField(i, 'image')} />
              </View>
            ))}

            <Pressable onPress={addBlock} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#fff', borderWidth: 1.5, borderColor: S.border, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 14, marginTop: 2 }}>
              <Plus size={17} color={S.indigo} strokeWidth={2.6} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: S.indigo }}>Add block</Text>
            </Pressable>

            {!blocks.length && (
              <View style={{ alignItems: 'center', paddingVertical: 22, gap: 8 }}>
                <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><FileText size={24} color={S.indigo} strokeWidth={2.2} /></View>
                <T w="semi" s={12.5} c={S.muted} style={{ textAlign: 'center', maxWidth: 260, lineHeight: 18 }}>No notes yet. Add blocks — each has a heading and text — and students will see them.</T>
              </View>
            )}
          </ScrollView>

          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: S.hair, backgroundColor: S.canvas }}>
            <Pressable onPress={save} disabled={saving} style={{ minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: S.indigo, borderRadius: 16, opacity: saving ? 0.6 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Save notes</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
