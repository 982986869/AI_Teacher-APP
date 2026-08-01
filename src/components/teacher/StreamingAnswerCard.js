import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, D, F, SP, R } from './premiumTheme';
import { Appear, PressableScale } from './uiKit';

// Figma "Primary" violet-600 — NOT C.accent (chalk amber), ruled out by the design
// system audit. Matches LiveTeachingPlayer/LessonBoards/subjectBoards' local ACCENT.
const ACCENT = '#7C3AED';
const ACCENT_SOFT = 'rgba(124,58,237,0.12)';

// expo-haptics is native — guarded require so a version-skewed Expo Go can't crash the
// live lesson on load. Haptics are a nicety; their absence is a silent no-op.
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch (e) { Haptics = null; }
const haptic = () => { try { Haptics && Haptics.selectionAsync && Haptics.selectionAsync(); } catch (e) { /* no-op */ } };

export function StreamingAnswerCard({
  streamedText,
  isDone,
  onActionSelect,
  isDark = false
}) {
  const cardBg = isDark ? D.panel : C.board;
  const textColor = isDark ? D.text : C.ink;
  const borderColor = isDark ? D.edge : C.line;

  const quickActions = [
    { label: '💡 Simpler', action: 'explain_simpler' },
    { label: '📌 Example', action: 'give_example' },
    { label: '🔄 Quiz me', action: 'start_quiz' },
  ];

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <Text style={[styles.bodyText, { color: textColor }]}>
        {streamedText}
        {!isDone && <Text style={styles.cursor}> ▌</Text>}
      </Text>

      {/* Action Chips appear only after SSE 'done' event */}
      {isDone && (
        <Appear from="up" duration={300} delay={100}>
          <View style={styles.actionsRow}>
            {quickActions.map((item) => (
              <PressableScale
                key={item.action}
                style={[styles.chip, { backgroundColor: isDark ? D.panel2 : ACCENT_SOFT }]}
                onPress={() => {
                  haptic();
                  onActionSelect(item.action);
                }}
                accessibilityLabel={item.label}
              >
                <Text style={styles.chipText}>{item.label}</Text>
              </PressableScale>
            ))}
          </View>
        </Appear>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SP.lg,
    borderRadius: R.xl,
    borderWidth: 1,
    marginHorizontal: SP.md,
    marginVertical: SP.sm,
  },
  bodyText: {
    fontFamily: F.reg,
    fontSize: 16,
    lineHeight: 24,
  },
  cursor: {
    color: ACCENT,
    fontFamily: F.bold,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SP.sm,
    marginTop: SP.md,
    paddingTop: SP.sm,
  },
  chip: {
    paddingHorizontal: SP.md,
    paddingVertical: SP.xs + 2,
    borderRadius: R.pill,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: F.med,
    fontSize: 13,
    color: ACCENT,
  },
});
