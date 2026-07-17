// src/screens/admin/aiteacher/AiTeacherPreviewScreen.js
// "Watch exactly as the student will." This does NOT build another preview — it mounts the
// REAL, frozen student player (LiveTeachingPlayer) with a lesson fetched from the admin
// read-only endpoint, so the admin sees the identical live classroom (same board, avatar,
// voice, choreography — all derived client-side from the stored slides). Doubts are the only
// thing gated: this lesson belongs to a student, so in preview we return a short notice
// instead of routing to the owner-scoped agent (no fake answer, no error).
import React, { useEffect, useMemo, useState } from 'react';
import { View, SafeAreaView, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { getAdminAiLesson } from '../../../api/adminApi';
import LiveTeachingPlayer from '../../../components/teacher/LiveTeachingPlayer';
import { SPEECH_OK } from '../../../utils/teacherVoice';
import { D } from '../../../components/teacher/premiumTheme';
import { T } from '../../parent/ParentApp/constants';

export default function AiTeacherPreviewScreen({ route, navigation }) {
  const { id, startIndex = 0, lesson: passedLesson = null } = route.params || {};
  const [lesson, setLesson] = useState(passedLesson);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (passedLesson) return undefined;
    let alive = true;
    getAdminAiLesson(id)
      .then((d) => { if (alive) setLesson(d?.lesson || null); })
      .catch((e) => { if (alive) setError(e?.response?.data?.error || e?.message || 'Could not load lesson'); });
    return () => { alive = false; };
  }, [id, passedLesson]);

  // Stable lesson object (matches AITeacherScreen.lessonObj) so the player's scene memo holds.
  const lessonObj = useMemo(
    () => (lesson ? { lessonTitle: lesson.lessonTitle, slides: lesson.slides || [], keyTerms: lesson.keyTerms || [], grade: lesson.gradeLevel || null } : null),
    [lesson],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: D.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={D.bg} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: D.bg }} />}
      {!lessonObj ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {error ? <T w="semi" s={14} c="#fff" style={{ textAlign: 'center', paddingHorizontal: 32 }}>{error}</T> : <ActivityIndicator color="#fff" />}
        </View>
      ) : (
        <LiveTeachingPlayer
          lesson={lessonObj}
          subject={lesson.subject}
          ttsOk={SPEECH_OK}
          startIndex={startIndex}
          priorModel={null}
          onProgress={() => {}}
          onOutcome={() => {}}
          onAsk={async () => ({ answer: 'Preview mode — open this lesson from a student account to ask doubts.', pending: null })}
          onAskStream={async (q, i, { onDelta } = {}) => { const a = 'Preview mode — doubts are disabled here.'; if (onDelta) onDelta(a); return { answer: a, pending: null }; }}
          onExit={() => navigation.goBack()}
          onNewLesson={() => navigation.goBack()}
        />
      )}
    </SafeAreaView>
  );
}
