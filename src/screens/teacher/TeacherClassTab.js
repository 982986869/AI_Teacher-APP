// src/screens/teacher/TeacherClassTab.js
// "My class": one card per student (pair) — next lesson, homework progress, the room
// link, and quick ways to give homework or see this student's homework.
import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Share } from 'react-native';
import { Link2, Plus, ListChecks } from 'lucide-react-native';
import { SPACING, RADIUS } from '../../theme/designSystem';
import { T, F, CARD, EYEBROW } from './teacherTheme';
import { whenText } from './teacherTime';

// students: GET /api/teaching/class rows.
export default function TeacherClassTab({ students, now, onGive, onSeeHomework }) {
  if (!students.length) {
    return (
      <View style={cl.empty}>
        <Text style={cl.emptyTitle}>No students yet</Text>
        <Text style={cl.emptyText}>Students appear here once an admin assigns them to you.</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: SPACING.md }}>
      {students.map((s) => {
        const { given, done, overdue } = s.homework || { given: 0, done: 0, overdue: 0 };
        const pct = given ? Math.round((done / given) * 100) : 0;
        return (
          <View key={s.assignmentId} style={cl.card}>
            <View style={cl.top}>
              <View style={cl.avatar}><Text style={cl.avatarText}>{initials(s.studentName)}</Text></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={cl.name} numberOfLines={1}>{s.studentName}</Text>
                <Text style={cl.sub} numberOfLines={1}>{s.subject} · Class {s.classLevel}</Text>
              </View>
            </View>

            <Text style={cl.next}>{s.nextLessonAt ? `Next lesson: ${whenText({ startsAt: s.nextLessonAt }, now)}` : 'No lesson booked'}</Text>

            <View style={cl.hwRow}>
              <Text style={cl.hwLabel}>Homework</Text>
              <Text style={cl.hwCount}>{given ? `${done} of ${given} done` : 'none given yet'}</Text>
              {overdue > 0 && <Text style={cl.overdue}>{overdue} overdue</Text>}
            </View>
            {given > 0 && (
              <View style={cl.track} accessibilityLabel={`${done} of ${given} homework done`}>
                <View style={[cl.fill, { width: `${pct}%` }]} />
              </View>
            )}

            <View style={cl.actions}>
              {s.roomLink ? (
                <Pressable onPress={() => Linking.openURL(s.roomLink).catch(() => {})}
                  onLongPress={() => Share.share({ message: s.roomLink, title: `Room · ${s.studentName}` }).catch(() => {})}
                  accessibilityRole="link" accessibilityLabel={`Open the room for ${s.studentName}. Long press to share the link.`}
                  style={({ pressed }) => [cl.btn, cl.btnRoom, pressed && { opacity: 0.7 }]}>
                  <Link2 size={15} color={T.ink} strokeWidth={2.4} />
                  <Text style={cl.btnText}>Room</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => onGive(s.assignmentId)} accessibilityRole="button" accessibilityLabel={`Give homework to ${s.studentName}`}
                style={({ pressed }) => [cl.btn, cl.btnInk, pressed && { opacity: 0.85 }]}>
                <Plus size={15} color={T.white} strokeWidth={2.6} />
                <Text style={[cl.btnText, { color: T.white }]}>Homework</Text>
              </Pressable>
              {given > 0 && (
                <Pressable onPress={() => onSeeHomework(s.assignmentId)} accessibilityRole="button" accessibilityLabel={`See ${s.studentName}'s homework`}
                  style={({ pressed }) => [cl.btn, pressed && { opacity: 0.7 }]}>
                  <ListChecks size={15} color={T.ink} strokeWidth={2.4} />
                  <Text style={cl.btnText}>See all</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const cl = StyleSheet.create({
  card: { ...CARD, padding: SPACING.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 4 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.violetSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: F.xbold, fontSize: 15, color: T.violet },
  name: { fontFamily: F.bold, fontSize: 16, color: T.ink },
  sub: { fontFamily: F.reg, fontSize: 13, color: T.soft, marginTop: 1 },
  next: { fontFamily: F.semi, fontSize: 13, color: T.violet, marginTop: SPACING.sm + 4 },
  hwRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: SPACING.sm + 2 },
  hwLabel: { fontFamily: F.bold, fontSize: 13, color: T.ink },
  hwCount: { fontFamily: F.med, fontSize: 13, color: T.soft },
  overdue: { fontFamily: F.bold, fontSize: 13, color: T.red, marginLeft: 'auto' },
  track: { height: 8, borderRadius: 4, backgroundColor: T.fill, marginTop: 6, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: T.green },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 14, borderRadius: RADIUS.full, borderWidth: 1, borderColor: T.edge, backgroundColor: T.card },
  btnRoom: { backgroundColor: T.yellowSoft, borderColor: T.yellowEdge },
  btnInk: { backgroundColor: T.black, borderColor: T.black },
  btnText: { fontFamily: F.bold, fontSize: 13, color: T.ink },
  empty: { ...CARD, padding: SPACING.lg, alignItems: 'center' },
  emptyTitle: { fontFamily: F.bold, fontSize: 16, color: T.ink },
  emptyText: { fontFamily: F.reg, fontSize: 14, color: T.soft, marginTop: 4, textAlign: 'center' },
});
