// src/screens/teacher/HomeworkSheet.js
// The teacher's "Give homework" form, as a sheet from the bottom. The same sheet edits
// an existing item (and deletes it). Student → title → details → due date.
//
// Delete asks for a second tap inside the sheet instead of Alert.alert: on the web build
// Alert is an empty stub, so a confirm there would silently never happen.
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronLeft, ChevronRight, Trash2, CircleCheck } from 'lucide-react-native';
import { giveHomework, editHomework, deleteHomework, checkHomework } from '../../api/teachingApi';
import { PhotoPicker, PhotoRow } from '../../components/HomeworkPhotos';
import { SPACING, RADIUS } from '../../theme/designSystem';
import { T, F, CARD, EYEBROW } from './teacherTheme';
import { istKey, addDaysKey, shortDateKey } from './teacherTime';

const TITLE_MAX = 120;
const DETAILS_MAX = 2000;
const QUICK = [['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['In a week', 7]];

// students: [{ assignmentId, studentName, subject, classLevel }]
// item: an existing homework item to edit, or null to give a new one
// presetAssignmentId: start a new item on this student
export default function HomeworkSheet({ visible, onClose, onSaved, students = [], item = null, presetAssignmentId = null }) {
  const insets = useSafeAreaInsets();
  const today = istKey(Date.now());
  const [assignmentId, setAssignmentId] = useState(null);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [dueOn, setDueOn] = useState(addDaysKey(today, 1));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [images, setImages] = useState([]);          // the teacher's photos
  const [comment, setComment] = useState('');        // on the student's work
  const [checking, setChecking] = useState(false);

  // Fill the form each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setError(null); setSaving(false); setConfirmDelete(false);
    if (item) {
      setAssignmentId(item.assignmentId); setTitle(item.title); setDetails(item.details || ''); setDueOn(item.dueOn);
      setImages(item.images || []); setComment(item.teacherComment || '');
    } else {
      setAssignmentId(presetAssignmentId || (students.length === 1 ? students[0].assignmentId : null));
      setTitle(''); setDetails(''); setDueOn(addDaysKey(today, 1)); setImages([]); setComment('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, item, presetAssignmentId]);

  const editing = !!item;
  // An edit may keep a due date that has since passed; a new date may not be in the past.
  const minDue = editing && item.dueOn < today ? item.dueOn : today;
  const canSave = !!assignmentId && title.trim().length > 0 && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true); setError(null);
    try {
      const body = { title: title.trim(), details: details.trim(), dueOn, images };
      const saved = editing ? await editHomework(item.id, body) : await giveHomework({ ...body, assignmentId });
      onSaved && onSaved(saved, editing ? 'edited' : 'given');
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not save. Try again.');
      setSaving(false);
    }
  }

  // Mark the student's work checked (with the comment), or take the check back.
  async function check(uncheck = false) {
    setChecking(true); setError(null);
    try {
      const saved = await checkHomework(item.id, uncheck ? { uncheck: true } : { comment: comment.trim() });
      onSaved && onSaved(saved, uncheck ? 'unchecked' : 'checked');
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not save. Try again.');
      setChecking(false);
    }
  }

  async function remove() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true); setError(null);
    try {
      await deleteHomework(item.id);
      onSaved && onSaved(item, 'deleted');
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not delete. Try again.');
      setSaving(false);
    }
  }

  const chosen = students.find((s) => s.assignmentId === assignmentId);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={sh.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={sh.kav}>
          <View style={[sh.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
            <View style={sh.head}>
              <Text style={sh.title}>{editing ? 'Edit homework' : 'Give homework'}</Text>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={sh.close}>
                <X size={20} color={T.ink} strokeWidth={2.4} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: SPACING.md }}>
              <Text style={sh.label}>Student</Text>
              {editing ? (
                <Text style={sh.fixed}>{item.studentName} · {item.subject}</Text>
              ) : students.length === 0 ? (
                <Text style={sh.fixed}>You have no students yet.</Text>
              ) : (
                <View style={sh.chips}>
                  {students.map((s) => {
                    const on = s.assignmentId === assignmentId;
                    return (
                      <Pressable key={s.assignmentId} onPress={() => setAssignmentId(s.assignmentId)}
                        accessibilityRole="radio" accessibilityState={{ selected: on }}
                        style={[sh.chip, on && sh.chipOn]}>
                        <Text style={[sh.chipText, on && sh.chipTextOn]} numberOfLines={1}>{s.studentName} · {s.subject}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Text style={sh.label}>Title</Text>
              <TextInput
                value={title} onChangeText={(t) => setTitle(t.slice(0, TITLE_MAX))}
                placeholder="e.g. Chapter 6: questions 1 to 5" placeholderTextColor={T.dim}
                style={sh.input} returnKeyType="next" maxLength={TITLE_MAX}
              />

              <Text style={sh.label}>Details <Text style={sh.optional}>(optional)</Text></Text>
              <TextInput
                value={details} onChangeText={(t) => setDetails(t.slice(0, DETAILS_MAX))}
                placeholder="What exactly to do, which pages, any hints" placeholderTextColor={T.dim}
                style={[sh.input, sh.multi]} multiline textAlignVertical="top" maxLength={DETAILS_MAX}
              />

              <Text style={sh.label}>Photos <Text style={sh.optional}>(optional — a worksheet, a question)</Text></Text>
              <PhotoPicker value={images} onChange={setImages} label="Add photo" />

              <Text style={sh.label}>Due</Text>
              <View style={sh.chips}>
                {QUICK.map(([label, n]) => {
                  const key = addDaysKey(today, n);
                  const on = key === dueOn;
                  return (
                    <Pressable key={label} onPress={() => setDueOn(key)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                      style={[sh.chip, on && sh.chipOn]}>
                      <Text style={[sh.chipText, on && sh.chipTextOn]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={sh.stepper}>
                <Pressable onPress={() => setDueOn((d) => (addDaysKey(d, -1) >= minDue ? addDaysKey(d, -1) : d))}
                  disabled={dueOn <= minDue} hitSlop={8} accessibilityRole="button" accessibilityLabel="One day earlier"
                  style={[sh.step, dueOn <= minDue && { opacity: 0.35 }]}>
                  <ChevronLeft size={20} color={T.ink} strokeWidth={2.4} />
                </Pressable>
                <Text style={sh.stepDate}>{shortDateKey(dueOn)}{dueOn === today ? ' · today' : ''}</Text>
                <Pressable onPress={() => setDueOn((d) => addDaysKey(d, 1))} hitSlop={8} accessibilityRole="button" accessibilityLabel="One day later" style={sh.step}>
                  <ChevronRight size={20} color={T.ink} strokeWidth={2.4} />
                </Pressable>
              </View>

              {editing && (
                <View style={sh.work}>
                  <Text style={sh.workEyebrow}>STUDENT'S WORK</Text>
                  {item.submission && item.submission.submittedAt ? (
                    <>
                      {!!item.submission.note && <Text style={sh.workNote}>{item.submission.note}</Text>}
                      {item.submission.images.length > 0 && <View style={{ marginTop: 10 }}><PhotoRow images={item.submission.images} /></View>}
                    </>
                  ) : (
                    <Text style={sh.workNone}>{item.status === 'done' ? 'Marked done, nothing handed in.' : 'Not handed in yet.'}</Text>
                  )}
                  {item.checkedAt ? (
                    <View style={sh.checkedRow}>
                      <CircleCheck size={18} color={T.green} strokeWidth={2.4} />
                      <Text style={sh.checkedText} numberOfLines={3}>Checked{item.teacherComment ? ` · “${item.teacherComment}”` : ''}</Text>
                      <Pressable onPress={() => check(true)} disabled={checking} hitSlop={8} accessibilityRole="button">
                        <Text style={sh.undoText}>Undo</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <TextInput
                        value={comment} onChangeText={(t) => setComment(t.slice(0, DETAILS_MAX))}
                        placeholder="Comment for the student (optional), e.g. Good — redo Q3"
                        placeholderTextColor={T.dim} style={[sh.input, { marginTop: 12 }]} multiline maxLength={DETAILS_MAX}
                      />
                      <Pressable onPress={() => check(false)} disabled={checking} accessibilityRole="button"
                        style={({ pressed }) => [sh.checkBtn, pressed && { opacity: 0.85 }]}>
                        {checking ? <ActivityIndicator color={T.white} /> : <CircleCheck size={18} color={T.white} strokeWidth={2.4} />}
                        <Text style={sh.checkBtnText}>Mark checked</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}

              {!!error && <Text style={sh.error}>{error}</Text>}
            </ScrollView>

            <View style={sh.actions}>
              {editing && (
                <Pressable onPress={remove} disabled={saving} accessibilityRole="button"
                  accessibilityLabel={confirmDelete ? 'Tap again to delete' : 'Delete homework'}
                  style={[sh.delete, confirmDelete && sh.deleteConfirm]}>
                  <Trash2 size={16} color={confirmDelete ? T.white : T.red} strokeWidth={2.4} />
                  <Text style={[sh.deleteText, confirmDelete && { color: T.white }]}>{confirmDelete ? 'Tap again to delete' : 'Delete'}</Text>
                </Pressable>
              )}
              <Pressable onPress={save} disabled={!canSave} accessibilityRole="button"
                accessibilityLabel={editing ? 'Save changes' : `Give homework${chosen ? ` to ${chosen.studentName}` : ''}`}
                style={({ pressed }) => [sh.save, !canSave && sh.saveOff, pressed && canSave && { opacity: 0.85 }]}>
                {saving ? <ActivityIndicator color={T.white} /> : <Text style={[sh.saveText, !canSave && { color: T.dim }]}>{editing ? 'Save changes' : 'Give homework'}</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const sh = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'flex-end' },
  kav: { width: '100%' },
  sheet: { backgroundColor: T.page, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, paddingHorizontal: SPACING.md + 4, paddingTop: SPACING.md, maxHeight: '92%' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  title: { fontFamily: F.xbold, fontSize: 21, color: T.ink },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.fill, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: F.bold, fontSize: 14, color: T.ink, marginTop: SPACING.md, marginBottom: SPACING.sm },
  optional: { fontFamily: F.reg, color: T.dim },
  fixed: { fontFamily: F.med, fontSize: 15, color: T.soft },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.full, backgroundColor: T.fill, borderWidth: 1, borderColor: T.edge, maxWidth: '100%' },
  chipOn: { backgroundColor: T.black, borderColor: T.black },
  chipText: { fontFamily: F.semi, fontSize: 14, color: T.ink },
  chipTextOn: { color: T.white },
  input: { fontFamily: F.med, fontSize: 15, color: T.ink, backgroundColor: T.fill, borderRadius: RADIUS.md, borderWidth: 1, borderColor: T.edge, paddingHorizontal: 14, paddingVertical: 12 },
  multi: { minHeight: 90 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm + 4, backgroundColor: T.fill, borderRadius: RADIUS.md, paddingHorizontal: 6, height: 46 },
  step: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  stepDate: { fontFamily: F.bold, fontSize: 15, color: T.ink },
  error: { fontFamily: F.med, fontSize: 14, color: T.red, marginTop: SPACING.md },
  work: { marginTop: SPACING.lg, padding: SPACING.md, borderRadius: 16, backgroundColor: T.violetSoft },
  workEyebrow: { ...EYEBROW, marginBottom: 8 },
  workNote: { fontFamily: F.reg, fontSize: 15, color: T.ink, lineHeight: 22 },
  workNone: { fontFamily: F.semi, fontSize: 14, color: T.soft },
  checkedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  checkedText: { flex: 1, fontFamily: F.bold, fontSize: 14, color: T.green },
  undoText: { fontFamily: F.bold, fontSize: 13, color: T.soft, textDecorationLine: 'underline' },
  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 12, backgroundColor: T.green, marginTop: 10 },
  checkBtnText: { fontFamily: F.bold, fontSize: 15, color: T.white },
  actions: { flexDirection: 'row', gap: SPACING.sm + 4, paddingTop: SPACING.sm },
  save: { flex: 1, height: 50, borderRadius: RADIUS.lg, backgroundColor: T.black, alignItems: 'center', justifyContent: 'center' },
  saveOff: { backgroundColor: T.fill, borderWidth: 1, borderColor: T.edge },
  saveText: { fontFamily: F.bold, fontSize: 16, color: T.white },
  delete: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 50, paddingHorizontal: 16, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: T.red },
  deleteConfirm: { backgroundColor: T.red },
  deleteText: { fontFamily: F.bold, fontSize: 14, color: T.red },
});
