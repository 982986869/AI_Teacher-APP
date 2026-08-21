// src/screens/profile/LearningPreferencesScreen.js
// "How I Learn" — the Learning Preferences sheet, opened from the Profile screen's
// SETTINGS row. Four answer sections over a sticky "Save Preferences" footer.
//
// The whole sheet is ONE value: users.learning_prefs, a JSONB blob shaped
//   { goals: string[], subjects: string[], style: string|null, difficulty: string|null }
// written whole by PATCH /api/auth/profile (prisma/sql/user_profile_fields.sql). It is
// stored, and this screen prefills from it, but NOTHING READS IT YET — the AI Teacher
// still picks its register from TEACHING_MODES in src/api/aiApi.js. Wiring these answers
// into lesson generation is the next piece of work, not this file's.
//
// Values marked "Figma" are lifted verbatim from the design's property panels.
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calculator, Atom, BookOpen, Landmark, Palette } from 'lucide-react-native';

import { P, PAD } from './theme';
import { T, Eyebrow, ScreenHeader, StickyFooter } from './ui';

// ── the answer sets ──────────────────────────────────────────────────────────
// Goals and styles are the design's own wording, verbatim. Keys are stable slugs, so
// re-labelling a chip later does not orphan every student who already picked it.
const GOALS = [
  { key: 'grades',   label: 'Improve my grades' },
  { key: 'concepts', label: 'Understand concepts better' },
  { key: 'exams',    label: 'Prepare for exams' },
  { key: 'homework', label: 'Complete homework' },
  { key: 'ahead',    label: 'Learn ahead' },
];

// The design draws five subjects with a small icon each. The icon layers were not
// exported, so the glyphs and their tints are matched to the screenshot rather than
// specified — TODO(figma): confirm against the real icon layer.
const SUBJECTS = [
  { key: 'math',    label: 'Math',    Icon: Calculator, tint: '#2F63E8' },
  { key: 'science', label: 'Science', Icon: Atom,       tint: '#7C3AED' },
  { key: 'english', label: 'English', Icon: BookOpen,   tint: '#111111' },
  { key: 'history', label: 'History', Icon: Landmark,   tint: '#111111' },
  { key: 'art',     label: 'Art',     Icon: Palette,    tint: '#111111' },
];

const STYLES = [
  { key: 'stepwise',  emoji: '\u{1F6B6}', label: 'Step-by-step' },
  { key: 'visual',    emoji: '\u{1F9E0}', label: 'Visual explanations' },
  { key: 'realworld', emoji: '\u{1F30D}', label: 'Real-life examples' },
  { key: 'practice',  emoji: '\u{1F4DD}', label: 'Practice first' },
];

// The fourth section. The design's frame reserves 157px for it below LEARNING STYLE and
// the screenshot cuts off mid-word at "DIFFICULT…", so the heading is near-certain and
// the chips are NOT — these three are placeholders standing in for the real answers.
// TODO(figma): replace once that section's panels are exported.
const DIFFICULTY = [
  { key: 'gentle',    label: 'Start gentle' },
  { key: 'grade',     label: 'Match my class' },
  { key: 'challenge', label: 'Challenge me' },
];

// ── chips ────────────────────────────────────────────────────────────────────
// Figma: h37 (10 padding + 17 line + 10), radius 20, padding 10/16.
//   selected — #FFF4CC on 1px #FFC629, label Inter 600 14 #111111, drop shadow
//   plain    — #F5F5F5 on 1px #E5E7EB, label Inter 500 14 #666666, no shadow
function Chip({ label, on, onPress, Icon, tint, a11yPrefix }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.chip, on ? s.chipOn : s.chipOff, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={a11yPrefix + ': ' + label}
    >
      {!!Icon && <Icon size={16} color={on ? tint : P.inkSoft} strokeWidth={2.2} />}
      <T w={on ? 'semi' : 'med'} s={14} c={on ? P.ink : P.inkSoft}>{label}</T>
    </Pressable>
  );
}

// Figma: style-grid — fill, gap 12, two cards per row (171 + 12 + 171 = 354). Card:
// radius 12, 1px border, padding 12, gap 6; emoji Inter 400 18; label Inter 600 13.
// That 171 is exactly half of this design's own 354, so the port halves the row rather
// than hardcoding it — the pair has to fill the row on every width, not just a 402pt one.
function StyleCard({ item, on, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.styleCard, on ? s.selected : s.plain, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={'Learning style: ' + item.label}
    >
      <T w="reg" s={18} c="#000000" style={{ lineHeight: 22 }}>{item.emoji}</T>
      <T w="semi" s={13} c={on ? P.ink : P.inkSoft}>{item.label}</T>
    </Pressable>
  );
}

