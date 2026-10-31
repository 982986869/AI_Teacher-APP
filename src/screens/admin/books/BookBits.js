// src/screens/admin/books/BookBits.js
// Pieces shared by the personalized-section screens.

import React, { useEffect, useRef } from 'react';
import { View, Animated, Pressable } from 'react-native';
import { NotebookPen, Library, PencilRuler, ListChecks } from 'lucide-react-native';
import { S } from '../ui/kit';

/**
 * The pill switch used by all three gates — book, chapter, section — so they
 * read as one mechanism rather than three unrelated controls.
 *
 * Hand-rolled rather than RN's Switch: the platform control cannot be coloured
 * consistently across Android and iOS, and these three need to look identical to
 * be understood as the same thing.
 */
export function Switch({ on, onChange, disabled, label }) {
  const x = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(x, {
      toValue: on ? 1 : 0, duration: 190, useNativeDriver: true,
    }).start();
  }, [on, x]);

  return (
    <Pressable
      onPress={() => !disabled && onChange(!on)}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled: !!disabled }}
      accessibilityLabel={label}
      style={{
        width: 46, height: 27, borderRadius: 99, padding: 3, flexShrink: 0,
        backgroundColor: on ? S.emerald : S.border,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Animated.View
        style={{
          width: 21, height: 21, borderRadius: 999, backgroundColor: '#FFFFFF',
          shadowColor: '#1A1B45', shadowOpacity: 0.3, shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 }, elevation: 2,
          transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 19] }) }],
        }}
      />
    </Pressable>
  );
}

/**
 * The four sub-sections, in the order an admin works through them: read the
 * material, collect what to keep, practise, then test.
 *
 * `unit` names what the count counts — the real shape of the payload, so the
 * number on screen can never claim something the content does not contain.
 */
export const SECTIONS = [
  { kind: 'notes', label: 'Notes', Icon: NotebookPen, toneKey: 'indigo', unit: 'sections', blurb: 'Summary, sections and key terms' },
  { kind: 'resource', label: 'Resources', Icon: Library, toneKey: 'emerald', unit: 'items', blurb: 'Formulae, diagrams, definitions' },
  { kind: 'practice', label: 'Practice', Icon: PencilRuler, toneKey: 'orange', unit: 'questions', blurb: 'Written questions with answers' },
  { kind: 'quiz', label: 'Quiz', Icon: ListChecks, toneKey: 'purple', unit: 'questions', blurb: 'Multiple choice, auto-graded' },
];

export const sectionFor = (kind) => SECTIONS.find((s) => s.kind === kind) || SECTIONS[0];

export const kChars = (n) =>
  n == null ? '' : n >= 1000 ? `${Math.round(n / 1000)}k chars` : `${n} chars`;

/** A thin divider that does not pretend to be a border. */
export function Hair({ style }) {
  return <View style={[{ height: 1, backgroundColor: S.hair }, style]} />;
}
