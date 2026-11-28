// src/components/MyClassesCard.js
// The student's live classes with their teacher, on Home: teacher · subject, the next
// class, and Join — the pair's permanent room link, open from 10 minutes before the class
// until it ends (the same rule the teacher has). Hidden when the student has no teacher.
// Data: GET /api/my-classes (only this student's own pairs).
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Video, GraduationCap } from 'lucide-react-native';
import { getMyClasses } from '../api/teachingApi';
import { lessonState, whenText, timeIST } from '../screens/teacher/teacherTime';
import { DAY, DFONT as F } from '../theme/dayTheme';

const TICK_MS = 20 * 1000;

export default function MyClassesCard() {
  const [classes, setClasses] = useState(null);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(() => {
    let alive = true;
    // Best-effort: a failed load just hides the card.
    getMyClasses().then((list) => { if (alive) { setClasses(list); setNow(Date.now()); } }).catch(() => { if (alive) setClasses([]); });
    return () => { alive = false; };
  }, []);
  useFocusEffect(load);
  // Join must open on time while the student sits on Home.
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), TICK_MS); return () => clearInterval(t); }, []);

  if (!classes || !classes.length) return null;

  return (
    <View style={mc.card}>
      <View style={mc.head}>
        <View style={mc.icon}><GraduationCap size={20} color={DAY.green} strokeWidth={2} /></View>
        <View style={{ flex: 1 }}>
          <Text style={mc.eyebrow}>YOUR CLASSES</Text>
          <Text style={mc.title}>{classes.length === 1 ? `With ${classes[0].teacherName}` : `${classes.length} teachers`}</Text>
        </View>
      </View>

      {classes.map((c) => {
        const l = c.next;
        const state = l ? lessonState(l, now) : null;
        const live = state === 'joinable' && !!c.roomLink;
        return (
          <View key={c.assignmentId} style={mc.row}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={mc.subject} numberOfLines={1}>{c.subject} <Text style={mc.teacher}>· {c.teacherName}</Text></Text>
              <Text style={[mc.when, live && { color: DAY.green }]} numberOfLines={1}>
                {l ? `${live ? 'Live now · ' : 'Next class '}${whenText(l, now)}` : 'No class booked yet'}
              </Text>
              {l && <Text style={mc.time} numberOfLines={1}>{timeIST(l.startsAt)} – {timeIST(l.endsAt)}</Text>}
            </View>
            {l && (
              <Pressable
                onPress={() => live && Linking.openURL(c.roomLink).catch(() => {})}
                disabled={!live}
                accessibilityRole="button"
                accessibilityState={{ disabled: !live }}
                accessibilityLabel={live ? `Join your ${c.subject} class with ${c.teacherName}` : `Join opens at ${timeIST(l.joinOpensAt)}`}
                style={({ pressed }) => [mc.join, live ? mc.joinOn : mc.joinOff, pressed && live && { opacity: 0.85 }]}
              >
                {live && <Video size={15} color="#fff" strokeWidth={2.4} />}
                <Text style={[mc.joinText, !live && { color: DAY.inkDim }]}>{live ? 'Join' : `Opens ${timeIST(l.joinOpensAt)}`}</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const mc = StyleSheet.create({
  card: {
    backgroundColor: DAY.card, borderRadius: 20, borderWidth: 1, borderColor: DAY.cardEdge, padding: 16, marginTop: 16,
    borderLeftWidth: 4, borderLeftColor: DAY.green,
    shadowColor: DAY.shadow, shadowOpacity: DAY.shadowOpacity, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: DAY.greenSoft, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: F.bold, fontSize: 11, color: DAY.green, letterSpacing: 1.1 },
  title: { fontFamily: F.xbold, fontSize: 15, color: DAY.ink, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: DAY.cardEdge },
  subject: { fontFamily: F.bold, fontSize: 14, color: DAY.ink },
  teacher: { fontFamily: F.reg, color: DAY.inkSoft },
  when: { fontFamily: F.semi, fontSize: 12, color: DAY.inkSoft, marginTop: 3 },
  time: { fontFamily: F.reg, fontSize: 12, color: DAY.inkSoft, marginTop: 1 },
  join: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 14, borderRadius: 999 },
  joinOn: { backgroundColor: '#000' },
  joinOff: { backgroundColor: DAY.cardSoft },
  joinText: { fontFamily: F.bold, fontSize: 13, color: '#fff' },
});
