// src/components/HomeworkCard.js
// The student's homework from their teacher, on Home. Hidden entirely when there is none
// (a section with nothing in it is never shown — never faked). Pending work first, overdue
// in red; tap the circle to mark it done (and again to undo); tap the item to open it full
// page (all the teacher's instructions, given/due dates, a big done button).
// Data: GET /api/homework.
import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CircleCheck, Circle, ClipboardList, ChevronDown, ChevronUp, ChevronRight, X, CalendarDays, User, Send, Pencil } from 'lucide-react-native';
import { getMyHomework, markHomeworkDone, submitHomework } from '../api/teachingApi';
import { PhotoRow, PhotoPicker } from './HomeworkPhotos';
import { dueLabel, shortDateKey, istKey } from '../screens/teacher/teacherTime';
import { DAY, DFONT as F } from '../theme/dayTheme';

const SHOW = 3;
const TONE = {
  overdue: DAY.red, today: DAY.amber, soon: DAY.violet, later: DAY.inkSoft, done: DAY.green,
};

export default function HomeworkCard() {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);   // the item shown full page
  const busy = useRef(new Set());

  const load = useCallback(() => {
    let alive = true;
    // Best-effort: a failed load (or a server without homework yet) just hides the card.
    getMyHomework().then((list) => { if (alive) setItems(list); }).catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, []);
  useFocusEffect(load);

  if (!items || !items.length) return null;

  const pending = items.filter((h) => h.status !== 'done');
  const done = items.filter((h) => h.status === 'done');
  const now = Date.now();
  const overdue = pending.filter((h) => dueLabel(h, now).tone === 'overdue').length;
  const list = open ? [...pending, ...done] : pending.slice(0, SHOW);
  const more = pending.length + done.length - list.length;

  async function toggle(h) {
    if (busy.current.has(h.id)) return;
    busy.current.add(h.id);
    const next = h.status === 'done' ? 'assigned' : 'done';
    // Optimistic: tick it at once, put it back if the server says no.
    setItems((all) => all.map((x) => (x.id === h.id ? { ...x, status: next } : x)));
    try {
      const saved = await markHomeworkDone(h.id, next === 'done');
      if (saved) setItems((all) => all.map((x) => (x.id === h.id ? saved : x)));
    } catch (_) {
      setItems((all) => all.map((x) => (x.id === h.id ? h : x)));
    } finally {
      busy.current.delete(h.id);
    }
  }

  return (
    <View style={hc.card}>
      <View style={hc.head}>
        <View style={hc.icon}><ClipboardList size={20} color={DAY.violet} strokeWidth={2} /></View>
        <View style={{ flex: 1 }}>
          <Text style={hc.eyebrow}>HOMEWORK</Text>
          <Text style={hc.title}>
            {pending.length ? `${pending.length} to do` : 'All done'}
            {overdue ? <Text style={{ color: DAY.red }}>{`  ·  ${overdue} overdue`}</Text> : null}
          </Text>
        </View>
      </View>

      {list.map((h) => {
        const due = dueLabel(h, now);
        const isDone = h.status === 'done';
        // Handed in / checked says more than the due date once the work is in.
        const tag = h.checkedAt ? { text: 'Checked by teacher', tone: 'done' }
          : (h.submission && h.submission.submittedAt) ? { text: 'Submitted', tone: 'soon' } : due;
        return (
          <View key={h.id} style={hc.row}>
            <Pressable onPress={() => toggle(h)} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: isDone }}
              accessibilityLabel={isDone ? `${h.title}, done. Tap to undo.` : `${h.title}. Tap when done.`} style={hc.tick}>
              {isDone ? <CircleCheck size={24} color={DAY.green} strokeWidth={2.2} /> : <Circle size={24} color={TONE[due.tone]} strokeWidth={2} />}
            </Pressable>
            <Pressable onPress={() => setDetailId(h.id)} accessibilityRole="button" accessibilityLabel={`${h.title}. Open the full homework.`}
              style={({ pressed }) => [{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }, pressed && { opacity: 0.6 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[hc.itemTitle, isDone && hc.itemDone]} numberOfLines={2}>{h.title}</Text>
                {!!h.details && !isDone && <Text style={hc.details} numberOfLines={2}>{h.details}</Text>}
                <Text style={hc.meta} numberOfLines={1}>
                  <Text style={{ color: TONE[tag.tone], fontFamily: F.bold }}>{tag.text}</Text>
                  {`  ·  ${h.subject}${h.teacherName ? ` · ${h.teacherName}` : ''}`}
                </Text>
              </View>
              <ChevronRight size={18} color={DAY.inkDim} strokeWidth={2.2} />
            </Pressable>
          </View>
        );
      })}

      {(more > 0 || open) && (
        <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" style={hc.more}>
          <Text style={hc.moreText}>{open ? 'Show less' : `Show all (${pending.length + done.length})`}</Text>
          {open ? <ChevronUp size={16} color={DAY.violet} strokeWidth={2.4} /> : <ChevronDown size={16} color={DAY.violet} strokeWidth={2.4} />}
        </Pressable>
      )}
      <HomeworkDetail item={items.find((x) => x.id === detailId) || null} onClose={() => setDetailId(null)} onToggle={toggle}
        onSaved={(saved) => setItems((all) => all.map((x) => (x.id === saved.id ? saved : x)))} />
    </View>
  );
}

