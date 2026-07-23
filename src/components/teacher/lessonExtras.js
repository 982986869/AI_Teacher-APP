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
  PencilRuler, FileText, Share2, Languages, FunctionSquare, Star,
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

// Flashcard mastery, remembered across sessions (the fronts you've marked "Easy").
const flashKeyFor = (lessonKey) => `@ailernova_flash_mastered:${String(lessonKey || 'lesson')}`;
export async function loadFlashMastered(lessonKey) {
  try { const r = await AsyncStorage.getItem(flashKeyFor(lessonKey)); const a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : []; } catch { return []; }
}
export async function saveFlashMastered(lessonKey, fronts) {
  try { await AsyncStorage.setItem(flashKeyFor(lessonKey), JSON.stringify(fronts || [])); } catch {}
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
    .map((qc) => ({
      q: qc.question,
      options: qc.options.slice(0, 4),
      answer: Math.min(qc.answer, 3),
      why: String(qc.misconception || qc.hint || '').trim(), // the Opus-generated "why", surfaced on a miss
    }));
}

// Every formula the lesson wrote on the board, as a quick-reference sheet.
// Pull an "X = Y" equation out of a short string (a title), if one is present.
function extractEquation(text) {
  const t = String(text || '');
  if (t.indexOf('=') < 0) return '';
  const m = t.match(/[A-Za-z0-9²³½¼¾()\s.+\-*/√]+=[^.,;:!?]*[A-Za-z0-9²³½¼¾)]/);
  const e = m ? m[0].trim() : '';
  return e.length >= 3 && /[0-9A-Za-z]/.test(e) ? e : '';
}

// A per-scene formula: the boxed formulaParts, else an equation in its title.
function formulaOf(sc) {
  const parts = Array.isArray(sc.formulaParts) ? sc.formulaParts.filter(Boolean) : [];
  if (parts.length) return parts.join(' ').replace(/\s+/g, ' ').trim();
  return extractEquation(sc.title);
}

export function buildFormulas(scenes) {
  const out = [];
  const seen = new Set();
  (scenes || []).forEach((sc) => {
    const formula = formulaOf(sc);
    const k = formula.toLowerCase();
    if (!formula || seen.has(k)) return;
    seen.add(k);
    out.push({ title: sc.title || sc.kicker || 'Formula', formula });
  });
  return out;
}

// A tight recap — the key idea from each concept (+ its formula, if any), as cards.
export function buildRecap(scenes) {
  const out = [];
  const seen = new Set();
  (scenes || []).forEach((sc, i) => {
    if (!sc.title || sc.quickCheck) return; // concepts only, not checks
    const line = String(sc.teacherLine || '').trim();
    const point = (line.match(/^[^.!?]*[.!?]?/) || [''])[0].trim() || line;
    const k = sc.title.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ i, title: sc.title, point, formula: formulaOf(sc) });
  });
  return out;
}

