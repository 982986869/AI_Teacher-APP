import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  StatusBar, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import TeachingPlayer from '../components/teacher/TeachingPlayer';
import { buildScenesFromTeaching } from '../components/teacher/lessonScenes';
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
  const [asking, setAsking]     = useState(false);
  const [result, setResult]     = useState(null); // { grounded, confidence, sources, answer }
  const [askErr, setAskErr]     = useState('');

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setAskErr('');
    setResult(null);
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}

      <View style={st.header}>
        <TouchableOpacity onPress={onBack} style={st.backBtn}><Text style={st.backTxt}>‹ Back</Text></TouchableOpacity>
        <Text style={st.headerTitle}>Ask the Material 📚</Text>
        <View style={{ width: 60 }} />
      </View>

      {isTeacher && (
        <View style={st.tabs}>
          {['ask', 'manage'].map((t) => (
            <TouchableOpacity key={t} style={[st.tab, tab === t && st.tabOn]} onPress={() => setTab(t)}>
              <Text style={[st.tabTxt, tab === t && st.tabTxtOn]}>{t === 'ask' ? 'Ask' : 'Manage Content'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {tab === 'ask' ? (
          <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
            <Text style={st.q}>Ask a question about your learning material</Text>
            <Text style={st.hint}>Answers come only from content your teacher has uploaded.</Text>

            <Text style={st.lbl}>SUBJECT (optional filter)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
              <TouchableOpacity style={[st.chip, !subject && st.chipOn]} onPress={() => setSubject('')}>
                <Text style={[st.chipTxt, !subject && st.chipTxtOn]}>All</Text>
              </TouchableOpacity>
              {SUBJECTS.map((s) => (
                <TouchableOpacity key={s} style={[st.chip, subject === s && st.chipOn]} onPress={() => setSubject(s)}>
                  <Text style={[st.chipTxt, subject === s && st.chipTxtOn]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[st.lbl, { marginTop: 18 }]}>YOUR QUESTION</Text>
            <TextInput
              style={st.input}
              placeholder="e.g. What is Newton's second law?"
              placeholderTextColor="#C7A98A"
              value={question}
              onChangeText={setQuestion}
              multiline
              editable={!asking}
            />

            {!!askErr && <Text style={st.err}>{askErr}</Text>}

            <TouchableOpacity
              style={[st.btn, (asking || !question.trim()) && { opacity: 0.6 }]}
              onPress={handleAsk}
              disabled={asking || !question.trim()}
            >
              {asking
                ? <View style={st.row}><ActivityIndicator color="#fff" size="small" /><Text style={st.btnTxt}>  Searching the material…</Text></View>
                : <Text style={st.btnTxt}>Ask  ✨</Text>}
            </TouchableOpacity>

            {/* ── Live animated teaching (grounded + structured) ── */}
            {result && result.grounded && result.teaching ? (
              <>
                <TeachingPlayer
                  scenes={buildScenesFromTeaching(result.teaching)}
                  title={result.teaching.title}
                  confidence={result.confidence}
                />
                <SourcesCard sources={result.sources} />
              </>
            ) : result ? (
              /* ── Plain answer card (fallback or refusal) ── */
              <View style={[st.answerCard, !result.grounded && st.answerCardEmpty]}>
                <View style={st.answerHead}>
                  <Text style={st.answerLabel}>{result.grounded ? '🎓 AI Teacher' : '🔎 Not found'}</Text>
                  {result.grounded && typeof result.confidence === 'number' && (
                    <View style={st.confPill}>
                      <Text style={st.confTxt}>{Math.round(result.confidence * 100)}% match</Text>
                    </View>
                  )}
                </View>
                <Text style={st.answerTxt}>{result.answer}</Text>

                {result.grounded && Array.isArray(result.sources) && result.sources.length > 0 && (
                  <View style={st.sourceBox}>
                    <Text style={st.sourceHdr}>SOURCES</Text>
                    {result.sources.map((s) => (
                      <View key={s.sourceId} style={st.sourceRow}>
                        <Text style={st.sourceDot}>📄</Text>
                        <Text style={st.sourceTitle} numberOfLines={2}>{s.title}</Text>
                        {typeof s.similarity === 'number' && (
                          <Text style={st.sourceSim}>{Math.round(s.similarity * 100)}%</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {!result.grounded && (
                  <Text style={st.noContentHint}>
                    Try rephrasing, pick a different subject, or ask your teacher to upload material on this topic.
                  </Text>
                )}
              </View>
            ) : null}
          </ScrollView>
        ) : (
          <ManagePanel />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
      setMsg('Uploaded and indexed ✓');
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
    <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
      <Text style={st.q}>Upload learning material</Text>
      <Text style={st.hint}>Paste notes or text. It’s chunked, embedded, and made searchable for students.</Text>

      <Text style={st.lbl}>TITLE</Text>
      <TextInput style={st.inputSm} placeholder="e.g. Chapter 3 — Laws of Motion" placeholderTextColor="#C7A98A" value={title} onChangeText={setTitle} editable={!saving} />

      <View style={st.row2}>
        <View style={{ flex: 1 }}>
          <Text style={st.lbl}>SUBJECT</Text>
          <TextInput style={st.inputSm} placeholder="Physics" placeholderTextColor="#C7A98A" value={subject} onChangeText={setSubject} editable={!saving} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.lbl}>GRADE</Text>
          <TextInput style={st.inputSm} placeholder="8" placeholderTextColor="#C7A98A" value={gradeLevel} onChangeText={setGrade} editable={!saving} />
        </View>
      </View>

      <Text style={[st.lbl, { marginTop: 14 }]}>CONTENT</Text>
      <TextInput
        style={st.textArea}
        placeholder="Paste the learning material here…"
        placeholderTextColor="#C7A98A"
        value={text}
        onChangeText={setText}
        multiline
        editable={!saving}
      />

      {!!msg && <Text style={st.ok}>{msg}</Text>}
      {!!err && <Text style={st.err}>{err}</Text>}

      <TouchableOpacity
        style={[st.btn, (saving || !title.trim() || !text.trim()) && { opacity: 0.6 }]}
        onPress={handleUpload}
        disabled={saving || !title.trim() || !text.trim()}
      >
        {saving
          ? <View style={st.row}><ActivityIndicator color="#fff" size="small" /><Text style={st.btnTxt}>  Indexing…</Text></View>
          : <Text style={st.btnTxt}>Upload & Index</Text>}
      </TouchableOpacity>

      <Text style={[st.lbl, { marginTop: 26 }]}>UPLOADED CONTENT</Text>
      {loadingList ? (
        <ActivityIndicator color="#FF8A5C" style={{ marginTop: 16 }} />
      ) : sources.length === 0 ? (
        <Text style={st.empty}>No material uploaded yet.</Text>
      ) : (
        sources.map((s) => (
          <View key={s.id} style={st.srcItem}>
            <View style={{ flex: 1 }}>
              <Text style={st.srcTitle} numberOfLines={1}>{s.title}</Text>
              <Text style={st.srcMeta}>
                {[s.subject, s.gradeLevel ? `Grade ${s.gradeLevel}` : null, `${s.chunkCount} chunks`, s.status]
                  .filter(Boolean).join(' · ')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(s.id)} style={st.delBtn}>
              <Text style={st.delTxt}>Delete</Text>
            </TouchableOpacity>
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
      <Text style={st.sourceHdr}>SOURCES</Text>
      {sources.map((s) => (
        <View key={s.sourceId} style={st.sourceRow}>
          <Text style={st.sourceDot}>📄</Text>
          <Text style={st.sourceTitle} numberOfLines={2}>{s.title}</Text>
          {typeof s.similarity === 'number' && (
            <Text style={st.sourceSim}>{Math.round(s.similarity * 100)}%</Text>
          )}
        </View>
      ))}
    </View>
  );
};

const st = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#fff' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  backBtn:     { width: 60 },
  backTxt:     { fontSize: 15, fontWeight: '800', color: '#2C3043' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#2C3043', letterSpacing: -0.3 },

  tabs:        { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  tab:         { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F4F4F5', alignItems: 'center' },
  tabOn:       { backgroundColor: '#FF8A5C' },
  tabTxt:      { fontSize: 13, fontWeight: '800', color: '#8E8E93' },
  tabTxtOn:    { color: '#fff' },

  body:        { padding: 20, paddingBottom: 48 },
  q:           { fontSize: 22, fontWeight: '900', color: '#2C3043', letterSpacing: -0.5 },
  hint:        { fontSize: 13, color: '#8E8E93', fontWeight: '600', marginTop: 6, marginBottom: 18, lineHeight: 19 },
  lbl:         { fontSize: 10, fontWeight: '800', color: '#8E8E93', letterSpacing: 0.8, marginBottom: 10 },

  chip:        { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 18, borderWidth: 2, borderColor: '#E8E8E8', backgroundColor: '#fff' },
  chipOn:      { backgroundColor: '#FF8A5C', borderColor: '#FF8A5C' },
  chipTxt:     { fontSize: 13, fontWeight: '800', color: '#8E8E93' },
  chipTxtOn:   { color: '#fff' },

  input:       { backgroundColor: '#FFF8F0', borderWidth: 2, borderColor: '#FFE0C2', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, fontSize: 16, fontWeight: '700', color: '#2C3043', minHeight: 80, textAlignVertical: 'top' },
  inputSm:     { backgroundColor: '#FFF8F0', borderWidth: 2, borderColor: '#FFE0C2', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, fontSize: 15, fontWeight: '700', color: '#2C3043' },
  textArea:    { backgroundColor: '#FFF8F0', borderWidth: 2, borderColor: '#FFE0C2', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, fontSize: 15, fontWeight: '600', color: '#2C3043', minHeight: 160, textAlignVertical: 'top' },
  row2:        { flexDirection: 'row', gap: 12, marginTop: 14 },

  err:         { color: '#C0392B', fontSize: 12, fontWeight: '600', marginTop: 12 },
  ok:          { color: '#1C7A3D', fontSize: 12, fontWeight: '700', marginTop: 12 },

  btn:         { backgroundColor: '#FF8A5C', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  btnTxt:      { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  row:         { flexDirection: 'row', alignItems: 'center' },

  // Answer
  answerCard:      { marginTop: 24, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F1E6D6', padding: 18, shadowColor: '#C9A06A', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  answerCardEmpty: { borderColor: '#EADfd0', backgroundColor: '#FBF7F1' },
  answerHead:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  answerLabel:     { fontSize: 12, fontWeight: '900', color: '#9A6233', letterSpacing: 0.5 },
  confPill:        { backgroundColor: '#DFF3E4', borderRadius: 12, paddingVertical: 3, paddingHorizontal: 9 },
  confTxt:         { fontSize: 11, fontWeight: '800', color: '#1C7A3D' },
  answerTxt:       { fontSize: 16, fontWeight: '600', color: '#2A2A2C', lineHeight: 24 },

  sourceCard:      { marginTop: 14, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#F1E6D6', padding: 16 },
  sourceBox:       { marginTop: 16, borderTopWidth: 1, borderTopColor: '#F1E6D6', paddingTop: 12 },
  sourceHdr:       { fontSize: 10, fontWeight: '800', color: '#C79A6E', letterSpacing: 1, marginBottom: 8 },
  sourceRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  sourceDot:       { fontSize: 13 },
  sourceTitle:     { flex: 1, fontSize: 13, fontWeight: '700', color: '#4A2F18' },
  sourceSim:       { fontSize: 11, fontWeight: '800', color: '#8E7A66' },
  noContentHint:   { fontSize: 13, color: '#8E7A66', fontWeight: '600', marginTop: 10, lineHeight: 19 },

  // Manage list
  empty:       { fontSize: 13, color: '#A0A0A5', fontWeight: '600', marginTop: 12, textAlign: 'center' },
  srcItem:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#EFEFEF', borderRadius: 14, padding: 14, marginTop: 10 },
  srcTitle:    { fontSize: 14, fontWeight: '800', color: '#2C3043' },
  srcMeta:     { fontSize: 11, fontWeight: '600', color: '#8E8E93', marginTop: 3 },
  delBtn:      { backgroundColor: '#FDECEA', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  delTxt:      { fontSize: 12, fontWeight: '800', color: '#C0392B' },
});

export default KnowledgeAskScreen;
