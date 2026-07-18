// src/screens/admin/resources/ChapterQuestionsEditor.js
// Add / edit a chapter's question content (Important Questions / Previous-Year Questions) —
// each item is a question + its answer, stored as question_html + solution_html (what students
// read). The admin edits plain text; text↔html conversion preserves untouched items verbatim.
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, X, CircleQuestionMark, Eye, EyeOff, CircleCheck } from 'lucide-react-native';
import { getAdminChapterQuestions, saveAdminChapterQuestions } from '../../../api/adminApi';
import { S, shadow } from '../../../theme/studentUI';
import { T } from '../../parent/ParentApp/constants';
import { apiError } from '../ui/format';
import MathHtmlPreview from './MathHtmlPreview';

const GREEN = '#16A34A';
const GREEN_SOFT = '#E7F7EE';
const inputBase = { backgroundColor: '#fff', borderWidth: 1.5, borderColor: S.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontFamily: 'Nunito_600SemiBold', fontSize: 14.5, color: S.ink };
const optIsCorrect = (x, o) => Boolean(o.is_correct) || (x.correctOption != null && String(o.idx) === String(x.correctOption));
// Some MCQ options/questions are image-based (S3 diagrams) — pull the image URL so we render it
// instead of a blank row (htmlToText strips the <img>).
const firstImg = (html) => { const m = String(html || '').match(/<img[^>]+src=["']([^"']+)["']/i); return m ? m[1] : null; };

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