// ════════════════════════════════════════════════════════════════════════════
// 1 · EXPLAIN-DIFFERENTLY CHIPS  — under the caption while teaching/paused
// ════════════════════════════════════════════════════════════════════════════
export function ExplainChips({ scene, onPick, onPractice }) {
  if (!scene) return null;
  const topic = (scene.title || scene.kicker || 'this idea').replace(/["“”]/g, '');
  const hasFormula = (Array.isArray(scene.formulaParts) && scene.formulaParts.length > 0) || /=/.test(scene.title || '');
  const isCheck = !!scene.quickCheck;
  // The middle chip adapts to what's on the board: derive a formula, unpack a
  // check, or give a worked example on a plain concept.
  const middle = hasFormula
    ? { Icon: FunctionSquare, label: 'Derive it', q: `Derive "${topic}" step by step — show where each term comes from, don't just state it.` }
    : isCheck
    ? { Icon: Sparkles, label: 'Break it down', q: `Break this question down: what is it really testing, and how should I think about it?` }
    : { Icon: Sparkles, label: 'Example', q: `Give me one concrete, real-world worked example of "${topic}", step by step.` };
  const chips = [
    { Icon: Lightbulb, label: 'Simpler',   q: `Explain "${topic}" more simply — like I'm seeing it for the first time. Use plain words.` },
    middle,
    { Icon: Languages, label: 'हिंदी में',  q: `"${topic}" ko simple Hindi/Hinglish mein samjhao — jaise ek dost samjhata hai.` },
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

// Context-aware follow-ups shown after she answers a doubt — a conversational chain.
export function FollowUpChips({ question, onPick }) {
  const q = String(question || 'that').replace(/["“”]/g, '').slice(0, 80);
  const chips = [
    { label: 'Why is that?', q: `Why is that true? Explain the reasoning behind your last answer.` },
    { label: 'Another example', q: `Give me one more example of that, a different one.` },
    { label: 'Quiz me on it', q: `Quiz me on what you just explained — ask one question and let me try first.` },
  ];
  return (
    <View style={s.followRow} accessibilityRole="toolbar">
      {chips.map((c) => (
        <PressableScale key={c.label} style={s.chip} onPress={() => onPick(c.q)} accessibilityRole="button" accessibilityLabel={c.label}>
          <Text style={s.chipTxt}>{c.label}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2 + 3 · CONTENTS SHEET (chapter map to jump) + BOOKMARKS/NOTES tab
// ════════════════════════════════════════════════════════════════════════════
const TABS = [
  { key: 'contents', label: 'Contents', Icon: ListTree },
  { key: 'notes',    label: 'Notes',    Icon: Bookmark },
  { key: 'review',   label: 'Review',   Icon: FileText },
];

export function ContentsSheet({ visible, scenes, currentIdx, saved, onToggleSave, onJump, onClose, recap, formulas, lessonTitle, noteText, onChangeNoteText, visited, results, onExplainFormula, noteSavedAt }) {
  const [tab, setTab] = useState('contents');
  useEffect(() => { if (visible) setTab('contents'); }, [visible]);
  const concepts = useMemo(() => conceptScenes(scenes), [scenes]);
  const savedSet = useMemo(() => new Set(saved || []), [saved]);
  const visitedSet = useMemo(() => new Set(visited || []), [visited]);
  const resultBy = useMemo(() => { const m = {}; (results || []).forEach((r) => { m[r.i] = r.correct; }); return m; }, [results]);
  // done / current / correct-check / missed-check / seen / not-yet
  const statusOf = (i) => {
    if (i === currentIdx) return 'now';
    if (resultBy[i] === true) return 'correct';
    if (resultBy[i] === false) return 'missed';
    if (visitedSet.has(i)) return 'seen';
    return 'todo';
  };
  const noteItems = concepts.filter((c) => savedSet.has(c.i));
  const rows = tab === 'contents' ? concepts : noteItems;

  const shareNotes = async () => {
    const body = noteItems.map((c, n) => `${n + 1}. ${c.title}\n   ${c.line || ''}`).join('\n\n');
    const mine = noteText && noteText.trim() ? `\n\nMy note:\n${noteText.trim()}` : '';
    try { await Share.share({ message: `My notes — ${lessonTitle || 'lesson'}\n\n${body}${mine}` }); } catch {}
  };
  const shareReview = async () => {
    const fx = (formulas || []).map((f) => `• ${f.formula}`).join('\n');
    const ideas = (recap || []).map((p, k) => `${k + 1}. ${p.title}${p.point ? `\n   ${p.point}` : ''}`).join('\n\n');
    const sheet = `${lessonTitle || 'Lesson'} — study sheet\n\n${fx ? `FORMULAS\n${fx}\n\n` : ''}KEY IDEAS\n${ideas}`;
    try { await Share.share({ message: sheet }); } catch {}
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
                  <View style={s.myNoteHead}>
                    <Text style={s.myNoteLbl}>My note</Text>
                    {!!(noteText && noteText.trim()) && (
                      <View style={s.savedPill}><Check size={11} color="#2DBB78" strokeWidth={3} /><Text style={s.savedTxt}>Saved</Text></View>
                    )}
                  </View>
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
                  <Text style={s.myNoteMeta}>Saved on this device{noteText && noteText.trim() ? ` · ${noteText.trim().length} chars` : ''}</Text>
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
                      {tab === 'contents' ? (
                        <View style={[s.stDot, s[`st_${statusOf(c.i)}`]]}>
                          {statusOf(c.i) === 'correct' ? <Check size={11} color="#12141A" strokeWidth={3.5} />
                            : statusOf(c.i) === 'missed' ? <X size={11} color="#12141A" strokeWidth={3.5} />
                            : <Text style={[s.stNum, (statusOf(c.i) === 'now') && { color: '#12141A' }]}>{n + 1}</Text>}
                        </View>
                      ) : <Text style={s.rowNum}>{c.isCheck ? '✓' : ''}</Text>}
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

          {/* Review — everything to revise in one place: the lesson's formulas, then
              the key idea from each concept (tap a card to jump back to it). */}
          {tab === 'review' && (
            <>
              {((formulas && formulas.length) || (recap && recap.length)) > 0 && (
                <PressableScale style={s.shareBtn} onPress={shareReview} accessibilityLabel="Share this study sheet">
                  <Share2 size={15} color={GOLD} strokeWidth={2.3} /><Text style={s.shareTxt}>Share study sheet</Text>
                </PressableScale>
              )}
              {formulas && formulas.length > 0 && (
                <>
                  <Text style={s.reviewSection}>Key formulas</Text>
                  {formulas.map((f, k) => (
                    <PressableScale key={`f${k}`} style={[s.formulaRow, k === 0 && s.formulaCore]} onPress={() => onExplainFormula && onExplainFormula(f.formula)} accessibilityRole="button" accessibilityLabel={`Explain ${f.formula}`}>
                      <View style={s.formulaHead}>
                        <Text style={s.formulaLbl} numberOfLines={1}>{k === 0 ? 'CORE FORMULA' : f.title}</Text>
                        {k === 0 && <Star size={13} color={GOLD} strokeWidth={2.3} fill={GOLD} />}
                      </View>
                      <Text style={s.formulaTxt}>{f.formula}</Text>
                      {!!onExplainFormula && <Text style={s.formulaTap}>Tap to have Ms. Nova explain it</Text>}
                    </PressableScale>
                  ))}
                </>
              )}
              {recap && recap.length > 0 ? (
                <>
                  <Text style={s.reviewSection}>Key ideas</Text>
                  {recap.map((p, k) => (
                    <PressableScale key={`r${k}`} style={s.scriptRow} onPress={() => { if (p.i != null) { onJump(p.i); onClose(); } }} accessibilityRole="button" accessibilityLabel={`Go to ${p.title}`}>
                      <Text style={s.scriptTitle} numberOfLines={1}>{p.title}</Text>
                      {!!p.point && <Text style={s.scriptTxt}>{p.point}</Text>}
                      {!!p.formula && <Text style={s.recapFormula}>{p.formula}</Text>}
                    </PressableScale>
                  ))}
                </>
              ) : (!formulas || !formulas.length) && <Text style={s.empty}>Nothing to review yet.</Text>}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// 4 · FLASHCARD DECK — tap to flip, swipe through with Prev/Next
// ════════════════════════════════════════════════════════════════════════════
// A real spaced-review deck: shuffle, flip, then self-grade each card. Cards you
// mark "Review again" come back in the next round; the deck ends only when every
// card is known — with a summary of how many you got first try.
export function FlashcardDeck({ visible, cards, onClose, lessonKey }) {
  const n = cards ? cards.length : 0;
  const [mastered, setMastered] = useState(() => new Set());
  const [queue, setQueue] = useState([]);   // card indices still to review this round
  const [again, setAgain] = useState([]);   // pushed to the next round
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [round, setRound] = useState(1);
  const [firstPass, setFirstPass] = useState(0); // known first-try this session
  const [done, setDone] = useState(false);

  // Weak-first order: cards you've mastered before sink to the end, so a session
  // opens on what you don't know yet.
  const build = (mset) => {
    const a = cards.map((_, i) => i);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.sort((x, y) => (mset.has(cards[x].front) ? 1 : 0) - (mset.has(cards[y].front) ? 1 : 0));
  };
  const start = (mset) => { setQueue(build(mset)); setAgain([]); setPos(0); setFlipped(false); setRound(1); setFirstPass(0); setDone(false); };

  useEffect(() => {
    if (!visible || !n) return;
    let ok = true;
    loadFlashMastered(lessonKey).then((arr) => { if (!ok) return; const mset = new Set(arr); setMastered(mset); start(mset); });
    return () => { ok = false; };
  }, [visible, n, lessonKey]);

  const card = queue.length ? cards[queue[Math.min(pos, queue.length - 1)]] : null;
  const remaining = Math.max(0, queue.length - pos) + again.length;
  const priorMastered = cards.filter((c) => mastered.has(c.front)).length;

  const markMastered = (front) => setMastered((prev) => { const nx = new Set(prev); nx.add(front); saveFlashMastered(lessonKey, [...nx]); return nx; });

  // Again → see it again soon THIS round · Hard → next round · Easy → mastered, gone.
  const grade = (level) => {
    const cur = queue[pos];
    if (level === 'easy') { if (round === 1) setFirstPass((f) => f + 1); markMastered(cards[cur].front); }
    let q2 = queue.slice(); let ag = again.slice();
    if (level === 'again') { q2.splice(Math.min(pos + 3, q2.length), 0, cur); }
    else if (level === 'hard') { ag = [...ag, cur]; }
    const atEnd = pos + 1 >= q2.length;
    if (!atEnd) { setQueue(q2); setAgain(ag); setPos(pos + 1); setFlipped(false); return; }
    if (ag.length === 0) { setQueue(q2); setDone(true); return; }
    setQueue(ag); setAgain([]); setPos(0); setFlipped(false); setRound((r) => r + 1);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.deckWrap}>
        <View style={s.deckHead}>
          <View style={s.deckTitleRow}><Layers size={17} color={GOLD} strokeWidth={2.3} /><Text style={s.deckTitle}>Flashcards</Text></View>
          <PressableScale onPress={onClose} style={s.sheetX} accessibilityLabel="Close flashcards"><X size={20} color={D.textDim} strokeWidth={2.3} /></PressableScale>
        </View>
        {!n && <Text style={s.empty}>No cards for this lesson.</Text>}

        {!!n && !done && card && (
          <>
            <Text style={s.deckCount}>{round > 1 ? `Round ${round} · ` : ''}{remaining} to go{priorMastered > 0 && round === 1 ? ` · ${priorMastered} mastered` : ''}</Text>
            <PressableScale style={s.card} scaleTo={0.98} onPress={() => setFlipped((f) => !f)} accessibilityRole="button" accessibilityLabel={flipped ? 'Show question' : 'Show answer'}>
              <Text style={s.cardTag}>{flipped ? 'ANSWER' : (card.tag || 'QUESTION').toUpperCase()}</Text>
              <Text style={s.cardTxt}>{flipped ? card.back : card.front}</Text>
              {!flipped && <Text style={s.cardHint}>Tap to reveal the answer</Text>}
            </PressableScale>
            {flipped ? (
              <View style={s.srsRow}>
                <PressableScale style={[s.srsBtn, s.srsAgain]} onPress={() => grade('again')} accessibilityLabel="Didn't know it"><Text style={[s.srsTxt, { color: '#E0524B' }]}>Again</Text></PressableScale>
                <PressableScale style={[s.srsBtn, s.srsHard]} onPress={() => grade('hard')} accessibilityLabel="Knew it, but hard"><Text style={[s.srsTxt, { color: '#C79B42' }]}>Hard</Text></PressableScale>
                <PressableScale style={[s.srsBtn, s.srsEasy]} onPress={() => grade('easy')} accessibilityLabel="Easy, I know this"><Text style={[s.srsTxt, { color: '#1E9E63' }]}>Easy</Text></PressableScale>
              </View>
            ) : (
              <Text style={s.deckTapHint}>Recall it, then tap the card to check.</Text>
            )}
          </>
        )}

        {!!n && done && (
          <Appear from="scale" style={s.scoreCard}>
            <Trophy size={38} color={GOLD} strokeWidth={1.9} />
            <Text style={s.scoreNum}>{firstPass}/{n}</Text>
            <Text style={s.scoreLbl}>easy on the first try</Text>
            <Text style={s.scoreMsg}>{mastered.size >= n ? 'Every card mastered — remembered for next time.' : 'The ones you found hard are saved to review next session.'}</Text>
            <View style={s.deckNav}>
              <PressableScale style={[s.deckBtn]} onPress={() => start(mastered)} accessibilityLabel="Go again"><Text style={s.deckBtnTxt}>↻ Again</Text></PressableScale>
              <PressableScale style={[s.deckBtn, s.deckBtnGold]} onPress={onClose} accessibilityLabel="Done"><Text style={[s.deckBtnTxt, { color: '#12141A' }]}>Done</Text></PressableScale>
            </View>
          </Appear>
        )}
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 5 · TEST YOURSELF — a short scored MCQ quiz from the lesson's checks
// ════════════════════════════════════════════════════════════════════════════
export function TestSheet({ visible, questions, onClose, onScore }) {
  const [pool, setPool] = useState([]);   // the questions in play (full set, or only-missed on retry)
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]); // picked index per question, for the review
  const [done, setDone] = useState(false);
  const reset = (qs) => { setPool(qs); setI(0); setPicked(null); setAnswers([]); setDone(false); };
  useEffect(() => { if (visible) reset(questions || []); }, [visible, questions]);

  const n = pool.length;
  const q = n ? pool[Math.min(i, n - 1)] : null;
  const correct = answers.filter((a, k) => pool[k] && a === pool[k].answer).length;
  const pct = n ? Math.round((correct / n) * 100) : 0;
  const missed = pool.filter((_, k) => answers[k] !== pool[k].answer);

  const choose = (oi) => { if (picked != null) return; setPicked(oi); setAnswers((prev) => { const c = prev.slice(); c[i] = oi; return c; }); };
  const next = () => {
    if (i >= n - 1) { setDone(true); onScore && onScore(pct); }
    else { setI((x) => x + 1); setPicked(null); }
  };

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
            <ScrollView showsVerticalScrollIndicator={false}>
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
              {/* the "why", surfaced the moment you get it wrong */}
              {picked != null && picked !== q.answer && !!q.why && (
                <View style={s.whyCard}><Text style={s.whyLbl}>WHY</Text><Text style={s.whyTxt}>{q.why}</Text></View>
              )}
            </ScrollView>
            {picked != null && (
              <PressableScale style={s.testNext} onPress={next} accessibilityLabel={i >= n - 1 ? 'See score' : 'Next question'}>
                <Text style={s.testNextTxt}>{i >= n - 1 ? 'See my score' : 'Next ›'}</Text>
              </PressableScale>
            )}
          </>
        )}

        {done && (
          <ScrollView contentContainerStyle={{ paddingBottom: SP.xl }} showsVerticalScrollIndicator={false}>
            <Appear from="scale" style={s.scoreHead}>
              <Trophy size={36} color={GOLD} strokeWidth={1.9} />
              <Text style={s.scoreNum}>{pct}%</Text>
              <Text style={s.scoreLbl}>{correct} of {n} correct</Text>
              <View style={[s.verdict, pct >= 80 ? s.verdictReady : pct >= 50 ? s.verdictAlmost : s.verdictRevise]}>
                <Text style={s.verdictTxt}>{pct >= 80 ? 'EXAM-READY' : pct >= 50 ? 'ALMOST THERE' : 'NEEDS REVISION'}</Text>
              </View>
            </Appear>
            {/* per-question review */}
            <Text style={s.reviewHead}>Review</Text>
            {pool.map((qq, k) => {
              const you = answers[k];
              const ok = you === qq.answer;
              return (
                <View key={k} style={[s.reviewCard, ok ? s.reviewOk : s.reviewBad]}>
                  <Text style={s.reviewQ}>{k + 1}. {qq.q}</Text>
                  {!ok && you != null && <Text style={s.reviewYou}>Your answer: {qq.options[you]}</Text>}
                  <Text style={s.reviewAns}>{ok ? '✓ ' : '✓ Correct: '}{qq.options[qq.answer]}</Text>
                  {!ok && !!qq.why && <Text style={s.reviewWhy}>{qq.why}</Text>}
                </View>
              );
            })}
            <View style={[s.deckNav, { marginTop: SP.md }]}>
              {missed.length > 0 && (
                <PressableScale style={[s.deckBtn]} onPress={() => reset(missed)} accessibilityLabel="Retry the ones I missed"><Text style={s.deckBtnTxt}>↻ Retry {missed.length} missed</Text></PressableScale>
              )}
              <PressableScale style={[s.deckBtn, s.deckBtnGold]} onPress={onClose} accessibilityLabel="Done"><Text style={[s.deckBtnTxt, { color: '#12141A' }]}>Done</Text></PressableScale>
            </View>
          </ScrollView>
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
  followRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: SP.sm },

  // personal free-text note (Notes tab)
  myNoteWrap: { alignSelf: 'stretch', marginBottom: SP.md },
  myNoteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  myNoteLbl: { fontSize: 10.5, fontFamily: F.bold, color: GOLD_DIM, letterSpacing: 1.2, textTransform: 'uppercase' },
  savedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(45,187,120,0.14)', borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 3 },
  savedTxt: { fontSize: 10.5, fontFamily: F.bold, color: '#2DBB78', letterSpacing: 0.3 },
  myNoteInput: { minHeight: 76, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: R.md, padding: 12, color: D.text, fontSize: 14, fontFamily: F.reg, lineHeight: 20 },
  myNoteMeta: { fontSize: 10.5, fontFamily: F.med, color: D.textFaint, marginTop: 6, letterSpacing: 0.2 },

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
  // progress-map status dot
  stDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  stNum: { fontSize: 11.5, fontFamily: F.bold, color: D.textDim },
  st_now: { backgroundColor: GOLD, borderColor: GOLD },
  st_correct: { backgroundColor: '#2DBB78', borderColor: '#2DBB78' },
  st_missed: { backgroundColor: '#E9A23B', borderColor: '#E9A23B' },
  st_seen: { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.22)' },
  st_todo: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.14)' },
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
  deckTapHint: { fontSize: 12.5, fontFamily: F.med, color: D.textDim, textAlign: 'center', marginTop: SP.lg },
  deckNav: { flexDirection: 'row', gap: 12, marginTop: SP.lg },
  deckBtn: { flex: 1, alignItems: 'center', paddingVertical: 15, borderRadius: R.md, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  deckBtnDim: { opacity: 0.35 },
  deckBtnGold: { backgroundColor: GOLD, borderColor: GOLD },
  deckBtnTxt: { fontSize: 14, fontFamily: F.bold, color: D.text },
  // self-grade buttons
  gradeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: R.md, borderWidth: 1.5 },
  gradeAgain: { backgroundColor: 'rgba(224,82,75,0.10)', borderColor: 'rgba(224,82,75,0.5)' },
  gradeGot: { backgroundColor: 'rgba(30,158,99,0.12)', borderColor: 'rgba(30,158,99,0.55)' },
  gradeTxt: { fontSize: 14, fontFamily: F.bold },
  // 3-tier spaced-repetition grading
  srsRow: { flexDirection: 'row', gap: 8, marginTop: SP.lg },
  srsBtn: { flex: 1, alignItems: 'center', paddingVertical: 15, borderRadius: R.md, borderWidth: 1.5 },
  srsAgain: { backgroundColor: 'rgba(224,82,75,0.10)', borderColor: 'rgba(224,82,75,0.5)' },
  srsHard: { backgroundColor: 'rgba(199,155,66,0.12)', borderColor: 'rgba(199,155,66,0.55)' },
  srsEasy: { backgroundColor: 'rgba(30,158,99,0.12)', borderColor: 'rgba(30,158,99,0.55)' },
  srsTxt: { fontSize: 14, fontFamily: F.bold },

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
  scoreHead: { alignItems: 'center', gap: 4, marginBottom: SP.md },
  scoreNum: { fontSize: 60, fontFamily: SERIF, fontWeight: '600', color: GOLD, letterSpacing: 0, marginTop: SP.sm },
  scoreLbl: { fontSize: 14, fontFamily: F.semi, color: D.text },
  scoreMsg: { fontSize: 13.5, fontFamily: F.med, color: D.textDim, textAlign: 'center', lineHeight: 20, marginTop: SP.sm, marginBottom: SP.lg, paddingHorizontal: SP.xl },
  // per-question review
  reviewHead: { fontSize: 11, fontFamily: F.bold, color: GOLD_DIM, letterSpacing: 2, textTransform: 'uppercase', marginBottom: SP.sm, marginTop: SP.sm },
  reviewCard: { alignSelf: 'stretch', borderRadius: R.md, borderWidth: 1, padding: 14, marginBottom: 8 },
  reviewOk: { backgroundColor: 'rgba(30,158,99,0.08)', borderColor: 'rgba(30,158,99,0.35)' },
  reviewBad: { backgroundColor: 'rgba(224,82,75,0.08)', borderColor: 'rgba(224,82,75,0.4)' },
  reviewQ: { fontSize: 14, fontFamily: F.semi, color: D.text, lineHeight: 20 },
  reviewYou: { fontSize: 12.5, fontFamily: F.med, color: '#E0524B', marginTop: 6 },
  reviewAns: { fontSize: 12.5, fontFamily: F.bold, color: '#1E9E63', marginTop: 4 },
  reviewWhy: { fontSize: 12.5, fontFamily: F.reg, color: D.textDim, lineHeight: 18, marginTop: 6, fontStyle: 'italic' },
  // the "why" surfaced live on a miss
  whyCard: { backgroundColor: 'rgba(224,82,75,0.10)', borderWidth: 1, borderColor: 'rgba(224,82,75,0.4)', borderRadius: R.md, padding: 13, marginBottom: SP.md },
  whyLbl: { fontSize: 10, fontFamily: F.bold, color: '#E0524B', letterSpacing: 1.6, marginBottom: 5 },
  whyTxt: { fontSize: 13.5, fontFamily: F.med, color: D.text, lineHeight: 20 },
  // exam verdict badge
  verdict: { marginTop: SP.sm, paddingVertical: 5, paddingHorizontal: 16, borderRadius: R.pill, borderWidth: 1 },
  verdictReady: { backgroundColor: 'rgba(30,158,99,0.14)', borderColor: 'rgba(30,158,99,0.6)' },
  verdictAlmost: { backgroundColor: 'rgba(199,155,66,0.16)', borderColor: 'rgba(199,155,66,0.6)' },
  verdictRevise: { backgroundColor: 'rgba(224,82,75,0.12)', borderColor: 'rgba(224,82,75,0.55)' },
  verdictTxt: { fontSize: 11, fontFamily: F.bold, color: D.text, letterSpacing: 1.5 },

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

  // review tab
  reviewSection: { fontSize: 10.5, fontFamily: F.bold, color: GOLD_DIM, letterSpacing: 1.6, textTransform: 'uppercase', marginTop: SP.sm, marginBottom: SP.sm },
  scriptRow: { alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: R.lg, padding: 14, marginBottom: 8 },
  scriptTitle: { fontSize: 11, fontFamily: F.bold, color: GOLD_DIM, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 },
  scriptTxt: { fontSize: 14.5, fontFamily: F.reg, color: D.text, lineHeight: 22 },

  // formulas tab
  formulaRow: { alignSelf: 'stretch', backgroundColor: PAPER, borderRadius: R.lg, paddingVertical: 15, paddingHorizontal: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: GOLD_DIM },
  formulaCore: { borderLeftColor: GOLD, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  formulaHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  formulaLbl: { fontSize: 11, fontFamily: F.bold, color: GOLD_DIM, letterSpacing: 0.4, textTransform: 'uppercase' },
  formulaTxt: { fontSize: 18, fontFamily: SERIF, fontWeight: '600', color: C.ink, lineHeight: 26 },
  formulaTap: { fontSize: 11, fontFamily: F.med, color: '#9A8F79', marginTop: 8 },

  // 7 · recap
  recapRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: R.lg, padding: 15, marginBottom: 9 },
  recapDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(219,165,63,0.16)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  recapDotTxt: { fontSize: 12, fontFamily: F.bold, color: GOLD },
  recapTitle: { fontSize: 15, fontFamily: F.bold, color: D.text, lineHeight: 20 },
  recapPoint: { fontSize: 13.5, fontFamily: F.reg, color: D.textDim, lineHeight: 20, marginTop: 4 },
  recapFormula: { fontSize: 15, fontFamily: SERIF, fontWeight: '600', color: GOLD, marginTop: 7, letterSpacing: 0.2 },
});
