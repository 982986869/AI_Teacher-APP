// src/components/teacher/lessonExtras.js
// Five study features for the AI Teacher live player, inspired by the best of
// comparable tutors (Khanmigo, Quizlet, Khan Academy, Notion AI):
//   1. ExplainChips   — "explain differently" quick-actions (Simpler / Example / Real-world)
//   2. ContentsSheet  — a lesson chapter map you can jump around in  (+ bookmarks tab)
//   3. bookmarks/notes — save a concept's key idea; persisted per lesson (AsyncStorage)
//   4. FlashcardDeck  — flip-card self-review built from the lesson's checks + key ideas
//   5. TestSheet      — a short summative MCQ quiz drawn from every check, scored
//
// All are self-contained and reuse the mature "graphite + Marigold + serif" design
// so they sit inside the player without touching its teaching state machine. The
// player wires them via small props: onPick(question) → its existing doubt flow,
// onJump(index) → goTeach, and card/question arrays it derives from `scenes`.
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable, Share, ActivityIndicator, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  X, Check, Bookmark, BookmarkCheck, ListTree, RotateCcw, ChevronRight,
  Sparkles, Lightbulb, Globe, GraduationCap, Layers, Trophy,
  PencilRuler, FileText, FunctionSquare, Share2, ListChecks, Languages, MessageCircleQuestion,
} from 'lucide-react-native';

import { PressableScale, Appear } from './uiKit';
import { D, C, F, SP, R, SERIF } from './premiumTheme';

const GOLD = '#DBA53F';
const GOLD_DIM = '#B4863A';
const PAPER = '#FAF7F0';
const NOTES_KEY = '@ailernova_lesson_notes';

// ── notes persistence (per lesson) ───────────────────────────────────────────
const notesKeyFor = (lessonKey) => `${NOTES_KEY}:${String(lessonKey || 'lesson')}`;