export default function ChapterQuestionsEditor({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id, name, type, typeLabel } = route.params || {};
  const [items, setItems] = useState([]); // { question, answer, origQ, origA, loadedQ, loadedA }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openPreview, setOpenPreview] = useState({}); // { [index]: bool } — lazy-mount previews
  const togglePreview = (i) => setOpenPreview((p) => ({ ...p, [i]: !p[i] }));

  // What students will actually see for this item — the SAME html save() persists:
  // keep the original verbatim when untouched (preserves rich markup / tex), else rebuild.
  const previewHtml = (x) => {
    const qChanged = x.question.trim() !== (x.loadedQ || '').trim();
    const aChanged = x.answer.trim() !== (x.loadedA || '').trim();
    return {
      q: x.origQ != null && !qChanged ? x.origQ : textToHtml(x.question.trim()),
      a: x.origA != null && !aChanged ? x.origA : textToHtml(x.answer.trim()),
    };
  };

  useEffect(() => {
    let alive = true;
    getAdminChapterQuestions(id, type)
      .then((d) => {
        if (!alive) return;
        setItems((d?.questions || []).map((q) => {
          const question = htmlToText(q.questionHtml); const answer = htmlToText(q.solutionHtml);
          // A section can mix Q&A and MCQ rows. This editor only edits question + solution text;
          // it MUST carry an MCQ row's options/correct answer through untouched, or a save would
          // flatten every MCQ in the section to plain Q&A (data loss). MCQ options shown read-only.
          const isMcq = Boolean(q.isMcq) && Array.isArray(q.options) && q.options.length >= 2;
          return {
            question, answer, origQ: q.questionHtml || null, origA: q.solutionHtml || null, loadedQ: question, loadedA: answer,
            isMcq, options: isMcq ? q.options : null, correctOption: q.correctOption != null ? q.correctOption : null,
          };
        }));
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id, type]);

  const setField = (i, field) => (v) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, [field]: v } : x)));
  const addItem = () => setItems((xs) => [...xs, { question: '', answer: '', origQ: null, origA: null, loadedQ: '', loadedA: '', isMcq: false, options: null, correctOption: null }]);
  const removeItem = (i) => setItems((xs) => xs.filter((_, j) => j !== i));

  const save = useCallback(async () => {
    if (saving) return;
    const out = items.map((x, i) => {
      const qChanged = x.question.trim() !== (x.loadedQ || '').trim();
      const aChanged = x.answer.trim() !== (x.loadedA || '').trim();
      const row = {
        qNumber: `Q${i + 1}`,
        questionHtml: x.origQ != null && !qChanged ? x.origQ : textToHtml(x.question.trim()),
        solutionHtml: x.origA != null && !aChanged ? x.origA : textToHtml(x.answer.trim()),
      };
      // Preserve an MCQ row verbatim — this editor never touches options/correct answer.
      if (x.isMcq && Array.isArray(x.options) && x.options.length >= 2) {
        row.isMcq = true;
        row.options = x.options.map((o) => ({ idx: o.idx, html: o.html, isCorrect: Boolean(o.is_correct) || (x.correctOption != null && String(o.idx) === String(x.correctOption)) }));
        row.correctOption = x.correctOption;
      }
      return row;
    }).filter((q) => String(q.questionHtml).replace(/<[^>]*>/g, '').trim());
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
          <T w="black" s={20} c={S.ink} numberOfLines={1}>{typeLabel || 'Questions'}</T>
          <T w="semi" s={12.5} c={S.muted} numberOfLines={1}>{name || 'Chapter'} · students read this</T>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={S.indigo} /></View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <T w="xbold" s={12.5} c={S.sub} style={{ marginTop: 4, marginBottom: 8 }}>{items.length} {items.length === 1 ? 'question' : 'questions'}</T>

            {items.map((x, i) => (
              <View key={i} style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: S.hair, padding: 12, marginBottom: 12, ...shadow }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <T w="xbold" s={11.5} c={S.faint}>Q{i + 1}</T>
                    {x.isMcq && (
                      <View style={{ backgroundColor: '#E0F2FE', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#0369A1', letterSpacing: 0.3 }}>MCQ</Text>
                      </View>
                    )}
                  </View>
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
                <TextInput style={[inputBase, { minHeight: 64, textAlignVertical: 'top', marginBottom: firstImg(x.origQ) ? 6 : 10 }]} value={x.question} onChangeText={setField(i, 'question')} placeholder="Type the question…" placeholderTextColor={S.faint} multiline />
                {!!firstImg(x.origQ) && <Image source={{ uri: firstImg(x.origQ) }} style={{ width: '70%', height: 110, borderRadius: 8, backgroundColor: '#fff', marginBottom: 10 }} resizeMode="contain" />}

                {x.isMcq && Array.isArray(x.options) && (
                  <View style={{ marginBottom: 10 }}>
                    <T w="bold" s={11} c={S.muted} style={{ marginBottom: 5 }}>OPTIONS · edit these in “Practice MCQs”</T>
                    {x.options.map((o, oi) => {
                      const on = optIsCorrect(x, o);
                      return (
                        <View key={oi} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: on ? GREEN_SOFT : S.canvas, borderRadius: 10, borderWidth: 1, borderColor: on ? GREEN : S.hair, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 6 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: on ? GREEN : S.faint, width: 16 }}>{o.idx}</Text>
                          {(() => { const ot = htmlToText(o.html); const oimg = firstImg(o.html); return ot
                            ? <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '600', color: S.ink }} numberOfLines={2}>{ot}</Text>
                            : oimg ? <View style={{ flex: 1 }}><Image source={{ uri: oimg }} style={{ width: 92, height: 52, borderRadius: 6, backgroundColor: '#fff' }} resizeMode="contain" /></View>
                            : <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '600', color: S.faint }}>—</Text>; })()}
                          {on && <CircleCheck size={16} color={GREEN} strokeWidth={2.4} />}
                        </View>
                      );
                    })}
                  </View>
                )}

                <T w="bold" s={11} c={S.muted} style={{ marginBottom: 5 }}>{x.isMcq ? 'SOLUTION / EXPLANATION' : 'ANSWER'}</T>
                <TextInput style={[inputBase, { minHeight: 80, textAlignVertical: 'top' }]} value={x.answer} onChangeText={setField(i, 'answer')} placeholder={x.isMcq ? 'Why the correct option is right…' : 'Type the answer / solution…'} placeholderTextColor={S.faint} multiline />

                {openPreview[i] && (() => {
                  const pv = previewHtml(x);
                  return (
                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: S.hair, paddingTop: 10 }}>
                      <T w="xbold" s={10.5} c={S.indigo} style={{ marginBottom: 8, letterSpacing: 0.4 }}>WHAT STUDENTS SEE</T>
                      <T w="bold" s={10.5} c={S.faint} style={{ marginBottom: 3 }}>Question</T>
                      <MathHtmlPreview html={pv.q} />
                      {x.isMcq && Array.isArray(x.options) ? (
                        <View style={{ marginTop: 8, gap: 6 }}>
                          {x.options.map((o, oi) => {
                            const on = optIsCorrect(x, o);
                            return (
                              <View key={oi} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: on ? GREEN_SOFT : S.canvas, borderRadius: 10, borderWidth: 1, borderColor: on ? GREEN : S.hair, paddingHorizontal: 10, paddingVertical: 4 }}>
                                <Text style={{ fontSize: 12.5, fontWeight: '800', color: on ? GREEN : S.faint, width: 16 }}>{o.idx}</Text>
                                <View style={{ flex: 1, minWidth: 0 }}><MathHtmlPreview html={o.html} /></View>
                                {on && <CircleCheck size={16} color={GREEN} strokeWidth={2.4} />}
                              </View>
                            );
                          })}
                        </View>
                      ) : null}
                      <T w="bold" s={10.5} c={S.faint} style={{ marginTop: 10, marginBottom: 3 }}>{x.isMcq ? 'Solution' : 'Answer'}</T>
                      <MathHtmlPreview html={pv.a} />
                    </View>
                  );
                })()}
              </View>
            ))}

            <Pressable onPress={addItem} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#fff', borderWidth: 1.5, borderColor: S.border, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 14, marginTop: 2 }}>
              <Plus size={17} color={S.indigo} strokeWidth={2.6} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: S.indigo }}>Add question</Text>
            </Pressable>

            {!items.length && (
              <View style={{ alignItems: 'center', paddingVertical: 22, gap: 8 }}>
                <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center' }}><CircleQuestionMark size={24} color={S.indigo} strokeWidth={2.2} /></View>
                <T w="semi" s={12.5} c={S.muted} style={{ textAlign: 'center', maxWidth: 260, lineHeight: 18 }}>No questions yet. Add a question and its answer — students will see them.</T>
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
