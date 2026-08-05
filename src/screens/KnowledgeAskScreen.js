import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator, Image, Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import TeacherAvatar from '../components/teacher/TeacherAvatar';
import { TEACHER_HEADSHOT } from '../components/teacher/teacherIdentity';
import { SP, R } from '../components/teacher/premiumTheme';
import { shadowSm } from '../theme/studentTheme';
import { COLORS } from '../theme/designSystem';
import PrimaryButton from '../components/brand/PrimaryButton';
import { F } from './parent/ParentApp/constants';
import { ChevronLeft, BookOpen, Sparkles, FileText, CircleAlert, Trash2, Check, FileUp, ImagePlus, Camera, X, SquarePen, Layers, ChevronDown, Search, Quote } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Appear, PressableScale } from '../components/teacher/uiKit';
import DiagramRenderer from '../components/teacher/DiagramRenderer';
import MathText from '../components/MathText';

// Dark reskin (the "ask-material-dark" reference) over the SAME S.<role> call
// sites the light build used — every colour in this file already goes through
// one role-named token object, so swapping the whole screen to the app's new
// violet dark system is a token-map, not a rewrite. Role names match
// studentTheme's S 1:1 so nothing below this had to change; only the import
// binding did (see the S = D alias a few lines down).
const D = {
  canvas: COLORS.background, card: 'rgba(255,255,255,0.05)', ink: COLORS.textPrimary,
  sub: COLORS.textSecondary, muted: COLORS.textSecondary, faint: 'rgba(255,255,255,0.35)',
  hair: COLORS.border, border: 'rgba(255,255,255,0.16)', white: '#FFFFFF',
  indigo: COLORS.primary, indigoSoft: 'rgba(124,58,237,0.14)',
  blue: '#60A5FA', blueSoft: 'rgba(96,165,250,0.14)',
  emerald: COLORS.success, emeraldSoft: 'rgba(16,185,129,0.14)',
  orange: COLORS.warning, orangeSoft: 'rgba(249,115,22,0.14)',
  red: COLORS.error, redSoft: 'rgba(239,68,68,0.14)',
};
// Every existing `S.xxx` call site below is left exactly as written — this
// alias points the same role names at the dark map instead of studentTheme.
const S = D;
import {
  askKnowledgeStructured, extendKnowledge, solvePhoto, listKnowledgeSources, uploadKnowledgeText, uploadKnowledgeFile, deleteKnowledgeSource,
} from '../api/knowledgeApi';

// expo-document-picker is a NATIVE module, and it was added to this app only with
// the "Ask the Material" upload flow. A dev/preview build made before that has no
// ExpoDocumentPicker inside it, and a top-level import there throws while the JS
// bundle is still loading — which kills the WHOLE app on open, not just this screen.
// So load it at tap time and degrade to "PDF needs the new build" instead.
const loadDocumentPicker = () => {
  try {
    return require('expo-document-picker');
  } catch {
    return null;
  }
};

// One-tap follow-ups shown under the latest answer, so the chat keeps flowing
// without the student having to phrase a follow-up question themselves. These
// stay GROUNDED (they re-shape existing material) — "Example" is handled instead
// by the labelled gap chips, since a book often has no example to ground on.
const FOLLOWUPS = [
  { label: 'Simpler', prompt: 'Explain that in a much simpler way.' },
  { label: 'Quiz me', quiz: true },
];

// Gap tokens the backend flags (material lacks this) → the on-demand, clearly
// LABELLED "beyond your book" chip that fills it. gapKind steers the task server-side.
const GAP_META = {
  example:  { label: 'Example do',       gapKind: 'example',  prompt: 'Give me a clear worked example of this.' },
  solution: { label: 'Solution chahiye', gapKind: 'solution', prompt: 'Solve this step by step and give the full solution.' },
  origin:   { label: 'Kisne diya?',      gapKind: 'origin',   prompt: 'Who discovered or gave this, and roughly when?' },
};

// Wrap a formula so MathText renders it in math mode. Strips any $…$ / \(…\) /
// \[…\] the model may have already added, then re-wraps in the {tex} delimiter
// MathText understands. Plain text (no math) still renders fine.
function toTex(f) {
  const s = String(f || '').trim()
    .replace(/^\$+|\$+$/g, '')
    .replace(/^\\\(|\\\)$/g, '')
    .replace(/^\\\[|\\\]$/g, '')
    .trim();
  return `{tex}${s}{/tex}`;
}

// Compact text form of an assistant turn, for the history we send back to the API
// (the model needs the prior answer's gist to resolve "this"/"that").
function assistantHistoryText(m) {
  if (m.content) return m.content;
  const t = m.teaching;
  if (!t) return '';
  return [t.intro, t.formula ? `Formula: ${t.formula}` : '', t.example ? `Example: ${t.example}` : '']
    .filter(Boolean).join('\n');
}

