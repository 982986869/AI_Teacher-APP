// src/screens/teacher/TeacherHomeworkTab.js
// The teacher's homework: give new work, filter by student, see what is still to do
// (overdue first) and what is done. Tapping an item opens it for editing.
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Plus, CircleCheck, Circle, CircleAlert, Images } from 'lucide-react-native';
import { SPACING, RADIUS } from '../../theme/designSystem';
import { T, F, CARD, EYEBROW } from './teacherTheme';
import { dueLabel, shortDateKey, istKey } from './teacherTime';

export const TONE = {
  overdue: { fg: T.red, bg: T.redSoft },
  today: { fg: T.amber, bg: T.amberSoft },
  soon: { fg: T.violet, bg: T.yellowSoft },
  later: { fg: T.soft, bg: T.fill },
  done: { fg: T.green, bg: T.greenSoft },
  submitted: { fg: T.violet, bg: T.violetSoft },
};

// homework: the teacher's items. students: their pairs. filter: an assignmentId or null.
export default function TeacherHomeworkTab({ homework, students, filter, onFilter, onGive, onEdit, now }) {
  const shown = filter ? homework.filter((h) => h.assignmentId === filter) : homework;
  const todo = shown.filter((h) => h.status !== 'done');
  const done = shown.filter((h) => h.status === 'done');
  const overdue = todo.filter((h) => h.overdue || h.dueOn < istKey(now)).length;

  return (
    <View>
      <Pressable onPress={() => onGive(filter)} disabled={!students.length} accessibilityRole="button"
        style={({ pressed }) => [hw.give, !students.length && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}>
        <Plus size={18} color={T.white} strokeWidth={2.6} />
        <Text style={hw.giveText}>Give homework</Text>
      </Pressable>

      {students.length > 1 && (
        <View style={hw.filters}>
          <FilterChip label="All students" on={!filter} onPress={() => onFilter(null)} />
          {students.map((s) => (
            <FilterChip key={s.assignmentId} label={`${s.studentName} · ${s.subject}`} on={filter === s.assignmentId} onPress={() => onFilter(s.assignmentId)} />
          ))}
        </View>
      )}

      {!shown.length ? (
        <View style={hw.emptyCard}>
          <Text style={hw.emptyTitle}>No homework yet</Text>
          <Text style={hw.emptyText}>{students.length ? 'Tap "Give homework" to set work for a student.' : 'Homework can be given once students are assigned to you.'}</Text>
        </View>
      ) : (
        <>
          <ListHead title="To do" count={todo.length} extra={overdue ? `${overdue} overdue` : null} />
          <View style={hw.card}>
            {!todo.length && <Text style={hw.none}>All caught up.</Text>}
            {todo.map((h, i) => <Item key={h.id} h={h} now={now} last={i === todo.length - 1} onPress={() => onEdit(h)} />)}
          </View>
          {done.length > 0 && (
            <>
              <ListHead title="Done" count={done.length} />
              <View style={hw.card}>
                {done.map((h, i) => <Item key={h.id} h={h} now={now} last={i === done.length - 1} onPress={() => onEdit(h)} />)}
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}

function Item({ h, now, last, onPress }) {
  const due = dueLabel(h, now);
  // Once work is handed in, that (and whether it is checked) is what the teacher needs.
  const handedIn = !!(h.submission && h.submission.submittedAt);
  const state = h.checkedAt ? { text: 'Checked', tone: 'done' } : handedIn ? { text: 'Submitted · check it', tone: 'submitted' } : null;
  const tone = TONE[state ? state.tone : due.tone];
  const photos = (h.images || []).length + (handedIn ? h.submission.images.length : 0);
  const Icon = h.status === 'done' ? CircleCheck : due.tone === 'overdue' ? CircleAlert : Circle;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${h.title}, ${h.studentName}, ${due.text}. Tap to edit.`}
      style={({ pressed }) => [hw.item, last && { borderBottomWidth: 0 }, pressed && { opacity: 0.7 }]}>
      <Icon size={20} color={tone.fg} strokeWidth={2.2} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[hw.itemTitle, h.status === 'done' && hw.itemDone]} numberOfLines={2}>{h.title}</Text>
        <Text style={hw.itemSub} numberOfLines={1}>{h.studentName} · {h.subject}</Text>
        {!!h.details && <Text style={hw.itemDetails} numberOfLines={2}>{h.details}</Text>}
        {photos > 0 && (
          <View style={hw.photos}>
            <Images size={13} color={T.soft} strokeWidth={2.2} />
            <Text style={hw.photosText}>{photos} photo{photos === 1 ? '' : 's'}{handedIn && h.submission.images.length ? ' · from the student' : ''}</Text>
          </View>
        )}
      </View>
      <View style={[hw.due, { backgroundColor: tone.bg }]}>
        <Text style={[hw.dueText, { color: tone.fg }]} numberOfLines={2}>
          {state ? state.text : h.status === 'done' && h.doneAt ? `Done ${shortDateKey(istKey(new Date(h.doneAt).getTime()))}` : due.text}
        </Text>
      </View>
    </Pressable>
  );
}

function FilterChip({ label, on, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: on }} style={[hw.chip, on && hw.chipOn]}>
      <Text style={[hw.chipText, on && hw.chipTextOn]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function ListHead({ title, count, extra }) {
  return (
    <View style={hw.listHead}>
      <Text style={hw.listTitle}>{title}</Text>
      <Text style={hw.listCount}>{count}</Text>
      {!!extra && <Text style={hw.listExtra}>{extra}</Text>}
    </View>
  );
}

const hw = StyleSheet.create({
  give: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, backgroundColor: T.black, marginBottom: SPACING.md },
  giveText: { fontFamily: F.bold, fontSize: 16, color: T.white },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: T.card, borderWidth: 1, borderColor: T.edge, maxWidth: '100%' },
  chipOn: { backgroundColor: T.black, borderColor: T.black },
  chipText: { fontFamily: F.semi, fontSize: 13, color: T.ink },
  chipTextOn: { color: T.white },
  listHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm, marginTop: SPACING.xs },
  listTitle: { fontFamily: F.xbold, fontSize: 17, color: T.ink },
  listCount: { fontFamily: F.semi, fontSize: 13, color: T.dim },
  listExtra: { fontFamily: F.bold, fontSize: 13, color: T.red, marginLeft: 'auto' },
  card: { ...CARD, paddingHorizontal: SPACING.md, marginBottom: SPACING.lg },
  photos: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  photosText: { fontFamily: F.semi, fontSize: 12, color: T.soft },
  none: { fontFamily: F.med, fontSize: 14, color: T.soft, paddingVertical: SPACING.md },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm + 4, paddingVertical: SPACING.sm + 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: T.edge },
  itemTitle: { fontFamily: F.semi, fontSize: 15, color: T.ink },
  itemDone: { color: T.dim, textDecorationLine: 'line-through' },
  itemSub: { fontFamily: F.reg, fontSize: 13, color: T.soft, marginTop: 2 },
  itemDetails: { fontFamily: F.reg, fontSize: 13, color: T.dim, marginTop: 3 },
  due: { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 116 },
  dueText: { fontFamily: F.bold, fontSize: 12, textAlign: 'center' },
  emptyCard: { ...CARD, padding: SPACING.lg, alignItems: 'center' },
  emptyTitle: { fontFamily: F.bold, fontSize: 16, color: T.ink },
  emptyText: { fontFamily: F.reg, fontSize: 14, color: T.soft, marginTop: 4, textAlign: 'center' },
});
