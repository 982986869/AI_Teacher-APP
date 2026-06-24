import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, TextInput, Platform,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { generateLesson, askAgent, askAgentStream } from '../api/aiApi';
import KnowledgeAskScreen from './KnowledgeAskScreen';
import LiveTeachingPlayer from '../components/teacher/LiveTeachingPlayer';
import TeacherAvatar from '../components/teacher/TeacherAvatar';
import { C } from '../components/teacher/premiumTheme';
import { stopTeacher, primeTeacherVoice, SPEECH_OK } from '../utils/teacherVoice';

// Rotating reassurance shown while the lesson generates.
const GEN_STAGES = [
  'Understanding your topic…',
  'Thinking like a teacher…',
  'Preparing simple examples…',
  'Drawing the lesson on the board…',
  'Almost ready — final touches…',
];

const SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'History'];

const AITeacherScreen = ({ initialSubject = 'Physics', initialTopic = '', onBack }) => {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Student';

  const [activeSubject, setActiveSubject] = useState(initialSubject);
  // 'learn' = generate a lesson; 'ask' = grounded RAG Q&A over uploaded material.
  const [mode, setMode] = useState('learn');

  // Generator
  const [topic, setTopic] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [genStage, setGenStage] = useState(0);
  const [error, setError] = useState('');

  // Lesson (handed to the live player, which owns all playback state)
  const [lessonId, setLessonId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [slides, setSlides] = useState([]);
  const [keyTerms, setKeyTerms] = useState([]);

  // Rolling doubt history for the agent (multi-turn context), capped to keep it light.
  const historyRef = useRef([]);
  // Carries the agent's quiz / understanding-check state to the next turn so the
  // teaching loops (grade my answer, "did you understand?") work across messages.
  const pendingRef = useRef(null);

  useEffect(() => { primeTeacherVoice(); }, []);
  useEffect(() => {
    if (!loading) { setGenStage(0); return undefined; }
    const id = setInterval(() => setGenStage((s) => Math.min(GEN_STAGES.length - 1, s + 1)), 2600);
    return () => clearInterval(id);
  }, [loading]);

  const handleBack = () => { stopTeacher(); onBack && onBack(); };

  const handleGenerate = async () => {
    const t = topic.trim();
    if (!t || loading) return;
    setLoading(true);
    setError('');
    historyRef.current = [];
    pendingRef.current = null;
    try {
      const payload = { topic: t, subject: activeSubject, gradeLevel: user?.grade || '8' };
      const { lessonId: id, lesson } = await generateLesson(payload);
      setLessonId(id);
      setLessonTitle(lesson.lessonTitle || t);
      setSlides(lesson.slides || []);
      setKeyTerms(lesson.keyTerms || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not generate the lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const newLesson = () => { stopTeacher(); setSlides([]); setLessonId(null); historyRef.current = []; pendingRef.current = null; };

  // Stable lesson object so the player's buildScenes() memo isn't invalidated on
  // every re-render of this screen.
  const lessonObj = useMemo(() => ({ lessonTitle, slides, keyTerms }), [lessonTitle, slides, keyTerms]);

  // ── Ask-the-material (grounded RAG) — self-contained screen ──
  if (slides.length === 0 && mode === 'ask') {
    return <KnowledgeAskScreen initialSubject={activeSubject} onBack={() => setMode('learn')} />;
  }

  // ── Generator ──
  if (slides.length === 0) {
    return (
      <SafeAreaView style={st.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.cream} />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.cream }} />}
        <View style={st.header}>
          <TouchableOpacity onPress={handleBack} style={st.hIcon} activeOpacity={0.8}><Text style={st.hIconTxt}>‹</Text></TouchableOpacity>
          <Text style={st.headerTitle}>AI Teacher</Text>
          <View style={{ width: 38 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={st.hero}><TeacherAvatar size={96} state="idle" theme="dark" /></View>
            <Text style={st.hi}>Hi {firstName} 👋</Text>
            <Text style={st.q}>What should we learn today?</Text>

            <View style={st.modeRow}>
              <TouchableOpacity style={[st.modeBtn, st.modeBtnOn]} onPress={() => setMode('learn')} activeOpacity={0.9}>
                <Text style={[st.modeTxt, st.modeTxtOn]}>📖  Learn a Topic</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.modeBtn} onPress={() => setMode('ask')} activeOpacity={0.9}>
                <Text style={st.modeTxt}>📚  Ask the Material</Text>
              </TouchableOpacity>
            </View>

            <Text style={st.label}>SUBJECT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
              {SUBJECTS.map((subj) => (
                <TouchableOpacity key={subj} style={[st.chip, activeSubject === subj && st.chipOn]} onPress={() => setActiveSubject(subj)} activeOpacity={0.9}>
                  <Text style={[st.chipTxt, activeSubject === subj && st.chipTxtOn]}>{subj}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[st.label, { marginTop: 20 }]}>TOPIC</Text>
            <TextInput
              style={st.input}
              placeholder="e.g. Pythagoras Theorem"
              placeholderTextColor={C.faint}
              value={topic}
              onChangeText={setTopic}
              onSubmitEditing={handleGenerate}
              returnKeyType="go"
              editable={!loading}
            />

            {!!error && (
              <View style={st.errCard}>
                <Text style={st.errTxt}>⚠️  {error}</Text>
                <TouchableOpacity onPress={handleGenerate}><Text style={st.retryTxt}>Try again ›</Text></TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={[st.cta, (loading || !topic.trim()) && { opacity: 0.55 }]} onPress={handleGenerate} disabled={loading || !topic.trim()} activeOpacity={0.9}>
              {loading
                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={st.ctaTxt}>{GEN_STAGES[genStage]}</Text>
                  </View>
                : <Text style={st.ctaTxt}>Generate Lesson  ✨</Text>}
            </TouchableOpacity>

            {loading && (
              <View style={st.loadCard}>
                {GEN_STAGES.map((s, i) => (
                  <View key={i} style={st.stageRow}>
                    <Text style={st.stageIcon}>{i < genStage ? '✅' : i === genStage ? '⏳' : '○'}</Text>
                    <Text style={[st.stageTxt, i === genStage && st.stageTxtOn, i < genStage && st.stageTxtDone]}>{s}</Text>
                  </View>
                ))}
                <Text style={st.loadHint}>A good lesson takes a moment to craft. Hang tight 🎓</Text>
              </View>
            )}

            {!loading && (
              <Text style={st.hint}>A live, voice-narrated lesson with a teacher, whiteboard, and doubts you can ask anytime.</Text>
            )}
            {!SPEECH_OK && <Text style={st.voiceNote}>🔇 Voice off — run “npx expo install expo-speech” to enable narration.</Text>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Live classroom ──
  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.cream} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.cream }} />}
      <LiveTeachingPlayer
        lesson={lessonObj}
        ttsOk={SPEECH_OK}
        onAsk={async (q, i) => {
          // Route doubts through the AI Teacher agent: intent → RAG grounding →
          // teacher-style answer → quality guard. `pending` carries the quiz /
          // understanding-check state so those loops continue across turns.
          const res = await askAgent({
            text: q,
            subject: activeSubject,
            gradeLevel: user?.grade || '8',
            lessonId,
            slideIndex: i,
            history: historyRef.current,
            pending: pendingRef.current,
          });
          pendingRef.current = res.pending || null;
          historyRef.current = [
            ...historyRef.current,
            { role: 'USER', content: q },
            { role: 'ASSISTANT', content: res.answer },
          ].slice(-12);
          return res.answer;
        }}
        onAskStream={async (q, i, { onDelta }) => {
          // Streaming variant — the player speaks sentences as they arrive.
          const res = await askAgentStream({
            text: q,
            subject: activeSubject,
            gradeLevel: user?.grade || '8',
            lessonId,
            slideIndex: i,
            history: historyRef.current,
            pending: pendingRef.current,
          }, { onDelta });
          pendingRef.current = res.pending || null;
          historyRef.current = [
            ...historyRef.current,
            { role: 'USER', content: q },
            { role: 'ASSISTANT', content: res.answer || '' },
          ].slice(-12);
          return res;
        }}
        onExit={handleBack}
        onNewLesson={newLesson}
      />
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  hIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.board, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  hIconTxt: { fontSize: 22, fontWeight: '900', color: C.ink, marginTop: -2 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },

  body: { paddingHorizontal: 20, paddingBottom: 44 },
  hero: { alignItems: 'center', marginTop: 6, marginBottom: 8 },
  hi: { fontSize: 14, fontWeight: '700', color: C.dim, textAlign: 'center' },
  q: { fontSize: 25, fontWeight: '900', color: C.ink, letterSpacing: -0.5, marginTop: 4, marginBottom: 24, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  label: { fontSize: 11, fontWeight: '800', color: C.dim, letterSpacing: 1, marginBottom: 10 },

  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  modeBtn: { flex: 1, paddingVertical: 13, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.board, alignItems: 'center' },
  modeBtnOn: { backgroundColor: C.accent, borderColor: C.accent },
  modeTxt: { fontSize: 14, fontWeight: '800', color: C.dim },
  modeTxtOn: { color: '#fff' },

  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.board },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipTxt: { fontSize: 14, fontWeight: '800', color: C.dim },
  chipTxtOn: { color: '#fff' },

  input: { backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 18, fontSize: 16, fontWeight: '700', color: C.ink },

  errCard: { marginTop: 14, backgroundColor: 'rgba(255,143,176,0.12)', borderWidth: 1, borderColor: 'rgba(255,143,176,0.4)', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  errTxt: { flex: 1, color: C.pink, fontSize: 13, fontWeight: '700' },
  retryTxt: { color: C.ink, fontSize: 13, fontWeight: '900' },

  cta: { backgroundColor: C.accent, borderRadius: 18, paddingVertical: 17, alignItems: 'center', marginTop: 22, shadowColor: C.accent, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  ctaTxt: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },

  loadCard: { marginTop: 18, padding: 18, gap: 12, backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: 18 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stageIcon: { fontSize: 14, width: 20, color: C.faint },
  stageTxt: { fontSize: 14, fontWeight: '700', color: C.faint },
  stageTxtOn: { color: C.ink, fontWeight: '900' },
  stageTxtDone: { color: C.green },
  loadHint: { fontSize: 11, fontWeight: '600', color: C.dim, marginTop: 4, textAlign: 'center' },

  hint: { fontSize: 13, color: C.dim, fontWeight: '600', lineHeight: 19, marginTop: 18, textAlign: 'center' },
  voiceNote: { fontSize: 11, color: C.accent, fontWeight: '700', marginTop: 12, textAlign: 'center' },
});

export default AITeacherScreen;
