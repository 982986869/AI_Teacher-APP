import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, Modal, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MathText from '../components/MathText';

// Purple/pastel palette (from the AiLernova demo)
const C = {
  primary: '#6C63FF', primaryLight: '#EAE8FF',
  accent: '#FF7B7B', accentLight: '#FFF0F0',
  green: '#4CAF7D', greenLight: '#E8F8F0',
  yellow: '#FFB74D', yellowLight: '#FFF8ED',
  bg: '#F4F6FF', white: '#fff',
  text: '#2D2D3A', muted: '#8A8AA0', border: '#E4E6F1',
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// MM:SS, or HH:MM:SS once the remaining time is an hour or more.
const fmtTime = (s) => {
  const sec = Math.max(0, Math.floor(s));
  const p = (n) => String(n).padStart(2, '0');
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  return h > 0 ? `${p(h)}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
};

export default function McqTestScreen({
  subject,
  chapter,
  questions = [],
  sections = null,        // optional: [{ sectionName, sectionId, count, attemptAny }] → sectioned mock-test UI
  onExit,
  onSubmit,               // optional: ({ answers:{[questionId]:idx}, timeTakenSec, results }) → persist server-side
  pointsPerCorrect = 4,
  negative = 1,
  durationMin = 30,
}) {
  const insets = useSafeAreaInsets();
  const qs = Array.isArray(questions) ? questions : [];
  const total = qs.length;
  const totalMarks = total * pointsPerCorrect;

  const [phase, setPhase] = useState('instructions'); // instructions | quiz | results
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // qIndex -> selected option index
  const [status, setStatus] = useState({});   // qIndex -> 'answered' | 'skipped'
  const [showFinish, setShowFinish] = useState(false);
  const [toast, setToast] = useState(null);
  const [secs, setSecs] = useState(durationMin * 60);
  const [activeSec, setActiveSec] = useState(0);     // sectioned mode: active section tab
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showExit, setShowExit] = useState(false);   // exit-test confirmation
  const submittedRef = useRef(false);                // guards against double submit

  // Sectioned mode (mock tests): cumulative global-index ranges per section.
  const sectionInfo = useMemo(() => {
    if (!Array.isArray(sections) || sections.length === 0) return null;
    let start = 0;
    return sections.map((sec) => {
      const count = sec.count || 0;
      const info = { sectionName: sec.sectionName || 'Section', sectionId: sec.sectionId, attemptAny: sec.attemptAny, count, start, end: start + count - 1 };
      start += count;
      return info;
    });
  }, [sections]);

  // Timer (runs only during quiz)
  useEffect(() => {
    if (phase !== 'quiz') return;
    const id = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) { clearInterval(id); doSubmit(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(id);
  }, [toast]);

  const answeredCount = Object.values(status).filter((v) => v === 'answered').length;
  const skippedCount = Object.values(status).filter((v) => v === 'skipped').length;
  const remaining = Math.max(0, total - answeredCount - skippedCount);

  // Hardware back during a mock-test quiz → exit confirmation (don't drop the user
  // out of the app / flow unexpectedly).
  useEffect(() => {
    if (!sectionInfo || phase !== 'quiz') return undefined;
    const onBack = () => {
      if (answeredCount > 0) setShowExit(true);
      else exitTest();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [sectionInfo, phase, answeredCount, onExit]);

  const selectOption = (optIdx) => {
    setAnswers((a) => ({ ...a, [current]: optIdx }));
  };

  const goNext = () => {
    if (current < total - 1) setCurrent((c) => c + 1);
  };

  const saveNext = () => {
    if (answers[current] == null) { setToast('Select an option first'); return; }
    setStatus((st) => ({ ...st, [current]: 'answered' }));
    setToast('Answer saved!');
    goNext();
  };

  const skip = () => {
    setStatus((st) => ({ ...st, [current]: 'skipped' }));
    setToast('Skipped — come back later');
    goNext();
  };

  // ── Sectioned-mode helpers (selecting auto-saves; navigation stays in-section) ──
  const selectSectioned = (optIdx) => {
    setAnswers((a) => ({ ...a, [current]: optIdx }));
    setStatus((st) => ({ ...st, [current]: 'answered' }));
  };
  const clearAnswer = () => {
    setAnswers((a) => { const n = { ...a }; delete n[current]; return n; });
    setStatus((st) => { const n = { ...st }; delete n[current]; return n; });
  };
  const gotoSection = (i) => { if (sectionInfo && sectionInfo[i]) { setActiveSec(i); setCurrent(sectionInfo[i].start); } };
  const secPrev = () => { const sec = sectionInfo[activeSec]; if (sec && current > sec.start) setCurrent((c) => c - 1); };
  const secNext = () => { const sec = sectionInfo[activeSec]; if (sec && current < sec.end) setCurrent((c) => c + 1); };

  // Persist exactly one attempt for this session (finish OR mid-test exit).
  // Guarded so the timer, manual finish, and exit can never double-record.
  const persistAttempt = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (!onSubmit) return;
    const ansById = {};
    qs.forEach((q, i) => {
      if (status[i] === 'answered' && answers[i] != null && q && q.id != null) ansById[q.id] = answers[i];
    });
    const timeTakenSec = Math.max(0, durationMin * 60 - secs);
    try { onSubmit({ answers: ansById, timeTakenSec, results: computeResults() }); } catch (e) { /* non-fatal */ }
  };

  const doSubmit = () => {
    persistAttempt();          // records the attempt (guarded)
    setShowFinish(false);
    setShowExit(false);
    setPhase('results');
  };

  // Exiting a STARTED test still records an attempt (so it shows "Attempted"),
  // then leaves. Exiting from the instructions screen records nothing.
  const exitTest = () => {
    if (phase === 'quiz') persistAttempt();
    setShowExit(false);
    if (onExit) onExit();
  };

  // Results computation
  const computeResults = () => {
    let correct = 0, wrong = 0;
    qs.forEach((q, i) => {
      if (answers[i] != null && status[i] === 'answered') {
        if (answers[i] === q.correct) correct++;
        else wrong++;
      }
    });
    const skipped = total - correct - wrong;
    const score = correct * pointsPerCorrect - wrong * negative;
    const accuracy = (correct + wrong) ? Math.round((correct / (correct + wrong)) * 100) : 0;
    const completion = total ? Math.round(((correct + wrong) / total) * 100) : 0;
    const scorePct = totalMarks ? Math.round((Math.max(0, score) / totalMarks) * 100) : 0;
    return { correct, wrong, skipped, score, accuracy, completion, scorePct };
  };

  const Header = () => (
    <View style={s.header}>
      <TouchableOpacity onPress={onExit} style={s.logoRow} activeOpacity={0.7}>
        <Text style={s.backArrow}>←</Text>
        <Text style={s.logo}>Ai<Text style={s.logoAccent}>Lernova</Text></Text>
      </TouchableOpacity>
      {phase === 'quiz' && (
        <View style={[s.timerPill, secs < 300 && { backgroundColor: C.accentLight }]}>
          <View style={[s.timerDot, secs < 300 && { backgroundColor: C.accent }]} />
          <Text style={[s.timerTxt, secs < 300 && { color: C.accent }]}>{fmtTime(secs)}</Text>
        </View>
      )}
    </View>
  );

  // ── INSTRUCTIONS ────────────────────────────────────────────────────────────
  if (phase === 'instructions') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <Header />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          <View style={s.hero}>
            <View style={s.heroTagWrap}><Text style={s.heroTag}>📚 ONLINE TEST · MCQ</Text></View>
            <Text style={s.heroTitle}>{chapter}</Text>
            <Text style={s.heroSub}>{subject} · Important MCQ Practice</Text>
            <View style={s.heroChips}>
              <View style={s.heroChip}><Text style={s.heroChipTxt}>🕐 {durationMin} Min</Text></View>
              <View style={s.heroChip}><Text style={s.heroChipTxt}>❓ {total} Qs</Text></View>
              <View style={s.heroChip}><Text style={s.heroChipTxt}>🏆 {totalMarks} Marks</Text></View>
            </View>
          </View>

          <View style={s.pc}>
            <View style={s.secTitleRow}><View style={s.secBar} /><Text style={s.secTitle}>Marking Scheme</Text></View>
            <View style={s.markRow}>
              <View style={[s.mcard, { backgroundColor: C.greenLight }]}>
                <View style={[s.mcardIco, { backgroundColor: '#D9F5E8' }]}><Text style={{ fontSize: 14 }}>✅</Text></View>
                <View>
                  <Text style={s.mcardLbl}>Correct</Text>
                  <Text style={[s.mcardVal, { color: C.green }]}>+{pointsPerCorrect}</Text>
                </View>
              </View>
              <View style={[s.mcard, { backgroundColor: C.accentLight }]}>
                <View style={[s.mcardIco, { backgroundColor: '#FFE4E4' }]}><Text style={{ fontSize: 14 }}>❌</Text></View>
                <View>
                  <Text style={s.mcardLbl}>Wrong</Text>
                  <Text style={[s.mcardVal, { color: C.accent }]}>−{negative}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={s.pc}>
            <View style={s.secTitleRow}><View style={s.secBar} /><Text style={s.secTitle}>Instructions</Text></View>
            {[
              `${total} MCQ questions, one correct answer each.`,
              'Timer starts when you press Start Test.',
              'Save & Next to lock. Skip to revisit later.',
              'Use Question Palette to jump between questions.',
              'Finish Test anytime. Cannot reattempt after submit.',
            ].map((t, i) => (
              <View key={i} style={s.instrItem}>
                <View style={s.instrNum}><Text style={s.instrNumTxt}>{i + 1}</Text></View>
                <Text style={s.instrTxt}>{t}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.ctaBtn} activeOpacity={0.85}
            onPress={() => { if (total > 0) setPhase('quiz'); }}>
            <Text style={s.ctaBtnTxt}>🚀 Start Test</Text>
          </TouchableOpacity>

          {total === 0 && (
            <Text style={s.noQ}>No questions added for this chapter yet.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── RESULTS ─────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const r = computeResults();
    const verdict = r.scorePct >= 80 ? 'Excellent!' : r.scorePct >= 50 ? 'Well done!' : 'Keep practicing!';
    const emoji = r.scorePct >= 80 ? '🏆' : r.scorePct >= 50 ? '👍' : '💪';
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <Header />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          <View style={s.resHero}>
            <Text style={s.resEmoji}>{emoji}</Text>
            <Text style={s.resTitle}>{verdict}</Text>
            <Text style={s.resSub}>You've completed the {chapter} test.</Text>
            <View style={s.scoreRing}>
              <Text style={s.scoreBig}>{Math.max(0, r.score)}</Text>
              <Text style={s.scoreOut}>out of {totalMarks}</Text>
            </View>
          </View>

          <View style={s.resStats}>
            <View style={[s.rs, { backgroundColor: C.greenLight }]}><Text style={[s.rsVal, { color: C.green }]}>{r.correct}</Text><Text style={s.rsLbl}>✅ Correct</Text></View>
            <View style={[s.rs, { backgroundColor: C.accentLight }]}><Text style={[s.rsVal, { color: C.accent }]}>{r.wrong}</Text><Text style={s.rsLbl}>❌ Wrong</Text></View>
            <View style={[s.rs, { backgroundColor: C.yellowLight }]}><Text style={[s.rsVal, { color: C.yellow }]}>{r.skipped}</Text><Text style={s.rsLbl}>⏭ Skipped</Text></View>
          </View>

          <View style={s.pc}>
            <View style={s.secTitleRow}><View style={s.secBar} /><Text style={s.secTitle}>Performance</Text></View>
            <PerfRow label="Accuracy" value={r.accuracy} color={C.green} />
            <PerfRow label="Completion" value={r.completion} color={C.primary} />
            <PerfRow label="Score %" value={r.scorePct} color={C.yellow} />
          </View>

          <View style={s.pc}>
            <View style={s.secTitleRow}><View style={s.secBar} /><Text style={s.secTitle}>Answer Review</Text></View>
            {qs.map((q, i) => {
              const ans = answers[i];
              const isAnswered = status[i] === 'answered' && ans != null;
              const isCorrect = isAnswered && ans === q.correct;
              const tagBg = !isAnswered ? C.yellowLight : isCorrect ? C.greenLight : C.accentLight;
              const tagColor = !isAnswered ? C.yellow : isCorrect ? C.green : C.accent;
              const tagTxt = !isAnswered ? '⏭ Skipped' : isCorrect ? '✅ Correct' : '❌ Wrong';
              return (
                <View key={i} style={[s.revItem, i === qs.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={s.revRow}>
                    <Text style={s.revCat}>Q{i + 1} · {q.cat || 'MCQ'}</Text>
                    <View style={[s.revTag, { backgroundColor: tagBg }]}><Text style={[s.revTagTxt, { color: tagColor }]}>{tagTxt}</Text></View>
                  </View>
                  <MathText value={q.question} fontSize={14} color={C.text} style={{ marginBottom: 6 }} />
                  <View style={s.revAnsRow}>
                    <Text style={[s.revAns, { color: C.green }]}>✅ Correct: {LETTERS[q.correct]}. </Text>
                    <MathText value={q.options[q.correct]} fontSize={13} color={C.green} />
                  </View>
                  {isAnswered && !isCorrect && (
                    <View style={s.revAnsRow}>
                      <Text style={[s.revAns, { color: C.accent }]}>Your answer: {LETTERS[ans]}. </Text>
                      <MathText value={q.options[ans]} fontSize={13} color={C.accent} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={s.ctaBtn} activeOpacity={0.85} onPress={onExit}>
            <Text style={s.ctaBtnTxt}>🏠 Back to Practice</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── QUIZ ────────────────────────────────────────────────────────────────────
  const q = qs[current];
  const progressPct = total ? ((current + 1) / total) * 100 : 0;
  const sel = answers[current];

  // ── SECTIONED MOCK-TEST QUIZ (DB-backed; teal reference layout) ──────────────
  if (sectionInfo) {
    const aSec = Math.min(activeSec, sectionInfo.length - 1);
    const sec = sectionInfo[aSec];
    const localIdx = current - sec.start;
    const isLastOverall = aSec === sectionInfo.length - 1 && localIdx >= sec.count - 1;
    const requestExit = () => { if (answeredCount > 0) setShowExit(true); else exitTest(); };
    return (
      <SafeAreaView style={mt.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: insets.top, backgroundColor: '#fff' }} />}
        <View style={mt.accent} />
        <View style={mt.appbar}>
          <TouchableOpacity style={mt.exitBtn} onPress={requestExit} activeOpacity={0.85}>
            <Text style={mt.exitTxt}>✕ Exit</Text>
          </TouchableOpacity>
          <Text style={mt.appbarTitle} numberOfLines={1}>{chapter}</Text>
          <TouchableOpacity style={mt.finishTopBtn} onPress={() => setShowFinish(true)} activeOpacity={0.85}>
            <Text style={mt.finishTopTxt}>Finish</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
          <View style={mt.card}>
            <View style={mt.topRow}>
              <Text style={mt.count}>{localIdx + 1} / {sec.count}</Text>
              <Text style={[mt.timer, secs < 300 && { color: '#E0322E' }]}>{fmtTime(secs)}</Text>
            </View>

            <View style={mt.tabs}>
              {sectionInfo.map((sx, i) => (
                <TouchableOpacity key={i} style={[mt.tab, i === aSec && mt.tabOn]} activeOpacity={0.85} onPress={() => gotoSection(i)}>
                  <Text style={[mt.tabTxt, i === aSec && mt.tabTxtOn]}>{sx.sectionName}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {sec.attemptAny != null && (
              <View style={mt.instr}><Text style={mt.instrTxt}>Attempt any {sec.attemptAny} questions</Text></View>
            )}

            <View style={{ marginBottom: 14 }}>
              <MathText value={q.question} fontSize={16} color="#3A4A4A" />
            </View>

            <View style={{ gap: 12, marginTop: 8 }}>
              {q.options.map((opt, i) => {
                const isSel = sel === i;
                return (
                  <TouchableOpacity key={i} style={[mt.opt, isSel && mt.optSel]} activeOpacity={0.85} onPress={() => selectSectioned(i)}>
                    <Text style={[mt.optLtr, isSel && mt.optLtrSel]}>{LETTERS[i]}</Text>
                    <View style={{ flex: 1 }}>
                      <MathText value={opt} fontSize={15} color={isSel ? '#0B5E5A' : '#3A4A4A'} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={mt.clearWrap} onPress={clearAnswer} activeOpacity={0.7}>
              <Text style={mt.clearTxt}>Clear Answer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* bottom: Previous · palette · Next (within the active section) */}
        <View style={[mt.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={[mt.prevBtn, localIdx === 0 && mt.dim]} disabled={localIdx === 0} onPress={secPrev} activeOpacity={0.85}>
            <Text style={mt.prevTxt}>← Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={mt.menuBtn} onPress={() => setPaletteOpen(true)} activeOpacity={0.85}>
            <Text style={mt.menuTxt}>☰</Text>
          </TouchableOpacity>
          {isLastOverall ? (
            <TouchableOpacity style={[mt.nextBtn, mt.finishNext]} onPress={() => setShowFinish(true)} activeOpacity={0.85}>
              <Text style={mt.nextTxt}>Finish ✓</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[mt.nextBtn, localIdx >= sec.count - 1 && mt.dim]} disabled={localIdx >= sec.count - 1} onPress={secNext} activeOpacity={0.85}>
              <Text style={mt.nextTxt}>Next →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* palette grouped by section + Finish */}
        <Modal visible={paletteOpen} transparent animationType="slide" onRequestClose={() => setPaletteOpen(false)}>
          <View style={mt.modalOv}>
            <View style={mt.sheet}>
              <View style={mt.handle} />
              <Text style={mt.sheetTitle}>Question Palette</Text>
              <ScrollView style={{ maxHeight: 360 }}>
                {sectionInfo.map((sx, si) => (
                  <View key={si} style={{ marginBottom: 14 }}>
                    <Text style={mt.palSec}>{sx.sectionName}{sx.attemptAny != null ? `  ·  attempt any ${sx.attemptAny}` : ''}</Text>
                    <View style={mt.palGrid}>
                      {Array.from({ length: sx.count }).map((_, li) => {
                        const gIdx = sx.start + li;
                        const answered = status[gIdx] === 'answered';
                        const isCur = gIdx === current;
                        return (
                          <TouchableOpacity key={li} style={[mt.palCell, answered && mt.palAns, isCur && mt.palCur]}
                            onPress={() => { setActiveSec(si); setCurrent(gIdx); setPaletteOpen(false); }}>
                            <Text style={[mt.palCellTxt, (answered || isCur) && { color: '#fff' }]}>{li + 1}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity style={mt.finishBtn} onPress={() => { setPaletteOpen(false); setShowFinish(true); }} activeOpacity={0.85}>
                <Text style={mt.finishTxt}>🏁 Finish Test</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPaletteOpen(false)}><Text style={mt.closeTxt}>Close</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* finish confirm */}
        <Modal visible={showFinish} transparent animationType="slide" onRequestClose={() => setShowFinish(false)}>
          <View style={mt.modalOv}>
            <View style={mt.sheet}>
              <View style={mt.handle} />
              <Text style={mt.confirmTitle}>Submit Test?</Text>
              <Text style={mt.confirmSub}>You've answered {answeredCount} of {total} questions. Unanswered questions are marked skipped.</Text>
              <TouchableOpacity style={mt.finishBtn} onPress={doSubmit} activeOpacity={0.85}><Text style={mt.finishTxt}>Yes, Submit</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setShowFinish(false)}><Text style={mt.closeTxt}>Continue Test</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* exit confirm (answers will be lost) */}
        <Modal visible={showExit} transparent animationType="slide" onRequestClose={() => setShowExit(false)}>
          <View style={mt.modalOv}>
            <View style={mt.sheet}>
              <View style={mt.handle} />
              <Text style={mt.confirmTitle}>Exit test?</Text>
              <Text style={mt.confirmSub}>Your current answers will be lost.</Text>
              <TouchableOpacity style={mt.exitConfirmBtn} onPress={exitTest} activeOpacity={0.85}>
                <Text style={mt.exitConfirmTxt}>Exit & lose answers</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowExit(false)}><Text style={mt.closeTxt}>Continue Test</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        <View>
          <View style={s.progMeta}>
            <Text style={s.progMetaTxt}>Question <Text style={{ color: C.primary, fontWeight: '800' }}>{current + 1}</Text> of {total}</Text>
            <Text style={s.progMetaMuted}>{status[current] === 'answered' ? '✅ Answered' : status[current] === 'skipped' ? '⏭ Skipped' : '📝 Not Answered'}</Text>
          </View>
          <View style={s.progWrap}><View style={[s.progFill, { width: `${progressPct}%` }]} /></View>
        </View>

        <View style={s.sChips}>
          <View style={[s.sc, { backgroundColor: C.greenLight }]}><Text style={[s.scTxt, { color: C.green }]}>✅ {answeredCount} Answered</Text></View>
          <View style={[s.sc, { backgroundColor: C.yellowLight }]}><Text style={[s.scTxt, { color: C.yellow }]}>⏭ {skippedCount} Skipped</Text></View>
          <View style={[s.sc, { backgroundColor: C.primaryLight }]}><Text style={[s.scTxt, { color: C.primary }]}>📝 {remaining} Remaining</Text></View>
        </View>

        <View style={s.qcard}>
          <View style={s.qcardHead}>
            <Text style={s.qCat}>📌 {q.cat || 'MCQ'}</Text>
            <View style={s.qPts}><Text style={s.qPtsTxt}>+{pointsPerCorrect} Marks</Text></View>
          </View>
          <View style={s.qcardBody}>
            <View style={s.qRow}>
              <Text style={s.qText}>{current + 1}. </Text>
              <View style={{ flex: 1 }}>
                <MathText value={q.question} fontSize={16} color={C.text} />
              </View>
            </View>
            <View style={{ gap: 8 }}>
              {q.options.map((opt, i) => {
                const isSel = sel === i;
                return (
                  <TouchableOpacity key={i} activeOpacity={0.8}
                    style={[s.opt, isSel && s.optSel]} onPress={() => selectOption(i)}>
                    <View style={[s.optLtr, isSel && s.optLtrSel]}>
                      <Text style={[s.optLtrTxt, isSel && { color: '#fff' }]}>{LETTERS[i]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <MathText value={opt} fontSize={15} color={isSel ? C.primary : C.text} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={s.actRow}>
          <TouchableOpacity style={[s.actBtn, { backgroundColor: C.greenLight, borderColor: C.green }]} activeOpacity={0.8} onPress={saveNext}>
            <Text style={[s.actBtnTxt, { color: C.green }]}>✅ Save & Next</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actBtn, { backgroundColor: C.yellowLight, borderColor: C.yellow }]} activeOpacity={0.8} onPress={skip}>
            <Text style={[s.actBtnTxt, { color: C.yellow }]}>⏭ Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.pc, { padding: 14 }]}>
          <Text style={s.palTitle}>QUESTION PALETTE</Text>
          <View style={s.palGrid}>
            {qs.map((_, i) => {
              const st = status[i];
              const isCur = i === current;
              const bg = isCur ? C.primary : st === 'answered' ? C.greenLight : st === 'skipped' ? C.yellowLight : C.bg;
              const bc = isCur ? C.primary : st === 'answered' ? C.green : st === 'skipped' ? C.yellow : C.border;
              const tc = isCur ? '#fff' : st === 'answered' ? C.green : st === 'skipped' ? C.yellow : C.muted;
              return (
                <TouchableOpacity key={i} activeOpacity={0.8}
                  style={[s.pb, { backgroundColor: bg, borderColor: bc }]}
                  onPress={() => setCurrent(i)}>
                  <Text style={[s.pbTxt, { color: tc }]}>{i + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={s.finishBtn} activeOpacity={0.85} onPress={() => setShowFinish(true)}>
          <Text style={s.finishBtnTxt}>🏁 Finish Test</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View style={s.toastWrap} pointerEvents="none">
          <View style={s.toast}><Text style={s.toastTxt}>{toast}</Text></View>
        </View>
      )}

      {/* Finish modal */}
      <Modal visible={showFinish} transparent animationType="slide" onRequestClose={() => setShowFinish(false)}>
        <View style={s.modalOv}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Submit Test?</Text>
            <Text style={s.modalSub}>
              You've answered {answeredCount} out of {total} questions. Unanswered questions will be marked as skipped.
            </Text>
            <View style={{ gap: 8 }}>
              <TouchableOpacity style={s.mbDanger} activeOpacity={0.85} onPress={doSubmit}>
                <Text style={s.mbDangerTxt}>🏁 Yes, Submit Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.mbOut} activeOpacity={0.85} onPress={() => setShowFinish(false)}>
                <Text style={s.mbOutTxt}>← Continue Test</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const PerfRow = ({ label, value, color }) => (
  <View style={{ marginBottom: 10 }}>
    <View style={s.perfLabels}>
      <Text style={s.perfLabel}>{label}</Text>
      <Text style={[s.perfLabel, { color }]}>{value}%</Text>
    </View>
    <View style={s.perfBar}><View style={[s.perfFill, { width: `${value}%`, backgroundColor: color }]} /></View>
  </View>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.white, borderBottomWidth: 1.5, borderBottomColor: C.border, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backArrow: { fontSize: 20, color: C.text, fontWeight: '700' },
  logo: { fontSize: 17, fontWeight: '800', color: C.primary },
  logoAccent: { color: C.accent },
  timerPill: { backgroundColor: C.primaryLight, flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 },
  timerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  timerTxt: { fontSize: 12, fontWeight: '800', color: C.primary },

  hero: { backgroundColor: C.primary, borderRadius: 14, padding: 20 },
  heroTagWrap: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 50, marginBottom: 8 },
  heroTag: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: '#fff' },
  heroTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  heroChip: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 },
  heroChipTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

  pc: { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: C.border },
  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  secBar: { width: 3, height: 16, backgroundColor: C.primary, borderRadius: 4 },
  secTitle: { fontSize: 13, fontWeight: '800', color: C.text },

  markRow: { flexDirection: 'row', gap: 8 },
  mcard: { flex: 1, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  mcardIco: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  mcardLbl: { fontSize: 10, color: C.muted, fontWeight: '600' },
  mcardVal: { fontSize: 16, fontWeight: '800' },

  instrItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  instrNum: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  instrNumTxt: { fontSize: 10, fontWeight: '800', color: C.primary },
  instrTxt: { flex: 1, fontSize: 12, color: '#4A4A60', lineHeight: 18 },

  ctaBtn: { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  ctaBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  noQ: { textAlign: 'center', color: C.muted, fontSize: 12, fontWeight: '600' },

  progMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progMetaTxt: { fontSize: 12, fontWeight: '700', color: C.text },
  progMetaMuted: { fontSize: 11, color: C.muted, fontWeight: '600' },
  progWrap: { backgroundColor: C.border, borderRadius: 50, height: 6, overflow: 'hidden' },
  progFill: { height: 6, backgroundColor: C.primary, borderRadius: 50 },

  sChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  sc: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 50 },
  scTxt: { fontSize: 10, fontWeight: '700' },

  qcard: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden' },
  qcardHead: { backgroundColor: C.primaryLight, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qCat: { fontSize: 11, fontWeight: '700', color: C.primary },
  qPts: { backgroundColor: C.primary, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50 },
  qPtsTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  qcardBody: { padding: 14 },
  qRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  qText: { fontSize: 16, fontWeight: '700', color: C.text, lineHeight: 22 },

  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 2, borderColor: C.border, borderRadius: 10, backgroundColor: C.bg },
  optSel: { borderColor: C.primary, backgroundColor: C.primaryLight },
  optLtr: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  optLtrSel: { backgroundColor: C.primary, borderColor: C.primary },
  optLtrTxt: { fontSize: 10, fontWeight: '800', color: C.muted },
  optTxt: { flex: 1, fontSize: 12, fontWeight: '600', color: C.text },

  actRow: { flexDirection: 'row', gap: 8 },
  actBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  actBtnTxt: { fontSize: 12, fontWeight: '800' },

  palTitle: { fontSize: 10, fontWeight: '700', color: C.muted, marginBottom: 8, letterSpacing: 0.8 },
  palGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pb: { width: 30, height: 30, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pbTxt: { fontSize: 11, fontWeight: '700' },

  finishBtn: { borderWidth: 2, borderColor: C.accent, borderRadius: 50, backgroundColor: C.accentLight, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  finishBtnTxt: { fontSize: 13, fontWeight: '800', color: C.accent },

  toastWrap: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
  toast: { backgroundColor: C.text, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 50 },
  toastTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

  modalOv: { flex: 1, backgroundColor: 'rgba(45,45,58,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 28 },
  modalHandle: { width: 32, height: 3, backgroundColor: C.border, borderRadius: 50, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 6, color: C.text },
  modalSub: { fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 18, lineHeight: 18 },
  mbDanger: { backgroundColor: C.accent, borderRadius: 50, paddingVertical: 13, alignItems: 'center' },
  mbDangerTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  mbOut: { borderWidth: 2, borderColor: C.primary, borderRadius: 50, paddingVertical: 13, alignItems: 'center', backgroundColor: '#fff' },
  mbOutTxt: { color: C.primary, fontSize: 13, fontWeight: '800' },

  resHero: { backgroundColor: C.primary, borderRadius: 14, padding: 20, alignItems: 'center' },
  resEmoji: { fontSize: 40, marginBottom: 6 },
  resTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  resSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginBottom: 14 },
  scoreRing: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 5, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  scoreBig: { fontSize: 26, fontWeight: '800', color: '#fff' },
  scoreOut: { fontSize: 10, color: 'rgba(255,255,255,0.75)' },

  resStats: { flexDirection: 'row', gap: 8 },
  rs: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  rsVal: { fontSize: 22, fontWeight: '800' },
  rsLbl: { fontSize: 10, fontWeight: '700', color: C.muted, marginTop: 2 },

  perfLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  perfLabel: { fontSize: 11, fontWeight: '700', color: C.text },
  perfBar: { height: 8, backgroundColor: C.border, borderRadius: 50, overflow: 'hidden' },
  perfFill: { height: 8, borderRadius: 50 },

  revItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  revRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  revCat: { fontSize: 10, fontWeight: '700', color: C.muted },
  revTag: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 50 },
  revTagTxt: { fontSize: 10, fontWeight: '800' },
  revQ: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 4, lineHeight: 17 },
  revAnsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2 },
  revAns: { fontSize: 11, fontWeight: '700', marginTop: 2 },
});

// ── Sectioned mock-test (teal reference) styles ───────────────────────────────
const TEAL = '#0E9A93';
const TEAL_DARK = '#0B7E78';
const mt = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EEF1F3' },
  accent: { height: 4, backgroundColor: TEAL },
  appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E6EAEA' },
  exitBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#F4F6F6' },
  exitTxt: { fontSize: 13, fontWeight: '800', color: '#6B7B7B' },
  appbarTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', color: '#2D3A3A', marginHorizontal: 8 },
  finishTopBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 18, backgroundColor: TEAL },
  finishTopTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
  finishNext: { backgroundColor: '#1C9D5B' },
  exitConfirmBtn: { backgroundColor: '#E0322E', borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  exitConfirmTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E6EAEA', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  count: { fontSize: 16, fontWeight: '800', color: '#3A4A4A' },
  timer: { fontSize: 16, fontWeight: '800', color: '#3A4A4A' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#EEF1F3' },
  tabOn: { backgroundColor: TEAL },
  tabTxt: { fontSize: 13, fontWeight: '700', color: '#6B7B7B' },
  tabTxtOn: { color: '#fff' },
  instr: { backgroundColor: '#FCEFC7', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 16 },
  instrTxt: { fontSize: 14, fontWeight: '700', color: '#8A6D1F' },
  qText: { fontSize: 16, fontWeight: '600', color: '#3A4A4A', lineHeight: 24, marginBottom: 14 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#E2E8E8', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#fff' },
  optSel: { borderColor: TEAL, backgroundColor: '#E6F4F3' },
  optLtr: { fontSize: 15, fontWeight: '800', color: '#8A9A9A', minWidth: 18 },
  optLtrSel: { color: TEAL },
  optTxt: { flex: 1, fontSize: 15, fontWeight: '600', color: '#3A4A4A' },
  optTxtSel: { color: '#0B5E5A' },
  clearWrap: { alignSelf: 'flex-end', marginTop: 16 },
  clearTxt: { fontSize: 14, fontWeight: '700', color: TEAL },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E6EAEA', paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, gap: 12 },
  prevBtn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#EEF1F3' },
  prevTxt: { fontSize: 14, fontWeight: '700', color: '#6B7B7B' },
  menuBtn: { width: 46, height: 44, borderRadius: 10, backgroundColor: '#EEF1F3', alignItems: 'center', justifyContent: 'center' },
  menuTxt: { fontSize: 18, color: '#3A4A4A' },
  nextBtn: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 10, backgroundColor: TEAL },
  nextTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
  dim: { opacity: 0.45 },

  modalOv: { flex: 1, backgroundColor: 'rgba(20,30,30,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 28 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D5DCDC', alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#3A4A4A', marginBottom: 12, textAlign: 'center' },
  palSec: { fontSize: 12, fontWeight: '800', color: '#6B7B7B', marginBottom: 8, letterSpacing: 0.3 },
  palGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  palCell: { width: 38, height: 38, borderRadius: 9, borderWidth: 1.5, borderColor: '#E2E8E8', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  palAns: { backgroundColor: TEAL, borderColor: TEAL },
  palCur: { backgroundColor: TEAL_DARK, borderColor: TEAL_DARK },
  palCellTxt: { fontSize: 13, fontWeight: '700', color: '#6B7B7B' },
  finishBtn: { backgroundColor: TEAL, borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  finishTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  closeTxt: { textAlign: 'center', color: '#8A9A9A', fontSize: 13, fontWeight: '700', marginTop: 12 },
  confirmTitle: { fontSize: 17, fontWeight: '800', color: '#3A4A4A', textAlign: 'center', marginBottom: 6 },
  confirmSub: { fontSize: 13, color: '#6B7B7B', textAlign: 'center', marginBottom: 16, lineHeight: 19 },
});