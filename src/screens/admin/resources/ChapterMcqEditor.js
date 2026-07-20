// src/screens/admin/resources/ChapterMcqEditor.js
// Author a chapter's Practice MCQs — question + A/B/C/D options (mark one correct) +
// optional solution. Saved as is_mcq questions (options: [{idx,html,is_correct}],
// correct_option) so students see them EXACTLY like imported MCQs (resources.service.toMcq,
// getMcqByPath). The admin types plain text; text↔html conversion preserves untouched bodies.
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, X, ListChecks, Check, Eye, EyeOff, CircleCheck } from 'lucide-react-native';
import { getAdminChapterQuestions, saveAdminChapterQuestions } from '../../../api/adminApi';
import { S, shadow } from '../../../theme/studentUI';
import { T } from '../../parent/ParentApp/constants';
import { apiError, firstImg, withImage } from '../ui/format';
import ImageField from '../ui/ImageField';
import MathHtmlPreview from './MathHtmlPreview';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
// studentTheme has no green/amber — define correct-answer + warning tones locally.
const GREEN = '#16A34A';
const GREEN_SOFT = '#E7F7EE';
const AMBER = '#B45309';
const inputBase = { backgroundColor: '#fff', borderWidth: 1.5, borderColor: S.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontFamily: 'Nunito_600SemiBold', fontSize: 14.5, color: S.ink };
const htmlToText = (html) => String(html || '')
  .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<li[^>]*>/gi, '• ')
  .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const textToHtml = (text) => {
  const paras = String(text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return '';
  return paras.map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`).join('');
};
// Options render inline in students' MCQ list — keep them a single <p> (no block breaks).
const optTextToHtml = (text) => {
  const t = String(text || '').trim();
  return t ? `<p style="display:inline">${escapeHtml(t).replace(/\n/g, '<br/>')}</p>` : '';
};

// A fresh MCQ starts with 4 empty options, none correct yet.
const blankItem = () => ({
  question: '', solution: '', origQ: null, origSol: null, loadedQ: '', loadedSol: '', qImage: null,
  options: [0, 1, 2, 3].map((j) => ({ text: '', origHtml: null, loaded: '', correct: false, image: null })),
});

export default function ChapterMcqEditor({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id, name, type = 'practice', typeLabel = 'Practice MCQs' } = route.params || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openPreview, setOpenPreview] = useState({});
  const togglePreview = (i) => setOpenPreview((p) => ({ ...p, [i]: !p[i] }));

  useEffect(() => {
    let alive = true;
    getAdminChapterQuestions(id, type)
      .then((d) => {
        if (!alive) return;
        setItems((d?.questions || []).map((q) => {
          const question = htmlToText(q.questionHtml); const solution = htmlToText(q.solutionHtml);
          const rawOpts = Array.isArray(q.options) ? q.options : [];
          const options = rawOpts.map((o) => {
            const text = htmlToText(o.html);
            const correct = Boolean(o.is_correct) || (q.correctOption != null && String(o.idx) === String(q.correctOption));
            return { text, origHtml: o.html || null, loaded: text, correct, image: firstImg(o.html) };
          });
          while (options.length < 4) options.push({ text: '', origHtml: null, loaded: '', correct: false, image: null });
          return { question, solution, origQ: q.questionHtml || null, origSol: q.solutionHtml || null, loadedQ: question, loadedSol: solution, qImage: firstImg(q.questionHtml), options };
        }));
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id, type]);

  const setItem = (i, patch) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setField = (i, field) => (v) => setItem(i, { [field]: v });
  const setOptText = (i, oi) => (v) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, options: x.options.map((o, k) => (k === oi ? { ...o, text: v } : o)) } : x)));
  const setOptImage = (i, oi, url) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, options: x.options.map((o, k) => (k === oi ? { ...o, image: url } : o)) } : x)));
  const markCorrect = (i, oi) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, options: x.options.map((o, k) => ({ ...o, correct: k === oi })) } : x)));
  const addOption = (i) => setItems((xs) => xs.map((x, j) => (j === i && x.options.length < 6 ? { ...x, options: [...x.options, { text: '', origHtml: null, loaded: '', correct: false, image: null }] } : x)));
  const removeOption = (i, oi) => setItems((xs) => xs.map((x, j) => (j === i && x.options.length > 2 ? { ...x, options: x.options.filter((_, k) => k !== oi) } : x)));
  const addItem = () => setItems((xs) => [...xs, blankItem()]);
  const removeItem = (i) => setItems((xs) => xs.filter((_, j) => j !== i));

  // Build the exact payload row (also what Preview renders) — preserve untouched html verbatim.
  const buildRow = (x, i) => {
    const qChanged = x.question.trim() !== (x.loadedQ || '').trim();
    const solChanged = x.solution.trim() !== (x.loadedSol || '').trim();
    const options = x.options
      .map((o, j) => {
        const changed = o.text.trim() !== (o.loaded || '').trim();
        const baseHtml = o.origHtml != null && !changed ? o.origHtml : optTextToHtml(o.text.trim());
        return {
          idx: LETTERS[j] || String(j + 1),
          html: withImage(baseHtml, o.image),
          isCorrect: Boolean(o.correct),
          _empty: !o.text.trim() && !o.image,
        };
      })
      .filter((o) => !o._empty)
      .map(({ _empty, ...o }) => o);
    return {
      qNumber: `Q${i + 1}`,
      questionHtml: withImage(x.origQ != null && !qChanged ? x.origQ : textToHtml(x.question.trim()), x.qImage),
      solutionHtml: x.origSol != null && !solChanged ? x.origSol : textToHtml(x.solution.trim()),
      isMcq: true,
      options,
      correctOption: (options.find((o) => o.isCorrect) || {}).idx || null,
    };
  };

  // Per-item validity for inline hints + save gating.
  const itemIssue = (x) => {
    const filled = x.options.filter((o) => o.text.trim() || o.image);
    if (!x.question.trim() && !x.qImage) return null; // empty rows are dropped, not errors
    if (filled.length < 2) return 'Add at least 2 options';
    if (!x.options.some((o) => o.correct)) return 'Mark the correct option';
    return null;
  };

  const save = useCallback(async () => {
    if (saving) return;
    const nonEmpty = items.filter((x) => x.question.trim() || x.qImage);
    const firstIssue = nonEmpty.map(itemIssue).find(Boolean);
    if (firstIssue) { Alert.alert('Finish the question', firstIssue); return; }
    const out = nonEmpty.map((x, i) => buildRow(x, i)).filter((q) => q.options.length >= 2 && q.correctOption);
    setSaving(true);
    try {
      await saveAdminChapterQuestions(id, type, { questions: out });
      navigation.goBack();
    } catch (e) { Alert.alert('Could not save', apiError(e)); }
    finally { setSaving(false); }
  }, [id, type, items, saving, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingRight: 18, paddingBottom: 10, paddingTop: insets.top + 8 }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ padding: 4 }}>
          <ChevronLeft size={26} color={S.ink} strokeWidth={2.5} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="black" s={20} c={S.ink} numberOfLines={1}>{typeLabel}</T>
          <T w="semi" s={12.5} c={S.muted} numberOfLines={1}>{name || 'Chapter'} · students practise these</T>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={S.indigo} /></View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <T w="xbold" s={12.5} c={S.sub} style={{ marginTop: 4, marginBottom: 8 }}>{items.length} {items.length === 1 ? 'question' : 'questions'}</T>

            {items.map((x, i) => {
              const issue = itemIssue(x);
              return (
                <View key={i} style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: S.hair, padding: 12, marginBottom: 12, ...shadow }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <T w="xbold" s={11.5} c={S.faint}>Q{i + 1}</T>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Pressable onPress={() => togglePreview(i)} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 28, paddingHorizontal: 10, borderRadius: 9, backgroundColor: openPreview[i] ? S.indigo : S.indigoSoft }}>
                        {openPreview[i] ? <EyeOff size={13} color="#fff" strokeWidth={2.6} /> : <Eye size={13} color={S.indigo} strokeWidth={2.6} />}
                        <Text style={{ fontSize: 11.5, fontWeight: '800', color: openPreview[i] ? '#fff' : S.indigo }}>{openPreview[i] ? 'Hide' : 'Preview'}</Text>
                      </Pressable>
                      <Pressable onPress={() => removeItem(i)} hitSlop={10} style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: S.redSoft, alignItems: 'center', justifyContent: 'center' }}>
                        <X size={15} color={S.red} strokeWidth={2.6} />
                      </Pressable>
                    </View>
                  </View>

                  <T w="bold" s={11} c={S.muted} style={{ marginBottom: 5 }}>QUESTION</T>
                  <TextInput style={[inputBase, { minHeight: 60, textAlignVertical: 'top' }]} value={x.question} onChangeText={setField(i, 'question')} placeholder="Type the question…" placeholderTextColor={S.faint} multiline />
                  <ImageField value={x.qImage} onChange={(url) => setItem(i, { qImage: url })} />

                  <T w="bold" s={11} c={S.muted} style={{ marginTop: 12, marginBottom: 6 }}>OPTIONS · tap the circle to mark the correct one</T>
                  {x.options.map((o, oi) => (
                    <View key={oi} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Pressable onPress={() => markCorrect(i, oi)} hitSlop={8} style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: o.correct ? GREEN : S.border, backgroundColor: o.correct ? GREEN : '#fff', alignItems: 'center', justifyContent: 'center' }}>
                          {o.correct ? <Check size={16} color="#fff" strokeWidth={3} /> : <Text style={{ fontSize: 12.5, fontWeight: '800', color: S.faint }}>{LETTERS[oi]}</Text>}
                        </Pressable>
                        <TextInput style={[inputBase, { flex: 1, paddingVertical: 9 }]} value={o.text} onChangeText={setOptText(i, oi)} placeholder={`Option ${LETTERS[oi]}${o.image ? ' (or leave blank for image only)' : ''}`} placeholderTextColor={S.faint} />
                        {x.options.length > 2 && (
                          <Pressable onPress={() => removeOption(i, oi)} hitSlop={8} style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                            <X size={15} color={S.faint} strokeWidth={2.4} />
                          </Pressable>
                        )}
                      </View>
                      <View style={{ marginLeft: 38 }}>
                        <ImageField compact value={o.image} onChange={(url) => setOptImage(i, oi, url)} />
                      </View>
                    </View>
                  ))}
                  {x.options.length < 6 && (
                    <Pressable onPress={() => addOption(i)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 4 }}>
                      <Plus size={14} color={S.indigo} strokeWidth={2.6} />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: S.indigo }}>Add option</Text>
                    </Pressable>
                  )}

                  <T w="bold" s={11} c={S.muted} style={{ marginTop: 8, marginBottom: 5 }}>SOLUTION / EXPLANATION · optional</T>
                  <TextInput style={[inputBase, { minHeight: 56, textAlignVertical: 'top' }]} value={x.solution} onChangeText={setField(i, 'solution')} placeholder="Why the correct option is right…" placeholderTextColor={S.faint} multiline />

                  {issue && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: AMBER }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: AMBER }}>{issue}</Text>
                    </View>
                  )}

                  {openPreview[i] && (() => {
                    const row = buildRow(x, i);
                    return (
                      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: S.hair, paddingTop: 10 }}>
                        <T w="xbold" s={10.5} c={S.indigo} style={{ marginBottom: 8, letterSpacing: 0.4 }}>WHAT STUDENTS SEE</T>
                        <MathHtmlPreview html={row.questionHtml} />
                        <View style={{ marginTop: 8, gap: 6 }}>
                          {row.options.map((o) => (
                            <View key={o.idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: o.isCorrect ? GREEN_SOFT : S.canvas, borderRadius: 10, borderWidth: 1, borderColor: o.isCorrect ? (GREEN) : S.hair, paddingHorizontal: 10, paddingVertical: 4 }}>
                              <Text style={{ fontSize: 12.5, fontWeight: '800', color: o.isCorrect ? (GREEN) : S.faint, width: 16 }}>{o.idx}</Text>
                              <View style={{ flex: 1, minWidth: 0 }}><MathHtmlPreview html={o.html} /></View>
                              {o.isCorrect && <CircleCheck size={16} color={GREEN} strokeWidth={2.4} />}
                            </View>
                          ))}
                        </View>
                        {!!x.solution.trim() && (
                          <View style={{ marginTop: 10 }}>
                            <T w="bold" s={10.5} c={S.faint} style={{ marginBottom: 3 }}>Solution</T>
                            <MathHtmlPreview html={row.solutionHtml} />
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </View>
              );
            })}

            <Pressable onPress={addItem} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#fff', borderWidth: 1.5, borderColor: S.border, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 14, marginTop: 2 }}>
              <Plus size={17} color={S.indigo} strokeWidth={2.6} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: S.indigo }}>Add MCQ</Text>
            </Pressable>

            {!items.length && (
              <View style={{ alignItems: 'center', paddingVertical: 22, gap: 8 }}>
                <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><ListChecks size={24} color={S.indigo} strokeWidth={2.2} /></View>
                <T w="semi" s={12.5} c={S.muted} style={{ textAlign: 'center', maxWidth: 270, lineHeight: 18 }}>No practice MCQs yet. Add a question, its options, and mark the correct one — students will practise them.</T>
              </View>
            )}
          </ScrollView>

          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: S.hair, backgroundColor: S.canvas }}>
            <Pressable onPress={save} disabled={saving} style={{ minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: S.indigo, borderRadius: 16, opacity: saving ? 0.6 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Save</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
