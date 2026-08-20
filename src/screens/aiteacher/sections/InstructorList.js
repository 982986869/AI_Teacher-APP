// src/screens/aiteacher/sections/InstructorList.js
// "YOUR DEDICATED INSTRUCTOR" — a vertical stack, one card per instructor: portrait,
// an amber role eyebrow, the name, and the link into that coach's settings.
//
// A LIST rather than a single card, because the design draws two. The placeholder data
// therefore ships two entries so the page reads like the mockup; with real data the
// stack is however many coaches the student has.
//
// TODO(wire): the portrait should come from src/components/teacher/teacherIdentity.js
// (TEACHER_HEADSHOT) once this page is routed — it is a require()'d local asset, so it
// is passed in as `photo` rather than imported here, and the section stays a pure
// renderer that works with a remote { uri } just as well.
import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { AIT } from '../../../theme/aiTeacherTheme';
import { T, Eyebrow, PAD, cardSurface } from './ui';

// TODO(wire): placeholder roster — replace with the student's real coaches.
export const DEFAULT_INSTRUCTORS = [
  { id: 'nova',   name: 'Ms. Nova', role: 'Your AI Teacher', photo: null },
  { id: 'nova-2', name: 'Ms. Nova', role: 'Your AI Teacher', photo: null },
];

function InstructorCard({ instructor, onPress }) {
  const { name, role, photo } = instructor;
  return (
    <View style={s.card}>
      <View style={s.portrait}>
        {photo
          ? <Image source={photo} style={s.portraitImg} resizeMode="cover" />
          : <T w="xbold" s={20} c={AIT.inkMuted}>{(name || '?').trim().charAt(0).toUpperCase()}</T>}
      </View>

      <View style={s.body}>
        <Eyebrow style={{ color: AIT.accent }}>{role}</Eyebrow>
        <T w="bold" s={18} numberOfLines={1}>{name}</T>

        {/* The link is its own Pressable, not the whole card: the design gives the row a
            single explicit affordance, and making the card tappable too would leave two
            targets that do the same thing with different hit areas. */}
        <Pressable
          onPress={onPress}
          hitSlop={8}
          style={s.link}
          accessibilityRole="button"
          accessibilityLabel={`Customize coach settings for ${name}`}
        >
          <T w="semi" s={13} c={AIT.accent}>Customize Coach Settings</T>
          <ChevronRight size={14} color={AIT.accent} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

export default function InstructorList({
  instructors = DEFAULT_INSTRUCTORS,
  onCustomize = () => {},
}) {
  if (!instructors?.length) return null;

  return (
    <View style={s.wrap}>
      <Eyebrow style={s.label}>Your dedicated instructor</Eyebrow>

      <View style={s.stack}>
        {instructors.map((it, i) => (
          <InstructorCard
            key={it.id || `${it.name}-${i}`}
            instructor={it}
            onPress={() => onCustomize(it)}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingTop: 20, gap: 10 },
  label: { paddingHorizontal: PAD },
  stack: { paddingHorizontal: PAD, gap: 12 },

  card: {
    ...cardSurface,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 12,
  },
  portrait: {
    width: 68, height: 68, borderRadius: 12, overflow: 'hidden',
    backgroundColor: AIT.field, alignItems: 'center', justifyContent: 'center',
  },
  portraitImg: { width: '100%', height: '100%' },
  body: { flex: 1, minWidth: 0, gap: 3 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
});
