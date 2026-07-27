import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import TeachingPlayer from '../components/teacher/TeachingPlayer';
import TeacherAvatar from '../components/teacher/TeacherAvatar';
import { TEACHER_HEADSHOT } from '../components/teacher/teacherIdentity';
import { buildScenesFromTeaching } from '../components/teacher/lessonScenes';
import { C, F, SP, R } from '../components/teacher/premiumTheme';
import { Appear, PressableScale } from '../components/teacher/uiKit';
import { ChevronLeft, BookOpen, CircleAlert, Sparkles, FileText } from 'lucide-react-native';
import {
  askKnowledge, listKnowledgeSources, uploadKnowledgeText, deleteKnowledgeSource,
} from '../api/knowledgeApi';

const SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology', 'English', 'History'];

// Grounded RAG Q&A over teacher-uploaded material. Students ask; the AI answers
// ONLY from the uploaded content (or refuses). Teachers/Admins also get an
// upload + manage panel. This screen does NOT touch the lesson/doubt flow.
const KnowledgeAskScreen = ({ initialSubject = 'Physics', onBack }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [tab, setTab] = useState('ask'); // 'ask' | 'manage'

  // ── Ask state ──
  const [subject, setSubject]   = useState(initialSubject);
  const [question, setQuestion] = useState('');
  const [asked, setAsked]       = useState('');   // the question the current answer belongs to
  const [asking, setAsking]     = useState(false);
  const [result, setResult]     = useState(null); // { grounded, confidence, sources, answer }
  // Build the teaching scenes ONCE per answer — not on every keystroke in the ask box
  // (which re-mounts a fresh scenes array and invalidates the player's downstream memos).
  const askScenes = useMemo(
    () => (result && result.grounded && result.teaching ? buildScenesFromTeaching(result.teaching) : null),
    [result],
  );
  const [askErr, setAskErr]     = useState('');

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setAskErr('');
    setResult(null);
    setAsked(q);
    try {
      const data = await askKnowledge({ question: q, subject: subject || undefined });
      setResult(data);
    } catch (e) {
      setAskErr(e?.response?.data?.error || e?.message || 'Could not get an answer. Please try again.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.board} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.board }} />}

      <View style={st.header}>
        <PressableScale onPress={onBack} style={st.hIcon} accessibilityLabel="Go back"><ChevronLeft size={24} color={C.ink} strokeWidth={2.4} /></PressableScale>
        <Text style={st.headerTitle} accessibilityRole="header">Ask the Material</Text>
        <View style={st.hIconGhost}><BookOpen size={18} color={C.accent} strokeWidth={2.2} /></View>
      </View>

      {isTeacher && (
        <View style={st.tabs}>
          {['ask', 'manage'].map((t) => (
            <PressableScale key={t} style={st.tab} onPress={() => setTab(t)}
              accessibilityLabel={t === 'ask' ? 'Q and A' : 'Manage content'} accessibilityState={{ selected: tab === t }}>
              <Text style={[st.tabTxt, tab === t && st.tabTxtOn]}>{t === 'ask' ? 'Q&A' : 'Manage Content'}</Text>
              <View style={[st.tabBar, tab === t && st.tabBarOn]} />
            </PressableScale>
          ))}
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {tab === 'ask' ? (
          <>
            <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Subject filter */}
              <Text style={st.lbl}>Subject filter</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipRow}>
                <PressableScale style={[st.chip, !subject && st.chipOn]} onPress={() => setSubject('')}
                  accessibilityLabel="All subjects" accessibilityState={{ selected: !subject }}>
                  <Text style={[st.chipTxt, !subject && st.chipTxtOn]}>All</Text>
                </PressableScale>
                {SUBJECTS.map((s) => (
                  <PressableScale key={s} style={[st.chip, subject === s && st.chipOn]} onPress={() => setSubject(s)}
                    accessibilityLabel={`Subject ${s}`} accessibilityState={{ selected: subject === s }}>
                    <Text style={[st.chipTxt, subject === s && st.chipTxtOn]}>{s}</Text>
                  </PressableScale>
                ))}
              </ScrollView>

              {/* Empty state — what this screen is */}
              {!asked && !asking && !askErr && (
                <View style={st.empty}>
                  <View style={st.emptyIcon}><BookOpen size={38} color={C.accent} strokeWidth={1.8} /></View>
                  <Text style={st.emptyTitle}>Ask about your material</Text>
                  <Text style={st.emptyHint}>Answers come only from the content your teacher has uploaded — with the source shown.</Text>
                </View>
              )}

              {/* The question you asked (chat bubble) */}
              {!!asked && (
                <Appear style={st.userRow}>
                  <View style={st.userBubble}><Text style={st.userTxt}>{asked}</Text></View>
                </Appear>
              )}

              {asking && (
                <View style={st.thinkRow}>
                  <ActivityIndicator color={C.accent} size="small" />
                  <Text style={st.thinkTxt}>Searching the material…</Text>
                </View>
              )}

              {!!askErr && (
                <Appear style={st.errCard}>
                  <CircleAlert size={17} color={C.pink} strokeWidth={2.3} />
                  <Text style={st.errTxt}>{askErr}</Text>
                  <PressableScale onPress={handleAsk} accessibilityLabel="Try again"><Text style={st.retryTxt}>Try again</Text></PressableScale>
                </Appear>
              )}

              {/* ── Live animated teaching (grounded + structured) ── */}
              {result && result.grounded && result.teaching ? (
                <Appear style={st.novaWrap}>
                  <NovaHead />
                  <TeachingPlayer
                    scenes={askScenes}
                    title={result.teaching.title}
                    confidence={result.confidence}
                  />
                  <SourcesCard sources={result.sources} />
                </Appear>
              ) : result ? (
                /* ── Plain answer card (fallback or refusal) ── */
                <Appear style={[st.answerCard, !result.grounded && st.answerCardEmpty]}>
                  <View style={st.answerHead}>
                    <NovaHead label={result.grounded ? 'Ms. Nova' : 'Not found'} />
                    {result.grounded && typeof result.confidence === 'number' && (
                      <View style={st.confPill}>
                        <Text style={st.confTxt}>{Math.round(result.confidence * 100)}% match</Text>
                      </View>
                    )}
                  </View>
                  <Text style={st.answerTxt}>{result.answer}</Text>

                  {result.grounded && Array.isArray(result.sources) && result.sources.length > 0 && (
                    <View style={st.sourceBox}>
                      <Text style={st.sourceHdr}>Source material</Text>
                      {result.sources.map((s) => <SourceRow key={s.sourceId} s={s} />)}
                    </View>
                  )}

                  {!result.grounded && (
                    <Text style={st.noContentHint}>
                      Try rephrasing, pick a different subject, or ask your teacher to upload material on this topic.
                    </Text>
                  )}
                </Appear>
              ) : null}
            </ScrollView>

            {/* ── Floating ask bar ── */}
            <View style={st.askBar}>
              <View style={st.askInputWrap}>
                <TextInput
                  style={st.askInput}
                  placeholder="Ask anything about your files…"
                  placeholderTextColor={C.faint}
                  value={question}
                  onChangeText={setQuestion}
                  onSubmitEditing={handleAsk}
                  returnKeyType="send"
                  editable={!asking}
                  multiline
                  accessibilityLabel="Your question about the material"
                />
              </View>
              <PressableScale
                style={[st.askSend, (asking || !question.trim()) && { opacity: 0.5 }]}
                onPress={handleAsk}
                disabled={asking || !question.trim()}
                accessibilityLabel="Ask"
              >
                {asking ? <ActivityIndicator color="#fff" size="small" /> : <Sparkles size={20} color="#fff" strokeWidth={2.3} />}
              </PressableScale>
            </View>
          </>
        ) : (
          <ManagePanel />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Ms. Nova's byline above an answer.
const NovaHead = ({ label = 'Ms. Nova' }) => (
  <View style={st.novaHead}>
    <TeacherAvatar theme="dark" photo={TEACHER_HEADSHOT} state="idle" expression="smile" size={26} />
    <Text style={st.novaName}>{label}</Text>
  </View>
);

const SourceRow = ({ s }) => (
  <View style={st.sourceRow}>
    <View style={st.sourceIcon}><FileText size={15} color={C.blue} strokeWidth={2.2} /></View>
    <Text style={st.sourceTitle} numberOfLines={2}>{s.title}</Text>
    {typeof s.similarity === 'number' && (
      <View style={st.simPill}><Text style={st.simTxt}>{Math.round(s.similarity * 100)}% match</Text></View>
    )}
  </View>
);

// ─── Teacher/Admin: upload + manage uploaded sources ──────────────────────────
const ManagePanel = () => {
  const [title, setTitle]         = useState('');
  const [subject, setSubject]     = useState('');
  const [gradeLevel, setGrade]    = useState('');
  const [text, setText]           = useState('');
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [err, setErr]             = useState('');

  const [sources, setSources]     = useState([]);
  const [loadingList, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listKnowledgeSources();
      setSources(data?.sources || []);
    } catch (_) {
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUpload = async () => {
    if (!title.trim() || !text.trim() || saving) return;
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      await uploadKnowledgeText({
        title: title.trim(),
        subject: subject.trim() || undefined,
        gradeLevel: gradeLevel.trim() || undefined,
        text,
      });
      setMsg('Uploaded and indexed.');
      setTitle(''); setText(''); setSubject(''); setGrade('');
      refresh();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Upload failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteKnowledgeSource(id);
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch (_) { refresh(); }
  };

  return (
    <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={st.q}>Upload learning material</Text>
      <Text style={st.hint}>Paste notes or text. It’s chunked, embedded, and made searchable for students.</Text>

      <View style={st.formCard}>
        <Text style={st.lbl}>Title</Text>
        <TextInput style={st.inputSm} placeholder="e.g. Chapter 3 — Laws of Motion" placeholderTextColor={C.faint} value={title} onChangeText={setTitle} editable={!saving} />

        <View style={st.row2}>
          <View style={{ flex: 1 }}>
            <Text style={st.lbl}>Subject</Text>
            <TextInput style={st.inputSm} placeholder="Physics" placeholderTextColor={C.faint} value={subject} onChangeText={setSubject} editable={!saving} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.lbl}>Grade</Text>
            <TextInput style={st.inputSm} placeholder="8" placeholderTextColor={C.faint} value={gradeLevel} onChangeText={setGrade} editable={!saving} />
          </View>
        </View>

        <Text style={[st.lbl, { marginTop: 14 }]}>Content</Text>
        <TextInput
          style={st.textArea}
          placeholder="Paste the learning material here…"
          placeholderTextColor={C.faint}
          value={text}
          onChangeText={setText}
          multiline
          editable={!saving}
        />

        {!!msg && <Text style={st.ok}>{msg}</Text>}
        {!!err && <Text style={st.err}>{err}</Text>}

        <PressableScale
          style={[st.btn, (saving || !title.trim() || !text.trim()) && { opacity: 0.55 }]}
          onPress={handleUpload}
          disabled={saving || !title.trim() || !text.trim()}
          accessibilityLabel="Upload and index"
        >
          {saving
            ? <View style={st.row}><ActivityIndicator color="#fff" size="small" /><Text style={st.btnTxt}>  Indexing…</Text></View>
            : <Text style={st.btnTxt}>Upload &amp; Index</Text>}
        </PressableScale>
      </View>

      <Text style={[st.lbl, { marginTop: 26 }]}>Uploaded content</Text>
      {loadingList ? (
        <ActivityIndicator color={C.accent} style={{ marginTop: 16 }} />
      ) : sources.length === 0 ? (
        <Text style={st.emptyList}>No material uploaded yet.</Text>
      ) : (
        sources.map((s) => (
          <View key={s.id} style={st.srcItem}>
            <View style={st.sourceIcon}><FileText size={15} color={C.blue} strokeWidth={2.2} /></View>
            <View style={{ flex: 1 }}>
              <Text style={st.srcTitle} numberOfLines={1}>{s.title}</Text>
              <Text style={st.srcMeta}>
                {[s.subject, s.gradeLevel ? `Grade ${s.gradeLevel}` : null, `${s.chunkCount} chunks`, s.status]
                  .filter(Boolean).join(' · ')}
              </Text>
            </View>
            <PressableScale onPress={() => handleDelete(s.id)} style={st.delBtn} accessibilityLabel={`Delete ${s.title}`}>
              <Text style={st.delTxt}>Delete</Text>
            </PressableScale>
          </View>
        ))
      )}
    </ScrollView>
  );
};

// Standalone source card, rendered below the animated teaching explanation.
const SourcesCard = ({ sources }) => {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  return (
    <View style={st.sourceCard}>
      <Text style={st.sourceHdr}>Source material</Text>
      {sources.map((s) => <SourceRow key={s.sourceId} s={s} />)}
    </View>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SP.md, paddingVertical: 12, backgroundColor: C.board, borderBottomWidth: 1, borderBottomColor: C.line },
  hIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.cream2, alignItems: 'center', justifyContent: 'center' },
  hIconGhost: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.cream2, alignItems: 'center', justifyContent: 'center' },
  hIconTxt: { fontSize: 22, fontFamily: F.bold, color: C.ink, marginTop: -3 },
  hIconTxt2: { fontSize: 15 },
  headerTitle: { fontSize: 16, fontFamily: F.bold, color: C.ink, letterSpacing: -0.2 },

  // underline tabs
  tabs: { flexDirection: 'row', gap: 22, paddingHorizontal: SP.lg, backgroundColor: C.board, borderBottomWidth: 1, borderBottomColor: C.line },
  tab: { paddingTop: 12, alignItems: 'center' },
  tabTxt: { fontSize: 13.5, fontFamily: F.semi, color: C.dim, paddingBottom: 10 },
  tabTxtOn: { color: C.accent, fontFamily: F.bold },
  tabBar: { height: 2, alignSelf: 'stretch', backgroundColor: 'transparent', borderRadius: 2 },
  tabBarOn: { backgroundColor: C.accent },

  body: { padding: SP.lg, paddingBottom: 110 },
  q: { fontSize: 21, fontFamily: F.bold, color: C.ink, letterSpacing: -0.4 },
  hint: { fontSize: 13, fontFamily: F.med, color: C.dim, marginTop: 6, marginBottom: 18, lineHeight: 19 },
  lbl: { fontSize: 10.5, fontFamily: F.bold, color: C.dim, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10 },

  chipRow: { gap: 8, paddingVertical: 2, paddingRight: SP.lg },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: R.pill, borderWidth: 1, borderColor: C.line, backgroundColor: C.board },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipTxt: { fontSize: 13, fontFamily: F.semi, color: C.ink2 },
  chipTxtOn: { color: '#fff' },

  // empty state
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: SP.lg },
  emptyIcon: { marginBottom: SP.md, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontFamily: F.bold, color: C.ink },
  emptyHint: { fontSize: 13, fontFamily: F.med, color: C.dim, textAlign: 'center', lineHeight: 20, marginTop: 6, maxWidth: 280 },

  // chat bubbles
  userRow: { alignItems: 'flex-end', marginTop: SP.lg },
  userBubble: { maxWidth: '88%', backgroundColor: C.accent, borderRadius: R.xl, borderTopRightRadius: 6, paddingVertical: 12, paddingHorizontal: 16, shadowColor: C.accent, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  userTxt: { color: '#fff', fontSize: 14, fontFamily: F.med, lineHeight: 21 },

  thinkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: SP.lg },
  thinkTxt: { fontSize: 13, fontFamily: F.semi, color: C.ink2 },

  novaWrap: { marginTop: SP.lg },
  novaHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  novaName: { fontSize: 12, fontFamily: F.bold, color: C.accent },

  // answer
  answerCard: { marginTop: SP.lg, backgroundColor: C.board, borderRadius: R.xl, borderTopLeftRadius: 6, borderWidth: 1, borderColor: C.line, padding: 18, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  answerCardEmpty: { backgroundColor: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.25)' },
  answerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  confPill: { backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 9, paddingVertical: 3, paddingHorizontal: 9 },
  confTxt: { fontSize: 10.5, fontFamily: F.bold, color: C.green },
  answerTxt: { fontSize: 14.5, fontFamily: F.med, color: C.ink2, lineHeight: 23 },
  noContentHint: { fontSize: 13, fontFamily: F.med, color: C.ink2, marginTop: 10, lineHeight: 19 },

  // sources
  sourceCard: { marginTop: 14, backgroundColor: C.board, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16 },
  sourceBox: { marginTop: 16, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 12 },
  sourceHdr: { fontSize: 10, fontFamily: F.bold, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.cream, borderWidth: 1, borderColor: C.line, borderRadius: R.md, padding: 10, marginBottom: 8 },
  sourceIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center' },
  sourceTitle: { flex: 1, fontSize: 12.5, fontFamily: F.semi, color: C.ink },
  simPill: { backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  simTxt: { fontSize: 10, fontFamily: F.bold, color: C.green },

  // floating ask bar
  askBar: { position: 'absolute', left: SP.md, right: SP.md, bottom: Platform.OS === 'ios' ? 26 : 14, flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: 30, padding: 7, shadowColor: '#0F172A', shadowOpacity: 0.14, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  askInputWrap: { flex: 1, backgroundColor: C.cream, borderWidth: 1, borderColor: C.line, borderRadius: 24, paddingHorizontal: 16, justifyContent: 'center', minHeight: 44 },
  askInput: { fontSize: 14, fontFamily: F.med, color: C.ink, paddingVertical: Platform.OS === 'ios' ? 12 : 8, maxHeight: 96 },
  askSend: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  askSendTxt: { color: '#fff', fontSize: 18, fontFamily: F.bold },

  // errors / status
  errCard: { marginTop: SP.lg, backgroundColor: 'rgba(244,63,94,0.08)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.28)', borderRadius: R.lg, padding: SP.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  errTxt: { flex: 1, color: C.pink, fontSize: 13, fontFamily: F.semi },
  retryTxt: { color: C.ink, fontSize: 13, fontFamily: F.bold },
  err: { color: C.pink, fontSize: 12, fontFamily: F.semi, marginTop: 12 },
  ok: { color: C.green, fontSize: 12, fontFamily: F.bold, marginTop: 12 },

  // manage panel
  formCard: { backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: R.xl, padding: 16 },
  inputSm: { backgroundColor: C.cream, borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingVertical: 12, paddingHorizontal: 16, fontSize: 14, fontFamily: F.med, color: C.ink },
  textArea: { backgroundColor: C.cream, borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingVertical: 14, paddingHorizontal: 16, fontSize: 14, fontFamily: F.med, color: C.ink, minHeight: 150, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: 15, alignItems: 'center', marginTop: 18, shadowColor: C.accent, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  btnTxt: { color: '#fff', fontSize: 15, fontFamily: F.bold, letterSpacing: -0.2 },

  emptyList: { fontSize: 13, fontFamily: F.med, color: C.dim, marginTop: 12, textAlign: 'center' },
  srcItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: R.md, padding: 12, marginTop: 10 },
  srcTitle: { fontSize: 13.5, fontFamily: F.bold, color: C.ink },
  srcMeta: { fontSize: 11, fontFamily: F.med, color: C.dim, marginTop: 3 },
  delBtn: { backgroundColor: 'rgba(244,63,94,0.10)', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  delTxt: { fontSize: 12, fontFamily: F.bold, color: C.pink },
});

export default KnowledgeAskScreen;