export async function loadNotes(lessonKey) {
  try {
    const raw = await AsyncStorage.getItem(notesKeyFor(lessonKey));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
export async function saveNotes(lessonKey, indices) {
  try { await AsyncStorage.setItem(notesKeyFor(lessonKey), JSON.stringify(indices || [])); } catch {}
}

// The student's own free-text note for a lesson (separate from the bookmarks above).
const noteTextKeyFor = (lessonKey) => `@ailernova_lesson_note_text:${String(lessonKey || 'lesson')}`;
export async function loadNoteText(lessonKey) {
  try { return (await AsyncStorage.getItem(noteTextKeyFor(lessonKey))) || ''; } catch { return ''; }
}
export async function saveNoteText(lessonKey, text) {
  try { await AsyncStorage.setItem(noteTextKeyFor(lessonKey), String(text || '')); } catch {}
}

// ── data builders (called by the player over its `scenes`) ────────────────────
// A scene is a "concept" if it has a real title; a "check" if it carries a quickCheck.
export function conceptScenes(scenes) {
  return (scenes || [])
    .map((sc, i) => ({ i, kicker: sc.kicker, title: sc.title, line: sc.teacherLine, isCheck: !!sc.quickCheck }))
    .filter((s) => s.title && String(s.title).trim().length > 0);
}

export function buildFlashcards(scenes) {
  const cards = [];
  (scenes || []).forEach((sc) => {
    const qc = sc.quickCheck;
    if (qc && Array.isArray(qc.options) && typeof qc.answer === 'number' && qc.options[qc.answer]) {
      cards.push({ front: qc.question || sc.title, back: String(qc.options[qc.answer]), tag: 'Check' });
    } else if (sc.title && sc.teacherLine) {
      cards.push({ front: sc.title, back: String(sc.teacherLine), tag: sc.kicker || 'Key idea' });
    }
  });
  // de-dupe identical fronts, keep order
  const seen = new Set();
  return cards.filter((c) => { const k = c.front.trim().toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}

export function buildTest(scenes) {
  return (scenes || [])
    .map((sc) => sc.quickCheck)
    .filter((qc) => qc && Array.isArray(qc.options) && qc.options.length >= 2 && typeof qc.answer === 'number' && qc.options[qc.answer] != null)
    .map((qc) => ({ q: qc.question, options: qc.options.slice(0, 4), answer: Math.min(qc.answer, 3) }));
}

// The lesson, read back as a script — each concept's spoken line (or its subtitle).
export function buildTranscript(scenes) {
  return (scenes || [])
    .map((sc, i) => {
      const text = String(sc.teacherLine || (Array.isArray(sc.subtitleChunks) ? sc.subtitleChunks.join(' ') : '') || '').trim();
      return { i, kicker: sc.kicker, title: sc.title, text };
    })
    .filter((r) => r.text.length > 0);
}

// Every formula the lesson wrote on the board, as a quick-reference sheet.
export function buildFormulas(scenes) {
  const out = [];
  const seen = new Set();
  (scenes || []).forEach((sc) => {
    const parts = Array.isArray(sc.formulaParts) ? sc.formulaParts.filter(Boolean) : [];
    if (!parts.length) return;
    const formula = parts.join(' ').replace(/\s+/g, ' ').trim();
    const k = formula.toLowerCase();
    if (!formula || seen.has(k)) return;
    seen.add(k);
    out.push({ title: sc.title || sc.kicker || 'Formula', formula });
  });
  return out;
}

// A tight recap — the one key idea from each concept, as bullets.
export function buildRecap(scenes) {
  const out = [];
  const seen = new Set();
  conceptScenes(scenes).forEach((c) => {
    if (c.isCheck) return;
    const line = String(c.line || '').trim();
    // first sentence, trimmed to a crisp takeaway
    const point = (line.match(/^[^.!?]*[.!?]?/) || [''])[0].trim() || line;
    const k = (c.title || '').toLowerCase();
    if (!c.title || seen.has(k)) return;
    seen.add(k);
    out.push({ title: c.title, point });
  });
  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// 1 · EXPLAIN-DIFFERENTLY CHIPS  — under the caption while teaching/paused
// ════════════════════════════════════════════════════════════════════════════
export function ExplainChips({ scene, onPick, onPractice }) {
  if (!scene) return null;
  const topic = (scene.title || scene.kicker || 'this idea').replace(/["“”]/g, '');
  const chips = [
    { Icon: Lightbulb, label: 'Simpler',    q: `Explain "${topic}" more simply — like I'm seeing it for the first time. Use plain words.` },
    { Icon: Sparkles,  label: 'Example',    q: `Give me one concrete worked example of "${topic}", step by step.` },
    { Icon: Globe,     label: 'Real-world', q: `Where does "${topic}" show up in real life? Give one vivid, memorable example.` },
    { Icon: Languages, label: 'हिंदी में',   q: `"${topic}" ko simple Hindi/Hinglish mein samjhao — jaise ek dost samjhata hai.` },
  ];
  return (
    <View style={s.chipRow} accessibilityRole="toolbar">
      {chips.map((c) => (
        <PressableScale key={c.label} style={s.chip} onPress={() => onPick(c.q)} accessibilityRole="button" accessibilityLabel={`Ask: ${c.label}`}>
          <c.Icon size={13} color={GOLD} strokeWidth={2.3} />
          <Text style={s.chipTxt}>{c.label}</Text>
        </PressableScale>
      ))}
      {!!onPractice && (
        <PressableScale style={[s.chip, s.chipSolid]} onPress={onPractice} accessibilityRole="button" accessibilityLabel="Practice a problem">
          <PencilRuler size={13} color="#12141A" strokeWidth={2.4} />
          <Text style={[s.chipTxt, s.chipTxtSolid]}>Practice</Text>
        </PressableScale>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2 + 3 · CONTENTS SHEET (chapter map to jump) + BOOKMARKS/NOTES tab
// ════════════════════════════════════════════════════════════════════════════
const TABS = [
  { key: 'contents', label: 'Contents', Icon: ListTree },
  { key: 'notes',    label: 'Notes',    Icon: Bookmark },
  { key: 'script',   label: 'Script',   Icon: FileText },
  { key: 'formulas', label: 'Formulas', Icon: FunctionSquare },
];

export function ContentsSheet({ visible, scenes, currentIdx, saved, onToggleSave, onJump, onClose, transcript, formulas, lessonTitle, noteText, onChangeNoteText }) {
  const [tab, setTab] = useState('contents');
  useEffect(() => { if (visible) setTab('contents'); }, [visible]);
  const concepts = useMemo(() => conceptScenes(scenes), [scenes]);
  const savedSet = useMemo(() => new Set(saved || []), [saved]);
  const noteItems = concepts.filter((c) => savedSet.has(c.i));
  const rows = tab === 'contents' ? concepts : noteItems;

  const shareNotes = async () => {
    const body = noteItems.map((c, n) => `${n + 1}. ${c.title}\n   ${c.line || ''}`).join('\n\n');
    const mine = noteText && noteText.trim() ? `\n\nMy note:\n${noteText.trim()}` : '';
    try { await Share.share({ message: `My notes — ${lessonTitle || 'lesson'}\n\n${body}${mine}` }); } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.grip} />
        <View style={s.sheetHead}>
          <Text style={s.sheetTitle}>Lesson</Text>
          <PressableScale onPress={onClose} style={s.sheetX} accessibilityLabel="Close"><X size={20} color={D.textDim} strokeWidth={2.3} /></PressableScale>
        </View>

        <View style={s.segRow}>
          {TABS.map((t) => {
            const on = tab === t.key;
            const count = t.key === 'notes' && noteItems.length ? ` · ${noteItems.length}` : '';
            return (
              <PressableScale key={t.key} style={[s.seg, on && s.segOn]} onPress={() => setTab(t.key)} accessibilityRole="button" accessibilityLabel={t.label}>
                <t.Icon size={14} color={on ? '#12141A' : D.textDim} strokeWidth={2.3} />
                <Text style={[s.segTxt, on && s.segTxtOn]} numberOfLines={1}>{t.label}{count}</Text>
              </PressableScale>
            );
          })}
        </View>

        <ScrollView style={s.sheetScroll} contentContainerStyle={{ paddingBottom: SP.xl }} showsVerticalScrollIndicator={false}>
          {/* Contents / Notes — jumpable concept rows with a bookmark */}
          {(tab === 'contents' || tab === 'notes') && (
            <>
              {tab === 'notes' && (
                <View style={s.myNoteWrap}>
                  <Text style={s.myNoteLbl}>My note</Text>
                  <TextInput
                    style={s.myNoteInput}
                    value={noteText}
                    onChangeText={onChangeNoteText}
                    placeholder="Write your own note for this lesson…"
                    placeholderTextColor={D.textFaint}
                    multiline
                    textAlignVertical="top"
                    accessibilityLabel="Your personal note for this lesson"
                  />
                </View>
              )}
              {tab === 'notes' && (noteItems.length > 0 || (noteText && noteText.trim())) && (
                <PressableScale style={s.shareBtn} onPress={shareNotes} accessibilityLabel="Share my notes">
                  <Share2 size={15} color={GOLD} strokeWidth={2.3} /><Text style={s.shareTxt}>Share my notes</Text>
                </PressableScale>
              )}
              {rows.length === 0 && (
                <Text style={s.empty}>{tab === 'notes' ? 'No saved notes yet. Tap the bookmark on any concept to keep its key idea here.' : 'No concepts to show.'}</Text>
              )}
              {rows.map((c, n) => {
                const isNow = c.i === currentIdx;
                const isSaved = savedSet.has(c.i);
                return (
                  <View key={c.i} style={[s.row, isNow && s.rowNow]}>
                    <PressableScale style={s.rowMain} onPress={() => { onJump(c.i); onClose(); }} accessibilityRole="button" accessibilityLabel={`Go to ${c.title}`}>
                      <Text style={[s.rowNum, isNow && s.rowNumNow]}>{tab === 'contents' ? String(n + 1).padStart(2, '0') : ''}{c.isCheck ? '✓' : ''}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.rowTitle, isNow && s.rowTitleNow]} numberOfLines={2}>{c.title}</Text>
                        {tab === 'notes' && !!c.line && <Text style={s.rowNote} numberOfLines={3}>{c.line}</Text>}
                        {isNow && <Text style={s.rowHere}>Playing now</Text>}
                      </View>
                      <ChevronRight size={17} color={D.textFaint} strokeWidth={2.2} />
                    </PressableScale>
                    <PressableScale style={s.bmk} onPress={() => onToggleSave(c.i)} accessibilityRole="button" accessibilityLabel={isSaved ? 'Remove bookmark' : 'Save to notes'}>
                      {isSaved ? <BookmarkCheck size={19} color={GOLD} strokeWidth={2.3} /> : <Bookmark size={19} color={D.textFaint} strokeWidth={2.2} />}
                    </PressableScale>
                  </View>
                );
              })}
            </>
          )}

          {/* Script — the lesson read back, tap a line to jump there */}
          {tab === 'script' && (
            (transcript && transcript.length) ? transcript.map((r) => (
              <PressableScale key={r.i} style={[s.scriptRow, r.i === currentIdx && s.rowNow]} onPress={() => { onJump(r.i); onClose(); }} accessibilityRole="button" accessibilityLabel={`Go to ${r.title}`}>
                {!!r.title && <Text style={s.scriptTitle} numberOfLines={1}>{r.title}</Text>}
                <Text style={s.scriptTxt}>{r.text}</Text>
              </PressableScale>
            )) : <Text style={s.empty}>No transcript for this lesson.</Text>
          )}

          {/* Formulas — the quick-reference sheet */}
          {tab === 'formulas' && (
            (formulas && formulas.length) ? formulas.map((f, k) => (
              <View key={k} style={s.formulaRow}>
                <Text style={s.formulaLbl} numberOfLines={1}>{f.title}</Text>
                <Text style={s.formulaTxt}>{f.formula}</Text>
              </View>
            )) : <Text style={s.empty}>This lesson has no boxed formulas.</Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// 7 · QUICK RECAP — the whole lesson in one glance (offered on completion)
// ════════════════════════════════════════════════════════════════════════════
export function RecapSheet({ visible, points, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.deckWrap}>
        <View style={s.deckHead}>
          <View style={s.deckTitleRow}><ListChecks size={18} color={GOLD} strokeWidth={2.3} /><Text style={s.deckTitle}>Quick recap</Text></View>
          <PressableScale onPress={onClose} style={s.sheetX} accessibilityLabel="Close recap"><X size={20} color={D.textDim} strokeWidth={2.3} /></PressableScale>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: SP.xl }} showsVerticalScrollIndicator={false}>
          {(points && points.length) ? points.map((p, k) => (
            <View key={k} style={s.recapRow}>
              <View style={s.recapDot}><Text style={s.recapDotTxt}>{k + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.recapTitle}>{p.title}</Text>
                {!!p.point && <Text style={s.recapPoint}>{p.point}</Text>}
              </View>
            </View>
          )) : <Text style={s.empty}>Nothing to recap yet.</Text>}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 8 · Q&A RECAP — every question you asked this lesson, with her answer
// ════════════════════════════════════════════════════════════════════════════
export function QASheet({ visible, items, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.deckWrap}>
        <View style={s.deckHead}>
          <View style={s.deckTitleRow}><MessageCircleQuestion size={18} color={GOLD} strokeWidth={2.3} /><Text style={s.deckTitle}>Your questions</Text></View>
          <PressableScale onPress={onClose} style={s.sheetX} accessibilityLabel="Close"><X size={20} color={D.textDim} strokeWidth={2.3} /></PressableScale>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: SP.xl }} showsVerticalScrollIndicator={false}>
          {(items && items.length) ? items.map((qa, k) => (
            <View key={k} style={s.qaCard}>
              <Text style={s.qaQ}>{qa.q}</Text>
              {!!qa.a && <Text style={s.qaA}>{qa.a}</Text>}
            </View>
          )) : <Text style={s.empty}>You didn’t ask anything this time — the mic and the chips are there whenever you want.</Text>}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4 · FLASHCARD DECK — tap to flip, swipe through with Prev/Next
// ════════════════════════════════════════════════════════════════════════════
export function FlashcardDeck({ visible, cards, onClose }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => { if (visible) { setIdx(0); setFlipped(false); } }, [visible]);
  const n = cards ? cards.length : 0;
  const card = n ? cards[Math.min(idx, n - 1)] : null;
  const go = (d) => { setFlipped(false); setIdx((i) => Math.max(0, Math.min(n - 1, i + d))); };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.deckWrap}>
        <View style={s.deckHead}>
          <View style={s.deckTitleRow}><Layers size={17} color={GOLD} strokeWidth={2.3} /><Text style={s.deckTitle}>Flashcards</Text></View>
          <PressableScale onPress={onClose} style={s.sheetX} accessibilityLabel="Close flashcards"><X size={20} color={D.textDim} strokeWidth={2.3} /></PressableScale>
        </View>
        {card ? (
          <>
            <Text style={s.deckCount}>{Math.min(idx + 1, n)} / {n}</Text>
            <PressableScale style={s.card} scaleTo={0.98} onPress={() => setFlipped((f) => !f)} accessibilityRole="button" accessibilityLabel={flipped ? 'Show question' : 'Show answer'}>
              <Text style={s.cardTag}>{flipped ? 'ANSWER' : (card.tag || 'QUESTION').toUpperCase()}</Text>
              <Text style={s.cardTxt}>{flipped ? card.back : card.front}</Text>
              <Text style={s.cardHint}>{flipped ? 'Tap to see the question' : 'Tap to reveal the answer'}</Text>
            </PressableScale>
            <View style={s.deckNav}>
              <PressableScale style={[s.deckBtn, idx === 0 && s.deckBtnDim]} onPress={() => go(-1)} disabled={idx === 0} accessibilityLabel="Previous card"><Text style={s.deckBtnTxt}>‹ Prev</Text></PressableScale>
              <PressableScale style={[s.deckBtn, idx >= n - 1 && s.deckBtnDim]} onPress={() => go(1)} disabled={idx >= n - 1} accessibilityLabel="Next card"><Text style={s.deckBtnTxt}>Next ›</Text></PressableScale>
            </View>
          </>
        ) : (
          <Text style={s.empty}>No cards for this lesson.</Text>
        )}
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 5 · TEST YOURSELF — a short scored MCQ quiz from the lesson's checks
// ════════════════════════════════════════════════════════════════════════════
export function TestSheet({ visible, questions, onClose, onScore }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);       // selected option index for current q
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => { if (visible) { setI(0); setPicked(null); setCorrect(0); setDone(false); } }, [visible]);

  const qs = questions || [];
  const n = qs.length;
  const q = n ? qs[Math.min(i, n - 1)] : null;

  const choose = (oi) => { if (picked != null) return; setPicked(oi); if (oi === q.answer) setCorrect((c) => c + 1); };
  const next = () => {
    if (i >= n - 1) { setDone(true); onScore && onScore(Math.round((correct / Math.max(1, n)) * 100)); }
    else { setI((x) => x + 1); setPicked(null); }
  };

  const pct = n ? Math.round((correct / n) * 100) : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.deckWrap}>
        <View style={s.deckHead}>
          <View style={s.deckTitleRow}><GraduationCap size={18} color={GOLD} strokeWidth={2.3} /><Text style={s.deckTitle}>Test yourself</Text></View>
          <PressableScale onPress={onClose} style={s.sheetX} accessibilityLabel="Close test"><X size={20} color={D.textDim} strokeWidth={2.3} /></PressableScale>
        </View>

        {!n && <Text style={s.empty}>No quiz questions for this lesson.</Text>}

        {!!n && !done && q && (
          <>
            <Text style={s.deckCount}>Question {i + 1} of {n}</Text>
            <View style={s.qCard}>
              <Text style={s.qTxt}>{q.q}</Text>
              {q.options.map((opt, oi) => {
                const isRight = picked != null && oi === q.answer;
                const isWrongPick = picked === oi && oi !== q.answer;
                return (
                  <PressableScale key={oi} style={[s.opt, isRight && s.optRight, isWrongPick && s.optWrong]} onPress={() => choose(oi)} disabled={picked != null} accessibilityRole="button" accessibilityLabel={opt}>
                    <Text style={[s.optTxt, (isRight || isWrongPick) && s.optTxtOn]}>{opt}</Text>
                    {isRight && <Check size={17} color={C.green} strokeWidth={3} />}
                    {isWrongPick && <X size={17} color={C.orange} strokeWidth={3} />}
                  </PressableScale>
                );
              })}
            </View>
            {picked != null && (
              <PressableScale style={s.testNext} onPress={next} accessibilityLabel={i >= n - 1 ? 'See score' : 'Next question'}>
                <Text style={s.testNextTxt}>{i >= n - 1 ? 'See my score' : 'Next ›'}</Text>
              </PressableScale>
            )}
          </>
        )}

        {done && (
          <Appear from="scale" style={s.scoreCard}>
            <Trophy size={38} color={GOLD} strokeWidth={1.9} />
            <Text style={s.scoreNum}>{pct}%</Text>
            <Text style={s.scoreLbl}>{correct} of {n} correct</Text>
            <Text style={s.scoreMsg}>{pct >= 80 ? 'Excellent — you’ve really got this.' : pct >= 50 ? 'Solid. A quick replay will lock in the rest.' : 'Worth another look — replay the tricky bits.'}</Text>
            <PressableScale style={s.testNext} onPress={onClose} accessibilityLabel="Done"><Text style={s.testNextTxt}>Done</Text></PressableScale>
          </Appear>
        )}
      </View>
    </Modal>
  );
}

// ── styles (graphite + Marigold + serif, matching the player) ─────────────────
const s = StyleSheet.create({
  // 1 · chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SP.sm, alignSelf: 'stretch' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(219,165,63,0.10)', borderWidth: 1, borderColor: 'rgba(219,165,63,0.38)', borderRadius: R.pill, paddingVertical: 7, paddingHorizontal: 13 },
  chipTxt: { fontSize: 12, fontFamily: F.semi, color: GOLD, letterSpacing: 0.2 },

  // personal free-text note (Notes tab)
  myNoteWrap: { alignSelf: 'stretch', marginBottom: SP.md },
  myNoteLbl: { fontSize: 10.5, fontFamily: F.bold, color: GOLD_DIM, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  myNoteInput: { minHeight: 76, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: R.md, padding: 12, color: D.text, fontSize: 14, fontFamily: F.reg, lineHeight: 20 },

  // Q&A recap
  qaCard: { alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: R.lg, padding: 15, marginBottom: 9 },
  qaQ: { fontSize: 14.5, fontFamily: F.bold, color: GOLD, lineHeight: 20 },
  qaA: { fontSize: 13.5, fontFamily: F.reg, color: D.text, lineHeight: 21, marginTop: 7 },

  // shared sheet chrome
  scrim: { flex: 1, backgroundColor: 'rgba(4,5,8,0.6)' },
  sheet: { backgroundColor: '#14161C', borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.10)', paddingHorizontal: SP.lg, paddingTop: SP.sm, paddingBottom: SP.md, maxHeight: '82%' },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: SP.sm },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.sm },
  sheetTitle: { fontSize: 21, fontFamily: SERIF, fontWeight: '600', color: D.text, letterSpacing: 0.2 },
  sheetX: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  sheetScroll: { alignSelf: 'stretch' },
  empty: { fontSize: 13.5, fontFamily: F.med, color: D.textDim, textAlign: 'center', lineHeight: 21, paddingVertical: SP.xl, paddingHorizontal: SP.md },

  // 2/3 · segmented + rows
  segRow: { flexDirection: 'row', gap: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: R.pill, padding: 4, marginBottom: SP.md },
  seg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, paddingHorizontal: 2, borderRadius: R.pill },
  segOn: { backgroundColor: GOLD },
  segTxt: { fontSize: 11, fontFamily: F.semi, color: D.textDim, letterSpacing: 0 },
  segTxtOn: { color: '#12141A', fontFamily: F.bold },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: R.lg, marginBottom: 8 },
  rowNow: { borderColor: 'rgba(219,165,63,0.5)', backgroundColor: 'rgba(219,165,63,0.08)' },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingLeft: 14, paddingRight: 6 },
  rowNum: { fontSize: 12, fontFamily: F.bold, color: D.textFaint, minWidth: 22, letterSpacing: 0.5 },
  rowNumNow: { color: GOLD },
  rowTitle: { fontSize: 14.5, fontFamily: F.semi, color: D.text, lineHeight: 20 },
  rowTitleNow: { color: '#fff' },
  rowNote: { fontSize: 12.5, fontFamily: F.reg, color: D.textDim, lineHeight: 18, marginTop: 4 },
  rowHere: { fontSize: 10, fontFamily: F.bold, color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  bmk: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', marginRight: 4 },

  // 4/5 · full-screen graphite surface for deck + test
  deckWrap: { flex: 1, backgroundColor: '#0E1014', paddingHorizontal: SP.lg, paddingTop: 54, paddingBottom: SP.xl },
  deckHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md },
  deckTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  deckTitle: { fontSize: 22, fontFamily: SERIF, fontWeight: '600', color: D.text, letterSpacing: 0.2 },
  deckCount: { fontSize: 11, fontFamily: F.semi, color: GOLD_DIM, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: SP.md },

  card: { flex: 1, backgroundColor: PAPER, borderRadius: R.xxl, padding: SP.xl, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 14, maxHeight: 460 },
  cardTag: { fontSize: 10, fontFamily: F.bold, color: GOLD_DIM, letterSpacing: 2, textTransform: 'uppercase', marginBottom: SP.md },
  cardTxt: { fontSize: 21, fontFamily: SERIF, fontWeight: '600', color: C.ink, textAlign: 'center', lineHeight: 30 },
  cardHint: { position: 'absolute', bottom: SP.lg, fontSize: 11.5, fontFamily: F.med, color: '#9A8F79' },
  deckNav: { flexDirection: 'row', gap: 12, marginTop: SP.lg },
  deckBtn: { flex: 1, alignItems: 'center', paddingVertical: 15, borderRadius: R.md, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  deckBtnDim: { opacity: 0.35 },
  deckBtnTxt: { fontSize: 14, fontFamily: F.bold, color: D.text },

  // test
  qCard: { backgroundColor: PAPER, borderRadius: R.xl, padding: SP.lg, marginBottom: SP.md },
  qTxt: { fontSize: 17.5, fontFamily: F.bold, color: C.ink, lineHeight: 25, marginBottom: SP.md },
  opt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: 'rgba(20,22,30,0.04)', borderWidth: 1, borderColor: 'rgba(20,22,30,0.10)', borderRadius: R.md, paddingVertical: 13, paddingHorizontal: 15, marginTop: 9 },
  optRight: { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: C.green },
  optWrong: { backgroundColor: 'rgba(244,63,94,0.10)', borderColor: C.orange },
  optTxt: { flex: 1, fontSize: 14.5, fontFamily: F.semi, color: C.ink },
  optTxtOn: { fontFamily: F.bold },
  testNext: { alignSelf: 'center', backgroundColor: GOLD, borderRadius: R.pill, paddingVertical: 14, paddingHorizontal: 40, marginTop: SP.sm },
  testNextTxt: { fontSize: 15, fontFamily: F.bold, color: '#12141A', letterSpacing: 0.3 },

  scoreCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  scoreNum: { fontSize: 60, fontFamily: SERIF, fontWeight: '600', color: GOLD, letterSpacing: 0, marginTop: SP.sm },
  scoreLbl: { fontSize: 14, fontFamily: F.semi, color: D.text },
  scoreMsg: { fontSize: 13.5, fontFamily: F.med, color: D.textDim, textAlign: 'center', lineHeight: 20, marginTop: SP.sm, marginBottom: SP.lg, paddingHorizontal: SP.xl },

  // 6 · practice chip (solid) + sheet
  chipSolid: { backgroundColor: GOLD, borderColor: GOLD },
  chipTxtSolid: { color: '#12141A', fontFamily: F.bold },
  practiceLoad: { alignItems: 'center', gap: 12, paddingVertical: SP.xxl },
  practiceLoadTxt: { fontSize: 13, fontFamily: F.med, color: D.textDim },
  practiceTxt: { fontSize: 16, fontFamily: F.med, color: C.ink, lineHeight: 25 },
  practiceAgain: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: SP.lg, paddingVertical: 11, paddingHorizontal: 20, borderRadius: R.pill, borderWidth: 1, borderColor: 'rgba(219,165,63,0.4)' },
  practiceAgainTxt: { fontSize: 13, fontFamily: F.bold, color: GOLD },

  // share (notes)
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch', marginBottom: SP.sm, paddingVertical: 11, borderRadius: R.md, backgroundColor: 'rgba(219,165,63,0.10)', borderWidth: 1, borderColor: 'rgba(219,165,63,0.38)' },
  shareTxt: { fontSize: 13, fontFamily: F.bold, color: GOLD },

  // script tab
  scriptRow: { alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: R.lg, padding: 14, marginBottom: 8 },
  scriptTitle: { fontSize: 11, fontFamily: F.bold, color: GOLD_DIM, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 },
  scriptTxt: { fontSize: 14.5, fontFamily: F.reg, color: D.text, lineHeight: 22 },

  // formulas tab
  formulaRow: { alignSelf: 'stretch', backgroundColor: PAPER, borderRadius: R.lg, paddingVertical: 15, paddingHorizontal: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: GOLD },
  formulaLbl: { fontSize: 11, fontFamily: F.bold, color: GOLD_DIM, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  formulaTxt: { fontSize: 18, fontFamily: SERIF, fontWeight: '600', color: C.ink, lineHeight: 26 },

  // 7 · recap
  recapRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: R.lg, padding: 15, marginBottom: 9 },
  recapDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(219,165,63,0.16)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  recapDotTxt: { fontSize: 12, fontFamily: F.bold, color: GOLD },
  recapTitle: { fontSize: 15, fontFamily: F.bold, color: D.text, lineHeight: 20 },
  recapPoint: { fontSize: 13.5, fontFamily: F.reg, color: D.textDim, lineHeight: 20, marginTop: 4 },
});