// Figma: goals-section / subjects-section — vertical, gap 10.
function Section({ title, children }) {
  return (
    <View style={{ gap: 10 }}>
      <Eyebrow>{title}</Eyebrow>
      {children}
    </View>
  );
}

const toggle = (list, key) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
const sameList = (a, b) => {
  if (a.length !== b.length) return false;
  const x = [...a].sort();
  const y = [...b].sort();
  return x.every((v, i) => v === y[i]);
};

export default function LearningPreferencesScreen({ initial, onBack, onSave }) {
  const insets = useSafeAreaInsets();

  // Seeded once from what the server already has. `initial` is user.learningPrefs, which
  // is null for anyone who has never opened this screen — hence every fallback.
  const [goals, setGoals]           = useState(() => (Array.isArray(initial?.goals) ? initial.goals : []));
  const [subjects, setSubjects]     = useState(() => (Array.isArray(initial?.subjects) ? initial.subjects : []));
  const [style, setStyle]           = useState(() => initial?.style || null);
  const [difficulty, setDifficulty] = useState(() => initial?.difficulty || null);
  const [saving, setSaving]         = useState(false);

  // The CTA stays disabled until something actually changed, so "Save Preferences" never
  // fires a PATCH that would write back exactly what is already there.
  const dirty = useMemo(() => {
    const wasGoals = Array.isArray(initial?.goals) ? initial.goals : [];
    const wasSubjects = Array.isArray(initial?.subjects) ? initial.subjects : [];
    return !(sameList(wasGoals, goals)
      && sameList(wasSubjects, subjects)
      && (initial?.style || null) === style
      && (initial?.difficulty || null) === difficulty);
  }, [initial, goals, subjects, style, difficulty]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave({ goals, subjects, style, difficulty });
      onBack();
    } catch (e) {
      Alert.alert(
        'Couldn’t save preferences',
        e?.response?.data?.error || e?.response?.data?.message || e?.message
          || 'Please check your connection and try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={P.page} />
      <View style={{ paddingTop: insets.top }} />

      <ScreenHeader
        title="How I Learn"
        subtitle="Help your AI Teacher understand the best way to teach you."
        onBack={onBack}
      />

      {/* Figma: screen-body — padding L/R 24, gap 20. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
      >
        <Section title="My Learning Goals">
          <View style={s.chipsGrid}>
            {GOALS.map((g) => (
              <Chip
                key={g.key}
                label={g.label}
                on={goals.includes(g.key)}
                onPress={() => setGoals((cur) => toggle(cur, g.key))}
                a11yPrefix="Learning goal"
              />
            ))}
          </View>
        </Section>

        <Section title="Favorite Subjects">
          <View style={s.chipsGrid}>
            {SUBJECTS.map((sub) => (
              <Chip
                key={sub.key}
                label={sub.label}
                Icon={sub.Icon}
                tint={sub.tint}
                on={subjects.includes(sub.key)}
                onPress={() => setSubjects((cur) => toggle(cur, sub.key))}
                a11yPrefix="Favourite subject"
              />
            ))}
          </View>
        </Section>

        <Section title="Learning Style">
          <View style={s.styleGrid}>
            {STYLES.map((item) => (
              <StyleCard
                key={item.key}
                item={item}
                on={style === item.key}
                // Single-select, and tapping the chosen card clears it — there is no
                // "none of these" card, so this is the only way back to no answer.
                onPress={() => setStyle((cur) => (cur === item.key ? null : item.key))}
              />
            ))}
          </View>
        </Section>

        <Section title="Difficulty Level">
          <View style={s.chipsGrid}>
            {DIFFICULTY.map((d) => (
              <Chip
                key={d.key}
                label={d.label}
                on={difficulty === d.key}
                onPress={() => setDifficulty((cur) => (cur === d.key ? null : d.key))}
                a11yPrefix="Difficulty"
              />
            ))}
          </View>
        </Section>
      </ScrollView>

      <StickyFooter
        label="Save Preferences"
        onPress={save}
        busy={saving}
        disabled={!dirty}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.page },
  body: { paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 28, gap: 20 },

  // Figma: chips-grid — horizontal, gap 8, wrapping.
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 37, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1,
  },
  chipOn:  { backgroundColor: P.chipOnBg, borderColor: P.ring, ...P.selectedShadow },
  chipOff: { backgroundColor: P.fieldBg,  borderColor: P.hair },

  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  styleCard: {
    // Just under half, so the 12px gap has room and the pair still fills the row.
    width: '48%', flexGrow: 1,
    borderRadius: 12, borderWidth: 1, padding: 12, gap: 6,
  },
  selected: { backgroundColor: P.chipOnBg, borderColor: P.ring, ...P.selectedShadow },
  plain:    { backgroundColor: P.fieldBg,  borderColor: P.hair },
});
