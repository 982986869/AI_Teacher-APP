import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable,
  StatusBar, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator, Image, Modal,
} from 'react-native';
import {
  useFonts as useAuroraFonts,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useAuth } from '../context/AuthContext';
import TeacherAvatar from '../components/teacher/TeacherAvatar';
import { TEACHER_HEADSHOT } from '../components/teacher/teacherIdentity';
import { SP, R } from '../components/teacher/premiumTheme';
// Night palette — the same one AITeacherScreen (this screen's parent) and the
// Student Home are built on, so "Ask the Material" reads as part of that flow
// instead of a white sheet dropped into a dark product.
// The one rule that shapes the colour choices here: HUE LIVES IN GRAPHICS (pills,
// icons, borders, the violet byline bar), TEXT STAYS INK/INKSOFT — a 10px label
// on a saturated green pill cannot clear AA in white, so it goes dark instead.
// SpaceGrotesk (NFONT) is loaded by AITeacherScreen before this screen can mount.
import { N, NFONT } from '../theme/nightTheme';
import { NightBg } from '../theme/nightChrome';
import { ChevronLeft, BookOpen, Sparkles, FileText, CircleAlert, Trash2, Check, FileUp, ImagePlus, Camera, X, SquarePen, ChevronDown, Search, Quote, MoreVertical } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Appear, PressableScale } from '../components/teacher/uiKit';
import PrimaryButton from '../components/brand/PrimaryButton';
import DiagramRenderer from '../components/teacher/DiagramRenderer';
import MathText from '../components/MathText';
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

  // The night styles below are set in SpaceGrotesk. AITeacherScreen (the only way
  // in) has already loaded it, so this resolves instantly — it's here so the screen
  // still gets its own type if it is ever mounted from somewhere else.
  useAuroraFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  });

  const [tab, setTab] = useState('ask'); // 'ask' | 'manage'

  // ── Ask state ──
  const [subject, setSubject]   = useState('');   // '' = All (search across everything the user uploaded)
  const [subjects, setSubjects] = useState([]);   // distinct subjects from the user's OWN uploads (DB-derived, not hardcoded)
  const [docs, setDocs]         = useState([]);   // the user's uploaded documents [{ id, title, subject, status, ready }]
  const [selectedDocs, setSelectedDocs] = useState([]); // [] = ask across ALL my files; else only these
  const [pickerOpen, setPickerOpen] = useState(false);  // material picker sheet
  const [menuOpen, setMenuOpen]     = useState(false);  // header ⋮ menu (New chat)
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
      <StatusBar barStyle="light-content" backgroundColor={N.bgTop} />
      <NightBg id="kask" />
      {Platform.OS === 'android' && <View style={{ height: 24 }} />}

      <View style={st.header}>
        <PressableScale onPress={onBack} style={st.hIcon} accessibilityLabel="Go back">
          <ChevronLeft size={22} color={N.ink} strokeWidth={2.4} />
        </PressableScale>
        {/* Centred by flexing the title, not by absolute positioning — the two
            icon buttons are the same width, so it lands optically centred. */}
        <Text style={st.headerTitle} numberOfLines={1} accessibilityRole="header">Ask the Material</Text>
        <PressableScale onPress={() => setMenuOpen(true)} style={st.hIcon} accessibilityLabel="More options">
          <MoreVertical size={20} color={N.ink} strokeWidth={2.4} />
        </PressableScale>
      </View>

      {/* Tabs are shown to EVERYONE now — students upload their own material and
          ask about it; teachers/admins manage shared class material. */}
      <View style={st.tabs}>
        {['ask', 'manage'].map((t) => (
          <PressableScale key={t} style={[st.tab, tab === t && st.tabOn]} onPress={() => setTab(t)}
            accessibilityLabel={t === 'ask' ? 'Q and A' : 'My material'} accessibilityState={{ selected: tab === t }}>
            <Text style={[st.tabTxt, tab === t && st.tabTxtOn]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{t === 'ask' ? 'Q&A AI' : (isTeacher ? 'Manage Content' : 'My Material')}</Text>
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
              <>
                  {/* Scope reads as one sentence — "ASK FROM · <material>" — with the
                      material itself as the tappable chip that opens the picker. */}
                  <View style={st.scopeRow}>
                    <Text style={st.scopeLbl}>ASK FROM</Text>
                    <PressableScale style={st.scopeChip} onPress={() => setPickerOpen(true)}
                      accessibilityLabel={`Choose material to ask from. Currently ${scopeLabel}`}>
                      <Text style={st.scopeChipTxt} numberOfLines={1}>{scopeLabel}</Text>
                      <ChevronDown size={13} color={N.ink} strokeWidth={2.8} />
                    </PressableScale>
                  </View>
                  {selectedDocs.length > 0 && (
                    <Text style={st.scopeHint} numberOfLines={2}>
                      Sirf in files me se dhoonda jayega — {selectedTitles.join(' · ')}
                    </Text>
                  )}
              </>

              {/* Empty state — what this screen is */}
              {messages.length === 0 && !asking && !askErr && (
                <View style={st.empty}>
                  <View style={st.emptyIcon}><BookOpen size={44} color={N.btnInk} strokeWidth={2} /></View>
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
                <View style={st.thinkCard}>
                  <View style={st.thinkSpinner}><ActivityIndicator color={N.ink} size="small" /></View>
                  <Text style={st.thinkTitle}>Searching the material…</Text>
                  <Text style={st.thinkTxt}>
                    {selectedTitles.length === 1 ? `Looking deep inside ${selectedTitles[0]}` : 'Looking deep inside your files'}
                  </Text>
                </View>
              )}

              {!!askErr && (
                <Appear style={st.errCard}>
                  <CircleAlert size={17} color={N.red} strokeWidth={2.4} />
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
                  <X size={16} color={N.inkSoft} strokeWidth={2.4} />
                </PressableScale>
              </View>
            )}

            {/* ── Ask bar — one floating pill: attach · input · send ── */}
            <View style={st.askBar}>
              <PressableScale
                style={[st.askPhoto, (asking || attachedPhoto) && { opacity: 0.5 }]}
                onPress={attachPhoto}
                disabled={asking || !!attachedPhoto}
                accessibilityLabel="Attach a photo of the question"
              >
                <Camera size={20} color={N.ink} strokeWidth={2.3} />
              </PressableScale>
              <View style={st.askInputWrap}>
                <TextInput
                  style={st.askInput}
                  placeholder={attachedPhoto ? 'Kaun sa question / kaise chahiye? (optional)' : 'Ask anything about your files…'}
                  placeholderTextColor={N.inkDim}
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
                {asking ? <ActivityIndicator color={N.ink} size="small" /> : <Sparkles size={20} color={N.ink} strokeWidth={2.4} />}
              </PressableScale>
            </View>
          </>
        ) : (
          <ManagePanel />
        )}
      </KeyboardAvoidingView>

      {/* ⋮ menu — holds the actions the header used to expose as bare icons, so the
          chrome stays two buttons wide no matter how many actions we add. */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={st.menuBackdrop} onPress={() => setMenuOpen(false)} accessibilityLabel="Close menu">
          <View style={st.menuCard}>
            <PressableScale
              style={[st.menuItem, (asking || messages.length === 0) && { opacity: 0.45 }]}
              onPress={() => { setMenuOpen(false); clearChat(); }}
              disabled={asking || messages.length === 0}
              accessibilityLabel="Start a new chat"
            >
              <SquarePen size={16} color={N.violet} strokeWidth={2.4} />
              <Text style={st.menuTxt}>New chat</Text>
            </PressableScale>
            <PressableScale
              style={st.menuItem}
              onPress={() => { setMenuOpen(false); setTab('manage'); }}
              accessibilityLabel={isTeacher ? 'Manage content' : 'My material'}
            >
              <BookOpen size={16} color={N.violet} strokeWidth={2.4} />
              <Text style={st.menuTxt}>{isTeacher ? 'Manage content' : 'My material'}</Text>
            </PressableScale>
          </View>
        </Pressable>
      </Modal>

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
              <X size={16} color={SHEET.ink} strokeWidth={2.4} />
            </PressableScale>
          </View>

          <View style={st.searchWrap}>
            <Search size={19} color={SHEET.sub} strokeWidth={2.4} />
            <TextInput
              style={st.searchInput}
              placeholder="Search your uploads…"
              placeholderTextColor={SHEET.sub}
              value={q}
              onChangeText={setQ}
              accessibilityLabel="Search uploaded material"
            />
            {!!q && (
              <PressableScale onPress={() => setQ('')} accessibilityLabel="Clear search">
                <X size={16} color={SHEET.sub} strokeWidth={2.4} />
              </PressableScale>
            )}
          </View>

          <ScrollView style={st.sheetList} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {shown.length === 0 ? (
              <Text style={st.sheetEmpty}>{docs.length === 0 ? 'No material uploaded yet.' : 'No file matches that search.'}</Text>
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
                    {on && <Check size={17} color={N.violet} strokeWidth={3.6} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.pickTitle, on && st.pickTitleOn]} numberOfLines={1}>{d.title}</Text>
                    <Text style={[st.pickMeta, on && st.pickMetaOn]} numberOfLines={1}>
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
                {draft.length === 0 ? 'Done' : `Ask from ${draft.length} file${draft.length > 1 ? 's' : ''}`}
              </Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Ms. Nova's byline — a violet bar that sits ABOVE the answer card, so who is
// speaking and how well the material matched read in one glance, separate from
// the answer itself.
const NovaHead = ({ label = 'Ms. Nova', role = 'AI Instructor Partner' }) => (
  <View style={st.novaHead}>
    <TeacherAvatar theme="dark" photo={TEACHER_HEADSHOT} state="idle" expression="smile" size={38} />
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={st.novaName} numberOfLines={1}>{label}</Text>
      <Text style={st.novaRole} numberOfLines={1}>{role}</Text>
    </View>
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
        <View style={st.sourceIcon}><FileText size={15} color={N.blue} strokeWidth={2.3} /></View>
        <Text style={st.sourceTitle} numberOfLines={2}>{s.title}</Text>
        {typeof s.similarity === 'number' && (
          <View style={st.simPill}><Text style={st.simTxt}>{Math.round(s.similarity * 100)}% match</Text></View>
        )}
        {hasSnippet && (
          <ChevronDown size={15} color={N.inkSoft} strokeWidth={2.4}
            style={open ? { transform: [{ rotate: '180deg' }] } : null} />
        )}
      </PressableScale>

      {open && hasSnippet && (
        <View style={st.snippetCard}>
          <View style={st.snippetHead}>
            <Quote size={11} color={N.inkSoft} strokeWidth={2.6} />
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
    {!!t.intro && <View style={st.answerCard}><Text style={st.answerTxt}>{t.intro}</Text></View>}

    {/* Each step is its own card with the number OUTSIDE it, so a long step reads
        as a block instead of text hanging off a bullet. */}
    {Array.isArray(t.steps) && t.steps.length > 0 && (
      <View style={st.stepsWrap}>
        <Text style={st.stepsHead}>Key Takeaways</Text>
        {t.steps.map((s, i) => (
          <View key={i} style={st.stepRow}>
            {/* Each step gets the next pastel in the cycle, so a long derivation
                reads as distinct stages rather than one repeated bullet. */}
            <View style={[st.stepNum, { backgroundColor: N.stepTints[i % N.stepTints.length] }]}>
              <Text style={st.stepNumTxt}>{i + 1}</Text>
            </View>
            <View style={st.stepCard}><Text style={st.stepTxt}>{s}</Text></View>
          </View>
        ))}
      </View>
    )}

    {!!t.formula && (
      <View style={st.formulaCard}>
        <MathText value={toTex(t.formula)} fontSize={18} color={N.ink} />
      </View>
    )}

    {/* No `light` — on the night surface the diagram uses its dark-board palette. */}
    {t.diagram ? (
      <View style={st.diagramCard}>
        <DiagramRenderer bare shape={t.diagram.shape} caption={t.diagram.caption} data={t.diagram.data} />
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
      {!!t.intro && <View style={st.answerCard}><Text style={st.answerTxt}>{t.intro}</Text></View>}
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
    <Appear style={st.answerWrap}>
      {/* Byline bar — violet when the answer is grounded in the student's own
          material, amber when the material simply doesn't cover the question. */}
      <View style={[st.answerHead, !grounded && st.answerHeadEmpty, beyond && st.answerHeadBeyond]}>
        <NovaHead
          label={grounded ? 'Ms. Nova' : 'Not found'}
          role={grounded ? 'AI Instructor Partner' : 'Not in your material'}
        />
        {grounded && !beyond && typeof m.confidence === 'number' && (
          <View style={st.confPill}>
            <Text style={st.confTxt}>{Math.round(m.confidence * 100)}% match</Text>
          </View>
        )}
      </View>

      {beyond && (
        <View style={st.beyondBadge}>
          <Sparkles size={12} color={N.amber} strokeWidth={2.6} />
          <Text style={st.beyondTxt}>Aapki book se bahar · general knowledge</Text>
        </View>
      )}

      {m.fromPhoto && (
        <View style={st.photoBadge}>
          <Camera size={12} color={N.violet} strokeWidth={2.6} />
          <Text style={st.photoBadgeTxt}>Photo se solve kiya</Text>
        </View>
      )}

      {t
        ? (m.isQuiz
            ? <QuizCard t={t} />
            : <TeachingView t={t} checkHdr={m.fromPhoto ? 'Final answer' : 'Check yourself'} />)
        : (
          <View style={[st.answerCard, !grounded && st.answerCardEmpty]}>
            <Text style={st.answerTxt}>{m.content || 'This topic is not covered in the uploaded learning material.'}</Text>
          </View>
        )}

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
      {/* Three white tiles, each carrying its own tint on the icon square only —
          a fully tinted tile would compete with the yellow CTA below. */}
      <View style={st.uploadRow}>
        <PressableScale style={[st.upBtn, saving && { opacity: 0.5 }]} onPress={pickPdf} disabled={saving} accessibilityLabel="Upload a PDF">
          <View style={[st.upIcon, { backgroundColor: N.tintSun }]}>
            <FileUp size={22} color={N.tintSunInk} strokeWidth={2.2} />
          </View>
          <Text style={st.upTxt}>PDF</Text>
          <Text style={st.upSub}>Upload documents</Text>
        </PressableScale>
        <PressableScale style={[st.upBtn, saving && { opacity: 0.5 }]} onPress={pickPhoto} disabled={saving} accessibilityLabel="Upload a photo">
          <View style={[st.upIcon, { backgroundColor: N.tintMint }]}>
            <ImagePlus size={22} color={N.tintMintInk} strokeWidth={2.2} />
          </View>
          <Text style={st.upTxt}>Photo</Text>
          <Text style={st.upSub}>From gallery</Text>
        </PressableScale>
        <PressableScale style={[st.upBtn, saving && { opacity: 0.5 }]} onPress={takePhoto} disabled={saving} accessibilityLabel="Take a photo">
          <View style={[st.upIcon, { backgroundColor: N.tintLilac }]}>
            <Camera size={22} color={N.tintLilacInk} strokeWidth={2.2} />
          </View>
          <Text style={st.upTxt}>Camera</Text>
          <Text style={st.upSub}>Scan pages</Text>
        </PressableScale>
      </View>

      {saving && (
        <View style={st.busyRow}>
          <ActivityIndicator color={N.violet} size="small" />
          <Text style={st.busyTxt}>Reading &amp; indexing… this can take a few seconds.</Text>
        </View>
      )}
      {!!msg && <View style={st.okRow}><Check size={14} color={N.green} strokeWidth={3} /><Text style={st.ok}>{msg}</Text></View>}
      {!!err && <Text style={st.err}>{err}</Text>}

      <Text style={st.orLbl}>OR PASTE TEXT</Text>

      <View style={st.formCard}>
        <Text style={st.lbl}>Title</Text>
        <TextInput style={st.inputSm} placeholder="e.g. Chapter 3 — Laws of Motion" placeholderTextColor={N.inkDim} value={title} onChangeText={setTitle} editable={!saving} />

        <View style={st.row2}>
          <View style={{ flex: 1 }}>
            <Text style={st.lbl}>Subject</Text>
            <TextInput style={st.inputSm} placeholder="Physics" placeholderTextColor={N.inkDim} value={subject} onChangeText={setSubject} editable={!saving} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.lbl}>Grade</Text>
            <TextInput style={st.inputSm} placeholder="8" placeholderTextColor={N.inkDim} value={gradeLevel} onChangeText={setGrade} editable={!saving} />
          </View>
        </View>

        <Text style={[st.lbl, { marginTop: 14 }]}>Content</Text>
        <TextInput
          style={st.textArea}
          placeholder="Paste the learning material here…"
          placeholderTextColor={N.inkDim}
          value={text}
          onChangeText={setText}
          multiline
          editable={!saving}
        />

        {/* The app-wide gradient CTA — same button as the auth screens, so this
            form's primary action is not a one-off violet rectangle. */}
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
        <ActivityIndicator color={N.violet} style={{ marginTop: 16 }} />
      ) : sources.length === 0 ? (
        <Text style={st.emptyList}>No material uploaded yet.</Text>
      ) : (
        sources.map((s) => (
          <View key={s.id} style={st.srcItem}>
            <View style={st.sourceIcon}><FileText size={15} color={N.blue} strokeWidth={2.3} /></View>
            <View style={{ flex: 1 }}>
              <Text style={st.srcTitle} numberOfLines={1}>{s.title}</Text>
              <Text style={st.srcMeta}>
                {[s.subject, s.gradeLevel ? `Grade ${s.gradeLevel}` : null, `${s.chunkCount} chunks`, s.status]
                  .filter(Boolean).join(' · ')}
              </Text>
            </View>
            <PressableScale onPress={() => handleDelete(s.id)} style={st.delBtn} accessibilityLabel={`Delete ${s.title}`}>
              <Trash2 size={13} color={N.red} strokeWidth={2.4} />
              <Text style={st.delTxt}>Delete</Text>
            </PressableScale>
          </View>
        ))
      )}
    </ScrollView>
  );
};


// Cards float off the night background with a soft black drop, not a coloured one —
// a violet shadow on a violet page just reads as blur.
// Cards lift with a soft neutral drop. The step-number pastels live in the theme
// (N.stepTints) rather than here, so the same family is available to any screen
// that needs to tell items apart rather than rank them.
// The support Help bubble (components/support/HelpFab) floats over every student
// tab, anchored above the dock. Anything this screen pins to the bottom has to clear
// it or the bubble lands on top — which is what happened to the send button.
const HELP_FAB_CLEARANCE = 74;

const lift = { shadowColor: N.ink, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 };

// The material picker is the ONE light surface in this screen. That is deliberate:
// it is a decision sheet lifted off a dimmed page, and white makes the file list —
// the thing being chosen — the brightest object on screen. Its own small palette,
// so nothing here leaks into the night styles below.
// Now that the app itself is light, this is no longer its own palette — it just
// names which shared tokens the sheet uses, so it can never drift from them.
const SHEET = {
  bg:    N.card,
  ink:   N.ink,
  sub:   N.inkDim,
  field: N.cardSoft,
  row:   N.page,
  edge:  N.cardEdge,
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: N.page },

  // ── chrome: back · ⋮ ──
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SP.lg, paddingTop: 6, paddingBottom: 4 },
  hIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: N.card, borderWidth: 1, borderColor: N.cardEdge, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 19, fontFamily: NFONT.bold, color: N.ink, letterSpacing: -0.4 },

  // ⋮ menu
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(15,18,34,0.45)', alignItems: 'flex-end', paddingRight: SP.lg, paddingTop: Platform.OS === 'ios' ? 96 : 78 },
  menuCard: { minWidth: 196, backgroundColor: N.card, borderRadius: 16, borderWidth: 1, borderColor: N.cardEdge, paddingVertical: 6, ...lift },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  menuTxt: { fontSize: 14, fontFamily: NFONT.semi, color: N.ink },

  // ── segmented tabs (Q&A AI · My Material) ──
  tabs: { flexDirection: 'row', gap: 6, marginHorizontal: SP.lg, marginTop: 10, padding: 5, borderRadius: 30, backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge },
  tab: { flex: 1, height: 48, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tabOn: { backgroundColor: N.violet },
  tabTxt: { fontSize: 15, fontFamily: NFONT.semi, color: N.inkSoft },
  tabTxtOn: { color: N.ink, fontFamily: NFONT.bold },

  body: { padding: SP.lg, paddingBottom: 20, flexGrow: 1 },
  q: { fontSize: 21, fontFamily: NFONT.bold, color: N.ink, letterSpacing: -0.4 },
  hint: { fontSize: 13, fontFamily: NFONT.reg, color: N.inkSoft, marginTop: 6, marginBottom: 18, lineHeight: 20 },
  lbl: { fontSize: 10.5, fontFamily: NFONT.bold, color: N.inkDim, letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 10 },

  chipRow: { gap: 8, paddingVertical: 2, paddingRight: SP.lg },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: R.pill, borderWidth: 1, borderColor: N.cardEdge, backgroundColor: N.cardSoft },
  chipOn: { backgroundColor: N.violet, borderColor: N.violet },
  chipTxt: { fontSize: 13, fontFamily: NFONT.semi, color: N.inkSoft },
  chipTxtOn: { color: N.ink, fontFamily: NFONT.bold },

  // ── "ASK FROM <material>" — label + the tappable scope chip ──
  scopeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  scopeLbl: { fontSize: 11, fontFamily: NFONT.bold, color: N.inkDim, letterSpacing: 1.4 },
  scopeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, backgroundColor: N.violet, borderRadius: R.pill, paddingVertical: 7, paddingHorizontal: 13 },
  scopeChipTxt: { flexShrink: 1, fontSize: 13, fontFamily: NFONT.bold, color: N.ink },
  scopeHint: { fontSize: 11.5, fontFamily: NFONT.reg, color: N.inkSoft, marginTop: 8, lineHeight: 17 },

  // ── material picker sheet (light — see SHEET above) ──
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15,18,34,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: SHEET.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 26, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '82%' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 18 },
  sheetTitle: { fontSize: 25, fontFamily: NFONT.bold, color: SHEET.ink, letterSpacing: -0.7 },
  sheetX: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: SHEET.ink, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 22, backgroundColor: SHEET.field, borderWidth: 1, borderColor: SHEET.edge, borderRadius: R.pill, paddingHorizontal: 18, height: 54 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: NFONT.reg, color: SHEET.ink, paddingVertical: 0 },
  sheetList: { paddingHorizontal: 22, marginTop: 16 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: SHEET.row, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16, marginBottom: 10 },
  pickRowOn: { backgroundColor: N.violet },
  // White box + violet tick on the selected (violet) row, so the checkbox stays
  // legible instead of disappearing into the fill.
  checkBox: { width: 30, height: 30, borderRadius: 9, borderWidth: 1.6, borderColor: SHEET.edge, backgroundColor: SHEET.bg, alignItems: 'center', justifyContent: 'center' },
  checkBoxOn: { borderColor: SHEET.bg },
  pickTitle: { fontSize: 16.5, fontFamily: NFONT.bold, color: SHEET.ink, letterSpacing: -0.3 },
  pickTitleOn: { color: N.btnInk },
  pickMeta: { fontSize: 13, fontFamily: NFONT.semi, color: SHEET.sub, marginTop: 2 },
  pickMetaOn: { color: 'rgba(255,255,255,0.92)' },
  sheetFoot: { flexDirection: 'row', gap: 12, paddingHorizontal: 22, paddingTop: 16, marginTop: 4 },
  sheetGhost: { height: 56, paddingHorizontal: 26, borderRadius: R.pill, backgroundColor: SHEET.field, alignItems: 'center', justifyContent: 'center' },
  sheetGhostTxt: { fontSize: 16, fontFamily: NFONT.semi, color: SHEET.ink, letterSpacing: -0.3 },
  sheetApply: { flex: 1, height: 56, borderRadius: R.pill, backgroundColor: N.btn, alignItems: 'center', justifyContent: 'center' },
  sheetApplyTxt: { fontSize: 16, fontFamily: NFONT.bold, color: N.btnInk, letterSpacing: -0.3 },
  sheetEmpty: { fontSize: 14, fontFamily: NFONT.reg, color: SHEET.sub, textAlign: 'center', paddingVertical: 22 },

  // ── empty state ──
  empty: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: SP.lg },
  emptyIcon: { width: 118, height: 118, borderRadius: 59, backgroundColor: N.violet, alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  emptyTitle: { fontSize: 21, fontFamily: NFONT.bold, color: N.ink, textAlign: 'center', letterSpacing: -0.4 },
  emptyHint: { fontSize: 14.5, fontFamily: NFONT.reg, color: N.inkSoft, textAlign: 'center', lineHeight: 20, marginTop: 6, maxWidth: 290 },

  // ── the student's turn: a full-width card, same surface as the answer ──
  userRow: { marginTop: 18 },
  userBubble: { backgroundColor: N.card, borderRadius: 18, borderWidth: 1, borderColor: N.cardEdge, paddingVertical: 15, paddingHorizontal: 18 },
  userTxt: { color: N.ink, fontSize: 15.5, fontFamily: NFONT.med, lineHeight: 24 },
  userPhotoBubble: { alignSelf: 'flex-start', backgroundColor: N.card, borderRadius: 18, borderWidth: 1, borderColor: N.cardEdge, padding: 6 },
  userPhoto: { width: 190, height: 150, borderRadius: 13, backgroundColor: N.cardSoft },
  userPhotoCap: { color: N.ink, fontSize: 12, fontFamily: NFONT.semi, textAlign: 'center', paddingVertical: 7 },

  thinkCard: {
    marginTop: 18, backgroundColor: N.violetSoft, borderRadius: 20,
    paddingVertical: 26, paddingHorizontal: 20, alignItems: 'center', gap: 10,
  },
  thinkSpinner: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: N.violet,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  thinkTitle: { fontSize: 16.5, fontFamily: NFONT.bold, color: N.ink, letterSpacing: -0.3 },
  thinkTxt: { fontSize: 13.5, fontFamily: NFONT.reg, color: N.inkSoft, textAlign: 'center' },

  // one-tap follow-up chips under the latest answer
  followRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  followChip: { paddingVertical: 9, paddingHorizontal: 15, borderRadius: R.pill, borderWidth: 1, borderColor: N.violet, backgroundColor: N.violetSoft },
  followTxt: { fontSize: 12.5, fontFamily: NFONT.semi, color: N.dot },

  // ── answer: violet byline bar, then a stack of dark cards ──
  answerWrap: { marginTop: 18 },
  answerHead: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: N.violet, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12, ...lift },
  // a refusal ("not in your material") is a state, not an error — amber, not red
  answerHeadEmpty: { backgroundColor: N.amberSoft, borderWidth: 1, borderColor: N.amber },
  answerHeadBeyond: { backgroundColor: N.violetLo },
  novaHead: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, minWidth: 0 },
  novaName: { fontSize: 15.5, fontFamily: NFONT.bold, color: N.ink, letterSpacing: -0.2 },
  novaRole: { fontSize: 11.5, fontFamily: NFONT.reg, color: 'rgba(255,255,255,0.78)', marginTop: 1 },
  // Solid green reads as "matched" at a glance; the label goes near-black because
  // 10px white on #35BE7C does not clear AA.
  confPill: { backgroundColor: N.green, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 10 },
  confTxt: { fontSize: 11, fontFamily: NFONT.bold, color: N.ink },

  answerCard: { marginTop: 12, backgroundColor: N.card, borderRadius: 20, borderWidth: 1, borderColor: N.cardEdge, padding: 18 },
  answerCardEmpty: { borderColor: N.amber },
  answerTxt: { fontSize: 15, fontFamily: NFONT.reg, color: N.ink, lineHeight: 25 },
  noContentHint: { fontSize: 13, fontFamily: NFONT.reg, color: N.inkSoft, marginTop: 12, lineHeight: 20 },

  // extended (general-knowledge) answers get an amber badge, so a student can
  // always tell book-content from beyond-the-book content at a glance.
  beyondBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: N.amberSoft, borderWidth: 1, borderColor: N.amber, borderRadius: R.pill, paddingVertical: 5, paddingHorizontal: 11, marginTop: 12 },
  beyondTxt: { fontSize: 11, fontFamily: NFONT.semi, color: N.ink, letterSpacing: 0.1 },
  photoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: N.violetSoft, borderWidth: 1, borderColor: N.violet, borderRadius: R.pill, paddingVertical: 5, paddingHorizontal: 11, marginTop: 12 },
  photoBadgeTxt: { fontSize: 11, fontFamily: NFONT.semi, color: N.dot, letterSpacing: 0.1 },

  // numbered teaching steps — number badge outside its own card
  stepsWrap: { marginTop: 10, gap: 12 },
  stepsHead: { fontSize: 18, fontFamily: NFONT.bold, color: N.ink, letterSpacing: -0.4, marginTop: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  // backgroundColor comes from STEP_TINTS per index. It used to be N.btn (#111111)
  // with N.ink (#111111) on top — black on black, so the numbers were invisible.
  stepNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepNumTxt: { fontSize: 13.5, fontFamily: NFONT.bold, color: N.ink },
  stepCard: { flex: 1, backgroundColor: N.card, borderRadius: 16, borderWidth: 1, borderColor: N.cardEdge, paddingVertical: 14, paddingHorizontal: 16 },
  stepTxt: { fontSize: 14, fontFamily: NFONT.reg, color: N.ink, lineHeight: 22 },

  formulaCard: { marginTop: 14, backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  diagramCard: { marginTop: 14, backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge, borderRadius: 16, paddingVertical: 12 },

  exampleCard: { marginTop: 14, backgroundColor: N.blueSoft, borderWidth: 1, borderColor: 'rgba(91,140,255,0.34)', borderRadius: 16, padding: 15 },
  checkCard: { marginTop: 14, backgroundColor: N.violetSoft, borderWidth: 1, borderColor: 'rgba(139,110,240,0.38)', borderRadius: 16, padding: 15 },
  blockHdr: { fontSize: 10.5, fontFamily: NFONT.bold, color: N.inkSoft, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 7 },
  blockTxt: { fontSize: 14, fontFamily: NFONT.reg, color: N.ink, lineHeight: 22 },

  showAnsBtn: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 9, paddingHorizontal: 16, borderRadius: R.pill, borderWidth: 1, borderColor: N.violet, backgroundColor: N.violetSoft },
  showAnsTxt: { fontSize: 12.5, fontFamily: NFONT.semi, color: N.dot },

  // on-demand gap chips
  gapWrap: { marginTop: 14, backgroundColor: N.card, borderRadius: 18, borderWidth: 1, borderColor: N.cardEdge, padding: 14 },
  gapHdr: { fontSize: 12, fontFamily: NFONT.semi, color: N.inkSoft, marginBottom: 4 },
  gapChip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: N.amber, backgroundColor: N.amberSoft },
  gapChipTxt: { fontSize: 12.5, fontFamily: NFONT.semi, color: N.ink },

  // sources
  sourceBox: { marginTop: 14, backgroundColor: N.card, borderRadius: 18, borderWidth: 1, borderColor: N.cardEdge, padding: 14 },
  sourceHdr: { fontSize: 10.5, fontFamily: NFONT.bold, color: N.inkSoft, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 10 },
  sourceItem: { marginBottom: 8 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge, borderRadius: 14, padding: 10 },
  sourceIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: N.blueSoft, alignItems: 'center', justifyContent: 'center' },
  sourceTitle: { flex: 1, fontSize: 12.5, fontFamily: NFONT.semi, color: N.ink },
  simPill: { backgroundColor: N.green, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4 },
  simTxt: { fontSize: 10, fontFamily: NFONT.bold, color: N.ink },
  // the exact passage the answer was grounded on, revealed on tap
  snippetCard: { marginTop: -2, marginHorizontal: 6, backgroundColor: N.blueSoft, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, paddingHorizontal: 12, paddingVertical: 12 },
  snippetHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  snippetHdr: { fontSize: 10, fontFamily: NFONT.bold, color: N.inkSoft, letterSpacing: 0.6, textTransform: 'uppercase' },
  snippetTxt: { fontSize: 12.5, fontFamily: NFONT.reg, color: N.ink, lineHeight: 20, fontStyle: 'italic' },

  // ── ask bar — one floating pill, in flow so the KeyboardAvoidingView lifts it ──
  askBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginHorizontal: SP.lg, marginTop: 4, marginBottom: (Platform.OS === 'ios' ? 22 : 14) + HELP_FAB_CLEARANCE, padding: 7, borderRadius: 30, backgroundColor: N.card, borderWidth: 1, borderColor: N.cardEdge, ...lift },
  askPhoto: { width: 44, height: 44, borderRadius: 22, backgroundColor: N.violet, alignItems: 'center', justifyContent: 'center' },
  askInputWrap: { flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 6 },
  askInput: { fontSize: 14.5, fontFamily: NFONT.reg, color: N.ink, paddingVertical: Platform.OS === 'ios' ? 12 : 8, maxHeight: 96 },
  askSend: { width: 46, height: 46, borderRadius: 23, backgroundColor: N.violet, alignItems: 'center', justifyContent: 'center', shadowColor: N.violet, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6 },

  // attached-photo preview strip above the input
  attachStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: SP.lg, marginBottom: 8, backgroundColor: N.violetSoft, borderWidth: 1, borderColor: N.violet, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 },
  attachThumb: { width: 46, height: 46, borderRadius: 12, backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.violet },
  attachTxt: { flex: 1, fontSize: 12, fontFamily: NFONT.semi, color: N.ink, lineHeight: 17 },
  attachX: { width: 30, height: 30, borderRadius: 15, backgroundColor: N.cardSoft, alignItems: 'center', justifyContent: 'center' },

  // ── errors / status ──
  errCard: { marginTop: 18, backgroundColor: N.redSoft, borderWidth: 1, borderColor: N.red, borderRadius: 18, padding: SP.md, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errTxt: { flex: 1, color: N.ink, fontSize: 13, fontFamily: NFONT.med },
  retryTxt: { color: N.ink, fontSize: 13, fontFamily: NFONT.bold },
  err: { color: N.red, fontSize: 12, fontFamily: NFONT.semi, marginTop: 12 },
  okRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  ok: { color: N.green, fontSize: 12, fontFamily: NFONT.semi },

  // ── manage panel ──
  uploadRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  upBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, backgroundColor: N.card, borderWidth: 1, borderColor: N.cardEdge, borderRadius: 18 },
  upIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  upTxt: { fontSize: 14, fontFamily: NFONT.bold, color: N.ink },
  upSub: { fontSize: 11.5, fontFamily: NFONT.reg, color: N.inkSoft, textAlign: 'center' },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  busyTxt: { fontSize: 12.5, fontFamily: NFONT.semi, color: N.inkSoft, flex: 1 },
  orLbl: { fontSize: 10, fontFamily: NFONT.bold, color: N.inkDim, letterSpacing: 1.2, textTransform: 'uppercase', textAlign: 'center', marginTop: 22, marginBottom: 14 },

  formCard: { backgroundColor: N.card, borderWidth: 1, borderColor: N.cardEdge, borderRadius: 20, padding: 16 },
  inputSm: { backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, fontSize: 14, fontFamily: NFONT.reg, color: N.ink },
  textArea: { backgroundColor: N.cardSoft, borderWidth: 1, borderColor: N.cardEdge, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, fontSize: 14, fontFamily: NFONT.reg, color: N.ink, minHeight: 150, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12, marginTop: 14 },
  btn: { marginTop: 18 },

  emptyList: { fontSize: 13, fontFamily: NFONT.reg, color: N.inkSoft, marginTop: 12, textAlign: 'center' },
  srcItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: N.card, borderWidth: 1, borderColor: N.cardEdge, borderRadius: 14, padding: 12, marginTop: 10 },
  srcTitle: { fontSize: 13.5, fontFamily: NFONT.bold, color: N.ink },
  srcMeta: { fontSize: 11, fontFamily: NFONT.reg, color: N.inkSoft, marginTop: 3 },
  delBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: N.redSoft, borderWidth: 1, borderColor: 'rgba(255,107,107,0.4)', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 12 },
  delTxt: { fontSize: 12, fontFamily: NFONT.bold, color: N.ink },
});

export default KnowledgeAskScreen;
