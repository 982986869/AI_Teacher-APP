import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, D, F, SP, R, GRAD } from './premiumTheme';
import { Appear, Gradient } from './uiKit';

const GENERATION_STAGES = [
  { progress: 0.15, label: 'Reading chapter syllabus & key concepts...' },
  { progress: 0.40, label: 'Structuring slides and visual formulas...' },
  { progress: 0.70, label: 'Formulating interactive checkpoint quizzes...' },
  { progress: 0.90, label: 'Finalizing AI Teacher speaking script...' },
];

export function LessonGeneratorLoader({ isDark = false }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < GENERATION_STAGES.length - 1 ? prev + 1 : prev));
    }, 12000); // Cycles through stages over ~48 seconds

    return () => clearInterval(interval);
  }, []);

  const currentStage = GENERATION_STAGES[stageIndex];
  const fillWidth = `${Math.round(currentStage.progress * 100)}%`;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? D.panel : C.board }]}>
      <Appear from="scale" duration={360}>
        <Text style={[styles.header, { color: isDark ? D.text : C.ink }]}>
          Crafting Your Personal Lesson
        </Text>
      </Appear>

      {/* Progress Track */}
      <View style={[styles.track, { backgroundColor: isDark ? D.panel2 : C.cream2 }]}>
        <View style={[styles.fill, { width: fillWidth }]}>
          <Gradient colors={GRAD.hot} style={StyleSheet.absoluteFill} />
        </View>
      </View>

      {/* Stage Status */}
      <Appear key={stageIndex} from="down" duration={300}>
        <Text style={[styles.statusText, { color: isDark ? D.textDim : C.ink2 }]}>
          {currentStage.label}
        </Text>
      </Appear>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SP.xl,
    borderRadius: R.xxl,
    margin: SP.lg,
    alignItems: 'center',
  },
  header: {
    fontFamily: F.bold,
    fontSize: 18,
    marginBottom: SP.lg,
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: R.pill,
    overflow: 'hidden',
    marginBottom: SP.md,
  },
  fill: {
    height: '100%',
    borderRadius: R.pill,
    overflow: 'hidden',
  },
  statusText: {
    fontFamily: F.med,
    fontSize: 14,
    textAlign: 'center',
  },
});