// One homework item, full page: everything the teacher wrote (and their photos), then
// "Your work": the student writes an answer and/or adds photos and submits. After that
// it shows "waiting for your teacher", then "Checked" with the teacher's comment.
function HomeworkDetail({ item, onClose, onToggle, onSaved }) {
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const [images, setImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const sub = item && item.submission;
  const handedIn = !!(sub && sub.submittedAt);

  // Each time an item opens: start from what was handed in (or a kept draft).
  React.useEffect(() => {
    if (!item) return;
    setNote(sub ? sub.note : ''); setImages(sub ? sub.images : []);
    setEditing(!handedIn); setError(null); setSending(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item && item.id]);

  if (!item) return null;
  const due = dueLabel(item, Date.now());
  const given = item.givenAt ? shortDateKey(istKey(new Date(item.givenAt).getTime())) : null;
  const handedOn = handedIn ? shortDateKey(istKey(new Date(sub.submittedAt).getTime())) : null;
  const canSend = (note.trim().length > 0 || images.length > 0) && !sending;

  async function send() {
    if (!canSend) return;
    setSending(true); setError(null);
    try {
      const saved = await submitHomework(item.id, { note: note.trim(), images });
      onSaved(saved);
      setEditing(false);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not submit. Try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[hd.page, { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={hd.bar}>
            <Text style={hd.barTitle}>Homework</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={hd.close}>
              <X size={20} color={DAY.ink} strokeWidth={2.4} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={hd.body} keyboardShouldPersistTaps="handled">
            <Text style={hd.subject}>{String(item.subject || '').toUpperCase()}</Text>
            <Text style={hd.title}>{item.title}</Text>
            <View style={[hd.chip, { backgroundColor: TONE_BG[item.checkedAt ? 'done' : handedIn ? 'soon' : due.tone] }]}>
              <Text style={[hd.chipText, { color: TONE[item.checkedAt ? 'done' : handedIn ? 'soon' : due.tone] }]}>
                {item.checkedAt ? 'Checked by your teacher' : handedIn ? `Submitted on ${handedOn}` : item.status === 'done' ? 'Marked done' : due.text}
              </Text>
            </View>
            <View style={hd.facts}>
              <View style={hd.fact}><User size={16} color={DAY.inkSoft} strokeWidth={2.2} /><Text style={hd.factText}>From {item.teacherName || 'your teacher'}</Text></View>
              {!!given && <View style={hd.fact}><CalendarDays size={16} color={DAY.inkSoft} strokeWidth={2.2} /><Text style={hd.factText}>Given on {given}</Text></View>}
              <View style={hd.fact}><CalendarDays size={16} color={DAY.inkSoft} strokeWidth={2.2} /><Text style={hd.factText}>Due {shortDateKey(item.dueOn)}</Text></View>
            </View>

            <Text style={hd.label}>WHAT TO DO</Text>
            <Text style={hd.details}>{item.details ? item.details : 'Your teacher did not add more details. Ask them in your next class if anything is unclear.'}</Text>
            {item.images && item.images.length > 0 && (
              <View style={{ marginTop: 12 }}><PhotoRow images={item.images} size={92} /></View>
            )}

            {!!item.checkedAt && (
              <View style={hd.checked}>
                <Text style={hd.checkedTitle}>Checked by {item.teacherName || 'your teacher'}</Text>
                {!!item.teacherComment && <Text style={hd.checkedText}>“{item.teacherComment}”</Text>}
              </View>
            )}

            <Text style={hd.label}>YOUR WORK</Text>
            {editing ? (
              <>
                <TextInput
                  value={note} onChangeText={(t) => setNote(t.slice(0, 4000))}
                  placeholder="Write your answer here, or add photos of your notebook"
                  placeholderTextColor={DAY.inkDim} multiline textAlignVertical="top" style={hd.input}
                />
                <View style={{ marginTop: 12 }}><PhotoPicker value={images} onChange={setImages} label="Add photo of your work" /></View>
                {!!error && <Text style={hd.error}>{error}</Text>}
              </>
            ) : (
              <View style={hd.work}>
                {!!(sub && sub.note) && <Text style={hd.workNote}>{sub.note}</Text>}
                {sub && sub.images.length > 0 && <View style={{ marginTop: sub.note ? 10 : 0 }}><PhotoRow images={sub.images} /></View>}
                {!item.checkedAt && <Text style={hd.waiting}>Waiting for your teacher to check it.</Text>}
                <Pressable onPress={() => setEditing(true)} accessibilityRole="button" style={hd.editLink}>
                  <Pencil size={14} color={DAY.violet} strokeWidth={2.4} />
                  <Text style={hd.editText}>Change and submit again</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {editing ? (
            <View style={{ gap: 10 }}>
              <Pressable onPress={send} disabled={!canSend} accessibilityRole="button"
                style={({ pressed }) => [hd.done, !canSend && hd.doneOff, pressed && canSend && { opacity: 0.85 }]}>
                {sending ? <ActivityIndicator color="#fff" /> : <Send size={18} color={canSend ? '#fff' : DAY.inkDim} strokeWidth={2.4} />}
                <Text style={[hd.doneText, !canSend && { color: DAY.inkDim }]}>{handedIn ? 'Submit again' : 'Submit work'}</Text>
              </Pressable>
              {!handedIn && (
                <Pressable onPress={() => onToggle(item)} accessibilityRole="button" hitSlop={6} style={hd.plain}>
                  <Text style={hd.plainText}>{item.status === 'done' ? 'Mark as not done' : 'Just mark as done (no answer to send)'}</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Pressable onPress={() => onToggle(item)} accessibilityRole="button" style={({ pressed }) => [hd.done, hd.undo, pressed && { opacity: 0.85 }]}>
              <CircleCheck size={20} color={DAY.green} strokeWidth={2.4} />
              <Text style={[hd.doneText, { color: DAY.green }]}>Done · tap to undo</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const TONE_BG = { overdue: DAY.redSoft, today: DAY.amberSoft, soon: DAY.violetSoft, later: DAY.cardSoft, done: DAY.greenSoft };

const hd = StyleSheet.create({
  page: { flex: 1, backgroundColor: DAY.bg, paddingHorizontal: 20 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  barTitle: { fontFamily: F.xbold, fontSize: 18, color: DAY.ink },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: DAY.cardSoft, alignItems: 'center', justifyContent: 'center' },
  body: { paddingTop: 12, paddingBottom: 24 },
  subject: { fontFamily: F.bold, fontSize: 12, color: DAY.violet, letterSpacing: 1.1 },
  title: { fontFamily: F.xbold, fontSize: 22, color: DAY.ink, marginTop: 6, lineHeight: 29 },
  chip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginTop: 12 },
  chipText: { fontFamily: F.bold, fontSize: 13 },
  facts: { marginTop: 18, gap: 8, padding: 14, borderRadius: 16, backgroundColor: DAY.cardSoft },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factText: { fontFamily: F.semi, fontSize: 14, color: DAY.ink },
  label: { fontFamily: F.bold, fontSize: 11, color: DAY.violet, marginTop: 24, letterSpacing: 1.1 },
  details: { fontFamily: F.reg, fontSize: 16, color: DAY.ink, lineHeight: 24, marginTop: 6 },
  done: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 16, backgroundColor: '#000' },
  undo: { backgroundColor: DAY.greenSoft },
  doneText: { fontFamily: F.bold, fontSize: 16, color: '#fff' },
  doneOff: { backgroundColor: DAY.cardSoft },
  plain: { alignItems: 'center', paddingVertical: 4 },
  plainText: { fontFamily: F.semi, fontSize: 13, color: DAY.inkSoft, textDecorationLine: 'underline' },
  input: { minHeight: 110, marginTop: 8, borderRadius: 16, borderWidth: 1, borderColor: DAY.cardEdge, backgroundColor: DAY.cardSoft, padding: 14, fontFamily: F.reg, fontSize: 15, color: DAY.ink },
  error: { fontFamily: F.semi, fontSize: 13, color: DAY.red, marginTop: 10 },
  work: { marginTop: 8, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: DAY.cardEdge },
  workNote: { fontFamily: F.reg, fontSize: 15, color: DAY.ink, lineHeight: 22 },
  waiting: { fontFamily: F.semi, fontSize: 13, color: DAY.violet, marginTop: 12 },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  editText: { fontFamily: F.bold, fontSize: 13, color: DAY.violet },
  checked: { marginTop: 18, padding: 14, borderRadius: 16, backgroundColor: DAY.greenSoft },
  checkedTitle: { fontFamily: F.bold, fontSize: 14, color: DAY.green },
  checkedText: { fontFamily: F.reg, fontSize: 15, color: DAY.ink, marginTop: 6, lineHeight: 22 },
});

const hc = StyleSheet.create({
  card: {
    backgroundColor: DAY.card, borderRadius: 20, borderWidth: 1, borderColor: DAY.cardEdge, padding: 16, marginTop: 16,
    borderLeftWidth: 4, borderLeftColor: DAY.violet,
    shadowColor: DAY.shadow, shadowOpacity: DAY.shadowOpacity, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: DAY.violetSoft, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: F.bold, fontSize: 11, color: DAY.violet, letterSpacing: 1.1 },
  title: { fontFamily: F.xbold, fontSize: 15, color: DAY.ink, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: DAY.cardEdge },
  tick: { paddingTop: 1 },
  itemTitle: { fontFamily: F.bold, fontSize: 14, color: DAY.ink, lineHeight: 19 },
  itemDone: { color: DAY.inkDim, textDecorationLine: 'line-through' },
  details: { fontFamily: F.reg, fontSize: 12.5, color: DAY.inkSoft, marginTop: 2, lineHeight: 17 },
  meta: { fontFamily: F.reg, fontSize: 12, color: DAY.inkSoft, marginTop: 4 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: DAY.cardEdge },
  moreText: { fontFamily: F.bold, fontSize: 13, color: DAY.violet },
});