// Grounded RAG Q&A over teacher-uploaded material. Students ask; the AI answers
// ONLY from the uploaded content (or refuses). Teachers/Admins also get an
// upload + manage panel. This screen does NOT touch the lesson/doubt flow.
const KnowledgeAskScreen = ({ onBack }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [tab, setTab] = useState('ask'); // 'ask' | 'manage'

  // ── Ask state ──
  const [subject, setSubject]   = useState('');   // '' = All (search across everything the user uploaded)
  const [subjects, setSubjects] = useState([]);   // distinct subjects from the user's OWN uploads (DB-derived, not hardcoded)
  const [docs, setDocs]         = useState([]);   // the user's uploaded documents [{ id, title, subject, status, ready }]
  const [selectedDocs, setSelectedDocs] = useState([]); // [] = ask across ALL my files; else only these
  const [pickerOpen, setPickerOpen] = useState(false);  // material picker sheet
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]); // chat thread: { role:'user'|'assistant', content, grounded?, confidence?, sources? }
  const [asking, setAsking]     = useState(false);
  const [askErr, setAskErr]     = useState('');
  const [quizAsked, setQuizAsked] = useState([]); // questions already asked, so "Quiz me" varies
  const [attachedPhoto, setAttachedPhoto] = useState(null); // a picked photo waiting to be sent with a typed instruction
  const scrollRef = React.useRef(null);

  // Subject chips are derived from the user's actual uploaded material, refreshed
  // each time the Q&A tab opens — never a fixed hardcoded list.
  useEffect(() => {
    if (tab !== 'ask') return;
    let alive = true;
    (async () => {
      try {
        const data = await listKnowledgeSources();
        // Keep EVERY upload in the picker (not just READY ones) so a file that is
        // still indexing — or failed — is visibly accounted for instead of silently
        // missing; only READY ones are selectable, since search skips the rest.
        const list = data?.sources || [];
        const uniq = [...new Set(list.filter((s) => s.status === 'READY' || !s.status)
          .map((s) => (s.subject || '').trim()).filter(Boolean))].sort();
        if (alive) {
          setSubjects(uniq);
          const mapped = list.map((s) => ({
            id: s.id,
            title: s.title,
            subject: s.subject || '',
            status: s.status || 'READY',
            ready: s.status === 'READY' || !s.status,
          }));
          setDocs(mapped);
          // Drop any selection whose file was deleted since the last visit, else we
          // would keep sending a dead sourceId and retrieve nothing.
          const live = new Set(mapped.filter((d) => d.ready).map((d) => d.id));
          setSelectedDocs((prev) => prev.filter((id) => live.has(id)));
        }
      } catch (_) {
        if (alive) { setSubjects([]); setDocs([]); }
      }
    })();
    return () => { alive = false; };
  }, [tab]);

  // Current retrieval scope, in words — shown on the picker button so the student
  // always knows which of their uploads an answer can come from.
  const selectedTitles = selectedDocs
    .map((id) => docs.find((d) => d.id === id)?.title)
    .filter(Boolean);
  const scopeLabel = selectedDocs.length === 0
    ? 'All my files'
    : (selectedDocs.length === 1 ? (selectedTitles[0] || '1 file') : `${selectedDocs.length} files`);

  // Thread so far, in the API's role shape (so the AI can resolve "this"/"that"
  // and clarifying questions across turns).
  const buildHistory = () => messages.map((m) => ({
    role: m.role === 'user' ? 'USER' : 'ASSISTANT',
    content: m.role === 'user' ? m.content : assistantHistoryText(m),
  }));

  // `explicit` lets follow-up chips ask a preset question. The send button passes
  // the press event (not a string), so it safely falls back to the typed input.
  const handleAsk = async (explicit) => {
    const q = (typeof explicit === 'string' ? explicit : question).trim();
    if (!q || asking) return;
    const apiHistory = buildHistory();
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setAsking(true);
    setAskErr('');
    try {
      const data = await askKnowledgeStructured({
        question: q,
        subject: subject || undefined,
        sourceIds: selectedDocs.length ? selectedDocs : undefined,
        history: apiHistory,
      });
      setMessages((prev) => [...prev, {
        role: 'assistant',
        grounded: !!data.grounded,
        confidence: data.confidence,
        sources: data.sources,
        teaching: data.teaching,   // null when the material doesn't cover it
        lastQuestion: q,           // so "explain anyway" can re-ask beyond the book
      }]);
    } catch (e) {
      setAskErr(e?.response?.data?.error || e?.message || 'Could not get an answer. Please try again.');
    } finally {
      setAsking(false);
    }
  };

  // "Quiz me" — asks for ONE new question, explicitly listing the ones already
  // asked so the model varies instead of looping the same 2-3. The answer is
  // rendered hidden (revealed on tap), so it stays a real quiz.
  const handleQuiz = async () => {
    if (asking) return;
    const avoid = quizAsked.slice(-6);
    const prompt = avoid.length
      ? `Quiz me with ONE short NEW question about the material. Do NOT repeat any of these already-asked questions: ${avoid.map((q, i) => `(${i + 1}) ${q}`).join(' ')}. Choose a different concept or detail from the material.`
      : 'Quiz me with ONE short question to test my understanding of the material.';
    const apiHistory = buildHistory();
    setMessages((prev) => [...prev, { role: 'user', content: 'Quiz me' }]);
    setAsking(true);
    setAskErr('');
    try {
      const data = await askKnowledgeStructured({
        question: prompt,
        subject: subject || undefined,
        sourceIds: selectedDocs.length ? selectedDocs : undefined,
        history: apiHistory,
      });
      const t = data.teaching;
      setMessages((prev) => [...prev, {
        role: 'assistant',
        grounded: !!data.grounded,
        confidence: data.confidence,
        sources: data.sources,
        teaching: t,
        isQuiz: true,
      }]);
      const q = t && String(t.intro || '').trim();
      if (q) setQuizAsked((prev) => [...prev, q].slice(-10));
    } catch (e) {
      setAskErr(e?.response?.data?.error || e?.message || 'Could not get an answer. Please try again.');
    } finally {
      setAsking(false);
    }
  };

  // Step 1 of photo-solve: ATTACH a photo of the question (does not send yet). The
  // student can then type which question / how they want it before sending. Camera
  // quality is kept modest so the upload stays small (avoids size-based failures).
  const attachPhoto = async () => {
    if (asking) return;
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setAskErr('Camera access is needed to photograph the question.'); return; }
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.5 });
      if (res.canceled || !res.assets?.length) return;
      setAttachedPhoto(res.assets[0]);
      setAskErr('');
    } catch (e) {
      setAskErr('Could not open the camera. Please try again.');
    }
  };

  // Step 2: SEND the attached photo together with the typed instruction (which
  // question / how they want it), then render the step-by-step solution.
  const submitPhoto = async () => {
    const asset = attachedPhoto;
    if (!asset || asking) return;
    const hint = question.trim();
    setMessages((prev) => [...prev, { role: 'user', image: asset.uri, content: hint }]);
    setAttachedPhoto(null);
    setQuestion('');
    setAsking(true);
    setAskErr('');
    try {
      const data = await solvePhoto({
        file: { uri: asset.uri, name: asset.fileName || `question-${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' },
        hint,
      });
      setMessages((prev) => [...prev, {
        role: 'assistant',
        grounded: true,
        fromPhoto: true,
        teaching: data.teaching,
      }]);
    } catch (e) {
      setAskErr(e?.response?.data?.error || e?.message || 'Could not solve that photo. Please try again.');
    } finally {
      setAsking(false);
    }
  };

  // Send button / keyboard submit: a pending photo goes through solve, else a
  // normal grounded question.
  const onSend = () => { if (attachedPhoto) submitPhoto(); else handleAsk(); };

  // Start a fresh thread — so a new, unrelated question isn't retrieved/answered
  // with the previous conversation's context bleeding in.
  const clearChat = () => {
    if (asking) return;
    setMessages([]);
    setQuizAsked([]);
    setAttachedPhoto(null);
    setQuestion('');
    setAskErr('');
  };

  // On-demand gap-filling: general knowledge IS allowed, and the reply is clearly
  // badged "beyond your material". Triggered by a gap chip or the not-covered card.
  const handleExtend = async (gapKind, prompt) => {
    if (asking) return;
    const apiHistory = buildHistory();
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setAsking(true);
    setAskErr('');
    try {
      const data = await extendKnowledge({
        question: prompt,
        gapKind: gapKind || undefined,
        subject: subject || undefined,
        sourceIds: selectedDocs.length ? selectedDocs : undefined,
        history: apiHistory,
      });
      setMessages((prev) => [...prev, {
        role: 'assistant',
        grounded: true,
        beyondMaterial: true,
        teaching: data.teaching,
        sources: data.sources,
      }]);
    } catch (e) {
      setAskErr(e?.response?.data?.error || e?.message || 'Could not get an answer. Please try again.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: COLORS.background }} />}

      <View style={st.header}>
        <PressableScale onPress={onBack} style={st.hIcon} accessibilityLabel="Go back"><ChevronLeft size={20} color={S.ink} strokeWidth={2.6} /></PressableScale>
        <Text style={st.headerTitle} accessibilityRole="header">Ask the Material</Text>
        {tab === 'ask' && messages.length > 0 ? (
          <PressableScale onPress={clearChat} style={st.hIcon} accessibilityLabel="New chat">
            <SquarePen size={17} color={S.indigo} strokeWidth={2.4} />
          </PressableScale>
        ) : (
          <View style={st.hIcon}><BookOpen size={17} color={S.muted} strokeWidth={2.3} /></View>
        )}
      </View>

      {/* Tabs are shown to EVERYONE now — students upload their own material and
          ask about it; teachers/admins manage shared class material. */}
      <View style={st.tabs}>
        {['ask', 'manage'].map((t) => (
          <PressableScale key={t} style={[st.tab, tab === t && st.tabOn]} onPress={() => setTab(t)}
            accessibilityLabel={t === 'ask' ? 'Q and A' : 'My material'} accessibilityState={{ selected: tab === t }}>
            <Text style={[st.tabTxt, tab === t && st.tabTxtOn]}>{t === 'ask' ? 'Q&A' : (isTeacher ? 'Manage Content' : 'My Material')}</Text>
          </PressableScale>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {tab === 'ask' ? (
          <>
            <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
              {/* Subject filter — only shown when the user's own material spans 2+
                  subjects, so it filters something real instead of a fixed list. */}
              {subjects.length >= 2 && (
                <>
                  <Text style={st.lbl}>Subject filter</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipRow}>
                    <PressableScale style={[st.chip, !subject && st.chipOn]} onPress={() => setSubject('')}
                      accessibilityLabel="All subjects" accessibilityState={{ selected: !subject }}>
                      <Text style={[st.chipTxt, !subject && st.chipTxtOn]}>All</Text>
                    </PressableScale>
                    {subjects.map((s) => (
                      <PressableScale key={s} style={[st.chip, subject === s && st.chipOn]} onPress={() => setSubject(s)}
                        accessibilityLabel={`Subject ${s}`} accessibilityState={{ selected: subject === s }}>
                        <Text style={[st.chipTxt, subject === s && st.chipTxtOn]}>{s}</Text>
                      </PressableScale>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Ask-from scope — one tap opens a searchable, multi-select sheet.
                  A chip row does not survive a student with 15 uploads, so the list
                  lives in a sheet and only the current scope shows inline. */}
              {docs.length >= 1 && (
                <>
                  <Text style={[st.lbl, { marginTop: 14 }]}>Ask from</Text>
                  <PressableScale style={st.scopeBtn} onPress={() => setPickerOpen(true)}
                    accessibilityLabel={`Choose material to ask from. Currently ${scopeLabel}`}>
                    <View style={st.scopeIcon}><Layers size={15} color={S.indigo} strokeWidth={2.4} /></View>
                    <Text style={st.scopeTxt} numberOfLines={1}>{scopeLabel}</Text>
                    <ChevronDown size={16} color={S.muted} strokeWidth={2.4} />
                  </PressableScale>
                  {selectedDocs.length > 0 && (
                    <Text style={st.scopeHint} numberOfLines={2}>
                      Sirf in files me se dhoonda jayega — {selectedTitles.join(' · ')}
                    </Text>
                  )}
                </>
              )}

              {/* Empty state — what this screen is */}
              {messages.length === 0 && !asking && !askErr && (
                <View style={st.empty}>
                  <View style={st.emptyIcon}><BookOpen size={30} color={S.indigo} strokeWidth={2} /></View>
                  <Text style={st.emptyTitle}>Ask about your material</Text>
                  <Text style={st.emptyHint}>Upload a PDF or photo in “My Material”, then ask here. It answers only from your uploaded material, and can ask you a quick question back if something’s unclear.</Text>
                </View>
              )}

              {/* ── Chat thread (multi-turn: your questions + AI replies / clarifications) ── */}
              {messages.map((m, i) => (
                m.role === 'user' ? (
                  <Appear key={i} style={st.userRow}>
                    {m.image ? (
                      <View style={st.userPhotoBubble}>
                        <Image source={{ uri: m.image }} style={st.userPhoto} resizeMode="cover" />
                        <Text style={st.userPhotoCap}>{m.content ? m.content : 'Solve this'}</Text>
                      </View>
                    ) : (
                      <View style={st.userBubble}><Text style={st.userTxt}>{m.content}</Text></View>
                    )}
                  </Appear>
                ) : (
                  <AssistantMessage key={i} m={m} onExtend={handleExtend} />
                )
              ))}

              {/* One-tap follow-ups — only under the latest grounded answer */}
              {!asking && messages.length > 0 &&
                messages[messages.length - 1].role === 'assistant' &&
                messages[messages.length - 1].grounded &&
                !messages[messages.length - 1].fromPhoto && (
                <View style={st.followRow}>
                  {FOLLOWUPS.map((f) => (
                    <PressableScale key={f.label} style={st.followChip} onPress={() => (f.quiz ? handleQuiz() : handleAsk(f.prompt))}
                      accessibilityLabel={f.label}>
                      <Text style={st.followTxt}>{f.label}</Text>
                    </PressableScale>
                  ))}
                </View>
              )}

              {asking && (messages.length === 0 || messages[messages.length - 1].role === 'user') && (
                <View style={st.thinkRow}>
                  <ActivityIndicator color={S.indigo} size="small" />
                  <Text style={st.thinkTxt}>Searching the material…</Text>
                </View>
              )}

              {!!askErr && (
                <Appear style={st.errCard}>
                  <CircleAlert size={17} color={S.red} strokeWidth={2.4} />
                  <Text style={st.errTxt}>{askErr}</Text>
                  <PressableScale onPress={handleAsk} accessibilityLabel="Try again"><Text style={st.retryTxt}>Try again</Text></PressableScale>
                </Appear>
              )}
            </ScrollView>

            {/* Attached-photo preview — sits above the input so the student can type
                which question / how they want it before sending. */}
            {attachedPhoto && (
              <View style={st.attachStrip}>
                <Image source={{ uri: attachedPhoto.uri }} style={st.attachThumb} resizeMode="cover" />
                <Text style={st.attachTxt} numberOfLines={2}>Photo lagi hai — neeche likho kaun sa question / kaise chahiye (optional), phir bhejo.</Text>
                <PressableScale onPress={() => setAttachedPhoto(null)} style={st.attachX} accessibilityLabel="Remove photo" disabled={asking}>
                  <X size={16} color={S.muted} strokeWidth={2.4} />
                </PressableScale>
              </View>
            )}

            {/* ── Floating ask bar ── */}
            <View style={st.askBar}>
              <PressableScale
                style={[st.askPhoto, (asking || attachedPhoto) && { opacity: 0.5 }]}
                onPress={attachPhoto}
                disabled={asking || !!attachedPhoto}
                accessibilityLabel="Attach a photo of the question"
              >
                <Camera size={20} color={S.indigo} strokeWidth={2.3} />
              </PressableScale>
              <View style={st.askInputWrap}>
                <TextInput
                  style={st.askInput}
                  placeholder={attachedPhoto ? 'Kaun sa question / kaise chahiye? (optional)' : 'Ask anything about your files…'}
                  placeholderTextColor={S.faint}
                  value={question}
                  onChangeText={setQuestion}
                  onSubmitEditing={onSend}
                  returnKeyType="send"
                  editable={!asking}
                  multiline
                  accessibilityLabel="Your question about the material"
                />
              </View>
              <PressableScale
                style={[st.askSend, (asking || (!question.trim() && !attachedPhoto)) && { opacity: 0.5 }]}
                onPress={onSend}
                disabled={asking || (!question.trim() && !attachedPhoto)}
                accessibilityLabel={attachedPhoto ? 'Solve photo' : 'Ask'}
              >
                {asking ? <ActivityIndicator color="#fff" size="small" /> : <Sparkles size={19} color="#fff" strokeWidth={2.4} />}
              </PressableScale>
            </View>
          </>
        ) : (
          <ManagePanel />
        )}
      </KeyboardAvoidingView>

      <MaterialPicker
        visible={pickerOpen}
        docs={docs}
        selected={selectedDocs}
        onApply={(ids) => { setSelectedDocs(ids); setPickerOpen(false); }}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
};

// ─── Material picker ──────────────────────────────────────────────────────────
// Searchable, multi-select sheet over everything the student has uploaded. An
// empty selection means "all my files" (the backend simply gets no sourceIds),
// which is why "All my files" is a clear-and-apply action rather than a checkbox.
// Selection is staged locally and only committed on Apply, so an accidental tap
// mid-browse never silently changes the scope of the next question.
const MaterialPicker = ({ visible, docs, selected, onApply, onClose }) => {
  const [draft, setDraft] = useState(selected);
  const [q, setQ] = useState('');

  // Re-seed the draft each time the sheet opens (it stays mounted between opens).
  useEffect(() => { if (visible) { setDraft(selected); setQ(''); } }, [visible]);

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? docs.filter((d) => `${d.title} ${d.subject}`.toLowerCase().includes(needle))
    : docs;
  const readyCount = docs.filter((d) => d.ready).length;

  const toggle = (d) => {
    if (!d.ready) return;
    setDraft((prev) => (prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id]));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={st.sheetBackdrop}>
        <View style={st.sheet}>
          <View style={st.sheetHead}>
            <Text style={st.sheetTitle}>Select material</Text>
            <PressableScale onPress={onClose} style={st.sheetX} accessibilityLabel="Close">
              <X size={17} color={S.muted} strokeWidth={2.5} />
            </PressableScale>
          </View>

          <View style={st.searchWrap}>
            <Search size={16} color={S.muted} strokeWidth={2.4} />
            <TextInput
              style={st.searchInput}
              placeholder="Search your uploads…"
              placeholderTextColor={S.faint}
              value={q}
              onChangeText={setQ}
              accessibilityLabel="Search uploaded material"
            />
            {!!q && (
              <PressableScale onPress={() => setQ('')} accessibilityLabel="Clear search">
                <X size={15} color={S.muted} strokeWidth={2.4} />
              </PressableScale>
            )}
          </View>

          <ScrollView style={st.sheetList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {shown.length === 0 ? (
              <Text style={st.emptyList}>{docs.length === 0 ? 'No material uploaded yet.' : 'No file matches that search.'}</Text>
            ) : shown.map((d) => {
              const on = draft.includes(d.id);
              return (
                <PressableScale
                  key={d.id}
                  style={[st.pickRow, on && st.pickRowOn, !d.ready && { opacity: 0.5 }]}
                  onPress={() => toggle(d)}
                  disabled={!d.ready}
                  accessibilityLabel={d.title}
                  accessibilityState={{ selected: on, disabled: !d.ready }}
                >
                  <View style={[st.checkBox, on && st.checkBoxOn]}>
                    {on && <Check size={12} color="#fff" strokeWidth={3.4} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.pickTitle} numberOfLines={1}>{d.title}</Text>
                    <Text style={st.pickMeta} numberOfLines={1}>
                      {[d.subject || null, d.ready ? null : (d.status === 'FAILED' ? 'Failed — could not index' : 'Still indexing…')]
                        .filter(Boolean).join(' · ') || 'Ready'}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </ScrollView>

          <View style={st.sheetFoot}>
            <PressableScale style={st.sheetGhost} onPress={() => onApply([])} accessibilityLabel="Ask from all my files">
              <Text style={st.sheetGhostTxt}>All my files</Text>
            </PressableScale>
            <PressableScale style={st.sheetApply} onPress={() => onApply(draft)} accessibilityLabel="Apply selection">
              <Text style={st.sheetApplyTxt}>
                {draft.length === 0 ? 'Done' : `Ask from ${draft.length} of ${readyCount}`}
              </Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Ms. Nova's byline above an answer.
const NovaHead = ({ label = 'Ms. Nova' }) => (
  <View style={st.novaHead}>
    <TeacherAvatar theme="dark" photo={TEACHER_HEADSHOT} state="idle" expression="smile" size={26} />
    <Text style={st.novaName}>{label}</Text>
  </View>
);

// One cited upload. Tapping it reveals the EXACT passage from that file the answer
// was grounded on — the file's title alone doesn't let a student check the AI.
const SourceRow = ({ s }) => {
  const [open, setOpen] = useState(false);
  const hasSnippet = !!(s.snippet && String(s.snippet).trim());
  const position = (typeof s.chunkIndex === 'number' && s.totalChunks)
    ? `part ${s.chunkIndex + 1} of ${s.totalChunks}`
    : null;

  return (
    <View style={st.sourceItem}>
      <PressableScale
        style={st.sourceRow}
        onPress={() => hasSnippet && setOpen((v) => !v)}
        disabled={!hasSnippet}
        accessibilityLabel={hasSnippet ? `${s.title}. ${open ? 'Hide' : 'Show'} the passage used` : s.title}
        accessibilityState={{ expanded: open }}
      >
        <View style={st.sourceIcon}><FileText size={15} color={S.blue} strokeWidth={2.3} /></View>
        <Text style={st.sourceTitle} numberOfLines={2}>{s.title}</Text>
        {typeof s.similarity === 'number' && (
          <View style={st.simPill}><Text style={st.simTxt}>{Math.round(s.similarity * 100)}% match</Text></View>
        )}
        {hasSnippet && (
          <ChevronDown size={15} color={S.muted} strokeWidth={2.4}
            style={open ? { transform: [{ rotate: '180deg' }] } : null} />
        )}
      </PressableScale>

      {open && hasSnippet && (
        <View style={st.snippetCard}>
          <View style={st.snippetHead}>
            <Quote size={11} color={S.muted} strokeWidth={2.6} />
            <Text style={st.snippetHdr}>Isi hisse se answer bana{position ? ` · ${position}` : ''}</Text>
          </View>
          <Text style={st.snippetTxt}>{s.snippet}</Text>
        </View>
      )}
    </View>
  );
};

// The rich body of an answer: explanation, numbered steps, a rendered formula, a
// drawn whiteboard diagram, and optional example / self-check blocks.
const TeachingView = ({ t, checkHdr = 'Check yourself' }) => (
  <View>
    {!!t.intro && <Text style={st.answerTxt}>{t.intro}</Text>}

    {Array.isArray(t.steps) && t.steps.length > 0 && (
      <View style={st.stepsWrap}>
        {t.steps.map((s, i) => (
          <View key={i} style={st.stepRow}>
            <View style={st.stepNum}><Text style={st.stepNumTxt}>{i + 1}</Text></View>
            <Text style={st.stepTxt}>{s}</Text>
          </View>
        ))}
      </View>
    )}

    {!!t.formula && (
      <View style={st.formulaCard}>
        <MathText value={toTex(t.formula)} fontSize={18} color={S.ink} />
      </View>
    )}

    {t.diagram ? (
      <View style={st.diagramCard}>
        <DiagramRenderer bare light shape={t.diagram.shape} caption={t.diagram.caption} data={t.diagram.data} />
      </View>
    ) : null}

    {!!t.example && (
      <View style={st.exampleCard}>
        <Text style={st.blockHdr}>Example</Text>
        <Text style={st.blockTxt}>{t.example}</Text>
      </View>
    )}

    {!!t.quickCheck && (
      <View style={st.checkCard}>
        <Text style={st.blockHdr}>{checkHdr}</Text>
        <Text style={st.blockTxt}>{t.quickCheck}</Text>
      </View>
    )}
  </View>
);

// A quiz turn: the question is shown, the answer stays hidden until the student
// taps "Show answer" — so "Quiz me" is an actual check, not a giveaway.
const QuizCard = ({ t }) => {
  const [show, setShow] = useState(false);
  return (
    <View>
      {!!t.intro && <Text style={st.answerTxt}>{t.intro}</Text>}
      {!!t.quickCheck && (show ? (
        <View style={st.checkCard}>
          <Text style={st.blockHdr}>Answer</Text>
          <Text style={st.blockTxt}>{t.quickCheck}</Text>
        </View>
      ) : (
        <PressableScale style={st.showAnsBtn} onPress={() => setShow(true)} accessibilityLabel="Show answer">
          <Text style={st.showAnsTxt}>Show answer</Text>
        </PressableScale>
      ))}
    </View>
  );
};

// One assistant turn. Renders the grounded teaching, the "beyond your book" badge
// for extended replies, sources, and the on-demand gap chips.
const AssistantMessage = ({ m, onExtend }) => {
  const t = m.teaching;
  const grounded = m.grounded;
  const beyond = m.beyondMaterial;
  const gaps = (t && Array.isArray(t.gaps) && !m.isQuiz) ? t.gaps.filter((g) => GAP_META[g]) : [];

  return (
    <Appear style={[st.answerCard, !grounded && st.answerCardEmpty, beyond && st.answerCardBeyond]}>
      <View style={st.answerHead}>
        <NovaHead label={grounded ? 'Ms. Nova' : 'Not found'} />
        {grounded && !beyond && typeof m.confidence === 'number' && (
          <View style={st.confPill}>
            <Text style={st.confTxt}>{Math.round(m.confidence * 100)}% match</Text>
          </View>
        )}
      </View>

      {beyond && (
        <View style={st.beyondBadge}>
          <Sparkles size={12} color={S.orange} strokeWidth={2.6} />
          <Text style={st.beyondTxt}>Aapki book se bahar · general knowledge</Text>
        </View>
      )}

      {m.fromPhoto && (
        <View style={st.photoBadge}>
          <Camera size={12} color={S.indigo} strokeWidth={2.6} />
          <Text style={st.photoBadgeTxt}>Photo se solve kiya</Text>
        </View>
      )}

      {t
        ? (m.isQuiz
            ? <QuizCard t={t} />
            : <TeachingView t={t} checkHdr={m.fromPhoto ? 'Final answer' : 'Check yourself'} />)
        : <Text style={st.answerTxt}>{m.content || 'This topic is not covered in the uploaded learning material.'}</Text>}

      {grounded && Array.isArray(m.sources) && m.sources.length > 0 && (
        <View style={st.sourceBox}>
          <Text style={st.sourceHdr}>{beyond ? 'Related material' : 'Source material'}</Text>
          {m.sources.map((s) => <SourceRow key={s.sourceId} s={s} />)}
        </View>
      )}

      {/* On-demand "beyond your book" chips — only what the material genuinely lacks. */}
      {!beyond && gaps.length > 0 && (
        <View style={st.gapWrap}>
          <Text style={st.gapHdr}>Book me nahi hai — chahiye to:</Text>
          <View style={st.followRow}>
            {gaps.map((g) => (
              <PressableScale key={g} style={st.gapChip} onPress={() => onExtend(GAP_META[g].gapKind, GAP_META[g].prompt)}
                accessibilityLabel={GAP_META[g].label}>
                <Text style={st.gapChipTxt}>{GAP_META[g].label}</Text>
              </PressableScale>
            ))}
          </View>
        </View>
      )}

      {!grounded && (
        <>
          <Text style={st.noContentHint}>
            Try rephrasing, or upload material on this topic in “My Material”.
          </Text>
          <PressableScale
            style={[st.gapChip, { alignSelf: 'flex-start', marginTop: 12 }]}
            onPress={() => onExtend('', m.lastQuestion || 'Explain this topic clearly.')}
            accessibilityLabel="Explain from general knowledge"
          >
            <Text style={st.gapChipTxt}>General knowledge se samjhau?</Text>
          </PressableScale>
        </>
      )}
    </Appear>
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
      setMsg('Uploaded and indexed');
      setTitle(''); setText(''); setSubject(''); setGrade('');
      refresh();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Upload failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── File upload (PDF / photo) ──
  // A picked file is transcribed + indexed server-side. Title defaults to the
  // form's title, else the file's own name (extension stripped).
  const uploadFile = async (file) => {
    if (saving) return;
    const derivedTitle = title.trim() || String(file.name || '').replace(/\.[a-z0-9]+$/i, '').trim() || 'Uploaded material';
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      await uploadKnowledgeFile({
        file,
        title: derivedTitle,
        subject: subject.trim() || undefined,
        gradeLevel: gradeLevel.trim() || undefined,
      });
      setMsg('Uploaded and indexed');
      setTitle(''); setText(''); setSubject(''); setGrade('');
      refresh();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Upload failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pickPdf = async () => {
    const DocumentPicker = loadDocumentPicker();
    if (!DocumentPicker) {
      setErr('PDF upload needs the latest app build. Please update the app, or use a photo for now.');
      return;
    }
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      await uploadFile({ uri: a.uri, name: a.name, type: a.mimeType || 'application/pdf' });
    } catch (e) {
      setErr('Could not open that file. Please try again.');
    }
  };

  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setErr('Photo access is needed to upload an image.'); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      await uploadFile({ uri: a.uri, name: a.fileName || `photo-${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg' });
    } catch (e) {
      setErr('Could not open that photo. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setErr('Camera access is needed to take a photo.'); return; }
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      await uploadFile({ uri: a.uri, name: a.fileName || `page-${Date.now()}.jpg`, type: a.mimeType || 'image/jpeg' });
    } catch (e) {
      setErr('Could not open the camera. Please try again.');
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
      <Text style={st.q}>Add learning material</Text>
      <Text style={st.hint}>Upload a PDF or a photo of your notes / textbook page — or paste text. It’s read, indexed, and made searchable so you can ask questions about it.</Text>

      {/* ── Quick upload: PDF / photo / camera ── */}
      <View style={st.uploadRow}>
        <PressableScale style={[st.upBtn, saving && { opacity: 0.5 }]} onPress={pickPdf} disabled={saving} accessibilityLabel="Upload a PDF">
          <FileUp size={20} color={S.indigo} strokeWidth={2.3} />
          <Text style={st.upTxt}>PDF</Text>
        </PressableScale>
        <PressableScale style={[st.upBtn, saving && { opacity: 0.5 }]} onPress={pickPhoto} disabled={saving} accessibilityLabel="Upload a photo">
          <ImagePlus size={20} color={S.indigo} strokeWidth={2.3} />
          <Text style={st.upTxt}>Photo</Text>
        </PressableScale>
        <PressableScale style={[st.upBtn, saving && { opacity: 0.5 }]} onPress={takePhoto} disabled={saving} accessibilityLabel="Take a photo">
          <Camera size={20} color={S.indigo} strokeWidth={2.3} />
          <Text style={st.upTxt}>Camera</Text>
        </PressableScale>
      </View>

      {saving && (
        <View style={st.busyRow}>
          <ActivityIndicator color={S.indigo} size="small" />
          <Text style={st.busyTxt}>Reading &amp; indexing… this can take a few seconds.</Text>
        </View>
      )}
      {!!msg && <View style={st.okRow}><Check size={14} color={S.emerald} strokeWidth={3} /><Text style={st.ok}>{msg}</Text></View>}
      {!!err && <Text style={st.err}>{err}</Text>}

      <Text style={st.orLbl}>OR PASTE TEXT</Text>

      <View style={st.formCard}>
        <Text style={st.lbl}>Title</Text>
        <TextInput style={st.inputSm} placeholder="e.g. Chapter 3 — Laws of Motion" placeholderTextColor={S.faint} value={title} onChangeText={setTitle} editable={!saving} />

        <View style={st.row2}>
          <View style={{ flex: 1 }}>
            <Text style={st.lbl}>Subject</Text>
            <TextInput style={st.inputSm} placeholder="Physics" placeholderTextColor={S.faint} value={subject} onChangeText={setSubject} editable={!saving} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.lbl}>Grade</Text>
            <TextInput style={st.inputSm} placeholder="8" placeholderTextColor={S.faint} value={gradeLevel} onChangeText={setGrade} editable={!saving} />
          </View>
        </View>

        <Text style={[st.lbl, { marginTop: 14 }]}>Content</Text>
        <TextInput
          style={st.textArea}
          placeholder="Paste the learning material here…"
          placeholderTextColor={S.faint}
          value={text}
          onChangeText={setText}
          multiline
          editable={!saving}
        />

        <PrimaryButton
          label="Upload & Index"
          loading={saving}
          disabled={saving || !title.trim() || !text.trim()}
          onPress={handleUpload}
          style={st.btn}
        />
      </View>

      <Text style={[st.lbl, { marginTop: 26 }]}>Uploaded content</Text>
      {loadingList ? (
        <ActivityIndicator color={S.indigo} style={{ marginTop: 16 }} />
      ) : sources.length === 0 ? (
        <Text style={st.emptyList}>No material uploaded yet.</Text>
      ) : (
        sources.map((s) => (
          <View key={s.id} style={st.srcItem}>
            <View style={st.matIcon}><BookOpen size={16} color={S.indigo} strokeWidth={2.3} /></View>
            <View style={{ flex: 1 }}>
              <Text style={st.srcTitle} numberOfLines={1}>{s.title}</Text>
              <Text style={st.srcMeta}>
                {[s.subject, s.gradeLevel ? `Grade ${s.gradeLevel}` : null, `${s.chunkCount} chunks`, s.status]
                  .filter(Boolean).join(' · ')}
              </Text>
            </View>
            <PressableScale onPress={() => handleDelete(s.id)} style={st.delBtn} accessibilityLabel={`Delete ${s.title}`}>
              <Trash2 size={14} color={S.red} strokeWidth={2.4} />
            </PressableScale>
          </View>
        ))
      )}
    </ScrollView>
  );
};


const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: S.canvas },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SP.md, paddingVertical: 12, backgroundColor: S.card, borderBottomWidth: 1, borderBottomColor: S.hair },
  hIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: S.canvas, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: F.xbold, color: S.ink, letterSpacing: -0.2 },

  // segmented-pill tabs (the dark reference's control, not the light build's
  // underline tabs — a rounded track with the active option as a solid fill)
  tabs: { flexDirection: 'row', gap: 4, marginHorizontal: SP.lg, marginTop: 4, marginBottom: 4, padding: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.pill },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: R.pill },
  tabOn: { backgroundColor: S.indigo, ...shadowSm },
  tabTxt: { fontSize: 13.5, fontFamily: F.bold, color: S.muted },
  tabTxtOn: { color: '#fff', fontFamily: F.xbold },

  body: { padding: SP.lg, paddingBottom: 24, flexGrow: 1 },
  q: { fontSize: 21, fontFamily: F.black, color: S.ink, letterSpacing: -0.4 },
  hint: { fontSize: 13, fontFamily: F.med, color: S.muted, marginTop: 6, marginBottom: 18, lineHeight: 19 },
  lbl: { fontSize: 10.5, fontFamily: F.xbold, color: S.muted, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10 },

  chipRow: { gap: 8, paddingVertical: 2, paddingRight: SP.lg },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: R.pill, borderWidth: 1, borderColor: S.border, backgroundColor: S.card },
  chipOn: { backgroundColor: S.indigo, borderColor: S.indigo },
  chipTxt: { fontSize: 13, fontFamily: F.bold, color: S.sub },
  chipTxtOn: { color: '#fff' },

  // ask-from scope button (opens the material picker sheet)
  scopeBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: S.card, borderWidth: 1, borderColor: S.border, borderRadius: R.md, paddingVertical: 11, paddingHorizontal: 12 },
  scopeIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center' },
  scopeTxt: { flex: 1, fontSize: 13.5, fontFamily: F.bold, color: S.ink },
  scopeHint: { fontSize: 11.5, fontFamily: F.med, color: S.muted, marginTop: 7, lineHeight: 17 },

  // material picker sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15,17,26,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: S.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16, maxHeight: '82%' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.lg, marginBottom: 14 },
  sheetTitle: { fontSize: 17, fontFamily: F.xbold, color: S.ink, letterSpacing: -0.3 },
  sheetX: { width: 34, height: 34, borderRadius: 17, backgroundColor: S.canvas, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: SP.lg, backgroundColor: S.canvas, borderWidth: 1, borderColor: S.hair, borderRadius: R.md, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: F.med, color: S.ink, paddingVertical: 0 },
  sheetList: { paddingHorizontal: SP.lg, marginTop: 12 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: S.canvas, borderWidth: 1, borderColor: S.hair, borderRadius: R.md, padding: 12, marginBottom: 8 },
  pickRowOn: { borderColor: S.indigo, backgroundColor: S.indigoSoft },
  checkBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.6, borderColor: S.border, backgroundColor: S.card, alignItems: 'center', justifyContent: 'center' },
  checkBoxOn: { backgroundColor: S.indigo, borderColor: S.indigo },
  pickTitle: { fontSize: 13.5, fontFamily: F.bold, color: S.ink },
  pickMeta: { fontSize: 11, fontFamily: F.med, color: S.muted, marginTop: 3 },
  sheetFoot: { flexDirection: 'row', gap: 10, paddingHorizontal: SP.lg, paddingTop: 14, borderTopWidth: 1, borderTopColor: S.hair, marginTop: 8 },
  sheetGhost: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: R.md, borderWidth: 1, borderColor: S.border, backgroundColor: S.card, alignItems: 'center', justifyContent: 'center' },
  sheetGhostTxt: { fontSize: 13.5, fontFamily: F.bold, color: S.sub },
  sheetApply: { flex: 1, paddingVertical: 14, borderRadius: R.md, backgroundColor: S.indigo, alignItems: 'center', justifyContent: 'center', ...shadowSm },
  sheetApplyTxt: { fontSize: 14, fontFamily: F.bold, color: '#fff', letterSpacing: -0.2 },

  // empty state
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: SP.lg },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center', marginBottom: SP.md },
  emptyTitle: { fontSize: 17, fontFamily: F.xbold, color: S.ink },
  emptyHint: { fontSize: 13, fontFamily: F.med, color: S.muted, textAlign: 'center', lineHeight: 20, marginTop: 6, maxWidth: 280 },

  // chat bubbles — the sent question is the one saturated surface on the page
  userRow: { alignItems: 'flex-end', marginTop: SP.lg },
  userBubble: { maxWidth: '88%', backgroundColor: S.indigo, borderRadius: R.xl, borderTopRightRadius: 6, paddingVertical: 12, paddingHorizontal: 16, ...shadowSm },
  userTxt: { color: '#fff', fontSize: 14, fontFamily: F.med, lineHeight: 21 },
  // photographed question shown as the student's turn
  userPhotoBubble: { maxWidth: '72%', backgroundColor: S.indigo, borderRadius: R.xl, borderTopRightRadius: 6, padding: 5, ...shadowSm },
  userPhoto: { width: 190, height: 150, borderRadius: R.lg, backgroundColor: S.canvas },
  userPhotoCap: { color: '#fff', fontSize: 11.5, fontFamily: F.bold, textAlign: 'center', paddingVertical: 6 },

  thinkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: SP.lg },
  thinkTxt: { fontSize: 13, fontFamily: F.bold, color: S.sub },

  // one-tap follow-up chips under the latest answer
  followRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  followChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: S.indigo, backgroundColor: S.indigoSoft },
  followTxt: { fontSize: 12.5, fontFamily: F.bold, color: S.indigo },

  novaWrap: { marginTop: SP.lg },
  novaHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  novaName: { fontSize: 12, fontFamily: F.xbold, color: S.indigo },

  // answer
  answerCard: { marginTop: SP.lg, backgroundColor: S.card, borderRadius: R.xl, borderTopLeftRadius: 6, borderWidth: 1, borderColor: S.hair, padding: 18, ...shadowSm },
  // a refusal ("not in your material") is a state, not an error — amber, not red
  answerCardEmpty: { backgroundColor: S.orangeSoft, borderColor: S.orange },
  answerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  confPill: { backgroundColor: S.emeraldSoft, borderWidth: 1, borderColor: S.emerald, borderRadius: 9, paddingVertical: 3, paddingHorizontal: 9 },
  confTxt: { fontSize: 10.5, fontFamily: F.xbold, color: S.sub },
  answerTxt: { fontSize: 14.5, fontFamily: F.med, color: S.sub, lineHeight: 23 },
  noContentHint: { fontSize: 13, fontFamily: F.med, color: S.sub, marginTop: 10, lineHeight: 19 },

  // extended (general-knowledge) answers get an amber left accent + badge, so a
  // student can always tell book-content from beyond-the-book content at a glance.
  answerCardBeyond: { borderColor: S.orange, borderLeftWidth: 3 },
  beyondBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: S.orangeSoft, borderWidth: 1, borderColor: S.orange, borderRadius: R.pill, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 12 },
  beyondTxt: { fontSize: 10.5, fontFamily: F.xbold, color: S.ink, letterSpacing: 0.1 },
  photoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: S.indigoSoft, borderWidth: 1, borderColor: S.indigo, borderRadius: R.pill, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 12 },
  photoBadgeTxt: { fontSize: 10.5, fontFamily: F.xbold, color: S.indigo, letterSpacing: 0.1 },

  // numbered teaching steps
  stepsWrap: { marginTop: 14, gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumTxt: { fontSize: 11, fontFamily: F.xbold, color: S.indigo },
  stepTxt: { flex: 1, fontSize: 14, fontFamily: F.med, color: S.sub, lineHeight: 21 },

  // rendered formula
  formulaCard: { marginTop: 14, backgroundColor: S.canvas, borderWidth: 1, borderColor: S.hair, borderRadius: R.md, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },

  // drawn whiteboard diagram
  diagramCard: { marginTop: 14, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, borderRadius: R.md, paddingVertical: 12 },

  // example / self-check blocks
  exampleCard: { marginTop: 14, backgroundColor: S.blueSoft, borderRadius: R.md, padding: 14 },
  checkCard: { marginTop: 14, backgroundColor: S.indigoSoft, borderRadius: R.md, padding: 14 },
  blockHdr: { fontSize: 10, fontFamily: F.xbold, color: S.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  blockTxt: { fontSize: 14, fontFamily: F.med, color: S.sub, lineHeight: 21 },

  // quiz "show answer"
  showAnsBtn: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: R.pill, borderWidth: 1, borderColor: S.indigo, backgroundColor: S.indigoSoft },
  showAnsTxt: { fontSize: 12.5, fontFamily: F.bold, color: S.indigo },

  // on-demand gap chips
  gapWrap: { marginTop: 16, borderTopWidth: 1, borderTopColor: S.hair, paddingTop: 12 },
  gapHdr: { fontSize: 11, fontFamily: F.bold, color: S.muted, marginBottom: 8 },
  gapChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: S.orange, backgroundColor: S.orangeSoft },
  gapChipTxt: { fontSize: 12.5, fontFamily: F.bold, color: S.ink },

  // sources
  sourceCard: { marginTop: 14, backgroundColor: S.card, borderRadius: R.lg, borderWidth: 1, borderColor: S.hair, padding: 16 },
  sourceBox: { marginTop: 16, borderTopWidth: 1, borderTopColor: S.hair, paddingTop: 12 },
  sourceHdr: { fontSize: 10, fontFamily: F.xbold, color: S.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  sourceItem: { marginBottom: 8 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: S.canvas, borderWidth: 1, borderColor: S.hair, borderRadius: R.md, padding: 10 },
  sourceIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: S.blueSoft, alignItems: 'center', justifyContent: 'center' },
  sourceTitle: { flex: 1, fontSize: 12.5, fontFamily: F.bold, color: S.ink },
  simPill: { backgroundColor: S.emeraldSoft, borderWidth: 1, borderColor: S.emerald, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  simTxt: { fontSize: 10, fontFamily: F.xbold, color: S.sub },
  // the exact passage the answer was grounded on, revealed on tap
  snippetCard: { marginTop: -2, marginHorizontal: 6, backgroundColor: S.blueSoft, borderBottomLeftRadius: R.md, borderBottomRightRadius: R.md, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 },
  snippetHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  snippetHdr: { fontSize: 10, fontFamily: F.xbold, color: S.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
  snippetTxt: { fontSize: 12.5, fontFamily: F.med, color: S.sub, lineHeight: 20, fontStyle: 'italic' },

  // floating ask bar
  // In-flow ask bar (NOT absolute) so the KeyboardAvoidingView lifts it above the
  // Android keyboard instead of leaving it hidden behind it.
  askBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: S.card, borderTopWidth: 1, borderColor: S.hair, paddingHorizontal: SP.md, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 22 : 12 },
  askPhoto: { width: 44, height: 44, borderRadius: 22, backgroundColor: S.indigoSoft, borderWidth: 1, borderColor: S.indigo, alignItems: 'center', justifyContent: 'center' },
  // attached-photo preview strip above the input
  attachStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: S.indigoSoft, borderTopWidth: 1, borderColor: S.indigo, paddingHorizontal: SP.md, paddingVertical: 10 },
  attachThumb: { width: 46, height: 46, borderRadius: 10, backgroundColor: S.canvas, borderWidth: 1, borderColor: S.indigo },
  attachTxt: { flex: 1, fontSize: 12, fontFamily: F.semi, color: S.ink, lineHeight: 17 },
  attachX: { width: 30, height: 30, borderRadius: 15, backgroundColor: S.card, alignItems: 'center', justifyContent: 'center' },
  askInputWrap: { flex: 1, backgroundColor: S.canvas, borderWidth: 1, borderColor: S.hair, borderRadius: 24, paddingHorizontal: 16, justifyContent: 'center', minHeight: 44 },
  askInput: { fontSize: 14, fontFamily: F.med, color: S.ink, paddingVertical: Platform.OS === 'ios' ? 12 : 8, maxHeight: 96 },
  askSend: { width: 44, height: 44, borderRadius: 22, backgroundColor: S.indigo, alignItems: 'center', justifyContent: 'center', shadowColor: S.indigo, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },

  // errors / status
  errCard: { marginTop: SP.lg, backgroundColor: S.redSoft, borderWidth: 1, borderColor: S.red, borderRadius: R.lg, padding: SP.md, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errTxt: { flex: 1, color: S.ink, fontSize: 13, fontFamily: F.semi },
  retryTxt: { color: S.ink, fontSize: 13, fontFamily: F.xbold },
  err: { color: S.ink, fontSize: 12, fontFamily: F.semi, marginTop: 12 },
  okRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  ok: { color: S.sub, fontSize: 12, fontFamily: F.bold },

  // manage panel — file pickers
  uploadRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  upBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 18, backgroundColor: S.indigoSoft, borderWidth: 1, borderColor: S.indigo, borderRadius: R.lg },
  upTxt: { fontSize: 12.5, fontFamily: F.xbold, color: S.indigo },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  busyTxt: { fontSize: 12.5, fontFamily: F.bold, color: S.sub, flex: 1 },
  orLbl: { fontSize: 10, fontFamily: F.xbold, color: S.muted, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', marginTop: 22, marginBottom: 14 },

  // manage panel
  formCard: { backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, borderRadius: R.xl, padding: 16, ...shadowSm },
  inputSm: { backgroundColor: S.canvas, borderWidth: 1, borderColor: S.border, borderRadius: R.md, paddingVertical: 12, paddingHorizontal: 16, fontSize: 14, fontFamily: F.med, color: S.ink },
  textArea: { backgroundColor: S.canvas, borderWidth: 1, borderColor: S.border, borderRadius: R.md, paddingVertical: 14, paddingHorizontal: 16, fontSize: 14, fontFamily: F.med, color: S.ink, minHeight: 150, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12, marginTop: 14 },
  // PrimaryButton (brand) owns its own fill/radius/shadow — this only spaces it.
  btn: { marginTop: 18 },

  emptyList: { fontSize: 13, fontFamily: F.med, color: S.muted, marginTop: 12, textAlign: 'center' },
  // Each upload as its own card/chip — a plain list of files (icon + name),
  // never the AI-analysis content (concepts/example/check-yourself) that lives
  // in the Q&A tab's chat thread instead. Multiple uploads just stack here.
  srcItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, borderRadius: R.lg, padding: 12, marginTop: 10, ...shadowSm },
  matIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: S.indigoSoft, alignItems: 'center', justifyContent: 'center' },
  srcTitle: { fontSize: 13.5, fontFamily: F.xbold, color: S.ink },
  srcMeta: { fontSize: 11, fontFamily: F.med, color: S.muted, marginTop: 3 },
  delBtn: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: S.redSoft },
});

export default KnowledgeAskScreen;
